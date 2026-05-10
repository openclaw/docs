---
read_when:
    - ساخت یا اجرای تضمین کیفیت بصری زنده برای باگ‌های OpenClaw
    - افزودن راستی‌آزمایی قبل و بعد برای یک درخواست کشش
    - افزودن سناریوهای انتقال زنده‌ی Discord، Slack، WhatsApp یا موارد دیگر
    - اشکال‌زدایی اجراهای QA که به اسکرین‌شات، خودکارسازی مرورگر یا دسترسی VNC نیاز دارند
summary: Mantis سامانهٔ راستی‌آزمایی بصری سرتاسری برای بازتولید باگ‌های OpenClaw روی ترابردهای زنده، ثبت شواهد قبل و بعد، و پیوست کردن مصنوعات به PRها است.
title: آخوندک
x-i18n:
    generated_at: "2026-05-10T19:35:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1622b86cb5e08def1c8f06a16a0f454c67a58cf42f6c08c40bd66754648b9a95
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis سامانهٔ راستی‌آزمایی سرتاسری OpenClaw برای باگ‌هایی است که به یک
runtime واقعی، یک انتقال واقعی، و مدرک قابل مشاهده نیاز دارند. این سامانه یک
سناریو را روی یک ref بدِ شناخته‌شده اجرا می‌کند، شواهد را ثبت می‌کند، همان
سناریو را روی یک ref کاندیدا اجرا می‌کند، و مقایسه را به‌صورت آرتیفکت‌هایی
منتشر می‌کند که نگه‌دارنده بتواند از یک PR یا از یک فرمان محلی بررسی کند.

Mantis با Discord شروع می‌کند چون Discord یک مسیر اولیهٔ ارزشمند به ما می‌دهد:
احراز هویت واقعی bot، کانال‌های واقعی guild، واکنش‌ها، threadها، فرمان‌های
بومی، و یک رابط کاربری مرورگر که انسان‌ها می‌توانند در آن به‌صورت بصری تأیید
کنند انتقال چه چیزی نشان داده است.

## هدف‌ها

- بازتولید یک باگ از یک GitHub issue یا PR با همان شکل انتقالی که کاربران
  می‌بینند.
- ثبت یک آرتیفکت **قبل** روی ref مبنا، پیش از اعمال اصلاح.
- ثبت یک آرتیفکت **بعد** روی ref کاندیدا، پس از اعمال اصلاح.
- استفاده از یک oracle قطعی هر زمان ممکن باشد، مانند خواندن واکنش از Discord
  REST یا بررسی transcript کانال.
- ثبت screenshotها وقتی باگ یک سطح قابل مشاهده در رابط کاربری دارد.
- اجرا به‌صورت محلی از یک CLI تحت کنترل عامل و به‌صورت دوردست از GitHub.
- حفظ وضعیت کافی از ماشین برای نجات با VNC وقتی ورود، خودکارسازی مرورگر، یا
  احراز هویت provider گیر می‌کند.
- ارسال وضعیت موجز به یک کانال Discord اپراتور وقتی اجرا مسدود است، به کمک
  دستی VNC نیاز دارد، یا تمام می‌شود.

## غیرهدف‌ها

- Mantis جایگزین unit testها نیست. یک اجرای Mantis معمولاً پس از فهمیدن اصلاح
  باید به یک regression test کوچک‌تر تبدیل شود.
- Mantis گیت CI سریعِ عادی نیست. کندتر است، از credentialهای زنده استفاده
  می‌کند، و برای باگ‌هایی نگه داشته می‌شود که محیط زنده در آن‌ها مهم است.
- Mantis نباید برای عملیات عادی به انسان نیاز داشته باشد. VNC دستی مسیر نجات
  است، نه مسیر مطلوب.
- Mantis هیچ secret خامی را در آرتیفکت‌ها، لاگ‌ها، screenshotها، گزارش‌های
  Markdown، یا commentهای PR ذخیره نمی‌کند.

## مالکیت

Mantis در پشتهٔ QA OpenClaw قرار دارد.

- OpenClaw مالک runtime سناریو، adapterهای انتقال، schema شواهد، و CLI محلی
  زیر `pnpm openclaw qa mantis` است.
- QA Lab مالک قطعه‌های harness انتقال زنده، helperهای ثبت مرورگر، و نویسنده‌های
  آرتیفکت است.
- Crabbox مالک ماشین‌های Linux گرم‌شده وقتی یک VM دوردست لازم است.
- GitHub Actions مالک نقطهٔ ورود workflow دوردست و نگه‌داری آرتیفکت است.
- ClawSweeper مالک مسیریابی commentهای GitHub است: parse کردن فرمان‌های
  نگه‌دارنده، dispatch کردن workflow، و ارسال comment نهایی PR.
- عامل‌های OpenClaw وقتی یک سناریو به راه‌اندازی عامل‌محور، debugging، یا
  گزارش وضعیت گیرکرده نیاز دارد، Mantis را از طریق Codex هدایت می‌کنند.

این مرز، دانش انتقال را در OpenClaw، زمان‌بندی ماشین را در Crabbox، و چسب
workflow نگه‌دارنده را در ClawSweeper نگه می‌دارد.

## شکل فرمان

نخستین فرمان محلی، bot، guild، channel، ارسال message، ارسال reaction، و مسیر
آرتیفکت Discord را راستی‌آزمایی می‌کند:

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

