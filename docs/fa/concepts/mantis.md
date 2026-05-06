---
read_when:
    - ساخت یا اجرای تضمین کیفیت بصری زنده برای باگ‌های OpenClaw
    - افزودن راستی‌آزمایی قبل و بعد برای یک درخواست کشش
    - افزودن سناریوهای انتقال زنده برای Discord، Slack، WhatsApp یا سایر موارد
    - اشکال‌زدایی اجراهای QA که به تصاویر صفحه، خودکارسازی مرورگر یا دسترسی VNC نیاز دارند
summary: Mantis سامانه تأیید بصری سرتاسری برای بازتولید باگ‌های OpenClaw روی ترنسپورت‌های زنده، ثبت شواهد قبل و بعد، و پیوست کردن آرتیفکت‌ها به PRها است.
title: آخوندک
x-i18n:
    generated_at: "2026-05-06T09:10:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: b470cfe2b79dc6eee7382122c6ad7d1a9f7df6a1c4972254cd2672eefcf54e22
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis سامانهٔ راستی‌آزمایی سرتاسری OpenClaw برای باگ‌هایی است که به runtime واقعی، transport واقعی، و شواهد قابل مشاهده نیاز دارند. این سامانه یک سناریو را روی یک ref بدِ شناخته‌شده اجرا می‌کند، شواهد را ثبت می‌کند، همان سناریو را روی یک ref نامزد اجرا می‌کند، و مقایسه را به‌صورت artifactهایی منتشر می‌کند که نگه‌دارنده می‌تواند از یک PR یا از یک فرمان محلی بررسی کند.

Mantis با Discord شروع می‌کند چون Discord یک lane اولیهٔ پرارزش در اختیار ما می‌گذارد: احراز هویت واقعی bot، کانال‌های واقعی guild، واکنش‌ها، threadها، فرمان‌های native، و یک UI مرورگر که انسان‌ها می‌توانند در آن به‌صورت بصری تأیید کنند transport چه چیزی نشان داده است.

## اهداف

- بازتولید یک باگ از یک issue یا PR در GitHub با همان شکل transport که کاربران می‌بینند.
- ثبت یک artifact **قبل** روی ref مبنا پیش از اعمال اصلاح.
- ثبت یک artifact **بعد** روی ref نامزد پس از اعمال اصلاح.
- تا حد امکان استفاده از یک oracle قطعی، مانند خواندن واکنش Discord REST یا بررسی transcript کانال.
- ثبت screenshotها وقتی باگ یک سطح UI قابل مشاهده دارد.
- اجرا به‌صورت محلی از یک CLI تحت کنترل agent و از راه دور از GitHub.
- حفظ state کافی از ماشین برای نجات با VNC وقتی ورود، automation مرورگر، یا احراز هویت provider گیر می‌کند.
- ارسال وضعیت خلاصه به یک کانال Discord اپراتور وقتی اجرا مسدود است، به کمک دستی VNC نیاز دارد، یا تمام می‌شود.

## غیرهدف‌ها

- Mantis جایگزین unit testها نیست. اجرای Mantis معمولاً باید پس از فهمیده شدن اصلاح به یک regression test کوچک‌تر تبدیل شود.
- Mantis gate سریع عادی CI نیست. کندتر است، از اعتبارنامه‌های live استفاده می‌کند، و برای باگ‌هایی کنار گذاشته شده است که محیط live در آن‌ها اهمیت دارد.
- Mantis نباید برای عملیات عادی به انسان نیاز داشته باشد. VNC دستی مسیر نجات است، نه مسیر مطلوب.
- Mantis secretهای خام را در artifactها، logها، screenshotها، گزارش‌های Markdown، یا commentهای PR ذخیره نمی‌کند.

## مالکیت

Mantis در stack QA OpenClaw قرار دارد.

- OpenClaw مالک runtime سناریو، adapterهای transport، schema شواهد، و CLI محلی زیر `pnpm openclaw qa mantis` است.
- QA Lab مالک بخش‌های harness مربوط به transport live، helperهای capture مرورگر، و writerهای artifact است.
- Crabbox مالک ماشین‌های Linux گرم‌شده است وقتی VM راه دور لازم باشد.
- GitHub Actions مالک entrypoint workflow راه دور و نگه‌داری artifact است.
- ClawSweeper مالک routing کامنت‌های GitHub است: parsing فرمان‌های maintainer، dispatch کردن workflow، و ارسال comment نهایی PR.
- agentهای OpenClaw وقتی یک سناریو به setup عامل‌محور، debugging، یا گزارش stuck-state نیاز دارد، Mantis را از طریق Codex هدایت می‌کنند.

