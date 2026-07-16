---
read_when:
    - می‌خواهید پیکربندی را به‌صورت غیرتعاملی بخوانید یا ویرایش کنید
sidebarTitle: Config
summary: مرجع CLI برای `openclaw config` (get/set/patch/unset/file/schema/validate)
title: پیکربندی
x-i18n:
    generated_at: "2026-07-16T16:27:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 63be5cbac6c7db9c6b93ad690e5decab9f4ce7904e8b10f26a3b1e39e4729450
    source_path: cli/config.md
    workflow: 16
---

ابزارهای کمکی غیرتعاملی برای `openclaw.json`: دریافت/تنظیم/وصله‌کردن/حذف تنظیم یک مقدار بر اساس مسیر، چاپ طرح‌واره، اعتبارسنجی، یا چاپ مسیر فایل فعال. برای بازکردن همان راهنمای گام‌به‌گام `openclaw configure`، دستور `openclaw config` را بدون زیردستور اجرا کنید.

<Note>
وقتی `OPENCLAW_NIX_MODE=1`، OpenClaw فایل `openclaw.json` را تغییرناپذیر در نظر می‌گیرد. فرمان‌های فقط‌خواندنی (`config get`، `config file`، `config schema`، `config validate`) همچنان کار می‌کنند؛ نویسنده‌های پیکربندی از انجام عملیات خودداری می‌کنند. در عوض، منبع Nix مربوط به نصب را ویرایش کنید؛ برای توزیع رسمی nix-openclaw، از [شروع سریع nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) استفاده کنید و مقادیر را زیر `programs.openclaw.config` یا `instances.<name>.config` تنظیم کنید.
</Note>

## گزینه‌های ریشه

<ParamField path="--section <section>" type="string">
  فیلتر تکرارپذیر بخش راه‌اندازی هدایت‌شده، هنگام اجرای `openclaw config` بدون زیردستور.
</ParamField>

بخش‌های هدایت‌شده: `workspace`، `model`، `web`، `gateway`، `daemon`، `channels`، `plugins`، `skills`، `health`.

## مثال‌ها

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### مسیرها

نمادگذاری نقطه‌ای یا براکتی. مسیرهای براکتی را در مثال‌های پوسته داخل نقل‌قول قرار دهید تا zsh مقدار `[0]` را با glob گسترش ندهد:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

یک مقدار را از تصویر لحظه‌ای پیکربندیِ پوشانده‌شده می‌خواند (مقادیر محرمانه هرگز چاپ نمی‌شوند). `--json` مقدار خام را به‌صورت JSON چاپ می‌کند؛ در غیر این صورت، رشته‌ها/اعداد/مقادیر بولی بدون قالب‌بندی و اشیا/آرایه‌ها به‌صورت JSON قالب‌بندی‌شده چاپ می‌شوند.

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

