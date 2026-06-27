---
read_when:
    - ساخت ابزارهای میزبان که نمی‌توانند از کلاینت RPC WebSocket مربوط به Gateway استفاده کنند
    - ارائهٔ خودکارسازی مدیریت Gateway پشت یک ورودی خصوصیِ مورداعتماد
    - ممیزی مدل امنیتی برای دسترسی HTTP به روش‌های Gateway
summary: در دسترس قرار دادن متدهای منتخب سطح کنترل Gateway از طریق Plugin همراه و اختیاری admin-http-rpc
title: Plugin ‏RPC‏ HTTP مدیریتی
x-i18n:
    generated_at: "2026-06-27T18:09:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f701ef6be7457cd518ecb80b7ec5dade61bb057d62f4ca90984a4c1aa8fdf700
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

Plugin همراه `admin-http-rpc` روش‌های منتخب صفحه کنترل Gateway را از طریق HTTP برای اتوماسیون میزبان مورداعتماد که نمی‌تواند از کلاینت عادی Gateway WebSocket RPC استفاده کند، در دسترس قرار می‌دهد.

این Plugin همراه OpenClaw ارائه می‌شود، اما به‌طور پیش‌فرض غیرفعال است. وقتی غیرفعال باشد، مسیر ثبت نمی‌شود. وقتی فعال شود، این موارد را اضافه می‌کند:

- `POST /api/v1/admin/rpc`
- همان شنونده Gateway: `http://<gateway-host>:<port>/api/v1/admin/rpc`

آن را فقط برای ابزارسازی میزبان خصوصی، اتوماسیون tailnet، یا یک ورودی داخلی مورداعتماد فعال کنید. این مسیر را مستقیماً در معرض اینترنت عمومی قرار ندهید.

## پیش از فعال‌سازی

Admin HTTP RPC یک سطح کامل صفحه کنترل اپراتور است. هر فراخوانی‌کننده‌ای که احراز هویت HTTP Gateway را با موفقیت بگذراند، می‌تواند روش‌های مجازشده در این صفحه را فراخوانی کند.

زمانی از آن استفاده کنید که همه این موارد درست باشند:

- فراخوانی‌کننده برای اداره Gateway مورداعتماد است.
- فراخوانی‌کننده نمی‌تواند از کلاینت WebSocket RPC استفاده کند.
- مسیر فقط روی loopback، یک tailnet، یا یک ورودی خصوصی احرازهویت‌شده قابل دسترسی است.
- روش‌های مجاز را بازبینی کرده‌اید و با اتوماسیونی که قصد اجرای آن را دارید منطبق هستند.

برای کلاینت‌های OpenClaw و ابزارهای تعاملی که می‌توانند اتصال Gateway WebSocket را باز نگه دارند، از مسیر WebSocket RPC استفاده کنید.

## فعال‌سازی

Plugin همراه را فعال کنید:

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="پیکربندی">
    ```json5
    {
      plugins: {
        entries: {
          "admin-http-rpc": { enabled: true },
        },
      },
    }
    ```
  </Tab>
</Tabs>

مسیر هنگام راه‌اندازی Plugin ثبت می‌شود. پس از تغییر پیکربندی Plugin، Gateway را بازراه‌اندازی کنید.

وقتی دیگر به سطح HTTP نیاز ندارید، آن را غیرفعال کنید:

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## تأیید مسیر

از `health` به‌عنوان کوچک‌ترین درخواست ایمن استفاده کنید:

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

یک پاسخ موفق `ok: true` دارد:

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

وقتی Plugin غیرفعال باشد، مسیر `404` برمی‌گرداند، چون ثبت نشده است.

## احراز هویت

مسیر Plugin از احراز هویت HTTP Gateway استفاده می‌کند.

مسیرهای رایج احراز هویت:

- احراز هویت با راز مشترک (`gateway.auth.mode="token"` یا `"password"`): `Authorization: Bearer <token-or-password>`
- احراز هویت HTTP دارای هویت مورداعتماد (`gateway.auth.mode="trusted-proxy"`): از طریق پروکسی پیکربندی‌شده آگاه از هویت مسیریابی کنید و بگذارید سرآیندهای هویت موردنیاز را تزریق کند
- احراز هویت باز ورودی خصوصی (`gateway.auth.mode="none"`): به سرآیند احراز هویت نیازی نیست

## مدل امنیتی

با این Plugin مانند یک سطح کامل اپراتور Gateway رفتار کنید.

