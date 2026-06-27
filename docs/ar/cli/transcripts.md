---
read_when:
    - تريد قراءة ملخصات النصوص الحوارية المخزنة من الطرفية
    - تحتاج إلى مسار ملخص Markdown للنصوص المفرغة
    - أنت تصحّح أخطاء تخطيط تخزين النصوص المنسوخة الأساسية
summary: مرجع CLI لـ `openclaw transcripts` (سرد النصوص التفريغية المخزنة وعرضها وتحديد موقعها)
title: CLI نصوص المحادثات
x-i18n:
    generated_at: "2026-06-27T17:25:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae6010cfb4e051182f1c48d0d728b30d054542e1e7983ff15a2432840193f9c0
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

افحص النصوص المكتوبة بواسطة أداة `transcripts` الأساسية في OpenClaw. هذا الـ CLI
للقراءة فقط؛ فالالتقاط والاستيراد والتلخيص مملوكة لأداة الوكيل ومصادر البدء
التلقائي المُكوّنة.

استخدم الـ CLI عندما تريد العثور على ملاحظات الأمس، أو فتح ملف Markdown في
محرر، أو تمرير نص إلى أداة أخرى، أو تصحيح موضع استقرار جلسة على القرص. لا يبدأ
الالتقاط ولا يوقفه.

توجد المخرجات ضمن دليل حالة OpenClaw:

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

دليل الحالة الافتراضي هو `~/.openclaw`؛ عيّن `OPENCLAW_STATE_DIR` لاستخدام
دليل مختلف. يأتي دليل التاريخ من وقت بدء الجلسة، ودليل الجلسة هو مقطع آمن
لنظام الملفات مشتق من معرف الجلسة.

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

- `list`: يسرد الجلسات المخزنة، والمحدد المؤهل بالتاريخ، ووقت البدء، والعنوان، ومسار `summary.md`.
- `show <session>`: يطبع `summary.md` المخزن.
- `path <session>`: يطبع مسار `summary.md`.
- `path <session> --dir`: يطبع دليل الجلسة.
- `path <session> --metadata`: يطبع `metadata.json`.
- `path <session> --transcript`: يطبع `transcript.jsonl`.
- `--json`: يطبع مخرجات قابلة للقراءة آليًا.

عندما يتكرر معرف جلسة بشري عبر أيام متعددة، استخدم المحدد المؤهل بالتاريخ
من `list`، مثل `openclaw transcripts show 2026-05-22/standup`.
تتضمن معرفات الجلسات الافتراضية طابعًا زمنيًا ولاحقة عشوائية؛ لا تكوّن
معرفات جلسات ثابتة إلا عندما تكون فريدة ضمن اليوم.

## المخرجات

يطبع `list` جلسة واحدة في كل سطر:

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Weekly standup  /Users/alex/.openclaw/transcripts/2026-05-22/standup/summary.md
```

المخرجات مفصولة بعلامات تبويب. الأعمدة هي المحدد، ووقت البدء، والعنوان،
ومسار الملخص. المحدد هو القيمة الأكثر أمانًا لتمريرها مرة أخرى إلى `show` أو `path`.

يطبع `list --json` كائنات تتضمن:

- `sessionId`
- `selector`
- `date`
- `title`
- `startedAt`
- `stoppedAt`
- `source`
- `path`
- `summaryPath`
- `hasSummary`

يعيد `show --json` بيانات تعريف الجلسة المخزنة، والمحدد، ودليل الجلسة،
ومسار الملخص، ونص ملخص Markdown. يعيد `path --json` المسار المحدد
وما إذا كان ذلك الملف موجودًا.

## اجتماعات كثيرة في اليوم

تجمع Transcripts الجلسات حسب التاريخ، ثم حسب معرف الجلسة. تصبح عشرة اجتماعات في
يوم واحد عشرة مجلدات شقيقة:

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

استخدم المعرفات الافتراضية المولدة لمعظم الأتمتة. استخدم معرفًا ثابتًا مثل `standup`
فقط عندما لن يُستخدم المعرف نفسه مرتين في التاريخ نفسه.

## الملخصات المفقودة

تكتب الجلسات الحية `summary.md` عند توقف الجلسة. تكتب النصوص المستوردة
`summary.md` مباشرة بعد الاستيراد. قد تظل الجلسة تظهر في `list` بدون
ملخص عندما يكون الالتقاط نشطًا، أو يفشل مزود أثناء الإيقاف، أو تُكتب بيانات
التعريف قبل وصول أي أقوال.

استخدم `path <session> --transcript` لفحص النص الملحق فقط، واستخدم إجراء أداة
`transcripts` المسمى `summarize` لإعادة إنشاء ملخص Markdown.

## التكوين

التقاط النصوص اختياري لأن المصادر الحية يمكنها الانضمام إلى صوت الاجتماع
وتسجيله. فعّل الأداة باستخدام `transcripts.enabled` في المستوى الأعلى:

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

كوّن مصادر البدء التلقائي باستخدام `transcripts.autoStart` في `openclaw.json`.
يُفعّل كل إدخال بمجرد وجوده؛ احذف إدخالًا لتعطيل ذلك المصدر.

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      },
      {
        "providerId": "slack-huddle",
        "accountId": "workspace",
        "channelId": "C123"
      }
    ]
  }
}
```
