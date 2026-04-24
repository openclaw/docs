---
read_when:
    - تريد Gateway داخل حاوية باستخدام Podman بدلًا من Docker
summary: شغّل OpenClaw داخل حاوية Podman بلا جذر
title: Podman
x-i18n:
    generated_at: "2026-04-24T07:49:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 559ac707e0a3ef173d0300ee2f8c6f4ed664ff5afbf1e3f1848312a9d441e9e4
    source_path: install/podman.md
    workflow: 15
---

شغّل OpenClaw Gateway داخل حاوية Podman بلا جذر، وتحت إدارة المستخدم الحالي غير الجذر.

النموذج المقصود هو:

- يقوم Podman بتشغيل حاوية gateway.
- يكون `openclaw` CLI على المضيف هو مستوى التحكم.
- تعيش الحالة الدائمة على المضيف تحت `~/.openclaw` افتراضيًا.
- تستخدم الإدارة اليومية `openclaw --container <name> ...` بدلًا من `sudo -u openclaw` أو `podman exec` أو مستخدم خدمة منفصل.

## المتطلبات المسبقة

- **Podman** في وضع rootless
- **OpenClaw CLI** مثبت على المضيف
- **اختياري:** `systemd --user` إذا كنت تريد تشغيلًا تلقائيًا مُدارًا عبر Quadlet
- **اختياري:** `sudo` فقط إذا كنت تريد `loginctl enable-linger "$(whoami)"` للاستمرارية بعد الإقلاع على مضيف بلا واجهة

## البدء السريع

<Steps>
  <Step title="إعداد لمرة واحدة">
    من جذر المستودع، شغّل `./scripts/podman/setup.sh`.
  </Step>

  <Step title="ابدأ حاوية Gateway">
    ابدأ الحاوية باستخدام `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="شغّل الإعداد الأولي داخل الحاوية">
    شغّل `./scripts/run-openclaw-podman.sh launch setup`، ثم افتح `http://127.0.0.1:18789/`.
  </Step>

  <Step title="أدِر الحاوية العاملة من CLI على المضيف">
    اضبط `OPENCLAW_CONTAINER=openclaw`، ثم استخدم أوامر `openclaw` العادية من المضيف.
  </Step>
</Steps>

تفاصيل الإعداد:

- يبني `./scripts/podman/setup.sh` الصورة `openclaw:local` في مخزن Podman rootless الخاص بك افتراضيًا، أو يستخدم `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` إذا قمت بضبط أحدهما.
- ينشئ `~/.openclaw/openclaw.json` مع `gateway.mode: "local"` إذا كان مفقودًا.
- ينشئ `~/.openclaw/.env` مع `OPENCLAW_GATEWAY_TOKEN` إذا كان مفقودًا.
- بالنسبة إلى التشغيلات اليدوية، يقرأ المساعد قائمة سماح صغيرة فقط من مفاتيح Podman ذات الصلة من `~/.openclaw/.env` ويمرر متغيرات بيئة وقت تشغيل صريحة إلى الحاوية؛ وهو لا يمرر ملف البيئة الكامل إلى Podman.

إعداد مُدار عبر Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

يُعد Quadlet خيارًا خاصًا بـ Linux فقط لأنه يعتمد على خدمات مستخدم systemd.

يمكنك أيضًا ضبط `OPENCLAW_PODMAN_QUADLET=1`.

متغيرات بيئة اختيارية للبناء/الإعداد:

- `OPENCLAW_IMAGE` أو `OPENCLAW_PODMAN_IMAGE` -- استخدام صورة موجودة/مسحوبة بدلًا من بناء `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- تثبيت حزم apt إضافية أثناء بناء الصورة
- `OPENCLAW_EXTENSIONS` -- تثبيت تبعيات Plugin مسبقًا وقت البناء

بدء الحاوية:

```bash
./scripts/run-openclaw-podman.sh launch
```

يبدأ النص الحاوية بمعرّف uid/gid الحاليين لديك باستخدام `--userns=keep-id` ويعمل bind-mount لحالة OpenClaw داخل الحاوية.

الإعداد الأولي:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

ثم افتح `http://127.0.0.1:18789/` واستخدم الرمز الموجود في `~/.openclaw/.env`.

