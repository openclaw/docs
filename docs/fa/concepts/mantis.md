---
read_when:
    - ساخت یا اجرای تضمین کیفیت بصری زنده برای اشکال‌های OpenClaw
    - افزودن راستی‌آزمایی قبل و بعد برای یک درخواست کشش
    - افزودن سناریوهای انتقال زنده برای Discord، Slack، WhatsApp یا موارد دیگر
    - اشکال‌زدایی اجراهای QA که به اسکرین‌شات، خودکارسازی مرورگر یا دسترسی VNC نیاز دارند
summary: Mantis سامانهٔ راستی‌آزمایی دیداری سرتاسری برای بازتولید باگ‌های OpenClaw روی انتقال‌دهنده‌های زنده، ثبت شواهد قبل و بعد، و پیوست‌کردن مصنوعات به درخواست‌های کشش است.
title: آخوندک
x-i18n:
    generated_at: "2026-05-05T06:16:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26a9671135e38bf82d3627364f691f8d91cc8649ffc2e5fa782ebef474a44fa1
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis سامانهٔ راستی‌آزمایی انتهابه‌انتهای OpenClaw برای باگ‌هایی است که به runtime واقعی، transport واقعی، و شواهد قابل مشاهده نیاز دارند. این سامانه یک سناریو را روی یک ref شناخته‌شدهٔ بد اجرا می‌کند، شواهد را ثبت می‌کند، همان سناریو را روی یک ref نامزد اجرا می‌کند، و مقایسه را به‌صورت artifact منتشر می‌کند تا یک نگه‌دارنده بتواند آن را از یک PR یا از یک فرمان محلی بررسی کند.

Mantis با Discord شروع می‌شود، چون Discord یک مسیر اولیهٔ پرارزش به ما می‌دهد: احراز هویت واقعی bot، کانال‌های واقعی guild، reactionها، threadها، فرمان‌های native، و یک UI مرورگر که انسان‌ها می‌توانند در آن به‌صورت بصری تأیید کنند transport چه چیزی نشان داده است.

## اهداف

- بازتولید یک باگ از یک issue یا PR در GitHub با همان شکل transport که کاربران می‌بینند.
- ثبت یک artifact **قبل** روی baseline ref پیش از اعمال fix.
- ثبت یک artifact **بعد** روی candidate ref پس از اعمال fix.
- هر جا ممکن است از یک oracle قطعی استفاده شود، مانند خواندن reaction از Discord REST یا بررسی transcript کانال.
- وقتی باگ سطح UI قابل مشاهده دارد، screenshot ثبت شود.
- اجرای محلی از یک CLI تحت کنترل agent و اجرای راه‌دور از GitHub.
- حفظ وضعیت کافی از ماشین برای نجات از طریق VNC وقتی login، خودکارسازی مرورگر، یا احراز هویت provider گیر می‌کند.
- ارسال وضعیت کوتاه به یک کانال operator در Discord وقتی اجرا مسدود شده، به کمک دستی VNC نیاز دارد، یا پایان یافته است.

## غیر اهداف

- Mantis جایگزین unit testها نیست. یک اجرای Mantis معمولاً باید پس از فهم fix به یک regression test کوچک‌تر تبدیل شود.
- Mantis gate سریع و معمول CI نیست. کندتر است، از credentialهای live استفاده می‌کند، و برای باگ‌هایی نگه داشته می‌شود که محیط live در آن‌ها اهمیت دارد.
- Mantis نباید برای عملیات معمول به انسان نیاز داشته باشد. VNC دستی یک مسیر نجات است، نه مسیر عادی.
- Mantis secretهای خام را در artifactها، logها، screenshotها، گزارش‌های Markdown، یا commentهای PR ذخیره نمی‌کند.

## مالکیت

Mantis در stack تضمین کیفیت OpenClaw قرار دارد.

