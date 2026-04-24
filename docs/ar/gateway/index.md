---
read_when:
    - تشغيل عملية gateway أو تصحيح أخطائها
summary: دليل تشغيل خدمة Gateway ودورة حياتها وعملياتها
title: دليل تشغيل Gateway
x-i18n:
    generated_at: "2026-04-24T07:41:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6192a38447424b7e9437a7420f37d08fc38d27b736ce8c30347e6d52e3430600
    source_path: gateway/index.md
    workflow: 15
---

استخدم هذه الصفحة لبدء التشغيل في اليوم الأول وعمليات اليوم الثاني لخدمة Gateway.

<CardGroup cols={2}>
  <Card title="استكشاف الأخطاء المتقدم" icon="siren" href="/ar/gateway/troubleshooting">
    تشخيصات تبدأ من الأعراض مع تسلسلات أوامر دقيقة وتواقيع سجلات.
  </Card>
  <Card title="الإعداد" icon="sliders" href="/ar/gateway/configuration">
    دليل إعداد موجه حسب المهام + مرجع إعداد كامل.
  </Card>
  <Card title="إدارة الأسرار" icon="key-round" href="/ar/gateway/secrets">
    عقد SecretRef، وسلوك اللقطة أثناء وقت التشغيل، وعمليات migrate/reload.
  </Card>
  <Card title="عقد خطة الأسرار" icon="shield-check" href="/ar/gateway/secrets-plan-contract">
    قواعد `secrets apply` الدقيقة الخاصة بالهدف/المسار وسلوك auth-profile المعتمد على المراجع فقط.
  </Card>
</CardGroup>

## بدء تشغيل محلي خلال 5 دقائق

<Steps>
  <Step title="بدء Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="التحقق من صحة الخدمة">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

الخط الأساسي السليم: `Runtime: running` و`Connectivity probe: ok` و`Capability: ...` بما يطابق ما تتوقعه. استخدم `openclaw gateway status --require-rpc` عندما تحتاج إلى إثبات RPC ضمن نطاق القراءة، وليس مجرد قابلية الوصول.

  </Step>

  <Step title="التحقق من جاهزية القناة">

```bash
openclaw channels status --probe
```

مع وجود gateway قابلة للوصول، يشغّل هذا مسابير قنوات مباشرة لكل حساب وعمليات تدقيق اختيارية.
إذا كانت gateway غير قابلة للوصول، فإن CLI يرجع إلى ملخصات القنوات المعتمدة على الإعدادات فقط
بدلًا من مخرجات الفحص المباشر.

  </Step>
</Steps>

<Note>
تراقب إعادة تحميل إعدادات Gateway مسار ملف الإعدادات النشط (المحلول من القيم الافتراضية للملف الشخصي/الحالة، أو `OPENCLAW_CONFIG_PATH` عند ضبطه).
الوضع الافتراضي هو `gateway.reload.mode="hybrid"`.
بعد أول تحميل ناجح، تخدم العملية الجارية لقطة الإعدادات النشطة داخل الذاكرة؛ وتستبدل إعادة التحميل الناجحة تلك اللقطة بشكل ذري.
</Note>

## نموذج وقت التشغيل

