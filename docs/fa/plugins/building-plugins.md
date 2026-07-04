---
doc-schema-version: 1
read_when:
    - می‌خواهید یک Plugin جدید OpenClaw بسازید
    - به یک راه‌اندازی سریع برای توسعه Plugin نیاز دارید
    - شما در حال انتخاب بین مستندات کانال، ارائه‌دهنده، بک‌اند CLI، ابزار یا هوک هستید
sidebarTitle: Getting Started
summary: اولین Plugin OpenClaw خود را در چند دقیقه بسازید
title: ساخت Pluginها
x-i18n:
    generated_at: "2026-07-04T15:27:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4bceff518e0b2b3b06573a96edb2af65bbe8662d049323045cd1c80fc6f328f
    source_path: plugins/building-plugins.md
    workflow: 16
---

Pluginها OpenClaw را بدون تغییر core گسترش می‌دهند. یک Plugin می‌تواند یک کانال پیام‌رسانی، ارائه‌دهنده مدل، بک‌اند CLI محلی، ابزار agent، hook، ارائه‌دهنده رسانه، یا قابلیت دیگری که مالکیت آن با Plugin است اضافه کند.

لازم نیست یک Plugin خارجی را به مخزن OpenClaw اضافه کنید. package را در [ClawHub](/fa/clawhub) منتشر کنید و کاربران آن را با این دستور نصب می‌کنند:

```bash
openclaw plugins install clawhub:<package-name>
```

مشخصات package بدون پیشوند همچنان در دوره گذار راه‌اندازی از npm نصب می‌شوند. وقتی می‌خواهید resolve شدن از ClawHub انجام شود، از پیشوند `clawhub:` استفاده کنید.

## نیازمندی‌ها

- از Node 22.19+، Node 23.11+ یا Node 24+ و یک package manager مانند `npm` یا `pnpm` استفاده کنید.
- با ماژول‌های TypeScript ESM آشنا باشید.
- برای کار روی Pluginهای bundled داخل مخزن، مخزن را clone کنید و `pnpm install` را اجرا کنید.
  توسعه Plugin در source checkout فقط با pnpm انجام می‌شود، چون OpenClaw Pluginهای bundled را از packageهای workspace در `extensions/*` بارگذاری می‌کند.

## شکل Plugin را انتخاب کنید

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/fa/plugins/sdk-channel-plugins">
    OpenClaw را به یک پلتفرم پیام‌رسانی وصل کنید.
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/fa/plugins/sdk-provider-plugins">
    یک ارائه‌دهنده مدل، رسانه، جست‌وجو، fetch، گفتار یا realtime اضافه کنید.
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/fa/plugins/cli-backend-plugins">
    یک CLI هوش مصنوعی محلی را از طریق fallback مدل OpenClaw اجرا کنید.
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/fa/plugins/tool-plugins">
    ابزارهای agent را ثبت کنید.
  </Card>
</CardGroup>

## شروع سریع

با ثبت یک ابزار agent الزامی، یک Plugin ابزار حداقلی بسازید. این کوتاه‌ترین شکل مفید Plugin است و package، manifest، نقطه ورود و اثبات محلی را نشان می‌دهد.

