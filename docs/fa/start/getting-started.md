---
read_when:
    - راه‌اندازی اولیه از صفر
    - شما سریع‌ترین راه برای راه‌اندازی یک چتِ کارا را می‌خواهید
summary: OpenClaw را نصب کنید و نخستین گفت‌وگوی خود را در چند دقیقه اجرا کنید.
title: شروع به کار
x-i18n:
    generated_at: "2026-04-29T23:36:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe3f92b1464ebf0a5b631c293fa4a3e4b686fdb35c1152663428025dd3c01259
    source_path: start/getting-started.md
    workflow: 16
---

OpenClaw را نصب کنید، onboarding را اجرا کنید و با دستیار هوش مصنوعی خود گپ بزنید — همه در
حدود ۵ دقیقه. در پایان، یک Gateway در حال اجرا، احراز هویت پیکربندی‌شده
و یک نشست گفت‌وگوی فعال خواهید داشت.

## آنچه نیاز دارید

- **Node.js** — Node 24 توصیه می‌شود (Node 22.14+ نیز پشتیبانی می‌شود)
- **یک کلید API** از یک ارائه‌دهنده مدل (Anthropic، OpenAI، Google و غیره) — onboarding از شما درخواست می‌کند

<Tip>
نسخه Node خود را با `node --version` بررسی کنید.
**کاربران Windows:** هم Windows بومی و هم WSL2 پشتیبانی می‌شوند. WSL2 پایدارتر است
و برای تجربه کامل توصیه می‌شود. [Windows](/fa/platforms/windows) را ببینید.
نیاز به نصب Node دارید؟ [راه‌اندازی Node](/fa/install/node) را ببینید.
</Tip>

## راه‌اندازی سریع

<Steps>
  <Step title="نصب OpenClaw">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="فرآیند اسکریپت نصب"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    روش‌های نصب دیگر (Docker، Nix، npm): [نصب](/fa/install).
    </Note>

  </Step>
  <Step title="اجرای onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    راهنما شما را در انتخاب ارائه‌دهنده مدل، تنظیم کلید API
    و پیکربندی Gateway هدایت می‌کند. حدود ۲ دقیقه طول می‌کشد.

    برای مرجع کامل، [Onboarding (CLI)](/fa/start/wizard) را ببینید.

  </Step>
  <Step title="بررسی اجرای Gateway">
    ```bash
    openclaw gateway status
    ```

    باید ببینید که Gateway روی پورت 18789 گوش می‌دهد.

  </Step>
  <Step title="باز کردن داشبورد">
    ```bash
    openclaw dashboard
    ```

    این کار Control UI را در مرورگر شما باز می‌کند. اگر بارگذاری شد، همه چیز کار می‌کند.

  </Step>
  <Step title="ارسال نخستین پیام">
    پیامی را در گفت‌وگوی Control UI تایپ کنید و باید پاسخی از هوش مصنوعی دریافت کنید.

    می‌خواهید به‌جای آن از تلفن خود گپ بزنید؟ سریع‌ترین کانال برای راه‌اندازی
    [Telegram](/fa/channels/telegram) است (فقط یک توکن ربات). برای همه گزینه‌ها، [کانال‌ها](/fa/channels)
    را ببینید.

  </Step>
</Steps>

<Accordion title="پیشرفته: mount کردن یک ساخت Control UI سفارشی">
  اگر یک ساخت داشبورد بومی‌سازی‌شده یا سفارشی را نگهداری می‌کنید،
  `gateway.controlUi.root` را به دایرکتوری‌ای اشاره دهید که شامل دارایی‌های استاتیک
  ساخته‌شده و `index.html` شما باشد.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copy your built static files into that directory.
```

سپس تنظیم کنید:

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "root": "$HOME/.openclaw/control-ui-custom"
    }
  }
}
```

Gateway را بازراه‌اندازی کنید و داشبورد را دوباره باز کنید:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## کارهای بعدی

<Columns>
  <Card title="اتصال یک کانال" href="/fa/channels" icon="message-square">
    Discord، Feishu، iMessage، Matrix، Microsoft Teams، Signal، Slack، Telegram، WhatsApp، Zalo و موارد بیشتر.
  </Card>
  <Card title="جفت‌سازی و ایمنی" href="/fa/channels/pairing" icon="shield">
    کنترل کنید چه کسی می‌تواند به agent شما پیام بدهد.
  </Card>
  <Card title="پیکربندی Gateway" href="/fa/gateway/configuration" icon="settings">
    مدل‌ها، ابزارها، sandbox و تنظیمات پیشرفته.
  </Card>
  <Card title="مرور ابزارها" href="/fa/tools" icon="wrench">
    مرورگر، exec، جست‌وجوی وب، Skills و Pluginها.
  </Card>
</Columns>

<Accordion title="پیشرفته: متغیرهای محیطی">
  اگر OpenClaw را به‌عنوان حساب سرویس اجرا می‌کنید یا مسیرهای سفارشی می‌خواهید:

- `OPENCLAW_HOME` — دایرکتوری خانه برای حل مسیر داخلی
- `OPENCLAW_STATE_DIR` — بازنویسی دایرکتوری وضعیت
- `OPENCLAW_CONFIG_PATH` — بازنویسی مسیر فایل پیکربندی

مرجع کامل: [متغیرهای محیطی](/fa/help/environment).
</Accordion>

## مرتبط

- [نمای کلی نصب](/fa/install)
- [نمای کلی کانال‌ها](/fa/channels)
- [راه‌اندازی](/fa/start/setup)
