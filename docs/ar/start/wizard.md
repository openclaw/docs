---
read_when:
    - تشغيل الإعداد الأولي لـ CLI أو تكوينه
    - إعداد جهاز جديد
sidebarTitle: 'Onboarding: CLI'
summary: 'التهيئة الأولية عبر CLI: إعداد موجّه لـ Gateway ومساحة العمل والقنوات وSkills'
title: الإعداد الأولي (CLI)
x-i18n:
    generated_at: "2026-05-10T20:02:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6d8093f2375240f7a784b22c97c824a49b4d39b9217c0d1c0a1490bb15160700
    source_path: start/wizard.md
    workflow: 16
---

CLI onboarding هي الطريقة **الموصى بها** لإعداد OpenClaw على macOS أو
Linux أو Windows (عبر WSL2؛ موصى به بشدة).
تُعدّ Gateway محليًا أو اتصال Gateway عن بُعد، إلى جانب القنوات وSkills
وافتراضات مساحة العمل ضمن تدفق إرشادي واحد.

```bash
openclaw onboard
```

<Info>
أسرع محادثة أولى: افتح واجهة التحكم (لا يلزم إعداد قناة). شغّل
`openclaw dashboard` ودردش في المتصفح. المستندات: [لوحة التحكم](/ar/web/dashboard).
</Info>

لإعادة التهيئة لاحقًا:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
لا يعني `--json` الوضع غير التفاعلي. للبرامج النصية، استخدم `--non-interactive`.
</Note>

<Tip>
يتضمن CLI onboarding خطوة بحث ويب يمكنك فيها اختيار مزود
مثل Brave أو DuckDuckGo أو Exa أو Firecrawl أو Gemini أو Grok أو Kimi أو MiniMax Search
أو Ollama Web Search أو Perplexity أو SearXNG أو Tavily. يتطلب بعض المزودين
مفتاح API، بينما لا يحتاج آخرون إلى مفتاح. يمكنك أيضًا تهيئة ذلك لاحقًا باستخدام
`openclaw configure --section web`. المستندات: [أدوات الويب](/ar/tools/web).
</Tip>

## البدء السريع مقابل المتقدم

يبدأ onboarding بخيار **البدء السريع** (الافتراضات) مقابل **المتقدم** (تحكم كامل).

