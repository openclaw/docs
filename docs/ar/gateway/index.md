---
read_when:
    - تشغيل عملية Gateway أو تصحيح أخطائها
summary: دليل التشغيل لخدمة Gateway، ودورة حياتها، وعملياتها
title: دليل تشغيل Gateway
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:29:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 775c7288ce1fa666f65c0fc4ff1fc06b0cd14589fc932af1944ac7eeb126729c
    source_path: gateway/index.md
    workflow: 15
---

استخدم هذه الصفحة لعمليات اليوم الأول عند بدء التشغيل وعمليات اليوم الثاني لخدمة Gateway.

<CardGroup cols={2}>
  <Card title="استكشاف الأخطاء العميق وإصلاحها" icon="siren" href="/ar/gateway/troubleshooting">
    تشخيصات تبدأ من العرض مع تسلسلات أوامر دقيقة وتواقيع السجلات.
  </Card>
  <Card title="الإعدادات" icon="sliders" href="/ar/gateway/configuration">
    دليل إعداد موجّه بالمهام + مرجع إعدادات كامل.
  </Card>
  <Card title="إدارة الأسرار" icon="key-round" href="/ar/gateway/secrets">
    عقد SecretRef، وسلوك اللقطة في وقت التشغيل، وعمليات الترحيل/إعادة التحميل.
  </Card>
  <Card title="عقد خطة الأسرار" icon="shield-check" href="/ar/gateway/secrets-plan-contract">
    قواعد الهدف/المسار الدقيقة لـ `secrets apply` وسلوك ملفات تعريف المصادقة القائمة على المراجع فقط.
  </Card>
</CardGroup>

## بدء تشغيل محلي خلال 5 دقائق

<Steps>
  <Step title="ابدأ Gateway">

```bash
openclaw gateway --port 18789
# عكس debug/trace إلى stdio
openclaw gateway --port 18789 --verbose
# فرض قتل المستمع على المنفذ المحدد، ثم البدء
openclaw gateway --force
```

  </Step>

  <Step title="تحقّق من سلامة الخدمة">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

الخط الأساسي السليم: `Runtime: running`، و`Connectivity probe: ok`، و`Capability: ...` بما يطابق ما تتوقعه. استخدم `openclaw gateway status --require-rpc` عندما تحتاج إلى إثبات RPC لنطاق القراءة، وليس مجرد إمكانية الوصول.

  </Step>

  <Step title="تحقّق من جاهزية القناة">

```bash
openclaw channels status --probe
```

مع وجود gateway يمكن الوصول إليه، يشغّل هذا probes حية لكل حساب للقنوات وعمليات تدقيق اختيارية.
إذا كان gateway غير قابل للوصول، يعود CLI إلى ملخصات القنوات المستندة إلى الإعدادات فقط بدلًا
من خرج probes الحية.

  </Step>
</Steps>

<Note>
تراقب إعادة تحميل إعدادات Gateway مسار ملف الإعدادات النشط (المحلول من افتراضيات profile/state، أو `OPENCLAW_CONFIG_PATH` عند ضبطه).
الوضع الافتراضي هو `gateway.reload.mode="hybrid"`.
بعد أول تحميل ناجح، تخدم العملية الجارية اللقطة النشطة داخل الذاكرة من الإعدادات؛ وتقوم إعادة التحميل الناجحة بتبديل تلك اللقطة ذريًا.
</Note>

## نموذج وقت التشغيل

- عملية واحدة تعمل دائمًا للتوجيه، ومستوى التحكم، واتصالات القنوات.
- منفذ multiplexed واحد من أجل:
  - التحكم/RPC عبر WebSocket
  - HTTP APIs، المتوافقة مع OpenAI ‏(`/v1/models`، و`/v1/embeddings`، و`/v1/chat/completions`، و`/v1/responses`، و`/tools/invoke`)
  - واجهة التحكم UI والخطافات
