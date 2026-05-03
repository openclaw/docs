---
read_when:
    - در حال اشکال‌زدایی رد شدن درخواست‌های ارائه‌دهنده‌ی مرتبط با شکل رونوشت هستید
    - شما در حال تغییر منطق پاک‌سازی رونوشت یا ترمیم فراخوانی ابزار هستید
    - شما در حال بررسی ناهماهنگی‌های شناسهٔ فراخوانی ابزار در میان ارائه‌دهندگان هستید.
summary: 'مرجع: قواعد پاک‌سازی و ترمیم رونوشت مختص ارائه‌دهنده'
title: بهداشت رونوشت
x-i18n:
    generated_at: "2026-05-03T11:45:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff3a364a4c4d1c0d1e03b2860396c2d7e32c554d7acd0791ed2eaadae06d35ab
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw پیش از اجرای یک run (ساختن context مدل)، **اصلاحات ویژه‌ی provider** را روی transcriptها اعمال می‌کند. بیشتر این‌ها تنظیمات **درون‌حافظه‌ای** هستند که برای برآورده کردن الزامات سخت‌گیرانه‌ی provider استفاده می‌شوند. یک گذر جداگانه‌ی repair برای فایل session نیز ممکن است JSONL ذخیره‌شده را پیش از بارگذاری session بازنویسی کند، اما فقط برای خط‌های بدشکل یا turnهای پایدارشده‌ای که رکوردهای durable نامعتبر هستند. پاسخ‌های تحویل‌داده‌شده‌ی assistant روی دیسک حفظ می‌شوند؛ حذف prefill ویژه‌ی provider برای assistant فقط هنگام ساخت payloadهای خروجی انجام می‌شود. وقتی repair رخ می‌دهد، فایل اصلی در کنار فایل session پشتیبان‌گیری می‌شود.

دامنه شامل موارد زیر است:

- بیرون ماندن context فقط-زمان‌اجرا از turnهای transcript قابل‌مشاهده برای کاربر
- پاک‌سازی id فراخوانی ابزار
- اعتبارسنجی ورودی فراخوانی ابزار
- repair جفت‌سازی نتیجه‌ی ابزار
- اعتبارسنجی / ترتیب‌دهی turn
- پاک‌سازی امضای thought
- پاک‌سازی امضای thinking
- پاک‌سازی payload تصویر
- پاک‌سازی بلوک‌های متنی خالی پیش از replay توسط provider
- برچسب‌گذاری منشأ ورودی کاربر (برای promptهای مسیریابی‌شده بین sessionها)
- repair turn خطای assistant خالی برای replay در Bedrock Converse

اگر به جزئیات ذخیره‌سازی transcript نیاز دارید، ببینید:

- [بررسی عمیق مدیریت session](/fa/reference/session-management-compaction)

---

## قاعده‌ی سراسری: context زمان‌اجرا transcript کاربر نیست

context زمان‌اجرا/system می‌تواند برای یک turn به prompt مدل افزوده شود، اما
محتوای نوشته‌شده توسط کاربر نهایی نیست. OpenClaw یک بدنه‌ی prompt جداگانه‌ی
روبه‌transcript برای پاسخ‌های Gateway، followupهای صف‌شده، ACP، CLI، و runهای
Pi تعبیه‌شده نگه می‌دارد. turnهای کاربرِ قابل‌مشاهده‌ی ذخیره‌شده به‌جای prompt
غنی‌شده با زمان‌اجرا، از همان بدنه‌ی transcript استفاده می‌کنند.

برای sessionهای قدیمی که از قبل wrapperهای زمان‌اجرا را پایدار کرده‌اند، سطح‌های
history در Gateway پیش از برگرداندن پیام‌ها به کلاینت‌های WebChat، TUI، REST، یا SSE
یک نمایش projection اعمال می‌کنند.

---

## محل اجرای این فرایند

تمام بهداشت transcript در runner تعبیه‌شده متمرکز شده است:

- انتخاب policy: `src/agents/transcript-policy.ts`
- اعمال پاک‌سازی/repair: `sanitizeSessionHistory` در `src/agents/pi-embedded-runner/replay-history.ts`

policy از `provider`، `modelApi`، و `modelId` استفاده می‌کند تا تصمیم بگیرد چه چیزی اعمال شود.

جدا از بهداشت transcript، فایل‌های session پیش از load شدن repair می‌شوند (در صورت نیاز):

- `repairSessionFileIfNeeded` در `src/agents/session-file-repair.ts`
- از `run/attempt.ts` و `compact.ts` فراخوانی می‌شود (runner تعبیه‌شده)

---

## قاعده‌ی سراسری: پاک‌سازی تصویر

payloadهای تصویر همیشه پاک‌سازی می‌شوند تا به‌دلیل محدودیت‌های اندازه
(downscale/recompress تصاویر base64 بیش‌ازحد بزرگ)، از رد شدن در سمت provider جلوگیری شود.

