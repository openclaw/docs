---
read_when:
    - می‌خواهید Pluginهای شخص ثالث OpenClaw را پیدا کنید
    - می‌خواهید Plugin خودتان را منتشر یا فهرست کنید
summary: 'Plugin‌های OpenClaw که توسط جامعه نگهداری می‌شوند: مرور، نصب، و ارسال Plugin خودتان'
title: Plugin‌های جامعه
x-i18n:
    generated_at: "2026-05-02T20:48:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a58fbc153c837f5ac79ee70406a5611e8a9a273c18c0c5642763531fbe10dca
    source_path: plugins/community.md
    workflow: 16
---

Community Pluginها بسته‌های شخص ثالثی هستند که OpenClaw را با کانال‌ها، ابزارها، ارائه‌دهنده‌ها یا قابلیت‌های دیگر گسترش می‌دهند. آن‌ها توسط جامعه ساخته و نگهداری می‌شوند، معمولاً در [ClawHub](/fa/tools/clawhub) منتشر می‌شوند، و با یک فرمان نصب‌پذیر هستند. npm همچنان پیش‌فرض راه‌اندازی برای مشخصات بسته‌های خام است، در حالی که نصب‌های بسته‌ای ClawHub به‌تدریج عرضه می‌شوند.

ClawHub سطح رسمی کشف Community Pluginها است. فقط برای قابل‌کشف کردن Plugin خود اینجا، PRهای صرفاً مستنداتی باز نکنید؛ در عوض آن را در ClawHub منتشر کنید.

```bash
openclaw plugins install clawhub:<package-name>
```

برای بسته‌های میزبانی‌شده در npm از `openclaw plugins install <package-name>` استفاده کنید.

## Pluginهای فهرست‌شده

### Apify

داده‌ها را از هر وب‌سایتی با بیش از ۲۰٬۰۰۰ اسکرپر آماده استخراج کنید. به عامل خود اجازه دهید داده‌ها را از Instagram، Facebook، TikTok، YouTube، Google Maps، Google Search، سایت‌های تجارت الکترونیک و موارد دیگر فقط با درخواست کردن استخراج کند.

- **npm:** `@apify/apify-openclaw-plugin`
- **مخزن:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

پل مستقل OpenClaw برای گفتگوهای Codex App Server. یک چت را به یک رشته Codex متصل کنید، با متن ساده با آن صحبت کنید، و با فرمان‌های بومی چت برای ادامه، برنامه‌ریزی، بازبینی، انتخاب مدل، Compaction و موارد دیگر کنترلش کنید.

- **npm:** `openclaw-codex-app-server`
- **مخزن:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

یکپارچه‌سازی ربات سازمانی با استفاده از حالت Stream. از پیام‌های متنی، تصویری و فایلی از طریق هر کلاینت DingTalk پشتیبانی می‌کند.

- **npm:** `@largezhou/ddingtalk`
- **مخزن:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin مدیریت زمینه بدون اتلاف برای OpenClaw. خلاصه‌سازی گفتگوی مبتنی بر DAG با Compaction افزایشی — ضمن کاهش مصرف توکن، وفاداری کامل زمینه را حفظ می‌کند.

- **npm:** `@martian-engineering/lossless-claw`
- **مخزن:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin رسمی که ردپاهای عامل را به Opik صادر می‌کند. رفتار عامل، هزینه، توکن‌ها، خطاها و موارد دیگر را پایش کنید.

- **npm:** `@opik/opik-openclaw`
- **مخزن:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

به عامل OpenClaw خود یک آواتار Live2D با همگام‌سازی زنده لب، بیان‌های احساسی و تبدیل متن به گفتار بدهید. شامل ابزارهای سازنده برای تولید دارایی‌های AI و استقرار یک‌کلیکی در Prometheus Marketplace است. در حال حاضر در مرحله آلفا است.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **مخزن:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

OpenClaw را از طریق QQ Bot API به QQ متصل کنید. از چت‌های خصوصی، اشاره‌های گروهی، پیام‌های کانال، و رسانه‌های غنی شامل صدا، تصویر، ویدئو و فایل‌ها پشتیبانی می‌کند.

