---
read_when:
    - تشغيل عملية Gateway أو تصحيح أخطائها
summary: دليل إجراءات التشغيل لخدمة Gateway ودورة حياتها وعملياتها
title: دليل تشغيل Gateway
x-i18n:
    generated_at: "2026-04-30T07:59:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14f3d288c426848bc176291ff084a2b63b00e81739cd02f31fdf517d230d8111
    source_path: gateway/index.md
    workflow: 16
---

استخدم هذه الصفحة لبدء تشغيل خدمة Gateway في اليوم الأول وعمليات اليوم الثاني.

<CardGroup cols={2}>
  <Card title="استكشاف الأخطاء العميق" icon="siren" href="/ar/gateway/troubleshooting">
    تشخيصات تبدأ من الأعراض مع سلالم أوامر دقيقة وبصمات سجلات.
  </Card>
  <Card title="التكوين" icon="sliders" href="/ar/gateway/configuration">
    دليل إعداد موجّه للمهام + مرجع تكوين كامل.
  </Card>
  <Card title="إدارة الأسرار" icon="key-round" href="/ar/gateway/secrets">
    عقد SecretRef، وسلوك لقطة وقت التشغيل، وعمليات الترحيل/إعادة التحميل.
  </Card>
  <Card title="عقد خطة الأسرار" icon="shield-check" href="/ar/gateway/secrets-plan-contract">
    قواعد هدف/مسار `secrets apply` الدقيقة وسلوك ملفات تعريف المصادقة المعتمدة على المراجع فقط.
  </Card>
</CardGroup>

## بدء التشغيل المحلي خلال 5 دقائق

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

الأساس الصحي: `Runtime: running` و`Connectivity probe: ok` و`Capability: ...` بما يطابق ما تتوقعه. استخدم `openclaw gateway status --require-rpc` عندما تحتاج إلى إثبات RPC بنطاق قراءة، وليس مجرد قابلية الوصول.

  </Step>

  <Step title="تحقق من جاهزية القناة">

```bash
openclaw channels status --probe
```

مع Gateway قابل للوصول، يشغّل هذا فحوصات قناة مباشرة لكل حساب وعمليات تدقيق اختيارية.
إذا كان Gateway غير قابل للوصول، يعود CLI إلى ملخصات قنوات من التكوين فقط بدلًا من
مخرجات الفحص المباشر.

  </Step>
</Steps>

<Note>
تراقب إعادة تحميل تكوين Gateway مسار ملف التكوين النشط (المحلول من افتراضيات الملف التعريفي/الحالة، أو `OPENCLAW_CONFIG_PATH` عند تعيينه).
الوضع الافتراضي هو `gateway.reload.mode="hybrid"`.
بعد أول تحميل ناجح، تخدم العملية الجارية لقطة التكوين النشطة داخل الذاكرة؛ وتستبدل إعادة التحميل الناجحة تلك اللقطة ذريًا.
</Note>

## نموذج وقت التشغيل

- عملية واحدة تعمل دائمًا للتوجيه، ومستوى التحكم، واتصالات القنوات.
- منفذ واحد متعدد الإرسال لـ:
  - تحكم/RPC عبر WebSocket
  - واجهات HTTP API متوافقة مع OpenAI (`/v1/models` و`/v1/embeddings` و`/v1/chat/completions` و`/v1/responses` و`/tools/invoke`)
  - واجهة التحكم والخطافات
- وضع الربط الافتراضي: `loopback`.
- المصادقة مطلوبة افتراضيًا. تستخدم إعدادات السر المشترك
  `gateway.auth.token` / `gateway.auth.password` (أو
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)، ويمكن لإعدادات
  الوكيل العكسي غير المرتبطة بـ local loopback استخدام `gateway.auth.mode: "trusted-proxy"`.

## نقاط النهاية المتوافقة مع OpenAI

أصبح سطح التوافق الأعلى قيمة في OpenClaw الآن:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

لماذا تهم هذه المجموعة:

- تفحص معظم تكاملات Open WebUI وLobeChat وLibreChat `/v1/models` أولًا.
- تتوقع كثير من مسارات RAG والذاكرة `/v1/embeddings`.
- يفضّل العملاء الأصليون للوكلاء بشكل متزايد `/v1/responses`.

ملاحظة تخطيط:

- `/v1/models` يبدأ بالوكيل: يعيد `openclaw` و`openclaw/default` و`openclaw/<agentId>`.
- `openclaw/default` هو الاسم المستعار المستقر الذي يشير دائمًا إلى الوكيل الافتراضي المكوّن.
- استخدم `x-openclaw-model` عندما تريد تجاوز مزود/نموذج الواجهة الخلفية؛ وإلا يبقى نموذج الوكيل المحدد العادي وإعداد التضمين الخاص به تحت التحكم.

تعمل كل هذه على منفذ Gateway الرئيسي وتستخدم حد مصادقة المشغل الموثوق نفسه مثل بقية واجهة HTTP API الخاصة بـ Gateway.

### أسبقية المنفذ والربط

