---
doc-schema-version: 1
read_when:
    - می‌خواهید یک Plugin جدید برای OpenClaw ایجاد کنید
    - به یک راهنمای شروع سریع برای توسعه Plugin نیاز دارید
    - دارید بین مستندات کانال، ارائه‌دهنده، backend مربوط به CLI، ابزار یا hook انتخاب می‌کنید
sidebarTitle: Getting Started
summary: اولین Plugin خود برای OpenClaw را در چند دقیقه بسازید
title: ساخت Pluginها
x-i18n:
    generated_at: "2026-06-27T18:10:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8991b9e857af76b4fecc15a5feb9bd6659af91a4b7518f59c83ca091dc7f705c
    source_path: plugins/building-plugins.md
    workflow: 16
---

Pluginها OpenClaw را بدون تغییر هسته گسترش می‌دهند. یک Plugin می‌تواند یک کانال پیام‌رسانی، ارائه‌دهندهٔ مدل، پشتانهٔ CLI محلی، ابزار عامل، hook، ارائه‌دهندهٔ رسانه، یا قابلیت دیگری که مالکیت آن با Plugin است اضافه کند.

لازم نیست Plugin خارجی را به مخزن OpenClaw اضافه کنید. بسته را در [ClawHub](/fa/clawhub) منتشر کنید و کاربران آن را با این دستور نصب می‌کنند:

```bash
openclaw plugins install clawhub:<package-name>
```

مشخصه‌های بستهٔ ساده همچنان در زمان گذار راه‌اندازی از npm نصب می‌شوند. وقتی وضوح‌یابی ClawHub را می‌خواهید، از پیشوند `clawhub:` استفاده کنید.

## الزامات

- از Node 22.19 یا جدیدتر و یک مدیر بسته مانند `npm` یا `pnpm` استفاده کنید.
- با ماژول‌های TypeScript ESM آشنا باشید.
- برای کار روی Pluginهای همراه داخل مخزن، مخزن را clone کنید و `pnpm install` را اجرا کنید.
  توسعهٔ Plugin در checkout منبع فقط با pnpm انجام می‌شود، چون OpenClaw Pluginهای همراه را از بسته‌های workspace در `extensions/*` بارگذاری می‌کند.

## انتخاب شکل Plugin

<CardGroup cols={2}>
  <Card title="Plugin کانال" icon="messages-square" href="/fa/plugins/sdk-channel-plugins">
    OpenClaw را به یک سکوی پیام‌رسانی وصل کنید.
  </Card>
  <Card title="Plugin ارائه‌دهنده" icon="cpu" href="/fa/plugins/sdk-provider-plugins">
    یک ارائه‌دهندهٔ مدل، رسانه، جست‌وجو، دریافت، گفتار، یا بلادرنگ اضافه کنید.
  </Card>
  <Card title="Plugin پشتانهٔ CLI" icon="terminal" href="/fa/plugins/cli-backend-plugins">
    یک CLI محلی هوش مصنوعی را از طریق جایگزینی مدل OpenClaw اجرا کنید.
  </Card>
  <Card title="Plugin ابزار" icon="wrench" href="/fa/plugins/tool-plugins">
    ابزارهای عامل را ثبت کنید.
  </Card>
</CardGroup>

## شروع سریع

با ثبت یک ابزار عامل الزامی، یک Plugin ابزار حداقلی بسازید. این کوتاه‌ترین شکل مفید Plugin است و بسته، manifest، نقطهٔ ورود، و اثبات محلی را نشان می‌دهد.

