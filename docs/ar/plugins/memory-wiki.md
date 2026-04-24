---
read_when:
    - تريد معرفة دائمة تتجاوز ملاحظات MEMORY.md العادية
    - أنت تضبط Plugin ‏memory-wiki المضمّنة
    - تريد فهم wiki_search أو wiki_get أو وضع bridge
summary: 'memory-wiki: مخزن معرفة مُجمَّع مع المصدر، والادعاءات، ولوحات المعلومات، ووضع bridge'
title: ويكي الذاكرة
x-i18n:
    generated_at: "2026-04-24T07:54:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9b2637514878a87f57f1f7d19128f0a4f622852c1a25d632410cb679f081b8e
    source_path: plugins/memory-wiki.md
    workflow: 15
---

`memory-wiki` هو Plugin مضمّن يحوّل الذاكرة الدائمة إلى
مخزن معرفة مُجمَّع.

وهو **لا** يستبدل Plugin الذاكرة النشطة. إذ لا تزال Plugin الذاكرة النشطة
تملك الاسترجاع، والترقية، والفهرسة، وDreaming. أما `memory-wiki` فيقف بجانبها
ويجمّع المعرفة الدائمة في wiki قابلة للتنقل مع صفحات حتمية،
وادعاءات منظمة، ومصدر، ولوحات معلومات، وملخصات قابلة للقراءة آليًا.

استخدمه عندما تريد أن تتصرف الذاكرة أكثر كطبقة معرفة مصانة وأقل
ككومة من ملفات Markdown.

## ما الذي يضيفه

- مخزن wiki مخصص مع تخطيط صفحات حتمي
- بيانات تعريف منظمة للادعاءات والأدلة، وليس مجرد نثر
- مصدر على مستوى الصفحة، والثقة، والتناقضات، والأسئلة المفتوحة
- ملخصات مُجمّعة لمستهلكي الوكيل/وقت التشغيل
- أدوات wiki أصلية للبحث/الجلب/التطبيق/الفحص
- وضع bridge اختياري يستورد القطع العامة من Plugin الذاكرة النشطة
- وضع عرض متوافق اختياريًا مع Obsidian وتكامل CLI

## كيف ينسجم مع الذاكرة

فكّر في هذا التقسيم على النحو التالي:

| الطبقة | ما الذي تملكه |
| ------ | ------------- |
| Plugin الذاكرة النشطة (`memory-core`، وQMD، وHoncho، وغير ذلك) | الاسترجاع، والبحث الدلالي، والترقية، وDreaming، ووقت تشغيل الذاكرة |
| `memory-wiki` | صفحات wiki المُجمّعة، والتركيبات الغنية بالمصدر، ولوحات المعلومات، والبحث/الجلب/التطبيق الخاص بـ wiki |

إذا كانت Plugin الذاكرة النشطة تكشف عن قطع استرجاع مشتركة، فيمكن لـ OpenClaw
البحث في الطبقتين معًا في مرور واحد باستخدام `memory_search corpus=all`.

وعندما تحتاج إلى ترتيب خاص بالـ wiki، أو المصدر، أو وصول مباشر إلى الصفحة، فاستخدم
الأدوات الأصلية الخاصة بالـ wiki بدلًا من ذلك.

## النمط الهجين الموصى به

الإعداد الافتراضي القوي للأنظمة المحلية أولًا هو:

- QMD كخلفية الذاكرة النشطة للاسترجاع والبحث الدلالي الواسع
- و`memory-wiki` في وضع `bridge` لصفحات المعرفة الدائمة المُركّبة

يعمل هذا التقسيم جيدًا لأن كل طبقة تظل مركّزة:

- يبقي QMD الملاحظات الخام، وصادرات الجلسات، والمجموعات الإضافية قابلة للبحث
- بينما يجمّع `memory-wiki` الكيانات المستقرة، والادعاءات، ولوحات المعلومات، وصفحات المصادر

القاعدة العملية:

- استخدم `memory_search` عندما تريد مرور استرجاع واسعًا واحدًا عبر الذاكرة
- استخدم `wiki_search` و`wiki_get` عندما تريد نتائج wiki مدركة للمصدر
- استخدم `memory_search corpus=all` عندما تريد أن يمتد البحث المشترك عبر الطبقتين

إذا أبلغ وضع bridge عن صفر من القطع المصدّرة، فهذا يعني أن Plugin الذاكرة النشطة
لا تكشف حاليًا عن مدخلات bridge عامة بعد. شغّل `openclaw wiki doctor` أولًا،
ثم تأكد من أن Plugin الذاكرة النشطة تدعم القطع العامة.

## أوضاع المخزن

يدعم `memory-wiki` ثلاثة أوضاع للمخزن:

### `isolated`

