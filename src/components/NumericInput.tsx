import React, { useState } from 'react';
import { Input } from "@/components/ui/input";

interface NumericInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    formatThousands?: boolean;
    value: number | string;
    onValueChange: (value: number) => void;
}

const formatNumberText = (value: string) => {
    if (!value) return "";

    const [integerPart, decimalPart] = value.split(".");
    const formattedInteger = Number(integerPart || 0).toLocaleString("en-US");

    if (value.endsWith(".")) return `${formattedInteger}.`;
    if (decimalPart !== undefined) return `${formattedInteger}.${decimalPart}`;
    return formattedInteger;
};

const getDisplayValue = (value: number | string, formatThousands: boolean) => {
    if (value === undefined || value === null || value === "") return "";

    const numericValue = typeof value === "string" ? parseFloat(value) : value;
    if (Number.isNaN(numericValue)) return "";

    return formatThousands
        ? formatNumberText(String(numericValue))
        : numericValue.toLocaleString("en-US");
};

export const NumericInput = ({ formatThousands = false, value, onValueChange, className, onBlur, onFocus, ...props }: NumericInputProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const [localValue, setLocalValue] = useState(() => getDisplayValue(value, formatThousands));
    const displayValue = isFocused ? localValue : getDisplayValue(value, formatThousands);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const numericString = rawValue.replace(/,/g, '');

        // Allow digits, one dot, and empty string
        if (rawValue === '' || /^\d*\.?\d*$/.test(numericString)) {
            setLocalValue(formatThousands ? formatNumberText(numericString) : rawValue);

            if (numericString === '') {
                onValueChange(0);
            } else if (numericString !== '.' && !numericString.endsWith('.')) {
                // Only trigger update if it's a valid complete number
                // But we still update local state above to allow typing "."
                onValueChange(parseFloat(numericString));
            }
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        if (displayValue) {
            const localValue = displayValue;
            const numeric = parseFloat(localValue.replace(/,/g, ''));
            if (!isNaN(numeric)) {
                setLocalValue(formatThousands ? formatNumberText(String(numeric)) : numeric.toLocaleString('en-US'));
            }
        }
        onBlur?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setLocalValue(displayValue);
        setIsFocused(true);
        onFocus?.(e);
    };

    return (
        <Input
            {...props}
            type="text"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            className={className}
        />
    );
};
