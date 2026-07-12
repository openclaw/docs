---
read_when:
    - تريد إعداد الاستدلال، ثم إكمال الإعداد باستخدام Crestodian
summary: مرجع CLI للأمر `openclaw onboard` (الإعداد الأولي التفاعلي)
title: الإعداد الأولي
x-i18n:
    generated_at: "2026-07-12T05:42:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e9dad7efda492e0d9ef01ef08a1fd8c81272a0d9b3aa3b945917b6878159a06
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

إعداد موجّه يبدأ بتهيئة الاستدلال أولًا: يكتشف إمكانية الوصول الحالية إلى الذكاء الاصطناعي،
ويتطلب إكمالًا فعليًا، ولا يحفظ إلا المسار العامل، ثم يشغّل
Crestodian لتهيئة الباقي. تمثّل `openclaw setup` نقطة الدخول نفسها؛
أما `openclaw setup --baseline` فلا يكتب إلا التهيئة الأساسية ومساحة العمل.

<CardGroup cols={2}>
  <Card title="مركز الإعداد الأولي عبر CLI" href="/ar/start/wizard" icon="rocket">
    شرح تفصيلي لتدفق CLI التفاعلي.
  </Card>
  <Card title="نظرة عامة على الإعداد الأولي" href="/ar/start/onboarding-overview" icon="map">
    كيفية تكامل الإعداد الأولي في OpenClaw.
  </Card>
  <Card title="مرجع إعداد CLI" href="/ar/start/wizard-cli-reference" icon="book">
    المخرجات والتفاصيل الداخلية والسلوك في كل خطوة.
  </Card>
  <Card title="أتمتة CLI" href="/ar/start/wizard-cli-automation" icon="terminal">
    خيارات الإعداد غير التفاعلي والإعدادات البرمجية.
  </Card>
  <Card title="الإعداد الأولي لتطبيق macOS" href="/ar/start/onboarding" icon="apple">
    تدفق الإعداد الأولي لتطبيق شريط القوائم في macOS.
  </Card>
</CardGroup>

## أمثلة

