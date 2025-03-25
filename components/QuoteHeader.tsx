import Image from "next/image";

const QuoteHeader = () => {
    return (
        <div className="flex items-center gap-4">
            <div className="w-20 h-20 relative ml-3">
                <Image src="/insurance-logo.jpeg" alt="众安车保" fill style={{ objectFit: "contain" }} priority />
            </div>
            <h1 className="text-2xl font-medium text-[#E4393C] flex-1 text-center">众安车保汽车服务报价单</h1>
            <div className="w-20 h-20 relative mr-3"></div>
        </div>
    );
};

export default QuoteHeader;
