import { format } from "date-fns";

interface BillA4Props {
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

export default function BillA4({ data, config }: BillA4Props) {
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
                width: "210mm",
                padding: "8mm",
                backgroundColor: "white",
                color: "black",
                fontSize: `calc(12px * ${fontMultiplier})`,
            }}
            className="font-lao"
        >
            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>

            {/* Header with Logo and QR */}
            {config.showLogo && config.showQR ? (
                <div className="flex justify-between items-start mb-4">
                    <div style={{ width: "90px", height: "90px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #f1f5f9" }}>
                        {typeof tenant.logo === 'string' && tenant.logo.includes('<svg') ? (
                            <div className="w-full h-full p-1 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: tenant.logo }} />
                        ) : tenant.logo ? (
                            <img src={tenant.logo} alt="Logo" className="object-contain w-full h-full" crossOrigin="anonymous" />
                        ) : (
                            <span style={{ fontSize: "10px", color: "#cbd5e1" }}>Logo</span>
                        )}
                    </div>

                    <div className="flex-1 text-center px-4">
                        <p style={{ fontWeight: "bold", fontSize: `calc(22px * ${fontMultiplier})`, marginBottom: "3px" }}>
                            {tenant.shopName || "SKV Store"}
                        </p>
                        <p style={{ fontSize: "1em", marginBottom: "2px" }}>{tenant.address || "Vientiane, Laos"}</p>
                        <p style={{ fontSize: "1em" }}>Tel: {tenant.phone || "-"}</p>
                    </div>

                    <div style={{ width: "90px", height: "90px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #f1f5f9" }}>
                        <span style={{ fontSize: "10px", color: "#cbd5e1" }}>QR</span>
                    </div>
                </div>
            ) : (
                <div className="text-center mb-4">
                    {config.showLogo && (
                        <div style={{ margin: "0 auto 6px", width: "90px", height: "90px", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: "10px", color: "#cbd5e1" }}>Logo</span>
                        </div>
                    )}
                    <p style={{ fontWeight: "bold", fontSize: `calc(22px * ${fontMultiplier})`, marginBottom: "3px" }}>
                        {tenant.shopName || "SKV Store"}
                    </p>
                    <p style={{ fontSize: "1em", marginBottom: "2px" }}>{tenant.address || "Vientiane, Laos"}</p>
                    <p style={{ fontSize: "1em" }}>Tel: {tenant.phone || "-"}</p>
                </div>
            )}

            {/* Title */}
            <p style={{
                fontSize: `calc(18px * ${fontMultiplier})`,
                fontWeight: "bold",
                marginTop: "5px",
                marginBottom: "5px",
                textAlign: "center",
                borderTop: "2px solid black",
                borderBottom: "2px solid black",
                padding: "3px 0"
            }}>
                ໃບສົ່ງເຄື່ອງ
            </p>

            {/* Bill Info */}
            <div style={{ fontSize: "1em", display: "flex", justifyContent: "space-between", marginBottom: "4px", gap: "6px" }}>
                <div style={{ flex: 1 }}>
                    <p style={{ marginBottom: "2px" }}>ເລກບິນ: <strong>#{data.orderId}</strong></p>
                    <p style={{ marginBottom: "2px" }}>ວັນທີ: {format(data.createdAt, "dd/MM/yyyy HH:mm")}</p>
                    <p>ຜູ້ຂາຍ: <strong>{data.cashierId?.username || "Staff"}</strong></p>
                </div>
                <div style={{ flex: 1, textAlign: "right" }}>
                    <p style={{ marginBottom: "2px" }}>ລູກຄ້າ: <strong>{customer?.name || "-"}</strong></p>
                    <p style={{ marginBottom: "2px" }}>ເບີ: {customer?.phone || "-"}</p>
                    <p style={{ marginBottom: "2px" }}>ທີ່ຢູ່: {customer?.address || "-"}</p>
                    <p style={{ marginBottom: "2px" }}>ຊຳລະ: <strong>{getPaymentMethodText(data.paymentMethod)}</strong></p>
                </div>
            </div>

            {/* Items Table */}
            <div style={{ width: "100%", marginTop: "4px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "1em" }}>
                    <thead>
                        <tr>
                            <th style={{ border: "1px solid black", padding: "3px 6px", textAlign: "center", backgroundColor: "#f8fafc" }}>ລຳດັບ</th>
                            <th style={{ border: "1px solid black", padding: "3px 6px", textAlign: "left", backgroundColor: "#f8fafc" }}>ລາຍການ</th>
                            <th style={{ border: "1px solid black", padding: "3px 6px", textAlign: "center", backgroundColor: "#f8fafc" }}>ຈຳນວນ</th>
                            <th style={{ border: "1px solid black", padding: "3px 6px", textAlign: "right", backgroundColor: "#f8fafc" }}>ລາຄາ</th>
                            <th style={{ border: "1px solid black", padding: "3px 6px", textAlign: "right", backgroundColor: "#f8fafc" }}>ລວມ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item: any, index: number) => (
                            <tr key={index}>
                                <td style={{ border: "1px solid black", textAlign: "center", padding: "3px 6px" }}>{index + 1}</td>
                                <td style={{ border: "1px solid black", padding: "3px 6px" }}>{item.name}</td>
                                <td style={{ border: "1px solid black", textAlign: "center", padding: "3px 6px" }}>{item.quantity}</td>
                                <td style={{ border: "1px solid black", textAlign: "right", padding: "3px 6px" }}>
                                    {formattedNumber(item.price)}
                                </td>
                                <td style={{ border: "1px solid black", textAlign: "right", padding: "3px 6px" }}>
                                    {formattedNumber(item.price * item.quantity)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        {/* Always show notes for A4/A5 as requested */}
                        <tr>
                            <td colSpan={3} rowSpan={5} style={{ border: "1px solid black", padding: "6px", verticalAlign: "top", fontSize: "0.9em" }}>
                                <p style={{ fontWeight: "bold", textDecoration: "underline", marginBottom: "3px" }}>ໝາຍເຫດ:</p>

                                {/* Dynamic Order Notes */}
                                {data.notes && data.notes.length > 0 && (
                                    <div style={{ marginBottom: "6px", borderBottom: "1px dashed #cbd5e1", paddingBottom: "4px" }}>
                                        {data.notes.map((note: any, index: number) => (
                                            <p key={index} style={{ marginBottom: "2px", fontWeight: "bold" }}>
                                                * {note.text || note}
                                            </p>
                                        ))}
                                    </div>
                                )}

                                <p style={{ marginBottom: "2px" }}>1. ກະລຸນາກວດສິນຄ້າໃຫ້ລະອຽດກ່ອນຮັບສິນຄ້າ</p>
                                <p style={{ marginBottom: "2px" }}>2. ກໍລະນີໂອນເງິນ ກະລຸນາແຈ້ງສລິບການຈ່າຍເງິນ</p>
                                <p>3. ສິນຄ້າທີ່ຂາຍແລ້ວບໍ່ຮັບປ່ຽນ ຫຼື ຄືນເງິນ</p>
                            </td>
                            <td style={{ border: "1px solid black", padding: "3px 6px", fontWeight: "bold", textAlign: "right" }}>ລວມ</td>
                            <td style={{ border: "1px solid black", padding: "3px 6px", textAlign: "right" }}>{formattedNumber(data.total + (data.discount || 0))}</td>
                        </tr>
                        <tr>
                            <td style={{ border: "1px solid black", padding: "3px 6px", fontWeight: "bold", textAlign: "right" }}>ສ່ວນຫຼຸດ</td>
                            <td style={{ border: "1px solid black", padding: "3px 6px", textAlign: "right" }}>
                                {data.discount > 0 ? `-${formattedNumber(data.discount)}` : "0"}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ border: "1px solid black", padding: "3px 6px", fontWeight: "bold", textAlign: "right", backgroundColor: "#f8fafc" }}>ຍອດເງິນລວມ</td>
                            <td style={{ border: "1px solid black", padding: "3px 6px", textAlign: "right", fontWeight: "bold", backgroundColor: "#f8fafc" }}>
                                {formattedNumber(data.total)}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ border: "1px solid black", padding: "3px 6px", fontWeight: "bold", textAlign: "right" }}>ຮັບເງິນ</td>
                            <td style={{ border: "1px solid black", padding: "3px 6px", textAlign: "right", fontWeight: "bold" }}>
                                {formattedNumber(data.paidAmount)} LAK
                            </td>
                        </tr>
                        <tr>
                            <td style={{ border: "1px solid black", padding: "3px 6px", fontWeight: "bold", textAlign: "right" }}>ເງິນທອນ</td>
                            <td style={{ border: "1px solid black", padding: "3px 6px", textAlign: "right" }}>{formattedNumber(data.change)} LAK</td>
                        </tr>
                        {data.paymentMethod === 'DEBT' && (
                            <tr>
                                <td colSpan={3} style={{ border: "1px solid black", padding: "3px 6px", fontWeight: "bold", textAlign: "right", color: "#dc2626" }}>ໜີ້ຄົງເຫຼືອ</td>
                                <td style={{ border: "1px solid black", padding: "3px 6px", textAlign: "right", fontWeight: "bold", color: "#dc2626" }}>
                                    {formattedNumber(data.remainingAmount)} LAK
                                </td>
                            </tr>
                        )}
                    </tfoot>
                </table>
            </div>

            {/* Footer Signatures */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10mm", fontSize: "1em", paddingLeft: "6mm", paddingRight: "6mm" }}>
                <div style={{ textAlign: "center", flex: 1 }}>
                    <p style={{ marginBottom: "10mm", borderBottom: "1px dotted #cbd5e1", paddingBottom: "3px" }}>
                        {format(data.createdAt, "dd/MM/yyyy")}
                    </p>
                    <p style={{ fontWeight: "bold" }}>ຜູ້ຈ່າຍເງິນ / Customer</p>
                </div>
                <div style={{ textAlign: "center", flex: 1 }}>
                    <p style={{ marginBottom: "10mm", borderBottom: "1px dotted #cbd5e1", paddingBottom: "3px" }}>
                        {format(data.createdAt, "dd/MM/yyyy")}
                    </p>
                    <p style={{ fontWeight: "bold" }}>ຜູ້ຮັບເງິນ / Cashier</p>
                </div>
            </div>

            {/* Powered By */}
            <div style={{ marginTop: "8mm", textAlign: "center", fontSize: "0.8em", color: "#94a3b8" }}>
                Powered by SKV GROUP
            </div>
        </div>
    );
}
