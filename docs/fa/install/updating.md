---
read_when:
    - به‌روزرسانی OpenClaw
    - پس از به‌روزرسانی چیزی از کار می‌افتد
summary: به‌روزرسانی ایمن OpenClaw (نصب سراسری یا از منبع)، به‌همراه راهبرد بازگشت
title: به‌روزرسانی
x-i18n:
    generated_at: "2026-05-02T11:52:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84bf4462a4ee041b0d22e433d1e9f44cfd799a5c327ba94f9df96595d92bdb3c
    source_path: install/updating.md
    workflow: 16
---

OpenClaw را به‌روز نگه دارید.

## توصیه‌شده: `openclaw update`

سریع‌ترین راه برای به‌روزرسانی. نوع نصب شما را تشخیص می‌دهد (npm یا git)، آخرین نسخه را دریافت می‌کند، `openclaw doctor` را اجرا می‌کند، و Gateway را دوباره راه‌اندازی می‌کند.

```bash
openclaw update
```

برای تغییر کانال‌ها یا هدف‌گرفتن یک نسخه مشخص:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # پیش‌نمایش بدون اعمال
```

`--channel beta` نسخه بتا را ترجیح می‌دهد، اما runtime وقتی tag بتا وجود نداشته باشد یا از آخرین انتشار پایدار قدیمی‌تر باشد، به stable/latest برمی‌گردد. اگر برای یک به‌روزرسانی موردی package، dist-tag خام npm beta را می‌خواهید، از `--tag beta` استفاده کنید.

برای معنای کانال‌ها، [کانال‌های توسعه](/fa/install/development-channels) را ببینید.

## جابه‌جایی بین نصب‌های npm و git

وقتی می‌خواهید نوع نصب را تغییر دهید، از کانال‌ها استفاده کنید. به‌روزرسان، state، config، credentials و workspace شما را در `~/.openclaw` نگه می‌دارد؛ فقط تغییر می‌دهد که CLI و Gateway از کدام نصب کد OpenClaw استفاده کنند.

```bash
# نصب package با npm -> checkout قابل‌ویرایش git
openclaw update --channel dev