این مرز، دانش transport را در OpenClaw، زمان‌بندی ماشین را در Crabbox، و glue workflow نگه‌دارنده را در ClawSweeper نگه می‌دارد.

## شکل فرمان

اولین فرمان محلی، bot، guild، channel، ارسال message، ارسال reaction، و مسیر artifact در Discord را راستی‌آزمایی می‌کند:

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

runner زیر directory خروجی، worktreeهای detached برای baseline و candidate می‌سازد، dependencyها را نصب می‌کند، هر ref را build می‌کند، سناریو را با `--allow-failures` اجرا می‌کند، سپس `baseline/`، `candidate/`، `comparison.json`، و `mantis-report.md` را می‌نویسد. برای اولین سناریوی Discord، راستی‌آزمایی موفق یعنی status مبنا `fail` و status نامزد `pass` باشد.

probe دومِ قبل/بعد Discord، attachmentهای thread را هدف می‌گیرد:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

آن سناریو با driver bot یک message والد ارسال می‌کند، یک thread واقعی Discord می‌سازد، action `message.thread-reply` مربوط به OpenClaw را با یک `filePath` محلی repo صدا می‌زند، سپس thread را برای reply مربوط به SUT و نام فایل attachment poll می‌کند. screenshot مبنا reply را بدون attachment نشان می‌دهد؛ screenshot نامزد attachment مورد انتظار `mantis-thread-report.md` را نشان می‌دهد.

اولین primitive مربوط به VM/مرورگر، desktop smoke است:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

این فرمان یک ماشین desktop از Crabbox اجاره می‌کند یا دوباره استفاده می‌کند، یک مرورگر قابل مشاهده داخل session VNC شروع می‌کند، desktop را capture می‌کند، artifactها را به directory خروجی محلی برمی‌گرداند، و فرمان reconnect را داخل گزارش می‌نویسد. فرمان به‌صورت پیش‌فرض provider هتزنر را استفاده می‌کند چون اولین provider با پوشش desktop/VNC فعال در lane Mantis است. هنگام اجرا روی fleet دیگری از Crabbox، آن را با `--provider`، `--crabbox-bin`، یا `OPENCLAW_MANTIS_CRABBOX_PROVIDER` override کنید.

flagهای مفید desktop smoke:

- `--lease-id <cbx_...>` یا `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` از یک desktop گرم‌شده دوباره استفاده می‌کند.
- `--browser-url <url>` صفحه‌ای را که در مرورگر قابل مشاهده باز می‌شود تغییر می‌دهد.
- `--html-file <path>` یک artifact HTML محلی repo را در مرورگر قابل مشاهده render می‌کند. Mantis از این برای capture کردن timeline تولیدشدهٔ واکنش‌های status در Discord از طریق یک desktop واقعی Crabbox استفاده می‌کند.
- `--browser-profile-dir <remote-path>` از یک user-data-dir راه دور Chrome دوباره استفاده می‌کند تا یک desktop پایدار Mantis بتواند بین اجراها logged in بماند. از این برای profile بلندمدت viewer Discord Web استفاده کنید.
- `--browser-profile-archive-env <name>` پیش از launch مرورگر، یک archive user-data-dir مربوط به Chrome با قالب base64 `.tgz` را از متغیر محیطی نام‌گذاری‌شده restore می‌کند. از این برای witnessهای logged-in مانند Discord Web استفاده کنید. env var پیش‌فرض `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64` است.
- `--video-duration <seconds>` طول capture MP4 را کنترل می‌کند. برای web appهای logged-in کند که برای settle شدن به زمان نیاز دارند، duration طولانی‌تر استفاده کنید.
- `--keep-lease` یا `OPENCLAW_MANTIS_KEEP_VM=1` یک lease تازه‌ساخته‌شدهٔ passing را برای بررسی VNC باز نگه می‌دارد. اجراهای ناموفق وقتی lease ساخته شده باشد به‌صورت پیش‌فرض lease را نگه می‌دارند تا operator بتواند reconnect کند.
- `--class`، `--idle-timeout`، و `--ttl` اندازهٔ ماشین و lifetime lease را تنظیم می‌کنند.

برای شواهد Discord Web، Mantis به‌جای bot token از یک حساب viewer اختصاصی استفاده می‌کند. سناریوی live Discord API همچنان oracle است: thread واقعی را می‌سازد، `thread-reply` مربوط به SUT را ارسال می‌کند، و attachment را از طریق Discord REST بررسی می‌کند. وقتی `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` تنظیم شده باشد، سناریو یک artifact URL مربوط به Discord Web هم می‌نویسد. وقتی `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` تنظیم شده باشد، آن thread را به‌اندازهٔ کافی در دسترس می‌گذارد تا یک مرورگر logged-in بتواند آن را باز و ضبط کند.

