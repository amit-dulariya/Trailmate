export const activities = [
  { id: 'walking', label: 'Walking', subtitle: 'A little fresh air', icon: 'footprints', emoji: '🚶', color: 'sage' },
  { id: 'hiking', label: 'Hiking', subtitle: 'Take the scenic route', icon: 'mountain', emoji: '🥾', color: 'moss' },
  { id: 'gardening', label: 'Gardening', subtitle: 'Get your hands dirty', icon: 'sprout', emoji: '🌱', color: 'clay' },
  { id: 'birdwatching', label: 'Birdwatching', subtitle: 'Slow down and listen', icon: 'bird', emoji: '🪶', color: 'sky' },
];

export const timeOptions = [
  { value: '15', label: '15 min', detail: 'A quick reset' },
  { value: '30', label: '30 min', detail: 'A little breathing room' },
  { value: '60', label: '1 hour', detail: 'Time to wander' },
  { value: '120', label: '2+ hours', detail: 'Make a day of it' },
];

export const skillOptions = [
  { value: 'beginner', label: 'Beginner', detail: 'Keep it easy and relaxed' },
  { value: 'intermediate', label: 'Intermediate', detail: 'Ready for a little more' },
];

const plans = {
  walking: {
    title: 'A mindful neighborhood walk',
    intro: 'Leave the rush behind and notice the little things on a gentle walk.',
    location: 'A nearby park, quiet street, or leafy campus path',
    prep: ['Pick a comfortable route with a clear turnaround point', 'Wear supportive shoes and bring water', 'Put your phone on silent for a few minutes'],
    checklist: ['Walk at a pace that feels comfortable', 'Notice five things you can see, hear, or smell', 'Pause somewhere green for two minutes', 'Return before you feel tired'],
    safety: ['Use sidewalks and marked paths where possible', 'Stay aware of traffic and your surroundings', 'Choose a well-lit route if going near dusk'],
  },
  hiking: {
    title: 'A trail worth taking',
    intro: 'Trade screen time for a little elevation, fresh air, and a new view.',
    location: 'A marked local trail or an easy nature reserve route',
    prep: ['Check trail conditions and weather before leaving', 'Pack water, a small snack, and a charged phone', 'Wear grippy footwear and comfortable layers'],
    checklist: ['Start with a steady, conversational pace', 'Follow marked paths and trail signs', 'Take a short rest at a safe viewpoint', 'Leave plants, rocks, and wildlife undisturbed'],
    safety: ['Tell someone your route and expected return time', 'Turn back if weather or trail conditions change', 'Avoid unfamiliar or closed trails'],
  },
  gardening: {
    title: 'A small patch of green',
    intro: 'Make something grow, one handful of soil at a time.',
    location: 'Your balcony, garden, community plot, or a few pots by a window',
    prep: ['Gather a pot, soil, seeds or a small plant', 'Keep gloves and a little water nearby', 'Choose a spot with light suited to your plant'],
    checklist: ['Loosen the soil and remove dry leaves', 'Plant seeds or gently repot one plant', 'Water lightly without flooding the soil', 'Clean your tools and admire your work'],
    safety: ['Use gloves when handling unfamiliar plants or soil', 'Lift heavy pots with care', 'Wash hands after gardening'],
  },
  birdwatching: {
    title: 'A quiet birdwatching break',
    intro: 'Slow your pace and let the birds come into focus.',
    location: 'A garden, tree-lined park, pond, or quiet outdoor space',
    prep: ['Bring water and binoculars if you have them', 'Wear comfortable, quiet clothing', 'Look up common local birds before heading out'],
    checklist: ['Stand or sit quietly for a few minutes', 'Listen for calls before looking for movement', 'Notice colors, size, and how each bird moves', 'Record one observation without disturbing wildlife'],
    safety: ['Keep a respectful distance from nests and birds', 'Stay on public paths and away from unsafe edges', 'Never feed wildlife unless local guidance permits it'],
  },
};

export function createPlan({ activity, time, skill }) {
  const base = plans[activity] || plans.walking;
  const minutes = Number(time);
  const levelNote = skill === 'beginner'
    ? 'Keep the pace gentle, take breaks whenever you need, and focus on enjoying the moment.'
    : 'Add a small challenge if you feel good, while keeping enough energy for the way back.';
  const duration = minutes >= 120 ? '2 hours' : minutes === 60 ? '60 minutes' : `${minutes} minutes`;
  return {
    ...base,
    duration,
    levelNote,
    schedule: minutes <= 15
      ? ['2 min · Get ready', `${Math.max(5, minutes - 5)} min · Enjoy your activity`, '3 min · Slow down and reflect']
      : minutes <= 30
      ? ['5 min · Get ready', `${minutes - 10} min · Explore at your own pace`, '5 min · Cool down and reflect']
      : minutes <= 60
      ? ['10 min · Prepare and settle in', '40 min · Explore, create, or observe', '10 min · Wind down and hydrate']
      : ['15 min · Prepare and reach your spot', '90 min · Enjoy your main activity with breaks', '15 min · Pack up and head back safely'],
  };
}