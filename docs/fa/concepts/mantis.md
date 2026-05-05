---
read_when:
    - ساخت یا اجرای تضمین کیفیت بصری زنده برای خطاهای OpenClaw
    - افزودن راستی‌آزمایی قبل و بعد برای یک درخواست ادغام
    - افزودن سناریوهای انتقال زنده برای Discord، Slack، WhatsApp یا موارد دیگر
    - اشکال‌زدایی اجراهای QA که به نماگرفت‌ها، خودکارسازی مرورگر یا دسترسی VNC نیاز دارند
summary: Mantis سامانهٔ راستی‌آزمایی سرتاسری بصری برای بازتولید باگ‌های OpenClaw روی مسیرهای انتقال زنده، ثبت شواهد پیش و پس از تغییر، و پیوست کردن آرتیفکت‌ها به PRها است.
title: آخوندک
x-i18n:
    generated_at: "2026-05-05T11:47:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f845ad3f19b88a9a398b43bd8bdfda8c7c2043733e30e7fcef1bf6ee0343c65
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis سامانه راستی‌آزمایی سرتاسری OpenClaw برای باگ‌هایی است که به یک runtime واقعی، یک انتقال واقعی، و اثبات قابل مشاهده نیاز دارند. این سامانه سناریویی را روی یک ارجاع بد شناخته‌شده اجرا می‌کند، شواهد را ثبت می‌کند، همان سناریو را روی یک ارجاع کاندید اجرا می‌کند، و مقایسه را به‌صورت artifactهایی منتشر می‌کند که maintainer می‌تواند آن‌ها را از یک PR یا از یک دستور محلی بررسی کند.

Mantis با Discord شروع می‌کند چون Discord یک مسیر نخست با ارزش بالا به ما می‌دهد: احراز هویت واقعی بات، کانال‌های واقعی guild، واکنش‌ها، threadها، دستورهای native، و یک رابط کاربری مرورگر که انسان‌ها در آن می‌توانند آنچه انتقال نشان داده است را به‌صورت بصری تأیید کنند.

## اهداف

- بازتولید یک باگ از یک issue یا PR در GitHub با همان شکل انتقالی که کاربران می‌بینند.
- ثبت یک artifact **قبل** روی ارجاع مبنا پیش از اعمال اصلاح.
- ثبت یک artifact **بعد** روی ارجاع کاندید پس از اعمال اصلاح.
- استفاده از یک oracle قطعی هر زمان که ممکن باشد، مانند خواندن واکنش با Discord REST یا بررسی transcript کانال.
- ثبت screenshotها وقتی باگ سطح رابط کاربری قابل مشاهده دارد.
- اجرا به‌صورت محلی از یک CLI تحت کنترل agent و به‌صورت راه‌دور از GitHub.
- حفظ وضعیت کافی از ماشین برای بازیابی VNC وقتی ورود، خودکارسازی مرورگر، یا احراز هویت provider گیر می‌کند.
- ارسال وضعیت کوتاه به یک کانال Discord عملیاتی وقتی اجرا مسدود شده، به کمک دستی VNC نیاز دارد، یا تمام می‌شود.

## اهداف خارج از دامنه

- Mantis جایگزین unit testها نیست. اجرای Mantis معمولاً باید پس از فهم اصلاح، به یک regression test کوچک‌تر تبدیل شود.
- Mantis دروازه CI سریع معمول نیست. کندتر است، از credentialهای زنده استفاده می‌کند، و برای باگ‌هایی رزرو می‌شود که محیط زنده در آن‌ها اهمیت دارد.
- Mantis نباید برای عملیات عادی به انسان نیاز داشته باشد. VNC دستی مسیر بازیابی است، نه مسیر مطلوب.
- Mantis secretهای خام را در artifactها، logها، screenshotها، گزارش‌های Markdown، یا commentهای PR ذخیره نمی‌کند.

## مالکیت

Mantis در پشته QA OpenClaw قرار دارد.

