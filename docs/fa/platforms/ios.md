---
read_when:
    - جفت‌سازی یا اتصال مجدد Node iOS
    - اجرای اپلیکیشن iOS از سورس
    - اشکال‌زدایی از کشف Gateway یا فرمان‌های بوم
summary: 'اپلیکیشن Node iOS: اتصال به Gateway، جفت‌سازی، بوم و عیب‌یابی'
title: برنامه iOS
x-i18n:
    generated_at: "2026-06-27T18:06:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a93381fd2b95316e05a555bee45b9aed5572679b4b1f10f7f9e40c1a69faf17
    source_path: platforms/ios.md
    workflow: 16
---

دسترس‌پذیری: بیلدهای اپ iPhone وقتی برای یک انتشار فعال شده باشند، از طریق کانال‌های Apple توزیع می‌شوند. بیلدهای توسعهٔ محلی نیز می‌توانند از سورس اجرا شوند.

## چه کاری انجام می‌دهد

- از طریق WebSocket به یک Gateway وصل می‌شود (LAN یا tailnet).
- قابلیت‌های نود را ارائه می‌کند: Canvas، عکس فوری Screen، ثبت تصویر Camera، Location، حالت Talk، بیدارباش صوتی.
- فرمان‌های `node.invoke` را دریافت می‌کند و رویدادهای وضعیت نود را گزارش می‌دهد.

## نیازمندی‌ها

- Gateway در حال اجرا روی دستگاهی دیگر (macOS، Linux، یا Windows از طریق WSL2).
- مسیر شبکه:
  - همان LAN از طریق Bonjour، **یا**
  - Tailnet از طریق DNS-SD تک‌پخشی (دامنهٔ نمونه: `openclaw.internal.`)، **یا**
  - میزبان/درگاه دستی (جایگزین).

## شروع سریع (جفت‌سازی + اتصال)

1. Gateway را راه‌اندازی کنید:

```bash
openclaw gateway --port 18789
```

2. در اپ iOS، Settings را باز کنید و یک gateway کشف‌شده را انتخاب کنید (یا Manual Host را فعال کنید و میزبان/درگاه را وارد کنید).

3. درخواست جفت‌سازی را روی میزبان gateway تایید کنید:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

اگر اپ جفت‌سازی را با جزئیات احراز هویت تغییرکرده (نقش/دامنه‌ها/کلید عمومی) دوباره تلاش کند،
درخواست معلق قبلی جایگزین می‌شود و یک `requestId` جدید ساخته می‌شود.
پیش از تایید، دوباره `openclaw devices list` را اجرا کنید.

اختیاری: اگر نود iOS همیشه از یک زیرشبکهٔ کاملا کنترل‌شده وصل می‌شود، می‌توانید
با CIDRهای صریح یا IPهای دقیق، تایید خودکار نود در اولین اتصال را فعال کنید:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

این به‌صورت پیش‌فرض غیرفعال است. فقط برای جفت‌سازی تازهٔ `role: node` بدون
دامنه‌های درخواستی اعمال می‌شود. جفت‌سازی اپراتور/مرورگر و هر تغییر نقش، دامنه، فراداده، یا
کلید عمومی همچنان به تایید دستی نیاز دارد.

4. اتصال را بررسی کنید:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## پوشِ مبتنی بر رله برای بیلدهای رسمی

بیلدهای توزیع‌شدهٔ رسمی iOS به‌جای انتشار توکن خام APNs
به gateway، از رلهٔ پوش خارجی استفاده می‌کنند.

بیلدهای رسمی/TestFlight از مسیر انتشار عمومی App Store از رلهٔ میزبانی‌شده در `https://ios-push-relay.openclaw.ai` استفاده می‌کنند.

استقرارهای رلهٔ سفارشی به یک مسیر بیلد/استقرار iOS عمدا جداگانه نیاز دارند که URL رلهٔ آن با URL رلهٔ gateway مطابقت داشته باشد. مسیر انتشار عمومی App Store بازنویسی‌های URL رلهٔ سفارشی را نمی‌پذیرد. اگر از یک بیلد رلهٔ سفارشی استفاده می‌کنید، URL رلهٔ gateway مطابق را تنظیم کنید:

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

نحوهٔ کار جریان:

- اپ iOS با استفاده از App Attest و یک JWS تراکنش اپ StoreKit در رله ثبت‌نام می‌کند.
- رله یک هندل رلهٔ مبهم به‌همراه یک مجوز ارسال محدود به ثبت‌نام برمی‌گرداند.
- اپ iOS هویت gateway جفت‌شده را دریافت می‌کند و آن را در ثبت‌نام رله قرار می‌دهد، بنابراین ثبت‌نام مبتنی بر رله به همان gateway مشخص واگذار می‌شود.
- اپ آن ثبت‌نام مبتنی بر رله را با `push.apns.register` به gateway جفت‌شده ارسال می‌کند.
- Gateway از آن هندل رلهٔ ذخیره‌شده برای `push.test`، بیدارباش‌های پس‌زمینه، و تلنگرهای بیدارباش استفاده می‌کند.
- URLهای رلهٔ gateway سفارشی باید با URL رله‌ای که در بیلد iOS جاسازی شده مطابقت داشته باشند.
- اگر اپ بعدا به gateway متفاوتی یا بیلدی با URL پایهٔ رلهٔ متفاوت وصل شود، به‌جای استفادهٔ دوباره از اتصال قبلی، ثبت‌نام رله را تازه‌سازی می‌کند.

آنچه gateway برای این مسیر **نیاز ندارد**:

- بدون توکن رلهٔ سراسری برای استقرار.
- بدون کلید مستقیم APNs برای ارسال‌های رسمی/TestFlight مبتنی بر رله.

جریان مورد انتظار اپراتور:

1. بیلد رسمی/TestFlight iOS را نصب کنید.
2. اختیاری: فقط هنگام استفاده از یک بیلد رلهٔ سفارشی عمدا جداگانه، `gateway.push.apns.relay.baseUrl` را روی gateway تنظیم کنید.
3. اپ را با gateway جفت کنید و بگذارید اتصال را کامل کند.
4. اپ پس از داشتن توکن APNs، وصل بودن نشست اپراتور، و موفقیت ثبت‌نام رله، `push.apns.register` را به‌صورت خودکار منتشر می‌کند.
5. پس از آن، `push.test`، بیدارباش‌های اتصال دوباره، و تلنگرهای بیدارباش می‌توانند از ثبت‌نام ذخیره‌شدهٔ مبتنی بر رله استفاده کنند.

## Beaconهای زنده بودن در پس‌زمینه

وقتی iOS اپ را برای یک پوش خاموش، تازه‌سازی پس‌زمینه، یا رویداد مکان مهم بیدار می‌کند، اپ
یک اتصال دوبارهٔ کوتاه نود را تلاش می‌کند و سپس `node.event` را با `event: "node.presence.alive"` فراخوانی می‌کند.
Gateway این مورد را فقط پس از شناخته شدن هویت دستگاه نود احراز هویت‌شده، به‌صورت `lastSeenAtMs`/`lastSeenReason` روی فرادادهٔ نود/دستگاه جفت‌شده ثبت می‌کند.

اپ یک بیدارباش پس‌زمینه را فقط وقتی با موفقیت ثبت‌شده تلقی می‌کند که پاسخ gateway شامل
`handled: true` باشد. Gatewayهای قدیمی‌تر ممکن است `node.event` را با `{ "ok": true }` تایید کنند؛ آن پاسخ
سازگار است اما به‌عنوان به‌روزرسانی پایدار آخرین مشاهده حساب نمی‌شود.

یادداشت سازگاری:

- `OPENCLAW_APNS_RELAY_BASE_URL` همچنان به‌عنوان بازنویسی env موقت برای gateway کار می‌کند.
- مسیر انتشار عمومی App Store، `OPENCLAW_PUSH_RELAY_BASE_URL` را برای بیلدهای iOS رد می‌کند.

## جریان احراز هویت و اعتماد

رله وجود دارد تا دو محدودیتی را اعمال کند که APNs مستقیم روی gateway برای
بیلدهای رسمی iOS نمی‌تواند فراهم کند:

- فقط بیلدهای واقعی iOS OpenClaw که از طریق Apple توزیع شده‌اند می‌توانند از رلهٔ میزبانی‌شده استفاده کنند.
- یک gateway فقط برای دستگاه‌های iOS که با همان gateway مشخص جفت شده‌اند می‌تواند پوش‌های مبتنی بر رله ارسال کند.

گام‌به‌گام:

1. `iOS app -> gateway`
   - اپ ابتدا از طریق جریان عادی احراز هویت Gateway با gateway جفت می‌شود.
   - این کار یک نشست نود احراز هویت‌شده به‌همراه یک نشست اپراتور احراز هویت‌شده به اپ می‌دهد.
   - نشست اپراتور برای فراخوانی `gateway.identity.get` استفاده می‌شود.