workflow مربوط به GitHub، URL thread نامزد را در Discord Web باز می‌کند، screenshot می‌گیرد، MP4 ضبط می‌کند، و وقتی tooling رسانه‌ای Crabbox در دسترس باشد یک preview کوتاه‌شدهٔ GIF تولید می‌کند. مسیر profile پایدار viewer که از طریق `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` پیکربندی شده است را ترجیح دهید، چون archiveهای کامل profile Chrome می‌توانند از limit اندازهٔ secret در GitHub بزرگ‌تر شوند. برای profileهای کوچک/bootstrap، workflow همچنین می‌تواند یک archive با قالب base64 `.tgz` را از `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` restore کند. اگر هیچ‌کدام از sourceهای profile پیکربندی نشده باشد، workflow همچنان screenshotهای قطعی attachment برای baseline/candidate را منتشر می‌کند و noticeی log می‌کند که witness logged-in مربوط به Discord Web رد شده است.

اولین primitive کامل transport desktop، Slack desktop smoke است:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

این فرمان یک ماشین desktop از Crabbox اجاره می‌کند یا دوباره استفاده می‌کند، checkout فعلی را داخل VM sync می‌کند، `pnpm openclaw qa slack` را داخل آن VM اجرا می‌کند، Slack Web را در مرورگر VNC باز می‌کند، desktop قابل مشاهده را capture می‌کند، و هم artifactهای Slack QA و هم screenshot VNC را به directory خروجی محلی کپی می‌کند. این اولین شکل Mantis است که در آن SUT OpenClaw gateway و مرورگر هر دو داخل همان VM desktop Linux زندگی می‌کنند.

با `--gateway-setup`، فرمان یک home پایدار و disposable برای OpenClaw در `$HOME/.openclaw-mantis/slack-openclaw` آماده می‌کند، پیکربندی Slack Socket Mode را برای channel انتخاب‌شده patch می‌کند، `openclaw gateway run` را روی port `38973` شروع می‌کند، و Chrome را در session VNC running نگه می‌دارد. این حالت «برای من یک desktop لینوکسی با Slack و یک claw در حال اجرا باقی بگذار» است؛ وقتی `--gateway-setup` حذف شود، lane پیش‌فرض همان Slack QA bot-to-bot باقی می‌ماند.

ورودی‌های لازم برای `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` برای lane مدل راه دور. اگر فقط
  `OPENAI_API_KEY` به‌صورت محلی تنظیم شده باشد، Mantis پیش از invoke کردن Crabbox آن را به `OPENCLAW_LIVE_OPENAI_KEY` map می‌کند تا forwarding env با prefix `OPENCLAW_*` در Crabbox بتواند آن را وارد VM کند.

با `--gateway-setup --credential-source convex`، Mantis پیش از ساخت VM، credential مربوط به Slack SUT را از pool مشترک lease می‌کند و channel id lease‌شده، app token مربوط به Socket Mode، و bot token را به‌عنوان envهای runtime با نام `OPENCLAW_MANTIS_SLACK_*` داخل desktop forward می‌کند. این کار workflowهای GitHub را نازک نگه می‌دارد: آن‌ها فقط به secret مربوط به broker در Convex نیاز دارند، نه tokenهای خام Slack bot یا app.

flagهای مفید Slack desktop:

