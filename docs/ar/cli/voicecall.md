---
read_when:
    - أنت تستخدم Plugin المكالمات الصوتية وتريد كل نقطة دخول في CLI
    - تحتاج إلى جداول الخيارات والقيم الافتراضية لأوامر setup وsmoke وcall وcontinue وspeak وdtmf وend وstatus وtail وlatency وexpose وstart
summary: مرجع CLI لـ `openclaw voicecall` (واجهة أوامر Plugin للمكالمات الصوتية)
title: المكالمة الصوتية
x-i18n:
    generated_at: "2026-07-12T05:44:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aec445886cccb79c9212dd9f1f448ff9634274deb380632be786478c9bb29670
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` هو أمر يوفّره Plugin. ولا يظهر إلا عند تثبيت Plugin المكالمات الصوتية وتمكينه.

عندما يكون Gateway قيد التشغيل، تُوجَّه الأوامر التشغيلية (`call` و`start`
و`continue` و`speak` و`dtmf` و`end` و`status`) إلى بيئة تشغيل المكالمات
الصوتية التابعة لذلك Gateway. وإذا تعذّر الوصول إلى أي Gateway، فإنها تعود
إلى بيئة تشغيل CLI مستقلة.

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

| الأمر الفرعي | الوصف                                                                  |
| ------------ | ---------------------------------------------------------------------- |
| `setup`      | عرض عمليات التحقق من جاهزية المزوّد وWebhook.                          |
| `smoke`      | تشغيل فحوصات الجاهزية؛ وإجراء مكالمة اختبارية فعلية فقط مع `--yes`.    |
| `call`       | بدء مكالمة صوتية صادرة.                                                |
| `start`      | اسم مستعار لـ`call` يتطلب `--to` ويكون فيه `--message` اختياريًا.      |
| `continue`   | نطق رسالة وانتظار الاستجابة التالية.                                  |
| `speak`      | نطق رسالة من دون انتظار استجابة.                                      |
| `dtmf`       | إرسال أرقام DTMF إلى مكالمة نشطة.                                      |
| `end`        | إنهاء مكالمة نشطة.                                                     |
| `status`     | فحص المكالمات النشطة (أو مكالمة واحدة باستخدام `--call-id`).          |
| `tail`       | متابعة `calls.jsonl` (مفيد أثناء اختبارات المزوّد).                    |
| `latency`    | تلخيص مقاييس زمن استجابة الأدوار من `calls.jsonl`.                     |
| `expose`     | تبديل إعداد التقديم/النفق في Tailscale لنقطة نهاية Webhook.            |

## الإعداد والاختبار الأولي

### `setup`

يطبع افتراضيًا فحوصات جاهزية مقروءة للبشر. مرّر `--json` للاستخدام في البرامج النصية.

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

يشغّل فحوصات الجاهزية نفسها. ولا يجري مكالمة هاتفية حقيقية إلا عند وجود
كلٍّ من `--to` و`--yes`.

| الخيار             | القيمة الافتراضية                | الوصف                                             |
| ------------------ | -------------------------------- | ------------------------------------------------- |
| `-t, --to <phone>` | (لا توجد)                        | رقم الهاتف المطلوب الاتصال به للاختبار الفعلي.   |
| `--message <text>` | `OpenClaw voice call smoke test.` | الرسالة المطلوب نطقها أثناء المكالمة الاختبارية. |
| `--mode <mode>`    | `notify`                         | وضع المكالمة: `notify` أو `conversation`.         |
| `--yes`            | `false`                          | إجراء المكالمة الصادرة الفعلية.                   |
| `--json`           | `false`                          | طباعة JSON قابل للقراءة آليًا.                    |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # تشغيل تجريبي
openclaw voicecall smoke --to "+15555550123" --yes  # مكالمة إشعار فعلية
```

<Note>
بالنسبة إلى المزوّدين الخارجيين (`plivo` و`telnyx` و`twilio`)، يتطلب `setup` و`smoke` عنوان URL عامًا لـWebhook من `publicUrl` أو نفقًا أو إتاحة عبر Tailscale. يُرفض الرجوع إلى local loopback أو تقديم خاص لأن شركات الاتصالات لا يمكنها الوصول إليه.
</Note>

## دورة حياة المكالمة

### `call`

بدء مكالمة صوتية صادرة.

| الخيار                 | مطلوب | القيمة الافتراضية | الوصف                                                                           |
| ---------------------- | ----- | ----------------- | ------------------------------------------------------------------------------- |
| `-m, --message <text>` | نعم   | (لا توجد)         | الرسالة المطلوب نطقها عند اتصال المكالمة.                                       |
| `-t, --to <phone>`     | لا    | إعداد `toNumber`  | رقم الهاتف المطلوب الاتصال به بتنسيق E.164.                                     |
| `--mode <mode>`        | لا    | `conversation`    | وضع المكالمة: `notify` (إنهاء المكالمة بعد الرسالة) أو `conversation` (إبقاؤها مفتوحة). |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

