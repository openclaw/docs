---
read_when:
    - پیکربندی SecretRefs برای اعتبارنامه‌های ارائه‌دهنده و ارجاع‌های `auth-profiles.json`
    - کار با بارگذاری مجدد، ممیزی، پیکربندی و اعمال اطلاعات محرمانه به‌صورت ایمن در محیط تولید
    - درک رفتار شکست سریع در راه‌اندازی، فیلترسازی سطح‌های غیرفعال، و آخرین وضعیت سالم شناخته‌شده
sidebarTitle: Secrets management
summary: 'مدیریت اسرار: قرارداد SecretRef، رفتار تصویر لحظه‌ای زمان اجرا، و پاک‌سازی یک‌طرفهٔ ایمن'
title: مدیریت اسرار
x-i18n:
    generated_at: "2026-04-29T22:56:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96fddc346e21cab17d978843dc2a482c6faf8f810b3698a97aa88463133eaca5
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw از SecretRefهای افزایشی پشتیبانی می‌کند تا اعتبارنامه‌های پشتیبانی‌شده نیازی به ذخیره شدن به‌صورت متن ساده در پیکربندی نداشته باشند.

<Note>
متن ساده همچنان کار می‌کند. SecretRefها برای هر اعتبارنامه به‌صورت اختیاری فعال می‌شوند.
</Note>

## اهداف و مدل زمان اجرا

Secretها در یک snapshot زمان اجرای درون‌حافظه‌ای resolve می‌شوند.

- Resolution هنگام activation به‌صورت eager انجام می‌شود، نه به‌صورت lazy در مسیرهای request.
- اگر یک SecretRef عملاً فعال resolve نشود، startup سریعاً fail می‌شود.
- Reload از atomic swap استفاده می‌کند: موفقیت کامل، یا نگه داشتن آخرین snapshot سالم شناخته‌شده.
- نقض‌های policy مربوط به SecretRef (برای مثال auth profileهای حالت OAuth همراه با ورودی SecretRef) پیش از swap زمان اجرا باعث failure در activation می‌شوند.
- Requestهای زمان اجرا فقط از snapshot درون‌حافظه‌ای فعال می‌خوانند.
- پس از نخستین activation/load موفق پیکربندی، مسیرهای کد زمان اجرا تا زمانی که یک reload موفق آن را swap کند، همچنان همان snapshot درون‌حافظه‌ای فعال را می‌خوانند.
- مسیرهای outbound delivery نیز از همان snapshot فعال می‌خوانند (برای مثال delivery پاسخ/thread در Discord و ارسال‌های action در Telegram)؛ آن‌ها در هر send دوباره SecretRefها را resolve نمی‌کنند.

این کار قطعی‌های secret-provider را از مسیرهای داغ request دور نگه می‌دارد.

## فیلتر کردن سطح فعال

SecretRefها فقط روی سطح‌هایی که عملاً فعال هستند validate می‌شوند.

- سطح‌های enabled: refهای resolveنشده مانع startup/reload می‌شوند.
- سطح‌های inactive: refهای resolveنشده مانع startup/reload نمی‌شوند.
- Refهای inactive diagnosticهای غیرکشنده با کد `SECRETS_REF_IGNORED_INACTIVE_SURFACE` emit می‌کنند.

