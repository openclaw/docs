---
read_when:
    - ارتقای یک نصب موجود Matrix
    - انتقال تاریخچه رمزگذاری‌شده Matrix و وضعیت دستگاه
summary: اینکه OpenClaw چگونه Plugin قبلی Matrix را در همان محل ارتقا می‌دهد، از جمله محدودیت‌های بازیابی وضعیت رمزگذاری‌شده و مراحل بازیابی دستی.
title: مهاجرت Matrix
x-i18n:
    generated_at: "2026-06-27T17:12:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 796d27aa3f08388b78e005d5e93ee4a04bc9ae9bb1f214b83c3ba19165042755
    source_path: channels/matrix-migration.md
    workflow: 16
---

ارتقا از Plugin عمومی قبلی `matrix` به پیاده‌سازی فعلی.

برای بیشتر کاربران، ارتقا درجا انجام می‌شود:

- Plugin همان `@openclaw/matrix` می‌ماند
- کانال همان `matrix` می‌ماند
- پیکربندی شما زیر `channels.matrix` می‌ماند
- اعتبارنامه‌های کش‌شده زیر `~/.openclaw/credentials/matrix/` می‌مانند
- وضعیت زمان اجرا زیر `~/.openclaw/matrix/` می‌ماند

نیازی نیست کلیدهای پیکربندی را تغییر نام دهید یا Plugin را با نامی جدید دوباره نصب کنید.
بسته ریشه `openclaw` دیگر کد زمان اجرای Matrix یا وابستگی‌های Matrix SDK
را همراه خود ندارد. اگر `openclaw channels status` نشان می‌دهد Matrix پیکربندی شده اما
Plugin پس از به‌روزرسانی موجود نیست، `openclaw doctor --fix` یا
`openclaw plugins install @openclaw/matrix` را اجرا کنید؛ بسته‌های Matrix SDK را
در بسته ریشه OpenClaw نصب نکنید.

## مهاجرت به‌صورت خودکار چه کار می‌کند

وقتی Gateway شروع به کار می‌کند، و وقتی [`openclaw doctor --fix`](/fa/gateway/doctor) را اجرا می‌کنید، OpenClaw تلاش می‌کند وضعیت قدیمی Matrix را به‌صورت خودکار ترمیم کند.
پیش از آنکه هر مرحله مهاجرت قابل‌اقدام Matrix وضعیت روی دیسک را تغییر دهد، OpenClaw یک snapshot بازیابی متمرکز ایجاد می‌کند یا از آن دوباره استفاده می‌کند.

وقتی از `openclaw update` استفاده می‌کنید، محرک دقیق به نحوه نصب OpenClaw بستگی دارد:

- نصب‌های سورس در جریان به‌روزرسانی `openclaw doctor --fix` را اجرا می‌کنند، سپس به‌صورت پیش‌فرض Gateway را دوباره راه‌اندازی می‌کنند
- نصب‌های مدیر بسته، بسته را به‌روزرسانی می‌کنند، یک اجرای غیرتعاملی doctor را انجام می‌دهند، سپس به راه‌اندازی مجدد پیش‌فرض Gateway تکیه می‌کنند تا راه‌اندازی بتواند مهاجرت Matrix را کامل کند
- اگر از `openclaw update --no-restart` استفاده کنید، مهاجرت Matrix که به راه‌اندازی وابسته است تا زمانی به تعویق می‌افتد که بعدا `openclaw doctor --fix` را اجرا کنید و Gateway را دوباره راه‌اندازی کنید

مهاجرت خودکار شامل این موارد است:

