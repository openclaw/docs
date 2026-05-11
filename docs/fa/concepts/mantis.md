---
read_when:
    - ساخت یا اجرای تضمین کیفیت بصری زنده برای باگ‌های OpenClaw
    - افزودن راستی‌آزمایی قبل و بعد برای یک درخواست ادغام
    - افزودن سناریوهای انتقال زنده Discord، Slack، WhatsApp یا موارد دیگر
    - اشکال‌زدایی اجراهای QA که به اسکرین‌شات، خودکارسازی مرورگر یا دسترسی VNC نیاز دارند
summary: Mantis سامانهٔ راستی‌آزمایی بصری سرتاسری برای بازتولید باگ‌های OpenClaw روی ترنسپورت‌های زنده، ثبت شواهد قبل و بعد، و پیوست‌کردن آرتیفکت‌ها به PRها است.
title: آخوندک
x-i18n:
    generated_at: "2026-05-11T20:30:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 465ed7c994e8821fc64ca46a58de46cbec8b4ba687862b00398f7b0d22d62b44
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis سامانهٔ راستی‌آزمایی سرتاسری OpenClaw برای باگ‌هایی است که به یک زمان اجرای واقعی، یک انتقال واقعی، و اثبات قابل مشاهده نیاز دارند. این سامانه یک سناریو را روی یک ref بد شناخته‌شده اجرا می‌کند، شواهد را ثبت می‌کند، همان سناریو را روی یک ref نامزد اجرا می‌کند، و مقایسه را به‌صورت مصنوعاتی منتشر می‌کند که نگه‌دارنده بتواند از یک PR یا از یک فرمان محلی بررسی کند.

Mantis با Discord شروع می‌کند چون Discord یک مسیر نخستین ارزشمند به ما می‌دهد: احراز هویت واقعی ربات، کانال‌های واقعی guild، واکنش‌ها، threadها، فرمان‌های بومی، و یک رابط کاربری مرورگر که انسان‌ها می‌توانند در آن به‌صورت بصری تأیید کنند انتقال چه چیزی نشان داده است.

## اهداف

- بازتولید یک باگ از یک issue یا PR در GitHub با همان شکل انتقالی که کاربران می‌بینند.
- ثبت یک مصنوع **قبل** روی ref مبنا پیش از اعمال اصلاح.
- ثبت یک مصنوع **بعد** روی ref نامزد پس از اعمال اصلاح.
- استفاده از یک داور قطعی هر زمان که ممکن باشد، مانند خواندن واکنش با Discord REST یا بررسی رونوشت کانال.
- ثبت نماگرفت‌ها وقتی باگ سطح رابط کاربری قابل مشاهده دارد.
- اجرا به‌صورت محلی از یک CLI کنترل‌شده توسط عامل و به‌صورت راه دور از GitHub.
- حفظ وضعیت کافی ماشین برای نجات با VNC وقتی ورود، خودکارسازی مرورگر، یا احراز هویت ارائه‌دهنده گیر می‌کند.
- ارسال وضعیت کوتاه به یک کانال Discord اپراتور وقتی اجرا مسدود شده، به کمک دستی VNC نیاز دارد، یا تمام می‌شود.

## غیرهدف‌ها

- Mantis جایگزین تست‌های واحد نیست. اجرای Mantis معمولاً باید پس از فهمیدن اصلاح، به یک تست رگرسیون کوچک‌تر تبدیل شود.
- Mantis گیت سریع معمول CI نیست. کندتر است، از اعتبارنامه‌های زنده استفاده می‌کند، و برای باگ‌هایی نگه داشته می‌شود که محیط زنده در آن‌ها اهمیت دارد.
- Mantis نباید برای کارکرد عادی به انسان نیاز داشته باشد. VNC دستی مسیر نجات است، نه مسیر مطلوب.
- Mantis رازهای خام را در مصنوعات، لاگ‌ها، نماگرفت‌ها، گزارش‌های Markdown، یا نظرهای PR ذخیره نمی‌کند.

## مالکیت

Mantis در پشتهٔ QA OpenClaw قرار دارد.

- OpenClaw مالک زمان اجرای سناریو، آداپتورهای انتقال، شِمای شواهد، و CLI محلی زیر `pnpm openclaw qa mantis` است.
- QA Lab مالک قطعات harness انتقال زنده، کمک‌کننده‌های ثبت مرورگر، و نویسنده‌های مصنوع است.
- Crabbox وقتی به VM راه دور نیاز باشد، مالک ماشین‌های Linux گرم‌شده است.
- GitHub Actions مالک نقطهٔ ورود گردش‌کار راه دور و نگه‌داری مصنوع است.
- ClawSweeper مالک مسیریابی نظر GitHub است: پردازش فرمان‌های نگه‌دارنده، dispatch کردن گردش‌کار، و ارسال نظر نهایی PR.
- عامل‌های OpenClaw وقتی یک سناریو به آماده‌سازی عاملی، اشکال‌زدایی، یا گزارش وضعیت گیرکرده نیاز دارد، Mantis را از طریق Codex هدایت می‌کنند.

این مرز، دانش انتقال را در OpenClaw، زمان‌بندی ماشین را در Crabbox، و چسب گردش‌کار نگه‌دارنده را در ClawSweeper نگه می‌دارد.

## شکل فرمان

نخستین فرمان محلی، ربات Discord، guild، کانال، ارسال پیام، ارسال واکنش، و مسیر مصنوع را راستی‌آزمایی می‌کند:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

