---
read_when:
    - تريد تشغيل أدوار الوكيل من النصوص البرمجية أو من سطر الأوامر
    - تحتاج إلى تسليم ردود الوكيل إلى قناة دردشة برمجيًا
summary: تشغيل أدوار الوكيل من CLI مع إمكانية تسليم الردود إلى القنوات اختياريًا
title: إرسال الوكيل
x-i18n:
    generated_at: "2026-04-24T08:06:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f29ab906ed8179b265138ee27312c8f4b318d09b73ad61843fca6809c32bd31
    source_path: tools/agent-send.md
    workflow: 15
---

يشغّل `openclaw agent` دور وكيل واحدًا من سطر الأوامر من دون الحاجة
إلى رسالة دردشة واردة. استخدمه لسير العمل المبرمج نصيًا، والاختبار، و
التسليم البرمجي.

## بداية سريعة

<Steps>
  <Step title="شغّل دور وكيل بسيط">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    يرسل هذا الرسالة عبر Gateway ويطبع الرد.

  </Step>

  <Step title="استهدف وكيلاً أو جلسة محددة">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="سلّم الرد إلى قناة">
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

| العلامة | الوصف |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>` | الرسالة المطلوب إرسالها (مطلوبة) |
| `--to \<dest\>` | اشتقاق مفتاح الجلسة من هدف (هاتف، معرّف دردشة) |
| `--agent \<id\>` | استهداف وكيل مهيأ (يستخدم جلسة `main` الخاصة به) |
| `--session-id \<id\>` | إعادة استخدام جلسة موجودة عبر معرّفها |
| `--local` | فرض وقت تشغيل مضمّن محلي (تخطي Gateway) |
| `--deliver` | إرسال الرد إلى قناة دردشة |
| `--channel \<name\>` | قناة التسليم (whatsapp، telegram، discord، slack، إلخ) |
| `--reply-to \<target\>` | تجاوز هدف التسليم |
| `--reply-channel \<name\>` | تجاوز قناة التسليم |
| `--reply-account \<id\>` | تجاوز معرّف حساب التسليم |
| `--thinking \<level\>` | ضبط مستوى التفكير لملف تعريف النموذج المحدد |
| `--verbose \<on\|full\|off\>` | ضبط مستوى verbose |
| `--timeout \<seconds\>` | تجاوز مهلة الوكيل |
| `--json` | إخراج JSON منظم |

## السلوك

- افتراضيًا، تمر CLI **عبر Gateway**. أضف `--local` لفرض
  وقت التشغيل المضمّن على الجهاز الحالي.
- إذا تعذر الوصول إلى Gateway، فإن CLI **ترجع احتياطيًا** إلى التشغيل المضمّن المحلي.
- اختيار الجلسة: يشتق `--to` مفتاح الجلسة (تحافظ أهداف المجموعة/القناة
  على العزل؛ وتنهار الدردشات المباشرة إلى `main`).
- تستمر علامتا thinking وverbose داخل مخزن الجلسة.
- الإخراج: نص عادي افتراضيًا، أو `--json` لحمولة منظمة + بيانات تعريف.

## أمثلة

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## ذو صلة

- [مرجع Agent CLI](/ar/cli/agent)
- [الوكلاء الفرعيون](/ar/tools/subagents) — إنشاء وكلاء فرعيين في الخلفية
- [الجلسات](/ar/concepts/session) — كيف تعمل مفاتيح الجلسات
