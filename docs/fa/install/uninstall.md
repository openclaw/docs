---
read_when:
    - می‌خواهید OpenClaw را از یک دستگاه حذف کنید
    - سرویس Gateway پس از حذف نصب همچنان در حال اجرا است
summary: OpenClaw را به‌طور کامل حذف کنید (CLI، سرویس، وضعیت، فضای کاری)
title: حذف نصب
x-i18n:
    generated_at: "2026-07-12T10:19:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84f01dc11defe6f19c89232375e48bad383b2e71379f47f43e759d3d7bb908b5
    source_path: install/uninstall.md
    workflow: 16
---

دو مسیر:

- **مسیر آسان** اگر `openclaw` همچنان نصب است.
- **حذف دستی سرویس** اگر CLI حذف شده اما سرویس همچنان در حال اجرا است.

## مسیر آسان (CLI همچنان نصب است)

توصیه می‌شود از حذف‌کنندهٔ داخلی استفاده کنید:

```bash
openclaw uninstall
```

حذف وضعیت، دایرکتوری‌های فضای کاری پیکربندی‌شده را حفظ می‌کند، مگر اینکه `--workspace` را نیز انتخاب کنید.

پیش‌نمایش مواردی که حذف خواهند شد (ایمن):

```bash
openclaw uninstall --dry-run --all
```

حالت غیرتعاملی (خودکارسازی / npx). با احتیاط و فقط پس از تأیید دامنه‌ها استفاده کنید:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

پرچم‌های `--service`، `--state`، `--workspace` و `--app` هرکدام دامنه‌ای جداگانه را انتخاب می‌کنند؛ `--all` هر چهار دامنه را انتخاب می‌کند.

مراحل دستی (با همان نتیجه):

1. سرویس Gateway را متوقف کنید:

```bash
openclaw gateway stop
```

2. سرویس Gateway را حذف نصب کنید (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. وضعیت و پیکربندی را حذف کنید:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

اگر `OPENCLAW_CONFIG_PATH` را روی مکانی سفارشی خارج از دایرکتوری وضعیت تنظیم کرده‌اید، آن فایل را نیز حذف کنید.
اگر می‌خواهید فضای کاری داخل دایرکتوری وضعیت، مانند `~/.openclaw/workspace`، حفظ شود، پیش از اجرای `rm -rf` آن را به محل دیگری منتقل کنید یا محتویات وضعیت را به‌صورت انتخابی حذف کنید.

4. فضای کاری خود را حذف کنید (اختیاری، فایل‌های عامل را حذف می‌کند):

```bash
rm -rf ~/.openclaw/workspace
```

5. نصب CLI را حذف کنید (موردی را انتخاب کنید که برای نصب استفاده کرده‌اید):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. اگر برنامهٔ macOS را نصب کرده‌اید:

```bash
rm -rf /Applications/OpenClaw.app
```

نکات:

- اگر از پروفایل‌ها (`--profile` / `OPENCLAW_PROFILE`) استفاده کرده‌اید، مرحلهٔ ۳ را برای دایرکتوری وضعیت هر پروفایل تکرار کنید (مقدار پیش‌فرض `~/.openclaw-<profile>` است).
- در حالت راه دور، دایرکتوری وضعیت روی **میزبان Gateway** قرار دارد؛ بنابراین مراحل ۱ تا ۴ را در آنجا نیز اجرا کنید.

## حذف دستی سرویس (CLI نصب نیست)

اگر سرویس Gateway همچنان در حال اجرا است اما `openclaw` وجود ندارد، از این روش استفاده کنید.

### macOS (launchd)

برچسب پیش‌فرض `ai.openclaw.gateway` است (یا در صورت استفاده از پروفایل، `ai.openclaw.<profile>`):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

اگر از پروفایل استفاده کرده‌اید، برچسب و نام فایل plist را با `ai.openclaw.<profile>` جایگزین کنید.

### Linux (واحد کاربری systemd)

نام پیش‌فرض واحد `openclaw-gateway.service` است (یا `openclaw-gateway-<profile>.service`). ممکن است واحد قدیمیِ پیش از تغییر نام، یعنی `clawdbot-gateway.service`، همچنان روی دستگاه‌هایی که از نصب‌های بسیار قدیمی ارتقا یافته‌اند وجود داشته باشد؛ `openclaw uninstall` / `openclaw gateway uninstall` آن را به‌طور خودکار شناسایی و حذف می‌کند.

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (وظیفهٔ زمان‌بندی‌شده)

نام پیش‌فرض وظیفه `OpenClaw Gateway` است (یا `OpenClaw Gateway (<profile>)`).
این وظیفه، اسکریپت بدون پنجرهٔ `gateway.vbs` را از دایرکتوری وضعیت شما اجرا می‌کند که آن نیز
`gateway.cmd` را اجرا می‌کند؛ هر دو را حذف کنید.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

اگر از پروفایل استفاده کرده‌اید، نام وظیفهٔ منطبق و فایل‌های `gateway.cmd` /
`gateway.vbs` را در `~\.openclaw-<profile>` حذف کنید.

## نصب عادی در برابر دریافت کد منبع

### نصب عادی (install.sh / npm / pnpm / bun)

اگر از `https://openclaw.ai/install.sh` یا `install.ps1` استفاده کرده‌اید، CLI با `npm install -g openclaw@latest` نصب شده است.
آن را با `npm rm -g openclaw` حذف کنید (یا اگر با روش دیگری نصب کرده‌اید، از `pnpm remove -g` / `bun remove -g` استفاده کنید).

### دریافت کد منبع (git clone)

اگر از نسخهٔ دریافت‌شدهٔ مخزن اجرا می‌کنید (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. سرویس Gateway را **پیش از** حذف مخزن، حذف نصب کنید (از مسیر آسان بالا یا حذف دستی سرویس استفاده کنید).
2. دایرکتوری مخزن را حذف کنید.
3. وضعیت و فضای کاری را مطابق توضیحات بالا حذف کنید.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [راهنمای مهاجرت](/fa/install/migrating)