```bash
openclaw onboard
openclaw onboard --classic
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

- `--classic`: يفتح المعالج الكامل خطوة بخطوة. لا يمكن دمجه مع
  `--non-interactive`؛ احذف `--classic` للإعداد المؤتمت.
- `--flow quickstart`: يفتح المعالج التقليدي بأقل عدد من المطالبات،
  وينشئ رمز Gateway تلقائيًا.
- `--flow manual` (الاسم البديل `advanced`): يفتح المعالج التقليدي بمطالبات كاملة
  للمنفذ والربط والمصادقة.
- `--flow import`: يشغّل موفّر ترحيل مكتشفًا (مثل Hermes عبر `--import-from hermes`)، ويعرض الخطة مسبقًا، ثم يطبّقها بعد التأكيد. لا يعمل الاستيراد إلا على إعداد OpenClaw جديد؛ أعد ضبط التهيئة وبيانات الاعتماد والجلسات وحالة مساحة العمل أولًا إن وُجد أي منها. استخدم [`openclaw migrate`](/ar/cli/migrate) لخطط التشغيل التجريبي ووضع الاستبدال والتقارير والتعيينات الدقيقة.
- `--modern` اسم بديل للتوافق مع مساعد الإعداد الحواري Crestodian.
  يستخدم بوابة الاستدلال الفعلي نفسها التي يستخدمها `openclaw crestodian`،
  ولا يقبل إلا `--workspace` و`--accept-risk`
  و`--non-interactive` و`--json`. تُرفض خيارات الإعداد الأخرى بدلًا من
  تجاهلها بصمت.

## التدفق الموجّه

يبدأ `openclaw onboard` دون خيارات التدفق الموجّه. يعرض إشعار الأمان،
ويكتشف إمكانية الوصول إلى الذكاء الاصطناعي المتاحة مسبقًا عبر النماذج المهيأة ومتغيرات بيئة
مفاتيح API وأدوات CLI المحلية المدعومة، ثم يختبر
المرشح الموصى به بإكمال حقيقي. إذا فشل ذلك المرشح، يعرض الإعداد الأولي
السبب ويجرّب تلقائيًا المرشح التالي القابل للاستخدام.

إذا استُنفدت خيارات الاكتشاف التلقائي، فاختر مرشحًا آخر مكتشفًا أو أدخل
مفتاح API لموفّر ضمن مطالبة مخفية. يُختبر المفتاح اليدوي عبر مسار
الإكمال الفعلي نفسه. لا يتيح الإعداد الأولي الموجّه
Crestodian أو خيار الخروج بتخطي الذكاء الاصطناعي قبل نجاح أحد المرشحين. لا يحفظ OpenClaw
إلا مسار النموذج المتحقق منه وبيانات اعتماده بعد نجاح
الاختبار؛ ولا يستبدل المرشح الفاشل النموذج المهيأ أو يحفظ
بيانات الاعتماد التي جرت تجربتها. تظل تهيئة مساحة العمل وGateway دون تغيير حتى
بدء Crestodian.

في الوضع الموجّه، يزوّد `--workspace <dir>` مساحة العمل المقترحة لـCrestodian
وسياق الاستدلال المعزول. ولا تُحفظ حتى توافق على
مقترح إعداد Crestodian. يحفظ الإعداد الأولي التقليدي وغير التفاعلي
مساحة العمل عبر تدفق الإعداد المعتاد لكل منهما.

بعد نجاح الاستدلال، يبدأ الإعداد الأولي الموجّه Crestodian فورًا باستخدام
النموذج المتحقق منه. ويمكن لـCrestodian بعد ذلك تهيئة مساحة العمل وGateway
والقنوات والوكلاء والمكونات الإضافية والميزات الاختيارية الأخرى. داخل Crestodian، استخدم
`open channel wizard for <channel>` لإسناد جمع بيانات اعتماد القناة إلى
معالج طرفية يخفي الإدخال. لتغيير موفّر النموذج أو مصادقته،
اخرج من Crestodian وشغّل `openclaw onboard`؛ لا يفتح Crestodian تدفقات
الموفّر الموجّهة أو التقليدية.

عند وجود تثبيت مهيأ، يؤدي تشغيل `openclaw onboard` مجددًا إلى التحقق من
النموذج الافتراضي الحالي أولًا، وبذلك يعمل التدفق نفسه كمرحلة تحقق وإصلاح.
إذا فشل هذا الفحص، فلن يُستبدل النموذج المهيأ تلقائيًا مطلقًا —
يتوقف الإعداد الأولي ويسأل عن كيفية المتابعة. يُجرى الفحص خارج
مساحة عملك، ولذلك قد يفشل هنا نموذج يوفّره Plugin في مساحة العمل مع استمراره
في العمل داخل الوكيل.
استخدم `openclaw onboard --classic` للمصادقة الخاصة بالموفّر والقنوات وSkills
وإعداد Gateway البعيد وعمليات الاستيراد أو عناصر التحكم الكاملة في Gateway. للإعداد
والإصلاح الحواريين غير المرتبطين بالاستدلال، شغّل `openclaw crestodian`؛ ويمثّل `openclaw onboard
--modern` اسمًا بديلًا للتوافق عبر بوابة الاستدلال نفسها. يمكن للمعالج
التقليدي اختياريًا التحقق من النموذج الافتراضي بإكمال فعلي، لكن
لن يبدأ Crestodian حتى ينجح فحص الاستدلال الفعلي الخاص به.

في طرفية تفاعلية، يوجّه `openclaw` وحده (من دون أمر فرعي) وفق حالة
التهيئة:

- إذا كان ملف التهيئة النشط مفقودًا أو لا يحتوي إعدادات أنشأها المستخدم (فارغًا أو
  مقتصرًا على البيانات الوصفية)، يبدأ الإعداد الأولي الموجّه.
- إذا كان ملف التهيئة موجودًا لكنه يفشل في التحقق، يبدأ مسار
  الإعداد الأولي التقليدي مع إرشادات `openclaw doctor`. يحتاج Crestodian إلى
  استدلال عامل، ولا يُستخدم لإصلاح هذه الحالة السابقة للاستدلال.
- إذا كان ملف التهيئة صالحًا، يفتح TUI المعتاد للوكيل. ينتقل Gateway
  المهيأ والقابل للوصول، مع وكيل ونموذج، مباشرةً إلى تلك الواجهة دون
  إعداد أولي أو Crestodian. في تثبيت مهيأ، يمكنك الوصول إلى Crestodian عبر
  `/crestodian` داخل TUI أو باستخدام `openclaw crestodian`.

تُقبل عناوين URL النصية `ws://` الخاصة بـGateway للاتصال المحلي، وعناوين IP الخاصة الصريحة، و`.local`، وعناوين Tailnet من النمط `*.ts.net`. لأسماء DNS الخاصة الموثوقة الأخرى، عيّن `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` في بيئة عملية الإعداد الأولي.

