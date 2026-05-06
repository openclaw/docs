---
read_when:
    - راه‌اندازی پشتیبانی Signal
    - اشکال‌زدایی ارسال/دریافت Signal
summary: پشتیبانی Signal از طریق signal-cli (JSON-RPC + SSE)، مسیرهای راه‌اندازی، و مدل شماره
title: Signal
x-i18n:
    generated_at: "2026-05-06T09:04:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: b0290318ed0cda8f258a96da379b9774418fd888e1b78271a051c98b327a2f45
    source_path: channels/signal.md
    workflow: 16
---

وضعیت: یکپارچه‌سازی CLI خارجی. Gateway از طریق HTTP JSON-RPC + SSE با `signal-cli` صحبت می‌کند.

## پیش‌نیازها

- OpenClaw روی سرور شما نصب شده باشد (جریان Linux زیر روی Ubuntu 24 آزمایش شده است).
- `signal-cli` روی میزبانی که Gateway اجرا می‌شود در دسترس باشد.
- شماره تلفنی که بتواند یک پیامک تأیید دریافت کند (برای مسیر ثبت‌نام پیامکی).
- دسترسی مرورگر برای کپچای Signal (`signalcaptchas.org`) هنگام ثبت‌نام.

## راه‌اندازی سریع (مبتدی)

1. برای بات از یک **شماره Signal جداگانه** استفاده کنید (توصیه می‌شود).
2. `signal-cli` را نصب کنید (اگر از ساخت JVM استفاده می‌کنید، Java لازم است).
3. یک مسیر راه‌اندازی انتخاب کنید:
   - **مسیر A (پیوند QR):** `signal-cli link -n "OpenClaw"` و با Signal اسکن کنید.
   - **مسیر B (ثبت‌نام پیامکی):** یک شماره اختصاصی را با کپچا + تأیید پیامکی ثبت کنید.
4. OpenClaw را پیکربندی کنید و Gateway را راه‌اندازی مجدد کنید.
5. یک پیام خصوصی اول بفرستید و جفت‌سازی را تأیید کنید (`openclaw pairing approve signal <CODE>`).

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
| `dmPolicy`  | سیاست دسترسی پیام خصوصی (`pairing` توصیه می‌شود)          |
| `allowFrom` | شماره تلفن‌ها یا مقدارهای `uuid:<id>` مجاز برای ارسال پیام خصوصی |

## چیست

- کانال Signal از طریق `signal-cli` (نه libsignal تعبیه‌شده).
- مسیریابی قطعی: پاسخ‌ها همیشه به Signal برمی‌گردند.
- پیام‌های خصوصی نشست اصلی عامل را به اشتراک می‌گذارند؛ گروه‌ها جدا هستند (`agent:<agentId>:signal:group:<groupId>`).

## نوشتن پیکربندی

به‌طور پیش‌فرض، Signal مجاز است به‌روزرسانی‌های پیکربندی را که با `/config set|unset` آغاز شده‌اند بنویسد (به `commands.config: true` نیاز دارد).

غیرفعال‌سازی با:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## مدل شماره (مهم)

- Gateway به یک **دستگاه Signal** متصل می‌شود (حساب `signal-cli`).
- اگر بات را روی **حساب Signal شخصی خودتان** اجرا کنید، پیام‌های خودتان را نادیده می‌گیرد (محافظت در برابر حلقه).
- برای «من به بات پیام می‌دهم و پاسخ می‌دهد»، از یک **شماره بات جداگانه** استفاده کنید.

## مسیر راه‌اندازی A: پیوند دادن حساب Signal موجود (QR)

1. `signal-cli` را نصب کنید (ساخت JVM یا native).
2. یک حساب بات را پیوند دهید:
   - `signal-cli link -n "OpenClaw"` سپس QR را در Signal اسکن کنید.
3. Signal را پیکربندی کنید و Gateway را شروع کنید.

نمونه:

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

## مسیر راه‌اندازی B: ثبت شماره بات اختصاصی (پیامک، Linux)

وقتی یک شماره بات اختصاصی به‌جای پیوند دادن حساب برنامه Signal موجود می‌خواهید، از این روش استفاده کنید.

