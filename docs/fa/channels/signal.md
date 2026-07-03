---
read_when:
    - راه‌اندازی پشتیبانی Signal
    - اشکال‌زدایی ارسال/دریافت Signal
summary: پشتیبانی از Signal از طریق signal-cli (daemon بومی یا container bbernhard)، مسیرهای راه‌اندازی، و مدل شماره
title: Signal
x-i18n:
    generated_at: "2026-07-03T17:31:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 862afe3764e89aa026d245f57134b8e8e157539f24975ca341d67296fb8852d0
    source_path: channels/signal.md
    workflow: 16
---

وضعیت: یکپارچه‌سازی CLI خارجی. Gateway از طریق HTTP با `signal-cli` صحبت می‌کند — یا daemon بومی (JSON-RPC + SSE) یا کانتینر bbernhard/signal-cli-rest-api (REST + WebSocket).

## پیش‌نیازها

- OpenClaw روی سرور شما نصب شده باشد (جریان Linux زیر روی Ubuntu 24 آزموده شده است).
- یکی از موارد زیر:
  - `signal-cli` روی میزبان در دسترس باشد (حالت بومی)، **یا**
  - کانتینر Docker به نام `bbernhard/signal-cli-rest-api` (حالت کانتینر).
- یک شماره تلفن که بتواند یک پیامک تأیید دریافت کند (برای مسیر ثبت‌نام پیامکی).
- دسترسی مرورگر برای کپچای Signal (`signalcaptchas.org`) هنگام ثبت‌نام.

## راه‌اندازی سریع (مبتدی)

1. از یک **شماره Signal جداگانه** برای ربات استفاده کنید (توصیه‌شده).
2. Plugin مربوط به OpenClaw را نصب کنید:

```bash
openclaw plugins install @openclaw/signal
```

3. `signal-cli` را نصب کنید (اگر از ساخت JVM استفاده می‌کنید، Java لازم است).
4. یک مسیر راه‌اندازی انتخاب کنید:
   - **مسیر A (پیوند QR):** `signal-cli link -n "OpenClaw"` و اسکن با Signal.
   - **مسیر B (ثبت‌نام پیامکی):** ثبت یک شماره اختصاصی با کپچا + تأیید پیامکی.
5. OpenClaw را پیکربندی کنید و gateway را راه‌اندازی مجدد کنید.
6. یک DM اولیه بفرستید و جفت‌سازی را تأیید کنید (`openclaw pairing approve signal <CODE>`).

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

| فیلد         | توضیح                                                    |
| ------------ | -------------------------------------------------------- |
| `account`    | شماره تلفن ربات در قالب E.164 (`+15551234567`)           |
| `cliPath`    | مسیر `signal-cli` (`signal-cli` اگر در `PATH` باشد)      |
| `configPath` | پوشه پیکربندی signal-cli که به‌صورت `--config` داده می‌شود |
| `dmPolicy`   | سیاست دسترسی DM (`pairing` توصیه می‌شود)                 |
| `allowFrom`  | شماره‌های تلفن یا مقادیر `uuid:<id>` مجاز برای DM        |

## چیستی آن

- کانال Signal از طریق `signal-cli` (نه libsignal جاسازی‌شده).
- مسیریابی قطعی: پاسخ‌ها همیشه به Signal برمی‌گردند.
- DMها نشست اصلی agent را به اشتراک می‌گذارند؛ گروه‌ها ایزوله هستند (`agent:<agentId>:signal:group:<groupId>`).

## نوشتن پیکربندی

به‌طور پیش‌فرض، Signal مجاز است به‌روزرسانی‌های پیکربندی را که با `/config set|unset` فعال می‌شوند بنویسد (نیازمند `commands.config: true`).

برای غیرفعال‌سازی:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## مدل شماره (مهم)

- gateway به یک **دستگاه Signal** وصل می‌شود (حساب `signal-cli`).
- اگر ربات را روی **حساب شخصی Signal خودتان** اجرا کنید، پیام‌های خودتان را نادیده می‌گیرد (محافظت در برابر حلقه).
- برای «من به ربات پیام می‌دهم و پاسخ می‌دهد»، از یک **شماره ربات جداگانه** استفاده کنید.

## مسیر راه‌اندازی A: پیوند دادن حساب Signal موجود (QR)

