---
read_when:
    - Konum Node desteği veya izinler kullanıcı arayüzü ekleme
    - Android konum izinlerini veya ön plan davranışını tasarlama
summary: Node'lar için konum komutu (location.get), izin modları ve Android ön plan davranışı
title: Konum komutu
x-i18n:
    generated_at: "2026-07-12T11:55:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fae9f7707620f3f743d40c07618a431a6baa7a357dda6d74021bc986cd4974b1
    source_path: nodes/location-command.md
    workflow: 16
---

## Kısaca

- `location.get`, `node.invoke` veya `openclaw nodes location get` aracılığıyla çağrılan bir Node komutudur.
- Varsayılan olarak kapalıdır.
- Android üçüncü taraf derlemeleri bir seçici kullanır: Kapalı / Kullanırken / Her Zaman. Play derlemelerinde Kapalı / Kullanırken seçenekleri bulunmaya devam eder.
- Hassas Konum ayrı bir açma/kapama seçeneğidir.

## Neden yalnızca anahtar değil de seçici kullanılıyor?

İşletim sistemi konum izinleri birden çok düzeye sahiptir. Hassas konum da ayrı bir işletim sistemi iznidir (iOS 14+ sürümlerinde "Hassas", Android'de "ince" ve "kaba"). Uygulama içi seçici, istenen modu belirler ancak verilecek gerçek izne yine işletim sistemi karar verir.

## Ayarlar modeli

Her Node cihazı için:

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

Kullanıcı arayüzü davranışı:

- `whileUsing` seçildiğinde ön plan izni istenir.
- Android üçüncü taraf derlemesinde `always` seçildiğinde önce ön plan izni istenir, arka plan erişimi açıklanır ve ardından ayrı **Allow all the time** izni için Android uygulama ayarları açılır.
- Android Play derlemeleri arka planda konum iznini bildirmez veya `always` seçeneğini göstermez.
- İşletim sistemi istenen düzeyi reddederse uygulama, izin verilen en yüksek düzeye geri döner ve durumu gösterir.

## İzin eşlemesi (node.permissions)

İsteğe bağlıdır. macOS Node'u, `node.list`/`node.describe` üzerindeki `permissions` eşlemesi aracılığıyla `location` değerini bildirir; iOS/Android bunu atlayabilir.

## Komut: `location.get`

`node.invoke` veya CLI yardımcısı aracılığıyla çağrılır:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Parametreler:

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

CLI bayrakları doğrudan eşlenir: `--location-timeout` -> `timeoutMs`, `--max-age` -> `maxAgeMs`, `--accuracy` -> `desiredAccuracy`.

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
- `LOCATION_PERMISSION_REQUIRED`: istenen mod için gerekli izin eksiktir.
- `LOCATION_BACKGROUND_UNAVAILABLE`: uygulama arka plandadır ancak yalnızca Kullanırken izni verilmiştir.
- `LOCATION_TIMEOUT`: zamanında konum belirlenemedi.
- `LOCATION_UNAVAILABLE`: sistem hatası oluştu veya kullanılabilir sağlayıcı yok.

## Arka plan davranışı

- Android üçüncü taraf derlemeleri, arka plandaki `location.get` çağrısını yalnızca kullanıcı `Always` seçeneğini belirlediğinde ve Android arka planda konum izni verdiğinde kabul eder. Mevcut kalıcı Node hizmeti, `location` hizmet türünü ekler ve etkinken `Location: Always` ifadesini gösterir.
- Android Play derlemeleri ve `While Using` modu, uygulama arka plandayken `location.get` çağrısını reddeder.
- Diğer Node platformlarında davranış farklı olabilir.

## Model/araç entegrasyonu

- Aracı aracı: `nodes` aracının `location_get` eylemi (Node gereklidir).
- CLI: `openclaw nodes location get --node <id>`.
- Aracı yönergeleri: yalnızca kullanıcı konumu etkinleştirmiş ve kapsamını anlamışsa çağırın.

## Kullanıcı deneyimi metni (önerilen)

- Kapalı: "Konum paylaşımı devre dışı."
- Kullanırken: "Yalnızca OpenClaw açıkken."
- Her Zaman: "OpenClaw arka plandayken istenen konum denetimlerine izin ver."
- Hassas: "Hassas GPS konumunu kullan. Yaklaşık konum paylaşmak için kapatın."

## İlgili

- [Node'lara genel bakış](/tr/nodes)
- [Kanal konumu ayrıştırma](/tr/channels/location)
- [Kamera yakalama](/tr/nodes/camera)
- [Konuşma modu](/tr/nodes/talk)
