---
read_when:
    - می‌خواهید پیکربندی را به‌صورت غیرتعاملی بخوانید یا ویرایش کنید
sidebarTitle: Config
summary: مرجع CLI برای `openclaw config` (get/set/patch/unset/file/schema/validate)
title: پیکربندی
x-i18n:
    generated_at: "2026-06-27T17:22:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d658c0edbf900565c4645c1d24a9f3e092a3d8a4fec85f7fc7e3989550d13197
    source_path: cli/config.md
    workflow: 16
---

راهنماهای پیکربندی برای ویرایش‌های غیرتعاملی در `openclaw.json`: دریافت/تنظیم/وصله/حذف/فایل/شِما/اعتبارسنجی مقدارها بر اساس مسیر و چاپ فایل پیکربندی فعال. بدون زیر‌فرمان اجرا کنید تا جادوگر پیکربندی باز شود (همانند `openclaw configure`).

<Note>
وقتی `OPENCLAW_NIX_MODE=1` باشد، OpenClaw فایل `openclaw.json` را تغییرناپذیر در نظر می‌گیرد. فرمان‌های فقط‌خواندنی مانند `config get`، `config file`، `config schema` و `config validate` همچنان کار می‌کنند، اما نویسنده‌های پیکربندی رد می‌شوند. Agentها باید به‌جای آن منبع Nix نصب را ویرایش کنند؛ برای توزیع رسمی nix-openclaw، از [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) استفاده کنید و مقدارها را زیر `programs.openclaw.config` یا `instances.<name>.config` تنظیم کنید.
</Note>

## گزینه‌های ریشه

<ParamField path="--section <section>" type="string">
  فیلتر بخش راه‌اندازی هدایت‌شده که قابل تکرار است، وقتی `openclaw config` را بدون زیر‌فرمان اجرا می‌کنید.
</ParamField>

بخش‌های هدایت‌شده پشتیبانی‌شده: `workspace`، `model`، `web`، `gateway`، `daemon`، `channels`، `plugins`، `skills`، `health`.

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

### `config schema`

شِمای JSON تولیدشده برای `openclaw.json` را به‌صورت JSON در stdout چاپ می‌کند.

<AccordionGroup>
  <Accordion title="What it includes">
    - شِمای پیکربندی ریشه فعلی، به‌همراه یک فیلد رشته‌ای `$schema` در ریشه برای ابزارهای ویرایشگر.
    - فراداده مستندات فیلدهای `title` و `description` که Control UI از آن‌ها استفاده می‌کند.
    - گره‌های شیء تو‌در‌تو، wildcard (`*`) و آیتم آرایه (`[]`) وقتی مستندات فیلد منطبق وجود داشته باشد، همان فراداده `title` / `description` را به ارث می‌برند.
    - شاخه‌های `anyOf` / `oneOf` / `allOf` نیز وقتی مستندات فیلد منطبق وجود داشته باشد، همان فراداده مستندات را به ارث می‌برند.
    - فراداده شِمای زنده Plugin + کانال، به‌صورت بهترین تلاش، وقتی manifestهای runtime قابل بارگذاری باشند.
    - یک شِمای جایگزین تمیز، حتی وقتی پیکربندی فعلی نامعتبر باشد.

  </Accordion>
  <Accordion title="Related runtime RPC">
    `config.schema.lookup` یک مسیر پیکربندی نرمال‌سازی‌شده را با یک گره شِمای کم‌عمق (`title`، `description`، `type`، `enum`، `const`، کران‌های رایج)، فراداده راهنمای UI منطبق، و خلاصه‌های فرزندهای بلافصل برمی‌گرداند. از آن برای بررسی عمیق محدود به مسیر در Control UI یا کلاینت‌های سفارشی استفاده کنید.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

وقتی می‌خواهید آن را با ابزارهای دیگر بررسی یا اعتبارسنجی کنید، خروجی را به یک فایل pipe کنید:

```bash
openclaw config schema > openclaw.schema.json
```

### مسیرها

