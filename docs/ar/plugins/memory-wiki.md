---
read_when:
    - أنت تريد معرفة دائمة تتجاوز ملاحظات MEMORY.md العادية
    - أنت تقوم بتكوين plugin المضمّن memory-wiki
    - أنت تريد فهم wiki_search أو wiki_get أو وضع الجسر
summary: 'memory-wiki: مخزن معرفة مُجمَّع مع المصدرية، والادعاءات، ولوحات المعلومات، ووضع الجسر'
title: ويكي الذاكرة
x-i18n:
    generated_at: "2026-04-08T06:01:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: b78dd6a4ef4451dae6b53197bf0c7c2a2ba846b08e4a3a93c1026366b1598d82
    source_path: plugins/memory-wiki.md
    workflow: 15
---

# ويكي الذاكرة

`memory-wiki` هو plugin مضمّن يحول الذاكرة الدائمة إلى
مخزن معرفة مُجمَّع.

وهو **لا** يستبدل plugin الذاكرة النشط. لا يزال plugin الذاكرة النشط
يتولى الاستدعاء، والترقية، والفهرسة، والحلم. ويأتي `memory-wiki` إلى جانبه
ويجمع المعرفة الدائمة في ويكي قابل للتصفح مع صفحات حتمية،
وادعاءات منظَّمة، ومصدرية، ولوحات معلومات، وملخصات قابلة للقراءة آليًا.

استخدمه عندما تريد أن تتصرف الذاكرة بشكل أقرب إلى طبقة معرفة مُدارة
وأقل شبهًا بكومة من ملفات Markdown.

## ما الذي يضيفه

- مخزن ويكي مخصص مع تخطيط صفحات حتمي
- بيانات وصفية منظَّمة للادعاءات والأدلة، وليس مجرد نص
- مصدرية على مستوى الصفحة، وثقة، وتناقضات، وأسئلة مفتوحة
- ملخصات مُجمَّعة لمستهلكي الوكيل/وقت التشغيل
- أدوات أصلية للويكي للبحث/الجلب/التطبيق/الفحص
- وضع جسر اختياري يستورد القطع الأثرية العامة من plugin الذاكرة النشط
- وضع عرض اختياري ملائم لـ Obsidian وتكامل مع CLI

## كيف ينسجم مع الذاكرة

فكر في التقسيم على هذا النحو:

| الطبقة                                                   | ما الذي تتولاه                                                                               |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| plugin الذاكرة النشط (`memory-core`، QMD، Honcho، إلخ) | الاستدعاء، والبحث الدلالي، والترقية، والحلم، ووقت تشغيل الذاكرة                               |
| `memory-wiki`                                           | صفحات ويكي مُجمَّعة، وعمليات تركيب غنية بالمصدرية، ولوحات معلومات، وبحث/جلب/تطبيق خاص بالويكي |

إذا كان plugin الذاكرة النشط يوفّر قطعًا أثرية مشتركة للاستدعاء، يمكن لـ OpenClaw
البحث في كلتا الطبقتين في مرور واحد باستخدام `memory_search corpus=all`.

وعندما تحتاج إلى ترتيب خاص بالويكي، أو مصدرية، أو وصول مباشر إلى الصفحة، استخدم
الأدوات الأصلية للويكي بدلًا من ذلك.

## أوضاع المخزن

يدعم `memory-wiki` ثلاثة أوضاع للمخزن:

### `isolated`

مخزن خاص به، ومصادر خاصة به، ومن دون اعتماد على `memory-core`.

استخدم هذا عندما تريد أن يكون الويكي مخزن معرفة منسقًا خاصًا به.

### `bridge`

يقرأ القطع الأثرية العامة للذاكرة وأحداث الذاكرة من plugin الذاكرة النشط
عبر واجهات plugin SDK العامة.

استخدم هذا عندما تريد أن يقوم الويكي بتجميع وتنظيم
القطع الأثرية المصدَّرة من plugin الذاكرة من دون الوصول إلى الأجزاء الداخلية الخاصة للـ plugin.

يمكن لوضع الجسر فهرسة ما يلي:

- القطع الأثرية المصدَّرة للذاكرة
- تقارير الحلم
- الملاحظات اليومية
- ملفات جذر الذاكرة
- سجلات أحداث الذاكرة

### `unsafe-local`

منفذ هروب صريح على الجهاز نفسه للمسارات المحلية الخاصة.

هذا الوضع تجريبي عمدًا وغير قابل للنقل. استخدمه فقط عندما
تفهم حدود الثقة وتحتاج تحديدًا إلى وصول إلى نظام الملفات المحلي
لا يستطيع وضع الجسر توفيره.

