---
read_when:
    - تشغيل عملية Gateway أو تصحيح أخطائها
summary: دليل التشغيل لخدمة Gateway ودورة حياتها وعملياتها
title: دليل تشغيل Gateway
x-i18n:
    generated_at: "2026-04-20T07:29:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1004cdd43b1db6794f3ca83da38dbdb231a1976329d9d6d851e2b02405278d8
    source_path: gateway/index.md
    workflow: 15
---

# دليل تشغيل Gateway

استخدم هذه الصفحة لبدء التشغيل في اليوم الأول وعمليات خدمة Gateway في اليوم الثاني.

<CardGroup cols={2}>
  <Card title="استكشاف الأخطاء وإصلاحها المتقدم" icon="siren" href="/ar/gateway/troubleshooting">
    تشخيص يبدأ من الأعراض مع تسلسلات أوامر دقيقة وتواقيع السجلات.
  </Card>
  <Card title="الإعداد" icon="sliders" href="/ar/gateway/configuration">
    دليل إعداد موجّه حسب المهام + مرجع إعداد كامل.
  </Card>
  <Card title="إدارة الأسرار" icon="key-round" href="/ar/gateway/secrets">
    عقد SecretRef، وسلوك اللقطة وقت التشغيل، وعمليات الترحيل/إعادة التحميل.
  </Card>
  <Card title="عقد خطة الأسرار" icon="shield-check" href="/ar/gateway/secrets-plan-contract">
    قواعد الهدف/المسار الدقيقة لـ `secrets apply` وسلوك ملف تعريف المصادقة المعتمد على المراجع فقط.
  </Card>
</CardGroup>

## بدء تشغيل محلي خلال 5 دقائق

<Steps>
  <Step title="ابدأ Gateway">

```bash
openclaw gateway --port 18789
# ينعكس debug/trace إلى stdio
openclaw gateway --port 18789 --verbose
# اقتل بالقوة المستمع على المنفذ المحدد، ثم ابدأ
openclaw gateway --force
```

  </Step>

  <Step title="تحقق من سلامة الخدمة">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

خط الأساس السليم: `Runtime: running` و`Connectivity probe: ok` و`Capability: ...` المطابقة لما تتوقعه. استخدم `openclaw gateway status --require-rpc` عندما تحتاج إلى إثبات RPC بنطاق القراءة، وليس مجرد إمكانية الوصول.

  </Step>

  <Step title="تحقق من جاهزية القناة">

```bash
openclaw channels status --probe
```

مع Gateway يمكن الوصول إليه، يشغّل هذا فحوصات قنوات مباشرة لكل حساب وتدقيقات اختيارية.
إذا تعذر الوصول إلى Gateway، يعود CLI إلى ملخصات القنوات المعتمدة على الإعداد فقط
بدلًا من مخرجات الفحص المباشر.

  </Step>
</Steps>

<Note>
تراقب إعادة تحميل إعداد Gateway مسار ملف الإعداد النشط (يُحل من الإعدادات الافتراضية للملف الشخصي/الحالة، أو `OPENCLAW_CONFIG_PATH` عند تعيينه).
الوضع الافتراضي هو `gateway.reload.mode="hybrid"`.
بعد أول تحميل ناجح، تخدم العملية الجارية لقطة الإعداد النشطة داخل الذاكرة؛ وتبدّل إعادة التحميل الناجحة تلك اللقطة بشكل ذري.
</Note>

## نموذج وقت التشغيل

- عملية واحدة تعمل دائمًا للتوجيه ومستوى التحكم واتصالات القنوات.
- منفذ واحد متعدد الإرسال من أجل:
  - WebSocket للتحكم/RPC
  - واجهات HTTP البرمجية، متوافقة مع OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - واجهة التحكم وHooks
- وضع الربط الافتراضي: `loopback`.
- تكون المصادقة مطلوبة افتراضيًا. تستخدم إعدادات السر المشترك
  `gateway.auth.token` / `gateway.auth.password` (أو
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)، ويمكن لإعدادات
  الوكيل العكسي غير المعتمدة على loopback استخدام `gateway.auth.mode: "trusted-proxy"`.

## نقاط النهاية المتوافقة مع OpenAI

أصبحت أعلى واجهات التوافق ذات الأثر الأكبر في OpenClaw الآن:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

لماذا تهم هذه المجموعة:

- تتحقق معظم تكاملات Open WebUI وLobeChat وLibreChat من `/v1/models` أولًا.
- تتوقع كثير من مسارات RAG والذاكرة `/v1/embeddings`.
- يفضل العملاء الأصليون للوكلاء بشكل متزايد `/v1/responses`.

ملاحظة تخطيطية:

- `/v1/models` موجه للوكلاء أولًا: فهو يعيد `openclaw` و`openclaw/default` و`openclaw/<agentId>`.
- `openclaw/default` هو الاسم المستعار المستقر الذي يرتبط دائمًا بالوكيل الافتراضي المضبوط.
- استخدم `x-openclaw-model` عندما تريد تجاوزًا لمزوّد/نموذج الواجهة الخلفية؛ وإلا فسيظل إعداد النموذج والتضمين العادي للوكيل المحدد هو المتحكم.

كل هذه تعمل على منفذ Gateway الرئيسي وتستخدم نفس حد مصادقة المشغل الموثوق مثل بقية واجهة Gateway HTTP البرمجية.

### أسبقية المنفذ والربط

| الإعداد | ترتيب الحل |
| ------- | ----------- |
| منفذ Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| وضع الربط | CLI/override → `gateway.bind` → `loopback` |

### أوضاع إعادة التحميل السريع

| `gateway.reload.mode` | السلوك |
| --------------------- | ------ |
| `off`                 | لا توجد إعادة تحميل للإعداد |
| `hot`                 | طبّق فقط التغييرات الآمنة للإعادة السريعة |
| `restart`             | أعد التشغيل عند التغييرات التي تتطلب إعادة تحميل |
| `hybrid` (افتراضي)    | تطبيق سريع عند الأمان، وإعادة تشغيل عند الحاجة |

## مجموعة أوامر المشغل

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

إن `gateway status --deep` مخصص لاكتشاف الخدمات الإضافية (وحدات
LaunchDaemons/systemd system/schtasks)، وليس لفحص سلامة RPC أعمق.

## عدة Gateways (على نفس المضيف)

ينبغي أن تشغّل معظم عمليات التثبيت Gateway واحدة لكل جهاز. ويمكن لـ Gateway واحدة استضافة عدة
وكلاء وقنوات.

أنت تحتاج إلى عدة Gateways فقط عندما تريد العزل عمدًا أو bot إنقاذ.

فحوصات مفيدة:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

ما الذي يمكن توقعه:

- قد يعرض `gateway status --deep` الرسالة `Other gateway-like services detected (best effort)`
  ويطبع تلميحات تنظيف عندما تظل تثبيتات launchd/systemd/schtasks القديمة موجودة.
- قد يحذر `gateway probe` من `multiple reachable gateways` عندما يستجيب أكثر من هدف
  واحد.
- إذا كان ذلك مقصودًا، فاعزل المنافذ والإعداد والحالة وجذور مساحة العمل لكل Gateway.

الإعداد التفصيلي: [/gateway/multiple-gateways](/ar/gateway/multiple-gateways).

## الوصول عن بُعد

المفضل: Tailscale/VPN.
البديل: نفق SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

ثم صِل العملاء محليًا إلى `ws://127.0.0.1:18789`.

<Warning>
لا تتجاوز أنفاق SSH مصادقة Gateway. بالنسبة إلى مصادقة السر المشترك، ما يزال على العملاء
إرسال `token`/`password` حتى عبر النفق. أما في الأوضاع المعتمدة على الهوية،
فما يزال على الطلب استيفاء مسار المصادقة ذلك.
</Warning>

راجع: [Gateway عن بُعد](/ar/gateway/remote)، [المصادقة](/ar/gateway/authentication)، [Tailscale](/ar/gateway/tailscale).

## الإشراف ودورة حياة الخدمة

استخدم التشغيل الخاضع للإشراف للحصول على موثوقية أقرب إلى الإنتاج.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

تسميات LaunchAgent هي `ai.openclaw.gateway` (الافتراضي) أو `ai.openclaw.<profile>` (ملف شخصي مسمّى). يقوم `openclaw doctor` بتدقيق انجراف إعداد الخدمة وإصلاحه.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

للاستمرارية بعد تسجيل الخروج، فعّل lingering:

```bash
sudo loginctl enable-linger <user>
```

مثال لوحدة مستخدم يدوية عندما تحتاج إلى مسار تثبيت مخصص:

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

