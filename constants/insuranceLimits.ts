export interface InsuranceLimit {
    label: string;
    key: string;
    limits: number[];
}

export const insuranceLimits: InsuranceLimit[] = [
    {
        label: "第三者责任服务",
        key: "third_party",
        limits: [500000, 1000000, 1500000, 2000000, 3000000],
    },
    {
        label: "车上人员责任服务（驾驶员）",
        key: "theft",
        limits: [10000, 20000, 50000, 100000, 200000, 300000, 500000],
    },
    {
        label: "车上人员责任服务（乘客）",
        key: "driver",
        limits: [10000, 20000, 50000, 100000, 200000, 300000, 500000],
    },
    {
        label: "医保外用药责任服务",
        key: "medical",
        limits: [10000, 20000, 50000, 100000, 200000],
    },
];
