---
read_when:
    - ساخت یا اجرای تضمین کیفیت بصری زنده برای باگ‌های OpenClaw
    - افزودن راستی‌آزمایی قبل و بعد برای یک درخواست ادغام
    - افزودن سناریوهای انتقال زنده برای Discord، Slack، WhatsApp یا موارد دیگر
    - اشکال‌زدایی اجراهای تضمین کیفیت که به تصاویر صفحه، خودکارسازی مرورگر یا دسترسی VNC نیاز دارند
summary: Mantis سامانهٔ راستی‌آزمایی بصری سرتاسری برای بازتولید باگ‌های OpenClaw روی انتقال‌دهنده‌های زنده، ثبت شواهد قبل و بعد، و پیوست کردن مصنوعات به PRها است.
title: آخوندک
x-i18n:
    generated_at: "2026-05-03T21:30:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3463882b01a7941f6d758c509d6cd70e099aa8352053347fa9c37a80e5b256ce
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis سامانهٔ راستی‌آزمایی سرتاسری OpenClaw برای باگ‌هایی است که به runtime واقعی، انتقال واقعی، و شواهد قابل مشاهده نیاز دارند. این سامانه یک سناریو را در برابر ref بدِ شناخته‌شده اجرا می‌کند، شواهد را ثبت می‌کند، همان سناریو را در برابر ref نامزد اجرا می‌کند، و مقایسه را به‌صورت artifactهایی منتشر می‌کند که maintainer می‌تواند از یک PR یا از یک فرمان محلی بررسی کند.

Mantis با Discord شروع می‌شود چون Discord یک مسیر اولیهٔ باارزش به ما می‌دهد: احراز هویت واقعی bot، کانال‌های واقعی guild، واکنش‌ها، threadها، فرمان‌های بومی، و یک رابط کاربری مرورگر که انسان‌ها می‌توانند در آن به‌صورت بصری تأیید کنند انتقال چه چیزی نشان داده است.

## اهداف

- بازتولید یک باگ از issue یا PR در GitHub با همان شکل انتقالی که کاربران می‌بینند.
- ثبت یک artifact **قبل** روی ref مبنا پیش از اعمال fix.
- ثبت یک artifact **بعد** روی ref نامزد پس از اعمال fix.
- هرجا ممکن است از یک oracle قطعی استفاده شود، مانند خواندن واکنش Discord از طریق REST یا بررسی transcript کانال.
- وقتی باگ سطح UI قابل مشاهده دارد، screenshot ثبت شود.
- اجرای محلی از یک CLI تحت کنترل agent و اجرای راه‌دور از GitHub.
- حفظ مقدار کافی از وضعیت ماشین برای نجات با VNC وقتی ورود، خودکارسازی مرورگر، یا احراز هویت provider گیر می‌کند.
- ارسال وضعیت کوتاه به یک کانال Discord عملیاتی وقتی اجرا مسدود شده، به کمک دستی VNC نیاز دارد، یا تمام می‌شود.

## غیرهدف‌ها

- Mantis جایگزین تست‌های واحد نیست. اجرای Mantis معمولاً باید پس از فهمیدن fix به یک تست regression کوچک‌تر تبدیل شود.
- Mantis gate سریع و معمول CI نیست. کندتر است، از credentialهای زنده استفاده می‌کند، و برای باگ‌هایی رزرو شده که محیط زنده در آن‌ها اهمیت دارد.
- Mantis نباید برای عملکرد معمول به انسان نیاز داشته باشد. VNC دستی مسیر نجات است، نه مسیر مطلوب.
- Mantis secretهای خام را در artifactها، logها، screenshotها، گزارش‌های Markdown، یا commentهای PR ذخیره نمی‌کند.

## مالکیت

Mantis در پشتهٔ QA OpenClaw قرار دارد.

- OpenClaw مالک runtime سناریو، adapterهای انتقال، schema شواهد، و CLI محلی زیر `pnpm openclaw qa mantis` است.
- QA Lab مالک قطعات harness انتقال زنده، helperهای ثبت مرورگر، و writerهای artifact است.
- Crabbox مالک ماشین‌های Linux گرم‌شده وقتی VM راه‌دور لازم است.
- GitHub Actions مالک نقطهٔ ورود workflow راه‌دور و نگهداری artifact است.
- ClawSweeper مالک مسیریابی commentهای GitHub است: parse کردن فرمان‌های maintainer، dispatch کردن workflow، و ارسال comment نهایی PR.
- agentهای OpenClaw وقتی یک سناریو به setup عاملی، debugging، یا گزارش وضعیت گیرکرده نیاز دارد، Mantis را از طریق Codex هدایت می‌کنند.