- OpenClaw مالک runtime سناریو، adapterهای انتقال، schema شواهد، و CLI محلی زیر `pnpm openclaw qa mantis` است.
- QA Lab مالک بخش‌های harness انتقال زنده، helperهای ثبت مرورگر، و نویسنده‌های artifact است.
- Crabbox مالک ماشین‌های Linux گرم‌شده وقتی VM راه‌دور لازم است.
- GitHub Actions مالک entrypoint workflow راه‌دور و نگهداری artifact است.
- ClawSweeper مالک مسیریابی commentهای GitHub است: parse کردن دستورهای maintainer، dispatch کردن workflow، و ارسال comment نهایی PR.
- agentهای OpenClaw وقتی یک سناریو به راه‌اندازی agentic، debugging، یا گزارش وضعیت گیرکرده نیاز دارد، Mantis را از طریق Codex هدایت می‌کنند.

این مرز دانش انتقال را در OpenClaw، زمان‌بندی ماشین را در Crabbox، و چسب workflow maintainer را در ClawSweeper نگه می‌دارد.

## شکل دستور

نخستین دستور محلی بات Discord، guild، کانال، ارسال پیام، ارسال واکنش، و مسیر artifact را راستی‌آزمایی می‌کند:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

اجراکننده محلی قبل و بعد این شکل را می‌پذیرد:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

اجراکننده worktreeهای detached مبنا و کاندید را زیر دایرکتوری خروجی می‌سازد، dependencyها را نصب می‌کند، هر ارجاع را build می‌کند، سناریو را با `--allow-failures` اجرا می‌کند، سپس `baseline/`، `candidate/`، `comparison.json`، و `mantis-report.md` را می‌نویسد. برای نخستین سناریوی Discord، راستی‌آزمایی موفق یعنی وضعیت مبنا `fail` و وضعیت کاندید `pass` است.

نخستین primitive مربوط به VM/مرورگر، smoke دسکتاپ است:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

این دستور یک ماشین دسکتاپ Crabbox را lease می‌کند یا دوباره به‌کار می‌گیرد، یک مرورگر قابل مشاهده را داخل session‏ VNC شروع می‌کند، دسکتاپ را ثبت می‌کند، artifactها را به دایرکتوری خروجی محلی برمی‌گرداند، و دستور اتصال مجدد را در گزارش می‌نویسد. دستور به‌صورت پیش‌فرض از provider‏ Hetzner استفاده می‌کند چون نخستین provider با پوشش دسکتاپ/VNC کارا در مسیر Mantis است. هنگام اجرا روی یک ناوگان Crabbox دیگر، با `--provider`،‏ `--crabbox-bin`، یا `OPENCLAW_MANTIS_CRABBOX_PROVIDER` آن را override کنید.

flagهای مفید smoke دسکتاپ:

- `--lease-id <cbx_...>` یا `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` یک دسکتاپ گرم‌شده را دوباره به‌کار می‌گیرد.
- `--browser-url <url>` صفحه‌ای را که در مرورگر قابل مشاهده باز می‌شود تغییر می‌دهد.
- `--html-file <path>` یک artifact‏ HTML محلی repo را در مرورگر قابل مشاهده render می‌کند. Mantis از این برای ثبت timeline تولیدشده واکنش‌های status در Discord از طریق یک دسکتاپ واقعی Crabbox استفاده می‌کند.
- `--keep-lease` یا `OPENCLAW_MANTIS_KEEP_VM=1` یک lease تازه‌ساخته‌شده موفق را برای بررسی VNC باز نگه می‌دارد. اجراهای ناموفق، وقتی lease ساخته شده باشد، به‌صورت پیش‌فرض آن را نگه می‌دارند تا operator بتواند دوباره وصل شود.
- `--class`،‏ `--idle-timeout`، و `--ttl` اندازه ماشین و طول عمر lease را تنظیم می‌کنند.

نخستین primitive کامل انتقال دسکتاپ، smoke دسکتاپ Slack است:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

این دستور یک ماشین دسکتاپ Crabbox را lease می‌کند یا دوباره به‌کار می‌گیرد، checkout فعلی را به VM sync می‌کند، `pnpm openclaw qa slack` را داخل آن VM اجرا می‌کند، Slack Web را در مرورگر VNC باز می‌کند، دسکتاپ قابل مشاهده را ثبت می‌کند، و هم artifactهای QA Slack و هم screenshot‏ VNC را به دایرکتوری خروجی محلی کپی می‌کند. این نخستین شکل Mantis است که در آن Gateway‏ OpenClaw متعلق به SUT و مرورگر هر دو داخل همان VM دسکتاپ Linux زندگی می‌کنند.

