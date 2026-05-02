---
read_when:
    - ارتقای یک نصب موجود Matrix
    - مهاجرت تاریخچهٔ رمزگذاری‌شدهٔ Matrix و وضعیت دستگاه
summary: نحوهٔ ارتقای درجای Plugin قبلی Matrix توسط OpenClaw، شامل محدودیت‌های بازیابی وضعیت رمزگذاری‌شده و مراحل بازیابی دستی.
title: مهاجرت Matrix
x-i18n:
    generated_at: "2026-05-02T22:16:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8bc9b875fef0ae08978061a9fc7cbb076617009d79487ca8329e03076103b32c
    source_path: channels/matrix-migration.md
    workflow: 16
---

از Plugin عمومی قبلی `matrix` به پیاده‌سازی فعلی ارتقا دهید.

برای بیشتر کاربران، ارتقا درجا انجام می‌شود:

- Plugin همان `@openclaw/matrix` می‌ماند
- کانال همان `matrix` می‌ماند
- پیکربندی شما زیر `channels.matrix` می‌ماند
- اعتبارنامه‌های کش‌شده زیر `~/.openclaw/credentials/matrix/` می‌مانند
- وضعیت زمان اجرا زیر `~/.openclaw/matrix/` می‌ماند

نیازی نیست کلیدهای پیکربندی را تغییر نام دهید یا Plugin را با نام جدیدی دوباره نصب کنید.

## مهاجرت به‌صورت خودکار چه کارهایی انجام می‌دهد

وقتی Gateway شروع به کار می‌کند، و وقتی [`openclaw doctor --fix`](/fa/gateway/doctor) را اجرا می‌کنید، OpenClaw تلاش می‌کند وضعیت قدیمی Matrix را به‌صورت خودکار ترمیم کند.
پیش از آنکه هر گام قابل‌اقدام مهاجرت Matrix وضعیت روی دیسک را تغییر دهد، OpenClaw یک اسنپ‌شات بازیابی متمرکز ایجاد می‌کند یا از آن دوباره استفاده می‌کند.

وقتی از `openclaw update` استفاده می‌کنید، محرک دقیق به نحوه نصب OpenClaw بستگی دارد:

- نصب‌های از منبع، در جریان به‌روزرسانی `openclaw doctor --fix` را اجرا می‌کنند، سپس به‌طور پیش‌فرض Gateway را دوباره راه‌اندازی می‌کنند
- نصب‌های مدیر بسته، بسته را به‌روزرسانی می‌کنند، یک گذر doctor غیرتعاملی اجرا می‌کنند، سپس به راه‌اندازی دوباره پیش‌فرض Gateway تکیه می‌کنند تا شروع به کار بتواند مهاجرت Matrix را کامل کند
- اگر از `openclaw update --no-restart` استفاده کنید، مهاجرت Matrix مبتنی بر شروع به کار تا زمانی که بعدا `openclaw doctor --fix` را اجرا کنید و Gateway را دوباره راه‌اندازی کنید به تعویق می‌افتد

مهاجرت خودکار شامل این موارد است:

- ایجاد یا استفاده دوباره از اسنپ‌شات پیش از مهاجرت زیر `~/Backups/openclaw-migrations/`
- استفاده دوباره از اعتبارنامه‌های Matrix کش‌شده شما
- حفظ همان انتخاب حساب و پیکربندی `channels.matrix`
- انتقال قدیمی‌ترین ذخیره‌گاه همگام‌سازی تخت Matrix به مکان فعلی با دامنه حساب
- انتقال قدیمی‌ترین ذخیره‌گاه کریپتوی تخت Matrix به مکان فعلی با دامنه حساب، وقتی حساب مقصد را بتوان با اطمینان تعیین کرد
- استخراج کلید رمزگشایی پشتیبان کلید اتاق Matrix که قبلا ذخیره شده است، از ذخیره‌گاه کریپتوی rust قدیمی، وقتی آن کلید به‌صورت محلی وجود داشته باشد
- استفاده دوباره از کامل‌ترین ریشه ذخیره‌سازی هش توکن موجود برای همان حساب Matrix، homeserver و کاربر، وقتی توکن دسترسی بعدا تغییر کند
- اسکن ریشه‌های ذخیره‌سازی هش توکن هم‌سطح برای فراداده بازیابی وضعیت رمزگذاری‌شده در انتظار، وقتی توکن دسترسی Matrix تغییر کرده اما هویت حساب/دستگاه همان مانده است
- بازیابی کلیدهای اتاق پشتیبان‌گیری‌شده در ذخیره‌گاه کریپتوی جدید در شروع بعدی Matrix

