---
read_when:
    - شما در حال ساخت یک Plugin محلی برای بک‌اند CLI هوش مصنوعی هستید
    - می‌خواهید یک بک‌اند برای ارجاع‌های مدل مانند acme-cli/model ثبت کنید
    - باید یک CLI شخص ثالث را به اجراکنندهٔ جایگزین متنی OpenClaw نگاشت کنید
sidebarTitle: CLI backend plugins
summary: یک Plugin بسازید که یک بک‌اند محلی CLI هوش مصنوعی را ثبت کند
title: ساخت Pluginهای بک‌اند CLI
x-i18n:
    generated_at: "2026-07-12T10:20:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6448cdac02a03e5fdf0d802a54189998d97c08769b1b85c8d9963301fa2c5b79
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Pluginهای backend مربوط به CLI به OpenClaw امکان می‌دهند یک CLI محلی هوش مصنوعی را به‌عنوان backend استنتاج متنی فراخوانی کند. backend به‌صورت پیشوند provider در ارجاع‌های مدل ظاهر می‌شود:

```text
acme-cli/acme-large
```

هنگامی از backend مربوط به CLI استفاده کنید که یکپارچه‌سازی بالادستی از قبل به‌صورت یک فرمان محلی ارائه شده باشد، CLI وضعیت ورود محلی را مدیریت کند، یا زمانی که providerهای API در دسترس نیستند به یک راهکار جایگزین نیاز دارید.

<Info>
  اگر سرویس بالادستی یک API عادی HTTP برای مدل ارائه می‌کند، به‌جای آن یک
  [Plugin ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) بنویسید. اگر runtime بالادستی
  نشست‌های کامل عامل، رویدادهای ابزار، Compaction یا وضعیت وظایف پس‌زمینه را مدیریت
  می‌کند، از یک [مهار عامل](/fa/plugins/sdk-agent-harness) استفاده کنید.
</Info>

## مسئولیت‌های Plugin

یک Plugin مربوط به backend در CLI سه قرارداد دارد:

| قرارداد               | فایل                   | هدف                                                              |
| ---------------------- | ---------------------- | ---------------------------------------------------------------- |
| ورودی بسته             | `package.json`         | ماژول runtime مربوط به Plugin را به OpenClaw معرفی می‌کند         |
| مالکیت مانیفست         | `openclaw.plugin.json` | شناسه backend را پیش از بارگذاری runtime اعلام می‌کند             |
| ثبت runtime            | `index.ts`             | `api.registerCliBackend(...)` را با پیش‌فرض‌های فرمان فراخوانی می‌کند |

مانیفست، فراداده اکتشاف است: CLI را اجرا یا رفتار runtime را ثبت نمی‌کند. رفتار runtime زمانی آغاز می‌شود که ورودی Plugin تابع `api.registerCliBackend(...)` را فراخوانی کند.

## حداقل Plugin مربوط به backend

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

    بسته‌های منتشرشده باید فایل‌های JavaScript ساخته‌شده مربوط به runtime را دربر داشته باشند. اگر ورودی منبع شما
    `./src/index.ts` است، `openclaw.runtimeExtensions` را با اشاره به همتای
    JavaScript ساخته‌شده اضافه کنید. به [نقاط ورود](/fa/plugins/sdk-entrypoints) مراجعه کنید.

  </Step>

  <Step title="اعلام مالکیت backend">
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

    `cliBackends` فهرست مالکیت runtime است؛ این فهرست به OpenClaw امکان می‌دهد زمانی که پیکربندی یا انتخاب مدل به `acme-cli/...` اشاره می‌کند، Plugin را به‌طور خودکار بارگذاری کند.

    `setup.cliBackends` سطح راه‌اندازی مبتنی بر توصیف‌گر است. زمانی آن را اضافه کنید که اکتشاف مدل، فرایند شروع به کار یا وضعیت باید backend را بدون بارگذاری runtime مربوط به Plugin شناسایی کند. تنها زمانی از `requiresRuntime: false` استفاده کنید که این توصیف‌گرهای ایستا برای راه‌اندازی کافی باشند.

  </Step>

  <Step title="ثبت backend">
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

    شناسه backend باید با ورودی `cliBackends` در مانیفست مطابقت داشته باشد.
    `config` ثبت‌شده فقط مقدار پیش‌فرض است؛ پیکربندی کاربر در
    `agents.defaults.cliBackends.acme-cli` هنگام اجرا با آن ادغام شده و بر آن اولویت می‌یابد.

  </Step>
