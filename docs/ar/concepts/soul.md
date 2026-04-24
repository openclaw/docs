---
read_when:
    - أنت تريد أن يبدو وكيلك أقل عمومية
    - أنت بصدد تحرير `SOUL.md`
    - أنت تريد شخصية أقوى من دون الإخلال بالأمان أو الإيجاز
summary: استخدم `SOUL.md` لمنح وكيل OpenClaw صوتًا حقيقيًا بدلًا من ركاكة المساعدات العامة
title: دليل الشخصية لـ `SOUL.md`
x-i18n:
    generated_at: "2026-04-24T07:39:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: c0268ef086f272257c83e2147ec1f4fa7772645cdd93cdf59dd4e661a311830a
    source_path: concepts/soul.md
    workflow: 15
---

`SOUL.md` هو المكان الذي يعيش فيه صوت وكيلك.

يقوم OpenClaw بحقنه في الجلسات العادية، لذلك له وزن حقيقي. إذا كان وكيلك
يبدو باهتًا، أو مترددًا، أو مؤسسيًا بشكل غريب، فعادةً ما يكون هذا هو الملف الذي يجب إصلاحه.

## ما الذي يجب أن يوجد في SOUL.md

ضع الأشياء التي تغيّر الإحساس أثناء التحدث إلى الوكيل:

- النبرة
- الآراء
- الإيجاز
- الفكاهة
- الحدود
- المستوى الافتراضي من الصراحة

**لا** تحوله إلى:

- قصة حياة
- سجل تغييرات
- تفريغ لسياسات الأمان
- جدار ضخم من الأجواء من دون أي أثر سلوكي

القصير أفضل من الطويل. والحاد أفضل من الغامض.

## لماذا ينجح هذا

هذا يتماشى مع إرشادات OpenAI الخاصة بالمطالبات:

- يقول دليل هندسة المطالبات إن السلوك عالي المستوى، والنبرة، والأهداف،
  والأمثلة يجب أن تكون في طبقة التعليمات عالية الأولوية، لا مدفونة في
  دور المستخدم.
- ويوصي الدليل نفسه بالتعامل مع المطالبات على أنها شيء تكرره،
  وتثبّته، وتقيّمه، لا كنص سحري تكتبه مرة واحدة ثم تنساه.

بالنسبة إلى OpenClaw، فإن `SOUL.md` هو تلك الطبقة.

إذا كنت تريد شخصية أفضل، فاكتب تعليمات أقوى. وإذا كنت تريد شخصية
مستقرة، فأبقها موجزة ومُصدَّرة بالإصدارات.

مراجع OpenAI:

- [هندسة المطالبات](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [أدوار الرسائل واتباع التعليمات](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## مطالبة Molty

الصق هذا في وكيلك ودعه يعيد كتابة `SOUL.md`.

المسار ثابت في مساحات عمل OpenClaw: استخدم `SOUL.md`، وليس `http://SOUL.md`.

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

## كيف يبدو الشكل الجيد

تبدو قواعد `SOUL.md` الجيدة هكذا:

- امتلك رأيًا
- تخطَّ الحشو
- كن مضحكًا عندما يناسب ذلك
- أشر إلى الأفكار السيئة مبكرًا
- ابقَ موجزًا ما لم يكن العمق مفيدًا فعلاً

وتبدو قواعد `SOUL.md` السيئة هكذا:

- حافظ على الاحترافية في جميع الأوقات
- قدّم مساعدة شاملة ومدروسة
- احرص على توفير تجربة إيجابية وداعمة

هذه القائمة الثانية هي كيف تحصل على كلام هلامي.

## تحذير واحد

الشخصية ليست إذنًا بالفوضى.

احتفظ بـ `AGENTS.md` لقواعد التشغيل. واحتفظ بـ `SOUL.md` للصوت، والموقف،
والأسلوب. وإذا كان وكيلك يعمل في قنوات مشتركة، أو ردود عامة، أو أسطح
موجهة للعملاء، فتأكد من أن النبرة ما تزال مناسبة للمقام.

الحدة جيدة. الإزعاج ليس كذلك.

## مستندات ذات صلة

- [مساحة عمل الوكيل](/ar/concepts/agent-workspace)
- [مطالبة النظام](/ar/concepts/system-prompt)
- [قالب SOUL.md](/ar/reference/templates/SOUL)
