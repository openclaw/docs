---
read_when:
    - فراخوانی ابزارها بدون اجرای یک نوبت کامل عامل
    - ساخت خودکارسازی‌هایی که به اعمال سیاست ابزار نیاز دارند
summary: یک ابزار واحد را مستقیماً از طریق نقطه پایانی HTTP در Gateway فراخوانی کنید
title: API فراخوانی ابزارها
x-i18n:
    generated_at: "2026-06-27T17:51:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2023505f5a705b62e2fd685d64d3f9bd7788d09adfe89ac99604e6660c78ad8a
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

Gateway مربوط به OpenClaw یک endpoint ساده HTTP برای فراخوانی مستقیم یک ابزار واحد ارائه می‌دهد. این endpoint همیشه فعال است و از احراز هویت Gateway به‌همراه سیاست ابزار استفاده می‌کند. مانند سطح سازگار با OpenAI یعنی `/v1/*`، احراز هویت bearer با secret مشترک به‌عنوان دسترسی قابل‌اعتماد operator برای کل gateway در نظر گرفته می‌شود.

- `POST /tools/invoke`
- همان پورت Gateway (ترکیب WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

حداکثر اندازه پیش‌فرض payload برابر 2 MB است.

## احراز هویت

از پیکربندی احراز هویت Gateway استفاده می‌کند.

مسیرهای رایج احراز هویت HTTP:

- احراز هویت با secret مشترک (`gateway.auth.mode="token"` یا `"password"`):
  `Authorization: Bearer <token-or-password>`
- احراز هویت HTTP دارای هویت قابل‌اعتماد (`gateway.auth.mode="trusted-proxy"`):
  از طریق proxy پیکربندی‌شده و آگاه از هویت مسیریابی کنید و اجازه دهید headerهای
  هویتی لازم را تزریق کند
- احراز هویت باز برای ingress خصوصی (`gateway.auth.mode="none"`):
  نیازی به header احراز هویت نیست

نکته‌ها:

- وقتی `gateway.auth.mode="token"` است، از `gateway.auth.token` (یا `OPENCLAW_GATEWAY_TOKEN`) استفاده کنید.
- وقتی `gateway.auth.mode="password"` است، از `gateway.auth.password` (یا `OPENCLAW_GATEWAY_PASSWORD`) استفاده کنید.
- وقتی `gateway.auth.mode="trusted-proxy"` است، درخواست HTTP باید از یک
  منبع trusted proxy پیکربندی‌شده بیاید؛ proxyهای loopback روی همان host به
  `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند.
- فراخوان‌های داخلی روی همان host که proxy را دور می‌زنند می‌توانند از
  `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` به‌عنوان یک fallback مستقیم
  محلی استفاده کنند. وجود هر شواهدی در headerهای `Forwarded`، ‏`X-Forwarded-*` یا `X-Real-IP`
  در عوض درخواست را روی مسیر trusted-proxy نگه می‌دارد.
- اگر `gateway.auth.rateLimit` پیکربندی شده باشد و شکست‌های احراز هویت بیش از حد رخ دهد، endpoint با `429` و `Retry-After` پاسخ می‌دهد.

## مرز امنیتی (مهم)

این endpoint را به‌عنوان سطح **دسترسی کامل operator** برای نمونه gateway در نظر بگیرید.

- احراز هویت HTTP bearer در اینجا یک مدل scope محدود برای هر کاربر نیست.
- یک token/password معتبر Gateway برای این endpoint باید مانند credential مالک/operator در نظر گرفته شود.
- برای حالت‌های احراز هویت با secret مشترک (`token` و `password`)، endpoint پیش‌فرض‌های عادی و کامل operator را بازمی‌گرداند، حتی اگر فراخواننده header محدودتری با نام `x-openclaw-scopes` بفرستد.
- احراز هویت با secret مشترک همچنین فراخوانی مستقیم ابزارها روی این endpoint را به‌عنوان نوبت‌های owner-sender در نظر می‌گیرد.
- حالت‌های HTTP دارای هویت قابل‌اعتماد (برای مثال احراز هویت trusted proxy یا `gateway.auth.mode="none"` روی ingress خصوصی) در صورت وجود `x-openclaw-scopes` به آن احترام می‌گذارند و در غیر این صورت به مجموعه scope پیش‌فرض عادی operator برمی‌گردند.
- این endpoint را فقط روی loopback/tailnet/ingress خصوصی نگه دارید؛ آن را مستقیما در معرض اینترنت عمومی قرار ندهید.

ماتریس احراز هویت:

- `gateway.auth.mode="token"` یا `"password"` + `Authorization: Bearer ...`
  - مالکیت secret مشترک operator gateway را اثبات می‌کند
  - `x-openclaw-scopes` محدودتر را نادیده می‌گیرد
  - مجموعه scope پیش‌فرض کامل operator را بازمی‌گرداند:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - فراخوانی مستقیم ابزارها روی این endpoint را به‌عنوان نوبت‌های owner-sender در نظر می‌گیرد
- حالت‌های HTTP دارای هویت قابل‌اعتماد (برای مثال احراز هویت trusted proxy، یا `gateway.auth.mode="none"` روی ingress خصوصی)
  - نوعی هویت بیرونی قابل‌اعتماد یا مرز deployment را احراز می‌کنند
  - وقتی header وجود دارد به `x-openclaw-scopes` احترام می‌گذارند
  - وقتی header وجود ندارد به مجموعه scope پیش‌فرض عادی operator برمی‌گردند
  - فقط زمانی معنای مالک را از دست می‌دهند که فراخواننده scopeها را صراحتا محدود کند و `operator.admin` را حذف کند

## بدنه درخواست

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

فیلدها:

- `tool` (رشته، الزامی): نام ابزاری که باید فراخوانی شود.
- `action` (رشته، اختیاری): اگر schema ابزار از `action` پشتیبانی کند و payload مربوط به args آن را حذف کرده باشد، داخل args نگاشت می‌شود.
- `args` (شیء، اختیاری): آرگومان‌های مخصوص ابزار.
- `sessionKey` (رشته، اختیاری): کلید session هدف. اگر حذف شود یا `"main"` باشد، Gateway از کلید session اصلی پیکربندی‌شده استفاده می‌کند (`session.mainKey` و agent پیش‌فرض را رعایت می‌کند، یا در scope سراسری از `global` استفاده می‌کند).
- `dryRun` (boolean، اختیاری): برای استفاده آینده رزرو شده است؛ در حال حاضر نادیده گرفته می‌شود.

## رفتار سیاست + مسیریابی

دسترسی‌پذیری ابزار از همان زنجیره سیاستی فیلتر می‌شود که agentهای Gateway استفاده می‌کنند:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- سیاست‌های گروهی (اگر کلید session به یک گروه یا channel نگاشت شود)
- سیاست subagent (هنگام فراخوانی با کلید session مربوط به subagent)

اگر ابزاری طبق سیاست مجاز نباشد، endpoint مقدار **404** برمی‌گرداند.

نکته‌های مهم درباره مرز:

- تاییدهای exec گاردریل‌های operator هستند، نه یک مرز مجوزدهی جداگانه برای این endpoint HTTP. اگر ابزاری از طریق احراز هویت Gateway + سیاست ابزار در اینجا قابل دسترسی باشد، `/tools/invoke` یک prompt تایید اضافی برای هر فراخوان اضافه نمی‌کند.
- اگر `exec` در اینجا قابل دسترسی باشد، آن را به‌عنوان یک سطح shell تغییردهنده در نظر بگیرید. رد کردن `write`، ‏`edit`، ‏`apply_patch` یا ابزارهای HTTP برای نوشتن در فایل‌سیستم، اجرای shell را read-only نمی‌کند.
- credentialهای bearer مربوط به Gateway را با فراخوانندگان غیرقابل‌اعتماد به اشتراک نگذارید. اگر به جداسازی میان مرزهای اعتماد نیاز دارید، gatewayهای جداگانه اجرا کنید (و در حالت ایده‌آل، کاربران/hostهای جداگانه OS).

HTTP مربوط به Gateway همچنین به‌طور پیش‌فرض یک deny list سخت اعمال می‌کند (حتی اگر سیاست session ابزار را مجاز بداند):

- `exec` - اجرای مستقیم فرمان (سطح RCE)
- `spawn` - ایجاد فرایند فرزند دلخواه (سطح RCE)
- `shell` - اجرای فرمان shell (سطح RCE)
- `fs_write` - تغییر دلخواه فایل روی host
- `fs_delete` - حذف دلخواه فایل روی host
- `fs_move` - جابه‌جایی/تغییرنام دلخواه فایل روی host
- `apply_patch` - اعمال patch می‌تواند فایل‌های دلخواه را بازنویسی کند
- `sessions_spawn` - orchestration مربوط به session؛ ایجاد agentها از راه دور RCE است
- `sessions_send` - تزریق پیام میان sessionها
- `cron` - control plane اتوماسیون پایدار
- `gateway` - control plane مربوط به gateway؛ از پیکربندی مجدد از طریق HTTP جلوگیری می‌کند
- `nodes` - relay فرمان node می‌تواند به system.run روی hostهای paired برسد
- `whatsapp_login` - راه‌اندازی تعاملی که به اسکن QR در ترمینال نیاز دارد؛ روی HTTP معلق می‌ماند

می‌توانید این deny list را از طریق `gateway.tools` سفارشی کنید:

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list for owner/admin callers
      allow: ["gateway"],
    },
  },
}
```

`gateway.tools.allow` یک override برای exposure است، نه ارتقای scope. در
حالت‌های HTTP دارای هویت، `cron`، ‏`gateway` و `nodes` برای
فراخوانندگانی که هویت owner/admin (`operator.admin`) ندارند همچنان در دسترس نیستند، حتی وقتی
در `gateway.tools.allow` فهرست شده باشند. احراز هویت shared-secret bearer همچنان از
قاعده trusted-operator کامل بالا پیروی می‌کند.

برای کمک به resolve شدن context سیاست‌های گروهی، می‌توانید به‌صورت اختیاری تنظیم کنید:

- `x-openclaw-message-channel: <channel>` (مثال: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (وقتی چند حساب وجود دارد)

## پاسخ‌ها

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (درخواست نامعتبر یا خطای ورودی ابزار)
- `401` → غیرمجاز
- `429` → احراز هویت rate-limited شده است (`Retry-After` تنظیم شده است)
- `404` → ابزار در دسترس نیست (پیدا نشد یا در allowlist نیست)
- `405` → روش مجاز نیست
- `500` → `{ ok: false, error: { type, message } }` (خطای غیرمنتظره اجرای ابزار؛ پیام sanitize شده است)

## مثال

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```

## مرتبط

- [پروتکل Gateway](/fa/gateway/protocol)
- [ابزارها و Pluginها](/fa/tools)
