---
read_when:
    - انتشار Skills
    - اشکال‌زدایی شکست‌های انتشار
summary: قالب پوشه Skill، فایل‌های الزامی، انواع فایل مجاز، محدودیت‌ها.
x-i18n:
    generated_at: "2026-07-01T20:27:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# قالب مهارت

## روی دیسک

یک مهارت یک پوشه است.

الزامی:

- `SKILL.md` (یا `skill.md`؛ `skills.md` قدیمی نیز پذیرفته می‌شود)

اختیاری:

- هر فایل پشتیبان _متن‌محور_ (ببینید «فایل‌های مجاز»)
- `.clawhubignore` (الگوهای نادیده‌گرفتن برای انتشار، `.clawdhubignore` قدیمی)
- `.gitignore` (آن هم رعایت می‌شود)

## واردسازی از GitHub

واردکننده وب GitHub از انتشار/همگام‌سازی محلی سخت‌گیرتر است. فقط فایل‌های
`SKILL.md` یا `skills.md` قدیمی را در مخازن عمومی و غیر فورک‌شده‌ای پیدا می‌کند
که مالک آن‌ها حساب GitHub واردشده است. مخازن خصوصی، فورک‌ها،
مخازن بایگانی‌شده/غیرفعال، یا مخازن عمومی شخص ثالث را وارد نمی‌کند.

فراداده نصب محلی (نوشته‌شده توسط CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` قدیمی)

وضعیت نصب workdir (نوشته‌شده توسط CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` قدیمی)

## `SKILL.md`

- Markdown با فرانت‌متر YAML اختیاری.
- سرور هنگام انتشار، فراداده را از فرانت‌متر استخراج می‌کند.
- `description` به‌عنوان خلاصه مهارت در UI/جست‌وجو استفاده می‌شود.

## فراداده فرانت‌متر

فراداده مهارت در فرانت‌متر YAML بالای `SKILL.md` شما اعلام می‌شود. این به رجیستری (و تحلیل امنیتی) می‌گوید مهارت شما برای اجرا به چه چیزهایی نیاز دارد.

### فرانت‌متر پایه

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### فراداده زمان اجرا (`metadata.openclaw`)

نیازمندی‌های زمان اجرای مهارت خود را زیر `metadata.openclaw` اعلام کنید (نام‌های مستعار: `metadata.clawdbot`، `metadata.clawdis`).

```yaml
---
name: my-skill
description: Manage tasks via the Todoist API.
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
---
```

از `requires.env` برای متغیرهای محیطی‌ای استفاده کنید که پیش از اجرای مهارت باید وجود داشته باشند. وقتی برای هر متغیر به فراداده نیاز دارید، از جمله متغیرهای اختیاری با `required: false`، از `envVars` استفاده کنید.

### مرجع کامل فیلدها

| فیلد               | نوع        | توضیح                                                                                                                                      |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | متغیرهای محیطی الزامی که مهارت شما انتظار دارد.                                                                                            |
| `requires.bins`    | `string[]` | باینری‌های CLI که همگی باید نصب باشند.                                                                                                      |
| `requires.anyBins` | `string[]` | باینری‌های CLI که دست‌کم یکی از آن‌ها باید وجود داشته باشد.                                                                                 |
| `requires.config`  | `string[]` | مسیرهای فایل پیکربندی که مهارت شما می‌خواند.                                                                                                |
| `primaryEnv`       | `string`   | متغیر محیطی اعتبارنامه اصلی برای مهارت شما.                                                                                                 |
| `envVars`          | `array`    | اعلان‌های متغیر محیطی با `name`، `required` اختیاری، و `description` اختیاری. برای متغیرهای محیطی اختیاری، `required: false` را تنظیم کنید. |
| `always`           | `boolean`  | اگر `true` باشد، مهارت همیشه فعال است (نیازی به نصب صریح نیست).                                                                             |
| `skillKey`         | `string`   | کلید فراخوانی مهارت را بازنویسی کنید.                                                                                                       |
| `emoji`            | `string`   | ایموجی نمایشی برای مهارت.                                                                                                                   |
| `homepage`         | `string`   | URL صفحه اصلی یا مستندات مهارت.                                                                                                             |
| `os`               | `string[]` | محدودیت‌های سیستم‌عامل (مثلاً `["macos"]`، `["linux"]`).                                                                                    |
| `install`          | `array`    | مشخصات نصب برای وابستگی‌ها (پایین را ببینید).                                                                                               |
| `nix`              | `object`   | مشخصات Plugin نیکس (README را ببینید).                                                                                                      |
| `config`           | `object`   | مشخصات پیکربندی Clawdbot (README را ببینید).                                                                                                |

### مشخصات نصب

