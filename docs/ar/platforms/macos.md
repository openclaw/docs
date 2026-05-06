---
read_when:
    - تنفيذ ميزات تطبيق macOS
    - تغيير دورة حياة Gateway أو ربط Node على macOS
summary: تطبيق OpenClaw المرافق لـ macOS (شريط القوائم + وسيط Gateway)
title: تطبيق macOS
x-i18n:
    generated_at: "2026-05-06T08:05:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc67a88303073bb771fcec09e7366f710a6bd5500f584f8782232deaa69e599d
    source_path: platforms/macos.md
    workflow: 16
---

تطبيق macOS هو **رفيق شريط القوائم** لـ OpenClaw. يتولى الأذونات،
ويدير/يرتبط بـ Gateway محليا (عبر launchd أو يدويا)، ويعرض إمكانات macOS
للوكيل بصفته Node.

## ما الذي يفعله

- يعرض الإشعارات والحالة الأصلية في شريط القوائم.
- يتولى مطالبات TCC (الإشعارات، إمكانية الوصول، تسجيل الشاشة، الميكروفون،
  التعرف على الكلام، الأتمتة/AppleScript).
- يشغل Gateway أو يتصل به (محليا أو عن بعد).
- يعرض أدوات خاصة بـ macOS فقط (Canvas، Camera، Screen Recording، `system.run`).
- يبدأ خدمة مستضيف Node المحلي في وضع **بعيد** (launchd)، ويوقفها في وضع **محلي**.
- يستضيف **PeekabooBridge** اختياريا لأتمتة واجهة المستخدم.
- يثبت CLI العمومي (`openclaw`) عند الطلب عبر npm أو pnpm أو bun (يفضل التطبيق npm، ثم pnpm، ثم bun؛ ويبقى Node بيئة التشغيل الموصى بها لـ Gateway).

## الوضع المحلي مقابل الوضع البعيد

- **محلي** (الافتراضي): يرتبط التطبيق بـ Gateway محلي قيد التشغيل إذا كان موجودا؛
  وإلا فإنه يفعل خدمة launchd عبر `openclaw gateway install`.
- **بعيد**: يتصل التطبيق بـ Gateway عبر SSH/Tailscale ولا يبدأ أبدا
  عملية محلية.
  يبدأ التطبيق خدمة **مستضيف Node المحلي** كي يتمكن Gateway البعيد من الوصول إلى هذا Mac.
  لا يشغل التطبيق Gateway كعملية فرعية.
  يفضل اكتشاف Gateway الآن أسماء Tailscale MagicDNS على عناوين IP الخام في tailnet،
  لذلك يتعافى تطبيق Mac بموثوقية أكبر عند تغير عناوين IP في tailnet.

## التحكم في launchd

يدير التطبيق LaunchAgent لكل مستخدم بالوسم `ai.openclaw.gateway`
(أو `ai.openclaw.<profile>` عند استخدام `--profile`/`OPENCLAW_PROFILE`؛ ولا يزال `com.openclaw.*` القديم يفرغ).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

استبدل الوسم بـ `ai.openclaw.<profile>` عند تشغيل ملف تعريف مسمى.

إذا لم يكن LaunchAgent مثبتا، ففعله من التطبيق أو شغل
`openclaw gateway install`.

## إمكانات Node (mac)

يقدم تطبيق macOS نفسه بصفته Node. الأوامر الشائعة:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

يبلغ Node عن خريطة `permissions` كي يتمكن الوكلاء من تحديد ما هو مسموح.

خدمة Node + IPC للتطبيق:

- عندما تكون خدمة مستضيف Node عديمة الواجهة قيد التشغيل (الوضع البعيد)، فإنها تتصل بـ Gateway WS بصفة Node.
- ينفذ `system.run` في تطبيق macOS (سياق UI/TCC) عبر مقبس Unix محلي؛ وتبقى المطالبات + المخرجات داخل التطبيق.

