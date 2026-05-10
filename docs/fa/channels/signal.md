---
read_when:
    - راه‌اندازی پشتیبانی Signal
    - اشکال‌زدایی ارسال/دریافت Signal
summary: پشتیبانی Signal از طریق signal-cli (دیمون بومی یا کانتینر bbernhard)، مسیرهای راه‌اندازی، و مدل شماره
title: Signal
x-i18n:
    generated_at: "2026-05-10T19:24:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d92f94f6c1363a795366501bb5c6d5f09756c03f156b482d17021c276e3577c
    source_path: channels/signal.md
    workflow: 16
---

وضعیت: یکپارچه‌سازی خارجی CLI. Gateway از طریق HTTP با `signal-cli` ارتباط برقرار می‌کند؛ یا daemon بومی (JSON-RPC + SSE) یا کانتینر bbernhard/signal-cli-rest-api (REST + WebSocket).

## پیش‌نیازها

- OpenClaw روی سرور شما نصب شده باشد (روند Linux زیر روی Ubuntu 24 آزمایش شده است).
- یکی از این‌ها:
  - `signal-cli` روی میزبان در دسترس باشد (حالت بومی)، **یا**
  - کانتینر Docker مربوط به `bbernhard/signal-cli-rest-api` (حالت کانتینر).
- یک شماره تلفن که بتواند یک پیامک تأیید دریافت کند (برای مسیر ثبت‌نام با پیامک).
- دسترسی مرورگر برای کپچای Signal (`signalcaptchas.org`) هنگام ثبت‌نام.

## راه‌اندازی سریع (مبتدی)

1. برای ربات از یک **شماره Signal جداگانه** استفاده کنید (توصیه می‌شود).
2. `signal-cli` را نصب کنید (اگر از ساخت JVM استفاده می‌کنید، Java لازم است).
3. یکی از مسیرهای راه‌اندازی را انتخاب کنید:
   - **مسیر A (پیوند QR):** `signal-cli link -n "OpenClaw"` و اسکن با Signal.
   - **مسیر B (ثبت‌نام پیامکی):** یک شماره اختصاصی را با کپچا + تأیید پیامکی ثبت کنید.
4. OpenClaw را پیکربندی کنید و Gateway را راه‌اندازی مجدد کنید.
5. یک پیام مستقیم اولیه بفرستید و جفت‌سازی را تأیید کنید (`openclaw pairing approve signal <CODE>`).

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
| `account`   | شماره تلفن ربات در قالب E.164 (`+15551234567`) |
| `cliPath`   | مسیر `signal-cli` (`signal-cli` اگر در `PATH` باشد)  |
| `dmPolicy`  | سیاست دسترسی پیام مستقیم (`pairing` توصیه می‌شود)          |
| `allowFrom` | شماره‌های تلفن یا مقدارهای `uuid:<id>` که اجازه پیام مستقیم دارند |

## چیستی آن

- کانال Signal از طریق `signal-cli` (نه libsignal تعبیه‌شده).
- مسیریابی قطعی: پاسخ‌ها همیشه به Signal برمی‌گردند.
- پیام‌های مستقیم نشست اصلی عامل را به اشتراک می‌گذارند؛ گروه‌ها جدا هستند (`agent:<agentId>:signal:group:<groupId>`).

## نوشتن پیکربندی

به‌طور پیش‌فرض، Signal اجازه دارد به‌روزرسانی‌های پیکربندی فعال‌شده با `/config set|unset` را بنویسد (به `commands.config: true` نیاز دارد).

غیرفعال‌سازی با:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## مدل شماره (مهم)

- Gateway به یک **دستگاه Signal** متصل می‌شود (حساب `signal-cli`).
- اگر ربات را روی **حساب شخصی Signal خودتان** اجرا کنید، پیام‌های خودتان را نادیده می‌گیرد (محافظت در برابر حلقه).
- برای «من به ربات پیام می‌دهم و پاسخ می‌دهد»، از یک **شماره ربات جداگانه** استفاده کنید.

## مسیر راه‌اندازی A: پیوند دادن حساب Signal موجود (QR)

1. `signal-cli` را نصب کنید (ساخت JVM یا بومی).
2. یک حساب ربات را پیوند دهید:
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

## مسیر راه‌اندازی B: ثبت شماره اختصاصی ربات (پیامک، Linux)

