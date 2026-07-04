---
read_when:
    - جفت‌سازی یا اتصال دوبارهٔ گره iOS
    - اجرای برنامه iOS از سورس
    - اشکال‌زدایی کشف Gateway یا فرمان‌های بوم
summary: 'برنامه گره iOS: اتصال به Gateway، جفت‌سازی، بوم، و عیب‌یابی'
title: برنامه iOS
x-i18n:
    generated_at: "2026-07-04T18:11:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ad6d272518b36564562256f55ffc320c0c4d2b954914ac73c23e450fa7acee0b
    source_path: platforms/ios.md
    workflow: 16
---

دسترس‌پذیری: بیلدهای اپ iPhone، وقتی برای یک انتشار فعال باشند، از طریق کانال‌های Apple توزیع می‌شوند. بیلدهای توسعهٔ محلی نیز می‌توانند از سورس اجرا شوند.

## چه کاری انجام می‌دهد

- از طریق WebSocket به یک Gateway وصل می‌شود (LAN یا tailnet).
- قابلیت‌های نود را ارائه می‌کند: Canvas، عکس فوری صفحه، ثبت تصویر با دوربین، مکان، حالت گفت‌وگو، بیدارباش صوتی.
- فرمان‌های `node.invoke` را دریافت می‌کند و رویدادهای وضعیت نود را گزارش می‌دهد.

## الزامات

- Gateway در حال اجرا روی دستگاهی دیگر (macOS، Linux، یا Windows از طریق WSL2).
- مسیر شبکه:
  - همان LAN از طریق Bonjour، **یا**
  - Tailnet از طریق unicast DNS-SD (دامنهٔ نمونه: `openclaw.internal.`)، **یا**
  - میزبان/درگاه دستی (گزینهٔ جایگزین).

## شروع سریع (جفت‌سازی + اتصال)

1. یک Gateway احراز هویت‌شده را با مسیری که تلفن شما بتواند به آن برسد راه‌اندازی کنید. Tailscale
   Serve مسیر راه دور پیشنهادی است:

```bash
openclaw gateway --port 18789 --tailscale serve
```

برای راه‌اندازی قابل اعتماد روی همان LAN، به‌جای آن از `gateway.bind: "lan"` احراز هویت‌شده
استفاده کنید. اتصال loopback پیش‌فرض از تلفن قابل دسترسی نیست. اگر
Gateway هنوز پیکربندی نشده است، ابتدا `openclaw onboard` را اجرا کنید تا ایجاد setup-code
مسیر احراز هویت با توکن یا گذرواژه داشته باشد.

2. [رابط کنترل](/fa/web/control-ui) را باز کنید، **نودها** را انتخاب کنید و در کارت **دستگاه‌ها**
   روی **جفت‌سازی دستگاه موبایل** کلیک کنید.

3. در اپ iOS، **تنظیمات** → **Gateway** را باز کنید، کد QR را اسکن کنید (یا
   setup code را جای‌گذاری کنید)، و وصل شوید.

4. اپ رسمی به‌صورت خودکار وصل می‌شود. اگر **دستگاه‌ها** یک درخواست در انتظار را نشان می‌دهد،
   پیش از تأیید، نقش و scopeهای آن را بررسی کنید.

دکمهٔ رابط کنترل به یک نشست از پیش جفت‌شده با `operator.admin` نیاز دارد.
به‌عنوان گزینهٔ جایگزین ترمینال، یک gateway کشف‌شده را در اپ iOS انتخاب کنید (یا
Manual Host را فعال کنید و میزبان/درگاه را وارد کنید)، سپس درخواست را روی میزبان Gateway تأیید کنید:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

اگر اپ جفت‌سازی را با جزئیات احراز هویت تغییرکرده (نقش/scopeها/کلید عمومی) دوباره امتحان کند،
درخواست در انتظار قبلی جایگزین می‌شود و یک `requestId` جدید ایجاد می‌شود.
پیش از تأیید، دوباره `openclaw devices list` را اجرا کنید.

