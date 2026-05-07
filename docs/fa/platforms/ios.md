---
read_when:
    - جفت‌سازی یا اتصال مجدد Node iOS
    - اجرای برنامهٔ iOS از کد منبع
    - اشکال‌زدایی کشف Gateway یا دستورهای canvas
summary: 'برنامه node در iOS: اتصال به Gateway، جفت‌سازی، بوم، و عیب‌یابی'
title: اپلیکیشن iOS
x-i18n:
    generated_at: "2026-05-07T13:25:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 707f8b97156e800f89bc00265c1889c9cbade347fde35f037a302065956346f4
    source_path: platforms/ios.md
    workflow: 16
---

دسترس‌پذیری: پیش‌نمایش داخلی. برنامه iOS هنوز به‌صورت عمومی توزیع نشده است.

## چه کاری انجام می‌دهد

- از طریق WebSocket به یک Gateway متصل می‌شود (LAN یا tailnet).
- قابلیت‌های node را ارائه می‌کند: Canvas، نماگرفت Screen، تصویربرداری Camera، Location، حالت Talk، بیدارباش Voice.
- فرمان‌های `node.invoke` را دریافت می‌کند و رویدادهای وضعیت node را گزارش می‌دهد.

## الزامات

- Gateway در حال اجرا روی دستگاهی دیگر (macOS، Linux، یا Windows از طریق WSL2).
- مسیر شبکه:
  - همان LAN از طریق Bonjour، **یا**
  - Tailnet از طریق unicast DNS-SD (دامنه نمونه: `openclaw.internal.`)، **یا**
  - میزبان/درگاه دستی (جایگزین).

## شروع سریع (جفت‌سازی + اتصال)

1. Gateway را شروع کنید:

```bash
openclaw gateway --port 18789
```

2. در برنامه iOS، Settings را باز کنید و یک gateway کشف‌شده را انتخاب کنید (یا Manual Host را فعال کنید و host/port را وارد کنید).

3. درخواست جفت‌سازی را روی میزبان gateway تأیید کنید:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

اگر برنامه با جزئیات احراز هویت تغییرکرده (نقش/دامنه‌ها/کلید عمومی) دوباره برای جفت‌سازی تلاش کند،
درخواست در انتظار قبلی جایگزین می‌شود و یک `requestId` جدید ساخته می‌شود.
پیش از تأیید، دوباره `openclaw devices list` را اجرا کنید.

اختیاری: اگر node iOS همیشه از یک زیرشبکه کاملاً کنترل‌شده متصل می‌شود، می‌توانید
تأیید خودکار node در اولین اتصال را با CIDRهای صریح یا IPهای دقیق فعال کنید:

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
بدون دامنه‌های درخواستی اعمال می‌شود. جفت‌سازی operator/browser و هرگونه تغییر در نقش، دامنه، فراداده یا
کلید عمومی همچنان به تأیید دستی نیاز دارد.

4. اتصال را تأیید کنید:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## پوش مبتنی بر relay برای buildهای رسمی

buildهای رسمی توزیع‌شده iOS به‌جای انتشار token خام APNs
به gateway، از relay پوش خارجی استفاده می‌کنند.

نیازمندی سمت Gateway:

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

جریان کار چگونه عمل می‌کند:

- برنامه iOS با استفاده از App Attest و JWS تراکنش برنامه StoreKit در relay ثبت‌نام می‌کند.
- relay یک شناسه relay مبهم به‌همراه یک مجوز ارسال محدود به ثبت‌نام برمی‌گرداند.
- برنامه iOS هویت gateway جفت‌شده را دریافت می‌کند و آن را در ثبت‌نام relay می‌گنجاند، بنابراین ثبت‌نام مبتنی بر relay به همان gateway مشخص واگذار می‌شود.
- برنامه آن ثبت‌نام مبتنی بر relay را با `push.apns.register` به gateway جفت‌شده ارسال می‌کند.
- gateway از آن شناسه relay ذخیره‌شده برای `push.test`، بیدارباش‌های پس‌زمینه و اشاره‌های بیدارباش استفاده می‌کند.
- URL پایه relay در gateway باید با URL relay تعبیه‌شده در build رسمی/TestFlight iOS مطابقت داشته باشد.
- اگر برنامه بعداً به gateway دیگری یا buildی با URL پایه relay متفاوت متصل شود، به‌جای استفاده دوباره از اتصال قدیمی، ثبت‌نام relay را تازه‌سازی می‌کند.

آنچه gateway برای این مسیر **نیاز ندارد**:

- بدون token relay در سطح استقرار.
- بدون کلید مستقیم APNs برای ارسال‌های رسمی/TestFlight مبتنی بر relay.

جریان مورد انتظار operator:

1. build رسمی/TestFlight iOS را نصب کنید.
2. `gateway.push.apns.relay.baseUrl` را روی gateway تنظیم کنید.
3. برنامه را با gateway جفت کنید و اجازه دهید اتصالش کامل شود.
4. برنامه پس از داشتن token APNs، متصل بودن نشست operator، و موفقیت ثبت‌نام relay، `push.apns.register` را به‌صورت خودکار منتشر می‌کند.
5. پس از آن، `push.test`، بیدارباش‌های اتصال مجدد، و اشاره‌های بیدارباش می‌توانند از ثبت‌نام ذخیره‌شده مبتنی بر relay استفاده کنند.

