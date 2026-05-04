---
read_when:
    - ساخت یا اجرای تضمین کیفیت بصری زنده برای باگ‌های OpenClaw
    - افزودن راستی‌آزمایی قبل و بعد برای یک درخواست کشش
    - افزودن Discord، Slack، WhatsApp یا سناریوهای ترابری زندهٔ دیگر
    - اشکال‌زدایی اجراهای QA که به اسکرین‌شات، خودکارسازی مرورگر یا دسترسی VNC نیاز دارند
summary: Mantis سامانهٔ راستی‌آزمایی بصری سرتاسری برای بازتولید باگ‌های OpenClaw روی بسترهای انتقال زنده، ثبت شواهد قبل و بعد، و پیوست کردن آرتیفکت‌ها به PRها است.
title: آخوندک
x-i18n:
    generated_at: "2026-05-04T07:03:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d3f3fa3db111b1b5c85f8efeccd749fbd5885cee6b7843ca4c8d049acfd9164
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis سامانه راستی‌آزمایی سرتاسری OpenClaw برای باگ‌هایی است که به runtime واقعی، transport واقعی و شواهد قابل مشاهده نیاز دارند. این سامانه یک سناریو را روی ref شناخته‌شده معیوب اجرا می‌کند، شواهد را ثبت می‌کند، همان سناریو را روی ref نامزد اجرا می‌کند و مقایسه را به‌صورت artifacts منتشر می‌کند تا نگه‌دارنده بتواند آن را از یک PR یا از یک فرمان محلی بررسی کند.

Mantis با Discord شروع می‌شود چون Discord یک مسیر نخست با ارزش بالا در اختیار ما می‌گذارد: احراز هویت واقعی بات، کانال‌های واقعی guild، reactionها، threadها، فرمان‌های بومی و یک رابط کاربری مرورگر که انسان‌ها می‌توانند در آن به‌صورت بصری تأیید کنند transport چه چیزی نشان داده است.

## اهداف

- بازتولید یک باگ از یک issue یا PR در GitHub با همان شکل transport که کاربران می‌بینند.
- ثبت یک artifact **قبل** روی ref مبنا پیش از اعمال اصلاح.
- ثبت یک artifact **بعد** روی ref نامزد پس از اعمال اصلاح.
- استفاده از oracle قطعی هر زمان ممکن باشد، مانند خواندن reaction با Discord REST یا بررسی transcript کانال.
- ثبت screenshotها وقتی باگ سطح رابط کاربری قابل مشاهده دارد.
- اجرای محلی از یک CLI تحت کنترل agent و اجرای راه دور از GitHub.
- حفظ وضعیت کافی ماشین برای نجات با VNC وقتی ورود، خودکارسازی مرورگر یا احراز هویت provider گیر می‌کند.
- ارسال وضعیت مختصر به یک کانال Discord اپراتور وقتی اجرا مسدود شده، به کمک دستی VNC نیاز دارد یا تمام می‌شود.

## غیرهدف‌ها

- Mantis جایگزین unit testها نیست. اجرای Mantis معمولاً پس از فهمیدن اصلاح باید به یک regression test کوچک‌تر تبدیل شود.
- Mantis gate سریع و معمول CI نیست. کندتر است، از اعتبارنامه‌های زنده استفاده می‌کند و برای باگ‌هایی نگه داشته می‌شود که محیط زنده در آن‌ها مهم است.
- Mantis نباید برای عملکرد عادی به انسان نیاز داشته باشد. VNC دستی مسیر نجات است، نه مسیر مطلوب.
- Mantis secretهای خام را در artifacts، logها، screenshotها، گزارش‌های Markdown یا دیدگاه‌های PR ذخیره نمی‌کند.

## مالکیت

Mantis در پشته QA OpenClaw قرار دارد.