مسیرها از نشانه‌گذاری نقطه‌ای یا کروشه‌ای استفاده می‌کنند. مسیرهای نشانه‌گذاری کروشه‌ای را در نمونه‌های shell داخل نقل‌قول بگذارید تا shellهایی مانند zsh قبل از اینکه OpenClaw مسیر را دریافت کند، `[0]` را به‌عنوان glob گسترش ندهند:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
```

برای هدف‌گیری یک agent مشخص، از اندیس فهرست agent استفاده کنید:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

## مقدارها

مقدارها در صورت امکان به‌عنوان JSON5 تجزیه می‌شوند؛ در غیر این صورت به‌عنوان رشته در نظر گرفته می‌شوند. برای الزام تجزیه JSON5 از `--strict-json` استفاده کنید. `--json` همچنان به‌عنوان یک نام مستعار قدیمی پشتیبانی می‌شود.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` مقدار خام را به‌جای متن قالب‌بندی‌شده برای ترمینال، به‌صورت JSON چاپ می‌کند.

<Note>
انتساب شیء به‌طور پیش‌فرض مسیر هدف را جایگزین می‌کند. مسیرهای map/list محافظت‌شده که معمولاً ورودی‌های افزوده‌شده توسط کاربر را نگه می‌دارند، مانند `agents.defaults.models`، `models.providers`، `models.providers.<id>.models`، `plugins.entries` و `auth.profiles`، جایگزینی‌هایی را که ورودی‌های موجود را حذف کنند رد می‌کنند، مگر اینکه `--replace` را پاس دهید.
</Note>

هنگام افزودن ورودی به آن mapها از `--merge` استفاده کنید:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

فقط زمانی از `--replace` استفاده کنید که عمداً می‌خواهید مقدار ارائه‌شده به مقدار کامل هدف تبدیل شود.

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
    حالت سازنده Provider فقط مسیرهای `secrets.providers.<alias>` را هدف می‌گیرد:

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
انتساب‌های SecretRef روی سطح‌های runtime-mutable پشتیبانی‌نشده رد می‌شوند (برای مثال `hooks.token`، `commands.ownerDisplaySecret`، tokenهای Webhook اتصال thread در Discord، و JSON مربوط به creds در WhatsApp). [SecretRef Credential Surface](/fa/reference/secretref-credential-surface) را ببینید.
</Warning>

تجزیه دسته‌ای همیشه از payload دسته‌ای (`--batch-json`/`--batch-file`) به‌عنوان منبع حقیقت استفاده می‌کند. `--strict-json` / `--json` رفتار تجزیه دسته‌ای را تغییر نمی‌دهند.

## `config patch`

وقتی می‌خواهید به‌جای اجرای تعداد زیادی فرمان مسیرمحور `config set`، یک وصله با شکل پیکربندی را paste یا pipe کنید، از `config patch` استفاده کنید. ورودی یک شیء JSON5 است. شیءها به‌صورت بازگشتی merge می‌شوند، آرایه‌ها و مقدارهای scalar مقدار هدف را جایگزین می‌کنند، و `null` مسیر هدف را حذف می‌کند.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

همچنین می‌توانید یک وصله را از طریق stdin pipe کنید، که برای اسکریپت‌های راه‌اندازی راه‌دور مفید است:

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

