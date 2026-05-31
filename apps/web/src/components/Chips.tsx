interface ChipsProps {
  items: string[];
  /** Items in this set are highlighted as "shared" with the viewer. */
  shared?: Set<string>;
  max?: number;
}

export function Chips({ items, shared, max }: ChipsProps) {
  const shown = max ? items.slice(0, max) : items;
  if (shown.length === 0) return null;
  return (
    <div className="chips">
      {shown.map((item) => (
        <span
          key={item}
          className={`chip ${shared?.has(item.toLowerCase()) ? "shared" : ""}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}
