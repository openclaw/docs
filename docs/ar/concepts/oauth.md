---
read_when:
    - تريد فهم OAuth في OpenClaw من البداية إلى النهاية
    - تواجه مشكلات إبطال الرمز المميز / تسجيل الخروج
    - تريد تدفقات مصادقة Claude CLI أو OAuth
    - تريد حسابات متعددة أو توجيهًا حسب الملف الشخصي
summary: 'OAuth في OpenClaw: تبادل الرموز، والتخزين، وأنماط الحسابات المتعددة'
title: OAuth
x-i18n:
    generated_at: "2026-06-27T17:30:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4aa48fd468a541ed72935833a3196105798380799fa6135fe1dd9f68838307b6
    source_path: concepts/oauth.md
    workflow: 16
---

يدعم OpenClaw "مصادقة الاشتراك" عبر OAuth للموفرين الذين يقدمونها
(خصوصا **OpenAI Codex (ChatGPT OAuth)**). بالنسبة إلى Anthropic، أصبح التقسيم العملي
الآن:

- **مفتاح API من Anthropic**: فوترة Anthropic API العادية
- **Anthropic Claude CLI / مصادقة الاشتراك داخل OpenClaw**: أخبرنا موظفو Anthropic
  أن هذا الاستخدام مسموح به مرة أخرى

OpenAI Codex OAuth مدعوم صراحة للاستخدام في الأدوات الخارجية مثل
OpenClaw.

يخزن OpenClaw كلا من مصادقة مفتاح API من OpenAI وChatGPT/Codex OAuth تحت
معرف الموفر القياسي `openai`. معرفات الملفات الشخصية القديمة `openai-codex:*`
وإدخالات `auth.order.openai-codex` هي حالة قديمة يصلحها
`openclaw doctor --fix`؛ استخدم معرفات الملفات الشخصية `openai:*` و`auth.order.openai`
للإعدادات الجديدة.

بالنسبة إلى Anthropic في الإنتاج، مصادقة مفتاح API هي المسار الموصى به الأكثر أمانا.

تشرح هذه الصفحة:

- كيف يعمل **تبادل الرمز** في OAuth (PKCE)
- أين يتم **تخزين** الرموز (ولماذا)
- كيفية التعامل مع **حسابات متعددة** (ملفات شخصية + تجاوزات لكل جلسة)

يدعم OpenClaw أيضا **Plugins الموفرين** التي تشحن تدفقات OAuth أو مفاتيح API
الخاصة بها. شغلها عبر:

```bash
openclaw models auth login --provider <id>
```

## مصرف الرموز (سبب وجوده)

عادة ما ينشئ موفرو OAuth **رمز تحديث جديدا** أثناء تدفقات تسجيل الدخول/التحديث. يمكن لبعض الموفرين (أو عملاء OAuth) إبطال رموز التحديث القديمة عند إصدار رمز جديد للمستخدم/التطبيق نفسه.

العرض العملي:

- تسجل الدخول عبر OpenClaw _وكذلك_ عبر Claude Code / Codex CLI ← يسجل أحدهما "الخروج" عشوائيا لاحقا

لتقليل ذلك، يتعامل OpenClaw مع `auth-profiles.json` باعتباره **مصرف رموز**:

- يقرأ وقت التشغيل بيانات الاعتماد من **مكان واحد**
- يمكننا الاحتفاظ بملفات شخصية متعددة وتوجيهها بشكل حتمي
- إعادة استخدام CLI خارجي تعتمد على الموفر: يمكن لـ Codex CLI تمهيد ملف شخصي فارغ
  `openai:default`، ولكن بمجرد أن يملك OpenClaw ملف OAuth محليا،
  يصبح رمز التحديث المحلي هو المرجع القياسي. إذا رُفض رمز التحديث المحلي هذا،
  يمكن لـ OpenClaw استخدام رمز Codex CLI صالح للحساب نفسه كبديل وقت تشغيل فقط؛
  يمكن أن تبقى التكاملات الأخرى مدارة خارجيا وأن تعيد قراءة مخزن مصادقة
  CLI الخاص بها
- مسارات الحالة وبدء التشغيل التي تعرف بالفعل مجموعة الموفرين المهيأة تحدد نطاق
  اكتشاف CLI خارجي على تلك المجموعة، بحيث لا يتم فحص مخزن تسجيل دخول CLI غير ذي صلة
  لإعداد بموفر واحد

