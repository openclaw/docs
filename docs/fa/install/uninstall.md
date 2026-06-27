---
read_when:
    - می‌خواهید OpenClaw را از یک دستگاه حذف کنید
    - سرویس Gateway پس از حذف نصب همچنان در حال اجرا است
summary: حذف کامل OpenClaw (CLI، سرویس، وضعیت، فضای کاری)
title: حذف نصب
x-i18n:
    generated_at: "2026-06-27T18:01:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0f63bde2769b3d35d928aed1668121086a2952338f2634d45d55da8cc637025b
    source_path: install/uninstall.md
    workflow: 16
---

دو مسیر:

- **مسیر آسان** اگر `openclaw` هنوز نصب است.
- **حذف دستی سرویس** اگر CLI حذف شده اما سرویس هنوز در حال اجرا است.

## مسیر آسان (CLI هنوز نصب است)

توصیه‌شده: از حذف‌کننده داخلی استفاده کنید:

```bash
openclaw uninstall
```

هنگام استفاده از CLI، حذف state دایرکتوری‌های workspace پیکربندی‌شده را حفظ می‌کند مگر اینکه `--workspace` را هم انتخاب کنید.

پیش‌نمایش مواردی که حذف می‌شوند (ایمن):

```bash
openclaw uninstall --dry-run --all
```

غیرتعاملی (اتوماسیون / npx). با احتیاط و فقط پس از تأیید scopeها استفاده کنید:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

مراحل دستی (با همان نتیجه):

1. سرویس Gateway را متوقف کنید:

```bash
openclaw gateway stop
```

2. سرویس Gateway را حذف نصب کنید (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. state + config را حذف کنید:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

اگر `OPENCLAW_CONFIG_PATH` را روی مکانی سفارشی بیرون از دایرکتوری state تنظیم کرده‌اید، آن فایل را هم حذف کنید.
اگر می‌خواهید یک workspace داخل دایرکتوری state، مانند `~/.openclaw/workspace` را نگه دارید، پیش از اجرای `rm -rf` آن را کنار بگذارید یا محتوای state را به‌صورت انتخابی حذف کنید.

4. workspace خود را حذف کنید (اختیاری، فایل‌های agent را حذف می‌کند):

```bash
rm -rf ~/.openclaw/workspace
```

5. نصب CLI را حذف کنید (موردی را انتخاب کنید که استفاده کرده‌اید):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. اگر برنامه macOS را نصب کرده‌اید:

```bash
rm -rf /Applications/OpenClaw.app
```

نکته‌ها:

- اگر از profileها (`--profile` / `OPENCLAW_PROFILE`) استفاده کرده‌اید، مرحله 3 را برای هر دایرکتوری state تکرار کنید (پیش‌فرض‌ها `~/.openclaw-<profile>` هستند).
- در حالت remote، دایرکتوری state روی **میزبان Gateway** قرار دارد، پس مراحل 1-4 را آنجا هم اجرا کنید.

## حذف دستی سرویس (CLI نصب نیست)

اگر سرویس Gateway همچنان اجرا می‌شود اما `openclaw` وجود ندارد، از این استفاده کنید.

### macOS (launchd)

label پیش‌فرض `ai.openclaw.gateway` است (یا `ai.openclaw.<profile>`؛ legacy `com.openclaw.*` ممکن است هنوز وجود داشته باشد):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

اگر از profile استفاده کرده‌اید، label و نام plist را با `ai.openclaw.<profile>` جایگزین کنید. هر plist متعلق به legacy `com.openclaw.*` را نیز در صورت وجود حذف کنید.

### Linux (systemd user unit)

نام unit پیش‌فرض `openclaw-gateway.service` است (یا `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

نام task پیش‌فرض `OpenClaw Gateway` است (یا `OpenClaw Gateway (<profile>)`).
اسکریپت task زیر دایرکتوری state شما با نام `gateway.cmd` قرار دارد؛ نصب‌های فعلی ممکن است
یک اجراکننده بدون پنجره `gateway.vbs` هم بسازند که Task Scheduler آن را به‌جای
باز کردن مستقیم `gateway.cmd` اجرا می‌کند.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

اگر از profile استفاده کرده‌اید، نام task متناظر و فایل‌های `gateway.cmd` /
`gateway.vbs` را زیر `~\.openclaw-<profile>` حذف کنید.

## نصب عادی در برابر checkout منبع

### نصب عادی (install.sh / npm / pnpm / bun)

اگر از `https://openclaw.ai/install.sh` یا `install.ps1` استفاده کرده‌اید، CLI با `npm install -g openclaw@latest` نصب شده است.
آن را با `npm rm -g openclaw` حذف کنید (یا اگر آن‌گونه نصب کرده‌اید، با `pnpm remove -g` / `bun remove -g`).

### checkout منبع (git clone)

اگر از یک checkout مخزن اجرا می‌کنید (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. سرویس Gateway را **پیش از** حذف مخزن حذف نصب کنید (از مسیر آسان بالا یا حذف دستی سرویس استفاده کنید).
2. دایرکتوری مخزن را حذف کنید.
3. state + workspace را همان‌طور که بالا نشان داده شد حذف کنید.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [راهنمای مهاجرت](/fa/install/migrating)
