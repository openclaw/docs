---
read_when:
    - می‌خواهید عامل‌های OpenClaw از یک فهرست بزرگ ابزارها استفاده کنند، بدون اینکه هر طرح‌وارهٔ ابزار را به پرامپت اضافه کنید
    - می‌خواهید ابزارهای OpenClaw، ابزارهای MCP، و ابزارهای کلاینت از طریق یک سطح runtime فشرده واحد در دسترس باشند
    - در حال پیاده‌سازی یا اشکال‌زدایی کشف ابزار برای اجراهای OpenClaw هستید
summary: 'جست‌وجوی ابزار: فهرست‌های بزرگ ابزار OpenClaw را پشت جست‌وجو، توصیف و فراخوانی فشرده کنید'
title: جستجوی ابزار
x-i18n:
    generated_at: "2026-06-27T19:06:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23b46264bab307bbfdfeb1e358c566d498f3bcf77f187ba05d2ae319e115e1f4
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search یک قابلیت آزمایشی در runtime عامل OpenClaw است. این قابلیت یک روش
فشرده برای کشف و فراخوانی کاتالوگ‌های بزرگ ابزار به عامل‌ها می‌دهد. وقتی اجرا
ابزارهای در دسترس زیادی دارد اما مدل احتمالاً فقط به چند مورد از آن‌ها نیاز دارد،
مفید است.

این صفحه Tool Search در OpenClaw را مستند می‌کند. این همان سطح جست‌وجوی ابزار
یا dynamic-tools بومی Codex نیست. حالت کد بومی Codex، جست‌وجوی ابزار، ابزارهای
dynamic معوق، و فراخوانی‌های ابزار تودرتو، سطح‌های پایدار harness در Codex هستند
و به `tools.toolSearch` وابسته نیستند.

وقتی برای اجراهای OpenClaw فعال شود، مدل به‌صورت پیش‌فرض یک ابزار
`tool_search_code` دریافت می‌کند. آن ابزار یک بدنه کوتاه JavaScript را در یک
زیرفرایند جداشده Node با یک پل `openclaw.tools` اجرا می‌کند:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

کاتالوگ می‌تواند شامل ابزارهای OpenClaw، ابزارهای Plugin، ابزارهای MCP، و
ابزارهای ارائه‌شده توسط کلاینت باشد. مدل همه schemaهای کامل را از ابتدا نمی‌بیند.
در عوض، descriptorهای فشرده را جست‌وجو می‌کند، وقتی به schema دقیق نیاز دارد یک
ابزار انتخاب‌شده را describe می‌کند، و آن ابزار را از طریق OpenClaw فراخوانی
می‌کند.

اجراهای harness در Codex این کنترل‌های آزمایشی Tool Search در OpenClaw را دریافت
نمی‌کنند. OpenClaw قابلیت‌های محصول را به‌عنوان ابزارهای dynamic به Codex می‌دهد،
و Codex مالک حالت کد بومی پایدار، جست‌وجوی ابزار بومی، ابزارهای dynamic معوق، و
فراخوانی‌های ابزار تودرتو است.

## یک turn چگونه اجرا می‌شود

در زمان برنامه‌ریزی، runner توکار OpenClaw کاتالوگ مؤثر برای اجرا را می‌سازد:

1. policy فعال ابزار را برای عامل، profile، sandbox، و session resolve می‌کند.
2. ابزارهای واجد شرایط OpenClaw و Plugin را فهرست می‌کند.
3. ابزارهای واجد شرایط MCP را از طریق runtime مربوط به session MCP فهرست می‌کند.
4. ابزارهای واجد شرایط ارائه‌شده توسط کلاینت برای اجرای فعلی را اضافه می‌کند.
5. descriptorهای فشرده را برای جست‌وجو index می‌کند.
6. پل کد OpenClaw، ابزارهای fallback ساختاریافته، یا سطح directory فشرده را به
   مدل expose می‌کند.

در زمان اجرا، هر فراخوانی ابزار واقعی به OpenClaw برمی‌گردد. runtime جداشده
Node پیاده‌سازی‌های Plugin، شیءهای کلاینت MCP، یا secretها را نگه نمی‌دارد.
`openclaw.tools.call(...)` از پل عبور می‌کند و به Gateway برمی‌گردد، جایی که
policy، approval، hook، logging، و مدیریت result معمول همچنان اعمال می‌شوند.

## حالت‌ها

`tools.toolSearch` سه حالت روبه‌روی مدل دارد:

- `code`: `tool_search_code` را expose می‌کند، یعنی پل فشرده JavaScript پیش‌فرض.
- `tools`: `tool_search`، `tool_describe`، و `tool_call` را به‌عنوان ابزارهای
  ساختاریافته ساده برای providerهایی expose می‌کند که نباید کد دریافت کنند.