جزئیات اسنپ‌شات:

- OpenClaw پس از اسنپ‌شات موفق، یک فایل نشانگر در `~/.openclaw/matrix/migration-snapshot.json` می‌نویسد تا گذرهای بعدی شروع به کار و ترمیم بتوانند از همان آرشیو دوباره استفاده کنند.
- این اسنپ‌شات‌های خودکار مهاجرت Matrix فقط از پیکربندی + وضعیت پشتیبان می‌گیرند (`includeWorkspace: false`).
- اگر Matrix فقط وضعیت مهاجرت هشدارگونه داشته باشد، برای مثال چون `userId` یا `accessToken` هنوز وجود ندارد، OpenClaw هنوز اسنپ‌شات را ایجاد نمی‌کند، چون هیچ تغییر Matrix قابل‌اقدامی وجود ندارد.
- اگر گام اسنپ‌شات شکست بخورد، OpenClaw به‌جای تغییر وضعیت بدون نقطه بازیابی، مهاجرت Matrix را برای آن اجرا نادیده می‌گیرد.

درباره ارتقاهای چندحسابی:

- قدیمی‌ترین ذخیره‌گاه تخت Matrix (`~/.openclaw/matrix/bot-storage.json` و `~/.openclaw/matrix/crypto/`) از یک چیدمان تک‌ذخیره‌گاهی آمده است، بنابراین OpenClaw فقط می‌تواند آن را به یک مقصد حساب Matrix تعیین‌شده مهاجرت دهد
- ذخیره‌گاه‌های قدیمی Matrix که از قبل دامنه حساب دارند، برای هر حساب Matrix پیکربندی‌شده شناسایی و آماده می‌شوند

## مهاجرت چه کارهایی را نمی‌تواند خودکار انجام دهد

Plugin عمومی قبلی Matrix به‌صورت خودکار پشتیبان کلید اتاق Matrix ایجاد نمی‌کرد. وضعیت کریپتوی محلی را پایدار می‌کرد و درخواست راستی‌آزمایی دستگاه می‌داد، اما تضمین نمی‌کرد که کلیدهای اتاق شما در homeserver پشتیبان‌گیری شده باشند.

این یعنی برخی نصب‌های رمزگذاری‌شده فقط می‌توانند به‌صورت جزئی مهاجرت شوند.

OpenClaw نمی‌تواند به‌صورت خودکار این موارد را بازیابی کند:

- کلیدهای اتاق فقط‌محلی که هرگز پشتیبان‌گیری نشده‌اند
- وضعیت رمزگذاری‌شده وقتی حساب Matrix مقصد هنوز قابل تعیین نیست، چون `homeserver`، `userId` یا `accessToken` هنوز در دسترس نیستند
- مهاجرت خودکار یک ذخیره‌گاه تخت Matrix مشترک وقتی چند حساب Matrix پیکربندی شده‌اند اما `channels.matrix.defaultAccount` تنظیم نشده است
- نصب‌های مسیر سفارشی Plugin که به‌جای بسته استاندارد Matrix به مسیر یک مخزن پین شده‌اند
- کلید بازیابی گم‌شده وقتی ذخیره‌گاه قدیمی کلیدهای پشتیبان‌گیری‌شده داشت اما کلید رمزگشایی را به‌صورت محلی نگه نداشته بود

