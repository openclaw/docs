---
read_when:
    - ساخت یا اجرای کنترل کیفیت بصری زنده برای باگ‌های OpenClaw
    - افزودن راستی‌آزمایی قبل و بعد برای یک درخواست کشش
    - افزودن Discord، Slack، WhatsApp یا سناریوهای انتقال زندهٔ دیگر
    - اشکال‌زدایی اجراهای تضمین کیفیت که به نماگرفت‌ها، خودکارسازی مرورگر یا دسترسی VNC نیاز دارند
summary: Mantis سامانهٔ تأیید بصری سرتاسری برای بازتولید باگ‌های OpenClaw روی انتقال‌دهنده‌های زنده، ثبت شواهد قبل و بعد، و پیوست کردن مصنوعات به درخواست‌های کشش است.
title: آخوندک
x-i18n:
    generated_at: "2026-05-04T02:23:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a86ab4bc876d1c53ada1c30580034165f028194a072f559eb54a898a369211d
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis سامانهٔ راستی‌آزمایی سرتاسری OpenClaw برای باگ‌هایی است که به runtime واقعی، transport واقعی و اثبات دیداری نیاز دارند. این سامانه یک سناریو را روی یک ref خرابِ شناخته‌شده اجرا می‌کند، شواهد را ثبت می‌کند، همان سناریو را روی یک ref نامزد اجرا می‌کند، و مقایسه را به‌صورت artifactهایی منتشر می‌کند که یک نگه‌دارنده می‌تواند از یک PR یا از یک فرمان محلی بررسی کند.

Mantis با Discord شروع می‌شود، چون Discord یک مسیر اولیهٔ بسیار ارزشمند در اختیار ما می‌گذارد: احراز هویت واقعی bot، کانال‌های واقعی guild، واکنش‌ها، threadها، فرمان‌های بومی، و یک رابط کاربری مرورگر که انسان‌ها می‌توانند در آن به‌صورت دیداری تأیید کنند transport چه چیزی را نشان داده است.

## اهداف

- بازتولید یک باگ از یک issue یا PR در GitHub با همان شکل transport که کاربران می‌بینند.
- ثبت یک artifact **قبل** روی ref مبنا پیش از اعمال اصلاح.
- ثبت یک artifact **بعد** روی ref نامزد پس از اعمال اصلاح.
- استفاده از oracle قطعی هر زمان ممکن باشد، مانند خواندن واکنش با Discord REST یا بررسی رونوشت کانال.
- ثبت screenshotها وقتی باگ سطح رابط کاربری قابل مشاهده دارد.
- اجرای محلی از یک CLI کنترل‌شده توسط agent و اجرای راه‌دور از GitHub.
- حفظ وضعیت کافی از ماشین برای نجات با VNC وقتی ورود، خودکارسازی مرورگر، یا احراز هویت provider گیر می‌کند.
- ارسال وضعیت کوتاه به یک کانال Discord عملیاتی وقتی اجرا مسدود شده، به کمک دستی VNC نیاز دارد، یا تمام می‌شود.

## غیرهدف‌ها

- Mantis جایگزین تست‌های واحد نیست. اجرای Mantis معمولاً باید پس از فهمیدن اصلاح، به یک تست regression کوچک‌تر تبدیل شود.
- Mantis دروازهٔ CI سریع معمول نیست. کندتر است، از credentialهای زنده استفاده می‌کند، و برای باگ‌هایی نگه داشته می‌شود که محیط زنده در آن‌ها مهم است.
- Mantis نباید برای عملیات عادی به انسان نیاز داشته باشد. VNC دستی مسیر نجات است، نه مسیر مطلوب.
- Mantis secretهای خام را در artifactها، logها، screenshotها، گزارش‌های Markdown، یا دیدگاه‌های PR ذخیره نمی‌کند.

## مالکیت

Mantis در پشتهٔ QA OpenClaw قرار دارد.

