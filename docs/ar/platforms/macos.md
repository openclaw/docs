---
read_when:
    - تنفيذ ميزات تطبيق macOS
    - تغيير دورة حياة Gateway أو ربط Node على macOS
summary: تطبيق OpenClaw المرافق على macOS (شريط القوائم + وسيط Gateway)
title: تطبيق macOS
x-i18n:
    generated_at: "2026-04-24T07:53:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c7911d0a2e7be7fa437c5ef01a98c0f7da5e44388152ba182581cd2e381ba8b
    source_path: platforms/macos.md
    workflow: 15
---

تطبيق macOS هو **التطبيق المرافق في شريط القوائم** لـ OpenClaw. وهو يملك الأذونات،
ويدير/يرتبط بـ Gateway محليًا (عبر launchd أو يدويًا)، ويعرض قدرات macOS
للوكيل على شكل Node.

## ما الذي يفعله

- يعرض إشعارات أصلية وحالة في شريط القوائم.
- يملك مطالبات TCC (الإشعارات، وإمكانية الوصول، وتسجيل الشاشة، والميكروفون،
  والتعرّف على الكلام، وAutomation/AppleScript).
- يشغّل Gateway أو يتصل بها (محلية أو بعيدة).
- يعرض أدوات خاصة بـ macOS فقط (Canvas، والكاميرا، وتسجيل الشاشة، و`system.run`).
- يبدأ خدمة مضيف العقدة المحلية في الوضع **البعيد** (launchd)، ويوقفها في الوضع **المحلي**.
- يستضيف **PeekabooBridge** اختياريًا لأتمتة واجهة المستخدم.
- يثبت CLI العام (`openclaw`) عند الطلب عبر npm أو pnpm أو bun (ويفضّل التطبيق npm، ثم pnpm، ثم bun؛ ولا تزال Node هي بيئة التشغيل الموصى بها لـ Gateway).

## الوضع المحلي مقابل الوضع البعيد

- **محلي** (الافتراضي): يرتبط التطبيق بـ Gateway محلية تعمل بالفعل إن وجدت؛
  وإلا فإنه يفعّل خدمة launchd عبر `openclaw gateway install`.
- **بعيد**: يتصل التطبيق بـ Gateway عبر SSH/Tailscale ولا يبدأ أبدًا
  عملية محلية.
  يبدأ التطبيق **خدمة مضيف العقدة** المحلية بحيث تستطيع Gateway البعيدة الوصول إلى هذا الـ Mac.
  ولا يولّد التطبيق Gateway كعملية فرعية.
  يفضّل اكتشاف Gateway الآن أسماء Tailscale MagicDNS على عناوين tailnet IP الخام،
  لذلك يتعافى تطبيق Mac بشكل أكثر موثوقية عندما تتغير عناوين tailnet IP.

## التحكم عبر Launchd

يدير التطبيق LaunchAgent لكل مستخدم تحمل الوسم `ai.openclaw.gateway`
(أو `ai.openclaw.<profile>` عند استخدام `--profile`/`OPENCLAW_PROFILE`؛ ولا تزال الوسوم القديمة `com.openclaw.*` تُفرغ).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

استبدل الوسم بـ `ai.openclaw.<profile>` عند تشغيل ملف تعريف مسمى.

إذا لم يكن LaunchAgent مثبتًا، فقم بتفعيله من التطبيق أو شغّل
`openclaw gateway install`.

## قدرات Node (mac)

يقدّم تطبيق macOS نفسه كعقدة. الأوامر الشائعة:

- Canvas: ‏`canvas.present` و`canvas.navigate` و`canvas.eval` و`canvas.snapshot` و`canvas.a2ui.*`
- الكاميرا: ‏`camera.snap` و`camera.clip`
- الشاشة: ‏`screen.snapshot` و`screen.record`
- النظام: ‏`system.run` و`system.notify`

تبلّغ العقدة عن خريطة `permissions` حتى تتمكن الوكلاء من تقرير ما هو المسموح.

