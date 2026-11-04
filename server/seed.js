import crypto from 'node:crypto';
import { db, transaction } from './db.js';
import { hashPassword } from './auth.js';

const DEFAULT_ADMIN_EMAIL = 'temu.estate@gmail.com';
const DEFAULT_ADMIN_PASSWORD = 'Admin123!';

const unsplash = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const COMPOUND_PHOTOS = [
  unsplash('photo-1600596542815-ffad4c1539a9'),
  unsplash('photo-1613490493576-7fde63acd811'),
  unsplash('photo-1600585154340-be6161a56a0c'),
  unsplash('photo-1580587771525-78b9dba3b914'),
  unsplash('photo-1512917774080-9991f1c4c750'),
];

const LIVING_PHOTOS = [
  unsplash('photo-1600607687939-ce8a6c25118c'),
  unsplash('photo-1600210492486-724fe5c67fb0'),
  unsplash('photo-1502672260266-1c1ef2d93688'),
  unsplash('photo-1618221195710-dd6b41faaea6'),
  unsplash('photo-1600566753376-12c8ab7fb75b'),
];

const KITCHEN_PHOTOS = [
  unsplash('photo-1556911220-e15b29be8c8f'),
  unsplash('photo-1507089947368-19c1da9775ae'),
  unsplash('photo-1600585152220-90363fe7e115'),
  unsplash('photo-1556909212-d5b604d0c90d'),
];

const BEDROOM_PHOTOS = [
  unsplash('photo-1616594039964-ae9021a400a0'),
  unsplash('photo-1595526114035-0d45ed16cfbf'),
  unsplash('photo-1560448204-e02f11c3d0e2'),
  unsplash('photo-1540518614846-7eded433c457'),
];

const BATHROOM_PHOTOS = [
  unsplash('photo-1584622650111-993a426fbf0a'),
  unsplash('photo-1620626011761-996317b8d101'),
  unsplash('photo-1552321554-5fefe8c9ef14'),
];

const COMMERCIAL_PHOTOS = [
  unsplash('photo-1497366754035-f200968a6e72'),
  unsplash('photo-1497366811353-6870744d04b2'),
  unsplash('photo-1524758631624-e2822e304c36'),
  unsplash('photo-1568992687947-868a62a9f521'),
  unsplash('photo-1554469384-e58fac16e23a'),
  unsplash('photo-1441986300917-64674bd600d8'),
  unsplash('photo-1556740738-b6a63e27c4df'),
  unsplash('photo-1556761175-5973dc0f32e7'),
  unsplash('photo-1600880292203-757bb62b4baf'),
  unsplash('photo-1521737604893-d14cc237f11d'),
  unsplash('photo-1553413077-190dd305871c'),
  unsplash('photo-1586528116311-ad8dd3c8310d'),
];

const residentialPhotos = (idx) => [
  COMPOUND_PHOTOS[idx % COMPOUND_PHOTOS.length],
  LIVING_PHOTOS[idx % LIVING_PHOTOS.length],
  KITCHEN_PHOTOS[idx % KITCHEN_PHOTOS.length],
  BEDROOM_PHOTOS[idx % BEDROOM_PHOTOS.length],
  BATHROOM_PHOTOS[idx % BATHROOM_PHOTOS.length],
];

const commercialPhotos = (idx) =>
  Array.from({ length: 7 }, (_, i) => COMMERCIAL_PHOTOS[(idx + i) % COMMERCIAL_PHOTOS.length]);

const NEIGHBORHOODS = {
  'Bole Atlas': [8.9984, 38.7842],
  'Bole Medhanialem': [8.9942, 38.7885],
  Kazanchis: [9.0210, 38.7663],
  'Old Airport': [8.9723, 38.7391],
  Sarbet: [8.9895, 38.7360],
  CMC: [9.0195, 38.8310],
  Megenagna: [9.0205, 38.8020],
  Piassa: [9.0345, 38.7512],
  Gotera: [8.9780, 38.7610],
  'Meskel Square': [9.0105, 38.7615],
  'Bisrate Gabriel': [8.9760, 38.7290],
  Ayat: [9.0250, 38.8680],
  Gerji: [8.9950, 38.8100],
  Lebu: [8.9530, 38.7180],
  Summit: [9.0310, 38.8450],
};

