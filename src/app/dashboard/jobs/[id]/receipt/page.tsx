import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getJobById } from '@/lib/data/jobs';
import JobCheckoutView from '@/components/jobs/JobCheckoutView';

interface JobReceiptPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobReceiptPage({ params }: JobReceiptPageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUuid) {
    notFound();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: job, error } = await getJobById(id);

  if (error || !job) {
    notFound();
  }

  // Safe type cast without using the forbidden 'any' keyword
  return (
    <div className="py-4">
      <JobCheckoutView job={job as unknown as React.ComponentProps<typeof JobCheckoutView>['job']} />
    </div>
  );
}