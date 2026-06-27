---
read_when:
    - تريد معرفة دائمة تتجاوز ملاحظات MEMORY.md العادية
    - أنت تقوم بتهيئة Plugin ‏memory-wiki المضمّن
    - تريد فهم wiki_search أو wiki_get أو وضع الجسر
summary: 'memory-wiki: خزنة معرفة مُجمّعة مع المصدرية، والمطالبات، ولوحات المعلومات، ووضع الجسر'
title: ويكي الذاكرة
x-i18n:
    generated_at: "2026-06-27T18:07:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91512fbab8bfa87d3be29a75c217f99dbae11d9d7065fcc5ae9aa2c51847ec42
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` هو Plugin مضمّن يحوّل الذاكرة الدائمة إلى خزنة معرفة مُجمّعة.

هو **لا** يستبدل Plugin الذاكرة النشطة. لا يزال Plugin الذاكرة النشطة
يمتلك الاستدعاء، والترقية، والفهرسة، وDreaming. يعمل `memory-wiki` إلى جانبه
ويجمع المعرفة الدائمة في ويكي قابل للتنقل مع صفحات حتمية،
ومطالبات منظمة، ومصدرية، ولوحات معلومات، وموجزات قابلة للقراءة آلياً.

استخدمه عندما تريد أن تتصرف الذاكرة كطبقة معرفة مُدارة أكثر،
وأقل ككومة من ملفات Markdown.

## ما الذي يضيفه

- خزنة ويكي مخصصة بتخطيط صفحات حتمي
- بيانات وصفية منظمة للمطالبات والأدلة، وليس مجرد نثر
- مصدرية وثقة وتناقضات وأسئلة مفتوحة على مستوى الصفحة
- موجزات مُجمّعة لمستهلكي الوكيل/وقت التشغيل
- أدوات بحث/جلب/تطبيق/تدقيق أصلية للويكي
- استيراد Open Knowledge Format إلى مفاهيم ويكي مُجمّعة
- وضع جسر اختياري يستورد القطع العامة من Plugin الذاكرة النشطة
- وضع عرض اختياري ملائم لـ Obsidian وتكامل CLI

## كيف يتكامل مع الذاكرة

فكّر في التقسيم هكذا:

| الطبقة                                                  | تملك                                                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin الذاكرة النشطة (`memory-core`، QMD، Honcho، إلخ) | الاستدعاء، والبحث الدلالي، والترقية، وDreaming، ووقت تشغيل الذاكرة                       |
| `memory-wiki`                                           | صفحات ويكي مُجمّعة، وتوليفات غنية بالمصدرية، ولوحات معلومات، وبحث/جلب/تطبيق خاص بالويكي |

إذا كشف Plugin الذاكرة النشطة قطع استدعاء مشتركة، يمكن لـ OpenClaw البحث
في الطبقتين معاً في تمريرة واحدة باستخدام `memory_search corpus=all`.

عندما تحتاج إلى ترتيب خاص بالويكي، أو مصدرية، أو وصول مباشر إلى الصفحة، استخدم
الأدوات الأصلية للويكي بدلاً من ذلك.

## النمط الهجين الموصى به

الإعداد الافتراضي القوي للإعدادات المحلية أولاً هو:

- QMD كخلفية الذاكرة النشطة للاستدعاء والبحث الدلالي الواسع
- `memory-wiki` في وضع `bridge` لصفحات المعرفة الدائمة المُركّبة

ينجح هذا التقسيم جيداً لأن كل طبقة تبقى مركزة:

- يحافظ QMD على قابلية البحث في الملاحظات الخام، وتصديرات الجلسات، والمجموعات الإضافية
- يجمع `memory-wiki` الكيانات المستقرة، والمطالبات، ولوحات المعلومات، وصفحات المصادر

قاعدة عملية:

- استخدم `memory_search` عندما تريد تمريرة استدعاء واسعة واحدة عبر الذاكرة
- استخدم `wiki_search` و`wiki_get` عندما تريد نتائج ويكي واعية بالمصدرية
- استخدم `memory_search corpus=all` عندما تريد أن يمتد البحث المشترك عبر الطبقتين

إذا أبلغ وضع الجسر عن صفر من القطع المصدّرة، فهذا يعني أن Plugin الذاكرة النشطة
لا يكشف حالياً مدخلات جسر عامة بعد. شغّل `openclaw wiki doctor` أولاً،
ثم تأكد من أن Plugin الذاكرة النشطة يدعم القطع العامة.

عندما يكون وضع الجسر نشطاً ويتم تمكين `bridge.readMemoryArtifacts`،
تقرأ `openclaw wiki status` و`openclaw wiki doctor` و`openclaw wiki bridge
import` عبر Gateway العامل. هذا يحافظ على اتساق فحوصات جسر CLI
مع سياق Plugin ذاكرة وقت التشغيل. إذا كان الجسر معطلاً أو كانت قراءات القطع
متوقفة، تحافظ تلك الأوامر على سلوكها المحلي/غير المتصل.

## أوضاع الخزنة

يدعم `memory-wiki` ثلاثة أوضاع للخزنة:

### `isolated`

خزنة خاصة، ومصادر خاصة، ولا اعتماد على `memory-core`.

استخدم هذا عندما تريد أن تكون الويكي مخزن معرفة منسقاً بحد ذاته.

### `bridge`

يقرأ قطع الذاكرة العامة وأحداث الذاكرة من Plugin الذاكرة النشطة
عبر seams العامة لـ plugin SDK.

استخدم هذا عندما تريد من الويكي تجميع وتنظيم القطع المصدّرة من Plugin الذاكرة
دون الوصول إلى داخليات Plugin الخاصة.

يمكن لوضع الجسر فهرسة:

- قطع الذاكرة المصدّرة
- تقارير الأحلام
- الملاحظات اليومية
- ملفات جذر الذاكرة
- سجلات أحداث الذاكرة

### `unsafe-local`

مخرج صريح على الجهاز نفسه للمسارات المحلية الخاصة.

هذا الوضع تجريبي وغير قابل للنقل عمداً. استخدمه فقط عندما
تفهم حد الثقة وتحتاج تحديداً إلى وصول إلى نظام الملفات المحلي لا يستطيع
وضع الجسر توفيره.

## تخطيط الخزنة

يهيئ Plugin خزنة كهذه:

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

يبقى المحتوى المُدار داخل الكتل المولّدة. يتم الحفاظ على كتل الملاحظات البشرية.

مجموعات الصفحات الرئيسية هي:

- `sources/` للمواد الخام المستوردة والصفحات المدعومة بالجسر
- `entities/` للأشياء الدائمة، والأشخاص، والأنظمة، والمشاريع، والكائنات
- `concepts/` للأفكار، والتجريدات، والأنماط، والسياسات
- `syntheses/` للملخصات المُجمّعة والتجميعات المُدارة
- `reports/` للوحات المعلومات المولّدة

## استيرادات Open Knowledge Format

يمكن لـ `memory-wiki` استيراد حزم Open Knowledge Format غير المضغوطة باستخدام:

```bash
openclaw wiki okf import ./bundles/ga4
```

هذا هو أنظف ملاءمة عندما ينتج كتالوج بيانات، أو زاحف توثيق، أو وكيل إثراء
OKF بالفعل: أبقِ OKF كقطعة تبادل قابلة للنقل، ثم دع `memory-wiki`
يحوّله إلى صفحات مفاهيم أصلية لـ OpenClaw وموجزات مُجمّعة.

يتبع المستورد شكل OKF v0.1:

- ملفات `.md` غير المحجوزة هي مستندات مفاهيم
- يحتاج كل مفهوم مستورد إلى حقل frontmatter غير فارغ باسم `type`
- يتم قبول قيم OKF `type` غير المعروفة
- لا يتم استيراد ملفات `index.md` و`log.md` المحجوزة كمفاهيم
- يتم الحفاظ على روابط markdown المعطلة أو الخارجية

يتم تسطيح صفحات المفاهيم المستوردة تحت `concepts/` بحيث تراها مسارات التجميع،
والبحث، والجلب، ولوحات المعلومات، وموجزات المطالبات الموجودة دون إضافة شجرة
ويكي ثانية. تحتفظ كل صفحة بمعرّف مفهوم OKF الأصلي، ومسار المصدر، و`type`،
و`resource`، و`tags`، والطابع الزمني، وfrontmatter المنتج الكامل. تتم إعادة
كتابة روابط OKF الداخلية إلى صفحات مفاهيم الويكي المولّدة وتُصدر أيضاً كإدخالات
`relationships` منظمة مع `kind: okf-link`.

## المطالبات والأدلة المنظمة

يمكن للصفحات حمل frontmatter منظمة باسم `claims`، وليس مجرد نص حر.

يمكن أن تتضمن كل مطالبة:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

يمكن أن تتضمن إدخالات الأدلة:

- `kind`
- `sourceId`
- `path`
- `lines`
- `weight`
- `confidence`
- `privacyTier`
- `note`
- `updatedAt`

هذا ما يجعل الويكي تتصرف كطبقة اعتقاد أكثر من كونها تفريغ ملاحظات سلبياً.
يمكن تتبع المطالبات، وتقييمها، ومنازعتها، وحلها بالرجوع إلى المصادر.

## بيانات وصفية للكيانات موجهة للوكلاء

يمكن لصفحات الكيانات أيضاً حمل بيانات وصفية للتوجيه لاستخدام الوكيل. هذه
frontmatter عامة، لذا تعمل للأشخاص، والفرق، والأنظمة، والمشاريع، أو أي
نوع كيان آخر.

تشمل الحقول الشائعة:

- `entityType`: مثلاً `person` أو `team` أو `system` أو `project`
- `canonicalId`: مفتاح هوية مستقر يُستخدم عبر الأسماء البديلة والاستيرادات
- `aliases`: أسماء أو معرّفات أو تسميات يجب أن تُحل إلى الصفحة نفسها
- `privacyTier`: `public` أو `local-private` أو `sensitive` أو `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: تلميحات توجيه مضغوطة
- `lastRefreshedAt`: طابع زمني لتحديث المصدر منفصل عن وقت تحرير الصفحة
- `personCard`: بطاقة توجيه اختيارية خاصة بالشخص تتضمن المعرّفات، والحسابات الاجتماعية،
  والبريد الإلكتروني، والمنطقة الزمنية، والمسار، وما يجب طلبه، وما يجب تجنب طلبه، والثقة، والخصوصية
