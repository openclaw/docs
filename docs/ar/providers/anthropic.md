---
read_when:
    - تريد استخدام نماذج Anthropic في OpenClaw
    - تريد تصفّح جلسات Claude CLI أو Claude Desktop عبر أجهزة كمبيوتر مقترنة
summary: استخدم Anthropic Claude عبر مفاتيح API أو Claude CLI في OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-07-16T14:58:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a61b4585092586727df48f7b809be73d80b0a9f1400294e76aea1b48313a216
    source_path: providers/anthropic.md
    workflow: 16
---

تُطوّر Anthropic عائلة نماذج **Claude**. يدعم OpenClaw مسارين للمصادقة:

- **مفتاح API** - وصول مباشر إلى Anthropic API مع فوترة حسب الاستخدام (نماذج `anthropic/*`)
- **Claude CLI** - إعادة استخدام تسجيل دخول حالي إلى Claude Code على المضيف نفسه

## تتبّع الاستخدام والتكلفة

يكتشف OpenClaw بيانات اعتماد Anthropic المتاحة ويختار واجهة الاستخدام المطابقة:

- تعرض بيانات اعتماد اشتراك/إعداد Claude نوافذ الحصة وميزانية الاستخدام الإضافي الاختيارية.
- يعرض `ANTHROPIC_ADMIN_KEY` أو `ANTHROPIC_ADMIN_API_KEY` تكلفة المؤسسة التي أبلغ عنها المزوّد واستخدام Messages API على مدار 30 يومًا في قسم **الاستخدام** في Control UI، بما في ذلك الإنفاق اليومي، وإجماليات الرموز/ذاكرة التخزين المؤقت، وأبرز النماذج، وفئات التكلفة.
- يُكتشف تلقائيًا اعتماد `sk-ant-admin...` المخزّن في ملف تعريف مزوّد Anthropic بوصفه مفتاح Admin API.

