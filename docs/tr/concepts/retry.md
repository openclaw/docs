---
read_when:
    - Sağlayıcı yeniden deneme davranışını veya varsayılanlarını güncelleme
    - Sağlayıcı gönderim hatalarında veya oran sınırlarında hata ayıklama
summary: Giden sağlayıcı çağrıları için yeniden deneme ilkesi
title: Yeniden deneme ilkesi
x-i18n:
    generated_at: "2026-04-24T09:06:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 38811a6dabb0b60b71167ee4fcc09fb042f941b4bbb1cf8b0f5a91c3c93b2e75
    source_path: concepts/retry.md
    workflow: 15
---

## Hedefler

- Çok adımlı akış başına değil, HTTP isteği başına yeniden deneme yapmak.
- Yalnızca geçerli adımı yeniden deneyerek sıralamayı korumak.
- İdempotent olmayan işlemleri çoğaltmaktan kaçınmak.

## Varsayılanlar

- Deneme sayısı: 3
- Maksimum gecikme üst sınırı: 30000 ms
- Jitter: 0.1 (yüzde 10)
- Sağlayıcı varsayılanları:
  - Telegram minimum gecikme: 400 ms
  - Discord minimum gecikme: 500 ms

## Davranış

### Model sağlayıcıları

- OpenClaw, sağlayıcı SDK'larının normal kısa yeniden denemeleri işlemesine izin verir.
- Anthropic ve OpenAI gibi Stainless tabanlı SDK'larda, yeniden denenebilir yanıtlar
  (`408`, `409`, `429` ve `5xx`) `retry-after-ms` veya
  `retry-after` içerebilir. Bu bekleme 60 saniyeden uzunsa OpenClaw
  `x-should-retry: false` enjekte eder; böylece SDK hatayı hemen gösterir ve model
  yük devretme başka bir kimlik doğrulama profiline veya geri dönüş modeline dönebilir.
- Üst sınırı `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>` ile geçersiz kılın.
  SDK'ların uzun `Retry-After` beklemelerine içeride uymasına izin vermek için
  bunu `0`, `false`, `off`, `none` veya `disabled` olarak ayarlayın.

### Discord

- Yalnızca oran sınırı hatalarında (HTTP 429) yeniden dener.
- Mümkün olduğunda Discord `retry_after` değerini, aksi halde üstel geri çekilmeyi kullanır.

### Telegram

- Geçici hatalarda yeniden dener (429, zaman aşımı, bağlanma/sıfırlama/kapanma, geçici olarak kullanılamıyor).
- Mümkün olduğunda `retry_after`, aksi halde üstel geri çekilme kullanır.
- Markdown ayrıştırma hataları yeniden denenmez; bunun yerine düz metne geri döner.

## Yapılandırma

Yeniden deneme ilkesini sağlayıcı başına `~/.openclaw/openclaw.json` içinde ayarlayın:

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## Notlar

- Yeniden denemeler istek başına uygulanır (mesaj gönderimi, medya yükleme, tepki, anket, çıkartma).
- Bileşik akışlar tamamlanmış adımları yeniden denemez.

## İlgili

- [Model yük devretme](/tr/concepts/model-failover)
- [Komut kuyruğu](/tr/concepts/queue)
