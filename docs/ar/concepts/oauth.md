---
read_when:
    - تريد فهم OAuth في OpenClaw من البداية إلى النهاية
    - تواجه مشكلات إبطال الرمز / تسجيل الخروج
    - تريد تدفقات مصادقة Claude CLI أو OAuth
    - تريد حسابات متعددة أو توجيه الملفات الشخصية
summary: 'OAuth في OpenClaw: تبادل الرموز المميزة، والتخزين، وأنماط الحسابات المتعددة'
title: OAuth
x-i18n:
    generated_at: "2026-07-02T22:34:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5cffefec8bb3e755bcd4583a7957510c7ba3b605e21a3fd876f27c8fc9aa65aa
    source_path: concepts/oauth.md
    workflow: 16
---

يدعم OpenClaw "مصادقة الاشتراك" عبر OAuth للمزوّدين الذين يقدّمونها
(خصوصًا **OpenAI Codex (ChatGPT OAuth)**). بالنسبة إلى Anthropic، أصبح التقسيم العملي
الآن:

- **مفتاح Anthropic API**: فوترة Anthropic API العادية
- **Anthropic Claude CLI / مصادقة الاشتراك داخل OpenClaw**: أخبرنا موظفو Anthropic
  أن هذا الاستخدام مسموح به مجددًا

OpenAI Codex OAuth مدعوم صراحةً للاستخدام في أدوات خارجية مثل
OpenClaw.

يخزّن OpenClaw كلًا من مصادقة مفتاح OpenAI API ومصادقة ChatGPT/Codex OAuth تحت
معرّف المزوّد القياسي `openai`. معرّفات الملفات الشخصية الأقدم `openai-codex:*`
ومدخلات `auth.order.openai-codex` هي حالة قديمة يصلحها
`openclaw doctor --fix`؛ استخدم معرّفات الملفات الشخصية `openai:*` و`auth.order.openai`
للإعدادات الجديدة.

بالنسبة إلى Anthropic في الإنتاج، تعد مصادقة مفتاح API المسار الأكثر أمانًا والموصى به.

تشرح هذه الصفحة:

- كيف يعمل **تبادل الرموز** في OAuth ‏(PKCE)
- أين يتم **تخزين** الرموز (ولماذا)
- كيفية التعامل مع **حسابات متعددة** (ملفات شخصية + تجاوزات لكل جلسة)

يدعم OpenClaw أيضًا **Plugin للمزوّدين** تشحن تدفقات OAuth أو مفاتيح API
الخاصة بها. شغّلها عبر:

```bash
openclaw models auth login --provider <id>
```

## مصرف الرموز (لماذا يوجد)

عادةً ما تنشئ مزوّدات OAuth **رمز تحديث جديدًا** أثناء تدفقات تسجيل الدخول/التحديث. يمكن لبعض المزوّدين (أو عملاء OAuth) إبطال رموز التحديث الأقدم عند إصدار رمز جديد للمستخدم/التطبيق نفسه.

العرض العملي:

- تسجّل الدخول عبر OpenClaw _وكذلك_ عبر Claude Code / Codex CLI ← يُسجّل خروج أحدهما عشوائيًا لاحقًا

للحد من ذلك، يتعامل OpenClaw مع `auth-profiles.json` بوصفه **مصرف رموز**:

- يقرأ وقت التشغيل بيانات الاعتماد من **مكان واحد**
- يمكننا الاحتفاظ بعدة ملفات شخصية وتوجيهها بشكل حتمي
- إعادة استخدام CLI خارجي خاصة بالمزوّد: يمكن لـ Codex CLI تمهيد ملف شخصي فارغ
  `openai:default`، لكن بمجرد أن يمتلك OpenClaw ملف OAuth محليًا،
  يصبح رمز التحديث المحلي هو القياسي. إذا رُفض رمز التحديث المحلي هذا،
  يبلّغ OpenClaw عن الملف الشخصي المُدار لإعادة المصادقة بدلًا من استخدام
  مادة رمز Codex CLI كمسار احتياطي شقيق في وقت التشغيل. يمكن للتكاملات الأخرى
  أن تبقى مُدارة خارجيًا وأن تعيد قراءة مخزن مصادقة CLI الخاص بها
- مسارات الحالة وبدء التشغيل التي تعرف مسبقًا نطاق مجموعة المزوّدين المضبوطة
  تحصر اكتشاف CLI الخارجي بتلك المجموعة، بحيث لا يتم فحص مخزن تسجيل دخول CLI
  غير ذي صلة في إعداد ذي مزوّد واحد

