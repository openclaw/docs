---
read_when:
    - راه‌اندازی برای اولین بار از صفر
    - شما سریع‌ترین مسیر برای راه‌اندازی یک گفت‌وگوی کارآمد را می‌خواهید
summary: OpenClaw را نصب کنید و نخستین گفت‌وگوی خود را در چند دقیقه اجرا کنید.
title: شروع کار
x-i18n:
    generated_at: "2026-06-28T20:47:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 579ed2b4797dc851b0293b96a4177cc356641b6842fe45c4d48f4e8c224eef75
    source_path: start/getting-started.md
    workflow: 16
---

OpenClaw را نصب کنید، راه‌اندازی اولیه را اجرا کنید، و با دستیار هوش مصنوعی خود چت کنید — همه در
حدود ۵ دقیقه. در پایان، یک Gateway در حال اجرا، احراز هویت پیکربندی‌شده،
و یک جلسه چت فعال خواهید داشت.

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
    روش‌های دیگر نصب (Docker، Nix، npm): [نصب](/fa/install).
    </Note>

  </Step>
  <Step title="اجرای راه‌اندازی اولیه">
    ```bash
    openclaw onboard --install-daemon
    ```

    راهنما شما را در انتخاب ارائه‌دهنده مدل، تنظیم کلید API،
    و پیکربندی Gateway همراهی می‌کند. شروع سریع معمولا فقط چند دقیقه طول می‌کشد، اما
    ورود به ارائه‌دهنده، جفت‌سازی کانال، نصب daemon، دانلودهای شبکه، Skills،
    یا Pluginهای اختیاری می‌توانند باعث شوند راه‌اندازی کامل بیشتر طول بکشد. می‌توانید مراحل
    اختیاری را رد کنید و بعدا با `openclaw configure` برگردید.

    برای مرجع کامل، [راه‌اندازی اولیه (CLI)](/fa/start/wizard) را ببینید.

  </Step>
  <Step title="بررسی کنید Gateway در حال اجرا است">
    ```bash
    openclaw gateway status
    ```

    باید ببینید Gateway روی پورت 18789 در حال گوش دادن است.

  </Step>
  <Step title="باز کردن داشبورد">
    ```bash
    openclaw dashboard
    ```

    این کار Control UI را در مرورگر شما باز می‌کند. اگر بارگذاری شود، همه چیز کار می‌کند.

  </Step>
  <Step title="ارسال نخستین پیام">
    در چت Control UI یک پیام تایپ کنید و باید پاسخی از هوش مصنوعی دریافت کنید.

    می‌خواهید به‌جای آن از تلفن خود چت کنید؟ سریع‌ترین کانال برای راه‌اندازی
    [Telegram](/fa/channels/telegram) است (فقط یک توکن ربات). برای همه گزینه‌ها [کانال‌ها](/fa/channels)
    را ببینید.

  </Step>
</Steps>

<Accordion title="پیشرفته: نصب یک ساخت سفارشی Control UI">
  اگر یک ساخت داشبورد بومی‌سازی‌شده یا سفارشی را نگهداری می‌کنید،
  `gateway.controlUi.root` را به دایرکتوری‌ای اشاره دهید که شامل assets ایستای ساخته‌شده
  و `index.html` شما است.

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

## گام بعدی چیست

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
    مرورگر، exec، جست‌وجوی وب، Skills و Pluginها.
  </Card>
</Columns>

<Accordion title="پیشرفته: متغیرهای محیطی">
  اگر OpenClaw را به‌عنوان حساب سرویس اجرا می‌کنید یا مسیرهای سفارشی می‌خواهید:

- `OPENCLAW_HOME` — دایرکتوری خانه برای تفکیک مسیرهای داخلی
- `OPENCLAW_STATE_DIR` — بازنویسی دایرکتوری وضعیت
- `OPENCLAW_CONFIG_PATH` — بازنویسی مسیر فایل پیکربندی

مرجع کامل: [متغیرهای محیطی](/fa/help/environment).
</Accordion>

## مرتبط

- [نمای کلی نصب](/fa/install)
- [نمای کلی کانال‌ها](/fa/channels)
- [راه‌اندازی](/fa/start/setup)
