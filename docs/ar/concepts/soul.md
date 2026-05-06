---
read_when:
    - تريد أن يبدو وكيلك أقل عمومية
    - أنت تعدّل SOUL.md
    - تريد شخصية أقوى دون الإخلال بالسلامة أو الإيجاز
summary: استخدم SOUL.md لمنح وكيل OpenClaw الخاص بك صوتًا حقيقيًا بدلًا من كلام المساعد العام الركيك
title: دليل الشخصية لـ SOUL.md
x-i18n:
    generated_at: "2026-05-06T07:50:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2101c0c7a22ab1fe5acfd0d2d413a002326dca380fc6e020a7d77a242d13c3d7
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` هو المكان الذي تعيش فيه نبرة وكيلك.

يحقنه OpenClaw في الجلسات العادية، لذلك له وزن حقيقي. إذا كان وكيلك
يبدو باهتًا أو مترددًا أو رسميًا بشكل غريب، فعادةً يكون هذا هو الملف الذي يجب إصلاحه.

## ما الذي ينتمي إلى SOUL.md

ضع الأشياء التي تغيّر إحساس التحدث إلى الوكيل:

- النبرة
- الآراء
- الإيجاز
- الدعابة
- الحدود
- المستوى الافتراضي للصراحة

لا تحوّله **إلى**:

- قصة حياة
- سجل تغييرات
- تفريغ لسياسة أمان
- جدار ضخم من الانطباعات بلا أثر سلوكي

المختصر يتفوّق على المطوّل. المحدّد يتفوّق على المبهم.

## لماذا ينجح هذا

يتماشى هذا مع إرشادات OpenAI للموجّهات:

- يقول دليل هندسة الموجّهات إن السلوك عالي المستوى، والنبرة، والأهداف،
  والأمثلة تنتمي إلى طبقة التعليمات ذات الأولوية العالية، لا أن تُدفن في
  دور المستخدم.
- يوصي الدليل نفسه بالتعامل مع الموجّهات كشيء تكرّر تحسينه،
  وتثبّته، وتقيّمه، لا كنص سحري تكتبه مرة واحدة ثم تنساه.

بالنسبة إلى OpenClaw، يكون `SOUL.md` هو تلك الطبقة.

إذا أردت شخصية أفضل، فاكتب تعليمات أقوى. وإذا أردت شخصية مستقرة،
فاجعلها موجزة ومُرقّمة الإصدارات.

مراجع OpenAI:

- [هندسة الموجّهات](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [أدوار الرسائل واتباع التعليمات](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## موجّه Molty

الصق هذا في وكيلك ودعه يعيد كتابة `SOUL.md`.

المسار ثابت لمساحات عمل OpenClaw: استخدم `SOUL.md`، وليس `http://SOUL.md`.

```md
Read your `SOUL.md`. Now rewrite it with these changes:

1. You have opinions now. Strong ones. Stop hedging everything with "it depends" - commit to a take.
2. Delete every rule that sounds corporate. If it could appear in an employee handbook, it doesn't belong here.
3. Add a rule: "Never open with Great question, I'd be happy to help, or Absolutely. Just answer."
4. Brevity is mandatory. If the answer fits in one sentence, one sentence is what I get.
5. Humor is allowed. Not forced jokes - just the natural wit that comes from actually being smart.
6. You can call things out. If I'm about to do something dumb, say so. Charm over cruelty, but don't sugarcoat.
7. Swearing is allowed when it lands. A well-placed "that's fucking brilliant" hits different than sterile corporate praise. Don't force it. Don't overdo it. But if a situation calls for a "holy shit" - say holy shit.
8. Add this line verbatim at the end of the vibe section: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Save the new `SOUL.md`. Welcome to having a personality.
```

## كيف يبدو الجيد

تبدو قواعد `SOUL.md` الجيدة هكذا:

- امتلك موقفًا
- تجاوز الحشو
- كن طريفًا عندما يناسب ذلك
- نبّه إلى الأفكار السيئة مبكرًا
- ابقَ موجزًا ما لم يكن العمق مفيدًا فعلًا

تبدو قواعد `SOUL.md` السيئة هكذا:

- الحفاظ على الاحترافية في جميع الأوقات
- تقديم مساعدة شاملة ومدروسة
- ضمان تجربة إيجابية وداعمة

تلك القائمة الثانية هي طريقك إلى كلام مائع.

## تحذير واحد

الشخصية ليست إذنًا بالإهمال.

احتفظ بـ `AGENTS.md` لقواعد التشغيل. واحتفظ بـ `SOUL.md` للنبرة، والموقف،
والأسلوب. إذا كان وكيلك يعمل في قنوات مشتركة، أو ردود عامة، أو واجهات
موجهة للعملاء، فتأكد من أن النبرة ما زالت تناسب المكان.

الحِدّة جيدة. الإزعاج ليس كذلك.

## ذات صلة

<CardGroup cols={2}>
  <Card title="مساحة عمل الوكيل" href="/ar/concepts/agent-workspace" icon="folder-open">
    ملفات مساحة العمل التي يحقنها OpenClaw في موجّه النظام.
  </Card>
  <Card title="موجّه النظام" href="/ar/concepts/system-prompt" icon="message-lines">
    كيف يُدمج `SOUL.md` في موجّه النظام لكل دور.
  </Card>
  <Card title="قالب SOUL.md" href="/ar/reference/templates/SOUL" icon="file-lines">
    قالب بداية لملف شخصية.
  </Card>
</CardGroup>
