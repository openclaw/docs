---
read_when:
    - به‌روزرسانی OpenClaw
    - پس از به‌روزرسانی، چیزی از کار می‌افتد
summary: به‌روزرسانی ایمن OpenClaw (نصب سراسری یا از منبع)، به‌همراه راهبرد بازگشت
title: به‌روزرسانی
x-i18n:
    generated_at: "2026-05-07T01:53:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 520f30980c56b9bcfc78bb2e916df812b2770a88c663140eeee3e9697bf58ee6
    source_path: install/updating.md
    workflow: 16
---

OpenClaw را به‌روز نگه دارید.

## توصیه‌شده: `openclaw update`

سریع‌ترین راه برای به‌روزرسانی. نوع نصب شما را تشخیص می‌دهد (npm یا git)، آخرین نسخه را دریافت می‌کند، `openclaw doctor` را اجرا می‌کند و Gateway را دوباره راه‌اندازی می‌کند.

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
`--dry-run` برای پیش‌نمایش اقدام‌های برنامه‌ریزی‌شده، از `--json` برای نتایج ساختاریافته، یا از
`openclaw update status --json` برای بررسی وضعیت کانال و دسترس‌پذیری استفاده کنید.
نصب‌کننده گزینه `--verbose` خودش را دارد، اما آن گزینه بخشی از
`openclaw update` نیست.

`--channel beta` نسخه بتا را ترجیح می‌دهد، اما runtime وقتی برچسب بتا وجود نداشته باشد یا از آخرین انتشار پایدار قدیمی‌تر باشد، به stable/latest برمی‌گردد. اگر dist-tag خام بتای npm را برای یک به‌روزرسانی یک‌باره بسته می‌خواهید، از `--tag beta` استفاده کنید.

OpenClaw هنوز کانال به‌روزرسانی پشتیبانی LTS یا ماهانه ارائه نمی‌کند. ما در حال حرکت به‌سمت خطوط پشتیبانی ماهانه سازگار با SemVer هستیم، اما امروز کانال‌های پشتیبانی‌شده همچنان `stable`، `beta` و `dev` هستند.

برای معنای کانال‌ها، [کانال‌های توسعه](/fa/install/development-channels) را ببینید.

## جابه‌جایی بین نصب‌های npm و git

وقتی می‌خواهید نوع نصب را تغییر دهید، از کانال‌ها استفاده کنید. به‌روزرساننده
وضعیت، پیکربندی، گواهی‌نامه‌ها و workspace شما را در `~/.openclaw` نگه می‌دارد؛ فقط تغییر می‌دهد
که CLI و Gateway از کدام نصب کد OpenClaw استفاده کنند.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

ابتدا با `--dry-run` اجرا کنید تا جابه‌جایی دقیق حالت نصب را پیش‌نمایش کنید:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

کانال `dev` یک checkout از git را تضمین می‌کند، آن را می‌سازد و CLI سراسری را
از همان checkout نصب می‌کند. کانال‌های `stable` و `beta` از نصب‌های بسته استفاده می‌کنند. اگر
Gateway از قبل نصب شده باشد، `openclaw update` فراداده سرویس را تازه‌سازی می‌کند
و آن را دوباره راه‌اندازی می‌کند، مگر اینکه `--no-restart` را بگذرانید.

## جایگزین: اجرای دوباره نصب‌کننده

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

برای ردکردن onboarding گزینه `--no-onboard` را اضافه کنید. برای اجبار نوع نصب مشخص از طریق
نصب‌کننده، `--install-method git --no-onboard` یا
`--install-method npm --no-onboard` را بگذرانید.

اگر `openclaw update` پس از مرحله نصب بسته npm شکست خورد، نصب‌کننده را دوباره اجرا کنید.
نصب‌کننده به‌روزرساننده قدیمی را فراخوانی نمی‌کند؛ نصب بسته سراسری را مستقیما اجرا می‌کند
و می‌تواند نصب npm نیمه‌به‌روزشده را بازیابی کند.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

