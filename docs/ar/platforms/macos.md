---
read_when:
    - تنفيذ ميزات تطبيق macOS
    - تغيير دورة حياة Gateway أو تجسير Node على macOS
summary: تطبيق OpenClaw المرافق على macOS (شريط القوائم + وسيط Gateway)
title: تطبيق macOS
x-i18n:
    generated_at: "2026-06-27T17:59:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e637a1ae5ca66dfb6255fb6a233436ae0cf04b972f96446e8dc3d703486c9fa
    source_path: platforms/macos.md
    workflow: 16
---

تطبيق macOS هو **رفيق شريط القوائم** لـ OpenClaw. يتولى الأذونات،
ويدير Gateway محليًا أو يتصل به (عبر launchd أو يدويًا)، ويعرض قدرات macOS
للوكيل على هيئة Node.

## ما الذي يفعله

- يعرض الإشعارات الأصلية والحالة في شريط القوائم.
- يتولى مطالبات TCC (الإشعارات، إمكانية الوصول، تسجيل الشاشة، الميكروفون،
  التعرف على الكلام، الأتمتة/AppleScript).
- يشغّل Gateway أو يتصل به (محليًا أو عن بُعد).
- يعرض أدوات خاصة بـ macOS فقط (Canvas، Camera، Screen Recording، `system.run`).
- يبدأ خدمة مضيف Node المحلي في وضع **remote** (launchd)، ويوقفها في وضع **local**.
- يستضيف **PeekabooBridge** اختياريًا لأتمتة واجهة المستخدم.
- يثبّت CLI العام (`openclaw`) عند الطلب عبر npm أو pnpm أو bun (يفضل التطبيق npm، ثم pnpm، ثم bun؛ يظل Node هو وقت التشغيل الموصى به لـ Gateway).

## الوضع المحلي مقابل الوضع البعيد

- **محلي** (الافتراضي): يتصل التطبيق بـ Gateway محلي قيد التشغيل إن وُجد؛
  وإلا فيفعّل خدمة launchd عبر `openclaw gateway install`.
- **بعيد**: يتصل التطبيق بـ Gateway عبر SSH/Tailscale ولا يبدأ
  أي عملية محلية.
  يبدأ التطبيق **خدمة مضيف Node** المحلية حتى يتمكن Gateway البعيد من الوصول إلى هذا Mac.
  لا يشغّل التطبيق Gateway كعملية فرعية.
  يفضّل اكتشاف Gateway الآن أسماء Tailscale MagicDNS على عناوين IP الخام لشبكة tailnet،
  لذلك يتعافى تطبيق Mac بموثوقية أكبر عندما تتغير عناوين IP في tailnet.

## التحكم في launchd

يدير التطبيق LaunchAgent لكل مستخدم بالوسم `ai.openclaw.gateway`
(أو `ai.openclaw.<profile>` عند استخدام `--profile`/`OPENCLAW_PROFILE`؛ ما زال `com.openclaw.*` القديم يُفرّغ).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

استبدل الوسم بـ `ai.openclaw.<profile>` عند تشغيل ملف تعريف مسمى.

إذا لم يكن LaunchAgent مثبّتًا، ففعّله من التطبيق أو شغّل
`openclaw gateway install`.

