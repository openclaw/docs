---
read_when:
    - انتشار Skills
    - اشکال‌زدایی از شکست‌های انتشار
summary: قالب پوشه Skill، فایل‌های الزامی، انواع فایل‌های مجاز، محدودیت‌ها.
x-i18n:
    generated_at: "2026-06-28T05:08:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# قالب Skill

## روی دیسک

یک skill یک پوشه است.

الزامی:

- `SKILL.md` (یا `skill.md`؛ `skills.md` قدیمی نیز پذیرفته می‌شود)

اختیاری:

- هر فایل پشتیبان _متنی_ (ببینید «فایل‌های مجاز»)
- `.clawhubignore` (الگوهای نادیده‌گیری برای انتشار، `.clawdhubignore` قدیمی)
- `.gitignore` (آن هم رعایت می‌شود)

## وارد کردن از GitHub

واردکننده وب GitHub سخت‌گیرتر از انتشار/همگام‌سازی محلی است. این ابزار فقط فایل‌های
`SKILL.md` یا `skills.md` قدیمی را در مخازن عمومی، غیر fork و متعلق به
حساب GitHub واردشده کشف می‌کند. مخازن خصوصی، forkها،
مخازن بایگانی‌شده/غیرفعال، یا مخازن عمومی شخص ثالث را وارد نمی‌کند.

فراداده نصب محلی (نوشته‌شده توسط CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` قدیمی)

وضعیت نصب workdir (نوشته‌شده توسط CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` قدیمی)

## `SKILL.md`

- Markdown با frontmatter اختیاری YAML.
- سرور هنگام انتشار، فراداده را از frontmatter استخراج می‌کند.
- `description` به‌عنوان خلاصه skill در UI/جست‌وجو استفاده می‌شود.

## فراداده frontmatter

فراداده Skill در frontmatter YAML بالای `SKILL.md` شما اعلام می‌شود. این به رجیستری (و تحلیل امنیتی) می‌گوید Skill شما برای اجرا به چه چیزهایی نیاز دارد.

### frontmatter پایه

```yaml
---
name: my-skill
description: خلاصه‌ای کوتاه از کاری که این skill انجام می‌دهد.
version: 1.0.0
---
```

### فراداده runtime (`metadata.openclaw`)

نیازمندی‌های runtime مربوط به skill خود را زیر `metadata.openclaw` اعلام کنید (نام‌های مستعار: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: مدیریت کارها از طریق Todoist API.
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

برای متغیرهای محیطی که باید پیش از اجرای skill حاضر باشند، از `requires.env` استفاده کنید. وقتی برای هر متغیر به فراداده جداگانه نیاز دارید، از جمله متغیرهای اختیاری با `required: false`، از `envVars` استفاده کنید.

### مرجع کامل فیلدها

| فیلد              | نوع       | توضیح                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | متغیرهای محیطی الزامی که skill شما انتظار دارد.                                                                                           |
| `requires.bins`    | `string[]` | باینری‌های CLI که همگی باید نصب شده باشند.                                                                                                     |
| `requires.anyBins` | `string[]` | باینری‌های CLI که حداقل یکی از آن‌ها باید وجود داشته باشد.                                                                                                  |
| `requires.config`  | `string[]` | مسیرهای فایل پیکربندی که skill شما می‌خواند.                                                                                                          |
| `primaryEnv`       | `string`   | متغیر محیطی اصلی اعتبارنامه برای skill شما.                                                                                                  |
| `envVars`          | `array`    | اعلام متغیرهای محیطی با `name`، `required` اختیاری، و `description` اختیاری. برای متغیرهای محیطی اختیاری، `required: false` را تنظیم کنید. |
| `always`           | `boolean`  | اگر `true` باشد، skill همیشه فعال است (نیازی به نصب صریح نیست).                                                                              |
| `skillKey`         | `string`   | کلید فراخوانی skill را بازنویسی می‌کند.                                                                                                         |
| `emoji`            | `string`   | ایموجی نمایشی برای skill.                                                                                                                 |
| `homepage`         | `string`   | URL صفحه اصلی یا مستندات skill.                                                                                                         |
| `os`               | `string[]` | محدودیت‌های سیستم‌عامل (مثلاً `["macos"]`، `["linux"]`).                                                                                             |
| `install`          | `array`    | مشخصات نصب برای وابستگی‌ها (پایین‌تر ببینید).                                                                                                  |
| `nix`              | `object`   | مشخصات plugin Nix (README را ببینید).                                                                                                                |
| `config`           | `object`   | مشخصات پیکربندی Clawdbot (README را ببینید).                                                                                                           |

### مشخصات نصب

اگر skill شما نیاز به نصب وابستگی‌ها دارد، آن‌ها را در آرایه `install` اعلام کنید:

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

گونه‌های نصب پشتیبانی‌شده: `brew`، `node`، `go`، `uv`.

### متغیرهای محیطی اختیاری

متغیرهای محیطی اختیاری را زیر `metadata.openclaw.envVars` اعلام کنید و `required: false` را تنظیم کنید. ورودی‌های اختیاری را به `requires.env` اضافه نکنید، چون `requires.env` یعنی skill بدون آن‌ها نمی‌تواند اجرا شود.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: توکن Todoist API که برای درخواست‌های احراز هویت‌شده استفاده می‌شود.
      - name: TODOIST_PROJECT_ID
        required: false
        description: شناسه پروژه پیش‌فرض اختیاری وقتی کاربر موردی را مشخص نمی‌کند.
```

### چرا این مهم است

تحلیل امنیتی ClawHub بررسی می‌کند آنچه skill شما اعلام می‌کند با کاری که واقعاً انجام می‌دهد مطابقت داشته باشد. اگر کد شما به `TODOIST_API_KEY` ارجاع دهد اما frontmatter شما آن را زیر `requires.env`، `primaryEnv`، یا `envVars` اعلام نکند، تحلیل یک ناهماهنگی فراداده را علامت‌گذاری می‌کند. دقیق نگه‌داشتن اعلام‌ها به skill شما کمک می‌کند بررسی را بگذراند و به کاربران کمک می‌کند بفهمند چه چیزی را نصب می‌کنند.

### مثال: frontmatter کامل

```yaml
---
name: todoist-cli
description: مدیریت کارها، پروژه‌ها و برچسب‌های Todoist از خط فرمان.
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
        description: توکن Todoist API.
      - name: TODOIST_PROJECT_ID
        required: false
        description: شناسه پروژه پیش‌فرض اختیاری.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## فایل‌های مجاز

فقط فایل‌های «متنی» توسط انتشار پذیرفته می‌شوند.

- فهرست مجاز پسوندها در `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`) است.
- فایل‌های اسکریپت همچنان پس از بارگذاری اسکن می‌شوند؛ فایل‌های PowerShell با پسوندهای `.ps1`، `.psm1`، و `.psd1` به‌عنوان متن پذیرفته می‌شوند.
- نوع‌های محتوا که با `text/` شروع می‌شوند به‌عنوان متن در نظر گرفته می‌شوند؛ به‌علاوه یک فهرست مجاز کوچک (JSON/YAML/TOML/JS/TS/Markdown/SVG).

