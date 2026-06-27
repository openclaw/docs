---
read_when:
    - به‌روزرسانی OpenClaw
    - پس از به‌روزرسانی، چیزی خراب می‌شود
summary: به‌روزرسانی ایمن OpenClaw (نصب سراسری یا از منبع)، به‌همراه راهبرد بازگشت عقب
title: در حال به‌روزرسانی
x-i18n:
    generated_at: "2026-06-27T18:01:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a96c5b9b12040fe9bb8b1623c88a9c305d58dc6fcee7003f500e897ded9e7b4a
    source_path: install/updating.md
    workflow: 16
---

OpenClaw را به‌روز نگه دارید.

## توصیه‌شده: `openclaw update`

سریع‌ترین روش برای به‌روزرسانی. نوع نصب شما را تشخیص می‌دهد (npm یا git)، آخرین نسخه را دریافت می‌کند، `openclaw doctor` را اجرا می‌کند، و Gateway را راه‌اندازی مجدد می‌کند.

```bash
openclaw update
```

برای تغییر کانال‌ها یا هدف‌گرفتن یک نسخهٔ مشخص:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --dry-run   # preview without applying
```

`openclaw update` گزینهٔ `--verbose` را نمی‌پذیرد. برای عیب‌یابی به‌روزرسانی، از
`--dry-run` برای پیش‌نمایش اقدام‌های برنامه‌ریزی‌شده، از `--json` برای نتایج ساخت‌یافته، یا از
`openclaw update status --json` برای بررسی وضعیت کانال و موجودبودن استفاده کنید. نصب‌کننده
گزینهٔ `--verbose` خودش را دارد، اما آن گزینه بخشی از
`openclaw update` نیست.

`--channel beta` بتا را ترجیح می‌دهد، اما runtime وقتی تگ بتا وجود نداشته باشد یا از آخرین انتشار پایدار قدیمی‌تر باشد، به stable/latest برمی‌گردد. اگر dist-tag خام npm beta را برای یک به‌روزرسانی یک‌بارهٔ بسته می‌خواهید، از `--tag beta` استفاده کنید.

برای یک checkout دائمی و متحرک GitHub `main` از `--channel dev` استفاده کنید. برای به‌روزرسانی‌های بسته، `--tag main` در یک اجرا به `github:openclaw/openclaw#main` نگاشت می‌شود، و مشخصات منبع GitHub/git پیش از نصب مرحله‌بندی‌شدهٔ npm در یک tarball موقت بسته‌بندی می‌شوند.

برای Pluginهای مدیریت‌شده، بازگشت کانال بتا یک هشدار است: به‌روزرسانی هسته همچنان می‌تواند موفق شود، در حالی که یک Plugin از انتشار پیش‌فرض/آخرین ثبت‌شدهٔ خودش استفاده می‌کند، چون نسخهٔ بتای Plugin موجود نیست.

برای معنای کانال‌ها، [کانال‌های توسعه](/fa/install/development-channels) را ببینید.

## جابه‌جایی بین نصب‌های npm و git

وقتی می‌خواهید نوع نصب را تغییر دهید، از کانال‌ها استفاده کنید. به‌روزرسان وضعیت، پیکربندی، اعتبارنامه‌ها و workspace شما را در `~/.openclaw` نگه می‌دارد؛ فقط نصب کد OpenClaw را که CLI و Gateway استفاده می‌کنند تغییر می‌دهد.

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

کانال `dev` یک checkout گیت را تضمین می‌کند، آن را build می‌کند، و CLI سراسری را از همان checkout نصب می‌کند. کانال‌های `stable` و `beta` از نصب‌های بسته استفاده می‌کنند. اگر Gateway از قبل نصب شده باشد، `openclaw update` فرادادهٔ سرویس را تازه می‌کند و آن را دوباره راه‌اندازی می‌کند، مگر اینکه `--no-restart` را بدهید.

برای نصب‌های بسته با یک سرویس Gateway مدیریت‌شده، `openclaw update` ریشهٔ بسته‌ای را هدف می‌گیرد که آن سرویس استفاده می‌کند. اگر فرمان shell `openclaw` از نصب متفاوتی بیاید، به‌روزرسان هر دو ریشه و مسیر Node سرویس مدیریت‌شده را چاپ می‌کند. به‌روزرسانی بسته از package manager مالک ریشهٔ سرویس استفاده می‌کند و پیش از جایگزینی بسته، Node سرویس مدیریت‌شده را با engine انتشار هدف بررسی می‌کند.

