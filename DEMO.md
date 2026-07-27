# CliniQ — Demo Script

All accounts use the password: **`password123`**

---

## 1. Role-based access & dashboards

Log in as each role to show what they can and can't see:

| Role | Email |
|---|---|
| Admin | admin@medrecrut.dev |
| Doctor (x4) | doctor1@medrecrut.dev … doctor4@medrecrut.dev |
| Receptionist | reception@medrecrut.dev |

- **Admin** sees every page including Users, Audit log, and Reports.
- **Doctor** sees Patients, Appointments, Pharmacy, Messages — but not Billing, Users, or Audit log.
- **Receptionist** sees Patients, Appointments, Billing, Pharmacy, Messages — but not Users or Audit log.

### Home dashboards

Each role lands on a tailored home screen after login (or by clicking **CliniQ** in the sidebar).

**Admin dashboard**

- Alert strip: unpaid invoice count → Billing; low-stock medication count → Pharmacy.
- 4 stat cards: today's appointments (by status), this week's appointments, revenue overview (UNPAID / PAID total), total patients + new this month.
- Doctor workload bar chart for the current week.
- Recent activity feed (last 5 audit log entries).

**Doctor dashboard**

- Next upcoming appointment highlighted at the top.
- 4 stat cards: today's schedule, unique patients seen this week, prescriptions written this week, unread messages.
- Full list of today's appointments with status pills.

**Receptionist dashboard**

- Alert banners for unpaid invoices and unread messages (clickable links).
- 4 stat cards: appointments today, invoices outstanding (count + MAD total), new patients this week, unread messages.
- Today's appointment list sorted with upcoming (SCHEDULED) entries first.

---

## 2. Patients

Log in as **admin** → open **Patients**.

- Click any patient name to open their profile: personal details, appointment history, prescriptions, invoices.
- Click **Add patient** → fill in the form → patient appears in the list.
- Use the search box to filter by name.

---

## 3. Appointments

Stay logged in as **admin** → open **Appointments**.

- Click **New appointment** → pick a patient, doctor, date/time → submit.
  - The assigned doctor instantly receives a notification (bell icon, top-right).
- Use the Doctor and Date filters to narrow the list.
- Change an appointment's status inline via the status dropdown (SCHEDULED → COMPLETED, etc.).

### Calendar view

- Click the **Calendar** toggle (top-left of the appointments area) to switch from the table to a monthly grid.
- Each day cell shows color-coded chips: blue = Scheduled, green = Completed, grey = Cancelled. Today's date is highlighted in green.
- Click any day with appointments to open a detail panel — from there you can change status, edit notes, or open the diagnosis dialog without leaving the calendar.
- Use the **‹ / ›** arrows to move between months, or click **Today** to jump back to the current month.
- The **Doctor** filter works the same as in table view — it narrows which appointments appear in the grid.

### Notes (doctor only)

- Log in as **doctor1** → open **Appointments**.
- Find an appointment you own (doctor column shows "Dr. …") → click the **notebook icon**.
- Type raw clinical notes and hit **Save**.
- Re-open the dialog → click **Summarize with AI** → Claude rewrites the notes into SOAP format (Subjective / Objective / Assessment / Plan). Review, then Save.

### Diagnosis + patient advice (completed appointments only)

- Find a **COMPLETED** appointment you own → click the **stethoscope icon** (greyed out on non-completed rows).
- Type or edit the diagnosis → hit **Save**.
- Click **Generate patient advice** → Claude writes a 150–250 word plain-language advisory covering what the condition means, lifestyle tips, warning signs, and follow-up. Copy it with the Copy button.

---

## 4. Billing

Log in as **admin** or **receptionist** → open **Billing**.

- Click **New invoice** → pick an un-invoiced appointment → enter amount in MAD → submit.
- Change invoice status inline (UNPAID → PAID → CANCELLED).
- Filter by status or doctor; sort by date.

---

## 5. Pharmacy

Open **Pharmacy**.

- **Inventory** tab: stock levels, reorder threshold warnings, add/edit items and categories.
- **Prescriptions** tab: create a prescription linked to an appointment, add line items (medication + quantity).
- Items below reorder threshold are highlighted.

---

## 6. Messaging

Open two browser windows — log in as **doctor1** in one and **reception** in the other.

- In the **doctor1** window, click the **chat bubble** (bottom-right corner) → start a conversation with Reception.
- Send a message (text or attach an image/file up to 5 MB).
- Watch the **reception** window — the unread badge on the chat widget updates in real time.
- Reply from reception; the conversation updates live on both sides.

---

## 7. Notifications (real-time)

- Still with both windows open: in the **reception** window, create a new appointment for **Doctor 1**.
- Watch the **doctor1** window — the **bell icon** in the header shows a red badge immediately (Supabase Realtime, no page refresh needed).
- Click the bell to see the notification. Opening the dropdown marks it as read.

---

## 8. Dark mode

- Click the **sun/moon icon** in the top-right header to toggle between light and dark themes.
- The preference persists across page navigations.

---

## 9. Users (admin only)

Log in as **admin** → open **Users**.

- Add a new staff member, assign a role, set a temporary password.
- Deactivate an existing account — they will be blocked from logging in.
- Active users can change their own password on first login.

---

## 10. Audit log (admin only)

Open **Audit log**.

- Every create/update/delete action (appointments, invoices, prescriptions, patients, users) is recorded with actor, timestamp, and before/after values.
- Filter by entity type or actor.

---

## 11. Reports (admin only)

Open **Reports**.

- Appointment counts by status and doctor.
- Revenue summary from invoices.
- Pharmacy stock overview.

---

## 12. Settings (all roles)

Click your **name** at the bottom of the sidebar (the panel showing your name, role, and a ⚙ icon) → opens **Settings**.

- Update your display name and email address.
- Change your password (current password required; new password confirmed twice).
- Doctors and Receptionists forced to change their password on first login are redirected here automatically.