- `--lease-id <cbx_...>` دوباره روی ماشینی اجرا می‌کند که operator از قبل از طریق VNC در Slack Web وارد آن شده است.
- `--gateway-setup` به‌جای فقط اجرای lane Slack QA bot-to-bot، یک OpenClaw Slack gateway پایدار در VM شروع می‌کند.
- `--keep-lease` پس از موفقیت، VM مربوط به gateway را برای بررسی VNC باز نگه می‌دارد؛ `--no-keep-lease` پس از جمع‌آوری artifactها آن را stop می‌کند.
- `--slack-url <url>` یک URL خاص Slack Web را باز می‌کند. بدون آن، وقتی bot token مربوط به SUT در دسترس باشد، Mantis از Slack `auth.test` مقدار `https://app.slack.com/client/<team>/<channel>` را derive می‌کند.
- `--slack-channel-id <id>` allowlist کانال Slack را که gateway setup استفاده می‌کند کنترل می‌کند.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` profile پایدار Chrome داخل VM را کنترل می‌کند. مقدار پیش‌فرض `$HOME/.config/openclaw-mantis/slack-chrome-profile` است، بنابراین ورود دستی Slack Web روی همان lease در rerunها باقی می‌ماند.
- `--credential-source convex --credential-role ci` به‌جای tokenهای مستقیم env برای Slack، از pool مشترک credential استفاده می‌کند.
- `--provider-mode`، `--model`، `--alt-model`، و `--fast` به lane live مربوط به Slack pass through می‌شوند.

workflow smoke در GitHub برابر `Mantis Discord Smoke` است. workflow قبل و بعد در GitHub برای اولین سناریوی واقعی، `Mantis Discord Status Reactions` است. این موارد را می‌پذیرد:

- `baseline_ref`: refای که انتظار می‌رود رفتار queued-only را بازتولید کند.
- `candidate_ref`: refای که انتظار می‌رود `queued -> thinking -> done` را نشان دهد.

این workflow، ref مربوط به workflow harness را checkout می‌کند، worktreeهای جداگانهٔ baseline و candidate را build می‌کند، `discord-status-reactions-tool-only` را روی هر worktree اجرا می‌کند، و `baseline/`، `candidate/`، `comparison.json`، و `mantis-report.md` را به‌عنوان artifactهای Actions upload می‌کند. همچنین timeline HTML هر lane را در یک مرورگر desktop Crabbox render می‌کند و آن screenshotهای VNC را کنار PNGهای قطعی timeline در comment PR منتشر می‌کند. همان comment PR، previewهای GIF سبک و motion-trimmed تولیدشده توسط `crabbox media preview` را embed می‌کند، به clipهای MP4 متناظر و motion-trimmed لینک می‌دهد، و فایل‌های کامل MP4 مربوط به desktop را برای بررسی عمیق نگه می‌دارد. screenshotها برای مرور سریع inline می‌مانند. workflow، CLI مربوط به Crabbox را از main
`openclaw/crabbox` build می‌کند تا بتواند پیش از cut شدن release باینری بعدی Crabbox از flagهای فعلی desktop/browser lease استفاده کند.

`Mantis Scenario` entrypoint دستی generic است. یک `scenario_id`، `candidate_ref`، `baseline_ref` اختیاری، و `pr_number` اختیاری می‌گیرد، سپس workflow متعلق به سناریو را dispatch می‌کند. wrapper عمداً نازک است: workflowهای سناریو همچنان مالک setup مربوط به transport، credentialها، class ماشین مجازی، oracle مورد انتظار، و manifest artifact خود هستند.

`Mantis Slack Desktop Smoke` نخستین گردش‌کار ماشین مجازی Slack است. این گردش‌کار،
ارجاع نامزدِ مورد اعتماد را در یک درخت‌کاری جداگانه دریافت می‌کند، یک دسکتاپ لینوکسی
Crabbox را اجاره می‌کند، `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` را در برابر آن
نامزد اجرا می‌کند، Slack Web را در مرورگر VNC باز می‌کند، دسکتاپ را ضبط می‌کند، با
`crabbox media preview` یک پیش‌نمایش کوتاه‌شده بر پایه حرکت تولید می‌کند، کل دایرکتوری
مصنوعه‌ها را بارگذاری می‌کند، و در صورت نیاز نظر شواهد درون‌خطی را روی PR هدف ارسال می‌کند.
این مسیر به‌صورت پیش‌فرض برای اجاره دسکتاپ از AWS استفاده می‌کند و یک ورودی دستی
ارائه‌دهنده در اختیار می‌گذارد تا اپراتورها وقتی ظرفیت AWS کند یا ناموجود است به Hetzner
تغییر مسیر دهند. وقتی به‌جای فقط یک رونوشت Slack ربات‌به‌ربات، «یک دسکتاپ لینوکسی
با Slack و یک claw در حال اجرا» می‌خواهید، از این مسیر استفاده کنید.

هر سناریوی منتشرکننده PR، کنار گزارش خود `mantis-evidence.json` را می‌نویسد.
این شِما نقطه تحویل بین کد سناریو و نظرهای GitHub است:

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

مقادیر `path` در مصنوعه‌ها نسبت به دایرکتوری مانیفست هستند. مقادیر `targetPath`
مسیرهایی نسبی زیر دایرکتوری انتشار شاخه `qa-artifacts` هستند. ناشر، پیمایش مسیر را
رد می‌کند و وقتی پیش‌نمایش‌ها یا ویدئوهای اختیاری در دسترس نباشند، ورودی‌هایی را که با
`"required": false` علامت‌گذاری شده‌اند نادیده می‌گیرد.

انواع مصنوعه پشتیبانی‌شده:

- `timeline`: اسکرین‌شات قطعی سناریو، معمولا پیش/پس.
- `desktopScreenshot`: اسکرین‌شات دسکتاپ VNC/مرورگر.
- `motionPreview`: GIF متحرک درون‌خطی که از ضبط دسکتاپ تولید شده است.
- `motionClip`: MP4 کوتاه‌شده بر پایه حرکت که پیش‌درآمد و دنباله ثابت را حذف می‌کند.
- `fullVideo`: ضبط کامل MP4 برای بررسی عمیق.
- `metadata`: فایل جانبی JSON/لاگ.
- `report`: گزارش Markdown.

ناشر قابل استفاده مجدد `scripts/mantis/publish-pr-evidence.mjs` است. گردش‌کارها
آن را با مانیفست، PR هدف، ریشه هدف `qa-artifacts`، نشانگر نظر، URL مصنوعه Actions،
URL اجرا، و منبع درخواست فراخوانی می‌کنند. این ناشر مصنوعه‌های اعلام‌شده را به
شاخه `qa-artifacts` کپی می‌کند، یک نظر PR با خلاصه در ابتدا و تصاویر/پیش‌نمایش‌های
درون‌خطی و ویدئوهای پیوندشده می‌سازد، سپس نظر موجود دارای نشانگر را به‌روزرسانی
می‌کند یا یک نظر جدید می‌سازد.

می‌توانید اجرای status-reactions را مستقیما از یک نظر PR هم فعال کنید:

```text
@Mantis discord status reactions
```

ماشه نظر عمدا محدود است. فقط روی نظرهای pull request از کاربرانی اجرا می‌شود که
دسترسی write، maintain یا admin دارند، و فقط درخواست‌های واکنش وضعیت Discord را
تشخیص می‌دهد. به‌صورت پیش‌فرض، از ارجاع پایه بد شناخته‌شده و SHA سرشاخه PR فعلی به‌عنوان
نامزد استفاده می‌کند. نگه‌دارندگان می‌توانند هر یک از ارجاع‌ها را بازنویسی کنند:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

نمونه فرمان‌های ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

فرمان اول صریح و متمرکز بر سناریو است. فرمان دوم بعدا می‌تواند یک PR یا issue را بر اساس
برچسب‌ها، فایل‌های تغییرکرده، و یافته‌های بازبینی ClawSweeper به سناریوهای پیشنهادی
Mantis نگاشت کند.

## چرخه عمر اجرا

1. دریافت اعتبارنامه‌ها.
2. تخصیص یا استفاده دوباره از یک ماشین مجازی.
3. آماده‌سازی پروفایل دسکتاپ/مرورگر وقتی سناریو به شواهد UI نیاز دارد.
4. آماده‌سازی یک checkout تمیز برای ارجاع پایه.
5. نصب وابستگی‌ها و ساخت فقط مواردی که سناریو نیاز دارد.
6. شروع یک OpenClaw Gateway فرزند با دایرکتوری وضعیت ایزوله.
7. پیکربندی ترابری زنده، ارائه‌دهنده، مدل، و پروفایل مرورگر.
8. اجرای سناریو و ثبت شواهد پایه.
9. توقف Gateway و نگهداری لاگ‌ها.
10. آماده‌سازی ارجاع نامزد در همان ماشین مجازی.
11. اجرای همان سناریو و ثبت شواهد نامزد.
12. مقایسه نتایج اوراکل و شواهد بصری.
13. نوشتن Markdown، JSON، لاگ‌ها، اسکرین‌شات‌ها، و مصنوعه‌های اختیاری ردیابی.
14. بارگذاری مصنوعه‌های GitHub Actions.
15. ارسال یک پیام وضعیت کوتاه در PR یا Discord.

سناریو باید بتواند به دو شیوه متفاوت شکست بخورد:

- **بازتولید باگ**: پایه به شکل مورد انتظار شکست خورد.
- **شکست هارنس**: راه‌اندازی محیط، اعتبارنامه‌ها، Discord API، مرورگر، یا
  ارائه‌دهنده پیش از معنادار شدن اوراکل باگ شکست خورد.

گزارش نهایی باید این حالت‌ها را جدا کند تا نگه‌دارندگان یک محیط ناپایدار را با
رفتار محصول اشتباه نگیرند.

## Discord MVP

سناریوی اول باید واکنش‌های وضعیت Discord را در کانال‌های guild هدف بگیرد، جایی که
حالت تحویل پاسخ منبع `message_tool_only` است.

چرا یک بذر خوب برای Mantis است:

- در Discord به‌صورت واکنش روی پیام محرک دیده می‌شود.
- از طریق وضعیت واکنش پیام Discord، یک اوراکل REST قوی دارد.
- یک OpenClaw Gateway واقعی، احراز هویت ربات Discord، ارسال پیام، حالت تحویل
  پاسخ منبع، وضعیت واکنش وضعیت، و چرخه عمر نوبت مدل را تمرین می‌دهد.
- آن‌قدر محدود است که نخستین پیاده‌سازی را صادق نگه دارد.

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

شواهد پایه باید واکنش تایید queued را نشان دهد، اما در حالت tool-only هیچ گذار چرخه
عمری نداشته باشد. شواهد نامزد باید نشان دهد وقتی `messages.statusReactions.enabled`
صریحا true است، واکنش‌های وضعیت چرخه عمر اجرا می‌شوند.

نخستین بخش اجرایی، سناریوی QA زنده Discord با انتخاب صریح است:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

این، SUT را با رسیدگی همیشه‌روشن guild، `visibleReplies:
"message_tool"`، `ackReaction: "👀"`، و واکنش‌های وضعیت صریح پیکربندی می‌کند. اوراکل
پیام محرک واقعی Discord را poll می‌کند و انتظار دنباله مشاهده‌شده
`👀 -> 🤔 -> 👍` را دارد. مصنوعه‌ها شامل `discord-qa-reaction-timelines.json`،
`discord-status-reactions-tool-only-timeline.html`، و
`discord-status-reactions-tool-only-timeline.png` هستند.

## قطعه‌های QA موجود

Mantis باید به‌جای شروع از صفر، بر پشته QA خصوصی موجود ساخته شود:

- `pnpm openclaw qa discord` از قبل یک مسیر Discord زنده را با ربات‌های driver و
  SUT اجرا می‌کند.
- اجراکننده ترابری زنده از قبل گزارش‌ها و مصنوعه‌های پیام مشاهده‌شده را زیر
  `.artifacts/qa-e2e/` می‌نویسد.
- اجاره‌های اعتبارنامه Convex از قبل دسترسی انحصاری به اعتبارنامه‌های ترابری زنده
  مشترک را فراهم می‌کنند.
- سرویس کنترل مرورگر از قبل از اسکرین‌شات‌ها، snapshotها، پروفایل‌های مدیریت‌شده
  headless، و پروفایل‌های CDP راه دور پشتیبانی می‌کند.
- QA Lab از قبل یک UI اشکال‌زدا و bus برای آزمون‌های هم‌شکل ترابری دارد.

نخستین پیاده‌سازی Mantis می‌تواند یک اجراکننده نازک پیش/پس روی این قطعه‌ها، به‌علاوه
یک لایه شواهد بصری باشد.

## مدل شواهد

هر اجرا یک دایرکتوری مصنوعه پایدار می‌نویسد:

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

`mantis-summary.json` باید منبع حقیقت قابل خواندن توسط ماشین باشد. گزارش
Markdown برای نظرهای PR و بازبینی انسانی است.

خلاصه باید شامل این موارد باشد:

- ارجاع‌ها و SHAهای آزموده‌شده
- ترابری و شناسه سناریو
- ارائه‌دهنده ماشین و شناسه ماشین یا شناسه اجاره
- منبع اعتبارنامه بدون مقدارهای محرمانه
- نتیجه پایه
- نتیجه نامزد
- اینکه آیا باگ روی پایه بازتولید شد
- اینکه آیا نامزد آن را اصلاح کرد
- مسیرهای مصنوعه
- مشکلات پاک‌سازی یا راه‌اندازی پاک‌سازی‌شده

اسکرین‌شات‌ها شواهد هستند، نه اسرار. با این حال همچنان به انضباط ویرایش نیاز دارند:
نام کانال‌های خصوصی، نام کاربران، یا محتوای پیام ممکن است ظاهر شود. برای PRهای عمومی،
تا زمانی که داستان ویرایش قوی‌تر نشده، پیوندهای مصنوعه GitHub Actions را به تصاویر
درون‌خطی ترجیح دهید.

## مرورگر و VNC

مسیر مرورگر دو حالت دارد:

- **خودکارسازی headless**: پیش‌فرض برای CI. Chrome با CDP فعال اجرا می‌شود، و
  Playwright یا کنترل مرورگر OpenClaw اسکرین‌شات می‌گیرد.
- **نجات VNC**: وقتی ورود، MFA، ضدخودکارسازی Discord، یا اشکال‌زدایی بصری به انسان
  نیاز دارد، روی همان ماشین مجازی فعال می‌شود.

پروفایل مرورگر ناظر Discord باید آن‌قدر پایدار باشد که برای هر اجرا نیاز به ورود
نباشد، اما از وضعیت مرورگر شخصی ایزوله باشد. یک پروفایل متعلق به مخزن ماشین Mantis
است، نه لپ‌تاپ یک توسعه‌دهنده.

وقتی Mantis گیر می‌کند، یک پیام وضعیت Discord با این موارد ارسال می‌کند:

- شناسه اجرا
- شناسه سناریو
- ارائه‌دهنده ماشین
- دایرکتوری مصنوعه
- دستورالعمل‌های اتصال VNC یا noVNC، اگر موجود باشد
- متن کوتاه مانع

نخستین استقرار خصوصی می‌تواند این پیام‌ها را به کانال اپراتور موجود ارسال کند و بعدا
به یک کانال اختصاصی Mantis منتقل شود.

## ماشین‌ها

Mantis باید برای نخستین پیاده‌سازی راه دور، AWS را از طریق Crabbox ترجیح دهد.
Crabbox ماشین‌های گرم‌شده، رهگیری اجاره، هیدراته‌سازی، لاگ‌ها، نتایج، و پاک‌سازی را
در اختیارمان می‌گذارد. اگر ظرفیت AWS بیش از حد کند یا ناموجود باشد، یک ارائه‌دهنده
Hetzner پشت همان واسط ماشین اضافه کنید.

حداقل نیازمندی‌های ماشین مجازی:

- Linux با نصب Chrome یا Chromium قادر به دسکتاپ
- دسترسی CDP برای خودکارسازی مرورگر
- VNC یا noVNC برای نجات
- Node 22 و pnpm
- checkout از OpenClaw و کش وابستگی
- کش مرورگر Playwright Chromium وقتی از Playwright استفاده می‌شود
- CPU و حافظه کافی برای یک OpenClaw Gateway، یک مرورگر، و یک اجرای مدل
- دسترسی خروجی به Discord، GitHub، ارائه‌دهندگان مدل، و کارگزار اعتبارنامه

ماشین مجازی نباید اسرار خام بلندمدت را بیرون از مخزن‌های مورد انتظار اعتبارنامه یا
پروفایل مرورگر نگه دارد.

## اسرار

اسرار برای اجراهای راه دور در اسرار سازمان یا مخزن GitHub، و برای اجراهای محلی در یک
فایل محرمانه تحت کنترل اپراتور محلی قرار می‌گیرند.

نام‌های پیشنهادی اسرار:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` برای بارگذاری مصنوعه عمومی GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

