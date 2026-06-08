# דוח RPE קבוצתי

אפליקציית RTL בעברית לניהול דיווחי RPE יומיים של שחקני כדורגל.

## Production

Production deployment is prepared for Vercel. See [DEPLOYMENT.md](DEPLOYMENT.md) for environment variables, Supabase setup, route checks, and the production checklist.

Supabase migration details are in [SUPABASE_MIGRATION.md](SUPABASE_MIGRATION.md). The app now supports `RPE_STORAGE_DRIVER=supabase`; `localStorage` remains available only as demo fallback mode.

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

PIN דמו:

- עומר: `1111`
- אביב: `2222`
- שי: `3333`
- שחר: `4444`
- אלון: `5555`
- יואב: `6666`
- גיא: `7777`
- יגל: `8888`
- בר: `9999`

## אחסון

הגרסה הנוכחית משתמשת ב-`localStorage` וכוללת נתוני דמו עם דוחות מוכנות, דוחות RPE, חוסרים ודוגמאות סיכון. דוחות RPE נשמרים עדיין תחת `reports` כדי לשמור על חישובי העומס הקיימים, ודוחות מוכנות נשמרים תחת `readinessReports`.

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