- OpenClaw مالک scenario runtime، adapterهای transport، schema شواهد، و CLI محلی زیر `pnpm openclaw qa mantis` است.
- QA Lab مالک بخش‌های live transport harness، helperهای capture مرورگر، و writerهای artifact است.
- Crabbox مالک ماشین‌های Linux گرم‌شده است وقتی به VM راه‌دور نیاز باشد.
- GitHub Actions مالک entrypoint workflow راه‌دور و نگه‌داری artifact است.
- ClawSweeper مالک مسیریابی commentهای GitHub است: parse کردن فرمان‌های نگه‌دارنده، dispatch کردن workflow، و ارسال comment نهایی PR.
- agentهای OpenClaw وقتی یک سناریو به setup عامل‌محور، debugging، یا گزارش stuck-state نیاز دارد، Mantis را از طریق Codex هدایت می‌کنند.

این مرز، دانش transport را در OpenClaw، زمان‌بندی ماشین را در Crabbox، و چسب workflow نگه‌دارنده را در ClawSweeper نگه می‌دارد.

## شکل فرمان

اولین فرمان محلی bot، guild، channel، ارسال message، ارسال reaction، و مسیر artifact در Discord را راستی‌آزمایی می‌کند:

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

runner، worktreeهای جداشدهٔ baseline و candidate را زیر output directory ایجاد می‌کند، dependencyها را نصب می‌کند، هر ref را build می‌کند، سناریو را با `--allow-failures` اجرا می‌کند، سپس `baseline/`، `candidate/`، `comparison.json`، و `mantis-report.md` را می‌نویسد. برای اولین سناریوی Discord، یک راستی‌آزمایی موفق یعنی وضعیت baseline برابر `fail` و وضعیت candidate برابر `pass` است.

اولین primitive مربوط به VM/browser، desktop smoke است:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

این فرمان یک ماشین desktop در Crabbox را lease یا reuse می‌کند، یک مرورگر قابل مشاهده را داخل session مربوط به VNC شروع می‌کند، desktop را capture می‌کند، artifactها را به output directory محلی برمی‌گرداند، و فرمان reconnect را در گزارش می‌نویسد. فرمان به‌صورت پیش‌فرض از provider Hetzner استفاده می‌کند، چون اولین provider با پوشش desktop/VNC کارا در مسیر Mantis است. هنگام اجرا روی fleet دیگری از Crabbox، آن را با `--provider`، `--crabbox-bin`، یا `OPENCLAW_MANTIS_CRABBOX_PROVIDER` override کنید.

flagهای مفید desktop smoke:

- `--lease-id <cbx_...>` یا `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` یک desktop گرم‌شده را reuse می‌کند.
- `--browser-url <url>` صفحه‌ای را که در مرورگر قابل مشاهده باز می‌شود تغییر می‌دهد.
- `--html-file <path>` یک artifact HTML محلی repo را در مرورگر قابل مشاهده render می‌کند. Mantis از این برای capture کردن timeline تولیدشدهٔ reactionهای وضعیت Discord از طریق یک desktop واقعی Crabbox استفاده می‌کند.
- `--keep-lease` یا `OPENCLAW_MANTIS_KEEP_VM=1` یک lease تازه‌ساخته‌شده و موفق را برای بررسی VNC باز نگه می‌دارد. اجراهای ناموفق وقتی lease ایجاد شده باشد به‌صورت پیش‌فرض lease را نگه می‌دارند تا operator بتواند دوباره متصل شود.
- `--class`، `--idle-timeout`، و `--ttl` اندازهٔ ماشین و طول عمر lease را تنظیم می‌کنند.

اولین primitive کامل transport desktop، Slack desktop smoke است:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

این فرمان یک ماشین desktop در Crabbox را lease یا reuse می‌کند، checkout فعلی را در VM sync می‌کند، `pnpm openclaw qa slack` را داخل آن VM اجرا می‌کند، Slack Web را در مرورگر VNC باز می‌کند، desktop قابل مشاهده را capture می‌کند، و هم artifactهای Slack QA و هم screenshot مربوط به VNC را به output directory محلی کپی می‌کند. این اولین شکل Mantis است که در آن Gateway سامانهٔ تحت آزمون OpenClaw و مرورگر هر دو داخل همان VM دسکتاپ Linux قرار دارند.