اختیاری: اگر نود iOS همیشه از یک زیرشبکهٔ کاملا کنترل‌شده وصل می‌شود، می‌توانید
با CIDRهای صریح یا IPهای دقیق، تأیید خودکار اولین بار نود را فعال کنید:

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

این قابلیت به‌صورت پیش‌فرض غیرفعال است. فقط برای جفت‌سازی تازه با `role: node` و
بدون scopeهای درخواستی اعمال می‌شود. جفت‌سازی اپراتور/مرورگر و هر تغییر نقش، scope، فراداده، یا
کلید عمومی همچنان به تأیید دستی نیاز دارد.

5. اتصال را تأیید کنید:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## push مبتنی بر رله برای بیلدهای رسمی

بیلدهای رسمی توزیع‌شدهٔ iOS به‌جای انتشار توکن خام APNs
به gateway، از رلهٔ push خارجی استفاده می‌کنند.

بیلدهای رسمی App Store از مسیر انتشار عمومی از رلهٔ میزبانی‌شده در `https://ios-push-relay.openclaw.ai` استفاده می‌کنند.

استقرارهای رلهٔ سفارشی به یک مسیر بیلد/استقرار iOS عامدانه جدا نیاز دارند که URL رلهٔ آن با URL رلهٔ gateway مطابقت داشته باشد. مسیر انتشار عمومی App Store بازنویسی URL رلهٔ سفارشی را نمی‌پذیرد. اگر از بیلد رلهٔ سفارشی استفاده می‌کنید، URL رلهٔ مطابق gateway را تنظیم کنید:

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

نحوهٔ کار این جریان:

- اپ iOS با استفاده از App Attest و یک StoreKit app transaction JWS در رله ثبت‌نام می‌کند.
- رله یک شناسهٔ مات رله به‌همراه یک مجوز ارسال محدود به ثبت‌نام برمی‌گرداند.
- اپ iOS هویت gateway جفت‌شده را دریافت می‌کند و آن را در ثبت‌نام رله قرار می‌دهد، بنابراین ثبت‌نام مبتنی بر رله به همان gateway مشخص واگذار می‌شود.
- اپ آن ثبت‌نام مبتنی بر رله را با `push.apns.register` به gateway جفت‌شده ارسال می‌کند.
- gateway از آن شناسهٔ رلهٔ ذخیره‌شده برای `push.test`، بیدارباش‌های پس‌زمینه، و تلنگرهای بیدارباش استفاده می‌کند.
- URLهای رلهٔ gateway سفارشی باید با URL رله‌ای که در بیلد iOS تعبیه شده است مطابقت داشته باشند.
- اگر اپ بعدا به gateway دیگری یا بیلدی با URL پایهٔ رلهٔ متفاوت وصل شود، به‌جای استفادهٔ دوباره از binding قدیمی، ثبت‌نام رله را تازه‌سازی می‌کند.

آنچه gateway برای این مسیر **نیاز ندارد**:

- بدون توکن رلهٔ سراسری استقرار.
- بدون کلید مستقیم APNs برای ارسال‌های رسمی App Store مبتنی بر رله.

جریان مورد انتظار اپراتور:

1. اپ رسمی iOS را نصب کنید.
2. اختیاری: فقط هنگام استفاده از یک بیلد رلهٔ سفارشی عامدانه جدا، `gateway.push.apns.relay.baseUrl` را روی gateway تنظیم کنید.
3. اپ را با gateway جفت کنید و اجازه دهید اتصال آن کامل شود.
4. اپ پس از داشتن توکن APNs، وصل بودن نشست اپراتور، و موفقیت ثبت‌نام رله، `push.apns.register` را به‌صورت خودکار منتشر می‌کند.
5. پس از آن، `push.test`، بیدارباش‌های اتصال دوباره، و تلنگرهای بیدارباش می‌توانند از ثبت‌نام ذخیره‌شدهٔ مبتنی بر رله استفاده کنند.