الافتراضي لـ CLI على المضيف:

```bash
export OPENCLAW_CONTAINER=openclaw
```

بعد ذلك ستعمل أوامر مثل هذه داخل تلك الحاوية تلقائيًا:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # يتضمن فحصًا إضافيًا للخدمات
openclaw doctor
openclaw channels login
```

على macOS، قد يجعل Podman machine المتصفح يبدو غير محلي بالنسبة إلى gateway.
إذا أبلغت Control UI عن أخطاء في مصادقة الجهاز بعد التشغيل، فاستخدم إرشادات Tailscale في
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

بالنسبة إلى HTTPS أو الوصول البعيد من المتصفح، اتبع وثائق Tailscale الرئيسية.

ملاحظة خاصة بـ Podman:

- أبقِ مضيف النشر الخاص بـ Podman عند `127.0.0.1`.
- فضّل `tailscale serve` المُدار من المضيف بدلًا من `openclaw gateway --tailscale serve`.
- على macOS، إذا كان سياق مصادقة جهاز المتصفح المحلي غير موثوق، فاستخدم وصول Tailscale بدلًا من حلول الأنفاق المحلية المخصصة.

راجع:

- [Tailscale](/ar/gateway/tailscale)
- [Control UI](/ar/web/control-ui)

## Systemd ‏(Quadlet، اختياري)

إذا شغّلت `./scripts/podman/setup.sh --quadlet`، فإن الإعداد يثبّت ملف Quadlet في:

```bash
~/.config/containers/systemd/openclaw.container
```

أوامر مفيدة:

- **البدء:** `systemctl --user start openclaw.service`
- **الإيقاف:** `systemctl --user stop openclaw.service`
- **الحالة:** `systemctl --user status openclaw.service`
- **السجلات:** `journalctl --user -u openclaw.service -f`

بعد تحرير ملف Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

وبالنسبة إلى الاستمرارية بعد الإقلاع على مضيفات SSH/بلا واجهة، فعّل lingering للمستخدم الحالي:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## الإعدادات، والبيئة، والتخزين

- **دليل الإعدادات:** `~/.openclaw`
- **دليل مساحة العمل:** `~/.openclaw/workspace`
- **ملف الرمز:** `~/.openclaw/.env`
- **مساعد التشغيل:** `./scripts/run-openclaw-podman.sh`

يقوم نص التشغيل وQuadlet بعمل bind-mount لحالة المضيف داخل الحاوية:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

افتراضيًا تكون هذه أدلة على المضيف، وليست حالة حاوية مجهولة، لذلك
تبقى `openclaw.json`، و`auth-profiles.json` لكل وكيل، وحالة القنوات/المزوّدين،
والجلسات، ومساحة العمل بعد استبدال الحاوية.
كما أن إعداد Podman يزرع أيضًا `gateway.controlUi.allowedOrigins` لكل من `127.0.0.1` و`localhost` على منفذ gateway المنشور بحيث تعمل لوحة المعلومات المحلية مع ربط الحاوية غير المعتمد على local loopback.

متغيرات بيئة مفيدة لمشغّل التشغيل اليدوي:

- `OPENCLAW_PODMAN_CONTAINER` -- اسم الحاوية (`openclaw` افتراضيًا)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- الصورة المطلوب تشغيلها
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- منفذ المضيف المربوط بمنفذ الحاوية `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- منفذ المضيف المربوط بمنفذ الحاوية `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- واجهة المضيف للمنافذ المنشورة؛ والافتراضي هو `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- وضع ربط gateway داخل الحاوية؛ والافتراضي هو `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (الافتراضي)، أو `auto`، أو `host`

يقرأ مشغّل التشغيل اليدوي `~/.openclaw/.env` قبل إنهاء القيم الافتراضية للحاوية/الصورة، لذا يمكنك حفظ هذه القيم هناك.

إذا كنت تستخدم `OPENCLAW_CONFIG_DIR` أو `OPENCLAW_WORKSPACE_DIR` غير الافتراضيين، فاضبط المتغيرات نفسها لكل من `./scripts/podman/setup.sh` وأوامر `./scripts/run-openclaw-podman.sh launch` اللاحقة. ولا يحتفظ المشغّل المحلي في المستودع بتجاوزات المسارات المخصصة عبر shells المختلفة.

ملاحظة Quadlet:

- تحافظ خدمة Quadlet المُولَّدة عمدًا على شكل افتراضي ثابت ومقوّى: منافذ منشورة على `127.0.0.1`، و`--bind lan` داخل الحاوية، ومساحة أسماء مستخدم `keep-id`.
- وهي تثبّت `OPENCLAW_NO_RESPAWN=1` و`Restart=on-failure` و`TimeoutStartSec=300`.
- كما تنشر كلا المنفذين `127.0.0.1:18789:18789` ‏(gateway) و`127.0.0.1:18790:18790` ‏(bridge).
- وتقرأ `~/.openclaw/.env` بوصفه `EnvironmentFile` وقت تشغيل لقيم مثل `OPENCLAW_GATEWAY_TOKEN`، لكنها لا تستهلك قائمة السماح الخاصة بالتجاوزات المرتبطة بـ Podman في المشغّل اليدوي.
- وإذا كنت تحتاج إلى منافذ نشر مخصصة، أو مضيف نشر، أو أعلام تشغيل حاوية أخرى، فاستخدم المشغّل اليدوي أو حرر `~/.config/containers/systemd/openclaw.container` مباشرةً، ثم أعد تحميل الخدمة وأعد تشغيلها.

## أوامر مفيدة

- **سجلات الحاوية:** `podman logs -f openclaw`
- **إيقاف الحاوية:** `podman stop openclaw`
- **إزالة الحاوية:** `podman rm -f openclaw`
- **فتح عنوان URL للوحة المعلومات من CLI على المضيف:** `openclaw dashboard --no-open`
- **السلامة/الحالة عبر CLI على المضيف:** `openclaw gateway status --deep` ‏(فحص RPC + فحص
  إضافي للخدمات)

## استكشاف الأخطاء وإصلاحها

- **رفض الإذن (EACCES) على الإعدادات أو مساحة العمل:** تعمل الحاوية باستخدام `--userns=keep-id` و`--user <your uid>:<your gid>` افتراضيًا. تأكد من أن مسارات الإعدادات/مساحة العمل على المضيف مملوكة للمستخدم الحالي.
- **تم حظر بدء Gateway (غياب `gateway.mode=local`):** تأكد من أن `~/.openclaw/openclaw.json` موجود ويضبط `gateway.mode="local"`. وينشئ `scripts/podman/setup.sh` هذا الملف إذا كان مفقودًا.
- **تصيب أوامر CLI الخاصة بالحاوية هدفًا خاطئًا:** استخدم `openclaw --container <name> ...` صراحةً، أو صدّر `OPENCLAW_CONTAINER=<name>` في shell لديك.
- **يفشل `openclaw update` مع `--container`:** هذا متوقع. أعد بناء/سحب الصورة، ثم أعد تشغيل الحاوية أو خدمة Quadlet.
- **لا تبدأ خدمة Quadlet:** شغّل `systemctl --user daemon-reload`، ثم `systemctl --user start openclaw.service`. وعلى الأنظمة بلا واجهة قد تحتاج أيضًا إلى `sudo loginctl enable-linger "$(whoami)"`.
- **يحظر SELinux عمليات bind mount:** اترك سلوك mount الافتراضي كما هو؛ إذ يضيف المشغّل تلقائيًا `:Z` على Linux عندما يكون SELinux في وضع enforcing أو permissive.

## ذو صلة

- [Docker](/ar/install/docker)
- [عملية Gateway في الخلفية](/ar/gateway/background-process)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
