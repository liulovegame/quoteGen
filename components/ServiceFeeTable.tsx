import { Table, Form, Input } from "antd";

interface ServiceFeeTableProps {
    dataSource: Array<{
        key: string;
        name: string;
    }>;
}

const ServiceFeeTable: React.FC<ServiceFeeTableProps> = ({ dataSource }) => {
    const form = Form.useFormInstance();
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
                        className: "text-gray-700"
                    })
                },
                {
                    title: "服务限额（元）",
                    dataIndex: "limit",
                    width: "30%",
                    align: "center",
                    render: (_, record) => (
                        <Form.Item noStyle name={["services", record.key, "limit"]}>
                            <Input
                                placeholder="请输入"
                                variant="borderless"
                                className="text-center"
                            />
                        </Form.Item>
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