اجراکنندهٔ محلی قبل و بعد این شکل را می‌پذیرد:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

اجراکننده worktreeهای جداشدهٔ مبنا و نامزد را زیر دایرکتوری خروجی می‌سازد، وابستگی‌ها را نصب می‌کند، هر ref را می‌سازد، سناریو را با `--allow-failures` اجرا می‌کند، سپس `baseline/`، `candidate/`، `comparison.json`، و `mantis-report.md` را می‌نویسد. برای نخستین سناریوی Discord، راستی‌آزمایی موفق یعنی وضعیت مبنا `fail` و وضعیت نامزد `pass` است.

دومین کاوشگر قبل/بعد Discord، پیوست‌های thread را هدف می‌گیرد:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

آن سناریو با ربات راه‌انداز یک پیام والد ارسال می‌کند، یک thread واقعی Discord می‌سازد، کنش `message.thread-reply` در OpenClaw را با یک `filePath` محلیِ مخزن فراخوانی می‌کند، سپس thread را برای پاسخ SUT و نام فایل پیوست poll می‌کند. نماگرفت مبنا پاسخ را بدون پیوست نشان می‌دهد؛ نماگرفت نامزد پیوست مورد انتظار `mantis-thread-report.md` را نشان می‌دهد.

نخستین بدوی VM/مرورگر، smoke دسکتاپ است:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

این فرمان یک ماشین دسکتاپ Crabbox را اجاره یا دوباره استفاده می‌کند، یک مرورگر قابل مشاهده را داخل نشست VNC آغاز می‌کند، دسکتاپ را ثبت می‌کند، مصنوعات را به دایرکتوری خروجی محلی برمی‌گرداند، و فرمان اتصال دوباره را در گزارش می‌نویسد. فرمان به‌صورت پیش‌فرض از ارائه‌دهندهٔ Hetzner استفاده می‌کند چون نخستین ارائه‌دهنده با پوشش دسکتاپ/VNC کارکرده در مسیر Mantis است. هنگام اجرا روی fleet دیگری از Crabbox، آن را با `--provider`، `--crabbox-bin`، یا `OPENCLAW_MANTIS_CRABBOX_PROVIDER` بازنویسی کنید.

پرچم‌های مفید smoke دسکتاپ:

- `--lease-id <cbx_...>` یا `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` از یک دسکتاپ گرم‌شده دوباره استفاده می‌کند.
- `--browser-url <url>` صفحه‌ای را که در مرورگر قابل مشاهده باز می‌شود تغییر می‌دهد.
- `--html-file <path>` یک مصنوع HTML محلیِ مخزن را در مرورگر قابل مشاهده رندر می‌کند. Mantis از این برای ثبت timeline تولیدشدهٔ واکنش وضعیت Discord از طریق یک دسکتاپ واقعی Crabbox استفاده می‌کند.
- `--browser-profile-dir <remote-path>` از یک user-data-dir راه دور Chrome دوباره استفاده می‌کند تا یک دسکتاپ پایدار Mantis بتواند بین اجراها واردشده باقی بماند. از این برای پروفایل نمایشگر بلندمدت Discord Web استفاده کنید.
- `--browser-profile-archive-env <name>` یک آرشیو user-data-dir Chrome با قالب base64 `.tgz` را پیش از اجرای مرورگر از متغیر محیطی نام‌برده بازیابی می‌کند. از این برای شاهدهای واردشده مانند Discord Web استفاده کنید. متغیر محیطی پیش‌فرض `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64` است.
- `--video-duration <seconds>` طول ثبت MP4 را کنترل می‌کند. برای برنامه‌های وب واردشدهٔ کند که برای پایدار شدن به زمان نیاز دارند، از مدت طولانی‌تر استفاده کنید.
- `--keep-lease` یا `OPENCLAW_MANTIS_KEEP_VM=1` یک lease تازه‌ساختهٔ موفق را برای بررسی VNC باز نگه می‌دارد. اجراهای ناموفق وقتی یک lease ساخته شده باشد به‌صورت پیش‌فرض آن را نگه می‌دارند تا اپراتور بتواند دوباره وصل شود.
- `--class`، `--idle-timeout`، و `--ttl` اندازهٔ ماشین و طول عمر lease را تنظیم می‌کنند.

برای شواهد Discord Web، Mantis به‌جای توکن ربات از یک حساب نمایشگر اختصاصی استفاده می‌کند. سناریوی زندهٔ Discord API همچنان داور باقی می‌ماند: thread واقعی را می‌سازد، `thread-reply` مربوط به SUT را می‌فرستد، و پیوست را از طریق Discord REST بررسی می‌کند. وقتی `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` تنظیم شده باشد، سناریو همچنین یک مصنوع URL مربوط به Discord Web می‌نویسد. وقتی `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` تنظیم شده باشد، آن thread را به‌اندازهٔ کافی در دسترس می‌گذارد تا یک مرورگر واردشده بتواند آن را باز و ضبط کند.