اگر مهارت شما به نصب وابستگی‌ها نیاز دارد، آن‌ها را در آرایه `install` اعلام کنید:

```yaml
metadata:
  openclaw:
    install:
      - kind: brew
        formula: jq
        bins: [jq]
      - kind: node
        package: typescript
        bins: [tsc]
```

انواع نصب پشتیبانی‌شده: `brew`، `node`، `go`، `uv`.

### متغیرهای محیطی اختیاری

متغیرهای محیطی اختیاری را زیر `metadata.openclaw.envVars` اعلام کنید و `required: false` را تنظیم کنید. ورودی‌های اختیاری را به `requires.env` اضافه نکنید، چون `requires.env` یعنی مهارت بدون آن‌ها نمی‌تواند اجرا شود.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token used for authenticated requests.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID when the user does not specify one.
```

### چرا این مهم است

تحلیل امنیتی ClawHub بررسی می‌کند که آنچه مهارت شما اعلام می‌کند با کاری که واقعاً انجام می‌دهد مطابقت داشته باشد. اگر کد شما به `TODOIST_API_KEY` ارجاع دهد اما فرانت‌متر شما آن را زیر `requires.env`، `primaryEnv`، یا `envVars` اعلام نکرده باشد، تحلیل یک ناهماهنگی فراداده را علامت‌گذاری می‌کند. دقیق نگه‌داشتن اعلان‌ها به مهارت شما کمک می‌کند بازبینی را بگذراند و به کاربران کمک می‌کند بفهمند چه چیزی نصب می‌کنند.

### مثال: فرانت‌متر کامل

```yaml
---
name: todoist-cli
description: Manage Todoist tasks, projects, and labels from the command line.
version: 1.2.0
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## فایل‌های مجاز

انتشار فقط فایل‌های «متن‌محور» را می‌پذیرد.

- فهرست مجاز پسوندها در `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`) است.
- فایل‌های اسکریپت همچنان پس از بارگذاری اسکن می‌شوند؛ فایل‌های PowerShell با پسوندهای `.ps1`، `.psm1`، و `.psd1` به‌عنوان متن پذیرفته می‌شوند.
- نوع‌های محتوا که با `text/` شروع می‌شوند، متن در نظر گرفته می‌شوند؛ به‌علاوه یک فهرست مجاز کوچک (JSON/YAML/TOML/JS/TS/Markdown/SVG).

محدودیت‌ها (سمت سرور):

- اندازه کل باندل: 50MB.
- متن embedding شامل `SKILL.md` + تا حدود ۴۰ فایل غیر `.md` است (سقف با بهترین تلاش).

## اسلاگ‌ها

- به‌صورت پیش‌فرض از نام پوشه مشتق می‌شوند.
- اسکوپ‌های پکیج باید دقیقاً با شناسه ناشر ClawHub مطابقت داشته باشند. شناسه‌های ناشر می‌توانند از حروف کوچک، اعداد، خط تیره، نقطه، و زیرخط استفاده کنند؛ باید با یک حرف کوچک یا عدد شروع و تمام شوند.
- اسلاگ‌های پکیج باید حروف کوچک و برای npm امن باشند، برای مثال `@example.tools/demo-plugin` یا `demo-plugin`.

## نسخه‌بندی + برچسب‌ها

- هر انتشار یک نسخه جدید ایجاد می‌کند (semver).
- برچسب‌ها اشاره‌گرهای رشته‌ای به یک نسخه هستند؛ `latest` معمولاً استفاده می‌شود.

## مجوز

- همه مهارت‌های منتشرشده در ClawHub تحت مجوز `MIT-0` هستند.
- هر کسی می‌تواند از مهارت‌های منتشرشده استفاده کند، آن‌ها را تغییر دهد، و بازتوزیع کند، از جمله به‌صورت تجاری.
- انتساب الزامی نیست.
- شرایط مجوز متعارض را در `SKILL.md` اضافه نکنید؛ ClawHub از بازنویسی مجوز برای هر مهارت پشتیبانی نمی‌کند.

## مهارت‌های پولی

- ClawHub از مهارت‌های پولی، قیمت‌گذاری برای هر مهارت، paywall، یا اشتراک درآمد پشتیبانی نمی‌کند.
- فراداده قیمت‌گذاری را به `SKILL.md` اضافه نکنید؛ بخشی از قالب مهارت نیست و باعث پولی شدن یک مهارت منتشرشده نمی‌شود.
- اگر مهارت شما با یک سرویس شخص ثالث پولی یکپارچه می‌شود، هزینه خارجی و حساب موردنیاز را به‌روشنی در دستورالعمل‌های مهارت و اعلان‌های env مستند کنید (`requires.env` برای متغیرهای الزامی، یا `envVars` با `required: false` برای متغیرهای اختیاری).
