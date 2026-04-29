---
read_when:
    - ارتقای نصب موجود Matrix
    - مهاجرت تاریخچهٔ رمزگذاری‌شدهٔ Matrix و وضعیت دستگاه
summary: نحوهٔ ارتقای درجا Plugin Matrix قبلی توسط OpenClaw، شامل محدودیت‌های بازیابی وضعیت رمزنگاری‌شده و مراحل بازیابی دستی.
title: مهاجرت Matrix
x-i18n:
    generated_at: "2026-04-29T22:27:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: fff409eef1b7da7be4b63d8459a62b8365a04adf989f271a2f2c4aef46e90716
    source_path: channels/matrix-migration.md
    workflow: 16
---

از Plugin عمومی قبلی `matrix` به پیاده‌سازی فعلی ارتقا دهید.

برای بیشتر کاربران، ارتقا در محل انجام می‌شود:

- Plugin همان `@openclaw/matrix` می‌ماند
- کانال همان `matrix` می‌ماند
- پیکربندی شما زیر `channels.matrix` می‌ماند
- اعتبارنامه‌های کش‌شده زیر `~/.openclaw/credentials/matrix/` می‌مانند
- وضعیت زمان اجرا زیر `~/.openclaw/matrix/` می‌ماند

نیازی نیست کلیدهای پیکربندی را تغییر نام دهید یا Plugin را با نامی جدید دوباره نصب کنید.

## مهاجرت به‌صورت خودکار چه کاری انجام می‌دهد

وقتی Gateway شروع به کار می‌کند، و وقتی [`openclaw doctor --fix`](/fa/gateway/doctor) را اجرا می‌کنید، OpenClaw تلاش می‌کند وضعیت قدیمی Matrix را به‌صورت خودکار ترمیم کند.
پیش از آنکه هر مرحله مهاجرت قابل اقدام Matrix وضعیت روی دیسک را تغییر دهد، OpenClaw یک snapshot بازیابی متمرکز ایجاد می‌کند یا از آن دوباره استفاده می‌کند.

وقتی از `openclaw update` استفاده می‌کنید، محرک دقیق به نحوه نصب OpenClaw بستگی دارد:

- نصب‌های سورسی در جریان به‌روزرسانی `openclaw doctor --fix` را اجرا می‌کنند، سپس به‌صورت پیش‌فرض Gateway را بازراه‌اندازی می‌کنند
- نصب‌های مدیر بسته، بسته را به‌روزرسانی می‌کنند، یک اجرای doctor غیرتعاملی انجام می‌دهند، سپس به بازراه‌اندازی پیش‌فرض Gateway تکیه می‌کنند تا راه‌اندازی بتواند مهاجرت Matrix را کامل کند
- اگر از `openclaw update --no-restart` استفاده کنید، مهاجرت Matrix مبتنی بر راه‌اندازی تا زمانی که بعدا `openclaw doctor --fix` را اجرا کنید و Gateway را بازراه‌اندازی کنید، به تعویق می‌افتد

مهاجرت خودکار شامل موارد زیر است:

- ایجاد یا استفاده دوباره از یک snapshot پیش از مهاجرت زیر `~/Backups/openclaw-migrations/`
- استفاده دوباره از اعتبارنامه‌های کش‌شده Matrix شما
- حفظ همان انتخاب حساب و پیکربندی `channels.matrix`
- انتقال قدیمی‌ترین ذخیره‌گاه همگام‌سازی تخت Matrix به محل فعلی دارای محدوده حساب
- انتقال قدیمی‌ترین ذخیره‌گاه رمزنگاری تخت Matrix به محل فعلی دارای محدوده حساب، زمانی که حساب مقصد با ایمنی قابل تشخیص باشد
- استخراج کلید رمزگشایی پشتیبان کلید اتاق Matrix که قبلا ذخیره شده، از ذخیره‌گاه قدیمی rust crypto، زمانی که آن کلید به‌صورت محلی وجود داشته باشد
- استفاده دوباره از کامل‌ترین ریشه ذخیره‌سازی token-hash موجود برای همان حساب Matrix، homeserver، و کاربر، وقتی access token بعدا تغییر کند
- اسکن ریشه‌های ذخیره‌سازی token-hash هم‌سطح برای فراداده بازیابی وضعیت رمزنگاری‌شده معلق، وقتی access token مربوط به Matrix تغییر کرده اما هویت حساب/دستگاه همان مانده است
- بازیابی کلیدهای اتاق پشتیبان‌گیری‌شده در ذخیره‌گاه رمزنگاری جدید هنگام راه‌اندازی بعدی Matrix

