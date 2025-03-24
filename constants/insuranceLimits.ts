export interface InsuranceLimit {
    label: string;
    value: string;
    limits: number[];
}

export const insuranceLimits: InsuranceLimit[] = [
    {
        label: "第三者责任服务",
        value: "third_party_liability",
        limits: [500000, 1000000, 1500000, 2000000, 3000000],
    },
    {
        label: "车上人员责任服务（驾驶员）",
        value: "driver_liability",
        limits: [10000, 20000, 50000, 100000, 200000, 300000, 500000],
    },
    {
        label: "车上人员责任服务（乘客）",
        value: "passenger_liability",
        limits: [10000, 20000, 50000, 100000, 200000, 300000, 500000],
    },
    {
        label: "医保外用药责任服务",
        value: "medical_liability",
        limits: [10000, 20000, 50000, 100000, 200000],
    },
];
