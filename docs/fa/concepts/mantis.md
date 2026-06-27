---
read_when:
    - ساخت یا اجرای QA بصری زنده برای باگ‌های OpenClaw
    - افزودن راستی‌آزمایی قبل و بعد برای یک درخواست کشش
    - افزودن سناریوهای انتقال زنده Discord، Slack، WhatsApp یا موارد دیگر
    - اشکال‌زدایی اجراهای QA که به اسکرین‌شات، خودکارسازی مرورگر یا دسترسی VNC نیاز دارند
summary: Mantis سامانهٔ راستی‌آزمایی بصری سرتاسری برای بازتولید باگ‌های OpenClaw روی انتقال‌های زنده، ثبت شواهد قبل و بعد، و پیوست کردن مصنوعات به PRها است.
title: Mantis
x-i18n:
    generated_at: "2026-06-27T17:33:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9de83fac9bfa64b4828dab96fcbf5fac33466c7ede9406472801dc7322bf3ae
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis سامانهٔ راستی‌آزمایی سرتاسری OpenClaw برای باگ‌هایی است که به runtime واقعی، ترابری واقعی، و اثبات قابل مشاهده نیاز دارند. این سامانه یک سناریو را در برابر یک ref بدِ شناخته‌شده اجرا می‌کند، شواهد را ثبت می‌کند، همان سناریو را در برابر یک ref نامزد اجرا می‌کند، و مقایسه را به‌صورت artifactهایی منتشر می‌کند که نگه‌دارنده می‌تواند آن‌ها را از یک PR یا از یک فرمان محلی بررسی کند.

Mantis با Discord شروع می‌کند، چون Discord یک مسیر نخستینِ باارزش به ما می‌دهد: احراز هویت واقعی bot، کانال‌های واقعی guild، واکنش‌ها، threadها، فرمان‌های بومی، و یک UI مرورگر که انسان‌ها می‌توانند در آن به‌صورت دیداری تأیید کنند ترابری چه چیزی نشان داده است.

## هدف‌ها

- بازتولید یک باگ از issue یا PR در GitHub با همان شکل ترابری که کاربران می‌بینند.
- ثبت یک artifact **پیش از تغییر** روی ref مبنا پیش از اعمال اصلاح.
- ثبت یک artifact **پس از تغییر** روی ref نامزد پس از اعمال اصلاح.
- هر زمان ممکن است از یک oracle قطعی استفاده شود، مانند خواندن واکنش Discord با REST یا بررسی رونوشت کانال.
- وقتی باگ یک سطح UI قابل مشاهده دارد، screenshot ثبت شود.
- به‌صورت محلی از CLI تحت کنترل عامل و از راه دور از GitHub اجرا شود.
- به‌اندازهٔ کافی وضعیت ماشین حفظ شود تا وقتی ورود، خودکارسازی مرورگر، یا احراز هویت provider گیر می‌کند، امکان نجات با VNC وجود داشته باشد.
- وقتی اجرا مسدود است، به کمک دستی VNC نیاز دارد، یا تمام می‌شود، وضعیت کوتاه در یک کانال Discord اپراتور ارسال شود.

## غیرهدف‌ها

- Mantis جایگزین unit testها نیست. اجرای Mantis معمولاً باید پس از فهمیدن اصلاح، به یک آزمون regression کوچک‌تر تبدیل شود.
- Mantis دروازهٔ سریع عادی CI نیست. کندتر است، از credentialهای زنده استفاده می‌کند، و برای باگ‌هایی کنار گذاشته شده است که محیط زنده در آن‌ها اهمیت دارد.
- Mantis نباید برای عملکرد عادی به انسان نیاز داشته باشد. VNC دستی مسیر نجات است، نه مسیر مطلوب.
- Mantis secretهای خام را در artifactها، logها، screenshotها، گزارش‌های Markdown، یا نظرهای PR ذخیره نمی‌کند.

## مالکیت

Mantis در پشتهٔ QA OpenClaw زندگی می‌کند.

- OpenClaw مالک runtime سناریو، adapterهای ترابری، schema شواهد، و CLI محلی زیر `pnpm openclaw qa mantis` است.
- QA Lab مالک قطعات harness ترابری زنده، helperهای ثبت مرورگر، و نویسنده‌های artifact است.
- Crabbox وقتی VM راه دور لازم باشد، مالک ماشین‌های Linux گرم‌شده است.
- GitHub Actions مالک نقطهٔ ورود workflow راه دور و نگه‌داری artifact است.
- ClawSweeper مالک مسیریابی نظرهای GitHub است: parse کردن فرمان‌های نگه‌دارنده، dispatch کردن workflow، و ارسال نظر نهایی PR.
- عامل‌های OpenClaw وقتی یک سناریو به setup عاملی، debugging، یا گزارش وضعیت گیرکرده نیاز دارد، Mantis را از طریق Codex هدایت می‌کنند.

این مرزبندی دانش ترابری را در OpenClaw، زمان‌بندی ماشین را در Crabbox، و چسب workflow نگه‌دارنده را در ClawSweeper نگه می‌دارد.

## شکل فرمان

