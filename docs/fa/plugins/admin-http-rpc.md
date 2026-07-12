---
read_when:
    - ساخت ابزارهای میزبان که نمی‌توانند از کلاینت RPC مبتنی بر WebSocket در Gateway استفاده کنند
    - قرار دادن خودکارسازی مدیریت Gateway پشت یک ورودی خصوصی و مورد اعتماد
    - ممیزی مدل امنیتی دسترسی HTTP به متدهای Gateway
summary: متدهای منتخب صفحهٔ کنترل Gateway را از طریق Plugin داخلی و اختیاری admin-http-rpc در دسترس قرار دهید
title: Plugin فراخوانی رویهٔ دوردست HTTP مدیریتی
x-i18n:
    generated_at: "2026-07-12T10:25:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0709081efd0ce65cef7edac54df9a71978cbad17e2b25df83ac9075de938376c
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

Plugin همراه `admin-http-rpc` مجموعه‌ای مجازشده از متدهای صفحهٔ کنترل Gateway را از طریق HTTP در اختیار خودکارسازی قابل‌اعتماد میزبان قرار می‌دهد که نمی‌تواند اتصال WebSocket به Gateway را باز نگه دارد.

این Plugin همراه OpenClaw عرضه می‌شود، اما به‌طور پیش‌فرض غیرفعال است؛ در حالت غیرفعال، مسیر ثبت نمی‌شود. با فعال‌سازی، `POST /api/v1/admin/rpc` را روی همان شنوندهٔ Gateway اضافه می‌کند (`http://<gateway-host>:<port>/api/v1/admin/rpc`).

آن را فقط برای ابزارهای خصوصی میزبان، خودکارسازی tailnet، یا یک ورودی داخلی قابل‌اعتماد فعال کنید. هرگز این مسیر را مستقیماً در معرض اینترنت عمومی قرار ندهید.

## پیش از فعال‌سازی

RPC مدیریتی HTTP یک سطح کامل صفحهٔ کنترل اپراتور است: هر فراخواننده‌ای که احراز هویت HTTP مربوط به Gateway را با موفقیت پشت سر بگذارد، می‌تواند متدهای مجازشدهٔ زیر را فراخوانی کند. آن را فقط زمانی فعال کنید که همهٔ شرایط زیر برقرار باشند:

- به فراخواننده برای ادارهٔ Gateway اعتماد دارید.
- فراخواننده نمی‌تواند از کلاینت RPC مبتنی بر WebSocket استفاده کند.
- مسیر فقط از طریق local loopback، یک tailnet، یا یک ورودی خصوصی احرازشده قابل دسترسی است.
- متدهای مجاز را بررسی کرده‌اید و با خودکارسازی موردنظر شما مطابقت دارند.

برای کلاینت‌های OpenClaw و ابزارهای تعاملی که می‌توانند اتصال WebSocket به Gateway را باز نگه دارند، به‌جای آن از RPC مبتنی بر WebSocket استفاده کنید.

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

مسیر هنگام راه‌اندازی Plugin ثبت می‌شود؛ بنابراین پس از تغییر پیکربندی Plugin، Gateway را مجدداً راه‌اندازی کنید.

وقتی دیگر به سطح HTTP نیاز ندارید، آن را غیرفعال کنید:

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## بررسی مسیر

از `health` به‌عنوان کوچک‌ترین درخواست امن استفاده کنید:

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

پاسخ موفق دارای `ok: true` است:

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

وقتی Plugin غیرفعال است، مسیر `404` برمی‌گرداند، زیرا ثبت نشده است.

## احراز هویت

مسیر Plugin از احراز هویت HTTP مربوط به Gateway استفاده می‌کند.

روش‌های رایج احراز هویت:

- احراز هویت با راز مشترک (`gateway.auth.mode="token"` یا `"password"`): `Authorization: Bearer <token-or-password>`
- احراز هویت HTTP مبتنی بر هویت قابل‌اعتماد (`gateway.auth.mode="trusted-proxy"`): درخواست را از پروکسی پیکربندی‌شده و آگاه از هویت عبور دهید تا سرآیندهای هویتی لازم را تزریق کند
- احراز هویت باز در ورودی خصوصی (`gateway.auth.mode="none"`): نیازی به سرآیند احراز هویت نیست

