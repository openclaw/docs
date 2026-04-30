---
read_when:
    - راه‌اندازی پشتیبانی Signal
    - اشکال‌زدایی ارسال/دریافت Signal
summary: پشتیبانی از Signal از طریق signal-cli (JSON-RPC + SSE)، مسیرهای راه‌اندازی، و مدل شماره
title: Signal
x-i18n:
    generated_at: "2026-04-30T16:27:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 111b6ebe3bde4e03c7ed432f52d663f0b471f0fc4a4bf835c1ac1972467e0b96
    source_path: channels/signal.md
    workflow: 16
---

وضعیت: یکپارچه‌سازی CLI خارجی. Gateway از طریق HTTP JSON-RPC + SSE با `signal-cli` ارتباط برقرار می‌کند.

## پیش‌نیازها

- OpenClaw روی سرور شما نصب شده باشد (روند Linux زیر روی Ubuntu 24 آزمایش شده است).
- `signal-cli` روی میزبانی که gateway روی آن اجرا می‌شود در دسترس باشد.
- یک شماره تلفن که بتواند یک پیامک تأیید دریافت کند (برای مسیر ثبت‌نام با SMS).
- دسترسی مرورگر برای کپچای Signal (`signalcaptchas.org`) هنگام ثبت‌نام.

## راه‌اندازی سریع (مبتدی)

1. برای ربات از یک **شماره Signal جداگانه** استفاده کنید (توصیه می‌شود).
2. `signal-cli` را نصب کنید (اگر از نسخه JVM استفاده می‌کنید، Java لازم است).
3. یک مسیر راه‌اندازی انتخاب کنید:
   - **مسیر A (پیوند QR):** `signal-cli link -n "OpenClaw"` و با Signal اسکن کنید.
   - **مسیر B (ثبت‌نام SMS):** یک شماره اختصاصی را با کپچا + تأیید SMS ثبت کنید.
4. OpenClaw را پیکربندی کنید و gateway را بازراه‌اندازی کنید.
5. اولین DM را بفرستید و جفت‌سازی را تأیید کنید (`openclaw pairing approve signal <CODE>`).

پیکربندی حداقلی:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

مرجع فیلدها:

| فیلد       | توضیح                                       |
| ----------- | ------------------------------------------------- |
| `account`   | شماره تلفن ربات با قالب E.164 (`+15551234567`) |
| `cliPath`   | مسیر `signal-cli` (`signal-cli` اگر در `PATH` باشد)  |
| `dmPolicy`  | سیاست دسترسی DM (`pairing` توصیه می‌شود)          |
| `allowFrom` | شماره‌های تلفن یا مقدارهای `uuid:<id>` که مجاز به ارسال DM هستند |

## چیستی آن

- کانال Signal از طریق `signal-cli` (نه libsignal تعبیه‌شده).
- مسیریابی قطعی: پاسخ‌ها همیشه به Signal برمی‌گردند.
- DMها نشست اصلی عامل را به اشتراک می‌گذارند؛ گروه‌ها ایزوله هستند (`agent:<agentId>:signal:group:<groupId>`).

## نوشتن پیکربندی

به‌طور پیش‌فرض، Signal مجاز است به‌روزرسانی‌های پیکربندی را که با `/config set|unset` آغاز می‌شوند بنویسد (به `commands.config: true` نیاز دارد).

غیرفعال‌سازی با:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## مدل شماره (مهم)

- Gateway به یک **دستگاه Signal** وصل می‌شود (حساب `signal-cli`).
- اگر ربات را روی **حساب شخصی Signal خودتان** اجرا کنید، پیام‌های خودتان را نادیده می‌گیرد (محافظت در برابر حلقه).
- برای «من به ربات پیام می‌دهم و پاسخ می‌دهد»، از یک **شماره ربات جداگانه** استفاده کنید.

## مسیر راه‌اندازی A: پیوند حساب Signal موجود (QR)

1. `signal-cli` را نصب کنید (نسخه JVM یا native).
2. یک حساب ربات را پیوند دهید:
   - `signal-cli link -n "OpenClaw"` سپس QR را در Signal اسکن کنید.
3. Signal را پیکربندی کنید و gateway را شروع کنید.

مثال:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