1. شماره‌ای تهیه کنید که بتواند پیامک دریافت کند (یا تأیید صوتی برای خطوط ثابت).
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
`signal-cli` را به‌روز نگه دارید؛ upstream یادآوری می‌کند که نسخه‌های قدیمی ممکن است با تغییر APIهای سرور Signal از کار بیفتند.

3. شماره را ثبت و تأیید کنید:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

اگر کپچا لازم است:

1. `https://signalcaptchas.org/registration/generate.html` را باز کنید.
2. کپچا را کامل کنید، هدف پیوند `signalcaptcha://...` را از "Open Signal" کپی کنید.
3. در صورت امکان، از همان IP خارجی نشست مرورگر اجرا کنید.
4. بلافاصله دوباره ثبت‌نام را اجرا کنید (توکن‌های کپچا سریع منقضی می‌شوند):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw را پیکربندی کنید، Gateway را راه‌اندازی مجدد کنید، کانال را بررسی کنید:

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. فرستنده پیام خصوصی خود را جفت کنید:
   - هر پیامی به شماره بات بفرستید.
   - کد را روی سرور تأیید کنید: `openclaw pairing approve signal <PAIRING_CODE>`.
   - برای جلوگیری از "Unknown contact"، شماره بات را به‌عنوان مخاطب روی تلفن خود ذخیره کنید.

<Warning>
ثبت حساب شماره تلفن با `signal-cli` می‌تواند نشست اصلی برنامه Signal را برای آن شماره از احراز هویت خارج کند. شماره بات اختصاصی را ترجیح دهید، یا اگر باید راه‌اندازی برنامه تلفن موجود خود را حفظ کنید، از حالت پیوند QR استفاده کنید.
</Warning>

مراجع upstream:

- README مربوط به `signal-cli`: `https://github.com/AsamK/signal-cli`
- جریان کپچا: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- جریان پیوند: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## حالت daemon خارجی (httpUrl)

اگر می‌خواهید `signal-cli` را خودتان مدیریت کنید (شروع سرد کند JVM، init کانتینر، یا CPUهای مشترک)، daemon را جداگانه اجرا کنید و OpenClaw را به آن اشاره دهید:

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

این کار auto-spawn و انتظار راه‌اندازی داخل OpenClaw را رد می‌کند. برای شروع‌های کند هنگام auto-spawning، `channels.signal.startupTimeoutMs` را تنظیم کنید.

## کنترل دسترسی (پیام‌های خصوصی + گروه‌ها)

پیام‌های خصوصی:

- پیش‌فرض: `channels.signal.dmPolicy = "pairing"`.
- فرستندگان ناشناخته یک کد جفت‌سازی دریافت می‌کنند؛ پیام‌ها تا زمان تأیید نادیده گرفته می‌شوند (کدها پس از 1 ساعت منقضی می‌شوند).
- تأیید از طریق:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- جفت‌سازی، تبادل توکن پیش‌فرض برای پیام‌های خصوصی Signal است. جزئیات: [جفت‌سازی](/fa/channels/pairing)
- فرستندگان فقط-UUID (از `sourceUuid`) به‌صورت `uuid:<id>` در `channels.signal.allowFrom` ذخیره می‌شوند.

