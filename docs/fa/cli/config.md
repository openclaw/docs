---
read_when:
    - می‌خواهید پیکربندی را به‌صورت غیرتعاملی بخوانید یا ویرایش کنید
sidebarTitle: Config
summary: مرجع CLI برای `openclaw config` (get/set/patch/unset/file/schema/validate)
title: پیکربندی
x-i18n:
    generated_at: "2026-06-28T22:33:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 92878977e8fb6670f12c0a77937a7c41f9230da82e20ec7690731bbda1e910ca
    source_path: cli/config.md
    workflow: 16
---

راهنماهای پیکربندی برای ویرایش‌های غیرتعاملی در `openclaw.json`: دریافت/تنظیم/وصله/لغو تنظیم/فایل/طرح‌واره/اعتبارسنجی مقدارها بر اساس مسیر و چاپ فایل پیکربندی فعال. بدون زیرفرمان اجرا کنید تا جادوگر پیکربندی باز شود (همانند `openclaw configure`).

<Note>
وقتی `OPENCLAW_NIX_MODE=1` باشد، OpenClaw با `openclaw.json` به‌عنوان تغییرناپذیر رفتار می‌کند. فرمان‌های فقط‌خواندنی مانند `config get`، `config file`، `config schema` و `config validate` همچنان کار می‌کنند، اما نویسنده‌های پیکربندی امتناع می‌کنند. عامل‌ها باید به‌جای آن منبع Nix نصب را ویرایش کنند؛ برای توزیع رسمی nix-openclaw، از [شروع سریع nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) استفاده کنید و مقدارها را زیر `programs.openclaw.config` یا `instances.<name>.config` تنظیم کنید.
</Note>

## گزینه‌های ریشه

<ParamField path="--section <section>" type="string">
  فیلتر بخش راه‌اندازی هدایت‌شده و قابل تکرار، وقتی `openclaw config` را بدون زیرفرمان اجرا می‌کنید.
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

طرح‌واره JSON تولیدشده برای `openclaw.json` را به‌صورت JSON در stdout چاپ کنید.

<AccordionGroup>
  <Accordion title="آنچه شامل می‌شود">
    - طرح‌واره پیکربندی ریشه فعلی، به‌علاوه یک فیلد رشته‌ای `$schema` در ریشه برای ابزارهای ویرایشگر.
    - فراداده مستندات فیلدهای `title` و `description` که توسط رابط کاربری Control استفاده می‌شود.
    - گره‌های شیء تودرتو، وایلدکارت (`*`) و مورد آرایه (`[]`) وقتی مستندات فیلد مطابق وجود داشته باشد، همان فراداده `title` / `description` را به ارث می‌برند.
    - شاخه‌های `anyOf` / `oneOf` / `allOf` نیز وقتی مستندات فیلد مطابق وجود داشته باشد، همان فراداده مستندات را به ارث می‌برند.
    - فراداده طرح‌واره زنده Plugin + کانال، به بهترین تلاش، وقتی مانیفست‌های زمان اجرا قابل بارگذاری باشند.
    - یک طرح‌واره جایگزین تمیز، حتی وقتی پیکربندی فعلی نامعتبر باشد.

  </Accordion>
  <Accordion title="RPC زمان اجرای مرتبط">
    `config.schema.lookup` یک مسیر پیکربندی نرمال‌سازی‌شده را با یک گره طرح‌واره کم‌عمق (`title`، `description`، `type`، `enum`، `const`، کران‌های رایج)، فراداده راهنمای رابط کاربری مطابق، و خلاصه‌های فرزند بلافاصله بازمی‌گرداند. از آن برای واکاوی محدود به مسیر در رابط کاربری Control یا کلاینت‌های سفارشی استفاده کنید.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

وقتی می‌خواهید آن را با ابزارهای دیگر بررسی یا اعتبارسنجی کنید، خروجی را به یک فایل پایپ کنید:

```bash
openclaw config schema > openclaw.schema.json
```

### مسیرها

