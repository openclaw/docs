---
read_when:
    - جفت‌سازی یا اتصال مجدد Node iOS
    - اجرای برنامهٔ iOS از کد منبع
    - اشکال‌زدایی از کشف Gateway یا فرمان‌های بوم
summary: 'برنامه Node در iOS: اتصال به Gateway، جفت‌سازی، بوم و عیب‌یابی'
title: برنامه iOS
x-i18n:
    generated_at: "2026-04-29T23:10:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fdbe578f15d2641d1bcb147fee7626486210cceae0cc355a92b3b2dd6291c35
    source_path: platforms/ios.md
    workflow: 16
---

دسترس‌پذیری: پیش‌نمایش داخلی. اپ iOS هنوز به‌صورت عمومی توزیع نشده است.

## چه کاری انجام می‌دهد

- از طریق WebSocket به یک Gateway متصل می‌شود (LAN یا tailnet).
- قابلیت‌های Node را در دسترس می‌گذارد: Canvas، اسنپ‌شات صفحه، ثبت تصویر دوربین، موقعیت مکانی، حالت گفت‌وگو، بیدارباش صوتی.
- فرمان‌های `node.invoke` را دریافت می‌کند و رویدادهای وضعیت Node را گزارش می‌دهد.

## الزامات

- Gateway در حال اجرا روی دستگاهی دیگر (macOS، Linux، یا Windows از طریق WSL2).
- مسیر شبکه:
  - همان LAN از طریق Bonjour، **یا**
  - Tailnet از طریق unicast DNS-SD (نمونه دامنه: `openclaw.internal.`)، **یا**
  - میزبان/پورت دستی (مسیر جایگزین).

## شروع سریع (جفت‌سازی + اتصال)

1. Gateway را شروع کنید:

```bash
openclaw gateway --port 18789
```

2. در اپ iOS، Settings را باز کنید و یک Gateway کشف‌شده را انتخاب کنید (یا Manual Host را فعال کنید و میزبان/پورت را وارد کنید).

3. درخواست جفت‌سازی را روی میزبان Gateway تأیید کنید:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

اگر اپ با جزئیات احراز هویت تغییرکرده (نقش/دامنه‌ها/کلید عمومی) جفت‌سازی را دوباره امتحان کند،
درخواست در انتظار قبلی جایگزین می‌شود و یک `requestId` جدید ساخته می‌شود.
پیش از تأیید، دوباره `openclaw devices list` را اجرا کنید.

اختیاری: اگر Node iOS همیشه از یک زیرشبکه کاملاً کنترل‌شده متصل می‌شود، می‌توانید
با CIDRهای صریح یا IPهای دقیق، تأیید خودکار بار اول Node را فعال کنید:

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
بدون دامنه‌های درخواستی اعمال می‌شود. جفت‌سازی اپراتور/مرورگر و هرگونه تغییر نقش، دامنه، فراداده، یا
کلید عمومی همچنان به تأیید دستی نیاز دارد.

4. اتصال را بررسی کنید:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## push مبتنی بر relay برای بیلدهای رسمی

بیلدهای توزیع‌شده رسمی iOS به‌جای انتشار توکن خام APNs
به Gateway، از relay خارجی push استفاده می‌کنند.

الزام سمت Gateway:

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

- اپ iOS با استفاده از App Attest و یک JWS تراکنش اپ StoreKit در relay ثبت‌نام می‌کند.
- relay یک شناسه relay مبهم به‌همراه یک مجوز ارسال محدود به همان ثبت‌نام برمی‌گرداند.
- اپ iOS هویت Gateway جفت‌شده را دریافت می‌کند و آن را در ثبت‌نام relay قرار می‌دهد، تا ثبت‌نام مبتنی بر relay به همان Gateway مشخص واگذار شود.
- اپ آن ثبت‌نام مبتنی بر relay را با `push.apns.register` به Gateway جفت‌شده ارسال می‌کند.
- Gateway از آن شناسه relay ذخیره‌شده برای `push.test`، بیدارباش‌های پس‌زمینه، و تلنگرهای بیدارباش استفاده می‌کند.
- نشانی پایه relay در Gateway باید با نشانی relay تعبیه‌شده در بیلد رسمی/TestFlight iOS مطابقت داشته باشد.
- اگر اپ بعداً به Gateway دیگری یا بیلدی با نشانی پایه relay متفاوت متصل شود، به‌جای استفاده دوباره از اتصال قدیمی، ثبت‌نام relay را تازه‌سازی می‌کند.

چیزهایی که Gateway برای این مسیر **نیاز ندارد**:

- بدون توکن relay در سطح استقرار.
- بدون کلید مستقیم APNs برای ارسال‌های رسمی/TestFlight مبتنی بر relay.

جریان مورد انتظار اپراتور:

1. بیلد رسمی/TestFlight iOS را نصب کنید.
2. `gateway.push.apns.relay.baseUrl` را روی Gateway تنظیم کنید.
3. اپ را با Gateway جفت کنید و بگذارید اتصال را کامل کند.
4. اپ پس از داشتن توکن APNs، اتصال نشست اپراتور، و موفقیت ثبت‌نام relay، `push.apns.register` را به‌صورت خودکار منتشر می‌کند.
5. پس از آن، `push.test`، بیدارباش‌های اتصال دوباره، و تلنگرهای بیدارباش می‌توانند از ثبت‌نام ذخیره‌شده مبتنی بر relay استفاده کنند.

## beaconهای زنده بودن در پس‌زمینه

وقتی iOS اپ را برای یک push بی‌صدا، تازه‌سازی پس‌زمینه، یا رویداد موقعیت مکانی مهم بیدار می‌کند، اپ
یک اتصال دوباره کوتاه Node را امتحان می‌کند و سپس `node.event` را با `event: "node.presence.alive"` فراخوانی می‌کند.
Gateway فقط پس از مشخص شدن هویت دستگاه Node احراز هویت‌شده، این را به‌عنوان `lastSeenAtMs`/`lastSeenReason` در فراداده Node/دستگاه جفت‌شده ثبت می‌کند.

اپ بیدارباش پس‌زمینه را فقط زمانی با موفقیت ثبت‌شده در نظر می‌گیرد که پاسخ Gateway شامل
`handled: true` باشد. Gatewayهای قدیمی‌تر ممکن است `node.event` را با `{ "ok": true }` تأیید کنند؛ آن پاسخ
سازگار است، اما به‌عنوان به‌روزرسانی پایدار آخرین مشاهده محسوب نمی‌شود.

نکته سازگاری:

- `OPENCLAW_APNS_RELAY_BASE_URL` همچنان به‌عنوان override موقت env برای Gateway کار می‌کند.

## جریان احراز هویت و اعتماد

relay برای اعمال دو محدودیت وجود دارد که APNs مستقیم روی Gateway نمی‌تواند برای
بیلدهای رسمی iOS فراهم کند:

- فقط بیلدهای واقعی OpenClaw iOS که از طریق Apple توزیع شده‌اند می‌توانند از relay میزبانی‌شده استفاده کنند.
- یک Gateway فقط برای دستگاه‌های iOS که با همان Gateway مشخص جفت شده‌اند می‌تواند pushهای مبتنی بر relay ارسال کند.

گام‌به‌گام:

1. `iOS app -> gateway`
   - اپ ابتدا از طریق جریان احراز هویت عادی Gateway با Gateway جفت می‌شود.
   - این کار یک نشست Node احراز هویت‌شده به‌همراه یک نشست اپراتور احراز هویت‌شده به اپ می‌دهد.
   - نشست اپراتور برای فراخوانی `gateway.identity.get` استفاده می‌شود.

2. `iOS app -> relay`
   - اپ endpointهای ثبت‌نام relay را از طریق HTTPS فراخوانی می‌کند.
   - ثبت‌نام شامل گواهی App Attest به‌همراه یک JWS تراکنش اپ StoreKit است.
   - relay شناسه bundle، گواهی App Attest، و گواهی توزیع Apple را اعتبارسنجی می‌کند و مسیر
     توزیع رسمی/production را لازم می‌داند.
   - این همان چیزی است که مانع استفاده بیلدهای محلی Xcode/dev از relay میزبانی‌شده می‌شود. یک بیلد محلی ممکن است
     امضا شده باشد، اما گواهی توزیع رسمی Apple مورد انتظار relay را برآورده نمی‌کند.

3. `gateway identity delegation`
   - پیش از ثبت‌نام relay، اپ هویت Gateway جفت‌شده را از
     `gateway.identity.get` دریافت می‌کند.
   - اپ آن هویت Gateway را در payload ثبت‌نام relay قرار می‌دهد.
   - relay یک شناسه relay و یک مجوز ارسال محدود به ثبت‌نام برمی‌گرداند که به
     آن هویت Gateway واگذار شده‌اند.

4. `gateway -> relay`
   - Gateway شناسه relay و مجوز ارسال دریافتی از `push.apns.register` را ذخیره می‌کند.
   - هنگام `push.test`، بیدارباش‌های اتصال دوباره، و تلنگرهای بیدارباش، Gateway درخواست ارسال را با
     هویت دستگاه خودش امضا می‌کند.
   - relay هم مجوز ارسال ذخیره‌شده و هم امضای Gateway را در برابر هویت
     Gateway واگذارشده از ثبت‌نام بررسی می‌کند.
   - Gateway دیگری نمی‌تواند از آن ثبت‌نام ذخیره‌شده دوباره استفاده کند، حتی اگر somehow آن شناسه را به دست آورد.

5. `relay -> APNs`
   - relay مالک اعتبارنامه‌های production APNs و توکن خام APNs برای بیلد رسمی است.
   - Gateway هرگز توکن خام APNs را برای بیلدهای رسمی مبتنی بر relay ذخیره نمی‌کند.
   - relay، push نهایی را از طرف Gateway جفت‌شده به APNs ارسال می‌کند.

چرایی ایجاد این طراحی:

- برای بیرون نگه داشتن اعتبارنامه‌های production APNs از Gatewayهای کاربر.
- برای پرهیز از ذخیره توکن‌های خام APNs بیلد رسمی روی Gateway.
- برای مجاز کردن استفاده از relay میزبانی‌شده فقط برای بیلدهای رسمی/TestFlight OpenClaw.
- برای جلوگیری از ارسال pushهای بیدارباش از یک Gateway به دستگاه‌های iOS متعلق به Gateway دیگر.

بیلدهای محلی/دستی روی APNs مستقیم باقی می‌مانند. اگر این بیلدها را بدون relay آزمایش می‌کنید،
Gateway همچنان به اعتبارنامه‌های مستقیم APNs نیاز دارد:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

این‌ها متغیرهای env زمان اجرای میزبان Gateway هستند، نه تنظیمات Fastlane. `apps/ios/fastlane/.env` فقط
احراز هویت App Store Connect / TestFlight مانند `ASC_KEY_ID` و `ASC_ISSUER_ID` را ذخیره می‌کند؛ پیکربندی
تحویل مستقیم APNs برای بیلدهای محلی iOS را انجام نمی‌دهد.

ذخیره‌سازی پیشنهادی روی میزبان Gateway:

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

اپ iOS روی `local.`، `_openclaw-gw._tcp` را مرور می‌کند و در صورت پیکربندی، همین کار را برای
دامنه کشف wide-area DNS-SD انجام می‌دهد. Gatewayهای همان LAN به‌صورت خودکار از `local.` ظاهر می‌شوند؛
کشف بین‌شبکه‌ای می‌تواند بدون تغییر نوع beacon از دامنه wide-area پیکربندی‌شده استفاده کند.

### Tailnet (بین‌شبکه‌ای)

اگر mDNS مسدود است، از یک ناحیه unicast DNS-SD استفاده کنید (یک دامنه انتخاب کنید؛ نمونه:
`openclaw.internal.`) و Tailscale split DNS.
برای نمونه CoreDNS، [Bonjour](/fa/gateway/bonjour) را ببینید.

### میزبان/پورت دستی

در Settings، **Manual Host** را فعال کنید و میزبان + پورت Gateway را وارد کنید (پیش‌فرض `18789`).

## Canvas + A2UI

Node iOS یک canvas مبتنی بر WKWebView را رندر می‌کند. برای کنترل آن از `node.invoke` استفاده کنید:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

نکات:

- میزبان canvas در Gateway مسیرهای `/__openclaw__/canvas/` و `/__openclaw__/a2ui/` را سرو می‌کند.
- از سرور HTTP Gateway سرو می‌شود (همان پورت `gateway.port`، پیش‌فرض `18789`).
- وقتی نشانی میزبان canvas اعلام شده باشد، Node iOS هنگام اتصال به‌صورت خودکار به A2UI می‌رود.
- با `canvas.navigate` و `{"url":""}` به اسکفولد داخلی برگردید.

## رابطه با Computer Use

اپ iOS یک سطح Node موبایل است، نه backend مربوط به Codex Computer Use. Codex
Computer Use و `cua-driver mcp` یک دسکتاپ محلی macOS را از طریق ابزارهای MCP
کنترل می‌کنند؛ اپ iOS قابلیت‌های iPhone را از طریق فرمان‌های Node در OpenClaw
مانند `canvas.*`، `camera.*`، `screen.*`، `location.*`، و `talk.*` در دسترس می‌گذارد.

Agents همچنان می‌توانند با فراخوانی فرمان‌های Node، اپ iOS را از طریق OpenClaw
عملیاتی کنند، اما این فراخوانی‌ها از پروتکل Node در Gateway عبور می‌کنند و از محدودیت‌های
پیش‌زمینه/پس‌زمینه iOS پیروی می‌کنند. برای کنترل دسکتاپ محلی از [Codex Computer Use](/fa/plugins/codex-computer-use)
و برای قابلیت‌های Node iOS از این صفحه استفاده کنید.

### ارزیابی / اسنپ‌شات Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## بیدارباش صوتی + حالت گفت‌وگو

- بیدارباش صوتی و حالت گفت‌وگو در Settings در دسترس هستند.
- iOS ممکن است صدای پس‌زمینه را suspend کند؛ وقتی اپ فعال نیست، قابلیت‌های صوتی را best-effort در نظر بگیرید.

## خطاهای رایج

- `NODE_BACKGROUND_UNAVAILABLE`: اپ iOS را به پیش‌زمینه بیاورید (فرمان‌های canvas/camera/screen به آن نیاز دارند).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway نشانی میزبان canvas را اعلام نکرده است؛ `canvasHost` را در [پیکربندی Gateway](/fa/gateway/configuration) بررسی کنید.
- اعلان جفت‌سازی هرگز ظاهر نمی‌شود: `openclaw devices list` را اجرا کنید و دستی تأیید کنید.
- اتصال دوباره پس از نصب مجدد شکست می‌خورد: توکن جفت‌سازی Keychain پاک شده است؛ Node را دوباره جفت کنید.

## مستندات مرتبط

- [جفت‌سازی](/fa/channels/pairing)
- [کشف](/fa/gateway/discovery)
- [Bonjour](/fa/gateway/bonjour)
