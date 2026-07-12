---
read_when:
    - Harici CLI entegrasyonları ekleme veya değiştirme
    - RPC bağdaştırıcılarında hata ayıklama (signal-cli, imsg)
summary: Harici CLI'lar (signal-cli, imsg) için RPC adaptörleri ve Gateway kalıpları
title: RPC bağdaştırıcıları
x-i18n:
    generated_at: "2026-07-12T12:13:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ddb3fb741c90fe7b01ba35376b71865584b1e507cf610705392452790fb76f5
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw, harici CLI'ları JSON-RPC aracılığıyla entegre eder. Günümüzde iki kalıp kullanılır.

## Kalıp A: HTTP daemon'ı (signal-cli)

- `signal-cli`, HTTP üzerinden JSON-RPC kullanan bir daemon olarak çalışır.
- Olay akışı SSE'dir (`/api/v1/events`).
- Sistem durumu yoklaması: `/api/v1/check`.
- `channels.signal.autoStart=true` olduğunda yaşam döngüsünü OpenClaw yönetir.

Kurulum ve uç noktalar için [Signal](/tr/channels/signal) sayfasına bakın.

## Kalıp B: stdio alt süreci (imsg)

- OpenClaw, [iMessage](/tr/channels/imessage) için `imsg rpc` komutunu bir alt süreç olarak başlatır.
- JSON-RPC, stdin/stdout üzerinden satırlarla ayrılmış biçimde iletilir (her satırda bir JSON nesnesi).
- TCP bağlantı noktası ve daemon gerekmez.

Kullanılan temel yöntemler:

- `watch.subscribe` → bildirimler (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (yoklama/tanılama)

Kurulum ve adresleme (`chat_id`, görüntüleme dizelerine tercih edilir) için [iMessage](/tr/channels/imessage) sayfasına bakın.

## Bağdaştırıcı yönergeleri

- Süreci Gateway yönetir (başlatma/durdurma, sağlayıcının yaşam döngüsüne bağlıdır).
- RPC istemcilerini dayanıklı tutun: zaman aşımları uygulayın, çıkış durumunda yeniden başlatın.
- Görüntüleme dizeleri yerine kararlı kimlikleri (ör. `chat_id`) tercih edin.

## İlgili

- [Gateway protokolü](/tr/gateway/protocol)
