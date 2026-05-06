---
read_when:
    - می‌خواهید بدانید OpenClaw چگونه زمینهٔ مدل را گردآوری می‌کند
    - شما در حال جابه‌جایی بین موتور قدیمی و یک موتور Plugin هستید
    - شما در حال ساخت یک Plugin موتور زمینه هستید
sidebarTitle: Context engine
summary: 'موتور زمینه: گردآوری زمینهٔ افزونه‌پذیر، Compaction، و چرخهٔ عمر زیرعامل'
title: موتور زمینه
x-i18n:
    generated_at: "2026-05-06T09:09:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c33c94971751d92a2ce695db545a0c0abb7adcbe1820383b83f4201fa7e628d
    source_path: concepts/context-engine.md
    workflow: 16
---

یک **موتور زمینه** کنترل می‌کند که OpenClaw چگونه برای هر اجرا زمینهٔ مدل را می‌سازد: کدام پیام‌ها را شامل کند، تاریخچهٔ قدیمی‌تر را چگونه خلاصه کند، و زمینه را در مرزهای زیرعامل‌ها چگونه مدیریت کند.

OpenClaw با یک موتور داخلی `legacy` عرضه می‌شود و به‌صورت پیش‌فرض از آن استفاده می‌کند - بیشتر کاربران هرگز نیازی به تغییر آن ندارند. فقط زمانی یک موتور Plugin نصب و انتخاب کنید که رفتار متفاوتی برای مونتاژ، Compaction، یا یادآوری میان‌نشستی می‌خواهید.

## شروع سریع

<Steps>
  <Step title="Check which engine is active">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Install a plugin engine">
    Pluginهای موتور زمینه مانند هر Plugin دیگر OpenClaw نصب می‌شوند.

    <Tabs>
      <Tab title="From npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="From a local path">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Enable and select the engine">
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

    پس از نصب و پیکربندی، Gateway را راه‌اندازی مجدد کنید.

  </Step>
  <Step title="Switch back to legacy (optional)">
    `contextEngine` را روی `"legacy"` تنظیم کنید (یا کلید را کاملاً حذف کنید - `"legacy"` پیش‌فرض است).
  </Step>
</Steps>

## نحوهٔ کار

هر بار که OpenClaw یک پرامپت مدل را اجرا می‌کند، موتور زمینه در چهار نقطهٔ چرخهٔ عمر مشارکت می‌کند:

<AccordionGroup>
  <Accordion title="1. Ingest">
    هنگام افزوده شدن پیام جدید به نشست فراخوانی می‌شود. موتور می‌تواند پیام را در مخزن دادهٔ خودش ذخیره یا نمایه‌سازی کند.
  </Accordion>
  <Accordion title="2. Assemble">
    پیش از هر اجرای مدل فراخوانی می‌شود. موتور مجموعه‌ای مرتب از پیام‌ها (و یک `systemPromptAddition` اختیاری) را برمی‌گرداند که در بودجهٔ توکن جا می‌شوند.
  </Accordion>
  <Accordion title="3. Compact">
    وقتی پنجرهٔ زمینه پر است، یا وقتی کاربر `/compact` را اجرا می‌کند، فراخوانی می‌شود. موتور تاریخچهٔ قدیمی‌تر را برای آزاد کردن فضا خلاصه می‌کند.
  </Accordion>
  <Accordion title="4. After turn">
    پس از تکمیل یک اجرا فراخوانی می‌شود. موتور می‌تواند وضعیت را پایدار کند، Compaction پس‌زمینه را آغاز کند، یا نمایه‌ها را به‌روزرسانی کند.
  </Accordion>
</AccordionGroup>

برای هارنس Codex غیر ACP که همراه محصول ارائه می‌شود، OpenClaw همان چرخهٔ عمر را با نگاشت زمینهٔ مونتاژشده به دستورالعمل‌های توسعه‌دهندهٔ Codex و پرامپت نوبت جاری اعمال می‌کند. Codex همچنان مالک تاریخچهٔ رشتهٔ بومی و فشرده‌ساز بومی خودش است.

### چرخهٔ عمر زیرعامل (اختیاری)

OpenClaw دو هوک اختیاری چرخهٔ عمر زیرعامل را فراخوانی می‌کند:

<ParamField path="prepareSubagentSpawn" type="method">
  پیش از شروع اجرای فرزند، وضعیت زمینهٔ مشترک را آماده می‌کند. این هوک کلیدهای نشست والد/فرزند، `contextMode` (`isolated` یا `fork`)، شناسه‌ها/فایل‌های ترنسکریپت موجود، و TTL اختیاری را دریافت می‌کند. اگر یک هندل بازگشت برگرداند، OpenClaw زمانی آن را فراخوانی می‌کند که ایجاد زیرعامل پس از موفقیت آماده‌سازی شکست بخورد.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  وقتی نشست زیرعامل کامل یا پاک‌سازی می‌شود، پاک‌سازی انجام می‌دهد.
</ParamField>

### افزودنی پرامپت سیستم

متد `assemble` می‌تواند یک رشتهٔ `systemPromptAddition` برگرداند. OpenClaw این مقدار را به ابتدای پرامپت سیستم برای اجرا اضافه می‌کند. این به موتورها امکان می‌دهد راهنمایی یادآوری پویا، دستورالعمل‌های بازیابی، یا نکته‌های آگاه از زمینه را بدون نیاز به فایل‌های ایستای فضای کاری تزریق کنند.

## موتور legacy

موتور داخلی `legacy` رفتار اصلی OpenClaw را حفظ می‌کند:

- **دریافت**: بدون عملیات (مدیر نشست ماندگاری پیام را مستقیماً مدیریت می‌کند).
- **مونتاژ**: عبوری (خط لولهٔ موجود sanitize → validate → limit در runtime مونتاژ زمینه را مدیریت می‌کند).
- **Compact**: به Compaction خلاصه‌سازی داخلی واگذار می‌کند، که یک خلاصهٔ واحد از پیام‌های قدیمی‌تر می‌سازد و پیام‌های اخیر را دست‌نخورده نگه می‌دارد.
- **پس از نوبت**: بدون عملیات.

موتور legacy ابزاری ثبت نمی‌کند و `systemPromptAddition` ارائه نمی‌دهد.

وقتی هیچ `plugins.slots.contextEngine` تنظیم نشده باشد (یا روی `"legacy"` تنظیم شده باشد)، این موتور به‌صورت خودکار استفاده می‌شود.

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

factory با نام `ctx` شامل مقادیر اختیاری `config`، `agentDir`، و `workspaceDir` است تا Pluginها بتوانند پیش از اجرای نخستین هوک چرخهٔ عمر، وضعیت مربوط به هر عامل یا هر فضای کاری را مقداردهی اولیه کنند.

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
| `info`             | ویژگی    | شناسه، نام، نسخهٔ موتور، و اینکه مالک Compaction هست یا نه |
| `ingest(params)`   | متد      | ذخیرهٔ یک پیام تکی                                      |
| `assemble(params)` | متد      | ساخت زمینه برای اجرای مدل (`AssembleResult` را برمی‌گرداند) |
| `compact(params)`  | متد      | خلاصه‌سازی/کاهش زمینه                                  |

`assemble` یک `AssembleResult` با این موارد برمی‌گرداند:

<ParamField path="messages" type="Message[]" required>
  پیام‌های مرتب‌شده‌ای که باید به مدل ارسال شوند.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  برآورد موتور از مجموع توکن‌ها در زمینهٔ مونتاژشده. OpenClaw از این مقدار برای تصمیم‌گیری‌های آستانهٔ Compaction و گزارش‌های تشخیصی استفاده می‌کند.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  به ابتدای پرامپت سیستم افزوده می‌شود.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  کنترل می‌کند runner از کدام برآورد توکن برای پیش‌بررسی‌های سرریز پیشگیرانه استفاده کند. مقدار پیش‌فرض `"assembled"` است، یعنی فقط برآورد پرامپت مونتاژشده بررسی می‌شود - مناسب موتورهایی که یک زمینهٔ پنجره‌بندی‌شده و خودبسنده برمی‌گردانند. فقط زمانی آن را روی `"preassembly_may_overflow"` تنظیم کنید که نمای مونتاژشدهٔ شما بتواند خطر سرریز در ترنسکریپت زیربنایی را پنهان کند؛ در این حالت runner هنگام تصمیم‌گیری دربارهٔ Compaction پیشگیرانه، بیشینهٔ برآورد مونتاژشده و برآورد تاریخچهٔ نشست پیش از مونتاژ (بدون پنجره‌بندی) را در نظر می‌گیرد. در هر صورت، پیام‌هایی که برمی‌گردانید همچنان همان چیزی هستند که مدل می‌بیند - `promptAuthority` فقط بر پیش‌بررسی اثر می‌گذارد.