این کار همچنین به کنترل فشار token ناشی از تصویر برای مدل‌های دارای قابلیت vision کمک می‌کند.
ابعاد حداکثری پایین‌تر عموما مصرف token را کاهش می‌دهد؛ ابعاد بالاتر جزئیات را حفظ می‌کند.

پیاده‌سازی:

- `sanitizeSessionMessagesImages` در `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` در `src/agents/tool-images.ts`
- بیشینه‌ی ضلع تصویر از طریق `agents.defaults.imageMaxDimensionPx` قابل پیکربندی است (پیش‌فرض: `1200`).
- درحالی‌که این گذر محتوای replay را پیمایش می‌کند، بلوک‌های متنی خالی حذف می‌شوند. turnهای assistant
  که خالی می‌شوند از کپی replay حذف می‌شوند؛ turnهای user و tool-result
  که خالی می‌شوند یک placeholder غیرخالی برای محتوای حذف‌شده دریافت می‌کنند.

---

## قاعده‌ی سراسری: فراخوانی‌های ابزار بدشکل

بلوک‌های فراخوانی ابزار assistant که هم `input` و هم `arguments` را ندارند، پیش از ساخته شدن
context مدل حذف می‌شوند. این کار از رد شدن توسط provider به‌خاطر فراخوانی‌های ابزار نیمه‌پایدارشده
جلوگیری می‌کند (برای مثال، پس از خطای rate limit).

پیاده‌سازی:

- `sanitizeToolCallInputs` در `src/agents/session-transcript-repair.ts`
- در `sanitizeSessionHistory` در `src/agents/pi-embedded-runner/replay-history.ts` اعمال می‌شود

---

## قاعده‌ی سراسری: منشأ ورودی بین sessionها

وقتی یک agent از طریق `sessions_send` یک prompt را به session دیگری می‌فرستد (از جمله
گام‌های پاسخ/اعلان agent-to-agent)، OpenClaw turn کاربر ساخته‌شده را با این مقدار پایدار می‌کند:

- `message.provenance.kind = "inter_session"`

OpenClaw همچنین پیش از متن prompt مسیریابی‌شده، در همان turn یک نشانگر
`[Inter-session message ... isUser=false]` اضافه می‌کند تا فراخوانی مدل فعال بتواند
خروجی session خارجی را از دستورهای کاربر نهایی بیرونی تشخیص دهد. این نشانگر در صورت وجود
شامل session مبدأ، کانال، و ابزار است. transcript همچنان برای سازگاری با provider از
`role: "user"` استفاده می‌کند، اما هم متن قابل‌مشاهده و هم metadata منشأ
turn را به‌عنوان داده‌ی بین sessionها علامت‌گذاری می‌کنند.

هنگام بازسازی context، OpenClaw همین نشانگر را روی turnهای کاربر بین sessionی قدیمی‌تر
که فقط metadata منشأ دارند نیز اعمال می‌کند.

---

## ماتریس provider (رفتار فعلی)

**OpenAI / OpenAI Codex**

- فقط پاک‌سازی تصویر.
- امضاهای reasoning یتیم (آیتم‌های reasoning مستقل بدون بلوک محتوای بعدی) برای transcriptهای OpenAI Responses/Codex حذف می‌شوند، و reasoning قابل replay مربوط به OpenAI پس از تغییر مسیر مدل حذف می‌شود.
- payloadهای آیتم reasoning قابل replay در OpenAI Responses، از جمله آیتم‌های encrypted empty-summary، حفظ می‌شوند تا replay دستی/WebSocket حالت الزامی `rs_*` را در کنار آیتم‌های خروجی assistant نگه دارد.
- پاک‌سازی id فراخوانی ابزار انجام نمی‌شود.
- repair جفت‌سازی نتیجه‌ی ابزار ممکن است خروجی‌های واقعیِ match شده را جابه‌جا کند و برای فراخوانی‌های ابزار گمشده خروجی‌های Codex-style `aborted` بسازد.
- اعتبارسنجی یا ترتیب‌دهی مجدد turn انجام نمی‌شود.
- خروجی‌های ابزار گمشده در خانواده‌ی OpenAI Responses به‌صورت `aborted` ساخته می‌شوند تا با نرمال‌سازی replay در Codex همخوان باشند.
- حذف امضای thought انجام نمی‌شود.

**OpenAI-compatible Gemma 4**

- بلوک‌های تاریخی thinking/reasoning مربوط به assistant پیش از replay حذف می‌شوند تا سرورهای محلی
  سازگار با OpenAI برای Gemma 4 محتوای reasoning مربوط به turnهای قبلی را دریافت نکنند.
- ادامه‌های فراخوانی ابزار در همان turn فعلی، بلوک reasoning assistant را
  تا زمانی که نتیجه‌ی ابزار replay شود به فراخوانی ابزار متصل نگه می‌دارند.

**Google (Generative AI / Gemini CLI / Antigravity)**

