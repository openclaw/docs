---
read_when:
    - أنت تنشر OpenClaw على جهاز VM سحابي باستخدام Docker
    - أنت بحاجة إلى تدفق bake للملف التنفيذي المشترك، والاستمرارية، والتحديثات
summary: خطوات وقت تشغيل Docker VM المشتركة لمضيفي OpenClaw Gateway طويلي الأمد
title: وقت تشغيل Docker VM
x-i18n:
    generated_at: "2026-04-24T07:47:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54e99e6186a3c13783922e4d1e4a55e9872514be23fa77ca869562dcd436ad2b
    source_path: install/docker-vm-runtime.md
    workflow: 15
---

خطوات وقت التشغيل المشتركة لتثبيتات Docker المعتمدة على VM مثل GCP وHetzner ومزودي VPS المشابهين.

## ضمّن الملفات التنفيذية المطلوبة داخل الصورة

إن تثبيت الملفات التنفيذية داخل حاوية قيد التشغيل هو فخ.
فأي شيء يُثبَّت في وقت التشغيل سيُفقد عند إعادة التشغيل.

يجب تثبيت جميع الملفات التنفيذية الخارجية التي تحتاج إليها Skills في وقت بناء الصورة.

توضح الأمثلة أدناه ثلاثة ملفات تنفيذية شائعة فقط:

- `gog` للوصول إلى Gmail
- `goplaces` لـ Google Places
- `wacli` لـ WhatsApp

هذه أمثلة وليست قائمة كاملة.
يمكنك تثبيت أي عدد تحتاج إليه من الملفات التنفيذية باستخدام النمط نفسه.

إذا أضفت Skills جديدة لاحقًا تعتمد على ملفات تنفيذية إضافية، فيجب عليك:

1. تحديث Dockerfile
2. إعادة بناء الصورة
3. إعادة تشغيل الحاويات

**مثال Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Example binary 1: Gmail CLI
RUN curl -L https://github.com/steipete/gog/releases/latest/download/gog_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gog

# Example binary 2: Google Places CLI
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/goplaces

# Example binary 3: WhatsApp CLI
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/wacli

# Add more binaries below using the same pattern

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

<Note>
روابط التنزيل أعلاه مخصصة لـ x86_64 ‏(amd64). وبالنسبة إلى VMs المعتمدة على ARM (مثل Hetzner ARM أو GCP Tau T2A)، استبدل روابط التنزيل بنسخ ARM64 المناسبة من صفحة الإصدارات الخاصة بكل أداة.
</Note>

## البناء والتشغيل

```bash
docker compose build
docker compose up -d openclaw-gateway
```

إذا فشل البناء مع `Killed` أو `exit code 137` أثناء `pnpm install --frozen-lockfile`، فهذا يعني أن VM نفدت منها الذاكرة.
استخدم فئة جهاز أكبر قبل إعادة المحاولة.

تحقق من الملفات التنفيذية:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

المخرجات المتوقعة:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

تحقق من Gateway:

```bash
docker compose logs -f openclaw-gateway
```

المخرجات المتوقعة:

```
[gateway] listening on ws://0.0.0.0:18789
```

## ما الذي يُحفَظ وأين

يعمل OpenClaw داخل Docker، لكن Docker ليس مصدر الحقيقة.
يجب أن تنجو جميع الحالات طويلة الأمد من إعادة التشغيل، وإعادة البناء، وإعادة الإقلاع.

| المكوّن | الموقع | آلية الاستمرارية | ملاحظات |
| ------- | ------- | ---------------- | -------- |
| إعدادات Gateway | `/home/node/.openclaw/` | ربط volume من المضيف | تتضمن `openclaw.json` و`.env` |
| ملفات تعريف مصادقة النماذج | `/home/node/.openclaw/agents/` | ربط volume من المضيف | `agents/<agentId>/agent/auth-profiles.json` ‏(OAuth، مفاتيح API) |
| إعدادات Skills | `/home/node/.openclaw/skills/` | ربط volume من المضيف | حالة على مستوى Skill |
| مساحة عمل الوكيل | `/home/node/.openclaw/workspace/` | ربط volume من المضيف | الكود وعناصر الوكيل |
| جلسة WhatsApp | `/home/node/.openclaw/` | ربط volume من المضيف | يحافظ على تسجيل الدخول عبر QR |
| keyring الخاصة بـ Gmail | `/home/node/.openclaw/` | volume من المضيف + كلمة مرور | تتطلب `GOG_KEYRING_PASSWORD` |
| الملفات التنفيذية الخارجية | `/usr/local/bin/` | صورة Docker | يجب تضمينها وقت البناء |
| وقت تشغيل Node | نظام ملفات الحاوية | صورة Docker | يُعاد بناؤه مع كل بناء للصورة |
| حزم نظام التشغيل | نظام ملفات الحاوية | صورة Docker | لا تثبتها في وقت التشغيل |
| حاوية Docker | مؤقتة | قابلة لإعادة التشغيل | يمكن تدميرها بأمان |

## التحديثات

لتحديث OpenClaw على VM:

```bash
git pull
docker compose build
docker compose up -d
```

## ذو صلة

- [Docker](/ar/install/docker)
- [Podman](/ar/install/podman)
- [ClawDock](/ar/install/clawdock)