1. `signal-cli` را نصب کنید (ساخت JVM یا بومی).
2. یک حساب ربات را پیوند دهید:
   - `signal-cli link -n "OpenClaw"` سپس QR را در Signal اسکن کنید.
3. Signal را پیکربندی کنید و gateway را شروع کنید.

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

## مسیر راه‌اندازی B: ثبت شماره ربات اختصاصی (SMS، Linux)

وقتی یک شماره اختصاصی ربات می‌خواهید و نمی‌خواهید یک حساب برنامه Signal موجود را پیوند دهید، از این روش استفاده کنید.

1. شماره‌ای تهیه کنید که بتواند SMS دریافت کند (یا تأیید صوتی برای خطوط ثابت).
   - برای جلوگیری از تداخل حساب/نشست، از یک شماره ربات اختصاصی استفاده کنید.
2. `signal-cli` را روی میزبان gateway نصب کنید:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

اگر از ساخت JVM (`signal-cli-${VERSION}.tar.gz`) استفاده می‌کنید، ابتدا JRE 25+ را نصب کنید.
`signal-cli` را به‌روز نگه دارید؛ بالادست یادآوری می‌کند که نسخه‌های قدیمی ممکن است با تغییر APIهای سرور Signal از کار بیفتند.

3. شماره را ثبت و تأیید کنید:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

اگر کپچا لازم بود:

1. `https://signalcaptchas.org/registration/generate.html` را باز کنید.
2. کپچا را کامل کنید، مقصد پیوند `signalcaptcha://...` را از "Open Signal" کپی کنید.
3. در صورت امکان، از همان IP خارجی نشست مرورگر اجرا کنید.
4. بلافاصله دوباره ثبت‌نام را اجرا کنید (توکن‌های کپچا سریع منقضی می‌شوند):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw را پیکربندی کنید، gateway را راه‌اندازی مجدد کنید، کانال را تأیید کنید:

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. فرستنده DM خود را جفت کنید:
   - هر پیامی به شماره ربات بفرستید.
   - کد را روی سرور تأیید کنید: `openclaw pairing approve signal <PAIRING_CODE>`.
   - شماره ربات را در گوشی خود به‌عنوان مخاطب ذخیره کنید تا از نمایش "Unknown contact" جلوگیری شود.

<Warning>
ثبت یک حساب شماره تلفن با `signal-cli` می‌تواند نشست اصلی برنامه Signal را برای آن شماره از احراز هویت خارج کند. شماره ربات اختصاصی را ترجیح دهید، یا اگر لازم است راه‌اندازی برنامه تلفن موجودتان را حفظ کنید از حالت پیوند QR استفاده کنید.
</Warning>

مراجع بالادست:

- README مربوط به `signal-cli`: `https://github.com/AsamK/signal-cli`
- جریان کپچا: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- جریان پیوند دادن: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## حالت daemon خارجی (httpUrl)

اگر می‌خواهید `signal-cli` را خودتان مدیریت کنید (شروع سرد کند JVM، آغازگر کانتینر، یا CPUهای اشتراکی)، daemon را جداگانه اجرا کنید و OpenClaw را به آن نشانه بگیرید:

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

این کار auto-spawn و انتظار شروع داخل OpenClaw را رد می‌کند. برای شروع‌های کند هنگام auto-spawn، `channels.signal.startupTimeoutMs` را تنظیم کنید.

## حالت کانتینر (bbernhard/signal-cli-rest-api)

به‌جای اجرای بومی `signal-cli`، می‌توانید از کانتینر Docker به نام [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) استفاده کنید. این کانتینر `signal-cli` را پشت یک REST API و رابط WebSocket قرار می‌دهد.

نیازمندی‌ها:

- کانتینر برای دریافت پیام بلادرنگ **باید** با `MODE=json-rpc` اجرا شود.
- پیش از اتصال OpenClaw، حساب Signal خود را داخل کانتینر ثبت یا پیوند دهید.

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

| مقدار         | رفتار                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------- |
| `"auto"`      | (پیش‌فرض) هر دو انتقال را probe می‌کند؛ streaming دریافت WebSocket کانتینر را اعتبارسنجی می‌کند |
| `"native"`    | اجبار به signal-cli بومی (JSON-RPC در `/api/v1/rpc`، SSE در `/api/v1/events`)            |
| `"container"` | اجبار به کانتینر bbernhard (REST در `/v2/send`، WebSocket در `/v1/receive/{account}`)    |

