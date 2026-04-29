---
read_when:
    - می‌خواهید OpenClaw را از یک دستگاه حذف کنید
    - سرویس Gateway پس از حذف نصب همچنان در حال اجرا است
summary: حذف کامل OpenClaw (CLI، سرویس، وضعیت، فضای کاری)
title: حذف نصب
x-i18n:
    generated_at: "2026-04-29T23:07:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6d73bc46f4878510706132e5c6cfec3c27cdb55578ed059dc12a785712616d75
    source_path: install/uninstall.md
    workflow: 16
---

دو مسیر:

- **مسیر آسان** اگر `openclaw` هنوز نصب است.
- **حذف دستی سرویس** اگر CLI حذف شده اما سرویس هنوز در حال اجراست.

## مسیر آسان (CLI هنوز نصب است)

توصیه‌شده: از حذف‌کنندهٔ نصب داخلی استفاده کنید:

```bash
openclaw uninstall
```

غیرتعاملی (خودکارسازی / npx):

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

3. وضعیت + پیکربندی را حذف کنید:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

اگر `OPENCLAW_CONFIG_PATH` را روی مکانی سفارشی خارج از دایرکتوری وضعیت تنظیم کرده‌اید، آن فایل را هم حذف کنید.

4. فضای کاری خود را حذف کنید (اختیاری، فایل‌های عامل را حذف می‌کند):

```bash
rm -rf ~/.openclaw/workspace
```

5. نصب CLI را حذف کنید (موردی را که استفاده کرده‌اید انتخاب کنید):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. اگر برنامهٔ macOS را نصب کرده‌اید:

```bash
rm -rf /Applications/OpenClaw.app
```

نکته‌ها:

- اگر از پروفایل‌ها (`--profile` / `OPENCLAW_PROFILE`) استفاده کرده‌اید، مرحلهٔ 3 را برای هر دایرکتوری وضعیت تکرار کنید (پیش‌فرض‌ها `~/.openclaw-<profile>` هستند).
- در حالت راه دور، دایرکتوری وضعیت روی **میزبان Gateway** قرار دارد، بنابراین مراحل 1 تا 4 را آنجا هم اجرا کنید.

## حذف دستی سرویس (CLI نصب نیست)

اگر سرویس Gateway همچنان در حال اجراست اما `openclaw` وجود ندارد، از این روش استفاده کنید.

### macOS (launchd)

برچسب پیش‌فرض `ai.openclaw.gateway` است (یا `ai.openclaw.<profile>`؛ قالب قدیمی `com.openclaw.*` ممکن است هنوز وجود داشته باشد):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

اگر از پروفایل استفاده کرده‌اید، برچسب و نام plist را با `ai.openclaw.<profile>` جایگزین کنید. اگر plistهای قدیمی `com.openclaw.*` وجود دارند، آن‌ها را هم حذف کنید.

### Linux (واحد کاربری systemd)

نام واحد پیش‌فرض `openclaw-gateway.service` است (یا `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (کار زمان‌بندی‌شده)

نام کار پیش‌فرض `OpenClaw Gateway` است (یا `OpenClaw Gateway (<profile>)`).
اسکریپت کار زیر دایرکتوری وضعیت شما قرار دارد.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

اگر از پروفایل استفاده کرده‌اید، نام کار متناظر و `~\.openclaw-<profile>\gateway.cmd` را حذف کنید.

## نصب عادی در برابر checkout از منبع

### نصب عادی (install.sh / npm / pnpm / bun)

اگر از `https://openclaw.ai/install.sh` یا `install.ps1` استفاده کرده‌اید، CLI با `npm install -g openclaw@latest` نصب شده است.
آن را با `npm rm -g openclaw` حذف کنید (یا اگر با آن روش نصب کرده‌اید، با `pnpm remove -g` / `bun remove -g`).

### checkout از منبع (git clone)

اگر از یک checkout مخزن اجرا می‌کنید (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. سرویس Gateway را **پیش از** حذف مخزن، حذف نصب کنید (از مسیر آسان بالا یا حذف دستی سرویس استفاده کنید).
2. دایرکتوری مخزن را حذف کنید.
3. وضعیت + فضای کاری را همان‌طور که در بالا نشان داده شد حذف کنید.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [راهنمای مهاجرت](/fa/install/migrating)
