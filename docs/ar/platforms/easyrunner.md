---
read_when:
    - نشر OpenClaw على EasyRunner
    - تشغيل Gateway خلف وكيل Caddy الخاص بـ EasyRunner
    - اختيار وحدات التخزين الدائمة والمصادقة لـ Gateway مستضاف
summary: شغّل Gateway الخاص بـ OpenClaw على EasyRunner باستخدام Podman وCaddy
title: إيزي رانر
x-i18n:
    generated_at: "2026-07-12T06:04:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80cbde016a8bf7662d4b4a056a3d122a423264179daf70b5705e8f10b0dad5cb
    source_path: platforms/easyrunner.md
    workflow: 16
---

يستضيف EasyRunner ‏Gateway الخاص بـ OpenClaw كتطبيق صغير ضمن حاوية خلف وكيل Caddy. يفترض هذا الدليل وجود مضيف EasyRunner يشغّل تطبيقات Compose المتوافقة مع Podman وينهي اتصالات HTTPS عبر Caddy.

## قبل البدء

- خادم EasyRunner مع نطاق موجّه إليه.
- صورة OpenClaw الرسمية (`ghcr.io/openclaw/openclaw`) أو إصدارك الخاص.
- وحدة تخزين دائمة للإعدادات للمسار `/home/node/.openclaw`.
- وحدة تخزين دائمة لمساحة العمل للمسار `/home/node/.openclaw/workspace`.
- رمز مميز أو كلمة مرور قوية لـ Gateway.

أبقِ مصادقة الجهاز مفعّلة متى أمكن. إذا تعذّر على وكيلك العكسي تمرير هوية الجهاز بصورة صحيحة، فأصلح أولًا إعدادات الوكيل الموثوق (راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth))؛ ولا تستخدم تجاوزات المصادقة الخطرة إلا ضمن شبكة خاصة بالكامل وخاضعة لتحكم المشغّل.

## تطبيق Compose

أنشئ تطبيق EasyRunner بملف Compose على النحو الآتي:

```yaml
services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    restart: unless-stopped
    environment:
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      OPENCLAW_HOME: /home/node
      OPENCLAW_STATE_DIR: /home/node/.openclaw
      OPENCLAW_CONFIG_PATH: /home/node/.openclaw/openclaw.json
      OPENCLAW_WORKSPACE_DIR: /home/node/.openclaw/workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/home/node/.openclaw/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["node", "openclaw.mjs", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

استبدل `openclaw.example.com` باسم مضيف Gateway لديك. خزّن `OPENCLAW_GATEWAY_TOKEN` في مدير الأسرار/متغيرات البيئة في EasyRunner بدلًا من تضمينه في تعريف التطبيق. ترتبط الصورة افتراضيًا بواجهة loopback، لذلك يلزم تحديد `--bind lan --port 1455` صراحةً في `command` كي يتمكن Caddy من الوصول إلى الحاوية.

## إعداد OpenClaw

داخل وحدة تخزين الإعدادات الدائمة، اجعل الوصول إلى Gateway ممكنًا عبر الوكيل فقط، واشترط المصادقة:

```json5
{
  gateway: {
    bind: "lan",
    port: 1455,
    auth: {
      token: "${OPENCLAW_GATEWAY_TOKEN}",
    },
  },
}
```

إذا كان Caddy ينهي TLS نيابةً عن Gateway، فاضبط إعدادات الوكيل الموثوق لمسار الوكيل المحدد بدلًا من تعطيل فحوصات المصادقة عموميًا. راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth).

## التحقق

من محطة العمل لديك:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

من مضيف EasyRunner، لا يتطلب `GET /healthz` (التحقق من التشغيل) ولا `GET /readyz` (التحقق من الجاهزية) أي مصادقة، وهما يدعمان فحص سلامة الحاوية المضمّن في الصورة. تحقّق أيضًا من سجلات التطبيق للتأكد من أن Gateway يستمع للاتصالات ومن عدم وجود حالات فشل عند بدء التشغيل متعلقة بـ SecretRef أو Plugin أو مصادقة القنوات.

## التحديثات والنسخ الاحتياطية

- اسحب صورة OpenClaw الجديدة أو أنشئها، ثم أعد نشر تطبيق EasyRunner.
- انسخ وحدة التخزين `openclaw-config` احتياطيًا قبل التحديثات. فهي تحتوي على `openclaw.json` و`agents/<agentId>/agent/auth-profiles.json` وحالة حزم Plugin المثبّتة.
- انسخ `openclaw-workspace` احتياطيًا إذا كانت الوكلاء تكتب فيها بيانات مشاريع دائمة.
- شغّل `openclaw doctor` بعد التحديثات الرئيسية لاكتشاف عمليات ترحيل الإعدادات وتحذيرات الخدمة.

## استكشاف الأخطاء وإصلاحها

- يتعذر على `gateway probe` الاتصال: تأكد من أن اسم مضيف Caddy يشير إلى التطبيق وأن الحاوية تستمع على `0.0.0.0:1455`.
- فشل المصادقة: بدّل الرمز المميز في أسرار EasyRunner وأمر العميل المحلي معًا.
- أصبحت الملفات مملوكة للمستخدم الجذر بعد الاستعادة: تعمل الصورة بالمستخدم `node` ‏(uid 1000)؛ أصلح وحدات التخزين المركّبة بحيث يتمكن هذا المستخدم من الكتابة إلى `/home/node/.openclaw` و`/home/node/.openclaw/workspace`.
- فشل المتصفح أو Plugins الخاصة بالقنوات: تحقّق مما إذا كانت الملفات التنفيذية الخارجية المطلوبة، وإمكانية الوصول الصادر إلى الشبكة، وبيانات الاعتماد المركّبة متاحة داخل الحاوية.