const RESIDENTIAL_SEED = [
  ['prop-1', 'The Grand Imperial Penthouse in Bole Atlas', 102000000, 'sale', 'AVAILABLE', 'Bole Atlas', 4, 5, 480, 'Penthouse', true, 'An architectural masterpiece in Addis Ababa featuring panoramic skyline views, private elevator access, 24/7 elite security, and smart home automation.', 0],
  ['prop-2', 'Old Airport Diplomatic Villa & Green Compound', 144000000, 'sale', 'AVAILABLE', 'Old Airport', 6, 7, 850, 'Villa', true, 'Expansive ambassadorial estate with manicured compound gardens, high boundary wall with electric security wire, guest house, and swimming pool.', 1],
  ['prop-3', 'Diplomatic Executive Monthly Residence in Kazanchis', 420000, 'rent', 'AVAILABLE', 'Kazanchis', 3, 3, 220, 'Rentals', false, 'Fully furnished 3 bedroom luxury residence customized for ambassadors, high-net-worth investors, and executive leadership near UN Economic Commission.', 2],
  ['prop-4', 'CMC Horizon Modern Villa', 74400000, 'sale', 'RESERVED', 'CMC', 5, 4, 380, 'Villa', false, 'Contemporary architectural masterpiece with floor-to-ceiling modern glass paneling, smart home system, and generous multi-car parking space.', 3],
  ['prop-5', 'Bole Medhanialem Executive Sky Suite Airbnb', 18000, 'airbnb', 'AVAILABLE', 'Bole Medhanialem', 2, 2, 130, 'Airbnb', true, 'Luxury turnkey serviced Airbnb apartment located steps away from Bole Medhanialem Church. Includes high-speed Wi-Fi, daily housekeeping, and concierge.', 4],
  ['prop-6', 'Sarbet Own Compound Luxury Estate', 174000000, 'sale', 'AVAILABLE', 'Sarbet', 7, 8, 920, 'Own Compound', true, 'Private gated mansion with expansive green garden, guest quarters, standby generator, underground water tank, and multi-vehicle garage.', 5],
  ['prop-7', 'Meskel Square Duplex Resell Apartment', 45600000, 'sale', 'AVAILABLE', 'Meskel Square', 3, 3, 210, 'Resell', false, 'Prime central resale apartment unit offering open-concept living space, renovated kitchen, and sweeping views over Meskel Square.', 6],
  ['prop-8', 'Bisrate Gabriel Private Compound Villa', 106800000, 'sale', 'AVAILABLE', 'Bisrate Gabriel', 5, 5, 550, 'Own Compound', false, 'Elegant standalone villa in quiet residential quarter. Features expansive terrace, dual kitchens, service rooms, and serene courtyard gardens.', 7],
  ['prop-9', 'Bole Rwanda Luxury Nightly Airbnb Suite', 24000, 'airbnb', 'AVAILABLE', 'Bole Atlas', 2, 2, 140, 'Airbnb', true, 'Boutique stay in Bole Rwanda. Smart lock entry, jacuzzi bathroom, high-speed fiber internet and 24/7 security.', 8],
  ['prop-10', 'Old Airport Diplomatic Monthly Rental Haven', 380000, 'rent', 'AVAILABLE', 'Old Airport', 4, 4, 320, 'Rentals', false, 'Long term luxury family rental with high boundary walls, backup water systems, and standby generator.', 9],
  ['prop-11', 'Kazanchis UN Heights Sky Penthouse', 125000000, 'sale', 'AVAILABLE', 'Kazanchis', 5, 6, 520, 'Penthouse', true, 'Top floor penthouse with panoramic city skylines, double height ceilings, luxury Italian kitchen, and personal gym.', 10],
  ['prop-12', 'Ayat Zone 3 Modern Compound Villa', 68000000, 'sale', 'AVAILABLE', 'Ayat', 5, 5, 420, 'Villa', false, 'Spacious 5 bedroom villa in Ayat with landscaped front garden, multi-car driveway, and backup power supply.', 11],
  ['prop-13', 'Gerji Imperial Park Monthly Residence', 280000, 'rent', 'AVAILABLE', 'Gerji', 3, 3, 210, 'Rentals', false, 'Spacious furnished residence available for long term rent at monthly rate. Located in quiet Gerji neighborhood.', 12],
  ['prop-14', 'Bole Brass Nightly Luxury Studio Airbnb', 12000, 'airbnb', 'AVAILABLE', 'Bole Medhanialem', 0, 1, 85, 'Airbnb', false, 'Stylish studio condo in Bole Brass center. Near fine dining restaurants and international airport.', 13],
  ['prop-15', 'CMC Summit Green Own Compound Villa', 115000000, 'sale', 'AVAILABLE', 'Summit', 6, 6, 600, 'Own Compound', true, 'Gated compound mansion with mature gardens, perimeter surveillance, guard house, and dual parking garages.', 14],
  ['prop-16', 'Megenagna Resell Horizon Duplex', 39500000, 'sale', 'AVAILABLE', 'Megenagna', 3, 2, 180, 'Resell', false, 'Newly renovated duplex apartment available for resale. High floor with excellent natural light and parking space.', 15],
  ['prop-17', 'Piassa Historical Heritage View Apartment', 32000000, 'sale', 'AVAILABLE', 'Piassa', 2, 2, 140, 'Apartment', false, 'Modern apartment in Piassa overlooking iconic municipal landmarks, equipped with modern kitchen and security.', 16],
  ['prop-18', 'Lebu Royal Residence Monthly Lease', 220000, 'rent', 'AVAILABLE', 'Lebu', 3, 3, 200, 'Rentals', false, 'Quiet family home in Lebu for monthly rent. Features high boundary fence, garden patio, and generator.', 17],
  ['prop-19', 'Gotera Towers Executive Nightly Airbnb', 15000, 'airbnb', 'AVAILABLE', 'Gotera', 2, 2, 120, 'Airbnb', false, 'Fully serviced 2-bedroom Airbnb stay. Complete with elevator access and mountain view.', 18],
  ['prop-20', 'Old Airport Ambassador Sky Penthouse', 160000000, 'sale', 'AVAILABLE', 'Old Airport', 5, 6, 580, 'Penthouse', true, 'Exclusive Old Airport top-tier penthouse featuring private spa, wrap-around balcony, and dedicated security detailing.', 19],
  ['prop-21', 'Sarbet Embassy Quarter Monthly Villa', 500000, 'rent', 'AVAILABLE', 'Sarbet', 5, 6, 480, 'Rentals', true, 'Prestigious Sarbet residence for long-term lease. Suitable for embassy staff or corporate headquarters.', 20],
  ['prop-22', 'Bole Japanese Embassy Nightly Airbnb Villa', 35000, 'airbnb', 'AVAILABLE', 'Bole Atlas', 3, 4, 260, 'Airbnb', true, 'Luxury gated mini-villa Airbnb. Includes private courtyard garden, full security staff, and chef service option.', 21],
  ['prop-23', 'Summit Hilltop Glass Modern Villa', 89000000, 'sale', 'AVAILABLE', 'Summit', 5, 5, 450, 'Villa', false, 'Contemporary architectural home with hilltop views across Summit. Multi-car parking and landscaped green lawns.', 22],
  ['prop-24', 'Kazanchis Financial District Resell Flat', 38000000, 'sale', 'AVAILABLE', 'Kazanchis', 1, 2, 135, 'Resell', false, 'High return resale apartment unit right in Kazanchis banking hub. Ideal for short term rental investors.', 23],
  ['prop-25', 'Gerji Sunshine Village Compound Residence', 98000000, 'sale', 'AVAILABLE', 'Gerji', 4, 4, 360, 'Own Compound', false, 'Gated family estate in Gerji with private garden, service quarters, underground water reservoir, and dual gates.', 24],
  ['prop-26', 'Bole Medhanialem Presidential Monthly Lease', 600000, 'rent', 'AVAILABLE', 'Bole Medhanialem', 4, 5, 350, 'Rentals', true, 'Fully serviced monthly rental suite located in the diplomatic heart of Bole Medhanialem.', 25],
  ['prop-27', 'Meskel Flower District Nightly Airbnb Haven', 20000, 'airbnb', 'AVAILABLE', 'Meskel Square', 2, 2, 125, 'Airbnb', false, 'Cozy night-to-night stay near Meskel Flower area. Features underground parking, gym access, and continuous generator backup.', 26],
  ['prop-28', 'Ayat Grand Avenue Penthouse Sky Suite', 88000000, 'sale', 'AVAILABLE', 'Ayat', 4, 4, 390, 'Penthouse', false, 'Spacious top-floor penthouse with unobstructed sunrise views over Ayat. Smart lighting and private elevator access.', 27],
  ['prop-29', 'Bisrate Gabriel Executive Monthly Residence', 310000, 'rent', 'AVAILABLE', 'Bisrate Gabriel', 3, 3, 230, 'Rentals', false, 'Generous 3-bedroom apartment for long term lease in serene Bisrate Gabriel.', 28],
  ['prop-30', 'Bole Atlas Crown Jewel VIP Mansion', 210000000, 'sale', 'AVAILABLE', 'Bole Atlas', 8, 8, 980, 'Own Compound', true, 'The pinnacle of luxury in Bole Atlas. Featuring personal indoor pool, private security post, subterranean garage for 8 vehicles, and staff quarters.', 29],
];

