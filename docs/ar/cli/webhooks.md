---
read_when:
    - تريد ربط أحداث Gmail Pub/Sub بـ OpenClaw
    - تحتاج إلى القائمة الكاملة للخيارات وقيمها الافتراضية
summary: مرجع CLI لـ `openclaw webhooks` (إعداد Gmail Pub/Sub والمشغّل)
title: Webhooks
x-i18n:
    generated_at: "2026-05-10T19:32:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9ce17ca78bbe9836edd4643a262833e52cceb27f441d5922c036777e47a6f74
    source_path: cli/webhooks.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw webhooks`

مساعدات Webhook وتكاملاته. حاليًا يقتصر هذا السطح على تدفقات Gmail Pub/Sub التي تتكامل مع مراقب `gog` المضمّن.

## الأوامر الفرعية

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| الأمر الفرعي | الوصف |
| ------------- | -------------------------------------------------------------------------------------------- |
| `gmail setup` | تكوين مراقبة Gmail، وموضوع/اشتراك Pub/Sub، وهدف تسليم Webhook في OpenClaw. |
| `gmail run`   | تشغيل `gog watch serve` بالإضافة إلى حلقة التجديد التلقائي للمراقبة. |

## `webhooks gmail setup`

تكوين مراقبة Gmail وPub/Sub وتسليم Webhook في OpenClaw.

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### مطلوب

| العلم | الوصف |
| ------------------- | ----------------------- |
| `--account <email>` | حساب Gmail المراد مراقبته. |

### خيارات Pub/Sub

| العلم | الافتراضي | الوصف |
| ----------------------- | ---------------------- | ---------------------------------------------------- |
| `--project <id>`        | (لا شيء)               | معرّف مشروع GCP (مالك عميل OAuth). |
| `--topic <name>`        | `gog-gmail-watch`      | اسم موضوع Pub/Sub. |
| `--subscription <name>` | `gog-gmail-watch-push` | اسم اشتراك Pub/Sub. |
| `--label <label>`       | `INBOX`                | تصنيف Gmail المراد مراقبته. |
| `--push-endpoint <url>` | (لا شيء)               | نقطة نهاية دفع Pub/Sub صريحة. يتجاوز Tailscale. |

### خيارات تسليم OpenClaw

| العلم | الافتراضي | الوصف |
| ---------------------- | ------- | ------------------------------------------ |
| `--hook-url <url>`     | (لا شيء) | عنوان URL لـ Webhook في OpenClaw. |
| `--hook-token <token>` | (لا شيء) | رمز Webhook في OpenClaw. |
| `--push-token <token>` | (لا شيء) | رمز الدفع المُمرَّر إلى `gog watch serve`. |

### خيارات `gog watch serve`

| العلم | الافتراضي | الوصف |
| --------------------- | --------------- | ----------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`     | مضيف الربط لـ `gog watch serve`. |
| `--port <port>`       | `8788`          | منفذ `gog watch serve`. |
| `--path <path>`       | `/gmail-pubsub` | مسار `gog watch serve`. |
| `--include-body`      | `true`          | تضمين مقتطفات متن البريد الإلكتروني. مرّر `--no-include-body` للتعطيل. |
| `--max-bytes <n>`     | `20000`         | الحد الأقصى للبايتات لكل مقتطف متن. |
| `--renew-minutes <n>` | `720` (12h)     | تجديد مراقبة Gmail كل N دقيقة. |

### كشف Tailscale

| العلم | الافتراضي | الوصف |
| ------------------------- | -------- | ---------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel` | كشف نقطة نهاية الدفع عبر tailscale: `funnel` أو `serve` أو `off`. |
| `--tailscale-path <path>` | (لا شيء) | مسار tailscale serve/funnel. |
| `--tailscale-target <t>`  | (لا شيء) | هدف Tailscale serve/funnel (منفذ، أو `host:port`، أو URL). |

### الإخراج

| العلم | الوصف |
| -------- | ------------------------------------------------- |
| `--json` | طباعة ملخص قابل للقراءة آليًا بدلًا من النص. |

## `webhooks gmail run`

تشغيل `gog watch serve` بالإضافة إلى حلقة التجديد التلقائي للمراقبة في المقدمة.

```bash
openclaw webhooks gmail run --account you@example.com
```

يقبل `run` أعلام `gog watch serve` نفسها، وتسليم OpenClaw، وPub/Sub، وTailscale مثل `setup`، باستثناء:

- `--account` **اختياري** في `run` (يرجع إلى الحساب المكوّن).
- لا يقبل `run` الأعلام `--project` أو `--push-endpoint` أو `--json`.
- لا تحتوي أعلام `run` على افتراضيات مدمجة؛ تعود القيم المفقودة إلى القيم التي كتبها `setup`.

| الفئة | الأعلام |
| ----------------- | -------------------------------------------------------------------------------- |
| Pub/Sub           | `--account`, `--topic`, `--subscription`, `--label`                              |
| تسليم OpenClaw | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve` | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale         | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
بالنسبة إلى `run`، تكون قيمة `--topic` هي مسار موضوع Pub/Sub الكامل (`projects/.../topics/...`)، وليس اسم الموضوع القصير فقط.
</Note>

## التدفق من البداية إلى النهاية

راجع [تكامل Gmail Pub/Sub](/ar/automation/cron-jobs#gmail-pubsub-integration) لإعداد مشروع GCP وOAuth وجانب Gateway الذي يقترن بأوامر CLI هذه.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [أتمتة Webhook](/ar/automation/cron-jobs)
- [Gmail Pub/Sub](/ar/automation/cron-jobs#gmail-pubsub-integration)