## تخطيط المخزن

يهيّئ plugin مخزنًا على النحو التالي:

```text
<vault>/
  AGENTS.md
  WIKI.md
  index.md
  inbox.md
  entities/
  concepts/
  syntheses/
  sources/
  reports/
  _attachments/
  _views/
  .openclaw-wiki/
```

يبقى المحتوى المُدار داخل الكتل المُولَّدة. ويتم الحفاظ على كتل الملاحظات البشرية.

المجموعات الرئيسية للصفحات هي:

- `sources/` للمواد الخام المستوردة والصفحات المدعومة بالجسر
- `entities/` للأشياء، والأشخاص، والأنظمة، والمشاريع، والكائنات الدائمة
- `concepts/` للأفكار، والتجريدات، والأنماط، والسياسات
- `syntheses/` للملخصات المُجمَّعة والتجميعات المُدارة
- `reports/` للوحات المعلومات المُولَّدة

## الادعاءات والأدلة المنظَّمة

يمكن أن تحمل الصفحات `claims` في frontmatter بشكل منظَّم، وليس مجرد نص حر.

يمكن أن يتضمن كل ادعاء:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

يمكن أن تتضمن إدخالات الأدلة:

- `sourceId`
- `path`
- `lines`
- `weight`
- `note`
- `updatedAt`

هذا ما يجعل الويكي يتصرف كطبقة اعتقاد أكثر من كونه
تفريغًا سلبيًا للملاحظات. يمكن تتبع الادعاءات، وتقييمها، والطعن فيها، وحلها بالرجوع إلى المصادر.

## مسار التجميع

تقرأ خطوة التجميع صفحات الويكي، وتطبّع الملخصات، وتُخرج قطعًا أثرية ثابتة
موجَّهة للآلة تحت:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

توجد هذه الملخصات حتى لا تضطر الوكلاء وشيفرة وقت التشغيل إلى كشط
الصفحات من Markdown.

كما يُشغّل الخرج المُجمَّع أيضًا:

- فهرسة أولية للويكي لتدفقات search/get
- البحث عن معرّفات الادعاءات والرجوع إلى الصفحات المالكة لها
- مكمّلات موجّه مدمجة
- إنشاء التقارير/لوحات المعلومات

## لوحات المعلومات وتقارير السلامة

عندما يكون `render.createDashboards` مفعّلًا، يحافظ التجميع على لوحات المعلومات تحت
`reports/`.

تتضمن التقارير المضمّنة:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

تتتبّع هذه التقارير أشياء مثل:

- مجموعات ملاحظات التناقض
- مجموعات الادعاءات المتنافسة
- الادعاءات التي تفتقد إلى أدلة منظَّمة
- الصفحات والادعاءات منخفضة الثقة
- القِدم أو حداثة غير معروفة
- الصفحات ذات الأسئلة غير المحلولة

## البحث والاسترجاع

يدعم `memory-wiki` واجهتي بحث:

- `shared`: استخدام تدفق بحث الذاكرة المشترك عند توفره
- `local`: البحث في الويكي محليًا

كما يدعم ثلاثة corpora:

- `wiki`
- `memory`
- `all`

سلوك مهم:

- يستخدم `wiki_search` و `wiki_get` الملخصات المُجمَّعة كمرور أول عندما يكون ذلك ممكنًا
- يمكن لمعرّفات الادعاءات أن تُحلّ بالرجوع إلى الصفحة المالكة
- تؤثر الادعاءات المتنازع عليها/القديمة/الحديثة في الترتيب
- يمكن أن تنتقل تسميات المصدرية إلى النتائج

قاعدة عملية:

- استخدم `memory_search corpus=all` لمرور استدعاء واسع واحد
- استخدم `wiki_search` + `wiki_get` عندما تهتم بالترتيب الخاص بالويكي،
  أو المصدرية، أو بنية الاعتقاد على مستوى الصفحة

## أدوات الوكيل

يسجل plugin هذه الأدوات:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

ما الذي تفعله:

- `wiki_status`: وضع المخزن الحالي، والسلامة، وتوفر CLI الخاص بـ Obsidian
- `wiki_search`: البحث في صفحات الويكي، وعند التكوين، في corpora الذاكرة المشتركة
- `wiki_get`: قراءة صفحة ويكي حسب المعرّف/المسار أو الرجوع إلى corpus الذاكرة المشترك
- `wiki_apply`: تعديلات ضيقة على التركيبات/البيانات الوصفية من دون جراحة حرة للصفحة
- `wiki_lint`: فحوصات بنيوية، وفجوات في المصدرية، وتناقضات، وأسئلة مفتوحة