# checkout git -> نصب package با npm
openclaw update --channel stable
```

ابتدا با `--dry-run` اجرا کنید تا تغییر دقیق حالت نصب را پیش‌نمایش کنید:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

کانال `dev` وجود یک checkout از git را تضمین می‌کند، آن را build می‌کند، و CLI سراسری را از همان checkout نصب می‌کند. کانال‌های `stable` و `beta` از نصب‌های package استفاده می‌کنند. اگر Gateway از قبل نصب شده باشد، `openclaw update` metadata سرویس را تازه‌سازی می‌کند و آن را دوباره راه‌اندازی می‌کند، مگر اینکه `--no-restart` را پاس کنید.

## جایگزین: اجرای دوباره installer

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

برای ردکردن onboarding، `--no-onboard` را اضافه کنید. برای اجبار یک نوع نصب مشخص از طریق installer، `--install-method git --no-onboard` یا `--install-method npm --no-onboard` را پاس کنید.

اگر `openclaw update` پس از مرحله نصب package با npm شکست خورد، installer را دوباره اجرا کنید. installer به‌روزرسان قدیمی را فراخوانی نمی‌کند؛ نصب package سراسری را مستقیم اجرا می‌کند و می‌تواند یک نصب npm نیمه‌به‌روزشده را بازیابی کند.

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

وقتی `openclaw update` یک نصب npm سراسری را مدیریت می‌کند، ابتدا target را در یک prefix موقت npm نصب می‌کند، inventory بسته‌بندی‌شده `dist` را راستی‌آزمایی می‌کند، سپس درخت package پاک را به prefix سراسری واقعی جابه‌جا می‌کند. این کار از overlay شدن یک package جدید روی فایل‌های کهنه از package قدیمی توسط npm جلوگیری می‌کند. اگر فرمان نصب شکست بخورد، OpenClaw یک بار با `--omit=optional` دوباره تلاش می‌کند. این تلاش دوباره به hostهایی کمک می‌کند که optional dependencyهای native در آن‌ها کامپایل نمی‌شوند، درحالی‌که اگر fallback هم شکست بخورد، شکست اصلی همچنان قابل مشاهده می‌ماند.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### موضوعات پیشرفته نصب npm

<AccordionGroup>
  <Accordion title="درخت package فقط‌خواندنی">
    OpenClaw نصب‌های سراسری بسته‌بندی‌شده را در زمان runtime فقط‌خواندنی در نظر می‌گیرد، حتی وقتی دایرکتوری package سراسری توسط کاربر فعلی قابل‌نوشتن باشد. نصب‌های package مربوط به Plugin در ریشه‌های npm/git متعلق به OpenClaw زیر دایرکتوری config کاربر قرار می‌گیرند، و شروع‌به‌کار Gateway درخت package مربوط به OpenClaw را تغییر نمی‌دهد.

    برخی تنظیمات npm در Linux، packageهای سراسری را زیر دایرکتوری‌های متعلق به root مانند `/usr/lib/node_modules/openclaw` نصب می‌کنند. OpenClaw از این چیدمان پشتیبانی می‌کند، چون فرمان‌های نصب/به‌روزرسانی Plugin بیرون از آن دایرکتوری package سراسری می‌نویسند.

  </Accordion>
  <Accordion title="واحدهای systemd سخت‌سازی‌شده">
    به OpenClaw دسترسی نوشتن به ریشه‌های config/state آن بدهید تا نصب‌های صریح Plugin، به‌روزرسانی‌های Plugin و پاک‌سازی doctor بتوانند تغییرات خود را پایدار کنند:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="پیش‌بررسی فضای دیسک">
    پیش از به‌روزرسانی packageها و نصب‌های صریح Plugin، OpenClaw تلاش می‌کند یک بررسی best-effort برای فضای دیسک volume هدف انجام دهد. فضای کم یک هشدار با مسیر بررسی‌شده ایجاد می‌کند، اما به‌روزرسانی را مسدود نمی‌کند، چون quotaهای filesystem، snapshotها، و volumeهای شبکه می‌توانند پس از بررسی تغییر کنند. نصب واقعی package-manager و راستی‌آزمایی پس از نصب همچنان مرجع قطعی هستند.
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
| `stable` | `stableDelayHours` صبر می‌کند، سپس با jitter قطعی در سراسر `stableJitterHours` اعمال می‌کند (rollout پخش‌شده). |
| `beta`   | هر `betaCheckIntervalHours` بررسی می‌کند (پیش‌فرض: ساعتی) و بلافاصله اعمال می‌کند. |
| `dev`    | اعمال خودکار ندارد. `openclaw update` را دستی استفاده کنید. |

Gateway همچنین هنگام شروع‌به‌کار یک راهنمای به‌روزرسانی در log می‌نویسد (با `update.checkOnStart: false` غیرفعال کنید).
برای downgrade یا بازیابی incident، `OPENCLAW_NO_AUTO_UPDATE=1` را در محیط Gateway تنظیم کنید تا اعمال خودکار حتی وقتی `update.auto.enabled` پیکربندی شده است مسدود شود. راهنماهای به‌روزرسانی هنگام شروع‌به‌کار همچنان می‌توانند اجرا شوند، مگر اینکه `update.checkOnStart` نیز غیرفعال شده باشد.

به‌روزرسانی‌های package-manager که از طریق handler زنده control-plane در Gateway درخواست می‌شوند، پس از تعویض package یک restart به‌روزرسانی بدون تأخیر و بدون cooldown را اجباری می‌کنند. این کار از باقی‌ماندن یک فرایند قدیمی در حافظه به اندازه‌ای طولانی جلوگیری می‌کند که بخواهد chunkها را از درخت package که قبلاً جایگزین شده است lazy-load کند. `openclaw update` از shell همچنان مسیر ترجیحی برای نصب‌های supervised است، چون می‌تواند سرویس را در اطراف به‌روزرسانی متوقف و دوباره راه‌اندازی کند.

## پس از به‌روزرسانی

<Steps>

### اجرای doctor

```bash
openclaw doctor
```

config را migrate می‌کند، policyهای DM را audit می‌کند، و سلامت Gateway را بررسی می‌کند. جزئیات: [Doctor](/fa/gateway/doctor)

### راه‌اندازی دوباره Gateway

```bash
openclaw gateway restart
```

### راستی‌آزمایی

```bash
openclaw health
```

</Steps>

## بازگشت به نسخه قبلی

### Pin کردن یک نسخه (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` نسخه منتشرشده فعلی را نشان می‌دهد.
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
- برای `openclaw update --channel dev` روی checkoutهای source، به‌روزرسان در صورت نیاز `pnpm` را خودکار bootstrap می‌کند. اگر خطای bootstrap مربوط به pnpm/corepack دیدید، `pnpm` را دستی نصب کنید (یا `corepack` را دوباره فعال کنید) و به‌روزرسانی را دوباره اجرا کنید.
- بررسی کنید: [عیب‌یابی](/fa/gateway/troubleshooting)
- در Discord بپرسید: [https://discord.gg/clawd](https://discord.gg/clawd)

## مرتبط

- [نمای کلی نصب](/fa/install): همه روش‌های نصب.
- [Doctor](/fa/gateway/doctor): بررسی‌های سلامت پس از به‌روزرسانی.
- [مهاجرت](/fa/install/migrating): راهنماهای مهاجرت نسخه اصلی.
