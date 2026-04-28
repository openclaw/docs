---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: أصلح مشكلات بدء تشغيل CDP في Chrome/Brave/Edge/Chromium للتحكم في متصفح OpenClaw على Linux
title: استكشاف أخطاء المتصفح وإصلاحها
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:40:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e5b42532af002af3d6a3ab21df7f82d2d62ce9f23b57a94cdb97e8ac65df3b
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## المشكلة: "فشل بدء تشغيل Chrome CDP على المنفذ 18800"

يفشل خادم التحكم في المتصفح في OpenClaw في تشغيل Chrome/Brave/Edge/Chromium مع الخطأ التالي:

```text
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### السبب الجذري

على Ubuntu (والعديد من توزيعات Linux)، يكون تثبيت Chromium الافتراضي عبارة عن **حزمة snap**. يتداخل تقييد AppArmor الخاص بـ snap مع الطريقة التي يقوم بها OpenClaw بتشغيل عملية المتصفح ومراقبتها.

يقوم الأمر `apt install chromium` بتثبيت حزمة وهمية تعيد التوجيه إلى snap:

```text
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

هذا **ليس** متصفحًا حقيقيًا — بل هو مجرد غلاف.

إخفاقات التشغيل الشائعة الأخرى على Linux:

- تعني الرسالة `The profile appears to be in use by another Chromium process` أن Chrome
  عثر على ملفات قفل `Singleton*` قديمة في دليل ملف التعريف المُدار. يقوم OpenClaw
  بإزالة هذه الأقفال ويعيد المحاولة مرة واحدة عندما يشير القفل إلى عملية ميتة أو
  إلى عملية على مضيف مختلف.
- تعني الرسالة `Missing X server or $DISPLAY` أنه تم طلب متصفح مرئي صراحةً
  على مضيف لا يحتوي على جلسة سطح مكتب. افتراضيًا، تعود ملفات التعريف المحلية المُدارة الآن
  إلى الوضع بلا واجهة headless على Linux عندما يكون كل من `DISPLAY` و
  `WAYLAND_DISPLAY` غير معيّنين. إذا قمت بتعيين `OPENCLAW_BROWSER_HEADLESS=0`،
  أو `browser.headless: false`، أو `browser.profiles.<name>.headless: false`،
  فأزل هذا التجاوز الخاص بالوضع المرئي، أو عيّن `OPENCLAW_BROWSER_HEADLESS=1`، أو ابدأ `Xvfb`،
  أو شغّل `openclaw browser start --headless` لتشغيل مُدار لمرة واحدة، أو شغّل
  OpenClaw ضمن جلسة سطح مكتب حقيقية.

### الحل 1: تثبيت Google Chrome (موصى به)

ثبّت حزمة Google Chrome الرسمية بصيغة `.deb`، فهي ليست معزولة بواسطة snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # إذا كانت هناك أخطاء في التبعيات
```

ثم حدّث إعدادات OpenClaw (`~/.openclaw/openclaw.json`):

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

إذا كان لا بد من استخدام snap Chromium، فاضبط OpenClaw ليرتبط بمتصفح تم تشغيله يدويًا:

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

2. شغّل Chromium يدويًا:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. يمكنك اختياريًا إنشاء خدمة مستخدم systemd لبدء Chrome تلقائيًا:

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

قم بتمكينها باستخدام: `systemctl --user enable --now openclaw-browser.service`

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

| الخيار | الوصف | الافتراضي |
| -------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`                | تمكين التحكم في المتصفح | `true` |
| `browser.executablePath`         | المسار إلى ملف ثنائي لمتصفح قائم على Chromium ‏(Chrome/Brave/Edge/Chromium) | يُكتشف تلقائيًا (ويُفضّل المتصفح الافتراضي عندما يكون قائمًا على Chromium) |
| `browser.headless`               | التشغيل دون واجهة رسومية | `false` |
| `OPENCLAW_BROWSER_HEADLESS`      | تجاوز على مستوى العملية لوضع المتصفح المحلي المُدار بلا واجهة | غير معيّن |
| `browser.noSandbox`              | إضافة العلامة `--no-sandbox` (مطلوبة لبعض إعدادات Linux) | `false` |
| `browser.attachOnly`             | لا تُشغّل المتصفح، فقط ارتبط بمتصفح موجود | `false` |
| `browser.cdpPort`                | منفذ Chrome DevTools Protocol | `18800` |
| `browser.localLaunchTimeoutMs`   | المهلة الزمنية لاكتشاف Chrome المحلي المُدار | `15000` |
| `browser.localCdpReadyTimeoutMs` | المهلة الزمنية المحلية المُدارة بعد التشغيل لجهوزية CDP | `8000` |

على Raspberry Pi، أو مضيفات VPS الأقدم، أو وسائط التخزين البطيئة، قم بزيادة
`browser.localLaunchTimeoutMs` عندما يحتاج Chrome إلى وقت أطول لإظهار نقطة نهاية CDP HTTP
الخاصة به. قم بزيادة `browser.localCdpReadyTimeoutMs` عندما ينجح التشغيل لكن
`openclaw browser start` ما يزال يبلغ عن `not reachable after start`. يجب أن تكون القيم
أعدادًا صحيحة موجبة حتى `120000` مللي ثانية؛ تُرفض قيم الإعدادات غير الصالحة.

### المشكلة: "No Chrome tabs found for profile=\"user\""

أنت تستخدم ملف تعريف `existing-session` / Chrome MCP. يستطيع OpenClaw رؤية Chrome المحلي،
لكن لا توجد علامات تبويب مفتوحة متاحة للارتباط بها.

خيارات الإصلاح:

1. **استخدم المتصفح المُدار:** `openclaw browser start --browser-profile openclaw`
   (أو عيّن `browser.defaultProfile: "openclaw"`).
2. **استخدم Chrome MCP:** تأكد من أن Chrome المحلي يعمل وبداخله علامة تبويب واحدة على الأقل مفتوحة، ثم أعد المحاولة باستخدام `--browser-profile user`.

ملاحظات:

- `user` خاص بالمضيف فقط. بالنسبة إلى خوادم Linux أو الحاويات أو المضيفات البعيدة، يُفضّل استخدام ملفات تعريف CDP.
- تحتفظ ملفات تعريف `user` / وملفات تعريف `existing-session` الأخرى بقيود Chrome MCP الحالية:
  الإجراءات المعتمدة على المراجع، وخطافات رفع ملف واحد، وعدم وجود تجاوزات لمهلة مربعات الحوار، وعدم وجود
  `wait --load networkidle`، وعدم وجود `responsebody` أو تصدير PDF أو اعتراض التنزيلات
  أو الإجراءات الدفعية.
- تعيّن ملفات تعريف `openclaw` المحلية تلقائيًا `cdpPort`/`cdpUrl`؛ قم بتعيينهما فقط لـ CDP البعيد.
- تقبل ملفات تعريف CDP البعيدة `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) لاكتشاف `/json/version`، أو WS(S) عندما توفّر لك خدمة
  المتصفح عنوان DevTools socket مباشرًا.

## ذو صلة

- [المتصفح](/ar/tools/browser)
- [تسجيل دخول المتصفح](/ar/tools/browser-login)
- [استكشاف أخطاء المتصفح في WSL2 مع Windows CDP البعيد وإصلاحها](/ar/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