با `--gateway-setup`، فرمان یک home پایدار و disposable برای OpenClaw در `$HOME/.openclaw-mantis/slack-openclaw` آماده می‌کند، configuration مربوط به Slack Socket Mode را برای کانال انتخاب‌شده patch می‌کند، `openclaw gateway run` را روی پورت `38973` شروع می‌کند، و Chrome را در session مربوط به VNC در حال اجرا نگه می‌دارد. این حالت «یک desktop لینوکسی با Slack و یک claw در حال اجرا برایم باقی بگذار» است؛ مسیر bot-to-bot مربوط به Slack QA وقتی `--gateway-setup` حذف شود، همچنان پیش‌فرض باقی می‌ماند.

ورودی‌های لازم برای `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` برای مسیر مدل راه‌دور. اگر فقط
  `OPENAI_API_KEY` به‌صورت محلی تنظیم شده باشد، Mantis پیش از فراخوانی Crabbox آن را به `OPENCLAW_LIVE_OPENAI_KEY` map می‌کند تا forwarding متغیرهای env با پیشوند `OPENCLAW_*` در Crabbox بتواند آن را به VM منتقل کند.

flagهای مفید Slack desktop:

- `--lease-id <cbx_...>` اجرا را روی ماشینی تکرار می‌کند که یک operator قبلاً از طریق VNC وارد Slack Web شده است.
- `--gateway-setup` به‌جای فقط اجرای مسیر bot-to-bot مربوط به QA، یک Gateway پایدار OpenClaw Slack را در VM شروع می‌کند.
- `--slack-url <url>` یک URL مشخص از Slack Web را باز می‌کند. بدون آن، Mantis وقتی token مربوط به bot سامانهٔ تحت آزمون در دسترس باشد، `https://app.slack.com/client/<team>/<channel>` را از Slack `auth.test` استخراج می‌کند.
- `--slack-channel-id <id>` allowlist کانال Slack مورد استفاده در setup مربوط به Gateway را کنترل می‌کند.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` profile پایدار Chrome داخل VM را کنترل می‌کند. مقدار پیش‌فرض `$HOME/.config/openclaw-mantis/slack-chrome-profile` است، بنابراین login دستی Slack Web روی همان lease در rerunها باقی می‌ماند.
- `--credential-source convex --credential-role ci` به‌جای tokenهای مستقیم Slack در env، از credential pool مشترک استفاده می‌کند.
- `--provider-mode`، `--model`، `--alt-model`، و `--fast` به مسیر live مربوط به Slack پاس داده می‌شوند.

workflow مربوط به smoke در GitHub، `Mantis Discord Smoke` است. workflow قبل و بعد در GitHub برای اولین سناریوی واقعی، `Mantis Discord Status Reactions` است. این موارد را می‌پذیرد:

- `baseline_ref`: ref که انتظار می‌رود رفتار فقط queued را بازتولید کند.
- `candidate_ref`: ref که انتظار می‌رود `queued -> thinking -> done` را نشان دهد.

این workflow، workflow harness ref را checkout می‌کند، worktreeهای baseline و candidate جداگانه می‌سازد، `discord-status-reactions-tool-only` را روی هر worktree اجرا می‌کند، و `baseline/`، `candidate/`، `comparison.json`، و `mantis-report.md` را به‌عنوان artifactهای Actions upload می‌کند. همچنین HTML timeline هر مسیر را در مرورگر desktop مربوط به Crabbox render می‌کند و آن screenshotهای VNC را کنار PNGهای deterministic timeline در comment مربوط به PR منتشر می‌کند. همان comment در PR به ضبط‌های MP4 مربوط به desktop که طی render مرورگر VNC capture شده‌اند لینک می‌دهد، درحالی‌که screenshotها برای مرور سریع inline می‌مانند. workflow، CLI مربوط به Crabbox را از main در `openclaw/crabbox` build می‌کند تا بتواند پیش از cut شدن release باینری بعدی Crabbox از flagهای فعلی desktop/browser lease استفاده کند.

همچنین می‌توانید اجرای status-reactions را مستقیماً از comment یک PR trigger کنید:

```text
@Mantis discord status reactions
```

comment trigger عمداً محدود است. فقط روی commentهای pull request از کاربرانی با دسترسی write، maintain، یا admin اجرا می‌شود، و فقط requestهای status-reaction مربوط به Discord را تشخیص می‌دهد. به‌صورت پیش‌فرض از baseline ref شناخته‌شدهٔ بد و SHA مربوط به head فعلی PR به‌عنوان candidate استفاده می‌کند. نگه‌دارنده‌ها می‌توانند هر کدام از refها را override کنند:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

نمونه فرمان‌های ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

فرمان اول صریح و متمرکز بر سناریو است. فرمان دوم بعداً می‌تواند یک PR یا issue را بر اساس labelها، فایل‌های تغییرکرده، و یافته‌های review مربوط به ClawSweeper به سناریوهای پیشنهادی Mantis map کند.

## چرخهٔ اجرا

1. دریافت credentialها.
2. تخصیص یا reuse کردن یک VM.
3. آماده‌سازی profile مربوط به desktop/browser وقتی سناریو به شواهد UI نیاز دارد.
4. آماده‌سازی یک checkout تمیز برای baseline ref.
5. نصب dependencyها و build کردن فقط آنچه سناریو نیاز دارد.
6. شروع یک OpenClaw Gateway فرزند با state directory ایزوله.
7. پیکربندی live transport، provider، model، و browser profile.
8. اجرای سناریو و capture کردن شواهد baseline.
9. متوقف کردن Gateway و حفظ logها.
10. آماده‌سازی candidate ref در همان VM.
11. اجرای همان سناریو و capture کردن شواهد candidate.
12. مقایسهٔ نتایج oracle و شواهد بصری.
13. نوشتن Markdown، JSON، logها، screenshotها، و artifactهای trace اختیاری.
14. upload کردن artifactهای GitHub Actions.
15. ارسال یک پیام وضعیت کوتاه در PR یا Discord.

سناریو باید بتواند به دو شکل متفاوت fail شود:

- **بازتولید باگ**: baseline به روش مورد انتظار fail شد.
- **شکست harness**: setup محیط، credentialها، Discord API، مرورگر، یا provider پیش از معنادار شدن oracle باگ fail شد.

گزارش نهایی باید این موارد را جدا کند تا نگه‌دارنده‌ها یک محیط flaky را با رفتار محصول اشتباه نگیرند.

## MVP مربوط به Discord

اولین سناریو باید reactionهای وضعیت Discord را در کانال‌های guild هدف بگیرد، جایی که حالت تحویل source reply برابر `message_tool_only` است.

چرا seed خوبی برای Mantis است:

- در Discord به‌صورت reaction روی پیام triggerکننده قابل مشاهده است.
- از طریق وضعیت reaction پیام در Discord یک oracle قوی REST دارد.
- یک OpenClaw Gateway واقعی، احراز هویت bot در Discord، dispatch پیام، حالت تحویل source reply، وضعیت reactionهای status، و lifecycle نوبت model را exercise می‌کند.
- آن‌قدر محدود است که اولین پیاده‌سازی را دقیق نگه دارد.

شکل سناریوی مورد انتظار:

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

شواهد baseline باید reaction تأیید queued را نشان دهد، اما در حالت tool-only هیچ transition مربوط به lifecycle نداشته باشد. شواهد candidate باید نشان دهد وقتی `messages.statusReactions.enabled` به‌صورت صریح برابر true است، reactionهای status مربوط به lifecycle اجرا می‌شوند.

اولین بخش executable، سناریوی live QA مربوط به Discord به‌صورت opt-in است:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

این دستور SUT را با مدیریت همیشه‌فعال guild، `visibleReplies:
"message_tool"`، `ackReaction: "👀"`، و واکنش‌های وضعیت صریح پیکربندی می‌کند. oracle
پیام محرک واقعی Discord را نظرسنجی می‌کند و انتظار دارد توالی مشاهده‌شده
`👀 -> 🤔 -> 👍` باشد. artifactها شامل `discord-qa-reaction-timelines.json`،
`discord-status-reactions-tool-only-timeline.html`، و
`discord-status-reactions-tool-only-timeline.png` هستند.

## قطعات QA موجود

Mantis باید به‌جای شروع از صفر، بر پایه stack خصوصی QA موجود ساخته شود:

- `pnpm openclaw qa discord` از قبل یک lane زنده Discord را با botهای driver و
  SUT اجرا می‌کند.
- runner انتقال زنده از قبل گزارش‌ها و artifactهای پیام مشاهده‌شده را زیر
  `.artifacts/qa-e2e/` می‌نویسد.
- اجاره‌های credential در Convex از قبل دسترسی انحصاری به credentialهای انتقال
  زنده مشترک را فراهم می‌کنند.
- سرویس کنترل مرورگر از قبل از screenshotها، snapshotها، profileهای مدیریت‌شده
  headless، و profileهای CDP راه‌دور پشتیبانی می‌کند.
- QA Lab از قبل یک UI اشکال‌زدایی و bus برای آزمون‌های شبیه انتقال دارد.

پیاده‌سازی نخست Mantis می‌تواند یک runner نازک قبل/بعد روی این قطعات، به‌علاوه
یک لایه evidence بصری باشد.

## مدل Evidence

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
Markdown برای کامنت‌های PR و بازبینی انسانی است.

summary باید شامل موارد زیر باشد:

- refها و SHAهای آزموده‌شده
- transport و scenario id
- provider ماشین و machine id یا lease id
- منبع credential بدون مقدارهای secret
- نتیجه baseline
- نتیجه candidate
- اینکه bug روی baseline بازتولید شد یا نه
- اینکه candidate آن را رفع کرد یا نه
- مسیرهای artifact
- مشکلات setup یا cleanup پاک‌سازی‌شده

Screenshotها evidence هستند، نه secret. بااین‌حال هنوز به انضباط redaction نیاز دارند:
نام‌های private channel، نام‌های کاربری، یا محتوای پیام ممکن است ظاهر شوند. برای PRهای عمومی،
تا زمانی که داستان redaction قوی‌تر شود، لینک‌های artifact در GitHub Actions را به تصویرهای inline
ترجیح دهید.

## Browser و VNC

lane مرورگر دو حالت دارد:

- **اتوماسیون headless**: پیش‌فرض برای CI. Chrome با CDP فعال اجرا می‌شود، و
  Playwright یا کنترل مرورگر OpenClaw screenshot می‌گیرد.
- **نجات VNC**: وقتی login، MFA، ضداتوماسیون Discord، یا اشکال‌زدایی بصری به انسان نیاز دارد،
  روی همان VM فعال می‌شود.

profile مرورگر observer در Discord باید آن‌قدر پایدار باشد که برای هر اجرا نیاز به
login نباشد، اما از وضعیت مرورگر شخصی جدا باشد. یک profile متعلق به pool ماشین Mantis است،
نه laptop توسعه‌دهنده.

وقتی Mantis گیر می‌کند، یک پیام وضعیت Discord با موارد زیر ارسال می‌کند:

- run id
- scenario id
- provider ماشین
- دایرکتوری artifact
- دستورالعمل‌های اتصال VNC یا noVNC در صورت موجود بودن
- متن کوتاه blocker

استقرار خصوصی نخست می‌تواند این پیام‌ها را به channel عملیاتی موجود ارسال کند و بعدا
به یک channel اختصاصی Mantis منتقل شود.

## ماشین‌ها

Mantis برای نخستین پیاده‌سازی راه‌دور باید AWS از طریق Crabbox را ترجیح دهد.
Crabbox ماشین‌های گرم‌شده، رهگیری lease، hydration، logها، resultها، و cleanup را در اختیارمان
می‌گذارد. اگر ظرفیت AWS خیلی کند یا ناموجود باشد، یک provider Hetzner پشت همان interface ماشین
اضافه کنید.

حداقل نیازمندی‌های VM:

- Linux با نصب Chrome یا Chromium دارای قابلیت desktop
- دسترسی CDP برای اتوماسیون مرورگر
- VNC یا noVNC برای نجات
- Node 22 و pnpm
- checkout و cache وابستگی‌های OpenClaw
- cache مرورگر Playwright Chromium وقتی از Playwright استفاده می‌شود
- CPU و memory کافی برای یک OpenClaw Gateway، یک مرورگر، و یک model run
- دسترسی خروجی به Discord، GitHub، providerهای مدل، و credential broker

VM نباید secretهای خام بلندمدت را بیرون از storeهای مورد انتظار credential یا
profile مرورگر نگه دارد.

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
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` برای uploadهای عمومی artifact در GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

