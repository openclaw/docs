---
read_when:
    - تريد معرفة دائمة تتجاوز ملاحظات MEMORY.md العادية
    - أنت تقوم بتكوين Plugin ويكي الذاكرة المضمّن
    - تريد فهم wiki_search أو wiki_get أو وضع الجسر
summary: 'ويكي الذاكرة: مخزن معرفة مُجمّع يتضمن إسناد المصدر والادعاءات ولوحات المعلومات ووضع الجسر'
title: ويكي الذاكرة
x-i18n:
    generated_at: "2026-05-04T07:08:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: b070177b7c1217e9102bc57680b4009265e3584ede7ad6dc3ba7b6393260fefe
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` هو Plugin مضمّن يحوّل الذاكرة الدائمة إلى خزانة معرفة
مُجمّعة.

لا يستبدل **Plugin الذاكرة النشطة**. لا يزال Plugin الذاكرة النشطة
يمتلك الاستدعاء، والترقية، والفهرسة، وDreaming. يعمل `memory-wiki` إلى جانبه
ويجمّع المعرفة الدائمة في ويكي قابل للتنقل بصفحات حتمية،
ومطالبات منظمة، ومصدرية، ولوحات معلومات، وملخصات قابلة للقراءة آليًا.

استخدمه عندما تريد أن تتصرف الذاكرة كطبقة معرفة مُدارة أكثر
وبدرجة أقل ككومة من ملفات Markdown.

## ما يضيفه

- خزانة ويكي مخصصة بتخطيط صفحات حتمي
- بيانات وصفية منظمة للمطالبات والأدلة، وليس نثرًا فقط
- مصدرية وثقة وتناقضات وأسئلة مفتوحة على مستوى الصفحة
- ملخصات مُجمّعة لمستهلكي الوكيل/وقت التشغيل
- أدوات بحث/جلب/تطبيق/فحص أصلية للويكي
- وضع جسر اختياري يستورد الآثار العامة من Plugin الذاكرة النشطة
- وضع عرض متوافق اختياريًا مع Obsidian وتكامل CLI

## كيف يتكامل مع الذاكرة

فكّر في التقسيم بهذا الشكل:

| الطبقة                                                   | يمتلك                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin الذاكرة النشطة (`memory-core`، QMD، Honcho، إلخ.) | الاستدعاء، والبحث الدلالي، والترقية، وDreaming، ووقت تشغيل الذاكرة                               |
| `memory-wiki`                                           | صفحات ويكي مُجمّعة، وتركيبات غنية بالمصدرية، ولوحات معلومات، وبحث/جلب/تطبيق خاص بالويكي |

إذا كشف Plugin الذاكرة النشطة عن آثار استدعاء مشتركة، يمكن لـ OpenClaw البحث
في كلتا الطبقتين في تمريرة واحدة باستخدام `memory_search corpus=all`.

عندما تحتاج إلى ترتيب خاص بالويكي، أو مصدرية، أو وصول مباشر إلى الصفحات، استخدم
الأدوات الأصلية للويكي بدلًا من ذلك.

## النمط الهجين الموصى به

إعداد افتراضي قوي للتهيئات المحلية أولًا هو:

- QMD كخلفية الذاكرة النشطة للاستدعاء والبحث الدلالي الواسع
- `memory-wiki` في وضع `bridge` لصفحات المعرفة الدائمة المُركّبة

يعمل هذا التقسيم جيدًا لأن كل طبقة تبقى مركزة:

- يُبقي QMD الملاحظات الخام، وصادرات الجلسات، والمجموعات الإضافية قابلة للبحث
- يجمّع `memory-wiki` الكيانات المستقرة، والمطالبات، ولوحات المعلومات، وصفحات المصادر

قاعدة عملية:

- استخدم `memory_search` عندما تريد تمريرة استدعاء واسعة واحدة عبر الذاكرة
- استخدم `wiki_search` و`wiki_get` عندما تريد نتائج ويكي واعية بالمصدرية
- استخدم `memory_search corpus=all` عندما تريد أن يمتد البحث المشترك عبر كلتا الطبقتين

إذا أبلغ وضع الجسر عن صفر آثار مُصدّرة، فهذا يعني أن Plugin الذاكرة النشطة لا
يكشف حاليًا مدخلات جسر عامة بعد. شغّل `openclaw wiki doctor` أولًا،
ثم أكّد أن Plugin الذاكرة النشطة يدعم الآثار العامة.

عندما يكون وضع الجسر نشطًا ويتم تمكين `bridge.readMemoryArtifacts`،
فإن `openclaw wiki status` و`openclaw wiki doctor` و`openclaw wiki bridge
import` تقرأ عبر Gateway قيد التشغيل. يحافظ ذلك على اتساق فحوصات جسر CLI
مع سياق Plugin ذاكرة وقت التشغيل. إذا كان الجسر معطلًا أو كانت قراءات الآثار
متوقفة، فستحافظ تلك الأوامر على سلوكها المحلي/غير المتصل.

## أوضاع الخزانة

يدعم `memory-wiki` ثلاثة أوضاع للخزانة:

### `isolated`

خزانة خاصة، ومصادر خاصة، بلا اعتماد على `memory-core`.

استخدم هذا عندما تريد أن يكون الويكي مخزن معرفة مُنتقى خاصًا به.

### `bridge`

يقرأ آثار الذاكرة العامة وأحداث الذاكرة من Plugin الذاكرة النشطة
عبر منافذ Plugin SDK العامة.

استخدم هذا عندما تريد أن يجمّع الويكي آثار Plugin الذاكرة المُصدّرة وينظمها
دون الوصول إلى الأجزاء الداخلية الخاصة للـ Plugin.

يمكن لوضع الجسر فهرسة:

- آثار الذاكرة المُصدّرة
- تقارير الأحلام
- الملاحظات اليومية
- ملفات جذر الذاكرة
- سجلات أحداث الذاكرة

### `unsafe-local`

مخرج صريح على نفس الجهاز للمسارات المحلية الخاصة.

هذا الوضع تجريبي وغير قابل للنقل عمدًا. استخدمه فقط عندما
تفهم حد الثقة وتحتاج تحديدًا إلى وصول لنظام الملفات المحلي لا يستطيع
وضع الجسر توفيره.

## تخطيط الخزانة

يهيئ Plugin خزانة بهذا الشكل:

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

يبقى المحتوى المُدار داخل كتل مولّدة. يتم الحفاظ على كتل ملاحظات البشر.

مجموعات الصفحات الرئيسية هي:

- `sources/` للمواد الخام المستوردة والصفحات المدعومة بالجسر
- `entities/` للأشياء والأشخاص والأنظمة والمشاريع والكائنات الدائمة
- `concepts/` للأفكار والتجريدات والأنماط والسياسات
- `syntheses/` للملخصات المُجمّعة والتجميعات المُدارة
- `reports/` للوحات المعلومات المُولّدة

## المطالبات المنظمة والأدلة

يمكن للصفحات حمل frontmatter منظّم باسم `claims`، وليس نصًا حرًا فقط.

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

هذا ما يجعل الويكي يعمل كطبقة اعتقادات أكثر من كونه تفريغ ملاحظات سلبي.
يمكن تتبع المطالبات، وتقييمها، ومنازعتها، وردّها إلى المصادر.

## بيانات وصفية للكيانات موجهة للوكيل

يمكن لصفحات الكيانات أيضًا حمل بيانات وصفية للتوجيه لاستخدام الوكيل. هذا
frontmatter عام، لذا فهو يعمل للأشخاص، والفرق، والأنظمة، والمشاريع، أو أي نوع
كيان آخر.

تشمل الحقول الشائعة:

- `entityType`: مثلًا `person` أو `team` أو `system` أو `project`
- `canonicalId`: مفتاح هوية مستقر يُستخدم عبر الأسماء البديلة وعمليات الاستيراد
- `aliases`: أسماء أو معرّفات أو تسميات يجب أن تُحل إلى الصفحة نفسها
- `privacyTier`: `public` أو `local-private` أو `sensitive` أو `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: تلميحات توجيه موجزة
- `lastRefreshedAt`: طابع زمني لتحديث المصدر منفصل عن وقت تعديل الصفحة
- `personCard`: بطاقة توجيه اختيارية خاصة بالشخص مع المعرّفات، والحسابات الاجتماعية،
  والبريد الإلكتروني، والمنطقة الزمنية، والمسار، وما يُسأل عنه، وما يجب تجنب السؤال عنه، والثقة، والخصوصية
