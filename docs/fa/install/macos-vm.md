---
read_when:
    - می‌خواهید OpenClaw از محیط اصلی macOS شما جدا نگه داشته شود
    - می‌خواهید یکپارچه‌سازی iMessage (BlueBubbles) را در یک محیط سندباکس داشته باشید
    - شما یک محیط macOS قابل بازنشانی می‌خواهید که بتوانید آن را کلون کنید
    - می‌خواهید گزینه‌های ماشین مجازی macOS محلی و میزبانی‌شده را مقایسه کنید
summary: وقتی به جداسازی یا iMessage نیاز دارید، OpenClaw را در یک ماشین مجازی محصورشدهٔ macOS (محلی یا میزبانی‌شده) اجرا کنید
title: ماشین‌های مجازی macOS
x-i18n:
    generated_at: "2026-04-29T23:05:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49cd3d420db02bcdb80378c3a91a1c1243e7be2012525c31de1dd49db397d560
    source_path: install/macos-vm.md
    workflow: 16
---

# OpenClaw روی VMهای macOS (Sandboxing)

## پیش‌فرض پیشنهادی (بیشتر کاربران)

- **VPS کوچک لینوکسی** برای Gateway همیشه‌روشن و هزینه کم. [میزبانی VPS](/fa/vps) را ببینید.
- **سخت‌افزار اختصاصی** (Mac mini یا دستگاه لینوکسی) اگر کنترل کامل و یک **IP خانگی** برای خودکارسازی مرورگر می‌خواهید. بسیاری از سایت‌ها IPهای دیتاسنتر را مسدود می‌کنند، بنابراین مرور محلی اغلب بهتر کار می‌کند.
- **ترکیبی:** Gateway را روی یک VPS ارزان نگه دارید، و وقتی به خودکارسازی مرورگر/UI نیاز دارید Mac خود را به‌عنوان یک **node** وصل کنید. [Nodes](/fa/nodes) و [Gateway remote](/fa/gateway/remote) را ببینید.

وقتی از VM macOS استفاده کنید که مشخصا به قابلیت‌های فقط macOS نیاز دارید (iMessage/BlueBubbles) یا می‌خواهید از Mac روزمره خود ایزولاسیون سخت‌گیرانه داشته باشید.

## گزینه‌های VM macOS

### VM محلی روی Apple Silicon Mac شما (Lume)

OpenClaw را در یک VM ایزوله‌شده macOS روی Apple Silicon Mac فعلی خود با استفاده از [Lume](https://cua.ai/docs/lume) اجرا کنید.

این به شما می‌دهد:

- محیط کامل macOS در ایزولاسیون (میزبان شما تمیز می‌ماند)
- پشتیبانی iMessage از طریق BlueBubbles (روی Linux/Windows غیرممکن است)
- بازنشانی فوری با کلون‌کردن VMها
- بدون سخت‌افزار اضافه یا هزینه‌های ابری

### ارائه‌دهندگان Mac میزبانی‌شده (ابر)

اگر macOS را در ابر می‌خواهید، ارائه‌دهندگان Mac میزبانی‌شده هم کار می‌کنند:

- [MacStadium](https://www.macstadium.com/) (Macهای میزبانی‌شده)
- فروشندگان دیگر Mac میزبانی‌شده هم کار می‌کنند؛ مستندات VM + SSH آن‌ها را دنبال کنید

وقتی دسترسی SSH به یک VM macOS داشتید، از مرحله ۶ پایین ادامه دهید.

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
- حدود ۶۰ گیگابایت فضای آزاد دیسک برای هر VM
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

## 2) ساخت VM macOS

```bash
lume create openclaw --os macos --ipsw latest
```

این دستور macOS را دانلود می‌کند و VM را می‌سازد. یک پنجره VNC به‌صورت خودکار باز می‌شود.

<Note>
دانلود بسته به اتصال شما ممکن است مدتی طول بکشد.
</Note>

---

## 3) کامل‌کردن Setup Assistant

در پنجره VNC:

1. زبان و منطقه را انتخاب کنید
2. Apple ID را رد کنید (یا اگر بعدا iMessage می‌خواهید، وارد شوید)
3. یک حساب کاربری بسازید (نام کاربری و گذرواژه را به خاطر بسپارید)
4. همه قابلیت‌های اختیاری را رد کنید

پس از کامل‌شدن راه‌اندازی، SSH را فعال کنید:

1. System Settings → General → Sharing را باز کنید
2. "Remote Login" را فعال کنید

---

## 4) گرفتن نشانی IP VM

```bash
lume get openclaw
```

به‌دنبال نشانی IP بگردید (معمولا `192.168.64.x`).

---

## 5) ورود با SSH به VM

```bash
ssh youruser@192.168.64.X
```

`youruser` را با حسابی که ساختید جایگزین کنید، و IP را با IP VM خود.

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

سپس وارد WhatsApp شوید (اسکن QR):

```bash
openclaw channels login
```

---

## 8) اجرای VM به‌صورت headless

VM را متوقف کنید و بدون نمایشگر دوباره راه‌اندازی کنید:

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM در پس‌زمینه اجرا می‌شود. daemon مربوط به OpenClaw، gateway را در حال اجرا نگه می‌دارد.

برای بررسی وضعیت:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## امتیاز اضافه: یکپارچه‌سازی iMessage

این قابلیت اصلی اجرای روی macOS است. از [BlueBubbles](https://bluebubbles.app) برای افزودن iMessage به OpenClaw استفاده کنید.

داخل VM:

1. BlueBubbles را از bluebubbles.app دانلود کنید
2. با Apple ID خود وارد شوید
3. Web API را فعال کنید و یک گذرواژه تنظیم کنید
4. Webhookهای BlueBubbles را به gateway خود اشاره دهید (نمونه: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

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

gateway را دوباره راه‌اندازی کنید. اکنون عامل شما می‌تواند iMessageها را ارسال و دریافت کند.

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

## اجرای 24/7

VM را با این کارها در حال اجرا نگه دارید:

- Mac خود را به برق وصل نگه دارید
- sleep را در System Settings → Energy Saver غیرفعال کنید
- در صورت نیاز از `caffeinate` استفاده کنید

برای همیشه‌روشن واقعی، یک Mac mini اختصاصی یا یک VPS کوچک را در نظر بگیرید. [میزبانی VPS](/fa/vps) را ببینید.

---

## عیب‌یابی

| مشکل | راه‌حل |
| ------------------------ | ---------------------------------------------------------------------------------- |
| نمی‌توان با SSH وارد VM شد | بررسی کنید "Remote Login" در System Settings مربوط به VM فعال باشد |
| IP VM نمایش داده نمی‌شود | صبر کنید VM کامل بوت شود، دوباره `lume get openclaw` را اجرا کنید |
| دستور Lume پیدا نمی‌شود | `~/.local/bin` را به PATH خود اضافه کنید |
| QR مربوط به WhatsApp اسکن نمی‌شود | مطمئن شوید هنگام اجرای `openclaw channels login` وارد VM هستید (نه میزبان) |

---

## مستندات مرتبط

- [میزبانی VPS](/fa/vps)
- [Nodes](/fa/nodes)
- [Gateway remote](/fa/gateway/remote)
- [کانال BlueBubbles](/fa/channels/bluebubbles)
- [شروع سریع Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [مرجع CLI Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [راه‌اندازی VM بدون نظارت](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (پیشرفته)
- [Docker Sandboxing](/fa/install/docker) (رویکرد جایگزین برای ایزولاسیون)
