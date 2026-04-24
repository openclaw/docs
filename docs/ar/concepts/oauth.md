---
read_when:
    - تريد فهم OAuth في OpenClaw من البداية إلى النهاية
    - واجهت مشكلات في إبطال الرموز / تسجيل الخروج
    - تريد تدفقات مصادقة Claude CLI أو OAuth
    - تريد حسابات متعددة أو توجيهًا حسب الملف الشخصي
summary: 'OAuth في OpenClaw: تبادل الرموز، والتخزين، وأنماط الحسابات المتعددة'
title: OAuth
x-i18n:
    generated_at: "2026-04-24T07:38:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81b8891850123c32a066dbfb855feb132bc1f2bbc694f10ee2797b694bd5d848
    source_path: concepts/oauth.md
    workflow: 15
---

يدعم OpenClaw ما يُعرف باسم “مصادقة الاشتراك” عبر OAuth للـ providers الذين يقدّمونها
(وأبرزهم **OpenAI Codex (ChatGPT OAuth)**). أما بالنسبة إلى Anthropic، فأصبح
التقسيم العملي الآن كالتالي:

- **مفتاح Anthropic API**: فوترة Anthropic API العادية
- **مصادقة Anthropic Claude CLI / مصادقة الاشتراك داخل OpenClaw**: أخبرنا موظفو Anthropic
  أن هذا الاستخدام مسموح به مجددًا

إن OAuth الخاص بـ OpenAI Codex مدعوم صراحةً للاستخدام في أدوات خارجية مثل
OpenClaw. تشرح هذه الصفحة ما يلي:

بالنسبة إلى Anthropic في الإنتاج، تبقى مصادقة مفتاح API هي المسار الأكثر أمانًا والموصى به.

- كيف يعمل **تبادل الرموز** في OAuth ‏(PKCE)
- أين يتم **تخزين** الرموز (ولماذا)
- كيفية التعامل مع **الحسابات المتعددة** (الملفات الشخصية + التجاوزات لكل جلسة)

يدعم OpenClaw أيضًا **Plugins للـ provider** تشحن معها تدفقات OAuth أو
مفاتيح API الخاصة بها. شغّلها عبر:

```bash
openclaw models auth login --provider <id>
```

## حوض استقبال الرموز (لماذا يوجد)

غالبًا ما يصدر مزودو OAuth **رمز refresh جديدًا** أثناء تدفقات تسجيل الدخول/التحديث. ويمكن لبعض المزودين (أو عملاء OAuth) إبطال رموز refresh الأقدم عند إصدار رمز جديد للمستخدم/التطبيق نفسه.

العرض العملي للمشكلة:

- تسجل الدخول عبر OpenClaw _وأيضًا_ عبر Claude Code / Codex CLI → ثم يُسجَّل خروج أحدهما عشوائيًا لاحقًا

ولتقليل ذلك، يتعامل OpenClaw مع `auth-profiles.json` بوصفه **حوض استقبال للرموز**:

- يقرأ وقت التشغيل بيانات الاعتماد من **مكان واحد**
- يمكننا الاحتفاظ بعدة ملفات شخصية وتوجيهها بشكل حتمي
- عند إعادة استخدام بيانات الاعتماد من CLI خارجي مثل Codex CLI، يقوم OpenClaw
  بعكسها مع معلومات المصدر ويعيد قراءة ذلك المصدر الخارجي بدلًا من
  تدوير رمز refresh بنفسه

## التخزين (أين توجد الرموز)

تُخزَّن الأسرار **لكل وكيل**:

- الملفات الشخصية للمصادقة (OAuth + مفاتيح API + مراجع اختيارية على مستوى القيمة): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- ملف التوافق القديم: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (تُنظَّف إدخالات `api_key` الثابتة عند اكتشافها)

ملف الاستيراد القديم فقط (لا يزال مدعومًا، لكنه ليس المخزن الرئيسي):

- `~/.openclaw/credentials/oauth.json` (يُستورد إلى `auth-profiles.json` عند أول استخدام)