نخستین فرمان محلی، bot مربوط به Discord، guild، کانال، ارسال پیام، ارسال واکنش، و مسیر artifact را راستی‌آزمایی می‌کند:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

runner محلی پیش/پس این شکل را می‌پذیرد:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

runner زیر دایرکتوری خروجی، worktreeهای جداشدهٔ مبنا و نامزد ایجاد می‌کند، وابستگی‌ها را نصب می‌کند، هر ref را build می‌کند، سناریو را با `--allow-failures` اجرا می‌کند، سپس `baseline/`، `candidate/`، `comparison.json`، و `mantis-report.md` را می‌نویسد. برای نخستین سناریوی Discord، راستی‌آزمایی موفق یعنی وضعیت مبنا `fail` و وضعیت نامزد `pass` باشد.

دومین probe پیش/پس Discord، پیوست‌های thread را هدف می‌گیرد:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

آن سناریو با bot راه‌انداز یک پیام parent ارسال می‌کند، یک thread واقعی Discord ایجاد می‌کند، action مربوط به `message.thread-reply` در OpenClaw را با یک `filePath` محلی repo فراخوانی می‌کند، سپس thread را برای پاسخ SUT و نام فایل پیوست poll می‌کند. screenshot مبنا، پاسخ را بدون پیوست نشان می‌دهد؛ screenshot نامزد، پیوست مورد انتظار `mantis-thread-report.md` را نشان می‌دهد.

نخستین primitive مربوط به VM/مرورگر، smoke دسکتاپ است:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

این فرمان یک ماشین دسکتاپ Crabbox را lease یا reuse می‌کند، یک مرورگر قابل مشاهده را داخل نشست VNC شروع می‌کند، دسکتاپ را ثبت می‌کند، artifactها را به دایرکتوری خروجی محلی برمی‌گرداند، و فرمان reconnect را در گزارش می‌نویسد. فرمان به‌طور پیش‌فرض از provider Hetzner استفاده می‌کند، چون نخستین provider با پوشش دسکتاپ/VNC کارا در مسیر Mantis است. هنگام اجرا روی fleet دیگر Crabbox، آن را با `--provider`، `--crabbox-bin`، یا `OPENCLAW_MANTIS_CRABBOX_PROVIDER` override کنید.

flagهای مفید smoke دسکتاپ:

- `--lease-id <cbx_...>` یا `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` یک دسکتاپ گرم‌شده را reuse می‌کند.
- `--browser-url <url>` صفحه‌ای را که در مرورگر قابل مشاهده باز می‌شود تغییر می‌دهد.
- `--html-file <path>` یک artifact HTML محلی repo را در مرورگر قابل مشاهده render می‌کند. Mantis از این برای ثبت timeline تولیدشدهٔ واکنش وضعیت Discord از طریق یک دسکتاپ واقعی Crabbox استفاده می‌کند.
- `--browser-profile-dir <remote-path>` یک user-data-dir راه دور Chrome را reuse می‌کند تا دسکتاپ پایدار Mantis بتواند بین اجراها logged in بماند. از این برای profile بلندمدت viewer در Discord Web استفاده کنید.
- `--browser-profile-archive-env <name>` پیش از اجرای مرورگر، archive پایهٔ user-data-dir مربوط به Chrome با قالب base64 `.tgz` را از متغیر محیطی نام‌گذاری‌شده restore می‌کند. از این برای witnessهای logged-in مانند Discord Web استفاده کنید. env var پیش‌فرض `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64` است.
- `--video-duration <seconds>` طول ثبت MP4 را کنترل می‌کند. برای web appهای logged-in کند که برای پایدار شدن به زمان نیاز دارند، از duration طولانی‌تر استفاده کنید.
- `--keep-lease` یا `OPENCLAW_MANTIS_KEEP_VM=1` یک lease تازه ایجادشده و موفق را برای بررسی VNC باز نگه می‌دارد. اجراهای ناموفق، وقتی lease ایجاد شده باشد، به‌طور پیش‌فرض lease را نگه می‌دارند تا اپراتور بتواند reconnect کند.
- `--class`، `--idle-timeout`، و `--ttl` اندازهٔ ماشین و عمر lease را تنظیم می‌کنند.

برای شواهد Discord Web، Mantis به‌جای bot token از یک حساب viewer اختصاصی استفاده می‌کند. سناریوی زندهٔ Discord API همچنان oracle باقی می‌ماند: thread واقعی را ایجاد می‌کند، `thread-reply` مربوط به SUT را می‌فرستد، و پیوست را از طریق Discord REST بررسی می‌کند. وقتی `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` تنظیم شده باشد، سناریو یک artifact URL مربوط به Discord Web نیز می‌نویسد. وقتی `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` تنظیم شده باشد، آن thread را به‌اندازهٔ کافی در دسترس می‌گذارد تا مرورگر logged-in بتواند آن را باز و ضبط کند.

