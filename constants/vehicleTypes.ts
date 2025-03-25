export interface VehicleType {
    label: string;
    value: string;
    children: VehicleType[];
}

export const vehicleTypes: VehicleType[] = [
    {
        label: "营业货车",
        value: "营业货车",
        children: [
            {
                label: "二吨以下货车",
                value: "二吨以下货车",
                children: [],
            },
            {
                label: "二至五吨货车",
                value: "二至五吨货车",
                children: [],
            },
            {
                label: "五至十吨货车",
                value: "五至十吨货车",
                children: [],
            },
            {
                label: "十吨以上货车",
                value: "十吨以上货车",
                children: [],
            },
            {
                label: "挂车",
                value: "挂车",
                children: [],
            },
        ],
    },
    {
        label: "非营业货车",
        value: "非营业货车",
        children: [
            {
                label: "二吨以下货车",
                value: "二吨以下货车",
                children: [],
            },
            {
                label: "二至五吨货车",
                value: "二至五吨货车",
                children: [],
            },
            {
                label: "五至十吨货车",
                value: "五至十吨货车",
                children: [],
            },
            {
                label: "十吨以上货车",
                value: "十吨以上货车",
                children: [],
            },
            {
                label: "挂车",
                value: "挂车",
                children: [],
            },
        ],
    },
    {
        label: "预约出租客运",
        value: "预约出租客运",
        children: [
            {
                label: "预约出租客运",
                value: "预约出租客运",
                children: [],
            },
        ],
    },
    {
        label: "家庭自用汽车",
        value: "家庭自用汽车",
        children: [
            {
                label: "客车",
                value: "客车",
                children: [
                    {
                        label: "2-5座",
                        value: "2-5座",
                        children: [],
                    },
                    {
                        label: "6座以上",
                        value: "6座以上",
                        children: [],
                    },
                ],
            },
        ],
    },
    {
        label: "特种车",
        value: "特种车",
        children: [
            {
                label: "特种车二",
                value: "特种车二",
                children: [],
            },
        ],
    },
];
