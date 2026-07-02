---
read_when:
    - جفت‌سازی یا اتصال مجدد گره iOS
    - اجرای اپلیکیشن iOS از کد منبع
    - اشکال‌زدایی کشف Gateway یا دستورات بوم
summary: 'برنامه گره iOS: اتصال به Gateway، جفت‌سازی، بوم و عیب‌یابی'
title: برنامه iOS
x-i18n:
    generated_at: "2026-07-02T22:41:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 150349a06488ecb36a4456d323738cca329c47d83ef6006e6f8de5e39ebb4902
    source_path: platforms/ios.md
    workflow: 16
---

دسترس‌پذیری: بیلدهای اپ iPhone وقتی برای یک انتشار فعال شده باشند از طریق کانال‌های Apple توزیع می‌شوند. بیلدهای توسعه محلی نیز می‌توانند از سورس اجرا شوند.

## چه کاری انجام می‌دهد

- از طریق WebSocket به یک Gateway متصل می‌شود (LAN یا tailnet).
- قابلیت‌های نود را ارائه می‌کند: Canvas، اسکرین‌شات صفحه، ثبت تصویر دوربین، موقعیت مکانی، حالت Talk، بیدارباش صوتی.
- فرمان‌های `node.invoke` را دریافت می‌کند و رویدادهای وضعیت نود را گزارش می‌دهد.

## نیازمندی‌ها

- Gateway در حال اجرا روی دستگاهی دیگر (macOS، Linux، یا Windows از طریق WSL2).
- مسیر شبکه:
  - همان LAN از طریق Bonjour، **یا**
  - Tailnet از طریق DNS-SD تک‌پخشی (دامنه نمونه: `openclaw.internal.`)، **یا**
  - میزبان/پورت دستی (گزینه جایگزین).

## شروع سریع (جفت‌سازی + اتصال)

1. Gateway را شروع کنید:

```bash
openclaw gateway --port 18789
```

2. در اپ iOS، Settings را باز کنید و یک gateway کشف‌شده را انتخاب کنید (یا Manual Host را فعال کنید و میزبان/پورت را وارد کنید).

3. درخواست جفت‌سازی را روی میزبان gateway تأیید کنید:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

اگر اپ جفت‌سازی را با جزئیات احراز هویت تغییرکرده (نقش/دامنه‌ها/کلید عمومی) دوباره امتحان کند،
درخواست در انتظار قبلی جایگزین می‌شود و یک `requestId` جدید ایجاد می‌شود.
پیش از تأیید، دوباره `openclaw devices list` را اجرا کنید.

اختیاری: اگر نود iOS همیشه از یک زیرشبکه به‌شدت کنترل‌شده متصل می‌شود، می‌توانید
با CIDRهای صریح یا IPهای دقیق، تأیید خودکار نود برای بار اول را فعال کنید:

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

این به‌طور پیش‌فرض غیرفعال است. فقط برای جفت‌سازی تازه با `role: node` و
بدون دامنه‌های درخواستی اعمال می‌شود. جفت‌سازی اپراتور/مرورگر و هر تغییر در نقش، دامنه، فراداده یا
کلید عمومی همچنان به تأیید دستی نیاز دارد.

4. اتصال را تأیید کنید:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## پوش مبتنی بر رله برای بیلدهای رسمی

بیلدهای رسمی توزیع‌شده iOS به‌جای انتشار توکن خام APNs
برای gateway، از رله پوش خارجی استفاده می‌کنند.

بیلدهای رسمی App Store از مسیر انتشار عمومی از رله میزبانی‌شده در `https://ios-push-relay.openclaw.ai` استفاده می‌کنند.

استقرارهای رله سفارشی به مسیر بیلد/استقرار iOS عمداً جداگانه‌ای نیاز دارند که URL رله آن با URL رله gateway مطابقت داشته باشد. مسیر انتشار عمومی App Store بازنویسی‌های URL رله سفارشی را نمی‌پذیرد. اگر از بیلد رله سفارشی استفاده می‌کنید، URL رله مطابق gateway را تنظیم کنید:

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

این جریان چگونه کار می‌کند:

- اپ iOS با استفاده از App Attest و JWS تراکنش اپ StoreKit در رله ثبت‌نام می‌کند.
- رله یک هندل رله مات به‌همراه یک مجوز ارسال محدود به ثبت‌نام برمی‌گرداند.
- اپ iOS هویت gateway جفت‌شده را واکشی می‌کند و آن را در ثبت‌نام رله می‌گنجاند، بنابراین ثبت‌نام مبتنی بر رله به همان gateway مشخص واگذار می‌شود.
- اپ آن ثبت‌نام مبتنی بر رله را با `push.apns.register` به gateway جفت‌شده ارسال می‌کند.
- gateway از آن هندل رله ذخیره‌شده برای `push.test`، بیدارباش‌های پس‌زمینه، و تلنگرهای بیدارباش استفاده می‌کند.
- URLهای رله gateway سفارشی باید با URL رله‌ای که در بیلد iOS تعبیه شده است مطابقت داشته باشند.
- اگر اپ بعداً به gateway دیگری یا بیلدی با URL پایه رله متفاوت متصل شود، به‌جای استفاده مجدد از اتصال قدیمی، ثبت‌نام رله را تازه‌سازی می‌کند.

چیزهایی که gateway برای این مسیر **نیاز ندارد**:

- بدون توکن رله در سطح استقرار.
- بدون کلید مستقیم APNs برای ارسال‌های رسمی App Store مبتنی بر رله.

جریان مورد انتظار اپراتور:

1. اپ رسمی iOS را نصب کنید.
2. اختیاری: فقط هنگام استفاده از بیلد رله سفارشی عمداً جداگانه، `gateway.push.apns.relay.baseUrl` را روی gateway تنظیم کنید.
3. اپ را با gateway جفت کنید و اجازه دهید اتصال را کامل کند.
4. اپ پس از داشتن توکن APNs، اتصال نشست اپراتور، و موفقیت ثبت‌نام رله، `push.apns.register` را به‌طور خودکار منتشر می‌کند.
5. پس از آن، `push.test`، بیدارباش‌های اتصال مجدد، و تلنگرهای بیدارباش می‌توانند از ثبت‌نام ذخیره‌شده مبتنی بر رله استفاده کنند.

## بیکن‌های زنده پس‌زمینه

وقتی iOS اپ را برای پوش بی‌صدا، تازه‌سازی پس‌زمینه، یا رویداد موقعیت مکانی مهم بیدار می‌کند، اپ
تلاش می‌کند یک اتصال مجدد کوتاه نود انجام دهد و سپس `node.event` را با `event: "node.presence.alive"` فراخوانی می‌کند.
gateway این را فقط پس از شناخته‌شدن هویت دستگاه نود احرازشده، به‌عنوان `lastSeenAtMs`/`lastSeenReason` روی فراداده نود/دستگاه جفت‌شده ثبت می‌کند.

اپ یک بیدارباش پس‌زمینه را فقط زمانی با موفقیت ثبت‌شده تلقی می‌کند که پاسخ gateway شامل
`handled: true` باشد. gatewayهای قدیمی‌تر ممکن است `node.event` را با `{ "ok": true }` تأیید کنند؛ آن پاسخ
سازگار است، اما به‌عنوان به‌روزرسانی پایدار آخرین مشاهده محسوب نمی‌شود.

یادداشت سازگاری:

- `OPENCLAW_APNS_RELAY_BASE_URL` همچنان به‌عنوان بازنویسی موقت env برای gateway کار می‌کند.
- مسیر انتشار عمومی App Store، `OPENCLAW_PUSH_RELAY_BASE_URL` را برای بیلدهای iOS رد می‌کند.

## احراز هویت و جریان اعتماد

رله برای اعمال دو محدودیت وجود دارد که APNs مستقیم روی gateway برای
بیلدهای رسمی iOS نمی‌تواند فراهم کند:

- فقط بیلدهای واقعی OpenClaw iOS که از طریق Apple توزیع شده‌اند می‌توانند از رله میزبانی‌شده استفاده کنند.
- یک gateway فقط می‌تواند برای دستگاه‌های iOS که با همان gateway مشخص
  جفت شده‌اند پوش‌های مبتنی بر رله ارسال کند.

گام‌به‌گام:

1. `iOS app -> gateway`
   - اپ ابتدا از طریق جریان عادی احراز هویت Gateway با gateway جفت می‌شود.
   - این کار به اپ یک نشست نود احرازشده به‌همراه یک نشست اپراتور احرازشده می‌دهد.
   - نشست اپراتور برای فراخوانی `gateway.identity.get` استفاده می‌شود.