دامنه هشدار فعلی:

- نصب‌های مسیر سفارشی Plugin مربوط به Matrix هم توسط شروع به کار Gateway و هم توسط `openclaw doctor` نمایش داده می‌شوند

اگر نصب قدیمی شما تاریخچه رمزگذاری‌شده فقط‌محلی داشت که هرگز پشتیبان‌گیری نشده بود، برخی پیام‌های رمزگذاری‌شده قدیمی‌تر ممکن است پس از ارتقا همچنان خواندنی نباشند.

## جریان ارتقای پیشنهادی

1. OpenClaw و Plugin مربوط به Matrix را به‌طور معمول به‌روزرسانی کنید.
   `openclaw update` ساده را بدون `--no-restart` ترجیح دهید تا شروع به کار بتواند مهاجرت Matrix را بلافاصله کامل کند.
2. اجرا کنید:

   ```bash
   openclaw doctor --fix
   ```

   اگر Matrix کار مهاجرت قابل‌اقدام داشته باشد، doctor ابتدا اسنپ‌شات پیش از مهاجرت را ایجاد می‌کند یا از آن دوباره استفاده می‌کند و مسیر آرشیو را چاپ می‌کند.

3. Gateway را شروع یا دوباره راه‌اندازی کنید.
4. وضعیت فعلی راستی‌آزمایی و پشتیبان را بررسی کنید:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. کلید بازیابی حساب Matrix را که در حال ترمیم آن هستید در یک متغیر محیطی مخصوص حساب قرار دهید. برای یک حساب پیش‌فرض واحد، `MATRIX_RECOVERY_KEY` کافی است. برای چند حساب، برای هر حساب یک متغیر استفاده کنید، برای مثال `MATRIX_RECOVERY_KEY_ASSISTANT`، و `--account assistant` را به فرمان اضافه کنید.

6. اگر OpenClaw به شما گفت که کلید بازیابی لازم است، فرمان را برای حساب متناظر اجرا کنید:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. اگر این دستگاه هنوز راستی‌آزمایی نشده است، فرمان را برای حساب متناظر اجرا کنید:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   اگر کلید بازیابی پذیرفته شد و پشتیبان قابل استفاده بود، اما `Cross-signing verified`
   هنوز `no` است، خودراستی‌آزمایی را از یک کلاینت Matrix دیگر کامل کنید:

   ```bash
   openclaw matrix verify self
   ```

   درخواست را در یک کلاینت Matrix دیگر بپذیرید، ایموجی یا اعداد اعشاری را مقایسه کنید،
   و فقط وقتی مطابقت دارند `yes` را تایپ کنید. فرمان فقط پس از آنکه
   `Cross-signing verified` به `yes` تبدیل شود با موفقیت خارج می‌شود.

8. اگر عمدا تاریخچه قدیمی غیرقابل‌بازیابی را کنار می‌گذارید و برای پیام‌های آینده یک خط پایه پشتیبان تازه می‌خواهید، اجرا کنید:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. اگر هنوز هیچ پشتیبان کلید سمت سرور وجود ندارد، برای بازیابی‌های آینده یکی بسازید:

   ```bash
   openclaw matrix verify bootstrap
   ```

## مهاجرت رمزگذاری‌شده چگونه کار می‌کند

مهاجرت رمزگذاری‌شده یک فرایند دو مرحله‌ای است:

1. شروع به کار یا `openclaw doctor --fix`، اگر مهاجرت رمزگذاری‌شده قابل‌اقدام باشد، اسنپ‌شات پیش از مهاجرت را ایجاد می‌کند یا از آن دوباره استفاده می‌کند.
2. شروع به کار یا `openclaw doctor --fix`، ذخیره‌گاه کریپتوی قدیمی Matrix را از طریق نصب فعال Plugin مربوط به Matrix بررسی می‌کند.
3. اگر کلید رمزگشایی پشتیبان پیدا شود، OpenClaw آن را در جریان جدید کلید بازیابی می‌نویسد و بازیابی کلید اتاق را به‌عنوان در انتظار علامت‌گذاری می‌کند.
4. در شروع بعدی Matrix، OpenClaw به‌صورت خودکار کلیدهای اتاق پشتیبان‌گیری‌شده را در ذخیره‌گاه کریپتوی جدید بازیابی می‌کند.

اگر ذخیره‌گاه قدیمی کلیدهای اتاقی را گزارش کند که هرگز پشتیبان‌گیری نشده‌اند، OpenClaw به‌جای وانمود کردن به موفقیت بازیابی، هشدار می‌دهد.

## پیام‌های رایج و معنای آن‌ها

### پیام‌های ارتقا و تشخیص

`Matrix plugin upgraded in place.`

- معنی: وضعیت قدیمی Matrix روی دیسک شناسایی شد و به چیدمان فعلی مهاجرت داده شد.
- چه باید کرد: هیچ کاری، مگر اینکه همان خروجی شامل هشدارها نیز باشد.

`Matrix migration snapshot created before applying Matrix upgrades.`

- معنی: OpenClaw پیش از تغییر وضعیت Matrix یک آرشیو بازیابی ایجاد کرد.
- چه باید کرد: مسیر آرشیو چاپ‌شده را تا زمانی که تأیید کنید مهاجرت موفق بوده نگه دارید.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- معنی: OpenClaw یک نشانگر اسنپ‌شات مهاجرت Matrix موجود پیدا کرد و به‌جای ایجاد پشتیبان تکراری، از همان آرشیو دوباره استفاده کرد.
- چه باید کرد: مسیر آرشیو چاپ‌شده را تا زمانی که تأیید کنید مهاجرت موفق بوده نگه دارید.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- معنی: وضعیت قدیمی Matrix وجود دارد، اما OpenClaw نمی‌تواند آن را به یک حساب Matrix فعلی نگاشت کند، چون Matrix پیکربندی نشده است.
- چه باید کرد: `channels.matrix` را پیکربندی کنید، سپس `openclaw doctor --fix` را دوباره اجرا کنید یا Gateway را دوباره راه‌اندازی کنید.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- معنی: OpenClaw وضعیت قدیمی را پیدا کرد، اما هنوز نمی‌تواند ریشه دقیق حساب/دستگاه فعلی را تعیین کند.
- چه باید کرد: Gateway را یک بار با ورود Matrix سالم شروع کنید، یا پس از وجود اعتبارنامه‌های کش‌شده `openclaw doctor --fix` را دوباره اجرا کنید.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- معنی: OpenClaw یک ذخیره‌گاه تخت Matrix مشترک پیدا کرد، اما حدس نمی‌زند کدام حساب نام‌دار Matrix باید آن را دریافت کند.
- چه باید کرد: `channels.matrix.defaultAccount` را روی حساب موردنظر تنظیم کنید، سپس `openclaw doctor --fix` را دوباره اجرا کنید یا Gateway را دوباره راه‌اندازی کنید.

`Matrix legacy sync store not migrated because the target already exists (...)`

- معنی: مکان جدید با دامنه حساب از قبل یک ذخیره‌گاه همگام‌سازی یا کریپتو دارد، بنابراین OpenClaw آن را به‌صورت خودکار بازنویسی نکرد.
- چه باید کرد: پیش از حذف یا انتقال دستی مقصد متعارض، بررسی کنید که حساب فعلی همان حساب درست است.

`Failed migrating Matrix legacy sync store (...)` یا `Failed migrating Matrix legacy crypto store (...)`