مسیرها از نگارش نقطه‌ای یا کروشه‌ای استفاده می‌کنند. مسیرهای با نگارش کروشه‌ای را در مثال‌های پوسته داخل نقل‌قول بگذارید تا پوسته‌هایی مانند zsh، پیش از دریافت مسیر توسط OpenClaw، `[0]` را به‌عنوان glob گسترش ندهند:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
```

برای هدف‌گرفتن یک عامل مشخص، از نمایه فهرست عامل‌ها استفاده کنید:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

## مقدارها

مقدارها در صورت امکان به‌عنوان JSON5 تجزیه می‌شوند؛ در غیر این صورت به‌عنوان رشته در نظر گرفته می‌شوند. برای الزام به تجزیه JSON استاندارد بدون جایگزین رشته‌ای، از `--strict-json` استفاده کنید. `--json` همچنان به‌عنوان نام مستعار قدیمی برای `--strict-json` پشتیبانی می‌شود.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

وقتی `--strict-json` فعال باشد، نحوهای فقط JSON5 مانند نظرها، ویرگول‌های پایانی، یا کلیدهای شیء بدون نقل‌قول رد می‌شوند. برای تجزیه مقدار JSON5 همراه با جایگزین رشته خام، `--strict-json` را حذف کنید.

`config get <path> --json` مقدار خام را به‌جای متن قالب‌بندی‌شده ترمینال، به‌صورت JSON چاپ می‌کند.

<Note>
انتساب شیء به‌صورت پیش‌فرض مسیر هدف را جایگزین می‌کند. مسیرهای نقشه/فهرست محافظت‌شده که معمولا ورودی‌های افزوده‌شده توسط کاربر را نگه می‌دارند، مانند `agents.defaults.models`، `models.providers`، `models.providers.<id>.models`، `plugins.entries` و `auth.profiles`، جایگزینی‌هایی را که ورودی‌های موجود را حذف می‌کنند رد می‌کنند، مگر اینکه `--replace` را پاس دهید.
</Note>

هنگام افزودن ورودی‌ها به این نقشه‌ها از `--merge` استفاده کنید:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

فقط وقتی از `--replace` استفاده کنید که عمدا می‌خواهید مقدار ارائه‌شده، مقدار کامل هدف شود.

## حالت‌های `config set`

`openclaw config set` از چهار سبک انتساب پشتیبانی می‌کند:

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
انتساب‌های SecretRef روی سطوح تغییرپذیر زمان اجرای پشتیبانی‌نشده رد می‌شوند (برای مثال `hooks.token`، `commands.ownerDisplaySecret`، توکن‌های Webhook اتصال ریسمان Discord، و JSON اعتبارنامه‌های WhatsApp). [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface) را ببینید.
</Warning>

تجزیه دسته‌ای همیشه از بار دسته‌ای (`--batch-json`/`--batch-file`) به‌عنوان منبع حقیقت استفاده می‌کند. `--strict-json` / `--json` رفتار تجزیه دسته‌ای را تغییر نمی‌دهند.

## `config patch`

وقتی می‌خواهید به‌جای اجرای تعداد زیادی فرمان مسیرمحور `config set`، یک وصله با شکل پیکربندی را جای‌گذاری یا پایپ کنید، از `config patch` استفاده کنید. ورودی یک شیء JSON5 است. شیءها به‌صورت بازگشتی ادغام می‌شوند، آرایه‌ها و مقدارهای اسکالر مقدار هدف را جایگزین می‌کنند، و `null` مسیر هدف را حذف می‌کند.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

همچنین می‌توانید یک وصله را از طریق stdin پایپ کنید، که برای اسکریپت‌های راه‌اندازی راه‌دور مفید است:

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

وقتی یک شیء یا آرایه باید دقیقا به مقدار ارائه‌شده تبدیل شود، به‌جای اینکه به‌صورت بازگشتی وصله شود، از `--replace-path <path>` استفاده کنید:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` بررسی‌های طرح‌واره و قابل‌حل‌بودن SecretRef را بدون نوشتن اجرا می‌کند. SecretRefهای مبتنی بر exec در حالت dry-run به‌صورت پیش‌فرض نادیده گرفته می‌شوند؛ وقتی عمدا می‌خواهید dry-run فرمان‌های ارائه‌دهنده را اجرا کند، `--allow-exec` را اضافه کنید.

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
  <Accordion title="پرچم‌های رایج">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="ارائه‌دهنده Env (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (قابل تکرار)

  </Accordion>
  <Accordion title="ارائه‌دهنده فایل (--provider-source file)">
    - `--provider-path <path>` (الزامی)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="ارائه‌دهنده Exec (--provider-source exec)">
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