- OpenClaw مالک runtime سناریو، adapterهای transport، schema شواهد، و CLI محلی زیر `pnpm openclaw qa mantis` است.
- QA Lab مالک قطعه‌های harness مربوط به transport زنده، helperهای ثبت مرورگر، و writerهای artifact است.
- Crabbox مالک ماشین‌های Linux گرم‌شده وقتی به VM راه‌دور نیاز باشد است.
- GitHub Actions مالک نقطهٔ ورود workflow راه‌دور و نگه‌داری artifact است.
- ClawSweeper مالک مسیریابی دیدگاه‌های GitHub است: parse کردن فرمان‌های نگه‌دارنده، dispatch کردن workflow، و ارسال دیدگاه نهایی PR.
- agentهای OpenClaw وقتی یک سناریو به راه‌اندازی agentic، اشکال‌زدایی، یا گزارش وضعیت گیرکرده نیاز دارد، Mantis را از طریق Codex هدایت می‌کنند.

این مرز دانش transport را در OpenClaw، زمان‌بندی ماشین را در Crabbox، و چسب workflow نگه‌دارنده را در ClawSweeper نگه می‌دارد.

## شکل فرمان

نخستین فرمان محلی، bot در Discord، guild، کانال، ارسال پیام، ارسال واکنش، و مسیر artifact را راستی‌آزمایی می‌کند:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

runner محلی قبل و بعد این شکل را می‌پذیرد:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

runner زیر دایرکتوری خروجی، worktreeهای جداشدهٔ baseline و candidate می‌سازد، وابستگی‌ها را نصب می‌کند، هر ref را build می‌کند، سناریو را با `--allow-failures` اجرا می‌کند، سپس `baseline/`، `candidate/`، `comparison.json`، و `mantis-report.md` را می‌نویسد. برای نخستین سناریوی Discord، راستی‌آزمایی موفق یعنی وضعیت baseline برابر `fail` و وضعیت candidate برابر `pass` است.

نخستین primitive مربوط به VM/مرورگر، smoke دسکتاپ است:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

این فرمان یک ماشین دسکتاپ Crabbox را اجاره می‌کند یا دوباره به‌کار می‌گیرد، یک مرورگر قابل مشاهده را داخل نشست VNC شروع می‌کند، دسکتاپ را ثبت می‌کند، artifactها را به دایرکتوری خروجی محلی برمی‌گرداند، و فرمان reconnect را داخل گزارش می‌نویسد. فرمان به‌صورت پیش‌فرض از provider Hetzner استفاده می‌کند، چون نخستین provider با پوشش کارآمد دسکتاپ/VNC در مسیر Mantis است. هنگام اجرا روی fleet دیگری از Crabbox، آن را با `--provider`، `--crabbox-bin`، یا `OPENCLAW_MANTIS_CRABBOX_PROVIDER` override کنید.

flagهای مفید smoke دسکتاپ:

- `--lease-id <cbx_...>` یا `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` یک دسکتاپ گرم‌شده را دوباره به‌کار می‌گیرد.
- `--browser-url <url>` صفحه‌ای را که در مرورگر قابل مشاهده باز می‌شود تغییر می‌دهد.
- `--html-file <path>` یک artifact HTML محلی repo را در مرورگر قابل مشاهده render می‌کند. Mantis از این برای ثبت timeline تولیدشدهٔ واکنش‌های وضعیت Discord از طریق یک دسکتاپ واقعی Crabbox استفاده می‌کند.
- `--keep-lease` یا `OPENCLAW_MANTIS_KEEP_VM=1` یک lease تازه‌ساخته و موفق را برای بررسی VNC باز نگه می‌دارد. اجراهای ناموفق وقتی lease ساخته شده باشد به‌صورت پیش‌فرض آن را نگه می‌دارند تا یک operator بتواند دوباره وصل شود.
- `--class`، `--idle-timeout`، و `--ttl` اندازهٔ ماشین و طول عمر lease را تنظیم می‌کنند.

