# דוח RPE קבוצתי

אפליקציית RTL בעברית לניהול דיווחי RPE יומיים של שחקני כדורגל.

## Production

Production deployment is prepared for Vercel. See [DEPLOYMENT.md](DEPLOYMENT.md) for environment variables, Supabase setup, route checks, and the production checklist.

Supabase migration details are in [SUPABASE_MIGRATION.md](SUPABASE_MIGRATION.md). The app now supports `RPE_STORAGE_DRIVER=supabase`; `localStorage` remains available only as demo fallback mode.

For the current two-team real-use setup, run `src/supabase-schema.sql`, create the two Supabase Auth coach users, then run `src/supabase-real-use-bootstrap.sql`. The bootstrap creates Team 1 / Team 2, player rosters and PINs, the player login RPCs, and the coach-to-team links after the Auth users exist. The active team is selected from the logged-in coach, not from frontend code.

## Owner/Admin Management

The platform now includes an owner-only management area at `/coach/admin` with the sidebar label `ניהול מערכת`.

Initial owner bootstrap:

- Create Supabase Auth user: `mark2fitness4max@gmail.com`
- Temporary password: `OwnerAdmin!2026`
- Run `src/supabase-owner-admin.sql`
- Configure server-side `SUPABASE_SERVICE_ROLE_KEY` for `/api/admin`

From `/coach/admin`, the owner can create teams, create/reset coach logins, assign coaches to one or more teams, set roles (`team_admin`, `coach`, `viewer`), and manage players, positions, active status, and PINs.

Regular coaches only see assigned team data. Team Admins can manage their assigned team. Viewers are read-only. Player login remains team code + PIN.

The deterministic one-month demo dataset and safe reseed flow are documented in [DEMO_DATA.md](DEMO_DATA.md).

## הרצה

```bash
npm run dev
```

ואז לפתוח:

- `http://localhost:4173/report`
- `http://localhost:4173/coach`
- `http://localhost:4173/coach/gps`
- `http://localhost:4173/coach/sessions`
- `http://localhost:4173/coach/settings`

## כניסת שחקן

הנתיב `/report` הוא מסך כניסה אישי. כל שחקן נכנס עם שם ו-PIN בן 4 ספרות, ואז יכול למלא רק את הדוחות שלו:

- דוח מוכנות לפני אימון
- דוח RPE אחרי אימון

PIN דמו נע בין `1001` לשחקן הראשון ועד `1022` לשחקן ה-22. הרשימה המלאה ופעולת הרענון זמינות ב-`/coach/settings`.

## אחסון

הגרסה תומכת ב-Supabase וב-`localStorage` כמצב דמו חלופי. מערך החודש כולל 22 שחקנים, ארבעה שבועות, דוחות מוכנות/RPE, GPS, הידרציה, חוסרים ודוגמאות סיכון. דוחות RPE נשמרים עדיין תחת `reports` כדי לשמור על חישובי העומס הקיימים, ודוחות מוכנות נשמרים תחת `readinessReports`.

## חישובים

עומס אימון מחושב רק לפי דקות שהמאמן הגדיר:

```text
עומס = דקות פעילות × RPE
```

קטגוריות עומס:

- `0-200`: קל מאוד
- `200-400`: קל
- `400-600`: בינוני
- `600-800`: קשה
- `800+`: קשה מאוד

הידרציה מחושבת רק כשיש משקל לפני אימון בדוח המוכנות ומשקל אחרי אימון בדוח RPE:

```text
ירידה בק"ג = משקל לפני - משקל אחרי
ירידה באחוזים = ירידה בק"ג / משקל לפני × 100
```

ציון המוכנות מתחיל מ-100 ומופחת לפי שינה, איכות שינה, אנרגיה, מוטיבציה, כאבי שריר, תחושת עומס, מגבלה רפואית והידרציה.

## GPS

עמוד `/coach/gps` מאפשר למאמן לייבא דוחות GPS מקובץ CSV או Excel XLSX.

הייבוא כולל:

- מיפוי עמודות גמיש עם תמיכה בכותרות בעברית ובאנגלית.
- תצוגה מקדימה לפני שמירה.
- התאמת שמות שחקנים לשחקנים קיימים.
- שמירת `GpsSession` ו-`GpsRecord` ב-`localStorage`.
- טבלת סקירה, Top 5, גרפים ודגלי סיכון מול דוחות מוכנות/RPE מאותו תאריך.
