---
read_when:
    - تريد قراءة ملخصات النصوص المحفوظة من الطرفية
    - تحتاج إلى المسار المؤدي إلى ملخص Markdown للنصوص المفرغة
    - أنت تعمل على تصحيح أخطاء تخطيط تخزين النصوص الأساسية للجلسات
summary: مرجع CLI للأمر `openclaw transcripts` (سرد النصوص المحفوظة وعرضها وتحديد مواقعها)
title: CLI للنصوص المفرّغة
x-i18n:
    generated_at: "2026-07-12T05:44:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde02e924339c64cf6acd5c4b6162785dcfccf4a1df2aac0d9d52d5306511579
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

أداة فحص للقراءة فقط للنصوص المكتوبة بواسطة أداة الوكيل `transcripts`.
تُنفَّذ عمليات الالتقاط والاستيراد والتلخيص من خلال تلك الأداة، وليس من خلال واجهة CLI هذه.

توجد العناصر تحت دليل الحالة:

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

دليل الحالة الافتراضي هو `~/.openclaw`؛ ويمكن تجاوزه باستخدام `OPENCLAW_STATE_DIR`.
يُشتق دليل التاريخ من وقت بدء الجلسة، أما دليل الجلسة فهو اسم مختصر آمن لنظام الملفات مشتق من معرّف الجلسة.

## الأوامر

```bash
openclaw transcripts list
openclaw transcripts show <session>
openclaw transcripts show YYYY-MM-DD/<session>
openclaw transcripts path <session>
openclaw transcripts path YYYY-MM-DD/<session>
openclaw transcripts path <session> --dir
openclaw transcripts path <session> --metadata
openclaw transcripts path <session> --transcript
openclaw transcripts list --json
openclaw transcripts show <session> --json
openclaw transcripts path <session> --json
```

| الأمر                         | الوصف                                                     |
| ----------------------------- | --------------------------------------------------------- |
| `list`                        | يسرد الجلسات المخزنة.                                     |
| `show <session>`              | يطبع ملف `summary.md` المخزن.                              |
| `path <session>`              | يطبع مسار `summary.md`.                                    |
| `path <session> --dir`        | يطبع دليل الجلسة.                                          |
| `path <session> --metadata`   | يطبع `metadata.json`.                                      |
| `path <session> --transcript` | يطبع `transcript.jsonl`.                                   |
| `--json`                      | يطبع مخرجات قابلة للقراءة آليًا (مع أي أمر فرعي).          |

يقبل `<session>` إما معرّف جلسة مجردًا أو محدِّدًا مؤهلًا بالتاريخ
(`YYYY-MM-DD/<session>`). استخدم الصيغة المؤهلة عندما يتكرر معرّف الجلسة نفسه
في أكثر من يوم، مثل `openclaw transcripts show
2026-05-22/standup`. تتضمن معرّفات الجلسات الافتراضية طابعًا زمنيًا ولاحقة
عشوائية؛ ولا تمنح الجلسة معرّفًا ثابتًا إلا عندما يكون ذلك المعرّف فريدًا خلال اليوم.

## المخرجات

يطبع `list` سطرًا واحدًا مفصولًا بعلامات جدولة لكل جلسة: المحدِّد، ووقت البدء، والعنوان،
ومسار الملخص.

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  الاجتماع الأسبوعي  /Users/user/.openclaw/transcripts/2026-05-22/standup/summary.md
```

المحدِّد هو القيمة الأكثر أمانًا لإعادة تمريرها إلى `show` أو `path`.

يعيد `list --json` كائنات تحتوي على `sessionId` و`selector` و`date` و`title`
و`startedAt` و`stoppedAt` و`source` و`path` و`summaryPath` و`hasSummary`.

يعيد `show --json` البيانات الوصفية المخزنة للجلسة والمحدِّد ودليل الجلسة
ومسار الملخص ونص الملخص بتنسيق Markdown.

يعيد `path --json` المسار المحدد وما إذا كان ذلك الملف موجودًا.

## جلسات عديدة في اليوم

تُجمَّع الجلسات حسب التاريخ، ثم حسب معرّف الجلسة. تصبح عشرة اجتماعات في يوم واحد
عشرة مجلدات متجاورة:

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

استخدم المعرّفات الافتراضية المُنشأة للأتمتة. ولا تستخدم معرّفًا ثابتًا مثل `standup` إلا
عندما لا يتكرر في التاريخ نفسه.

## الملخصات المفقودة

تكتب الجلسات المباشرة ملف `summary.md` عند توقف الجلسة؛ أما النصوص المستوردة
فتكتبه فورًا بعد الاستيراد. قد تظهر جلسة في `list` من دون
ملخص بينما لا يزال الالتقاط نشطًا، أو إذا فشل موفّر أثناء التوقف، أو إذا
كُتبت البيانات الوصفية قبل وصول أي أقوال.

استخدم `path <session> --transcript` لفحص النص الخام المخصص للإلحاق فقط،
أو شغّل إجراء `summarize` لأداة `transcripts` لإعادة إنشاء ملخص Markdown.

## الإعداد

الالتقاط اختياري (يمكن للمصادر المباشرة الانضمام إلى صوت الاجتماع وتسجيله). فعِّله
باستخدام:

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

- `enabled` (القيمة الافتراضية `false`): يشغّل الأداة.
- `maxUtterances` (القيمة الافتراضية `2000`، ومقيّدة بين 1 و10000): حجم مخزن
  الأقوال المؤقت لكل جلسة.

اضبط مصادر البدء التلقائي باستخدام `transcripts.autoStart`. يُفعَّل كل إدخال
بمجرد وجوده؛ احذف الإدخال لتعطيل ذلك المصدر. يُعد `discord-voice`
المصدر المضمّن القادر على البدء التلقائي، ويتطلب `guildId` و
`channelId`:

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      }
    ]
  }
}
```
