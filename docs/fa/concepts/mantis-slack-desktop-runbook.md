---
read_when:
    - اجرای تضمین کیفیت دسکتاپ Slack برای Mantis از GitHub یا به‌صورت محلی
    - اشکال‌زدایی اجراهای کند دسکتاپ Mantis Slack
    - انتخاب حالت منبع، پیش‌هیدراته‌شده یا اجارهٔ گرم
    - ارسال اسکرین‌شات‌ها و ویدئوها به‌عنوان شواهد در یک درخواست ادغام
summary: 'راهنمای عملیاتی اپراتور برای QA دسکتاپ Mantis Slack: فراخوانی GitHub، CLI محلی، اجاره‌های گرم VNC، حالت‌های پرسازی، تفسیر زمان‌بندی، آرتیفکت‌ها، و مدیریت خرابی.'
title: راهنمای عملیاتی دسکتاپ Mantis Slack
x-i18n:
    generated_at: "2026-05-06T09:10:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83ca8792b53e5b14e592c2cbec6f6adfc936834e19f340f8e5eb3d467ecd3209
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack desktop QA مسیر رابط کاربری واقعی برای باگ‌های هم‌رده Slack است که به
دسکتاپ Linux، نجات VNC، Slack Web، یک Gateway واقعی OpenClaw، اسکرین‌شات‌ها،
ویدیوها و یک نظر شواهد PR نیاز دارند.

از آن زمانی استفاده کنید که تست‌های واحد یا مسیر زنده Slack بدون رابط گرافیکی نتوانند باگ را اثبات کنند.

## مدل ذخیره‌سازی

Mantis از سه لایه ذخیره‌سازی متفاوت استفاده می‌کند:

- تصویر ارائه‌دهنده: متعلق به Crabbox است و در حساب ارائه‌دهنده ابری ذخیره می‌شود.
  این تصویر قابلیت‌های ماشین مانند Chrome/Chromium، ffmpeg، scrot،
  Node/corepack/pnpm، ابزارهای ساخت بومی و دایرکتوری‌های کش خالی را شامل می‌شود.
- وضعیت اجاره گرم: متعلق به نشست فعلی اپراتور است. تا زمانی که اجاره زنده است، می‌تواند شامل یک
  پروفایل مرورگر واردشده، `/var/cache/crabbox/pnpm` و یک checkout آماده از سورس باشد.
- مصنوعات Mantis: متعلق به اجرای OpenClaw هستند. آن‌ها زیر
  `.artifacts/qa-e2e/mantis/...` قرار می‌گیرند، سپس GitHub Actions آن‌ها را آپلود می‌کند و
  Mantis GitHub App شواهد درون‌خطی را روی PR نظر می‌دهد.

هرگز رازها، کوکی‌های مرورگر، وضعیت ورود Slack، checkoutهای مخزن،
`node_modules` یا `dist/` را در تصویر ازپیش‌ساخته‌شده ارائه‌دهنده قرار ندهید.

## Dispatch در GitHub

گردش‌کار را از `main` اجرا کنید:

```bash
gh workflow run mantis-slack-desktop-smoke.yml \
  --ref main \
  -f candidate_ref=<trusted-ref-or-sha> \
  -f pr_number=<pr-number> \
  -f scenario_id=slack-canary \
  -f crabbox_provider=aws \
  -f keep_vm=false \
  -f hydrate_mode=source
```

مقادیر مجاز `candidate_ref` عمدا محدود هستند، زیرا گردش‌کار
از اعتبارنامه‌های زنده استفاده می‌کند: ancestry فعلی `main`، تگ‌های انتشار، یا سر یک PR باز
از `openclaw/openclaw`.

گردش‌کار این موارد را می‌نویسد:

- مصنوع آپلودشده: `mantis-slack-desktop-smoke-<run-id>-<attempt>`؛
- نظر درون‌خطی PR از طرف Mantis GitHub App؛
- `slack-desktop-smoke.png`؛
- `slack-desktop-smoke.mp4`؛
- `slack-desktop-smoke-preview.gif`؛
- `slack-desktop-smoke-change.mp4`؛
- `mantis-slack-desktop-smoke-summary.json`؛
- `mantis-slack-desktop-smoke-report.md`؛
- لاگ‌های راه‌دور مانند `slack-desktop-command.log`، `openclaw-gateway.log`،
  `chrome.log` و `ffmpeg.log`.

نظر PR درجا توسط نشانگر پنهان
`<!-- mantis-slack-desktop-smoke -->` به‌روزرسانی می‌شود.

## CLI محلی

اثبات سورس سرد:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --credential-source convex \
  --credential-role maintainer \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --scenario slack-canary \
  --hydrate-mode source