## beaconهای زنده‌بودن در پس‌زمینه

وقتی iOS برنامه را برای پوش بی‌صدا، refresh پس‌زمینه، یا رویداد significant-location بیدار می‌کند، برنامه
یک اتصال مجدد کوتاه node را امتحان می‌کند و سپس `node.event` را با `event: "node.presence.alive"` فراخوانی می‌کند.
gateway این را فقط پس از مشخص شدن هویت دستگاه node احرازشده، به‌عنوان `lastSeenAtMs`/`lastSeenReason` در فراداده node/device جفت‌شده ثبت می‌کند.

برنامه یک بیدارباش پس‌زمینه را فقط زمانی با موفقیت ثبت‌شده در نظر می‌گیرد که پاسخ gateway شامل
`handled: true` باشد. gatewayهای قدیمی‌تر ممکن است `node.event` را با `{ "ok": true }` تأیید کنند؛ آن پاسخ
سازگار است اما به‌عنوان یک به‌روزرسانی پایدار last-seen محسوب نمی‌شود.

نکته سازگاری:

- `OPENCLAW_APNS_RELAY_BASE_URL` همچنان به‌عنوان override موقت env برای gateway کار می‌کند.

## جریان احراز هویت و اعتماد

relay برای اعمال دو محدودیتی وجود دارد که APNs مستقیم روی gateway نمی‌تواند برای
buildهای رسمی iOS فراهم کند:

- فقط buildهای واقعی OpenClaw iOS که از طریق Apple توزیع شده‌اند می‌توانند از relay میزبانی‌شده استفاده کنند.
- یک gateway فقط برای دستگاه‌های iOS که با همان gateway مشخص جفت شده‌اند می‌تواند pushهای مبتنی بر relay ارسال کند.

گام‌به‌گام:

1. `iOS app -> gateway`
   - برنامه ابتدا از طریق جریان عادی احراز هویت Gateway با gateway جفت می‌شود.
   - این کار به برنامه یک نشست node احرازشده به‌همراه یک نشست operator احرازشده می‌دهد.
   - نشست operator برای فراخوانی `gateway.identity.get` استفاده می‌شود.

2. `iOS app -> relay`
   - برنامه endpointهای ثبت‌نام relay را از طریق HTTPS فراخوانی می‌کند.
   - ثبت‌نام شامل اثبات App Attest به‌همراه JWS تراکنش برنامه StoreKit است.
   - relay شناسه bundle، اثبات App Attest، و اثبات توزیع Apple را اعتبارسنجی می‌کند و مسیر
     توزیع رسمی/production را الزامی می‌داند.
   - همین موضوع buildهای محلی Xcode/dev را از استفاده از relay میزبانی‌شده بازمی‌دارد. یک build محلی ممکن است
     امضا شده باشد، اما اثبات توزیع رسمی Apple مورد انتظار relay را برآورده نمی‌کند.

3. `gateway identity delegation`
   - پیش از ثبت‌نام relay، برنامه هویت gateway جفت‌شده را از
     `gateway.identity.get` دریافت می‌کند.
   - برنامه آن هویت gateway را در payload ثبت‌نام relay می‌گنجاند.
   - relay یک شناسه relay و یک مجوز ارسال محدود به ثبت‌نام برمی‌گرداند که به
     آن هویت gateway واگذار شده‌اند.

4. `gateway -> relay`
   - gateway شناسه relay و مجوز ارسال را از `push.apns.register` ذخیره می‌کند.
   - در `push.test`، بیدارباش‌های اتصال مجدد، و اشاره‌های بیدارباش، gateway درخواست ارسال را با
     هویت دستگاه خودش امضا می‌کند.
   - relay هم مجوز ارسال ذخیره‌شده و هم امضای gateway را در برابر هویت
     gateway واگذارشده از ثبت‌نام اعتبارسنجی می‌کند.
   - gateway دیگری نمی‌تواند آن ثبت‌نام ذخیره‌شده را دوباره استفاده کند، حتی اگر somehow شناسه را به‌دست آورد.

5. `relay -> APNs`
   - relay مالک credentials تولیدی APNs و token خام APNs برای build رسمی است.
   - gateway هرگز token خام APNs را برای buildهای رسمی مبتنی بر relay ذخیره نمی‌کند.
   - relay پوش نهایی را از طرف gateway جفت‌شده به APNs ارسال می‌کند.

چرا این طراحی ایجاد شد:

- برای بیرون نگه‌داشتن credentials تولیدی APNs از gatewayهای کاربران.
- برای جلوگیری از ذخیره tokenهای خام APNs مربوط به build رسمی روی gateway.
- برای محدود کردن استفاده از relay میزبانی‌شده فقط به buildهای رسمی/TestFlight OpenClaw.
- برای جلوگیری از اینکه یک gateway به دستگاه‌های iOS متعلق به gateway دیگر pushهای بیدارباش ارسال کند.