## beaconهای زندهٔ پس‌زمینه

وقتی iOS اپ را برای push بی‌صدا، تازه‌سازی پس‌زمینه، یا رویداد مکان معنادار بیدار می‌کند، اپ
یک اتصال دوبارهٔ کوتاه نود را امتحان می‌کند و سپس `node.event` را با `event: "node.presence.alive"` فراخوانی می‌کند.
gateway این را فقط پس از مشخص شدن هویت احراز هویت‌شدهٔ دستگاه نود، به‌عنوان `lastSeenAtMs`/`lastSeenReason` در فرادادهٔ نود/دستگاه جفت‌شده ثبت می‌کند.

اپ یک بیدارباش پس‌زمینه را فقط وقتی با موفقیت ثبت‌شده تلقی می‌کند که پاسخ gateway شامل
`handled: true` باشد. gatewayهای قدیمی‌تر ممکن است `node.event` را با `{ "ok": true }` تأیید کنند؛ آن پاسخ
سازگار است، اما به‌عنوان به‌روزرسانی پایدار آخرین مشاهده‌شدن حساب نمی‌شود.

نکتهٔ سازگاری:

- `OPENCLAW_APNS_RELAY_BASE_URL` همچنان به‌عنوان بازنویسی موقت env برای gateway کار می‌کند.
- مسیر انتشار عمومی App Store، `OPENCLAW_PUSH_RELAY_BASE_URL` را برای بیلدهای iOS رد می‌کند.

## جریان احراز هویت و اعتماد

رله برای اعمال دو محدودیت وجود دارد که APNs مستقیم روی gateway نمی‌تواند برای
بیلدهای رسمی iOS فراهم کند:

- فقط بیلدهای واقعی iOS متعلق به OpenClaw که از طریق Apple توزیع شده‌اند می‌توانند از رلهٔ میزبانی‌شده استفاده کنند.
- یک gateway فقط برای دستگاه‌های iOS که با همان gateway مشخص جفت شده‌اند می‌تواند pushهای مبتنی بر رله ارسال کند.

گام به گام:

1. `iOS app -> gateway`
   - اپ ابتدا از طریق جریان عادی احراز هویت Gateway با gateway جفت می‌شود.
   - این کار به اپ یک نشست نود احراز هویت‌شده به‌همراه یک نشست اپراتور احراز هویت‌شده می‌دهد.
   - نشست اپراتور برای فراخوانی `gateway.identity.get` استفاده می‌شود.

2. `iOS app -> relay`
   - اپ endpointهای ثبت‌نام رله را از طریق HTTPS فراخوانی می‌کند.
   - ثبت‌نام شامل اثبات App Attest به‌همراه یک StoreKit app transaction JWS است.
   - رله شناسهٔ bundle، اثبات App Attest، و اثبات توزیع Apple را اعتبارسنجی می‌کند، و مسیر
     توزیع رسمی/production را الزامی می‌داند.
   - این همان چیزی است که مانع استفادهٔ بیلدهای محلی Xcode/dev از رلهٔ میزبانی‌شده می‌شود. یک بیلد محلی ممکن است
     امضا شده باشد، اما اثبات توزیع رسمی Apple را که رله انتظار دارد برآورده نمی‌کند.

3. `gateway identity delegation`
   - پیش از ثبت‌نام رله، اپ هویت gateway جفت‌شده را از
     `gateway.identity.get` دریافت می‌کند.
   - اپ آن هویت gateway را در payload ثبت‌نام رله قرار می‌دهد.
   - رله یک شناسهٔ رله و یک مجوز ارسال محدود به ثبت‌نام برمی‌گرداند که به
     آن هویت gateway واگذار شده‌اند.

