---
read_when:
    - تريد Gateway يعمل داخل حاوية باستخدام Podman بدلًا من Docker
summary: تشغيل OpenClaw في حاوية Podman بدون صلاحيات الجذر
title: Podman
x-i18n:
    generated_at: "2026-04-30T08:08:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: bfdcbbdb62c2f8ca2d6d370b742003e6f92f6921a38c00ba19e810d83e350647
    source_path: install/podman.md
    workflow: 16
---

شغّل OpenClaw Gateway في حاوية Podman بلا صلاحيات جذر، تُدار بواسطة مستخدمك الحالي غير الجذر.

النموذج المقصود هو:

- يشغّل Podman حاوية Gateway.
- تكون أداة `openclaw` CLI على المضيف هي مستوى التحكم.
- توجد الحالة الدائمة على المضيف ضمن `~/.openclaw` افتراضيًا.
- تستخدم الإدارة اليومية `openclaw --container <name> ...` بدلًا من `sudo -u openclaw` أو `podman exec` أو مستخدم خدمة منفصل.

## المتطلبات الأساسية

- **Podman** في وضع بلا صلاحيات جذر
- **OpenClaw CLI** مثبّت على المضيف
- **اختياري:** `systemd --user` إذا أردت تشغيلًا تلقائيًا مُدارًا بواسطة Quadlet
- **اختياري:** `sudo` فقط إذا أردت `loginctl enable-linger "$(whoami)"` لاستمرارية التشغيل بعد الإقلاع على مضيف بلا واجهة

## البدء السريع

<Steps>
  <Step title="إعداد لمرة واحدة">
    من جذر المستودع، شغّل `./scripts/podman/setup.sh`.
  </Step>

  <Step title="بدء حاوية Gateway">
    ابدأ الحاوية باستخدام `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="تشغيل الإعداد الأولي داخل الحاوية">
    شغّل `./scripts/run-openclaw-podman.sh launch setup`، ثم افتح `http://127.0.0.1:18789/`.
  </Step>

  <Step title="إدارة الحاوية العاملة من CLI المضيف">
    عيّن `OPENCLAW_CONTAINER=openclaw`، ثم استخدم أوامر `openclaw` العادية من المضيف.
  </Step>
</Steps>

تفاصيل الإعداد:

- ينشئ `./scripts/podman/setup.sh` الصورة `openclaw:local` في مخزن Podman بلا صلاحيات جذر افتراضيًا، أو يستخدم `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` إذا عيّنت أحدهما.
- ينشئ `~/.openclaw/openclaw.json` مع `gateway.mode: "local"` إذا كان مفقودًا.
- ينشئ `~/.openclaw/.env` مع `OPENCLAW_GATEWAY_TOKEN` إذا كان مفقودًا.
- بالنسبة إلى التشغيل اليدوي، يقرأ المساعد قائمة سماح صغيرة فقط من المفاتيح المرتبطة بـ Podman من `~/.openclaw/.env` ويمرر متغيرات بيئة تشغيل صريحة إلى الحاوية؛ ولا يمرر ملف البيئة الكامل إلى Podman.

إعداد مُدار بواسطة Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet خيار خاص بـ Linux فقط لأنه يعتمد على خدمات مستخدم systemd.

يمكنك أيضًا تعيين `OPENCLAW_PODMAN_QUADLET=1`.

متغيرات بيئة البناء/الإعداد الاختيارية:

- `OPENCLAW_IMAGE` أو `OPENCLAW_PODMAN_IMAGE` -- استخدم صورة موجودة/مسحوبة بدلًا من بناء `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- ثبّت حزم apt إضافية أثناء بناء الصورة
- `OPENCLAW_EXTENSIONS` -- ثبّت اعتماديات Plugins مسبقًا في وقت البناء
- `OPENCLAW_INSTALL_BROWSER` -- ثبّت Chromium وXvfb مسبقًا لأتمتة المتصفح (عيّنه إلى `1` للتفعيل)

بدء الحاوية:

```bash
./scripts/run-openclaw-podman.sh launch
```

يبدأ السكربت الحاوية بمعرّف uid/gid الحاليين لديك باستخدام `--userns=keep-id` ويربط حالة OpenClaw لديك داخل الحاوية.

الإعداد الأولي:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

ثم افتح `http://127.0.0.1:18789/` واستخدم الرمز المميز من `~/.openclaw/.env`.

الافتراضي لـ CLI المضيف:

```bash
export OPENCLAW_CONTAINER=openclaw
```

بعد ذلك ستُشغَّل أوامر مثل هذه داخل تلك الحاوية تلقائيًا:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

على macOS، قد تجعل آلة Podman المتصفح يبدو غير محلي بالنسبة إلى Gateway.
إذا أبلغت Control UI عن أخطاء مصادقة الجهاز بعد التشغيل، فاستخدم إرشادات Tailscale في
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

للوصول عبر HTTPS أو متصفح بعيد، اتبع وثائق Tailscale الرئيسية.

ملاحظة خاصة بـ Podman:

- أبقِ مضيف النشر في Podman على `127.0.0.1`.
- فضّل `tailscale serve` المُدار من المضيف على `openclaw gateway --tailscale serve`.
- على macOS، إذا كان سياق مصادقة جهاز المتصفح المحلي غير موثوق، فاستخدم وصول Tailscale بدلًا من حلول الأنفاق المحلية المؤقتة.

انظر:

- [Tailscale](/ar/gateway/tailscale)
- [Control UI](/ar/web/control-ui)

## Systemd (Quadlet، اختياري)

إذا شغّلت `./scripts/podman/setup.sh --quadlet`، فسيثبّت الإعداد ملف Quadlet في:

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

