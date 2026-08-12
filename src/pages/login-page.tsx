import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { InputField } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { useLogin } from '@/api/queries';
import { useAuth } from '@/hooks/use-auth';
import { loginFormSchema, type LoginValues } from '@/lib/schemas';

/**
 * The demo account, pre-filled so a reviewer can sign in with one click.
 *
 * This is a staffed-ops console with exactly one provisioned account and no
 * sign-up route, so there is nothing to protect by hiding it — the same
 * credentials are in the README. On anything with real users these fields start
 * empty and this constant does not exist.
 */
const DEMO_CREDENTIALS = {
  email: 'admin@oneway.com',
  password: 'Defaulr@oneway',
} as const;

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { signIn, isAuthenticated } = useAuth();
  const login = useLogin();

  const redirectTo = searchParams.get('next') ?? '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: DEMO_CREDENTIALS,
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const session = await login.mutateAsync(values);
      signIn(session);
      toast.push('success', `Signed in as ${session.staff.name}`);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.push('error', 'Sign in failed', (error as Error).message);
    }
  });

  // Someone who is already signed in has no business on the sign-in screen.
  if (isAuthenticated) return <Navigate to={redirectTo} replace />;

  return (
    <div className="relative grid min-h-dvh place-items-center px-4 py-10">
      {/* The one place the theme is allowed to be decorative. Two soft blooms
          behind the card, nothing that moves and nothing that scrolls. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-accent/12 blur-[110px]" />
        <span className="absolute -bottom-52 left-[58%] size-[28rem] rounded-full bg-violet/10 blur-[110px]" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="flex items-center gap-3">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent-hi to-violet font-mono text-base font-bold text-white shadow-[0_6px_20px_-6px_rgba(47,107,255,0.9)]"
            aria-hidden
          >
            O
          </span>
          <div className="leading-tight">
            <p className="text-base font-semibold tracking-tight">Onway</p>
            <p className="font-mono text-[10px] tracking-widest text-fog-dim uppercase">
              Delivery control
            </p>
          </div>
        </div>

        <h1 className="mt-7 text-2xl font-semibold tracking-tight">Staff sign in</h1>
        <p className="mt-1.5 text-sm text-fog">
          Every order endpoint is behind a JWT. Sign in to reach the console.
        </p>

        <form
          onSubmit={onSubmit}
          noValidate
          className="panel mt-5 space-y-4 rounded-xl border border-hairline p-5 shadow-[0_1px_2px_rgba(0,0,0,0.4),0_24px_48px_-24px_rgba(0,0,0,0.9)]"
        >
          <InputField
            label="Email"
            type="email"
            autoComplete="username"
            autoFocus
            error={errors.email?.message}
            {...register('email')}
          />
          <InputField
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" variant="primary" className="w-full" loading={login.isPending}>
            {!login.isPending && <KeyRound className="size-4" aria-hidden />}
            {login.isPending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-4 rounded-lg border border-hairline bg-graphite-deep/70 px-4 py-3 font-mono text-[11px] leading-relaxed text-fog-dim">
          <span className="text-fog">Demo account</span> — already filled in.
          <br />
          {DEMO_CREDENTIALS.email} / {DEMO_CREDENTIALS.password}
        </p>
      </div>
    </div>
  );
}