<Steps>
  <Step title="ایجاد فرادادهٔ بسته">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
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

    Pluginهای خارجی منتشرشده باید ورودی‌های runtime را به فایل‌های JavaScript ساخته‌شده اشاره دهند. برای قرارداد کامل نقطهٔ ورود، [نقطه‌های ورود SDK](/fa/plugins/sdk-entrypoints) را ببینید.

    هر Plugin به یک manifest نیاز دارد، حتی وقتی پیکربندی ندارد. ابزارهای runtime باید در `contracts.tools` بیایند تا OpenClaw بتواند مالکیت را بدون بارگذاری مشتاقانهٔ runtime همهٔ Pluginها کشف کند. `activation.onStartup` را آگاهانه تنظیم کنید. این نمونه هنگام راه‌اندازی Gateway شروع می‌شود.

    سطح‌های Plugin مورد اعتماد میزبان نیز با manifest محدود می‌شوند و برای Pluginهای نصب‌شده به فعال‌سازی صریح نیاز دارند. اگر یک Plugin نصب‌شده `api.registerAgentToolResultMiddleware(...)` را ثبت می‌کند، هر runtime هدف را در `contracts.agentToolResultMiddleware` اعلام کنید. اگر `api.registerTrustedToolPolicy(...)` را ثبت می‌کند، هر شناسهٔ policy را در `contracts.trustedToolPolicies` اعلام کنید. این اعلام‌ها بازرسی زمان نصب و ثبت runtime را هم‌راستا نگه می‌دارند.

    برای هر فیلد manifest، [manifest Plugin](/fa/plugins/manifest) را ببینید.

  </Step>

  <Step title="ثبت ابزار">
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

  <Step title="آزمایش runtime">
    برای یک Plugin نصب‌شده یا خارجی، runtime بارگذاری‌شده را بررسی کنید:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    اگر Plugin یک فرمان CLI ثبت می‌کند، آن فرمان را هم اجرا کنید. برای مثال،
    یک فرمان نمایشی باید اثبات اجرا مانند
    `openclaw demo-plugin ping` داشته باشد.

    برای یک Plugin همراه در این مخزن، OpenClaw بسته‌های Plugin checkout منبع را از workspace `extensions/*` کشف می‌کند. نزدیک‌ترین آزمون هدفمند را اجرا کنید:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="انتشار">
    بسته را پیش از انتشار اعتبارسنجی کنید:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    snippetهای canonical ClawHub در `docs/snippets/plugin-publish/` قرار دارند.

  </Step>

  <Step title="نصب">
    بستهٔ منتشرشده را از طریق ClawHub نصب کنید:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## ثبت ابزارها

ابزارها می‌توانند الزامی یا اختیاری باشند. ابزارهای الزامی وقتی Plugin فعال است همیشه در دسترس هستند. ابزارهای اختیاری به opt-in کاربر نیاز دارند.

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

ابزارهای اختیاری کنترل می‌کنند که آیا ابزار به مدل ارائه شود یا نه. وقتی یک ابزار
یا hook باید پس از انتخاب شدن توسط مدل و پیش از اجرای اقدام درخواست تأیید کند،
از [درخواست‌های مجوز Plugin](/fa/plugins/plugin-permission-requests) استفاده کنید.

از ابزارهای اختیاری برای اثرهای جانبی، binaryهای نامعمول، یا قابلیت‌هایی استفاده کنید
که نباید به‌صورت پیش‌فرض ارائه شوند. نام ابزارها نباید با ابزارهای هسته تداخل داشته باشد؛
تداخل‌ها نادیده گرفته می‌شوند و در diagnostics Plugin گزارش می‌شوند. ثبت‌های بدشکل،
از جمله توصیفگرهای ابزار بدون `parameters`، نادیده گرفته می‌شوند و به همان روش گزارش می‌شوند.
ابزارهای ثبت‌شده تابع‌های typed هستند که مدل می‌تواند پس از گذر از بررسی‌های policy و allowlist فراخوانی کند.

factoryهای ابزار یک شیء context فراهم‌شده توسط runtime دریافت می‌کنند. وقتی یک ابزار باید
مدل فعال turn جاری را ثبت، نمایش، یا بر اساس آن سازگار شود، از `ctx.activeModel`
استفاده کنید. این شیء می‌تواند شامل `provider`، `modelId`، و `modelRef` باشد. آن را
فرادادهٔ runtime اطلاعاتی در نظر بگیرید، نه مرز امنیتی در برابر operator محلی،
کد Plugin نصب‌شده، یا runtime تغییریافتهٔ OpenClaw. ابزارهای محلی حساس همچنان باید به opt-in صریح
Plugin یا operator نیاز داشته باشند و وقتی فرادادهٔ مدل فعال موجود نیست یا مناسب نیست، fail closed کنند.

manifest مالکیت و کشف را اعلام می‌کند؛ اجرا همچنان پیاده‌سازی زندهٔ ابزار ثبت‌شده را فراخوانی می‌کند.
`toolMetadata.<tool>.optional: true` را با `api.registerTool(..., { optional: true })`
هم‌راستا نگه دارید تا OpenClaw بتواند از بارگذاری runtime آن Plugin تا زمانی که ابزار به‌صراحت allowlist نشده است جلوگیری کند.

## قراردادهای import

از زیرمسیرهای متمرکز SDK import کنید:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

از barrel ریشهٔ منسوخ‌شده import نکنید:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

داخل بستهٔ Plugin خود، برای importهای داخلی از فایل‌های barrel محلی مانند `api.ts` و
`runtime-api.ts` استفاده کنید. Plugin خودتان را از طریق مسیر SDK import نکنید.
helperهای اختصاصی ارائه‌دهنده باید در بستهٔ ارائه‌دهنده بمانند، مگر آنکه این مرز واقعاً عمومی باشد.

