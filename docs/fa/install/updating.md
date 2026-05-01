---
read_when:
    - به‌روزرسانی OpenClaw
    - پس از یک به‌روزرسانی، چیزی از کار می‌افتد
summary: به‌روزرسانی ایمن OpenClaw (نصب سراسری یا از منبع)، به‌همراه راهبرد بازگشت
title: به‌روزرسانی
x-i18n:
    generated_at: "2026-05-01T11:49:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: b6ee340af569dde3a6cf61fff26d2a0ab8c8ec882b652f41d6ac8e22ddc5fed1
    source_path: install/updating.md
    workflow: 16
---

OpenClaw را به‌روز نگه دارید.

## پیشنهادی: `openclaw update`

سریع‌ترین راه برای به‌روزرسانی. نوع نصب شما را تشخیص می‌دهد (npm یا git)، تازه‌ترین نسخه را دریافت می‌کند، `openclaw doctor` را اجرا می‌کند و Gateway را راه‌اندازی مجدد می‌کند.

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

`--channel beta` بتا را ترجیح می‌دهد، اما runtime وقتی برچسب بتا وجود نداشته باشد یا از آخرین انتشار پایدار قدیمی‌تر باشد، به stable/latest برمی‌گردد. اگر برای یک به‌روزرسانی موردی package، dist-tag خام npm بتا را می‌خواهید، از `--tag beta` استفاده کنید.

برای معنای کانال‌ها، [کانال‌های توسعه](/fa/install/development-channels) را ببینید.

## جابه‌جایی بین نصب‌های npm و git

وقتی می‌خواهید نوع نصب را تغییر دهید، از کانال‌ها استفاده کنید. به‌روزرسان وضعیت، پیکربندی، اعتبارنامه‌ها و workspace شما را در `~/.openclaw` نگه می‌دارد؛ فقط تغییر می‌دهد که CLI و Gateway از کدام نصب کد OpenClaw استفاده کنند.

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

کانال `dev` وجود یک checkout از git را تضمین می‌کند، آن را می‌سازد و CLI سراسری را از همان checkout نصب می‌کند. کانال‌های `stable` و `beta` از نصب‌های package استفاده می‌کنند. اگر Gateway از قبل نصب شده باشد، `openclaw update` فراداده سرویس را تازه می‌کند و آن را راه‌اندازی مجدد می‌کند، مگر اینکه `--no-restart` را پاس بدهید.

## جایگزین: اجرای دوباره نصب‌کننده

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

برای رد کردن onboarding، `--no-onboard` را اضافه کنید. برای اجبار یک نوع نصب مشخص از طریق نصب‌کننده، `--install-method git --no-onboard` یا `--install-method npm --no-onboard` را پاس بدهید.

اگر `openclaw update` پس از مرحله نصب package از npm شکست خورد، نصب‌کننده را دوباره اجرا کنید. نصب‌کننده، به‌روزرسان قدیمی را فراخوانی نمی‌کند؛ نصب package سراسری را مستقیم اجرا می‌کند و می‌تواند یک نصب npm را که تا حدی به‌روزرسانی شده بازیابی کند.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

برای ثابت‌کردن بازیابی روی یک نسخه یا dist-tag مشخص، `--version` را اضافه کنید:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## جایگزین: npm، pnpm یا bun دستی

```bash
npm i -g openclaw@latest
```

وقتی `openclaw update` یک نصب npm سراسری را مدیریت می‌کند، ابتدا هدف را در یک prefix موقت npm نصب می‌کند، inventory بسته‌بندی‌شده `dist` را بررسی می‌کند، سپس درخت package تمیز را با prefix سراسری واقعی جایگزین می‌کند. این کار از این جلوگیری می‌کند که npm یک package جدید را روی فایل‌های کهنه package قدیمی قرار دهد. اگر فرمان نصب شکست بخورد، OpenClaw یک بار با `--omit=optional` دوباره تلاش می‌کند. این تلاش دوباره به میزبان‌هایی کمک می‌کند که وابستگی‌های اختیاری native در آن‌ها کامپایل نمی‌شوند، در حالی که اگر fallback هم شکست بخورد، خطای اصلی همچنان قابل مشاهده می‌ماند.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### موضوعات پیشرفته نصب npm

