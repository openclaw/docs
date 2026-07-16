---
read_when:
    - راه‌اندازی پشتیبانی از Signal
    - اشکال‌زدایی ارسال/دریافت Signal
summary: پشتیبانی از Signal از طریق signal-cli (دیمون بومی یا کانتینر bbernhard)، مسیرهای راه‌اندازی و مدل شماره تلفن
title: Signal
x-i18n:
    generated_at: "2026-07-16T16:07:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3941a5f0cde97b87c46b27f2b865cf473093dad0a5a5ada06b1934466420a6ea
    source_path: channels/signal.md
    workflow: 16
---

Signal یک plugin کانال قابل دانلود است (`@openclaw/signal`). Gateway از طریق HTTP با `signal-cli` ارتباط برقرار می‌کند: یا daemon بومی (JSON-RPC + SSE) یا کانتینر [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) (REST + WebSocket). OpenClaw، libsignal را درون خود تعبیه نمی‌کند.

## مدل شماره (ابتدا این بخش را بخوانید)

- Gateway به یک **دستگاه Signal** متصل می‌شود: حساب `signal-cli`.
- اجرای ربات روی **حساب شخصی Signal شما** باعث می‌شود پیام‌های خودتان را نادیده بگیرد (محافظت در برابر حلقه).
- برای سناریوی «به ربات پیام می‌دهم و پاسخ می‌دهد»، از یک **شماره جداگانه برای ربات** استفاده کنید.

## نصب

```bash
openclaw plugins install @openclaw/signal
```

مشخصات ساده plugin ابتدا ClawHub و سپس npm را به‌عنوان گزینه جایگزین امتحان می‌کنند. با `openclaw plugins install clawhub:@openclaw/signal` یا `npm:@openclaw/signal` یک منبع را اجباری کنید. `plugins install`، plugin را ثبت و فعال می‌کند؛ نیازی به مرحله جداگانه `enable` نیست. برای قواعد عمومی نصب، [Pluginها](/fa/tools/plugin) را ببینید.

## راه‌اندازی سریع