گردش‌کار GitHub، URL thread نامزد را در Discord Web باز می‌کند، یک نماگرفت ثبت می‌کند، یک MP4 ضبط می‌کند، و وقتی ابزار رسانه‌ای Crabbox در دسترس باشد یک پیش‌نمایش GIF کوتاه‌شده بر اساس حرکت تولید می‌کند. مسیر پروفایل نمایشگر پایدارِ پیکربندی‌شده از طریق `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` را ترجیح دهید، چون آرشیوهای کامل پروفایل Chrome می‌توانند از محدودیت اندازهٔ secret در GitHub بزرگ‌تر شوند. برای پروفایل‌های کوچک/راه‌اندازی اولیه، گردش‌کار همچنین می‌تواند یک آرشیو base64 `.tgz` را از `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` بازیابی کند. اگر هیچ‌کدام از منابع پروفایل پیکربندی نشده باشند، گردش‌کار همچنان نماگرفت‌های قطعی پیوست مبنا/نامزد را منتشر می‌کند و یک اعلان لاگ می‌کند که شاهد واردشدهٔ Discord Web رد شده است.

نخستین بدوی کامل انتقال دسکتاپ، smoke دسکتاپ Slack است:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

این فرمان یک ماشین دسکتاپ Crabbox را اجاره یا دوباره استفاده می‌کند، checkout فعلی را به VM همگام می‌کند، `pnpm openclaw qa slack` را داخل آن VM اجرا می‌کند، Slack Web را در مرورگر VNC باز می‌کند، دسکتاپ قابل مشاهده را ثبت می‌کند، و هم مصنوعات QA Slack و هم نماگرفت VNC را به دایرکتوری خروجی محلی کپی می‌کند. این نخستین شکل Mantis است که در آن Gateway مربوط به SUT OpenClaw و مرورگر هر دو داخل همان VM دسکتاپ Linux زندگی می‌کنند.

با `--gateway-setup`، فرمان یک خانهٔ OpenClaw دورریختنی پایدار در `$HOME/.openclaw-mantis/slack-openclaw` آماده می‌کند، پیکربندی Slack Socket Mode را برای کانال انتخاب‌شده patch می‌کند، `openclaw gateway run` را روی پورت `38973` آغاز می‌کند، و Chrome را در نشست VNC در حال اجرا نگه می‌دارد. این حالت «یک دسکتاپ Linux با Slack و یک claw در حال اجرا برایم باقی بگذار» است؛ مسیر QA Slack ربات-به-ربات وقتی `--gateway-setup` حذف شده باشد، پیش‌فرض باقی می‌ماند.

ورودی‌های لازم برای `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` برای مسیر مدل راه دور. اگر فقط `OPENAI_API_KEY` به‌صورت محلی تنظیم شده باشد، Mantis پیش از فراخوانی Crabbox آن را به `OPENCLAW_LIVE_OPENAI_KEY` نگاشت می‌کند تا ارسال env با پیشوند `OPENCLAW_*` در Crabbox بتواند آن را به VM ببرد.

با `--gateway-setup --credential-source convex`، Mantis پیش از ساخت VM، اعتبارنامهٔ SUT مربوط به Slack را از مخزن مشترک اجاره می‌کند و شناسهٔ کانال اجاره‌شده، توکن برنامهٔ Socket Mode، و توکن ربات را به‌عنوان env زمان اجرای `OPENCLAW_MANTIS_SLACK_*` داخل دسکتاپ forward می‌کند. این کار گردش‌کارهای GitHub را سبک نگه می‌دارد: آن‌ها فقط به secret کارگزار Convex نیاز دارند، نه توکن‌های خام ربات یا برنامهٔ Slack.

پرچم‌های مفید دسکتاپ Slack:

- `--lease-id <cbx_...>` روی ماشینی دوباره اجرا می‌کند که اپراتور قبلاً از طریق VNC وارد Slack Web شده است.
- `--gateway-setup` به‌جای فقط اجرای مسیر QA ربات-به-ربات، یک Gateway پایدار Slack برای OpenClaw در VM آغاز می‌کند.
- `--keep-lease` پس از موفقیت، VM مربوط به Gateway را برای بررسی VNC باز نگه می‌دارد؛ `--no-keep-lease` پس از جمع‌آوری مصنوعات آن را متوقف می‌کند.
- `--slack-url <url>` یک URL مشخص Slack Web را باز می‌کند. بدون آن، وقتی توکن ربات SUT در دسترس باشد، Mantis مقدار `https://app.slack.com/client/<team>/<channel>` را از `auth.test` مربوط به Slack استخراج می‌کند.
- `--slack-channel-id <id>` allowlist کانال Slack را که توسط راه‌اندازی Gateway استفاده می‌شود کنترل می‌کند.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` پروفایل پایدار Chrome داخل VM را کنترل می‌کند. پیش‌فرض `$HOME/.config/openclaw-mantis/slack-chrome-profile` است، بنابراین ورود دستی Slack Web در اجراهای دوباره روی همان lease باقی می‌ماند.
- `--credential-source convex --credential-role ci` به‌جای توکن‌های مستقیم env برای Slack، از مخزن اعتبارنامهٔ مشترک استفاده می‌کند.
- `--provider-mode`، `--model`، `--alt-model`، و `--fast` به مسیر زندهٔ Slack پاس داده می‌شوند.

گردش‌کار smoke در GitHub، `Mantis Discord Smoke` است. گردش‌کار قبل و بعد GitHub برای نخستین سناریوی واقعی، `Mantis Discord Status Reactions` است. این موارد را می‌پذیرد:

- `baseline_ref`: ref که انتظار می‌رود رفتار فقط-صف‌شده را بازتولید کند.
- `candidate_ref`: ref که انتظار می‌رود `queued -> thinking -> done` را نشان دهد.

این گردش‌کار ref مربوط به harness گردش‌کار را checkout می‌کند، worktreeهای جداگانهٔ مبنا و نامزد را می‌سازد، `discord-status-reactions-tool-only` را علیه هر worktree اجرا می‌کند، و `baseline/`، `candidate/`، `comparison.json`، و `mantis-report.md` را به‌عنوان مصنوعات Actions بارگذاری می‌کند. همچنین HTML مربوط به timeline هر مسیر را در یک مرورگر دسکتاپ Crabbox رندر می‌کند و آن نماگرفت‌های VNC را کنار PNGهای قطعی timeline در نظر PR منتشر می‌کند. همان نظر PR پیش‌نمایش‌های سبک GIF کوتاه‌شده بر اساس حرکت را که با `crabbox media preview` تولید شده‌اند embed می‌کند، به کلیپ‌های MP4 کوتاه‌شدهٔ متناظر بر اساس حرکت لینک می‌دهد، و فایل‌های کامل MP4 دسکتاپ را برای بررسی عمیق نگه می‌دارد. نماگرفت‌ها برای بازبینی سریع به‌صورت inline باقی می‌مانند. گردش‌کار، CLI Crabbox را از main در `openclaw/crabbox` می‌سازد تا بتواند پیش از انتشار بعدی باینری Crabbox از پرچم‌های فعلی lease دسکتاپ/مرورگر استفاده کند.

`Mantis Scenario` نقطهٔ ورود دستی عمومی است. یک `scenario_id`، `candidate_ref`، یک `baseline_ref` اختیاری، و یک `pr_number` اختیاری می‌گیرد، سپس گردش‌کار مالک سناریو را dispatch می‌کند. wrapper عمداً نازک است: گردش‌کارهای سناریو همچنان مالک راه‌اندازی انتقال، اعتبارنامه‌ها، کلاس VM، داور مورد انتظار، و manifest مصنوع خود هستند.

`Mantis Slack Desktop Smoke` نخستین گردش‌کار ماشین مجازی Slack است. این گردش‌کار
ارجاع نامزد مورد اعتماد را در یک worktree جداگانه checkout می‌کند، یک دسکتاپ
Linux از Crabbox اجاره می‌گیرد، `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` را روی آن
نامزد اجرا می‌کند، Slack Web را در مرورگر VNC باز می‌کند، دسکتاپ را ضبط می‌کند، با
`crabbox media preview` یک پیش‌نمایش برش‌خورده بر اساس حرکت تولید می‌کند، کل
دایرکتوری artifact را بارگذاری می‌کند، و به‌صورت اختیاری نظر شواهد inline را روی PR هدف منتشر می‌کند.
این مسیر به‌طور پیش‌فرض برای اجاره دسکتاپ از AWS استفاده می‌کند و یک ورودی دستی provider ارائه می‌دهد تا
اپراتورها وقتی ظرفیت AWS کند یا ناموجود است بتوانند به Hetzner تغییر دهند. از
این lane زمانی استفاده کنید که به‌جای فقط یک رونوشت Slack ربات‌به‌ربات، یک
«دسکتاپ Linux با Slack و یک claw در حال اجرا» می‌خواهید.

`Mantis Telegram Live` مسیر QA زنده موجود Telegram را در همان pipeline
شواهد PR بسته‌بندی می‌کند. این گردش‌کار ارجاع نامزد مورد اعتماد را در یک
worktree جداگانه checkout می‌کند، `pnpm openclaw qa telegram --credential-source convex
--credential-role ci` را اجرا می‌کند، از خلاصه QA تلگرام و artifact پیام مشاهده‌شده یک manifest به نام
`mantis-evidence.json` می‌نویسد، رونوشت HTML ویرایش‌شده را از طریق مرورگر دسکتاپ Crabbox رندر می‌کند، با
`crabbox media preview` یک GIF برش‌خورده بر اساس حرکت تولید می‌کند، و وقتی شماره PR
در دسترس باشد نظر شواهد inline را روی PR منتشر می‌کند. این lane به‌جای اثبات
Telegram Web واردشده، بصری‌سازی رونوشت است: Telegram Bot API شواهد پایدار پیام زنده می‌دهد، اما
وضعیت ورود Telegram Web برای اتوماسیون عادی Mantis لازم نیست.

`Mantis Telegram Desktop Proof` پوشش agentic بومی Telegram Desktop برای قبل/بعد است.
یک maintainer می‌تواند آن را از نظر PR با
`@Mantis telegram desktop proof`، از رابط Actions با دستورالعمل‌های آزاد، یا از طریق dispatcher عمومی
`Mantis Scenario` اجرا کند. این workflow، PR، ارجاع baseline، ارجاع candidate و
دستورالعمل‌های maintainer را به Codex می‌دهد. عامل PR را می‌خواند، تصمیم می‌گیرد چه رفتار قابل‌مشاهده‌ای در Telegram
تغییر را اثبات می‌کند، مسیر اثبات Telegram Desktop واقعی کاربر را در Crabbox برای baseline و
candidate اجرا می‌کند، تا زمانی که GIFهای بومی مفید شوند تکرار می‌کند، artifactهای جفت‌شده
`motionPreview` را در `mantis-evidence.json` می‌نویسد، بسته را بارگذاری می‌کند، و
وقتی شماره PR در دسترس باشد یک جدول شواهد PR دو ستونه منتشر می‌کند.

برای راه‌اندازی Telegram دسکتاپ با حضور انسان، از scenario builder استفاده کنید:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

builder یک دسکتاپ Crabbox را اجاره یا دوباره استفاده می‌کند، باینری بومی Linux
Telegram Desktop را نصب می‌کند، به‌صورت اختیاری آرشیو نشست کاربر را بازیابی می‌کند، OpenClaw را با توکن ربات SUT
Telegram اجاره‌شده پیکربندی می‌کند، `openclaw gateway run` را روی پورت `38974` شروع می‌کند،
یک پیام آمادگی driver-bot به گروه خصوصی اجاره‌شده می‌فرستد، سپس از دسکتاپ VNC قابل‌مشاهده
یک screenshot و MP4 می‌گیرد. توکن ربات هرگز وارد Telegram Desktop نمی‌شود؛ فقط OpenClaw را پیکربندی می‌کند.
نمایشگر دسکتاپ یک نشست کاربر جداگانه Telegram است که از
`--telegram-profile-archive-env <name>` بازیابی می‌شود یا به‌صورت دستی از طریق VNC ساخته می‌شود و با
`--keep-lease` زنده نگه داشته می‌شود.

فلگ‌های مفید Telegram desktop builder:

- `--lease-id <cbx_...>` را دوباره روی یک VM اجرا می‌کند که اپراتور قبلا در Telegram Desktop وارد آن شده است.
- `--telegram-profile-archive-env <name>` یک آرشیو base64 `.tgz` از پروفایل Telegram Desktop را از آن متغیر env می‌خواند و پیش از launch بازیابی می‌کند.
- `--telegram-profile-dir <remote-path>` دایرکتوری پروفایل remote مربوط به Telegram Desktop را کنترل می‌کند. پیش‌فرض `$HOME/.local/share/TelegramDesktop` است.
- `--no-gateway-setup` بدون پیکربندی OpenClaw، Telegram Desktop را نصب و باز می‌کند.
- `--credential-source convex --credential-role ci` به‌جای توکن‌های مستقیم env مربوط به Telegram، از credential broker مشترک استفاده می‌کند.

هر scenario منتشرکننده PR، `mantis-evidence.json` را کنار گزارش خود می‌نویسد.
این schema محل تحویل بین کد scenario و نظرهای GitHub است:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord Status Reactions QA",
  "summary": "Human-readable top summary for the PR comment.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "queued-only" },
    "candidate": { "sha": "...", "status": "pass", "expected": "queued -> thinking -> done" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Baseline queued-only",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Baseline Discord timeline",
      "width": 420
    }
  ]
}
```