- معنی: OpenClaw تلاش کرد وضعیت قدیمی Matrix را منتقل کند اما عملیات فایل‌سیستم شکست خورد.
- چه باید کرد: مجوزهای فایل‌سیستم و وضعیت دیسک را بررسی کنید، سپس `openclaw doctor --fix` را دوباره اجرا کنید.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- معنی: OpenClaw یک ذخیره‌گاه رمزگذاری‌شده قدیمی Matrix پیدا کرد، اما هیچ پیکربندی فعلی Matrix برای اتصال آن وجود ندارد.
- چه باید کرد: `channels.matrix` را پیکربندی کنید، سپس `openclaw doctor --fix` را دوباره اجرا کنید یا Gateway را دوباره راه‌اندازی کنید.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- معنی: ذخیره‌گاه رمزگذاری‌شده وجود دارد، اما OpenClaw نمی‌تواند با اطمینان تصمیم بگیرد متعلق به کدام حساب/دستگاه فعلی است.
- چه باید کرد: Gateway را یک بار با ورود Matrix سالم شروع کنید، یا پس از در دسترس بودن اعتبارنامه‌های کش‌شده `openclaw doctor --fix` را دوباره اجرا کنید.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- معنی: OpenClaw یک ذخیره‌گاه کریپتوی قدیمی تخت مشترک پیدا کرد، اما حدس نمی‌زند کدام حساب نام‌دار Matrix باید آن را دریافت کند.
- چه باید کرد: `channels.matrix.defaultAccount` را روی حساب موردنظر تنظیم کنید، سپس `openclaw doctor --fix` را دوباره اجرا کنید یا Gateway را دوباره راه‌اندازی کنید.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- معنی: OpenClaw وضعیت قدیمی Matrix را تشخیص داد، اما مهاجرت هنوز به‌دلیل نبود داده هویت یا اعتبارنامه مسدود است.
- چه باید کرد: ورود Matrix یا تنظیم پیکربندی را کامل کنید، سپس `openclaw doctor --fix` را دوباره اجرا کنید یا Gateway را دوباره راه‌اندازی کنید.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- معنی: OpenClaw وضعیت رمزگذاری‌شده قدیمی Matrix را پیدا کرد، اما نتوانست نقطه ورود کمکی را از Plugin مربوط به Matrix که معمولا آن ذخیره‌گاه را بررسی می‌کند بارگذاری کند.
- چه باید کرد: Plugin مربوط به Matrix را دوباره نصب یا ترمیم کنید (`openclaw plugins install @openclaw/matrix`، یا برای checkout یک مخزن، `openclaw plugins install ./path/to/local/matrix-plugin`)، سپس `openclaw doctor --fix` را دوباره اجرا کنید یا Gateway را دوباره راه‌اندازی کنید.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- معنی: OpenClaw مسیر فایل کمکی‌ای را پیدا کرد که از ریشه Plugin خارج می‌شود یا بررسی‌های مرز Plugin را رد نمی‌کند، بنابراین از import کردن آن خودداری کرد.
- کار لازم: Plugin مربوط به Matrix را از یک مسیر قابل اعتماد دوباره نصب کنید، سپس `openclaw doctor --fix` را دوباره اجرا کنید یا Gateway را restart کنید.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- معنی: OpenClaw از تغییر دادن وضعیت Matrix خودداری کرد، چون نتوانست ابتدا snapshot بازیابی را ایجاد کند.
- کار لازم: خطای backup را برطرف کنید، سپس `openclaw doctor --fix` را دوباره اجرا کنید یا Gateway را restart کنید.

`Failed migrating legacy Matrix client storage: ...`

- معنی: fallback سمت کلاینت Matrix، storage تخت قدیمی را پیدا کرد، اما جابه‌جایی شکست خورد. OpenClaw اکنون به‌جای اینکه بی‌سروصدا با یک store تازه شروع شود، آن fallback را متوقف می‌کند.
- کار لازم: مجوزهای filesystem یا تداخل‌ها را بررسی کنید، وضعیت قدیمی را دست‌نخورده نگه دارید، و پس از رفع خطا دوباره تلاش کنید.