در بلندمدت، مخزن اعتبارنامه Convex باید منبع معمول اعتبارنامه‌های ترابری زنده باقی
بماند. اسرار GitHub، کارگزار و مسیرهای جایگزین را راه‌اندازی اولیه می‌کنند. گردش‌کار
واکنش‌های وضعیت Discord، اسرار Mantis Crabbox را دوباره به متغیرهای محیطی
`CRABBOX_COORDINATOR` و `CRABBOX_COORDINATOR_TOKEN` که CLI مربوط به Crabbox انتظار
دارد نگاشت می‌کند. نام‌های ساده اسرار GitHub با قالب `CRABBOX_*` همچنان به‌عنوان
جایگزین سازگاری پذیرفته می‌شوند.

اجراکننده Mantis هرگز نباید این موارد را چاپ کند:

- توکن‌های ربات Discord
- کلیدهای API ارائه‌دهنده
- کوکی‌های مرورگر
- محتوای پروفایل احراز هویت
- گذرواژه‌های VNC
- payloadهای خام اعتبارنامه

بارگذاری‌های مصنوعه عمومی باید metadata هدف Discord مانند شناسه‌های ربات، guild،
کانال، و پیام را نیز ویرایش کنند. گردش‌کار smoke مربوط به GitHub به همین دلیل
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` را فعال می‌کند.

اگر یک توکن به‌طور تصادفی در issue، PR، chat، یا لاگ جای‌گذاری شد، پس از ذخیره شدن
محرمانه جدید، آن را چرخش دهید.

## مصنوعه‌های GitHub و نظرهای PR

گردش‌کارهای Mantis باید بسته کامل شواهد را به‌عنوان یک آرتیفکت کوتاه‌مدت Actions بارگذاری کنند. وقتی گردش‌کار برای گزارش باگ یا PR اصلاح اجرا می‌شود، باید تصویرهای PNG ویرایش‌شده را نیز در شاخه `qa-artifacts` منتشر کند و نظری را روی همان باگ یا PR اصلاح با اسکرین‌شات‌های درون‌خطی قبل/بعد درج یا به‌روزرسانی کند. اثبات اصلی را فقط روی یک PR عمومی خودکارسازی QA منتشر نکنید. لاگ‌های خام، پیام‌های مشاهده‌شده، و سایر شواهد حجیم در آرتیفکت Actions باقی می‌مانند.

گردش‌کارهای تولید باید این نظرها را با GitHub App مربوط به Mantis منتشر کنند، نه با `github-actions[bot]`. شناسه برنامه و کلید خصوصی را به‌عنوان secrets مربوط به GitHub Actions با نام‌های `MANTIS_GITHUB_APP_ID` و `MANTIS_GITHUB_APP_PRIVATE_KEY` ذخیره کنید. گردش‌کار از یک نشانگر پنهان به‌عنوان کلید درج یا به‌روزرسانی استفاده می‌کند، وقتی توکن بتواند نظر را ویرایش کند آن را به‌روزرسانی می‌کند، و وقتی یک نشانگر قدیمی متعلق به bot قابل ویرایش نباشد یک نظر جدید متعلق به Mantis ایجاد می‌کند.

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

وقتی اجرا به‌دلیل شکست harness ناموفق می‌شود، نظر باید همین را بگوید، نه اینکه القا کند candidate شکست خورده است.

## یادداشت‌های استقرار خصوصی

یک استقرار خصوصی ممکن است از قبل یک برنامه Discord مربوط به Mantis داشته باشد. وقتی آن برنامه مجوزهای bot درست را دارد و می‌توان آن را با ایمنی چرخاند، به‌جای ساخت برنامه دیگر از همان استفاده کنید.

کانال اولیه اعلان operator را از طریق secrets یا پیکربندی استقرار تنظیم کنید. این کانال می‌تواند ابتدا به یک کانال موجود نگه‌دارنده یا عملیات اشاره کند، سپس پس از ایجاد کانال اختصاصی Mantis به آن منتقل شود.

شناسه‌های guild، شناسه‌های کانال، توکن‌های bot، کوکی‌های مرورگر، یا رمزهای عبور VNC را در این سند قرار ندهید. آن‌ها را در GitHub secrets، credential broker، یا secret store محلی operator ذخیره کنید.

## افزودن یک سناریو

یک سناریوی Mantis باید موارد زیر را اعلام کند:

- شناسه و عنوان
- transport
- اطلاعات محرمانه لازم
- سیاست ref خط مبنا
- سیاست ref candidate
- وصله پیکربندی OpenClaw
- گام‌های آماده‌سازی
- stimulus
- oracle مورد انتظار خط مبنا
- oracle مورد انتظار candidate
- اهداف ثبت تصویری
- بودجه timeout
- گام‌های پاک‌سازی

سناریوها باید oracleهای کوچک و تایپ‌شده را ترجیح دهند:

- وضعیت واکنش Discord برای باگ‌های واکنش
- ارجاع‌های پیام Discord برای باگ‌های threading
- thread ts و وضعیت API واکنش در Slack برای باگ‌های Slack
- شناسه‌ها و سرآیندهای پیام ایمیل برای باگ‌های ایمیل
- اسکرین‌شات‌های مرورگر وقتی UI تنها مشاهده‌پذیر قابل اعتماد است

بررسی‌های vision باید افزایشی باشند. اگر API پلتفرم می‌تواند باگ را اثبات کند، از API به‌عنوان oracle قبولی/شکست استفاده کنید و اسکرین‌شات‌ها را برای اطمینان انسانی نگه دارید.

## گسترش ارائه‌دهنده

پس از Discord، همان runner می‌تواند موارد زیر را اضافه کند:

- Slack: واکنش‌ها، threadها، app mentionها، modals، بارگذاری فایل‌ها.
- ایمیل: احراز هویت Gmail و threading پیام با استفاده از `gog` در جاهایی که connectors کافی نیستند.
- WhatsApp: ورود QR، شناسایی مجدد، تحویل پیام، رسانه، واکنش‌ها.
- Telegram: کنترل اشاره گروهی، commands، واکنش‌ها در صورت موجود بودن.
- Matrix: اتاق‌های رمزگذاری‌شده، روابط thread یا reply، ازسرگیری پس از restart.

هر transport باید یک سناریوی smoke ارزان و یک یا چند سناریوی کلاس باگ داشته باشد. سناریوهای تصویری پرهزینه باید opt-in باقی بمانند.

## پرسش‌های باز

- وقتی bot موجود Mantis دوباره استفاده می‌شود، کدام bot در Discord باید driver باشد و کدام باید SUT باشد؟
- آیا ورود مرورگر observer باید در مرحله اول از یک حساب انسانی Discord، یک حساب آزمایشی، یا فقط شواهد REST قابل خواندن برای bot استفاده کند؟
- GitHub باید آرتیفکت‌های Mantis را برای PRها چه مدت نگه دارد؟
- چه زمانی ClawSweeper باید به‌صورت خودکار Mantis را پیشنهاد کند، به‌جای اینکه منتظر فرمان نگه‌دارنده بماند؟
- آیا اسکرین‌شات‌ها باید پیش از بارگذاری برای PRهای عمومی ویرایش یا برش داده شوند؟
