---
read_when:
    - أنت تنشر OpenClaw على آلة افتراضية سحابية باستخدام Docker
    - تحتاج إلى عملية إعداد الملف الثنائي المشتركة، والاستمرارية، وتدفق التحديث
summary: خطوات وقت التشغيل المشتركة لجهاز Docker الافتراضي لمضيفي OpenClaw Gateway طويلي الأمد
title: بيئة تشغيل الآلة الافتراضية لـ Docker
x-i18n:
    generated_at: "2026-04-30T08:06:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01ce5a7e58619da9c9ec97eb1e4f88323ab26f42f40e0a3d655b18019de798dd
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

خطوات وقت تشغيل مشتركة لعمليات تثبيت Docker المعتمدة على VM مثل GCP وHetzner ومزوّدي VPS المشابهين.

## ضمّن الثنائيات المطلوبة داخل الصورة

تثبيت الثنائيات داخل حاوية قيد التشغيل فخ.
أي شيء يُثبّت في وقت التشغيل سيُفقد عند إعادة التشغيل.

يجب تثبيت جميع الثنائيات الخارجية المطلوبة بواسطة Skills في وقت بناء الصورة.

تعرض الأمثلة أدناه ثلاثة ثنائيات شائعة فقط:

- `gog` (من `gogcli`) للوصول إلى Gmail
- `goplaces` لـ Google Places
- `wacli` لـ WhatsApp

هذه أمثلة وليست قائمة كاملة.
يمكنك تثبيت أي عدد تحتاجه من الثنائيات باستخدام النمط نفسه.

إذا أضفت Skills جديدة لاحقًا تعتمد على ثنائيات إضافية، فيجب عليك:

1. تحديث Dockerfile
2. إعادة بناء الصورة
3. إعادة تشغيل الحاويات

**مثال Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Example binary 1: Gmail CLI (gogcli — installs as `gog`)
# Copy the current Linux asset URL from https://github.com/steipete/gogcli/releases
RUN curl -L https://github.com/steipete/gogcli/releases/latest/download/gogcli_linux_amd64.tar.gz \
  | tar -xzO gog > /usr/local/bin/gog; \
  chmod +x /usr/local/bin/gog

# Example binary 2: Google Places CLI
# Copy the current Linux asset URL from https://github.com/steipete/goplaces/releases
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_linux_amd64.tar.gz \
  | tar -xzO goplaces > /usr/local/bin/goplaces; \
  chmod +x /usr/local/bin/goplaces

# Example binary 3: WhatsApp CLI
# Copy the current Linux asset URL from https://github.com/steipete/wacli/releases
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli-linux-amd64.tar.gz \
  | tar -xzO wacli > /usr/local/bin/wacli; \
  chmod +x /usr/local/bin/wacli

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
عناوين URL أعلاه أمثلة. بالنسبة إلى VM المعتمدة على ARM، اختر أصول `arm64`. للحصول على عمليات بناء قابلة لإعادة الإنتاج، ثبّت عناوين URL لإصدارات محددة.
</Note>

## البناء والتشغيل

```bash
docker compose build
docker compose up -d openclaw-gateway
```

إذا فشل البناء مع `Killed` أو `exit code 137` أثناء `pnpm install --frozen-lockfile`، فهذا يعني أن ذاكرة VM نفدت.
استخدم فئة جهاز أكبر قبل إعادة المحاولة.

تحقق من الثنائيات:

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

## ما الذي يستمر وأين

يعمل OpenClaw داخل Docker، لكن Docker ليس مصدر الحقيقة.
يجب أن تبقى كل الحالات طويلة العمر بعد عمليات إعادة التشغيل وإعادة البناء وإعادة تمهيد الجهاز.

| المكوّن | الموقع | آلية الاستمرار | ملاحظات |
| ------------------- | ---------------------------------------- | ---------------------- | ------------------------------------------------------------- |
| إعدادات Gateway | `/home/node/.openclaw/` | ربط مجلد من المضيف | يتضمن `openclaw.json` و`.env` |
| ملفات تعريف مصادقة النموذج | `/home/node/.openclaw/agents/` | ربط مجلد من المضيف | `agents/<agentId>/agent/auth-profiles.json` (OAuth، مفاتيح API) |
| إعدادات Skill | `/home/node/.openclaw/skills/` | ربط مجلد من المضيف | حالة على مستوى Skill |
| مساحة عمل الوكيل | `/home/node/.openclaw/workspace/` | ربط مجلد من المضيف | الكود ومخرجات الوكيل |
| جلسة WhatsApp | `/home/node/.openclaw/` | ربط مجلد من المضيف | يحافظ على تسجيل الدخول عبر QR |
| سلسلة مفاتيح Gmail | `/home/node/.openclaw/` | مجلد مضيف + كلمة مرور | يتطلب `GOG_KEYRING_PASSWORD` |
| تبعيات وقت تشغيل Plugin | `/var/lib/openclaw/plugin-runtime-deps/` | مجلد Docker مسمى | تبعيات Plugin المضمّنة المولّدة ونسخ وقت التشغيل المطابقة |
| الثنائيات الخارجية | `/usr/local/bin/` | صورة Docker | يجب تضمينها في وقت البناء |
| وقت تشغيل Node | نظام ملفات الحاوية | صورة Docker | يُعاد بناؤه في كل بناء للصورة |
| حزم نظام التشغيل | نظام ملفات الحاوية | صورة Docker | لا تثبّتها في وقت التشغيل |
| حاوية Docker | عابرة | قابلة لإعادة التشغيل | يمكن تدميرها بأمان |

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