`Matrix is installed from a custom path: ...`

- معنی: Matrix به یک نصب مبتنی بر مسیر pin شده است، بنابراین به‌روزرسانی‌های mainline به‌طور خودکار آن را با package استاندارد Matrix در repo جایگزین نمی‌کنند.
- کار لازم: وقتی می‌خواهید به Plugin پیش‌فرض Matrix برگردید، با `openclaw plugins install @openclaw/matrix` دوباره نصب کنید.

### پیام‌های بازیابی وضعیت رمزگذاری‌شده

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- معنی: کلیدهای room پشتیبان‌گیری‌شده با موفقیت در crypto store جدید بازیابی شدند.
- کار لازم: معمولاً هیچ کاری لازم نیست.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- معنی: برخی کلیدهای room قدیمی فقط در store محلی قدیمی وجود داشتند و هرگز در backup مربوط به Matrix upload نشده بودند.
- کار لازم: انتظار داشته باشید بخشی از history رمزگذاری‌شده قدیمی همچنان در دسترس نباشد، مگر اینکه بتوانید آن کلیدها را به‌صورت دستی از یک کلاینت verified دیگر بازیابی کنید.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- معنی: backup وجود دارد، اما OpenClaw نتوانست recovery key را به‌طور خودکار بازیابی کند.
- کار لازم: `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` را اجرا کنید.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- معنی: OpenClaw store رمزگذاری‌شده قدیمی را پیدا کرد، اما نتوانست آن را به اندازه کافی امن بررسی کند تا بازیابی را آماده کند.
- کار لازم: `openclaw doctor --fix` را دوباره اجرا کنید. اگر تکرار شد، دایرکتوری وضعیت قدیمی را دست‌نخورده نگه دارید و با استفاده از یک کلاینت Matrix verified دیگر به‌همراه `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` بازیابی کنید.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- معنی: OpenClaw یک تداخل backup key تشخیص داد و از بازنویسی خودکار فایل recovery-key فعلی خودداری کرد.
- کار لازم: پیش از اجرای دوباره هر دستور restore، بررسی کنید کدام recovery key درست است.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- معنی: این محدودیت قطعی format قدیمی storage است.
- کار لازم: کلیدهای پشتیبان‌گیری‌شده همچنان قابل بازیابی هستند، اما history رمزگذاری‌شده local-only ممکن است در دسترس نماند.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- معنی: Plugin جدید تلاش کرد restore انجام دهد، اما Matrix خطا برگرداند.
- کار لازم: `openclaw matrix verify backup status` را اجرا کنید، سپس در صورت نیاز با `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` دوباره تلاش کنید.

### پیام‌های بازیابی دستی

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- معنی: OpenClaw می‌داند که باید backup key داشته باشید، اما این کلید روی این دستگاه active نیست.
- کار لازم: `openclaw matrix verify backup restore` را اجرا کنید، یا در صورت نیاز `MATRIX_RECOVERY_KEY` را set کنید و `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` را اجرا کنید.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- معنی: این دستگاه در حال حاضر recovery key را stored ندارد.
- کار لازم: `MATRIX_RECOVERY_KEY` را set کنید، `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` را اجرا کنید، سپس backup را restore کنید.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- معنی: کلید stored با backup فعال Matrix مطابقت ندارد.
- کار لازم: `MATRIX_RECOVERY_KEY` را روی کلید درست set کنید و `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` را اجرا کنید.

اگر از دست دادن history رمزگذاری‌شده قدیمیِ غیرقابل بازیابی را می‌پذیرید، می‌توانید در عوض
baseline فعلی backup را با `openclaw matrix verify backup reset --yes` reset کنید. وقتی
secret مربوط به backup stored خراب باشد، این reset ممکن است secret storage را هم دوباره ایجاد کند تا
backup key جدید پس از restart درست load شود.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- معنی: backup وجود دارد، اما این دستگاه هنوز به زنجیره cross-signing به اندازه کافی اعتماد ندارد.
- کار لازم: `MATRIX_RECOVERY_KEY` را set کنید و `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` را اجرا کنید.

