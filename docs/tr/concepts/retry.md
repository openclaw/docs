---
read_when:
    - Sağlayıcı yeniden deneme davranışını veya varsayılanlarını güncelleme
    - Sağlayıcı gönderim hataları veya hız sınırları için hata ayıklama
summary: Giden sağlayıcı çağrıları için yeniden deneme ilkesi
title: Yeniden deneme ilkesi
x-i18n:
    generated_at: "2026-05-02T08:52:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7720092499effdfa011fc0a0310adb2ecddca9e94f57f749794eab1c9ab4c922
    source_path: concepts/retry.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## Hedefler

- Çok adımlı akış başına değil, HTTP isteği başına yeniden deneyin.
- Yalnızca geçerli adımı yeniden deneyerek sıralamayı koruyun.
- İdempotent olmayan işlemleri çoğaltmaktan kaçının.

## Varsayılanlar

- Deneme sayısı: 3
- Maksimum gecikme sınırı: 30000 ms
- Jitter: 0.1 (yüzde 10)
- Sağlayıcı varsayılanları:
  - Telegram minimum gecikme: 400 ms
  - Discord minimum gecikme: 500 ms

## Davranış

### Model sağlayıcıları

- OpenClaw, sağlayıcı SDK'lerinin normal kısa yeniden denemeleri işlemesine izin verir.
- Anthropic ve OpenAI gibi Stainless tabanlı SDK'ler için, yeniden denenebilir yanıtlar
  (`408`, `409`, `429` ve `5xx`) `retry-after-ms` veya
  `retry-after` içerebilir. Bu bekleme 60 saniyeden uzun olduğunda OpenClaw,
  SDK'nin hatayı hemen göstermesi ve model yük devretmesinin başka bir kimlik doğrulama profiline veya yedek modele dönebilmesi için
  `x-should-retry: false` ekler.
- Sınırı `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>` ile geçersiz kılın.
  SDK'lerin uzun `Retry-After` beklemelerini dahili olarak uygulamasına izin vermek için bunu
  `0`, `false`, `off`, `none` veya `disabled` olarak ayarlayın.

### Discord

- Hız sınırı hatalarında (HTTP 429), istek zaman aşımlarında, HTTP 5xx yanıtlarında
  ve DNS arama hataları, bağlantı sıfırlamaları, soket kapanmaları ve fetch hataları gibi geçici aktarım hatalarında yeniden dener.
- Mevcut olduğunda Discord `retry_after` kullanır, aksi halde üstel geri çekilme uygular.

### Telegram

- Geçici hatalarda (429, zaman aşımı, bağlanma/sıfırlama/kapanma, geçici olarak kullanılamama) yeniden dener.
- Mevcut olduğunda `retry_after` kullanır, aksi halde üstel geri çekilme uygular.
- Markdown ayrıştırma hataları yeniden denenmez; düz metne geri dönerler.

## Yapılandırma

`~/.openclaw/openclaw.json` içinde sağlayıcı başına yeniden deneme politikasını ayarlayın:

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

- [Model yük devretmesi](/tr/concepts/model-failover)
- [Komut kuyruğu](/tr/concepts/queue)