گروه‌ها:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` کنترل می‌کند که کدام گروه‌ها یا فرستندگان بتوانند هنگام تنظیم `allowlist` پاسخ‌های گروهی را فعال کنند؛ ورودی‌ها می‌توانند شناسه‌های گروه Signal (خام، `group:<id>`، یا `signal:group:<id>`)، شماره تلفن فرستنده، مقدارهای `uuid:<id>`، یا `*` باشند.
- `channels.signal.groups["<group-id>" | "*"]` می‌تواند رفتار گروه را با `requireMention`، `tools`، و `toolsBySender` بازنویسی کند.
- در راه‌اندازی‌های چندحسابی، برای بازنویسی‌های هر حساب از `channels.signal.accounts.<id>.groups` استفاده کنید.
- قرار دادن یک گروه Signal در فهرست مجاز از طریق `groupAllowFrom` به‌تنهایی دروازه‌گذاری mention را غیرفعال نمی‌کند. یک ورودی مشخصاً پیکربندی‌شده `channels.signal.groups["<group-id>"]` هر پیام گروهی را پردازش می‌کند مگر اینکه `requireMention=true` تنظیم شده باشد.
- نکته زمان اجرا: اگر `channels.signal` کاملاً وجود نداشته باشد، زمان اجرا برای بررسی‌های گروه به `groupPolicy="allowlist"` برمی‌گردد (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

## چگونه کار می‌کند (رفتار)

- `signal-cli` به‌عنوان daemon اجرا می‌شود؛ Gateway رویدادها را از طریق SSE می‌خواند.
- پیام‌های ورودی به پاکت مشترک کانال نرمال‌سازی می‌شوند.
- پاسخ‌ها همیشه به همان شماره یا گروه برمی‌گردند.

## رسانه + محدودیت‌ها

- متن خروجی به `channels.signal.textChunkLimit` قطعه‌بندی می‌شود (پیش‌فرض 4000).
- قطعه‌بندی اختیاری بر اساس خط جدید: `channels.signal.chunkMode="newline"` را تنظیم کنید تا پیش از قطعه‌بندی طولی، بر اساس خطوط خالی (مرزهای پاراگراف) تقسیم شود.
- پیوست‌ها پشتیبانی می‌شوند (base64 از `signal-cli` دریافت می‌شود).
- پیوست‌های یادداشت صوتی وقتی `contentType` موجود نیست از نام فایل `signal-cli` به‌عنوان fallback نوع MIME استفاده می‌کنند، بنابراین رونویسی صوتی همچنان می‌تواند یادداشت‌های صوتی AAC را طبقه‌بندی کند.
- سقف رسانه پیش‌فرض: `channels.signal.mediaMaxMb` (پیش‌فرض 8).
- برای رد کردن دانلود رسانه از `channels.signal.ignoreAttachments` استفاده کنید.
- زمینه تاریخچه گروه از `channels.signal.historyLimit` (یا `channels.signal.accounts.*.historyLimit`) استفاده می‌کند، با fallback به `messages.groupChat.historyLimit`. برای غیرفعال‌سازی `0` را تنظیم کنید (پیش‌فرض 50).

## تایپ کردن + رسیدهای خواندن

- **نشانگرهای تایپ:** OpenClaw سیگنال‌های تایپ را از طریق `signal-cli sendTyping` ارسال می‌کند و تا زمانی که پاسخ در حال اجراست آن‌ها را تازه‌سازی می‌کند.
- **رسیدهای خواندن:** وقتی `channels.signal.sendReadReceipts` true باشد، OpenClaw رسیدهای خواندن را برای پیام‌های خصوصی مجاز ارسال می‌کند.
- Signal-cli رسیدهای خواندن را برای گروه‌ها در معرض نمی‌گذارد.

## واکنش‌ها (ابزار پیام)

- از `message action=react` با `channel=signal` استفاده کنید.
- هدف‌ها: فرستنده E.164 یا UUID (از `uuid:<id>` خروجی جفت‌سازی استفاده کنید؛ UUID خالی هم کار می‌کند).
- `messageId` زمان‌مهر Signal برای پیامی است که به آن واکنش نشان می‌دهید.
- واکنش‌های گروهی به `targetAuthor` یا `targetAuthorUuid` نیاز دارند.

نمونه‌ها:

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

## اهداف تحویل (CLI/Cron)

- پیام‌های خصوصی: `signal:+15551234567` (یا E.164 ساده).
- پیام‌های خصوصی UUID: `uuid:<id>` (یا UUID خالی).
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

سپس در صورت نیاز وضعیت جفت‌سازی پیام خصوصی را تأیید کنید:

```bash
openclaw pairing list signal
```

خرابی‌های رایج:

- Daemon در دسترس است اما پاسخی نیست: تنظیمات حساب/daemon (`httpUrl`، `account`) و حالت دریافت را بررسی کنید.
- پیام‌های خصوصی نادیده گرفته می‌شوند: فرستنده در انتظار تأیید جفت‌سازی است.
- پیام‌های گروهی نادیده گرفته می‌شوند: دروازه‌گذاری فرستنده/mention گروه تحویل را مسدود می‌کند.
- خطاهای اعتبارسنجی پیکربندی پس از ویرایش‌ها: `openclaw doctor --fix` را اجرا کنید.
- Signal در عیب‌یابی‌ها وجود ندارد: `channels.signal.enabled: true` را تأیید کنید.

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
- `channels.signal.dmPolicy: "pairing"` را حفظ کنید مگر اینکه صراحتاً دسترسی گسترده‌تر به پیام‌های خصوصی را بخواهید.
- تأیید پیامکی فقط برای جریان‌های ثبت‌نام یا بازیابی لازم است، اما از دست دادن کنترل شماره/حساب می‌تواند ثبت‌نام دوباره را پیچیده کند.

## مرجع پیکربندی (Signal)

پیکربندی کامل: [پیکربندی](/fa/gateway/configuration)

گزینه‌های ارائه‌دهنده:

- `channels.signal.enabled`: فعال/غیرفعال کردن راه‌اندازی کانال.
- `channels.signal.account`: ‎E.164 برای حساب ربات.
- `channels.signal.cliPath`: مسیر `signal-cli`.
- `channels.signal.httpUrl`: URL کامل daemon (مقدار host/port را بازنویسی می‌کند).
- `channels.signal.httpHost`, `channels.signal.httpPort`: اتصال daemon (پیش‌فرض 127.0.0.1:8080).
- `channels.signal.autoStart`: اجرای خودکار daemon (اگر `httpUrl` تنظیم نشده باشد، پیش‌فرض true است).
- `channels.signal.startupTimeoutMs`: مهلت انتظار راه‌اندازی بر حسب ms (حداکثر 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: رد کردن دانلود پیوست‌ها.
- `channels.signal.ignoreStories`: نادیده گرفتن storyها از daemon.
- `channels.signal.sendReadReceipts`: ارسال رسیدهای خواندن.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (پیش‌فرض: pairing).
- `channels.signal.allowFrom`: allowlist پیام مستقیم (E.164 یا `uuid:<id>`). `open` به `"*"` نیاز دارد. Signal نام کاربری ندارد؛ از شناسه‌های تلفن/UUID استفاده کنید.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (پیش‌فرض: allowlist).
- `channels.signal.groupAllowFrom`: allowlist گروه؛ شناسه‌های گروه Signal (خام، `group:<id>`، یا `signal:group:<id>`)، شماره‌های E.164 فرستنده، یا مقدارهای `uuid:<id>` را می‌پذیرد.
- `channels.signal.groups`: بازنویسی‌های هر گروه که با شناسه گروه Signal (یا `"*"`) کلیدگذاری شده‌اند. فیلدهای پشتیبانی‌شده: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: نسخه هر حساب از `channels.signal.groups` برای تنظیمات چندحسابی.
- `channels.signal.historyLimit`: بیشینه پیام‌های گروهی برای گنجاندن به‌عنوان زمینه (0 غیرفعال می‌کند).
- `channels.signal.dmHistoryLimit`: محدودیت تاریخچه پیام مستقیم در نوبت‌های کاربر. بازنویسی‌های هر کاربر: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: اندازه قطعه خروجی (کاراکتر).
- `channels.signal.chunkMode`: `length` (پیش‌فرض) یا `newline` برای تقسیم بر اساس خطوط خالی (مرزهای پاراگراف) پیش از قطعه‌بندی بر اساس طول.
- `channels.signal.mediaMaxMb`: سقف رسانه ورودی/خروجی (MB).

گزینه‌های سراسری مرتبط:

- `agents.list[].groupChat.mentionPatterns` (Signal از اشاره‌های بومی پشتیبانی نمی‌کند).
- `messages.groupChat.mentionPatterns` (fallback سراسری).
- `messages.responsePrefix`.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [Pairing](/fa/channels/pairing) — احراز هویت پیام مستقیم و جریان pairing
- [گروه‌ها](/fa/channels/groups) — رفتار چت گروهی و mention gating
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
