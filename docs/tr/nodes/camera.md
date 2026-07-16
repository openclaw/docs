---
read_when:
    - Node platformlarında kamera yakalama özelliği ekleme veya değiştirme
    - Aracı tarafından erişilebilen MEDIA geçici dosya iş akışlarını genişletme
summary: Fotoğraflar ve kısa video klipleri için iOS, Android, macOS ve Linux Node'larında kamera ile çekim
title: Kamera çekimi
x-i18n:
    generated_at: "2026-07-16T17:34:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8fff8302863b63209222d87b350238dd2f01e18d06ce1783036b3cefaca14020
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw, eşleştirilmiş **iOS**, **Android**, **macOS** ve **Linux** Node'larında ajan iş akışları için kamera çekimini destekler: Gateway `node.invoke` aracılığıyla fotoğraf (`jpg`) veya isteğe bağlı ses içeren kısa bir video klip (`mp4`) çekilebilir.

Tüm kamera erişimi, her platformda kullanıcı tarafından denetlenen bir ayarla sınırlandırılır.

## iOS Node'u

### iOS kullanıcı ayarı

- iOS Settings sekmesi → **Camera** → **Allow Camera** (`camera.enabled`).
  - Varsayılan: **açık** (anahtarın bulunmaması etkin olarak kabul edilir).
  - Kapalıyken: `camera.*` komutları `CAMERA_DISABLED` döndürür.

### iOS komutları (Gateway `node.invoke` aracılığıyla)

- `camera.list`
  - Yanıt yükü: `devices` — `{ id, name, position, deviceType }` dizisi.

- `camera.snap`
  - Parametreler:
    - `facing`: `front|back` (varsayılan: `front`)
    - `maxWidth`: sayı (isteğe bağlı; varsayılan `1600`)
    - `quality`: `0..1` (isteğe bağlı; varsayılan `0.9`, `[0.05, 1.0]` ile sınırlandırılır)
    - `format`: şu anda `jpg`
    - `delayMs`: sayı (isteğe bağlı; varsayılan `0`, dahili olarak `10000` ile sınırlandırılır)
    - `deviceId`: dize (isteğe bağlı; `camera.list` kaynağından)
  - Yanıt yükü: `format: "jpg"`, `base64`, `width`, `height`.
  - Yük koruması: base64 kodlu yükü 5MB altında tutmak için fotoğraflar yeniden sıkıştırılır.

- `camera.clip`
  - Parametreler:
    - `facing`: `front|back` (varsayılan: `front`)
    - `durationMs`: sayı (varsayılan `3000`, `[250, 60000]` ile sınırlandırılır)
    - `includeAudio`: boole (varsayılan `true`)
    - `format`: şu anda `mp4`
    - `deviceId`: dize (isteğe bağlı; `camera.list` kaynağından)
  - Yanıt yükü: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.

### iOS ön plan gereksinimi

`canvas.*` gibi, iOS Node'u da `camera.*` komutlarına yalnızca **ön planda** izin verir. Arka plan çağrıları `NODE_BACKGROUND_UNAVAILABLE` döndürür.

### CLI yardımcısı

Medya dosyalarını almanın en kolay yolu, kodu çözülmüş medyayı geçici bir dosyaya yazan ve kaydedilen yolu yazdıran CLI yardımcısını kullanmaktır.

```bash
openclaw nodes camera snap --node <id>                 # varsayılan: hem ön hem arka (2 MEDIA satırı)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

`nodes camera snap`, ajana her iki görünümü de sağlamak için hem ön hem de arka kameradan çekim yapan `--facing both` değerini varsayılan olarak kullanır; tek ve açıkça belirtilmiş bir yönle `--device-id` iletin (`--device-id` ayarlandığında `both` reddedilir). Kendi sarmalayıcınızı oluşturmadığınız sürece çıktı dosyaları geçicidir (işletim sisteminin geçici dizininde).

## Android Node'u

### Android kullanıcı ayarı

- Android Settings sayfası → **Camera** → **Allow Camera** (`camera.enabled`).
  - **Yeni kurulumlarda varsayılan olarak kapalıdır.** Bu ayardan önceki mevcut kurulumlar, yükseltmelerin daha önce çalışan kamera erişimini sessizce kaybetmemesi için **açık** durumuna geçirilir.
  - Kapalıyken: `camera.*` komutları `CAMERA_DISABLED: enable Camera in Settings` döndürür.

### İzinler

- `CAMERA`, hem `camera.snap` hem de `camera.clip` için gereklidir; eksik veya reddedilmiş izin `CAMERA_PERMISSION_REQUIRED` döndürür.
- `includeAudio` değeri `true` olduğunda `camera.clip` için `RECORD_AUDIO` gereklidir; eksik veya reddedilmiş izin `MIC_PERMISSION_REQUIRED` döndürür.

Uygulama, mümkün olduğunda çalışma zamanı izinlerini ister.

### Android ön plan gereksinimi

`canvas.*` gibi, Android Node'u da `camera.*` komutlarına yalnızca **ön planda** izin verir. Arka plan çağrıları `NODE_BACKGROUND_UNAVAILABLE: command requires foreground` döndürür.

### Android komutları (Gateway `node.invoke` aracılığıyla)

- `camera.list`
  - Yanıt yükü: `devices` — `{ id, name, position, deviceType }` dizisi.

- `camera.snap`
  - Parametreler: `facing` (`front|back`, varsayılan `front`), `quality` (varsayılan `0.95`, `[0.1, 1.0]` ile sınırlandırılır), `maxWidth` (varsayılan `1600`), `deviceId` (isteğe bağlı; bilinmeyen kimlik `INVALID_REQUEST` ile başarısız olur).
  - Yanıt yükü: `format: "jpg"`, `base64`, `width`, `height`.
  - Yük koruması: base64 verisini 5MB altında tutmak için yeniden sıkıştırılır (iOS ile aynı bütçe).

- `camera.clip`
  - Parametreler: `facing` (varsayılan `front`), `durationMs` (varsayılan `3000`, `[200, 60000]` ile sınırlandırılır), `includeAudio` (varsayılan `true`), `deviceId` (isteğe bağlı).
  - Yanıt yükü: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.
  - Yük koruması: ham MP4, base64 kodlamasından önce 18MB ile sınırlandırılır; aşırı büyük klipler `PAYLOAD_TOO_LARGE` ile başarısız olur (`durationMs` değerini düşürüp yeniden deneyin).

## macOS uygulaması

### macOS kullanıcı ayarı

macOS eşlikçi uygulaması bir onay kutusu sunar:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`).
  - Varsayılan: **kapalı**.
  - Kapalıyken: kamera istekleri `CAMERA_DISABLED: enable Camera in Settings` döndürür.

