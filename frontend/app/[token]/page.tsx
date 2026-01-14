import MailboxView from "@/components/mailbox/MailboxView";

export default function MailboxPage({ params }: { params: { token: string } }) {
  return <MailboxView token={params.token} />;
}
