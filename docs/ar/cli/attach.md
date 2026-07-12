---
read_when:
    - تريد أن يستخدم Claude Code أدوات MCP الخاصة بـ OpenClaw Gateway
    - تحتاج إلى منح MCP مؤقت مرتبط بالجلسة لأداة اختبار خارجية
summary: مرجع CLI للأمر `openclaw attach` (تشغيل Claude Code بمنحة MCP محددة النطاق من Gateway)
title: إرفاق CLI
x-i18n:
    generated_at: "2026-07-12T05:43:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0d8ac60724adef1439af09179806af537b8f2925f06b3715850e4dd3b83b080f
    source_path: cli/attach.md
    workflow: 16
---

يطلق الأمر `openclaw attach` ‏Claude Code باستخدام إعداد MCP مؤقت وصارم مرتبط بجلسة Gateway واحدة.

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

الخيارات:

- يربط `--session <key>` المنحة بجلسة Gateway. ويستخدم الجلسة الرئيسية افتراضيًا.
- يطلب `--ttl <ms>` مدة صلاحية موجبة للمنحة بالمللي ثانية. وتطبّق Gateway الحد الأقصى الخاص بها.
- يحدد `--bin <path>` الملف التنفيذي لـ Claude Code. القيمة الافتراضية: `claude`.
- يكتب `--print-config` ملف `.mcp.json` المؤقت، ويطبع أمر التشغيل ومتغيرات البيئة، ويُبقي المنحة سارية حتى انتهاء مدة صلاحيتها (ولا يشغّل Claude Code أو يلغي المنحة).

يُمرَّر رمز الحامل عبر متغيرات البيئة، وليس عبر argv. يشغّل OpenClaw ‏Claude Code باستخدام `--strict-mcp-config --mcp-config <path>` كي لا تنضم خوادم MCP المحيطة الخاصة بـ Claude إلى الجلسة المرفقة. تلغي عمليات التشغيل العادية (من دون `--print-config`) المنحة عند إنهاء عملية Claude Code.

راجع أيضًا: [CLI لـ Gateway](/ar/cli/gateway)، و[CLI لـ MCP](/ar/cli/mcp)، و[CLI لـ ACP](/ar/cli/acp).