برای سنجاق‌کردن بازیابی به یک نسخه یا dist-tag مشخص، `--version` را اضافه کنید:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## جایگزین: npm، pnpm، یا bun دستی

```bash
npm i -g openclaw@latest
```

برای نصب‌های تحت‌نظارت، `openclaw update` را ترجیح دهید، چون می‌تواند جابه‌جایی
بسته را با سرویس Gateway در حال اجرا هماهنگ کند. اگر هنگام اجرای یک
Gateway مدیریت‌شده، دستی به‌روزرسانی می‌کنید، بلافاصله پس از پایان کار مدیر بسته
Gateway را دوباره راه‌اندازی کنید تا فرایند قدیمی از فایل‌های بسته جایگزین‌شده
به سرویس‌دهی ادامه ندهد.

وقتی `openclaw update` یک نصب npm سراسری را مدیریت می‌کند، ابتدا هدف را در
یک prefix موقت npm نصب می‌کند، inventory بسته‌بندی‌شده `dist` را راستی‌آزمایی می‌کند، سپس
درخت بسته تمیز را به prefix سراسری واقعی جابه‌جا می‌کند. این کار مانع می‌شود npm
یک بسته جدید را روی فایل‌های کهنه بسته قدیمی هم‌پوشانی کند. اگر فرمان نصب شکست بخورد،
OpenClaw یک بار با `--omit=optional` دوباره تلاش می‌کند. آن تلاش دوباره به میزبان‌هایی کمک می‌کند که در آن‌ها
وابستگی‌های اختیاری native نمی‌توانند کامپایل شوند، در حالی که اگر fallback هم شکست بخورد،
خرابی اصلی همچنان قابل مشاهده می‌ماند.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### موضوعات پیشرفته نصب npm

<AccordionGroup>
  <Accordion title="درخت بسته فقط‌خواندنی">
    OpenClaw نصب‌های سراسری بسته‌بندی‌شده را در زمان اجرا فقط‌خواندنی تلقی می‌کند، حتی وقتی دایرکتوری بسته سراسری توسط کاربر فعلی قابل‌نوشتن باشد. نصب‌های بسته Plugin در ریشه‌های npm/git متعلق به OpenClaw زیر دایرکتوری پیکربندی کاربر قرار می‌گیرند، و راه‌اندازی Gateway درخت بسته OpenClaw را تغییر نمی‌دهد.

    بعضی تنظیمات npm در Linux بسته‌های سراسری را زیر دایرکتوری‌های متعلق به root مانند `/usr/lib/node_modules/openclaw` نصب می‌کنند. OpenClaw از این چیدمان پشتیبانی می‌کند، چون فرمان‌های نصب/به‌روزرسانی Plugin بیرون از آن دایرکتوری بسته سراسری می‌نویسند.

  </Accordion>
  <Accordion title="واحدهای systemd سخت‌سازی‌شده">
    به OpenClaw دسترسی نوشتن به ریشه‌های پیکربندی/وضعیتش بدهید تا نصب‌های صریح Plugin، به‌روزرسانی‌های Plugin و پاک‌سازی doctor بتوانند تغییراتشان را پایدار کنند:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="پیش‌پرواز فضای دیسک">
    پیش از به‌روزرسانی‌های بسته و نصب‌های صریح Plugin، OpenClaw یک بررسی فضای دیسک best-effort برای volume هدف را امتحان می‌کند. فضای کم یک هشدار همراه با مسیر بررسی‌شده تولید می‌کند، اما به‌روزرسانی را مسدود نمی‌کند، چون quotaهای فایل‌سیستم، snapshotها و volumeهای شبکه می‌توانند پس از بررسی تغییر کنند. نصب واقعی مدیر بسته و راستی‌آزمایی پس از نصب همچنان مرجع نهایی هستند.
  </Accordion>
