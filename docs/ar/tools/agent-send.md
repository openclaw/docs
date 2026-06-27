---
read_when:
    - تريد تشغيل عمليات الوكيل من السكربتات أو سطر الأوامر
    - تحتاج إلى تسليم ردود الوكيل إلى قناة دردشة برمجيًا
summary: شغّل دورات الوكيل من CLI وسلّم الردود اختياريًا إلى القنوات
title: إرسال الوكيل
x-i18n:
    generated_at: "2026-06-27T18:38:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 25026258a5a47c87fbf99689de5ea16d827b11af07bc5ce4f6c3e2bda6466b46
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` يشغّل دورة وكيل واحدة من سطر الأوامر من دون الحاجة إلى
رسالة دردشة واردة. استخدمه لسير العمل البرمجي، والاختبار، والتسليم
البرمجي.

## البدء السريع

<Steps>
  <Step title="تشغيل دورة وكيل بسيطة">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    يرسل هذا الرسالة عبر Gateway ويطبع الرد.

  </Step>

  <Step title="إرسال موجّه متعدد الأسطر من ملف">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    يقرأ هذا ملف UTF-8 صالحًا بوصفه متن رسالة الوكيل.

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

| العلامة                       | الوصف                                                       |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | رسالة مضمنة لإرسالها                                       |
| `--message-file \<path\>`     | قراءة الرسالة من ملف UTF-8 صالح                            |
| `--to \<dest\>`               | اشتقاق مفتاح الجلسة من هدف (هاتف، معرّف دردشة)             |
| `--session-key \<key\>`       | استخدام مفتاح جلسة صريح                                    |
| `--agent \<id\>`              | استهداف وكيل مضبوط (يستخدم جلسة `main` الخاصة به)          |
| `--session-id \<id\>`         | إعادة استخدام جلسة موجودة حسب المعرّف                      |
| `--local`                     | فرض وقت التشغيل المضمّن المحلي (تخطي Gateway)              |
| `--deliver`                   | إرسال الرد إلى قناة دردشة                                  |
| `--channel \<name\>`          | قناة التسليم (whatsapp، telegram، discord، slack، إلخ)     |
| `--reply-to \<target\>`       | تجاوز هدف التسليم                                          |
| `--reply-channel \<name\>`    | تجاوز قناة التسليم                                         |
| `--reply-account \<id\>`      | تجاوز معرّف حساب التسليم                                   |
| `--thinking \<level\>`        | تعيين مستوى التفكير لملف تعريف النموذج المحدد              |
| `--verbose \<on\|full\|off\>` | تعيين مستوى الإسهاب                                        |
| `--timeout \<seconds\>`       | تجاوز مهلة الوكيل                                          |
| `--json`                      | إخراج JSON منظّم                                           |

## السلوك

- افتراضيًا، يمر CLI **عبر Gateway**. أضف `--local` لفرض وقت التشغيل
  المضمّن على الجهاز الحالي.
- مرّر واحدًا فقط من `--message` أو `--message-file`. تحافظ رسائل الملفات على
  المحتوى متعدد الأسطر بعد إزالة BOM اختياري لـ UTF-8.
- إذا تعذر الوصول إلى Gateway، فإن CLI **يرجع احتياطيًا** إلى التشغيل المضمّن المحلي.
- اختيار الجلسة: يشتق `--to` مفتاح الجلسة (تحافظ أهداف المجموعة/القناة على
  العزل؛ وتُطوى الدردشات المباشرة إلى `main`).
- يحدد `--session-key` مفتاحًا صريحًا. يجب أن تستخدم المفاتيح ذات بادئة الوكيل
  `agent:<agent-id>:<session-key>`، ويجب أن يطابق `--agent` معرّف ذلك الوكيل عند
  توفيرهما معًا. تُنسب المفاتيح العارية غير الحارسة إلى `--agent` عند
  توفيره؛ على سبيل المثال، يوجّه `--agent ops --session-key incident-42` إلى
  `agent:ops:incident-42`. من دون `--agent`، تُنسب المفاتيح العارية غير الحارسة
  إلى الوكيل الافتراضي المضبوط. تبقى القيمتان الحرفيتان `global` و`unknown`
  غير منسوبتين فقط عند عدم توفير `--agent`؛ في هذه الحالة، يستخدم الرجوع
  المضمّن وملكية المخزن الوكيل الافتراضي المضبوط.
- تستمر علامتا التفكير والإسهاب في مخزن الجلسة.
- الإخراج: نص عادي افتراضيًا، أو `--json` لحمولة منظّمة + بيانات وصفية.
- مع `--json --deliver`، يتضمن JSON حالة التسليم للإرسالات المرسلة،
  والمكبوتة، والجزئية، والفاشلة. راجع
  [حالة تسليم JSON](/ar/cli/agent#json-delivery-status).

## أمثلة

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

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

## ذات صلة

<CardGroup cols={2}>
  <Card title="مرجع CLI للوكيل" href="/ar/cli/agent" icon="terminal">
    مرجع كامل لعلامات وخيارات `openclaw agent`.
  </Card>
  <Card title="الوكلاء الفرعيون" href="/ar/tools/subagents" icon="users">
    إنشاء وكلاء فرعيين في الخلفية.
  </Card>
  <Card title="الجلسات" href="/ar/concepts/session" icon="comments">
    كيف تعمل مفاتيح الجلسات وكيف يحل `--to` و`--agent` و`--session-id` إليها.
  </Card>
  <Card title="أوامر الشرطة المائلة" href="/ar/tools/slash-commands" icon="slash">
    فهرس الأوامر الأصلية المستخدم داخل جلسات الوكيل.
  </Card>
</CardGroup>
