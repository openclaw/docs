---
read_when:
    - تشخيص اتصال القناة أو سلامة Gateway
    - فهم أوامر وخيارات CLI لفحص الصحة
summary: أوامر فحص الحالة الصحية ومراقبة صحة Gateway
title: فحوصات الصحة
x-i18n:
    generated_at: "2026-04-30T07:59:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: f34b91ef5d54b0fac7c451e46e07d36520a7d08fb0dce0538c6158d0bc6982b8
    source_path: gateway/health.md
    workflow: 16
---

دليل قصير للتحقق من اتصال القنوات دون تخمين.

## فحوصات سريعة

- `openclaw status` — ملخص محلي: قابلية الوصول إلى Gateway/الوضع، تلميح التحديث، عمر مصادقة القناة المرتبطة، الجلسات + النشاط الأخير.
- `openclaw status --all` — تشخيص محلي كامل (للقراءة فقط، ملوّن، آمن للصقه عند التصحيح).
- `openclaw status --deep` — يطلب من Gateway قيد التشغيل إجراء فحص صحة مباشر (`health` مع `probe:true`)، بما في ذلك فحوصات القنوات لكل حساب عند دعمها.
- `openclaw health` — يطلب من Gateway قيد التشغيل لقطة صحته (WS فقط؛ لا توجد مقابس قنوات مباشرة من CLI).
- `openclaw health --verbose` — يفرض فحص صحة مباشرًا ويطبع تفاصيل اتصال Gateway.
- `openclaw health --json` — مخرجات لقطة صحة قابلة للقراءة آليًا.
- أرسل `/status` كرسالة مستقلة في WhatsApp/WebChat للحصول على رد حالة دون استدعاء الوكيل.
- السجلات: تابع `/tmp/openclaw/openclaw-*.log` ورشّح حسب `web-heartbeat`، `web-reconnect`، `web-auto-reply`، `web-inbound`.

## تشخيصات عميقة

- بيانات الاعتماد على القرص: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (ينبغي أن يكون mtime حديثًا).
- مخزن الجلسات: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (يمكن تجاوز المسار في الإعدادات). يُعرَض العدد والمستلمون الجدد عبر `status`.
- تدفق إعادة الربط: `openclaw channels logout && openclaw channels login --verbose` عندما تظهر رموز الحالة 409-515 أو `loggedOut` في السجلات. (ملاحظة: تدفق تسجيل الدخول عبر QR يعيد التشغيل تلقائيًا مرة واحدة للحالة 515 بعد الاقتران.)
- التشخيصات مفعّلة افتراضيًا. يسجل Gateway الوقائع التشغيلية ما لم يتم تعيين `diagnostics.enabled: false`. تسجل أحداث الذاكرة أعداد بايت RSS/الكومة، وضغط العتبة، وضغط النمو. تسجل تحذيرات الحيوية تأخير حلقة الأحداث، واستخدام حلقة الأحداث، ونسبة أنوية CPU، وأعداد الجلسات النشطة/المنتظرة/المصفوفة في الطابور عندما تكون العملية قيد التشغيل لكنها مشبعة. تسجل أحداث الحمولة كبيرة الحجم ما تم رفضه أو اقتطاعه أو تقسيمه إلى أجزاء، بالإضافة إلى الأحجام والحدود عند توفرها. لا تسجل نص الرسالة، أو محتويات المرفقات، أو جسم Webhook، أو جسم الطلب أو الاستجابة الخام، أو الرموز، أو ملفات تعريف الارتباط، أو القيم السرية. يبدأ Heartbeat نفسه مسجل الاستقرار المحدود، المتاح عبر `openclaw gateway stability` أو استدعاء RPC الخاص بـ Gateway باسم `diagnostics.stability`. تحفظ مخارج Gateway القاتلة، ومهل إيقاف التشغيل، وفشل بدء التشغيل بعد إعادة التشغيل أحدث لقطة من المسجل تحت `~/.openclaw/logs/stability/` عند وجود أحداث؛ افحص أحدث حزمة محفوظة باستخدام `openclaw gateway stability --bundle latest`.
- لتقارير الأخطاء، شغّل `openclaw gateway diagnostics export` وأرفق ملف zip الذي تم إنشاؤه. يجمع التصدير ملخص Markdown، وأحدث حزمة استقرار، وبيانات وصفية منقّحة للسجلات، ولقطات حالة/صحة Gateway منقّحة، وشكل الإعدادات. وهو مخصص للمشاركة: يتم حذف أو تنقيح نصوص الدردشة، وأجسام Webhook، ومخرجات الأدوات، وبيانات الاعتماد، وملفات تعريف الارتباط، ومعرّفات الحساب/الرسالة، والقيم السرية. راجع [تصدير التشخيصات](/ar/gateway/diagnostics).