وقتی `apiMode` برابر `"auto"` باشد، OpenClaw حالت شناسایی‌شده را برای ۳۰ ثانیه cache می‌کند تا از probeهای تکراری جلوگیری شود. دریافت کانتینر فقط پس از ارتقای `/v1/receive/{account}` به WebSocket برای streaming انتخاب می‌شود، که نیازمند `MODE=json-rpc` است.

حالت کانتینر همان عملیات کانال Signal را مانند حالت بومی پشتیبانی می‌کند، تا جایی که کانتینر APIهای متناظر را ارائه دهد: ارسال‌ها، دریافت‌ها، پیوست‌ها، نشانگرهای تایپ، رسیدهای خواندن/دیده‌شدن، واکنش‌ها، گروه‌ها و متن سبک‌دار. OpenClaw فراخوانی‌های RPC بومی Signal خود را به payloadهای REST کانتینر ترجمه می‌کند، از جمله شناسه‌های گروه `group.{base64(internal_id)}` و `text_mode: "styled"` برای متن قالب‌بندی‌شده.

نکات عملیاتی:

- با حالت کانتینر از `autoStart: false` استفاده کنید. وقتی `apiMode: "container"` انتخاب شده است، OpenClaw نباید daemon بومی را spawn کند.
- برای دریافت، از `MODE=json-rpc` استفاده کنید. `MODE=normal` می‌تواند باعث شود `/v1/about` سالم به نظر برسد، اما `/v1/receive/{account}` به WebSocket ارتقا پیدا نمی‌کند، بنابراین OpenClaw در حالت `auto` دریافت streaming کانتینر را انتخاب نمی‌کند.
- وقتی می‌دانید `httpUrl` به REST API مربوط به bbernhard اشاره می‌کند، `apiMode: "container"` را تنظیم کنید. وقتی می‌دانید به JSON-RPC/SSE بومی `signal-cli` اشاره می‌کند، `apiMode: "native"` را تنظیم کنید. وقتی deployment ممکن است متفاوت باشد، از `"auto"` استفاده کنید.
- دانلود پیوست در حالت کانتینر همان محدودیت‌های بایت رسانه را مانند حالت بومی رعایت می‌کند. پاسخ‌های بیش‌ازحد بزرگ وقتی سرور `Content-Length` بفرستد پیش از buffer کامل رد می‌شوند، و در غیر این صورت هنگام streaming رد می‌شوند.

## کنترل دسترسی (DMها + گروه‌ها)

DMها:

- پیش‌فرض: `channels.signal.dmPolicy = "pairing"`.
- فرستنده‌های ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ پیام‌ها تا زمان تأیید نادیده گرفته می‌شوند (کدها پس از ۱ ساعت منقضی می‌شوند).
- تأیید از طریق:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Pairing تبادل توکن پیش‌فرض برای DMهای Signal است. جزئیات: [Pairing](/fa/channels/pairing)
- فرستنده‌های فقط UUID (از `sourceUuid`) به‌صورت `uuid:<id>` در `channels.signal.allowFrom` ذخیره می‌شوند.