مخزن خاص، ومصادر خاصة، ومن دون اعتماد على `memory-core`.

استخدم هذا عندما تريد أن تكون wiki مخزن معرفة منسقًا خاصًا بها.

### `bridge`

يقرأ قطع الذاكرة العامة وأحداث الذاكرة من Plugin الذاكرة النشطة
عبر منافذ SDK العامة للـ Plugin.

استخدم هذا عندما تريد أن تقوم wiki بتجميع وتنظيم القطع المصدّرة من
Plugin الذاكرة من دون الوصول إلى الأجزاء الخاصة الداخلية للـ Plugin.

يمكن لوضع bridge فهرسة:

- القطع المصدّرة من الذاكرة
- تقارير Dreaming
- الملاحظات اليومية
- ملفات جذر الذاكرة
- سجلات أحداث الذاكرة

### `unsafe-local`

منفذ هروب صريح على الجهاز نفسه للمسارات المحلية الخاصة.

هذا الوضع تجريبي عمدًا وغير قابل للنقل. استخدمه فقط عندما
تفهم حد الثقة وتحتاج تحديدًا إلى وصول إلى نظام الملفات المحلي لا يمكن
لوضع bridge توفيره.

## تخطيط المخزن

تقوم Plugin بتهيئة مخزن على النحو التالي:

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

يبقى المحتوى المُدار داخل كتل مولّدة. وتُحفَظ كتل الملاحظات البشرية.

مجموعات الصفحات الرئيسية هي:

- `sources/` للمواد الخام المستوردة والصفحات المدعومة عبر bridge
- `entities/` للأشياء، والأشخاص، والأنظمة، والمشاريع، والأغراض الدائمة
- `concepts/` للأفكار، والتجريدات، والأنماط، والسياسات
- `syntheses/` للملخصات المجمعة واللفات المجمعة المصانة
- `reports/` للوحات المعلومات المولدة

## الادعاءات والأدلة المنظمة

يمكن للصفحات أن تحمل frontmatter منظّمًا للـ `claims`، وليس مجرد نص حر.

يمكن أن يتضمن كل ادعاء:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

ويمكن أن تتضمن إدخالات الأدلة:

- `sourceId`
- `path`
- `lines`
- `weight`
- `note`
- `updatedAt`

هذا هو ما يجعل wiki تتصرف أكثر كطبقة معتقدات بدلًا من كونها
تفريغًا سلبيًا للملاحظات. إذ يمكن تتبع الادعاءات، وتقييمها، والطعن فيها، وحلّها بالرجوع إلى المصادر.

## مسار التجميع

تقرأ خطوة التجميع صفحات wiki، وتطبّع الملخصات، وتنتج قطعًا مستقرة موجّهة للآلة تحت:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

توجد هذه الملخصات حتى لا تضطر الوكلاء وشيفرة وقت التشغيل إلى استخراج المعلومات من صفحات Markdown.

كما أن المخرجات المُجمعة تدعم أيضًا:

- الفهرسة الأولى للـ wiki لتدفقات البحث/الجلب
- البحث عن claim-id والرجوع إلى الصفحات المالكة
- ملاحق prompts المضغوطة
- إنشاء التقارير/لوحات المعلومات

## لوحات المعلومات وتقارير الصحة

عندما تكون `render.createDashboards` مفعلة، يحافظ التجميع على لوحات المعلومات تحت `reports/`.

تتضمن التقارير المضمنة:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

وتتعقب هذه التقارير أشياء مثل:

- مجموعات ملاحظات التناقض
- مجموعات الادعاءات المتنافسة
- الادعاءات التي تفتقد إلى أدلة منظمة
- الصفحات والادعاءات منخفضة الثقة
- حالات القِدم أو الحداثة غير المعروفة
- الصفحات ذات الأسئلة غير المحلولة

## البحث والاسترجاع

يدعم `memory-wiki` خلفيتين للبحث:

- `shared`: استخدام تدفق البحث المشترك في الذاكرة عندما يكون متاحًا
- `local`: البحث محليًا في wiki

كما يدعم ثلاثة corpora:

- `wiki`
- `memory`
- `all`

سلوك مهم:

- يستخدم `wiki_search` و`wiki_get` الملخصات المجمعة كمرور أول عندما يكون ذلك ممكنًا
- يمكن لـ claim ids أن تُحل مرة أخرى إلى الصفحة المالكة
- تؤثر الادعاءات المتنازع عليها/القديمة/الحديثة في الترتيب
- يمكن أن تبقى تسميات المصدر موجودة في النتائج

القاعدة العملية:

- استخدم `memory_search corpus=all` من أجل مرور استرجاع واسع واحد
- استخدم `wiki_search` + `wiki_get` عندما يهمك الترتيب الخاص بـ wiki،
  أو المصدر، أو بنية المعتقدات على مستوى الصفحة

