---
read_when:
    - می‌خواهید بدانید OpenClaw چگونه زمینهٔ مدل را گردآوری می‌کند
    - شما بین موتور قدیمی و یک موتور Plugin جابه‌جا می‌شوید
    - شما در حال ساخت یک Plugin موتور زمینه هستید
sidebarTitle: Context engine
summary: 'موتور زمینه: گردآوری افزونه‌پذیر زمینه، Compaction و چرخهٔ عمر زیرعامل'
title: موتور زمینه
x-i18n:
    generated_at: "2026-04-29T22:42:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f192c6b28ad2b5960b504811926fb5e30fe8da9d985d8eec3ad4b65c9f7cae5
    source_path: concepts/context-engine.md
    workflow: 16
---

یک **موتور زمینه** کنترل می‌کند OpenClaw چگونه زمینه‌ی مدل را برای هر اجرا می‌سازد: کدام پیام‌ها را شامل کند، تاریخچه‌ی قدیمی‌تر را چگونه خلاصه کند، و زمینه را در مرزهای زیرعامل‌ها چگونه مدیریت کند.

OpenClaw با یک موتور داخلی `legacy` عرضه می‌شود و به‌صورت پیش‌فرض از آن استفاده می‌کند؛ بیشتر کاربران هرگز لازم نیست این را تغییر دهند. فقط زمانی یک موتور Plugin را نصب و انتخاب کنید که رفتار متفاوتی برای گردآوری، Compaction، یا یادآوری بین‌نشستی می‌خواهید.

## شروع سریع

<Steps>
  <Step title="بررسی موتور فعال">
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

    پس از نصب و پیکربندی، Gateway را راه‌اندازی مجدد کنید.

  </Step>
  <Step title="بازگشت به legacy (اختیاری)">
    `contextEngine` را روی `"legacy"` تنظیم کنید (یا کل کلید را حذف کنید؛ `"legacy"` مقدار پیش‌فرض است).
  </Step>
</Steps>

## نحوه‌ی کار

هر بار که OpenClaw یک پرامپت مدل را اجرا می‌کند، موتور زمینه در چهار نقطه از چرخه‌ی عمر مشارکت می‌کند:

<AccordionGroup>
  <Accordion title="1. دریافت">
    وقتی پیام جدیدی به نشست اضافه می‌شود فراخوانی می‌شود. موتور می‌تواند پیام را در ذخیره‌گاه داده‌ی خودش ذخیره یا نمایه کند.
  </Accordion>
  <Accordion title="2. گردآوری">
    پیش از هر اجرای مدل فراخوانی می‌شود. موتور مجموعه‌ای مرتب از پیام‌ها (و یک `systemPromptAddition` اختیاری) را برمی‌گرداند که در بودجه‌ی توکن جا می‌شوند.
  </Accordion>
  <Accordion title="3. Compact">
    وقتی پنجره‌ی زمینه پر است، یا وقتی کاربر `/compact` را اجرا می‌کند، فراخوانی می‌شود. موتور تاریخچه‌ی قدیمی‌تر را خلاصه می‌کند تا فضا آزاد شود.
  </Accordion>
  <Accordion title="4. پس از نوبت">
    پس از تکمیل یک اجرا فراخوانی می‌شود. موتور می‌تواند وضعیت را پایدار کند، Compaction پس‌زمینه را آغاز کند، یا نمایه‌ها را به‌روزرسانی کند.
  </Accordion>
</AccordionGroup>

برای هارنس Codex غیر-ACP همراه‌شده، OpenClaw همین چرخه‌ی عمر را با نگاشت زمینه‌ی گردآوری‌شده به دستورالعمل‌های توسعه‌دهنده‌ی Codex و پرامپت نوبت فعلی اعمال می‌کند. Codex همچنان مالک تاریخچه‌ی رشته‌ی بومی و فشرده‌ساز بومی خودش است.

### چرخه‌ی عمر زیرعامل (اختیاری)