يأتي سجل تكلفة Admin API من [واجهة برمجة تطبيقات الاستخدام والتكلفة](https://platform.claude.com/docs/en/manage-claude/usage-cost-api) لدى Anthropic. وهو يمثل الفوترة الفعلية للمزوّد، بصورة منفصلة عن التكلفة التقديرية التي يستنتجها OpenClaw من الجلسات.

<Warning>
تُشغّل الواجهة الخلفية لـ Claude CLI في OpenClaw واجهة Claude Code CLI المثبّتة في
وضع الطباعة غير التفاعلي (`claude -p`). تصف وثائق Claude Code الحالية من Anthropic
هذا الوضع بأنه استخدام Agent SDK/برمجي. أوقف تحديث الدعم الصادر عن Anthropic في 15 يونيو 2026
مؤقتًا تغيير الفوترة المنفصلة المُعلن عنه لـ Agent SDK: ما زال استخدام Claude
Agent SDK و`claude -p` وتطبيقات الجهات الخارجية يُحتسب ضمن حدود استخدام
الاشتراك المسجّل الدخول، ولا يتوفر رصيد Agent SDK الشهري المُعلن عنه سابقًا
بينما تراجع Anthropic تلك الخطة.

ما زال Claude Code التفاعلي يُحتسب ضمن حدود خطة Claude المسجّل الدخول إليها.
مصادقة مفتاح API هي فوترة مباشرة حسب الاستخدام ولا تعتمد على تلك الخطة.
بالنسبة إلى مضيفي Gateway طويلي التشغيل، والأتمتة المشتركة، والإنفاق الإنتاجي
القابل للتوقع، استخدم مفتاح Anthropic API.

يمكن لمقالات الدعم الحالية من Anthropic تغيير هذا السلوك من دون
إصدار جديد من OpenClaw:

- [مرجع Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [استخدام Claude Agent SDK مع خطة Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [استخدام Claude Code مع خطة Pro أو Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [استخدام Claude Code مع خطة Team أو Enterprise](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [إدارة تكاليف Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## بدء الاستخدام

<Tabs>
  <Tab title="مفتاح API">
    **الأنسب لـ:** الوصول القياسي إلى API والفوترة حسب الاستخدام.

    <Steps>
      <Step title="الحصول على مفتاح API">
        أنشئ مفتاح API في [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="تشغيل الإعداد الأولي">
        ```bash
        openclaw onboard
        # اختر: Anthropic API key
        ```

        أو مرّر المفتاح مباشرةً:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="التحقق من توفر النموذج">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### مثال على الإعداد

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **الأنسب لـ:** إعادة استخدام تسجيل دخول حالي إلى Claude CLI من دون مفتاح API منفصل.

    <Steps>
      <Step title="التأكد من تثبيت Claude CLI وتسجيل الدخول إليه">
        تحقّق باستخدام:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="تشغيل الإعداد الأولي">
        ```bash
        openclaw onboard
        # اختر: Claude CLI
        ```

        يكتشف OpenClaw بيانات اعتماد Claude CLI الحالية ويعيد استخدامها.
      </Step>
      <Step title="التحقق من توفر النموذج">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    توجد تفاصيل الإعداد ووقت التشغيل للواجهة الخلفية لـ Claude CLI في [واجهات CLI الخلفية](/ar/gateway/cli-backends).
    </Note>

    <Warning>
    تتطلب إعادة استخدام Claude CLI تشغيل عملية OpenClaw على المضيف نفسه الذي
    تم تسجيل الدخول إلى Claude CLI عليه. يمكن لعمليات التثبيت عبر Docker الاحتفاظ
    بدليل رئيسي للحاوية وتسجيل الدخول إلى Claude Code داخله؛ راجع
    [الواجهة الخلفية لـ Claude CLI في Docker](/ar/install/docker#claude-cli-backend-in-docker).
    لا تثبّت عمليات تثبيت الحاويات الأخرى مثل [Podman](/ar/install/podman) دليل
    `~/.claude` الخاص بالمضيف في الإعداد أو وقت التشغيل؛ استخدم مفتاح Anthropic API هناك، أو اختر
    مزوّدًا يدير OpenClaw مصادقة OAuth له مثل
    [OpenAI Codex](/ar/providers/openai).
    </Warning>

    ### الحصول على رمز إعداد

    شغّل `claude setup-token` على أي جهاز مثبّت عليه Claude Code. سيطبع
    رمزًا طويل الأجل يبدأ بـ `sk-ant-oat01-`.

    أثناء الإعداد الأولي، الصق الرمز في تطبيق macOS باختيار
    **رمز إعداد Anthropic** ضمن **الاتصال باستخدام مفتاح API أو رمز**، أو استخدم:

    ```bash
    openclaw models auth login --provider anthropic --method setup-token
    ```

    ### مثال على الإعداد

    يُفضّل استخدام مرجع نموذج Anthropic القياسي مع تجاوز لوقت تشغيل CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    ما زالت مراجع النماذج القديمة `claude-cli/claude-opus-4-7` تعمل لأغراض
    التوافق، لكن ينبغي للإعداد الجديد إبقاء اختيار المزوّد/النموذج على
    `anthropic/*` ووضع الواجهة الخلفية للتنفيذ في سياسة وقت تشغيل المزوّد/النموذج.

    ### الفوترة و`claude -p`

    يستخدم OpenClaw مسار `claude -p` غير التفاعلي في Claude Code لعمليات تشغيل Claude CLI.
    تتعامل Anthropic حاليًا مع هذا المسار بوصفه استخدام Agent SDK/برمجيًا:

    - أوقف تحديث الدعم الصادر عن Anthropic في 15 يونيو 2026 مؤقتًا
      خطة رصيد Agent SDK المنفصلة المُعلن عنها سابقًا.
    - ما زال استخدام Claude Agent SDK ضمن خطة الاشتراك، و`claude -p`، وتطبيقات الجهات الخارجية
      يُحتسب ضمن حدود استخدام الاشتراك المسجّل الدخول.
    - لا يتوفر رصيد Agent SDK الشهري المُعلن عنه سابقًا بينما
      تراجع Anthropic تلك الخطة.
    - تستخدم عمليات تسجيل الدخول عبر Console/مفتاح API فوترة API حسب الاستخدام ولا تحصل على
      رصيد Agent SDK الخاص بالاشتراك.

    راجع [مقالة خطة Agent SDK
    من Anthropic](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    للاطلاع على إشعار الإيقاف المؤقت، ومقالات خطة Claude Code لمعرفة سلوك اشتراكات
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    و
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    يمكن لـ Anthropic تغيير سلوك فوترة Claude Code وحدود المعدل من دون
    إصدار جديد من OpenClaw. تحقّق من `claude auth status` و`/status`
    ووثائق Anthropic المرتبطة عندما تكون قابلية توقّع الفوترة مهمة.

    <Tip>
    للأتمتة الإنتاجية المشتركة، استخدم مفتاح Anthropic API بدلًا من
    Claude CLI. يدعم OpenClaw أيضًا خيارات قائمة على الاشتراك من
    [OpenAI Codex](/ar/providers/openai)، و[Qwen Cloud](/ar/providers/qwen)،
    و[MiniMax](/ar/providers/minimax)، و[Z.AI / GLM](/ar/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## جلسات Claude عبر أجهزة الكمبيوتر

يضيف Plugin المضمّن من Anthropic مجموعة **Claude Code** إلى الشريط الجانبي
المعتاد للجلسات. تُفتح الصفوف في جزء الدردشة المعتاد. ويكتشف جلسات Claude
Code غير المؤرشفة على Gateway وعلى مضيفي Node المتصلين:

- تأتي جلسات Claude CLI من سجلات فهرس مشاريع صالحة وملفات JSONL
  الحالية التي تحدد بادئة بياناتها الوصفية المحدودة جلسة `sdk-cli`
  غير متفرعة جانبيًا ضمن `~/.claude/projects/`.
- تستخدم جلسات Claude Desktop عنوان Desktop ووقت النشاط وحالة
  الأرشفة عندما تشير بياناتها الوصفية إلى معرّف جلسة Claude Code نفسه.
- لا تحتوي جلسة CLI فقط على علامة أرشفة، لذا تظل مرئية ما دام
  سجل محادثتها موجودًا.

لا يلزم إعداد إضافي في OpenClaw للاكتشاف. Plugin Anthropic
مضمّن ومفعّل افتراضيًا؛ ويعلن Node أصلي على macOS عن أوامر
جلسة Claude للقراءة فقط عند وجود دليل `~/.claude/projects/` المحلي.
وافق على ترقية إقران Node عند ظهور تلك الأوامر أول مرة.

يجمع الشريط الجانبي الصفوف بحسب Gateway أو مضيف Node المقترن، ويبدأ بأحدث
صفحة محدودة من كل مضيف، ويُحدَّث وفق الوتيرة المعتادة البالغة 30 ثانية.
استخدم **تحميل المزيد من الجلسات** أسفل مجموعة كتالوج لإلحاق الصفحة التالية
لكل مضيف لديه سجل إضافي؛ تظل الصفوف الملحقة مرئية وتُجلب مجددًا
بالعمق نفسه عبر عمليات التحديث. تستخدم عملاء الكتالوج
`sessions.catalog.list`؛ ويستخدم فتح صف `sessions.catalog.read`.

يحل استحواذ الطرفية `claude` من PATH لصدفة تسجيل الدخول الخاصة بمستخدم
المضيف المالك قبل PATH للخدمة/البرنامج الخفي. يحافظ ذلك على اتساق الجلسات
التي يشغّلها التطبيق مع Claude CLI الذي يحصل عليه المشغّل في طرفية عادية.

تؤدي عملية اختيار صف إلى قراءة أحدث صفحة من سجل المحادثة أولًا. يتبع
**تحميل عناصر أقدم من سجل المحادثة** مؤشر بايتات معتمًا ويقرأ قسمًا محدودًا آخر
من ملف JSONL بدلًا من تحميل السجل بالكامل. يُحتفظ بمحتوى المستخدم والمساعد
والاستدلال واستدعاء الأدوات ونتائج الأدوات المعتاد. يُشار بوضوح إلى اقتطاع أي
عنصر منفرد يتجاوز حد الأمان الأقصى لـ Node/Gateway.

بالنسبة إلى صف `claude-cli` محلي في Gateway، تؤدي الكتابة في محرر الرسائل
المعتاد إلى استدعاء `sessions.catalog.continue`. يعيد OpenClaw حل سجل الكتالوج المحلي،
وينشئ جلسة أصلية مقفلة على نموذج أو يعيد استخدامها، ويستورد بحد أقصى 200 عنصر
مرئي أو 512 KiB، ويهيئ ربط Claude CLI. تُستأنف الجولة الأولى باستخدام
`--fork-session`؛ ويعيّن Claude معرّف جلسة جديدًا للتفرع، لذلك تستخدم الجولات
اللاحقة التفرع وتظل الجلسة المصدر من دون تعديل.

يمكن لمضيف Node من دون واجهة رسومية أيضًا جعل صفوف Claude CLI لديه قابلة للمتابعة
من خلال تمكين الإعداد المحلي لـ Node أدناه وإعادة تشغيل مضيف Node:

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

لا يعلن Node عن `agent.cli.claude.run.v1` إلا عند تمكين الإعداد
وإمكانية حل الملف التنفيذي المحلي `claude`. يعيد OpenClaw حل سجل الكتالوج
على ذلك الـ Node، ويستورد السجل المحدود نفسه، ويربط الجلسة المعتمدة بالـ Node
ودليل العمل الذي أبلغ عنه الكتالوج. تشغّل كل جولة عملية `claude -p`
الحقيقية الخاصة بالـ Node باستخدام ملفات Claude وتسجيل الدخول على ذلك الـ Node.
تظل سياسة الموافقة على التنفيذ الخاصة بالـ Node سارية؛ ولا يستطيع Gateway فرض الاشتراك.

متابعة Node بالإصدار v1 لمرة واحدة فقط. وهي تحذف إعداد MCP للاسترجاع الحلقي
لـ Gateway ووسائط Plugin مهارات Gateway، ولا تعيد التهيئة من سجل محادثة Gateway،
وترفض المرفقات والصور. تظل صفوف Claude Desktop للعرض فقط. كما تظل Nodes تطبيق
macOS الأصلي للعرض فقط إلى أن يعلن التطبيق عن أمر التشغيل.

<Note>
تظل جلسات Claude على Node المقترن للقراءة فقط ما لم يعلن Node من دون واجهة رسومية
صراحةً عن `agent.cli.claude.run.v1`. لا يعدّل OpenClaw مطلقًا بيانات Claude Desktop
الوصفية ولا يؤرشف جلسات Claude. تتطلب الصفحة اتصال مشغّل بنطاق كتابة
لأنها تستخدم `node.invoke` موثّقًا؛ وتظل عمليتا العرض والقراءة
للقراءة فقط حتى على Node ممكّن للمتابعة.
</Note>

راجع [Nodes: جلسات Claude وسجلات المحادثات](/ar/nodes#claude-sessions-and-transcripts)
للتعرف على أمر Node وحد الأمان.

## إعدادات التفكير الافتراضية (Claude Sonnet 5 وMythos 5 وFable 5 و4.8 و4.6)

`anthropic/claude-sonnet-5` يستخدم التفكير التكيفي بمستوى جهد `high` افتراضيًا.
استخدم `/think off` لتعطيل التفكير، أو `/think xhigh|max` لمستويات الجهد
الأصلية الأعلى للنموذج. يحذف OpenClaw ميزانيات التفكير اليدوية، ومعلمات
أخذ العينات المخصصة، والتمهيدات المسبقة للمساعد، وPriority Tier لـ Sonnet 5 لأن
Anthropic لا تدعم ميزات الطلب هذه في هذا النموذج.
يستخدم الكتالوج تسعير Anthropic التمهيدي للإدخال/الإخراج البالغ `$2/$10` حتى
31 أغسطس 2026؛ ويبدأ التسعير القياسي البالغ `$3/$15` في 1 سبتمبر 2026.

`anthropic/claude-fable-5` يستخدم دائمًا التفكير التكيفي ويعتمد افتراضيًا مستوى جهد `high`.
لا تسمح Anthropic بتعطيل التفكير لهذا النموذج، لذا
يُربط `/think off` و`/think minimal` بمستوى جهد `low` بدلًا من ذلك. كما يحذف OpenClaw
قيم درجة الحرارة المخصصة من طلبات Fable 5، لأن Anthropic ترفض
تجاوز درجة الحرارة في أي طلب مفعّل فيه التفكير.

`anthropic/claude-mythos-5` هو نموذج محدود الوصول بعقد التفكير
التكيفي الدائم نفسه. يعتمد OpenClaw افتراضيًا `high`، ويربط `/think off` و
`/think minimal` بـ `low`، ويحذف معلمات أخذ العينات التي يحددها المستدعي.
ينشر الكتالوج نافذة السياق الخاصة به التي تبلغ 1,000,000 رمز، وحد الإخراج البالغ 128,000 رمز،
ودعم إدخال الصور، وتسعير الإدخال/الإخراج البالغ `$10/$50`.

يبقي Claude Opus 4.8 التفكير معطلًا افتراضيًا في OpenClaw. عندما تفعّل
التفكير التكيفي صراحةً باستخدام `/think high|xhigh|max`، يرسل OpenClaw
قيم جهد Opus 4.8 الخاصة بـ Anthropic؛ وتعتمد نماذج Claude 4.6 (Opus 4.6 وSonnet 4.6)
افتراضيًا `adaptive`.

تجاوز الإعداد لكل رسالة باستخدام `/think:<level>` أو ضمن معلمات النموذج:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
وثائق Anthropic ذات الصلة:
- [التفكير التكيفي](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [التفكير الممتد](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## الرجوع الاحتياطي عند رفض السلامة (Claude Fable 5)

<Warning>
يعني استخدام Claude Fable 5 استخدام Claude Opus 4.8 أيضًا. يأتي Fable 5 مزودًا
بمصنّفات سلامة يمكنها رفض طلب، والاسترداد المعتمد من Anthropic
هو أن يتولى `claude-opus-4-8` تلك المحاولة. يشترك OpenClaw في هذا
تلقائيًا لطلبات مفتاح API المباشرة، لذا تُجاب بعض محاولات Fable
وتُفوَّتر باعتبارها Claude Opus 4.8. إذا كانت سياستك أو ميزانيتك لا تسمح
بالمحاولات التي ينفذها Opus، فلا تحدد `anthropic/claude-fable-5`.
</Warning>

### سبب وجود ذلك

تعيد مصنّفات Fable 5 القيمة `stop_reason: "refusal"` عند الطلبات الواقعة ضمن نطاقات
مقيّدة، كما تنتج نتائج إيجابية كاذبة في الأعمال الحميدة القريبة منها (أدوات
الأمان، أو علوم الحياة، أو حتى مطالبة النموذج بإعادة إنتاج
استدلاله الخام). من دون رجوع احتياطي، تنتهي المحاولة بخطأ رغم أن
نموذج Claude آخر كان سيعالجها دون مشكلة - وتطلب رسالة الرفض الخاصة بـ Anthropic
نفسها من مكاملي API تهيئة نموذج رجوع احتياطي.

### آلية العمل

1. لكل طلب مباشر باستخدام مفتاح API إلى `anthropic/claude-fable-5`، يرسل OpenClaw
   اشتراك Anthropic في الرجوع الاحتياطي من جانب الخادم: ترويسة الإصدار التجريبي
   `server-side-fallback-2026-06-01` بالإضافة إلى
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 هو هدف
   الرجوع الاحتياطي الوحيد الذي تسمح به Anthropic لـ Fable 5.
2. لا يؤدي إلى الرجوع الاحتياطي إلا رفض صادر عن مصنّف السلامة. أما حدود المعدل،
   والحمل الزائد، وأخطاء الخادم فتتصرف تمامًا كما في السابق وتمر عبر
   [تجاوز فشل النموذج](/ar/concepts/model-failover) المعتاد في OpenClaw.
3. يحدث الإنقاذ داخل الاستدعاء نفسه. يكون الرفض قبل أي إخراج
   غير مرئي باستثناء زمن الاستجابة؛ وتأتي الإجابة كاملة من Opus 4.8. عند حدوث
   رفض في منتصف البث، يُحتفظ بالنص الجزئي كبادئة يتابع منها نموذج
   الرجوع الاحتياطي، بينما يُتخلص من استدلال النموذج الرافض واستدعاءات أدواته
   وفقًا لقواعد إعادة التشغيل الخاصة بـ Anthropic (يجب عدم إعادتها أو
   تنفيذها).
4. إذا رفض Claude Opus 4.8 أيضًا، تُظهر المحاولة الرفض على هيئة
   خطأ، تمامًا كما كان الحال قبل هذه الميزة.

يحدث الرجوع الاحتياطي على مستوى API الخاص بـ Anthropic، لذا لا يلزم
وجود `claude-opus-4-8` في قائمة النماذج المهيأة أو سلسلة الرجوع الاحتياطي لديك - إذ يمكن
لمفتاح API قادر على تشغيل Fable أن يشغّل Opus دائمًا.

### قابلية الرصد والفوترة

- تسجّل المحاولة التي ينفذها نموذج الرجوع الاحتياطي تشخيصًا باسم `provider_fallback` في
  رسالة المساعد، يذكر `fromModel` و`toModel`، ويعرض
  `responseModel` الخاص بالرسالة القيمة `claude-opus-4-8`.
- تفوِّتر Anthropic كل محاولة على حدة: الرفض قبل الإخراج مجاني، وتُفوَّتر عملية الإنقاذ
  وفق أسعار Claude Opus 4.8 (وهي حاليًا نصف أسعار Fable 5). ويسعّر تقدير
  OpenClaw لتكلفة كل محاولة المحاولات المنفذة عبر الرجوع الاحتياطي وفق أسعار Opus لمطابقة ذلك.
- يؤدي الرفض في منتصف البث أيضًا إلى فوترة الجزء الجزئي الذي بثه Fable بالفعل
  من جانب Anthropic؛ ويُبلَّغ عن هذا الجزء في استخدام كل محاولة
  ضمن API، لكنه لا يُضمَّن في تقدير OpenClaw لكل محاولة.

### النطاق

ينطبق على `anthropic/claude-fable-5` مع مصادقة مفتاح API مقابل
`api.anthropic.com`. تظل طلبات OAuth (إعادة استخدام اشتراك Claude CLI)، وعناوين URL الأساسية
للخادم الوكيل، وBedrock، وVertex، وFoundry دون تغيير، ولا تزال تُظهر
حالات الرفض هناك على هيئة أخطاء.

تم التحقق المباشر: يُرفض طلب حميد يطلب من Fable 5 إعادة إنتاج سلسلة
أفكاره الخام باستخدام `category: "reasoning_extraction"` عند إرساله من دون
عمليات رجوع احتياطي، بينما يعيد الطلب نفسه عبر OpenClaw إجابة عادية ينفذها Opus
مع إرفاق تشخيص `provider_fallback`.

راجع [دليل حالات الرفض والرجوع
الاحتياطي](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback) من Anthropic
لمعرفة السلوك الأساسي.

## التخزين المؤقت للمطالبات

يدعم OpenClaw ميزة التخزين المؤقت للمطالبات من Anthropic لمصادقة مفتاح API.

| القيمة               | مدة التخزين المؤقت | الوصف                            |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (افتراضي) | 5 دقائق      | يُطبّق تلقائيًا لمصادقة مفتاح API |
| `"long"`            | ساعة واحدة         | تخزين مؤقت ممتد                         |
| `"none"`            | دون تخزين مؤقت     | تعطيل التخزين المؤقت للمطالبات                 |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="تجاوزات التخزين المؤقت لكل وكيل">
    استخدم معلمات مستوى النموذج كأساس، ثم تجاوزها لوكلاء محددين عبر `agents.list[].params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    ترتيب دمج الإعدادات:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (المطابق لـ `id`، يتجاوز حسب المفتاح)

    يتيح ذلك لأحد الوكلاء الاحتفاظ بذاكرة تخزين مؤقت طويلة الأمد، بينما يعطّل وكيل آخر يستخدم النموذج نفسه التخزين المؤقت لحركة المرور المتدفقة أو منخفضة إعادة الاستخدام.

  </Accordion>

  <Accordion title="ملاحظات Bedrock Claude">
    - تقبل نماذج Anthropic Claude على Bedrock ‏(`amazon-bedrock/*anthropic.claude*`) تمرير `cacheRetention` عند تهيئته.
    - تُجبَر نماذج Bedrock غير التابعة لـ Anthropic على `cacheRetention: "none"` في وقت التشغيل.
    - تُعيّن الإعدادات الافتراضية الذكية لمفتاح API أيضًا قيمة أولية لـ `cacheRetention: "short"` لمراجع Claude على Bedrock عند عدم تعيين قيمة صريحة.

  </Accordion>
</AccordionGroup>

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="الوضع السريع">
    يعيّن مفتاح التبديل المشترك `/fast` في OpenClaw حقل `service_tier` في Anthropic إلى `api.anthropic.com` لحركة المرور المباشرة التي تستخدم مفتاح API.

    | الأمر | يُطابق |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - ينطبق فقط على طلبات `api.anthropic.com` المباشرة التي تُجرى باستخدام مفتاح API. لا تتلقى طلبات OAuth/رمز الاشتراك ومسارات الوكيل حقل `service_tier` مطلقًا.
    - تتجاوز معاملات `serviceTier` أو `service_tier` الصريحة قيمة `/fast` عند تعيين كليهما.
    - في الحسابات التي لا تتوفر فيها سعة Priority Tier، قد تتحول `service_tier: "auto"` إلى `standard`.

    </Note>

  </Accordion>

  <Accordion title="فهم الوسائط (الصور وPDF)">
    يسجّل Plugin ‏Anthropic المضمّن إمكانية فهم الصور وملفات PDF. يحلّ OpenClaw
    إمكانات الوسائط تلقائيًا من مصادقة Anthropic المهيأة؛ ولا يلزم
    أي إعداد إضافي.

    | الخاصية        | القيمة                 |
    | --------------- | --------------------- |
    | النموذج الافتراضي   | `claude-opus-4-8`     |
    | الإدخال المدعوم | الصور ومستندات PDF |

    عند إرفاق صورة أو ملف PDF بمحادثة، يوجّهها OpenClaw تلقائيًا
    عبر موفّر فهم الوسائط من Anthropic.

  </Accordion>

  <Accordion title="نافذة سياق بسعة 1M">
    تمتلك نماذج Claude Sonnet 5 وMythos 5 وFable 5 نافذة إدخال بسعة
    1,000,000 رمز بالضبط، وتدعم ما يصل إلى 128,000 رمز إخراج. كما أصبحت نافذة
    السياق بسعة 1M من Anthropic متاحة بشكل عام على نماذج Claude 4.x ذات التفكير التكيفي:
    Opus 4.8 وOpus 4.7 وOpus 4.6 وSonnet 4.6. يضبط OpenClaw أحجام هذه النماذج
    تلقائيًا، ولا حاجة إلى `params.context1m`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-5": {},
            "anthropic/claude-mythos-5": {},
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    يمكن للإعدادات الأقدم الاحتفاظ بـ `params.context1m: true`؛ فهو لا يُحدث أي تأثير ضار
    في هذه النماذج، ولم يعد OpenClaw يرسل ترويسة الإصدار التجريبي المتوقفة
    `context-1m-2025-08-07` في جميع الأحوال. تُسقط إدخالات إعداد `anthropicBeta`
    الأقدم التي تحمل تلك القيمة أثناء حل ترويسات الطلب، وتظل
    نماذج Claude الأقدم غير المدعومة على نافذة سياقها العادية.

    يعمل `params.context1m: true` بالطريقة نفسها مع الواجهة الخلفية لـ Claude CLI
    ‏(`claude-cli/*`): تحصل نماذج Opus وSonnet المؤهلة والقادرة على الإتاحة العامة بالفعل على
    نافذة 1M تلقائيًا، لذا يكون هذا المعامل اختياريًا هناك أيضًا.

    <Warning>
    يتطلب وصولًا إلى السياق الطويل ضمن بيانات اعتماد Anthropic. تحتفظ مصادقة OAuth/رمز الاشتراك بترويسات Anthropic التجريبية المطلوبة، لكن OpenClaw يزيل ترويسة 1M التجريبية المتوقفة إذا ظلت موجودة في إعداد أقدم.
    </Warning>

  </Accordion>

  <Accordion title="سياق Claude Opus 4.8 بسعة 1M">
    يمتلك `anthropic/claude-opus-4-8` ومتغيره `claude-cli` نافذة سياق
    بسعة 1M افتراضيًا؛ ولا حاجة إلى `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="أخطاء 401 / أصبح الرمز غير صالح فجأة">
    تنتهي صلاحية مصادقة رمز Anthropic ويمكن إلغاؤها. للإعدادات الجديدة، استخدم مفتاح API من Anthropic بدلًا منها.
  </Accordion>

  <Accordion title='لم يُعثر على مفتاح API للموفّر "anthropic"'>
    تكون مصادقة Anthropic **خاصة بكل وكيل**؛ ولا ترث الوكلاء الجدد مفاتيح الوكيل الرئيسي. أعِد تشغيل الإعداد الأولي لذلك الوكيل (أو هيّئ مفتاح API على مضيف Gateway)، ثم تحقّق باستخدام `openclaw models status`.
  </Accordion>

  <Accordion title='لم يُعثر على بيانات اعتماد للملف الشخصي "anthropic:default"'>
    شغّل `openclaw models status` لمعرفة ملف تعريف المصادقة النشط. أعِد تشغيل الإعداد الأولي، أو هيّئ مفتاح API لمسار ملف التعريف هذا.
  </Accordion>

  <Accordion title="لا يتوفر ملف تعريف مصادقة (جميعها في فترة تهدئة)">
    تحقّق من `openclaw models status --json` بحثًا عن `auth.unusableProfiles`. يمكن أن تقتصر فترات التهدئة الناتجة عن حدود معدل Anthropic على نموذج بعينه، لذا قد يظل نموذج Anthropic آخر من العائلة نفسها قابلًا للاستخدام. أضف ملف تعريف Anthropic آخر أو انتظر انتهاء فترة التهدئة.
  </Accordion>
</AccordionGroup>

<Note>
لمزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="واجهات CLI الخلفية" href="/ar/gateway/cli-backends" icon="terminal">
    إعداد واجهة Claude CLI الخلفية وتفاصيل وقت التشغيل.
  </Card>
  <Card title="التخزين المؤقت للمطالبات" href="/ar/reference/prompt-caching" icon="database">
    كيفية عمل التخزين المؤقت للمطالبات عبر المزوّدين.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
