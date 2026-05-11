---
read_when:
    - به‌روزرسانی OpenClaw
    - پس از به‌روزرسانی چیزی از کار می‌افتد
summary: به‌روزرسانی ایمن OpenClaw (نصب سراسری یا از منبع)، به‌همراه راهبرد بازگشت به نسخهٔ قبلی
title: به‌روزرسانی
x-i18n:
    generated_at: "2026-05-11T20:37:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: cb1506ed87b1cf2e4928987c9dbfaff17d47b87f6c18239d694e0f55deb609f7
    source_path: install/updating.md
    workflow: 16
---

OpenClaw را به‌روز نگه دارید.

## توصیه‌شده: `openclaw update`

سریع‌ترین روش برای به‌روزرسانی. نوع نصب شما را تشخیص می‌دهد (npm یا git)، آخرین نسخه را دریافت می‌کند، `openclaw doctor` را اجرا می‌کند و Gateway را بازراه‌اندازی می‌کند.

```bash
openclaw update
```

برای تغییر کانال‌ها یا هدف‌گرفتن یک نسخهٔ مشخص:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`openclaw update` گزینهٔ `--verbose` را نمی‌پذیرد. برای عیب‌یابی به‌روزرسانی، از
`--dry-run` برای پیش‌نمایش اقدام‌های برنامه‌ریزی‌شده، از `--json` برای نتایج ساخت‌یافته، یا از
`openclaw update status --json` برای بررسی وضعیت کانال و دسترس‌پذیری استفاده کنید. نصب‌کننده
پرچم `--verbose` خودش را دارد، اما آن پرچم بخشی از
`openclaw update` نیست.

`--channel beta` بتا را ترجیح می‌دهد، اما runtime وقتی برچسب بتا وجود نداشته باشد
یا از آخرین انتشار پایدار قدیمی‌تر باشد، به stable/latest برمی‌گردد. اگر برای یک
به‌روزرسانی موردی بسته، dist-tag خام بتای npm را می‌خواهید، از `--tag beta`
استفاده کنید.

برای Pluginهای مدیریت‌شده، بازگشت کانال بتا یک هشدار است: به‌روزرسانی هسته همچنان
می‌تواند موفق شود، درحالی‌که یک Plugin از انتشار پیش‌فرض/آخرین ثبت‌شدهٔ خود استفاده می‌کند، چون هیچ
بتای Plugin در دسترس نیست.

برای معنای کانال‌ها، [کانال‌های توسعه](/fa/install/development-channels) را ببینید.

## جابه‌جایی بین نصب‌های npm و git

وقتی می‌خواهید نوع نصب را تغییر دهید، از کانال‌ها استفاده کنید. به‌روزرسان وضعیت،
پیکربندی، اعتبارنامه‌ها و workspace شما را در `~/.openclaw` نگه می‌دارد؛ فقط تغییر می‌دهد
CLI و Gateway از کدام نصب کد OpenClaw استفاده کنند.

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

کانال `dev` یک checkout از git را تضمین می‌کند، آن را می‌سازد و CLI سراسری را
از همان checkout نصب می‌کند. کانال‌های `stable` و `beta` از نصب‌های بسته استفاده می‌کنند. اگر
Gateway از قبل نصب شده باشد، `openclaw update` فرادادهٔ سرویس را تازه می‌کند
و آن را بازراه‌اندازی می‌کند، مگر اینکه `--no-restart` را پاس بدهید.

## جایگزین: اجرای دوبارهٔ نصب‌کننده

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

برای ردکردن onboarding، `--no-onboard` را اضافه کنید. برای اجبار یک نوع نصب مشخص از طریق
نصب‌کننده، `--install-method git --no-onboard` یا
`--install-method npm --no-onboard` را پاس بدهید.

