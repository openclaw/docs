---
read_when:
    - تشغيل أو تهيئة onboarding في CLI
    - إعداد جهاز جديد
sidebarTitle: 'Onboarding: CLI'
summary: 'Onboarding في CLI: إعداد موجّه لـ gateway، ومساحة العمل، والقنوات، وSkills'
title: Onboarding ‏(CLI)
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T08:06:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 919a4ab57f42f663e98e77c967e08e7ad7afbb193bd048ca1dedc884002d3801
    source_path: start/wizard.md
    workflow: 15
---

يُعد onboarding في CLI **الطريقة الموصى بها** لإعداد OpenClaw على macOS،
وLinux، وWindows ‏(عبر WSL2؛ وهو موصى به بشدة).
فهو يهيّئ Gateway محلية أو اتصالًا بـ Gateway بعيدة، بالإضافة إلى القنوات، وSkills،
وافتراضيات مساحة العمل في تدفق موجه واحد.

```bash
openclaw onboard
```

<Info>
أسرع أول دردشة: افتح Control UI ‏(لا حاجة إلى إعداد قناة). شغّل
`openclaw dashboard` وابدأ الدردشة في المتصفح. الوثائق: [Dashboard](/ar/web/dashboard).
</Info>

لإعادة التهيئة لاحقًا:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
لا يعني `--json` الوضع غير التفاعلي ضمنيًا. وبالنسبة إلى السكربتات، استخدم `--non-interactive`.
</Note>

<Tip>
يتضمن onboarding في CLI خطوة للبحث على الويب يمكنك فيها اختيار provider
مثل Brave، وDuckDuckGo، وExa، وFirecrawl، وGemini، وGrok، وKimi، وMiniMax Search،
وOllama Web Search، وPerplexity، وSearXNG، أو Tavily. تتطلب بعض providers
مفتاح API، بينما لا تحتاج أخرى إلى مفتاح. ويمكنك أيضًا إعداد ذلك لاحقًا باستخدام
`openclaw configure --section web`. الوثائق: [أدوات الويب](/ar/tools/web).
</Tip>

## QuickStart مقابل Advanced

يبدأ onboarding بخيار **QuickStart** ‏(افتراضيات) مقابل **Advanced** ‏(تحكم كامل).