مسیر فایل پیکربندی فعال را که از `OPENCLAW_CONFIG_PATH` یا مکان پیش‌فرض حل شده است چاپ می‌کند. مسیر به یک فایل معمولی اشاره می‌کند، نه یک پیوند نمادین؛ [ایمنی نوشتن](#write-safety) را ببینید.

### `config schema`

طرح‌واره JSON تولیدشده برای `openclaw.json` را در خروجی استاندارد چاپ می‌کند.

<AccordionGroup>
  <Accordion title="مواردی که شامل می‌شود">
    - طرح‌واره پیکربندی ریشه فعلی، به‌همراه یک فیلد رشته‌ای `$schema` در ریشه برای ابزارهای ویرایشگر.
    - فراداده مستندات فیلد `title` / `description` که Control UI از آن استفاده می‌کند.
    - گره‌های شیء تو‌در‌تو، نویسه عام (`*`) و عضو آرایه (`[]`) هنگام وجود مستندات منطبق فیلد، همان فراداده `title` / `description` را به ارث می‌برند.
    - شاخه‌های `anyOf` / `oneOf` / `allOf` نیز همان فراداده مستندات را به ارث می‌برند.
    - فراداده زنده طرح‌واره Plugin و کانال به‌صورت بهترین تلاش، هنگامی که مانیفست‌های زمان اجرا قابل بارگذاری باشند.
    - یک طرح‌واره جایگزین پاک حتی وقتی پیکربندی فعلی نامعتبر است.

  </Accordion>
  <Accordion title="RPC مرتبط زمان اجرا">
    `config.schema.lookup` یک مسیر پیکربندی نرمال‌شده را با یک گره کم‌عمق طرح‌واره (`title`، `description`، `type`، `enum`، `const`، کران‌های رایج)، فراداده راهنمای رابط کاربری منطبق و خلاصه فرزندان بلافصل برمی‌گرداند. از آن برای پیمایش جزئیات محدود به مسیر در Control UI یا کلاینت‌های سفارشی استفاده کنید.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

پیکربندی فعلی را بدون راه‌اندازی Gateway در برابر طرح‌واره فعال اعتبارسنجی می‌کند.

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
اگر اعتبارسنجی از قبل ناموفق است، با `openclaw configure` یا `openclaw doctor --fix` شروع کنید. `openclaw chat` محافظ پیکربندی نامعتبر را دور نمی‌زند.
</Note>

## مقادیر

مقادیر در صورت امکان به‌صورت JSON5 تجزیه می‌شوند؛ در غیر این صورت، رشته خام در نظر گرفته می‌شوند. برای الزام به JSON استاندارد بدون بازگشت به رشته از `--strict-json` استفاده کنید (در این حالت، نحو مختص JSON5 مانند توضیحات، ویرگول‌های انتهایی یا کلیدهای بدون نقل‌قول رد می‌شود). `--json` یک نام مستعار قدیمی برای `--strict-json` در `config set` است.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` مقدار خام را به‌جای متن قالب‌بندی‌شده برای ترمینال، به‌صورت JSON چاپ می‌کند.

<Note>
انتساب شیء به‌طور پیش‌فرض مسیر هدف را جایگزین می‌کند. مسیرهای محافظت‌شده‌ای که معمولاً ورودی‌های افزوده‌شده توسط کاربر را نگه می‌دارند، جایگزینی‌هایی را که ورودی‌های موجود را حذف کنند نمی‌پذیرند، مگر اینکه `--replace` را ارسال کنید: `agents.defaults.models`، `agents.list`، `models.providers`، `models.providers.<id>`، `models.providers.<id>.models`، `plugins.entries` و `auth.profiles`.
</Note>

هنگام افزودن ورودی به این نگاشت‌ها از `--merge` استفاده کنید:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

تنها زمانی از `--replace` استفاده کنید که مقدار ارائه‌شده باید عمداً به مقدار کامل هدف تبدیل شود.

## حالت‌های `config set`

<Tabs>
  <Tab title="حالت مقدار">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="حالت سازنده SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="حالت سازنده ارائه‌دهنده">
    فقط مسیرهای `secrets.providers.<alias>` را هدف می‌گیرد:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="حالت دسته‌ای">
    ```bash
    openclaw config set --batch-json '[
      {
        "path": "secrets.providers.default",
        "provider": { "source": "env" }
      },
      {
        "path": "channels.discord.token",
        "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
      }
    ]'
    ```

    ```bash
    openclaw config set --batch-file ./config-set.batch.json --dry-run
    ```

  </Tab>
</Tabs>

<Warning>
انتساب‌های SecretRef روی سطوح تغییرپذیر زمان اجرای پشتیبانی‌نشده رد می‌شوند (برای مثال `hooks.token`، `commands.ownerDisplaySecret`، توکن‌های Webhook اتصال رشته‌های Discord و JSON اطلاعات اعتبارسنجی WhatsApp). [سطح اطلاعات اعتبارسنجی SecretRef](/fa/reference/secretref-credential-surface) را ببینید.
</Warning>

تجزیه دسته‌ای همیشه محموله دسته‌ای (`--batch-json`/`--batch-file`) را منبع حقیقت قرار می‌دهد؛ `--strict-json` / `--json` رفتار تجزیه دسته‌ای را تغییر نمی‌دهند.

حالت مسیر/مقدار JSON برای SecretRefها و ارائه‌دهندگان نیز مستقیماً کار می‌کند:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### پرچم‌های سازنده ارائه‌دهنده

اهداف سازنده ارائه‌دهنده باید از `secrets.providers.<alias>` به‌عنوان مسیر استفاده کنند.

<AccordionGroup>
  <Accordion title="پرچم‌های عمومی">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`، `exec`)

  </Accordion>
  <Accordion title="ارائه‌دهنده محیط (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (تکرارپذیر)

  </Accordion>
  <Accordion title="ارائه‌دهنده فایل (--provider-source file)">
    - `--provider-path <path>` (الزامی)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="ارائه‌دهنده اجرا (--provider-source exec)">
    - `--provider-command <path>` (الزامی)
    - `--provider-arg <arg>` (تکرارپذیر)
    - `--provider-no-output-timeout-ms <ms>`
    - `--provider-max-output-bytes <bytes>`
    - `--provider-json-only`
    - `--provider-env <KEY=VALUE>` (تکرارپذیر)
    - `--provider-pass-env <ENV_VAR>` (تکرارپذیر)
    - `--provider-trusted-dir <path>` (تکرارپذیر)
    - `--provider-allow-insecure-path`
    - `--provider-allow-symlink-command`

  </Accordion>
