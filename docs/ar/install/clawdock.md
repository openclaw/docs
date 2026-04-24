---
read_when:
    - أنت تشغّل OpenClaw باستخدام Docker كثيرًا وتريد أوامر يومية أقصر
    - تريد طبقة مساعدة للوحة التحكم، والسجلات، وإعداد الرمز المميز، وتدفقات الاقتران
summary: مساعدات shell لـ ClawDock لعمليات تثبيت OpenClaw المعتمدة على Docker
title: ClawDock
x-i18n:
    generated_at: "2026-04-24T07:47:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 308ac338cb8a94d7996489ef9d751a9359b22ddd3c44d64774c6a2275b29aa22
    source_path: install/clawdock.md
    workflow: 15
---

ClawDock هو طبقة صغيرة من مساعدات shell لعمليات تثبيت OpenClaw المعتمدة على Docker.

يوفر لك أوامر قصيرة مثل `clawdock-start` و`clawdock-dashboard` و`clawdock-fix-token` بدلًا من استدعاءات `docker compose ...` الأطول.

إذا لم تكن قد أعددت Docker بعد، فابدأ من [Docker](/ar/install/docker).

## التثبيت

استخدم مسار المساعد الأساسي:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

إذا كنت قد ثبّت ClawDock سابقًا من `scripts/shell-helpers/clawdock-helpers.sh`، فأعد التثبيت من المسار الجديد `scripts/clawdock/clawdock-helpers.sh`. لقد تمت إزالة مسار GitHub الخام القديم.

## ما الذي تحصل عليه

### العمليات الأساسية

| الأمر              | الوصف                    |
| ------------------ | ------------------------ |
| `clawdock-start`   | بدء Gateway              |
| `clawdock-stop`    | إيقاف Gateway            |
| `clawdock-restart` | إعادة تشغيل Gateway      |
| `clawdock-status`  | التحقق من حالة الحاوية   |
| `clawdock-logs`    | متابعة سجلات Gateway     |

### الوصول إلى الحاوية

| الأمر                     | الوصف                                        |
| ------------------------- | -------------------------------------------- |
| `clawdock-shell`          | فتح shell داخل حاوية Gateway                 |
| `clawdock-cli <command>`  | تشغيل أوامر OpenClaw CLI داخل Docker         |
| `clawdock-exec <command>` | تنفيذ أمر عشوائي داخل الحاوية                |

### Web UI والاقتران

| الأمر                   | الوصف                      |
| ----------------------- | -------------------------- |
| `clawdock-dashboard`    | فتح عنوان URL الخاص بـ Control UI |
| `clawdock-devices`      | عرض عمليات اقتران الأجهزة المعلقة |
| `clawdock-approve <id>` | الموافقة على طلب اقتران     |

### الإعداد والصيانة

| الأمر                | الوصف                                           |
| -------------------- | ----------------------------------------------- |
| `clawdock-fix-token` | تكوين رمز Gateway المميز داخل الحاوية           |
| `clawdock-update`    | السحب، وإعادة البناء، وإعادة التشغيل            |
| `clawdock-rebuild`   | إعادة بناء صورة Docker فقط                      |
| `clawdock-clean`     | إزالة الحاويات ووحدات التخزين                   |

### الأدوات المساعدة

| الأمر                  | الوصف                                  |
| ---------------------- | -------------------------------------- |
| `clawdock-health`      | تشغيل فحص سلامة لـ Gateway             |
| `clawdock-token`       | طباعة رمز Gateway المميز               |
| `clawdock-cd`          | الانتقال إلى دليل مشروع OpenClaw      |
| `clawdock-config`      | فتح `~/.openclaw`                      |
| `clawdock-show-config` | طباعة ملفات التكوين مع تنقيح القيم     |
| `clawdock-workspace`   | فتح دليل مساحة العمل                   |

## تدفق الاستخدام لأول مرة

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

إذا أشار المتصفح إلى أن الاقتران مطلوب:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## التكوين والأسرار

يعمل ClawDock مع تقسيم تكوين Docker نفسه الموضح في [Docker](/ar/install/docker):

- `<project>/.env` للقيم الخاصة بـ Docker مثل اسم الصورة، والمنافذ، ورمز Gateway المميز
- `~/.openclaw/.env` لمفاتيح المزوّد المدعومة عبر env ورموز البوت المميزة
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` لمصادقة OAuth/API-key الخاصة بالمزوّد المخزنة
- `~/.openclaw/openclaw.json` لتكوين السلوك

استخدم `clawdock-show-config` عندما تريد فحص ملفات `.env` و`openclaw.json` بسرعة. فهو ينقّح قيم `.env` في المخرجات المطبوعة.

## صفحات ذات صلة

- [Docker](/ar/install/docker)
- [Docker VM Runtime](/ar/install/docker-vm-runtime)
- [التحديث](/ar/install/updating)
