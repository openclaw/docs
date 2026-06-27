---
read_when:
    - می‌خواهید حالت کد OpenClaw را برای اجرای عامل فعال کنید
    - باید توضیح دهید که چرا حالت کد با حالت Codex Code متفاوت است
    - در حال بازبینی قرارداد exec/wait، سندباکس QuickJS-WASI، تبدیل TypeScript، یا پل پنهان کاتالوگ ابزار هستید
    - شما در حال افزودن یا بازبینی یک یکپارچه‌سازی داخلی رجیستری فضای نام حالت کد هستید
sidebarTitle: Code mode
summary: 'حالت کد OpenClaw: یک سطح ابزار exec/wait اختیاری مبتنی بر QuickJS-WASI و یک کاتالوگ ابزار پنهان با دامنه اجرا'
title: حالت کد
x-i18n:
    generated_at: "2026-06-27T18:47:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 859d56eb09e21c9277961ac5178c1458ce669de114e8cc3f2c8d4b104f428a74
    source_path: reference/code-mode.md
    workflow: 16
---

حالت کد یک قابلیت آزمایشی زمان‌اجرای عامل OpenClaw است. این قابلیت به‌صورت
پیش‌فرض غیرفعال است. وقتی آن را فعال می‌کنید، OpenClaw آنچه مدل برای یک اجرا
می‌بیند را تغییر می‌دهد: به‌جای نمایش مستقیم همه شِمای ابزارهای فعال، مدل فقط
`exec` و `wait` را می‌بیند.

این صفحه حالت کد OpenClaw را مستند می‌کند. این حالت، حالت کد Codex نیست. این دو
قابلیت نام مشترکی دارند، اما توسط زمان‌اجراهای متفاوتی پیاده‌سازی شده‌اند و
قراردادهای متفاوتی برای `exec` ارائه می‌کنند:

- Codex Code Mode برای رشته‌های app-server در Codex فعال است، مگر اینکه سیاست
  محدودکننده ابزار، حالت کد بومی را غیرفعال کند. این قابلیت در چارچوب کدنویسی Codex
  اجرا می‌شود، جایی که مدل فرمان‌های شل را از طریق قرارداد `exec.command`
  می‌نویسد.
- حالت کد OpenClaw غیرفعال است، مگر اینکه `tools.codeMode.enabled: true` پیکربندی
  شده باشد. این قابلیت در زمان‌اجرای عمومی عامل OpenClaw اجرا می‌شود، جایی که مدل
  برنامه‌های JavaScript یا TypeScript را از طریق قرارداد `exec.code` می‌نویسد.

Codex Code Mode و جست‌وجوی پویای ابزار بومی Codex سطوح پایدار چارچوب Codex هستند.
حالت کد OpenClaw یک آداپتور آزمایشی سطح ابزار متعلق به OpenClaw برای اجراهای
عمومی OpenClaw است. این قابلیت از `quickjs-wasi`، یک کاتالوگ ابزار پنهان OpenClaw،
و اجراکننده معمول ابزار OpenClaw استفاده می‌کند.

## این چیست؟

حالت کد OpenClaw به مدل اجازه می‌دهد به‌جای انتخاب مستقیم از یک فهرست بلند ابزارها،
یک برنامه کوچک JavaScript یا TypeScript بنویسد.

وقتی حالت کد فعال است:

- فهرست ابزارهای قابل مشاهده برای مدل دقیقاً `exec` و `wait` است.
- `exec` کد JavaScript یا TypeScript تولیدشده توسط مدل را در یک worker محدودشده
  QuickJS-WASI ارزیابی می‌کند.
- ابزارهای معمول OpenClaw از پرامپت مدل پنهان می‌شوند و درون برنامه مهمان از طریق
  `ALL_TOOLS` و `tools` در دسترس قرار می‌گیرند.
- کد مهمان می‌تواند کاتالوگ پنهان را جست‌وجو کند، یک ابزار را توصیف کند، و از طریق
  همان مسیر اجرای OpenClaw که در نوبت‌های معمول عامل استفاده می‌شود، یک ابزار را
  فراخوانی کند.
- ابزارهای MCP زیر فضای نام `MCP` گروه‌بندی می‌شوند. در حالت کد، این فضای نام
  تنها راه پشتیبانی‌شده برای فراخوانی ابزارهای MCP است.
- `wait` وقتی فراخوانی‌های تودرتوی ابزار هنوز در انتظار هستند، اجرای حالت کد
  تعلیق‌شده را از سر می‌گیرد.

تمایز مهم: حالت کد سطح ارکستراسیون روبه‌مدل را تغییر می‌دهد. این قابلیت جایگزین
ابزارهای OpenClaw، ابزارهای Plugin، ابزارهای MCP، احراز هویت، سیاست تأیید، رفتار
کانال، یا انتخاب مدل نمی‌شود.

## چرا این خوب است؟

حالت کد استفاده از کاتالوگ‌های بزرگ ابزار را برای مدل‌ها آسان‌تر می‌کند.

- سطح پرامپت کوچک‌تر: ارائه‌دهندگان به‌جای ده‌ها یا صدها شِمای کامل ابزار، دو
  ابزار کنترلی دریافت می‌کنند.
- ارکستراسیون بهتر: مدل می‌تواند حلقه‌ها، joinها، تبدیل‌های کوچک، منطق شرطی، و
  فراخوانی‌های تودرتوی موازی ابزار را درون یک سلول کد استفاده کند.
- بی‌طرف نسبت به ارائه‌دهنده: برای ابزارهای OpenClaw، Plugin، MCP، و کلاینت کار
  می‌کند، بدون اینکه به اجرای کد بومی ارائه‌دهنده وابسته باشد.
- سیاست موجود همچنان اعمال می‌شود: فراخوانی‌های تودرتوی ابزار همچنان از سیاست،
  تأییدها، hookها، زمینه نشست، و مسیرهای حسابرسی OpenClaw عبور می‌کنند.
- حالت شکست روشن: وقتی حالت کد به‌صراحت فعال شده و زمان‌اجرا در دسترس نیست،
  OpenClaw به‌صورت بسته شکست می‌خورد، نه اینکه به نمایش مستقیم و گسترده ابزارها
  عقب‌گرد کند.

حالت کد به‌ویژه برای عامل‌هایی با کاتالوگ ابزار فعال بزرگ یا برای گردش‌کارهایی
مفید است که مدل بارها باید پیش از تولید پاسخ، ابزارها را جست‌وجو، ترکیب، و
فراخوانی کند.

## روش فعال‌سازی

`tools.codeMode.enabled: true` را به پیکربندی عامل یا زمان‌اجرا اضافه کنید:

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

شکل کوتاه نیز پذیرفته می‌شود:

```json5
{
  tools: {
    codeMode: true,
  },
}
```

وقتی `tools.codeMode` حذف شده باشد، `false` باشد، یا یک شیء بدون `enabled: true`
باشد، حالت کد خاموش می‌ماند.

وقتی از عامل‌های sandbox شده با سرورهای MCP پیکربندی‌شده استفاده می‌کنید، همچنین
مطمئن شوید سیاست ابزار sandbox به Plugin بسته‌بندی‌شده MCP اجازه می‌دهد، برای
مثال با `tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`. ببینید
[پیکربندی - ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy).

