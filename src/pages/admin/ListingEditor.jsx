import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Loader2, MapPin, Save, Trash2 } from 'lucide-react';
import { AdminPageHeader } from './AdminLayout.jsx';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Field,
  Input,
  Modal,
  Select,
  Skeleton,
  Textarea,
} from '../../components/ui.jsx';
import { PhotoManager, photosFromListing } from '../../components/admin/PhotoManager.jsx';
import { propertiesApi, uploadsApi } from '../../api/index.js';
import { apiErrorMessage, apiFieldErrors, assetUrl } from '../../api/client.js';
import { useCurrency } from '../../context/CurrencyContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import {
  ADDIS_AREAS,
  COMMERCIAL_TYPES,
  RESIDENTIAL_TYPES,
  formatPrice,
} from '../../lib/format.js';

const BLANK = {
  title: '',
  category: 'residential',
  type: 'Apartment',
  priceType: 'sale',
  priceETB: '',
  status: 'AVAILABLE',
  locationName: '',
  lat: '8.9984',
  lng: '38.7842',
  bedrooms: '3',
  bathrooms: '2',
  areaSqm: '',
  isVIP: false,
  description: '',
};

function SectionCard({ title, description, children, action }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-xl text-ivory">{title}</h2>
          {description && <p className="mt-1 text-xs leading-relaxed text-stone">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}

export default function ListingEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currency, rate } = useCurrency();
  const { toast } = useToast();
  const isNew = !id;

  const [form, setForm] = useState(BLANK);
  const [photos, setPhotos] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState('');
  const [dirty, setDirty] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const baseline = useRef('');

  const types = form.category === 'commercial' ? COMMERCIAL_TYPES : RESIDENTIAL_TYPES;

  const snapshot = (nextForm, nextPhotos) =>
    JSON.stringify({ ...nextForm, photos: nextPhotos.map((photo) => photo.url || photo.key) });

  useEffect(() => {
    let active = true;
    if (isNew) {
      setForm(BLANK);
      setPhotos([]);
      baseline.current = snapshot(BLANK, []);
      setDirty(false);
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    propertiesApi
      .get(id)
      .then((listing) => {
        if (!active) return;
        const nextForm = {
          title: listing.title,
          category: listing.category,
          type: listing.type,
          priceType: listing.priceType,
          priceETB: String(listing.priceETB),
          status: listing.status,
          locationName: listing.locationName,
          lat: String(listing.lat),
          lng: String(listing.lng),
          bedrooms: String(listing.bedrooms),
          bathrooms: String(listing.bathrooms),
          areaSqm: String(listing.areaSqm),
          isVIP: listing.isVIP,
          description: listing.description || '',
        };
        const nextPhotos = photosFromListing(listing.images || []);
        setForm(nextForm);
        setPhotos(nextPhotos);
        baseline.current = snapshot(nextForm, nextPhotos);
        setDirty(false);
      })
      .catch((err) => {
        if (active) setFormError(apiErrorMessage(err, 'This listing could not be loaded.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [id, isNew]);

  useEffect(() => {
    if (!loading) setDirty(snapshot(form, photos) !== baseline.current);
  }, [form, photos, loading]);

  useEffect(() => {
    if (!dirty || saving) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, saving]);

  const update = (patch) => {
    setForm((current) => ({ ...current, ...patch }));
    setErrors((current) => {
      const next = { ...current };
      Object.keys(patch).forEach((key) => { delete next[key]; });
      return next;
    });
  };

  const changeCategory = (category) => {
    const nextTypes = category === 'commercial' ? COMMERCIAL_TYPES : RESIDENTIAL_TYPES;
    update({ category, type: nextTypes.includes(form.type) ? form.type : nextTypes[0] });
  };

  const applyArea = (name) => {
    const area = ADDIS_AREAS.find((item) => item.name.toLowerCase() === String(name).trim().toLowerCase());
    update(area ? { locationName: name, lat: String(area.lat), lng: String(area.lng) } : { locationName: name });
  };

  const validate = () => {
    const next = {};
    if (form.title.trim().length < 3) next.title = 'Give the listing a descriptive title (3+ characters).';
    if (!form.locationName.trim()) next.locationName = 'Enter the neighbourhood.';
    if (!form.type) next.type = 'Choose a property type.';
    if (form.priceETB === '' || Number(form.priceETB) < 0 || Number.isNaN(Number(form.priceETB))) {
      next.priceETB = 'Enter the price in ETB.';
    }
    if (!form.areaSqm || Number(form.areaSqm) <= 0) next.areaSqm = 'Enter the internal area in m².';
    if (photos.length === 0) next.images = 'Add at least one photo.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async (event) => {
    event.preventDefault();
    setFormError('');
    if (!validate()) {
      setFormError('Please correct the highlighted fields before saving.');
      return;
    }

    setSaving(true);
    try {
      const images = [];
      for (let index = 0; index < photos.length; index += 1) {
        const photo = photos[index];
        if (photo.url) {
          images.push({ url: photo.url, thumb: photo.thumb || photo.url });
          continue;
        }
        setProgress(`Uploading photo ${index + 1} of ${photos.length}…`);
        const full = await uploadsApi.image(photo.pending.full);
        const thumb = await uploadsApi.image(photo.pending.thumb);
        images.push({ url: full.url, thumb: thumb.url });
      }

      setProgress('Saving listing…');
      const payload = {
        title: form.title.trim(),
        category: form.category,
        type: form.type,
        priceType: form.priceType,
        priceETB: Number(form.priceETB),
        status: form.status,
        locationName: form.locationName.trim(),
        lat: Number(form.lat),
        lng: Number(form.lng),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        areaSqm: Number(form.areaSqm),
        isVIP: form.isVIP,
        description: form.description.trim(),
        images,
      };

      if (isNew) {
        const created = await propertiesApi.create(payload);
        toast('The listing is live on the website.', 'success', 'Listing published');
        baseline.current = snapshot(form, photos);
        setDirty(false);
        navigate(`/admin/listings/${created.id}`, { replace: true });
      } else {
        const updated = await propertiesApi.update(id, payload);
        const nextPhotos = photosFromListing(updated.images || []);
        setPhotos(nextPhotos);
        baseline.current = snapshot(form, nextPhotos);
        setDirty(false);
        toast('Your changes are live.', 'success', 'Listing saved');
      }
      setProgress('');
    } catch (err) {
      const fieldErrors = apiFieldErrors(err);
      setErrors((current) => ({ ...current, ...fieldErrors }));
      setFormError(
        Object.keys(fieldErrors).length > 0
          ? 'Please correct the highlighted fields and try again.'
          : apiErrorMessage(err, 'The listing could not be saved.')
      );
    } finally {
      setSaving(false);
      setProgress('');
    }
  };

  const removeListing = async () => {
    setDeleting(true);
    try {
      await propertiesApi.remove(id);
      toast('The listing was removed.', 'success', 'Deleted');
      navigate('/admin/listings', { replace: true });
    } catch (err) {
      toast(apiErrorMessage(err, 'The listing could not be deleted.'), 'error', 'Delete failed');
      setDeleting(false);
    }
  };

  const leave = () => {
    if (dirty) setConfirmLeave(true);
    else navigate('/admin/listings');
  };

  const pricePreview = useMemo(() => {
    const numeric = Number(form.priceETB);
    if (!numeric) return '';
    return `≈ ${formatPrice(numeric, currency === 'ETB' ? 'USD' : 'ETB', rate)}`;
  }, [form.priceETB, currency, rate]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={isNew ? 'New listing' : 'Edit listing'}
        title={isNew ? 'Publish a property' : form.title || 'Edit listing'}
        description={
          isNew
            ? 'Everything entered here appears on the website immediately after saving.'
            : `Reference ${id}. Changes go live as soon as you save.`
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={leave}>
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to listings
            </Button>
            {!isNew && (
              <Button type="button" variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
            <Button as={Link} to={`/property/${id}`} variant="outline" size="sm" {...(isNew ? { to: '/' } : {})}>
              Preview
            </Button>
            <Button type="submit" form="listing-form" size="sm" loading={saving}>
              <Save className="h-3.5 w-3.5" />
              {isNew ? 'Publish listing' : 'Save changes'}
            </Button>
          </div>
        }
      />

      {formError && <Alert>{formError}</Alert>}

      {isNew && (
        <div className="flex items-start gap-3 rounded-xl border border-champagne-400/30 bg-champagne-400/[0.06] p-4 text-sm text-champagne-100">
          <ImagePlus className="mt-0.5 h-4 w-4 shrink-0 text-champagne-400" />
          <p className="leading-relaxed">
            A complete listing needs a title, area, price, size and at least one photo. Photos upload when you press
            publish, so nothing is left behind if you cancel.
          </p>
        </div>
      )}

      <form id="listing-form" onSubmit={save} className="grid gap-6 xl:grid-cols-[1.5fr_1fr] xl:items-start">
        <div className="space-y-6">
          <SectionCard title="Property details" description="The headline information visitors read first.">
            <div className="space-y-4">
              <Field label="Listing title" htmlFor="title" error={errors.title} required>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(event) => update({ title: event.target.value })}
                  placeholder="e.g. The Grand Imperial Penthouse in Bole Atlas"
                  maxLength={140}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Category" htmlFor="category" error={errors.category}>
                  <Select id="category" value={form.category} onChange={(event) => changeCategory(event.target.value)}>
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                  </Select>
                </Field>
                <Field label="Property type" htmlFor="type" error={errors.type}>
                  <Select id="type" value={form.type} onChange={(event) => update({ type: event.target.value })}>
                    {types.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Price basis" htmlFor="priceType" error={errors.priceType}>
                  <Select id="priceType" value={form.priceType} onChange={(event) => update({ priceType: event.target.value })}>
                    <option value="sale">For sale</option>
                    <option value="rent">Monthly rent</option>
                    <option value="airbnb">Nightly stay</option>
                  </Select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Price (ETB)"
                  htmlFor="priceETB"
                  error={errors.priceETB}
                  hint={pricePreview || 'Always entered in Ethiopian birr.'}
                  required
                >
                  <Input
                    id="priceETB"
                    type="number"
                    min="0"
                    step="1000"
                    value={form.priceETB}
                    onChange={(event) => update({ priceETB: event.target.value })}
                    placeholder="102000000"
                  />
                </Field>
                <Field label="Status" htmlFor="status" error={errors.status}>
                  <Select id="status" value={form.status} onChange={(event) => update({ status: event.target.value })}>
                    <option value="AVAILABLE">Available</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="RENTED">Rented</option>
                    <option value="BOUGHT">Sold</option>
                  </Select>
                </Field>
              </div>

              <div className="rounded-lg border border-ink-800 bg-ink-950/50 p-4">
                <Checkbox
                  checked={form.isVIP}
                  onChange={(value) => update({ isVIP: value })}
                  label="Include in the VIP collection"
                  hint="VIP listings are highlighted across the site and shared with registered clients first."
                />
              </div>

              <Field label="Description" htmlFor="description" error={errors.description}>
                <Textarea
                  id="description"
                  rows={6}
                  value={form.description}
                  onChange={(event) => update({ description: event.target.value })}
                  placeholder="Describe the residence, its setting, finishes and what makes it noteworthy."
                  maxLength={5000}
                />
              </Field>
              <p className="-mt-2 text-right text-[11px] text-ink-500">{form.description.length} / 5,000</p>
            </div>
          </SectionCard>

          <SectionCard
            title="Photos"
            description="Visitors see these in order. Lead with the strongest exterior or living-space shot."
            action={
              errors.images ? <Badge tone="danger">{errors.images}</Badge> : (
                <Badge tone="neutral">{photos.length} photo{photos.length === 1 ? '' : 's'}</Badge>
              )
            }
          >
            <PhotoManager photos={photos} onChange={setPhotos} />
          </SectionCard>

          <SectionCard title="Location" description="Used for the listing's map and area search.">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Neighbourhood" htmlFor="locationName" error={errors.locationName} required className="sm:col-span-1">
                <Input
                  id="locationName"
                  list="addis-areas"
                  value={form.locationName}
                  onChange={(event) => applyArea(event.target.value)}
                  placeholder="Bole Atlas"
                />
                <datalist id="addis-areas">
                  {ADDIS_AREAS.map((area) => (
                    <option key={area.name} value={area.name} />
                  ))}
                </datalist>
              </Field>
              <Field label="Latitude" htmlFor="lat" error={errors.lat}>
                <Input
                  id="lat"
                  type="number"
                  step="0.0001"
                  value={form.lat}
                  onChange={(event) => update({ lat: event.target.value })}
                />
              </Field>
              <Field label="Longitude" htmlFor="lng" error={errors.lng}>
                <Input
                  id="lng"
                  type="number"
                  step="0.0001"
                  value={form.lng}
                  onChange={(event) => update({ lng: event.target.value })}
                />
              </Field>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-ink-500">
              <MapPin className="h-3 w-3" />
              Choosing a known neighbourhood fills its coordinates automatically. Adjust if the property sits further out.
            </p>
          </SectionCard>
        </div>

        <div className="space-y-6 xl:sticky xl:top-24">
          <SectionCard title="Specifications">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Bedrooms" htmlFor="bedrooms" error={errors.bedrooms}>
                <Input
                  id="bedrooms"
                  type="number"
                  min="0"
                  max="30"
                  value={form.bedrooms}
                  onChange={(event) => update({ bedrooms: event.target.value })}
                />
              </Field>
              <Field label="Bathrooms" htmlFor="bathrooms" error={errors.bathrooms}>
                <Input
                  id="bathrooms"
                  type="number"
                  min="0"
                  max="30"
                  value={form.bathrooms}
                  onChange={(event) => update({ bathrooms: event.target.value })}
                />
              </Field>
              <Field label="Area m²" htmlFor="areaSqm" error={errors.areaSqm} required>
                <Input
                  id="areaSqm"
                  type="number"
                  min="1"
                  value={form.areaSqm}
                  onChange={(event) => update({ areaSqm: event.target.value })}
                  placeholder="480"
                />
              </Field>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-ink-500">
              Use 0 bedrooms for land, halls and open commercial space. Area is internal floor area in square metres.
            </p>
          </SectionCard>

          <SectionCard title="Summary">
            <dl className="space-y-2.5 text-sm">
              {[
                ['Category', form.category === 'commercial' ? 'Commercial' : 'Residential'],
                ['Type', form.type],
                ['Price', form.priceETB ? formatPrice(Number(form.priceETB), currency, rate) : '—'],
                ['Basis', form.priceType === 'sale' ? 'For sale' : form.priceType === 'rent' ? 'Per month' : 'Per night'],
                ['Bedrooms', form.bedrooms || '—'],
                ['Bathrooms', form.bathrooms || '—'],
                ['Area', form.areaSqm ? `${Number(form.areaSqm).toLocaleString('en-US')} m²` : '—'],
                ['Photos', photos.length],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 border-b border-ink-800 pb-2 last:border-0 last:pb-0">
                  <dt className="text-ink-500">{label}</dt>
                  <dd className="text-right text-stone">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-ink-800 bg-ink-950/50 p-3">
              <span className="text-[11px] text-ink-500">Featured photo</span>
              {photos[0] ? (
                <img
                  src={photos[0].pending ? photos[0].thumb : assetUrl(photos[0].thumb || photos[0].url)}
                  alt=""
                  className="h-10 w-14 rounded object-cover"
                />
              ) : (
                <span className="text-[11px] text-stone">Not set</span>
              )}
            </div>
          </SectionCard>

          <Card className="p-5">
            <p className="text-xs leading-relaxed text-stone">
              {isNew
                ? 'Publishing creates the listing and uploads photos. You can edit everything afterwards.'
                : 'Saving replaces the photos and details on the live site instantly.'}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Button type="submit" form="listing-form" loading={saving} className="w-full">
                {saving && progress ? progress : isNew ? 'Publish listing' : 'Save changes'}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={leave} disabled={saving}>
                {dirty ? 'Discard changes' : 'Close editor'}
              </Button>
            </div>
            {saving && (
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-champagne-300">
                <Loader2 className="h-3 w-3 animate-spin" /> {progress || 'Working…'}
              </p>
            )}
          </Card>
        </div>
      </form>

      <Modal
        open={confirmDelete}
        onClose={() => (deleting ? null : setConfirmDelete(false))}
        title="Delete this listing?"
        width="max-w-md"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setConfirmDelete(false)} disabled={deleting}>
              Keep listing
            </Button>
            <Button type="button" variant="danger" onClick={removeListing} loading={deleting}>
              <Trash2 className="h-4 w-4" />
              Delete permanently
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-stone">
          <span className="text-ivory">“{form.title}”</span> will be removed from the website immediately. Use
          <span className="text-ivory"> Reserved</span> or <span className="text-ivory">Rented</span> instead if the
          property is only temporarily off the market.
        </p>
      </Modal>

      <Modal
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        title="Discard unsaved changes?"
        width="max-w-md"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setConfirmLeave(false)}>
              Keep editing
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => { setConfirmLeave(false); navigate('/admin/listings'); }}
            >
              Discard and leave
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-stone">
          You have edits that have not been saved. Leaving now will lose them.
        </p>
      </Modal>
    </div>
  );
}