المخطط (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## موافقات التنفيذ (system.run)

يتم التحكم في `system.run` عبر **موافقات التنفيذ** في تطبيق macOS (Settings → Exec approvals).
يتم تخزين الأمان + السؤال + قائمة السماح محليا على Mac في:

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

- إدخالات `allowlist` هي أنماط glob لمسارات الثنائيات التي تم حلها، أو أسماء أوامر مجردة للأوامر المستدعاة عبر PATH.
- نص أمر shell الخام الذي يحتوي على تحكم shell أو صيغة توسيع (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) يعامل كتجاوز لقائمة السماح ويتطلب موافقة صريحة (أو إضافة ثنائية shell إلى قائمة السماح).
- اختيار "Always Allow" في المطالبة يضيف ذلك الأمر إلى قائمة السماح.
- تتم تصفية تجاوزات بيئة `system.run` (إسقاط `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) ثم دمجها مع بيئة التطبيق.
- بالنسبة إلى أغلفة shell (`bash|sh|zsh ... -c/-lc`)، يتم تقليل تجاوزات البيئة المحددة بنطاق الطلب إلى قائمة سماح صريحة صغيرة (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- بالنسبة إلى قرارات السماح الدائم في وضع قائمة السماح، تستمر أغلفة الإرسال المعروفة (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) في تخزين مسارات الملفات التنفيذية الداخلية بدلا من مسارات الأغلفة. إذا لم يكن فك التغليف آمنا، فلن يستمر أي إدخال قائمة سماح تلقائيا.

## الروابط العميقة

يسجل التطبيق مخطط URL‏ `openclaw://` للإجراءات المحلية.

### `openclaw://agent`

يشغل طلب `agent` في Gateway.
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
- بدون `key`، يفرض التطبيق حدا قصيرا للرسالة في مطالبة التأكيد ويتجاهل `deliver` / `to` / `channel`.
- مع `key` صالح، يتم التشغيل دون مراقبة (مخصص للأتمتة الشخصية).

## تدفق الإعداد الأولي (نموذجي)

1. ثبت وشغل **OpenClaw.app**.
2. أكمل قائمة تحقق الأذونات (مطالبات TCC).
3. تأكد من أن وضع **محلي** نشط وأن Gateway قيد التشغيل.
4. ثبت CLI إذا كنت تريد الوصول من الطرفية.

## موضع دليل الحالة (macOS)

تجنب وضع دليل حالة OpenClaw في iCloud أو مجلدات أخرى متزامنة مع السحابة.
يمكن للمسارات المدعومة بالمزامنة أن تضيف زمنا كامنا وأن تسبب أحيانا سباقات قفل ملفات/مزامنة
للجلسات وبيانات الاعتماد.

يفضل استخدام مسار حالة محلي غير متزامن مثل:
__OC_I18N_900005__
إذا اكتشف `openclaw doctor` وجود الحالة ضمن:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

فسيحذر ويوصي بالعودة إلى مسار محلي.

## سير عمل البناء والتطوير (أصلي)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (أو Xcode)
- حزم التطبيق: `scripts/package-mac-app.sh`

## تصحيح اتصال Gateway (macOS CLI)

استخدم CLI التصحيح لاختبار مصافحة WebSocket والاكتشاف في Gateway نفسها
المنطق الذي يستخدمه تطبيق macOS، دون تشغيل التطبيق.
__OC_I18N_900006__
خيارات الاتصال:

- `--url <ws://host:port>`: تجاوز الإعدادات
- `--mode <local|remote>`: الحل من الإعدادات (الافتراضي: الإعدادات أو محلي)
- `--probe`: فرض فحص صحة جديد
- `--timeout <ms>`: مهلة الطلب (الافتراضي: `15000`)
- `--json`: مخرجات منظمة للمقارنة

خيارات الاكتشاف:

- `--include-local`: تضمين Gateways التي ستتم تصفيتها باعتبارها "محلية"
- `--timeout <ms>`: نافذة الاكتشاف الإجمالية (الافتراضي: `2000`)
- `--json`: مخرجات منظمة للمقارنة

<Tip>
قارن مع `openclaw gateway discover --json` لمعرفة ما إذا كان مسار اكتشاف تطبيق macOS (`local.` إضافة إلى النطاق واسع النطاق المهيأ، مع بدائل واسعة النطاق وTailscale Serve) يختلف عن اكتشاف CLI المستند إلى `dns-sd` في Node.
</Tip>

## توصيل الاتصال البعيد (أنفاق SSH)

عندما يعمل تطبيق macOS في وضع **بعيد**، فإنه يفتح نفق SSH كي تتمكن مكونات واجهة المستخدم المحلية
من التحدث إلى Gateway بعيد كما لو كان على localhost.

### نفق التحكم (منفذ Gateway WebSocket)

- **الغرض:** فحوصات الصحة، الحالة، Web Chat، الإعدادات، واستدعاءات مستوى التحكم الأخرى.
- **المنفذ المحلي:** منفذ Gateway (الافتراضي `18789`)، ثابت دائما.
- **المنفذ البعيد:** منفذ Gateway نفسه على المضيف البعيد.
- **السلوك:** لا يوجد منفذ محلي عشوائي؛ يعيد التطبيق استخدام نفق صحي موجود
  أو يعيد تشغيله عند الحاجة.
- **شكل SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` مع BatchMode +
  ExitOnForwardFailure + خيارات keepalive.
- **إبلاغ IP:** يستخدم نفق SSH loopback، لذلك سيرى Gateway عنوان IP الخاص بـ Node
  على أنه `127.0.0.1`. استخدم نقل **Direct (ws/wss)** إذا كنت تريد ظهور عنوان IP الحقيقي للعميل
  (انظر [الوصول البعيد إلى macOS](/ar/platforms/mac/remote)).

لخطوات الإعداد، راجع [الوصول البعيد إلى macOS](/ar/platforms/mac/remote). لتفاصيل البروتوكول،
راجع [بروتوكول Gateway](/ar/gateway/protocol).

## مستندات ذات صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [Gateway (macOS)](/ar/platforms/mac/bundled-gateway)
- [أذونات macOS](/ar/platforms/mac/permissions)
- [Canvas](/ar/platforms/mac/canvas)
