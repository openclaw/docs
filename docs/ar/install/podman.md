---
read_when:
    - تريد Gateway يعمل داخل حاوية باستخدام Podman بدلاً من Docker
summary: تشغيل OpenClaw في حاوية Podman دون صلاحيات الجذر
title: Podman
x-i18n:
    generated_at: "2026-05-06T08:01:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44f89feede7fe10325810599dad457f8fcc3adbd9c139e26df67b9ad12019d56
    source_path: install/podman.md
    workflow: 16
---

شغّل OpenClaw Gateway في حاوية Podman بلا صلاحيات جذر، تُدار بواسطة مستخدمك الحالي غير الجذري.

النموذج المقصود هو:

- يشغّل Podman حاوية Gateway.
- يكون `openclaw` CLI على المضيف هو مستوى التحكم.
- تكون الحالة الدائمة على المضيف ضمن `~/.openclaw` افتراضيًا.
- تستخدم الإدارة اليومية `openclaw --container <name> ...` بدلًا من `sudo -u openclaw` أو `podman exec` أو مستخدم خدمة منفصل.

## المتطلبات الأساسية

- **Podman** في وضع بلا صلاحيات جذر
- **OpenClaw CLI** مثبّت على المضيف
- **اختياري:** `systemd --user` إذا أردت تشغيلًا تلقائيًا مُدارًا بواسطة Quadlet
- **اختياري:** `sudo` فقط إذا أردت `loginctl enable-linger "$(whoami)"` لاستمرارية التشغيل عند الإقلاع على مضيف بلا واجهة

## البدء السريع

<Steps>
  <Step title="One-time setup">
    من جذر المستودع، شغّل `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Start the Gateway container">
    ابدأ الحاوية باستخدام `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Run onboarding inside the container">
    شغّل `./scripts/run-openclaw-podman.sh launch setup`، ثم افتح `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Manage the running container from the host CLI">
    اضبط `OPENCLAW_CONTAINER=openclaw`، ثم استخدم أوامر `openclaw` العادية من المضيف.
  </Step>
</Steps>

تفاصيل الإعداد:

- يبني `./scripts/podman/setup.sh` الصورة `openclaw:local` في مخزن Podman بلا صلاحيات جذر افتراضيًا، أو يستخدم `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` إذا ضبطت إحداهما.
- ينشئ `~/.openclaw/openclaw.json` مع `gateway.mode: "local"` إذا كان مفقودًا.
- ينشئ `~/.openclaw/.env` مع `OPENCLAW_GATEWAY_TOKEN` إذا كان مفقودًا.
- بالنسبة إلى عمليات التشغيل اليدوية، يقرأ المساعد قائمة سماح صغيرة فقط من المفاتيح المرتبطة بـ Podman من `~/.openclaw/.env` ويمرر متغيرات بيئة تشغيل صريحة إلى الحاوية؛ ولا يسلّم ملف البيئة كاملًا إلى Podman.

إعداد مُدار بواسطة Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet خيار خاص بـ Linux فقط لأنه يعتمد على خدمات مستخدم systemd.

يمكنك أيضًا ضبط `OPENCLAW_PODMAN_QUADLET=1`.

متغيرات بيئة اختيارية للبناء/الإعداد:

- `OPENCLAW_IMAGE` أو `OPENCLAW_PODMAN_IMAGE` -- استخدم صورة موجودة/مسحوبة بدلًا من بناء `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- ثبّت حزم apt إضافية أثناء بناء الصورة
- `OPENCLAW_EXTENSIONS` -- ثبّت اعتماديات Plugin مسبقًا في وقت البناء
- `OPENCLAW_INSTALL_BROWSER` -- ثبّت Chromium وXvfb مسبقًا لأتمتة المتصفح (اضبطه على `1` للتمكين)

بدء الحاوية:

```bash
./scripts/run-openclaw-podman.sh launch
```

