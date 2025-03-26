import { Table, Form, Input, Space } from "antd";
import { IFormData } from "@/types/formData";

interface ServiceFeeTableProps {
    dataSource: Array<{
        key: string;
        name: string;
    }>;
}

const CHANGE_KEYS = ["damage", "third_party", "theft", "driver", "medical"];

const ServiceFeeTable: React.FC<ServiceFeeTableProps> = ({ dataSource }) => {
    const form = Form.useFormInstance();
    const passengerCapacity = Form.useWatch("approvedPassengerCapacity", form);

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
                }
            }
        } catch (error) {
            console.error("查询服务数据失败:", error);
        }
    };

    // 处理输入变化
    const handleInputChange = (serviceType: string, value: string) => {
        if (CHANGE_KEYS.includes(serviceType)) {
            queryServiceData(serviceType, value);
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
                        <Space.Compact className="items-center">
                            <Form.Item noStyle name={["services", record.key, "limit"]}>
                                <Input placeholder="请输入" variant="borderless" className="text-center" />
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
