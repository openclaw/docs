---
read_when:
    - Sağlayıcı yeniden deneme davranışını veya varsayılanlarını güncelleme
    - Sağlayıcı gönderim hatalarını veya hız sınırlarını ayıklama
summary: Giden sağlayıcı çağrıları için yeniden deneme ilkesi
title: Yeniden deneme politikası
x-i18n:
    generated_at: "2026-07-12T12:16:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be2bcb5af829b90042bfcbc5c0e5f5cc5a3cb03dd5472737c80fa0f15803361
    source_path: concepts/retry.md
    workflow: 16
---

## Hedefler

- Çok adımlı akış başına değil, HTTP isteği başına yeniden deneyin.
- Yalnızca geçerli adımı yeniden deneyerek sıralamayı koruyun.
- İdempotent olmayan işlemlerin yinelenmesini önleyin.

## Varsayılanlar

| Ayar                    | Varsayılan |
| ----------------------- | ---------- |
| Deneme sayısı           | 3          |
| En yüksek gecikme sınırı | 30000 ms   |
| Rastgele sapma          | 0.1 (10%)  |
| Telegram en düşük gecikmesi | 400 ms |
| Discord en düşük gecikmesi | 500 ms  |

## Davranış

### Model sağlayıcıları

- OpenClaw, normal kısa yeniden denemeleri sağlayıcı SDK'larının yönetmesine izin verir.
- Anthropic ve OpenAI gibi Stainless tabanlı SDK'larda yeniden denenebilir yanıtlar (`408`, `409`, `429` ve `5xx`), `retry-after-ms` veya `retry-after` içerebilir. Bu bekleme süresi 60 saniyeden uzunsa OpenClaw, SDK'nın hatayı hemen bildirmesi ve model yük devrinin başka bir kimlik doğrulama profiline veya yedek modele geçebilmesi için `x-should-retry: false` ekler.
- Sınırı `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>` ile geçersiz kılın. SDK'ların uzun `Retry-After` beklemelerini kendi içinde uygulamasına izin vermek için değeri `0`, `false`, `off`, `none` veya `disabled` olarak ayarlayın.

### Discord

- Hız sınırı hatalarında (HTTP 429), istek zaman aşımlarında, HTTP 5xx yanıtlarında ve DNS çözümleme hataları, bağlantı sıfırlamaları, soket kapanmaları ve getirme hataları gibi geçici aktarım hatalarında yeniden dener.
- Kullanılabiliyorsa Discord `retry_after` değerini, aksi takdirde üstel geri çekilmeyi kullanır.

### Telegram

- Geçici hatalarda (429, zaman aşımı, bağlantı/sıfırlama/kapanma, geçici olarak kullanılamama) yeniden dener.
- Kullanılabiliyorsa `retry_after` değerini, aksi takdirde üstel geri çekilmeyi kullanır.
- HTML/Markdown ayrıştırma hataları yeniden denenmez; ilk denemede düz metne geri dönülür.

## Yapılandırma

`~/.openclaw/openclaw.json` içinde her sağlayıcı için yeniden deneme politikasını ayarlayın:

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

- Yeniden denemeler istek başına uygulanır (mesaj gönderme, medya yükleme, tepki, anket, çıkartma).
- Bileşik akışlar tamamlanan adımları yeniden denemez.

## İlgili

- [Model yük devri](/tr/concepts/model-failover)
- [Komut kuyruğu](/tr/concepts/queue)
