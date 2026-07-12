---
read_when:
    - می‌خواهید پیکربندی را به‌صورت غیرتعاملی بخوانید یا ویرایش کنید
sidebarTitle: Config
summary: مرجع CLI برای `openclaw config` ‏(get/set/patch/unset/file/schema/validate)
title: پیکربندی
x-i18n:
    generated_at: "2026-07-12T09:43:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a9531407b2314d1a6bc05a87eb7efb6c37a847378b150125693f4d59733a2e9
    source_path: cli/config.md
    workflow: 16
---

کمک‌ابزارهای غیرتعاملی برای `openclaw.json`: دریافت/تنظیم/وصله‌کردن/حذف یک مقدار بر اساس مسیر، چاپ طرح‌واره، اعتبارسنجی، یا چاپ مسیر فایل فعال. برای بازکردن همان راهنمای گام‌به‌گام `openclaw configure`، دستور `openclaw config` را بدون زیردستور اجرا کنید.

<Note>
وقتی `OPENCLAW_NIX_MODE=1` باشد، OpenClaw فایل `openclaw.json` را تغییرناپذیر در نظر می‌گیرد. دستورهای فقط‌خواندنی (`config get`، `config file`، `config schema`، `config validate`) همچنان کار می‌کنند؛ دستورهای تغییردهندهٔ پیکربندی اجرا نمی‌شوند. به‌جای آن، منبع Nix نصب را ویرایش کنید؛ برای توزیع رسمی nix-openclaw، از [شروع سریع nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) استفاده کنید و مقادیر را زیر `programs.openclaw.config` یا `instances.<name>.config` تنظیم کنید.
</Note>

## گزینه‌های ریشه

<ParamField path="--section <section>" type="string">
  پالایهٔ تکرارپذیر بخش راه‌اندازی هدایت‌شده، هنگام اجرای `openclaw config` بدون زیردستور.
</ParamField>

بخش‌های هدایت‌شده: `workspace`، `model`، `web`، `gateway`، `daemon`، `channels`، `plugins`، `skills`، `health`.

## نمونه‌ها

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

نمادگذاری نقطه‌ای یا کروشه‌ای. مسیرهای کروشه‌ای را در نمونه‌های پوسته داخل نقل‌قول قرار دهید تا zsh عبارت `[0]` را به‌صورت الگوی glob گسترش ندهد:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

مقداری را از نمای لحظه‌ای پیکربندیِ پوشانده‌شده می‌خواند (مقادیر محرمانه هرگز چاپ نمی‌شوند). گزینهٔ `--json` مقدار خام را به‌صورت JSON چاپ می‌کند؛ در غیر این صورت، رشته‌ها/عددها/مقادیر بولی بدون قالب‌بندی و اشیا/آرایه‌ها به‌صورت JSON قالب‌بندی‌شده چاپ می‌شوند.

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