جزئیات snapshot:

- OpenClaw پس از یک snapshot موفق، یک فایل نشانگر در `~/.openclaw/matrix/migration-snapshot.json` می‌نویسد تا اجراهای بعدی راه‌اندازی و ترمیم بتوانند از همان آرشیو دوباره استفاده کنند.
- این snapshotهای مهاجرت خودکار Matrix فقط از پیکربندی + وضعیت پشتیبان می‌گیرند (`includeWorkspace: false`).
- اگر Matrix فقط وضعیت مهاجرت در حد هشدار داشته باشد، مثلا چون `userId` یا `accessToken` هنوز موجود نیست، OpenClaw هنوز snapshot را ایجاد نمی‌کند، چون هیچ جهش Matrix قابل اقدام نیست.
- اگر مرحله snapshot شکست بخورد، OpenClaw مهاجرت Matrix را برای آن اجرا رد می‌کند، به‌جای اینکه بدون نقطه بازیابی وضعیت را تغییر دهد.

درباره ارتقاهای چندحسابی:

- قدیمی‌ترین ذخیره‌گاه تخت Matrix (`~/.openclaw/matrix/bot-storage.json` و `~/.openclaw/matrix/crypto/`) از یک چیدمان تک‌ذخیره‌گاهی آمده است، بنابراین OpenClaw فقط می‌تواند آن را به یک مقصد حساب Matrix تشخیص‌داده‌شده مهاجرت دهد
- ذخیره‌گاه‌های قدیمی Matrix که از قبل دارای محدوده حساب هستند، برای هر حساب Matrix پیکربندی‌شده شناسایی و آماده می‌شوند

## مهاجرت چه کاری را نمی‌تواند به‌صورت خودکار انجام دهد

Plugin عمومی قبلی Matrix به‌صورت خودکار پشتیبان‌های کلید اتاق Matrix ایجاد نمی‌کرد. این Plugin وضعیت رمزنگاری محلی را پایدار می‌کرد و درخواست تایید دستگاه می‌داد، اما تضمین نمی‌کرد که کلیدهای اتاق شما در homeserver پشتیبان‌گیری شده باشند.

این یعنی برخی نصب‌های رمزنگاری‌شده فقط می‌توانند به‌صورت جزئی مهاجرت داده شوند.

OpenClaw نمی‌تواند این موارد را به‌صورت خودکار بازیابی کند:

- کلیدهای اتاق فقط‌محلی که هرگز پشتیبان‌گیری نشده‌اند
- وضعیت رمزنگاری‌شده وقتی حساب Matrix مقصد هنوز قابل تشخیص نیست چون `homeserver`، `userId`، یا `accessToken` هنوز در دسترس نیستند
- مهاجرت خودکار یک ذخیره‌گاه تخت مشترک Matrix وقتی چند حساب Matrix پیکربندی شده‌اند اما `channels.matrix.defaultAccount` تنظیم نشده است
- نصب‌های مسیر سفارشی Plugin که به‌جای بسته استاندارد Matrix به یک مسیر repo سنجاق شده‌اند
- کلید بازیابی گم‌شده وقتی ذخیره‌گاه قدیمی کلیدهای پشتیبان‌گیری‌شده داشت اما کلید رمزگشایی را به‌صورت محلی نگه نداشته بود

محدوده هشدار فعلی:

- نصب‌های مسیر سفارشی Plugin مربوط به Matrix هم توسط راه‌اندازی Gateway و هم توسط `openclaw doctor` نشان داده می‌شوند

اگر نصب قدیمی شما تاریخچه رمزنگاری‌شده فقط‌محلی داشت که هرگز پشتیبان‌گیری نشده بود، ممکن است برخی پیام‌های رمزنگاری‌شده قدیمی‌تر پس از ارتقا همچنان خواندنی نباشند.