const COMMERCIAL_SEED = [
  ['comm-1', 'Bole Atlas Premium Office Floor', 95000000, 'sale', 'AVAILABLE', 'Bole Atlas', 0, 4, 640, 'Office Space', false, 'Grade-A office floor in Bole Atlas with private elevators, backup generator, dedicated parking, and 24/7 security.', 0],
  ['comm-2', 'Kazanchis Corporate Headquarters Building', 320000000, 'sale', 'AVAILABLE', 'Kazanchis', 0, 10, 1450, 'Office Building', true, 'Stand-alone corporate building near the UN Economic Commission with conference facilities, parking, generator backup, and fiber-ready infrastructure.', 2],
  ['comm-3', 'Megenagna Retail Shopfront', 450000, 'rent', 'AVAILABLE', 'Megenagna', 0, 2, 310, 'Shop', false, 'High-visibility ground-floor shop with glass frontage, storage room, and strong foot traffic. Suitable for retail or franchise businesses.', 5],
  ['comm-4', 'Gerji Logistics Warehouse & Distribution Hub', 780000, 'rent', 'AVAILABLE', 'Gerji', 0, 3, 1200, 'Warehouse / Godown', false, 'Warehouse with loading access, open storage space, office mezzanine, and truck access for distribution and light assembly.', 8],
  ['comm-5', 'Piassa Flexible Retail Stall', 65000, 'rent', 'AVAILABLE', 'Piassa', 0, 1, 35, 'Stall', false, 'Compact retail stall in a busy commercial area, suitable for accessories, small goods, and takeaway retail.', 1],
  ['comm-6', 'Meskel Square Multipurpose Event Hall', 1250000, 'rent', 'AVAILABLE', 'Meskel Square', 0, 4, 900, 'Hall', false, 'Spacious multipurpose hall for corporate events, trainings, celebrations, and exhibitions, with convenient central access.', 3],
  ['comm-7', 'CMC Industrial Storage Godown', 42000000, 'sale', 'AVAILABLE', 'CMC', 0, 2, 1100, 'Godown', false, 'Practical industrial storage property with a broad access entrance and flexible floor space for stock, equipment, or wholesale goods.', 6],
  ['comm-8', 'Bole Atlas Boutique Retail Unit', 380000, 'rent', 'AVAILABLE', 'Bole Atlas', 0, 1, 180, 'Retail Shop', false, 'Neat street-facing retail unit for a boutique, salon, office reception, or specialty store.', 7],
  ['comm-9', 'Megenagna Commercial Showroom', 68000000, 'sale', 'AVAILABLE', 'Megenagna', 0, 2, 520, 'Showroom', true, 'Bright commercial showroom with wide display frontage and space for customer service, product display, or business operations.', 9],
  ['comm-10', 'Summit Light-Industrial Warehouse', 920000, 'rent', 'AVAILABLE', 'Summit', 0, 2, 1500, 'Warehouse', false, 'Large flexible warehouse suitable for stock holding, wholesale operations, and light industrial use with vehicle access.', 10],
];