</Steps>

## ساختار پیکربندی

`CliBackendConfig` چگونگی اجرا و تجزیه CLI توسط OpenClaw را توصیف می‌کند:

| فیلد                                                      | کاربرد                                                                                          |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `command`                                                 | نام فایل اجرایی یا مسیر مطلق فرمان                                                              |
| `args`                                                    | argv پایه برای اجراهای تازه                                                                     |
| `resumeArgs`                                              | argv جایگزین برای نشست‌های ازسرگرفته‌شده؛ از `{sessionId}` پشتیبانی می‌کند                        |
| `output` / `resumeOutput`                                 | تجزیه‌گر: `json`، `jsonl` یا `text`                                                              |
| `jsonlDialect`                                            | گویش رویداد JSONL:‏ `claude-stream-json` یا `gemini-stream-json`                                |
| `liveSession`                                             | حالت فرایند طولانی‌مدت CLI ‏(`claude-stdio`)                                                     |
| `input`                                                   | انتقال اعلان: `arg` یا `stdin`                                                                  |
| `maxPromptArgChars`                                       | حداکثر طول اعلان در حالت `arg` پیش از بازگشت به stdin                                           |
| `env` / `clearEnv`                                        | متغیرهای محیطی اضافی برای تزریق، یا نام‌هایی که باید پیش از اجرا حذف شوند                        |
| `modelArg`                                                | پرچمی که پیش از شناسه مدل استفاده می‌شود                                                        |
| `modelAliases`                                            | نگاشت شناسه‌های مدل OpenClaw به شناسه‌های بومی CLI                                               |
| `sessionArg` / `sessionArgs`                              | شیوه ارسال شناسه نشست                                                                           |
| `sessionMode`                                             | `always`، `existing` یا `none`                                                                  |
| `sessionIdFields`                                         | فیلدهای JSON که OpenClaw از خروجی CLI می‌خواند                                                   |
| `systemPromptArg` / `systemPromptFileArg`                 | انتقال اعلان سیستمی                                                                             |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | انتقال بازنویسی پیکربندی برای فایل اعلان سیستمی، برای مثال `-c`                                 |
| `systemPromptMode`                                        | `append` یا `replace`                                                                           |
| `systemPromptWhen`                                        | `first`، `always` یا `never`                                                                    |
| `imageArg` / `imageMode`                                  | پرچم مسیر تصویر و شیوه ارسال چند تصویر (`repeat` یا `list`)                                     |
| `imagePathScope`                                          | محل نگهداری فایل‌های تصویر آماده‌شده پیش از تحویل: `temp` یا `workspace`                         |
| `serialize`                                               | اجراهای مربوط به یک backend را مرتب نگه می‌دارد                                                  |
| `reseedFromRawTranscriptWhenUncompacted`                  | فعال‌سازی بازنشانی محدود از رونوشت خام پیش از Compaction برای بازنشانی ایمن نشست‌ها               |
| `reliability.outputLimits`                                | حداکثر نویسه‌ها/خطوط خام JSONL نگهداری‌شده برای یک نوبت زنده CLI در backendهای نشست زنده          |
| `reliability.watchdog`                                    | تنظیم مهلت نبود خروجی، به‌صورت جداگانه برای اجراهای تازه و ازسرگرفته‌شده                         |

کوچک‌ترین پیکربندی ایستایی را ترجیح دهید که با CLI مطابقت دارد. callbackهای Plugin را فقط برای رفتاری اضافه کنید که واقعاً به backend تعلق دارد.

