import { useRef, useEffect, useState } from "react";
import { useReactToPrint } from "react-to-print";
import Bill58mm from "./bill-templates/Bill58mm";
import Bill80mm from "./bill-templates/Bill80mm";
import BillA5 from "./bill-templates/BillA5";
import BillA4 from "./bill-templates/BillA4";
import type { BillConfig, BillPrintData } from "./bill-templates/billPrintUtils";

interface PrintBillProps {
    data: BillPrintData | null;
    clearData: () => void;
    overridePaperSize?: BillConfig["paperSize"];
}

export default function PrintBill({ data, clearData, overridePaperSize }: PrintBillProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const [config] = useState<BillConfig>(() => {
        const saved = localStorage.getItem("billConfig");
        if (saved) {
            try {
                return JSON.parse(saved) as BillConfig;
            } catch (e) {
                console.error("Failed to load bill config", e);
            }
        }

        return {
            paperSize: "80mm",
            showLogo: true,
            showQR: true,
            showNotes: true,
            fontSize: "medium",
        };
    });

    const handlePrint = useReactToPrint({
        contentRef: contentRef,
        documentTitle: `Bill-${data?.orderId}`,
        onAfterPrint: () => {
            clearData();
        },
    });

    useEffect(() => {
        if (data) {
            handlePrint();
        }
    }, [data, handlePrint]);

    if (!data) return null;

    // Render appropriate bill template based on paper size
    const renderBillTemplate = () => {
        const paperSize = overridePaperSize ?? config.paperSize;
        const templateProps = { data, config };

        switch (paperSize) {
            case "58mm":
                return <Bill58mm {...templateProps} />;
            case "80mm":
                return <Bill80mm {...templateProps} />;
            case "A5":
                return <BillA5 {...templateProps} />;
            case "A4":
                return <BillA4 {...templateProps} />;
            default:
                return <Bill80mm {...templateProps} />;
        }
    };

    return (
        <div className="hidden">
            <div ref={contentRef}>
                {renderBillTemplate()}
            </div>
        </div>
    );
}
