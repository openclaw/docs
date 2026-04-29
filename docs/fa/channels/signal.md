---
read_when:
    - راه‌اندازی پشتیبانی از Signal
    - اشکال‌زدایی ارسال/دریافت Signal
summary: پشتیبانی از Signal از طریق signal-cli (JSON-RPC + SSE)، مسیرهای راه‌اندازی و مدل شماره
title: Signal
x-i18n:
    generated_at: "2026-04-29T22:29:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: d450454550a86cbf0e2b7231bb149f78275a756517db1f20d7a07e3d298febee
    source_path: channels/signal.md
    workflow: 16
---

وضعیت: یکپارچه‌سازی CLI خارجی. Gateway از طریق HTTP JSON-RPC + SSE با `signal-cli` ارتباط برقرار می‌کند.

## پیش‌نیازها

- OpenClaw روی سرور شما نصب شده باشد (جریان Linux زیر روی Ubuntu 24 آزمایش شده است).
- `signal-cli` روی میزبانی که Gateway اجرا می‌شود در دسترس باشد.
- یک شماره تلفن که بتواند یک پیامک تأیید دریافت کند (برای مسیر ثبت‌نام با SMS).
- دسترسی مرورگر برای کپچای Signal (`signalcaptchas.org`) هنگام ثبت‌نام.

## راه‌اندازی سریع (مبتدی)

1. از یک **شماره Signal جداگانه** برای بات استفاده کنید (توصیه می‌شود).
2. `signal-cli` را نصب کنید (اگر از ساخت JVM استفاده می‌کنید، Java لازم است).
3. یک مسیر راه‌اندازی را انتخاب کنید:
   - **مسیر A (پیوند QR):** `signal-cli link -n "OpenClaw"` و با Signal اسکن کنید.
   - **مسیر B (ثبت‌نام SMS):** یک شماره اختصاصی را با کپچا + تأیید SMS ثبت کنید.
4. OpenClaw را پیکربندی کنید و Gateway را دوباره راه‌اندازی کنید.
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
| `account`   | شماره تلفن بات در قالب E.164 (`+15551234567`) |
| `cliPath`   | مسیر `signal-cli` (`signal-cli` اگر روی `PATH` باشد)  |
| `dmPolicy`  | سیاست دسترسی DM (`pairing` توصیه می‌شود)          |
| `allowFrom` | شماره‌های تلفن یا مقادیر `uuid:<id>` که مجاز به DM هستند |

## چیست

- کانال Signal از طریق `signal-cli` (نه libsignal تعبیه‌شده).
- مسیریابی قطعی: پاسخ‌ها همیشه به Signal برمی‌گردند.
- DMها نشست اصلی عامل را به اشتراک می‌گذارند؛ گروه‌ها ایزوله هستند (`agent:<agentId>:signal:group:<groupId>`).

## نوشتن پیکربندی

به‌صورت پیش‌فرض، Signal مجاز است به‌روزرسانی‌های پیکربندی را که با `/config set|unset` فعال می‌شوند بنویسد (به `commands.config: true` نیاز دارد).

غیرفعال‌سازی با:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## مدل شماره (مهم)

- Gateway به یک **دستگاه Signal** متصل می‌شود (حساب `signal-cli`).
- اگر بات را روی **حساب Signal شخصی خودتان** اجرا کنید، پیام‌های خودتان را نادیده می‌گیرد (محافظت حلقه).
- برای «من به بات پیام می‌دهم و جواب می‌دهد»، از یک **شماره بات جداگانه** استفاده کنید.

## مسیر راه‌اندازی A: پیوند دادن حساب Signal موجود (QR)

1. `signal-cli` را نصب کنید (ساخت JVM یا native).
2. یک حساب بات را پیوند دهید:
   - `signal-cli link -n "OpenClaw"` سپس QR را در Signal اسکن کنید.
3. Signal را پیکربندی کنید و Gateway را راه‌اندازی کنید.

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

