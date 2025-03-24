import { Checkbox, Form } from "antd";

export const INSURANCE_SERVICES = [
    { id: "damage", label: "机动车损失服务" },
    { id: "third_party", label: "第三者责任服务" },
    { id: "theft", label: "车上人员责任服务（驾驶员）" },
    { id: "driver", label: "车上人员责任服务（乘客）" },
    { id: "passenger", label: "医保外用药责任服务" },
    { id: "glass", label: "全车盗抢服务" },
    { id: "scratch", label: "车身划痕损失服务" },
    { id: "water", label: "外部电网故障损失服务" },
    { id: "natural", label: "闪电賠付服务" },
];

interface InsuranceOptionsProps {
    onServiceChange?: (services: { key: string; name: string; limit?: string }[]) => void;
}

const InsuranceOptions: React.FC<InsuranceOptionsProps> = ({ onServiceChange }) => {
    const form = Form.useFormInstance();

    // 处理保险选项变化
    const handleCheckboxChange = () => {
        const values = form.getFieldsValue();
        const selectedServices = INSURANCE_SERVICES.filter((service) => values.insurance?.[service.id]).map(
            (service) => ({
                key: service.id,
                name: service.label,
                // 如果是乘客责任，添加默认限额
                ...(service.id === "driver" ? { limit: "10000.00*4座" } : {}),
            })
        );
        onServiceChange?.(selectedServices);
    };

    return (
        <div className="bg-white p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-6">保险服务范围</h3>
            {INSURANCE_SERVICES.map((item) => (
                <div className="mb-2" key={item.id}>
                    <Form.Item name={["insurance", item.id]} valuePropName="checked" noStyle>
                        <Checkbox onChange={handleCheckboxChange}>{item.label}</Checkbox>
                    </Form.Item>
                </div>
            ))}
        </div>
    );
};

export default InsuranceOptions;
