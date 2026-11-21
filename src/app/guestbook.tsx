import { Guestbook } from '@/components/guestbook';
import { InfoPage } from '@/components/info-page';

/** Guestbook: visitors sign with name, city and a short note. Website only (see guestbook.web.tsx). */
export default function GuestbookScreen() {
  return (
    <InfoPage title="Guestbook">
      <Guestbook />
    </InfoPage>
  );
}
