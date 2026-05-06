---
read_when:
    - جفت‌سازی یا اتصال مجدد گره iOS
    - اجرای برنامه iOS از کد منبع
    - اشکال‌زدایی کشف Gateway یا دستورهای بوم
summary: 'برنامه Node در iOS: اتصال به Gateway، جفت‌سازی، بوم، و عیب‌یابی'
title: برنامه iOS
x-i18n:
    generated_at: "2026-05-06T09:29:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: aaa8c11d9fda32c743d2ff0d1c6fd5574bcd396aef43aa2e4e9b0cc7b55e5d21
    source_path: platforms/ios.md
    workflow: 16
---

دسترس‌پذیری: پیش‌نمایش داخلی. برنامه iOS هنوز به‌صورت عمومی توزیع نشده است.

## چه کاری انجام می‌دهد

- به یک Gateway از طریق WebSocket متصل می‌شود (LAN یا tailnet).
- قابلیت‌های Node را ارائه می‌کند: Canvas، عکس فوری Screen، ضبط Camera، Location، حالت Talk، بیدارباش Voice.
- فرمان‌های `node.invoke` را دریافت می‌کند و رویدادهای وضعیت Node را گزارش می‌دهد.

## نیازمندی‌ها

- Gateway در حال اجرا روی دستگاهی دیگر (macOS، Linux، یا Windows از طریق WSL2).
- مسیر شبکه:
  - همان LAN از طریق Bonjour، **یا**
  - Tailnet از طریق DNS-SD تک‌پخشی (دامنه نمونه: `openclaw.internal.`)، **یا**
  - میزبان/درگاه دستی (مسیر جایگزین).

## شروع سریع (pair + connect)

1. Gateway را شروع کنید:

```bash
openclaw gateway --port 18789
```

2. در برنامه iOS، Settings را باز کنید و یک Gateway کشف‌شده را انتخاب کنید (یا Manual Host را فعال کنید و میزبان/درگاه را وارد کنید).

3. درخواست pairing را روی میزبان Gateway تأیید کنید:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

اگر برنامه pairing را با جزئیات احراز هویت تغییرکرده (نقش/دامنه‌ها/کلید عمومی) دوباره امتحان کند،
درخواست معلق قبلی جایگزین می‌شود و یک `requestId` جدید ساخته می‌شود.
پیش از تأیید، دوباره `openclaw devices list` را اجرا کنید.

اختیاری: اگر Node iOS همیشه از یک زیرشبکه کاملاً کنترل‌شده متصل می‌شود، می‌توانید
با CIDRهای صریح یا IPهای دقیق، تأیید خودکار Node در نخستین اتصال را فعال کنید:

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

این قابلیت به‌صورت پیش‌فرض غیرفعال است. فقط برای pairing تازه با `role: node` و
بدون scopeهای درخواستی اعمال می‌شود. pairing اپراتور/مرورگر و هر تغییر نقش، scope، فراداده یا
کلید عمومی همچنان به تأیید دستی نیاز دارد.

4. اتصال را بررسی کنید:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push متکی به relay برای buildهای رسمی

buildهای iOS که به‌صورت رسمی توزیع می‌شوند، به‌جای انتشار token خام APNs
به Gateway، از relay خارجی push استفاده می‌کنند.

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

نحوه کار جریان:

- برنامه iOS با استفاده از App Attest و یک JWS تراکنش برنامه StoreKit در relay ثبت‌نام می‌کند.
- relay یک handle مبهم relay به‌همراه یک grant ارسال محدود به ثبت‌نام برمی‌گرداند.
- برنامه iOS هویت Gateway جفت‌شده را دریافت می‌کند و آن را در ثبت‌نام relay می‌گنجاند، بنابراین ثبت‌نام متکی به relay به همان Gateway مشخص واگذار می‌شود.
- برنامه آن ثبت‌نام متکی به relay را با `push.apns.register` به Gateway جفت‌شده ارسال می‌کند.
- Gateway از آن handle ذخیره‌شده relay برای `push.test`، بیدارباش‌های پس‌زمینه و تلنگرهای بیدارباش استفاده می‌کند.
- نشانی پایه relay در Gateway باید با نشانی relay تعبیه‌شده در build رسمی/TestFlight برنامه iOS مطابقت داشته باشد.
- اگر برنامه بعداً به Gateway دیگری یا buildی با نشانی پایه relay متفاوت متصل شود، به‌جای استفاده دوباره از binding قدیمی، ثبت‌نام relay را تازه‌سازی می‌کند.