- پاک‌سازی id فراخوانی ابزار: alphanumeric سخت‌گیرانه.
- repair جفت‌سازی نتیجه‌ی ابزار و نتایج ابزار synthetic.
- اعتبارسنجی turn (تناوب turn به سبک Gemini).
- اصلاح ترتیب turn در Google (اگر history با assistant شروع شود، یک bootstrap کوچک user در ابتدا افزوده می‌شود).
- Antigravity Claude: نرمال‌سازی امضاهای thinking؛ حذف بلوک‌های thinking بدون امضا.

**Anthropic / Minimax (سازگار با Anthropic)**

- repair جفت‌سازی نتیجه‌ی ابزار و نتایج ابزار synthetic.
- اعتبارسنجی turn (ادغام turnهای متوالی user برای برآورده کردن تناوب سخت‌گیرانه).
- turnهای prefill انتهایی assistant از payloadهای خروجی Anthropic Messages
  وقتی thinking فعال است حذف می‌شوند، از جمله مسیرهای Cloudflare AI Gateway.
- بلوک‌های thinking با امضاهای replay گمشده، خالی، یا blank پیش از تبدیل provider حذف می‌شوند.
  اگر این کار یک turn assistant را خالی کند، OpenClaw شکل turn را با متن omitted-reasoning غیرخالی نگه می‌دارد.
- turnهای قدیمی‌ترِ فقط-thinking مربوط به assistant که باید حذف شوند، با
  متن omitted-reasoning غیرخالی جایگزین می‌شوند تا adapterهای provider، turn
  replay را حذف نکنند.

**Amazon Bedrock (Converse API)**

- turnهای خطای stream assistant خالی پیش از replay به یک بلوک متن fallback غیرخالی
  repair می‌شوند. Bedrock Converse پیام‌های assistant با `content: []` را رد می‌کند، بنابراین
  turnهای assistant پایدارشده با `stopReason: "error"` و محتوای خالی نیز
  پیش از load شدن روی دیسک repair می‌شوند.
- turnهای خطای stream assistant که فقط شامل بلوک‌های متنی blank هستند، به‌جای replay کردن یک بلوک blank نامعتبر،
  از کپی replay درون‌حافظه‌ای حذف می‌شوند.
- بلوک‌های thinking مربوط به Claude با امضاهای replay گمشده، خالی، یا blank
  پیش از replay در Converse حذف می‌شوند. اگر این کار یک turn assistant را خالی کند، OpenClaw
  شکل turn را با متن omitted-reasoning غیرخالی نگه می‌دارد.
- turnهای قدیمی‌ترِ فقط-thinking مربوط به assistant که باید حذف شوند، با
  متن omitted-reasoning غیرخالی جایگزین می‌شوند تا replay در Converse شکل turn سخت‌گیرانه را حفظ کند.
- replay، turnهای assistant مربوط به delivery-mirror در OpenClaw و تزریق‌شده توسط gateway را فیلتر می‌کند.
- پاک‌سازی تصویر از طریق قاعده‌ی سراسری اعمال می‌شود.

**Mistral (از جمله تشخیص مبتنی بر model-id)**

- پاک‌سازی id فراخوانی ابزار: strict9 (alphanumeric با طول 9).

**OpenRouter Gemini**

- پاک‌سازی امضای thought: مقدارهای `thought_signature` غیر-base64 حذف می‌شوند (base64 نگه داشته می‌شود).

**OpenRouter Anthropic**

- turnهای prefill انتهایی assistant از payloadهای مدل Anthropic سازگار با OpenAI و تأییدشده‌ی OpenRouter
  وقتی reasoning فعال است حذف می‌شوند، مطابق با رفتار replay مستقیم Anthropic و Cloudflare Anthropic.

**همه‌ی موارد دیگر**

- فقط پاک‌سازی تصویر.

---

## رفتار تاریخی (پیش از 2026.1.22)

پیش از انتشار 2026.1.22، OpenClaw چندین لایه بهداشت transcript اعمال می‌کرد:

- یک **افزونه‌ی transcript-sanitize** روی هر ساخت context اجرا می‌شد و می‌توانست:
  - جفت‌سازی tool use/result را repair کند.
  - idهای فراخوانی ابزار را پاک‌سازی کند (از جمله حالتی غیرسخت‌گیرانه که `_`/`-` را حفظ می‌کرد).
- runner نیز پاک‌سازی ویژه‌ی provider انجام می‌داد، که باعث تکرار کار می‌شد.
- جهش‌های اضافی بیرون از policy مربوط به provider رخ می‌دادند، از جمله:
  - حذف tagهای `<final>` از متن assistant پیش از persistence.
  - حذف turnهای خطای assistant خالی.
  - کوتاه کردن محتوای assistant پس از فراخوانی‌های ابزار.

این پیچیدگی باعث regressions بین‌providerها شد (به‌ویژه جفت‌سازی `call_id|fc_id` در
`openai-responses`). پاک‌سازی 2026.1.22 این افزونه را حذف کرد، منطق را در runner متمرکز کرد،
و OpenAI را فراتر از پاک‌سازی تصویر **دست‌نخورده** نگه داشت.

## مرتبط

- [مدیریت session](/fa/concepts/session)
- [هرس session](/fa/concepts/session-pruning)
