// The Clip tab's picture: a photo if preview/photo.jpg exists (git-ignored), else a generated landscape.

const generatedPicture = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3a8c"/><stop offset="0.6" stop-color="#e0708a"/><stop offset="1" stop-color="#ffc977"/></linearGradient>
    <linearGradient id="lake" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a5fa8"/><stop offset="1" stop-color="#1c2150"/></linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#sky)"/>
  <circle cx="285" cy="150" r="42" fill="#fff1c4"/>
  <polygon points="0,205 70,110 130,170 200,80 270,175 330,120 400,190 400,215 0,215" fill="#3b2d6b"/>
  <polygon points="0,215 50,170 110,205 170,150 240,210 310,165 400,215" fill="#24194d"/>
  <rect y="215" width="400" height="85" fill="url(#lake)"/>
  <rect x="245" y="225" width="80" height="4" rx="2" fill="#fff1c4" opacity="0.6"/>
  <rect x="262" y="238" width="46" height="3" rx="1.5" fill="#fff1c4" opacity="0.4"/>
  <polygon points="30,300 55,215 80,300" fill="#120c2c"/>
  <polygon points="70,300 100,190 130,300" fill="#120c2c"/>
  <polygon points="350,300 372,225 394,300" fill="#120c2c"/>
</svg>`)}`;

export const loadPicture = (image: HTMLImageElement): void => {
  image.addEventListener('error', () => { image.src = generatedPicture; }, { once: true });
  image.src = 'preview/photo.jpg';
};