## جریان ارتقای پیشنهادی

1. OpenClaw و Plugin مربوط به Matrix را به‌شکل عادی به‌روزرسانی کنید.
   `openclaw update` ساده و بدون `--no-restart` را ترجیح دهید تا راه‌اندازی بتواند مهاجرت Matrix را فوری کامل کند.
2. اجرا کنید:

   ```bash
   openclaw doctor --fix
   ```

   اگر Matrix کار مهاجرت قابل اقدام داشته باشد، doctor ابتدا snapshot پیش از مهاجرت را ایجاد می‌کند یا از آن دوباره استفاده می‌کند و مسیر آرشیو را چاپ می‌کند.

3. Gateway را شروع یا بازراه‌اندازی کنید.
4. وضعیت فعلی تایید و پشتیبان را بررسی کنید:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. کلید بازیابی حساب Matrixی را که در حال ترمیم آن هستید، در یک متغیر محیطی اختصاصی همان حساب قرار دهید. برای یک حساب پیش‌فرض تکی، `MATRIX_RECOVERY_KEY` مناسب است. برای چند حساب، برای هر حساب یک متغیر استفاده کنید، مثلا `MATRIX_RECOVERY_KEY_ASSISTANT`، و `--account assistant` را به فرمان اضافه کنید.

6. اگر OpenClaw به شما گفت کلید بازیابی لازم است، فرمان را برای حساب متناظر اجرا کنید:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. اگر این دستگاه هنوز تایید نشده است، فرمان را برای حساب متناظر اجرا کنید:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   اگر کلید بازیابی پذیرفته شد و پشتیبان قابل استفاده بود، اما `Cross-signing verified`
   هنوز `no` است، خودتاییدی را از یک کلاینت دیگر Matrix کامل کنید:

   ```bash
   openclaw matrix verify self
   ```

   درخواست را در یک کلاینت دیگر Matrix بپذیرید، emojiها یا اعداد ده‌دهی را مقایسه کنید،
   و فقط وقتی مطابقت داشتند `yes` را وارد کنید. فرمان فقط پس از آنکه
   `Cross-signing verified` به `yes` تبدیل شود، با موفقیت خارج می‌شود.

8. اگر عمدا تاریخچه قدیمی غیرقابل‌بازیابی را رها می‌کنید و برای پیام‌های آینده یک مبنای پشتیبان تازه می‌خواهید، اجرا کنید:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. اگر هنوز هیچ پشتیبان کلید سمت سرور وجود ندارد، برای بازیابی‌های آینده یکی ایجاد کنید:

   ```bash
   openclaw matrix verify bootstrap
   ```

## مهاجرت رمزنگاری‌شده چگونه کار می‌کند

مهاجرت رمزنگاری‌شده یک فرایند دومرحله‌ای است:

1. راه‌اندازی یا `openclaw doctor --fix`، اگر مهاجرت رمزنگاری‌شده قابل اقدام باشد، snapshot پیش از مهاجرت را ایجاد می‌کند یا از آن دوباره استفاده می‌کند.
2. راه‌اندازی یا `openclaw doctor --fix` ذخیره‌گاه رمزنگاری قدیمی Matrix را از طریق نصب فعال Plugin مربوط به Matrix بررسی می‌کند.
3. اگر کلید رمزگشایی پشتیبان پیدا شود، OpenClaw آن را در جریان جدید کلید بازیابی می‌نویسد و بازیابی کلید اتاق را به‌عنوان معلق علامت‌گذاری می‌کند.
4. در راه‌اندازی بعدی Matrix، OpenClaw کلیدهای اتاق پشتیبان‌گیری‌شده را به‌صورت خودکار در ذخیره‌گاه رمزنگاری جدید بازیابی می‌کند.

اگر ذخیره‌گاه قدیمی کلیدهای اتاقی را گزارش کند که هرگز پشتیبان‌گیری نشده‌اند، OpenClaw به‌جای وانمود کردن به موفقیت بازیابی، هشدار می‌دهد.

