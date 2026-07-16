---
read_when:
    - Kanal konumu ayrıştırması ekleme veya değiştirme
    - Temsilci istemlerinde veya araçlarında konum bağlamı alanlarını kullanma
summary: Kanal konumu ayrıştırma ve taşınabilir giden konum yükleri
title: Kanal konumu ayrıştırma
x-i18n:
    generated_at: "2026-07-16T16:37:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c7e5647d02643ad6d95024b362228377690d7fdff66441fae367f0f5307217fb
    source_path: channels/location.md
    workflow: 16
---

OpenClaw, sohbet kanallarından paylaşılan konumları şu biçimlere normalleştirir:

- gelen gövdeye eklenen kısa koordinat metni ve
- otomatik yanıt bağlamı yükündeki yapılandırılmış alanlar. Kanal tarafından sağlanan etiketler, adresler ve açıklamalar/yorumlar, kullanıcı gövdesinde satır içi olarak değil, paylaşılan güvenilmeyen meta veri JSON bloğu aracılığıyla istemde oluşturulur.

Şu anda desteklenenler:

- **LINE** (başlık/adres içeren konum mesajları)
- **Matrix** (`geo_uri` içeren `m.location`)
- **Telegram** (konum işaretleri + mekânlar + canlı konumlar)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)

## Metin biçimlendirme

Konumlar, köşeli parantezler olmadan okunaklı satırlar hâlinde oluşturulur. Koordinatlar altı ondalık basamak kullanır; doğruluk tam metreye yuvarlanır:

- İşaret:
  - `📍 48.858844, 2.294351 ±12m`
- Adlandırılmış yer (aynı satır; ad/adres yalnızca meta veri bloğuna gider):
  - `📍 48.858844, 2.294351 ±12m`
- Canlı paylaşım:
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

Kanal bir etiket, adres veya açıklama/yorum içeriyorsa bu, bağlam yükünde korunur ve istemde çitle çevrili güvenilmeyen JSON olarak görünür (mevcut olmayan alanlar atlanır):

````text
Konum (güvenilmeyen meta veri):
```json
{
  "latitude": 48.858844,
  "longitude": 2.294351,
  "accuracy_m": 12,
  "source": "place",
  "name": "Eyfel Kulesi",
  "address": "Champ de Mars, Paris",
  "caption": "Burada buluşalım"
}
```
````

## Bağlam alanları

Bir konum mevcut olduğunda şu alanlar `ctx` öğesine eklenir:

- `LocationLat` (sayı)
- `LocationLon` (sayı)
- `LocationAccuracy` (sayı, metre; isteğe bağlı)
- `LocationName` (dize; isteğe bağlı)
- `LocationAddress` (dize; isteğe bağlı)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (mantıksal değer)
- `LocationCaption` (dize; isteğe bağlı)

Kanal açık bir kaynak ayarlamadığında OpenClaw bunu çıkarır: canlı paylaşımlar `live`, adı veya adresi olan konumlar `place`, diğer her şey `pin` olur.

İstem oluşturucu, `LocationName`, `LocationAddress` ve `LocationCaption` alanlarını güvenilmeyen meta veri olarak değerlendirir ve bunları diğer kanal bağlamı için kullanılan aynı sınırlı JSON yolu üzerinden serileştirir.

## Giden yükler

Mesaj aracı ve Plugin SDK, taşınabilir giden konumlar için aynı `NormalizedLocation` şeklini kullanır. Yalnızca koordinat içeren bir yük, bir işareti temsil eder. Yerel mekân desteğine sahip kanallar, `name` ile `address` öğelerini bir mekân kartına eşleyebilir.

Telegram şu anda bunu `message(action="send")` aracılığıyla sunar. İlk uygulaması bilinçli olarak bağımsızdır: konum yükleri metin veya medyayla karıştırılamaz ve eksik mekân çiftleri, bir adı veya adresi sessizce atmak yerine başarısız olur. Desteklenmeyen kanallar konum parametresini duyurmaz.

## Kanal notları

- **LINE**: konum mesajındaki `title`/`address`, `LocationName`/`LocationAddress` alanlarına eşlenir; canlı konum yoktur.
- **Matrix**: `geo_uri` bir konum işareti olarak ayrıştırılır; `u` (belirsizlik) parametresi `LocationAccuracy` alanına eşlenir, etkinlik gövdesi `LocationCaption` alanını doldurur, rakım yok sayılır ve `LocationIsLive` her zaman false olur.
- **Telegram**: mekânlar `LocationName`/`LocationAddress` alanlarına eşlenir; canlı konumlar `live_period` aracılığıyla algılanır.
- **WhatsApp**: `locationMessage.comment` ve `liveLocationMessage.caption`, `LocationCaption` alanını doldurur.

## İlgili

- [Konum komutu (Node'lar)](/tr/nodes/location-command)
- [Kamera çekimi](/tr/nodes/camera)
- [Medya anlama](/tr/nodes/media-understanding)
