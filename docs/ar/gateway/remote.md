---
read_when:
    - تشغيل إعدادات Gateway البعيدة أو استكشاف أخطائها وإصلاحها
summary: الوصول عن بُعد باستخدام Gateway WS وأنفاق SSH وشبكات Tailscale الخاصة
title: الوصول عن بُعد
x-i18n:
    generated_at: "2026-07-12T05:55:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78daaad7bcb9f80072eaa2d6946bff9f28ba1ec4f95a68edb0d24cf7f9c3fec2
    source_path: gateway/remote.md
    workflow: 16
---

يشغّل OpenClaw ‏Gateway واحدًا (الرئيسي) على مضيف، ويربط به كل عميل. يمتلك Gateway الجلسات وملفات تعريف المصادقة والقنوات والحالة؛ وكل ما عداه عميل.

- **المشغّلون** (أنت أو تطبيق macOS): يكون اتصال WebSocket المباشر عبر LAN أو شبكة Tailscale أبسط عندما يمكن الوصول إلى Gateway؛ ويُعد نفق SSH خيار الرجوع العام.
- **العُقد** (أجهزة iOS وAndroid وغيرها): تتصل بـ **WebSocket الخاص بـ Gateway** (عبر LAN أو شبكة Tailscale أو نفق SSH).

## الفكرة الأساسية

يرتبط WebSocket الخاص بـ Gateway افتراضيًا بـ **local loopback** على المنفذ `18789` (`gateway.port`). للاستخدام عن بُعد، إمّا أن تكشفه عبر Tailscale Serve أو ربط موثوق عبر LAN أو شبكة Tailscale، وإمّا أن تعيد توجيه منفذ local loopback عبر SSH.

## خيارات البنية

| الإعداد                            | مكان تشغيل Gateway                                                                                       | الأنسب لـ                                                                                                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gateway دائم التشغيل في شبكة Tailscale | مضيف دائم (VPS أو خادم منزلي)، يُوصَل إليه عبر Tailscale أو SSH                                          | الحواسيب المحمولة التي تدخل في وضع السكون كثيرًا لكنها تحتاج إلى بقاء الوكيل قيد التشغيل دائمًا. راجع [exe.dev](/ar/install/exe-dev) (جهاز افتراضي سهل) أو [Hetzner](/ar/install/hetzner) (خادم VPS للإنتاج). |
| حاسوب مكتبي منزلي                 | حاسوب مكتبي؛ يتصل الحاسوب المحمول عن بُعد عبر الوضع البعيد لتطبيق macOS (الإعدادات → الاتصال → تشغيل OpenClaw) | إبقاء الوكيل على جهاز يظل قيد التشغيل. دليل التشغيل: [الوصول عن بُعد عبر macOS](/ar/platforms/mac/remote).                                                               |
| حاسوب محمول                       | حاسوب محمول، مكشوف بأمان عبر نفق SSH أو Tailscale Serve (أبقِ `gateway.bind: "loopback"`)                 | إعدادات الجهاز الواحد. راجع [Tailscale](/ar/gateway/tailscale) و[الويب](/ar/web).                                                                                           |

في إعدادَي التشغيل الدائم والحاسوب المحمول، يُفضّل إبقاء `gateway.bind: "loopback"` واستخدام **Tailscale Serve** لواجهة التحكم، أو ربط موثوق عبر LAN أو شبكة Tailscale مع `gateway.remote.transport: "direct"`. نفق SSH هو خيار الرجوع الذي يعمل من أي جهاز.

## تدفق الأوامر (ما الذي يعمل وأين)

يمتلك Gateway واحد الحالة والقنوات؛ والعُقد أجهزة طرفية. مثال (رسالة Telegram تُوجَّه إلى أداة عُقدة):

