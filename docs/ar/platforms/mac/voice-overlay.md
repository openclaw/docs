---
read_when:
    - ضبط سلوك تراكب الصوت
summary: دورة حياة تراكب الصوت عندما يتداخل wake-word مع push-to-talk
title: تراكب الصوت
x-i18n:
    generated_at: "2026-04-24T07:52:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ae98afad57dffe73e2c878eef4f3253e4464d68cadf531e9239b017cc160f28
    source_path: platforms/mac/voice-overlay.md
    workflow: 15
---

# دورة حياة تراكب الصوت (macOS)

الجمهور: المساهمون في تطبيق macOS. الهدف: إبقاء تراكب الصوت متوقعًا عندما يتداخل wake-word مع push-to-talk.

## النية الحالية

- إذا كان التراكب ظاهرًا بالفعل بسبب wake-word وضغط المستخدم مفتاح الاختصار، فإن جلسة مفتاح الاختصار _تتبنى_ النص الموجود بدلًا من إعادة ضبطه. ويبقى التراكب ظاهرًا ما دام مفتاح الاختصار مضغوطًا. وعندما يحرر المستخدم المفتاح: يتم الإرسال إذا كان هناك نص مقصوص، وإلا يتم الإخفاء.
- ما تزال wake-word وحدها ترسل تلقائيًا عند الصمت؛ بينما ترسل push-to-talk فورًا عند التحرير.

## المُنفّذ (9 ديسمبر 2025)

- أصبحت جلسات التراكب تحمل token لكل التقاط (wake-word أو push-to-talk). ويتم إسقاط تحديثات partial/final/send/dismiss/level عندما لا يتطابق token، مما يمنع callbacks القديمة.
- تتبنى push-to-talk أي نص ظاهر في التراكب كلاحقة أولية (لذلك فإن ضغط مفتاح الاختصار أثناء ظهور تراكب wake يبقي النص ويضيف إليه الكلام الجديد). وهي تنتظر حتى 1.5 ثانية للحصول على transcript نهائي قبل الرجوع إلى النص الحالي.
- يتم إصدار تسجيل chime/overlay عند المستوى `info` ضمن الفئات `voicewake.overlay` و`voicewake.ptt` و`voicewake.chime` (بدء الجلسة، وpartial، وfinal، وsend، وdismiss، وسبب chime).

## الخطوات التالية

1. **VoiceSessionCoordinator (actor)**
   - يملك `VoiceSession` واحدة فقط في كل مرة.
   - API (قائمة على token): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - يسقط callbacks التي تحمل tokens قديمة (لمنع recognizers القديمة من إعادة فتح التراكب).
2. **VoiceSession (model)**
   - الحقول: `token`, `source` (`wakeWord|pushToTalk`), نص committed/volatile, أعلام chime, مؤقتات (auto-send, idle), `overlayMode` (`display|editing|sending`), موعد cooldown النهائي.
3. **ربط التراكب**
   - يقوم `VoiceSessionPublisher` (`ObservableObject`) بعكس الجلسة النشطة إلى SwiftUI.
   - يعرض `VoiceWakeOverlayView` فقط عبر publisher؛ ولا يغيّر global singletons مباشرةً أبدًا.
   - تستدعي إجراءات المستخدم في التراكب (`sendNow`, `dismiss`, `edit`) coordinator باستخدام token الخاص بالجلسة.
4. **مسار إرسال موحّد**
   - عند `endCapture`: إذا كان النص المقصوص فارغًا → إخفاء؛ وإلا `performSend(session:)` (يشغّل send chime مرة واحدة، ويمرر، ثم يخفي).
   - push-to-talk: بلا تأخير؛ wake-word: تأخير اختياري للإرسال التلقائي.
   - طبّق cooldown قصيرة على بيئة تشغيل wake بعد انتهاء push-to-talk حتى لا تُعاد wake-word فورًا.
5. **التسجيل**
   - يصدر coordinator سجلات `.info` في subsystem `ai.openclaw`، والفئتين `voicewake.overlay` و`voicewake.chime`.
   - الأحداث الأساسية: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## قائمة التحقق لتصحيح الأخطاء

- ابث السجلات أثناء إعادة إنتاج مشكلة تراكب عالق:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- تحقّق من وجود token نشطة واحدة فقط للجلسة؛ يجب أن يقوم coordinator بإسقاط callbacks القديمة.
- تأكد من أن تحرير push-to-talk يستدعي دائمًا `endCapture` باستخدام token النشطة؛ وإذا كان النص فارغًا، فتوقع `dismiss` من دون chime أو send.

## خطوات الترحيل (مقترحة)

1. أضف `VoiceSessionCoordinator` و`VoiceSession` و`VoiceSessionPublisher`.
2. أعد هيكلة `VoiceWakeRuntime` بحيث ينشئ/يحدّث/ينهي الجلسات بدلًا من لمس `VoiceWakeOverlayController` مباشرة.
3. أعد هيكلة `VoicePushToTalk` بحيث يتبنى الجلسات الموجودة ويستدعي `endCapture` عند التحرير؛ وطبّق cooldown على بيئة التشغيل.
4. اربط `VoiceWakeOverlayController` بـ publisher؛ وأزل الاستدعاءات المباشرة من runtime/PTT.
5. أضف اختبارات integration لتبني الجلسة، وcooldown، وإخفاء النص الفارغ.

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [Voice wake (macOS)](/ar/platforms/mac/voicewake)
- [Talk mode](/ar/nodes/talk)
