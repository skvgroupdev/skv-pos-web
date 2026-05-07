import { format } from "date-fns";

interface BillA5Props {
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

export default function BillA5({ data, config }: BillA5Props) {
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
                width: "148mm",
                padding: "5mm",
                margin: "0 auto",
                backgroundColor: "white",
                color: "black",
                fontSize: `calc(11px * ${fontMultiplier})`,
            }}
            className="font-lao"
        >
            <style>{`
                @media print {
                    @page {
                        size: A5 portrait;
                        margin: 0;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>

            {/* Header with Logo and QR */}
            {config.showLogo && config.showQR ? (
                <div className="flex justify-between items-start mb-3">
                    <div style={{ width: "70px", height: "70px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #f1f5f9" }}>
                        {typeof tenant.logo === 'string' && tenant.logo.includes('<svg') ? (
                            <div className="w-full h-full p-1 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: tenant.logo }} />
                        ) : tenant.logo ? (
                            <img src={tenant.logo} alt="Logo" className="object-contain w-full h-full" crossOrigin="anonymous" />
                        ) : (
                            <span style={{ fontSize: "8px", color: "#cbd5e1" }}>Logo</span>
                        )}
                    </div>

                    <div className="flex-1 text-center px-3">
                        <p style={{ fontWeight: "bold", fontSize: `calc(18px * ${fontMultiplier})`, marginBottom: "2px" }}>
                            {tenant.shopName || "SKV Store"}
                        </p>
                        <p style={{ fontSize: "0.9em", marginBottom: "1px" }}>{tenant.address || "Vientiane, Laos"}</p>
                        <p style={{ fontSize: "0.9em" }}>Tel: {tenant.phone || "-"}</p>
                    </div>

                    <div style={{ width: "70px", height: "70px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #f1f5f9" }}>
                        <span style={{ fontSize: "8px", color: "#cbd5e1" }}>QR</span>
                    </div>
                </div>
            ) : (
                <div className="text-center mb-3">
                    {config.showLogo && (
                        <div style={{ margin: "0 auto 4px", width: "70px", height: "70px", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: "8px", color: "#cbd5e1" }}>Logo</span>
                        </div>
                    )}
                    <p style={{ fontWeight: "bold", fontSize: `calc(18px * ${fontMultiplier})`, marginBottom: "2px" }}>
                        {tenant.shopName || "SKV Store"}
                    </p>
                    <p style={{ fontSize: "0.9em", marginBottom: "1px" }}>{tenant.address || "Vientiane, Laos"}</p>
                    <p style={{ fontSize: "0.9em" }}>Tel: {tenant.phone || "-"}</p>
                </div>
            )}

            {/* Title */}
            <p style={{
                fontSize: `calc(16px * ${fontMultiplier})`,
                fontWeight: "bold",
                marginTop: "4px",
                marginBottom: "4px",
                textAlign: "center",
                borderTop: "2px solid black",
                borderBottom: "2px solid black",
                padding: "2px 0"
            }}>
                ໃບສົ່ງເຄື່ອງ
            </p>

            {/* Bill Info */}
            <div style={{ fontSize: "0.95em", display: "flex", justifyContent: "space-between", marginBottom: "3px", gap: "4px" }}>
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
                        {/* Always show notes for A4/A5 as requested */}
                        <tr>
                            <td colSpan={3} rowSpan={5} style={{ border: "1px solid black", padding: "4px", verticalAlign: "top", fontSize: "0.85em" }}>
                                <p style={{ fontWeight: "bold", textDecoration: "underline", marginBottom: "2px" }}>ໝາຍເຫດ:</p>

                                {/* Dynamic Order Notes */}
                                {data.notes && data.notes.length > 0 && (
                                    <div style={{ marginBottom: "4px", borderBottom: "1px dashed #cbd5e1", paddingBottom: "2px" }}>
                                        {data.notes.map((note: any, index: number) => (
                                            <p key={index} style={{ marginBottom: "1px", fontWeight: "bold" }}>
                                                * {note.text || note}
                                            </p>
                                        ))}
                                    </div>
                                )}

                                <p>1. ກະລຸນາກວດສິນຄ້າໃຫ້ລະອຽດ</p>
                                <p>2. ກໍລະນີໂອນເງິນ ແຈ້ງສລີບ</p>
                            </td>
                            <td style={{ border: "1px solid black", padding: "2px 4px", fontWeight: "bold", textAlign: "right" }}>ລວມ</td>
                            <td style={{ border: "1px solid black", padding: "2px 4px", textAlign: "right" }}>{formattedNumber(data.total + (data.discount || 0))}</td>
                        </tr>
                        <tr>
                            <td style={{ border: "1px solid black", padding: "2px 4px", fontWeight: "bold", textAlign: "right" }}>ສ່ວນຫຼຸດ</td>
                            <td style={{ border: "1px solid black", padding: "2px 4px", textAlign: "right" }}>
                                {data.discount > 0 ? `-${formattedNumber(data.discount)}` : "0"}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ border: "1px solid black", padding: "2px 4px", fontWeight: "bold", textAlign: "right", backgroundColor: "#f8fafc" }}>ຍອດເງິນລວມ</td>
                            <td style={{ border: "1px solid black", padding: "2px 4px", textAlign: "right", fontWeight: "bold", backgroundColor: "#f8fafc" }}>
                                {formattedNumber(data.total)}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ border: "1px solid black", padding: "2px 4px", fontWeight: "bold", textAlign: "right" }}>ຮັບເງິນ</td>
                            <td style={{ border: "1px solid black", padding: "2px 4px", textAlign: "right", fontWeight: "bold" }}>
                                {formattedNumber(data.paidAmount)} LAK
                            </td>
                        </tr>
                        <tr>
                            <td style={{ border: "1px solid black", padding: "2px 4px", fontWeight: "bold", textAlign: "right" }}>ເງິນທອນ</td>
                            <td style={{ border: "1px solid black", padding: "2px 4px", textAlign: "right" }}>{formattedNumber(data.change)} LAK</td>
                        </tr>
                        {data.paymentMethod === 'DEBT' && (
                            <tr>
                                <td colSpan={4} style={{ border: "1px solid black", padding: "3px 6px", fontWeight: "bold", textAlign: "right", color: "#dc2626" }}>ໜີ້ຄົງເຫຼືອ</td>
                                <td style={{ border: "1px solid black", padding: "3px 6px", textAlign: "right", fontWeight: "bold", color: "#dc2626" }}>
                                    {formattedNumber(data.remainingAmount)} LAK
                                </td>
                            </tr>
                        )}
                    </tfoot>
                </table>
            </div>

            {/* Footer Signatures */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8mm", fontSize: "0.9em", paddingLeft: "4mm", paddingRight: "4mm" }}>
                <div style={{ textAlign: "center", flex: 1 }}>
                    <p style={{ fontWeight: "bold" }}>ຜູ້ຈ່າຍເງິນ</p>
                </div>
                <div style={{ textAlign: "center", flex: 1 }}>
                    <p style={{ fontWeight: "bold" }}>ຜູ້ຮັບເຄື່ອງ</p>
                </div>
                <div style={{ textAlign: "center", flex: 1 }}>
                    <p style={{ fontWeight: "bold" }}>ຜູ້ສົ່ງເຄື່ອງ</p>
                </div>

                <div style={{ textAlign: "center", flex: 1 }}>

                    <p style={{ fontWeight: "bold" }}>ຜູ້ຮັບເງິນ</p>
                </div>
            </div>

            {/* Powered By */}
            <div style={{ marginTop: "20mm", textAlign: "center", fontSize: "0.75em", color: "#94a3b8" }}>
                Powered by SKV GROUP
            </div>
        </div>
    );
}