## مدل امنیتی

این Plugin را به‌عنوان سطح کامل اپراتوری Gateway در نظر بگیرید.

- فعال‌سازی Plugin عمداً دسترسی به متدهای RPC مدیریتی مجازشده را در `/api/v1/admin/rpc` فراهم می‌کند.
- Plugin قرارداد رزروشدهٔ مانیفست `contracts.gatewayMethodDispatch: ["authenticated-request"]` را اعلام می‌کند که به مسیر HTTP احرازشده توسط Gateway اجازه می‌دهد متدهای صفحهٔ کنترل را درون فرایند ارسال کند. این یک محیط ایزوله نیست: قرارداد از استفادهٔ تصادفی از توابع کمکی رزروشدهٔ SDK جلوگیری می‌کند، اما Pluginهای قابل‌اعتماد همچنان در فرایند Gateway اجرا می‌شوند.
- احراز هویت Bearer با راز مشترک (حالت‌های `token`/`password`) در اختیار داشتن راز اپراتور Gateway را اثبات می‌کند؛ سرآیندهای محدودتر `x-openclaw-scopes` در این مسیر نادیده گرفته می‌شوند و پیش‌فرض‌های عادی دسترسی کامل اپراتور بازیابی می‌شوند.
- احراز هویت HTTP مبتنی بر هویت قابل‌اعتماد (حالت `trusted-proxy`) در صورت وجود، `x-openclaw-scopes` را رعایت می‌کند.
- `gateway.auth.mode="none"` یعنی در صورت فعال بودن Plugin، این مسیر بدون احراز هویت است. فقط در پشت یک ورودی خصوصی که کاملاً به آن اعتماد دارید از این حالت استفاده کنید.
- پس از موفقیت احراز هویت مسیر Plugin، درخواست‌ها از همان کنترل‌کننده‌های متد و بررسی‌های محدودهٔ Gateway عبور می‌کنند که RPC مبتنی بر WebSocket استفاده می‌کند.
- مسیر در طول اجارهٔ تعلیق آماده‌شده همچنان قابل دسترسی می‌ماند. اعتبارسنجی محدود درخواست و پاسخ محلی کشف `commands.list` همچنان در دسترس‌اند. از میان متدهایی که به Gateway ارسال می‌شوند، هنگام بسته بودن پذیرش فقط `gateway.suspend.prepare`، `gateway.suspend.status` و `gateway.suspend.resume` قابل اجرا هستند؛ سایر متدهای مجازشده پاسخ عادی و قابل‌تلاش‌مجدد `UNAVAILABLE` از Gateway را برمی‌گردانند.
- این مسیر را روی local loopback، tailnet، یا یک ورودی خصوصی قابل‌اعتماد نگه دارید. آن را مستقیماً در معرض اینترنت عمومی قرار ندهید. هنگامی که فراخوانندگان از مرزهای اعتماد عبور می‌کنند، از Gatewayهای جداگانه استفاده کنید.

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

- `id` (رشته، اختیاری): در پاسخ کپی می‌شود. در صورت حذف، یک UUID تولید می‌شود.
- `method` (رشته، الزامی): نام متد مجاز Gateway.
- `params` (هر نوع، اختیاری): پارامترهای مخصوص متد.

حداکثر اندازهٔ پیش‌فرض بدنهٔ درخواست ۱ مگابایت است.

## پاسخ

پاسخ‌های موفق از ساختار RPC مربوط به Gateway استفاده می‌کنند:

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

خطاهای متد Gateway از ساختار زیر استفاده می‌کنند:

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

وضعیت HTTP از کد خطا پیروی می‌کند:

| کد خطا                    | وضعیت HTTP |
| -------------------------- | ----------- |
| `INVALID_REQUEST`          | 400         |
| `APPROVAL_NOT_FOUND`       | 404         |
| `NOT_LINKED`, `NOT_PAIRED` | 409         |
| `UNAVAILABLE`              | 503         |
| `AGENT_TIMEOUT`            | 504         |
| هر کد دیگر                 | 500         |

## متدهای مجاز