workflow smoke در GitHub برابر `Mantis Discord Smoke` است. workflow قبل و بعد GitHub برای نخستین سناریوی واقعی برابر `Mantis Discord Status Reactions` است. این workflow موارد زیر را می‌پذیرد:

- `baseline_ref`: همان ref که انتظار می‌رود رفتار فقط queued را بازتولید کند.
- `candidate_ref`: همان ref که انتظار می‌رود `queued -> thinking -> done` را نشان دهد.

این workflow، ref مربوط به harness workflow را checkout می‌کند، worktreeهای جداگانهٔ baseline و candidate را build می‌کند، `discord-status-reactions-tool-only` را روی هر worktree اجرا می‌کند، و `baseline/`، `candidate/`، `comparison.json`، و `mantis-report.md` را به‌عنوان artifactهای Actions upload می‌کند. همچنین HTML timeline هر مسیر را در مرورگر دسکتاپ Crabbox render می‌کند و آن screenshotهای VNC را کنار PNGهای قطعی timeline در دیدگاه PR منتشر می‌کند. workflow، CLI مربوط به Crabbox را از main در `openclaw/crabbox` build می‌کند تا بتواند از flagهای فعلی lease دسکتاپ/مرورگر پیش از انتشار binary بعدی Crabbox استفاده کند.

همچنین می‌توانید اجرای status-reactions را مستقیماً از یک دیدگاه PR trigger کنید:

```text
@Mantis discord status reactions
```

trigger دیدگاه عمداً محدود است. فقط روی دیدگاه‌های pull request از کاربرانی با دسترسی write، maintain، یا admin اجرا می‌شود، و فقط درخواست‌های مربوط به واکنش وضعیت Discord را تشخیص می‌دهد. به‌صورت پیش‌فرض، از ref مبنای خرابِ شناخته‌شده و SHA مربوط به head فعلی PR به‌عنوان candidate استفاده می‌کند. نگه‌دارنده‌ها می‌توانند هر دو ref را override کنند:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

نمونه‌های فرمان ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

فرمان اول صریح و متمرکز بر سناریو است. فرمان دوم می‌تواند بعداً یک PR یا issue را از روی labelها، فایل‌های تغییرکرده، و یافته‌های review در ClawSweeper به سناریوهای پیشنهادی Mantis نگاشت کند.

## چرخهٔ اجرای

1. دریافت credentialها.
2. تخصیص یا استفادهٔ دوباره از یک VM.
3. آماده‌سازی profile دسکتاپ/مرورگر وقتی سناریو به شواهد رابط کاربری نیاز دارد.
4. آماده‌سازی یک checkout تمیز برای ref مبنا.
5. نصب وابستگی‌ها و build فقط آنچه سناریو نیاز دارد.
6. شروع یک OpenClaw Gateway فرزند با دایرکتوری وضعیت ایزوله.
7. پیکربندی transport زنده، provider، model، و profile مرورگر.
8. اجرای سناریو و ثبت شواهد baseline.
9. توقف gateway و حفظ logها.
10. آماده‌سازی ref نامزد در همان VM.
11. اجرای همان سناریو و ثبت شواهد candidate.
12. مقایسهٔ نتایج oracle و شواهد دیداری.
13. نوشتن Markdown، JSON، logها، screenshotها، و artifactهای trace اختیاری.
14. upload کردن artifactهای GitHub Actions.
15. ارسال یک پیام وضعیت کوتاه در PR یا Discord.

سناریو باید بتواند به دو شکل متفاوت شکست بخورد:

- **بازتولید باگ**: baseline به شکل مورد انتظار شکست خورده است.
- **شکست harness**: راه‌اندازی محیط، credentialها، Discord API، مرورگر، یا provider پیش از معنادار شدن oracle باگ شکست خورده است.

گزارش نهایی باید این موارد را جدا کند تا نگه‌دارنده‌ها محیط ناپایدار را با رفتار محصول اشتباه نگیرند.

