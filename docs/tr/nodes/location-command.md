---
read_when:
    - Konum Node desteği veya izin kullanıcı arayüzü ekleme
    - Android konum izinlerini veya ön plan davranışını tasarlama
summary: Node'lar için konum komutu (`location.get`), izin modları ve Android ön plan davranışı
title: Konum komutu
x-i18n:
    generated_at: "2026-04-24T09:18:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcd7ae3bf411be4331d62494a5d5263e8cda345475c5f849913122c029377f06
    source_path: nodes/location-command.md
    workflow: 15
---

## Kısaca

- `location.get`, bir Node komutudur (`node.invoke` üzerinden).
- Varsayılan olarak kapalıdır.
- Android uygulama ayarları bir seçici kullanır: Kapalı / Kullanırken.
- Ayrı geçiş: Hassas Konum.

## Neden seçici var (yalnızca bir anahtar değil)

OS izinleri çok düzeylidir. Bunu uygulama içinde bir seçici olarak sunabiliriz, ancak gerçek izne yine OS karar verir.

- iOS/macOS sistem istemlerinde/Ayarlar'da **Kullanırken** veya **Her Zaman** gösterebilir.
- Android uygulaması şu anda yalnızca ön plan konumunu destekler.
- Hassas konum ayrı bir izindir (iOS 14+ “Precise”, Android “fine” ve “coarse”).

Kullanıcı arayüzündeki seçici istediğimiz modu belirler; gerçek izin OS ayarlarında yaşar.

## Ayar modeli

Node cihazı başına:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

Kullanıcı arayüzü davranışı:

- `whileUsing` seçildiğinde ön plan izni istenir.
- OS istenen düzeyi reddederse, verilen en yüksek düzeye geri dönülür ve durum gösterilir.

## İzin eşlemesi (`node.permissions`)

İsteğe bağlı. macOS Node, izinler eşlemi üzerinden `location` bildirir; iOS/Android bunu atlayabilir.

## Komut: `location.get`

`node.invoke` üzerinden çağrılır.

Parametreler (önerilen):

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

Yanıt payload'ı:

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

Hatalar (kararlı kodlar):

- `LOCATION_DISABLED`: seçici kapalı.
- `LOCATION_PERMISSION_REQUIRED`: istenen mod için izin eksik.
- `LOCATION_BACKGROUND_UNAVAILABLE`: uygulama arka planda ama yalnızca Kullanırken izni var.
- `LOCATION_TIMEOUT`: zamanında konum düzeltmesi alınamadı.
- `LOCATION_UNAVAILABLE`: sistem hatası / sağlayıcı yok.

## Arka plan davranışı

- Android uygulaması arka plandayken `location.get` isteğini reddeder.
- Android'de konum isterken OpenClaw'ı açık tutun.
- Diğer Node platformları farklı olabilir.

## Model/araç entegrasyonu

- Araç yüzeyi: `nodes` aracı `location_get` eylemini ekler (Node gerekir).
- CLI: `openclaw nodes location get --node <id>`.
- Aracı yönergeleri: yalnızca kullanıcı konumu etkinleştirdiğinde ve kapsamı anladığında çağırın.

## Kullanıcı deneyimi metni (önerilen)

- Kapalı: “Konum paylaşımı devre dışı.”
- Kullanırken: “Yalnızca OpenClaw açıkken.”
- Hassas: “Hassas GPS konumunu kullan. Yaklaşık konumu paylaşmak için bunu kapat.”

## İlgili

- [Kanal konum ayrıştırma](/tr/channels/location)
- [Kamera yakalama](/tr/nodes/camera)
- [Talk mode](/tr/nodes/talk)
