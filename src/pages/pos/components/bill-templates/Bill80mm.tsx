import { format } from "date-fns";
import {
    formatBillNumber,
    getBillTenant,
    getPaymentMethodText,
    renderBillMedia,
    type BillConfig,
    type BillItem,
    type BillPrintData,
} from "./billPrintUtils";

interface Bill80mmProps {
    data: BillPrintData;
    config: BillConfig;
}

const fontMultipliers = {
    small: 1,
    medium: 1.08,
    large: 1.15,
};

const receiptRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 4,
    lineHeight: 1.2,
} as const;

export default function Bill80mm({ data, config }: Bill80mmProps) {
    const fontMultiplier = fontMultipliers[config.fontSize];
    const tenant = getBillTenant(data);
    const items = data.items || [];
    const discount = data.discount || 0;
    const subtotal = data.total + discount;

    return (
        <div
            style={{
                width: "80mm",
                maxWidth: "80mm",
                margin: 0,
                padding: "2mm 4mm 2mm 2mm",
                backgroundColor: "white",
                color: "#000",
                fontSize: `calc(12px * ${fontMultiplier})`,
                fontWeight: 400,
                boxSizing: "border-box",
                overflow: "visible",
                fontFamily: "monospace",
            }}
            className="font-lao print-content"
        >
            <style>{`
                .print-content, .print-content * {
                    box-sizing: border-box;
                }
                @media print {
                    @page {
                        size: 80mm auto;
                        margin: 0;
                    }
                    html,
                    body {
                        width: 80mm;
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>

            {/* Header section */}
            <div style={{ textAlign: "center", marginBottom: 15 }}>
                {config.showLogo && tenant.logo && (
                    <div style={{ width: 60, height: 60, margin: "0 auto 8px" }}>
                        {renderBillMedia(tenant.logo, "Logo", "")}
                    </div>
                )}
                <div style={{ fontWeight: 700, fontSize: `calc(16px * ${fontMultiplier})`, lineHeight: 1.1, textTransform: "uppercase" }}>
                    {tenant.shopName || "ຊື່ຮ້ານຂອງທ່ານ"}
                </div>
                <div style={{ fontSize: "0.9em", marginTop: 2 }}>
                    {tenant.address || "ບໍລິການດ້ວຍໃຈ"}
                </div>
                <div style={{ fontSize: "0.9em", marginTop: 2 }}>
                    {tenant.phone || "020xxxxxxxx"}
                </div>
            </div>

            {/* Receipt Info */}
            <div style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: `calc(15px * ${fontMultiplier})`, marginBottom: 4 }}>
                    ເລກບິນ: {data.orderId}
                </div>
                <div style={receiptRowStyle}>
                    <div>ວັນທີ: {format(data.createdAt, "dd/MM/yyyy")}</div>
                    <div style={{ textAlign: "right" }}>ຜູ້ຂາຍ: {data.cashierId?.username || "ພະນັກງານ"}</div>
                </div>
                <div style={receiptRowStyle}>
                    <div>ເວລາ: {format(data.createdAt, "HH:mm")}</div>
                </div>
            </div>

            {/* Table Header */}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, padding: "4px 0", borderTop: "1px solid #000", borderBottom: "1px solid #000" }}>
                <div style={{ flex: 1 }}>ລາຍການ</div>
                <div style={{ width: 60, textAlign: "center" }}>ຈຳນວນ</div>
                <div style={{ width: 80, textAlign: "right" }}>ລວມ</div>
            </div>

            {/* Items */}
            <div style={{ margin: "10px 0" }}>
                {items.map((item: BillItem, index: number) => (
                    <div key={index} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", alignItems: "flex-start" }}>
                        <div style={{ flex: 1, paddingRight: 8 }}>{item.name}</div>
                        <div style={{ width: 60, textAlign: "center" }}>{item.quantity}</div>
                        <div style={{ width: 80, textAlign: "right" }}>{formatBillNumber(item.price * item.quantity)}</div>
                    </div>
                ))}
            </div>

            {/* Totals section */}
            <div style={{ borderTop: "2px solid #000", paddingTop: 8 }}>
                <div style={receiptRowStyle}>
                    <span>ລວມເງິນ</span>
                    <span>{formatBillNumber(subtotal)}</span>
                </div>
                {/* <div style={receiptRowStyle}>
                    <span>ອາກອນ (VAT)</span>
                    <span>0</span>
                </div> */}
                <div style={receiptRowStyle}>
                    <span>ສ່ວນຫຼຸດ</span>
                    <span>{discount > 0 ? `-${formatBillNumber(discount)}` : "0"}</span>
                </div>
                {/* <div style={receiptRowStyle}>
                    <span>ຄ່າບໍລິການ</span>
                    <span>0</span>
                </div> */}

                <div style={{ borderTop: "2px solid #000", margin: "6px 0", paddingTop: 6, ...receiptRowStyle, fontWeight: 700, fontSize: `calc(14px * ${fontMultiplier})` }}>
                    <span>ຍອດລວມທັງໝົດ</span>
                    <span>{formatBillNumber(data.total)}</span>
                </div>

                <div style={receiptRowStyle}>
                    <span>ຮັບເງິນ ({getPaymentMethodText(data.paymentMethod)})</span>
                    <span>{formatBillNumber(data.paidAmount)}</span>
                </div>

                <div style={receiptRowStyle}>
                    <span>ເງິນທອນ</span>
                    <span>{formatBillNumber(data.change)}</span>
                </div>

                {data.paymentMethod === "DEBT" && (
                    <div style={{ ...receiptRowStyle, fontWeight: 700, marginTop: 4, color: "#dc2626" }}>
                        <span>ໜີ້ຄົງເຫຼືອ</span>
                        <span>{formatBillNumber(data.remainingAmount || 0)}</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{ textAlign: "center", marginTop: 30, paddingBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: `calc(15px * ${fontMultiplier})`, marginBottom: 4 }}>
                    ຂໍຂອບໃຈ ທີ່ມາອຸດໜູນ
                </div>


                <div style={{ fontSize: "0.9em", lineHeight: 1.4 }}>
                    <div>Powered by SKV GROUP</div>
                </div>
            </div>

            <div aria-hidden="true" style={{ height: "10mm", pageBreakInside: "avoid" }} />

        </div>
    );
}
