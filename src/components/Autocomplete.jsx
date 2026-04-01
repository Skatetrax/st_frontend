import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Form } from "react-bootstrap";

const MIN_CHARS = 3;
const MAX_SUGGESTIONS = 15;

const dropdownStyle = {
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  zIndex: 1050,
  background: "#26272b",
  border: "1px solid #2d2d36",
  borderTop: "none",
  borderRadius: "0 0 0.375rem 0.375rem",
  maxHeight: 260,
  overflowY: "auto",
};

const itemBase = {
  padding: "0.45rem 0.75rem",
  cursor: "pointer",
  borderBottom: "1px solid #2d2d36",
};

/**
 * Generic type-ahead autocomplete.
 *
 * Required props:
 *   items       - full array of objects
 *   value       - currently selected key
 *   onChange    - called with selected key (or "" on clear)
 *   getKey      - item => unique key
 *   getLabel    - item => display string
 *   matchFn     - (item, lowerCaseQuery) => boolean
 *
 * Optional:
 *   onSelect    - called with full item object on selection (for side-effects)
 *   getSubLabel - item => secondary display line (or falsy to skip)
 *   placeholder - input placeholder text
 *   className   - extra class for the input element
 */
export default function Autocomplete({
  items = [],
  value,
  onChange,
  onSelect,
  getKey,
  getLabel,
  getSubLabel,
  matchFn,
  placeholder = "Search...",
  className = "",
}) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const wrapperRef = useRef(null);
  const listRef = useRef(null);

  const itemMap = useMemo(
    () => Object.fromEntries(items.map((it) => [getKey(it), it])),
    [items, getKey],
  );

  useEffect(() => {
    if (value && itemMap[value]) {
      setText(getLabel(itemMap[value]));
    } else if (!value) {
      setText("");
    }
  }, [value, itemMap, getLabel]);

  const suggestions = useMemo(() => {
    if (text.length < MIN_CHARS) return [];
    const q = text.toLowerCase();
    return items.filter((it) => matchFn(it, q)).slice(0, MAX_SUGGESTIONS);
  }, [text, items, matchFn]);

  const selectItem = useCallback(
    (item) => {
      setText(getLabel(item));
      onChange(getKey(item));
      onSelect?.(item);
      setOpen(false);
      setHighlightIdx(-1);
    },
    [onChange, onSelect, getKey, getLabel],
  );

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);
    setOpen(val.length >= MIN_CHARS);
    setHighlightIdx(-1);
    if (!val) {
      onChange("");
      onSelect?.(null);
    }
  };

  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) {
      if (e.key === "Escape") setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIdx >= 0 && suggestions[highlightIdx]) {
        selectItem(suggestions[highlightIdx]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (highlightIdx >= 0 && listRef.current) {
      const el = listRef.current.children[highlightIdx];
      if (el) el.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIdx]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <Form.Control
        type="text"
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (text.length >= MIN_CHARS) setOpen(true); }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div ref={listRef} style={dropdownStyle}>
          {suggestions.map((item, i) => {
            const sub = getSubLabel?.(item);
            return (
              <div
                key={getKey(item)}
                style={{
                  ...itemBase,
                  background: i === highlightIdx ? "#3b3b44" : "transparent",
                }}
                onMouseEnter={() => setHighlightIdx(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectItem(item);
                }}
              >
                <div style={{ color: "#f3f4f6", fontSize: "0.95rem" }}>
                  {getLabel(item)}
                </div>
                {sub && (
                  <div style={{ color: "#6b7280", fontSize: "0.78rem" }}>
                    {sub}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
