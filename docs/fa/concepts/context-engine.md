---
read_when:
    - می‌خواهید بفهمید OpenClaw چگونه بافت مدل را مونتاژ می‌کند
    - شما در حال جابه‌جایی بین موتور قدیمی و یک موتور Plugin هستید
    - شما در حال ساخت یک Plugin موتور زمینه هستید
sidebarTitle: Context engine
summary: 'موتور زمینه: مونتاژ زمینه قابل‌اتصال، Compaction، و چرخه عمر زیرعامل'
title: موتور زمینه
x-i18n:
    generated_at: "2026-06-30T14:16:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0ed65cbb72b14b1a6e8d4d9a394f730a48ada35d77e34c12b3356162b281eec
    source_path: concepts/context-engine.md
    workflow: 16
---

یک **موتور زمینه** کنترل می‌کند OpenClaw چگونه برای هر اجرا زمینهٔ مدل را می‌سازد: کدام پیام‌ها گنجانده شوند، تاریخچهٔ قدیمی‌تر چگونه خلاصه شود، و زمینه در مرزهای زیرعامل‌ها چگونه مدیریت شود.

OpenClaw با یک موتور داخلی `legacy` عرضه می‌شود و به‌طور پیش‌فرض از آن استفاده می‌کند - بیشتر کاربران هرگز نیازی به تغییر این ندارند. فقط وقتی یک موتور Plugin را نصب و انتخاب کنید که رفتار متفاوتی برای مونتاژ، Compaction، یا یادآوری بین‌نشستی می‌خواهید.

## شروع سریع