- ایجاد یا استفاده دوباره از snapshot پیش از مهاجرت زیر `~/Backups/openclaw-migrations/`
- استفاده دوباره از اعتبارنامه‌های کش‌شده Matrix شما
- حفظ همان انتخاب حساب و پیکربندی `channels.matrix`
- انتقال قدیمی‌ترین فروشگاه همگام‌سازی تخت Matrix به مکان فعلی محدود به حساب
- انتقال قدیمی‌ترین فروشگاه کریپتوی تخت Matrix به مکان فعلی محدود به حساب، وقتی حساب مقصد را بتوان با اطمینان resolve کرد
- استخراج کلید رمزگشایی پشتیبان کلید اتاق Matrix که پیش‌تر ذخیره شده، از فروشگاه قدیمی rust crypto، وقتی آن کلید به‌صورت محلی وجود داشته باشد
- استفاده دوباره از کامل‌ترین ریشه ذخیره‌سازی هش توکن موجود برای همان حساب Matrix، homeserver و کاربر، وقتی access token بعدا تغییر می‌کند
- اسکن ریشه‌های ذخیره‌سازی هش توکن هم‌سطح برای فراداده بازیابی وضعیت رمزگذاری‌شده در انتظار، وقتی access token Matrix تغییر کرده اما هویت حساب/دستگاه همان مانده است
- بازیابی کلیدهای اتاق پشتیبان‌گیری‌شده در فروشگاه کریپتوی جدید هنگام راه‌اندازی بعدی Matrix

جزئیات snapshot:

- OpenClaw پس از snapshot موفق، یک فایل نشانگر در `~/.openclaw/matrix/migration-snapshot.json` می‌نویسد تا اجراهای بعدی راه‌اندازی و ترمیم بتوانند از همان آرشیو دوباره استفاده کنند.
- این snapshotهای خودکار مهاجرت Matrix فقط از پیکربندی + وضعیت پشتیبان می‌گیرند (`includeWorkspace: false`).
- اگر Matrix فقط وضعیت مهاجرت هشدارمحور داشته باشد، مثلا چون `userId` یا `accessToken` هنوز وجود ندارد، OpenClaw هنوز snapshot را ایجاد نمی‌کند، چون هیچ تغییر Matrix قابل‌اقدامی وجود ندارد.
- اگر مرحله snapshot شکست بخورد، OpenClaw به‌جای تغییر وضعیت بدون نقطه بازیابی، مهاجرت Matrix را برای آن اجرا رد می‌کند.

درباره ارتقاهای چندحسابی:

- قدیمی‌ترین فروشگاه تخت Matrix (`~/.openclaw/matrix/bot-storage.json` و `~/.openclaw/matrix/crypto/`) از یک چیدمان تک‌فروشگاهی آمده است، بنابراین OpenClaw فقط می‌تواند آن را به یک مقصد حساب Matrix resolveشده مهاجرت دهد
- فروشگاه‌های قدیمی Matrix که از قبل محدود به حساب هستند، برای هر حساب Matrix پیکربندی‌شده شناسایی و آماده می‌شوند

## مهاجرت چه کارهایی را نمی‌تواند به‌صورت خودکار انجام دهد

Plugin عمومی قبلی Matrix به‌صورت خودکار پشتیبان‌های کلید اتاق Matrix ایجاد نمی‌کرد. این Plugin وضعیت کریپتوی محلی را نگه می‌داشت و درخواست تایید دستگاه می‌کرد، اما تضمین نمی‌کرد کلیدهای اتاق شما در homeserver پشتیبان‌گیری شده باشند.

این یعنی برخی نصب‌های رمزگذاری‌شده فقط می‌توانند تا حدی مهاجرت داده شوند.

OpenClaw نمی‌تواند به‌صورت خودکار این موارد را بازیابی کند:

- کلیدهای اتاق فقط محلی که هرگز پشتیبان‌گیری نشده‌اند
- وضعیت رمزگذاری‌شده وقتی حساب Matrix مقصد هنوز قابل resolve نیست، چون `homeserver`، `userId`، یا `accessToken` هنوز در دسترس نیستند
- مهاجرت خودکار یک فروشگاه تخت مشترک Matrix وقتی چند حساب Matrix پیکربندی شده‌اند اما `channels.matrix.defaultAccount` تنظیم نشده است
- نصب‌های مسیر سفارشی Plugin که به‌جای بسته استاندارد Matrix به یک مسیر repo سنجاق شده‌اند
- کلید بازیابی گم‌شده وقتی فروشگاه قدیمی کلیدهای پشتیبان‌گیری‌شده داشت اما کلید رمزگشایی را به‌صورت محلی نگه نداشته بود

