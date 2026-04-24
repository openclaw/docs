---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: إصلاح مشكلات بدء تشغيل CDP في Chrome/Brave/Edge/Chromium للتحكم في متصفح OpenClaw على Linux
title: استكشاف أخطاء Browser وإصلاحها
x-i18n:
    generated_at: "2026-04-24T08:07:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6f59048d6a5b587b8d6c9ac0d32b3215f68a7e39192256b28f22936cab752e1
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## المشكلة: "Failed to start Chrome CDP on port 18800"

يفشل خادم التحكم في المتصفح في OpenClaw في تشغيل Chrome/Brave/Edge/Chromium مع الخطأ:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### السبب الجذري

على Ubuntu (والعديد من توزيعات Linux)، يكون تثبيت Chromium الافتراضي عبارة عن **حزمة snap**. ويتداخل تقييد AppArmor في snap مع الطريقة التي يولّد بها OpenClaw عملية المتصفح ويراقبها.

يقوم الأمر `apt install chromium` بتثبيت حزمة stub تعيد التوجيه إلى snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

هذا **ليس** متصفحًا حقيقيًا - إنه مجرد غلاف.

### الحل 1: تثبيت Google Chrome (موصى به)

ثبّت حزمة Google Chrome الرسمية من نوع `.deb`، فهي ليست ضمن sandbox الخاصة بـ snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # if there are dependency errors
```

ثم حدّث إعداد OpenClaw لديك (`~/.openclaw/openclaw.json`):

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### الحل 2: استخدام Snap Chromium مع وضع Attach-Only

إذا كنت مضطرًا لاستخدام snap Chromium، فاضبط OpenClaw للارتباط بمتصفح يتم تشغيله يدويًا:

1. حدّث الإعداد:

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

2. شغّل Chromium يدويًا:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. يمكنك اختياريًا إنشاء خدمة مستخدم systemd لتشغيل Chrome تلقائيًا:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

فعّلها باستخدام: `systemctl --user enable --now openclaw-browser.service`

### التحقق من أن المتصفح يعمل

تحقق من الحالة:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

اختبر التصفح:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### مرجع الإعداد

| الخيار | الوصف | الافتراضي |
| ------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled` | تفعيل التحكم في المتصفح | `true` |
| `browser.executablePath` | مسار الملف التنفيذي لمتصفح قائم على Chromium ‏(Chrome/Brave/Edge/Chromium) | يتم اكتشافه تلقائيًا (ويفضّل المتصفح الافتراضي عندما يكون قائمًا على Chromium) |
| `browser.headless` | التشغيل من دون واجهة رسومية | `false` |
| `browser.noSandbox` | إضافة العلامة `--no-sandbox` (مطلوبة لبعض إعدادات Linux) | `false` |
| `browser.attachOnly` | لا تشغّل المتصفح، بل ارتبط فقط بمتصفح موجود | `false` |
| `browser.cdpPort` | منفذ Chrome DevTools Protocol | `18800` |

### المشكلة: "No Chrome tabs found for profile=\"user\""

أنت تستخدم ملف تعريف `existing-session` / Chrome MCP. يستطيع OpenClaw رؤية Chrome المحلية،
لكن لا توجد علامات تبويب مفتوحة متاحة للارتباط بها.

خيارات الإصلاح:

1. **استخدم المتصفح المُدار:** ‏`openclaw browser start --browser-profile openclaw`
   (أو اضبط `browser.defaultProfile: "openclaw"`).
2. **استخدم Chrome MCP:** تأكد من أن Chrome المحلية تعمل وبها علامة تبويب واحدة مفتوحة على الأقل، ثم أعد المحاولة باستخدام `--browser-profile user`.

ملاحظات:

- يكون `user` خاصًا بالمضيف فقط. وبالنسبة إلى خوادم Linux، أو الحاويات، أو المضيفات البعيدة، ففضّل ملفات تعريف CDP.
- تحتفظ ملفات التعريف `user` / وملفات `existing-session` الأخرى بحدود Chrome MCP الحالية:
  إجراءات تقودها المراجع، وخطافات رفع ملف واحد، ومن دون تجاوزات لمهلة مربعات الحوار، ومن دون
  `wait --load networkidle`، ومن دون `responsebody`، أو تصدير PDF، أو اعتراض التنزيلات، أو الإجراءات
  الدفعية.
- تخصص ملفات تعريف `openclaw` المحلية القيم `cdpPort`/`cdpUrl` تلقائيًا؛ ولا تضبط هذه القيم إلا لـ CDP البعيد.
- تقبل ملفات تعريف CDP البعيدة `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) لاكتشاف `/json/version`، أو WS(S) عندما تعطيك خدمة
  المتصفح عنوان URL مباشرًا لمقبس DevTools.

## ذو صلة

- [Browser](/ar/tools/browser)
- [تسجيل الدخول في Browser](/ar/tools/browser-login)
- [استكشاف أخطاء Browser في WSL2 وإصلاحها مع Windows وCDP البعيد](/ar/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