workflow مربوط به GitHub، URL مربوط به thread نامزد را در Discord Web باز می‌کند، screenshot ثبت می‌کند، MP4 ضبط می‌کند، و وقتی ابزار رسانه‌ای Crabbox در دسترس باشد یک پیش‌نمایش GIF trim‌شده تولید می‌کند. یک مسیر profile پایدار viewer که از طریق `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` پیکربندی شده است ترجیح دارد، چون archiveهای کامل profile مربوط به Chrome می‌توانند از حد اندازهٔ secret در GitHub بزرگ‌تر شوند. برای profileهای کوچک/bootstrap، workflow می‌تواند یک archive با قالب base64 `.tgz` را نیز از `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` restore کند. اگر هیچ‌کدام از sourceهای profile پیکربندی نشده باشند، workflow همچنان screenshotهای قطعی پیوستِ مبنا/نامزد را منتشر می‌کند و notice ثبت می‌کند که witness logged-in مربوط به Discord Web رد شده است.

نخستین primitive کامل ترابری دسکتاپ، smoke دسکتاپ Slack است:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

این فرمان یک ماشین دسکتاپ Crabbox را lease یا reuse می‌کند، checkout فعلی را داخل VM همگام می‌کند، `pnpm openclaw qa slack` را داخل آن VM اجرا می‌کند، Slack Web را در مرورگر VNC باز می‌کند، دسکتاپ قابل مشاهده را ثبت می‌کند، و هم artifactهای QA مربوط به Slack و هم screenshot مربوط به VNC را به دایرکتوری خروجی محلی کپی می‌کند. این نخستین شکل Mantis است که در آن Gateway مربوط به SUT OpenClaw و مرورگر هر دو داخل یک VM دسکتاپ Linux زندگی می‌کنند.

با `--gateway-setup`، فرمان یک home یک‌بارمصرف و پایدار OpenClaw را در `$HOME/.openclaw-mantis/slack-openclaw` آماده می‌کند، پیکربندی Slack Socket Mode را برای کانال انتخاب‌شده patch می‌کند، `openclaw gateway run` را روی port `38973` شروع می‌کند، و Chrome را در نشست VNC در حال اجرا نگه می‌دارد. این حالتِ «یک دسکتاپ Linux با Slack و یک claw در حال اجرا برایم باز بگذار» است؛ وقتی `--gateway-setup` حذف شود، مسیر QA مربوط به bot-to-bot Slack پیش‌فرض باقی می‌ماند.

ورودی‌های لازم برای `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` برای مسیر model راه دور. اگر فقط
  `OPENAI_API_KEY` به‌صورت محلی تنظیم شده باشد، Mantis پیش از فراخوانی Crabbox آن را به `OPENCLAW_LIVE_OPENAI_KEY` map می‌کند تا forward کردن env با `OPENCLAW_*` در Crabbox بتواند آن را به VM ببرد.

با `--gateway-setup --credential-source convex`، Mantis پیش از ایجاد VM، credential مربوط به Slack SUT را از pool مشترک lease می‌کند و id کانال lease‌شده، app token مربوط به Socket Mode، و bot token را به‌عنوان env runtime با نام `OPENCLAW_MANTIS_SLACK_*` داخل دسکتاپ forward می‌کند. این باعث می‌شود workflowهای GitHub سبک بمانند: آن‌ها فقط به secret broker مربوط به Convex نیاز دارند، نه tokenهای خام bot یا app در Slack.

flagهای مفید دسکتاپ Slack:

- `--lease-id <cbx_...>` اجرا را روی ماشینی تکرار می‌کند که اپراتور پیش‌تر از طریق VNC وارد Slack Web شده است.
- `--gateway-setup` به‌جای فقط اجرای مسیر QA مربوط به bot-to-bot، یک Gateway پایدار OpenClaw برای Slack را در VM شروع می‌کند.
- `--keep-lease` پس از موفقیت، VM مربوط به Gateway را برای بررسی VNC باز نگه می‌دارد؛ `--no-keep-lease` پس از جمع‌آوری artifactها آن را متوقف می‌کند.
- `--slack-url <url>` یک URL مشخص Slack Web را باز می‌کند. بدون آن، وقتی bot token مربوط به SUT در دسترس باشد، Mantis مقدار `https://app.slack.com/client/<team>/<channel>` را از `auth.test` در Slack derive می‌کند.
- `--slack-channel-id <id>` allowlist کانال Slack را که setup مربوط به Gateway استفاده می‌کند کنترل می‌کند.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` profile پایدار Chrome داخل VM را کنترل می‌کند. مقدار پیش‌فرض `$HOME/.config/openclaw-mantis/slack-chrome-profile` است، بنابراین ورود دستی Slack Web در rerunهای روی همان lease باقی می‌ماند.
- `--credential-source convex --credential-role ci` به‌جای tokenهای مستقیم env مربوط به Slack، از pool credential مشترک استفاده می‌کند.
- `--provider-mode`، `--model`، `--alt-model`، و `--fast` به مسیر زندهٔ Slack pass through می‌شوند.

اجراهای checkpoint تأیید، snapshotهای پیام Slack API را برای اثبات دیداری مناسب CI به PNGهای checkpoint render می‌کنند. `slack-desktop-smoke.png` فقط وقتی اثبات Slack Web است که lease از profile مرورگر گرم‌شده‌ای استفاده کند که از قبل logged in باشد.

workflow مربوط به smoke در GitHub برابر `Mantis Discord Smoke` است. workflow پیش و پس در GitHub برای نخستین سناریوی واقعی برابر `Mantis Discord Status Reactions` است. این‌ها را می‌پذیرد:

- `baseline_ref`: ref که انتظار می‌رود رفتار فقط-queued را بازتولید کند.
- `candidate_ref`: ref که انتظار می‌رود `queued -> thinking -> done` را نشان دهد.

این workflow، ref مربوط به workflow harness را checkout می‌کند، worktreeهای جداگانهٔ مبنا و نامزد را build می‌کند، `discord-status-reactions-tool-only` را در برابر هر worktree اجرا می‌کند، و `baseline/`، `candidate/`، `comparison.json`، و `mantis-report.md` را به‌عنوان artifactهای Actions upload می‌کند. همچنین HTML timeline هر مسیر را در یک مرورگر دسکتاپ Crabbox render می‌کند و آن screenshotهای VNC را کنار PNGهای قطعی timeline در نظر PR منتشر می‌کند. همان نظر PR، پیش‌نمایش‌های سبک GIF با motion-trim که توسط `crabbox media preview` تولید شده‌اند را embed می‌کند، به clipهای MP4 متناظر با motion-trim لینک می‌دهد، و فایل‌های MP4 کامل دسکتاپ را برای بررسی عمیق نگه می‌دارد. screenshotها برای بازبینی سریع inline می‌مانند. workflow، Crabbox CLI را از main در `openclaw/crabbox` build می‌کند تا بتواند پیش از cut شدن انتشار binary بعدی Crabbox، از flagهای فعلی lease دسکتاپ/مرورگر استفاده کند.

`Mantis Scenario` نقطه ورود عمومی دستی است. یک `scenario_id`،
`candidate_ref`، یک `baseline_ref` اختیاری، و یک `pr_number` اختیاری می‌گیرد و سپس
workflow متعلق به scenario را dispatch می‌کند. wrapper عمدا نازک است:
workflowهای scenario همچنان مالک تنظیم transport، credentials، کلاس VM،
oracle مورد انتظار، و manifest artifact خود هستند.

`Mantis Slack Desktop Smoke` نخستین workflow مربوط به VM در Slack است. این workflow،
trusted candidate ref را در یک worktree جداگانه checkout می‌کند، یک دسکتاپ Linux در
Crabbox اجاره می‌گیرد، `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` را روی همان
candidate اجرا می‌کند، Slack Web را در مرورگر VNC باز می‌کند، دسکتاپ را ضبط می‌کند، با
`crabbox media preview` یک preview کوتاه‌شده بر اساس motion می‌سازد، کل دایرکتوری artifact را
upload می‌کند، و در صورت نیاز کامنت evidence درون‌خطی را روی PR هدف post می‌کند.
به‌صورت پیش‌فرض برای اجاره دسکتاپ از AWS استفاده می‌کند و یک ورودی دستی provider ارائه می‌دهد تا
operatorها وقتی ظرفیت AWS کند یا ناموجود است بتوانند به Hetzner تغییر دهند. وقتی به
«یک دسکتاپ Linux با Slack و یک claw در حال اجرا» نیاز دارید، نه فقط transcript Slack از bot به bot،
از این lane استفاده کنید.

`Mantis Telegram Live` مسیر QA زنده موجود Telegram را در همان pipeline مربوط به evidence در PR
wrap می‌کند. این workflow، trusted candidate ref را در یک worktree جداگانه checkout می‌کند،
`pnpm openclaw qa telegram --credential-source convex
--credential-role ci` را اجرا می‌کند، از summary مربوط به Telegram QA،
`qa-evidence.json`، و artifactهای گزارش، یک manifest به نام `mantis-evidence.json` می‌نویسد، evidence HTML
redacted را از طریق یک مرورگر دسکتاپ Crabbox render می‌کند، با
`crabbox media preview` یک GIF کوتاه‌شده بر اساس motion می‌سازد، و وقتی شماره PR موجود باشد،
کامنت evidence درون‌خطی PR را post می‌کند. این lane به‌جای اثبات Telegram Web با کاربر واردشده،
visual مبتنی بر QA-evidence است: Telegram Bot API evidence پایدار پیام زنده می‌دهد، اما برای
automation عادی Mantis، وضعیت login در Telegram Web لازم نیست.

`Mantis Telegram Desktop Proof` wrapper عاملی native Telegram Desktop برای before/after است.
یک maintainer می‌تواند آن را از یک کامنت PR با
`@openclaw-mantis telegram desktop proof`، از UI مربوط به Actions با دستورهای freeform،
یا از طریق dispatcher عمومی `Mantis Scenario` trigger کند. این workflow،
PR، baseline ref، candidate ref، و دستورهای maintainer را به Codex می‌دهد.
عامل PR را می‌خواند، تصمیم می‌گیرد چه رفتار قابل مشاهده‌ای در Telegram تغییر را اثبات می‌کند،
lane اثبات Crabbox Telegram Desktop با کاربر واقعی را برای baseline و
candidate اجرا می‌کند، تا زمانی که GIFهای native مفید شوند iterate می‌کند، artifactهای جفت‌شده
`motionPreview` را داخل `mantis-evidence.json` می‌نویسد، bundle را upload می‌کند، و
وقتی شماره PR موجود باشد یک جدول evidence دو ستونه در PR post می‌کند.

برای راه‌اندازی Telegram desktop با حضور انسان در loop، از scenario builder استفاده کنید:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

builder یک دسکتاپ Crabbox را اجاره یا دوباره استفاده می‌کند، باینری native Linux
Telegram Desktop را نصب می‌کند، در صورت نیاز archive مربوط به user-session را restore می‌کند،
OpenClaw را با توکن bot مربوط به Telegram SUT اجاره‌شده پیکربندی می‌کند، `openclaw gateway run` را
روی پورت `38974` شروع می‌کند، یک پیام readiness از driver-bot به گروه خصوصی اجاره‌شده
post می‌کند، سپس از دسکتاپ قابل مشاهده VNC یک screenshot و MP4 ضبط می‌کند. توکن bot
هرگز وارد Telegram Desktop نمی‌شود؛ فقط OpenClaw را پیکربندی می‌کند. viewer دسکتاپ
یک session کاربر Telegram جداگانه است که از
`--telegram-profile-archive-env <name>` restore می‌شود یا به‌صورت دستی از طریق VNC ساخته می‌شود و با
`--keep-lease` زنده نگه داشته می‌شود.

flagهای مفید Telegram desktop builder:

- `--lease-id <cbx_...>` روی VMای دوباره اجرا می‌کند که operator قبلا در Telegram Desktop وارد آن شده است.
- `--telegram-profile-archive-env <name>` یک archive پروفایل Telegram Desktop با فرمت base64 `.tgz` را از آن env var می‌خواند و پیش از launch آن را restore می‌کند.
- `--telegram-profile-dir <remote-path>` دایرکتوری remote پروفایل Telegram Desktop را کنترل می‌کند. پیش‌فرض `$HOME/.local/share/TelegramDesktop` است.
- `--no-gateway-setup` بدون پیکربندی OpenClaw، Telegram Desktop را نصب و باز می‌کند.
- `--credential-source convex --credential-role ci` به‌جای توکن‌های مستقیم env مربوط به Telegram، از broker اشتراکی credential استفاده می‌کند.

هر scenario که در PR publish می‌شود، کنار گزارش خود `mantis-evidence.json` می‌نویسد.
این schema نقطه handoff میان کد scenario و کامنت‌های GitHub است:

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

مقادیر `path` مربوط به artifact نسبت به دایرکتوری manifest هستند. مقادیر
`targetPath` مسیرهای نسبی زیر prefix پیکربندی‌شده artifact مربوط به Mantis R2/S3 هستند. publisher
path traversal را رد می‌کند و entryهایی را که با `"required": false` علامت‌گذاری شده‌اند،
وقتی previewها یا ویدیوهای اختیاری ناموجود باشند skip می‌کند.

kindهای artifact پشتیبانی‌شده:

- `timeline`: screenshot قطعی scenario، معمولا before/after.
- `desktopScreenshot`: screenshot دسکتاپ VNC/browser.
- `motionPreview`: GIF متحرک درون‌خطی تولیدشده از ضبط دسکتاپ.
- `motionClip`: MP4 کوتاه‌شده بر اساس motion که lead-in و tail ثابت را حذف می‌کند.
- `fullVideo`: ضبط کامل MP4 برای بررسی عمیق.
- `metadata`: sidecar از نوع JSON/log.
- `report`: گزارش Markdown.

publisher قابل استفاده مجدد `scripts/mantis/publish-pr-evidence.mjs` است. workflowها
آن را با manifest، PR هدف، ریشه هدف artifact، marker کامنت،
URL مربوط به artifact در Actions، URL اجرا، و منبع request فراخوانی می‌کنند. artifactهای اعلام‌شده را
در bucket پیکربندی‌شده Mantis R2/S3 upload می‌کند، یک کامنت PR با summary در ابتدا،
شامل تصویرها/previewهای درون‌خطی و ویدیوهای link‌شده می‌سازد، سپس کامنت marker موجود را
update می‌کند یا یکی می‌سازد. workflowها در `openclaw-crabbox-artifacts`
با URLهای عمومی زیر `https://artifacts.openclaw.ai` publish می‌کنند. آن‌ها مقادیر bucket،
region، و URL عمومی را مستقیما ارائه می‌دهند. publisher قابل استفاده مجدد به این موارد نیاز دارد:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`

همچنین می‌توانید اجرای status-reactions را مستقیما از یک کامنت PR trigger کنید:

```text
@openclaw-mantis discord status reactions
```

trigger کامنت عمدا محدود است. فقط روی کامنت‌های pull request از کاربرانی اجرا می‌شود
که دسترسی write، maintain، یا admin دارند، و فقط requestهای status-reaction مربوط به Discord را
تشخیص می‌دهد. به‌صورت پیش‌فرض از baseline ref بد شناخته‌شده و SHA مربوط به head فعلی PR
به‌عنوان candidate استفاده می‌کند. maintainerها می‌توانند هرکدام از refها را override کنند:

```text
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram live QA نیز می‌تواند از یک کامنت PR trigger شود:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

