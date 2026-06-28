---
read_when:
    - إضافة تكاملات CLI الخارجية أو تغييرها
    - تصحيح أخطاء محولات RPC (signal-cli، imsg)
summary: مهايئات RPC لواجهات CLI الخارجية (signal-cli، imsg) وأنماط Gateway
title: مهايئات RPC
x-i18n:
    generated_at: "2026-05-10T20:00:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63556f140bee55821fa0a09ff9808e163728049f8db4c58f7bb4ceca6e1cac1a
    source_path: reference/rpc.md
    workflow: 16
    postprocess_version: locale-links-v1
---

يدمج OpenClaw أدوات CLI خارجية عبر JSON-RPC. يُستخدم نمطان حاليًا.

## النمط A: خدمة HTTP خفية (signal-cli)

- يعمل `signal-cli` كخدمة خفية مع JSON-RPC عبر HTTP.
- تدفق الأحداث هو SSE (`/api/v1/events`).
- فحص الصحة: `/api/v1/check`.
- يتحكم OpenClaw في دورة الحياة عندما تكون `channels.signal.autoStart=true`.

راجع [Signal](/ar/channels/signal) للإعداد ونقاط النهاية.

## النمط B: عملية فرعية عبر stdio (imsg)

- يشغّل OpenClaw الأمر `imsg rpc` كعملية فرعية لـ [iMessage](/ar/channels/imessage).
- يكون JSON-RPC محددًا بالأسطر عبر stdin/stdout (كائن JSON واحد لكل سطر).
- لا يلزم منفذ TCP ولا خدمة خفية.

الطرق الأساسية المستخدمة:

- `watch.subscribe` → إشعارات (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (فحص/تشخيصات)

راجع [iMessage](/ar/channels/imessage) للإعداد القديم والعنونة (يُفضّل `chat_id`).

## إرشادات المحوّل

- يتحكم Gateway في العملية (يرتبط البدء/الإيقاف بدورة حياة المزوّد).
- اجعل عملاء RPC قادرين على الصمود: مهلات، وإعادة تشغيل عند الخروج.
- فضّل المعرّفات المستقرة (مثل `chat_id`) على سلاسل العرض.

## ذو صلة

- [بروتوكول Gateway](/ar/gateway/protocol)
