---
read_when:
    - iOS/Android Node'larında veya macOS'te kamera yakalama özelliği ekleme ya da değiştirme
    - Aracı tarafından erişilebilen MEDIA geçici dosya iş akışlarını genişletme
summary: 'Ajan kullanımı için kamera çekimi (iOS/Android Node''ları + macOS uygulaması): fotoğraflar (jpg) ve kısa video klipleri (mp4)'
title: Kamera çekimi
x-i18n:
    generated_at: "2026-07-12T12:24:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 38555c98886f6cd74ddacabc049da353cdb023e7f99aba81a272021cd8a0e33d
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw, eşleştirilmiş **iOS**, **Android** ve **macOS** Node'larında ajan iş akışları için kamera çekimini destekler: Gateway `node.invoke` aracılığıyla fotoğraf (`jpg`) veya kısa bir video klip (`mp4`, isteğe bağlı sesle) çekebilirsiniz.

Tüm kamera erişimleri, her platformda kullanıcı tarafından denetlenen bir ayarla sınırlandırılır.

## iOS Node'u

### iOS kullanıcı ayarı

- iOS Settings sekmesi → **Camera** → **Allow Camera** (`camera.enabled`).
  - Varsayılan: **açık** (anahtarın bulunmaması etkin olarak değerlendirilir).
  - Kapalı olduğunda: `camera.*` komutları `CAMERA_DISABLED` döndürür.

### iOS komutları (Gateway `node.invoke` aracılığıyla)

- `camera.list`
  - Yanıt yükü: `devices` — `{ id, name, position, deviceType }` nesnelerinden oluşan dizi.

- `camera.snap`
  - Parametreler:
    - `facing`: `front|back` (varsayılan: `front`)
    - `maxWidth`: sayı (isteğe bağlı; varsayılan `1600`)
    - `quality`: `0..1` (isteğe bağlı; varsayılan `0.9`, `[0.05, 1.0]` aralığıyla sınırlandırılır)
    - `format`: şu anda `jpg`
    - `delayMs`: sayı (isteğe bağlı; varsayılan `0`, dahili olarak en fazla `10000`)
    - `deviceId`: dize (isteğe bağlı; `camera.list` kaynağından)
  - Yanıt yükü: `format: "jpg"`, `base64`, `width`, `height`.
  - Yük koruması: Fotoğraflar, base64 kodlu yükü 5 MB'nin altında tutmak için yeniden sıkıştırılır.

- `camera.clip`
  - Parametreler:
    - `facing`: `front|back` (varsayılan: `front`)
    - `durationMs`: sayı (varsayılan `3000`, `[250, 60000]` aralığıyla sınırlandırılır)
    - `includeAudio`: boole değeri (varsayılan `true`)
    - `format`: şu anda `mp4`
    - `deviceId`: dize (isteğe bağlı; `camera.list` kaynağından)
  - Yanıt yükü: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.

### iOS ön plan gereksinimi

`canvas.*` gibi iOS Node'u da `camera.*` komutlarına yalnızca **ön planda** izin verir. Arka plan çağrıları `NODE_BACKGROUND_UNAVAILABLE` döndürür.

### CLI yardımcısı

Medya dosyalarını almanın en kolay yolu, kodu çözülmüş medyayı geçici bir dosyaya yazıp kaydedilen yolu ekrana basan CLI yardımcısını kullanmaktır.

