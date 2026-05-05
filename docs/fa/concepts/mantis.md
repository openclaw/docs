---
read_when:
    - ساخت یا اجرای QA بصری زنده برای باگ‌های OpenClaw
    - افزودن راستی‌آزمایی قبل و بعد برای یک درخواست ادغام
    - افزودن سناریوهای انتقال زنده برای Discord، Slack، WhatsApp یا موارد دیگر
    - اشکال‌زدایی اجراهای تضمین کیفیت که به تصویرهای صفحه، خودکارسازی مرورگر یا دسترسی VNC نیاز دارند
summary: Mantis سامانهٔ بصری راستی‌آزمایی سرتاسری برای بازتولید باگ‌های OpenClaw روی ترنسپورت‌های زنده، ثبت شواهد قبل و بعد، و پیوست کردن آرتیفکت‌ها به PRها است.
title: آخوندک
x-i18n:
    generated_at: "2026-05-05T08:25:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b287e2832e3e49de6b3cb65aeb1d381a36fc30ce9c94dc5b6b4d7e928c2706c
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis سامانهٔ راستی‌آزمایی سرتاسری OpenClaw برای باگ‌هایی است که به محیط اجرای واقعی، انتقال واقعی، و شواهد قابل مشاهده نیاز دارند. این سامانه یک سناریو را روی یک ref خرابِ شناخته‌شده اجرا می‌کند، شواهد را ثبت می‌کند، همان سناریو را روی یک ref کاندید اجرا می‌کند، و مقایسه را به‌صورت آرتیفکت‌هایی منتشر می‌کند که یک نگه‌دارنده می‌تواند از یک PR یا از یک فرمان محلی بررسی کند.

Mantis با Discord شروع می‌کند، چون Discord یک مسیر اول با ارزش بالا به ما می‌دهد: احراز هویت واقعی bot، کانال‌های واقعی guild، واکنش‌ها، threadها، فرمان‌های بومی، و یک UI مرورگر که انسان‌ها می‌توانند در آن به‌صورت دیداری تأیید کنند که انتقال چه چیزی نشان داده است.

## اهداف

- بازتولید یک باگ از یک issue یا PR در GitHub با همان شکل انتقالی که کاربران می‌بینند.
- ثبت یک آرتیفکت **قبل** روی ref مبنا پیش از اعمال اصلاح.
- ثبت یک آرتیفکت **بعد** روی ref کاندید پس از اعمال اصلاح.
- هرجا ممکن است از یک oracle قطعی استفاده شود، مانند خواندن واکنش از Discord REST یا بررسی رونوشت کانال.
- وقتی باگ سطح UI قابل مشاهده دارد، screenshot ثبت شود.
- اجرا به‌صورت محلی از یک CLI تحت کنترل agent و از راه دور از GitHub.
- حفظ وضعیت کافی ماشین برای نجات از طریق VNC وقتی ورود، اتوماسیون مرورگر، یا احراز هویت provider گیر می‌کند.
- ارسال وضعیت کوتاه به یک کانال operator در Discord وقتی اجرا مسدود شده، به کمک دستی VNC نیاز دارد، یا تمام می‌شود.

## موارد خارج از هدف

- Mantis جایگزین unit testها نیست. یک اجرای Mantis معمولاً باید پس از فهمیده شدن اصلاح، به یک regression test کوچک‌تر تبدیل شود.
- Mantis گیت سریع معمول CI نیست. کندتر است، از credentialهای زنده استفاده می‌کند، و برای باگ‌هایی نگه داشته می‌شود که محیط زنده در آن‌ها اهمیت دارد.
- Mantis نباید برای عملیات معمول به انسان نیاز داشته باشد. VNC دستی مسیر نجات است، نه مسیر خوشحال.
- Mantis secretهای خام را در آرتیفکت‌ها، logها، screenshotها، گزارش‌های Markdown، یا commentهای PR ذخیره نمی‌کند.

## مالکیت

Mantis در پشتهٔ QA مربوط به OpenClaw قرار دارد.

