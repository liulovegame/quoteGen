import { Form, InputNumber, Select, DatePicker } from "antd";
import { vehicleTypes } from "@/constants/vehicleTypes";
import { useState } from "react";
import { IFormData } from "@/types/formData";

// 计算车损服务的限额和费用
const calculateVehicleLoss = (
    guidePrice: number = 0,
    depreciationRate: number = 0,
    usageMonths: number = 0,
    feeRate: number = 0
) => {
    // 将百分比转换为小数
    const depreciationDecimal = depreciationRate / 100;
    const feeDecimal = feeRate / 100;

    // 计算限额：新车指导价 * (1 - 月折旧率 * 使用月数)
    const limit = guidePrice * (1 - depreciationDecimal * usageMonths);
    // 计算费用：限额 * 费率
    const fee = limit * feeDecimal;
    return { limit: limit.toFixed(2), fee: fee.toFixed(2) };
};

// 计算乘客统筹服务的限额和费用
const calculatePassengerService = (amount: number = 0, passengerCapacity: number = 0, feeRate: number = 0) => {
    // passengerLiabilityAmount * (approvedPassengerCapacity-1)
    const passengerCount = Math.max(0, passengerCapacity - 1);
    const limit = amount * passengerCount;
    const fee = feeRate * passengerCount;
    return { limit, fee };
};

