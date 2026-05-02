---
read_when:
    - أنت تنشر OpenClaw على جهاز افتراضي سحابي باستخدام Docker
    - تحتاج إلى سير عمل إعداد الملف الثنائي المشترك والحفظ الدائم والتحديث
summary: خطوات وقت تشغيل Docker VM المشتركة لمضيفات OpenClaw Gateway طويلة الأمد
title: بيئة تشغيل الجهاز الافتراضي لـ Docker
x-i18n:
    generated_at: "2026-05-02T07:33:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7489d42e01199a7b5e6f3b98dcfe624d1b3133ef1682dda764b2c8ddd1324e78
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

خطوات وقت تشغيل مشتركة لتثبيتات Docker المعتمدة على الآلات الافتراضية مثل GCP وHetzner ومزوّدي VPS المشابهين.

## أدرج الثنائيات المطلوبة داخل الصورة

تثبيت الثنائيات داخل حاوية قيد التشغيل فخ.
أي شيء يُثبَّت في وقت التشغيل سيُفقد عند إعادة التشغيل.

يجب تثبيت جميع الثنائيات الخارجية التي تتطلبها Skills في وقت بناء الصورة.

تعرض الأمثلة أدناه ثلاثة ثنائيات شائعة فقط:

- `gog` (من `gogcli`) للوصول إلى Gmail
- `goplaces` لـ Google Places
- `wacli` لـ WhatsApp

هذه أمثلة، وليست قائمة كاملة.
يمكنك تثبيت أي عدد من الثنائيات حسب الحاجة باستخدام النمط نفسه.

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
عناوين URL أعلاه أمثلة. بالنسبة للآلات الافتراضية المعتمدة على ARM، اختر أصول `arm64`. للحصول على عمليات بناء قابلة لإعادة الإنتاج، ثبّت عناوين URL لإصدارات محددة.
</Note>

## البناء والتشغيل

```bash
docker compose build
docker compose up -d openclaw-gateway
```

إذا فشل البناء مع `Killed` أو `exit code 137` أثناء `pnpm install --frozen-lockfile`، فهذا يعني أن ذاكرة الآلة الافتراضية نفدت.
استخدم فئة آلة أكبر قبل إعادة المحاولة.

تحقق من الثنائيات:

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

تحقق من Gateway:

```bash
docker compose logs -f openclaw-gateway
```

الناتج المتوقع:

```
[gateway] listening on ws://0.0.0.0:18789
```

## ما الذي يستمر وأين

يعمل OpenClaw في Docker، لكن Docker ليس مصدر الحقيقة.
يجب أن تبقى كل الحالات طويلة الأمد بعد إعادة التشغيل، وإعادة البناء، وإعادة إقلاع النظام.

| المكوّن            | الموقع                                                 | آلية الاستمرارية       | ملاحظات                                                       |
| ------------------ | ------------------------------------------------------ | ---------------------- | ------------------------------------------------------------- |
| إعدادات Gateway    | `/home/node/.openclaw/`                                | ربط مجلد من المضيف     | يتضمن `openclaw.json` و`.env`                                 |
| ملفات مصادقة النموذج | `/home/node/.openclaw/agents/`                         | ربط مجلد من المضيف     | `agents/<agentId>/agent/auth-profiles.json` (OAuth، مفاتيح API) |
| إعدادات Skills     | `/home/node/.openclaw/skills/`                         | ربط مجلد من المضيف     | حالة على مستوى Skills                                         |
| مساحة عمل الوكيل   | `/home/node/.openclaw/workspace/`                      | ربط مجلد من المضيف     | الكود ومخرجات الوكيل                                          |
| جلسة WhatsApp      | `/home/node/.openclaw/`                                | ربط مجلد من المضيف     | يحافظ على تسجيل الدخول عبر QR                                 |
| مخزن مفاتيح Gmail  | `/home/node/.openclaw/`                                | مجلد مضيف + كلمة مرور  | يتطلب `GOG_KEYRING_PASSWORD`                                  |
| حزم Plugin         | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | ربط مجلد من المضيف     | جذور حزم Plugin القابلة للتنزيل                               |
| الثنائيات الخارجية | `/usr/local/bin/`                                      | صورة Docker            | يجب إدراجها أثناء وقت البناء                                  |
| وقت تشغيل Node     | نظام ملفات الحاوية                                    | صورة Docker            | يُعاد بناؤه عند كل بناء للصورة                                |
| حزم نظام التشغيل   | نظام ملفات الحاوية                                    | صورة Docker            | لا تثبّتها في وقت التشغيل                                     |
| حاوية Docker       | مؤقتة                                                 | قابلة لإعادة التشغيل   | يمكن تدميرها بأمان                                            |

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