OpenClaw دو هوک اختیاری چرخه‌ی عمر زیرعامل را فراخوانی می‌کند:

<ParamField path="prepareSubagentSpawn" type="method">
  وضعیت زمینه‌ی مشترک را پیش از آغاز اجرای فرزند آماده می‌کند. این هوک کلیدهای نشست والد/فرزند، `contextMode` (`isolated` یا `fork`)، شناسه‌ها/فایل‌های رونوشت موجود، و TTL اختیاری را دریافت می‌کند. اگر یک دسته‌ی بازگردانی برگرداند، OpenClaw وقتی ایجاد زیرعامل پس از موفقیت آماده‌سازی شکست بخورد، آن را فراخوانی می‌کند.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  وقتی یک نشست زیرعامل کامل یا پاک‌سازی می‌شود، کارهای پاک‌سازی را انجام می‌دهد.
</ParamField>

### افزوده‌ی پرامپت سیستم

متد `assemble` می‌تواند یک رشته‌ی `systemPromptAddition` برگرداند. OpenClaw این را ابتدای پرامپت سیستم آن اجرا اضافه می‌کند. این به موتورها اجازه می‌دهد بدون نیاز به فایل‌های ایستای محیط کاری، راهنمایی پویای یادآوری، دستورالعمل‌های بازیابی، یا نکته‌های آگاه از زمینه را تزریق کنند.

## موتور legacy

موتور داخلی `legacy` رفتار اصلی OpenClaw را حفظ می‌کند:

- **دریافت**: بدون عملیات (مدیر نشست، پایداری پیام را مستقیما مدیریت می‌کند).
- **گردآوری**: عبور مستقیم (خط لوله‌ی موجود پاک‌سازی → اعتبارسنجی → محدودسازی در زمان اجرا، گردآوری زمینه را مدیریت می‌کند).
- **Compact**: به Compaction خلاصه‌سازی داخلی واگذار می‌کند، که یک خلاصه‌ی واحد از پیام‌های قدیمی‌تر می‌سازد و پیام‌های اخیر را دست‌نخورده نگه می‌دارد.
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

سازنده‌ی `ctx` شامل مقادیر اختیاری `config`، `agentDir`، و `workspaceDir`
است تا Pluginها بتوانند پیش از اجرای نخستین هوک چرخه‌ی عمر، وضعیت هر عامل یا هر محیط کاری را مقداردهی اولیه کنند.

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

| عضو                | نوع      | هدف                                                    |
| ------------------ | -------- | ------------------------------------------------------ |
| `info`             | ویژگی   | شناسه، نام، نسخه‌ی موتور، و اینکه آیا مالک Compaction است |
| `ingest(params)`   | متد      | ذخیره‌ی یک پیام منفرد                                  |
| `assemble(params)` | متد      | ساخت زمینه برای اجرای مدل (`AssembleResult` را برمی‌گرداند) |
| `compact(params)`  | متد      | خلاصه‌سازی/کاهش زمینه                                  |

`assemble` یک `AssembleResult` با موارد زیر برمی‌گرداند:

<ParamField path="messages" type="Message[]" required>
  پیام‌های مرتب‌شده‌ای که باید به مدل ارسال شوند.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  برآورد موتور از کل توکن‌ها در زمینه‌ی گردآوری‌شده. OpenClaw از این برای تصمیم‌های آستانه‌ی Compaction و گزارش‌دهی تشخیصی استفاده می‌کند.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  به ابتدای پرامپت سیستم اضافه می‌شود.
</ParamField>

`compact` یک `CompactResult` برمی‌گرداند. وقتی Compaction رونوشت فعال
را می‌چرخاند، `result.sessionId` و `result.sessionFile` نشست جانشینی را مشخص
می‌کنند که تلاش مجدد یا نوبت بعدی باید از آن استفاده کند.

اعضای اختیاری:

| عضو                            | نوع   | هدف                                                                                                         |
| ------------------------------ | ----- | ----------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | متد   | مقداردهی اولیه‌ی وضعیت موتور برای یک نشست. وقتی موتور نخستین بار یک نشست را می‌بیند یک‌بار فراخوانی می‌شود (مثلا وارد کردن تاریخچه). |
| `ingestBatch(params)`          | متد   | دریافت یک نوبت کامل به‌صورت دسته‌ای. پس از تکمیل یک اجرا، با همه‌ی پیام‌های آن نوبت به‌صورت یکجا فراخوانی می‌شود. |
| `afterTurn(params)`            | متد   | کارهای چرخه‌ی عمر پس از اجرا (پایدارسازی وضعیت، آغاز Compaction پس‌زمینه). |
| `prepareSubagentSpawn(params)` | متد   | آماده‌سازی وضعیت مشترک برای یک نشست فرزند پیش از شروع آن. |
| `onSubagentEnded(params)`      | متد   | پاک‌سازی پس از پایان یک زیرعامل. |
| `dispose()`                    | متد   | آزادسازی منابع. هنگام خاموش شدن Gateway یا بارگذاری مجدد Plugin فراخوانی می‌شود، نه برای هر نشست. |

### ownsCompaction

`ownsCompaction` کنترل می‌کند که آیا Compaction خودکار داخلی Pi درون تلاش برای اجرا فعال بماند یا نه:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    موتور مالک رفتار Compaction است. OpenClaw، Compaction خودکار داخلی Pi را برای آن اجرا غیرفعال می‌کند، و پیاده‌سازی `compact()` موتور مسئول `/compact`، Compaction بازیابی سرریز، و هر Compaction پیش‌دستانه‌ای است که بخواهد در `afterTurn()` انجام دهد. OpenClaw ممکن است همچنان محافظ سرریز پیش از پرامپت را اجرا کند؛ وقتی پیش‌بینی کند رونوشت کامل سرریز می‌شود، مسیر بازیابی پیش از ارسال پرامپت دیگر، `compact()` موتور فعال را فراخوانی می‌کند.
  </Accordion>
  <Accordion title="ownsCompaction: false یا تنظیم‌نشده">
    Compaction خودکار داخلی Pi ممکن است همچنان هنگام اجرای پرامپت اجرا شود، اما متد `compact()` موتور فعال همچنان برای `/compact` و بازیابی سرریز فراخوانی می‌شود.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` به این معنی **نیست** که OpenClaw به‌صورت خودکار به مسیر Compaction موتور legacy برمی‌گردد.
</Warning>

یعنی دو الگوی معتبر برای Plugin وجود دارد:

<Tabs>
  <Tab title="حالت مالک">
    الگوریتم Compaction خودتان را پیاده‌سازی کنید و `ownsCompaction: true` را تنظیم کنید.
  </Tab>
  <Tab title="حالت واگذارکننده">
    `ownsCompaction: false` را تنظیم کنید و کاری کنید `compact()` برای استفاده از رفتار Compaction داخلی OpenClaw، `delegateCompactionToRuntime(...)` را از `openclaw/plugin-sdk/core` فراخوانی کند.
  </Tab>
</Tabs>

یک `compact()` بدون عملیات برای یک موتور فعال غیرمالک ناامن است، چون مسیر عادی Compaction مربوط به `/compact` و بازیابی سرریز را برای آن جایگاه موتور غیرفعال می‌کند.

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
این جایگاه در زمان اجرا انحصاری است؛ برای یک اجرا یا عملیات Compaction مشخص، فقط یک موتور زمینه‌ی ثبت‌شده resolve می‌شود. سایر Pluginهای فعال با `kind: "context-engine"` همچنان می‌توانند بارگذاری شوند و کد ثبت خود را اجرا کنند؛ `plugins.slots.contextEngine` فقط انتخاب می‌کند وقتی OpenClaw به یک موتور زمینه نیاز دارد، کدام شناسه‌ی موتور ثبت‌شده را resolve کند.
</Note>

<Note>
**حذف نصب Plugin:** وقتی Pluginی را که در حال حاضر به‌عنوان `plugins.slots.contextEngine` انتخاب شده است حذف نصب می‌کنید، OpenClaw جایگاه را دوباره به مقدار پیش‌فرض (`legacy`) بازنشانی می‌کند. همین رفتار بازنشانی برای `plugins.slots.memory` نیز اعمال می‌شود. نیازی به ویرایش دستی پیکربندی نیست.
</Note>

## رابطه با Compaction و حافظه

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction یکی از مسئولیت‌های موتور زمینه است. موتور قدیمی این کار را به خلاصه‌سازی داخلی OpenClaw واگذار می‌کند. موتورهای Plugin می‌توانند هر راهبرد Compaction را پیاده‌سازی کنند (خلاصه‌های DAG، بازیابی برداری، و غیره).
  </Accordion>
  <Accordion title="Pluginهای حافظه">
    Pluginهای حافظه (`plugins.slots.memory`) از موتورهای زمینه جدا هستند. Pluginهای حافظه جست‌وجو/بازیابی را فراهم می‌کنند؛ موتورهای زمینه کنترل می‌کنند مدل چه چیزی را می‌بیند. آن‌ها می‌توانند با هم کار کنند — یک موتور زمینه ممکن است هنگام مونتاژ از داده‌های Plugin حافظه استفاده کند. موتورهای Plugin که مسیر اعلان Active Memory را می‌خواهند باید `buildMemorySystemPromptAddition(...)` را از `openclaw/plugin-sdk/core` ترجیح دهند، که بخش‌های اعلان Active Memory را به یک `systemPromptAddition` آماده برای افزودن در ابتدا تبدیل می‌کند. اگر موتوری به کنترل سطح پایین‌تر نیاز داشته باشد، همچنان می‌تواند خطوط خام را از `openclaw/plugin-sdk/memory-host-core` از طریق `buildActiveMemoryPromptSection(...)` دریافت کند.
  </Accordion>
  <Accordion title="هرس نشست">
    کوتاه‌سازی نتایج قدیمی ابزار در حافظه، فارغ از اینکه کدام موتور زمینه فعال است، همچنان اجرا می‌شود.
  </Accordion>
</AccordionGroup>

## نکته‌ها

- از `openclaw doctor` برای بررسی اینکه موتور شما درست بارگذاری می‌شود استفاده کنید.
- اگر موتور را عوض می‌کنید، نشست‌های موجود با تاریخچه فعلی خود ادامه می‌دهند. موتور جدید اجرای نوبت‌های آینده را بر عهده می‌گیرد.
- خطاهای موتور ثبت می‌شوند و در عیب‌یابی نمایش داده می‌شوند. اگر یک موتور Plugin ثبت نشود یا شناسه موتور انتخاب‌شده قابل حل نباشد، OpenClaw به‌طور خودکار به حالت جایگزین برنمی‌گردد؛ اجراها تا زمانی که Plugin را اصلاح کنید یا `plugins.slots.contextEngine` را دوباره به `"legacy"` برگردانید شکست می‌خورند.
- برای توسعه، از `openclaw plugins install -l ./my-engine` برای پیوند دادن یک پوشه Plugin محلی بدون کپی کردن استفاده کنید.

## مرتبط

- [Compaction](/fa/concepts/compaction) — خلاصه‌سازی گفت‌وگوهای طولانی
- [زمینه](/fa/concepts/context) — زمینه چگونه برای نوبت‌های عامل ساخته می‌شود
- [معماری Plugin](/fa/plugins/architecture) — ثبت Pluginهای موتور زمینه
- [مانیفست Plugin](/fa/plugins/manifest) — فیلدهای مانیفست Plugin
- [Pluginها](/fa/tools/plugin) — نمای کلی Plugin
