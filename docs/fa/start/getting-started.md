---
read_when:
    - نخستین راه‌اندازی از صفر
    - می‌خواهید سریع‌ترین مسیر را برای رسیدن به یک چتِ آماده‌به‌کار داشته باشید
summary: OpenClaw را نصب کنید و ظرف چند دقیقه نخستین گفت‌وگوی خود را اجرا کنید.
title: شروع به کار
x-i18n:
    generated_at: "2026-06-27T18:53:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 769682cfa35a361cc4adc49f010fed18cf897ce66e1404d07b631e4dede64de8
    source_path: start/getting-started.md
    workflow: 16
---

OpenClaw را نصب کنید، راه‌اندازی اولیه را اجرا کنید، و با دستیار هوش مصنوعی خود گفت‌وگو کنید — همه در
حدود ۵ دقیقه. در پایان، یک Gateway در حال اجرا، احراز هویت پیکربندی‌شده،
و یک نشست گفت‌وگوی فعال خواهید داشت.

## آنچه نیاز دارید

- **Node.js** — Node 24 توصیه می‌شود (Node 22.19+ نیز پشتیبانی می‌شود)
- **یک کلید API** از یک ارائه‌دهنده مدل (Anthropic، OpenAI، Google و غیره) — راه‌اندازی اولیه از شما می‌خواهد آن را وارد کنید

<Tip>
نسخه Node خود را با `node --version` بررسی کنید.
**کاربران Windows:** برنامه بومی Windows Hub ساده‌ترین مسیر دسکتاپ است. مسیرهای
نصب‌کننده PowerShell و WSL2 Gateway نیز پشتیبانی می‌شوند. [Windows](/fa/platforms/windows) را ببینید.
نیاز به نصب Node دارید؟ [راه‌اندازی Node](/fa/install/node) را ببینید.
</Tip>

## راه‌اندازی سریع

<Steps>
  <Step title="Install OpenClaw">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Install Script Process"
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
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    این جادوگر شما را در انتخاب ارائه‌دهنده مدل، تنظیم کلید API،
    و پیکربندی Gateway راهنمایی می‌کند. حدود ۲ دقیقه زمان می‌برد.

    برای مرجع کامل، [راه‌اندازی اولیه (CLI)](/fa/start/wizard) را ببینید.

  </Step>
  <Step title="Verify the Gateway is running">
    ```bash
    openclaw gateway status
    ```

    باید ببینید که Gateway روی پورت 18789 در حال گوش‌دادن است.

  </Step>
  <Step title="Open the dashboard">
    ```bash
    openclaw dashboard
    ```

    این کار Control UI را در مرورگر شما باز می‌کند. اگر بارگذاری شد، همه‌چیز کار می‌کند.

  </Step>
  <Step title="Send your first message">
    در گفت‌وگوی Control UI یک پیام تایپ کنید و باید یک پاسخ هوش مصنوعی دریافت کنید.

    می‌خواهید به‌جای آن از گوشی خود گفت‌وگو کنید؟ سریع‌ترین کانال برای راه‌اندازی
    [Telegram](/fa/channels/telegram) است (فقط یک توکن ربات). برای همه گزینه‌ها، [کانال‌ها](/fa/channels)
    را ببینید.

  </Step>
</Steps>

<Accordion title="Advanced: mount a custom Control UI build">
  اگر یک بیلد داشبورد بومی‌سازی‌شده یا سفارشی نگه‌داری می‌کنید،
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

Gateway را دوباره راه‌اندازی کنید و داشبورد را دوباره باز کنید:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## کار بعدی چیست

<Columns>
  <Card title="Connect a channel" href="/fa/channels" icon="message-square">
    Discord، Feishu، iMessage، Matrix، Microsoft Teams، Signal، Slack، Telegram، WhatsApp، Zalo، و موارد دیگر.
  </Card>
  <Card title="Pairing and safety" href="/fa/channels/pairing" icon="shield">
    کنترل کنید چه کسی می‌تواند به عامل شما پیام بدهد.
  </Card>
  <Card title="Configure the Gateway" href="/fa/gateway/configuration" icon="settings">
    مدل‌ها، ابزارها، sandbox، و تنظیمات پیشرفته.
  </Card>
  <Card title="Browse tools" href="/fa/tools" icon="wrench">
    مرورگر، exec، جست‌وجوی وب، Skills، و Pluginها.
  </Card>
</Columns>

<Accordion title="Advanced: environment variables">
  اگر OpenClaw را به‌عنوان یک حساب سرویس اجرا می‌کنید یا مسیرهای سفارشی می‌خواهید:

- `OPENCLAW_HOME` — دایرکتوری خانه برای حل مسیرهای داخلی
- `OPENCLAW_STATE_DIR` — بازنویسی دایرکتوری وضعیت
- `OPENCLAW_CONFIG_PATH` — بازنویسی مسیر فایل پیکربندی

مرجع کامل: [متغیرهای محیطی](/fa/help/environment).
</Accordion>

## مرتبط

- [نمای کلی نصب](/fa/install)
- [نمای کلی کانال‌ها](/fa/channels)
- [راه‌اندازی](/fa/start/setup)
