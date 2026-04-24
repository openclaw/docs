---
read_when:
    - iOS/Android Node'larında veya macOS'ta kamera yakalamayı ekleme veya değiştirme
    - Agent erişimli MEDIA geçici dosya iş akışlarını genişletme
summary: 'Agent kullanımı için kamera yakalama (iOS/Android Node''ları + macOS uygulaması): fotoğraflar (`jpg`) ve kısa video klipler (`mp4`)'
title: Kamera yakalama
x-i18n:
    generated_at: "2026-04-24T09:17:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 33e23a382cdcea57e20ab1466bf32e54dd17e3b7918841dbd6d3ebf59547ad93
    source_path: nodes/camera.md
    workflow: 15
---

OpenClaw, agent iş akışları için **kamera yakalama** desteği sunar:

- **iOS Node'u** (Gateway üzerinden eşleştirilmiş): `node.invoke` ile **fotoğraf** (`jpg`) veya **kısa video klibi** (`mp4`, isteğe bağlı ses ile) yakalama.
- **Android Node'u** (Gateway üzerinden eşleştirilmiş): `node.invoke` ile **fotoğraf** (`jpg`) veya **kısa video klibi** (`mp4`, isteğe bağlı ses ile) yakalama.
- **macOS uygulaması** (Gateway üzerinden Node): `node.invoke` ile **fotoğraf** (`jpg`) veya **kısa video klibi** (`mp4`, isteğe bağlı ses ile) yakalama.

Tüm kamera erişimi **kullanıcı denetimli ayarların** arkasında korunur.

## iOS Node'u

### Kullanıcı ayarı (varsayılan açık)

- iOS Settings sekmesi → **Camera** → **Allow Camera** (`camera.enabled`)
  - Varsayılan: **açık** (anahtar yoksa etkin kabul edilir).
  - Kapalı olduğunda: `camera.*` komutları `CAMERA_DISABLED` döndürür.

### Komutlar (Gateway `node.invoke` üzerinden)

- `camera.list`
  - Yanıt payload'u:
    - `devices`: `{ id, name, position, deviceType }` dizisi

- `camera.snap`
  - Parametreler:
    - `facing`: `front|back` (varsayılan: `front`)
    - `maxWidth`: sayı (isteğe bağlı; iOS Node'unda varsayılan `1600`)
    - `quality`: `0..1` (isteğe bağlı; varsayılan `0.9`)
    - `format`: şu anda `jpg`
    - `delayMs`: sayı (isteğe bağlı; varsayılan `0`)
    - `deviceId`: string (isteğe bağlı; `camera.list` içinden)
  - Yanıt payload'u:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Payload koruması: fotoğraflar, base64 payload'unu 5 MB altında tutmak için yeniden sıkıştırılır.

- `camera.clip`
  - Parametreler:
    - `facing`: `front|back` (varsayılan: `front`)
    - `durationMs`: sayı (varsayılan `3000`, en fazla `60000` olacak şekilde sınırlandırılır)
    - `includeAudio`: boolean (varsayılan `true`)
    - `format`: şu anda `mp4`
    - `deviceId`: string (isteğe bağlı; `camera.list` içinden)
  - Yanıt payload'u:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Ön plan gereksinimi

`canvas.*` gibi, iOS Node'u `camera.*` komutlarına yalnızca **ön planda** izin verir. Arka plan çağrıları `NODE_BACKGROUND_UNAVAILABLE` döndürür.

### CLI yardımcısı (geçici dosyalar + MEDIA)

Ekleri almanın en kolay yolu, kodu çözülmüş medyayı geçici bir dosyaya yazan ve `MEDIA:<path>` yazdıran CLI yardımcısıdır.

Örnekler:

```bash
openclaw nodes camera snap --node <id>               # varsayılan: hem ön hem arka (2 MEDIA satırı)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Notlar:

- `nodes camera snap`, agent'e iki görünümü de vermek için varsayılan olarak **her iki** yönü kullanır.
- Çıktı dosyaları, kendi sarmalayıcınızı oluşturmadığınız sürece geçicidir (OS geçici dizininde).

## Android Node'u

### Android kullanıcı ayarı (varsayılan açık)

- Android Settings sayfası → **Camera** → **Allow Camera** (`camera.enabled`)
  - Varsayılan: **açık** (anahtar yoksa etkin kabul edilir).
  - Kapalı olduğunda: `camera.*` komutları `CAMERA_DISABLED` döndürür.

### İzinler

- Android çalışma zamanında şu izinleri gerektirir:
  - Hem `camera.snap` hem de `camera.clip` için `CAMERA`.
  - `includeAudio=true` olduğunda `camera.clip` için `RECORD_AUDIO`.

İzinler eksikse uygulama mümkün olduğunda ister; reddedilirse `camera.*` istekleri
`*_PERMISSION_REQUIRED` hatasıyla başarısız olur.

### Android ön plan gereksinimi

`canvas.*` gibi, Android Node'u `camera.*` komutlarına yalnızca **ön planda** izin verir. Arka plan çağrıları `NODE_BACKGROUND_UNAVAILABLE` döndürür.

### Android komutları (Gateway `node.invoke` üzerinden)

- `camera.list`
  - Yanıt payload'u:
    - `devices`: `{ id, name, position, deviceType }` dizisi

### Payload koruması

Fotoğraflar, base64 payload'unu 5 MB altında tutmak için yeniden sıkıştırılır.

## macOS uygulaması

### Kullanıcı ayarı (varsayılan kapalı)

macOS yardımcı uygulaması bir onay kutusu sunar:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - Varsayılan: **kapalı**
  - Kapalı olduğunda: kamera istekleri “Camera disabled by user” döndürür.

### CLI yardımcısı (node invoke)

macOS Node'unda kamera komutlarını çağırmak için ana `openclaw` CLI'yi kullanın.

Örnekler:

```bash
openclaw nodes camera list --node <id>            # kamera kimliklerini listele
openclaw nodes camera snap --node <id>            # MEDIA:<path> yazdırır
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # MEDIA:<path> yazdırır
openclaw nodes camera clip --node <id> --duration-ms 3000      # MEDIA:<path> yazdırır (eski bayrak)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Notlar:

- `openclaw nodes camera snap`, aksi geçersiz kılınmadıkça varsayılan olarak `maxWidth=1600` kullanır.
- macOS'ta `camera.snap`, yakalamadan önce ısınma/pozlama oturması sonrası `delayMs` kadar bekler (varsayılan 2000 ms).
- Fotoğraf payload'ları, base64 değerini 5 MB altında tutmak için yeniden sıkıştırılır.

## Güvenlik + pratik sınırlar

- Kamera ve mikrofon erişimi normal OS izin istemlerini tetikler (ve Info.plist içinde kullanım string'leri gerektirir).
- Video klipleri, büyük boyutlu Node payload'larından kaçınmak için sınırlandırılmıştır (şu anda `<= 60s`) (base64 ek yükü + mesaj sınırları).

## macOS ekran videosu (OS düzeyi)

_Ekran_ videosu için (kamera değil) macOS yardımcı uygulamasını kullanın:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # MEDIA:<path> yazdırır
```

Notlar:

- macOS **Screen Recording** izni (TCC) gerektirir.

## İlgili

- [Image and media support](/tr/nodes/images)
- [Media understanding](/tr/nodes/media-understanding)
- [Location command](/tr/nodes/location-command)
