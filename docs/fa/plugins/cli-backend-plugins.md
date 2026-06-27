---
read_when:
    - شما در حال ساخت یک Plugin بک‌اند CLI هوش مصنوعی محلی هستید
    - می‌خواهید یک بک‌اند برای ارجاع‌های مدل مانند acme-cli/model ثبت کنید
    - باید یک CLI شخص ثالث را به اجراکنندهٔ جایگزین متنی OpenClaw نگاشت کنید
sidebarTitle: CLI backend plugins
summary: یک Plugin بسازید که یک بک‌اند CLI هوش مصنوعی محلی را ثبت کند
title: ساخت Pluginهای بک‌اند CLI
x-i18n:
    generated_at: "2026-06-27T18:10:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d91c2b712a821005303c6cbb0ccbd8f263c8c30c5dbd6ed05b842c47c63f0542
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Pluginهای بک‌اند CLI به OpenClaw اجازه می‌دهند یک CLI هوش مصنوعی محلی را به‌عنوان بک‌اند استنتاج متنی فراخوانی کند. بک‌اند به‌صورت پیشوند ارائه‌دهنده در ارجاع‌های مدل ظاهر می‌شود:

```text
acme-cli/acme-large
```

از بک‌اند CLI زمانی استفاده کنید که یکپارچه‌سازی بالادستی از قبل به‌صورت فرمان محلی ارائه شده باشد، زمانی که CLI مالک وضعیت ورود محلی است، یا زمانی که CLI در صورت در دسترس نبودن ارائه‌دهندگان API یک گزینه پشتیبان مفید است.

<Info>
  اگر سرویس بالادستی یک API مدل HTTP معمولی ارائه می‌کند، به‌جای آن یک
  [Plugin ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) بنویسید. اگر runtime بالادستی مالک کامل نشست‌های عامل، رویدادهای ابزار، Compaction، یا وضعیت کارهای پس‌زمینه است، از یک [هارنس عامل](/fa/plugins/sdk-agent-harness) استفاده کنید.
</Info>

## Plugin مالک چه چیزهایی است

یک Plugin بک‌اند CLI سه قرارداد دارد:

| قرارداد             | فایل                   | هدف                                                   |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| ورودی بسته        | `package.json`         | OpenClaw را به ماژول runtime Plugin هدایت می‌کند              |
| مالکیت manifest   | `openclaw.plugin.json` | شناسه بک‌اند را پیش از بارگذاری runtime اعلام می‌کند              |
| ثبت runtime | `index.ts`             | `api.registerCliBackend(...)` را با پیش‌فرض‌های فرمان فراخوانی می‌کند |

manifest فراداده کشف است. CLI را اجرا نمی‌کند و رفتار runtime را ثبت نمی‌کند. رفتار runtime زمانی شروع می‌شود که ورودی Plugin، `api.registerCliBackend(...)` را فراخوانی کند.

## Plugin بک‌اند حداقلی

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

    بسته‌های منتشرشده باید فایل‌های runtime جاوااسکریپت ساخته‌شده را همراه داشته باشند. اگر ورودی منبع شما `./src/index.ts` است، `openclaw.runtimeExtensions` را اضافه کنید که به همتای جاوااسکریپت ساخته‌شده اشاره کند. [نقاط ورودی](/fa/plugins/sdk-entrypoints) را ببینید.

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

    `cliBackends` فهرست مالکیت runtime است. این فهرست به OpenClaw اجازه می‌دهد وقتی config یا انتخاب مدل به `acme-cli/...` اشاره می‌کند، Plugin را به‌صورت خودکار بارگذاری کند.

    `setup.cliBackends` سطح راه‌اندازی descriptor-first است. زمانی آن را اضافه کنید که کشف مدل، onboarding، یا وضعیت باید بک‌اند را بدون بارگذاری runtime Plugin بشناسد. فقط زمانی از `requiresRuntime: false` استفاده کنید که همان descriptorهای ایستا برای راه‌اندازی کافی باشند.

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

    شناسه بک‌اند باید با ورودی `cliBackends` در manifest منطبق باشد. `config` ثبت‌شده فقط پیش‌فرض است؛ config کاربر زیر `agents.defaults.cliBackends.acme-cli` در runtime روی آن ادغام می‌شود.

  </Step>
</Steps>

## شکل config

`CliBackendConfig` توصیف می‌کند OpenClaw چگونه باید CLI را اجرا و parse کند:

| فیلد                                     | کاربرد                                                         |
| ----------------------------------------- | ----------------------------------------------------------- |
| `command`                                 | نام باینری یا مسیر مطلق فرمان                        |
| `args`                                    | argv پایه برای اجراهای تازه                                    |
| `resumeArgs`                              | argv جایگزین برای نشست‌های ازسرگرفته‌شده؛ از `{sessionId}` پشتیبانی می‌کند |
| `output` / `resumeOutput`                 | Parser: `json`، `jsonl`، یا `text`                          |
| `input`                                   | انتقال prompt: `arg` یا `stdin`                          |
| `modelArg`                                | فلگی که پیش از شناسه مدل استفاده می‌شود                               |
| `modelAliases`                            | نگاشت شناسه‌های مدل OpenClaw به شناسه‌های بومی CLI                    |
| `sessionArg` / `sessionArgs`              | روش ارسال شناسه نشست                                    |
| `sessionMode`                             | `always`، `existing`، یا `none`                             |
| `sessionIdFields`                         | فیلدهای JSON که OpenClaw از خروجی CLI می‌خواند                  |
| `systemPromptArg` / `systemPromptFileArg` | انتقال system prompt                                     |
| `systemPromptWhen`                        | `first`، `always`، یا `never`                               |
| `imageArg` / `imageMode`                  | پشتیبانی از مسیر تصویر                                          |
| `serialize`                               | اجراهای همان بک‌اند را مرتب نگه می‌دارد                              |
| `reliability.watchdog`                    | تنظیم timeout بدون خروجی                                    |

کوچک‌ترین config ایستایی را ترجیح دهید که با CLI منطبق است. callbackهای Plugin را فقط برای رفتاری اضافه کنید که واقعاً متعلق به بک‌اند است.

## hookهای پیشرفته بک‌اند

`CliBackendPlugin` همچنین می‌تواند این موارد را تعریف کند:

| hook                               | کاربرد                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | بازنویسی config قدیمی کاربر پس از ادغام                                      |
| `resolveExecutionArgs(ctx)`        | افزودن flagهای محدود به درخواست، مانند تلاش تفکر یا جداسازی پرسش جانبی |
| `prepareExecution(ctx)`            | ایجاد bridgeهای موقت احراز هویت یا config پیش از اجرا                       |
| `transformSystemPrompt(ctx)`       | اعمال تبدیل نهایی system prompt ویژه CLI                          |
| `textTransforms`                   | جایگزینی‌های دوسویه prompt/خروجی                                    |
| `defaultAuthProfileId`             | ترجیح یک پروفایل احراز هویت خاص OpenClaw                                     |
| `authEpochMode`                    | تعیین اینکه تغییرات احراز هویت چگونه نشست‌های CLI ذخیره‌شده را نامعتبر می‌کنند                      |
| `nativeToolMode`                   | اعلام اینکه آیا CLI ابزارهای بومی همیشه‌روشن دارد                          |
| `sideQuestionToolMode`             | اعلام ابزارهای بومی غیرفعال برای پرسش‌های جانبی `/btw`                     |
| `bundleMcp` / `bundleMcpMode`      | ورود به bridge ابزار MCP loopback در OpenClaw                                |
| `ownsNativeCompaction`             | بک‌اند مالک Compaction خودش است - OpenClaw آن را واگذار می‌کند                           |

این hookها را در مالکیت ارائه‌دهنده نگه دارید. وقتی یک hook بک‌اند می‌تواند رفتار را بیان کند، شاخه‌های ویژه CLI به core اضافه نکنید.

`ctx.executionMode` برای turnهای عادی `"agent"` و برای فراخوانی‌های موقت `/btw` مقدار `"side-question"` است. زمانی از آن استفاده کنید که CLI به flagهای یک‌باره متفاوت نیاز دارد، مانند غیرفعال‌کردن ابزارهای بومی، پایداری نشست، یا رفتار resume برای BTW. اگر یک بک‌اند معمولاً `nativeToolMode: "always-on"` دارد اما argv پرسش جانبی آن با اطمینان آن ابزارها را غیرفعال می‌کند، `sideQuestionToolMode: "disabled"` را نیز تنظیم کنید؛ در غیر این صورت وقتی BTW به اجرای CLI بدون ابزار نیاز داشته باشد، OpenClaw به‌صورت fail closed عمل می‌کند.

### `ownsNativeCompaction`: خروج از Compaction OpenClaw

اگر بک‌اند شما عاملی را اجرا می‌کند که transcript **خود** را compact می‌کند، `ownsNativeCompaction: true` را تنظیم کنید تا summarizer محافظ OpenClaw هرگز روی نشست‌های آن اجرا نشود - چرخه عمر Compaction در CLI یک no-op برمی‌گرداند و turn ادامه پیدا می‌کند. `claude-cli` آن را اعلام می‌کند چون Claude Code به‌صورت داخلی compact می‌کند و endpoint هارنس ندارد. نشست‌های native-harness مانند Codex در عوض همچنان به endpoint Compaction هارنس خودشان route می‌شوند.