- OpenClaw مالک runtime سناریو، adapterهای transport، schema شواهد و CLI محلی زیر `pnpm openclaw qa mantis` است.
- QA Lab مالک قطعات harness مربوط به transport زنده، helperهای ثبت مرورگر و نویسنده‌های artifact است.
- Crabbox مالک ماشین‌های Linux گرم‌شده است وقتی به VM راه دور نیاز باشد.
- GitHub Actions مالک نقطه ورود workflow راه دور و نگه‌داری artifact است.
- ClawSweeper مالک مسیریابی دیدگاه‌های GitHub است: parse کردن فرمان‌های نگه‌دارنده، dispatch کردن workflow و ارسال دیدگاه نهایی PR.
- agentهای OpenClaw وقتی یک سناریو به راه‌اندازی agentic، debugging یا گزارش وضعیت گیرکرده نیاز دارد، Mantis را از طریق Codex هدایت می‌کنند.

این مرز، دانش transport را در OpenClaw، زمان‌بندی ماشین را در Crabbox و چسب workflow نگه‌دارنده را در ClawSweeper نگه می‌دارد.

## شکل فرمان

نخستین فرمان محلی، بات Discord، guild، کانال، ارسال پیام، ارسال reaction و مسیر artifact را راستی‌آزمایی می‌کند:

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

runner، worktreeهای detached مبنا و نامزد را زیر دایرکتوری خروجی می‌سازد، dependencyها را نصب می‌کند، هر ref را build می‌کند، سناریو را با `--allow-failures` اجرا می‌کند، سپس `baseline/`، `candidate/`، `comparison.json` و `mantis-report.md` را می‌نویسد. برای نخستین سناریوی Discord، راستی‌آزمایی موفق یعنی وضعیت مبنا `fail` و وضعیت نامزد `pass` است.

نخستین primitive مربوط به VM/مرورگر، smoke دسکتاپ است:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

این فرمان یک ماشین دسکتاپ Crabbox را lease یا بازاستفاده می‌کند، مرورگری قابل مشاهده را داخل نشست VNC شروع می‌کند، دسکتاپ را ثبت می‌کند، artifacts را به دایرکتوری خروجی محلی برمی‌گرداند و فرمان reconnect را در گزارش می‌نویسد. فرمان به‌صورت پیش‌فرض از provider Hetzner استفاده می‌کند چون نخستین provider با پوشش دسکتاپ/VNC فعال در مسیر Mantis است. هنگام اجرا روی fleet دیگری از Crabbox، آن را با `--provider`، `--crabbox-bin` یا `OPENCLAW_MANTIS_CRABBOX_PROVIDER` override کنید.

flagهای مفید smoke دسکتاپ:

- `--lease-id <cbx_...>` یا `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` یک دسکتاپ گرم‌شده را بازاستفاده می‌کند.
- `--browser-url <url>` صفحه‌ای را که در مرورگر قابل مشاهده باز می‌شود تغییر می‌دهد.
- `--html-file <path>` یک artifact HTML محلی repo را در مرورگر قابل مشاهده render می‌کند. Mantis از این برای ثبت timeline تولیدشده reactionهای وضعیت Discord از طریق یک دسکتاپ واقعی Crabbox استفاده می‌کند.
- `--keep-lease` یا `OPENCLAW_MANTIS_KEEP_VM=1` یک lease تازه‌ساخته و موفق را برای بررسی VNC باز نگه می‌دارد. اجراهای ناموفق به‌صورت پیش‌فرض وقتی lease ساخته شده باشد آن را نگه می‌دارند تا اپراتور بتواند دوباره وصل شود.
- `--class`، `--idle-timeout` و `--ttl` اندازه ماشین و عمر lease را تنظیم می‌کنند.

نخستین primitive کامل transport دسکتاپ، smoke دسکتاپ Slack است:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

این فرمان یک ماشین دسکتاپ Crabbox را lease یا بازاستفاده می‌کند، checkout فعلی را داخل VM همگام می‌کند، `pnpm openclaw qa slack` را داخل آن VM اجرا می‌کند، Slack Web را در مرورگر VNC باز می‌کند، دسکتاپ قابل مشاهده را ثبت می‌کند و هم artifacts مربوط به Slack QA و هم screenshot مربوط به VNC را به دایرکتوری خروجی محلی کپی می‌کند. این نخستین شکل Mantis است که در آن Gateway متعلق به SUT OpenClaw و مرورگر هر دو داخل همان VM دسکتاپ Linux زندگی می‌کنند.

