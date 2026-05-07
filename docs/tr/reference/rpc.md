---
read_when:
    - Harici CLI entegrasyonları ekleme veya değiştirme
    - RPC adaptörlerinde hata ayıklama (signal-cli, imsg)
summary: Harici CLI'ler (signal-cli, imsg) ve Gateway desenleri için RPC adaptörleri
title: RPC bağdaştırıcıları
x-i18n:
    generated_at: "2026-05-07T01:53:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 446e54d736352f45e6cc6988a1835233cace7f854b6e62c64bb1fae115ce76f6
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw, harici CLI'larla JSON-RPC üzerinden entegre olur. Bugün iki desen kullanılır.

## Desen A: HTTP daemon (signal-cli)

- `signal-cli`, HTTP üzerinden JSON-RPC ile daemon olarak çalışır.
- Olay akışı SSE'dir (`/api/v1/events`).
- Sağlık yoklaması: `/api/v1/check`.
- `channels.signal.autoStart=true` olduğunda yaşam döngüsünü OpenClaw yönetir.

Kurulum ve uç noktalar için [Signal](/tr/channels/signal) sayfasına bakın.

## Desen B: stdio alt süreci (eski: imsg)

> **Not:** Yeni iMessage kurulumları için bunun yerine [BlueBubbles](/tr/channels/bluebubbles) kullanın.

- OpenClaw, `imsg rpc` komutunu alt süreç olarak başlatır (eski iMessage entegrasyonu).
- JSON-RPC, stdin/stdout üzerinden satırlarla ayrılmıştır (satır başına bir JSON nesnesi).
- TCP bağlantı noktası yoktur, daemon gerekmez.

Kullanılan çekirdek yöntemler:

- `watch.subscribe` → bildirimler (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (yoklama/tanılama)

Eski kurulum ve adresleme için [iMessage](/tr/channels/imessage) sayfasına bakın (`chat_id` tercih edilir).

## Bağdaştırıcı yönergeleri

- Süreci Gateway yönetir (başlatma/durdurma sağlayıcı yaşam döngüsüne bağlıdır).
- RPC istemcilerini dayanıklı tutun: zaman aşımları, çıkışta yeniden başlatma.
- Görüntü dizeleri yerine kararlı kimlikleri (ör. `chat_id`) tercih edin.

## İlgili

- [Gateway protokolü](/tr/gateway/protocol)
