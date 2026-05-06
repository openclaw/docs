---
read_when:
    - تريد تشغيل عمليات الوكيل من النصوص البرمجية أو من سطر الأوامر
    - تحتاج إلى إيصال ردود الوكيل إلى قناة دردشة برمجيًا
summary: شغّل جولات الوكيل من CLI، وسلّم الردود اختياريًا إلى القنوات
title: إرسال الوكيل
x-i18n:
    generated_at: "2026-05-06T08:14:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1339ebd74e2349669942ff93f200b53a69ad05f2186d6ff76437c779f312a291
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` يشغّل دورة وكيل واحدة من سطر الأوامر دون الحاجة إلى
رسالة دردشة واردة. استخدمه لسير العمل المعتمدة على السكريبتات، والاختبار، و
التسليم البرمجي.

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

## الخيارات

| الخيار                        | الوصف                                                       |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | الرسالة المراد إرسالها (مطلوبة)                             |
| `--to \<dest\>`               | اشتقاق مفتاح الجلسة من هدف (هاتف، معرّف دردشة)              |
| `--agent \<id\>`              | استهداف وكيل مكوّن (يستخدم جلسة `main` الخاصة به)           |
| `--session-id \<id\>`         | إعادة استخدام جلسة موجودة حسب المعرّف                       |
| `--local`                     | فرض بيئة التشغيل المحلية المضمّنة (تجاوز Gateway)           |
| `--deliver`                   | إرسال الرد إلى قناة دردشة                                   |
| `--channel \<name\>`          | قناة التسليم (WhatsApp، Telegram، Discord، Slack، إلخ.)     |
| `--reply-to \<target\>`       | تجاوز هدف التسليم                                           |
| `--reply-channel \<name\>`    | تجاوز قناة التسليم                                          |
| `--reply-account \<id\>`      | تجاوز معرّف حساب التسليم                                    |
| `--thinking \<level\>`        | ضبط مستوى التفكير لملف تعريف النموذج المحدد                 |
| `--verbose \<on\|full\|off\>` | ضبط مستوى الإسهاب                                           |
| `--timeout \<seconds\>`       | تجاوز مهلة الوكيل                                           |
| `--json`                      | إخراج JSON منظّم                                            |

## السلوك

- افتراضياً، تمر CLI **عبر Gateway**. أضف `--local` لفرض
  بيئة التشغيل المضمّنة على الجهاز الحالي.
- إذا تعذّر الوصول إلى Gateway، تعود CLI **احتياطياً** إلى التشغيل المحلي المضمّن.
- اختيار الجلسة: يشتق `--to` مفتاح الجلسة (تحافظ أهداف المجموعات/القنوات
  على العزل؛ وتُختزل الدردشات المباشرة إلى `main`).
- تُحفظ خيارات التفكير والإسهاب في مخزن الجلسات.
- الإخراج: نص عادي افتراضياً، أو `--json` لحمولة منظمة + بيانات وصفية.

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
    المرجع الكامل لأعلام وخيارات `openclaw agent`.
  </Card>
  <Card title="الوكلاء الفرعيون" href="/ar/tools/subagents" icon="users">
    إنشاء وكلاء فرعيين في الخلفية.
  </Card>
  <Card title="الجلسات" href="/ar/concepts/session" icon="comments">
    كيفية عمل مفاتيح الجلسات وكيف يحدّدها `--to` و`--agent` و`--session-id`.
  </Card>
  <Card title="أوامر الشرطة المائلة" href="/ar/tools/slash-commands" icon="slash">
    فهرس الأوامر الأصلية المستخدمة داخل جلسات الوكيل.
  </Card>
</CardGroup>