إذا كان Gateway يختفي مرارًا لدقائق أو ساعات ولا يستأنف إلا عندما تلمس واجهة التحكم أو تدخل إلى المضيف عبر SSH، فراجع ملاحظة استكشاف الأخطاء وإصلاحها حول سكون صيانة macOS / أعطال `ENETDOWN` وبوابة حماية إعادة التشغيل في launchd ضمن [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#macos-gateway-silently-stops-responding-then-resumes-when-you-touch-the-dashboard).

## قدرات Node (mac)

يقدم تطبيق macOS نفسه كـ Node. أوامر شائعة:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

يبلّغ Node عن خريطة `permissions` حتى تتمكن الوكلاء من تحديد ما هو مسموح.

خدمة Node + IPC للتطبيق:

- عندما تكون خدمة مضيف Node بدون واجهة قيد التشغيل (وضع remote)، تتصل بـ Gateway WS كـ Node.
- ينفّذ `system.run` في تطبيق macOS (سياق UI/TCC) عبر مقبس Unix محلي؛ تبقى المطالبات والمخرجات داخل التطبيق.

المخطط (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## موافقات التنفيذ (system.run)

يتحكم **موافقات التنفيذ** في تطبيق macOS بـ `system.run` (الإعدادات → موافقات التنفيذ).
تُخزّن إعدادات الأمان والسؤال وقائمة السماح محليًا على Mac في:

```
~/.openclaw/exec-approvals.json
```

مثال:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

ملاحظات:

- إدخالات `allowlist` هي أنماط glob لمسارات الملفات الثنائية المحلولة، أو أسماء أوامر مجردة للأوامر المستدعاة عبر PATH.
- نص أمر shell الخام الذي يحتوي على تحكم shell أو صيغة توسعة (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) يُعامل كفشل في قائمة السماح ويتطلب موافقة صريحة (أو السماح بملف shell الثنائي).
- اختيار "السماح دائمًا" في المطالبة يضيف ذلك الأمر إلى قائمة السماح.
- تُرشّح تجاوزات بيئة `system.run` (تُسقط `PATH`, `DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`) ثم تُدمج مع بيئة التطبيق.
- بالنسبة إلى أغلفة shell (`bash|sh|zsh ... -c/-lc`)، تُختزل تجاوزات البيئة المحددة بنطاق الطلب إلى قائمة سماح صريحة صغيرة (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- بالنسبة إلى قرارات السماح دائمًا في وضع قائمة السماح، تستبقي أغلفة التوجيه المعروفة (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) مسارات الملفات التنفيذية الداخلية بدلًا من مسارات الأغلفة. إذا لم يكن فك التغليف آمنًا، فلا يُستبقى أي إدخال في قائمة السماح تلقائيًا.

## الروابط العميقة

يسجل التطبيق مخطط URL `openclaw://` للإجراءات المحلية.

### `openclaw://agent`

يشغّل طلب `agent` في Gateway.
__OC_I18N_900004__
معلمات الاستعلام:

- `message` (مطلوب)
- `sessionKey` (اختياري)
- `thinking` (اختياري)
- `deliver` / `to` / `channel` (اختياري)
- `timeoutSeconds` (اختياري)
- `key` (مفتاح وضع غير مراقب اختياري)

السلامة:

- بدون `key`، يطلب التطبيق التأكيد.
- بدون `key`، يفرض التطبيق حدًا قصيرًا لطول الرسالة في مطالبة التأكيد ويتجاهل `deliver` / `to` / `channel`.
- مع `key` صالح، يعمل التشغيل دون مراقبة (مخصص للأتمتة الشخصية).

## مسار الإعداد الأولي (النموذجي)

1. ثبّت **OpenClaw.app** وشغّله.
2. أكمل قائمة تحقق الأذونات (مطالبات TCC).
3. تأكد من أن وضع **محلي** نشط وأن Gateway قيد التشغيل.
4. ثبّت CLI إذا أردت الوصول من الطرفية.

## موضع مجلد الحالة (macOS)

تجنب وضع مجلد حالة OpenClaw في iCloud أو مجلدات أخرى متزامنة مع السحابة.
يمكن للمسارات المدعومة بالمزامنة أن تضيف زمن استجابة وتتسبب أحيانًا في سباقات قفل/مزامنة ملفات
للجلسات وبيانات الاعتماد.

يفضّل استخدام مسار حالة محلي غير متزامن مثل:
__OC_I18N_900005__
إذا اكتشف `openclaw doctor` حالة ضمن:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

فسيحذّر ويوصي بالعودة إلى مسار محلي.

## سير عمل البناء والتطوير (أصلي)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (أو Xcode)
- حزم التطبيق: `scripts/package-mac-app.sh`

## تصحيح اتصال Gateway (CLI في macOS)

استخدم CLI التصحيح لاختبار نفس مصافحة Gateway WebSocket ومنطق الاكتشاف
اللذين يستخدمهما تطبيق macOS، دون تشغيل التطبيق.
__OC_I18N_900006__
خيارات الاتصال:

- `--url <ws://host:port>`: تجاوز الإعداد
- `--mode <local|remote>`: الحل من الإعداد (الافتراضي: الإعداد أو المحلي)
- `--probe`: فرض فحص صحة جديد
- `--timeout <ms>`: مهلة الطلب (الافتراضي: `15000`)
- `--json`: مخرجات منظمة للمقارنة

خيارات الاكتشاف:

- `--include-local`: تضمين بوابات Gateway التي كانت ستُرشّح باعتبارها "محلية"
- `--timeout <ms>`: نافذة الاكتشاف الإجمالية (الافتراضي: `2000`)
- `--json`: مخرجات منظمة للمقارنة

<Tip>
قارن مع `openclaw gateway discover --json` لمعرفة ما إذا كان مسار اكتشاف تطبيق macOS (`local.` بالإضافة إلى نطاق النطاق الواسع المكوّن، مع بدائل احتياطية للنطاق الواسع وTailscale Serve) يختلف عن اكتشاف CLI الخاص بـ Node المستند إلى `dns-sd`.
</Tip>

## توصيل الاتصال البعيد (أنفاق SSH)

عندما يعمل تطبيق macOS في وضع **بعيد**، يفتح نفق SSH حتى تتمكن مكونات واجهة المستخدم المحلية
من التحدث إلى Gateway بعيد كما لو كان على localhost.

### نفق التحكم (منفذ Gateway WebSocket)

- **الغرض:** فحوصات الصحة، الحالة، دردشة الويب، الإعداد، واستدعاءات مستوى التحكم الأخرى.
- **المنفذ المحلي:** منفذ Gateway (الافتراضي `18789`)، ثابت دائمًا.
- **المنفذ البعيد:** منفذ Gateway نفسه على المضيف البعيد.
- **السلوك:** لا يوجد منفذ محلي عشوائي؛ يعيد التطبيق استخدام نفق صحي موجود
  أو يعيد تشغيله عند الحاجة.
- **شكل SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` مع BatchMode +
  ExitOnForwardFailure + خيارات keepalive.
- **الإبلاغ عن IP:** يستخدم نفق SSH loopback، لذلك سيرى Gateway عنوان IP الخاص بـ Node
  كـ `127.0.0.1`. استخدم نقل **مباشر (ws/wss)** إذا أردت ظهور عنوان IP الحقيقي للعميل
  (راجع [الوصول البعيد إلى macOS](/ar/platforms/mac/remote)).

لخطوات الإعداد، راجع [الوصول البعيد إلى macOS](/ar/platforms/mac/remote). لتفاصيل البروتوكول،
راجع [بروتوكول Gateway](/ar/gateway/protocol).

## مستندات ذات صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [Gateway (macOS)](/ar/platforms/mac/bundled-gateway)
- [أذونات macOS](/ar/platforms/mac/permissions)
- [Canvas](/ar/platforms/mac/canvas)
