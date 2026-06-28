---
read_when:
    - تستخدم Plugin المكالمات الصوتية وتريد كل نقطة دخول في CLI
    - تحتاج إلى جداول الخيارات والقيم الافتراضية لـ setup و smoke و call و continue و speak و dtmf و end و status و tail و latency و expose و start
summary: مرجع CLI لـ `openclaw voicecall` (واجهة أوامر Plugin الخاص بالمكالمات الصوتية)
title: مكالمة صوتية
x-i18n:
    generated_at: "2026-05-10T19:32:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24013c06bf3e688bd86caa407bf20dddabe0dff60a400ed4f23478de62308634
    source_path: cli/voicecall.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw voicecall`

`voicecall` هو أمر يوفره Plugin. ولا يظهر إلا عند تثبيت Plugin المكالمات الصوتية وتمكينه.

عندما يكون Gateway قيد التشغيل، تُوجَّه أوامر التشغيل (`call`، `start`، `continue`، `speak`، `dtmf`، `end`، `status`) إلى وقت تشغيل المكالمات الصوتية الخاص بذلك Gateway. وإذا تعذّر الوصول إلى أي Gateway، فإنها تعود إلى وقت تشغيل CLI مستقل.

## الأوامر الفرعية

```bash
openclaw voicecall setup    [--json]
openclaw voicecall smoke    [-t <phone>] [--message <text>] [--mode <m>] [--yes] [--json]
openclaw voicecall call     -m <text> [-t <phone>] [--mode <m>]
openclaw voicecall start    --to <phone> [--message <text>] [--mode <m>]
openclaw voicecall continue --call-id <id> --message <text>
openclaw voicecall speak    --call-id <id> --message <text>
openclaw voicecall dtmf     --call-id <id> --digits <digits>
openclaw voicecall end      --call-id <id>
openclaw voicecall status   [--call-id <id>] [--json]
openclaw voicecall tail     [--file <path>] [--since <n>] [--poll <ms>]
openclaw voicecall latency  [--file <path>] [--last <n>]
openclaw voicecall expose   [--mode <m>] [--path <p>] [--port <port>] [--serve-path <p>]
```

| الأمر الفرعي | الوصف                                                     |
| ---------- | --------------------------------------------------------------- |
| `setup`    | اعرض فحوص جاهزية المزوّد وWebhook.                     |
| `smoke`    | شغّل فحوص الجاهزية؛ ولا تُجرِ مكالمة اختبار مباشرة إلا مع `--yes`. |
| `call`     | ابدأ مكالمة صوتية صادرة.                                |
| `start`    | اسم بديل لـ `call` مع اشتراط `--to` وجعل `--message` اختياريًا. |
| `continue` | انطق رسالة وانتظر الاستجابة التالية.                 |
| `speak`    | انطق رسالة دون انتظار استجابة.                 |
| `dtmf`     | أرسل أرقام DTMF إلى مكالمة نشطة.                             |
| `end`      | أنهِ مكالمة نشطة.                                         |
| `status`   | افحص المكالمات النشطة (أو مكالمة واحدة عبر `--call-id`).                   |
| `tail`     | تتبّع `calls.jsonl` (مفيد أثناء اختبارات المزوّد).              |
| `latency`  | لخّص مقاييس زمن انتقال الدور من `calls.jsonl`.              |
| `expose`   | بدّل إعدادات Tailscale serve/funnel لنقطة نهاية Webhook.         |

## الإعداد والاختبار الأولي

### `setup`

يطبع فحوص جاهزية قابلة للقراءة البشرية افتراضيًا. مرّر `--json` للاستخدام في السكربتات.

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

يشغّل فحوص الجاهزية نفسها. ولن يجري مكالمة هاتفية حقيقية إلا إذا كان كل من `--to` و`--yes` موجودين.

| العلم               | الافتراضي                           | الوصف                             |
| ------------------ | --------------------------------- | --------------------------------------- |
| `-t, --to <phone>` | (لا شيء)                            | رقم الهاتف المطلوب الاتصال به لاختبار مباشر.  |
| `--message <text>` | `OpenClaw voice call smoke test.` | الرسالة المراد نطقها أثناء مكالمة الاختبار. |
| `--mode <mode>`    | `notify`                          | وضع المكالمة: `notify` أو `conversation`.  |
| `--yes`            | `false`                           | إجراء المكالمة الصادرة المباشرة فعليًا.  |
| `--json`           | `false`                           | اطبع JSON قابلًا للقراءة آليًا.            |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # تشغيل تجريبي
openclaw voicecall smoke --to "+15555550123" --yes  # مكالمة notify مباشرة
```

<Note>
بالنسبة إلى المزوّدين الخارجيين (`twilio`، `telnyx`، `plivo`)، يتطلب `setup` و`smoke` عنوان Webhook URL عامًا من `publicUrl` أو نفقًا أو تعريضًا عبر Tailscale. يُرفض بديل local loopback أو serve خاص لأن شركات الاتصالات لا يمكنها الوصول إليه.
</Note>

## دورة حياة المكالمة

### `call`

ابدأ مكالمة صوتية صادرة.