## hookهای پیشرفته backend

`CliBackendPlugin` همچنین می‌تواند موارد زیر را تعریف کند:

| hook                               | کاربرد                                                                                   |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | بازنویسی پیکربندی قدیمی کاربر پس از ادغام                                                 |
| `resolveExecutionArgs(ctx)`        | افزودن پرچم‌های محدود به درخواست، مانند میزان تلاش برای تفکر یا جداسازی پرسش جانبی         |
| `prepareExecution(ctx)`            | ایجاد پل‌های موقت احراز هویت یا پیکربندی پیش از اجرا                                      |
| `transformSystemPrompt(ctx)`       | اعمال تبدیل نهایی مختص CLI روی اعلان سیستمی                                               |
| `textTransforms`                   | جایگزینی‌های دوسویه اعلان/خروجی                                                           |
| `defaultAuthProfileId`             | ترجیح یک نمایه احراز هویت مشخص در OpenClaw                                                |
| `authEpochMode`                    | تعیین چگونگی نامعتبر شدن نشست‌های ذخیره‌شده CLI در اثر تغییرات احراز هویت                  |
| `nativeToolMode`                   | اعلام اینکه ابزارهای بومی وجود ندارند، همیشه فعال‌اند یا توسط میزبان قابل انتخاب‌اند       |
| `sideQuestionToolMode`             | اعلام ابزارهای بومی غیرفعال برای پرسش‌های جانبی `/btw`                                    |
| `bundleMcp` / `bundleMcpMode`      | فعال‌سازی اختیاری پل ابزار MCP در local loopback مربوط به OpenClaw                        |
| `ownsNativeCompaction`             | backend مالک Compaction خود است و OpenClaw آن را به تعویق می‌اندازد                       |
| `runtimeArtifact`                  | محدود کردن یک اجراکننده اسکریپت به درخت کامل بسته همراه آن                                |

مالکیت این hookها را در اختیار provider نگه دارید. زمانی که یک hook مربوط به backend می‌تواند رفتار را بیان کند، شاخه‌های مختص CLI را به هسته اضافه نکنید.

`runtimeArtifact` تحت مالکیت Plugin است و کاربر نمی‌تواند آن را بازنویسی کند. این مقدار تنها زمانی بررسی می‌شود که یک نوبت استنتاج زنده، مجوز تأییدشده راه‌اندازی را ایجاد یا دوباره اعتبارسنجی کند؛ اجراهای عادی CLI به آن نیاز ندارند. backend بدون این اعلان نمی‌تواند مجوز تأییدشده راه‌اندازی CLI را ایجاد کند. اعلان `bundled-package-tree` مالک دقیق `package.json` را مشخص می‌کند و لازم می‌داند نقطه ورود بسته همان فرمان باشد. OpenClaw درخت کامل و محدودشده بسته نصب‌شده، از جمله وابستگی‌های تو‌در‌تو را هش می‌کند و در موارد پیوندهای نمادین تغییردهنده مسیر، اجراکننده‌های خارج از بسته اعلام‌شده، اعلان وابستگی‌های خارجی الزامی، درخت‌های بیش‌ازحد بزرگ و اسکریپت‌های ناشناخته با وضعیت بسته متوقف می‌شود. این مورد را تنها زمانی اعلام کنید که آن درخت شامل پیاده‌سازی کامل استنتاج باشد؛ یکپارچه‌سازی‌های اختیاری ابزار، گراف پیاده‌سازی خارجی را ایمن نمی‌کنند.

اگر همان backend یک فایل اجرایی بومی مستقل نیز ارائه می‌کند، نام‌های پایه متعارف آن را در `nativeExecutableNames` فهرست کنید. سایر فرمان‌های بومی حتی زمانی که کاربر فرمان backend را بازنویسی کند، تأییدنشده باقی می‌مانند.