runner زیر پوشهٔ خروجی، worktreeهای جداشدهٔ baseline و candidate می‌سازد،
dependencyها را نصب می‌کند، هر ref را build می‌کند، سناریو را با
`--allow-failures` اجرا می‌کند، سپس `baseline/`، `candidate/`،
`comparison.json`، و `mantis-report.md` را می‌نویسد. برای نخستین سناریوی
Discord، راستی‌آزمایی موفق یعنی status مبنا `fail` و status کاندیدا `pass`
است.

دومین probe قبل/بعد Discord، attachmentهای thread را هدف می‌گیرد:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

آن سناریو با driver bot یک پیام والد ارسال می‌کند، یک thread واقعی Discord
می‌سازد، action `message.thread-reply` OpenClaw را با یک `filePath` محلی repo
فراخوانی می‌کند، سپس thread را برای پاسخ SUT و نام فایل attachment poll
می‌کند. screenshot مبنا پاسخ را بدون attachment نشان می‌دهد؛ screenshot
کاندیدا attachment مورد انتظار `mantis-thread-report.md` را نشان می‌دهد.

نخستین primitive مربوط به VM/مرورگر، desktop smoke است:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

این فرمان یک ماشین desktop از Crabbox اجاره می‌کند یا دوباره استفاده می‌کند،
یک مرورگر قابل مشاهده را داخل session VNC شروع می‌کند، desktop را ثبت می‌کند،
آرتیفکت‌ها را به پوشهٔ خروجی محلی برمی‌گرداند، و فرمان اتصال مجدد را داخل
گزارش می‌نویسد. فرمان به‌صورت پیش‌فرض از provider Hetzner استفاده می‌کند چون
نخستین provider با پوشش desktop/VNC فعال در مسیر Mantis است. هنگام اجرا روی یک
fleet دیگر Crabbox، آن را با `--provider`، `--crabbox-bin`، یا
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` override کنید.

flagهای مفید desktop smoke:

- `--lease-id <cbx_...>` یا `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` یک desktop گرم‌شده را دوباره استفاده می‌کند.
- `--browser-url <url>` صفحه‌ای را که در مرورگر قابل مشاهده باز می‌شود تغییر می‌دهد.
- `--html-file <path>` یک آرتیفکت HTML محلی repo را در مرورگر قابل مشاهده render می‌کند. Mantis از این برای ثبت timeline تولیدشدهٔ status-reaction در Discord از طریق یک desktop واقعی Crabbox استفاده می‌کند.
- `--browser-profile-dir <remote-path>` یک Chrome user-data-dir دوردست را دوباره استفاده می‌کند تا یک desktop پایدار Mantis بتواند بین اجراها واردشده باقی بماند. از این برای profile طولانی‌عمر viewer مربوط به Discord Web استفاده کنید.
- `--browser-profile-archive-env <name>` یک archive پایه۶۴ `.tgz` از Chrome user-data-dir را پیش از launch مرورگر از environment variable نام‌گذاری‌شده restore می‌کند. از این برای witnessهای واردشده مانند Discord Web استفاده کنید. env var پیش‌فرض `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64` است.
- `--video-duration <seconds>` طول ثبت MP4 را کنترل می‌کند. برای web appهای واردشدهٔ کند که برای پایدار شدن به زمان نیاز دارند، از مدت طولانی‌تر استفاده کنید.
- `--keep-lease` یا `OPENCLAW_MANTIS_KEEP_VM=1` یک lease تازه‌ساخته‌شدهٔ موفق را برای بررسی VNC باز نگه می‌دارد. اجراهای ناموفق وقتی lease ساخته شده باشد به‌صورت پیش‌فرض آن را نگه می‌دارند تا اپراتور بتواند دوباره وصل شود.
- `--class`، `--idle-timeout`، و `--ttl` اندازهٔ ماشین و طول عمر lease را تنظیم می‌کنند.

برای شواهد Discord Web، Mantis به‌جای bot token از یک حساب viewer اختصاصی
استفاده می‌کند. سناریوی زندهٔ Discord API همچنان oracle باقی می‌ماند: thread
واقعی را می‌سازد، `thread-reply` مربوط به SUT را ارسال می‌کند، و attachment را
از طریق Discord REST بررسی می‌کند. وقتی
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` تنظیم شده باشد، سناریو یک آرتیفکت
URL مربوط به Discord Web هم می‌نویسد. وقتی `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`
تنظیم شده باشد، آن thread را آن‌قدر در دسترس نگه می‌دارد که یک مرورگر واردشده
بتواند آن را باز و ضبط کند.

workflow در GitHub، URL مربوط به thread کاندیدا را در Discord Web باز می‌کند،
screenshot می‌گیرد، یک MP4 ضبط می‌کند، و وقتی ابزار رسانه‌ای Crabbox در دسترس
باشد یک preview کوتاه‌شدهٔ GIF تولید می‌کند. مسیر profile پایدار viewer که از
طریق `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` پیکربندی شده باشد را ترجیح
دهید، چون archiveهای کامل Chrome profile ممکن است از سقف اندازهٔ secret در
GitHub بزرگ‌تر شوند. برای profileهای کوچک/bootstrap، workflow همچنین می‌تواند
یک archive پایه۶۴ `.tgz` را از `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`
restore کند. اگر هیچ منبع profile پیکربندی نشده باشد، workflow همچنان
screenshotهای قطعی attachment مربوط به baseline/candidate را منتشر می‌کند و
یک notice ثبت می‌کند که witness واردشدهٔ Discord Web رد شده است.

