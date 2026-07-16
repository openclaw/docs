---
read_when:
    - ارتقای یک نصب موجود Matrix
    - مهاجرت تاریخچه رمزگذاری‌شده و وضعیت دستگاه Matrix
summary: چگونگی ارتقای درجا Plugin قبلی Matrix توسط OpenClaw، شامل محدودیت‌های بازیابی وضعیت رمزگذاری‌شده و مراحل بازیابی دستی.
title: مهاجرت Matrix
x-i18n:
    generated_at: "2026-07-16T15:30:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 33d5ac134338c8032ca1507ceee6eade2d37b3c86f0045fb883304ad208cd5e5
    source_path: channels/matrix-migration.md
    workflow: 16
---

از plugin عمومی قبلی `matrix` به پیاده‌سازی فعلی ارتقا دهید.

برای بیشتر کاربران، ارتقا در محل انجام می‌شود:

- plugin همان `@openclaw/matrix` باقی می‌ماند
- کانال همان `matrix` باقی می‌ماند
- پیکربندی شما زیر `channels.matrix` باقی می‌ماند
- اعتبارنامه‌های ذخیره‌شده در حافظه نهان زیر `~/.openclaw/credentials/matrix/` باقی می‌مانند
- وضعیت زمان اجرا زیر `~/.openclaw/matrix/` باقی می‌ماند

نیازی نیست کلیدهای پیکربندی را تغییر نام دهید یا plugin را با نام جدیدی دوباره نصب کنید.
بسته ریشه `openclaw` دیگر کد زمان اجرای Matrix یا وابستگی‌های Matrix SDK را
در خود نمی‌گنجاند. اگر `openclaw channels status` نشان می‌دهد Matrix پیکربندی شده است اما
plugin نصب نیست، `openclaw doctor --fix` یا
`openclaw plugins install @openclaw/matrix` را اجرا کنید؛ بسته‌های Matrix SDK را
در بسته ریشه OpenClaw نصب نکنید.

## مهاجرت به‌طور خودکار چه می‌کند

مهاجرت Matrix هنگام اجرای [`openclaw doctor --fix`](/fa/gateway/doctor) انجام می‌شود و همچنین به‌عنوان راهکار جایگزین، زمانی اجرا می‌شود که کلاینت Matrix شروع به کار کند و هنوز وضعیت جانبی مبتنی بر فایل را کنار مخزن SQLite خود بیابد.

مهاجرت خودکار موارد زیر را پوشش می‌دهد:

- استفاده مجدد از اعتبارنامه‌های ذخیره‌شده Matrix در حافظه نهان
- حفظ همان انتخاب حساب و پیکربندی `channels.matrix`
- وارد کردن وضعیت جانبی مبتنی بر فایل (حافظه نهان همگام‌سازی `bot-storage.json`، ‏`recovery-key.json`، ‏`legacy-crypto-migration.json`، تصاویر لحظه‌ای IndexedDB) به وضعیت SQLite مربوط به Matrix؛ فایل‌های مهاجرت‌یافته با پسوند `.migrated` بایگانی می‌شوند
- استفاده مجدد از کامل‌ترین ریشه ذخیره‌سازی هش توکن موجود برای همان حساب Matrix، سرور خانگی، کاربر و دستگاه، هنگامی که توکن دسترسی بعداً تغییر می‌کند

## ارتقا از نسخه‌های OpenClaw قدیمی‌تر از 2026.4

نسخه‌های منتشرشده تا مجموعه 2026.6 همچنین چیدمان تخت و تک‌مخزنی اولیه
Matrix ‏(`~/.openclaw/matrix/bot-storage.json` به‌همراه
`~/.openclaw/matrix/crypto/`) را مهاجرت می‌دادند و بازیابی وضعیت رمزگذاری‌شده از
مخزن رمزنگاری قدیمی rust را آماده می‌کردند. نسخه‌های فعلی دیگر آن مهاجرت را دربر ندارند.

اگر نصبی را ارتقا می‌دهید که هنوز از چیدمان تخت استفاده می‌کند، ابتدا
به یکی از نسخه‌های 2026.6 ارتقا دهید، `openclaw doctor --fix` را اجرا کنید و Gateway را
یک‌بار راه‌اندازی کنید تا مخزن تخت و همه کلیدهای قابل‌بازیابی اتاق مهاجرت داده شوند. سپس
به آخرین نسخه به‌روزرسانی کنید.

plugin عمومی قبلی Matrix به‌طور خودکار از کلیدهای اتاق Matrix پشتیبان تهیه **نمی‌کرد**. اگر نصب قدیمی شما تاریخچه رمزگذاری‌شده‌ای داشت که فقط به‌صورت محلی نگهداری می‌شد و هرگز پشتیبان‌گیری نشده بود، ممکن است برخی پیام‌های رمزگذاری‌شده قدیمی، صرف‌نظر از مسیر مهاجرت، پس از ارتقا همچنان ناخوانا بمانند.

## روند پیشنهادی ارتقا