يستخدم بدء التشغيل المُدار الأصلي في Windows مهمة مجدولة باسم `OpenClaw Gateway`
(أو `OpenClaw Gateway (<profile>)` للملفات الشخصية المسماة). إذا تم رفض إنشاء
المهمة المجدولة، يعود OpenClaw إلى مُشغّل داخل مجلد Startup خاص بالمستخدم
يشير إلى `gateway.cmd` داخل دليل الحالة.

  </Tab>

  <Tab title="Linux (system service)">

استخدم وحدة نظام للمضيفات متعددة المستخدمين/العاملة دائمًا.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

استخدم نفس جسم الخدمة مثل وحدة المستخدم، ولكن ثبّته تحت
`/etc/systemd/system/openclaw-gateway[-<profile>].service` واضبط
`ExecStart=` إذا كان الملف التنفيذي `openclaw` لديك موجودًا في مكان آخر.

  </Tab>
</Tabs>

## عدة Gateways على مضيف واحد

ينبغي أن تشغّل معظم الإعدادات **Gateway واحدة**.
استخدم عدة Gateways فقط للعزل/التكرار الصارم (مثل ملف شخصي للإنقاذ).

قائمة التحقق لكل مثيل:

- `gateway.port` فريد
- `OPENCLAW_CONFIG_PATH` فريد
- `OPENCLAW_STATE_DIR` فريد
- `agents.defaults.workspace` فريد

مثال:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

راجع: [عدة Gateways](/ar/gateway/multiple-gateways).

### المسار السريع لملف dev الشخصي

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

تتضمن الإعدادات الافتراضية حالة/إعدادًا معزولين ومنفذ Gateway أساسي `19001`.

## مرجع سريع للبروتوكول (منظور المشغل)

- يجب أن يكون أول إطار من العميل هو `connect`.
- يعيد Gateway لقطة `hello-ok` (`presence` و`health` و`stateVersion` و`uptimeMs` والحدود/السياسة).
- إن `hello-ok.features.methods` / `events` هي قائمة اكتشاف محافظة، وليست
  تفريغًا مولدًا لكل مسار مساعد قابل للاستدعاء.
- الطلبات: `req(method, params)` → `res(ok/payload|error)`.
- تتضمن الأحداث الشائعة `connect.challenge` و`agent` و`chat`،
  و`session.message` و`session.tool` و`sessions.changed` و`presence` و`tick`،
  و`health` و`heartbeat`، وأحداث دورة حياة الاقتران/الموافقة، و`shutdown`.

تعمل تشغيلات الوكيل على مرحلتين:

1. إشعار قبول فوري (`status:"accepted"`)
2. استجابة إكمال نهائية (`status:"ok"|"error"`)، مع تدفق أحداث `agent` بينهما.

راجع مستندات البروتوكول الكاملة: [بروتوكول Gateway](/ar/gateway/protocol).

## الفحوصات التشغيلية

### الحيوية

- افتح WS وأرسل `connect`.
- توقّع استجابة `hello-ok` مع لقطة.

### الجاهزية

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### استرداد الفجوات

لا تُعاد الأحداث. عند وجود فجوات في التسلسل، حدّث الحالة (`health`, `system-presence`) قبل المتابعة.

## تواقيع الأعطال الشائعة

| التوقيع | المشكلة المحتملة |
| ------- | ---------------- |
| `refusing to bind gateway ... without auth` | ربط غير loopback من دون مسار مصادقة صالح لـ Gateway |
| `another gateway instance is already listening` / `EADDRINUSE` | تعارض منفذ |
| `Gateway start blocked: set gateway.mode=local` | الإعداد مضبوط على الوضع البعيد، أو أن ختم الوضع المحلي مفقود من إعداد تالف |
| `unauthorized` during connect | عدم تطابق المصادقة بين العميل وGateway |

للحصول على تسلسلات تشخيص كاملة، استخدم [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting).

## ضمانات الأمان

- يفشل عملاء بروتوكول Gateway بسرعة عند عدم توفر Gateway (من دون أي رجوع ضمني إلى قناة مباشرة).
- تُرفض الإطارات الأولى غير الصالحة/غير `connect` ويُغلق الاتصال.
- يصدر الإيقاف السلس الحدث `shutdown` قبل إغلاق المقبس.

---

ذو صلة:

- [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)
- [العملية الخلفية](/ar/gateway/background-process)
- [الإعداد](/ar/gateway/configuration)
- [الصحة](/ar/gateway/health)
- [Doctor](/ar/gateway/doctor)
- [المصادقة](/ar/gateway/authentication)