دامنه هشدار فعلی:

- نصب‌های مسیر سفارشی Plugin برای Matrix هم در راه‌اندازی Gateway و هم در `openclaw doctor` نشان داده می‌شوند

اگر نصب قدیمی شما تاریخچه رمزگذاری‌شده فقط محلی داشت که هرگز پشتیبان‌گیری نشده بود، ممکن است برخی پیام‌های رمزگذاری‌شده قدیمی پس از ارتقا همچنان خواندنی نباشند.

## روند پیشنهادی ارتقا

1. OpenClaw و Plugin Matrix را به‌صورت عادی به‌روزرسانی کنید.
   `openclaw update` ساده را بدون `--no-restart` ترجیح دهید تا راه‌اندازی بتواند مهاجرت Matrix را بلافاصله کامل کند.
2. اجرا کنید:

   ```bash
   openclaw doctor --fix
   ```

   اگر Matrix کار مهاجرت قابل‌اقدام داشته باشد، doctor ابتدا snapshot پیش از مهاجرت را ایجاد می‌کند یا از آن دوباره استفاده می‌کند و مسیر آرشیو را چاپ می‌کند.

3. Gateway را شروع یا دوباره راه‌اندازی کنید.
4. وضعیت فعلی تایید و پشتیبان را بررسی کنید:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. کلید بازیابی حساب Matrix را که در حال ترمیم آن هستید در یک متغیر محیطی مخصوص حساب قرار دهید. برای یک حساب پیش‌فرض واحد، `MATRIX_RECOVERY_KEY` مناسب است. برای چند حساب، از یک متغیر برای هر حساب استفاده کنید، مثلا `MATRIX_RECOVERY_KEY_ASSISTANT`، و `--account assistant` را به فرمان اضافه کنید.

6. اگر OpenClaw به شما گفت کلید بازیابی لازم است، فرمان را برای حساب منطبق اجرا کنید:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. اگر این دستگاه هنوز تایید نشده است، فرمان را برای حساب منطبق اجرا کنید:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   اگر کلید بازیابی پذیرفته شد و پشتیبان قابل استفاده بود، اما `Cross-signing verified`
   هنوز `no` است، خودتاییدی را از یک کلاینت Matrix دیگر کامل کنید:

   ```bash
   openclaw matrix verify self
   ```

   درخواست را در کلاینت Matrix دیگری بپذیرید، emoji یا decimals را مقایسه کنید،
   و فقط وقتی مطابقت دارند `yes` را وارد کنید. فرمان فقط پس از آنکه
   `Cross-signing verified` به `yes` تبدیل شود با موفقیت خارج می‌شود.

8. اگر عمدا تاریخچه قدیمی غیرقابل‌بازیابی را کنار می‌گذارید و برای پیام‌های آینده یک خط مبنای پشتیبان تازه می‌خواهید، اجرا کنید:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. اگر هنوز هیچ پشتیبان کلید سمت سرور وجود ندارد، برای بازیابی‌های آینده یکی ایجاد کنید:

   ```bash
   openclaw matrix verify bootstrap
   ```

## مهاجرت رمزگذاری‌شده چگونه کار می‌کند

مهاجرت رمزگذاری‌شده یک فرایند دومرحله‌ای است:

1. راه‌اندازی یا `openclaw doctor --fix` اگر مهاجرت رمزگذاری‌شده قابل‌اقدام باشد، snapshot پیش از مهاجرت را ایجاد می‌کند یا از آن دوباره استفاده می‌کند.
2. راه‌اندازی یا `openclaw doctor --fix` فروشگاه کریپتوی قدیمی Matrix را از طریق نصب Plugin فعال Matrix بررسی می‌کند.
3. اگر یک کلید رمزگشایی پشتیبان پیدا شود، OpenClaw آن را در جریان جدید recovery-key می‌نویسد و بازیابی کلید اتاق را در انتظار علامت‌گذاری می‌کند.
4. در راه‌اندازی بعدی Matrix، OpenClaw کلیدهای اتاق پشتیبان‌گیری‌شده را به‌صورت خودکار در فروشگاه کریپتوی جدید بازیابی می‌کند.