وقتی به‌جای پیوند دادن یک حساب برنامه Signal موجود، یک شماره اختصاصی ربات می‌خواهید، از این روش استفاده کنید.

1. شماره‌ای تهیه کنید که بتواند پیامک دریافت کند (یا تأیید صوتی برای خطوط ثابت).
   - برای جلوگیری از تداخل حساب/نشست، از شماره اختصاصی ربات استفاده کنید.
2. `signal-cli` را روی میزبان Gateway نصب کنید:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

اگر از ساخت JVM (`signal-cli-${VERSION}.tar.gz`) استفاده می‌کنید، ابتدا JRE 25+ را نصب کنید.
`signal-cli` را به‌روز نگه دارید؛ بالادست اشاره می‌کند که نسخه‌های قدیمی با تغییر APIهای سرور Signal ممکن است از کار بیفتند.

3. شماره را ثبت و تأیید کنید:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

اگر کپچا لازم بود:

1. `https://signalcaptchas.org/registration/generate.html` را باز کنید.
2. کپچا را تکمیل کنید، مقصد پیوند `signalcaptcha://...` را از "Open Signal" کپی کنید.
3. در صورت امکان، از همان IP خارجی نشست مرورگر اجرا کنید.
4. ثبت‌نام را فوراً دوباره اجرا کنید (توکن‌های کپچا سریع منقضی می‌شوند):

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

5. فرستنده پیام مستقیم خود را جفت کنید:
   - هر پیامی را به شماره ربات بفرستید.
   - کد را روی سرور تأیید کنید: `openclaw pairing approve signal <PAIRING_CODE>`.
   - برای جلوگیری از "Unknown contact"، شماره ربات را به‌عنوان مخاطب در تلفن خود ذخیره کنید.

<Warning>
ثبت یک حساب شماره تلفن با `signal-cli` می‌تواند نشست اصلی برنامه Signal برای آن شماره را از احراز هویت خارج کند. شماره اختصاصی ربات را ترجیح دهید، یا اگر باید راه‌اندازی برنامه تلفن موجود خود را حفظ کنید، از حالت پیوند QR استفاده کنید.
</Warning>

ارجاع‌های بالادست:

- README مربوط به `signal-cli`: `https://github.com/AsamK/signal-cli`
- روند کپچا: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- روند پیونددهی: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

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

این کار راه‌اندازی خودکار و انتظار شروع داخل OpenClaw را رد می‌کند. برای شروع‌های کند هنگام راه‌اندازی خودکار، `channels.signal.startupTimeoutMs` را تنظیم کنید.

## حالت کانتینر (bbernhard/signal-cli-rest-api)

به‌جای اجرای بومی `signal-cli`، می‌توانید از کانتینر Docker مربوط به [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) استفاده کنید. این، `signal-cli` را پشت یک REST API و رابط WebSocket قرار می‌دهد.

نیازمندی‌ها:

- کانتینر **باید** با `MODE=json-rpc` اجرا شود تا دریافت پیام بی‌درنگ انجام شود.
- قبل از اتصال OpenClaw، حساب Signal خود را داخل کانتینر ثبت یا پیوند کنید.

نمونه سرویس `docker-compose.yml`:

```yaml
signal-cli:
  image: bbernhard/signal-cli-rest-api:latest
  environment:
    MODE: json-rpc
  ports:
    - "8080:8080"
  volumes:
    - signal-cli-data:/home/.local/share/signal-cli
```

