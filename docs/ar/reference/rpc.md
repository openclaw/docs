---
read_when:
- Adding or changing external CLI integrations
- تصحيح محوّلات RPC (signal-cli، imsg)
summary: محوّلات RPC لـ CLI الخارجية (signal-cli وlegacy imsg) وأنماط Gateway
title: محوّلات RPC
x-i18n:
  generated_at: '2026-04-24T08:03:09Z'
  refreshed_at: '2026-04-28T05:23:26Z'
  model: gpt-5.4
  provider: openai
  source_hash: e35a08831db5317071aea6fc39dbf2407a7254710b2d1b751a9cc8dc4cc0d307
  source_path: reference/rpc.md
  workflow: 15
---

يدمج OpenClaw أدوات CLI الخارجية عبر JSON-RPC. ويُستخدم نمطان اليوم.

## النمط A: ‏HTTP daemon ‏(signal-cli)

- يعمل `signal-cli` كـ daemon مع JSON-RPC عبر HTTP.
- يكون تدفق الأحداث SSE ‏(`/api/v1/events`).
- فحص السلامة: ‏`/api/v1/check`.
- يملك OpenClaw دورة الحياة عندما تكون `channels.signal.autoStart=true`.

راجع [Signal](/ar/channels/signal) لمعرفة الإعداد ونقاط النهاية.

## النمط B: عملية فرعية عبر stdio ‏(قديم: imsg)

> **ملاحظة:** بالنسبة إلى إعدادات iMessage الجديدة، استخدم [BlueBubbles](/ar/channels/bluebubbles) بدلًا من ذلك.

- يولّد OpenClaw العملية الفرعية `imsg rpc` (تكامل iMessage القديم).
- تكون JSON-RPC محددة بالأسطر عبر stdin/stdout (كائن JSON واحد لكل سطر).
- لا يوجد منفذ TCP، ولا حاجة إلى daemon.

الطرق الأساسية المستخدمة:

- `watch.subscribe` ← إشعارات (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (للفحص/التشخيصات)

راجع [iMessage](/ar/channels/imessage) لمعرفة الإعداد القديم والعنونة (يفضّل `chat_id`).

## إرشادات المحوّل

- تملك Gateway العملية (البدء/الإيقاف مرتبطان بدورة حياة المزوّد).
- أبقِ عملاء RPC قادرين على الصمود: مهل زمنية، وإعادة تشغيل عند الخروج.
- فضّل المعرّفات الثابتة (مثل `chat_id`) على سلاسل العرض.

## ذو صلة

- [بروتوكول Gateway](/ar/gateway/protocol)
