---
read_when:
    - تريد تشغيل ملفات سير عمل .prose أو كتابتها
    - تريد تفعيل Plugin ‏OpenProse
    - تحتاج إلى فهم كيفية ربط OpenProse بالمكوّنات الأساسية في OpenClaw
sidebarTitle: OpenProse
summary: OpenProse هو تنسيق لسير العمل يعتمد على Markdown أولًا لجلسات الذكاء الاصطناعي متعددة الوكلاء. ويُضمَّن في OpenClaw بصفته Plugin مع أمر الشرطة المائلة ‎`/prose`‎ وحزمة Skills.
title: OpenProse
x-i18n:
    generated_at: "2026-07-12T06:25:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b04eb23bf827fbec6db11c1e95993e7f6c617451c5f4fda771ad078674c12bc
    source_path: prose.md
    workflow: 16
---

OpenProse هو تنسيق سير عمل قابل للنقل ويرتكز على Markdown، ومخصص لتنسيق جلسات الذكاء الاصطناعي. يأتي في OpenClaw على هيئة Plugin يثبّت حزمة Skills خاصة بـ OpenProse وأمر الشرطة المائلة `/prose`. توجد البرامج في ملفات `.prose` ويمكنها إنشاء عدة وكلاء فرعيين مع تحكم صريح في تدفق التنفيذ.

<CardGroup cols={3}>
  <Card title="التثبيت" icon="download" href="#install">
    فعّل Plugin ‏OpenProse وأعد تشغيل Gateway.
  </Card>
  <Card title="تشغيل برنامج" icon="play" href="#slash-command">
    استخدم `/prose run` لتنفيذ ملف `.prose` أو برنامج بعيد.
  </Card>
  <Card title="كتابة البرامج" icon="pencil" href="#example-parallel-research-and-synthesis">
    أنشئ تدفقات عمل متعددة الوكلاء بخطوات متوازية ومتسلسلة.
  </Card>
</CardGroup>

## التثبيت

<Steps>
  <Step title="تفعيل Plugin">
    يأتي OpenProse مضمّنًا، لكنه معطّل افتراضيًا. فعّله:

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="إعادة تشغيل Gateway">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="التحقق">
    ```bash
    openclaw plugins list | grep prose
    ```

    يفترض أن يظهر `open-prose` بوصفه مفعّلًا. أصبح أمر Skills ‏`/prose`
    متاحًا الآن في الدردشة.

  </Step>
</Steps>

يمكنك تثبيت Plugin مباشرةً من نسخة مستخرجة من المستودع:
`openclaw plugins install ./extensions/open-prose`

## أمر الشرطة المائلة

يسجّل OpenProse الأمر `/prose` بوصفه أمر Skills يمكن للمستخدم استدعاؤه:

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

يُحلّ `/prose run <handle/slug>` إلى `https://p.prose.md/<handle>/<slug>`.
تُجلب عناوين URL المباشرة كما هي باستخدام أداة `web_fetch`.

عمليات التشغيل البعيدة على المستوى الأعلى صريحة. أما الاستيرادات البعيدة داخل برنامج `.prose` فهي تبعيات برمجية متعدية: قبل أن يجلب OpenProse أي هدف `use` بعيد، يعرض قائمة الاستيرادات التي تم حلها ويطلب من المشغّل الرد بالنص المطابق تمامًا `approve remote prose imports` لهذه العملية.

## ما يمكنه فعله

- البحث والتوليف بواسطة عدة وكلاء مع توازٍ صريح.
- تدفقات عمل قابلة للتكرار وآمنة عبر الموافقات، مثل مراجعة الشيفرة وفرز الحوادث ومسارات معالجة المحتوى.
- برامج `.prose` قابلة لإعادة الاستخدام ويمكن تشغيلها عبر بيئات تشغيل الوكلاء المدعومة.

## مثال: البحث والتوليف بالتوازي

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

## الربط ببيئة تشغيل OpenClaw

تُربط برامج OpenProse بعناصر OpenClaw الأساسية:

| مفهوم OpenProse            | أداة OpenClaw                                    |
| ------------------------- | ----------------------------------------------- |
| إنشاء جلسة / أداة Task    | `sessions_spawn`                                |
| قراءة ملف / كتابته        | `read` / `write`                                |
| الجلب من الويب            | `web_fetch` (`exec` + curl عند الحاجة إلى POST) |

<Warning>
  إذا كانت قائمة الأدوات المسموح بها تحظر `sessions_spawn` أو `read` أو `write`
  أو `web_fetch`، فستفشل برامج OpenProse. تحقّق من
  [إعداد قائمة الأدوات المسموح بها](/ar/gateway/config-tools).
</Warning>

## مواقع الملفات

يحتفظ OpenProse بالحالة ضمن `.prose/` في مساحة عملك:

```text
.prose/
├── .env                      # config (key=value), e.g. OPENPROSE_POSTGRES_URL
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose     # copy of the running program
│       ├── state.md          # execution state
│       ├── bindings/
│       ├── imports/          # nested remote program runs
│       └── agents/
└── agents/                   # project-scoped persistent agents
```

توجد الوكلاء الدائمة على مستوى المستخدم، والمشتركة بين المشاريع، في:

```text
~/.prose/agents/
```

## خلفيات تخزين الحالة

<AccordionGroup>
  <Accordion title="نظام الملفات (الافتراضي)">
    تُكتب الحالة في `.prose/runs/...` ضمن مساحة العمل. لا يلزم وجود
    تبعيات إضافية.
  </Accordion>
  <Accordion title="داخل السياق">
    تُحفظ الحالة المؤقتة في نافذة السياق؛ اخترها باستخدام `--in-context`.
    وهي مناسبة للبرامج الصغيرة وقصيرة العمر.
  </Accordion>
  <Accordion title="sqlite (تجريبي)">
    اختره باستخدام `--state=sqlite`. يتطلب الملف التنفيذي `sqlite3` ضمن `PATH`
    (ويعود إلى نظام الملفات عند عدم توفره)؛ وتُحفظ الحالة في
    `.prose/runs/{id}/state.db`.
  </Accordion>
  <Accordion title="postgres (تجريبي)">
    اختره باستخدام `--state=postgres`. يتطلب `psql` وسلسلة اتصال في
    `OPENPROSE_POSTGRES_URL` (اضبطها في `.prose/.env`).

    <Warning>
      تنتقل بيانات اعتماد Postgres إلى سجلات الوكلاء الفرعيين. استخدم قاعدة بيانات
      مخصصة وبأقل قدر من الصلاحيات.
    </Warning>

  </Accordion>
</AccordionGroup>

## الأمان

تعامل مع ملفات `.prose` كما تتعامل مع الشيفرة. راجعها قبل التشغيل، بما في ذلك استيرادات `use` البعيدة. طلبات `/prose run https://...` على المستوى الأعلى صريحة، لكن الاستيرادات البعيدة المتعدية تتطلب موافقة لكل عملية تشغيل قبل جلبها أو تنفيذها. استخدم قوائم أدوات OpenClaw المسموح بها وبوابات الموافقة للتحكم في الآثار الجانبية. بالنسبة إلى تدفقات العمل الحتمية والخاضعة للموافقة، قارنها مع [Lobster](/ar/tools/lobster).

## ذو صلة

<CardGroup cols={2}>
  <Card title="مرجع Skills" href="/ar/tools/skills" icon="puzzle-piece">
    كيفية تحميل حزمة Skills الخاصة بـ OpenProse والضوابط التي تنطبق عليها.
  </Card>
  <Card title="الوكلاء الفرعيون" href="/ar/tools/subagents" icon="users">
    طبقة OpenClaw الأصلية لتنسيق عدة وكلاء.
  </Card>
  <Card title="تحويل النص إلى كلام" href="/ar/tools/tts" icon="volume-high">
    أضف مخرجات صوتية إلى تدفقات عملك.
  </Card>
  <Card title="أوامر الشرطة المائلة" href="/ar/tools/slash-commands" icon="terminal">
    جميع أوامر الدردشة المتاحة، بما فيها /prose.
  </Card>
</CardGroup>

الموقع الرسمي: [https://www.prose.md](https://www.prose.md)