- وضع الربط الافتراضي: `loopback`.
- تكون المصادقة مطلوبة افتراضيًا. تستخدم الإعدادات ذات السر المشترك
  `gateway.auth.token` / `gateway.auth.password` (أو
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)، ويمكن
  لإعدادات reverse-proxy غير المعتمدة على loopback استخدام `gateway.auth.mode: "trusted-proxy"`.

## نقاط النهاية المتوافقة مع OpenAI

أصبح سطح التوافق الأعلى قيمة في OpenClaw الآن هو:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

لماذا تهم هذه المجموعة:

- تفحص معظم تكاملات Open WebUI وLobeChat وLibreChat المسار `/v1/models` أولًا.
- تتوقع العديد من خطوط RAG والذاكرة وجود `/v1/embeddings`.
- يفضّل العملاء الأصليون للوكلاء بشكل متزايد `/v1/responses`.

ملاحظة تخطيطية:

- المسار `/v1/models` متمحور حول الوكيل: فهو يعيد `openclaw`، و`openclaw/default`، و`openclaw/<agentId>`.
- يمثّل `openclaw/default` الاسم المستعار الثابت الذي يُطابِق دائمًا الوكيل الافتراضي المهيأ.
- استخدم `x-openclaw-model` عندما تريد تجاوز provider/model في الخلفية؛ وإلا يظل الإعداد المعتاد للـ model وembedding الخاصين بالوكيل المحدد هو المتحكم.

تعمل كل هذه المسارات على منفذ Gateway الرئيسي وتستخدم حد مصادقة المشغّل الموثوق نفسه لبقية Gateway HTTP API.

### أولوية المنفذ والربط

| الإعداد      | ترتيب الحل                                                    |
| ------------ | ------------------------------------------------------------- |
| منفذ Gateway | `--port` ← `OPENCLAW_GATEWAY_PORT` ← `gateway.port` ← `18789` |
| وضع الربط    | CLI/override ← `gateway.bind` ← `loopback`                    |

يستخدم بدء تشغيل Gateway المنفذ والربط الفعالين نفسيهما عندما يهيّئ
مصادر Control UI المحلية لعمليات الربط غير المعتمدة على loopback. على سبيل المثال، `--bind lan --port 3000`
يهيّئ `http://localhost:3000` و`http://127.0.0.1:3000` قبل تشغيل
التحقق في وقت التشغيل. أضف أي مصادر متصفح بعيدة، مثل عناوين URL الخاصة بـ HTTPS proxy، إلى
`gateway.controlUi.allowedOrigins` بشكل صريح.

### أوضاع إعادة التحميل السريع

| `gateway.reload.mode` | السلوك                                     |
| --------------------- | ------------------------------------------ |
| `off`                 | لا توجد إعادة تحميل للإعدادات              |
| `hot`                 | تطبيق التغييرات الآمنة فقط للتحديث السريع  |
| `restart`             | إعادة التشغيل عند تغييرات تتطلب ذلك        |
| `hybrid` (الافتراضي) | تطبيق سريع عند الأمان، وإعادة تشغيل عند اللزوم |

## مجموعة أوامر المشغّل

