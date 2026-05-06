---
read_when:
    - تشغيل عملية Gateway أو تصحيح أخطائها
summary: دليل تشغيل خدمة Gateway ودورة حياتها وعملياتها
title: دليل تشغيل Gateway
x-i18n:
    generated_at: "2026-05-06T07:53:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 592eb379cc75402246676cbb23b1dca39b98f559c214c92983b5a3685cff7ab7
    source_path: gateway/index.md
    workflow: 16
---

استخدم هذه الصفحة للتشغيل الأولي في اليوم الأول وعمليات اليوم الثاني لخدمة Gateway.

<CardGroup cols={2}>
  <Card title="استكشاف الأخطاء المتعمق" icon="siren" href="/ar/gateway/troubleshooting">
    تشخيصات تبدأ من الأعراض مع سلالم أوامر دقيقة وبصمات سجلات.
  </Card>
  <Card title="التكوين" icon="sliders" href="/ar/gateway/configuration">
    دليل إعداد موجّه بالمهام + مرجع تكوين كامل.
  </Card>
  <Card title="إدارة الأسرار" icon="key-round" href="/ar/gateway/secrets">
    عقد SecretRef، وسلوك لقطة وقت التشغيل، وعمليات الترحيل/إعادة التحميل.
  </Card>
  <Card title="عقد خطة الأسرار" icon="shield-check" href="/ar/gateway/secrets-plan-contract">
    قواعد هدف/مسار `secrets apply` الدقيقة وسلوك ملف تعريف المصادقة المعتمد على المراجع فقط.
  </Card>
</CardGroup>

## تشغيل محلي خلال 5 دقائق

<Steps>
  <Step title="ابدأ Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="تحقق من صحة الخدمة">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

خط الأساس الصحي: `Runtime: running`، و`Connectivity probe: ok`، و`Capability: ...` بما يطابق ما تتوقعه. استخدم `openclaw gateway status --require-rpc` عندما تحتاج إلى إثبات RPC بنطاق قراءة، لا مجرد إمكانية الوصول.

  </Step>

  <Step title="تحقق من جاهزية القناة">

```bash
openclaw channels status --probe
```

مع Gateway قابل للوصول، يشغّل هذا فحوصات قنوات حية لكل حساب وتدقيقات اختيارية.
إذا كان Gateway غير قابل للوصول، يعود CLI إلى ملخصات قنوات مبنية على التكوين فقط بدلاً
من مخرجات الفحص الحي.

  </Step>
</Steps>

<Note>
تراقب إعادة تحميل تكوين Gateway مسار ملف التكوين النشط (المحلول من افتراضات الملف الشخصي/الحالة، أو `OPENCLAW_CONFIG_PATH` عند ضبطه).
الوضع الافتراضي هو `gateway.reload.mode="hybrid"`.
بعد أول تحميل ناجح، تخدم العملية الجارية لقطة التكوين النشطة في الذاكرة؛ وتستبدل إعادة التحميل الناجحة تلك اللقطة ذرياً.
</Note>

## نموذج وقت التشغيل

- عملية واحدة دائمة التشغيل للتوجيه، ومستوى التحكم، واتصالات القنوات.
- منفذ واحد متعدد الإرسال من أجل:
  - تحكم/RPC عبر WebSocket
  - واجهات HTTP API، متوافقة مع OpenAI (`/v1/models`، `/v1/embeddings`، `/v1/chat/completions`، `/v1/responses`، `/tools/invoke`)
  - واجهة التحكم والخطافات
- وضع الربط الافتراضي: `loopback`.
- المصادقة مطلوبة افتراضياً. تستخدم إعدادات السر المشترك
  `gateway.auth.token` / `gateway.auth.password` (أو
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)، ويمكن لإعدادات الوكيل العكسي غير loopback
  استخدام `gateway.auth.mode: "trusted-proxy"`.

## نقاط النهاية المتوافقة مع OpenAI

أصبح سطح التوافق الأعلى قيمة في OpenClaw الآن:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

لماذا هذه المجموعة مهمة:

- تفحص معظم تكاملات Open WebUI وLobeChat وLibreChat المسار `/v1/models` أولاً.
- تتوقع كثير من مسارات RAG والذاكرة المسار `/v1/embeddings`.
- يفضّل العملاء الأصليون للوكلاء على نحو متزايد المسار `/v1/responses`.

ملاحظة تخطيط:

- `/v1/models` يبدأ من الوكيل: يعيد `openclaw`، و`openclaw/default`، و`openclaw/<agentId>`.
- `openclaw/default` هو الاسم المستعار المستقر الذي يطابق دائماً الوكيل الافتراضي المكوّن.
- استخدم `x-openclaw-model` عندما تريد تجاوز مزود/نموذج الخلفية؛ وإلا يبقى إعداد النموذج والتضمين العادي للوكيل المحدد هو المتحكم.