نخستین primitive کامل انتقال desktop، Slack desktop smoke است:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

این فرمان یک ماشین desktop از Crabbox اجاره می‌کند یا دوباره استفاده می‌کند،
checkout فعلی را داخل VM sync می‌کند، `pnpm openclaw qa slack` را داخل آن VM
اجرا می‌کند، Slack Web را در مرورگر VNC باز می‌کند، desktop قابل مشاهده را ثبت
می‌کند، و هم آرتیفکت‌های Slack QA و هم screenshot مربوط به VNC را به پوشهٔ
خروجی محلی کپی می‌کند. این نخستین شکل Mantis است که در آن Gateway مربوط به SUT
OpenClaw و مرورگر هر دو داخل همان VM desktop Linux زندگی می‌کنند.

با `--gateway-setup`، فرمان یک home یک‌بارمصرف پایدار OpenClaw را در
`$HOME/.openclaw-mantis/slack-openclaw` آماده می‌کند، پیکربندی Slack Socket Mode
را برای کانال انتخاب‌شده patch می‌کند، `openclaw gateway run` را روی port
`38973` شروع می‌کند، و Chrome را در session VNC در حال اجرا نگه می‌دارد. این
حالت «یک desktop Linux با Slack و یک claw در حال اجرا برای من باقی بگذار» است؛
وقتی `--gateway-setup` حذف شود، مسیر Slack QA bot-to-bot همچنان پیش‌فرض است.

ورودی‌های لازم برای `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` برای مسیر model دوردست. اگر فقط
  `OPENAI_API_KEY` به‌صورت محلی تنظیم شده باشد، Mantis پیش از فراخوانی Crabbox
  آن را به `OPENCLAW_LIVE_OPENAI_KEY` map می‌کند تا env forwarding مربوط به
  `OPENCLAW_*` در Crabbox بتواند آن را به VM منتقل کند.

با `--gateway-setup --credential-source convex`، Mantis پیش از ساخت VM،
credential مربوط به Slack SUT را از pool مشترک اجاره می‌کند و channel id اجاره
شده، Socket Mode app token، و bot token را به‌عنوان envهای runtime با نام
`OPENCLAW_MANTIS_SLACK_*` داخل desktop forward می‌کند. این GitHub workflowها
را سبک نگه می‌دارد: آن‌ها فقط به secret مربوط به broker در Convex نیاز دارند،
نه tokenهای خام bot یا app در Slack.

flagهای مفید Slack desktop:

- `--lease-id <cbx_...>` دوباره روی ماشینی اجرا می‌شود که اپراتور قبلاً از طریق VNC وارد Slack Web شده است.
- `--gateway-setup` به‌جای فقط اجرای مسیر bot-to-bot QA، یک Gateway پایدار OpenClaw Slack را در VM شروع می‌کند.
- `--keep-lease` پس از موفقیت، VM مربوط به Gateway را برای بررسی VNC باز نگه می‌دارد؛ `--no-keep-lease` پس از جمع‌آوری آرتیفکت‌ها آن را متوقف می‌کند.
- `--slack-url <url>` یک URL مشخص از Slack Web را باز می‌کند. بدون آن، وقتی SUT bot token در دسترس باشد، Mantis مقدار `https://app.slack.com/client/<team>/<channel>` را از Slack `auth.test` به دست می‌آورد.
- `--slack-channel-id <id>` allowlist کانال Slack را که setup مربوط به Gateway استفاده می‌کند کنترل می‌کند.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` profile پایدار Chrome داخل VM را کنترل می‌کند. پیش‌فرض `$HOME/.config/openclaw-mantis/slack-chrome-profile` است، بنابراین ورود دستی Slack Web روی همان lease در اجرای دوباره باقی می‌ماند.
- `--credential-source convex --credential-role ci` به‌جای tokenهای مستقیم Slack در env، از pool مشترک credential استفاده می‌کند.
- `--provider-mode`، `--model`، `--alt-model`، و `--fast` به مسیر زندهٔ Slack pass-through می‌شوند.

workflow مربوط به smoke در GitHub با نام `Mantis Discord Smoke` است. workflow
قبل و بعد GitHub برای نخستین سناریوی واقعی `Mantis Discord Status Reactions`
است. این موارد را می‌پذیرد:

- `baseline_ref`: refای که انتظار می‌رود رفتار queued-only را بازتولید کند.
- `candidate_ref`: refای که انتظار می‌رود `queued -> thinking -> done` را نشان دهد.

این workflow ref مربوط به harness workflow را checkout می‌کند، worktreeهای جدا
برای baseline و candidate می‌سازد، `discord-status-reactions-tool-only` را روی
هر worktree اجرا می‌کند، و `baseline/`، `candidate/`، `comparison.json`، و
`mantis-report.md` را به‌عنوان آرتیفکت‌های Actions upload می‌کند. همچنین HTML
timeline هر مسیر را در یک مرورگر desktop Crabbox render می‌کند و آن screenshotهای
VNC را کنار PNGهای timeline قطعی در comment مربوط به PR منتشر می‌کند. همان
comment مربوط به PR، previewهای GIF سبک و motion-trimmed تولیدشده توسط
`crabbox media preview` را embed می‌کند، به clipهای MP4 motion-trimmed متناظر
link می‌دهد، و فایل‌های کامل MP4 از desktop را برای بررسی عمیق نگه می‌دارد.
screenshotها برای مرور سریع به‌صورت inline باقی می‌مانند. workflow، CLI مربوط
به Crabbox را از main در `openclaw/crabbox` build می‌کند تا بتواند پیش از cut
شدن release بعدی binary مربوط به Crabbox، از flagهای فعلی lease
desktop/browser استفاده کند.

`Mantis Scenario` نقطهٔ ورود دستی عمومی است. یک `scenario_id`،
`candidate_ref`، `baseline_ref` اختیاری، و `pr_number` اختیاری می‌گیرد، سپس
workflow متعلق به سناریو را dispatch می‌کند. wrapper عمداً نازک است:
workflowهای سناریو همچنان مالک setup انتقال، credentialها، کلاس VM، oracle
مورد انتظار، و manifest آرتیفکت خود هستند.

`Mantis Slack Desktop Smoke` نخستین گردش‌کار VM مربوط به Slack است. این گردش‌کار
ارجاع کاندیدای مورد اعتماد را در یک درخت کاری جداگانه checkout می‌کند، یک دسکتاپ Linux
از Crabbox اجاره می‌کند، دستور `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` را روی همان
کاندیدا اجرا می‌کند، Slack Web را در مرورگر VNC باز می‌کند، دسکتاپ را ضبط می‌کند، با
`crabbox media preview` یک پیش‌نمایش کوتاه‌شده بر اساس حرکت تولید می‌کند، کل
دایرکتوری آرتیفکت را بارگذاری می‌کند، و در صورت انتخاب، نظر شواهد درون‌خطی را روی PR هدف
ارسال می‌کند. به‌طور پیش‌فرض برای اجاره دسکتاپ از AWS استفاده می‌کند و یک ورودی دستی
برای ارائه‌دهنده در اختیار می‌گذارد تا اپراتورها وقتی ظرفیت AWS کند یا ناموجود است
به Hetzner تغییر دهند. وقتی به‌جای صرفا یک رونوشت Slack بات‌به‌بات، «یک دسکتاپ Linux
با Slack و یک claw در حال اجرا» می‌خواهید، از این مسیر استفاده کنید.

`Mantis Telegram Live` مسیر موجود QA زنده Telegram را در همان خط لوله شواهد PR
بسته‌بندی می‌کند. این مسیر ارجاع کاندیدای مورد اعتماد را در یک درخت کاری جداگانه
checkout می‌کند، `pnpm openclaw qa telegram --credential-source convex
--credential-role ci` را اجرا می‌کند، از خلاصه QA Telegram و آرتیفکت پیام مشاهده‌شده
یک مانیفست `mantis-evidence.json` می‌نویسد، رونوشت HTML ویرایش‌شده را از طریق مرورگر
دسکتاپ Crabbox رندر می‌کند، با `crabbox media preview` یک GIF کوتاه‌شده بر اساس حرکت
تولید می‌کند، و وقتی شماره PR موجود باشد، نظر شواهد درون‌خطی PR را ارسال می‌کند. این
مسیر به‌جای اثبات Telegram Web با ورود انجام‌شده، بصری‌سازی رونوشت است: Telegram Bot API
شواهد پیام زنده پایدار می‌دهد، اما وضعیت ورود Telegram Web برای خودکارسازی معمول Mantis
لازم نیست.

برای راه‌اندازی دسکتاپ Telegram با حضور انسان در چرخه، از سازنده سناریو استفاده کنید:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

سازنده یک دسکتاپ Crabbox را اجاره یا دوباره استفاده می‌کند، باینری بومی Telegram Desktop
برای Linux را نصب می‌کند، در صورت انتخاب آرشیو نشست کاربر را بازیابی می‌کند، OpenClaw را
با توکن بات Telegram SUT اجاره‌شده پیکربندی می‌کند، `openclaw gateway run` را روی پورت
`38974` شروع می‌کند، یک پیام آمادگی از بات راه‌انداز به گروه خصوصی اجاره‌شده ارسال
می‌کند، سپس از دسکتاپ قابل مشاهده VNC اسکرین‌شات و MP4 می‌گیرد. توکن بات هرگز به
Telegram Desktop وارد نمی‌شود؛ فقط OpenClaw را پیکربندی می‌کند. نمایشگر دسکتاپ یک
نشست کاربر جداگانه Telegram است که از `--telegram-profile-archive-env <name>` بازیابی
می‌شود یا به‌صورت دستی از طریق VNC ساخته می‌شود و با `--keep-lease` زنده نگه داشته می‌شود.

پرچم‌های مفید سازنده دسکتاپ Telegram:

- `--lease-id <cbx_...>` اجرا را دوباره روی VMای انجام می‌دهد که یک اپراتور از قبل در آن وارد Telegram Desktop شده است.
- `--telegram-profile-archive-env <name>` یک آرشیو پروفایل Telegram Desktop با قالب base64 `.tgz` را از آن متغیر محیطی می‌خواند و پیش از اجرا بازیابی می‌کند.
- `--telegram-profile-dir <remote-path>` دایرکتوری راه دور پروفایل Telegram Desktop را کنترل می‌کند. مقدار پیش‌فرض `$HOME/.local/share/TelegramDesktop` است.
- `--no-gateway-setup` Telegram Desktop را بدون پیکربندی OpenClaw نصب و باز می‌کند.
- `--credential-source convex --credential-role ci` به‌جای توکن‌های مستقیم محیطی Telegram، از کارگزار اعتبارنامه مشترک استفاده می‌کند.

هر سناریوی منتشرکننده PR در کنار گزارش خود `mantis-evidence.json` می‌نویسد.
این schema محل تحویل بین کد سناریو و نظرهای GitHub است:

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

مقادیر `path` آرتیفکت نسبت به دایرکتوری مانیفست هستند. مقادیر `targetPath`
مسیرهای نسبی زیر دایرکتوری انتشار شاخه `qa-artifacts` هستند. منتشرکننده پیمایش مسیر
را رد می‌کند و وقتی پیش‌نمایش‌ها یا ویدیوهای اختیاری در دسترس نباشند، ورودی‌های
نشانه‌گذاری‌شده با `"required": false` را نادیده می‌گیرد.

گونه‌های آرتیفکت پشتیبانی‌شده:

- `timeline`: اسکرین‌شات تعیین‌پذیر سناریو، معمولا قبل/بعد.
- `desktopScreenshot`: اسکرین‌شات دسکتاپ VNC/مرورگر.
- `motionPreview`: GIF متحرک درون‌خطی تولیدشده از ضبط دسکتاپ.
- `motionClip`: MP4 کوتاه‌شده بر اساس حرکت که ابتدای بی‌حرکت و انتهای بی‌حرکت را حذف می‌کند.
- `fullVideo`: ضبط کامل MP4 برای بررسی عمیق.
- `metadata`: فایل جانبی JSON/log.
- `report`: گزارش Markdown.

منتشرکننده قابل استفاده مجدد `scripts/mantis/publish-pr-evidence.mjs` است. گردش‌کارها
آن را با مانیفست، PR هدف، ریشه هدف `qa-artifacts`، نشانگر نظر، URL آرتیفکت Actions،
URL اجرا، و منبع درخواست فراخوانی می‌کنند. این ابزار آرتیفکت‌های اعلام‌شده را به شاخه
`qa-artifacts` کپی می‌کند، یک نظر PR با اولویت خلاصه و شامل تصاویر/پیش‌نمایش‌های درون‌خطی
و ویدیوهای پیوندشده می‌سازد، سپس نظر نشانگر موجود را به‌روزرسانی می‌کند یا یک مورد
جدید می‌سازد.

همچنین می‌توانید اجرای واکنش‌های وضعیت را مستقیما از یک نظر PR آغاز کنید:

```text
@Mantis discord status reactions
```

محرک نظر عمدا محدود است. فقط روی نظرهای pull request از کاربرانی با دسترسی write،
maintain یا admin اجرا می‌شود و فقط درخواست‌های واکنش وضعیت Discord را تشخیص می‌دهد.
به‌طور پیش‌فرض از ارجاع مبنای پایه بد شناخته‌شده و SHA سر فعلی PR به‌عنوان کاندیدا
استفاده می‌کند. نگهدارندگان می‌توانند هر یک از ارجاع‌ها را override کنند:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

QA زنده Telegram نیز می‌تواند از یک نظر PR آغاز شود:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

به‌طور پیش‌فرض از SHA سر فعلی PR به‌عنوان کاندیدا استفاده می‌کند و
`telegram-status-command` را اجرا می‌کند. وقتی نگهدارندگان به یک ارجاع مشخص یا یک
دسکتاپ Crabbox ازپیش‌گرم‌شده نیاز داشته باشند، می‌توانند `candidate=...`،
`provider=aws|hetzner`، و `lease=<cbx_...>` را override کنند.

نمونه‌های دستور ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

دستور اول صریح و متمرکز بر سناریو است. دستور دوم بعدا می‌تواند یک PR یا issue را بر
اساس برچسب‌ها، فایل‌های تغییریافته، و یافته‌های بازبینی ClawSweeper به سناریوهای
پیشنهادی Mantis نگاشت کند.

## چرخه عمر اجرا

1. اعتبارنامه‌ها را دریافت کنید.
2. یک VM تخصیص دهید یا دوباره استفاده کنید.
3. وقتی سناریو به شواهد UI نیاز دارد، پروفایل دسکتاپ/مرورگر را آماده کنید.
4. یک checkout تمیز برای ارجاع مبنای پایه آماده کنید.
5. وابستگی‌ها را نصب کنید و فقط چیزی را بسازید که سناریو لازم دارد.
6. یک OpenClaw Gateway فرزند را با دایرکتوری وضعیت ایزوله شروع کنید.
7. انتقال زنده، ارائه‌دهنده، مدل، و پروفایل مرورگر را پیکربندی کنید.
8. سناریو را اجرا کنید و شواهد مبنای پایه را بگیرید.
9. Gateway را متوقف کنید و logها را نگه دارید.
10. ارجاع کاندیدا را در همان VM آماده کنید.
11. همان سناریو را اجرا کنید و شواهد کاندیدا را بگیرید.
12. نتایج oracle و شواهد بصری را مقایسه کنید.
13. Markdown، JSON، logها، اسکرین‌شات‌ها، و آرتیفکت‌های trace اختیاری را بنویسید.
14. آرتیفکت‌های GitHub Actions را بارگذاری کنید.
15. یک پیام وضعیت کوتاه PR یا Discord ارسال کنید.

سناریو باید بتواند به دو روش متفاوت شکست بخورد:

- **بازتولید باگ**: مبنای پایه به روش مورد انتظار شکست خورد.
- **شکست harness**: راه‌اندازی محیط، اعتبارنامه‌ها، Discord API، مرورگر، یا
  ارائه‌دهنده پیش از معنادار شدن oracle باگ شکست خورد.

گزارش نهایی باید این موارد را جدا کند تا نگهدارندگان یک محیط ناپایدار را با رفتار
محصول اشتباه نگیرند.

## MVP Discord

سناریوی اول باید واکنش‌های وضعیت Discord در کانال‌های guild را هدف بگیرد که در آن‌ها
حالت تحویل پاسخ منبع `message_tool_only` است.

دلیل اینکه بذر خوبی برای Mantis است:

- در Discord به‌صورت واکنش‌ها روی پیام آغازگر قابل مشاهده است.
- از طریق وضعیت واکنش پیام Discord یک oracle قوی REST دارد.
- یک OpenClaw Gateway واقعی، احراز هویت بات Discord، ارسال پیام، حالت تحویل پاسخ
  منبع، وضعیت واکنش وضعیت، و چرخه عمر نوبت مدل را تمرین می‌کند.
- آن‌قدر محدود است که نخستین پیاده‌سازی را دقیق نگه دارد.

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

شواهد مبنای پایه باید واکنش تایید در صف قرار گرفتن را نشان دهد اما در حالت tool-only
هیچ گذار چرخه عمری نشان ندهد. شواهد کاندیدا باید نشان دهد وقتی
`messages.statusReactions.enabled` صراحتا `true` است، واکنش‌های وضعیت چرخه عمر اجرا
می‌شوند.

نخستین بخش اجرایی، سناریوی QA زنده Discord با opt-in است:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

این دستور SUT را با رسیدگی همیشگی به guild، `visibleReplies:
"message_tool"`، `ackReaction: "👀"`، و واکنش‌های وضعیت صریح پیکربندی می‌کند. oracle
پیام آغازگر واقعی Discord را poll می‌کند و انتظار دنباله مشاهده‌شده
`👀 -> 🤔 -> 👍` را دارد. آرتیفکت‌ها شامل `discord-qa-reaction-timelines.json`،
`discord-status-reactions-tool-only-timeline.html`، و
`discord-status-reactions-tool-only-timeline.png` هستند.

## قطعات QA موجود

Mantis باید به‌جای شروع از صفر، روی پشته QA خصوصی موجود ساخته شود:

- `pnpm openclaw qa discord` از قبل یک مسیر زنده Discord را با بات‌های راه‌انداز و
  SUT اجرا می‌کند.
- اجراکننده انتقال زنده از قبل گزارش‌ها و آرتیفکت‌های پیام مشاهده‌شده را زیر
  `.artifacts/qa-e2e/` می‌نویسد.
- اجاره‌های اعتبارنامه Convex از قبل دسترسی انحصاری به اعتبارنامه‌های مشترک انتقال
  زنده را فراهم می‌کنند.
- سرویس کنترل مرورگر از قبل از اسکرین‌شات‌ها، snapshotها، پروفایل‌های مدیریت‌شده
  headless، و پروفایل‌های CDP راه دور پشتیبانی می‌کند.
- QA Lab از قبل UI اشکال‌زدا و bus برای آزمون شبیه انتقال دارد.

نخستین پیاده‌سازی Mantis می‌تواند یک اجراکننده نازک قبل/بعد روی این قطعات، به‌همراه
یک لایه شواهد بصری باشد.

## مدل شواهد

هر اجرا یک دایرکتوری آرتیفکت پایدار می‌نویسد:

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

`mantis-summary.json` باید منبع حقیقت قابل خواندن توسط ماشین باشد. گزارش Markdown
برای نظرهای PR و بازبینی انسانی است.

خلاصه باید شامل این موارد باشد:

- ارجاع‌ها و SHAهای آزموده‌شده
- انتقال و شناسه سناریو
- ارائه‌دهنده ماشین و شناسه ماشین یا شناسه اجاره
- منبع اعتبارنامه بدون مقادیر محرمانه
- نتیجه مبنای پایه
- نتیجه کاندیدا
- اینکه آیا باگ روی مبنای پایه بازتولید شد
- اینکه آیا کاندیدا آن را اصلاح کرد
- مسیرهای آرتیفکت
- مشکلات پاک‌سازی یا راه‌اندازی پاک‌سازی‌شده

اسکرین‌شات‌ها شواهد هستند، نه secret. همچنان به انضباط ویرایش نیاز دارند:
نام کانال‌های خصوصی، نام‌های کاربری، یا محتوای پیام ممکن است ظاهر شوند. برای PRهای عمومی،
تا زمانی که داستان ویرایش قوی‌تر نشده است، پیوندهای آرتیفکت GitHub Actions را به
تصاویر درون‌خطی ترجیح دهید.

## مرورگر و VNC

مسیر مرورگر دو حالت دارد:

- **خودکارسازی headless**: پیش‌فرض برای CI. Chrome با CDP فعال اجرا می‌شود، و
  Playwright یا کنترل مرورگر OpenClaw اسکرین‌شات‌ها را می‌گیرد.
- **نجات VNC**: روی همان VM فعال می‌شود وقتی ورود، MFA، ضدخودکارسازی Discord، یا
  اشکال‌زدایی بصری به انسان نیاز دارد.

پروفایل مرورگر ناظر Discord باید به‌اندازه‌ای پایدار باشد که برای هر اجرا نیاز به ورود
نباشد، اما از وضعیت مرورگر شخصی ایزوله باشد. یک پروفایل متعلق به pool ماشین Mantis است،
نه لپ‌تاپ توسعه‌دهنده.

وقتی Mantis گیر می‌کند، یک پیام وضعیت Discord با این موارد ارسال می‌کند:

- شناسهٔ اجرا
- شناسهٔ سناریو
- ارائه‌دهندهٔ ماشین
- دایرکتوری آرتیفکت
- دستورالعمل‌های اتصال VNC یا noVNC در صورت وجود
- متن کوتاهِ مسدودکننده

اولین استقرار خصوصی می‌تواند این پیام‌ها را در کانال موجود اپراتور منتشر کند
و بعداً به یک کانال اختصاصی Mantis منتقل شود.

## ماشین‌ها

Mantis باید برای اولین پیاده‌سازی راه‌دور، AWS از طریق Crabbox را ترجیح دهد.
Crabbox ماشین‌های آماده، رهگیری اجاره، آب‌دهی، لاگ‌ها، نتایج و پاک‌سازی را
در اختیار ما می‌گذارد. اگر ظرفیت AWS بیش از حد کند یا در دسترس نبود، یک
ارائه‌دهندهٔ Hetzner را پشت همان واسط ماشین اضافه کنید.

حداقل نیازمندی‌های VM:

- Linux با نصب Chrome یا Chromium مناسب دسکتاپ
- دسترسی CDP برای خودکارسازی مرورگر
- VNC یا noVNC برای نجات
- Node 22 و pnpm
- checkout مربوط به OpenClaw و کش وابستگی‌ها
- کش مرورگر Playwright Chromium وقتی از Playwright استفاده می‌شود
- CPU و حافظهٔ کافی برای یک OpenClaw Gateway، یک مرورگر، و یک اجرای مدل
- دسترسی خروجی به Discord، GitHub، ارائه‌دهندگان مدل، و واسطهٔ اعتبارنامه

VM نباید اسرار خام بلندمدت را بیرون از محل‌های مورد انتظارِ اعتبارنامه یا
ذخیرهٔ پروفایل مرورگر نگه دارد.

## اسرار

اسرار برای اجراهای راه‌دور در اسرار سازمان یا مخزن GitHub، و برای اجراهای محلی
در یک فایل محرمانهٔ تحت کنترل اپراتور محلی قرار می‌گیرند.

نام‌های پیشنهادی اسرار:

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

در بلندمدت، مجموعهٔ اعتبارنامهٔ Convex باید منبع عادی اعتبارنامه‌های انتقال
زنده باقی بماند. اسرار GitHub واسطه و مسیرهای پشتیبان را راه‌اندازی اولیه
می‌کنند. گردش‌کار واکنش‌های وضعیت Discord اسرار Mantis Crabbox را دوباره به
متغیرهای محیطی `CRABBOX_COORDINATOR` و `CRABBOX_COORDINATOR_TOKEN` نگاشت می‌کند
که CLI مربوط به Crabbox انتظار دارد. نام‌های سادهٔ اسرار GitHub با الگوی
`CRABBOX_*` همچنان به‌عنوان پشتیبان سازگاری پذیرفته می‌شوند.

رانر Mantis هرگز نباید موارد زیر را چاپ کند:

- توکن‌های بات Discord
- کلیدهای API ارائه‌دهنده
- کوکی‌های مرورگر
- محتوای پروفایل احراز هویت
- گذرواژه‌های VNC
- payloadهای خام اعتبارنامه

بارگذاری آرتیفکت‌های عمومی همچنین باید فرادادهٔ مقصد Discord مانند شناسه‌های
بات، guild، کانال و پیام را حذف یا پوشیده کند. گردش‌کار smoke در GitHub به همین
دلیل `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` را فعال می‌کند.

اگر توکنی تصادفاً در یک issue، PR، چت، یا لاگ چسبانده شد، پس از ذخیره شدن
secret جدید آن را بچرخانید.

## آرتیفکت‌های GitHub و نظرهای PR

گردش‌کارهای Mantis باید بستهٔ کامل شواهد را به‌عنوان یک آرتیفکت کوتاه‌عمر
Actions بارگذاری کنند. وقتی گردش‌کار برای یک گزارش باگ یا PR رفع اجرا می‌شود،
باید اسکرین‌شات‌های PNG پوشیده‌شده را هم در شاخهٔ `qa-artifacts` منتشر کند و
یک نظر را روی همان باگ یا PR رفع با اسکرین‌شات‌های درون‌خطی قبل/بعد upsert کند.
اثبات اصلی را فقط روی یک PR عمومی خودکارسازی QA منتشر نکنید. لاگ‌های خام،
پیام‌های مشاهده‌شده، و سایر شواهد حجیم در آرتیفکت Actions باقی می‌مانند.

گردش‌کارهای تولیدی باید آن نظرها را با GitHub App مربوط به Mantis منتشر کنند،
نه با `github-actions[bot]`. شناسهٔ app و کلید خصوصی را به‌عنوان اسرار
GitHub Actions با نام‌های `MANTIS_GITHUB_APP_ID` و
`MANTIS_GITHUB_APP_PRIVATE_KEY` ذخیره کنید. گردش‌کار از یک نشانگر پنهان به‌عنوان
کلید upsert استفاده می‌کند، وقتی توکن بتواند آن را ویرایش کند همان نظر را
به‌روزرسانی می‌کند، و وقتی یک نشانگر قدیمیِ متعلق به بات قابل ویرایش نباشد یک
نظر جدید متعلق به Mantis ایجاد می‌کند.

نظر PR باید کوتاه و تصویری باشد:

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

وقتی اجرا به‌دلیل شکست harness ناموفق می‌شود، نظر باید همین را بگوید، نه اینکه
القای شکست candidate را داشته باشد.

## یادداشت‌های استقرار خصوصی

یک استقرار خصوصی ممکن است از قبل یک برنامهٔ Discord برای Mantis داشته باشد.
وقتی آن برنامه مجوزهای درست بات را دارد و می‌توان آن را با ایمنی چرخاند، به‌جای
ساختن یک app دیگر، همان را دوباره استفاده کنید.

کانال اولیهٔ اعلان اپراتور را از طریق اسرار یا پیکربندی استقرار تنظیم کنید.
این کانال می‌تواند ابتدا به یک کانال موجود نگه‌دارنده یا عملیات اشاره کند، سپس
پس از ایجاد کانال اختصاصی Mantis به آن منتقل شود.

شناسه‌های guild، شناسه‌های کانال، توکن‌های بات، کوکی‌های مرورگر، یا گذرواژه‌های
VNC را در این سند قرار ندهید. آن‌ها را در اسرار GitHub، واسطهٔ اعتبارنامه، یا
ذخیرهٔ اسرار محلی اپراتور نگه دارید.

## افزودن یک سناریو

یک سناریوی Mantis باید موارد زیر را اعلام کند:

- شناسه و عنوان
- انتقال
- اعتبارنامه‌های لازم
- سیاست ref برای baseline
- سیاست ref برای candidate
- وصلهٔ پیکربندی OpenClaw
- گام‌های راه‌اندازی
- محرک
- oracle مورد انتظار baseline
- oracle مورد انتظار candidate
- اهداف ضبط تصویری
- بودجهٔ timeout
- گام‌های پاک‌سازی

سناریوها باید oracleهای کوچک و typed را ترجیح دهند:

- وضعیت واکنش Discord برای باگ‌های واکنش
- ارجاع‌های پیام Discord برای باگ‌های threading
- thread ts در Slack و وضعیت API واکنش برای باگ‌های Slack
- شناسه‌ها و headerهای پیام ایمیل برای باگ‌های ایمیل
- اسکرین‌شات‌های مرورگر وقتی UI تنها observable قابل اتکا است

بررسی‌های بینایی باید افزایشی باشند. اگر API پلتفرم می‌تواند باگ را اثبات کند،
از API به‌عنوان oracle قبولی/شکست استفاده کنید و اسکرین‌شات‌ها را برای اطمینان
انسانی نگه دارید.

## گسترش ارائه‌دهنده

پس از Discord، همان رانر می‌تواند موارد زیر را اضافه کند:

- Slack: واکنش‌ها، threadها، اشاره به app، modalها، بارگذاری فایل.
- Email: احراز هویت Gmail و threading پیام با استفاده از `gog` در جاهایی که connectorها کافی نیستند.
- WhatsApp: ورود با QR، شناسایی دوباره، تحویل پیام، رسانه، واکنش‌ها.
- Telegram: gate کردن اشارهٔ گروهی، فرمان‌ها، واکنش‌ها در صورت دسترسی.
- Matrix: اتاق‌های رمزگذاری‌شده، رابطه‌های thread یا پاسخ، ادامه پس از restart.

هر انتقال باید یک سناریوی smoke ارزان و یک یا چند سناریوی کلاس باگ داشته باشد.
سناریوهای تصویری پرهزینه باید opt-in باقی بمانند.

## پرسش‌های باز

- وقتی بات موجود Mantis دوباره استفاده می‌شود، کدام بات Discord باید driver باشد و کدام باید SUT باشد؟
- ورود مرورگر observer باید از یک حساب انسانی Discord، یک حساب آزمایشی، یا فقط شواهد REST قابل خواندن توسط بات برای مرحلهٔ اول استفاده کند؟
- GitHub تا چه مدت باید آرتیفکت‌های Mantis را برای PRها نگه دارد؟
- چه زمانی ClawSweeper باید به‌جای منتظر ماندن برای فرمان نگه‌دارنده، به‌صورت خودکار Mantis را پیشنهاد کند؟
- آیا اسکرین‌شات‌ها باید پیش از بارگذاری برای PRهای عمومی پوشیده یا برش داده شوند؟
