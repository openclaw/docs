---
read_when:
    - تشخيص اتصال القناة أو سلامة Gateway
    - فهم أوامر CLI الخاصة بفحص السلامة وخياراتها
summary: أوامر فحص السلامة ومراقبة سلامة Gateway
title: فحوصات السلامة
x-i18n:
    generated_at: "2026-04-24T07:41:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08278ff0079102459c4d9141dc2e8d89e731de1fc84487f6baa620aaf7c119b4
    source_path: gateway/health.md
    workflow: 15
---

# فحوصات السلامة (CLI)

دليل قصير للتحقق من اتصال القنوات من دون تخمين.

## فحوصات سريعة

- `openclaw status` — ملخص محلي: إمكانية الوصول إلى Gateway/وضعها، وتلميح التحديث، وعمر مصادقة القناة المرتبطة، والجلسات + النشاط الأخير.
- `openclaw status --all` — تشخيص محلي كامل (للقراءة فقط، ملوّن، وآمن للصق لأغراض التصحيح).
- `openclaw status --deep` — يطلب من Gateway الجارية فحص سلامة مباشرًا (`health` مع `probe:true`) بما في ذلك فحوصات القنوات لكل حساب عند الدعم.
- `openclaw health` — يطلب من Gateway الجارية لقطة سلامتها (‏WS فقط؛ من دون sockets مباشرة للقنوات من CLI).
- `openclaw health --verbose` — يفرض فحص سلامة مباشرًا ويطبع تفاصيل اتصال Gateway.
- `openclaw health --json` — خرج لقطة سلامة قابل للقراءة آليًا.
- أرسل `/status` كرسالة مستقلة في WhatsApp/WebChat للحصول على رد حالة من دون استدعاء الوكيل.
- السجلات: تابع `/tmp/openclaw/openclaw-*.log` وفلتر حسب `web-heartbeat` و`web-reconnect` و`web-auto-reply` و`web-inbound`.

## تشخيصات متعمقة

- بيانات الاعتماد على القرص: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (يجب أن يكون وقت التعديل `mtime` حديثًا).
- مخزن الجلسات: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (يمكن تجاوز المسار في الإعداد). يتم إظهار العدد والمستلمين الأخيرين عبر `status`.
- تدفق إعادة الربط: `openclaw channels logout && openclaw channels login --verbose` عند ظهور رموز الحالة 409–515 أو `loggedOut` في السجلات. (ملاحظة: يعيد تدفق تسجيل الدخول عبر QR التشغيل تلقائيًا مرة واحدة للحالة 515 بعد الاقتران.)
- تكون التشخيصات مفعّلة افتراضيًا. تسجل Gateway الحقائق التشغيلية ما لم يتم ضبط `diagnostics.enabled: false`. تسجل أحداث الذاكرة أعداد بايتات RSS/heap، وضغط العتبة، وضغط النمو. وتسجل أحداث الحمولة كبيرة الحجم ما الذي تم رفضه أو اقتطاعه أو تقسيمه إلى أجزاء، بالإضافة إلى الأحجام والحدود عند توفرها. وهي لا تسجل نص الرسالة، أو محتويات المرفقات، أو جسم Webhook، أو جسم الطلب أو الاستجابة الخام، أو الرموز المميزة، أو ملفات تعريف الارتباط، أو القيم السرية. ويبدأ Heartbeat نفسه أيضًا مسجل الاستقرار المحدود، وهو متاح عبر `openclaw gateway stability` أو Gateway RPC `diagnostics.stability`. تؤدي حالات خروج Gateway القاتلة، ومهلات إيقاف التشغيل، وأخطاء بدء التشغيل بعد إعادة التشغيل إلى حفظ أحدث لقطة من المسجل ضمن `~/.openclaw/logs/stability/` عند وجود أحداث؛ افحص أحدث حزمة محفوظة باستخدام `openclaw gateway stability --bundle latest`.
- لتقارير الأخطاء، شغّل `openclaw gateway diagnostics export` وأرفق ملف zip المُنشأ. يجمع التصدير ملخصًا بصيغة Markdown، وأحدث حزمة استقرار، وبيانات تعريف سجلات منقحة، ولقطات منقحة لحالة/سلامة Gateway، وبنية الإعداد. وهو مصمم للمشاركة: يتم حذف أو تنقيح نصوص الدردشة، وأجسام Webhook، ومخرجات الأدوات، وبيانات الاعتماد، وملفات تعريف الارتباط، ومعرّفات الحسابات/الرسائل، والقيم السرية. راجع [تصدير التشخيصات](/ar/gateway/diagnostics).

