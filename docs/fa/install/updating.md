---
read_when:
    - به‌روزرسانی OpenClaw
    - بعد از یک به‌روزرسانی مشکلی پیش می‌آید
summary: به‌روزرسانی ایمن OpenClaw (نصب سراسری یا از سورس)، به‌همراه راهبرد بازگشت
title: به‌روزرسانی
x-i18n:
    generated_at: "2026-05-03T21:36:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9e26ea71748dfd1573cdca01126bf29ebc56be56eac604e2b6a009b463820d1
    source_path: install/updating.md
    workflow: 16
---

OpenClaw را به‌روز نگه دارید.

## توصیه‌شده: `openclaw update`

سریع‌ترین روش برای به‌روزرسانی. نوع نصب شما را تشخیص می‌دهد (npm یا git)، آخرین نسخه را دریافت می‌کند، `openclaw doctor` را اجرا می‌کند و gateway را دوباره راه‌اندازی می‌کند.

```bash
openclaw update
```

برای تغییر کانال‌ها یا هدف‌گیری یک نسخه مشخص:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`openclaw update` گزینه `--verbose` را نمی‌پذیرد. برای عیب‌یابی به‌روزرسانی، از
`--dry-run` برای پیش‌نمایش اقدام‌های برنامه‌ریزی‌شده، از `--json` برای نتایج ساختاریافته، یا از
`openclaw update status --json` برای بررسی کانال و وضعیت دسترس‌پذیری استفاده کنید. نصب‌کننده
پرچم `--verbose` خودش را دارد، اما آن پرچم بخشی از
`openclaw update` نیست.

`--channel beta` بتا را ترجیح می‌دهد، اما runtime وقتی
تگ بتا وجود نداشته باشد یا از آخرین انتشار پایدار قدیمی‌تر باشد، به stable/latest برمی‌گردد. اگر برای یک به‌روزرسانی موردی بسته، dist-tag خام npm beta را می‌خواهید، از `--tag beta`
استفاده کنید.

برای معنای کانال‌ها، [کانال‌های توسعه](/fa/install/development-channels) را ببینید.

## جابه‌جایی بین نصب‌های npm و git

وقتی می‌خواهید نوع نصب را تغییر دهید، از کانال‌ها استفاده کنید. به‌روزرسان وضعیت،
پیکربندی، اعتبارنامه‌ها و workspace شما را در `~/.openclaw` نگه می‌دارد؛ فقط تغییر می‌دهد
که CLI و gateway از کدام نصب کد OpenClaw استفاده کنند.

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

کانال `dev` وجود یک checkout از git را تضمین می‌کند، آن را می‌سازد و CLI سراسری را
از همان checkout نصب می‌کند. کانال‌های `stable` و `beta` از نصب‌های بسته‌ای استفاده می‌کنند. اگر
gateway از قبل نصب شده باشد، `openclaw update` فراداده سرویس را تازه‌سازی می‌کند
و مگر اینکه `--no-restart` را پاس دهید، آن را دوباره راه‌اندازی می‌کند.

## جایگزین: اجرای دوباره نصب‌کننده

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

برای رد کردن onboarding، `--no-onboard` را اضافه کنید. برای اجبار یک نوع نصب مشخص از طریق
نصب‌کننده، `--install-method git --no-onboard` یا
`--install-method npm --no-onboard` را پاس دهید.

اگر `openclaw update` پس از مرحله نصب بسته npm شکست خورد، نصب‌کننده را
دوباره اجرا کنید. نصب‌کننده updater قدیمی را فراخوانی نمی‌کند؛ نصب بسته
سراسری را مستقیما اجرا می‌کند و می‌تواند یک نصب npm را که تا حدی به‌روز شده، بازیابی کند.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

برای سنجاق کردن بازیابی به یک نسخه یا dist-tag مشخص، `--version` را اضافه کنید:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## جایگزین: npm، pnpm یا bun دستی

```bash
npm i -g openclaw@latest
```

وقتی `openclaw update` یک نصب سراسری npm را مدیریت می‌کند، ابتدا هدف را در
یک پیشوند موقت npm نصب می‌کند، موجودی `dist` بسته‌بندی‌شده را راستی‌آزمایی می‌کند، سپس
درخت بسته پاک را به پیشوند سراسری واقعی جابه‌جا می‌کند. این کار از هم‌پوشانی npm
یک بسته جدید روی فایل‌های کهنه بسته قدیمی جلوگیری می‌کند. اگر فرمان نصب شکست بخورد،
OpenClaw یک بار با `--omit=optional` دوباره تلاش می‌کند. این تلاش دوباره به میزبان‌هایی کمک می‌کند که در آن‌ها
وابستگی‌های اختیاری native نمی‌توانند کامپایل شوند، در حالی که اگر fallback هم شکست بخورد،
شکست اصلی همچنان قابل مشاهده می‌ماند.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### موضوعات پیشرفته نصب npm