const VehicleInfo: React.FC = () => {
    const form = Form.useFormInstance();
    const [typeOptions, setTypeOptions] = useState<{ label: string; value: string }[]>([]);

    // 查询服务数据
    const queryServiceData = async (nature: string, type: string) => {
        try {
            const currentFormData = form.getFieldsValue(true) as IFormData;
            const vehicle = currentFormData.vehicle || {};

            // 查询车损服务
            const damageResponse = await fetch("/api/teable/damage", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nature,
                    type,
                }),
            });
            const damageData = await damageResponse.json();

            // 查询第三者责任服务
            const thirdPartyResponse = await fetch("/api/teable/third-party", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nature,
                    type,
                    amount: currentFormData.thirdPartyLiabilityAmount,
                }),
            });
            const thirdPartyData = await thirdPartyResponse.json();

            // 查询司机统筹服务
            const driverResponse = await fetch("/api/teable/driver", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    category: "司机统筹",
                    nature,
                    type,
                    amount: currentFormData.driverLiabilityAmount,
                }),
            });
            const driverData = await driverResponse.json();

            // 查询乘客统筹服务
            const passengerResponse = await fetch("/api/teable/driver", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    category: "乘客统筹",
                    nature,
                    type,
                    amount: currentFormData.passengerLiabilityAmount,
                }),
            });
            const passengerData = await passengerResponse.json();

            // 查询医保外用药责任服务
            const medicalResponse = await fetch("/api/teable/medical", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    amount: currentFormData.nonMedicalInsuranceDrugAmount,
                }),
            });
            const medicalData = await medicalResponse.json();

            // 更新表单数据
            const currentServices = form.getFieldValue("services") || {};
            const depreciationRate = damageData.data?.[0]?.depreciationRate || 0;
            // 车损服务费率
            const feeRate = damageData.data?.[0]?.fee || 0;

            // 计算各项服务的限额和费用
            const vehicleLoss = calculateVehicleLoss(
                vehicle.guidePrice,
                depreciationRate,
                vehicle.usageMonths,
                feeRate
            );

            const passenger = calculatePassengerService(
                currentFormData.passengerLiabilityAmount,
                currentFormData.approvedPassengerCapacity,
                passengerData.data?.[0]?.fee
            );

            // 先更新折旧率
            form.setFieldValue(["vehicle", "depreciationRate"], depreciationRate);;

            // 再更新服务数据
            const services: IFormData["services"] = {
                ...currentServices,
                // 机动车损失服务
                damage: {
                    limit: vehicleLoss.limit,
                    fee: vehicleLoss.fee,
                },
                // 第三者责任服务
                third_party: {
                    limit: currentFormData.thirdPartyLiabilityAmount || 0,
                    fee: thirdPartyData.data?.[0]?.fee || 0,
                },
                // 车上人员责任服务（驾驶员）
                theft: {
                    limit: currentFormData.driverLiabilityAmount || 0,
                    fee: driverData.data?.[0]?.fee || 0,
                },
                // 车上人员责任服务（乘客）
                driver: {
                    limit: passenger.limit,
                    fee: passenger.fee,
                },
                // 医保外用药责任服务
                medical: {
                    limit: currentFormData.nonMedicalInsuranceDrugAmount || 0,
                    fee: medicalData.data?.[0]?.fee || 0,
                },
            };

            form.setFieldValue("services", services);

            // 计算标准服务费合计
            const totalStandardFee = Object.values(services)
                .reduce((total: number, service) => {
                    return total + Number(service.fee || 0);
                }, 0)
                .toFixed(2);

            // 计算实收服务费
            const discount = 0.5;
            const actualFee = (Number(totalStandardFee) * discount).toFixed(2);

            // 更新标准服务费合计和实收服务费
            form.setFieldsValue({
                totalStandardFee,
                actualFee,
                discount,
                damageFee: feeRate
            });
        } catch (error) {
            console.error("查询服务数据失败:", error);
        }
    };

    // 处理车辆性质变化
    const handleNatureChange = (value: string) => {
        // 根据选择的车辆性质更新车辆种类选项
        const selectedType = vehicleTypes.find((item) => item.value === value);
        setTypeOptions(selectedType?.children || []);
        form.setFieldsValue({
            vehicle: {
                ...form.getFieldValue("vehicle"),
                type: undefined,
            },
        });
    };

    // 处理车辆种类变化
    const handleTypeChange = (value: string) => {
        const nature = form.getFieldValue(["vehicle", "nature"]);

        // 如果车辆性质和种类都有值，查询服务数据
        if (nature && value) {
            queryServiceData(nature, value);
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium mb-6">车辆信息</h3>
            <div className="[&_.ant-form-item-label]:!w-20 [&_.ant-form-item]:!mb-5 [&_.ant-form-item-required]:before:!content-['']">
                <Form.Item
                    label="车辆性质"
                    name={["vehicle", "nature"]}
                    rules={[{ required: true, message: "请选择车辆性质" }]}
                >
                    <Select placeholder="选择车辆性质" options={vehicleTypes} onChange={handleNatureChange} />
                </Form.Item>

                {form.getFieldValue(["vehicle", "nature"]) && (
                    <Form.Item
                        label="车辆种类"
                        name={["vehicle", "type"]}
                        rules={[{ required: true, message: "请选择车辆种类" }]}
                    >
                        <Select placeholder="选择车辆种类" options={typeOptions} onChange={handleTypeChange} />
                    </Form.Item>
                )}

                <Form.Item
                    label="商业到期"
                    name="commercialInsuranceExpiryDate"
                    rules={[{ required: true, message: "请选择商业到期日期" }]}
                >
                    <DatePicker placeholder="选择日期" className="!w-full" />
                </Form.Item>

                <Form.Item label="出险次数" name="claimCount" rules={[{ required: true, message: "请输入出险次数" }]}>
                    <InputNumber
                        className="!w-full"
                        min={0}
                        controls={false}
                        suffix={<span className="ml-2 text-gray-500">次</span>}
                    />
                </Form.Item>

                <Form.Item label="使用月数" name={["vehicle", "usageMonths"]}>
                    <InputNumber
                        className="!w-full"
                        min={0}
                        controls={false}
                        suffix={<span className="ml-2 text-gray-500">月</span>}
                    />
                </Form.Item>

                <Form.Item label="新车指导价" name={["vehicle", "guidePrice"]}>
                    <InputNumber
                        className="!w-full"
                        min={0}
                        controls={false}
                        suffix={<span className="ml-2 text-gray-500">元</span>}
                    />
                </Form.Item>

                <Form.Item label="月折旧率" name={["vehicle", "depreciationRate"]}>
                    <InputNumber
                        className="!w-full"
                        min={0}
                        controls={false}
                        suffix={<span className="ml-2 text-gray-500">%</span>}
                    />
                </Form.Item>
            </div>
        </div>
    );
};

export default VehicleInfo;