- OpenClaw مالک runtime سناریو، adapterهای انتقال، schema شواهد، و CLI محلی زیر `pnpm openclaw qa mantis` است.
- QA Lab مالک قطعات harness انتقال زنده، helperهای ثبت مرورگر، و writerهای آرتیفکت است.
- Crabbox مالک ماشین‌های Linux گرم‌شده وقتی به VM راه دور نیاز است.
- GitHub Actions مالک نقطهٔ ورود workflow راه دور و نگه‌داری آرتیفکت است.
- ClawSweeper مالک مسیریابی commentهای GitHub است: parsing فرمان‌های نگه‌دارنده، dispatch کردن workflow، و ارسال comment نهایی PR.
- agentهای OpenClaw وقتی یک سناریو به setup عامل‌محور، debugging، یا گزارش وضعیت گیرکرده نیاز دارد، Mantis را از طریق Codex هدایت می‌کنند.

این مرز، دانش انتقال را در OpenClaw، زمان‌بندی ماشین را در Crabbox، و چسب workflow نگه‌دارنده را در ClawSweeper نگه می‌دارد.

## شکل فرمان

اولین فرمان محلی، bot در Discord، guild، کانال، ارسال پیام، ارسال واکنش، و مسیر آرتیفکت را راستی‌آزمایی می‌کند:

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

runner، worktreeهای جداشدهٔ baseline و candidate را زیر دایرکتوری خروجی ایجاد می‌کند، dependencyها را نصب می‌کند، هر ref را build می‌کند، سناریو را با `--allow-failures` اجرا می‌کند، سپس `baseline/`، `candidate/`، `comparison.json`، و `mantis-report.md` را می‌نویسد. برای اولین سناریوی Discord، راستی‌آزمایی موفق یعنی وضعیت baseline برابر `fail` و وضعیت candidate برابر `pass` است.

اولین primitive مربوط به VM/browser، smoke دسکتاپ است:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

این فرمان یک ماشین دسکتاپ Crabbox را اجاره می‌کند یا دوباره به‌کار می‌گیرد، یک مرورگر قابل مشاهده را داخل نشست VNC شروع می‌کند، دسکتاپ را ثبت می‌کند، آرتیفکت‌ها را به دایرکتوری خروجی محلی برمی‌گرداند، و فرمان اتصال مجدد را داخل گزارش می‌نویسد. فرمان به‌صورت پیش‌فرض از provider مربوط به Hetzner استفاده می‌کند، چون اولین provider با پوشش دسکتاپ/VNC کارا در مسیر Mantis است. هنگام اجرا روی fleet دیگری از Crabbox، آن را با `--provider`، `--crabbox-bin`، یا `OPENCLAW_MANTIS_CRABBOX_PROVIDER` override کنید.

flagهای مفید smoke دسکتاپ:

- `--lease-id <cbx_...>` یا `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` یک دسکتاپ گرم‌شده را دوباره به‌کار می‌گیرد.
- `--browser-url <url>` صفحه‌ای را که در مرورگر قابل مشاهده باز می‌شود تغییر می‌دهد.
- `--html-file <path>` یک آرتیفکت HTML محلی repo را در مرورگر قابل مشاهده render می‌کند. Mantis از این برای ثبت timeline تولیدشدهٔ واکنش وضعیت Discord از طریق یک دسکتاپ واقعی Crabbox استفاده می‌کند.
- `--keep-lease` یا `OPENCLAW_MANTIS_KEEP_VM=1` یک lease تازه‌ساختهٔ موفق را برای بررسی VNC باز نگه می‌دارد. اجراهای ناموفق وقتی lease ایجاد شده باشد به‌صورت پیش‌فرض lease را نگه می‌دارند تا یک operator بتواند دوباره وصل شود.
- `--class`، `--idle-timeout`، و `--ttl` اندازهٔ ماشین و طول عمر lease را تنظیم می‌کنند.

اولین primitive کامل انتقال دسکتاپ، smoke دسکتاپ Slack است:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

