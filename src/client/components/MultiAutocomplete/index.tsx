import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { mergeClassName, mergeStyle } from "src/client/components/MultiAutocomplete/constants";
import cssStyles from "src/client/components/MultiAutocomplete/style.module.css"

interface Option {
    label: string;
    value: string;
}

interface TagStyles {
    container?: CSSProperties;
    label?: CSSProperties;
    removeButton?: CSSProperties;
}

interface DropdownStyles {
    container?: CSSProperties;
    item?: CSSProperties;
    itemHovered?: CSSProperties;
    noResults?: CSSProperties;
}

interface MultiSelectStyles {
    root?: CSSProperties;
    inputWrapper?: CSSProperties;
    input?: CSSProperties;
    clearAllButton?: CSSProperties;
    chevron?: CSSProperties;
    tag?: TagStyles;
    dropdown?: DropdownStyles;
    label?: CSSProperties;
    placeholder?: CSSProperties;
}

interface MultiSelectAutocompleteProps {
    options: Option[];
    onChange: (values: Option[]) => void;
    onTextChange?: (value: string) => void;
    value?: Option[];
    placeholder?: string;
    label?: string;
    showClearAllButton?: boolean;
    showTagRemoveButton?: boolean;         // toggle cross on each tag
    disabled?: boolean;
    maxSelected?: number;
    noResultsText?: string;
    clearAllLabel?: string;
    styles?: MultiSelectStyles;
    className?: string;
}

