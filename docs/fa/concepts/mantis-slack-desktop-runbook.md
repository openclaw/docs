---
read_when:
    - اجرای QA دسکتاپ Slack در Mantis از GitHub یا به‌صورت محلی
    - اشکال‌زدایی اجرای کند Mantis در نسخه دسکتاپ Slack
    - انتخاب حالت منبع، پیش‌هیدراته‌شده یا اجاره گرم
    - ارسال شواهد اسکرین‌شات و ویدئو در یک PR
summary: 'راهنمای عملیاتی برای QA دسکتاپ Slack در Mantis: ارسال GitHub، CLI محلی، اجاره‌های گرم VNC، حالت‌های hydrate، تفسیر زمان‌بندی، مصنوعات، و مدیریت خرابی.'
title: راهنمای اجرای دسکتاپ Mantis Slack
x-i18n:
    generated_at: "2026-06-27T17:32:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9310b460a4da84afab72f9e5b5515a94e74b4f4a5030332bd2021d60deb07cc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack desktop QA مسیر رابط کاربری واقعی برای باگ‌های هم‌رده Slack است که به
دسکتاپ Linux، نجات VNC، Slack Web، یک Gateway واقعی OpenClaw، اسکرین‌شات‌ها،
ویدیوها، و یک دیدگاه شواهد در PR نیاز دارند.

وقتی از آن استفاده کنید که تست‌های واحد یا مسیر زنده Slack بدون رابط گرافیکی نتوانند باگ را اثبات کنند.

## مدل ذخیره‌سازی

Mantis از سه لایه ذخیره‌سازی متفاوت استفاده می‌کند:

- تصویر ارائه‌دهنده: متعلق به Crabbox است و در حساب ارائه‌دهنده ابری ذخیره می‌شود.
  این تصویر قابلیت‌های ماشین مانند Chrome/Chromium، ffmpeg، scrot،
  Node/corepack/pnpm، ابزارهای ساخت بومی، و دایرکتوری‌های کش خالی را شامل می‌شود.
- وضعیت اجاره گرم: متعلق به نشست فعلی اپراتور است. می‌تواند شامل یک
  پروفایل مرورگر واردشده، `/var/cache/crabbox/pnpm`، و یک checkout منبع آماده
  تا زمانی باشد که اجاره زنده است.
- مصنوعات Mantis: متعلق به اجرای OpenClaw هستند. آن‌ها زیر
  `.artifacts/qa-e2e/mantis/...` قرار می‌گیرند، سپس GitHub Actions آن‌ها را بارگذاری می‌کند و
  App گیت‌هاب Mantis شواهد درون‌خطی را روی PR نظر می‌دهد.

هرگز secrets، کوکی‌های مرورگر، وضعیت ورود Slack، checkoutهای مخزن،
`node_modules`، یا `dist/` را در تصویر ازپیش‌پخته‌شده ارائه‌دهنده قرار ندهید.

## ارسال GitHub

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

مقادیر مجاز `candidate_ref` عمدا محدود هستند، چون گردش‌کار
از اعتبارنامه‌های زنده استفاده می‌کند: تبار فعلی `main`، تگ‌های انتشار، یا سرشاخه یک PR باز
از `openclaw/openclaw`.

گردش‌کار این موارد را می‌نویسد:

- مصنوع بارگذاری‌شده: `mantis-slack-desktop-smoke-<run-id>-<attempt>`;
- دیدگاه درون‌خطی PR از App گیت‌هاب Mantis؛
- `slack-desktop-smoke.png`;
- `slack-desktop-smoke.mp4`;
- `slack-desktop-smoke-preview.gif`;
- `slack-desktop-smoke-change.mp4`;
- `mantis-slack-desktop-smoke-summary.json`;
- `mantis-slack-desktop-smoke-report.md`;
- لاگ‌های راه دور مانند `slack-desktop-command.log`، `openclaw-gateway.log`،
  `chrome.log`، و `ffmpeg.log`.

دیدگاه PR با نشانگر پنهان
`<!-- mantis-slack-desktop-smoke -->` درجا به‌روزرسانی می‌شود.

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

از `--hydrate-mode prehydrated` فقط وقتی استفاده کنید که فضای کاری راه دورِ دوباره‌استفاده‌شده از قبل
`node_modules` و یک `dist/` ساخته‌شده داشته باشد. اگر این موارد
موجود نباشند، Mantis بسته شکست می‌خورد.

رابط کاربری تأیید بومی Slack را اثبات کنید:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

حالت نقطه‌بررسی تأیید با `--gateway-setup` ناسازگار است. این حالت
سناریوهای اختیاری `slack-approval-exec-native` و `slack-approval-plugin-native`
را اجرا می‌کند، مگر اینکه پرچم‌های صریح نقطه‌بررسی تأیید `--scenario` را بدهید؛ سناریوهای دیگر
Slack پیش از شروع VM رد می‌شوند. اجراکننده QA Slack
هر فایل JSON نقطه‌بررسی را از پیام واقعی Slack API که مشاهده کرده می‌نویسد، سپس
ناظر راه دور آن snapshot پیام را در
`approval-checkpoints/<scenario>-pending.png` و
`approval-checkpoints/<scenario>-resolved.png` رندر می‌کند. اگر هر JSON نقطه‌بررسی،
شواهد پیام، JSON تأیید، یا اسکرین‌شات رندرشده وجود نداشته باشد یا خالی باشد، اجرا شکست می‌خورد.