## إعادة الضبط

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

يمسح `--reset` الحالة قبل تشغيل الإعداد. يتحكم `--reset-scope` في مقدار المسح: `config` (التهيئة فقط)، أو `config+creds+sessions` (الافتراضي عند تمرير `--reset` دون نطاق)، أو `full` (يعيد أيضًا ضبط مساحة العمل). لا تحدث إعادة ضبط مساحة العمل إلا مع `--reset-scope full`.

## الإعدادات المحلية

يستخدم الإعداد الأولي التفاعلي الإعدادات المحلية لمعالج CLI في نصوص الإعداد الثابتة. ترتيب الحل:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. الرجوع إلى الإنجليزية

الإعدادات المحلية المدعومة للمعالج هي `en` و`zh-CN` و`zh-TW`. قد تستخدم قيم الإعدادات المحلية شرطة سفلية أو صيغ لاحقة من POSIX مثل `zh_CN.UTF-8`. تظل أسماء المنتجات وأسماء الأوامر ومفاتيح التهيئة وعناوين URL ومعرّفات الموفّرين ومعرّفات النماذج وتسميات المكونات الإضافية والقنوات كما هي حرفيًا.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

## الإعداد غير التفاعلي

يتطلب `--non-interactive` الخيار `--accept-risk` (إقرارًا بأن الوكلاء أقوياء وأن الوصول الكامل إلى النظام ينطوي على مخاطر). القيمة الافتراضية لـ`--mode` هي `local`.

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

الخيار `--custom-api-key` اختياري؛ وإذا حُذف، يتحقق الإعداد الأولي من `CUSTOM_API_KEY` في البيئة. يحدّد OpenClaw تلقائيًا معرّفات نماذج الرؤية الشائعة (GPT-4o/4.1/5.x وClaude 3/4 وGemini وQwen-VL وLLaVA وPixtral وما شابهها) باعتبارها قادرة على معالجة الصور. مرّر `--custom-image-input` لمعرّفات الرؤية المخصصة غير المعروفة، أو `--custom-text-input` لفرض بيانات وصفية نصية فقط. استخدم `--custom-compatibility openai-responses` لنقاط النهاية المتوافقة مع OpenAI التي تدعم `/v1/responses` دون `/v1/chat/completions`؛ القيم الصالحة هي `openai` (الافتراضية) و`openai-responses` و`anthropic`.

يتضمن LM Studio أيضًا خيار مفتاح خاصًا بالموفّر:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Ollama غير التفاعلي:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

القيمة الافتراضية لـ`--custom-base-url` هي `http://127.0.0.1:11434`. الخيار `--custom-model-id` اختياري؛ وإذا حُذف، يستخدم الإعداد الأولي القيم الافتراضية المقترحة من Ollama. تعمل هنا أيضًا معرّفات النماذج السحابية مثل `kimi-k2.5:cloud`.

خزّن مفاتيح الموفّر كمراجع بدلًا من نص صريح:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

مع `--secret-input-mode ref`، يكتب الإعداد الأولي مراجع مدعومة بالبيئة بدلًا من قيم المفاتيح النصية الصريحة: بالنسبة إلى الموفّرين المدعومين بملفات تعريف المصادقة، يكتب هذا `keyRef: { source: "env", provider: "default", id: <envVar> }`؛ وبالنسبة إلى الموفّرين المخصصين، يكتب `models.providers.<id>.apiKey` بالطريقة نفسها (مثل `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`). العقد: عيّن متغير بيئة الموفّر في بيئة عملية الإعداد الأولي (مثل `OPENAI_API_KEY`)، ولا تمرّر أيضًا خيار مفتاح مضمّنًا إلا إذا كان متغير البيئة ذلك معيّنًا؛ تفشل قيمة الخيار التي لا يقابلها متغير البيئة بسرعة مع عرض إرشادات.

### مصادقة Gateway (غير تفاعلية)

