---
read_when:
    - می‌خواهید بفهمید OpenClaw چگونه زمینهٔ مدل را گردآوری می‌کند
    - در حال جابه‌جایی بین موتور قدیمی و یک موتور Plugin هستید
    - شما در حال ساخت یک Plugin موتور زمینه هستید
sidebarTitle: Context engine
summary: 'موتور زمینه: گردآوری زمینه به‌صورت قابل‌افزونه، Compaction، و چرخهٔ عمر عامل فرعی'
title: موتور زمینه
x-i18n:
    generated_at: "2026-05-02T11:42:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7477dd1d48f9633586dce67204912a810e0931d7bc9f2d6719ba465fe19681b
    source_path: concepts/context-engine.md
    workflow: 16
---

یک **موتور زمینه** کنترل می‌کند OpenClaw چگونه برای هر اجرا زمینهٔ مدل را بسازد: کدام پیام‌ها را شامل کند، تاریخچهٔ قدیمی‌تر را چگونه خلاصه کند، و زمینه را در مرزهای زیرعامل‌ها چگونه مدیریت کند.

OpenClaw همراه با موتور داخلی `legacy` عرضه می‌شود و به‌صورت پیش‌فرض از آن استفاده می‌کند — بیشتر کاربران هرگز نیازی به تغییر آن ندارند. فقط زمانی یک موتور Plugin را نصب و انتخاب کنید که رفتار متفاوتی برای مونتاژ، Compaction، یا یادآوری بین‌نشستی می‌خواهید.

## شروع سریع

<Steps>
  <Step title="بررسی اینکه کدام موتور فعال است">
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
    `contextEngine` را روی `"legacy"` تنظیم کنید (یا کل کلید را حذف کنید — `"legacy"` مقدار پیش‌فرض است).
  </Step>
</Steps>

## نحوهٔ کار

هر بار که OpenClaw یک پرامپت مدل را اجرا می‌کند، موتور زمینه در چهار نقطهٔ چرخهٔ عمر مشارکت می‌کند:

<AccordionGroup>
  <Accordion title="1. دریافت">
    وقتی پیام جدیدی به نشست اضافه می‌شود فراخوانی می‌شود. موتور می‌تواند پیام را در ذخیره‌گاه دادهٔ خودش ذخیره یا نمایه‌سازی کند.
  </Accordion>
  <Accordion title="2. مونتاژ">
    پیش از هر اجرای مدل فراخوانی می‌شود. موتور مجموعه‌ای مرتب از پیام‌ها (و یک `systemPromptAddition` اختیاری) را که در بودجهٔ توکن جا می‌شوند برمی‌گرداند.
  </Accordion>
  <Accordion title="3. Compact">
    وقتی پنجرهٔ زمینه پر است، یا وقتی کاربر `/compact` را اجرا می‌کند فراخوانی می‌شود. موتور تاریخچهٔ قدیمی‌تر را برای آزاد کردن فضا خلاصه می‌کند.
  </Accordion>
  <Accordion title="4. پس از نوبت">
    پس از کامل شدن یک اجرا فراخوانی می‌شود. موتور می‌تواند وضعیت را پایدار کند، Compaction پس‌زمینه را فعال کند، یا نمایه‌ها را به‌روزرسانی کند.
  </Accordion>
</AccordionGroup>

برای هارنس Codex غیر ACP همراه بسته، OpenClaw همین چرخهٔ عمر را با نگاشت زمینهٔ مونتاژشده به دستورالعمل‌های توسعه‌دهندهٔ Codex و پرامپت نوبت فعلی اعمال می‌کند. Codex همچنان مالک تاریخچهٔ رشتهٔ بومی و فشرده‌ساز بومی خود است.

### چرخهٔ عمر زیرعامل (اختیاری)

OpenClaw دو هوک اختیاری چرخهٔ عمر زیرعامل را فراخوانی می‌کند:

<ParamField path="prepareSubagentSpawn" type="method">
  پیش از شروع اجرای فرزند، وضعیت زمینهٔ مشترک را آماده می‌کند. این هوک کلیدهای نشست والد/فرزند، `contextMode` (`isolated` یا `fork`)، شناسه‌ها/فایل‌های رونویس موجود، و TTL اختیاری را دریافت می‌کند. اگر یک دستهٔ rollback برگرداند، وقتی spawn پس از آماده‌سازی موفق شکست بخورد، OpenClaw آن را فراخوانی می‌کند.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  وقتی یک نشست زیرعامل کامل یا جمع‌آوری می‌شود، پاک‌سازی انجام می‌دهد.
</ParamField>

### افزودنی پرامپت سیستم

متد `assemble` می‌تواند یک رشتهٔ `systemPromptAddition` برگرداند. OpenClaw این را به ابتدای پرامپت سیستم برای اجرا اضافه می‌کند. این به موتورها اجازه می‌دهد بدون نیاز به فایل‌های ثابت فضای کاری، راهنمایی یادآوری پویا، دستورالعمل‌های بازیابی، یا اشاره‌های آگاه از زمینه تزریق کنند.

## موتور legacy

موتور داخلی `legacy` رفتار اصلی OpenClaw را حفظ می‌کند:

- **دریافت**: بدون عملیات (مدیر نشست پایداری پیام را مستقیماً مدیریت می‌کند).
- **مونتاژ**: عبور مستقیم (خط لولهٔ موجود sanitize → validate → limit در زمان اجرا مونتاژ زمینه را مدیریت می‌کند).
- **Compact**: به Compaction خلاصه‌سازی داخلی واگذار می‌کند، که یک خلاصهٔ واحد از پیام‌های قدیمی‌تر می‌سازد و پیام‌های اخیر را دست‌نخورده نگه می‌دارد.
- **پس از نوبت**: بدون عملیات.

موتور legacy ابزار ثبت نمی‌کند یا `systemPromptAddition` ارائه نمی‌دهد.

وقتی `plugins.slots.contextEngine` تنظیم نشده باشد (یا روی `"legacy"` تنظیم شده باشد)، این موتور به‌صورت خودکار استفاده می‌شود.

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

کارخانهٔ `ctx` شامل مقادیر اختیاری `config`، `agentDir` و `workspaceDir`
است تا Pluginها بتوانند پیش از اجرای نخستین هوک چرخهٔ عمر، وضعیت مخصوص هر عامل یا هر فضای کاری را مقداردهی اولیه کنند.

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
| `compact(params)`  | متد      | خلاصه/کاهش زمینه                                       |

`assemble` یک `AssembleResult` با موارد زیر برمی‌گرداند:

<ParamField path="messages" type="Message[]" required>
  پیام‌های مرتب‌شده‌ای که باید به مدل ارسال شوند.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  برآورد موتور از کل توکن‌ها در زمینهٔ مونتاژشده. OpenClaw از این برای تصمیم‌های آستانهٔ Compaction و گزارش تشخیصی استفاده می‌کند.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  به ابتدای پرامپت سیستم اضافه می‌شود.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  کنترل می‌کند اجراکننده برای پیش‌بررسی‌های سرریز پیش‌دستانه از کدام برآورد توکن استفاده کند. مقدار پیش‌فرض `"assembled"` است، یعنی فقط برآورد پرامپت مونتاژشده بررسی می‌شود — مناسب برای موتورهایی که یک زمینهٔ پنجره‌بندی‌شده و خودبسنده برمی‌گردانند. فقط زمانی روی `"preassembly_may_overflow"` تنظیم کنید که نمای مونتاژشدهٔ شما می‌تواند خطر سرریز را در رونویس زیربنایی پنهان کند؛ سپس اجراکننده هنگام تصمیم‌گیری برای اینکه آیا به‌صورت پیش‌دستانه Compact کند یا نه، بیشینهٔ برآورد مونتاژشده و برآورد تاریخچهٔ نشست پیش از مونتاژ (بدون پنجره‌بندی) را می‌گیرد. در هر صورت، پیام‌هایی که شما برمی‌گردانید همچنان همان چیزی است که مدل می‌بیند — `promptAuthority` فقط روی پیش‌بررسی اثر می‌گذارد.