## أدوات الوكيل

تسجل Plugin الأدوات التالية:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

ما الذي تفعله:

- `wiki_status`: وضع المخزن الحالي، والصحة، وتوافر Obsidian CLI
- `wiki_search`: البحث في صفحات wiki، وعند الإعداد، في corpora الذاكرة المشتركة
- `wiki_get`: قراءة صفحة wiki حسب المعرّف/المسار أو الرجوع إلى corpus الذاكرة المشتركة
- `wiki_apply`: تعديلات ضيقة على التركيبات/البيانات التعريفية من دون جراحة حرة للصفحة
- `wiki_lint`: فحوصات هيكلية، وفجوات المصدر، والتناقضات، والأسئلة المفتوحة

كما تسجل Plugin مكمّل corpus للذاكرة غير حصري، بحيث يمكن لـ
`memory_search` و`memory_get` المشتركين الوصول إلى wiki عندما تدعم Plugin الذاكرة النشطة اختيار corpus.

## سلوك الـ prompt والسياق

عندما تكون `context.includeCompiledDigestPrompt` مفعلة، تُلحق أقسام prompt الخاصة بالذاكرة لقطة مُجمعة مضغوطة من `agent-digest.json`.

وهذه اللقطة صغيرة عمدًا وعالية الإشارة:

- الصفحات العليا فقط
- الادعاءات العليا فقط
- عدد التناقضات
- عدد الأسئلة
- مؤهلات الثقة/الحداثة

وهي اختيارية لأنّها تغيّر شكل prompt، وتكون مفيدة أساسًا لمحركات
السياق أو لتجميع prompts القديمة التي تستهلك ملاحق الذاكرة صراحةً.

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

- `vaultMode`: ‏`isolated` أو `bridge` أو `unsafe-local`
- `vault.renderMode`: ‏`native` أو `obsidian`
- `bridge.readMemoryArtifacts`: استيراد القطع العامة من Plugin الذاكرة النشطة
- `bridge.followMemoryEvents`: تضمين سجلات الأحداث في وضع bridge
- `search.backend`: ‏`shared` أو `local`
- `search.corpus`: ‏`wiki` أو `memory` أو `all`
- `context.includeCompiledDigestPrompt`: إلحاق لقطة ملخص مضغوط بأقسام prompt الخاصة بالذاكرة
- `render.createBacklinks`: إنشاء كتل ذات صلة حتمية
- `render.createDashboards`: إنشاء صفحات لوحة معلومات

### مثال: QMD + وضع bridge

استخدم هذا عندما تريد QMD للاسترجاع و`memory-wiki` لطبقة
معرفة مصانة:

```json5
{
  memory: {
    backend: "qmd",
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

يبقي هذا:

- QMD مسؤولًا عن استرجاع الذاكرة النشطة
- `memory-wiki` مركّزًا على الصفحات ولوحات المعلومات المجمعة
- شكل prompt دون تغيير حتى تفعّل عمدًا prompts الملخص المجمّع

## CLI

يكشف `memory-wiki` أيضًا عن سطح CLI من المستوى الأعلى:

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

راجع [CLI: wiki](/ar/cli/wiki) للمرجع الكامل للأوامر.

## دعم Obsidian

عندما تكون `vault.renderMode` مساوية لـ `obsidian`، تكتب Plugin
Markdown متوافقة مع Obsidian ويمكنها اختياريًا استخدام `obsidian` CLI الرسمية.

تشمل تدفقات العمل المدعومة:

- فحص الحالة
- البحث في المخزن
- فتح صفحة
- استدعاء أمر Obsidian
- الانتقال إلى الملاحظة اليومية

هذا اختياري. ولا تزال wiki تعمل في الوضع الأصلي من دون Obsidian.

## سير العمل الموصى به

1. احتفظ بـ Plugin الذاكرة النشطة لديك من أجل الاسترجاع/الترقية/Dreaming.
2. فعّل `memory-wiki`.
3. ابدأ بوضع `isolated` ما لم تكن تريد وضع bridge صراحةً.
4. استخدم `wiki_search` / `wiki_get` عندما يهم المصدر.
5. استخدم `wiki_apply` للتركيبات الضيقة أو تحديثات البيانات التعريفية.
6. شغّل `wiki_lint` بعد التغييرات المهمة.
7. فعّل لوحات المعلومات إذا كنت تريد رؤية القِدم/التناقضات.

## وثائق ذات صلة

- [نظرة عامة على الذاكرة](/ar/concepts/memory)
- [CLI: memory](/ar/cli/memory)
- [CLI: wiki](/ar/cli/wiki)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
