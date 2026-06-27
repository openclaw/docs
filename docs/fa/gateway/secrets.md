---
read_when:
    - پیکربندی SecretRefs برای اعتبارنامه‌های ارائه‌دهنده و ارجاع‌های `auth-profiles.json`
    - بارگذاری مجدد، حسابرسی، پیکربندی و اعمال امن اسرار عملیاتی در تولید
    - درک شکست سریع در راه‌اندازی، فیلترکردن سطح‌های غیرفعال و رفتار آخرین وضعیت سالم شناخته‌شده
sidebarTitle: Secrets management
summary: 'مدیریت اسرار: قرارداد SecretRef، رفتار اسنپ‌شات زمان اجرا، و پاک‌سازی یک‌طرفه امن'
title: مدیریت اسرار
x-i18n:
    generated_at: "2026-06-27T17:49:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d90346b1e4abc39cf1ab314c242f0b976aa83ee06f6dfeb787aafb19fa90de9
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw از SecretRefs افزایشی پشتیبانی می‌کند تا اعتبارنامه‌های پشتیبانی‌شده لازم نباشد به‌صورت متن ساده در پیکربندی ذخیره شوند.

<Note>
متن ساده همچنان کار می‌کند. SecretRefs برای هر اعتبارنامه به‌صورت اختیاری فعال می‌شوند.
</Note>

<Warning>
اعتبارنامه‌های متن ساده اگر در فایل‌هایی ذخیره شوند که agent بتواند آن‌ها را بررسی کند، همچنان برای agent خواندنی می‌مانند؛ از جمله `openclaw.json`، `auth-profiles.json`، `.env`، یا فایل‌های تولیدشده‌ی `agents/*/agent/models.json`. SecretRefs این دامنه‌ی اثر محلی را فقط پس از مهاجرت همه‌ی اعتبارنامه‌های پشتیبانی‌شده و زمانی کاهش می‌دهد که `openclaw secrets audit --check` هیچ باقیمانده‌ای از secret متن ساده گزارش نکند.
</Warning>

## اهداف و مدل runtime

Secrets به یک snapshot runtime درون‌حافظه‌ای resolve می‌شوند.

- Resolution در زمان activation با اشتیاق انجام می‌شود، نه به‌صورت lazy در مسیرهای درخواست.
- Startup وقتی یک SecretRef عملا فعال resolve نشود، سریع fail می‌شود.
- Reload از swap اتمیک استفاده می‌کند: موفقیت کامل، یا حفظ آخرین snapshot سالم شناخته‌شده.
- نقض‌های policy مربوط به SecretRef (برای مثال auth profileهای حالت OAuth همراه با ورودی SecretRef) پیش از swap runtime باعث fail شدن activation می‌شوند.
- درخواست‌های runtime فقط از snapshot فعال درون‌حافظه‌ای می‌خوانند.
- پس از نخستین activation/load موفق پیکربندی، مسیرهای کد runtime تا زمانی که یک reload موفق آن را swap کند، همان snapshot فعال درون‌حافظه‌ای را می‌خوانند.
- مسیرهای تحویل خروجی نیز از همان snapshot فعال می‌خوانند (برای مثال تحویل پاسخ/thread در Discord و ارسال action در Telegram)؛ آن‌ها SecretRefs را در هر ارسال دوباره resolve نمی‌کنند.

این کار قطعی‌های secret-provider را از مسیرهای داغ درخواست دور نگه می‌دارد.

## مرز دسترسی agent

SecretRefs از ماندگار شدن اعتبارنامه‌ها در پیکربندی پشتیبانی‌شده و سطح‌های model تولیدشده جلوگیری می‌کنند، اما مرز ایزولاسیون فرایند نیستند. اگر یک اعتبارنامه‌ی متن ساده روی دیسک در مسیری باقی بماند که agent بتواند آن را بخواند، agent می‌تواند با استفاده از ابزارهای file یا shell برای بررسی آن فایل، redaction سطح API را دور بزند.

برای استقرارهای production که فایل‌های قابل‌دسترسی برای agent در scope هستند، مهاجرت SecretRef را فقط وقتی کامل بدانید که همه‌ی موارد زیر درست باشند:

