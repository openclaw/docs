---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: إصلاح مشكلات بدء تشغيل CDP في Chrome/Brave/Edge/Chromium للتحكم في المتصفح عبر OpenClaw على Linux
title: استكشاف أخطاء المتصفح وإصلاحها
x-i18n:
    generated_at: "2026-07-12T06:31:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e0256e8ee441802086cd486923060be54f8966b423e5dcb71fc8961bbab5d729
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## المشكلة: تعذّر بدء Chrome CDP على المنفذ 18800

```json
{ "error": "Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"." }
```

### السبب الجذري

على Ubuntu ومعظم توزيعات Linux، يثبّت الأمر `apt install chromium` غلاف snap
بدلاً من متصفح فعلي:

```text
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

يتداخل عزل AppArmor الخاص بـ snap مع الطريقة التي يستخدمها OpenClaw لتشغيل
عملية المتصفح ومراقبتها.

أعطال التشغيل الشائعة الأخرى على Linux:

- `The profile appears to be in use by another Chromium process`: ملفات قفل
  `Singleton*` قديمة في دليل ملف التعريف المُدار. يزيل OpenClaw هذه الأقفال
  ويعيد المحاولة مرة واحدة عندما يشير القفل إلى عملية متوقفة أو عملية على
  مضيف مختلف.
- `Missing X server or $DISPLAY`: طُلب متصفح مرئي صراحةً على مضيف لا يحتوي
  على جلسة سطح مكتب. تعود ملفات التعريف المحلية المُدارة إلى الوضع عديم
  الواجهة على Linux عندما لا يكون كل من `DISPLAY` و`WAYLAND_DISPLAY` معيّنًا.
  إذا عيّنت `OPENCLAW_BROWSER_HEADLESS=0` أو `browser.headless: false` أو
  `browser.profiles.<name>.headless: false`، فأزل تجاوز وضع الواجهة هذا، أو
  عيّن `OPENCLAW_BROWSER_HEADLESS=1`، أو شغّل `Xvfb`، أو نفّذ
  `openclaw browser start --headless` لعملية تشغيل مُدارة لمرة واحدة، أو شغّل
  OpenClaw ضمن جلسة سطح مكتب فعلية.

### الحل 1: تثبيت Google Chrome (موصى به)

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # إذا كانت هناك أخطاء في التبعيات
```

حدّث `~/.openclaw/openclaw.json`:

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

### الحل 2: استخدام Chromium من snap في وضع الإرفاق فقط

إذا كان عليك الاحتفاظ بـ Chromium من snap، فاضبط OpenClaw ليتصل بمتصفح
مشغّل يدويًا بدلاً من تشغيله:

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

شغّل Chromium يدويًا:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

يمكنك اختياريًا تشغيله تلقائيًا باستخدام خدمة مستخدم systemd:

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

```bash
systemctl --user enable --now openclaw-browser.service
```

### التحقق من عمل المتصفح

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### مرجع الإعدادات

| الخيار                           | الوصف                                                                       | القيمة الافتراضية                                                          |
| -------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `browser.enabled`                | تفعيل التحكم في المتصفح                                                     | `true`                                                                      |
| `browser.executablePath`         | مسار ملف متصفح تنفيذي مستند إلى Chromium ‏(Chrome/Brave/Edge/Chromium)      | يُكتشف تلقائيًا (مع تفضيل متصفح نظام التشغيل الافتراضي إذا كان مستندًا إلى Chromium) |
| `browser.headless`               | التشغيل دون واجهة رسومية                                                    | `false`                                                                     |
| `OPENCLAW_BROWSER_HEADLESS`      | تجاوز لكل عملية لوضع المتصفح المحلي المُدار عديم الواجهة                    | غير معيّن                                                                   |
| `browser.noSandbox`              | إضافة العلامة `--no-sandbox` (مطلوبة لبعض إعدادات Linux)                    | `false`                                                                     |
| `browser.attachOnly`             | عدم تشغيل متصفح؛ الاتصال بمتصفح موجود فقط                                   | `false`                                                                     |
| `browser.cdpPortRangeStart`      | منفذ CDP المحلي الأول لملفات التعريف التي تُسند منافذها تلقائيًا            | `18800` (مشتق من منفذ Gateway)                                              |
| `browser.localLaunchTimeoutMs`   | مهلة اكتشاف Chrome المحلي المُدار، حتى `120000`                              | `15000`                                                                     |
| `browser.localCdpReadyTimeoutMs` | مهلة انتظار جاهزية CDP بعد التشغيل المحلي المُدار، حتى `120000`             | `8000`                                                                      |

يجب أن تكون قيمتا المهلة عددين صحيحين موجبين لا يتجاوزان `120000` مللي ثانية؛
وتُرفض القيم الأخرى عند تحميل الإعدادات. على Raspberry Pi أو مضيفات VPS
الأقدم أو وحدات التخزين البطيئة، ارفع `browser.localLaunchTimeoutMs` عندما
يحتاج Chrome إلى مزيد من الوقت لإتاحة نقطة نهاية HTTP الخاصة بـ CDP. ارفع
`browser.localCdpReadyTimeoutMs` عندما ينجح التشغيل، لكن يظل
`openclaw browser start` يعرض `not reachable after start`.

### المشكلة: لم يُعثر على علامات تبويب Chrome لملف التعريف `profile="user"`

أنت تستخدم ملف التعريف `user` ‏(`existing-session` / Chrome MCP)، ولا توجد
علامات تبويب مفتوحة يمكن الاتصال بها.

خيارات الإصلاح:

1. استخدم المتصفح المُدار بدلاً من ذلك:
   `openclaw browser --browser-profile openclaw start` (أو عيّن
   `browser.defaultProfile: "openclaw"`).
2. أبقِ Chrome المحلي قيد التشغيل مع علامة تبويب مفتوحة واحدة على الأقل، ثم
   أعد المحاولة باستخدام `--browser-profile user`.

ملاحظات:

- ملف التعريف `user` مخصص للمضيف فقط. على خوادم Linux أو الحاويات أو
  المضيفات البعيدة، يُفضّل استخدام ملفات تعريف CDP بدلاً منه.
- يشترك `user` وملفات تعريف `existing-session` الأخرى في القيود الحالية
  لـ Chrome MCP: الإجراءات المعتمدة على المراجع فقط، وملف واحد لكل عملية
  رفع، وعدم السماح بتجاوزات `timeoutMs` لمربعات الحوار، وعدم دعم
  `wait --load networkidle`، وكذلك عدم دعم `responsebody` أو تصدير PDF أو
  اعتراض التنزيلات أو الإجراءات المجمّعة.
- تُسند ملفات تعريف برنامج التشغيل المحلي `openclaw` قيمتي
  `cdpPort` و`cdpUrl` تلقائيًا؛ لا تضبطهما يدويًا إلا لـ CDP البعيد.
- تقبل ملفات تعريف CDP البعيدة البروتوكولات `http://` و`https://` و`ws://`
  و`wss://`. استخدم HTTP(S) لاكتشاف `/json/version`، أو WS(S) عندما توفر
  خدمة المتصفح عنوان URL مباشرًا لمقبس DevTools.

## ذو صلة

- [المتصفح](/ar/tools/browser)
- [تسجيل الدخول إلى المتصفح](/ar/tools/browser-login)
- [استكشاف أخطاء المتصفح في WSL2 وإصلاحها](/ar/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