وقتی مرزهای سخت‌گیرانه‌تری می‌خواهید، از محدودیت‌های صریح استفاده کنید:

```json5
{
  tools: {
    codeMode: {
      enabled: true,
      timeoutMs: 10000,
      memoryLimitBytes: 67108864,
      maxOutputBytes: 65536,
      maxSnapshotBytes: 10485760,
      maxPendingToolCalls: 16,
      snapshotTtlSeconds: 900,
      searchDefaultLimit: 8,
      maxSearchLimit: 50,
    },
  },
}
```

برای تأیید شکل payload مدل هنگام اشکال‌زدایی، Gateway را با گزارش‌گیری هدفمند
اجرا کنید:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

با فعال بودن حالت کد، نام ابزارهای روبه‌مدل ثبت‌شده باید `exec` و `wait` باشند.
اگر به payload پالایش‌شده ارائه‌دهنده نیاز دارید، برای یک نشست کوتاه اشکال‌زدایی
`OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` را اضافه کنید.

## مرور فنی

بقیه این صفحه قرارداد زمان‌اجرا و جزئیات پیاده‌سازی را توضیح می‌دهد. این بخش برای
نگه‌دارندگان، نویسندگان Plugin که در حال اشکال‌زدایی نمایش ابزار هستند، و
اپراتورهایی که استقرارهای پرریسک را اعتبارسنجی می‌کنند در نظر گرفته شده است.

## وضعیت زمان‌اجرا

- زمان‌اجرا: [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi).
- وضعیت پیش‌فرض: غیرفعال.
- پایداری: سطح آزمایشی OpenClaw؛ Codex Code mode یک سطح پایدار جداگانه در چارچوب
  Codex است.
- سطح هدف: اجراهای عمومی عامل OpenClaw.
- موضع امنیتی: کد مدل خصمانه است.
- وعده روبه‌کاربر: فعال‌سازی حالت کد هرگز بی‌سروصدا به نمایش مستقیم و گسترده
  ابزارها عقب‌گرد نمی‌کند.

## دامنه

حالت کد مالک شکل ارکستراسیون روبه‌مدل برای یک اجرای آماده‌شده است. این قابلیت
مالک انتخاب مدل، رفتار کانال، احراز هویت، سیاست ابزار، یا پیاده‌سازی ابزارها
نیست.

در دامنه:

- تعریف ابزارهای قابل مشاهده برای مدل، یعنی `exec` و `wait`
- ساخت کاتالوگ ابزار پنهان
- اجرای مهمان JavaScript و TypeScript
- زمان‌اجرای worker در QuickJS-WASI
- callbackهای میزبان برای جست‌وجوی کاتالوگ، توصیف شِما، و فراخوانی ابزار
- وضعیت قابل ازسرگیری برای برنامه‌های مهمان تعلیق‌شده
- محدودیت‌های خروجی، timeout، حافظه، فراخوانی‌های در انتظار، و snapshot
- telemetry و projection مسیر برای فراخوانی‌های تودرتوی ابزار

خارج از دامنه:

- اجرای کد راه‌دور بومی ارائه‌دهنده
- معناشناسی اجرای شل
- تغییر مجوزدهی ابزارهای موجود
- اسکریپت‌های پایدار نوشته‌شده توسط کاربر
- دسترسی به package manager، فایل، شبکه، یا ماژول در کد مهمان
- استفاده مجدد مستقیم از internals حالت کد Codex

ابزارهای متعلق به ارائه‌دهنده مانند sandboxهای راه‌دور Python به‌عنوان ابزارهای
جداگانه باقی می‌مانند. ببینید
[اجرای کد](/fa/tools/code-execution).

## اصطلاحات

**حالت کد** حالت زمان‌اجرای OpenClaw است که ابزارهای معمول مدل را پنهان می‌کند و
فقط `exec` و `wait` را نمایش می‌دهد.

**زمان‌اجرای مهمان** ماشین مجازی JavaScript در QuickJS-WASI است که کد مدل را
ارزیابی می‌کند.

**پل میزبان** سطح callback باریک و سازگار با JSON از کد مهمان به OpenClaw است.

**کاتالوگ** فهرست محدود به اجرا از ابزارهای مؤثر پس از سیاست معمول ابزار، Plugin،
MCP، و تفکیک ابزار کلاینت است.

**فراخوانی تودرتوی ابزار** فراخوانی ابزاری است که از کد مهمان و از طریق پل میزبان
انجام می‌شود.

**Snapshot** وضعیت سریال‌سازی‌شده ماشین مجازی QuickJS-WASI است که ذخیره می‌شود تا
`wait` بتواند یک اجرای حالت کد تعلیق‌شده را ادامه دهد.

## پیکربندی

`tools.codeMode.enabled` دروازه فعال‌سازی است. تنظیم دیگر فیلدهای حالت کد این
قابلیت را فعال نمی‌کند.

فیلدهای پشتیبانی‌شده:

- `enabled`: boolean. پیش‌فرض `false`. حالت کد را فقط وقتی `true` باشد فعال
  می‌کند.
- `runtime`: `"quickjs-wasi"`. تنها زمان‌اجرای پشتیبانی‌شده.
- `mode`: `"only"`. `exec` و `wait` را نمایش می‌دهد و ابزارهای معمول مدل را پنهان
  می‌کند.
- `languages`: آرایه‌ای از `"javascript"` و `"typescript"`. پیش‌فرض شامل هر دو
  است.
- `timeoutMs`: سقف زمان wall-clock برای یک `exec` یا `wait`. پیش‌فرض `10000`.
  clamp زمان‌اجرا: `100` تا `60000`.
- `memoryLimitBytes`: سقف heap در QuickJS. پیش‌فرض `67108864`. clamp زمان‌اجرا:
  `1048576` تا `1073741824`.
- `maxOutputBytes`: سقف متن، JSON، و logهای بازگردانده‌شده. پیش‌فرض `65536`.
  clamp زمان‌اجرا: `1024` تا `10485760`.
- `maxSnapshotBytes`: سقف snapshotهای سریال‌سازی‌شده VM. پیش‌فرض `10485760`.
  clamp زمان‌اجرا: `1024` تا `268435456`.
- `maxPendingToolCalls`: سقف فراخوانی‌های تودرتوی هم‌زمان ابزار. پیش‌فرض `16`.
  clamp زمان‌اجرا: `1` تا `128`.
- `snapshotTtlSeconds`: مدت زمانی که یک VM تعلیق‌شده می‌تواند از سر گرفته شود.
  پیش‌فرض `900`. clamp زمان‌اجرا: `1` تا `86400`.
- `searchDefaultLimit`: تعداد پیش‌فرض نتایج جست‌وجوی کاتالوگ پنهان. پیش‌فرض `8`.
  زمان‌اجرا این مقدار را به `maxSearchLimit` محدود می‌کند.
- `maxSearchLimit`: حداکثر تعداد نتایج جست‌وجوی کاتالوگ پنهان. پیش‌فرض `50`.
  clamp زمان‌اجرا: `1` تا `50`.