<Tabs>
  <Tab title="QuickStart ‏(الافتراضيات)">
    - Gateway محلية ‏(loopback)
    - مساحة العمل الافتراضية (أو مساحة عمل موجودة)
    - منفذ Gateway **18789**
    - مصادقة Gateway **Token** ‏(يُنشأ تلقائيًا، حتى على loopback)
    - سياسة الأدوات الافتراضية للإعدادات المحلية الجديدة: `tools.profile: "coding"` ‏(ويُحافَظ على أي ملف شخصي صريح موجود)
    - افتراضي عزل الرسائل المباشرة: يكتب onboarding المحلي `session.dmScope: "per-channel-peer"` عندما لا يكون مضبوطًا. التفاصيل: [مرجع إعداد CLI](/ar/start/wizard-cli-reference#outputs-and-internals)
    - تعريض Tailscale **معطل**
    - تستخدم الرسائل المباشرة في Telegram + WhatsApp افتراضيًا **allowlist** ‏(وسيُطلب منك رقم هاتفك)
  </Tab>
  <Tab title="Advanced ‏(تحكم كامل)">
    - يكشف كل خطوة (الوضع، ومساحة العمل، وgateway، والقنوات، وdaemon، وSkills).
  </Tab>
</Tabs>

## ما الذي يهيئه onboarding

**الوضع المحلي (الافتراضي)** يوجّهك عبر هذه الخطوات:

1. **النموذج/المصادقة** — اختر أي تدفق provider/auth مدعوم (مفتاح API، أو OAuth، أو مصادقة يدوية خاصة بالـ provider)، بما في ذلك Custom Provider
   ‏(متوافق مع OpenAI، أو متوافق مع Anthropic، أو Unknown مع اكتشاف تلقائي). اختر نموذجًا افتراضيًا.
   ملاحظة أمنية: إذا كان هذا الوكيل سيشغّل أدوات أو يعالج محتوى webhook/hooks، ففضّل أقوى نموذج متاح من أحدث جيل وحافظ على سياسة أدوات صارمة. فالطبقات الأضعف/الأقدم أسهل في التعرض لحقن prompt.
   وبالنسبة إلى التشغيلات غير التفاعلية، يخزن `--secret-input-mode ref` مراجع مدعومة بالبيئة داخل ملفات تعريف المصادقة بدلًا من قيم مفاتيح API النصية الصريحة.
   وفي وضع `ref` غير التفاعلي، يجب أن يكون متغير البيئة الخاص بالـ provider مضبوطًا؛ وتمرير علامات مفاتيح مضمنة من دون ذلك المتغير يؤدي إلى فشل سريع.
   وفي التشغيلات التفاعلية، يتيح لك اختيار وضع SecretRef الإشارة إلى متغير بيئة أو مرجع provider مضبوط (`file` أو `exec`)، مع تحقق تمهيدي سريع قبل الحفظ.
   بالنسبة إلى Anthropic، يقدّم onboarding/configure التفاعلي **Anthropic Claude CLI** كمسار محلي مفضّل و**مفتاح Anthropic API** كمسار موصى به للإنتاج. كما يظل Anthropic setup-token متاحًا أيضًا كمسار مصادقة قائم على الرمز ومدعوم.
2. **مساحة العمل** — موقع ملفات الوكيل (الافتراضي `~/.openclaw/workspace`). ويزرع ملفات bootstrap.
3. **Gateway** — المنفذ، وعنوان الربط، ووضع المصادقة، وتعريض Tailscale.
   في وضع token التفاعلي، اختر التخزين النصي الصريح الافتراضي للرمز أو اشترك في SecretRef.
   مسار SecretRef غير التفاعلي للرمز: `--gateway-token-ref-env <ENV_VAR>`.
4. **القنوات** — قنوات الدردشة المضمنة والمجمعة مثل BlueBubbles، وDiscord، وFeishu، وGoogle Chat، وMattermost، وMicrosoft Teams، وQQ Bot، وSignal، وSlack، وTelegram، وWhatsApp، وغير ذلك.
5. **Daemon** — يثبت LaunchAgent ‏(macOS)، أو وحدة systemd للمستخدم ‏(Linux/WSL2)، أو مهمة Windows Scheduled Task أصلية مع رجوع احتياطي إلى مجلد Startup لكل مستخدم.
   إذا كانت مصادقة token تتطلب رمزًا وكان `gateway.auth.token` مُدارًا عبر SecretRef، فإن تثبيت daemon يتحقق منه لكنه لا يحفظ الرمز المحلول في بيانات البيئة الخاصة بخدمة supervisor.
   وإذا كانت مصادقة token تتطلب رمزًا وكان SecretRef الخاص بالرمز المضبوط غير محلول، فيتم حظر تثبيت daemon مع إرشادات قابلة للتنفيذ.
   وإذا كان كل من `gateway.auth.token` و`gateway.auth.password` مضبوطين وكانت `gateway.auth.mode` غير مضبوطة، فيُحظر تثبيت daemon حتى يتم ضبط الوضع صراحةً.
6. **فحص الصحة** — يبدأ Gateway ويتحقق من أنها تعمل.
7. **Skills** — يثبّت Skills الموصى بها والتبعيات الاختيارية.

<Note>
إعادة تشغيل onboarding **لا** تمسح أي شيء ما لم تختر صراحةً **Reset** ‏(أو تمرر `--reset`).
ويستخدم `--reset` في CLI افتراضيًا الإعدادات، وبيانات الاعتماد، والجلسات؛ استخدم `--reset-scope full` لتضمين مساحة العمل.
إذا كانت الإعدادات غير صالحة أو تحتوي على مفاتيح قديمة، فسيطلب منك onboarding تشغيل `openclaw doctor` أولًا.
</Note>

**الوضع البعيد** يهيّئ فقط العميل المحلي للاتصال بـ Gateway موجودة في مكان آخر.
وهو **لا** يثبت أو يغيّر أي شيء على المضيف البعيد.

## إضافة وكيل آخر

استخدم `openclaw agents add <name>` لإنشاء وكيل منفصل له مساحة عمله،
وجلساته، وملفات تعريف المصادقة الخاصة به. ويؤدي التشغيل من دون `--workspace` إلى إطلاق onboarding.

ما الذي يضبطه:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

ملاحظات:

- تتبع مساحات العمل الافتراضية النمط `~/.openclaw/workspace-<agentId>`.
- أضف `bindings` لتوجيه الرسائل الواردة (يمكن لـ onboarding القيام بذلك).
- العلامات غير التفاعلية: `--model` و`--agent-dir` و`--bind` و`--non-interactive`.

## المرجع الكامل

للحصول على تفصيلات خطوة بخطوة ومخرجات الإعدادات، راجع
[مرجع إعداد CLI](/ar/start/wizard-cli-reference).
وللحصول على أمثلة غير تفاعلية، راجع [أتمتة CLI](/ar/start/wizard-cli-automation).
أما المرجع التقني الأعمق، بما في ذلك تفاصيل RPC، فراجع
[مرجع onboarding](/ar/reference/wizard).

## وثائق ذات صلة

- مرجع أوامر CLI: ‏[`openclaw onboard`](/ar/cli/onboard)
- نظرة عامة على onboarding: ‏[نظرة عامة على onboarding](/ar/start/onboarding-overview)
- onboarding لتطبيق macOS: ‏[Onboarding](/ar/start/onboarding)
- الطقس الأول للوكيل: ‏[Bootstrapping الوكيل](/ar/start/bootstrapping)
