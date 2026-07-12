---
read_when:
    - تريد ربط أحداث Gmail Pub/Sub بـ OpenClaw
    - تحتاج إلى القائمة الكاملة للأعلام وقيمها الافتراضية
summary: مرجع CLI لـ `openclaw webhooks` (إعداد Gmail Pub/Sub والمُشغِّل)
title: Webhooks
x-i18n:
    generated_at: "2026-07-12T05:48:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fff0ac2ce247402f45523eda0b5cdd551bd65212636118698e45cb8740236c
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

أدوات مساعدة وتكاملات Webhook. يقتصر هذا السطح حاليًا على تدفقات Gmail Pub/Sub المبنية على مراقب `gog` المضمّن.

## الأوامر الفرعية

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| الأمر الفرعي   | الوصف                                                                                  |
| -------------- | -------------------------------------------------------------------------------------- |
| `gmail setup`  | معالج إعداد لمرة واحدة: مراقبة Gmail وموضوع Pub/Sub واشتراكه وتسليم خطاف OpenClaw.     |
| `gmail run`    | تشغيل `gog watch serve` مع حلقة التجديد التلقائي للمراقبة في الواجهة الأمامية.         |

<Note>
يشغّل Gateway أيضًا `gog gmail watch serve` تلقائيًا عند بدء التشغيل بعد تعيين `hooks.enabled=true` و`hooks.gmail.account` (يعيّنهما `gmail setup`). يستخدم `gmail run` المنطق نفسه في الواجهة الأمامية، وهو مفيد لتصحيح الأخطاء أو عند تعطيل مراقب Gateway. راجع [تكامل Gmail Pub/Sub](/ar/automation/cron-jobs#gmail-pubsub-integration) لمعرفة تفاصيل التشغيل التلقائي وخيار إلغاء الاشتراك `OPENCLAW_SKIP_GMAIL_WATCHER`.
</Note>

## `webhooks gmail setup`

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

يثبّت `gcloud` و`gog` إذا لم يكونا متوفرين، ويصادق `gcloud`، وينشئ موضوع Pub/Sub والاشتراك، ويبدأ مراقبة Gmail، ويكتب إعدادات `hooks.gmail` مع `hooks.enabled=true`. يطبع `Next: openclaw webhooks gmail run`.

### مطلوب

| العلامة              | الوصف                       |
| -------------------- | --------------------------- |
| `--account <email>`  | حساب Gmail المراد مراقبته.  |

### خيارات Pub/Sub

| العلامة                 | القيمة الافتراضية      | الوصف                                                                                                                                             |
| ----------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--project <id>`        | (لا توجد)               | معرّف مشروع GCP (مالك عميل OAuth). يعود إلى معرّف مشروع الموضوع نفسه، ثم إلى المشروع المستخرج من بيانات اعتماد `gog`.                           |
| `--topic <name>`        | `gog-gmail-watch`       | اسم موضوع Pub/Sub.                                                                                                                               |
| `--subscription <name>` | `gog-gmail-watch-push`  | اسم اشتراك Pub/Sub.                                                                                                                              |
| `--label <label>`       | `INBOX`                 | تصنيف Gmail المراد مراقبته.                                                                                                                      |
| `--push-endpoint <url>` | (لا توجد)               | نقطة نهاية دفع Pub/Sub صريحة. تتجاوز Tailscale.                                                                                                  |

### خيارات تسليم OpenClaw

| العلامة                | القيمة الافتراضية                                  | الوصف                       |
| ---------------------- | -------------------------------------------------- | --------------------------- |
| `--hook-url <url>`     | يُنشأ من `hooks.path` ومنفذ Gateway                | عنوان URL لـ Webhook الخاص بـ OpenClaw. |
| `--hook-token <token>` | `hooks.token`، أو رمز مميز مُنشأ                   | الرمز المميز لـ Webhook الخاص بـ OpenClaw. |
| `--push-token <token>` | رمز مميز مُنشأ                                     | رمز الدفع الممرّر إلى `gog watch serve`. |

### خيارات `gog watch serve`

| العلامة                 | القيمة الافتراضية | الوصف                                                                                                                                                                |
| ----------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--bind <host>`         | `127.0.0.1`       | مضيف الربط لـ `gog watch serve`.                                                                                                                                     |
| `--port <port>`         | `8788`            | منفذ `gog watch serve`.                                                                                                                                              |
| `--path <path>`         | `/gmail-pubsub`   | مسار `gog watch serve`. يُفرض على `/` عند تمكين Tailscale من دون هدف صريح، لأن Tailscale يزيل المسار قبل تمريره عبر الوكيل.                                        |
| `--include-body`        | `true`            | تضمين مقتطفات من نص الرسالة. لا توجد علامة CLI لتعطيل ذلك؛ عيّن بدلًا منها `hooks.gmail.includeBody: false` في الإعدادات.                                          |
| `--max-bytes <n>`       | `20000`           | الحد الأقصى لعدد البايتات لكل مقتطف من النص.                                                                                                                         |
| `--renew-minutes <n>`   | `720` (12 ساعة)   | تجديد مراقبة Gmail كل N دقيقة.                                                                                                                                       |

### الإتاحة عبر Tailscale

| العلامة                    | القيمة الافتراضية | الوصف                                                                  |
| -------------------------- | ----------------- | ---------------------------------------------------------------------- |
| `--tailscale <mode>`       | `funnel`          | إتاحة نقطة نهاية الدفع عبر Tailscale:‏ `funnel` أو `serve` أو `off`.   |
| `--tailscale-path <path>`  | (لا توجد)         | مسار خدمة/نفق Tailscale.                                               |
| `--tailscale-target <t>`   | (لا توجد)         | هدف خدمة/نفق Tailscale (منفذ أو `host:port` أو عنوان URL).             |

### المخرجات

| العلامة  | الوصف                                                |
| -------- | ---------------------------------------------------- |
| `--json` | طباعة ملخص قابل للقراءة آليًا بدلًا من النص.        |

## `webhooks gmail run`

```bash
openclaw webhooks gmail run --account you@example.com
```

يشغّل `gog watch serve` مع حلقة التجديد التلقائي للمراقبة في الواجهة الأمامية، ويعيد تشغيل `gog watch serve` بعد تأخير قدره ثانيتان إذا توقف بشكل غير متوقع.

يقبل `run` علامات Pub/Sub وتسليم OpenClaw و`gog watch serve` وTailscale نفسها التي يقبلها `setup`، باستثناء ما يلي:

- تكون `--account` **اختيارية** مع `run`؛ ويعود إلى `hooks.gmail.account`.
- لا يقبل `run` الخيارات `--project` أو `--push-endpoint` أو `--json`.
- تعود كل علامة إلى قيمة إعدادات `hooks.gmail.*` المطابقة (التي يكتبها `setup`)، ثم إلى القيمة الافتراضية المضمّنة نفسها التي يستخدمها `setup`، مع استثناء واحد: تكون القيمة الافتراضية لـ `--tailscale` هي `off` مع `run` (وليست `funnel`) عندما لا تكون العلامة ولا `hooks.gmail.tailscale.mode` معيّنة.

| الفئة                 | العلامات                                                                         |
| --------------------- | -------------------------------------------------------------------------------- |
| Pub/Sub               | `--account`، `--topic`، `--subscription`، `--label`                              |
| تسليم OpenClaw        | `--hook-url`، `--hook-token`، `--push-token`                                     |
| `gog watch serve`     | `--bind`، `--port`، `--path`، `--include-body`، `--max-bytes`، `--renew-minutes` |
| Tailscale             | `--tailscale`، `--tailscale-path`، `--tailscale-target`                          |

<Note>
بالنسبة إلى `run`، تكون قيمة `--topic` هي المسار الكامل لموضوع Pub/Sub ‏(`projects/.../topics/...`)، وليست مجرد اسم الموضوع المختصر.
</Note>

## ذو صلة

- [مرجع CLI](/ar/cli)
- [أتمتة Webhook](/ar/automation/cron-jobs)
- [تكامل Gmail Pub/Sub](/ar/automation/cron-jobs#gmail-pubsub-integration)