<Steps>
  <Step title="بررسی کنید کدام موتور فعال است">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="نصب یک موتور Plugin">
    Pluginهای موتور زمینه مانند هر Plugin دیگر OpenClaw نصب می‌شوند.

    <Tabs>
      <Tab title="از npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="از یک مسیر محلی">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="فعال‌سازی و انتخاب موتور">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // must match the plugin's registered engine id
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Plugin-specific config goes here (see the plugin's docs)
          },
        },
      },
    }
    ```

    پس از نصب و پیکربندی، Gateway را بازراه‌اندازی کنید.

  </Step>
  <Step title="بازگشت به legacy (اختیاری)">
    `contextEngine` را روی `"legacy"` تنظیم کنید (یا کلید را کاملاً حذف کنید - `"legacy"` پیش‌فرض است).
  </Step>
</Steps>

## نحوهٔ کارکرد

هر بار که OpenClaw یک اعلان مدل را اجرا می‌کند، موتور زمینه در چهار نقطهٔ چرخهٔ عمر مشارکت می‌کند:

<AccordionGroup>
  <Accordion title="1. دریافت">
    وقتی پیام جدیدی به نشست اضافه می‌شود فراخوانی می‌شود. موتور می‌تواند پیام را در ذخیره‌گاه دادهٔ خودش ذخیره یا ایندکس کند.
  </Accordion>
  <Accordion title="2. مونتاژ">
    پیش از هر اجرای مدل فراخوانی می‌شود. موتور مجموعه‌ای مرتب از پیام‌ها (و یک `systemPromptAddition` اختیاری) را برمی‌گرداند که در بودجهٔ توکن جا می‌شوند.
  </Accordion>
  <Accordion title="3. Compact">
    وقتی پنجرهٔ زمینه پر است، یا وقتی کاربر `/compact` را اجرا می‌کند فراخوانی می‌شود. موتور تاریخچهٔ قدیمی‌تر را خلاصه می‌کند تا فضا آزاد شود.
  </Accordion>
  <Accordion title="4. پس از نوبت">
    پس از کامل شدن یک اجرا فراخوانی می‌شود. موتور می‌تواند وضعیت را پایدار کند، Compaction پس‌زمینه را آغاز کند، یا ایندکس‌ها را به‌روزرسانی کند.
  </Accordion>
</AccordionGroup>

برای هارنس Codex غیر ACP بسته‌بندی‌شده، OpenClaw همان چرخهٔ عمر را با نگاشت زمینهٔ مونتاژشده به دستورالعمل‌های توسعه‌دهندهٔ Codex و اعلان نوبت فعلی اعمال می‌کند. Codex همچنان مالک تاریخچهٔ رشتهٔ بومی و فشرده‌ساز بومی خودش است.

### چرخهٔ عمر زیرعامل (اختیاری)

OpenClaw دو هوک اختیاری چرخهٔ عمر زیرعامل را فراخوانی می‌کند:

<ParamField path="prepareSubagentSpawn" type="method">
  پیش از شروع اجرای فرزند، وضعیت زمینهٔ مشترک را آماده کنید. هوک کلیدهای نشست والد/فرزند، `contextMode` (`isolated` یا `fork`)، شناسه‌ها/فایل‌های رونوشت موجود، و TTL اختیاری را دریافت می‌کند. اگر یک هندل rollback برگرداند، وقتی ایجاد پس از موفقیت آماده‌سازی شکست بخورد، OpenClaw آن را فراخوانی می‌کند. ایجادهای زیرعامل بومی که `lightContext` را درخواست می‌کنند و به `contextMode="isolated"` حل می‌شوند، عمداً این هوک را رد می‌کنند تا فرزند از زمینهٔ راه‌انداز سبک‌وزن، بدون وضعیت پیشاایجادِ مدیریت‌شده توسط موتور زمینه، شروع شود.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  وقتی یک نشست زیرعامل کامل می‌شود یا پاک‌سازی می‌شود، پاک‌سازی انجام دهید.
</ParamField>

### افزودن اعلان سیستم

متد `assemble` می‌تواند یک رشتهٔ `systemPromptAddition` برگرداند. OpenClaw این را به ابتدای اعلان سیستم برای اجرا اضافه می‌کند. این به موتورها اجازه می‌دهد بدون نیاز به فایل‌های ایستای فضای کاری، راهنمایی یادآوری پویا، دستورالعمل‌های بازیابی، یا نکته‌های آگاه از زمینه را تزریق کنند.

## موتور legacy

موتور داخلی `legacy` رفتار اصلی OpenClaw را حفظ می‌کند:

- **دریافت**: بدون عملیات (مدیر نشست پایداری پیام را مستقیماً مدیریت می‌کند).
- **مونتاژ**: عبور مستقیم (خط لولهٔ موجود sanitize → validate → limit در زمان اجرا مونتاژ زمینه را مدیریت می‌کند).
- **Compact**: به Compaction خلاصه‌سازی داخلی واگذار می‌کند، که یک خلاصهٔ واحد از پیام‌های قدیمی‌تر می‌سازد و پیام‌های اخیر را دست‌نخورده نگه می‌دارد.
- **پس از نوبت**: بدون عملیات.

موتور legacy ابزارها را ثبت نمی‌کند یا `systemPromptAddition` ارائه نمی‌دهد.

وقتی `plugins.slots.contextEngine` تنظیم نشده باشد (یا روی `"legacy"` تنظیم شده باشد)، این موتور به‌طور خودکار استفاده می‌شود.

## موتورهای Plugin

یک Plugin می‌تواند با استفاده از API Plugin یک موتور زمینه ثبت کند:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Return messages that fit the budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

کارخانهٔ `ctx` شامل مقادیر اختیاری `config`، `agentDir`، و `workspaceDir`
است تا Pluginها بتوانند پیش از اجرای نخستین هوک چرخهٔ عمر، وضعیت هر عامل یا هر فضای کاری را مقداردهی اولیه کنند.

سپس آن را در پیکربندی فعال کنید:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### رابط ContextEngine

اعضای الزامی:

| عضو                | نوع      | هدف                                                     |
| ------------------ | -------- | ------------------------------------------------------- |
| `info`             | ویژگی    | شناسهٔ موتور، نام، نسخه، و اینکه آیا مالک Compaction است |
| `ingest(params)`   | متد      | ذخیرهٔ یک پیام واحد                                    |
| `assemble(params)` | متد      | ساخت زمینه برای اجرای مدل (`AssembleResult` را برمی‌گرداند) |
| `compact(params)`  | متد      | خلاصه‌سازی/کاهش زمینه                                  |

`assemble` یک `AssembleResult` با موارد زیر برمی‌گرداند:

<ParamField path="messages" type="Message[]" required>
  پیام‌های مرتب‌شده برای ارسال به مدل.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  برآورد موتور از مجموع توکن‌ها در زمینهٔ مونتاژشده. OpenClaw از این برای تصمیم‌های آستانهٔ Compaction و گزارش‌دهی تشخیصی استفاده می‌کند.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  به ابتدای اعلان سیستم افزوده می‌شود.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  کنترل می‌کند اجراکننده برای پیش‌بررسی‌های سرریز پیشگیرانه از کدام برآورد توکن استفاده کند. مقدار پیش‌فرض `"assembled"` است، یعنی برای موتورهایی که مالک Compaction نیستند فقط برآورد اعلان مونتاژشده بررسی می‌شود. موتورهایی که `ownsCompaction: true` را تنظیم می‌کنند پذیرش اعلان خودشان را مدیریت می‌کنند، بنابراین OpenClaw به‌طور پیش‌فرض پیش‌بررسی عمومی پیشااعلان را رد می‌کند. `"preassembly_may_overflow"` را فقط وقتی تنظیم کنید که نمای مونتاژشدهٔ شما بتواند ریسک سرریز را در رونوشت زیربنایی پنهان کند؛ سپس اجراکننده پیش‌بررسی عمومی را فعال نگه می‌دارد و هنگام تصمیم‌گیری برای Compaction پیشگیرانه، بیشینهٔ برآورد مونتاژشده و برآورد تاریخچهٔ نشست پیشامونتاژ (بدون پنجره‌سازی) را می‌گیرد. در هر صورت، پیام‌هایی که برمی‌گردانید همچنان همان چیزی هستند که مدل می‌بیند - `promptAuthority` فقط بر پیش‌بررسی اثر می‌گذارد.
</ParamField>

`compact` یک `CompactResult` برمی‌گرداند. وقتی Compaction رونوشت فعال را می‌چرخاند، `result.sessionId` و `result.sessionFile` نشست جانشین را شناسایی می‌کنند که تلاش دوباره یا نوبت بعدی باید از آن استفاده کند.

اعضای اختیاری:

| عضو                            | نوع   | هدف                                                                                                      |
| ------------------------------ | ----- | -------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | متد   | مقداردهی اولیهٔ وضعیت موتور برای یک نشست. یک بار وقتی موتور برای نخستین بار یک نشست را می‌بیند فراخوانی می‌شود (مثلاً وارد کردن تاریخچه). |
| `ingestBatch(params)`          | متد   | دریافت یک نوبت کامل به‌صورت دسته‌ای. پس از کامل شدن یک اجرا، با همهٔ پیام‌های آن نوبت به‌صورت یک‌جا فراخوانی می‌شود. |
| `afterTurn(params)`            | متد   | کار چرخهٔ عمر پس از اجرا (پایدارسازی وضعیت، آغاز Compaction پس‌زمینه).                                  |
| `prepareSubagentSpawn(params)` | متد   | تنظیم وضعیت مشترک برای یک نشست فرزند پیش از شروع آن.                                                    |
| `onSubagentEnded(params)`      | متد   | پاک‌سازی پس از پایان یک زیرعامل.                                                                         |
| `dispose()`                    | متد   | آزادسازی منابع. هنگام خاموش شدن Gateway یا بارگذاری دوبارهٔ Plugin فراخوانی می‌شود - نه برای هر نشست.   |

### تنظیمات زمان اجرا

هوک‌های چرخهٔ عمر که داخل OpenClaw اجرا می‌شوند یک شیء اختیاری
`runtimeSettings` دریافت می‌کنند. این یک سطح API داخلیِ تولیدکننده/مصرف‌کننده، نسخه‌دار و فقط‌خواندنی است: OpenClaw آن را برای موتور زمینهٔ انتخاب‌شده تولید می‌کند، و موتور زمینه آن را داخل هوک‌های چرخهٔ عمر مصرف می‌کند. این مستقیماً برای کاربران رندر نمی‌شود و سطح گزارش‌دهی اختصاصی ایجاد نمی‌کند.

- `schemaVersion`: در حال حاضر `1`
- `runtime`: میزبان OpenClaw، حالت زمان اجرا (`normal`، `fallback`، یا
  `degraded`)، و شناسه‌های اختیاری هارنس/زمان اجرا
- `contextEngineSelection`: شناسهٔ موتور زمینهٔ انتخاب‌شده و منبع انتخاب
- `executionHost`: شناسه و برچسب میزبان برای سطحی که هوک را فراخوانی می‌کند
- `model`: مدل درخواست‌شده، مدل حل‌شده، ارائه‌دهنده، و خانوادهٔ اختیاری مدل
- `limits`: بودجهٔ توکن اعلان و حداکثر توکن‌های خروجی وقتی معلوم باشند
- `diagnostics`: کدهای دلیل fallback بسته و degraded وقتی معلوم باشند

فیلدهایی که می‌توانند نامعلوم باشند به‌صورت `null` نمایش داده می‌شوند؛ فیلدهای تفکیک‌گر مانند حالت زمان اجرا و منبع انتخاب غیرقابل-null باقی می‌مانند. موتورهای قدیمی‌تر سازگار می‌مانند: اگر یک موتور legacy سخت‌گیر `runtimeSettings` را به‌عنوان ویژگی ناشناخته رد کند، OpenClaw به‌جای قرنطینه کردن موتور، فراخوانی چرخهٔ عمر را بدون آن دوباره تلاش می‌کند.

### الزامات میزبان

موتورهای زمینه می‌توانند الزامات قابلیت میزبان را در `info.hostRequirements` اعلام کنند.
OpenClaw این الزامات را پیش از شروع عملیات بررسی می‌کند و وقتی زمان اجرای انتخاب‌شده نتواند آن‌ها را برآورده کند، با یک خطای توصیفی به‌صورت fail closed شکست می‌خورد.

برای اجراهای عامل، وقتی موتور باید اعلان واقعی مدل را از طریق `assemble()` کنترل کند، `assemble-before-prompt` را اعلام کنید:

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Use the native Codex or OpenClaw embedded runtime, or select the legacy context engine.",
    },
  },
}
```

