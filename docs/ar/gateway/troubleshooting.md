---
read_when:
    - وجّهك مركز استكشاف الأخطاء وإصلاحها إلى هنا لإجراء تشخيص أعمق
    - تحتاج إلى أقسام ثابتة في دليل التشغيل قائمة على الأعراض وتتضمن أوامر دقيقة
sidebarTitle: Troubleshooting
summary: دليل تشغيل متعمق لاستكشاف الأخطاء وإصلاحها في Gateway والقنوات والأتمتة والعُقَد والمتصفح
title: استكشاف الأخطاء وإصلاحها
x-i18n:
    generated_at: "2026-05-10T19:43:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 798016211b615242abca327295c76223ff2dfd3d83dc8a08e396d9e65b9efed4
    source_path: gateway/troubleshooting.md
    workflow: 16
---

هذه الصفحة هي دليل التشغيل المتعمق. ابدأ من [/help/troubleshooting](/ar/help/troubleshooting) إذا كنت تريد مسار الفرز السريع أولا.

## سلم الأوامر

شغل هذه أولا، بهذا الترتيب:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

إشارات الصحة المتوقعة:

- يعرض `openclaw gateway status` السطر `Runtime: running`، و`Connectivity probe: ok`، وسطر `Capability: ...`.
- يبلغ `openclaw doctor` عن عدم وجود مشكلات إعداد/خدمة حاجبة.
- يعرض `openclaw channels status --probe` حالة النقل الحية لكل حساب، وحيثما يكون مدعوما، نتائج الفحص/التدقيق مثل `works` أو `audit ok`.

## تثبيتات منقسمة الذهن وحارس الإعداد الأحدث

استخدم هذا عندما تتوقف خدمة Gateway بشكل غير متوقع بعد تحديث، أو تعرض السجلات أن ملفا تنفيذيا واحدا باسم `openclaw` أقدم من الإصدار الذي كتب `openclaw.json` آخر مرة.