پشتیبانی چندحسابی: از `channels.signal.accounts` با پیکربندی جداگانه برای هر حساب و `name` اختیاری استفاده کنید. برای الگوی مشترک، [`gateway/configuration`](/fa/gateway/config-channels#multi-account-all-channels) را ببینید.

## مسیر راه‌اندازی B: ثبت شماره بات اختصاصی (SMS، Linux)

وقتی می‌خواهید به‌جای پیوند دادن یک حساب موجود در برنامه Signal، یک شماره بات اختصاصی داشته باشید، از این روش استفاده کنید.

1. شماره‌ای بگیرید که بتواند SMS دریافت کند (یا تأیید صوتی برای خطوط ثابت).
   - برای جلوگیری از تداخل حساب/نشست، از یک شماره بات اختصاصی استفاده کنید.
2. `signal-cli` را روی میزبان Gateway نصب کنید:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

اگر از ساخت JVM (`signal-cli-${VERSION}.tar.gz`) استفاده می‌کنید، ابتدا JRE 25+ را نصب کنید.
`signal-cli` را به‌روز نگه دارید؛ بالادست اشاره می‌کند که نسخه‌های قدیمی ممکن است با تغییر APIهای سرور Signal از کار بیفتند.

3. شماره را ثبت و تأیید کنید:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

اگر کپچا لازم است:

1. `https://signalcaptchas.org/registration/generate.html` را باز کنید.
2. کپچا را کامل کنید، هدف لینک `signalcaptcha://...` را از "Open Signal" کپی کنید.
3. در صورت امکان، از همان IP خارجی نشست مرورگر اجرا کنید.
4. ثبت‌نام را بلافاصله دوباره اجرا کنید (توکن‌های کپچا سریع منقضی می‌شوند):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw را پیکربندی کنید، Gateway را دوباره راه‌اندازی کنید، کانال را تأیید کنید:

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. فرستنده DM خود را جفت کنید:
   - هر پیامی را به شماره بات بفرستید.
   - کد را روی سرور تأیید کنید: `openclaw pairing approve signal <PAIRING_CODE>`.
   - شماره بات را به‌عنوان مخاطب روی تلفن خود ذخیره کنید تا از "Unknown contact" جلوگیری شود.

<Warning>
ثبت یک حساب شماره تلفن با `signal-cli` می‌تواند نشست اصلی برنامه Signal را برای آن شماره از اعتبار خارج کند. یک شماره بات اختصاصی را ترجیح دهید، یا اگر لازم است تنظیمات برنامه تلفن موجود خود را حفظ کنید از حالت پیوند QR استفاده کنید.
</Warning>

ارجاع‌های بالادست:

- README مربوط به `signal-cli`: `https://github.com/AsamK/signal-cli`
- جریان کپچا: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- جریان پیوند دادن: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## حالت daemon خارجی (httpUrl)

اگر می‌خواهید خودتان `signal-cli` را مدیریت کنید (شروع سرد کند JVM، init کانتینر، یا CPUهای مشترک)، daemon را جداگانه اجرا کنید و OpenClaw را به آن اشاره دهید:

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
- فرستندگان ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ پیام‌ها تا زمان تأیید نادیده گرفته می‌شوند (کدها پس از 1 ساعت منقضی می‌شوند).
- تأیید از طریق:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- جفت‌سازی، تبادل توکن پیش‌فرض برای DMهای Signal است. جزئیات: [جفت‌سازی](/fa/channels/pairing)
- فرستندگان فقط-UUID (از `sourceUuid`) به‌صورت `uuid:<id>` در `channels.signal.allowFrom` ذخیره می‌شوند.

گروه‌ها:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` کنترل می‌کند وقتی `allowlist` تنظیم شده است چه کسی می‌تواند در گروه‌ها فعال‌سازی کند.
- `channels.signal.groups["<group-id>" | "*"]` می‌تواند رفتار گروه را با `requireMention`، `tools`، و `toolsBySender` بازنویسی کند.
- برای بازنویسی‌های جداگانه هر حساب در راه‌اندازی‌های چندحسابی، از `channels.signal.accounts.<id>.groups` استفاده کنید.
- نکته زمان اجرا: اگر `channels.signal` کاملاً وجود نداشته باشد، زمان اجرا برای بررسی‌های گروه به `groupPolicy="allowlist"` برمی‌گردد (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

## چگونه کار می‌کند (رفتار)

- `signal-cli` به‌صورت daemon اجرا می‌شود؛ Gateway رویدادها را از طریق SSE می‌خواند.
- پیام‌های ورودی به پاکت مشترک کانال نرمال‌سازی می‌شوند.
- پاسخ‌ها همیشه به همان شماره یا گروه برمی‌گردند.

## رسانه + محدودیت‌ها

- متن خروجی تا `channels.signal.textChunkLimit` تکه‌تکه می‌شود (پیش‌فرض 4000).
- تکه‌تکه‌سازی اختیاری بر اساس خط جدید: `channels.signal.chunkMode="newline"` را تنظیم کنید تا قبل از تکه‌تکه‌سازی بر اساس طول، روی خطوط خالی (مرزهای پاراگراف) تقسیم شود.
- پیوست‌ها پشتیبانی می‌شوند (base64 از `signal-cli` دریافت می‌شود).
- پیوست‌های یادداشت صوتی وقتی `contentType` وجود ندارد، از نام فایل `signal-cli` به‌عنوان fallback نوع MIME استفاده می‌کنند، بنابراین رونویسی صوت همچنان می‌تواند یادداشت‌های صوتی AAC را طبقه‌بندی کند.
- سقف رسانه پیش‌فرض: `channels.signal.mediaMaxMb` (پیش‌فرض 8).
- برای رد کردن دانلود رسانه از `channels.signal.ignoreAttachments` استفاده کنید.
- زمینه تاریخچه گروه از `channels.signal.historyLimit` (یا `channels.signal.accounts.*.historyLimit`) استفاده می‌کند و به `messages.groupChat.historyLimit` fallback می‌کند. برای غیرفعال‌سازی `0` را تنظیم کنید (پیش‌فرض 50).

## تایپ کردن + رسیدهای خواندن

- **نشانگرهای تایپ**: OpenClaw سیگنال‌های تایپ را از طریق `signal-cli sendTyping` می‌فرستد و هنگام اجرای پاسخ آن‌ها را تازه‌سازی می‌کند.
- **رسیدهای خواندن**: وقتی `channels.signal.sendReadReceipts` برابر true باشد، OpenClaw رسیدهای خواندن را برای DMهای مجاز فوروارد می‌کند.
- signal-cli رسیدهای خواندن را برای گروه‌ها در معرض نمی‌گذارد.

## واکنش‌ها (ابزار پیام)

- از `message action=react` با `channel=signal` استفاده کنید.
- هدف‌ها: فرستنده E.164 یا UUID (از `uuid:<id>` در خروجی جفت‌سازی استفاده کنید؛ UUID تنها نیز کار می‌کند).
- `messageId` همان timestamp مربوط به Signal برای پیامی است که به آن واکنش می‌دهید.
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
- بازنویسی‌های جداگانه هر حساب: `channels.signal.accounts.<id>.actions.reactions`، `channels.signal.accounts.<id>.reactionLevel`.

## هدف‌های تحویل (CLI/cron)

- DMها: `signal:+15551234567` (یا E.164 ساده).
- DMهای UUID: `uuid:<id>` (یا UUID تنها).
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

- daemon در دسترس است اما پاسخی وجود ندارد: تنظیمات حساب/daemon (`httpUrl`، `account`) و حالت دریافت را بررسی کنید.
- DMها نادیده گرفته می‌شوند: فرستنده در انتظار تأیید جفت‌سازی است.
- پیام‌های گروهی نادیده گرفته می‌شوند: دروازه‌گذاری فرستنده/mention گروه تحویل را مسدود می‌کند.
- خطاهای اعتبارسنجی پیکربندی پس از ویرایش‌ها: `openclaw doctor --fix` را اجرا کنید.
- Signal در عیب‌یابی دیده نمی‌شود: تأیید کنید `channels.signal.enabled: true`.

بررسی‌های اضافی:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

برای جریان تریاژ: [/channels/troubleshooting](/fa/channels/troubleshooting).

## نکات امنیتی

- `signal-cli` کلیدهای حساب را به‌صورت محلی ذخیره می‌کند (معمولاً `~/.local/share/signal-cli/data/`).
- پیش از مهاجرت یا بازسازی سرور، از وضعیت حساب Signal نسخه پشتیبان بگیرید.
- `channels.signal.dmPolicy: "pairing"` را نگه دارید مگر اینکه صراحتاً دسترسی گسترده‌تر DM بخواهید.
- تأیید SMS فقط برای جریان‌های ثبت‌نام یا بازیابی لازم است، اما از دست دادن کنترل شماره/حساب می‌تواند ثبت‌نام دوباره را پیچیده کند.

## مرجع پیکربندی (Signal)

پیکربندی کامل: [پیکربندی](/fa/gateway/configuration)

گزینه‌های ارائه‌دهنده:

- `channels.signal.enabled`: فعال/غیرفعال کردن راه‌اندازی کانال.
- `channels.signal.account`: قالب E.164 برای حساب ربات.
- `channels.signal.cliPath`: مسیر `signal-cli`.
- `channels.signal.httpUrl`: URL کامل دیمون (میزبان/درگاه را نادیده می‌گیرد).
- `channels.signal.httpHost`, `channels.signal.httpPort`: اتصال دیمون (پیش‌فرض 127.0.0.1:8080).
- `channels.signal.autoStart`: ایجاد خودکار دیمون (اگر `httpUrl` تنظیم نشده باشد، پیش‌فرض true است).
- `channels.signal.startupTimeoutMs`: مهلت انتظار راه‌اندازی بر حسب میلی‌ثانیه (حداکثر 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: از دانلود پیوست‌ها صرف‌نظر می‌کند.
- `channels.signal.ignoreStories`: استوری‌های دیمون را نادیده می‌گیرد.
- `channels.signal.sendReadReceipts`: رسیدهای خواندن را ارسال می‌کند.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (پیش‌فرض: pairing).
- `channels.signal.allowFrom`: فهرست مجاز DM (E.164 یا `uuid:<id>`). `open` به `"*"` نیاز دارد. Signal نام کاربری ندارد؛ از شناسه‌های تلفن/UUID استفاده کنید.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (پیش‌فرض: allowlist).
- `channels.signal.groupAllowFrom`: فهرست مجاز فرستنده‌های گروه.
- `channels.signal.groups`: بازنویسی‌های به‌ازای هر گروه که با شناسه گروه Signal (یا `"*"`) کلیدگذاری شده‌اند. فیلدهای پشتیبانی‌شده: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: نسخه به‌ازای هر حساب از `channels.signal.groups` برای تنظیمات چندحسابی.
- `channels.signal.historyLimit`: حداکثر پیام‌های گروهی که به‌عنوان زمینه شامل می‌شوند (0 غیرفعال می‌کند).
- `channels.signal.dmHistoryLimit`: حد تاریخچه DM بر حسب نوبت‌های کاربر. بازنویسی‌های به‌ازای هر کاربر: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: اندازه قطعه خروجی (کاراکتر).
- `channels.signal.chunkMode`: `length` (پیش‌فرض) یا `newline` برای تقسیم بر اساس خطوط خالی (مرزهای پاراگراف) پیش از قطعه‌بندی بر اساس طول.
- `channels.signal.mediaMaxMb`: سقف رسانه ورودی/خروجی (مگابایت).

گزینه‌های سراسری مرتبط:

- `agents.list[].groupChat.mentionPatterns` (Signal از منشن‌های بومی پشتیبانی نمی‌کند).
- `messages.groupChat.mentionPatterns` (پشتیبان سراسری).
- `messages.responsePrefix`.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت DM و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار گفتگوی گروهی و کنترل مبتنی بر منشن
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و مقاوم‌سازی