const thumbOf = (url) => url.replace('w=1200', 'w=640');

function seedListings() {
  const insert = db.prepare(`
    INSERT INTO properties (
      id, title, category, type, price_type, price_etb, status, location_name, lat, lng,
      bedrooms, bathrooms, area_sqm, is_vip, description, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertImage = db.prepare(
    'INSERT INTO property_images (property_id, position, url, thumb_url) VALUES (?, ?, ?, ?)'
  );
  const now = new Date().toISOString();
  let order = 0;

  const seed = (rows, category, photosFor) => {
    for (const [id, title, priceETB, priceType, status, location, beds, baths, area, type, isVIP, description, photoIdx] of rows) {
      const [lat, lng] = NEIGHBORHOODS[location];
      insert.run(id, title, category, type, priceType, priceETB, status, location, lat, lng,
        beds, baths, area, isVIP ? 1 : 0, description, order++, now, now);
      photosFor(photoIdx).forEach((url, position) => insertImage.run(id, position, url, thumbOf(url)));
    }
  };

  seed(RESIDENTIAL_SEED, 'residential', residentialPhotos);
  seed(COMMERCIAL_SEED, 'commercial', commercialPhotos);
}

function ensureAdminAccount() {
  const email = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  const now = new Date().toISOString();

  if (!existing) {
    db.prepare(`
      INSERT INTO users (id, full_name, email, password_hash, role, newsletter_consent, created_at)
      VALUES (?, 'Temu Estates Admin', ?, ?, 'ADMIN', 0, ?)
    `).run(crypto.randomUUID(), email, hashPassword(password), now);
  } else if (process.env.ADMIN_PASSWORD) {
    db.prepare("UPDATE users SET password_hash = ?, role = 'ADMIN' WHERE id = ?")
      .run(hashPassword(password), existing.id);
  }

  if (!process.env.ADMIN_PASSWORD) {
    console.warn('[seed] ADMIN_PASSWORD is not set; using the development default. Set it in server/.env before going live.');
  }
}

export function seedDatabase() {
  transaction(() => {
    ensureAdminAccount();
    const { count } = db.prepare('SELECT COUNT(*) AS count FROM properties').get();
    if (count === 0) seedListings();
  });
}
