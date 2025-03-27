import { Button, Image, message, Space, Modal, Form } from "antd";
import html2canvas from "html2canvas-pro";
import { useRef, useState, useEffect } from "react";
import { STORAGE_KEY, STORAGE_KEY_OCR } from "./LeftUploadSection";

const PreviewImage = () => {
    const form = Form.useFormInstance();
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentQuoteNumber, setCurrentQuoteNumber] = useState<string>("");
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const watermarkImageRef = useRef<HTMLImageElement | null>(null);

    // 转换表单数据为数据库格式
    const transformFormData = (formData: any) => {
        const userStr = localStorage.getItem("quote_user");
        let email = "";
        const customer_info = localStorage.getItem(STORAGE_KEY) || "";
        const ocr_info = localStorage.getItem(STORAGE_KEY_OCR) || "";
        if (userStr) {
            const user = JSON.parse(userStr);
            email = user.email || "";
        }
        const {
            services,
            vehicle,
            insurance,
            quote_number,
            insuredName,
            licensePlateNumber,
            engineNumber,
            vinNumber,
            vehicleModel,
            firstRegistrationDate,
            approvedLoadWeight,
            approvedPassengerCapacity,
            vehicleType,
            usageType,
            insuranceStartDate,
            insuranceEndDate,
            commercialInsuranceExpiryDate,
            claimCount,
            discount,
            actualFee,
            totalStandardFee,
            nonMedicalInsuranceDrugAmount,
            driverLiabilityAmount,
            passengerLiabilityAmount,
            thirdPartyLiabilityAmount,
            damageFee,
            ...rest
        } = formData;

        // 转换服务费用数据
        const transformedServices = Object.entries(services || {}).map(([type, data]: [string, any]) => ({
            service_type: type,
            limit_amount: data.limit,
            fee: data.fee,
        }));

        // 转换日期格式
        const transformedData = {
            quote_number,
            insured_name: insuredName,
            license_plate_number: licensePlateNumber,
            engine_number: engineNumber,
            vin_number: vinNumber,
            vehicle_model: vehicleModel,
            first_registration_date: firstRegistrationDate?.format("YYYY-MM-DD"),
            approved_load_weight: approvedLoadWeight,
            approved_passenger_capacity: approvedPassengerCapacity,
            vehicle_type: vehicleType,
            usage_type: usageType,
            insurance_start_date: insuranceStartDate?.format("YYYY-MM-DD"),
            insurance_end_date: insuranceEndDate?.format("YYYY-MM-DD"),
            commercial_insurance_expiry_date: commercialInsuranceExpiryDate?.format("YYYY-MM-DD"),
            claim_count: claimCount,
            discount: discount,
            actual_fee: actualFee,
            total_standard_fee: totalStandardFee,
            vehicle_nature: vehicle?.nature,
            vehicle_sub_type: vehicle?.type,
            usage_months: vehicle?.usageMonths,
            guide_price: vehicle?.guidePrice,
            depreciation_rate: vehicle?.depreciationRate,
            insurance_services: Object.entries(insurance || {})
                .filter(([_, value]) => value)
                .map(([key]) => key),
            non_medical_insurance_drug_amount: nonMedicalInsuranceDrugAmount,
            driver_liability_amount: driverLiabilityAmount,
            passenger_liability_amount: passengerLiabilityAmount,
            third_party_liability_amount: thirdPartyLiabilityAmount,
            damage_fee: damageFee,
            email,
            ocr_info,
            customer_info,
        };

        return {
            ...transformedData,

            services: transformedServices,
        };
    };

    // 重试函数
    const retry = async (fn: () => Promise<any>, retries = 3, delay = 1000) => {
        try {
            return await fn();
        } catch (error) {
            if (retries === 0) throw error;
            await new Promise((resolve) => setTimeout(resolve, delay));
            return retry(fn, retries - 1, delay);
        }
    };

    // 保存或更新报价单
    const saveQuote = async (formData: any) => {
        try {
            const quoteNumber = formData.quote_number;
            const action = quoteNumber === currentQuoteNumber ? "update" : "create";

            // 转换表单数据为数据库格式
            const transformedData = transformFormData(formData);

            const saveOperation = async () => {
                const response = await fetch("/api/supabase/quotes", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        action,
                        data: transformedData,
                        quote_number: quoteNumber,
                    }),
                });
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.message || "保存失败");
                }
                return result;
            };

            // 使用重试机制执行保存操作
            const result = await retry(saveOperation);
            setCurrentQuoteNumber(quoteNumber);
            return result;
        } catch (error) {
            console.error("Error saving quote:", error);
            throw error;
        }
    };

    // 预加载水印图片
    useEffect(() => {
        const img = document.createElement("img");
        img.src = "/insurance-bg.jpeg"; // 使用你的水印图片路径
        img.onload = () => {
            watermarkImageRef.current = img;
        };
    }, []);

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
                imageTimeout: 0,
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

                        // 获取计算后的样式
                        const computedStyle = window.getComputedStyle(element);

                        // 复制所有相关样式
                        div.style.cssText = `
                            ${computedStyle.cssText}
                            color: black;
                            background-color: transparent;
                            border: none;
                            overflow: visible;
                            text-align: ${computedStyle.textAlign};
                            padding: ${computedStyle.padding};
                            margin: ${computedStyle.margin};
                            width: ${computedStyle.width};
                            height: ${computedStyle.height};
                            line-height: ${computedStyle.lineHeight};
                            font-size: ${computedStyle.fontSize};
                            font-family: ${computedStyle.fontFamily};
                            display: ${computedStyle.display};
                            position: ${computedStyle.position};
                            box-sizing: ${computedStyle.boxSizing};
                        `;

                        // 确保文本对齐方式正确
                        if (computedStyle.textAlign === "center") {
                            div.style.textAlign = "center";
                        }

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

            // 保存 canvas 引用以供下载使用
            canvasRef.current = originalCanvas;
            
            // 创建临时画布用于添加水印
            const tempCanvas = document.createElement("canvas");
            const tempCtx = tempCanvas.getContext("2d");
            if (!tempCtx) throw new Error("Failed to get temp canvas context");

            // 设置临时画布尺寸与原始画布相同
            tempCanvas.width = originalCanvas.width;
            tempCanvas.height = originalCanvas.height;

            // 绘制原始画布内容
            tempCtx.drawImage(originalCanvas, 0, 0);

            // 添加水印
            if (watermarkImageRef.current) {
                tempCtx.save();
                
                // 设置水印透明度
                tempCtx.globalAlpha = 0.1;

                // 计算水印大小（设置为画布宽度的60%）
                const watermarkWidth = tempCanvas.width * 0.6;
                const aspectRatio = watermarkImageRef.current.height / watermarkImageRef.current.width;
                const watermarkHeight = watermarkWidth * aspectRatio;

                // 计算水印位置（水平居中，垂直位置在1/2处）
                const watermarkX = (tempCanvas.width - watermarkWidth) / 2;
                const watermarkY = tempCanvas.height * 0.4 - watermarkHeight / 2;

                // 绘制水印
                tempCtx.drawImage(watermarkImageRef.current, watermarkX, watermarkY, watermarkWidth, watermarkHeight);

                // 恢复画布状态
                tempCtx.restore();
            }

            // 更新 canvasRef 为添加了水印的画布
            canvasRef.current = tempCanvas;
            return tempCanvas.toDataURL("image/png", 1.0);
        } catch (error) {
            console.error("Preview generation failed:", error);
            message.error("生成预览图失败");
            return null;
        }
    };

    const handlePreview = async () => {
        try {
            setLoading(true);
            // 生成预览图
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

    const handleGenerate = async () => {
        try {
            if (saveLoading) return;
            setSaveLoading(true);
            // 保存报价单数据
            const formData = form.getFieldsValue(true);
            saveQuote(formData).then();
        } catch (error) {
            console.error("Save failed:", error);
        } finally {
            setSaveLoading(false);
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
                setCurrentQuoteNumber("");
                message.success("表单已重置");
            },
        });
    };

    const handleDownload = async () => {
        try {
            setLoading(true);
            // 保存报价单数据
            const formData = form.getFieldsValue(true);
            saveQuote(formData).then();

            // 生成预览图
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
                        link.download = `报价单_${formData.quote_number || new Date().toLocaleDateString()}.png`;
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
        handleGenerate();
    };

    const handleCopy = async () => {
        try {
            if (!canvasRef.current) {
                message.error("图片未生成");
                return;
            }

            // 将 canvas 转换为 blob
            const blob = await new Promise<Blob>((resolve) => {
                canvasRef.current?.toBlob((blob) => {
                    if (blob) resolve(blob);
                }, "image/png");
            });

            // 创建 ClipboardItem
            const clipboardItem = new ClipboardItem({
                "image/png": blob,
            });

            // 写入剪贴板
            await navigator.clipboard.write([clipboardItem]);
            message.success("复制成功");
        } catch (error) {
            console.error("Copy failed:", error);
            message.error("复制失败");
        }
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
                    <Button key="copy" type="primary" onClick={handleCopy}>
                        复制到剪贴板
                    </Button>,
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