این مرز، دانش انتقال را در OpenClaw، زمان‌بندی ماشین را در Crabbox، و glue مربوط به workflow maintainer را در ClawSweeper نگه می‌دارد.

## شکل فرمان

اولین فرمان محلی bot Discord، guild، کانال، ارسال پیام، ارسال واکنش، و مسیر artifact را راستی‌آزمایی می‌کند:

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

runner در زیر پوشهٔ خروجی worktreeهای detached برای مبنا و نامزد ایجاد می‌کند، dependencyها را نصب می‌کند، هر ref را build می‌کند، سناریو را با `--allow-failures` اجرا می‌کند، سپس `baseline/`، `candidate/`، `comparison.json`، و `mantis-report.md` را می‌نویسد. برای اولین سناریوی Discord، راستی‌آزمایی موفق یعنی وضعیت مبنا `fail` و وضعیت نامزد `pass` است.

workflow دود GitHub با نام `Mantis Discord Smoke` است. workflow قبل و بعد GitHub برای اولین سناریوی واقعی `Mantis Discord Status Reactions` است. این موارد را می‌پذیرد:

- `baseline_ref`: ref که انتظار می‌رود رفتار فقط queued را بازتولید کند.
- `candidate_ref`: ref که انتظار می‌رود `queued -> thinking -> done` را نشان دهد.

این workflow، ref مربوط به harness workflow را checkout می‌کند، worktreeهای جداگانهٔ مبنا و نامزد را build می‌کند، `discord-status-reactions-tool-only` را در برابر هر worktree اجرا می‌کند، و `baseline/`، `candidate/`، `comparison.json`، و `mantis-report.md` را به‌عنوان artifactهای Actions upload می‌کند.

همچنین می‌توانید اجرای status-reactions را مستقیماً از یک comment روی PR trigger کنید:

```text
@Mantis discord status reactions
```

trigger comment عمداً محدود است. فقط روی commentهای pull request از کاربرانی اجرا می‌شود که دسترسی write، maintain، یا admin دارند، و فقط درخواست‌های واکنش وضعیت Discord را تشخیص می‌دهد. به‌صورت پیش‌فرض از ref مبنای بدِ شناخته‌شده و SHA مربوط به head فعلی PR به‌عنوان نامزد استفاده می‌کند. maintainerها می‌توانند هرکدام از refها را override کنند:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

نمونه فرمان‌های ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

فرمان اول صریح و متمرکز بر سناریو است. فرمان دوم بعداً می‌تواند یک PR یا issue را بر اساس labelها، فایل‌های تغییرکرده، و یافته‌های review در ClawSweeper به سناریوهای پیشنهادی Mantis نگاشت کند.

## چرخهٔ اجرای Run

1. دریافت credentialها.
2. تخصیص یا استفادهٔ دوباره از یک VM.
3. آماده‌سازی checkout تمیز برای ref مبنا.
4. نصب dependencyها و build فقط آنچه سناریو نیاز دارد.
5. شروع یک OpenClaw Gateway فرزند با پوشهٔ وضعیت ایزوله.
6. پیکربندی انتقال زنده، provider، model، و profile مرورگر.
7. اجرای سناریو و ثبت شواهد مبنا.
8. توقف Gateway و حفظ logها.
9. آماده‌سازی ref نامزد در همان VM.
10. اجرای همان سناریو و ثبت شواهد نامزد.
11. مقایسهٔ نتایج oracle و شواهد بصری.
12. نوشتن Markdown، JSON، logها، screenshotها، و artifactهای trace اختیاری.
13. upload کردن artifactهای GitHub Actions.
14. ارسال یک پیام وضعیت کوتاه در PR یا Discord.

سناریو باید بتواند به دو شکل متفاوت fail شود:

- **بازتولید باگ**: مبنا به شکل مورد انتظار fail شد.
- **خرابی harness**: setup محیط، credentialها، API Discord، مرورگر، یا provider پیش از معنادار شدن oracle باگ fail شد.

گزارش نهایی باید این حالت‌ها را جدا کند تا maintainerها یک محیط ناپایدار را با رفتار محصول اشتباه نگیرند.

## MVP Discord

اولین سناریو باید واکنش‌های وضعیت Discord را در کانال‌های guild هدف بگیرد، جایی که حالت تحویل پاسخ source برابر `message_tool_only` است.

چرا seed خوبی برای Mantis است:

- به‌صورت واکنش روی پیام triggerکننده در Discord قابل مشاهده است.
- از طریق وضعیت واکنش پیام Discord یک oracle قوی REST دارد.
- یک OpenClaw Gateway واقعی، احراز هویت bot در Discord، dispatch پیام، حالت تحویل پاسخ source، وضعیت واکنش status، و چرخهٔ turn مدل را exercise می‌کند.
- آن‌قدر محدود است که اولین پیاده‌سازی را دقیق نگه دارد.

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

شواهد مبنا باید واکنش acknowledgement مربوط به queued را نشان دهد اما در حالت tool-only هیچ گذار lifecycle نشان ندهد. شواهد نامزد باید نشان دهد وقتی `messages.statusReactions.enabled` صراحتاً true است، واکنش‌های status مربوط به lifecycle اجرا می‌شوند.

اولین برش اجرایی، سناریوی QA زندهٔ opt-in در Discord است:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

این SUT را با مدیریت guild همیشه روشن، `visibleReplies:
"message_tool"`، `ackReaction: "👀"`، و واکنش‌های status صریح پیکربندی می‌کند. oracle پیام triggerکنندهٔ واقعی Discord را poll می‌کند و انتظار sequence مشاهده‌شدهٔ `👀 -> 🤔 -> 👍` را دارد. artifactها شامل `discord-qa-reaction-timelines.json`، `discord-status-reactions-tool-only-timeline.html`، و `discord-status-reactions-tool-only-timeline.png` هستند.

## قطعات QA موجود

Mantis باید به‌جای شروع از صفر، بر پایهٔ پشتهٔ خصوصی QA موجود ساخته شود:

- `pnpm openclaw qa discord` هم‌اکنون یک lane زندهٔ Discord را با botهای driver و SUT اجرا می‌کند.
- runner انتقال زنده هم‌اکنون گزارش‌ها و artifactهای پیام مشاهده‌شده را زیر `.artifacts/qa-e2e/` می‌نویسد.
- leaseهای credential در Convex هم‌اکنون دسترسی اختصاصی به credentialهای انتقال زندهٔ مشترک را فراهم می‌کنند.
- سرویس کنترل مرورگر هم‌اکنون از screenshotها، snapshotها، profileهای مدیریت‌شدهٔ headless، و profileهای CDP راه‌دور پشتیبانی می‌کند.
- QA Lab هم‌اکنون یک UI debugger و bus برای تست‌های با شکل انتقال دارد.

اولین پیاده‌سازی Mantis می‌تواند یک runner نازک قبل/بعد روی این قطعات، به‌همراه یک لایهٔ شواهد بصری باشد.

## مدل شواهد

هر run یک پوشهٔ artifact پایدار می‌نویسد:

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

`mantis-summary.json` باید منبع حقیقت قابل‌خواندن توسط ماشین باشد. گزارش Markdown برای commentهای PR و review انسانی است.

summary باید شامل این موارد باشد:

- refها و SHAهای تست‌شده
- انتقال و scenario id
- provider ماشین و machine id یا lease id
- منبع credential بدون مقادیر secret
- نتیجهٔ مبنا
- نتیجهٔ نامزد
- اینکه آیا باگ روی مبنا بازتولید شد یا نه
- اینکه آیا نامزد آن را fix کرد یا نه
- مسیرهای artifact
- مسائل sanitized مربوط به setup یا cleanup

screenshotها شواهد هستند، نه secret. بااین‌حال همچنان به انضباط redaction نیاز دارند: نام کانال‌های خصوصی، نام کاربران، یا محتوای پیام ممکن است ظاهر شود. برای PRهای عمومی، تا زمانی که داستان redaction قوی‌تر شود، لینک‌های artifact در GitHub Actions را به تصویرهای inline ترجیح دهید.

## مرورگر و VNC

lane مرورگر دو حالت دارد:

- **خودکارسازی headless**: پیش‌فرض برای CI. Chrome با CDP فعال اجرا می‌شود، و Playwright یا کنترل مرورگر OpenClaw screenshot ثبت می‌کند.
- **نجات VNC**: روی همان VM فعال می‌شود وقتی ورود، MFA، ضدخودکارسازی Discord، یا debugging بصری به انسان نیاز دارد.

profile مرورگر ناظر Discord باید به‌اندازهٔ کافی persistent باشد تا برای هر run نیازی به ورود نباشد، اما از وضعیت مرورگر شخصی ایزوله باشد. یک profile متعلق به pool ماشین Mantis است، نه لپ‌تاپ توسعه‌دهنده.

