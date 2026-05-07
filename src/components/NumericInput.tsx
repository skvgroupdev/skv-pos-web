import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";

interface NumericInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value: number | string;
    onValueChange: (value: number) => void;
}

export const NumericInput = ({ value, onValueChange, className, ...props }: NumericInputProps) => {
    // Local state to handle the input display
    const [localValue, setLocalValue] = useState('');

    // Sync local state with prop value when prop value changes externally
    useEffect(() => {
        if (value === undefined || value === null) {
            setLocalValue('');
            return;
        }

        // Only update local value if it doesn't match the current numeric value
        // This prevents the cursor from jumping or decimals disappearing while typing
        const numericLocal = parseFloat(localValue.replace(/,/g, ''));
        const numericProp = typeof value === 'string' ? parseFloat(value) : value;

        if (isNaN(numericLocal) || Math.abs(numericLocal - numericProp) > Number.EPSILON) {
            setLocalValue(Number(numericProp).toLocaleString('en-US'));
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const numericString = rawValue.replace(/,/g, '');

        // Allow digits, one dot, and empty string
        if (rawValue === '' || /^\d*\.?\d*$/.test(numericString)) {
            setLocalValue(rawValue);

            if (numericString === '') {
                onValueChange(0);
            } else if (numericString !== '.' && !numericString.endsWith('.')) {
                // Only trigger update if it's a valid complete number
                // But we still update local state above to allow typing "."
                onValueChange(parseFloat(numericString));
            }
        }
    };

    const handleBlur = () => {
        if (localValue) {
            const numeric = parseFloat(localValue.replace(/,/g, ''));
            if (!isNaN(numeric)) {
                setLocalValue(numeric.toLocaleString('en-US'));
            }
        }
    };

    return (
        <Input
            {...props}
            type="text"
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            className={className}
        />
    );
};