در بلندمدت، pool credential در Convex باید منبع معمول credentialهای انتقال زنده بماند.
secretهای GitHub، broker و laneهای fallback را bootstrap می‌کنند.
workflow واکنش‌های وضعیت Discord، secretهای Mantis Crabbox را دوباره به متغیرهای محیطی
`CRABBOX_COORDINATOR` و `CRABBOX_COORDINATOR_TOKEN` نگاشت می‌کند که CLI مربوط به Crabbox انتظار دارد.
نام‌های ساده secret در GitHub با قالب `CRABBOX_*` همچنان به‌عنوان fallback سازگاری پذیرفته می‌شوند.

runner مربوط به Mantis هرگز نباید موارد زیر را چاپ کند:

- tokenهای bot در Discord
- API keyهای provider
- cookieهای مرورگر
- محتوای auth profile
- passwordهای VNC
- payloadهای خام credential

uploadهای عمومی artifact همچنین باید metadata مقصد Discord مانند bot،
guild، channel، و message idها را redact کنند. workflow smoke در GitHub به همین دلیل
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` را فعال می‌کند.

اگر یک token تصادفا در issue، PR، chat، یا log چسبانده شد، پس از ذخیره secret جدید،
آن را rotate کنید.

## Artifactهای GitHub و کامنت‌های PR

workflowهای Mantis باید bundle کامل evidence را به‌عنوان یک artifact کوتاه‌عمر Actions
upload کنند. وقتی workflow برای یک bug report یا fix PR اجرا می‌شود، باید همچنین
screenshotهای PNG پاک‌سازی‌شده را در branch `qa-artifacts` منتشر کند و روی آن bug یا fix PR
یک کامنت upsert کند که screenshotهای inline قبل/بعد دارد. proof اصلی را فقط روی یک PR عمومی
اتوماسیون QA منتشر نکنید. logهای خام، پیام‌های مشاهده‌شده، و evidenceهای حجیم دیگر در artifact
Actions باقی می‌مانند.

workflowهای production باید آن کامنت‌ها را با GitHub App متعلق به Mantis ارسال کنند، نه
با `github-actions[bot]`. app id و private key را به‌عنوان secretهای GitHub Actions با نام‌های
`MANTIS_GITHUB_APP_ID` و `MANTIS_GITHUB_APP_PRIVATE_KEY` ذخیره کنید.
workflow از یک marker مخفی به‌عنوان کلید upsert استفاده می‌کند، وقتی token بتواند آن را ویرایش کند
آن کامنت را به‌روزرسانی می‌کند، و وقتی marker قدیمی متعلق به bot قابل ویرایش نباشد
یک کامنت جدید متعلق به Mantis ایجاد می‌کند.

کامنت PR باید کوتاه و بصری باشد:

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

وقتی اجرا به‌دلیل شکست harness شکست می‌خورد، کامنت باید همین را بگوید
به‌جای اینکه القا کند candidate شکست خورده است.

## یادداشت‌های استقرار خصوصی

ممکن است یک استقرار خصوصی از قبل یک application مربوط به Mantis در Discord داشته باشد. وقتی آن application
permissionهای درست bot را دارد و می‌توان آن را به‌شکل امن rotate کرد، به‌جای ساختن app دیگر
از همان دوباره استفاده کنید.

channel اعلان اولیه operator را از طریق secretها یا پیکربندی استقرار تنظیم کنید.
ابتدا می‌تواند به یک channel نگه‌دارنده یا عملیاتی موجود اشاره کند، سپس وقتی channel اختصاصی
Mantis وجود داشت به آن منتقل شود.

guild idها، channel idها، bot tokenها، cookieهای مرورگر، یا passwordهای VNC را
در این سند نگذارید. آن‌ها را در secretهای GitHub، credential broker، یا
store محلی secret متعلق به operator ذخیره کنید.

## افزودن یک Scenario

یک scenario در Mantis باید موارد زیر را declare کند:

- id و title
- transport
- credentialهای لازم
- policy مربوط به baseline ref
- policy مربوط به candidate ref
- patch پیکربندی OpenClaw
- گام‌های setup
- محرک
- oracle مورد انتظار baseline
- oracle مورد انتظار candidate
- هدف‌های capture بصری
- بودجه timeout
- گام‌های cleanup

Scenarioها باید oracleهای کوچک و typed را ترجیح دهند:

- وضعیت reaction در Discord برای bugهای reaction
- referenceهای پیام Discord برای bugهای threading
- thread ts در Slack و وضعیت API مربوط به reaction برای bugهای Slack
- message idها و headerهای email برای bugهای email
- screenshotهای مرورگر وقتی UI تنها observable قابل‌اعتماد است

بررسی‌های vision باید افزایشی باشند. اگر یک API پلتفرم می‌تواند bug را اثبات کند، از
API به‌عنوان oracle قبولی/شکست استفاده کنید و screenshotها را برای اطمینان انسانی نگه دارید.

## گسترش Provider

بعد از Discord، همان runner می‌تواند موارد زیر را اضافه کند:

- Slack: reactionها، threadها، app mentionها، modalها، file uploadها.
- Email: auth در Gmail و message threading با استفاده از `gog` وقتی connectorها کافی نیستند.
- WhatsApp: login با QR، شناسایی دوباره، تحویل پیام، media، reactionها.
- Telegram: gating مربوط به group mention، commandها، reactionها در صورت موجود بودن.
- Matrix: roomهای encrypted، relationهای thread یا reply، resume پس از restart.

هر transport باید یک smoke scenario ارزان و یک یا چند scenario مربوط به کلاس bug داشته باشد.
scenarioهای بصری پرهزینه باید opt-in بمانند.

## پرسش‌های باز

- وقتی bot موجود Mantis دوباره استفاده می‌شود، کدام bot در Discord باید driver باشد و کدام باید SUT باشد؟
- آیا login مرورگر observer در مرحله نخست باید از یک حساب انسانی Discord، یک حساب test،
  یا فقط evidence قابل‌خواندن برای bot از طریق REST استفاده کند؟
- GitHub چه مدت باید artifactهای Mantis را برای PRها نگه دارد؟
- ClawSweeper چه زمانی باید به‌جای انتظار برای command نگه‌دارنده، به‌طور خودکار Mantis را پیشنهاد کند؟
- آیا screenshotها باید پیش از upload برای PRهای عمومی redact یا crop شوند؟