روش‌های RPC سفارشی Gateway یک نقطهٔ ورود پیشرفته هستند. آن‌ها را روی یک پیشوند اختصاصی Plugin نگه دارید؛ namespaceهای مدیریتی هسته مانند `config.*`،
`exec.approvals.*`، `operator.admin.*`، `wizard.*`، و `update.*` رزرو می‌مانند
و به `operator.admin` resolve می‌شوند. bridge
`openclaw/plugin-sdk/gateway-method-runtime` برای routeهای HTTP Plugin رزرو شده است
که `contracts.gatewayMethodDispatch: ["authenticated-request"]` را اعلام می‌کنند.

برای نقشهٔ کامل import، [نمای کلی SDK Plugin](/fa/plugins/sdk-overview) را ببینید.

## چک‌لیست پیش از ارسال

<Check>**package.json** فرادادهٔ درست `openclaw` را دارد</Check>
<Check>manifest **openclaw.plugin.json** موجود و معتبر است</Check>
<Check>نقطهٔ ورود از `defineChannelPluginEntry` یا `definePluginEntry` استفاده می‌کند</Check>
<Check>همهٔ importها از مسیرهای متمرکز `plugin-sdk/<subpath>` استفاده می‌کنند</Check>
<Check>importهای داخلی از ماژول‌های محلی استفاده می‌کنند، نه self-importهای SDK</Check>
<Check>آزمون‌ها می‌گذرند (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` می‌گذرد (Pluginهای داخل مخزن)</Check>

## آزمایش در برابر نسخه‌های beta

1. برچسب‌های انتشار GitHub را در [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) دنبال کنید و از طریق `Watch` > `Releases` مشترک شوید. برچسب‌های beta شبیه `v2026.3.N-beta.1` هستند. همچنین می‌توانید برای اعلان‌های انتشار، اعلان‌های حساب رسمی OpenClaw در X یعنی [@openclaw](https://x.com/openclaw) را فعال کنید.
2. به‌محض ظاهر شدن برچسب beta، Plugin خود را در برابر آن آزمایش کنید. بازهٔ پیش از stable معمولاً فقط چند ساعت است.
3. پس از آزمایش، در thread Plugin خود در کانال Discord با نام `plugin-forum`، یا `all good` را بنویسید یا توضیح دهید چه چیزی خراب شد. اگر هنوز thread ندارید، یکی ایجاد کنید.
4. اگر چیزی خراب شد، issueای با عنوان `Beta blocker: <plugin-name> - <summary>` باز یا به‌روزرسانی کنید و label `beta-blocker` را اعمال کنید. پیوند issue را در thread خود قرار دهید.
5. یک PR به `main` با عنوان `fix(<plugin-id>): beta blocker - <summary>` باز کنید و issue را هم در PR و هم در thread Discord خود پیوند دهید. مشارکت‌کنندگان نمی‌توانند به PRها label بزنند، بنابراین عنوان سیگنال سمت PR برای نگه‌دارندگان و automation است. blockerهایی که PR دارند merge می‌شوند؛ blockerهای بدون PR ممکن است با وجود آن ship شوند. نگه‌دارندگان در زمان آزمایش beta این threadها را دنبال می‌کنند.
6. سکوت یعنی وضعیت سبز است. اگر این بازه را از دست بدهید، fix شما احتمالاً در چرخهٔ بعدی land می‌شود.

## گام‌های بعدی

<CardGroup cols={2}>
  <Card title="Pluginهای کانال" icon="messages-square" href="/fa/plugins/sdk-channel-plugins">
    یک Plugin کانال پیام‌رسانی بسازید
  </Card>
  <Card title="Pluginهای ارائه‌دهنده" icon="cpu" href="/fa/plugins/sdk-provider-plugins">
    یک Plugin ارائه‌دهندهٔ مدل بسازید
  </Card>
  <Card title="Pluginهای پشتانهٔ CLI" icon="terminal" href="/fa/plugins/cli-backend-plugins">
    یک پشتانهٔ CLI محلی هوش مصنوعی ثبت کنید
  </Card>
  <Card title="نمای کلی SDK" icon="book-open" href="/fa/plugins/sdk-overview">
    نقشهٔ import و مرجع API ثبت
  </Card>
  <Card title="helperهای runtime" icon="settings" href="/fa/plugins/sdk-runtime">
    TTS، جست‌وجو، subagent از طریق api.runtime
  </Card>
  <Card title="آزمایش" icon="test-tubes" href="/fa/plugins/sdk-testing">
    ابزارها و الگوهای آزمون
  </Card>
  <Card title="manifest Plugin" icon="file-json" href="/fa/plugins/manifest">
    مرجع کامل schema manifest
  </Card>
</CardGroup>

## مرتبط

- [hookهای Plugin](/fa/plugins/hooks)
- [معماری Plugin](/fa/plugins/architecture)
