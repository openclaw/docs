---
read_when:
    - تنفيذ ميزات تطبيق macOS
    - تغيير دورة حياة Gateway أو تجسير Node على macOS
summary: تطبيق OpenClaw المصاحب لنظام macOS (شريط القوائم + وسيط Gateway)
title: تطبيق macOS
x-i18n:
    generated_at: "2026-04-30T08:11:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ed98cd4865f2117728d4349c9be99d9c2e20f4d86a77c80f5ba0b5520eb81cd
    source_path: platforms/macos.md
    workflow: 16
---

تطبيق macOS هو **رفيق شريط القوائم** لـ OpenClaw. يتولى الأذونات،
ويدير/يتصل بـ Gateway محليًا (launchd أو يدويًا)، ويعرض قدرات macOS
للوكيل كعقدة.

## ما الذي يفعله

- يعرض الإشعارات الأصلية والحالة في شريط القوائم.
- يتولى مطالبات TCC (الإشعارات، تسهيلات الاستخدام، تسجيل الشاشة، الميكروفون،
  التعرف على الكلام، الأتمتة/AppleScript).
- يشغّل Gateway أو يتصل به (محلي أو بعيد).
- يعرض أدوات خاصة بـ macOS فقط (Canvas، Camera، Screen Recording، `system.run`).
- يبدأ خدمة مضيف العقدة المحلية في وضع **بعيد** (launchd)، ويوقفها في وضع **محلي**.
- يمكنه اختياريًا استضافة **PeekabooBridge** لأتمتة واجهة المستخدم.
- يثبّت CLI العام (`openclaw`) عند الطلب عبر npm أو pnpm أو bun (يفضّل التطبيق npm، ثم pnpm، ثم bun؛ يظل Node بيئة التشغيل الموصى بها لـ Gateway).

## الوضع المحلي مقابل البعيد

- **محلي** (الافتراضي): يتصل التطبيق بـ Gateway محلي قيد التشغيل إذا كان موجودًا؛
  وإلا فإنه يفعّل خدمة launchd عبر `openclaw gateway install`.
- **بعيد**: يتصل التطبيق بـ Gateway عبر SSH/Tailscale ولا يبدأ
  أي عملية محلية مطلقًا.
  يبدأ التطبيق **خدمة مضيف العقدة** المحلية حتى يتمكن Gateway البعيد من الوصول إلى هذا Mac.
  لا يشغّل التطبيق Gateway كعملية فرعية.
  يفضّل اكتشاف Gateway الآن أسماء Tailscale MagicDNS على عناوين tailnet IP الخام،
  لذلك يتعافى تطبيق Mac بموثوقية أكبر عند تغيّر عناوين tailnet IP.

## التحكم في launchd

يدير التطبيق LaunchAgent لكل مستخدم بالتسمية `ai.openclaw.gateway`
(أو `ai.openclaw.<profile>` عند استخدام `--profile`/`OPENCLAW_PROFILE`؛ ما زال `com.openclaw.*` القديم يُفرّغ).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

استبدل التسمية بـ `ai.openclaw.<profile>` عند تشغيل ملف تعريف مسمى.

إذا لم يكن LaunchAgent مثبتًا، ففعّله من التطبيق أو شغّل
`openclaw gateway install`.

## قدرات Node (mac)

يقدّم تطبيق macOS نفسه كعقدة. الأوامر الشائعة:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

تبلغ العقدة عن خريطة `permissions` حتى تتمكن الوكلاء من تحديد ما هو مسموح.

خدمة Node + IPC التطبيق:

- عندما تكون خدمة مضيف العقدة بلا واجهة قيد التشغيل (الوضع البعيد)، تتصل بـ Gateway WS كعقدة.
- ينفّذ `system.run` داخل تطبيق macOS (سياق واجهة المستخدم/TCC) عبر مقبس Unix محلي؛ وتبقى المطالبات + المخرجات داخل التطبيق.

