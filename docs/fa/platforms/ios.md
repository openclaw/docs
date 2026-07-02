---
read_when:
    - جفت‌سازی یا اتصال دوبارهٔ گره iOS
    - اجرای اپ iOS از سورس
    - اشکال‌زدایی کشف Gateway یا دستورهای canvas
summary: 'برنامه گره iOS: اتصال به Gateway، جفت‌سازی، بوم و عیب‌یابی'
title: برنامه iOS
x-i18n:
    generated_at: "2026-07-02T08:36:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f58f5a3a4c6f918ddca493367554c2df5a34292deeb112296103dce2203743
    source_path: platforms/ios.md
    workflow: 16
---

دسترس‌پذیری: ساخت‌های برنامه iPhone وقتی برای یک انتشار فعال باشند، از طریق کانال‌های Apple توزیع می‌شوند. ساخت‌های توسعه محلی نیز می‌توانند از سورس اجرا شوند.

## کاری که انجام می‌دهد

- از طریق WebSocket به یک Gateway وصل می‌شود (LAN یا tailnet).
- قابلیت‌های گره را ارائه می‌کند: Canvas، عکس فوری Screen، ضبط Camera، Location، حالت Talk، بیدارباش صوتی.
- فرمان‌های `node.invoke` را دریافت می‌کند و رویدادهای وضعیت گره را گزارش می‌دهد.

## الزامات

- Gateway در حال اجرا روی دستگاهی دیگر (macOS، Linux، یا Windows از طریق WSL2).
- مسیر شبکه:
  - همان LAN از طریق Bonjour، **یا**
  - Tailnet از طریق DNS-SD تک‌پخشی (دامنه نمونه: `openclaw.internal.`)، **یا**
  - میزبان/پورت دستی (مسیر جایگزین).

## شروع سریع (جفت‌سازی + اتصال)

1. Gateway را شروع کنید:

```bash
openclaw gateway --port 18789
```

2. در برنامه iOS، Settings را باز کنید و یک gateway کشف‌شده را انتخاب کنید (یا Manual Host را فعال کنید و میزبان/پورت را وارد کنید).

3. درخواست جفت‌سازی را روی میزبان gateway تأیید کنید:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

اگر برنامه جفت‌سازی را با جزئیات احراز هویت تغییرکرده (نقش/محدوده‌ها/کلید عمومی) دوباره امتحان کند،
درخواست در انتظار قبلی جایگزین می‌شود و یک `requestId` جدید ساخته می‌شود.
پیش از تأیید، دوباره `openclaw devices list` را اجرا کنید.

اختیاری: اگر گره iOS همیشه از یک زیرشبکه کاملاً کنترل‌شده وصل می‌شود، می‌توانید
تأیید خودکار بار اول گره را با CIDRهای صریح یا IPهای دقیق فعال کنید:

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

این به‌صورت پیش‌فرض غیرفعال است. فقط برای جفت‌سازی تازه با `role: node` و
بدون محدوده‌های درخواستی اعمال می‌شود. جفت‌سازی operator/browser و هرگونه تغییر نقش، محدوده، فراداده، یا
کلید عمومی همچنان به تأیید دستی نیاز دارد.

4. اتصال را تأیید کنید:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## پوش مبتنی بر relay برای ساخت‌های رسمی

ساخت‌های رسمی توزیع‌شده iOS به‌جای انتشار توکن خام APNs
در gateway، از relay پوش خارجی استفاده می‌کنند.

ساخت‌های رسمی App Store از مسیر انتشار عمومی از relay میزبانی‌شده در `https://ios-push-relay.openclaw.ai` استفاده می‌کنند.

استقرارهای relay سفارشی به یک مسیر ساخت/استقرار iOS عمداً جداگانه نیاز دارند که URL relay آن با URL relay gateway مطابقت داشته باشد. مسیر انتشار عمومی App Store بازنویسی URL relay سفارشی را نمی‌پذیرد. اگر از ساخت relay سفارشی استفاده می‌کنید، URL relay gateway مطابق را تنظیم کنید:

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

نحوه کار جریان:

