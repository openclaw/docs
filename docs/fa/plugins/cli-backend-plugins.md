---
read_when:
    - شما در حال ساخت یک Plugin بک‌اند محلی برای CLI هوش مصنوعی هستید
    - می‌خواهید یک بک‌اند را برای ارجاع‌های مدل مانند acme-cli/model ثبت کنید
    - باید یک CLI شخص ثالث را به اجراکنندهٔ جایگزین متنی OpenClaw نگاشت کنید
sidebarTitle: CLI backend plugins
summary: یک Plugin بسازید که یک بک‌اند CLI هوش مصنوعی محلی را ثبت کند
title: ساخت Pluginهای بک‌اند CLI
x-i18n:
    generated_at: "2026-05-07T13:26:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fcd604d35eb20d91350d5201236f22edfe7bb7e52eb19e89bceb8025dd3a29b
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Pluginهای بک‌اند CLI به OpenClaw اجازه می‌دهند یک CLI هوش مصنوعی محلی را به‌عنوان بک‌اند استنتاج متن فراخوانی کند. بک‌اند به‌صورت یک پیشوند ارائه‌دهنده در ارجاع‌های مدل ظاهر می‌شود:

```text
acme-cli/acme-large
```

از بک‌اند CLI زمانی استفاده کنید که یکپارچه‌سازی بالادستی از قبل به‌صورت یک فرمان محلی ارائه شده باشد، زمانی که CLI مالک وضعیت ورود محلی است، یا زمانی که CLI در صورت در دسترس نبودن ارائه‌دهنده‌های API یک مسیر جایگزین مفید است.

<Info>
  اگر سرویس بالادستی یک API مدل HTTP معمولی ارائه می‌کند، به‌جای آن یک
  [Plugin ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) بنویسید. اگر runtime بالادستی مالک کامل نشست‌های عامل، رویدادهای ابزار، Compaction یا وضعیت وظایف پس‌زمینه است، از یک [هارنس عامل](/fa/plugins/sdk-agent-harness) استفاده کنید.
</Info>

## چیزهایی که Plugin مالک آن‌هاست

یک Plugin بک‌اند CLI سه قرارداد دارد:

| قرارداد             | فایل                   | هدف                                                   |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| ورودی بسته        | `package.json`         | OpenClaw را به ماژول runtime مربوط به Plugin هدایت می‌کند              |
| مالکیت manifest   | `openclaw.plugin.json` | شناسه بک‌اند را پیش از بارگذاری runtime اعلام می‌کند              |
| ثبت runtime | `index.ts`             | `api.registerCliBackend(...)` را با پیش‌فرض‌های فرمان فراخوانی می‌کند |

manifest فراداده کشف است. CLI را اجرا نمی‌کند و رفتار runtime را ثبت نمی‌کند. رفتار runtime زمانی شروع می‌شود که ورودی Plugin، `api.registerCliBackend(...)` را فراخوانی کند.

## Plugin حداقلی بک‌اند

