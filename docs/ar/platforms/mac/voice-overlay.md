---
read_when:
    - ضبط سلوك تراكب الصوت
summary: دورة حياة تراكب الصوت عند تداخل كلمة التنبيه مع الضغط للتحدث
title: تراكب الصوت
x-i18n:
    generated_at: "2026-07-12T06:11:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eef571c3e8d41a97779537b1b373fab25b08f63575b50e5019f6c5fbcb782c52
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# دورة حياة تراكب الصوت (macOS)

الجمهور: المساهمون في تطبيق macOS. الهدف: الحفاظ على سلوك متوقع لتراكب الصوت عند تداخل كلمة التنبيه مع الضغط للتحدث.

## السلوك

- إذا كان التراكب ظاهرًا بالفعل بسبب كلمة التنبيه وضغط المستخدم مفتاح الاختصار، تعتمد جلسة مفتاح الاختصار النص الموجود بدلًا من إعادة تعيينه. يظل التراكب ظاهرًا طوال فترة الضغط على مفتاح الاختصار. عند تحريره: يُرسل النص إذا لم يكن فارغًا بعد إزالة المسافات الزائدة، وإلا يُغلق التراكب.
- تظل كلمة التنبيه وحدها ترسل تلقائيًا عند الصمت؛ بينما يرسل الضغط للتحدث فور تحرير المفتاح.

## التنفيذ

- يُعد `VoiceSessionCoordinator` ‏(`apps/macos/Sources/OpenClaw/VoiceSessionCoordinator.swift`) المالك الوحيد لجلسة الصوت النشطة. وهو كائن مفرد من النوع `@MainActor @Observable`، وليس actor. واجهة API:‏ `startSession`، و`updatePartial`، و`finalize`، و`sendNow`، و`dismiss`، و`updateLevel`، و`snapshot`. تحمل كل جلسة رمز `UUID`؛ ويجري تجاهل الاستدعاءات ذات الرمز القديم أو غير المتطابق.
- يعرض `VoiceWakeOverlayController` ‏(`VoiceWakeOverlayController+Session.swift`) التراكب ويمرر إجراءات المستخدم (`requestSend`، و`dismiss`) مجددًا عبر المنسق باستخدام رمز الجلسة. ولا يمتلك حالة الجلسة نفسها أبدًا.
- يعتمد الضغط للتحدث (`VoicePushToTalk.begin()`) أي نص ظاهر في التراكب بوصفه `adoptedPrefix` (عبر `VoiceSessionCoordinator.shared.snapshot()`)، بحيث يؤدي الضغط على مفتاح الاختصار أثناء ظهور تراكب التنبيه إلى الاحتفاظ بالنص وإلحاق الكلام الجديد به. وعند تحرير المفتاح، ينتظر مدة تصل إلى 1.5 ثانية للحصول على نص نهائي قبل الرجوع إلى النص الحالي.
- عند `dismiss`، يستدعي التراكب `VoiceSessionCoordinator.overlayDidDismiss`، ما يؤدي إلى تشغيل `VoiceWakeRuntime.refresh(state:)` لكي تستأنف جميع حالات الإغلاق اليدوي بزر X، والإغلاق عند فراغ النص، والإغلاق بعد الإرسال الاستماع إلى كلمة التنبيه.
- مسار إرسال موحد: إذا كان النص فارغًا بعد إزالة المسافات الزائدة، يُغلق التراكب؛ وإلا يشغّل `sendNow` نغمة الإرسال مرة واحدة، ويمرر النص عبر `VoiceWakeForwarder`، ثم يغلق التراكب.

## التسجيل

النظام الفرعي للصوت هو `ai.openclaw`؛ ويسجل كل مكوّن ضمن فئته الخاصة:

| الفئة                   | المكوّن                                         |
| ----------------------- | ----------------------------------------------- |
| `voicewake.coordinator` | `VoiceSessionCoordinator`                       |
| `voicewake.overlay`     | `VoiceWakeOverlayController`/`VoiceWakeOverlay` |
| `voicewake.ptt`         | مفتاح اختصار الضغط للتحدث والتقاط الصوت         |
| `voicewake.runtime`     | وقت تشغيل كلمة التنبيه                          |
| `voicewake.chime`       | تشغيل النغمة                                    |
| `voicewake.sync`        | مزامنة الإعدادات العامة                         |
| `voicewake.forward`     | تمرير النص المفرغ                               |
| `voicewake.meter`       | مراقب مستوى الميكروفون                          |

## قائمة التحقق لتصحيح الأخطاء

- اعرض سجلات البث أثناء إعادة إنتاج مشكلة بقاء التراكب عالقًا:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- تحقق من وجود رمز جلسة نشط واحد فقط؛ إذ يتجاهل المنسق عمليات رد النداء القديمة.
- تأكد من أن تحرير زر الضغط للتحدث يستدعي دائمًا `end()` باستخدام الرمز النشط؛ وإذا كان النص فارغًا، فتوقّع إغلاق التراكب دون نغمة أو إرسال.

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [التنبيه الصوتي (macOS)](/ar/platforms/mac/voicewake)
- [وضع التحدث](/ar/nodes/talk)
