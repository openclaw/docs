---
read_when:
    - تشغيل OpenClaw Gateway في WSL2 بينما يعمل Chrome على Windows
    - ظهور أخطاء متداخلة في المتصفح/control-ui عبر WSL2 وWindows
    - الاختيار بين Chrome MCP المحلي على المضيف وCDP البعيد الخام في الإعدادات ذات المضيفين المنفصلين
summary: استكشاف أخطاء Gateway WSL2 + CDP البعيد في Chrome على Windows وإصلاحها على طبقات
title: استكشاف أخطاء WSL2 + Windows + Chrome CDP البعيد وإصلاحها
x-i18n:
    generated_at: "2026-04-30T08:28:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7532c672f7e829b851d175d93354fc586baecea4af5f2555f57908780cedfd02
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

في إعداد المضيف المنقسم الشائع، يعمل OpenClaw Gateway داخل WSL2، ويعمل Chrome على Windows، ويجب أن يعبر التحكم في المتصفح الحد الفاصل بين WSL2 وWindows. يعني نمط الفشل الطبقي من [المشكلة #39369](https://github.com/openclaw/openclaw/issues/39369) أن عدة مشكلات مستقلة يمكن أن تظهر في الوقت نفسه، مما يجعل الطبقة الخطأ تبدو معطلة أولا.

## اختر وضع المتصفح الصحيح أولا

لديك نمطان صالحان:

### الخيار 1: CDP بعيد خام من WSL2 إلى Windows

استخدم ملف متصفح بعيد يشير من WSL2 إلى نقطة نهاية Chrome CDP على Windows.

اختر هذا عندما:

- يبقى Gateway داخل WSL2
- يعمل Chrome على Windows
- تحتاج إلى أن يعبر التحكم في المتصفح حد WSL2/Windows

### الخيار 2: Chrome MCP محلي على المضيف

استخدم `existing-session` / `user` فقط عندما يعمل Gateway نفسه على المضيف نفسه الذي يعمل عليه Chrome.

اختر هذا عندما:

- يكون OpenClaw وChrome على الجهاز نفسه
- تريد حالة المتصفح المحلي المسجل الدخول
- لا تحتاج إلى نقل متصفح عبر المضيفين
- لا تحتاج إلى مسارات متقدمة مدارة أو مخصصة لـ raw-CDP فقط مثل `responsebody`، أو تصدير PDF، أو اعتراض التنزيلات، أو إجراءات الدُفعات

بالنسبة إلى WSL2 Gateway + Windows Chrome، فضّل raw remote CDP. Chrome MCP محلي على المضيف، وليس جسرا من WSL2 إلى Windows.

## البنية العاملة

الشكل المرجعي:

- يشغل WSL2 الـ Gateway على `127.0.0.1:18789`
- يفتح Windows واجهة التحكم في متصفح عادي على `http://127.0.0.1:18789/`
- يعرّض Windows Chrome نقطة نهاية CDP على المنفذ `9222`
- يستطيع WSL2 الوصول إلى نقطة نهاية Windows CDP تلك
- يوجّه OpenClaw ملف متصفح إلى العنوان الذي يمكن الوصول إليه من WSL2

## لماذا هذا الإعداد مربك

يمكن أن تتداخل عدة حالات فشل:

- لا يستطيع WSL2 الوصول إلى نقطة نهاية Windows CDP
- تُفتح واجهة التحكم من أصل غير آمن
- لا يطابق `gateway.controlUi.allowedOrigins` أصل الصفحة
- الرمز أو الاقتران مفقود
- يشير ملف المتصفح إلى العنوان الخطأ

لذلك، قد يترك إصلاح طبقة واحدة خطأ مختلفا ظاهرا.

## قاعدة حاسمة لواجهة التحكم

عندما تُفتح الواجهة من Windows، استخدم localhost الخاص بـ Windows ما لم يكن لديك إعداد HTTPS مقصود.

استخدم:

`http://127.0.0.1:18789/`

لا تجعل عنوان LAN IP هو الافتراضي لواجهة التحكم. يمكن أن يؤدي HTTP العادي على عنوان LAN أو tailnet إلى سلوك أصل غير آمن/مصادقة جهاز لا علاقة له بـ CDP نفسه. راجع [واجهة التحكم](/ar/web/control-ui).

## تحقق على طبقات

اعمل من الأعلى إلى الأسفل. لا تتخطَّ الخطوات.

### الطبقة 1: تحقق من أن Chrome يقدّم CDP على Windows

ابدأ Chrome على Windows مع تفعيل تصحيح الأخطاء عن بُعد:

```powershell
chrome.exe --remote-debugging-port=9222
```

من Windows، تحقق من Chrome نفسه أولا:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

إذا فشل هذا على Windows، فليست المشكلة في OpenClaw بعد.

### الطبقة 2: تحقق من أن WSL2 يستطيع الوصول إلى نقطة نهاية Windows تلك

من WSL2، اختبر العنوان الدقيق الذي تخطط لاستخدامه في `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

نتيجة جيدة:

- يعيد `/json/version` ملف JSON يحتوي على بيانات Browser / Protocol-Version الوصفية
- يعيد `/json/list` ملف JSON (لا بأس بالمصفوفة الفارغة إذا لم تكن هناك صفحات مفتوحة)

إذا فشل هذا:

- لا يعرّض Windows المنفذ لـ WSL2 بعد
- العنوان خطأ من جهة WSL2
- لا يزال جدار الحماية / توجيه المنفذ / الوكيل المحلي مفقودا

أصلح ذلك قبل لمس إعداد OpenClaw.

### الطبقة 3: اضبط ملف المتصفح الصحيح

بالنسبة إلى raw remote CDP، وجّه OpenClaw إلى العنوان الذي يمكن الوصول إليه من WSL2:

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

- استخدم العنوان الذي يمكن لـ WSL2 الوصول إليه، وليس ما يعمل فقط على Windows
- أبقِ `attachOnly: true` للمتصفحات المدارة خارجيا
- يمكن أن يكون `cdpUrl` أحد `http://` أو `https://` أو `ws://` أو `wss://`
- استخدم HTTP(S) عندما تريد من OpenClaw اكتشاف `/json/version`
- استخدم WS(S) فقط عندما يزودك مزود المتصفح بعنوان URL مباشر لمقبس DevTools
- اختبر عنوان URL نفسه باستخدام `curl` قبل توقع نجاح OpenClaw

### الطبقة 4: تحقق من طبقة واجهة التحكم بشكل منفصل

افتح الواجهة من Windows:

`http://127.0.0.1:18789/`

ثم تحقق من:

- أن أصل الصفحة يطابق ما يتوقعه `gateway.controlUi.allowedOrigins`
- أن مصادقة الرمز أو الاقتران مضبوطة بشكل صحيح
- أنك لا تصحح مشكلة مصادقة واجهة التحكم كما لو كانت مشكلة متصفح

صفحة مفيدة:

- [واجهة التحكم](/ar/web/control-ui)

### الطبقة 5: تحقق من التحكم في المتصفح من البداية إلى النهاية

من WSL2:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

نتيجة جيدة:

- تُفتح علامة التبويب في Windows Chrome
- يعيد `openclaw browser tabs` الهدف
- تعمل الإجراءات اللاحقة (`snapshot`، `screenshot`، `navigate`) من الملف نفسه

## أخطاء شائعة مضللة

تعامل مع كل رسالة كدليل خاص بطبقة:

- `control-ui-insecure-auth`
  - مشكلة أصل الواجهة / السياق الآمن، وليست مشكلة نقل CDP
- `token_missing`
  - مشكلة في إعداد المصادقة
- `pairing required`
  - مشكلة موافقة الجهاز
- `Remote CDP for profile "remote" is not reachable`
  - لا يستطيع WSL2 الوصول إلى `cdpUrl` المضبوط
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - استجابت نقطة نهاية HTTP، لكن تعذر فتح DevTools WebSocket
- تجاوزات منفذ عرض / وضع داكن / لغة / اتصال غير متزامنة بعد جلسة بعيدة
  - شغّل `openclaw browser stop --browser-profile remote`
  - يغلق هذا جلسة التحكم النشطة ويحرر حالة محاكاة Playwright/CDP دون إعادة تشغيل Gateway أو المتصفح الخارجي
- `gateway timeout after 1500ms`
  - غالبا ما يزال السبب قابلية الوصول إلى CDP أو نقطة نهاية بعيدة بطيئة/غير قابلة للوصول
- `No Chrome tabs found for profile="user"`
  - تم اختيار ملف Chrome MCP محلي بينما لا توجد علامات تبويب محلية على المضيف متاحة

## قائمة فرز سريعة

1. Windows: هل يعمل `curl http://127.0.0.1:9222/json/version`؟
2. WSL2: هل يعمل `curl http://WINDOWS_HOST_OR_IP:9222/json/version`؟
3. إعداد OpenClaw: هل يستخدم `browser.profiles.<name>.cdpUrl` ذلك العنوان الدقيق القابل للوصول من WSL2؟
4. واجهة التحكم: هل تفتح `http://127.0.0.1:18789/` بدلا من عنوان LAN IP؟
5. هل تحاول استخدام `existing-session` عبر WSL2 وWindows بدلا من raw remote CDP؟

## الخلاصة العملية

عادة ما يكون الإعداد قابلا للعمل. الجزء الصعب هو أن نقل المتصفح، وأمان أصل واجهة التحكم، والرمز/الاقتران يمكن أن يفشل كل منها بشكل مستقل مع أنها تبدو متشابهة من جهة المستخدم.

عند الشك:

- تحقق من نقطة نهاية Windows Chrome محليا أولا
- تحقق من نقطة النهاية نفسها من WSL2 ثانيا
- بعد ذلك فقط صحح إعداد OpenClaw أو مصادقة واجهة التحكم

## ذات صلة

- [المتصفح](/ar/tools/browser)
- [تسجيل الدخول إلى المتصفح](/ar/tools/browser-login)
- [استكشاف أخطاء المتصفح على Linux وإصلاحها](/ar/tools/browser-linux-troubleshooting)