<Steps>
  <Step title="یک شماره انتخاب کنید">
    برای ربات از یک **شماره Signal جداگانه** استفاده کنید (توصیه می‌شود).
  </Step>
  <Step title="Plugin را نصب کنید">
    ```bash
    openclaw plugins install @openclaw/signal
    ```
  </Step>
  <Step title="راه‌اندازی هدایت‌شده را اجرا کنید">
    ```bash
    openclaw channels add
    ```
    راهنما تشخیص می‌دهد که آیا `signal-cli` در `PATH` وجود دارد یا نه و در صورت نبودن، نصب آن را پیشنهاد می‌کند: در Linux x86-64، ساخت بومی رسمی GraalVM را دانلود می‌کند یا در macOS و معماری‌های دیگر از طریق Homebrew نصب می‌کند. سپس شماره ربات و مسیر `signal-cli` را درخواست می‌کند.

    برای راه‌اندازی غیرتعاملی، `openclaw channels add --channel signal` همچنین `--signal-number <e164>` را برای شماره تلفن ربات و نیز `--http-host <host>` و `--http-port <port>` را برای نقطه پایانی daemon مربوط به Signal می‌پذیرد (پیش‌فرض `127.0.0.1:8080`).

  </Step>
  <Step title="حساب را پیوند دهید یا ثبت کنید">
    - **پیوند QR (سریع‌ترین):** `signal-cli link -n "OpenClaw"`، سپس با Signal اسکن کنید. [مسیر A](#setup-path-a-link-existing-signal-account-qr) را ببینید.
    - **ثبت‌نام پیامکی:** شماره اختصاصی با کپچا و تأیید پیامکی. [مسیر B](#setup-path-b-register-dedicated-bot-number-sms-linux) را ببینید.

  </Step>
  <Step title="بررسی و جفت‌سازی کنید">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    نخستین پیام خصوصی را ارسال و جفت‌سازی را تأیید کنید: `openclaw pairing approve signal <CODE>`.
  </Step>
</Steps>

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

| فیلد        | توضیحات                                       |
| ------------ | ------------------------------------------------- |
| `account`    | شماره تلفن ربات با قالب E.164 (`+15551234567`) |
| `cliPath`    | مسیر `signal-cli` (`signal-cli` اگر در `PATH` باشد)  |
| `configPath` | پوشه پیکربندی signal-cli که به‌صورت `--config` ارسال می‌شود        |
| `dmPolicy`   | سیاست دسترسی پیام خصوصی (`pairing` توصیه می‌شود)          |
| `allowFrom`  | شماره تلفن‌ها یا مقادیر `uuid:<id>` که اجازه ارسال پیام خصوصی دارند |

پشتیبانی از چند حساب: از `channels.signal.accounts` همراه با پیکربندی هر حساب و `name` اختیاری استفاده کنید. برای الگوی مشترک، [کانال‌های چندحسابی](/fa/gateway/config-channels#multi-account-all-channels) را ببینید.

## کارکرد آن

- مسیریابی قطعی: پاسخ‌ها همیشه به Signal بازمی‌گردند.
- پیام‌های خصوصی نشست اصلی عامل را به اشتراک می‌گذارند؛ گروه‌ها مجزا هستند (`agent:<agentId>:signal:group:<groupId>`).
- به‌طور پیش‌فرض، Signal ممکن است به‌روزرسانی‌های پیکربندی فعال‌شده توسط `/config set|unset` را بنویسد (به `commands.config: true` نیاز دارد). با `channels.signal.configWrites: false` غیرفعال کنید.

## مسیر راه‌اندازی A: پیوند حساب موجود Signal ‏(QR)

1. `signal-cli` را نصب کنید (ساخت JVM یا بومی)، یا اجازه دهید `openclaw channels add` آن را برای شما نصب کند.
2. یک حساب ربات را پیوند دهید: `signal-cli link -n "OpenClaw"`، سپس کد QR را در Signal اسکن کنید.
3. Signal را پیکربندی و Gateway را راه‌اندازی کنید.

## مسیر راه‌اندازی B: ثبت شماره اختصاصی ربات (پیامک، Linux)

برای استفاده از شماره اختصاصی ربات به‌جای پیوند دادن حساب موجود برنامه Signal، از این روش استفاده کنید. جریان زیر روی Ubuntu 24 آزمایش شده است.

1. شماره‌ای تهیه کنید که بتواند پیامک دریافت کند (یا برای خطوط ثابت، تأیید صوتی). شماره اختصاصی ربات از تداخل حساب یا نشست جلوگیری می‌کند.
2. `signal-cli` را روی میزبان Gateway نصب کنید:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

اگر از ساخت JVM ‏(`signal-cli-${VERSION}.tar.gz`) استفاده می‌کنید، ابتدا یک JRE نصب کنید. `signal-cli` را به‌روز نگه دارید؛ بالادست خاطرنشان می‌کند که با تغییر APIهای سرور Signal، نسخه‌های قدیمی ممکن است از کار بیفتند.

3. شماره را ثبت و تأیید کنید:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

اگر کپچا لازم است (برای تکمیل این مرحله دسترسی به مرورگر ضروری است):

1. `https://signalcaptchas.org/registration/generate.html` را باز کنید.
2. کپچا را تکمیل کنید و هدف پیوند `signalcaptcha://...` را از "Open Signal" کپی کنید.
3. در صورت امکان، فرمان را از همان IP خارجی نشست مرورگر اجرا کنید (توکن‌های کپچا به‌سرعت منقضی می‌شوند).
4. بلافاصله ثبت و تأیید کنید:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw را پیکربندی کنید، Gateway را دوباره راه‌اندازی کنید و کانال را بررسی کنید:

```bash
# اگر Gateway را به‌عنوان سرویس systemd کاربر اجرا می‌کنید:
systemctl --user restart openclaw-gateway.service

# سپس بررسی کنید:
openclaw doctor
openclaw channels status --probe
```

5. فرستنده پیام خصوصی خود را جفت کنید:
   - هر پیامی را به شماره ربات ارسال کنید.
   - در سرور تأیید کنید: `openclaw pairing approve signal <PAIRING_CODE>`.
   - برای جلوگیری از نمایش "Unknown contact"، شماره ربات را به‌عنوان مخاطب در تلفن خود ذخیره کنید.

<Warning>
ثبت حساب یک شماره تلفن با `signal-cli` می‌تواند نشست اصلی برنامه Signal را برای آن شماره از حالت احراز هویت خارج کند. شماره اختصاصی ربات را ترجیح دهید یا برای حفظ راه‌اندازی موجود برنامه تلفن، از حالت پیوند QR استفاده کنید.
</Warning>

مراجع بالادست:

- README مربوط به `signal-cli`: `https://github.com/AsamK/signal-cli`
- جریان کپچا: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- جریان پیوند: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## حالت daemon خارجی (httpUrl)

برای مدیریت مستقیم `signal-cli` (شروع سرد کند JVM، مقداردهی اولیه کانتینر، CPUهای اشتراکی)، daemon را جداگانه اجرا و OpenClaw را به آن متصل کنید:

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

این کار ایجاد خودکار و انتظار OpenClaw هنگام راه‌اندازی را رد می‌کند. برای راه‌اندازی‌های کندی که به‌صورت خودکار ایجاد می‌شوند، `channels.signal.startupTimeoutMs` را تنظیم کنید.

## حالت کانتینر (bbernhard/signal-cli-rest-api)

به‌جای اجرای بومی `signal-cli`، از کانتینر Docker مربوط به [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) استفاده کنید که `signal-cli` را پشت یک رابط REST + WebSocket قرار می‌دهد.

الزامات:

- برای دریافت بلادرنگ پیام، کانتینر **باید** با `MODE=json-rpc` اجرا شود.
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
      apiMode: "container", // یا "auto" برای تشخیص خودکار
    },
  },
}
```

`apiMode` تعیین می‌کند OpenClaw از کدام پروتکل استفاده کند:

| مقدار         | رفتار                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (پیش‌فرض) هر دو انتقال را کاوش می‌کند؛ جریان‌سازی، دریافت WebSocket کانتینر را اعتبارسنجی می‌کند    |
| `"native"`    | اجبار signal-cli بومی (JSON-RPC در `/api/v1/rpc`، ‏SSE در `/api/v1/events`)         |
| `"container"` | اجبار کانتینر bbernhard ‏(REST در `/v2/send`، ‏WebSocket در `/v1/receive/{account}`) |

وقتی `apiMode` برابر `"auto"` باشد، OpenClaw برای جلوگیری از کاوش‌های مکرر، حالت شناسایی‌شده را برای هر URL متعلق به daemon به‌مدت 30 ثانیه در حافظه نهان نگه می‌دارد (وقتی هر دو انتقال سالم باشند، حالت بومی اولویت دارد). دریافت کانتینر تنها پس از ارتقای `/v1/receive/{account}` به WebSocket برای جریان‌سازی انتخاب می‌شود که به `MODE=json-rpc` نیاز دارد.

در مواردی که کانتینر APIهای متناظر را ارائه دهد، حالت کانتینر از همان عملیات Signal در حالت بومی پشتیبانی می‌کند: ارسال، دریافت، پیوست‌ها، نشانگرهای تایپ، رسیدهای خوانده‌شدن/دیده‌شدن، واکنش‌ها، گروه‌ها و متن سبک‌دار. OpenClaw فراخوانی‌های RPC بومی Signal را به payloadهای REST کانتینر تبدیل می‌کند، از جمله شناسه‌های گروه `group.{base64(internal_id)}` و `text_mode: "styled"` برای متن قالب‌بندی‌شده.

نکات عملیاتی:

- در حالت کانتینر از `autoStart: false` استفاده کنید؛ وقتی `apiMode: "container"` انتخاب شده است، OpenClaw نباید daemon بومی ایجاد کند.
- برای دریافت از `MODE=json-rpc` استفاده کنید. `MODE=normal` می‌تواند باعث شود `/v1/about` سالم به نظر برسد، اما `/v1/receive/{account}` به WebSocket ارتقا نمی‌یابد؛ بنابراین OpenClaw در حالت `auto` جریان دریافت کانتینر را انتخاب نمی‌کند.
- وقتی `httpUrl` به REST API مربوط به bbernhard اشاره دارد، `apiMode: "container"` را تنظیم کنید؛ وقتی به JSON-RPC/SSE بومی `signal-cli` اشاره دارد، `"native"` را تنظیم کنید؛ و وقتی استقرار ممکن است متفاوت باشد، `"auto"` را تنظیم کنید.
- دانلود پیوست‌ها در حالت کانتینر همان محدودیت‌های بایتی رسانه در حالت بومی را رعایت می‌کند. وقتی سرور `Content-Length` را ارسال کند، پاسخ‌های بیش‌ازحد بزرگ پیش از ذخیره کامل در بافر رد می‌شوند؛ در غیر این صورت، هنگام جریان‌سازی رد می‌شوند.

## کنترل دسترسی (پیام‌های خصوصی + گروه‌ها)

پیام‌های خصوصی:

- پیش‌فرض: `channels.signal.dmPolicy = "pairing"`.
- فرستندگان ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ پیام‌ها تا زمان تأیید نادیده گرفته می‌شوند (کدها پس از 1 ساعت منقضی می‌شوند).
- با `openclaw pairing list signal` و `openclaw pairing approve signal <CODE>` تأیید کنید.
- جفت‌سازی، تبادل توکن پیش‌فرض برای پیام‌های خصوصی Signal است. جزئیات: [جفت‌سازی](/fa/channels/pairing)
- فرستندگان صرفاً دارای UUID (از `sourceUuid`) در `channels.signal.allowFrom` به‌صورت `uuid:<id>` ذخیره می‌شوند.

گروه‌ها:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- وقتی `allowlist` تنظیم شده باشد، `channels.signal.groupAllowFrom` تعیین می‌کند کدام گروه‌ها یا فرستندگان می‌توانند پاسخ‌های گروهی را فعال کنند؛ ورودی‌ها می‌توانند شناسه‌های گروه Signal (خام، `group:<id>` یا `signal:group:<id>`)، شماره تلفن فرستندگان، مقادیر `uuid:<id>` یا `*` باشند.
- `channels.signal.groups["<group-id>" | "*"]` می‌تواند رفتار گروه را با `requireMention`، ‏`tools` و `toolsBySender` بازنویسی کند.
- برای بازنویسی‌های هر حساب در راه‌اندازی‌های چندحسابی، از `channels.signal.accounts.<id>.groups` استفاده کنید.
- افزودن یک گروه Signal به فهرست مجاز از طریق `groupAllowFrom`، به‌خودی‌خود الزام اشاره را غیرفعال نمی‌کند. یک ورودی `channels.signal.groups["<group-id>"]` که به‌طور مشخص پیکربندی شده باشد، هر پیام گروهی را پردازش می‌کند، مگر اینکه `requireMention=true` تنظیم شده باشد.
- با `requireMention=true`، اشاره‌های بومی @ در Signal با استفاده از فراداده ساخت‌یافته اشاره و در برابر شماره تلفن حساب ربات یا `accountUuid` تطبیق داده می‌شوند. `mentionPatterns` پیکربندی‌شده همچنان گزینه جایگزین متن ساده باقی می‌مانند.
- نکته زمان اجرا: اگر `channels.signal` کاملاً وجود نداشته باشد، زمان اجرا برای بررسی‌های گروهی به `groupPolicy="allowlist"` بازمی‌گردد (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

گروه مشروط به اشاره با زمینه محدود:

```json5
{
  channels: {
    signal: {
      account: "+15551234567",
      accountUuid: "bot-signal-uuid",
      groupPolicy: "allowlist",
      groupAllowFrom: ["group:<signal-group-id>"],
      historyLimit: 8,
      groups: {
        "<signal-group-id>": { requireMention: true },
      },
    },
  },
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
}
```

پیام‌های مجاز گروه که به ربات اشاره نمی‌کنند، بی‌پاسخ می‌مانند و فقط در پنجره محدود تاریخچه در انتظار نگه‌داری می‌شوند. هنگامی که بعداً یک @mention بومی یا اشاره متنی جایگزین، ربات را فعال کند، OpenClaw این زمینه اخیر را لحاظ می‌کند و به همان گروه پاسخ می‌دهد. بدنه پیوست‌هایی که از آن‌ها صرف‌نظر شده است دانلود نمی‌شود؛ ممکن است آن‌ها فقط به‌صورت جای‌نگهدارهای فشرده رسانه در زمینه در انتظار ظاهر شوند.

## نحوه عملکرد (رفتار)

- حالت بومی: `signal-cli` به‌صورت یک دیمون اجرا می‌شود؛ Gateway رویدادها را از طریق SSE می‌خواند.
- حالت کانتینر: Gateway از طریق REST API ارسال و از طریق WebSocket دریافت می‌کند.
- پیام‌های ورودی در قالب پوشش مشترک کانال عادی‌سازی می‌شوند.
- پاسخ‌ها همیشه به همان شماره یا گروه بازگردانده می‌شوند.
- پاسخ به پیام‌های ورودی، هنگامی که بک‌اند زمان‌مهر و نویسنده پیام ورودی را بپذیرد، شامل فراداده نقل‌قول بومی Signal است؛ اگر فراداده نقل‌قول موجود نباشد یا رد شود، OpenClaw پاسخ را به‌صورت یک پیام عادی ارسال می‌کند.
- استفاده از نقل‌قول بومی را با `channels.signal.replyToMode = off | first | all | batched`، یا برای بازنویسی بر اساس نوع گفت‌وگو با `channels.signal.replyToModeByChatType.direct/group` پیکربندی کنید. مقادیر سطح حساب در `channels.signal.accounts.<id>` اولویت دارند.

## رسانه + محدودیت‌ها

- متن خروجی بر اساس `channels.signal.textChunkLimit` به قطعه‌ها تقسیم می‌شود (پیش‌فرض 4000).
- تقسیم اختیاری بر اساس خط جدید: `channels.signal.streaming.chunkMode="newline"` را تنظیم کنید تا پیش از تقسیم بر اساس طول، متن در خطوط خالی (مرز پاراگراف‌ها) تقسیم شود.
- پیوست‌ها پشتیبانی می‌شوند (base64 از `signal-cli` دریافت می‌شود).
- هنگامی که `contentType` موجود نیست، پیوست‌های یادداشت صوتی از نام فایل `signal-cli` به‌عنوان جایگزین MIME استفاده می‌کنند تا رونویسی صوتی همچنان بتواند یادداشت‌های صوتی AAC را طبقه‌بندی کند.
- سقف پیش‌فرض رسانه: `channels.signal.mediaMaxMb` (پیش‌فرض 8).
- برای صرف‌نظر کردن از دانلود رسانه از `channels.signal.ignoreAttachments` استفاده کنید.
- زمینه تاریخچه گروه از `channels.signal.historyLimit` (یا `channels.signal.accounts.*.historyLimit`) استفاده می‌کند و در صورت نبود آن به `messages.groupChat.historyLimit` برمی‌گردد. برای غیرفعال‌سازی، `0` را تنظیم کنید (پیش‌فرض 50).

## نشانگر تایپ + رسید خواندن

- **نشانگرهای تایپ**: OpenClaw سیگنال‌های تایپ را از طریق `signal-cli sendTyping` ارسال می‌کند و تا زمانی که پاسخ در حال اجراست، آن‌ها را تازه‌سازی می‌کند.
- **رسیدهای خواندن**: هنگامی که `channels.signal.sendReadReceipts` برابر true باشد، OpenClaw رسیدهای خواندن را برای پیام‌های خصوصی مجاز ارسال می‌کند.
- `signal-cli` رسید خواندن را برای گروه‌ها ارائه نمی‌کند.

## واکنش‌های وضعیت چرخه حیات

`messages.statusReactions.enabled: true` را تنظیم کنید تا Signal چرخه مشترک واکنش‌های در صف/در حال فکر/ابزار/Compaction/انجام‌شده/خطا را برای نوبت‌های ورودی نمایش دهد. Signal از زمان‌مهر پیام ورودی به‌عنوان هدف واکنش استفاده می‌کند؛ واکنش‌های گروه با شناسه گروه Signal و فرستنده اصلی به‌عنوان نویسنده هدف ارسال می‌شوند.

واکنش‌های وضعیت همچنین به یک واکنش تأیید و یک `messages.ackReactionScope` منطبق (`direct`، `group-all`، `group-mentions` یا `all`) نیاز دارند. برای غیرفعال کردن واکنش‌های وضعیت Signal، `channels.signal.reactionLevel: "off"` را تنظیم کنید.

`messages.removeAckAfterReply: true` واکنش وضعیت نهایی را پس از زمان نگه‌داری پیکربندی‌شده پاک می‌کند. در غیر این صورت، Signal پس از وضعیت نهایی انجام‌شده/خطا، واکنش تأیید اولیه را بازیابی می‌کند.

## واکنش‌ها (ابزار پیام)

از `message action=react` همراه با `channel=signal` استفاده کنید.

- هدف‌ها: E.164 یا UUID فرستنده (از `uuid:<id>` در خروجی جفت‌سازی استفاده کنید؛ UUID بدون پیشوند نیز کار می‌کند).
- `messageId` زمان‌مهر Signal برای پیامی است که به آن واکنش نشان می‌دهید.
- واکنش‌های گروه به `targetAuthor` یا `targetAuthorUuid` نیاز دارند.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

پیکربندی:

- `channels.signal.actions.reactions`: فعال/غیرفعال کردن کنش‌های واکنش (پیش‌فرض true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (پیش‌فرض `minimal`).
  - `off`/`ack` واکنش‌های عامل را غیرفعال می‌کند (ابزار پیام `react` خطا می‌دهد).
  - `minimal`/`extensive` واکنش‌های عامل را فعال و سطح راهنمایی را تنظیم می‌کند.
- بازنویسی‌های هر حساب: `channels.signal.accounts.<id>.actions.reactions`، `channels.signal.accounts.<id>.reactionLevel`.

## واکنش‌های تأیید

درخواست‌های تأیید اجرای Signal و Plugin از بلوک‌های مسیریابی سطح‌بالای `approvals.exec` و `approvals.plugin` استفاده می‌کنند. Signal بلوک `channels.signal.execApprovals` ندارد.

- `👍` یک‌بار تأیید می‌کند.
- `👎` رد می‌کند.
- هنگامی که درخواستی تأیید دائمی ارائه می‌دهد، از `/approve <id> allow-always` استفاده کنید.

تفکیک واکنش تأیید به تأییدکنندگان صریح Signal از `channels.signal.allowFrom`، `channels.signal.defaultTo` یا فیلدهای منطبق سطح حساب نیاز دارد. درخواست‌های تأیید اجرای مستقیم در همان گفت‌وگو همچنان می‌توانند جایگزین محلی تکراری `/approve` را بدون تأییدکنندگان صریح پنهان کنند؛ در تأییدهای گروهی بدون تأییدکننده، جایگزین محلی قابل مشاهده می‌ماند.

## هدف‌های تحویل (CLI/Cron)

- پیام‌های خصوصی: `signal:+15551234567` (یا E.164 ساده).
- پیام‌های خصوصی UUID: `uuid:<id>` (یا UUID بدون پیشوند).
- گروه‌ها: `signal:group:<groupId>`.
- نام‌های کاربری: `username:<name>` (اگر حساب Signal شما پشتیبانی کند).

## نام‌های مستعار

نام‌های مستعار را برای نام‌های پایدار در هدف‌های تکرارشونده Signal پیکربندی کنید. نام‌های مستعار فقط پیکربندی سمت OpenClaw هستند؛ آن‌ها مخاطبان Signal را ایجاد یا ویرایش نمی‌کنند.

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

در هر جایی که هدف‌های تحویل Signal پذیرفته می‌شوند، از نام‌های مستعار استفاده کنید:

```bash
openclaw message send --channel signal --target signal:ops --message "استقرار کامل شد"
```

نام‌های مستعار هر حساب، نام‌های مستعار سطح‌بالا را به ارث می‌برند و می‌توانند نام‌هایی را اضافه یا بازنویسی کنند:

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

`openclaw directory peers list --channel signal` و `openclaw directory groups list --channel signal` نام‌های مستعار پیکربندی‌شده را فهرست می‌کنند. فهرست Signal مبتنی بر پیکربندی است؛ مخاطبان Signal را به‌صورت زنده واکشی نمی‌کند و حساب Signal را تغییر نمی‌دهد.

## عیب‌یابی

ابتدا این مراحل را اجرا کنید:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

سپس در صورت نیاز، وضعیت جفت‌سازی پیام خصوصی را تأیید کنید:

```bash
openclaw pairing list signal
```

خرابی‌های رایج:

- دیمون در دسترس است اما پاسخی وجود ندارد: تنظیمات حساب/دیمون (`httpUrl`، `account`) و حالت دریافت را بررسی کنید.
- پیام‌های خصوصی نادیده گرفته می‌شوند: فرستنده در انتظار تأیید جفت‌سازی است.
- پیام‌های گروه نادیده گرفته می‌شوند: محدودسازی فرستنده/اشاره گروه، تحویل را مسدود می‌کند.
- خطاهای اعتبارسنجی پیکربندی پس از ویرایش: `openclaw doctor --fix` را اجرا کنید.
- Signal در عیب‌یابی وجود ندارد: `channels.signal.enabled: true` را تأیید کنید.

بررسی‌های بیشتر:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

برای روند بررسی اولیه: [عیب‌یابی کانال‌ها](/fa/channels/troubleshooting).

## نکات امنیتی

- `signal-cli` کلیدهای حساب را به‌صورت محلی ذخیره می‌کند (معمولاً `~/.local/share/signal-cli/data/`).
- پیش از انتقال سرور یا بازسازی، از وضعیت حساب Signal نسخه پشتیبان تهیه کنید.
- `channels.signal.dmPolicy: "pairing"` را حفظ کنید، مگر اینکه صراحتاً دسترسی گسترده‌تر به پیام‌های خصوصی را بخواهید.
- تأیید پیامکی فقط برای فرایندهای ثبت‌نام یا بازیابی لازم است، اما از دست دادن کنترل شماره/حساب می‌تواند ثبت‌نام مجدد را دشوار کند.

## مرجع پیکربندی (Signal)

پیکربندی کامل: [پیکربندی](/fa/gateway/configuration)

گزینه‌های ارائه‌دهنده:

- `channels.signal.enabled`: فعال/غیرفعال کردن راه‌اندازی کانال.
- `channels.signal.apiMode`: `auto | native | container` (پیش‌فرض: خودکار). [حالت کانتینر](#container-mode-bbernhardsignal-cli-rest-api) را ببینید.
- `channels.signal.account`: E.164 حساب ربات.
- `channels.signal.accountUuid`: UUID اختیاری حساب ربات برای تشخیص @mention بومی و محافظت در برابر حلقه.
- `channels.signal.cliPath`: مسیر `signal-cli`.
- `channels.signal.configPath`: پوشه اختیاری `signal-cli --config`.
- `channels.signal.httpUrl`: نشانی کامل دیمون (میزبان/درگاه را بازنویسی می‌کند).
- `channels.signal.httpHost`، `channels.signal.httpPort`: اتصال دیمون (پیش‌فرض `127.0.0.1:8080`).
- `channels.signal.autoStart`: راه‌اندازی خودکار دیمون (اگر `httpUrl` تنظیم نشده باشد، پیش‌فرض true است).
- `channels.signal.startupTimeoutMs`: مهلت انتظار راه‌اندازی بر حسب ms (حداقل 1000، سقف 120000؛ پیش‌فرض 30000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: صرف‌نظر کردن از دانلود پیوست‌ها.
- `channels.signal.ignoreStories`: نادیده گرفتن استوری‌های دیمون.
- `channels.signal.sendReadReceipts`: ارسال رسیدهای خواندن.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (پیش‌فرض: جفت‌سازی).
- `channels.signal.allowFrom`: فهرست مجاز پیام خصوصی (E.164 یا `uuid:<id>`). `open` به `"*"` نیاز دارد. Signal نام کاربری ندارد؛ از شناسه تلفن/UUID استفاده کنید.
- `channels.signal.aliases`: نام‌های مستعار سمت OpenClaw برای هدف‌های تحویل پیام خصوصی یا گروه.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (پیش‌فرض: فهرست مجاز).
- `channels.signal.groupAllowFrom`: فهرست مجاز گروه؛ شناسه‌های گروه Signal (خام، `group:<id>` یا `signal:group:<id>`)‌، شماره‌های E.164 فرستنده یا مقادیر `uuid:<id>` را می‌پذیرد.
- `channels.signal.groups`: بازنویسی‌های هر گروه با کلید شناسه گروه Signal (یا `"*"`). فیلدهای پشتیبانی‌شده: `requireMention`، `tools`، `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: نسخه هر حساب از `channels.signal.groups` برای پیکربندی‌های چندحسابی.
- `channels.signal.accounts.<id>.aliases`: نام‌های مستعار هر حساب که با نام‌های مستعار سطح‌بالا ادغام می‌شوند.
- `channels.signal.replyToMode`: حالت نقل‌قول پاسخ بومی، `off | first | all | batched` (پیش‌فرض: `all`).
- `channels.signal.replyToModeByChatType.direct`، `channels.signal.replyToModeByChatType.group`: بازنویسی‌های نقل‌قول پاسخ بومی بر اساس نوع گفت‌وگو.
- `channels.signal.accounts.<id>.replyToMode`، `channels.signal.accounts.<id>.replyToModeByChatType.direct`، `channels.signal.accounts.<id>.replyToModeByChatType.group`: بازنویسی‌های نقل‌قول پاسخ هر حساب.
- `channels.signal.historyLimit`: حداکثر تعداد پیام‌های گروه که به‌عنوان زمینه لحاظ می‌شوند (0 غیرفعال می‌کند).
- `channels.signal.dmHistoryLimit`: محدودیت تاریخچه پیام خصوصی بر حسب نوبت‌های کاربر. بازنویسی‌های هر کاربر: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: اندازه قطعه خروجی بر حسب نویسه (پیش‌فرض 4000).
- `channels.signal.streaming.chunkMode`: `length` (پیش‌فرض) یا `newline` برای تقسیم در خطوط خالی (مرز پاراگراف‌ها) پیش از تقسیم بر اساس طول.
- `channels.signal.mediaMaxMb`: سقف رسانه ورودی/خروجی بر حسب MB (پیش‌فرض 8).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (پیش‌فرض `minimal`). [واکنش‌ها](#reactions-message-tool) را ببینید.
- `channels.signal.reactionNotifications`: `off | own | all | allowlist` (پیش‌فرض `own`) - زمانی که عامل از واکنش‌های ورودی دیگران مطلع می‌شود.
- `channels.signal.reactionAllowlist`: فرستندگانی که واکنش‌هایشان هنگام `reactionNotifications: "allowlist"` عامل را مطلع می‌کند.
- `channels.signal.streaming.block.enabled`، `channels.signal.streaming.block.coalesce`: کنترل‌های استریم حالت بلوکی مشترک میان کانال‌ها. [استریم](/fa/concepts/streaming) را ببینید.

گزینه‌های سراسری مرتبط:

- `agents.list[].groupChat.mentionPatterns` (جایگزین متن ساده؛ اشاره‌های بومی @ در Signal هنگامی از فرادادهٔ ساختاریافته شناسایی می‌شوند که هویت حساب ربات پیکربندی شده باشد).
- `messages.groupChat.mentionPatterns` (جایگزین سراسری).
- `messages.responsePrefix`.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) - همهٔ کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) - احراز هویت پیام خصوصی و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) - رفتار گفت‌وگوی گروهی و کنترل بر اساس اشاره
- [مسیریابی کانال](/fa/channels/channel-routing) - مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) - مدل دسترسی و مقاوم‌سازی
