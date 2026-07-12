---
read_when:
    - تريد معرفة دائمة تتجاوز ملاحظات `MEMORY.md` البسيطة
    - أنت تُعدّ Plugin ‏memory-wiki المضمّن
    - تحتاج إلى خزائن ويكي منفصلة للوكلاء في Gateway واحدة
    - تريد فهم `wiki_search` أو `wiki_get` أو وضع الجسر
summary: 'memory-wiki: خزنة معرفة مُجمَّعة تتضمن المصادر والادعاءات ولوحات المعلومات ووضع الجسر'
title: ويكي الذاكرة
x-i18n:
    generated_at: "2026-07-12T06:18:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf6c046bfa062b9df6deaa0753d992f9dbc45e2506d6ed4fb1a2836141a901c7
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` هو Plugin مضمّن يجمع المعرفة الدائمة في ويكي قابلة للتصفح: صفحات حتمية، وادعاءات منظّمة مدعومة بالأدلة، ومعلومات المصدر، ولوحات معلومات، وملخصات قابلة للقراءة آليًا.

لا يحل محل Plugin الذاكرة النشطة. تظل مسؤولية الاسترجاع، والترقية، والفهرسة، وDreaming مملوكة لواجهة الذاكرة الخلفية التي تم تكوينها (`memory-core` أو QMD أو Honcho أو غيرها). يعمل `memory-wiki` إلى جانبها ويجمع المعرفة في طبقة ويكي خاضعة للصيانة.

| الطبقة                 | المسؤوليات                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| Plugin الذاكرة النشطة  | الاسترجاع، والبحث الدلالي، والترقية، وDreaming، وبيئة تشغيل الذاكرة                               |
| `memory-wiki`          | صفحات الويكي المجمّعة، والتركيبات الغنية بمعلومات المصدر، ولوحات المعلومات، وبحث/جلب/تطبيق الويكي |

قاعدة عملية:

- استخدم `memory_search` لإجراء عملية استرجاع واسعة واحدة عبر أي مجموعات محتوى تم تكوينها
- استخدم `wiki_search` / `wiki_get` عندما تريد ترتيبًا خاصًا بالويكي، أو معلومات المصدر، أو بنية اعتقادات على مستوى الصفحة
- استخدم `memory_search corpus=all` لتغطية الطبقتين في استدعاء واحد، عندما يدعم Plugin الذاكرة النشطة تحديد مجموعة المحتوى

إعداد شائع يعطي الأولوية للتشغيل المحلي: استخدام QMD كواجهة خلفية للذاكرة النشطة من أجل الاسترجاع، واستخدام `memory-wiki` في وضع `bridge` للصفحات الدائمة المركّبة. راجع مثال وضع QMD + bridge ضمن [التكوين](#configuration).

إذا أبلغ وضع bridge عن عدم وجود أي عناصر مصدّرة، فهذا يعني أن Plugin الذاكرة النشطة لا يوفّر حاليًا مدخلات bridge عامة. شغّل `openclaw wiki doctor` أولًا، ثم تأكد من أن Plugin الذاكرة النشطة يدعم العناصر العامة.

## أوضاع المخزن

- `isolated` (الافتراضي): مخزن مستقل، ومصادر مستقلة، ومن دون اعتماد على Plugin الذاكرة النشطة. استخدمه لمستودع معرفة منسّق ومكتفٍ ذاتيًا.
- `bridge`: يقرأ عناصر الذاكرة العامة وسجلات الأحداث من Plugin الذاكرة النشطة عبر واجهات plugin SDK العامة. استخدمه لتجميع العناصر التي يصدّرها Plugin الذاكرة من دون الوصول إلى مكوّناته الداخلية الخاصة.
- `unsafe-local`: منفذ صريح للاستخدام على الجهاز نفسه للوصول إلى المسارات المحلية الخاصة. تجريبي وغير قابل للنقل عن قصد؛ لا تستخدمه إلا عندما تفهم حدود الثقة وتحتاج تحديدًا إلى وصول محلي لنظام الملفات لا يستطيع وضع bridge توفيره.

وضع المخزن ونطاقه خياران منفصلان:

- يحدد `vaultMode` مصدر مدخلات الويكي.
- يحدد `vault.scope` ما إذا كان جميع الوكلاء يستخدمون مخزنًا واحدًا أو يحصل كل وكيل على مخزن فرعي.

القيمة `vault.scope: "global"` هي الافتراضية وتحافظ على سلوك المخزن الواحد الحالي. استخدم `vault.scope: "agent"` مع وضع `isolated` أو `bridge` عندما يجب ألا يتشارك الوكلاء صفحات الويكي، أو الملخصات المجمّعة، أو نتائج البحث، أو عمليات الكتابة. لا يمكن الجمع بين نطاق الوكيل ووضع `unsafe-local` لأن تلك المسارات الخاصة المكوّنة ليست مدخلات مملوكة للوكيل. يرفض التحقق من صحة التكوين هذا الجمع.

يمكن لوضع bridge فهرسة ما يلي، وفق مفتاح التبديل المقابل في تكوين `bridge.*`:

- عناصر الذاكرة المصدّرة (`indexMemoryRoot`)
- الملاحظات اليومية (`indexDailyNotes`)
- تقارير Dreaming (`indexDreamReports`)
- سجلات أحداث الذاكرة (`followMemoryEvents`)

عندما يكون وضع bridge نشطًا ويكون `bridge.readMemoryArtifacts` مفعّلًا، تُوجَّه أوامر `openclaw wiki status` و`openclaw wiki doctor` و`openclaw wiki bridge import` عبر Gateway قيد التشغيل، بحيث ترى سياق Plugin الذاكرة النشطة نفسه الذي تراه ذاكرة الوكيل/بيئة التشغيل. إذا كان bridge معطّلًا أو كانت قراءة العناصر متوقفة، تحتفظ هذه الأوامر بسلوكها المحلي/غير المتصل.

## تخطيط المخزن

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

يبقى المحتوى المُدار داخل الكتل المُنشأة، بينما تُحفظ كتل الملاحظات البشرية عبر عمليات إعادة الإنشاء.

- `sources/`: المواد الأولية المستوردة والصفحات المدعومة بواسطة bridge أو `unsafe-local`
- `entities/`: الأشياء والأشخاص والأنظمة والمشاريع والكائنات الدائمة
- `concepts/`: الأفكار والتجريدات والأنماط والسياسات (وهو أيضًا موضع وصول واردات OKF)
- `syntheses/`: الملخصات المجمّعة والتجميعات الخاضعة للصيانة
- `reports/`: لوحات المعلومات المُنشأة

## واردات تنسيق المعرفة المفتوح

```bash
openclaw wiki okf import ./bundles/ga4
```

استورد حزمة غير مضغوطة بتنسيق المعرفة المفتوح إلى صفحات مفاهيم الويكي. يناسب ذلك الحالات التي ينتج فيها كتالوج بيانات أو زاحف توثيق أو وكيل إثراء محتوى بتنسيق OKF بالفعل: احتفظ بـ OKF كعنصر تبادل قابل للنقل، ودع `memory-wiki` يحوّله إلى صفحات مفاهيم أصلية لـ OpenClaw وملخصات مجمّعة.

- ملفات `.md` غير المحجوزة هي مستندات مفاهيم
- يتطلب كل مفهوم مستورد حقل frontmatter غير فارغ باسم `type`؛ يؤدي غياب `type` إلى تحذير `missing-type` وتخطي الملف
- تُقبل قيم `type` غير المعروفة كمفاهيم عامة
- الملفان `index.md` و`log.md` محجوزان ولا يُستوردان مطلقًا كمفاهيم
- تُترك روابط Markdown المعطّلة أو الخارجية من دون تغيير

تُسطّح الصفحات المستوردة ضمن `concepts/` بحيث تراها مسارات التجميع والبحث والجلب ولوحات المعلومات الحالية من دون شجرة ويكي ثانية. تحتفظ كل صفحة بمعرّف مفهوم OKF الأصلي، ومسار المصدر، و`type`، و`resource`، و`tags`، والطابع الزمني، وfrontmatter الكامل الخاص بالمنتِج. يُعاد توجيه روابط OKF الداخلية إلى صفحات مفاهيم الويكي المُنشأة، كما تنشئ إدخالات `relationships` منظّمة تتضمن `kind: okf-link`.

## الادعاءات والأدلة المنظّمة

تحمل الصفحات frontmatter منظّمًا باسم `claims`، وليس مجرد نص حر. يمكن أن يتضمن كل ادعاء `id` و`text` و`status` و`confidence` و`evidence[]` و`updatedAt`. ويمكن أن يتضمن كل إدخال دليل `kind` و`sourceId` و`path` و`lines` و`weight` و`confidence` و`privacyTier` و`note` و`updatedAt`.

يجعل ذلك الويكي تعمل كطبقة اعتقادات، لا كمستودع ملاحظات سلبي. يمكن تتبع الادعاءات وتقييمها والاعتراض عليها وحسمها بالرجوع إلى المصادر.

## بيانات الكيانات الوصفية الموجّهة للوكلاء

تحمل صفحات الكيانات بيانات توجيه وصفية عامة قابلة للاستخدام مع الأشخاص أو الفرق أو الأنظمة أو المشاريع أو أي نوع آخر من الكيانات:

- `entityType`: مثل `person` أو `team` أو `system` أو `project`
- `canonicalId`: مفتاح هوية ثابت عبر الأسماء البديلة والواردات
- `aliases`: أسماء أو معرّفات أو تسميات تشير إلى الصفحة نفسها
- `privacyTier`: سلسلة حرة؛ تُعامل `public` على أنها لا تتطلب مراجعة، بينما تُعلّم أي قيمة أخرى (مثل `local-private` أو `sensitive` أو `confirm-before-use`) في `reports/privacy-review.md`
- `bestUsedFor` / `notEnoughFor`: تلميحات توجيه مختصرة
- `lastRefreshedAt`: طابع زمني لتحديث المصدر، منفصل عن وقت تعديل الصفحة
- `personCard`: بطاقة توجيه اختيارية خاصة بالشخص (المعرّفات، وحسابات التواصل الاجتماعي، وعناوين البريد الإلكتروني، والمنطقة الزمنية، والمسار، وما يمكن سؤاله عنه، وما ينبغي تجنب سؤاله عنه، والثقة، ومستوى الخصوصية)
- `relationships`: حواف ذات أنواع إلى الصفحات ذات الصلة (الهدف، والنوع، والوزن، والثقة، ونوع الدليل، ومستوى الخصوصية، والملاحظة)

بالنسبة إلى ويكي الأشخاص، ابدأ بـ `reports/person-agent-directory.md`، ثم افتح صفحة الشخص باستخدام `wiki_get` قبل استخدام تفاصيل الاتصال أو الحقائق المستنتجة.

<Accordion title="مثال على صفحة كيان">
```yaml
pageType: entity
entityType: person
id: entity.example-person
canonicalId: maintainer.example-person
aliases:
  - Alex
  - example-handle
