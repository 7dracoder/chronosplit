export function thisTimelineAvatar(seed: string) {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(`${seed}-this`)}&backgroundColor=ffe8f8,b8f0ff,b8ff5c&backgroundType=gradientLinear`;
}

export function alternateTimelineAvatar(seed: string) {
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(`${seed}-alt`)}&backgroundColor=ff6bcb,ffb020,3dd9ff&backgroundType=gradientLinear`;
}