- اعتبارنامه‌های پشتیبانی‌شده به‌جای مقادیر متن ساده از SecretRefs استفاده می‌کنند
- باقیمانده‌ی متن ساده‌ی legacy از `openclaw.json`، `auth-profiles.json`، `.env` و فایل‌های تولیدشده‌ی `models.json` پاک شده است
- `openclaw secrets audit --check` پس از مهاجرت clean است
- هر اعتبارنامه‌ی باقی‌مانده‌ی پشتیبانی‌نشده یا چرخشی با ایزولاسیون سیستم‌عامل، ایزولاسیون container، یا یک proxy اعتبارنامه‌ی خارجی محافظت می‌شود

به همین دلیل workflow مربوط به audit/configure/apply یک gate مهاجرت امنیتی است، نه فقط یک helper برای راحتی.

<Warning>
SecretRefs فایل‌های دلخواه خواندنی را امن نمی‌کند. Backupها، configهای کپی‌شده، catalogهای model تولیدشده‌ی قدیمی، و کلاس‌های اعتبارنامه‌ی پشتیبانی‌نشده باید تا زمان حذف، انتقال به خارج از مرز اعتماد agent، یا محافظت با یک لایه‌ی ایزولاسیون جداگانه، به‌عنوان secrets تولیدی در نظر گرفته شوند.
</Warning>

## فیلتر کردن سطح فعال

SecretRefs فقط روی سطح‌های عملا فعال validate می‌شوند.

- سطح‌های enabled: refهای resolveنشده startup/reload را block می‌کنند.
- سطح‌های inactive: refهای resolveنشده startup/reload را block نمی‌کنند.
- refهای inactive diagnosticهای غیرکشنده با کد `SECRETS_REF_IGNORED_INACTIVE_SURFACE` منتشر می‌کنند.

<AccordionGroup>
  <Accordion title="نمونه‌هایی از سطح‌های inactive">
    - ورودی‌های channel/account غیرفعال.
    - اعتبارنامه‌های channel سطح بالا که هیچ account فعالی از آن‌ها ارث‌بری نمی‌کند.
    - سطح‌های tool/feature غیرفعال.
    - کلیدهای اختصاصی web search provider که توسط `tools.web.search.provider` انتخاب نشده‌اند. در حالت auto (وقتی provider تنظیم نشده است)، کلیدها برای تشخیص خودکار provider بر اساس precedence بررسی می‌شوند تا یکی resolve شود. پس از انتخاب، کلیدهای provider انتخاب‌نشده تا زمان انتخاب شدن inactive در نظر گرفته می‌شوند.
    - مواد auth مربوط به sandbox SSH (`agents.defaults.sandbox.ssh.identityData`، `certificateData`، `knownHostsData`، به‌علاوه‌ی overrideهای هر agent) فقط وقتی فعال هستند که backend موثر sandbox برای agent پیش‌فرض یا یک agent فعال، `ssh` باشد.
    - SecretRefs مربوط به `gateway.remote.token` / `gateway.remote.password` اگر یکی از این موارد درست باشد فعال هستند:
      - `gateway.mode=remote`
      - `gateway.remote.url` پیکربندی شده است
      - `gateway.tailscale.mode` برابر `serve` یا `funnel` است
      - در حالت local بدون آن سطح‌های remote:
        - `gateway.remote.token` وقتی فعال است که auth مبتنی بر token بتواند برنده شود و هیچ token مربوط به env/auth پیکربندی نشده باشد.
        - `gateway.remote.password` فقط وقتی فعال است که auth مبتنی بر password بتواند برنده شود و هیچ password مربوط به env/auth پیکربندی نشده باشد.
    - SecretRef مربوط به `gateway.auth.token` برای resolution auth در startup وقتی `OPENCLAW_GATEWAY_TOKEN` تنظیم شده باشد inactive است، چون ورودی token از env برای آن runtime برنده می‌شود.

  </Accordion>
</AccordionGroup>

## Diagnosticهای سطح auth در Gateway

وقتی یک SecretRef روی `gateway.auth.token`، `gateway.auth.password`، `gateway.remote.token`، یا `gateway.remote.password` پیکربندی شود، startup/reload مربوط به Gateway وضعیت سطح را صریحا log می‌کند:

- `active`: SecretRef بخشی از سطح auth موثر است و باید resolve شود.
- `inactive`: SecretRef برای این runtime نادیده گرفته می‌شود، چون سطح auth دیگری برنده می‌شود، یا چون auth مربوط به remote غیرفعال/فعال نیست.

این ورودی‌ها با `SECRETS_GATEWAY_AUTH_SURFACE` log می‌شوند و شامل دلیلی هستند که policy سطح فعال استفاده کرده است، تا بتوانید ببینید چرا یک اعتبارنامه active یا inactive در نظر گرفته شده است.

## Preflight مرجع onboarding

وقتی onboarding در حالت تعاملی اجرا می‌شود و شما ذخیره‌سازی SecretRef را انتخاب می‌کنید، OpenClaw پیش از ذخیره‌سازی preflight validation اجرا می‌کند:

- refهای env: نام env var را validate می‌کند و تایید می‌کند که یک مقدار غیرخالی هنگام setup قابل مشاهده است.
- refهای provider (`file` یا `exec`): انتخاب provider را validate می‌کند، `id` را resolve می‌کند، و نوع مقدار resolveشده را بررسی می‌کند.
- مسیر استفاده‌ی دوباره‌ی quickstart: وقتی `gateway.auth.token` از قبل SecretRef باشد، onboarding آن را پیش از probe/dashboard bootstrap (برای refهای `env`، `file`، و `exec`) با همان gate fail-fast resolve می‌کند.

اگر validation fail شود، onboarding خطا را نشان می‌دهد و اجازه می‌دهد دوباره تلاش کنید.

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

    فیلدهای SecretInput پشتیبانی‌شده shorthandهای string دقیق را نیز می‌پذیرند:

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
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
    - `id` باید یک JSON pointer مطلق باشد (`/...`)
    - escape کردن RFC6901 در segmentها: `~` => `~0`، `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    Validation:

    - `provider` باید با `^[a-z][a-z0-9_-]{0,63}$` match شود
    - `id` باید با `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` match شود (از selectorهایی مانند `secret#json_key` پشتیبانی می‌کند)
    - `id` نباید شامل `.` یا `..` به‌عنوان segmentهای مسیر جداشده با slash باشد (برای مثال `a/../b` رد می‌شود)

  </Tab>
</Tabs>

## پیکربندی provider