به‌صورت پیش‌فرض از SHA مربوط به head فعلی PR به‌عنوان candidate استفاده می‌کند و
`telegram-status-command` را اجرا می‌کند. maintainerها وقتی به یک ref مشخص یا یک
دسکتاپ Crabbox از پیش گرم‌شده نیاز دارند، می‌توانند `candidate=...`،
`provider=aws|hetzner`، و `lease=<cbx_...>` را override کنند.

نمونه‌های command برای ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

command اول صریح و متمرکز بر scenario است. command دوم بعدا می‌تواند یک PR
یا issue را بر اساس labelها، فایل‌های تغییرکرده، و یافته‌های review در ClawSweeper
به scenarioهای پیشنهادی Mantis map کند.

## چرخه عمر اجرا

1. credentials را acquire کنید.
2. یک VM تخصیص دهید یا دوباره استفاده کنید.
3. وقتی scenario به UI evidence نیاز دارد، پروفایل desktop/browser را آماده کنید.
4. یک checkout تمیز برای baseline ref آماده کنید.
5. dependencyها را نصب کنید و فقط آنچه scenario لازم دارد build کنید.
6. یک OpenClaw Gateway فرزند را با دایرکتوری state ایزوله شروع کنید.
7. transport زنده، provider، model، و browser profile را پیکربندی کنید.
8. scenario را اجرا کنید و baseline evidence را ضبط کنید.
9. gateway را متوقف کنید و logها را حفظ کنید.
10. candidate ref را در همان VM آماده کنید.
11. همان scenario را اجرا کنید و candidate evidence را ضبط کنید.
12. نتایج oracle و evidence بصری را مقایسه کنید.
13. Markdown، JSON، logها، screenshotها، و artifactهای اختیاری trace را بنویسید.
14. artifactهای GitHub Actions را upload کنید.
15. یک پیام وضعیت کوتاه PR یا Discord post کنید.