```bash
openclaw gateway status
openclaw gateway status --deep   # يضيف فحص خدمة على مستوى النظام
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

إن `gateway status --deep` مخصص لاكتشاف الخدمات الإضافية (LaunchDaemons ووحدات systemd system
وschtasks)، وليس فحصًا صحيًا أعمق لـ RPC.

## عدة Gateways ‏(على المضيف نفسه)

ينبغي لمعظم عمليات التثبيت تشغيل gateway واحد لكل جهاز. ويمكن لـ gateway واحد استضافة عدة
وكلاء وقنوات.

لا تحتاج إلى عدة Gateways إلا عندما تريد العزل عمدًا أو روبوت إنقاذ.

فحوصات مفيدة:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

ما الذي ينبغي توقعه:

- يمكن أن يعرض `gateway status --deep` الرسالة `Other gateway-like services detected (best effort)`
  ويطبع تلميحات تنظيف عندما لا تزال تثبيتات launchd/systemd/schtasks القديمة موجودة.
- يمكن أن يحذر `gateway probe` بوجود `multiple reachable gateways` عندما يستجيب أكثر من هدف
  واحد.
- إذا كان ذلك مقصودًا، فعليك عزل المنافذ، والإعدادات/الحالة، وجذور مساحة العمل لكل gateway.

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

## نقطة نهاية الدماغ الفوري VoiceClaw

يوفر OpenClaw نقطة نهاية WebSocket فورية متوافقة مع VoiceClaw على
`/voiceclaw/realtime`. استخدمها عندما يحتاج عميل VoiceClaw المكتبي إلى التحدث
مباشرةً إلى دماغ OpenClaw فوري بدلًا من المرور عبر عملية relay
منفصلة.

تستخدم نقطة النهاية Gemini Live للصوت الفوري وتستدعي OpenClaw بوصفه
الدماغ من خلال كشف أدوات OpenClaw مباشرةً إلى Gemini Live. تعيد استدعاءات الأدوات
نتيجة `working` فورية للحفاظ على استجابة دورة الصوت، ثم ينفذ OpenClaw
الأداة الفعلية بشكل غير متزامن ويحقن النتيجة مرة أخرى في
الجلسة الحية. اضبط `GEMINI_API_KEY` في بيئة عملية gateway. إذا
كانت مصادقة gateway مفعلة، يرسل العميل المكتبي رمز gateway أو كلمة المرور
في أول رسالة `session.config` له.

يُشغِّل الوصول إلى الدماغ الفوري أوامر وكيل OpenClaw المصرح بها من المالك. اجعل
`gateway.auth.mode: "none"` مقتصرًا على مثيلات الاختبار المعتمدة على loopback فقط. تتطلب اتصالات الدماغ الفوري غير المحلية مصادقة gateway.

للحصول على gateway اختبار معزول، شغّل مثيلًا منفصلًا بمنفذه وإعداداته
وحالته الخاصة:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

ثم اضبط VoiceClaw لاستخدام:

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## الوصول البعيد

المفضل: Tailscale/VPN.
البديل: نفق SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

ثم صِل العملاء محليًا إلى `ws://127.0.0.1:18789`.

<Warning>
لا تتجاوز أنفاق SSH مصادقة gateway. في إعدادات السر المشترك، لا يزال يتعين على العملاء
إرسال `token`/`password` حتى عبر النفق. وفي الأوضاع التي تحمل هوية،
لا يزال يجب أن يستوفي الطلب مسار المصادقة ذاك.
</Warning>

راجع: [Remote Gateway](/ar/gateway/remote)، و[المصادقة](/ar/gateway/authentication)، و[Tailscale](/ar/gateway/tailscale).

## الإشراف ودورة حياة الخدمة

استخدم تشغيلات خاضعة للإشراف للحصول على موثوقية شبيهة بالإنتاج.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

استخدم `openclaw gateway restart` لعمليات إعادة التشغيل. ولا تربط بين `openclaw gateway stop` و`openclaw gateway start`; ففي macOS، يقوم `gateway stop` عمدًا بتعطيل LaunchAgent قبل إيقافه.

تكون تسميات LaunchAgent هي `ai.openclaw.gateway` (الافتراضي) أو `ai.openclaw.<profile>` (للملف الشخصي المسمى). يقوم `openclaw doctor` بتدقيق انجراف إعدادات الخدمة وإصلاحه.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

للاستمرار بعد تسجيل الخروج، فعّل lingering:

```bash
sudo loginctl enable-linger <user>
```

مثال على وحدة مستخدم يدوية عندما تحتاج إلى مسار تثبيت مخصص:

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

  <Tab title="Windows (native)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

يستخدم بدء التشغيل المُدار الأصلي في Windows Scheduled Task باسم `OpenClaw Gateway`
(أو `OpenClaw Gateway (<profile>)` للملفات الشخصية المسماة). إذا تم رفض إنشاء Scheduled Task،
فإن OpenClaw يعود إلى مشغّل داخل مجلد Startup لكل مستخدم
يشير إلى `gateway.cmd` داخل دليل الحالة.

  </Tab>

  <Tab title="Linux (system service)">

