---
read_when:
    - تريد تشغيل Gateway داخل حاوية باستخدام Podman بدلًا من Docker
summary: شغّل OpenClaw في حاوية Podman بلا صلاحيات الجذر
title: Podman
x-i18n:
    generated_at: "2026-06-27T17:53:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f6950956551dc3c274db33712cf66632fb5facbca4954bf67c30a8bff740c2f
    source_path: install/podman.md
    workflow: 16
---

شغّل OpenClaw Gateway داخل حاوية Podman بلا جذر، تُدار بواسطة مستخدمك الحالي غير الجذري.

النموذج المقصود هو:

- يشغّل Podman حاوية Gateway.
- يكون `openclaw` CLI على المضيف هو مستوى التحكم.
- تكون الحالة الدائمة على المضيف تحت `~/.openclaw` افتراضيًا.
- تستخدم الإدارة اليومية `openclaw --container <name> ...` بدلًا من `sudo -u openclaw` أو `podman exec` أو مستخدم خدمة منفصل.

## المتطلبات المسبقة

- **Podman** في وضع بلا جذر
- **OpenClaw CLI** مثبّت على المضيف
- **اختياري:** `systemd --user` إذا كنت تريد تشغيلًا تلقائيًا مُدارًا بواسطة Quadlet
- **اختياري:** `sudo` فقط إذا كنت تريد `loginctl enable-linger "$(whoami)"` لاستمرارية التشغيل بعد الإقلاع على مضيف بلا شاشة

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

- يبني `./scripts/podman/setup.sh` الصورة `openclaw:local` في مخزن Podman بلا جذر لديك افتراضيًا، أو يستخدم `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` إذا ضبطت أحدهما.
- ينشئ `~/.openclaw/openclaw.json` مع `gateway.mode: "local"` إذا كان مفقودًا.
- ينشئ `~/.openclaw/.env` مع `OPENCLAW_GATEWAY_TOKEN` إذا كان مفقودًا.
- بالنسبة لعمليات التشغيل اليدوية، يقرأ المساعد قائمة سماح صغيرة فقط من المفاتيح المتعلقة بـ Podman من `~/.openclaw/.env` ويمرر متغيرات بيئة تشغيل صريحة إلى الحاوية؛ ولا يمرر ملف البيئة كاملًا إلى Podman.

إعداد مُدار بواسطة Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet خيار خاص بـ Linux فقط لأنه يعتمد على خدمات مستخدم systemd.

يمكنك أيضًا ضبط `OPENCLAW_PODMAN_QUADLET=1`.

متغيرات بيئة اختيارية للبناء/الإعداد:

- `OPENCLAW_IMAGE` أو `OPENCLAW_PODMAN_IMAGE` -- استخدم صورة موجودة/مجلوبة بدلًا من بناء `openclaw:local`
- `OPENCLAW_IMAGE_APT_PACKAGES` -- ثبّت حزم apt إضافية أثناء بناء الصورة (يقبل أيضًا `OPENCLAW_DOCKER_APT_PACKAGES` القديم)
- `OPENCLAW_IMAGE_PIP_PACKAGES` -- ثبّت حزم Python إضافية أثناء بناء الصورة؛ ثبّت الإصدارات واستخدم فقط فهارس الحزم التي تثق بها
- `OPENCLAW_EXTENSIONS` -- ثبّت اعتماديات Plugin مسبقًا وقت البناء
- `OPENCLAW_INSTALL_BROWSER` -- ثبّت Chromium و Xvfb مسبقًا لأتمتة المتصفح (اضبطه على `1` للتفعيل)

بدء الحاوية:

```bash
./scripts/run-openclaw-podman.sh launch
```

يبدأ السكربت الحاوية بمعرّف المستخدم/المجموعة الحاليين لديك باستخدام `--userns=keep-id` ويربط حالة OpenClaw لديك داخل الحاوية.

الإعداد الأولي:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

ثم افتح `http://127.0.0.1:18789/` واستخدم الرمز من `~/.openclaw/.env`.

مصادقة النموذج في Podman:

- استخدم المصادقة المُدارة بواسطة OpenClaw أثناء الإعداد: مفاتيح Anthropic API لـ Anthropic، أو مصادقة OpenAI Codex عبر OAuth في المتصفح/رمز الجهاز لـ OpenAI المدعوم بـ Codex.
- لا يربط مشغّل Podman مجلدات بيانات اعتماد CLI على المضيف مثل `~/.claude` أو `~/.codex` داخل حاوية الإعداد أو Gateway.
- تسجيلات دخول CLI الموجودة على المضيف هي مسارات تسهيل على المضيف نفسه. بالنسبة لتثبيتات الحاويات، أبقِ مصادقة المزوّد في حالة `~/.openclaw` المربوطة التي يديرها الإعداد.

افتراضي CLI على المضيف:

```bash
export OPENCLAW_CONTAINER=openclaw
```

بعد ذلك، ستُشغَّل أوامر مثل هذه داخل تلك الحاوية تلقائيًا:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

على macOS، قد تجعل آلة Podman المتصفح يبدو غير محلي بالنسبة إلى Gateway.
إذا أبلغت Control UI عن أخطاء مصادقة الجهاز بعد التشغيل، فاستخدم إرشادات Tailscale في
[Podman و Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman و Tailscale

للوصول عبر HTTPS أو متصفح بعيد، اتبع وثائق Tailscale الرئيسية.

ملاحظة خاصة بـ Podman:

- أبقِ مضيف نشر Podman على `127.0.0.1`.
- فضّل `tailscale serve` المُدار من المضيف على `openclaw gateway --tailscale serve`.
- على macOS، إذا كان سياق مصادقة جهاز المتصفح المحلي غير موثوق، فاستخدم وصول Tailscale بدلًا من حلول الأنفاق المحلية المخصصة.

راجع:

- [Tailscale](/ar/gateway/tailscale)
- [Control UI](/ar/web/control-ui)

## Systemd (Quadlet، اختياري)

إذا شغّلت `./scripts/podman/setup.sh --quadlet`، يثبّت الإعداد ملف Quadlet في:

```bash
~/.config/containers/systemd/openclaw.container
```

أوامر مفيدة:

- **بدء:** `systemctl --user start openclaw.service`
- **إيقاف:** `systemctl --user stop openclaw.service`
- **الحالة:** `systemctl --user status openclaw.service`
- **السجلات:** `journalctl --user -u openclaw.service -f`

بعد تعديل ملف Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

لاستمرارية التشغيل بعد الإقلاع على مضيفات SSH/بلا شاشة، فعّل الإبقاء لمستخدمك الحالي:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## الإعدادات والبيئة والتخزين

- **دليل الإعدادات:** `~/.openclaw`
- **دليل مساحة العمل:** `~/.openclaw/workspace`
- **ملف الرمز:** `~/.openclaw/.env`
- **مساعد التشغيل:** `./scripts/run-openclaw-podman.sh`

يربط سكربت التشغيل و Quadlet حالة المضيف داخل الحاوية:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

افتراضيًا، هذه أدلة مضيف وليست حالة حاوية مجهولة، لذلك تبقى
`openclaw.json`، وملف `auth-profiles.json` لكل وكيل، وحالة القنوات/المزوّدين،
والجلسات، ومساحة العمل بعد استبدال الحاوية.
كما يجهّز إعداد Podman `gateway.controlUi.allowedOrigins` لـ `127.0.0.1` و `localhost` على منفذ Gateway المنشور لكي تعمل لوحة المعلومات المحلية مع ربط الحاوية غير المعتمد على loopback.

متغيرات بيئة مفيدة للمشغّل اليدوي:

- `OPENCLAW_PODMAN_CONTAINER` -- اسم الحاوية (`openclaw` افتراضيًا)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- الصورة المراد تشغيلها
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- منفذ المضيف المعين إلى منفذ الحاوية `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- منفذ المضيف المعين إلى منفذ الحاوية `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- واجهة المضيف للمنافذ المنشورة؛ الافتراضي هو `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- وضع ربط Gateway داخل الحاوية؛ الافتراضي هو `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (الافتراضي)، أو `auto`، أو `host`

يقرأ المشغّل اليدوي `~/.openclaw/.env` قبل تثبيت افتراضيات الحاوية/الصورة، لذلك يمكنك حفظ هذه القيم هناك.

إذا استخدمت `OPENCLAW_CONFIG_DIR` أو `OPENCLAW_WORKSPACE_DIR` غير افتراضي، فاضبط المتغيرات نفسها لكل من أوامر `./scripts/podman/setup.sh` وأوامر `./scripts/run-openclaw-podman.sh launch` اللاحقة. لا يحفظ المشغّل المحلي في المستودع تجاوزات المسارات المخصصة عبر جلسات shell.

ملاحظة Quadlet:

- تحافظ خدمة Quadlet المُولّدة عمدًا على شكل افتراضي ثابت ومُحصّن: منافذ منشورة على `127.0.0.1`، و `--bind lan` داخل الحاوية، ومساحة أسماء مستخدم `keep-id`.
- تثبّت `OPENCLAW_NO_RESPAWN=1`، و `Restart=on-failure`، و `TimeoutStartSec=300`.
- تنشر كلًا من `127.0.0.1:18789:18789` (Gateway) و `127.0.0.1:18790:18790` (الجسر).
- تقرأ `~/.openclaw/.env` كملف `EnvironmentFile` وقت التشغيل لقيم مثل `OPENCLAW_GATEWAY_TOKEN`، لكنها لا تستهلك قائمة السماح الخاصة بتجاوزات Podman للمشغّل اليدوي.
- إذا كنت تحتاج إلى منافذ نشر مخصصة، أو مضيف نشر، أو أعلام أخرى لتشغيل الحاوية، فاستخدم المشغّل اليدوي أو عدّل `~/.config/containers/systemd/openclaw.container` مباشرة، ثم أعد تحميل الخدمة وأعد تشغيلها.

## أوامر مفيدة

- **سجلات الحاوية:** `podman logs -f openclaw`
- **إيقاف الحاوية:** `podman stop openclaw`
- **إزالة الحاوية:** `podman rm -f openclaw`
- **فتح عنوان URL للوحة المعلومات من CLI على المضيف:** `openclaw dashboard --no-open`
- **الصحة/الحالة عبر CLI على المضيف:** `openclaw gateway status --deep` (فحص RPC + فحص خدمة
  إضافي)

## استكشاف الأخطاء وإصلاحها

- **رفض الإذن (EACCES) على الإعدادات أو مساحة العمل:** تعمل الحاوية باستخدام `--userns=keep-id` و `--user <your uid>:<your gid>` افتراضيًا. تأكد من أن مسارات الإعدادات/مساحة العمل على المضيف مملوكة لمستخدمك الحالي.
- **بدء Gateway محظور (`gateway.mode=local` مفقود):** تأكد من وجود `~/.openclaw/openclaw.json` وأنه يضبط `gateway.mode="local"`. ينشئ `scripts/podman/setup.sh` هذا إذا كان مفقودًا.
- **أوامر CLI داخل الحاوية تستهدف وجهة خاطئة:** استخدم `openclaw --container <name> ...` صراحة، أو صدّر `OPENCLAW_CONTAINER=<name>` في shell لديك.
- **فشل `openclaw update` مع `--container`:** هذا متوقع. أعد بناء/جلب الصورة، ثم أعد تشغيل الحاوية أو خدمة Quadlet.
- **خدمة Quadlet لا تبدأ:** شغّل `systemctl --user daemon-reload`، ثم `systemctl --user start openclaw.service`. على الأنظمة بلا شاشة قد تحتاج أيضًا إلى `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux يحظر ربط التحميلات:** اترك سلوك التحميل الافتراضي كما هو؛ يضيف المشغّل `:Z` تلقائيًا على Linux عندما يكون SELinux في وضع الفرض أو السماح.

## ذو صلة

- [Docker](/ar/install/docker)
- [عملية Gateway في الخلفية](/ar/gateway/background-process)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