مقدارهای `path` مربوط به artifact نسبت به دایرکتوری manifest هستند. مقدارهای `targetPath`
مسیرهای نسبی زیر دایرکتوری انتشار branch به نام `qa-artifacts` هستند.
publisher از path traversal جلوگیری می‌کند و وقتی پیش‌نمایش‌ها یا ویدیوهای اختیاری در دسترس نیستند،
ورودی‌های علامت‌خورده با `"required": false` را رد می‌کند.

گونه‌های artifact پشتیبانی‌شده:

- `timeline`: screenshot قطعی scenario، معمولا قبل/بعد.
- `desktopScreenshot`: screenshot دسکتاپ VNC/مرورگر.
- `motionPreview`: GIF متحرک inline که از ضبط دسکتاپ تولید شده است.
- `motionClip`: MP4 برش‌خورده بر اساس حرکت که lead-in و tail ثابت را حذف می‌کند.
- `fullVideo`: ضبط کامل MP4 برای بررسی عمیق.
- `metadata`: فایل جانبی JSON/log.
- `report`: گزارش Markdown.

publisher قابل‌استفاده مجدد `scripts/mantis/publish-pr-evidence.mjs` است. Workflowها
آن را با manifest، PR هدف، root هدف `qa-artifacts`، comment marker،
URL artifact مربوط به Actions، URL اجرا، و منبع درخواست فراخوانی می‌کنند. این ابزار artifactهای اعلام‌شده را
به branch `qa-artifacts` کپی می‌کند، یک نظر PR با اولویت خلاصه همراه با تصاویر/پیش‌نمایش‌های inline
و ویدیوهای لینک‌شده می‌سازد، سپس نظر marker موجود را به‌روزرسانی می‌کند یا
یک نظر جدید می‌سازد.

همچنین می‌توانید اجرای status-reactions را مستقیما از یک نظر PR اجرا کنید:

```text
@Mantis discord status reactions
```

راه‌انداز نظر عمدا محدود است. فقط روی نظرهای pull request از کاربرانی با دسترسی
write، maintain یا admin اجرا می‌شود، و فقط درخواست‌های status-reaction مربوط به Discord را تشخیص می‌دهد.
به‌طور پیش‌فرض از ارجاع baseline خراب شناخته‌شده و SHA سر فعلی PR به‌عنوان candidate استفاده می‌کند.
maintainerها می‌توانند هرکدام از این ارجاع‌ها را override کنند:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

QA زنده Telegram نیز می‌تواند از یک نظر PR اجرا شود:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

به‌طور پیش‌فرض از SHA سر فعلی PR به‌عنوان candidate استفاده می‌کند و
`telegram-status-command` را اجرا می‌کند. maintainerها می‌توانند وقتی به یک ref خاص یا
دسکتاپ Crabbox از پیش گرم‌شده نیاز دارند، `candidate=...`،
`provider=aws|hetzner` و `lease=<cbx_...>` را override کنند.