اگر فروشگاه قدیمی کلیدهای اتاقی را گزارش کند که هرگز پشتیبان‌گیری نشده‌اند، OpenClaw به‌جای وانمود کردن به موفقیت بازیابی، هشدار می‌دهد.

## پیام‌های رایج و معنی آن‌ها

### پیام‌های ارتقا و شناسایی

`Matrix plugin upgraded in place.`

- معنی: وضعیت Matrix قدیمی روی دیسک شناسایی و به چیدمان فعلی مهاجرت داده شد.
- چه باید کرد: هیچ کاری لازم نیست، مگر اینکه همان خروجی هشدارهایی نیز داشته باشد.

`Matrix migration snapshot created before applying Matrix upgrades.`

- معنی: OpenClaw پیش از تغییر وضعیت Matrix یک آرشیو بازیابی ایجاد کرد.
- چه باید کرد: مسیر آرشیو چاپ‌شده را تا زمانی که تایید کنید مهاجرت موفق بوده نگه دارید.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- معنی: OpenClaw یک نشانگر snapshot مهاجرت Matrix موجود پیدا کرد و به‌جای ایجاد پشتیبان تکراری، از همان آرشیو دوباره استفاده کرد.
- چه باید کرد: مسیر آرشیو چاپ‌شده را تا زمانی که تایید کنید مهاجرت موفق بوده نگه دارید.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- معنی: وضعیت قدیمی Matrix وجود دارد، اما OpenClaw نمی‌تواند آن را به حساب Matrix فعلی نگاشت کند، چون Matrix پیکربندی نشده است.
- چه باید کرد: `channels.matrix` را پیکربندی کنید، سپس `openclaw doctor --fix` را دوباره اجرا کنید یا Gateway را دوباره راه‌اندازی کنید.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- معنی: OpenClaw وضعیت قدیمی را پیدا کرد، اما هنوز نمی‌تواند ریشه دقیق حساب/دستگاه فعلی را تعیین کند.
- چه باید کرد: Gateway را یک‌بار با ورود Matrix کارآمد شروع کنید، یا پس از وجود اعتبارنامه‌های کش‌شده `openclaw doctor --fix` را دوباره اجرا کنید.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- معنی: OpenClaw یک فروشگاه تخت مشترک Matrix پیدا کرد، اما حدس نمی‌زند کدام حساب Matrix نام‌گذاری‌شده باید آن را دریافت کند.
- چه باید کرد: `channels.matrix.defaultAccount` را روی حساب موردنظر تنظیم کنید، سپس `openclaw doctor --fix` را دوباره اجرا کنید یا Gateway را دوباره راه‌اندازی کنید.

`Matrix legacy sync store not migrated because the target already exists (...)`

- معنی: مکان جدید محدود به حساب از قبل یک فروشگاه همگام‌سازی یا کریپتو دارد، بنابراین OpenClaw به‌صورت خودکار آن را overwrite نکرد.
- چه باید کرد: پیش از حذف یا جابه‌جایی دستی مقصد متضاد، تایید کنید حساب فعلی همان حساب درست است.

`Failed migrating Matrix legacy sync store (...)` یا `Failed migrating Matrix legacy crypto store (...)`