</ParamField>

`compact` یک `CompactResult` برمی‌گرداند. وقتی Compaction رونویس فعال را می‌چرخاند، `result.sessionId` و `result.sessionFile` نشست جانشینی را مشخص می‌کنند که تلاش دوباره یا نوبت بعدی باید از آن استفاده کند.

اعضای اختیاری:

| عضو                            | نوع  | هدف                                                                                                            |
| ------------------------------ | ---- | -------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | متد | مقداردهی اولیهٔ وضعیت موتور برای یک نشست. یک‌بار وقتی موتور برای نخستین بار یک نشست را می‌بیند فراخوانی می‌شود (مثلاً وارد کردن تاریخچه). |
| `ingestBatch(params)`          | متد | دریافت یک نوبت کامل به‌صورت دسته‌ای. پس از کامل شدن یک اجرا، با همهٔ پیام‌های آن نوبت به‌صورت یک‌جا فراخوانی می‌شود. |
| `afterTurn(params)`            | متد | کار چرخهٔ عمر پس از اجرا (پایدار کردن وضعیت، فعال کردن Compaction پس‌زمینه).                                  |
| `prepareSubagentSpawn(params)` | متد | تنظیم وضعیت مشترک برای یک نشست فرزند پیش از شروع آن.                                                        |
| `onSubagentEnded(params)`      | متد | پاک‌سازی پس از پایان یک زیرعامل.                                                                              |
| `dispose()`                    | متد | آزاد کردن منابع. هنگام خاموش شدن Gateway یا بارگذاری مجدد Plugin فراخوانی می‌شود — نه برای هر نشست.          |

### ownsCompaction

