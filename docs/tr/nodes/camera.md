---
read_when:
    - iOS/Android düğümlerinde veya macOS’te kamera yakalama ekleme ya da değiştirme
    - Ajan tarafından erişilebilir MEDIA geçici dosya iş akışlarını genişletme
summary: 'Ajan kullanımı için kamera yakalama (iOS/Android düğümleri + macOS uygulaması): fotoğraflar (jpg) ve kısa video klipleri (mp4)'
title: Kamera yakalama
x-i18n:
    generated_at: "2026-05-06T09:20:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 226b9f44e8d56b9b366d679c6c2f974c714afc4cb962afddba89d17dcdfc09eb
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw, ajan iş akışları için **kamera yakalamayı** destekler:

- **iOS node** (Gateway üzerinden eşleştirilmiş): `node.invoke` üzerinden bir **fotoğraf** (`jpg`) veya **kısa video klip** (`mp4`, isteğe bağlı sesle) yakalayın.
- **Android node** (Gateway üzerinden eşleştirilmiş): `node.invoke` üzerinden bir **fotoğraf** (`jpg`) veya **kısa video klip** (`mp4`, isteğe bağlı sesle) yakalayın.
- **macOS uygulaması** (Gateway üzerinden node): `node.invoke` üzerinden bir **fotoğraf** (`jpg`) veya **kısa video klip** (`mp4`, isteğe bağlı sesle) yakalayın.

Tüm kamera erişimi **kullanıcı denetimli ayarların** arkasında denetlenir.

## iOS node

### Kullanıcı ayarı (varsayılan açık)

- iOS Ayarlar sekmesi → **Kamera** → **Kameraya İzin Ver** (`camera.enabled`)
  - Varsayılan: **açık** (eksik anahtar etkin kabul edilir).
  - Kapalıyken: `camera.*` komutları `CAMERA_DISABLED` döndürür.

### Komutlar (Gateway `node.invoke` üzerinden)

- `camera.list`
  - Yanıt yükü:
    - `devices`: `{ id, name, position, deviceType }` dizisi

- `camera.snap`
  - Parametreler:
    - `facing`: `front|back` (varsayılan: `front`)
    - `maxWidth`: sayı (isteğe bağlı; iOS node üzerinde varsayılan `1600`)
    - `quality`: `0..1` (isteğe bağlı; varsayılan `0.9`)
    - `format`: şu anda `jpg`
    - `delayMs`: sayı (isteğe bağlı; varsayılan `0`)
    - `deviceId`: dize (isteğe bağlı; `camera.list` içinden)
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
    - `deviceId`: dize (isteğe bağlı; `camera.list` içinden)
  - Yanıt yükü:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Ön plan gereksinimi

`canvas.*` gibi, iOS node da `camera.*` komutlarına yalnızca **ön planda** izin verir. Arka plan çağrıları `NODE_BACKGROUND_UNAVAILABLE` döndürür.

### CLI yardımcısı (geçici dosyalar + MEDIA)

Ekleri almanın en kolay yolu, kodu çözülmüş medyayı geçici bir dosyaya yazan ve `MEDIA:<path>` yazdıran CLI yardımcısını kullanmaktır.

Örnekler:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Notlar:

- `nodes camera snap`, ajana iki görünümü de vermek için varsayılan olarak **her iki** yöne ayarlanır.
- Kendi sarmalayıcınızı oluşturmadığınız sürece çıktı dosyaları geçicidir (OS geçici dizininde).

## Android node

### Android kullanıcı ayarı (varsayılan açık)

- Android Ayarlar sayfası → **Kamera** → **Kameraya İzin Ver** (`camera.enabled`)
  - Varsayılan: **açık** (eksik anahtar etkin kabul edilir).
  - Kapalıyken: `camera.*` komutları `CAMERA_DISABLED` döndürür.

### İzinler

- Android, çalışma zamanı izinleri gerektirir:
  - Hem `camera.snap` hem de `camera.clip` için `CAMERA`.
  - `includeAudio=true` olduğunda `camera.clip` için `RECORD_AUDIO`.

İzinler eksikse, uygulama mümkün olduğunda istem gösterir; reddedilirse `camera.*` istekleri
`*_PERMISSION_REQUIRED` hatasıyla başarısız olur.

### Android ön plan gereksinimi

`canvas.*` gibi, Android node da `camera.*` komutlarına yalnızca **ön planda** izin verir. Arka plan çağrıları `NODE_BACKGROUND_UNAVAILABLE` döndürür.

### Android komutları (Gateway `node.invoke` üzerinden)

- `camera.list`
  - Yanıt yükü:
    - `devices`: `{ id, name, position, deviceType }` dizisi

### Yük koruması

Fotoğraflar, base64 yükünü 5 MB altında tutmak için yeniden sıkıştırılır.

## macOS uygulaması

### Kullanıcı ayarı (varsayılan kapalı)

macOS yardımcı uygulaması bir onay kutusu sunar:

- **Ayarlar → Genel → Kameraya İzin Ver** (`openclaw.cameraEnabled`)
  - Varsayılan: **kapalı**
  - Kapalıyken: kamera istekleri "Kamera kullanıcı tarafından devre dışı bırakıldı" döndürür.

### CLI yardımcısı (node çağırma)

macOS node üzerinde kamera komutlarını çağırmak için ana `openclaw` CLI'ını kullanın.

Örnekler:

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints MEDIA:<path> (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Notlar:

- `openclaw nodes camera snap`, geçersiz kılınmadığı sürece varsayılan olarak `maxWidth=1600` kullanır.
- macOS üzerinde `camera.snap`, yakalamadan önce ısınma/pozlama dengelemesinden sonra `delayMs` (varsayılan 2000ms) bekler.
- Fotoğraf yükleri, base64'ü 5 MB altında tutmak için yeniden sıkıştırılır.

## Güvenlik + pratik sınırlar

- Kamera ve mikrofon erişimi olağan OS izin istemlerini tetikler (ve Info.plist içinde kullanım dizeleri gerektirir).
- Video klipler, aşırı büyük node yüklerini önlemek için sınırlandırılır (şu anda `<= 60s`) (base64 ek yükü + mesaj sınırları).

## macOS ekran videosu (OS düzeyinde)

_Kamera_ videosu değil, _ekran_ videosu için macOS yardımcı uygulamasını kullanın:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints MEDIA:<path>
```

Notlar:

- macOS **Ekran Kaydı** izni (TCC) gerektirir.

## İlgili

- [Görüntü ve medya desteği](/tr/nodes/images)
- [Medya anlama](/tr/nodes/media-understanding)
- [Konum komutu](/tr/nodes/location-command)