- معنی: OpenClaw تلاش کرد وضعیت قدیمی Matrix را منتقل کند اما عملیات filesystem شکست خورد.
- چه باید کرد: مجوزهای filesystem و وضعیت دیسک را بررسی کنید، سپس `openclaw doctor --fix` را دوباره اجرا کنید.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- معنی: OpenClaw یک فروشگاه رمزگذاری‌شده قدیمی Matrix پیدا کرد، اما هیچ پیکربندی فعلی Matrix برای اتصال آن وجود ندارد.
- چه باید کرد: `channels.matrix` را پیکربندی کنید، سپس `openclaw doctor --fix` را دوباره اجرا کنید یا Gateway را دوباره راه‌اندازی کنید.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- معنی: فروشگاه رمزگذاری‌شده وجود دارد، اما OpenClaw نمی‌تواند با اطمینان تصمیم بگیرد به کدام حساب/دستگاه فعلی تعلق دارد.
- چه باید کرد: Gateway را یک‌بار با ورود Matrix کارآمد شروع کنید، یا پس از در دسترس بودن اعتبارنامه‌های کش‌شده `openclaw doctor --fix` را دوباره اجرا کنید.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- معنی: OpenClaw یک فروشگاه کریپتوی قدیمی تخت مشترک پیدا کرد، اما حدس نمی‌زند کدام حساب Matrix نام‌گذاری‌شده باید آن را دریافت کند.
- چه باید کرد: `channels.matrix.defaultAccount` را روی حساب موردنظر تنظیم کنید، سپس `openclaw doctor --fix` را دوباره اجرا کنید یا Gateway را دوباره راه‌اندازی کنید.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- معنی: OpenClaw وضعیت قدیمی Matrix را شناسایی کرد، اما مهاجرت هنوز به‌دلیل نبود داده هویت یا اعتبارنامه مسدود است.
- چه باید کرد: ورود Matrix یا تنظیم پیکربندی را کامل کنید، سپس `openclaw doctor --fix` را دوباره اجرا کنید یا Gateway را دوباره راه‌اندازی کنید.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- معنی: OpenClaw وضعیت قدیمی رمزگذاری‌شدهٔ Matrix را پیدا کرد، اما نتوانست نقطهٔ ورود کمکی را از Plugin مربوط به Matrix که معمولاً آن ذخیره‌گاه را بررسی می‌کند، بارگذاری کند.
- کار لازم: Plugin مربوط به Matrix را دوباره نصب یا تعمیر کنید (`openclaw plugins install @openclaw/matrix`، یا برای checkout مخزن `openclaw plugins install ./path/to/local/matrix-plugin`)، سپس `openclaw doctor --fix` را دوباره اجرا کنید یا Gateway را راه‌اندازی مجدد کنید.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- معنی: OpenClaw مسیر فایل کمکی‌ای را پیدا کرد که از ریشهٔ Plugin خارج می‌شود یا در بررسی‌های مرزی Plugin شکست می‌خورد، بنابراین از import کردن آن خودداری کرد.
- کار لازم: Plugin مربوط به Matrix را از مسیری مورد اعتماد دوباره نصب کنید، سپس `openclaw doctor --fix` را دوباره اجرا کنید یا Gateway را راه‌اندازی مجدد کنید.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- معنی: OpenClaw از تغییر وضعیت Matrix خودداری کرد، چون ابتدا نتوانست snapshot بازیابی را ایجاد کند.
- کار لازم: خطای پشتیبان‌گیری را برطرف کنید، سپس `openclaw doctor --fix` را دوباره اجرا کنید یا Gateway را راه‌اندازی مجدد کنید.

`Failed migrating legacy Matrix client storage: ...`

- معنی: fallback سمت کلاینت Matrix ذخیره‌سازی تخت قدیمی را پیدا کرد، اما انتقال شکست خورد. OpenClaw اکنون به‌جای شروع بی‌صدای کار با یک ذخیره‌گاه تازه، آن fallback را متوقف می‌کند.
- کار لازم: مجوزهای فایل‌سیستم یا تداخل‌ها را بررسی کنید، وضعیت قدیمی را دست‌نخورده نگه دارید، و پس از رفع خطا دوباره تلاش کنید.

`Matrix is installed from a custom path: ...`

- معنی: Matrix به نصب از یک مسیر ثابت شده است، بنابراین به‌روزرسانی‌های mainline آن را به‌طور خودکار با بستهٔ استاندارد Matrix مخزن جایگزین نمی‌کنند.
- کار لازم: وقتی می‌خواهید به Plugin پیش‌فرض Matrix برگردید، با `openclaw plugins install @openclaw/matrix` دوباره نصب کنید.

