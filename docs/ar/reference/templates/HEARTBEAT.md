---
read_when:
    - إعداد مساحة عمل يدويًا
summary: قالب مساحة العمل لـ HEARTBEAT.md
title: قالب HEARTBEAT.md
x-i18n:
    generated_at: "2026-06-27T18:34:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a1ea787d67110ca53d752706b62f5ce5c4df8637897dee97ce6502f6a05eb6
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# قالب HEARTBEAT.md

يوجد `HEARTBEAT.md` في مساحة عمل الوكيل. أبقِ الملف فارغًا، أو يحتوي فقط على تعليقات وعناوين Markdown، عندما تريد أن يتجاوز OpenClaw استدعاءات نموذج Heartbeat.

قالب وقت التشغيل الافتراضي هو:

```markdown
# Keep this file empty (or with only comments) to skip heartbeat API calls.

# Add tasks below when you want the agent to check something periodically.
```

أضف مهام قصيرة أسفل التعليقات فقط عندما تريد من الوكيل التحقق من شيء ما دوريًا. أبقِ تعليمات Heartbeat صغيرة لأنها تُقرأ أثناء الاستيقاظات المتكررة.

## ذات صلة

- [تكوين Heartbeat](/ar/gateway/config-agents)
