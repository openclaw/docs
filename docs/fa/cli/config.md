---
read_when:
    - می‌خواهید پیکربندی را به‌صورت غیرتعاملی بخوانید یا ویرایش کنید
sidebarTitle: Config
summary: مرجع CLI برای `openclaw config` (get/set/patch/unset/file/schema/validate)
title: پیکربندی
x-i18n:
    generated_at: "2026-04-29T22:33:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f55c4b932d469cb9112d9f55b66f0ff88dbe066250651df7a0a753060a223d
    source_path: cli/config.md
    workflow: 16
---

راهنماهای پیکربندی برای ویرایش‌های غیرتعاملی در `openclaw.json`: دریافت/تنظیم/وصله/حذف/فایل/طرحواره/اعتبارسنجی مقادیر بر اساس مسیر و چاپ فایل پیکربندی فعال. برای باز کردن جادوگر پیکربندی، بدون زیرفرمان اجرا کنید (همانند `openclaw configure`).

## گزینه‌های ریشه

<ParamField path="--section <section>" type="string">
  فیلتر بخش راه‌اندازی هدایت‌شده که هنگام اجرای `openclaw config` بدون زیرفرمان قابل تکرار است.
</ParamField>

بخش‌های هدایت‌شده پشتیبانی‌شده: `workspace`، `model`، `web`، `gateway`، `daemon`، `channels`، `plugins`، `skills`، `health`.

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
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

طرحواره JSON تولیدشده برای `openclaw.json` را به‌صورت JSON در stdout چاپ کنید.

<AccordionGroup>
  <Accordion title="What it includes">
    - طرحواره پیکربندی ریشه فعلی، به‌همراه یک فیلد رشته‌ای `$schema` در ریشه برای ابزارهای ویرایشگر.
    - فراداده مستندات `title` و `description` فیلد که توسط Control UI استفاده می‌شود.
    - گره‌های شیء تودرتو، wildcard (`*`) و آیتم آرایه (`[]`) هنگامی که مستندات فیلد مطابق وجود داشته باشد، همان فراداده `title` / `description` را به ارث می‌برند.
    - شاخه‌های `anyOf` / `oneOf` / `allOf` نیز هنگامی که مستندات فیلد مطابق وجود داشته باشد، همان فراداده مستندات را به ارث می‌برند.
    - فراداده طرحواره Plugin + کانال زنده به‌صورت بهترین تلاش، هنگامی که manifestهای زمان اجرا قابل بارگذاری باشند.
    - یک طرحواره جایگزین تمیز حتی وقتی پیکربندی فعلی نامعتبر است.

  </Accordion>
  <Accordion title="Related runtime RPC">
    `config.schema.lookup` یک مسیر پیکربندی نرمال‌شده را با یک گره طرحواره سطحی (`title`، `description`، `type`، `enum`، `const`، کران‌های رایج)، فراداده راهنمای UI مطابق، و خلاصه‌های فرزند فوری برمی‌گرداند. از آن برای بررسی جزئیات محدود به مسیر در Control UI یا کلاینت‌های سفارشی استفاده کنید.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

وقتی می‌خواهید آن را با ابزارهای دیگر بررسی یا اعتبارسنجی کنید، خروجی را به یک فایل منتقل کنید:

```bash
openclaw config schema > openclaw.schema.json
```

### مسیرها

مسیرها از نشانه‌گذاری نقطه‌ای یا کروشه‌ای استفاده می‌کنند:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

برای هدف‌گیری یک عامل مشخص از اندیس فهرست عامل استفاده کنید:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## مقادیر

