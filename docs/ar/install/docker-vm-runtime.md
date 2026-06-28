---
read_when:
    - أنت تنشر OpenClaw على جهاز افتراضي سحابي باستخدام Docker
    - تحتاج إلى مسار إعداد الملف الثنائي المشترك، والحفظ الدائم، والتحديث
summary: خطوات وقت تشغيل جهاز Docker الافتراضي المشتركة لمضيفي OpenClaw Gateway طويلي الأمد
title: بيئة تشغيل Docker VM
x-i18n:
    generated_at: "2026-05-12T12:51:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6a01c20ac6b85a32167fd1d897368ee0ebc6997cbc95a25f831ea7dd2e623c9
    source_path: install/docker-vm-runtime.md
    workflow: 16
    postprocess_version: locale-links-v1
---

خطوات وقت التشغيل المشتركة لتثبيتات Docker المعتمدة على الآلات الافتراضية مثل GCP وHetzner ومزوّدي VPS المشابهين.

## تضمين الثنائيات المطلوبة في الصورة

تثبيت الثنائيات داخل حاوية قيد التشغيل فخ.
أي شيء يُثبّت وقت التشغيل سيُفقد عند إعادة التشغيل.

يجب تثبيت كل الثنائيات الخارجية التي تتطلبها Skills وقت بناء الصورة.

تعرض الأمثلة أدناه ثلاثة ثنائيات شائعة فقط:

- `gog` (من `gogcli`) للوصول إلى Gmail
- `goplaces` لـ Google Places
- `wacli` لـ WhatsApp

هذه أمثلة، وليست قائمة كاملة.
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
عناوين URL أعلاه أمثلة. بالنسبة إلى الآلات الافتراضية المعتمدة على ARM، اختر أصول `arm64`. وللبُنى القابلة لإعادة الإنتاج، ثبّت عناوين URL للإصدارات ذات النسخ المحددة.
</Note>

## البناء والتشغيل

```bash
docker compose build
docker compose up -d openclaw-gateway
```

إذا فشل البناء برسالة `Killed` أو `exit code 137` أثناء `pnpm install --frozen-lockfile`، فهذا يعني أن ذاكرة الآلة الافتراضية نفدت.
استخدم فئة آلة أكبر قبل إعادة المحاولة.

تحقّق من الثنائيات:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

الناتج المتوقع:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

تحقّق من Gateway:

```bash
docker compose logs -f openclaw-gateway
```

الناتج المتوقع:

```
[gateway] listening on ws://0.0.0.0:18789
```

## ما الذي يستمر وأين

يعمل OpenClaw داخل Docker، لكن Docker ليس مصدر الحقيقة.
يجب أن تبقى كل الحالة طويلة الأمد بعد عمليات إعادة التشغيل وإعادة البناء وإعادة التمهيد.

| المكوّن             | الموقع                                                 | آلية الاستمرار         | ملاحظات                                                       |
| ------------------- | ------------------------------------------------------ | ---------------------- | ------------------------------------------------------------- |
| إعداد Gateway       | `/home/node/.openclaw/`                                | تحميل مجلد من المضيف   | يتضمن `openclaw.json`، و`.env`                                |
| ملفات تعريف مصادقة النماذج | `/home/node/.openclaw/agents/`                         | تحميل مجلد من المضيف   | `agents/<agentId>/agent/auth-profiles.json` (OAuth، مفاتيح API) |
| مفتاح ملف تعريف المصادقة | `/home/node/.config/openclaw/`                         | تحميل مجلد من المضيف   | مفتاح تشفير محلي لمادة رموز ملفات تعريف مصادقة OAuth         |
| إعدادات Skills      | `/home/node/.openclaw/skills/`                         | تحميل مجلد من المضيف   | حالة على مستوى Skills                                         |
| مساحة عمل الوكيل    | `/home/node/.openclaw/workspace/`                      | تحميل مجلد من المضيف   | الشيفرة ومخرجات الوكيل                                        |
| جلسة WhatsApp       | `/home/node/.openclaw/`                                | تحميل مجلد من المضيف   | يحافظ على تسجيل الدخول عبر QR                                 |
| حلقة مفاتيح Gmail   | `/home/node/.openclaw/`                                | مجلد مضيف + كلمة مرور  | يتطلب `GOG_KEYRING_PASSWORD`                                  |
| حزم Plugin          | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | تحميل مجلد من المضيف   | جذور حزم Plugin القابلة للتنزيل                               |
| الثنائيات الخارجية  | `/usr/local/bin/`                                      | صورة Docker            | يجب تضمينها وقت البناء                                        |
| وقت تشغيل Node      | نظام ملفات الحاوية                                    | صورة Docker            | يُعاد بناؤه مع كل بناء للصورة                                 |
| حزم نظام التشغيل    | نظام ملفات الحاوية                                    | صورة Docker            | لا تثبّتها وقت التشغيل                                        |
| حاوية Docker        | مؤقتة                                                 | قابلة لإعادة التشغيل   | آمنة للحذف                                                    |

## التحديثات

لتحديث OpenClaw على الآلة الافتراضية:

```bash
git pull
docker compose build
docker compose up -d
```

## ذات صلة

- [Docker](/ar/install/docker)
- [Podman](/ar/install/podman)
- [ClawDock](/ar/install/clawdock)