محدودیت‌ها (سمت سرور):

- اندازه کل بسته: 50MB.
- متن embedding شامل `SKILL.md` + حداکثر حدود ۴۰ فایل غیر `.md` است (سقف در حد بهترین تلاش).

## Slugها

- به‌طور پیش‌فرض از نام پوشه مشتق می‌شود.
- scopeهای package باید دقیقاً با handle ناشر ClawHub مطابقت داشته باشند. handleهای ناشر می‌توانند از حروف کوچک، اعداد، خط تیره، نقطه، و زیرخط استفاده کنند؛ باید با یک حرف کوچک یا عدد شروع و تمام شوند.
- slugهای package باید حروف کوچک و npm-safe باشند، برای مثال `@example.tools/demo-plugin` یا `demo-plugin`.

## نسخه‌بندی + تگ‌ها

- هر انتشار یک نسخه جدید (semver) ایجاد می‌کند.
- تگ‌ها اشاره‌گرهای رشته‌ای به یک نسخه هستند؛ `latest` معمولاً استفاده می‌شود.

## مجوز

- همه skills منتشرشده در ClawHub تحت مجوز `MIT-0` هستند.
- هر کسی می‌تواند از skills منتشرشده استفاده کند، آن‌ها را تغییر دهد، و بازتوزیع کند، از جمله به‌صورت تجاری.
- ذکر منبع الزامی نیست.
- شرایط مجوز ناسازگار را در `SKILL.md` اضافه نکنید؛ ClawHub از بازنویسی مجوز برای هر skill پشتیبانی نمی‌کند.

## skills پولی

- ClawHub از skills پولی، قیمت‌گذاری برای هر skill، paywallها، یا تقسیم درآمد پشتیبانی نمی‌کند.
- فراداده قیمت‌گذاری را به `SKILL.md` اضافه نکنید؛ این بخشی از قالب skill نیست و یک skill منتشرشده را پولی نخواهد کرد.
- اگر skill شما با یک سرویس شخص ثالث پولی یکپارچه می‌شود، هزینه خارجی و حساب موردنیاز را به‌روشنی در دستورالعمل‌های skill و اعلام‌های env مستند کنید (`requires.env` برای متغیرهای الزامی، یا `envVars` با `required: false` برای متغیرهای اختیاری).
