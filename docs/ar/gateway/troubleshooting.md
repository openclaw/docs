---
read_when:
    - أحالَك مركز استكشاف الأخطاء وإصلاحها إلى هنا من أجل تشخيص أعمق
    - تحتاج إلى أقسام دليل تشغيل مستقرة قائمة على الأعراض مع أوامر دقيقة
sidebarTitle: Troubleshooting
summary: دليل تشغيل متعمّق لاستكشاف أخطاء Gateway والقنوات والأتمتة والعُقد والمتصفح وإصلاحها
title: استكشاف الأخطاء وإصلاحها
x-i18n:
    generated_at: "2026-04-26T11:32:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: eacc6b2a0e8522a761dcee0a3b9bc024eefbd7a5ab4118fc090401868a571bcf
    source_path: gateway/troubleshooting.md
    workflow: 15
---

هذه الصفحة هي دليل التشغيل المتعمّق. ابدأ من [/help/troubleshooting](/ar/help/troubleshooting) إذا كنت تريد تدفق الفرز السريع أولًا.

## سُلّم الأوامر

شغّل هذه الأوامر أولًا، بهذا الترتيب:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

إشارات السلامة المتوقعة:

- يعرض `openclaw gateway status` القيم `Runtime: running` و`Connectivity probe: ok` وسطر `Capability: ...`.
- لا يبلّغ `openclaw doctor` عن أي مشكلات حاجبة في الإعدادات/الخدمة.
- يعرض `openclaw channels status --probe` حالة النقل الحية لكل حساب، وعند الدعم، نتائج probe/audit مثل `works` أو `audit ok`.

## تثبيتات split brain وحاجز الإعدادات الأحدث

استخدم هذا عندما تتوقف خدمة gateway بشكل غير متوقع بعد تحديث، أو عندما تُظهر السجلات أن ملفًا تنفيذيًا واحدًا لـ `openclaw` أقدم من الإصدار الذي كتب `openclaw.json` آخر مرة.

يضع OpenClaw علامة على كتابات الإعدادات باستخدام `meta.lastTouchedVersion`. ولا تزال أوامر القراءة فقط قادرة على فحص إعدادات كتبها إصدار أحدث من OpenClaw، لكن عمليات التغيير على العمليات والخدمات ترفض المتابعة من ملف تنفيذي أقدم. وتشمل الإجراءات المحظورة: بدء خدمة gateway، وإيقافها، وإعادة تشغيلها، وإلغاء تثبيتها، وإعادة تثبيت الخدمة بالقوة، وبدء gateway في وضع الخدمة، و`gateway --force` لتنظيف المنفذ.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="إصلاح PATH">
    أصلح `PATH` بحيث يُحل `openclaw` إلى التثبيت الأحدث، ثم أعد تنفيذ الإجراء.
  </Step>
  <Step title="أعد تثبيت خدمة gateway">
    أعد تثبيت خدمة gateway المقصودة من التثبيت الأحدث:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="أزل الأغلفة القديمة">
    أزل إدخالات حزمة النظام القديمة أو الأغلفة القديمة التي ما زالت تشير إلى ملف تنفيذي قديم لـ `openclaw`.
  </Step>
</Steps>

<Warning>
لأغراض خفض الإصدار المقصود أو الاستعادة الطارئة فقط، اضبط `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` للأمر الواحد. واتركه غير مضبوط في التشغيل العادي.
</Warning>

## Anthropic 429: مطلوب استخدام إضافي للسياق الطويل

استخدم هذا عندما تتضمن السجلات/الأخطاء: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

ابحث عن:

- أن نموذج Anthropic Opus/Sonnet المحدد يحتوي على `params.context1m: true`.
- أن بيانات اعتماد Anthropic الحالية غير مؤهلة لاستخدام السياق الطويل.
- أن الطلبات تفشل فقط في الجلسات/تشغيلات النماذج الطويلة التي تحتاج إلى مسار 1M beta.

خيارات الإصلاح:

<Steps>
  <Step title="عطّل context1m">
    عطّل `context1m` لذلك النموذج للعودة إلى نافذة السياق العادية.
  </Step>
  <Step title="استخدم بيانات اعتماد مؤهلة">
    استخدم بيانات اعتماد Anthropic مؤهلة لطلبات السياق الطويل، أو بدّل إلى مفتاح Anthropic API.
  </Step>
  <Step title="هيّئ نماذج fallback">
    هيّئ نماذج fallback حتى تستمر التشغيلات عندما يتم رفض طلبات Anthropic ذات السياق الطويل.
  </Step>