تعمل كل هذه على منفذ Gateway الرئيسي وتستخدم حد مصادقة المشغّل الموثوق نفسه كبقية HTTP API الخاصة بـ Gateway.

### أسبقية المنفذ والربط

| الإعداد      | ترتيب الحل                                              |
| ------------ | ------------------------------------------------------------- |
| منفذ Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| وضع الربط    | CLI/override → `gateway.bind` → `loopback`                    |

تسجل خدمات Gateway المثبتة قيمة `--port` المحلولة في بيانات المشرف الوصفية. بعد تغيير `gateway.port`، شغّل `openclaw doctor --fix` أو `openclaw gateway install --force` كي يبدأ launchd/systemd/schtasks العملية على المنفذ الجديد.

يستخدم بدء تشغيل Gateway المنفذ والربط الفعّالين نفسيهما عندما يهيئ أصول
واجهة التحكم المحلية لعمليات الربط غير loopback. على سبيل المثال، يهيئ `--bind lan --port 3000`
العنوانين `http://localhost:3000` و`http://127.0.0.1:3000` قبل تشغيل
التحقق في وقت التشغيل. أضف أي أصول متصفح بعيدة، مثل عناوين وكيل HTTPS، إلى
`gateway.controlUi.allowedOrigins` صراحة.

### أوضاع إعادة التحميل الساخن

| `gateway.reload.mode` | السلوك                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | لا توجد إعادة تحميل للتكوين                           |
| `hot`                 | تطبيق التغييرات الآمنة ساخناً فقط                |
| `restart`             | إعادة التشغيل عند التغييرات التي تتطلب إعادة التحميل         |
| `hybrid` (افتراضي)    | التطبيق الساخن عند الأمان، وإعادة التشغيل عند الحاجة |

## مجموعة أوامر المشغّل

```bash
openclaw gateway status
openclaw gateway status --deep   # adds a system-level service scan
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` مخصص لاكتشاف خدمة إضافي (LaunchDaemons/وحدات نظام systemd/schtasks)، وليس فحص صحة RPC أعمق.

## عدة بوابات Gateway (المضيف نفسه)

ينبغي أن تشغّل معظم التثبيتات Gateway واحداً لكل جهاز. يمكن لـ Gateway واحد استضافة عدة
وكلاء وقنوات.

لا تحتاج إلى عدة بوابات Gateway إلا عندما تريد عزلاً عن قصد أو بوت إنقاذ.

فحوصات مفيدة:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

ما ينبغي توقعه:

- يمكن أن يبلغ `gateway status --deep` عن `Other gateway-like services detected (best effort)`
  ويطبع تلميحات تنظيف عندما تظل تثبيتات launchd/systemd/schtasks قديمة موجودة.
- يمكن أن يحذر `gateway probe` من `multiple reachable gateways` عندما يجيب أكثر من هدف واحد.
- إذا كان ذلك مقصوداً، فاعزل المنافذ والتكوين/الحالة وجذور مساحة العمل لكل Gateway.

قائمة تحقق لكل نسخة:

- `gateway.port` فريد
- `OPENCLAW_CONFIG_PATH` فريد
- `OPENCLAW_STATE_DIR` فريد
- `agents.defaults.workspace` فريد

مثال:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

الإعداد المفصل: [/gateway/multiple-gateways](/ar/gateway/multiple-gateways).

## الوصول البعيد

المفضل: Tailscale/VPN.
البديل: نفق SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

ثم صِل العملاء محلياً إلى `ws://127.0.0.1:18789`.

<Warning>
لا تتجاوز أنفاق SSH مصادقة Gateway. بالنسبة لمصادقة السر المشترك، لا يزال على العملاء
إرسال `token`/`password` حتى عبر النفق. وبالنسبة للأوضاع التي تحمل هوية،
لا يزال على الطلب استيفاء مسار المصادقة ذلك.
</Warning>

انظر: [Gateway البعيد](/ar/gateway/remote)، [المصادقة](/ar/gateway/authentication)، [Tailscale](/ar/gateway/tailscale).

## الإشراف ودورة حياة الخدمة

استخدم التشغيل تحت الإشراف للحصول على موثوقية شبيهة بالإنتاج.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

استخدم `openclaw gateway restart` لإعادة التشغيل. لا تسلسل `openclaw gateway stop` و`openclaw gateway start`؛ على macOS، يعطّل `gateway stop` عمداً LaunchAgent قبل إيقافه.

تسميات LaunchAgent هي `ai.openclaw.gateway` (افتراضي) أو `ai.openclaw.<profile>` (ملف شخصي مسمى). يدقق `openclaw doctor` انحرافات تكوين الخدمة ويصلحها.

  </Tab>

  <Tab title="Linux (مستخدم systemd)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

