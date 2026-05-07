import { useRef, useEffect, useState } from "react";
import { useReactToPrint } from "react-to-print";
import Bill58mm from "./bill-templates/Bill58mm";
import Bill80mm from "./bill-templates/Bill80mm";
import BillA5 from "./bill-templates/BillA5";
import BillA4 from "./bill-templates/BillA4";

interface PrintBillProps {
    data: any | null; // Using any for Order to be flexible, but ideally interface
    clearData: () => void;
}

interface BillConfig {
    paperSize: "58mm" | "80mm" | "A5" | "A4";
    showLogo: boolean;
    showQR: boolean;
    showNotes: boolean;
    fontSize: "small" | "medium" | "large";
}

export default function PrintBill({ data, clearData }: PrintBillProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const [config, setConfig] = useState<BillConfig>({
        paperSize: "80mm",
        showLogo: true,
        showQR: true,
        showNotes: true,
        fontSize: "medium",
    });

    useEffect(() => {
        const saved = localStorage.getItem("billConfig");
        if (saved) {
            try {
                setConfig(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load bill config", e);
            }
        }
    }, []);


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
    }, [data]);

    if (!data) return null;

    // Render appropriate bill template based on paper size
    const renderBillTemplate = () => {
        const templateProps = { data, config };

        switch (config.paperSize) {
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
