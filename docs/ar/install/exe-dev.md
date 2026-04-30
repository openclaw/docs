---
read_when:
    - تريد مضيف Linux منخفض التكلفة ويعمل دائمًا من أجل Gateway
    - تريد الوصول عن بُعد إلى واجهة التحكم من دون تشغيل خادم افتراضي خاص بك
summary: شغّل OpenClaw Gateway على exe.dev (جهاز افتراضي + وكيل HTTPS) للوصول عن بُعد
title: exe.dev
x-i18n:
    generated_at: "2026-04-30T08:07:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: b571f9b29bb2cca0f311db4188c922b2f70ee91cb48b233cf9922e57a7f05340
    source_path: install/exe-dev.md
    workflow: 16
---

الهدف: تشغيل OpenClaw Gateway على آلة افتراضية من exe.dev، يمكن الوصول إليها من حاسوبك المحمول عبر: `https://<vm-name>.exe.xyz`

تفترض هذه الصفحة صورة **exeuntu** الافتراضية من exe.dev. إذا اخترت توزيعة مختلفة، فطابق الحزم وفقًا لذلك.

## المسار السريع للمبتدئين

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. املأ مفتاح/رمز المصادقة لديك حسب الحاجة
3. انقر على "الوكيل" بجوار آلتك الافتراضية وانتظر حتى تنهي Shelley التهيئة
4. افتح `https://<vm-name>.exe.xyz/` وصادِق باستخدام السر المشترك المكوّن (يستخدم هذا الدليل مصادقة الرمز افتراضيًا، لكن مصادقة كلمة المرور تعمل أيضًا إذا غيّرت `gateway.auth.mode`)
5. وافق على أي طلبات اقتران أجهزة معلقة باستخدام `openclaw devices approve <requestId>`

## ما تحتاج إليه

- حساب exe.dev
- وصول `ssh exe.dev` إلى الآلات الافتراضية في [exe.dev](https://exe.dev) (اختياري)

## التثبيت الآلي باستخدام Shelley

يمكن لـ Shelley، وكيل [exe.dev](https://exe.dev)، تثبيت OpenClaw فورًا باستخدام
الموجّه الخاص بنا. الموجّه المستخدم كما يلي:

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## التثبيت اليدوي

## 1) أنشئ الآلة الافتراضية

من جهازك:

```bash
ssh exe.dev new
```

ثم اتصل:

```bash
ssh <vm-name>.exe.xyz
```

<Tip>
أبقِ هذه الآلة الافتراضية **ذات حالة محفوظة**. يخزّن OpenClaw ملفات `openclaw.json` و`auth-profiles.json` الخاصة بكل وكيل، والجلسات، وحالة القنوات/المزوّدين ضمن `~/.openclaw/`، إضافة إلى مساحة العمل ضمن `~/.openclaw/workspace/`.
</Tip>

## 2) ثبّت المتطلبات الأساسية (على الآلة الافتراضية)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) ثبّت OpenClaw

شغّل سكربت تثبيت OpenClaw:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) اضبط nginx لتمرير OpenClaw إلى المنفذ 8000

حرّر `/etc/nginx/sites-enabled/default` باستخدام

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings for long-lived connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

استبدل ترويسات التمرير بدلًا من الحفاظ على السلاسل التي يقدّمها العميل.
يثق OpenClaw ببيانات تعريف عنوان IP الممرّرة فقط من الوكلاء المكوّنين صراحةً،
وتُعامل سلاسل `X-Forwarded-For` بنمط الإلحاق على أنها خطر تقوية أمني.

## 5) ادخل إلى OpenClaw وامنح الصلاحيات

ادخل إلى `https://<vm-name>.exe.xyz/` (راجع مخرجات واجهة التحكم من مرحلة الإعداد). إذا طلب المصادقة، فالصق
السر المشترك المكوّن من الآلة الافتراضية. يستخدم هذا الدليل مصادقة الرمز، لذا استرجع `gateway.auth.token`
باستخدام `openclaw config get gateway.auth.token` (أو أنشئ واحدًا باستخدام `openclaw doctor --generate-gateway-token`).
إذا غيّرت Gateway إلى مصادقة كلمة المرور، فاستخدم `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` بدلًا من ذلك.
وافق على الأجهزة باستخدام `openclaw devices list` و`openclaw devices approve <requestId>`. عند الشك، استخدم Shelley من متصفحك!

## إعداد القنوات البعيدة

للمضيفين البعيدين، فضّل استدعاء `config patch` واحدًا بدلًا من عدة استدعاءات SSH إلى `config set`. احتفظ بالرموز الحقيقية في بيئة الآلة الافتراضية أو `~/.openclaw/.env`، وضع SecretRefs فقط في `openclaw.json`.

على الآلة الافتراضية، اجعل بيئة الخدمة تحتوي على الأسرار التي تحتاج إليها:

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

من جهازك المحلي، أنشئ ملف رقعة ومرّره إلى الآلة الافتراضية:

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
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
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

استخدم `--replace-path` عندما ينبغي أن تصبح قائمة سماح متداخلة مساوية تمامًا لقيمة الرقعة، مثلًا عند استبدال قائمة سماح قنوات Discord:

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

## الوصول البعيد

تتم معالجة الوصول البعيد عبر مصادقة [exe.dev](https://exe.dev). افتراضيًا،
تُمرَّر حركة مرور HTTP من المنفذ 8000 إلى `https://<vm-name>.exe.xyz`
مع مصادقة البريد الإلكتروني.

## التحديث

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

الدليل: [التحديث](/ar/install/updating)

## ذو صلة

- [Gateway البعيد](/ar/gateway/remote)
- [نظرة عامة على التثبيت](/ar/install)
