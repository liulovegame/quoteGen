import { Checkbox, Form, Input } from "antd";

export const INSURANCE_SERVICES = [
    { id: "damage", label: "机动车损失服务" },
    { id: "third_party", label: "第三者责任服务" },
    { id: "theft", label: "车上人员责任服务（驾驶员）" },
    { id: "driver", label: "车上人员责任服务（乘客）" },
    { id: "medical", label: "医保外用药责任服务" },
    { id: "glass", label: "全车盗抢服务" },
    { id: "scratch", label: "车身划痕损失服务" },
    { id: "water", label: "外部电网故障损失服务" },
    { id: "natural", label: "闪电賠付服务" },
];

interface InsuranceOptionsProps {
    onServiceChange?: (services: { key: string; name: string }[]) => void;
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
            })
        );

        // 从 dataSource 中获取选中的服务
        const services = selectedServices.reduce((acc, item) => {
            const serviceType = item.key;
            const serviceData = form.getFieldValue(["services", serviceType]);
            if (serviceData) {
                acc[serviceType] = serviceData;
            }
            return acc;
        }, {} as Record<string, { limit: string; fee: string }>);

        // 计算标准服务费合计
        const totalStandardFee = Object.values(services)
            .reduce((total: number, service) => {
                return total + Number(service.fee || 0);
            }, 0)
            .toFixed(2);

        const discount = form.getFieldValue("discount") || 0;
        const actualFee = (Number(totalStandardFee) * discount).toFixed(2);
        // 更新标准服务费合计
        form.setFieldValue("totalStandardFee", totalStandardFee);
        form.setFieldValue("actualFee", actualFee);

        onServiceChange?.(selectedServices);
    };

    return (
        <div className="bg-white p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-6">保险服务范围</h3>
            {INSURANCE_SERVICES.map((item) => (
                <div className="mb-2 flex items-center justify-between" key={item.id}>
                    <Form.Item name={["insurance", item.id]} valuePropName="checked" noStyle>
                        <Checkbox onChange={handleCheckboxChange}>{item.label}</Checkbox>
                    </Form.Item>
                    {item.id === "damage" && (
                        <div className="flex-1 text-xs">
                            <Form.Item name="damageFee" noStyle>
                                <Input prefix="费率:" variant="borderless" suffix="%" disabled />
                            </Form.Item>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default InsuranceOptions;
