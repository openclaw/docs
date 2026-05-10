---
read_when:
    - می‌خواهید یک برگ منفرد را داخل یک فایل فضای کاری از ترمینال بررسی یا ویرایش کنید
    - شما برای کار با وضعیت فضای کاری اسکریپت می‌نویسید و به یک طرح آدرس‌دهی پایدار و مستقل از نوع نیاز دارید
    - شما در حال تصمیم‌گیری هستید که آیا Plugin اختیاری `oc-path` را روی یک Gateway خودمیزبان فعال کنید یا نه
summary: 'Plugin همراه `oc-path`: CLI `openclaw path` را برای طرح آدرس‌دهی فایلِ فضای کاری `oc://` ارائه می‌کند'
title: Plugin مسیر OC
x-i18n:
    generated_at: "2026-05-10T19:56:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4d9d34094ebfa5850266b33d6a4f443e631fb207e519c1cf5fccfb735c200a0
    source_path: plugins/oc-path.md
    workflow: 16
---

Plugin همراه `oc-path`، CLI [`openclaw path`](/fa/cli/path) را برای طرح آدرس‌دهی فایل‌های فضای کاری `oc://` اضافه می‌کند. این Plugin در مخزن OpenClaw زیر
`extensions/oc-path/` ارائه می‌شود، اما اختیاری است — نصب/ساخت آن را غیرفعال نگه می‌دارد تا وقتی که شما آن را فعال کنید.

آدرس‌های `oc://` به یک برگ منفرد (یا مجموعه‌ای از برگ‌ها با wildcard) درون یک فایل فضای کاری اشاره می‌کنند. این Plugin امروز سه نوع فایل را می‌شناسد:

- **markdown** (`.md`, `.mdx`): frontmatter، بخش‌ها، آیتم‌ها، فیلدها
- **jsonc** (`.jsonc`, `.json5`, `.json`): دیدگاه‌ها و قالب‌بندی حفظ می‌شوند
- **jsonl** (`.jsonl`, `.ndjson`): رکوردهای خط‌محور

میزبان‌های خودگردان و افزونه‌های ویرایشگر از CLI استفاده می‌کنند تا یک برگ منفرد را بدون اسکریپت‌نویسی مستقیم در برابر SDK بخوانند یا بنویسند؛ عامل‌ها و hookها آن را به‌عنوان یک زیرلایه قطعی در نظر می‌گیرند تا round-tripهای با وفاداری بایتی و محافظ sentinel حذف‌سازی، به‌صورت یکنواخت در همه نوع‌ها اعمال شوند.

## چرا آن را فعال کنیم

وقتی می‌خواهید اسکریپت‌ها، hookها، یا ابزارهای عامل محلی به قطعه‌ای دقیق از وضعیت فضای کاری اشاره کنند، بدون اینکه برای هر شکل فایل یک parser اختراع کنید، `oc-path` را فعال کنید. یک آدرس `oc://` می‌تواند یک کلید frontmatter در markdown، یک آیتم بخش، یک برگ پیکربندی JSONC، یا یک فیلد رویداد JSONL را نام‌گذاری کند.

این برای workflowهای نگه‌دارنده مهم است، جایی که تغییر باید کوچک، قابل حسابرسی و تکرارپذیر باشد: یک مقدار را بررسی کنید، رکوردهای مطابق را پیدا کنید، یک نوشتن را به‌صورت dry-run اجرا کنید، سپس فقط همان برگ را اعمال کنید و دیدگاه‌ها، پایان خط‌ها و قالب‌بندی نزدیک را دست‌نخورده بگذارید. نگه داشتن این قابلیت به‌عنوان یک Plugin اختیاری، زیرلایه آدرس‌دهی را به کاربران حرفه‌ای می‌دهد، بدون اینکه وابستگی‌های parser یا سطح CLI را برای نصب‌هایی که هرگز به آن نیاز ندارند وارد هسته کند.

دلایل رایج برای فعال کردن آن:

- **اتوماسیون محلی**: اسکریپت‌های shell می‌توانند به‌جای حمل کدهای parsing جداگانه برای markdown، JSONC و JSONL، یک مقدار فضای کاری را با `openclaw path … --json` resolve یا به‌روزرسانی کنند.
- **ویرایش‌های قابل مشاهده برای عامل**: یک عامل می‌تواند پیش از نوشتن، diff مربوط به dry-run را برای یک برگ آدرس‌دهی‌شده نشان دهد، که مرور آن از بازنویسی آزادانه فایل آسان‌تر است.
- **یکپارچه‌سازی‌های ویرایشگر**: یک ویرایشگر می‌تواند `oc://AGENTS.md/tools/gh` را بدون حدس زدن از متن heading، به node دقیق markdown و شماره خط نگاشت کند.
- **عیب‌یابی**: `emit` یک فایل را از مسیر parser و emitter عبور می‌دهد و دوباره تولید می‌کند، بنابراین می‌توانید پیش از تکیه بر ویرایش‌های خودکار، بررسی کنید آیا یک نوع فایل از نظر بایتی پایدار است یا نه.

نمونه‌های مشخص:

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

