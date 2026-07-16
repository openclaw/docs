---
read_when:
    - تشغيل عملية Gateway أو تصحيح أخطائها
summary: دليل تشغيل خدمة Gateway ودورة حياتها وعملياتها
title: دليل تشغيل Gateway
x-i18n:
    generated_at: "2026-07-16T14:18:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d8b50b6041905c321887ea0f579f8d4c3b74552b2b72c37ec655e43a53dfc130
    source_path: gateway/index.md
    workflow: 16
---

استخدم هذه الصفحة لبدء تشغيل خدمة Gateway في اليوم الأول ولعملياتها التشغيلية في اليوم الثاني.

<CardGroup cols={2}>
  <Card title="استكشاف الأخطاء وإصلاحها بعمق" icon="siren" href="/ar/gateway/troubleshooting">
    تشخيصات تبدأ بالأعراض، مع تسلسلات أوامر دقيقة وبصمات للسجلات.
  </Card>
  <Card title="التهيئة" icon="sliders" href="/ar/gateway/configuration">
    دليل إعداد موجّه نحو المهام + مرجع كامل للتهيئة.
  </Card>
  <Card title="إدارة الأسرار" icon="key-round" href="/ar/gateway/secrets">
    عقد SecretRef، وسلوك لقطة وقت التشغيل، وعمليات الترحيل/إعادة التحميل.
  </Card>
  <Card title="عقد خطة الأسرار" icon="shield-check" href="/ar/gateway/secrets-plan-contract">
    قواعد الهدف/المسار الدقيقة لـ `secrets apply` وسلوك ملف تعريف المصادقة المعتمد على المراجع فقط.
  </Card>
</CardGroup>

## بدء التشغيل المحلي خلال 5 دقائق

<Steps>
  <Step title="بدء Gateway">

```bash
openclaw gateway --port 18789
# عكس مخرجات التصحيح/التتبّع إلى الإدخال والإخراج القياسيين
openclaw gateway --port 18789 --verbose
# إنهاء المستمع بالقوة على المنفذ المحدد، ثم بدء التشغيل
openclaw gateway --force
```

  </Step>

  <Step title="التحقق من سلامة الخدمة">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

خط الأساس السليم: `Runtime: running` و`Connectivity probe: ok` وسطر `Capability` يطابق ما تتوقعه. استخدم `openclaw gateway status --require-rpc` لإثبات RPC ضمن نطاق القراءة، وليس لمجرد إثبات إمكانية الوصول.

  </Step>

  <Step title="التحقق من جاهزية القنوات">

```bash
openclaw channels status --probe
```

عندما يكون Gateway قابلًا للوصول، يشغّل هذا فحوصات مباشرة للقنوات لكل حساب وعمليات تدقيق اختيارية. إذا تعذّر الوصول إلى Gateway، تعود CLI إلى ملخصات القنوات المستندة إلى التهيئة فقط.

  </Step>
</Steps>

<Note>
تراقب إعادة تحميل تهيئة Gateway مسار ملف التهيئة النشط (المستخرج من الإعدادات الافتراضية لملف التعريف/الحالة، أو `OPENCLAW_CONFIG_PATH` عند تعيينه). الوضع الافتراضي هو `gateway.reload.mode="hybrid"`. بعد أول تحميل ناجح، تخدم العملية الجارية لقطة التهيئة النشطة في الذاكرة؛ وتستبدل إعادة التحميل الناجحة تلك اللقطة ذريًا.
</Note>

## نموذج وقت التشغيل

- عملية واحدة دائمة التشغيل للتوجيه ومستوى التحكم واتصالات القنوات.
- منفذ واحد متعدد الإرسال من أجل:
  - التحكم/RPC عبر WebSocket
  - واجهات HTTP البرمجية (`/v1/models` و`/v1/embeddings` و`/v1/chat/completions` و`/v1/responses` و`/tools/invoke`)
  - مسارات HTTP الخاصة بالـ Plugin، مثل `/api/v1/admin/rpc` الاختياري
  - واجهة التحكم والخطافات
