// Portraits of the two duellists, drawn as inline SVG.

/** Abbess Grue: a hooded alchemist-abbess with ember eyes and a vial of vitriol. */
export function rivalPortrait(size = 72) {
  return `<svg class="portrait" viewBox="0 0 100 100" width="${size}" height="${size}">
    <defs><radialGradient id="pgr" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#5a2a6e"/><stop offset="1" stop-color="#1a0b22"/></radialGradient></defs>
    <circle cx="50" cy="50" r="48" fill="url(#pgr)" stroke="#ff9b7a" stroke-width="3"/>
    <path d="M18 98 C18 60 26 22 50 14 C74 22 82 60 82 98Z" fill="#2b1236" stroke="#120616" stroke-width="2"/>
    <path d="M30 90 C30 62 36 38 50 32 C64 38 70 62 70 90Z" fill="#0c0610"/>
    <ellipse cx="50" cy="56" rx="14" ry="17" fill="#3d3140"/>
    <path d="M40 52 L47 55 L40 57Z" fill="#ffb347"/><path d="M60 52 L53 55 L60 57Z" fill="#ffb347"/>
    <circle cx="43" cy="55" r="2" fill="#fff3c4"/><circle cx="57" cy="55" r="2" fill="#fff3c4"/>
    <path d="M44 66 Q50 63 56 66" stroke="#8a5a7a" stroke-width="2" fill="none"/>
    <rect x="45" y="78" width="10" height="14" rx="3" fill="#7cff6a" stroke="#d8b46a" stroke-width="2"/>
    <path d="M50 70 L50 78" stroke="#d8b46a" stroke-width="2"/>
  </svg>`;
}

/** The apprentice: brass goggles pushed up, a green scarf, a lit taper. */
export function playerPortrait(size = 72) {
  return `<svg class="portrait" viewBox="0 0 100 100" width="${size}" height="${size}">
    <defs><radialGradient id="ppr" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#2f6a5a"/><stop offset="1" stop-color="#0b1f1a"/></radialGradient></defs>
    <circle cx="50" cy="50" r="48" fill="url(#ppr)" stroke="#f3d27a" stroke-width="3"/>
    <path d="M24 98 C24 78 34 70 50 70 C66 70 76 78 76 98Z" fill="#6b3d1e"/>
    <path d="M30 76 C40 84 60 84 70 76 L66 70 C58 76 42 76 34 70Z" fill="#2b9a55"/>
    <ellipse cx="50" cy="52" rx="16" ry="19" fill="#e9c39a"/>
    <path d="M33 46 C33 26 67 26 67 46 C60 38 40 38 33 46Z" fill="#4a2a14"/>
    <rect x="32" y="34" width="36" height="9" rx="4" fill="#7a5218"/>
    <circle cx="42" cy="38" r="6" fill="#9fe6ff" stroke="#d8b46a" stroke-width="3"/><circle cx="58" cy="38" r="6" fill="#9fe6ff" stroke="#d8b46a" stroke-width="3"/>
    <circle cx="44" cy="54" r="2.2" fill="#2a1503"/><circle cx="56" cy="54" r="2.2" fill="#2a1503"/>
    <path d="M44 62 Q50 66 56 62" stroke="#8a4a2a" stroke-width="2" fill="none"/>
    <path d="M80 60 L80 88" stroke="#f1e6cc" stroke-width="5"/><path d="M80 48 C76 54 76 58 80 60 C84 58 84 54 80 48Z" fill="#ffb347"/>
  </svg>`;
}