- برنامه iOS با استفاده از App Attest و یک StoreKit app transaction JWS در relay ثبت‌نام می‌کند.
- relay یک دسته relay مات به‌همراه یک مجوز ارسال محدود به ثبت‌نام برمی‌گرداند.
- برنامه iOS هویت gateway جفت‌شده را دریافت می‌کند و آن را در ثبت‌نام relay قرار می‌دهد، بنابراین ثبت‌نام مبتنی بر relay به همان gateway مشخص واگذار می‌شود.
- برنامه آن ثبت‌نام مبتنی بر relay را با `push.apns.register` به gateway جفت‌شده ارسال می‌کند.
- gateway از آن دسته relay ذخیره‌شده برای `push.test`، بیدارباش‌های پس‌زمینه، و تلنگرهای بیدارباش استفاده می‌کند.
- URLهای relay سفارشی gateway باید با URL relay تعبیه‌شده در ساخت iOS مطابقت داشته باشند.
- اگر برنامه بعداً به gateway دیگری یا ساختی با URL پایه relay متفاوت وصل شود، به‌جای استفاده دوباره از اتصال قدیمی، ثبت‌نام relay را تازه‌سازی می‌کند.

آنچه gateway برای این مسیر **نیاز ندارد**:

- بدون توکن relay در سطح استقرار.
- بدون کلید مستقیم APNs برای ارسال‌های رسمی App Store مبتنی بر relay.

جریان مورد انتظار operator:

1. برنامه رسمی iOS را نصب کنید.
2. اختیاری: `gateway.push.apns.relay.baseUrl` را روی gateway فقط زمانی تنظیم کنید که از یک ساخت relay سفارشی عمداً جداگانه استفاده می‌کنید.
3. برنامه را با gateway جفت کنید و اجازه دهید اتصال کامل شود.
4. برنامه پس از داشتن توکن APNs، وصل بودن نشست operator، و موفقیت ثبت‌نام relay، `push.apns.register` را به‌صورت خودکار منتشر می‌کند.
5. پس از آن، `push.test`، بیدارباش‌های اتصال مجدد، و تلنگرهای بیدارباش می‌توانند از ثبت‌نام ذخیره‌شده مبتنی بر relay استفاده کنند.

## beaconهای زنده پس‌زمینه

وقتی iOS برنامه را برای پوش بی‌صدا، تازه‌سازی پس‌زمینه، یا رویداد مکان مهم بیدار می‌کند، برنامه
یک اتصال مجدد کوتاه گره را امتحان می‌کند و سپس `node.event` را با `event: "node.presence.alive"` فراخوانی می‌کند.
gateway این را فقط پس از مشخص شدن هویت احراز هویت‌شده دستگاه گره، به‌عنوان `lastSeenAtMs`/`lastSeenReason` روی فراداده گره/دستگاه جفت‌شده ثبت می‌کند.

برنامه بیدارباش پس‌زمینه را فقط زمانی با موفقیت ثبت‌شده در نظر می‌گیرد که پاسخ gateway شامل
`handled: true` باشد. gatewayهای قدیمی‌تر ممکن است `node.event` را با `{ "ok": true }` تأیید کنند؛ آن پاسخ
سازگار است اما به‌عنوان به‌روزرسانی پایدار آخرین مشاهده‌شده محاسبه نمی‌شود.

نکته سازگاری:

- `OPENCLAW_APNS_RELAY_BASE_URL` همچنان به‌عنوان بازنویسی env موقت برای gateway کار می‌کند.
- مسیر انتشار عمومی App Store مقدار `OPENCLAW_PUSH_RELAY_BASE_URL` را برای ساخت‌های iOS رد می‌کند.

## جریان احراز هویت و اعتماد

relay وجود دارد تا دو محدودیت را اعمال کند که APNs مستقیم روی gateway نمی‌تواند برای
ساخت‌های رسمی iOS فراهم کند:

- فقط ساخت‌های واقعی OpenClaw iOS که از طریق Apple توزیع شده‌اند می‌توانند از relay میزبانی‌شده استفاده کنند.
- یک gateway فقط برای دستگاه‌های iOS که با همان gateway مشخص جفت شده‌اند می‌تواند پوش‌های مبتنی بر relay ارسال کند.

گام‌به‌گام:

1. `iOS app -> gateway`
   - برنامه ابتدا از طریق جریان احراز هویت معمول Gateway با gateway جفت می‌شود.
   - این به برنامه یک نشست گره احراز هویت‌شده به‌همراه یک نشست operator احراز هویت‌شده می‌دهد.
   - نشست operator برای فراخوانی `gateway.identity.get` استفاده می‌شود.