- `directory`: `tool_search`، `tool_describe`، و `tool_call` را به‌همراه یک
  directory محدود در prompt از نام‌ها و توضیحات ابزارهای در دسترس برای providerهایی
  expose می‌کند که باید نام ابزارها را بدون همه schemaهای کامل ببینند. OpenClaw
  همچنین می‌تواند یک مجموعه کوچک و محدود از schemaهای ابزارهای محتمل یا الزامی
  را مستقیماً برای turn فعلی expose کند.

همه حالت‌ها از همان کاتالوگ فیلترشده با policy و مسیر اجرای معمول OpenClaw
استفاده می‌کنند. اگر runtime فعلی نتواند زیرفرایند child جداشده Node برای حالت
کد را راه‌اندازی کند، حالت پیش‌فرض `code` پیش از compaction کاتالوگ به `tools`
fallback می‌کند. در حالت `directory`، ابزارهای ارائه‌شده توسط کلاینت برای اجرای
فعلی مستقیماً قابل مشاهده می‌مانند، در حالی که ابزارهای OpenClaw، ابزارهای
Plugin، و ابزارهای MCP می‌توانند پشت کاتالوگ directory فشرده شوند. فراخوانی
مستقیم به نام دقیق directory پنهان، پیش از اجرا از همان کاتالوگ مجاز hydrate
می‌شود.

همه حالت‌ها آزمایشی هستند. برای کاتالوگ‌های کوچک ابزار OpenClaw، expose مستقیم
ابزار را ترجیح دهید، و برای اجراهای harness در Codex از سطح‌های پایدار بومی
Codex استفاده کنید.

هیچ config جداگانه‌ای برای انتخاب source وجود ندارد. وقتی Tool Search فعال باشد،
کاتالوگ پس از فیلتر policy معمول، ابزارهای واجد شرایط OpenClaw، MCP، و کلاینت را
شامل می‌شود.

## چرا این وجود دارد

کاتالوگ‌های بزرگ مفید اما پرهزینه هستند. ارسال هر schema ابزار به مدل، request
را بزرگ‌تر می‌کند، برنامه‌ریزی را کند می‌کند، و انتخاب تصادفی ابزار را افزایش
می‌دهد.

Tool Search شکل کار را تغییر می‌دهد:

- ابزارهای مستقیم: مدل پیش از اولین token همه schemaهای انتخاب‌شده را می‌بیند
- حالت کد Tool Search: مدل یک ابزار کد فشرده و یک قرارداد API کوتاه را می‌بیند
- حالت ابزارهای Tool Search: مدل سه ابزار fallback ساختاریافته فشرده را می‌بیند
- حالت directory در Tool Search: مدل یک directory محدود به‌همراه کنترل‌های
  search/describe/call و یک مجموعه کوچک و محدود از schemaهای محتمل یا الزامی را
  می‌بیند
- در طول turn: مدل می‌تواند schemaهای باقی‌مانده را در صورت نیاز load کند

expose مستقیم ابزار همچنان پیش‌فرض درست برای کاتالوگ‌های کوچک است. Tool Search
وقتی بهترین است که یک اجرا بتواند ابزارهای زیادی را ببیند، به‌ویژه از سرورهای
MCP یا ابزارهای app ارائه‌شده توسط کلاینت.

## API

`openclaw.tools.search(query, options?)`

کاتالوگ مؤثر اجرای فعلی را جست‌وجو می‌کند. نتیجه‌ها فشرده و برای برگرداندن به
context در prompt امن هستند.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

metadata کامل یک نتیجه جست‌وجو، از جمله schema دقیق ورودی، را load می‌کند.

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

یک ابزار انتخاب‌شده را از طریق OpenClaw فراخوانی می‌کند.

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planning",
  start: "2026-05-09T14:00:00Z",
});
```

حالت fallback ساختاریافته همان عملیات را به‌عنوان ابزار expose می‌کند:

- `tool_search`
- `tool_describe`
- `tool_call`

حالت directory این موارد را expose می‌کند:

- `tool_search`
- `tool_describe`
- `tool_call`

همچنین ابزارهای ارائه‌شده توسط کلاینت را مستقیماً قابل مشاهده نگه می‌دارد و
ممکن است یک مجموعه کوچک و محدود از schemaهای ابزارهای کاتالوگِ محتمل یا الزامی
را مستقیماً برای turn فعلی expose کند. اگر directory محدود entryهایی را حذف
کند، از `tool_search` برای یافتن آن‌ها استفاده کنید. اگر مدل نام دقیق یک ابزار
پنهان در directory را مستقیماً درخواست کند، OpenClaw آن را پیش از اجرای معمول از
کاتالوگ مجاز hydrate می‌کند.
نام ابزارهای کلاینت در حالت directory نباید با نام ابزارهای OpenClaw، Plugin، یا
MCP تداخل داشته باشد، زیرا dispatch معوق دقیق از همین نام‌ها استفاده می‌کند.

## مرز runtime

پل کد در یک زیرفرایند کوتاه‌عمر Node اجرا می‌شود. زیرفرایند با permission mode
فعال Node، محیط خالی، بدون مجوز filesystem یا network، و بدون مجوز child-process
یا worker شروع می‌شود. OpenClaw یک timeout wall-clock در فرایند parent اعمال
می‌کند و زیرفرایند را در timeout، حتی پس از continuationهای async، می‌کشد.

runtime فقط این موارد را expose می‌کند:

- `console.log`، `console.warn`، و `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

