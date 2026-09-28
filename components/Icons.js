// Tiny inline icon set (no icon library needed).
const base = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
const I = (paths) => function Icon({ className = "", size = 18 }) {
  return <svg {...base} width={size} height={size} className={className}>{paths}</svg>;
};
export const CheckIcon = I(<><circle cx="12" cy="12" r="10" /><path d="m8 12 3 3 5-6" /></>);
export const AlertIcon = I(<><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>);
export const BanIcon = I(<><circle cx="12" cy="12" r="10" /><path d="m4.9 4.9 14.2 14.2" /></>);
export const CalendarIcon = I(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>);
export const BookmarkIcon = I(<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" />);
export const LinkIcon = I(<><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></>);
export const UsersIcon = I(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>);
export const CameraIcon = I(<><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3Z" /><circle cx="12" cy="13" r="3" /></>);
export const ShieldIcon = I(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="M12 8v4M12 16h.01" /></>);
export const BookIcon = I(<><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2Z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7Z" /></>);
export const PlusIcon = I(<path d="M12 5v14M5 12h14" />);
export const FlagIcon = I(<><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><path d="M4 22v-7" /></>);
