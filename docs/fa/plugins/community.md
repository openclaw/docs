---
read_when:
    - می‌خواهید Plugin‌های شخص ثالث OpenClaw را پیدا کنید
    - می‌خواهید Plugin خود را منتشر کنید یا در فهرست بیاورید
summary: 'Plugin‌های OpenClaw نگهداری‌شده توسط جامعه: مرور، نصب، و ارسال Plugin خودتان'
title: Plugin‌های جامعه
x-i18n:
    generated_at: "2026-04-29T23:14:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: a54130fefc55042d53270e5f7f4b49a4aad715570743013fbfe06b0e2fa067d0
    source_path: plugins/community.md
    workflow: 16
---

Pluginهای جامعه بسته‌های شخص ثالثی هستند که OpenClaw را با کانال‌ها، ابزارها، ارائه‌دهندگان یا قابلیت‌های دیگر گسترش می‌دهند. آن‌ها توسط جامعه ساخته و نگهداری می‌شوند، معمولا در [ClawHub](/fa/tools/clawhub) منتشر می‌شوند، و با یک فرمان قابل نصب هستند. npm همچنان برای بسته‌هایی که هنوز به ClawHub منتقل نشده‌اند، یک گزینه پشتیبان پشتیبانی‌شده است.

ClawHub سطح رسمی کشف برای Pluginهای جامعه است. صرفا برای افزودن Plugin خودتان به اینجا جهت دیده‌شدن، PR فقط-مستندات باز نکنید؛ در عوض آن را در ClawHub منتشر کنید.

```bash
openclaw plugins install <package-name>
```

OpenClaw ابتدا ClawHub را بررسی می‌کند و به‌صورت خودکار به npm برمی‌گردد.

## Pluginهای فهرست‌شده

### Apify

داده‌ها را از هر وب‌سایتی با بیش از ۲۰٬۰۰۰ خزنده آماده استخراج کنید. به عامل خود اجازه دهید فقط با درخواست کردن، داده‌ها را از Instagram، Facebook، TikTok، YouTube، Google Maps، Google Search، سایت‌های تجارت الکترونیک و موارد بیشتر استخراج کند.

- **npm:** `@apify/apify-openclaw-plugin`
- **مخزن:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

پل مستقل OpenClaw برای گفت‌وگوهای Codex App Server. یک چت را به یک رشته Codex متصل کنید، با متن ساده با آن صحبت کنید، و آن را با فرمان‌های بومی چت برای ازسرگیری، برنامه‌ریزی، بازبینی، انتخاب مدل، Compaction و موارد بیشتر کنترل کنید.

- **npm:** `openclaw-codex-app-server`
- **مخزن:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

یکپارچه‌سازی ربات سازمانی با استفاده از حالت Stream. از پیام‌های متنی، تصویری و فایل از طریق هر کلاینت DingTalk پشتیبانی می‌کند.

- **npm:** `@largezhou/ddingtalk`
- **مخزن:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin مدیریت زمینه بدون اتلاف برای OpenClaw. خلاصه‌سازی گفت‌وگو مبتنی بر DAG با Compaction افزایشی — دقت کامل زمینه را حفظ می‌کند و در عین حال مصرف توکن را کاهش می‌دهد.

- **npm:** `@martian-engineering/lossless-claw`
- **مخزن:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin رسمی که ردپاهای عامل را به Opik صادر می‌کند. رفتار عامل، هزینه، توکن‌ها، خطاها و موارد بیشتر را پایش کنید.

- **npm:** `@opik/opik-openclaw`
- **مخزن:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

به عامل OpenClaw خود یک آواتار Live2D با همگام‌سازی لب در زمان واقعی، بیان‌های احساسی و تبدیل متن به گفتار بدهید. شامل ابزارهای سازنده برای تولید دارایی‌های هوش مصنوعی و استقرار با یک کلیک در Prometheus Marketplace است. در حال حاضر در مرحله آلفا است.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **مخزن:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

OpenClaw را از طریق QQ Bot API به QQ متصل کنید. از چت‌های خصوصی، اشاره‌ها در گروه، پیام‌های کانال، و رسانه‌های غنی شامل صدا، تصویر، ویدیو و فایل پشتیبانی می‌کند.