scenario باید بتواند به دو روش متفاوت fail شود:

- **Bug reproduced**: baseline به روش مورد انتظار fail شده است.
- **Harness failure**: راه‌اندازی محیط، credentials، Discord API، مرورگر، یا
  provider پیش از معنادار شدن oracle مربوط به bug fail شده است.

گزارش نهایی باید این موارد را جدا کند تا maintainerها محیط flaky را با رفتار محصول
اشتباه نگیرند.

## Discord MVP

نخستین scenario باید Discord status reactions را در کانال‌های guild هدف بگیرد؛ جایی که
source reply delivery mode برابر `message_tool_only` است.

چرا seed خوبی برای Mantis است:

- در Discord به‌صورت reaction روی پیام triggerکننده قابل مشاهده است.
- از طریق وضعیت reaction پیام در Discord یک oracle قوی REST دارد.
- یک OpenClaw Gateway واقعی، auth bot در Discord، dispatch پیام،
  source reply delivery mode، وضعیت status reaction، و چرخه عمر turn در model را exercise می‌کند.
- به‌اندازه کافی محدود است تا نخستین پیاده‌سازی را دقیق نگه دارد.

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

baseline evidence باید reaction مربوط به queued acknowledgement را نشان دهد، اما در حالت
tool-only هیچ lifecycle transition نداشته باشد. candidate evidence باید نشان دهد که وقتی
`messages.statusReactions.enabled` صراحتا `true` است، lifecycle status reactions اجرا می‌شوند.

نخستین slice اجرایی، scenario اختیاری Discord live QA است:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

این SUT را با guild handling همیشه روشن، `visibleReplies:
"message_tool"`، `ackReaction: "👀"`، و status reactions صریح پیکربندی می‌کند. oracle
پیام triggerکننده واقعی Discord را poll می‌کند و sequence مشاهده‌شده
`👀 -> 🤔 -> 👍` را انتظار دارد. artifactها شامل `discord-qa-reaction-timelines.json`،
`discord-status-reactions-tool-only-timeline.html`، و
`discord-status-reactions-tool-only-timeline.png` هستند.

## بخش‌های QA موجود

Mantis باید به‌جای شروع از صفر، بر stack خصوصی QA موجود بنا شود:

- `pnpm openclaw qa discord` از قبل یک lane زنده Discord را با driver و
  SUT bots اجرا می‌کند.
- runner مربوط به transport زنده از قبل گزارش‌ها، QA evidence، و
  artifactهای خاص transport را زیر `.artifacts/qa-e2e/` می‌نویسد.
- اجاره‌های credential در Convex از قبل دسترسی exclusive به credentials مشترک transport زنده
  ارائه می‌دهند.
- سرویس کنترل مرورگر از قبل از screenshotها، snapshotها،
  profileهای managed headless، و profileهای remote CDP پشتیبانی می‌کند.
- QA Lab از قبل یک debugger UI و bus برای testing به شکل transport دارد.

نخستین پیاده‌سازی Mantis می‌تواند یک runner نازک before/after روی این
بخش‌ها، به‌همراه یک لایه visual evidence باشد.

## مدل evidence

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

`mantis-summary.json` باید منبع حقیقت قابل‌خواندن برای ماشین باشد. گزارش
Markdown برای نظرهای PR و بازبینی انسانی است.

خلاصه باید شامل این موارد باشد:

- refها و SHAهای آزمون‌شده
- شناسه انتقال و سناریو
- ارائه‌دهنده ماشین و شناسه ماشین یا شناسه اجاره
- منبع اعتبارنامه بدون مقادیر محرمانه
- نتیجه baseline
- نتیجه candidate
- اینکه آیا باگ روی baseline بازتولید شد یا نه
- اینکه آیا candidate آن را رفع کرد یا نه
- مسیرهای artifact
- مشکلات پاک‌سازی یا راه‌اندازی پاک‌سازی‌شده

اسکرین‌شات‌ها شواهد هستند، نه راز. با این حال همچنان به انضباط در پنهان‌سازی
نیاز دارند: نام کانال‌های خصوصی، نام کاربران، یا محتوای پیام ممکن است ظاهر شود.
برای PRهای عمومی، تا زمانی که وضعیت پنهان‌سازی قوی‌تر نشده است، لینک‌های
artifact در GitHub Actions را به تصویرهای inline ترجیح دهید.

## مرورگر و VNC

مسیر مرورگر دو حالت دارد:

- **اتوماسیون headless**: پیش‌فرض برای CI. Chrome با CDP فعال اجرا می‌شود، و
  Playwright یا کنترل مرورگر OpenClaw اسکرین‌شات‌ها را ثبت می‌کند.
- **نجات VNC**: روی همان VM فعال می‌شود وقتی ورود، MFA، ضداتوماسیون Discord،
  یا اشکال‌زدایی بصری به انسان نیاز دارد.

پروفایل مرورگر ناظر Discord باید به‌اندازه کافی پایدار باشد تا برای هر اجرا
نیاز به ورود دوباره نباشد، اما از وضعیت مرورگر شخصی جدا باشد. یک پروفایل
متعلق به استخر ماشین Mantis است، نه لپ‌تاپ توسعه‌دهنده.

وقتی Mantis گیر می‌کند، یک پیام وضعیت Discord با این موارد ارسال می‌کند:

- شناسه اجرا
- شناسه سناریو
- ارائه‌دهنده ماشین
- دایرکتوری artifact
- دستورالعمل‌های اتصال VNC یا noVNC در صورت موجود بودن
- متن کوتاه مانع

اولین استقرار خصوصی می‌تواند این پیام‌ها را در کانال اپراتور موجود ارسال کند
و بعدا به یک کانال اختصاصی Mantis منتقل شود.

## ماشین‌ها

Mantis باید برای اولین پیاده‌سازی راه‌دور، AWS از طریق Crabbox را ترجیح دهد.
Crabbox ماشین‌های آماده، رهگیری اجاره، hydration، لاگ‌ها، نتایج، و پاک‌سازی را
در اختیار ما می‌گذارد. اگر ظرفیت AWS بیش از حد کند یا ناموجود بود، یک
ارائه‌دهنده Hetzner پشت همان رابط ماشین اضافه کنید.

حداقل نیازمندی‌های VM:

- Linux با نصب Chrome یا Chromium قابل استفاده برای دسکتاپ
- دسترسی CDP برای اتوماسیون مرورگر
- VNC یا noVNC برای نجات
- Node 22 و pnpm
- checkout از OpenClaw و cache وابستگی‌ها
- cache مرورگر Playwright Chromium وقتی از Playwright استفاده می‌شود
- CPU و حافظه کافی برای یک OpenClaw Gateway، یک مرورگر، و یک اجرای مدل
- دسترسی خروجی به Discord، GitHub، ارائه‌دهندگان مدل، و کارگزار اعتبارنامه

VM نباید رازهای خام بلندمدت را بیرون از مخزن‌های مورد انتظار اعتبارنامه یا
پروفایل مرورگر نگه دارد.

## رازها

رازها برای اجراهای راه‌دور در رازهای سازمان یا مخزن GitHub، و برای اجراهای
محلی در یک فایل راز تحت کنترل اپراتور محلی قرار می‌گیرند.