2. `iOS app -> relay`
   - برنامه endpointهای ثبت‌نام relay را از طریق HTTPS فراخوانی می‌کند.
   - ثبت‌نام شامل اثبات App Attest به‌همراه یک StoreKit app transaction JWS است.
   - relay شناسه bundle، اثبات App Attest، و اثبات توزیع Apple را اعتبارسنجی می‌کند و به
     مسیر توزیع رسمی/production نیاز دارد.
   - این همان چیزی است که ساخت‌های محلی Xcode/dev را از استفاده از relay میزبانی‌شده مسدود می‌کند. یک ساخت محلی ممکن است
     امضا شده باشد، اما اثبات توزیع رسمی Apple مورد انتظار relay را برآورده نمی‌کند.

3. `gateway identity delegation`
   - پیش از ثبت‌نام relay، برنامه هویت gateway جفت‌شده را از
     `gateway.identity.get` دریافت می‌کند.
   - برنامه آن هویت gateway را در payload ثبت‌نام relay قرار می‌دهد.
   - relay یک دسته relay و یک مجوز ارسال محدود به ثبت‌نام برمی‌گرداند که به
     آن هویت gateway واگذار شده‌اند.

4. `gateway -> relay`
   - gateway دسته relay و مجوز ارسال را از `push.apns.register` ذخیره می‌کند.
   - در `push.test`، بیدارباش‌های اتصال مجدد، و تلنگرهای بیدارباش، gateway درخواست ارسال را با
     هویت دستگاه خودش امضا می‌کند.
   - relay هم مجوز ارسال ذخیره‌شده و هم امضای gateway را در برابر هویت
     gateway واگذارشده از ثبت‌نام اعتبارسنجی می‌کند.
   - gateway دیگری نمی‌تواند از آن ثبت‌نام ذخیره‌شده دوباره استفاده کند، حتی اگر به‌نوعی دسته را به دست آورد.

5. `relay -> APNs`
   - relay مالک اعتبارنامه‌های APNs production و توکن خام APNs برای ساخت رسمی است.
   - gateway هرگز توکن خام APNs را برای ساخت‌های رسمی مبتنی بر relay ذخیره نمی‌کند.
   - relay پوش نهایی را از طرف gateway جفت‌شده به APNs ارسال می‌کند.

دلیل ایجاد این طراحی:

- برای خارج نگه داشتن اعتبارنامه‌های APNs production از gatewayهای کاربران.
- برای پرهیز از ذخیره توکن‌های خام APNs ساخت رسمی روی gateway.
- برای مجاز کردن استفاده از relay میزبانی‌شده فقط برای ساخت‌های رسمی OpenClaw iOS.
- برای جلوگیری از ارسال پوش‌های بیدارباش از یک gateway به دستگاه‌های iOS متعلق به gateway دیگر.

ساخت‌های محلی/دستی روی APNs مستقیم باقی می‌مانند. اگر این ساخت‌ها را بدون relay آزمایش می‌کنید،
gateway همچنان به اعتبارنامه‌های مستقیم APNs نیاز دارد:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

این‌ها env varهای زمان اجرای میزبان gateway هستند، نه تنظیمات Fastlane. `apps/ios/fastlane/.env` فقط
احراز هویت App Store Connect مانند `APP_STORE_CONNECT_KEY_ID` و
`APP_STORE_CONNECT_ISSUER_ID` را ذخیره می‌کند؛ تحویل مستقیم APNs را برای ساخت‌های محلی iOS پیکربندی نمی‌کند.

ذخیره‌سازی پیشنهادی میزبان gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

فایل `.p8` را commit نکنید و آن را زیر checkout repo قرار ندهید.

## مسیرهای کشف

### Bonjour (LAN)

برنامه iOS در `_openclaw-gw._tcp` روی `local.` و، وقتی پیکربندی شده باشد، همان
دامنه کشف DNS-SD گسترده را مرور می‌کند. gatewayهای همان LAN به‌صورت خودکار از `local.` ظاهر می‌شوند؛
کشف بین‌شبکه‌ای می‌تواند بدون تغییر نوع beacon از دامنه گسترده پیکربندی‌شده استفاده کند.

### Tailnet (بین‌شبکه‌ای)

