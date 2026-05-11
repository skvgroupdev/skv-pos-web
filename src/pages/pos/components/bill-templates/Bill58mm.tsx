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

interface Bill58mmProps {
    data: BillPrintData;
    config: BillConfig;
}

const fontMultipliers = {
    small: 0.88,
    medium: 1,
    large: 1.08,
};

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
                width: "45mm",
                margin: "0 auto",
                padding: "3mm 2mm 4mm",
                backgroundColor: "white",
                color: "#000",
                fontSize: `calc(9.8px * ${fontMultiplier})`,
                fontWeight: 400,
                boxSizing: "border-box",
            }}
            className="font-lao print-content"
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

            <div style={{ textAlign: "center", marginBottom: 4 }}>
                {config.showLogo && tenant.logo && (
                    <div style={{ width: 36, height: 36, margin: "0 auto 4px", border: "1px solid #000", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {renderBillMedia(tenant.logo, "Logo", "Logo")}
                    </div>
                )}
                <div style={{ fontWeight: 700, fontSize: `calc(12px * ${fontMultiplier})`, lineHeight: 1.2 }}>
                    {tenant.shopName || "SKV Store"}
                </div>
                <div style={{ fontSize: "0.8em", lineHeight: 1.35 }}>
                    {tenant.address || "Vientiane, Laos"}
                </div>
                <div style={{ fontSize: "0.8em", lineHeight: 1.35 }}>
                    Tel: {tenant.phone || "-"}
                </div>
            </div>

            <div style={{ borderTop: "1px solid #000", borderBottom: "1px solid #000", textAlign: "center", padding: "2px 0", marginBottom: 4, fontWeight: 700 }}>
                ໃບບິນ
            </div>

            <div style={{ marginBottom: 4, borderBottom: "1px dashed #000", paddingBottom: 4 }}>
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

            <div style={{ marginBottom: 4 }}>
                {items.map((item: BillItem, index: number) => (
                    <div key={index} style={{ padding: "3px 0", borderBottom: index === items.length - 1 ? "none" : "1px dotted #000" }}>
                        <div style={{ fontSize: "0.95em", lineHeight: 1.2 }}>{item.name}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 6, fontSize: "0.82em" }}>
                            <span>
                                {item.quantity} x {formatBillNumber(item.price)}
                            </span>
                            <span>{formatBillNumber(item.price * item.quantity)}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ borderTop: "1px solid #000", paddingTop: 4, marginBottom: 4 }}>
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
                    <span>{formatBillNumber(data.paidAmount)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                    <span>ທອນ</span>
                    <span>{formatBillNumber(data.change)}</span>
                </div>
                {data.paymentMethod === "DEBT" && (
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 6, fontWeight: 700 }}>
                        <span>ໜີ້ຄົງເຫຼືອ</span>
                        <span>{formatBillNumber(remainingAmount)}</span>
                    </div>
                )}
            </div>

            {config.showQR && tenant.bankQr && (
                <div style={{ marginBottom: 4, paddingTop: 4, borderTop: "1px dashed #000", textAlign: "center" }}>
                    <div style={{ marginBottom: 3, fontWeight: 700 }}>ສະແກນຊຳລະ</div>
                    <div style={{ width: 46, height: 46, margin: "0 auto", border: "1px solid #000", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {renderBillMedia(tenant.bankQr, "Payment QR", "QR Code")}
                    </div>
                </div>
            )}

            <div style={{ textAlign: "center", fontSize: "0.72em", marginTop: 2 }}>Powered by SKV GROUP</div>
        </div>
    );
}