privacyTier: local-private
bestUsedFor:
  - Example ecosystem routing
notEnoughFor:
  - legal approval
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@example-handle"
  socials:
    - "https://x.example/example-handle"
  emails:
    - alex@example.com
  timezone: America/Chicago
  lane: Example ecosystem
  askFor:
    - Example rollout questions
  avoidAskingFor:
    - unrelated billing decisions
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.other-person
    targetTitle: Other Person
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.example.routing
    text: Alex is useful for example-ecosystem routing.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```
</Accordion>

## مسار التجميع

تقرأ عملية التجميع صفحات الويكي، وتوحّد الملخصات، وتنتج عناصر ثابتة موجّهة للآلات ضمن:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

تقرأ الوكلاء وشيفرة بيئة التشغيل هذه الملخصات بدلًا من استخلاص محتوى Markdown. كما يشغّل الناتج المجمّع الفهرسة الأولية للويكي من أجل البحث/الجلب، والبحث بمعرّف الادعاء وصولًا إلى الصفحة المالكة، وإضافات المطالبات المختصرة، وإنشاء التقارير.

## لوحات المعلومات وتقارير السلامة

عندما يكون `render.createDashboards` مفعّلًا، تحافظ عملية التجميع على لوحات المعلومات ضمن `reports/`:

| التقرير                             | ما يتتبعه                                                   |
| ----------------------------------- | ----------------------------------------------------------- |
| `reports/open-questions.md`         | الصفحات التي تتضمن أسئلة غير محسومة                         |
| `reports/contradictions.md`         | مجموعات ملاحظات التناقض                                    |
| `reports/low-confidence.md`         | الصفحات والادعاءات منخفضة الثقة                             |
| `reports/claim-health.md`           | الادعاءات التي تفتقر إلى أدلة منظّمة                        |
| `reports/stale-pages.md`            | الصفحات القديمة أو ذات حداثة غير معروفة                     |
| `reports/person-agent-directory.md` | بطاقات توجيه الأشخاص/الكيانات                               |
| `reports/relationship-graph.md`     | حواف العلاقات المنظّمة                                      |
| `reports/provenance-coverage.md`    | تغطية فئات الأدلة                                           |
| `reports/privacy-review.md`         | مستويات الخصوصية غير العامة التي تحتاج إلى مراجعة قبل الاستخدام |

## البحث والاسترجاع

واجهتان خلفيتان للبحث:

- `shared`: استخدام مسار بحث الذاكرة المشترك عند توفره
- `local`: البحث في الويكي محليًا

ثلاث مجموعات محتوى: `wiki` و`memory` و`all`.

- يستخدم `wiki_search` / `wiki_get` الملخصات المجمّعة كمرحلة أولى متى أمكن
- تُرجع معرّفات الادعاءات إلى الصفحة المالكة
- تؤثر الادعاءات المتنازع عليها والقديمة والحديثة في الترتيب
- تظل تسميات معلومات المصدر موجودة في النتائج

أوضاع البحث (`--mode` / معامل الأداة `mode`):

| الوضع             | ما يعززه                                                                  |
| ----------------- | ------------------------------------------------------------------------- |
| `auto`            | إعداد افتراضي متوازن                                                      |
| `find-person`     | الكيانات الشبيهة بالأشخاص، والأسماء البديلة، والمعرّفات، وحسابات التواصل الاجتماعي، والمعرّفات الأساسية |
| `route-question`  | بطاقات الوكلاء، وتلميحات ما يمكن سؤاله عنه/أفضل استخدام، وسياق العلاقات  |
| `source-evidence` | صفحات المصادر والبيانات الوصفية للأدلة المنظّمة                           |
| `raw-claim`       | الادعاءات المنظّمة المطابقة؛ يعيد البيانات الوصفية للادعاء/الدليل        |

عندما تتطابق نتيجة مع ادعاء منظّم، يعيد `wiki_search` الحقول `matchedClaimId` و`matchedClaimStatus` و`matchedClaimConfidence` و`evidenceKinds` و`evidenceSourceIds` ضمن حمولة التفاصيل. يتضمن الإخراج النصي أسطر `Claim:` و`Evidence:` مختصرة عند توفرها.

## أدوات الوكيل

| الأداة        | الغرض                                                                                                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | وضع الخزنة ونطاقها الحاليان، والوكيل المحدد، والحالة، ومدى توفر CLI الخاص بـ Obsidian                                                                                  |
| `wiki_search` | البحث في صفحات الويكي، وعند الإعداد، في مجموعة الذاكرة المشتركة؛ يقبل `mode` للبحث عن شخص أو توجيه الأسئلة أو أدلة المصادر أو الاستقصاء التفصيلي للادعاءات الأولية |
| `wiki_get`    | قراءة صفحة ويكي حسب المعرّف/المسار، مع الرجوع إلى مجموعة الذاكرة المشتركة عند تمكين البحث المشترك وعدم العثور على نتيجة                                               |
| `wiki_apply`  | تعديلات محدودة على التوليف/البيانات الوصفية دون تحرير حر للصفحات                                                                                                      |
| `wiki_lint`   | فحوصات بنيوية، وفجوات في مصدر المعلومات، وتناقضات، وأسئلة مفتوحة                                                                                                     |

يسجّل Plugin أيضًا ملحقًا غير حصري لمجموعة الذاكرة، بحيث يمكن لـ
`memory_search` و`memory_get` المشتركين الوصول إلى الويكي عندما يدعم Plugin
الذاكرة النشط اختيار المجموعة.

## سلوك الموجّه والسياق

عند تمكين `context.includeCompiledDigestPrompt`، تُلحق أقسام موجّه الذاكرة
لقطة مترجمة مدمجة من `agent-digest.json`: أهم الصفحات فقط،
وأهم الادعاءات فقط، وعدد التناقضات، وعدد الأسئلة، ومؤهلات الثقة/الحداثة.
هذه ميزة اختيارية لأنها تغيّر بنية الموجّه؛ وهي تهم أساسًا محركات السياق
أو عمليات تجميع الموجّهات التي تستهلك ملحقات الذاكرة صراحةً.

## الإعداد

ضع الإعداد ضمن `plugins.entries.memory-wiki.config`:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            scope: "global",
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
          unsafeLocal: {
            allowPrivateMemoryCoreAccess: false,
            paths: [],
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

مفاتيح التبديل الأساسية:

| المفتاح                                    | القيم / القيمة الافتراضية                       | الملاحظات                                                                                   |
| ------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `vaultMode`                                | `isolated` (افتراضي)، `bridge`، `unsafe-local` | يختار سلوك الإدخال والتكامل                                                                 |
| `vault.scope`                              | `global` (افتراضي)، `agent`                    | خزنة مشتركة واحدة أو خزنة فرعية واحدة لكل وكيل                                              |
| `vault.path`                               | القيمة العامة الافتراضية `~/.openclaw/wiki/main` | مسار الخزنة الدقيق في النطاق العام؛ والمسار الأب الافتراضي لنطاق الوكيل هو `~/.openclaw/wiki` |
| `vault.renderMode`                         | `native` (افتراضي)، `obsidian`                 |                                                                                             |
| `bridge.readMemoryArtifacts`               | الافتراضي `true`                                | استيراد العناصر العامة الخاصة بـ Plugin الذاكرة النشط                                       |
| `bridge.followMemoryEvents`                | الافتراضي `true`                                | تضمين سجلات الأحداث في وضع الجسر                                                            |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | الافتراضي `false`                               | مطلوب لتشغيل عمليات استيراد `unsafe-local`                                                  |
| `unsafeLocal.paths`                        | الافتراضي `[]`                                  | مسارات محلية صريحة للاستيراد في وضع `unsafe-local`                                          |
| `search.backend`                           | `shared` (افتراضي)، `local`                    |                                                                                             |
| `search.corpus`                            | `wiki` (افتراضي)، `memory`، `all`              |                                                                                             |
| `context.includeCompiledDigestPrompt`      | الافتراضي `false`                               | إلحاق لقطة الملخص المدمجة الخاصة بالوكيل المحدد بأقسام موجّه الذاكرة                         |
| `render.createBacklinks`                   | الافتراضي `true`                                | إنشاء كتل مترابطة ذات نتائج حتمية                                                           |
| `render.createDashboards`                  | الافتراضي `true`                                | إنشاء صفحات لوحات المعلومات                                                                |

### خزنات منفصلة لكل وكيل

اضبط `vault.scope` على `agent` لمنح كل وكيل مُعدّ ويكي منفصلة.
في هذا النطاق، يكون `vault.path` دليلًا أبًا ويُلحق OpenClaw
معرّف الوكيل بعد تطبيعه:

```json5
{
  agents: {
    list: [{ id: "support" }, { id: "marketing" }],
  },
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          vault: {
            scope: "agent",
            path: "~/.openclaw/wiki",
          },
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
          },
        },
      },
    },
  },
}
```

ينتج عن ذلك المساران `~/.openclaw/wiki/support` و
`~/.openclaw/wiki/marketing`. إذا أُغفل `vault.path` في نطاق الوكيل، تكون
القيمة الافتراضية للمسار الأب هي `~/.openclaw/wiki`. لذلك يحتفظ الوكيل
الافتراضي `main` بالمسار الحالي `~/.openclaw/wiki/main`.

تحدد أدوات الوكيل وملخصات الموجّه المترجمة وملحق الويكي المكشوف من خلال
`memory_search` / `memory_get` الخزنة من سياق الوكيل النشط.
بالنسبة إلى استدعاءات CLI وGateway في إعداد يحتوي عدة وكلاء مُعدّين، حدّد
الوكيل صراحةً باستخدام `openclaw wiki --agent <agentId> ...` أو `agentId`
في طلب Gateway. يظل الوكيل الوحيد المُعدّ هو الافتراضي عند عدم تقديم معرّف.

في وضع الجسر، لا تقبل عمليات الاستيراد ذات نطاق الوكيل عنصر ذاكرة عامًا إلا عندما
تتضمن `agentIds` الخاصة به الوكيل المحدد. تُتخطى العناصر المملوكة لوكيل آخر،
أو التي لا تحتوي على بيانات وصفية للملكية، أو التي لها مالك مجهول. يحتفظ النطاق العام
بسلوك العناصر المشتركة الحالي.

<Warning>
لا يؤدي تغيير `vault.scope` إلى نسخ خزنة موجودة أو تقسيمها. في نطاق الوكيل،
يصبح `vault.path` المُعدّ صراحةً دليلًا أبًا، لذا انقل الصفحات الموجودة أو
استوردها عمدًا قبل تحويل وكلاء الإنتاج. أنشئ نسخة احتياطية من الخزنة أولًا.

الخزنات المنفصلة لكل وكيل هي حد معرفي داخل العملية نفسها، وليست حدًا أمنيًا
لنظام التشغيل. لا يزال بإمكان Plugins والأدوات غير المعزولة التي يمكنها الوصول
إلى نظام ملفات المضيف قراءة دليل وكيل آخر. استخدم [العزل](/ar/gateway/sandboxing) أو
[ملفات تعريف Gateway منفصلة](/ar/gateway/multiple-gateways) عندما لا يثق الوكلاء
بعضهم ببعض.
</Warning>

### مثال: QMD + وضع الجسر

استخدم هذا عندما تريد QMD للاسترجاع و`memory-wiki` لطبقة معرفية مُدارة.
تظل كل طبقة مركزة على مهمتها: يحافظ QMD على قابلية البحث في الملاحظات الأولية
وتصديرات الجلسات والمجموعات الإضافية، بينما يترجم `memory-wiki`
الكيانات والادعاءات ولوحات المعلومات وصفحات المصادر المستقرة.

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

يُبقي هذا QMD مسؤولًا عن استرجاع الذاكرة النشطة، ويركز `memory-wiki` على
الصفحات المترجمة ولوحات المعلومات، ويُبقي بنية الموجّه دون تغيير حتى
تُفعّل عمدًا موجّهات الملخص المترجم.

## CLI

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

راجع [CLI: الويكي](/ar/cli/wiki) للاطلاع على مرجع الأوامر الكامل، بما في ذلك
`wiki okf import` و`wiki apply metadata` و`wiki unsafe-local import`
و`wiki chatgpt import` / `wiki chatgpt rollback`، ومجموعة أوامر
`wiki obsidian` الفرعية الكاملة.

## دعم Obsidian

عندما تكون قيمة `vault.renderMode` هي `obsidian`، يكتب Plugin صيغة
Markdown ملائمة لـ Obsidian، ويمكنه اختياريًا استخدام CLI الرسمي
`obsidian` لاستقصاء الحالة، والبحث في الخزنة، وفتح صفحة، واستدعاء أمر،
والانتقال إلى الملاحظة اليومية. هذا اختياري؛ تظل الويكي تعمل في الوضع
الأصلي دون Obsidian.

لا يزال بإمكان الخزنات ذات نطاق الوكيل استخدام Markdown الملائم لـ Obsidian،
لكن التحقق من الإعداد يرفض `obsidian.useOfficialCli: true` مع
`vault.scope: "agent"`. إعداد `obsidian.vaultName` الحالي عام ولا يمكنه
تحديد خزنة Obsidian مميزة لكل وكيل. استخدم بدلًا من ذلك أدوات الويكي وعمليات
CLI، أو احتفظ بويكي يديرها Obsidian ضمن النطاق العام.

## سير العمل الموصى به

<Steps>
<Step title="احتفظ بـ Plugin الذاكرة النشط للاسترجاع">
يبقى الاسترجاع والترقية وDreaming تحت مسؤولية واجهة الذاكرة الخلفية المُعدّة.
</Step>
<Step title="فعّل memory-wiki">
ابدأ بالوضع `isolated` ما لم تكن تريد وضع الجسر صراحةً.
</Step>
<Step title="استخدم wiki_search / wiki_get عندما يكون مصدر المعلومات مهمًا">
فضّلهما على `memory_search` عندما تريد ترتيبًا خاصًا بالويكي أو بنية معتقدات على مستوى الصفحة.
</Step>
<Step title="استخدم wiki_apply للتوليفات المحدودة أو تحديثات البيانات الوصفية">
تجنب تحرير الكتل المُدارة والمُنشأة يدويًا.
</Step>
<Step title="شغّل wiki_lint بعد التغييرات المهمة">
يكتشف التناقضات والأسئلة المفتوحة وفجوات مصدر المعلومات.
</Step>
<Step title="فعّل لوحات المعلومات لإظهار المحتوى القديم والتناقضات">
اضبط `render.createDashboards: true` (افتراضي).
</Step>
</Steps>

## وثائق ذات صلة

- [نظرة عامة على الذاكرة](/ar/concepts/memory)
- [CLI: الذاكرة](/ar/cli/memory)
- [CLI: الويكي](/ar/cli/wiki)
- [نظرة عامة على حزمة تطوير Plugin](/ar/plugins/sdk-overview)
