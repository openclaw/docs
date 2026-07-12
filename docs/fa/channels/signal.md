---
read_when:
    - راه‌اندازی پشتیبانی Signal
    - اشکال‌زدایی ارسال/دریافت Signal
summary: پشتیبانی Signal از طریق signal-cli (سرویس بومی یا کانتینر bbernhard)، مسیرهای راه‌اندازی و مدل شماره تلفن
title: Signal
x-i18n:
    generated_at: "2026-07-12T09:36:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: db2497d0d6dcdc61cf9f7388929f9ee107602c9ed97bd248e20e67519e878b8b
    source_path: channels/signal.md
    workflow: 16
---

Signal یک Plugin کانال قابل دانلود است (`@openclaw/signal`). Gateway از طریق HTTP با `signal-cli` ارتباط برقرار می‌کند: یا دیمن بومی (JSON-RPC + SSE) یا کانتینر [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) (REST + WebSocket). OpenClaw کتابخانهٔ libsignal را در خود تعبیه نمی‌کند.

## مدل شماره (ابتدا این بخش را بخوانید)

- Gateway به یک **دستگاه Signal** متصل می‌شود: حساب `signal-cli`.
- اجرای ربات روی **حساب شخصی Signal شما** باعث می‌شود پیام‌های خودتان را نادیده بگیرد (محافظت در برابر حلقه).
- برای حالت «من به ربات پیام می‌دهم و پاسخ می‌دهد»، از یک **شمارهٔ جداگانه برای ربات** استفاده کنید.

## نصب

```bash
openclaw plugins install @openclaw/signal
```

مشخصات Plugin بدون پیشوند ابتدا ClawHub را امتحان می‌کنند و سپس به npm بازمی‌گردند. برای اجبار یک منبع، از `openclaw plugins install clawhub:@openclaw/signal` یا `npm:@openclaw/signal` استفاده کنید. `plugins install`، Plugin را ثبت و فعال می‌کند؛ به مرحلهٔ جداگانهٔ `enable` نیازی نیست. برای قواعد عمومی نصب، [Pluginها](/fa/tools/plugin) را ببینید.

## راه‌اندازی سریع