- `relationships`: حواف مصنفة إلى صفحات ذات صلة مع الهدف، والنوع، والوزن،
  والثقة، ونوع الدليل، وطبقة الخصوصية، والملاحظة

في ويكي الأشخاص، يجب أن يبدأ الوكيل عادةً بـ
`reports/person-agent-directory.md`، ثم يفتح صفحة الشخص باستخدام `wiki_get`
قبل استخدام تفاصيل الاتصال أو الحقائق المستنتجة.

مثال:

```yaml
pageType: entity
entityType: person
id: entity.brad-groux
canonicalId: maintainer.brad-groux
aliases:
  - Brad
  - bgroux
privacyTier: local-private
bestUsedFor:
  - Microsoft Teams and Azure routing
notEnoughFor:
  - legal approval
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@bgroux"
  socials:
    - "https://x.example/bgroux"
  emails:
    - brad@example.com
  timezone: America/Chicago
  lane: Microsoft ecosystem
  askFor:
    - Teams rollout questions
  avoidAskingFor:
    - unrelated billing decisions
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.alice
    targetTitle: Alice
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.brad.teams
    text: Brad is useful for Microsoft Teams routing.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```

## مسار التجميع

تقرأ خطوة التجميع صفحات الويكي، وتطبّع الملخصات، وتصدر قطعاً مستقرة
موجهة للآلة تحت:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

