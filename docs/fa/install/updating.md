---
read_when:
    - به‌روزرسانی OpenClaw
    - پس از به‌روزرسانی چیزی از کار می‌افتد
summary: به‌روزرسانی امن OpenClaw (نصب سراسری یا از منبع)، به‌همراه راهبرد بازگشت
title: به‌روزرسانی
x-i18n:
    generated_at: "2026-05-07T13:25:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c9ff1d70d74f45efea3c148718e5cbc74001ce3d924b760edc4d68622d23714
    source_path: install/updating.md
    workflow: 16
---

OpenClaw را به‌روز نگه دارید.

## پیشنهادی: `openclaw update`

سریع‌ترین روش برای به‌روزرسانی. نوع نصب شما را تشخیص می‌دهد (npm یا git)، آخرین نسخه را دریافت می‌کند، `openclaw doctor` را اجرا می‌کند و Gateway را دوباره راه‌اندازی می‌کند.

```bash
openclaw update
```

برای تغییر کانال‌ها یا هدف‌گرفتن یک نسخه مشخص:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`openclaw update` گزینه `--verbose` را نمی‌پذیرد. برای عیب‌یابی به‌روزرسانی، از
`--dry-run` برای پیش‌نمایش کارهای برنامه‌ریزی‌شده، از `--json` برای نتایج ساختاریافته، یا از
`openclaw update status --json` برای بررسی وضعیت کانال و دسترس‌پذیری استفاده کنید. نصب‌کننده
گزینه `--verbose` خودش را دارد، اما آن گزینه بخشی از
`openclaw update` نیست.

`--channel beta`، beta را ترجیح می‌دهد، اما runtime وقتی برچسب beta وجود نداشته باشد یا از آخرین انتشار پایدار قدیمی‌تر باشد، به stable/latest برمی‌گردد. اگر برای یک به‌روزرسانی موردی بسته، npm beta dist-tag خام را می‌خواهید، از `--tag beta` استفاده کنید.

برای معنای کانال‌ها، [کانال‌های توسعه](/fa/install/development-channels) را ببینید.

## جابه‌جایی بین نصب‌های npm و git

وقتی می‌خواهید نوع نصب را تغییر دهید، از کانال‌ها استفاده کنید. به‌روزرسان وضعیت، پیکربندی، اعتبارنامه‌ها و فضای کاری شما را در `~/.openclaw` نگه می‌دارد؛ فقط مشخص می‌کند CLI و Gateway از کدام نصب کد OpenClaw استفاده کنند.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

ابتدا با `--dry-run` اجرا کنید تا تغییر دقیق حالت نصب را پیش‌نمایش کنید:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

کانال `dev` وجود یک checkout از git را تضمین می‌کند، آن را می‌سازد و CLI سراسری را از همان checkout نصب می‌کند. کانال‌های `stable` و `beta` از نصب بسته استفاده می‌کنند. اگر Gateway از قبل نصب شده باشد، `openclaw update` فراداده سرویس را تازه‌سازی می‌کند و آن را دوباره راه‌اندازی می‌کند، مگر اینکه `--no-restart` را بدهید.

## جایگزین: اجرای دوباره نصب‌کننده

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

برای رد کردن onboarding، `--no-onboard` را اضافه کنید. برای اجبار یک نوع نصب مشخص از طریق نصب‌کننده،
`--install-method git --no-onboard` یا
`--install-method npm --no-onboard` را بدهید.

اگر `openclaw update` بعد از مرحله نصب بسته npm شکست خورد، نصب‌کننده را دوباره اجرا کنید. نصب‌کننده updater قدیمی را فراخوانی نمی‌کند؛ نصب بسته سراسری را مستقیما اجرا می‌کند و می‌تواند یک نصب npm نیمه‌به‌روزشده را بازیابی کند.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

برای ثابت‌کردن بازیابی روی یک نسخه یا dist-tag مشخص، `--version` را اضافه کنید:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## جایگزین: npm، pnpm، یا bun دستی

```bash
npm i -g openclaw@latest
```

برای نصب‌های تحت نظارت، `openclaw update` را ترجیح دهید، چون می‌تواند جابه‌جایی بسته را با سرویس Gateway در حال اجرا هماهنگ کند. اگر وقتی یک Gateway مدیریت‌شده در حال اجراست دستی به‌روزرسانی می‌کنید، بلافاصله بعد از پایان package manager، Gateway را دوباره راه‌اندازی کنید تا فرایند قدیمی از فایل‌های بسته جایگزین‌شده سرویس‌دهی نکند.

وقتی `openclaw update` یک نصب سراسری npm را مدیریت می‌کند، ابتدا هدف را در یک prefix موقت npm نصب می‌کند، موجودی `dist` بسته‌بندی‌شده را تأیید می‌کند، سپس درخت بسته تمیز را با prefix سراسری واقعی جابه‌جا می‌کند. این کار از overlay کردن بسته جدید توسط npm روی فایل‌های کهنه بسته قدیمی جلوگیری می‌کند. اگر فرمان نصب شکست بخورد، OpenClaw یک بار با `--omit=optional` دوباره تلاش می‌کند. این تلاش دوباره به میزبان‌هایی کمک می‌کند که وابستگی‌های اختیاری native در آن‌ها کامپایل نمی‌شوند، در حالی که اگر fallback هم شکست بخورد، شکست اولیه همچنان قابل مشاهده می‌ماند.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### موضوعات پیشرفته نصب npm

