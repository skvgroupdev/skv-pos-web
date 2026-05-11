import { format } from "date-fns";
import {
    formatBillNumber,
    getBillTenant,
    getPaymentMethodText,
    type BillConfig,
    type BillItem,
    type BillPrintData,
} from "./billPrintUtils";

interface Bill58mmProps {
    data: BillPrintData;
    config: BillConfig;
}

const fontMultipliers = {
    small: 1,
    medium: 1.08,
    large: 1.15,
};

const receiptRowStyle = {
    display: "grid",
    gridTemplateColumns: "auto minmax(0, 1fr)",
    alignItems: "end",
    columnGap: 4,
    lineHeight: 1.25,
} as const;

const receiptValueStyle = {
    minWidth: 0,
    textAlign: "right",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
} as const;

export default function Bill58mm({ data, config }: Bill58mmProps) {
    const fontMultiplier = fontMultipliers[config.fontSize];
    const tenant = getBillTenant(data);
    const customer = data.customerId || {};
    const items = data.items || [];
    const discount = data.discount || 0;
    const remainingAmount = data.remainingAmount || 0;

    return (
        <div
            style={{
                width: "58mm",
                maxWidth: "58mm",
                margin: 0,
                padding: "2mm 5mm 3mm 2mm",
                backgroundColor: "white",
                color: "#000",
                fontSize: `calc(13px * ${fontMultiplier})`,
                fontWeight: 400,
                boxSizing: "border-box",
                overflow: "visible",
            }}
            className="font-lao print-content"
        >
            <style>{`
                .print-content, .print-content * {
                    box-sizing: border-box;
                    max-width: 100%;
                }
                @media print {
                    @page {
                        size: 58mm auto;
                        margin: 0;
                    }
                    html,
                    body {
                        width: 58mm;
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>

            <div style={{ textAlign: "center", marginBottom: 4 }}>
                <div style={{ fontWeight: 700, fontSize: `calc(15px * ${fontMultiplier})`, lineHeight: 1.2, overflowWrap: "anywhere" }}>
                    {tenant.shopName || "SKV Store"}
                </div>
                <div style={{ fontSize: "1em", lineHeight: 1.35, overflowWrap: "anywhere" }}>
                    {tenant.address || "Vientiane, Laos"}
                </div>
                <div style={{ fontSize: "1em", lineHeight: 1.35, overflowWrap: "anywhere" }}>
                    Tel: {tenant.phone || "-"}
                </div>
            </div>

            <div style={{ borderTop: "1px solid #000", borderBottom: "1px solid #000", textAlign: "center", padding: "2px 0", marginBottom: 4, fontWeight: 700 }}>
                ໃບບິນ
            </div>

            <div style={{ marginBottom: 4, borderBottom: "1px dashed #000", paddingBottom: 4 }}>
                <div className=" text-right text-[13px]">
                    {/* <span>ບິນ</span> */}
                    <span style={receiptValueStyle}>#{data.orderId}</span>
                </div>
                <div className=" text-right text-[13px]">
                    {/* <span>ວັນທີ</span> */}
                    <span style={receiptValueStyle}>{format(data.createdAt, "dd/MM/yy HH:mm")}</span>
                </div>
                <div className=" text-right text-[13px] ">
                    {/* <span>ຜູ້ຂາຍ</span> */}
                    <span style={receiptValueStyle}>{data.cashierId?.username || "Staff"}</span>
                </div>
                <div className=" text-right text-[13px]">
                    {/* <span>ລູກຄ້າ</span> */}
                    <span style={receiptValueStyle}>{customer?.name || "-"}</span>
                </div>
                <div className=" text-right text-[13px]">
                    {/* <span>ຊຳລະ</span> */}
                    <span style={receiptValueStyle}>{getPaymentMethodText(data.paymentMethod)}</span>
                </div>
            </div>

            <div style={{ marginBottom: 4 }}>
                {items.map((item: BillItem, index: number) => (
                    <div key={index} style={{ padding: "3px 0", borderBottom: index === items.length - 1 ? "none" : "1px dotted #000" }}>
                        <div style={{ fontSize: "1em", lineHeight: 1.2, overflowWrap: "anywhere" }}>{item.name}</div>
                        <div style={{ ...receiptRowStyle, fontSize: "1em" }}>
                            <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                                {item.quantity} x {formatBillNumber(item.price)}
                            </span>
                            <span style={receiptValueStyle}>{formatBillNumber(item.price * item.quantity)}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ borderTop: "1px solid #000", paddingTop: 4, marginBottom: 4 }}>
                <div style={receiptRowStyle}>
                    <span>ລວມ</span>
                    <span style={receiptValueStyle}>{formatBillNumber(data.total + discount)}</span>
                </div>
                <div style={receiptRowStyle}>
                    <span>ສ່ວນຫຼຸດ</span>
                    <span style={receiptValueStyle}>{discount > 0 ? `-${formatBillNumber(discount)}` : "0"}</span>
                </div>
                <div style={{ ...receiptRowStyle, fontWeight: 700, borderTop: "1px solid #000", paddingTop: 3, marginTop: 3 }}>
                    <span>ຍອດລວມ</span>
                    <span style={receiptValueStyle}>{formatBillNumber(data.total)}</span>
                </div>
                <div style={receiptRowStyle}>
                    <span>ຮັບ</span>
                    <span style={receiptValueStyle}>{formatBillNumber(data.paidAmount)}</span>
                </div>
                <div style={receiptRowStyle}>
                    <span>ທອນ</span>
                    <span style={receiptValueStyle}>{formatBillNumber(data.change)}</span>
                </div>
                {data.paymentMethod === "DEBT" && (
                    <div style={{ ...receiptRowStyle, fontWeight: 700 }}>
                        <span>ໜີ້ຄົງເຫຼືອ</span>
                        <span style={receiptValueStyle}>{formatBillNumber(remainingAmount)}</span>
                    </div>
                )}
            </div>

            <div style={{ textAlign: "center", fontSize: "13px", paddingBottom: "5mm" }}>Powered by SKV GROUP</div>
            <div aria-hidden="true" style={{ height: "14mm", pageBreakInside: "avoid" }} />
        </div>
    );
}
