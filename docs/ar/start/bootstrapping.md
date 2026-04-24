---
read_when:
    - فهم ما يحدث عند أول تشغيل للوكيل
    - شرح مكان وجود ملفات التمهيد
    - تصحيح إعداد الهوية أثناء onboarding
sidebarTitle: Bootstrapping
summary: طقس تمهيد الوكيل الذي يملأ مساحة العمل وملفات الهوية
title: تمهيد الوكيل
x-i18n:
    generated_at: "2026-04-24T08:05:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c23a204a7afbf2ca0c0d19a227286cf0ae396181073403055db41dafa764d2a
    source_path: start/bootstrapping.md
    workflow: 15
---

التمهيد هو طقس **التشغيل الأول** الذي يجهز مساحة عمل الوكيل
ويجمع تفاصيل الهوية. ويحدث بعد onboarding، عندما يبدأ الوكيل
للمرة الأولى.

## ما الذي يفعله التمهيد

عند أول تشغيل للوكيل، يقوم OpenClaw بتمهيد مساحة العمل (الافتراضية
`~/.openclaw/workspace`):

- يملأ `AGENTS.md` و`BOOTSTRAP.md` و`IDENTITY.md` و`USER.md`.
- يشغّل طقس أسئلة وأجوبة قصير (سؤال واحد في كل مرة).
- يكتب الهوية + التفضيلات إلى `IDENTITY.md` و`USER.md` و`SOUL.md`.
- يزيل `BOOTSTRAP.md` عند الانتهاء حتى لا يعمل إلا مرة واحدة.

## أين يعمل

يعمل التمهيد دائمًا على **مضيف gateway**. وإذا كان تطبيق macOS يتصل بـ
Gateway بعيدة، فإن مساحة العمل وملفات التمهيد توجد على ذلك الجهاز
البعيد.

<Note>
عندما تعمل Gateway على جهاز آخر، حرر ملفات مساحة العمل على مضيف gateway
(على سبيل المثال، `user@gateway-host:~/.openclaw/workspace`).
</Note>

## الوثائق ذات الصلة

- onboarding لتطبيق macOS: ‏[Onboarding](/ar/start/onboarding)
- تخطيط مساحة العمل: ‏[مساحة عمل الوكيل](/ar/concepts/agent-workspace)