2. `iOS app -> relay`
   - اپ endpointهای ثبت‌نام رله را از طریق HTTPS فراخوانی می‌کند.
   - ثبت‌نام شامل اثبات App Attest به‌همراه یک JWS تراکنش اپ StoreKit است.
   - رله، bundle ID، اثبات App Attest، و اثبات توزیع Apple را اعتبارسنجی می‌کند و به
     مسیر توزیع رسمی/تولید نیاز دارد.
   - همین مورد مانع استفادهٔ بیلدهای محلی Xcode/توسعه از رلهٔ میزبانی‌شده می‌شود. یک بیلد محلی ممکن است
     امضا شده باشد، اما اثبات توزیع رسمی Apple را که رله انتظار دارد برآورده نمی‌کند.

3. `gateway identity delegation`
   - پیش از ثبت‌نام رله، اپ هویت gateway جفت‌شده را از
     `gateway.identity.get` دریافت می‌کند.
   - اپ آن هویت gateway را در payload ثبت‌نام رله قرار می‌دهد.
   - رله یک هندل رله و یک مجوز ارسال محدود به ثبت‌نام برمی‌گرداند که به
     آن هویت gateway واگذار شده‌اند.

4. `gateway -> relay`
   - Gateway هندل رله و مجوز ارسال را از `push.apns.register` ذخیره می‌کند.
   - در `push.test`، بیدارباش‌های اتصال دوباره، و تلنگرهای بیدارباش، gateway درخواست ارسال را با
     هویت دستگاه خودش امضا می‌کند.
   - رله هم مجوز ارسال ذخیره‌شده و هم امضای gateway را در برابر هویت
     gateway واگذارشده از ثبت‌نام بررسی می‌کند.
   - gateway دیگری نمی‌تواند از آن ثبت‌نام ذخیره‌شده دوباره استفاده کند، حتی اگر به‌نحوی هندل را به دست آورد.

5. `relay -> APNs`
   - رله مالک اعتبارنامه‌های APNs تولید و توکن خام APNs برای بیلد رسمی است.
   - Gateway هرگز توکن خام APNs را برای بیلدهای رسمی مبتنی بر رله ذخیره نمی‌کند.
   - رله پوش نهایی را از طرف gateway جفت‌شده به APNs ارسال می‌کند.

چرایی ایجاد این طراحی:

- برای بیرون نگه داشتن اعتبارنامه‌های APNs تولید از gatewayهای کاربر.
- برای جلوگیری از ذخیرهٔ توکن‌های خام APNs بیلد رسمی روی gateway.
- برای اجازه دادن به استفاده از رلهٔ میزبانی‌شده فقط برای بیلدهای رسمی/TestFlight OpenClaw.
- برای جلوگیری از اینکه یک gateway پوش‌های بیدارباش را به دستگاه‌های iOS متعلق به gateway دیگری ارسال کند.

بیلدهای محلی/دستی همچنان روی APNs مستقیم باقی می‌مانند. اگر آن بیلدها را بدون رله آزمایش می‌کنید،
gateway همچنان به اعتبارنامه‌های مستقیم APNs نیاز دارد:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

این‌ها env varهای زمان اجرای میزبان gateway هستند، نه تنظیمات Fastlane. `apps/ios/fastlane/.env` فقط
احراز هویت App Store Connect / TestFlight مانند `APP_STORE_CONNECT_KEY_ID` و
`APP_STORE_CONNECT_ISSUER_ID` را ذخیره می‌کند؛ تحویل مستقیم APNs را برای بیلدهای محلی iOS پیکربندی نمی‌کند.

ذخیره‌سازی پیشنهادی روی میزبان gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

فایل `.p8` را commit نکنید و آن را زیر checkout ریپو قرار ندهید.

## مسیرهای کشف

### Bonjour (LAN)

اپ iOS، `_openclaw-gw._tcp` را روی `local.` و، وقتی پیکربندی شده باشد، همان
دامنهٔ کشف DNS-SD گسترده‌منطقه مرور می‌کند. gatewayهای همان LAN به‌صورت خودکار از `local.` ظاهر می‌شوند؛
کشف میان‌شبکه‌ای می‌تواند بدون تغییر نوع beacon از دامنهٔ گسترده‌منطقهٔ پیکربندی‌شده استفاده کند.

### Tailnet (میان‌شبکه‌ای)

