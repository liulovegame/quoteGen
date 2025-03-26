import dayjs from "dayjs";

/**
 * 生成报价单号
 * 格式：Q + 年月日 + 4位随机数
 * 例如：Q202403150001
 */
export function generateQuoteNumber(): string {
    const date = dayjs();
    const year = date.format("YYYY");
    const month = date.format("MM");
    const day = date.format("DD");
    const random = Math.floor(Math.random() * 100000)
        .toString()
        .padStart(5, "0");
    return `Q${year}${month}${day}${random}`;
}
