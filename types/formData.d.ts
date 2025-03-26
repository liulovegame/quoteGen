import type { Dayjs } from 'dayjs';

export interface IFormData {
    quote_number?: string;                  // 报价单号
    insuredName: string;                    // 被服务人名称
    licensePlateNumber: string;             // 车牌号
    engineNumber: string;                   // 发动机号
    vinNumber: string;                      // 车架号
    vehicleModel: string;                   // 厂牌型号
    firstRegistrationDate: string | Dayjs;  // 初登日期
    approvedLoadWeight: number;             // 核定载质量
    approvedPassengerCapacity: number;      // 核定载客
    vehicleType: string;                    // 车辆种类
    usageType: string;                      // 使用性质
    insuranceStartDate: string | Dayjs;     // 保险期限起始日
    insuranceEndDate: string | Dayjs;       // 保险期限终止日
    commercialInsuranceExpiryDate: string | Dayjs; // 商业到期
    claimCount: number;                     // 出险次数
    services: {
        damage: { limit: string; fee: string }; // 机动车损失服务
        third_party: { limit: string; fee: string }; // 第三者责任服务
        theft: { limit: string; fee: string }; // 车上人员责任服务（驾驶员）
        driver: { limit: string; fee: string }; // 车上人员责任服务（乘客）
        glass?: { limit: string; fee: string }; // 玻璃单独破碎服务
        scratch?: { limit: string; fee: string }; // 车身划痕损失服务
        water?: { limit: string; fee: string }; // 发动机涉水损失服务
        natural?: { limit: string; fee: string }; // 自然损失服务
        medical?: { limit: string; fee: string }; // 医保外用药责任服务
    }
    claimCount: string; // 出险次数
    discount: string; // 折扣
    actualFee: string; // 实收服务费
    totalStandardFee: string; // 标准服务费合计	
    // compulsory: {
    //     insurance: string; // 保险费
    //     tax: string; // 车船税
    //     total: string; // 总费用
    // };
    vehicle: {
        nature: string; // 车辆性质
        type: string; // 车辆类型
        usageMonths: number; // 使用月数
        guidePrice: number; // 新车购置价
        depreciationRate: number; // 月折旧率
    };
    insurance: {
        damage: boolean; // 机动车损失服务
        third_party: boolean; // 第三者责任服务
        theft: boolean; // 车上人员责任服务（驾驶员）
        driver: boolean; // 车上人员责任服务（乘客）
        medical: boolean; // 医保外用药责任服务
        glass: boolean; // 全车盗抢服务
        scratch: boolean; // 车身划痕损失服务
        water: boolean; // 外部电网故障损失服务
        natural: boolean; // 闪电賠付服务
    };
    insuranceServices: string[]; // 保险服务范围
    nonMedicalInsuranceDrugAmount: number; // 医保外用药责任服务 保额	
    driverLiabilityAmount: number; // 车上人员责任服务（驾驶员） 保额
    passengerLiabilityAmount: number; // 车上人员责任服务（乘客） 保额
    thirdPartyLiabilityAmount: number; // 第三者责任服务 保额
    damageFee: number; // 车损费率
}
