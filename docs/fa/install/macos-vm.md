---
read_when:
    - می‌خواهید OpenClaw از محیط اصلی macOS شما جدا باشد
    - می‌خواهید iMessage را در یک محیط ایزوله یکپارچه کنید
    - یک محیط macOS قابل بازنشانی می‌خواهید که بتوانید آن را شبیه‌سازی کنید
    - می‌خواهید گزینه‌های ماشین مجازی macOS محلی و میزبانی‌شده را مقایسه کنید
summary: هنگامی که به جداسازی یا iMessage نیاز دارید، OpenClaw را در یک ماشین مجازی macOS ایزوله‌شده (محلی یا میزبانی‌شده) اجرا کنید
title: ماشین‌های مجازی macOS
x-i18n:
    generated_at: "2026-07-12T10:18:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e6b963faaf40f65adce1081715bc295059b8bed278a8c71a05a86e04ad7a7a5
    source_path: install/macos-vm.md
    workflow: 16
---

## پیش‌فرض پیشنهادی (برای بیشتر کاربران)

- **VPS کوچک لینوکسی** برای Gateway همیشه‌روشن و هزینهٔ پایین. [میزبانی VPS](/fa/vps) را ببینید.
- **سخت‌افزار اختصاصی** (Mac mini یا دستگاه لینوکسی) اگر کنترل کامل و یک **IP خانگی** برای خودکارسازی مرورگر می‌خواهید. بسیاری از سایت‌ها IPهای مراکز داده را مسدود می‌کنند، بنابراین مرور محلی اغلب بهتر کار می‌کند.
- **ترکیبی**: Gateway را روی یک VPS ارزان نگه دارید و هنگامی که به خودکارسازی مرورگر/رابط کاربری نیاز دارید، Mac خود را به‌عنوان یک **Node** متصل کنید. [Nodeها](/fa/nodes) و [Gateway راه دور](/fa/gateway/remote) را ببینید.

تنها زمانی از ماشین مجازی macOS استفاده کنید که مشخصاً به قابلیت‌های انحصاری macOS مانند iMessage نیاز دارید، یا می‌خواهید محیط آن کاملاً از Mac روزمرهٔ شما جدا باشد.

## گزینه‌های ماشین مجازی macOS

### ماشین مجازی محلی روی Mac مجهز به Apple Silicon ‏(Lume)

