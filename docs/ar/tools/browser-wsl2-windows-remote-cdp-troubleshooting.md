---
read_when:
    - تشغيل OpenClaw Gateway في WSL2 بينما يعمل Chrome على Windows
    - ظهور أخطاء متداخلة في المتصفح/واجهة التحكم عبر WSL2 وWindows
    - الاختيار بين Chrome MCP المحلي للمضيف وCDP البعيد الخام في إعدادات المضيف المنفصل
summary: استكشاف أخطاء Gateway في WSL2 واتصال CDP البعيد بمتصفح Chrome على Windows وإصلاحها على مراحل
title: استكشاف أخطاء WSL2 وWindows وChrome CDP البعيد وإصلاحها
x-i18n:
    generated_at: "2026-07-12T06:39:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be6d9af2b3efb23be22a5ed6e6645348ddc53e6f997280410fa3e00bb44d8b6d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

في إعداد المضيفين المنفصلين الشائع، يعمل OpenClaw Gateway داخل WSL2، ويعمل Chrome
على Windows، ويجب أن يعبر التحكم في المتصفح حدود WSL2/Windows. قد تظهر عدة
مشكلات مستقلة في الوقت نفسه (راجع
[المشكلة رقم 39369](https://github.com/openclaw/openclaw/issues/39369)): فقد يفشل كل من نقل CDP
وأمان أصل Control UI والرمز المميز/الاقتران
بشكل مستقل، مع إنتاج أخطاء متشابهة ظاهريًا. افحص الطبقات
أدناه بالترتيب بدلًا من تخمين أيّها معطّل.

## اختر وضع المتصفح الصحيح أولًا

### الخيار 1: اتصال CDP خام عن بُعد من WSL2 إلى Windows

استخدم ملف تعريف لمتصفح بعيد يشير من WSL2 إلى نقطة نهاية CDP
في Chrome على Windows. اختر هذا عندما يبقى Gateway داخل WSL2، ويعمل Chrome على
Windows، ويحتاج التحكم في المتصفح إلى عبور حدود WSL2/Windows.

### الخيار 2: Chrome MCP محلي على المضيف

استخدم برنامج التشغيل `existing-session` (ملف التعريف `user`) فقط عندما يعمل Gateway
على المضيف نفسه الذي يعمل عليه Chrome، وتريد حالة المتصفح المحلي المسجّل دخوله، ولا
تحتاج إلى نقل المتصفح عبر المضيفين، ولا تحتاج إلى `responsebody`،
أو تصدير PDF، أو اعتراض التنزيلات، أو الإجراءات الدفعية (ملفات تعريف Chrome MCP لا
تدعم هذه الميزات).

عند استخدام Gateway داخل WSL2 مع Chrome على Windows، استخدم CDP الخام عن بُعد. يعمل Chrome MCP
محليًا على المضيف، وليس جسرًا من WSL2 إلى Windows.

## البنية العاملة

- يشغّل WSL2‏ Gateway على `127.0.0.1:18789`
- يفتح Windows‏ Control UI في متصفح عادي على `http://127.0.0.1:18789/`
- يعرض Chrome على Windows نقطة نهاية CDP على المنفذ `9222`
- يستطيع WSL2 الوصول إلى نقطة نهاية CDP تلك على Windows
- يوجّه OpenClaw ملف تعريف للمتصفح إلى العنوان الذي يمكن الوصول إليه من WSL2

## قاعدة بالغة الأهمية لـ Control UI

عند فتح واجهة المستخدم من Windows، استخدم المضيف المحلي لـ Windows ما لم يكن لديك
إعداد HTTPS مقصود:

```text
http://127.0.0.1:18789/
```

لا تستخدم عنوان IP للشبكة المحلية افتراضيًا. قد يؤدي HTTP العادي على عنوان شبكة محلية أو
عنوان tailnet إلى سلوك متعلق بأصل غير آمن/مصادقة الجهاز لا علاقة له بـ CDP نفسه. راجع
[Control UI](/ar/web/control-ui).

## التحقق حسب الطبقات

اعمل من الأعلى إلى الأسفل؛ ولا تتجاوز أي طبقة. قد يؤدي إصلاح طبقة واحدة إلى بقاء
خطأ مختلف ظاهرًا من طبقة أدنى.

### الطبقة 1: تحقق من أن Chrome يقدّم CDP على Windows

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\OpenClaw\ChromeCDP"
```

يتجاهل Chrome 136 والإصدارات الأحدث مفاتيح سطر أوامر تصحيح الأخطاء عن بُعد عند استخدام
دليل بيانات Chrome الافتراضي. استخدم دليل بيانات منفصلًا وغير افتراضي كما
هو موضح أعلاه. راجع
[تغيير أمان تصحيح الأخطاء عن بُعد في Chrome](https://developer.chrome.com/blog/remote-debugging-port).
لا يجعل هذا ملف تعريف Chrome العادي المسجّل دخوله قابلًا للتحكم عن بُعد.

تحقق أولًا من Chrome نفسه من Windows:

```powershell
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://127.0.0.1:9222/json/list
```

إذا فشل ذلك، فشخّص مستمعي Windows أدناه. لا تكمن المشكلة في OpenClaw
حتى الآن.

#### شخّص IPv4 وIPv6 قبل تغيير portproxy

يحاول Chromium ربط تصحيح الأخطاء عن بُعد بـ `127.0.0.1` أولًا، ثم ينتقل إلى
`[::1]` فقط إذا فشل ربط IPv4. يمكن لقاعدة `v4tov4` دائمة تستمع على
`127.0.0.1:9222` أن تشغل نقطة النهاية تلك قبل بدء Chrome. عندئذٍ ينتقل Chrome
إلى `[::1]:9222`، بينما تعيد القاعدة القديمة توجيه حركة مرور IPv4 إلى
مستمعها نفسه وتعيد ردًا فارغًا.

تحقق من المستمعين الفعليين وقواعد الوكيل من Windows بدلًا من استنتاجها
من إصدار Chrome:

```powershell
netstat -ano | findstr :9222
netsh interface portproxy show all
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://[::1]:9222/json/version
```

استخدم `tasklist /fi "PID eq <PID>"` لكل PID من `netstat`.

- إذا استجاب `chrome.exe` على `127.0.0.1`، فأزل أي قاعدة portproxy تستمع أيضًا
  على `127.0.0.1:9222`. وجّه فقط عنوان محوّل Windows الذي يمكن لـ WSL2
  الوصول إليه إلى `127.0.0.1`.
- إذا استجاب `chrome.exe` على `[::1]` فقط، فوجّه المستمع الذي يمكن لـ WSL2 الوصول إليه
  نحو `::1` باستخدام `v4tov6` بدلًا من التوجيه إلى عنوان IPv4 غير مستخدم:

  ```powershell
  netsh interface portproxy add v4tov6 listenaddress=WINDOWS_HOST_OR_IP listenport=9222 connectaddress=::1 connectport=9222
  ```

اربط المستمع بعنوان المحوّل الذي يحتاج إليه WSL2. لا تعرض منفذ CDP
على `0.0.0.0` أو عنوان شبكة محلية أو عنوان tailnet: يمنح CDP التحكم في
جلسة المتصفح.

### الطبقة 2: تحقق من قدرة WSL2 على الوصول إلى نقطة نهاية Windows تلك

من WSL2، اختبر العنوان نفسه الذي تنوي استخدامه في `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

النتيجة السليمة:

- يعيد `/json/version` بيانات JSON تتضمن بيانات Browser / Protocol-Version الوصفية
- يعيد `/json/list` بيانات JSON (لا بأس بالمصفوفة الفارغة إذا لم تكن هناك صفحات مفتوحة)

إذا فشل ذلك، فإن Windows لم يعرض المنفذ لـ WSL2 بعد، أو أن العنوان
غير صحيح من جهة WSL2، أو أن جدار الحماية/إعادة توجيه المنفذ/الوكالة غير متوفر. أصلح
ذلك قبل تعديل إعدادات OpenClaw.

### الطبقة 3: اضبط ملف تعريف المتصفح الصحيح

وجّه OpenClaw إلى العنوان الذي يمكن الوصول إليه من WSL2:

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

- استخدم العنوان الذي يمكن لـ WSL2 الوصول إليه، وليس عنوانًا يعمل على Windows فقط
- أبقِ `attachOnly: true` للمتصفحات المُدارة خارجيًا
- يمكن أن يستخدم `cdpUrl` أحد البروتوكولات `http://` أو `https://` أو `ws://` أو `wss://`
- استخدم HTTP(S) عندما تريد من OpenClaw اكتشاف `/json/version`
- استخدم WS(S) فقط عندما يزوّدك موفّر المتصفح بعنوان URL مباشر لمقبس DevTools
- اختبر عنوان URL نفسه باستخدام `curl` قبل توقع نجاح OpenClaw

### الطبقة 4: تحقق من طبقة Control UI بصورة منفصلة

افتح `http://127.0.0.1:18789/` من Windows، ثم تحقق مما يلي:

- تطابق أصل الصفحة مع ما يتوقعه `gateway.controlUi.allowedOrigins`
- ضبط مصادقة الرمز المميز أو الاقتران بصورة صحيحة
- أنك لا تشخّص مشكلة مصادقة في Control UI وكأنها مشكلة في المتصفح

صفحة مفيدة: [Control UI](/ar/web/control-ui).

### الطبقة 5: تحقق من التحكم في المتصفح من البداية إلى النهاية

من WSL2:

```bash
openclaw browser --browser-profile remote open https://example.com
openclaw browser --browser-profile remote tabs
```

النتيجة السليمة:

- تُفتح علامة التبويب في Chrome على Windows
- يعيد `browser tabs` الهدف
- تعمل الإجراءات اللاحقة (`snapshot` و`screenshot` و`navigate`) من ملف التعريف
  نفسه

## أخطاء شائعة مضللة

| الرسالة                                                                                 | المعنى                                                                                                                                                                           |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control-ui-insecure-auth`                                                              | مشكلة في أصل واجهة المستخدم/السياق الآمن، وليست مشكلة في نقل CDP                                                                                                                |
| `token_missing`                                                                         | مشكلة في إعداد المصادقة                                                                                                                                                           |
| `pairing required`                                                                      | مشكلة في الموافقة على الجهاز                                                                                                                                                      |
| `Remote CDP for profile "remote" is not reachable`                                      | لا يستطيع WSL2 الوصول إلى `cdpUrl` المضبوط                                                                                                                                        |
| رد CDP فارغ / `other side closed` عبر portproxy                                         | عدم تطابق في مستمع Windows أو حلقة ذاتية؛ افحص كلتا عائلتي الاسترجاع الحلقي و`netsh interface portproxy show all`                                                               |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable` | استجابت نقطة نهاية HTTP، لكن تعذر فتح WebSocket الخاص بـ DevTools                                                                                                                |
| بقاء إعدادات قديمة لإطار العرض/الوضع الداكن/اللغة/وضع عدم الاتصال بعد جلسة بعيدة       | شغّل `openclaw browser --browser-profile remote stop` لإغلاق الجلسة وتحرير اتصال Playwright/CDP المخزّن مؤقتًا دون إعادة تشغيل Gateway أو المتصفح الخارجي                         |
| انتهاء المهلة حول `remoteCdpTimeoutMs` (القيمة الافتراضية 1500ms)                      | غالبًا ما تزال المشكلة في إمكانية الوصول إلى CDP، أو في نقطة نهاية بعيدة بطيئة/يتعذر الوصول إليها                                                                               |
| `Playwright page enumeration timed out after 3000ms`                                    | اتصل CDP البعيد، لكن قراءة علامات التبويب الدائمة توقفت؛ تكون المهلة هي القيمة الأكبر بين `remoteCdpTimeoutMs` و`remoteCdpHandshakeTimeoutMs`                                   |
| `No Chrome tabs found for profile="user"`                                               | تم اختيار ملف تعريف Chrome MCP محلي حيث لا تتوفر علامات تبويب محلية على المضيف                                                                                                  |

## قائمة تحقق سريعة للتشخيص

1. على Windows: أيٌّ من `127.0.0.1` أو `[::1]` يستجيب على `/json/version`، وهل
   ينتمي ذلك المستمع إلى `chrome.exe`؟
2. على WSL2: هل يعمل `curl http://WINDOWS_HOST_OR_IP:9222/json/version`؟
3. إعداد OpenClaw: هل يستخدم `browser.profiles.<name>.cdpUrl` ذلك العنوان نفسه
   الذي يمكن لـ WSL2 الوصول إليه؟
4. Control UI: هل تفتح `http://127.0.0.1:18789/` بدلًا من عنوان IP للشبكة المحلية؟
5. هل تحاول استخدام `existing-session` عبر WSL2 وWindows بدلًا
   من CDP الخام عن بُعد؟

تحقق أولًا من نقطة نهاية Chrome على Windows محليًا، ثم تحقق من نقطة النهاية نفسها
من WSL2، وبعد ذلك فقط شخّص إعداد OpenClaw أو مصادقة Control UI.

## ذو صلة

- [المتصفح](/ar/tools/browser)
- [تسجيل الدخول إلى المتصفح](/ar/tools/browser-login)
- [استكشاف أخطاء المتصفح على Linux وإصلاحها](/ar/tools/browser-linux-troubleshooting)
