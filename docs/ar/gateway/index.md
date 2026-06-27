---
read_when:
    - تشغيل عملية Gateway أو تصحيحها
summary: دليل تشغيل لخدمة Gateway ودورة الحياة والعمليات
title: دليل تشغيل Gateway
x-i18n:
    generated_at: "2026-06-27T17:39:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0bbbcad26df135e1475cbeb14f1299b48bae62be759b2e6c6f82164d175601b
    source_path: gateway/index.md
    workflow: 16
---

استخدم هذه الصفحة لبدء تشغيل اليوم الأول وعمليات اليوم الثاني لخدمة Gateway.

<CardGroup cols={2}>
  <Card title="استكشاف الأخطاء المتعمق" icon="siren" href="/ar/gateway/troubleshooting">
    تشخيصات تبدأ بالأعراض مع تسلسلات أوامر دقيقة وبصمات سجلات.
  </Card>
  <Card title="التكوين" icon="sliders" href="/ar/gateway/configuration">
    دليل إعداد موجه بالمهام + مرجع التكوين الكامل.
  </Card>
  <Card title="إدارة الأسرار" icon="key-round" href="/ar/gateway/secrets">
    عقد SecretRef، وسلوك لقطة وقت التشغيل، وعمليات الترحيل/إعادة التحميل.
  </Card>
  <Card title="عقد خطة الأسرار" icon="shield-check" href="/ar/gateway/secrets-plan-contract">
    قواعد الهدف/المسار الدقيقة لـ `secrets apply` وسلوك ملف تعريف المصادقة القائم على المراجع فقط.
  </Card>
</CardGroup>

## بدء تشغيل محلي خلال 5 دقائق

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

الخط الأساس السليم: `Runtime: running`، و`Connectivity probe: ok`، و`Capability: ...` بما يطابق ما تتوقعه. استخدم `openclaw gateway status --require-rpc` عندما تحتاج إلى إثبات RPC بنطاق قراءة، وليس مجرد قابلية الوصول.

  </Step>

  <Step title="تحقق من جاهزية القناة">

```bash
openclaw channels status --probe
```

مع Gateway قابل للوصول، يشغل هذا فحوصات قنوات مباشرة لكل حساب وتدقيقات اختيارية.
إذا تعذر الوصول إلى Gateway، يعود CLI إلى ملخصات قنوات قائمة على التكوين فقط بدلا
من مخرجات الفحص المباشر.

  </Step>
</Steps>

<Note>
تراقب إعادة تحميل تكوين Gateway مسار ملف التكوين النشط (المحلول من افتراضيات الملف الشخصي/الحالة، أو `OPENCLAW_CONFIG_PATH` عند تعيينه).
الوضع الافتراضي هو `gateway.reload.mode="hybrid"`.
بعد أول تحميل ناجح، تخدم العملية العاملة لقطة التكوين النشطة الموجودة في الذاكرة؛ وتبدل إعادة التحميل الناجحة تلك اللقطة ذريًا.
</Note>

## نموذج وقت التشغيل

- عملية واحدة تعمل دائمًا للتوجيه، ومستوى التحكم، واتصالات القنوات.
- منفذ واحد متعدد الإرسال لـ:
  - تحكم/RPC عبر WebSocket
  - واجهات HTTP API (`/v1/models`، `/v1/embeddings`، `/v1/chat/completions`، `/v1/responses`، `/tools/invoke`)
  - مسارات HTTP الخاصة بـ Plugin، مثل `/api/v1/admin/rpc` الاختياري
  - Control UI والخطافات
- وضع الربط الافتراضي: `loopback`.
- المصادقة مطلوبة افتراضيًا. تستخدم إعدادات السر المشترك
  `gateway.auth.token` / `gateway.auth.password` (أو
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)، ويمكن لإعدادات
  الوكيل العكسي غير القائمة على local loopback استخدام `gateway.auth.mode: "trusted-proxy"`.

## نقاط نهاية متوافقة مع OpenAI

أصبح سطح التوافق الأعلى عائدًا في OpenClaw الآن:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

لماذا تهم هذه المجموعة:

- تفحص معظم تكاملات Open WebUI وLobeChat وLibreChat `/v1/models` أولًا.
- تتوقع العديد من مسارات RAG والذاكرة `/v1/embeddings`.
- تفضل العملاء الأصلية للوكلاء بشكل متزايد `/v1/responses`.

ملاحظة تخطيط:

- `/v1/models` موجه للوكلاء أولًا: يعيد `openclaw` و`openclaw/default` و`openclaw/<agentId>`.
- `openclaw/default` هو الاسم المستعار المستقر الذي يطابق دائمًا الوكيل الافتراضي المكون.
- استخدم `x-openclaw-model` عندما تريد تجاوز موفر/نموذج الخلفية؛ وإلا يبقى النموذج العادي وإعداد التضمين للوكيل المحدد هو المتحكم.

