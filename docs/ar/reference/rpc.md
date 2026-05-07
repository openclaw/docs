---
read_when:
    - إضافة تكاملات CLI الخارجية أو تغييرها
    - تصحيح أخطاء محوِّلات RPC (signal-cli، imsg)
summary: محولات RPC لواجهات CLI الخارجية (signal-cli، imsg) وأنماط Gateway
title: محولات RPC
x-i18n:
    generated_at: "2026-05-07T01:54:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 446e54d736352f45e6cc6988a1835233cace7f854b6e62c64bb1fae115ce76f6
    source_path: reference/rpc.md
    workflow: 16
---

يتكامل OpenClaw مع واجهات CLI خارجية عبر JSON-RPC. يُستخدم نمطان اليوم.

## النمط A: daemon عبر HTTP (signal-cli)

- يعمل `signal-cli` بصفته daemon مع JSON-RPC عبر HTTP.
- تدفق الأحداث هو SSE (`/api/v1/events`).
- فحص الصحة: `/api/v1/check`.
- يتولى OpenClaw دورة الحياة عندما تكون `channels.signal.autoStart=true`.

راجع [Signal](/ar/channels/signal) لمعرفة الإعداد ونقاط النهاية.

## النمط B: عملية فرعية عبر stdio (قديم: imsg)

> **ملاحظة:** لإعدادات iMessage الجديدة، استخدم [BlueBubbles](/ar/channels/bluebubbles) بدلاً من ذلك.

- يُشغّل OpenClaw الأمر `imsg rpc` كعملية فرعية (تكامل iMessage القديم).
- يكون JSON-RPC مفصولاً بأسطر عبر stdin/stdout (كائن JSON واحد لكل سطر).
- لا يلزم منفذ TCP ولا daemon.

الطرق الأساسية المستخدمة:

- `watch.subscribe` ← الإشعارات (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (الفحص/التشخيصات)

راجع [iMessage](/ar/channels/imessage) لمعرفة الإعداد القديم والعنونة (يُفضَّل `chat_id`).

## إرشادات Adapter

- يتولى Gateway ملكية العملية (يرتبط البدء/الإيقاف بدورة حياة المزوّد).
- اجعل عملاء RPC قادرين على الصمود: المهل الزمنية، وإعادة التشغيل عند الخروج.
- فضّل المعرّفات المستقرة (مثل `chat_id`) على سلاسل العرض.

## ذات صلة

- [بروتوكول Gateway](/ar/gateway/protocol)
