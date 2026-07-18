import * as React from "react";
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isWithinInterval,
    startOfWeek,
    endOfWeek,
    startOfYear,
    subDays,
    isBefore,
    parse,
    isValid
} from "date-fns";
import { th } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import type { DateRange } from "react-day-picker";

interface DateRangePickerProps {
    className?: string;
    date?: DateRange;
    onSelect: (range: DateRange | undefined) => void;
}

export function DateRangePicker({
    className,
    date,
    onSelect,
}: DateRangePickerProps) {
    const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());
    const [hoverDate, setHoverDate] = React.useState<Date | null>(null);
    const [pendingFrom, setPendingFrom] = React.useState<Date | null>(null);

    // Manual Input State
    const [fromValue, setFromValue] = React.useState("");
    const [toValue, setToValue] = React.useState("");
    const activeRange: DateRange | undefined = pendingFrom
        ? { from: pendingFrom, to: undefined }
        : date;

    // Sync state with props
    React.useEffect(() => {
        if (date?.from) {
            setCurrentMonth(date.from);
            setFromValue(format(date.from, "dd/MM/yyyy"));
        } else {
            setFromValue("");
        }
        if (date?.to) {
            setToValue(format(date.to, "dd/MM/yyyy"));
        } else {
            setToValue("");
        }
    }, [date]);

    const presets = [
        {
            label: "ມື້ນີ້",
            getValue: () => ({ from: new Date(), to: new Date() }),
        },
        {
            label: "ມື້ວານ",
            getValue: () => {
                const yesterday = subDays(new Date(), 1);
                return { from: yesterday, to: yesterday };
            },
        },
        {
            label: "7 ມື້ຜ່ານມາ",
            getValue: () => ({
                from: subDays(new Date(), 6),
                to: new Date(),
            }),
        },
        {
            label: "30 ມື້ຜ່ານມາ",
            getValue: () => ({
                from: subDays(new Date(), 29),
                to: new Date(),
            }),
        },
        {
            label: "ເດືອນນີ້",
            getValue: () => ({
                from: startOfMonth(new Date()),
                to: new Date(),
            }),
        },
        {
            label: "ເດືອນແລ້ວ",
            getValue: () => {
                const lastMonth = subMonths(new Date(), 1);
                return {
                    from: startOfMonth(lastMonth),
                    to: endOfMonth(lastMonth),
                };
            },
        },
        {
            label: "ປີນີ້",
            getValue: () => ({
                from: startOfYear(new Date()),
                to: new Date(),
            }),
        },
    ];

    const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFromValue(e.target.value);
        const parsedDate = parse(e.target.value, "dd/MM/yyyy", new Date());
        if (isValid(parsedDate)) {
            setPendingFrom(null);
            const newRange = { from: parsedDate, to: date?.to };
            onSelect(newRange);
            setCurrentMonth(parsedDate);
        }
    };

    const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setToValue(e.target.value);
        const parsedDate = parse(e.target.value, "dd/MM/yyyy", new Date());
        if (isValid(parsedDate)) {
            setPendingFrom(null);
            const newRange = { from: date?.from, to: parsedDate };
            onSelect(newRange);
        }
    };

    const onDayClick = (day: Date) => {
        if (!pendingFrom) {
            setPendingFrom(day);
            onSelect({ from: day, to: undefined });
            return;
        }

        const completedRange = isBefore(day, pendingFrom)
            ? { from: day, to: pendingFrom }
            : { from: pendingFrom, to: day };
        setPendingFrom(null);
        onSelect(completedRange);
    };

    const isSelected = (day: Date) => {
        if (!activeRange?.from) return false;
        if (isSameDay(day, activeRange.from)) return true;
        if (activeRange.to && isSameDay(day, activeRange.to)) return true;
        return false;
    };

    const isInRange = (day: Date) => {
        if (!activeRange?.from || !activeRange?.to) return false;
        return isWithinInterval(day, { start: activeRange.from, end: activeRange.to });
    };

    const isHoverInRange = (day: Date) => {
        if (!activeRange?.from || activeRange.to || !hoverDate) return false;
        const rangeStart = isBefore(hoverDate, activeRange.from) ? hoverDate : activeRange.from;
        const rangeEnd = isBefore(hoverDate, activeRange.from) ? activeRange.from : hoverDate;
        return isWithinInterval(day, { start: rangeStart, end: rangeEnd });
    };

    // Calendar Generation Logic
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ["ທິດ", "ຈັນ", "ອັງຄານ", "ພຸດ", "ພະຫັດ", "ສຸກ", "ເສົາ"]; // Lao Days

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover onOpenChange={(open) => { if (!open) setPendingFrom(null); }}>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[260px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {activeRange?.from ? (
                            activeRange.to ? (
                                <>
                                    {format(activeRange.from, "dd/MM/yyyy")} -{" "}
                                    {format(activeRange.to, "dd/MM/yyyy")}
                                </>
                            ) : (
                                format(activeRange.from, "dd/MM/yyyy")
                            )
                        ) : (
                            <span>ເລືອກຊ່ວງເວລາ</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <div className="flex flex-col sm:flex-row">
                        {/* Sidebar Presets */}
                        <div className="flex flex-col gap-1 p-3 border-r border-slate-100 min-w-[140px] bg-slate-50/50">
                            <p className="text-xs font-semibold text-slate-500 mb-2 px-2 uppercase tracking-wider">
                                ເລືອກດ່ວນ
                            </p>
                            {presets.map((preset) => (
                                <Button
                                    key={preset.label}
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start font-normal text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                                    onClick={() => {
                                        const range = preset.getValue();
                                        setPendingFrom(null);
                                        onSelect(range);
                                        if (range.from) setCurrentMonth(range.from);
                                    }}
                                >
                                    {preset.label}
                                </Button>
                            ))}
                        </div>

                        {/* Custom Calendar */}
                        <div className="p-4 w-[320px]">
                            {/* Manual Inputs */}
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <div className="grid gap-1">
                                    <Label htmlFor="from">ຈາກວັນທີ</Label>
                                    <Input
                                        id="from"
                                        type="text"
                                        value={fromValue}
                                        onChange={handleFromChange}
                                        placeholder="dd/mm/yyyy"
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="to">ຫາວັນທີ</Label>
                                    <Input
                                        id="to"
                                        type="text"
                                        value={toValue}
                                        onChange={handleToChange}
                                        placeholder="dd/mm/yyyy"
                                        className="h-8 text-xs"
                                    />
                                </div>
                            </div>

                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 bg-transparent border-0 opacity-50 hover:opacity-100"
                                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="text-sm font-medium">
                                    {format(currentMonth, "MMMM yyyy", { locale: th })}
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 bg-transparent border-0 opacity-50 hover:opacity-100"
                                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Days Header */}
                            <div className="grid grid-cols-7 mb-2 text-center">
                                {weekDays.map((day) => (
                                    <div key={day} className="text-[0.8rem] font-medium text-slate-500">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Days Grid */}
                            <div className="grid grid-cols-7 gap-y-2">
                                {calendarDays.map((day) => {
                                    const isSelectedDay = isSelected(day);
                                    const isRangeDay = isInRange(day) || isHoverInRange(day);
                                    const isOutsideMonth = !isSameMonth(day, currentMonth);

                                    return (
                                        <div
                                            key={day.toString()}
                                            className={cn(
                                                "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                                                isRangeDay && !isSelectedDay && "bg-indigo-50 first:rounded-l-md last:rounded-r-md"
                                            )}
                                        >
                                            <button
                                                onClick={() => onDayClick(day)}
                                                onMouseEnter={() => setHoverDate(day)}
                                                onMouseLeave={() => setHoverDate(null)}
                                                className={cn(
                                                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md transition-all",
                                                    isSelectedDay && "bg-indigo-600 text-white hover:bg-indigo-600 hover:text-white focus:bg-indigo-600 focus:text-white",
                                                    !isSelectedDay && !isRangeDay && "hover:bg-slate-100 hover:text-slate-900",
                                                    isOutsideMonth && "text-slate-300 opacity-50 bg-transparent",
                                                    !isOutsideMonth && !isSelectedDay && !isRangeDay && "text-slate-900"
                                                )}
                                            >
                                                {format(day, "d")}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
