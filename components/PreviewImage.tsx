import { Button, Image, message, Space, Modal, Form } from "antd";
import html2canvas from "html2canvas-pro";
import { useRef, useState, useEffect } from "react";

const PreviewImage = () => {
    const form = Form.useFormInstance();
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const watermarkImageRef = useRef<HTMLImageElement | null>(null);

    // 预加载水印图片
    useEffect(() => {
        const img = document.createElement('img');
        img.src = "/insurance-bg.jpeg"; // 使用你的水印图片路径
        img.onload = () => {
            watermarkImageRef.current = img;
        };
    }, []);

    // A4 尺寸（像素）
    const A4_WIDTH = 794; // 210mm * 3.78px/mm
    const A4_HEIGHT = 1123; // 297mm * 3.78px/mm

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
            const inputs = document.querySelectorAll("#main-quote input, #main-quote textarea");
            inputs.forEach((input) => {
                const value = (input as HTMLInputElement | HTMLTextAreaElement).value;
                input.setAttribute("data-html2canvas-value", value);
                (input as HTMLElement).style.color = "transparent";
            });

            // 先生成高质量图片
            const originalCanvas = await html2canvas(document.querySelector("#main-quote")!, {
                scale: 2, // 提高清晰度
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                allowTaint: true,
                onclone: (documentClone) => {
                    // 在克隆的文档中处理 input 和 textarea 元素
                    const clonedInputs = documentClone.querySelectorAll("input, textarea");
                    clonedInputs.forEach((element) => {
                        const value = element.getAttribute("data-html2canvas-value") || "";
                        const div = documentClone.createElement("div");

                        if (element.tagName.toLowerCase() === "textarea") {
                            div.innerHTML = value.replace(/\n/g, "<br>");
                            div.style.whiteSpace = "pre-wrap";
                            div.style.wordBreak = "break-word";
                            div.style.minHeight = window.getComputedStyle(element).height;
                        } else {
                            div.textContent = value;
                            div.style.whiteSpace = "nowrap";
                        }

                        div.style.cssText = window.getComputedStyle(element).cssText;
                        div.style.color = "black";
                        div.style.backgroundColor = "transparent";
                        div.style.border = "none";
                        div.style.overflow = "visible";
                        element.parentNode?.replaceChild(div, element);
                    });
                },
                ignoreElements: (element) => {
                    const ignoreClasses = ["preview-image-container", "layout-form-right"];
                    return ignoreClasses.some((className) => element.classList.contains(className));
                },
            });

            // 恢复 input 的样式
            inputs.forEach((input) => {
                input.removeAttribute("data-html2canvas-value");
                (input as HTMLElement).style.color = "";
            });

            // 创建 A4 大小的画布
            const a4Canvas = document.createElement("canvas");
            const a4Ctx = a4Canvas.getContext("2d");
            if (!a4Ctx) throw new Error("Failed to get canvas context");

            // 设置 A4 尺寸
            a4Canvas.width = A4_WIDTH;
            a4Canvas.height = A4_HEIGHT;

            // 填充白色背景
            a4Ctx.fillStyle = "#ffffff";
            a4Ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

            // 计算缩放比例以适应 A4 纸张宽度
            const scale = (A4_WIDTH - 40) / originalCanvas.width; // 留出左右各 20px 的边距
            const scaledWidth = originalCanvas.width * scale;
            const scaledHeight = originalCanvas.height * scale;

            // 计算位置 - 水平居中，从顶部开始
            const x = (A4_WIDTH - scaledWidth) / 2; // 水平居中
            const y = 30; // 上边距保持 30px

            // 绘制缩放后的图片
            a4Ctx.drawImage(originalCanvas, x, y, scaledWidth, scaledHeight);

            // 添加水印
            if (watermarkImageRef.current) {
                a4Ctx.save();
                
                // 设置水印样式
                a4Ctx.globalAlpha = 0.1; // 设置透明度
                
                // 计算水印大小（设置为页面宽度的60%）
                const watermarkWidth = A4_WIDTH * 0.6;
                const aspectRatio = watermarkImageRef.current.height / watermarkImageRef.current.width;
                const watermarkHeight = watermarkWidth * aspectRatio;
                
                // 计算水印位置（水平居中，垂直位置在1/3处）
                const watermarkX = (A4_WIDTH - watermarkWidth) / 2;
                const watermarkY = A4_HEIGHT * 0.36 - watermarkHeight / 2;
                
                // 绘制水印
                a4Ctx.drawImage(
                    watermarkImageRef.current,
                    watermarkX,
                    watermarkY,
                    watermarkWidth,
                    watermarkHeight
                );
                
                // 恢复画布状态
                a4Ctx.restore();
            }

            // 保存 canvas 引用以供下载使用
            canvasRef.current = a4Canvas;
            return a4Canvas.toDataURL("image/png", 1.0);
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

    const handleReset = () => {
        Modal.confirm({
            title: "确认清空",
            content: "确定要清空所有数据吗？此操作不可恢复。",
            okText: "确定",
            cancelText: "取消",
            okButtonProps: { danger: true },
            onOk: () => {
                form.resetFields();
                setPreviewUrl("");
                setIsModalOpen(false);
                message.success("表单已重置");
            },
        });
    };
    
    const handleDownload = async () => {
        try {
            setLoading(true);
            const url = await generatePreview();
            if (!url) return;

            if (canvasRef.current) {
                canvasRef.current.toBlob(
                    (blob) => {
                        if (!blob) {
                            message.error("生成图片失败");
                            return;
                        }
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.download = `报价单_${new Date().toLocaleDateString()}.png`;
                        link.href = url;
                        link.click();
                        setTimeout(() => URL.revokeObjectURL(url), 100);
                    },
                    "image/png",
                    1.0
                );
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
                <Button type="primary" danger onClick={handleReset}>
                    清空数据
                </Button>
                <Button type="primary" onClick={handleDownload} loading={loading}>
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