<AccordionGroup>
  <Accordion title="Examples of inactive surfaces">
    - ورودی‌های channel/account غیرفعال.
    - اعتبارنامه‌های top-level channel که هیچ account فعالی آن‌ها را inherit نمی‌کند.
    - سطح‌های tool/feature غیرفعال.
    - کلیدهای مخصوص provider جست‌وجوی وب که توسط `tools.web.search.provider` انتخاب نشده‌اند. در حالت auto (وقتی provider unset است)، کلیدها بر اساس اولویت برای auto-detection ارائه‌دهنده بررسی می‌شوند تا یکی resolve شود. پس از selection، کلیدهای provider انتخاب‌نشده تا زمان انتخاب شدن inactive محسوب می‌شوند.
    - مواد auth مربوط به Sandbox SSH (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, به‌علاوه overrideهای per-agent) فقط زمانی active است که backend مؤثر sandbox برای agent پیش‌فرض یا یک agent enabled برابر `ssh` باشد.
    - SecretRefهای `gateway.remote.token` / `gateway.remote.password` اگر یکی از موارد زیر true باشد active هستند:
      - `gateway.mode=remote`
      - `gateway.remote.url` پیکربندی شده باشد
      - `gateway.tailscale.mode` برابر `serve` یا `funnel` باشد
      - در حالت local بدون آن سطح‌های remote:
        - وقتی token auth می‌تواند برنده شود و هیچ env/auth token پیکربندی نشده باشد، `gateway.remote.token` active است.
        - فقط وقتی password auth می‌تواند برنده شود و هیچ env/auth password پیکربندی نشده باشد، `gateway.remote.password` active است.
    - SecretRef مربوط به `gateway.auth.token` برای startup auth resolution زمانی inactive است که `OPENCLAW_GATEWAY_TOKEN` تنظیم شده باشد، زیرا ورودی env token برای آن runtime برنده می‌شود.

  </Accordion>
</AccordionGroup>

## Diagnosticهای سطح auth در Gateway

وقتی یک SecretRef روی `gateway.auth.token`، `gateway.auth.password`، `gateway.remote.token` یا `gateway.remote.password` پیکربندی شده باشد، startup/reload مربوط به Gateway وضعیت سطح را صریحاً log می‌کند:

- `active`: SecretRef بخشی از سطح auth مؤثر است و باید resolve شود.
- `inactive`: SecretRef برای این runtime نادیده گرفته می‌شود چون سطح auth دیگری برنده می‌شود، یا چون remote auth غیرفعال/غیرactive است.

این entryها با `SECRETS_GATEWAY_AUTH_SURFACE` log می‌شوند و شامل reason استفاده‌شده توسط policy سطح فعال هستند، بنابراین می‌توانید ببینید چرا یک credential فعال یا inactive تلقی شده است.

## Preflight ارجاع در onboarding

وقتی onboarding در حالت interactive اجرا می‌شود و SecretRef storage را انتخاب می‌کنید، OpenClaw پیش از ذخیره‌سازی preflight validation اجرا می‌کند:

- Refهای env: نام env var را validate می‌کند و تأیید می‌کند که در طول setup یک مقدار non-empty قابل مشاهده است.
- Refهای provider (`file` یا `exec`): انتخاب provider را validate می‌کند، `id` را resolve می‌کند، و نوع مقدار resolveشده را بررسی می‌کند.
- مسیر reuse در Quickstart: وقتی `gateway.auth.token` از قبل SecretRef باشد، onboarding پیش از probe/dashboard bootstrap (برای refهای `env`، `file` و `exec`) با استفاده از همان fail-fast gate آن را resolve می‌کند.

اگر validation شکست بخورد، onboarding خطا را نشان می‌دهد و اجازه می‌دهد دوباره تلاش کنید.

## قرارداد SecretRef

همه‌جا از یک شکل object استفاده کنید:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    Validation:

    - `provider` باید با `^[a-z][a-z0-9_-]{0,63}$` match شود
    - `id` باید با `^[A-Z][A-Z0-9_]{0,127}$` match شود

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    Validation:

    - `provider` باید با `^[a-z][a-z0-9_-]{0,63}$` match شود
    - `id` باید یک JSON pointer مطلق (`/...`) باشد
    - escape کردن RFC6901 در segmentها: `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey" }
    ```

    Validation:

    - `provider` باید با `^[a-z][a-z0-9_-]{0,63}$` match شود
    - `id` باید با `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$` match شود
    - `id` نباید شامل `.` یا `..` به‌عنوان segmentهای path جداشده با slash باشد (برای مثال `a/../b` رد می‌شود)

  </Tab>
</Tabs>

## پیکربندی provider

