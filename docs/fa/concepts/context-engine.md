---
read_when:
    - می‌خواهید بدانید OpenClaw چگونه زمینهٔ مدل را مونتاژ می‌کند
    - شما در حال جابه‌جایی بین موتور قدیمی و یک موتور Plugin هستید
    - شما در حال ساخت یک Plugin موتور زمینه هستید
sidebarTitle: Context engine
summary: 'موتور زمینه: گردآوری قابل‌اتصال زمینه، Compaction، و چرخهٔ عمر زیرعامل'
title: موتور زمینه
x-i18n:
    generated_at: "2026-06-27T17:31:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 124b6daf52f3d58f756352e2e169697541a8b6e67aecaa5a219bed15bda801cd
    source_path: concepts/context-engine.md
    workflow: 16
---

یک **موتور زمینه** کنترل می‌کند OpenClaw چگونه زمینهٔ مدل را برای هر اجرا می‌سازد: کدام پیام‌ها را شامل کند، تاریخچهٔ قدیمی‌تر را چگونه خلاصه کند، و زمینه را در مرزهای زیرعامل چگونه مدیریت کند.

OpenClaw با یک موتور داخلی `legacy` عرضه می‌شود و به‌صورت پیش‌فرض از آن استفاده می‌کند - بیشتر کاربران هرگز نیازی به تغییر این مورد ندارند. فقط زمانی یک موتور Plugin را نصب و انتخاب کنید که رفتار متفاوتی برای مونتاژ، Compaction، یا یادآوری بین‌نشستی می‌خواهید.

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

    پس از نصب و پیکربندی، Gateway را دوباره راه‌اندازی کنید.

  </Step>
  <Step title="Switch back to legacy (optional)">
    `contextEngine` را روی `"legacy"` تنظیم کنید (یا کلید را کامل حذف کنید - `"legacy"` مقدار پیش‌فرض است).
  </Step>
</Steps>

## نحوهٔ کارکرد

هر بار که OpenClaw یک پرامپت مدل را اجرا می‌کند، موتور زمینه در چهار نقطهٔ چرخهٔ عمر مشارکت می‌کند:

<AccordionGroup>
  <Accordion title="1. Ingest">
    زمانی فراخوانی می‌شود که یک پیام جدید به نشست اضافه شود. موتور می‌تواند پیام را در انبار دادهٔ خودش ذخیره یا نمایه‌سازی کند.
  </Accordion>
  <Accordion title="2. Assemble">
    پیش از هر اجرای مدل فراخوانی می‌شود. موتور یک مجموعهٔ مرتب از پیام‌ها (و یک `systemPromptAddition` اختیاری) را برمی‌گرداند که در بودجهٔ توکن جا می‌شوند.
  </Accordion>
  <Accordion title="3. Compact">
    زمانی فراخوانی می‌شود که پنجرهٔ زمینه پر است، یا وقتی کاربر `/compact` را اجرا می‌کند. موتور تاریخچهٔ قدیمی‌تر را خلاصه می‌کند تا فضا آزاد شود.
  </Accordion>
  <Accordion title="4. After turn">
    پس از کامل شدن یک اجرا فراخوانی می‌شود. موتور می‌تواند وضعیت را ماندگار کند، Compaction پس‌زمینه را راه بیندازد، یا نمایه‌ها را به‌روزرسانی کند.
  </Accordion>
</AccordionGroup>

برای هارنس غیر ACP همراه Codex، OpenClaw همین چرخهٔ عمر را با نگاشت زمینهٔ مونتاژشده به دستورالعمل‌های توسعه‌دهندهٔ Codex و پرامپت نوبت جاری اعمال می‌کند. Codex همچنان مالک تاریخچهٔ رشتهٔ بومی و فشرده‌ساز بومی خودش است.

### چرخهٔ عمر زیرعامل (اختیاری)

OpenClaw دو هوک اختیاری چرخهٔ عمر زیرعامل را فراخوانی می‌کند:

<ParamField path="prepareSubagentSpawn" type="method">
  پیش از شروع اجرای فرزند، وضعیت زمینهٔ مشترک را آماده می‌کند. این هوک کلیدهای نشست والد/فرزند، `contextMode` (`isolated` یا `fork`)، شناسه‌ها/فایل‌های رونوشت در دسترس، و TTL اختیاری را دریافت می‌کند. اگر یک دستهٔ rollback برگرداند، OpenClaw زمانی آن را فراخوانی می‌کند که spawn پس از موفقیت آماده‌سازی شکست بخورد. spawnهای زیرعامل بومی که `lightContext` درخواست می‌کنند و به `contextMode="isolated"` حل می‌شوند، عمداً این هوک را رد می‌کنند تا فرزند از زمینهٔ راه‌اندازی سبک، بدون وضعیت پیش از spawn مدیریت‌شده توسط موتور زمینه، شروع کند.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  زمانی پاک‌سازی می‌کند که نشست زیرعامل کامل شود یا جاروب شود.
</ParamField>

### افزودن به پرامپت سیستم

متد `assemble` می‌تواند یک رشتهٔ `systemPromptAddition` برگرداند. OpenClaw این را به ابتدای پرامپت سیستم برای اجرا اضافه می‌کند. این به موتورها امکان می‌دهد بدون نیاز به فایل‌های ایستای workspace، راهنمایی پویای یادآوری، دستورالعمل‌های بازیابی، یا نکته‌های آگاه از زمینه تزریق کنند.

## موتور legacy

موتور داخلی `legacy` رفتار اصلی OpenClaw را حفظ می‌کند:

- **دریافت**: بدون عملیات (مدیر نشست، ماندگاری پیام را مستقیم مدیریت می‌کند).
- **مونتاژ**: عبوری (pipeline موجود sanitize → validate → limit در runtime مونتاژ زمینه را مدیریت می‌کند).
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

factory `ctx` شامل مقدارهای اختیاری `config`، `agentDir`، و `workspaceDir`
است تا Pluginها بتوانند پیش از اجرای نخستین هوک چرخهٔ عمر، وضعیت هر عامل یا هر workspace را مقداردهی اولیه کنند.

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
| `info`             | ویژگی    | شناسه، نام، نسخهٔ موتور، و اینکه آیا مالک Compaction است |
| `ingest(params)`   | متد      | ذخیرهٔ یک پیام واحد                                    |
| `assemble(params)` | متد      | ساخت زمینه برای اجرای مدل (`AssembleResult` برمی‌گرداند) |
| `compact(params)`  | متد      | خلاصه‌سازی/کاهش زمینه                                  |

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
  کنترل می‌کند runner برای پیش‌بررسی‌های سرریز پیشگیرانه از کدام برآورد توکن استفاده کند. مقدار پیش‌فرض `"assembled"` است، یعنی فقط برآورد پرامپت مونتاژشده بررسی می‌شود - مناسب برای موتورهایی که یک زمینهٔ پنجره‌ای و خودبسنده برمی‌گردانند. فقط زمانی روی `"preassembly_may_overflow"` تنظیم کنید که نمای مونتاژشدهٔ شما بتواند خطر سرریز را در رونوشت زیربنایی پنهان کند؛ در این حالت runner هنگام تصمیم‌گیری برای اینکه آیا باید پیشگیرانه Compact کند، بیشینهٔ برآورد مونتاژشده و برآورد تاریخچهٔ نشست پیش از مونتاژ (بدون پنجره‌سازی) را در نظر می‌گیرد. در هر حالت، پیام‌هایی که برمی‌گردانید همچنان همان چیزی هستند که مدل می‌بیند - `promptAuthority` فقط بر پیش‌بررسی اثر می‌گذارد.
</ParamField>

`compact` یک `CompactResult` برمی‌گرداند. وقتی Compaction رونوشت فعال را می‌چرخاند، `result.sessionId` و `result.sessionFile` نشست جانشینی را مشخص می‌کنند که تلاش مجدد یا نوبت بعدی باید از آن استفاده کند.

