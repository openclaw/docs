---
read_when:
    - مرکز عیب‌یابی برای تشخیص عمیق‌تر شما را به اینجا هدایت کرده است
    - به بخش‌های پایدار راهنمای عملیاتی مبتنی بر نشانه‌ها با فرمان‌های دقیق نیاز دارید
sidebarTitle: Troubleshooting
summary: راهنمای جامع عیب‌یابی برای Gateway، کانال‌ها، خودکارسازی، Nodeها و مرورگر
title: عیب‌یابی
x-i18n:
    generated_at: "2026-07-16T16:58:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f53064a0d42e601ec1a1904fc9d0e8ebb9def7a2fb9d2579c7f10ca675b8f7fd
    source_path: gateway/troubleshooting.md
    workflow: 16
---

این راهنمای عملیاتی عمیق است. برای روند عیب‌یابی سریع، ابتدا از [/help/troubleshooting](/fa/help/troubleshooting) شروع کنید.

## نردبان فرمان‌ها

به این ترتیب اجرا کنید:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

نشانه‌های سلامت:

- `openclaw gateway status`، `Runtime: running`، `Connectivity probe: ok` و یک خط `Capability: ...` را نشان می‌دهد.
- `openclaw doctor` هیچ مشکل مسدودکننده‌ای در پیکربندی/سرویس گزارش نمی‌کند.
- `openclaw channels status --probe` وضعیت زندهٔ انتقال را برای هر حساب و، در صورت پشتیبانی، `works` یا `audit ok` نشان می‌دهد.

## پس از به‌روزرسانی

زمانی استفاده کنید که به‌روزرسانی تمام شده، اما Gateway از کار افتاده است، کانال‌ها خالی هستند یا فراخوانی‌های مدل با خطاهای 401 شکست می‌خورند.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

به این موارد توجه کنید:

- `Update restart` در `openclaw status` / `openclaw status --all`. واگذاری‌های معلق یا ناموفق شامل فرمان بعدی برای اجرا هستند.
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` زیر Channels: پیکربندی کانال همچنان وجود دارد، اما ثبت Plugin پیش از بارگذاری کانال ناموفق بوده است.
- خطاهای 401 ارائه‌دهنده پس از احراز هویت مجدد: `openclaw doctor --fix` سایه‌های منسوخ احراز هویت OAuth هر عامل را بررسی و نسخه‌های قدیمی را حذف می‌کند تا همهٔ عامل‌ها نمایهٔ مشترک فعلی را شناسایی کنند.

## نصب‌های چندپاره و محافظ پیکربندی جدیدتر

زمانی استفاده کنید که سرویس Gateway پس از به‌روزرسانی به‌طور غیرمنتظره متوقف می‌شود، یا گزارش‌ها نشان می‌دهند یک فایل اجرایی `openclaw` از نسخه‌ای که آخرین بار `openclaw.json` را نوشته قدیمی‌تر است.

OpenClaw نوشتن پیکربندی را با `meta.lastTouchedVersion` مهرگذاری می‌کند. فرمان‌های فقط‌خواندنی می‌توانند پیکربندی نوشته‌شده توسط نسخهٔ جدیدتر OpenClaw را بررسی کنند، اما جهش‌های فرایند و سرویس از طریق فایل اجرایی قدیمی‌تر اجرا نمی‌شوند. کنش‌های مسدودشده: راه‌اندازی/توقف/راه‌اندازی مجدد/حذف سرویس Gateway، نصب مجدد اجباری سرویس، راه‌اندازی Gateway در حالت سرویس و پاک‌سازی درگاه `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="اصلاح PATH">
    `PATH` را اصلاح کنید تا `openclaw` به نصب جدیدتر ارجاع دهد، سپس کنش را دوباره اجرا کنید.
  </Step>
  <Step title="نصب مجدد سرویس Gateway">
    سرویس Gateway موردنظر را از نصب جدیدتر دوباره نصب کنید:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="حذف لفاف‌های منسوخ">
    ورودی‌های منسوخ بستهٔ سیستمی یا لفاف‌های قدیمی را که همچنان به فایل اجرایی قدیمی `openclaw` اشاره می‌کنند حذف کنید.
  </Step>
</Steps>

<Warning>
فقط برای تنزل عمدی نسخه یا بازیابی اضطراری، `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` را برای همان یک فرمان تنظیم کنید. برای عملیات عادی آن را تنظیم‌نشده باقی بگذارید.
</Warning>

## ناهماهنگی پروتکل پس از بازگردانی

زمانی استفاده کنید که گزارش‌ها پس از تنزل نسخه یا بازگردانی، پیوسته `protocol mismatch` را چاپ می‌کنند. یک Gateway قدیمی‌تر در حال اجرا است، اما فرایند کلاینت محلی جدیدتری همچنان با محدودهٔ پروتکلی که Gateway قدیمی‌تر قادر به استفاده از آن نیست، دوباره متصل می‌شود.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