`ctx.executionMode` برای نوبت‌های عادی برابر با `"agent"` و برای فراخوانی‌های موقتی `/btw` برابر با `"side-question"` است. هنگامی از آن استفاده کنید که CLI برای BTW به پرچم‌های یک‌بارمصرف متفاوتی نیاز دارد، مانند غیرفعال‌کردن ابزارهای بومی، ماندگاری نشست یا رفتار ازسرگیری. اگر یک بک‌اند معمولاً دارای `nativeToolMode: "always-on"` است، اما argv پرسش جانبی آن ابزارها را به‌طور قابل‌اعتماد غیرفعال می‌کند، `sideQuestionToolMode: "disabled"` را نیز تنظیم کنید؛ در غیر این صورت، هنگامی که BTW به اجرای CLI بدون ابزار نیاز داشته باشد، OpenClaw با رویکرد بسته و ایمن متوقف می‌شود.

`nativeToolMode: "selectable"` را فقط زمانی تنظیم کنید که `resolveExecutionArgs` بتواند تمام ابزارهای بومی بک‌اند را برای یک اجرای منفرد غیرفعال کند. در چنین اجراهای محدودی، `ctx.toolAvailability.native` یک تاپل خالی و `ctx.toolAvailability.mcp` فهرست مجاز دقیق MCP با جداسازی میزبان است. هوک باید پرچم‌های ابزاری متعارض را جایگزین کند و argvای برگرداند که هر دو مقدار را اعمال کند؛ OpenClaw آن را یک بار با argv نهایی اجرای تازه یا ازسرگیری فراخوانی می‌کند و اگر بک‌اند نتواند محدودیت را اعمال کند، با رویکرد بسته و ایمن متوقف می‌شود. تأیید خودکار نام‌های MCP در این زمینه فقط به این دلیل ایمن است که میزبان از قبل پیکربندی MCP تولیدشده را به همان سرورها و ابزارها محدود کرده است.

### `ownsNativeCompaction`: انصراف از Compaction در OpenClaw

اگر بک‌اند شما عاملی را اجرا می‌کند که رونوشت **خودش** را فشرده می‌کند، `ownsNativeCompaction: true` را تنظیم کنید تا خلاصه‌ساز حفاظتی OpenClaw هرگز روی نشست‌های آن اجرا نشود؛ چرخهٔ عمر Compaction در CLI بدون انجام عملی بازمی‌گردد و نوبت ادامه می‌یابد. `claude-cli` این ویژگی را اعلام می‌کند، زیرا Claude Code در داخل خود و بدون نقطهٔ پایانی مهارکننده، Compaction را انجام می‌دهد. در عوض، نشست‌های مهارکنندهٔ بومی مانند Codex همچنان به نقطهٔ پایانی Compaction مهارکنندهٔ خود هدایت می‌شوند.

**آن را فقط زمانی اعلام کنید که همهٔ شرایط زیر برقرار باشند**؛ در غیر این صورت، یک نشست به‌تعویق‌افتاده و فراتر از بودجه ممکن است همچنان فراتر از بودجه بماند یا کهنه شود، زیرا OpenClaw دیگر آن را نجات نمی‌دهد:

- بک‌اند هنگامی که رونوشت خودش به محدودهٔ پنجره نزدیک می‌شود، آن را به‌طور قابل‌اعتماد فشرده یا محدود می‌کند؛
- بک‌اند یک نشست قابل‌ازسرگیری را ماندگار می‌کند تا وضعیت فشرده‌شده میان نوبت‌ها حفظ شود (برای مثال `--resume` / `--session-id`)؛
- نشست از نوع Compaction مهارکنندهٔ بومی نیست؛ نشست‌هایی که با `agentHarnessId` مطابقت دارند، در عوض به نقطهٔ پایانی مهارکننده هدایت می‌شوند.

## پل ابزار MCP

بک‌اندهای CLI به‌طور پیش‌فرض ابزارهای OpenClaw را دریافت نمی‌کنند. اگر CLI بتواند یک پیکربندی MCP را مصرف کند، صریحاً آن را فعال کنید:

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

حالت‌های پل پشتیبانی‌شده:

| حالت                     | کاربرد                                                              |
| ------------------------ | ---------------------------------------------------------------- |
| `claude-config-file`     | CLIهایی که فایل پیکربندی MCP را می‌پذیرند                              |
| `codex-config-overrides` | CLIهایی که بازنویسی‌های پیکربندی را در argv می‌پذیرند                    |
| `gemini-system-settings` | CLIهایی که تنظیمات MCP را از پوشهٔ تنظیمات سیستمی خود می‌خوانند          |

پل را فقط زمانی فعال کنید که CLI واقعاً بتواند آن را مصرف کند. اگر CLI لایهٔ ابزار داخلی خودش را دارد که قابل‌غیرفعال‌کردن نیست، `nativeToolMode: "always-on"` را تنظیم کنید تا وقتی فراخواننده‌ای نبود ابزار بومی را الزامی می‌کند، OpenClaw بتواند با رویکرد بسته و ایمن متوقف شود. اگر CLI می‌تواند همهٔ ابزارهای بومی را برای هر اجرا غیرفعال کند، از `"selectable"` به‌همراه قرارداد `resolveExecutionArgs` بالا استفاده کنید.

## پیکربندی کاربر

کاربران می‌توانند هر پیش‌فرض بک‌اند را بازنویسی کنند:

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
        primary: "openai/gpt-5.6-sol",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

حداقل بازنویسی‌ای را که احتمالاً کاربران نیاز خواهند داشت مستند کنید؛ معمولاً فقط `command`، زمانی که فایل اجرایی خارج از `PATH` قرار دارد.

## راستی‌آزمایی

برای Pluginهای همراه، یک آزمون متمرکز پیرامون سازنده و ثبت راه‌اندازی اضافه کنید، سپس مسیر آزمون هدفمند Plugin را اجرا کنید:

```bash
pnpm test extensions/acme-cli
```

برای Pluginهای محلی یا نصب‌شده، کشف و یک اجرای واقعی مدل را راستی‌آزمایی کنید:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

اگر بک‌اند از تصاویر یا MCP پشتیبانی می‌کند، یک آزمون دود زنده اضافه کنید که این مسیرها را با CLI واقعی اثبات کند. برای رفتار اعلان، تصویر، MCP یا ازسرگیری نشست به بازرسی ایستا تکیه نکنید.

## فهرست بررسی

<Check>`package.json` برای بسته‌های منتشرشده دارای `openclaw.extensions` و ورودی‌های زمان اجرای ساخته‌شده است</Check>
<Check>`openclaw.plugin.json`، `cliBackends` و `activation.onStartup` هدفمند را اعلام می‌کند</Check>
<Check>هنگامی که راه‌اندازی یا کشف مدل باید بک‌اند سرد را ببیند، `setup.cliBackends` وجود دارد</Check>
<Check>`api.registerCliBackend(...)` از همان شناسهٔ بک‌اند موجود در مانیفست استفاده می‌کند</Check>
<Check>بازنویسی‌های کاربر در `agents.defaults.cliBackends.<id>` همچنان اولویت دارند</Check>
<Check>تنظیمات نشست، اعلان سیستمی، تصویر و تجزیه‌گر خروجی با قرارداد واقعی CLI مطابقت دارند</Check>
<Check>آزمون‌های هدفمند و دست‌کم یک آزمون دود زندهٔ CLI مسیر بک‌اند را اثبات می‌کنند</Check>

## مرتبط

- [بک‌اندهای CLI](/fa/gateway/cli-backends) - پیکربندی کاربر و رفتار زمان اجرا
- [ساخت Pluginها](/fa/plugins/building-plugins) - مبانی بسته و مانیفست
- [نمای کلی SDK مربوط به Plugin](/fa/plugins/sdk-overview) - مرجع API ثبت
- [مانیفست Plugin](/fa/plugins/manifest) - `cliBackends` و توصیفگرهای راه‌اندازی
- [مهارکنندهٔ عامل](/fa/plugins/sdk-agent-harness) - محیط‌های اجرای کامل عامل خارجی