- `relationships`: حواف مصنفة إلى صفحات ذات صلة مع الهدف، والنوع، والوزن،
  والثقة، ونوع الدليل، وطبقة الخصوصية، والملاحظة

بالنسبة إلى ويكي الأشخاص، يجب أن يبدأ الوكيل عادةً بـ
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

تقرأ خطوة التجميع صفحات الويكي، وتطبّع الملخصات، وتصدر آثارًا مستقرة
موجهة للآلة تحت:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

توجد هذه الملخصات حتى لا تضطر الوكلاء وشيفرة وقت التشغيل إلى كشط صفحات
Markdown.

يشغّل الناتج المُجمّع أيضًا:

- فهرسة ويكي أولية لتدفقات البحث/الجلب
- البحث حسب معرف المطالبة للعودة إلى الصفحات المالكة
- ملاحق موجهات موجزة
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

تتتبع هذه التقارير أمورًا مثل:

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

- `shared`: استخدم تدفق بحث الذاكرة المشترك عند توفره
- `local`: ابحث في الويكي محليًا

كما يدعم ثلاث مجموعات:

- `wiki`
- `memory`
- `all`

سلوك مهم:

- يستخدم `wiki_search` و`wiki_get` الملخصات المُجمّعة كتمرير أولى عندما يكون ذلك ممكنًا
- يمكن لمعرفات المطالبات أن تُحل رجوعًا إلى الصفحة المالكة
- تؤثر المطالبات المتنازع عليها/القديمة/الحديثة في الترتيب
- يمكن أن تبقى تسميات المصدرية في النتائج
- يمكن لوضع البحث أن يميل بالترتيب إلى البحث عن الأشخاص، أو توجيه الأسئلة، أو
  أدلة المصادر، أو المطالبات الخام