انتشارهای فعلی OpenClaw شامل QQ Bot هستند. برای نصب‌های معمول از راه‌اندازی همراه در [QQ Bot](/fa/channels/qqbot) استفاده کنید؛ این Plugin خارجی را فقط زمانی نصب کنید که عمداً بسته مستقل نگهداری‌شده توسط Tencent را می‌خواهید.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **مخزن:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin کانال WeCom برای OpenClaw توسط تیم Tencent WeCom. این Plugin با اتصالات پایدار WeCom Bot WebSocket کار می‌کند و از پیام‌های مستقیم و چت‌های گروهی، پاسخ‌های جریانی، پیام‌رسانی کنشگرانه، پردازش تصویر/فایل، قالب‌بندی Markdown، کنترل دسترسی داخلی و Skillsهای سند/جلسه/پیام‌رسانی پشتیبانی می‌کند.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **مخزن:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Plugin کانال Yuanbao برای OpenClaw توسط تیم Tencent Yuanbao. این Plugin با اتصالات پایدار WebSocket کار می‌کند و از پیام‌های مستقیم و چت‌های گروهی، پاسخ‌های جریانی، پیام‌رسانی کنشگرانه، پردازش تصویر/فایل/صدا/ویدئو، قالب‌بندی Markdown، کنترل دسترسی داخلی و منوهای دستور اسلش پشتیبانی می‌کند.

- **npm:** `openclaw-plugin-yuanbao`
- **مخزن:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Plugin خود را ارسال کنید

از Community Pluginهایی که مفید، مستند و ایمن برای اجرا هستند استقبال می‌کنیم.

<Steps>
  <Step title="انتشار در ClawHub یا npm">
    Plugin شما باید از طریق `openclaw plugins install \<package-name\>` نصب‌پذیر باشد.
    آن را در [ClawHub](/fa/tools/clawhub) منتشر کنید، مگر اینکه مشخصاً به توزیع فقط از طریق npm نیاز داشته باشید.
    برای راهنمای کامل، [ساخت Pluginها](/fa/plugins/building-plugins) را ببینید.

  </Step>

  <Step title="میزبانی در GitHub">
    کد منبع باید در یک مخزن عمومی همراه با مستندات راه‌اندازی و رهگیر مسئله باشد.

  </Step>

  <Step title="استفاده از PRهای مستندات فقط برای تغییرات مستندات منبع">
    فقط برای قابل‌کشف کردن Plugin خود به PR مستندات نیاز ندارید. در عوض آن را در ClawHub منتشر کنید.

    فقط زمانی PR مستندات باز کنید که مستندات منبع OpenClaw به تغییر محتوایی واقعی نیاز داشته باشد، مانند اصلاح راهنمای نصب یا افزودن مستندات بین‌مخزنی که جای آن در مجموعه مستندات اصلی است.

  </Step>
</Steps>

## معیار کیفیت

| نیازمندی                    | دلیل                                           |
| --------------------------- | --------------------------------------------- |
| منتشرشده در ClawHub یا npm | کاربران نیاز دارند `openclaw plugins install` کار کند |
| مخزن عمومی GitHub          | بازبینی منبع، رهگیری مسئله، شفافیت            |
| مستندات راه‌اندازی و استفاده | کاربران باید بدانند چگونه آن را پیکربندی کنند |
| نگهداری فعال               | به‌روزرسانی‌های اخیر یا رسیدگی پاسخ‌گو به مسائل |

پوسته‌های کم‌زحمت، مالکیت نامشخص یا بسته‌های نگهداری‌نشده ممکن است رد شوند.

## مرتبط

- [نصب و پیکربندی Pluginها](/fa/tools/plugin) — نحوه نصب هر Plugin
- [ساخت Pluginها](/fa/plugins/building-plugins) — مورد خودتان را بسازید
- [مانیفست Plugin](/fa/plugins/manifest) — شمای مانیفست
