import { useRef, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { format } from "date-fns";
import { S3_BUCKET_URL } from "@/lib/constant";

interface PrintDebtInvoiceProps {
    data: any | null; // Using any for Order to be flexible, but ideally interface
    clearData: () => void;
}

const formattedNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
};

export default function PrintDebtInvoice({ data, clearData }: PrintDebtInvoiceProps) {
    const contentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: contentRef,
        documentTitle: `Debt-Invoice-${data?.orderId}`,
        onAfterPrint: () => {
            clearData();
        },
    });

    useEffect(() => {
        if (data) {
            handlePrint();
        }
    }, [data]);

    if (!data) return null;

    const tenant = data.tenantId || {};
    const customer = data.customerId || {};
    const items = data.items || [];

    return (
        <div className="hidden">
            <div ref={contentRef} className="w-[148mm] h-[210mm] mx-auto  p-5 bg-white text-black font-lao">
                <div className="flex justify-between items-start">
                    <div className="w-[100px] h-[100px] flex items-center justify-center">
                        {/* Left Logo / QR */}
                        {tenant.logo ? (
                            typeof tenant.logo === 'string' && tenant.logo.includes('<svg') ? (
                                <div
                                    className="w-full h-full p-1 [&>svg]:w-full [&>svg]:h-full font-mono text-[10px]"
                                    dangerouslySetInnerHTML={{ __html: tenant.logo }}
                                />
                            ) : (
                                <img src={tenant.logo} alt="Shop Logo" className="object-contain w-full h-full" crossOrigin="anonymous" />
                            )
                        ) : (
                            <span className="text-xs text-slate-300">No Logo</span>
                        )}
                    </div>

                    <div className="flex-1 text-center px-4">
                        <p className="font-bold text-[20px]">{tenant.shopName || "SKV"}</p>
                        <p>{tenant.address || "Vientiane, Laos"}</p>
                        <p>Tel: {tenant.phone || "-"}</p>
                    </div>

                    <div className="w-[100px] h-[100px] flex items-center justify-center border border-slate-100">
                        {/* Right Logo / QR - Placeholder for now as users template had 2 */}
                        {tenant.bankQr ? (
                            <img src={S3_BUCKET_URL + tenant.bankQr} alt="Bank QR" className="object-contain w-full h-full" crossOrigin="anonymous" />
                        ) : (
                            <span className="text-xs text-slate-300">QR Code</span>
                        )}
                    </div>
                </div>

                <p className="text-[18px] font-bold my-3 text-center border-b border-black pb-2">ໃບແຈ້ງໜີ້ / Debt Invoice</p>

                <div className="text-[14px] flex justify-between mb-2">
                    <div>
                        <p>ເລກບິນ: <span className="font-bold">#{data.orderId}</span></p>
                        <p>ວັນທີ: {data.createdAt ? format(new Date(data.createdAt), "dd/MM/yyyy HH:mm") : "-"}</p>
                        <p>ຜູ້ຂາຍ <span className="font-bold">{data.cashierId?.username || "Staff"}</span></p>
                    </div>
                    <div className="text-right">
                        <p className="capitalize">ຊື່ລູກຄ້າ: <span className="font-bold">{customer?.name || "-"}</span></p>
                        <p className="capitalize">ເບີໂທ: <span className="font-bold">{customer?.phone || "-"}</span></p>
                        <p className="capitalize">ທີ່ຢູ່: <span className="font-bold">{customer?.address || "-"}</span></p>
                        <p>
                            ການຊຳລະ:{" "}
                            {data.paymentMethod === "DEBT"
                                ? "ບໍ່ທັນຊຳລະ"
                                : data.paymentMethod === "CASH"
                                    ? "ເງິນສົດ"
                                    : "ເງິນໂອນ"}
                        </p>
                        {/* If we have exchange rate stored in order, show it here */}
                        {/* <p>ອັດຕາແລກປ່ຽນ: {formattedNumber(data?.rate)}</p> */}
                    </div>
                </div>

                <div className="w-full mt-3">
                    <table className="w-full text-[12px] border-collapse">
                        <thead>
                            <tr>
                                <th className="border border-black px-2 py-1">NO</th>
                                <th className="border border-black px-2 py-1 text-left">ລາຍການ</th>
                                <th className="border border-black px-2 py-1">ຈຳນວນ</th>
                                <th className="border border-black px-2 py-1">ລາຄາ</th>
                                <th className="border border-black px-2 py-1">ລວມເງິນ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item: any, index: number) => (
                                <tr key={index}>
                                    <td className="border border-black text-center py-1">{index + 1}</td>
                                    <td className="border border-black px-2 py-1">{item.name}</td>
                                    <td className="border border-black text-center py-1">{item.quantity}</td>
                                    <td className="border border-black text-right px-2 py-1">
                                        {formattedNumber(item.price)}
                                    </td>
                                    <td className="border border-black text-right px-2 py-1">
                                        {formattedNumber(item.price * item.quantity)}
                                    </td>
                                </tr>
                            ))}

                            {/* Spacer Rows to fill space if needed */}
                            {[...Array(Math.max(0, 5 - items.length))].map((_, i) => (
                                <tr key={`spacer-${i}`}>
                                    <td className="border border-black py-4"></td>
                                    <td className="border border-black"></td>
                                    <td className="border border-black"></td>
                                    <td className="border border-black"></td>
                                    <td className="border border-black"></td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            {/* Footer Totals */}
                            <tr>
                                <td colSpan={3} rowSpan={6} className="border border-black p-2 align-top text-[10px]">
                                    <p className="font-bold underline mb-1">ໝາຍເຫດ:</p>
                                    <p>1. ກະລຸນາກວດສິນຄ້າໃຫ້ລະອຽດ ແລະ ຄົບຖ້ວນ.</p>
                                    <p>2. ກໍລະນີໂອນເງິນ ກະລຸນາແຈ້ງສລີບ.</p>
                                    <div className="mt-4 text-center">
                                        {/* Optional QR for Payment could go here if available */}
                                    </div>
                                </td>
                                <td className="border border-black px-2 py-1 font-bold text-right text-[11px]">ລວມ (Subtotal)</td>
                                <td className="border border-black px-2 py-1 text-right text-[11px] font-mono">{formattedNumber(data.total + (data.discount || 0))}</td>
                            </tr>
                            <tr>
                                <td className="border border-black px-2 py-1 font-bold text-right text-[11px]">ສ່ວນຫຼຸດ (Discount)</td>
                                <td className="border border-black px-2 py-1 text-right text-[11px] font-mono">{data.discount > 0 ? `-${formattedNumber(data.discount)}` : "0"}</td>
                            </tr>
                            <tr>
                                <td className="border border-black px-2 py-1 font-bold text-right text-[12px] bg-slate-50">ຍອດເງິນລວມ (Total)</td>
                                <td className="border border-black px-2 py-1 text-right font-bold text-[12px] bg-slate-50 font-mono">{formattedNumber(data.total)}</td>
                            </tr>
                            <tr>
                                <td className="border border-black px-2 py-1 font-bold text-right text-[11px]">ຮັບເງິນ (Received)</td>
                                <td className="border border-black px-2 py-1 text-right text-[11px] font-mono">{formattedNumber(data.paidAmount)}</td>
                            </tr>
                            <tr>
                                <td className="border border-black px-2 py-1 font-bold text-right text-[11px]">ເງິນທອນ (Change)</td>
                                <td className="border border-black px-2 py-1 text-right text-[11px] font-mono">{formattedNumber(data.change)}</td>
                            </tr>
                            {/* For Debt Invoice, we emphasize the Remaining Debt */}
                            <tr>
                                <td className="border border-black px-2 py-1 font-bold text-right text-[11px] text-red-600">ໜີ້ຄົງເຫຼື ອ (Debt)</td>
                                <td className="border border-black px-2 py-1 text-right text-[11px] font-bold text-red-600 font-mono">{formattedNumber(data.remainingAmount)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="flex items-start justify-between text-[12px] mt-8 px-4">
                    <div className="text-center w-1/3">
                        <p className="mb-8 font-mono border-b border-dotted border-slate-300 pb-1">{data.createdAt ? format(new Date(data.createdAt), "dd/MM/yyyy") : "..................."}</p>
                        <p className="font-bold">ຜູ້ຈ່າຍເງິນ / Customer</p>
                        <p className="text-[10px] mt-1 h-4">{customer.name !== "General Customer" ? customer.name : ""}</p>
                    </div>
                    <div className="text-center w-1/3">
                        <p className="mb-8 font-mono border-b border-dotted border-slate-300 pb-1">{data.createdAt ? format(new Date(data.createdAt), "dd/MM/yyyy") : format(new Date(), "dd/MM/yyyy")}</p>
                        <p className="font-bold">ຜູ້ຮັບເງິນ / Cashier</p>
                    </div>
                </div>

                <div className="mt-8 text-center text-[10px] text-slate-400">
                    Powered by SKV GROUP
                </div>
            </div>
        </div>
    );
}