| العلم                   | مطلوب | الافتراضي           | الوصف                                                                |
| ---------------------- | -------- | ----------------- | -------------------------------------------------------------------------- |
| `-m, --message <text>` | نعم      | (لا شيء)            | الرسالة المراد نطقها عند اتصال المكالمة.                                   |
| `-t, --to <phone>`     | لا       | config `toNumber` | رقم هاتف E.164 المطلوب الاتصال به.                                                |
| `--mode <mode>`        | لا       | `conversation`    | وضع المكالمة: `notify` (إنهاء المكالمة بعد الرسالة) أو `conversation` (إبقاؤها مفتوحة). |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

اسم بديل لـ `call` بشكل أعلام افتراضي مختلف.

| العلم               | مطلوب | الافتراضي        | الوصف                              |
| ------------------ | -------- | -------------- | ---------------------------------------- |
| `--to <phone>`     | نعم      | (لا شيء)         | رقم الهاتف المطلوب الاتصال به.                    |
| `--message <text>` | لا       | (لا شيء)         | الرسالة المراد نطقها عند اتصال المكالمة. |
| `--mode <mode>`    | لا       | `conversation` | وضع المكالمة: `notify` أو `conversation`.   |

### `continue`

انطق رسالة وانتظر استجابة.

| العلم               | مطلوب | الوصف       |
| ------------------ | -------- | ----------------- |
| `--call-id <id>`   | نعم      | معرّف المكالمة.          |
| `--message <text>` | نعم      | الرسالة المراد نطقها. |

### `speak`

انطق رسالة دون انتظار استجابة.

| العلم               | مطلوب | الوصف       |
| ------------------ | -------- | ----------------- |
| `--call-id <id>`   | نعم      | معرّف المكالمة.          |
| `--message <text>` | نعم      | الرسالة المراد نطقها. |

### `dtmf`

أرسل أرقام DTMF إلى مكالمة نشطة.

| العلم                | مطلوب | الوصف                               |
| ------------------- | -------- | ----------------------------------------- |
| `--call-id <id>`    | نعم      | معرّف المكالمة.                                  |
| `--digits <digits>` | نعم      | أرقام DTMF (مثل `ww123456#` للانتظارات). |

### `end`

أنهِ مكالمة نشطة.

| العلم             | مطلوب | الوصف |
| ---------------- | -------- | ----------- |
| `--call-id <id>` | نعم      | معرّف المكالمة.    |

### `status`

افحص المكالمات النشطة.

| العلم             | الافتراضي | الوصف                  |
| ---------------- | ------- | ---------------------------- |
| `--call-id <id>` | (لا شيء)  | احصر المخرجات في مكالمة واحدة. |
| `--json`         | `false` | اطبع JSON قابلًا للقراءة آليًا. |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## السجلات والمقاييس

### `tail`

تتبّع سجل JSONL للمكالمات الصوتية. يطبع آخر أسطر `--since` عند البدء، ثم يبث الأسطر الجديدة أثناء كتابتها.

| العلم            | الافتراضي                    | الوصف                    |
| --------------- | -------------------------- | ------------------------------ |
| `--file <path>` | يُحل من مخزن Plugin | المسار إلى `calls.jsonl`.         |
| `--since <n>`   | `25`                       | الأسطر المطلوب طباعتها قبل التتبّع. |
| `--poll <ms>`   | `250` (الحد الأدنى 50)         | فاصل الاستقصاء بالمللي ثانية. |

### `latency`

لخّص مقاييس زمن انتقال الدور وانتظار الاستماع من `calls.jsonl`. تكون المخرجات JSON يتضمن ملخصات `recordsScanned` و`turnLatency` و`listenWait`.

| العلم            | الافتراضي                    | الوصف                          |
| --------------- | -------------------------- | ------------------------------------ |
| `--file <path>` | يُحل من مخزن Plugin | المسار إلى `calls.jsonl`.               |
| `--last <n>`    | `200` (الحد الأدنى 1)          | عدد السجلات الحديثة المطلوب تحليلها. |

## تعريض Webhooks

### `expose`

مكّن أو عطّل أو غيّر إعدادات Tailscale serve/funnel لWebhook الصوتي.

| العلم                  | الافتراضي                                   | الوصف                                     |
| --------------------- | ----------------------------------------- | ----------------------------------------------- |
| `--mode <mode>`       | `funnel`                                  | `off` أو `serve` (tailnet) أو `funnel` (عام). |
| `--path <path>`       | config `tailscale.path` أو `--serve-path` | مسار Tailscale المراد تعريضه.                       |
| `--port <port>`       | config `serve.port` أو `3334`             | منفذ Webhook المحلي.                             |
| `--serve-path <path>` | config `serve.path` أو `/voice/webhook`   | مسار Webhook المحلي.                             |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
لا تعرّض نقطة نهاية Webhook إلا للشبكات التي تثق بها. فضّل Tailscale Serve على Funnel عندما يكون ذلك ممكنًا.
</Warning>

## ذات صلة

- [مرجع CLI](/ar/cli)
- [Plugin المكالمات الصوتية](/ar/plugins/voice-call)
