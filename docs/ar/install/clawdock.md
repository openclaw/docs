---
read_when:
    - أنت تشغّل OpenClaw باستخدام Docker كثيرًا وتريد أوامر أقصر للاستخدام اليومي
    - تريد طبقة مساعدة للوحة المعلومات والسجلات وإعداد الرمز المميز وتدفقات الاقتران
summary: أدوات ClawDock المساعدة للصدفة لتثبيتات OpenClaw المستندة إلى Docker
title: ClawDock
x-i18n:
    generated_at: "2026-07-12T05:58:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bb829a3301178503f910931e86a39f7befeaf186044f4088a25dc80ea99130d
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock عبارة عن طبقة صغيرة من الأدوات المساعدة للصدفة لعمليات تثبيت OpenClaw المستندة إلى Docker.

وهي توفر لك أوامر قصيرة مثل `clawdock-start` و`clawdock-dashboard` و`clawdock-fix-token` بدلًا من استدعاءات `docker compose ...` الأطول.

إذا لم تكن قد أعددت Docker بعد، فابدأ بـ[Docker](/ar/install/docker).

## التثبيت

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

إذا سبق لك تثبيت ClawDock من `scripts/shell-helpers/clawdock-helpers.sh`، فأعد تثبيته من المسار الحالي `scripts/clawdock/clawdock-helpers.sh`؛ فقد أُزيل مسار GitHub الخام القديم.

تكتشف الأدوات المساعدة نسخة OpenClaw المحلية تلقائيًا عند أول استخدام (عبر التحقق من المسارات الشائعة مثل `~/openclaw` و`~/projects/openclaw`) وتخزّن النتيجة مؤقتًا في `~/.clawdock/config`. عيّن `CLAWDOCK_DIR` بنفسك إذا كانت نسختك المحلية موجودة في مكان آخر.

## ما الذي ستحصل عليه

### العمليات الأساسية

| الأمر                | الوصف                    |
| -------------------- | ------------------------ |
| `clawdock-start`     | تشغيل Gateway            |
| `clawdock-stop`      | إيقاف Gateway            |
| `clawdock-restart`   | إعادة تشغيل Gateway      |
| `clawdock-status`    | التحقق من حالة الحاوية   |
| `clawdock-logs`      | متابعة سجلات Gateway     |

### الوصول إلى الحاوية

| الأمر                     | الوصف                                    |
| ------------------------- | ---------------------------------------- |
| `clawdock-shell`          | فتح صدفة داخل حاوية Gateway              |
| `clawdock-cli <command>`  | تشغيل أوامر CLI الخاصة بـOpenClaw في Docker |
| `clawdock-exec <command>` | تنفيذ أمر عشوائي داخل الحاوية            |

### واجهة الويب والإقران

| الأمر                   | الوصف                         |
| ----------------------- | ----------------------------- |
| `clawdock-dashboard`    | فتح عنوان URL لواجهة التحكم   |
| `clawdock-devices`      | عرض عمليات إقران الأجهزة المعلّقة |
| `clawdock-approve <id>` | الموافقة على طلب إقران        |

### الإعداد والصيانة

| الأمر                | الوصف                                              |
| -------------------- | -------------------------------------------------- |
| `clawdock-fix-token` | كتابة رمز Gateway في إعدادات الحاوية               |
| `clawdock-update`    | السحب وإعادة البناء وإعادة التشغيل                 |
| `clawdock-rebuild`   | إعادة بناء صورة Docker فقط                         |
| `clawdock-clean`     | إزالة الحاويات ووحدات التخزين                      |

### الأدوات المساعدة

| الأمر                  | الوصف                                           |
| ---------------------- | ----------------------------------------------- |
| `clawdock-health`      | إجراء فحص سلامة Gateway                         |
| `clawdock-token`       | طباعة رمز Gateway                               |
| `clawdock-cd`          | الانتقال إلى دليل مشروع OpenClaw                |
| `clawdock-config`      | فتح `~/.openclaw`                               |
| `clawdock-show-config` | طباعة ملفات الإعدادات مع حجب القيم الحساسة      |
| `clawdock-workspace`   | فتح دليل مساحة العمل                            |
| `clawdock-help`        | عرض جميع أوامر ClawDock                         |

## سير العمل في المرة الأولى

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

إذا أشار المتصفح إلى أن الإقران مطلوب:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## الإعدادات والأسرار

يقرأ ClawDock ملفي `.env` منفصلين، بما يتوافق مع التقسيم الموضح في [Docker](/ar/install/docker):

- ملف `.env` الخاص بالمشروع بجوار `docker-compose.yml`: قيم خاصة بـDocker مثل اسم الصورة والمنافذ و`OPENCLAW_GATEWAY_TOKEN`. يقرأ `clawdock-token` الرمز من هنا.
- `~/.openclaw/.env` (يُركّب داخل الحاوية): أسرار مدعومة بمتغيرات البيئة يديرها OpenClaw نفسه، إلى جانب `openclaw.json` و`agents/<agentId>/agent/auth-profiles.json`.

ينسخ `clawdock-fix-token` الرمز من ملف `.env` الخاص بالمشروع إلى قيمتي الإعداد `gateway.remote.token` و`gateway.auth.token` داخل الحاوية، ثم يعيد تشغيل Gateway.

استخدم `clawdock-show-config` لفحص `openclaw.json` وملفي `.env` بسرعة؛ إذ يحجب قيم `.env` في المخرجات المطبوعة.

## ذو صلة

<CardGroup cols={2}>
  <Card title="Docker" href="/ar/install/docker" icon="docker">
    التثبيت القياسي لـOpenClaw باستخدام Docker.
  </Card>
  <Card title="بيئة تشغيل آلة Docker الافتراضية" href="/ar/install/docker-vm-runtime" icon="cube">
    بيئة تشغيل آلة افتراضية يديرها Docker لتوفير عزل مُحصّن.
  </Card>
  <Card title="التحديث" href="/ar/install/updating" icon="arrow-up-right-from-square">
    تحديث حزمة OpenClaw والخدمات المُدارة.
  </Card>
</CardGroup>