قاعدة عملية:

- استخدم `memory_search corpus=all` لتمريرة استدعاء واسعة واحدة
- استخدم `wiki_search` + `wiki_get` عندما تهتم بالترتيب الخاص بالويكي،
  أو المصدرية، أو بنية الاعتقاد على مستوى الصفحة

أوضاع البحث:

- `auto`: الإعداد الافتراضي المتوازن
- `find-person`: عزز الكيانات الشبيهة بالأشخاص، والأسماء البديلة، والمعرّفات، والحسابات الاجتماعية، و
  المعرفات القانونية
- `route-question`: عزز بطاقات الوكيل، وتلميحات ما يُسأل عنه، وتلميحات أفضل استخدام، و
  سياق العلاقات
- `source-evidence`: عزز صفحات المصادر وبيانات الأدلة الوصفية المنظمة
- `raw-claim`: عزز المطالبات المنظمة المطابقة وأعد بيانات المطالبة/الدليل
  الوصفية في النتائج

عندما تطابق نتيجة مطالبة منظمة، يمكن لـ `wiki_search` إرجاع
`matchedClaimId` و`matchedClaimStatus` و`matchedClaimConfidence`
و`evidenceKinds` و`evidenceSourceIds` في حمولة تفاصيلها. يتضمن الإخراج النصي
أيضًا أسطر `Claim:` و`Evidence:` موجزة عند توفرها.

## أدوات الوكيل

يسجل Plugin هذه الأدوات:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

ما تفعله:

- `wiki_status`: وضع الخزانة الحالي، والصحة، وتوفر Obsidian CLI
- `wiki_search`: ابحث في صفحات الويكي، وعند التهيئة، مجموعات الذاكرة المشتركة؛
  يقبل `mode` للبحث عن الأشخاص، أو توجيه الأسئلة، أو أدلة المصادر، أو التنقيب في
  المطالبات الخام