## اجرای آزمایشی

برای اعتبارسنجی تغییرها بدون نوشتن در `openclaw.json`، از `--dry-run` استفاده کنید.

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
  <Accordion title="رفتار اجرای آزمایشی">
    - حالت سازنده: بررسی‌های قابل‌حل‌بودن SecretRef را برای ارجاع‌ها/ارائه‌دهندگان تغییریافته اجرا می‌کند.
    - حالت JSON (`--strict-json`، `--json`، یا حالت دسته‌ای): اعتبارسنجی طرح‌واره به‌همراه بررسی‌های قابل‌حل‌بودن SecretRef را اجرا می‌کند.
    - اعتبارسنجی خط‌مشی همچنین برای سطوح هدف SecretRef شناخته‌شده و پشتیبانی‌نشده اجرا می‌شود.
    - بررسی‌های خط‌مشی کل پیکربندی پس از تغییر را ارزیابی می‌کنند، بنابراین نوشتن شیء والد (برای مثال تنظیم `hooks` به‌عنوان یک شیء) نمی‌تواند اعتبارسنجی سطح پشتیبانی‌نشده را دور بزند.
    - بررسی‌های SecretRef اجرایی به‌طور پیش‌فرض هنگام اجرای آزمایشی رد می‌شوند تا از عوارض جانبی فرمان جلوگیری شود.
    - از `--allow-exec` همراه با `--dry-run` استفاده کنید تا بررسی‌های SecretRef اجرایی را فعال کنید (این ممکن است فرمان‌های ارائه‌دهنده را اجرا کند).
    - `--allow-exec` فقط برای اجرای آزمایشی است و اگر بدون `--dry-run` استفاده شود خطا می‌دهد.

  </Accordion>
  <Accordion title="فیلدهای --dry-run --json">
    `--dry-run --json` یک گزارش قابل‌خواندن برای ماشین چاپ می‌کند:

    - `ok`: آیا اجرای آزمایشی موفق شد
    - `operations`: تعداد انتساب‌های ارزیابی‌شده
    - `checks`: آیا بررسی‌های طرح‌واره/قابل‌حل‌بودن اجرا شدند
    - `checks.resolvabilityComplete`: آیا بررسی‌های قابل‌حل‌بودن تا پایان اجرا شدند (وقتی ارجاع‌های اجرایی رد شوند false است)
    - `refsChecked`: تعداد ارجاع‌هایی که واقعاً در طول اجرای آزمایشی حل شدند
    - `skippedExecRefs`: تعداد ارجاع‌های اجرایی که چون `--allow-exec` تنظیم نشده بود رد شدند
    - `errors`: خطاهای ساختاریافته مسیرِ مفقود، طرح‌واره، یا قابل‌حل‌بودن وقتی `ok=false` است

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
  <Tab title="نمونه موفق">
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
  <Tab title="نمونه شکست">
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
    - `config schema validation failed`: شکل پیکربندی پس از تغییر شما نامعتبر است؛ مسیر/مقدار یا شکل شیء ارائه‌دهنده/ارجاع را اصلاح کنید.
    - `Config policy validation failed: unsupported SecretRef usage`: آن اعتبارنامه را به ورودی متن ساده/رشته‌ای برگردانید و SecretRefها را فقط روی سطوح پشتیبانی‌شده نگه دارید.
    - `SecretRef assignment(s) could not be resolved`: ارائه‌دهنده/ارجاع مورد اشاره در حال حاضر قابل حل نیست (متغیر محیطی مفقود، اشاره‌گر فایل نامعتبر، شکست ارائه‌دهنده اجرایی، یا عدم تطابق ارائه‌دهنده/منبع).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: اجرای آزمایشی ارجاع‌های اجرایی را رد کرد؛ اگر به اعتبارسنجی قابل‌حل‌بودن اجرایی نیاز دارید، با `--allow-exec` دوباره اجرا کنید.
    - برای حالت دسته‌ای، ورودی‌های ناموفق را اصلاح کنید و پیش از نوشتن، `--dry-run` را دوباره اجرا کنید.

  </Accordion>
</AccordionGroup>

## ایمنی نوشتن

