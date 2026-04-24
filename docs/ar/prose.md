---
read_when:
    - تريد تشغيل أو كتابة مسارات عمل `.prose`
    - تريد تفعيل Plugin ‏OpenProse
    - تحتاج إلى فهم تخزين الحالة
summary: 'OpenProse: مسارات عمل `.prose`، وأوامر الشرطة المائلة، والحالة في OpenClaw'
title: OpenProse
x-i18n:
    generated_at: "2026-04-24T07:57:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1d6f3aa64c403daedaeaa2d7934b8474c0756fe09eed09efd1efeef62413e9e
    source_path: prose.md
    workflow: 15
---

OpenProse هو تنسيق مسارات عمل محمول يعتمد على Markdown أولًا لتنسيق جلسات الذكاء الاصطناعي. وفي OpenClaw يأتي على هيئة Plugin يثبّت حزمة Skills لـ OpenProse بالإضافة إلى أمر الشرطة المائلة `/prose`. وتعيش البرامج في ملفات `.prose` ويمكنها تشغيل عدة وكلاء فرعيين مع تدفق تحكم صريح.

الموقع الرسمي: [https://www.prose.md](https://www.prose.md)

## ما الذي يمكنه فعله

- بحث وتركيب متعدد الوكلاء مع توازٍ صريح.
- مسارات عمل قابلة للتكرار وآمنة من ناحية الموافقات (مراجعة الشيفرة، وفرز الحوادث، ومسارات محتوى).
- برامج `.prose` قابلة لإعادة الاستخدام يمكنك تشغيلها عبر بيئات الوكلاء المدعومة.

## التثبيت + التفعيل

تكون Plugins المضمنة معطلة افتراضيًا. فعّل OpenProse:

```bash
openclaw plugins enable open-prose
```

أعد تشغيل Gateway بعد تفعيل Plugin.

نسخة تطوير/checkout محلية: `openclaw plugins install ./path/to/local/open-prose-plugin`

وثائق ذات صلة: [Plugins](/ar/tools/plugin)، [بيان Plugin](/ar/plugins/manifest)، [Skills](/ar/tools/skills).

## أمر الشرطة المائلة

يسجل OpenProse الأمر `/prose` كأمر Skill يمكن للمستخدم استدعاؤه. وهو يوجّه إلى تعليمات OpenProse VM ويستخدم أدوات OpenClaw في الخلفية.

أوامر شائعة:

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## مثال: ملف `.prose` بسيط

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
context: { findings, draft }
```

## مواقع الملفات

يحتفظ OpenProse بالحالة تحت `.prose/` في مساحة العمل الخاصة بك:

```
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

توجد الوكلاء الدائمون على مستوى المستخدم في:

```
~/.prose/agents/
```

## أوضاع الحالة

يدعم OpenProse عدة واجهات خلفية للحالة:

- **filesystem** (الافتراضي): `.prose/runs/...`
- **in-context**: مؤقت، للبرامج الصغيرة
- **sqlite** (تجريبي): يتطلب الملف التنفيذي `sqlite3`
- **postgres** (تجريبي): يتطلب `psql` وسلسلة اتصال

ملاحظات:

- يعد sqlite/postgres اختياريين وتجريبيين.
- تنتقل بيانات اعتماد postgres إلى سجلات الوكلاء الفرعيين؛ استخدم قاعدة بيانات مخصصة ذات أقل قدر من الامتيازات.

## البرامج البعيدة

يقوم `/prose run <handle/slug>` بتحليل المسار إلى `https://p.prose.md/<handle>/<slug>`.
أما عناوين URL المباشرة فيتم جلبها كما هي. ويستخدم هذا أداة `web_fetch` ‏(أو `exec` من أجل POST).

## تعيين وقت تشغيل OpenClaw

تُعيَّن برامج OpenProse إلى بدائيات OpenClaw:

| مفهوم OpenProse            | أداة OpenClaw   |
| -------------------------- | --------------- |
| تشغيل جلسة / أداة Task tool | `sessions_spawn` |
| قراءة/كتابة الملفات        | `read` / `write` |
| جلب الويب                  | `web_fetch`     |

إذا كانت قائمة السماح الخاصة بالأدوات تمنع هذه الأدوات، فستفشل برامج OpenProse. راجع [إعداد Skills](/ar/tools/skills-config).

## الأمان + الموافقات

تعامل مع ملفات `.prose` كما تتعامل مع الشيفرة. راجعها قبل التشغيل. واستخدم قوائم السماح الخاصة بالأدوات في OpenClaw وبوابات الموافقة للتحكم في الآثار الجانبية.

وبالنسبة إلى مسارات العمل الحتمية والمحكومة بالموافقة، قارنها مع [Lobster](/ar/tools/lobster).

## ذو صلة

- [تحويل النص إلى كلام](/ar/tools/tts)
- [تنسيق Markdown](/ar/concepts/markdown-formatting)