- يخزّن `--gateway-auth token --gateway-token <token>` رمزًا نصيًا صريحًا. الوضع الافتراضي للمصادقة هو `token`.
- يخزّن `--gateway-auth token --gateway-token-ref-env <name>` قيمة `gateway.auth.token` باعتبارها SecretRef لبيئة التشغيل. يتطلب متغير بيئة غير فارغ بهذا الاسم في بيئة عملية الإعداد الأولي.
- الخياران `--gateway-token` و`--gateway-token-ref-env` متنافيان.
- مع `--install-daemon`: يجري التحقق من `gateway.auth.token` المُدار بواسطة SecretRef، لكنه لا يُحفظ كنص صريح محلول في البيانات الوصفية لبيئة خدمة المشرف؛ وإذا تعذّر حل المرجع، يفشل التثبيت بإغلاق آمن مع إرشادات للمعالجة. إذا كانت كل من `gateway.auth.token` و`gateway.auth.password` مهيأتين ولم تكن `gateway.auth.mode` معيّنة، يُحظر التثبيت حتى يُعيّن الوضع صراحةً.
- يكتب الإعداد الأولي المحلي `gateway.mode="local"` في التهيئة. يشير غياب `gateway.mode` من ملف تهيئة لاحق إلى تلف التهيئة أو تعديل يدوي غير مكتمل، وليس اختصارًا صالحًا للوضع المحلي.
- يثبّت الإعداد الأولي المحلي المكونات الإضافية القابلة للتنزيل التي يتطلبها مسار الإعداد المختار (مثل Plugin لوقت تشغيل Codex أو Copilot لخيارات المصادقة تلك). لا يكتب الإعداد الأولي البعيد إلا معلومات الاتصال بـGateway البعيد، ولا يثبّت حزم المكونات الإضافية محليًا مطلقًا.
- يمثّل `--allow-unconfigured` مخرجًا منفصلًا للأمر `openclaw gateway run`؛ ولا يسمح للإعداد الأولي بتخطي `gateway.mode`.