اسم مستعار لـ`call` مع بنية مختلفة للخيارات الافتراضية.

| الخيار             | مطلوب | القيمة الافتراضية | الوصف                                          |
| ------------------ | ----- | ----------------- | ---------------------------------------------- |
| `--to <phone>`     | نعم   | (لا توجد)         | رقم الهاتف المطلوب الاتصال به.                 |
| `--message <text>` | لا    | (لا توجد)         | الرسالة المطلوب نطقها عند اتصال المكالمة.      |
| `--mode <mode>`    | لا    | `conversation`    | وضع المكالمة: `notify` أو `conversation`.      |

### `continue`

نطق رسالة وانتظار استجابة.

| الخيار             | مطلوب | الوصف                    |
| ------------------ | ----- | ------------------------ |
| `--call-id <id>`   | نعم   | معرّف المكالمة.          |
| `--message <text>` | نعم   | الرسالة المطلوب نطقها.   |

### `speak`

نطق رسالة من دون انتظار استجابة.

| الخيار             | مطلوب | الوصف                    |
| ------------------ | ----- | ------------------------ |
| `--call-id <id>`   | نعم   | معرّف المكالمة.          |
| `--message <text>` | نعم   | الرسالة المطلوب نطقها.   |

### `dtmf`

إرسال أرقام DTMF إلى مكالمة نشطة.

| الخيار              | مطلوب | الوصف                                                 |
| ------------------- | ----- | ----------------------------------------------------- |
| `--call-id <id>`    | نعم   | معرّف المكالمة.                                       |
| `--digits <digits>` | نعم   | أرقام DTMF (على سبيل المثال `ww123456#` لفترات الانتظار). |

### `end`

إنهاء مكالمة نشطة.

| الخيار           | مطلوب | الوصف           |
| ---------------- | ----- | --------------- |
| `--call-id <id>` | نعم   | معرّف المكالمة. |

### `status`

فحص المكالمات النشطة.

| الخيار           | القيمة الافتراضية | الوصف                               |
| ---------------- | ------------------ | ----------------------------------- |
| `--call-id <id>` | (لا توجد)          | قصر المخرجات على مكالمة واحدة.      |
| `--json`         | `false`            | طباعة JSON قابل للقراءة آليًا.      |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## السجلات والمقاييس

### `tail`

متابعة سجل JSONL للمكالمات الصوتية. يطبع آخر `--since` سطرًا عند البدء، ثم
يبث الأسطر الجديدة عند كتابتها.

| الخيار          | القيمة الافتراضية              | الوصف                                  |
| --------------- | ------------------------------- | -------------------------------------- |
| `--file <path>` | يُحدَّد من مخزن Plugin          | المسار إلى `calls.jsonl`.              |
| `--since <n>`   | `25`                            | الأسطر المطلوب طباعتها قبل بدء المتابعة. |
| `--poll <ms>`   | `250` (الحد الأدنى 50)          | الفاصل الزمني للاستقصاء بالمللي ثانية. |

### `latency`

تلخيص مقاييس زمن استجابة الأدوار وانتظار الاستماع من `calls.jsonl`. يكون
الإخراج بتنسيق JSON ويتضمن ملخصات `recordsScanned` و`turnLatency` و`listenWait`.

| الخيار          | القيمة الافتراضية              | الوصف                                      |
| --------------- | ------------------------------- | ------------------------------------------ |
| `--file <path>` | يُحدَّد من مخزن Plugin          | المسار إلى `calls.jsonl`.                  |
| `--last <n>`    | `200` (الحد الأدنى 1)           | عدد السجلات الحديثة المطلوب تحليلها.       |

## إتاحة Webhook

### `expose`

تمكين إعداد التقديم/النفق في Tailscale لـWebhook الصوتي أو تعطيله أو تغييره.

| الخيار                | القيمة الافتراضية                         | الوصف                                              |
| --------------------- | ----------------------------------------- | -------------------------------------------------- |
| `--mode <mode>`       | `funnel`                                  | `off` أو `serve` (شبكة tailnet) أو `funnel` (عام). |
| `--path <path>`       | إعداد `tailscale.path` أو `--serve-path`  | مسار Tailscale المطلوب إتاحته.                     |
| `--port <port>`       | إعداد `serve.port` أو `3334`              | منفذ Webhook المحلي.                               |
| `--serve-path <path>` | إعداد `serve.path` أو `/voice/webhook`    | مسار Webhook المحلي.                               |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
لا تُتِح نقطة نهاية Webhook إلا للشبكات التي تثق بها. فضّل Tailscale Serve على Funnel متى أمكن.
</Warning>

## ذات صلة

- [مرجع CLI](/ar/cli)
- [Plugin المكالمات الصوتية](/ar/plugins/voice-call)