<Steps>
  <Step title="انتخاب شماره">
    از یک **شمارهٔ جداگانهٔ Signal** برای ربات استفاده کنید (توصیه می‌شود).
  </Step>
  <Step title="نصب Plugin">
    ```bash
    openclaw plugins install @openclaw/signal
    ```
  </Step>
  <Step title="اجرای راه‌اندازی هدایت‌شده">
    ```bash
    openclaw channels add
    ```
    راهنما تشخیص می‌دهد که آیا `signal-cli` در `PATH` قرار دارد و اگر موجود نباشد، نصب آن را پیشنهاد می‌کند: در Linux x86-64 ساخت بومی رسمی GraalVM را دانلود می‌کند، یا در macOS و معماری‌های دیگر آن را از طریق Homebrew نصب می‌کند. سپس شمارهٔ ربات و مسیر `signal-cli` را درخواست می‌کند.
  </Step>
  <Step title="پیوند یا ثبت حساب">
    - **پیوند QR (سریع‌ترین):** `signal-cli link -n "OpenClaw"`، سپس با Signal اسکن کنید. [مسیر A](#setup-path-a-link-existing-signal-account-qr) را ببینید.
    - **ثبت‌نام پیامکی:** شمارهٔ اختصاصی همراه با کپچا و تأیید پیامکی. [مسیر B](#setup-path-b-register-dedicated-bot-number-sms-linux) را ببینید.

  </Step>
  <Step title="بررسی و جفت‌سازی">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    نخستین پیام مستقیم را ارسال و جفت‌سازی را تأیید کنید: `openclaw pairing approve signal <CODE>`.
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

| فیلد         | توضیحات                                                     |
| ------------ | ----------------------------------------------------------- |
| `account`    | شماره‌تلفن ربات با قالب E.164 (`+15551234567`)              |
| `cliPath`    | مسیر `signal-cli` (اگر در `PATH` باشد، `signal-cli`)         |
| `configPath` | پوشهٔ پیکربندی signal-cli که به‌صورت `--config` ارسال می‌شود |
| `dmPolicy`   | سیاست دسترسی پیام مستقیم (`pairing` توصیه می‌شود)            |
| `allowFrom`  | شماره‌تلفن‌ها یا مقادیر `uuid:<id>` مجاز به ارسال پیام مستقیم |

پشتیبانی از چند حساب: از `channels.signal.accounts` همراه با پیکربندی مختص هر حساب و `name` اختیاری استفاده کنید. برای الگوی مشترک، [کانال‌های چندحسابی](/fa/gateway/config-channels#multi-account-all-channels) را ببینید.

## چیستی آن

- مسیریابی قطعی: پاسخ‌ها همیشه به Signal بازمی‌گردند.
- پیام‌های مستقیم نشست اصلی عامل را به‌اشتراک می‌گذارند؛ گروه‌ها مجزا هستند (`agent:<agentId>:signal:group:<groupId>`).
- به‌طور پیش‌فرض، Signal می‌تواند به‌روزرسانی‌های پیکربندی ناشی از `/config set|unset` را بنویسد (به `commands.config: true` نیاز دارد). با `channels.signal.configWrites: false` غیرفعالش کنید.

## مسیر راه‌اندازی A: پیوند حساب موجود Signal ‏(QR)

1. `signal-cli` را نصب کنید (ساخت JVM یا بومی)، یا اجازه دهید `openclaw channels add` آن را برایتان نصب کند.
2. یک حساب ربات را پیوند دهید: `signal-cli link -n "OpenClaw"`، سپس کد QR را در Signal اسکن کنید.
3. Signal را پیکربندی و Gateway را راه‌اندازی کنید.

## مسیر راه‌اندازی B: ثبت شمارهٔ اختصاصی ربات (پیامک، Linux)

از این روش برای یک شمارهٔ اختصاصی ربات به‌جای پیوند حساب موجود برنامهٔ Signal استفاده کنید. جریان زیر روی Ubuntu 24 آزمایش شده است.

1. شماره‌ای تهیه کنید که بتواند پیامک دریافت کند (یا برای تلفن ثابت، تأیید صوتی). شمارهٔ اختصاصی ربات از تعارض حساب/نشست جلوگیری می‌کند.
2. `signal-cli` را روی میزبان Gateway نصب کنید:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

اگر از ساخت JVM (`signal-cli-${VERSION}.tar.gz`) استفاده می‌کنید، ابتدا یک JRE نصب کنید. `signal-cli` را به‌روز نگه دارید؛ بالادست اشاره می‌کند که با تغییر APIهای سرور Signal، نسخه‌های قدیمی ممکن است از کار بیفتند.

3. شماره را ثبت و تأیید کنید:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

اگر کپچا لازم است (برای تکمیل این مرحله دسترسی به مرورگر ضروری است):

1. `https://signalcaptchas.org/registration/generate.html` را باز کنید.
2. کپچا را تکمیل و مقصد پیوند `signalcaptcha://...` را از "Open Signal" کپی کنید.
3. در صورت امکان، فرمان را از همان IP خارجی نشست مرورگر اجرا کنید (توکن‌های کپچا به‌سرعت منقضی می‌شوند).
4. بلافاصله ثبت‌نام و تأیید کنید:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw را پیکربندی کنید، Gateway را از نو راه‌اندازی کنید و کانال را بررسی کنید:

```bash
# اگر Gateway را به‌عنوان سرویس systemd کاربر اجرا می‌کنید:
systemctl --user restart openclaw-gateway.service

# سپس بررسی کنید:
openclaw doctor
openclaw channels status --probe
```

5. فرستندهٔ پیام مستقیم خود را جفت کنید:
   - هر پیامی را به شمارهٔ ربات ارسال کنید.
   - روی سرور تأیید کنید: `openclaw pairing approve signal <PAIRING_CODE>`.
   - برای جلوگیری از نمایش "Unknown contact"، شمارهٔ ربات را به‌عنوان مخاطب در تلفن خود ذخیره کنید.

<Warning>
ثبت حساب یک شماره‌تلفن با `signal-cli` ممکن است احراز هویت نشست اصلی برنامهٔ Signal آن شماره را باطل کند. شمارهٔ اختصاصی ربات را ترجیح دهید، یا برای حفظ راه‌اندازی فعلی برنامهٔ تلفن خود از حالت پیوند QR استفاده کنید.
</Warning>

مراجع بالادست:

- راهنمای `signal-cli`: `https://github.com/AsamK/signal-cli`
- جریان کپچا: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- جریان پیوند: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## حالت دیمن خارجی (httpUrl)

برای مدیریت مستقل `signal-cli` (شروع سرد و کند JVM، مقداردهی اولیهٔ کانتینر، پردازنده‌های مشترک)، دیمن را جداگانه اجرا و OpenClaw را به آن متصل کنید:

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

این کار ایجاد خودکار فرایند و انتظار OpenClaw هنگام راه‌اندازی را رد می‌کند. برای شروع‌های کندی که به‌صورت خودکار ایجاد می‌شوند، `channels.signal.startupTimeoutMs` را تنظیم کنید.

## حالت کانتینر (bbernhard/signal-cli-rest-api)

به‌جای اجرای بومی `signal-cli`، از کانتینر Docker‏ [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) استفاده کنید که `signal-cli` را پشت یک رابط REST + WebSocket قرار می‌دهد.

الزامات:

- برای دریافت بی‌درنگ پیام، کانتینر **باید** با `MODE=json-rpc` اجرا شود.
- پیش از اتصال OpenClaw، حساب Signal خود را داخل کانتینر ثبت یا پیوند دهید.

نمونهٔ سرویس `docker-compose.yml`:

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

| مقدار         | رفتار                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `"auto"`      | (پیش‌فرض) هر دو انتقال را می‌آزماید؛ پخش جریانی دریافت WebSocket کانتینر را اعتبارسنجی می‌کند     |
| `"native"`    | اجبار signal-cli بومی (JSON-RPC در `/api/v1/rpc` و SSE در `/api/v1/events`)                       |
| `"container"` | اجبار کانتینر bbernhard ‏(REST در `/v2/send` و WebSocket در `/v1/receive/{account}`)              |

وقتی `apiMode` برابر با `"auto"` باشد، OpenClaw برای جلوگیری از آزمون‌های تکراری، حالت تشخیص‌داده‌شده را برای هر نشانی دیمن به‌مدت ۳۰ ثانیه در حافظهٔ نهان نگه می‌دارد (اگر هر دو انتقال سالم باشند، حالت بومی اولویت دارد). دریافت کانتینری تنها پس از ارتقای `/v1/receive/{account}` به WebSocket برای پخش جریانی انتخاب می‌شود که به `MODE=json-rpc` نیاز دارد.

حالت کانتینر، در مواردی که کانتینر APIهای متناظر را ارائه می‌دهد، از همان عملیات Signal در حالت بومی پشتیبانی می‌کند: ارسال، دریافت، پیوست‌ها، نشانگرهای تایپ، رسیدهای خواندن/مشاهده، واکنش‌ها، گروه‌ها و متن سبک‌بندی‌شده. OpenClaw فراخوانی‌های RPC بومی Signal را به بارهای REST کانتینر تبدیل می‌کند، از جمله شناسه‌های گروه `group.{base64(internal_id)}` و `text_mode: "styled"` برای متن قالب‌بندی‌شده.

نکات عملیاتی:

- در حالت کانتینر از `autoStart: false` استفاده کنید؛ هنگامی که `apiMode: "container"` انتخاب شده است، OpenClaw نباید یک دیمن بومی ایجاد کند.
- برای دریافت از `MODE=json-rpc` استفاده کنید. `MODE=normal` ممکن است `/v1/about` را سالم نشان دهد، اما `/v1/receive/{account}` به WebSocket ارتقا نمی‌یابد؛ بنابراین OpenClaw در حالت `auto` پخش جریانی دریافت کانتینر را انتخاب نمی‌کند.
- وقتی `httpUrl` به REST API‏ bbernhard اشاره دارد، `apiMode: "container"` را تنظیم کنید؛ وقتی به JSON-RPC/SSE بومی `signal-cli` اشاره دارد، `"native"` را تنظیم کنید؛ و وقتی استقرار ممکن است متفاوت باشد، از `"auto"` استفاده کنید.
- دانلود پیوست‌ها در حالت کانتینر از همان محدودیت‌های بایتی رسانه در حالت بومی پیروی می‌کند. اگر سرور `Content-Length` را ارسال کند، پاسخ‌های بیش‌ازحد بزرگ پیش از قرارگرفتن کامل در بافر رد می‌شوند؛ در غیر این صورت، هنگام پخش جریانی رد می‌شوند.

## کنترل دسترسی (پیام‌های مستقیم + گروه‌ها)

پیام‌های مستقیم:

- پیش‌فرض: `channels.signal.dmPolicy = "pairing"`.
- فرستندگان ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ پیام‌ها تا زمان تأیید نادیده گرفته می‌شوند (کدها پس از ۱ ساعت منقضی می‌شوند).
- از طریق `openclaw pairing list signal` و `openclaw pairing approve signal <CODE>` تأیید کنید.
- جفت‌سازی، تبادل توکن پیش‌فرض برای پیام‌های مستقیم Signal است. جزئیات: [جفت‌سازی](/fa/channels/pairing)
- فرستندگانی که فقط UUID دارند (از `sourceUuid`) به‌شکل `uuid:<id>` در `channels.signal.allowFrom` ذخیره می‌شوند.

گروه‌ها:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- وقتی `allowlist` تنظیم شده باشد، `channels.signal.groupAllowFrom` کنترل می‌کند کدام گروه‌ها یا فرستندگان می‌توانند پاسخ‌های گروهی را فعال کنند؛ ورودی‌ها می‌توانند شناسه‌های گروه Signal (خام، `group:<id>` یا `signal:group:<id>`)، شماره‌تلفن فرستنده، مقادیر `uuid:<id>` یا `*` باشند.
- `channels.signal.groups["<group-id>" | "*"]` می‌تواند رفتار گروه را با `requireMention`، `tools` و `toolsBySender` بازنویسی کند.
- برای بازنویسی‌های مختص هر حساب در راه‌اندازی‌های چندحسابی، از `channels.signal.accounts.<id>.groups` استفاده کنید.
- قراردادن یک گروه در فهرست مجاز از طریق `groupAllowFrom` به‌خودی‌خود الزام اشاره را غیرفعال نمی‌کند. ورودی مشخصاً پیکربندی‌شدهٔ `channels.signal.groups["<group-id>"]` همهٔ پیام‌های گروه را پردازش می‌کند، مگر آنکه `requireMention: true` صراحتاً تنظیم شده باشد.
- نکتهٔ زمان اجرا: اگر `channels.signal` کاملاً وجود نداشته باشد، زمان اجرا برای بررسی گروه‌ها به `groupPolicy="allowlist"` بازمی‌گردد (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

## نحوهٔ کار (رفتار)

- حالت بومی: `signal-cli` به‌صورت دیمن اجرا می‌شود؛ Gateway رویدادها را از طریق SSE می‌خواند.
- حالت کانتینر: Gateway از طریق REST API ارسال و از طریق WebSocket دریافت می‌کند.
- پیام‌های ورودی به پوشش مشترک کانال نرمال‌سازی می‌شوند.
- پاسخ‌ها همیشه به همان شماره یا گروه بازمی‌گردند.
- پاسخ به پیام‌های ورودی، هنگامی که پشتیبان زمان‌مهر و نویسندهٔ پیام ورودی را بپذیرد، شامل فرادادهٔ نقل‌قول بومی Signal است؛ اگر فرادادهٔ نقل‌قول موجود نباشد یا رد شود، OpenClaw پاسخ را به‌صورت پیام عادی ارسال می‌کند.
- استفاده از نقل‌قول بومی را با `channels.signal.replyToMode = off | first | all | batched` یا برای بازنویسی مختص نوع گفتگو با `channels.signal.replyToModeByChatType.direct/group` پیکربندی کنید. مقادیر سطح حساب در `channels.signal.accounts.<id>` اولویت دارند.

## رسانه + محدودیت‌ها

- متن خروجی بر اساس `channels.signal.textChunkLimit` به قطعه‌ها تقسیم می‌شود (پیش‌فرض ۴۰۰۰).
- قطعه‌بندی اختیاری بر اساس خط جدید: `channels.signal.chunkMode="newline"` را تنظیم کنید تا متن پیش از قطعه‌بندی بر اساس طول، در خطوط خالی (مرزهای پاراگراف) تقسیم شود.
- پیوست‌ها پشتیبانی می‌شوند (به‌صورت base64 از `signal-cli` دریافت می‌شوند).
- اگر `contentType` موجود نباشد، پیوست‌های یادداشت صوتی از نام فایل `signal-cli` به‌عنوان MIME جایگزین استفاده می‌کنند تا رونویسی صوت همچنان بتواند یادداشت‌های صوتی AAC را طبقه‌بندی کند.
- سقف پیش‌فرض رسانه: `channels.signal.mediaMaxMb` (پیش‌فرض ۸).
- برای صرف‌نظر از بارگیری رسانه از `channels.signal.ignoreAttachments` استفاده کنید.
- زمینهٔ تاریخچهٔ گروه از `channels.signal.historyLimit` (یا `channels.signal.accounts.*.historyLimit`) استفاده می‌کند و در صورت نبود آن به `messages.groupChat.historyLimit` بازمی‌گردد. برای غیرفعال‌سازی آن را روی `0` تنظیم کنید (پیش‌فرض ۵۰).

## نشانگر تایپ و رسیدهای خواندن

- **نشانگرهای تایپ**: OpenClaw سیگنال‌های تایپ را از طریق `signal-cli sendTyping` ارسال می‌کند و تا زمانی که پاسخ در حال اجرا است، آن‌ها را تازه‌سازی می‌کند.
- **رسیدهای خواندن**: وقتی `channels.signal.sendReadReceipts` برابر true باشد، OpenClaw رسیدهای خواندن را برای پیام‌های خصوصی مجاز ارسال می‌کند.
- `signal-cli` رسیدهای خواندن گروه‌ها را ارائه نمی‌کند.

## واکنش‌های وضعیت چرخهٔ حیات

برای اینکه Signal چرخهٔ مشترک واکنش‌های در صف/در حال فکر/ابزار/Compaction/انجام‌شده/خطا را در نوبت‌های ورودی نمایش دهد، `messages.statusReactions.enabled: true` را تنظیم کنید. Signal از مهر زمانی پیام ورودی به‌عنوان هدف واکنش استفاده می‌کند؛ واکنش‌های گروهی با شناسهٔ گروه Signal و فرستندهٔ اصلی به‌عنوان نویسندهٔ هدف ارسال می‌شوند.

واکنش‌های وضعیت همچنین به یک واکنش تأیید دریافت و یک `messages.ackReactionScope` منطبق (`direct`، `group-all`، `group-mentions` یا `all`) نیاز دارند. برای غیرفعال‌کردن واکنش‌های وضعیت Signal، `channels.signal.reactionLevel: "off"` را تنظیم کنید.

`messages.removeAckAfterReply: true` واکنش وضعیت نهایی را پس از مدت نگه‌داری پیکربندی‌شده پاک می‌کند. در غیر این صورت، Signal پس از وضعیت نهایی انجام‌شده/خطا، واکنش اولیهٔ تأیید دریافت را بازمی‌گرداند.

## واکنش‌ها (ابزار پیام)

از `message action=react` همراه با `channel=signal` استفاده کنید.

- هدف‌ها: شمارهٔ E.164 یا UUID فرستنده (از `uuid:<id>` موجود در خروجی جفت‌سازی استفاده کنید؛ UUID بدون پیشوند نیز کار می‌کند).
- `messageId` مهر زمانی Signal برای پیامی است که به آن واکنش نشان می‌دهید.
- واکنش‌های گروهی به `targetAuthor` یا `targetAuthorUuid` نیاز دارند.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

پیکربندی:

- `channels.signal.actions.reactions`: فعال/غیرفعال‌کردن کنش‌های واکنش (پیش‌فرض true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (پیش‌فرض `minimal`).
  - `off`/`ack` واکنش‌های عامل را غیرفعال می‌کند (ابزار پیام `react` خطا می‌دهد).
  - `minimal`/`extensive` واکنش‌های عامل را فعال می‌کند و سطح راهنمایی را تعیین می‌کند.
- جایگزین‌های مخصوص هر حساب: `channels.signal.accounts.<id>.actions.reactions`، `channels.signal.accounts.<id>.reactionLevel`.

## واکنش‌های تأیید

درخواست‌های تأیید اجرای Signal و Plugin از بلوک‌های مسیریابی سطح‌بالای `approvals.exec` و `approvals.plugin` استفاده می‌کنند. Signal بلوک `channels.signal.execApprovals` ندارد.

- `👍` یک‌بار تأیید می‌کند.
- `👎` رد می‌کند.
- وقتی یک درخواست امکان تأیید دائمی را ارائه می‌دهد، از `/approve <id> allow-always` استفاده کنید.

حل واکنش تأیید به تأییدکنندگان صریح Signal در `channels.signal.allowFrom`، `channels.signal.defaultTo` یا فیلدهای منطبق در سطح حساب نیاز دارد. درخواست‌های تأیید اجرای مستقیم در همان گفت‌وگو همچنان می‌توانند بدون تأییدکنندگان صریح، گزینهٔ جایگزین محلی و تکراری `/approve` را پنهان کنند؛ در تأییدهای گروهی بدون تأییدکننده، گزینهٔ جایگزین محلی همچنان قابل مشاهده می‌ماند.

## هدف‌های تحویل (CLI/Cron)

- پیام‌های خصوصی: `signal:+15551234567` (یا E.164 ساده).
- پیام‌های خصوصی UUID: `uuid:<id>` (یا UUID ساده).
- گروه‌ها: `signal:group:<groupId>`.
- نام‌های کاربری: `username:<name>` (اگر حساب Signal شما از آن پشتیبانی کند).

## نام‌های مستعار

برای هدف‌های تکرارشوندهٔ Signal، نام‌های مستعار پایداری پیکربندی کنید. نام‌های مستعار فقط پیکربندی سمت OpenClaw هستند؛ آن‌ها مخاطبان Signal را ایجاد یا ویرایش نمی‌کنند.

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
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
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

`openclaw directory peers list --channel signal` و `openclaw directory groups list --channel signal` نام‌های مستعار پیکربندی‌شده را فهرست می‌کنند. فهرست Signal بر پیکربندی متکی است؛ مخاطبان Signal را به‌صورت زنده واکشی نمی‌کند و حساب Signal را تغییر نمی‌دهد.

## عیب‌یابی

ابتدا این مراحل را اجرا کنید:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

سپس در صورت نیاز، وضعیت جفت‌سازی پیام خصوصی را بررسی کنید:

```bash
openclaw pairing list signal
```

خطاهای رایج:

- دیمن در دسترس است اما پاسخی وجود ندارد: تنظیمات حساب/دیمن (`httpUrl`، `account`) و حالت دریافت را بررسی کنید.
- پیام‌های خصوصی نادیده گرفته می‌شوند: تأیید جفت‌سازی فرستنده در انتظار است.
- پیام‌های گروهی نادیده گرفته می‌شوند: محدودیت فرستنده/اشاره در گروه مانع تحویل می‌شود.
- خطاهای اعتبارسنجی پیکربندی پس از ویرایش: `openclaw doctor --fix` را اجرا کنید.
- Signal در اطلاعات تشخیصی وجود ندارد: تأیید کنید که `channels.signal.enabled: true` تنظیم شده است.

بررسی‌های تکمیلی:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

برای روند بررسی اولیه: [عیب‌یابی کانال‌ها](/fa/channels/troubleshooting).

## نکات امنیتی

- `signal-cli` کلیدهای حساب را به‌صورت محلی ذخیره می‌کند (معمولاً در `~/.local/share/signal-cli/data/`).
- پیش از مهاجرت یا بازسازی سرور، از وضعیت حساب Signal نسخهٔ پشتیبان تهیه کنید.
- مگر اینکه صراحتاً دسترسی گسترده‌تری به پیام‌های خصوصی می‌خواهید، `channels.signal.dmPolicy: "pairing"` را حفظ کنید.
- تأیید پیامکی فقط برای فرایندهای ثبت‌نام یا بازیابی لازم است، اما از دست‌دادن کنترل شماره/حساب می‌تواند ثبت‌نام مجدد را دشوار کند.

## مرجع پیکربندی (Signal)

پیکربندی کامل: [پیکربندی](/fa/gateway/configuration)

گزینه‌های ارائه‌دهنده:

- `channels.signal.enabled`: فعال/غیرفعال‌کردن راه‌اندازی کانال.
- `channels.signal.apiMode`: `auto | native | container` (پیش‌فرض: auto). [حالت کانتینر](#container-mode-bbernhardsignal-cli-rest-api) را ببینید.
- `channels.signal.account`: شمارهٔ E.164 حساب ربات.
- `channels.signal.cliPath`: مسیر `signal-cli`.
- `channels.signal.configPath`: پوشهٔ اختیاری `signal-cli --config`.
- `channels.signal.httpUrl`: نشانی کامل دیمن (مقادیر میزبان/درگاه را بازنویسی می‌کند).
- `channels.signal.httpHost`، `channels.signal.httpPort`: نشانی اتصال دیمن (پیش‌فرض `127.0.0.1:8080`).
- `channels.signal.autoStart`: اجرای خودکار دیمن (اگر `httpUrl` تنظیم نشده باشد، پیش‌فرض true است).
- `channels.signal.startupTimeoutMs`: مهلت انتظار برای راه‌اندازی بر حسب میلی‌ثانیه (حداقل ۱۰۰۰، سقف ۱۲۰۰۰۰؛ پیش‌فرض ۳۰۰۰۰).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: صرف‌نظر از بارگیری پیوست‌ها.
- `channels.signal.ignoreStories`: نادیده‌گرفتن استوری‌های دیمن.
- `channels.signal.sendReadReceipts`: ارسال رسیدهای خواندن.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (پیش‌فرض: pairing).
- `channels.signal.allowFrom`: فهرست مجاز پیام‌های خصوصی (E.164 یا `uuid:<id>`). حالت `open` به `"*"` نیاز دارد. Signal نام کاربری ندارد؛ از شناسه‌های تلفن/UUID استفاده کنید.
- `channels.signal.aliases`: نام‌های مستعار سمت OpenClaw برای هدف‌های تحویل پیام خصوصی یا گروهی.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (پیش‌فرض: allowlist).
- `channels.signal.groupAllowFrom`: فهرست مجاز گروه؛ شناسه‌های گروه Signal (خام، `group:<id>` یا `signal:group:<id>`)، شماره‌های E.164 فرستنده یا مقادیر `uuid:<id>` را می‌پذیرد.
- `channels.signal.groups`: بازنویسی‌های مخصوص هر گروه با کلید شناسهٔ گروه Signal (یا `"*"`). فیلدهای پشتیبانی‌شده: `requireMention`، `tools`، `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: نسخهٔ مخصوص هر حساب از `channels.signal.groups` برای پیکربندی‌های چندحسابی.
- `channels.signal.accounts.<id>.aliases`: نام‌های مستعار مخصوص هر حساب که با نام‌های مستعار سطح‌بالا ادغام می‌شوند.
- `channels.signal.replyToMode`: حالت نقل‌قول بومی پاسخ، `off | first | all | batched` (پیش‌فرض: `all`).
- `channels.signal.replyToModeByChatType.direct`، `channels.signal.replyToModeByChatType.group`: بازنویسی‌های نقل‌قول بومی پاسخ بر اساس نوع گفت‌وگو.
- `channels.signal.accounts.<id>.replyToMode`، `channels.signal.accounts.<id>.replyToModeByChatType.direct`، `channels.signal.accounts.<id>.replyToModeByChatType.group`: بازنویسی‌های نقل‌قول پاسخ مخصوص هر حساب.
- `channels.signal.historyLimit`: حداکثر تعداد پیام‌های گروهی که در زمینه گنجانده می‌شوند (۰ غیرفعال می‌کند).
- `channels.signal.dmHistoryLimit`: محدودیت تاریخچهٔ پیام خصوصی بر حسب نوبت‌های کاربر. بازنویسی‌های مخصوص هر کاربر: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: اندازهٔ قطعهٔ خروجی بر حسب نویسه (پیش‌فرض ۴۰۰۰).
- `channels.signal.chunkMode`: مقدار `length` (پیش‌فرض) یا `newline` برای تقسیم در خطوط خالی (مرزهای پاراگراف) پیش از قطعه‌بندی بر اساس طول.
- `channels.signal.mediaMaxMb`: سقف رسانهٔ ورودی/خروجی بر حسب مگابایت (پیش‌فرض ۸).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (پیش‌فرض `minimal`). [واکنش‌ها](#reactions-message-tool) را ببینید.
- `channels.signal.reactionNotifications`: `off | own | all | allowlist` (پیش‌فرض `own`) — تعیین می‌کند عامل چه زمانی از واکنش‌های ورودی دیگران مطلع شود.
- `channels.signal.reactionAllowlist`: فرستندگانی که وقتی `reactionNotifications: "allowlist"` است، واکنش‌هایشان عامل را مطلع می‌کند.
- `channels.signal.blockStreaming`، `channels.signal.blockStreamingCoalesce`: کنترل‌های پخش جریانی در حالت بلوکی که میان کانال‌ها مشترک هستند. [پخش جریانی](/fa/concepts/streaming) را ببینید.

گزینه‌های سراسری مرتبط:

- `agents.list[].groupChat.mentionPatterns` (Signal از اشاره‌های بومی پشتیبانی نمی‌کند).
- `messages.groupChat.mentionPatterns` (گزینهٔ جایگزین سراسری).
- `messages.responsePrefix`.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) - همهٔ کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) - احراز هویت پیام خصوصی و روند جفت‌سازی
- [گروه‌ها](/fa/channels/groups) - رفتار گفت‌وگوی گروهی و محدودیت اشاره
- [مسیریابی کانال](/fa/channels/channel-routing) - مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) - مدل دسترسی و مقاوم‌سازی