- فعال‌سازی Plugin عمداً دسترسی به روش‌های admin RPC مجازشده را در `/api/v1/admin/rpc` فراهم می‌کند.
- Plugin قرارداد manifest رزروشده `contracts.gatewayMethodDispatch: ["authenticated-request"]` را اعلام می‌کند تا مسیر HTTP احرازشده با Gateway بتواند روش‌های صفحه کنترل را در همان فرایند dispatch کند.
- احراز هویت bearer با راز مشترک، داشتن راز اپراتور gateway را اثبات می‌کند.
- برای احراز هویت `token` و `password`، سرآیندهای محدودتر `x-openclaw-scopes` نادیده گرفته می‌شوند و پیش‌فرض‌های کامل عادی اپراتور بازیابی می‌شوند.
- حالت‌های HTTP دارای هویت مورداعتماد، در صورت وجود `x-openclaw-scopes`، آن را رعایت می‌کنند.
- `gateway.auth.mode="none"` یعنی اگر Plugin فعال باشد، این مسیر احراز هویت ندارد. فقط پشت یک ورودی خصوصی که کاملاً به آن اعتماد دارید از آن استفاده کنید.
- پس از عبور احراز هویت مسیر Plugin، درخواست‌ها از طریق همان هندلرهای روش Gateway و بررسی‌های scope مشابه WebSocket RPC dispatch می‌شوند.
- این مسیر را روی loopback، tailnet، یا یک ورودی خصوصی مورداعتماد نگه دارید. آن را مستقیماً در معرض اینترنت عمومی قرار ندهید.
- قراردادهای manifest Plugin سندباکس نیستند. آن‌ها از استفاده تصادفی از helperهای رزروشده SDK جلوگیری می‌کنند؛ Pluginهای مورداعتماد همچنان در فرایند Gateway اجرا می‌شوند.

وقتی فراخوانی‌کنندگان از مرزهای اعتماد عبور می‌کنند، از gatewayهای جداگانه استفاده کنید.

## درخواست

```http
POST /api/v1/admin/rpc
Authorization: Bearer <gateway-token>
Content-Type: application/json
```

```json
{
  "id": "optional-request-id",
  "method": "health",
  "params": {}
}
```

فیلدها:

- `id` (رشته، اختیاری): در پاسخ کپی می‌شود. اگر حذف شود، یک UUID تولید می‌شود.
- `method` (رشته، الزامی): نام روش مجاز Gateway.
- `params` (هر نوع، اختیاری): پارامترهای مخصوص روش.

حداکثر اندازه پیش‌فرض بدنه درخواست 1 MB است.

## پاسخ

پاسخ‌های موفق از شکل Gateway RPC استفاده می‌کنند:

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

خطاهای روش Gateway از این استفاده می‌کنند:

```json
{
  "id": "optional-request-id",
  "ok": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "bad params"
  }
}
```

وضعیت HTTP در صورت امکان از خطای Gateway پیروی می‌کند. برای مثال، `INVALID_REQUEST` مقدار `400` و `UNAVAILABLE` مقدار `503` برمی‌گرداند.

## روش‌های مجاز

- کشف: `commands.list`
  نام روش‌های HTTP RPC مجاز توسط این Plugin را برمی‌گرداند.
- gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`
- پیکربندی: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- کانال‌ها: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- وب: `web.login.start`, `web.login.wait`
- مدل‌ها: `models.list`, `models.authStatus`
- عامل‌ها: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- تأییدیه‌ها: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- دستگاه‌ها: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- گره‌ها: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- وظایف: `tasks.list`, `tasks.get`, `tasks.cancel`
- عیب‌یابی: `doctor.memory.status`, `update.status`

روش‌های دیگر Gateway تا زمانی که عمداً اضافه شوند، مسدود هستند.

## مقایسه WebSocket

مسیر عادی Gateway WebSocket RPC همچنان API صفحه کنترل ترجیحی برای کلاینت‌های OpenClaw است. از admin HTTP RPC فقط برای ابزارسازی میزبان که به یک سطح HTTP درخواست/پاسخ نیاز دارد استفاده کنید.

کلاینت‌های WebSocket با توکن مشترک و بدون هویت دستگاه مورداعتماد نمی‌توانند هنگام اتصال، scopeهای admin را خودشان اعلام کنند. Admin HTTP RPC عمداً از مدل موجود اپراتور HTTP مورداعتماد پیروی می‌کند: وقتی Plugin فعال است، احراز هویت bearer با راز مشترک برای این سطح admin به‌عنوان دسترسی کامل اپراتور در نظر گرفته می‌شود.

## عیب‌یابی

`404 Not Found`

: Plugin غیرفعال است، Gateway پس از فعال‌سازی آن بازراه‌اندازی نشده است، یا درخواست به فرایند Gateway دیگری می‌رود.

`401 Unauthorized`

: درخواست احراز هویت HTTP Gateway را برآورده نکرده است. توکن bearer یا سرآیندهای هویت trusted-proxy را بررسی کنید.

`400 INVALID_REQUEST`

: بدنه درخواست JSON معتبر نیست، فیلد `method` وجود ندارد، یا روش در فهرست مجاز Plugin نیست.

`503 UNAVAILABLE`

: هندلر روش Gateway در دسترس نیست. لاگ‌های Gateway را بررسی کنید و پس از پایان راه‌اندازی Gateway دوباره تلاش کنید.

## مرتبط

- [scopeهای اپراتور](/fa/gateway/operator-scopes)
- [امنیت Gateway](/fa/gateway/security)
- [دسترسی راه دور](/fa/gateway/remote)
- [manifest Plugin](/fa/plugins/manifest#contracts)
- [زیرمسیرهای SDK](/fa/plugins/sdk-subpaths)