با `--gateway-setup`، دستور یک خانه OpenClaw یک‌بارمصرف و پایدار در `$HOME/.openclaw-mantis/slack-openclaw` آماده می‌کند، پیکربندی Slack Socket Mode را برای کانال انتخاب‌شده patch می‌کند، `openclaw gateway run` را روی port‏ `38973` شروع می‌کند، و Chrome را در session‏ VNC در حال اجرا نگه می‌دارد. این حالت «یک دسکتاپ Linux با Slack و یک claw در حال اجرا برایم باقی بگذار» است؛ مسیر QA Slack بات‌به‌بات وقتی `--gateway-setup` حذف شود همچنان پیش‌فرض می‌ماند.

ورودی‌های لازم برای `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` برای مسیر model راه‌دور. اگر فقط
  `OPENAI_API_KEY` به‌صورت محلی تنظیم شده باشد، Mantis پیش از فراخوانی Crabbox آن را به `OPENCLAW_LIVE_OPENAI_KEY` نگاشت می‌کند تا ارسال envهای `OPENCLAW_*` در Crabbox بتواند آن را به VM منتقل کند.

با `--gateway-setup --credential-source convex`، Mantis پیش از ساخت VM، credential‏ SUT Slack را از pool مشترک lease می‌کند و شناسه کانال lease‌شده، app token‏ Socket Mode، و bot token را به‌عنوان envهای runtime‏ `OPENCLAW_MANTIS_SLACK_*` داخل دسکتاپ forward می‌کند. این کار workflowهای GitHub را سبک نگه می‌دارد: آن‌ها فقط به secret کارگزار Convex نیاز دارند، نه tokenهای خام بات یا app در Slack.

flagهای مفید دسکتاپ Slack:

- `--lease-id <cbx_...>` اجرا را روی ماشینی تکرار می‌کند که operator از قبل از طریق VNC در Slack Web وارد آن شده است.
- `--gateway-setup` به‌جای فقط اجرای مسیر QA بات‌به‌بات، یک Gateway پایدار OpenClaw Slack را در VM شروع می‌کند.
- `--keep-lease` پس از موفقیت، VM مربوط به Gateway را برای بررسی VNC باز نگه می‌دارد؛ `--no-keep-lease` پس از جمع‌آوری artifactها آن را متوقف می‌کند.
- `--slack-url <url>` یک URL مشخص Slack Web را باز می‌کند. بدون آن، Mantis وقتی bot token‏ SUT در دسترس باشد، `https://app.slack.com/client/<team>/<channel>` را از `auth.test` در Slack استخراج می‌کند.
- `--slack-channel-id <id>` allowlist کانال Slack استفاده‌شده توسط gateway setup را کنترل می‌کند.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` پروفایل پایدار Chrome داخل VM را کنترل می‌کند. مقدار پیش‌فرض `$HOME/.config/openclaw-mantis/slack-chrome-profile` است، بنابراین ورود دستی Slack Web روی همان lease در اجرای دوباره باقی می‌ماند.
- `--credential-source convex --credential-role ci` به‌جای tokenهای مستقیم env در Slack، از pool credential مشترک استفاده می‌کند.
- `--provider-mode`،‏ `--model`،‏ `--alt-model`، و `--fast` به مسیر زنده Slack pass through می‌شوند.

workflow مربوط به smoke در GitHub،‏ `Mantis Discord Smoke` است. workflow قبل و بعد برای نخستین سناریوی واقعی `Mantis Discord Status Reactions` است. این ورودی‌ها را می‌پذیرد:

- `baseline_ref`: ارجاعی که انتظار می‌رود رفتار فقط queued را بازتولید کند.
- `candidate_ref`: ارجاعی که انتظار می‌رود `queued -> thinking -> done` را نشان دهد.

این workflow ارجاع harness workflow را checkout می‌کند، worktreeهای جداگانه مبنا و کاندید را build می‌کند، `discord-status-reactions-tool-only` را روی هر worktree اجرا می‌کند، و `baseline/`،‏ `candidate/`،‏ `comparison.json`، و `mantis-report.md` را به‌عنوان artifactهای Actions upload می‌کند. همچنین timeline‏ HTML هر مسیر را در یک مرورگر دسکتاپ Crabbox render می‌کند و آن screenshotهای VNC را کنار PNGهای timeline قطعی در comment‏ PR منتشر می‌کند. همان comment‏ PR previewهای سبک GIF با motion trim شده را که با `crabbox media preview` تولید شده‌اند embed می‌کند، به clipهای MP4 متناظر با motion trim شده link می‌دهد، و فایل‌های MP4 کامل دسکتاپ را برای بررسی عمیق نگه می‌دارد. screenshotها برای مرور سریع inline می‌مانند. این workflow‏ CLI‏ Crabbox را از main مربوط به
`openclaw/crabbox` build می‌کند تا پیش از انتشار binary بعدی Crabbox بتواند از flagهای فعلی lease دسکتاپ/مرورگر استفاده کند.

`Mantis Scenario` entrypoint دستی عمومی است. یک `scenario_id`،‏ `candidate_ref`،‏ `baseline_ref` اختیاری، و `pr_number` اختیاری می‌گیرد، سپس workflow متعلق به سناریو را dispatch می‌کند. wrapper عمداً نازک است: workflowهای سناریو همچنان مالک setup انتقال، credentialها، کلاس VM، oracle مورد انتظار، و manifest‏ artifact خود هستند.

`Mantis Slack Desktop Smoke` نخستین workflow‏ VM برای Slack است. این workflow ارجاع کاندید trusted را در یک worktree جداگانه checkout می‌کند، یک دسکتاپ Linux در Crabbox را lease می‌کند، `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` را روی آن کاندید اجرا می‌کند، Slack Web را در مرورگر VNC باز می‌کند، دسکتاپ را ضبط می‌کند، با `crabbox media preview` یک preview با motion trim شده تولید می‌کند، دایرکتوری کامل artifact را upload می‌کند، و به‌صورت اختیاری comment شواهد inline را روی PR هدف ارسال می‌کند. این مسیر برای lease دسکتاپ به‌صورت پیش‌فرض از AWS استفاده می‌کند و یک ورودی دستی provider ارائه می‌دهد تا operatorها وقتی ظرفیت AWS کند یا ناموجود است به Hetzner سوییچ کنند. وقتی به‌جای فقط transcript بات‌به‌بات Slack، «یک دسکتاپ Linux با Slack و یک claw در حال اجرا» می‌خواهید، از این مسیر استفاده کنید.

هر سناریوی منتشرکننده در PR، فایل `mantis-evidence.json` را کنار گزارش خود می‌نویسد. این schema نقطه تحویل بین کد سناریو و commentهای GitHub است:

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

مقدارهای `path` برای artifact نسبت به دایرکتوری manifest هستند. مقدارهای `targetPath` مسیرهای نسبی زیر دایرکتوری انتشار branch‏ `qa-artifacts` هستند. publisher مسیرهای traversal را رد می‌کند و وقتی previewها یا videoهای اختیاری در دسترس نباشند، entryهای علامت‌خورده با `"required": false` را نادیده می‌گیرد.

kindهای پشتیبانی‌شده artifact:

- `timeline`: screenshot قطعی سناریو، معمولاً قبل/بعد.
- `desktopScreenshot`: screenshot دسکتاپ VNC/مرورگر.
- `motionPreview`: GIF متحرک inline تولیدشده از ضبط دسکتاپ.
- `motionClip`: MP4 با motion trim شده که lead-in و tail ایستا را حذف می‌کند.
- `fullVideo`: ضبط MP4 کامل برای بررسی عمیق.
- `metadata`: sidecar‏ JSON/log.
- `report`: گزارش Markdown.

ناشر قابل استفادهٔ مجدد `scripts/mantis/publish-pr-evidence.mjs` است. Workflowها
آن را با manifest، PR هدف، ریشهٔ هدف `qa-artifacts`، marker نظر،
URL artifact مربوط به Actions، URL اجرا، و منبع درخواست فراخوانی می‌کنند. این ابزار artifactهای اعلام‌شده را
به branch `qa-artifacts` کپی می‌کند، یک نظر PR با اولویت summary و شامل
تصویرها/پیش‌نمایش‌های inline و ویدئوهای لینک‌شده می‌سازد، سپس نظر marker موجود را به‌روزرسانی می‌کند یا
یکی ایجاد می‌کند.

همچنین می‌توانید اجرای status-reactions را مستقیماً از یک نظر PR فعال کنید:

```text
@Mantis discord status reactions
```

محرک نظر عمداً محدود است. این محرک فقط روی نظرهای pull request
از کاربرانی با دسترسی write، maintain، یا admin اجرا می‌شود، و فقط درخواست‌های
status-reaction مربوط به Discord را می‌شناسد. به‌صورت پیش‌فرض از ref پایهٔ خرابِ شناخته‌شده
و SHA سر فعلی PR به‌عنوان candidate استفاده می‌کند. نگه‌دارندگان می‌توانند هرکدام از
refها را بازنویسی کنند:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

نمونه فرمان‌های ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

فرمان اول صریح و متمرکز بر سناریو است. فرمان دوم می‌تواند بعداً یک PR
یا issue را بر اساس labelها، فایل‌های تغییرکرده، و یافته‌های بازبینی
ClawSweeper به سناریوهای پیشنهادی Mantis نگاشت کند.

## چرخهٔ اجرای Run

1. دریافت credentials.
2. تخصیص یا استفادهٔ دوباره از یک VM.
3. آماده‌سازی پروفایل desktop/browser وقتی سناریو به شواهد UI نیاز دارد.
4. آماده‌سازی یک checkout تمیز برای ref پایه.
5. نصب dependencyها و build کردن فقط بخش‌هایی که سناریو نیاز دارد.
6. راه‌اندازی یک OpenClaw Gateway فرزند با دایرکتوری state ایزوله.
7. پیکربندی transport زنده، provider، model، و پروفایل browser.
8. اجرای سناریو و ثبت شواهد پایه.
9. توقف Gateway و حفظ logها.
10. آماده‌سازی ref candidate در همان VM.
11. اجرای همان سناریو و ثبت شواهد candidate.
12. مقایسهٔ نتایج oracle و شواهد بصری.
13. نوشتن artifactهای Markdown، JSON، log، screenshot، و trace اختیاری.
14. آپلود artifactهای GitHub Actions.
15. ارسال یک پیام وضعیت کوتاه در PR یا Discord.

سناریو باید بتواند به دو روش متفاوت fail شود:

- **Bug بازتولید شد**: baseline به روش مورد انتظار fail شد.
- **Failure در harness**: راه‌اندازی محیط، credentials، API مربوط به Discord، browser، یا
  provider پیش از معنادار شدن oracle مربوط به bug fail شد.

گزارش نهایی باید این حالت‌ها را جدا کند تا نگه‌دارندگان محیط ناپایدار را با
رفتار محصول اشتباه نگیرند.

## MVP مربوط به Discord

سناریوی اول باید status reactionهای Discord را در channelهای guild هدف بگیرد که در آن‌ها
حالت تحویل پاسخ منبع `message_tool_only` است.

چرا seed خوبی برای Mantis است:

- در Discord به‌صورت reaction روی پیام محرک دیده می‌شود.
- از طریق وضعیت reaction پیام Discord یک oracle قوی REST دارد.
- یک OpenClaw Gateway واقعی، احراز هویت bot در Discord، dispatch پیام،
  حالت تحویل پاسخ منبع، وضعیت status reaction، و چرخهٔ عمر turn مدل را تمرین می‌دهد.
- به‌اندازهٔ کافی محدود است تا نخستین پیاده‌سازی را دقیق نگه دارد.

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

شواهد baseline باید reaction تأیید در صف را نشان دهد اما در حالت tool-only هیچ
انتقال چرخهٔ عمر را نشان ندهد. شواهد candidate باید نشان دهد status reactionهای چرخهٔ عمر
وقتی `messages.statusReactions.enabled` صریحاً true است اجرا می‌شوند.

نخستین برش اجرایی، سناریوی QA زندهٔ opt-in مربوط به Discord است:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

این فرمان SUT را با مدیریت همیشه‌فعال guild، `visibleReplies:
"message_tool"`، `ackReaction: "👀"`، و status reactionهای صریح پیکربندی می‌کند. oracle
پیام محرک واقعی Discord را poll می‌کند و انتظار sequence مشاهده‌شدهٔ
`👀 -> 🤔 -> 👍` را دارد. Artifactها شامل `discord-qa-reaction-timelines.json`،
`discord-status-reactions-tool-only-timeline.html`، و
`discord-status-reactions-tool-only-timeline.png` هستند.

## قطعات QA موجود

Mantis باید به‌جای شروع از صفر، بر stack خصوصی QA موجود بنا شود:

- `pnpm openclaw qa discord` از قبل یک lane زندهٔ Discord را با botهای driver و
  SUT اجرا می‌کند.
- runner مربوط به live transport از قبل reportها و artifactهای observed-message را
  زیر `.artifacts/qa-e2e/` می‌نویسد.
- leaseهای credential در Convex از قبل دسترسی انحصاری به credentialهای live transport
  مشترک را فراهم می‌کنند.
- سرویس کنترل browser از قبل از screenshot، snapshot،
  پروفایل‌های مدیریت‌شدهٔ headless، و پروفایل‌های CDP راه‌دور پشتیبانی می‌کند.
- QA Lab از قبل یک UI و bus دیباگر برای تست‌هایی با شکل transport دارد.

نخستین پیاده‌سازی Mantis می‌تواند یک runner سبک before/after روی این
قطعات، به‌علاوهٔ یک لایهٔ شواهد بصری باشد.

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
Markdown برای نظرهای PR و بازبینی انسانی است.

summary باید شامل این موارد باشد:

- refها و SHAهای تست‌شده
- transport و شناسهٔ سناریو
- provider ماشین و شناسهٔ ماشین یا شناسهٔ lease
- منبع credential بدون مقادیر secret
- نتیجهٔ baseline
- نتیجهٔ candidate
- اینکه آیا bug روی baseline بازتولید شد یا نه
- اینکه آیا candidate آن را fix کرد یا نه
- مسیرهای artifact
- مسائل setup یا cleanup پاک‌سازی‌شده

Screenshotها شواهد هستند، نه secret. با این حال همچنان به انضباط redaction نیاز دارند:
ممکن است نام channelهای خصوصی، نام‌های کاربری، یا محتوای پیام ظاهر شود. برای PRهای عمومی،
تا زمانی که داستان redaction قوی‌تر نشده است، لینک artifactهای GitHub Actions را به تصویرهای inline
ترجیح دهید.

## Browser و VNC

lane مربوط به browser دو حالت دارد:

- **Automation بدون head**: پیش‌فرض برای CI. Chrome با CDP فعال اجرا می‌شود، و
  Playwright یا کنترل browser در OpenClaw screenshot ثبت می‌کند.
- **Rescue با VNC**: روی همان VM فعال می‌شود وقتی login، MFA، ضداتوماسیون Discord،
  یا دیباگ بصری به انسان نیاز دارد.

پروفایل browser ناظر Discord باید به‌اندازه‌ای پایدار باشد که از login برای
هر اجرا جلوگیری کند، اما از state browser شخصی ایزوله باشد. یک پروفایل
متعلق به pool ماشین Mantis است، نه لپ‌تاپ توسعه‌دهنده.

وقتی Mantis گیر می‌کند، یک پیام وضعیت Discord با این موارد ارسال می‌کند:

- شناسهٔ run
- شناسهٔ سناریو
- provider ماشین
- دایرکتوری artifact
- دستورالعمل‌های اتصال VNC یا noVNC در صورت موجود بودن
- متن کوتاه blocker

نخستین deployment خصوصی می‌تواند این پیام‌ها را ابتدا به channel operator موجود
ارسال کند و بعداً به یک channel اختصاصی Mantis منتقل شود.

## ماشین‌ها

Mantis باید برای نخستین پیاده‌سازی راه‌دور AWS از طریق Crabbox را ترجیح دهد.
Crabbox ماشین‌های آماده، رهگیری lease، hydration، logها، نتایج، و
cleanup را فراهم می‌کند. اگر ظرفیت AWS خیلی کند یا ناموجود بود، یک provider
Hetzner پشت همان interface ماشین اضافه کنید.

حداقل نیازمندی‌های VM:

- Linux با نصب Chrome یا Chromium که توانایی desktop داشته باشد
- دسترسی CDP برای automation مرورگر
- VNC یا noVNC برای rescue
- Node 22 و pnpm
- checkout مربوط به OpenClaw و cache dependencyها
- cache مرورگر Playwright Chromium وقتی از Playwright استفاده می‌شود
- CPU و memory کافی برای یک OpenClaw Gateway، یک browser، و یک اجرای model
- دسترسی outbound به Discord، GitHub، providerهای model، و credential broker

VM نباید secretهای خام بلندمدت را بیرون از storeهای مورد انتظار credential یا
پروفایل browser نگه دارد.

## Secretها

Secretها برای اجراهای راه‌دور در secretهای organization یا repository در GitHub زندگی می‌کنند، و برای
اجراهای local در یک فایل secret تحت کنترل operator محلی.

نام‌های secret پیشنهادی:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` برای آپلود artifactهای عمومی GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