نام‌های پیشنهادی راز:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` برای بارگذاری artifact عمومی GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

در بلندمدت، استخر اعتبارنامه Convex باید منبع عادی برای اعتبارنامه‌های زنده
انتقال باقی بماند. رازهای GitHub کارگزار و مسیرهای fallback را bootstrap
می‌کنند. workflow واکنش‌های وضعیت Discord رازهای Mantis Crabbox را دوباره به
متغیرهای محیطی `CRABBOX_COORDINATOR` و `CRABBOX_COORDINATOR_TOKEN` نگاشت می‌کند
که CLI مربوط به Crabbox انتظار دارد. نام‌های ساده راز GitHub با الگوی
`CRABBOX_*` همچنان به‌عنوان fallback سازگاری پذیرفته می‌شوند.

runner مربوط به Mantis هرگز نباید این موارد را چاپ کند:

- توکن‌های بات Discord
- کلیدهای API ارائه‌دهنده
- کوکی‌های مرورگر
- محتوای پروفایل auth
- گذرواژه‌های VNC
- payloadهای خام اعتبارنامه

بارگذاری‌های artifact عمومی همچنین باید metadata هدف Discord مانند شناسه‌های
بات، guild، کانال، و پیام را پنهان‌سازی کنند. workflow smoke در GitHub به همین
دلیل `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` را فعال می‌کند.

اگر یک توکن به‌طور تصادفی در issue، PR، چت، یا لاگ paste شد، پس از ذخیره شدن
راز جدید آن را rotate کنید.

## artifactهای GitHub و نظرهای PR

workflowهای Mantis باید بسته کامل شواهد را به‌عنوان یک artifact کوتاه‌عمر
Actions بارگذاری کنند. وقتی workflow برای یک گزارش باگ یا PR رفع اجرا می‌شود،
باید رسانه inline پنهان‌سازی‌شده را نیز در bucket پیکربندی‌شده Mantis در
R2/S3 منتشر کند و یک نظر با اسکرین‌شات‌های inline قبل/بعد روی آن باگ یا PR رفع
upsert کند. اثبات اصلی را فقط روی یک PR عمومی اتوماسیون QA منتشر نکنید. لاگ‌های
خام، پیام‌های مشاهده‌شده، و دیگر شواهد حجیم در artifact مربوط به Actions باقی
می‌مانند.

workflowهای production باید این نظرها را با GitHub App مربوط به Mantis ارسال
کنند، نه با `github-actions[bot]`. شناسه app و کلید خصوصی را به‌عنوان رازهای
GitHub Actions با نام‌های `MANTIS_GITHUB_APP_ID` و
`MANTIS_GITHUB_APP_PRIVATE_KEY` ذخیره کنید. workflow از یک marker مخفی به‌عنوان
کلید upsert استفاده می‌کند، وقتی token بتواند آن را ویرایش کند همان نظر را
به‌روزرسانی می‌کند، و وقتی marker قدیمی متعلق به بات قابل ویرایش نباشد یک نظر
جدید متعلق به Mantis ایجاد می‌کند.

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

وقتی اجرا به‌دلیل شکست harness ناموفق می‌شود، نظر باید همین را بگوید نه اینکه
القا کند candidate شکست خورده است.

## یادداشت‌های استقرار خصوصی

یک استقرار خصوصی ممکن است از قبل یک برنامه Discord برای Mantis داشته باشد. اگر
آن برنامه مجوزهای بات مناسب را دارد و می‌توان آن را به‌صورت امن rotate کرد، به
جای ساختن app دیگر، از همان برنامه دوباره استفاده کنید.

کانال اولیه اعلان اپراتور را از طریق رازها یا پیکربندی استقرار تنظیم کنید. این
کانال ابتدا می‌تواند به یک کانال موجود maintainer یا عملیات اشاره کند، سپس پس
از ایجاد کانال اختصاصی Mantis به آن منتقل شود.

شناسه‌های guild، شناسه‌های کانال، توکن‌های بات، کوکی‌های مرورگر، یا گذرواژه‌های
VNC را در این سند قرار ندهید. آن‌ها را در رازهای GitHub، کارگزار اعتبارنامه، یا
مخزن راز محلی اپراتور ذخیره کنید.

## افزودن یک سناریو

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
- ارجاع‌های پیام Discord برای باگ‌های thread
- thread ts و وضعیت API واکنش Slack برای باگ‌های Slack
- شناسه‌ها و headerهای پیام ایمیل برای باگ‌های ایمیل
- اسکرین‌شات‌های مرورگر وقتی UI تنها مشاهده‌پذیر قابل اعتماد است

بررسی‌های vision باید افزایشی باشند. اگر API پلتفرم بتواند باگ را اثبات کند،
از API به‌عنوان oracle قبولی/شکست استفاده کنید و اسکرین‌شات‌ها را برای اطمینان
انسانی نگه دارید.

## گسترش ارائه‌دهنده

پس از Discord، همان runner می‌تواند این موارد را اضافه کند:

- Slack: واکنش‌ها، threadها، mentionهای app، modalها، بارگذاری فایل.
- ایمیل: auth در Gmail و thread کردن پیام با استفاده از `gog` در جایی که connectorها کافی نیستند.
- WhatsApp: ورود QR، شناسایی دوباره، تحویل پیام، رسانه، واکنش‌ها.
- Telegram: gate کردن mention گروهی، فرمان‌ها، واکنش‌ها در صورت موجود بودن.
- Matrix: اتاق‌های رمزگذاری‌شده، رابطه‌های thread یا پاسخ، ازسرگیری پس از restart.

هر انتقال باید یک سناریوی smoke ارزان و یک یا چند سناریوی کلاس باگ داشته باشد.
سناریوهای بصری پرهزینه باید opt-in باقی بمانند.

## پرسش‌های باز

- وقتی بات موجود Mantis دوباره استفاده می‌شود، کدام بات Discord باید driver
  باشد و کدام باید SUT باشد؟
- آیا ورود مرورگر ناظر باید از یک حساب انسانی Discord، یک حساب آزمایشی، یا فقط
  شواهد REST قابل‌خواندن توسط بات برای فاز اول استفاده کند؟
- GitHub چه مدت باید artifactهای Mantis را برای PRها نگه دارد؟
- ClawSweeper چه زمانی باید به‌جای انتظار برای فرمان maintainer، Mantis را
  به‌صورت خودکار پیشنهاد کند؟
- آیا اسکرین‌شات‌ها باید پیش از بارگذاری برای PRهای عمومی پنهان‌سازی یا crop شوند؟
