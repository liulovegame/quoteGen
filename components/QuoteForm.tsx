import { Form, Input, DatePicker, Table, Space, InputNumber } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const QuoteForm: React.FC = () => {
    const renderInput = (placeholder: string, required: boolean = true) => (
        <Input.TextArea
            placeholder={placeholder}
            rows={1}
            autoSize
            variant="borderless"
            className="w-full"
            required={required}
        />
    );

    const columns: ColumnsType<any> = [
        {
            title: "被服务人名称",
            dataIndex: "label1",
            width: "20%",
            onCell: (record) => ({
                colSpan: record.key === "title" ? 4 : record.key === "6" ? 1 : undefined,
            }),
            render: (text, record) => {
                if (record.key === "title") {
                    return `尊敬的用户，您于${dayjs().format("YYYY-MM-DD")}日服务方案如下：`;
                }
                return text;
            },
        },
        {
            title: "",
            dataIndex: "input1",
            width: "30%",
            onCell: (record) => ({
                colSpan: record.key === "title" ? 0 : record.key === "6" ? 3 : undefined,
            }),
            render: (_, record) => {
                if (record.key === "title") {
                    return null;
                }
                if (record.key === "6") {
                    return (
                        <div>
                            <Form.Item
                                name="insuranceStartDate"
                                noStyle
                                rules={[{ required: true, message: "请选择起始日期" }]}
                            >
                                <DatePicker placeholder="起始日期" variant="borderless" suffixIcon={null} />
                            </Form.Item>
                            <span>始至</span>
                            <Form.Item
                                name="insuranceEndDate"
                                noStyle
                                rules={[{ required: true, message: "请选择终止日期" }]}
                            >
                                <DatePicker placeholder="终止日期" variant="borderless" suffixIcon={null} />
                            </Form.Item>
                            <span>止</span>
                        </div>
                    );
                }
                return (
                    <Space.Compact className="items-center">
                        <Form.Item
                            noStyle
                            name={record.field1}
                            rules={[{ required: true, message: `请输入${record.label1}` }]}
                        >
                            {record.field1 === "insuredName" ? (
                                renderInput("请输入客户姓名")
                            ) : record.field1 === "approvedLoadWeight" ? (
                                <InputNumber
                                    min={0}
                                    style={{ width: "100%" }}
                                    controls={false}
                                    variant="borderless"
                                    suffix={<span className="ml-2 text-gray-700">KG</span>}
                                />
                            ) : (
                                renderInput("请输入")
                            )}
                        </Form.Item>
                    </Space.Compact>
                );
            },
        },
        {
            title: "车牌号",
            dataIndex: "label2",
            width: "20%",
            onCell: (record) => ({
                colSpan: record.key === "title" || record.key === "6" ? 0 : undefined,
            }),
            render: (text) => text,
        },
        {
            title: "",
            dataIndex: "input2",
            width: "30%",
            onCell: (record) => ({
                colSpan: record.key === "title" || record.key === "6" ? 0 : undefined,
            }),
            render: (_, record) => {
                if (record.key === "title" || record.key === "6") {
                    return null;
                }
                return (
                    <Form.Item
                        name={record.field2}
                        noStyle
                        rules={[{ required: true, message: `请输入${record.label2}` }]}
                    >
                        {record.field2 === "firstRegistrationDate" ? (
                            <DatePicker
                                placeholder="选择日期"
                                suffixIcon={null}
                                className="w-full"
                                variant="borderless"
                            />
                        ) : record.field2 === "approvedPassengerCapacity" ? (
                            <InputNumber style={{ width: "100%" }} min={0} controls={false} variant="borderless" />
                        ) : (
                            renderInput("请输入")
                        )}
                    </Form.Item>
                );
            },
        },
    ];

    const dataSource = [
        {
            key: "title",
            label1: "",
            field1: "",
            label2: "",
            field2: "",
        },
        {
            key: "1",
            label1: "被服务人名称",
            field1: "insuredName",
            label2: "车牌号",
            field2: "licensePlateNumber",
        },
        {
            key: "2",
            label1: "发动机号",
            field1: "engineNumber",
            label2: "车架号",
            field2: "vinNumber",
        },
        {
            key: "3",
            label1: "厂牌型号",
            field1: "vehicleModel",
            label2: "初登日期",
            field2: "firstRegistrationDate",
        },
        {
            key: "4",
            label1: "核定载质量",
            field1: "approvedLoadWeight",
            label2: "核定载客",
            field2: "approvedPassengerCapacity",
        },
        {
            key: "5",
            label1: "车辆种类",
            field1: "vehicleType",
            label2: "使用性质",
            field2: "usageType",
        },
        {
            key: "6",
            label1: "服务期间",
            field1: "servicePeriod",
            label2: "",
            field2: "",
        },
    ];

    return (
        <div className="rounded-lg">
            <Table
                showHeader={false}
                columns={columns}
                dataSource={dataSource}
                pagination={false}
                bordered
                size="small"
                className="[&_.ant-table-cell]:!p-3"
            />
        </div>
    );
};

export default QuoteForm;