تعمل كل هذه على منفذ Gateway الرئيسي وتستخدم حد مصادقة المشغل الموثوق نفسه كبقية HTTP API الخاصة بـ Gateway.

‏Admin HTTP RPC (`POST /api/v1/admin/rpc`) هو مسار Plugin منفصل ومعطل افتراضيًا لأدوات المضيف التي لا يمكنها استخدام WebSocket RPC. راجع [Admin HTTP RPC](/ar/plugins/admin-http-rpc).

### أسبقية المنفذ والربط

| الإعداد      | ترتيب الحل                                              |
| ------------ | ------------------------------------------------------------- |
| منفذ Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| وضع الربط    | CLI/override → `gateway.bind` → `loopback`                    |

تسجل خدمات Gateway المثبتة قيمة `--port` المحلولة في بيانات المشرف الوصفية. بعد تغيير `gateway.port`، شغل `openclaw doctor --fix` أو `openclaw gateway install --force` حتى يبدأ launchd/systemd/schtasks العملية على المنفذ الجديد.

يستخدم بدء تشغيل Gateway المنفذ والربط الفعالين نفسيهما عندما يهيئ أصول
Control UI المحلية لعمليات الربط غير القائمة على local loopback. على سبيل المثال، يهيئ `--bind lan --port 3000`
كلًا من `http://localhost:3000` و`http://127.0.0.1:3000` قبل تشغيل
تحقق وقت التشغيل. أضف أي أصول متصفحات بعيدة، مثل عناوين URL لوكيل HTTPS، إلى
`gateway.controlUi.allowedOrigins` صراحة.

### أوضاع إعادة التحميل الساخن

| `gateway.reload.mode` | السلوك                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | لا إعادة تحميل للتكوين                           |
| `hot`                 | تطبيق التغييرات الآمنة ساخنًا فقط                |
| `restart`             | إعادة التشغيل عند تغييرات تتطلب إعادة التحميل         |
| `hybrid` (افتراضي)    | تطبيق ساخن عندما يكون آمنًا، وإعادة التشغيل عند الحاجة |

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

`gateway status --deep` مخصص لاكتشاف خدمات إضافي (LaunchDaemons/وحدات نظام systemd/schtasks)، وليس فحص صحة RPC أعمق.

## عدة بوابات Gateway (المضيف نفسه)

ينبغي لمعظم التثبيتات تشغيل Gateway واحد لكل جهاز. يمكن لـ Gateway واحد استضافة عدة
وكلاء وقنوات.

لا تحتاج إلى عدة بوابات Gateway إلا عندما تريد عمدًا عزلًا أو بوت إنقاذ.

فحوصات مفيدة:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

ما المتوقع:

- يمكن أن يبلغ `gateway status --deep` عن `Other gateway-like services detected (best effort)`
  ويطبع تلميحات تنظيف عندما تظل تثبيتات launchd/systemd/schtasks القديمة موجودة.
- يمكن أن يحذر `gateway probe` من `multiple reachable gateway identities` عندما تجيب بوابات Gateway
  مميزة، أو عندما يتعذر على OpenClaw إثبات أن الأهداف القابلة للوصول هي Gateway نفسه.
  يُعد نفق SSH، أو عنوان URL لوكيل، أو عنوان URL بعيد مكون إلى Gateway نفسه بوابة
  Gateway واحدة مع عدة وسائل نقل، حتى عندما تختلف منافذ النقل.
- إذا كان ذلك مقصودًا، فاعزل المنافذ، والتكوين/الحالة، وجذور مساحة العمل لكل Gateway.

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

إعداد مفصل: [/gateway/multiple-gateways](/ar/gateway/multiple-gateways).

## الوصول عن بُعد

المفضل: Tailscale/VPN.
البديل: نفق SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

ثم صِل العملاء محليًا إلى `ws://127.0.0.1:18789`.

<Warning>
لا تتجاوز أنفاق SSH مصادقة Gateway. بالنسبة إلى مصادقة السر المشترك، يظل على العملاء
إرسال `token`/`password` حتى عبر النفق. بالنسبة إلى الأوضاع الحاملة للهوية،
لا يزال على الطلب استيفاء مسار المصادقة ذلك.
</Warning>

راجع: [Gateway البعيد](/ar/gateway/remote)، [المصادقة](/ar/gateway/authentication)، [Tailscale](/ar/gateway/tailscale).

## الإشراف ودورة حياة الخدمة

استخدم التشغيل الخاضع للإشراف للحصول على موثوقية شبيهة بالإنتاج.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