- وضع الربط الافتراضي: `loopback`. داخل بيئة حاوية مكتشفة، يكون الإعداد الافتراضي الفعلي هو `auto` (يُحل إلى `0.0.0.0` لإعادة توجيه المنافذ)، ما لم يكن عرض/نفق Tailscale نشطًا، إذ يفرض دائمًا `loopback`.
- المصادقة مطلوبة افتراضيًا. تستخدم إعدادات السر المشترك `gateway.auth.token` / `gateway.auth.password` (أو `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) ويمكن لإعدادات الوكيل العكسي غير المرتبطة بعنوان loopback استخدام `gateway.auth.mode: "trusted-proxy"`.

## نقاط نهاية متوافقة مع OpenAI

سطح التوافق الأعلى تأثيرًا في OpenClaw:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

أهمية هذه المجموعة:

- تتحقق معظم تكاملات Open WebUI وLobeChat وLibreChat من `/v1/models` أولًا.
- تتوقع كثير من مسارات RAG والذاكرة وجود `/v1/embeddings`.
- تفضّل العملاء المصممة أصلًا للوكلاء `/v1/responses` بصورة متزايدة.

صُمّم `/v1/models` للوكلاء أولًا: فهو يعيد `openclaw` و`openclaw/default` و`openclaw/<agentId>` لكل وكيل تمت تهيئته. يُعد `openclaw/default` الاسم المستعار الثابت الذي يرتبط دائمًا بالوكيل الافتراضي المهيأ. أرسل `x-openclaw-model` عندما تريد تجاوز موفّر/نموذج الواجهة الخلفية؛ وإلا يبقى النموذج العادي وإعداد التضمين للوكيل المحدد هما المتحكّمين.

تعمل جميع هذه العناصر على منفذ Gateway الرئيسي وتستخدم حد مصادقة المشغّل الموثوق نفسه الذي تستخدمه بقية واجهة HTTP البرمجية لـ Gateway.

يُعد RPC الإداري عبر HTTP ‏(`POST /api/v1/admin/rpc`) مسار Plugin منفصلًا ومعطّلًا افتراضيًا لأدوات المضيف التي لا يمكنها استخدام RPC عبر WebSocket. راجع [RPC الإداري عبر HTTP](/ar/plugins/admin-http-rpc).

### أسبقية المنفذ والربط

| الإعداد      | ترتيب الحل                                                     |
| ------------ | -------------------------------------------------------------------- |
| منفذ Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789`        |
| وضع الربط    | CLI/التجاوز → `gateway.bind` → `loopback` (أو `auto` في الحاويات) |

تسجّل خدمات Gateway المثبّتة قيمة `--port` التي تم حلها ضمن بيانات المشرف الوصفية. بعد تغيير `gateway.port`، شغّل `openclaw doctor --fix` أو `openclaw gateway install --force` كي تبدأ launchd/systemd/schtasks العملية على المنفذ الجديد.

يستخدم بدء تشغيل Gateway المنفذ الفعلي والربط نفسيهما عند تهيئة أصول واجهة التحكم المحلية لعمليات الربط غير المرتبطة بعنوان loopback. على سبيل المثال، يهيّئ `--bind lan --port 3000` القيمتين `http://localhost:3000` و`http://127.0.0.1:3000` قبل تشغيل التحقق في وقت التشغيل. أضف صراحةً أي أصول لمتصفحات بعيدة، مثل عناوين URL لوكيل HTTPS، إلى `gateway.controlUi.allowedOrigins`.

### أوضاع إعادة التحميل الفوري

| `gateway.reload.mode` | السلوك                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | عدم إعادة تحميل التهيئة                           |
| `hot`                 | تطبيق التغييرات الآمنة فوريًا فقط                |
| `restart`             | إعادة التشغيل عند التغييرات التي تتطلب إعادة التحميل         |
| `hybrid` (افتراضي)    | التطبيق الفوري عندما يكون آمنًا، وإعادة التشغيل عند الحاجة |

## مجموعة أوامر المشغّل

```bash
openclaw gateway status
openclaw gateway status --deep   # يضيف فحصًا للخدمة على مستوى النظام
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

يُستخدم `gateway status --deep` لاكتشاف خدمات إضافية (LaunchDaemons/وحدات نظام systemd/schtasks)، وليس لإجراء فحص سلامة RPC أعمق.

## بوابات Gateway متعددة (على المضيف نفسه)

ينبغي لمعظم عمليات التثبيت تشغيل Gateway واحد لكل جهاز. يمكن لـ Gateway واحد استضافة عدة وكلاء وقنوات. لا تحتاج إلى عدة بوابات Gateway إلا عندما تريد عمدًا العزل أو روبوت إنقاذ.

فحوصات مفيدة:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

ما يمكن توقعه:

- يمكن لـ `gateway status --deep` الإبلاغ عن `Other gateway-like services detected (best effort)` وطباعة تلميحات التنظيف عندما تظل عمليات تثبيت launchd/systemd/schtasks القديمة موجودة.
- يمكن لـ `gateway probe` التحذير من `multiple reachable gateway identities` عندما تستجيب بوابات Gateway مختلفة، أو عندما يتعذر على OpenClaw إثبات أن الأهداف القابلة للوصول هي Gateway نفسه. يُعد نفق SSH أو عنوان URL لوكيل أو عنوان URL بعيد مهيأ إلى Gateway نفسه بوابة Gateway واحدة ذات وسائل نقل متعددة، حتى عندما تختلف منافذ النقل.
- إذا كان ذلك مقصودًا، فاعزل المنافذ والتهيئة/الحالة وجذور مساحات العمل لكل Gateway.

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

الإعداد التفصيلي: [/gateway/multiple-gateways](/ar/gateway/multiple-gateways).

## الوصول عن بُعد

المفضّل: Tailscale/VPN.
الخيار الاحتياطي: نفق SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

ثم صِل العملاء محليًا بـ `ws://127.0.0.1:18789`.

<Warning>
لا تتجاوز أنفاق SSH مصادقة Gateway. بالنسبة إلى مصادقة السر المشترك، يجب على العملاء
مع ذلك إرسال `token`/`password` حتى عبر النفق. أما في الأوضاع الحاملة للهوية،
فيظل على الطلب استيفاء مسار المصادقة ذاك.
</Warning>

راجع: [Gateway البعيد](/ar/gateway/remote)، و[المصادقة](/ar/gateway/authentication)، و[Tailscale](/ar/gateway/tailscale).

## الإشراف ودورة حياة الخدمة

استخدم عمليات التشغيل الخاضعة للإشراف لتحقيق موثوقية شبيهة ببيئة الإنتاج.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

استخدم `openclaw gateway restart` لعمليات إعادة التشغيل. لا تسلسل `openclaw gateway stop` و`openclaw gateway start` باعتبارهما بديلًا لإعادة التشغيل.

على macOS، يستخدم `gateway stop` القيمة `launchctl bootout` افتراضيًا. يؤدي ذلك إلى إزالة LaunchAgent من جلسة الإقلاع الحالية دون حفظ حالة التعطيل، بحيث يظل الاسترداد التلقائي عبر KeepAlive يعمل بعد الأعطال غير المتوقعة، ويعيد `gateway start` التمكين بصورة سليمة. لمنع إعادة التشغيل التلقائي بصورة دائمة عبر عمليات إعادة الإقلاع، مرّر `--disable`: ‏`openclaw gateway stop --disable`.

تكون تسميات LaunchAgent هي `ai.openclaw.gateway` (افتراضي) أو `ai.openclaw.<profile>` (ملف تعريف مسمّى). يدقّق `openclaw doctor` انحراف تهيئة الخدمة ويصلحه.

  </Tab>

  <Tab title="Linux (systemd للمستخدم)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

للاستمرارية بعد تسجيل الخروج، فعّل البقاء:

```bash
sudo loginctl enable-linger $(whoami)
```

على خادم بلا واجهة رسومية ومن دون جلسة سطح مكتب، تأكد أيضًا من تعيين `XDG_RUNTIME_DIR` إلى (`export XDG_RUNTIME_DIR=/run/user/$(id -u)`) قبل إعادة محاولة أوامر `systemctl --user`.

مثال يدوي لوحدة مستخدم عندما تحتاج إلى مسار تثبيت مخصص:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
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

يستخدم بدء التشغيل المُدار الأصلي في Windows مهمة مجدولة باسم `OpenClaw Gateway`
(أو `OpenClaw Gateway (<profile>)` لملفات التعريف المسماة). إذا رُفض إنشاء المهمة المجدولة،
يعود OpenClaw إلى مشغّل في مجلد بدء التشغيل لكل مستخدم
يشير إلى `gateway.cmd` داخل دليل الحالة.

  </Tab>

  <Tab title="Linux (خدمة النظام)">

استخدم وحدة نظام للمضيفين متعددي المستخدمين/دائمي التشغيل.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

استخدم نص الخدمة نفسه المستخدم لوحدة المستخدم، ولكن ثبّته ضمن
`/etc/systemd/system/openclaw-gateway[-<profile>].service` وعدّل
`ExecStart=` إذا كان ملف `openclaw` التنفيذي موجودًا في مكان آخر.

لا تسمح أيضًا لـ `openclaw doctor --fix` بتثبيت خدمة Gateway على مستوى المستخدم لملف التعريف/المنفذ نفسه. يرفض Doctor ذلك التثبيت التلقائي عندما يعثر على خدمة Gateway لـ OpenClaw على مستوى النظام؛ استخدم `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما تكون وحدة النظام هي المالكة لدورة الحياة.

  </Tab>
</Tabs>

تنتهي أخطاء التهيئة غير الصالحة بالرمز `78`. تستخدم وحدات systemd في Linux القيمة `RestartPreventExitStatus=78` لإيقاف إعادة التشغيل حتى إصلاح التهيئة. لا تتضمن launchd وWindows Task Scheduler قاعدة مكافئة للإيقاف بحسب رمز الخروج، لذلك يحتفظ Gateway أيضًا بسجل عمليات الإقلاع السريعة غير النظيفة ويمنع البدء التلقائي لحسابات القنوات/الموفّرين بعد تكرار إخفاقات بدء التشغيل. في ذلك الوضع الآمن، يظل مستوى التحكم قيد التشغيل للفحص والإصلاح، وترفض عمليات إعادة تحميل التهيئة الفورية و`secrets.reload` عمليات إعادة تشغيل القنوات تلقائيًا، ويمكن لطلب صريح من المشغّل عبر `channels.start` تجاوز المنع.

## مسار سريع لملف تعريف التطوير

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

تتضمن الإعدادات الافتراضية حالة/تهيئة معزولتين ومنفذ Gateway أساسيًا بقيمة `19001`.

## مرجع سريع للبروتوكول (منظور المشغّل)

- يجب أن يكون إطار العميل الأول هو `connect`.
- يعيد Gateway إطار `hello-ok` يتضمن `snapshot` ‏(`presence`، `health`، `stateVersion`، `uptimeMs`) بالإضافة إلى حدود `policy` ‏(`maxPayload`، `maxBufferedBytes`، `tickIntervalMs`).
- يمثل `hello-ok.features.methods` / `events` قائمة استكشاف متحفظة، وليس
  تفريغًا مولّدًا لكل مسار مساعد قابل للاستدعاء.
- الطلبات: `req(method, params)` → `res(ok/payload|error)`.
- تشمل الأحداث الشائعة `connect.challenge`، و`agent`، و`chat`،
  و`session.message`، و`session.operation`، و`session.tool`، والأحداث الاختيارية
  `session.approval`، و`sessions.changed`، و`presence`، و`tick`، و`health`،
  و`heartbeat`، وأحداث دورة حياة الاقتران/الموافقة، و`shutdown`.

تُنفَّذ عمليات الوكيل على مرحلتين:

1. إقرار فوري بالقبول (`status:"accepted"`)
2. استجابة الإكمال النهائية (`status:"ok"|"error"`)، مع بث أحداث `agent` بينهما.

راجع وثائق البروتوكول الكاملة: [بروتوكول Gateway](/ar/gateway/protocol).

## فحوص التشغيل

### التحقق من بقاء الخدمة

- افتح اتصال WS وأرسل `connect`.
- توقّع استجابة `hello-ok` تتضمن لقطة للحالة.

### التحقق من الجاهزية

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### الاسترداد من الفجوات

لا تُعاد أحداث البث. عند وجود فجوات في التسلسل، حدّث الحالة (`health`، `system-presence`) قبل المتابعة.

## مؤشرات الأعطال الشائعة

| المؤشر                                                        | المشكلة المحتملة                                                                  |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | الربط بعنوان غير استرجاعي من دون مسار مصادقة صالح لـ Gateway                           |
| `another gateway instance is already listening` / `EADDRINUSE` | تعارض في المنفذ                                                                 |
| `Gateway start blocked: set gateway.mode=local`                | تم ضبط الإعدادات على الوضع البعيد، أو أن `gateway.mode` مفقود من إعدادات تالفة |
| `unauthorized` أثناء الاتصال                                  | عدم تطابق المصادقة بين العميل وGateway                                      |

للاطلاع على مسارات التشخيص الكاملة، استخدم [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting).

## ضمانات السلامة

- تفشل عملاء بروتوكول Gateway فورًا عند عدم توفر Gateway (من دون رجوع ضمني إلى قناة مباشرة).
- تُرفض الإطارات الأولى غير الصالحة أو التي لا تمثل اتصالًا، ويُغلق الاتصال.
- يرسل الإيقاف الآمن حدث `shutdown` قبل إغلاق المقبس.

## ذو صلة

- [الإعدادات](/ar/gateway/configuration)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
- [العملية الخلفية](/ar/gateway/background-process)
- [الصحة](/ar/gateway/health)
- [Doctor](/ar/gateway/doctor)
- [المصادقة](/ar/gateway/authentication)
- [الوصول عن بُعد](/ar/gateway/remote)
- [إدارة الأسرار](/ar/gateway/secrets)