<AccordionGroup>
  <Accordion title="درخت package فقط‌خواندنی">
    OpenClaw نصب‌های سراسری بسته‌بندی‌شده را در runtime فقط‌خواندنی در نظر می‌گیرد، حتی وقتی دایرکتوری package سراسری توسط کاربر فعلی قابل نوشتن باشد. وابستگی‌های runtime مربوط به Pluginهای همراه، به‌جای تغییر دادن درخت package، در یک دایرکتوری runtime قابل نوشتن stage می‌شوند. این کار مانع می‌شود `openclaw update` با یک Gateway در حال اجرا یا agent محلی که در همان نصب در حال تعمیر وابستگی‌های Plugin است، رقابت کند.

    برخی تنظیمات npm در Linux، packageهای سراسری را زیر دایرکتوری‌های متعلق به root مانند `/usr/lib/node_modules/openclaw` نصب می‌کنند. OpenClaw از این چیدمان از طریق همان مسیر staging خارجی پشتیبانی می‌کند.

  </Accordion>
  <Accordion title="واحدهای systemd سخت‌سازی‌شده">
    یک دایرکتوری stage قابل نوشتن تنظیم کنید که در `ReadWritePaths` گنجانده شده باشد:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` یک فهرست مسیر را نیز می‌پذیرد. OpenClaw وابستگی‌های runtime مربوط به Pluginهای همراه را از چپ به راست در ریشه‌های فهرست‌شده resolve می‌کند، ریشه‌های قبلی را لایه‌های از پیش نصب‌شده فقط‌خواندنی در نظر می‌گیرد و فقط در ریشه نهایی قابل نوشتن نصب یا تعمیر می‌کند:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    اگر `OPENCLAW_PLUGIN_STAGE_DIR` تنظیم نشده باشد، OpenClaw وقتی systemd آن را فراهم کند از `$STATE_DIRECTORY` استفاده می‌کند، سپس به `~/.openclaw/plugin-runtime-deps` برمی‌گردد. مرحله تعمیر، آن stage را به‌عنوان یک ریشه package محلی متعلق به OpenClaw در نظر می‌گیرد و prefix کاربر npm و تنظیمات سراسری را نادیده می‌گیرد، بنابراین پیکربندی npm مربوط به نصب سراسری، وابستگی‌های Plugin همراه را به `~/node_modules` یا درخت package سراسری هدایت نمی‌کند.

  </Accordion>
  <Accordion title="پیش‌بررسی فضای دیسک">
    پیش از به‌روزرسانی‌های package و تعمیرهای وابستگی runtime همراه، OpenClaw تلاش می‌کند یک بررسی best-effort فضای دیسک برای volume هدف انجام دهد. فضای کم، هشداری با مسیر بررسی‌شده تولید می‌کند، اما به‌روزرسانی را مسدود نمی‌کند، چون quotaهای فایل‌سیستم، snapshotها و volumeهای شبکه می‌توانند پس از بررسی تغییر کنند. نصب واقعی npm، کپی و بررسی پس از نصب همچنان مرجع نهایی هستند.
  </Accordion>
  <Accordion title="وابستگی‌های runtime مربوط به Pluginهای همراه">
    نصب‌های بسته‌بندی‌شده، وابستگی‌های runtime مربوط به Pluginهای همراه را بیرون از درخت package فقط‌خواندنی نگه می‌دارند. در startup و هنگام `openclaw doctor --fix`، OpenClaw وابستگی‌های runtime را فقط برای Pluginهای همراهی تعمیر می‌کند که در config فعال باشند، از طریق config قدیمی channel فعال باشند، یا با default مربوط به manifest همراهشان فعال شده باشند. صرفا وجود وضعیت auth ذخیره‌شده channel باعث تعمیر وابستگی runtime هنگام startup Gateway نمی‌شود.

    غیرفعال‌سازی صریح اولویت دارد. یک Plugin یا channel غیرفعال فقط به این دلیل که در package وجود دارد، وابستگی‌های runtime خود را تعمیر نمی‌کند. Pluginهای خارجی و مسیرهای load سفارشی همچنان از `openclaw plugins install` یا `openclaw plugins update` استفاده می‌کنند.

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
| `stable` | به‌اندازه `stableDelayHours` صبر می‌کند، سپس با jitter قطعی در بازه `stableJitterHours` اعمال می‌کند (rollout پخش‌شده). |
| `beta`   | هر `betaCheckIntervalHours` بررسی می‌کند (پیش‌فرض: ساعتی) و بلافاصله اعمال می‌کند.                              |
| `dev`    | اعمال خودکار ندارد. از `openclaw update` به‌صورت دستی استفاده کنید.                                                           |

Gateway هنگام startup نیز یک راهنمای به‌روزرسانی در log ثبت می‌کند (با `update.checkOnStart: false` غیرفعال کنید).
برای downgrade یا بازیابی incident، `OPENCLAW_NO_AUTO_UPDATE=1` را در محیط Gateway تنظیم کنید تا اعمال خودکار حتی وقتی `update.auto.enabled` پیکربندی شده است مسدود شود. راهنماهای به‌روزرسانی startup همچنان می‌توانند اجرا شوند، مگر اینکه `update.checkOnStart` نیز غیرفعال شده باشد.

به‌روزرسانی‌های package manager که از طریق handler زنده control-plane مربوط به Gateway درخواست می‌شوند، پس از جایگزینی package یک restart بدون تأخیر و بدون cooldown برای به‌روزرسانی را اجباری می‌کنند. این کار از باقی‌ماندن یک process قدیمی در حافظه به‌اندازه‌ای طولانی که chunkها را به‌صورت lazy از درخت packageای load کند که از قبل جایگزین شده، جلوگیری می‌کند. مسیر shell `openclaw update` برای نصب‌های تحت نظارت همچنان ترجیح داده می‌شود، چون می‌تواند سرویس را پیرامون به‌روزرسانی متوقف و راه‌اندازی مجدد کند.

## پس از به‌روزرسانی

<Steps>

### اجرای doctor

```bash
openclaw doctor
```

config را migrate می‌کند، policyهای DM را audit می‌کند و سلامت Gateway را بررسی می‌کند. جزئیات: [Doctor](/fa/gateway/doctor)

### راه‌اندازی مجدد Gateway

```bash
openclaw gateway restart
```

### بررسی

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

### ثابت‌کردن یک commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

برای بازگشت به آخرین نسخه: `git checkout main && git pull`.

## اگر گیر کرده‌اید

- `openclaw doctor` را دوباره اجرا کنید و خروجی را با دقت بخوانید.
- برای `openclaw update --channel dev` روی checkoutهای source، به‌روزرسان در صورت نیاز `pnpm` را به‌صورت خودکار bootstrap می‌کند. اگر خطای bootstrap مربوط به pnpm/corepack دیدید، `pnpm` را دستی نصب کنید (یا `corepack` را دوباره فعال کنید) و به‌روزرسانی را دوباره اجرا کنید.
- بررسی کنید: [عیب‌یابی](/fa/gateway/troubleshooting)
- در Discord بپرسید: [https://discord.gg/clawd](https://discord.gg/clawd)

## مرتبط

- [نمای کلی نصب](/fa/install): همه روش‌های نصب.
- [Doctor](/fa/gateway/doctor): بررسی‌های سلامت پس از به‌روزرسانی‌ها.
- [مهاجرت](/fa/install/migrating): راهنماهای مهاجرت نسخه اصلی.