تحترم جميع الملفات المذكورة أعلاه أيضًا `$OPENCLAW_STATE_DIR` (تجاوز دليل الحالة). المرجع الكامل: [/gateway/configuration](/ar/gateway/configuration-reference#auth-storage)

بالنسبة إلى مراجع الأسرار الثابتة وسلوك تفعيل لقطة وقت التشغيل، راجع [إدارة الأسرار](/ar/gateway/secrets).

## توافق الرموز القديمة لـ Anthropic

<Warning>
تنص وثائق Claude Code العامة من Anthropic على أن الاستخدام المباشر لـ Claude Code يبقى ضمن
حدود اشتراك Claude، وقد أخبرنا موظفو Anthropic أن استخدام Claude
CLI على نمط OpenClaw مسموح به مجددًا. لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI
واستخدام `claude -p` باعتبارهما مسموحًا بهما لهذا التكامل ما لم تنشر Anthropic
سياسة جديدة.

للاطلاع على وثائق الخطط الحالية الخاصة بالاستخدام المباشر لـ Claude Code من Anthropic، راجع [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
و[Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

إذا كنت تريد خيارات أخرى على نمط الاشتراك في OpenClaw، فراجع [OpenAI
Codex](/ar/providers/openai)، و[Qwen Cloud Coding
Plan](/ar/providers/qwen)، و[MiniMax Coding Plan](/ar/providers/minimax)،
و[Z.AI / GLM Coding Plan](/ar/providers/glm).
</Warning>

يكشف OpenClaw أيضًا setup-token الخاص بـ Anthropic باعتباره مسار مصادقة مدعومًا قائمًا على الرمز، لكنه يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.

## ترحيل Anthropic Claude CLI

يدعم OpenClaw إعادة استخدام Anthropic Claude CLI مجددًا. إذا كان لديك بالفعل
تسجيل دخول Claude محلي على المضيف، فيمكن لعمليتي onboarding/configure إعادة استخدامه مباشرةً.

## تبادل OAuth (كيف يعمل تسجيل الدخول)

تُنفَّذ تدفقات تسجيل الدخول التفاعلية في OpenClaw داخل `@mariozechner/pi-ai` ويتم ربطها بالمعالجات/الأوامر.

### Anthropic setup-token

شكل التدفق:

1. ابدأ Anthropic setup-token أو paste-token من OpenClaw
2. يخزّن OpenClaw بيانات اعتماد Anthropic الناتجة في ملف تعريف مصادقة
3. يظل اختيار النموذج على `anthropic/...`
4. تبقى ملفات تعريف مصادقة Anthropic الحالية متاحة للرجوع أو التحكم في الترتيب

### OpenAI Codex (ChatGPT OAuth)

إن OAuth الخاص بـ OpenAI Codex مدعوم صراحةً للاستخدام خارج Codex CLI، بما في ذلك تدفقات عمل OpenClaw.

شكل التدفق (PKCE):

1. أنشئ verifier/challenge لـ PKCE بالإضافة إلى `state` عشوائي
2. افتح `https://auth.openai.com/oauth/authorize?...`
3. حاول التقاط callback على `http://127.0.0.1:1455/auth/callback`
4. إذا تعذر ربط callback (أو كنت تعمل عن بُعد/من دون واجهة)، الصق عنوان URL أو الرمز الخاص بإعادة التوجيه
5. نفّذ التبادل عند `https://auth.openai.com/oauth/token`
6. استخرج `accountId` من رمز الوصول وخزّن `{ access, refresh, expires, accountId }`

مسار المعالج هو `openclaw onboard` → اختيار المصادقة `openai-codex`.

## التحديث + انتهاء الصلاحية

تخزّن الملفات الشخصية طابعًا زمنيًا في `expires`.

في وقت التشغيل:

- إذا كانت `expires` في المستقبل → استخدم رمز الوصول المخزَّن
- إذا انتهت الصلاحية → حدّث (تحت قفل ملف) واكتب بيانات الاعتماد فوق المخزنة
- الاستثناء: تبقى بيانات الاعتماد المعاد استخدامها من CLI خارجي مُدارة خارجيًا؛ ويقوم OpenClaw
  بإعادة قراءة مخزن مصادقة CLI ولا يستهلك رمز refresh المنسوخ بنفسه أبدًا

يتم تدفق التحديث تلقائيًا؛ وعادةً لا تحتاج إلى إدارة الرموز يدويًا.

## الحسابات المتعددة (الملفات الشخصية) + التوجيه

هناك نمطان:

### 1) المفضّل: وكلاء منفصلون

إذا كنت تريد ألا يتفاعل “الشخصي” و“العمل” مطلقًا، فاستخدم وكلاء معزولين (جلسات + بيانات اعتماد + مساحة عمل منفصلة):

```bash
openclaw agents add work
openclaw agents add personal
```

ثم اضبط المصادقة لكل وكيل (عبر المعالج) ووجّه الدردشات إلى الوكيل الصحيح.

### 2) متقدم: عدة ملفات شخصية في وكيل واحد

يدعم `auth-profiles.json` عدة معرّفات ملفات شخصية للـ provider نفسه.

اختر أي ملف شخصي يتم استخدامه:

- عالميًا عبر ترتيب الإعدادات (`auth.order`)
- لكل جلسة عبر `/model ...@<profileId>`

مثال (تجاوز على مستوى الجلسة):

- `/model Opus@anthropic:work`

كيفية معرفة معرّفات الملفات الشخصية الموجودة:

- `openclaw channels list --json` (يعرض `auth[]`)

الوثائق ذات الصلة:

- [/concepts/model-failover](/ar/concepts/model-failover) (قواعد التدوير + التهدئة)
- [/tools/slash-commands](/ar/tools/slash-commands) (سطح الأوامر)

## ذو صلة

- [المصادقة](/ar/gateway/authentication) — نظرة عامة على مصادقة مزود النموذج
- [الأسرار](/ar/gateway/secrets) — تخزين بيانات الاعتماد وSecretRef
- [مرجع الإعدادات](/ar/gateway/configuration-reference#auth-storage) — مفاتيح إعدادات المصادقة
