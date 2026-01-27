'use client';

import { MailboxViewV2 } from '@/components-v2/mailbox/MailboxViewV2';

export default function MailboxPage({ params }: { params: { token: string } }) {
  return <MailboxViewV2 token={params.token} />;
}
