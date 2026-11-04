import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Crown, Eye, EyeOff, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { Alert, Button, Checkbox, Field, Input } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiErrorMessage, apiFieldErrors } from '../api/client.js';
import { SITE } from '../lib/site.js';
import { cx } from '../lib/ui.js';

const BENEFITS = [
  'First access to VIP and off-market listings before publication',
  'Private viewing invitations and a direct line to the managing director',
  'Curated shortlists matched to your brief, budget and timeline',
];

function AuthForm({ mode, onModeChange }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', consent: false });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';
  const update = (patch) => setForm((current) => ({ ...current, ...patch }));

  const submit = async (event) => {
    event.preventDefault();
    setErrors({});
    setFormError('');
    setSubmitting(true);
    try {
      const user = isRegister
        ? await register({ fullName: form.fullName, email: form.email, password: form.password, newsletterConsent: form.consent })
        : await login({ email: form.email, password: form.password });
      const next = location.state?.from;
      navigate(next || (user.role === 'ADMIN' ? '/admin' : '/portal'), { replace: true });
    } catch (error) {
      const fieldErrors = apiFieldErrors(error);
      setErrors(fieldErrors);
      setFormError(Object.keys(fieldErrors).length ? '' : apiErrorMessage(error, 'We could not sign you in.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-ink-700 bg-ink-900 p-7 sm:p-8">
      <div className="flex rounded-lg border border-ink-700 bg-ink-950 p-1">
        {[
          { key: 'login', label: 'Sign in' },
          { key: 'register', label: 'Create account' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => { onModeChange(tab.key); setErrors({}); setFormError(''); }}
            className={cx(
              'flex-1 rounded-md py-2 text-[13px] font-medium transition',
              mode === tab.key ? 'bg-ink-800 text-ivory' : 'text-stone hover:text-ivory'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {formError && <Alert>{formError}</Alert>}

        {isRegister && (
          <Field label="Full name" htmlFor="fullName" error={errors.fullName} required>
            <Input
              id="fullName"
              autoComplete="name"
              value={form.fullName}
              onChange={(event) => update({ fullName: event.target.value })}
              placeholder="Abebe Bikila"
              required
            />
          </Field>
        )}

        <Field label="Email address" htmlFor="email" error={errors.email} required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => update({ email: event.target.value })}
            placeholder="you@example.com"
            required
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          error={errors.password}
          hint={isRegister ? 'At least 8 characters.' : undefined}
          required
        >
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              value={form.password}
              onChange={(event) => update({ password: event.target.value })}
              placeholder="••••••••"
              className="pr-11"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 transition hover:text-ivory"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        {isRegister && (
          <Checkbox
            checked={form.consent}
            onChange={(value) => update({ consent: value })}
            label="I agree to receive occasional VIP listing notices by email."
            hint={errors.newsletterConsent}
          />
        )}

        <Button type="submit" className="w-full" loading={submitting}>
          {isRegister ? 'Create my account' : 'Sign in'}
          {!submitting && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-ink-500">
        {isRegister ? 'Already registered?' : 'New to Temu Estates?'}{' '}
        <button
          type="button"
          onClick={() => onModeChange(isRegister ? 'login' : 'register')}
          className="text-champagne-300 hover:text-champagne-200"
        >
          {isRegister ? 'Sign in instead' : 'Create an account'}
        </button>
      </p>
    </div>
  );
}

export default function VIPPortal() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const [mode, setMode] = useState('login');
  const navigate = useNavigate();

  if (isAuthenticated) {
    return (
      <div className="shell py-16">
        <div className="mx-auto max-w-2xl rounded-xl border border-ink-700 bg-ink-900 p-8">
          <p className="eyebrow">Client portal</p>
          <h1 className="mt-3 font-display text-4xl text-ivory">Welcome, {user?.fullName?.split(' ')[0] || 'client'}.</h1>
          <p className="mt-3 text-sm leading-relaxed text-stone">
            {isAdmin
              ? 'You are signed in as an administrator. Open the dashboard to manage listings, photos and client enquiries.'
              : 'Your VIP access is active. Get in touch with the managing director for private viewings and off-market opportunities.'}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            {isAdmin && (
              <Button as={Link} to="/admin">
                <LayoutDashboard className="h-4 w-4" /> Open dashboard
              </Button>
            )}
            <Button
              as={Link}
              to={isAdmin ? '/admin/listings' : '/?vip=1'}
              variant={isAdmin ? 'outline' : 'primary'}
            >
              {isAdmin ? 'Manage listings' : 'View VIP listings'}
            </Button>
            <Button as={Link} to="/contact?purpose=Airbnb%20Stay" variant="ghost">
              Speak with the director
            </Button>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-ink-800 pt-5 text-xs text-ink-500">
            <span>{user?.email}</span>
            <button
              type="button"
              onClick={async () => { await logout(); navigate('/portal', { replace: true }); }}
              className="text-stone transition hover:text-danger-ink"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shell grid gap-12 py-16 lg:grid-cols-[1fr_0.85fr] lg:items-center">
      <div>
        <p className="eyebrow flex items-center gap-2">
          <Crown className="h-4 w-4 text-champagne-400" /> The client portal
        </p>
        <h1 className="mt-5 max-w-xl font-display text-[42px] leading-[1.05] text-ivory sm:text-6xl">
          For clients who prefer to see things <span className="italic text-champagne-200">first</span>.
        </h1>
        <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-stone">
          Sign in to reach the VIP collection and receive private viewing invitations directly from the
          managing director.
        </p>

        <ul className="mt-8 space-y-3">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-3 text-sm text-stone">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-champagne-400" />
              {benefit}
            </li>
          ))}
        </ul>

        <div className="mt-10 flex items-center gap-4 rounded-xl border border-ink-700 bg-ink-900 p-5">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-champagne-400/40 bg-champagne-400/10 font-display text-lg text-champagne-200">
            {SITE.agent.initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-ivory">{SITE.agent.name}</p>
            <p className="text-xs text-stone">
              {SITE.agent.phoneDisplay} · <a href={`mailto:${SITE.agent.email}`} className="hover:text-champagne-200">{SITE.agent.email}</a>
            </p>
          </div>
        </div>
      </div>

      <AuthForm mode={mode} onModeChange={setMode} />
    </div>
  );
}