وقتی Mantis گیر می‌کند، یک پیام وضعیت Discord با این موارد ارسال می‌کند:

- run id
- scenario id
- provider ماشین
- پوشهٔ artifact
- دستورالعمل‌های اتصال VNC یا noVNC در صورت موجود بودن
- متن کوتاه blocker

اولین deployment خصوصی می‌تواند این پیام‌ها را به کانال عملیاتی موجود ارسال کند و بعداً به یک کانال اختصاصی Mantis منتقل شود.

## ماشین‌ها

Mantis باید برای اولین پیاده‌سازی راه‌دور، AWS از طریق Crabbox را ترجیح دهد. Crabbox ماشین‌های گرم‌شده، ردیابی lease، hydration، logها، نتایج، و cleanup را به ما می‌دهد. اگر ظرفیت AWS بیش از حد کند یا ناموجود باشد، یک provider Hetzner پشت همان interface ماشین اضافه کنید.

حداقل نیازمندی‌های VM:

- Linux با نصب Chrome یا Chromium مناسب desktop
- دسترسی CDP برای خودکارسازی مرورگر
- VNC یا noVNC برای نجات
- Node 22 و pnpm
- checkout از OpenClaw و cache dependencyها
- cache مرورگر Chromium در Playwright وقتی از Playwright استفاده می‌شود
- CPU و memory کافی برای یک OpenClaw Gateway، یک مرورگر، و یک اجرای مدل
- دسترسی outbound به Discord، GitHub، providerهای مدل، و broker credential

VM نباید secretهای خام بلندمدت را خارج از storeهای مورد انتظار credential یا profile مرورگر نگه دارد.

## Secretها

Secretها برای runهای راه‌دور در secretهای سازمان یا repository در GitHub قرار می‌گیرند، و برای runهای محلی در یک فایل secret محلی تحت کنترل operator قرار دارند.

نام‌های پیشنهادی secret:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` برای بارگذاری آرتیفکت‌های عمومی GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`

در بلندمدت، استخر اعتبارنامه‌های Convex باید منبع عادی اعتبارنامه‌های
حمل‌ونقل زنده باقی بماند. اسرار GitHub کارگزار و مسیرهای جایگزین را راه‌اندازی می‌کنند.

رانر Mantis هرگز نباید این موارد را چاپ کند:

- توکن‌های بات Discord
- کلیدهای API ارائه‌دهنده
- کوکی‌های مرورگر
- محتوای پروفایل احراز هویت
- رمزهای عبور VNC
- بارهای خام اعتبارنامه

