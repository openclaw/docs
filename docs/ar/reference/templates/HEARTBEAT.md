---
read_when:
    - تهيئة مساحة عمل يدويًا
summary: قالب مساحة العمل لملف HEARTBEAT.md
title: قالب HEARTBEAT.md
x-i18n:
    generated_at: "2026-07-12T06:36:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1605f546995e0bdcb11f9bf905173b14aca25cfad664fe2c7644d18c2b4142e2
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# قالب HEARTBEAT.md

يوجد الملف `HEARTBEAT.md` في مساحة عمل الوكيل، ويحتوي على قائمة التحقق الدورية الخاصة بـ Heartbeat. اتركه فارغًا، أو مقتصرًا على المسافات البيضاء أو تعليقات Markdown أو عناوين ATX أو بدايات قوائم فارغة (`- `، `* [ ]`) أو علامات الأسوار، لكي يتخطى OpenClaw استدعاء نموذج Heartbeat بالكامل (`reason=empty-heartbeat-file`).

المحتوى الافتراضي المضمّن:

```markdown
<!-- قالب Heartbeat؛ يمنع المحتوى المقتصر على التعليقات استدعاءات API المجدولة لـ Heartbeat. -->

# اترك هذا الملف فارغًا (أو مقتصرًا على التعليقات) لتخطي استدعاءات API لـ Heartbeat.

# أضف المهام أدناه عندما تريد من الوكيل التحقق من أمر ما دوريًا.
```

لا تضف مهام قصيرة أسفل أسطر التعليقات إلا عندما تريد إجراء عمليات تحقق دورية. أبقِ الملف صغيرًا: تقرأ عمليات Heartbeat هذا الملف في كل نبضة (افتراضيًا كل 30 دقيقة)، لذلك تستهلك التعليمات المتضخمة الرموز المميزة عند كل تنشيط.

لإجراء عمليات التحقق المستحقة فقط بدلًا من قائمة تحقق عادية، استخدم كتلة `tasks:` منظّمة تتضمن الحقلين `interval` و`prompt` لكل مهمة؛ راجع [HEARTBEAT.md](/ar/gateway/heartbeat#heartbeatmd-optional) لمعرفة التنسيق والسلوك.

## ذو صلة

- [Heartbeat](/ar/gateway/heartbeat)
- [إعدادات Heartbeat](/ar/gateway/config-agents)