buildهای محلی/دستی همچنان روی APNs مستقیم باقی می‌مانند. اگر این buildها را بدون relay آزمایش می‌کنید،
gateway همچنان به credentials مستقیم APNs نیاز دارد:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

این‌ها env vars زمان اجرای میزبان gateway هستند، نه تنظیمات Fastlane. `apps/ios/fastlane/.env` فقط اطلاعات
احراز هویت App Store Connect / TestFlight مانند `ASC_KEY_ID` و `ASC_ISSUER_ID` را ذخیره می‌کند؛ تحویل
مستقیم APNs را برای buildهای محلی iOS پیکربندی نمی‌کند.

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

برنامه iOS روی `local.` و، در صورت پیکربندی، همان
دامنه کشف گسترده DNS-SD، `_openclaw-gw._tcp` را browse می‌کند. gatewayهای هم-LAN به‌صورت خودکار از `local.` ظاهر می‌شوند؛
کشف بین‌شبکه‌ای می‌تواند بدون تغییر نوع beacon از دامنه گسترده پیکربندی‌شده استفاده کند.

### Tailnet (بین‌شبکه‌ای)

اگر mDNS مسدود باشد، از یک zone unicast DNS-SD استفاده کنید (یک دامنه انتخاب کنید؛ نمونه:
`openclaw.internal.`) و split DNS مربوط به Tailscale را به‌کار ببرید.
برای نمونه CoreDNS، [Bonjour](/fa/gateway/bonjour) را ببینید.

### میزبان/درگاه دستی

در Settings، **Manual Host** را فعال کنید و host + port gateway را وارد کنید (پیش‌فرض `18789`).

## Canvas + A2UI

node iOS یک canvas مبتنی بر WKWebView را render می‌کند. برای هدایت آن از `node.invoke` استفاده کنید:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

نکات:

- میزبان canvas در Gateway مسیرهای `/__openclaw__/canvas/` و `/__openclaw__/a2ui/` را سرو می‌کند.
- این از سرور HTTP Gateway سرو می‌شود (همان درگاه `gateway.port`، پیش‌فرض `18789`).
- node iOS هنگام اتصال، وقتی URL میزبان canvas تبلیغ شده باشد، به‌صورت خودکار به A2UI می‌رود.
- با `canvas.navigate` و `{"url":""}` به scaffold داخلی برگردید.

## ارتباط با Computer Use

برنامه iOS یک سطح node موبایل است، نه backend مربوط به Codex Computer Use. Codex
Computer Use و `cua-driver mcp` یک دسکتاپ محلی macOS را از طریق ابزارهای MCP
کنترل می‌کنند؛ برنامه iOS قابلیت‌های iPhone را از طریق فرمان‌های node در OpenClaw
مانند `canvas.*`، `camera.*`، `screen.*`، `location.*`، و `talk.*` ارائه می‌کند.

agentها همچنان می‌توانند برنامه iOS را از طریق OpenClaw با فراخوانی فرمان‌های node
کنترل کنند، اما این فراخوانی‌ها از طریق پروتکل node در gateway عبور می‌کنند و محدودیت‌های
foreground/background در iOS را دنبال می‌کنند. برای کنترل دسکتاپ محلی از [Codex Computer Use](/fa/plugins/codex-computer-use)
استفاده کنید و برای قابلیت‌های node در iOS از این صفحه.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## بیدارباش صوتی + حالت talk

- بیدارباش صوتی و حالت talk در Settings در دسترس هستند.
- nodeهای iOS دارای قابلیت talk، قابلیت `talk` را advertise می‌کنند و می‌توانند
  `talk.ptt.start`، `talk.ptt.stop`، `talk.ptt.cancel`، و `talk.ptt.once` را اعلام کنند؛
  Gateway این فرمان‌های push-to-talk را به‌صورت پیش‌فرض برای nodeهای مورد اعتماد
  دارای قابلیت Talk مجاز می‌کند.
- iOS ممکن است صدای پس‌زمینه را suspend کند؛ وقتی برنامه فعال نیست، قابلیت‌های صوتی را best-effort در نظر بگیرید.

## خطاهای رایج

- `NODE_BACKGROUND_UNAVAILABLE`: برنامه iOS را به foreground بیاورید (فرمان‌های canvas/camera/screen به آن نیاز دارند).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway نشانی URL سطح Plugin مربوط به Canvas را advertise نکرده است؛ `plugins.entries.canvas.config.host` را در [پیکربندی Gateway](/fa/gateway/configuration) بررسی کنید.
- اعلان جفت‌سازی هرگز ظاهر نمی‌شود: `openclaw devices list` را اجرا کنید و به‌صورت دستی تأیید کنید.
- اتصال مجدد پس از نصب دوباره شکست می‌خورد: token جفت‌سازی Keychain پاک شده است؛ node را دوباره جفت کنید.

## مستندات مرتبط

- [جفت‌سازی](/fa/channels/pairing)
- [کشف](/fa/gateway/discovery)
- [Bonjour](/fa/gateway/bonjour)