این Plugin عمدا مالک معناشناسی سطح بالاتر نیست. Pluginهای حافظه همچنان مالک نوشتن‌های حافظه هستند، فرمان‌های پیکربندی همچنان مالک مدیریت کامل پیکربندی هستند، و منطق LKG همچنان مالک بازیابی/ارتقا است. `oc-path` لایه باریک عملیات آدرس‌دهی و عملیات فایل با حفظ بایت است که آن ابزارهای سطح بالاتر می‌توانند پیرامون آن ساخته شوند.

## کجا اجرا می‌شود

این Plugin **درون‌پردازشی داخل CLI `openclaw`** روی میزبانی اجرا می‌شود که فرمان را در آن فراخوانی می‌کنید. به Gateway در حال اجرا نیاز ندارد و هیچ socket شبکه‌ای باز نمی‌کند — هر فعل یک تبدیل خالص روی فایلی است که به آن اشاره می‌کنید.

فراداده Plugin در `extensions/oc-path/openclaw.plugin.json` قرار دارد:

```json
{
  "id": "oc-path",
  "name": "OC Path",
  "activation": {
    "onStartup": false,
    "onCommands": ["path"]
  },
  "commandAliases": [{ "name": "path", "kind": "cli" }]
}
```

`onStartup: false` این Plugin را از مسیر داغ Gateway بیرون نگه می‌دارد. `onCommands:
["path"]` به CLI می‌گوید نخستین باری که `openclaw path …` را اجرا می‌کنید، Plugin را به‌صورت تنبل بارگذاری کند، بنابراین نصب‌هایی که هرگز از این فعل استفاده نمی‌کنند هزینه‌ای نمی‌پردازند.

## فعال‌سازی

```bash
openclaw plugins enable oc-path
```

Gateway را restart کنید (اگر یکی اجرا می‌کنید) تا snapshot manifest وضعیت جدید را دریافت کند. فراخوانی‌های ساده `openclaw path` روی همان میزبان بلافاصله کار می‌کنند — CLI این Plugin را بنا به نیاز بارگذاری می‌کند.

غیرفعال‌سازی با:

```bash
openclaw plugins disable oc-path
```

## وابستگی‌ها

همه وابستگی‌های parser محلیِ Plugin هستند — فعال کردن `oc-path` بسته‌های جدیدی را وارد runtime هسته نمی‌کند:

| وابستگی       | هدف                                                                 |
| -------------- | ------------------------------------------------------------------- |
| `commander`    | سیم‌کشی subcommand برای `resolve`, `find`, `set`, `validate`, `emit`. |
| `jsonc-parser` | parse کردن JSONC و ویرایش برگ‌ها با حفظ دیدگاه‌ها و trailing commaها. |
| `markdown-it`  | tokenization در Markdown برای مدل بخش / آیتم / فیلد.               |

JSONL همچنان دستی باقی می‌ماند — parsing خط‌محور از هر وابستگی ساده‌تر است، و parse کردن JSONC هر خط از قبل از مسیر `jsonc-parser` عبور می‌کند.

## چه چیزی ارائه می‌کند

| سطح                           | ارائه‌شده توسط                                           |
| ------------------------------ | ------------------------------------------------------- |
| CLI `openclaw path`            | `extensions/oc-path/cli-registration.ts`                |
| parser / formatter برای `oc://` | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| parse / emit / edit برای هر نوع | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl}`       |
| resolve / find / set همگانی   | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| محافظ redaction-sentinel       | `extensions/oc-path/src/oc-path/sentinel.ts`            |

امروز CLI تنها سطح عمومی است. فعل‌های زیرلایه برای خود Plugin خصوصی هستند؛ مصرف‌کنندگان از CLI استفاده می‌کنند (یا Plugin خودشان را در برابر SDK می‌سازند).

## رابطه با Pluginهای دیگر

- **`memory-*`**: نوشتن‌های حافظه از مسیر Pluginهای حافظه عبور می‌کنند، نه `oc-path`.
  `oc-path` یک زیرلایه فایل عمومی است؛ Pluginهای حافظه معناشناسی خودشان را روی آن لایه‌بندی می‌کنند.
- **LKG**: `path` چیزی درباره بازیابی پیکربندی Last-Known-Good نمی‌داند. اگر یک فایل توسط LKG ردیابی شود، فراخوانی بعدی `observe` تصمیم می‌گیرد که promote شود یا recover؛ `set --batch` برای multi-set اتمیک از مسیر چرخه عمر promote/recover در LKG، در کنار زیرلایه بازیابی LKG برنامه‌ریزی شده است.

## ایمنی

`set` بایت‌های خام را از مسیر emit زیرلایه می‌نویسد، که محافظ redaction-sentinel را به‌صورت خودکار اعمال می‌کند. برگی که حامل
`__OPENCLAW_REDACTED__` باشد (به‌صورت عین عبارت یا به‌عنوان زیررشته) هنگام نوشتن با `OC_EMIT_SENTINEL` رد می‌شود. CLI همچنین sentinel لفظی را از هر خروجی انسانی یا JSON که چاپ می‌کند پاک می‌کند و آن را با `[REDACTED]` جایگزین می‌کند تا ضبط‌های ترمینال و pipelineها هرگز این marker را افشا نکنند.

## مرتبط

- [مرجع CLI `openclaw path`](/fa/cli/path)
- [مدیریت Pluginها](/fa/plugins/manage-plugins)
- [ساخت Pluginها](/fa/plugins/building-plugins)