### پیام‌های بازیابی وضعیت رمزگذاری‌شده

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- معنی: کلیدهای اتاق پشتیبان‌گیری‌شده با موفقیت در ذخیره‌گاه رمزنگاری جدید بازیابی شدند.
- کار لازم: معمولاً هیچ کاری لازم نیست.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- معنی: برخی کلیدهای اتاق قدیمی فقط در ذخیره‌گاه محلی قدیمی وجود داشتند و هرگز در پشتیبان Matrix بارگذاری نشده بودند.
- کار لازم: انتظار داشته باشید بخشی از تاریخچهٔ رمزگذاری‌شدهٔ قدیمی همچنان در دسترس نباشد، مگر اینکه بتوانید آن کلیدها را به‌صورت دستی از یک کلاینت تأییدشدهٔ دیگر بازیابی کنید.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- معنی: پشتیبان وجود دارد، اما OpenClaw نتوانست کلید بازیابی را به‌طور خودکار بازیابی کند.
- کار لازم: `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` را اجرا کنید.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- معنی: OpenClaw ذخیره‌گاه رمزگذاری‌شدهٔ قدیمی را پیدا کرد، اما نتوانست آن را به‌اندازهٔ کافی ایمن بررسی کند تا برای بازیابی آماده شود.
- کار لازم: `openclaw doctor --fix` را دوباره اجرا کنید. اگر تکرار شد، دایرکتوری وضعیت قدیمی را دست‌نخورده نگه دارید و با استفاده از یک کلاینت Matrix تأییدشدهٔ دیگر به‌همراه `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` بازیابی کنید.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- معنی: OpenClaw یک تداخل کلید پشتیبان را تشخیص داد و از بازنویسی خودکار فایل recovery-key فعلی خودداری کرد.
- کار لازم: پیش از تلاش دوباره برای هر فرمان بازیابی، بررسی کنید کدام کلید بازیابی درست است.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- معنی: این محدودیت قطعی قالب ذخیره‌سازی قدیمی است.
- کار لازم: کلیدهای پشتیبان‌گیری‌شده همچنان قابل بازیابی هستند، اما تاریخچهٔ رمزگذاری‌شدهٔ فقط‌محلی ممکن است در دسترس نماند.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- معنی: Plugin جدید تلاش کرد بازیابی کند، اما Matrix خطا برگرداند.
- کار لازم: `openclaw matrix verify backup status` را اجرا کنید، سپس در صورت نیاز با `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` دوباره تلاش کنید.

### پیام‌های بازیابی دستی

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- معنی: OpenClaw می‌داند باید یک کلید پشتیبان داشته باشید، اما آن کلید روی این دستگاه فعال نیست.
- کار لازم: `openclaw matrix verify backup restore` را اجرا کنید، یا در صورت نیاز `MATRIX_RECOVERY_KEY` را تنظیم کنید و `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` را اجرا کنید.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- معنی: این دستگاه در حال حاضر کلید بازیابی را ذخیره‌شده ندارد.
- کار لازم: `MATRIX_RECOVERY_KEY` را تنظیم کنید، `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` را اجرا کنید، سپس پشتیبان را بازیابی کنید.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- معنی: کلید ذخیره‌شده با پشتیبان فعال Matrix مطابقت ندارد.
- کار لازم: `MATRIX_RECOVERY_KEY` را روی کلید درست تنظیم کنید و `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` را اجرا کنید.

اگر از دست دادن تاریخچهٔ رمزگذاری‌شدهٔ قدیمی غیرقابل‌بازیابی را می‌پذیرید، می‌توانید به‌جای آن baseline پشتیبان فعلی را با `openclaw matrix verify backup reset --yes` بازنشانی کنید. وقتی secret پشتیبان ذخیره‌شده خراب باشد، این بازنشانی ممکن است secret storage را نیز دوباره ایجاد کند تا کلید پشتیبان جدید پس از راه‌اندازی مجدد درست بارگذاری شود.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- معنی: پشتیبان وجود دارد، اما این دستگاه هنوز زنجیرهٔ cross-signing را به‌اندازهٔ کافی معتبر نمی‌داند.
- کار لازم: `MATRIX_RECOVERY_KEY` را تنظیم کنید و `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` را اجرا کنید.