<AccordionGroup>
  <Accordion title="درخت بسته فقط‌خواندنی">
    OpenClaw در runtime با نصب‌های سراسری بسته‌بندی‌شده مانند فقط‌خواندنی رفتار می‌کند، حتی وقتی دایرکتوری بسته سراسری برای کاربر فعلی قابل نوشتن باشد. نصب‌های بسته Plugin در ریشه‌های npm/git متعلق به OpenClaw زیر دایرکتوری پیکربندی کاربر قرار می‌گیرند، و راه‌اندازی Gateway درخت بسته OpenClaw را تغییر نمی‌دهد.

    برخی تنظیمات npm در Linux بسته‌های سراسری را زیر دایرکتوری‌های متعلق به root مانند `/usr/lib/node_modules/openclaw` نصب می‌کنند. OpenClaw از این چیدمان پشتیبانی می‌کند، چون فرمان‌های نصب/به‌روزرسانی Plugin خارج از آن دایرکتوری بسته سراسری می‌نویسند.

  </Accordion>
  <Accordion title="واحدهای systemd سخت‌سازی‌شده">
    به OpenClaw دسترسی نوشتن به ریشه‌های پیکربندی/وضعیتش بدهید تا نصب‌های صریح Plugin، به‌روزرسانی‌های Plugin و پاک‌سازی doctor بتوانند تغییرات خود را پایدار کنند:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="پیش‌بررسی فضای دیسک">
    پیش از به‌روزرسانی‌های بسته و نصب‌های صریح Plugin، OpenClaw تلاش می‌کند یک بررسی بهترین‌تلاشی فضای دیسک برای volume هدف انجام دهد. فضای کم یک هشدار همراه با مسیر بررسی‌شده تولید می‌کند، اما به‌روزرسانی را مسدود نمی‌کند، چون quotaهای فایل‌سیستم، snapshotها و volumeهای شبکه می‌توانند پس از بررسی تغییر کنند. نصب واقعی package-manager و راستی‌آزمایی پس از نصب همچنان مرجع نهایی هستند.
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

| کانال     | رفتار                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | `stableDelayHours` صبر می‌کند، سپس با jitter قطعی در سراسر `stableJitterHours` اعمال می‌کند (انتشار پخش‌شده). |
| `beta`   | هر `betaCheckIntervalHours` بررسی می‌کند (پیش‌فرض: هر ساعت) و بلافاصله اعمال می‌کند.                              |
| `dev`    | اعمال خودکار ندارد. از `openclaw update` به‌صورت دستی استفاده کنید.                                                           |

Gateway همچنین هنگام راه‌اندازی یک راهنمای به‌روزرسانی ثبت می‌کند (با `update.checkOnStart: false` غیرفعال کنید).
برای downgrade یا بازیابی حادثه، `OPENCLAW_NO_AUTO_UPDATE=1` را در محیط gateway تنظیم کنید تا اعمال خودکار حتی وقتی `update.auto.enabled` پیکربندی شده باشد مسدود شود. راهنماهای به‌روزرسانی هنگام راه‌اندازی همچنان می‌توانند اجرا شوند، مگر اینکه `update.checkOnStart` نیز غیرفعال شده باشد.

به‌روزرسانی‌های package-manager که از طریق handler زنده control-plane در Gateway درخواست می‌شوند
پس از جابه‌جایی بسته، یک راه‌اندازی مجدد به‌روزرسانی بدون تعویق و بدون cooldown را اجبار می‌کنند. این کار
از باقی ماندن یک پردازش قدیمی در حافظه آن‌قدر طولانی که chunkها را با lazy-load
از درخت بسته‌ای که قبلا جایگزین شده است بار کند، جلوگیری می‌کند. `openclaw update` در Shell
برای نصب‌های تحت نظارت همچنان مسیر ترجیحی است، چون می‌تواند سرویس را اطراف به‌روزرسانی متوقف و
دوباره راه‌اندازی کند.

## پس از به‌روزرسانی

<Steps>

### اجرای doctor

```bash
openclaw doctor
```

پیکربندی را مهاجرت می‌دهد، سیاست‌های DM را audit می‌کند و سلامت gateway را بررسی می‌کند. جزئیات: [Doctor](/fa/gateway/doctor)

### راه‌اندازی مجدد gateway

```bash
openclaw gateway restart
```

### راستی‌آزمایی

```bash
openclaw health
```

</Steps>

## بازگشت به نسخه قبلی

### سنجاق کردن یک نسخه (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` نسخه منتشرشده فعلی را نشان می‌دهد.
</Tip>

### سنجاق کردن یک commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

برای بازگشت به آخرین نسخه: `git checkout main && git pull`.

## اگر گیر کرده‌اید

- دوباره `openclaw doctor` را اجرا کنید و خروجی را با دقت بخوانید.
- برای `openclaw update --channel dev` روی checkoutهای source، به‌روزرسان در صورت نیاز `pnpm` را خودکار bootstrap می‌کند. اگر خطای bootstrap مربوط به pnpm/corepack دیدید، `pnpm` را دستی نصب کنید (یا `corepack` را دوباره فعال کنید) و به‌روزرسانی را دوباره اجرا کنید.
- بررسی کنید: [عیب‌یابی](/fa/gateway/troubleshooting)
- در Discord بپرسید: [https://discord.gg/clawd](https://discord.gg/clawd)

## مرتبط

- [نمای کلی نصب](/fa/install): همه روش‌های نصب.
- [Doctor](/fa/gateway/doctor): بررسی‌های سلامت پس از به‌روزرسانی‌ها.
- [مهاجرت](/fa/install/migrating): راهنماهای مهاجرت نسخه اصلی.