استخدم `openclaw gateway restart` لإعادة التشغيل. لا تسلسل `openclaw gateway stop` و`openclaw gateway start` كبديل لإعادة التشغيل.

على macOS، يستخدم `gateway stop` افتراضيًا `launchctl bootout` — وهذا يزيل LaunchAgent من جلسة الإقلاع الحالية دون استمرار تعطيل، لذلك يستمر استرداد KeepAlive التلقائي في العمل بعد الأعطال غير المتوقعة ويعيد `gateway start` التمكين بنظافة. لمنع إعادة التشغيل التلقائي بشكل دائم عبر عمليات إعادة الإقلاع، مرر `--disable`: `openclaw gateway stop --disable`.

تسميات LaunchAgent هي `ai.openclaw.gateway` (افتراضي) أو `ai.openclaw.<profile>` (ملف شخصي مسمى). يدقق `openclaw doctor` ويصلح انحراف تكوين الخدمة.

  </Tab>

  <Tab title="Linux (مستخدم systemd)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

للاستمرارية بعد تسجيل الخروج، فعّل البقاء:

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
OOMPolicy=continue
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
يعود OpenClaw إلى مشغل في مجلد بدء التشغيل لكل مستخدم
يشير إلى `gateway.cmd` داخل دليل الحالة.

  </Tab>

  <Tab title="Linux (خدمة نظام)">

استخدم وحدة نظام للمضيفين متعددي المستخدمين/دائمي التشغيل.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

استخدم نص الخدمة نفسه كوحدة المستخدم، لكن ثبته ضمن
`/etc/systemd/system/openclaw-gateway[-<profile>].service` وعدّل
`ExecStart=` إذا كان ملف `openclaw` التنفيذي موجودًا في مكان آخر.

لا تسمح أيضًا لـ `openclaw doctor --fix` بتثبيت خدمة Gateway على مستوى المستخدم للملف الشخصي/المنفذ نفسه. يرفض Doctor ذلك التثبيت التلقائي عندما يجد خدمة OpenClaw Gateway على مستوى النظام؛ استخدم `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما تملك وحدة النظام دورة الحياة.

  </Tab>
</Tabs>

## المسار السريع لملف تعريف التطوير

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

تتضمن الافتراضيات حالة/تكوينًا معزولين ومنفذ Gateway أساسيًا `19001`.

## مرجع سريع للبروتوكول (عرض المشغل)

- يجب أن يكون أول إطار عميل `connect`.
- يعيد Gateway لقطة `hello-ok` (`presence`، `health`، `stateVersion`، `uptimeMs`، الحدود/السياسة).
- `hello-ok.features.methods` / `events` هي قائمة اكتشاف محافظة، وليست
  تفريغًا مولدًا لكل مسار مساعد قابل للاستدعاء.
- الطلبات: `req(method, params)` → `res(ok/payload|error)`.
- تتضمن الأحداث الشائعة `connect.challenge`، و`agent`، و`chat`،
  و`session.message`، و`session.operation`، و`session.tool`، و`sessions.changed`،
  و`presence`، و`tick`، و`health`، و`heartbeat`، وأحداث دورة حياة الاقتران/الموافقة،
  و`shutdown`.

تشغيلات الوكيل ذات مرحلتين:

1. إقرار قبول فوري (`status:"accepted"`)
2. استجابة إكمال نهائية (`status:"ok"|"error"`)، مع أحداث `agent` متدفقة بينهما.

راجع مستندات البروتوكول الكاملة: [بروتوكول Gateway](/ar/gateway/protocol).

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

### استرداد الفجوات

لا تُعاد الأحداث. عند وجود فجوات في التسلسل، حدّث الحالة (`health`، `system-presence`) قبل المتابعة.

## بصمات الفشل الشائعة

| التوقيع                                                       | المشكلة المحتملة                                                                  |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | ربط غير local loopback من دون مسار مصادقة Gateway صالح                            |
| `another gateway instance is already listening` / `EADDRINUSE` | تعارض في المنفذ                                                                   |
| `Gateway start blocked: set gateway.mode=local`                | تم ضبط الإعدادات على الوضع البعيد، أو ختم الوضع المحلي مفقود من إعدادات تالفة     |
| `unauthorized` أثناء الاتصال                                  | عدم تطابق المصادقة بين العميل وGateway                                            |

للحصول على مسارات تشخيص كاملة، استخدم [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting).

## ضمانات السلامة

- تفشل عملاء بروتوكول Gateway بسرعة عندما يكون Gateway غير متاح (من دون رجوع ضمني إلى قناة مباشرة).
- تُرفض الإطارات الأولى غير الصالحة أو غير الخاصة بالاتصال وتُغلق.
- يُصدر الإيقاف المنظّم حدث `shutdown` قبل إغلاق المقبس.

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
