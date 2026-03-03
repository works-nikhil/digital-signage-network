import LoginForm from '@/components/LoginForm';

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const redirectTo =
    typeof params?.redirectTo === 'string' && params.redirectTo.length > 0
      ? params.redirectTo
      : '/dashboard';

  return <LoginForm redirectTo={redirectTo} />;
}