اگر mDNS مسدود است، از یک zone تک‌پخشی DNS-SD استفاده کنید (یک دامنه انتخاب کنید؛ نمونه:
`openclaw.internal.`) و Tailscale split DNS.
برای نمونه CoreDNS، [Bonjour](/fa/gateway/bonjour) را ببینید.

### میزبان/پورت دستی

در Settings، **Manual Host** را فعال کنید و میزبان gateway + پورت را وارد کنید (پیش‌فرض `18789`).

## Canvas + A2UI

گره iOS یک canvas مبتنی بر WKWebView را رندر می‌کند. برای هدایت آن از `node.invoke` استفاده کنید:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

نکات:

- میزبان canvas در Gateway مسیرهای `/__openclaw__/canvas/` و `/__openclaw__/a2ui/` را ارائه می‌کند.
- از سرور HTTP مربوط به Gateway ارائه می‌شود (همان پورت `gateway.port`، پیش‌فرض `18789`).
- گره iOS scaffold داخلی را به‌عنوان نمای پیش‌فرض متصل نگه می‌دارد. `canvas.a2ui.push` و `canvas.a2ui.reset` از صفحه A2UI همراه و متعلق به برنامه استفاده می‌کنند.
- صفحه‌های A2UI مربوط به Gateway راه‌دور روی iOS فقط برای رندر هستند؛ کنش‌های دکمه native A2UI فقط از صفحه‌های همراه و متعلق به برنامه پذیرفته می‌شوند.
- با `canvas.navigate` و `{"url":""}` به scaffold داخلی برگردید.

## رابطه با Computer Use

برنامه iOS یک سطح گره موبایل است، نه backend برای Codex Computer Use. Codex
Computer Use و `cua-driver mcp` یک دسکتاپ محلی macOS را از طریق ابزارهای MCP
کنترل می‌کنند؛ برنامه iOS قابلیت‌های iPhone را از طریق فرمان‌های گره OpenClaw
مانند `canvas.*`، `camera.*`، `screen.*`، `location.*`، و `talk.*` ارائه می‌کند.

Agentها همچنان می‌توانند با فراخوانی فرمان‌های گره، برنامه iOS را از طریق OpenClaw
به کار بگیرند، اما آن فراخوانی‌ها از پروتکل گره gateway عبور می‌کنند و از محدودیت‌های
پیش‌زمینه/پس‌زمینه iOS پیروی می‌کنند. برای کنترل دسکتاپ محلی از [Codex Computer Use](/fa/plugins/codex-computer-use)
و برای قابلیت‌های گره iOS از این صفحه استفاده کنید.

### ارزیابی / عکس فوری Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## بیدارباش صوتی + حالت talk

- بیدارباش صوتی و حالت talk در Settings در دسترس هستند.
- گره‌های iOS دارای قابلیت talk، قابلیت `talk` را تبلیغ می‌کنند و می‌توانند
  `talk.ptt.start`، `talk.ptt.stop`، `talk.ptt.cancel`، و `talk.ptt.once` را اعلام کنند؛
  Gateway به‌صورت پیش‌فرض این فرمان‌های push-to-talk را برای گره‌های قابل‌اعتماد
  دارای قابلیت Talk مجاز می‌کند.
- iOS ممکن است صدای پس‌زمینه را تعلیق کند؛ وقتی برنامه فعال نیست، قابلیت‌های صوتی را best-effort در نظر بگیرید.

## خطاهای رایج

- `NODE_BACKGROUND_UNAVAILABLE`: برنامه iOS را به پیش‌زمینه بیاورید (فرمان‌های canvas/camera/screen به آن نیاز دارند).
- `A2UI_HOST_UNAVAILABLE`: صفحه A2UI همراه در WebView برنامه قابل دسترسی نبود؛ برنامه را روی زبانه Screen در پیش‌زمینه نگه دارید و دوباره تلاش کنید.
- اعلان جفت‌سازی هرگز ظاهر نمی‌شود: `openclaw devices list` را اجرا کنید و به‌صورت دستی تأیید کنید.
- اتصال مجدد پس از نصب دوباره شکست می‌خورد: توکن جفت‌سازی Keychain پاک شده است؛ گره را دوباره جفت کنید.

## مستندات مرتبط

- [جفت‌سازی](/fa/channels/pairing)
- [کشف](/fa/gateway/discovery)
- [Bonjour](/fa/gateway/bonjour)
