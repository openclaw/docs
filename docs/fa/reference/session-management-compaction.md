---
read_when:
    - لازم است شناسه‌های نشست، رونوشت JSONL، یا فیلدهای sessions.json را اشکال‌زدایی کنید
    - شما در حال تغییر رفتار Compaction خودکار یا افزودن امور نگه‌داری “پیش از Compaction” هستید
    - می‌خواهید پاک‌سازی‌های حافظه یا نوبت‌های سیستمی بی‌صدا را پیاده‌سازی کنید
summary: 'بررسی عمیق: ذخیره‌گاه نشست + رونوشت‌ها، چرخه حیات، و جزئیات داخلی Compaction خودکار'
title: بررسی عمیق مدیریت نشست
x-i18n:
    generated_at: "2026-04-30T16:31:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a6a7031cebd90d27784a32a0d0378ea9959249389d209f0745395f90b8a0df9
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw جلسه‌ها را از ابتدا تا انتها در این حوزه‌ها مدیریت می‌کند:

- **مسیریابی جلسه** (اینکه پیام‌های ورودی چگونه به یک `sessionKey` نگاشت می‌شوند)
- **ذخیره‌ساز جلسه** (`sessions.json`) و آنچه ردیابی می‌کند
- **پایداری رونوشت** (`*.jsonl`) و ساختار آن
- **بهداشت رونوشت** (اصلاحات ویژه ارائه‌دهنده پیش از اجراها)
- **محدودیت‌های زمینه** (پنجره زمینه در برابر توکن‌های ردیابی‌شده)
- **Compaction** (Compaction دستی و خودکار) و محل اتصال کارهای پیش از Compaction
- **خانه‌داری بی‌صدا** (نوشتن‌های حافظه که نباید خروجی قابل مشاهده برای کاربر تولید کنند)

اگر ابتدا نمایی کلی‌تر می‌خواهید، از اینجا شروع کنید:

- [مدیریت جلسه](/fa/concepts/session)
- [Compaction](/fa/concepts/compaction)
- [نمای کلی حافظه](/fa/concepts/memory)
- [جست‌وجوی حافظه](/fa/concepts/memory-search)
- [هرس جلسه](/fa/concepts/session-pruning)
- [بهداشت رونوشت](/fa/reference/transcript-hygiene)

---

## منبع حقیقت: Gateway

OpenClaw بر پایه یک **فرایند Gateway** واحد طراحی شده است که مالک وضعیت جلسه است.

- رابط‌های کاربری (برنامه macOS، رابط کنترل وب، TUI) باید فهرست جلسه‌ها و شمارش توکن‌ها را از Gateway پرس‌وجو کنند.
- در حالت ریموت، فایل‌های جلسه روی میزبان ریموت هستند؛ «بررسی فایل‌های محلی Mac خودتان» آنچه Gateway استفاده می‌کند را نشان نمی‌دهد.

---

## دو لایه پایداری

OpenClaw جلسه‌ها را در دو لایه پایدار می‌کند:

1. **ذخیره‌ساز جلسه (`sessions.json`)**
   - نگاشت کلید/مقدار: `sessionKey -> SessionEntry`
   - کوچک، قابل تغییر، و برای ویرایش (یا حذف ورودی‌ها) امن
   - فراداده جلسه را ردیابی می‌کند (شناسه جلسه فعلی، آخرین فعالیت، سوییچ‌ها، شمارنده‌های توکن، و غیره)

2. **رونوشت (`<sessionId>.jsonl`)**
   - رونوشت فقط-الحاقی با ساختار درختی (ورودی‌ها `id` + `parentId` دارند)
   - گفت‌وگوی واقعی + فراخوانی‌های ابزار + خلاصه‌های Compaction را ذخیره می‌کند
   - برای بازسازی زمینه مدل در نوبت‌های آینده استفاده می‌شود
   - نقاط وارسی بزرگ عیب‌یابی پیش از Compaction، پس از اینکه رونوشت فعال از سقف اندازه نقطه وارسی بیشتر شود، نادیده گرفته می‌شوند و از ایجاد یک کپی غول‌آسای دوم با نام `.checkpoint.*.jsonl` جلوگیری می‌کنند.