<AccordionGroup>
  <Accordion title="Read-only package tree">
    OpenClaw نصب‌های سراسری بسته‌بندی‌شده را در runtime فقط‌خواندنی در نظر می‌گیرد، حتی وقتی دایرکتوری بسته سراسری برای کاربر فعلی قابل نوشتن باشد. نصب‌های بسته Plugin در ریشه‌های npm/git متعلق به OpenClaw زیر دایرکتوری پیکربندی کاربر قرار می‌گیرند، و راه‌اندازی Gateway درخت بسته OpenClaw را تغییر نمی‌دهد.

    بعضی تنظیمات npm در Linux بسته‌های سراسری را زیر دایرکتوری‌های متعلق به root مانند `/usr/lib/node_modules/openclaw` نصب می‌کنند. OpenClaw از این چیدمان پشتیبانی می‌کند، چون فرمان‌های نصب/به‌روزرسانی Plugin بیرون از آن دایرکتوری بسته سراسری می‌نویسند.

  </Accordion>
  <Accordion title="Hardened systemd units">
    به OpenClaw دسترسی نوشتن به ریشه‌های پیکربندی/وضعیت خودش بدهید تا نصب‌های صریح Plugin، به‌روزرسانی‌های Plugin، و پاک‌سازی doctor بتوانند تغییرات خود را پایدار کنند:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Disk-space preflight">
    پیش از به‌روزرسانی‌های بسته و نصب‌های صریح Plugin، OpenClaw تلاش می‌کند یک بررسی best-effort برای فضای دیسک volume هدف انجام دهد. کمبود فضا یک هشدار با مسیر بررسی‌شده ایجاد می‌کند، اما به‌روزرسانی را مسدود نمی‌کند، چون سهمیه‌های فایل‌سیستم، snapshots و volumeهای شبکه می‌توانند بعد از بررسی تغییر کنند. نصب واقعی package-manager و تأیید پس از نصب همچنان مرجع نهایی هستند.
  </Accordion>
</AccordionGroup>

## به‌روزرسان خودکار

به‌روزرسان خودکار به‌صورت پیش‌فرض خاموش است. آن را در `~/.openclaw/openclaw.json` فعال کنید:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| کانال | رفتار |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | به‌اندازه `stableDelayHours` صبر می‌کند، سپس با jitter قطعی در بازه `stableJitterHours` اعمال می‌کند (عرضه پخش‌شده). |
| `beta`   | هر `betaCheckIntervalHours` بررسی می‌کند (پیش‌فرض: هر ساعت) و بلافاصله اعمال می‌کند. |
| `dev`    | اعمال خودکار ندارد. از `openclaw update` به‌صورت دستی استفاده کنید. |

Gateway همچنین هنگام startup یک راهنمای به‌روزرسانی را ثبت می‌کند (با `update.checkOnStart: false` غیرفعال کنید).
برای downgrade یا بازیابی پس از حادثه، `OPENCLAW_NO_AUTO_UPDATE=1` را در محیط Gateway تنظیم کنید تا حتی وقتی `update.auto.enabled` پیکربندی شده است، اعمال خودکار مسدود شود. راهنماهای به‌روزرسانی startup همچنان می‌توانند اجرا شوند، مگر اینکه `update.checkOnStart` هم غیرفعال شده باشد.

به‌روزرسانی‌های package-manager که از طریق handler زنده control-plane در Gateway درخواست می‌شوند، بعد از جابه‌جایی بسته، یک راه‌اندازی دوباره به‌روزرسانی بدون تعویق و بدون cooldown را اجبار می‌کنند. این کار از باقی ماندن یک فرایند قدیمی در حافظه به‌قدری طولانی که chunkها را از درخت بسته‌ای که قبلا جایگزین شده است lazy-load کند، جلوگیری می‌کند. مسیر `openclaw update` در shell همچنان برای نصب‌های تحت نظارت ترجیح داده می‌شود، چون می‌تواند سرویس را در اطراف به‌روزرسانی متوقف و دوباره راه‌اندازی کند.

## بعد از به‌روزرسانی

<Steps>

### اجرای doctor

```bash
openclaw doctor
```

پیکربندی را migrate می‌کند، سیاست‌های DM را ممیزی می‌کند و سلامت Gateway را بررسی می‌کند. جزئیات: [Doctor](/fa/gateway/doctor)

### راه‌اندازی دوباره Gateway

```bash
openclaw gateway restart
```

### تأیید

```bash
openclaw health
```

</Steps>

## بازگردانی

### ثابت‌کردن یک نسخه (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` نسخه منتشرشده فعلی را نشان می‌دهد.
</Tip>

### ثابت‌کردن یک commit (منبع)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

برای بازگشت به آخرین نسخه: `git checkout main && git pull`.

## اگر گیر کرده‌اید

- دوباره `openclaw doctor` را اجرا کنید و خروجی را با دقت بخوانید.
- برای `openclaw update --channel dev` روی checkoutهای منبع، updater در صورت نیاز `pnpm` را به‌صورت خودکار bootstrap می‌کند. اگر خطای bootstrap مربوط به pnpm/corepack دیدید، `pnpm` را دستی نصب کنید (یا `corepack` را دوباره فعال کنید) و به‌روزرسانی را دوباره اجرا کنید.
- بررسی کنید: [عیب‌یابی](/fa/gateway/troubleshooting)
- در Discord بپرسید: [https://discord.gg/clawd](https://discord.gg/clawd)

## مرتبط

- [نمای کلی نصب](/fa/install): همه روش‌های نصب.
- [Doctor](/fa/gateway/doctor): بررسی‌های سلامت بعد از به‌روزرسانی‌ها.
- [مهاجرت](/fa/install/migrating): راهنماهای مهاجرت نسخه اصلی.