اگر حالت کد فعال باشد اما QuickJS-WASI نتواند بارگذاری شود، OpenClaw برای آن اجرا
به‌صورت بسته شکست می‌خورد. این قابلیت ابزارهای معمول را بی‌سروصدا به‌عنوان
fallback نمایش نمی‌دهد.

## فعال‌سازی

حالت کد پس از مشخص شدن سیاست مؤثر ابزار و پیش از سرهم‌بندی درخواست نهایی مدل
ارزیابی می‌شود.

ترتیب فعال‌سازی:

1. عامل، مدل، ارائه‌دهنده، sandbox، کانال، فرستنده، و سیاست اجرا را تفکیک کنید.
2. فهرست مؤثر ابزارهای OpenClaw را بسازید.
3. ابزارهای واجد شرایط Plugin، MCP، و کلاینت را اضافه کنید.
4. سیاست allow و deny را اعمال کنید.
5. اگر `tools.codeMode.enabled` برابر false است، با نمایش معمول ابزار ادامه دهید.
6. اگر فعال است و ابزارها برای اجرا فعال هستند، ابزارهای مؤثر را در کاتالوگ حالت
   کد ثبت کنید.
7. همه ابزارهای معمول را از فهرست ابزارهای قابل مشاهده برای مدل حذف کنید.
8. `exec` و `wait` حالت کد را اضافه کنید.

اجراهایی که عمداً هیچ ابزاری ندارند، مانند فراخوانی‌های خام مدل، `disableTools`،
یا allowlist خالی، حتی اگر پیکربندی شامل `tools.codeMode.enabled: true` باشد، سطح
حالت کد را فعال نمی‌کنند.

کاتالوگ حالت کد محدود به اجرا است. این کاتالوگ نباید ابزارها را از عامل، نشست،
فرستنده، یا اجرای دیگری نشت دهد.

## ابزارهای قابل مشاهده برای مدل

وقتی حالت کد فعال است، مدل دقیقاً این ابزارهای سطح بالا را می‌بیند:

- `exec`
- `wait`

همه ابزارهای فعال دیگر از فهرست ابزارهای روبه‌مدل پنهان می‌شوند و در کاتالوگ حالت
کد ثبت می‌شوند.

مدل باید از `exec` برای ارکستراسیون ابزار، join کردن داده، حلقه‌ها، فراخوانی‌های
تودرتوی موازی، و تبدیل‌های ساخت‌یافته استفاده کند. مدل باید فقط وقتی `exec` یک
نتیجه قابل ازسرگیری `waiting` برمی‌گرداند از `wait` استفاده کند.

## `exec`

`exec` یک سلول حالت کد را شروع می‌کند و یک نتیجه بازمی‌گرداند. کد ورودی توسط مدل
تولید می‌شود و باید خصمانه تلقی شود.

ورودی:

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

قواعد ورودی:

- یکی از `code` یا `command` باید غیرخالی باشد.
- `code` فیلد مستندشده روبه‌مدل است.
- `command` به‌عنوان یک alias سازگار با exec برای سیاست‌های hook و بازنویسی‌های
  قابل اعتماد پذیرفته می‌شود؛ وقتی هر دو حاضر باشند، مقدارها باید برابر باشند.
- رویدادهای hook بیرونی `exec` در حالت کد شامل `toolKind: "code_mode_exec"` هستند
  و وقتی زبان ورودی شناخته‌شده باشد شامل `toolInputKind: "javascript" | "typescript"`
  می‌شوند، تا سیاست‌ها بتوانند سلول‌های حالت کد را از فراخوانی‌های سبک شل `exec`
  که نام ابزار مشترکی دارند متمایز کنند.
- `language` به‌صورت پیش‌فرض `"javascript"` است.
- اگر `language` برابر `"typescript"` باشد، OpenClaw پیش از ارزیابی transpile
  می‌کند.
- `exec` در v1 الگوهای `import`، `require`، dynamic import، و module-loader را رد
  می‌کند.
- `exec` پیاده‌سازی معمول `exec` شل را به‌صورت بازگشتی نمایش نمی‌دهد.

نتیجه:

```typescript
type CodeModeResult = CodeModeCompletedResult | CodeModeWaitingResult | CodeModeFailedResult;

type CodeModeCompletedResult = {
  status: "completed";
  value: unknown;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeWaitingResult = {
  status: "waiting";
  runId: string;
  reason: "pending_tools" | "yield";
  pendingToolCalls?: CodeModePendingToolCall[];
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeFailedResult = {
  status: "failed";
  error: string;
  code?: CodeModeErrorCode;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};
```

`exec` وقتی QuickJS VM با وضعیت قابل ازسرگیری تعلیق شود که هنوز به ادامه قابل
مشاهده برای مدل نیاز دارد، `waiting` برمی‌گرداند. نتیجه شامل یک `runId` برای
`wait` است. فراخوانی‌های پل فضای نام، از جمله فراخوانی‌های فضای نام MCP، در همان
فراخوانی `exec`/`wait` تا زمانی که آماده باشند به‌صورت خودکار تخلیه می‌شوند، تا
یک بلوک کد فشرده بتواند `$api()` را بررسی کند و بدون اجبار به یک فراخوانی ابزار
مدل برای هر namespace await، یک ابزار MCP را فراخوانی کند.

`exec` فقط زمانی `completed` برمی‌گرداند که ماشین مجازی مهمان هیچ کار در انتظاری نداشته باشد و مقدار نهایی پس از اجرای adapter خروجی OpenClaw با JSON سازگار باشد.

## `wait`

`wait` یک ماشین مجازی code-mode معلق‌شده را ادامه می‌دهد.

ورودی:

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

خروجی همان union از نوع `CodeModeResult` است که توسط `exec` برگردانده می‌شود.

`wait` وجود دارد چون ابزارهای تودرتوی OpenClaw می‌توانند کند، تعاملی، وابسته به تأیید، یا دارای به‌روزرسانی‌های جزئیِ جریانی باشند. مدل نباید لازم داشته باشد یک فراخوانی طولانی `exec` را باز نگه دارد تا میزبان منتظر کار خارجی بماند.

snapshot و restore در QuickJS-WASI سازوکار resume در v1 است:

1. `exec` کد را تا تکمیل، شکست، یا تعلیق ارزیابی می‌کند.
2. هنگام تعلیق، OpenClaw از ماشین مجازی QuickJS snapshot می‌گیرد و کارهای میزبانِ در انتظار را ثبت می‌کند.
3. وقتی کارهای در انتظار به نتیجه می‌رسند، `wait` snapshot ماشین مجازی را restore می‌کند.
4. OpenClaw callbackهای میزبان را با نام‌های پایدار دوباره ثبت می‌کند.
5. OpenClaw نتایج ابزارهای تودرتو را به ماشین مجازی restoreشده تحویل می‌دهد.
6. OpenClaw کارهای در انتظار QuickJS را تخلیه می‌کند.
7. `wait` نتیجه `completed`، `failed`، یا یک نتیجه `waiting` دیگر را برمی‌گرداند.

