export const SITE = {
  name: 'Temu Estates',
  nameAmharic: 'ተሙ ኤስቴት',
  tagline: 'Private Real Estate · Addis Ababa',
  description:
    'A private Addis Ababa property house curating residences, rentals, short stays and commercial space for owners, investors and diplomatic tenants.',
  agent: {
    name: 'Temesgen Teklay',
    title: 'Managing Director & Chief Broker',
    initials: 'TT',
    phoneDisplay: '+251 99 027 2812',
    phoneIntl: '251990272812',
    email: 'temu.estate@gmail.com',
    telegram: 'Tete333333',
    office: 'Bole Atlas, Addis Ababa, Ethiopia',
  },
  social: {
    instagram: 'https://www.instagram.com/temuestates.et/',
    tiktok: 'https://www.tiktok.com/@temesgen.teklay33',
    telegram: 'https://t.me/Tete333333',
  },
};

export const NAV_LINKS = [
  { label: 'Residential', to: '/' },
  { label: 'Commercial', to: '/commercial' },
  { label: 'Map', to: '/map' },
  { label: 'Contact', to: '/contact' },
];

export function inquiryMessage(listingTitle) {
  return `Hello Temu Estates, I am interested in "${listingTitle || 'a property in Addis Ababa'}". Please share availability and next steps.`;
}

export function whatsappLink(listingTitle) {
  return `https://wa.me/${SITE.agent.phoneIntl}?text=${encodeURIComponent(inquiryMessage(listingTitle))}`;
}

export function telegramLink() {
  return `https://t.me/${SITE.agent.telegram}`;
}
