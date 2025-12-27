import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirect=/admin');
  }

  return <div className="container mx-auto p-8">{children}</div>;
}


