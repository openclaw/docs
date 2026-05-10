---
read_when:
    - تشغيل عملية Gateway أو تصحيح أخطائها
summary: دليل تشغيل لخدمة Gateway ودورة حياتها وعملياتها
title: دليل تشغيل Gateway
x-i18n:
    generated_at: "2026-05-10T19:40:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54f868e0b263e346876fb5c4f6a359e8a6f6802871f6931668ebe57140ca2711
    source_path: gateway/index.md
    workflow: 16
---

استخدم هذه الصفحة لبدء تشغيل خدمة Gateway في اليوم الأول وعمليات اليوم الثاني.

<CardGroup cols={2}>
  <Card title="استكشاف الأخطاء المتعمق" icon="siren" href="/ar/gateway/troubleshooting">
    تشخيصات تبدأ بالأعراض مع سلالم أوامر دقيقة وبصمات السجلات.
  </Card>
  <Card title="الإعدادات" icon="sliders" href="/ar/gateway/configuration">
    دليل إعداد موجه للمهام + مرجع إعدادات كامل.
  </Card>
  <Card title="إدارة الأسرار" icon="key-round" href="/ar/gateway/secrets">
    عقد SecretRef، وسلوك لقطة وقت التشغيل، وعمليات الترحيل/إعادة التحميل.
  </Card>
  <Card title="عقد خطة الأسرار" icon="shield-check" href="/ar/gateway/secrets-plan-contract">
    قواعد الهدف/المسار الدقيقة لـ `secrets apply` وسلوك ملف تعريف المصادقة المعتمد على المراجع فقط.
  </Card>
</CardGroup>

## بدء تشغيل محلي خلال 5 دقائق

<Steps>
  <Step title="بدء تشغيل Gateway">

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

خط الأساس السليم: `Runtime: running`، و`Connectivity probe: ok`، و`Capability: ...` التي تطابق ما تتوقعه. استخدم `openclaw gateway status --require-rpc` عندما تحتاج إلى إثبات RPC بنطاق القراءة، وليس مجرد قابلية الوصول.

  </Step>

  <Step title="التحقق من جاهزية القناة">

```bash
openclaw channels status --probe
```

مع Gateway قابل للوصول، يشغل هذا فحوصات قنوات مباشرة لكل حساب وعمليات تدقيق اختيارية.
إذا كان Gateway غير قابل للوصول، يعود CLI إلى ملخصات قنوات مستندة إلى الإعدادات فقط بدلا
من مخرجات الفحص المباشر.

  </Step>
</Steps>

<Note>
تراقب إعادة تحميل إعدادات Gateway مسار ملف الإعدادات النشط (المحلول من الإعدادات الافتراضية للملف الشخصي/الحالة، أو من `OPENCLAW_CONFIG_PATH` عند ضبطه).
الوضع الافتراضي هو `gateway.reload.mode="hybrid"`.
بعد أول تحميل ناجح، تخدم العملية الجارية لقطة إعدادات الذاكرة النشطة؛ وتستبدل إعادة التحميل الناجحة تلك اللقطة ذرّيا.
</Note>

## نموذج وقت التشغيل

- عملية واحدة تعمل دائما للتوجيه، ومستوى التحكم، واتصالات القنوات.
- منفذ واحد متعدد الإرسال لـ:
  - تحكم/RPC عبر WebSocket
  - واجهات HTTP API، متوافقة مع OpenAI (`/v1/models`، `/v1/embeddings`، `/v1/chat/completions`، `/v1/responses`، `/tools/invoke`)
  - واجهة التحكم والخطافات
- وضع الربط الافتراضي: `loopback`.
- المصادقة مطلوبة افتراضيا. تستخدم إعدادات السر المشترك
  `gateway.auth.token` / `gateway.auth.password` (أو
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)، ويمكن لإعدادات
  الوكيل العكسي غير `loopback` استخدام `gateway.auth.mode: "trusted-proxy"`.

## نقاط نهاية متوافقة مع OpenAI

أصبح سطح التوافق الأعلى أثرا في OpenClaw الآن هو:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

لماذا تهم هذه المجموعة:

- تتحقق معظم تكاملات Open WebUI وLobeChat وLibreChat من `/v1/models` أولا.
- تتوقع كثير من مسارات RAG والذاكرة وجود `/v1/embeddings`.
- يفضل العملاء الأصليون للوكلاء بشكل متزايد `/v1/responses`.

ملاحظة تخطيط:

- `/v1/models` موجه للوكلاء أولا: يعيد `openclaw`، و`openclaw/default`، و`openclaw/<agentId>`.
- `openclaw/default` هو الاسم المستعار المستقر الذي يرتبط دائما بالوكيل الافتراضي المضبوط.
- استخدم `x-openclaw-model` عندما تريد تجاوز موفر/نموذج الخلفية؛ وإلا يبقى نموذج الوكيل المحدد العادي وإعداد التضمين الخاص به متحكمين.

تعمل كل هذه على منفذ Gateway الرئيسي وتستخدم حد مصادقة المشغل الموثوق نفسه كبقية واجهة Gateway HTTP API.

### أسبقية المنفذ والربط

| الإعداد      | ترتيب الحل                                              |
| ------------ | ------------------------------------------------------------- |
| منفذ Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| وضع الربط    | CLI/override → `gateway.bind` → `loopback`                    |

تسجل خدمات Gateway المثبتة قيمة `--port` المحلولة في بيانات المشرف الوصفية. بعد تغيير `gateway.port`، شغل `openclaw doctor --fix` أو `openclaw gateway install --force` حتى يبدأ launchd/systemd/schtasks العملية على المنفذ الجديد.

يستخدم بدء تشغيل Gateway المنفذ والربط الفعالين نفسيهما عندما يزرع أصول
واجهة التحكم المحلية للروابط غير `loopback`. على سبيل المثال، `--bind lan --port 3000`
يزرع `http://localhost:3000` و`http://127.0.0.1:3000` قبل تشغيل
التحقق وقت التشغيل. أضف أي أصول متصفح بعيدة، مثل عناوين URL لوكيل HTTPS، إلى
`gateway.controlUi.allowedOrigins` صراحة.

### أوضاع إعادة التحميل الساخن

| `gateway.reload.mode` | السلوك                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | لا توجد إعادة تحميل للإعدادات                           |
| `hot`                 | تطبيق التغييرات الآمنة ساخنا فقط                |
| `restart`             | إعادة التشغيل عند تغييرات تتطلب إعادة تحميل         |
| `hybrid` (افتراضي)    | تطبيق ساخن عندما يكون آمنا، وإعادة التشغيل عند اللزوم |

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

`gateway status --deep` مخصص لاكتشاف خدمة إضافي (LaunchDaemons/وحدات نظام systemd/schtasks)،
وليس فحصا أعمق لصحة RPC.

## عدة Gateways (المضيف نفسه)

يجب أن تشغل معظم عمليات التثبيت Gateway واحدا لكل جهاز. يمكن لـ Gateway واحد استضافة عدة
وكلاء وقنوات.

لا تحتاج إلى عدة Gateways إلا عندما تريد العزل عمدا أو بوت إنقاذ.

فحوصات مفيدة:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

ما يمكن توقعه:

- يمكن لـ `gateway status --deep` الإبلاغ عن `Other gateway-like services detected (best effort)`
  وطباعة تلميحات تنظيف عندما تبقى تثبيتات launchd/systemd/schtasks قديمة.
- يمكن لـ `gateway probe` التحذير من `multiple reachable gateways` عندما يجيب أكثر من هدف واحد.
- إذا كان ذلك مقصودا، فاعزل المنافذ والإعدادات/الحالة وجذور مساحات العمل لكل Gateway.

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
الخيار الاحتياطي: نفق SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

ثم وصّل العملاء محليا إلى `ws://127.0.0.1:18789`.

<Warning>
لا تتجاوز أنفاق SSH مصادقة Gateway. بالنسبة لمصادقة السر المشترك، ما يزال
يجب على العملاء إرسال `token`/`password` حتى عبر النفق. وبالنسبة للأوضاع الحاملة للهوية،
ما يزال على الطلب استيفاء مسار المصادقة ذلك.
</Warning>

راجع: [Gateway البعيد](/ar/gateway/remote)، [المصادقة](/ar/gateway/authentication)، [Tailscale](/ar/gateway/tailscale).

## الإشراف ودورة حياة الخدمة

استخدم التشغيل تحت الإشراف لموثوقية شبيهة بالإنتاج.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

استخدم `openclaw gateway restart` لإعادة التشغيل. لا تسلسل `openclaw gateway stop` و`openclaw gateway start` كبديل لإعادة التشغيل.

على macOS، يستخدم `gateway stop` الأمر `launchctl bootout` افتراضيا — وهذا يزيل LaunchAgent من جلسة الإقلاع الحالية دون حفظ تعطيل دائم، لذلك يستمر الاسترداد التلقائي KeepAlive في العمل بعد الأعطال غير المتوقعة، ويعيد `gateway start` التمكين بنظافة. لكبت إعادة التشغيل التلقائي بشكل دائم عبر عمليات إعادة الإقلاع، مرر `--disable`: `openclaw gateway stop --disable`.

