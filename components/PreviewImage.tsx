import { Button, Image, message, Space, Modal, Form } from "antd";
import html2canvas from "html2canvas-pro";
import { useRef, useState } from "react";

const PreviewImage = () => {
    const form = Form.useFormInstance();
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const generatePreview = async () => {
        try {
            // 先进行表单校验
            await form.validateFields();
        } catch (error) {
            message.error("请填写必填项");
            return null;
        }

        if (!document.querySelector("#main-quote")) {
            message.error("获取内容失败");
            return null;
        }

        try {
            // 在生成预览前，给所有 input 和 textarea 添加特殊样式
            const inputs = document.querySelectorAll('#main-quote input, #main-quote textarea');
            inputs.forEach(input => {
                const value = (input as HTMLInputElement | HTMLTextAreaElement).value;
                input.setAttribute('data-html2canvas-value', value);
                (input as HTMLElement).style.color = 'transparent';
            });

            const canvas = await html2canvas(document.querySelector("#main-quote")!, {
                scale: 2, // 提高清晰度
                useCORS: true, // 允许跨域图片
                logging: false, // 关闭日志
                backgroundColor: "#ffffff", // 设置背景色
                allowTaint: true, // 允许跨域图片
                onclone: (documentClone) => {
                    // 在克隆的文档中处理 input 和 textarea 元素
                    const clonedInputs = documentClone.querySelectorAll('input, textarea');
                    clonedInputs.forEach((element) => {
                        const value = element.getAttribute('data-html2canvas-value') || '';
                        const div = documentClone.createElement('div');
                        
                        // 处理换行符
                        if (element.tagName.toLowerCase() === 'textarea') {
                            // 将换行符转换为 <br> 标签
                            div.innerHTML = value.replace(/\n/g, '<br>');
                            div.style.whiteSpace = 'pre-wrap';
                            div.style.wordBreak = 'break-word';
                            div.style.minHeight = window.getComputedStyle(element).height;
                        } else {
                            div.textContent = value;
                            div.style.whiteSpace = 'nowrap';
                        }

                        div.style.cssText = window.getComputedStyle(element).cssText;
                        div.style.color = 'black';
                        div.style.backgroundColor = 'transparent';
                        div.style.border = 'none';
                        div.style.overflow = 'visible';
                        element.parentNode?.replaceChild(div, element);
                    });
                },
                ignoreElements: (element) => {
                    // 忽略不需要的元素
                    const ignoreClasses = [
                        "preview-image-container",
                        "layout-form-right", // 忽略所有按钮
                    ];

                    // 检查元素是否包含需要忽略的类名
                    return ignoreClasses.some((className) => element.classList.contains(className));
                },
            });

            // 恢复 input 的样式
            inputs.forEach(input => {
                input.removeAttribute('data-html2canvas-value');
                (input as HTMLElement).style.color = '';
            });

            // 保存 canvas 引用以供下载使用
            canvasRef.current = canvas;
            return canvas.toDataURL("image/png", 1.0);
        } catch (error) {
            console.error("Preview generation failed:", error);
            message.error("生成预览图失败");
            return null;
        }
    };

    const handlePreview = async () => {
        try {
            setLoading(true);
            const url = await generatePreview();
            if (url) {
                setPreviewUrl(url);
                setIsModalOpen(true);
            }
        } catch (error) {
            console.error("Preview generation failed:", error);
            message.error("生成预览图失败");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        try {
            setLoading(true);
            
            // 如果没有预览或 canvas，重新生成
            if (!previewUrl || !canvasRef.current) {
                const url = await generatePreview();
                if (!url) return;
                setPreviewUrl(url);
            }

            if (canvasRef.current) {
                // 使用 canvas 直接下载，而不是通过 dataURL
                canvasRef.current.toBlob((blob) => {
                    if (!blob) {
                        message.error("生成图片失败");
                        return;
                    }
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.download = `报价单_${new Date().toLocaleDateString()}.png`;
                    link.href = url;
                    link.click();
                    // 清理 URL 对象
                    setTimeout(() => URL.revokeObjectURL(url), 100);
                }, "image/png", 1.0);
            }
        } catch (error) {
            console.error("Download failed:", error);
            message.error("下载失败");
        } finally {
            setLoading(false);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setPreviewUrl("");
    };
    

    return (
        <div className="text-right preview-image-container">
            <Space>
                <Button type="primary" onClick={handleDownload} loading={loading && !previewUrl}>
                    下载
                </Button>
                <Button type="primary" onClick={handlePreview} loading={loading && previewUrl === ""}>
                    预览
                </Button>
            </Space>
            <Modal
                title="报价单预览"
                open={isModalOpen}
                onCancel={handleModalClose}
                footer={[
                    <Button key="download" type="primary" onClick={handleDownload}>
                        下载
                    </Button>,
                    <Button key="close" onClick={handleModalClose}>
                        关闭
                    </Button>,
                ]}
                width="80%"
                centered
            >
                {previewUrl && (
                    <div className="text-center">
                        <Image
                            src={previewUrl}
                            alt="预览图"
                            className="max-w-full border border-gray-200"
                            style={{ maxHeight: "calc(90vh - 200px)" }}
                            preview={false}
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PreviewImage;