اجرای عامل‌های Codex بومی و تعبیه‌شدهٔ OpenClaw، `assemble-before-prompt` را برآورده می‌کنند.
بک‌اندهای عمومی CLI این کار را نمی‌کنند، بنابراین موتورهایی که به آن نیاز دارند پیش از شروع فرایند CLI رد می‌شوند.

### جداسازی شکست

OpenClaw موتور Plugin انتخاب‌شده را از مسیر اصلی پاسخ جدا می‌کند. اگر یک
موتور غیرقدیمی وجود نداشته باشد، اعتبارسنجی قرارداد را رد کند، هنگام ایجاد
factory خطا بدهد، یا از یک متد چرخه‌عمر خطا پرتاب کند، OpenClaw آن موتور را
برای فرایند فعلی Gateway قرنطینه می‌کند و کارهای context-engine را به موتور
داخلی `legacy` تنزل می‌دهد. خطا همراه با عملیات ناموفق ثبت می‌شود تا
اپراتور بتواند Plugin را تعمیر، به‌روزرسانی یا غیرفعال کند، بدون اینکه agent
بی‌پاسخ بماند.

خطاهای مربوط به الزامات میزبان متفاوت‌اند: وقتی یک موتور اعلام می‌کند که یک runtime
فاقد قابلیت لازم است، OpenClaw پیش از شروع اجرا به‌صورت fail-closed متوقف می‌شود. این
از موتورهایی محافظت می‌کند که اگر در میزبان پشتیبانی‌نشده اجرا شوند، وضعیت را خراب می‌کنند.