## جایگزین: اجرای دوبارهٔ نصب‌کننده

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

برای ردکردن onboarding، `--no-onboard` را اضافه کنید. برای اجبار یک نوع نصب مشخص از طریق نصب‌کننده، `--install-method git --no-onboard` یا
`--install-method npm --no-onboard` را بدهید.

اگر `openclaw update` پس از مرحلهٔ نصب بستهٔ npm شکست خورد، نصب‌کننده را دوباره اجرا کنید. نصب‌کننده به‌روزرسان قدیمی را صدا نمی‌زند؛ نصب بستهٔ سراسری را مستقیما اجرا می‌کند و می‌تواند یک نصب npm نیمه‌به‌روزشده را بازیابی کند.

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

برای نصب‌های نظارت‌شده، `openclaw update` را ترجیح دهید، چون می‌تواند تعویض بسته را با سرویس Gateway در حال اجرا هماهنگ کند. اگر روی یک نصب نظارت‌شده به‌صورت دستی به‌روزرسانی می‌کنید، پیش از شروع package manager، Gateway مدیریت‌شده را متوقف کنید. Package managerها فایل‌ها را درجا جایگزین می‌کنند، و در غیر این صورت یک Gateway در حال اجرا ممکن است هنگام تعویض موقت و نیمه‌کارهٔ درخت بسته، تلاش کند فایل‌های هسته یا Plugin را بارگذاری کند. پس از پایان کار package manager، Gateway را دوباره راه‌اندازی کنید تا سرویس نصب جدید را دریافت کند.

برای یک نصب سراسری لینوکسی متعلق به root، اگر `openclaw update` با
`EACCES` شکست خورد و با npm سیستمی بازیابی می‌کنید، Gateway را در طول جایگزینی دستی بسته متوقف نگه دارید. از همان flagهای پروفایل `openclaw` یا محیطی استفاده کنید که معمولا برای آن Gateway استفاده می‌کنید. `/usr/bin/npm` را با npm سیستمی که مالک پیشوند سراسری متعلق به root روی میزبان شماست جایگزین کنید:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

سپس سرویس را تأیید کنید:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

وقتی `openclaw update` یک نصب npm سراسری را مدیریت می‌کند، ابتدا هدف را در یک پیشوند npm موقت نصب می‌کند، موجودی `dist` بسته‌بندی‌شده را تأیید می‌کند، سپس درخت بستهٔ تمیز را به پیشوند سراسری واقعی منتقل می‌کند. این کار از قرارگرفتن بستهٔ جدید توسط npm روی فایل‌های کهنهٔ بستهٔ قدیمی جلوگیری می‌کند. اگر فرمان نصب شکست بخورد، OpenClaw یک بار با `--omit=optional` دوباره تلاش می‌کند. این تلاش دوباره به میزبان‌هایی کمک می‌کند که وابستگی‌های اختیاری native نمی‌توانند روی آن‌ها compile شوند، در حالی که اگر fallback هم شکست بخورد، خطای اصلی همچنان قابل مشاهده می‌ماند.

فرمان‌های به‌روزرسانی npm و به‌روزرسانی Plugin که توسط OpenClaw مدیریت می‌شوند نیز قرنطینهٔ npm
`min-release-age` را برای فرایند فرزند npm پاک می‌کنند. npm ممکن است آن سیاست را به‌عنوان آستانهٔ مشتق‌شدهٔ `before` گزارش کند؛ هر دو برای سیاست‌های عمومی قرنطینهٔ زنجیرهٔ تأمین مفید هستند، اما یک به‌روزرسانی صریح OpenClaw یعنی «انتشار انتخاب‌شدهٔ OpenClaw را همین حالا نصب کن.»

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### موضوعات پیشرفتهٔ نصب npm

