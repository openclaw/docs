---
read_when:
    - می‌خواهید Plugin‌های شخص ثالث OpenClaw را پیدا کنید
    - می‌خواهید Plugin خودتان را منتشر کنید یا فهرست کنید
summary: 'Plugin‌های OpenClaw که توسط جامعه نگه‌داری می‌شوند: مرور، نصب، و ارسال Plugin خودتان'
title: Plugin‌های جامعه
x-i18n:
    generated_at: "2026-05-10T19:54:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: ee23598011f79f46b9171296501605cf0a5ef5aa7b67040135ea47cac21ca6a4
    source_path: plugins/community.md
    workflow: 16
---

Plugin‌های جامعه بسته‌های شخص ثالثی هستند که OpenClaw را با
کانال‌ها، ابزارها، ارائه‌دهندگان یا قابلیت‌های دیگر گسترش می‌دهند. آن‌ها توسط
جامعه ساخته و نگهداری می‌شوند، معمولا در [ClawHub](/fa/clawhub) منتشر می‌شوند و با
یک فرمان قابل نصب هستند. npm برای مشخصات بسته‌ی ساده همچنان پیش‌فرض راه‌اندازی
می‌ماند، در حالی که نصب بسته‌های ClawHub در حال عرضه است.

ClawHub سطح کشف معیار برای Plugin‌های جامعه است. فقط برای افزودن Plugin خود در
اینجا جهت دیده‌شدن، PRهای صرفا مستنداتی باز نکنید؛ به‌جای آن، آن را در
ClawHub منتشر کنید.

```bash
openclaw plugins install clawhub:<package-name>
```

برای بسته‌های میزبانی‌شده در npm از `openclaw plugins install <package-name>` استفاده کنید.

## Plugin‌های فهرست‌شده

### Apify

داده‌ها را از هر وب‌سایتی با بیش از ۲۰٬۰۰۰ خزشگر آماده استخراج کنید. اجازه دهید عامل شما
فقط با درخواست، داده‌ها را از Instagram، Facebook، TikTok، YouTube، Google Maps، Google
Search، سایت‌های تجارت الکترونیک و موارد دیگر استخراج کند.

- **npm:** `@apify/apify-openclaw-plugin`
- **مخزن:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

پل مستقل OpenClaw برای گفت‌وگوهای Codex App Server. یک چت را به
یک رشته‌ی Codex متصل کنید، با متن ساده با آن صحبت کنید، و آن را با فرمان‌های
بومی چت برای ازسرگیری، برنامه‌ریزی، بازبینی، انتخاب مدل، Compaction و موارد دیگر کنترل کنید.

- **npm:** `openclaw-codex-app-server`
- **مخزن:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

یکپارچه‌سازی ربات سازمانی با استفاده از حالت Stream. از پیام‌های متنی، تصویری و
فایل از طریق هر کلاینت DingTalk پشتیبانی می‌کند.

- **npm:** `@largezhou/ddingtalk`
- **مخزن:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin مدیریت زمینه‌ی بدون اتلاف برای OpenClaw. خلاصه‌سازی گفت‌وگوی مبتنی بر DAG
با Compaction افزایشی — در حالی که مصرف توکن را کاهش می‌دهد، وفاداری کامل زمینه را
حفظ می‌کند.

- **npm:** `@martian-engineering/lossless-claw`
- **مخزن:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin رسمی که ردگیری‌های عامل را به Opik صادر می‌کند. رفتار عامل،
هزینه، توکن‌ها، خطاها و موارد دیگر را پایش کنید.

- **npm:** `@opik/opik-openclaw`
- **مخزن:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

به عامل OpenClaw خود یک آواتار Live2D با همگام‌سازی لب در زمان واقعی، بیان‌های
احساسی و تبدیل متن به گفتار بدهید. شامل ابزارهای سازنده برای تولید دارایی‌های هوش مصنوعی
و استقرار یک‌کلیکی در Prometheus Marketplace است. در حال حاضر در مرحله‌ی آلفا است.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **مخزن:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

