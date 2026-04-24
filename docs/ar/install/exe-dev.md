---
read_when:
    - تريد مضيف Linux رخيصًا يعمل دائمًا من أجل Gateway
    - تريد وصولًا بعيدًا إلى Control UI من دون تشغيل VPS خاص بك
summary: تشغيل OpenClaw Gateway على exe.dev ‏(VM + HTTPS proxy) للوصول البعيد
title: exe.dev
x-i18n:
    generated_at: "2026-04-24T07:48:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ec992a734dc55c190d5ef3bdd020aa12e9613958a87d8998727264f6f3d3c1f
    source_path: install/exe-dev.md
    workflow: 15
---

الهدف: تشغيل OpenClaw Gateway على آلة exe.dev افتراضية، ويمكن الوصول إليها من حاسوبك المحمول عبر: `https://<vm-name>.exe.xyz`

تفترض هذه الصفحة صورة **exeuntu** الافتراضية في exe.dev. إذا اخترت توزيعة مختلفة، فقم بمواءمة الحزم وفقًا لذلك.

## المسار السريع للمبتدئين

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. املأ مفتاح/رمز المصادقة حسب الحاجة
3. انقر على "Agent" بجوار الآلة الافتراضية وانتظر حتى تنتهي Shelley من التهيئة
4. افتح `https://<vm-name>.exe.xyz/` وصادق باستخدام السر المشترك المضبوط (يستخدم هذا الدليل مصادقة token افتراضيًا، لكن مصادقة password تعمل أيضًا إذا بدّلت `gateway.auth.mode`)
5. وافق على أي طلبات اقتران أجهزة معلقة باستخدام `openclaw devices approve <requestId>`

## ما الذي تحتاج إليه

- حساب exe.dev
- وصول `ssh exe.dev` إلى الآلات الافتراضية في [exe.dev](https://exe.dev) ‏(اختياري)

## التثبيت المؤتمت باستخدام Shelley

يمكن لـ Shelley، وكيل [exe.dev](https://exe.dev)، تثبيت OpenClaw فورًا باستخدام
المطالبة الخاصة بنا. والمطالبة المستخدمة كما يلي:

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## التثبيت اليدوي

## 1) إنشاء الآلة الافتراضية

من جهازك:

```bash
ssh exe.dev new
```

ثم اتصل:

```bash
ssh <vm-name>.exe.xyz
```

نصيحة: أبقِ هذه الآلة الافتراضية **ذات حالة**. يخزن OpenClaw الملف `openclaw.json` وملفات
`auth-profiles.json` لكل وكيل والجلسات وحالة القنوات/الموفّرين تحت
`~/.openclaw/`، بالإضافة إلى مساحة العمل تحت `~/.openclaw/workspace/`.

## 2) تثبيت المتطلبات الأساسية (على الآلة الافتراضية)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) تثبيت OpenClaw

شغّل سكربت تثبيت OpenClaw:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) إعداد nginx لتمرير OpenClaw إلى المنفذ 8000

حرّر `/etc/nginx/sites-enabled/default` بالمحتوى التالي

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

قم بالكتابة فوق رؤوس إعادة التوجيه بدلًا من الحفاظ على السلاسل التي يقدّمها العميل.
يثق OpenClaw في بيانات IP الوصفية المُمررة فقط من proxies المضبوطة صراحةً،
وتُعامل سلاسل `X-Forwarded-For` بأسلوب الإلحاق على أنها خطر من منظور التقوية الأمنية.

## 5) الوصول إلى OpenClaw ومنح الامتيازات

ادخل إلى `https://<vm-name>.exe.xyz/` ‏(راجع مخرجات Control UI من عملية onboarding). إذا طلب المصادقة، فالصق
السر المشترك المضبوط من الآلة الافتراضية. يستخدم هذا الدليل مصادقة token، لذا استرجع `gateway.auth.token`
باستخدام `openclaw config get gateway.auth.token` ‏(أو أنشئ واحدًا باستخدام `openclaw doctor --generate-gateway-token`).
إذا كنت قد غيّرت gateway إلى مصادقة password، فاستخدم `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` بدلًا من ذلك.
وافق على الأجهزة باستخدام `openclaw devices list` و`openclaw devices approve <requestId>`. وعند الشك، استخدم Shelley من متصفحك!

## الوصول البعيد

يتولى [exe.dev](https://exe.dev) مصادقة الوصول البعيد. افتراضيًا،
تُمرر حركة HTTP من المنفذ 8000 إلى `https://<vm-name>.exe.xyz`
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

- [gateway البعيدة](/ar/gateway/remote)
- [نظرة عامة على التثبيت](/ar/install)
