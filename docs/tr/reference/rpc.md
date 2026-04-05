---
read_when:
    - Harici CLI entegrasyonları ekleme veya değiştirme
    - RPC adaptörlerinde hata ayıklama (signal-cli, imsg)
summary: Harici CLI’lar (signal-cli, eski imsg) ve gateway kalıpları için RPC adaptörleri
title: RPC Adaptörleri
x-i18n:
    generated_at: "2026-04-05T14:06:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06dc6b97184cc704ba4ec4a9af90502f4316bcf717c3f4925676806d8b184c57
    source_path: reference/rpc.md
    workflow: 15
---

# RPC adaptörleri

OpenClaw, harici CLI’ları JSON-RPC aracılığıyla entegre eder. Bugün iki kalıp kullanılmaktadır.

## Kalıp A: HTTP daemon (signal-cli)

- `signal-cli`, HTTP üzerinden JSON-RPC ile bir daemon olarak çalışır.
- Olay akışı SSE’dir (`/api/v1/events`).
- Sağlık denetimi: `/api/v1/check`.
- `channels.signal.autoStart=true` olduğunda yaşam döngüsünü OpenClaw yönetir.

Kurulum ve uç noktalar için [Signal](/tr/channels/signal) bölümüne bakın.

## Kalıp B: stdio alt süreci (eski: imsg)

> **Not:** Yeni iMessage kurulumları için bunun yerine [BlueBubbles](/tr/channels/bluebubbles) kullanın.

- OpenClaw, bir alt süreç olarak `imsg rpc` başlatır (eski iMessage entegrasyonu).
- JSON-RPC, stdin/stdout üzerinden satır sınırlı olarak iletilir (satır başına bir JSON nesnesi).
- TCP bağlantı noktası yoktur, daemon gerekmez.

Kullanılan temel yöntemler:

- `watch.subscribe` → bildirimler (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (yoklama/tanılama)

Eski kurulum ve adresleme (`chat_id` tercih edilir) için [iMessage](/tr/channels/imessage) bölümüne bakın.

## Adaptör yönergeleri

- Sürecin sahibi gateway’dir (başlatma/durdurma, sağlayıcı yaşam döngüsüne bağlıdır).
- RPC istemcilerini dayanıklı tutun: zaman aşımı, çıkışta yeniden başlatma.
- Görünen dizeler yerine kararlı kimlikleri tercih edin (ör. `chat_id`).