Providerها را زیر `secrets.providers` تعریف کنید:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // or "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Env provider">
    - allowlist اختیاری از طریق `allowlist`.
    - مقدارهای env گمشده/خالی باعث failure در resolution می‌شوند.

  </Accordion>
  <Accordion title="File provider">
    - فایل local را از `path` می‌خواند.
    - `mode: "json"` انتظار payload از نوع JSON object دارد و `id` را به‌عنوان pointer resolve می‌کند.
    - `mode: "singleValue"` انتظار ref id برابر `"value"` دارد و محتوای فایل را برمی‌گرداند.
    - Path باید از بررسی‌های ownership/permission عبور کند.
    - نکته fail-closed در Windows: اگر ACL verification برای یک path در دسترس نباشد، resolution شکست می‌خورد. فقط برای pathهای trusted، روی آن provider گزینه `allowInsecurePath: true` را تنظیم کنید تا بررسی‌های path security دور زده شوند.

  </Accordion>
  <Accordion title="Exec provider">
    - مسیر absolute binary پیکربندی‌شده را اجرا می‌کند، بدون shell.
    - به‌صورت پیش‌فرض، `command` باید به یک regular file اشاره کند (نه symlink).
    - برای اجازه دادن به symlink command pathها (برای مثال shimهای Homebrew)، `allowSymlinkCommand: true` را تنظیم کنید. OpenClaw مسیر target resolveشده را validate می‌کند.
    - برای pathهای package-manager (برای مثال `["/opt/homebrew"]`)، `allowSymlinkCommand` را با `trustedDirs` همراه کنید.
    - از timeout، no-output timeout، محدودیت‌های byte خروجی، allowlist env و trusted dirs پشتیبانی می‌کند.
    - نکته fail-closed در Windows: اگر ACL verification برای command path در دسترس نباشد، resolution شکست می‌خورد. فقط برای pathهای trusted، روی آن provider گزینه `allowInsecurePath: true` را تنظیم کنید تا بررسی‌های path security دور زده شوند.

    Payload درخواست (stdin):

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    Payload پاسخ (stdout):

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    خطاهای اختیاری per-id:

    ```json
    {
      "protocolVersion": 1,
      "values": {},
      "errors": { "providers/openai/apiKey": { "message": "not found" } }
    }
    ```

  </Accordion>
</AccordionGroup>

## نمونه‌های integration برای exec