مسیر فایل پیکربندی فعال را چاپ می‌کند که از `OPENCLAW_CONFIG_PATH` یا مکان پیش‌فرض تعیین می‌شود. این مسیر به یک فایل معمولی اشاره می‌کند، نه پیوند نمادین؛ [ایمنی نوشتن](#write-safety) را ببینید.

### `config schema`

طرح‌وارهٔ JSON تولیدشده برای `openclaw.json` را در خروجی استاندارد چاپ می‌کند.

<AccordionGroup>
  <Accordion title="محتویات آن">
    - طرح‌وارهٔ فعلی پیکربندی ریشه، به‌همراه یک فیلد رشته‌ای `$schema` در ریشه برای ابزارهای ویرایشگر.
    - فرادادهٔ مستندات فیلدهای `title` / `description` که Control UI از آن استفاده می‌کند.
    - گره‌های شیء تودرتو، نویسهٔ عام (`*`) و عضو آرایه (`[]`) در صورت وجود مستندات متناظر فیلد، همان فرادادهٔ `title` / `description` را به ارث می‌برند.
    - شاخه‌های `anyOf` / `oneOf` / `allOf` نیز همان فرادادهٔ مستندات را به ارث می‌برند.
    - فرادادهٔ زندهٔ طرح‌وارهٔ Plugin و کانال، به‌صورت بهترین تلاش، هنگامی که مانیفست‌های زمان اجرا قابل بارگذاری باشند.
    - یک طرح‌وارهٔ جایگزین پاک حتی زمانی که پیکربندی فعلی نامعتبر باشد.

  </Accordion>
  <Accordion title="RPC مرتبط زمان اجرا">
    `config.schema.lookup` یک مسیر پیکربندی نرمال‌شده را همراه با یک گرهٔ کم‌عمق طرح‌واره (`title`، `description`، `type`، `enum`، `const`، محدودیت‌های متداول)، فرادادهٔ راهنمای رابط کاربری منطبق و خلاصهٔ فرزندان مستقیم برمی‌گرداند. از آن برای واکاوی محدود به مسیر در Control UI یا کارخواه‌های سفارشی استفاده کنید.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

پیکربندی فعلی را بدون راه‌اندازی Gateway در برابر طرح‌وارهٔ فعال اعتبارسنجی می‌کند.

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
اگر اعتبارسنجی از قبل ناموفق است، با `openclaw configure` یا `openclaw doctor --fix` شروع کنید. `openclaw chat` محافظ پیکربندی نامعتبر را دور نمی‌زند.
</Note>

## مقادیر

مقادیر در صورت امکان به‌صورت JSON5 تجزیه می‌شوند؛ در غیر این صورت، رشتهٔ خام در نظر گرفته می‌شوند. برای الزام JSON استاندارد بدون بازگشت به رشته از `--strict-json` استفاده کنید (در این حالت، نحو مختص JSON5 مانند توضیحات، ویرگول‌های انتهایی یا کلیدهای بدون نقل‌قول رد می‌شود). در `config set`، گزینهٔ `--json` نام مستعار قدیمی `--strict-json` است.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

دستور `config get <path> --json` به‌جای متن قالب‌بندی‌شده برای پایانه، مقدار خام را به‌صورت JSON چاپ می‌کند.

<Note>
تخصیص شیء به‌طور پیش‌فرض مسیر مقصد را جایگزین می‌کند. مسیرهای محافظت‌شده‌ای که معمولاً حاوی ورودی‌های افزوده‌شده توسط کاربر هستند، جایگزینی‌هایی را که ورودی‌های موجود را حذف کنند نمی‌پذیرند، مگر اینکه `--replace` را ارسال کنید: `agents.defaults.models`، `agents.list`، `models.providers`، `models.providers.<id>`، `models.providers.<id>.models`، `plugins.entries` و `auth.profiles`.
</Note>

هنگام افزودن ورودی به این نگاشت‌ها از `--merge` استفاده کنید:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

از `--replace` فقط زمانی استفاده کنید که مقدار ارائه‌شده باید عمداً کل مقدار مقصد شود.

## حالت‌های `config set`

<Tabs>
  <Tab title="حالت مقدار">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="حالت سازندهٔ SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="حالت سازندهٔ ارائه‌دهنده">
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
تخصیص‌های SecretRef روی سطوح پشتیبانی‌نشده‌ای که در زمان اجرا قابل تغییرند رد می‌شوند (برای نمونه `hooks.token`، `commands.ownerDisplaySecret`، توکن‌های Webhook اتصال رشته‌های Discord و JSON اعتبارنامه‌های WhatsApp). [سطح اعتبارنامهٔ SecretRef](/fa/reference/secretref-credential-surface) را ببینید.
</Warning>

تجزیهٔ دسته‌ای همیشه محمولهٔ دسته‌ای (`--batch-json`/`--batch-file`) را منبع حقیقت در نظر می‌گیرد؛ `--strict-json` / `--json` رفتار تجزیهٔ دسته‌ای را تغییر نمی‌دهند.

حالت مسیر/مقدار JSON مستقیماً برای SecretRefها و ارائه‌دهندگان نیز کار می‌کند:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### پرچم‌های سازندهٔ ارائه‌دهنده

مقصدهای سازندهٔ ارائه‌دهنده باید از `secrets.providers.<alias>` به‌عنوان مسیر استفاده کنند.

<AccordionGroup>
  <Accordion title="پرچم‌های مشترک">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`، `exec`)

  </Accordion>
  <Accordion title="ارائه‌دهندهٔ محیطی (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (تکرارپذیر)

  </Accordion>
  <Accordion title="ارائه‌دهندهٔ فایل (--provider-source file)">
    - `--provider-path <path>` (الزامی)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="ارائه‌دهندهٔ اجرایی (--provider-source exec)">
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

نمونهٔ ارائه‌دهندهٔ اجرایی سخت‌گیری‌شده:

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

به‌جای اجرای چندین دستور مسیرمحور `config set`، یک وصلهٔ JSON5 با شکل پیکربندی را جای‌گذاری یا از طریق لوله ارسال کنید. اشیا به‌صورت بازگشتی ادغام می‌شوند؛ آرایه‌ها و مقادیر اسکالر مقصد را جایگزین می‌کنند؛ `null` مسیر مقصد را حذف می‌کند.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

برای اسکریپت‌های راه‌اندازی راه‌دور، وصله را از طریق ورودی استاندارد لوله کنید:

```bash
ssh user@gateway-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh user@gateway-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

نمونهٔ وصله:

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

وقتی یک شیء یا آرایه باید به‌جای وصله‌شدن بازگشتی دقیقاً به مقدار ارائه‌شده تبدیل شود، از `--replace-path <path>` استفاده کنید:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

گزینهٔ `--dry-run` بررسی طرح‌واره و قابلیت تفکیک SecretRef را بدون نوشتن اجرا می‌کند. SecretRefهای متکی به exec به‌طور پیش‌فرض هنگام اجرای آزمایشی نادیده گرفته می‌شوند؛ اگر عمداً می‌خواهید اجرای آزمایشی دستورهای ارائه‌دهنده را اجرا کند، `--allow-exec` را اضافه کنید.

## اجرای آزمایشی

گزینهٔ `--dry-run` تغییرات را بدون نوشتن در `openclaw.json` اعتبارسنجی می‌کند. این گزینه برای `config set`، `config patch` و `config unset` در دسترس است.

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
    - حالت سازنده: بررسی‌های قابل‌حل‌بودن SecretRef را برای ارجاع‌ها/ارائه‌دهندگان تغییریافته اجرا می‌کند.
    - حالت JSON (`--strict-json`، `--json` یا حالت دسته‌ای): اعتبارسنجی طرح‌واره را همراه با بررسی‌های قابل‌حل‌بودن SecretRef اجرا می‌کند.
    - اعتبارسنجی خط‌مشی روی پیکربندی کامل پس از تغییر اجرا می‌شود؛ بنابراین نوشتن اشیای والد (برای مثال، تنظیم `hooks` به‌صورت یک شیء) نمی‌تواند اعتبارسنجی سطوح پشتیبانی‌نشده را دور بزند.
    - بررسی‌های SecretRef اجرایی به‌طور پیش‌فرض رد می‌شوند تا از عوارض جانبی فرمان جلوگیری شود؛ برای فعال‌سازی آن‌ها `--allow-exec` را وارد کنید (ممکن است فرمان‌های ارائه‌دهنده اجرا شوند). `--allow-exec` فقط برای اجرای آزمایشی است و بدون `--dry-run` خطا می‌دهد.

  </Accordion>
  <Accordion title="فیلدهای --dry-run --json">
    - `ok`: آیا اجرای آزمایشی موفق بوده است
    - `operations`: تعداد انتساب‌های ارزیابی‌شده
    - `checks`: آیا بررسی‌های طرح‌واره/قابل‌حل‌بودن اجرا شده‌اند
    - `checks.resolvabilityComplete`: آیا بررسی‌های قابل‌حل‌بودن تا پایان اجرا شده‌اند (وقتی ارجاع‌های اجرایی رد می‌شوند، مقدار آن false است)
    - `refsChecked`: تعداد ارجاع‌هایی که واقعاً در اجرای آزمایشی حل شده‌اند
    - `skippedExecRefs`: تعداد ارجاع‌های اجرایی ردشده به‌دلیل تنظیم‌نشدن `--allow-exec`
    - `errors`: خطاهای ساخت‌یافتهٔ مسیر ناموجود، طرح‌واره یا قابل‌حل‌بودن، وقتی `ok=false` است

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
      ref?: string, // present for resolvability errors
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
          "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="اگر اجرای آزمایشی ناموفق باشد">
    - `config schema validation failed`: ساختار پیکربندی پس از تغییر نامعتبر است؛ مسیر/مقدار یا ساختار شیء ارائه‌دهنده/ارجاع را اصلاح کنید.
    - `Config policy validation failed: unsupported SecretRef usage`: آن اعتبارنامه را دوباره به ورودی متن ساده/رشته‌ای تبدیل کنید؛ SecretRefها را فقط در سطوح پشتیبانی‌شده نگه دارید.
    - `SecretRef assignment(s) could not be resolved`: ارائه‌دهنده/ارجاع موردنظر در حال حاضر قابل‌حل نیست (متغیر محیطی ناموجود، اشاره‌گر فایل نامعتبر، خرابی ارائه‌دهندهٔ اجرایی یا عدم تطابق ارائه‌دهنده/منبع).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: اگر به اعتبارسنجی قابل‌حل‌بودن اجرایی نیاز دارید، با `--allow-exec` دوباره اجرا کنید.
    - در حالت دسته‌ای، ورودی‌های ناموفق را اصلاح کنید و پیش از نوشتن، `--dry-run` را دوباره اجرا کنید.

  </Accordion>
</AccordionGroup>

## اعمال تغییرات

پس از هر اجرای موفق `config set` / `config patch` / `config unset`، CLI یکی از سه راهنمای زیر را نمایش می‌دهد تا بدانید آیا Gateway نیاز به راه‌اندازی مجدد دارد:

| راهنما                                               | معنی                                             |
| --------------------------------------------------- | ------------------------------------------------ |
| `Restart the gateway to apply.`                     | مسیر تغییریافته به راه‌اندازی مجدد کامل نیاز دارد. |
| `Change will apply without restarting the gateway.` | بارگذاری مجدد آنی، تغییر را خودکار اعمال می‌کند. |
| `No gateway restart needed.`                        | هیچ مورد مرتبط با زمان اجرا تغییر نکرده است.    |

نوشتن در `plugins.entries` (یا هر زیرمسیر آن) همیشه به راه‌اندازی مجدد نیاز دارد، زیرا CLI نمی‌تواند اثبات کند که فرادادهٔ بارگذاری مجدد همهٔ Pluginها بارگذاری شده است.

## ایمنی نوشتن

`openclaw config set` و دیگر نویسنده‌های پیکربندی متعلق به OpenClaw، پیش از ثبت روی دیسک، پیکربندی کامل پس از تغییر را اعتبارسنجی می‌کنند. اگر محتوای جدید در اعتبارسنجی طرح‌واره ناموفق باشد یا شبیه بازنویسی مخرب به نظر برسد، پیکربندی فعال دست‌نخورده باقی می‌ماند و محتوای ردشده در کنار آن با نام `openclaw.json.rejected.*` ذخیره می‌شود.

<Warning>
مسیر پیکربندی فعال باید یک فایل معمولی باشد. چیدمان‌هایی که در آن‌ها `openclaw.json` پیوند نمادین است، برای نوشتن پشتیبانی نمی‌شوند؛ در عوض با `OPENCLAW_CONFIG_PATH` مستقیماً به فایل واقعی اشاره کنید.
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

نوشتن مستقیم با ویرایشگر همچنان مجاز است، اما Gateway در حال اجرا تا زمان اعتبارسنجی موفق، آن را نامطمئن تلقی می‌کند. ویرایش‌های مستقیم نامعتبر باعث شکست راه‌اندازی می‌شوند یا بارگذاری مجدد آنی آن‌ها را نادیده می‌گیرد؛ Gateway فایل `openclaw.json` را بازنویسی نمی‌کند. برای ترمیم پیکربندی دارای پیشوند/بازنویسی‌شده یا بازیابی آخرین نسخهٔ سالم شناخته‌شده، `openclaw doctor --fix` را اجرا کنید. به [عیب‌یابی Gateway](/fa/gateway/troubleshooting#gateway-rejected-invalid-config) مراجعه کنید.

بازیابی کل فایل فقط برای ترمیم توسط doctor در نظر گرفته شده است. تغییرات طرح‌وارهٔ Plugin یا ناسازگاری `minHostVersion` به‌صورت آشکار خطا می‌دهند و باعث بازگردانی تنظیمات نامرتبط کاربر، مانند پیکربندی مدل‌ها، ارائه‌دهندگان، نمایه‌های احراز هویت، کانال‌ها، دسترسی Gateway، ابزارها، حافظه، مرورگر یا cron نمی‌شوند.

## چرخهٔ ترمیم

پس از موفقیت `openclaw config validate`، از TUI محلی استفاده کنید تا یک عامل تعبیه‌شده پیکربندی فعال را با مستندات مقایسه کند، درحالی‌که هر تغییر را از همان پایانه اعتبارسنجی می‌کنید:

```bash
openclaw chat
```

درون TUI، علامت `!` در ابتدای خط یک فرمان واقعی پوستهٔ محلی را اجرا می‌کند (پس از یک پیام تأیید که در هر نشست فقط یک‌بار نمایش داده می‌شود):

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="مقایسه با مستندات">
    از عامل بخواهید پیکربندی فعلی شما را با صفحهٔ مرتبط مستندات مقایسه کند و کوچک‌ترین اصلاح را پیشنهاد دهد.
  </Step>
  <Step title="اعمال ویرایش‌های هدفمند">
    ویرایش‌های هدفمند را با `openclaw config set` یا `openclaw configure` اعمال کنید.
  </Step>
  <Step title="اعتبارسنجی مجدد">
    پس از هر تغییر، `openclaw config validate` را دوباره اجرا کنید.
  </Step>
  <Step title="استفاده از doctor برای مشکلات زمان اجرا">
    اگر اعتبارسنجی موفق است اما زمان اجرا همچنان ناسالم است، برای کمک به مهاجرت و ترمیم، `openclaw doctor` یا `openclaw doctor --fix` را اجرا کنید.
  </Step>
</Steps>

## مرتبط

- [مرجع CLI](/fa/cli)
- [پیکربندی](/fa/gateway/configuration)