با `--gateway-setup`، فرمان یک خانه OpenClaw یک‌بارمصرف و پایدار در `$HOME/.openclaw-mantis/slack-openclaw` آماده می‌کند، پیکربندی Slack Socket Mode را برای کانال انتخاب‌شده patch می‌کند، `openclaw gateway run` را روی port `38973` شروع می‌کند و Chrome را در نشست VNC در حال اجرا نگه می‌دارد. این حالت «برایم یک دسکتاپ Linux با Slack و یک claw در حال اجرا بگذار» است؛ مسیر Slack QA بات‌به‌بات وقتی `--gateway-setup` حذف شود همچنان پیش‌فرض است.

ورودی‌های لازم برای `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` برای مسیر مدل راه دور. اگر فقط
  `OPENAI_API_KEY` به‌صورت محلی تنظیم شده باشد، Mantis پیش از فراخوانی Crabbox آن را به `OPENCLAW_LIVE_OPENAI_KEY` map می‌کند تا forwarding envهای `OPENCLAW_*` در Crabbox بتواند آن را به VM منتقل کند.

flagهای مفید دسکتاپ Slack:

- `--lease-id <cbx_...>` اجرا را روی ماشینی تکرار می‌کند که اپراتور قبلاً از طریق VNC وارد Slack Web شده است.
- `--gateway-setup` به‌جای فقط اجرای مسیر QA بات‌به‌بات، یک Gateway پایدار OpenClaw Slack را در VM شروع می‌کند.
- `--slack-url <url>` یک URL مشخص Slack Web را باز می‌کند. بدون آن، Mantis وقتی token بات SUT موجود باشد، `https://app.slack.com/client/<team>/<channel>` را از Slack `auth.test` استخراج می‌کند.
- `--slack-channel-id <id>` allowlist کانال Slack را که setup مربوط به gateway استفاده می‌کند کنترل می‌کند.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` پروفایل پایدار Chrome داخل VM را کنترل می‌کند. پیش‌فرض `$HOME/.config/openclaw-mantis/slack-chrome-profile` است، پس ورود دستی Slack Web روی همان lease در اجراهای دوباره باقی می‌ماند.
- `--credential-source convex --credential-role ci` به‌جای tokenهای مستقیم env مربوط به Slack، از pool اعتبارنامه مشترک استفاده می‌کند.
- `--provider-mode`، `--model`، `--alt-model` و `--fast` به مسیر زنده Slack pass-through می‌شوند.

workflow smoke در GitHub برابر `Mantis Discord Smoke` است. workflow قبل و بعد در GitHub برای نخستین سناریوی واقعی برابر `Mantis Discord Status Reactions` است. این ورودی‌ها را می‌پذیرد:

- `baseline_ref`: refای که انتظار می‌رود رفتار فقط queued را بازتولید کند.
- `candidate_ref`: refای که انتظار می‌رود `queued -> thinking -> done` را نشان دهد.

این workflow، ref مربوط به harness workflow را checkout می‌کند، worktreeهای جداگانه مبنا و نامزد را build می‌کند، `discord-status-reactions-tool-only` را روی هر worktree اجرا می‌کند و `baseline/`، `candidate/`، `comparison.json` و `mantis-report.md` را به‌عنوان artifacts در Actions upload می‌کند. همچنین HTML مربوط به timeline هر مسیر را در یک مرورگر دسکتاپ Crabbox render می‌کند و آن screenshotهای VNC را کنار PNGهای deterministic timeline در دیدگاه PR منتشر می‌کند. workflow، CLI مربوط به Crabbox را از main در `openclaw/crabbox` build می‌کند تا بتواند پیش از انتشار binary بعدی Crabbox از flagهای فعلی lease دسکتاپ/مرورگر استفاده کند.

همچنین می‌توانید اجرای status-reactions را مستقیماً از یک دیدگاه PR trigger کنید:

```text
@Mantis discord status reactions
```

trigger دیدگاه عمداً محدود است. فقط روی دیدگاه‌های pull request از کاربرانی با دسترسی write، maintain یا admin اجرا می‌شود و فقط درخواست‌های status-reaction مربوط به Discord را تشخیص می‌دهد. به‌صورت پیش‌فرض از ref مبنای شناخته‌شده معیوب و SHA فعلی head در PR به‌عنوان نامزد استفاده می‌کند. نگه‌دارنده‌ها می‌توانند هر کدام از refها را override کنند:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

نمونه‌های فرمان ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

فرمان اول explicit و متمرکز بر سناریو است. فرمان دوم می‌تواند بعداً یک PR یا issue را از روی labelها، فایل‌های تغییریافته و یافته‌های review در ClawSweeper به سناریوهای پیشنهادی Mantis map کند.

## چرخه عمر اجرا

1. گرفتن اعتبارنامه‌ها.
2. تخصیص یا بازاستفاده از یک VM.
3. آماده‌سازی پروفایل دسکتاپ/مرورگر وقتی سناریو به شواهد UI نیاز دارد.
4. آماده‌سازی یک checkout تمیز برای ref مبنا.
5. نصب dependencyها و build کردن فقط آنچه سناریو نیاز دارد.
6. شروع یک Gateway فرزند OpenClaw با دایرکتوری وضعیت ایزوله.
7. پیکربندی transport زنده، provider، مدل و پروفایل مرورگر.
8. اجرای سناریو و ثبت شواهد مبنا.
9. توقف gateway و حفظ logها.
10. آماده‌سازی ref نامزد در همان VM.
11. اجرای همان سناریو و ثبت شواهد نامزد.
12. مقایسه نتایج oracle و شواهد بصری.
13. نوشتن Markdown، JSON، logها، screenshotها و artifacts اختیاری trace.
14. upload کردن artifacts در GitHub Actions.
15. ارسال یک پیام وضعیت مختصر در PR یا Discord.

سناریو باید بتواند به دو روش متفاوت fail شود:

- **باگ بازتولید شد**: مبنا به روش مورد انتظار fail شد.
- **شکست harness**: راه‌اندازی محیط، اعتبارنامه‌ها، Discord API، مرورگر یا provider پیش از معنادار شدن oracle باگ fail شد.

گزارش نهایی باید این موارد را جدا کند تا نگه‌دارنده‌ها محیط ناپایدار را با رفتار محصول اشتباه نگیرند.

## Discord MVP

نخستین سناریو باید reactionهای وضعیت Discord را در کانال‌های guild هدف بگیرد، جایی که حالت تحویل پاسخ منبع `message_tool_only` است.

چرا بذر خوبی برای Mantis است:

- در Discord به‌صورت reaction روی پیام triggerکننده قابل مشاهده است.
- از طریق وضعیت reaction پیام در Discord یک oracle قوی REST دارد.
- یک Gateway واقعی OpenClaw، احراز هویت بات Discord، dispatch پیام، حالت تحویل پاسخ منبع، وضعیت reaction وضعیت و چرخه عمر turn مدل را تمرین می‌دهد.
- به‌اندازه کافی محدود است تا نخستین پیاده‌سازی را درست و صادق نگه دارد.

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

شواهد مبنا باید reaction تأیید queued را نشان دهد اما در حالت فقط tool هیچ lifecycle transition نشان ندهد. شواهد نامزد باید نشان دهد که status reactionهای چرخه عمر وقتی `messages.statusReactions.enabled` صریحاً true است اجرا می‌شوند.

نخستین برش قابل اجرا، سناریوی opt-in زنده QA در Discord است:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

این کار SUT را با رسیدگی همیشه‌فعال به guild، `visibleReplies:
"message_tool"`، `ackReaction: "👀"` و واکنش‌های وضعیت صریح پیکربندی می‌کند. اوراکل
پیام محرک واقعی Discord را نظرسنجی می‌کند و انتظار دارد توالی مشاهده‌شده
`👀 -> 🤔 -> 👍` باشد. مصنوعات شامل `discord-qa-reaction-timelines.json`،
`discord-status-reactions-tool-only-timeline.html` و
`discord-status-reactions-tool-only-timeline.png` هستند.

## اجزای QA موجود

Mantis باید به‌جای شروع از صفر، بر پشته QA خصوصی موجود بنا شود:

- `pnpm openclaw qa discord` از قبل یک مسیر زنده Discord را با ربات‌های محرک و
  SUT اجرا می‌کند.
- اجراکننده انتقال زنده از قبل گزارش‌ها و مصنوعات پیام مشاهده‌شده را زیر
  `.artifacts/qa-e2e/` می‌نویسد.
- اجاره‌های اعتبارنامه Convex از قبل دسترسی انحصاری به اعتبارنامه‌های انتقال زنده مشترک را فراهم می‌کنند.
- سرویس کنترل مرورگر از قبل از نماگرفت‌ها، snapshotها،
  پروفایل‌های مدیریت‌شده headless و پروفایل‌های CDP راه‌دور پشتیبانی می‌کند.
- QA Lab از قبل یک رابط کاربری اشکال‌زدا و گذرگاه برای آزمون‌هایی با شکل انتقال دارد.

پیاده‌سازی اول Mantis می‌تواند یک اجراکننده نازک قبل/بعد روی همین اجزا،
به‌علاوه یک لایه شواهد بصری باشد.

## مدل شواهد

هر اجرا یک پوشه مصنوع پایدار می‌نویسد:

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

خلاصه باید شامل موارد زیر باشد:

- refها و SHAهای آزموده‌شده
- انتقال و شناسه سناریو
- ارائه‌دهنده ماشین و شناسه ماشین یا شناسه اجاره
- منبع اعتبارنامه بدون مقادیر محرمانه
- نتیجه baseline
- نتیجه candidate
- اینکه آیا باگ روی baseline بازتولید شد یا نه
- اینکه آیا candidate آن را رفع کرد یا نه
- مسیرهای مصنوع
- مشکلات راه‌اندازی یا پاک‌سازی پالایش‌شده

نماگرفت‌ها شواهد هستند، نه راز. بااین‌حال همچنان به انضباط ویرایش محرمانگی نیاز دارند:
نام کانال‌های خصوصی، نام کاربران یا محتوای پیام ممکن است ظاهر شود. برای PRهای عمومی،
تا زمانی که داستان ویرایش محرمانگی قوی‌تر نشده است، پیوندهای مصنوع GitHub Actions را
به تصویرهای درون‌خطی ترجیح دهید.

## مرورگر و VNC

مسیر مرورگر دو حالت دارد:

- **خودکارسازی headless**: پیش‌فرض برای CI. Chrome با CDP فعال اجرا می‌شود، و
  Playwright یا کنترل مرورگر OpenClaw نماگرفت‌ها را ثبت می‌کند.
- **نجات VNC**: روی همان VM فعال می‌شود وقتی ورود، MFA، ضدخودکارسازی Discord،
  یا اشکال‌زدایی بصری به انسان نیاز دارد.

پروفایل مرورگر ناظر Discord باید به‌اندازه‌ای پایدار باشد که برای هر اجرا نیاز به
ورود دوباره نباشد، اما از وضعیت مرورگر شخصی جدا باشد. یک پروفایل متعلق به مخزن ماشین
Mantis است، نه لپ‌تاپ توسعه‌دهنده.

وقتی Mantis گیر می‌کند، یک پیام وضعیت Discord با این موارد ارسال می‌کند:

- شناسه اجرا
- شناسه سناریو
- ارائه‌دهنده ماشین
- پوشه مصنوع
- دستورالعمل‌های اتصال VNC یا noVNC در صورت وجود
- متن کوتاه مسدودکننده

استقرار خصوصی اول می‌تواند این پیام‌ها را در کانال عملیاتی موجود ارسال کند و بعدا
به یک کانال اختصاصی Mantis منتقل شود.

## ماشین‌ها

Mantis باید برای اولین پیاده‌سازی راه‌دور، AWS از طریق Crabbox را ترجیح دهد.
Crabbox ماشین‌های آماده، رهگیری اجاره، آب‌رسانی، لاگ‌ها، نتایج و پاک‌سازی را در اختیارمان می‌گذارد.
اگر ظرفیت AWS بیش‌ازحد کند یا در دسترس نبود، یک ارائه‌دهنده Hetzner پشت همان
رابط ماشین اضافه کنید.

حداقل الزامات VM:

- Linux با نصب Chrome یا Chromium مناسب دسکتاپ
- دسترسی CDP برای خودکارسازی مرورگر
- VNC یا noVNC برای نجات
- Node 22 و pnpm
- checkout مربوط به OpenClaw و cache وابستگی‌ها
- cache مرورگر Playwright Chromium وقتی از Playwright استفاده می‌شود
- CPU و حافظه کافی برای یک OpenClaw Gateway، یک مرورگر، و یک اجرای مدل
- دسترسی خروجی به Discord، GitHub، ارائه‌دهندگان مدل، و کارگزار اعتبارنامه

VM نباید رازهای خام بلندمدت را بیرون از مخزن‌های مورد انتظار اعتبارنامه یا
پروفایل مرورگر نگه دارد.

## رازها

رازها برای اجراهای راه‌دور در رازهای سازمان یا مخزن GitHub، و برای اجراهای محلی در
یک فایل راز تحت کنترل اپراتور محلی قرار می‌گیرند.

نام‌های پیشنهادی رازها:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` برای بارگذاری مصنوعات عمومی GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

