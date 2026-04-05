---
read_when:
    - Sağlayıcı yeniden deneme davranışını veya varsayılanlarını güncelliyorsunuz
    - Sağlayıcı gönderim hatalarını veya hız sınırlarını hata ayıklıyorsunuz
summary: Giden sağlayıcı çağrıları için yeniden deneme ilkesi
title: Yeniden Deneme İlkesi
x-i18n:
    generated_at: "2026-04-05T13:51:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55bb261ff567f46ce447be9c0ee0c5b5e6d2776287d7662762656c14108dd607
    source_path: concepts/retry.md
    workflow: 15
---

# Yeniden deneme ilkesi

## Hedefler

- Çok adımlı akış başına değil, HTTP isteği başına yeniden dene.
- Yalnızca geçerli adımı yeniden deneyerek sıralamayı koru.
- İdempotent olmayan işlemlerin yinelenmesini önle.

## Varsayılanlar

- Deneme sayısı: 3
- En yüksek gecikme sınırı: 30000 ms
- Jitter: 0.1 (yüzde 10)
- Sağlayıcı varsayılanları:
  - Telegram en düşük gecikme: 400 ms
  - Discord en düşük gecikme: 500 ms

## Davranış

### Discord

- Yalnızca hız sınırı hatalarında yeniden dener (HTTP 429).
- Kullanılabiliyorsa Discord `retry_after` değerini, aksi takdirde üstel geri çekilmeyi kullanır.

### Telegram

- Geçici hatalarda yeniden dener (429, zaman aşımı, bağlanma/sıfırlama/kapanma, geçici olarak kullanılamıyor).
- Kullanılabiliyorsa `retry_after` değerini, aksi takdirde üstel geri çekilmeyi kullanır.
- Markdown ayrıştırma hataları yeniden denenmez; düz metne geri düşerler.

## Yapılandırma

Yeniden deneme ilkesini `~/.openclaw/openclaw.json` içinde sağlayıcı başına ayarlayın:

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