2. `iOS app -> relay`
   - اپ endpointهای ثبت‌نام رله را از طریق HTTPS فراخوانی می‌کند.
   - ثبت‌نام شامل اثبات App Attest به‌همراه JWS تراکنش اپ StoreKit است.
   - رله شناسه بسته، اثبات App Attest، و اثبات توزیع Apple را اعتبارسنجی می‌کند و به
     مسیر توزیع رسمی/production نیاز دارد.
   - این همان چیزی است که بیلدهای محلی Xcode/dev را از استفاده از رله میزبانی‌شده مسدود می‌کند. یک بیلد محلی ممکن است
     امضا شده باشد، اما اثبات توزیع رسمی Apple مورد انتظار رله را برآورده نمی‌کند.

3. `gateway identity delegation`
   - پیش از ثبت‌نام رله، اپ هویت gateway جفت‌شده را از
     `gateway.identity.get` واکشی می‌کند.
   - اپ آن هویت gateway را در payload ثبت‌نام رله قرار می‌دهد.
   - رله یک هندل رله و یک مجوز ارسال محدود به ثبت‌نام برمی‌گرداند که به
     آن هویت gateway واگذار شده‌اند.

4. `gateway -> relay`
   - gateway هندل رله و مجوز ارسال را از `push.apns.register` ذخیره می‌کند.
   - در `push.test`، بیدارباش‌های اتصال مجدد، و تلنگرهای بیدارباش، gateway درخواست ارسال را با
     هویت دستگاه خودش امضا می‌کند.
   - رله هم مجوز ارسال ذخیره‌شده و هم امضای gateway را در برابر هویت
     gateway واگذارشده از ثبت‌نام راستی‌آزمایی می‌کند.
   - gateway دیگر نمی‌تواند از آن ثبت‌نام ذخیره‌شده دوباره استفاده کند، حتی اگر به‌نحوی هندل را به‌دست آورد.

5. `relay -> APNs`
   - رله مالک اعتبارنامه‌های production APNs و توکن خام APNs برای بیلد رسمی است.
   - gateway هرگز توکن خام APNs را برای بیلدهای رسمی مبتنی بر رله ذخیره نمی‌کند.
   - رله پوش نهایی را از طرف gateway جفت‌شده به APNs ارسال می‌کند.

چرا این طراحی ایجاد شد:

- برای دور نگه داشتن اعتبارنامه‌های production APNs از gatewayهای کاربر.
- برای جلوگیری از ذخیره توکن‌های خام APNs بیلد رسمی روی gateway.
- برای اجازه دادن به استفاده از رله میزبانی‌شده فقط برای بیلدهای رسمی OpenClaw iOS.
- برای جلوگیری از اینکه یک gateway به دستگاه‌های iOS متعلق به gateway دیگر پوش بیدارباش ارسال کند.

بیلدهای محلی/دستی روی APNs مستقیم باقی می‌مانند. اگر آن بیلدها را بدون رله آزمایش می‌کنید،
gateway همچنان به اعتبارنامه‌های مستقیم APNs نیاز دارد:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

این‌ها متغیرهای env زمان اجرای میزبان gateway هستند، نه تنظیمات Fastlane. `apps/ios/fastlane/.env` فقط
احراز هویت App Store Connect مانند `APP_STORE_CONNECT_KEY_ID` و
`APP_STORE_CONNECT_ISSUER_ID` را ذخیره می‌کند؛ تحویل مستقیم APNs برای بیلدهای محلی iOS را پیکربندی نمی‌کند.

ذخیره‌سازی پیشنهادی میزبان gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

فایل `.p8` را commit نکنید یا آن را زیر checkout مخزن قرار ندهید.

## مسیرهای کشف

### Bonjour (LAN)

اپ iOS روی `local.` و، در صورت پیکربندی، همان
دامنه کشف wide-area DNS-SD، `_openclaw-gw._tcp` را مرور می‌کند. gatewayهای همان LAN به‌طور خودکار از `local.` ظاهر می‌شوند؛
کشف بین‌شبکه‌ای می‌تواند بدون تغییر نوع بیکن از دامنه wide-area پیکربندی‌شده استفاده کند.

### Tailnet (بین‌شبکه‌ای)

اگر mDNS مسدود شده باشد، از یک ناحیه DNS-SD تک‌پخشی استفاده کنید (یک دامنه انتخاب کنید؛ نمونه:
`openclaw.internal.`) و split DNS در Tailscale.
برای نمونه CoreDNS به [Bonjour](/fa/gateway/bonjour) مراجعه کنید.

