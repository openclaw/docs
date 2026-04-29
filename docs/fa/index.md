---
read_when:
    - معرفی OpenClaw به تازه‌واردان
summary: OpenClaw یک Gateway چندکاناله برای عامل‌های هوش مصنوعی است که روی هر سیستم‌عاملی اجرا می‌شود.
title: OpenClaw
x-i18n:
    generated_at: "2026-04-29T23:00:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 923d34fa604051d502e4bc902802d6921a4b89a9447f76123aa8d2ff085f0b99
    source_path: index.md
    workflow: 16
---

# OpenClaw 🦞

<p align="center">
    <img
        src="/assets/openclaw-logo-text-dark.png"
        alt="OpenClaw"
        width="500"
        class="dark:hidden"
    />
    <img
        src="/assets/openclaw-logo-text.png"
        alt="OpenClaw"
        width="500"
        class="hidden dark:block"
    />
</p>

> _"لایه‌برداری کن! لایه‌برداری کن!"_ — احتمالاً یک خرچنگ فضایی

<p align="center">
  <strong>Gateway برای هر سیستم‌عامل، برای عامل‌های هوش مصنوعی در Discord، Google Chat، iMessage، Matrix، Microsoft Teams، Signal، Slack، Telegram، WhatsApp، Zalo و موارد بیشتر.</strong><br />
  پیام بفرستید و پاسخ عامل را از جیب خود دریافت کنید. یک Gateway را در کانال‌های داخلی، Plugin‌های کانال همراه، WebChat و Node‌های موبایل اجرا کنید.
</p>

<Columns>
  <Card title="شروع کنید" href="/fa/start/getting-started" icon="rocket">
    OpenClaw را نصب کنید و Gateway را در چند دقیقه راه‌اندازی کنید.
  </Card>
  <Card title="اجرای راه‌اندازی اولیه" href="/fa/start/wizard" icon="sparkles">
    راه‌اندازی هدایت‌شده با `openclaw onboard` و جریان‌های جفت‌سازی.
  </Card>
  <Card title="باز کردن رابط کنترل" href="/fa/web/control-ui" icon="layout-dashboard">
    داشبورد مرورگر را برای گفت‌وگو، پیکربندی و نشست‌ها اجرا کنید.
  </Card>
</Columns>

## OpenClaw چیست؟

OpenClaw یک **Gateway خودمیزبان** است که برنامه‌های گفت‌وگو و سطوح کانالی محبوب شما را — کانال‌های داخلی به‌همراه Plugin‌های کانال همراه یا خارجی مانند Discord، Google Chat، iMessage، Matrix، Microsoft Teams، Signal، Slack، Telegram، WhatsApp، Zalo و موارد بیشتر — به عامل‌های کدنویسی هوش مصنوعی مانند Pi متصل می‌کند. شما یک فرایند Gateway واحد را روی دستگاه خودتان (یا یک سرور) اجرا می‌کنید و این فرایند به پل میان برنامه‌های پیام‌رسان شما و یک دستیار هوش مصنوعی همیشه دردسترس تبدیل می‌شود.

**برای چه کسانی است؟** توسعه‌دهندگان و کاربران حرفه‌ای که یک دستیار هوش مصنوعی شخصی می‌خواهند که بتوانند از هر جا به آن پیام بدهند، بدون اینکه کنترل داده‌هایشان را واگذار کنند یا به یک سرویس میزبانی‌شده وابسته باشند.

**چه چیزی آن را متفاوت می‌کند؟**

- **خودمیزبان**: روی سخت‌افزار شما و طبق قواعد شما اجرا می‌شود
- **چندکاناله**: یک Gateway به‌طور هم‌زمان کانال‌های داخلی و Plugin‌های کانال همراه یا خارجی را سرویس می‌دهد
- **عامل‌محور**: برای عامل‌های کدنویسی با استفاده از ابزار، نشست‌ها، حافظه و مسیریابی چندعاملی ساخته شده است
- **متن‌باز**: با مجوز MIT و جامعه‌محور

**به چه چیزهایی نیاز دارید؟** Node 24 (توصیه‌شده)، یا Node 22 LTS (`22.14+`) برای سازگاری، یک کلید API از ارائه‌دهنده انتخابی شما، و ۵ دقیقه زمان. برای بهترین کیفیت و امنیت، از قوی‌ترین مدل نسل جدید موجود استفاده کنید.

## چگونه کار می‌کند

```mermaid
flowchart LR
  A["Chat apps + plugins"] --> B["Gateway"]
  B --> C["Pi agent"]
  B --> D["CLI"]
  B --> E["Web Control UI"]
  B --> F["macOS app"]
  B --> G["iOS and Android nodes"]
```

Gateway منبع واحد حقیقت برای نشست‌ها، مسیریابی و اتصال‌های کانالی است.

## قابلیت‌های کلیدی