للاستمرارية بعد تسجيل الخروج، فعّل الإبقاء:

```bash
sudo loginctl enable-linger <user>
```

مثال وحدة مستخدم يدوية عندما تحتاج إلى مسار تثبيت مخصص:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (أصلي)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

يستخدم بدء التشغيل المُدار الأصلي على Windows مهمة مجدولة باسم `OpenClaw Gateway`
(أو `OpenClaw Gateway (<profile>)` للملفات الشخصية المسماة). إذا رُفض إنشاء المهمة المجدولة،
يرجع OpenClaw إلى مشغّل في مجلد بدء التشغيل لكل مستخدم
يشير إلى `gateway.cmd` داخل دليل الحالة.

  </Tab>

  <Tab title="Linux (خدمة نظام)">

استخدم وحدة نظام للمضيفين متعددي المستخدمين/دائمي التشغيل.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

استخدم جسم الخدمة نفسه كوحدة المستخدم، لكن ثبّته تحت
`/etc/systemd/system/openclaw-gateway[-<profile>].service` واضبط
`ExecStart=` إذا كان ملف `openclaw` الثنائي لديك موجوداً في مكان آخر.

لا تدع أيضاً `openclaw doctor --fix` يثبت خدمة Gateway على مستوى المستخدم للملف الشخصي/المنفذ نفسه. يرفض Doctor ذلك التثبيت التلقائي عندما يجد خدمة OpenClaw Gateway على مستوى النظام؛ استخدم `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما تملك وحدة النظام دورة الحياة.

  </Tab>
</Tabs>

## مسار سريع للملف الشخصي التطويري

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

تتضمن الافتراضات حالة/تكويناً معزولين ومنفذ Gateway أساسياً `19001`.

## مرجع سريع للبروتوكول (عرض المشغّل)

- يجب أن يكون أول إطار من العميل هو `connect`.
- يعيد Gateway لقطة `hello-ok` (`presence`، `health`، `stateVersion`، `uptimeMs`، الحدود/السياسة).
- `hello-ok.features.methods` / `events` هي قائمة اكتشاف محافظة، وليست
  تفريغاً مولداً لكل مسار مساعد قابل للاستدعاء.
- الطلبات: `req(method, params)` → `res(ok/payload|error)`.
- تشمل الأحداث الشائعة `connect.challenge`، و`agent`، و`chat`،
  و`session.message`، و`session.tool`، و`sessions.changed`، و`presence`، و`tick`،
  و`health`، و`heartbeat`، وأحداث دورة حياة الاقتران/الموافقة، و`shutdown`.

تشغيلات الوكيل ذات مرحلتين:

1. إقرار قبول فوري (`status:"accepted"`)
2. استجابة اكتمال نهائية (`status:"ok"|"error"`)، مع أحداث `agent` متدفقة بينها.

انظر وثائق البروتوكول الكاملة: [بروتوكول Gateway](/ar/gateway/protocol).

## الفحوصات التشغيلية

### الحيوية

- افتح WS وأرسل `connect`.
- توقع استجابة `hello-ok` مع لقطة.

### الجاهزية

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### التعافي من الفجوات

لا تُعاد الأحداث. عند وجود فجوات في التسلسل، حدّث الحالة (`health`، `system-presence`) قبل المتابعة.

## بصمات الفشل الشائعة

| البصمة                                                      | المشكلة المحتملة                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | ربط غير loopback بدون مسار مصادقة Gateway صالح                             |
| `another gateway instance is already listening` / `EADDRINUSE` | تعارض منفذ                                                                   |
| `Gateway start blocked: set gateway.mode=local`                | التكوين مضبوط على الوضع البعيد، أو ختم الوضع المحلي مفقود من تكوين تالف |
| `unauthorized` during connect                                  | عدم تطابق المصادقة بين العميل وGateway                                        |

لسلالم التشخيص الكاملة، استخدم [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting).

## ضمانات السلامة

- يفشل عملاء بروتوكول Gateway سريعًا عندما لا يكون Gateway متاحًا (لا يوجد رجوع احتياطي ضمني إلى القناة المباشرة).
- تُرفض إطارات البداية غير الصالحة/غير الخاصة بالاتصال وتُغلق.
- يؤدي الإيقاف المنظّم إلى إصدار حدث `shutdown` قبل إغلاق المقبس.

---

ذات صلة:

- [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)
- [عملية الخلفية](/ar/gateway/background-process)
- [التكوين](/ar/gateway/configuration)
- [الصحة](/ar/gateway/health)
- [Doctor](/ar/gateway/doctor)
- [المصادقة](/ar/gateway/authentication)

## ذات صلة

- [التكوين](/ar/gateway/configuration)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
- [الوصول عن بُعد](/ar/gateway/remote)
- [إدارة الأسرار](/ar/gateway/secrets)