در بلندمدت، pool credential مربوط به Convex باید منبع معمول برای credentialهای live transport
باقی بماند. Secretهای GitHub، broker و laneهای fallback را bootstrap می‌کنند.
Workflow مربوط به status-reactions در Discord، secretهای Mantis Crabbox را دوباره به
متغیرهای محیطی `CRABBOX_COORDINATOR` و `CRABBOX_COORDINATOR_TOKEN`
که CLI مربوط به Crabbox انتظار دارد نگاشت می‌کند. نام‌های secret سادهٔ `CRABBOX_*` در GitHub همچنان
به‌عنوان fallback سازگار پذیرفته می‌شوند.

runner مربوط به Mantis هرگز نباید این موارد را چاپ کند:

- tokenهای bot در Discord
- کلیدهای API مربوط به provider
- cookieهای browser
- محتوای auth profile
- passwordهای VNC
- payloadهای خام credential

آپلودهای artifact عمومی همچنین باید metadata هدف Discord مانند شناسه‌های bot،
guild، channel، و message را redact کنند. Workflow smoke در GitHub به همین دلیل
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` را فعال می‌کند.

اگر یک token به‌اشتباه در issue، PR، chat، یا log paste شد، پس از ذخیره شدن
secret جدید آن را rotate کنید.

## Artifactهای GitHub و نظرهای PR

Workflowهای Mantis باید bundle کامل شواهد را به‌صورت یک artifact کوتاه‌عمر Actions
آپلود کنند. وقتی workflow برای یک bug report یا fix PR اجرا می‌شود، باید
screenshotهای PNG پاک‌سازی‌شده را نیز در branch `qa-artifacts` منتشر کند و یک
نظر روی آن bug یا fix PR با screenshotهای inline قبل/بعد upsert کند. اثبات
اصلی را فقط روی یک PR عمومی QA automation منتشر نکنید. logهای خام، پیام‌های
مشاهده‌شده، و دیگر شواهد حجیم در artifact مربوط به Actions باقی می‌مانند.

Workflowهای production باید آن نظرها را با GitHub App مربوط به Mantis ارسال کنند، نه
با `github-actions[bot]`. شناسهٔ app و کلید خصوصی را به‌عنوان secretهای GitHub Actions
با نام‌های `MANTIS_GITHUB_APP_ID` و `MANTIS_GITHUB_APP_PRIVATE_KEY` ذخیره کنید.
Workflow از یک marker پنهان به‌عنوان کلید upsert استفاده می‌کند، وقتی token بتواند آن را edit کند آن
نظر را به‌روزرسانی می‌کند، و وقتی marker قدیمی متعلق به bot قابل ویرایش نباشد
یک نظر جدید متعلق به Mantis ایجاد می‌کند.

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

وقتی اجرا به‌دلیل failure در harness fail می‌شود، نظر باید همین را بگوید
به‌جای اینکه القا کند candidate fail شده است.

## یادداشت‌های Deployment خصوصی

ممکن است یک deployment خصوصی از قبل یک application مربوط به Mantis در Discord داشته باشد. وقتی آن application
مجوزهای bot درست را دارد و می‌تواند با ایمنی rotate شود، به‌جای ساختن app دیگر از همان
application استفاده کنید.

channel اولیهٔ notification مربوط به operator را از طریق secretها یا پیکربندی deployment
تنظیم کنید. این مقدار می‌تواند ابتدا به channel موجود maintainer یا operations اشاره کند،
سپس وقتی channel اختصاصی Mantis ایجاد شد به آن منتقل شود.

شناسه‌های guild، شناسه‌های channel، tokenهای bot، cookieهای browser، یا passwordهای VNC را
در این سند قرار ندهید. آن‌ها را در secretهای GitHub، credential broker، یا
secret store محلی operator ذخیره کنید.

## افزودن یک سناریو

یک سناریوی Mantis باید این موارد را declare کند:

- شناسه و عنوان
- ترابری
- اعتبارنامه‌های لازم
- خط‌مشی مرجع مبنا
- خط‌مشی مرجع نامزد
- وصلهٔ پیکربندی OpenClaw
- مراحل راه‌اندازی
- محرک
- اوراکل مبنای مورد انتظار
- اوراکل نامزد مورد انتظار
- هدف‌های ثبت تصویری
- بودجهٔ زمان انتظار
- مراحل پاک‌سازی

سناریوها باید اوراکل‌های کوچک و تایپ‌شده را ترجیح دهند:

- وضعیت واکنش Discord برای باگ‌های واکنش
- ارجاع‌های پیام Discord برای باگ‌های رشته‌بندی
- ts رشتهٔ Slack و وضعیت API واکنش برای باگ‌های Slack
- شناسه‌های پیام و سرآیندهای ایمیل برای باگ‌های ایمیل
- نماگرفت‌های مرورگر وقتی UI تنها مشاهده‌پذیر قابل اعتماد است

بررسی‌های بینایی باید افزایشی باشند. اگر API پلتفرم بتواند باگ را اثبات کند، از
API به‌عنوان اوراکل قبولی/رد استفاده کنید و نماگرفت‌ها را برای اطمینان انسانی نگه دارید.

## گسترش ارائه‌دهنده

پس از Discord، همان اجراکننده می‌تواند موارد زیر را اضافه کند:

- Slack: واکنش‌ها، رشته‌ها، اشاره به برنامه، مودال‌ها، بارگذاری فایل.
- ایمیل: احراز هویت Gmail و رشته‌بندی پیام با استفاده از `gog` وقتی اتصال‌دهنده‌ها کافی نیستند.
- WhatsApp: ورود با QR، شناسایی دوباره، تحویل پیام، رسانه، واکنش‌ها.
- Telegram: دروازه‌گذاری اشاره در گروه، فرمان‌ها، واکنش‌ها در صورت پشتیبانی.
- Matrix: اتاق‌های رمزگذاری‌شده، روابط رشته یا پاسخ، ازسرگیری پس از راه‌اندازی دوباره.

هر ترابری باید یک سناریوی دود ارزان و یک یا چند سناریوی کلاس باگ داشته باشد.
سناریوهای تصویری پرهزینه باید اختیاری باقی بمانند.

## پرسش‌های باز

- وقتی بات موجود Mantis دوباره استفاده می‌شود، کدام بات Discord باید راننده باشد و کدام باید SUT باشد؟
- آیا ورود مرورگر ناظر باید از یک حساب انسانی Discord، یک حساب آزمایشی،
  یا فقط شواهد REST قابل خواندن توسط بات برای فاز نخست استفاده کند؟
- GitHub باید مصنوعات Mantis را برای PRها چه مدت نگه دارد؟
- ClawSweeper چه زمانی باید به‌جای انتظار برای فرمان نگه‌دارنده،
  Mantis را به‌طور خودکار توصیه کند؟
- آیا نماگرفت‌ها باید پیش از بارگذاری برای PRهای عمومی ویرایش یا برش داده شوند؟