- عملية واحدة تعمل دائمًا للتوجيه، وطبقة التحكم، واتصالات القنوات.
- منفذ واحد متعدد الإرسال من أجل:
  - تحكم/RPC عبر WebSocket
  - HTTP APIs المتوافقة مع OpenAI ‏(`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI وhooks
- وضع الربط الافتراضي: `loopback`.
- المصادقة مطلوبة افتراضيًا. تستخدم إعدادات السر المشترك
  `gateway.auth.token` / `gateway.auth.password` ‏(أو
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)، ويمكن لإعدادات
  reverse-proxy غير المرتبطة بـ loopback استخدام `gateway.auth.mode: "trusted-proxy"`.

## نقاط النهاية المتوافقة مع OpenAI

أصبح سطح التوافق الأعلى أثرًا في OpenClaw الآن هو:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

لماذا تهم هذه المجموعة:

- تقوم معظم تكاملات Open WebUI وLobeChat وLibreChat بفحص `/v1/models` أولًا.
- تتوقع العديد من مسارات RAG والذاكرة وجود `/v1/embeddings`.
- يفضّل العملاء الأصليون للوكلاء بشكل متزايد `/v1/responses`.

ملاحظة تخطيطية:

- `/v1/models` موجه للوكلاء أولًا: إذ يعيد `openclaw` و`openclaw/default` و`openclaw/<agentId>`.
- `openclaw/default` هو الاسم المستعار المستقر الذي يُربط دائمًا بالوكيل الافتراضي المضبوط.
- استخدم `x-openclaw-model` عندما تريد تجاوز موفر/نموذج الواجهة الخلفية؛ وإلا فإن إعداد النموذج والـ embedding العاديين للوكيل المحدد يظلان متحكمين.

تعمل جميع هذه النقاط على منفذ Gateway الرئيسي نفسه وتستخدم حد مصادقة المشغل الموثوق نفسه لبقية Gateway HTTP API.

### أسبقية المنفذ والربط

| الإعداد       | ترتيب الحل                                                   |
| ------------- | ------------------------------------------------------------ |
| منفذ Gateway  | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| وضع الربط     | CLI/التجاوز → `gateway.bind` → `loopback`                    |

### أوضاع إعادة التحميل الساخن

| `gateway.reload.mode` | السلوك                                  |
| --------------------- | --------------------------------------- |
| `off`                 | لا توجد إعادة تحميل للإعدادات           |
| `hot`                 | تطبيق التغييرات الآمنة ساخنًا فقط       |
| `restart`             | إعادة تشغيل عند التغييرات التي تتطلب ذلك |
| `hybrid` (افتراضي)    | تطبيق ساخن عندما يكون آمنًا، وإعادة تشغيل عند الحاجة |

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

يُستخدم `gateway status --deep` لاكتشاف الخدمات الإضافية (LaunchDaemons/systemd system
units/schtasks)، وليس لفحص صحة RPC أعمق.

## Gateways متعددة (على المضيف نفسه)

يجب أن تشغّل معظم عمليات التثبيت gateway واحدة لكل جهاز. ويمكن لـ gateway واحدة استضافة عدة
وكلاء وقنوات.

أنت تحتاج إلى Gateways متعددة فقط عندما تريد العزل عمدًا أو rescue bot.

فحوصات مفيدة:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

ما الذي يجب توقعه:

- يمكن أن يبلغ `gateway status --deep` عن `Other gateway-like services detected (best effort)`
  ويطبع تلميحات تنظيف عندما تظل عمليات تثبيت launchd/systemd/schtasks القديمة موجودة.
- يمكن أن يحذر `gateway probe` من `multiple reachable gateways` عندما يجيب أكثر من هدف واحد.
- إذا كان ذلك مقصودًا، فاعزل المنافذ، والإعدادات/الحالة، وجذور مساحات العمل لكل gateway.

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

## الوصول البعيد

المفضل: Tailscale/VPN.
البديل الاحتياطي: نفق SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

ثم وصّل العملاء محليًا إلى `ws://127.0.0.1:18789`.

<Warning>
لا تتجاوز أنفاق SSH مصادقة gateway. ففي إعدادات السر المشترك، لا يزال على العملاء
إرسال `token`/`password` حتى عبر النفق. وفي الأوضاع الحاملة للهوية،
لا يزال يجب على الطلب استيفاء مسار المصادقة ذاك.
</Warning>

راجع: [Remote Gateway](/ar/gateway/remote)، [المصادقة](/ar/gateway/authentication)، [Tailscale](/ar/gateway/tailscale).

## الإشراف ودورة حياة الخدمة

استخدم عمليات التشغيل الخاضعة للإشراف لتحقيق موثوقية تشبه الإنتاج.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

تكون تسميات LaunchAgent هي `ai.openclaw.gateway` ‏(الافتراضي) أو `ai.openclaw.<profile>` ‏(ملف شخصي مسمى). يقوم `openclaw doctor` بتدقيق انحراف إعدادات الخدمة وإصلاحه.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

للاستمرارية بعد تسجيل الخروج، قم بتمكين lingering:

```bash
sudo loginctl enable-linger <user>
```

مثال يدوي لوحدة المستخدم عندما تحتاج إلى مسار تثبيت مخصص:

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
‏(أو `OpenClaw Gateway (<profile>)` للملفات الشخصية المسماة). وإذا رُفض إنشاء
المهمة المجدولة، فإن OpenClaw يرجع إلى مشغّل في مجلد Startup لكل مستخدم
يشير إلى `gateway.cmd` داخل دليل الحالة.

  </Tab>

  <Tab title="Linux (system service)">

استخدم وحدة نظام للمضيفين متعددي المستخدمين/الدائمين.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

استخدم جسم الخدمة نفسه الخاص بوحدة المستخدم، لكن قم بتثبيته تحت
`/etc/systemd/system/openclaw-gateway[-<profile>].service` واضبط
`ExecStart=` إذا كان ملف `openclaw` الثنائي لديك موجودًا في مكان آخر.

  </Tab>
</Tabs>

## المسار السريع لملف التطوير

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

تتضمن القيم الافتراضية حالة/إعدادات معزولة ومنفذ gateway أساسي `19001`.

## مرجع البروتوكول السريع (منظور المشغل)

- يجب أن يكون أول إطار من العميل هو `connect`.
- تعيد Gateway لقطة `hello-ok` ‏(`presence` و`health` و`stateVersion` و`uptimeMs` والحدود/السياسة).
- تشكل `hello-ok.features.methods` / `events` قائمة اكتشاف متحفظة، وليست
  تفريغًا مولدًا لكل مسار مساعد قابل للاستدعاء.
- الطلبات: ‏`req(method, params)` → `res(ok/payload|error)`.
- تتضمن الأحداث الشائعة `connect.challenge` و`agent` و`chat` و
  `session.message` و`session.tool` و`sessions.changed` و`presence` و`tick` و
  `health` و`heartbeat` وأحداث دورة حياة الاقتران/الموافقة و`shutdown`.

تعمل عمليات الوكيل على مرحلتين:

1. إقرار فوري بالقبول (`status:"accepted"`)
2. استجابة إكمال نهائية (`status:"ok"|"error"`)، مع بث أحداث `agent` بينهما.

راجع وثائق البروتوكول الكاملة: [Gateway Protocol](/ar/gateway/protocol).

## فحوصات تشغيلية

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

لا تتم إعادة تشغيل الأحداث. وعند وجود فجوات في التسلسل، أعد تحديث الحالة (`health`, `system-presence`) قبل المتابعة.

## تواقيع الأعطال الشائعة

| التوقيع                                                       | المشكلة المحتملة                                                                 |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                   | ربط غير loopback من دون مسار مصادقة صالح لـ gateway                             |
| `another gateway instance is already listening` / `EADDRINUSE` | تعارض منفذ                                                                       |
| `Gateway start blocked: set gateway.mode=local`               | تم ضبط config على الوضع البعيد، أو أن ختم الوضع المحلي مفقود من إعدادات متضررة |
| `unauthorized` during connect                                 | عدم تطابق المصادقة بين العميل وgateway                                          |

للحصول على سلاسل تشخيص كاملة، استخدم [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting).

## ضمانات السلامة

- يفشل عملاء بروتوكول Gateway بسرعة عندما لا تكون Gateway متاحة (من دون رجوع ضمني مباشر إلى القناة).
- يتم رفض وإغلاق الإطارات الأولى غير الصالحة/غير `connect`.
- يصدر الإيقاف السلس حدث `shutdown` قبل إغلاق المقبس.

---

ذو صلة:

- [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)
- [عملية الخلفية](/ar/gateway/background-process)
- [الإعداد](/ar/gateway/configuration)
- [الصحة](/ar/gateway/health)
- [Doctor](/ar/gateway/doctor)
- [المصادقة](/ar/gateway/authentication)

## ذو صلة

- [الإعداد](/ar/gateway/configuration)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
- [الوصول البعيد](/ar/gateway/remote)
- [إدارة الأسرار](/ar/gateway/secrets)
