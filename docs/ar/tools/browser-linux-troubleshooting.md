---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: إصلاح مشكلات بدء تشغيل Chrome/Brave/Edge/Chromium CDP للتحكم في متصفح OpenClaw على Linux
title: استكشاف أخطاء المتصفح وإصلاحها
x-i18n:
    generated_at: "2026-04-30T08:27:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9a91ea42a8a600163bcf66ad398677175bd0c5186d3e1dddb629a55c2ea66ed
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## المشكلة: "Failed to start Chrome CDP on port 18800"

يفشل خادم التحكم بالمتصفح في OpenClaw في تشغيل Chrome/Brave/Edge/Chromium مع الخطأ:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### السبب الجذري

على Ubuntu (والعديد من توزيعات Linux)، يكون تثبيت Chromium الافتراضي **حزمة snap**. يتداخل حصر AppArmor الخاص بـ Snap مع الطريقة التي ينشئ بها OpenClaw عملية المتصفح ويراقبها.

يثبّت الأمر `apt install chromium` حزمة وسيطة تعيد التوجيه إلى snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

هذا ليس متصفحًا حقيقيًا - إنه مجرد غلاف.

إخفاقات تشغيل Linux الشائعة الأخرى:

- يعني `The profile appears to be in use by another Chromium process` أن Chrome
  وجد ملفات قفل `Singleton*` قديمة في دليل الملف الشخصي المُدار. يزيل OpenClaw
  هذه الأقفال ويعيد المحاولة مرة واحدة عندما يشير القفل إلى عملية ميتة أو
  عملية على مضيف مختلف.
- يعني `Missing X server or $DISPLAY` أنه طُلب متصفح مرئي صراحةً
  على مضيف لا يحتوي على جلسة سطح مكتب. افتراضيًا، تعود الملفات الشخصية المحلية المُدارة
  الآن إلى وضع headless على Linux عندما يكون كل من `DISPLAY` و
  `WAYLAND_DISPLAY` غير معيّنين. إذا ضبطت `OPENCLAW_BROWSER_HEADLESS=0`،
  أو `browser.headless: false`، أو `browser.profiles.<name>.headless: false`،
  فأزل تجاوز وضع headed هذا، أو اضبط `OPENCLAW_BROWSER_HEADLESS=1`، أو ابدأ `Xvfb`،
  أو شغّل `openclaw browser start --headless` لتشغيل مُدار لمرة واحدة، أو شغّل
  OpenClaw في جلسة سطح مكتب حقيقية.

### الحل 1: تثبيت Google Chrome (موصى به)

ثبّت حزمة Google Chrome الرسمية بصيغة `.deb`، وهي غير معزولة عبر snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # if there are dependency errors
```

ثم حدّث إعدادات OpenClaw لديك (`~/.openclaw/openclaw.json`):

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

### الحل 2: استخدام Snap Chromium مع وضع الإرفاق فقط

إذا كان لا بد من استخدام snap Chromium، فاضبط OpenClaw للإرفاق بمتصفح يبدأ يدويًا:

1. حدّث الإعدادات:

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

2. ابدأ Chromium يدويًا:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. اختياريًا، أنشئ خدمة مستخدم systemd لبدء Chrome تلقائيًا:

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

فعّل باستخدام: `systemctl --user enable --now openclaw-browser.service`

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

### مرجع الإعدادات

| الخيار                           | الوصف                                                          | الافتراضي                                                     |
| -------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`                | تفعيل التحكم بالمتصفح                                               | `true`                                                      |
| `browser.executablePath`         | المسار إلى ملف تنفيذي لمتصفح قائم على Chromium (Chrome/Brave/Edge/Chromium) | يُكتشف تلقائيًا (يفضّل المتصفح الافتراضي عندما يكون قائمًا على Chromium) |
| `browser.headless`               | التشغيل بدون واجهة رسومية                                                      | `false`                                                     |
| `OPENCLAW_BROWSER_HEADLESS`      | تجاوز لكل عملية لوضع headless في المتصفح المحلي المُدار         | غير معيّن                                                       |
| `browser.noSandbox`              | إضافة علامة `--no-sandbox` (مطلوبة لبعض إعدادات Linux)               | `false`                                                     |
| `browser.attachOnly`             | عدم تشغيل المتصفح، والإرفاق بالموجود فقط                        | `false`                                                     |
| `browser.cdpPort`                | منفذ Chrome DevTools Protocol                                        | `18800`                                                     |
| `browser.localLaunchTimeoutMs`   | مهلة اكتشاف Chrome المحلي المُدار                               | `15000`                                                     |
| `browser.localCdpReadyTimeoutMs` | مهلة جاهزية CDP بعد تشغيل Chrome المحلي المُدار                      | `8000`                                                      |

على Raspberry Pi أو مضيفي VPS الأقدم أو التخزين البطيء، ارفع
`browser.localLaunchTimeoutMs` عندما يحتاج Chrome إلى وقت أطول لكشف نقطة نهاية CDP HTTP
الخاصة به. ارفع `browser.localCdpReadyTimeoutMs` عندما ينجح التشغيل لكن
`openclaw browser start` لا يزال يبلغ عن `not reachable after start`. يجب أن تكون القيم
أعدادًا صحيحة موجبة حتى `120000` مللي ثانية؛ تُرفض قيم الإعدادات غير الصالحة.

### المشكلة: "No Chrome tabs found for profile=\"user\""

أنت تستخدم ملفًا شخصيًا من نوع `existing-session` / Chrome MCP. يستطيع OpenClaw رؤية Chrome المحلي،
لكن لا توجد تبويبات مفتوحة متاحة للإرفاق بها.

خيارات الإصلاح:

1. **استخدم المتصفح المُدار:** `openclaw browser start --browser-profile openclaw`
   (أو اضبط `browser.defaultProfile: "openclaw"`).
2. **استخدم Chrome MCP:** تأكد من أن Chrome المحلي يعمل مع تبويب مفتوح واحد على الأقل، ثم أعد المحاولة باستخدام `--browser-profile user`.

ملاحظات:

- `user` خاص بالمضيف فقط. بالنسبة إلى خوادم Linux أو الحاويات أو المضيفين البعيدين، فضّل ملفات CDP الشخصية.
- تحتفظ ملفات `user` / ملفات `existing-session` الأخرى بالقيود الحالية لـ Chrome MCP:
  إجراءات موجّهة بالمراجع، وخطافات تحميل ملف واحد، ودون تجاوزات لمهلة الحوارات، ودون
  `wait --load networkidle`، ودون `responsebody`، أو تصدير PDF، أو اعتراض التنزيلات،
  أو إجراءات دفعية.
- تعيّن ملفات `openclaw` المحلية `cdpPort`/`cdpUrl` تلقائيًا؛ لا تضبط هذه إلا لـ CDP البعيد.
- تقبل ملفات CDP البعيدة `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) لاكتشاف `/json/version`، أو WS(S) عندما تمنحك خدمة المتصفح
  عنوان URL مباشرًا لمقبس DevTools.

## ذو صلة

- [المتصفح](/ar/tools/browser)
- [تسجيل دخول المتصفح](/ar/tools/browser-login)
- [استكشاف أخطاء Browser WSL2 وإصلاحها](/ar/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