</AccordionGroup>

مثال ارائه‌دهنده اجرای سخت‌سازی‌شده:

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## `config patch`

به‌جای اجرای چندین فرمان مسیرمحور `config set`، یک وصله JSON5 به‌شکل پیکربندی را جای‌گذاری یا لوله‌گذاری کنید. اشیا به‌صورت بازگشتی ادغام می‌شوند؛ آرایه‌ها و مقادیر اسکالر هدف را جایگزین می‌کنند؛ `null` مسیر هدف را حذف می‌کند.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

برای اسکریپت‌های راه‌اندازی راه دور، یک وصله را از طریق ورودی استاندارد لوله‌گذاری کنید:

```bash
ssh user@gateway-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh user@gateway-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

نمونه وصله:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

وقتی یک شیء یا آرایه باید به‌جای وصله‌شدن بازگشتی، دقیقاً به مقدار ارائه‌شده تبدیل شود، از `--replace-path <path>` استفاده کنید:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` بررسی‌های طرح‌واره و قابلیت حل SecretRef را بدون نوشتن اجرا می‌کند. SecretRefهای متکی به اجرا به‌طور پیش‌فرض هنگام اجرای آزمایشی نادیده گرفته می‌شوند؛ وقتی عمداً می‌خواهید اجرای آزمایشی فرمان‌های ارائه‌دهنده را اجرا کند، `--allow-exec` را اضافه کنید.

## اجرای آزمایشی

`--dry-run` تغییرات را بدون نوشتن در `openclaw.json` اعتبارسنجی می‌کند. در `config set`، `config patch` و `config unset` در دسترس است.

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

<AccordionGroup>
  <Accordion title="رفتار اجرای آزمایشی">
    - حالت سازنده: بررسی‌های قابلیت تفکیک SecretRef را برای ارجاع‌ها/ارائه‌دهندگان تغییریافته اجرا می‌کند.
    - حالت JSON (`--strict-json`، `--json` یا حالت دسته‌ای): اعتبارسنجی طرح‌واره را همراه با بررسی‌های قابلیت تفکیک SecretRef اجرا می‌کند.
    - اعتبارسنجی خط‌مشی روی کل پیکربندی پس از تغییر اجرا می‌شود؛ بنابراین نوشتن اشیای والد (برای مثال، تنظیم `hooks` به‌صورت یک شیء) نمی‌تواند اعتبارسنجی سطوح پشتیبانی‌نشده را دور بزند.
    - بررسی‌های Exec SecretRef به‌طور پیش‌فرض برای جلوگیری از عوارض جانبی فرمان نادیده گرفته می‌شوند؛ برای فعال‌سازی آن‌ها، `--allow-exec` را ارسال کنید (این کار ممکن است فرمان‌های ارائه‌دهنده را اجرا کند). `--allow-exec` فقط برای اجرای آزمایشی است و بدون `--dry-run` خطا می‌دهد.

  </Accordion>
  <Accordion title="فیلدهای --dry-run --json">
    - `ok`: آیا اجرای آزمایشی موفق بوده است
    - `operations`: تعداد انتساب‌های ارزیابی‌شده
    - `checks`: آیا بررسی‌های طرح‌واره/قابلیت تفکیک اجرا شده‌اند
    - `checks.resolvabilityComplete`: آیا بررسی‌های قابلیت تفکیک تا پایان اجرا شده‌اند (هنگامی که ارجاع‌های exec نادیده گرفته شوند، false است)
    - `refsChecked`: تعداد ارجاع‌هایی که واقعاً هنگام اجرای آزمایشی تفکیک شده‌اند
    - `skippedExecRefs`: تعداد ارجاع‌های exec که به‌دلیل تنظیم‌نبودن `--allow-exec` نادیده گرفته شده‌اند
    - `errors`: خطاهای ساختاریافتهٔ مسیر مفقود، طرح‌واره یا قابلیت تفکیک هنگامی که `ok=false`

  </Accordion>