<Steps>
  <Step title="Create package metadata">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "typebox": "1.1.39"
  },
  "peerDependencies": {
    "openclaw": ">=2026.3.24-beta.2"
  },
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
  }
}
```

```json openclaw.plugin.json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds a custom tool to OpenClaw",
  "contracts": {
    "tools": ["my_tool"]
  },
  "activation": {
    "onStartup": true
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

    </CodeGroup>

    Pluginهای خارجی منتشرشده باید entryهای runtime را به فایل‌های JavaScript ساخته‌شده اشاره دهند. برای قرارداد کامل نقطه ورود، [نقاط ورود SDK](/fa/plugins/sdk-entrypoints) را ببینید.

    هر Plugin به یک manifest نیاز دارد، حتی وقتی config ندارد. ابزارهای runtime باید در `contracts.tools` ظاهر شوند تا OpenClaw بتواند مالکیت را بدون بارگذاری eager همه runtimeهای Plugin کشف کند. `activation.onStartup` را آگاهانه تنظیم کنید. این مثال هنگام startup شدن Gateway شروع می‌شود.

    سطح‌های Plugin مورد اعتماد host نیز با manifest کنترل می‌شوند و برای Pluginهای نصب‌شده به فعال‌سازی صریح نیاز دارند. اگر یک Plugin نصب‌شده `api.registerAgentToolResultMiddleware(...)` را ثبت می‌کند، هر runtime هدف را در `contracts.agentToolResultMiddleware` اعلام کنید. اگر `api.registerTrustedToolPolicy(...)` را ثبت می‌کند، هر policy id را در `contracts.trustedToolPolicies` اعلام کنید. این اعلام‌ها inspection زمان نصب و ثبت runtime را هم‌راستا نگه می‌دارند.

    برای همه فیلدهای manifest، [مانیفست Plugin](/fa/plugins/manifest) را ببینید.

  </Step>

  <Step title="Register the tool">
    ```typescript index.ts
    import { Type } from "typebox";
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Echo one input value",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
            };
          },
        });
      },
    });
    ```

    برای Pluginهای غیرکانالی از `definePluginEntry` استفاده کنید. Pluginهای کانال از `defineChannelPluginEntry` استفاده می‌کنند.

  </Step>

  <Step title="Test the runtime">
    برای یک Plugin نصب‌شده یا خارجی، runtime بارگذاری‌شده را inspect کنید:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    اگر Plugin یک دستور CLI ثبت می‌کند، آن دستور را هم اجرا کنید. برای مثال، یک دستور demo باید اثبات اجرا مانند
    `openclaw demo-plugin ping` داشته باشد.

    برای یک Plugin bundled در این مخزن، OpenClaw packageهای Plugin در source checkout را از workspace `extensions/*` کشف می‌کند. نزدیک‌ترین تست هدفمند را اجرا کنید:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Test the package install">
    پیش از انتشار یک Plugin آماده package، همان شکل نصبی را تست کنید که کاربران دریافت خواهند کرد. ابتدا یک مرحله build اضافه کنید، entryهای runtime مانند `openclaw.extensions` را به JavaScript ساخته‌شده مثل `./dist/index.js` اشاره دهید، و مطمئن شوید `npm pack` خروجی `dist/` را شامل می‌شود. entryهای source TypeScript فقط برای source checkoutها و مسیرهای توسعه محلی هستند.

    سپس Plugin را pack کنید و tarball را با `npm-pack:` نصب کنید:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` از project npm مدیریت‌شده OpenClaw برای هر Plugin استفاده می‌کند، بنابراین خطاهای وابستگی runtime را که تست source checkout می‌تواند پنهان کند پیدا می‌کند. این package و شکل وابستگی را اثبات می‌کند، نه اعتماد رسمی متصل به catalog را. importهای runtime باید در `dependencies` یا `optionalDependencies` باشند؛ وابستگی‌هایی که فقط در `devDependencies` باقی بمانند برای project runtime مدیریت‌شده نصب نمی‌شوند.

    از نصب archive/path خام به عنوان اثبات نهایی برای رفتار رسمی یا privileged Plugin استفاده نکنید. sourceهای خام برای debugging محلی مفیدند، اما همان مسیر وابستگی نصب‌های npm یا ClawHub را اثبات نمی‌کنند. اگر Plugin شما به وضعیت Plugin رسمی مورد اعتماد وابسته است، یک اثبات دوم از طریق نصب رسمی پشتوانه‌دار با catalog یا یک مسیر package منتشرشده که اعتماد رسمی را ثبت می‌کند اضافه کنید. برای جزئیات install-root و مالکیت وابستگی، [حل وابستگی Plugin](/fa/plugins/dependency-resolution) را ببینید.

  </Step>

  <Step title="Publish">
    پیش از انتشار، package را validate کنید:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    snippetهای canonical ClawHub در `docs/snippets/plugin-publish/` قرار دارند.

  </Step>

  <Step title="Install">
    package منتشرشده را از طریق ClawHub نصب کنید:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## ثبت ابزارها

ابزارها می‌توانند الزامی یا اختیاری باشند. ابزارهای الزامی همیشه وقتی Plugin فعال است در دسترس‌اند. ابزارهای اختیاری به opt-in کاربر نیاز دارند.

```typescript
register(api) {
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

هر ابزاری که با `api.registerTool(...)` ثبت می‌شود باید در manifest Plugin نیز اعلام شود:

```json
{
  "contracts": {
    "tools": ["workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

کاربران با `tools.allow` opt in می‌کنند:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

ابزارهای اختیاری کنترل می‌کنند که آیا یک ابزار در معرض مدل قرار بگیرد یا نه. وقتی یک ابزار یا hook باید پس از انتخاب شدن توسط مدل و پیش از اجرای action درخواست تأیید کند، از [درخواست‌های مجوز Plugin](/fa/plugins/plugin-permission-requests) استفاده کنید.

از ابزارهای اختیاری برای side effectها، binaryهای غیرمعمول، یا قابلیت‌هایی استفاده کنید که نباید به‌صورت پیش‌فرض در معرض قرار بگیرند. نام ابزارها نباید با ابزارهای core تداخل داشته باشد؛ تداخل‌ها رد می‌شوند و در diagnosticsهای Plugin گزارش می‌شوند. registrationهای malformed، از جمله descriptorهای ابزار بدون `parameters`، رد می‌شوند و به همان شکل گزارش می‌شوند. ابزارهای ثبت‌شده functionهای typed هستند که مدل می‌تواند پس از عبور policy و allowlist checkها آن‌ها را فراخوانی کند.

factoryهای ابزار یک context object فراهم‌شده توسط runtime دریافت می‌کنند. وقتی یک ابزار باید مدل فعال turn فعلی را log کند، نمایش دهد یا با آن سازگار شود، از `ctx.activeModel` استفاده کنید. این object می‌تواند شامل `provider`، `modelId` و `modelRef` باشد. آن را metadata اطلاعاتی runtime در نظر بگیرید، نه مرز امنیتی در برابر operator محلی، کد Plugin نصب‌شده، یا runtime تغییر‌یافته OpenClaw. ابزارهای محلی حساس همچنان باید به opt-in صریح Plugin یا operator نیاز داشته باشند و وقتی metadata مدل فعال وجود ندارد یا مناسب نیست fail closed شوند.

manifest مالکیت و discovery را اعلام می‌کند؛ اجرا همچنان implementation ابزار ثبت‌شده live را فراخوانی می‌کند. `toolMetadata.<tool>.optional: true` را با `api.registerTool(..., { optional: true })` هم‌راستا نگه دارید تا OpenClaw بتواند تا زمانی که ابزار صراحتاً allowlist نشده، از بارگذاری runtime آن Plugin اجتناب کند.

## قراردادهای import

از subpathهای متمرکز SDK import کنید:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

از root barrel منسوخ‌شده import نکنید:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

درون package Plugin خود، برای importهای داخلی از فایل‌های barrel محلی مانند `api.ts` و
`runtime-api.ts` استفاده کنید. Plugin خودتان را از طریق یک مسیر SDK import نکنید. helperهای مخصوص provider باید در package provider بمانند، مگر اینکه مرز واقعاً generic باشد.

methodهای RPC سفارشی Gateway یک نقطه ورود پیشرفته هستند. آن‌ها را روی یک prefix مخصوص Plugin نگه دارید؛ namespaceهای admin core مانند `config.*`،
`exec.approvals.*`، `operator.admin.*`، `wizard.*` و `update.*` رزرو می‌مانند و به `operator.admin` resolve می‌شوند. bridge
`openclaw/plugin-sdk/gateway-method-runtime` برای routeهای HTTP Plugin رزرو شده است که `contracts.gatewayMethodDispatch: ["authenticated-request"]` را اعلام می‌کنند.

برای نقشه کامل import، [نمای کلی SDK Plugin](/fa/plugins/sdk-overview) را ببینید.

## چک‌لیست پیش از ارسال

<Check>**package.json** metadata درست `openclaw` را دارد</Check>
<Check>manifest **openclaw.plugin.json** وجود دارد و معتبر است</Check>
<Check>نقطه ورود از `defineChannelPluginEntry` یا `definePluginEntry` استفاده می‌کند</Check>
<Check>همه importها از مسیرهای متمرکز `plugin-sdk/<subpath>` استفاده می‌کنند</Check>
<Check>importهای داخلی از ماژول‌های محلی استفاده می‌کنند، نه self-importهای SDK</Check>
<Check>تست‌ها pass می‌شوند (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` pass می‌شود (Pluginهای داخل مخزن)</Check>

## تست در برابر releaseهای beta

1. برچسب‌های انتشار GitHub را در [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) دنبال کنید و از مسیر `Watch` > `Releases` مشترک شوید. برچسب‌های بتا شبیه `v2026.3.N-beta.1` هستند. همچنین می‌توانید اعلان‌های حساب رسمی OpenClaw در X، یعنی [@openclaw](https://x.com/openclaw)، را برای اطلاعیه‌های انتشار فعال کنید.
2. به‌محض ظاهر شدن برچسب بتا، Plugin خود را در برابر آن آزمایش کنید. بازه‌ی قبل از انتشار پایدار معمولاً فقط چند ساعت است.
3. پس از آزمایش، در رشته‌ی مربوط به Plugin خود در کانال Discord با نام `plugin-forum`، یا `all good` را ارسال کنید یا توضیح دهید چه چیزی خراب شده است. اگر هنوز رشته‌ای ندارید، یکی ایجاد کنید.
4. اگر چیزی خراب شد، یک issue با عنوان `Beta blocker: <plugin-name> - <summary>` باز یا به‌روزرسانی کنید و برچسب `beta-blocker` را اعمال کنید. پیوند issue را در رشته‌ی خود قرار دهید.
5. یک PR به `main` با عنوان `fix(<plugin-id>): beta blocker - <summary>` باز کنید و issue را هم در PR و هم در رشته‌ی Discord خود پیوند دهید. مشارکت‌کنندگان نمی‌توانند به PRها برچسب بزنند، بنابراین عنوان، سیگنال سمت PR برای نگه‌دارندگان و خودکارسازی است. مسدودکننده‌هایی که PR دارند ادغام می‌شوند؛ مسدودکننده‌های بدون PR ممکن است با این حال منتشر شوند. نگه‌دارندگان در طول آزمایش بتا این رشته‌ها را دنبال می‌کنند.
6. سکوت به‌معنای سبز بودن وضعیت است. اگر این بازه را از دست بدهید، اصلاح شما احتمالاً در چرخه‌ی بعدی وارد می‌شود.

## گام‌های بعدی

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/fa/plugins/sdk-channel-plugins">
    یک Plugin کانال پیام‌رسانی بسازید
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/fa/plugins/sdk-provider-plugins">
    یک Plugin ارائه‌دهنده‌ی مدل بسازید
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/fa/plugins/cli-backend-plugins">
    یک پس‌زمینه‌ی CLI محلی برای هوش مصنوعی ثبت کنید
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/fa/plugins/sdk-overview">
    مرجع نگاشت import و API ثبت
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/fa/plugins/sdk-runtime">
    TTS، جست‌وجو، subagent از طریق api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/fa/plugins/sdk-testing">
    ابزارها و الگوهای آزمایش
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/fa/plugins/manifest">
    مرجع کامل شمای manifest
  </Card>
</CardGroup>

## مرتبط

- [hookهای Plugin](/fa/plugins/hooks)
- [معماری Plugin](/fa/plugins/architecture)
