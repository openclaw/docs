---
read_when:
    - تواجه `openclaw flows` في وثائق أقدم أو ملاحظات الإصدار
    - تريد مرجعًا سريعًا لفحص TaskFlow
summary: 'إعادة توجيه: توجد أوامر التدفق ضمن `openclaw tasks flow`'
title: التدفقات (إعادة توجيه)
x-i18n:
    generated_at: "2026-05-10T19:30:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: b41e8a911cfbba32f3a1af059df34f73443ea7649bce46a5926cdf26c8399c12
    source_path: cli/flows.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw tasks flow`

لا يوجد أمر `openclaw flows` على المستوى الأعلى. يوجد فحص TaskFlow الدائم ضمن `openclaw tasks flow`.

## الأوامر الفرعية

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| الأمر الفرعي | الوصف                         | الوسيطات / الخيارات                                                                                     |
| ------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| `list`       | يسرد TaskFlows المتتبعة.       | مخرجات `--json` قابلة للقراءة آليًا؛ مرشح `--status <name>` (انظر قيم الحالة أدناه).                    |
| `show`       | يعرض TaskFlow واحدًا.          | `<lookup>` معرّف التدفق أو مفتاح المالك؛ مخرجات `--json` قابلة للقراءة آليًا.                           |
| `cancel`     | يلغي TaskFlow قيد التشغيل.     | `<lookup>` معرّف التدفق أو مفتاح المالك.                                                                |

يقبل `<lookup>` إما معرّف تدفق (تعيده `list` / `show`) أو مفتاح مالك التدفق (المعرّف الثابت الذي يستخدمه النظام الفرعي المالك لتتبع التدفق).

### قيم مرشح الحالة

يقبل `--status` في `list` إحدى القيم التالية:

`queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`

## أمثلة

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

للاطلاع على مفاهيم TaskFlow الكاملة والتأليف، راجع [TaskFlow](/ar/automation/taskflow). ولأمر `tasks` الأصل، راجع [مرجع CLI للمهام](/ar/cli/tasks).

## ذو صلة

- [مرجع CLI](/ar/cli)
- [الأتمتة](/ar/automation)
- [TaskFlow](/ar/automation/taskflow)