نمونه‌های دستور ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

دستور نخست صریح و متمرکز بر scenario است. دستور دوم بعدا می‌تواند یک PR
یا issue را بر اساس labelها، فایل‌های تغییرکرده و یافته‌های review ClawSweeper
به scenarioهای پیشنهادی Mantis نگاشت کند.

## چرخه عمر اجرا

1. credentialها را دریافت کنید.
2. یک VM اختصاص دهید یا دوباره استفاده کنید.
3. وقتی scenario به شواهد UI نیاز دارد، پروفایل دسکتاپ/مرورگر را آماده کنید.
4. یک checkout پاک برای ارجاع baseline آماده کنید.
5. dependencyها را نصب کنید و فقط آنچه scenario لازم دارد را build کنید.
6. یک OpenClaw Gateway فرزند را با دایرکتوری state ایزوله شروع کنید.
7. transport زنده، provider، مدل و پروفایل مرورگر را پیکربندی کنید.
8. scenario را اجرا کنید و شواهد baseline را بگیرید.
9. gateway را متوقف کنید و logها را حفظ کنید.
10. ارجاع candidate را در همان VM آماده کنید.
11. همان scenario را اجرا کنید و شواهد candidate را بگیرید.
12. نتایج oracle و شواهد بصری را مقایسه کنید.
13. Markdown، JSON، logها، screenshotها و artifactهای trace اختیاری را بنویسید.
14. artifactهای GitHub Actions را بارگذاری کنید.
15. یک پیام وضعیت PR یا Discord کوتاه منتشر کنید.

scenario باید بتواند به دو روش متفاوت fail شود:

- **Bug reproduced**: baseline به روش مورد انتظار fail شد.
- **Harness failure**: راه‌اندازی محیط، credentialها، Discord API، مرورگر، یا
  provider پیش از معنادار شدن bug oracle fail شد.

گزارش نهایی باید این موارد را جدا کند تا maintainerها یک محیط flaky را با
رفتار محصول اشتباه نگیرند.

## Discord MVP

نخستین scenario باید status reactionهای Discord را در channelهای guild هدف بگیرد که
حالت تحویل source reply در آن‌ها `message_tool_only` است.

چرا seed خوبی برای Mantis است:

- در Discord به‌صورت reaction روی پیام triggerکننده قابل‌مشاهده است.
- از طریق وضعیت reaction پیام Discord یک oracle REST قوی دارد.
- یک OpenClaw Gateway واقعی، احراز هویت bot در Discord، dispatch پیام،
  حالت تحویل source reply، وضعیت status reaction، و چرخه عمر نوبت مدل را تمرین می‌دهد.
- به‌اندازه کافی محدود است تا نخستین پیاده‌سازی دقیق بماند.

شکل مورد انتظار scenario:

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

شواهد baseline باید reaction تایید queued را نشان دهد اما در حالت tool-only هیچ
گذار lifecycle نشان ندهد. شواهد candidate باید نشان دهد وقتی
`messages.statusReactions.enabled` صریحا `true` است، status reactionهای lifecycle اجرا می‌شوند.

نخستین برش اجرایی، scenario QA زنده Discord با opt-in است:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

این دستور SUT را با رسیدگی همیشه‌فعال به guild، `visibleReplies:
"message_tool"`، `ackReaction: "👀"`، و status reactionهای صریح پیکربندی می‌کند. oracle
پیام triggerکننده واقعی Discord را poll می‌کند و انتظار توالی مشاهده‌شده
`👀 -> 🤔 -> 👍` را دارد. artifactها شامل `discord-qa-reaction-timelines.json`،
`discord-status-reactions-tool-only-timeline.html` و
`discord-status-reactions-tool-only-timeline.png` هستند.

## بخش‌های QA موجود

Mantis باید به‌جای شروع از صفر، بر stack خصوصی QA موجود بنا شود:

- `pnpm openclaw qa discord` از قبل یک lane زنده Discord را با driver و
  botهای SUT اجرا می‌کند.
- runner مربوط به transport زنده از قبل گزارش‌ها و artifactهای observed-message را
  زیر `.artifacts/qa-e2e/` می‌نویسد.
- leaseهای credential در Convex از قبل دسترسی انحصاری به credentialهای transport زنده مشترک را فراهم می‌کنند.
- سرویس کنترل مرورگر از قبل از screenshotها، snapshotها،
  پروفایل‌های managed headless، و پروفایل‌های remote CDP پشتیبانی می‌کند.
- QA Lab از قبل یک UI debugger و bus برای آزمون‌های transport-shaped دارد.

نخستین پیاده‌سازی Mantis می‌تواند یک runner باریک قبل/بعد روی این بخش‌ها
به‌همراه یک لایه شواهد بصری باشد.

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

`mantis-summary.json` باید منبع حقیقت machine-readable باشد. گزارش
Markdown برای نظرهای PR و review انسانی است.

خلاصه باید شامل این موارد باشد:

- refها و SHAهای آزموده‌شده
- transport و شناسه scenario
- provider ماشین و شناسه ماشین یا شناسه lease
- منبع credential بدون مقدارهای secret
- نتیجه baseline
- نتیجه candidate
- اینکه آیا bug روی baseline بازتولید شد
- اینکه آیا candidate آن را fix کرد
- مسیرهای artifact
- مشکلات setup یا cleanup پاک‌سازی‌شده

