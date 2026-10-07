export default function OptionPill({ selected, onClick, children, detail }) {
  return (
    <button type="button" className={`option-pill ${selected ? 'selected' : ''}`} onClick={onClick} aria-pressed={selected}>
      <strong>{children}</strong>
      {detail && <small>{detail}</small>}
    </button>
  );
}