### میزبان/پورت دستی

در Settings، **Manual Host** را فعال کنید و میزبان gateway + پورت را وارد کنید (پیش‌فرض `18789`).

## Canvas + A2UI

نود iOS یک canvas مبتنی بر WKWebView را رندر می‌کند. برای هدایت آن از `node.invoke` استفاده کنید:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

نکته‌ها:

- میزبان canvas در Gateway، `/__openclaw__/canvas/` و `/__openclaw__/a2ui/` را سرو می‌کند.
- از سرور HTTP در Gateway سرو می‌شود (همان پورت `gateway.port`، پیش‌فرض `18789`).
- نود iOS scaffold داخلی را به‌عنوان نمای پیش‌فرض متصل نگه می‌دارد. `canvas.a2ui.push` و `canvas.a2ui.reset` از صفحه A2UI بسته‌بندی‌شده متعلق به اپ استفاده می‌کنند.
- صفحه‌های A2UI ریموت Gateway در iOS فقط رندر می‌شوند؛ اکشن‌های دکمه بومی A2UI فقط از صفحه‌های بسته‌بندی‌شده متعلق به اپ پذیرفته می‌شوند.
- با `canvas.navigate` و `{"url":""}` به scaffold داخلی برگردید.

## رابطه Computer Use

اپ iOS یک سطح نود موبایل است، نه backend برای Codex Computer Use. Codex
Computer Use و `cua-driver mcp` یک دسکتاپ محلی macOS را از طریق ابزارهای MCP
کنترل می‌کنند؛ اپ iOS قابلیت‌های iPhone را از طریق فرمان‌های نود OpenClaw
مانند `canvas.*`، `camera.*`، `screen.*`، `location.*`، و `talk.*` ارائه می‌کند.

عامل‌ها همچنان می‌توانند اپ iOS را از طریق OpenClaw با فراخوانی فرمان‌های نود
به‌کار بگیرند، اما این فراخوانی‌ها از طریق پروتکل نود gateway عبور می‌کنند و از محدودیت‌های
پیش‌زمینه/پس‌زمینه iOS پیروی می‌کنند. برای کنترل دسکتاپ محلی از [Codex Computer Use](/fa/plugins/codex-computer-use)
و برای قابلیت‌های نود iOS از این صفحه استفاده کنید.

### ارزیابی / اسنپ‌شات Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## بیدارباش صوتی + حالت Talk

- بیدارباش صوتی و حالت Talk در Settings در دسترس هستند.
- OpenAI realtime Talk وقتی `talk.realtime.transport` برابر `webrtc` باشد از WebRTC متعلق به کلاینت استفاده می‌کند؛ پیکربندی صریح `gateway-relay` همچنان متعلق به Gateway است. به [حالت Talk](/fa/nodes/talk) مراجعه کنید.
- نودهای iOS دارای قابلیت Talk، قابلیت `talk` را اعلام می‌کنند و می‌توانند
  `talk.ptt.start`، `talk.ptt.stop`، `talk.ptt.cancel`، و `talk.ptt.once` را اعلام کنند؛
  Gateway این فرمان‌های push-to-talk را به‌طور پیش‌فرض برای نودهای قابل اعتماد
  دارای قابلیت Talk مجاز می‌کند.
- iOS ممکن است صدای پس‌زمینه را تعلیق کند؛ وقتی اپ فعال نیست، با قابلیت‌های صوتی به‌عنوان بهترین تلاش رفتار کنید.

## خطاهای رایج

- `NODE_BACKGROUND_UNAVAILABLE`: اپ iOS را به پیش‌زمینه بیاورید (فرمان‌های canvas/camera/screen به آن نیاز دارند).
- `A2UI_HOST_UNAVAILABLE`: صفحه A2UI بسته‌بندی‌شده در WebView اپ قابل دسترسی نبود؛ اپ را روی زبانه Screen در پیش‌زمینه نگه دارید و دوباره تلاش کنید.
- اعلان جفت‌سازی هرگز ظاهر نمی‌شود: `openclaw devices list` را اجرا کنید و دستی تأیید کنید.
- اتصال مجدد پس از نصب دوباره شکست می‌خورد: توکن جفت‌سازی Keychain پاک شده است؛ نود را دوباره جفت کنید.

## مستندات مرتبط

- [جفت‌سازی](/fa/channels/pairing)
- [کشف](/fa/gateway/discovery)
- [Bonjour](/fa/gateway/bonjour)
