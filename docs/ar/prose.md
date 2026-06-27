---
read_when:
    - تريد تشغيل ملفات سير عمل .prose أو كتابتها
    - تريد تفعيل Plugin OpenProse
    - تحتاج إلى فهم كيفية ارتباط OpenProse بعناصر OpenClaw الأساسية
sidebarTitle: OpenProse
summary: OpenProse هو تنسيق سير عمل يرتكز على Markdown لجلسات الذكاء الاصطناعي متعددة الوكلاء. في OpenClaw، يأتي على هيئة Plugin يتضمن أمر شرطة مائلة /prose وحزمة مهارات.
title: OpenProse
x-i18n:
    generated_at: "2026-06-27T18:21:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde819215f99055c2a83ec32ed6e0700994654ca2d1d9c9dda98b71545f8a012
    source_path: prose.md
    workflow: 16
---

OpenProse هو تنسيق سير عمل محمول، يضع Markdown أولًا، لتنظيم جلسات الذكاء الاصطناعي. في OpenClaw يُشحن كـ Plugin يثبّت حزمة Skills خاصة بـ OpenProse وأمر شرطة مائلة `/prose`. تعيش البرامج في ملفات `.prose` ويمكنها إنشاء عدة وكلاء فرعيين مع تدفق تحكم صريح.

<CardGroup cols={3}>
  <Card title="Install" icon="download" href="#install">
    فعّل Plugin الخاص بـ OpenProse وأعد تشغيل Gateway.
  </Card>
  <Card title="Run a program" icon="play" href="#slash-command">
    استخدم `/prose run` لتنفيذ ملف `.prose` أو برنامج بعيد.
  </Card>
  <Card title="Write programs" icon="pencil" href="#example">
    ألّف سير عمل متعدد الوكلاء بخطوات متوازية ومتتابعة.
  </Card>
</CardGroup>

## التثبيت

<Steps>
  <Step title="Enable the plugin">
    تكون الـ plugins المضمّنة معطلة افتراضيًا. فعّل OpenProse:

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="Verify">
    ```bash
    openclaw plugins list | grep prose
    ```

    يجب أن ترى `open-prose` مفعّلًا. أصبح أمر Skills `/prose` متاحًا الآن
    في الدردشة.

  </Step>
</Steps>

للنسخة المحلية: `openclaw plugins install ./path/to/local/open-prose-plugin`

## أمر الشرطة المائلة

يسجّل OpenProse الأمر `/prose` كأمر Skills يمكن للمستخدم استدعاؤه:

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

عمليات التشغيل البعيدة على المستوى الأعلى صريحة. أما الاستيرادات البعيدة داخل برنامج `.prose` فهي
اعتماديات كود انتقالية: قبل أن يجلب OpenProse أي هدف `use` بعيد،
يعرض قائمة الاستيراد المحلولة ويتطلب من المشغّل الرد بالنص نفسه تمامًا
`approve remote prose imports` لتلك العملية.

## ما الذي يمكنه فعله

- بحث وتوليف متعدد الوكلاء مع توازٍ صريح.
- سير عمل قابلة للتكرار وآمنة بالموافقة (مراجعة الكود، فرز الحوادث، خطوط إنتاج المحتوى).
- برامج `.prose` قابلة لإعادة الاستخدام يمكنك تشغيلها عبر بيئات تشغيل الوكلاء المدعومة.

## مثال: بحث وتوليف متوازيان

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

## ربط بيئة تشغيل OpenClaw

تُربط برامج OpenProse بأساسيات OpenClaw:

| مفهوم OpenProse         | أداة OpenClaw    |
| ------------------------- | ---------------- |
| إنشاء جلسة / أداة Task | `sessions_spawn` |
| قراءة / كتابة ملف         | `read` / `write` |
| جلب الويب                 | `web_fetch`      |

<Warning>
  إذا كانت قائمة السماح للأدوات لديك تحظر `sessions_spawn` أو `read` أو `write` أو
  `web_fetch`، فستفشل برامج OpenProse. تحقق من
  [إعدادات قائمة السماح للأدوات](/ar/gateway/config-tools).
</Warning>

## مواقع الملفات

يحتفظ OpenProse بالحالة ضمن `.prose/` في مساحة عملك:

```text
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

تعيش الوكلاء الدائمون على مستوى المستخدم في:

```text
~/.prose/agents/
```

## خلفيات الحالة

<AccordionGroup>
  <Accordion title="filesystem (default)">
    تُكتب الحالة إلى `.prose/runs/...` في مساحة العمل. لا توجد
    اعتماديات إضافية مطلوبة.
  </Accordion>
  <Accordion title="in-context">
    حالة مؤقتة محفوظة في نافذة السياق. مناسبة للبرامج الصغيرة قصيرة العمر.
  </Accordion>
  <Accordion title="sqlite (experimental)">
    يتطلب وجود الملف التنفيذي `sqlite3` في `PATH`.
  </Accordion>
  <Accordion title="postgres (experimental)">
    يتطلب `psql` وسلسلة اتصال.

    <Warning>
      تتدفق بيانات اعتماد Postgres إلى سجلات الوكلاء الفرعيين. استخدم قاعدة بيانات مخصصة
      بأقل الامتيازات اللازمة.
    </Warning>

  </Accordion>
</AccordionGroup>

## الأمان

تعامل مع ملفات `.prose` مثل الكود. راجعها قبل التشغيل، بما في ذلك استيرادات
`use` البعيدة. تكون طلبات `/prose run https://...` على المستوى الأعلى صريحة، لكن
الاستيرادات البعيدة الانتقالية تتطلب موافقة لكل عملية تشغيل قبل جلبها أو
تنفيذها. استخدم قوائم السماح للأدوات في OpenClaw وبوابات الموافقة للتحكم في
الآثار الجانبية. لسير العمل الحتمية المحكومة بالموافقة، قارن مع
[Lobster](/ar/tools/lobster).

## ذات صلة

<CardGroup cols={2}>
  <Card title="Skills reference" href="/ar/tools/skills" icon="puzzle-piece">
    كيف تُحمَّل حزمة Skills الخاصة بـ OpenProse وما البوابات التي تنطبق.
  </Card>
  <Card title="Subagents" href="/ar/tools/subagents" icon="users">
    طبقة التنسيق الأصلية متعددة الوكلاء في OpenClaw.
  </Card>
  <Card title="Text-to-speech" href="/ar/tools/tts" icon="volume-high">
    أضف إخراجًا صوتيًا إلى سير عملك.
  </Card>
  <Card title="Slash commands" href="/ar/tools/slash-commands" icon="terminal">
    جميع أوامر الدردشة المتاحة، بما في ذلك /prose.
  </Card>
</CardGroup>

الموقع الرسمي: [https://www.prose.md](https://www.prose.md)