<AccordionGroup>
  <Accordion title="درخت بستهٔ فقط‌خواندنی">
    OpenClaw نصب‌های سراسری بسته‌بندی‌شده را در runtime به‌عنوان فقط‌خواندنی در نظر می‌گیرد، حتی وقتی دایرکتوری بستهٔ سراسری برای کاربر فعلی قابل نوشتن باشد. نصب‌های بستهٔ Plugin در ریشه‌های npm/git متعلق به OpenClaw زیر دایرکتوری پیکربندی کاربر قرار می‌گیرند، و راه‌اندازی Gateway درخت بستهٔ OpenClaw را تغییر نمی‌دهد.

    برخی تنظیمات npm لینوکس بسته‌های سراسری را زیر دایرکتوری‌های متعلق به root مانند `/usr/lib/node_modules/openclaw` نصب می‌کنند. OpenClaw از این چیدمان پشتیبانی می‌کند، چون فرمان‌های نصب/به‌روزرسانی Plugin بیرون از آن دایرکتوری بستهٔ سراسری می‌نویسند.

  </Accordion>
  <Accordion title="واحدهای systemd سخت‌سازی‌شده">
    به OpenClaw دسترسی نوشتن به ریشه‌های پیکربندی/وضعیتش بدهید تا نصب‌های صریح Plugin، به‌روزرسانی‌های Plugin، و پاک‌سازی doctor بتوانند تغییراتشان را پایدار کنند:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="پیش‌بررسی فضای دیسک">
    پیش از به‌روزرسانی‌های بسته و نصب‌های صریح Plugin، OpenClaw تلاش می‌کند یک بررسی best-effort از فضای دیسک برای volume هدف انجام دهد. فضای کم هشداری با مسیر بررسی‌شده تولید می‌کند، اما به‌روزرسانی را مسدود نمی‌کند، چون quotaهای فایل‌سیستم، snapshotها و volumeهای شبکه می‌توانند پس از بررسی تغییر کنند. نصب واقعی package-manager و تأیید پس از نصب همچنان مرجع نهایی هستند.
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
| `stable` | به‌اندازهٔ `stableDelayHours` صبر می‌کند، سپس با jitter قطعی در سراسر `stableJitterHours` اعمال می‌کند (انتشار تدریجی). |
| `beta`   | هر `betaCheckIntervalHours` بررسی می‌کند (پیش‌فرض: هر ساعت) و بلافاصله اعمال می‌کند. |
| `dev`    | اعمال خودکار ندارد. از `openclaw update` به‌صورت دستی استفاده کنید. |

Gateway همچنین هنگام راه‌اندازی یک راهنمای به‌روزرسانی ثبت می‌کند (با `update.checkOnStart: false` غیرفعال کنید).
برای downgrade یا بازیابی حادثه، `OPENCLAW_NO_AUTO_UPDATE=1` را در محیط Gateway تنظیم کنید تا اعمال خودکار حتی وقتی `update.auto.enabled` پیکربندی شده باشد مسدود شود. راهنماهای به‌روزرسانی زمان راه‌اندازی همچنان می‌توانند اجرا شوند، مگر اینکه `update.checkOnStart` هم غیرفعال شده باشد.

به‌روزرسانی‌های package-manager که از طریق handler زندهٔ control-plane Gateway درخواست می‌شوند، درخت بسته را داخل فرایند Gateway در حال اجرا جایگزین نمی‌کنند. در نصب‌های سرویس مدیریت‌شده، Gateway یک handoff جداشده را شروع می‌کند، خارج می‌شود، و اجازه می‌دهد مسیر معمول CLI `openclaw update --yes --json` سرویس را متوقف کند، بسته را جایگزین کند، فرادادهٔ سرویس را تازه کند، دوباره راه‌اندازی کند، نسخه و دسترس‌پذیری Gateway را تأیید کند، و در صورت امکان یک macOS LaunchAgent نصب‌شده اما بارگذاری‌نشده را بازیابی کند. اگر Gateway نتواند آن handoff را ایمن انجام دهد، `update.run` به‌جای اجرای package manager درون فرایند، یک فرمان shell ایمن گزارش می‌کند.

## پس از به‌روزرسانی

<Steps>

### اجرای doctor

```bash
openclaw doctor
```

پیکربندی را migrate می‌کند، سیاست‌های DM را audit می‌کند، و سلامت Gateway را بررسی می‌کند. جزئیات: [Doctor](/fa/gateway/doctor)

### راه‌اندازی مجدد Gateway

```bash
openclaw gateway restart
```

### تأیید

```bash
openclaw health
```

</Steps>

## بازگشت

### ثابت‌کردن یک نسخه (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` نسخهٔ منتشرشدهٔ فعلی را نشان می‌دهد.
</Tip>

### ثابت‌کردن یک commit (source)

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
- [Doctor](/fa/gateway/doctor): بررسی‌های سلامت پس از به‌روزرسانی‌ها.
- [مهاجرت](/fa/install/migrating): راهنماهای مهاجرت نسخهٔ اصلی.