## التخزين (أين تعيش الرموز)

تُخزّن الأسرار في مخازن مصادقة الوكيل:

- ملفات المصادقة الشخصية (OAuth + مفاتيح API + مراجع اختيارية على مستوى القيمة): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- ملف التوافق القديم: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (تُمحى مدخلات `api_key` الثابتة عند اكتشافها)

ملف قديم للاستيراد فقط (ما زال مدعومًا، لكنه ليس المخزن الرئيسي):

- `~/.openclaw/credentials/oauth.json` (يُستورد إلى `auth-profiles.json` عند أول استخدام)

كل ما سبق يحترم أيضًا `$OPENCLAW_STATE_DIR` (تجاوز مجلد الحالة). المرجع الكامل: [/gateway/configuration](/ar/gateway/configuration-reference#auth-storage)

بالنسبة إلى مراجع الأسرار الثابتة وسلوك تفعيل لقطة وقت التشغيل، راجع [إدارة الأسرار](/ar/gateway/secrets).

عندما لا يكون لدى وكيل ثانوي ملف مصادقة محلي، يستخدم OpenClaw وراثة قراءة
من مخزن الوكيل الافتراضي/الرئيسي. لا ينسخ ملف `auth-profiles.json` الخاص
بالوكيل الرئيسي عند القراءة. رموز تحديث OAuth حساسة بشكل خاص: تتخطاها
تدفقات النسخ العادية افتراضيًا لأن بعض المزوّدين يدوّرون رموز التحديث أو
يبطلونها بعد الاستخدام. اضبط تسجيل دخول OAuth منفصلًا لوكيل عندما يحتاج
إلى حساب مستقل.

## توافق رمز Anthropic القديم

<Warning>
تقول وثائق Claude Code العامة من Anthropic إن الاستخدام المباشر لـ Claude Code يبقى ضمن
حدود اشتراك Claude، وأخبرنا موظفو Anthropic أن استخدام Claude
CLI بأسلوب OpenClaw مسموح به مجددًا. لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI
واستخدام `claude -p` على أنهما مصرّح بهما لهذا التكامل ما لم تنشر Anthropic
سياسة جديدة.

للاطلاع على وثائق خطط Claude Code المباشرة الحالية من Anthropic، راجع [استخدام Claude Code
مع خطة Pro أو Max الخاصة بك](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
و[استخدام Claude Code مع خطة Team أو Enterprise الخاصة بك](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

إذا كنت تريد خيارات أخرى بأسلوب الاشتراك في OpenClaw، فراجع [OpenAI
Codex](/ar/providers/openai)، و[خطة Qwen Cloud Coding
Plan](/ar/providers/qwen)، و[خطة MiniMax Coding Plan](/ar/providers/minimax)،
و[خطة Z.AI / GLM Coding Plan](/ar/providers/zai).
</Warning>

يعرض OpenClaw أيضًا رمز إعداد Anthropic كمسار مصادقة رمزية مدعوم، لكنه يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.

## ترحيل Anthropic Claude CLI

يدعم OpenClaw إعادة استخدام Anthropic Claude CLI مجددًا. إذا كان لديك بالفعل تسجيل دخول
Claude محلي على المضيف، يمكن لمسار onboarding/configure إعادة استخدامه مباشرةً.

## تبادل OAuth (كيف يعمل تسجيل الدخول)

تُنفّذ تدفقات تسجيل الدخول التفاعلية في OpenClaw ضمن `openclaw/plugin-sdk/llm` وتُوصَل بالمعالجات/الأوامر الإرشادية.

### رمز إعداد Anthropic

شكل التدفق:

1. ابدأ رمز إعداد Anthropic أو الصق الرمز من OpenClaw
2. يخزّن OpenClaw بيانات اعتماد Anthropic الناتجة في ملف مصادقة شخصي
3. يبقى اختيار النموذج على `anthropic/...`
4. تبقى ملفات مصادقة Anthropic الحالية متاحة للتحكم في التراجع/الترتيب

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth مدعوم صراحةً للاستخدام خارج Codex CLI، بما في ذلك تدفقات عمل OpenClaw.

ما زال أمر تسجيل الدخول يستخدم معرّف مزوّد OpenAI القياسي:

```bash
openclaw models auth login --provider openai
```

استخدم `--profile-id openai:<name>` لحسابات ChatGPT/Codex OAuth متعددة في
وكيل واحد. لا تستخدم `openai-codex:<name>` للملفات الشخصية الجديدة. يرحّل Doctor
ذلك البادئ الأقدم إلى معرّف ملف شخصي `openai:*` بلا تصادم؛ شغّل
`openclaw models auth list --provider openai` بعد الإصلاح قبل نسخ
معرّفات الملفات الشخصية إلى `auth.order` أو `/model ...@<profileId>`.

شكل التدفق (PKCE):

1. أنشئ متحقق/تحدي PKCE + `state` عشوائيًا
2. افتح `https://auth.openai.com/oauth/authorize?...`
3. حاول التقاط رد الاتصال على `http://127.0.0.1:1455/auth/callback`
4. إذا تعذّر ربط رد الاتصال (أو كنت تعمل عن بُعد/بلا واجهة)، الصق عنوان URL/الرمز الخاص بإعادة التوجيه
5. أجرِ التبادل عند `https://auth.openai.com/oauth/token`
6. استخرج `accountId` من رمز الوصول وخزّن `{ access, refresh, expires, accountId }`

مسار المعالج الإرشادي هو `openclaw onboard` ← خيار المصادقة `openai`.

## التحديث + انتهاء الصلاحية

تخزّن الملفات الشخصية طابعًا زمنيًا `expires`.

في وقت التشغيل:

- إذا كان `expires` في المستقبل ← استخدم رمز الوصول المخزّن
- إذا انتهت الصلاحية ← حدّث (تحت قفل ملف) واكتب بيانات الاعتماد المخزّنة فوق القديمة
- إذا قرأ وكيل ثانوي ملف OAuth موروثًا من الوكيل الرئيسي، يكتب التحديث
  مرة أخرى إلى مخزن الوكيل الرئيسي بدلًا من نسخ رمز التحديث إلى
  مخزن الوكيل الثانوي
- استثناء: تبقى بعض بيانات اعتماد CLI الخارجية مُدارة خارجيًا؛ يعيد OpenClaw
  قراءة مخازن مصادقة CLI تلك بدلًا من إنفاق رموز تحديث منسوخة.
  تمهيد Codex CLI أضيق عمدًا: يمكنه تهيئة ملف `openai:default` فارغ
  أو ملف OpenAI مطلوب صراحةً فقط قبل أن يملك OpenClaw
  OAuth للمزوّد. بعد ذلك، تبقي تحديثات OpenClaw ملفات
  التعريف المحلية قياسية، ولا يضيف الاكتشاف مصادقة Codex CLI في أي موضع
  شقيق. إذا فشل تحديث مُدار، يبلّغ OpenClaw عن الملف الشخصي المتأثر
  لإعادة المصادقة بدلًا من إرجاع مادة رمز CLI خارجي.

تدفق التحديث تلقائي؛ لا تحتاج عمومًا إلى إدارة الرموز يدويًا.

## حسابات متعددة (ملفات شخصية) + التوجيه

نمطان:

### 1) المفضّل: وكلاء منفصلون

إذا أردت ألّا يتفاعل "الشخصي" و"العمل" أبدًا، فاستخدم وكلاء معزولين (جلسات + بيانات اعتماد + مساحة عمل منفصلة):

```bash
openclaw agents add work
openclaw agents add personal
```

ثم اضبط المصادقة لكل وكيل (المعالج الإرشادي) ووجّه المحادثات إلى الوكيل الصحيح.

### 2) متقدم: ملفات شخصية متعددة في وكيل واحد

يدعم `auth-profiles.json` معرّفات ملفات شخصية متعددة للمزوّد نفسه.

اختر الملف الشخصي المستخدم:

- عالميًا عبر ترتيب الإعدادات (`auth.order`)
- لكل جلسة عبر `/model ...@<profileId>`

مثال (تجاوز جلسة):

- `/model Opus@anthropic:work`

كيفية معرفة معرّفات الملفات الشخصية الموجودة:

- `openclaw channels list --json` (يعرض `auth[]`)

وثائق ذات صلة:

- [تجاوز فشل النموذج](/ar/concepts/model-failover) (قواعد التدوير + فترة التهدئة)
- [أوامر Slash](/ar/tools/slash-commands) (سطح الأوامر)

## ذات صلة

- [المصادقة](/ar/gateway/authentication) - نظرة عامة على مصادقة مزوّد النموذج
- [الأسرار](/ar/gateway/secrets) - تخزين بيانات الاعتماد وSecretRef
- [مرجع الإعدادات](/ar/gateway/configuration-reference#auth-storage) - مفاتيح إعدادات المصادقة
