---
read_when:
    - تريد ربط OpenClaw بمساحة عمل Raft
    - أنت تقوم بتكوين وكيل خارجي لـ Raft
    - أنت تقوم بتصحيح أخطاء تسليم إيقاظ Raft
sidebarTitle: Raft
summary: دعم الوكيل الخارجي في Raft عبر جسر الإيقاظ في CLI الخاص بـ Raft
title: طوف
x-i18n:
    generated_at: "2026-06-27T17:13:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef9ebfd27e69575d9a1534b3b31f05036f081c54a2379411d2c7fb6f8165d558
    source_path: channels/raft.md
    workflow: 16
---

يدعم Raft ربط وكيل OpenClaw بوكيل Raft خارجي عبر Raft CLI المحلي.
يرسل Raft تلميحات إيقاظ موثّقة إلى Gateway. ثم يستخدم الوكيل
Raft CLI لفحص الرسائل وإرسالها.

## التثبيت

Raft هو Plugin خارجي رسمي. ثبّته على مضيف Gateway:

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

التفاصيل: [Plugins](/ar/tools/plugin)

## المتطلبات الأساسية

- مساحة عمل Raft تحتوي على وكيل خارجي.
- تثبيت Raft CLI على المضيف نفسه الذي يعمل عليه OpenClaw Gateway.
- ملف تعريف Raft CLI مسجّل دخوله مسبقًا ومرتبط بذلك الوكيل الخارجي.

لا يخزّن Plugin بيانات اعتماد Raft. يحتفظ Raft CLI بهذا التوثيق
في ملف تعريفه الخاص.

## التهيئة

اضبط ملف التعريف في الإعدادات:

```json5
{
  channels: {
    raft: {
      enabled: true,
      profile: "openclaw",
    },
  },
}
```

بالنسبة إلى الحساب الافتراضي، يمكنك بدلًا من ذلك ضبط `RAFT_PROFILE` في بيئة
Gateway:

```bash
RAFT_PROFILE=openclaw
```

استخدم حسابًا مسمّى عندما يتصل Gateway واحد بأكثر من وكيل Raft خارجي واحد:

```json5
{
  channels: {
    raft: {
      accounts: {
        support: {
          profile: "support-agent",
        },
        engineering: {
          profile: "engineering-agent",
        },
      },
    },
  },
}
```

يسجّل مسار الإعداد التفاعلي ملف التعريف نفسه:

```bash
openclaw channels setup raft
```

## كيف يعمل

عند بدء تشغيل Gateway، يقوم Plugin بما يلي:

1. يفتح نقطة نهاية HTTP للإيقاظ مقتصرة على حلقة الرجوع على منفذ مؤقت.
2. يشغّل `raft --profile <profile> agent bridge` مع نقطة النهاية تلك ورمز مميّز
   خاص بكل عملية.
3. لا يقبل إلا تلميحات الإيقاظ الموثّقة والخالية من المحتوى التي تتضمن هوية إعادة تشغيل من الجسر المحلي.
4. يتطلب واحدًا من `eventId` أو `attemptId` أو `messageId` أو `delivery_id` أو `wake_id` أو `id`.
5. يزيل تكرار تسليمات الإيقاظ المُعادَة حديثًا حسب معرّف حدث الجسر، بما في ذلك عبر عمليات إعادة تشغيل Gateway.
6. يعيد جلسة وقت تشغيل مستقرة للجسر الحالي ودفعة تفريغ نشاط فارغة لبروتوكول Raft CLI.
7. يبدأ دورة وكيل OpenClaw متسلسلة واحدة لكل إيقاظ مقبول.

يتولى الجسر عمليات إعادة محاولة التسليم وإعادة الاتصال الخاصة بـ Raft. لا تتلقى دورة OpenClaw
إلا إشعار إيقاظ، وليس نسخة من متن رسالة Raft. وتستخدم CLI لقراءة
الرسائل المعلّقة وإرسال ردها:

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft ليس وسيلة نقل عادية لرسائل الدفع. لا يرسل OpenClaw تلقائيًا
النص النهائي للنموذج مرة أخرى عبر الجسر، لذلك يجب على الوكيل استخدام
Raft CLI بعد معالجة إيقاظ.
</Note>

## التحقق

تحقق من أن OpenClaw يمكنه العثور على CLI وأن لديه ملف تعريفًا مهيأً:

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

ثم أرسل رسالة إلى وكيل Raft الخارجي. يجب أن يعرض سجل Gateway
بدء تشغيل جسر Raft، متبوعًا بإيقاظ وارد. يجب أن يستخدم الوكيل
ملف تعريف Raft المهيأ لفحص رسائله المعلّقة.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="Raft CLI is missing">
    ثبّت Raft CLI على مضيف Gateway واجعل `raft` متاحًا على
    `PATH` الخاص بالخدمة. تحقق منه باستخدام `raft --help`، ثم أعد تشغيل Gateway.
  </Accordion>
  <Accordion title="The bridge exits immediately">
    تحقق من أن ملف التعريف المهيأ مسجّل الدخول وينتمي إلى وكيل Raft الخارجي المقصود.
    شغّل `raft --profile <profile> agent bridge` مباشرةً
    لرؤية تشخيص CLI.
  </Accordion>
  <Accordion title="A wake arrives but no Raft response is sent">
    هذا متوقع عندما لا يستدعي الوكيل Raft CLI. لا يحمل جسر الإيقاظ
    متون الرسائل أو الردود النهائية التلقائية. تحقق من سياسة أدوات
    الوكيل وتأكد من أنه يستطيع تشغيل `raft --profile <profile> message
    check` و`message send`.
  </Accordion>
</AccordionGroup>

## المراجع

- [Raft](https://raft.build/)
- [وثائق Raft](https://docs.raft.build/welcome/)
- [تكامل Hermes مع Raft](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