با استفاده از [Lume](https://cua.ai/docs/lume)، OpenClaw را در یک ماشین مجازی macOS ایزوله‌شده روی Mac فعلی مجهز به Apple Silicon اجرا کنید. مزایای آن عبارت‌اند از:

- محیط کامل macOS به‌صورت ایزوله (سیستم میزبان شما تمیز می‌ماند)
- پشتیبانی از iMessage از طریق `imsg`؛ مسیر محلی پیش‌فرض در Linux/Windows امکان‌پذیر نیست
- بازنشانی فوری با همسانه‌سازی ماشین‌های مجازی
- بدون نیاز به سخت‌افزار اضافی یا هزینه‌های ابری

### ارائه‌دهندگان میزبانی Mac (ابر)

اگر macOS را در فضای ابری می‌خواهید، ارائه‌دهندگان میزبانی Mac نیز مناسب‌اند:

- [MacStadium](https://www.macstadium.com/) (Macهای میزبانی‌شده)
- سایر فروشندگان Mac میزبانی‌شده نیز کار می‌کنند؛ مستندات ماشین مجازی و SSH آن‌ها را دنبال کنید

پس از دسترسی SSH به یک ماشین مجازی macOS، از بخش [نصب OpenClaw](#6-install-openclaw) در ادامه پیگیری کنید.

## مسیر سریع (Lume، کاربران باتجربه)

1. Lume را نصب کنید.
2. `lume create openclaw --os macos --ipsw latest`
3. دستیار راه‌اندازی را تکمیل و Remote Login ‏(SSH) را فعال کنید.
4. `lume run openclaw --no-display`
5. از طریق SSH وارد شوید، OpenClaw را نصب و کانال‌ها را پیکربندی کنید.
6. تمام.

## نیازمندی‌ها (Lume)

- Mac مجهز به Apple Silicon ‏(M1/M2/M3/M4)
- macOS Sequoia یا نسخه‌ای جدیدتر روی میزبان
- حدود ۶۰ گیگابایت فضای آزاد دیسک برای هر ماشین مجازی
- حدود ۲۰ دقیقه زمان

## ۱) نصب Lume

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

## ۲) ایجاد ماشین مجازی macOS

```bash
lume create openclaw --os macos --ipsw latest
```

این فرمان macOS را بارگیری و ماشین مجازی را ایجاد می‌کند. یک پنجرهٔ VNC به‌طور خودکار باز می‌شود.

<Note>
بسته به اتصال شما، بارگیری ممکن است مدتی طول بکشد.
</Note>

## ۳) تکمیل دستیار راه‌اندازی

در پنجرهٔ VNC:

1. زبان و منطقه را انتخاب کنید.
2. Apple ID را نادیده بگیرید (یا اگر بعداً iMessage می‌خواهید، وارد شوید).
3. یک حساب کاربری ایجاد کنید (نام کاربری و گذرواژه را به خاطر بسپارید).
4. از همهٔ قابلیت‌های اختیاری صرف‌نظر کنید.

پس از تکمیل راه‌اندازی:

1. SSH را فعال کنید: System Settings -> General -> Sharing؛ گزینهٔ "Remote Login" را فعال کنید.
2. برای استفاده از ماشین مجازی بدون نمایشگر، ورود خودکار را فعال کنید: System Settings -> Users & Groups؛ گزینهٔ "Automatically log in as:" را انتخاب کنید و کاربر ماشین مجازی را برگزینید.

## ۴) دریافت نشانی IP ماشین مجازی

```bash
lume get openclaw
```

نشانی IP را پیدا کنید (معمولاً `192.168.64.x`).

## ۵) ورود به ماشین مجازی از طریق SSH

```bash
ssh youruser@192.168.64.X
```

`youruser` را با حسابی که ایجاد کرده‌اید و IP را با نشانی IP ماشین مجازی خود جایگزین کنید.

## ۶) نصب OpenClaw

درون ماشین مجازی:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

برای راه‌اندازی ارائه‌دهندهٔ مدل خود (Anthropic، OpenAI و غیره)، اعلان‌های فرایند آغازبه‌کار را دنبال کنید.

## ۷) پیکربندی کانال‌ها

فایل پیکربندی را ویرایش کنید:

```bash
nano ~/.openclaw/openclaw.json
```

کانال‌های خود را اضافه کنید:

```json5
{
  channels: {
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
  },
}
```

سپس وارد WhatsApp شوید (کد QR را اسکن کنید):

```bash
openclaw channels login
```

## ۸) اجرای ماشین مجازی بدون نمایشگر

ماشین مجازی را متوقف و بدون نمایشگر دوباره راه‌اندازی کنید:

```bash
lume stop openclaw
lume run openclaw --no-display
```

ماشین مجازی در پس‌زمینه اجرا می‌شود؛ دیمن OpenClaw، Gateway را در حال اجرا نگه می‌دارد. برای بررسی وضعیت:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

## افزوده: یکپارچه‌سازی iMessage

این قابلیت برجستهٔ اجرا روی macOS است. برای افزودن Messages به OpenClaw، از [iMessage](/fa/channels/imessage) همراه با `imsg` استفاده کنید.

درون ماشین مجازی:

1. وارد Messages شوید.
2. `imsg` را نصب کنید.
3. برای فرایندی که OpenClaw/`imsg` را اجرا می‌کند، مجوزهای Full Disk Access و Automation را اعطا کنید.
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

Gateway را دوباره راه‌اندازی کنید. عامل شما اکنون می‌تواند iMessageها را ارسال و دریافت کند. جزئیات کامل راه‌اندازی: [کانال iMessage](/fa/channels/imessage).

## ذخیرهٔ یک تصویر طلایی

پیش از سفارشی‌سازی بیشتر، از وضعیت تمیز خود یک اسنپ‌شات بگیرید:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

در هر زمان بازنشانی کنید:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

## اجرای شبانه‌روزی

برای روشن نگه‌داشتن ماشین مجازی:

- Mac خود را به برق متصل نگه دارید
- حالت خواب را در System Settings -> Energy Saver غیرفعال کنید
- در صورت نیاز از `caffeinate` استفاده کنید

برای اجرای واقعاً همیشه‌روشن، یک Mac mini اختصاصی یا VPS کوچک را در نظر بگیرید. [میزبانی VPS](/fa/vps) را ببینید.

## عیب‌یابی

| مشکل                          | راه‌حل                                                                                          |
| ----------------------------- | ----------------------------------------------------------------------------------------------- |
| اتصال SSH به ماشین مجازی ممکن نیست | بررسی کنید که "Remote Login" در System Settings ماشین مجازی فعال باشد                         |
| IP ماشین مجازی نمایش داده نمی‌شود | منتظر بمانید ماشین مجازی کاملاً راه‌اندازی شود، سپس دوباره `lume get openclaw` را اجرا کنید     |
| فرمان Lume پیدا نمی‌شود       | `~/.local/bin` را به PATH خود اضافه کنید                                                        |
| کد QR ‏WhatsApp اسکن نمی‌شود  | هنگام اجرای `openclaw channels login` مطمئن شوید وارد ماشین مجازی هستید (نه میزبان)             |

## مستندات مرتبط

- [میزبانی VPS](/fa/vps)
- [Nodeها](/fa/nodes)
- [Gateway راه دور](/fa/gateway/remote)
- [کانال iMessage](/fa/channels/imessage)
- [شروع سریع Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [مرجع CLI ‏Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [راه‌اندازی بدون نظارت ماشین مجازی](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (پیشرفته)
- [ایزوله‌سازی با Docker](/fa/install/docker) (رویکرد جایگزین برای ایزوله‌سازی)
