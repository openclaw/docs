---
read_when:
    - اجرای کنترل کیفیت نسخهٔ دسکتاپ Slack با Mantis از GitHub یا به‌صورت محلی
    - اشکال‌زدایی اجرای کند Mantis در برنامه دسکتاپ Slack
    - انتخاب حالت منبع، ازپیش‌آماده‌شده یا اجارهٔ گرم
    - ارسال شواهد تصویری و ویدیویی در یک PR
summary: 'راهنمای عملیاتی برای تضمین کیفیت دسکتاپ Slack با Mantis: راه‌اندازی از GitHub، CLI محلی، اجاره‌های گرم VNC، حالت‌های آماده‌سازی، تفسیر زمان‌بندی، مصنوعات و مدیریت خطاها.'
title: راهنمای عملیاتی دسکتاپ Slack برای Mantis
x-i18n:
    generated_at: "2026-07-12T09:54:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3e956d99fc43a7b6fe65e2e820812b0e0e8b9e32badd25be27c74d302ab30dc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

QA دسکتاپ Slack در Mantis مسیر رابط کاربری واقعی برای باگ‌های رده Slack است که به
دسکتاپ Linux، بازیابی از طریق VNC، Slack Web، یک Gateway واقعی OpenClaw، اسکرین‌شات،
ویدیو و نظر شواهد در PR نیاز دارند. زمانی از آن استفاده کنید که آزمون‌های واحد یا مسیر زنده
بدون رابط گرافیکی Slack نتوانند باگ را اثبات کنند.

## مدل ذخیره‌سازی

Mantis از سه لایه ذخیره‌سازی استفاده می‌کند:

- **تصویر ارائه‌دهنده** - متعلق به Crabbox و ذخیره‌شده در حساب ارائه‌دهنده ابری است.
  قابلیت‌های ماشین (Chrome/Chromium، ffmpeg، scrot،
  Node/corepack/pnpm، ابزارهای بومی ساخت) و دایرکتوری‌های خالی کش را نگه می‌دارد.
- **وضعیت اجاره گرم** - متعلق به نشست اپراتور فعلی است. تا زمانی که اجاره فعال است، می‌تواند
  نمایه مرورگر واردشده، `/var/cache/crabbox/pnpm` و یک وارسی منبع
  آماده‌شده را نگه دارد.
- **مصنوعات Mantis** - متعلق به اجرای OpenClaw هستند. در
  `.artifacts/qa-e2e/mantis/...` قرار می‌گیرند؛ GitHub Actions آن‌ها را بارگذاری می‌کند و GitHub App
  متعلق به Mantis شواهد درون‌خطی را در PR نظر می‌دهد.

هرگز اسرار، کوکی‌های مرورگر، وضعیت ورود Slack، وارسی‌های مخزن،
`node_modules` یا `dist/` را در تصویر ارائه‌دهنده نگنجانید.

## راه‌اندازی GitHub

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

`candidate_ref` محدود شده است، زیرا گردش‌کار از اعتبارنامه‌های زنده استفاده می‌کند: باید
به ancestry فعلی `main`، یک برچسب انتشار، یا سرِ یک PR باز در
`openclaw/openclaw` تفکیک شود.

گردش‌کار موارد زیر را تولید می‌کند:

- مصنوع بارگذاری‌شده `mantis-slack-desktop-smoke-<run-id>-<attempt>`
- نظر درون‌خطی PR از GitHub App متعلق به Mantis
- `slack-desktop-smoke.png`، `slack-desktop-smoke.mp4`
- `slack-desktop-smoke-preview.gif`، `slack-desktop-smoke-change.mp4`
- `mantis-slack-desktop-smoke-summary.json`، `mantis-slack-desktop-smoke-report.md`
- گزارش‌های راه دور: `slack-desktop-command.log`، `openclaw-gateway.log`، `chrome.log`، `ffmpeg.log`

نظر PR با استفاده از نشانگر پنهان `<!-- mantis-slack-desktop-smoke -->` در همان محل به‌روزرسانی می‌شود.

## CLI محلی

اثبات سرد از منبع:

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

ماشین مجازی را برای بازیابی از طریق VNC نگه دارید:

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

از یک اجاره گرم دوباره استفاده کنید:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

تنها زمانی از `--hydrate-mode prehydrated` استفاده کنید که فضای کاری راه دورِ استفاده‌شده از قبل
دارای `node_modules` و یک `dist/` ساخته‌شده باشد؛ در غیر این صورت Mantis به‌صورت بسته و ایمن شکست می‌خورد.

رابط کاربری بومی تأیید Slack را اثبات کنید:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

`--approval-checkpoints` با `--gateway-setup` ناسازگار و متقابلاً انحصاری است. این گزینه
سناریوهای اختیاری `slack-approval-exec-native` و `slack-approval-plugin-native`
را اجرا می‌کند، مگر اینکه یک `--scenario` صریح برای نقطه وارسی تأیید ارسال کنید؛ سایر
سناریوهای Slack پیش از شروع ماشین مجازی رد می‌شوند. اجراکننده QA در Slack هر
فایل JSON نقطه وارسی را از پیام واقعی API در Slack که مشاهده کرده است می‌نویسد، سپس
ناظر راه دور آن پیام را در
`approval-checkpoints/<scenario>-pending.png` و
`approval-checkpoints/<scenario>-resolved.png` رندر می‌کند. اگر هر
فایل JSON نقطه وارسی، شواهد پیام، JSON تأیید دریافت یا اسکرین‌شات رندرشده وجود نداشته
یا خالی باشد، اجرا شکست می‌خورد.

