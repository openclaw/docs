---
read_when:
    - تريد أن يبدو وكيلك أقل عمومية
    - أنت تعدّل SOUL.md
    - تريد شخصية أقوى دون الإخلال بالسلامة أو الإيجاز
summary: استخدم SOUL.md لمنح وكيل OpenClaw صوتًا حقيقيًا بدلًا من ركاكة المساعد العام
title: دليل شخصية SOUL.md
x-i18n:
    generated_at: "2026-06-27T17:33:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d916e5c9a97f25b53c93da7969583a535b48ad49e02c30bbbbf2dbe0da0f589a
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` هو المكان الذي تعيش فيه نبرة وكيلك.

يدمجه OpenClaw في الجلسات العادية، لذلك له وزن فعلي. إذا كان وكيلك
يبدو باهتًا، مترددًا، أو مؤسسيًا بشكل غريب، فهذا غالبًا هو الملف الذي يجب إصلاحه.

## ما الذي ينتمي إلى SOUL.md

ضع الأشياء التي تغيّر شعور التحدث إلى الوكيل:

- النبرة
- الآراء
- الإيجاز
- الفكاهة
- الحدود
- المستوى الافتراضي من الصراحة

لا تحوّله إلى:

- قصة حياة
- سجل تغييرات
- تفريغ لسياسة أمنية
- جدار ضخم من الانطباعات بلا أثر سلوكي

المختصر يغلب الطويل. الواضح الحاد يغلب المبهم.

## لماذا ينجح هذا

يتوافق هذا مع إرشادات المطالبات من OpenAI:

- يقول دليل هندسة المطالبات إن السلوك عالي المستوى، والنبرة، والأهداف،
  والأمثلة تنتمي إلى طبقة التعليمات عالية الأولوية، لا أن تُدفن داخل
  رسالة المستخدم.
- يوصي الدليل نفسه بالتعامل مع المطالبات كشيء تكرّر تحسينه،
  وتثبّته، وتقيّمه، لا كنص سحري تكتبه مرة واحدة ثم تنساه.

بالنسبة إلى OpenClaw، فإن `SOUL.md` هو تلك الطبقة.

إذا أردت شخصية أفضل، فاكتب تعليمات أقوى. وإذا أردت شخصية مستقرة،
فاجعلها موجزة ومُدارة بالإصدارات.

مراجع OpenAI:

- [هندسة المطالبات](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [أدوار الرسائل واتباع التعليمات](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## مطالبة Molty

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

- امتلك رأيًا
- تجاوز الحشو
- كن مضحكًا عندما يناسب ذلك
- نبّه إلى الأفكار السيئة مبكرًا
- ابقَ موجزًا إلا إذا كان العمق مفيدًا فعلًا

وتبدو قواعد `SOUL.md` السيئة هكذا:

- الحفاظ على الاحترافية في جميع الأوقات
- تقديم مساعدة شاملة ومدروسة
- ضمان تجربة إيجابية وداعمة

القائمة الثانية هي كيف تحصل على كلام مائع.

## تحذير واحد

الشخصية ليست إذنًا بالإهمال.

أبقِ `AGENTS.md` لقواعد التشغيل. وأبقِ `SOUL.md` للصوت، والموقف،
والأسلوب. إذا كان وكيلك يعمل في قنوات مشتركة، أو ردود عامة، أو واجهات
للعملاء، فتأكد أن النبرة ما زالت تلائم السياق.

الحدة جيدة. الإزعاج ليس كذلك.

## ذو صلة

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/ar/concepts/agent-workspace" icon="folder-open">
    ملفات مساحة العمل التي يحقنها OpenClaw في سياق النموذج.
  </Card>
  <Card title="System prompt" href="/ar/concepts/system-prompt" icon="message-lines">
    كيف يُركَّب `SOUL.md` داخل سياق تشغيل OpenClaw وCodex.
  </Card>
  <Card title="SOUL.md template" href="/ar/reference/templates/SOUL" icon="file-lines">
    قالب بداية لملف شخصية.
  </Card>
</CardGroup>