<Columns>
  <Card title="Gateway چندکاناله" icon="network" href="/fa/channels">
    Discord، iMessage، Signal، Slack، Telegram، WhatsApp، WebChat و موارد بیشتر با یک فرایند Gateway واحد.
  </Card>
  <Card title="کانال‌های Plugin" icon="plug" href="/fa/tools/plugin">
    Plugin‌های همراه، Matrix، Nostr، Twitch، Zalo و موارد بیشتر را در نسخه‌های عادی فعلی اضافه می‌کنند.
  </Card>
  <Card title="مسیریابی چندعاملی" icon="route" href="/fa/concepts/multi-agent">
    نشست‌های ایزوله برای هر عامل، فضای کاری یا فرستنده.
  </Card>
  <Card title="پشتیبانی از رسانه" icon="image" href="/fa/nodes/images">
    تصویر، صدا و سند ارسال و دریافت کنید.
  </Card>
  <Card title="رابط کنترل وب" icon="monitor" href="/fa/web/control-ui">
    داشبورد مرورگر برای گفت‌وگو، پیکربندی، نشست‌ها و Node‌ها.
  </Card>
  <Card title="Node‌های موبایل" icon="smartphone" href="/fa/nodes">
    Node‌های iOS و Android را برای جریان‌های کاری مجهز به Canvas، دوربین و صدا جفت کنید.
  </Card>
</Columns>

## شروع سریع

<Steps>
  <Step title="نصب OpenClaw">
    ```bash
    npm install -g openclaw@latest
    ```
  </Step>
  <Step title="راه‌اندازی اولیه و نصب سرویس">
    ```bash
    openclaw onboard --install-daemon
    ```
  </Step>
  <Step title="گفت‌وگو">
    رابط کنترل را در مرورگر خود باز کنید و پیام بفرستید:

    ```bash
    openclaw dashboard
    ```

    یا یک کانال را متصل کنید ([Telegram](/fa/channels/telegram) سریع‌ترین است) و از تلفن خود گفت‌وگو کنید.

  </Step>
</Steps>

به نصب کامل و راه‌اندازی توسعه نیاز دارید؟ [شروع به کار](/fa/start/getting-started) را ببینید.

## داشبورد

پس از شروع Gateway، رابط کنترل مرورگر را باز کنید.

- پیش‌فرض محلی: [http://127.0.0.1:18789/](http://127.0.0.1:18789/)
- دسترسی راه‌دور: [سطوح وب](/fa/web) و [Tailscale](/fa/gateway/tailscale)

<p align="center">
  <img src="/whatsapp-openclaw.jpg" alt="OpenClaw" width="420" />
</p>

## پیکربندی (اختیاری)

پیکربندی در `~/.openclaw/openclaw.json` قرار دارد.

- اگر **کاری انجام ندهید**، OpenClaw از باینری همراه Pi در حالت RPC با نشست‌های جداگانه برای هر فرستنده استفاده می‌کند.
- اگر می‌خواهید آن را محدود کنید، با `channels.whatsapp.allowFrom` و (برای گروه‌ها) قواعد اشاره شروع کنید.

نمونه:

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  messages: { groupChat: { mentionPatterns: ["@openclaw"] } },
}
```

## از اینجا شروع کنید

<Columns>
  <Card title="هاب‌های مستندات" href="/fa/start/hubs" icon="book-open">
    همه مستندات و راهنماها، سازمان‌دهی‌شده بر اساس مورد استفاده.
  </Card>
  <Card title="پیکربندی" href="/fa/gateway/configuration" icon="settings">
    تنظیمات اصلی Gateway، توکن‌ها و پیکربندی ارائه‌دهنده.
  </Card>
  <Card title="دسترسی راه‌دور" href="/fa/gateway/remote" icon="globe">
    الگوهای دسترسی SSH و tailnet.
  </Card>
  <Card title="کانال‌ها" href="/fa/channels/telegram" icon="message-square">
    راه‌اندازی ویژه هر کانال برای Feishu، Microsoft Teams، WhatsApp، Telegram، Discord و موارد بیشتر.
  </Card>
  <Card title="Node‌ها" href="/fa/nodes" icon="smartphone">
    Node‌های iOS و Android با جفت‌سازی، Canvas، دوربین و کنش‌های دستگاه.
  </Card>
  <Card title="راهنما" href="/fa/help" icon="life-buoy">
    اصلاحات رایج و نقطه ورود عیب‌یابی.
  </Card>
</Columns>

## بیشتر بیاموزید

<Columns>
  <Card title="فهرست کامل ویژگی‌ها" href="/fa/concepts/features" icon="list">
    قابلیت‌های کامل کانال، مسیریابی و رسانه.
  </Card>
  <Card title="مسیریابی چندعاملی" href="/fa/concepts/multi-agent" icon="route">
    ایزوله‌سازی فضای کاری و نشست‌های جداگانه برای هر عامل.
  </Card>
  <Card title="امنیت" href="/fa/gateway/security" icon="shield">
    توکن‌ها، فهرست‌های مجاز و کنترل‌های ایمنی.
  </Card>
  <Card title="عیب‌یابی" href="/fa/gateway/troubleshooting" icon="wrench">
    عیب‌یابی Gateway و خطاهای رایج.
  </Card>
  <Card title="درباره و قدردانی‌ها" href="/fa/reference/credits" icon="info">
    خاستگاه پروژه، مشارکت‌کنندگان و مجوز.
  </Card>
</Columns>
