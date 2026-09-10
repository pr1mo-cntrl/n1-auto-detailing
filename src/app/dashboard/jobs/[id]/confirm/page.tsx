import { redirect } from 'next/navigation';
import { getJobById } from '@/lib/data/jobs';
import CustomerConfirmationView from '@/components/jobs/CustomerConfirmationView';

interface ConfirmPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobCustomerConfirmPage({ params }: ConfirmPageProps) {
  const { id } = await params;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUuid) {
    redirect('/dashboard/jobs');
  }

  const { data: job } = await getJobById(id);

  if (!job || job.job_status !== 'PENDING' || job.customer_confirmed_at !== null) {
    redirect(`/dashboard/jobs/${id}`);
  }

  return <CustomerConfirmationView job={job} />;
}