</AccordionGroup>

### ساختار خروجی JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder" | "unset", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "missing-path" | "schema" | "resolvability",
      message: string,
      ref?: string, // برای خطاهای قابلیت تفکیک وجود دارد
    },
  ],
}
```

<Tabs>
  <Tab title="نمونهٔ موفق">
    ```json
    {
      "ok": true,
      "operations": 1,
      "configPath": "~/.openclaw/openclaw.json",
      "inputModes": ["builder"],
      "checks": {
        "schema": false,
        "resolvability": true,
        "resolvabilityComplete": true
      },
      "refsChecked": 1,
      "skippedExecRefs": 0
    }
    ```
  </Tab>
  <Tab title="نمونهٔ ناموفق">
    ```json
    {
      "ok": false,
      "operations": 1,
      "configPath": "~/.openclaw/openclaw.json",
      "inputModes": ["builder"],
      "checks": {
        "schema": false,
        "resolvability": true,
        "resolvabilityComplete": true
      },
      "refsChecked": 1,
      "skippedExecRefs": 0,
      "errors": [
        {
          "kind": "resolvability",
          "message": "خطا: متغیر محیطی \"MISSING_TEST_SECRET\" تنظیم نشده است.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="اگر اجرای آزمایشی ناموفق بود">
    - `config schema validation failed`: ساختار پیکربندی پس از تغییر نامعتبر است؛ مسیر/مقدار یا ساختار شیء ارائه‌دهنده/ارجاع را اصلاح کنید.
    - `Config policy validation failed: unsupported SecretRef usage`: آن اعتبارنامه را به ورودی متن ساده/رشته‌ای برگردانید؛ SecretRefها را فقط روی سطوح پشتیبانی‌شده نگه دارید.
    - `SecretRef assignment(s) could not be resolved`: ارائه‌دهنده/ارجاع موردنظر در حال حاضر قابل تفکیک نیست (متغیر محیطی مفقود، اشاره‌گر فایل نامعتبر، شکست ارائه‌دهندهٔ exec یا عدم تطابق ارائه‌دهنده/منبع).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: اگر به اعتبارسنجی قابلیت تفکیک exec نیاز دارید، دوباره با `--allow-exec` اجرا کنید.
    - برای حالت دسته‌ای، ورودی‌های ناموفق را اصلاح کنید و پیش از نوشتن، `--dry-run` را دوباره اجرا کنید.

  </Accordion>
</AccordionGroup>

## اعمال تغییرات

پس از هر اجرای موفق `config set` / `config patch` / `config unset`، CLI یکی از سه راهنمای زیر را نمایش می‌دهد تا مشخص شود آیا Gateway به راه‌اندازی مجدد نیاز دارد:

| راهنما                                                | معنی                                |
| --------------------------------------------------- | -------------------------------------- |
| `Restart the gateway to apply.`                     | مسیر تغییریافته به راه‌اندازی مجدد کامل نیاز دارد. |
| `Change will apply without restarting the gateway.` | بازبارگذاری گرم آن را به‌طور خودکار اعمال می‌کند.  |
| `No gateway restart needed.`                        | هیچ مورد مرتبط با زمان اجرا تغییر نکرده است.      |

نوشتن در `plugins.entries` (یا هر زیرمسیر آن) همیشه به راه‌اندازی مجدد نیاز دارد، زیرا CLI نمی‌تواند ثابت کند که فرادادهٔ بازبارگذاری همهٔ Pluginها بارگذاری شده است.

## ایمنی نوشتن

`openclaw config set` و دیگر نویسنده‌های پیکربندی متعلق به OpenClaw، پیش از ثبت پیکربندی روی دیسک، کل پیکربندی پس از تغییر را اعتبارسنجی می‌کنند. اگر محتوای جدید در اعتبارسنجی طرح‌واره ناموفق باشد یا شبیه بازنویسی مخرب به نظر برسد، پیکربندی فعال دست‌نخورده باقی می‌ماند و محتوای ردشده با نام `openclaw.json.rejected.*` در کنار آن ذخیره می‌شود.

نوشتن‌های متعلق به OpenClaw، JSON5 را دوباره به‌صورت JSON استاندارد سریال‌سازی می‌کنند. هنگامی که منبع شامل توضیحات باشد، نویسنده درست پیش از حذف آن‌ها هشدار می‌دهد؛ اگر حفظ توضیحات مهم است، از یک ویرایشگر مستقیم استفاده کنید.

<Warning>
مسیر پیکربندی فعال باید یک فایل عادی باشد. چیدمان‌های `openclaw.json` دارای پیوند نمادین برای نوشتن پشتیبانی نمی‌شوند؛ در عوض، از `OPENCLAW_CONFIG_PATH` برای اشارهٔ مستقیم به فایل واقعی استفاده کنید.
</Warning>

برای ویرایش‌های کوچک، نوشتن با CLI را ترجیح دهید:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

اگر نوشتن رد شد، محتوای ذخیره‌شده را بررسی و ساختار کامل پیکربندی را اصلاح کنید:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

نوشتن مستقیم با ویرایشگر همچنان مجاز است، اما Gateway در حال اجرا تا زمان اعتبارسنجی، آن را نامطمئن تلقی می‌کند. ویرایش‌های مستقیم نامعتبر باعث شکست راه‌اندازی می‌شوند یا در بازبارگذاری گرم نادیده گرفته می‌شوند؛ Gateway فایل `openclaw.json` را بازنویسی نمی‌کند. برای تعمیر پیکربندی پیشونددار/بازنویسی‌شده یا بازیابی آخرین نسخهٔ سالم شناخته‌شده، `openclaw doctor --fix` را اجرا کنید. به [عیب‌یابی Gateway](/fa/gateway/troubleshooting#gateway-rejected-invalid-config) مراجعه کنید.

بازیابی کل فایل فقط برای تعمیر توسط doctor در نظر گرفته شده است. تغییرات طرح‌وارهٔ Plugin یا ناهمگونی `minHostVersion` به‌جای بازگرداندن تنظیمات نامرتبط کاربر، مانند مدل‌ها، ارائه‌دهندگان، نمایه‌های احراز هویت، کانال‌ها، دسترسی Gateway، ابزارها، حافظه، مرورگر یا پیکربندی cron، آشکارا خطا می‌دهند.

## چرخهٔ تعمیر

پس از موفقیت `openclaw config validate`، از TUI محلی استفاده کنید تا یک عامل تعبیه‌شده پیکربندی فعال را با مستندات مقایسه کند، درحالی‌که هر تغییر را از همان پایانه اعتبارسنجی می‌کنید:

```bash
openclaw chat
```

درون TUI، یک `!` ابتدایی، فرمان پوستهٔ محلی را عیناً اجرا می‌کند (پس از یک اعلان تأیید یک‌باره در هر نشست):

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="مقایسه با مستندات">
    از عامل بخواهید پیکربندی فعلی را با صفحهٔ مرتبط مستندات مقایسه و کوچک‌ترین اصلاح را پیشنهاد کند.
  </Step>
  <Step title="اعمال ویرایش‌های هدفمند">
    ویرایش‌های هدفمند را با `openclaw config set` یا `openclaw configure` اعمال کنید.
  </Step>
  <Step title="اعتبارسنجی مجدد">
    پس از هر تغییر، `openclaw config validate` را دوباره اجرا کنید.
  </Step>
  <Step title="استفاده از doctor برای مشکلات زمان اجرا">
    اگر اعتبارسنجی موفق است اما زمان اجرا همچنان ناسالم است، برای دریافت کمک در مهاجرت و تعمیر، `openclaw doctor` یا `openclaw doctor --fix` را اجرا کنید.
  </Step>
</Steps>

## مرتبط

- [مرجع CLI](/fa/cli)
- [پیکربندی](/fa/gateway/configuration)