تسميات LaunchAgent هي `ai.openclaw.gateway` (افتراضي) أو `ai.openclaw.<profile>` (ملف شخصي مسمى). يدقق `openclaw doctor` انحراف إعدادات الخدمة ويصلحه.

  </Tab>

  <Tab title="Linux (systemd user)">

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

يستخدم بدء التشغيل المدار الأصلي على Windows مهمة مجدولة باسم `OpenClaw Gateway`
(أو `OpenClaw Gateway (<profile>)` للملفات الشخصية المسماة). إذا رُفض إنشاء المهمة المجدولة،
يعود OpenClaw إلى مشغل في مجلد بدء التشغيل لكل مستخدم يشير إلى `gateway.cmd`
داخل دليل الحالة.

  </Tab>

  <Tab title="Linux (system service)">

استخدم وحدة نظام للمضيفين متعددي المستخدمين/الدائمين.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

استخدم جسم الخدمة نفسه كوحدة المستخدم، لكن ثبته تحت
`/etc/systemd/system/openclaw-gateway[-<profile>].service` وعدّل
`ExecStart=` إذا كان ملف `openclaw` الثنائي لديك موجودا في مكان آخر.

لا تدع أيضا `openclaw doctor --fix` يثبت خدمة Gateway على مستوى المستخدم للملف الشخصي/المنفذ نفسه. يرفض Doctor ذلك التثبيت التلقائي عندما يجد خدمة OpenClaw Gateway على مستوى النظام؛ استخدم `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما تكون وحدة النظام مالكة لدورة الحياة.

  </Tab>
</Tabs>

## المسار السريع لملف التطوير الشخصي

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

تشمل الإعدادات الافتراضية حالة/إعدادات معزولة ومنفذ Gateway الأساسي `19001`.

## مرجع سريع للبروتوكول (عرض المشغل)

- يجب أن يكون أول إطار من العميل هو `connect`.
- يعيد Gateway لقطة `hello-ok` (`presence`، `health`، `stateVersion`، `uptimeMs`، الحدود/السياسة).
- `hello-ok.features.methods` / `events` هي قائمة اكتشاف محافظة، وليست
  تفريغا مولدا لكل مسار مساعد قابل للاستدعاء.
- الطلبات: `req(method, params)` → `res(ok/payload|error)`.
- تشمل الأحداث الشائعة `connect.challenge`، و`agent`، و`chat`،
  و`session.message`، و`session.tool`، و`sessions.changed`، و`presence`، و`tick`،
  و`health`، و`heartbeat`، وأحداث دورة حياة الاقتران/الموافقة، و`shutdown`.

تشغيلات الوكيل من مرحلتين:

1. إقرار قبول فوري (`status:"accepted"`)
2. استجابة إكمال نهائية (`status:"ok"|"error"`)، مع أحداث `agent` مبثوثة بينها.

راجع وثائق البروتوكول الكاملة: [بروتوكول Gateway](/ar/gateway/protocol).

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

لا يعاد تشغيل الأحداث. عند فجوات التسلسل، حدّث الحالة (`health`، `system-presence`) قبل المتابعة.

## بصمات الفشل الشائعة

| التوقيع                                                       | المشكلة المحتملة                                                               |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `refusing to bind gateway ... without auth`                   | ربط غير حلقة الرجوع من دون مسار مصادقة Gateway صالح                            |
| `another gateway instance is already listening` / `EADDRINUSE` | تعارض في المنفذ                                                                |
| `Gateway start blocked: set gateway.mode=local`               | تم ضبط الإعدادات على الوضع البعيد، أو أن وسم الوضع المحلي مفقود من إعدادات تالفة |
| `unauthorized` أثناء الاتصال                                  | عدم تطابق المصادقة بين العميل وGateway                                         |

للحصول على سلالم التشخيص الكاملة، استخدم [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting).

## ضمانات السلامة

- تفشل عملاء بروتوكول Gateway بسرعة عندما لا يكون Gateway متاحًا (لا يوجد رجوع احتياطي ضمني إلى قناة مباشرة).
- تُرفض الإطارات الأولى غير الصالحة/غير الخاصة بالاتصال وتُغلق.
- يصدر الإيقاف المنظّم حدث `shutdown` قبل إغلاق المقبس.

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
