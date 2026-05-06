---
read_when:
    - تشغيل أو تكوين الإعداد الأولي لـ CLI
    - إعداد جهاز جديد
sidebarTitle: 'Onboarding: CLI'
summary: 'إعداد CLI الأولي: إعداد موجّه لـ Gateway ومساحة العمل والقنوات وSkills'
title: الإعداد الأولي (CLI)
x-i18n:
    generated_at: "2026-05-06T08:14:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4872c150950a811e5cdb8830fe635886f7c3ed0f1d62352b71be56feda64691
    source_path: start/wizard.md
    workflow: 16
---

CLI onboarding هي الطريقة **الموصى بها** لإعداد OpenClaw على macOS أو
Linux أو Windows (عبر WSL2؛ موصى به بشدة).
تُهيئ Gateway محليًا أو اتصالًا بـ Gateway بعيد، إضافة إلى القنوات وSkills
وافتراضات مساحة العمل ضمن مسار إرشادي واحد.

```bash
openclaw onboard
```

<Info>
أسرع محادثة أولى: افتح واجهة التحكم (لا حاجة إلى إعداد قناة). شغّل
`openclaw dashboard` ودردش في المتصفح. الوثائق: [لوحة التحكم](/ar/web/dashboard).
</Info>

لإعادة التهيئة لاحقًا:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` لا يعني الوضع غير التفاعلي. للسكربتات، استخدم `--non-interactive`.
</Note>

<Tip>
يتضمن CLI onboarding خطوة بحث ويب يمكنك فيها اختيار مزود
مثل Brave أو DuckDuckGo أو Exa أو Firecrawl أو Gemini أو Grok أو Kimi أو MiniMax Search
أو Ollama Web Search أو Perplexity أو SearXNG أو Tavily. يتطلب بعض المزودين
مفتاح API، بينما لا يحتاج آخرون إلى مفتاح. يمكنك أيضًا تهيئة ذلك لاحقًا باستخدام
`openclaw configure --section web`. الوثائق: [أدوات الويب](/ar/tools/web).
</Tip>

## البدء السريع مقابل المتقدم

يبدأ onboarding بخيار **البدء السريع** (الافتراضات) مقابل **المتقدم** (تحكم كامل).

<Tabs>
  <Tab title="البدء السريع (الافتراضات)">
    - Gateway محلي (loopback)
    - افتراضي مساحة العمل (أو مساحة عمل موجودة)
    - منفذ Gateway **18789**
    - مصادقة Gateway **Token** (تُولَّد تلقائيًا، حتى على loopback)
    - افتراضي سياسة الأدوات للإعدادات المحلية الجديدة: `tools.profile: "coding"` (يُحتفظ بالملف الشخصي الصريح الموجود)
    - افتراضي عزل الرسائل المباشرة: يكتب onboarding المحلي `session.dmScope: "per-channel-peer"` عند عدم تعيينه. التفاصيل: [مرجع إعداد CLI](/ar/start/wizard-cli-reference#outputs-and-internals)
    - تعريض Tailscale **متوقف**
    - رسائل Telegram + WhatsApp المباشرة تعتمد افتراضيًا على **قائمة سماح** (سيُطلب منك إدخال رقم هاتفك)

  </Tab>
  <Tab title="المتقدم (تحكم كامل)">
    - يعرض كل خطوة (الوضع، مساحة العمل، Gateway، القنوات، daemon، Skills).

  </Tab>
</Tabs>

## ما الذي يهيئه onboarding

يرشدك **الوضع المحلي (الافتراضي)** عبر هذه الخطوات:

1. **النموذج/المصادقة** — اختر أي مزود/مسار مصادقة مدعوم (مفتاح API أو OAuth أو مصادقة يدوية خاصة بالمزود)، بما في ذلك مزود مخصص
   (متوافق مع OpenAI، أو متوافق مع Anthropic، أو اكتشاف تلقائي غير معروف). اختر نموذجًا افتراضيًا.
   ملاحظة أمان: إذا كان هذا الوكيل سيشغّل أدوات أو يعالج محتوى webhook/hooks، ففضّل أقوى نموذج متاح من أحدث جيل وأبقِ سياسة الأدوات صارمة. الشرائح الأضعف/الأقدم أسهل عرضة لحقن المطالبات.
   للتشغيلات غير التفاعلية، يخزن `--secret-input-mode ref` مراجع مدعومة بمتغيرات البيئة في ملفات المصادقة الشخصية بدلًا من قيم مفاتيح API بنص صريح.
   في وضع `ref` غير التفاعلي، يجب تعيين متغير بيئة المزود؛ تمرير أعلام مفاتيح مضمنة دون متغير البيئة ذاك يفشل بسرعة.
   في التشغيلات التفاعلية، يتيح لك اختيار وضع مرجع السر الإشارة إما إلى متغير بيئة أو مرجع مزود مُهيأ (`file` أو `exec`)، مع تحقق تمهيدي سريع قبل الحفظ.
   بالنسبة إلى Anthropic، يوفر onboarding/configure التفاعلي **Anthropic Claude CLI** كالمسار المحلي المفضل و**مفتاح Anthropic API** كمسار الإنتاج الموصى به. يبقى Anthropic setup-token متاحًا أيضًا كمسار مصادقة رمزية مدعوم.
2. **مساحة العمل** — موقع ملفات الوكيل (الافتراضي `~/.openclaw/workspace`). يضيف ملفات التمهيد الأولية.
3. **Gateway** — المنفذ، عنوان الربط، وضع المصادقة، تعريض Tailscale.
   في وضع الرمز التفاعلي، اختر التخزين الافتراضي للرمز بنص صريح أو انتقل إلى SecretRef.
   مسار SecretRef للرمز غير التفاعلي: `--gateway-token-ref-env <ENV_VAR>`.
4. **القنوات** — قنوات الدردشة المدمجة والمرفقة مثل BlueBubbles وDiscord وFeishu وGoogle Chat وMattermost وMicrosoft Teams وQQ Bot وSignal وSlack وTelegram وWhatsApp والمزيد.
5. **Daemon** — يثبّت LaunchAgent (macOS)، أو وحدة مستخدم systemd (Linux/WSL2)، أو مهمة Windows Scheduled Task أصلية مع احتياطي مجلد Startup لكل مستخدم.
   إذا كانت مصادقة الرمز تتطلب رمزًا وكان `gateway.auth.token` مُدارًا عبر SecretRef، يتحقق تثبيت daemon منه لكنه لا يحفظ الرمز المحلول في بيانات وصفية لبيئة خدمة المشرف.
   إذا كانت مصادقة الرمز تتطلب رمزًا وكان SecretRef للرمز المُهيأ غير محلول، يُحظر تثبيت daemon مع إرشادات قابلة للتنفيذ.
   إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مُهيأين وكان `gateway.auth.mode` غير معيّن، يُحظر تثبيت daemon إلى أن يُعيّن الوضع صراحةً.
6. **فحص الصحة** — يبدأ Gateway ويتحقق من أنه يعمل.
7. **Skills** — يثبّت Skills الموصى بها والاعتماديات الاختيارية.

<Note>
إعادة تشغيل onboarding لا تمسح أي شيء إلا إذا اخترت **إعادة تعيين** صراحةً (أو مررت `--reset`).
يعيد `--reset` في CLI افتراضيًا تعيين التهيئة وبيانات الاعتماد والجلسات؛ استخدم `--reset-scope full` لتضمين مساحة العمل.
إذا كانت التهيئة غير صالحة أو تحتوي على مفاتيح قديمة، يطلب منك onboarding تشغيل `openclaw doctor` أولًا.
</Note>

لا يهيئ **الوضع البعيد** إلا العميل المحلي للاتصال بـ Gateway في مكان آخر.
لا يثبّت أو يغيّر أي شيء على المضيف البعيد.

## إضافة وكيل آخر

استخدم `openclaw agents add <name>` لإنشاء وكيل منفصل له مساحة عمل
وجلسات وملفات مصادقة شخصية خاصة به. التشغيل دون `--workspace` يطلق onboarding.

ما يعيّنه:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

ملاحظات:

- تتبع مساحات العمل الافتراضية `~/.openclaw/workspace-<agentId>`.
- أضف `bindings` لتوجيه الرسائل الواردة (يمكن لـ onboarding فعل ذلك).
- أعلام غير تفاعلية: `--model`، `--agent-dir`، `--bind`، `--non-interactive`.

## المرجع الكامل

للاطلاع على تفصيلات خطوة بخطوة ومخرجات التهيئة، راجع
[مرجع إعداد CLI](/ar/start/wizard-cli-reference).
لأمثلة غير تفاعلية، راجع [أتمتة CLI](/ar/start/wizard-cli-automation).
للمرجع التقني الأعمق، بما في ذلك تفاصيل RPC، راجع
[مرجع onboarding](/ar/reference/wizard).

## وثائق ذات صلة

- مرجع أوامر CLI: [`openclaw onboard`](/ar/cli/onboard)
- نظرة عامة على onboarding: [نظرة عامة على onboarding](/ar/start/onboarding-overview)
- onboarding لتطبيق macOS: [onboarding](/ar/start/onboarding)
- طقس التشغيل الأول للوكيل: [تمهيد الوكيل](/ar/start/bootstrapping)