`ownsCompaction` کنترل می‌کند که آیا Compaction خودکار داخلی Pi درون تلاش برای اجرا فعال بماند یا نه:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    موتور مالک رفتار Compaction است. OpenClaw، Compaction خودکار داخلی Pi را برای آن اجرا غیرفعال می‌کند، و پیاده‌سازی `compact()` موتور مسئول `/compact`، Compaction بازیابی سرریز، و هر Compaction پیش‌فعالی است که بخواهد در `afterTurn()` انجام دهد. OpenClaw ممکن است همچنان محافظ سرریز پیش از پرامپت را اجرا کند؛ وقتی پیش‌بینی کند کل رونویس سرریز می‌شود، مسیر بازیابی پیش از ارسال پرامپت دیگر، `compact()` موتور فعال را فراخوانی می‌کند.
  </Accordion>
  <Accordion title="ownsCompaction: false یا تنظیم‌نشده">
    Compaction خودکار داخلی Pi ممکن است همچنان هنگام اجرای پرامپت اجرا شود، اما متد `compact()` موتور فعال همچنان برای `/compact` و بازیابی سرریز فراخوانی می‌شود.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` به این معنا **نیست** که OpenClaw به‌صورت خودکار به مسیر Compaction موتور legacy برمی‌گردد.
</Warning>

این یعنی دو الگوی معتبر Plugin وجود دارد:

<Tabs>
  <Tab title="حالت مالک">
    الگوریتم Compaction خودتان را پیاده‌سازی کنید و `ownsCompaction: true` را تنظیم کنید.
  </Tab>
  <Tab title="حالت واگذاری">
    `ownsCompaction: false` را تنظیم کنید و کاری کنید `compact()` با فراخوانی `delegateCompactionToRuntime(...)` از `openclaw/plugin-sdk/core` از رفتار Compaction داخلی OpenClaw استفاده کند.
  </Tab>
</Tabs>

یک `compact()` بدون عملیات برای موتور غیرمالک فعال ناامن است، چون مسیر عادی Compaction برای `/compact` و بازیابی سرریز را برای آن اسلات موتور غیرفعال می‌کند.

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
این اسلات در زمان اجرا انحصاری است — برای یک اجرای مشخص یا عملیات Compaction فقط یک موتور زمینهٔ ثبت‌شده resolve می‌شود. Pluginهای فعال دیگر با `kind: "context-engine"` همچنان می‌توانند بارگذاری شوند و کد ثبت خود را اجرا کنند؛ `plugins.slots.contextEngine` فقط انتخاب می‌کند OpenClaw هنگام نیاز به موتور زمینه، کدام شناسهٔ موتور ثبت‌شده را resolve کند.
</Note>

<Note>
**حذف نصب Plugin:** وقتی Pluginی را که در حال حاضر به‌عنوان `plugins.slots.contextEngine` انتخاب شده حذف نصب می‌کنید، OpenClaw اسلات را به مقدار پیش‌فرض (`legacy`) بازنشانی می‌کند. همین رفتار بازنشانی برای `plugins.slots.memory` نیز اعمال می‌شود. نیازی به ویرایش دستی پیکربندی نیست.
</Note>

## رابطه با Compaction و حافظه

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction یکی از مسئولیت‌های موتور زمینه است. موتور موروثی به خلاصه‌سازی داخلی OpenClaw واگذار می‌کند. موتورهای Plugin می‌توانند هر راهبرد Compaction را پیاده‌سازی کنند (خلاصه‌های DAG، بازیابی برداری و غیره).
  </Accordion>
  <Accordion title="Pluginهای حافظه">
    Pluginهای حافظه (`plugins.slots.memory`) جدا از موتورهای زمینه هستند. Pluginهای حافظه جست‌وجو/بازیابی را فراهم می‌کنند؛ موتورهای زمینه کنترل می‌کنند مدل چه چیزی را ببیند. آن‌ها می‌توانند با هم کار کنند — یک موتور زمینه ممکن است هنگام مونتاژ از داده‌های Plugin حافظه استفاده کند. موتورهای Plugin که مسیر اعلان حافظه فعال را می‌خواهند باید `buildMemorySystemPromptAddition(...)` را از `openclaw/plugin-sdk/core` ترجیح دهند، که بخش‌های اعلان حافظه فعال را به یک `systemPromptAddition` آماده برای افزودن در ابتدا تبدیل می‌کند. اگر یک موتور به کنترل سطح پایین‌تری نیاز داشته باشد، همچنان می‌تواند خطوط خام را از `openclaw/plugin-sdk/memory-host-core` از طریق `buildActiveMemoryPromptSection(...)` دریافت کند.
  </Accordion>
  <Accordion title="هرس نشست">
    کوتاه‌کردن نتایج قدیمی ابزار در حافظه، صرف‌نظر از اینکه کدام موتور زمینه فعال است، همچنان اجرا می‌شود.
  </Accordion>
</AccordionGroup>

## نکات

- از `openclaw doctor` برای بررسی اینکه موتور شما درست بارگذاری می‌شود استفاده کنید.
- اگر موتور را عوض کنید، نشست‌های موجود با تاریخچه فعلی خود ادامه می‌دهند. موتور جدید برای اجراهای آینده کنترل را به دست می‌گیرد.
- خطاهای موتور ثبت می‌شوند و در عیب‌یابی‌ها نمایش داده می‌شوند. اگر یک موتور Plugin در ثبت شدن شکست بخورد یا شناسه موتور انتخاب‌شده قابل حل نباشد، OpenClaw به‌صورت خودکار بازگشت انجام نمی‌دهد؛ اجراها تا زمانی که Plugin را اصلاح کنید یا `plugins.slots.contextEngine` را دوباره به `"legacy"` تغییر دهید شکست می‌خورند.
- برای توسعه، از `openclaw plugins install -l ./my-engine` برای پیوند دادن یک دایرکتوری Plugin محلی بدون کپی کردن استفاده کنید.

## مرتبط

- [Compaction](/fa/concepts/compaction) — خلاصه‌سازی گفت‌وگوهای طولانی
- [زمینه](/fa/concepts/context) — زمینه چگونه برای نوبت‌های عامل ساخته می‌شود
- [معماری Plugin](/fa/plugins/architecture) — ثبت Pluginهای موتور زمینه
- [مانیفست Plugin](/fa/plugins/manifest) — فیلدهای مانیفست Plugin
- [Pluginها](/fa/tools/plugin) — نمای کلی Plugin