چیزی که Gateway برای این مسیر **نیاز ندارد**:

- بدون token سراسری استقرار برای relay.
- بدون کلید مستقیم APNs برای ارسال‌های رسمی/TestFlight متکی به relay.

جریان مورد انتظار اپراتور:

1. build رسمی/TestFlight برنامه iOS را نصب کنید.
2. `gateway.push.apns.relay.baseUrl` را روی Gateway تنظیم کنید.
3. برنامه را با Gateway pair کنید و اجازه دهید اتصال را کامل کند.
4. پس از اینکه برنامه یک token APNs دارد، نشست اپراتور متصل است و ثبت‌نام relay موفق می‌شود، برنامه `push.apns.register` را به‌صورت خودکار منتشر می‌کند.
5. پس از آن، `push.test`، بیدارباش‌های اتصال دوباره و تلنگرهای بیدارباش می‌توانند از ثبت‌نام ذخیره‌شده متکی به relay استفاده کنند.

## beaconهای زنده پس‌زمینه

وقتی iOS برنامه را برای push بی‌صدا، تازه‌سازی پس‌زمینه، یا رویداد significant-location بیدار می‌کند، برنامه
یک اتصال دوباره کوتاه Node را امتحان می‌کند و سپس `node.event` را با `event: "node.presence.alive"` فراخوانی می‌کند.
Gateway این را فقط پس از شناخته‌شدن هویت دستگاه Node احراز هویت‌شده، به‌عنوان `lastSeenAtMs`/`lastSeenReason` در فراداده Node/دستگاه جفت‌شده ثبت می‌کند.

برنامه فقط زمانی یک بیدارباش پس‌زمینه را با موفقیت ثبت‌شده در نظر می‌گیرد که پاسخ Gateway شامل
`handled: true` باشد. Gatewayهای قدیمی‌تر ممکن است `node.event` را با `{ "ok": true }` تأیید کنند؛ آن پاسخ
سازگار است اما به‌عنوان به‌روزرسانی پایدار آخرین مشاهده محسوب نمی‌شود.

نکته سازگاری:

- `OPENCLAW_APNS_RELAY_BASE_URL` همچنان به‌عنوان override موقت env برای Gateway کار می‌کند.

## جریان احراز هویت و اعتماد

relay برای اعمال دو محدودیت وجود دارد که APNs مستقیم روی Gateway نمی‌تواند برای
buildهای رسمی iOS فراهم کند:

- فقط buildهای واقعی OpenClaw iOS که از طریق Apple توزیع شده‌اند می‌توانند از relay میزبانی‌شده استفاده کنند.
- یک Gateway فقط برای دستگاه‌های iOS که با همان Gateway مشخص pair شده‌اند می‌تواند pushهای متکی به relay ارسال کند.

گام‌به‌گام:

1. `iOS app -> gateway`
   - برنامه ابتدا از طریق جریان عادی احراز هویت Gateway با Gateway pair می‌شود.
   - این کار به برنامه یک نشست Node احراز هویت‌شده به‌همراه یک نشست اپراتور احراز هویت‌شده می‌دهد.
   - نشست اپراتور برای فراخوانی `gateway.identity.get` استفاده می‌شود.