مقادیر در صورت امکان به‌عنوان JSON5 تجزیه می‌شوند؛ در غیر این صورت به‌عنوان رشته در نظر گرفته می‌شوند. برای الزام به تجزیه JSON5 از `--strict-json` استفاده کنید. `--json` همچنان به‌عنوان نام مستعار قدیمی پشتیبانی می‌شود.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` مقدار خام را به‌جای متن قالب‌بندی‌شده ترمینال، به‌صورت JSON چاپ می‌کند.

<Note>
انتساب شیء به‌طور پیش‌فرض مسیر هدف را جایگزین می‌کند. مسیرهای map/list محافظت‌شده که معمولا ورودی‌های افزوده‌شده توسط کاربر را نگه می‌دارند، مانند `agents.defaults.models`، `models.providers`، `models.providers.<id>.models`، `plugins.entries` و `auth.profiles`، جایگزینی‌هایی را که باعث حذف ورودی‌های موجود شوند رد می‌کنند، مگر اینکه `--replace` را پاس دهید.
</Note>

هنگام افزودن ورودی به این mapها از `--merge` استفاده کنید:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

از `--replace` فقط زمانی استفاده کنید که عمدا می‌خواهید مقدار ارائه‌شده به مقدار کامل هدف تبدیل شود.

## حالت‌های `config set`

`openclaw config set` از چهار سبک انتساب پشتیبانی می‌کند:

<Tabs>
  <Tab title="Value mode">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="SecretRef builder mode">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Provider builder mode">
    حالت سازنده ارائه‌دهنده فقط مسیرهای `secrets.providers.<alias>` را هدف می‌گیرد:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="Batch mode">
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
انتساب‌های SecretRef روی سطوح runtime-mutable پشتیبانی‌نشده رد می‌شوند (برای مثال `hooks.token`، `commands.ownerDisplaySecret`، توکن‌های Webhook اتصال thread در Discord و JSON اعتبارنامه‌های WhatsApp). [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface) را ببینید.
</Warning>

تجزیه دسته‌ای همیشه از payload دسته‌ای (`--batch-json`/`--batch-file`) به‌عنوان منبع حقیقت استفاده می‌کند. `--strict-json` / `--json` رفتار تجزیه دسته‌ای را تغییر نمی‌دهند.

## `config patch`

وقتی می‌خواهید به‌جای اجرای تعداد زیادی فرمان `config set` مبتنی بر مسیر، یک وصله با شکل پیکربندی را جای‌گذاری یا pipe کنید، از `config patch` استفاده کنید. ورودی یک شیء JSON5 است. شیءها به‌صورت بازگشتی ادغام می‌شوند، آرایه‌ها و مقادیر اسکالر مقدار هدف را جایگزین می‌کنند، و `null` مسیر هدف را حذف می‌کند.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

همچنین می‌توانید یک وصله را از طریق stdin منتقل کنید، که برای اسکریپت‌های راه‌اندازی راه‌دور مفید است:

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
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
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
      },
    },
  },
}
```

وقتی یک شیء یا آرایه باید به‌جای وصله شدن بازگشتی، دقیقا به مقدار ارائه‌شده تبدیل شود، از `--replace-path <path>` استفاده کنید:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` بررسی‌های طرحواره و قابلیت حل SecretRef را بدون نوشتن اجرا می‌کند. SecretRefهای پشتیبانی‌شده با exec به‌طور پیش‌فرض در dry-run نادیده گرفته می‌شوند؛ وقتی عمدا می‌خواهید dry-run فرمان‌های ارائه‌دهنده را اجرا کند، `--allow-exec` را اضافه کنید.

حالت مسیر/مقدار JSON همچنان برای SecretRefها و ارائه‌دهنده‌ها پشتیبانی می‌شود:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## پرچم‌های سازنده ارائه‌دهنده

هدف‌های سازنده ارائه‌دهنده باید از `secrets.providers.<alias>` به‌عنوان مسیر استفاده کنند.

<AccordionGroup>
  <Accordion title="Common flags">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`، `exec`)

  </Accordion>
  <Accordion title="Env provider (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (قابل تکرار)

  </Accordion>
  <Accordion title="File provider (--provider-source file)">
    - `--provider-path <path>` (الزامی)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec provider (--provider-source exec)">
    - `--provider-command <path>` (الزامی)
    - `--provider-arg <arg>` (قابل تکرار)
    - `--provider-no-output-timeout-ms <ms>`
    - `--provider-max-output-bytes <bytes>`
    - `--provider-json-only`
    - `--provider-env <KEY=VALUE>` (قابل تکرار)
    - `--provider-pass-env <ENV_VAR>` (قابل تکرار)
    - `--provider-trusted-dir <path>` (قابل تکرار)
    - `--provider-allow-insecure-path`
    - `--provider-allow-symlink-command`

  </Accordion>
</AccordionGroup>

نمونه ارائه‌دهنده exec سخت‌سازی‌شده:

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

## Dry run