## MVP در Discord

نخستین سناریو باید واکنش‌های وضعیت Discord را در کانال‌های guild هدف بگیرد، جایی که حالت تحویل پاسخ منبع `message_tool_only` است.

چرا seed خوبی برای Mantis است:

- در Discord به‌صورت واکنش روی پیام triggerکننده قابل مشاهده است.
- از طریق وضعیت واکنش پیام Discord یک oracle قوی REST دارد.
- یک OpenClaw Gateway واقعی، احراز هویت bot در Discord، dispatch پیام، حالت تحویل پاسخ منبع، وضعیت واکنش وضعیت، و چرخهٔ عمر turn در model را تمرین می‌دهد.
- به‌اندازهٔ کافی محدود است تا نخستین پیاده‌سازی دقیق بماند.

شکل مورد انتظار سناریو:

```yaml
id: discord-status-reactions-tool-only
transport: discord
baseline:
  expect:
    reproduced: true
candidate:
  expect:
    fixed: true
config:
  messages:
    ackReaction: "👀"
    ackReactionScope: "group-mentions"
    groupChat:
      visibleReplies: "message_tool"
    statusReactions:
      enabled: true
      timing:
        debounceMs: 0
discord:
  requireMention: true
  notifyChannel: operator-notify
evidence:
  rest:
    messageReactions: true
  browser:
    screenshotMessageRow: true
```

شواهد baseline باید واکنش acknowledgement مربوط به queued را نشان دهد اما در حالت tool-only هیچ transition چرخهٔ عمر نداشته باشد. شواهد candidate باید نشان دهد واکنش‌های وضعیت چرخهٔ عمر وقتی `messages.statusReactions.enabled` به‌صورت صریح true است اجرا می‌شوند.

نخستین بخش اجرایی، سناریوی QA زندهٔ Discord به‌صورت opt-in است:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

این SUT را با رسیدگی همیشه‌روشن به guild، `visibleReplies:
"message_tool"`، `ackReaction: "👀"`، و واکنش‌های وضعیت صریح پیکربندی می‌کند. oracle پیام triggerکنندهٔ واقعی Discord را poll می‌کند و sequence مشاهده‌شدهٔ `👀 -> 🤔 -> 👍` را انتظار دارد. artifactها شامل `discord-qa-reaction-timelines.json`، `discord-status-reactions-tool-only-timeline.html`، و `discord-status-reactions-tool-only-timeline.png` هستند.

## قطعه‌های موجود QA

Mantis باید به‌جای شروع از صفر، روی پشتهٔ خصوصی QA موجود ساخته شود:

- `pnpm openclaw qa discord` از قبل یک مسیر زندهٔ Discord را با botهای driver و SUT اجرا می‌کند.
- runner مربوط به transport زنده از قبل گزارش‌ها و artifactهای observed-message را زیر `.artifacts/qa-e2e/` می‌نویسد.
- leaseهای credential در Convex از قبل دسترسی انحصاری به credentialهای transport زندهٔ مشترک را فراهم می‌کنند.
- سرویس کنترل مرورگر از قبل از screenshotها، snapshotها، profileهای مدیریت‌شدهٔ headless، و profileهای CDP راه‌دور پشتیبانی می‌کند.
- QA Lab از قبل یک رابط کاربری debugger و bus برای تست‌هایی با شکل transport دارد.

نخستین پیاده‌سازی Mantis می‌تواند یک runner نازک قبل/بعد روی این قطعه‌ها، به‌علاوهٔ یک لایهٔ شواهد دیداری باشد.

## مدل شواهد

هر اجرا یک دایرکتوری artifact پایدار می‌نویسد:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-summary.json
  baseline/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  candidate/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  comparison.json
  run.log