</ParamField>

`compact` یک `CompactResult` برمی‌گرداند. وقتی Compaction ترنسکریپت فعال را می‌چرخاند، `result.sessionId` و `result.sessionFile` نشست جانشینی را مشخص می‌کنند که تلاش مجدد یا نوبت بعدی باید از آن استفاده کند.

اعضای اختیاری:

| عضو                           | نوع | هدف                                                                                                          |
| ----------------------------- | --- | ------------------------------------------------------------------------------------------------------------ |
| `bootstrap(params)`            | متد | مقداردهی اولیهٔ وضعیت موتور برای یک نشست. یک‌بار وقتی موتور نخستین بار یک نشست را می‌بیند فراخوانی می‌شود (مثلاً وارد کردن تاریخچه). |
| `ingestBatch(params)`          | متد | دریافت یک نوبت کامل به‌صورت دسته‌ای. پس از تکمیل اجرا، با همهٔ پیام‌های همان نوبت یک‌جا فراخوانی می‌شود. |
| `afterTurn(params)`            | متد | کار چرخهٔ عمر پس از اجرا (پایدارسازی وضعیت، آغاز Compaction پس‌زمینه). |
| `prepareSubagentSpawn(params)` | متد | راه‌اندازی وضعیت مشترک برای یک نشست فرزند پیش از شروع آن. |
| `onSubagentEnded(params)`      | متد | پاک‌سازی پس از پایان زیرعامل. |
| `dispose()`                    | متد | آزادسازی منابع. هنگام خاموش شدن Gateway یا بارگذاری مجدد Plugin فراخوانی می‌شود - نه برای هر نشست. |

### ownsCompaction

`ownsCompaction` کنترل می‌کند که آیا Compaction خودکار درون‌تلاش داخلی Pi برای اجرا فعال بماند یا نه:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    موتور مالک رفتار Compaction است. OpenClaw Compaction خودکار داخلی Pi را برای آن اجرا غیرفعال می‌کند، و پیاده‌سازی `compact()` موتور مسئول `/compact`، Compaction بازیابی سرریز، و هر Compaction پیش‌دستانه‌ای است که می‌خواهد در `afterTurn()` انجام دهد. OpenClaw همچنان ممکن است محافظ سرریز پیش از پرامپت را اجرا کند؛ وقتی پیش‌بینی کند ترنسکریپت کامل سرریز می‌شود، مسیر بازیابی پیش از ارسال پرامپت دیگر، `compact()` موتور فعال را فراخوانی می‌کند.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    Compaction خودکار داخلی Pi همچنان ممکن است هنگام اجرای پرامپت اجرا شود، اما متد `compact()` موتور فعال همچنان برای `/compact` و بازیابی سرریز فراخوانی می‌شود.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **به این معنا نیست** که OpenClaw به‌صورت خودکار به مسیر Compaction موتور legacy برمی‌گردد.
</Warning>

یعنی دو الگوی معتبر برای Plugin وجود دارد:

<Tabs>
  <Tab title="Owning mode">
    الگوریتم Compaction خودتان را پیاده‌سازی کنید و `ownsCompaction: true` را تنظیم کنید.
  </Tab>
  <Tab title="Delegating mode">
    `ownsCompaction: false` را تنظیم کنید و کاری کنید `compact()` با فراخوانی `delegateCompactionToRuntime(...)` از `openclaw/plugin-sdk/core` از رفتار Compaction داخلی OpenClaw استفاده کند.
  </Tab>
</Tabs>