اعضای اختیاری:

| عضو                            | نوع | هدف                                                                                                             |
| ------------------------------ | --- | ---------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | متد | مقداردهی اولیهٔ وضعیت موتور برای یک نشست. زمانی یک بار فراخوانی می‌شود که موتور نخستین بار یک نشست را می‌بیند (مثلاً وارد کردن تاریخچه). |
| `ingestBatch(params)`          | متد | دریافت یک نوبت کامل‌شده به‌صورت دسته‌ای. پس از کامل شدن یک اجرا، با همهٔ پیام‌های آن نوبت به‌صورت یک‌جا فراخوانی می‌شود. |
| `afterTurn(params)`            | متد | کار چرخهٔ عمر پس از اجرا (ماندگار کردن وضعیت، راه‌اندازی Compaction پس‌زمینه). |
| `prepareSubagentSpawn(params)` | متد | آماده‌سازی وضعیت مشترک برای نشست فرزند پیش از شروع آن. |
| `onSubagentEnded(params)`      | متد | پاک‌سازی پس از پایان یک زیرعامل. |
| `dispose()`                    | متد | آزادسازی منابع. هنگام خاموش شدن Gateway یا بارگذاری مجدد Plugin فراخوانی می‌شود - نه برای هر نشست. |

### تنظیمات runtime

هوک‌های چرخهٔ عمر که داخل OpenClaw اجرا می‌شوند یک شیء اختیاری
`runtimeSettings` دریافت می‌کنند. این یک سطح API داخلی producer/consumer، نسخه‌دار و فقط‌خواندنی است: OpenClaw آن را برای موتور زمینهٔ انتخاب‌شده تولید می‌کند، و موتور زمینه آن را داخل هوک‌های چرخهٔ عمر مصرف می‌کند. این شیء مستقیم به کاربران نمایش داده نمی‌شود و سطح گزارش‌دهی اختصاصی ایجاد نمی‌کند.

- `schemaVersion`: در حال حاضر `1`
- `runtime`: میزبان OpenClaw، حالت runtime (`normal`، `fallback`، یا
  `degraded`)، و شناسه‌های اختیاری هارنس/runtime
- `contextEngineSelection`: شناسهٔ موتور زمینهٔ انتخاب‌شده و منبع انتخاب
- `executionHost`: شناسه و برچسب میزبان برای سطحی که هوک را فراخوانی می‌کند
- `model`: مدل درخواست‌شده، مدل resolveشده، provider، و خانوادهٔ اختیاری مدل
- `limits`: بودجهٔ توکن پرامپت و حداکثر توکن‌های خروجی وقتی شناخته شده باشند
- `diagnostics`: کدهای بستهٔ دلیل fallback و degraded وقتی شناخته شده باشند

فیلدهایی که می‌توانند ناشناخته باشند به‌صورت `null` نمایش داده می‌شوند؛ فیلدهای discriminator مانند حالت runtime و منبع انتخاب non-nullable می‌مانند. موتورهای قدیمی‌تر سازگار می‌مانند: اگر یک موتور legacy سخت‌گیر `runtimeSettings` را به‌عنوان ویژگی ناشناخته رد کند، OpenClaw به‌جای قرنطینه کردن موتور، فراخوانی چرخهٔ عمر را بدون آن دوباره امتحان می‌کند.

### نیازمندی‌های میزبان

موتورهای زمینه می‌توانند نیازمندی‌های قابلیت میزبان را روی `info.hostRequirements` اعلام کنند.
OpenClaw پیش از شروع عملیات این نیازمندی‌ها را بررسی می‌کند و وقتی runtime انتخاب‌شده نتواند آن‌ها را برآورده کند، با یک خطای توصیفی به‌صورت بسته شکست می‌خورد.

برای اجراهای عامل، زمانی `assemble-before-prompt` را اعلام کنید که موتور باید از طریق `assemble()` پرامپت واقعی مدل را کنترل کند:

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