خدمة Node + IPC الخاصة بالتطبيق:

- عندما تعمل خدمة مضيف العقدة عديمة الواجهة (الوضع البعيد)، فإنها تتصل بـ Gateway WS كعقدة.
- يتم تنفيذ `system.run` داخل تطبيق macOS (سياق UI/TCC) عبر مقبس Unix محلي؛ وتبقى المطالبات + الإخراج داخل التطبيق.

رسم تخطيطي (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## موافقات Exec ‏(`system.run`)

يتم التحكم في `system.run` بواسطة **Exec approvals** في تطبيق macOS (الإعدادات ← Exec approvals).
يتم تخزين الأمان + الطلب + قائمة السماح محليًا على جهاز Mac في:

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

- تكون إدخالات `allowlist` أنماط glob لمسارات الملفات التنفيذية المحلولة.
- يُعامل نص أمر shell الخام الذي يحتوي على تحكم shell أو بنية توسيع (`&&`، `||`، `;`، `|`، `` ` ``، `$`، `<`، `>`، `(`، `)`) على أنه عدم تطابق مع قائمة السماح ويتطلب موافقة صريحة (أو إضافة الملف التنفيذي الخاص بـ shell إلى قائمة السماح).
- يؤدي اختيار “Always Allow” في المطالبة إلى إضافة ذلك الأمر إلى قائمة السماح.
- تتم تصفية تجاوزات البيئة الخاصة بـ `system.run` (ويتم إسقاط `PATH`، و`DYLD_*`، و`LD_*`، و`NODE_OPTIONS`، و`PYTHON*`، و`PERL*`، و`RUBYOPT`، و`SHELLOPTS`، و`PS4`) ثم دمجها مع بيئة التطبيق.
- بالنسبة إلى أغلفة shell ‏(`bash|sh|zsh ... -c/-lc`)، يتم تقليل تجاوزات البيئة المقيّدة بالطلب إلى قائمة سماح صغيرة وصريحة (`TERM`، و`LANG`، و`LC_*`، و`COLORTERM`، و`NO_COLOR`، و`FORCE_COLOR`).
- بالنسبة إلى قرارات السماح الدائم في وضع قائمة السماح، تحتفظ أغلفة التوجيه المعروفة (`env`، و`nice`، و`nohup`، و`stdbuf`، و`timeout`) بمسارات الملفات التنفيذية الداخلية بدلًا من مسارات الأغلفة. وإذا لم يكن فك التغليف آمنًا، فلن يتم الاحتفاظ بأي إدخال في قائمة السماح تلقائيًا.

## الروابط العميقة

يسجل التطبيق مخطط URL من نوع `openclaw://` للإجراءات المحلية.

### `openclaw://agent`

يشغّل طلب Gateway ‏`agent`.
__OC_I18N_900004__
معلمات الاستعلام:

- `message` (مطلوب)
- `sessionKey` (اختياري)
- `thinking` (اختياري)
- `deliver` / `to` / `channel` (اختياري)
- `timeoutSeconds` (اختياري)
- `key` (اختياري، مفتاح للوضع غير المراقَب)

السلامة:

- من دون `key`، يطلب التطبيق التأكيد.
- من دون `key`، يفرض التطبيق حدًا قصيرًا للرسالة الخاصة بمطالبة التأكيد ويتجاهل `deliver` / `to` / `channel`.
- مع `key` صالح، يكون التشغيل غير مراقَب (وهو مخصص للأتمتة الشخصية).

## تدفق onboarding (النموذجي)

1. ثبّت وشغّل **OpenClaw.app**.
2. أكمل قائمة التحقق من الأذونات (مطالبات TCC).
3. تأكد من أن وضع **Local** نشط وأن Gateway يعمل.
4. ثبّت CLI إذا كنت تريد الوصول عبر الطرفية.

## موضع دليل الحالة (macOS)

تجنب وضع دليل حالة OpenClaw في iCloud أو في مجلدات أخرى متزامنة مع السحابة.
يمكن أن تضيف المسارات المدعومة بالمزامنة كمونًا وتؤدي أحيانًا إلى حالات سباق في قفل الملفات/المزامنة بالنسبة إلى
الجلسات وبيانات الاعتماد.

فضّل مسار حالة محليًا غير متزامن مثل:
__OC_I18N_900005__
إذا اكتشف `openclaw doctor` أن الحالة تقع تحت:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

فسيحذّر ويوصي بإعادتها إلى مسار محلي.

## سير عمل البناء والتطوير (أصلي)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (أو Xcode)
- تحزيم التطبيق: `scripts/package-mac-app.sh`

## تصحيح اتصال gateway (CLI على macOS)

استخدم CLI الخاصة بالتصحيح لممارسة منطق المصافحة والاكتشاف نفسه
في Gateway WebSocket الذي يستخدمه تطبيق macOS، من دون تشغيل التطبيق.
__OC_I18N_900006__
خيارات الاتصال:

- `--url <ws://host:port>`: تجاوز الإعداد
- `--mode <local|remote>`: الحل من الإعداد (الافتراضي: الإعداد أو المحلي)
- `--probe`: فرض فحص سلامة جديد
- `--timeout <ms>`: مهلة الطلب (الافتراضي: `15000`)
- `--json`: خرج منظم للمقارنة

خيارات الاكتشاف:

- `--include-local`: تضمين البوابات التي كان سيتم تصفيتها على أنها “محلية”
- `--timeout <ms>`: نافذة الاكتشاف الإجمالية (الافتراضي: `2000`)
- `--json`: خرج منظم للمقارنة

نصيحة: قارن ذلك مع `openclaw gateway discover --json` لمعرفة ما إذا كان
مسار اكتشاف تطبيق macOS (`local.` بالإضافة إلى النطاق واسع النطاق المهيأ، مع
الرجوعات الاحتياطية لـ wide-area وTailscale Serve) يختلف عن
اكتشاف Node CLI المبني على `dns-sd`.

## البنية الخاصة بالاتصال البعيد (أنفاق SSH)

عندما يعمل تطبيق macOS في الوضع **البعيد**، فإنه يفتح نفق SSH بحيث تتمكن
مكوّنات واجهة المستخدم المحلية من التحدث إلى Gateway بعيدة كما لو كانت على localhost.

### نفق التحكم (منفذ Gateway WebSocket)

- **الغرض:** فحوصات السلامة، والحالة، وWeb Chat، والإعداد، واستدعاءات مستوى التحكم الأخرى.
- **المنفذ المحلي:** منفذ Gateway (الافتراضي `18789`)، ويظل ثابتًا دائمًا.
- **المنفذ البعيد:** منفذ Gateway نفسه على المضيف البعيد.
- **السلوك:** لا يوجد منفذ محلي عشوائي؛ يعيد التطبيق استخدام نفق سليم موجود
  أو يعيد تشغيله عند الحاجة.
- **شكل SSH:** ‏`ssh -N -L <local>:127.0.0.1:<remote>` مع خيارات BatchMode +
  ExitOnForwardFailure + keepalive.
- **الإبلاغ عن IP:** يستخدم نفق SSH عنوان loopback، لذا ستشاهد gateway عنوان IP الخاص بالعقدة
  على أنه `127.0.0.1`. استخدم وسيلة النقل **Direct (ws/wss)** إذا كنت تريد ظهور عنوان IP
  الحقيقي للعميل (راجع [الوصول البعيد على macOS](/ar/platforms/mac/remote)).

لخطوات الإعداد، راجع [الوصول البعيد على macOS](/ar/platforms/mac/remote). ولتفاصيل
البروتوكول، راجع [بروتوكول Gateway](/ar/gateway/protocol).

## وثائق ذات صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [Gateway (macOS)](/ar/platforms/mac/bundled-gateway)
- [أذونات macOS](/ar/platforms/mac/permissions)
- [Canvas](/ar/platforms/mac/canvas)
