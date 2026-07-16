---
read_when:
    - راه‌اندازی اولیه از صفر
    - سریع‌ترین مسیر برای راه‌اندازی یک گفت‌وگوی فعال را می‌خواهید
summary: OpenClaw را نصب کنید و ظرف چند دقیقه نخستین گفت‌وگوی خود را آغاز کنید.
title: شروع به کار
x-i18n:
    generated_at: "2026-07-16T17:22:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f50073b059477636b94e128cec90b41dcc21c8bb132e34900e68409cacf70eb
    source_path: start/getting-started.md
    workflow: 16
---

OpenClaw را نصب کنید، راه‌اندازی اولیه را اجرا کنید و در حدود 5
دقیقه با دستیار هوش مصنوعی خود گفت‌وگو کنید. در پایان، یک Gateway در حال اجرا، احراز هویت پیکربندی‌شده و یک
نشست گفت‌وگوی فعال خواهید داشت.

## آنچه نیاز دارید

- **Node.js 22.22.3+، 24.15+، یا 25.9+** (24 پیش‌فرض توصیه‌شده است)
- **یک کلید API** از ارائه‌دهنده مدل (Anthropic، OpenAI، Google و غیره) — در راه‌اندازی اولیه از شما درخواست می‌شود

<Tip>
نسخه Node خود را با `node --version` بررسی کنید.
**کاربران Windows:** برنامه بومی Windows Hub ساده‌ترین مسیر دسکتاپ است. نصب‌کننده
PowerShell و مسیرهای WSL2 Gateway نیز پشتیبانی می‌شوند. به [Windows](/fa/platforms/windows) مراجعه کنید.
آیا نیاز به نصب Node دارید؟ به [راه‌اندازی Node](/fa/install/node) مراجعه کنید.
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
    سایر روش‌های نصب (Docker، Nix، npm): [نصب](/fa/install).
    </Note>

  </Step>
  <Step title="اجرای راه‌اندازی اولیه">
    ```bash
    openclaw onboard --install-daemon
    ```

    راهنما شما را در انتخاب ارائه‌دهنده مدل، تنظیم کلید API
    و پیکربندی Gateway همراهی می‌کند. QuickStart معمولاً فقط چند دقیقه طول می‌کشد، اما
    ورود به حساب ارائه‌دهنده، جفت‌سازی کانال، نصب daemon، دانلودهای شبکه، skills
    یا pluginهای اختیاری ممکن است راه‌اندازی اولیه کامل را طولانی‌تر کنند. مراحل اختیاری را
    رد کنید و بعداً با `openclaw configure` بازگردید.

    برای مرجع کامل، به [راه‌اندازی اولیه (CLI)](/fa/start/wizard) مراجعه کنید.

  </Step>
  <Step title="اطمینان از اجرای Gateway">
    ```bash
    openclaw gateway status
    ```

    باید ببینید که Gateway روی پورت 18789 در حال گوش‌دادن است.

  </Step>
  <Step title="باز کردن داشبورد">
    ```bash
    openclaw dashboard
    ```

    این فرمان Control UI را در مرورگر شما باز می‌کند. اگر بارگیری شود، همه‌چیز به‌درستی کار می‌کند.

  </Step>
  <Step title="ارسال نخستین پیام">
    پیامی در گفت‌وگوی Control UI تایپ کنید؛ باید پاسخی از هوش مصنوعی دریافت کنید.

    ترجیح می‌دهید به‌جای آن از تلفن خود گفت‌وگو کنید؟ سریع‌ترین کانال برای راه‌اندازی
    [Telegram](/fa/channels/telegram) است (فقط یک توکن ربات). برای مشاهده همه گزینه‌ها به [کانال‌ها](/fa/channels)
    مراجعه کنید.

  </Step>
</Steps>

<Accordion title="پیشرفته: سوار کردن یک ساخت سفارشی Control UI">
  اگر یک ساخت محلی‌سازی‌شده یا سفارشی از داشبورد را نگه‌داری می‌کنید،
  `gateway.controlUi.root` را به پوشه‌ای هدایت کنید که دارایی‌های ایستای ساخته‌شده
  و `index.html` را در بر دارد.

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

Gateway را مجدداً راه‌اندازی کنید و داشبورد را دوباره باز کنید:

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
    مدل‌ها، ابزارها، sandbox و تنظیمات پیشرفته.
  </Card>
  <Card title="مرور ابزارها" href="/fa/tools" icon="wrench">
    مرورگر، اجرا، جست‌وجوی وب، skills و pluginها.
  </Card>
</Columns>

<Accordion title="پیشرفته: متغیرهای محیطی">
  اگر OpenClaw را با یک حساب سرویس اجرا می‌کنید یا مسیرهای سفارشی می‌خواهید:

- `OPENCLAW_HOME` — پوشه خانه برای رفع مسیرهای داخلی
- `OPENCLAW_STATE_DIR` — بازنویسی پوشه وضعیت
- `OPENCLAW_CONFIG_PATH` — بازنویسی مسیر فایل پیکربندی

مرجع کامل: [متغیرهای محیطی](/fa/help/environment).
</Accordion>

## مرتبط

- [نمای کلی نصب](/fa/install)
- [نمای کلی کانال‌ها](/fa/channels)
- [راه‌اندازی](/fa/start/setup)