| الإعداد      | ترتيب الحل                                              |
| ------------ | ------------------------------------------------------------- |
| منفذ Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| وضع الربط    | CLI/override → `gateway.bind` → `loopback`                    |

تسجل خدمات Gateway المثبتة قيمة `--port` المحلولة في بيانات المشرف الوصفية. بعد تغيير `gateway.port`، شغّل `openclaw doctor --fix` أو `openclaw gateway install --force` حتى يبدأ launchd/systemd/schtasks العملية على المنفذ الجديد.

يستخدم بدء تشغيل Gateway المنفذ والربط الفعّالين نفسيهما عندما يهيئ أصول
واجهة التحكم المحلية للروابط غير المرتبطة بـ local loopback. على سبيل المثال، يهيئ `--bind lan --port 3000`
‏`http://localhost:3000` و`http://127.0.0.1:3000` قبل تشغيل
تحقق وقت التشغيل. أضف أي أصول متصفح بعيدة، مثل عناوين URL لوكيل HTTPS، إلى
`gateway.controlUi.allowedOrigins` صراحةً.

### أوضاع إعادة التحميل الساخنة

| `gateway.reload.mode` | السلوك                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | لا توجد إعادة تحميل للتكوين                           |
| `hot`                 | تطبيق التغييرات الآمنة للتحميل الساخن فقط                |
| `restart`             | إعادة التشغيل عند التغييرات التي تتطلب إعادة تحميل         |
| `hybrid` (افتراضي)    | تطبيق ساخن عند الأمان، وإعادة التشغيل عند الحاجة |

## مجموعة أوامر المشغل

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

## عدة Gateways (على المضيف نفسه)

ينبغي لمعظم عمليات التثبيت تشغيل Gateway واحد لكل جهاز. يمكن لـ Gateway واحد استضافة عدة
وكلاء وقنوات.

لا تحتاج إلى عدة Gateways إلا عندما تريد عزلًا عمدًا أو روبوت إنقاذ.

فحوصات مفيدة:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

ما يمكن توقعه:

- يمكن أن يبلغ `gateway status --deep` عن `Other gateway-like services detected (best effort)`
  ويطبع تلميحات تنظيف عندما تظل تثبيتات launchd/systemd/schtasks القديمة موجودة.
- يمكن أن يحذر `gateway probe` من `multiple reachable gateways` عندما يجيب أكثر من هدف واحد.
- إذا كان ذلك مقصودًا، فاعزل المنافذ والتكوين/الحالة وجذور مساحة العمل لكل Gateway.

قائمة تحقق لكل مثيل:

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

## نقطة نهاية دماغ VoiceClaw في الوقت الحقيقي

يعرض OpenClaw نقطة نهاية WebSocket متوافقة مع VoiceClaw في الوقت الحقيقي على
`/voiceclaw/realtime`. استخدمها عندما ينبغي لعميل VoiceClaw المكتبي التحدث
مباشرةً إلى دماغ OpenClaw في الوقت الحقيقي بدلًا من المرور عبر عملية ترحيل
منفصلة.

تستخدم نقطة النهاية Gemini Live للصوت في الوقت الحقيقي وتستدعي OpenClaw بصفته
الدماغ عبر تعريض أدوات OpenClaw مباشرة إلى Gemini Live. تعيد استدعاءات الأدوات نتيجة
`working` فورية للحفاظ على استجابة دور الصوت، ثم ينفذ OpenClaw
الأداة الفعلية بشكل غير متزامن ويحقن النتيجة مرة أخرى في
الجلسة المباشرة. عيّن `GEMINI_API_KEY` في بيئة عملية Gateway. إذا كانت
مصادقة Gateway مفعلة، يرسل عميل سطح المكتب رمز Gateway أو كلمة المرور
في أول رسالة `session.config`.

يشغّل وصول الدماغ في الوقت الحقيقي أوامر وكيل OpenClaw المصرح بها من المالك. أبقِ
`gateway.auth.mode: "none"` مقتصرًا على مثيلات اختبار local loopback فقط. تتطلب
اتصالات الدماغ في الوقت الحقيقي غير المحلية مصادقة Gateway.

لاختبار Gateway معزول، شغّل مثيلًا منفصلًا بمنفذه وتكوينه
وحالته الخاصة:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

ثم كوّن VoiceClaw لاستخدام:

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## الوصول عن بُعد

المفضل: Tailscale/VPN.
الخيار الاحتياطي: نفق SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

ثم صِل العملاء محليًا بـ `ws://127.0.0.1:18789`.

<Warning>
لا تتجاوز أنفاق SSH مصادقة Gateway. لمصادقة السر المشترك، لا يزال يجب على العملاء
إرسال `token`/`password` حتى عبر النفق. بالنسبة إلى الأوضاع الحاملة للهوية،
لا يزال يجب أن يفي الطلب بمسار المصادقة ذاك.
</Warning>

راجع: [Gateway البعيد](/ar/gateway/remote)، [المصادقة](/ar/gateway/authentication)، [Tailscale](/ar/gateway/tailscale).

## الإشراف ودورة حياة الخدمة

استخدم عمليات تشغيل خاضعة للإشراف للحصول على موثوقية شبيهة بالإنتاج.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

