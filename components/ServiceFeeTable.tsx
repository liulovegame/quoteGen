import { Table, Form, Input, Space, Select } from "antd";
import { IFormData } from "@/types/formData";
import { insuranceLimits } from "@/constants/insuranceLimits";

interface ServiceFeeTableProps {
    dataSource: Array<{
        key: string;
        name: string;
    }>;
}

// 可修改的服务项目
const CHANGE_KEYS = ["damage", "third_party", "theft", "driver", "medical"];

// 可选择的服务项目
const SELECT_KEYS = ["third_party", "theft", "driver", "medical"];

const ServiceFeeTable: React.FC<ServiceFeeTableProps> = ({ dataSource }) => {
    const form = Form.useFormInstance();
    const passengerCapacity = Form.useWatch("approvedPassengerCapacity", form);

    // 计算服务费
    const calculateServiceFees = () => {
        const services: IFormData["services"] = form.getFieldValue("services") || {};
        const validServiceKeys = dataSource.map((item) => item.key);

        // 计算标准服务费合计
        const totalStandardFee = Object.entries(services)
            .filter(([key]) => validServiceKeys.includes(key))
            .reduce((total: number, [_, service]) => {
                return total + Number(service.fee || 0);
            }, 0)
            .toFixed(2);

        // 计算实收服务费
        const discount = form.getFieldValue("discount") || 0.5;
        const actualFee = (Number(totalStandardFee) * discount).toFixed(2);

        form.setFieldValue("totalStandardFee", totalStandardFee);
        form.setFieldValue("actualFee", actualFee);
    };

    // 查询服务数据
    const queryServiceData = async (serviceType: string, value: string) => {
        try {
            const currentFormData = form.getFieldsValue(true) as IFormData;
            const vehicle = currentFormData.vehicle || {};

            let response;

            switch (serviceType) {
                case "damage":
                    response = await fetch("/api/teable/damage", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            nature: vehicle.nature,
                            type: vehicle.type,
                        }),
                    });
                    break;

                case "third_party":
                    response = await fetch("/api/teable/third-party", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            nature: vehicle.nature,
                            type: vehicle.type,
                            amount: Number(value),
                        }),
                    });
                    break;

                case "theft":
                    response = await fetch("/api/teable/driver", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            category: "司机统筹",
                            nature: vehicle.nature,
                            type: vehicle.type,
                            amount: Number(value),
                        }),
                    });
                    break;

                case "driver":
                    response = await fetch("/api/teable/driver", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            category: "乘客统筹",
                            nature: vehicle.nature,
                            type: vehicle.type,
                            amount: Number(value),
                        }),
                    });
                    break;

                case "medical":
                    response = await fetch("/api/teable/medical", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            amount: Number(value),
                        }),
                    });
                    break;
            }

            if (response) {
                const data = await response.json();
                if (data.success && data.data?.[0]) {
                    const fee = data.data[0].fee;
                    form.setFieldValue(["services", serviceType, "fee"], fee);
                    calculateServiceFees();
                }
            }
        } catch (error) {
            console.error("查询服务数据失败:", error);
        }
    };

    // 处理输入变化
    const handleInputChange = (serviceType: string, value: string) => {
        if (CHANGE_KEYS.includes(serviceType)) {
            if (serviceType === "damage") {
                const currentFormData = form.getFieldsValue(true) as IFormData;
                const limit = Number(value) || 0;
                const services = currentFormData.services || {};

                // 计算标准服务费
                const standardFee = limit * ((currentFormData.damageFee || 1) / 100);
                form.setFieldValue(["services", serviceType, "fee"], standardFee.toFixed(2));
                calculateServiceFees();
            } else {
                queryServiceData(serviceType, value);
            }
        }
    };

    return (
        <Table
            size="small"
            bordered
            columns={[
                {
                    title: "服务项目名称",
                    dataIndex: "name",
                    width: "40%",
                    onCell: () => ({
                        className: "text-gray-700",
                    }),
                },
                {
                    title: "服务限额（元）",
                    dataIndex: "limit",
                    width: "30%",
                    align: "center",
                    render: (_, record) => (
                        <Space.Compact className="items-center w-full">
                            <Form.Item className="w-full" noStyle name={["services", record.key, "limit"]}>
                                {SELECT_KEYS.includes(record.key) ? (
                                    <Select
                                        placeholder="请选择"
                                        variant="borderless"
                                        className="w-full"
                                        suffixIcon={null}
                                        onChange={(value) => handleInputChange(record.key, value.toString())}
                                        options={insuranceLimits
                                            .find((item) => item.key === record.key)
                                            ?.limits.map((limit) => ({
                                                label: limit,
                                                value: limit,
                                            }))}
                                    />
                                ) : (
                                    <Input
                                        placeholder="请输入"
                                        variant="borderless"
                                        className="text-center"
                                        onChange={(e) => handleInputChange(record.key, e.target.value)}
                                    />
                                )}
                            </Form.Item>
                            {record.key === "driver" && passengerCapacity && (
                                <span className="w-20">*{passengerCapacity - 1}座</span>
                            )}
                        </Space.Compact>
                    ),
                },
                {
                    title: "标准服务费（元）",
                    dataIndex: "fee",
                    align: "center",
                    width: "30%",
                    render: (_, record) => (
                        <Form.Item noStyle name={["services", record.key, "fee"]}>
                            <Input
                                placeholder="请输入"
                                variant="borderless"
                                className="text-center"
                                disabled={CHANGE_KEYS.includes(record.key)}
                            />
                        </Form.Item>
                    ),
                },
            ]}
            dataSource={dataSource}
            pagination={false}
            className="[&_.ant-table-cell]:!p-2"
        />
    );
};

export default ServiceFeeTable;