### ownsCompaction

`ownsCompaction` کنترل می‌کند که آیا auto-compaction داخلی runtime OpenClaw درون attempt برای اجرا فعال بماند یا نه:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    موتور مالک رفتار Compaction است. OpenClaw، auto-compaction داخلی runtime OpenClaw و precheck عمومی سرریز پیش از prompt را برای آن اجرا غیرفعال می‌کند، و پیاده‌سازی `compact()` موتور مسئول `/compact`، Compaction بازیابی سرریز provider، و هر Compaction پیش‌دستانه‌ای است که بخواهد در `afterTurn()` انجام دهد. وقتی موتور از `assemble()` مقدار `promptAuthority: "preassembly_may_overflow"` را برمی‌گرداند، OpenClaw همچنان safeguard سرریز پیش از prompt را اجرا می‌کند.
  </Accordion>
  <Accordion title="ownsCompaction: false یا تنظیم‌نشده">
    auto-compaction داخلی runtime OpenClaw ممکن است همچنان هنگام اجرای prompt اجرا شود، اما متد `compact()` موتور فعال همچنان برای `/compact` و بازیابی سرریز فراخوانی می‌شود.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` به این معنا **نیست** که OpenClaw به‌طور خودکار به مسیر Compaction موتور legacy برمی‌گردد.
</Warning>

این یعنی دو الگوی معتبر برای Plugin وجود دارد:

<Tabs>
  <Tab title="حالت مالکیت">
    الگوریتم Compaction خودتان را پیاده‌سازی کنید و `ownsCompaction: true` را تنظیم کنید.
  </Tab>
  <Tab title="حالت واگذاری">
    `ownsCompaction: false` را تنظیم کنید و کاری کنید `compact()`، تابع `delegateCompactionToRuntime(...)` را از `openclaw/plugin-sdk/core` فراخوانی کند تا از رفتار Compaction داخلی OpenClaw استفاده شود.
  </Tab>
</Tabs>

یک `compact()` بدون عملیات برای یک موتور فعال غیرمالک ناامن است، چون مسیر عادی Compaction مربوط به `/compact` و بازیابی سرریز را برای آن slot موتور غیرفعال می‌کند.

## مرجع پیکربندی

```json5
{
  plugins: {
    slots: {
      // Select the active context engine. Default: "legacy".
      // Set to a plugin id to use a plugin engine.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
این slot در زمان اجرا انحصاری است - برای یک اجرای مشخص یا عملیات Compaction فقط یک موتور context ثبت‌شده resolve می‌شود. Pluginهای فعال دیگر با `kind: "context-engine"` همچنان می‌توانند load شوند و کد ثبت خود را اجرا کنند؛ `plugins.slots.contextEngine` فقط انتخاب می‌کند وقتی OpenClaw به یک موتور context نیاز دارد، کدام شناسه موتور ثبت‌شده را resolve کند.
</Note>

<Note>
**حذف نصب Plugin:** وقتی Pluginی را که در حال حاضر به‌عنوان `plugins.slots.contextEngine` انتخاب شده حذف نصب می‌کنید، OpenClaw آن slot را به مقدار پیش‌فرض (`legacy`) بازنشانی می‌کند. همین رفتار بازنشانی برای `plugins.slots.memory` هم اعمال می‌شود. نیازی به ویرایش دستی config نیست.
</Note>

## رابطه با Compaction و حافظه

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction یکی از مسئولیت‌های موتور context است. موتور legacy به خلاصه‌سازی داخلی OpenClaw واگذار می‌کند. موتورهای Plugin می‌توانند هر راهبرد Compactionی را پیاده‌سازی کنند (خلاصه‌های DAG، بازیابی برداری و غیره).
  </Accordion>
  <Accordion title="Pluginهای حافظه">
    Pluginهای حافظه (`plugins.slots.memory`) از موتورهای context جدا هستند. Pluginهای حافظه جستجو/بازیابی فراهم می‌کنند؛ موتورهای context کنترل می‌کنند مدل چه چیزی را ببیند. آن‌ها می‌توانند با هم کار کنند - یک موتور context ممکن است هنگام assembly از داده‌های Plugin حافظه استفاده کند. موتورهای Plugin که مسیر prompt حافظه فعال را می‌خواهند باید `buildMemorySystemPromptAddition(...)` را از `openclaw/plugin-sdk/core` ترجیح دهند؛ این تابع بخش‌های prompt حافظه فعال را به یک `systemPromptAddition` آماده برای prepend تبدیل می‌کند. اگر یک موتور به کنترل سطح پایین‌تر نیاز داشته باشد، همچنان می‌تواند از `openclaw/plugin-sdk/memory-host-core` از طریق `buildActiveMemoryPromptSection(...)` خطوط خام را بگیرد.
  </Accordion>
  <Accordion title="هرس session">
    کوتاه‌کردن نتایج قدیمی tool در حافظه، فارغ از اینکه کدام موتور context فعال است، همچنان اجرا می‌شود.
  </Accordion>
</AccordionGroup>

## نکته‌ها

- از `openclaw doctor` برای بررسی اینکه موتور شما درست load می‌شود استفاده کنید.
- اگر موتور را تغییر می‌دهید، sessionهای موجود با history فعلی خود ادامه می‌دهند. موتور جدید برای اجراهای آینده کنترل را به دست می‌گیرد.
- خطاهای موتور ثبت می‌شوند و موتور Plugin انتخاب‌شده برای فرایند فعلی Gateway قرنطینه می‌شود. OpenClaw برای turnهای کاربر به `legacy` برمی‌گردد تا پاسخ‌ها بتوانند ادامه پیدا کنند، اما همچنان باید Plugin خراب را تعمیر، به‌روزرسانی، غیرفعال یا حذف نصب کنید.
- برای توسعه، از `openclaw plugins install -l ./my-engine` استفاده کنید تا یک دایرکتوری Plugin محلی را بدون کپی‌کردن link کنید.

## مرتبط

- [Compaction](/fa/concepts/compaction) - خلاصه‌سازی گفتگوهای طولانی
- [Context](/fa/concepts/context) - context چگونه برای turnهای agent ساخته می‌شود
- [معماری Plugin](/fa/plugins/architecture) - ثبت Pluginهای موتور context
- [manifest Plugin](/fa/plugins/manifest) - فیلدهای manifest مربوط به Plugin
- [Pluginها](/fa/tools/plugin) - نمای کلی Plugin
