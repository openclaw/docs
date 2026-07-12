---
read_when:
    - تريد مضيف Linux منخفض التكلفة يعمل دائمًا لتشغيل Gateway
    - تريد الوصول عن بُعد إلى واجهة التحكم دون تشغيل خادم VPS خاص بك
summary: شغّل OpenClaw Gateway على exe.dev ‏(آلة افتراضية + وكيل HTTPS) للوصول عن بُعد
title: exe.dev
x-i18n:
    generated_at: "2026-07-12T06:04:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a768511d2d7e4e4ec10bcdae83684417bde05286468b0534200f8dd5ec015f7b
    source_path: install/exe-dev.md
    workflow: 16
---

**الهدف:** تشغيل Gateway الخاص بـ OpenClaw على جهاز افتراضي من [exe.dev](https://exe.dev)، مع إمكانية الوصول إليه عبر `https://<vm-name>.exe.xyz`.

يفترض هذا الدليل استخدام صورة **exeuntu** الافتراضية من exe.dev. استخدم الحزم المقابلة في التوزيعات الأخرى.

## ما تحتاج إليه

- حساب exe.dev
- إمكانية الوصول إلى الأجهزة الافتراضية في exe.dev عبر `ssh exe.dev` (اختياري، للإعداد اليدوي)

## المسار السريع للمبتدئين

1. افتح [https://exe.new/openclaw](https://exe.new/openclaw)
2. أدخل مفتاح المصادقة أو الرمز المميز حسب الحاجة
3. انقر على "Agent" بجوار جهازك الافتراضي وانتظر حتى تنتهي Shelley من التجهيز
4. افتح `https://<vm-name>.exe.xyz/` وصادِق باستخدام السر المشترك المُعدّ (المصادقة بالرمز المميز هي الافتراضية؛ وتعمل المصادقة بكلمة المرور أيضًا إذا غيّرت `gateway.auth.mode`)
5. وافق على طلبات إقران الأجهزة المعلّقة باستخدام `openclaw devices approve <requestId>`

## التثبيت الآلي باستخدام Shelley

يمكن لـ Shelley، وكيل exe.dev، تثبيت OpenClaw استنادًا إلى مطالبة:

```text
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## التثبيت اليدوي

<Steps>
  <Step title="إنشاء الجهاز الافتراضي">
    من جهازك:

    ```bash
    ssh exe.dev new
    ```

    ثم اتصل:

    ```bash
    ssh <vm-name>.exe.xyz
    ```

    <Tip>
    اجعل هذا الجهاز الافتراضي **ذا حالة مستديمة**. يخزّن OpenClaw الملف `openclaw.json` وملفات `auth-profiles.json` الخاصة بكل وكيل والجلسات وحالة القنوات وموفّري الخدمة ضمن `~/.openclaw/`، بالإضافة إلى مساحة العمل ضمن `~/.openclaw/workspace/`.
    </Tip>

  </Step>

  <Step title="تثبيت المتطلبات الأساسية (على الجهاز الافتراضي)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl jq ca-certificates openssl
    ```
  </Step>

  <Step title="تثبيت OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="إعداد nginx ليعمل وكيلاً إلى المنفذ 8000">
    حرّر `/etc/nginx/sites-enabled/default`:

    ```nginx
    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        listen 8000;
        listen [::]:8000;

        server_name _;

        location / {
            proxy_pass http://127.0.0.1:18789;
            proxy_http_version 1.1;

            # دعم WebSocket
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            # ترويسات الوكيل القياسية
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;

            # إعدادات المهلة الزمنية للاتصالات طويلة الأمد
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }
    }
    ```

    استبدل ترويسات إعادة التوجيه بدلًا من الاحتفاظ بالسلاسل التي يرسلها العميل. لا يثق OpenClaw ببيانات عنوان IP الوصفية المُعاد توجيهها إلا من الوكلاء المُعدّين صراحةً، وتُعد سلاسل `X-Forwarded-For` التي تستخدم أسلوب الإلحاق خطرًا على التحصين الأمني.

  </Step>

  <Step title="الوصول إلى OpenClaw والموافقة على الأجهزة">
    افتح `https://<vm-name>.exe.xyz/` (راجع مخرجات واجهة التحكم من عملية الإعداد الأولي). إذا طُلبت منك المصادقة، فألصق السر المشترك المُعدّ من الجهاز الافتراضي.

    يستخدم هذا الدليل المصادقة بالرمز المميز افتراضيًا، لذا استرجع `gateway.auth.token` باستخدام `openclaw config get gateway.auth.token`، أو أنشئ رمزًا جديدًا باستخدام `openclaw doctor --n`. إذا غيّرت Gateway لاستخدام المصادقة بكلمة المرور، فاستخدم `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` بدلًا من ذلك.

    وافق على الأجهزة باستخدام `openclaw devices list` و`openclaw devices approve <requestId>`. عند الشك، استخدم Shelley من متصفحك.

  </Step>
</Steps>

## إعداد القنوات عن بُعد

بالنسبة إلى المضيفين البعيدين، يُفضّل إجراء استدعاء واحد لـ `config patch` بدلًا من إجراء عدة استدعاءات SSH إلى `config set`. احتفظ بالرموز المميزة الحقيقية في بيئة الجهاز الافتراضي أو في `~/.openclaw/.env`، وضع مراجع الأسرار فقط في `openclaw.json`. راجع [إدارة الأسرار](/ar/gateway/secrets) للاطلاع على عقد SecretRef الكامل.

على الجهاز الافتراضي، اجعل بيئة الخدمة تحتوي على الأسرار التي تحتاج إليها:

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

من جهازك المحلي، أنشئ ملف تصحيح ومرّره إلى الجهاز الافتراضي:

```json5
// openclaw.remote.patch.json5
{
  secrets: {
    providers: {
      default: { source: "env" },
    },
  },
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --dry-run' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw gateway restart && openclaw health'
```

استخدم `--replace-path` عندما يجب أن تصبح قائمة سماح متداخلة مطابقة تمامًا لقيمة التصحيح، مثل استبدال قائمة سماح قناة Discord:

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

راجع [Discord](/ar/channels/discord) و[Slack](/ar/channels/slack) للاطلاع على المرجع الكامل لإعداد القنوات.

## الوصول عن بُعد

يتولى exe.dev المصادقة للوصول عن بُعد. افتراضيًا، تُعاد توجيه حركة مرور HTTP من المنفذ 8000 إلى `https://<vm-name>.exe.xyz` مع المصادقة عبر البريد الإلكتروني.

## التحديث

```bash
openclaw update
```

راجع [التحديث](/ar/install/updating) للتعرّف على تبديل القنوات والاسترداد اليدوي.

## مواضيع ذات صلة

- [Gateway البعيد](/ar/gateway/remote)
- [نظرة عامة على التثبيت](/ar/install)
