import { format } from "date-fns";

interface Bill58mmProps {
    data: any;
    config: {
        showLogo: boolean;
        showQR: boolean;
        showNotes: boolean;
        fontSize: "small" | "medium" | "large";
    };
}

const fontMultipliers = {
    small: 0.85,
    medium: 1,
    large: 1.15,
};

const formattedNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
};

export default function Bill58mm({ data, config }: Bill58mmProps) {
    const getPaymentMethodText = (method: string) => {
        if (method === 'DEBT') return 'ບໍ່ທັນຊຳລະ';
        if (method === 'TRANSFER' || method === 'QR') return 'ເງິນໂອນ';
        return 'ເງິນສົດ';
    };

    const fontMultiplier = fontMultipliers[config.fontSize];
    const tenant = data.tenantId || {};
    const customer = data.customerId || {};
    const items = data.items || [];

    return (
        <div
            style={{
                width: "45mm",
                margin: "0 auto",
                paddingTop: "3mm",
                paddingBottom: "10mm",
                backgroundColor: "white",
                color: "black",
                fontSize: `calc(10.5px * ${fontMultiplier})`,
                fontWeight: 500,
                boxSizing: "border-box",
            }}
            className="font-lao print-content"
        >
            <div className="py-10 my-10">
                {/* Header - Centered for thermal */}
                <div className="text-center mb-2">
                    {config.showLogo && tenant.logo && (
                        <div style={{ margin: "0 auto 3px", width: "40px", height: "40px", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {typeof tenant.logo === 'string' && tenant.logo.includes('<svg') ? (
                                <div className="w-full h-full [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: tenant.logo }} />
                            ) : tenant.logo ? (
                                <img src={tenant.logo} alt="Logo" className="object-contain w-full h-full" crossOrigin="anonymous" />
                            ) : (
                                <span style={{ fontSize: "6px", color: "black" }}>Logo</span>
                            )}
                        </div>
                    )}
                    <p style={{ fontWeight: "bold", fontSize: `calc(14px * ${fontMultiplier})`, marginBottom: "1px" }}>
                        {tenant.shopName || "SKV Store"}
                    </p>
                    <p style={{ fontSize: "0.85em" }}>{tenant.address || ""}</p>
                    <p style={{ fontSize: "0.85em" }}>Tel: {tenant.phone || "-"}</p>
                </div>

                {/* Title */}
                <p style={{
                    fontSize: `calc(13px * ${fontMultiplier})`,
                    fontWeight: "bold",
                    marginTop: "2mm",
                    marginBottom: "2mm",
                    textAlign: "center",
                    borderTop: "1px solid black",
                    borderBottom: "1px solid black",
                    padding: "1px 0"
                }}>
                    ໃບບິນ
                </p>

                {/* Bill Info - Compact */}
                <div style={{ display: "block" }}>
                    <div style={{ fontSize: "0.9em", marginBottom: "2mm" }}>
                        <p style={{ marginBottom: "0.5mm" }}>ບິນ: <strong>#{data.orderId}</strong></p>
                        <p style={{ marginBottom: "0.5mm" }}>ວັນທີ: {format(data.createdAt, "dd/MM/yyyy HH:mm")}</p>
                        <p style={{ marginBottom: "0.5mm" }}>ຜູ້ຂາຍ: <strong>{data.cashierId?.username || "Staff"}</strong></p>
                    </div>
                    <div style={{ fontSize: "0.9em", marginBottom: "2mm" }}>
                        <p style={{ marginBottom: "0.5mm" }}>ລູກຄ້າ: <strong>{customer?.name || "-"}</strong></p>
                        <p style={{ marginBottom: "0.5mm" }}>ເບີ: {customer?.phone || "-"}</p>
                        <p style={{ marginBottom: "0.5mm" }}>ທີ່ຢູ່: {customer?.address || "-"}</p>
                        <p style={{ marginBottom: "0.5mm" }}>ຊຳລະ: <strong>{getPaymentMethodText(data.paymentMethod)}</strong></p>
                    </div>
                </div>

                {/* Items - Simplified */}
                <div className="" style={{ borderTop: "1px dashed black", borderBottom: "1px dashed black", paddingTop: "1mm", paddingBottom: "1mm", marginBottom: "2mm" }}>
                    {items.map((item: any, index: number) => (
                        <div key={index} style={{ marginBottom: "1mm", fontSize: "0.9em" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>{item.name}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85em", color: "black" }}>
                                <span>{item.quantity} x {formattedNumber(item.price)}</span>
                                <span style={{ fontWeight: "bold", color: "black" }}>{formattedNumber(item.price * item.quantity)}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Totals */}
                <div className="" style={{ fontSize: "0.9em" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5mm" }}>
                        <span>ລວມ:</span>
                        <span>{formattedNumber(data.total + (data.discount || 0))}</span>
                    </div>
                    {data.discount > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5mm" }}>
                            <span>ສ່ວນຫຼຸດ:</span>
                            <span>-{formattedNumber(data.discount)}</span>
                        </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5mm", fontWeight: "bold", fontSize: "1.1em", borderTop: "1px solid black", paddingTop: "1mm" }}>
                        <span>ຍອດລວມ:</span>
                        <span>{formattedNumber(data.total)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5mm" }}>
                        <span>ຮັບເງິນ:</span>
                        <span>{formattedNumber(data.paidAmount)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>ເງິນທອນ:</span>
                        <span>{formattedNumber(data.change)}</span>
                    </div>
                    {data.paymentMethod === 'DEBT' && (
                        <div style={{ display: "flex", justifyContent: "space-between", color: "#dc2626", fontWeight: "bold" }}>
                            <span>ໜີ້ຄົງເຫຼືອ:</span>
                            <span>{formattedNumber(data.remainingAmount)}</span>
                        </div>
                    )}
                </div>

                {/* QR Code */}
                {config.showQR && (
                    <div style={{ marginTop: "3mm", textAlign: "center", borderTop: "1px dashed black", paddingTop: "2mm" }}>
                        <p style={{ fontSize: "0.85em", fontWeight: "bold", marginBottom: "1mm" }}>ສະແກນຊຳລະເງິນ</p>
                        <div style={{ width: "60px", height: "60px", margin: "0 auto", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: "6px", color: "black" }}>QR Code</span>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}