2. `iOS app -> relay`
   - برنامه endpointهای ثبت‌نام relay را از طریق HTTPS فراخوانی می‌کند.
   - ثبت‌نام شامل اثبات App Attest به‌همراه یک JWS تراکنش برنامه StoreKit است.
   - relay شناسه bundle، اثبات App Attest و اثبات توزیع Apple را اعتبارسنجی می‌کند و مسیر
     توزیع رسمی/production را الزامی می‌داند.
   - همین موضوع استفاده buildهای محلی Xcode/dev از relay میزبانی‌شده را مسدود می‌کند. یک build محلی ممکن است
     امضا شده باشد، اما اثبات توزیع رسمی Apple مورد انتظار relay را برآورده نمی‌کند.

3. `gateway identity delegation`
   - پیش از ثبت‌نام relay، برنامه هویت Gateway جفت‌شده را از
     `gateway.identity.get` دریافت می‌کند.
   - برنامه آن هویت Gateway را در payload ثبت‌نام relay می‌گنجاند.
   - relay یک handle relay و یک grant ارسال محدود به ثبت‌نام برمی‌گرداند که به
     آن هویت Gateway واگذار شده‌اند.

4. `gateway -> relay`
   - Gateway handle relay و grant ارسال را از `push.apns.register` ذخیره می‌کند.
   - در `push.test`، بیدارباش‌های اتصال دوباره و تلنگرهای بیدارباش، Gateway درخواست ارسال را با
     هویت دستگاه خودش امضا می‌کند.
   - relay هم grant ارسال ذخیره‌شده و هم امضای Gateway را در برابر هویت Gateway
     واگذارشده از ثبت‌نام بررسی می‌کند.
   - Gateway دیگری نمی‌تواند از آن ثبت‌نام ذخیره‌شده دوباره استفاده کند، حتی اگر به‌نحوی handle را به‌دست آورد.

5. `relay -> APNs`
   - relay مالک اعتبارنامه‌های production APNs و token خام APNs برای build رسمی است.
   - Gateway هرگز token خام APNs را برای buildهای رسمی متکی به relay ذخیره نمی‌کند.
   - relay push نهایی را از طرف Gateway جفت‌شده به APNs ارسال می‌کند.

دلیل ایجاد این طراحی:

- برای دور نگه‌داشتن اعتبارنامه‌های production APNs از Gatewayهای کاربر.
- برای جلوگیری از ذخیره tokenهای خام APNs buildهای رسمی روی Gateway.
- برای مجازکردن استفاده از relay میزبانی‌شده فقط برای buildهای رسمی/TestFlight OpenClaw.
- برای جلوگیری از اینکه یک Gateway به دستگاه‌های iOS متعلق به Gateway دیگر push بیدارباش ارسال کند.

buildهای محلی/دستی همچنان روی APNs مستقیم باقی می‌مانند. اگر آن buildها را بدون relay آزمایش می‌کنید،
Gateway همچنان به اعتبارنامه‌های مستقیم APNs نیاز دارد:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

این‌ها env varهای زمان اجرای میزبان Gateway هستند، نه تنظیمات Fastlane. `apps/ios/fastlane/.env` فقط
احراز هویت App Store Connect / TestFlight مانند `ASC_KEY_ID` و `ASC_ISSUER_ID` را ذخیره می‌کند؛ ارسال
مستقیم APNs برای buildهای محلی iOS را پیکربندی نمی‌کند.

ذخیره‌سازی پیشنهادی روی میزبان Gateway:

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

برنامه iOS روی `local.` به‌دنبال `_openclaw-gw._tcp` می‌گردد و، هنگام پیکربندی، همان
دامنه کشف DNS-SD گسترده را نیز مرور می‌کند. Gatewayهای همان LAN به‌صورت خودکار از `local.`
ظاهر می‌شوند؛ کشف بین‌شبکه‌ای می‌تواند بدون تغییر نوع beacon از دامنه گسترده پیکربندی‌شده استفاده کند.

### Tailnet (بین‌شبکه‌ای)

