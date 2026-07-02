---
read_when:
    - تريد أن يستخدم Claude Code أدوات MCP الخاصة بـ OpenClaw Gateway
    - تحتاج إلى تصريح MCP مؤقت مرتبط بالجلسة لإطار تشغيل خارجي
summary: مرجع CLI لـ `openclaw attach` (تشغيل Claude Code مع إذن Gateway MCP محدد النطاق)
title: إرفاق CLI
x-i18n:
    generated_at: "2026-07-02T00:57:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1445c9bbf28e5365d070f69bf8f53e249d70ac6e8690ed68831404d041e41e86
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` يشغّل Claude Code باستخدام إعداد MCP مؤقت صارم مرتبط
بجلسة Gateway واحدة.

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

الخيارات:

- يربط `--session <key>` المنحة بجلسة Gateway. الافتراضي هو الجلسة الرئيسية.
- يطلب `--ttl <ms>` مدة TTL موجبة للمنحة بالمللي ثانية. يطبّق Gateway حدّه الأقصى الخاص.
- يحدد `--bin <path>` ملف Claude Code التنفيذي. الافتراضي هو `claude`.
- يكتب `--print-config` ملف `.mcp.json` المؤقت، ويطبع أمر التشغيل والبيئة، ويُبقي المنحة نشطة حتى انتهاء TTL.

يُمرَّر رمز الحامل عبر متغيرات البيئة، وليس عبر argv. يشغّل OpenClaw
Claude Code باستخدام `--strict-mcp-config --mcp-config <path>` حتى لا تنضم
خوادم Claude MCP المحيطة إلى الجلسة المرفقة. تلغي عمليات التشغيل العادية
المنحة عند خروج عملية Claude Code.

انظر أيضًا: [CLI Gateway](/ar/cli/gateway)، و[CLI MCP](/ar/cli/mcp)، و[CLI ACP](/ar/cli/acp).