4. `gateway -> relay`
   - gateway شناسهٔ رله و مجوز ارسال را از `push.apns.register` ذخیره می‌کند.
   - در `push.test`، بیدارباش‌های اتصال دوباره، و تلنگرهای بیدارباش، gateway درخواست ارسال را با
     هویت دستگاه خودش امضا می‌کند.
   - رله هم مجوز ارسال ذخیره‌شده و هم امضای gateway را در برابر هویت
     gateway واگذارشده از ثبت‌نام بررسی می‌کند.
   - gateway دیگری نمی‌تواند از آن ثبت‌نام ذخیره‌شده دوباره استفاده کند، حتی اگر به‌نحوی شناسه را به دست آورد.

5. `relay -> APNs`
   - رله مالک اعتبارنامه‌های production APNs و توکن خام APNs برای بیلد رسمی است.
   - gateway هرگز توکن خام APNs را برای بیلدهای رسمی مبتنی بر رله ذخیره نمی‌کند.
   - رله push نهایی را از طرف gateway جفت‌شده به APNs ارسال می‌کند.

دلیل ایجاد این طراحی:

- برای دور نگه داشتن اعتبارنامه‌های production APNs از gatewayهای کاربران.
- برای جلوگیری از ذخیرهٔ توکن‌های خام APNs متعلق به بیلد رسمی روی gateway.
- برای اجازه دادن به استفاده از رلهٔ میزبانی‌شده فقط برای بیلدهای رسمی iOS متعلق به OpenClaw.
- برای جلوگیری از این‌که یک gateway، pushهای بیدارباش را به دستگاه‌های iOS متعلق به gateway دیگری ارسال کند.

بیلدهای محلی/دستی همچنان روی APNs مستقیم می‌مانند. اگر آن بیلدها را بدون رله آزمایش می‌کنید،
gateway همچنان به اعتبارنامه‌های مستقیم APNs نیاز دارد:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

این‌ها متغیرهای env زمان اجرای میزبان gateway هستند، نه تنظیمات Fastlane. `apps/ios/fastlane/.env` فقط
احراز هویت App Store Connect مانند `APP_STORE_CONNECT_KEY_ID` و
`APP_STORE_CONNECT_ISSUER_ID` را ذخیره می‌کند؛ تحویل مستقیم APNs را برای بیلدهای محلی iOS پیکربندی نمی‌کند.

ذخیره‌سازی پیشنهادی روی میزبان gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

فایل `.p8` را commit نکنید و آن را زیر checkout مخزن قرار ندهید.

## مسیرهای کشف

### Bonjour (LAN)

اپ iOS روی `local.` و، در صورت پیکربندی، همان دامنهٔ کشف wide-area DNS-SD،
`_openclaw-gw._tcp` را مرور می‌کند. gatewayهای همان LAN به‌صورت خودکار از `local.` ظاهر می‌شوند؛
کشف بین‌شبکه‌ای می‌تواند بدون تغییر نوع beacon از دامنهٔ wide-area پیکربندی‌شده استفاده کند.

### Tailnet (بین‌شبکه‌ای)

اگر mDNS مسدود است، از یک ناحیهٔ unicast DNS-SD استفاده کنید (یک دامنه انتخاب کنید؛ نمونه:
`openclaw.internal.`) و Tailscale split DNS.
برای نمونهٔ CoreDNS، [Bonjour](/fa/gateway/bonjour) را ببینید.

### میزبان/درگاه دستی

در تنظیمات، **Manual Host** را فعال کنید و میزبان gateway + درگاه (پیش‌فرض `18789`) را وارد کنید.

## Canvas + A2UI

نود iOS یک canvas مبتنی بر WKWebView را render می‌کند. برای کنترل آن از `node.invoke` استفاده کنید:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

نکته‌ها:

- میزبان Canvas متعلق به Gateway، `/__openclaw__/canvas/` و `/__openclaw__/a2ui/` را سرو می‌کند.
- از سرور HTTP Gateway سرو می‌شود (همان درگاه `gateway.port`، پیش‌فرض `18789`).
- نود iOS داربست داخلی را به‌عنوان نمای پیش‌فرض متصل نگه می‌دارد. `canvas.a2ui.push` و `canvas.a2ui.reset` از صفحهٔ A2UI بسته‌بندی‌شدهٔ متعلق به اپ استفاده می‌کنند.
- صفحات A2UI متعلق به Gateway راه دور روی iOS فقط render-only هستند؛ کنش‌های دکمهٔ A2UI بومی فقط از صفحات بسته‌بندی‌شدهٔ متعلق به اپ پذیرفته می‌شوند.
- با `canvas.navigate` و `{"url":""}` به داربست داخلی برگردید.

## رابطه با Computer Use

اپ iOS یک سطح نود موبایل است، نه backend برای Codex Computer Use. Codex
Computer Use و `cua-driver mcp` یک دسکتاپ محلی macOS را از طریق ابزارهای MCP
کنترل می‌کنند؛ اپ iOS قابلیت‌های iPhone را از طریق فرمان‌های نود OpenClaw
مانند `canvas.*`، `camera.*`، `screen.*`، `location.*`، و `talk.*` ارائه می‌کند.

Agentها همچنان می‌توانند اپ iOS را از طریق OpenClaw با فراخوانی فرمان‌های نود
کنترل کنند، اما آن فراخوانی‌ها از پروتکل نود gateway عبور می‌کنند و از محدودیت‌های
foreground/background در iOS پیروی می‌کنند. برای کنترل دسکتاپ محلی از [Codex Computer Use](/fa/plugins/codex-computer-use)
و برای قابلیت‌های نود iOS از این صفحه استفاده کنید.

### ارزیابی / عکس فوری Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## بیدارباش صوتی + حالت گفت‌وگو

- بیدارباش صوتی و حالت گفت‌وگو در تنظیمات در دسترس هستند.
- گفت‌وگوی بلادرنگ OpenAI زمانی که `talk.realtime.transport` برابر با `webrtc` باشد از WebRTC متعلق به کلاینت استفاده می‌کند؛ پیکربندی صریح `gateway-relay` همچنان متعلق به Gateway می‌ماند. ببینید [حالت گفت‌وگو](/fa/nodes/talk).
- گره‌های iOS که از گفت‌وگو پشتیبانی می‌کنند، قابلیت `talk` را اعلام می‌کنند و می‌توانند
  `talk.ptt.start`، `talk.ptt.stop`، `talk.ptt.cancel`، و `talk.ptt.once` را تعریف کنند؛
  Gateway این فرمان‌های push-to-talk را به‌طور پیش‌فرض برای گره‌های قابل‌اعتماد
  و پشتیبان گفت‌وگو مجاز می‌کند.
- iOS ممکن است صدای پس‌زمینه را تعلیق کند؛ وقتی برنامه فعال نیست، قابلیت‌های صوتی را در حد بهترین تلاش در نظر بگیرید.

## خطاهای رایج

- `NODE_BACKGROUND_UNAVAILABLE`: برنامه iOS را به پیش‌زمینه بیاورید (فرمان‌های بوم/دوربین/صفحه‌نمایش به آن نیاز دارند).
- `A2UI_HOST_UNAVAILABLE`: صفحه A2UI همراه در WebView برنامه قابل دسترسی نبود؛ برنامه را در زبانه Screen در پیش‌زمینه نگه دارید و دوباره تلاش کنید.
- اعلان جفت‌سازی هرگز ظاهر نمی‌شود: `openclaw devices list` را اجرا کنید و به‌صورت دستی تأیید کنید.
- اتصال مجدد پس از نصب دوباره شکست می‌خورد: توکن جفت‌سازی Keychain پاک شده است؛ گره را دوباره جفت کنید.

## اسناد مرتبط

- [جفت‌سازی](/fa/channels/pairing)
- [کشف](/fa/gateway/discovery)
- [Bonjour](/fa/gateway/bonjour)
