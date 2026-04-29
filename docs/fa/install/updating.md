---
read_when:
    - به‌روزرسانی OpenClaw
    - پس از به‌روزرسانی چیزی از کار می‌افتد
summary: به‌روزرسانی ایمن OpenClaw (نصب سراسری یا از منبع)، به‌همراه راهبرد بازگشت
title: به‌روزرسانی
x-i18n:
    generated_at: "2026-04-29T23:07:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 17d4839002b153976e014e0eefcb44f92dcb9bb45b81bf30efb1e8e8c0f30ec3
    source_path: install/updating.md
    workflow: 16
---

OpenClaw را به‌روز نگه دارید.

## توصیه‌شده: `openclaw update`

سریع‌ترین راه برای به‌روزرسانی. نوع نصب شما را تشخیص می‌دهد (npm یا git)، آخرین نسخه را دریافت می‌کند، `openclaw doctor` را اجرا می‌کند و Gateway را راه‌اندازی مجدد می‌کند.

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

`--channel beta` نسخه beta را ترجیح می‌دهد، اما runtime وقتی تگ beta وجود نداشته باشد یا از آخرین انتشار stable قدیمی‌تر باشد، به stable/latest برمی‌گردد. اگر برای یک به‌روزرسانی موردی package، dist-tag خام beta در npm را می‌خواهید، از `--tag beta` استفاده کنید.

برای معناشناسی کانال‌ها، [کانال‌های توسعه](/fa/install/development-channels) را ببینید.

## جابه‌جایی بین نصب‌های npm و git

وقتی می‌خواهید نوع نصب را تغییر دهید، از کانال‌ها استفاده کنید. به‌روزرسان وضعیت، پیکربندی، اعتبارنامه‌ها و workspace شما را در `~/.openclaw` نگه می‌دارد؛ فقط مشخص می‌کند CLI و Gateway از کدام نصب کد OpenClaw استفاده کنند.

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

کانال `dev` وجود یک checkout از git را تضمین می‌کند، آن را build می‌کند و CLI سراسری را از همان checkout نصب می‌کند. کانال‌های `stable` و `beta` از نصب‌های package استفاده می‌کنند. اگر Gateway از قبل نصب شده باشد، `openclaw update` فراداده service را تازه‌سازی می‌کند و آن را راه‌اندازی مجدد می‌کند، مگر اینکه `--no-restart` را بدهید.

## جایگزین: اجرای دوباره installer

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

برای رد کردن onboarding، `--no-onboard` را اضافه کنید. برای اجبار یک نوع نصب مشخص از طریق installer، `--install-method git --no-onboard` یا `--install-method npm --no-onboard` را بدهید.

اگر `openclaw update` پس از مرحله نصب package در npm شکست خورد، installer را دوباره اجرا کنید. installer به‌روزرسان قدیمی را فراخوانی نمی‌کند؛ نصب package سراسری را مستقیما اجرا می‌کند و می‌تواند یک نصب npm را که تا حدی به‌روزرسانی شده بازیابی کند.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

برای پین کردن بازیابی به یک نسخه یا dist-tag مشخص، `--version` را اضافه کنید:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## جایگزین: npm، pnpm یا bun به‌صورت دستی

```bash
npm i -g openclaw@latest
```

وقتی `openclaw update` یک نصب npm سراسری را مدیریت می‌کند، ابتدا هدف را در یک prefix موقت npm نصب می‌کند، inventory بسته‌بندی‌شده `dist` را بررسی می‌کند، سپس درخت package تمیز را به prefix سراسری واقعی جابه‌جا می‌کند. این کار از هم‌پوشانی npm روی فایل‌های کهنه package قبلی جلوگیری می‌کند. اگر فرمان نصب شکست بخورد، OpenClaw یک‌بار با `--omit=optional` دوباره تلاش می‌کند. این تلاش دوباره به میزبان‌هایی کمک می‌کند که dependencyهای اختیاری native در آن‌ها قابل کامپایل نیستند، درحالی‌که اگر fallback هم شکست بخورد، شکست اصلی همچنان قابل مشاهده می‌ماند.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### موضوعات پیشرفته نصب npm