## پیام‌های رایج و معنی آن‌ها

### پیام‌های ارتقا و شناسایی

`Matrix plugin upgraded in place.`

- معنی: وضعیت قدیمی Matrix روی دیسک شناسایی شد و به چیدمان فعلی مهاجرت داده شد.
- کار لازم: هیچ کاری لازم نیست مگر اینکه همان خروجی هشدارهایی هم داشته باشد.

`Matrix migration snapshot created before applying Matrix upgrades.`

- معنی: OpenClaw پیش از تغییر وضعیت Matrix یک آرشیو بازیابی ایجاد کرد.
- کار لازم: مسیر آرشیو چاپ‌شده را تا زمانی که تایید کنید مهاجرت موفق بوده است نگه دارید.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- معنی: OpenClaw یک نشانگر snapshot مهاجرت Matrix موجود پیدا کرد و به‌جای ایجاد پشتیبان تکراری، از همان آرشیو دوباره استفاده کرد.
- کار لازم: مسیر آرشیو چاپ‌شده را تا زمانی که تایید کنید مهاجرت موفق بوده است نگه دارید.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- معنی: وضعیت قدیمی Matrix وجود دارد، اما OpenClaw نمی‌تواند آن را به یک حساب فعلی Matrix نگاشت کند چون Matrix پیکربندی نشده است.
- کار لازم: `channels.matrix` را پیکربندی کنید، سپس `openclaw doctor --fix` را دوباره اجرا کنید یا Gateway را بازراه‌اندازی کنید.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- معنی: OpenClaw وضعیت قدیمی را پیدا کرد، اما هنوز نمی‌تواند ریشه دقیق حساب/دستگاه فعلی را تعیین کند.
- کار لازم: Gateway را یک بار با ورود Matrix سالم شروع کنید، یا پس از موجود شدن اعتبارنامه‌های کش‌شده `openclaw doctor --fix` را دوباره اجرا کنید.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- معنی: OpenClaw یک ذخیره‌گاه تخت مشترک Matrix پیدا کرد، اما از حدس زدن اینکه کدام حساب نام‌دار Matrix باید آن را دریافت کند خودداری می‌کند.
- کار لازم: `channels.matrix.defaultAccount` را روی حساب موردنظر تنظیم کنید، سپس `openclaw doctor --fix` را دوباره اجرا کنید یا Gateway را بازراه‌اندازی کنید.

`Matrix legacy sync store not migrated because the target already exists (...)`

- معنی: محل جدید دارای محدوده حساب از قبل یک ذخیره‌گاه همگام‌سازی یا رمزنگاری دارد، بنابراین OpenClaw آن را به‌صورت خودکار بازنویسی نکرد.
- کار لازم: پیش از حذف یا انتقال دستی مقصد متعارض، تایید کنید حساب فعلی همان حساب درست است.

`Failed migrating Matrix legacy sync store (...)` یا `Failed migrating Matrix legacy crypto store (...)`