- `wiki_get`: اقرأ صفحة ويكي حسب المعرّف/المسار أو ارجع إلى مجموعة الذاكرة المشتركة
- `wiki_apply`: تعديلات تركيب/بيانات وصفية ضيقة بدون جراحة صفحات حرة
- `wiki_lint`: فحوصات بنيوية، وفجوات مصدرية، وتناقضات، وأسئلة مفتوحة

يسجل Plugin أيضًا ملحق مجموعة ذاكرة غير حصري، بحيث يمكن لـ
`memory_search` و`memory_get` المشتركين الوصول إلى الويكي عندما يدعم Plugin
الذاكرة النشطة اختيار المجموعة.

## سلوك الموجه والسياق

عند تمكين `context.includeCompiledDigestPrompt`، تلحق أقسام موجه الذاكرة
لقطة مُجمّعة موجزة من `agent-digest.json`.

هذه اللقطة صغيرة وعالية الإشارة عمدًا:

- الصفحات العليا فقط
- المطالبات العليا فقط
- عدد التناقضات
- عدد الأسئلة
- مؤهلات الثقة/الحداثة

هذا اختياري لأنه يغير شكل الموجه وهو مفيد أساسًا لمحركات السياق
أو تجميع الموجهات القديم الذي يستهلك ملاحق الذاكرة صراحةً.

## التهيئة

ضع التهيئة تحت `plugins.entries.memory-wiki.config`:

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

مفاتيح التبديل الرئيسية:

- `vaultMode`: `isolated`، أو `bridge`، أو `unsafe-local`
- `vault.renderMode`: `native` أو `obsidian`
- `bridge.readMemoryArtifacts`: استيراد عناصر Plugin العامة لـ Active Memory
- `bridge.followMemoryEvents`: تضمين سجلات الأحداث في وضع الجسر
- `search.backend`: `shared` أو `local`
- `search.corpus`: `wiki`، أو `memory`، أو `all`
- `context.includeCompiledDigestPrompt`: إلحاق لقطة موجزة مضغوطة بأقسام موجّه الذاكرة
- `render.createBacklinks`: إنشاء كتل ذات صلة حتمية
- `render.createDashboards`: إنشاء صفحات لوحات المعلومات

### مثال: QMD + وضع الجسر

استخدم هذا عندما تريد QMD للاستدعاء و`memory-wiki` لطبقة معرفة مصانة:

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

- بقاء QMD مسؤولا عن استدعاء Active Memory
- تركيز `memory-wiki` على الصفحات ولوحات المعلومات المجمعة
- بقاء شكل الموجّه دون تغيير إلى أن تفعّل موجّهات الملخصات المجمعة عمدا

## CLI

يعرّض `memory-wiki` أيضا سطح CLI عالي المستوى:

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

راجع [CLI: wiki](/ar/cli/wiki) للاطلاع على مرجع الأوامر الكامل.

## دعم Obsidian

عندما تكون `vault.renderMode` هي `obsidian`، يكتب Plugin Markdown متوافقا مع Obsidian ويمكنه اختياريا استخدام CLI الرسمي لـ `obsidian`.

تشمل سير العمل المدعومة:

- فحص الحالة
- البحث في الخزنة
- فتح صفحة
- استدعاء أمر Obsidian
- الانتقال إلى الملاحظة اليومية

هذا اختياري. تظل الويكي تعمل في الوضع الأصلي دون Obsidian.

## سير العمل الموصى به

1. أبق Plugin الذاكرة النشطة لديك للاستدعاء/الترقية/Dreaming.
2. فعّل `memory-wiki`.
3. ابدأ بوضع `isolated` إلا إذا كنت تريد وضع الجسر صراحة.
4. استخدم `wiki_search` / `wiki_get` عندما يكون المصدر مهما.
5. استخدم `wiki_apply` للتجميعات المحدودة أو تحديثات البيانات الوصفية.
6. شغّل `wiki_lint` بعد التغييرات المهمة.
7. شغّل لوحات المعلومات إذا أردت إظهار المعلومات القديمة أو التناقضات.

## المستندات ذات الصلة

- [نظرة عامة على الذاكرة](/ar/concepts/memory)
- [CLI: memory](/ar/cli/memory)
- [CLI: wiki](/ar/cli/wiki)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