بارگذاری آرتیفکت‌های عمومی همچنین باید فراداده مقصد Discord، مانند شناسه‌های بات،
گیلد، کانال و پیام را حذف کند. جریان کاری اسموک GitHub به همین دلیل
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` را فعال می‌کند.

اگر توکنی به‌طور تصادفی در یک مسئله، PR، گفت‌وگو یا لاگ چسبانده شد، پس از ذخیره
شدن secret جدید، آن را بچرخانید.

## آرتیفکت‌های GitHub و دیدگاه‌های PR

جریان‌های کاری Mantis باید بسته کامل شواهد را به‌عنوان یک آرتیفکت کوتاه‌عمر Actions
بارگذاری کنند. وقتی جریان کاری برای یک گزارش باگ یا PR رفع اجرا می‌شود، باید
اسکرین‌شات‌های PNG حذف‌سازی‌شده را نیز در شاخه `qa-artifacts` منتشر کند و یک
دیدگاه را در همان باگ یا PR رفع با اسکرین‌شات‌های درون‌خطی قبل/بعد درج یا به‌روزرسانی کند. اثبات
اصلی را فقط در یک PR عمومی خودکارسازی QA منتشر نکنید. لاگ‌های خام، پیام‌های
مشاهده‌شده و سایر شواهد حجیم در آرتیفکت Actions می‌مانند.

جریان‌های کاری تولید باید آن دیدگاه‌ها را با Mantis GitHub App منتشر کنند، نه
با `github-actions[bot]`. شناسه برنامه و کلید خصوصی را به‌عنوان secretهای
GitHub Actions با نام‌های `MANTIS_GITHUB_APP_ID` و `MANTIS_GITHUB_APP_PRIVATE_KEY`
ذخیره کنید. جریان کاری از یک نشانگر پنهان به‌عنوان کلید درج یا به‌روزرسانی استفاده می‌کند، وقتی
توکن بتواند آن را ویرایش کند همان دیدگاه را به‌روزرسانی می‌کند، و وقتی
نشانگر قدیمی متعلق به بات قابل ویرایش نباشد یک دیدگاه جدید متعلق به Mantis می‌سازد.

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

وقتی اجرا به‌دلیل شکست هارنس ناموفق می‌شود، دیدگاه باید همین را بگوید،
نه اینکه القا کند کاندید شکست خورده است.

## یادداشت‌های استقرار خصوصی

یک استقرار خصوصی ممکن است از قبل یک برنامه Discord برای Mantis داشته باشد. وقتی آن برنامه
مجوزهای بات درست را دارد و می‌تواند به‌صورت ایمن چرخانده شود، همان را به‌جای ساختن برنامه‌ای دیگر
دوباره استفاده کنید.

کانال اولیه اعلان اپراتور را از طریق secretها یا پیکربندی استقرار تنظیم کنید.
ابتدا می‌تواند به یک کانال موجود نگه‌دارنده یا عملیات اشاره کند، سپس وقتی کانال
اختصاصی Mantis ایجاد شد به آن منتقل شود.

شناسه‌های گیلد، شناسه‌های کانال، توکن‌های بات، کوکی‌های مرورگر یا رمزهای عبور VNC را
در این سند قرار ندهید. آن‌ها را در secretهای GitHub، کارگزار اعتبارنامه، یا
ذخیره‌گاه secret محلی اپراتور نگه دارید.

## افزودن سناریو

یک سناریوی Mantis باید این موارد را اعلام کند:

- شناسه و عنوان
- حمل‌ونقل
- اعتبارنامه‌های لازم
- سیاست ارجاع خط مبنا
- سیاست ارجاع کاندید
- وصله پیکربندی OpenClaw
- مراحل راه‌اندازی
- محرک
- اوراکل خط مبنای مورد انتظار
- اوراکل کاندید مورد انتظار
- اهداف ثبت تصویری
- بودجه زمانی
- مراحل پاک‌سازی

سناریوها باید اوراکل‌های کوچک و نوع‌دار را ترجیح دهند:

- وضعیت واکنش Discord برای باگ‌های واکنش
- ارجاع‌های پیام Discord برای باگ‌های رشته‌بندی
- وضعیت API واکنش و ts رشته Slack برای باگ‌های Slack
- شناسه‌های پیام ایمیل و سرآیندها برای باگ‌های ایمیل
- اسکرین‌شات‌های مرورگر وقتی UI تنها مشاهده‌پذیر قابل اتکا است

بررسی‌های بینایی باید افزایشی باشند. اگر API پلتفرم بتواند باگ را اثبات کند، از
API به‌عنوان اوراکل قبولی/شکست استفاده کنید و اسکرین‌شات‌ها را برای اطمینان انسانی نگه دارید.

## گسترش ارائه‌دهنده

پس از Discord، همان رانر می‌تواند این موارد را اضافه کند:

- Slack: واکنش‌ها، رشته‌ها، اشاره به برنامه، مودال‌ها، بارگذاری فایل.
- ایمیل: احراز هویت Gmail و رشته‌بندی پیام با استفاده از `gog` در جاهایی که کانکتورها کافی نیستند.
- WhatsApp: ورود با QR، شناسایی دوباره، تحویل پیام، رسانه، واکنش‌ها.
- Telegram: گیت‌کردن اشاره گروهی، فرمان‌ها، واکنش‌ها در صورت موجود بودن.
- Matrix: اتاق‌های رمزگذاری‌شده، روابط رشته یا پاسخ، ازسرگیری پس از راه‌اندازی مجدد.

هر حمل‌ونقل باید یک سناریوی اسموک ارزان و یک یا چند سناریوی کلاس باگ داشته باشد.
سناریوهای تصویری پرهزینه باید اختیاری باقی بمانند.

## پرسش‌های باز

- وقتی بات موجود Mantis دوباره استفاده می‌شود، کدام بات Discord باید درایور باشد و کدام باید SUT باشد؟
- ورود مرورگر ناظر باید از حساب انسانی Discord، حساب آزمایشی، یا فقط شواهد REST خواندنی برای بات در مرحله اول استفاده کند؟
- GitHub تا چه مدت باید آرتیفکت‌های Mantis را برای PRها نگه دارد؟
- چه زمانی ClawSweeper باید به‌جای انتظار برای فرمان نگه‌دارنده، به‌طور خودکار Mantis را توصیه کند؟
- آیا اسکرین‌شات‌ها باید پیش از بارگذاری برای PRهای عمومی حذف‌سازی یا برش داده شوند؟
