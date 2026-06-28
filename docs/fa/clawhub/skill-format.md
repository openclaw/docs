---
read_when:
    - انتشار Skills
    - اشکال‌زدایی خطاهای انتشار
summary: قالب پوشه Skills، فایل‌های الزامی، انواع فایل‌های مجاز، محدودیت‌ها.
x-i18n:
    generated_at: "2026-06-28T08:05:27Z"
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

- هر فایل پشتیبان _مبتنی بر متن_ (بخش «فایل‌های مجاز» را ببینید)
- `.clawhubignore` (الگوهای نادیده‌گیری برای انتشار، `.clawdhubignore` قدیمی)
- `.gitignore` (آن هم رعایت می‌شود)

## وارد کردن از GitHub

واردکننده وب GitHub از انتشار/همگام‌سازی محلی سخت‌گیرتر است. فقط فایل‌های
`SKILL.md` یا `skills.md` قدیمی را در مخازن عمومی و غیر فورک که متعلق به
حساب GitHub واردشده هستند پیدا می‌کند. مخازن خصوصی، فورک‌ها،
مخازن بایگانی‌شده/غیرفعال، یا مخازن عمومی شخص ثالث را وارد نمی‌کند.

فراداده نصب محلی (نوشته‌شده توسط CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` قدیمی)

وضعیت نصب workdir (نوشته‌شده توسط CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` قدیمی)

## `SKILL.md`

- Markdown با frontmatter اختیاری YAML.
- سرور هنگام انتشار، فراداده را از frontmatter استخراج می‌کند.
- `description` به‌عنوان خلاصه مهارت در UI/جست‌وجو استفاده می‌شود.

## فراداده frontmatter

فراداده مهارت در frontmatter YAML در بالای `SKILL.md` شما اعلام می‌شود. این به رجیستری (و تحلیل امنیتی) می‌گوید مهارت شما برای اجرا به چه چیزهایی نیاز دارد.

### frontmatter پایه

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### فراداده runtime (`metadata.openclaw`)

نیازمندی‌های runtime مهارت خود را زیر `metadata.openclaw` اعلام کنید (نام‌های مستعار: `metadata.clawdbot`، `metadata.clawdis`).

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

برای متغیرهای محیطی که باید پیش از اجرای مهارت وجود داشته باشند از `requires.env` استفاده کنید. وقتی برای هر متغیر به فراداده جداگانه نیاز دارید، از جمله متغیرهای اختیاری با `required: false`، از `envVars` استفاده کنید.

### مرجع کامل فیلدها

| فیلد               | نوع        | توضیح                                                                                                                                             |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | متغیرهای محیطی الزامی که مهارت شما انتظار دارد.                                                                                                  |
| `requires.bins`    | `string[]` | باینری‌های CLI که همه آن‌ها باید نصب باشند.                                                                                                      |
| `requires.anyBins` | `string[]` | باینری‌های CLI که دست‌کم یکی از آن‌ها باید وجود داشته باشد.                                                                                      |
| `requires.config`  | `string[]` | مسیرهای فایل پیکربندی که مهارت شما می‌خواند.                                                                                                     |
| `primaryEnv`       | `string`   | متغیر محیطی اعتبارنامه اصلی برای مهارت شما.                                                                                                      |
| `envVars`          | `array`    | اعلان‌های متغیر محیطی با `name`، `required` اختیاری، و `description` اختیاری. برای متغیرهای محیطی اختیاری `required: false` را تنظیم کنید.       |
| `always`           | `boolean`  | اگر `true` باشد، مهارت همیشه فعال است (نیازی به نصب صریح نیست).                                                                                  |
| `skillKey`         | `string`   | کلید فراخوانی مهارت را بازنویسی می‌کند.                                                                                                         |
| `emoji`            | `string`   | ایموجی نمایشی برای مهارت.                                                                                                                        |
| `homepage`         | `string`   | URL صفحه اصلی یا مستندات مهارت.                                                                                                                  |
| `os`               | `string[]` | محدودیت‌های سیستم‌عامل (برای مثال `["macos"]`، `["linux"]`).                                                                                     |
| `install`          | `array`    | مشخصات نصب برای وابستگی‌ها (پایین را ببینید).                                                                                                   |
| `nix`              | `object`   | مشخصات Plugin مربوط به Nix (README را ببینید).                                                                                                  |
| `config`           | `object`   | مشخصات پیکربندی Clawdbot (README را ببینید).                                                                                                    |

