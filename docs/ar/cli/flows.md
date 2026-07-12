---
read_when:
    - تصادف `openclaw flows` في الوثائق القديمة أو ملاحظات الإصدار
    - تريد مرجعًا سريعًا لفحص TaskFlow
summary: 'إعادة التوجيه: توجد أوامر التدفق ضمن `openclaw tasks flow`'
title: التدفقات (إعادة التوجيه)
x-i18n:
    generated_at: "2026-07-12T05:42:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05d27154190d6087649612d81ce15f0cbc9459aa89ab22211582c18f4fc2943c
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

لا يوجد أمر `openclaw flows` من المستوى الأعلى. تتوفر معاينة عمليات TaskFlow الدائمة ضمن `openclaw tasks flow`.

## الأوامر الفرعية

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| الأمر الفرعي | الوصف                         | الوسائط / الخيارات                                                                                   |
| ------------ | ----------------------------- | ----------------------------------------------------------------------------------------------------- |
| `list`       | سرد عمليات TaskFlow المتتبعة. | يُنتج `--json` مخرجات قابلة للقراءة آليًا؛ ويطبّق `--status <name>` عامل تصفية (راجع قيم الحالة أدناه). |
| `show`       | عرض عملية TaskFlow واحدة.     | معرّف التدفق أو مفتاح المالك في `<lookup>`؛ ويُنتج `--json` مخرجات قابلة للقراءة آليًا.                |
| `cancel`     | إلغاء عملية TaskFlow قيد التشغيل. | معرّف التدفق أو مفتاح المالك في `<lookup>`.                                                        |

يقبل `<lookup>` إما معرّف تدفق (يُرجعه `list` أو `show`) أو مفتاح مالك التدفق (المعرّف الثابت الذي يستخدمه النظام الفرعي المالك لتتبّع التدفق).

### قيم عامل تصفية الحالة

يقبل الخيار `--status` مع `list` إحدى القيم التالية: `queued`، أو `running`، أو `waiting`، أو `blocked`، أو `succeeded`، أو `failed`، أو `cancelled`، أو `lost`.

## أمثلة

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

للاطلاع على مفاهيم TaskFlow وطريقة تأليفها، راجع [TaskFlow](/ar/automation/taskflow). وللاطلاع على الأمر الأب `tasks`، راجع [مرجع CLI للأمر tasks](/ar/cli/tasks).

## ذو صلة

- [مرجع CLI](/ar/cli)
- [الأتمتة](/ar/automation)
- [TaskFlow](/ar/automation/taskflow)