اجراهای عامل بومی Codex و عامل تعبیه‌شدهٔ OpenClaw، `assemble-before-prompt` را برآورده می‌کنند.
backendهای عمومی CLI این کار را نمی‌کنند، بنابراین موتورهایی که به آن نیاز دارند پیش از شروع فرایند CLI رد می‌شوند.

### جداسازی شکست

OpenClaw موتور Plugin انتخاب‌شده را از مسیر پاسخ اصلی جدا می‌کند. اگر یک موتور غیر legacy وجود نداشته باشد، اعتبارسنجی قرارداد را رد کند، هنگام ساخت factory خطا بدهد، یا از یک متد چرخهٔ عمر خطا پرتاب کند، OpenClaw آن موتور را برای فرایند Gateway جاری قرنطینه می‌کند و کار موتور زمینه را به موتور داخلی `legacy` تنزل می‌دهد. خطا همراه با عملیات شکست‌خورده ثبت می‌شود تا operator بتواند Plugin را تعمیر، به‌روزرسانی، یا غیرفعال کند، بدون اینکه عامل بی‌صدا شود.

خرابی‌های مربوط به الزامات میزبان متفاوت‌اند: وقتی یک موتور اعلام می‌کند که یک زمان اجرا
فاقد یک قابلیت لازم است، OpenClaw پیش از شروع اجرا به‌صورت بسته شکست می‌خورد. این
از موتورهایی محافظت می‌کند که اگر در میزبانی پشتیبانی‌نشده اجرا شوند، وضعیت را خراب می‌کنند.

### ownsCompaction