<AccordionGroup>
  <Accordion title="درخت package فقط‌خواندنی">
    OpenClaw نصب‌های سراسری بسته‌بندی‌شده را در زمان runtime فقط‌خواندنی در نظر می‌گیرد، حتی وقتی دایرکتوری package سراسری برای کاربر فعلی قابل نوشتن باشد. dependencyهای runtime مربوط به Pluginهای bundled به‌جای تغییر دادن درخت package، در یک دایرکتوری runtime قابل نوشتن stage می‌شوند. این کار جلوی رقابت `openclaw update` با یک Gateway یا agent محلی در حال اجرا را می‌گیرد که هم‌زمان در حال تعمیر dependencyهای Plugin است.

    برخی تنظیمات npm در Linux، packageهای سراسری را زیر دایرکتوری‌های متعلق به root مانند `/usr/lib/node_modules/openclaw` نصب می‌کنند. OpenClaw از همان مسیر stage خارجی از این layout پشتیبانی می‌کند.

  </Accordion>
  <Accordion title="واحدهای systemd سخت‌سازی‌شده">
    یک دایرکتوری stage قابل نوشتن تنظیم کنید که در `ReadWritePaths` گنجانده شده باشد:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` فهرست مسیرها را نیز می‌پذیرد. OpenClaw dependencyهای runtime مربوط به Pluginهای bundled را از چپ به راست در rootهای فهرست‌شده resolve می‌کند، rootهای قبلی را به‌عنوان لایه‌های ازپیش‌نصب‌شده فقط‌خواندنی در نظر می‌گیرد و فقط در root نهایی قابل نوشتن نصب یا تعمیر می‌کند:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    اگر `OPENCLAW_PLUGIN_STAGE_DIR` تنظیم نشده باشد، OpenClaw وقتی systemd آن را فراهم کند از `$STATE_DIRECTORY` استفاده می‌کند، سپس به `~/.openclaw/plugin-runtime-deps` برمی‌گردد. مرحله تعمیر آن stage را به‌عنوان root محلی package متعلق به OpenClaw در نظر می‌گیرد و prefix کاربر npm و تنظیمات سراسری را نادیده می‌گیرد، بنابراین پیکربندی npm مربوط به نصب سراسری، dependencyهای Pluginهای bundled را به `~/node_modules` یا درخت package سراسری هدایت نمی‌کند.

  </Accordion>
  <Accordion title="پیش‌بررسی فضای دیسک">
    پیش از به‌روزرسانی‌های package و تعمیرهای dependencyهای runtime bundled، OpenClaw تلاش می‌کند یک بررسی best-effort فضای دیسک برای volume هدف انجام دهد. کمبود فضا همراه با مسیر بررسی‌شده یک هشدار تولید می‌کند، اما به‌روزرسانی را مسدود نمی‌کند، چون quotaهای filesystem، snapshotها و volumeهای شبکه می‌توانند پس از بررسی تغییر کنند. نصب واقعی npm، کپی و بررسی پس از نصب همچنان مرجع نهایی هستند.
  </Accordion>
  <Accordion title="dependencyهای runtime مربوط به Pluginهای bundled">
    نصب‌های بسته‌بندی‌شده، dependencyهای runtime مربوط به Pluginهای bundled را خارج از درخت package فقط‌خواندنی نگه می‌دارند. هنگام startup و در طول `openclaw doctor --fix`، OpenClaw dependencyهای runtime را فقط برای Pluginهای bundled تعمیر می‌کند که در config فعال هستند، از طریق config قدیمی channel فعال هستند، یا توسط default مانیفست bundled خود فعال شده‌اند. وضعیت احراز هویت channel که persist شده باشد، به‌تنهایی تعمیر dependencyهای runtime هنگام startup در Gateway را trigger نمی‌کند.

    غیرفعال‌سازی صریح برنده است. یک Plugin یا channel غیرفعال فقط به این دلیل که در package وجود دارد، dependencyهای runtime خود را تعمیر نمی‌کند. Pluginهای خارجی و مسیرهای load سفارشی همچنان از `openclaw plugins install` یا `openclaw plugins update` استفاده می‌کنند.

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

| کانال    | رفتار                                                                                                                       |
| -------- | --------------------------------------------------------------------------------------------------------------------------- |
| `stable` | به‌مدت `stableDelayHours` منتظر می‌ماند، سپس با jitter قطعی در طول `stableJitterHours` اعمال می‌کند (rollout پخش‌شده). |
| `beta`   | هر `betaCheckIntervalHours` بررسی می‌کند (پیش‌فرض: هر ساعت) و بلافاصله اعمال می‌کند.                                      |
| `dev`    | اعمال خودکار ندارد. از `openclaw update` به‌صورت دستی استفاده کنید.                                                       |

Gateway همچنین هنگام startup یک راهنمای به‌روزرسانی log می‌کند (با `update.checkOnStart: false` غیرفعال کنید).
برای downgrade یا بازیابی پس از incident، `OPENCLAW_NO_AUTO_UPDATE=1` را در محیط Gateway تنظیم کنید تا اعمال خودکار حتی وقتی `update.auto.enabled` پیکربندی شده باشد مسدود شود. راهنماهای به‌روزرسانی هنگام startup همچنان می‌توانند اجرا شوند، مگر اینکه `update.checkOnStart` نیز غیرفعال شده باشد.

## پس از به‌روزرسانی

<Steps>

### doctor را اجرا کنید

```bash
openclaw doctor
```

config را migrate می‌کند، policyهای DM را audit می‌کند و سلامت Gateway را بررسی می‌کند. جزئیات: [Doctor](/fa/gateway/doctor)

### Gateway را راه‌اندازی مجدد کنید

```bash
openclaw gateway restart
```

### بررسی کنید

```bash
openclaw health
```

</Steps>

## بازگشت به نسخه قبلی

### پین کردن یک نسخه (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` نسخه منتشرشده فعلی را نشان می‌دهد.
</Tip>

### پین کردن یک commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

برای بازگشت به آخرین نسخه: `git checkout main && git pull`.

## اگر گیر کردید

- دوباره `openclaw doctor` را اجرا کنید و خروجی را با دقت بخوانید.
- برای `openclaw update --channel dev` روی checkoutهای source، به‌روزرسان در صورت نیاز `pnpm` را به‌صورت خودکار bootstrap می‌کند. اگر خطای bootstrap مربوط به pnpm/corepack دیدید، `pnpm` را دستی نصب کنید (یا `corepack` را دوباره فعال کنید) و به‌روزرسانی را دوباره اجرا کنید.
- بررسی کنید: [عیب‌یابی](/fa/gateway/troubleshooting)
- در Discord بپرسید: [https://discord.gg/clawd](https://discord.gg/clawd)

## مرتبط

- [نمای کلی نصب](/fa/install): همه روش‌های نصب.
- [Doctor](/fa/gateway/doctor): بررسی‌های سلامت پس از به‌روزرسانی‌ها.
- [مهاجرت](/fa/install/migrating): راهنماهای مهاجرت نسخه اصلی.
