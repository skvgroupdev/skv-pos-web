import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface CreatableSelectProps {
    items: { value: string; label: string }[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    onCreate?: (value: string) => void;
}

export function CreatableSelect({ items, value, onValueChange, placeholder = "Select...", onCreate }: CreatableSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [searchValue, setSearchValue] = React.useState("")

    // Custom filter to ensure we can see the "Create" option even if Command thinks it doesn't match
    // Actually Command automatically filters children based on value/label.
    // If we want to force "Create" to show, we might need to bypass Command's internal filtering or ensure our items match.
    // However, the issue described is "delay" or "need to delete char".
    // This often happens if the "Create" item is filtered out by Command because `value` (searchValue) matches nothing?
    // No, `searchValue` is what we type.

    // The issue might be that CommandInput updates `searchValue` but the `CommandItem` for "Create" isn't rendered yet or filtered out.
    // We should use `filter` prop on Command to control matching? 
    // Or simpler: Just ensure `filteredItems` logic is correct and Command doesn't hide our manual "Create" item.

    // Let's rely on `Command`'s internal filtering for the list, 
    // BUT for the "Create" button, we must ensure it passes the filter.
    // One trick is to give the "Create" item a value that ALWAYS matches or disable filtering for it?
    // Actually, we can use `commandProps={{ shouldFilter: false }}` (if exposed) or better:
    // Pass `forceMount` to CommandItem? No.

    // Alternative: We manually filter `items` and render them.
    // If we use standard `Command`, it filters by text.
    // The `Create` item has value `searchValue`. If we type "A", it has value "A". "A" matches "A". It should show.
    // Maybe the issue is React state lag?

    // Let's try to just render the items and force the Create button outside the strict filtering group if needed, 
    // OR just fix how `filteredItems` is calculated / used.

    // Wait, the user said "need to delete 1 char". This implies standard filter logic might be aggressive or off-sync.
    // `Command` from `cmdk` (shadcn) handles filtering internally by default.
    // If we map `filteredItems` ourselves, we are double filtering (once here, once in Command).
    // Let's REMOVE the manual filtering here and let Command handle it, 
    // BUT we need to know if we should show "Create".

    // Strategy:
    // 1. Let Command handle filtering of existing items.
    // 2. We just need to know if the search value exists in the items to decide showing "Create".

    const doesExist = items.some(item => item.label.toLowerCase() === searchValue.toLowerCase());
    const showCreate = onCreate && searchValue.length > 0 && !doesExist;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {value
                        ? items.find((item) => item.value === value)?.label || value
                        : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput placeholder={placeholder} onValueChange={setSearchValue} />
                    <CommandList>
                        <CommandEmpty>No item found.</CommandEmpty>
                        <CommandGroup>
                            {items.map((item) => (
                                <CommandItem
                                    key={item.value}
                                    value={item.label}
                                    onSelect={() => {
                                        onValueChange(item.value)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === item.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {item.label}
                                </CommandItem>
                            ))}

                            {/* Force the Create item to always display if we determined it should, 
                                but Command might still filter it out if we don't handle it. 
                                Trick: Use `forceMount` if available or give it a value that matches everything? 
                                Actually, `cmdk` `CommandItem` is filtered by its text content. 
                                The text is `Create "{searchValue}"`. 
                                If searchValue is "ABC", text is `Create "ABC"`. It matches "ABC". It should show.
                            */}
                            {showCreate && (
                                <CommandItem
                                    key="create-new"
                                    value={`Create "${searchValue}"`}
                                    onSelect={() => {
                                        onCreate(searchValue);
                                        onValueChange(searchValue);
                                        setOpen(false);
                                    }}
                                    className="text-blue-600 cursor-pointer"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create "{searchValue}"
                                </CommandItem>
                            )}

                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