`ownsCompaction` کنترل می‌کند که آیا auto-compaction داخلیِ درون‌تلاشِ زمان اجرای OpenClaw برای اجرا فعال بماند یا نه:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    موتور مالک رفتار Compaction است. OpenClaw، auto-compaction داخلی زمان اجرای OpenClaw را برای آن اجرا غیرفعال می‌کند، و پیاده‌سازی `compact()` موتور مسئول `/compact`، Compaction بازیابی سرریز، و هر Compaction پیشگیرانه‌ای است که بخواهد در `afterTurn()` انجام دهد. OpenClaw همچنان ممکن است محافظ سرریز پیش از prompt را اجرا کند؛ وقتی پیش‌بینی کند کل رونوشت سرریز می‌شود، مسیر بازیابی پیش از ارسال prompt دیگر، `compact()` موتور فعال را فراخوانی می‌کند.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    auto-compaction داخلی زمان اجرای OpenClaw ممکن است همچنان هنگام اجرای prompt اجرا شود، اما متد `compact()` موتور فعال همچنان برای `/compact` و بازیابی سرریز فراخوانی می‌شود.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` به این معنا **نیست** که OpenClaw به‌طور خودکار به مسیر Compaction موتور legacy برمی‌گردد.
</Warning>

این یعنی دو الگوی معتبر برای Plugin وجود دارد:

<Tabs>
  <Tab title="Owning mode">
    الگوریتم Compaction خودتان را پیاده‌سازی کنید و `ownsCompaction: true` را تنظیم کنید.
  </Tab>
  <Tab title="Delegating mode">
    `ownsCompaction: false` را تنظیم کنید و کاری کنید `compact()` برای استفاده از رفتار Compaction داخلی OpenClaw، `delegateCompactionToRuntime(...)` را از `openclaw/plugin-sdk/core` فراخوانی کند.
  </Tab>
</Tabs>

یک `compact()` بدون عملیات برای یک موتور فعالِ غیرمالک ناامن است، چون مسیر عادی Compaction برای `/compact` و بازیابی سرریز را برای آن جایگاه موتور غیرفعال می‌کند.

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
این جایگاه در زمان اجرا انحصاری است - برای یک اجرای مشخص یا عملیات Compaction فقط یک موتور زمینه ثبت‌شده resolve می‌شود. سایر Pluginهای فعال با `kind: "context-engine"` همچنان می‌توانند بارگذاری شوند و کد ثبت خود را اجرا کنند؛ `plugins.slots.contextEngine` فقط تعیین می‌کند وقتی OpenClaw به یک موتور زمینه نیاز دارد، کدام شناسه موتور ثبت‌شده را resolve کند.
</Note>

<Note>
**حذف نصب Plugin:** وقتی Pluginای را حذف نصب می‌کنید که در حال حاضر به‌عنوان `plugins.slots.contextEngine` انتخاب شده است، OpenClaw جایگاه را به مقدار پیش‌فرض (`legacy`) بازنشانی می‌کند. همین رفتار بازنشانی برای `plugins.slots.memory` هم اعمال می‌شود. نیازی به ویرایش دستی پیکربندی نیست.
</Note>

## رابطه با Compaction و حافظه

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction یکی از مسئولیت‌های موتور زمینه است. موتور legacy به خلاصه‌سازی داخلی OpenClaw واگذار می‌کند. موتورهای Plugin می‌توانند هر راهبرد Compaction را پیاده‌سازی کنند (خلاصه‌های DAG، بازیابی برداری و غیره).
  </Accordion>
  <Accordion title="Memory plugins">
    Pluginهای حافظه (`plugins.slots.memory`) از موتورهای زمینه جدا هستند. Pluginهای حافظه جست‌وجو/بازیابی فراهم می‌کنند؛ موتورهای زمینه کنترل می‌کنند مدل چه چیزی را ببیند. آن‌ها می‌توانند با هم کار کنند - یک موتور زمینه ممکن است هنگام مونتاژ از داده‌های Plugin حافظه استفاده کند. موتورهای Plugin که مسیر prompt حافظه فعال را می‌خواهند، بهتر است از `buildMemorySystemPromptAddition(...)` از `openclaw/plugin-sdk/core` استفاده کنند، که بخش‌های prompt حافظه فعال را به یک `systemPromptAddition` آماده برای افزودن در ابتدا تبدیل می‌کند. اگر یک موتور به کنترل سطح پایین‌تر نیاز داشته باشد، همچنان می‌تواند خطوط خام را از `openclaw/plugin-sdk/memory-host-core` از طریق `buildActiveMemoryPromptSection(...)` بگیرد.
  </Accordion>
  <Accordion title="Session pruning">
    کوتاه‌سازی نتایج قدیمی ابزار در حافظه، فارغ از اینکه کدام موتور زمینه فعال است، همچنان اجرا می‌شود.
  </Accordion>
</AccordionGroup>

## نکته‌ها

- از `openclaw doctor` استفاده کنید تا تأیید کنید موتور شما درست بارگذاری می‌شود.
- اگر موتور را عوض می‌کنید، نشست‌های موجود با تاریخچه فعلی خود ادامه می‌دهند. موتور جدید اجرای نوبت‌های آینده را بر عهده می‌گیرد.
- خطاهای موتور ثبت می‌شوند و موتور Plugin انتخاب‌شده برای فرایند Gateway فعلی قرنطینه می‌شود. OpenClaw برای نوبت‌های کاربر به `legacy` برمی‌گردد تا پاسخ‌ها بتوانند ادامه پیدا کنند، اما همچنان باید Plugin خراب را تعمیر، به‌روزرسانی، غیرفعال، یا حذف نصب کنید.
- برای توسعه، از `openclaw plugins install -l ./my-engine` استفاده کنید تا یک پوشه Plugin محلی را بدون کپی کردن لینک کنید.

## مرتبط

- [Compaction](/fa/concepts/compaction) - خلاصه‌سازی گفت‌وگوهای طولانی
- [زمینه](/fa/concepts/context) - زمینه چگونه برای نوبت‌های عامل ساخته می‌شود
- [معماری Plugin](/fa/plugins/architecture) - ثبت Pluginهای موتور زمینه
- [مانیفست Plugin](/fa/plugins/manifest) - فیلدهای مانیفست Plugin
- [Plugins](/fa/tools/plugin) - نمای کلی Plugin