1. OpenClaw و plugin مربوط به Matrix را به‌طور معمول به‌روزرسانی کنید.
2. اجرا کنید:

   ```bash
   openclaw doctor --fix
   ```

3. Gateway را راه‌اندازی یا مجدداً راه‌اندازی کنید.
4. وضعیت فعلی تأیید و پشتیبان‌گیری را بررسی کنید:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. کلید بازیابی حساب Matrix در حال تعمیر را در یک متغیر محیطی مختص همان حساب قرار دهید. برای یک حساب پیش‌فرض، `MATRIX_RECOVERY_KEY` مناسب است. برای چند حساب، برای هر حساب از یک متغیر استفاده کنید؛ برای مثال `MATRIX_RECOVERY_KEY_ASSISTANT`، و `--account assistant` را به فرمان اضافه کنید.

6. اگر OpenClaw اعلام کرد که کلید بازیابی لازم است، فرمان مربوط به حساب منطبق را اجرا کنید:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. اگر این دستگاه هنوز تأیید نشده است، فرمان مربوط به حساب منطبق را اجرا کنید:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   اگر کلید بازیابی پذیرفته شد و پشتیبان قابل‌استفاده است، اما `Cross-signing verified`
   همچنان `no` است، خودتأییدی را از یک کلاینت دیگر Matrix تکمیل کنید:

   ```bash
   openclaw matrix verify self
   ```

   درخواست را در کلاینت دیگری از Matrix بپذیرید، ایموجی‌ها یا اعداد اعشاری را مقایسه کنید
   و تنها زمانی `yes` را وارد کنید که مطابقت دارند. فرمان پیش از اعلام موفقیت، منتظر
   اعتماد کامل هویت Matrix می‌ماند.

8. اگر عمداً تاریخچه قدیمی و بازیابی‌ناپذیر را کنار می‌گذارید و برای پیام‌های آینده یک مبنای پشتیبان تازه می‌خواهید، اجرا کنید:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

   تنها زمانی `--rotate-recovery-key` را اضافه کنید که کلید بازیابی قدیمی دیگر نباید بتواند پشتیبان تازه را باز کند.

9. اگر هنوز هیچ پشتیبان کلید سمت سرور وجود ندارد، برای بازیابی‌های آینده یکی ایجاد کنید:

   ```bash
   openclaw matrix verify bootstrap
   ```

## پیام‌های رایج و معنای آن‌ها

`Failed migrating legacy Matrix client storage: ...`

- معنا: راهکار جایگزین سمت کلاینت Matrix وضعیت جانبی مبتنی بر فایل را پیدا کرد، اما وارد کردن آن به SQLite ناموفق بود. OpenClaw جابه‌جایی‌های تکمیل‌شده را برمی‌گرداند و به‌جای شروع بی‌سروصدا با یک مخزن تازه، آن راهکار جایگزین را متوقف می‌کند.
- اقدام لازم: مجوزها یا تداخل‌های سامانه فایل را بررسی کنید، وضعیت قدیمی را دست‌نخورده نگه دارید و پس از رفع خطا دوباره تلاش کنید.

`Matrix is installed from a custom path: ...`

- معنا: Matrix به یک نصب مبتنی بر مسیر سنجاق شده است؛ بنابراین به‌روزرسانی‌های شاخه اصلی آن را به‌طور خودکار با بسته پیش‌فرض Matrix جایگزین نمی‌کنند.
- اقدام لازم: هنگامی که می‌خواهید به plugin پیش‌فرض Matrix بازگردید، با `openclaw plugins install @openclaw/matrix` دوباره نصب کنید.

`Matrix is installed from a custom path that no longer exists: ...`

- معنا: رکورد نصب plugin شما به یک مسیر محلی اشاره می‌کند که دیگر وجود ندارد.
- اقدام لازم: با `openclaw plugins install @openclaw/matrix` دوباره نصب کنید، یا اگر از نسخه تسویه‌شده مخزن اجرا می‌کنید، از `openclaw plugins install ./path/to/local/matrix-plugin` استفاده کنید. `openclaw doctor --fix` نیز می‌تواند ارجاع‌های منسوخ plugin مربوط به Matrix را برای شما حذف کند.

### پیام‌های بازیابی دستی

`openclaw matrix verify status` و `openclaw matrix verify backup status` هنگامی که پشتیبان کلید اتاق روی این دستگاه سالم نیست، یک خط `Backup issue:` به‌همراه راهنمای `Next steps:` چاپ می‌کنند:

| مشکل پشتیبان                                                          | معنا                                            | راه‌حل                                                                                                                                       |
| --------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `no room-key backup exists on the homeserver`                         | چیزی برای بازیابی وجود ندارد                            | `openclaw matrix verify bootstrap` برای ایجاد پشتیبان کلید اتاق                                                                            |
| `backup decryption key is not loaded on this device`                  | کلید وجود دارد، اما اینجا فعال نیست                  | `openclaw matrix verify backup restore`؛ اگر هنوز نمی‌تواند کلید را بارگیری کند، کلید بازیابی را از طریق `--recovery-key-stdin` پایپ کنید                |
| `backup decryption key could not be loaded from secret storage (...)` | بارگیری مخزن محرمانه ناموفق بود یا پشتیبانی نمی‌شود       | کلید بازیابی را پایپ کنید: `printf '%s\n' "$MATRIX_RECOVERY_KEY" \| openclaw matrix verify backup restore --recovery-key-stdin`               |
| `backup key mismatch (...)`                                           | کلید ذخیره‌شده با پشتیبان فعال سرور مطابقت ندارد | `verify backup restore --recovery-key-stdin` را با کلید پشتیبان فعال سرور دوباره اجرا کنید، یا برای مبنایی تازه از `verify backup reset --yes` استفاده کنید |
| `backup signature chain is not trusted by this device`                | دستگاه هنوز به زنجیره امضای متقابل اعتماد ندارد  | `verify device --recovery-key-stdin`، سپس اگر اعتماد همچنان ناقص است، `verify self` را از کلاینت تأییدشده دیگری اجرا کنید                        |
| `backup exists but is not active on this device`                      | پشتیبان سرور موجود است، نشست محلی غیرفعال است      | ابتدا دستگاه را تأیید کنید، سپس با `openclaw matrix verify backup status` دوباره بررسی کنید                                                         |
| `backup trust state could not be fully determined`                    | نتایج عیب‌یابی قطعی نبودند                      | `openclaw matrix verify status --verbose`                                                                                                 |

سایر خطاهای بازیابی:

`Matrix recovery key is required`

- معنا: مرحله‌ای از بازیابی را بدون ارائه کلید بازیابی اجرا کردید، درحالی‌که کلید لازم بود.
- اقدام لازم: فرمان را با `--recovery-key-stdin` دوباره اجرا کنید؛ برای مثال `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- معنا: کلید ارائه‌شده قابل‌تجزیه نبود یا با قالب مورد انتظار مطابقت نداشت.
- اقدام لازم: با کلید بازیابی دقیق از کلاینت Matrix یا خروجی کلید بازیابی دوباره تلاش کنید.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- معنا: کلید بازیابی، محتوای قابل‌استفاده پشتیبان را باز کرد، اما Matrix هنوز اعتماد کامل هویت امضای متقابل را برای این دستگاه برقرار نکرده است. خروجی فرمان را برای `Recovery key accepted`، ‏`Backup usable`، ‏`Cross-signing verified` و `Device verified by owner` بررسی کنید.
- اقدام لازم: `openclaw matrix verify self` را اجرا کنید، درخواست را در کلاینت دیگری از Matrix بپذیرید، SAS را مقایسه کنید و تنها زمانی `yes` را وارد کنید که مطابقت دارد. تنها زمانی از `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing` استفاده کنید که عمداً می‌خواهید هویت امضای متقابل فعلی را جایگزین کنید.

اگر از دست رفتن تاریخچه رمزگذاری‌شده قدیمی و بازیابی‌ناپذیر را می‌پذیرید، می‌توانید در عوض
مبنای پشتیبان فعلی را با `openclaw matrix verify backup reset --yes` بازنشانی کنید. هنگامی که
رمز پشتیبان ذخیره‌شده خراب است، این بازنشانی مخزن محرمانه را نیز تعمیر می‌کند تا
کلید پشتیبان جدید پس از راه‌اندازی مجدد به‌درستی بارگیری شود.

## اگر تاریخچه رمزگذاری‌شده همچنان بازنمی‌گردد

این بررسی‌ها را به‌ترتیب اجرا کنید:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

اگر پشتیبان با موفقیت بازیابی شد، اما تاریخچه برخی اتاق‌های قدیمی همچنان موجود نیست، احتمالاً plugin قبلی هرگز از آن کلیدهای مفقود پشتیبان نگرفته بود.

## اگر می‌خواهید برای پیام‌های آینده از نو شروع کنید

اگر از دست رفتن تاریخچه رمزگذاری‌شده قدیمی و بازیابی‌ناپذیر را می‌پذیرید و فقط یک مبنای پشتیبان پاک برای آینده می‌خواهید، این فرمان‌ها را به‌ترتیب اجرا کنید:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

اگر پس از آن دستگاه همچنان تأیید نشده است، با مقایسه ایموجی‌های SAS یا کدهای اعشاری در کلاینت Matrix خود و تأیید مطابقت آن‌ها، فرایند تأیید را تکمیل کنید.

## مرتبط

- [Matrix](/fa/channels/matrix): راه‌اندازی و پیکربندی کانال.
- [قواعد پوش Matrix](/fa/channels/matrix-push-rules): مسیریابی اعلان‌ها.
- [Doctor](/fa/gateway/doctor): بررسی سلامت و محرک مهاجرت خودکار.
- [راهنمای مهاجرت](/fa/install/migrating): همه مسیرهای مهاجرت (انتقال میان دستگاه‌ها، وارد کردن میان سامانه‌ها).
- [Pluginها](/fa/tools/plugin): نصب و ثبت plugin.