```

VM را برای نجات VNC نگه دارید:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

VNC را باز کنید:

```bash
crabbox vnc --provider aws --id <cbx_id> --open
```

یک اجاره گرم را دوباره استفاده کنید:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

فقط زمانی از `--hydrate-mode prehydrated` استفاده کنید که workspace راه‌دورِ دوباره‌استفاده‌شده از قبل
`node_modules` و یک `dist/` ساخته‌شده داشته باشد. اگر این‌ها
وجود نداشته باشند، Mantis به‌صورت بسته شکست می‌خورد.

## حالت‌های hydrate

| حالت          | زمان استفاده                                  | رفتار راه‌دور                                                                       | بده‌بستان                                                 |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | اثبات معمول PR، ماشین‌های سرد، CI        | `pnpm install --frozen-lockfile --prefer-offline` و `pnpm build` را داخل VM اجرا می‌کند | کندترین، قوی‌ترین اثبات source-checkout                 |
| `prehydrated` | عمدا یک اجاره دوباره‌استفاده‌شده را آماده کرده‌اید | به `node_modules` و `dist/` موجود نیاز دارد؛ install/build را رد می‌کند                     | سریع، اما فقط برای اجاره‌های گرم کنترل‌شده توسط اپراتور معتبر است |

GitHub Actions همیشه checkout نامزد را پیش از اجرای VM آماده می‌کند. store مربوط به
pnpm آن بر اساس OS، نسخه Node و lockfile کش می‌شود. اجرای سورس VM نیز
در صورت وجود از `/var/cache/crabbox/pnpm` استفاده می‌کند.

## تفسیر زمان‌بندی

`mantis-slack-desktop-smoke-report.md` شامل زمان‌بندی فازها است:

- `crabbox.warmup`: راه‌اندازی ارائه‌دهنده ابری، آمادگی دسکتاپ/مرورگر و SSH.
- `crabbox.inspect`: جست‌وجوی metadata اجاره.
- `credentials.prepare`: دریافت اجاره اعتبارنامه Convex.
- `crabbox.remote_run`: همگام‌سازی، راه‌اندازی مرورگر، install/build یا
  اعتبارسنجی hydrate برای OpenClaw، شروع Gateway، اسکرین‌شات و ضبط ویدیو.
- `artifacts.copy`: بازگردانی با rsync از VM.

وقتی Crabbox پس از آنکه Mantis metadata اثبات‌کننده زنده‌بودن Gateway
OpenClaw و تکمیل setup را کپی کرده است، یک وضعیت راه‌دور غیرصفر برمی‌گرداند،
`crabbox.remote_run` می‌تواند به‌عنوان `accepted` علامت‌گذاری شود. `accepted` را قبولی همراه با توضیح در نظر بگیرید،
نه سناریوی شکست‌خورده.

اگر اجرا کند است:

- warmup غالب است: یک تصویر بهتر Crabbox provider را prebake یا promote کنید؛
- remote_run در `source` غالب است: از یک اجاره گرم استفاده کنید، استفاده مجدد از pnpm store را بهبود دهید،
  یا پیش‌نیازهای ماشین را به تصویر ارائه‌دهنده منتقل کنید؛
- remote_run در `prehydrated` غالب است: workspace راه‌دور در واقع
  آماده نبوده است، یا راه‌اندازی Gateway/مرورگر/Slack کند است؛
- کپی artifact غالب است: اندازه ویدیو و محتوای دایرکتوری artifact را بررسی کنید.

## چک‌لیست شواهد

یک نظر خوب PR باید نشان دهد:

- شناسه سناریو و SHA نامزد؛
- URL اجرای GitHub Actions؛
- URL artifact؛
- اسکرین‌شات درون‌خطی؛
- پیش‌نمایش متحرک درون‌خطی در صورت موجود بودن؛
- لینک‌های MP4 کامل و MP4 کوتاه‌شده؛
- وضعیت قبولی/شکست؛
- خلاصه زمان‌بندی در گزارش پیوست‌شده.

اسکرین‌شات‌ها یا ویدیوها را در مخزن commit نکنید. آن‌ها را در artifacts مربوط به
GitHub Actions یا نظر PR نگه دارید.

## مدیریت شکست

اگر گردش‌کار پیش از اجرای VM شکست خورد، ابتدا job مربوط به Actions را بررسی کنید. علت‌های معمول
شامل `candidate_ref` نامعتبر، رازهای محیطی مفقود یا شکست install/build نامزد هستند.

اگر اجرای VM شکست خورد اما اسکرین‌شات‌ها بازگردانده شدند، این موارد را بررسی کنید:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

اگر اجرا اجاره را نگه داشته است، VNC را با فرمان `crabbox vnc ...` موجود در گزارش باز کنید.
پس از پایان کار، اجاره را متوقف کنید:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

اگر ورود Slack منقضی شده است، آن را در VNC روی یک اجاره نگه‌داشته‌شده تعمیر کنید و با
`--lease-id` دوباره اجرا کنید. آن پروفایل مرورگر را داخل تصویر ارائه‌دهنده bake نکنید.

## مرتبط

- [نمای کلی QA](/fa/concepts/qa-e2e-automation)
- [کانال Slack](/fa/channels/slack)
- [تست کردن](/fa/help/testing)
