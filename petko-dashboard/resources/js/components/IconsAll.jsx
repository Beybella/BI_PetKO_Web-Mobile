import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCat, faDog, faShower, faBacon, faSackDollar, faMoneyBillTrendUp, faKey, faUsers } from '@fortawesome/free-solid-svg-icons';

// Category outline icons
export const IconCatFA = ({ size = 'lg', style }) => (
  <FontAwesomeIcon icon={faCat} size={size} style={style} />
);

export const IconDogFA = ({ size = 'lg', style }) => (
  <FontAwesomeIcon icon={faDog} size={size} style={style} />
);

export const IconHygiene = ({ size = 'lg', style }) => (
  <FontAwesomeIcon icon={faShower} size={size} style={style} />
);

export const IconMedical = ({ size = 24, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </svg>
);

export const IconCash = ({ size = 24, style }) => (
<svg xmlns="http://www.w3.org/2000/svg" fill="none" width={size} height={size} viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
</svg>
)

export const IconKey = ({ size = 'lg', style }) => (
  <FontAwesomeIcon icon={faKey} size={size} style={style} />
);

export const Users = ({ size = 'lg', style }) => (
  <FontAwesomeIcon icon={faUsers} size={size} style={style} />
);

export const MoneySack = ({ size = 'lg', style }) => (
  <FontAwesomeIcon icon={faSackDollar} size={size} style={style} />
);

export const MoneyBillTrend = ({ size = 'lg', style }) => (
  <FontAwesomeIcon icon={faMoneyBillTrendUp} size={size} style={style} />
);

export const IconAccessories = ({ size = 24, style }) => (
<svg xmlns="http://www.w3.org/2000/svg" fill="none" width={size} height={size} viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
</svg>
);

export const TrendUp = ({ size = 24, style }) => (
<svg xmlns="http://www.w3.org/2000/svg" fill="none" width={size} height={size} viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
</svg>

);

export const Search = ({ size = 24, style }) => (
<svg xmlns="http://www.w3.org/2000/svg" fill="none" width={size} height={size} viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m15.75 15.75-2.489-2.489m0 0a3.375 3.375 0 1 0-4.773-4.773 3.375 3.375 0 0 0 4.774 4.774ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
</svg>
);

export const IconTreats = ({ size = 24, style }) => (
  <FontAwesomeIcon icon={faBacon} size={size} style={style} />
);

export const MonthlySum = ({ size = 'lg', style }) => (
<svg xmlns="http://www.w3.org/2000/svg" fill="none" width={size} height={size} viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
</svg>
);

export const IconDownload = ({ size = 24, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const IconCart = ({ size = 24, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="21" r="1"/>
    <circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61l1.38-7.39H6"/>
  </svg>
);

export const IconAlert = ({ size = 24, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

export const IconAnalytics = ({ size = 24, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="12" width="4" height="8"/>
    <rect x="9" y="8" width="4" height="12"/>
    <rect x="15" y="4" width="4" height="16"/>
  </svg>
);

export const IconUser = ({ size = 24, style }) => (
<svg xmlns="http://www.w3.org/2000/svg" fill="none" width={size} height={size} viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
</svg>

);

export const IconCalendar = ({ size = 24, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

export const IconSearch = ({ size = 24, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

export const IconBox = ({ size = 24, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
    <circle cx="6" cy="6" r="0.5" />
  </svg>
);


export const IconTrophy = ({ size = 24, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
  </svg>
);

export const IconCheck = ({ size = 24, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export const IconClose = ({ size = 24, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export const IconWarning = ({ size = 24, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

export const IconEdit = ({ size = 24, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z"/>
  </svg>
);

export const IconDelete = ({ size = 24, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

export const IconSun = ({ size = 24, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

export const IconMoon = ({ size = 24, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>
  </svg>
);


export const IconReceipt = ({ size = 24, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1V2l-2 1-2-1-2 1-2-1-2 1-2-1Z"/>
    <path d="M8 8h8M8 12h8M8 16h4"/>
  </svg>
);