یک `compact()` بدون عملیات برای یک موتور فعال غیرمالک ناایمن است، زیرا مسیر عادی Compaction برای `/compact` و بازیابی سرریز را برای آن slot موتور غیرفعال می‌کند.

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
این slot در زمان اجرا انحصاری است - فقط یک موتور زمینهٔ ثبت‌شده برای یک اجرا یا عملیات Compaction مشخص resolve می‌شود. Pluginهای فعال دیگر با `kind: "context-engine"` همچنان می‌توانند بارگذاری شوند و کد ثبت خود را اجرا کنند؛ `plugins.slots.contextEngine` فقط انتخاب می‌کند OpenClaw وقتی به موتور زمینه نیاز دارد کدام شناسهٔ موتور ثبت‌شده را resolve کند.
</Note>

<Note>
**حذف نصب Plugin:** وقتی Pluginی را که در حال حاضر به‌عنوان `plugins.slots.contextEngine` انتخاب شده حذف نصب می‌کنید، OpenClaw slot را به مقدار پیش‌فرض (`legacy`) بازنشانی می‌کند. همین رفتار بازنشانی برای `plugins.slots.memory` نیز اعمال می‌شود. نیازی به ویرایش دستی پیکربندی نیست.
</Note>

## ارتباط با Compaction و حافظه

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction یکی از مسئولیت‌های موتور زمینه است. موتور قدیمی به خلاصه‌سازی داخلی OpenClaw واگذار می‌کند. موتورهای Plugin می‌توانند هر راهبرد Compactionای را پیاده‌سازی کنند (خلاصه‌های DAG، بازیابی برداری، و غیره).
  </Accordion>
  <Accordion title="Pluginهای حافظه">
    Pluginهای حافظه (`plugins.slots.memory`) از موتورهای زمینه جدا هستند. Pluginهای حافظه جست‌وجو/بازیابی را فراهم می‌کنند؛ موتورهای زمینه کنترل می‌کنند مدل چه چیزی را می‌بیند. آن‌ها می‌توانند با هم کار کنند - یک موتور زمینه ممکن است هنگام سرهم‌بندی از داده‌های Plugin حافظه استفاده کند. موتورهای Plugin که مسیر پرامپت Active Memory را می‌خواهند، باید `buildMemorySystemPromptAddition(...)` را از `openclaw/plugin-sdk/core` ترجیح دهند؛ این تابع بخش‌های پرامپت Active Memory را به یک `systemPromptAddition` آماده برای افزودن در ابتدا تبدیل می‌کند. اگر موتوری به کنترل سطح پایین‌تری نیاز داشته باشد، همچنان می‌تواند خطوط خام را از `openclaw/plugin-sdk/memory-host-core` از طریق `buildActiveMemoryPromptSection(...)` بگیرد.
  </Accordion>
  <Accordion title="هرس نشست">
    کوتاه‌سازی نتایج قدیمی ابزار در حافظه همچنان صرف‌نظر از اینکه کدام موتور زمینه فعال است اجرا می‌شود.
  </Accordion>
</AccordionGroup>

## نکات

- از `openclaw doctor` استفاده کنید تا تأیید کنید موتور شما درست بارگذاری می‌شود.
- اگر موتور را تغییر دهید، نشست‌های موجود با تاریخچه فعلی خود ادامه می‌دهند. موتور جدید برای اجراهای آینده کنترل را در دست می‌گیرد.
- خطاهای موتور ثبت می‌شوند و در عیب‌یابی نمایش داده می‌شوند. اگر یک موتور Plugin در ثبت شدن شکست بخورد یا شناسه موتور انتخاب‌شده قابل حل نباشد، OpenClaw به‌صورت خودکار به حالت قبلی برنمی‌گردد؛ اجراها تا زمانی که Plugin را اصلاح کنید یا `plugins.slots.contextEngine` را به `"legacy"` برگردانید شکست می‌خورند.
- برای توسعه، از `openclaw plugins install -l ./my-engine` استفاده کنید تا یک پوشه Plugin محلی را بدون کپی کردن پیوند دهید.

## مرتبط

- [Compaction](/fa/concepts/compaction) - خلاصه‌سازی گفت‌وگوهای طولانی
- [زمینه](/fa/concepts/context) - زمینه چگونه برای نوبت‌های عامل ساخته می‌شود
- [معماری Plugin](/fa/plugins/architecture) - ثبت Pluginهای موتور زمینه
- [manifest Plugin](/fa/plugins/manifest) - فیلدهای manifest Plugin
- [Pluginها](/fa/tools/plugin) - نمای کلی Plugin
