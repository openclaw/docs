---
read_when:
    - iOS/Android düğümlerinde veya macOS'ta kamera yakalama ekleme ya da değiştirme
    - Ajan tarafından erişilebilir MEDIA geçici dosya iş akışlarını genişletme
summary: 'Ajan kullanımı için kamera yakalama (iOS/Android düğümleri + macOS uygulaması): fotoğraflar (jpg) ve kısa video klipler (mp4)'
title: Kamera yakalama
x-i18n:
    generated_at: "2026-06-28T00:46:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cb02b1e0e5d68e537dc699bcabacfb48b7beaf07459bf47800810a721191795
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw, aracı iş akışları için **kamera yakalamayı** destekler:

- **iOS düğümü** (Gateway üzerinden eşleştirilmiş): `node.invoke` aracılığıyla bir **fotoğraf** (`jpg`) veya **kısa video klip** (`mp4`, isteğe bağlı ses ile) yakalayın.
- **Android düğümü** (Gateway üzerinden eşleştirilmiş): `node.invoke` aracılığıyla bir **fotoğraf** (`jpg`) veya **kısa video klip** (`mp4`, isteğe bağlı ses ile) yakalayın.
- **macOS uygulaması** (Gateway üzerinden düğüm): `node.invoke` aracılığıyla bir **fotoğraf** (`jpg`) veya **kısa video klip** (`mp4`, isteğe bağlı ses ile) yakalayın.

Tüm kamera erişimi **kullanıcı denetimli ayarların** arkasında korunur.

## iOS düğümü

### Kullanıcı ayarı (varsayılan açık)

- iOS Settings sekmesi → **Kamera** → **Kameraya İzin Ver** (`camera.enabled`)
  - Varsayılan: **açık** (eksik anahtar etkin olarak değerlendirilir).
  - Kapalıyken: `camera.*` komutları `CAMERA_DISABLED` döndürür.

### Komutlar (Gateway `node.invoke` üzerinden)

- `camera.list`
  - Yanıt yükü:
    - `devices`: `{ id, name, position, deviceType }` dizisi

- `camera.snap`
  - Parametreler:
    - `facing`: `front|back` (varsayılan: `front`)
    - `maxWidth`: sayı (isteğe bağlı; iOS düğümünde varsayılan `1600`)
    - `quality`: `0..1` (isteğe bağlı; varsayılan `0.9`)
    - `format`: şu anda `jpg`
    - `delayMs`: sayı (isteğe bağlı; varsayılan `0`)
    - `deviceId`: string (isteğe bağlı; `camera.list` kaynağından)
  - Yanıt yükü:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Yük koruması: fotoğraflar, base64 yükünü 5 MB altında tutmak için yeniden sıkıştırılır.

- `camera.clip`
  - Parametreler:
    - `facing`: `front|back` (varsayılan: `front`)
    - `durationMs`: sayı (varsayılan `3000`, en fazla `60000` olacak şekilde sınırlandırılır)
    - `includeAudio`: boolean (varsayılan `true`)
    - `format`: şu anda `mp4`
    - `deviceId`: string (isteğe bağlı; `camera.list` kaynağından)
  - Yanıt yükü:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Ön planda olma gereksinimi

`canvas.*` gibi, iOS düğümü `camera.*` komutlarına yalnızca **ön planda** izin verir. Arka plan çağrıları `NODE_BACKGROUND_UNAVAILABLE` döndürür.

### CLI yardımcısı

Medya dosyalarını almanın en kolay yolu, kodu çözülmüş medyayı geçici bir dosyaya yazan ve kaydedilen yolu yazdıran CLI yardımcısını kullanmaktır.

Örnekler:

```bash
openclaw nodes camera snap --node <id>               # varsayılan: hem ön + arka (2 MEDIA satırı)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Notlar:

- `nodes camera snap`, aracıya iki görünümü de vermek için varsayılan olarak **iki** yöne de ayarlanır.
- Çıktı dosyaları, kendi sarmalayıcınızı oluşturmadığınız sürece geçicidir (İS geçici dizininde).

## Android düğümü

### Android kullanıcı ayarı (varsayılan açık)

- Android Settings sayfası → **Kamera** → **Kameraya İzin Ver** (`camera.enabled`)
  - Varsayılan: **açık** (eksik anahtar etkin olarak değerlendirilir).
  - Kapalıyken: `camera.*` komutları `CAMERA_DISABLED` döndürür.

### İzinler

- Android çalışma zamanı izinleri gerektirir:
  - Hem `camera.snap` hem de `camera.clip` için `CAMERA`.
  - `includeAudio=true` olduğunda `camera.clip` için `RECORD_AUDIO`.

İzinler eksikse uygulama mümkün olduğunda sorar; reddedilirse `camera.*` istekleri
`*_PERMISSION_REQUIRED` hatasıyla başarısız olur.

### Android ön planda olma gereksinimi

`canvas.*` gibi, Android düğümü `camera.*` komutlarına yalnızca **ön planda** izin verir. Arka plan çağrıları `NODE_BACKGROUND_UNAVAILABLE` döndürür.

### Android komutları (Gateway `node.invoke` üzerinden)

- `camera.list`
  - Yanıt yükü:
    - `devices`: `{ id, name, position, deviceType }` dizisi

### Yük koruması

Fotoğraflar, base64 yükünü 5 MB altında tutmak için yeniden sıkıştırılır.

## macOS uygulaması

### Kullanıcı ayarı (varsayılan kapalı)

macOS yardımcı uygulaması bir onay kutusu sunar:

- **Settings → General → Kameraya İzin Ver** (`openclaw.cameraEnabled`)
  - Varsayılan: **kapalı**
  - Kapalıyken: kamera istekleri "Kamera kullanıcı tarafından devre dışı bırakıldı" döndürür.

### CLI yardımcısı (düğüm çağrısı)

macOS düğümünde kamera komutlarını çağırmak için ana `openclaw` CLI’ını kullanın.

Örnekler:

```bash
openclaw nodes camera list --node <id>            # kamera kimliklerini listele
openclaw nodes camera snap --node <id>            # kaydedilen yolu yazdırır
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # kaydedilen yolu yazdırır
openclaw nodes camera clip --node <id> --duration-ms 3000      # kaydedilen yolu yazdırır (eski bayrak)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Notlar:

- `openclaw nodes camera snap`, üzerine yazılmadığı sürece varsayılan olarak `maxWidth=1600` kullanır.
- macOS üzerinde `camera.snap`, yakalamadan önce ısınma/pozlama dengelemesinden sonra `delayMs` kadar (varsayılan 2000 ms) bekler.
- Fotoğraf yükleri, base64 değerini 5 MB altında tutmak için yeniden sıkıştırılır.

## Güvenlik + pratik sınırlar

- Kamera ve mikrofon erişimi, olağan İS izin istemlerini tetikler (ve Info.plist içinde kullanım dizeleri gerektirir).
- Video klipler, aşırı büyük düğüm yüklerini önlemek için sınırlandırılır (şu anda `<= 60s`) (base64 ek yükü + ileti sınırları).

## macOS ekran videosu (İS düzeyinde)

_kamera değil_ _ekran_ videosu için macOS yardımcı uygulamasını kullanın:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # kaydedilen yolu yazdırır
```

Notlar:

- macOS **Screen Recording** izni (TCC) gerektirir.

## İlgili

- [Görüntü ve medya desteği](/tr/nodes/images)
- [Medya anlama](/tr/nodes/media-understanding)
- [Konum komutu](/tr/nodes/location-command)
