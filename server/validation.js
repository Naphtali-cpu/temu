export const CATEGORIES = ['residential', 'commercial'];
export const PRICE_TYPES = ['sale', 'rent', 'airbnb'];
export const STATUSES = ['AVAILABLE', 'RESERVED', 'RENTED', 'BOUGHT'];
export const INQUIRY_STATUSES = ['NEW', 'CONTACTED', 'CLOSED'];
export const INQUIRY_PURPOSES = [
  'General Inquiry',
  'Airbnb Stay',
  'Rental',
  'Buying Luxury Property',
  'Property Listing',
];
export const MAX_PROPERTY_IMAGES = 12;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOCAL_UPLOAD_PATTERN = /^\/uploads\/[\w.-]+$/;
const REMOTE_URL_PATTERN = /^https:\/\/[^\s]+$/;

const text = (value) => (typeof value === 'string' ? value.trim() : '');
const toNumber = (value) => (value === '' || value === null || value === undefined ? NaN : Number(value));
const isInteger = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const isImageUrl = (value) => LOCAL_UPLOAD_PATTERN.test(value) || REMOTE_URL_PATTERN.test(value);

export const isValidEmail = (value) => EMAIL_PATTERN.test(value) && value.length <= 254;

export function parsePropertyInput(body = {}) {
  const errors = {};
  const title = text(body.title);
  const locationName = text(body.locationName);
  const type = text(body.type);
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const priceETB = toNumber(body.priceETB);
  const bedrooms = toNumber(body.bedrooms);
  const bathrooms = toNumber(body.bathrooms);
  const areaSqm = toNumber(body.areaSqm);
  const lat = body.lat === undefined || body.lat === '' ? 8.9984 : Number(body.lat);
  const lng = body.lng === undefined || body.lng === '' ? 38.7842 : Number(body.lng);

  if (title.length < 3 || title.length > 140) errors.title = 'Title must be between 3 and 140 characters.';
  if (!CATEGORIES.includes(body.category)) errors.category = 'Choose a listing category.';
  if (type.length < 1 || type.length > 60) errors.type = 'Choose a property type.';
  if (!PRICE_TYPES.includes(body.priceType)) errors.priceType = 'Choose a price type.';
  if (!isInteger(priceETB, 0, 1e12)) errors.priceETB = 'Enter a valid price in ETB.';
  if (!STATUSES.includes(body.status)) errors.status = 'Choose a valid status.';
  if (locationName.length < 2 || locationName.length > 80) errors.locationName = 'Enter the neighborhood.';
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) errors.lat = 'Latitude is out of range.';
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) errors.lng = 'Longitude is out of range.';
  if (!isInteger(bedrooms, 0, 30)) errors.bedrooms = 'Bedrooms must be between 0 and 30.';
  if (!isInteger(bathrooms, 0, 30)) errors.bathrooms = 'Bathrooms must be between 0 and 30.';
  if (!isInteger(areaSqm, 1, 100000)) errors.areaSqm = 'Area must be between 1 and 100,000 m².';
  if (description.length > 5000) errors.description = 'Description is too long (5,000 characters max).';

  const rawImages = Array.isArray(body.images) ? body.images : [];
  const images = rawImages.map((image) => {
    const url = text(typeof image === 'string' ? image : image?.url);
    const thumb = text(typeof image === 'string' ? image : image?.thumb) || url;
    return { url, thumb };
  });
  if (images.length === 0) errors.images = 'Add at least one photo.';
  if (images.length > MAX_PROPERTY_IMAGES) errors.images = `Up to ${MAX_PROPERTY_IMAGES} photos are allowed.`;
  if (images.some(({ url, thumb }) => !isImageUrl(url) || !isImageUrl(thumb))) {
    errors.images = 'One or more photos are invalid. Re-upload them and try again.';
  }

  if (Object.keys(errors).length > 0) return { errors };

  return {
    value: {
      title,
      category: body.category,
      type,
      priceType: body.priceType,
      priceETB,
      status: body.status,
      locationName,
      lat,
      lng,
      bedrooms,
      bathrooms,
      areaSqm,
      isVIP: body.isVIP === true || body.isVIP === 'true',
      description,
      images,
    },
  };
}

export function parseInquiryInput(body = {}) {
  const errors = {};
  const fullName = text(body.fullName);
  const email = text(body.email).toLowerCase();
  const phone = text(body.phone);
  const purpose = text(body.purpose) || 'General Inquiry';
  const message = text(body.message);

  if (fullName.length < 2 || fullName.length > 120) errors.fullName = 'Please enter your full name.';
  if (!isValidEmail(email)) errors.email = 'Enter a valid email address.';
  if (phone.length > 30) errors.phone = 'Phone number is too long.';
  if (!INQUIRY_PURPOSES.includes(purpose)) errors.purpose = 'Choose an inquiry purpose.';
  if (message.length < 5 || message.length > 3000) errors.message = 'Message must be between 5 and 3,000 characters.';

  if (Object.keys(errors).length > 0) return { errors };
  return { value: { fullName, email, phone, purpose, message, propertyId: text(body.propertyId) || null } };
}
