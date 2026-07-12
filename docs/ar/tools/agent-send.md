---
read_when:
    - تريد تشغيل مهام الوكيل من السكربتات أو سطر الأوامر
    - تحتاج إلى إرسال ردود الوكيل إلى قناة دردشة برمجيًا
summary: شغّل دورات الوكيل من CLI، وسلّم الردود اختياريًا إلى القنوات
title: إرسال الوكيل
x-i18n:
    generated_at: "2026-07-12T06:39:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23ad57735bd43a2bba5add571e9572da0fbe7b516a70515c674e1ababaab081a
    source_path: tools/agent-send.md
    workflow: 16
---

يشغّل الأمر `openclaw agent` دورة واحدة للوكيل من سطر الأوامر من دون رسالة محادثة واردة. استخدمه لسير العمل المعتمد على البرامج النصية والاختبار والتسليم البرمجي. المرجع الكامل للعلامات والسلوك:
[مرجع CLI للوكيل](/ar/cli/agent).

## البدء السريع

<Steps>
  <Step title="تشغيل دورة وكيل بسيطة">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    يرسل الرسالة عبر Gateway ويطبع الرد.

  </Step>

  <Step title="إرسال مطالبة متعددة الأسطر من ملف">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    يقرأ ملف UTF-8 صالحًا باعتباره نص رسالة الوكيل.

  </Step>

  <Step title="استهداف وكيل أو جلسة محددة">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"

    # Target an exact session key
    openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
    ```

  </Step>

  <Step title="تسليم الرد إلى قناة">
    ```bash
    # Deliver to WhatsApp (default channel)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Deliver to Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## العلامات

| العلامة                      | الوصف                                                                  |
| --------------------------- | -------------------------------------------------------------------- |
| `--message <text>`          | رسالة مضمّنة لإرسالها                                                  |
| `--message-file <path>`     | قراءة الرسالة من ملف UTF-8 صالح                                        |
| `--to <dest>`               | اشتقاق مفتاح الجلسة من وجهة مستهدفة (هاتف، معرّف محادثة)                |
| `--session-key <key>`       | استخدام مفتاح جلسة صريح                                                |
| `--agent <id>`              | استهداف وكيل مُعَدّ (يستخدم جلسته `main`)                               |
| `--session-id <id>`         | إعادة استخدام جلسة موجودة حسب المعرّف                                   |
| `--model <id>`              | تجاوز النموذج لهذا التشغيل (`provider/model` أو معرّف النموذج)          |
| `--local`                   | فرض بيئة التشغيل المحلية المضمّنة (تجاوز Gateway)                       |
| `--deliver`                 | إرسال الرد إلى قناة محادثة                                             |
| `--channel <name>`          | قناة التسليم؛ ومع `--agent` + `--to`، ينطبق أيضًا على نطاق الرسائل الخاصة |
| `--reply-to <target>`       | تجاوز وجهة التسليم                                                     |
| `--reply-channel <name>`    | تجاوز قناة التسليم                                                     |
| `--reply-account <id>`      | تجاوز معرّف حساب التسليم                                                |
| `--thinking <level>`        | تعيين مستوى التفكير لملف تعريف النموذج المحدد                           |
| `--verbose <on\|full\|off>` | حفظ مستوى الإسهاب للجلسة (`full` يسجّل أيضًا مخرجات الأدوات)             |
| `--timeout <seconds>`       | تجاوز مهلة الوكيل (الافتراضي 600، أو قيمة الإعداد)                       |
| `--json`                    | إخراج JSON منظّم                                                       |

## السلوك

- يمر CLI افتراضيًا **عبر Gateway**. أضف `--local` لفرض بيئة التشغيل المضمّنة
  على الجهاز الحالي.
- مرّر واحدًا فقط من `--message` أو `--message-file`. تحافظ رسائل الملفات على
  المحتوى متعدد الأسطر بعد إزالة علامة BOM اختيارية بترميز UTF-8.
- إذا فشل طلب Gateway، **يتراجع** CLI إلى التشغيل المحلي المضمّن؛ وعند انتهاء
  مهلة Gateway، يحدث التراجع باستخدام جلسة جديدة بدلًا من التسابق مع نص المحادثة
  الأصلي.
- اختيار الجلسة: يشتق `--to` مفتاح الجلسة (تحافظ أهداف المجموعات/القنوات على
  العزل؛ وتُدمج المحادثات المباشرة في `main`). عند استخدام `--agent`
  و`--channel` و`--to` معًا، يتبع التوجيه المستلِم الأساسي للقناة و`session.dmScope`.
  تستخدم الهويات المستقرة المخصصة للإرسال فقط جلسة يملكها المزوّد ومعزولة عن
  الجلسة الرئيسية للوكيل.
- يختار `--session-key` مفتاحًا صريحًا. يجب أن تستخدم المفاتيح المسبوقة بالوكيل
  الصيغة `agent:<agent-id>:<session-key>`، ويجب أن يطابق `--agent` معرّف ذلك
  الوكيل عند توفيرهما معًا. تُقيَّد المفاتيح المجرّدة غير الحارسة بنطاق `--agent`
  عند توفيره؛ فعلى سبيل المثال، يوجّه
  `--agent ops --session-key incident-42` إلى
  `agent:ops:incident-42`. من دون `--agent`، تُقيَّد المفاتيح المجرّدة غير
  الحارسة بنطاق الوكيل الافتراضي المُعَدّ. تبقى القيمتان الحرفيتان `global`
  و`unknown` من دون نطاق فقط عند عدم توفير `--agent`؛ ويحل مسار التراجع المضمّن
  جلسات الحراسة هذه إلى الوكيل الافتراضي المُعَدّ.
- يؤثر `--reply-channel` و`--reply-account` في التسليم فقط.
- تُحفظ علامتا التفكير والإسهاب في مخزن الجلسة.
- الإخراج: نص عادي افتراضيًا، أو `--json` للحصول على حمولة منظّمة وبيانات وصفية.
- عند استخدام `--json --deliver`، يتضمن JSON حالة التسليم لعمليات الإرسال
  الناجحة والمكبوتة والجزئية والفاشلة. راجع
  [حالة تسليم JSON](/ar/cli/agent#json-delivery-status).

## أمثلة

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with a model override
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Multiline prompt from a file
openclaw agent --agent ops --message-file ./task.md

# Exact session key
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"

# Legacy key scoped to an agent
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## ذو صلة

<CardGroup cols={2}>
  <Card title="مرجع CLI للوكيل" href="/ar/cli/agent" icon="terminal">
    المرجع الكامل لعلامات الأمر `openclaw agent` وخياراته.
  </Card>
  <Card title="الوكلاء الفرعيون" href="/ar/tools/subagents" icon="users">
    إنشاء وكلاء فرعيين في الخلفية.
  </Card>
  <Card title="الجلسات" href="/ar/concepts/session" icon="comments">
    كيفية عمل مفاتيح الجلسات وكيفية حلّها بواسطة `--to` و`--agent` و`--session-id`.
  </Card>
  <Card title="أوامر الشرطة المائلة" href="/ar/tools/slash-commands" icon="slash">
    كتالوج الأوامر الأصلية المستخدم داخل جلسات الوكيل.
  </Card>
</CardGroup>