<Steps>
  <Step title="ایجاد فراداده بسته">
    ```json package.json
    {
      "name": "@acme/openclaw-acme-cli",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      },
      "dependencies": {
        "openclaw": "^2026.3.24"
      },
      "devDependencies": {
        "typescript": "^5.9.0"
      }
    }
    ```

    بسته‌های منتشرشده باید فایل‌های runtime جاوااسکریپت ساخته‌شده را همراه خود داشته باشند. اگر ورودی منبع شما `./src/index.ts` است، `openclaw.runtimeExtensions` را اضافه کنید که به همتای جاوااسکریپت ساخته‌شده اشاره کند. [نقاط ورودی](/fa/plugins/sdk-entrypoints) را ببینید.

  </Step>

  <Step title="اعلام مالکیت بک‌اند">
    ```json openclaw.plugin.json
    {
      "id": "acme-cli",
      "name": "Acme CLI",
      "description": "Run Acme's local AI CLI through OpenClaw",
      "cliBackends": ["acme-cli"],
      "setup": {
        "cliBackends": ["acme-cli"],
        "requiresRuntime": false
      },
      "activation": {
        "onStartup": false
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```

    `cliBackends` فهرست مالکیت runtime است. این گزینه به OpenClaw اجازه می‌دهد وقتی پیکربندی یا انتخاب مدل به `acme-cli/...` اشاره می‌کند، Plugin را به‌صورت خودکار بارگذاری کند.

    `setup.cliBackends` سطح راه‌اندازی descriptor-first است. وقتی کشف مدل، onboarding یا وضعیت باید بک‌اند را بدون بارگذاری runtime مربوط به Plugin بشناسد، آن را اضافه کنید. فقط زمانی از `requiresRuntime: false` استفاده کنید که همان توصیفگرهای ایستا برای راه‌اندازی کافی باشند.

  </Step>

  <Step title="ثبت بک‌اند">
    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      CLI_FRESH_WATCHDOG_DEFAULTS,
      CLI_RESUME_WATCHDOG_DEFAULTS,
      type CliBackendPlugin,
    } from "openclaw/plugin-sdk/cli-backend";

    function buildAcmeCliBackend(): CliBackendPlugin {
      return {
        id: "acme-cli",
        liveTest: {
          defaultModelRef: "acme-cli/acme-large",
          defaultImageProbe: false,
          defaultMcpProbe: false,
          docker: {
            npmPackage: "@acme/acme-cli",
            binaryName: "acme",
          },
        },
        config: {
          command: "acme",
          args: ["chat", "--json"],
          output: "json",
          input: "stdin",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptFileArg: "--system-file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          reliability: {
            watchdog: {
              fresh: { ...CLI_FRESH_WATCHDOG_DEFAULTS },
              resume: { ...CLI_RESUME_WATCHDOG_DEFAULTS },
            },
          },
          serialize: true,
        },
      };
    }

    export default definePluginEntry({
      id: "acme-cli",
      name: "Acme CLI",
      description: "Run Acme's local AI CLI through OpenClaw",
      register(api) {
        api.registerCliBackend(buildAcmeCliBackend());
      },
    });
    ```

    شناسه بک‌اند باید با ورودی `cliBackends` در manifest مطابقت داشته باشد. `config` ثبت‌شده فقط پیش‌فرض است؛ پیکربندی کاربر زیر `agents.defaults.cliBackends.acme-cli` در runtime روی آن ادغام می‌شود.

  </Step>
</Steps>

## شکل پیکربندی

`CliBackendConfig` توضیح می‌دهد OpenClaw چگونه باید CLI را اجرا و خروجی آن را parse کند:

| فیلد                                     | کاربرد                                                         |
| ----------------------------------------- | ----------------------------------------------------------- |
| `command`                                 | نام باینری یا مسیر مطلق فرمان                        |
| `args`                                    | argv پایه برای اجرای تازه                                    |
| `resumeArgs`                              | argv جایگزین برای نشست‌های ازسرگرفته‌شده؛ از `{sessionId}` پشتیبانی می‌کند |
| `output` / `resumeOutput`                 | parser: `json`، `jsonl` یا `text`                          |
| `input`                                   | انتقال prompt: `arg` یا `stdin`                          |
| `modelArg`                                | flag استفاده‌شده پیش از شناسه مدل                               |
| `modelAliases`                            | نگاشت شناسه‌های مدل OpenClaw به شناسه‌های بومی CLI                    |
| `sessionArg` / `sessionArgs`              | نحوه ارسال شناسه نشست                                    |
| `sessionMode`                             | `always`، `existing` یا `none`                             |
| `sessionIdFields`                         | فیلدهای JSON که OpenClaw از خروجی CLI می‌خواند                  |
| `systemPromptArg` / `systemPromptFileArg` | انتقال system prompt                                     |
| `systemPromptWhen`                        | `first`، `always` یا `never`                               |
| `imageArg` / `imageMode`                  | پشتیبانی از مسیر تصویر                                          |
| `serialize`                               | اجراهای مربوط به همان بک‌اند را مرتب نگه می‌دارد                              |
| `reliability.watchdog`                    | تنظیم مهلت زمانی نبود خروجی                                    |

کوچک‌ترین پیکربندی ایستایی را ترجیح دهید که با CLI مطابقت دارد. callbackهای Plugin را فقط برای رفتاری اضافه کنید که واقعاً به بک‌اند تعلق دارد.

## hookهای پیشرفته بک‌اند

`CliBackendPlugin` همچنین می‌تواند موارد زیر را تعریف کند:

| hook                               | کاربرد                                                    |
| ---------------------------------- | ------------------------------------------------------ |
| `normalizeConfig(config, context)` | بازنویسی پیکربندی قدیمی کاربر پس از ادغام                 |
| `resolveExecutionArgs(ctx)`        | افزودن flagهای محدود به درخواست، مانند تلاش تفکر       |
| `prepareExecution(ctx)`            | ایجاد پل‌های موقت auth یا پیکربندی پیش از اجرا  |
| `transformSystemPrompt(ctx)`       | اعمال تبدیل نهایی system prompt ویژه CLI     |
| `textTransforms`                   | جایگزینی‌های دوسویه prompt/خروجی               |
| `defaultAuthProfileId`             | ترجیح دادن یک پروفایل auth مشخص در OpenClaw                |
| `authEpochMode`                    | تعیین اینکه تغییرات auth چگونه نشست‌های ذخیره‌شده CLI را نامعتبر کنند |
| `nativeToolMode`                   | اعلام اینکه آیا CLI ابزارهای بومی همیشه‌فعال دارد یا نه     |
| `bundleMcp` / `bundleMcpMode`      | انتخاب پل ابزار MCP از نوع loopback در OpenClaw           |

این hookها را در مالکیت ارائه‌دهنده نگه دارید. وقتی یک hook بک‌اند می‌تواند رفتار را بیان کند، شاخه‌های ویژه CLI را به core اضافه نکنید.

## پل ابزار MCP

بک‌اندهای CLI به‌صورت پیش‌فرض ابزارهای OpenClaw را دریافت نمی‌کنند. اگر CLI بتواند یک پیکربندی MCP را مصرف کند، صریحاً آن را فعال کنید:

```typescript
return {
  id: "acme-cli",
  bundleMcp: true,
  bundleMcpMode: "codex-config-overrides",
  config: {
    command: "acme",
    args: ["chat", "--json"],
    output: "json",
  },
};
```

حالت‌های پل پشتیبانی‌شده عبارت‌اند از:

| حالت                     | کاربرد                                                              |
| ------------------------ | ---------------------------------------------------------------- |
| `claude-config-file`     | CLIهایی که یک فایل پیکربندی MCP را می‌پذیرند                              |
| `codex-config-overrides` | CLIهایی که overrideهای پیکربندی را روی argv می‌پذیرند                        |
| `gemini-system-settings` | CLIهایی که تنظیمات MCP را از دایرکتوری تنظیمات سیستم خود می‌خوانند |

پل را فقط زمانی فعال کنید که CLI واقعاً بتواند آن را مصرف کند. اگر CLI لایه ابزار داخلی خودش را دارد که نمی‌توان آن را غیرفعال کرد، `nativeToolMode:
"always-on"` را تنظیم کنید تا وقتی فراخواننده ابزارهای بومی نمی‌خواهد، OpenClaw بتواند به‌صورت بسته شکست بخورد.

## پیکربندی کاربر

کاربران می‌توانند هر پیش‌فرض بک‌اند را override کنند:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "acme-cli": {
          command: "/opt/acme/bin/acme",
          args: ["chat", "--json", "--profile", "work"],
          modelAliases: {
            large: "acme-large-2026",
          },
        },
      },
      model: {
        primary: "openai/gpt-5.5",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

حداقل overrideای را مستند کنید که کاربران احتمالاً به آن نیاز دارند. معمولاً وقتی باینری خارج از `PATH` است، این فقط `command` خواهد بود.

## راستی‌آزمایی

برای Pluginهای همراه، یک تست متمرکز پیرامون builder و ثبت setup اضافه کنید، سپس lane تست هدفمند Plugin را اجرا کنید:

```bash
pnpm test extensions/acme-cli
```

برای Pluginهای محلی یا نصب‌شده، کشف و یک اجرای واقعی مدل را راستی‌آزمایی کنید:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

اگر بک‌اند از تصاویر یا MCP پشتیبانی می‌کند، یک smoke زنده اضافه کنید که این مسیرها را با CLI واقعی اثبات کند. برای رفتار prompt، تصویر، MCP یا ازسرگیری نشست به بازرسی ایستا تکیه نکنید.

## چک‌لیست

<Check>`package.json` برای بسته‌های منتشرشده `openclaw.extensions` و ورودی‌های runtime ساخته‌شده دارد</Check>
<Check>`openclaw.plugin.json`، `cliBackends` و `activation.onStartup` عمدی را اعلام می‌کند</Check>
<Check>وقتی setup/کشف مدل باید بک‌اند را در حالت سرد ببیند، `setup.cliBackends` حاضر است</Check>
<Check>`api.registerCliBackend(...)` از همان شناسه بک‌اند در manifest استفاده می‌کند</Check>
<Check>overrideهای کاربر زیر `agents.defaults.cliBackends.<id>` همچنان اولویت دارند</Check>
<Check>تنظیمات نشست، system prompt، تصویر و parser خروجی با قرارداد واقعی CLI مطابقت دارند</Check>
<Check>تست‌های هدفمند و حداقل یک smoke زنده CLI مسیر بک‌اند را اثبات می‌کنند</Check>

## مرتبط

- [بک‌اندهای CLI](/fa/gateway/cli-backends) - پیکربندی کاربر و رفتار runtime
- [ساخت Pluginها](/fa/plugins/building-plugins) - اصول بسته و manifest
- [نمای کلی SDK Plugin](/fa/plugins/sdk-overview) - مرجع API ثبت
- [manifest مربوط به Plugin](/fa/plugins/manifest) - `cliBackends` و توصیفگرهای setup
- [هارنس عامل](/fa/plugins/sdk-agent-harness) - runtimeهای کامل عامل خارجی
