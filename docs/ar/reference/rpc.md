---
read_when:
    - إضافة عمليات تكامل خارجية مع CLI أو تغييرها
    - تصحيح أخطاء محوّلات RPC ‏(`signal-cli`، `imsg`)
summary: مهايئات RPC لأدوات CLI الخارجية (signal-cli، imsg) وأنماط Gateway
title: مهايئات RPC
x-i18n:
    generated_at: "2026-07-12T06:35:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ddb3fb741c90fe7b01ba35376b71865584b1e507cf610705392452790fb76f5
    source_path: reference/rpc.md
    workflow: 16
---

يدمج OpenClaw واجهات CLI خارجية عبر JSON-RPC. ويُستخدم حاليًا نمطان.

## النمط أ: خدمة HTTP خفية (`signal-cli`)

- يعمل `signal-cli` كخدمة خفية تستخدم JSON-RPC عبر HTTP.
- تدفق الأحداث هو SSE ‏(`/api/v1/events`).
- فحص السلامة: `/api/v1/check`.
- يتولى OpenClaw إدارة دورة الحياة عندما يكون `channels.signal.autoStart=true`.

راجع [Signal](/ar/channels/signal) لمعرفة خطوات الإعداد ونقاط النهاية.

## النمط ب: عملية فرعية عبر stdio ‏(`imsg`)

- يُشغّل OpenClaw الأمر `imsg rpc` كعملية فرعية من أجل [iMessage](/ar/channels/imessage).
- تُفصل رسائل JSON-RPC بأسطر عبر stdin/stdout (كائن JSON واحد في كل سطر).
- لا يلزم منفذ TCP ولا خدمة خفية.

الأساليب الأساسية المستخدمة:

- `watch.subscribe` ← إشعارات (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (الفحص/التشخيص)

راجع [iMessage](/ar/channels/imessage) لمعرفة خطوات الإعداد والعنونة (يُفضّل `chat_id` على سلاسل العرض).

## إرشادات المهايئ

- يتولى Gateway إدارة العملية (يرتبط التشغيل/الإيقاف بدورة حياة المزوّد).
- حافظ على مرونة عملاء RPC: استخدم المهل الزمنية وأعد التشغيل عند الخروج.
- فضّل المعرّفات الثابتة (مثل `chat_id`) على سلاسل العرض.

## ذو صلة

- [بروتوكول Gateway](/ar/gateway/protocol)