اجاره‌های سرد GitHub Actions کوکی‌های Slack Web را ندارند، بنابراین ثبت مرورگر آن‌ها
ممکن است به صفحه ورود Slack برسد. برای اثبات نقطه وارسی تأیید، به‌جای
`slack-desktop-smoke.png` به تصاویر رندرشده نقطه وارسی و مصنوعات QA در Slack
اعتماد کنید. تنها زمانی از یک اجاره گرمِ نگه‌داشته‌شده با نمایه Slack Web که به‌صورت دستی
وارد شده است استفاده کنید که خود اسکرین‌شات مرورگر باید Slack Web را نشان دهد.

## حالت‌های آماده‌سازی

| حالت          | زمان استفاده                                  | رفتار راه دور                                                                       | موازنه                                                 |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | اثبات عادی PR، ماشین‌های سرد، CI        | `pnpm install --frozen-lockfile --prefer-offline` و `pnpm build` را داخل ماشین مجازی اجرا می‌کند | کندترین، قوی‌ترین اثبات وارسی منبع                 |
| `prehydrated` | عمداً یک اجاره استفاده‌شده را آماده کرده‌اید | وجود `node_modules` و `dist/` را الزامی می‌کند؛ نصب/ساخت را رد می‌کند                     | سریع، اما فقط برای اجاره‌های گرم تحت کنترل اپراتور معتبر است |

GitHub Actions همیشه وارسی نامزد را پیش از اجرای ماشین مجازی آماده می‌کند. مخزن
pnpm آن بر اساس سیستم‌عامل، نسخه Node و فایل قفل کش می‌شود. اجرای `source` در ماشین مجازی
نیز در صورت وجود، از `/var/cache/crabbox/pnpm` دوباره استفاده می‌کند.

## تفسیر زمان‌بندی

`mantis-slack-desktop-smoke-report.md` شامل زمان‌بندی مرحله‌ها است:

- `crabbox.warmup` - راه‌اندازی ارائه‌دهنده ابری، آماده‌بودن دسکتاپ/مرورگر و SSH.
- `crabbox.inspect` - جست‌وجوی فراداده اجاره.
- `credentials.prepare` - دریافت اجاره اعتبارنامه Convex.
- `crabbox.remote_run` - همگام‌سازی، راه‌اندازی مرورگر، نصب/ساخت OpenClaw یا
  اعتبارسنجی آماده‌سازی، راه‌اندازی Gateway، ثبت اسکرین‌شات و ویدیو.
- `artifacts.copy` - بازگرداندن با rsync از ماشین مجازی.

وقتی Crabbox یک وضعیت راه دور غیرصفر برمی‌گرداند اما Mantis فراداده‌ای را کپی کرده است
که ثابت می‌کند یا راه‌اندازی Gateway متعلق به OpenClaw تکمیل شده یا خود فرمان QA در Slack
با موفقیت خارج شده است، `crabbox.remote_run` می‌تواند `accepted` را نشان دهد. با
`accepted` به‌عنوان قبولی همراه با توضیح برخورد کنید، نه یک سناریوی شکست‌خورده.

اگر اجرا کند است:

- زمان گرم‌سازی غالب است: یک تصویر بهتر از ارائه‌دهنده Crabbox را از پیش بسازید یا ارتقا دهید.
- `remote_run` در `source` غالب است: از یک اجاره گرم استفاده کنید، استفاده مجدد از مخزن
  pnpm را بهبود دهید، یا پیش‌نیازهای ماشین را به تصویر ارائه‌دهنده منتقل کنید.
- `remote_run` در `prehydrated` غالب است: فضای کاری راه دور واقعاً
  آماده نبوده، یا راه‌اندازی Gateway/مرورگر/Slack کند است.
- کپی مصنوعات غالب است: اندازه ویدیو و محتوای دایرکتوری مصنوعات را بررسی کنید.

## فهرست بررسی شواهد

یک نظر PR مناسب موارد زیر را نشان می‌دهد:

- شناسه سناریو و SHA نامزد
- نشانی اینترنتی اجرای GitHub Actions و نشانی اینترنتی مصنوع
- اسکرین‌شات درون‌خطی نقطه وارسی تأیید، یا اسکرین‌شات Slack Web از یک
  اجاره گرم واردشده
- پیش‌نمایش متحرک درون‌خطی، در صورت وجود
- پیوندهای MP4 کامل و MP4 برش‌خورده
- وضعیت قبولی/شکست و خلاصه زمان‌بندی گزارش

اسکرین‌شات‌ها یا ویدیوها را در مخزن ثبت نکنید. آن‌ها را در مصنوعات GitHub
Actions یا نظر PR نگه دارید.

## مدیریت شکست

اگر گردش‌کار پیش از اجرای ماشین مجازی شکست خورد، ابتدا کار GitHub Actions را بررسی کنید.
علت‌های معمول: `candidate_ref` نامطمئن، اسرار محیطی مفقود، یا
شکست نصب/ساخت نامزد.

اگر اجرای ماشین مجازی شکست خورد اما اسکرین‌شات‌ها بازگردانده شدند، موارد زیر را بررسی کنید:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

اگر اجرا اجاره را نگه داشت، VNC را با فرمان `crabbox vnc ...` موجود در گزارش
باز کنید، سپس پس از پایان کار اجاره را متوقف کنید:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

اگر ورود Slack منقضی شده است، آن را در VNC روی یک اجاره نگه‌داشته‌شده ترمیم کنید و با
`--lease-id` دوباره اجرا کنید. آن نمایه مرورگر را در تصویر ارائه‌دهنده نگنجانید.

## مرتبط

- [نمای کلی QA](/fa/concepts/qa-e2e-automation)
- [کانال Slack](/fa/channels/slack)
- [آزمون](/fa/help/testing)
