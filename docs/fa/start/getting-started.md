---
read_when:
    - راه‌اندازی اولیه از صفر
    - سریع‌ترین مسیر برای راه‌اندازی یک گفت‌وگوی فعال را می‌خواهید
summary: OpenClaw را نصب کنید و نخستین گفت‌وگوی خود را در چند دقیقه راه‌اندازی کنید.
title: شروع به کار
x-i18n:
    generated_at: "2026-05-07T13:32:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 295ce8fd03320027a77a3aef494f785f0fe58e0f57c72ee63f6f9aca68626c20
    source_path: start/getting-started.md
    workflow: 16
---

OpenClaw را نصب کنید، راه‌اندازی اولیه را اجرا کنید و با دستیار هوش مصنوعی خود گفت‌وگو کنید؛ همه در
حدود ۵ دقیقه. در پایان، یک Gateway در حال اجرا، احراز هویت پیکربندی‌شده
و یک نشست گفت‌وگوی فعال خواهید داشت.

## آنچه نیاز دارید

- **Node.js** — Node 24 توصیه می‌شود (Node 22.16+ نیز پشتیبانی می‌شود)
- **یک کلید API** از یک ارائه‌دهنده مدل (Anthropic، OpenAI، Google و غیره) — راه‌اندازی اولیه از شما آن را می‌خواهد

<Tip>
نسخه Node خود را با `node --version` بررسی کنید.
**کاربران Windows:** هم Windows بومی و هم WSL2 پشتیبانی می‌شوند. WSL2 پایدارتر است
و برای تجربه کامل توصیه می‌شود. [Windows](/fa/platforms/windows) را ببینید.
نیاز دارید Node را نصب کنید؟ [راه‌اندازی Node](/fa/install/node) را ببینید.
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
  alt="فرایند اسکریپت نصب"
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
  <Step title="اجرای راه‌اندازی اولیه">
    ```bash
    openclaw onboard --install-daemon
    ```

    این راهنما شما را در انتخاب یک ارائه‌دهنده مدل، تنظیم کلید API،
    و پیکربندی Gateway همراهی می‌کند. حدود ۲ دقیقه طول می‌کشد.

    برای مرجع کامل، [راه‌اندازی اولیه (CLI)](/fa/start/wizard) را ببینید.

  </Step>
  <Step title="بررسی کنید Gateway در حال اجرا است">
    ```bash
    openclaw gateway status
    ```

    باید ببینید که Gateway روی درگاه 18789 گوش می‌دهد.

  </Step>
  <Step title="باز کردن داشبورد">
    ```bash
    openclaw dashboard
    ```

    این کار Control UI را در مرورگر شما باز می‌کند. اگر بارگذاری شود، همه چیز کار می‌کند.

  </Step>
  <Step title="ارسال اولین پیام">
    در گفت‌وگوی Control UI یک پیام بنویسید و باید یک پاسخ هوش مصنوعی دریافت کنید.

    می‌خواهید به‌جای آن از گوشی خود گفت‌وگو کنید؟ سریع‌ترین کانال برای راه‌اندازی
    [Telegram](/fa/channels/telegram) است (فقط یک توکن بات). برای همه گزینه‌ها، [کانال‌ها](/fa/channels)
    را ببینید.

  </Step>
</Steps>

<Accordion title="پیشرفته: اتصال یک ساخت سفارشی Control UI">
  اگر یک ساخت داشبورد بومی‌سازی‌شده یا سفارشی نگه‌داری می‌کنید،
  `gateway.controlUi.root` را به پوشه‌ای اشاره دهید که دارایی‌های ایستای ساخته‌شده
  و `index.html` شما را در خود دارد.

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

## گام بعدی

<Columns>
  <Card title="اتصال یک کانال" href="/fa/channels" icon="message-square">
    Discord، Feishu، iMessage، Matrix، Microsoft Teams، Signal، Slack، Telegram، WhatsApp، Zalo و موارد بیشتر.
  </Card>
  <Card title="جفت‌سازی و ایمنی" href="/fa/channels/pairing" icon="shield">
    کنترل کنید چه کسی می‌تواند به عامل شما پیام بدهد.
  </Card>
  <Card title="پیکربندی Gateway" href="/fa/gateway/configuration" icon="settings">
    مدل‌ها، ابزارها، sandbox، و تنظیمات پیشرفته.
  </Card>
  <Card title="مرور ابزارها" href="/fa/tools" icon="wrench">
    مرورگر، exec، جست‌وجوی وب، Skills، و pluginها.
  </Card>
</Columns>

<Accordion title="پیشرفته: متغیرهای محیطی">
  اگر OpenClaw را به‌عنوان یک حساب سرویس اجرا می‌کنید یا مسیرهای سفارشی می‌خواهید:

- `OPENCLAW_HOME` — پوشه خانگی برای رفع مسیرهای داخلی
- `OPENCLAW_STATE_DIR` — بازنویسی پوشه وضعیت
- `OPENCLAW_CONFIG_PATH` — بازنویسی مسیر فایل پیکربندی

مرجع کامل: [متغیرهای محیطی](/fa/help/environment).
</Accordion>

## مرتبط

- [نمای کلی نصب](/fa/install)
- [نمای کلی کانال‌ها](/fa/channels)
- [راه‌اندازی](/fa/start/setup)