```bash
export OPENAI_API_KEY="your-provider-key"
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

### سلامة Gateway المحلي

- ما لم تمرّر `--skip-health`، ينتظر الإعداد الأولي توفر Gateway محلي قابل للوصول قبل الخروج بنجاح.
- يبدأ `--install-daemon` مسار تثبيت Gateway المُدار أولًا. ومن دونه، يجب أن يكون Gateway محلي قيد التشغيل بالفعل (مثلًا عبر `openclaw gateway run`).
- يتخطى `--skip-health` الانتظار إذا كنت لا تريد في الأتمتة سوى كتابة التهيئة ومساحة العمل وملفات التمهيد.
- يعيّن `--skip-bootstrap` القيمة `agents.defaults.skipBootstrap: true` ويتخطى إنشاء `AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md`.
- في Windows الأصلي، يجرّب `--install-daemon` المهام المجدولة أولًا، ثم يرجع إلى عنصر تسجيل دخول لكل مستخدم في مجلد بدء التشغيل إذا رُفض إنشاء المهمة.

### وضع المراجع التفاعلي

- اختر **استخدام مرجع سرّي** عند مطالبتك، ثم اختر إما **متغير بيئة** أو موفّر أسرار مهيأ (`file` أو `exec`).
- يشغّل الإعداد الأولي تحققًا تمهيديًا سريعًا قبل حفظ المرجع، ويتيح لك إعادة المحاولة عند الفشل.

### خيارات نقطة نهاية Z.AI

<Note>
يكتشف الخيار `--auth-choice zai-api-key` تلقائيًا أفضل نقطة نهاية ونموذج من Z.AI لمفتاحك: تفضّل نقاط نهاية Coding Plan النموذج `zai/glm-5.2` (مع الرجوع إلى `glm-5.1` إذا لم يكن متاحًا)؛ وتستخدم نقاط نهاية API العامة النموذج `zai/glm-5.1` افتراضيًا. لفرض استخدام نقطة نهاية Coding Plan، اختر `zai-coding-global` أو `zai-coding-cn` مباشرةً.
</Note>

```bash
# اختيار نقطة النهاية من دون مطالبة
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# خيارات نقاط نهاية Z.AI الأخرى: zai-coding-cn، zai-global، zai-cn
```

Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## علامات إضافية للوضع غير التفاعلي

مصادقة النموذج المستندة إلى الرمز المميز (تُستخدم مع `--auth-choice token`):

| العلامة                          | الوصف                                                                                                                               |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `--token-provider <id>`         | معرّف موفّر الرمز المميز الذي يُصدر الرمز                                                                                           |
| `--token <token>`               | قيمة الرمز المميز لمصادقة النموذج                                                                                                   |
| `--token-profile-id <id>`       | معرّف ملف تعريف المصادقة (الافتراضي `<provider>:manual`؛ تستخدم بعض التدفقات المملوكة للموفّر قيمة افتراضية خاصة بها، مثل `anthropic:default`) |
| `--token-expires-in <duration>` | مدة انتهاء صلاحية اختيارية للرمز المميز (مثل `365d` و`12h`)                                                                         |

Cloudflare AI Gateway: ‏`--cloudflare-ai-gateway-account-id <id>`، و`--cloudflare-ai-gateway-gateway-id <id>`.

التحكم في تثبيت العملية الخفية: `--no-install-daemon` / `--skip-daemon` (اسمان مستعاران؛ لتخطي تثبيت خدمة Gateway)، و`--daemon-runtime <node|bun>`.

Skills: ‏`--node-manager <npm|pnpm|bun>` (القيمة الافتراضية `npm`)، و`--skip-skills`.

إعداد واجهة المستخدم والخطافات: `--skip-ui` (لتخطي مطالبات واجهة التحكم/TUI)، و`--skip-hooks` (لتخطي إعداد Webhook/الخطافات)، و`--skip-channels`، و`--skip-search`.

الإخراج: يمنع `--suppress-gateway-token-output` إخراج Gateway/واجهة المستخدم الذي يحتوي على رموز مميزة (تلميحات الرمز المميز، وعنوان URL لتسجيل الدخول التلقائي المضمّن فيه الرمز، والتشغيل التلقائي لواجهة التحكم) — وهو مفيد في الطرفيات المشتركة وCI.

<Note>
لا يعني `--json` استخدام الوضع غير التفاعلي في الإعداد الموجّه أو التقليدي.
مع `--modern`، يكون JSON عرضًا عامًا لمرة واحدة من Crestodian، ثم تنتهي العملية بعد
تلك النتيجة الواحدة. استخدم `--non-interactive` للبرامج النصية الأخرى.
</Note>

## التصفية المسبقة للموفّرين

عندما يتضمن خيار المصادقة موفّرًا مفضّلًا، يُجري الإعداد تصفية مسبقة لأداتي اختيار النموذج الافتراضي وقائمة السماح بحيث تعرضان نماذج ذلك الموفّر. يطابق المرشّح أيضًا الموفّرين الآخرين المملوكين للـ Plugin نفسه، ما يشمل تنويعات خطة البرمجة مثل `volcengine`/`volcengine-plan` و`byteplus`/`byteplus-plan`. إذا لم يُنتج مرشّح الموفّر المفضّل أي نماذج محمّلة، يعود الإعداد إلى الكتالوج غير المرشّح بدلًا من ترك أداة الاختيار فارغة.

## مطالبات متابعة بحث الويب

تُطلق بعض موفّرات بحث الويب مطالبات متابعة خاصة بالموفّر أثناء الإعداد:

- يمكن أن يتيح **Grok** إعدادًا اختياريًا لـ`x_search` باستخدام مصادقة xAI نفسها واختيار نموذج `x_search`.
- يمكن أن يطلب **Kimi** منطقة Moonshot API ‏(`api.moonshot.ai` مقابل `api.moonshot.cn`) ونموذج بحث الويب الافتراضي لـKimi.

## سلوكيات أخرى

- سلوك نطاق الرسائل المباشرة في الإعداد المحلي: [مرجع إعداد CLI](/ar/start/wizard-cli-reference#outputs-and-internals).
- أسرع محادثة أولى: `openclaw dashboard` (واجهة التحكم، من دون إعداد قناة).
- موفّر مخصّص: صِل أي نقطة نهاية متوافقة مع OpenAI أو Anthropic، بما في ذلك الموفّرون المستضافون غير المدرجين. استخدم توافق **غير معروف** للاكتشاف التلقائي عبر اختبار مباشر.
- إذا اكتُشفت حالة Hermes، يتيح الإعداد تدفق ترحيل (راجع `--flow import` أعلاه).

## أوامر المتابعة الشائعة

استخدم `openclaw configure` لاحقًا لإجراء تغييرات مستهدفة لا تعتمد على الاستدلال، واستخدم `openclaw
channels add` لإعداد القنوات فقط. لتغيير موفّر النموذج أو مسار المصادقة،
شغّل `openclaw onboard` بدلًا من ذلك.

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