نسخه‌های فعلی OpenClaw شامل QQ Bot هستند. برای نصب‌های معمول از راه‌اندازی همراه در [QQ Bot](/fa/channels/qqbot) استفاده کنید؛ این Plugin خارجی را فقط زمانی نصب کنید که عمدا بسته مستقل نگهداری‌شده توسط Tencent را می‌خواهید.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **مخزن:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin کانال WeCom برای OpenClaw از تیم Tencent WeCom. با اتصالات پایدار WeCom Bot WebSocket کار می‌کند و از پیام‌های مستقیم و چت‌های گروهی، پاسخ‌های جریانی، پیام‌رسانی پیش‌دستانه، پردازش تصویر/فایل، قالب‌بندی Markdown، کنترل دسترسی داخلی، و Skills مربوط به سند/جلسه/پیام‌رسانی پشتیبانی می‌کند.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **مخزن:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Plugin کانال Yuanbao برای OpenClaw از تیم Tencent Yuanbao. با اتصالات پایدار WebSocket کار می‌کند و از پیام‌های مستقیم و چت‌های گروهی، پاسخ‌های جریانی، پیام‌رسانی پیش‌دستانه، پردازش تصویر/فایل/صدا/ویدیو، قالب‌بندی Markdown، کنترل دسترسی داخلی، و منوهای فرمان اسلش پشتیبانی می‌کند.

- **npm:** `openclaw-plugin-yuanbao`
- **مخزن:** [github.com/yb-claw/openclaw-plugin-yuanbao](https://github.com/yb-claw/openclaw-plugin-yuanbao)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## ارسال Plugin خود

از Pluginهای جامعه که مفید، مستند و ایمن برای اجرا باشند استقبال می‌کنیم.

<Steps>
  <Step title="انتشار در ClawHub یا npm">
    Plugin شما باید از طریق `openclaw plugins install \<package-name\>` قابل نصب باشد.
    مگر اینکه مشخصا به توزیع فقط از طریق npm نیاز داشته باشید، آن را در [ClawHub](/fa/tools/clawhub) منتشر کنید.
    برای راهنمای کامل، [ساخت Pluginها](/fa/plugins/building-plugins) را ببینید.

  </Step>

  <Step title="میزبانی در GitHub">
    کد منبع باید در یک مخزن عمومی همراه با مستندات راه‌اندازی و ردیاب مسئله باشد.

  </Step>

  <Step title="استفاده از PRهای مستندات فقط برای تغییرات مستندات منبع">
    فقط برای قابل کشف کردن Plugin خودتان به PR مستندات نیاز ندارید. در عوض آن را در ClawHub منتشر کنید.

    فقط زمانی یک PR مستندات باز کنید که مستندات منبع OpenClaw به تغییر محتوایی واقعی نیاز داشته باشد، مانند اصلاح راهنمای نصب یا افزودن مستندات بین‌مخزنی که به مجموعه اصلی مستندات تعلق دارد.

  </Step>
</Steps>

## معیار کیفیت

| الزام                         | دلیل                                                     |
| ----------------------------- | -------------------------------------------------------- |
| منتشرشده در ClawHub یا npm    | کاربران باید بتوانند از `openclaw plugins install` استفاده کنند |
| مخزن عمومی GitHub             | بازبینی منبع، پیگیری مسئله، شفافیت                       |
| مستندات راه‌اندازی و استفاده  | کاربران باید بدانند چگونه آن را پیکربندی کنند            |
| نگهداری فعال                  | به‌روزرسانی‌های اخیر یا رسیدگی پاسخ‌گو به مسئله‌ها       |

بسته‌های کم‌زحمت، مالکیت نامشخص، یا بسته‌های نگهداری‌نشده ممکن است رد شوند.

## مرتبط

- [نصب و پیکربندی Pluginها](/fa/tools/plugin) — نحوه نصب هر Plugin
- [ساخت Pluginها](/fa/plugins/building-plugins) — Plugin خودتان را بسازید
- [مانیفست Plugin](/fa/plugins/manifest) — شمای مانیفست
