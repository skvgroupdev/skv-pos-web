import { format } from "date-fns";
import {
    formatBillNumber,
    getBillTenant,
    getNoteText,
    getPaymentMethodText,
    renderBillMedia,
    type BillConfig,
    type BillItem,
    type BillPrintData,
} from "./billPrintUtils";

interface BillA4Props {
    data: BillPrintData;
    config: BillConfig;
}

const fontMultipliers = {
    small: 1,
    medium: 1,
    large: 1.08,
};

export default function BillA4({ data, config }: BillA4Props) {
    const fontMultiplier = fontMultipliers[config.fontSize];
    const tenant = getBillTenant(data);
    const customer = data.customerId || {};
    const items = data.items || [];
    const discount = data.discount || 0;
    const remainingAmount = data.remainingAmount || 0;
    const showNotes = config.showNotes !== false;

    return (
        <div
            style={{
                width: "210mm",
                padding: "8mm",
                margin: "0 auto",
                backgroundColor: "white",
                color: "#000",
                fontSize: `calc(12px * ${fontMultiplier})`,
                boxSizing: "border-box",
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
                        print-color-adjust: exact;
                    }
                }
            `}</style>

            <div style={{ display: "grid", gridTemplateColumns: "96px 1fr 96px", gap: 14, alignItems: "center", marginBottom: 12 }}>
                <div style={{ minHeight: 96, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {config.showLogo && tenant.logo ? (
                        <div style={{ width: 96, height: 96, border: "1px solid #000", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                            {renderBillMedia(tenant.logo, "Logo", "Logo", "w-full h-full [&>svg]:w-full [&>svg]:h-full")}
                        </div>
                    ) : (
                        <div style={{ width: 96, height: 96 }} />
                    )}
                </div>

                <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 700, fontSize: `calc(24px * ${fontMultiplier})`, lineHeight: 1.1, marginBottom: 4 }}>
                        {tenant.shopName || "SKV Store"}
                    </div>
                    <div style={{ lineHeight: 1.45 }}>
                        {tenant.address || "Vientiane, Laos"}
                    </div>
                    <div style={{ lineHeight: 1.45 }}>Tel: {tenant.phone || "-"}</div>
                </div>

                <div style={{ minHeight: 96, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {config.showQR && tenant.bankQr ? (
                        <div style={{ width: 96, height: 96, border: "1px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                            {renderBillMedia(tenant.bankQr, "Payment QR", "QR", "w-full h-full [&>svg]:w-full [&>svg]:h-full")}
                        </div>
                    ) : (
                        <div style={{ width: 96, height: 96 }} />
                    )}
                </div>
            </div>

            <div style={{ borderTop: "1px ", borderBottom: "1px", padding: "4px 0", marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
                <span>ບິນ: #{data.orderId}</span>
                <span>{format(data.createdAt, "dd/MM/yyyy HH:mm")}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div style={{ border: "1px solid #000", padding: "10px 12px" }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>ຂໍ້ມູນລູກຄ້າ</div>
                    <div style={{ display: "grid", gap: 4 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <span>ຊື່</span>
                            <span style={{ textAlign: "right" }}>{customer?.name || "-"}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <span>ເບີ</span>
                            <span style={{ textAlign: "right" }}>{customer?.phone || "-"}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <span>ທີ່ຢູ່</span>
                            <span style={{ textAlign: "right" }}>{customer?.address || "-"}</span>
                        </div>
                    </div>
                </div>

                <div style={{ border: "1px solid #000", padding: "10px 12px" }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>ຂໍ້ມູນບິນ</div>
                    <div style={{ display: "grid", gap: 4 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <span>ຜູ້ຂາຍ</span>
                            <span style={{ textAlign: "right" }}>{data.cashierId?.username || "Staff"}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <span>ຊຳລະ</span>
                            <span style={{ textAlign: "right" }}>{getPaymentMethodText(data.paymentMethod)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <span>ສະຖານະ</span>
                            <span style={{ textAlign: "right" }}>{data.paymentMethod === "DEBT" ? "ຍັງມີຫນີ້" : "ຊຳລະແລ້ວ"}</span>
                        </div>
                    </div>
                </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
                <thead>
                    <tr>
                        <th style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "center" }}>#</th>
                        <th style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "left" }}>ລາຍການ</th>
                        <th style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "center" }}>ຈຳນວນ</th>
                        <th style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "right" }}>ລາຄາ</th>
                        <th style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "right" }}>ລວມ</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item: BillItem, index: number) => (
                        <tr key={index}>
                            <td style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "center" }}>{index + 1}</td>
                            <td style={{ border: "1px solid #000", padding: "5px 6px" }}>{item.name}</td>
                            <td style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "center" }}>{item.quantity}</td>
                            <td style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "right" }}>{formatBillNumber(item.price)}</td>
                            <td style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "right" }}>{formatBillNumber(item.price * item.quantity)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ display: "grid", gridTemplateColumns: showNotes ? "1.1fr 0.9fr" : "1fr", gap: 12, marginBottom: 14 }}>
                {showNotes && (
                    <div style={{ border: "1px solid #000", padding: "10px 12px" }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>ໝາຍເຫດ</div>
                        <div style={{ display: "grid", gap: 4 }}>
                            {data.notes && data.notes.length > 0 ? (
                                data.notes.map((note, index: number) => (
                                    <div key={index} style={{ display: "flex", gap: 6 }}>
                                        <span>•</span>
                                        <span>{getNoteText(note)}</span>
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <span>•</span>
                                        <span>ກະລຸນາກວດສິນຄ້າໃຫ້ລະອຽດກ່ອນຮັບສິນຄ້າ</span>
                                    </div>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <span>•</span>
                                        <span>ກໍລະນີໂອນເງິນ ກະລຸນາແຈ້ງສລິບການຈ່າຍເງິນ</span>
                                    </div>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <span>•</span>
                                        <span>ສິນຄ້າທີ່ຂາຍແລ້ວບໍ່ຮັບປ່ຽນ ຫຼື ຄືນເງິນ</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                <div style={{ border: "1px solid #000", padding: "10px 12px" }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>ສະຫຼຸບຍອດ</div>
                    <div style={{ display: "grid", gap: 4 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <span>ລວມ</span>
                            <span>{formatBillNumber(data.total + discount)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <span>ສ່ວນຫຼຸດ</span>
                            <span>{discount > 0 ? `-${formatBillNumber(discount)}` : "0"}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontWeight: 700, borderTop: "1px solid #000", paddingTop: 4, marginTop: 2 }}>
                            <span>ຍອດລວມ</span>
                            <span>{formatBillNumber(data.total)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <span>ຮັບເງິນ</span>
                            <span>{formatBillNumber(data.paidAmount)} LAK</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <span>ເງິນທອນ</span>
                            <span>{formatBillNumber(data.change)} LAK</span>
                        </div>
                        {data.paymentMethod === "DEBT" && (
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontWeight: 700 }}>
                                <span>ໜີ້ຄົງເຫຼືອ</span>
                                <span>{formatBillNumber(remainingAmount)} LAK</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ border: "1px ", padding: "10px 12px", marginBottom: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontWeight: 700 }}>ຜູ້ສົ່ງ</div>
                        <div style={{ height: 40, borderBottom: "1px dotted #000", marginBottom: 6 }} />
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontWeight: 700 }}>ຜູ້ຮັບ </div>
                        <div style={{ height: 40, borderBottom: "1px dotted #000", marginBottom: 6 }} />
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontWeight: 700 }}>ຜູ້ຈ່າຍເງິນ </div>
                        <div style={{ height: 40, borderBottom: "1px dotted #000", marginBottom: 6 }} />
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontWeight: 700 }}>ຜູ້ຮັບເງິນ</div>
                        <div style={{ height: 40, borderBottom: "1px dotted #000", marginBottom: 6 }} />
                    </div>
                </div>
            </div>

            <div style={{ textAlign: "center", fontSize: "0.84em" }}>Powered by SKV GROUP</div>
        </div>
    );
}
