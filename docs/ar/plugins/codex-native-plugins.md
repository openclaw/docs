---
read_when:
    - تريد أن يستخدم وكلاء OpenClaw في وضع Codex إضافات Codex الأصلية
    - أنت تقوم بترحيل Plugins Codex المنسّقة من openai والمثبّتة من المصدر
    - أنت تستكشف أخطاء codexPlugins أو مخزون التطبيقات أو الإجراءات التدميرية أو تشخيصات تطبيق Plugin وتصلحها
summary: تكوين Plugins Codex الأصلية المُرحَّلة لوكلاء OpenClaw في وضع Codex
title: Plugins Codex الأصلية
x-i18n:
    generated_at: "2026-06-27T18:03:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 82d8eb7ca7c10db5220c49426f5e9db5992ee751d48b2ac8c89e93773fc87776
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

يتيح دعم Codex Plugin الأصلي لوكيل OpenClaw في وضع Codex استخدام قدرات التطبيق وPlugin الخاصة بـ Codex app-server داخل خيط Codex نفسه الذي يعالج دورة OpenClaw.

لا يحوّل OpenClaw إضافات Codex إلى أدوات OpenClaw ديناميكية اصطناعية باسم `codex_plugin_*`. تبقى استدعاءات Plugin في سجل Codex الأصلي، ويتولى Codex app-server تنفيذ MCP المدعوم بالتطبيق.

استخدم هذه الصفحة بعد أن يعمل [مشغّل Codex](/ar/plugins/codex-harness) الأساسي.

## المتطلبات

- يجب أن يكون وقت تشغيل وكيل OpenClaw المحدد هو مشغّل Codex الأصلي.
- يجب أن تكون `plugins.entries.codex.enabled` مضبوطة على true.
- يجب أن تكون `plugins.entries.codex.config.codexPlugins.enabled` مضبوطة على true.
- يدعم V1 فقط إضافات `openai-curated` التي لاحظت الهجرة أنها مثبتة من المصدر في موطن Codex المصدر.
- يجب أن يكون Codex app-server الهدف قادرًا على رؤية marketplace وPlugin ومخزون التطبيقات المتوقع.

لا يؤثر `codexPlugins` في تشغيلات OpenClaw، أو تشغيلات موفّر OpenAI العادية، أو روابط محادثات ACP، أو المشغّلات الأخرى، لأن هذه المسارات لا تنشئ خيوط Codex app-server مع إعدادات `apps` أصلية.