اسکرین‌شات‌ها مدرک هستند، نه راز. با این حال همچنان به انضباط در ویرایش و پوشاندن اطلاعات حساس نیاز دارند:
نام کانال‌های خصوصی، نام کاربران، یا محتوای پیام‌ها ممکن است ظاهر شوند. برای PRهای عمومی،
تا وقتی وضعیت ویرایش اطلاعات حساس قوی‌تر نشده است، پیوندهای artifact در GitHub Actions را به تصاویر درون‌خطی ترجیح دهید.

## مرورگر و VNC

مسیر مرورگر دو حالت دارد:

- **خودکارسازی بدون رابط گرافیکی**: پیش‌فرض برای CI. Chrome با CDP فعال اجرا می‌شود، و
  Playwright یا کنترل مرورگر OpenClaw اسکرین‌شات‌ها را ثبت می‌کند.
- **نجات با VNC**: روی همان VM فعال می‌شود وقتی ورود، MFA، ضدخودکارسازی Discord،
  یا اشکال‌زدایی بصری به انسان نیاز دارد.

پروفایل مرورگر ناظر Discord باید آن‌قدر پایدار باشد که برای هر اجرا نیاز به
ورود دوباره نباشد، اما از وضعیت مرورگر شخصی جدا باشد. یک پروفایل
به مجموعه ماشین‌های Mantis تعلق دارد، نه به لپ‌تاپ توسعه‌دهنده.

وقتی Mantis گیر می‌کند، یک پیام وضعیت Discord با این موارد ارسال می‌کند:

- شناسه اجرا
- شناسه سناریو
- ارائه‌دهنده ماشین
- پوشه artifact
- دستورالعمل‌های اتصال VNC یا noVNC در صورت موجود بودن
- متن کوتاه مانع

نخستین استقرار خصوصی می‌تواند این پیام‌ها را در کانال فعلی اپراتور
منتشر کند و بعدا به یک کانال اختصاصی Mantis منتقل شود.

## ماشین‌ها

Mantis باید برای نخستین پیاده‌سازی راه دور، AWS از طریق Crabbox را ترجیح دهد.
Crabbox ماشین‌های آماده، رهگیری اجاره، آماده‌سازی، لاگ‌ها، نتایج، و
پاک‌سازی را در اختیار ما می‌گذارد. اگر ظرفیت AWS بیش از حد کند یا ناموجود بود، یک ارائه‌دهنده Hetzner
پشت همان رابط ماشین اضافه کنید.

حداقل نیازمندی‌های VM:

- Linux با نصب Chrome یا Chromium مناسب دسکتاپ
- دسترسی CDP برای خودکارسازی مرورگر
- VNC یا noVNC برای نجات
- Node 22 و pnpm
- checkout مربوط به OpenClaw و کش وابستگی‌ها
- کش مرورگر Playwright Chromium وقتی Playwright استفاده می‌شود
- CPU و حافظه کافی برای یک OpenClaw Gateway، یک مرورگر، و یک اجرای مدل
- دسترسی خروجی به Discord، GitHub، ارائه‌دهندگان مدل، و کارگزار اعتبارنامه

VM نباید رازهای خام بلندمدت را بیرون از مخزن‌های مورد انتظار اعتبارنامه یا
پروفایل مرورگر نگه دارد.

## رازها

رازها برای اجراهای راه دور در رازهای سازمان یا مخزن GitHub، و برای اجراهای محلی
در یک فایل راز محلی تحت کنترل اپراتور قرار می‌گیرند.