## إعدادات مراقب الصحة

- `gateway.channelHealthCheckMinutes`: مدى تكرار فحص Gateway لصحة القنوات. الافتراضي: `5`. عيّن `0` لتعطيل إعادات تشغيل مراقب الصحة عالميًا.
- `gateway.channelStaleEventThresholdMinutes`: المدة التي يمكن أن تبقى فيها قناة متصلة خاملة قبل أن يعدّها مراقب الصحة قديمة ويعيد تشغيلها. الافتراضي: `30`. أبقِ هذه القيمة أكبر من أو مساوية لـ `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: حد متحرك لمدة ساعة واحدة لإعادات تشغيل مراقب الصحة لكل قناة/حساب. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: تعطيل إعادات تشغيل مراقب الصحة لقناة محددة مع إبقاء المراقبة العامة مفعّلة.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز متعدد الحسابات يتغلب على إعداد مستوى القناة.
- تنطبق هذه التجاوزات لكل قناة على مراقبات القنوات المضمنة التي تكشفها اليوم: Discord، Google Chat، iMessage، Microsoft Teams، Signal، Slack، Telegram، وWhatsApp.

## عند فشل شيء ما

- `logged out` أو الحالة 409-515 → أعد الربط باستخدام `openclaw channels logout` ثم `openclaw channels login`.
- يتعذر الوصول إلى Gateway → شغّله: `openclaw gateway --port 18789` (استخدم `--force` إذا كان المنفذ مشغولًا).
- لا توجد رسائل واردة → تأكد من أن الهاتف المرتبط متصل بالإنترنت وأن المرسل مسموح به (`channels.whatsapp.allowFrom`)؛ بالنسبة إلى دردشات المجموعات، تأكد من تطابق قائمة السماح + قواعد الإشارة (`channels.whatsapp.groups`، `agents.list[].groupChat.mentionPatterns`).

## أمر "health" المخصص

يطلب `openclaw health` من Gateway قيد التشغيل لقطة صحته (لا توجد مقابس قنوات
مباشرة من CLI). افتراضيًا، يمكنه إرجاع لقطة Gateway حديثة مخزنة مؤقتًا؛ ثم يحدّث
Gateway تلك الذاكرة المؤقتة في الخلفية. يفرض `openclaw health --verbose`
فحصًا مباشرًا بدلًا من ذلك. يعرض الأمر بيانات الاعتماد المرتبطة/عمر المصادقة عند توفرها،
وملخصات الفحص لكل قناة، وملخص مخزن الجلسات، ومدة الفحص. يخرج
برمز غير صفري إذا تعذر الوصول إلى Gateway أو إذا فشل الفحص/انتهت مهلته.

الخيارات:

- `--json`: مخرجات JSON قابلة للقراءة آليًا
- `--timeout <ms>`: تجاوز مهلة الفحص الافتراضية البالغة 10 ثوانٍ
- `--verbose`: فرض فحص مباشر وطباعة تفاصيل اتصال Gateway
- `--debug`: اسم مستعار لـ `--verbose`

تتضمن لقطة الصحة: `ok` (قيمة منطقية)، و`ts` (طابع زمني)، و`durationMs` (وقت الفحص)، وحالة كل قناة، وتوفر الوكيل، وملخص مخزن الجلسات.

## ذات صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [تصدير التشخيصات](/ar/gateway/diagnostics)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
