import { Bird, Footprints, Mountain, Sprout, Check } from 'lucide-react';

const icons = { walking: Footprints, hiking: Mountain, gardening: Sprout, birdwatching: Bird };

export default function ActivityCard({ activity, selected, onSelect }) {
  const Icon = icons[activity.id];
  return (
    <button
      type="button"
      className={`activity-card ${selected ? 'selected' : ''} ${activity.color}`}
      onClick={() => onSelect(activity.id)}
      aria-pressed={selected}
    >
      <span className="activity-icon"><Icon size={23} strokeWidth={1.8} /></span>
      <span className="activity-copy">
        <strong>{activity.label}</strong>
        <small>{activity.subtitle}</small>
      </span>
      <span className="selection-mark">{selected && <Check size={14} />}</span>
    </button>
  );
}