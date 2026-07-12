---
read_when:
    - راه‌اندازی اولیه از صفر
    - شما سریع‌ترین راه را برای راه‌اندازی یک گفت‌وگوی عملی می‌خواهید
summary: OpenClaw را نصب کنید و ظرف چند دقیقه نخستین گفت‌وگوی خود را اجرا کنید.
title: شروع به کار
x-i18n:
    generated_at: "2026-07-12T10:47:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 308ca58b8a11832b5a4c0d4634d1c88ef44681ef755a18d675bcff60b5aba929
    source_path: start/getting-started.md
    workflow: 16
---

OpenClaw را نصب کنید، فرایند راه‌اندازی اولیه را اجرا کنید و در حدود ۵
دقیقه با دستیار هوش مصنوعی خود گفتگو کنید. در پایان، یک Gateway در حال اجرا، احراز هویت پیکربندی‌شده و یک
جلسه گفتگوی فعال خواهید داشت.

## آنچه نیاز دارید

- **Node.js 22.19+، 23.11+ یا 24+** (نسخه 24 گزینه پیش‌فرض پیشنهادی است)
- **یک کلید API** از ارائه‌دهنده مدل (Anthropic، OpenAI، Google و غیره) — در فرایند راه‌اندازی اولیه از شما درخواست می‌شود

<Tip>
نسخه Node خود را با `node --version` بررسی کنید.
**کاربران Windows:** برنامه بومی Windows Hub ساده‌ترین مسیر برای استفاده روی دسکتاپ است. نصب‌کننده
PowerShell و مسیرهای Gateway در WSL2 نیز پشتیبانی می‌شوند. به [Windows](/fa/platforms/windows) مراجعه کنید.
نیاز به نصب Node دارید؟ به [راه‌اندازی Node](/fa/install/node) مراجعه کنید.
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

    راهنمای گام‌به‌گام شما را در انتخاب ارائه‌دهنده مدل، تنظیم کلید API و
    پیکربندی Gateway همراهی می‌کند. راه‌اندازی سریع معمولاً فقط چند دقیقه طول می‌کشد، اما
    ورود به حساب ارائه‌دهنده، جفت‌سازی کانال، نصب دیمون، بارگیری‌های شبکه، Skills
    یا Pluginهای اختیاری می‌توانند راه‌اندازی اولیه کامل را طولانی‌تر کنند. از مراحل اختیاری
    صرف‌نظر کنید و بعداً با `openclaw configure` به آن‌ها بازگردید.

    برای مرجع کامل، به [راه‌اندازی اولیه (CLI)](/fa/start/wizard) مراجعه کنید.

  </Step>
  <Step title="بررسی اجرای Gateway">
    ```bash
    openclaw gateway status
    ```

    باید مشاهده کنید که Gateway روی درگاه 18789 در حال گوش‌دادن است.

  </Step>
  <Step title="باز کردن داشبورد">
    ```bash
    openclaw dashboard
    ```

    این فرمان رابط کنترل را در مرورگر شما باز می‌کند. اگر بارگیری شود، همه‌چیز به‌درستی کار می‌کند.

  </Step>
  <Step title="ارسال نخستین پیام">
    پیامی را در گفتگوی رابط کنترل تایپ کنید؛ باید پاسخی از هوش مصنوعی دریافت کنید.

    ترجیح می‌دهید از تلفن خود گفتگو کنید؟ سریع‌ترین کانال برای راه‌اندازی
    [Telegram](/fa/channels/telegram) است (فقط به یک توکن ربات نیاز دارد). برای مشاهده همه گزینه‌ها، به [کانال‌ها](/fa/channels)
    مراجعه کنید.

  </Step>
</Steps>

<Accordion title="پیشرفته: سوار کردن یک ساخت سفارشی رابط کنترل">
  اگر از یک ساخت محلی‌سازی‌شده یا سفارشی داشبورد نگهداری می‌کنید،
  `gateway.controlUi.root` را به پوشه‌ای اشاره دهید که دارایی‌های ایستای ساخته‌شده
  و `index.html` شما را در بر دارد.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# فایل‌های ایستای ساخته‌شده خود را در آن پوشه کپی کنید.
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

Gateway را دوباره راه‌اندازی و داشبورد را باز کنید:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## گام‌های بعدی

<Columns>
  <Card title="اتصال یک کانال" href="/fa/channels" icon="message-square">
    Discord، Feishu، iMessage، Matrix، Microsoft Teams، Signal، Slack، Telegram، WhatsApp، Zalo و موارد دیگر.
  </Card>
  <Card title="جفت‌سازی و ایمنی" href="/fa/channels/pairing" icon="shield">
    کنترل کنید چه کسانی می‌توانند به عامل شما پیام دهند.
  </Card>
  <Card title="پیکربندی Gateway" href="/fa/gateway/configuration" icon="settings">
    مدل‌ها، ابزارها، سندباکس و تنظیمات پیشرفته.
  </Card>
  <Card title="مرور ابزارها" href="/fa/tools" icon="wrench">
    مرورگر، اجرا، جست‌وجوی وب، Skills و Pluginها.
  </Card>
</Columns>

<Accordion title="پیشرفته: متغیرهای محیطی">
  اگر OpenClaw را با یک حساب سرویس اجرا می‌کنید یا مسیرهای سفارشی می‌خواهید:

- `OPENCLAW_HOME` — پوشه خانگی برای تفکیک مسیرهای داخلی
- `OPENCLAW_STATE_DIR` — بازنویسی پوشه وضعیت
- `OPENCLAW_CONFIG_PATH` — بازنویسی مسیر فایل پیکربندی

مرجع کامل: [متغیرهای محیطی](/fa/help/environment).
</Accordion>

## مطالب مرتبط

- [نمای کلی نصب](/fa/install)
- [نمای کلی کانال‌ها](/fa/channels)
- [راه‌اندازی](/fa/start/setup)
