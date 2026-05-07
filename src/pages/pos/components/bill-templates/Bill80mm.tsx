import { format } from "date-fns";

interface Bill80mmProps {
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

export default function Bill80mm({ data, config }: Bill80mmProps) {
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
                width: "80mm",
                padding: "3mm",
                backgroundColor: "white",
                color: "black",
                fontSize: `calc(10px * ${fontMultiplier})`,
            }}
            className="font-lao"
        >
            {/* Header - Centered for thermal */}
            <div className="text-center mb-2">
                {config.showLogo && tenant.logo && (
                    <div style={{ margin: "0 auto 4px", width: "60px", height: "60px", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {typeof tenant.logo === 'string' && tenant.logo.includes('<svg') ? (
                            <div className="w-full h-full [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: tenant.logo }} />
                        ) : tenant.logo ? (
                            <img src={tenant.logo} alt="Logo" className="object-contain w-full h-full" crossOrigin="anonymous" />
                        ) : (
                            <span style={{ fontSize: "8px", color: "#cbd5e1" }}>Logo</span>
                        )}
                    </div>
                )}
                <p style={{ fontWeight: "bold", fontSize: `calc(16px * ${fontMultiplier})`, marginBottom: "2px" }}>
                    {tenant.shopName || "SKV Store"}
                </p>
                <p style={{ fontSize: "0.85em", marginBottom: "1px" }}>{tenant.address || ""}</p>
                <p style={{ fontSize: "0.85em" }}>Tel: {tenant.phone || "-"}</p>
            </div>

            {/* Title */}
            <p style={{
                fontSize: `calc(14px * ${fontMultiplier})`,
                fontWeight: "bold",
                marginTop: "4px",
                marginBottom: "4px",
                textAlign: "center",
                borderTop: "2px solid black",
                borderBottom: "2px solid black",
                padding: "2px 0"
            }}>
                ໃບບິນ
            </p>

            {/* Bill Info */}
            <div style={{ fontSize: "0.95em", marginBottom: "3px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ flex: 1 }}>
                        <p style={{ marginBottom: "1px" }}>ເລກບິນ: <strong>#{data.orderId}</strong></p>
                        <p style={{ marginBottom: "1px" }}>ວັນທີ: {format(data.createdAt, "dd/MM/yyyy HH:mm")}</p>
                        <p>ຜູ້ຂາຍ: <strong>{data.cashierId?.username || "Staff"}</strong></p>
                    </div>
                    <div style={{ flex: 1, textAlign: "right" }}>
                        <p style={{ marginBottom: "1px" }}>ລູກຄ້າ: <strong>{customer?.name || "-"}</strong></p>
                        <p style={{ marginBottom: "1px" }}>ເບີ: {customer?.phone || "-"}</p>
                        <p style={{ marginBottom: "1px" }}>ທີ່ຢູ່: {customer?.address || "-"}</p>
                        <p style={{ marginBottom: "1px" }}>ຊຳລະ: <strong>{getPaymentMethodText(data.paymentMethod)}</strong></p>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div style={{ width: "100%", marginTop: "3px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95em" }}>
                    <thead>
                        <tr>
                            <th style={{ border: "1px solid black", padding: "2px 4px", textAlign: "center" }}>ລຳດັບ</th>
                            <th style={{ border: "1px solid black", padding: "2px 4px", textAlign: "left" }}>ລາຍການ</th>
                            <th style={{ border: "1px solid black", padding: "2px 4px", textAlign: "center" }}>ຈຳນວນ</th>
                            <th style={{ border: "1px solid black", padding: "2px 4px", textAlign: "right" }}>ລາຄາ</th>
                            <th style={{ border: "1px solid black", padding: "2px 4px", textAlign: "right" }}>ລວມ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item: any, index: number) => (
                            <tr key={index}>
                                <td style={{ border: "1px solid black", textAlign: "center", padding: "2px 4px" }}>{index + 1}</td>
                                <td style={{ border: "1px solid black", padding: "2px 4px" }}>{item.name}</td>
                                <td style={{ border: "1px solid black", textAlign: "center", padding: "2px 4px" }}>{item.quantity}</td>
                                <td style={{ border: "1px solid black", textAlign: "right", padding: "2px 4px" }}>
                                    {formattedNumber(item.price)}
                                </td>
                                <td style={{ border: "1px solid black", textAlign: "right", padding: "2px 4px" }}>
                                    {formattedNumber(item.price * item.quantity)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={4} style={{ border: "1px solid black", padding: "2px 4px", fontWeight: "bold", textAlign: "right" }}>ລວມ</td>
                            <td style={{ border: "1px solid black", padding: "2px 4px", textAlign: "right" }}>{formattedNumber(data.total + (data.discount || 0))}</td>
                        </tr>
                        <tr>
                            <td colSpan={4} style={{ border: "1px solid black", padding: "2px 4px", fontWeight: "bold", textAlign: "right" }}>ສ່ວນຫຼຸດ</td>
                            <td style={{ border: "1px solid black", padding: "2px 4px", textAlign: "right" }}>
                                {data.discount > 0 ? `-${formattedNumber(data.discount)}` : "0"}
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={4} style={{ border: "1px solid black", padding: "2px 4px", fontWeight: "bold", textAlign: "right", backgroundColor: "#f8fafc" }}>ຍອດເງິນລວມ</td>
                            <td style={{ border: "1px solid black", padding: "2px 4px", textAlign: "right", fontWeight: "bold", backgroundColor: "#f8fafc" }}>
                                {formattedNumber(data.total)}
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={4} style={{ border: "1px solid black", padding: "2px 4px", fontWeight: "bold", textAlign: "right" }}>ຮັບເງິນ</td>
                            <td style={{ border: "1px solid black", padding: "2px 4px", textAlign: "right", fontWeight: "bold" }}>
                                {formattedNumber(data.paidAmount)} LAK
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={4} style={{ border: "1px solid black", padding: "2px 4px", fontWeight: "bold", textAlign: "right" }}>ເງິນທອນ</td>
                            <td style={{ border: "1px solid black", padding: "2px 4px", textAlign: "right" }}>{formattedNumber(data.change)} LAK</td>
                        </tr>
                        {data.paymentMethod === 'DEBT' && (
                            <tr>
                                <td colSpan={3} style={{ border: "1px solid black", padding: "2px 4px", fontWeight: "bold", textAlign: "right", color: "#dc2626" }}>ໜີ້ຄົງເຫຼືອ</td>
                                <td style={{ border: "1px solid black", padding: "2px 4px", textAlign: "right", fontWeight: "bold", color: "#dc2626" }}>
                                    {formattedNumber(data.remainingAmount)} LAK
                                </td>
                            </tr>
                        )}
                    </tfoot>
                </table>
            </div>

            {/* QR Code */}
            {config.showQR && (
                <div style={{ marginTop: "4mm", textAlign: "center" }}>
                    <p style={{ fontSize: "0.85em", fontWeight: "bold", marginBottom: "2mm" }}>ສະແກນຊຳລະເງິນ</p>
                    <div style={{ width: "80px", height: "80px", margin: "0 auto", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: "8px", color: "#cbd5e1" }}>QR Code</span>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: "4mm", textAlign: "center", fontSize: "0.75em", color: "#94a3b8" }}>
                Powered by SKV GROUP
            </div>
        </div>
    );
}