`Matrix recovery key is required`

- معنی: شما یک مرحلهٔ بازیابی را بدون ارائهٔ کلید بازیابی اجرا کردید، در حالی که کلید لازم بود.
- کار لازم: فرمان را با `--recovery-key-stdin` دوباره اجرا کنید، برای مثال `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- معنی: کلید ارائه‌شده قابل تجزیه نبود یا با قالب مورد انتظار مطابقت نداشت.
- کار لازم: با کلید بازیابی دقیق از کلاینت Matrix یا فایل recovery-key خود دوباره تلاش کنید.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- معنی: OpenClaw توانست کلید بازیابی را اعمال کند، اما Matrix هنوز اعتماد کامل هویت cross-signing را برای این دستگاه
  برقرار نکرده است. خروجی فرمان را برای `Recovery key accepted`، `Backup usable`،
  `Cross-signing verified`، و `Device verified by owner` بررسی کنید.
- کار لازم: `openclaw matrix verify self` را اجرا کنید، درخواست را در یک کلاینت Matrix دیگر بپذیرید، SAS را مقایسه کنید، و فقط وقتی مطابقت دارد `yes` را وارد کنید. این فرمان پیش از گزارش موفقیت، منتظر اعتماد کامل هویت Matrix می‌ماند. فقط زمانی از
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  استفاده کنید که عمداً می‌خواهید هویت cross-signing فعلی را جایگزین کنید.

`Matrix key backup is not active on this device after loading from secret storage.`

- معنی: secret storage یک نشست پشتیبان فعال روی این دستگاه ایجاد نکرد.
- کار لازم: ابتدا دستگاه را تأیید کنید، سپس با `openclaw matrix verify backup status` دوباره بررسی کنید.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- معنی: این دستگاه تا زمانی که تأیید دستگاه کامل نشده باشد، نمی‌تواند از secret storage بازیابی کند.
- کار لازم: ابتدا `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` را اجرا کنید.

### پیام‌های نصب Plugin سفارشی

`Matrix is installed from a custom path that no longer exists: ...`

- معنی: رکورد نصب Plugin شما به مسیری محلی اشاره می‌کند که دیگر وجود ندارد.
- کار لازم: با `openclaw plugins install @openclaw/matrix` دوباره نصب کنید، یا اگر از checkout مخزن اجرا می‌کنید، `openclaw plugins install ./path/to/local/matrix-plugin`.

## اگر تاریخچهٔ رمزگذاری‌شده همچنان برنمی‌گردد

این بررسی‌ها را به‌ترتیب اجرا کنید:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

اگر پشتیبان با موفقیت بازیابی شد اما برخی اتاق‌های قدیمی هنوز تاریخچه ندارند، احتمالاً آن کلیدهای گم‌شده هرگز توسط Plugin قبلی پشتیبان‌گیری نشده بودند.

## اگر می‌خواهید برای پیام‌های آینده از نو شروع کنید

اگر از دست دادن تاریخچهٔ رمزگذاری‌شدهٔ قدیمی غیرقابل‌بازیابی را می‌پذیرید و فقط یک baseline پشتیبان پاک برای ادامه می‌خواهید، این فرمان‌ها را به‌ترتیب اجرا کنید:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

اگر پس از آن دستگاه همچنان تأییدنشده است، تأیید را از کلاینت Matrix خود با مقایسهٔ emojiهای SAS یا کدهای ده‌دهی و تأیید مطابقت آن‌ها کامل کنید.

## مرتبط

- [Matrix](/fa/channels/matrix): راه‌اندازی و پیکربندی کانال.
- [قوانین push مربوط به Matrix](/fa/channels/matrix-push-rules): مسیریابی اعلان‌ها.
- [Doctor](/fa/gateway/doctor): بررسی سلامت و محرک مهاجرت خودکار.
- [راهنمای مهاجرت](/fa/install/migrating): همهٔ مسیرهای مهاجرت (انتقال ماشین، import بین‌سیستمی).
- [Plugins](/fa/tools/plugin): نصب و ثبت Plugin.
