---
read_when:
    - Kanal konum ayrıştırması eklerken veya değiştirirken
    - Ajan istemlerinde veya araçlarda konum bağlam alanlarını kullanırken
summary: Gelen kanal konum ayrıştırması (Telegram/WhatsApp/Matrix) ve bağlam alanları
title: Kanal Konum Ayrıştırması
x-i18n:
    generated_at: "2026-04-05T13:43:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 10061f0c109240a9e0bcab649b17f03b674e8bdf410debf3669b7b6da8189d96
    source_path: channels/location.md
    workflow: 15
---

# Kanal konum ayrıştırması

OpenClaw, sohbet kanallarından paylaşılan konumları şu biçimlerde normalize eder:

- gelen gövdeye eklenen insan tarafından okunabilir metin olarak ve
- otomatik yanıt bağlamı yükündeki yapılandırılmış alanlar olarak.

Şu anda desteklenenler:

- **Telegram** (konum pinleri + mekanlar + canlı konumlar)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)
- **Matrix** (`geo_uri` içeren `m.location`)

## Metin biçimlendirme

Konumlar, köşeli parantez olmadan okunabilir satırlar olarak işlenir:

- Pin:
  - `📍 48.858844, 2.294351 ±12m`
- Adlandırılmış yer:
  - `📍 Eiffel Tower — Champ de Mars, Paris (48.858844, 2.294351 ±12m)`
- Canlı paylaşım:
  - `🛰 Canlı konum: 48.858844, 2.294351 ±12m`

Kanal bir açıklama/yorum içeriyorsa, sonraki satıra eklenir:

```
📍 48.858844, 2.294351 ±12m
Burada buluş
```

## Bağlam alanları

Bir konum mevcut olduğunda, bu alanlar `ctx` içine eklenir:

- `LocationLat` (sayı)
- `LocationLon` (sayı)
- `LocationAccuracy` (sayı, metre; isteğe bağlı)
- `LocationName` (dize; isteğe bağlı)
- `LocationAddress` (dize; isteğe bağlı)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (boolean)

## Kanal notları

- **Telegram**: mekanlar `LocationName/LocationAddress` ile eşlenir; canlı konumlar `live_period` kullanır.
- **WhatsApp**: `locationMessage.comment` ve `liveLocationMessage.caption`, açıklama satırı olarak eklenir.
- **Matrix**: `geo_uri`, pin konumu olarak ayrıştırılır; yükseklik yok sayılır ve `LocationIsLive` her zaman false olur.
