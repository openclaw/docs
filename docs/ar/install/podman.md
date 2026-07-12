---
read_when:
    - تريد Gateway تعمل داخل حاوية باستخدام Podman بدلًا من Docker
summary: تشغيل OpenClaw في حاوية Podman من دون صلاحيات الجذر
title: Podman
x-i18n:
    generated_at: "2026-07-12T06:00:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2db1f2b0413d7b9e1b2007aaae2da9d07fa44a1b52901d4a6cbc6274e54567f1
    source_path: install/podman.md
    workflow: 16
---

شغّل OpenClaw Gateway في حاوية Podman بلا صلاحيات الجذر، يديرها مستخدمك الحالي الذي لا يملك صلاحيات الجذر.

النموذج:

- يشغّل Podman حاوية Gateway.
- تمثّل واجهة `openclaw` CLI على المضيف مستوى التحكم.
- توجد الحالة الدائمة على المضيف ضمن `~/.openclaw` افتراضيًا.
- تستخدم الإدارة اليومية `openclaw --container <name> ...` بدلًا من `sudo -u openclaw` أو `podman exec` أو مستخدم خدمة منفصل.

## المتطلبات الأساسية

- **Podman** في وضع بلا صلاحيات الجذر
- **OpenClaw CLI** مثبّتة على المضيف
- **اختياري:** `systemd --user` إذا كنت تريد بدءًا تلقائيًا مُدارًا بواسطة Quadlet
- **اختياري:** `sudo` فقط إذا كنت تريد استخدام `loginctl enable-linger "$(whoami)"` لاستمرار التشغيل عند الإقلاع على مضيف بلا واجهة رسومية

## البدء السريع