`Matrix recovery key is required`

- معنی: یک مرحله بازیابی را بدون ارائه recovery key اجرا کردید، در حالی که recovery key لازم بود.
- کار لازم: command را با `--recovery-key-stdin` دوباره اجرا کنید، برای مثال `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- معنی: کلید ارائه‌شده قابل parse نبود یا با format مورد انتظار مطابقت نداشت.
- کار لازم: با recovery key دقیق از کلاینت Matrix یا فایل recovery-key خود دوباره تلاش کنید.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- معنی: OpenClaw توانست recovery key را apply کند، اما Matrix هنوز
  full cross-signing identity trust را برای این دستگاه برقرار نکرده است. خروجی
  command را برای `Recovery key accepted`، `Backup usable`،
  `Cross-signing verified` و `Device verified by owner` بررسی کنید.
- کار لازم: `openclaw matrix verify self` را اجرا کنید، request را در یک
  کلاینت Matrix دیگر accept کنید، SAS را مقایسه کنید، و فقط وقتی مطابقت داشت `yes` را type کنید.
  command پیش از گزارش success منتظر full Matrix identity trust می‌ماند. فقط زمانی از
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  استفاده کنید که عمداً می‌خواهید cross-signing identity فعلی را جایگزین کنید.

`Matrix key backup is not active on this device after loading from secret storage.`

- معنی: secret storage یک backup session فعال روی این دستگاه ایجاد نکرد.
- کار لازم: ابتدا دستگاه را verify کنید، سپس با `openclaw matrix verify backup status` دوباره بررسی کنید.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- معنی: این دستگاه تا زمانی که device verification کامل نشود، نمی‌تواند از secret storage restore کند.
- کار لازم: ابتدا `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` را اجرا کنید.

### پیام‌های نصب Plugin سفارشی

`Matrix is installed from a custom path that no longer exists: ...`

- معنی: record نصب Plugin شما به یک مسیر محلی اشاره می‌کند که دیگر وجود ندارد.
- کار لازم: با `openclaw plugins install @openclaw/matrix` دوباره نصب کنید، یا اگر از یک repo checkout اجرا می‌کنید، `openclaw plugins install ./path/to/local/matrix-plugin`.

## اگر history رمزگذاری‌شده هنوز برنمی‌گردد

این بررسی‌ها را به ترتیب اجرا کنید:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

اگر backup با موفقیت restore شد اما برخی roomهای قدیمی هنوز history ندارند، احتمالاً آن کلیدهای missing هرگز توسط Plugin قبلی backup نشده بودند.

## اگر می‌خواهید برای پیام‌های آینده از نو شروع کنید

اگر از دست دادن history رمزگذاری‌شده قدیمیِ غیرقابل بازیابی را می‌پذیرید و فقط یک baseline تمیز backup برای ادامه می‌خواهید، این commandها را به ترتیب اجرا کنید:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

اگر پس از آن دستگاه هنوز unverified است، verification را از کلاینت Matrix خود با مقایسه emojiهای SAS یا decimal codeها کامل کنید و تأیید کنید که مطابقت دارند.

## مرتبط

- [Matrix](/fa/channels/matrix): راه‌اندازی channel و config.
- [Matrix push rules](/fa/channels/matrix-push-rules): مسیریابی notification.
- [Doctor](/fa/gateway/doctor): health check و trigger خودکار migration.
- [Migration guide](/fa/install/migrating): همه مسیرهای migration (جابه‌جایی machine، importهای cross-system).
- [Plugins](/fa/tools/plugin): نصب و registration پلاگین.