پشتیبانی از چند حساب: از `channels.signal.accounts` همراه با پیکربندی برای هر حساب و `name` اختیاری استفاده کنید. برای الگوی مشترک، [`gateway/configuration`](/fa/gateway/config-channels#multi-account-all-channels) را ببینید.

## مسیر راه‌اندازی B: ثبت شماره ربات اختصاصی (SMS، Linux)

وقتی به‌جای پیوند دادن یک حساب برنامه Signal موجود، یک شماره ربات اختصاصی می‌خواهید، از این روش استفاده کنید.

1. شماره‌ای بگیرید که بتواند SMS دریافت کند (یا تأیید صوتی برای خطوط ثابت).
   - برای جلوگیری از تداخل حساب/نشست، از یک شماره ربات اختصاصی استفاده کنید.
2. `signal-cli` را روی میزبان gateway نصب کنید:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

اگر از نسخه JVM (`signal-cli-${VERSION}.tar.gz`) استفاده می‌کنید، ابتدا JRE 25+ را نصب کنید.
`signal-cli` را به‌روز نگه دارید؛ upstream یادآوری می‌کند که نسخه‌های قدیمی ممکن است با تغییر APIهای سرور Signal از کار بیفتند.

3. شماره را ثبت و تأیید کنید:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

اگر کپچا لازم است:

1. `https://signalcaptchas.org/registration/generate.html` را باز کنید.
2. کپچا را کامل کنید، هدف پیوند `signalcaptcha://...` را از "Open Signal" کپی کنید.
3. در صورت امکان، از همان IP خارجی نشست مرورگر اجرا کنید.
4. ثبت‌نام را بلافاصله دوباره اجرا کنید (توکن‌های کپچا سریع منقضی می‌شوند):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw را پیکربندی کنید، gateway را بازراه‌اندازی کنید، کانال را تأیید کنید:

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. فرستنده DM خود را جفت کنید:
   - هر پیامی را به شماره ربات بفرستید.
   - کد را روی سرور تأیید کنید: `openclaw pairing approve signal <PAIRING_CODE>`.
   - شماره ربات را روی تلفن خود به‌عنوان مخاطب ذخیره کنید تا از "Unknown contact" جلوگیری شود.

<Warning>
ثبت یک حساب شماره تلفن با `signal-cli` می‌تواند نشست اصلی برنامه Signal را برای آن شماره از احراز خارج کند. یک شماره ربات اختصاصی را ترجیح دهید، یا اگر لازم است تنظیمات برنامه تلفن موجود خود را نگه دارید از حالت پیوند QR استفاده کنید.
</Warning>

مراجع upstream:

- README مربوط به `signal-cli`: `https://github.com/AsamK/signal-cli`
- روند کپچا: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- روند پیوند: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## حالت daemon خارجی (httpUrl)

اگر می‌خواهید خودتان `signal-cli` را مدیریت کنید (شروع سرد کند JVM، مقداردهی اولیه کانتینر، یا CPUهای مشترک)، daemon را جداگانه اجرا کنید و OpenClaw را به آن اشاره دهید:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

این کار auto-spawn و انتظار شروع داخل OpenClaw را رد می‌کند. برای شروع‌های کند هنگام auto-spawning، `channels.signal.startupTimeoutMs` را تنظیم کنید.

## کنترل دسترسی (DMها + گروه‌ها)

DMها:

- پیش‌فرض: `channels.signal.dmPolicy = "pairing"`.
- فرستنده‌های ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ پیام‌ها تا زمان تأیید نادیده گرفته می‌شوند (کدها پس از 1 ساعت منقضی می‌شوند).
- تأیید از طریق:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- جفت‌سازی تبادل توکن پیش‌فرض برای DMهای Signal است. جزئیات: [جفت‌سازی](/fa/channels/pairing)
- فرستنده‌های فقط UUID (از `sourceUuid`) به‌صورت `uuid:<id>` در `channels.signal.allowFrom` ذخیره می‌شوند.

گروه‌ها:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` کنترل می‌کند وقتی `allowlist` تنظیم شده است، کدام گروه‌ها یا فرستنده‌ها می‌توانند پاسخ‌های گروهی را فعال کنند؛ ورودی‌ها می‌توانند شناسه‌های گروه Signal (خام، `group:<id>`، یا `signal:group:<id>`)، شماره‌های تلفن فرستنده، مقدارهای `uuid:<id>`، یا `*` باشند.
- `channels.signal.groups["<group-id>" | "*"]` می‌تواند رفتار گروه را با `requireMention`، `tools`، و `toolsBySender` بازنویسی کند.
- برای بازنویسی‌های هر حساب در تنظیمات چندحسابی، از `channels.signal.accounts.<id>.groups` استفاده کنید.
- قراردادن یک گروه Signal در allowlist از طریق `groupAllowFrom` به‌تنهایی گیت mention را غیرفعال نمی‌کند. یک ورودی مشخصاً پیکربندی‌شده `channels.signal.groups["<group-id>"]` همه پیام‌های گروه را پردازش می‌کند مگر اینکه `requireMention=true` تنظیم شده باشد.
- نکته زمان اجرا: اگر `channels.signal` کاملاً وجود نداشته باشد، runtime برای بررسی‌های گروهی به `groupPolicy="allowlist"` برمی‌گردد (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

## نحوه کارکرد (رفتار)

- `signal-cli` به‌عنوان daemon اجرا می‌شود؛ gateway رویدادها را از طریق SSE می‌خواند.
- پیام‌های ورودی به پاکت مشترک کانال نرمال‌سازی می‌شوند.
- پاسخ‌ها همیشه به همان شماره یا گروه برمی‌گردند.

## رسانه + محدودیت‌ها

- متن خروجی به `channels.signal.textChunkLimit` تکه‌تکه می‌شود (پیش‌فرض 4000).
- تکه‌بندی اختیاری بر اساس خط جدید: `channels.signal.chunkMode="newline"` را تنظیم کنید تا قبل از تکه‌بندی بر اساس طول، روی خطوط خالی (مرزهای پاراگراف) تقسیم شود.
- پیوست‌ها پشتیبانی می‌شوند (base64 از `signal-cli` دریافت می‌شود).
- پیوست‌های voice-note وقتی `contentType` وجود ندارد، از نام فایل `signal-cli` به‌عنوان fallback برای MIME استفاده می‌کنند، بنابراین رونویسی صدا همچنان می‌تواند یادداشت‌های صوتی AAC را دسته‌بندی کند.
- سقف پیش‌فرض رسانه: `channels.signal.mediaMaxMb` (پیش‌فرض 8).
- برای رد کردن دانلود رسانه، از `channels.signal.ignoreAttachments` استفاده کنید.
- زمینه تاریخچه گروه از `channels.signal.historyLimit` (یا `channels.signal.accounts.*.historyLimit`) استفاده می‌کند و به `messages.groupChat.historyLimit` برمی‌گردد. برای غیرفعال‌سازی، `0` را تنظیم کنید (پیش‌فرض 50).

## تایپ کردن + رسیدهای خواندن

- **نشانگرهای تایپ**: OpenClaw سیگنال‌های تایپ را از طریق `signal-cli sendTyping` می‌فرستد و هنگام اجرای پاسخ آن‌ها را تازه‌سازی می‌کند.
- **رسیدهای خواندن**: وقتی `channels.signal.sendReadReceipts` برابر true باشد، OpenClaw رسیدهای خواندن را برای DMهای مجاز ارسال می‌کند.
- Signal-cli رسیدهای خواندن را برای گروه‌ها ارائه نمی‌کند.

## واکنش‌ها (ابزار پیام)

- از `message action=react` با `channel=signal` استفاده کنید.
- هدف‌ها: E.164 فرستنده یا UUID (از `uuid:<id>` خروجی جفت‌سازی استفاده کنید؛ UUID خام هم کار می‌کند).
- `messageId` همان timestamp پیام Signal است که به آن واکنش می‌دهید.
- واکنش‌های گروهی به `targetAuthor` یا `targetAuthorUuid` نیاز دارند.

مثال‌ها:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

پیکربندی:

- `channels.signal.actions.reactions`: فعال/غیرفعال کردن کنش‌های واکنش (پیش‌فرض true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` واکنش‌های عامل را غیرفعال می‌کند (ابزار پیام `react` خطا می‌دهد).
  - `minimal`/`extensive` واکنش‌های عامل را فعال می‌کند و سطح راهنمایی را تنظیم می‌کند.
- بازنویسی‌های هر حساب: `channels.signal.accounts.<id>.actions.reactions`، `channels.signal.accounts.<id>.reactionLevel`.

## هدف‌های تحویل (CLI/cron)

- DMها: `signal:+15551234567` (یا E.164 ساده).
- DMهای UUID: `uuid:<id>` (یا UUID خام).
- گروه‌ها: `signal:group:<groupId>`.
- نام‌های کاربری: `username:<name>` (اگر حساب Signal شما پشتیبانی کند).

## عیب‌یابی

ابتدا این نردبان را اجرا کنید:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

سپس در صورت نیاز وضعیت جفت‌سازی DM را تأیید کنید:

```bash
openclaw pairing list signal
```

خرابی‌های رایج:

- Daemon در دسترس است اما پاسخی وجود ندارد: تنظیمات حساب/daemon (`httpUrl`، `account`) و حالت دریافت را بررسی کنید.
- DMها نادیده گرفته می‌شوند: فرستنده در انتظار تأیید جفت‌سازی است.
- پیام‌های گروه نادیده گرفته می‌شوند: گیت فرستنده/mention گروه مانع تحویل می‌شود.
- خطاهای اعتبارسنجی پیکربندی پس از ویرایش‌ها: `openclaw doctor --fix` را اجرا کنید.
- Signal در diagnostics وجود ندارد: تأیید کنید `channels.signal.enabled: true`.

بررسی‌های اضافی:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

برای روند triage: [/channels/troubleshooting](/fa/channels/troubleshooting).

## نکات امنیتی

- `signal-cli` کلیدهای حساب را به‌صورت محلی ذخیره می‌کند (معمولاً `~/.local/share/signal-cli/data/`).
- پیش از مهاجرت یا بازسازی سرور، از وضعیت حساب Signal نسخه پشتیبان بگیرید.
- `channels.signal.dmPolicy: "pairing"` را حفظ کنید مگر اینکه صریحاً دسترسی گسترده‌تر DM را بخواهید.
- تأیید SMS فقط برای روندهای ثبت‌نام یا بازیابی لازم است، اما از دست دادن کنترل شماره/حساب می‌تواند ثبت‌نام دوباره را پیچیده کند.

## مرجع پیکربندی (Signal)

پیکربندی کامل: [پیکربندی](/fa/gateway/configuration)

گزینه‌های provider:

- `channels.signal.enabled`: راه‌اندازی کانال را فعال/غیرفعال می‌کند.
- `channels.signal.account`: E.164 برای حساب ربات.
- `channels.signal.cliPath`: مسیر `signal-cli`.
- `channels.signal.httpUrl`: URL کامل دیمون (host/port را بازنویسی می‌کند).
- `channels.signal.httpHost`, `channels.signal.httpPort`: bind دیمون (پیش‌فرض 127.0.0.1:8080).
- `channels.signal.autoStart`: دیمون را به‌صورت خودکار اجرا می‌کند (اگر `httpUrl` تنظیم نشده باشد، پیش‌فرض true است).
- `channels.signal.startupTimeoutMs`: مهلت انتظار راه‌اندازی بر حسب ms (حداکثر 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: بارگیری پیوست‌ها را رد می‌کند.
- `channels.signal.ignoreStories`: استوری‌های دیمون را نادیده می‌گیرد.
- `channels.signal.sendReadReceipts`: رسیدهای خوانده‌شدن را بازفرست می‌کند.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (پیش‌فرض: pairing).
- `channels.signal.allowFrom`: فهرست مجاز DM (E.164 یا `uuid:<id>`). `open` به `"*"` نیاز دارد. Signal نام کاربری ندارد؛ از شناسه‌های تلفن/UUID استفاده کنید.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (پیش‌فرض: allowlist).
- `channels.signal.groupAllowFrom`: فهرست مجاز گروه؛ شناسه‌های گروه Signal (خام، `group:<id>`، یا `signal:group:<id>`)، شماره‌های E.164 فرستنده، یا مقدارهای `uuid:<id>` را می‌پذیرد.
- `channels.signal.groups`: بازنویسی‌های هر گروه که با شناسه گروه Signal (یا `"*"`) کلیدگذاری شده‌اند. فیلدهای پشتیبانی‌شده: `requireMention`، `tools`، `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: نسخه هر حساب از `channels.signal.groups` برای راه‌اندازی‌های چندحسابی.
- `channels.signal.historyLimit`: حداکثر پیام‌های گروه که به‌عنوان زمینه گنجانده می‌شوند (0 غیرفعال می‌کند).
- `channels.signal.dmHistoryLimit`: محدودیت تاریخچه DM بر حسب نوبت‌های کاربر. بازنویسی‌های هر کاربر: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: اندازه قطعه خروجی (نویسه).
- `channels.signal.chunkMode`: `length` (پیش‌فرض) یا `newline` برای تقسیم بر اساس خط‌های خالی (مرزهای پاراگراف) پیش از قطعه‌بندی بر اساس طول.
- `channels.signal.mediaMaxMb`: سقف رسانه ورودی/خروجی (MB).

گزینه‌های سراسری مرتبط:

- `agents.list[].groupChat.mentionPatterns` (Signal از منشن‌های بومی پشتیبانی نمی‌کند).
- `messages.groupChat.mentionPatterns` (جایگزین سراسری).
- `messages.responsePrefix`.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت DM و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و gating منشن
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