Snapshotها وضعیت runtime هستند، نه artifactهای کاربر. اندازه‌محدود، منقضی‌شونده، و محدود به همان run و session هستند که آن‌ها را ایجاد کرده‌اند.

`wait` زمانی شکست می‌خورد که:

- `runId` ناشناخته باشد.
- snapshot منقضی شده باشد.
- run یا session والد abort شده باشد.
- فراخواننده در همان محدوده run/session نباشد.
- restore در QuickJS-WASI شکست بخورد.
- restore از حدود پیکربندی‌شده فراتر برود.

## API زمان اجرای مهمان

زمان اجرای مهمان یک API سراسری کوچک را در دسترس می‌گذارد:

```typescript
declare const ALL_TOOLS: ToolCatalogEntry[];
declare const tools: ToolCatalog;
declare const MCP: Record<string, unknown>;
declare const namespaces: Record<string, unknown>;

declare function text(value: unknown): void;
declare function json(value: unknown): void;
declare function yield_control(reason?: string): Promise<void>;
```

`ALL_TOOLS` فراداده فشرده برای catalog محدود به run است. به‌طور پیش‌فرض schemaهای کامل را شامل نمی‌شود.

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "plugin" | "mcp" | "client";
  sourceName?: string;
};
```

Schema کامل فقط در صورت نیاز بارگذاری می‌شود:

```typescript
type ToolCatalogEntryWithSchema = ToolCatalogEntry & {
  parameters: unknown;
};
```

کمک‌کننده‌های catalog:

```typescript
type ToolCatalog = {
  search(query: string, options?: { limit?: number }): Promise<ToolCatalogEntry[]>;
  describe(id: string): Promise<ToolCatalogEntryWithSchema>;
  call(id: string, input?: unknown): Promise<unknown>;
  [safeToolName: string]: unknown;
};
```

تابع‌های ابزار کمکی فقط برای نام‌های امن و بدون ابهام نصب می‌شوند:

```typescript
const files = await tools.search("read local file");
const fileRead = await tools.describe(files[0].id);
const content = await tools.call(fileRead.id, { path: "README.md" });

// If the hidden catalog has an unambiguous `web_search` entry:
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

ورودی‌های catalog مربوط به MCP در code mode از طریق `tools.call(...)` یا تابع‌های کمکی قابل فراخوانی نیستند. آن‌ها فقط از طریق فضای نام تولیدشده `MCP` در دسترس هستند. فایل‌های declaration به سبک TypeScript از طریق سطح فایل مجازیِ فقط‌خواندنی `API` در دسترس‌اند، بنابراین agentها می‌توانند امضاهای MCP را بدون افزودن schemaهای MCP به prompt بررسی کنند:

```typescript
const files = await API.list("mcp");
const githubApi = await API.read("mcp/github.d.ts");

const issue = await MCP.github.createIssue({
  owner: "openclaw",
  repo: "openclaw",
  title: "Investigate gateway logs",
});

const snapshot = await MCP.chromeDevtools.takeSnapshot({ output: "markdown" });
const resource = await MCP.docs.resources.read({ uri: "memo://one" });
const prompt = await MCP.docs.prompts.get({
  name: "brief",
  arguments: { topic: "release" },
});
```

`API.read("mcp/<server>.d.ts")` declarationهای فشرده‌ای را برمی‌گرداند که از فراداده ابزار MCP استنتاج شده‌اند:

```typescript
type McpToolResult = {
  content?: unknown[];
  structuredContent?: unknown;
  isError?: boolean;
  [key: string]: unknown;
};

declare namespace MCP.github {
  /** Return this TypeScript-style API header. */
  function $api(toolName?: string, options?: { schema?: boolean }): Promise<McpApiHeader>;

  /**
   * Create a GitHub issue.
   * @param owner Repository owner
   * @param repo Repository name
   * @param title Issue title
   */
  function createIssue(input: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
  }): Promise<McpToolResult>;
}
```

فایل‌های declaration مجازی‌اند، نه فایل‌هایی که زیر workspace یا دایرکتوری state نوشته شده باشند. برای هر فراخوانی code-mode `exec`، OpenClaw catalog ابزار محدود به run را می‌سازد، ورودی‌های MCP قابل مشاهده را نگه می‌دارد، `mcp/index.d.ts` به‌علاوه یک declaration از نوع `mcp/<server>.d.ts` برای هر server قابل مشاهده render می‌کند، و آن جدول کوچک فقط‌خواندنی را به worker مربوط به QuickJS تزریق می‌کند. کد مهمان فقط شیء `API` را می‌بیند: `API.list(prefix?)` فراداده فایل را برمی‌گرداند و `API.read(path)` محتوای declaration انتخاب‌شده را برمی‌گرداند. مسیرهای ناشناخته و بخش‌های `.` / `..` رد می‌شوند.

این کار schemaهای بزرگ MCP را از prompt مدل بیرون نگه می‌دارد. agent از توضیح ابزار `exec` می‌آموزد که API مجازی وجود دارد، فقط فایل declaration لازم را می‌خواند، و سپس `MCP.<server>.<tool>()` را با یک آرگومان object فراخوانی می‌کند. وقتی agent داخل برنامه به پاسخ schema برای یک ابزار واحد نیاز دارد، `MCP.<server>.$api()` همچنان به‌عنوان fallback درون‌خطی در دسترس می‌ماند.

زمان اجرای مهمان نباید اشیای میزبان را مستقیماً expose کند. ورودی‌ها و خروجی‌ها به‌صورت مقادیر سازگار با JSON و با سقف اندازه صریح از bridge عبور می‌کنند.

## فضاهای نام داخلی

فضاهای نام داخلی به code mode یک API دامنه‌ای مختصر می‌دهند، بدون اینکه ابزارهای بیشتری در معرض مدل قرار گیرد. یک integration تحت مالکیت loader می‌تواند فضای نامی مانند `Issues`، `Fictions`، یا `Calendar` را ثبت کند؛ سپس کد مهمان آن فضای نام را داخل برنامه QuickJS فراخوانی می‌کند، درحالی‌که OpenClaw همچنان فقط `exec` و `wait` را به مدل نشان می‌دهد.

فضاهای نام فعلاً داخلی هستند. API عمومی فضای نام در SDK مربوط به Plugin وجود ندارد: فضاهای نام Pluginهای خارجی به یک contract تحت مالکیت loader نیاز دارند تا هویت Plugin، manifestهای نصب‌شده، وضعیت auth، و descriptorهای catalog کش‌شده از ابزارهای Plugin پشتوانه فضای نام منحرف نشوند. code mode هسته فقط sandbox، serialization، gating مربوط به catalog، و dispatch مربوط به bridge را مالک است.

کد مهمان سپس می‌تواند از global مستقیم یا map مربوط به `namespaces` استفاده کند:

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### چرخه عمر رجیستری

رجیستری فضای نام process-local است و با namespace id کلید می‌خورد. یک run معمولی این مسیر را دنبال می‌کند:

1. یک loader مورد اعتماد `registerCodeModeNamespaceForPlugin(pluginId, registration)` را فراخوانی می‌کند.
2. code mode برای run، `ToolSearchRuntime` پنهان را ایجاد می‌کند و catalog محدود به run آن را می‌خواند.
3. `createCodeModeNamespaceRuntime(ctx, catalog)` فقط registrationهایی را نگه می‌دارد که همه `requiredToolNames` آن‌ها قابل مشاهده و متعلق به همان `pluginId` باشند.
4. هر فضای نام قابل مشاهده برای run فعلی `createScope(ctx)` را فراخوانی می‌کند. scope زمینه run مانند `agentId`، `sessionKey`، `sessionId`، `runId`، config، و وضعیت abort را دریافت می‌کند.
5. داده‌های scope به یک descriptor ساده serialize می‌شوند و به‌صورت globalهای مستقیم و `namespaces.<globalName>` به QuickJS تزریق می‌شوند.
6. فراخوانی‌های مهمان از طریق bridge مربوط به worker معلق می‌شوند، مسیر فضای نام را روی میزبان resolve می‌کنند، فراخوانی را به یک ابزار catalog اعلام‌شده و تحت مالکیت Plugin نگاشت می‌کنند، و آن ابزار را از طریق `ToolSearchRuntime.call` اجرا می‌کنند.
7. OpenClaw فراخوانی‌های آماده bridge فضای نام را داخل فراخوانی ابزار فعال `exec`/`wait` به‌طور خودکار تخلیه می‌کند. اگر کار فضای نام هنگام timeout هنوز در انتظار باشد یا مهمان صریحاً yield کند، `wait` همان runtime فضای نام را بعداً resume می‌کند.
8. rollback یا uninstall شدن Plugin، `clearCodeModeNamespacesForPlugin(pluginId)` را فراخوانی می‌کند تا globalهای کهنه پس از load ناموفق Plugin باقی نمانند.

Invariant مهم: فراخوانی‌های فضای نام، فراخوانی ابزارهای catalog هستند. آن‌ها از همان hookهای policy، approvalها، مدیریت abort، telemetry، projection transcript، و رفتار suspend/resume مانند `tools.call(...)` استفاده می‌کنند.

### شکل ثبت

فضاهای نام را از integrationای ثبت کنید که ابزارهای پشتوانه را مالک است. scope را کوچک نگه دارید و فقط verbهای دامنه‌ای را expose کنید که به ابزارهای catalog اعلام‌شده نگاشت می‌شوند.

```typescript
import {
  createCodeModeNamespaceTool,
  registerCodeModeNamespaceForPlugin,
} from "../agents/code-mode-namespaces.js";

const pluginId = "github";

registerCodeModeNamespaceForPlugin(pluginId, {
  id: "github-issues",
  globalName: "Issues",
  description: "GitHub issue helpers for the current repository.",
  requiredToolNames: ["github_list_issues", "github_update_issue"],
  prompt: "Use Issues.list(params) and Issues.update(number, patch).",
  createScope: (ctx) => ({
    repository: ctx.config,
    list: createCodeModeNamespaceTool("github_list_issues", ([params]) => params ?? {}),
    update: createCodeModeNamespaceTool("github_update_issue", ([number, patch]) => ({
      number,
      patch,
    })),
  }),
});
```

`createCodeModeNamespaceTool(toolName, inputMapper)` یک عضو scope را به‌عنوان تابع فضای نام قابل فراخوانی علامت‌گذاری می‌کند. `inputMapper` اختیاری آرگومان‌های مهمان را دریافت می‌کند و object ورودی برای ابزار catalog پشتوانه را برمی‌گرداند. بدون input mapper، اولین آرگومان مهمان استفاده می‌شود، یا در صورت حذف‌شدن، `{}`.

تابع‌های خام میزبان پیش از اجرای کد مهمان رد می‌شوند:

```typescript
createScope: () => ({
  // Wrong: this bypasses the catalog tool lifecycle and will be rejected.
  list: async () => githubClient.listIssues(),
});
```

### مالکیت و نمایانی

مالکیت فضای نام به `pluginId` فراخواننده registration وابسته است. `requiredToolNames` هم gate نمایانی است و هم بررسی مالکیت:

- هر ابزار required باید در catalog مربوط به run وجود داشته باشد
- هر ابزار required باید `sourceName === pluginId` داشته باشد
- وقتی هر ابزار required غایب باشد یا مالک آن Plugin دیگری باشد، فضای نام پنهان می‌شود
- هر مسیر قابل فراخوانی فقط می‌تواند ابزاری را هدف بگیرد که در `requiredToolNames` نام‌گذاری شده است

این مانع می‌شود Plugin دیگری با ثبت ابزاری هم‌نام، یک فضای نام را expose کند. همچنین فضاهای نام را با policy معمول agent هم‌راستا نگه می‌دارد: اگر run نتواند ابزارهای پشتوانه را ببیند، نمی‌تواند فضای نام را ببیند.

برای مثال، یک فضای نام GitHub باید پشت extension تحت مالکیت GitHub باشد که مالک auth گیت‌هاب، clientهای REST یا GraphQL، rate limitها، approvalهای نوشتن، و testها است. code mode هسته نباید APIهای خاص GitHub، مدیریت token، یا policy provider را embed کند.

### قواعد serialization مربوط به scope

`createScope(ctx)` می‌تواند یک object ساده شامل مقادیر سازگار با JSON، arrayها، objectهای تودرتو، و markerهای فراخوانی `createCodeModeNamespaceTool(...)` برگرداند. اشیای میزبان هرگز مستقیماً وارد QuickJS نمی‌شوند.

serializer این موارد را رد می‌کند:

- تابع‌های خام
- graphهای object حلقوی
- بخش‌های مسیر ناامن: `__proto__`، `constructor`، `prototype`، کلیدهای خالی، یا کلیدهایی که جداکننده مسیر داخلی را شامل می‌شوند
- مقدارهای `globalName` که identifier جاوااسکریپت نیستند
- تداخل‌های `globalName` با globalهای داخلی code-mode مانند `tools`، `namespaces`، `text`، `json`، `yield_control`، یا `__openclaw*`

مقادیر غیرقابل serialization به JSON، پیش از عبور از bridge به مقادیر fallback امن برای JSON تبدیل می‌شوند. داده binary، handleها، socketها، clientها، و instanceهای class باید پشت ابزارهای catalog معمولی باقی بمانند.

### Promptها

`description` فضای نام و `prompt` اختیاری فقط زمانی به schema مربوط به `exec` که برای مدل قابل مشاهده است افزوده می‌شوند که فضای نام برای آن run قابل مشاهده باشد. از آن‌ها برای آموزش کوچک‌ترین سطح مفید استفاده کنید:

```typescript
{
  description: "Fiction production service helpers.",
  prompt:
    "Use Fictions.riskAudit(), Fictions.promoteIfReady(id, status), and Fictions.unpaidOver(amount).",
}
```

Promptها را درباره contract فضای نام نگه دارید، نه setup احراز هویت، تاریخچه پیاده‌سازی، یا رفتار نامرتبط Plugin.

### پاک‌سازی

فضاهای نام، ثبت‌های محلیِ فرایند هستند. وقتی Plugin مالک
غیرفعال، حذف نصب، یا بازگردانی شد، آن‌ها را حذف کنید:

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