---

## مکان‌های روی دیسک

برای هر عامل، روی میزبان Gateway:

- ذخیره‌ساز: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- رونوشت‌ها: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - جلسه‌های موضوعی Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw این‌ها را از طریق `src/config/sessions.ts` حل می‌کند.

---

## نگهداری ذخیره‌ساز و کنترل‌های دیسک

پایداری جلسه کنترل‌های نگهداری خودکار (`session.maintenance`) برای `sessions.json`، آثار رونوشت، و فایل‌های جانبی مسیر اجرا دارد:

- `mode`: `warn` (پیش‌فرض) یا `enforce`
- `pruneAfter`: حد سن ورودی‌های کهنه (پیش‌فرض `30d`)
- `maxEntries`: سقف ورودی‌ها در `sessions.json` (پیش‌فرض `500`)
- `resetArchiveRetention`: نگهداری برای آرشیوهای رونوشت `*.reset.<timestamp>` (پیش‌فرض: همان `pruneAfter`؛ `false` پاکسازی را غیرفعال می‌کند)
- `maxDiskBytes`: بودجه اختیاری دایرکتوری جلسه‌ها
- `highWaterBytes`: هدف اختیاری پس از پاکسازی (پیش‌فرض `80%` از `maxDiskBytes`)

نوشتن‌های عادی Gateway پاکسازی `maxEntries` را برای سقف‌های در اندازه تولید به‌صورت دسته‌ای انجام می‌دهند، بنابراین یک ذخیره‌ساز ممکن است برای مدت کوتاهی از سقف پیکربندی‌شده بیشتر شود تا پاکسازی بعدی در سطح آب بالا آن را دوباره کاهش دهد. `openclaw sessions cleanup --enforce` همچنان سقف پیکربندی‌شده را فوراً اعمال می‌کند.

OpenClaw دیگر هنگام نوشتن‌های Gateway پشتیبان‌های چرخشی خودکار `sessions.json.bak.*` ایجاد نمی‌کند. کلید قدیمی `session.maintenance.rotateBytes` نادیده گرفته می‌شود و `openclaw doctor --fix` آن را از پیکربندی‌های قدیمی حذف می‌کند.

ترتیب اعمال برای پاکسازی بودجه دیسک (`mode: "enforce"`):

1. ابتدا قدیمی‌ترین آثار آرشیوشده، رونوشت‌های یتیم، یا آثار مسیر اجرای یتیم را حذف کنید.
2. اگر همچنان بالاتر از هدف بود، قدیمی‌ترین ورودی‌های جلسه و فایل‌های رونوشت/مسیر اجرای آن‌ها را بیرون بیندازید.
3. ادامه دهید تا مصرف برابر یا کمتر از `highWaterBytes` شود.

در `mode: "warn"`، OpenClaw حذف‌های احتمالی را گزارش می‌کند اما ذخیره‌ساز/فایل‌ها را تغییر نمی‌دهد.

نگهداری را در صورت نیاز اجرا کنید:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## جلسه‌های Cron و گزارش‌های اجرا

اجراهای جداافتاده Cron نیز ورودی‌ها/رونوشت‌های جلسه ایجاد می‌کنند و کنترل‌های نگهداری اختصاصی دارند:

- `cron.sessionRetention` (پیش‌فرض `24h`) جلسه‌های قدیمی اجرای جداافتاده Cron را از ذخیره‌ساز جلسه هرس می‌کند (`false` غیرفعال می‌کند).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` فایل‌های `~/.openclaw/cron/runs/<jobId>.jsonl` را هرس می‌کنند (پیش‌فرض‌ها: `2_000_000` بایت و `2000` خط).

وقتی Cron یک جلسه اجرای جداافتاده جدید را به‌اجبار ایجاد می‌کند، پیش از نوشتن ردیف جدید، ورودی جلسه قبلی `cron:<jobId>` را پاکسازی می‌کند. این کار ترجیح‌های امنی مانند تنظیمات فکرکردن/سریع/پرگویی، برچسب‌ها، و بازنویسی‌های صریح مدل/احراز هویت انتخاب‌شده توسط کاربر را منتقل می‌کند. زمینه گفت‌وگوی محیطی مانند مسیریابی کانال/گروه، سیاست ارسال یا صف، ارتقا، مبدأ، و اتصال زمان اجرای ACP را حذف می‌کند تا یک اجرای جداافتاده تازه نتواند تحویل کهنه یا اختیار زمان اجرا را از اجرای قدیمی‌تر به ارث ببرد.

---

## کلیدهای جلسه (`sessionKey`)

یک `sessionKey` مشخص می‌کند در _کدام سطل گفت‌وگو_ هستید (مسیریابی + جداسازی).

الگوهای رایج:

- گفت‌وگوی اصلی/مستقیم (برای هر عامل): `agent:<agentId>:<mainKey>` (پیش‌فرض `main`)
- گروه: `agent:<agentId>:<channel>:group:<id>`
- اتاق/کانال (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` یا `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (مگر اینکه بازنویسی شده باشد)

قواعد رسمی در [/concepts/session](/fa/concepts/session) مستند شده‌اند.

---

## شناسه‌های جلسه (`sessionId`)

هر `sessionKey` به یک `sessionId` فعلی اشاره می‌کند (فایل رونوشت که گفت‌وگو را ادامه می‌دهد).

قواعد سرانگشتی:

- **بازنشانی** (`/new`، `/reset`) برای آن `sessionKey` یک `sessionId` جدید ایجاد می‌کند.
- **بازنشانی روزانه** (پیش‌فرض ساعت 4:00 صبح به وقت محلی روی میزبان Gateway) در پیام بعدی پس از مرز بازنشانی، یک `sessionId` جدید ایجاد می‌کند.
- **انقضای بیکاری** (`session.reset.idleMinutes` یا `session.idleMinutes` قدیمی) وقتی پیامی پس از پنجره بیکاری برسد، یک `sessionId` جدید ایجاد می‌کند. وقتی روزانه + بیکاری هر دو پیکربندی شده باشند، هرکدام زودتر منقضی شود برنده است.
- **رویدادهای سیستمی** (Heartbeat، بیدارباش‌های Cron، اعلان‌های exec، حسابداری Gateway) ممکن است ردیف جلسه را تغییر دهند اما تازگی بازنشانی روزانه/بیکاری را تمدید نمی‌کنند. چرخش بازنشانی پیش از ساخته شدن درخواست تازه، اعلان‌های رویداد سیستمی صف‌شده برای جلسه قبلی را دور می‌اندازد.
- **نگهبان انشعاب والد نخ** (`session.parentForkMaxTokens`، پیش‌فرض `100000`) وقتی جلسه والد از قبل بیش از حد بزرگ باشد، انشعاب رونوشت والد را رد می‌کند؛ نخ جدید تازه شروع می‌شود. برای غیرفعال کردن، `0` تنظیم کنید.

جزئیات پیاده‌سازی: تصمیم در `initSessionState()` در `src/auto-reply/reply/session.ts` رخ می‌دهد.

---

## طرح‌واره ذخیره‌ساز جلسه (`sessions.json`)

نوع مقدار ذخیره‌ساز `SessionEntry` در `src/config/sessions.ts` است.

فیلدهای کلیدی (غیرجامع):

- `sessionId`: شناسه رونوشت فعلی (نام فایل از این مشتق می‌شود مگر اینکه `sessionFile` تنظیم شده باشد)
- `sessionStartedAt`: مُهر زمانی شروع برای `sessionId` فعلی؛ تازگی بازنشانی روزانه از این استفاده می‌کند. ردیف‌های قدیمی ممکن است آن را از سرآیند جلسه JSONL مشتق کنند.
- `lastInteractionAt`: مُهر زمانی آخرین تعامل واقعی کاربر/کانال؛ تازگی بازنشانی بیکاری از این استفاده می‌کند تا Heartbeat، Cron، و رویدادهای exec جلسه‌ها را زنده نگه ندارند. ردیف‌های قدیمی بدون این فیلد برای تازگی بیکاری به زمان شروع جلسه بازیابی‌شده برمی‌گردند.
- `updatedAt`: مُهر زمانی آخرین تغییر ردیف ذخیره‌ساز، که برای فهرست‌کردن، هرس، و حسابداری استفاده می‌شود. این مرجع تازگی بازنشانی روزانه/بیکاری نیست.
- `sessionFile`: بازنویسی اختیاری مسیر صریح رونوشت
- `chatType`: `direct | group | room` (به رابط‌های کاربری و سیاست ارسال کمک می‌کند)
- `provider`، `subject`، `room`، `space`، `displayName`: فراداده برای برچسب‌گذاری گروه/کانال
- سوییچ‌ها:
  - `thinkingLevel`، `verboseLevel`، `reasoningLevel`، `elevatedLevel`
  - `sendPolicy` (بازنویسی برای هر جلسه)
- انتخاب مدل:
  - `providerOverride`، `modelOverride`، `authProfileOverride`
- شمارنده‌های توکن (بهترین تلاش / وابسته به ارائه‌دهنده):
  - `inputTokens`، `outputTokens`، `totalTokens`، `contextTokens`
- `compactionCount`: تعداد دفعاتی که Compaction خودکار برای این کلید جلسه کامل شده است
- `memoryFlushAt`: مُهر زمانی آخرین تخلیه حافظه پیش از Compaction
- `memoryFlushCompactionCount`: شمار Compaction هنگام اجرای آخرین تخلیه

ویرایش ذخیره‌ساز امن است، اما Gateway مرجع است: ممکن است هنگام اجرای جلسه‌ها ورودی‌ها را بازنویسی یا دوباره آب‌دهی کند.

---

## ساختار رونوشت (`*.jsonl`)

رونوشت‌ها توسط `SessionManager` متعلق به `@mariozechner/pi-coding-agent` مدیریت می‌شوند.

فایل JSONL است:

- خط نخست: سرآیند جلسه (`type: "session"`، شامل `id`، `cwd`، `timestamp`، `parentSession` اختیاری)
- سپس: ورودی‌های جلسه با `id` + `parentId` (درخت)

انواع ورودی قابل توجه:

- `message`: پیام‌های کاربر/دستیار/نتیجه ابزار
- `custom_message`: پیام‌های تزریق‌شده توسط افزونه که _وارد_ زمینه مدل می‌شوند (می‌توانند از رابط کاربری پنهان باشند)
- `custom`: وضعیت افزونه که وارد زمینه مدل _نمی‌شود_
- `compaction`: خلاصه Compaction پایدارشده با `firstKeptEntryId` و `tokensBefore`
- `branch_summary`: خلاصه پایدارشده هنگام پیمایش یک شاخه درخت

OpenClaw عمداً رونوشت‌ها را «اصلاح» نمی‌کند؛ Gateway برای خواندن/نوشتن آن‌ها از `SessionManager` استفاده می‌کند.

---

## پنجره‌های زمینه در برابر توکن‌های ردیابی‌شده

دو مفهوم متفاوت اهمیت دارند:

1. **پنجره زمینه مدل**: سقف سخت برای هر مدل (توکن‌های قابل مشاهده برای مدل)
2. **شمارنده‌های ذخیره‌ساز جلسه**: آمارهای چرخشی نوشته‌شده در `sessions.json` (برای /status و داشبوردها استفاده می‌شوند)

اگر محدودیت‌ها را تنظیم می‌کنید:

- پنجره زمینه از فهرست مدل می‌آید (و می‌تواند از طریق پیکربندی بازنویسی شود).
- `contextTokens` در ذخیره‌ساز یک مقدار تخمینی/گزارشی زمان اجرا است؛ با آن مثل تضمین سخت‌گیرانه رفتار نکنید.

برای اطلاعات بیشتر، [/token-use](/fa/reference/token-use) را ببینید.

---

## Compaction: چیست

Compaction گفت‌وگوی قدیمی‌تر را در یک ورودی `compaction` پایدارشده در رونوشت خلاصه می‌کند و پیام‌های اخیر را دست‌نخورده نگه می‌دارد.

پس از Compaction، نوبت‌های آینده این‌ها را می‌بینند:

- خلاصه Compaction
- پیام‌های پس از `firstKeptEntryId`

Compaction **پایدار** است (برخلاف هرس جلسه). [/concepts/session-pruning](/fa/concepts/session-pruning) را ببینید.

## مرزهای قطعه Compaction و جفت‌سازی ابزار

وقتی OpenClaw یک رونوشت بلند را به قطعه‌های Compaction تقسیم می‌کند، فراخوانی‌های ابزار دستیار را با ورودی‌های `toolResult` متناظرشان جفت نگه می‌دارد.

- اگر تقسیم بر پایه سهم توکن بین یک فراخوانی ابزار و نتیجه آن بیفتد، OpenClaw مرز را به پیام فراخوانی ابزار دستیار منتقل می‌کند به‌جای اینکه جفت را جدا کند.
- اگر یک بلوک انتهایی نتیجه ابزار در غیر این صورت قطعه را از هدف بزرگ‌تر کند، OpenClaw آن بلوک ابزار در انتظار را حفظ می‌کند و دنباله خلاصه‌نشده را دست‌نخورده نگه می‌دارد.
- بلوک‌های فراخوانی ابزار لغوشده/خطادار یک تقسیم در انتظار را باز نگه نمی‌دارند.

---

## زمان رخ‌دادن Compaction خودکار (زمان اجرای Pi)

در عامل Pi تعبیه‌شده، Compaction خودکار در دو حالت فعال می‌شود:

1. **بازیابی سرریز**: مدل یک خطای سرریز زمینه برمی‌گرداند
   (`request_too_large`، `context length exceeded`، `input exceeds the maximum
