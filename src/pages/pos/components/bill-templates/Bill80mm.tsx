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
    small: 0.9,
    medium: 1,
    large: 1.08,
};

export default function Bill80mm({ data, config }: Bill80mmProps) {
    const fontMultiplier = fontMultipliers[config.fontSize];
    const tenant = getBillTenant(data);
    const customer = data.customerId || {};
    const items = data.items || [];
    const discount = data.discount || 0;
    const remainingAmount = data.remainingAmount || 0;

    return (
        <div
            style={{
                width: "80mm",
                padding: "4mm",
                backgroundColor: "white",
                color: "#000",
                fontSize: `calc(10px * ${fontMultiplier})`,
                boxSizing: "border-box",
            }}
            className="font-lao"
        >
            <style>{`
                @media print {
                    @page {
                        margin: 0;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>

            <div style={{ textAlign: "center", marginBottom: 5 }}>
                {config.showLogo && tenant.logo && (
                    <div style={{ width: 44, height: 44, margin: "0 auto 4px", border: "1px solid #000", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {renderBillMedia(tenant.logo, "Logo", "Logo")}
                    </div>
                )}
                <div style={{ fontWeight: 700, fontSize: `calc(14px * ${fontMultiplier})`, lineHeight: 1.2 }}>
                    {tenant.shopName || "SKV Store"}
                </div>
                <div style={{ fontSize: "0.82em", lineHeight: 1.35 }}>
                    {tenant.address || "Vientiane, Laos"}
                </div>
                <div style={{ fontSize: "0.82em", lineHeight: 1.35 }}>
                    Tel: {tenant.phone || "-"}
                </div>
            </div>

            <div style={{ borderTop: "1px solid #000", borderBottom: "1px solid #000", textAlign: "center", padding: "2px 0", marginBottom: 5, fontWeight: 700 }}>
                ໃບບິນ
            </div>

            <div style={{ marginBottom: 5, paddingBottom: 5, borderBottom: "1px dashed #000" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                    <span>ບິນ</span>
                    <span>#{data.orderId}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                    <span>ວັນທີ</span>
                    <span>{format(data.createdAt, "dd/MM/yyyy HH:mm")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                    <span>ຜູ້ຂາຍ</span>
                    <span>{data.cashierId?.username || "Staff"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                    <span>ລູກຄ້າ</span>
                    <span style={{ textAlign: "right" }}>{customer?.name || "-"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                    <span>ຊຳລະ</span>
                    <span>{getPaymentMethodText(data.paymentMethod)}</span>
                </div>
            </div>

            <div style={{ marginBottom: 5 }}>
                {items.map((item: BillItem, index: number) => (
                    <div key={index} style={{ padding: "4px 0", borderBottom: index === items.length - 1 ? "none" : "1px dotted #000" }}>
                        <div style={{ fontSize: "0.92em", lineHeight: 1.2 }}>{item.name}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 6, fontSize: "0.84em" }}>
                            <span>
                                {item.quantity} x {formatBillNumber(item.price)}
                            </span>
                            <span>{formatBillNumber(item.price * item.quantity)}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ borderTop: "1px solid #000", paddingTop: 5, marginBottom: 5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                    <span>ລວມ</span>
                    <span>{formatBillNumber(data.total + discount)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                    <span>ສ່ວນຫຼຸດ</span>
                    <span>{discount > 0 ? `-${formatBillNumber(discount)}` : "0"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 6, fontWeight: 700, borderTop: "1px solid #000", paddingTop: 3, marginTop: 3 }}>
                    <span>ຍອດລວມ</span>
                    <span>{formatBillNumber(data.total)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                    <span>ຮັບ</span>
                    <span>{formatBillNumber(data.paidAmount)} LAK</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                    <span>ທອນ</span>
                    <span>{formatBillNumber(data.change)} LAK</span>
                </div>
                {data.paymentMethod === "DEBT" && (
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 6, fontWeight: 700 }}>
                        <span>ໜີ້ຄົງເຫຼືອ</span>
                        <span>{formatBillNumber(remainingAmount)} LAK</span>
                    </div>
                )}
            </div>

            {config.showQR && tenant.bankQr && (
                <div style={{ marginBottom: 5, paddingTop: 5, borderTop: "1px dashed #000", textAlign: "center" }}>
                    <div style={{ marginBottom: 3, fontWeight: 700 }}>ສະແກນຊຳລະ</div>
                    <div style={{ width: 54, height: 54, margin: "0 auto", border: "1px solid #000", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {renderBillMedia(tenant.bankQr, "Payment QR", "QR Code")}
                    </div>
                </div>
            )}

            <div style={{ textAlign: "center", fontSize: "0.72em" }}>Powered by SKV GROUP</div>
        </div>
    );
}