- معنی: OpenClaw تلاش کرد وضعیت قدیمی Matrix را منتقل کند اما عملیات فایل‌سیستم شکست خورد.
- کار لازم: مجوزهای فایل‌سیستم و وضعیت دیسک را بررسی کنید، سپس `openclaw doctor --fix` را دوباره اجرا کنید.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- معنی: OpenClaw یک ذخیره‌گاه رمزنگاری‌شده قدیمی Matrix پیدا کرد، اما هیچ پیکربندی فعلی Matrix برای اتصال آن وجود ندارد.
- کار لازم: `channels.matrix` را پیکربندی کنید، سپس `openclaw doctor --fix` را دوباره اجرا کنید یا Gateway را بازراه‌اندازی کنید.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- معنی: ذخیره‌گاه رمزنگاری‌شده وجود دارد، اما OpenClaw نمی‌تواند با ایمنی تصمیم بگیرد متعلق به کدام حساب/دستگاه فعلی است.
- کار لازم: Gateway را یک بار با ورود Matrix سالم شروع کنید، یا پس از در دسترس بودن اعتبارنامه‌های کش‌شده `openclaw doctor --fix` را دوباره اجرا کنید.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- معنی: OpenClaw یک ذخیره‌گاه رمزنگاری قدیمی تخت مشترک پیدا کرد، اما از حدس زدن اینکه کدام حساب نام‌دار Matrix باید آن را دریافت کند خودداری می‌کند.
- کار لازم: `channels.matrix.defaultAccount` را روی حساب موردنظر تنظیم کنید، سپس `openclaw doctor --fix` را دوباره اجرا کنید یا Gateway را بازراه‌اندازی کنید.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- معنی: OpenClaw وضعیت قدیمی Matrix را شناسایی کرد، اما مهاجرت هنوز به دلیل نبود داده‌های هویت یا اعتبارنامه مسدود است.
- کار لازم: ورود Matrix یا راه‌اندازی پیکربندی را کامل کنید، سپس `openclaw doctor --fix` را دوباره اجرا کنید یا Gateway را بازراه‌اندازی کنید.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- معنی: OpenClaw وضعیت رمزگذاری‌شدهٔ قدیمی Matrix را پیدا کرد، اما نتوانست نقطهٔ ورود کمکی را از Plugin Matrix که معمولاً آن ذخیره‌گاه را بررسی می‌کند بارگذاری کند.
- کار لازم: Plugin Matrix را دوباره نصب یا تعمیر کنید (`openclaw plugins install @openclaw/matrix`، یا برای یک checkout مخزن `openclaw plugins install ./path/to/local/matrix-plugin`)، سپس `openclaw doctor --fix` را دوباره اجرا کنید یا Gateway را بازراه‌اندازی کنید.
- اگر npm بستهٔ Matrix متعلق به OpenClaw را deprecated گزارش کرد، از Plugin همراهِ یک بیلد بسته‌بندی‌شدهٔ فعلی OpenClaw یا مسیر checkout محلی استفاده کنید تا زمانی که بستهٔ npm جدیدتری منتشر شود.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- معنی: OpenClaw مسیر فایل کمکی‌ای را پیدا کرد که از ریشهٔ Plugin خارج می‌شود یا در بررسی‌های مرز Plugin شکست می‌خورد، بنابراین از import کردن آن خودداری کرد.
- کار لازم: Plugin Matrix را از یک مسیر مورد اعتماد دوباره نصب کنید، سپس `openclaw doctor --fix` را دوباره اجرا کنید یا Gateway را بازراه‌اندازی کنید.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- معنی: OpenClaw از تغییر دادن وضعیت Matrix خودداری کرد، چون ابتدا نتوانست snapshot بازیابی را ایجاد کند.
- کار لازم: خطای backup را برطرف کنید، سپس `openclaw doctor --fix` را دوباره اجرا کنید یا Gateway را بازراه‌اندازی کنید.

`Failed migrating legacy Matrix client storage: ...`

- معنی: fallback سمت کلاینت Matrix ذخیره‌سازی تخت قدیمی را پیدا کرد، اما جابه‌جایی شکست خورد. OpenClaw اکنون به‌جای شروع بی‌سروصدا با یک ذخیره‌گاه تازه، آن fallback را متوقف می‌کند.
- کار لازم: مجوزهای فایل‌سیستم یا تداخل‌ها را بررسی کنید، وضعیت قدیمی را دست‌نخورده نگه دارید، و پس از رفع خطا دوباره تلاش کنید.

`Matrix is installed from a custom path: ...`

- معنی: Matrix به یک نصب از مسیر مشخص pin شده است، بنابراین به‌روزرسانی‌های mainline آن را به‌صورت خودکار با بستهٔ استاندارد Matrix مخزن جایگزین نمی‌کنند.
- کار لازم: وقتی می‌خواهید به Plugin پیش‌فرض Matrix برگردید، با `openclaw plugins install @openclaw/matrix` دوباره نصب کنید.
- اگر npm بستهٔ Matrix متعلق به OpenClaw را deprecated گزارش کرد، تا زمانی که بستهٔ npm جدیدتری منتشر شود، از Plugin همراهِ یک بیلد بسته‌بندی‌شدهٔ فعلی OpenClaw استفاده کنید.