export default function MultiSelectAutocomplete({
    options,
    onChange,
    onTextChange,
    value,
    placeholder = "Search or select…",
    label,
    showClearAllButton = true,
    showTagRemoveButton = true,
    disabled = false,
    maxSelected,
    noResultsText = "No options found",
    clearAllLabel = "Clear all",
    styles = {},
    className,
}: MultiSelectAutocompleteProps) {
    const [selected, setSelected] = useState<Option[]>(value ?? []);
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const [focused, setFocused] = useState(false);
    const [dropUp, setDropUp] = useState(false);

    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Sync external value
    useEffect(() => {
        if (value !== undefined) setSelected(value);
    }, [value]);

    const filtered = options.filter(
        (o) =>
            !selected.find((s) => s.value === o.value) &&
            o.label.toLowerCase().includes(query.toLowerCase())
    );

    const commit = useCallback(
        (next: Option[]) => {
            setSelected(next);
            onChange(next);
        },
        [onChange]
    );

    const selectOption = (opt: Option) => {
        if (maxSelected && selected.length >= maxSelected) return;
        commit([...selected, opt]);
        setQuery("");
        setFocusedIndex(-1);
        inputRef.current?.focus();
    };

    const removeOption = (val: string) => {
        commit(selected.filter((s) => s.value !== val));
    };

    const clearAll = () => {
        commit([]);
        setQuery("");
        inputRef.current?.focus();
    };

    const calculateDropDirection = () => {
        if (!wrapperRef.current) return;
        const rect = wrapperRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const dropdownHeight = 280;
        setDropUp(spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
    };

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setOpen(false);
                setFocused(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Recalculate direction on scroll or resize while open
    useEffect(() => {
        if (!open) return;
        calculateDropDirection();
        const onUpdate = () => calculateDropDirection();
        window.addEventListener("scroll", onUpdate, true);
        window.addEventListener("resize", onUpdate);
        return () => {
            window.removeEventListener("scroll", onUpdate, true);
            window.removeEventListener("resize", onUpdate);
        };
    }, [open]);

    // Scroll focused item into view
    useEffect(() => {
        if (focusedIndex >= 0 && listRef.current) {
            const el = listRef.current.children[focusedIndex] as HTMLElement;
            el?.scrollIntoView({ block: "nearest" });
        }
    }, [focusedIndex]);

    useEffect(() => {
        if (onTextChange) onTextChange(query)
    }, [query])

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setFocusedIndex((i) => Math.min(i + 1, filtered.length - 1));
            if (!open) setOpen(true);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setFocusedIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && focusedIndex >= 0 && filtered[focusedIndex]) {
            e.preventDefault();
            selectOption(filtered[focusedIndex]);
        } else if (e.key === "Escape") {
            setOpen(false);
        } else if (e.key === "Backspace" && query === "" && selected.length > 0) {
            removeOption(selected[selected.length - 1].value);
        }
    };

    const isMaxReached = !!maxSelected && selected.length >= maxSelected;

    const wrapperClassName = mergeClassName(
        cssStyles.inputWrapper,
        focused ? cssStyles.inputWrapperFocused : undefined,
        disabled ? cssStyles.inputWrapperDisabled : undefined
    )

    const wrapperStyle = mergeStyle(
        styles.inputWrapper
    );

    return (
        <>

            <div
                ref={rootRef}
                className={`${className || ""} ${cssStyles.root}`}
                style={mergeStyle(styles.root)}
            >
                {label && (
                    <label className={`${cssStyles.label}`} style={mergeStyle(styles.label)}>{label}</label>
                )}

                {/* Input Wrapper */}
                <div
                    ref={wrapperRef}
                    className={wrapperClassName}
                    style={wrapperStyle}
                    onClick={() => {
                        if (!disabled) {
                            inputRef.current?.focus();
                            setOpen(true);
                            calculateDropDirection();
                        }
                    }}
                >
                    {/* Tags */}
                    {selected.map((opt) => (
                        <span
                            key={opt.value}
                            className={`${cssStyles.tagContainer}`}
                            style={mergeStyle(styles.tag?.container)}
                        >
                            <span className={`${cssStyles.tagLabel}`} style={mergeStyle(styles.tag?.label)}>
                                {opt.label}
                            </span>
                            {showTagRemoveButton && (
                                <button
                                    className={`${cssStyles.__msa_tag_rm} ${cssStyles.tagRemoveButton}`}
                                    style={mergeStyle(styles.tag?.removeButton)}
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        removeOption(opt.value);
                                    }}
                                    aria-label={`Remove ${opt.label}`}
                                    tabIndex={-1}
                                >
                                    ✕
                                </button>
                            )}
                        </span>
                    ))}

                    {/* Text input */}
                    {!isMaxReached && (
                        <input
                            ref={inputRef}
                            className={`${cssStyles.input}`}
                            style={mergeStyle(styles.input)}
                            value={query}
                            placeholder={selected.length === 0 ? placeholder : ""}
                            disabled={disabled}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setOpen(true);
                                setFocusedIndex(-1);
                            }}
                            onFocus={() => {
                                setFocused(true);
                                setOpen(true);
                                calculateDropDirection();
                            }}
                            onBlur={() => setFocused(false)}
                            onKeyDown={handleKeyDown}
                            role="combobox"
                            aria-expanded={open}
                            aria-autocomplete="list"
                            aria-haspopup="listbox"
                        />
                    )}

                    {/* Clear All */}
                    {showClearAllButton && selected.length > 0 && (
                        <button
                            className={`${cssStyles.__msa_clear} ${cssStyles.clearAll}`}
                            style={mergeStyle(styles.clearAllButton)}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                clearAll();
                            }}
                            tabIndex={-1}
                            aria-label="Clear all selections"
                        >
                            {clearAllLabel}
                        </button>
                    )}

                    {/* Chevron */}
                    <span
                        className={`${cssStyles.chevronWrap}`}
                        style={mergeStyle(styles.chevron, {
                            transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
                        })}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </span>
                </div>

                {/* Dropdown */}
                {open && !disabled && (
                    <ul
                        ref={listRef}
                        className={`${cssStyles.dropdownContainer} ${dropUp ? cssStyles.__msa_dropdown_up : cssStyles.__msa_dropdown_down} ${cssStyles.__msa_wrap}`}
                        role="listbox"
                        style={mergeStyle(
                            dropUp
                                ? { top: "auto", bottom: "calc(100% + 6px)", boxShadow: "0 -8px 32px rgba(0,0,0,0.5)" }
                                : {},
                            styles.dropdown?.container
                        )}
                    >
                        {filtered.length === 0 ? (
                            <li className={`${cssStyles.dropdownNoResults}`} style={mergeStyle(styles.dropdown?.noResults)}>
                                {noResultsText}
                            </li>
                        ) : (
                            filtered.map((opt, idx) => {
                                const isHovered = hoveredItem === opt.value;
                                const isFocused = focusedIndex === idx;
                                return (
                                    <li
                                        key={opt.value}
                                        role="option"
                                        aria-selected={false}
                                        className={`${cssStyles.dropdownItem} ${isHovered || isFocused ? cssStyles.dropdownItemHovered : ""}`}
                                        style={mergeStyle(
                                            styles.dropdown?.item,
                                            (isHovered || isFocused) ? styles.dropdown?.itemHovered : undefined
                                        )}
                                        onMouseEnter={() => { setHoveredItem(opt.value); setFocusedIndex(idx); }}
                                        onMouseLeave={() => setHoveredItem(null)}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            selectOption(opt);
                                        }}
                                    >
                                        <span>{opt.label}</span>
                                        {(isHovered || isFocused) && (
                                            <svg
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                /* UPDATED: Using theme-success or theme-info instead of hardcoded hex */
                                                stroke="var(--theme-success)"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </li>
                                );
                            })
                        )}
                    </ul>
                )}
            </div>
        </>
    );
}