اجاره‌های سرد GitHub Actions کوکی‌های Slack Web ندارند، بنابراین ثبت مرورگر آن‌ها
ممکن است روی ورود Slack فرود بیاید. برای اثبات نقطه‌بررسی تأیید، به
تصاویر رندرشده نقطه‌بررسی و مصنوعات QA Slack اعتماد کنید، نه
`slack-desktop-smoke.png`. فقط وقتی که خود اسکرین‌شات مرورگر باید Slack Web را نشان دهد،
از یک اجاره گرم نگه‌داشته‌شده با پروفایل Slack Web که دستی وارد شده استفاده کنید.

## حالت‌های hydrate

| حالت          | چه زمانی استفاده شود                                  | رفتار راه دور                                                                       | بده‌بستان                                                 |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | اثبات عادی PR، ماشین‌های سرد، CI        | `pnpm install --frozen-lockfile --prefer-offline` و `pnpm build` را داخل VM اجرا می‌کند | کندترین، قوی‌ترین اثبات checkout منبع                 |
| `prehydrated` | عمدا یک اجاره دوباره‌استفاده‌شده را آماده کرده‌اید | به `node_modules` و `dist/` موجود نیاز دارد؛ نصب/ساخت را رد می‌کند                     | سریع، اما فقط برای اجاره‌های گرم تحت کنترل اپراتور معتبر است |

GitHub Actions همیشه پیش از اجرای VM، checkout نامزد را آماده می‌کند. store
pnpm آن بر اساس OS، نسخه Node، و lockfile کش می‌شود. اجرای منبع VM نیز
در صورت وجود از `/var/cache/crabbox/pnpm` استفاده می‌کند.

## تفسیر زمان‌بندی

`mantis-slack-desktop-smoke-report.md` شامل زمان‌بندی فازها است:

- `crabbox.warmup`: بوت ارائه‌دهنده ابری، آمادگی دسکتاپ/مرورگر، و SSH.
- `crabbox.inspect`: جست‌وجوی فراداده اجاره.
- `credentials.prepare`: دریافت اجاره اعتبارنامه Convex.
- `crabbox.remote_run`: همگام‌سازی، راه‌اندازی مرورگر، نصب/ساخت OpenClaw یا
  اعتبارسنجی hydrate، راه‌اندازی Gateway، اسکرین‌شات، و ضبط ویدیو.
- `artifacts.copy`: rsync برگشتی از VM.

وقتی Crabbox پس از اینکه Mantis فراداده‌ای را کپی کرده که ثابت می‌کند یا راه‌اندازی
Gateway OpenClaw کامل شده یا خود فرمان QA Slack با موفقیت خارج شده است،
یک وضعیت راه دور غیرصفر برمی‌گرداند، `crabbox.remote_run` می‌تواند `accepted` علامت بخورد.
`accepted` را گذر با توضیح در نظر بگیرید، نه یک سناریوی شکست‌خورده.

اگر اجرا کند است:

- warmup غالب است: یک تصویر ارائه‌دهنده Crabbox بهتر را ازپیش‌بپزید یا ارتقا دهید؛
- remote_run در `source` غالب است: از یک اجاره گرم استفاده کنید، استفاده مجدد از store
  pnpm را بهبود دهید، یا پیش‌نیازهای ماشین را به تصویر ارائه‌دهنده منتقل کنید؛
- remote_run در `prehydrated` غالب است: فضای کاری راه دور در عمل
  آماده نبوده، یا راه‌اندازی Gateway/مرورگر/Slack کند است؛
- کپی مصنوع غالب است: اندازه ویدیو و محتوای دایرکتوری مصنوع را بررسی کنید.

## چک‌لیست شواهد

یک دیدگاه PR خوب باید نشان دهد:

- شناسه سناریو و SHA نامزد؛
- URL اجرای GitHub Actions؛
- URL مصنوع؛
- اسکرین‌شات درون‌خطی نقطه‌بررسی تأیید، یا یک اسکرین‌شات Slack Web از یک
  اجاره گرم واردشده؛
- پیش‌نمایش متحرک درون‌خطی وقتی موجود است؛
- لینک‌های MP4 کامل و MP4 بریده‌شده؛
- وضعیت گذر/شکست؛
- خلاصه زمان‌بندی در گزارش پیوست‌شده.

اسکرین‌شات‌ها یا ویدیوها را در مخزن commit نکنید. آن‌ها را در مصنوعات GitHub
Actions یا دیدگاه PR نگه دارید.

## مدیریت شکست

اگر گردش‌کار پیش از اجرای VM شکست خورد، ابتدا job مربوط به Actions را بررسی کنید. علت‌های معمول
`candidate_ref` نامطمئن، secrets محیطی گم‌شده، یا شکست نصب/ساخت نامزد هستند.

اگر اجرای VM شکست خورد اما اسکرین‌شات‌ها برگشت داده شدند، بررسی کنید:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

اگر اجرا اجاره را نگه داشته است، VNC را با فرمان `crabbox vnc ...` موجود در گزارش باز کنید.
وقتی کار تمام شد، اجاره را متوقف کنید:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

اگر ورود Slack منقضی شده است، آن را در VNC روی یک اجاره نگه‌داشته‌شده تعمیر کنید و با
`--lease-id` دوباره اجرا کنید. آن پروفایل مرورگر را در تصویر ارائه‌دهنده نپزید.

## مرتبط

- [نمای کلی QA](/fa/concepts/qa-e2e-automation)
- [کانال Slack](/fa/channels/slack)
- [تست کردن](/fa/help/testing)