number of tokens`، `input token count exceeds the maximum number of input
tokens`، `input is too long for the model`، `ollama error: context length
exceeded`، و گونه‌های مشابه با شکل ارائه‌دهنده) → فشرده‌سازی → تلاش دوباره.
2. **نگهداری آستانه**: پس از یک نوبت موفق، وقتی:

`contextTokens > contextWindow - reserveTokens`

که در آن:

- `contextWindow` پنجره زمینه مدل است
- `reserveTokens` فضای اضافه رزروشده برای درخواست‌ها + خروجی بعدی مدل است

این‌ها معناشناسی زمان اجرای Pi هستند (OpenClaw رویدادها را مصرف می‌کند، اما Pi تصمیم می‌گیرد چه زمانی Compaction کند).

OpenClaw همچنین می‌تواند پیش از باز کردن اجرای بعدی، وقتی `agents.defaults.compaction.maxActiveTranscriptBytes` تنظیم شده باشد و فایل رونوشت فعال به آن اندازه برسد، یک Compaction محلی پیش‌پرواز را فعال کند. این یک نگهبان اندازه فایل برای هزینه بازگشایی محلی است، نه آرشیوسازی خام: OpenClaw همچنان Compaction معنایی عادی را اجرا می‌کند، و به `truncateAfterCompaction` نیاز دارد تا خلاصه فشرده‌شده بتواند به یک رونوشت جانشین جدید تبدیل شود.

برای اجرای تعبیه‌شده‌ی Pi، گزینه‌ی `agents.defaults.compaction.midTurnPrecheck.enabled: true`
یک نگهبان اختیاری برای حلقه‌ی ابزار اضافه می‌کند. پس از اینکه نتیجه‌ی ابزار افزوده شد و پیش از
فراخوانی مدل بعدی، OpenClaw فشار پرامپت را با همان منطق بودجه‌ی preflight
که در شروع turn استفاده می‌شود تخمین می‌زند. اگر context دیگر جا نشود، این نگهبان
داخل hook‏ `transformContext` مربوط به Pi فشرده‌سازی انجام نمی‌دهد. در عوض یک سیگنال ساختاریافته‌ی
precheck میان-turn ایجاد می‌کند، ارسال پرامپت فعلی را متوقف می‌کند و اجازه می‌دهد
حلقه‌ی اجرای بیرونی از مسیر بازیابی موجود استفاده کند: وقتی کافی باشد نتایج بیش‌ازحد بزرگ ابزار را کوتاه کند،
یا حالت پیکربندی‌شده‌ی Compaction را اجرا کرده و دوباره تلاش کند. این گزینه به‌صورت پیش‌فرض غیرفعال است
و با هر دو حالت Compaction یعنی `default` و `safeguard` کار می‌کند، از جمله
Compaction حفاظتیِ متکی به provider.
این مستقل از `maxActiveTranscriptBytes` است: نگهبان اندازه‌ی بایتی
پیش از باز شدن یک turn اجرا می‌شود، در حالی که precheck میان-turn بعدتر در حلقه‌ی ابزار
تعبیه‌شده‌ی Pi و پس از افزوده شدن نتایج ابزار جدید اجرا می‌شود.

---

## تنظیمات Compaction (`reserveTokens`, `keepRecentTokens`)

تنظیمات Compaction مربوط به Pi در تنظیمات Pi قرار دارند:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw همچنین برای اجراهای تعبیه‌شده یک کف ایمنی اعمال می‌کند:

- اگر `compaction.reserveTokens < reserveTokensFloor` باشد، OpenClaw آن را افزایش می‌دهد.
- کف پیش‌فرض `20000` token است.
- برای غیرفعال کردن کف، `agents.defaults.compaction.reserveTokensFloor: 0` را تنظیم کنید.
- اگر از قبل بالاتر باشد، OpenClaw آن را دست‌نخورده می‌گذارد.
- دستور دستی `/compact` مقدار صریح `agents.defaults.compaction.keepRecentTokens`
  را رعایت می‌کند و نقطه‌ی برش دنباله‌ی اخیر Pi را نگه می‌دارد. بدون بودجه‌ی صریح برای نگه‌داری،
  Compaction دستی همچنان یک checkpoint سخت باقی می‌ماند و context بازسازی‌شده از
  summary جدید شروع می‌شود.
- برای اجرای precheck اختیاری حلقه‌ی ابزار پس از نتایج ابزار جدید و پیش از فراخوانی مدل بعدی،
  `agents.defaults.compaction.midTurnPrecheck.enabled: true` را تنظیم کنید. این فقط یک trigger است؛
  تولید summary همچنان از مسیر پیکربندی‌شده‌ی Compaction استفاده می‌کند. این مستقل از
  `maxActiveTranscriptBytes` است، که یک نگهبان اندازه‌ی بایتی برای active-transcript در شروع turn است.
- برای اجرای Compaction محلی پیش از یک turn، هنگامی که active transcript بزرگ می‌شود،
  `agents.defaults.compaction.maxActiveTranscriptBytes` را به یک مقدار بایتی یا
  رشته‌ای مانند `"20mb"` تنظیم کنید. این نگهبان فقط وقتی فعال است که
  `truncateAfterCompaction` نیز فعال باشد. برای غیرفعال کردن، آن را تنظیم‌نشده بگذارید یا `0` قرار دهید.
- وقتی `agents.defaults.compaction.truncateAfterCompaction` فعال باشد،
  OpenClaw پس از Compaction، active transcript را به یک JSONL جانشینِ فشرده‌شده می‌چرخاند.
  transcript کامل قدیمی بایگانی می‌ماند و از checkpoint مربوط به
  Compaction به آن لینک می‌شود، نه اینکه درجا بازنویسی شود.

چرایی: فضای کافی برای «خانه‌تکانی» چند-turnی (مانند نوشتن در memory) باقی بماند، پیش از آنکه Compaction اجتناب‌ناپذیر شود.

پیاده‌سازی: `ensurePiCompactionReserveTokens()` در `src/agents/pi-settings.ts`
(که از `src/agents/pi-embedded-runner.ts` فراخوانی می‌شود).

---

## providerهای قابل‌اتصال برای Compaction

Plugins می‌توانند از طریق `registerCompactionProvider()` روی API مربوط به plugin، یک provider برای Compaction ثبت کنند. وقتی `agents.defaults.compaction.provider` روی id یک provider ثبت‌شده تنظیم شود، افزونه‌ی safeguard به‌جای pipeline داخلی `summarizeInStages`، خلاصه‌سازی را به آن provider واگذار می‌کند.

- `provider`: id یک plugin ثبت‌شده به‌عنوان provider Compaction. برای خلاصه‌سازی LLM پیش‌فرض، آن را تنظیم‌نشده بگذارید.
- تنظیم یک `provider` باعث می‌شود `mode: "safeguard"` اجباری شود.
- providerها همان دستورالعمل‌های Compaction و سیاست حفظ شناسه را مانند مسیر داخلی دریافت می‌کنند.
- safeguard همچنان context مربوط به turnهای اخیر و suffix مربوط به split-turn را پس از خروجی provider حفظ می‌کند.
- خلاصه‌سازی safeguard داخلی، summaryهای قبلی را با پیام‌های جدید دوباره تقطیر می‌کند
  به‌جای اینکه summary کامل قبلی را عیناً حفظ کند.
- حالت safeguard به‌صورت پیش‌فرض ممیزی کیفیت summary را فعال می‌کند؛ برای رد کردن رفتار retry-on-malformed-output،
  `qualityGuard.enabled: false` را تنظیم کنید.
- اگر provider شکست بخورد یا نتیجه‌ی خالی برگرداند، OpenClaw به‌صورت خودکار به خلاصه‌سازی داخلی LLM برمی‌گردد.
- سیگنال‌های abort/timeout دوباره پرتاب می‌شوند (بلعیده نمی‌شوند) تا cancellation فراخواننده رعایت شود.

منبع: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## سطوح قابل‌مشاهده برای کاربر

می‌توانید وضعیت Compaction و session را از این مسیرها مشاهده کنید:

- `/status` (در هر session گفت‌وگو)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- حالت verbose: `🧹 Auto-compaction complete` + تعداد Compaction

---

## خانه‌تکانی بی‌صدا (`NO_REPLY`)

OpenClaw از turnهای «بی‌صدا» برای کارهای پس‌زمینه پشتیبانی می‌کند؛ جایی که کاربر نباید خروجی میانی ببیند.

قرارداد:

- assistant خروجی خود را با token بی‌صدای دقیق `NO_REPLY` /
  `no_reply` شروع می‌کند تا نشان دهد «پاسخی به کاربر تحویل نده».
- OpenClaw این مورد را در لایه‌ی تحویل حذف/سرکوب می‌کند.
- سرکوب token بی‌صدای دقیق به حروف بزرگ و کوچک حساس نیست، بنابراین `NO_REPLY` و
  `no_reply` هر دو وقتی کل payload فقط همان token بی‌صدا باشد معتبرند.
- این فقط برای turnهای واقعاً پس‌زمینه/بدون تحویل است؛ میان‌بری برای
  درخواست‌های معمول و اقدام‌پذیر کاربر نیست.

از نسخه‌ی `2026.1.10`، OpenClaw همچنین وقتی یک
chunk جزئی با `NO_REPLY` شروع شود، **draft/typing streaming** را سرکوب می‌کند؛ بنابراین عملیات بی‌صدا خروجی جزئی
را وسط turn افشا نمی‌کنند.

---

## «flush کردن memory» پیش از Compaction (پیاده‌سازی‌شده)

هدف: پیش از وقوع auto-compaction، یک turn agentic بی‌صدا اجرا شود که state پایدار را
روی دیسک بنویسد (مثلاً `memory/YYYY-MM-DD.md` در workspace عامل)، تا Compaction نتواند
context حیاتی را پاک کند.

OpenClaw از رویکرد **pre-threshold flush** استفاده می‌کند:

1. مصرف context در session را پایش کنید.
2. وقتی از یک «soft threshold» عبور کرد (پایین‌تر از آستانه‌ی Compaction در Pi)، یک دستور بی‌صدا
   برای «اکنون memory را بنویس» به عامل اجرا کنید.
3. از token بی‌صدای دقیق `NO_REPLY` / `no_reply` استفاده کنید تا کاربر
   چیزی نبیند.

Config (`agents.defaults.compaction.memoryFlush`):

- `enabled` (پیش‌فرض: `true`)
- `model` (override اختیاری و دقیق provider/model برای turn مربوط به flush، برای مثال `ollama/qwen3:8b`)
- `softThresholdTokens` (پیش‌فرض: `4000`)
- `prompt` (پیام کاربر برای turn مربوط به flush)
- `systemPrompt` (system prompt اضافی که برای turn مربوط به flush افزوده می‌شود)

نکته‌ها:

- prompt/system prompt پیش‌فرض شامل یک hint با `NO_REPLY` هستند تا تحویل
  سرکوب شود.
- وقتی `model` تنظیم شود، turn مربوط به flush از همان مدل استفاده می‌کند بدون اینکه
  زنجیره‌ی fallback مربوط به session فعال را به ارث ببرد؛ بنابراین خانه‌تکانی فقط-محلی به‌صورت بی‌صدا
  به یک مدل گفت‌وگوی پولی fallback نمی‌کند.
- flush در هر چرخه‌ی Compaction یک‌بار اجرا می‌شود (در `sessions.json` ردیابی می‌شود).
- flush فقط برای sessionهای تعبیه‌شده‌ی Pi اجرا می‌شود (backendهای CLI آن را رد می‌کنند).
- وقتی workspace مربوط به session فقط‌خواندنی باشد (`workspaceAccess: "ro"` یا `"none"`)، flush رد می‌شود.
- برای چیدمان فایل‌های workspace و الگوهای نوشتن، [Memory](/fa/concepts/memory) را ببینید.

Pi همچنین یک hook با نام `session_before_compact` در API افزونه ارائه می‌کند، اما منطق
flush در OpenClaw امروز در سمت Gateway قرار دارد.

---

## چک‌لیست عیب‌یابی

- کلید session اشتباه است؟ از [/concepts/session](/fa/concepts/session) شروع کنید و `sessionKey` را در `/status` تأیید کنید.
- ناهماهنگی بین store و transcript؟ میزبان Gateway و مسیر store را از `openclaw status` تأیید کنید.
- spam شدن Compaction؟ بررسی کنید:
  - پنجره‌ی context مدل (بیش از حد کوچک)
  - تنظیمات Compaction (`reserveTokens` اگر برای پنجره‌ی مدل بیش از حد بالا باشد، می‌تواند باعث Compaction زودتر شود)
  - بادکردن نتیجه‌ی ابزار: session pruning را فعال/تنظیم کنید
- نشت turnهای بی‌صدا؟ تأیید کنید پاسخ با `NO_REPLY` شروع می‌شود (token دقیق و غیرحساس به حروف بزرگ/کوچک) و روی buildی هستید که اصلاح سرکوب streaming را شامل می‌شود.

## مرتبط

- [مدیریت session](/fa/concepts/session)
- [session pruning](/fa/concepts/session-pruning)
- [موتور context](/fa/concepts/context-engine)
