import { Table, Form, Input, Space } from "antd";

interface CompulsoryItem {
    key: string;
    label: string;
    field: string;
    disabled?: boolean;
}

interface CompulsoryTableProps {
    dataSource?: CompulsoryItem[];
}

const defaultDataSource: CompulsoryItem[] = [
    {
        key: "1",
        label: "交强险金额",
        field: "insurance",
    },
    {
        key: "2",
        label: "代收车船使用税",
        field: "tax",
    },
    {
        key: "3",
        label: "总合计",
        field: "total",
        disabled: true,
    },
];

const CompulsoryTable: React.FC<CompulsoryTableProps> = ({ dataSource = defaultDataSource }) => {
    const form = Form.useFormInstance();

    // 监听 insurance 和 tax 的变化，计算 total
    const handleValueChange = (changedValues: any) => {
        const values = form.getFieldsValue();
        const insurance = Number(values.compulsory?.insurance) || 0;
        const tax = Number(values.compulsory?.tax) || 0;
        form.setFieldValue(["compulsory", "total"], (insurance + tax).toFixed(2));
    };

    return (
        <>
            <h3 className="text-base font-medium my-4">代报交强</h3>
            <Table
                showHeader={false}
                bordered
                size="small"
                pagination={false}
                columns={[
                    {
                        title: "",
                        dataIndex: "label",
                        width: "70%",
                        onCell: () => ({
                            className: "text-gray-600",
                        }),
                    },
                    {
                        title: "",
                        dataIndex: "value",
                        width: "30%",
                        render: (_, record) => (
                            <Space.Compact className="items-center">
                                <Form.Item noStyle name={["compulsory", record.field]}>
                                    <Input
                                        placeholder="0"
                                        variant="borderless"
                                        disabled={record.disabled}
                                        className="w-full text-right"
                                        onChange={record.field !== "total" ? handleValueChange : undefined}
                                    />
                                </Form.Item>
                                <span>元</span>
                            </Space.Compact>
                        ),
                    },
                ]}
                dataSource={dataSource}
            />
        </>
    );
};

export default CompulsoryTable;