</Steps>

ذو صلة:

- [Anthropic](/ar/providers/anthropic)
- [استخدام الرموز والتكاليف](/ar/reference/token-use)
- [لماذا أرى HTTP 429 من Anthropic؟](/ar/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## واجهة خلفية محلية متوافقة مع OpenAI تنجح مع probes المباشرة لكن تشغيلات الوكيل تفشل

استخدم هذا عندما:

- ينجح `curl ... /v1/models`
- تنجح الاستدعاءات المباشرة الصغيرة إلى `/v1/chat/completions`
- تفشل تشغيلات نماذج OpenClaw فقط في الدورات العادية للوكيل

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

ابحث عن:

- نجاح الاستدعاءات المباشرة الصغيرة، لكن فشل تشغيلات OpenClaw فقط مع المطالبات الأكبر
- أخطاء في الواجهة الخلفية حول توقّع `messages[].content` لقيمة string
- أعطال في الواجهة الخلفية لا تظهر إلا مع أعداد أكبر من prompt-token أو موجهات runtime الكاملة للوكيل

<AccordionGroup>
  <Accordion title="التواقيع الشائعة">
    - `messages[...].content: invalid type: sequence, expected a string` ← الواجهة الخلفية ترفض الأجزاء المهيكلة لمحتوى Chat Completions. الإصلاح: اضبط `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - تنجح الطلبات المباشرة الصغيرة، لكن تشغيلات وكيل OpenClaw تفشل مع أعطال في الواجهة الخلفية/النموذج (مثل Gemma على بعض إصدارات `inferrs`) ← من المرجح أن يكون نقل OpenClaw صحيحًا بالفعل؛ فالواجهة الخلفية هي التي تفشل مع شكل الموجه الأكبر الخاص بـ agent-runtime.
    - تقل الإخفاقات بعد تعطيل الأدوات لكنها لا تختفي ← كانت مخططات الأدوات جزءًا من الضغط، لكن المشكلة المتبقية لا تزال ترجع إلى سعة النموذج/الخادم في المنبع أو إلى خطأ في الواجهة الخلفية.

  </Accordion>
  <Accordion title="خيارات الإصلاح">
    1. اضبط `compat.requiresStringContent: true` للواجهات الخلفية الخاصة بـ Chat Completions التي تقبل string فقط.
    2. اضبط `compat.supportsTools: false` للنماذج/الواجهات الخلفية التي لا يمكنها التعامل بشكل موثوق مع سطح مخطط الأدوات في OpenClaw.
    3. خفّض ضغط الموجه حيثما أمكن: bootstrap أصغر لمساحة العمل، أو سجل جلسة أقصر، أو نموذج محلي أخف، أو واجهة خلفية ذات دعم أقوى للسياق الطويل.
    4. إذا استمرت الطلبات المباشرة الصغيرة في النجاح بينما لا تزال دورات وكيل OpenClaw تتعطل داخل الواجهة الخلفية، فاعتبرها قيدًا في الخادم/النموذج في المنبع وقدّم هناك repro مع شكل الحمولة المقبول.
  </Accordion>
</AccordionGroup>

ذو صلة:

- [التهيئة](/ar/gateway/configuration)
- [النماذج المحلية](/ar/gateway/local-models)
- [نقاط نهاية متوافقة مع OpenAI](/ar/gateway/configuration-reference#openai-compatible-endpoints)

## لا توجد ردود

إذا كانت القنوات تعمل لكن لا شيء يرد، فتحقق من التوجيه والسياسة قبل إعادة توصيل أي شيء.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

ابحث عن:

- وجود pairing معلّق لمرسلي الرسائل الخاصة.
- بوابة الإشارة في المجموعات (`requireMention` و`mentionPatterns`).
- عدم تطابق قائمة السماح للقناة/المجموعة.

التواقيع الشائعة:

- `drop guild message (mention required` ← تم تجاهل رسالة المجموعة حتى تتم الإشارة.
- `pairing request` ← يحتاج المرسل إلى الموافقة.
- `blocked` / `allowlist` ← تمت تصفية المرسل/القناة بواسطة السياسة.

ذو صلة:

- [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting)
- [المجموعات](/ar/channels/groups)
- [الاقتران](/ar/channels/pairing)

## اتصال Dashboard Control UI

عندما يتعذر على dashboard/Control UI الاتصال، تحقّق من عنوان URL ووضع المصادقة وافتراضات secure context.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

ابحث عن:

- عنوان probe URL الصحيح وعنوان dashboard URL الصحيح.
- عدم تطابق وضع المصادقة/token بين العميل وgateway.
- استخدام HTTP عندما تكون هوية الجهاز مطلوبة.

<AccordionGroup>
  <Accordion title="تواقيع الاتصال / المصادقة">
    - `device identity required` ← secure context غير متوفر أو مصادقة الجهاز مفقودة.
    - `origin not allowed` ← قيمة `Origin` في المتصفح غير موجودة في `gateway.controlUi.allowedOrigins` (أو أنك تتصل من origin متصفح غير تابع لـ loopback من دون قائمة سماح صريحة).
    - `device nonce required` / `device nonce mismatch` ← لا يكمل العميل تدفق مصادقة الجهاز المعتمد على التحدي (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` ← وقّع العميل الحمولة الخطأ (أو استخدم طابعًا زمنيًا قديمًا) للمصافحة الحالية.
    - `AUTH_TOKEN_MISMATCH` مع `canRetryWithDeviceToken=true` ← يمكن للعميل تنفيذ إعادة محاولة موثوقة واحدة باستخدام device token المخزنة مؤقتًا.
    - تعيد محاولة token المخزنة مؤقتًا استخدام مجموعة النطاقات المخزنة مؤقتًا مع device token المقترنة. أما المستدعون الذين يمررون `deviceToken` صريحًا / `scopes` صريحة فيحتفظون بمجموعة النطاقات المطلوبة لديهم بدلًا من ذلك.
    - خارج مسار إعادة المحاولة هذا، تكون أولوية مصادقة الاتصال هي: token/password مشتركة صريحة أولًا، ثم `deviceToken` صريحة، ثم device token المخزنة، ثم bootstrap token.
    - في المسار غير المتزامن لـ Control UI عبر Tailscale Serve، تُسلسَل المحاولات الفاشلة لنفس `{scope, ip}` قبل أن يسجل المحدِّد الفشل. لذلك قد تُظهر محاولتان سيئتان متزامنتان من العميل نفسه رسالة `retry later` في المحاولة الثانية بدلًا من عدم تطابقين عاديين.
    - `too many failed authentication attempts (retry later)` من عميل loopback ذي origin متصفح ← تُحظر مؤقتًا الإخفاقات المتكررة من ذلك `Origin` المطبّع نفسه؛ ويستخدم origin localhost آخر حاوية منفصلة.
    - `repeated unauthorized` بعد إعادة المحاولة تلك ← انجراف shared token/device token؛ حدّث إعدادات token وأعد اعتماد/تدوير device token إذا لزم الأمر.
    - `gateway connect failed:` ← الهدف host/port/url غير صحيح.

  </Accordion>
</AccordionGroup>

### خريطة سريعة لرموز تفاصيل المصادقة

استخدم `error.details.code` من استجابة `connect` الفاشلة لاختيار الإجراء التالي:

| رمز التفاصيل                 | المعنى                                                                                                                                                                                         | الإجراء الموصى به                                                                                                                                                                                                                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | لم يرسل العميل shared token مطلوبة.                                                                                                                                                            | ألصق/اضبط token في العميل ثم أعد المحاولة. لمسارات dashboard: `openclaw config get gateway.auth.token` ثم ألصقها في إعدادات Control UI.                                                                                                                                                 |
| `AUTH_TOKEN_MISMATCH`        | لا تتطابق shared token مع gateway auth token.                                                                                                                                                  | إذا كانت `canRetryWithDeviceToken=true`، فاسمح بإعادة محاولة موثوقة واحدة. تعيد إعادة المحاولة باستخدام token المخزنة مؤقتًا استخدام النطاقات المعتمدة المخزنة؛ أما المستدعون الذين يمررون `deviceToken` / `scopes` صريحة فيحتفظون بالنطاقات المطلوبة لديهم. إذا استمر الفشل، شغّل [قائمة التحقق الخاصة باستعادة انجراف token](/ar/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | device token المخزنة مؤقتًا لكل جهاز قديمة أو أُبطلت.                                                                                                                                          | قم بتدوير/إعادة اعتماد device token باستخدام [CLI الخاصة بالأجهزة](/ar/cli/devices)، ثم أعد الاتصال.                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | تحتاج هوية الجهاز إلى موافقة. تحقّق من `error.details.reason` لمعرفة `not-paired` أو `scope-upgrade` أو `role-upgrade` أو `metadata-upgrade`، واستخدم `requestId` / `remediationHint` عند توفرهما. | وافق على الطلب المعلّق: `openclaw devices list` ثم `openclaw devices approve <requestId>`. وتستخدم ترقيات النطاق/الدور التدفق نفسه بعد مراجعة الوصول المطلوب.                                                                                                                           |

<Note>
يجب ألا تعتمد استدعاءات RPC المباشرة لواجهة loopback الخلفية، الموثقة باستخدام gateway token/password المشتركة، على خط الأساس لنطاق الجهاز المقترن في CLI. وإذا كانت subagents أو الاستدعاءات الداخلية الأخرى لا تزال تفشل مع `scope-upgrade`، فتحقق من أن المستدعي يستخدم `client.id: "gateway-client"` و`client.mode: "backend"` وأنه لا يفرض `deviceIdentity` صريحة أو device token.
</Note>

فحص ترحيل Device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

إذا أظهرت السجلات أخطاء nonce/signature، فحدّث العميل المتصل وتحقق منه:

<Steps>
  <Step title="انتظر connect.challenge">
    ينتظر العميل قيمة `connect.challenge` الصادرة من gateway.
  </Step>
  <Step title="وقّع الحمولة">
    يوقّع العميل الحمولة المرتبطة بالتحدي.
  </Step>
  <Step title="أرسل device nonce">
    يرسل العميل `connect.params.device.nonce` باستخدام nonce التحدي نفسها.
  </Step>
</Steps>

إذا تم رفض `openclaw devices rotate` / `revoke` / `remove` بشكل غير متوقع:

- لا يمكن لجلسات token الخاصة بالأجهزة المقترنة إدارة إلا **أجهزتها الخاصة** ما لم يكن لدى المستدعي أيضًا `operator.admin`
- لا يمكن لـ `openclaw devices rotate --scope ...` طلب نطاقات مشغّل إلا إذا كانت جلسة المستدعي تملكها بالفعل

ذو صلة:

- [التهيئة](/ar/gateway/configuration) (أوضاع مصادقة gateway)
- [Control UI](/ar/web/control-ui)
- [الأجهزة](/ar/cli/devices)
- [الوصول عن بُعد](/ar/gateway/remote)
- [مصادقة Trusted proxy](/ar/gateway/trusted-proxy-auth)

## خدمة Gateway غير قيد التشغيل

استخدم هذا عندما تكون الخدمة مثبتة لكن العملية لا تظل قيد التشغيل.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # افحص أيضًا الخدمات على مستوى النظام
```

ابحث عن:

- `Runtime: stopped` مع تلميحات الخروج.
- عدم تطابق إعدادات الخدمة (`Config (cli)` مقابل `Config (service)`).
- تعارضات المنفذ/المستمع.
- وجود تثبيتات إضافية launchd/systemd/schtasks عند استخدام `--deep`.
- تلميحات تنظيف `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="التواقيع الشائعة">
    - `Gateway start blocked: set gateway.mode=local` أو `existing config is missing gateway.mode` ← وضع gateway المحلي غير مفعّل، أو تم إتلاف ملف الإعدادات وفقد `gateway.mode`. الإصلاح: اضبط `gateway.mode="local"` في إعداداتك، أو أعد تشغيل `openclaw onboard --mode local` / `openclaw setup` لإعادة ختم إعدادات الوضع المحلي المتوقعة. وإذا كنت تشغّل OpenClaw عبر Podman، فمسار الإعدادات الافتراضي هو `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` ← عملية bind غير تابعة لـ loopback من دون مسار مصادقة gateway صالح (token/password، أو trusted-proxy حيثما تم ضبطه).
    - `another gateway instance is already listening` / `EADDRINUSE` ← تعارض منفذ.
    - `Other gateway-like services detected (best effort)` ← توجد وحدات launchd/systemd/schtasks قديمة أو متوازية. ويجب في معظم الإعدادات الإبقاء على gateway واحدة لكل جهاز؛ وإذا كنت بحاجة فعلًا إلى أكثر من واحدة، فاعزل المنافذ + الإعدادات/الحالة/مساحة العمل. راجع [/gateway#multiple-gateways-same-host](/ar/gateway#multiple-gateways-same-host).

  </Accordion>
</AccordionGroup>

ذو صلة:

- [التنفيذ في الخلفية وأداة العمليات](/ar/gateway/background-process)
- [التهيئة](/ar/gateway/configuration)
- [Doctor](/ar/gateway/doctor)

## قام Gateway باستعادة آخر إعدادات سليمة معروفة

استخدم هذا عندما يبدأ Gateway، لكن السجلات تقول إنه استعاد `openclaw.json`.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

ابحث عن:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- ملف `openclaw.json.clobbered.*` مختوم زمنيًا بجوار الإعدادات النشطة
- حدث نظام للوكيل الرئيسي يبدأ بـ `Config recovery warning`

<AccordionGroup>
  <Accordion title="ما الذي حدث">
    - لم تنجح الإعدادات المرفوضة في التحقق أثناء بدء التشغيل أو إعادة التحميل السريع.
    - احتفظ OpenClaw بالحمولة المرفوضة باسم `.clobbered.*`.
    - تمت استعادة الإعدادات النشطة من آخر نسخة سليمة معروفة تم التحقق منها.
    - يتم تحذير دورة الوكيل الرئيسية التالية من إعادة كتابة الإعدادات المرفوضة بشكل أعمى.
    - إذا كانت كل مشكلات التحقق تحت `plugins.entries.<id>...`، فلن يستعيد OpenClaw الملف بالكامل. وتبقى الإخفاقات المحلية الخاصة بـ Plugin واضحة بينما تظل إعدادات المستخدم غير المرتبطة ضمن الإعدادات النشطة.

  </Accordion>
  <Accordion title="الفحص والإصلاح">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="التواقيع الشائعة">
    - وجود `.clobbered.*` ← تمت استعادة تعديل خارجي مباشر أو قراءة عند بدء التشغيل.
    - وجود `.rejected.*` ← فشلت كتابة إعدادات يملكها OpenClaw في اجتياز schema أو فحوصات clobber قبل الاعتماد.
    - `Config write rejected:` ← حاولت الكتابة إسقاط البنية المطلوبة أو تقليص الملف بشدة أو حفظ إعدادات غير صالحة.
    - `missing-meta-vs-last-good` أو `gateway-mode-missing-vs-last-good` أو `size-drop-vs-last-good:*` ← اعتبر بدء التشغيل الملف الحالي معطوبًا لأنه فقد حقولًا أو حجمًا مقارنةً بنسخة النسخ الاحتياطي الأخيرة السليمة المعروفة.
    - `Config last-known-good promotion skipped` ← احتوى المرشح على عناصر نائبة منقحة للأسرار مثل `***`.

  </Accordion>
  <Accordion title="خيارات الإصلاح">
    1. احتفظ بالإعدادات النشطة المستعادة إذا كانت صحيحة.
    2. انسخ فقط المفاتيح المقصودة من `.clobbered.*` أو `.rejected.*`، ثم طبّقها باستخدام `openclaw config set` أو `config.patch`.
    3. شغّل `openclaw config validate` قبل إعادة التشغيل.
    4. إذا كنت تعدّل يدويًا، فاحتفظ بإعدادات JSON5 كاملة، وليس فقط الكائن الجزئي الذي أردت تغييره.
  </Accordion>
</AccordionGroup>

ذو صلة:

- [Config](/ar/cli/config)
- [التهيئة: إعادة التحميل السريع](/ar/gateway/configuration#config-hot-reload)
- [التهيئة: التحقق الصارم](/ar/gateway/configuration#strict-validation)
- [Doctor](/ar/gateway/doctor)

## تحذيرات Gateway probe

استخدم هذا عندما يتمكن `openclaw gateway probe` من الوصول إلى شيء ما، لكنه لا يزال يطبع كتلة تحذير.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

ابحث عن:

- `warnings[].code` و`primaryTargetId` في مخرجات JSON.
- ما إذا كان التحذير يتعلق بـ SSH fallback أو Gateways متعددة أو نطاقات مفقودة أو مراجع مصادقة غير محلولة.

التواقيع الشائعة:

- `SSH tunnel failed to start; falling back to direct probes.` ← فشل إعداد SSH، لكن الأمر ما زال يحاول الأهداف المباشرة المهيأة/أهداف loopback.
- `multiple reachable gateways detected` ← استجاب أكثر من هدف واحد. وعادةً ما يعني هذا إعدادًا مقصودًا متعدد الـ gateway أو مستمعين قدامى/مكررين.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` ← نجح الاتصال، لكن RPC التفصيلية مقيّدة بالنطاق؛ قم باقتران هوية الجهاز أو استخدم بيانات اعتماد تملك `operator.read`.
- `Capability: pairing-pending` أو `gateway closed (1008): pairing required` ← استجابت gateway، لكن هذا العميل لا يزال يحتاج إلى pairing/موافقة قبل الوصول العادي للمشغّل.
- نص تحذير SecretRef غير المحلول لـ `gateway.auth.*` / `gateway.remote.*` ← لم تكن مادة المصادقة متاحة في مسار هذا الأمر للهدف الفاشل.

ذو صلة:

- [Gateway](/ar/cli/gateway)
- [Gateways متعددة على المضيف نفسه](/ar/gateway#multiple-gateways-same-host)
- [الوصول عن بُعد](/ar/gateway/remote)

## القناة متصلة لكن الرسائل لا تتدفق

إذا كانت حالة القناة متصلة لكن تدفق الرسائل متوقف، فركّز على السياسة والأذونات وقواعد التسليم الخاصة بالقناة.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

ابحث عن:

- سياسة DM ‏(`pairing` أو `allowlist` أو `open` أو `disabled`).
- قائمة السماح للمجموعة ومتطلبات الإشارة.
- أذونات/نطاقات API الخاصة بالقناة المفقودة.

التواقيع الشائعة:

- `mention required` ← تم تجاهل الرسالة بواسطة سياسة الإشارة في المجموعة.
- `pairing` / آثار موافقة معلقة ← المرسل غير معتمد.
- `missing_scope` أو `not_in_channel` أو `Forbidden` أو `401/403` ← مشكلة مصادقة/أذونات في القناة.

ذو صلة:

- [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting)
- [Discord](/ar/channels/discord)
- [Telegram](/ar/channels/telegram)
- [WhatsApp](/ar/channels/whatsapp)

## تسليم Cron وHeartbeat

إذا لم تعمل Cron أو Heartbeat أو لم يتم التسليم، فتحقق أولًا من حالة المجدول ثم من هدف التسليم.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

ابحث عن:

- تمكين Cron ووجود وقت الاستيقاظ التالي.
- حالة سجل تشغيل المهمة (`ok` أو `skipped` أو `error`).
- أسباب تخطي Heartbeat ‏(`quiet-hours` أو `requests-in-flight` أو `alerts-disabled` أو `empty-heartbeat-file` أو `no-tasks-due`).

<AccordionGroup>
  <Accordion title="التواقيع الشائعة">
    - `cron: scheduler disabled; jobs will not run automatically` ← تم تعطيل cron.
    - `cron: timer tick failed` ← فشل tick الخاصة بالمجدول؛ تحقق من أخطاء الملفات/السجلات/وقت التشغيل.
    - `heartbeat skipped` مع `reason=quiet-hours` ← خارج نافذة الساعات النشطة.
    - `heartbeat skipped` مع `reason=empty-heartbeat-file` ← الملف `HEARTBEAT.md` موجود لكنه يحتوي فقط على أسطر فارغة / عناوين markdown، لذا يتجاوز OpenClaw استدعاء النموذج.
    - `heartbeat skipped` مع `reason=no-tasks-due` ← يحتوي `HEARTBEAT.md` على كتلة `tasks:`، لكن لا توجد مهام مستحقة في هذه tick.
    - `heartbeat: unknown accountId` ← معرّف حساب غير صالح لهدف تسليم Heartbeat.
    - `heartbeat skipped` مع `reason=dm-blocked` ← تم حل هدف Heartbeat إلى وجهة بنمط الرسائل الخاصة بينما كانت `agents.defaults.heartbeat.directPolicy` (أو التجاوز لكل وكيل) مضبوطة على `block`.

  </Accordion>
</AccordionGroup>

ذو صلة:

- [Heartbeat](/ar/gateway/heartbeat)
- [المهام المجدولة](/ar/automation/cron-jobs)
- [المهام المجدولة: استكشاف الأخطاء وإصلاحها](/ar/automation/cron-jobs#troubleshooting)

## العقدة مقترنة لكن الأداة تفشل

إذا كانت العقدة مقترنة لكن الأدوات تفشل، فاعزل حالة المقدمة والأذونات والموافقة.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

ابحث عن:

- العقدة متصلة ولديها القدرات المتوقعة.
- منح أذونات نظام التشغيل للكاميرا/الميكروفون/الموقع/الشاشة.
- حالة موافقات التنفيذ وقائمة السماح.

التواقيع الشائعة:

- `NODE_BACKGROUND_UNAVAILABLE` ← يجب أن يكون تطبيق العقدة في المقدمة.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` ← أذونات نظام التشغيل مفقودة.
- `SYSTEM_RUN_DENIED: approval required` ← موافقة التنفيذ معلقة.
- `SYSTEM_RUN_DENIED: allowlist miss` ← تم حظر الأمر بواسطة قائمة السماح.

ذو صلة:

- [موافقات التنفيذ](/ar/tools/exec-approvals)
- [استكشاف أخطاء العقد وإصلاحها](/ar/nodes/troubleshooting)
- [العُقد](/ar/nodes/index)

## أداة المتصفح تفشل

استخدم هذا عندما تفشل إجراءات أداة المتصفح رغم أن gateway نفسها سليمة.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

ابحث عن:

- ما إذا كانت `plugins.allow` مضبوطة وتتضمن `browser`.
- مسار صالح للملف التنفيذي للمتصفح.
- قابلية الوصول إلى ملف تعريف CDP.
- توفر Chrome محليًا لملفات التعريف `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="تواقيع Plugin / الملف التنفيذي">
    - `unknown command "browser"` أو `unknown command 'browser'` ← تم استبعاد Plugin المتصفح المضمّنة بواسطة `plugins.allow`.
    - أداة المتصفح مفقودة / غير متاحة بينما `browser.enabled=true` ← يستبعد `plugins.allow` القيمة `browser`، لذلك لم يتم تحميل Plugin مطلقًا.
    - `Failed to start Chrome CDP on port` ← فشل بدء تشغيل عملية المتصفح.
    - `browser.executablePath not found` ← المسار المهيأ غير صالح.
    - `browser.cdpUrl must be http(s) or ws(s)` ← يستخدم عنوان CDP URL المهيأ مخططًا غير مدعوم مثل `file:` أو `ftp:`.
    - `browser.cdpUrl has invalid port` ← يحتوي عنوان CDP URL المهيأ على منفذ سيئ أو خارج النطاق.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` ← يفتقر تثبيت gateway الحالي إلى تبعية runtime الخاصة بـ `playwright-core` في Plugin المتصفح المضمّنة؛ شغّل `openclaw doctor --fix`، ثم أعد تشغيل gateway. ولا تزال لقطات ARIA واللقطات الأساسية للصفحات تعمل، لكن التنقل وAI snapshots ولقطات العناصر بمحددات CSS وتصدير PDF ستظل غير متاحة.

  </Accordion>
  <Accordion title="تواقيع Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` ← تعذر على Chrome MCP existing-session الاتصال بدليل بيانات المتصفح المحدد بعد. افتح صفحة فحص المتصفح، وفعّل remote debugging، وأبقِ المتصفح مفتوحًا، ووافق على أول مطالبة بالاتصال، ثم أعد المحاولة. وإذا لم تكن حالة تسجيل الدخول مطلوبة، ففضّل ملف التعريف المُدار `openclaw`.
    - `No Chrome tabs found for profile="user"` ← لا يحتوي ملف تعريف الاتصال في Chrome MCP على أي علامات تبويب Chrome محلية مفتوحة.
    - `Remote CDP for profile "<name>" is not reachable` ← لا يمكن الوصول إلى نقطة نهاية CDP البعيدة المهيأة من مضيف gateway.
    - `Browser attachOnly is enabled ... not reachable` أو `Browser attachOnly is enabled and CDP websocket ... is not reachable` ← لا يوجد هدف يمكن الوصول إليه لملف التعريف attach-only، أو أن نقطة نهاية HTTP استجابت لكن تعذر مع ذلك فتح CDP WebSocket.

  </Accordion>
  <Accordion title="تواقيع العناصر / اللقطات / الرفع">
    - `fullPage is not supported for element screenshots` ← جمع طلب اللقطة بين `--full-page` و`--ref` أو `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` ← يجب أن تستخدم استدعاءات اللقطات في Chrome MCP / `existing-session` التقاط الصفحة أو `--ref` من snapshot، وليس `--element` بمحدد CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` ← تحتاج hooks الرفع في Chrome MCP إلى مراجع snapshot، وليس إلى محددات CSS.
    - `existing-session file uploads currently support one file at a time.` ← أرسل عملية رفع واحدة لكل استدعاء على ملفات تعريف Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` ← لا تدعم hooks الحوار في ملفات تعريف Chrome MCP تجاوزات timeout.
    - `existing-session type does not support timeoutMs overrides.` ← احذف `timeoutMs` من `act:type` على ملفات تعريف `profile="user"` / Chrome MCP existing-session، أو استخدم ملف تعريف متصفح مُدار/CDP عندما تكون هناك حاجة إلى timeout مخصص.
    - `existing-session evaluate does not support timeoutMs overrides.` ← احذف `timeoutMs` من `act:evaluate` على ملفات تعريف `profile="user"` / Chrome MCP existing-session، أو استخدم ملف تعريف متصفح مُدار/CDP عندما تكون هناك حاجة إلى timeout مخصص.
    - `response body is not supported for existing-session profiles yet.` ← لا يزال `responsebody` يتطلب متصفحًا مُدارًا أو ملف تعريف CDP خامًا.
    - تجاوزات viewport / dark-mode / locale / offline القديمة على ملفات التعريف attach-only أو remote CDP ← شغّل `openclaw browser stop --browser-profile <name>` لإغلاق جلسة التحكم النشطة وتحرير حالة المحاكاة Playwright/CDP من دون إعادة تشغيل gateway بالكامل.

  </Accordion>
</AccordionGroup>

ذو صلة:

- [المتصفح (بإدارة OpenClaw)](/ar/tools/browser)
- [استكشاف أخطاء المتصفح وإصلاحها](/ar/tools/browser-linux-troubleshooting)

## إذا قمت بالترقية وتعطل شيء فجأة

تعود معظم الأعطال بعد الترقية إلى انجراف في الإعدادات أو إلى فرض إعدادات افتراضية أشد الآن.

<AccordionGroup>
  <Accordion title="1. تغيّر سلوك المصادقة وتجاوز عنوان URL">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    ما الذي يجب التحقق منه:

    - إذا كانت `gateway.mode=remote`، فقد تكون استدعاءات CLI تستهدف هدفًا بعيدًا بينما خدمتك المحلية سليمة.
    - لا تعود الاستدعاءات الصريحة التي تستخدم `--url` إلى بيانات الاعتماد المخزنة كقيمة fallback.

    التواقيع الشائعة:

    - `gateway connect failed:` ← هدف URL غير صحيح.
    - `unauthorized` ← يمكن الوصول إلى نقطة النهاية لكن المصادقة خاطئة.

  </Accordion>
  <Accordion title="2. أصبحت حواجز bind والمصادقة أكثر صرامة">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    ما الذي يجب التحقق منه:

    - تحتاج عمليات bind غير التابعة لـ loopback (`lan` و`tailnet` و`custom`) إلى مسار صالح لمصادقة gateway: مصادقة token/password مشتركة، أو نشر `trusted-proxy` غير تابع لـ loopback ومهيأ بشكل صحيح.
    - لا تحل المفاتيح القديمة مثل `gateway.token` محل `gateway.auth.token`.

    التواقيع الشائعة:

    - `refusing to bind gateway ... without auth` ← bind غير تابع لـ loopback من دون مسار صالح لمصادقة gateway.
    - `Connectivity probe: failed` بينما runtime قيد التشغيل ← gateway تعمل لكنها غير قابلة للوصول بالمصادقة/عنوان URL الحاليين.

  </Accordion>
  <Accordion title="3. تغيّرت حالة pairing وهوية الجهاز">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    ما الذي يجب التحقق منه:

    - وجود موافقات أجهزة معلقة لـ dashboard/nodes.
    - وجود موافقات pairing معلقة للرسائل الخاصة بعد تغييرات في السياسة أو الهوية.

    التواقيع الشائعة:

    - `device identity required` ← لم تُستوفَ مصادقة الجهاز.
    - `pairing required` ← يجب اعتماد المرسل/الجهاز.

  </Accordion>
</AccordionGroup>

إذا ظلت إعدادات الخدمة وruntime غير متوافقتين بعد الفحوصات، فأعد تثبيت بيانات الخدمة الوصفية من ملف التعريف/دليل الحالة نفسه:

```bash
openclaw gateway install --force
openclaw gateway restart
```

ذو صلة:

- [المصادقة](/ar/gateway/authentication)
- [التنفيذ في الخلفية وأداة العمليات](/ar/gateway/background-process)
- [الاقتران المملوك لـ Gateway](/ar/gateway/pairing)

## ذو صلة

- [Doctor](/ar/gateway/doctor)
- [الأسئلة الشائعة](/ar/help/faq)
- [دليل تشغيل Gateway](/ar/gateway)