پاک‌سازی حالت کد بر عهده Plugin است؛ وقتی چرخه عمر آن پایان می‌یابد،
ثبت‌های فضای نام Plugin را پاک کنید، به‌جای آن‌که برای هر فضای نام دسته‌های
پاک‌سازی جداگانه نگه دارید. آزمون‌ها می‌توانند برای جلوگیری از نشت ثبت‌ها
بین موردها، `clearCodeModeNamespacesForTest()` را فراخوانی کنند.

### چک‌لیست آزمون

تغییرات فضای نام باید مرز امنیتی و رفتار مهمان را پوشش دهند:

- متن prompt فضای نام فقط وقتی ظاهر شود که ابزارهای پشتیبان قابل مشاهده باشند
- ابزارهای هم‌نام از یک `sourceName` دیگر، فضای نام را افشا نکنند
- تابع‌های خام scope رد شوند
- شناسه‌های فضای نام جعلی و مسیرهای جعلی رد شوند
- مسیرهای قابل فراخوانی نتوانند ابزارهای اعلان‌نشده را هدف بگیرند
- اشیای تو در تو و ارجاع‌های مشترک به‌درستی serialize شوند
- فراخوانی‌های فضای نام از طریق ابزارهای catalog اجرا شوند و جزئیات امن برای JSON برگردانند
- خرابی‌ها بتوانند توسط کد مهمان catch شوند
- فراخوانی‌های فضای نام تعلیق‌شده از طریق `wait` از سر گرفته شوند
- rollback کردن Plugin ثبت‌های فضای نام مالک را پاک کند

فضاهای نام، catalog عمومی `tools.search` / `tools.call` را تکمیل می‌کنند. از
catalog برای ابزارهای دلخواه فعال‌شده OpenClaw، Plugin، و client استفاده کنید؛
از `MCP` برای ابزارهای MCP استفاده کنید؛ از فضاهای نام دیگر برای APIهای
دامنه‌ای مستند و متعلق به Plugin استفاده کنید، جایی که کد مختصر از جست‌وجوی
تکراری schema قابل‌اعتمادتر است.

## API خروجی

`text(value)` خروجی خوانا برای انسان را به آرایه `output` اضافه می‌کند.

`json(value)` پس از serialization سازگار با JSON، یک مورد خروجی ساختاریافته
اضافه می‌کند.

مقدار نهایی برگشتی کد مهمان، در نتیجه `completed` به `value` تبدیل می‌شود.

مورد خروجی:

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

قواعد خروجی:

- ترتیب خروجی با فراخوانی‌های مهمان مطابقت دارد
- خروجی با `maxOutputBytes` محدود می‌شود
- مقدارهای غیرقابل serialize به رشته‌های ساده یا خطاها تبدیل می‌شوند
- مقدارهای binary در v1 پشتیبانی نمی‌شوند
- تصویرها و فایل‌ها از طریق ابزارهای عادی OpenClaw منتقل می‌شوند، نه از طریق
  پل حالت کد

## catalog ابزار

catalog پنهان، ابزارها را پس از فیلتر کردن policy مؤثر شامل می‌شود:

1. ابزارهای هسته OpenClaw.
2. ابزارهای Plugin همراه.
3. ابزارهای Plugin خارجی.
4. ابزارهای MCP.
5. ابزارهای ارائه‌شده توسط client برای اجرای فعلی.

شناسه‌های catalog درون یک اجرا پایدار هستند و در صورت امکان، میان مجموعه
ابزارهای معادل deterministic می‌مانند.

شکل پیشنهادی شناسه:

```text
<source>:<owner>:<tool-name>
```

نمونه‌ها:

```text
openclaw:core:message
plugin:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

catalog ابزارهای کنترلی حالت کد را حذف می‌کند:

- `exec`
- `wait`
- `tool_search_code`
- `tool_search`
- `tool_describe`
- `tool_call`

این کار از recursion جلوگیری می‌کند و قرارداد روبه‌روی مدل را محدود نگه می‌دارد.

ورودی‌های MCP در catalog محدود به run باقی می‌مانند تا policy، تأییدها، hookها،
telemetry، projection متن transcript، و شناسه‌های دقیق ابزار با اجرای عادی ابزار
مشترک بمانند. نماهای روبه‌روی مهمان `ALL_TOOLS`، `tools.search(...)`،
`tools.describe(...)`، و `tools.call(...)` ورودی‌های MCP را حذف می‌کنند. فضای نام
تولیدشده `MCP.<server>.<tool>({ ...input })` دوباره به همان شناسه دقیق catalog
resolve می‌شود و سپس از همان مسیر executor dispatch می‌شود.

## تعامل جست‌وجوی ابزار

حالت کد در اجراهایی که فعال است، سطح مدل جست‌وجوی ابزار OpenClaw را supersede می‌کند.

وقتی `tools.codeMode.enabled` برابر true است و حالت کد فعال می‌شود:

- OpenClaw ابزارهای `tool_search_code`، `tool_search`، `tool_describe`،
  یا `tool_call` را به‌عنوان ابزارهای قابل مشاهده برای مدل افشا نمی‌کند.
- همان ایده cataloging به runtime مهمان منتقل می‌شود.
- runtime مهمان metadata فشرده `ALL_TOOLS` و helperهای search، describe،
  و call را برای ابزارهای غیر MCP دریافت می‌کند.
- فراخوانی‌های MCP به‌جای `tools.call(...)` از فضای نام تولیدشده `MCP` و
  headerهای `$api()` آن استفاده می‌کنند.
- فراخوانی‌های تو در تو از همان مسیر executor در OpenClaw dispatch می‌شوند
  که جست‌وجوی ابزار استفاده می‌کند.

صفحه موجود [جست‌وجوی ابزار](/fa/tools/tool-search) پل catalog فشرده OpenClaw را
توصیف می‌کند. حالت کد جایگزین عمومی OpenClaw برای اجراهایی است که می‌توانند
از `exec` و `wait` استفاده کنند.

## نام ابزارها و برخوردها

ابزار قابل مشاهده برای مدل `exec`، ابزار حالت کد است. اگر ابزار shell عادی
OpenClaw به نام `exec` فعال باشد، از مدل پنهان می‌شود و مانند هر ابزار دیگری
در catalog قرار می‌گیرد.

درون runtime مهمان:

- `tools.call("openclaw:core:exec", input)` می‌تواند ابزار shell exec را در صورت
  اجازه policy فراخوانی کند.
- `tools.exec(...)` فقط زمانی نصب می‌شود که ورودی catalog مربوط به shell exec
  یک نام امن و بدون ابهام داشته باشد.
- ابزار حالت کد `exec` هرگز به‌صورت recursive از طریق `tools` در دسترس نیست.

اگر دو ابزار به یک نام راحت و امن normalize شوند، OpenClaw تابع راحتی را حذف
می‌کند و `tools.call(id, input)` را الزامی می‌کند.

## اجرای ابزار تو در تو

هر فراخوانی ابزار تو در تو از پل میزبان عبور می‌کند و دوباره وارد OpenClaw می‌شود.

اجرای تو در تو موارد زیر را حفظ می‌کند:

- شناسه agent فعال
- شناسه session و کلید session
- زمینه sender و channel
- policy sandbox
- policy تأیید
- hookهای Plugin به نام `before_tool_call`
- signal لغو
- به‌روزرسانی‌های streaming در صورت دسترسی
- رویدادهای trajectory و audit

فراخوانی‌های تو در تو در transcript به‌عنوان فراخوانی‌های واقعی ابزار projection
می‌شوند تا بسته‌های پشتیبانی بتوانند آنچه رخ داده است را نشان دهند. این
projection، فراخوانی ابزار حالت کد والد و شناسه ابزار تو در تو را مشخص می‌کند.

فراخوانی‌های تو در توی موازی تا `maxPendingToolCalls` مجاز هستند.

## وضعیت runtime

هر اجرای حالت کد یک state machine دارد:

- `running`: VM در حال اجرا است یا فراخوانی‌های تو در تو در جریان هستند.
- `waiting`: snapshot مربوط به VM وجود دارد و می‌تواند با `wait` از سر گرفته شود.
- `completed`: مقدار نهایی برگشته است؛ snapshot حذف شده است.
- `failed`: خطا برگشته است؛ snapshot حذف شده است.
- `expired`: snapshot یا وضعیت pending از retention عبور کرده است؛ از سرگیری ممکن نیست.
- `aborted`: اجرای والد/session لغو شده است؛ snapshot حذف شده است.

وضعیت بر اساس اجرای agent، session، و شناسه فراخوانی ابزار scope می‌شود. یک
فراخوانی `wait` از اجرا یا session دیگر شکست می‌خورد.

ذخیره‌سازی snapshot محدود است:

- حداکثر بایت snapshot برای هر اجرا
- حداکثر snapshotهای زنده برای هر فرایند
- TTL مربوط به snapshot
- پاک‌سازی در پایان اجرا
- پاک‌سازی هنگام خاموش شدن Gateway، جایی که persistence پشتیبانی نمی‌شود

## runtime QuickJS-WASI

OpenClaw، `quickjs-wasi` را به‌عنوان dependency مستقیم در package مالک بارگذاری
می‌کند. runtime به نسخه transitive نصب‌شده برای proxy، PAC، یا dependencyهای
نامرتبط دیگر متکی نیست.

مسئولیت‌های runtime:

- compile یا load کردن ماژول WebAssembly مربوط به QuickJS-WASI
- ایجاد یک VM ایزوله برای هر اجرا یا ازسرگیری حالت کد
- ثبت callbackهای میزبان با نام‌های پایدار
- تنظیم محدودیت‌های memory و interrupt
- ارزیابی JavaScript
- drain کردن jobهای pending
- snapshot گرفتن از وضعیت VM تعلیق‌شده
- restore کردن snapshotها برای `wait`
- dispose کردن handleهای VM و snapshotها پس از وضعیت‌های terminal

runtime بیرون از event loop اصلی OpenClaw در یک worker اجرا می‌شود. یک حلقه
بی‌نهایت مهمان نباید فرایند Gateway را برای مدت نامحدود مسدود کند.

## TypeScript

پشتیبانی TypeScript فقط یک transform منبع است:

- ورودی پذیرفته‌شده: یک رشته کد TypeScript
- خروجی: رشته JavaScript که توسط QuickJS-WASI ارزیابی می‌شود
- بدون typechecking
- بدون module resolution
- بدون `import` یا `require` در v1
- diagnostics به‌عنوان نتیجه‌های `failed` برگردانده می‌شوند

compiler مربوط به TypeScript فقط برای cellهای TypeScript به‌صورت lazy بارگذاری
می‌شود. cellهای JavaScript ساده و حالت کد غیرفعال، compiler را بارگذاری نمی‌کنند.

transform باید در صورت امکان شماره خط‌های مفید را حفظ کند.

## مرز امنیتی

کد مدل hostile است. runtime از دفاع چندلایه استفاده می‌کند:

- اجرای QuickJS-WASI بیرون از event loop اصلی
- بارگذاری `quickjs-wasi` به‌عنوان dependency مستقیم، نه از طریق Codex یا یک
  package transitive
- بدون filesystem، network، subprocess، module import، environment variable،
  یا objectهای global میزبان در مهمان
- استفاده از محدودیت‌های memory و interrupt در QuickJS
- اعمال timeout wall-clock در فرایند والد
- اعمال سقف‌های output، snapshot، log، و pending-call
- serialize کردن مقدارهای پل میزبان از طریق یک adapter محدود JSON
- تبدیل خطاهای میزبان به خطاهای ساده مهمان، هرگز objectهای realm میزبان
- حذف snapshotها هنگام timeout، abort، پایان session، یا expiry
- رد دسترسی recursive به `exec`، `wait`، و ابزارهای کنترلی جست‌وجوی ابزار
- جلوگیری از این‌که برخوردهای نام راحت، helperهای catalog را shadow کنند

sandbox یک لایه امنیتی است. operatorها همچنان ممکن است برای deploymentهای
پرریسک به hardening در سطح OS نیاز داشته باشند.

## کدهای خطا

```typescript
type CodeModeErrorCode =
  | "runtime_unavailable"
  | "invalid_config"
  | "invalid_input"
  | "unsupported_language"
  | "typescript_transform_failed"
  | "module_access_denied"
  | "timeout"
  | "memory_limit_exceeded"
  | "output_limit_exceeded"
  | "snapshot_limit_exceeded"
  | "snapshot_expired"
  | "snapshot_restore_failed"
  | "too_many_pending_tool_calls"
  | "nested_tool_failed"
  | "aborted"
  | "internal_error";
