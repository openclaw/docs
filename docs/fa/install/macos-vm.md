---
read_when:
    - می‌خواهید OpenClaw از محیط اصلی macOS شما جدا باشد
    - می‌خواهید یکپارچه‌سازی iMessage (BlueBubbles) را در یک محیط ایزوله داشته باشید
    - شما یک محیط macOS قابل بازنشانی می‌خواهید که بتوانید از آن نسخه‌برداری کنید
    - می‌خواهید گزینه‌های ماشین مجازی macOS محلی را با گزینه‌های میزبانی‌شده مقایسه کنید
summary: OpenClaw را در یک ماشین مجازی macOS سندباکس‌شده (محلی یا میزبانی‌شده) اجرا کنید، زمانی که به جداسازی یا iMessage نیاز دارید
title: ماشین‌های مجازی macOS
x-i18n:
    generated_at: "2026-05-06T09:26:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2b6841f66e63606346f364bb1b1b9ca4a3d52558e3d8c6f129c5b89387c6968
    source_path: install/macos-vm.md
    workflow: 16
---

## پیش‌فرض پیشنهادی (بیشتر کاربران)

- **VPS لینوکسی کوچک** برای Gateway همیشه‌روشن و هزینه کم. [میزبانی VPS](/fa/vps) را ببینید.
- **سخت‌افزار اختصاصی** (Mac mini یا دستگاه لینوکسی) اگر کنترل کامل و یک **IP خانگی** برای خودکارسازی مرورگر می‌خواهید. بسیاری از سایت‌ها IPهای مراکز داده را مسدود می‌کنند، بنابراین مرور محلی اغلب بهتر کار می‌کند.
- **ترکیبی:** Gateway را روی یک VPS ارزان نگه دارید، و وقتی به خودکارسازی مرورگر/UI نیاز دارید Mac خود را به‌عنوان یک **Node** متصل کنید. [Nodes](/fa/nodes) و [Gateway از راه دور](/fa/gateway/remote) را ببینید.

وقتی مشخصاً به قابلیت‌های فقط macOS (iMessage/BlueBubbles) نیاز دارید یا می‌خواهید از Mac روزمره‌تان جداسازی سخت‌گیرانه داشته باشید، از VM مک‌اواس استفاده کنید.

## گزینه‌های VM مک‌اواس

### VM محلی روی Apple Silicon Mac شما (Lume)