نام‌های پیشنهادی رازها:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` برای بارگذاری artifactهای عمومی GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

در بلندمدت، مجموعه اعتبارنامه Convex باید منبع عادی اعتبارنامه‌های انتقال زنده باقی بماند.
رازهای GitHub کارگزار و مسیرهای fallback را راه‌اندازی اولیه می‌کنند.
گردش‌کار واکنش‌های وضعیت Discord رازهای Mantis Crabbox را دوباره به
متغیرهای محیطی `CRABBOX_COORDINATOR` و `CRABBOX_COORDINATOR_TOKEN` نگاشت می‌کند
که CLI مربوط به Crabbox انتظار دارد. نام‌های ساده راز GitHub با الگوی `CRABBOX_*` همچنان
به‌عنوان fallback سازگاری پذیرفته می‌شوند.

اجراکننده Mantis هرگز نباید این موارد را چاپ کند:

- توکن‌های بات Discord
- کلیدهای API ارائه‌دهنده
- کوکی‌های مرورگر
- محتوای پروفایل احراز هویت
- گذرواژه‌های VNC
- payloadهای خام اعتبارنامه

بارگذاری artifact عمومی باید فراداده هدف Discord مانند شناسه‌های بات،
guild، کانال، و پیام را نیز ویرایش و مخفی کند. گردش‌کار smoke در GitHub
به همین دلیل `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` را فعال می‌کند.

اگر توکنی به‌طور تصادفی در issue، PR، چت، یا لاگ چسبانده شد، پس از ذخیره شدن
راز جدید، آن را چرخش دهید.

## Artifactهای GitHub و نظرهای PR

گردش‌کارهای Mantis باید بسته کامل شواهد را به‌عنوان یک artifact کوتاه‌عمر Actions
بارگذاری کنند. وقتی گردش‌کار برای گزارش باگ یا PR رفع اجرا می‌شود، باید
اسکرین‌شات‌های PNG ویرایش‌شده را نیز در شاخه `qa-artifacts` منتشر کند و
روی آن باگ یا PR رفع، نظری را با اسکرین‌شات‌های درون‌خطی قبل/بعد درج یا به‌روزرسانی کند. مدرک
اصلی را فقط روی یک PR عمومی خودکارسازی QA منتشر نکنید. لاگ‌های خام، پیام‌های
مشاهده‌شده، و دیگر شواهد حجیم در artifact مربوط به Actions باقی می‌مانند.

گردش‌کارهای production باید آن نظرها را با Mantis GitHub App منتشر کنند، نه
با `github-actions[bot]`. شناسه برنامه و کلید خصوصی را به‌عنوان رازهای
GitHub Actions با نام‌های `MANTIS_GITHUB_APP_ID` و `MANTIS_GITHUB_APP_PRIVATE_KEY`
ذخیره کنید. گردش‌کار از یک نشانگر پنهان به‌عنوان کلید upsert استفاده می‌کند، وقتی
توکن بتواند آن را ویرایش کند همان نظر را به‌روزرسانی می‌کند، و وقتی
نشانگر قدیمی متعلق به بات قابل ویرایش نیست، یک نظر جدید متعلق به Mantis ایجاد می‌کند.

نظر PR باید کوتاه و بصری باشد:

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

وقتی اجرا به این دلیل شکست می‌خورد که harness شکست خورده است، نظر باید همین را بگوید
و القا نکند که candidate شکست خورده است.

## یادداشت‌های استقرار خصوصی

یک استقرار خصوصی ممکن است از قبل یک برنامه Discord مربوط به Mantis داشته باشد. وقتی آن برنامه
مجوزهای بات مناسب را دارد و می‌توان آن را ایمن چرخش داد، به‌جای ساخت برنامه دیگر از همان
برنامه استفاده کنید.

کانال اولیه اعلان اپراتور را از طریق رازها یا پیکربندی استقرار تنظیم کنید.
ابتدا می‌تواند به یک کانال فعلی maintainer یا عملیات اشاره کند، سپس وقتی
کانال اختصاصی Mantis وجود داشت به آن منتقل شود.

شناسه‌های guild، شناسه‌های کانال، توکن‌های بات، کوکی‌های مرورگر، یا گذرواژه‌های VNC
را در این سند قرار ندهید. آن‌ها را در رازهای GitHub، کارگزار اعتبارنامه، یا
مخزن راز محلی اپراتور ذخیره کنید.

## افزودن سناریو

یک سناریوی Mantis باید این موارد را اعلام کند:

- شناسه و عنوان
- انتقال
- اعتبارنامه‌های لازم
- سیاست ref مربوط به baseline
- سیاست ref مربوط به candidate
- patch پیکربندی OpenClaw
- مراحل راه‌اندازی
- محرک
- oracle مورد انتظار baseline
- oracle مورد انتظار candidate
- هدف‌های ثبت بصری
- بودجه timeout
- مراحل پاک‌سازی

سناریوها باید oracleهای کوچک و typed را ترجیح دهند:

- وضعیت واکنش Discord برای باگ‌های واکنش
- ارجاع‌های پیام Discord برای باگ‌های threading
- thread ts در Slack و وضعیت API واکنش برای باگ‌های Slack
- شناسه‌ها و headerهای پیام ایمیل برای باگ‌های ایمیل
- اسکرین‌شات‌های مرورگر وقتی UI تنها مشاهده‌پذیر قابل اعتماد است

بررسی‌های بینایی باید افزایشی باشند. اگر API یک پلتفرم می‌تواند باگ را اثبات کند، از
API به‌عنوان oracle قبول/رد استفاده کنید و اسکرین‌شات‌ها را برای اطمینان انسانی نگه دارید.

## گسترش ارائه‌دهنده

پس از Discord، همان اجراکننده می‌تواند این موارد را اضافه کند:

- Slack: واکنش‌ها، threadها، mentionهای app، modalها، بارگذاری فایل.
- ایمیل: احراز هویت Gmail و threading پیام با استفاده از `gog` در جاهایی که connectorها کافی نیستند.
- WhatsApp: ورود با QR، شناسایی دوباره، تحویل پیام، رسانه، واکنش‌ها.
- Telegram: gating مربوط به mention گروه، فرمان‌ها، واکنش‌ها در صورت موجود بودن.
- Matrix: اتاق‌های رمزگذاری‌شده، روابط thread یا reply، ازسرگیری پس از restart.

هر انتقال باید یک سناریوی smoke ارزان و یک یا چند سناریوی دسته باگ داشته باشد.
سناریوهای بصری پرهزینه باید opt-in باقی بمانند.

## پرسش‌های باز

- وقتی بات فعلی Mantis دوباره استفاده می‌شود، کدام بات Discord باید driver باشد و کدام باید SUT؟
- ورود مرورگر ناظر در فاز نخست باید از حساب انسانی Discord، حساب آزمایشی،
  یا فقط شواهد REST قابل خواندن توسط بات استفاده کند؟
- GitHub چه مدت باید artifactهای Mantis را برای PRها نگه دارد؟
- چه زمانی ClawSweeper باید به‌جای انتظار برای فرمان maintainer، به‌طور خودکار Mantis را پیشنهاد کند؟
- آیا اسکرین‌شات‌ها باید قبل از بارگذاری برای PRهای عمومی ویرایش یا crop شوند؟
