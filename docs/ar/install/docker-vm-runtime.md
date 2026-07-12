---
read_when:
    - أنت تنشر OpenClaw على جهاز افتراضي سحابي باستخدام Docker
    - تحتاج إلى مسار مشترك لتضمين الملف التنفيذي، والاستمرارية، والتحديث
summary: خطوات تشغيل آلة Docker الافتراضية المشتركة لمضيفي Gateway في OpenClaw طويلي الأمد
title: وقت تشغيل الجهاز الافتراضي لـ Docker
x-i18n:
    generated_at: "2026-07-12T05:59:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1c474b1f826077ac03c7aaa1e334ed2f38d2de2770f32f2cc907846ecc8bb19
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

خطوات تشغيل مشتركة لعمليات تثبيت Docker المعتمدة على الأجهزة الافتراضية، مثل GCP وHetzner ومزوّدي VPS المشابهين.

## تضمين الملفات التنفيذية المطلوبة في الصورة

يُعد تثبيت الملفات التنفيذية داخل حاوية قيد التشغيل فخًا: فأي شيء يُثبَّت
في وقت التشغيل يُفقد عند إعادة التشغيل. ضمّن كل ملف تنفيذي خارجي تحتاج إليه إحدى Skills
في الصورة وقت البناء.

لا تغطي الأمثلة أدناه سوى ثلاثة ملفات تنفيذية، مرتبة أبجديًا:

- `gog` (من `gogcli`) للوصول إلى Gmail
- `goplaces` للوصول إلى Google Places
- `wacli` للوصول إلى WhatsApp

هذه أمثلة وليست قائمة كاملة. ثبّت عدد الملفات التنفيذية الذي تحتاج إليه
Skills لديك باستخدام النمط نفسه. وعندما تضيف Skill تحتاج إلى ملف
تنفيذي جديد لاحقًا:

1. حدّث Dockerfile.
2. أعد بناء الصورة.
3. أعد تشغيل الحاويات.

**مثال على Dockerfile**

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
عناوين URL أعلاه أمثلة. بالنسبة إلى الأجهزة الافتراضية المعتمدة على ARM، اختر أصول `arm64`. وللحصول على عمليات بناء قابلة لإعادة الإنتاج، ثبّت عناوين URL لإصدارات محددة.
</Note>

## البناء والتشغيل

```bash
docker compose build
docker compose up -d openclaw-gateway
```

إذا فشل البناء برسالة `Killed` أو برمز الخروج 137 أثناء `pnpm install --frozen-lockfile`، فهذا يعني أن ذاكرة الجهاز الافتراضي قد نفدت. استخدم فئة جهاز أكبر قبل إعادة المحاولة.

تحقق من الملفات التنفيذية:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

الناتج المتوقع:

```text
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

تحقق من أن Gateway يعمل:

```bash
docker compose logs -f openclaw-gateway
curl -fsS http://127.0.0.1:18789/healthz
```

يؤكد إرجاع `/healthz` لاستجابة 200 أن عملية Gateway تستمع وتعمل بصورة سليمة؛ ويتحقق `HEALTHCHECK` المضمّن في الصورة من نقطة النهاية نفسها دوريًا.

## ما الذي يستمر وأين

يعمل OpenClaw داخل Docker، لكن Docker ليس مصدر الحقيقة. يجب أن تبقى جميع الحالات طويلة الأمد محفوظة بعد عمليات إعادة التشغيل وإعادة البناء وإعادة تشغيل النظام.

| المكوّن                 | الموقع                                                 | آلية الاستمرارية          | ملاحظات                                                                                                              |
| ---------------------- | ------------------------------------------------------ | ------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| إعدادات Gateway        | `/home/node/.openclaw/`                                | تركيب وحدة تخزين المضيف   | يتضمن `openclaw.json`                                                                                                |
| بيانات اعتماد القناة/المزوّد | `/home/node/.openclaw/credentials/`                    | تركيب وحدة تخزين المضيف   | مواد بيانات اعتماد القناة والمزوّد                                                                                   |
| ملفات تعريف مصادقة النموذج | `/home/node/.openclaw/agents/`                         | تركيب وحدة تخزين المضيف   | `agents/<agentId>/agent/auth-profiles.json` ‏(OAuth، مفاتيح API)                                                     |
| ملف مفتاح OAuth القديم | `/home/node/.config/openclaw/`                         | تركيب وحدة تخزين المضيف   | توافق للقراءة فقط مع ملفات OAuth الجانبية السابقة للترحيل؛ ينقلها `openclaw doctor --fix` إلى `auth-profiles.json` |
| إعدادات Skills         | `/home/node/.openclaw/skills/`                         | تركيب وحدة تخزين المضيف   | حالة على مستوى Skill                                                                                                 |
| مساحة عمل الوكيل       | `/home/node/.openclaw/workspace/`                      | تركيب وحدة تخزين المضيف   | الشيفرة والآثار الناتجة عن الوكيل                                                                                    |
| جلسة WhatsApp          | `/home/node/.openclaw/`                                | تركيب وحدة تخزين المضيف   | يحافظ على تسجيل الدخول عبر رمز QR                                                                                    |
| مخزن مفاتيح Gmail      | `/home/node/.openclaw/`                                | وحدة تخزين المضيف + كلمة مرور | يتطلب `GOG_KEYRING_PASSWORD`                                                                                         |
| حزم Plugin             | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | تركيب وحدة تخزين المضيف   | جذور حزم Plugin القابلة للتنزيل                                                                                       |
| الملفات التنفيذية الخارجية | `/usr/local/bin/`                                      | صورة Docker               | يجب تضمينها وقت البناء                                                                                               |
| بيئة تشغيل Node        | نظام ملفات الحاوية                                     | صورة Docker               | تُعاد تهيئتها مع كل بناء للصورة                                                                                      |
| حزم نظام التشغيل       | نظام ملفات الحاوية                                     | صورة Docker               | لا تثبّتها في وقت التشغيل                                                                                            |
| حاوية Docker           | مؤقتة                                                   | قابلة لإعادة التشغيل      | يمكن إتلافها بأمان                                                                                                   |

## التحديثات

لتحديث OpenClaw على الجهاز الافتراضي:

```bash
git pull
docker compose build
docker compose up -d
```

## ذو صلة

- [Docker](/ar/install/docker)
- [Podman](/ar/install/podman)
- [ClawDock](/ar/install/clawdock)