<Tabs>
  <Tab title="QuickStart (defaults)">
    - Gateway محلي (loopback)
    - افتراضي مساحة العمل (أو مساحة عمل موجودة)
    - منفذ Gateway ‏**18789**
    - مصادقة Gateway ‏**رمز مميز** (يُنشأ تلقائيًا، حتى على loopback)
    - افتراضي سياسة الأدوات للإعدادات المحلية الجديدة: `tools.profile: "coding"` (يُحافظ على الملف التعريفي الصريح الموجود)
    - افتراضي عزل الرسائل الخاصة: يكتب onboarding المحلي `session.dmScope: "per-channel-peer"` عند عدم ضبطه. التفاصيل: [مرجع إعداد CLI](/ar/start/wizard-cli-reference#outputs-and-internals)
    - تعريض Tailscale ‏**متوقف**
    - رسائل Telegram + WhatsApp الخاصة تستخدم **قائمة السماح** افتراضيًا (سيُطلب منك رقم هاتفك)

  </Tab>
  <Tab title="Advanced (full control)">
    - يعرض كل خطوة (الوضع، مساحة العمل، Gateway، القنوات، الخادم الخفي، Skills).

  </Tab>
</Tabs>

## ما الذي يهيئه onboarding

يرشدك **الوضع المحلي (الافتراضي)** عبر هذه الخطوات:

1. **النموذج/المصادقة** — اختر أي مزود أو تدفق مصادقة مدعوم (مفتاح API أو OAuth أو مصادقة يدوية خاصة بالمزود)، بما في ذلك المزود المخصص
   (متوافق مع OpenAI، أو متوافق مع Anthropic، أو اكتشاف تلقائي غير معروف). اختر نموذجًا افتراضيًا.
   ملاحظة أمنية: إذا كان هذا الوكيل سيشغّل أدوات أو يعالج محتوى webhook/hooks، ففضّل أقوى نموذج من أحدث جيل متاح واجعل سياسة الأدوات صارمة. المستويات الأضعف/الأقدم أسهل للاختراق عبر حقن المطالبات.
   في عمليات التشغيل غير التفاعلية، يخزن `--secret-input-mode ref` مراجع مدعومة بمتغيرات البيئة في ملفات تعريف المصادقة بدلًا من قيم مفاتيح API بنص عادي.
   في وضع `ref` غير التفاعلي، يجب ضبط متغير بيئة المزود؛ ويفشل تمرير أعلام المفاتيح المضمنة دون متغير البيئة هذا بسرعة.
   في عمليات التشغيل التفاعلية، يتيح لك اختيار وضع مرجع السر الإشارة إلى متغير بيئة أو مرجع مزود مهيأ (`file` أو `exec`)، مع تحقق تمهيدي سريع قبل الحفظ.
   بالنسبة إلى Anthropic، يوفر onboarding/configure التفاعلي **Anthropic Claude CLI** بوصفه المسار المحلي المفضل و**مفتاح Anthropic API** بوصفه مسار الإنتاج الموصى به. يظل Anthropic setup-token متاحًا أيضًا كمسار مصادقة رمزية مدعوم.
2. **مساحة العمل** — موقع ملفات الوكيل (الافتراضي `~/.openclaw/workspace`). يزرع ملفات التمهيد.
3. **Gateway** — المنفذ، عنوان الربط، وضع المصادقة، تعريض Tailscale.
   في وضع الرمز المميز التفاعلي، اختر تخزين الرمز المميز الافتراضي كنص عادي أو اشترك في SecretRef.
   مسار SecretRef للرمز المميز غير التفاعلي: `--gateway-token-ref-env <ENV_VAR>`.
4. **القنوات** — قنوات الدردشة المضمنة والمجمعة مثل iMessage وDiscord وFeishu وGoogle Chat وMattermost وMicrosoft Teams وQQ Bot وSignal وSlack وTelegram وWhatsApp والمزيد.
5. **الخادم الخفي** — يثبّت LaunchAgent (macOS)، أو وحدة مستخدم systemd (Linux/WSL2)، أو مهمة Windows Scheduled Task أصلية مع بديل مجلد Startup لكل مستخدم.
   إذا كانت مصادقة الرمز المميز تتطلب رمزًا وكان `gateway.auth.token` مُدارًا بواسطة SecretRef، يتحقق تثبيت الخادم الخفي منه لكنه لا يحتفظ بالرمز المميز المحلول في بيانات تعريف بيئة خدمة المشرف.
   إذا كانت مصادقة الرمز المميز تتطلب رمزًا وكان SecretRef للرمز المميز المهيأ غير محلول، يُحظر تثبيت الخادم الخفي مع إرشادات قابلة للتنفيذ.
   إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مهيأين وكان `gateway.auth.mode` غير مضبوط، يُحظر تثبيت الخادم الخفي حتى يُضبط الوضع صراحة.
6. **فحص الصحة** — يبدأ Gateway ويتحقق من أنه يعمل.
7. **Skills** — يثبّت Skills الموصى بها والاعتماديات الاختيارية.

<Note>
لا تؤدي إعادة تشغيل onboarding إلى مسح أي شيء ما لم تختر **إعادة الضبط** صراحة (أو تمرر `--reset`).
يضبط `--reset` في CLI افتراضيًا التهيئة وبيانات الاعتماد والجلسات؛ استخدم `--reset-scope full` لتضمين مساحة العمل.
إذا كانت التهيئة غير صالحة أو تحتوي على مفاتيح قديمة، يطلب منك onboarding تشغيل `openclaw doctor` أولًا.
</Note>

لا يهيئ **الوضع البعيد** إلا العميل المحلي للاتصال بـ Gateway في مكان آخر.
ولا يثبّت أو يغير أي شيء على المضيف البعيد.

## إضافة وكيل آخر

استخدم `openclaw agents add <name>` لإنشاء وكيل منفصل له مساحة العمل
والجلسات وملفات تعريف المصادقة الخاصة به. يؤدي التشغيل دون `--workspace` إلى بدء onboarding.

ما يضبطه:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

ملاحظات:

- تتبع مساحات العمل الافتراضية `~/.openclaw/workspace-<agentId>`.
- أضف `bindings` لتوجيه الرسائل الواردة (يمكن أن يفعل onboarding ذلك).
- أعلام غير تفاعلية: `--model`، و`--agent-dir`، و`--bind`، و`--non-interactive`.

## المرجع الكامل

للاطلاع على تفصيل خطوة بخطوة ومخرجات التهيئة، راجع
[مرجع إعداد CLI](/ar/start/wizard-cli-reference).
لأمثلة غير تفاعلية، راجع [أتمتة CLI](/ar/start/wizard-cli-automation).
للمرجع التقني الأعمق، بما في ذلك تفاصيل RPC، راجع
[مرجع onboarding](/ar/reference/wizard).

## المستندات ذات الصلة

- مرجع أوامر CLI: [`openclaw onboard`](/ar/cli/onboard)
- نظرة عامة على onboarding: [نظرة عامة على onboarding](/ar/start/onboarding-overview)
- onboarding لتطبيق macOS: [onboarding](/ar/start/onboarding)
- طقس التشغيل الأول للوكيل: [تمهيد الوكيل](/ar/start/bootstrapping)
