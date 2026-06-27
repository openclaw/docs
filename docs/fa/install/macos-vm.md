---
read_when:
    - می‌خواهید OpenClaw از محیط اصلی macOS شما جدا باشد
    - شما ادغام iMessage را در یک sandbox می‌خواهید
    - می‌خواهید یک محیط macOS قابل بازنشانی داشته باشید که بتوانید آن را کلون کنید
    - می‌خواهید گزینه‌های ماشین مجازی macOS محلی و میزبانی‌شده را مقایسه کنید
summary: OpenClaw را در یک ماشین مجازی macOS ایزوله‌شده (محلی یا میزبانی‌شده) اجرا کنید، وقتی به جداسازی یا iMessage نیاز دارید
title: ماشین‌های مجازی macOS
x-i18n:
    generated_at: "2026-06-27T18:00:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aee2fa0651b711f29d7d092da931bd924bc8ce8a5ca389cf8f189725fa586f3f
    source_path: install/macos-vm.md
    workflow: 16
---

## پیش‌فرض پیشنهادی (بیشتر کاربران)

- **VPS لینوکسی کوچک** برای Gateway همیشه‌روشن و هزینه کم. [میزبانی VPS](/fa/vps) را ببینید.
- اگر کنترل کامل و یک **IP خانگی** برای خودکارسازی مرورگر می‌خواهید، از **سخت‌افزار اختصاصی** (Mac mini یا دستگاه Linux) استفاده کنید. بسیاری از سایت‌ها IPهای دیتاسنتر را مسدود می‌کنند، بنابراین مرور محلی اغلب بهتر کار می‌کند.
- **ترکیبی:** Gateway را روی یک VPS ارزان نگه دارید و وقتی به خودکارسازی مرورگر/رابط کاربری نیاز دارید، Mac خود را به‌عنوان یک **گره** وصل کنید. [گره‌ها](/fa/nodes) و [Gateway راه دور](/fa/gateway/remote) را ببینید.

وقتی به قابلیت‌های مخصوص macOS مانند iMessage نیاز دارید یا می‌خواهید از Mac روزمره خود جداسازی سخت‌گیرانه داشته باشید، از VM macOS استفاده کنید.

## گزینه‌های VM macOS

### VM محلی روی Apple Silicon Mac شما (Lume)