### مشخصات نصب

اگر مهارت شما نیاز به نصب وابستگی‌ها دارد، آن‌ها را در آرایه `install` اعلام کنید:

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

تحلیل امنیتی ClawHub بررسی می‌کند آنچه مهارت شما اعلام می‌کند با کاری که واقعا انجام می‌دهد همخوان باشد. اگر کد شما به `TODOIST_API_KEY` ارجاع دهد اما frontmatter شما آن را زیر `requires.env`، `primaryEnv`، یا `envVars` اعلام نکرده باشد، تحلیل یک ناهماهنگی فراداده را علامت‌گذاری می‌کند. دقیق نگه‌داشتن اعلان‌ها کمک می‌کند مهارت شما از بازبینی عبور کند و به کاربران کمک می‌کند بفهمند چه چیزی را نصب می‌کنند.

### مثال: frontmatter کامل

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

فقط فایل‌های «مبتنی بر متن» توسط انتشار پذیرفته می‌شوند.

- allowlist پسوندها در `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`) است.
- فایل‌های اسکریپت همچنان پس از بارگذاری اسکن می‌شوند؛ فایل‌های PowerShell با پسوندهای `.ps1`، `.psm1`، و `.psd1` به‌عنوان متن پذیرفته می‌شوند.
- نوع‌های محتوا که با `text/` شروع می‌شوند به‌عنوان متن در نظر گرفته می‌شوند؛ به‌علاوه یک allowlist کوچک (JSON/YAML/TOML/JS/TS/Markdown/SVG).

محدودیت‌ها (سمت سرور):

- اندازه کل bundle: 50MB.
- متن embedding شامل `SKILL.md` + تا حدود ۴۰ فایل غیر `.md` است (سقف best-effort).

## Slugها

- به‌طور پیش‌فرض از نام پوشه مشتق می‌شود.
- scopeهای پکیج باید دقیقا با handle ناشر ClawHub مطابقت داشته باشند. handleهای ناشر می‌توانند از حروف کوچک، اعداد، خط تیره، نقطه، و زیرخط استفاده کنند؛ باید با حرف کوچک یا عدد شروع و تمام شوند.
- slugهای پکیج باید حروف کوچک و برای npm امن باشند، برای مثال `@example.tools/demo-plugin` یا `demo-plugin`.

## نسخه‌بندی + برچسب‌ها

- هر انتشار یک نسخه جدید ایجاد می‌کند (semver).
- برچسب‌ها اشاره‌گرهای رشته‌ای به یک نسخه هستند؛ `latest` رایج است.

## مجوز

- همه مهارت‌های منتشرشده در ClawHub تحت مجوز `MIT-0` هستند.
- هرکسی می‌تواند از مهارت‌های منتشرشده استفاده کند، آن‌ها را تغییر دهد، و بازتوزیع کند، از جمله به‌صورت تجاری.
- attribution الزامی نیست.
- شروط مجوز متعارض را در `SKILL.md` اضافه نکنید؛ ClawHub از بازنویسی مجوز به‌ازای هر مهارت پشتیبانی نمی‌کند.

## مهارت‌های پولی

- ClawHub از مهارت‌های پولی، قیمت‌گذاری به‌ازای هر مهارت، paywallها، یا تقسیم درآمد پشتیبانی نمی‌کند.
- فراداده قیمت‌گذاری را به `SKILL.md` اضافه نکنید؛ بخشی از قالب مهارت نیست و یک مهارت منتشرشده را پولی نمی‌کند.
- اگر مهارت شما با یک سرویس شخص ثالث پولی یکپارچه می‌شود، هزینه خارجی و حساب لازم را به‌روشنی در دستورالعمل‌های مهارت و اعلان‌های env مستند کنید (`requires.env` برای متغیرهای الزامی، یا `envVars` با `required: false` برای متغیرهای اختیاری).