المخطط (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## موافقات التنفيذ (system.run)

يُتحكم في `system.run` عبر **موافقات التنفيذ** في تطبيق macOS (Settings → Exec approvals).
تُخزّن إعدادات الأمان + السؤال + قائمة السماح محليًا على Mac في:

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

- إدخالات `allowlist` هي أنماط glob لمسارات الملفات التنفيذية التي تم حلها، أو أسماء أوامر مجردة للأوامر المستدعاة عبر PATH.
- يُعامل نص أمر shell الخام الذي يحتوي على صيغة تحكم أو توسعة shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) كعدم تطابق مع قائمة السماح ويتطلب موافقة صريحة (أو إضافة ملف shell التنفيذي إلى قائمة السماح).
- يؤدي اختيار “Always Allow” في المطالبة إلى إضافة ذلك الأمر إلى قائمة السماح.
- تُرشّح تجاوزات بيئة `system.run` (تُسقط `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) ثم تُدمج مع بيئة التطبيق.
- بالنسبة إلى مغلّفات shell (`bash|sh|zsh ... -c/-lc`)، تُختزل تجاوزات البيئة ذات نطاق الطلب إلى قائمة سماح صغيرة وصريحة (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- بالنسبة إلى قرارات السماح دائمًا في وضع قائمة السماح، تحتفظ مغلّفات الإرسال المعروفة (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) بمسارات الملفات التنفيذية الداخلية بدلًا من مسارات المغلّفات. إذا لم يكن فك التغليف آمنًا، فلن يستمر أي إدخال في قائمة السماح تلقائيًا.

## الروابط العميقة

يسجّل التطبيق مخطط URL ‏`openclaw://` للإجراءات المحلية.

### `openclaw://agent`

يشغّل طلب `agent` إلى Gateway.
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
- بدون `key`، يفرض التطبيق حدًا قصيرًا للرسالة في مطالبة التأكيد ويتجاهل `deliver` / `to` / `channel`.
- مع `key` صالح، يتم التشغيل دون مراقبة (مخصص للأتمتة الشخصية).

## تدفق الإعداد الأولي (نموذجي)

1. ثبّت وشغّل **OpenClaw.app**.
2. أكمل قائمة التحقق من الأذونات (مطالبات TCC).
3. تأكد من أن وضع **محلي** نشط وأن Gateway قيد التشغيل.
4. ثبّت CLI إذا كنت تريد الوصول من الطرفية.

## موضع دليل الحالة (macOS)

تجنب وضع دليل حالة OpenClaw في iCloud أو مجلدات أخرى متزامنة مع السحابة.
قد تضيف المسارات المدعومة بالمزامنة زمن استجابة، وقد تسبب أحيانًا سباقات قفل/مزامنة ملفات
للجلسات وبيانات الاعتماد.

يفضّل استخدام مسار حالة محلي غير متزامن مثل:
__OC_I18N_900005__
إذا اكتشف `openclaw doctor` الحالة ضمن:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

فسيحذّر ويوصي بالانتقال مرة أخرى إلى مسار محلي.

## سير عمل البناء والتطوير (أصلي)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (أو Xcode)
- حزم التطبيق: `scripts/package-mac-app.sh`

## تصحيح اتصال Gateway (macOS CLI)

استخدم CLI التصحيح لاختبار مصافحة Gateway WebSocket ومنطق الاكتشاف نفسيهما
اللذين يستخدمهما تطبيق macOS، دون تشغيل التطبيق.
__OC_I18N_900006__
خيارات الاتصال:

- `--url <ws://host:port>`: تجاوز الإعدادات
- `--mode <local|remote>`: الحل من الإعدادات (الافتراضي: الإعدادات أو محلي)
- `--probe`: فرض فحص صحة جديد
- `--timeout <ms>`: مهلة الطلب (الافتراضي: `15000`)
- `--json`: مخرجات منظمة للمقارنة

خيارات الاكتشاف:

- `--include-local`: تضمين بوابات Gateway التي كانت ستُرشّح باعتبارها “محلية”
- `--timeout <ms>`: نافذة الاكتشاف الإجمالية (الافتراضي: `2000`)
- `--json`: مخرجات منظمة للمقارنة

<Tip>
قارنه مع `openclaw gateway discover --json` لمعرفة ما إذا كان مسار اكتشاف تطبيق macOS (`local.` بالإضافة إلى نطاق المنطقة الواسعة المكوّن، مع بدائل المنطقة الواسعة وTailscale Serve) يختلف عن اكتشاف CLI الخاص بـ Node المستند إلى `dns-sd`.
</Tip>

## توصيل الاتصال البعيد (أنفاق SSH)

عندما يعمل تطبيق macOS في وضع **بعيد**، يفتح نفق SSH حتى تتمكن مكوّنات واجهة المستخدم المحلية
من التحدث إلى Gateway بعيد كما لو كان على localhost.

### نفق التحكم (منفذ Gateway WebSocket)

- **الغرض:** فحوصات الصحة، الحالة، Web Chat، الإعدادات، وغيرها من استدعاءات مستوى التحكم.
- **المنفذ المحلي:** منفذ Gateway (الافتراضي `18789`)، ثابت دائمًا.
- **المنفذ البعيد:** منفذ Gateway نفسه على المضيف البعيد.
- **السلوك:** لا يوجد منفذ محلي عشوائي؛ يعيد التطبيق استخدام نفق صحي موجود
  أو يعيد تشغيله عند الحاجة.
- **صيغة SSH:** ‏`ssh -N -L <local>:127.0.0.1:<remote>` مع خيارات BatchMode +
  ExitOnForwardFailure + keepalive.
- **الإبلاغ عن IP:** يستخدم نفق SSH local loopback، لذلك سيرى Gateway عنوان IP العقدة
  كـ `127.0.0.1`. استخدم نقل **Direct (ws/wss)** إذا أردت ظهور عنوان IP العميل الحقيقي
  (راجع [الوصول البعيد إلى macOS](/ar/platforms/mac/remote)).

لخطوات الإعداد، راجع [الوصول البعيد إلى macOS](/ar/platforms/mac/remote). لتفاصيل البروتوكول،
راجع [بروتوكول Gateway](/ar/gateway/protocol).

## مستندات ذات صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [Gateway (macOS)](/ar/platforms/mac/bundled-gateway)
- [أذونات macOS](/ar/platforms/mac/permissions)
- [Canvas](/ar/platforms/mac/canvas)