اگر `openclaw update` پس از مرحلهٔ نصب بستهٔ npm شکست خورد، دوباره
نصب‌کننده را اجرا کنید. نصب‌کننده به‌روزرسان قدیمی را فراخوانی نمی‌کند؛ نصب بستهٔ
سراسری را مستقیم اجرا می‌کند و می‌تواند یک نصب npm نیمه‌به‌روزرسانی‌شده را بازیابی کند.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

برای pin کردن بازیابی به یک نسخه یا dist-tag مشخص، `--version` را اضافه کنید:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## جایگزین: npm، pnpm، یا bun دستی

```bash
npm i -g openclaw@latest
```

برای نصب‌های تحت نظارت، `openclaw update` را ترجیح دهید، چون می‌تواند تعویض بسته را با
سرویس Gateway در حال اجرا هماهنگ کند. اگر وقتی یک Gateway مدیریت‌شده در حال اجراست
به‌صورت دستی به‌روزرسانی می‌کنید، بلافاصله پس از پایان کار package manager، Gateway را
بازراه‌اندازی کنید تا فرایند قدیمی همچنان از فایل‌های بستهٔ جایگزین‌شده سرویس‌دهی نکند.

وقتی `openclaw update` یک نصب npm سراسری را مدیریت می‌کند، ابتدا هدف را در
یک پیشوند موقت npm نصب می‌کند، inventory بسته‌بندی‌شدهٔ `dist` را تأیید می‌کند، سپس
درخت بستهٔ تمیز را با پیشوند سراسری واقعی جابه‌جا می‌کند. این کار جلوی آن را می‌گیرد که npm
یک بستهٔ جدید را روی فایل‌های کهنهٔ بستهٔ قدیمی overlay کند. اگر فرمان نصب شکست بخورد،
OpenClaw یک‌بار با `--omit=optional` دوباره تلاش می‌کند. این تلاش دوباره به میزبان‌هایی کمک می‌کند که در آن‌ها
وابستگی‌های اختیاری native قابل کامپایل نیستند، درحالی‌که اگر fallback هم شکست بخورد،
خطای اصلی همچنان قابل مشاهده می‌ماند.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### موضوعات پیشرفتهٔ نصب npm

<AccordionGroup>
  <Accordion title="درخت بستهٔ فقط‌خواندنی">
    OpenClaw نصب‌های سراسری بسته‌بندی‌شده را در زمان runtime فقط‌خواندنی در نظر می‌گیرد، حتی وقتی دایرکتوری بستهٔ سراسری برای کاربر فعلی قابل نوشتن باشد. نصب‌های بستهٔ Plugin در ریشه‌های npm/git متعلق به OpenClaw زیر دایرکتوری پیکربندی کاربر قرار می‌گیرند، و راه‌اندازی Gateway درخت بستهٔ OpenClaw را تغییر نمی‌دهد.

    برخی تنظیمات npm در Linux بسته‌های سراسری را زیر دایرکتوری‌های متعلق به root مانند `/usr/lib/node_modules/openclaw` نصب می‌کنند. OpenClaw از این چیدمان پشتیبانی می‌کند، چون فرمان‌های نصب/به‌روزرسانی Plugin بیرون از آن دایرکتوری بستهٔ سراسری می‌نویسند.

  </Accordion>
  <Accordion title="واحدهای systemd سخت‌سازی‌شده">
    به OpenClaw دسترسی نوشتن به ریشه‌های پیکربندی/وضعیتش بدهید تا نصب‌های صریح Plugin، به‌روزرسانی‌های Plugin و پاک‌سازی doctor بتوانند تغییرات خود را پایدار کنند:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="پیش‌بررسی فضای دیسک">
    پیش از به‌روزرسانی‌های بسته و نصب‌های صریح Plugin، OpenClaw با بهترین تلاش ممکن فضای دیسک volume هدف را بررسی می‌کند. کمبود فضا هشداری همراه با مسیر بررسی‌شده تولید می‌کند، اما جلوی به‌روزرسانی را نمی‌گیرد، چون quotaهای فایل‌سیستم، snapshotها و volumeهای شبکه می‌توانند پس از بررسی تغییر کنند. نصب واقعی package-manager و تأیید پس از نصب همچنان مرجع نهایی هستند.
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

