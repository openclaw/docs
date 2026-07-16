---
read_when:
    - Gateway sürecini çalıştırma veya hata ayıklama
    - Tek örnek zorunluluğunun araştırılması
summary: 'Gateway tekil örnek koruması: dosya kilidi ile WebSocket/HTTP bağlama noktası'
title: Gateway kilidi
x-i18n:
    generated_at: "2026-07-16T17:07:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f5ac6d42c437b481c68a23a0aa4c00aeac9131acd76f3516ce3e949f325e265b
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Neden

- Bir durum dizininin sahibi yalnızca tek bir gateway işlemi olmalıdır; ek gateway'leri yalıtılmış profiller, durum dizinleri, yapılandırmalar ve bağlantı noktalarıyla çalıştırın.
- Eski kilit dosyaları bırakmadan çökmelerden/SIGKILL'den kurtulun.
- Başka bir gateway bağlantı noktasının zaten sahibiyse açık bir hatayla hızla başarısız olun.

## Üç katman

Başlatma, sahipliği sırasıyla üç adımda zorunlu kılar:

1. **Durum sahipliği kilidi**, standartlaştırılmış durum dizinine göre anahtarlanmış bir kilit alır. `OPENCLAW_ALLOW_MULTI_GATEWAY=1` ile başlatılan Gateway'ler dâhil olmak üzere her Gateway buna katılır; böylece yıkıcı SQLite bakımı, çalışan bir sahiple yarış durumuna giremez.
2. **Yapılandırma kilidi**, geçmişten gelen yapılandırma başına kilidi alır ve çalışma zamanı bağlantı noktasını kaydeder. Çoklu Gateway modu bu tekil yapılandırma kısıtlamasını atlar ancak durum sahipliği kilidini korur.
3. **Soket bağlama**, HTTP/WebSocket dinleyicisini (varsayılan `ws://127.0.0.1:18789`) özel bir TCP dinleyicisi olarak bağlar.

Her katman bağımsız olarak başarısız olabilir ve kendi `GatewayLockError` hatasını oluşturur.

### Durum ve yapılandırma kilitleri

- Kilidin etkinliği; kaydedilen PID'den, mevcut olduğunda platform işlem başlangıç kimliğinden ve Gateway işlem kimliğinden belirlenir. Doğrulanmış bir sahip, bağlantı noktası dinlemeye başlamadan önceki başlatma sürecinde yetkili olmaya devam eder.
- Özel bir SQLite koordinatörü; meta veri incelemesini, eski sahipliğin geri alınmasını ve kilidin değiştirilmesini sıralı hâle getirir. Özel işlemi, sahibi olan işlem çökerse otomatik olarak serbest bırakılır.
- Bir kilit dosyası yoksa veya kaydedilen sahip işlemi sonlanmışsa başlatma kilidi geri alır ve devam eder.
- Kilitlerden biri etkin biçimde tutuluyorsa başlatma, vazgeçmeden önce 5 saniyeye kadar (varsayılan) yeniden dener:

  ```text
  GatewayLockError("gateway zaten çalışıyor (pid <pid>); <ms>ms sonra kilit zaman aşımına uğradı")
  ```

### Soket bağlama

- `EADDRINUSE` durumunda başlatma, kısa süre önce sonlanan bir işlemden sonraki `TIME_WAIT` penceresini atlatmak için bağlamayı 500ms aralıklarla en fazla 20 kez (toplamda yaklaşık 10 saniye) yeniden dener.
- Yeniden denemelerden sonra bağlantı noktası hâlâ kullanımdaysa:

  ```text
  GatewayLockError("başka bir gateway örneği zaten ws://127.0.0.1:<port> üzerinde dinliyor")
  ```

- Diğer bağlama hataları:

  ```text
  GatewayLockError("gateway soketi ws://127.0.0.1:<port> üzerinde bağlanamadı: <cause>")
  ```

Kapatma sırasında gateway, HTTP/WebSocket sunucusunu kapatır ve durum
ile yapılandırma kilit dosyalarını kaldırır.

## İşletim notları

- Bağlantı noktası gateway olmayan farklı bir işlem tarafından kullanılıyorsa hata aynıdır; bağlantı noktasını boşaltın veya `openclaw gateway --port <port>` ile başka bir tane seçin.
- `OPENCLAW_ALLOW_MULTI_GATEWAY=1`, paylaşılan değiştirilebilir duruma değil, birden fazla yapılandırma/çalışma zamanı örneğine izin verir. Her örnek yine de benzersiz bir `OPENCLAW_STATE_DIR` gerektirir.
- Bir hizmet denetleyicisi altında, yukarıdaki hatalardan biriyle karşılaşan yeni bir gateway işlemi önce mevcut işlemdeki `/healthz` öğesini yoklar. Bu işlem sağlıklıysa yeni işlem başarısız olmak yerine denetimi ona bırakır. systemd'de `78` koduyla çıkar; birimin `RestartPreventExitStatus=78` ayarı, `Restart=always` öğesinin bir kilit veya `EADDRINUSE` çakışması nedeniyle döngüye girmesini engeller. Mevcut işlem hiçbir zaman sağlıklı duruma gelmezse sistem durumu yoklamasının yeniden deneme süresi sınırlıdır ve başlatma, sonsuza kadar döngüye girmek yerine yukarıdaki kilit hatasıyla başarısız olur.
- macOS uygulaması, gateway'i başlatmadan önce kendi hafif PID korumasını uygular; yukarıdaki dosya kilidi ve soket bağlama, gerçek çalışma zamanı zorlamasıdır.

## İlgili

- [Birden Fazla Gateway](/tr/gateway/multiple-gateways) - benzersiz bağlantı noktalarıyla birden fazla örnek çalıştırma
- [Sorun Giderme](/tr/gateway/troubleshooting) - `EADDRINUSE` ve bağlantı noktası çakışmalarını tanılama