لاستمرارية التشغيل بعد الإقلاع على مضيفات SSH/بلا واجهة، فعّل linger لمستخدمك الحالي:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## الإعدادات والبيئة والتخزين

- **دليل الإعدادات:** `~/.openclaw`
- **دليل مساحة العمل:** `~/.openclaw/workspace`
- **ملف الرمز المميز:** `~/.openclaw/.env`
- **مساعد التشغيل:** `./scripts/run-openclaw-podman.sh`

يربط سكربت التشغيل وQuadlet حالة المضيف داخل الحاوية:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

افتراضيًا تكون هذه أدلة على المضيف، وليست حالة حاوية مجهولة، لذلك تبقى
`openclaw.json` وملفات `auth-profiles.json` لكل وكيل وحالة القنوات/المزوّدين
والجلسات ومساحة العمل بعد استبدال الحاوية.
يزرع إعداد Podman أيضًا `gateway.controlUi.allowedOrigins` لـ `127.0.0.1` و`localhost` على منفذ Gateway المنشور بحيث تعمل لوحة المعلومات المحلية مع ربط الحاوية غير المعتمد على local loopback.

متغيرات بيئة مفيدة للمشغّل اليدوي:

- `OPENCLAW_PODMAN_CONTAINER` -- اسم الحاوية (`openclaw` افتراضيًا)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- الصورة المطلوب تشغيلها
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- منفذ المضيف المربوط بحاوية `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- منفذ المضيف المربوط بحاوية `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- واجهة المضيف للمنافذ المنشورة؛ الافتراضي هو `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- وضع ربط Gateway داخل الحاوية؛ الافتراضي هو `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (افتراضي)، أو `auto`، أو `host`

يقرأ المشغّل اليدوي `~/.openclaw/.env` قبل إنهاء افتراضات الحاوية/الصورة، لذا يمكنك حفظ هذه القيم هناك.

إذا استخدمت `OPENCLAW_CONFIG_DIR` أو `OPENCLAW_WORKSPACE_DIR` غير افتراضي، فعيّن المتغيرات نفسها لكل من أوامر `./scripts/podman/setup.sh` ولاحقًا `./scripts/run-openclaw-podman.sh launch`. لا يحفظ المشغّل المحلي في المستودع تجاوزات المسارات المخصصة عبر جلسات الطرفية.

ملاحظة Quadlet:

- تحتفظ خدمة Quadlet المُولّدة عمدًا بشكل افتراضي ثابت ومقوّى: منافذ منشورة على `127.0.0.1`، و`--bind lan` داخل الحاوية، ونطاق مستخدم `keep-id`.
- تثبّت `OPENCLAW_NO_RESPAWN=1` و`Restart=on-failure` و`TimeoutStartSec=300`.
- تنشر كِلا المنفذين `127.0.0.1:18789:18789` (Gateway) و`127.0.0.1:18790:18790` (الجسر).
- تقرأ `~/.openclaw/.env` كملف `EnvironmentFile` في وقت التشغيل لقيم مثل `OPENCLAW_GATEWAY_TOKEN`، لكنها لا تستهلك قائمة سماح التجاوزات الخاصة بـ Podman في المشغّل اليدوي.
- إذا احتجت إلى منافذ نشر مخصصة، أو مضيف نشر مخصص، أو علامات تشغيل حاوية أخرى، فاستخدم المشغّل اليدوي أو حرّر `~/.config/containers/systemd/openclaw.container` مباشرة، ثم أعد التحميل وأعد تشغيل الخدمة.

## أوامر مفيدة

- **سجلات الحاوية:** `podman logs -f openclaw`
- **إيقاف الحاوية:** `podman stop openclaw`
- **إزالة الحاوية:** `podman rm -f openclaw`
- **فتح عنوان URL للوحة المعلومات من CLI المضيف:** `openclaw dashboard --no-open`
- **الصحة/الحالة عبر CLI المضيف:** `openclaw gateway status --deep` (فحص RPC + فحص خدمة
  إضافي)

## استكشاف الأخطاء وإصلاحها

- **رُفض الإذن (EACCES) في الإعدادات أو مساحة العمل:** تعمل الحاوية باستخدام `--userns=keep-id` و`--user <your uid>:<your gid>` افتراضيًا. تأكد من أن مسارات إعدادات/مساحة عمل المضيف مملوكة لمستخدمك الحالي.
- **بدء Gateway محظور (`gateway.mode=local` مفقود):** تأكد من وجود `~/.openclaw/openclaw.json` وأنه يعيّن `gateway.mode="local"`. ينشئ `scripts/podman/setup.sh` هذا الملف إذا كان مفقودًا.
- **أوامر CLI للحاوية تستهدف الوجهة الخطأ:** استخدم `openclaw --container <name> ...` صراحةً، أو صدّر `OPENCLAW_CONTAINER=<name>` في الطرفية.
- **يفشل `openclaw update` مع `--container`:** هذا متوقع. أعد بناء/سحب الصورة، ثم أعد تشغيل الحاوية أو خدمة Quadlet.
- **خدمة Quadlet لا تبدأ:** شغّل `systemctl --user daemon-reload`، ثم `systemctl --user start openclaw.service`. على الأنظمة بلا واجهة قد تحتاج أيضًا إلى `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux يحظر ربط التحميلات:** اترك سلوك التحميل الافتراضي كما هو؛ يضيف المشغّل `:Z` تلقائيًا على Linux عندما يكون SELinux في وضع الإنفاذ أو السماح.

## ذات صلة

- [Docker](/ar/install/docker)
- [عملية Gateway في الخلفية](/ar/gateway/background-process)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
