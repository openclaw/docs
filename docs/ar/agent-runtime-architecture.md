---
summary: كيفية تشغيل OpenClaw لوقت تشغيل الوكيل المضمّن، والمزوّدين، والجلسات، والأدوات، والامتدادات.
title: بنية وقت تشغيل الوكيل
x-i18n:
    generated_at: "2026-06-27T17:08:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd0ca61b10a4f7029590da8566b22cc44cf801af162e5f2c00c9561fe46e39e3
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw يمتلك وقت تشغيل الوكيل المضمّن مباشرةً. توجد شيفرة وقت التشغيل ضمن `src/agents/`، وتوجد مساعدات النموذج/المزوّد ضمن `src/llm/`، وتُعرَض العقود الموجّهة إلى Plugin عبر براميل `openclaw/plugin-sdk/*`.

## تخطيط وقت التشغيل

- `src/agents/embedded-agent-runner/`: حلقة محاولة الوكيل المضمّنة، ومحوّلات تدفق المزوّد، وCompaction، واختيار النموذج، وتوصيل الجلسة.
- `src/agents/sessions/`: استمرارية الجلسة، وتحميل الامتدادات، واكتشاف الموارد، وSkills، والمطالبات، والسمات، وعارضات الأدوات المدعومة من TUI.
- `packages/agent-core/`: نواة وكيل قابلة لإعادة الاستخدام، وأنواع حزام الاختبار ذات المستوى الأدنى، والرسائل، ومساعدات Compaction، وقوالب المطالبات، وعقود الأدوات/الجلسات.
- `src/agents/runtime/`: واجهة OpenClaw لـ `@openclaw/agent-core` بالإضافة إلى أدوات الوكيل المحلي.
- `src/agents/agent-tools*.ts`: تعريفات الأدوات والمخططات والسياسة المملوكة لـ OpenClaw، ومحوّلات خطافات ما قبل/ما بعد، ودعم تحرير المضيف.
- `src/agents/agent-hooks/`: خطافات وقت التشغيل المضمّنة مثل ضمانات Compaction وتقليص السياق.
- `src/llm/`: سجل النماذج/المزوّدين، ومساعدات النقل، وتنفيذات التدفق الخاصة بالمزوّدين.

## الحدود

تستدعي شيفرة النواة وقت التشغيل المضمّن عبر وحدات OpenClaw وبراميل SDK، وليس عبر حزم وكلاء خارجية قديمة. تستخدم Plugins نقاط الدخول الموثّقة `openclaw/plugin-sdk/*` ولا تستورد الأجزاء الداخلية `src/**`.

يبقى `@earendil-works/pi-tui` تبعية TUI خارجية. يُستخدم كمجموعة أدوات لمكوّنات الطرفية بواسطة TUI المحلي وعارضات الجلسات؛ وسيكون استيعابه داخليًا جهد توريد منفصلًا.

## البيانات التعريفية

تعلن حزم الموارد موارد OpenClaw في بيانات الحزمة التعريفية:

```json
{
  "openclaw": {
    "extensions": ["extensions/index.ts"],
    "skills": ["skills/*.md"],
    "prompts": ["prompts/*.md"],
    "themes": ["themes/*.json"]
  }
}
```

يكتشف مدير الحزم أيضًا أدلة `extensions/` و`skills/` و`prompts/` و`themes/` التقليدية.

## اختيار وقت التشغيل

معرّف وقت التشغيل المضمّن الافتراضي هو `openclaw`. يمكن لأحزمة اختبار Plugin تسجيل معرّفات وقت تشغيل إضافية. يختار `auto` حزام اختبار Plugin داعمًا عند وجوده، وإلا فإنه يستخدم وقت تشغيل OpenClaw المضمّن.

## ذات صلة

- [سير عمل وقت تشغيل وكيل OpenClaw](/ar/openclaw-agent-runtime)
- [أوقات تشغيل الوكلاء](/ar/concepts/agent-runtimes)