1. تصل رسالة Telegram إلى **Gateway**.
2. يشغّل Gateway **الوكيل**، الذي يقرر ما إذا كان سيستدعي أداة عُقدة.
3. يستدعي Gateway **العُقدة** عبر WebSocket الخاص بـ Gateway (استدعاء RPC ‏`node.invoke`).
4. تعيد العُقدة النتيجة؛ ويرد Gateway على Telegram.

لا تشغّل العُقد خدمة Gateway. ينبغي تشغيل Gateway واحد فقط لكل مضيف، إلا إذا كنت تشغّل عمدًا ملفات تعريف معزولة (راجع [بوابات متعددة](/ar/gateway/multiple-gateways)). إن «وضع العُقدة» في تطبيق macOS ليس سوى عميل عُقدة يعمل عبر WebSocket الخاص بـ Gateway.

## نفق SSH ‏(CLI + الأدوات)

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

عندما يكون النفق نشطًا، يصل `openclaw health` و`openclaw status --deep` إلى Gateway البعيد عبر `ws://127.0.0.1:18789`. ويمكن أيضًا لـ `openclaw gateway status` و`openclaw gateway health` و`openclaw gateway probe` و`openclaw gateway call` استهداف عنوان URL مُعاد توجيهه عبر `--url`.

<Note>
استبدل `18789` بقيمة `gateway.port` التي أعددتها (أو `--port` / `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
لا يلجأ `--url` أبدًا إلى بيانات الاعتماد الموجودة في الإعداد أو البيئة. مرّر `--token` أو `--password` صراحةً؛ فبدونهما لا يرسل العميل أي بيانات اعتماد، ويفشل الاتصال إذا كان Gateway المستهدف يتطلب المصادقة.
</Warning>

## الإعدادات البعيدة الافتراضية لـ CLI

احفظ هدفًا بعيدًا كي تستخدمه أوامر CLI افتراضيًا:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

عندما يقتصر Gateway على local loopback، أبقِ عنوان URL على `ws://127.0.0.1:18789` وافتح نفق SSH أولًا. في نقل نفق SSH لتطبيق macOS، يُوضع اسم مضيف Gateway المكتشَف في `gateway.remote.sshTarget` (`user@host` أو `user@host:port`)؛ بينما يظل `gateway.remote.url` عنوان URL المحلي للنفق. إذا كان المنفذ البعيد مختلفًا عن المنفذ المحلي، فعيّن `gateway.remote.remotePort`.

يكون التحقق من مفتاح المضيف صارمًا افتراضيًا (`gateway.remote.sshHostKeyPolicy: "strict"`). عيّنه إلى `"openssh"` لتفويض المهمة إلى إعداد OpenSSH الفعلي لديك؛ وراجع إعدادات SSH الخاصة بالمستخدم والنظام قبل تمكينه.

بالنسبة إلى Gateway يمكن الوصول إليه بالفعل عبر LAN موثوقة أو شبكة Tailscale، استخدم الوضع المباشر:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      transport: "direct",
      url: "ws://192.168.0.202:18789",
      token: "your-token",
    },
  },
}
```

## أولوية بيانات الاعتماد

يتبع تحديد بيانات اعتماد Gateway عقدًا مشتركًا واحدًا عبر مسارات الاستدعاء والفحص والحالة ومراقبة الموافقة على التنفيذ في Discord. ويستخدم مضيف العُقدة العقد نفسه مع استثناء واحد في الوضع المحلي (إذ يتجاهل `gateway.remote.*`).

- تكون لبيانات الاعتماد الصريحة (`--token` أو `--password` أو `gatewayToken` الخاص بأداة ما) الأولوية دائمًا في مسارات الاستدعاء التي تقبل مصادقة صريحة.
- أمان تجاوز عنوان URL:
  - لا يعيد `--url` في CLI استخدام بيانات اعتماد ضمنية من الإعداد أو البيئة مطلقًا.
  - يمكن لـ `OPENCLAW_GATEWAY_URL` في البيئة استخدام بيانات اعتماد البيئة فقط (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- الإعدادات الافتراضية للوضع المحلي:
  - الرمز المميز: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (الرجوع إلى القيمة البعيدة فقط عندما لا يكون الرمز المحلي معيّنًا)
  - كلمة المرور: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (الرجوع إلى القيمة البعيدة فقط عندما لا تكون كلمة المرور المحلية معيّنة)
- الإعدادات الافتراضية للوضع البعيد:
  - الرمز المميز: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - كلمة المرور: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- استثناء الوضع المحلي لمضيف العُقدة: يُتجاهل `gateway.remote.token` / `gateway.remote.password`.
- تكون عمليات التحقق من الرمز المميز للفحص والحالة عن بُعد صارمة افتراضيًا: فهي تستخدم `gateway.remote.token` فقط (من دون الرجوع إلى الرمز المحلي) عند استهداف الوضع البعيد.
- تستخدم تجاوزات بيئة Gateway ‏`OPENCLAW_GATEWAY_*` فقط.

## الوصول عن بُعد إلى واجهة الدردشة

لا يملك WebChat منفذ HTTP منفصلًا؛ إذ تتصل واجهة دردشة SwiftUI مباشرةً بـ WebSocket الخاص بـ Gateway.

- أعد توجيه `18789` عبر SSH (راجع أعلاه)، ثم صِل العملاء بـ `ws://127.0.0.1:18789`.
- للوضع المباشر عبر LAN أو شبكة Tailscale، صِل العملاء بعنوان `ws://` الخاص المُعدّ أو بعنوان `wss://` الآمن.
- على macOS، يدير الوضع البعيد للتطبيق وسيلة النقل المحددة تلقائيًا.

