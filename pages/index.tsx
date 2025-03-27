import { Layout, Avatar, Form, Dropdown, message, Spin } from "antd";
import { UserOutlined, LogoutOutlined, DownOutlined, MailOutlined } from "@ant-design/icons";
import QuoteForm from "@/components/QuoteForm";
import VehicleInfo from "@/components/VehicleInfo";
import InsuranceOptions, { INSURANCE_SERVICES } from "@/components/InsuranceOptions";
import LeftUploadSection from "@/components/LeftUploadSection";
import PreviewImage from "@/components/PreviewImage";
import type { FormInstance } from "antd/es/form";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { IFormData } from "@/types/formData";
import dayjs from "dayjs";
import ServiceFeeTable from "@/components/ServiceFeeTable";
import SummaryTable from "@/components/SummaryTable";
import QuoteHeader from "@/components/QuoteHeader";
// import CompulsoryTable from "@/components/CompulsoryTable";
const { Header, Content } = Layout;

export default function Home() {
    const [form] = Form.useForm<IFormData>();
    const formRef = useRef<FormInstance>(null);
    const router = useRouter();
    const [userName, setUserName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedServices, setSelectedServices] = useState([
        { key: "damage", name: "机动车损失服务" },
        { key: "third_party", name: "第三者责任服务" },
        { key: "theft", name: "车上人员责任服务（驾驶员）" },
        { key: "driver", name: "车上人员责任服务（乘客）" },
    ]);

    useEffect(() => {
        const userStr = localStorage.getItem("quote_user");
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserName(user.name || "用户");
            setEmail(user.email || "");
        }
    }, []);

    // 设置默认选中的保险项目
    useEffect(() => {
        form.setFieldValue("insurance", {
            damage: true,
            third_party: true,
            theft: true,
            driver: true,
        });
    }, []);

    // 处理保险服务变化
    const handleServiceChange = (services: { key: string; name: string }[]) => {
        setSelectedServices(services);
    };

    const handleLoading = (loading: boolean) => {
        setLoading(loading);
    };

    const handleLogout = () => {
        localStorage.removeItem("quote_user");
        router.push("/login");
        message.success("退出成功");
    };

    const handleDataExtracted = async (data: IFormData) => {
        const vin = window.location.search.split("vin=")[1];

        // 转换日期字符串为 dayjs 对象
        const formattedData = {
            ...data,
            approvedLoadWeight: data.approvedLoadWeight || 0,
            services: {
                damage: { limit: "", fee: "" },
                driver: { limit: "", fee: "" },
                // 第三者责任服务
                third_party: {
                    limit: data.thirdPartyLiabilityAmount?.toString() || "",
                    fee: "",
                },
                // 车上人员责任服务（驾驶员）
                theft: {
                    limit: data.driverLiabilityAmount?.toString() || "",
                    fee: "",
                },
                // 医保外用药责任服务
                medical: {
                    limit: data.nonMedicalInsuranceDrugAmount?.toString() || "",
                    fee: "",
                },
            },
            firstRegistrationDate: data.firstRegistrationDate ? dayjs(data.firstRegistrationDate) : undefined,
            commercialInsuranceExpiryDate: data.commercialInsuranceExpiryDate
                ? dayjs(data.commercialInsuranceExpiryDate)
                : undefined,
        };

        // 如果有 VIN 号，调用 VIN 接口获取车辆信息
        if (data.vinNumber) {
            try {
                const response = await fetch("/api/ocr/vin", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ vin: data.vinNumber, search: vin }),
                });

                if (!response.ok) {
                    throw new Error("VIN API request failed");
                }

                const result = await response.json();
                if (result.success && result.data) {
                    const vinData = result.data;

                    // 映射 VIN 数据到表单
                    formattedData.vehicle = {
                        ...formattedData.vehicle,
                        usageMonths: data.firstRegistrationDate
                            ? Math.round(dayjs().diff(dayjs(data.firstRegistrationDate), "month", true))
                            : 0, // 使用月数，四舍五入
                        guidePrice: Number((vinData.guiding_price * 10000).toFixed(2)), // 新车购置价（转换为元）
                        nature: "", // 车辆性质
                        type: "", // 车辆类型
                    };

                    // 更新其他相关字段
                    formattedData.approvedPassengerCapacity = Number(vinData.seat_num); // 核定载客
                    formattedData.vehicleType = vinData.car_type; // 车辆种类
                } else {
                    message.error("获取车辆信息失败");
                }
            } catch (error) {
                console.error("VIN API error:", error);
                message.error("获取车辆信息失败");
            }
        }

        // 计算保险期限起始日
        let startDate;
        if (data.commercialInsuranceExpiryDate) {
            const expiryDate = dayjs(data.commercialInsuranceExpiryDate);
            const today = dayjs();
            startDate = expiryDate.isBefore(today) ? today : expiryDate.add(1, "day");
        } else {
            // 如果没有商业到期日，则使用当前系统日期
            startDate = dayjs();
        }
        formattedData.insuranceStartDate = startDate;

        // 计算保险期限终止日（起始日+1年）
        formattedData.insuranceEndDate = startDate.add(1, "year");

        // 处理保险服务选项
        if (data.insuranceServices && Array.isArray(data.insuranceServices)) {
            // 初始化所有保险选项为 false
            const insurance = {
                damage: false,
                third_party: false,
                theft: false,
                driver: false,
                medical: false,
                glass: false,
                scratch: false,
                water: false,
                natural: false,
            };
            const services: Array<{ key: string; name: string }> = [];

            // 根据服务名称设置对应的保险选项
            data.insuranceServices.forEach((serviceName) => {
                // 查找匹配的保险服务
                const matchedService = INSURANCE_SERVICES.find((service) => service.label === serviceName);
                if (matchedService) {
                    // 设置保险选项为 true
                    insurance[matchedService.id as keyof typeof insurance] = true;
                    // 添加到已选服务列表
                    services.push({ key: matchedService.id, name: matchedService.label });
                }
            });

            // 更新表单中的保险选项
            formattedData.insurance = insurance;
            // 更新已选服务列表
            setSelectedServices(services);
        }

        // 更新表单数据
        form.setFieldsValue(formattedData);
    };

    const dropdownItems = {
        items: [
            {
                key: "email",
                label: email,
                icon: <MailOutlined />,
            },
            {
                key: "logout",
                label: "退出登录",
                icon: <LogoutOutlined />,
                onClick: handleLogout,
            },
        ],
    };

    return (
        <Layout className="min-h-screen">
            {/* 头部导航  */}
            <Header className="flex justify-between items-center px-6 bg-white">
                <div className="text-xl font-semibold text-blue-600">车险报价系统</div>
                <Dropdown menu={dropdownItems} placement="bottomRight">
                    <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 py-2 px-3 rounded-md transition-colors">
                        <Avatar icon={<UserOutlined />} />
                        <span>{userName}</span>
                        <DownOutlined className="text-xs text-gray-400" />
                    </div>
                </Dropdown>
            </Header>

            {/* 主要内容区域 */}
            <Content className="p-6 ml-auto mr-auto">
                <div className="flex gap-4">
                    {/* 左侧栏  */}
                    <LeftUploadSection onDataExtracted={handleDataExtracted} />

                    {/* 中间区域  */}
                    <Form form={form} ref={formRef} className="flex-1 flex gap-4">
                        <div id="main-quote" className="bg-white rounded-lg p-6" style={{ width: "794px" }}>
                            <PreviewImage />
                            <QuoteHeader />
                            <QuoteForm />

                            <div className="mt-6">
                                <Spin spinning={loading}>
                                    <ServiceFeeTable dataSource={selectedServices} />
                                    <SummaryTable dataSource={selectedServices} />
                                    {/* <CompulsoryTable /> */}
                                </Spin>
                            </div>
                            {/* <div className="mt-3 text-sm text-red-500">*如车辆超出服务期则需验车</div>
                            <div className="text-sm text-red-500">*此报价单仅供参考,实际服务费以出单为准</div> */}
                        </div>

                        {/* 右侧栏  */}
                        <div className="flex-1 max-w-72 layout-form-right">
                            <VehicleInfo handleLoading={handleLoading} />
                            <InsuranceOptions onServiceChange={handleServiceChange} />
                        </div>
                    </Form>
                </div>
            </Content>
        </Layout>
    );
}