توجد هذه الموجزات حتى لا تضطر الوكلاء وشيفرة وقت التشغيل إلى استخراج البيانات
من صفحات Markdown.

كما يشغّل الناتج المُجمّع:

- فهرسة الويكي في التمريرة الأولى لمسارات البحث/الجلب
- البحث عن معرّف المطالبة رجوعاً إلى الصفحات المالكة
- مكملات مطالبات مضغوطة
- توليد التقارير/لوحات المعلومات

## لوحات المعلومات وتقارير الصحة

عند تمكين `render.createDashboards`، يحافظ التجميع على لوحات معلومات تحت
`reports/`.

تشمل التقارير المدمجة:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`
- `reports/person-agent-directory.md`
- `reports/relationship-graph.md`
- `reports/provenance-coverage.md`
- `reports/privacy-review.md`

تتعقب هذه التقارير أشياء مثل:

- عناقيد ملاحظات التناقض
- عناقيد المطالبات المتنافسة
- المطالبات التي تفتقد أدلة منظمة
- الصفحات والمطالبات منخفضة الثقة
- الحداثة القديمة أو غير المعروفة
- الصفحات ذات الأسئلة غير المحلولة
- بطاقات توجيه الأشخاص/الكيانات
- حواف العلاقات المنظمة
- تغطية فئات الأدلة
- طبقات الخصوصية غير العامة التي تحتاج إلى مراجعة قبل الاستخدام

## البحث والاسترجاع

يدعم `memory-wiki` خلفيتي بحث:

- `shared`: استخدام تدفق بحث الذاكرة المشترك عند توفره
- `local`: البحث في الويكي محلياً

كما يدعم ثلاث مجموعات:

- `wiki`
- `memory`
- `all`

سلوك مهم:

- يستخدم `wiki_search` و`wiki_get` الموجزات المُجمّعة كتمريرة أولى عندما يكون ذلك ممكناً
- يمكن لمعرّفات المطالبات أن تُحل رجوعاً إلى الصفحة المالكة
- تؤثر المطالبات المتنازع عليها/القديمة/الحديثة في الترتيب
- يمكن أن تبقى تسميات المصدرية في النتائج
- يمكن لوضع البحث أن يميل بالترتيب للبحث عن الأشخاص، أو توجيه الأسئلة، أو أدلة
  المصدر، أو المطالبات الخام

قاعدة عملية:

- استخدم `memory_search corpus=all` لتمريرة استدعاء واسعة واحدة
- استخدم `wiki_search` + `wiki_get` عندما تهتم بالترتيب الخاص بالويكي،
  أو المصدرية، أو بنية الاعتقاد على مستوى الصفحة

أوضاع البحث:

- `auto`: الإعداد الافتراضي المتوازن
- `find-person`: يعزز الكيانات الشبيهة بالأشخاص، والأسماء البديلة، والمعرّفات، والحسابات الاجتماعية، و
  المعرّفات canonical IDs
- `route-question`: يعزز بطاقات الوكلاء، وتلميحات ما يجب طلبه، وتلميحات أفضل استخدام، و
  سياق العلاقات
- `source-evidence`: يعزز صفحات المصادر وبيانات الأدلة المنظمة
- `raw-claim`: يعزز المطالبات المنظمة المطابقة ويعيد بيانات المطالبة/الدليل
  الوصفية في النتائج

عندما تطابق نتيجة مطالبة منظمة، يمكن لـ `wiki_search` إرجاع
`matchedClaimId` و`matchedClaimStatus` و`matchedClaimConfidence` و
`evidenceKinds` و`evidenceSourceIds` في حمولة تفاصيلها. يتضمن إخراج النص
أيضاً أسطر `Claim:` و`Evidence:` مضغوطة عند توفرها.

## أدوات الوكيل

يسجل Plugin هذه الأدوات:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

ما تفعله:

- `wiki_status`: وضع الخزنة الحالي، والصحة، وتوفر Obsidian CLI
- `wiki_search`: يبحث في صفحات الويكي، وعند تهيئته، في مجموعات الذاكرة المشتركة؛
  يقبل `mode` للبحث عن الأشخاص، أو توجيه الأسئلة، أو أدلة المصدر، أو التعمق في
  المطالبة الخام
- `wiki_get`: يقرأ صفحة ويكي حسب المعرّف/المسار أو يعود إلى مجموعة الذاكرة المشتركة
- `wiki_apply`: طفرات تركيب/بيانات وصفية ضيقة دون جراحة صفحات حرة
- `wiki_lint`: فحوصات بنيوية، وفجوات مصدرية، وتناقضات، وأسئلة مفتوحة

يسجّل الـ Plugin أيضًا ملحقًا غير حصري لمجموعة ذاكرة، بحيث يمكن لـ
`memory_search` و`memory_get` المشتركتين الوصول إلى الويكي عندما يدعم Plugin الذاكرة النشطة
اختيار المجموعة.

## سلوك الموجّه والسياق

عند تمكين `context.includeCompiledDigestPrompt`، تُلحق أقسام موجّه الذاكرة
لقطة مجمّعة مدمجة من `agent-digest.json`.

هذه اللقطة صغيرة وعالية القيمة عمدًا:

- الصفحات الأهم فقط
- الادعاءات الأهم فقط
- عدد التناقضات
- عدد الأسئلة
- مؤهلات الثقة/الحداثة

هذا اختياري لأنه يغيّر شكل الموجّه، وهو مفيد أساسًا لمحركات السياق
أو تجميع الموجّهات القديم الذي يستهلك ملحقات الذاكرة صراحةً.

## الإعدادات

ضع الإعدادات تحت `plugins.entries.memory-wiki.config`:

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

- `vaultMode`: `isolated` أو `bridge` أو `unsafe-local`
- `vault.renderMode`: `native` أو `obsidian`
- `bridge.readMemoryArtifacts`: استيراد العناصر العامة من Plugin الذاكرة النشطة
- `bridge.followMemoryEvents`: تضمين سجلات الأحداث في وضع الجسر
- `search.backend`: `shared` أو `local`
- `search.corpus`: `wiki` أو `memory` أو `all`
- `context.includeCompiledDigestPrompt`: إلحاق لقطة ملخّص مدمجة بأقسام موجّه الذاكرة
- `render.createBacklinks`: إنشاء كتل ذات صلة حتمية
- `render.createDashboards`: إنشاء صفحات لوحات المعلومات

### مثال: QMD + وضع الجسر

استخدم هذا عندما تريد QMD للاسترجاع و`memory-wiki` لطبقة معرفة
مُدارة:

```json5
{
  memory: {
    backend: "qmd",
  },
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          search: {
            backend: "shared",
            corpus: "all",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
        },
      },
    },
  },
}
```

يحافظ هذا على:

- تولّي QMD مسؤولية استرجاع الذاكرة النشطة
- تركيز `memory-wiki` على الصفحات المجمّعة ولوحات المعلومات
- بقاء شكل الموجّه دون تغيير إلى أن تمكّن موجّهات الملخّص المجمّع عمدًا

## CLI

يعرض `memory-wiki` أيضًا سطح CLI من المستوى الأعلى:

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

راجع [CLI: الويكي](/ar/cli/wiki) للاطلاع على مرجع الأوامر الكامل.

## دعم Obsidian

عندما تكون `vault.renderMode` هي `obsidian`، يكتب الـ Plugin ملفات Markdown
متوافقة مع Obsidian ويمكنه اختياريًا استخدام CLI الرسمي `obsidian`.

تشمل مسارات العمل المدعومة:

- فحص الحالة
- البحث في الخزنة
- فتح صفحة
- استدعاء أمر Obsidian
- الانتقال إلى الملاحظة اليومية

هذا اختياري. يظل الويكي يعمل في الوضع الأصلي دون Obsidian.

## سير العمل الموصى به

1. أبقِ Plugin الذاكرة النشطة لديك للاسترجاع/الترقية/الـ Dreaming.
2. مكّن `memory-wiki`.
3. ابدأ بوضع `isolated` ما لم تكن تريد وضع الجسر صراحةً.
4. استخدم `wiki_search` / `wiki_get` عندما تكون جهة المصدر مهمة.
5. استخدم `wiki_apply` للتوليفات المحدودة أو تحديثات البيانات الوصفية.
6. شغّل `wiki_lint` بعد التغييرات المهمة.
7. فعّل لوحات المعلومات إذا أردت رؤية العناصر القديمة/التناقضات.

## مستندات ذات صلة

- [نظرة عامة على الذاكرة](/ar/concepts/memory)
- [CLI: الذاكرة](/ar/cli/memory)
- [CLI: الويكي](/ar/cli/wiki)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