<Steps>
  <Step title="الإعداد لمرة واحدة">
    من جذر المستودع، شغّل `./scripts/podman/setup.sh`.

    يبني هذا `openclaw:local` في مخزن Podman بلا صلاحيات الجذر الخاص بك (أو يسحب `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` إذا كان مضبوطًا)، وينشئ `~/.openclaw/openclaw.json` بالقيمة `gateway.mode: "local"` إذا كان مفقودًا، وينشئ `~/.openclaw/.env` مع `OPENCLAW_GATEWAY_TOKEN` مولّد إذا كان مفقودًا.

    متغيرات البيئة الاختيارية لوقت البناء:

    | المتغير | التأثير |
    | --- | --- |
    | `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` | استخدام صورة موجودة/مسحوبة بدلًا من بناء `openclaw:local` |
    | `OPENCLAW_IMAGE_APT_PACKAGES` | تثبيت حزم apt إضافية أثناء بناء الصورة (يقبل أيضًا `OPENCLAW_DOCKER_APT_PACKAGES` القديم) |
    | `OPENCLAW_IMAGE_PIP_PACKAGES` | تثبيت حزم Python إضافية أثناء بناء الصورة؛ ثبّت الإصدارات واستخدم فقط فهارس الحزم التي تثق بها |
    | `OPENCLAW_EXTENSIONS` | ترجمة/تحزيم الإضافات المحددة المدعومة وتثبيت اعتماديات وقت التشغيل الخاصة بها |
    | `OPENCLAW_INSTALL_BROWSER` | تثبيت Chromium وXvfb مسبقًا لأتمتة المتصفح (اضبطه على `1`) |

    لاستخدام إعداد مُدار بواسطة Quadlet بدلًا من ذلك (Linux + خدمات مستخدم systemd فقط):

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    أو اضبط `OPENCLAW_PODMAN_QUADLET=1`.

  </Step>

  <Step title="بدء حاوية Gateway">
    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

    يبدأ الحاوية باستخدام uid/gid الحاليين لك مع `--userns=keep-id` ويربط حالة OpenClaw الخاصة بك داخل الحاوية.

  </Step>

  <Step title="تشغيل الإعداد الأولي داخل الحاوية">
    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    ثم افتح `http://127.0.0.1:18789/` واستخدم الرمز المميز من `~/.openclaw/.env`.

    مصادقة النموذج: استخدم المصادقة التي يديرها OpenClaw أثناء الإعداد (مفاتيح Anthropic API، أو مصادقة OpenAI Codex عبر OAuth في المتصفح/رمز الجهاز لخدمة OpenAI المدعومة بواسطة Codex). لا يربط مشغّل Podman مجلدات بيانات اعتماد CLI على المضيف، مثل `~/.claude` أو `~/.codex`، داخل حاوية الإعداد أو Gateway. تسجيلات دخول CLI الموجودة على المضيف ليست سوى مسارات تسهيل على المضيف نفسه — عند التثبيت داخل حاويات، احتفظ بمصادقة المزوّد في حالة `~/.openclaw` المرتبطة التي يديرها الإعداد.

  </Step>

  <Step title="إدارة الحاوية قيد التشغيل من CLI المضيف">
    ```bash
    export OPENCLAW_CONTAINER=openclaw
    ```

    بعد ذلك، تُشغّل أوامر `openclaw` العادية تلقائيًا داخل تلك الحاوية:

    ```bash
    openclaw dashboard --no-open
    openclaw gateway status --deep   # includes extra service scan
    openclaw doctor
    openclaw channels login
    ```

    على macOS، قد تجعل آلة Podman المتصفح يبدو غير محلي بالنسبة إلى Gateway. إذا أبلغت واجهة التحكم عن أخطاء مصادقة الجهاز بعد التشغيل، فاستخدم إرشادات Tailscale في [Podman وTailscale](#podman-and-tailscale).

  </Step>
</Steps>

لا يقرأ المشغّل اليدوي سوى قائمة سماح صغيرة من المفاتيح المرتبطة بـPodman من `~/.openclaw/.env`، ويمرّر متغيرات بيئة وقت التشغيل صراحةً إلى الحاوية؛ ولا يمرّر ملف البيئة كاملًا إلى Podman.

<a id="podman-and-tailscale"></a>

## Podman وTailscale

للوصول عبر HTTPS أو من متصفح بعيد، اتبع وثائق Tailscale الرئيسية.

ملاحظات خاصة بـPodman:

- أبقِ مضيف النشر في Podman مضبوطًا على `127.0.0.1`.
- فضّل `tailscale serve` المُدار بواسطة المضيف على `openclaw gateway --tailscale serve`.
- على macOS، إذا كان سياق مصادقة الجهاز في المتصفح المحلي غير موثوق، فاستخدم الوصول عبر Tailscale بدلًا من حلول الأنفاق المحلية المؤقتة.

راجع [Tailscale](/ar/gateway/tailscale) و[واجهة التحكم](/ar/web/control-ui).

## Systemd ‏(Quadlet، اختياري)

إذا شغّلت `./scripts/podman/setup.sh --quadlet`، فسيثبّت الإعداد ملف Quadlet في `~/.config/containers/systemd/openclaw.container`.

| الإجراء | الأمر                                      |
| ------ | ------------------------------------------ |
| البدء  | `systemctl --user start openclaw.service`  |
| الإيقاف | `systemctl --user stop openclaw.service`   |
| الحالة | `systemctl --user status openclaw.service` |
| السجلات | `journalctl --user -u openclaw.service -f` |

بعد تعديل ملف Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

لاستمرار التشغيل عند الإقلاع على مضيفات SSH/بلا واجهة رسومية، فعّل الاستمرار لمستخدمك الحالي:

```bash
sudo loginctl enable-linger "$(whoami)"
```

تحافظ خدمة Quadlet المولّدة على بنية افتراضية ثابتة ومحصّنة: منافذ منشورة على `127.0.0.1` ‏(Gateway على `18789` والجسر على `18790`)، و`--bind lan` داخل الحاوية، ونطاق أسماء المستخدم `keep-id`، و`OPENCLAW_NO_RESPAWN=1`، و`Restart=on-failure`، و`TimeoutStartSec=300`. تقرأ `~/.openclaw/.env` بوصفه `EnvironmentFile` لوقت التشغيل للحصول على قيم مثل `OPENCLAW_GATEWAY_TOKEN`، لكنها لا تستخدم قائمة السماح الخاصة بتجاوزات Podman للمشغّل اليدوي. لتخصيص منافذ النشر أو مضيف النشر أو خيارات تشغيل الحاوية الأخرى، استخدم المشغّل اليدوي بدلًا من ذلك، أو عدّل `~/.config/containers/systemd/openclaw.container` مباشرةً ثم أعد تحميل الخدمة وتشغيلها.

## الإعداد ومتغيرات البيئة والتخزين

- **دليل الإعداد:** `~/.openclaw`
- **دليل مساحة العمل:** `~/.openclaw/workspace`
- **ملف الرمز المميز:** `~/.openclaw/.env`
- **مساعد التشغيل:** `./scripts/run-openclaw-podman.sh`

يربط برنامج التشغيل وQuadlet حالة المضيف داخل الحاوية: `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`، و`OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`. تكون هذه افتراضيًا أدلة على المضيف، وليست حالة مجهولة داخل الحاوية، ولذلك تبقى ملفات `openclaw.json` و`auth-profiles.json` الخاصة بكل وكيل، وحالة القنوات/المزوّدين، والجلسات، ومساحة العمل بعد استبدال الحاوية. يضيف الإعداد أيضًا قيم `gateway.controlUi.allowedOrigins` لـ`127.0.0.1` و`localhost` على منفذ Gateway المنشور، كي تعمل لوحة المعلومات المحلية مع ربط الحاوية غير المحلي.

متغيرات بيئة مفيدة للمشغّل اليدوي (احتفظ بها في `~/.openclaw/.env`؛ يقرأ المشغّل ذلك الملف قبل اعتماد الإعدادات الافتراضية النهائية للحاوية/الصورة):

| المتغير                                    | الافتراضي        | التأثير                                  |
| ------------------------------------------ | ---------------- | ---------------------------------------- |
| `OPENCLAW_PODMAN_CONTAINER`                | `openclaw`       | اسم الحاوية                              |
| `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` | `openclaw:local` | الصورة المراد تشغيلها                    |
| `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`        | `18789`          | منفذ المضيف المعيّن إلى منفذ الحاوية `18789` |
| `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`         | `18790`          | منفذ المضيف المعيّن إلى منفذ الحاوية `18790` |
| `OPENCLAW_PODMAN_PUBLISH_HOST`             | `127.0.0.1`      | واجهة المضيف للمنافذ المنشورة            |
| `OPENCLAW_GATEWAY_BIND`                    | `lan`            | وضع ربط Gateway داخل الحاوية             |
| `OPENCLAW_PODMAN_USERNS`                   | `keep-id`        | `keep-id` أو `auto` أو `host`            |

إذا كنت تستخدم قيمة غير افتراضية لـ`OPENCLAW_CONFIG_DIR` أو `OPENCLAW_WORKSPACE_DIR`، فاضبط المتغيرات نفسها لكلٍ من `./scripts/podman/setup.sh` وأوامر `./scripts/run-openclaw-podman.sh launch` اللاحقة — لا يحتفظ المشغّل المحلي في المستودع بتجاوزات المسارات المخصصة عبر جلسات الصدفة.

## ترقية الصور

بعد إعادة بناء صورة أو سحب صورة جديدة، أعد تشغيل الحاوية أو خدمة Quadlet.
عند أول تشغيل لإصدار جديد من OpenClaw، يجري Gateway إصلاحات آمنة للحالة
والإضافات قبل الإبلاغ عن الجاهزية.

إذا خرج Gateway بدلًا من أن يصبح جاهزًا، فشغّل الصورة نفسها مرة واحدة باستخدام
`openclaw doctor --fix` على الحالة/الإعداد المرتبطين نفسيهما، ثم أعد تشغيل
Gateway بصورة طبيعية:

```bash
OPENCLAW_CONFIG_DIR="${OPENCLAW_CONFIG_DIR:-$HOME/.openclaw}"
OPENCLAW_WORKSPACE_DIR="${OPENCLAW_WORKSPACE_DIR:-$OPENCLAW_CONFIG_DIR/workspace}"
OPENCLAW_PODMAN_IMAGE="${OPENCLAW_PODMAN_IMAGE:-${OPENCLAW_IMAGE:-openclaw:local}}"

podman run --rm -it \
  --userns=keep-id \
  --user "$(id -u):$(id -g)" \
  -e HOME=/home/node \
  -e NPM_CONFIG_CACHE=/home/node/.openclaw/.npm \
  -v "$OPENCLAW_CONFIG_DIR:/home/node/.openclaw:rw" \
  -v "$OPENCLAW_WORKSPACE_DIR:/home/node/.openclaw/workspace:rw" \
  "$OPENCLAW_PODMAN_IMAGE" \
  openclaw doctor --fix
```

على مضيفات SELinux، أضف `,Z` إلى عمليتي الربط كلتيهما إذا منع Podman الوصول إلى
الحالة المرتبطة.

## أوامر مفيدة

- **سجلات الحاوية:** `podman logs -f openclaw`
- **إيقاف الحاوية:** `podman stop openclaw`
- **إزالة الحاوية:** `podman rm -f openclaw`
- **فتح عنوان URL للوحة المعلومات من CLI المضيف:** `openclaw dashboard --no-open`
- **فحص الصحة/الحالة عبر CLI المضيف:** `openclaw gateway status --deep` (اختبار RPC + فحص إضافي للخدمة)

## استكشاف الأخطاء وإصلاحها

- **رُفض الإذن (EACCES) في الإعداد أو مساحة العمل:** تعمل الحاوية افتراضيًا باستخدام `--userns=keep-id` و`--user <your uid>:<your gid>`. تأكد من أن مستخدمك الحالي يملك مسارات الإعداد/مساحة العمل على المضيف.
- **حُظر بدء Gateway (القيمة `gateway.mode=local` مفقودة):** تأكد من وجود `~/.openclaw/openclaw.json` وضبطه `gateway.mode="local"`. ينشئ `scripts/podman/setup.sh` هذا الملف إذا كان مفقودًا.
- **إعادة تشغيل الحاوية بعد تحديث الصورة:** شغّل أمر `openclaw doctor --fix` لمرة واحدة الوارد في [ترقية الصور](#upgrading-images)، ثم ابدأ Gateway مجددًا.
- **أوامر CLI للحاوية تستهدف وجهة خاطئة:** استخدم `openclaw --container <name> ...` صراحةً، أو صدّر `OPENCLAW_CONTAINER=<name>` في الصدفة.
- **فشل `openclaw update` مع `--container`:** هذا متوقع. أعد بناء/سحب الصورة، ثم أعد تشغيل الحاوية أو خدمة Quadlet.
- **تعذّر بدء خدمة Quadlet:** شغّل `systemctl --user daemon-reload`، ثم `systemctl --user start openclaw.service`. وقد تحتاج أيضًا على الأنظمة بلا واجهة رسومية إلى `sudo loginctl enable-linger "$(whoami)"`.
- **يمنع SELinux عمليات الربط:** اترك سلوك الربط الافتراضي كما هو؛ يضيف المشغّل `:Z` تلقائيًا على Linux عندما يكون SELinux في وضع الإنفاذ أو السماح.

## ذو صلة

- [Docker](/ar/install/docker)
- [عملية Gateway في الخلفية](/ar/gateway/background-process)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