رفتار معمول OpenClaw همچنان برای فراخوانی‌های نهایی اعمال می‌شود:

- policyهای allow و deny ابزار
- محدودیت‌های ابزار به‌ازای هر عامل و هر sandbox
- policy ابزار channel/runtime
- hookهای approval
- hookهای `before_tool_call` در Plugin
- identity، logها، و telemetry مربوط به session

## Config

Tool Search را برای اجراهای OpenClaw با پل کد پیش‌فرض فعال کنید:

```bash
openclaw config set tools.toolSearch true
```

JSON معادل:

```json5
{
  tools: {
    toolSearch: true,
  },
}
```

برای اجراهای OpenClaw به‌جای آن از ابزارهای fallback ساختاریافته استفاده کنید:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

برای اجراهای OpenClaw به‌جای آن از سطح directory فشرده استفاده کنید:

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

timeout حالت کد و محدودیت‌های نتیجه جست‌وجو را تنظیم کنید:

```json5
{
  tools: {
    toolSearch: {
      mode: "code",
      codeTimeoutMs: 10000,
      searchDefaultLimit: 8,
      maxSearchLimit: 20,
    },
  },
}
```

آن را غیرفعال کنید:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt و telemetry

Tool Search به‌اندازه کافی telemetry ثبت می‌کند تا بتوان آن را با expose مستقیم
ابزار مقایسه کرد:

- مجموع byteهای serialized ابزار و prompt که به harness ارسال شده‌اند
- اندازه کاتالوگ و تفکیک source
- تعداد search، describe، و call
- فراخوانی‌های نهایی ابزار که از طریق OpenClaw اجرا شده‌اند
- idها و sourceهای ابزار انتخاب‌شده

logهای session باید امکان پاسخ به این موارد را فراهم کنند:

- مدل در ابتدا چند schema ابزار را دید
- چند عملیات search و describe انجام داد
- کدام ابزار نهایی فراخوانی شد
- آیا نتیجه از OpenClaw، MCP، یا یک ابزار کلاینت آمده است

## اعتبارسنجی E2E

runner مربوط به Gateway E2E هر دو مسیر را با runtime در OpenClaw اثبات می‌کند:

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

این runner یک Plugin جعلی موقت با یک کاتالوگ بزرگ ابزار می‌سازد، provider
mock‌شده OpenAI را شروع می‌کند، یک Gateway را یک‌بار در حالت مستقیم و یک‌بار با
Tool Search فعال شروع می‌کند، سپس payloadهای request مربوط به provider و logهای
session را مقایسه می‌کند.

regression این موارد را اثبات می‌کند:

1. حالت مستقیم می‌تواند ابزار Plugin جعلی را فراخوانی کند.
2. Tool Search می‌تواند همان ابزار Plugin جعلی را فراخوانی کند.
3. حالت مستقیم schemaهای ابزار Plugin جعلی را مستقیماً به provider expose می‌کند.
4. Tool Search فقط پل فشرده را expose می‌کند.
5. payload درخواست Tool Search برای کاتالوگ بزرگ جعلی کوچک‌تر است.
6. logهای session تعداد مورد انتظار tool-call و telemetry فراخوانی پل‌شده را نشان می‌دهند.

## رفتار failure

Tool Search باید fail closed کند:

- اگر ابزاری در policy مؤثر نباشد، search نباید آن را برگرداند
- اگر یک ابزار انتخاب‌شده unavailable شود، `tool_call` باید fail شود
- اگر policy یا approval اجرا را block کند، نتیجه فراخوانی باید به‌جای دور زدن آن،
  همان block را گزارش کند
- اگر پل کد نتواند یک runtime جداشده بسازد، برای آن deployment از `mode: "tools"`
  استفاده کنید یا Tool Search را غیرفعال کنید

## مرتبط

- [ابزارها و Pluginها](/fa/tools)
- [sandbox و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools)
- [ابزار Exec](/fa/tools/exec)
- [راه‌اندازی عامل‌های ACP](/fa/tools/acp-agents-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