OpenClaw را از طریق QQ Bot API به QQ متصل کنید. از چت‌های خصوصی، اشاره‌های گروهی،
پیام‌های کانال، و رسانه‌های غنی شامل صدا، تصویر، ویدیو و فایل پشتیبانی می‌کند.

انتشارهای فعلی OpenClaw شامل QQ Bot هستند. برای نصب‌های عادی از راه‌اندازی بسته‌شده در
[QQ Bot](/fa/channels/qqbot) استفاده کنید؛ این Plugin خارجی را فقط زمانی نصب کنید
که عمدا بسته‌ی مستقل نگهداری‌شده توسط Tencent را می‌خواهید.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **مخزن:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin کانال WeCom برای OpenClaw توسط تیم Tencent WeCom. با تکیه بر
اتصال‌های پایدار WeCom Bot WebSocket، از پیام‌های مستقیم و چت‌های گروهی،
پاسخ‌های جریانی، پیام‌رسانی پیش‌دستانه، پردازش تصویر/فایل، قالب‌بندی Markdown،
کنترل دسترسی داخلی و Skills سند/جلسه/پیام‌رسانی پشتیبانی می‌کند.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **مخزن:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Plugin کانال Yuanbao برای OpenClaw توسط تیم Tencent Yuanbao. با تکیه بر
اتصال‌های پایدار WebSocket، از پیام‌های مستقیم و چت‌های گروهی،
پاسخ‌های جریانی، پیام‌رسانی پیش‌دستانه، پردازش تصویر/فایل/صدا/ویدیو،
قالب‌بندی Markdown، کنترل دسترسی داخلی و منوهای فرمان اسلش پشتیبانی می‌کند.

- **npm:** `openclaw-plugin-yuanbao`
- **مخزن:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Plugin خود را ارسال کنید

ما از Plugin‌های جامعه که مفید، مستند و ایمن برای اجرا هستند استقبال می‌کنیم.

<Steps>
  <Step title="Publish to ClawHub or npm">
    Plugin شما باید از طریق `openclaw plugins install \<package-name\>` قابل نصب باشد.
    آن را در [ClawHub](/fa/clawhub) منتشر کنید، مگر اینکه مشخصا به توزیع فقط از طریق npm
    نیاز داشته باشید.
    برای راهنمای کامل، [ساخت Plugin‌ها](/fa/plugins/building-plugins) را ببینید.

  </Step>

  <Step title="Host on GitHub">
    کد منبع باید در یک مخزن عمومی همراه با مستندات راه‌اندازی و رهگیر مسئله
    باشد.

  </Step>

  <Step title="Use docs PRs only for source-doc changes">
    صرفا برای قابل کشف کردن Plugin خود به PR مستندات نیاز ندارید. به‌جای آن، آن را
    در ClawHub منتشر کنید.

    فقط زمانی PR مستندات باز کنید که مستندات منبع OpenClaw به تغییر محتوایی واقعی
    نیاز داشته باشند، مانند اصلاح راهنمای نصب یا افزودن مستندات میان‌مخزنی
    که به مجموعه‌ی اصلی مستندات تعلق دارد.

  </Step>
</Steps>

## معیار کیفیت

| الزام                        | دلیل                                           |
| ---------------------------- | ---------------------------------------------- |
| منتشرشده در ClawHub یا npm   | کاربران نیاز دارند `openclaw plugins install` کار کند |
| مخزن عمومی GitHub            | بازبینی منبع، پیگیری مسئله، شفافیت            |
| مستندات راه‌اندازی و استفاده | کاربران باید بدانند چگونه آن را پیکربندی کنند |
| نگهداری فعال                 | به‌روزرسانی‌های اخیر یا رسیدگی پاسخ‌گو به مسائل |

بسته‌های پوششی کم‌تلاش، مالکیت نامشخص، یا بسته‌های نگهداری‌نشده ممکن است رد شوند.

## مرتبط

- [نصب و پیکربندی Plugin‌ها](/fa/tools/plugin) — چگونگی نصب هر Plugin
- [ساخت Plugin‌ها](/fa/plugins/building-plugins) — مورد خودتان را بسازید
- [مانیفست Plugin](/fa/plugins/manifest) — شِمای مانیفست