**فقط زمانی آن را اعلام کنید که همه موارد زیر برقرار باشند**، وگرنه یک نشست deferred over-budget می‌تواند همچنان over budget بماند / stale شود (OpenClaw دیگر آن را نجات نمی‌دهد):

- بک‌اند با اطمینان transcript خودش را وقتی به window نزدیک می‌شود compact یا محدود می‌کند؛
- یک نشست قابل resume را persist می‌کند تا وضعیت compactشده بین turnها باقی بماند
  (مثلاً `--resume` / `--session-id`);
- یک نشست Compaction از نوع native-harness نیست - نشست‌های منطبق با `agentHarnessId` در عوض به endpoint هارنس route می‌شوند.

## bridge ابزار MCP

بک‌اندهای CLI به‌صورت پیش‌فرض ابزارهای OpenClaw را دریافت نمی‌کنند. اگر CLI می‌تواند یک config مربوط به MCP را مصرف کند، صریحاً وارد شوید:

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

حالت‌های bridge پشتیبانی‌شده عبارت‌اند از:

| حالت                     | کاربرد                                                              |
| ------------------------ | ---------------------------------------------------------------- |
| `claude-config-file`     | CLIهایی که یک فایل config مربوط به MCP را می‌پذیرند                              |
| `codex-config-overrides` | CLIهایی که overrideهای config را روی argv می‌پذیرند                        |
| `gemini-system-settings` | CLIهایی که تنظیمات MCP را از دایرکتوری تنظیمات سیستم خود می‌خوانند |

bridge را فقط زمانی فعال کنید که CLI واقعاً بتواند آن را مصرف کند. اگر CLI لایه ابزار داخلی خودش را دارد که غیرفعال‌کردنی نیست، `nativeToolMode:
"always-on"` را تنظیم کنید تا وقتی فراخواننده به نبود ابزارهای بومی نیاز دارد، OpenClaw بتواند fail closed عمل کند.

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

حداقل override موردنیاز کاربران را مستند کنید. معمولاً این فقط `command` است، زمانی که باینری خارج از `PATH` قرار دارد.

## راستی‌آزمایی

برای Pluginهای همراه، یک آزمون متمرکز پیرامون سازنده و ثبت راه‌اندازی
اضافه کنید، سپس مسیر آزمون هدفمند همان Plugin را اجرا کنید:

```bash
pnpm test extensions/acme-cli
```

برای Pluginهای محلی یا نصب‌شده، کشف و یک اجرای واقعی مدل را راستی‌آزمایی کنید:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

اگر بک‌اند از تصویرها یا MCP پشتیبانی می‌کند، یک آزمون smoke زنده اضافه کنید که آن مسیرها را
با CLI واقعی اثبات کند. برای رفتار پرامپت، تصویر، MCP یا
ازسرگیری نشست، به بازرسی ایستا تکیه نکنید.

## چک‌لیست

<Check>`package.json` برای بسته‌های منتشرشده دارای `openclaw.extensions` و ورودی‌های runtime ساخته‌شده است</Check>
<Check>`openclaw.plugin.json` مقدارهای `cliBackends` و `activation.onStartup` عمدی را اعلام می‌کند</Check>
<Check>وقتی راه‌اندازی/کشف مدل باید بک‌اند را در حالت سرد ببیند، `setup.cliBackends` وجود دارد</Check>
<Check>`api.registerCliBackend(...)` از همان شناسه بک‌اند موجود در manifest استفاده می‌کند</Check>
<Check>بازنویسی‌های کاربر زیر `agents.defaults.cliBackends.<id>` همچنان اولویت دارند</Check>
<Check>تنظیمات نشست، پرامپت سیستم، تصویر و تجزیه‌گر خروجی با قرارداد واقعی CLI مطابقت دارند</Check>
<Check>آزمون‌های هدفمند و حداقل یک آزمون smoke زنده CLI مسیر بک‌اند را اثبات می‌کنند</Check>

## مرتبط

- [بک‌اندهای CLI](/fa/gateway/cli-backends) - پیکربندی کاربر و رفتار runtime
- [ساخت Pluginها](/fa/plugins/building-plugins) - مبانی بسته و manifest
- [نمای کلی Plugin SDK](/fa/plugins/sdk-overview) - مرجع API ثبت
- [manifest Plugin](/fa/plugins/manifest) - `cliBackends` و توصیف‌گرهای راه‌اندازی
- [مهار عامل](/fa/plugins/sdk-agent-harness) - runtimeهای کامل عامل خارجی