اگر mDNS مسدود است، از یک zone تک‌پخشی DNS-SD استفاده کنید (یک دامنه انتخاب کنید؛ نمونه:
`openclaw.internal.`) و split DNS مربوط به Tailscale را به‌کار بگیرید.
برای نمونه CoreDNS، [Bonjour](/fa/gateway/bonjour) را ببینید.

### میزبان/درگاه دستی

در Settings، **Manual Host** را فعال کنید و میزبان Gateway + درگاه را وارد کنید (پیش‌فرض `18789`).

## Canvas + A2UI

Node iOS یک canvas با WKWebView رندر می‌کند. از `node.invoke` برای کنترل آن استفاده کنید:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

نکات:

- میزبان canvas در Gateway مسیرهای `/__openclaw__/canvas/` و `/__openclaw__/a2ui/` را ارائه می‌کند.
- از سرور HTTP مربوط به Gateway ارائه می‌شود (همان درگاه `gateway.port`، پیش‌فرض `18789`).
- وقتی URL میزبان canvas تبلیغ شده باشد، Node iOS هنگام اتصال به‌صورت خودکار به A2UI می‌رود.
- با `canvas.navigate` و `{"url":""}` به اسکلت داخلی برگردید.

## رابطه با Computer Use

برنامه iOS یک سطح Node موبایل است، نه backend مربوط به Codex Computer Use. Codex
Computer Use و `cua-driver mcp` یک دسکتاپ محلی macOS را از طریق ابزارهای MCP
کنترل می‌کنند؛ برنامه iOS قابلیت‌های iPhone را از طریق فرمان‌های Node در OpenClaw
مانند `canvas.*`، `camera.*`، `screen.*`، `location.*`، و `talk.*` ارائه می‌کند.

Agentها همچنان می‌توانند با فراخوانی فرمان‌های Node، برنامه iOS را از طریق OpenClaw
به‌کار بگیرند، اما این فراخوانی‌ها از پروتکل Node در Gateway عبور می‌کنند و از محدودیت‌های
پیش‌زمینه/پس‌زمینه iOS پیروی می‌کنند. برای کنترل دسکتاپ محلی از [Codex Computer Use](/fa/plugins/codex-computer-use)
استفاده کنید و برای قابلیت‌های Node iOS از این صفحه.

### eval / snapshot در Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## بیدارباش صوتی + حالت talk

- بیدارباش صوتی و حالت talk در Settings در دسترس هستند.
- Nodeهای iOS دارای قابلیت talk، قابلیت `talk` را تبلیغ می‌کنند و می‌توانند
  `talk.ptt.start`، `talk.ptt.stop`، `talk.ptt.cancel`، و `talk.ptt.once` را اعلام کنند؛
  Gateway این فرمان‌های push-to-talk را به‌صورت پیش‌فرض برای Nodeهای مورد اعتماد
  دارای قابلیت Talk مجاز می‌کند.
- iOS ممکن است صوت پس‌زمینه را معلق کند؛ وقتی برنامه فعال نیست، قابلیت‌های صوتی را best-effort در نظر بگیرید.

## خطاهای رایج

- `NODE_BACKGROUND_UNAVAILABLE`: برنامه iOS را به پیش‌زمینه بیاورید (فرمان‌های canvas/camera/screen به آن نیاز دارند).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway یک URL میزبان canvas تبلیغ نکرده است؛ `canvasHost` را در [پیکربندی Gateway](/fa/gateway/configuration) بررسی کنید.
- اعلان Pairing هرگز ظاهر نمی‌شود: `openclaw devices list` را اجرا کنید و به‌صورت دستی تأیید کنید.
- اتصال دوباره پس از نصب مجدد شکست می‌خورد: token pairing در Keychain پاک شده است؛ Node را دوباره pair کنید.

## مستندات مرتبط

- [Pairing](/fa/channels/pairing)
- [Discovery](/fa/gateway/discovery)
- [Bonjour](/fa/gateway/bonjour)