### CLI yardımcısı (Node çağrısı)

macOS Node'unda kamera komutlarını çağırmak için ana `openclaw` CLI'sini kullanın.

```bash
openclaw nodes camera list --node <id>                     # kamera kimliklerini listeler
openclaw nodes camera snap --node <id>                     # kaydedilen yolu yazdırır
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # kaydedilen yolu yazdırır
openclaw nodes camera clip --node <id> --duration-ms 3000   # kaydedilen yolu yazdırır (eski bayrak)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- Geçersiz kılınmadığı sürece `openclaw nodes camera snap` varsayılan olarak `maxWidth=1600` değerini kullanır.
- `camera.snap`, çekimden önce ısınma/pozlama kararlılığının ardından `delayMs` bekler (varsayılan 2000ms, `[0, 10000]` ile sınırlandırılır).
- Fotoğraf yükleri, base64 verisini 5MB altında tutmak için yeniden sıkıştırılır.

## Linux Node ana makinesi

Birlikte sunulan Linux Node Plugin'i, CLI `openclaw node` hizmetine kamera çekimi ekler. Ekransız bir ana makinede çalışır ve Linux masaüstü uygulamasını gerektirmez.

Kamera erişimi varsayılan olarak kapalıdır. Plugin girdisi altında etkinleştirin, ardından Gateway duyurusunun yeniden oluşturulması için Node hizmetini yeniden başlatın:

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          camera: { enabled: true },
        },
      },
    },
  },
}
```

Gereksinimler:

- V4L2 girişi, `libx264` ve AAC desteği içeren FFmpeg
- Node hizmeti kullanıcısının okuyabildiği bir `/dev/video*` aygıtı; yaygın dağıtımlarda bu kullanıcıyı `video` grubuna ekleyin
- varsayılan `includeAudio: true` ile çekilen klipler için varsayılan kaynağa sahip, çalışan bir PulseAudio sunucusu veya PipeWire PulseAudio uyumluluk katmanı

Linux, `camera.list` kaynağından çekim yapabilen ve okunabilir V4L2 aygıt yollarını döndürür; FFmpeg her `/dev/video*` adayını yoklar ve meta veri veya yalnızca çıktı sunan Node'ları hariç tutar. Aygıt `position`, `unknown` olduğundan `deviceId` belirtilmeyen yön istekleri, ön veya arka kamera olduğunu iddia etmek yerine `unknown` konumunda tek bir fotoğraf veya klip üretir. Bir ana makinede birden fazla kamera varsa `deviceId` kullanın. `camera.snap`, `delayMs` için FFmpeg giriş ısınmasını kullanır ve genişliği sınırlandırırken en-boy oranını korur. `camera.clip`, mikrofon sesini MP4 ses parçası olarak kaydeder; OpenClaw bilinçli olarak bağımsız bir mikrofon komutu sunmaz.

Plugin, MP4 videosu için `libx264` kullanır ve codec'leri sessizce değiştirmez. Gerekli giriş veya kodlayıcıları içermeyen bir FFmpeg derlemesi `CAMERA_UNAVAILABLE` döndürür. 25MB base64 yük bütçesini aşacak fotoğraflar ve klipler `PAYLOAD_TOO_LARGE` ile başarısız olur.

`camera.snap` ve `camera.clip` tehlikeli komutlar olarak kalır. Yalnızca çekimi etkinleştirmeyi amaçladığınızda bunları `gateway.nodes.allowCommands` içine ekleyin; yalnızca Plugin'i etkinleştirmek Gateway politikasını atlamaz.

## Güvenlik ve pratik sınırlar

- Kamera ve mikrofon erişimi, işletim sisteminin olağan izin istemlerini tetikler (ve `Info.plist` içinde kullanım açıklamaları gerektirir).
- Aşırı büyük Node yüklerini (base64 ek yükü ve ileti sınırları) önlemek için video klipler 60s ile sınırlandırılır.

## macOS ekran videosu (işletim sistemi düzeyi)

Kamera yerine _ekran_ videosu için macOS eşlikçisini kullanın:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # kaydedilen yolu yazdırır
```

macOS **Screen Recording** izni (TCC) gerektirir.

## İlgili içerikler

- [Görüntü ve medya desteği](/tr/nodes/images)
- [Medya anlama](/tr/nodes/media-understanding)
- [Konum komutu](/tr/nodes/location-command)