```

`mantis-summary.json` باید منبع حقیقت machine-readable باشد. گزارش Markdown برای دیدگاه‌های PR و review انسانی است.

summary باید شامل این موارد باشد:

- refها و SHAهای تست‌شده
- transport و شناسهٔ سناریو
- provider ماشین و شناسهٔ ماشین یا شناسهٔ lease
- منبع credential بدون مقادیر secret
- نتیجهٔ baseline
- نتیجهٔ candidate
- اینکه آیا باگ روی baseline بازتولید شد یا نه
- اینکه آیا candidate آن را اصلاح کرد یا نه
- مسیرهای artifact
- مشکلات setup یا cleanup پاک‌سازی‌شده

screenshotها شواهد هستند، نه secret. بااین‌حال همچنان به انضباط redaction نیاز دارند: نام کانال‌های خصوصی، نام کاربران، یا محتوای پیام ممکن است ظاهر شود. برای PRهای عمومی، تا زمانی که داستان redaction قوی‌تر شود، linkهای artifact در GitHub Actions را به imageهای inline ترجیح دهید.

## مرورگر و VNC

مسیر مرورگر دو حالت دارد:

- **خودکارسازی headless**: پیش‌فرض برای CI. Chrome با CDP فعال اجرا می‌شود، و Playwright یا کنترل مرورگر OpenClaw screenshotها را ثبت می‌کند.
- **نجات با VNC**: روی همان VM فعال می‌شود وقتی ورود، MFA، ضدخودکارسازی Discord، یا اشکال‌زدایی دیداری به انسان نیاز دارد.

پروفایل مرورگر ناظر Discord باید آن‌قدر پایدار باشد که برای هر اجرا نیاز به ورود دوباره نباشد، اما از وضعیت مرورگر شخصی جدا باشد. یک پروفایل به استخر ماشین Mantis تعلق دارد، نه به لپ‌تاپ یک توسعه‌دهنده.

وقتی Mantis گیر می‌کند، یک پیام وضعیت Discord ارسال می‌کند که شامل این موارد است:

- شناسه اجرا
- شناسه سناریو
- ارائه‌دهنده ماشین
- دایرکتوری آرتیفکت
- دستورالعمل‌های اتصال VNC یا noVNC در صورت وجود
- متن کوتاه مانع

اولین استقرار خصوصی می‌تواند این پیام‌ها را در کانال فعلی اپراتورها ارسال کند و بعدا به یک کانال اختصاصی Mantis منتقل شود.

## ماشین‌ها

Mantis باید برای اولین پیاده‌سازی راه‌دور، AWS از طریق Crabbox را ترجیح دهد. Crabbox ماشین‌های آماده، رهگیری اجاره، آماده‌سازی، لاگ‌ها، نتایج و پاک‌سازی را در اختیار ما می‌گذارد. اگر ظرفیت AWS بیش از حد کند یا ناموجود بود، یک ارائه‌دهنده Hetzner پشت همان رابط ماشین اضافه کنید.

حداقل نیازمندی‌های VM:

- Linux با نصب Chrome یا Chromium که قابلیت دسکتاپ داشته باشد
- دسترسی CDP برای خودکارسازی مرورگر
- VNC یا noVNC برای بازیابی
- Node 22 و pnpm
- checkout از OpenClaw و کش وابستگی‌ها
- کش مرورگر Playwright Chromium وقتی از Playwright استفاده می‌شود
- CPU و حافظه کافی برای یک OpenClaw Gateway، یک مرورگر، و یک اجرای مدل
- دسترسی خروجی به Discord، GitHub، ارائه‌دهندگان مدل، و کارگزار اعتبارنامه

VM نباید رازهای خام بلندمدت را بیرون از مخزن‌های مورد انتظار اعتبارنامه یا پروفایل مرورگر نگه دارد.

## رازها

رازها برای اجراهای راه‌دور در رازهای سازمان یا مخزن GitHub، و برای اجراهای محلی در یک فایل راز محلی تحت کنترل اپراتور نگهداری می‌شوند.

نام‌های پیشنهادی رازها:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` برای بارگذاری آرتیفکت‌های عمومی GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