استخدم وحدة نظام للمضيفات متعددة المستخدمين/العاملة دائمًا.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

استخدم جسم الخدمة نفسه الخاص بوحدة المستخدم، لكن ثبّته تحت
`/etc/systemd/system/openclaw-gateway[-<profile>].service` وعدّل
`ExecStart=` إذا كان ملفك التنفيذي `openclaw` موجودًا في مكان آخر.

  </Tab>
</Tabs>

## المسار السريع لملف التطوير

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

تتضمن القيم الافتراضية حالة/إعدادات معزولة ومنفذ Gateway أساسي `19001`.

## مرجع سريع للبروتوكول (منظور المشغّل)

- يجب أن يكون أول إطار عميل هو `connect`.
- يعيد Gateway لقطة `hello-ok` (`presence`، و`health`، و`stateVersion`، و`uptimeMs`، والحدود/السياسة).
- تمثل `hello-ok.features.methods` / `events` قائمة اكتشاف محافظة، وليست
  تفريغًا مولدًا لكل مسار مساعد قابل للاستدعاء.
- الطلبات: `req(method, params)` ← `res(ok/payload|error)`.
- تشمل الأحداث الشائعة `connect.challenge`، و`agent`، و`chat`،
  و`session.message`، و`session.tool`، و`sessions.changed`، و`presence`، و`tick`،
  و`health`، و`heartbeat`، وأحداث دورة حياة الاقتران/الموافقة، و`shutdown`.

تكون تشغيلات الوكيل على مرحلتين:

1. إقرار قبول فوري (`status:"accepted"`)
2. استجابة إكمال نهائية (`status:"ok"|"error"`)، مع تدفق أحداث `agent` بينهما.

راجع توثيق البروتوكول الكامل: [Gateway Protocol](/ar/gateway/protocol).

## فحوصات تشغيلية

### التوفر

- افتح WS وأرسل `connect`.
- توقّع استجابة `hello-ok` مع لقطة.

### الجاهزية

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### استعادة الفجوات

لا تتم إعادة تشغيل الأحداث. عند وجود فجوات في التسلسل، حدّث الحالة (`health`، و`system-presence`) قبل المتابعة.

## تواقيع الإخفاق الشائعة

| التوقيع                                                       | المشكلة المحتملة                                                                 |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                   | ربط غير معتمد على loopback من دون مسار مصادقة صالح لـ gateway                   |
| `another gateway instance is already listening` / `EADDRINUSE` | تعارض في المنفذ                                                                  |
| `Gateway start blocked: set gateway.mode=local`               | تم ضبط الإعدادات على الوضع البعيد، أو أن ختم الوضع المحلي مفقود من إعدادات تالفة |
| `unauthorized` during connect                                 | عدم تطابق المصادقة بين العميل وgateway                                           |

للحصول على تسلسلات تشخيص كاملة، استخدم [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting).

## ضمانات الأمان

- تفشل عملاء بروتوكول Gateway بسرعة عندما يكون Gateway غير متاح (من دون fallback ضمني مباشر إلى القناة).
- يتم رفض وإغلاق الإطارات الأولى غير الصالحة/التي ليست `connect`.
- يرسل الإيقاف السلس الحدث `shutdown` قبل إغلاق المقبس.

---

ذو صلة:

- [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)
- [العملية الخلفية](/ar/gateway/background-process)
- [الإعدادات](/ar/gateway/configuration)
- [السلامة](/ar/gateway/health)
- [Doctor](/ar/gateway/doctor)
- [المصادقة](/ar/gateway/authentication)

## ذو صلة

- [الإعدادات](/ar/gateway/configuration)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
- [الوصول البعيد](/ar/gateway/remote)
- [إدارة الأسرار](/ar/gateway/secrets)
