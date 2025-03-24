import { Table, Form, Input, Space } from "antd";

interface SummaryItem {
    key: string;
    name: string;
    field?: string;
    value?: string;
    disabled?: boolean;
}

const SummaryTable: React.FC = () => {
    const form = Form.useFormInstance();

    const handleActualFeeChange = (value: string) => {
        const actualFee = Number(value) || 0;
        const totalStandardFee = Number(form.getFieldValue("totalStandardFee")) || 1; // 避免除以0
        const newDiscount = (actualFee / totalStandardFee).toFixed(2);
        form.setFieldValue("discount", newDiscount);
    };

    const summaryDataSource: SummaryItem[] = [
        {
            key: "1",
            name: "标准服务费合计",
            field: "totalStandardFee",
            disabled: true,
        },
        {
            key: "2",
            name: "出险次数",
            field: "claimCount",
        },
        {
            key: "3",
            name: "优惠折扣",
            field: "discount",
            disabled: true,
        },
        {
            key: "4",
            name: "实收服务费",
            field: "actualFee",
        },
    ];

    return (
        <Table
            size="small"
            showHeader={false}
            bordered
            columns={[
                {
                    title: "",
                    dataIndex: "name",
                    width: "70%",
                    render: (text) => <span className="text-gray-700 font-medium">{text}</span>,
                },
                {
                    title: "",
                    dataIndex: "value",
                    width: "30%",
                    render: (_, record: SummaryItem) => {
                        return (
                            <Space.Compact className="items-center">
                                <Form.Item noStyle name={record.field}>
                                    <Input
                                        placeholder="0"
                                        variant="borderless"
                                        className="text-right pr-4"
                                        disabled={record.disabled}
                                        onChange={
                                            record.key === "4"
                                                ? (e) => handleActualFeeChange(e.target.value)
                                                : undefined
                                        }
                                    />
                                </Form.Item>
                                {(record.field === "totalStandardFee" || record.field === "actualFee") && (
                                    <span>元</span>
                                )}
                            </Space.Compact>
                        );
                    },
                },
            ]}
            dataSource={summaryDataSource}
            pagination={false}
            className="[&_.ant-table-cell]:!p-2"
        />
    );
};

export default SummaryTable;
