---
read_when:
    - تشغيل OpenClaw Gateway داخل WSL2 بينما يوجد Chrome على Windowsԥсanalysis to=functions.bash даҩ్యcommentary  大发快三是国家{"command":"printf '%s' 'تشغيل OpenClaw Gateway داخل WSL2 بينما يوجد Chrome على Windows'"}
    - رؤية أخطاء متداخلة بين المتصفح وControl UI عبر WSL2 وWindows
    - تحديد الاختيار بين Chrome MCP المحلي على المضيف وCDP البعيد الخام في إعدادات المضيف المنقسم
summary: استكشف أخطاء Gateway في WSL2 + Chrome على Windows عبر CDP البعيد على شكل طبقات
title: استكشاف أخطاء WSL2 + Windows + Chrome عبر CDP البعيد وإصلاحها
x-i18n:
    generated_at: "2026-04-24T08:07:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30c8b94332e74704f85cbce5891b677b264fd155bc180c44044ab600e84018fd
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 15
---

يغطي هذا الدليل إعداد المضيف المنقسم الشائع حيث:

- تعمل OpenClaw Gateway داخل WSL2
- يعمل Chrome على Windows
- يجب أن يعبر التحكم في المتصفح الحد الفاصل بين WSL2 وWindows

كما يغطي نمط الإخفاق الطبقي من [issue #39369](https://github.com/openclaw/openclaw/issues/39369): إذ يمكن أن تظهر عدة مشكلات مستقلة في الوقت نفسه، مما يجعل الطبقة الخاطئة تبدو معطلة أولًا.

## اختر وضع المتصفح الصحيح أولًا

لديك نمطان صالحان:

### الخيار 1: Raw remote CDP من WSL2 إلى Windows

استخدم ملف تعريف متصفح بعيد يشير من WSL2 إلى نقطة نهاية Windows Chrome CDP.

اختر هذا عندما:

- تبقى Gateway داخل WSL2
- يعمل Chrome على Windows
- تحتاج إلى أن يعبر التحكم في المتصفح الحد الفاصل بين WSL2 وWindows

### الخيار 2: Host-local Chrome MCP

استخدم `existing-session` / `user` فقط عندما تعمل Gateway نفسها على المضيف نفسه الذي يعمل عليه Chrome.

اختر هذا عندما:

- يعمل OpenClaw وChrome على الجهاز نفسه
- تريد حالة المتصفح المحلية المسجّل دخولها
- لا تحتاج إلى نقل متصفح عبر مضيفات متعددة
- لا تحتاج إلى مسارات متقدمة متاحة فقط عبر managed/raw-CDP مثل `responsebody` أو
  تصدير PDF أو اعتراض التنزيلات أو الإجراءات الدفعية

بالنسبة إلى Gateway في WSL2 + Chrome على Windows، فضّل raw remote CDP. إن Chrome MCP محلي على المضيف، وليس جسرًا من WSL2 إلى Windows.

## البنية العاملة

الشكل المرجعي:

- يشغّل WSL2 الـ Gateway على `127.0.0.1:18789`
- يفتح Windows Control UI في متصفح عادي على `http://127.0.0.1:18789/`
- يكشف Chrome على Windows نقطة نهاية CDP على المنفذ `9222`
- يستطيع WSL2 الوصول إلى نقطة نهاية CDP الخاصة بـ Windows
- يوجّه OpenClaw ملف تعريف متصفح إلى العنوان القابل للوصول من WSL2

## لماذا يبدو هذا الإعداد مربكًا

يمكن أن تتداخل عدة إخفاقات:

- لا يستطيع WSL2 الوصول إلى نقطة نهاية Windows CDP
- تم فتح Control UI من أصل غير آمن
- لا تطابق `gateway.controlUi.allowedOrigins` أصل الصفحة
- يفتقد token أو pairing
- يشير ملف تعريف المتصفح إلى عنوان خاطئ

ولهذا، فإن إصلاح طبقة واحدة قد يترك خطأ مختلفًا ظاهرًا.

## القاعدة الحرجة الخاصة بـ Control UI

عندما تُفتح UI من Windows، استخدم localhost الخاص بـ Windows ما لم يكن لديك إعداد HTTPS مقصود.

استخدم:

`http://127.0.0.1:18789/`

لا تجعل عنوان LAN هو الخيار الافتراضي لـ Control UI. إذ يمكن أن يؤدي HTTP العادي على عنوان LAN أو tailnet إلى تشغيل سلوك insecure-origin/device-auth لا علاقة له بـ CDP نفسه. راجع [Control UI](/ar/web/control-ui).

## تحقق على شكل طبقات

اعمل من الأعلى إلى الأسفل. لا تتخطَّ أي خطوة.

### الطبقة 1: تحقق من أن Chrome يقدّم CDP على Windows

ابدأ Chrome على Windows مع تفعيل التصحيح البعيد:

```powershell
chrome.exe --remote-debugging-port=9222
```

من Windows، تحقق من Chrome نفسها أولًا:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

إذا فشل هذا على Windows، فالمشكلة ليست في OpenClaw بعد.

### الطبقة 2: تحقق من أن WSL2 تستطيع الوصول إلى نقطة نهاية Windows هذه

من WSL2، اختبر العنوان الدقيق الذي تخطط لاستخدامه في `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

النتيجة الجيدة:

- تعيد `/json/version` JSON يتضمن بيانات Browser / Protocol-Version الوصفية
- تعيد `/json/list` JSON (وتُعد المصفوفة الفارغة مقبولة إذا لم تكن هناك صفحات مفتوحة)

إذا فشل هذا:

- فإن Windows لا تكشف المنفذ بعد إلى WSL2
- أو أن العنوان خاطئ من جهة WSL2
- أو أن الجدار الناري / إعادة توجيه المنافذ / الوصلة المحلية ما تزال مفقودة

أصلح ذلك قبل لمس إعداد OpenClaw.

### الطبقة 3: اضبط ملف تعريف المتصفح الصحيح

بالنسبة إلى raw remote CDP، وجّه OpenClaw إلى العنوان القابل للوصول من WSL2:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

ملاحظات:

- استخدم العنوان القابل للوصول من WSL2، لا ما يعمل فقط على Windows
- أبقِ `attachOnly: true` للمتصفحات المُدارة خارجيًا
- يمكن أن تكون `cdpUrl` من نوع `http://` أو `https://` أو `ws://` أو `wss://`
- استخدم HTTP(S) عندما تريد أن يكتشف OpenClaw القيمة `/json/version`
- استخدم WS(S) فقط عندما يعطيك مزوّد المتصفح عنوان DevTools socket مباشر
- اختبر عنوان URL نفسه باستخدام `curl` قبل أن تتوقع نجاح OpenClaw

### الطبقة 4: تحقق من طبقة Control UI بشكل منفصل

افتح UI من Windows:

`http://127.0.0.1:18789/`

ثم تحقق من:

- أن أصل الصفحة يطابق ما تتوقعه `gateway.controlUi.allowedOrigins`
- أن مصادقة token أو pairing مضبوطة بشكل صحيح
- أنك لا تصحح مشكلة مصادقة في Control UI كما لو كانت مشكلة متصفح

صفحة مفيدة:

- [Control UI](/ar/web/control-ui)

### الطبقة 5: تحقق من التحكم الكامل في المتصفح من البداية إلى النهاية

من WSL2:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

النتيجة الجيدة:

- يُفتح التبويب في Chrome على Windows
- يعيد `openclaw browser tabs` الهدف
- تعمل الإجراءات اللاحقة (`snapshot`, `screenshot`, `navigate`) من ملف التعريف نفسه

## أخطاء شائعة مضللة

تعامل مع كل رسالة على أنها إشارة خاصة بطبقة معينة:

- `control-ui-insecure-auth`
  - مشكلة أصل UI / secure-context، وليست مشكلة نقل CDP
- `token_missing`
  - مشكلة إعداد مصادقة
- `pairing required`
  - مشكلة موافقة جهاز
- `Remote CDP for profile "remote" is not reachable`
  - لا يستطيع WSL2 الوصول إلى `cdpUrl` المُعدّة
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - استجابت نقطة نهاية HTTP، لكن تعذّر مع ذلك فتح DevTools WebSocket
- بقاء تجاوزات viewport / dark-mode / locale / offline بعد جلسة بعيدة
  - شغّل `openclaw browser stop --browser-profile remote`
  - يؤدي هذا إلى إغلاق جلسة التحكم النشطة وتحرير حالة محاكاة Playwright/CDP من دون إعادة تشغيل gateway أو المتصفح الخارجي
- `gateway timeout after 1500ms`
  - غالبًا ما تكون المشكلة ما تزال في قابلية الوصول إلى CDP أو في نقطة نهاية بعيدة بطيئة/غير قابلة للوصول
- `No Chrome tabs found for profile="user"`
  - تم اختيار ملف تعريف Chrome MCP محلي على المضيف حيث لا توجد تبويبات محلية متاحة

## قائمة تحقق سريعة للفرز

1. Windows: هل يعمل `curl http://127.0.0.1:9222/json/version`؟
2. WSL2: هل يعمل `curl http://WINDOWS_HOST_OR_IP:9222/json/version`؟
3. إعداد OpenClaw: هل تستخدم `browser.profiles.<name>.cdpUrl` ذلك العنوان القابل للوصول من WSL2 بالضبط؟
4. Control UI: هل تفتح `http://127.0.0.1:18789/` بدل عنوان LAN؟
5. هل تحاول استخدام `existing-session` عبر WSL2 وWindows بدل raw remote CDP؟

## الخلاصة العملية

يكون الإعداد عادةً قابلًا للتطبيق. الجزء الصعب هو أن نقل المتصفح، وأمان أصل Control UI، وtoken/pairing يمكن أن يفشل كل واحد منها بشكل مستقل مع ظهور متشابه من جهة المستخدم.

عند الشك:

- تحقق من نقطة نهاية Chrome على Windows محليًا أولًا
- ثم تحقق من نقطة النهاية نفسها من WSL2 ثانيًا
- وبعدها فقط صحح إعداد OpenClaw أو مصادقة Control UI

## ذو صلة

- [Browser](/ar/tools/browser)
- [Browser login](/ar/tools/browser-login)
- [استكشاف أخطاء Browser على Linux وإصلاحها](/ar/tools/browser-linux-troubleshooting)