- کشف: `commands.list`
  نام متدهای RPC مبتنی بر HTTP را که این Plugin مجاز می‌داند برمی‌گرداند.
- Gateway: `health`، `status`، `logs.tail`، `usage.status`، `usage.cost`، `gateway.restart.request`، `gateway.suspend.prepare`، `gateway.suspend.status`، `gateway.suspend.resume`
- پیکربندی: `config.get`، `config.schema`، `config.schema.lookup`، `config.set`، `config.patch`، `config.apply`
- کانال‌ها: `channels.status`، `channels.start`، `channels.stop`، `channels.logout`
- وب: `web.login.start`، `web.login.wait`
- مدل‌ها: `models.list`، `models.authStatus`
- عامل‌ها: `agents.list`، `agents.create`، `agents.update`، `agents.delete`
- تأییدها: `exec.approvals.get`، `exec.approvals.set`، `exec.approvals.node.get`، `exec.approvals.node.set`
- Cron: `cron.status`، `cron.list`، `cron.get`، `cron.runs`، `cron.add`، `cron.update`، `cron.remove`، `cron.run`
- دستگاه‌ها: `device.pair.list`، `device.pair.approve`، `device.pair.reject`، `device.pair.remove`
- Nodeها: `node.list`، `node.describe`، `node.pair.list`، `node.pair.approve`، `node.pair.reject`، `node.pair.remove`، `node.rename`
- وظایف: `tasks.list`، `tasks.get`، `tasks.cancel`
- عیب‌یابی: `doctor.memory.status`، `update.status`

سایر متدهای Gateway تا زمانی که عمداً اضافه نشوند مسدود هستند.

## مقایسه با WebSocket

مسیر عادی RPC مبتنی بر WebSocket در Gateway همچنان API ترجیحی صفحهٔ کنترل برای کلاینت‌های OpenClaw است. از RPC مدیریتی HTTP فقط برای ابزارهای میزبان استفاده کنید که به یک سطح درخواست/پاسخ HTTP نیاز دارند.

کلاینت‌های WebSocket با توکن مشترک که هویت دستگاه قابل‌اعتماد ندارند، هنگام اتصال نمی‌توانند محدوده‌های مدیریتی را خودشان اعلام کنند. RPC مدیریتی HTTP عمداً از مدل موجود اپراتور HTTP قابل‌اعتماد پیروی می‌کند: وقتی Plugin فعال است، احراز هویت Bearer با راز مشترک برای این سطح مدیریتی به‌عنوان دسترسی کامل اپراتور در نظر گرفته می‌شود.

## عیب‌یابی

`404 Not Found`

: Plugin غیرفعال است، Gateway پس از فعال‌سازی آن مجدداً راه‌اندازی نشده است، یا درخواست به فرایند دیگری از Gateway ارسال می‌شود.

`401 Unauthorized`

: درخواست شرایط احراز هویت HTTP مربوط به Gateway را برآورده نکرده است. توکن Bearer یا سرآیندهای هویتی `trusted-proxy` را بررسی کنید.

`405 Method Not Allowed`

: درخواست از روشی غیر از `POST` استفاده کرده است.

`413 Payload Too Large`

: بدنهٔ درخواست از محدودیت ۱ مگابایت فراتر رفته است.

`400 INVALID_REQUEST`

: بدنهٔ درخواست JSON معتبر نیست، فیلد `method` وجود ندارد، متد در فهرست مجاز Plugin نیست، یا شناسهٔ ازسرگیری تعلیق با اجارهٔ فعال مطابقت ندارد.

`503 UNAVAILABLE`

: متد Gateway در حال راه‌اندازی، محدودشده از نظر نرخ، معلق، یا منتظر یک عملیات تعلیق/ازسرگیری رقیب است. در صورت وجود، `error.details` را بررسی کنید و پیش از تلاش مجدد، `error.retryAfterMs` را رعایت کنید.

## مرتبط

- [محدوده‌های اپراتور](/fa/gateway/operator-scopes)
- [امنیت Gateway](/fa/gateway/security)
- [دسترسی راه دور](/fa/gateway/remote)
- [مانیفست Plugin](/fa/plugins/manifest#contracts-reference)
- [زیرمسیرهای SDK](/fa/plugins/sdk-subpaths)
