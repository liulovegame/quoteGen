import { Button, Upload, Input, Form, App } from "antd";
import { CloudUploadOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import type { IFormData } from "@/types/formData";
import type { RcFile } from "antd/es/upload";

const { TextArea } = Input;

interface Props {
    onDataExtracted?: (data: IFormData) => void;
}

// 验证返回的数据是否符合 IFormData 结构
const validateExtractedData = (data: any): data is IFormData => {
    return data && typeof data === "object";
};

const STORAGE_KEY = "customer_info_cache";

export default function LeftUploadSection({ onDataExtracted }: Props) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const { message } = App.useApp();
    const [fileList, setFileList] = useState<RcFile[]>([]);

    // 从 localStorage 加载缓存的文本
    useEffect(() => {
        const cachedText = localStorage.getItem(STORAGE_KEY);
        if (cachedText) {
            form.setFieldValue("customerInfo", cachedText);
        }
    }, [form]);

    // 监听文本变化并保存到 localStorage
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        localStorage.setItem(STORAGE_KEY, text);
    };

    const handleExtract = async () => {
        try {
            const manualText = form.getFieldValue("customerInfo");

            // 检查是否至少有一种输入方式
            if (!manualText && fileList.length === 0) {
                message.warning("请输入客户信息或上传图片");
                return;
            }

            setLoading(true);

            let finalText = manualText || "";

            // 如果有上传图片，处理 OCR 识别
            if (fileList.length > 0) {
                // 处理所有图片的 OCR 识别
                const ocrResults = await Promise.all(
                    fileList.map(async (file) => {
                        try {
                            const formData = new FormData();
                            formData.append("file", file);

                            const response = await fetch("/api/ocr/text", {
                                method: "POST",
                                body: formData,
                            });

                            if (!response.ok) {
                                throw new Error(`OCR 识别失败: ${file.name}`);
                            }

                            const result = await response.json();
                            return result.data.content || "";
                        } catch (error) {
                            console.error(`Error processing file ${file.name}:`, error);
                            return "";
                        }
                    })
                );

                // 合并所有 OCR 结果
                const combinedText = ocrResults.filter((text) => text).join("\n");

                // 合并手动输入和 OCR 结果
                finalText = [finalText, combinedText].filter((text) => text).join("\n");
            }

            if (!finalText) {
                throw new Error("未能提取到有效文本");
            }

            // 调用数据提取接口
            const extractResponse = await fetch("/api/extract", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text: finalText }),
            });

            if (!extractResponse.ok) {
                throw new Error("提取数据失败，请重试");
            }

            const data = await extractResponse.json();

            // 验证返回的数据结构
            if (!validateExtractedData(data)) {
                throw new Error("数据格式不正确");
            }

            // 调用回调函数更新主表单
            onDataExtracted?.(data);
            message.success("数据提取成功");

            // 清空当前文本框和文件列表
            form.resetFields();
            setFileList([]);
        } catch (error) {
            console.error("Error extracting data:", error);
            message.error(error instanceof Error ? error.message : "提取数据失败，请重试");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-80 space-y-4 bg-white">
            <div className="p-4 rounded-lg">
                <Form form={form}>
                    <h3 className="text-base font-medium mb-3">客户信息录入</h3>
                    <Form.Item name="customerInfo">
                        <TextArea 
                            rows={7} 
                            placeholder="请输入客户信息" 
                            onChange={handleTextChange}
                        />
                    </Form.Item>
                    <h3 className="text-base font-medium mb-3">上传图片</h3>
                    <Upload.Dragger
                        accept="image/*"
                        multiple={true}
                        showUploadList={true}
                        maxCount={10}
                        className="bg-gray-50"
                        beforeUpload={(file) => {
                            setFileList((prev) => [...prev, file]);
                            return false; // 阻止自动上传
                        }}
                        onRemove={(file) => {
                            setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
                            return true;
                        }}
                        fileList={fileList}
                    >
                        <p className="text-gray-600">
                            <CloudUploadOutlined className="text-2xl mb-2" />
                        </p>
                        <p className="text-gray-500 text-sm">点击或拖拽上传文件(支持多选)</p>
                    </Upload.Dragger>
                    <div className="mt-3 text-xs text-gray-400">支持：行驶证、保单、身份证等相关照片</div>
                    <Button className="mt-4" type="primary" block loading={loading} onClick={handleExtract}>
                        提取数据
                    </Button>
                </Form>
                <div className="mt-4">
                    <div className="text-sm text-gray-600">提示与说明：</div>
                    <ul className="text-sm text-gray-500 list-disc pl-4 space-y-1">
                        <li>您可以上传行驶证、保单、身份证等相关照片</li>
                        <li>支持从图片中识别文字并转化为规范文档信息</li>
                        <li>系统会智能匹配和识别各类标准格式的车辆信息</li>
                        <li>提取后的数据可以手动编辑修正</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