كما يسجل plugin مكمّل corpus للذاكرة غير حصري، بحيث يمكن لـ
`memory_search` و `memory_get` المشتركين الوصول إلى الويكي عندما يدعم plugin الذاكرة
النشط اختيار corpus.

## سلوك الموجّه والسياق

عندما يكون `context.includeCompiledDigestPrompt` مفعّلًا، تقوم أقسام موجّه الذاكرة
بإلحاق لقطة مُجمَّعة مدمجة من `agent-digest.json`.

هذه اللقطة صغيرة عمدًا وعالية الإشارة:

- الصفحات العليا فقط
- أعلى الادعاءات فقط
- عدد التناقضات
- عدد الأسئلة
- محددات الثقة/الحداثة

هذا خيار اختياري لأنه يغيّر شكل الموجّه، ويكون مفيدًا أساسًا لمحركات السياق
أو تجميع الموجّهات القديم الذي يستهلك بشكل صريح مكمّلات الذاكرة.

## التكوين

ضع التكوين تحت `plugins.entries.memory-wiki.config`:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            path: "~/.openclaw/wiki/main",
            renderMode: "obsidian",
          },
          obsidian: {
            enabled: true,
            useOfficialCli: true,
            vaultName: "OpenClaw Wiki",
            openAfterWrites: false,
          },
          bridge: {
            enabled: false,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          ingest: {
            autoCompile: true,
            maxConcurrentJobs: 1,
            allowUrlIngest: true,
          },
          search: {
            backend: "shared",
            corpus: "wiki",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
          render: {
            preserveHumanBlocks: true,
            createBacklinks: true,
            createDashboards: true,
          },
        },
      },
    },
  },
}
```

المفاتيح الأساسية:

- `vaultMode`: ‏`isolated`، ‏`bridge`، ‏`unsafe-local`
- `vault.renderMode`: ‏`native` أو `obsidian`
- `bridge.readMemoryArtifacts`: استيراد القطع الأثرية العامة من plugin الذاكرة النشط
- `bridge.followMemoryEvents`: تضمين سجلات الأحداث في وضع الجسر
- `search.backend`: ‏`shared` أو `local`
- `search.corpus`: ‏`wiki` أو `memory` أو `all`
- `context.includeCompiledDigestPrompt`: إلحاق لقطة ملخص مدمجة إلى أقسام موجّه الذاكرة
- `render.createBacklinks`: إنشاء كتل ذات صلة حتمية
- `render.createDashboards`: إنشاء صفحات لوحات المعلومات

## CLI

يكشف `memory-wiki` أيضًا عن سطح CLI علوي المستوى:

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha
openclaw wiki apply synthesis "Alpha Summary" --body "..." --source-id source.alpha
openclaw wiki bridge import
openclaw wiki obsidian status
```

راجع [CLI: wiki](/cli/wiki) للحصول على المرجع الكامل للأوامر.

## دعم Obsidian

عندما يكون `vault.renderMode` هو `obsidian`، يكتب plugin
Markdown ملائمًا لـ Obsidian ويمكنه اختياريًا استخدام CLI الرسمي `obsidian`.

تشمل تدفقات العمل المدعومة ما يلي:

- فحص الحالة
- البحث في المخزن
- فتح صفحة
- استدعاء أمر في Obsidian
- الانتقال إلى الملاحظة اليومية

هذا اختياري. لا يزال الويكي يعمل في الوضع الأصلي من دون Obsidian.

## سير العمل الموصى به

1. احتفظ بـ plugin الذاكرة النشط لديك للاستدعاء/الترقية/الحلم.
2. فعّل `memory-wiki`.
3. ابدأ بوضع `isolated` ما لم تكن تريد صراحةً وضع الجسر.
4. استخدم `wiki_search` / `wiki_get` عندما تكون المصدرية مهمة.
5. استخدم `wiki_apply` للتركيبات الضيقة أو تحديثات البيانات الوصفية.
6. شغّل `wiki_lint` بعد التغييرات المهمة.
7. فعّل لوحات المعلومات إذا كنت تريد رؤية القِدم/التناقضات.

## مستندات ذات صلة

- [نظرة عامة على الذاكرة](/ar/concepts/memory)
- [CLI: memory](/cli/memory)
- [CLI: wiki](/cli/wiki)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
