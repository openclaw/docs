---
read_when:
    - تريد ربط OpenClaw بمساحة عمل Raft
    - أنت تقوم بإعداد وكيل Raft خارجي
    - أنت تعمل على تصحيح أخطاء تسليم التنبيه في Raft
sidebarTitle: Raft
summary: دعم الوكيل الخارجي لـ Raft عبر جسر الإيقاظ في CLI الخاص بـ Raft
title: رَفت
x-i18n:
    generated_at: "2026-07-12T05:35:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 454d92d764a4ec3b0ec52467cba254dcad795870e04d1d32d4cf65d8b451a0de
    source_path: channels/raft.md
    workflow: 16
---

يربط Raft وكيل OpenClaw بوكيل Raft خارجي عبر CLI المحلي لـ Raft. يرسل Raft تلميحات تنبيه مصادَقًا عليها إلى Gateway؛ ثم يستخدم الوكيل CLI لـ Raft للتحقق من الرسائل وإرسالها. المحادثات المباشرة فقط (من دون مجموعات).

## التثبيت

Raft هو Plugin خارجي رسمي. ثبّته على مضيف Gateway:

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

التفاصيل: [الإضافات](/ar/tools/plugin)

## المتطلبات الأساسية

- مساحة عمل Raft تحتوي على وكيل خارجي.
- تثبيت CLI لـ Raft على المضيف نفسه الذي يشغّل Gateway الخاص بـ OpenClaw، وأن يكون متاحًا ضمن `PATH` الخاص بالخدمة.
- ملف تعريف في CLI لـ Raft سبق تسجيل الدخول إليه وربطه بذلك الوكيل الخارجي.

لا يخزّن Plugin بيانات اعتماد Raft؛ إذ يحتفظ CLI لـ Raft بهذه المصادقة في ملف تعريفه الخاص.

## الإعداد

عيّن ملف التعريف في الإعدادات:

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

بالنسبة إلى الحساب الافتراضي، يمكنك بدلًا من ذلك تعيين `RAFT_PROFILE` في بيئة Gateway:

```bash
RAFT_PROFILE=openclaw
```

استخدم حسابًا مسمّى عندما يتصل Gateway واحد بأكثر من وكيل Raft خارجي:

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

يسجّل الإعداد التفاعلي ملف التعريف نفسه:

```bash
openclaw channels add --channel raft
```

## آلية العمل

عند بدء تشغيل Gateway، ينفّذ Plugin ما يلي:

1. يفتح نقطة نهاية HTTP للتنبيه مقتصرة على local loopback عبر منفذ مؤقت.
2. يشغّل `raft --profile <profile> agent bridge` باستخدام نقطة النهاية هذه ورمز مميز خاص بكل عملية.
3. لا يقبل إلا تلميحات تنبيه مصادَقًا عليها وخالية من المحتوى، وتحمل هوية لمنع إعادة التشغيل، من الجسر المحلي.
4. يشترط وجود أحد الحقول `eventId` أو `attemptId` أو `messageId` أو `delivery_id` أو `wake_id` أو `id` في كل حمولة تنبيه.
5. يزيل تكرار عمليات تسليم التنبيه المعاد إرسالها استنادًا إلى معرّف حدث الجسر لمدة 24 ساعة، بما في ذلك عبر عمليات إعادة تشغيل Gateway.
6. يعيد جلسة وقت تشغيل مستقرة للجسر الحالي ودفعة فارغة لتفريغ النشاط لبروتوكول CLI لـ Raft.
7. يبدأ دورة واحدة متسلسلة لوكيل OpenClaw لكل تنبيه مقبول.

يتولى الجسر إعادة محاولات التسليم وإعادة الاتصال في Raft. لا تتلقى دورة OpenClaw سوى إشعار تنبيه، وليس نسخة من نص رسالة Raft. وتستخدم CLI لقراءة الرسائل المعلّقة وإرسال ردها:

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft ليس وسيلة نقل للرسائل الفورية. لا يرسل OpenClaw النص النهائي للنموذج تلقائيًا عبر الجسر، لذا يجب على الوكيل استخدام CLI لـ Raft بعد معالجة التنبيه.
</Note>

## التحقق

تحقق من أن OpenClaw يستطيع العثور على CLI وأن لديه ملف تعريف مُعدًا:

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

ثم أرسل رسالة إلى وكيل Raft الخارجي. ينبغي أن يعرض سجل Gateway بدء تشغيل جسر Raft، يتبعه تنبيه وارد. وينبغي أن يستخدم الوكيل ملف تعريف Raft المُعد للتحقق من رسائله المعلّقة.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="CLI لـ Raft مفقود">
    ثبّت CLI لـ Raft على مضيف Gateway واجعل `raft` متاحًا ضمن `PATH` الخاص بالخدمة. تحقق منه باستخدام `raft --help`، ثم أعد تشغيل Gateway.
  </Accordion>
  <Accordion title="يُغلق الجسر فورًا">
    تحقق من تسجيل الدخول إلى ملف التعريف المُعد ومن أنه ينتمي إلى وكيل Raft الخارجي المقصود. شغّل `raft --profile <profile> agent bridge` مباشرةً للاطلاع على تشخيص CLI.
  </Accordion>
  <Accordion title="يصل تنبيه ولكن لا يُرسل رد عبر Raft">
    هذا متوقع عندما لا يستدعي الوكيل CLI لـ Raft. لا ينقل جسر التنبيه نصوص الرسائل أو الردود النهائية التلقائية. تحقق من سياسة أدوات الوكيل وتأكد من قدرته على تشغيل `raft --profile <profile>
    message check` و`message send`.
  </Accordion>
</AccordionGroup>

## المراجع

- [Raft](https://raft.build/)
- [وثائق Raft](https://docs.raft.build/welcome/)
- [تكامل Hermes مع Raft](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