providerها را زیر `secrets.providers` تعریف کنید:

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
      "team-secrets": {
        source: "exec",
        pluginIntegration: {
          pluginId: "acme-secrets",
          integrationId: "secret-store",
        },
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
  <Accordion title="ارائه‌دهنده env">
    - allowlist اختیاری از طریق `allowlist`.
    - مقادیر env گم‌شده/خالی باعث fail شدن resolution می‌شوند.

  </Accordion>
  <Accordion title="ارائه‌دهنده file">
    - فایل local را از `path` می‌خواند.
    - `mode: "json"` انتظار payload از نوع JSON object دارد و `id` را به‌عنوان pointer resolve می‌کند.
    - `mode: "singleValue"` انتظار ref id برابر `"value"` دارد و محتوای فایل را برمی‌گرداند.
    - Path باید بررسی‌های ownership/permission را پاس کند.
    - نکته‌ی fail-closed در Windows: اگر verification مربوط به ACL برای یک path در دسترس نباشد، resolution fail می‌شود. فقط برای pathهای مورداعتماد، روی آن provider مقدار `allowInsecurePath: true` را تنظیم کنید تا بررسی‌های امنیتی path دور زده شوند.

  </Accordion>
  <Accordion title="ارائه‌دهنده exec">
    - مسیر binary مطلق پیکربندی‌شده را اجرا می‌کند، بدون shell.
    - به‌صورت پیش‌فرض، `command` باید به یک فایل regular اشاره کند (نه symlink).
    - برای مجاز کردن مسیرهای command از نوع symlink (برای مثال shimهای Homebrew)، `allowSymlinkCommand: true` را تنظیم کنید. OpenClaw مسیر target resolveشده را validate می‌کند.
    - `allowSymlinkCommand` را برای مسیرهای package-manager (برای مثال `["/opt/homebrew"]`) با `trustedDirs` همراه کنید.
    - از timeout، no-output timeout، محدودیت‌های byte خروجی، allowlist مربوط به env، و trusted dirs پشتیبانی می‌کند.
    - نکته‌ی fail-closed در Windows: اگر verification مربوط به ACL برای مسیر command در دسترس نباشد، resolution fail می‌شود. فقط برای pathهای مورداعتماد، روی آن provider مقدار `allowInsecurePath: true` را تنظیم کنید تا بررسی‌های امنیتی path دور زده شوند.
    - providerهای exec مدیریت‌شده توسط Plugin می‌توانند به‌جای `command`/`args` کپی‌شده از `pluginIntegration` استفاده کنند. OpenClaw جزئیات command فعلی را از manifest مربوط به Plugin نصب‌شده هنگام startup/reload resolve می‌کند. اگر Plugin غیرفعال، حذف‌شده، نامطمئن باشد، یا دیگر integration را declare نکند، SecretRefs فعال که از آن provider استفاده می‌کنند به‌صورت fail closed شکست می‌خورند.

    Payload درخواست (stdin):

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    Payload پاسخ (stdout):

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    خطاهای اختیاری برای هر id:

    ```json
    {
      "protocolVersion": 1,
      "values": {},
      "errors": { "providers/openai/apiKey": { "message": "not found" } }
    }
    ```

  </Accordion>
</AccordionGroup>

## کلیدهای API مبتنی بر فایل

stringهای `file:...` را در block `env` پیکربندی قرار ندهید. block `env` literal و non-overriding است، بنابراین `file:...` resolve نمی‌شود.

به‌جای آن، روی یک فیلد اعتبارنامه‌ی پشتیبانی‌شده از SecretRef مبتنی بر file استفاده کنید:

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

برای `mode: "singleValue"`، مقدار `id` در SecretRef برابر `"value"` است. برای `mode: "json"`، از یک JSON pointer مطلق مانند `"/providers/xai/apiKey"` استفاده کنید.

برای فیلدهای پیکربندی که SecretRefs را می‌پذیرند، [سطح اعتبارنامه‌ی SecretRef](/fa/reference/secretref-credential-surface) را ببینید.

## نمونه‌های integration مربوط به exec

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
  <Accordion title="Bitwarden Secrets Manager (`bws`)">
    وقتی می‌خواهید شناسه‌های SecretRef به کلیدهای آیتم Bitwarden
    Secrets Manager نگاشت شوند، از یک پوشش resolver استفاده کنید. این مخزن شامل
    `scripts/secrets/openclaw-bws-resolver.mjs` است؛ آن را روی میزبان اجراکننده Gateway
    در یک مسیر مطلق و مورداعتماد نصب یا کپی کنید.

    الزامات:

    - CLI مربوط به Bitwarden Secrets Manager (`bws`) روی میزبان Gateway نصب شده باشد.
    - `BWS_ACCESS_TOKEN` برای سرویس Gateway در دسترس باشد.
    - `PATH` به resolver پاس داده شود، یا `BWS_BIN` روی مسیر مطلق باینری `bws`
      تنظیم شده باشد.
    - هنگام استفاده از نمونه Bitwarden خودمیزبان، `BWS_SERVER_URL` باید در محیط تنظیم شده باشد.

    ```json5
    {
      secrets: {
        providers: {
          bws: {
            source: "exec",
            command: "/usr/local/bin/openclaw-bws-resolver.mjs",
            passEnv: ["BWS_ACCESS_TOKEN", "BWS_SERVER_URL", "PATH", "BWS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "bws",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    resolver شناسه‌های درخواستی را دسته‌بندی می‌کند، `bws secret list` را اجرا می‌کند، و
    مقادیر را برای فیلدهای `key` رازهای منطبق برمی‌گرداند. از کلیدهایی استفاده کنید که قرارداد شناسه exec
    SecretRef را برآورده می‌کنند، مانند `openclaw/providers/openai/apiKey`؛ کلیدهای
    سبک متغیر محیطی با زیرخط پیش از اجرای resolver رد می‌شوند. اگر بیش از
    یک راز قابل‌مشاهده Bitwarden کلید درخواستی یکسانی داشته باشد، resolver
    به‌جای انتخاب یکی، آن شناسه را به‌عنوان مبهم ناموفق می‌کند. پس از به‌روزرسانی پیکربندی،
    مسیر resolver را بررسی کنید:

    ```bash
    openclaw secrets audit --allow-exec
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
  <Accordion title="password-store (`pass`)">
    وقتی می‌خواهید شناسه‌های SecretRef مستقیماً به ورودی‌های `pass` نگاشت شوند،
    از یک پوشش resolver کوچک استفاده کنید. آن را به‌صورت یک فایل اجرایی در مسیری مطلق ذخیره کنید
    که بررسی‌های مسیر exec-provider شما را پاس می‌کند، برای مثال
    `/usr/local/bin/openclaw-pass-resolver`. شِبنگ `#!/usr/bin/env node`
    مقدار `node` را از `PATH` فرایند resolver resolve می‌کند، بنابراین `PATH` را در
    `passEnv` بگنجانید. اگر `pass` روی آن `PATH` نیست، `PASS_BIN` را در محیط والد
    تنظیم کنید و آن را نیز در `passEnv` بگنجانید:

    ```js
    #!/usr/bin/env node
    const { spawnSync } = require("node:child_process");

    let stdin = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      stdin += chunk;
    });
    process.stdin.on("error", (err) => {
      process.stderr.write(`${err.message}\n`);
      process.exit(1);
    });
    process.stdin.on("end", () => {
      let request;
      try {
        request = JSON.parse(stdin || "{}");
      } catch (err) {
        process.stderr.write(`Failed to parse request: ${err.message}\n`);
        process.exit(1);
      }

      const passBin = process.env.PASS_BIN || "pass";
      const values = {};
      const errors = {};

      for (const id of request.ids ?? []) {
        const result = spawnSync(passBin, ["show", id], { encoding: "utf8" });
        if (result.status === 0) {
          values[id] = result.stdout.split(/\r?\n/, 1)[0] ?? "";
        } else {
          errors[id] = { message: (result.stderr || `pass exited ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    سپس provider نوع exec را پیکربندی کنید و `apiKey` را به مسیر ورودی `pass` اشاره دهید:

    ```json5
    {
      secrets: {
        providers: {
          pass_store: {
            source: "exec",
            command: "/usr/local/bin/openclaw-pass-resolver",
            passEnv: ["PATH", "HOME", "GNUPGHOME", "GPG_TTY", "PASSWORD_STORE_DIR", "PASS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "pass_store",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    راز را در خط اول ورودی `pass` نگه دارید، یا اگر می‌خواهید خروجی کامل
    `pass show` را برگردانید، پوشش را سفارشی کنید. پس از به‌روزرسانی پیکربندی،
    هم audit ایستای و هم مسیر resolver نوع exec را بررسی کنید:

    ```bash
    openclaw secrets audit --check
    openclaw secrets audit --allow-exec
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

## متغیرهای محیطی سرور MCP

متغیرهای محیطی سرور MCP که از طریق `plugins.entries.acpx.config.mcpServers` پیکربندی می‌شوند از SecretInput پشتیبانی می‌کنند. این کار کلیدهای API و توکن‌ها را از پیکربندی متن ساده بیرون نگه می‌دارد:

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

مقادیر رشته‌ای متن ساده همچنان کار می‌کنند. ارجاع‌های قالب محیطی مانند `${MCP_SERVER_API_KEY}` و شیءهای SecretRef هنگام فعال‌سازی Gateway، پیش از ایجاد فرایند سرور MCP، resolve می‌شوند. مانند دیگر سطوح SecretRef، ارجاع‌های resolveنشده فقط زمانی فعال‌سازی را مسدود می‌کنند که Plugin `acpx` عملاً فعال باشد.

## مواد احراز هویت SSH برای sandbox

backend اصلی sandbox با نام `ssh` از SecretRefها برای مواد احراز هویت SSH نیز پشتیبانی می‌کند:

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

- OpenClaw این ارجاع‌ها را هنگام فعال‌سازی sandbox resolve می‌کند، نه به‌صورت تنبل هنگام هر فراخوانی SSH.
- مقادیر resolveشده در فایل‌های موقت با مجوزهای محدودکننده نوشته می‌شوند و در پیکربندی SSH تولیدشده استفاده می‌شوند.
- اگر backend مؤثر sandbox برابر `ssh` نباشد، این ارجاع‌ها غیرفعال می‌مانند و راه‌اندازی را مسدود نمی‌کنند.

## سطح credential پشتیبانی‌شده

credentialهای canonical پشتیبانی‌شده و پشتیبانی‌نشده در اینجا فهرست شده‌اند:

- [سطح credential SecretRef](/fa/reference/secretref-credential-surface)

<Note>
credentialهای ساخته‌شده در زمان اجرا یا چرخشی و مواد refresh مربوط به OAuth عمداً از resolution فقط‌خواندنی SecretRef کنار گذاشته شده‌اند.
</Note>

## رفتار و تقدم الزامی

- فیلد بدون ارجاع: بدون تغییر.
- فیلد دارای ارجاع: روی سطوح فعال هنگام فعال‌سازی الزامی است.
- اگر هم متن ساده و هم ارجاع حاضر باشند، در مسیرهای تقدم پشتیبانی‌شده ارجاع تقدم دارد.
- sentinel ویرایش‌پوشانی `__OPENCLAW_REDACTED__` برای ویرایش‌پوشانی/بازیابی داخلی پیکربندی رزرو شده است و به‌عنوان داده پیکربندی ارسالی literal رد می‌شود.

سیگنال‌های هشدار و audit:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (هشدار زمان اجرا)
- `REF_SHADOWED` (یافته audit وقتی credentialهای `auth-profiles.json` بر ارجاع‌های `openclaw.json` تقدم پیدا می‌کنند)

رفتار سازگاری Google Chat:

- `serviceAccountRef` بر `serviceAccount` متن ساده تقدم دارد.
- وقتی ارجاع sibling تنظیم شده باشد، مقدار متن ساده نادیده گرفته می‌شود.

## triggerهای فعال‌سازی

فعال‌سازی راز روی موارد زیر اجرا می‌شود:

- راه‌اندازی (preflight به‌علاوه فعال‌سازی نهایی)
- مسیر اعمال داغ بازبارگذاری پیکربندی
- مسیر بررسی restart بازبارگذاری پیکربندی
- بازبارگذاری دستی از طریق `secrets.reload`
- preflight مربوط به RPC نوشتن پیکربندی Gateway (`config.set` / `config.apply` / `config.patch`) برای resolveپذیری SecretRef سطح فعال در payload پیکربندی ارسالی، پیش از پایدارسازی ویرایش‌ها

قرارداد فعال‌سازی:

- موفقیت snapshot را به‌صورت اتمی تعویض می‌کند.
- شکست راه‌اندازی، راه‌اندازی Gateway را لغو می‌کند.
- شکست بازبارگذاری زمان اجرا، آخرین snapshot خوب شناخته‌شده را نگه می‌دارد.
- شکست preflight مربوط به Write-RPC، پیکربندی ارسالی را رد می‌کند و هم پیکربندی دیسک و هم snapshot فعال زمان اجرا را بدون تغییر نگه می‌دارد.
- ارائه یک توکن کانال صریح برای هر فراخوانی به helper/tool خروجی، فعال‌سازی SecretRef را trigger نمی‌کند؛ نقاط فعال‌سازی همان راه‌اندازی، بازبارگذاری، و `secrets.reload` صریح باقی می‌مانند.

## سیگنال‌های degraded و recovered

وقتی فعال‌سازی هنگام بازبارگذاری پس از یک وضعیت سالم شکست بخورد، OpenClaw وارد وضعیت degraded secrets می‌شود.

رویداد یک‌باره سیستم و کدهای لاگ:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

رفتار:

- degraded: زمان اجرا آخرین snapshot خوب شناخته‌شده را نگه می‌دارد.
- recovered: یک بار پس از فعال‌سازی موفق بعدی emit می‌شود.
- شکست‌های تکراری در حالی که سیستم از قبل degraded است هشدارها را لاگ می‌کنند اما رویدادها را اسپم نمی‌کنند.
- fail-fast راه‌اندازی رویدادهای degraded را emit نمی‌کند، چون زمان اجرا هرگز فعال نشده بود.

## resolution مسیر فرمان

مسیرهای فرمان می‌توانند از طریق RPC snapshot Gateway به resolution پشتیبانی‌شده SecretRef opt in کنند.

دو رفتار کلی وجود دارد:

<Tabs>
  <Tab title="مسیرهای سخت‌گیرانهٔ فرمان">
    برای مثال مسیرهای حافظهٔ راه‌دور `openclaw memory` و `openclaw qr --remote` وقتی به ارجاع‌های secret مشترک راه‌دور نیاز دارد. آن‌ها از snapshot فعال می‌خوانند و وقتی یک SecretRef الزامی در دسترس نباشد سریع شکست می‌خورند.
  </Tab>
  <Tab title="مسیرهای فرمان فقط‌خواندنی">
    برای مثال `openclaw status`، `openclaw status --all`، `openclaw channels status`، `openclaw channels resolve`، `openclaw security audit`، و جریان‌های فقط‌خواندنی ترمیم doctor/config. آن‌ها نیز snapshot فعال را ترجیح می‌دهند، اما وقتی یک SecretRef هدف‌گذاری‌شده در آن مسیر فرمان در دسترس نباشد، به‌جای توقف، با افت کیفیت ادامه می‌دهند.

    رفتار فقط‌خواندنی:

    - وقتی Gateway در حال اجرا است، این فرمان‌ها ابتدا از snapshot فعال می‌خوانند.
    - اگر resolve کردن Gateway ناقص باشد یا Gateway در دسترس نباشد، برای سطح فرمان مشخص، fallback محلی هدف‌گذاری‌شده را امتحان می‌کنند.
    - اگر یک SecretRef هدف‌گذاری‌شده همچنان در دسترس نباشد، فرمان با خروجی فقط‌خواندنی تنزل‌یافته و diagnostics صریح مثل «پیکربندی شده اما در این مسیر فرمان در دسترس نیست» ادامه می‌دهد.
    - این رفتار تنزل‌یافته فقط محلیِ همان فرمان است. مسیرهای startup، reload، یا send/auth در runtime را تضعیف نمی‌کند.

  </Tab>
</Tabs>

نکته‌های دیگر:

- تازه‌سازی snapshot پس از چرخش secret در backend با `openclaw secrets reload` انجام می‌شود.
- متد RPC در Gateway که این مسیرهای فرمان استفاده می‌کنند: `secrets.resolve`.

## جریان کاری audit و configure

جریان پیش‌فرض operator:

<Steps>
  <Step title="Audit وضعیت فعلی">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="پیکربندی و اعمال SecretRefها">
    ```bash
    openclaw secrets configure --apply
    ```
  </Step>
  <Step title="Audit دوباره">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

مهاجرت را تا زمانی که re-audit پاک نیست کامل تلقی نکنید. اگر audit
هنوز مقادیر plaintext در حالت ذخیره‌شده گزارش می‌کند، ریسک دسترسی agent همچنان وجود دارد
حتی وقتی APIهای runtime مقادیر redacted برمی‌گردانند.

اگر هنگام `configure` به‌جای اعمال، یک plan ذخیره می‌کنید، آن plan ذخیره‌شده را
پیش از re-audit با `openclaw secrets apply --from <plan-path>` اعمال کنید.

<AccordionGroup>
  <Accordion title="secrets audit">
    یافته‌ها شامل موارد زیر است:

    - مقادیر plaintext در حالت ذخیره‌شده (`openclaw.json`، `auth-profiles.json`، `.env`، و `agents/*/agent/models.json` تولیدشده)
    - بقایای plaintext هدر حساس provider در ورودی‌های تولیدشدهٔ `models.json`
    - refs resolveنشده
    - precedence shadowing (`auth-profiles.json` که نسبت به refs در `openclaw.json` اولویت می‌گیرد)
    - بقایای legacy (`auth.json`، یادآورها‌ی OAuth)

    نکتهٔ exec:

    - به‌صورت پیش‌فرض، audit بررسی‌های resolvability برای exec SecretRef را رد می‌کند تا از عوارض جانبی فرمان جلوگیری شود.
    - برای اجرای providerهای exec هنگام audit از `openclaw secrets audit --allow-exec` استفاده کنید.

    نکتهٔ بقایای هدر:

    - تشخیص هدر حساس provider مبتنی بر heuristic نام است (نام‌ها و بخش‌های رایج هدرهای auth/credential مثل `authorization`، `x-api-key`، `token`، `secret`، `password`، و `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    راهنمای تعاملی که:

    - ابتدا `secrets.providers` را پیکربندی می‌کند (`env`/`file`/`exec`، افزودن/ویرایش/حذف)
    - به شما اجازه می‌دهد فیلدهای پشتیبانی‌شدهٔ دارای secret را در `openclaw.json` به‌همراه `auth-profiles.json` برای یک scope عامل انتخاب کنید
    - می‌تواند نگاشت جدید `auth-profiles.json` را مستقیماً در انتخابگر هدف ایجاد کند
    - جزئیات SecretRef را ثبت می‌کند (`source`، `provider`، `id`)
    - preflight resolution را اجرا می‌کند
    - می‌تواند بلافاصله اعمال کند

    نکتهٔ exec:

    - preflight بررسی‌های exec SecretRef را رد می‌کند مگر اینکه `--allow-exec` تنظیم شده باشد.
    - اگر مستقیماً از `configure --apply` اعمال می‌کنید و plan شامل refs/providers از نوع exec است، برای گام apply نیز `--allow-exec` را تنظیم‌شده نگه دارید.

    حالت‌های مفید:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    پیش‌فرض‌های apply در `configure`:

    - پاک‌سازی credentialهای static مطابق از `auth-profiles.json` برای providerهای هدف‌گذاری‌شده
    - پاک‌سازی ورودی‌های static legacy از نوع `api_key` از `auth.json`
    - پاک‌سازی خط‌های secret شناخته‌شدهٔ مطابق از `<config-dir>/.env`

  </Accordion>
  <Accordion title="secrets apply">
    اعمال یک plan ذخیره‌شده:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    نکتهٔ exec:

    - dry-run بررسی‌های exec را رد می‌کند مگر اینکه `--allow-exec` تنظیم شده باشد.
    - حالت write، planهایی را که شامل exec SecretRefs/providers هستند رد می‌کند مگر اینکه `--allow-exec` تنظیم شده باشد.

    برای جزئیات قرارداد سخت‌گیرانهٔ target/path و قواعد دقیق رد شدن، [قرارداد Secrets Apply Plan](/fa/gateway/secrets-plan-contract) را ببینید.

  </Accordion>
</AccordionGroup>

## سیاست ایمنی یک‌طرفه

<Warning>
OpenClaw عمداً backup rollback حاوی مقادیر تاریخی plaintext secret نمی‌نویسد.
</Warning>

مدل ایمنی:

- preflight باید پیش از حالت write موفق شود
- فعال‌سازی runtime پیش از commit اعتبارسنجی می‌شود
- apply فایل‌ها را با جایگزینی اتمیک فایل و restore در حد best-effort هنگام شکست به‌روزرسانی می‌کند

## نکته‌های سازگاری auth legacy

برای credentialهای static، runtime دیگر به ذخیره‌سازی auth legacy به‌صورت plaintext وابسته نیست.

- منبع credential در runtime همان snapshot درون‌حافظه‌ای resolveشده است.
- ورودی‌های static legacy از نوع `api_key` هنگام کشف پاک‌سازی می‌شوند.
- رفتار سازگاری مرتبط با OAuth جدا باقی می‌ماند.

## نکتهٔ Web UI

برخی unionهای SecretInput در حالت ویرایشگر خام راحت‌تر از حالت فرم پیکربندی می‌شوند.

## مرتبط

- [احراز هویت](/fa/gateway/authentication) — راه‌اندازی auth
- [CLI: secrets](/fa/cli/secrets) — فرمان‌های CLI
- [متغیرهای محیطی](/fa/help/environment) — precedence محیط
- [سطح credential در SecretRef](/fa/reference/secretref-credential-surface) — سطح credential
- [قرارداد Secrets Apply Plan](/fa/gateway/secrets-plan-contract) — جزئیات قرارداد plan
- [امنیت](/fa/gateway/security) — وضعیت امنیتی