در بلندمدت، استخر اعتبارنامه Convex باید منبع عادی برای اعتبارنامه‌های انتقال زنده باقی بماند. رازهای GitHub کارگزار و مسیرهای fallback را راه‌اندازی اولیه می‌کنند. گردش‌کار واکنش‌های وضعیت Discord رازهای Mantis Crabbox را دوباره به متغیرهای محیطی `CRABBOX_COORDINATOR` و `CRABBOX_COORDINATOR_TOKEN` که CLI مربوط به Crabbox انتظار دارد نگاشت می‌کند. نام‌های ساده راز GitHub با الگوی `CRABBOX_*` همچنان به‌عنوان fallback سازگاری پذیرفته می‌شوند.

اجراکننده Mantis هرگز نباید این موارد را چاپ کند:

- توکن‌های ربات Discord
- کلیدهای API ارائه‌دهنده
- کوکی‌های مرورگر
- محتوای پروفایل احراز هویت
- گذرواژه‌های VNC
- payloadهای خام اعتبارنامه

بارگذاری آرتیفکت‌های عمومی باید فراداده هدف Discord مانند شناسه‌های ربات، guild، کانال و پیام را نیز حذف کند. گردش‌کار smoke در GitHub به همین دلیل `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` را فعال می‌کند.

اگر یک توکن تصادفا در issue، PR، چت یا لاگ چسبانده شد، پس از ذخیره شدن راز جدید، آن را چرخش دهید.

## آرتیفکت‌های GitHub و دیدگاه‌های PR

گردش‌کارهای Mantis باید بسته کامل شواهد را به‌عنوان یک آرتیفکت کوتاه‌مدت Actions بارگذاری کنند. وقتی گردش‌کار برای یک گزارش باگ یا PR اصلاح اجرا می‌شود، باید اسکرین‌شات‌های PNG حذف‌اطلاعات‌شده را نیز در شاخه `qa-artifacts` منتشر کند و روی همان باگ یا PR اصلاح، یک دیدگاه با اسکرین‌شات‌های درون‌خطی قبل/بعد درج یا به‌روزرسانی کند. اثبات اصلی را فقط روی یک PR عمومی خودکارسازی QA منتشر نکنید. لاگ‌های خام، پیام‌های مشاهده‌شده و شواهد حجیم دیگر در آرتیفکت Actions باقی می‌مانند.

گردش‌کارهای تولیدی باید این دیدگاه‌ها را با Mantis GitHub App ارسال کنند، نه با `github-actions[bot]`. شناسه app و کلید خصوصی را به‌عنوان رازهای GitHub Actions با نام‌های `MANTIS_GITHUB_APP_ID` و `MANTIS_GITHUB_APP_PRIVATE_KEY` ذخیره کنید. گردش‌کار از یک marker پنهان به‌عنوان کلید upsert استفاده می‌کند، وقتی توکن بتواند آن را ویرایش کند همان دیدگاه را به‌روزرسانی می‌کند، و وقتی marker قدیمی متعلق به ربات قابل ویرایش نیست یک دیدگاه جدید متعلق به Mantis می‌سازد.

دیدگاه PR باید کوتاه و تصویری باشد:

```md
Mantis Discord Status Reactions QA

Summary: Mantis reran the reported Discord status-reaction bug against the known
bad baseline and the candidate fix. The baseline reproduced the bug, while the
candidate showed the expected queued -> thinking -> done sequence.

- Scenario: `discord-status-reactions-tool-only`
- Run: <workflow run link>
- Artifact: <artifact link>
- Baseline: `<status>` at `<sha>`
- Candidate: `<status>` at `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

وقتی اجرا به‌دلیل شکست harness ناموفق می‌شود، دیدگاه باید همین را بگوید و القا نکند که candidate شکست خورده است.

## یادداشت‌های استقرار خصوصی