OpenClaw را در یک VM مک‌اواس سندباکس‌شده روی Apple Silicon Mac فعلی خود با استفاده از [Lume](https://cua.ai/docs/lume) اجرا کنید.

این به شما می‌دهد:

- محیط کامل macOS در حالت ایزوله (میزبان شما تمیز می‌ماند)
- پشتیبانی از iMessage از طریق BlueBubbles (روی Linux/Windows غیرممکن است)
- بازنشانی فوری با کلون‌کردن VMها
- بدون سخت‌افزار اضافی یا هزینه‌های ابری

### ارائه‌دهندگان Mac میزبانی‌شده (ابر)

اگر macOS را در ابر می‌خواهید، ارائه‌دهندگان Mac میزبانی‌شده نیز کار می‌کنند:

- [MacStadium](https://www.macstadium.com/) (Macهای میزبانی‌شده)
- سایر فروشندگان Mac میزبانی‌شده نیز کار می‌کنند؛ مستندات VM + SSH آن‌ها را دنبال کنید

وقتی به یک VM مک‌اواس دسترسی SSH داشتید، از مرحله ۶ پایین ادامه دهید.

---

## مسیر سریع (Lume، کاربران باتجربه)

1. Lume را نصب کنید
2. `lume create openclaw --os macos --ipsw latest`
3. Setup Assistant را کامل کنید، Remote Login (SSH) را فعال کنید
4. `lume run openclaw --no-display`
5. با SSH وارد شوید، OpenClaw را نصب کنید، کانال‌ها را پیکربندی کنید
6. تمام

---

## آنچه نیاز دارید (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- macOS Sequoia یا جدیدتر روی میزبان
- حدود ۶۰ GB فضای دیسک آزاد برای هر VM
- حدود ۲۰ دقیقه

---

## 1) نصب Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

اگر `~/.local/bin` در PATH شما نیست:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

بررسی کنید:

```bash
lume --version
```

مستندات: [نصب Lume](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) ساخت VM مک‌اواس

```bash
lume create openclaw --os macos --ipsw latest
```

این کار macOS را دانلود می‌کند و VM را می‌سازد. یک پنجره VNC به‌صورت خودکار باز می‌شود.

<Note>
بسته به اتصال شما، دانلود ممکن است مدتی طول بکشد.
</Note>

---

## 3) تکمیل Setup Assistant

در پنجره VNC:

1. زبان و منطقه را انتخاب کنید
2. Apple ID را رد کنید (یا اگر بعداً iMessage می‌خواهید وارد شوید)
3. یک حساب کاربری بسازید (نام کاربری و رمز عبور را به خاطر بسپارید)
4. همه قابلیت‌های اختیاری را رد کنید

پس از پایان راه‌اندازی، SSH را فعال کنید:

1. System Settings → General → Sharing را باز کنید
2. "Remote Login" را فعال کنید

---

## 4) گرفتن آدرس IP VM

```bash
lume get openclaw
```

دنبال آدرس IP بگردید (معمولاً `192.168.64.x`).

---

## 5) SSH به VM

```bash
ssh youruser@192.168.64.X
```

`youruser` را با حسابی که ساخته‌اید، و IP را با IP VM خود جایگزین کنید.

---

## 6) نصب OpenClaw

داخل VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

اعلان‌های راه‌اندازی را دنبال کنید تا ارائه‌دهنده مدل خود را تنظیم کنید (Anthropic، OpenAI و غیره).

---

## 7) پیکربندی کانال‌ها

فایل پیکربندی را ویرایش کنید:

```bash
nano ~/.openclaw/openclaw.json
```

کانال‌های خود را اضافه کنید:

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

سپس به WhatsApp وارد شوید (QR را اسکن کنید):

```bash
openclaw channels login
```

---

## 8) اجرای VM بدون نمایشگر

VM را متوقف کنید و بدون نمایشگر دوباره راه‌اندازی کنید:

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM در پس‌زمینه اجرا می‌شود. daemon مربوط به OpenClaw، Gateway را در حال اجرا نگه می‌دارد.

برای بررسی وضعیت:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## پاداش: یکپارچه‌سازی iMessage

این قابلیت اصلی اجرای روی macOS است. از [BlueBubbles](https://bluebubbles.app) برای افزودن iMessage به OpenClaw استفاده کنید.

داخل VM:

1. BlueBubbles را از bluebubbles.app دانلود کنید
2. با Apple ID خود وارد شوید
3. Web API را فعال کنید و یک رمز عبور تنظیم کنید
4. Webhookهای BlueBubbles را به Gateway خود اشاره دهید (مثال: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

به پیکربندی OpenClaw خود اضافه کنید:

```json5
{
  channels: {
    bluebubbles: {
      serverUrl: "http://localhost:1234",
      password: "your-api-password",
      webhookPath: "/bluebubbles-webhook",
    },
  },
}
```

Gateway را دوباره راه‌اندازی کنید. اکنون agent شما می‌تواند iMessageها را ارسال و دریافت کند.

جزئیات کامل راه‌اندازی: [کانال BlueBubbles](/fa/channels/bluebubbles)

---

## ذخیره یک تصویر طلایی

پیش از سفارشی‌سازی بیشتر، از وضعیت تمیز خود snapshot بگیرید:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

هر زمان بازنشانی کنید:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## اجرای ۲۴/۷

VM را با این کارها روشن نگه دارید:

- Mac خود را به برق وصل نگه دارید
- sleep را در System Settings → Energy Saver غیرفعال کنید
- در صورت نیاز از `caffeinate` استفاده کنید

برای حالت واقعاً همیشه‌روشن، یک Mac mini اختصاصی یا یک VPS کوچک را در نظر بگیرید. [میزبانی VPS](/fa/vps) را ببینید.

---

## عیب‌یابی

| مشکل                  | راه‌حل                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------- |
| نمی‌توان با SSH وارد VM شد        | بررسی کنید "Remote Login" در System Settings مربوط به VM فعال باشد                            |
| IP مربوط به VM نمایش داده نمی‌شود        | صبر کنید VM کاملاً بوت شود، سپس دوباره `lume get openclaw` را اجرا کنید                           |
| فرمان Lume پیدا نشد   | `~/.local/bin` را به PATH خود اضافه کنید                                                    |
| QR مربوط به WhatsApp اسکن نمی‌شود | هنگام اجرای `openclaw channels login` مطمئن شوید وارد VM شده‌اید (نه میزبان) |

---

## مستندات مرتبط

- [میزبانی VPS](/fa/vps)
- [Nodes](/fa/nodes)
- [Gateway از راه دور](/fa/gateway/remote)
- [کانال BlueBubbles](/fa/channels/bluebubbles)
- [شروع سریع Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [مرجع CLI Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [راه‌اندازی VM بدون نظارت](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (پیشرفته)
- [سندباکس Docker](/fa/install/docker) (روش جایگزین برای ایزوله‌سازی)