## الوضع البعيد لتطبيق macOS

يدير تطبيق شريط القوائم في macOS الإعداد نفسه من البداية إلى النهاية: عمليات التحقق من الحالة عن بُعد، وWebChat، وإعادة توجيه التنبيه الصوتي. دليل التشغيل: [الوصول عن بُعد عبر macOS](/ar/platforms/mac/remote).

## قواعد الأمان (الوصول البعيد/VPN)

أبقِ Gateway **مقتصرًا على local loopback** ما لم تكن متأكدًا من حاجتك إلى الربط.

- يُعد **local loopback مع SSH أو Tailscale Serve** الخيار الافتراضي الأكثر أمانًا (من دون كشف عام).
- يُقبل `ws://` غير المشفّر لمضيفي local loopback والشبكات الخاصة/LAN ‏(RFC 1918) والعناوين المحلية للرابط وCGNAT والنطاقات `.local` و`.ts.net`. ويجب أن تستخدم المضيفات العامة البعيدة `wss://`.
- يجب أن تستخدم **عمليات الربط خارج local loopback** (`lan`/`tailnet`/`custom`، أو `auto` عندما لا يتوفر local loopback) مصادقة Gateway: رمزًا مميزًا أو كلمة مرور أو وكيلًا عكسيًا مدركًا للهوية مع `gateway.auth.mode: "trusted-proxy"`.
- يُعد `gateway.remote.token` / `.password` مصدرَي بيانات اعتماد للعميل؛ ولا يضبطان مصادقة الخادم بمفردهما.
- لا يمكن لمسارات الاستدعاء المحلية استخدام `gateway.remote.*` كخيار رجوع إلا عندما لا يكون `gateway.auth.*` معيّنًا.
- إذا ضُبط `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef وتعذر حله، يفشل الحل بصورة مغلقة (من دون أن يخفيه الرجوع إلى القيمة البعيدة).
- يثبّت `gateway.remote.tlsFingerprint` شهادة TLS البعيدة لـ `wss://`، بما في ذلك الوضع المباشر في macOS. ومن دون بصمة محفوظة، لا يثبّت macOS الشهادة عند أول استخدام إلا بعد نجاح الثقة الاعتيادية للنظام؛ وتحتاج بوابات Gateway ذاتية التوقيع أو التابعة لهيئة شهادات خاصة إلى بصمة صريحة أو إلى الاتصال البعيد عبر SSH.
- يمكن لـ **Tailscale Serve** مصادقة حركة مرور واجهة التحكم وWebSocket عبر ترويسات الهوية عند `gateway.auth.allowTailscale: true`. لا تستخدم نقاط نهاية HTTP API مصادقة الترويسات هذه، بل تتبع وضع مصادقة HTTP المعتاد لـ Gateway. يفترض هذا التدفق الخالي من الرموز المميزة أن مضيف Gateway موثوق؛ عيّنه إلى `false` لاستخدام مصادقة السر المشترك في كل مكان.
- تتوقع مصادقة **الوكيل الموثوق** افتراضيًا وكيلًا غير مرتبط بـ local loopback ومدركًا للهوية. وتتطلب الوكلاء العكسية المرتبطة بـ local loopback على المضيف نفسه تعيين `gateway.auth.trustedProxy.allowLoopback = true` صراحةً.
- تعامل مع التحكم عبر المتصفح مثل وصول المشغّل: قصره على شبكة Tailscale مع إقران متعمّد للعُقد.

