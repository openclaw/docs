---
read_when:
    - Konum Node desteği veya izinler kullanıcı arayüzü ekleme
    - Android konum izinlerini veya ön plan davranışını tasarlama
summary: Düğümler için konum komutu (location.get), izin modları ve Android ön plan davranışı
title: Konum komutu
x-i18n:
    generated_at: "2026-05-06T09:20:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63ed754bfdda1cf379dcb7ac40817c0b93cc1efe4526512d70258072da4bc8a7
    source_path: nodes/location-command.md
    workflow: 16
---

## Kısaca

- `location.get`, bir düğüm komutudur (`node.invoke` üzerinden).
- Varsayılan olarak kapalıdır.
- Android uygulama ayarları bir seçici kullanır: Kapalı / Kullanırken.
- Ayrı anahtar: Hassas Konum.

## Neden seçici (sadece anahtar değil)

İşletim sistemi izinleri çok seviyelidir. Uygulama içinde bir seçici sunabiliriz, ancak gerçek izni yine işletim sistemi belirler.

- iOS/macOS, sistem istemlerinde/Ayarlar'da **Kullanırken** veya **Her Zaman** seçeneklerini gösterebilir.
- Android uygulaması şu anda yalnızca ön plan konumunu destekler.
- Hassas konum ayrı bir izindir (iOS 14+ "Hassas", Android "fine" ve "coarse").

UI'daki seçici, istediğimiz modu yönlendirir; gerçek izin işletim sistemi ayarlarında tutulur.

## Ayarlar modeli

Düğüm cihazı başına:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

UI davranışı:

- `whileUsing` seçildiğinde ön plan izni istenir.
- İşletim sistemi istenen seviyeyi reddederse, izin verilen en yüksek seviyeye geri dön ve durumu göster.

## İzin eşlemesi (node.permissions)

İsteğe bağlıdır. macOS düğümü, izinler haritası üzerinden `location` bildirir; iOS/Android bunu atlayabilir.

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

Yanıt yükü:

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

- `LOCATION_DISABLED`: seçici kapalıdır.
- `LOCATION_PERMISSION_REQUIRED`: istenen mod için izin eksik.
- `LOCATION_BACKGROUND_UNAVAILABLE`: uygulama arka planda, ancak yalnızca Kullanırken izni verilmiş.
- `LOCATION_TIMEOUT`: zamanında konum düzeltmesi alınamadı.
- `LOCATION_UNAVAILABLE`: sistem hatası / sağlayıcı yok.

## Arka plan davranışı

- Android uygulaması, arka plandayken `location.get` çağrısını reddeder.
- Android'de konum isterken OpenClaw'ı açık tutun.
- Diğer düğüm platformları farklı davranabilir.

## Model/araç entegrasyonu

- Araç yüzeyi: `nodes` aracı `location_get` eylemini ekler (düğüm gerekli).
- CLI: `openclaw nodes location get --node <id>`.
- Ajan yönergeleri: yalnızca kullanıcı konumu etkinleştirdiğinde ve kapsamı anladığında çağırın.

## UX metni (önerilen)

- Kapalı: "Konum paylaşımı devre dışı."
- Kullanırken: "Yalnızca OpenClaw açıkken."
- Hassas: "Hassas GPS konumunu kullan. Yaklaşık konumu paylaşmak için kapat."

## İlgili

- [Kanal konumu ayrıştırma](/tr/channels/location)
- [Kamera yakalama](/tr/nodes/camera)
- [Konuşma modu](/tr/nodes/talk)
