---
read_when:
    - Harici CLI entegrasyonları ekleme veya değiştirme
    - RPC bağdaştırıcılarında hata ayıklama (`signal-cli`, `imsg`)
summary: Harici CLI'ler (`signal-cli`, eski `imsg`) ve Gateway kalıpları için RPC bağdaştırıcıları
title: RPC bağdaştırıcıları
x-i18n:
    generated_at: "2026-04-24T09:29:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: e35a08831db5317071aea6fc39dbf2407a7254710b2d1b751a9cc8dc4cc0d307
    source_path: reference/rpc.md
    workflow: 15
---

OpenClaw, harici CLI'leri JSON-RPC üzerinden entegre eder. Bugün iki kalıp kullanılmaktadır.

## Kalıp A: HTTP daemon (`signal-cli`)

- `signal-cli`, HTTP üzerinden JSON-RPC ile bir daemon olarak çalışır.
- Olay akışı SSE'dir (`/api/v1/events`).
- Sağlık denetimi: `/api/v1/check`.
- `channels.signal.autoStart=true` olduğunda yaşam döngüsü OpenClaw tarafından yönetilir.

Kurulum ve uç noktalar için [Signal](/tr/channels/signal) bölümüne bakın.

## Kalıp B: stdio alt süreç (eski: `imsg`)

> **Not:** Yeni iMessage kurulumları için bunun yerine [BlueBubbles](/tr/channels/bluebubbles) kullanın.

- OpenClaw, `imsg rpc` komutunu bir alt süreç olarak başlatır (eski iMessage entegrasyonu).
- JSON-RPC, stdin/stdout üzerinden satır sınırlı olarak iletilir (satır başına bir JSON nesnesi).
- TCP portu yoktur, daemon gerekmez.

Kullanılan temel yöntemler:

- `watch.subscribe` → bildirimler (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (probe/tanılamalar)

Eski kurulum ve adresleme (`chat_id` tercih edilir) için [iMessage](/tr/channels/imessage) bölümüne bakın.

## Bağdaştırıcı yönergeleri

- Süreç Gateway'e aittir (başlatma/durdurma, sağlayıcı yaşam döngüsüne bağlıdır).
- RPC istemcilerini dayanıklı tutun: zaman aşımları, çıkışta yeniden başlatma.
- Görünen dizgeler yerine kararlı kimlikleri tercih edin (ör. `chat_id`).

## İlgili

- [Gateway protocol](/tr/gateway/protocol)