`openclaw config set` و سایر نویسنده‌های پیکربندی متعلق به OpenClaw، پیش از ثبت روی دیسک، کل پیکربندی پس از تغییر را اعتبارسنجی می‌کنند. اگر بار جدید در اعتبارسنجی طرح‌واره شکست بخورد یا شبیه بازنویسی مخرب باشد، پیکربندی فعال دست‌نخورده می‌ماند و بار ردشده کنار آن با نام `openclaw.json.rejected.*` ذخیره می‌شود.

<Warning>
مسیر پیکربندی فعال باید یک فایل عادی باشد. چیدمان‌های `openclaw.json` که symlink شده‌اند برای نوشتن پشتیبانی نمی‌شوند؛ به‌جای آن از `OPENCLAW_CONFIG_PATH` برای اشاره مستقیم به فایل واقعی استفاده کنید.
</Warning>

برای ویرایش‌های کوچک، نوشتن با CLI را ترجیح دهید:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

اگر نوشتن رد شد، بار ذخیره‌شده را بررسی کنید و شکل کامل پیکربندی را اصلاح کنید:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

نوشتن مستقیم با ویرایشگر همچنان مجاز است، اما Gateway در حال اجرا تا زمانی که اعتبارسنجی نشود با آن به‌عنوان نامطمئن رفتار می‌کند. ویرایش‌های مستقیم نامعتبر باعث شکست راه‌اندازی می‌شوند یا توسط بارگذاری مجدد داغ رد می‌شوند؛ Gateway فایل `openclaw.json` را بازنویسی نمی‌کند. برای تعمیر پیکربندی پیشونددار/بازنویسی‌شده یا بازیابی آخرین نسخه سالم شناخته‌شده، `openclaw doctor --fix` را اجرا کنید. [عیب‌یابی Gateway](/fa/gateway/troubleshooting#gateway-rejected-invalid-config) را ببینید.

بازیابی کل فایل فقط برای تعمیر doctor نگه داشته شده است. تغییرات طرح‌واره Plugin یا ناهمخوانی `minHostVersion` به‌جای برگشت‌دادن تنظیمات نامرتبط کاربر مانند پیکربندی مدل‌ها، ارائه‌دهندگان، پروفایل‌های احراز هویت، کانال‌ها، آشکارسازی gateway، ابزارها، حافظه، مرورگر، یا cron، آشکارا خطا می‌دهند.

## زیرفرمان‌ها

- `config file`: مسیر فایل پیکربندی فعال را چاپ می‌کند (حل‌شده از `OPENCLAW_CONFIG_PATH` یا مکان پیش‌فرض). مسیر باید به یک فایل عادی اشاره کند، نه symlink.

پس از ویرایش‌ها، gateway را دوباره راه‌اندازی کنید.

## اعتبارسنجی

پیکربندی فعلی را بدون راه‌اندازی gateway در برابر طرح‌واره فعال اعتبارسنجی کنید.

```bash
openclaw config validate
openclaw config validate --json
```

پس از موفق‌شدن `openclaw config validate`، می‌توانید از TUI محلی استفاده کنید تا یک عامل تعبیه‌شده پیکربندی فعال را با مستندات مقایسه کند، درحالی‌که هر تغییر را از همان پایانه اعتبارسنجی می‌کنید:

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
  <Step title="مقایسه با مستندات">
    از عامل بخواهید پیکربندی فعلی شما را با صفحه مستندات مرتبط مقایسه کند و کوچک‌ترین اصلاح را پیشنهاد دهد.
  </Step>
  <Step title="اعمال ویرایش‌های هدفمند">
    ویرایش‌های هدفمند را با `openclaw config set` یا `openclaw configure` اعمال کنید.
  </Step>
  <Step title="اعتبارسنجی دوباره">
    پس از هر تغییر، `openclaw config validate` را دوباره اجرا کنید.
  </Step>
  <Step title="Doctor برای مشکلات زمان اجرا">
    اگر اعتبارسنجی موفق شد اما زمان اجرا همچنان ناسالم است، برای کمک به مهاجرت و تعمیر، `openclaw doctor` یا `openclaw doctor --fix` را اجرا کنید.
  </Step>
</Steps>

## مرتبط

- [مرجع CLI](/fa/cli)
- [پیکربندی](/fa/gateway/configuration)