### پیام‌های بازیابی وضعیت رمزگذاری‌شده

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- معنی: کلیدهای اتاق backup گرفته‌شده با موفقیت در ذخیره‌گاه crypto جدید بازیابی شدند.
- کار لازم: معمولاً هیچ کاری لازم نیست.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- معنی: برخی کلیدهای اتاق قدیمی فقط در ذخیره‌گاه محلی قدیمی وجود داشتند و هرگز در backup Matrix بارگذاری نشده بودند.
- کار لازم: انتظار داشته باشید بخشی از تاریخچهٔ رمزگذاری‌شدهٔ قدیمی همچنان در دسترس نباشد، مگر اینکه بتوانید آن کلیدها را به‌صورت دستی از یک کلاینت تأییدشدهٔ دیگر بازیابی کنید.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- معنی: backup وجود دارد، اما OpenClaw نتوانست کلید بازیابی را به‌صورت خودکار بازیابی کند.
- کار لازم: `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` را اجرا کنید.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- معنی: OpenClaw ذخیره‌گاه رمزگذاری‌شدهٔ قدیمی را پیدا کرد، اما نتوانست آن را به‌اندازهٔ کافی ایمن بررسی کند تا بازیابی را آماده کند.
- کار لازم: `openclaw doctor --fix` را دوباره اجرا کنید. اگر تکرار شد، پوشهٔ وضعیت قدیمی را دست‌نخورده نگه دارید و با استفاده از یک کلاینت تأییدشدهٔ دیگر Matrix به‌همراه `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` بازیابی کنید.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- معنی: OpenClaw یک تداخل در کلید backup تشخیص داد و از بازنویسی خودکار فایل فعلی recovery-key خودداری کرد.
- کار لازم: پیش از تلاش دوباره برای هر دستور restore، بررسی کنید کدام کلید بازیابی درست است.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- معنی: این محدودیت قطعی قالب ذخیره‌سازی قدیمی است.
- کار لازم: کلیدهای backup گرفته‌شده همچنان قابل بازیابی‌اند، اما تاریخچهٔ رمزگذاری‌شدهٔ فقط‌محلی ممکن است همچنان در دسترس نباشد.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- معنی: Plugin جدید تلاش کرد restore انجام دهد، اما Matrix خطا برگرداند.
- کار لازم: `openclaw matrix verify backup status` را اجرا کنید، سپس در صورت نیاز با `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` دوباره تلاش کنید.

### پیام‌های بازیابی دستی

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- معنی: OpenClaw می‌داند که باید کلید backup داشته باشید، اما این کلید روی این دستگاه فعال نیست.
- کار لازم: `openclaw matrix verify backup restore` را اجرا کنید، یا در صورت نیاز `MATRIX_RECOVERY_KEY` را تنظیم کنید و `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` را اجرا کنید.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- معنی: این دستگاه در حال حاضر کلید بازیابی را ذخیره‌شده ندارد.
- کار لازم: `MATRIX_RECOVERY_KEY` را تنظیم کنید، `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` را اجرا کنید، سپس backup را restore کنید.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- معنی: کلید ذخیره‌شده با backup فعال Matrix مطابقت ندارد.
- کار لازم: `MATRIX_RECOVERY_KEY` را روی کلید درست تنظیم کنید و `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` را اجرا کنید.

اگر از دست دادن تاریخچهٔ رمزگذاری‌شدهٔ قدیمیِ غیرقابل‌بازیابی را می‌پذیرید، می‌توانید در عوض baseline فعلی backup را با `openclaw matrix verify backup reset --yes` بازنشانی کنید. وقتی secret ذخیره‌شدهٔ backup خراب است، این بازنشانی ممکن است secret storage را نیز دوباره ایجاد کند تا کلید backup جدید پس از بازراه‌اندازی درست بارگذاری شود.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- معنی: backup وجود دارد، اما این دستگاه هنوز به زنجیرهٔ cross-signing به‌اندازهٔ کافی اعتماد ندارد.
- کار لازم: `MATRIX_RECOVERY_KEY` را تنظیم کنید و `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` را اجرا کنید.

`Matrix recovery key is required`

