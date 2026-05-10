---
read_when:
    - تريد تشغيل عمليات الوكيل من السكربتات أو من سطر الأوامر
    - تحتاج إلى إيصال ردود الوكيل إلى قناة دردشة برمجيًا
summary: تشغيل جولات الوكيل عبر CLI وإرسال الردود اختياريًا إلى القنوات
title: إرسال الوكيل
x-i18n:
    generated_at: "2026-05-10T20:02:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2e1b05414312321e7136867bb8b998754d4a46289cc02764eb61d83f7239af1
    source_path: tools/agent-send.md
    workflow: 16
---

يشغّل `openclaw agent` دورة وكيل واحدة من سطر الأوامر دون الحاجة إلى
رسالة دردشة واردة. استخدمه لسير العمل النصية، والاختبار، والتسليم
البرمجي.

## البدء السريع

<Steps>
  <Step title="تشغيل دورة وكيل بسيطة">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    يرسل هذا الرسالة عبر Gateway ويطبع الرد.

  </Step>

  <Step title="استهداف وكيل أو جلسة محددة">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
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
| `--message \<text\>`          | الرسالة المراد إرسالها (مطلوبة)                             |
| `--to \<dest\>`               | اشتقاق مفتاح الجلسة من هدف (هاتف، معرّف دردشة)              |
| `--agent \<id\>`              | استهداف وكيل مُعدّ (يستخدم جلسة `main` الخاصة به)           |
| `--session-id \<id\>`         | إعادة استخدام جلسة موجودة حسب المعرّف                       |
| `--local`                     | فرض وقت التشغيل المضمّن المحلي (تجاوز Gateway)              |
| `--deliver`                   | إرسال الرد إلى قناة دردشة                                   |
| `--channel \<name\>`          | قناة التسليم (whatsapp، telegram، discord، slack، إلخ)      |
| `--reply-to \<target\>`       | تجاوز هدف التسليم                                           |
| `--reply-channel \<name\>`    | تجاوز قناة التسليم                                          |
| `--reply-account \<id\>`      | تجاوز معرّف حساب التسليم                                    |
| `--thinking \<level\>`        | ضبط مستوى التفكير لملف تعريف النموذج المحدد                 |
| `--verbose \<on\|full\|off\>` | ضبط مستوى الإسهاب                                           |
| `--timeout \<seconds\>`       | تجاوز مهلة الوكيل                                           |
| `--json`                      | إخراج JSON منظّم                                            |

## السلوك

- افتراضيًا، تمر CLI **عبر Gateway**. أضف `--local` لفرض وقت التشغيل
  المضمّن على الجهاز الحالي.
- إذا تعذّر الوصول إلى Gateway، **تعود** CLI إلى التشغيل المضمّن المحلي.
- اختيار الجلسة: يشتق `--to` مفتاح الجلسة (تحافظ أهداف المجموعة/القناة
  على العزل؛ وتُدمج الدردشات المباشرة في `main`).
- تستمر علامات التفكير والإسهاب في مخزن الجلسات.
- الإخراج: نص عادي افتراضيًا، أو `--json` لحمولة منظّمة + بيانات وصفية.
- مع `--json --deliver`، يتضمن JSON حالة التسليم للرسائل المرسلة،
  والمكبوتة، والجزئية، والفاشلة. راجع
  [حالة تسليم JSON](/ar/cli/agent#json-delivery-status).

## أمثلة

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

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
    كيف تعمل مفاتيح الجلسات وكيف يحلّ `--to` و`--agent` و`--session-id` إليها.
  </Card>
  <Card title="أوامر الشرطة المائلة" href="/ar/tools/slash-commands" icon="slash">
    كتالوج الأوامر الأصلي المستخدم داخل جلسات الوكيل.
  </Card>
</CardGroup>
