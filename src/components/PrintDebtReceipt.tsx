import { useEffect } from "react";
import { format } from "date-fns";

interface PrintDebtReceiptProps {
    data: any;
    clearData: () => void;
}

export default function PrintDebtReceipt({ data, clearData }: PrintDebtReceiptProps) {
    useEffect(() => {
        if (data) {
            setTimeout(() => {
                window.print();
                clearData();
            }, 100);
        }
    }, [data, clearData]);

    if (!data) return null;

    const formatCurrency = (amount: number) => `${amount.toLocaleString()}₭`;

    return (
        <div className="print-only fixed inset-0 bg-white z-[9999] p-8">
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .print-only, .print-only * { visibility: visible; }
                    .print-only { position: absolute; left: 0; top: 0; width: 100%; }
                    @page { margin: 0.5cm; }
                }
            `}</style>

            <div className="max-w-[80mm] mx-auto font-mono text-sm">
                {/* Header */}
                <div className="text-center border-b-2 border-dashed border-slate-300 pb-4 mb-4">
                    <h1 className="text-lg font-bold">ໃບຮັບຊຳລະໜີ້</h1>
                    <p className="text-xs">DEBT PAYMENT RECEIPT</p>
                    <p className="text-xs mt-2">Receipt: #{data.receiptNumber}</p>
                    <p className="text-xs">{format(new Date(data.createdAt), "dd/MM/yyyy HH:mm")}</p>
                </div>

                {/* Customer Info */}
                <div className="mb-4 space-y-1">
                    <div className="flex justify-between">
                        <span className="font-semibold">ລູກຄ້າ:</span>
                        <span>{data.customer?.name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold">ເບີໂທ:</span>
                        <span>{data.customer?.phone}</span>
                    </div>
                </div>

                {/* Transaction Details */}
                <div className="border-t border-b border-dashed border-slate-300 py-3 mb-3 space-y-2">
                    {data.order && (
                        <div className="flex justify-between">
                            <span>ບິນເລກທີ່:</span>
                            <span className="font-bold">#{data.order.orderId}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span>ຍອດກ່ອນຊຳລະ:</span>
                        <span className="text-red-600">{formatCurrency(data.balanceBefore)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                        <span>ຈຳນວນທີ່ຊຳລະ:</span>
                        <span className="text-green-600">{formatCurrency(data.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>ຍອດຫຼັງຊຳລະ:</span>
                        <span className={data.balanceAfter > 0 ? "text-red-600 font-bold" : "text-green-600"}>
                            {formatCurrency(data.balanceAfter)}
                        </span>
                    </div>
                </div>

                {/* Payment Method */}
                <div className="mb-3 space-y-1">
                    <div className="flex justify-between">
                        <span>ວິທີຊຳລະ:</span>
                        <span className="font-semibold">
                            {data.paymentMethod === "CASH" ? "ເງິນສົດ" : 
                             data.paymentMethod === "TRANSFER" ? "ໂອນເງິນ" : 
                             data.paymentMethod === "MIXED" ? "ປະສົມ" : "-"}
                        </span>
                    </div>
                    {data.reference && (
                        <div className="flex justify-between text-xs">
                            <span>ເລກອ້າງອິງ:</span>
                            <span>{data.reference}</span>
                        </div>
                    )}
                    {data.note && (
                        <div className="text-xs mt-2">
                            <span className="font-semibold">ໝາຍເຫດ: </span>
                            <span>{data.note}</span>
                        </div>
                    )}
                </div>

                {/* Processed By */}
                <div className="border-t border-dashed border-slate-300 pt-3 mb-4">
                    <div className="flex justify-between text-xs">
                        <span>ພະນັກງານ:</span>
                        <span className="font-semibold">{data.processedBy?.username || "-"}</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs mt-6 space-y-1">
                    <p className="font-semibold">ຂອບໃຈທີ່ຊຳລະໜີ້</p>
                    <p>THANK YOU FOR YOUR PAYMENT</p>
                    {data.balanceAfter > 0 && (
                        <p className="text-red-600 font-bold mt-2">
                            ຍອດຄົງເຫຼືອ: {formatCurrency(data.balanceAfter)}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
