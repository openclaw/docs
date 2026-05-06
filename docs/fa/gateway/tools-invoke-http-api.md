---
read_when:
    - فراخوانی ابزارها بدون اجرای یک نوبت کامل عامل
    - ساخت اتوماسیون‌هایی که نیازمند اعمال سیاست ابزار هستند
summary: فراخوانی یک ابزار واحد مستقیماً از طریق نقطهٔ پایانی HTTP Gateway
title: API فراخوانی ابزارها
x-i18n:
    generated_at: "2026-05-06T09:21:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fcd490d4eaa63f23b0d502e537c4094ade88afcdd04e2b7df1a5f0484a11c57
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

OpenClaw's Gateway یک endpoint ساده HTTP برای فراخوانی مستقیم یک ابزار واحد ارائه می‌کند. این قابلیت همیشه فعال است و از احراز هویت Gateway به‌علاوه سیاست ابزار استفاده می‌کند. مانند سطح سازگار با OpenAI یعنی `/v1/*`، احراز هویت bearer با راز مشترک، دسترسی اپراتور مورد اعتماد برای کل gateway در نظر گرفته می‌شود.

- `POST /tools/invoke`
- همان پورت Gateway (چندگانه‌سازی WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

حداکثر اندازه پیش‌فرض payload برابر 2 MB است.

## احراز هویت

از پیکربندی احراز هویت Gateway استفاده می‌کند.

مسیرهای رایج احراز هویت HTTP:

- احراز هویت با راز مشترک (`gateway.auth.mode="token"` یا `"password"`):
  `Authorization: Bearer <token-or-password>`
- احراز هویت HTTP مورد اعتماد دارای هویت (`gateway.auth.mode="trusted-proxy"`):
  درخواست را از طریق proxy پیکربندی‌شده و آگاه از هویت عبور دهید و اجازه دهید headerهای
  هویتی لازم را تزریق کند
- احراز هویت باز برای ingress خصوصی (`gateway.auth.mode="none"`):
  نیازی به header احراز هویت نیست

نکته‌ها:

- وقتی `gateway.auth.mode="token"` است، از `gateway.auth.token` (یا `OPENCLAW_GATEWAY_TOKEN`) استفاده کنید.
- وقتی `gateway.auth.mode="password"` است، از `gateway.auth.password` (یا `OPENCLAW_GATEWAY_PASSWORD`) استفاده کنید.
- وقتی `gateway.auth.mode="trusted-proxy"` است، درخواست HTTP باید از یک
  منبع proxy مورد اعتماد پیکربندی‌شده بیاید؛ proxyهای loopback روی همان میزبان نیازمند تنظیم صریح
  `gateway.auth.trustedProxy.allowLoopback = true` هستند.
- اگر `gateway.auth.rateLimit` پیکربندی شده باشد و شکست‌های احراز هویت بیش از حد رخ دهد، endpoint با `429` و `Retry-After` پاسخ می‌دهد.

## مرز امنیتی (مهم)

با این endpoint به‌عنوان سطحی با **دسترسی کامل اپراتور** برای نمونه gateway رفتار کنید.

- احراز هویت HTTP bearer در اینجا یک مدل scope محدود به هر کاربر نیست.
- یک token/password معتبر Gateway برای این endpoint باید مانند credential مالک/اپراتور در نظر گرفته شود.
- در حالت‌های احراز هویت با راز مشترک (`token` و `password`)، حتی اگر فراخواننده header محدودتر `x-openclaw-scopes` را ارسال کند، endpoint پیش‌فرض‌های عادی و کامل اپراتور را بازیابی می‌کند.
- احراز هویت با راز مشترک همچنین فراخوانی‌های مستقیم ابزار روی این endpoint را به‌عنوان turnهای فرستنده-مالک در نظر می‌گیرد.
- حالت‌های HTTP مورد اعتماد دارای هویت (برای مثال احراز هویت proxy مورد اعتماد یا `gateway.auth.mode="none"` روی ingress خصوصی) در صورت وجود `x-openclaw-scopes` آن را رعایت می‌کنند و در غیر این صورت به مجموعه scope پیش‌فرض عادی اپراتور برمی‌گردند.
- این endpoint را فقط روی loopback/tailnet/ingress خصوصی نگه دارید؛ آن را مستقیما در اینترنت عمومی در دسترس نگذارید.

ماتریس احراز هویت:

- `gateway.auth.mode="token"` یا `"password"` + `Authorization: Bearer ...`
  - داشتن راز مشترک اپراتور gateway را اثبات می‌کند
  - `x-openclaw-scopes` محدودتر را نادیده می‌گیرد
  - مجموعه کامل scope پیش‌فرض اپراتور را بازیابی می‌کند:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - فراخوانی‌های مستقیم ابزار روی این endpoint را به‌عنوان turnهای فرستنده-مالک در نظر می‌گیرد
- حالت‌های HTTP مورد اعتماد دارای هویت (برای مثال احراز هویت proxy مورد اعتماد، یا `gateway.auth.mode="none"` روی ingress خصوصی)
  - یک هویت مورد اعتماد بیرونی یا مرز deployment را احراز می‌کنند
  - وقتی header وجود داشته باشد، `x-openclaw-scopes` را رعایت می‌کنند
  - وقتی header وجود نداشته باشد، به مجموعه scope پیش‌فرض عادی اپراتور برمی‌گردند
  - فقط زمانی معناشناسی مالک را از دست می‌دهند که فراخواننده scopeها را صراحتا محدود کند و `operator.admin` را حذف کند

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

- `tool` (string، الزامی): نام ابزاری که باید فراخوانی شود.
- `action` (string، اختیاری): اگر schema ابزار از `action` پشتیبانی کند و payload آرگومان‌ها آن را حذف کرده باشد، به args نگاشت می‌شود.
- `args` (object، اختیاری): آرگومان‌های اختصاصی ابزار.
- `sessionKey` (string، اختیاری): کلید نشست هدف. اگر حذف شود یا `"main"` باشد، Gateway از کلید نشست اصلی پیکربندی‌شده استفاده می‌کند (`session.mainKey` و agent پیش‌فرض را رعایت می‌کند، یا در scope سراسری از `global` استفاده می‌کند).
- `dryRun` (boolean، اختیاری): برای استفاده آینده رزرو شده است؛ در حال حاضر نادیده گرفته می‌شود.

## رفتار سیاست + routing

دردسترس‌بودن ابزار از همان زنجیره سیاستی عبور می‌کند که agentهای Gateway استفاده می‌کنند:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- سیاست‌های گروهی (اگر کلید نشست به یک گروه یا channel نگاشت شود)
- سیاست subagent (هنگام فراخوانی با کلید نشست subagent)

اگر ابزاری توسط سیاست مجاز نباشد، endpoint مقدار **404** را برمی‌گرداند.

نکته‌های مهم درباره مرز:

- تاییدهای exec محافظ‌های اپراتوری هستند، نه یک مرز مجوزدهی جداگانه برای این endpoint HTTP. اگر ابزاری اینجا از طریق احراز هویت Gateway + سیاست ابزار قابل دسترسی باشد، `/tools/invoke` یک prompt تایید اضافه برای هر فراخوانی اضافه نمی‌کند.
- credentialهای bearer مربوط به Gateway را با فراخواننده‌های غیرقابل اعتماد به اشتراک نگذارید. اگر به جداسازی میان مرزهای اعتماد نیاز دارید، gatewayهای جداگانه اجرا کنید (و ترجیحا کاربران/میزبان‌های سیستم‌عامل جداگانه).

HTTP مربوط به Gateway همچنین به‌صورت پیش‌فرض یک فهرست deny سخت‌گیرانه اعمال می‌کند (حتی اگر سیاست نشست ابزار را مجاز بداند):

- `exec` - اجرای مستقیم فرمان (سطح RCE)
- `spawn` - ایجاد arbitrary child process (سطح RCE)
- `shell` - اجرای فرمان shell (سطح RCE)
- `fs_write` - تغییر دلخواه فایل روی میزبان
- `fs_delete` - حذف دلخواه فایل روی میزبان
- `fs_move` - جابه‌جایی/تغییرنام دلخواه فایل روی میزبان
- `apply_patch` - اعمال patch می‌تواند فایل‌های دلخواه را بازنویسی کند
- `sessions_spawn` - orchestration نشست؛ spawn کردن agentها از راه دور RCE است
- `sessions_send` - تزریق پیام بین نشست‌ها
- `cron` - control plane اتوماسیون پایدار
- `gateway` - control plane مربوط به gateway؛ از بازپیکربندی از طریق HTTP جلوگیری می‌کند
- `nodes` - relay فرمان Node می‌تواند روی میزبان‌های paired به system.run دسترسی پیدا کند
- `whatsapp_login` - راه‌اندازی تعاملی که به اسکن QR در terminal نیاز دارد؛ روی HTTP متوقف می‌ماند

می‌توانید این فهرست deny را از طریق `gateway.tools` سفارشی کنید:

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list
      allow: ["gateway"],
    },
  },
}
```

برای کمک به resolve شدن context توسط سیاست‌های گروهی، می‌توانید به‌صورت اختیاری تنظیم کنید:

- `x-openclaw-message-channel: <channel>` (مثال: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (وقتی چند account وجود دارد)

## پاسخ‌ها

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (درخواست نامعتبر یا خطای ورودی ابزار)
- `401` → غیرمجاز
- `429` → احراز هویت rate-limited شده است (`Retry-After` تنظیم می‌شود)
- `404` → ابزار در دسترس نیست (پیدا نشد یا در allowlist نیست)
- `405` → method مجاز نیست
- `500` → `{ ok: false, error: { type, message } }` (خطای غیرمنتظره در اجرای ابزار؛ پیام پاک‌سازی شده)

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
- [ابزارها و plugins](/fa/tools)