## إعداد مراقب السلامة

- `gateway.channelHealthCheckMinutes`: عدد الدقائق بين كل فحص سلامة للقنوات من قبل Gateway. الافتراضي: `5`. اضبط `0` لتعطيل إعادة تشغيل مراقب السلامة عالميًا.
- `gateway.channelStaleEventThresholdMinutes`: المدة التي يمكن أن تبقى فيها قناة متصلة خاملة قبل أن يعتبرها مراقب السلامة قديمة ويعيد تشغيلها. الافتراضي: `30`. أبقِ هذه القيمة أكبر من أو مساوية لـ `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: الحد المتدرج لإعادات تشغيل مراقب السلامة لكل قناة/حساب خلال ساعة واحدة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: تعطيل إعادات تشغيل مراقب السلامة لقناة محددة مع إبقاء المراقبة العامة مفعّلة.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز للحسابات المتعددة يتغلب على الإعداد على مستوى القناة.
- تنطبق هذه التجاوزات لكل قناة على مراقبات القنوات المضمّنة التي تعرضها اليوم: Discord وGoogle Chat وiMessage وMicrosoft Teams وSignal وSlack وTelegram وWhatsApp.

## عندما يفشل شيء ما

- `logged out` أو حالة 409–515 ← أعد الربط باستخدام `openclaw channels logout` ثم `openclaw channels login`.
- تعذر الوصول إلى Gateway ← ابدأ تشغيلها: `openclaw gateway --port 18789` (استخدم `--force` إذا كان المنفذ مشغولًا).
- لا توجد رسائل واردة ← تأكد من أن الهاتف المرتبط متصل وأن المرسل مسموح له (`channels.whatsapp.allowFrom`)؛ وبالنسبة إلى الدردشات الجماعية، تأكد من أن قائمة السماح + قواعد الإشارة متطابقة (`channels.whatsapp.groups`، و`agents.list[].groupChat.mentionPatterns`).

## أمر "health" المخصص

يطلب `openclaw health` من Gateway الجارية لقطة سلامتها (من دون sockets مباشرة للقنوات من CLI). وبشكل افتراضي، يمكنه إرجاع لقطة حديثة مخزنة مؤقتًا من Gateway؛ ثم تقوم
Gateway بتحديث تلك الذاكرة المؤقتة في الخلفية. أما `openclaw health --verbose` فيفرض
فحصًا مباشرًا بدلًا من ذلك. ويعرض الأمر عمر بيانات الاعتماد/المصادقة المرتبطة عندما تكون متاحة،
وملخصات الفحص لكل قناة، وملخص مخزن الجلسات، ومدة الفحص. ويخرج
بقيمة غير صفرية إذا تعذر الوصول إلى Gateway أو فشل الفحص/انتهت مهلته.

الخيارات:

- `--json`: خرج JSON قابل للقراءة آليًا
- `--timeout <ms>`: تجاوز مهلة الفحص الافتراضية البالغة 10 ثوانٍ
- `--verbose`: فرض فحص مباشر وطباعة تفاصيل اتصال Gateway
- `--debug`: اسم بديل لـ `--verbose`

تتضمن لقطة السلامة ما يلي: `ok` (قيمة منطقية)، و`ts` (طابع زمني)، و`durationMs` (زمن الفحص)، وحالة كل قناة، وتوفر الوكيل، وملخص مخزن الجلسات.

## ذو صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [تصدير التشخيصات](/ar/gateway/diagnostics)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