برای اعتبارسنجی تغییرات بدون نوشتن در `openclaw.json` از `--dry-run` استفاده کنید.

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

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
  <Accordion title="Dry-run behavior">
    - حالت سازنده: بررسی‌های قابلیت حل SecretRef را برای refها/ارائه‌دهنده‌های تغییریافته اجرا می‌کند.
    - حالت JSON (`--strict-json`، `--json`، یا حالت دسته‌ای): اعتبارسنجی طرحواره به‌همراه بررسی‌های قابلیت حل SecretRef را اجرا می‌کند.
    - اعتبارسنجی سیاست نیز برای سطوح هدف SecretRef پشتیبانی‌نشده شناخته‌شده اجرا می‌شود.
    - بررسی‌های سیاست، پیکربندی کامل پس از تغییر را ارزیابی می‌کنند، بنابراین نوشتن شیء والد (برای مثال تنظیم `hooks` به‌عنوان یک شیء) نمی‌تواند اعتبارسنجی سطح پشتیبانی‌نشده را دور بزند.
    - بررسی‌های SecretRef نوع exec به‌طور پیش‌فرض در dry-run نادیده گرفته می‌شوند تا از اثرات جانبی فرمان جلوگیری شود.
    - برای انتخاب بررسی‌های SecretRef نوع exec، از `--allow-exec` همراه با `--dry-run` استفاده کنید (این ممکن است فرمان‌های ارائه‌دهنده را اجرا کند).
    - `--allow-exec` فقط برای dry-run است و اگر بدون `--dry-run` استفاده شود خطا می‌دهد.

  </Accordion>
  <Accordion title="--dry-run --json fields">
    `--dry-run --json` یک گزارش قابل‌خواندن توسط ماشین چاپ می‌کند:

    - `ok`: اینکه dry-run موفق بوده است یا نه
    - `operations`: تعداد انتساب‌های ارزیابی‌شده
    - `checks`: اینکه بررسی‌های طرحواره/قابلیت حل اجرا شده‌اند یا نه
    - `checks.resolvabilityComplete`: اینکه بررسی‌های قابلیت حل تا پایان اجرا شده‌اند یا نه (وقتی refهای exec نادیده گرفته شوند، false است)
    - `refsChecked`: تعداد refهایی که واقعا در dry-run حل شده‌اند
    - `skippedExecRefs`: تعداد refهای exec که چون `--allow-exec` تنظیم نشده بود نادیده گرفته شدند
    - `errors`: خطاهای ساخت‌یافته طرحواره/قابلیت حل وقتی `ok=false`

  </Accordion>
</AccordionGroup>