يبدأ السكربت الحاوية باستخدام uid/gid الحاليين لك مع `--userns=keep-id` ويربط حالة OpenClaw لديك داخل الحاوية.

الإعداد الأولي:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

ثم افتح `http://127.0.0.1:18789/` واستخدم الرمز من `~/.openclaw/.env`.

الإعداد الافتراضي لـ CLI على المضيف:

```bash
export OPENCLAW_CONTAINER=openclaw
```

بعد ذلك ستعمل أوامر مثل هذه داخل تلك الحاوية تلقائيًا:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

على macOS، قد تجعل آلة Podman المتصفح يبدو غير محلي بالنسبة إلى Gateway.
إذا أبلغت Control UI عن أخطاء مصادقة الجهاز بعد التشغيل، فاستخدم إرشادات Tailscale في
[Podman وTailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman وTailscale

للوصول عبر HTTPS أو متصفح بعيد، اتبع وثائق Tailscale الرئيسية.

ملاحظة خاصة بـ Podman:

- أبقِ مضيف نشر Podman على `127.0.0.1`.
- فضّل `tailscale serve` المدار من المضيف على `openclaw gateway --tailscale serve`.
- على macOS، إذا كان سياق مصادقة جهاز المتصفح المحلي غير موثوق، فاستخدم وصول Tailscale بدلًا من حلول الأنفاق المحلية المخصصة.

انظر:

- [Tailscale](/ar/gateway/tailscale)
- [Control UI](/ar/web/control-ui)

## Systemd (Quadlet، اختياري)

إذا شغّلت `./scripts/podman/setup.sh --quadlet`، فسيثبّت الإعداد ملف Quadlet في:

```bash
~/.config/containers/systemd/openclaw.container
```

أوامر مفيدة:

- **بدء التشغيل:** `systemctl --user start openclaw.service`
- **إيقاف التشغيل:** `systemctl --user stop openclaw.service`
- **الحالة:** `systemctl --user status openclaw.service`
- **السجلات:** `journalctl --user -u openclaw.service -f`

بعد تعديل ملف Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

لاستمرارية التشغيل عند الإقلاع على مضيفات SSH/بلا واجهة، فعّل lingering لمستخدمك الحالي:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## التهيئة والبيئة والتخزين

- **دليل التهيئة:** `~/.openclaw`
- **دليل مساحة العمل:** `~/.openclaw/workspace`
- **ملف الرمز:** `~/.openclaw/.env`
- **مساعد التشغيل:** `./scripts/run-openclaw-podman.sh`

يربط سكربت التشغيل وQuadlet حالة المضيف داخل الحاوية:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

افتراضيًا، هذه أدلة على المضيف وليست حالة حاوية مجهولة، لذلك تبقى
`openclaw.json` و`auth-profiles.json` لكل وكيل وحالة القنوات/المزوّدين
والجلسات ومساحة العمل بعد استبدال الحاوية.
يزرع إعداد Podman أيضًا `gateway.controlUi.allowedOrigins` لـ `127.0.0.1` و`localhost` على منفذ Gateway المنشور لكي تعمل لوحة التحكم المحلية مع ربط الحاوية غير المعتمد على local loopback.

متغيرات بيئة مفيدة للمشغّل اليدوي:

- `OPENCLAW_PODMAN_CONTAINER` -- اسم الحاوية (`openclaw` افتراضيًا)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- الصورة المراد تشغيلها
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- منفذ المضيف المربوط بمنفذ الحاوية `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- منفذ المضيف المربوط بمنفذ الحاوية `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- واجهة المضيف للمنافذ المنشورة؛ الافتراضي هو `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- وضع ربط Gateway داخل الحاوية؛ الافتراضي هو `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (افتراضي)، أو `auto`، أو `host`

يقرأ المشغّل اليدوي `~/.openclaw/.env` قبل تثبيت الإعدادات الافتراضية النهائية للحاوية/الصورة، لذا يمكنك حفظ هذه القيم هناك.

إذا استخدمت `OPENCLAW_CONFIG_DIR` أو `OPENCLAW_WORKSPACE_DIR` غير افتراضي، فاضبط المتغيرات نفسها لكل من أوامر `./scripts/podman/setup.sh` وأوامر `./scripts/run-openclaw-podman.sh launch` اللاحقة. لا يحفظ المشغّل المحلي في المستودع تجاوزات المسارات المخصصة عبر الصدفات.

ملاحظة Quadlet:

- تحافظ خدمة Quadlet المولّدة عمدًا على شكل افتراضي ثابت ومشدّد: منافذ منشورة على `127.0.0.1`، و`--bind lan` داخل الحاوية، ومساحة أسماء مستخدم `keep-id`.
- تثبّت `OPENCLAW_NO_RESPAWN=1`، و`Restart=on-failure`، و`TimeoutStartSec=300`.
- تنشر كلًا من `127.0.0.1:18789:18789` (Gateway) و`127.0.0.1:18790:18790` (الجسر).
- تقرأ `~/.openclaw/.env` بوصفه `EnvironmentFile` لوقت التشغيل لقيم مثل `OPENCLAW_GATEWAY_TOKEN`، لكنها لا تستهلك قائمة السماح الخاصة بتجاوزات Podman في المشغّل اليدوي.
- إذا احتجت إلى منافذ نشر مخصصة أو مضيف نشر مخصص أو أعلام تشغيل حاوية أخرى، فاستخدم المشغّل اليدوي أو عدّل `~/.config/containers/systemd/openclaw.container` مباشرة، ثم أعد تحميل الخدمة وأعد تشغيلها.

## أوامر مفيدة

- **سجلات الحاوية:** `podman logs -f openclaw`
- **إيقاف الحاوية:** `podman stop openclaw`
- **إزالة الحاوية:** `podman rm -f openclaw`
- **فتح عنوان URL للوحة التحكم من CLI على المضيف:** `openclaw dashboard --no-open`
- **الصحة/الحالة عبر CLI على المضيف:** `openclaw gateway status --deep` (فحص RPC + فحص
  خدمة إضافي)

## استكشاف الأخطاء وإصلاحها

- **رُفض الإذن (EACCES) على التهيئة أو مساحة العمل:** تعمل الحاوية باستخدام `--userns=keep-id` و`--user <your uid>:<your gid>` افتراضيًا. تأكد من أن مسارات التهيئة/مساحة العمل على المضيف مملوكة لمستخدمك الحالي.
- **بدء Gateway محظور (`gateway.mode=local` مفقود):** تأكد من وجود `~/.openclaw/openclaw.json` وأنه يضبط `gateway.mode="local"`. ينشئ `scripts/podman/setup.sh` هذا الملف إذا كان مفقودًا.
- **أوامر CLI الخاصة بالحاوية تصل إلى الهدف الخطأ:** استخدم `openclaw --container <name> ...` صراحة، أو صدّر `OPENCLAW_CONTAINER=<name>` في صدفتك.
- **يفشل `openclaw update` مع `--container`:** هذا متوقع. أعد بناء/سحب الصورة، ثم أعد تشغيل الحاوية أو خدمة Quadlet.
- **خدمة Quadlet لا تبدأ:** شغّل `systemctl --user daemon-reload`، ثم `systemctl --user start openclaw.service`. على الأنظمة بلا واجهة قد تحتاج أيضًا إلى `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux يحظر ربط التحميلات:** اترك سلوك التحميل الافتراضي كما هو؛ يضيف المشغّل `:Z` تلقائيًا على Linux عندما يكون SELinux في وضع الإنفاذ أو السماح.

## ذات صلة

- [Docker](/ar/install/docker)
- [عملية Gateway في الخلفية](/ar/gateway/background-process)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