تأتي إمكانية وصول Codex من جهة OpenAI، وتوفر التطبيقات، وعناصر التحكم في تطبيقات/إضافات مساحة العمل من حساب Codex المسجّل دخوله. لمعرفة نموذج حساب OpenAI والإدارة، راجع [استخدام Codex مع خطة ChatGPT الخاصة بك](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## البدء السريع

عاين الهجرة من موطن Codex المصدر:

```bash
openclaw migrate codex --dry-run
```

استخدم التحقق الصارم من تطبيقات المصدر عندما تريد أن تتحقق الهجرة من إمكانية الوصول إلى تطبيقات المصدر قبل التخطيط لتنشيط Plugin الأصلي:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

طبّق الهجرة عندما تبدو الخطة صحيحة:

```bash
openclaw migrate apply codex --yes
```

تكتب الهجرة إدخالات `codexPlugins` صريحة للإضافات المؤهلة وتستدعي `plugin/install` في Codex app-server للإضافات المحددة. يبدو إعداد نموذجي بعد الهجرة كما يلي:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

بعد تغيير `codexPlugins`، تلتقط محادثات Codex الجديدة مجموعة التطبيقات المحدّثة تلقائيًا. استخدم `/new` أو `/reset` لتحديث المحادثة الحالية. لا يلزم إعادة تشغيل Gateway لتغييرات تمكين Plugin أو تعطيله.

## إدارة Plugin من الدردشة

استخدم `/codex plugins` عندما تريد فحص أو تغيير إضافات Codex الأصلية المهيأة من الدردشة نفسها التي تشغّل منها مشغّل Codex:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` هو اسم مستعار لـ `/codex plugins list`. يعرض خرج القائمة مفاتيح Plugin المهيأة، وحالة التشغيل/الإيقاف، واسم Codex Plugin، وmarketplace من `plugins.entries.codex.config.codexPlugins.plugins`.

يكتب `enable` و`disable` إلى إعداد OpenClaw فقط في `~/.openclaw/openclaw.json`؛ ولا يحرران `~/.codex/config.toml` أو يثبتان إضافات Codex جديدة. لا يستطيع تغيير حالة Plugin إلا المالك أو عميل Gateway لديه نطاق `operator.admin`.

يؤدي تمكين Plugin مهيأ أيضًا إلى تشغيل مفتاح `codexPlugins.enabled` العام. إذا كُتب Plugin معطّلًا لأن الهجرة أعادت `auth_required`، فأعد تفويض التطبيق في Codex قبل تمكينه في OpenClaw.

## آلية إعداد Plugin الأصلي

يحتوي التكامل على ثلاث حالات منفصلة:

- مثبّت: لدى Codex حزمة Plugin المحلية في وقت تشغيل app-server الهدف.
- ممكّن: إعداد OpenClaw مستعد لجعل Plugin متاحًا لدورات مشغّل Codex.
- قابل للوصول: يؤكد Codex app-server أن إدخالات تطبيقات Plugin متاحة للحساب النشط ويمكن ربطها بهوية Plugin التي تمت هجرتها.

الهجرة هي خطوة التثبيت/الأهلية الدائمة. أثناء التخطيط، يقرأ OpenClaw تفاصيل `plugin/read` من Codex المصدر ويتحقق من أن استجابة حساب Codex app-server المصدر هي حساب اشتراك ChatGPT. تتخطى استجابات الحساب غير ChatGPT أو المفقودة الإضافات المدعومة بالتطبيق مع `codex_subscription_required`. افتراضيًا، لا تستدعي الهجرة `app/list` المصدر؛ إذ تُخطط الإضافات المصدرية المدعومة بالتطبيق التي تجتاز بوابة الحساب من دون التحقق من إمكانية الوصول إلى تطبيق المصدر، وتتخطى إخفاقات نقل البحث عن الحساب مع `codex_account_unavailable`. مع `--verify-plugin-apps`، تأخذ الهجرة لقطة `app/list` جديدة من المصدر وتتطلب أن يكون كل تطبيق مملوك موجودًا وممكّنًا وقابلًا للوصول قبل التخطيط للتنشيط الأصلي. في هذا الوضع، تنتقل إخفاقات نقل البحث عن الحساب إلى بوابة مخزون تطبيقات المصدر. مخزون التطبيقات في وقت التشغيل هو فحص إمكانية الوصول في جلسة الهدف بعد الهجرة. ثم يحسب إعداد جلسة مشغّل Codex إعداد تطبيقات خيط مقيّدًا لتطبيقات Plugin الممكّنة والقابلة للوصول.

يُحسب إعداد تطبيقات الخيط عندما ينشئ OpenClaw جلسة مشغّل Codex أو يستبدل ربط خيط Codex قديمًا. لا يُعاد حسابه في كل دورة، لذلك تؤثر `/codex plugins enable` و`/codex plugins disable` في محادثات Codex الجديدة. استخدم `/new` أو `/reset` عندما ينبغي أن تلتقط المحادثة الحالية مجموعة التطبيقات المحدّثة.

## حدود دعم V1

V1 ضيق عمدًا:

- فقط إضافات `openai-curated` التي كانت مثبتة بالفعل في مخزون Codex app-server المصدر مؤهلة للهجرة.
- يجب أن تجتاز الإضافات المصدرية المدعومة بالتطبيق بوابة الاشتراك وقت الهجرة. يضيف `--verify-plugin-apps` بوابة مخزون تطبيقات المصدر. تُبلّغ الحسابات المحجوبة بالاشتراك، وفي وضع التحقق أيضًا التطبيقات المصدرية غير القابلة للوصول أو المعطّلة أو المفقودة أو إخفاقات تحديث مخزون تطبيقات المصدر، كعناصر يدوية متخطاة بدلًا من إدخالات إعداد ممكّنة. تُتخطى تفاصيل Plugin غير القابلة للقراءة قبل بوابة مخزون تطبيقات المصدر.
- تكتب الهجرة هويات Plugin صريحة مع `marketplaceName` و`pluginName`؛ ولا تكتب مسارات ذاكرة تخزين مؤقت محلية `marketplacePath`.
- `codexPlugins.enabled` هو مفتاح التمكين العام.
- لا يوجد حرف بدل `plugins["*"]` ولا مفتاح إعداد يمنح صلاحية تثبيت عشوائية.
- تُحفظ marketplaces غير المدعومة، وحزم Plugin المخزنة مؤقتًا، والخطافات، وملفات إعداد Codex في تقرير الهجرة للمراجعة اليدوية.

## مخزون التطبيقات والملكية

يقرأ OpenClaw مخزون تطبيقات Codex عبر `app/list` في app-server، ويخزّنه مؤقتًا لمدة ساعة واحدة، ويحدّث الإدخالات القديمة أو المفقودة بشكل غير متزامن. الذاكرة المؤقتة داخل الذاكرة فقط؛ تؤدي إعادة تشغيل CLI أو Gateway إلى إسقاطها، ويعيد OpenClaw بناءها من قراءة `app/list` التالية.

تستخدم الهجرة ووقت التشغيل مفاتيح ذاكرة مؤقتة منفصلة:

- يستخدم تحقق هجرة المصدر موطن Codex المصدر وخيارات بدء app-server المصدر. لا يعمل هذا إلا عند تعيين `--verify-plugin-apps`، ويفرض اجتيازًا جديدًا لـ `app/list` المصدر لتشغيل التخطيط ذلك.
- يستخدم إعداد وقت تشغيل الهدف هوية Codex app-server لوكيل الهدف عندما يبني إعداد تطبيقات خيط Codex. يلغي تنشيط Plugin صلاحية مفتاح ذاكرة التخزين المؤقت الهدف هذا ثم يفرض تحديثه بعد `plugin/install`.

لا يُعرض تطبيق Plugin إلا عندما يستطيع OpenClaw ربطه مجددًا بPlugin الذي تمت هجرته عبر ملكية مستقرة:

- معرّف التطبيق الدقيق من تفاصيل Plugin
- اسم خادم MCP معروف
- بيانات وصفية مستقرة وفريدة

تُستبعد الملكية المطابقة باسم العرض فقط أو الغامضة حتى يثبت تحديث المخزون التالي الملكية.

## إعداد تطبيقات الخيط

يحقن OpenClaw تصحيح `config.apps` مقيّدًا لخيط Codex: يتم تعطيل `_default`، ولا تُمكّن إلا التطبيقات المملوكة لإضافات تمت هجرتها وممكّنة.

يضبط OpenClaw `destructive_enabled` على مستوى التطبيق من سياسة `allow_destructive_actions` العامة أو الخاصة بكل Plugin الفعالة، ويترك Codex يفرض بيانات تعريف الأدوات التدميرية من تعليقات أدوات التطبيق الأصلية لديه. تضبط `true` و`"auto"` و`"always"` القيمة `destructive_enabled: true`؛ بينما تضبط `false` القيمة false. يتم تعطيل إعداد تطبيق `_default` مع `open_world_enabled: false`. تُصدر تطبيقات Plugin الممكّنة مع `open_world_enabled: true`؛ ولا يعرّض OpenClaw مفتاح سياسة عالم مفتوح منفصلًا لPlugin ولا يحتفظ بقوائم منع لأسماء الأدوات التدميرية لكل Plugin.

وضع الموافقة على الأدوات تلقائي افتراضيًا لتطبيقات Plugin، كي تستطيع أدوات القراءة غير التدميرية العمل من دون واجهة موافقة في الخيط نفسه. تبقى الأدوات التدميرية خاضعة لسياسة `destructive_enabled` لكل تطبيق.

## سياسة الإجراءات التدميرية

تُسمح طلبات Plugin التدميرية افتراضيًا لإضافات Codex التي تمت هجرتها، بينما تبقى المخططات غير الآمنة والملكية الغامضة تفشل بإغلاق آمن:

- القيمة الافتراضية العامة لـ `allow_destructive_actions` هي `true`.
- تتجاوز `allow_destructive_actions` الخاصة بكل Plugin السياسة العامة لذلك Plugin.
- عندما تكون السياسة `false`، يعيد OpenClaw رفضًا حتميًا.
- عندما تكون السياسة `true`، لا يقبل OpenClaw تلقائيًا إلا المخططات الآمنة التي يستطيع ربطها باستجابة موافقة، مثل حقل موافقة منطقي.
- عندما تكون السياسة `"auto"`، يعرّض OpenClaw إجراءات Plugin التدميرية إلى Codex لكنه يحوّل طلبات موافقة MCP المثبتة الملكية إلى موافقات OpenClaw Plugin قبل إعادة استجابة موافقة Codex.
- عندما تكون السياسة `"always"`، يستخدم OpenClaw بوابة الكتابة/التدمير نفسها في Codex مثل `"auto"`، ويمسح تجاوزات موافقة Codex الدائمة لكل أداة للتطبيق قبل بدء الخيط، ولا يعرض إلا موافقة أو رفضًا لمرة واحدة بحيث لا تستطيع الموافقات الدائمة كتم مطالبات إجراءات الكتابة اللاحقة.
- يؤدي فقدان هوية Plugin، أو غموض الملكية، أو فقدان معرّف الدورة، أو معرّف دورة خاطئ، أو مخطط طلب غير آمن إلى الرفض بدلًا من المطالبة.

## استكشاف الأخطاء وإصلاحها

**`auth_required`:** ثبّتت الهجرة Plugin، لكن أحد تطبيقاته ما زال يحتاج إلى مصادقة. يُكتب إدخال Plugin الصريح معطّلًا حتى تعيد التفويض وتمكّنه.

**`app_inaccessible` أو `app_disabled` أو `app_missing`:**
لم تثبّت الهجرة Plugin لأن مخزون تطبيقات Codex المصدر لم يُظهر كل التطبيقات المملوكة على أنها موجودة وممكّنة وقابلة للوصول أثناء تعيين `--verify-plugin-apps`. أعد التفويض أو مكّن التطبيق في Codex، ثم أعد تشغيل الهجرة مع `--verify-plugin-apps`.

**`app_inventory_unavailable`:** لم تثبّت الهجرة Plugin لأن التحقق الصارم من تطبيقات المصدر كان مطلوبًا وفشل تحديث مخزون تطبيقات Codex المصدر. أصلح وصول Codex app-server المصدر أو أعد المحاولة من دون `--verify-plugin-apps` إذا كنت تقبل الخطة الأسرع المحكومة ببوابة الحساب.

**`codex_subscription_required`:** لم تثبّت الهجرة Plugin المدعوم بالتطبيق لأن حساب Codex app-server المصدر لم يكن مسجّل الدخول بحساب اشتراك ChatGPT. سجّل الدخول إلى تطبيق Codex بمصادقة الاشتراك، ثم أعد تشغيل الهجرة.

**`codex_account_unavailable`:** لم تثبّت الهجرة Plugin المدعوم بالتطبيق لأن حساب Codex app-server المصدر تعذرت قراءته. أصلح مصادقة Codex app-server المصدر أو أعد التشغيل مع `--verify-plugin-apps` إذا كنت تريد أن يقرر مخزون تطبيقات المصدر الأهلية عند فشل البحث عن الحساب.

**`marketplace_missing` أو `plugin_missing`:** لا يستطيع Codex app-server الهدف رؤية marketplace أو Plugin المتوقع `openai-curated`. أعد تشغيل الهجرة مقابل وقت التشغيل الهدف أو افحص حالة Plugin في Codex app-server.

**`app_inventory_missing` أو `app_inventory_stale`:** جاءت جاهزية التطبيق من ذاكرة مؤقتة فارغة أو قديمة. يجدول OpenClaw تحديثًا غير متزامن ويستبعد تطبيقات Plugin حتى تُعرف الملكية والجاهزية.

**`app_ownership_ambiguous`:** تطابق مخزون التطبيقات باسم العرض فقط، لذلك لا يُعرض التطبيق لخيط Codex.

**تغيّر الإعداد لكن الوكيل لا يرى Plugin:** استخدم `/codex plugins list` لتأكيد الحالة المهيأة، ثم استخدم `/new` أو `/reset`. تحتفظ روابط خيط Codex الحالية بإعداد التطبيقات الذي بدأت به حتى ينشئ OpenClaw جلسة مشغّل جديدة أو يستبدل ربطًا قديمًا.

**تم رفض الإجراء التدميري:** تحقّق من قيم `allow_destructive_actions` العامة والخاصة بكل Plugin. حتى عندما تكون السياسة صحيحة، أو `"auto"`، أو
`"always"`، ستظل مخططات الاستدراج غير الآمنة وهوية Plugin الغامضة تفشل
بإغلاق آمن.

## ذات صلة

- [مشغّل Codex](/ar/plugins/codex-harness)
- [مرجع مشغّل Codex](/ar/plugins/codex-harness-reference)
- [وقت تشغيل مشغّل Codex](/ar/plugins/codex-harness-runtime)
- [مرجع الإعدادات](/ar/gateway/configuration-reference#codex-harness-plugin-config)
- [ترحيل CLI](/ar/cli/migrate)