گروه‌ها:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` کنترل می‌کند وقتی `allowlist` تنظیم شده است کدام گروه‌ها یا فرستنده‌ها بتوانند پاسخ‌های گروهی را فعال کنند؛ ورودی‌ها می‌توانند شناسه‌های گروه Signal (خام، `group:<id>`، یا `signal:group:<id>`)، شماره‌های تلفن فرستنده، مقادیر `uuid:<id>`، یا `*` باشند.
- `channels.signal.groups["<group-id>" | "*"]` می‌تواند رفتار گروه را با `requireMention`، `tools`، و `toolsBySender` بازنویسی کند.
- برای بازنویسی‌های مخصوص هر حساب در راه‌اندازی‌های چندحسابی، از `channels.signal.accounts.<id>.groups` استفاده کنید.
- allowlist کردن یک گروه Signal از طریق `groupAllowFrom` به‌خودی‌خود gating ذکر را غیرفعال نمی‌کند. یک ورودی مشخصاً پیکربندی‌شده `channels.signal.groups["<group-id>"]` هر پیام گروه را پردازش می‌کند، مگر اینکه `requireMention=true` تنظیم شده باشد.
- نکته runtime: اگر `channels.signal` کاملاً وجود نداشته باشد، runtime برای بررسی‌های گروه به `groupPolicy="allowlist"` برمی‌گردد (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

## نحوه کارکرد (رفتار)

- حالت بومی: `signal-cli` به‌عنوان daemon اجرا می‌شود؛ gateway رویدادها را از طریق SSE می‌خواند.
- حالت کانتینر: gateway از طریق REST API ارسال می‌کند و از طریق WebSocket دریافت می‌کند.
- پیام‌های ورودی به envelope مشترک کانال normalize می‌شوند.
- پاسخ‌ها همیشه به همان شماره یا گروه برمی‌گردند.

## رسانه + محدودیت‌ها

- متن خروجی تا `channels.signal.textChunkLimit` تکه‌تکه می‌شود (پیش‌فرض ۴۰۰۰).
- تکه‌تکه‌سازی اختیاری بر اساس خط جدید: `channels.signal.chunkMode="newline"` را تنظیم کنید تا پیش از تکه‌تکه‌سازی طولی، بر اساس خطوط خالی (مرزهای پاراگراف) تقسیم شود.
- پیوست‌ها پشتیبانی می‌شوند (base64 از `signal-cli` دریافت می‌شود).
- پیوست‌های یادداشت صوتی وقتی `contentType` وجود نداشته باشد از نام فایل `signal-cli` به‌عنوان fallback برای MIME استفاده می‌کنند، بنابراین رونویسی صوتی همچنان می‌تواند یادداشت‌های صوتی AAC را دسته‌بندی کند.
- سقف رسانه پیش‌فرض: `channels.signal.mediaMaxMb` (پیش‌فرض ۸).
- برای رد کردن دانلود رسانه، از `channels.signal.ignoreAttachments` استفاده کنید.
- زمینه تاریخچه گروه از `channels.signal.historyLimit` (یا `channels.signal.accounts.*.historyLimit`) استفاده می‌کند و به `messages.groupChat.historyLimit` fallback می‌کند. برای غیرفعال‌سازی، `0` را تنظیم کنید (پیش‌فرض ۵۰).

## تایپ + رسیدهای خواندن

- **نشانگرهای تایپ**: OpenClaw سیگنال‌های تایپ را از طریق `signal-cli sendTyping` می‌فرستد و تا زمانی که پاسخ در حال اجراست آن‌ها را تازه‌سازی می‌کند.
- **رسیدهای خواندن**: وقتی `channels.signal.sendReadReceipts` برابر true باشد، OpenClaw رسیدهای خواندن را برای پیام‌های مستقیم مجاز ارسال می‌کند.
- signal-cli رسیدهای خواندن را برای گروه‌ها ارائه نمی‌کند.

## واکنش‌های وضعیت چرخه حیات

`messages.statusReactions.enabled: true` را تنظیم کنید تا Signal چرخه حیات واکنش مشترک
در صف/در حال فکر کردن/ابزار/Compaction/انجام‌شده/خطا را در نوبت‌های ورودی نشان دهد.
Signal از زمان‌سنج پیام ورودی به عنوان هدف واکنش استفاده می‌کند؛ واکنش‌های گروهی
با شناسه گروه Signal به همراه فرستنده اصلی به عنوان نویسنده هدف ارسال می‌شوند.

واکنش‌های وضعیت همچنین به یک واکنش تأیید و یک
`messages.ackReactionScope` مطابق (`direct`، `group-all`، `group-mentions`، یا `all`) نیاز دارند.
برای غیرفعال کردن واکنش‌های وضعیت Signal، `channels.signal.reactionLevel: "off"` را تنظیم کنید.
کنش `react` در ابزار پیام سخت‌گیرانه‌تر باقی می‌ماند: به
`reactionLevel: "minimal"` یا `"extensive"` نیاز دارد.

`messages.removeAckAfterReply: true` واکنش وضعیت نهایی را پس از
زمان نگهداری پیکربندی‌شده پاک می‌کند. در غیر این صورت Signal پس از
وضعیت نهایی انجام‌شده/خطا، واکنش تأیید اولیه را برمی‌گرداند.

## واکنش‌ها (ابزار پیام)

- از `message action=react` همراه با `channel=signal` استفاده کنید.
- اهداف: E.164 یا UUID فرستنده (از `uuid:<id>` در خروجی جفت‌سازی استفاده کنید؛ UUID بدون پیشوند هم کار می‌کند).
- `messageId` زمان‌سنج Signal برای پیامی است که به آن واکنش نشان می‌دهید.
- واکنش‌های گروهی به `targetAuthor` یا `targetAuthorUuid` نیاز دارند.

نمونه‌ها:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

پیکربندی:

- `channels.signal.actions.reactions`: کنش‌های واکنش را فعال/غیرفعال کنید (پیش‌فرض true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` واکنش‌های عامل را غیرفعال می‌کند (ابزار پیام `react` خطا خواهد داد).
  - `minimal`/`extensive` واکنش‌های عامل را فعال می‌کند و سطح راهنمایی را تنظیم می‌کند.
