import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { InputField } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { useLogin } from '@/api/queries';
import { useAuth } from '@/hooks/use-auth';
import { loginFormSchema, type LoginValues } from '@/lib/schemas';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { signIn, isAuthenticated, staff } = useAuth();
  const login = useLogin();

  const redirectTo = searchParams.get('next') ?? '/orders';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: 'dispatcher@onway.test', password: '' },
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

  if (isAuthenticated) {
    return (
      <div className="mx-auto max-w-md rounded-lg border border-hairline bg-slate-surface p-6 text-center">
        <ShieldCheck className="mx-auto size-6 text-delivered" aria-hidden />
        <p className="mt-3 text-sm font-medium">Already signed in as {staff?.name}</p>
        <Link
          to="/orders"
          className="mt-4 inline-flex h-9 items-center rounded-md bg-signal px-4 text-sm font-semibold text-graphite"
        >
          Go to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Staff sign in</h1>
        <p className="mt-1 text-sm text-fog">
          A token is only required to advance an order's status — browsing, creating and cancelling
          stay open, which is exactly the scope the brief asks to protect.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        noValidate
        className="space-y-4 rounded-lg border border-hairline bg-slate-surface p-5"
      >
        <InputField
          label="Email"
          type="email"
          autoComplete="username"
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
          Sign in
        </Button>
      </form>

      <p className="rounded-md border border-hairline bg-graphite-deep px-4 py-3 font-mono text-[11px] text-fog-dim">
        Demo account (created by <span className="text-fog">npm run db:seed</span>):
        <br />
        dispatcher@onway.test / onway-demo-2026
      </p>
    </div>
  );
}