- معنی: یک مرحلهٔ بازیابی را بدون ارائهٔ کلید بازیابی اجرا کردید، در حالی که کلید لازم بود.
- کار لازم: دستور را با `--recovery-key-stdin` دوباره اجرا کنید، برای مثال `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- معنی: کلید ارائه‌شده قابل parse نبود یا با قالب مورد انتظار مطابقت نداشت.
- کار لازم: با کلید بازیابی دقیق از کلاینت Matrix یا فایل recovery-key خود دوباره تلاش کنید.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- معنی: OpenClaw توانست کلید بازیابی را اعمال کند، اما Matrix هنوز اعتماد کامل هویت cross-signing را برای این دستگاه برقرار نکرده است. خروجی دستور را برای `Recovery key accepted`، `Backup usable`، `Cross-signing verified`، و `Device verified by owner` بررسی کنید.
- کار لازم: `openclaw matrix verify self` را اجرا کنید، درخواست را در یک کلاینت دیگر Matrix بپذیرید، SAS را مقایسه کنید، و فقط وقتی مطابقت داشت `yes` را وارد کنید. دستور پیش از گزارش موفقیت، منتظر اعتماد کامل هویت Matrix می‌ماند. فقط وقتی عمداً می‌خواهید هویت cross-signing فعلی را جایگزین کنید، از `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing` استفاده کنید.

`Matrix key backup is not active on this device after loading from secret storage.`

- معنی: secret storage روی این دستگاه یک نشست backup فعال ایجاد نکرد.
- کار لازم: ابتدا دستگاه را تأیید کنید، سپس با `openclaw matrix verify backup status` دوباره بررسی کنید.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- معنی: این دستگاه تا زمانی که تأیید دستگاه کامل نشود نمی‌تواند از secret storage بازیابی کند.
- کار لازم: ابتدا `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` را اجرا کنید.

### پیام‌های نصب Plugin سفارشی

`Matrix is installed from a custom path that no longer exists: ...`

- معنی: رکورد نصب Plugin شما به یک مسیر محلی اشاره می‌کند که دیگر وجود ندارد.
- کار لازم: با `openclaw plugins install @openclaw/matrix` دوباره نصب کنید، یا اگر از یک checkout مخزن اجرا می‌کنید، `openclaw plugins install ./path/to/local/matrix-plugin`.
- اگر npm بستهٔ Matrix متعلق به OpenClaw را deprecated گزارش کرد، از Plugin همراهِ یک بیلد بسته‌بندی‌شدهٔ فعلی OpenClaw یا مسیر checkout محلی استفاده کنید تا زمانی که بستهٔ npm جدیدتری منتشر شود.

## اگر تاریخچهٔ رمزگذاری‌شده همچنان برنمی‌گردد

این بررسی‌ها را به‌ترتیب اجرا کنید:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

اگر backup با موفقیت restore شد اما برخی اتاق‌های قدیمی همچنان تاریخچه ندارند، احتمالاً آن کلیدهای گم‌شده هرگز توسط Plugin قبلی backup نشده بودند.

## اگر می‌خواهید برای پیام‌های آینده از نو شروع کنید

اگر از دست دادن تاریخچهٔ رمزگذاری‌شدهٔ قدیمیِ غیرقابل‌بازیابی را می‌پذیرید و فقط یک baseline تمیز برای backup از این به بعد می‌خواهید، این دستورها را به‌ترتیب اجرا کنید:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

اگر پس از آن دستگاه همچنان تأییدنشده است، تأیید را از کلاینت Matrix خود با مقایسهٔ emojiهای SAS یا کدهای ده‌دهی و تأیید مطابقت آن‌ها کامل کنید.

## مرتبط

- [Matrix](/fa/channels/matrix): راه‌اندازی و پیکربندی کانال.
- [قوانین push Matrix](/fa/channels/matrix-push-rules): مسیریابی اعلان‌ها.
- [Doctor](/fa/gateway/doctor): بررسی سلامت و ماشهٔ migration خودکار.
- [راهنمای migration](/fa/install/migrating): همهٔ مسیرهای migration (انتقال ماشین، importهای بین‌سیستمی).
- [Plugins](/fa/tools/plugin): نصب و ثبت Plugin.