للتفاصيل المتعمقة: [الأمان](/ar/gateway/security).

### macOS: نفق SSH دائم عبر LaunchAgent

بالنسبة إلى عملاء macOS، يستخدم أسهل إعداد دائم إدخال إعداد SSH من نوع `LocalForward` إلى جانب LaunchAgent يُبقي النفق نشطًا عبر عمليات إعادة التشغيل والأعطال.

#### الخطوة 1: إضافة إعداد SSH

حرّر `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

استبدل `<REMOTE_IP>` و`<REMOTE_USER>` بقيمك.

#### الخطوة 2: نسخ مفتاح SSH (مرة واحدة)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### الخطوة 3: إعداد الرمز المميز لـ Gateway

```bash
openclaw config set gateway.remote.token "<your-token>"
```

استخدم `gateway.remote.password` بدلًا منه إذا كان Gateway البعيد يستخدم المصادقة بكلمة المرور. يظل `OPENCLAW_GATEWAY_TOKEN` صالحًا كتجاوز على مستوى الصدفة، لكن إعداد العميل البعيد الدائم هو `gateway.remote.token` / `gateway.remote.password`.

#### الخطوة 4: إنشاء LaunchAgent

احفظه باسم `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### الخطوة 5: تحميل LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

يبدأ النفق تلقائيًا عند تسجيل الدخول، ويُعاد تشغيله عند تعطله، ويُبقي المنفذ المُعاد توجيهه نشطًا.

<Note>
إذا كان لديك LaunchAgent متبقٍ باسم `com.openclaw.ssh-tunnel` من إعداد أقدم، فألغِ تحميله واحذفه.
</Note>

#### استكشاف الأخطاء وإصلاحها

```bash
# تحقق مما إذا كان النفق قيد التشغيل
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789

# أعد تشغيل النفق
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel

# أوقف النفق
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| إدخال الإعداد                         | وظيفته                                                         |
| ------------------------------------ | -------------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | يعيد توجيه المنفذ المحلي 18789 إلى المنفذ البعيد 18789         |
| `ssh -N`                             | يشغّل SSH من دون تنفيذ أوامر بعيدة (إعادة توجيه المنافذ فقط)   |
| `KeepAlive`                          | يعيد تشغيل النفق تلقائيًا إذا تعطل                              |
| `RunAtLoad`                          | يبدأ النفق عند تحميل LaunchAgent أثناء تسجيل الدخول            |

## ذو صلة

- [Tailscale](/ar/gateway/tailscale)
- [المصادقة](/ar/gateway/authentication)
- [إعداد Gateway بعيد](/ar/gateway/remote-gateway-readme)
