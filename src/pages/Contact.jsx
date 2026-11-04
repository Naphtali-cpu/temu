import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle, Clock, Mail, MapPin, MessageSquare, Phone, ShieldCheck } from 'lucide-react';
import { Alert, Button, Field, Input, Select, Textarea } from '../components/ui.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { inquiriesApi } from '../api/index.js';
import { apiErrorMessage, apiFieldErrors } from '../api/client.js';
import { openTelegram, openWhatsApp } from '../lib/contact.js';
import { SITE } from '../lib/site.js';

const PURPOSES = [
  'General Inquiry',
  'Airbnb Stay',
  'Rental',
  'Buying Luxury Property',
  'Property Listing',
];

const INITIAL = { fullName: '', email: '', phone: '', purpose: 'General Inquiry', message: '' };

export function ContactForm({ defaultPurpose = 'General Inquiry', propertyId = null, compact = false }) {
  const [form, setForm] = useState({ ...INITIAL, purpose: defaultPurpose });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setForm((current) => ({ ...current, purpose: defaultPurpose }));
  }, [defaultPurpose]);

  const update = (patch) => setForm((current) => ({ ...current, ...patch }));

  const submit = async (event) => {
    event.preventDefault();
    setErrors({});
    setFormError('');
    setSubmitting(true);
    try {
      await inquiriesApi.submit({ ...form, propertyId });
      setSent(true);
      toast('Your inquiry has reached the managing director. We reply within one business day.', 'success', 'Inquiry received');
    } catch (error) {
      const fieldErrors = apiFieldErrors(error);
      setErrors(fieldErrors);
      setFormError(Object.keys(fieldErrors).length ? '' : apiErrorMessage(error, 'Your inquiry could not be sent.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/[0.06] p-8 text-center">
        <CheckCircle className="mx-auto h-9 w-9 text-success-ink" />
        <h3 className="mt-4 font-display text-2xl text-ivory">Thank you — your inquiry is with us.</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-stone">
          The managing director will respond within one business day. For anything urgent, reach us directly on
          WhatsApp or Telegram.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={() => openWhatsApp('General Inquiry')}>
            <MessageSquare className="h-4 w-4" /> WhatsApp
          </Button>
          <Button type="button" variant="outline" onClick={() => openTelegram('General Inquiry')}>
            Telegram
          </Button>
        </div>
        <button
          type="button"
          onClick={() => { setSent(false); setForm({ ...INITIAL, purpose: defaultPurpose }); }}
          className="mt-6 text-xs text-stone underline underline-offset-4 hover:text-ivory"
        >
          Send another inquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {formError && <Alert>{formError}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="fullName" error={errors.fullName} required>
          <Input
            id="fullName"
            value={form.fullName}
            onChange={(event) => update({ fullName: event.target.value })}
            placeholder="Abebe Bikila"
            autoComplete="name"
            required
          />
        </Field>
        <Field label="Email address" htmlFor="email" error={errors.email} required>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) => update({ email: event.target.value })}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone number" htmlFor="phone" error={errors.phone} hint="Optional, for quick follow-up.">
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(event) => update({ phone: event.target.value })}
            placeholder="+251 9…"
            autoComplete="tel"
          />
        </Field>
        <Field label="Inquiry purpose" htmlFor="purpose" error={errors.purpose}>
          <Select id="purpose" value={form.purpose} onChange={(event) => update({ purpose: event.target.value })}>
            {PURPOSES.map((purpose) => (
              <option key={purpose} value={purpose}>{purpose}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Message" htmlFor="message" error={errors.message} required>
        <Textarea
          id="message"
          rows={compact ? 4 : 5}
          value={form.message}
          onChange={(event) => update({ message: event.target.value })}
          placeholder="Tell us about the neighbourhood, budget or dates you have in mind…"
          required
        />
      </Field>

      <Button type="submit" className="w-full sm:w-auto" loading={submitting}>
        Send inquiry
        {!submitting && <ArrowRight className="h-4 w-4" />}
      </Button>
      <p className="text-[11px] text-ink-500">
        Your details are used only to respond to this inquiry. We never share client information.
      </p>
    </form>
  );
}

export default function Contact() {
  const [searchParams] = useSearchParams();
  const purpose = PURPOSES.includes(searchParams.get('purpose')) ? searchParams.get('purpose') : 'General Inquiry';
  const propertyId = searchParams.get('property');

  return (
    <>
      <section className="border-b border-ink-800 bg-ink-900/40">
        <div className="shell py-16">
          <p className="eyebrow">Get in touch</p>
          <h1 className="mt-4 max-w-2xl font-display text-[42px] leading-[1.05] text-ivory sm:text-6xl">
            A direct conversation, <span className="italic text-champagne-200">no call centre</span>.
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-stone">
            Tell us what you are looking for — buy, lease or short stay — and the managing director will respond
            personally within one business day.
          </p>
        </div>
      </section>

      <div className="shell grid gap-10 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div className="rounded-xl border border-ink-700 bg-ink-900 p-6 sm:p-8">
          <h2 className="font-display text-2xl text-ivory">Send us a message</h2>
          <p className="mt-1 text-sm text-stone">All fields marked with an asterisk are required.</p>
          <div className="mt-6">
            <ContactForm defaultPurpose={purpose} propertyId={propertyId} />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-ink-700 bg-ink-900 p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full border border-champagne-400/40 bg-champagne-400/10 font-display text-lg text-champagne-200">
                {SITE.agent.initials}
              </div>
              <div>
                <p className="font-display text-xl text-ivory">{SITE.agent.name}</p>
                <p className="text-[11px] uppercase tracking-[0.16em] text-champagne-400">{SITE.agent.title}</p>
              </div>
            </div>

            <div className="mt-6 space-y-4 border-t border-ink-800 pt-5 text-sm">
              <a href={`tel:+${SITE.agent.phoneIntl}`} className="flex items-start gap-3 text-stone transition hover:text-ivory">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-champagne-400" />
                {SITE.agent.phoneDisplay}
              </a>
              <a href={`mailto:${SITE.agent.email}`} className="flex items-start gap-3 text-stone transition hover:text-ivory">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-champagne-400" />
                {SITE.agent.email}
              </a>
              <p className="flex items-start gap-3 text-stone">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-champagne-400" />
                {SITE.agent.office}
              </p>
              <p className="flex items-start gap-3 text-stone">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-champagne-400" />
                Monday – Saturday, 8:30 – 18:00 (EAT)
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" onClick={() => openWhatsApp('General Contact Request')} className="w-full">
              <MessageSquare className="h-4 w-4" /> WhatsApp
            </Button>
            <Button type="button" variant="outline" onClick={() => openTelegram('General Contact Request')} className="w-full">
              Telegram
            </Button>
          </div>

          <div className="rounded-xl border border-ink-700 bg-ink-900 p-6">
            <div className="flex items-center gap-2 text-sm text-ivory">
              <ShieldCheck className="h-4 w-4 text-champagne-400" />
              Working privately with us
            </div>
            <p className="mt-2 text-xs leading-relaxed text-stone">
              We do not share client information with third parties, and viewings are arranged directly with the
              director — never through agents.
            </p>
            <Link to="/portal" className="mt-4 inline-flex items-center gap-1.5 text-xs text-champagne-300 hover:text-champagne-200">
              Register for the VIP collection <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