</AccordionGroup>

## به‌روزرساننده خودکار

به‌روزرساننده خودکار به‌صورت پیش‌فرض خاموش است. آن را در `~/.openclaw/openclaw.json` فعال کنید:

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
| `stable` | به اندازه `stableDelayHours` صبر می‌کند، سپس با jitter قطعی در سراسر `stableJitterHours` اعمال می‌کند (rollout پخش‌شده). |
| `beta` | هر `betaCheckIntervalHours` بررسی می‌کند (پیش‌فرض: ساعتی) و بلافاصله اعمال می‌کند. |
| `dev` | اعمال خودکار ندارد. `openclaw update` را دستی استفاده کنید. |

Gateway همچنین هنگام راه‌اندازی یک راهنمای به‌روزرسانی در log ثبت می‌کند (با `update.checkOnStart: false` غیرفعال کنید).
برای downgrade یا بازیابی حادثه، `OPENCLAW_NO_AUTO_UPDATE=1` را در محیط Gateway تنظیم کنید تا اعمال خودکار حتی وقتی `update.auto.enabled` پیکربندی شده است مسدود شود. راهنمای به‌روزرسانی هنگام راه‌اندازی همچنان می‌تواند اجرا شود، مگر اینکه `update.checkOnStart` هم غیرفعال شده باشد.

به‌روزرسانی‌های مدیر بسته که از طریق handler زنده control-plane در Gateway درخواست می‌شوند،
پس از جابه‌جایی بسته، یک راه‌اندازی دوباره به‌روزرسانی بدون تعویق و بدون cooldown را اجبار می‌کنند. این کار
از باقی‌ماندن یک فرایند قدیمی در حافظه به‌اندازه‌ای طولانی که chunkها را به‌صورت lazy-load
از درخت بسته‌ای که قبلا جایگزین شده است بارگذاری کند جلوگیری می‌کند. فرمان shell یعنی `openclaw update`
همچنان مسیر ترجیحی برای نصب‌های تحت‌نظارت است، چون می‌تواند سرویس را اطراف به‌روزرسانی متوقف و
دوباره راه‌اندازی کند.

## پس از به‌روزرسانی

<Steps>

### اجرای doctor

```bash
openclaw doctor
```

پیکربندی را مهاجرت می‌دهد، سیاست‌های DM را audit می‌کند و سلامت Gateway را بررسی می‌کند. جزئیات: [Doctor](/fa/gateway/doctor)

### راه‌اندازی دوباره Gateway

```bash
openclaw gateway restart
```

### راستی‌آزمایی

```bash
openclaw health
```

</Steps>

## Rollback

### سنجاق‌کردن یک نسخه (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` نسخه منتشرشده فعلی را نشان می‌دهد.
</Tip>

### سنجاق‌کردن یک commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

برای بازگشت به آخرین نسخه: `git checkout main && git pull`.

## اگر گیر کرده‌اید

- `openclaw doctor` را دوباره اجرا کنید و خروجی را با دقت بخوانید.
- برای `openclaw update --channel dev` روی checkoutهای source، به‌روزرساننده در صورت نیاز `pnpm` را به‌صورت خودکار bootstrap می‌کند. اگر خطای bootstrap مربوط به pnpm/corepack دیدید، `pnpm` را دستی نصب کنید (یا `corepack` را دوباره فعال کنید) و به‌روزرسانی را دوباره اجرا کنید.
- بررسی کنید: [عیب‌یابی](/fa/gateway/troubleshooting)
- در Discord بپرسید: [https://discord.gg/clawd](https://discord.gg/clawd)

## مرتبط

- [نمای کلی نصب](/fa/install): همه روش‌های نصب.
- [Doctor](/fa/gateway/doctor): بررسی‌های سلامت پس از به‌روزرسانی.
- [مهاجرت](/fa/install/migrating): راهنماهای مهاجرت نسخه اصلی.