- بازنویسی‌های هر حساب: `channels.signal.accounts.<id>.actions.reactions`، `channels.signal.accounts.<id>.reactionLevel`.

## واکنش‌های تأیید

درخواست‌های تأیید اجرای Signal و Plugin از بلوک‌های مسیریابی سطح بالای `approvals.exec` و
`approvals.plugin` استفاده می‌کنند. Signal بلوک
`channels.signal.execApprovals` ندارد.

- `👍` یک بار تأیید می‌کند.
- `👎` رد می‌کند.
- وقتی درخواستی تأیید پایدار ارائه می‌دهد، از `/approve <id> allow-always` استفاده کنید.

حل واکنش تأیید به تأییدکنندگان صریح Signal از
`channels.signal.allowFrom`، `channels.signal.defaultTo`، یا فیلدهای سطح حساب مطابق نیاز دارد.
درخواست‌های تأیید اجرای مستقیم در همان گفت‌وگو همچنان می‌توانند جایگزین محلی تکراری `/approve` را
بدون تأییدکنندگان صریح پنهان کنند؛ تأییدهای گروهی بدون تأییدکننده، جایگزین محلی را قابل مشاهده نگه می‌دارند.

## اهداف تحویل (CLI/cron)

- پیام‌های مستقیم: `signal:+15551234567` (یا E.164 ساده).
- پیام‌های مستقیم UUID: `uuid:<id>` (یا UUID بدون پیشوند).
- گروه‌ها: `signal:group:<groupId>`.
- نام‌های کاربری: `username:<name>` (اگر حساب Signal شما پشتیبانی کند).

## نام‌های مستعار

وقتی برای اهداف تکرارشونده Signal نام‌های پایدار می‌خواهید، نام‌های مستعار را پیکربندی کنید.
نام‌های مستعار فقط پیکربندی سمت OpenClaw هستند؛ مخاطبان Signal را ایجاد یا ویرایش نمی‌کنند.

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
        jane: "uuid:123e4567-e89b-12d3-a456-426614174000",
        ops: "group:<groupId>",
      },
      defaultTo: "signal:me",
    },
  },
}
```

هر جا اهداف تحویل Signal پذیرفته می‌شوند، از نام‌های مستعار استفاده کنید:

```bash
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

