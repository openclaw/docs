---
read_when:
    - Konum node desteği veya izin UI'si ekliyorsunuz
    - Android konum izinlerini veya foreground davranışını tasarlıyorsunuz
summary: Node'lar için konum komutu (location.get), izin modları ve Android foreground davranışı
title: Konum Komutu
x-i18n:
    generated_at: "2026-04-05T13:58:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c691cfe147b0b9b16b3a4984d544c168a46b37f91d55b82b2507407d2011529
    source_path: nodes/location-command.md
    workflow: 15
---

# Konum komutu (node'lar)

## Özet

- `location.get`, bir node komutudur (`node.invoke` üzerinden).
- Varsayılan olarak kapalıdır.
- Android uygulama ayarları bir seçici kullanır: Kapalı / Kullanırken.
- Ayrı anahtar: Kesin Konum.

## Neden bir seçici var (yalnızca bir anahtar değil)

OS izinleri çok seviyelidir. Uygulama içinde bir seçici sunabiliriz, ancak gerçek izni yine OS belirler.

- iOS/macOS, sistem istemlerinde/Ayarlar'da **Kullanırken** veya **Her Zaman** seçeneklerini sunabilir.
- Android uygulaması şu anda yalnızca foreground konumu destekler.
- Kesin konum ayrı bir izindir (iOS 14+ “Precise”, Android'de “fine” ve “coarse”).

UI'daki seçici istediğimiz modu belirler; gerçek izin OS ayarlarında yaşar.

## Ayarlar modeli

Node cihazı başına:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

UI davranışı:

- `whileUsing` seçildiğinde foreground izni istenir.
- OS istenen düzeyi reddederse, verilen en yüksek düzeye geri dönülür ve durum gösterilir.

## İzin eşlemesi (`node.permissions`)

İsteğe bağlıdır. macOS node, izinler eşlemesi üzerinden `location` bildirir; iOS/Android bunu atlayabilir.

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

Yanıt payload'u:

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
- `LOCATION_BACKGROUND_UNAVAILABLE`: uygulama arka planda ama yalnızca While Using izni var.
- `LOCATION_TIMEOUT`: zamanında konum düzeltmesi alınamadı.
- `LOCATION_UNAVAILABLE`: sistem arızası / sağlayıcı yok.

## Arka plan davranışı

- Android uygulaması arka plandayken `location.get` komutunu reddeder.
- Android'de konum isterken OpenClaw'ı açık tutun.
- Diğer node platformları farklı davranabilir.

## Model/araç entegrasyonu

- Araç yüzeyi: `nodes` aracı `location_get` eylemini ekler (node gereklidir).
- CLI: `openclaw nodes location get --node <id>`.
- Aracı yönergeleri: yalnızca kullanıcı konumu etkinleştirdiğinde ve kapsamı anladığında çağrılmalıdır.

## UX metni (önerilen)

- Kapalı: “Konum paylaşımı devre dışı.”
- Kullanırken: “Yalnızca OpenClaw açıkken.”
- Kesin: “Kesin GPS konumunu kullan. Yaklaşık konumu paylaşmak için kapat.”