```

خطاهای برگردانده‌شده به مهمان، داده‌های ساده هستند. نمونه‌های `Error` میزبان،
objectهای stack، prototypeها، و تابع‌های میزبان وارد QuickJS نمی‌شوند.

## Telemetry

حالت کد گزارش می‌کند:

- نام ابزارهای قابل مشاهده ارسال‌شده به مدل
- اندازه catalog پنهان و breakdown بر اساس source
- تعداد `exec` و `wait`
- تعداد nested search، describe، و call
- شناسه ابزارهای تو در توی فراخوانی‌شده
- خرابی‌های timeout، memory، snapshot، و output cap
- رویدادهای چرخه عمر snapshot

Telemetry نباید secrets، مقدارهای خام environment، یا ورودی‌های ابزار بدون
redaction را فراتر از policy موجود trajectory در OpenClaw شامل شود.

## Debugging

وقتی حالت کد با اجرای عادی ابزار تفاوت رفتاری دارد، از logging هدفمند transport
مدل استفاده کنید:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

برای debug کردن شکل payload، از `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`
استفاده کنید. این کار یک snapshot محدود و redacted از JSON درخواست مدل را log
می‌کند؛ فقط باید هنگام debugging استفاده شود، چون promptها و متن پیام‌ها
همچنان می‌توانند ظاهر شوند.

برای debug کردن stream، از `OPENCLAW_DEBUG_SSE=peek` استفاده کنید تا پنج رویداد
اول SSE به‌صورت redacted log شوند. همچنین اگر پس از فعال شدن سطح حالت کد، payload
نهایی provider دقیقاً شامل `exec` و `wait` نباشد، حالت کد به‌شکل fail closed
شکست می‌خورد.

## چیدمان پیاده‌سازی

واحدهای پیاده‌سازی:

- قرارداد config: `tools.codeMode`
- سازنده catalog: ابزارهای مؤثر به ورودی‌های فشرده و map شناسه
- adapter سطح مدل: جایگزینی ابزارهای قابل مشاهده با `exec` و `wait`
- adapter runtime QuickJS-WASI: load، eval، snapshot، restore، dispose
- supervisor مربوط به worker: timeout، abort، crash isolation
- adapter پل: callbackهای میزبان امن برای JSON و تحویل نتیجه
- adapter transform TypeScript
- store مربوط به snapshot: TTL، سقف‌های اندازه، scope بر اساس run/session
- projection مربوط به trajectory برای فراخوانی‌های ابزار تو در تو
- شمارنده‌های telemetry و diagnostics

پیاده‌سازی از مفهوم‌های catalog و executor در جست‌وجوی ابزار دوباره استفاده
می‌کند، اما از child مربوط به `node:vm` به‌عنوان sandbox استفاده نمی‌کند.

## چک‌لیست اعتبارسنجی

پوشش حالت کد باید ثابت کند:

- پیکربندی غیرفعال، نمایش ابزارهای موجود را بدون تغییر نگه می‌دارد
- پیکربندی شیء بدون `enabled: true` حالت کد را غیرفعال نگه می‌دارد
- پیکربندی فعال، وقتی ابزارها برای اجرا فعال باشند، فقط `exec` و `wait` را به مدل
  نمایش می‌دهد
- اجراهای خامِ بدون ابزار، `disableTools`، و فهرست‌های مجاز خالی، الزام payload
  حالت کد را فعال نمی‌کنند
- همه ابزارهای غیر-MCP مؤثر در `ALL_TOOLS` ظاهر می‌شوند
- ابزارهای ردشده در `ALL_TOOLS` ظاهر نمی‌شوند
- `tools.search`، `tools.describe`، و `tools.call` برای ابزارهای OpenClaw کار می‌کنند
- `API.list("mcp")` و `API.read("mcp/<server>.d.ts")` اعلان‌های سبک TypeScript
  مربوط به MCP را بدون bridge/tool call نمایش می‌دهند
- فضای نام MCP یعنی `$api()` به‌عنوان fallback درون‌خطی برای schemaها همچنان در دسترس است
- فراخوانی‌های فضای نام MCP برای ابزارهای MCP قابل‌مشاهده با یک ورودی شیء کار می‌کنند، درحالی‌که
  ورودی‌های مستقیم کاتالوگ MCP در `tools.*` وجود ندارند
- ابزارهای کنترلی جست‌وجوی ابزار هم از سطح مدل و هم از کاتالوگ پنهان مخفی هستند
- فراخوانی‌های تو در تو رفتار تأیید و hook را حفظ می‌کنند
- shell `exec` از مدل مخفی است اما در صورت مجاز بودن، با شناسه کاتالوگ قابل فراخوانی است
- `exec` و `wait` بازگشتیِ حالت کد از کد مهمان قابل فراخوانی نیستند
- ورودی TypeScript بدون بارگذاری TypeScript در مسیرهای غیرفعال یا فقط JavaScript
  تبدیل و ارزیابی می‌شود
- دسترسی به `import`، `require`، filesystem، network، و environment ناموفق می‌شود
- حلقه‌های بی‌نهایت timeout می‌شوند و نمی‌توانند Gateway را مسدود کنند
- شکست‌های سقف حافظه، VM مهمان را خاتمه می‌دهند
- سقف‌های خروجی و snapshot برای فراخوانی‌های تکمیل‌شده و تعلیق‌شده اعمال می‌شوند
- `wait` یک snapshot تعلیق‌شده را از سر می‌گیرد و مقدار نهایی را برمی‌گرداند
- مقدارهای منقضی‌شده، لغوشده، با نشست نادرست، و ناشناخته `runId` ناموفق می‌شوند
- بازپخش و پایداری رونوشت، فراخوانی‌های کنترلی حالت کد را حفظ می‌کنند
- رونوشت و دورسنجی فراخوانی‌های ابزار تو در تو را به‌وضوح نشان می‌دهند

## برنامه آزمون E2E

هنگام تغییر runtime، این موارد را به‌عنوان آزمون‌های integration یا end-to-end اجرا کنید:

1. یک Gateway را با `tools.codeMode.enabled: false` راه‌اندازی کنید.
2. یک نوبت عامل با مجموعه ابزار مستقیم کوچک ارسال کنید.
3. اطمینان دهید ابزارهای قابل‌مشاهده برای مدل بدون تغییر هستند.
4. با `tools.codeMode.enabled: true` دوباره راه‌اندازی کنید.
5. یک نوبت عامل با ابزارهای آزمایشی OpenClaw، plugin، MCP، و client ارسال کنید.
6. اطمینان دهید فهرست ابزارهای قابل‌مشاهده برای مدل دقیقاً `exec`، `wait` است.
7. در `exec`، `ALL_TOOLS` را بخوانید و اطمینان دهید ابزارهای آزمایشی مؤثر حاضر هستند.
8. در `exec`، ابزارهای OpenClaw/plugin/client را از طریق `tools.search`،
   `tools.describe`، و `tools.call` فراخوانی کنید.
9. در `exec`، `API.list("mcp")` و `API.read("mcp/<server>.d.ts")` را فراخوانی کنید و
   اطمینان دهید فایل‌های اعلان، ابزارهای MCP قابل‌مشاهده را توصیف می‌کنند.
10. در `exec`، ابزارهای MCP را از طریق `MCP.<server>.<tool>({ ...input })` فراخوانی کنید و
    اطمینان دهید ورودی‌های مستقیم کاتالوگ MCP در `ALL_TOOLS` و `tools.*` وجود ندارند.
11. اطمینان دهید ابزارهای ردشده غایب هستند و با شناسه حدسی قابل فراخوانی نیستند.
12. یک فراخوانی ابزار تو در تو را شروع کنید که پس از بازگشت `exec` با مقدار `waiting` حل می‌شود.
13. `wait` را فراخوانی کنید و اطمینان دهید VM بازیابی‌شده نتیجه ابزار را دریافت می‌کند.
14. اطمینان دهید پاسخ نهایی شامل خروجی تولیدشده پس از بازیابی است.
15. اطمینان دهید timeout، abort، و انقضای snapshot وضعیت runtime را پاک‌سازی می‌کنند.
16. trajectory را export کنید و اطمینان دهید فراخوانی‌های تو در تو زیر فراخوانی والدِ
    حالت کد قابل‌مشاهده هستند.

تغییرات فقط مستنداتی در این صفحه همچنان باید `pnpm check:docs` را اجرا کنند.

## مرتبط

- [جست‌وجوی ابزار](/fa/tools/tool-search)
- [runtimeهای عامل](/fa/concepts/agent-runtimes)
- [ابزار Exec](/fa/tools/exec)
- [اجرای کد](/fa/tools/code-execution)
