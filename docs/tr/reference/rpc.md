---
read_when:
    - Harici CLI entegrasyonları ekleme veya değiştirme
    - RPC bağdaştırıcılarında hata ayıklama (signal-cli, imsg)
summary: Harici CLI'ler (signal-cli, imsg) ve Gateway kalıpları için RPC adaptörleri
title: RPC bağdaştırıcıları
x-i18n:
    generated_at: "2026-05-10T19:53:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63556f140bee55821fa0a09ff9808e163728049f8db4c58f7bb4ceca6e1cac1a
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw, harici CLI'ları JSON-RPC aracılığıyla entegre eder. Bugün iki kalıp kullanılır.

## Kalıp A: HTTP daemon (signal-cli)

- `signal-cli`, HTTP üzerinden JSON-RPC ile daemon olarak çalışır.
- Olay akışı SSE'dir (`/api/v1/events`).
- Sağlık yoklaması: `/api/v1/check`.
- `channels.signal.autoStart=true` olduğunda yaşam döngüsünü OpenClaw yönetir.

Kurulum ve uç noktalar için [Signal](/tr/channels/signal) bölümüne bakın.

## Kalıp B: stdio alt süreci (imsg)

- OpenClaw, [iMessage](/tr/channels/imessage) için `imsg rpc` komutunu alt süreç olarak başlatır.
- JSON-RPC, stdin/stdout üzerinden satır sınırlıdır (satır başına bir JSON nesnesi).
- TCP portu yoktur, daemon gerekmez.

Kullanılan temel yöntemler:

- `watch.subscribe` → bildirimler (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (yoklama/tanılama)

Eski kurulum ve adresleme için [iMessage](/tr/channels/imessage) bölümüne bakın (`chat_id` tercih edilir).

## Bağdaştırıcı yönergeleri

- Sürecin sahibi Gateway'dir (başlatma/durdurma sağlayıcı yaşam döngüsüne bağlıdır).
- RPC istemcilerini dayanıklı tutun: zaman aşımları, çıkışta yeniden başlatma.
- Görüntüleme dizeleri yerine kararlı kimlikleri (ör. `chat_id`) tercih edin.

## İlgili

- [Gateway protokolü](/tr/gateway/protocol)