## التخزين (أين تعيش الرموز)

تخزن الأسرار في مخازن مصادقة الوكيل:

- ملفات تعريف المصادقة (OAuth + مفاتيح API + مراجع اختيارية على مستوى القيمة): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- ملف التوافق القديم: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (تتم إزالة إدخالات `api_key` الثابتة عند اكتشافها)

ملف استيراد قديم فقط (لا يزال مدعوما، لكنه ليس المخزن الرئيسي):

- `~/.openclaw/credentials/oauth.json` (يتم استيراده إلى `auth-profiles.json` عند أول استخدام)

كل ما سبق يحترم أيضا `$OPENCLAW_STATE_DIR` (تجاوز مجلد الحالة). المرجع الكامل: [/gateway/configuration](/ar/gateway/configuration-reference#auth-storage)

بالنسبة إلى مراجع الأسرار الثابتة وسلوك تفعيل لقطة وقت التشغيل، راجع [إدارة الأسرار](/ar/gateway/secrets).

عندما لا يملك وكيل ثانوي ملف مصادقة محليا، يستخدم OpenClaw توريث القراءة
من مخزن الوكيل الافتراضي/الرئيسي. لا ينسخ `auth-profiles.json` الخاص بالوكيل الرئيسي
عند القراءة. رموز تحديث OAuth حساسة بشكل خاص: تتخطاها تدفقات النسخ العادية
افتراضيا لأن بعض الموفرين يدوّرون رموز التحديث أو يبطلونها بعد الاستخدام.
هيئ تسجيل دخول OAuth منفصلا لوكيل عندما يحتاج إلى حساب مستقل.

## توافق رموز Anthropic القديمة

<Warning>
تقول وثائق Claude Code العامة من Anthropic إن استخدام Claude Code المباشر يبقى ضمن
حدود اشتراك Claude، وأخبرنا موظفو Anthropic أن استخدام Claude
CLI بأسلوب OpenClaw مسموح به مرة أخرى. لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI
واستخدام `claude -p` على أنهما معتمدان لهذا التكامل ما لم تنشر Anthropic
سياسة جديدة.

للاطلاع على وثائق خطط Claude Code المباشرة الحالية من Anthropic، راجع [استخدام Claude Code
مع خطة Pro أو Max الخاصة بك](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
و[استخدام Claude Code مع خطة Team أو Enterprise
الخاصة بك](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

إذا أردت خيارات أخرى بأسلوب الاشتراك في OpenClaw، فراجع [OpenAI
Codex](/ar/providers/openai)، و[Qwen Cloud Coding
Plan](/ar/providers/qwen)، و[MiniMax Coding Plan](/ar/providers/minimax)،
و[Z.AI / GLM Coding Plan](/ar/providers/zai).
</Warning>

يعرض OpenClaw أيضا رمز إعداد Anthropic كمسار مصادقة بالرمز مدعوم، لكنه يفضل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.

## ترحيل Anthropic Claude CLI

يدعم OpenClaw إعادة استخدام Anthropic Claude CLI مرة أخرى. إذا كان لديك بالفعل تسجيل دخول
Claude محلي على المضيف، يمكن لمسار onboarding/configure إعادة استخدامه مباشرة.

## تبادل OAuth (كيف يعمل تسجيل الدخول)

تنفذ تدفقات تسجيل الدخول التفاعلية في OpenClaw داخل `openclaw/plugin-sdk/llm` وتوصل إلى المعالجات/الأوامر الإرشادية.

### رمز إعداد Anthropic

شكل التدفق:

1. ابدأ رمز إعداد Anthropic أو ألصق الرمز من OpenClaw
2. يخزن OpenClaw بيانات اعتماد Anthropic الناتجة في ملف مصادقة
3. يبقى اختيار النموذج على `anthropic/...`
4. تظل ملفات مصادقة Anthropic الحالية متاحة للتحكم في التراجع/الترتيب

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth مدعوم صراحة للاستخدام خارج Codex CLI، بما في ذلك تدفقات عمل OpenClaw.

لا يزال أمر تسجيل الدخول يستخدم معرف موفر OpenAI القياسي:

```bash
openclaw models auth login --provider openai
```

استخدم `--profile-id openai:<name>` لحسابات ChatGPT/Codex OAuth متعددة في
وكيل واحد. لا تستخدم `openai-codex:<name>` للملفات الشخصية الجديدة. يرحل Doctor
تلك البادئة القديمة إلى معرف ملف شخصي `openai:*` خال من التعارضات؛ شغل
`openclaw models auth list --provider openai` بعد الإصلاح قبل نسخ
معرفات الملفات الشخصية إلى `auth.order` أو `/model ...@<profileId>`.

شكل التدفق (PKCE):

1. إنشاء محقق/تحدي PKCE + `state` عشوائي
2. فتح `https://auth.openai.com/oauth/authorize?...`
3. محاولة التقاط رد النداء على `http://127.0.0.1:1455/auth/callback`
4. إذا تعذر ربط رد النداء (أو كنت تعمل عن بعد/بلا واجهة)، ألصق عنوان URL/الرمز الخاص بإعادة التوجيه
5. التبادل عند `https://auth.openai.com/oauth/token`
6. استخراج `accountId` من رمز الوصول وتخزين `{ access, refresh, expires, accountId }`

مسار المعالج الإرشادي هو `openclaw onboard` ← خيار المصادقة `openai`.

## التحديث + انتهاء الصلاحية

تخزن الملفات الشخصية طابعا زمنيا `expires`.

في وقت التشغيل:

- إذا كان `expires` في المستقبل ← استخدم رمز الوصول المخزن
- إذا انتهت صلاحيته ← حدثه (تحت قفل ملف) واكتب فوق بيانات الاعتماد المخزنة
- إذا قرأ وكيل ثانوي ملف OAuth موروثا من الوكيل الرئيسي، فإن التحديث
  يكتب مرة أخرى إلى مخزن الوكيل الرئيسي بدلا من نسخ رمز التحديث إلى
  مخزن الوكيل الثانوي
- استثناء: تبقى بعض بيانات اعتماد CLI الخارجية مدارة خارجيا؛ يعيد OpenClaw
  قراءة مخازن مصادقة CLI تلك بدلا من إنفاق رموز تحديث منسوخة.
  تمهيد Codex CLI أضيق عمدا: يزرع ملفا شخصيا فارغا
  `openai:default`، ثم تبقي تحديثات OpenClaw الملف الشخصي المحلي
  قياسيا. إذا فشل تحديث Codex المحلي وكان لدى Codex CLI رمز
  صالح للحساب نفسه، فقد يستخدم OpenClaw ذلك الرمز لطلب وقت التشغيل الحالي
  دون كتابته مرة أخرى إلى `auth-profiles.json`.

تدفق التحديث تلقائي؛ عموما لا تحتاج إلى إدارة الرموز يدويا.

## الحسابات المتعددة (الملفات الشخصية) + التوجيه

نموذجان:

### 1) المفضل: وكلاء منفصلون

إذا أردت ألا يتفاعل "الشخصي" و"العمل" أبدا، فاستخدم وكلاء معزولين (جلسات + بيانات اعتماد + مساحة عمل منفصلة):

```bash
openclaw agents add work
openclaw agents add personal
```

ثم هيئ المصادقة لكل وكيل (المعالج الإرشادي) ووجه المحادثات إلى الوكيل الصحيح.

### 2) متقدم: ملفات شخصية متعددة في وكيل واحد

يدعم `auth-profiles.json` معرفات ملفات شخصية متعددة للموفر نفسه.

اختر أي ملف شخصي سيتم استخدامه:

- عالميا عبر ترتيب الإعدادات (`auth.order`)
- لكل جلسة عبر `/model ...@<profileId>`

مثال (تجاوز الجلسة):

- `/model Opus@anthropic:work`

كيفية معرفة معرفات الملفات الشخصية الموجودة:

- `openclaw channels list --json` (يعرض `auth[]`)

وثائق ذات صلة:

- [تجاوز فشل النموذج](/ar/concepts/model-failover) (قواعد التدوير + التهدئة)
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) (سطح الأوامر)

## ذات صلة

- [المصادقة](/ar/gateway/authentication) - نظرة عامة على مصادقة موفر النموذج
- [الأسرار](/ar/gateway/secrets) - تخزين بيانات الاعتماد وSecretRef
- [مرجع الإعدادات](/ar/gateway/configuration-reference#auth-storage) - مفاتيح إعداد المصادقة