استخدم `openclaw gateway restart` لإعادة التشغيل. لا تسلسل `openclaw gateway stop` و`openclaw gateway start`؛ على macOS، يعطل `gateway stop` عن قصد LaunchAgent قبل إيقافه.

تكون تسميات LaunchAgent هي `ai.openclaw.gateway` (افتراضي) أو `ai.openclaw.<profile>` (ملف تعريفي مسمى). يدقق `openclaw doctor` انحراف تكوين الخدمة ويصلحه.

  </Tab>

  <Tab title="Linux (مستخدم systemd)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

للاستمرار بعد تسجيل الخروج، فعّل lingering:

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
(أو `OpenClaw Gateway (<profile>)` للملفات التعريفية المسماة). إذا رُفض إنشاء
المهمة المجدولة، يعود OpenClaw إلى مشغّل مجلد Startup لكل مستخدم
يشير إلى `gateway.cmd` داخل دليل الحالة.

  </Tab>

  <Tab title="Linux (خدمة نظام)">

استخدم وحدة نظام للمضيفين متعددي المستخدمين/الدائمين.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

استخدم جسم الخدمة نفسه كما في وحدة المستخدم، لكن ثبّتها تحت
`/etc/systemd/system/openclaw-gateway[-<profile>].service` واضبط
`ExecStart=` إذا كان ثنائي `openclaw` لديك موجودًا في مكان آخر.

لا تسمح أيضًا لـ `openclaw doctor --fix` بتثبيت خدمة Gateway على مستوى المستخدم للملف التعريفي/المنفذ نفسه. يرفض Doctor ذلك التثبيت التلقائي عندما يجد خدمة OpenClaw Gateway على مستوى النظام؛ استخدم `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما تملك وحدة النظام دورة الحياة.

  </Tab>
</Tabs>

## المسار السريع لملف التطوير التعريفي

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

تتضمن الافتراضيات حالة/تكوينًا معزولين ومنفذ Gateway أساسيًا `19001`.

## مرجع البروتوكول السريع (منظور المشغل)

- يجب أن يكون إطار العميل الأول `connect`.
- يعيد Gateway لقطة `hello-ok` (`presence` و`health` و`stateVersion` و`uptimeMs` والحدود/السياسة).
- `hello-ok.features.methods` / `events` هي قائمة اكتشاف محافظة، وليست
  تفريغًا مولدًا لكل مسار مساعد قابل للاستدعاء.
- الطلبات: `req(method, params)` → `res(ok/payload|error)`.
- تشمل الأحداث الشائعة `connect.challenge` و`agent` و`chat`
  و`session.message` و`session.tool` و`sessions.changed` و`presence` و`tick`
  و`health` و`heartbeat` وأحداث دورة حياة الاقتران/الموافقة و`shutdown`.

تعمل عمليات الوكيل على مرحلتين:

1. إقرار قبول فوري (`status:"accepted"`)
2. استجابة اكتمال نهائية (`status:"ok"|"error"`)، مع أحداث `agent` المتدفقة بينهما.

راجع وثائق البروتوكول الكاملة: [بروتوكول Gateway](/ar/gateway/protocol).

## الفحوصات التشغيلية

### الحيوية

- افتح اتصال WS وأرسل `connect`.
- توقّع استجابة `hello-ok` مع لقطة حالة.

### الجاهزية

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### استرداد الفجوات

لا تُعاد تشغيل الأحداث. عند حدوث فجوات في التسلسل، حدّث الحالة (`health`، `system-presence`) قبل المتابعة.

## بصمات الفشل الشائعة

| البصمة                                                        | المشكلة المحتملة                                                             |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                   | ربط بواجهة غير loopback دون مسار مصادقة Gateway صالح                         |
| `another gateway instance is already listening` / `EADDRINUSE` | تعارض في المنفذ                                                              |
| `Gateway start blocked: set gateway.mode=local`               | تم ضبط الإعدادات على الوضع البعيد، أو وسم الوضع المحلي مفقود من إعداد تالف |
| `unauthorized` during connect                                 | عدم تطابق المصادقة بين العميل وGateway                                       |

للحصول على سلالم تشخيص كاملة، استخدم [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting).

## ضمانات السلامة

- يفشل عملاء بروتوكول Gateway بسرعة عندما لا يكون Gateway متاحًا (لا يوجد رجوع ضمني إلى قناة مباشرة).
- تُرفض الإطارات الأولى غير الصالحة/غير `connect` وتُغلق.
- يصدر إيقاف التشغيل السلس حدث `shutdown` قبل إغلاق المقبس.

---

ذات صلة:

- [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)
- [عملية الخلفية](/ar/gateway/background-process)
- [الإعدادات](/ar/gateway/configuration)
- [الصحة](/ar/gateway/health)
- [Doctor](/ar/gateway/doctor)
- [المصادقة](/ar/gateway/authentication)

## ذات صلة

- [الإعدادات](/ar/gateway/configuration)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
- [الوصول البعيد](/ar/gateway/remote)
- [إدارة الأسرار](/ar/gateway/secrets)