يختم OpenClaw عمليات كتابة الإعدادات باستخدام `meta.lastTouchedVersion`. يمكن للأوامر المخصصة للقراءة فقط أن تظل قادرة على فحص إعداد كتبه OpenClaw أحدث، لكن تعديلات العمليات والخدمات ترفض المتابعة من ملف تنفيذي أقدم. تشمل الإجراءات المحظورة بدء خدمة Gateway، وإيقافها، وإعادة تشغيلها، وإلغاء تثبيتها، وإعادة تثبيت الخدمة قسريا، وبدء Gateway في وضع الخدمة، وتنظيف منفذ `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="إصلاح PATH">
    أصلح `PATH` بحيث يشير `openclaw` إلى التثبيت الأحدث، ثم أعد تشغيل الإجراء.
  </Step>
  <Step title="إعادة تثبيت خدمة Gateway">
    أعد تثبيت خدمة Gateway المقصودة من التثبيت الأحدث:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="إزالة الأغلفة القديمة">
    أزل حزمة النظام القديمة أو إدخالات الغلاف القديمة التي لا تزال تشير إلى ملف `openclaw` تنفيذي قديم.
  </Step>
</Steps>

<Warning>
لخفض الإصدار المقصود أو الاسترداد الطارئ فقط، عيّن `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` للأمر الواحد. اتركه غير معيّن أثناء التشغيل العادي.
</Warning>

## تخطي رابط Skill الرمزي باعتباره خروجا عن المسار

استخدم هذا عندما تتضمن السجلات:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

يتعامل OpenClaw مع كل جذر Skill كحد احتواء. يتم تخطي الرابط الرمزي تحت
`~/.agents/skills`، أو `<workspace>/.agents/skills`، أو `<workspace>/skills`، أو
`~/.openclaw/skills` عندما يتحلل هدفه الحقيقي إلى خارج ذلك الجذر
ما لم يكن الهدف موثوقا به صراحة.

افحص الرابط:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

إذا كان الهدف مقصودا، فاضبط كلّا من جذر Skill المباشر وهدف الرابط الرمزي
المسموح:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

ثم ابدأ جلسة جديدة أو انتظر حتى يحدّث مراقب Skills. أعد تشغيل
Gateway إذا كانت العملية قيد التشغيل أقدم من تغيير الإعداد.

لا تستخدم أهدافا واسعة مثل `~`، أو `/`، أو مجلد مشروع متزامن بالكامل.
أبقِ `allowSymlinkTargets` محصورا في جذر Skill الحقيقي الذي يحتوي على أدلة
`SKILL.md` موثوقة.

ذات صلة:

- [إعداد Skills](/ar/tools/skills-config#symlinked-sibling-repos)
- [أمثلة الإعداد](/ar/gateway/configuration-examples#symlinked-sibling-skill-repo)

## يتطلب Anthropic 429 استخداما إضافيا للسياق الطويل

استخدم هذا عندما تتضمن السجلات/الأخطاء: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

ابحث عن:

- نموذج Anthropic Opus/Sonnet المحدد يحتوي على `params.context1m: true`.
- بيانات اعتماد Anthropic الحالية غير مؤهلة لاستخدام السياق الطويل.
- تفشل الطلبات فقط في الجلسات الطويلة/تشغيلات النماذج التي تحتاج إلى مسار 1M beta.

خيارات الإصلاح:

<Steps>
  <Step title="تعطيل context1m">
    عطّل `context1m` لذلك النموذج للرجوع إلى نافذة السياق العادية.
  </Step>
  <Step title="استخدام بيانات اعتماد مؤهلة">
    استخدم بيانات اعتماد Anthropic مؤهلة لطلبات السياق الطويل، أو انتقل إلى مفتاح API من Anthropic.
  </Step>
  <Step title="إعداد نماذج احتياطية">
    اضبط النماذج الاحتياطية بحيث تستمر التشغيلات عندما يتم رفض طلبات السياق الطويل من Anthropic.
  </Step>
</Steps>

ذات صلة:

- [Anthropic](/ar/providers/anthropic)
- [استخدام الرموز والتكاليف](/ar/reference/token-use)
- [لماذا أرى HTTP 429 من Anthropic؟](/ar/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## الخلفية المحلية المتوافقة مع OpenAI تنجح في الفحوص المباشرة لكن تشغيلات الوكيل تفشل

استخدم هذا عندما:

- يعمل `curl ... /v1/models`
- تعمل استدعاءات `/v1/chat/completions` المباشرة الصغيرة
- تفشل تشغيلات نموذج OpenClaw فقط في أدوار الوكيل العادية

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

ابحث عن:

- تنجح الاستدعاءات المباشرة الصغيرة، لكن تشغيلات OpenClaw تفشل فقط مع المطالبات الأكبر
- أخطاء `model_not_found` أو 404 رغم أن `/v1/chat/completions` المباشر
  يعمل بمعرف النموذج المجرد نفسه
- أخطاء الخلفية التي تفيد أن `messages[].content` يتوقع سلسلة نصية
- تحذيرات متقطعة من `incomplete turn detected ... stopReason=stop payloads=0` مع خلفية محلية متوافقة مع OpenAI
- انهيارات الخلفية التي تظهر فقط مع أعداد أكبر من رموز المطالبة أو مطالبات وقت تشغيل الوكيل الكاملة

<AccordionGroup>
  <Accordion title="التواقيع الشائعة">
    - `model_not_found` مع خادم محلي بنمط MLX/vLLM → تحقق من أن `baseUrl` يتضمن `/v1`، وأن `api` هو `"openai-completions"` لخلفيات `/v1/chat/completions`، وأن `models.providers.<provider>.models[].id` هو المعرف المحلي المجرد لدى المزوّد. حدده ببادئة المزوّد مرة واحدة، مثلا `mlx/mlx-community/Qwen3-30B-A3B-6bit`؛ وأبقِ إدخال الفهرس كما هو `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → ترفض الخلفية أجزاء محتوى Chat Completions المهيكلة. الإصلاح: عيّن `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` أو مفاتيح الرسائل المسموح بها مثل `["role","content"]` → ترفض الخلفية بيانات تعريف إعادة التشغيل بنمط OpenAI على رسائل Chat Completions. الإصلاح: عيّن `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → أكملت الخلفية طلب Chat Completions لكنها لم ترجع نص مساعد ظاهر للمستخدم لذلك الدور. يعيد OpenClaw محاولة أدوار OpenAI-compatible الفارغة والآمنة لإعادة التشغيل مرة واحدة؛ عادة ما تعني حالات الفشل المستمرة أن الخلفية تصدر محتوى فارغا/غير نصي أو تمنع نص الإجابة النهائية.
    - تنجح الطلبات المباشرة الصغيرة، لكن تشغيلات وكيل OpenClaw تفشل مع انهيارات في الخلفية/النموذج (مثل Gemma على بعض إصدارات `inferrs`) → غالبا ما يكون نقل OpenClaw صحيحا بالفعل؛ الخلفية تفشل في شكل مطالبة وقت تشغيل الوكيل الأكبر.
    - تتقلص حالات الفشل بعد تعطيل الأدوات لكنها لا تختفي → كانت مخططات الأدوات جزءا من الضغط، لكن المشكلة المتبقية لا تزال في سعة النموذج/الخادم المنبع أو خطأ في الخلفية.

  </Accordion>
  <Accordion title="خيارات الإصلاح">
    1. عيّن `compat.requiresStringContent: true` لخلفيات Chat Completions التي تقبل السلاسل النصية فقط.
    2. عيّن `compat.strictMessageKeys: true` لخلفيات Chat Completions الصارمة التي تقبل فقط `role` و`content` في كل رسالة.
    3. عيّن `compat.supportsTools: false` للنماذج/الخلفيات التي لا تستطيع التعامل مع سطح مخطط أدوات OpenClaw على نحو موثوق.
    4. خفف ضغط المطالبة حيثما أمكن: تمهيد مساحة عمل أصغر، سجل جلسة أقصر، نموذج محلي أخف، أو خلفية ذات دعم أقوى للسياق الطويل.
    5. إذا استمرت الطلبات المباشرة الصغيرة في النجاح بينما لا تزال أدوار وكيل OpenClaw تنهار داخل الخلفية، فتعامل معها كقيد في الخادم/النموذج المنبع وافتح إعادة إنتاج هناك مع شكل الحمولة المقبول.
  </Accordion>
</AccordionGroup>

ذات صلة:

- [الإعداد](/ar/gateway/configuration)
- [النماذج المحلية](/ar/gateway/local-models)
- [نقاط النهاية المتوافقة مع OpenAI](/ar/gateway/configuration-reference#openai-compatible-endpoints)

## لا توجد ردود

إذا كانت القنوات عاملة لكن لا شيء يجيب، فتحقق من التوجيه والسياسة قبل إعادة توصيل أي شيء.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

ابحث عن:

- الاقتران معلق لمرسلي الرسائل المباشرة.
- بوابة ذكر المجموعة (`requireMention`، `mentionPatterns`).
- عدم تطابق قوائم السماح للقناة/المجموعة.

التواقيع الشائعة:

- `drop guild message (mention required` → يتم تجاهل رسالة المجموعة حتى يتم الذكر.
- `pairing request` → يحتاج المرسل إلى موافقة.
- `blocked` / `allowlist` → تمت تصفية المرسل/القناة بواسطة السياسة.

ذات صلة:

- [استكشاف مشكلات القنوات وإصلاحها](/ar/channels/troubleshooting)
- [المجموعات](/ar/channels/groups)
- [الاقتران](/ar/channels/pairing)

## اتصال واجهة التحكم للوحة المعلومات

عندما لا تتصل واجهة لوحة المعلومات/التحكم، تحقق من URL، ووضع المصادقة، وافتراضات السياق الآمن.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

ابحث عن:

- URL الفحص وURL لوحة المعلومات الصحيحين.
- عدم تطابق وضع المصادقة/الرمز بين العميل وGateway.
- استخدام HTTP حيث تكون هوية الجهاز مطلوبة.

<AccordionGroup>
  <Accordion title="تواقيع الاتصال / المصادقة">
    - `device identity required` → سياق غير آمن أو مصادقة جهاز مفقودة.
    - `origin not allowed` → `Origin` في المتصفح غير موجود في `gateway.controlUi.allowedOrigins` (أو أنك تتصل من أصل متصفح غير loopback من دون قائمة سماح صريحة).
    - `device nonce required` / `device nonce mismatch` → لا يكمل العميل تدفق مصادقة الجهاز القائم على التحدي (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → وقّع العميل حمولة خاطئة (أو طابعا زمنيا قديما) للمصافحة الحالية.
    - `AUTH_TOKEN_MISMATCH` مع `canRetryWithDeviceToken=true` → يستطيع العميل إجراء إعادة محاولة موثوقة واحدة باستخدام رمز الجهاز المخزن مؤقتا.
    - تعيد إعادة المحاولة تلك بالرمز المخزن مؤقتا استخدام مجموعة النطاقات المخزنة مؤقتا مع رمز الجهاز المقترن. يحتفظ مستدعو `deviceToken` الصريح / `scopes` الصريح بمجموعة النطاقات المطلوبة لديهم بدلا من ذلك.
    - خارج مسار إعادة المحاولة ذلك، تكون أسبقية مصادقة الاتصال: الرمز/كلمة المرور المشتركة الصريحة أولا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزن، ثم رمز التمهيد.
    - على مسار واجهة التحكم غير المتزامن في Tailscale Serve، تتم تسلسلة المحاولات الفاشلة لنفس `{scope, ip}` قبل أن يسجل المحدد الفشل. لذلك يمكن لمحاولتي إعادة سيئتين ومتزامنتين من العميل نفسه أن تظهرا `retry later` في المحاولة الثانية بدلا من عدم تطابقين عاديين.
    - `too many failed authentication attempts (retry later)` من عميل loopback ذي أصل متصفح → يتم قفل حالات الفشل المتكررة من `Origin` المعياري نفسه مؤقتا؛ يستخدم أصل localhost آخر حاوية منفصلة.
    - `unauthorized` متكرر بعد إعادة المحاولة تلك → انحراف في الرمز المشترك/رمز الجهاز؛ حدّث إعداد الرمز وأعد الموافقة على رمز الجهاز أو دوّره إذا لزم الأمر.
    - `gateway connect failed:` → هدف مضيف/منفذ/url خاطئ.

  </Accordion>
</AccordionGroup>

### خريطة سريعة لرموز تفاصيل المصادقة

استخدم `error.details.code` من استجابة `connect` الفاشلة لاختيار الإجراء التالي:

| رمز التفاصيل                  | المعنى                                                                                                                                                                                      | الإجراء الموصى به                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | لم يرسل العميل رمزًا مشتركًا مطلوبًا.                                                                                                                                                 | الصق/عيّن الرمز في العميل ثم أعد المحاولة. لمسارات لوحة المعلومات: `openclaw config get gateway.auth.token` ثم الصقه في إعدادات واجهة التحكم.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | لم يطابق الرمز المشترك رمز مصادقة Gateway.                                                                                                                                               | إذا كانت `canRetryWithDeviceToken=true`، فاسمح بمحاولة إعادة واحدة موثوقة. تعيد محاولات الرمز المخزن مؤقتًا استخدام النطاقات المعتمدة المخزنة؛ ويحتفظ مستدعو `deviceToken` / `scopes` الصريحون بالنطاقات المطلوبة. إذا استمر الفشل، فشغّل [قائمة تحقق استرداد انحراف الرمز](/ar/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | الرمز المخزن مؤقتًا لكل جهاز قديم أو أُلغي.                                                                                                                                                 | بدّل/أعد اعتماد رمز الجهاز باستخدام [CLI الأجهزة](/ar/cli/devices)، ثم أعد الاتصال.                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | تحتاج هوية الجهاز إلى اعتماد. تحقق من `error.details.reason` بحثًا عن `not-paired` أو `scope-upgrade` أو `role-upgrade` أو `metadata-upgrade`، واستخدم `requestId` / `remediationHint` عند وجودهما. | اعتمد الطلب المعلق: `openclaw devices list` ثم `openclaw devices approve <requestId>`. تستخدم ترقيات النطاق/الدور التدفق نفسه بعد مراجعة الوصول المطلوب.                                                                                                               |

<Note>
ينبغي ألا تعتمد استدعاءات RPC الخلفية عبر loopback المباشر، والمصادق عليها باستخدام رمز/كلمة مرور Gateway المشتركة، على خط أساس نطاق الجهاز المقترن الخاص بـ CLI. إذا ظلت الوكلاء الفرعيون أو الاستدعاءات الداخلية الأخرى تفشل مع `scope-upgrade`، فتحقق من أن المستدعي يستخدم `client.id: "gateway-client"` و `client.mode: "backend"` وأنه لا يفرض `deviceIdentity` صريحة أو رمز جهاز.
</Note>

فحص ترحيل مصادقة الجهاز v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

إذا أظهرت السجلات أخطاء nonce/التوقيع، فحدّث العميل المتصل وتحقق منه:

<Steps>
  <Step title="Wait for connect.challenge">
    ينتظر العميل `connect.challenge` الصادر من Gateway.
  </Step>
  <Step title="Sign the payload">
    يوقّع العميل الحمولة المرتبطة بالتحدي.
  </Step>
  <Step title="Send the device nonce">
    يرسل العميل `connect.params.device.nonce` باستخدام nonce التحدي نفسه.
  </Step>
</Steps>

إذا رُفض `openclaw devices rotate` / `revoke` / `remove` بشكل غير متوقع:

- يمكن لجلسات رمز الجهاز المقترن إدارة جهازها **الخاص بها** فقط ما لم يكن لدى المستدعي أيضًا `operator.admin`
- يمكن لـ `openclaw devices rotate --scope ...` طلب نطاقات المشغل التي تحتفظ بها جلسة المستدعي بالفعل فقط

ذات صلة:

- [التكوين](/ar/gateway/configuration) (أوضاع مصادقة Gateway)
- [واجهة التحكم](/ar/web/control-ui)
- [الأجهزة](/ar/cli/devices)
- [الوصول عن بُعد](/ar/gateway/remote)
- [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth)

## خدمة Gateway لا تعمل

استخدم هذا عندما تكون الخدمة مثبتة لكن العملية لا تبقى قيد التشغيل.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

ابحث عن:

- `Runtime: stopped` مع تلميحات الخروج.
- عدم تطابق تكوين الخدمة (`Config (cli)` مقابل `Config (service)`).
- تعارضات المنفذ/المستمع.
- تثبيتات launchd/systemd/schtasks إضافية عند استخدام `--deep`.
- تلميحات تنظيف `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Common signatures">
    - `Gateway start blocked: set gateway.mode=local` أو `existing config is missing gateway.mode` ← وضع Gateway المحلي غير مفعّل، أو جرى إفساد ملف التكوين وفقد `gateway.mode`. الإصلاح: عيّن `gateway.mode="local"` في تكوينك، أو أعد تشغيل `openclaw onboard --mode local` / `openclaw setup` لإعادة ختم تكوين الوضع المحلي المتوقع. إذا كنت تشغّل OpenClaw عبر Podman، فمسار التكوين الافتراضي هو `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` ← ربط غير loopback دون مسار مصادقة Gateway صالح (رمز/كلمة مرور، أو وكيل موثوق حيثما تم تكوينه).
    - `another gateway instance is already listening` / `EADDRINUSE` ← تعارض منفذ.
    - `Other gateway-like services detected (best effort)` ← توجد وحدات launchd/systemd/schtasks قديمة أو متوازية. ينبغي لمعظم الإعدادات الاحتفاظ بـ Gateway واحد لكل جهاز؛ إذا كنت تحتاج فعلًا إلى أكثر من واحد، فاعزل المنافذ + التكوين/الحالة/مساحة العمل. راجع [/gateway#multiple-gateways-same-host](/ar/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` من doctor ← توجد وحدة systemd على مستوى النظام بينما خدمة مستوى المستخدم مفقودة. أزل النسخة المكررة أو عطّلها قبل السماح لـ doctor بتثبيت خدمة مستخدم، أو عيّن `OPENCLAW_SERVICE_REPAIR_POLICY=external` إذا كانت وحدة النظام هي المشرف المقصود.
    - `Gateway service port does not match current gateway config` ← لا يزال المشرف المثبت يثبّت `--port` القديم. شغّل `openclaw doctor --fix` أو `openclaw gateway install --force`، ثم أعد تشغيل خدمة Gateway.

  </Accordion>
</AccordionGroup>

ذات صلة:

- [تنفيذ الخلفية وأداة العمليات](/ar/gateway/background-process)
- [التكوين](/ar/gateway/configuration)
- [Doctor](/ar/gateway/doctor)

## رفض Gateway تكوينًا غير صالح

استخدم هذا عندما يفشل بدء Gateway مع `Invalid config` أو تقول سجلات إعادة التحميل الساخن
إنها تخطّت تعديلًا غير صالح.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

ابحث عن:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- ملف `openclaw.json.rejected.*` مؤرّخ بجانب التكوين النشط
- ملف `openclaw.json.clobbered.*` مؤرّخ إذا أصلح `doctor --fix` تعديلًا مباشرًا معطوبًا

<AccordionGroup>
  <Accordion title="What happened">
    - لم يجتز التكوين التحقق أثناء بدء التشغيل أو إعادة التحميل الساخن أو كتابة مملوكة لـ OpenClaw.
    - يفشل بدء Gateway بإغلاق آمن بدلًا من إعادة كتابة `openclaw.json`.
    - تتخطى إعادة التحميل الساخن التعديلات الخارجية غير الصالحة وتُبقي تكوين وقت التشغيل الحالي نشطًا.
    - ترفض الكتابات المملوكة لـ OpenClaw الحمولات غير الصالحة/الهدامة قبل الالتزام وتحفظ `.rejected.*`.
    - يمتلك `openclaw doctor --fix` الإصلاح. يمكنه إزالة بادئات غير JSON أو استعادة آخر نسخة معروفة جيدة مع الحفاظ على الحمولة المرفوضة كـ `.clobbered.*`.

  </Accordion>
  <Accordion title="Inspect and repair">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Common signatures">
    - وجود `.clobbered.*` ← احتفظ doctor بتعديل خارجي معطوب أثناء إصلاح التكوين النشط.
    - وجود `.rejected.*` ← فشلت كتابة تكوين مملوكة لـ OpenClaw في فحوصات المخطط أو الإفساد قبل الالتزام.
    - `Config write rejected:` ← حاولت الكتابة إسقاط البنية المطلوبة، أو تقليص الملف بشدة، أو حفظ تكوين غير صالح.
    - `config reload skipped (invalid config):` ← فشل تعديل مباشر في التحقق وتم تجاهله بواسطة Gateway العامل.
    - `Invalid config at ...` ← فشل بدء التشغيل قبل تشغيل خدمات Gateway.
    - `missing-meta-vs-last-good` أو `gateway-mode-missing-vs-last-good` أو `size-drop-vs-last-good:*` ← رُفضت كتابة مملوكة لـ OpenClaw لأنها فقدت حقولًا أو حجمًا مقارنة بالنسخة الاحتياطية الأخيرة المعروفة الجيدة.
    - `Config last-known-good promotion skipped` ← احتوى المرشح على عناصر نائبة لأسرار منقّحة مثل `***`.

  </Accordion>
  <Accordion title="Fix options">
    1. شغّل `openclaw doctor --fix` للسماح لـ doctor بإصلاح التكوين ذي البادئة/المتضرر أو استعادة آخر نسخة معروفة جيدة.
    2. انسخ فقط المفاتيح المقصودة من `.clobbered.*` أو `.rejected.*`، ثم طبّقها باستخدام `openclaw config set` أو `config.patch`.
    3. شغّل `openclaw config validate` قبل إعادة التشغيل.
    4. إذا عدّلت يدويًا، فاحتفظ بتكوين JSON5 الكامل، وليس فقط بالكائن الجزئي الذي أردت تغييره.
  </Accordion>
</AccordionGroup>

ذات صلة:

- [Config](/ar/cli/config)
- [التكوين: إعادة التحميل الساخن](/ar/gateway/configuration#config-hot-reload)
- [التكوين: التحقق الصارم](/ar/gateway/configuration#strict-validation)
- [Doctor](/ar/gateway/doctor)

## تحذيرات مسبار Gateway

استخدم هذا عندما يصل `openclaw gateway probe` إلى شيء ما، لكنه لا يزال يطبع كتلة تحذير.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

ابحث عن:

- `warnings[].code` و `primaryTargetId` في خرج JSON.
- ما إذا كان التحذير متعلقًا بالرجوع الاحتياطي لـ SSH، أو تعدد Gateways، أو النطاقات المفقودة، أو مراجع المصادقة غير المحلولة.

التواقيع الشائعة:

- `SSH tunnel failed to start; falling back to direct probes.` ← فشل إعداد SSH، لكن الأمر ظل يحاول الأهداف المباشرة المكوّنة/loopback.
- `multiple reachable gateways detected` ← أجاب أكثر من هدف واحد. يعني هذا عادةً إعدادًا مقصودًا لعدة Gateways أو مستمعين قدامى/مكررين.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` ← نجح الاتصال، لكن RPC التفاصيل مقيّد بالنطاق؛ أقرن هوية الجهاز أو استخدم بيانات اعتماد تتضمن `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` ← نجح الاتصال، لكن مجموعة RPC التشخيصية الكاملة انتهت مهلتها أو فشلت. تعامل مع هذا كـ Gateway قابل للوصول مع تشخيصات متدهورة؛ قارن `connect.ok` و `connect.rpcOk` في خرج `--json`.
- `Capability: pairing-pending` أو `gateway closed (1008): pairing required` ← أجاب Gateway، لكن هذا العميل لا يزال يحتاج إلى الاقتران/الاعتماد قبل وصول المشغل العادي.
- نص تحذير SecretRef غير محلول لـ `gateway.auth.*` / `gateway.remote.*` ← لم تكن مادة المصادقة متاحة في مسار الأمر هذا للهدف الفاشل.

ذات صلة:

- [Gateway](/ar/cli/gateway)
- [عدة Gateways على المضيف نفسه](/ar/gateway#multiple-gateways-same-host)
- [الوصول عن بُعد](/ar/gateway/remote)

## القناة متصلة، لكن الرسائل لا تتدفق

إذا كانت حالة القناة متصلة لكن تدفق الرسائل متوقف، فركّز على السياسة والأذونات وقواعد التسليم الخاصة بالقناة.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

ابحث عن:

- سياسة الرسائل المباشرة (`pairing`، `allowlist`، `open`، `disabled`).
- قائمة السماح للمجموعات ومتطلبات الإشارة.
- أذونات/نطاقات API القناة المفقودة.

التواقيع الشائعة:

- `mention required` → تم تجاهل الرسالة بسبب سياسة الإشارة في المجموعة.
- `pairing` / آثار الموافقة المعلقة → المرسل غير معتمد.
- `missing_scope`، `not_in_channel`، `Forbidden`، `401/403` → مشكلة في مصادقة/أذونات القناة.

ذات صلة:

- [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting)
- [Discord](/ar/channels/discord)
- [Telegram](/ar/channels/telegram)
- [WhatsApp](/ar/channels/whatsapp)

## تسليم Cron و Heartbeat

إذا لم يعمل Cron أو Heartbeat، أو لم يتم التسليم، فتحقق من حالة المجدول أولا، ثم هدف التسليم.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

ابحث عن:

- تفعيل Cron ووجود وقت التنبيه التالي.
- حالة سجل تشغيل المهمة (`ok`، `skipped`، `error`).
- أسباب تخطي Heartbeat (`quiet-hours`، `requests-in-flight`، `cron-in-progress`، `lanes-busy`، `alerts-disabled`، `empty-heartbeat-file`، `no-tasks-due`).

<AccordionGroup>
  <Accordion title="التواقيع الشائعة">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron معطل.
    - `cron: timer tick failed` → فشل نبض مؤقت المجدول؛ تحقق من أخطاء الملف/السجل/وقت التشغيل.
    - `heartbeat skipped` مع `reason=quiet-hours` → خارج نافذة ساعات النشاط.
    - `heartbeat skipped` مع `reason=empty-heartbeat-file` → يوجد `HEARTBEAT.md` لكنه يحتوي فقط على أسطر فارغة / رؤوس markdown، لذلك يتخطى OpenClaw استدعاء النموذج.
    - `heartbeat skipped` مع `reason=no-tasks-due` → يحتوي `HEARTBEAT.md` على كتلة `tasks:`، لكن لا توجد أي مهمة مستحقة في هذا النبض.
    - `heartbeat: unknown accountId` → معرف حساب غير صالح لهدف تسليم Heartbeat.
    - `heartbeat skipped` مع `reason=dm-blocked` → تم حل هدف Heartbeat إلى وجهة بنمط الرسائل المباشرة بينما تم ضبط `agents.defaults.heartbeat.directPolicy` (أو تجاوز لكل وكيل) على `block`.

  </Accordion>
</AccordionGroup>

ذات صلة:

- [Heartbeat](/ar/gateway/heartbeat)
- [المهام المجدولة](/ar/automation/cron-jobs)
- [المهام المجدولة: استكشاف الأخطاء وإصلاحها](/ar/automation/cron-jobs#troubleshooting)

## Node مقترن، الأداة تفشل

إذا كان Node مقترنا لكن الأدوات تفشل، فاعزل حالة الواجهة الأمامية، والأذونات، والموافقة.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

ابحث عن:

- Node متصل بالإنترنت مع القدرات المتوقعة.
- منح أذونات نظام التشغيل للكاميرا/الميكروفون/الموقع/الشاشة.
- موافقات التنفيذ وحالة قائمة السماح.

التواقيع الشائعة:

- `NODE_BACKGROUND_UNAVAILABLE` → يجب أن يكون تطبيق Node في الواجهة الأمامية.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → إذن نظام تشغيل مفقود.
- `SYSTEM_RUN_DENIED: approval required` → موافقة التنفيذ معلقة.
- `SYSTEM_RUN_DENIED: allowlist miss` → الأمر محظور بواسطة قائمة السماح.

ذات صلة:

- [موافقات التنفيذ](/ar/tools/exec-approvals)
- [استكشاف أخطاء Node وإصلاحها](/ar/nodes/troubleshooting)
- [Nodes](/ar/nodes/index)

## أداة المتصفح تفشل

استخدم هذا عندما تفشل إجراءات أداة المتصفح رغم أن Gateway نفسه سليم.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

ابحث عن:

- ما إذا كان `plugins.allow` مضبوطا ويتضمن `browser`.
- مسار تنفيذي صالح للمتصفح.
- إمكانية الوصول إلى ملف تعريف CDP.
- توفر Chrome المحلي لملفات تعريف `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="تواقيع Plugin / الملف التنفيذي">
    - `unknown command "browser"` أو `unknown command 'browser'` → تم استبعاد plugin المتصفح المضمن بواسطة `plugins.allow`.
    - أداة المتصفح مفقودة / غير متاحة بينما `browser.enabled=true` → يستبعد `plugins.allow` قيمة `browser`، لذلك لم يتم تحميل plugin أبدا.
    - `Failed to start Chrome CDP on port` → فشلت عملية المتصفح في التشغيل.
    - `browser.executablePath not found` → المسار المهيأ غير صالح.
    - `browser.cdpUrl must be http(s) or ws(s)` → يستخدم عنوان URL المهيأ لـ CDP مخططا غير مدعوم مثل `file:` أو `ftp:`.
    - `browser.cdpUrl has invalid port` → يحتوي عنوان URL المهيأ لـ CDP على منفذ غير صالح أو خارج النطاق.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → يفتقر تثبيت Gateway الحالي إلى تبعية وقت تشغيل المتصفح الأساسية؛ أعد تثبيت OpenClaw أو حدّثه، ثم أعد تشغيل Gateway. لا تزال لقطات ARIA ولقطات الصفحة الأساسية تعمل، لكن التنقل، ولقطات AI، ولقطات عناصر محدد CSS، وتصدير PDF تبقى غير متاحة.

  </Accordion>
  <Accordion title="تواقيع Chrome MCP / الجلسة الحالية">
    - `Could not find DevToolsActivePort for chrome` → تعذر على جلسة Chrome MCP الحالية الاتصال بدليل بيانات المتصفح المحدد حتى الآن. افتح صفحة فحص المتصفح، وفعّل التصحيح عن بعد، وأبق المتصفح مفتوحا، ووافق على مطالبة الاتصال الأولى، ثم أعد المحاولة. إذا لم تكن حالة تسجيل الدخول مطلوبة، ففضل ملف التعريف المدار `openclaw`.
    - `No Chrome tabs found for profile="user"` → لا يحتوي ملف تعريف اتصال Chrome MCP على أي علامات تبويب Chrome محلية مفتوحة.
    - `Remote CDP for profile "<name>" is not reachable` → لا يمكن الوصول إلى نقطة نهاية CDP البعيدة المهيأة من مضيف Gateway.
    - `Browser attachOnly is enabled ... not reachable` أو `Browser attachOnly is enabled and CDP websocket ... is not reachable` → لا يملك ملف تعريف الاتصال فقط هدفا قابلا للوصول، أو أن نقطة نهاية HTTP استجابت لكن تعذر فتح CDP WebSocket.

  </Accordion>
  <Accordion title="تواقيع العنصر / لقطة الشاشة / الرفع">
    - `fullPage is not supported for element screenshots` → مزج طلب لقطة الشاشة بين `--full-page` و`--ref` أو `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → يجب أن تستخدم استدعاءات لقطات الشاشة في Chrome MCP / `existing-session` التقاط الصفحة أو `--ref` من لقطة، وليس CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → تحتاج خطافات الرفع في Chrome MCP إلى مراجع اللقطات، وليس محددات CSS.
    - `existing-session file uploads currently support one file at a time.` → أرسل عملية رفع واحدة لكل استدعاء على ملفات تعريف Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → لا تدعم خطافات الحوارات في ملفات تعريف Chrome MCP تجاوزات المهلة.
    - `existing-session type does not support timeoutMs overrides.` → احذف `timeoutMs` من `act:type` على ملفات تعريف `profile="user"` / جلسات Chrome MCP الحالية، أو استخدم ملف تعريف متصفح مدار/CDP عندما تكون مهلة مخصصة مطلوبة.
    - `existing-session evaluate does not support timeoutMs overrides.` → احذف `timeoutMs` من `act:evaluate` على ملفات تعريف `profile="user"` / جلسات Chrome MCP الحالية، أو استخدم ملف تعريف متصفح مدار/CDP عندما تكون مهلة مخصصة مطلوبة.
    - `response body is not supported for existing-session profiles yet.` → لا يزال `responsebody` يتطلب متصفحا مدارا أو ملف تعريف CDP خاما.
    - تجاوزات منفذ العرض / الوضع الداكن / اللغة / عدم الاتصال القديمة على ملفات تعريف الاتصال فقط أو CDP البعيدة → شغل `openclaw browser stop --browser-profile <name>` لإغلاق جلسة التحكم النشطة وتحرير حالة محاكاة Playwright/CDP دون إعادة تشغيل Gateway بالكامل.

  </Accordion>
</AccordionGroup>

ذات صلة:

- [المتصفح (مدار بواسطة OpenClaw)](/ar/tools/browser)
- [استكشاف أخطاء المتصفح على Linux وإصلاحها](/ar/tools/browser-linux-troubleshooting)

## إذا أجريت ترقية وتعطل شيء فجأة

معظم الأعطال بعد الترقية تكون انحرافا في الإعدادات أو قيما افتراضية أكثر صرامة يجري فرضها الآن.

<AccordionGroup>
  <Accordion title="1. تغير سلوك المصادقة وتجاوز URL">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    ما يجب التحقق منه:

    - إذا كان `gateway.mode=remote`، فقد تستهدف استدعاءات CLI جهة بعيدة بينما خدمتك المحلية سليمة.
    - لا تعود استدعاءات `--url` الصريحة إلى بيانات الاعتماد المخزنة.

    التواقيع الشائعة:

    - `gateway connect failed:` → هدف URL خاطئ.
    - `unauthorized` → نقطة النهاية قابلة للوصول لكن المصادقة خاطئة.

  </Accordion>
  <Accordion title="2. قيود الربط والمصادقة أصبحت أكثر صرامة">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    ما يجب التحقق منه:

    - تحتاج روابط غير local loopback (`lan`، `tailnet`، `custom`) إلى مسار مصادقة Gateway صالح: مصادقة رمز/كلمة مرور مشتركة، أو نشر `trusted-proxy` غير local loopback مهيأ بشكل صحيح.
    - المفاتيح القديمة مثل `gateway.token` لا تستبدل `gateway.auth.token`.

    التواقيع الشائعة:

    - `refusing to bind gateway ... without auth` → ربط غير local loopback دون مسار مصادقة Gateway صالح.
    - `Connectivity probe: failed` أثناء تشغيل وقت التشغيل → Gateway حي لكنه غير قابل للوصول بالمصادقة/URL الحاليين.

  </Accordion>
  <Accordion title="3. تغيرت حالة الاقتران وهوية الجهاز">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    ما يجب التحقق منه:

    - موافقات الأجهزة المعلقة للوحة التحكم/nodes.
    - موافقات اقتران الرسائل المباشرة المعلقة بعد تغييرات السياسة أو الهوية.

    التواقيع الشائعة:

    - `device identity required` → لم يتم استيفاء مصادقة الجهاز.
    - `pairing required` → يجب اعتماد المرسل/الجهاز.

  </Accordion>
</AccordionGroup>

إذا ظلت إعدادات الخدمة ووقت التشغيل غير متفقين بعد الفحوصات، فأعد تثبيت بيانات تعريف الخدمة من دليل الملف الشخصي/الحالة نفسه:

```bash
openclaw gateway install --force
openclaw gateway restart
```

ذات صلة:

- [المصادقة](/ar/gateway/authentication)
- [التنفيذ في الخلفية وأداة العمليات](/ar/gateway/background-process)
- [الاقتران المملوك لـ Gateway](/ar/gateway/pairing)

## ذات صلة

- [Doctor](/ar/gateway/doctor)
- [الأسئلة الشائعة](/ar/help/faq)
- [دليل تشغيل Gateway](/ar/gateway)