یک استقرار خصوصی ممکن است از قبل یک برنامه Discord برای Mantis داشته باشد. وقتی آن برنامه مجوزهای درست ربات را دارد و می‌توان آن را با ایمنی چرخش داد، به‌جای ساختن یک app دیگر، همان برنامه را دوباره استفاده کنید.

کانال اولیه اعلان اپراتور را از طریق رازها یا پیکربندی استقرار تنظیم کنید. این کانال ابتدا می‌تواند به یک کانال فعلی نگه‌دارندگان یا عملیات اشاره کند، سپس پس از ایجاد کانال اختصاصی Mantis به آن منتقل شود.

شناسه‌های guild، شناسه‌های کانال، توکن‌های ربات، کوکی‌های مرورگر یا گذرواژه‌های VNC را در این سند قرار ندهید. آن‌ها را در رازهای GitHub، کارگزار اعتبارنامه، یا مخزن راز محلی اپراتور ذخیره کنید.

## افزودن یک سناریو

یک سناریوی Mantis باید این موارد را اعلان کند:

- شناسه و عنوان
- انتقال
- اعتبارنامه‌های موردنیاز
- سیاست ref خط مبنا
- سیاست ref candidate
- patch پیکربندی OpenClaw
- مراحل راه‌اندازی
- محرک
- oracle مورد انتظار خط مبنا
- oracle مورد انتظار candidate
- هدف‌های ثبت بصری
- بودجه timeout
- مراحل پاک‌سازی

سناریوها باید oracleهای کوچک و typed را ترجیح دهند:

- وضعیت واکنش Discord برای باگ‌های واکنش
- ارجاع‌های پیام Discord برای باگ‌های threading
- thread ts و وضعیت API واکنش Slack برای باگ‌های Slack
- شناسه‌ها و headerهای پیام ایمیل برای باگ‌های ایمیل
- اسکرین‌شات‌های مرورگر وقتی UI تنها مشاهده‌پذیر قابل‌اعتماد است

بررسی‌های بینایی باید افزایشی باشند. اگر یک API پلتفرم می‌تواند باگ را اثبات کند، از API به‌عنوان oracle قبولی/شکست استفاده کنید و اسکرین‌شات‌ها را برای اطمینان انسانی نگه دارید.

## گسترش ارائه‌دهنده

پس از Discord، همان اجراکننده می‌تواند این موارد را اضافه کند:

- Slack: واکنش‌ها، threadها، اشاره به app، modalها، بارگذاری فایل.
- ایمیل: احراز هویت Gmail و threading پیام با استفاده از `gog` در جاهایی که connectorها کافی نیستند.
- WhatsApp: ورود QR، شناسایی دوباره، تحویل پیام، رسانه، واکنش‌ها.
- Telegram: دروازه‌بانی mention گروه، commandها، واکنش‌ها در صورت وجود.
- Matrix: roomهای رمزنگاری‌شده، رابطه‌های thread یا reply، ازسرگیری پس از restart.

هر انتقال باید یک سناریوی smoke ارزان و یک یا چند سناریوی کلاس باگ داشته باشد. سناریوهای بصری پرهزینه باید opt-in باقی بمانند.

## پرسش‌های باز

- وقتی ربات فعلی Mantis دوباره استفاده می‌شود، کدام ربات Discord باید driver باشد و کدام باید SUT باشد؟
- ورود مرورگر ناظر در فاز اول باید از حساب انسانی Discord، حساب آزمایشی، یا فقط شواهد REST قابل‌خواندن توسط ربات استفاده کند؟
- GitHub چه مدت باید آرتیفکت‌های Mantis را برای PRها نگه دارد؟
- چه زمانی ClawSweeper باید به‌جای انتظار برای command نگه‌دارنده، Mantis را به‌صورت خودکار پیشنهاد کند؟
- آیا اسکرین‌شات‌ها باید پیش از بارگذاری برای PRهای عمومی حذف‌اطلاعات یا برش داده شوند؟