وقتی یک شیء یا آرایه باید دقیقاً به مقدار ارائه‌شده تبدیل شود و به‌صورت بازگشتی patch نشود، از `--replace-path <path>` استفاده کنید:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` بررسی‌های شِما و قابلیت resolve شدن SecretRef را بدون نوشتن اجرا می‌کند. SecretRefهای متکی به exec در dry-run به‌طور پیش‌فرض رد می‌شوند؛ وقتی عمداً می‌خواهید dry-run فرمان‌های Provider را اجرا کند، `--allow-exec` را اضافه کنید.

حالت مسیر/مقدار JSON برای هر دو SecretRef و Provider همچنان پشتیبانی می‌شود:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## پرچم‌های سازنده Provider

هدف‌های سازنده Provider باید از `secrets.providers.<alias>` به‌عنوان مسیر استفاده کنند.

<AccordionGroup>
  <Accordion title="Common flags">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

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

نمونه Provider exec سخت‌سازی‌شده:

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

## اجرای آزمایشی

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
    - حالت سازنده: بررسی‌های قابلیت resolve شدن SecretRef را برای refها/Providerهای تغییریافته اجرا می‌کند.
    - حالت JSON (`--strict-json`، `--json`، یا حالت دسته‌ای): اعتبارسنجی شِما به‌همراه بررسی‌های قابلیت resolve شدن SecretRef را اجرا می‌کند.
    - اعتبارسنجی policy نیز برای سطح‌های هدف شناخته‌شده‌ای که SecretRef را پشتیبانی نمی‌کنند اجرا می‌شود.
    - بررسی‌های policy کل پیکربندی پس از تغییر را ارزیابی می‌کنند، بنابراین نوشتن شیء والد (برای مثال تنظیم `hooks` به‌عنوان یک شیء) نمی‌تواند اعتبارسنجی سطح پشتیبانی‌نشده را دور بزند.
    - بررسی‌های SecretRef مربوط به exec در dry-run به‌طور پیش‌فرض رد می‌شوند تا از عوارض جانبی فرمان جلوگیری شود.
    - برای opt in به بررسی‌های SecretRef مربوط به exec، از `--allow-exec` همراه با `--dry-run` استفاده کنید (این ممکن است فرمان‌های Provider را اجرا کند).
    - `--allow-exec` فقط برای dry-run است و اگر بدون `--dry-run` استفاده شود خطا می‌دهد.

  </Accordion>
  <Accordion title="--dry-run --json fields">
    `--dry-run --json` یک گزارش قابل‌خواندن توسط ماشین چاپ می‌کند:

    - `ok`: اینکه اجرای آزمایشی با موفقیت گذشت یا نه
    - `operations`: تعداد انتساب‌های ارزیابی‌شده
    - `checks`: اینکه بررسی‌های طرح‌واره/حل‌پذیری اجرا شدند یا نه
    - `checks.resolvabilityComplete`: اینکه بررسی‌های حل‌پذیری تا پایان اجرا شدند یا نه (وقتی ارجاع‌های exec رد می‌شوند false است)
    - `refsChecked`: تعداد ارجاع‌هایی که واقعاً در اجرای آزمایشی حل شدند
    - `skippedExecRefs`: تعداد ارجاع‌های exec که چون `--allow-exec` تنظیم نشده بود رد شدند
    - `errors`: خطاهای ساختاریافتهٔ مسیرِ ناموجود، طرح‌واره، یا حل‌پذیری وقتی `ok=false`

  </Accordion>
</AccordionGroup>

### شکل خروجی JSON

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
  <Tab title="نمونهٔ شکست">
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
  <Accordion title="اگر اجرای آزمایشی شکست بخورد">
    - `config schema validation failed`: شکل پیکربندی پس از تغییر نامعتبر است؛ مسیر/مقدار یا شکل شیء provider/ref را اصلاح کنید.
    - `Config policy validation failed: unsupported SecretRef usage`: آن اعتبارنامه را به ورودی متن ساده/رشته‌ای برگردانید و SecretRefها را فقط روی سطح‌های پشتیبانی‌شده نگه دارید.
    - `SecretRef assignment(s) could not be resolved`: provider/ref ارجاع‌شده در حال حاضر حل نمی‌شود (متغیر محیطی ناموجود، اشاره‌گر فایل نامعتبر، شکست provider exec، یا ناهمخوانی provider/source).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: اجرای آزمایشی ارجاع‌های exec را رد کرد؛ اگر به اعتبارسنجی حل‌پذیری exec نیاز دارید، با `--allow-exec` دوباره اجرا کنید.
    - برای حالت دسته‌ای، ورودی‌های ناموفق را اصلاح کنید و پیش از نوشتن، `--dry-run` را دوباره اجرا کنید.

  </Accordion>
</AccordionGroup>

## ایمنی نوشتن

`openclaw config set` و دیگر نویسنده‌های پیکربندی متعلق به OpenClaw، پیش از ثبت روی دیسک، کل پیکربندی پس از تغییر را اعتبارسنجی می‌کنند. اگر payload جدید در اعتبارسنجی طرح‌واره شکست بخورد یا شبیه بازنویسی مخرب باشد، پیکربندی فعال دست‌نخورده می‌ماند و payload ردشده کنار آن با نام `openclaw.json.rejected.*` ذخیره می‌شود.

<Warning>
مسیر پیکربندی فعال باید یک فایل عادی باشد. چیدمان‌های `openclaw.json` مبتنی بر symlink برای نوشتن پشتیبانی نمی‌شوند؛ به‌جای آن از `OPENCLAW_CONFIG_PATH` استفاده کنید تا مستقیماً به فایل واقعی اشاره کند.
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

نوشتن مستقیم با ویرایشگر همچنان مجاز است، اما Gateway در حال اجرا تا زمان اعتبارسنجی با آن‌ها به‌عنوان نامطمئن رفتار می‌کند. ویرایش‌های مستقیم نامعتبر باعث شکست راه‌اندازی می‌شوند یا در بارگذاری مجدد داغ رد می‌شوند؛ Gateway فایل `openclaw.json` را بازنویسی نمی‌کند. برای ترمیم پیکربندی prefixشده/بازنویسی‌شده یا بازیابی آخرین نسخهٔ سالم شناخته‌شده، `openclaw doctor --fix` را اجرا کنید. [عیب‌یابی Gateway](/fa/gateway/troubleshooting#gateway-rejected-invalid-config) را ببینید.

بازیابی کل فایل فقط برای ترمیم doctor نگه داشته شده است. تغییرات طرح‌وارهٔ Plugin یا ناهمخوانی `minHostVersion` به‌جای بازگرداندن تنظیمات نامرتبط کاربر مانند مدل‌ها، providers، نمایه‌های احراز هویت، کانال‌ها، نمایانی Gateway، ابزارها، حافظه، مرورگر، یا پیکربندی Cron، آشکارا خطا می‌دهند.

## زیرفرمان‌ها

- `config file`: مسیر فایل پیکربندی فعال را چاپ می‌کند (حل‌شده از `OPENCLAW_CONFIG_PATH` یا مکان پیش‌فرض). مسیر باید یک فایل عادی را نام‌گذاری کند، نه symlink.

پس از ویرایش‌ها، Gateway را دوباره راه‌اندازی کنید.

## اعتبارسنجی

پیکربندی فعلی را بدون راه‌اندازی Gateway در برابر طرح‌وارهٔ فعال اعتبارسنجی کنید.

```bash
openclaw config validate
openclaw config validate --json
```

پس از موفق شدن `openclaw config validate`، می‌توانید از TUI محلی استفاده کنید تا یک عامل جاسازی‌شده پیکربندی فعال را با مستندات مقایسه کند، درحالی‌که هر تغییر را از همان ترمینال اعتبارسنجی می‌کنید:

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

حلقهٔ معمول ترمیم:

<Steps>
  <Step title="مقایسه با مستندات">
    از عامل بخواهید پیکربندی فعلی شما را با صفحهٔ مستندات مرتبط مقایسه کند و کوچک‌ترین اصلاح را پیشنهاد دهد.
  </Step>
  <Step title="اعمال ویرایش‌های هدفمند">
    ویرایش‌های هدفمند را با `openclaw config set` یا `openclaw configure` اعمال کنید.
  </Step>
  <Step title="اعتبارسنجی دوباره">
    پس از هر تغییر، `openclaw config validate` را دوباره اجرا کنید.
  </Step>
  <Step title="Doctor برای مشکلات زمان اجرا">
    اگر اعتبارسنجی موفق است اما زمان اجرا همچنان ناسالم است، برای کمک به مهاجرت و ترمیم، `openclaw doctor` یا `openclaw doctor --fix` را اجرا کنید.
  </Step>
</Steps>

## مرتبط

- [مرجع CLI](/fa/cli)
- [پیکربندی](/fa/gateway/configuration)