پیکربندی OpenClaw:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      httpUrl: "http://signal-cli:8080",
      autoStart: false,
      apiMode: "container", // or "auto" to detect automatically
    },
  },
}
```

فیلد `apiMode` کنترل می‌کند OpenClaw از کدام پروتکل استفاده کند:

| مقدار         | رفتار                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (پیش‌فرض) هر دو انتقال را بررسی می‌کند؛ پخش جریانی دریافت WebSocket کانتینر را اعتبارسنجی می‌کند    |
| `"native"`    | اجبار به signal-cli بومی (JSON-RPC در `/api/v1/rpc`، SSE در `/api/v1/events`)         |
| `"container"` | اجبار به کانتینر bbernhard (REST در `/v2/send`، WebSocket در `/v1/receive/{account}`) |

وقتی `apiMode` برابر `"auto"` باشد، OpenClaw حالت شناسایی‌شده را برای ۳۰ ثانیه cache می‌کند تا از بررسی‌های تکراری جلوگیری شود. دریافت کانتینری فقط پس از ارتقای `/v1/receive/{account}` به WebSocket برای پخش جریانی انتخاب می‌شود، که به `MODE=json-rpc` نیاز دارد.

حالت کانتینر همان عملیات کانال Signal را در جاهایی که کانتینر APIهای متناظر را ارائه می‌کند مانند حالت بومی پشتیبانی می‌کند: ارسال‌ها، دریافت‌ها، پیوست‌ها، نشانگرهای تایپ، رسیدهای خواندن/دیده‌شدن، واکنش‌ها، گروه‌ها و متن سبک‌دهی‌شده. OpenClaw فراخوانی‌های RPC بومی Signal خود را به payloadهای REST کانتینر ترجمه می‌کند، از جمله شناسه‌های گروه `group.{base64(internal_id)}` و `text_mode: "styled"` برای متن قالب‌بندی‌شده.

نکات عملیاتی:

- با حالت کانتینر از `autoStart: false` استفاده کنید. وقتی `apiMode: "container"` انتخاب شده است، OpenClaw نباید daemon بومی را اجرا کند.
- برای دریافت از `MODE=json-rpc` استفاده کنید. `MODE=normal` می‌تواند باعث شود `/v1/about` سالم به نظر برسد، اما `/v1/receive/{account}` به WebSocket ارتقا پیدا نمی‌کند، بنابراین OpenClaw در حالت `auto` پخش جریانی دریافت کانتینر را انتخاب نمی‌کند.
- وقتی می‌دانید `httpUrl` به REST API متعلق به bbernhard اشاره می‌کند، `apiMode: "container"` را تنظیم کنید. وقتی می‌دانید به JSON-RPC/SSE بومی `signal-cli` اشاره می‌کند، `apiMode: "native"` را تنظیم کنید. وقتی استقرار ممکن است متفاوت باشد، از `"auto"` استفاده کنید.
- دانلودهای پیوست کانتینر همان محدودیت‌های بایت رسانه را مانند حالت بومی رعایت می‌کنند. پاسخ‌های بیش از حد بزرگ، وقتی سرور `Content-Length` می‌فرستد پیش از buffer کامل رد می‌شوند، و در غیر این صورت هنگام streaming رد می‌شوند.

## کنترل دسترسی (پیام‌های مستقیم + گروه‌ها)

پیام‌های مستقیم:

- پیش‌فرض: `channels.signal.dmPolicy = "pairing"`.
- فرستنده‌های ناشناخته یک کد جفت‌سازی دریافت می‌کنند؛ پیام‌ها تا زمان تأیید نادیده گرفته می‌شوند (کدها پس از ۱ ساعت منقضی می‌شوند).
- تأیید از طریق:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- جفت‌سازی تبادل توکن پیش‌فرض برای پیام‌های مستقیم Signal است. جزئیات: [جفت‌سازی](/fa/channels/pairing)
- فرستنده‌های فقط UUID (از `sourceUuid`) به‌صورت `uuid:<id>` در `channels.signal.allowFrom` ذخیره می‌شوند.

گروه‌ها:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` کنترل می‌کند وقتی `allowlist` تنظیم شده است، کدام گروه‌ها یا فرستنده‌ها می‌توانند پاسخ‌های گروهی را فعال کنند؛ ورودی‌ها می‌توانند شناسه‌های گروه Signal (خام، `group:<id>`، یا `signal:group:<id>`)، شماره‌های تلفن فرستنده، مقدارهای `uuid:<id>`، یا `*` باشند.
- `channels.signal.groups["<group-id>" | "*"]` می‌تواند رفتار گروه را با `requireMention`، `tools` و `toolsBySender` override کند.
- برای overrideهای جداگانه هر حساب در راه‌اندازی‌های چندحسابی، از `channels.signal.accounts.<id>.groups` استفاده کنید.
- allowlist کردن یک گروه Signal از طریق `groupAllowFrom` به‌خودی‌خود دروازه‌گذاری mention را غیرفعال نمی‌کند. یک ورودی مشخصاً پیکربندی‌شده `channels.signal.groups["<group-id>"]` همه پیام‌های گروه را پردازش می‌کند، مگر اینکه `requireMention=true` تنظیم شده باشد.
- نکته زمان اجرا: اگر `channels.signal` کاملاً وجود نداشته باشد، runtime برای بررسی‌های گروه به `groupPolicy="allowlist"` برمی‌گردد (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

## نحوه کار (رفتار)

- حالت بومی: `signal-cli` به‌عنوان daemon اجرا می‌شود؛ Gateway رویدادها را از طریق SSE می‌خواند.
- حالت کانتینر: Gateway از طریق REST API ارسال می‌کند و از طریق WebSocket دریافت می‌کند.
- پیام‌های ورودی به envelope مشترک کانال نرمال‌سازی می‌شوند.
- پاسخ‌ها همیشه به همان شماره یا گروه برمی‌گردند.

## رسانه + محدودیت‌ها

- متن خروجی به `channels.signal.textChunkLimit` قطعه‌بندی می‌شود (پیش‌فرض ۴۰۰۰).
- قطعه‌بندی اختیاری بر اساس خط جدید: `channels.signal.chunkMode="newline"` را تنظیم کنید تا پیش از قطعه‌بندی بر اساس طول، متن بر اساس خطوط خالی (مرزهای پاراگراف) تقسیم شود.
- پیوست‌ها پشتیبانی می‌شوند (base64 از `signal-cli` دریافت می‌شود).
- پیوست‌های یادداشت صوتی وقتی `contentType` وجود ندارد، از نام فایل `signal-cli` به‌عنوان fallback نوع MIME استفاده می‌کنند، بنابراین رونویسی صوتی همچنان می‌تواند یادداشت‌های صوتی AAC را طبقه‌بندی کند.
- سقف پیش‌فرض رسانه: `channels.signal.mediaMaxMb` (پیش‌فرض ۸).
- برای رد کردن دانلود رسانه از `channels.signal.ignoreAttachments` استفاده کنید.
- زمینه تاریخچه گروه از `channels.signal.historyLimit` (یا `channels.signal.accounts.*.historyLimit`) استفاده می‌کند و به `messages.groupChat.historyLimit` برمی‌گردد. برای غیرفعال‌سازی، `0` را تنظیم کنید (پیش‌فرض ۵۰).

## تایپ + رسیدهای خواندن

- **نشانگرهای تایپ**: OpenClaw سیگنال‌های تایپ را از طریق `signal-cli sendTyping` می‌فرستد و هنگام اجرای پاسخ آن‌ها را تازه‌سازی می‌کند.
- **رسیدهای خواندن**: وقتی `channels.signal.sendReadReceipts` برابر true باشد، OpenClaw رسیدهای خواندن را برای پیام‌های مستقیم مجاز forward می‌کند.
- Signal-cli رسیدهای خواندن برای گروه‌ها را ارائه نمی‌کند.

## واکنش‌ها (ابزار پیام)

- از `message action=react` همراه با `channel=signal` استفاده کنید.
- اهداف: فرستنده به‌صورت E.164 یا UUID (از `uuid:<id>` در خروجی جفت‌سازی استفاده کنید؛ UUID تنها هم کار می‌کند).
- `messageId` همان برچسب زمانی Signal برای پیامی است که به آن واکنش می‌دهید.
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
  - `minimal`/`extensive` واکنش‌های عامل را فعال می‌کند و سطح راهنما را تنظیم می‌کند.
- بازنویسی‌های مخصوص هر حساب: `channels.signal.accounts.<id>.actions.reactions`، `channels.signal.accounts.<id>.reactionLevel`.

## اهداف تحویل (CLI/cron)

- پیام‌های مستقیم: `signal:+15551234567` (یا E.164 ساده).
- پیام‌های مستقیم UUID: `uuid:<id>` (یا UUID تنها).
- گروه‌ها: `signal:group:<groupId>`.
- نام‌های کاربری: `username:<name>` (اگر توسط حساب Signal شما پشتیبانی شود).

## عیب‌یابی

ابتدا این نردبان را اجرا کنید:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

سپس در صورت نیاز وضعیت جفت‌سازی پیام مستقیم را تأیید کنید:

```bash
openclaw pairing list signal
```

خرابی‌های رایج:

- Daemon در دسترس است اما پاسخی نمی‌آید: تنظیمات حساب/daemon (`httpUrl`، `account`) و حالت دریافت را بررسی کنید.
- پیام‌های مستقیم نادیده گرفته می‌شوند: فرستنده در انتظار تأیید جفت‌سازی است.
- پیام‌های گروهی نادیده گرفته می‌شوند: گیتینگ فرستنده/اشاره در گروه تحویل را مسدود می‌کند.
- خطاهای اعتبارسنجی پیکربندی پس از ویرایش‌ها: `openclaw doctor --fix` را اجرا کنید.
- Signal در تشخیص‌ها وجود ندارد: `channels.signal.enabled: true` را تأیید کنید.

بررسی‌های اضافه:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

برای جریان تریاژ: [/channels/troubleshooting](/fa/channels/troubleshooting).

## نکات امنیتی

- `signal-cli` کلیدهای حساب را به‌صورت محلی ذخیره می‌کند (معمولاً در `~/.local/share/signal-cli/data/`).
- پیش از مهاجرت یا بازسازی سرور، از وضعیت حساب Signal پشتیبان بگیرید.
- `channels.signal.dmPolicy: "pairing"` را نگه دارید، مگر اینکه صراحتاً دسترسی گسترده‌تر به پیام مستقیم می‌خواهید.
- تأیید SMS فقط برای جریان‌های ثبت‌نام یا بازیابی لازم است، اما از دست دادن کنترل شماره/حساب می‌تواند ثبت‌نام دوباره را پیچیده کند.

## مرجع پیکربندی (Signal)

پیکربندی کامل: [پیکربندی](/fa/gateway/configuration)

گزینه‌های ارائه‌دهنده:

- `channels.signal.enabled`: فعال/غیرفعال کردن راه‌اندازی کانال.
- `channels.signal.apiMode`: `auto | native | container` (پیش‌فرض: auto). [حالت کانتینر](#container-mode-bbernhardsignal-cli-rest-api) را ببینید.
- `channels.signal.account`: E.164 برای حساب ربات.
- `channels.signal.cliPath`: مسیر `signal-cli`.
- `channels.signal.httpUrl`: URL کامل daemon (host/port را بازنویسی می‌کند).
- `channels.signal.httpHost`، `channels.signal.httpPort`: اتصال daemon (پیش‌فرض 127.0.0.1:8080).
- `channels.signal.autoStart`: اجرای خودکار daemon (اگر `httpUrl` تنظیم نشده باشد، پیش‌فرض true).
- `channels.signal.startupTimeoutMs`: زمان انتظار راه‌اندازی برحسب ms (سقف 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: رد کردن دانلود پیوست‌ها.
- `channels.signal.ignoreStories`: نادیده گرفتن استوری‌ها از daemon.
- `channels.signal.sendReadReceipts`: بازفرستادن رسیدهای خوانده‌شدن.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (پیش‌فرض: pairing).
- `channels.signal.allowFrom`: فهرست مجاز پیام مستقیم (E.164 یا `uuid:<id>`). `open` به `"*"` نیاز دارد. Signal نام کاربری ندارد؛ از شناسه‌های تلفن/UUID استفاده کنید.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (پیش‌فرض: allowlist).
- `channels.signal.groupAllowFrom`: فهرست مجاز گروه؛ شناسه‌های گروه Signal (خام، `group:<id>`، یا `signal:group:<id>`)، شماره‌های E.164 فرستنده، یا مقادیر `uuid:<id>` را می‌پذیرد.
- `channels.signal.groups`: بازنویسی‌های مخصوص هر گروه که با شناسه گروه Signal (یا `"*"`) کلیدگذاری شده‌اند. فیلدهای پشتیبانی‌شده: `requireMention`، `tools`، `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: نسخه مخصوص هر حساب از `channels.signal.groups` برای تنظیمات چندحسابی.
- `channels.signal.historyLimit`: بیشینه پیام‌های گروهی برای افزودن به‌عنوان زمینه (0 غیرفعال می‌کند).
- `channels.signal.dmHistoryLimit`: حد تاریخچه پیام مستقیم برحسب نوبت‌های کاربر. بازنویسی‌های مخصوص هر کاربر: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: اندازه قطعه خروجی (نویسه).
- `channels.signal.chunkMode`: `length` (پیش‌فرض) یا `newline` برای تقسیم بر اساس خطوط خالی (مرزهای پاراگراف) پیش از قطعه‌بندی بر اساس طول.
- `channels.signal.mediaMaxMb`: سقف رسانه ورودی/خروجی (MB).

گزینه‌های سراسری مرتبط:

- `agents.list[].groupChat.mentionPatterns` (Signal از اشاره‌های بومی پشتیبانی نمی‌کند).
- `messages.groupChat.mentionPatterns` (جایگزین سراسری).
- `messages.responsePrefix`.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت پیام مستقیم و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و گیتینگ اشاره
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