### شکل خروجی JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // present for resolvability errors
    },
  ],
}
```

<Tabs>
  <Tab title="Success example">
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
  <Tab title="Failure example">
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
  <Accordion title="If dry-run fails">
    - `config schema validation failed`: شکل پیکربندی پس از تغییر نامعتبر است؛ مسیر/مقدار یا شکل شیء ارائه‌دهنده/ref را اصلاح کنید.
    - `Config policy validation failed: unsupported SecretRef usage`: آن اعتبارنامه را به ورودی متن ساده/رشته‌ای برگردانید و SecretRefها را فقط روی سطوح پشتیبانی‌شده نگه دارید.
    - `SecretRef assignment(s) could not be resolved`: ارائه‌دهنده/ref ارجاع‌شده در حال حاضر قابل حل نیست (متغیر محیطی موجود نیست، اشاره‌گر فایل نامعتبر است، ارائه‌دهنده exec شکست خورده است، یا ارائه‌دهنده/منبع ناهماهنگ است).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: اجرای آزمایشی refهای exec را رد کرد؛ اگر به اعتبارسنجی قابلیت حل exec نیاز دارید، با `--allow-exec` دوباره اجرا کنید.
    - برای حالت دسته‌ای، ورودی‌های ناموفق را اصلاح کنید و پیش از نوشتن، `--dry-run` را دوباره اجرا کنید.

  </Accordion>
</AccordionGroup>

## ایمنی نوشتن

`openclaw config set` و سایر نویسنده‌های پیکربندی متعلق به OpenClaw، پیش از ثبت روی دیسک، کل پیکربندی پس از تغییر را اعتبارسنجی می‌کنند. اگر payload جدید در اعتبارسنجی schema شکست بخورد یا شبیه بازنویسی مخرب باشد، پیکربندی فعال دست‌نخورده می‌ماند و payload ردشده کنار آن با نام `openclaw.json.rejected.*` ذخیره می‌شود.

<Warning>
مسیر پیکربندی فعال باید یک فایل معمولی باشد. چیدمان‌های `openclaw.json` مبتنی بر symlink برای نوشتن پشتیبانی نمی‌شوند؛ به‌جای آن از `OPENCLAW_CONFIG_PATH` استفاده کنید تا مستقیما به فایل واقعی اشاره کند.
</Warning>

برای ویرایش‌های کوچک، نوشتن با CLI را ترجیح دهید:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

اگر نوشتن رد شد، payload ذخیره‌شده را بررسی کنید و شکل کامل پیکربندی را اصلاح کنید:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

نوشتن مستقیم با ویرایشگر همچنان مجاز است، اما Gateway در حال اجرا تا زمانی که اعتبارسنجی نشود، آن را نامطمئن تلقی می‌کند. ویرایش‌های مستقیم نامعتبر می‌توانند هنگام راه‌اندازی یا بارگذاری مجدد داغ، از آخرین نسخه پشتیبان سالم شناخته‌شده بازیابی شوند. [عیب‌یابی Gateway](/fa/gateway/troubleshooting#gateway-restored-last-known-good-config) را ببینید.

بازیابی کل فایل برای پیکربندی‌های کاملا خراب نگه داشته شده است، مانند خطاهای parse، شکست‌های schema در سطح root، شکست‌های مهاجرت legacy، یا شکست‌های ترکیبی Plugin و root. اگر اعتبارسنجی فقط زیر `plugins.entries.<id>...` شکست بخورد، OpenClaw فایل فعال `openclaw.json` را در جای خود نگه می‌دارد و به‌جای بازیابی `.last-good`، مشکل محلی همان Plugin را گزارش می‌کند. این کار مانع می‌شود تغییرات schema مربوط به Plugin یا ناهماهنگی `minHostVersion` تنظیمات نامرتبط کاربر مانند مدل‌ها، ارائه‌دهندگان، پروفایل‌های احراز هویت، کانال‌ها، نمایان‌سازی Gateway، ابزارها، حافظه، مرورگر، یا پیکربندی cron را عقب برگرداند.

## زیر‌دستورها

- `config file`: مسیر فایل پیکربندی فعال را چاپ می‌کند (از `OPENCLAW_CONFIG_PATH` یا مکان پیش‌فرض resolve می‌شود). مسیر باید نام یک فایل معمولی باشد، نه symlink.

پس از ویرایش‌ها، Gateway را راه‌اندازی مجدد کنید.

## اعتبارسنجی

پیکربندی فعلی را بدون راه‌اندازی Gateway، در برابر schema فعال اعتبارسنجی کنید.

```bash
openclaw config validate
openclaw config validate --json
```

پس از موفق شدن `openclaw config validate`، می‌توانید از TUI محلی استفاده کنید تا یک عامل جاسازی‌شده پیکربندی فعال را با مستندات مقایسه کند، در حالی که هر تغییر را از همان ترمینال اعتبارسنجی می‌کنید:

<Note>
اگر اعتبارسنجی از قبل شکست می‌خورد، با `openclaw configure` یا `openclaw doctor --fix` شروع کنید. `openclaw chat` نگهبان پیکربندی نامعتبر را دور نمی‌زند.
</Note>

```bash
openclaw chat
```

سپس داخل TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

چرخه معمول تعمیر:

<Steps>
  <Step title="Compare with docs">
    از عامل بخواهید پیکربندی فعلی شما را با صفحه مستندات مرتبط مقایسه کند و کوچک‌ترین اصلاح را پیشنهاد دهد.
  </Step>
  <Step title="Apply targeted edits">
    ویرایش‌های هدفمند را با `openclaw config set` یا `openclaw configure` اعمال کنید.
  </Step>
  <Step title="Re-validate">
    پس از هر تغییر، `openclaw config validate` را دوباره اجرا کنید.
  </Step>
  <Step title="Doctor for runtime issues">
    اگر اعتبارسنجی موفق است اما runtime همچنان ناسالم است، برای کمک به مهاجرت و تعمیر، `openclaw doctor` یا `openclaw doctor --fix` را اجرا کنید.
  </Step>
</Steps>

## مرتبط

- [مرجع CLI](/fa/cli)
- [پیکربندی](/fa/gateway/configuration)