در بلندمدت، مخزن اعتبارنامه Convex باید منبع عادی اعتبارنامه‌های انتقال زنده باقی بماند.
رازهای GitHub کارگزار و مسیرهای fallback را راه‌اندازی اولیه می‌کنند.
گردش‌کار واکنش‌های وضعیت Discord رازهای Mantis Crabbox را دوباره به متغیرهای محیطی
`CRABBOX_COORDINATOR` و `CRABBOX_COORDINATOR_TOKEN` نگاشت می‌کند که CLI مربوط به Crabbox انتظار دارد.
نام‌های ساده راز GitHub با الگوی `CRABBOX_*` همچنان به‌عنوان fallback سازگاری پذیرفته می‌شوند.

اجراکننده Mantis هرگز نباید موارد زیر را چاپ کند:

- توکن‌های ربات Discord
- کلیدهای API ارائه‌دهنده
- cookieهای مرورگر
- محتوای پروفایل احراز هویت
- گذرواژه‌های VNC
- payloadهای خام اعتبارنامه

بارگذاری‌های مصنوع عمومی همچنین باید فراداده هدف Discord مانند شناسه‌های ربات،
guild، کانال و پیام را ویرایش محرمانه کنند. گردش‌کار smoke GitHub به همین دلیل
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` را فعال می‌کند.

اگر توکنی به‌طور تصادفی در یک issue، PR، chat یا log جای‌گذاری شد، پس از ذخیره شدن
راز جدید آن را بچرخانید.

## مصنوعات GitHub و نظرهای PR

گردش‌کارهای Mantis باید بسته کامل شواهد را به‌عنوان یک مصنوع کوتاه‌عمر Actions
بارگذاری کنند. وقتی گردش‌کار برای گزارش باگ یا PR رفع اجرا می‌شود، باید
نماگرفت‌های PNG ویرایش محرمانه‌شده را نیز در شاخه `qa-artifacts` منتشر کند و
روی آن باگ یا PR رفع، نظری با نماگرفت‌های قبل/بعد درون‌خطی upsert کند. اثبات اصلی را
فقط روی یک PR عمومی خودکارسازی QA منتشر نکنید. لاگ‌های خام، پیام‌های مشاهده‌شده،
و شواهد حجیم دیگر در مصنوع Actions باقی می‌مانند.

گردش‌کارهای production باید آن نظرها را با Mantis GitHub App منتشر کنند، نه با
`github-actions[bot]`. شناسه app و کلید خصوصی را به‌عنوان رازهای GitHub Actions
با نام‌های `MANTIS_GITHUB_APP_ID` و `MANTIS_GITHUB_APP_PRIVATE_KEY` ذخیره کنید.
گردش‌کار از یک نشانگر پنهان به‌عنوان کلید upsert استفاده می‌کند، وقتی توکن بتواند آن را
ویرایش کند همان نظر را به‌روزرسانی می‌کند، و وقتی نشانگر قدیمی متعلق به ربات قابل‌ویرایش
نباشد یک نظر جدید متعلق به Mantis ایجاد می‌کند.

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

وقتی اجرا به دلیل شکست harness ناموفق می‌شود، نظر باید همین را بگوید، نه اینکه القا کند
candidate شکست خورده است.

## یادداشت‌های استقرار خصوصی

یک استقرار خصوصی ممکن است از قبل یک برنامه Discord مربوط به Mantis داشته باشد. وقتی آن برنامه
مجوزهای ربات درست را دارد و می‌توان آن را با اطمینان چرخاند، به‌جای ساختن app دیگر از همان استفاده کنید.

کانال اعلان اپراتور اولیه را از طریق رازها یا پیکربندی استقرار تنظیم کنید.
این کانال ابتدا می‌تواند به یک کانال نگه‌دارنده یا عملیات موجود اشاره کند، سپس پس از ایجاد
کانال اختصاصی Mantis به آن منتقل شود.

شناسه‌های guild، شناسه‌های کانال، توکن‌های ربات، cookieهای مرورگر یا گذرواژه‌های VNC را
در این سند قرار ندهید. آن‌ها را در رازهای GitHub، کارگزار اعتبارنامه، یا مخزن راز محلی
اپراتور ذخیره کنید.

## افزودن یک سناریو

یک سناریوی Mantis باید موارد زیر را اعلام کند:

- شناسه و عنوان
- انتقال
- اعتبارنامه‌های لازم
- خط‌مشی ref مربوط به baseline
- خط‌مشی ref مربوط به candidate
- وصله پیکربندی OpenClaw
- گام‌های راه‌اندازی
- محرک
- اوراکل baseline مورد انتظار
- اوراکل candidate مورد انتظار
- هدف‌های ثبت بصری
- بودجه timeout
- گام‌های پاک‌سازی

سناریوها باید اوراکل‌های کوچک و typed را ترجیح دهند:

- وضعیت واکنش Discord برای باگ‌های واکنش
- ارجاع‌های پیام Discord برای باگ‌های thread
- thread ts و وضعیت API واکنش Slack برای باگ‌های Slack
- شناسه‌ها و headerهای پیام email برای باگ‌های email
- نماگرفت‌های مرورگر وقتی UI تنها مشاهده‌پذیر قابل‌اعتماد است

بررسی‌های بینایی باید افزایشی باشند. اگر یک API پلتفرم می‌تواند باگ را اثبات کند،
از API به‌عنوان اوراکل قبولی/ردی استفاده کنید و نماگرفت‌ها را برای اطمینان انسانی نگه دارید.

## گسترش ارائه‌دهنده

پس از Discord، همان اجراکننده می‌تواند موارد زیر را اضافه کند:

- Slack: واکنش‌ها، threadها، mentionهای app، modalها، بارگذاری فایل.
- Email: احراز هویت Gmail و thread کردن پیام با استفاده از `gog` در جاهایی که connectorها کافی نیستند.
- WhatsApp: ورود QR، شناسایی دوباره، تحویل پیام، رسانه، واکنش‌ها.
- Telegram: gating مربوط به mention گروه، فرمان‌ها، واکنش‌ها در صورت پشتیبانی.
- Matrix: اتاق‌های رمزگذاری‌شده، روابط thread یا reply، ازسرگیری پس از راه‌اندازی دوباره.

هر انتقال باید یک سناریوی smoke ارزان و یک یا چند سناریوی رده باگ داشته باشد.
سناریوهای بصری پرهزینه باید opt-in باقی بمانند.

## پرسش‌های باز

- وقتی ربات موجود Mantis دوباره استفاده می‌شود، کدام ربات Discord باید driver باشد و کدام باید SUT باشد؟
- ورود مرورگر ناظر باید در فاز اول از حساب انسانی Discord، حساب test،
  یا فقط شواهد REST قابل‌خواندن برای ربات استفاده کند؟
- GitHub باید مصنوعات Mantis برای PRها را چه مدت نگه دارد؟
- چه زمانی ClawSweeper باید به‌جای انتظار برای فرمان نگه‌دارنده، به‌طور خودکار Mantis را پیشنهاد کند؟
- آیا نماگرفت‌ها باید پیش از بارگذاری برای PRهای عمومی ویرایش محرمانه یا برش داده شوند؟