| کانال | رفتار                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | به اندازهٔ `stableDelayHours` صبر می‌کند، سپس با jitter قطعی در سراسر `stableJitterHours` اعمال می‌کند (انتشار تدریجی). |
| `beta`   | هر `betaCheckIntervalHours` بررسی می‌کند (پیش‌فرض: ساعتی) و فوراً اعمال می‌کند.                              |
| `dev`    | اعمال خودکار ندارد. از `openclaw update` به‌صورت دستی استفاده کنید.                                                           |

Gateway همچنین هنگام راه‌اندازی یک راهنمای به‌روزرسانی در log ثبت می‌کند (با `update.checkOnStart: false` غیرفعال کنید).
برای downgrade یا بازیابی پس از incident، `OPENCLAW_NO_AUTO_UPDATE=1` را در محیط Gateway تنظیم کنید تا اعمال خودکار حتی وقتی `update.auto.enabled` پیکربندی شده باشد مسدود شود. راهنمای به‌روزرسانی هنگام راه‌اندازی همچنان می‌تواند اجرا شود، مگر اینکه `update.checkOnStart` نیز غیرفعال شده باشد.

به‌روزرسانی‌های package-manager که از طریق handler صفحهٔ کنترل زندهٔ Gateway درخواست می‌شوند،
پس از تعویض بسته، یک بازراه‌اندازی به‌روزرسانی بدون تأخیر و بدون cooldown را اجبار می‌کنند. این کار
جلوی باقی‌ماندن یک فرایند قدیمی در حافظه را به‌اندازه‌ای می‌گیرد که بتواند chunkها را به‌صورت lazy-load
از درخت بسته‌ای که قبلاً جایگزین شده است بارگیری کند. `openclaw update` در shell
همچنان مسیر ترجیحی برای نصب‌های تحت نظارت است، چون می‌تواند سرویس را پیرامون به‌روزرسانی متوقف و
بازراه‌اندازی کند.

## پس از به‌روزرسانی

<Steps>

### اجرای doctor

```bash
openclaw doctor
```

پیکربندی را مهاجرت می‌دهد، سیاست‌های DM را ممیزی می‌کند و سلامت Gateway را بررسی می‌کند. جزئیات: [Doctor](/fa/gateway/doctor)

### بازراه‌اندازی Gateway

```bash
openclaw gateway restart
```

### تأیید

```bash
openclaw health
```

</Steps>

## Rollback

### Pin کردن یک نسخه (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` نسخهٔ منتشرشدهٔ فعلی را نشان می‌دهد.
</Tip>

### Pin کردن یک commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

برای بازگشت به آخرین نسخه: `git checkout main && git pull`.

## اگر گیر کرده‌اید

- دوباره `openclaw doctor` را اجرا کنید و خروجی را با دقت بخوانید.
- برای `openclaw update --channel dev` روی checkoutهای source، به‌روزرسان در صورت نیاز `pnpm` را به‌صورت خودکار bootstrap می‌کند. اگر خطای bootstrap مربوط به pnpm/corepack دیدید، `pnpm` را دستی نصب کنید (یا `corepack` را دوباره فعال کنید) و به‌روزرسانی را دوباره اجرا کنید.
- بررسی کنید: [عیب‌یابی](/fa/gateway/troubleshooting)
- در Discord بپرسید: [https://discord.gg/clawd](https://discord.gg/clawd)

## مرتبط

- [نمای کلی نصب](/fa/install): همهٔ روش‌های نصب.
- [Doctor](/fa/gateway/doctor): بررسی‌های سلامت پس از به‌روزرسانی.
- [مهاجرت](/fa/install/migrating): راهنماهای مهاجرت نسخهٔ اصلی.