این فرمان یک ماشین دسکتاپ Crabbox را اجاره می‌کند یا دوباره به‌کار می‌گیرد، checkout فعلی را داخل VM همگام‌سازی می‌کند، `pnpm openclaw qa slack` را داخل همان VM اجرا می‌کند، Slack Web را در مرورگر VNC باز می‌کند، دسکتاپ قابل مشاهده را ثبت می‌کند، و هم آرتیفکت‌های Slack QA و هم screenshot مربوط به VNC را به دایرکتوری خروجی محلی کپی می‌کند. این اولین شکل Mantis است که در آن Gateway مربوط به OpenClaw در SUT و مرورگر هر دو داخل همان VM دسکتاپ Linux زندگی می‌کنند.

با `--gateway-setup`، فرمان یک home پایدار و دورریختنی OpenClaw را در `$HOME/.openclaw-mantis/slack-openclaw` آماده می‌کند، پیکربندی Slack Socket Mode را برای کانال انتخاب‌شده patch می‌کند، `openclaw gateway run` را روی پورت `38973` شروع می‌کند، و Chrome را در نشست VNC در حال اجرا نگه می‌دارد. این حالت «یک دسکتاپ Linux با Slack و یک claw در حال اجرا برایم باقی بگذار» است؛ وقتی `--gateway-setup` حذف شود، مسیر Slack QA بین botها همچنان پیش‌فرض می‌ماند.

ورودی‌های لازم برای `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` برای مسیر مدل راه دور. اگر فقط
  `OPENAI_API_KEY` به‌صورت محلی تنظیم شده باشد، Mantis پیش از فراخوانی Crabbox آن را به `OPENCLAW_LIVE_OPENAI_KEY` نگاشت می‌کند تا forwarding env مربوط به `OPENCLAW_*` در Crabbox بتواند آن را به VM منتقل کند.

flagهای مفید دسکتاپ Slack:

- `--lease-id <cbx_...>` اجرا را روی ماشینی تکرار می‌کند که یک operator قبلاً از طریق VNC وارد Slack Web شده است.
- `--gateway-setup` به‌جای فقط اجرای مسیر QA بین botها، یک Gateway پایدار OpenClaw برای Slack را در VM شروع می‌کند.
- `--slack-url <url>` یک URL مشخص از Slack Web را باز می‌کند. بدون آن، وقتی token مربوط به SUT bot در دسترس باشد، Mantis از Slack `auth.test` مقدار `https://app.slack.com/client/<team>/<channel>` را استخراج می‌کند.
- `--slack-channel-id <id>` allowlist کانال Slack را که setup Gateway استفاده می‌کند کنترل می‌کند.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` پروفایل پایدار Chrome داخل VM را کنترل می‌کند. مقدار پیش‌فرض `$HOME/.config/openclaw-mantis/slack-chrome-profile` است، بنابراین ورود دستی به Slack Web روی همان lease در اجرای دوباره باقی می‌ماند.
- `--credential-source convex --credential-role ci` به‌جای tokenهای مستقیم Slack در env، از pool مشترک credential استفاده می‌کند.
- `--provider-mode`، `--model`، `--alt-model`، و `--fast` به مسیر زندهٔ Slack پاس داده می‌شوند.

workflow مربوط به smoke در GitHub برابر `Mantis Discord Smoke` است. workflow قبل و بعد در GitHub برای اولین سناریوی واقعی برابر `Mantis Discord Status Reactions` است. این موارد را می‌پذیرد:

- `baseline_ref`: ref که انتظار می‌رود رفتار فقط-queued را بازتولید کند.
- `candidate_ref`: ref که انتظار می‌رود `queued -> thinking -> done` را نشان دهد.

این workflow، ref مربوط به harness workflow را checkout می‌کند، worktreeهای جداگانهٔ baseline و candidate را build می‌کند، `discord-status-reactions-tool-only` را روی هر worktree اجرا می‌کند، و `baseline/`، `candidate/`، `comparison.json`، و `mantis-report.md` را به‌عنوان آرتیفکت‌های Actions upload می‌کند. همچنین HTML مربوط به timeline هر مسیر را در یک مرورگر دسکتاپ Crabbox render می‌کند و آن screenshotهای VNC را کنار PNGهای timeline قطعی در comment مربوط به PR منتشر می‌کند. همان comment در PR، previewهای GIF سبک و motion-trimmed تولیدشده با `crabbox media preview` را embed می‌کند، به کلیپ‌های MP4 متناظر و motion-trimmed لینک می‌دهد، و فایل‌های MP4 کامل دسکتاپ را برای بررسی عمیق نگه می‌دارد. screenshotها برای بازبینی سریع inline باقی می‌مانند. workflow، CLI مربوط به Crabbox را از
`openclaw/crabbox` main build می‌کند تا بتواند پیش از انتشار binary بعدی Crabbox، از flagهای فعلی lease دسکتاپ/مرورگر استفاده کند.

`Mantis Scenario` نقطهٔ ورود دستی generic است. یک `scenario_id`، `candidate_ref`، یک `baseline_ref` اختیاری، و یک `pr_number` اختیاری می‌گیرد، سپس workflow متعلق به سناریو را dispatch می‌کند. wrapper عمداً نازک است: workflowهای سناریو همچنان مالک setup انتقال، credentialها، کلاس VM، oracle مورد انتظار، و manifest آرتیفکت خود هستند.

`Mantis Slack Desktop Smoke` اولین workflow مربوط به VM در Slack است. این workflow، ref کاندید مورد اعتماد را در یک worktree جداگانه checkout می‌کند، یک دسکتاپ Linux در Crabbox اجاره می‌کند، `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` را روی آن کاندید اجرا می‌کند، Slack Web را در مرورگر VNC باز می‌کند، دسکتاپ را ضبط می‌کند، با `crabbox media preview` یک preview با motion-trim تولید می‌کند، کل دایرکتوری آرتیفکت را upload می‌کند، و به‌صورت اختیاری comment شواهد inline را روی PR هدف ارسال می‌کند. وقتی به‌جای فقط یک رونوشت Slack بین botها، «یک دسکتاپ Linux با Slack و یک claw در حال اجرا» می‌خواهید، از این مسیر استفاده کنید.

هر سناریوی منتشرکننده روی PR، `mantis-evidence.json` را کنار گزارش خود می‌نویسد. این schema نقطهٔ تحویل بین کد سناریو و commentهای GitHub است:

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

مقدارهای `path` مربوط به آرتیفکت، نسبت به دایرکتوری manifest هستند. مقدارهای `targetPath` مسیرهای نسبی زیر دایرکتوری انتشار branch با نام `qa-artifacts` هستند. publisher از path traversal جلوگیری می‌کند و وقتی previewها یا videoهای اختیاری در دسترس نباشند، entryهایی را که با `"required": false` علامت‌گذاری شده‌اند skip می‌کند.

گونه‌های پشتیبانی‌شدهٔ آرتیفکت:

- `timeline`: screenshot قطعی سناریو، معمولاً قبل/بعد.
- `desktopScreenshot`: screenshot دسکتاپ VNC/مرورگر.
- `motionPreview`: GIF متحرک inline که از ضبط دسکتاپ تولید شده است.
- `motionClip`: MP4 با motion-trim که lead-in و tail ایستا را حذف می‌کند.
- `fullVideo`: ضبط کامل MP4 برای بررسی عمیق.
- `metadata`: sidecar مربوط به JSON/log.
- `report`: گزارش Markdown.

publisher قابل استفادهٔ مجدد `scripts/mantis/publish-pr-evidence.mjs` است. workflowها آن را با manifest، PR هدف، ریشهٔ هدف `qa-artifacts`، marker مربوط به comment، URL آرتیفکت Actions، URL اجرا، و منبع درخواست فراخوانی می‌کنند. این ابزار آرتیفکت‌های اعلام‌شده را به branch با نام `qa-artifacts` کپی می‌کند، یک comment PR با summary در ابتدا و imageها/previewهای inline و videoهای لینک‌شده می‌سازد، سپس comment marker موجود را update می‌کند یا یک مورد جدید می‌سازد.

همچنین می‌توانید اجرای status-reactions را مستقیماً از یک comment در PR trigger کنید:

```text
@Mantis discord status reactions
```

trigger مربوط به comment عمداً محدود است. فقط روی commentهای pull request از کاربرانی اجرا می‌شود که دسترسی write، maintain، یا admin دارند، و فقط درخواست‌های مربوط به status-reaction در Discord را تشخیص می‌دهد. به‌صورت پیش‌فرض از ref مبنای خرابِ شناخته‌شده و SHA فعلی head مربوط به PR به‌عنوان کاندید استفاده می‌کند. نگه‌دارنده‌ها می‌توانند هر یک از refها را override کنند:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

نمونه فرمان‌های ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

فرمان اول صریح و متمرکز بر سناریو است. فرمان دوم می‌تواند بعداً یک PR
یا issue را بر اساس برچسب‌ها، فایل‌های تغییرکرده، و یافته‌های بازبینی
ClawSweeper به سناریوهای پیشنهادی Mantis نگاشت کند.

## چرخهٔ عمر اجرا

1. دریافت اعتبارنامه‌ها.
2. تخصیص یا استفادهٔ دوباره از یک VM.
3. آماده‌سازی پروفایل دسکتاپ/مرورگر وقتی سناریو به شواهد UI نیاز دارد.
4. آماده‌سازی یک checkout تمیز برای ref مبنا.
5. نصب وابستگی‌ها و ساخت فقط آنچه سناریو نیاز دارد.
6. راه‌اندازی یک OpenClaw Gateway فرزند با دایرکتوری وضعیت ایزوله.
7. پیکربندی انتقال زنده، provider، مدل، و پروفایل مرورگر.
8. اجرای سناریو و ثبت شواهد مبنا.
9. توقف gateway و نگهداری گزارش‌ها.
10. آماده‌سازی ref نامزد در همان VM.
11. اجرای همان سناریو و ثبت شواهد نامزد.
12. مقایسهٔ نتایج oracle و شواهد بصری.
13. نوشتن Markdown، JSON، گزارش‌ها، اسکرین‌شات‌ها، و مصنوعات trace اختیاری.
14. بارگذاری مصنوعات GitHub Actions.
15. ارسال یک پیام وضعیت کوتاه در PR یا Discord.

سناریو باید بتواند به دو روش متفاوت شکست بخورد:

- **بازآفرینی باگ**: مبنا به شکل مورد انتظار شکست خورد.
- **شکست harness**: راه‌اندازی محیط، اعتبارنامه‌ها، Discord API، مرورگر، یا
  provider پیش از معنادار شدن oracle باگ شکست خورد.

گزارش نهایی باید این موارد را جدا کند تا نگه‌دارندگان یک محیط ناپایدار را با
رفتار محصول اشتباه نگیرند.

## MVP مربوط به Discord

سناریوی اول باید واکنش‌های وضعیت Discord را در کانال‌های guild هدف بگیرد، جایی که
حالت تحویل پاسخ منبع `message_tool_only` است.

چرا یک بذر خوب برای Mantis است:

- در Discord به صورت واکنش‌ها روی پیام آغازگر قابل مشاهده است.
- از طریق وضعیت واکنش پیام Discord یک oracle قوی مبتنی بر REST دارد.
- یک OpenClaw Gateway واقعی، احراز هویت bot در Discord، ارسال پیام،
  حالت تحویل پاسخ منبع، وضعیت واکنش، و چرخهٔ عمر نوبت مدل را تمرین می‌دهد.
- به اندازهٔ کافی محدود است تا پیاده‌سازی اول را دقیق نگه دارد.

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

شواهد مبنا باید واکنش تأیید صف‌شده را نشان دهد، اما هیچ گذار چرخهٔ عمری در حالت
فقط ابزار نشان ندهد. شواهد نامزد باید نشان دهد وقتی
`messages.statusReactions.enabled` صریحاً `true` است، واکنش‌های وضعیت چرخهٔ عمر
اجرا می‌شوند.

اولین برش اجرایی، سناریوی QA زندهٔ Discord به‌صورت opt-in است:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

این فرمان SUT را با مدیریت همیشگی guild، `visibleReplies:
"message_tool"`، `ackReaction: "👀"`، و واکنش‌های وضعیت صریح پیکربندی می‌کند.
oracle پیام آغازگر واقعی Discord را polling می‌کند و انتظار دنبالهٔ مشاهده‌شدهٔ
`👀 -> 🤔 -> 👍` را دارد. مصنوعات شامل
`discord-qa-reaction-timelines.json`،
`discord-status-reactions-tool-only-timeline.html`، و
`discord-status-reactions-tool-only-timeline.png` هستند.

## اجزای QA موجود

Mantis باید به‌جای شروع از صفر، بر stack خصوصی QA موجود بنا شود:

- `pnpm openclaw qa discord` از قبل یک lane زندهٔ Discord را با driver و
  botهای SUT اجرا می‌کند.
- runner انتقال زنده از قبل گزارش‌ها و مصنوعات پیام‌های مشاهده‌شده را زیر
  `.artifacts/qa-e2e/` می‌نویسد.
- leaseهای اعتبارنامهٔ Convex از قبل دسترسی انحصاری به اعتبارنامه‌های انتقال
  زندهٔ مشترک را فراهم می‌کنند.
- سرویس کنترل مرورگر از قبل از اسکرین‌شات‌ها، snapshotها، پروفایل‌های مدیریت‌شدهٔ
  headless، و پروفایل‌های CDP راه دور پشتیبانی می‌کند.
- QA Lab از قبل یک UI اشکال‌زدایی و bus برای آزمون‌گیری شبیه انتقال دارد.

اولین پیاده‌سازی Mantis می‌تواند یک runner سبکِ قبل/بعد روی همین اجزا، به‌علاوهٔ
یک لایهٔ شواهد بصری باشد.

## مدل شواهد

هر اجرا یک دایرکتوری مصنوع پایدار می‌نویسد:

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
Markdown برای دیدگاه‌های PR و بازبینی انسانی است.

خلاصه باید شامل این موارد باشد:

- refها و SHAهای آزموده‌شده
- انتقال و شناسهٔ سناریو
- provider ماشین و شناسهٔ ماشین یا شناسهٔ lease
- منبع اعتبارنامه بدون مقدارهای محرمانه
- نتیجهٔ مبنا
- نتیجهٔ نامزد
- اینکه آیا باگ روی مبنا بازآفرینی شد
- اینکه آیا نامزد آن را رفع کرد
- مسیرهای مصنوعات
- مشکلات راه‌اندازی یا پاک‌سازی sanitize‌شده

اسکرین‌شات‌ها شاهد هستند، نه secret. با این حال همچنان به انضباط redact نیاز
دارند: نام کانال‌های خصوصی، نام کاربران، یا محتوای پیام ممکن است ظاهر شود. برای
PRهای عمومی، تا وقتی داستان redact قوی‌تر نشده است، پیوندهای artifact در
GitHub Actions را به تصاویر inline ترجیح دهید.

## مرورگر و VNC

lane مرورگر دو حالت دارد:

- **اتوماسیون headless**: پیش‌فرض برای CI. Chrome با CDP فعال اجرا می‌شود، و
  Playwright یا کنترل مرورگر OpenClaw اسکرین‌شات‌ها را ثبت می‌کند.
- **نجات با VNC**: روی همان VM فعال می‌شود وقتی login، MFA، ضداتوماسیون Discord،
  یا اشکال‌زدایی بصری به انسان نیاز دارد.

پروفایل مرورگر observer مربوط به Discord باید آن‌قدر پایدار باشد که برای هر اجرا
نیازی به ورود نباشد، اما از وضعیت مرورگر شخصی ایزوله باشد. یک پروفایل متعلق به
مجموعهٔ ماشین‌های Mantis است، نه لپ‌تاپ توسعه‌دهنده.

وقتی Mantis گیر می‌کند، یک پیام وضعیت Discord با این موارد ارسال می‌کند:

- شناسهٔ اجرا
- شناسهٔ سناریو
- provider ماشین
- دایرکتوری artifact
- دستورالعمل‌های اتصال VNC یا noVNC در صورت وجود
- متن کوتاه blocker

اولین استقرار خصوصی می‌تواند این پیام‌ها را به کانال operator موجود ارسال کند و
بعداً به یک کانال اختصاصی Mantis منتقل شود.

## ماشین‌ها

Mantis باید برای اولین پیاده‌سازی راه دور، AWS از طریق Crabbox را ترجیح دهد.
Crabbox به ما ماشین‌های گرم‌شده، رهگیری lease، hydration، گزارش‌ها، نتایج، و
پاک‌سازی می‌دهد. اگر ظرفیت AWS بیش از حد کند یا در دسترس نبود، یک provider
Hetzner پشت همان interface ماشین اضافه کنید.

حداقل نیازمندی‌های VM:

- Linux با نصب Chrome یا Chromium مناسب دسکتاپ
- دسترسی CDP برای اتوماسیون مرورگر
- VNC یا noVNC برای نجات
- Node 22 و pnpm
- checkout مربوط به OpenClaw و کش وابستگی‌ها
- کش مرورگر Playwright Chromium وقتی Playwright استفاده می‌شود
- CPU و حافظهٔ کافی برای یک OpenClaw Gateway، یک مرورگر، و یک اجرای مدل
- دسترسی خروجی به Discord، GitHub، providerهای مدل، و broker اعتبارنامه

VM نباید secretهای خام بلندمدت را خارج از storeهای مورد انتظار اعتبارنامه یا
پروفایل مرورگر نگه دارد.

## Secretها

Secretها برای اجراهای راه دور در secretهای سازمان یا مخزن GitHub، و برای اجراهای
محلی در یک فایل secret تحت کنترل operator محلی قرار دارند.

نام‌های پیشنهادی secret:

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

در بلندمدت، مجموعهٔ اعتبارنامهٔ Convex باید منبع عادی اعتبارنامه‌های انتقال زنده
باقی بماند. secretهای GitHub مسیرهای broker و fallback را bootstrap می‌کنند.
workflow واکنش‌های وضعیت Discord، secretهای Mantis Crabbox را دوباره به متغیرهای
محیطی `CRABBOX_COORDINATOR` و `CRABBOX_COORDINATOR_TOKEN` نگاشت می‌کند که CLI
مربوط به Crabbox انتظار دارد. نام‌های سادهٔ secret GitHub با الگوی `CRABBOX_*`
همچنان به‌عنوان fallback سازگار پذیرفته می‌شوند.

runner مربوط به Mantis هرگز نباید این موارد را چاپ کند:

- tokenهای bot مربوط به Discord
- کلیدهای API مربوط به provider
- cookieهای مرورگر
- محتوای پروفایل auth
- passwordهای VNC
- payloadهای خام اعتبارنامه

بارگذاری‌های artifact عمومی همچنین باید metadata هدف Discord مانند شناسه‌های
bot، guild، channel، و message را redact کنند. workflow smoke مربوط به GitHub به
همین دلیل `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` را فعال می‌کند.

اگر token به‌طور تصادفی در یک issue، PR، chat، یا log paste شد، پس از ذخیره شدن
secret جدید آن را rotate کنید.

## مصنوعات GitHub و دیدگاه‌های PR

workflowهای Mantis باید بستهٔ کامل شواهد را به‌عنوان یک artifact کوتاه‌مدت
Actions بارگذاری کنند. وقتی workflow برای یک گزارش باگ یا PR رفع اجرا می‌شود،
باید اسکرین‌شات‌های PNG redact‌شده را نیز در branch `qa-artifacts` منتشر کند و
یک دیدگاه روی آن باگ یا PR رفع upsert کند که اسکرین‌شات‌های inline قبل/بعد را
دارد. اثبات اصلی را فقط روی یک PR عمومی اتوماسیون QA ارسال نکنید. logهای خام،
پیام‌های مشاهده‌شده، و دیگر شواهد حجیم در artifact مربوط به Actions باقی
می‌مانند.

workflowهای production باید آن دیدگاه‌ها را با Mantis GitHub App ارسال کنند، نه
با `github-actions[bot]`. شناسهٔ app و private key را به‌عنوان secretهای GitHub
Actions با نام‌های `MANTIS_GITHUB_APP_ID` و
`MANTIS_GITHUB_APP_PRIVATE_KEY` ذخیره کنید. workflow از یک marker پنهان به‌عنوان
کلید upsert استفاده می‌کند، وقتی token بتواند آن را ویرایش کند آن دیدگاه را
به‌روزرسانی می‌کند، و وقتی marker قدیمی متعلق به bot قابل ویرایش نباشد یک دیدگاه
جدید متعلق به Mantis ایجاد می‌کند.

دیدگاه PR باید کوتاه و بصری باشد:

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

وقتی اجرا به‌خاطر شکست harness شکست می‌خورد، دیدگاه باید همین را بگوید، نه اینکه
القای شکست نامزد کند.

## یادداشت‌های استقرار خصوصی

یک استقرار خصوصی ممکن است از قبل یک application مربوط به Mantis در Discord داشته
باشد. وقتی آن application مجوزهای درست bot را دارد و می‌توان آن را با ایمنی
rotate کرد، به‌جای ساختن یک app دیگر از همان استفاده کنید.

کانال اعلان اولیهٔ operator را از طریق secretها یا پیکربندی استقرار تنظیم کنید.
ابتدا می‌تواند به یک کانال موجود نگه‌دارنده یا عملیات اشاره کند، سپس وقتی کانال
اختصاصی Mantis ایجاد شد به آن منتقل شود.

شناسه‌های guild، شناسه‌های channel، tokenهای bot، cookieهای مرورگر، یا
passwordهای VNC را در این سند قرار ندهید. آن‌ها را در secretهای GitHub، broker
اعتبارنامه، یا secret store محلی operator ذخیره کنید.

## افزودن یک سناریو

یک سناریوی Mantis باید این موارد را اعلام کند:

- شناسه و عنوان
- انتقال
- اعتبارنامه‌های لازم
- سیاست ref مبنا
- سیاست ref نامزد
- patch پیکربندی OpenClaw
- مراحل راه‌اندازی
- محرک
- oracle مورد انتظار مبنا
- oracle مورد انتظار نامزد
- هدف‌های ثبت بصری
- بودجهٔ timeout
- مراحل پاک‌سازی

سناریوها باید oracleهای کوچک و typed را ترجیح دهند:

- وضعیت واکنش Discord برای باگ‌های واکنش
- ارجاع‌های پیام Discord برای باگ‌های thread
- thread ts و وضعیت API واکنش Slack برای باگ‌های Slack
- شناسه‌ها و headerهای پیام email برای باگ‌های email
- اسکرین‌شات‌های مرورگر وقتی UI تنها observable قابل اعتماد است

بررسی‌های vision باید افزایشی باشند. اگر API یک platform بتواند باگ را اثبات
کند، از API به‌عنوان oracle قبول/رد استفاده کنید و اسکرین‌شات‌ها را برای اطمینان
انسانی نگه دارید.

## گسترش provider

پس از Discord، همان runner می‌تواند این موارد را اضافه کند:

- Slack: واکنش‌ها، رشته‌ها، اشاره به اپ، مودال‌ها، بارگذاری فایل.
- Email: احراز هویت Gmail و رشته‌بندی پیام با استفاده از `gog` در جاهایی که کانکتورها کافی
  نیستند.
- WhatsApp: ورود با QR، شناسایی مجدد، تحویل پیام، رسانه، واکنش‌ها.
- Telegram: گیت‌گذاری اشاره در گروه، فرمان‌ها، واکنش‌ها در صورت پشتیبانی.
- Matrix: اتاق‌های رمزگذاری‌شده، رابطه‌های رشته یا پاسخ، ازسرگیری پس از راه‌اندازی مجدد.

هر ترنسپورت باید یک سناریوی smoke سبک و یک یا چند سناریوی مربوط به رده‌های
باگ داشته باشد. سناریوهای بصری پرهزینه باید اختیاری بمانند.

## پرسش‌های باز

- وقتی بات موجود Mantis دوباره استفاده می‌شود، کدام بات Discord باید درایور باشد و کدام باید SUT باشد؟
- آیا ورود مرورگر ناظر باید از یک حساب انسانی Discord، یک حساب آزمایشی،
  یا فقط شواهد REST قابل خواندن توسط بات برای فاز نخست استفاده کند؟
- GitHub تا چه مدت باید مصنوعات Mantis را برای PRها نگه دارد؟
- ClawSweeper چه زمانی باید به‌جای انتظار برای فرمان نگه‌دارنده، به‌طور خودکار Mantis را توصیه کند؟
- آیا اسکرین‌شات‌ها باید پیش از بارگذاری برای PRهای عمومی ویرایش یا برش داده شوند؟