به این موارد توجه کنید:

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` در گزارش‌های Gateway.
- `Established clients:` در `openclaw gateway status --deep` یا `Gateway clients` در `openclaw doctor --deep`: کلاینت‌های TCP فعال متصل به درگاه Gateway، همراه با PIDها و خط فرمان‌ها در صورت اجازهٔ سیستم‌عامل.
- فرایند کلاینتی که خط فرمان آن به نصب یا لفاف جدیدتر OpenClaw اشاره دارد که از آن بازگردانی کرده‌اید.

راه‌حل:

1. فرایند منسوخ کلاینت OpenClaw را که `gateway status --deep` نشان می‌دهد متوقف یا دوباره راه‌اندازی کنید.
2. برنامه‌ها یا لفاف‌هایی را که OpenClaw را در خود جای داده‌اند دوباره راه‌اندازی کنید: داشبوردهای محلی، ویرایشگرها، ابزارهای کمکی سرور برنامه یا پوسته‌های طولانی‌مدت `openclaw logs --follow`.
3. `openclaw gateway status --deep` یا `openclaw doctor --deep` را دوباره اجرا و تأیید کنید که PID کلاینت منسوخ حذف شده است.

Gateway قدیمی‌تر را وادار به پذیرش پروتکل جدیدتر و ناسازگار نکنید. افزایش نسخهٔ پروتکل از قرارداد ارتباطی محافظت می‌کند؛ بازیابی پس از بازگردانی، مسئلهٔ پاک‌سازی فرایند/نسخه است.

## رد شدن پیوند نمادین Skill به‌دلیل خروج از مسیر

زمانی استفاده کنید که گزارش‌ها شامل این مورد هستند:

```text
نادیده‌گرفتن مسیر Skill خارج‌شده از ریشهٔ پیکربندی‌شده: ... reason=symlink-escape
```

هر ریشهٔ Skill یک مرز محصورسازی است. پیوند نمادینی زیر `~/.agents/skills`، `<workspace>/.agents/skills`، `<workspace>/skills` یا `~/.openclaw/skills`، هنگامی نادیده گرفته می‌شود که مقصد واقعی آن خارج از آن ریشه قرار گیرد، مگر آنکه مقصد به‌صراحت مورد اعتماد باشد.

پیوند را بررسی کنید:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

اگر مقصد عمدی است، هم ریشهٔ مستقیم Skill و هم مقصد مجاز پیوند نمادین را پیکربندی کنید:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

سپس نشست جدیدی را آغاز کنید یا منتظر بمانید تا پایشگر Skills تازه‌سازی شود. اگر فرایند در حال اجرا مربوط به پیش از تغییر پیکربندی است، Gateway را دوباره راه‌اندازی کنید.

از مقصدهای گسترده‌ای مانند `~`، `/` یا کل پوشهٔ پروژهٔ همگام‌شده استفاده نکنید. دامنهٔ `allowSymlinkTargets` را به ریشهٔ واقعی Skill که شامل پوشه‌های مورد اعتماد `SKILL.md` است محدود نگه دارید.

اگر اعمال Skill Workshop باید در مسیرهای مورد اعتماد و پیوند نمادین Skill در فضای کاری نیز بنویسد، `skills.workshop.allowSymlinkTargetWrites` را فعال کنید. برای ریشه‌های اشتراکی و فقط‌خواندنی Skill، آن را غیرفعال نگه دارید.

مرتبط:

- [پیکربندی Skills](/fa/tools/skills-config#symlinked-skill-roots)
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples#symlinked-sibling-skill-repo)

## نیاز Anthropic 429 به مصرف اضافی برای زمینهٔ طولانی

زمانی استفاده کنید که گزارش‌ها/خطاها شامل این مورد هستند: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

به این موارد توجه کنید:

- مدل انتخاب‌شدهٔ Anthropic یک مدل Claude 4.x با قابلیت عمومی 1M است (Opus 4.6/4.7/4.8، Sonnet 4.6)، یا پیکربندی مدل همچنان دارای `params.context1m: true` قدیمی است.
- اعتبارنامهٔ فعلی Anthropic واجد شرایط استفاده از زمینهٔ طولانی نیست.
- درخواست‌ها فقط در نشست‌های طولانی/اجرای مدل‌هایی که به مسیر زمینهٔ 1M نیاز دارند شکست می‌خورند.

گزینه‌های رفع مشکل:

<Steps>
  <Step title="استفاده از پنجرهٔ زمینهٔ استاندارد">
    به مدلی با پنجرهٔ استاندارد تغییر دهید یا `context1m` قدیمی را از پیکربندی
    مدل قدیمی که برای زمینهٔ 1M قابلیت عمومی ندارد حذف کنید.
  </Step>
  <Step title="استفاده از اعتبارنامهٔ واجد شرایط">
    از اعتبارنامهٔ Anthropic واجد شرایط درخواست‌های زمینهٔ طولانی استفاده کنید، یا به یک کلید API Anthropic تغییر دهید.
  </Step>
  <Step title="پیکربندی مدل‌های جایگزین">
    مدل‌های جایگزین را پیکربندی کنید تا در صورت رد شدن درخواست‌های زمینهٔ طولانی Anthropic، اجراها ادامه یابند.
  </Step>
</Steps>

مرتبط:

- [Anthropic](/fa/providers/anthropic)
- [مصرف توکن و هزینه‌ها](/fa/reference/token-use)
- [چرا خطای HTTP 429 را از Anthropic می‌بینم؟](/fa/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## پاسخ‌های 403 مسدودشده در بالادست

زمانی استفاده کنید که ارائه‌دهندهٔ بالادستی LLM یک `403` عمومی مانند `Your request was blocked` برمی‌گرداند.

فرض نکنید که این مورد همیشه مشکل پیکربندی OpenClaw است. پاسخ ممکن است از یک لایهٔ امنیتی بالادستی مانند CDN، WAF، قانون مدیریت ربات یا پراکسی معکوس جلوی یک نقطهٔ پایانی سازگار با OpenAI صادر شود.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

به این موارد توجه کنید:

- چند مدل زیر یک ارائه‌دهنده به یک شکل شکست می‌خورند.
- متن HTML یا متن امنیتی عمومی به‌جای خطای عادی API ارائه‌دهنده.
- رویدادهای امنیتی سمت ارائه‌دهنده برای زمان همان درخواست.
- موفقیت یک بررسی مستقیم و کوچک `curl` در حالی که درخواست‌های عادی با ساختار SDK شکست می‌خورند.

زمانی که شواهد به مسدودسازی WAF/CDN اشاره دارند، ابتدا پالایش سمت ارائه‌دهنده را اصلاح کنید. برای مسیر API مورداستفادهٔ OpenClaw، یک قانون اجازه یا عبور با دامنهٔ محدود را ترجیح دهید و از غیرفعال کردن محافظت برای کل سایت خودداری کنید.

<Warning>
موفقیت حداقلی `curl` تضمین نمی‌کند که درخواست‌های واقعی به سبک SDK از همان لایهٔ امنیتی بالادستی عبور کنند.
</Warning>

مرتبط:

- [نقاط پایانی سازگار با OpenAI](/fa/gateway/configuration-reference#openai-compatible-endpoints)
- [پیکربندی ارائه‌دهنده](/fa/providers)
- [گزارش‌ها](/fa/logging)

## موفقیت بررسی‌های مستقیم زیرساخت محلی سازگار با OpenAI، اما شکست اجرای عامل‌ها

زمانی استفاده کنید که:

- `curl ... /v1/models` کار می‌کند.
- فراخوانی‌های مستقیم و کوچک `/v1/chat/completions` کار می‌کنند.
- اجرای مدل OpenClaw فقط در نوبت‌های عادی عامل شکست می‌خورد.

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

به این موارد توجه کنید:

- فراخوانی‌های مستقیم و کوچک موفق می‌شوند، اما اجرای OpenClaw فقط در اعلان‌های بزرگ‌تر شکست می‌خورد.
- خطاهای `model_not_found` یا 404، با وجود اینکه `/v1/chat/completions` مستقیم با همان شناسهٔ سادهٔ مدل کار می‌کند.
- خطاهای زیرساخت دربارهٔ انتظار رشته توسط `messages[].content`.
- هشدارهای متناوب `incomplete turn detected ... stopReason=stop payloads=0` با یک زیرساخت محلی سازگار با OpenAI.
- خرابی‌های زیرساخت که فقط با تعداد بیشتر توکن‌های اعلان یا اعلان‌های کامل زمان اجرای عامل رخ می‌دهند.

<AccordionGroup>
  <Accordion title="نشانه‌های رایج">
    - `model_not_found` با یک سرور محلی به سبک MLX/vLLM: بررسی کنید `baseUrl` شامل `/v1` باشد، `api` برای زیرساخت‌های `/v1/chat/completions` برابر `"openai-completions"` باشد و `models.providers.<provider>.models[].id` شناسهٔ سادهٔ محلی ارائه‌دهنده باشد. آن را یک‌بار با پیشوند ارائه‌دهنده انتخاب کنید، برای مثال `mlx/mlx-community/Qwen3-30B-A3B-6bit`؛ ورودی فهرست را به‌صورت `mlx-community/Qwen3-30B-A3B-6bit` نگه دارید.
    - `messages[...].content: invalid type: sequence, expected a string`: زیرساخت بخش‌های محتوای ساختاریافتهٔ Chat Completions را رد می‌کند. راه‌حل: `models.providers.<provider>.models[].compat.requiresStringContent: true` را تنظیم کنید.
    - `validation.keys` یا کلیدهای مجاز پیام مانند `["role","content"]`: زیرساخت فرادادهٔ بازپخش به سبک OpenAI را در پیام‌های Chat Completions رد می‌کند. راه‌حل: `models.providers.<provider>.models[].compat.strictMessageKeys: true` را تنظیم کنید.
    - `incomplete turn detected ... stopReason=stop payloads=0`: زیرساخت درخواست Chat Completions را تکمیل کرده، اما برای آن نوبت هیچ متن قابل‌مشاهده‌ای از دستیار برنگردانده است. OpenClaw نوبت‌های خالی و بازپخش‌پذیر سازگار با OpenAI را یک‌بار دوباره امتحان می‌کند؛ شکست‌های مداوم معمولاً به این معنا هستند که زیرساخت محتوای خالی/غیرمتنی تولید می‌کند یا متن پاسخ نهایی را سرکوب می‌کند.
    - درخواست‌های مستقیم و کوچک موفق می‌شوند، اما اجرای عامل OpenClaw با خرابی زیرساخت/مدل شکست می‌خورد (برای مثال Gemma در برخی نسخه‌های `inferrs`): انتقال OpenClaw احتمالاً از قبل صحیح است؛ زیرساخت در ساختار بزرگ‌تر اعلان زمان اجرای عامل شکست می‌خورد.
    - پس از غیرفعال کردن ابزارها، شکست‌ها کاهش می‌یابند اما ناپدید نمی‌شوند: طرح‌واره‌های ابزار بخشی از فشار بودند، اما مشکل باقی‌مانده همچنان ظرفیت مدل/سرور بالادستی یا اشکال زیرساخت است.

  </Accordion>
  <Accordion title="گزینه‌های رفع مشکل">
    1. برای زیرساخت‌های Chat Completions که فقط رشته می‌پذیرند، `compat.requiresStringContent: true` را تنظیم کنید.
    2. برای زیرساخت‌های سخت‌گیر Chat Completions که در هر پیام فقط `role` و `content` را می‌پذیرند، `compat.strictMessageKeys: true` را تنظیم کنید.
    3. برای مدل‌ها/زیرساخت‌هایی که نمی‌توانند سطح طرح‌وارهٔ ابزار OpenClaw را به‌طور قابل‌اعتماد مدیریت کنند، `compat.supportsTools: false` را تنظیم کنید.
    4. در صورت امکان فشار اعلان را کاهش دهید: راه‌اندازی اولیهٔ کوچک‌تر فضای کاری، تاریخچهٔ کوتاه‌تر نشست، مدل محلی سبک‌تر یا زیرساختی با پشتیبانی قوی‌تر از زمینهٔ طولانی.
    5. اگر درخواست‌های مستقیم و کوچک همچنان موفق هستند، اما نوبت‌های عامل OpenClaw درون زیرساخت باز هم خراب می‌شوند، آن را محدودیت سرور/مدل بالادستی در نظر بگیرید و گزارشی برای بازتولید مشکل همراه با ساختار محمولهٔ پذیرفته‌شده در آنجا ثبت کنید.
  </Accordion>
</AccordionGroup>

مرتبط:

- [پیکربندی](/fa/gateway/configuration)
- [مدل‌های محلی](/fa/gateway/local-models)
- [نقاط پایانی سازگار با OpenAI](/fa/gateway/configuration-reference#openai-compatible-endpoints)

## پاسخی دریافت نمی‌شود

اگر کانال‌ها فعال‌اند اما هیچ پاسخی دریافت نمی‌شود، پیش از اتصال مجدد هر چیزی، مسیریابی و خط‌مشی را بررسی کنید.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

به‌دنبال این موارد بگردید:

- در انتظار بودن جفت‌سازی برای فرستندگان پیام خصوصی.
- محدودسازی بر اساس منشن در گروه (`requireMention`، `mentionPatterns`).
- عدم تطابق فهرست‌های مجاز کانال/گروه.

نشانه‌های رایج:

- `drop guild message (mention required` ← پیام گروه تا زمان منشن نادیده گرفته می‌شود.
- `pairing request` ← فرستنده به تأیید نیاز دارد.
- `blocked` / `allowlist` ← فرستنده/کانال توسط خط‌مشی فیلتر شده است.

مطالب مرتبط:

- [عیب‌یابی کانال](/fa/channels/troubleshooting)
- [گروه‌ها](/fa/channels/groups)
- [جفت‌سازی](/fa/channels/pairing)

## اتصال رابط کاربری کنترل داشبورد

هنگامی که داشبورد/رابط کاربری کنترل متصل نمی‌شود، نشانی URL، حالت احراز هویت و فرضیات مربوط به زمینهٔ امن را اعتبارسنجی کنید.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

به‌دنبال این موارد بگردید:

- درستی URL کاوش و URL داشبورد.
- عدم تطابق حالت احراز هویت/توکن میان کلاینت و Gateway.
- استفاده از HTTP در جایی که هویت دستگاه الزامی است.

اگر پس از به‌روزرسانی، مرورگر محلی نمی‌تواند به `127.0.0.1:18789` متصل شود، ابتدا سرویس محلی Gateway را بازیابی و تأیید کنید که داشبورد را ارائه می‌دهد:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

اگر `curl` محتوای HTML مربوط به OpenClaw را برمی‌گرداند، Gateway کار می‌کند و مشکل باقی‌مانده احتمالاً کش مرورگر، یک پیوند عمیق قدیمی یا وضعیت منقضی‌شدهٔ زبانه است. `http://127.0.0.1:18789` را مستقیماً باز کنید و از داشبورد پیمایش کنید. اگر پس از راه‌اندازی مجدد سرویس در حال اجرا باقی نمی‌ماند، `openclaw gateway start` را اجرا و `openclaw gateway status` را دوباره بررسی کنید.

<AccordionGroup>
  <Accordion title="نشانه‌های اتصال / احراز هویت">
    - `device identity required` ← زمینهٔ ناامن یا نبود احراز هویت دستگاه.
    - `origin not allowed` ← `Origin` مرورگر در `gateway.controlUi.allowedOrigins` نیست (یا از مبدأ مرورگری غیر از loopback و بدون فهرست مجاز صریح متصل می‌شوید).
    - `device nonce required` / `device nonce mismatch` ← کلاینت جریان احراز هویت مبتنی بر چالش دستگاه را تکمیل نمی‌کند (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` ← کلاینت برای دست‌دهی جاری، محتوای نادرست (یا مُهر زمانی منقضی‌شده) را امضا کرده است.
    - `AUTH_TOKEN_MISMATCH` همراه با `canRetryWithDeviceToken=true` ← کلاینت می‌تواند یک بار با توکن دستگاه ذخیره‌شده در کش، تلاش مجدد قابل‌اعتماد انجام دهد.
    - آن تلاش مجدد با توکن کش‌شده، مجموعهٔ محدوده‌های ذخیره‌شده همراه توکن دستگاه جفت‌شده را دوباره استفاده می‌کند. در عوض، فراخوانندگان صریح `deviceToken` / صریح `scopes` مجموعهٔ محدودهٔ درخواستی خود را حفظ می‌کنند.
    - `AUTH_SCOPE_MISMATCH` ← توکن دستگاه شناسایی شده است، اما محدوده‌های تأییدشدهٔ آن این درخواست اتصال را پوشش نمی‌دهند؛ به‌جای چرخاندن توکن مشترک Gateway، دوباره جفت‌سازی کنید یا قرارداد محدودهٔ درخواستی را تأیید کنید.
    - خارج از آن مسیر تلاش مجدد، اولویت احراز هویت اتصال به‌ترتیب عبارت است از: ابتدا توکن/گذرواژهٔ مشترک صریح، سپس `deviceToken` صریح، بعد توکن ذخیره‌شدهٔ دستگاه و در پایان توکن راه‌اندازی اولیه.
    - در مسیر ناهمگام رابط کاربری کنترل Tailscale Serve، تلاش‌های ناموفق برای همان `{scope, ip}` پیش از ثبت شکست توسط محدودکننده، به‌صورت ترتیبی اجرا می‌شوند. بنابراین، دو تلاش مجدد نامعتبر و هم‌زمان از یک کلاینت ممکن است در تلاش دوم، به‌جای دو عدم تطابق ساده، `retry later` را نشان دهند.
    - `too many failed authentication attempts (retry later)` از یک کلاینت loopback با مبدأ مرورگر ← شکست‌های تکراری از همان `Origin` نرمال‌شده موقتاً مسدود می‌شوند؛ یک مبدأ localhost دیگر از سطل جداگانه‌ای استفاده می‌کند.
    - تکرار `unauthorized` پس از آن تلاش مجدد ← توکن مشترک/توکن دستگاه از هم منحرف شده‌اند؛ پیکربندی توکن را تازه‌سازی و در صورت نیاز توکن دستگاه را دوباره تأیید/تعویض کنید.
    - `gateway connect failed:` ← مقصد میزبان/درگاه/URL نادرست است.

  </Accordion>
</AccordionGroup>

### نگاشت سریع کدهای جزئیات احراز هویت

برای انتخاب اقدام بعدی، از `error.details.code` در پاسخ ناموفق `connect` استفاده کنید:

| کد جزئیات                  | معنا                                                                                                                                                                                      | اقدام پیشنهادی                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | کلاینت توکن مشترک الزامی را ارسال نکرده است.                                                                                                                                                 | توکن را در کلاینت جای‌گذاری/تنظیم و دوباره تلاش کنید. برای مسیرهای داشبورد: `openclaw config get gateway.auth.token` و سپس آن را در تنظیمات رابط کاربری کنترل جای‌گذاری کنید.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | توکن مشترک با توکن احراز هویت Gateway مطابقت ندارد.                                                                                                                                               | اگر `canRetryWithDeviceToken=true` است، یک تلاش مجدد قابل‌اعتماد را مجاز کنید. تلاش‌های مجدد با توکن کش‌شده، محدوده‌های تأییدشدهٔ ذخیره‌شده را دوباره استفاده می‌کنند؛ فراخوانندگان صریح `deviceToken` / `scopes` محدوده‌های درخواستی را حفظ می‌کنند. اگر همچنان ناموفق بود، [فهرست بررسی بازیابی انحراف توکن](/fa/cli/devices#token-drift-recovery-checklist) را اجرا کنید. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | توکن کش‌شدهٔ هر دستگاه منقضی یا لغو شده است.                                                                                                                                                 | با استفاده از [CLI دستگاه‌ها](/fa/cli/devices)، توکن دستگاه را تعویض/دوباره تأیید کنید و سپس مجدداً متصل شوید.                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | توکن دستگاه معتبر است، اما نقش/محدوده‌های تأییدشدهٔ آن این درخواست اتصال را پوشش نمی‌دهند.                                                                                                       | دستگاه را دوباره جفت کنید یا قرارداد محدودهٔ درخواستی را تأیید کنید؛ این مورد را انحراف توکن مشترک در نظر نگیرید.                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | هویت دستگاه به تأیید نیاز دارد. `error.details.reason` را از نظر `not-paired`، `scope-upgrade`، `role-upgrade` یا `metadata-upgrade` بررسی کنید و در صورت وجود، از `requestId` / `remediationHint` استفاده کنید. | درخواست در انتظار را تأیید کنید: `openclaw devices list` و سپس `openclaw devices approve <requestId>`. ارتقای محدوده/نقش پس از بررسی دسترسی درخواستی، از همین جریان استفاده می‌کند.                                                                                                               |

<Note>
فراخوانی‌های مستقیم RPC پشتی loopback که با توکن/گذرواژهٔ مشترک Gateway احراز هویت شده‌اند، نباید به خط پایهٔ محدودهٔ دستگاه جفت‌شدهٔ CLI وابسته باشند. اگر زیرعامل‌ها یا دیگر فراخوانی‌های داخلی همچنان با `scope-upgrade` ناموفق‌اند، تأیید کنید که فراخواننده از `client.id: "gateway-client"` و `client.mode: "backend"` استفاده می‌کند و `deviceIdentity` صریح یا توکن دستگاه را تحمیل نمی‌کند.
</Note>

بررسی مهاجرت احراز هویت دستگاه نسخهٔ ۲:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

اگر گزارش‌ها خطاهای nonce/امضا را نشان می‌دهند، کلاینت متصل‌شونده را به‌روزرسانی و آن را تأیید کنید:

<Steps>
  <Step title="انتظار برای connect.challenge">
    کلاینت منتظر `connect.challenge` صادرشده توسط Gateway می‌ماند.
  </Step>
  <Step title="امضای محتوا">
    کلاینت محتوای مقید به چالش را امضا می‌کند.
  </Step>
  <Step title="ارسال nonce دستگاه">
    کلاینت `connect.params.device.nonce` را با همان nonce چالش ارسال می‌کند.
  </Step>
</Steps>

اگر `openclaw devices rotate` / `revoke` / `remove` به‌طور غیرمنتظره رد شد:

- نشست‌های توکن دستگاه جفت‌شده فقط می‌توانند دستگاه **خودشان** را مدیریت کنند، مگر اینکه فراخواننده `operator.admin` را نیز داشته باشد.
- `openclaw devices rotate --scope ...` فقط می‌تواند محدوده‌های اپراتوری را درخواست کند که نشست فراخواننده از پیش در اختیار دارد.

مطالب مرتبط:

- [پیکربندی](/fa/gateway/configuration) (حالت‌های احراز هویت Gateway)
- [رابط کاربری کنترل](/fa/web/control-ui)
- [دستگاه‌ها](/fa/cli/devices)
- [دسترسی از راه دور](/fa/gateway/remote)
- [احراز هویت پراکسی قابل‌اعتماد](/fa/gateway/trusted-proxy-auth)

## سرویس Gateway اجرا نمی‌شود

هنگامی استفاده کنید که سرویس نصب شده، اما فرایند در حال اجرا باقی نمی‌ماند.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # سرویس‌های سطح سیستم را نیز اسکن کنید
```

به‌دنبال این موارد بگردید:

- `Runtime: stopped` همراه با راهنمایی‌های خروج.
- عدم تطابق پیکربندی سرویس (`Config (cli)` در برابر `Config (service)`).
- تداخل درگاه/شنونده.
- نصب‌های اضافی launchd/systemd/schtasks هنگام استفاده از `--deep`.
- راهنمایی‌های پاک‌سازی `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="نشانه‌های رایج">
    - `Gateway start blocked: set gateway.mode=local` یا `existing config is missing gateway.mode` ← حالت Gateway محلی فعال نیست، یا فایل پیکربندی بازنویسی شده و `gateway.mode` را از دست داده است. راه‌حل: `gateway.mode="local"` را در پیکربندی خود تنظیم کنید، یا `openclaw onboard --mode local` / `openclaw setup` را دوباره اجرا کنید تا پیکربندی مورد انتظار حالت محلی مجدداً ثبت شود. اگر OpenClaw را از طریق Podman اجرا می‌کنید، مسیر پیش‌فرض پیکربندی `~/.openclaw/openclaw.json` است.
    - `refusing to bind gateway ... without auth` ← اتصال غیر loopback بدون مسیر معتبر احراز هویت Gateway (توکن/گذرواژه، یا پراکسی قابل‌اعتماد در صورت پیکربندی).
    - `another gateway instance is already listening` / `EADDRINUSE` ← تداخل درگاه.
    - `Other gateway-like services detected (best effort)` ← واحدهای منقضی‌شده یا موازی launchd/systemd/schtasks وجود دارند. در بیشتر راه‌اندازی‌ها باید در هر دستگاه یک Gateway نگه‌داری شود؛ اگر واقعاً به بیش از یکی نیاز دارید، درگاه‌ها + پیکربندی/وضعیت/فضای کاری را از هم جدا کنید. به [/gateway#multiple-gateways-same-host](/fa/gateway#multiple-gateways-same-host) مراجعه کنید.
    - `System-level OpenClaw gateway service detected` از doctor ← یک واحد سیستمی systemd وجود دارد، در حالی که سرویس سطح کاربر موجود نیست. پیش از اجازه دادن به doctor برای نصب سرویس کاربر، مورد تکراری را حذف یا غیرفعال کنید؛ یا اگر واحد سیستمی سرپرست موردنظر است، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید.
    - `Gateway service port does not match current gateway config` ← سرپرست نصب‌شده همچنان `--port` قدیمی را ثابت نگه داشته است. `openclaw doctor --fix` یا `openclaw gateway install --force` را اجرا و سپس سرویس Gateway را راه‌اندازی مجدد کنید.

  </Accordion>
</AccordionGroup>

مطالب مرتبط:

- [اجرای پس‌زمینه و ابزار فرایند](/fa/gateway/background-process)
- [پیکربندی](/fa/gateway/configuration)
- [Doctor](/fa/gateway/doctor)

## Gateway در macOS بی‌سروصدا از پاسخ‌گویی بازمی‌ایستد و با دست‌کاری داشبورد دوباره ادامه می‌دهد

زمانی استفاده کنید که کانال‌ها (Telegram، WhatsApp و غیره) روی یک میزبان macOS هر بار برای چند دقیقه تا چند ساعت بی‌صدا می‌شوند و به‌نظر می‌رسد Gateway درست در لحظه‌ای که Control UI را باز می‌کنید، از طریق SSH متصل می‌شوید یا به‌شکل دیگری با میزبان تعامل می‌کنید، دوباره فعال می‌شود. معمولاً نشانه آشکاری در `openclaw status` وجود ندارد، زیرا تا زمانی که بررسی را آغاز کنید، Gateway دوباره فعال شده است.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

به‌دنبال موارد زیر بگردید:

- یک یا چند بسته `*-uncaught_exception.json` در `~/.openclaw/logs/stability/` که در آن‌ها `error.code` روی یک کد گذرای شبکه مانند `ENETDOWN`، `ENETUNREACH`، `EHOSTUNREACH` یا `ECONNREFUSED` تنظیم شده است.
- خطوط `pmset -g log` مانند `Entering Sleep state due to 'Maintenance Sleep'` یا `en0 driver is slow (msg: WillChangeState to 0)` که با مُهرهای زمانی خرابی هم‌زمان هستند. Power Nap / Maintenance Sleep برای مدت کوتاهی درایور Wi-Fi را در وضعیت 0 قرار می‌دهد؛ هر `connect()` خروجی که در این بازه رخ دهد، حتی روی میزبانی که در حالت عادی اتصال کامل شبکه دارد، ممکن است با `ENETDOWN` شکست بخورد.
- خروجی `launchctl print` که `state = not running` را همراه با چندین `runs` اخیر و یک کد خروج نشان می‌دهد، به‌ویژه هنگامی که فاصله میان خرابی و اجرای بعدی در حد یک ساعت است، نه چند ثانیه. launchd در macOS پس از وقوع چند خرابی پیاپی، یک سازوکار محافظتی مستندنشده برای اجرای مجدد اعمال می‌کند که ممکن است تا زمانی که یک محرک خارجی مانند ورود تعاملی، اتصال داشبورد یا `launchctl kickstart` آن را دوباره فعال کند، از رعایت `KeepAlive=true` بازبماند.

نشانه‌های رایج:

- یک بسته پایداری که `error.code` آن `ENETDOWN` یا یک کد مشابه است و پشته فراخوانی به `net` در Node، یعنی `lookupAndConnect` / `Socket.connect`، اشاره می‌کند. OpenClaw `2026.5.26` و نسخه‌های جدیدتر این موارد را به‌عنوان خطاهای گذرای بی‌خطر شبکه دسته‌بندی می‌کنند تا دیگر به کنترل‌کننده سطح‌بالای خطاهای مدیریت‌نشده منتقل نشوند؛ اگر از نسخه‌ای قدیمی‌تر استفاده می‌کنید، ابتدا ارتقا دهید.
- دوره‌های طولانی سکوت که درست در لحظه اتصال به Control UI یا ورود از طریق SSH به میزبان پایان می‌یابند: فعالیت قابل‌مشاهده کاربر همان چیزی است که سازوکار اجرای مجدد launchd را دوباره فعال می‌کند، نه کاری که داشبورد روی Gateway انجام می‌دهد.
- افزایش شمار `runs` در طول روز، بدون وجود خط متناظر `received SIG*; shutting down` در `~/Library/Logs/openclaw/gateway.log`: خاموش‌شدن‌های عادی یک سیگنال را ثبت می‌کنند؛ خرابی‌های گذرا چنین نمی‌کنند.

اقدامات لازم:

1. اگر نسخه‌ای پیش از `2026.5.26` را اجرا می‌کنید، **Gateway را ارتقا دهید**. پس از ارتقا، خطاهای `ENETDOWN` در آینده به‌جای خاتمه‌دادن به فرایند، به‌صورت هشدار ثبت می‌شوند.
2. در میزبان‌های Mac mini / دسکتاپ که قرار است به‌عنوان سرورهای همیشه‌روشن کار کنند، **فعالیت خواب نگه‌داری را کاهش دهید**:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   این کار ناپایداری درایور زیربنایی را به‌طور چشمگیری کاهش می‌دهد، اما کاملاً از بین نمی‌برد. سیستم ممکن است صرف‌نظر از این پرچم‌ها همچنان برای TCP keepalive و نگه‌داری mDNS برخی خواب‌های نگه‌داری را انجام دهد.

3. یک **نظارت‌گر زنده‌بودن اضافه کنید** تا اگر در آینده launchd پس از چند خرابی پیاپی فرایند را متوقف نگه داشت، مشکل سریعاً شناسایی شود:

   ```bash
   # نمونه بررسی زنده‌بودن آگاه از launchd، مناسب برای یک cron یا LaunchAgent پنج‌دقیقه‌ای
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   هدف، فعال‌سازی خارجی دوباره سازوکار اجرای مجدد است؛ پس از چند خرابی پیاپی در macOS، `KeepAlive=true` به‌تنهایی کافی نیست.

مرتبط:

- [یادداشت‌های پلتفرم macOS](/fa/platforms/macos)
- [ثبت گزارش](/fa/logging)
- [Doctor](/fa/gateway/doctor)

## حلقه ناظر launchd در macOS با Gateway/Node LaunchAgentهای تکراری

زمانی از این راهنما استفاده کنید که یک نصب macOS هر چند ثانیه یک‌بار راه‌اندازی مجدد می‌شود، بررسی‌های سلامت `openclaw`
به‌تناوب وضعیت سالم و دردسترس‌نبودن را نشان می‌دهند و ارسال کانال متوقف می‌شود،
با اینکه ظاهراً سرویس در حال اجرا است.

این وضعیت در نصب‌های قدیمی‌تر مشاهده شده است که در آن‌ها هر دو LaunchAgent یعنی `ai.openclaw.gateway` و
`ai.openclaw.node` فعال بودند و هرکدام
`OPENCLAW_LAUNCHD_LABEL` را تزریق می‌کردند. در این وضعیت، OpenClaw می‌تواند نظارت launchd را
تشخیص دهد، تلاش کند راه‌اندازی مجدد را دوباره به launchd واگذار کند و به‌جای یک فرایند پایدار Gateway،
در یک حلقه سریع `EADDRINUSE`/اجرای مجدد گرفتار شود.

```bash
for i in 1 2 3 4; do
  ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
  sleep 10
done

openclaw gateway status --deep
openclaw node status
launchctl print gui/$UID/ai.openclaw.gateway | grep -E 'state|last exit|runs'
tail -n 80 ~/Library/Logs/openclaw/gateway.log
```

به‌دنبال موارد زیر بگردید:

- وجود بیش از یک PID برای Gateway در نمونه 30 ثانیه‌ای، به‌جای یک
  فرایند پایدار.
- `EADDRINUSE`، `another gateway instance is already listening` یا خطوط تکراری
  راه‌اندازی مجدد/واگذاری در `gateway.log`.
- بارگذاری هم‌زمان هر دو `~/Library/LaunchAgents/ai.openclaw.gateway.plist` و
  `~/Library/LaunchAgents/ai.openclaw.node.plist` روی میزبانی که باید فقط یک سرویس
  مدیریت‌شده Gateway را اجرا کند.

اقدامات لازم:

1. اگر این میزبان باید فقط سرویس Gateway را اجرا کند، سرویس مدیریت‌شده Node را
   از طریق OpenClaw حذف کنید. اگر برای قابلیت‌های Node راه‌دور فعالانه به سرویس Node
   وابسته هستید، **از این مرحله صرف‌نظر کنید**؛ حذف آن، این قابلیت‌ها را روی
   این میزبان متوقف می‌کند:

   ```bash
   openclaw node uninstall
   ```

2. یک پوشش پایدار برای Gateway نصب کنید که پیش از اجرای OpenClaw،
   نشانگرهای به‌ارث‌رسیده launchd را پاک کند. از گزینه پشتیبانی‌شده `--wrapper` استفاده کنید؛
   فایل تولیدشده در `~/.openclaw/service-env/` را ویرایش نکنید، زیرا نصب مجدد سرویس،
   به‌روزرسانی و تعمیر Doctor آن فایل را دوباره تولید می‌کنند:

   ```bash
   mkdir -p ~/.local/bin
   cat >~/.local/bin/openclaw-launchd-workaround <<'EOF'
   #!/bin/sh
   set -eu
   unset OPENCLAW_LAUNCHD_LABEL LAUNCH_JOB_LABEL LAUNCH_JOB_NAME XPC_SERVICE_NAME || true
   exec openclaw "$@"
   EOF
   chmod 700 ~/.local/bin/openclaw-launchd-workaround

   openclaw gateway install \
     --wrapper ~/.local/bin/openclaw-launchd-workaround \
     --force
   ```

   `gateway install` مسیر پوشش را در نصب‌های مجدد اجباری،
   به‌روزرسانی‌ها و تعمیرات Doctor حفظ می‌کند.

3. بررسی کنید که Gateway پایدار است و RPC را ارائه می‌کند، نه اینکه صرفاً در حال گوش‌دادن باشد:

   ```bash
   openclaw gateway status --deep --require-rpc

   for i in 1 2 3 4; do
     ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
     sleep 10
   done
   ```

   نمونه PID باید به‌جای مجموعه‌ای چرخشی از PIDها، یک فرایند پایدار را نشان دهد
   و ارسال کانال ورودی باید از سر گرفته شود.

4. پس از ارتقا به نسخه‌ای که حلقه زیربنایی دو LaunchAgent در آن
   برطرف شده است، راهکار موقت را حذف و سرویس مدیریت‌شده عادی را دوباره نصب کنید:

   ```bash
   OPENCLAW_WRAPPER= openclaw gateway install --force
   rm ~/.local/bin/openclaw-launchd-workaround
   ```

مرتبط:

- [یادداشت‌های پلتفرم macOS](/fa/platforms/mac/bundled-gateway)
- [Doctor](/fa/gateway/doctor)
- [CLI مربوط به Gateway](/fa/cli/gateway)

## خروج Gateway هنگام مصرف زیاد حافظه

زمانی استفاده کنید که Gateway زیر بار ناپدید می‌شود، ناظر یک راه‌اندازی مجدد از نوع OOM گزارش می‌کند یا گزارش‌ها به `critical memory pressure bundle written` اشاره دارند.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

به‌دنبال موارد زیر بگردید:

- `Reason: diagnostic.memory.pressure.critical` در جدیدترین بسته پایداری.
- `Memory pressure:` همراه با `critical/rss_threshold`، `critical/heap_threshold` یا `critical/rss_growth`.
- مقادیر `V8 heap:` نزدیک به حد heap.
- ورودی‌های `Largest session files:` مانند `agents/<agent>/sessions/<session>.jsonl` یا `sessions/<session>.jsonl`.
- شمارنده‌های حافظه cgroup در Linux، هنگامی که Gateway داخل یک کانتینر یا سرویس دارای محدودیت حافظه اجرا می‌شود.

نشانه‌های رایج:

- `critical memory pressure bundle written` کمی پیش از راه‌اندازی مجدد ظاهر می‌شود ← OpenClaw یک بسته پایداری پیش از OOM ثبت کرده است. آن را با `openclaw gateway stability --bundle latest` بررسی کنید.
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` در گزارش‌های Gateway ظاهر می‌شود ← OpenClaw فشار بحرانی حافظه را تشخیص داده است، اما ثبت لحظه‌ای پایداری پیش از OOM غیرفعال است.
- `Largest session files:` به یک مسیر بسیار بزرگ و ویرایش‌شده رونوشت اشاره می‌کند ← تاریخچه نشست نگه‌داری‌شده را کاهش دهید، رشد نشست را بررسی کنید یا پیش از راه‌اندازی مجدد، رونوشت‌های قدیمی را از مخزن فعال خارج کنید.
- بایت‌های استفاده‌شده `V8 heap:` نزدیک به حد heap هستند ← فشار پرامپت/نشست را کاهش دهید، کار هم‌زمان را کمتر کنید یا تنها پس از تأیید موردانتظاربودن بار کاری، حد heap در Node را افزایش دهید.
- `Memory pressure: critical/rss_growth` ← حافظه درون یک بازه نمونه‌برداری به‌سرعت افزایش یافته است. جدیدترین گزارش‌ها را برای یک واردسازی بزرگ، خروجی مهارنشده ابزار، تلاش‌های مجدد تکراری یا دسته‌ای از کارهای عامل در صف بررسی کنید.
- فشار بحرانی حافظه در گزارش‌ها ظاهر می‌شود، اما بسته‌ای وجود ندارد ← این حالت پیش‌فرض است. `diagnostics.memoryPressureSnapshot: true` را تنظیم کنید تا در رخدادهای فشار بحرانی حافظه در آینده، بسته پایداری پیش از OOM ثبت شود.

بسته پایداری فاقد محتوای بار داده است. این بسته شامل شواهد عملیاتی حافظه و مسیرهای نسبی ویرایش‌شده فایل‌ها است، نه متن پیام، بدنه Webhook، اعتبارنامه‌ها، توکن‌ها، کوکی‌ها یا شناسه‌های خام نشست. به‌جای کپی‌کردن گزارش‌های خام، خروجی عیب‌یابی را به گزارش‌های اشکال پیوست کنید.

مرتبط:

- [سلامت Gateway](/fa/gateway/health)
- [خروجی عیب‌یابی](/fa/gateway/diagnostics)
- [نشست‌ها](/fa/cli/sessions)

## رد پیکربندی نامعتبر توسط Gateway

زمانی استفاده کنید که راه‌اندازی Gateway با `Invalid config` شکست می‌خورد یا گزارش‌های بارگذاری مجدد پویا اعلام می‌کنند که یک ویرایش نامعتبر نادیده گرفته شده است.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

به‌دنبال موارد زیر بگردید:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- یک فایل `openclaw.json.rejected.*` دارای مُهر زمانی در کنار پیکربندی فعال.
- یک فایل `openclaw.json.clobbered.*` دارای مُهر زمانی، اگر `doctor --fix` یک ویرایش مستقیم خراب را تعمیر کرده باشد.
- OpenClaw جدیدترین 32 فایل `.clobbered.*` را برای هر مسیر پیکربندی نگه می‌دارد و فایل‌های قدیمی‌تر را به‌صورت چرخشی حذف می‌کند.

<AccordionGroup>
  <Accordion title="چه اتفاقی افتاد">
    - پیکربندی هنگام راه‌اندازی، بارگذاری مجدد پویا یا یک نوشتن متعلق به OpenClaw اعتبارسنجی نشد.
    - راه‌اندازی Gateway به‌صورت بسته شکست می‌خورد و `openclaw.json` را بازنویسی نمی‌کند.
    - بارگذاری مجدد پویا، ویرایش‌های خارجی نامعتبر را نادیده می‌گیرد و پیکربندی فعلی زمان اجرا را فعال نگه می‌دارد.
    - نوشتن‌های متعلق به OpenClaw، محتوای نامعتبر/مخرب را پیش از ثبت رد می‌کنند و `.rejected.*` را ذخیره می‌کنند.
    - تعمیر بر عهده `openclaw doctor --fix` است. این بخش می‌تواند پیشوندهای غیر JSON را حذف کند یا آخرین نسخه سالم شناخته‌شده را بازیابی کند، درحالی‌که محتوای ردشده را به‌صورت `.clobbered.*` حفظ می‌کند.
    - هنگامی که تعمیرات زیادی برای یک مسیر پیکربندی انجام می‌شود، OpenClaw فایل‌های قدیمی‌تر `.clobbered.*` را به‌صورت چرخشی حذف می‌کند تا جدیدترین محتوای تعمیرشده همچنان در دسترس باشد.

  </Accordion>
  <Accordion title="بررسی و تعمیر">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="نشانه‌های رایج">
    - `.clobbered.*` وجود دارد → doctor هنگام تعمیر پیکربندی فعال، یک ویرایش خارجی معیوب را حفظ کرده است.
    - `.rejected.*` وجود دارد → نوشتن پیکربندی تحت مالکیت OpenClaw پیش از ثبت، در بررسی‌های طرح‌واره یا بازنویسی مخرب ناموفق بوده است.
    - `Config write rejected:` → عملیات نوشتن تلاش کرده است ساختار الزامی را حذف کند، اندازه فایل را به‌شدت کاهش دهد یا پیکربندی نامعتبر را ماندگار کند.
    - `config reload skipped (invalid config):` → یک ویرایش مستقیم در اعتبارسنجی ناموفق بوده و Gateway در حال اجرا آن را نادیده گرفته است.
    - `Invalid config at ...` → راه‌اندازی پیش از بالا آمدن سرویس‌های Gateway ناموفق بوده است.
    - `missing-meta-vs-last-good`، `gateway-mode-missing-vs-last-good` یا `size-drop-vs-last-good:*` → یک عملیات نوشتن تحت مالکیت OpenClaw رد شده است، زیرا در مقایسه با آخرین نسخه پشتیبان سالم، فیلدها یا حجم را از دست داده است.
    - `Config last-known-good promotion skipped` → گزینه پیشنهادی شامل جای‌نگهدارهای اسرار ویرایش‌شده مانند `***` بوده است.

  </Accordion>
  <Accordion title="گزینه‌های رفع مشکل">
    1. `openclaw doctor --fix` را اجرا کنید تا doctor پیکربندی پیشونددار/بازنویسی‌شده را تعمیر کند یا آخرین نسخه سالم را بازیابی کند.
    2. فقط کلیدهای موردنظر را از `.clobbered.*` یا `.rejected.*` کپی کنید، سپس آن‌ها را با `openclaw config set` یا `config.patch` اعمال کنید.
    3. پیش از راه‌اندازی مجدد، `openclaw config validate` را اجرا کنید.
    4. اگر به‌صورت دستی ویرایش می‌کنید، پیکربندی کامل JSON5 را نگه دارید، نه فقط شیء جزئی‌ای را که قصد تغییرش را داشتید.
  </Accordion>
</AccordionGroup>

مرتبط:

- [پیکربندی](/fa/cli/config)
- [پیکربندی: بارگذاری مجدد فوری](/fa/gateway/configuration#config-hot-reload)
- [پیکربندی: اعتبارسنجی سخت‌گیرانه](/fa/gateway/configuration#strict-validation)
- [Doctor](/fa/gateway/doctor)

## هشدارهای کاوش Gateway

زمانی استفاده کنید که `openclaw gateway probe` به چیزی دسترسی پیدا می‌کند، اما همچنان یک بلوک هشدار چاپ می‌کند.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

به‌دنبال این موارد بگردید:

- `warnings[].code` و `primaryTargetId` در خروجی JSON.
- اینکه هشدار درباره بازگشت به SSH، چند Gateway، محدوده‌های دسترسی ازدست‌رفته یا ارجاع‌های احراز هویت حل‌نشده است.

نشانه‌های رایج:

- `SSH tunnel failed to start; falling back to direct probes.` → راه‌اندازی SSH ناموفق بود، اما فرمان همچنان اهداف مستقیم پیکربندی‌شده/loopback را امتحان کرد.
- `multiple reachable gateway identities detected` → Gatewayهای متمایزی پاسخ دادند، یا OpenClaw نتوانست ثابت کند اهداف قابل‌دسترسی همان Gateway هستند. یک تونل SSH، نشانی پروکسی یا نشانی راه‌دور پیکربندی‌شده به همان Gateway، حتی وقتی درگاه‌های انتقال متفاوت باشند، یک Gateway با چند روش انتقال محسوب می‌شود.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → اتصال برقرار شد، اما RPC جزئیات به محدوده دسترسی محدود است؛ هویت دستگاه را جفت کنید یا از اعتبارنامه‌هایی با `operator.read` استفاده کنید.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → اتصال برقرار شد، اما مجموعه کامل RPCهای تشخیصی به پایان مهلت رسید یا ناموفق بود. این وضعیت را یک Gateway قابل‌دسترسی با قابلیت‌های تشخیصی مختل‌شده در نظر بگیرید؛ `connect.ok` و `connect.rpcOk` را در خروجی `--json` مقایسه کنید.
- `Capability: pairing-pending` یا `gateway closed (1008): pairing required` → Gateway پاسخ داد، اما این کلاینت پیش از دسترسی عادی اپراتور همچنان به جفت‌سازی/تأیید نیاز دارد.
- متن هشدار SecretRef حل‌نشده برای `gateway.auth.*` / `gateway.remote.*` → اطلاعات احراز هویت در این مسیر فرمان برای هدف ناموفق در دسترس نبود.

مرتبط:

- [Gateway](/fa/cli/gateway)
- [چند Gateway روی یک میزبان](/fa/gateway#multiple-gateways-same-host)
- [دسترسی راه‌دور](/fa/gateway/remote)

## کانال متصل است، اما پیام‌ها جریان ندارند

اگر وضعیت کانال متصل است اما جریان پیام متوقف شده، بر خط‌مشی، مجوزها و قواعد ارسال مختص کانال تمرکز کنید.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

به‌دنبال این موارد بگردید:

- خط‌مشی پیام مستقیم (`pairing`، `allowlist`، `open`، `disabled`).
- فهرست مجاز گروه و الزامات اشاره.
- مجوزها/محدوده‌های دسترسی API ازدست‌رفته کانال.

نشانه‌های رایج:

- `mention required` → پیام به‌دلیل خط‌مشی اشاره گروه نادیده گرفته شد.
- `pairing` / ردپاهای تأیید در انتظار → فرستنده تأیید نشده است.
- `missing_scope`، `not_in_channel`، `Forbidden`، `401/403` → مشکل احراز هویت/مجوزهای کانال.

مرتبط:

- [عیب‌یابی کانال](/fa/channels/troubleshooting)
- [Discord](/fa/channels/discord)
- [Telegram](/fa/channels/telegram)
- [WhatsApp](/fa/channels/whatsapp)

## تحویل Cron و Heartbeat

اگر Cron یا Heartbeat اجرا نشد یا تحویل صورت نگرفت، ابتدا وضعیت زمان‌بند و سپس مقصد تحویل را بررسی کنید.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

به‌دنبال این موارد بگردید:

- فعال‌بودن Cron و وجود زمان بیدارباش بعدی.
- وضعیت تاریخچه اجرای کار (`ok`، `skipped`، `error`).
- دلایل ردشدن Heartbeat (`quiet-hours`، `requests-in-flight`، `cron-in-progress`، `lanes-busy`، `alerts-disabled`، `empty-heartbeat-file`، `no-tasks-due`).

<AccordionGroup>
  <Accordion title="نشانه‌های رایج">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron غیرفعال است.
    - `cron: timer tick failed` → تیک زمان‌بند ناموفق بود؛ خطاهای فایل/گزارش/زمان اجرا را بررسی کنید.
    - `heartbeat skipped` همراه با `reason=quiet-hours` → خارج از بازه ساعات فعال.
    - `heartbeat skipped` همراه با `reason=empty-heartbeat-file` → `HEARTBEAT.md` وجود دارد، اما فقط شامل ساختار اولیه خالی، نظر، سرآیند، حصار یا چک‌لیست خالی است؛ بنابراین OpenClaw فراخوانی مدل را رد می‌کند.
    - `heartbeat skipped` همراه با `reason=no-tasks-due` → `HEARTBEAT.md` شامل یک بلوک `tasks:` است، اما هیچ‌یک از وظایف در این تیک موعد اجرا ندارند.
    - `heartbeat: unknown accountId` → شناسه حساب برای مقصد تحویل Heartbeat نامعتبر است.
    - `heartbeat skipped` همراه با `reason=dm-blocked` → مقصد Heartbeat به مقصدی از نوع پیام مستقیم حل شد، درحالی‌که `agents.defaults.heartbeat.directPolicy` (یا بازنویسی مختص عامل) روی `block` تنظیم شده است.

  </Accordion>
</AccordionGroup>

مرتبط:

- [Heartbeat](/fa/gateway/heartbeat)
- [وظایف زمان‌بندی‌شده](/fa/automation/cron-jobs)
- [وظایف زمان‌بندی‌شده: عیب‌یابی](/fa/automation/cron-jobs#troubleshooting)

## Node جفت شده است، اما ابزار ناموفق است

اگر Node جفت شده است اما ابزارها ناموفق‌اند، وضعیت پیش‌زمینه، مجوز و تأیید را جداگانه بررسی کنید.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

به‌دنبال این موارد بگردید:

- آنلاین‌بودن Node با قابلیت‌های مورد انتظار.
- اعطای مجوزهای سیستم‌عامل برای دوربین/میکروفون/موقعیت مکانی/صفحه‌نمایش.
- وضعیت تأییدهای اجرا و فهرست مجاز.

نشانه‌های رایج:

- `NODE_BACKGROUND_UNAVAILABLE` → برنامه Node باید در پیش‌زمینه باشد.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → مجوز سیستم‌عامل وجود ندارد.
- `SYSTEM_RUN_DENIED: approval required` → تأیید اجرا در انتظار است.
- `SYSTEM_RUN_DENIED: allowlist miss` → فرمان توسط فهرست مجاز مسدود شده است.

مرتبط:

- [تأییدهای اجرا](/fa/tools/exec-approvals)
- [عیب‌یابی Node](/fa/nodes/troubleshooting)
- [Nodeها](/fa/nodes/index)

## ابزار مرورگر ناموفق است

زمانی استفاده کنید که عملیات ابزار مرورگر ناموفق‌اند، هرچند خود Gateway سالم است.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

به‌دنبال این موارد بگردید:

- اینکه آیا `plugins.allow` تنظیم شده و شامل `browser` است.
- مسیر معتبر فایل اجرایی مرورگر.
- دسترس‌پذیری نمایه CDP.
- دردسترس‌بودن Chrome محلی برای نمایه‌های `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="نشانه‌های Plugin / فایل اجرایی">
    - `unknown command "browser"` یا `unknown command 'browser'` → Plugin همراه مرورگر توسط `plugins.allow` مستثنا شده است.
    - نبودن / دردسترس‌نبودن ابزار مرورگر درحالی‌که `browser.enabled=true` → `plugins.allow`، `browser` را مستثنا می‌کند؛ بنابراین Plugin هرگز بارگذاری نشده است.
    - `Failed to start Chrome CDP on port` → فرایند مرورگر راه‌اندازی نشد.
    - `browser.executablePath not found` → مسیر پیکربندی‌شده نامعتبر است.
    - `browser.cdpUrl must be http(s) or ws(s)` → نشانی CDP پیکربندی‌شده از طرحی پشتیبانی‌نشده مانند `file:` یا `ftp:` استفاده می‌کند.
    - `browser.cdpUrl has invalid port` → نشانی CDP پیکربندی‌شده درگاهی نامعتبر یا خارج از محدوده دارد.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → نصب فعلی Gateway فاقد وابستگی اصلی زمان اجرای مرورگر است؛ OpenClaw را دوباره نصب یا به‌روزرسانی کنید، سپس Gateway را مجدداً راه‌اندازی کنید. تصویرهای فوری ARIA و نماگرفت‌های پایه صفحه همچنان می‌توانند کار کنند، اما پیمایش، تصویرهای فوری هوش مصنوعی، نماگرفت‌های عنصر با انتخابگر CSS و خروجی PDF دردسترس نمی‌مانند.

  </Accordion>
  <Accordion title="نشانه‌های Chrome MCP / نشست موجود">
    - `Could not find DevToolsActivePort for chrome` → نشست موجود Chrome MCP هنوز نتوانست به پوشه داده مرورگر انتخاب‌شده متصل شود. صفحه بازرسی مرورگر را باز کنید، اشکال‌زدایی راه‌دور را فعال کنید، مرورگر را باز نگه دارید، نخستین درخواست اتصال را تأیید کنید و سپس دوباره تلاش کنید. اگر وضعیت واردشده به حساب لازم نیست، نمایه مدیریت‌شده `openclaw` را ترجیح دهید.
    - `No browser tabs found for profile="user"` → نمایه اتصال Chrome MCP هیچ زبانه باز Chrome محلی ندارد.
    - `Remote CDP for profile "<name>" is not reachable` → نقطه پایانی CDP راه‌دور پیکربندی‌شده از میزبان Gateway قابل‌دسترسی نیست.
    - `Browser attachOnly is enabled ... not reachable` یا `Browser attachOnly is enabled and CDP websocket ... is not reachable` → نمایه فقط‌اتصال هیچ هدف قابل‌دسترسی ندارد، یا نقطه پایانی HTTP پاسخ داده اما WebSocket مربوط به CDP همچنان باز نشده است.

  </Accordion>
  <Accordion title="نشانه‌های عنصر / نماگرفت / بارگذاری">
    - `fullPage is not supported for element screenshots` → درخواست نماگرفت، `--full-page` را با `--ref` یا `--element` ترکیب کرده است.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → فراخوانی‌های نماگرفت Chrome MCP / `existing-session` باید از ثبت صفحه یا `--ref` یک تصویر فوری استفاده کنند، نه `--element` از نوع CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → قلاب‌های بارگذاری Chrome MCP به ارجاع‌های تصویر فوری نیاز دارند، نه انتخابگرهای CSS.
    - `existing-session file uploads currently support one file at a time.` → در نمایه‌های Chrome MCP در هر فراخوانی یک بارگذاری ارسال کنید.
    - `existing-session dialog handling does not support timeoutMs.` → قلاب‌های کادر محاوره‌ای در نمایه‌های Chrome MCP از بازنویسی مهلت پشتیبانی نمی‌کنند.
    - `existing-session type does not support timeoutMs overrides.` → برای `act:type` در نمایه‌های نشست موجود `profile="user"` / Chrome MCP، `timeoutMs` را حذف کنید؛ یا وقتی مهلت سفارشی لازم است، از نمایه مرورگر مدیریت‌شده/CDP استفاده کنید.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` همچنان به مرورگر مدیریت‌شده یا نمایه خام CDP نیاز دارد.
    - بازنویسی‌های قدیمی محدوده دید / حالت تاریک / منطقه زبانی / آفلاین در نمایه‌های فقط‌اتصال یا CDP راه‌دور → `openclaw browser stop --browser-profile <name>` را اجرا کنید تا نشست کنترل فعال بسته شود و وضعیت شبیه‌سازی Playwright/CDP بدون راه‌اندازی مجدد کل Gateway آزاد شود.

  </Accordion>
</AccordionGroup>

مرتبط:

- [مرورگر (مدیریت‌شده توسط OpenClaw)](/fa/tools/browser)
- [عیب‌یابی مرورگر](/fa/tools/browser-linux-troubleshooting)

## اگر ارتقا دادید و چیزی ناگهان خراب شد

بیشتر خرابی‌های پس از ارتقا ناشی از انحراف پیکربندی یا اعمال‌شدن پیش‌فرض‌های سخت‌گیرانه‌تر است.

<AccordionGroup>
  <Accordion title="1. رفتار احراز هویت و بازنویسی URL تغییر کرده است">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    مواردی که باید بررسی شوند:

    - اگر `gateway.mode=remote`، ممکن است فراخوانی‌های CLI به مقصد راه دور هدایت شوند، درحالی‌که سرویس محلی به‌درستی کار می‌کند.
    - فراخوانی‌های صریح `--url` از اطلاعات ورود ذخیره‌شده به‌عنوان مسیر جایگزین استفاده نمی‌کنند.

    نشانه‌های رایج:

    - `gateway connect failed:` ← مقصد URL اشتباه است.
    - `unauthorized` ← نقطه پایانی در دسترس است، اما احراز هویت اشتباه است.

  </Accordion>
  <Accordion title="2. محدودیت‌های اتصال و احراز هویت سخت‌گیرانه‌تر شده‌اند">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    مواردی که باید بررسی شوند:

    - اتصال‌های غیرحلقه‌بازگشتی (`lan`، `tailnet`، `custom`) به یک مسیر معتبر احراز هویت Gateway نیاز دارند: احراز هویت با توکن مشترک/رمز عبور، یا استقرار غیرحلقه‌بازگشتی `trusted-proxy` که به‌درستی پیکربندی شده باشد.
    - کلیدهای قدیمی مانند `gateway.token` جایگزین `gateway.auth.token` نمی‌شوند.

    نشانه‌های رایج:

    - `refusing to bind gateway ... without auth` ← اتصال غیرحلقه‌بازگشتی بدون مسیر معتبر احراز هویت Gateway.
    - `Connectivity probe: failed` هنگامی که زمان‌اجرا در حال اجرا است ← Gateway فعال است، اما با احراز هویت/URL فعلی قابل دسترسی نیست.

  </Accordion>
  <Accordion title="3. وضعیت جفت‌سازی و هویت دستگاه تغییر کرده است">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    مواردی که باید بررسی شوند:

    - تأییدهای در انتظار دستگاه برای داشبورد/Nodeها.
    - تأییدهای در انتظار جفت‌سازی پیام مستقیم پس از تغییر سیاست یا هویت.

    نشانه‌های رایج:

    - `device identity required` ← الزامات احراز هویت دستگاه برآورده نشده است.
    - `pairing required` ← فرستنده/دستگاه باید تأیید شود.

  </Accordion>
</AccordionGroup>

اگر پس از بررسی‌ها همچنان پیکربندی سرویس و زمان‌اجرا با یکدیگر مطابقت ندارند، فراداده سرویس را از همان نمایه/پوشه وضعیت دوباره نصب کنید:

```bash
openclaw gateway install --force
openclaw gateway restart
```

مطالب مرتبط:

- [احراز هویت](/fa/gateway/authentication)
- [اجرای پس‌زمینه و ابزار فرایند](/fa/gateway/background-process)
- [جفت‌سازی Node](/fa/gateway/pairing)

## مطالب مرتبط

- [Doctor](/fa/gateway/doctor)
- [پرسش‌های متداول](/fa/help/faq)
- [راهنمای عملیاتی Gateway](/fa/gateway)