```bash
openclaw nodes camera snap --node <id>                 # varsayılan: hem ön hem arka (2 MEDIA satırı)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

`nodes camera snap`, ajana her iki görünümü de sunmak için hem ön hem arka kamerayla çekim yapan `--facing both` değerini varsayılan olarak kullanır; tek bir açık kamera yönüyle birlikte `--device-id` iletin (`--device-id` ayarlandığında `both` reddedilir). Kendi sarmalayıcınızı oluşturmadığınız sürece çıktı dosyaları geçicidir (işletim sisteminin geçici dizininde).

## Android Node'u

### Android kullanıcı ayarı

- Android Settings sayfası → **Camera** → **Allow Camera** (`camera.enabled`).
  - **Yeni kurulumlarda varsayılan olarak kapalıdır.** Bu ayardan önceki mevcut kurulumlar, yükseltme sırasında daha önce çalışan kamera erişiminin sessizce kaybolmaması için **açık** durumuna geçirilir.
  - Kapalı olduğunda: `camera.*` komutları `CAMERA_DISABLED: enable Camera in Settings` döndürür.

### İzinler

- Hem `camera.snap` hem de `camera.clip` için `CAMERA` gerekir; eksik veya reddedilmiş izin `CAMERA_PERMISSION_REQUIRED` döndürür.
- `includeAudio` değeri `true` olduğunda `camera.clip` için `RECORD_AUDIO` gerekir; eksik veya reddedilmiş izin `MIC_PERMISSION_REQUIRED` döndürür.

Uygulama, mümkün olduğunda çalışma zamanı izinlerini ister.

### Android ön plan gereksinimi

`canvas.*` gibi Android Node'u da `camera.*` komutlarına yalnızca **ön planda** izin verir. Arka plan çağrıları `NODE_BACKGROUND_UNAVAILABLE: command requires foreground` döndürür.

### Android komutları (Gateway `node.invoke` aracılığıyla)

- `camera.list`
  - Yanıt yükü: `devices` — `{ id, name, position, deviceType }` nesnelerinden oluşan dizi.

- `camera.snap`
  - Parametreler: `facing` (`front|back`, varsayılan `front`), `quality` (varsayılan `0.95`, `[0.1, 1.0]` aralığıyla sınırlandırılır), `maxWidth` (varsayılan `1600`), `deviceId` (isteğe bağlı; bilinmeyen kimlik `INVALID_REQUEST` hatasına neden olur).
  - Yanıt yükü: `format: "jpg"`, `base64`, `width`, `height`.
  - Yük koruması: base64 verisini 5 MB'nin altında tutmak için yeniden sıkıştırılır (iOS ile aynı sınır).

- `camera.clip`
  - Parametreler: `facing` (varsayılan `front`), `durationMs` (varsayılan `3000`, `[200, 60000]` aralığıyla sınırlandırılır), `includeAudio` (varsayılan `true`), `deviceId` (isteğe bağlı).
  - Yanıt yükü: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.
  - Yük koruması: Ham MP4, base64 kodlamasından önce 18 MB ile sınırlandırılır; sınırı aşan klipler `PAYLOAD_TOO_LARGE` hatasıyla başarısız olur (`durationMs` değerini azaltıp yeniden deneyin).

## macOS uygulaması

### macOS kullanıcı ayarı

macOS yardımcı uygulaması bir onay kutusu sunar:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`).
  - Varsayılan: **kapalı**.
  - Kapalı olduğunda: kamera istekleri `CAMERA_DISABLED: enable Camera in Settings` döndürür.

### CLI yardımcısı (Node çağrısı)

macOS Node'unda kamera komutlarını çağırmak için ana `openclaw` CLI'ını kullanın.

```bash
openclaw nodes camera list --node <id>                     # kamera kimliklerini listeler
openclaw nodes camera snap --node <id>                     # kaydedilen yolu ekrana basar
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # kaydedilen yolu ekrana basar
openclaw nodes camera clip --node <id> --duration-ms 3000   # kaydedilen yolu ekrana basar (eski bayrak)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- Geçersiz kılınmadığı sürece `openclaw nodes camera snap`, varsayılan olarak `maxWidth=1600` kullanır.
- `camera.snap`, çekimden önce ısınma/pozlama dengelemesinin ardından `delayMs` kadar bekler (varsayılan 2000 ms, `[0, 10000]` aralığıyla sınırlandırılır).
- Fotoğraf yükleri, base64 verisini 5 MB'nin altında tutmak için yeniden sıkıştırılır.

## Güvenlik ve pratik sınırlar

- Kamera ve mikrofon erişimi, işletim sisteminin olağan izin istemlerini tetikler (ve `Info.plist` içinde kullanım açıklamaları gerektirir).
- Node yüklerinin aşırı büyümesini önlemek için video klipler 60 saniyeyle sınırlandırılır (base64 ek yükü ve mesaj sınırları nedeniyle).

## macOS ekran videosu (işletim sistemi düzeyinde)

Kamera yerine _ekran_ videosu için macOS yardımcı uygulamasını kullanın:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # kaydedilen yolu ekrana basar
```

macOS **Screen Recording** izni (TCC) gerektirir.

## İlgili içerikler

- [Görüntü ve medya desteği](/tr/nodes/images)
- [Medya anlama](/tr/nodes/media-understanding)
- [Konum komutu](/tr/nodes/location-command)