اگر mDNS مسدود باشد، از یک ناحیهٔ DNS-SD تک‌پخشی استفاده کنید (یک دامنه انتخاب کنید؛ نمونه:
`openclaw.internal.`) و Tailscale split DNS.
برای نمونهٔ CoreDNS، [Bonjour](/fa/gateway/bonjour) را ببینید.

### میزبان/درگاه دستی

در Settings، **Manual Host** را فعال کنید و میزبان gateway + درگاه را وارد کنید (پیش‌فرض `18789`).

## Canvas + A2UI

نود iOS یک canvas مبتنی بر WKWebView رندر می‌کند. برای هدایت آن از `node.invoke` استفاده کنید:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

یادداشت‌ها:

- میزبان canvas در Gateway مسیرهای `/__openclaw__/canvas/` و `/__openclaw__/a2ui/` را سرو می‌کند.
- از سرور HTTP Gateway سرو می‌شود (همان درگاه `gateway.port`، پیش‌فرض `18789`).
- نود iOS scaffold داخلی را به‌عنوان نمای پیش‌فرض متصل نگه می‌دارد. `canvas.a2ui.push` و `canvas.a2ui.reset` از صفحهٔ A2UI بسته‌بندی‌شده و متعلق به اپ استفاده می‌کنند.
- صفحه‌های A2UI راه‌دور Gateway روی iOS فقط رندر می‌شوند؛ actionهای دکمهٔ A2UI بومی فقط از صفحه‌های بسته‌بندی‌شدهٔ متعلق به اپ پذیرفته می‌شوند.
- با `canvas.navigate` و `{"url":""}` به scaffold داخلی برگردید.

## رابطه با Computer Use

اپ iOS یک سطح نود موبایل است، نه backend برای Codex Computer Use. Codex
Computer Use و `cua-driver mcp` یک دسکتاپ محلی macOS را از طریق ابزارهای MCP
کنترل می‌کنند؛ اپ iOS قابلیت‌های iPhone را از طریق فرمان‌های نود OpenClaw
مانند `canvas.*`، `camera.*`، `screen.*`، `location.*`، و `talk.*` ارائه می‌کند.

Agentها همچنان می‌توانند با فراخوانی فرمان‌های نود، اپ iOS را از طریق OpenClaw
به کار بگیرند، اما آن فراخوانی‌ها از پروتکل نود gateway عبور می‌کنند و از محدودیت‌های
پیش‌زمینه/پس‌زمینهٔ iOS پیروی می‌کنند. برای کنترل دسکتاپ محلی از [Codex Computer Use](/fa/plugins/codex-computer-use)
و برای قابلیت‌های نود iOS از این صفحه استفاده کنید.

### eval / snapshot در Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## بیدارباش صوتی + حالت talk

- بیدارباش صوتی و حالت talk در Settings در دسترس هستند.
- نودهای iOS دارای قابلیت talk، قابلیت `talk` را اعلام می‌کنند و می‌توانند
  `talk.ptt.start`، `talk.ptt.stop`، `talk.ptt.cancel`، و `talk.ptt.once` را اعلام کنند؛
  Gateway به‌صورت پیش‌فرض آن فرمان‌های push-to-talk را برای نودهای قابل اعتماد
  دارای قابلیت Talk مجاز می‌کند.
- iOS ممکن است صدای پس‌زمینه را معلق کند؛ وقتی اپ فعال نیست، قابلیت‌های صوتی را best-effort در نظر بگیرید.

## خطاهای رایج

- `NODE_BACKGROUND_UNAVAILABLE`: اپ iOS را به پیش‌زمینه بیاورید (فرمان‌های canvas/camera/screen به آن نیاز دارند).
- `A2UI_HOST_UNAVAILABLE`: صفحهٔ A2UI بسته‌بندی‌شده در WebView اپ قابل دسترس نبود؛ اپ را روی تب Screen در پیش‌زمینه نگه دارید و دوباره تلاش کنید.
- اعلان جفت‌سازی هرگز ظاهر نمی‌شود: `openclaw devices list` را اجرا کنید و به‌صورت دستی تایید کنید.
- اتصال دوباره پس از نصب مجدد شکست می‌خورد: توکن جفت‌سازی Keychain پاک شده است؛ نود را دوباره جفت کنید.

## مستندات مرتبط

- [جفت‌سازی](/fa/channels/pairing)
- [کشف](/fa/gateway/discovery)
- [Bonjour](/fa/gateway/bonjour)