نام‌های مستعار هر حساب، نام‌های مستعار سطح بالا را به ارث می‌برند و می‌توانند نام‌ها را اضافه یا بازنویسی کنند:

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
      },
      accounts: {
        work: {
          aliases: {
            ops: "group:<workGroupId>",
          },
        },
      },
    },
  },
}
```

`openclaw directory peers list --channel signal` و
`openclaw directory groups list --channel signal` نام‌های مستعار پیکربندی‌شده را فهرست می‌کنند. دایرکتوری
Signal مبتنی بر پیکربندی است؛ مخاطبان Signal را به صورت زنده پرس‌وجو نمی‌کند یا
حساب Signal را تغییر نمی‌دهد.

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

- Daemon در دسترس است اما پاسخی نیست: تنظیمات حساب/daemon (`httpUrl`، `account`) و حالت دریافت را بررسی کنید.
- پیام‌های مستقیم نادیده گرفته می‌شوند: فرستنده در انتظار تأیید جفت‌سازی است.
- پیام‌های گروهی نادیده گرفته می‌شوند: دروازه‌گذاری فرستنده/اشاره گروهی تحویل را مسدود می‌کند.
- خطاهای اعتبارسنجی پیکربندی پس از ویرایش‌ها: `openclaw doctor --fix` را اجرا کنید.
- Signal در عیب‌یابی وجود ندارد: تأیید کنید `channels.signal.enabled: true` است.

بررسی‌های اضافه:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

برای جریان تریاژ: [/channels/troubleshooting](/fa/channels/troubleshooting).

## نکات امنیتی

- `signal-cli` کلیدهای حساب را به صورت محلی ذخیره می‌کند (معمولاً در `~/.local/share/signal-cli/data/`).
- پیش از مهاجرت سرور یا بازسازی، از وضعیت حساب Signal پشتیبان بگیرید.
- `channels.signal.dmPolicy: "pairing"` را نگه دارید مگر اینکه صریحاً دسترسی گسترده‌تر به پیام‌های مستقیم را بخواهید.
- تأیید SMS فقط برای جریان‌های ثبت‌نام یا بازیابی لازم است، اما از دست دادن کنترل شماره/حساب می‌تواند ثبت‌نام دوباره را پیچیده کند.

## مرجع پیکربندی (Signal)

پیکربندی کامل: [پیکربندی](/fa/gateway/configuration)

گزینه‌های ارائه‌دهنده:

- `channels.signal.enabled`: راه‌اندازی کانال را فعال/غیرفعال کنید.
- `channels.signal.apiMode`: `auto | native | container` (پیش‌فرض: auto). [حالت کانتینر](#container-mode-bbernhardsignal-cli-rest-api) را ببینید.
- `channels.signal.account`: E.164 برای حساب ربات.
- `channels.signal.cliPath`: مسیر `signal-cli`.
- `channels.signal.configPath`: دایرکتوری اختیاری `signal-cli --config`.
- `channels.signal.httpUrl`: URL کامل daemon (میزبان/درگاه را بازنویسی می‌کند).
- `channels.signal.httpHost`، `channels.signal.httpPort`: اتصال daemon (پیش‌فرض 127.0.0.1:8080).
- `channels.signal.autoStart`: daemon را به صورت خودکار ایجاد کند (اگر `httpUrl` تنظیم نشده باشد، پیش‌فرض true).
- `channels.signal.startupTimeoutMs`: مهلت انتظار راه‌اندازی بر حسب ms (سقف 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: دانلود پیوست‌ها را رد کنید.
- `channels.signal.ignoreStories`: داستان‌ها را از daemon نادیده بگیرید.
- `channels.signal.sendReadReceipts`: رسیدهای خواندن را ارسال کنید.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (پیش‌فرض: pairing).
- `channels.signal.allowFrom`: فهرست مجاز پیام مستقیم (E.164 یا `uuid:<id>`). `open` به `"*"` نیاز دارد. Signal نام کاربری ندارد؛ از شناسه‌های تلفن/UUID استفاده کنید.
- `channels.signal.aliases`: نام‌های مستعار سمت OpenClaw برای اهداف تحویل پیام مستقیم یا گروه.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (پیش‌فرض: allowlist).
- `channels.signal.groupAllowFrom`: فهرست مجاز گروه؛ شناسه‌های گروه Signal (خام، `group:<id>`، یا `signal:group:<id>`)، شماره‌های E.164 فرستنده، یا مقادیر `uuid:<id>` را می‌پذیرد.
- `channels.signal.groups`: بازنویسی‌های هر گروه با کلید شناسه گروه Signal (یا `"*"`). فیلدهای پشتیبانی‌شده: `requireMention`، `tools`، `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: نسخه هر حساب از `channels.signal.groups` برای راه‌اندازی‌های چندحسابی.
- `channels.signal.accounts.<id>.aliases`: نام‌های مستعار هر حساب، ادغام‌شده با نام‌های مستعار سطح بالا.
- `channels.signal.historyLimit`: بیشترین پیام‌های گروهی برای گنجاندن به عنوان زمینه (0 غیرفعال می‌کند).
- `channels.signal.dmHistoryLimit`: حد سابقه پیام مستقیم در نوبت‌های کاربر. بازنویسی‌های هر کاربر: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: اندازه قطعه خروجی (نویسه‌ها).
- `channels.signal.chunkMode`: `length` (پیش‌فرض) یا `newline` برای تقسیم بر اساس خطوط خالی (مرزهای پاراگراف) پیش از قطعه‌بندی بر اساس طول.
- `channels.signal.mediaMaxMb`: سقف رسانه ورودی/خروجی (MB).

گزینه‌های سراسری مرتبط:

- `agents.list[].groupChat.mentionPatterns` (Signal از اشاره‌های بومی پشتیبانی نمی‌کند).
- `messages.groupChat.mentionPatterns` (جایگزین سراسری).
- `messages.responsePrefix`.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت پیام مستقیم و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و دروازه‌گذاری اشاره
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