OpenClaw را با استفاده از [Lume](https://cua.ai/docs/lume) در یک VM macOS سندباکس‌شده روی Apple Silicon Mac فعلی خود اجرا کنید.

این به شما می‌دهد:

- محیط کامل macOS در حالت ایزوله (میزبان شما تمیز می‌ماند)
- پشتیبانی iMessage از طریق `imsg` (مسیر محلی پیش‌فرض روی Linux/Windows ممکن نیست)
- بازنشانی فوری با کلون‌کردن VMها
- بدون سخت‌افزار اضافه یا هزینه‌های ابری

### ارائه‌دهندگان Mac میزبانی‌شده (ابر)

اگر macOS را در ابر می‌خواهید، ارائه‌دهندگان Mac میزبانی‌شده هم کار می‌کنند:

- [MacStadium](https://www.macstadium.com/) (Macهای میزبانی‌شده)
- سایر فروشندگان Mac میزبانی‌شده نیز کار می‌کنند؛ مستندات VM + SSH آن‌ها را دنبال کنید

پس از اینکه به یک VM macOS دسترسی SSH داشتید، از مرحله ۶ زیر ادامه دهید.

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
- حدود ۶۰ گیگابایت فضای دیسک آزاد برای هر VM
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

## 2) ایجاد VM macOS

```bash
lume create openclaw --os macos --ipsw latest
```

این دستور macOS را دانلود می‌کند و VM را می‌سازد. یک پنجره VNC به‌صورت خودکار باز می‌شود.

<Note>
بسته به اتصال شما، دانلود ممکن است مدتی طول بکشد.
</Note>

---

## 3) کامل‌کردن Setup Assistant

در پنجره VNC:

1. زبان و منطقه را انتخاب کنید
2. Apple ID را رد کنید (یا اگر بعداً iMessage می‌خواهید، وارد شوید)
3. یک حساب کاربری بسازید (نام کاربری و رمز عبور را به خاطر بسپارید)
4. همه قابلیت‌های اختیاری را رد کنید

پس از کامل‌شدن راه‌اندازی:

1. SSH را فعال کنید: System Settings -> General -> Sharing را باز کنید و "Remote Login" را فعال کنید.
2. برای استفاده از VM بدون نمایشگر، ورود خودکار را فعال کنید: System Settings -> Users & Groups را باز کنید، "Automatically log in as:" را انتخاب کنید و کاربر VM را برگزینید.

---

## 4) دریافت نشانی IP VM

```bash
lume get openclaw
```

به‌دنبال نشانی IP بگردید (معمولاً `192.168.64.x`).

---

## 5) اتصال SSH به VM

```bash
ssh youruser@192.168.64.X
```

`youruser` را با حسابی که ساختید، و IP را با IP VM خود جایگزین کنید.

---

## 6) نصب OpenClaw

داخل VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

اعلان‌های راه‌اندازی را دنبال کنید تا ارائه‌دهنده مدل خود را تنظیم کنید (Anthropic، OpenAI، و غیره).

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

سپس وارد WhatsApp شوید (QR را اسکن کنید):

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

VM در پس‌زمینه اجرا می‌شود. دیمون OpenClaw، Gateway را در حال اجرا نگه می‌دارد.

برای بررسی وضعیت:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## امتیاز اضافه: یکپارچه‌سازی iMessage

این قابلیت برجسته اجرای روی macOS است. از [iMessage](/fa/channels/imessage) همراه با `imsg` استفاده کنید تا Messages را به OpenClaw اضافه کنید.

داخل VM:

1. وارد Messages شوید.
2. `imsg` را نصب کنید.
3. مجوز Full Disk Access و Automation را برای فرایندی که OpenClaw/`imsg` را اجرا می‌کند اعطا کنید.
4. پشتیبانی RPC را با `imsg rpc --help` بررسی کنید.

به پیکربندی OpenClaw خود اضافه کنید:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
    },
  },
}
```

Gateway را دوباره راه‌اندازی کنید. اکنون عامل شما می‌تواند iMessageها را ارسال و دریافت کند.

جزئیات کامل راه‌اندازی: [کانال iMessage](/fa/channels/imessage)

---

## ذخیره یک تصویر طلایی

پیش از سفارشی‌سازی بیشتر، از وضعیت تمیز خود اسنپ‌شات بگیرید:

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

VM را با این کارها در حال اجرا نگه دارید:

- Mac خود را به برق وصل نگه دارید
- خواب را در System Settings → Energy Saver غیرفعال کنید
- در صورت نیاز از `caffeinate` استفاده کنید

برای همیشه‌روشن واقعی، یک Mac mini اختصاصی یا یک VPS کوچک را در نظر بگیرید. [میزبانی VPS](/fa/vps) را ببینید.

---

## عیب‌یابی

| مشکل | راه‌حل |
| ------------------------ | ---------------------------------------------------------------------------------- |
| نمی‌توان با SSH وارد VM شد | بررسی کنید "Remote Login" در System Settings مربوط به VM فعال باشد |
| IP مربوط به VM نمایش داده نمی‌شود | منتظر بمانید VM کامل بوت شود، سپس دوباره `lume get openclaw` را اجرا کنید |
| دستور Lume پیدا نمی‌شود | `~/.local/bin` را به PATH خود اضافه کنید |
| QR مربوط به WhatsApp اسکن نمی‌شود | هنگام اجرای `openclaw channels login` مطمئن شوید وارد VM هستید (نه میزبان) |

---

## مستندات مرتبط

- [میزبانی VPS](/fa/vps)
- [گره‌ها](/fa/nodes)
- [Gateway راه دور](/fa/gateway/remote)
- [کانال iMessage](/fa/channels/imessage)
- [شروع سریع Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [مرجع CLI Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [راه‌اندازی VM بدون نظارت](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (پیشرفته)
- [سندباکس‌کردن با Docker](/fa/install/docker) (رویکرد جایگزین برای ایزوله‌سازی)
