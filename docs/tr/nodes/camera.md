---
read_when:
    - iOS/Android düğümlerinde veya macOS'ta kamera yakalama ekliyor ya da değiştiriyorsanız
    - Ajanın erişebildiği MEDIA geçici dosya iş akışlarını genişletiyorsanız
summary: 'Ajan kullanımı için kamera yakalama (iOS/Android düğümleri + macOS uygulaması): fotoğraflar (`jpg`) ve kısa video klipleri (`mp4`)'
title: Kamera Yakalama
x-i18n:
    generated_at: "2026-04-05T13:58:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30b1beaac9602ff29733f72b953065f271928743c8fff03191a007e8b965c88d
    source_path: nodes/camera.md
    workflow: 15
---

# Kamera yakalama (ajan)

OpenClaw, ajan iş akışları için **kamera yakalamayı** destekler:

- **iOS düğümü** (Gateway üzerinden eşleştirilmiş): `node.invoke` aracılığıyla bir **fotoğraf** (`jpg`) veya **kısa video klibi** (`mp4`, isteğe bağlı ses ile) yakalayın.
- **Android düğümü** (Gateway üzerinden eşleştirilmiş): `node.invoke` aracılığıyla bir **fotoğraf** (`jpg`) veya **kısa video klibi** (`mp4`, isteğe bağlı ses ile) yakalayın.
- **macOS uygulaması** (Gateway üzerinden düğüm): `node.invoke` aracılığıyla bir **fotoğraf** (`jpg`) veya **kısa video klibi** (`mp4`, isteğe bağlı ses ile) yakalayın.

Tüm kamera erişimi **kullanıcı denetimli ayarların** arkasında geçitlenir.

## iOS düğümü

### Kullanıcı ayarı (varsayılan açık)

- iOS Settings sekmesi → **Camera** → **Allow Camera** (`camera.enabled`)
  - Varsayılan: **açık** (eksik anahtar etkin olarak değerlendirilir).
  - Kapalıyken: `camera.*` komutları `CAMERA_DISABLED` döndürür.

### Komutlar (Gateway `node.invoke` aracılığıyla)

- `camera.list`
  - Yanıt payload'ı:
    - `devices`: `{ id, name, position, deviceType }` dizisi

- `camera.snap`
  - Parametreler:
    - `facing`: `front|back` (varsayılan: `front`)
    - `maxWidth`: sayı (isteğe bağlı; iOS düğümünde varsayılan `1600`)
    - `quality`: `0..1` (isteğe bağlı; varsayılan `0.9`)
    - `format`: şu anda `jpg`
    - `delayMs`: sayı (isteğe bağlı; varsayılan `0`)
    - `deviceId`: dize (isteğe bağlı; `camera.list` içinden)
  - Yanıt payload'ı:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Payload koruması: fotoğraflar, base64 payload'ı 5 MB altında kalacak şekilde yeniden sıkıştırılır.

- `camera.clip`
  - Parametreler:
    - `facing`: `front|back` (varsayılan: `front`)
    - `durationMs`: sayı (varsayılan `3000`, en fazla `60000` olacak şekilde sınırlandırılır)
    - `includeAudio`: boolean (varsayılan `true`)
    - `format`: şu anda `mp4`
    - `deviceId`: dize (isteğe bağlı; `camera.list` içinden)
  - Yanıt payload'ı:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Ön plan gereksinimi

`canvas.*` gibi, iOS düğümü `camera.*` komutlarına yalnızca **ön planda** izin verir. Arka plan çağrıları `NODE_BACKGROUND_UNAVAILABLE` döndürür.

### CLI yardımcısı (geçici dosyalar + MEDIA)

Ekleri almanın en kolay yolu, çözümlenen medyayı geçici bir dosyaya yazan ve `MEDIA:<path>` yazdıran CLI yardımcısını kullanmaktır.

Örnekler:

```bash
openclaw nodes camera snap --node <id>               # varsayılan: hem ön hem arka (2 MEDIA satırı)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Notlar:

- `nodes camera snap`, ajana her iki görünümü de vermek için varsayılan olarak **iki** yönü de kullanır.
- Kendi wrapper'ınızı oluşturmadığınız sürece çıktı dosyaları geçicidir (OS geçici dizininde).

## Android düğümü

### Android kullanıcı ayarı (varsayılan açık)

- Android Settings sayfası → **Camera** → **Allow Camera** (`camera.enabled`)
  - Varsayılan: **açık** (eksik anahtar etkin olarak değerlendirilir).
  - Kapalıyken: `camera.*` komutları `CAMERA_DISABLED` döndürür.

### İzinler

- Android çalışma zamanında şu izinleri gerektirir:
  - Hem `camera.snap` hem de `camera.clip` için `CAMERA`.
  - `includeAudio=true` olduğunda `camera.clip` için `RECORD_AUDIO`.

İzinler eksikse uygulama mümkün olduğunda istem gösterir; reddedilirse `camera.*` istekleri
`*_PERMISSION_REQUIRED` hatasıyla başarısız olur.

### Android ön plan gereksinimi

`canvas.*` gibi, Android düğümü `camera.*` komutlarına yalnızca **ön planda** izin verir. Arka plan çağrıları `NODE_BACKGROUND_UNAVAILABLE` döndürür.

### Android komutları (Gateway `node.invoke` aracılığıyla)

- `camera.list`
  - Yanıt payload'ı:
    - `devices`: `{ id, name, position, deviceType }` dizisi

### Payload koruması

Fotoğraflar, base64 payload'ı 5 MB altında kalacak şekilde yeniden sıkıştırılır.

## macOS uygulaması

### Kullanıcı ayarı (varsayılan kapalı)

macOS eşlikçi uygulaması bir onay kutusu sunar:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - Varsayılan: **kapalı**
  - Kapalıyken: kamera istekleri “Camera disabled by user” döndürür.

### CLI yardımcısı (node invoke)

macOS düğümünde kamera komutları çağırmak için ana `openclaw` CLI'yi kullanın.

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

- `openclaw nodes camera snap`, geçersiz kılınmadıkça varsayılan olarak `maxWidth=1600` kullanır.
- macOS'ta `camera.snap`, yakalamadan önce ısınma/pozlama dengelenmesinden sonra `delayMs` kadar bekler (varsayılan 2000ms).
- Fotoğraf payload'ları, base64 değeri 5 MB altında kalacak şekilde yeniden sıkıştırılır.

## Güvenlik + pratik sınırlar

- Kamera ve mikrofon erişimi olağan OS izin istemlerini tetikler (ve Info.plist içinde kullanım dizeleri gerektirir).
- Video klipleri, büyük düğüm payload'larını önlemek için sınırlandırılır (şu anda `<= 60s`) (base64 ek yükü + mesaj sınırları).

## macOS ekran videosu (OS düzeyi)

_Ekran_ videosu için (kamera değil), macOS eşlikçi uygulamasını kullanın:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # MEDIA:<path> yazdırır
```

Notlar:

- macOS **Screen Recording** izni (TCC) gerektirir.