<AccordionGroup>
  <Accordion title="1Password CLI">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
            trustedDirs: ["/opt/homebrew"],
            args: ["read", "op://Personal/OpenClaw QA API Key/password"],
            passEnv: ["HOME"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
  <Accordion title="HashiCorp Vault CLI">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
            trustedDirs: ["/opt/homebrew"],
            args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
            passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "vault_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
  <Accordion title="sops">
    ```json5
    {
      secrets: {
        providers: {
          sops_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/sops",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
            trustedDirs: ["/opt/homebrew"],
            args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
            passEnv: ["SOPS_AGE_KEY_FILE"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "sops_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## متغیرهای محیطی MCP server

Env varهای MCP server که از طریق `plugins.entries.acpx.config.mcpServers` پیکربندی شده‌اند، از SecretInput پشتیبانی می‌کنند. این کار API keyها و tokenها را از config متن ساده دور نگه می‌دارد:

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

مقادیر رشته‌ای متن ساده همچنان کار می‌کنند. Refهای env-template مانند `${MCP_SERVER_API_KEY}` و objectهای SecretRef هنگام activation مربوط به gateway، پیش از spawn شدن فرایند MCP server، resolve می‌شوند. مانند سایر سطح‌های SecretRef، refهای resolveنشده فقط زمانی activation را block می‌کنند که Plugin `acpx` عملاً active باشد.

## مواد auth مربوط به Sandbox SSH

Backend اصلی sandbox با نام `ssh` نیز از SecretRefها برای مواد auth مربوط به SSH پشتیبانی می‌کند:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

رفتار زمان اجرا:

- OpenClaw این ارجاع‌ها را هنگام فعال‌سازی سندباکس resolve می‌کند، نه به‌صورت تنبل هنگام هر فراخوانی SSH.
- مقدارهای resolve‌شده در فایل‌های موقت با مجوزهای محدود نوشته می‌شوند و در پیکربندی SSH تولیدشده استفاده می‌شوند.
- اگر بک‌اند سندباکس مؤثر `ssh` نباشد، این ارجاع‌ها غیرفعال می‌مانند و جلوی راه‌اندازی را نمی‌گیرند.

## سطح اعتبارنامه پشتیبانی‌شده

اعتبارنامه‌های پشتیبانی‌شده و پشتیبانی‌نشده canonical در اینجا فهرست شده‌اند:

- [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface)

<Note>
اعتبارنامه‌های ساخته‌شده در زمان اجرا یا چرخشی و داده‌های refresh مربوط به OAuth عمداً از resolution فقط‌خواندنی SecretRef کنار گذاشته شده‌اند.
</Note>

## رفتار و تقدم موردنیاز

- فیلد بدون ref: بدون تغییر.
- فیلد با ref: در سطح‌های فعال هنگام فعال‌سازی الزامی است.
- اگر هم plaintext و هم ref وجود داشته باشند، ref در مسیرهای تقدم پشتیبانی‌شده اولویت دارد.
- sentinel ویرایش‌زدایی `__OPENCLAW_REDACTED__` برای ویرایش‌زدایی/بازیابی پیکربندی داخلی رزرو شده است و به‌عنوان داده پیکربندی ارسالی literal رد می‌شود.

سیگنال‌های هشدار و audit:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (هشدار زمان اجرا)
- `REF_SHADOWED` (یافته audit وقتی اعتبارنامه‌های `auth-profiles.json` بر refهای `openclaw.json` اولویت پیدا می‌کنند)

رفتار سازگاری Google Chat:

- `serviceAccountRef` بر `serviceAccount` به‌صورت plaintext اولویت دارد.
- وقتی ref هم‌سطح تنظیم شده باشد، مقدار plaintext نادیده گرفته می‌شود.

## محرک‌های فعال‌سازی

فعال‌سازی secret در این موارد اجرا می‌شود:

- راه‌اندازی (preflight به‌علاوه فعال‌سازی نهایی)
- مسیر hot-apply برای بارگذاری مجدد پیکربندی
- مسیر restart-check برای بارگذاری مجدد پیکربندی
- بارگذاری مجدد دستی از طریق `secrets.reload`
- preflight مربوط به RPC نوشتن پیکربندی Gateway (`config.set` / `config.apply` / `config.patch`) برای قابل resolve بودن SecretRef سطح فعال در payload پیکربندی ارسالی پیش از ذخیره ویرایش‌ها

قرارداد فعال‌سازی:

- موفقیت snapshot را به‌صورت اتمیک تعویض می‌کند.
- شکست هنگام راه‌اندازی، راه‌اندازی gateway را متوقف می‌کند.
- شکست بارگذاری مجدد در زمان اجرا، آخرین snapshot سالم شناخته‌شده را نگه می‌دارد.
- شکست preflight مربوط به Write-RPC پیکربندی ارسالی را رد می‌کند و هم پیکربندی روی دیسک و هم snapshot فعال زمان اجرا را بدون تغییر نگه می‌دارد.
- ارائه یک token صریح کانال برای هر فراخوانی به helper/tool خروجی، فعال‌سازی SecretRef را تحریک نمی‌کند؛ نقاط فعال‌سازی همچنان راه‌اندازی، بارگذاری مجدد، و `secrets.reload` صریح هستند.

## سیگنال‌های degraded و recovered

وقتی فعال‌سازی هنگام بارگذاری مجدد پس از یک وضعیت سالم شکست بخورد، OpenClaw وارد وضعیت secrets تنزل‌یافته می‌شود.

کدهای رویداد سیستمی یک‌باره و log:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

رفتار:

- Degraded: زمان اجرا آخرین snapshot سالم شناخته‌شده را نگه می‌دارد.
- Recovered: پس از فعال‌سازی موفق بعدی، یک‌بار منتشر می‌شود.
- شکست‌های تکراری در حالی‌که از قبل در حالت degraded است، هشدارها را log می‌کنند اما رویدادها را spam نمی‌کنند.
- fail-fast هنگام راه‌اندازی رویدادهای degraded منتشر نمی‌کند، چون زمان اجرا هرگز فعال نشده است.

## Resolution مسیر command

مسیرهای command می‌توانند از طریق RPC مربوط به snapshot در gateway، resolution پشتیبانی‌شده SecretRef را فعال کنند.

دو رفتار کلی وجود دارد:

<Tabs>
  <Tab title="مسیرهای command سخت‌گیرانه">
    برای مثال مسیرهای remote-memory در `openclaw memory` و `openclaw qr --remote` وقتی به refهای shared-secret راه دور نیاز دارد. آن‌ها از snapshot فعال می‌خوانند و وقتی SecretRef موردنیاز در دسترس نباشد، سریع شکست می‌خورند.
  </Tab>
  <Tab title="مسیرهای command فقط‌خواندنی">
    برای مثال `openclaw status`، `openclaw status --all`، `openclaw channels status`، `openclaw channels resolve`، `openclaw security audit`، و جریان‌های فقط‌خواندنی doctor/config repair. آن‌ها نیز snapshot فعال را ترجیح می‌دهند، اما وقتی SecretRef هدف‌گیری‌شده در آن مسیر command در دسترس نباشد، به‌جای abort کردن degrade می‌شوند.

    رفتار فقط‌خواندنی:

    - وقتی gateway در حال اجراست، این commandها ابتدا از snapshot فعال می‌خوانند.
    - اگر resolution مربوط به gateway کامل نباشد یا gateway در دسترس نباشد، برای سطح command مشخص، fallback محلی هدف‌گیری‌شده را امتحان می‌کنند.
    - اگر SecretRef هدف‌گیری‌شده همچنان در دسترس نباشد، command با خروجی فقط‌خواندنی degraded و diagnostics صریح مانند «پیکربندی شده اما در این مسیر command در دسترس نیست» ادامه می‌دهد.
    - این رفتار degraded فقط محلیِ همان command است. مسیرهای راه‌اندازی زمان اجرا، بارگذاری مجدد، یا ارسال/احراز هویت را تضعیف نمی‌کند.

  </Tab>
</Tabs>

نکات دیگر:

- refresh کردن snapshot پس از چرخش secret در بک‌اند با `openclaw secrets reload` انجام می‌شود.
- روش RPC مربوط به Gateway که این مسیرهای command استفاده می‌کنند: `secrets.resolve`.

## گردش کار audit و configure

جریان پیش‌فرض operator:

<Steps>
  <Step title="Audit وضعیت فعلی">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="پیکربندی SecretRefs">
    ```bash
    openclaw secrets configure
    ```
  </Step>
  <Step title="Audit دوباره">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="secrets audit">
    یافته‌ها شامل این موارد هستند:

    - مقدارهای plaintext در حالت ذخیره‌شده (`openclaw.json`، `auth-profiles.json`، `.env`، و `agents/*/agent/models.json` تولیدشده)
    - باقی‌مانده‌های header حساس provider به‌صورت plaintext در ورودی‌های `models.json` تولیدشده
    - refهای resolve‌نشده
    - سایه‌اندازی تقدم (`auth-profiles.json` که بر refهای `openclaw.json` اولویت می‌گیرد)
    - باقی‌مانده‌های legacy (`auth.json`، یادآورهای OAuth)

    نکته Exec:

    - به‌طور پیش‌فرض، audit بررسی‌های قابل resolve بودن exec SecretRef را برای جلوگیری از اثرات جانبی command رد می‌کند.
    - برای اجرای providerهای exec هنگام audit از `openclaw secrets audit --allow-exec` استفاده کنید.

    نکته باقی‌مانده header:

    - تشخیص header حساس provider بر پایه heuristic نام است (نام‌ها و قطعه‌های رایج header احراز هویت/اعتبارنامه مانند `authorization`، `x-api-key`، `token`، `secret`، `password`، و `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    helper تعاملی که:

    - ابتدا `secrets.providers` را پیکربندی می‌کند (`env`/`file`/`exec`، افزودن/ویرایش/حذف)
    - اجازه می‌دهد فیلدهای پشتیبانی‌شده حامل secret را در `openclaw.json` به‌علاوه `auth-profiles.json` برای یک محدوده agent انتخاب کنید
    - می‌تواند یک mapping جدید `auth-profiles.json` را مستقیماً در انتخاب‌کننده target ایجاد کند
    - جزئیات SecretRef را می‌گیرد (`source`، `provider`، `id`)
    - resolution مربوط به preflight را اجرا می‌کند
    - می‌تواند بلافاصله apply کند

    نکته Exec:

    - preflight بررسی‌های exec SecretRef را رد می‌کند مگر اینکه `--allow-exec` تنظیم شده باشد.
    - اگر مستقیماً از `configure --apply` اعمال می‌کنید و plan شامل ref/providerهای exec است، برای مرحله apply نیز `--allow-exec` را تنظیم‌شده نگه دارید.

    حالت‌های مفید:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    پیش‌فرض‌های apply در `configure`:

    - پاک‌سازی اعتبارنامه‌های static مطابق از `auth-profiles.json` برای providerهای هدف‌گیری‌شده
    - پاک‌سازی ورودی‌های static قدیمی `api_key` از `auth.json`
    - پاک‌سازی خط‌های secret شناخته‌شده مطابق از `<config-dir>/.env`

  </Accordion>
  <Accordion title="secrets apply">
    اعمال یک plan ذخیره‌شده:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    نکته Exec:

    - dry-run بررسی‌های exec را رد می‌کند مگر اینکه `--allow-exec` تنظیم شده باشد.
    - حالت نوشتن، planهای شامل exec SecretRefs/providers را رد می‌کند مگر اینکه `--allow-exec` تنظیم شده باشد.

    برای جزئیات قرارداد سخت‌گیرانه target/path و قواعد دقیق رد، [قرارداد Plan اعمال Secrets](/fa/gateway/secrets-plan-contract) را ببینید.

  </Accordion>
</AccordionGroup>

## سیاست ایمنی یک‌طرفه

<Warning>
OpenClaw عمداً backupهای rollback حاوی مقدارهای secret تاریخی به‌صورت plaintext نمی‌نویسد.
</Warning>

مدل ایمنی:

- preflight باید پیش از حالت نوشتن موفق شود
- فعال‌سازی زمان اجرا پیش از commit اعتبارسنجی می‌شود
- apply فایل‌ها را با جایگزینی اتمیک فایل و restore بهترین‌تلاش هنگام شکست به‌روزرسانی می‌کند

## نکات سازگاری احراز هویت legacy

برای اعتبارنامه‌های static، زمان اجرا دیگر به ذخیره‌سازی legacy احراز هویت به‌صورت plaintext وابسته نیست.

- منبع اعتبارنامه زمان اجرا، snapshot درون‌حافظه‌ای resolve‌شده است.
- ورودی‌های static قدیمی `api_key` هنگام کشف پاک‌سازی می‌شوند.
- رفتار سازگاری مرتبط با OAuth جدا باقی می‌ماند.

## نکته Web UI

پیکربندی برخی unionهای SecretInput در حالت raw editor از حالت form آسان‌تر است.

## مرتبط

- [احراز هویت](/fa/gateway/authentication) — راه‌اندازی احراز هویت
- [CLI: secrets](/fa/cli/secrets) — commandهای CLI
- [متغیرهای محیطی](/fa/help/environment) — تقدم محیط
- [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface) — سطح اعتبارنامه
- [قرارداد Plan اعمال Secrets](/fa/gateway/secrets-plan-contract) — جزئیات قرارداد plan
- [امنیت](/fa/gateway/security) — وضعیت امنیتی
