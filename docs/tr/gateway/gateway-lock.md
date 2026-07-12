---
read_when:
    - Gateway sürecini çalıştırma veya hata ayıklama
    - Tek örnek zorlamasını araştırma
summary: 'Gateway tekil örnek koruması: dosya kilidi ve WebSocket/HTTP bağlama'
title: Gateway kilidi
x-i18n:
    generated_at: "2026-07-12T12:18:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c3ba4e8c12d6aadd089cb05722444eaa99d4b573553ac52a21c5c91e5ce1c09
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Neden

- Bir ana makinede belirli bir yapılandırma + bağlantı noktası yalnızca tek bir Gateway işlemi tarafından kullanılmalıdır; ek Gateway'leri yalıtılmış profiller ve benzersiz bağlantı noktalarıyla çalıştırın.
- Eski kilit dosyaları bırakmadan çökmelerden/SIGKILL'den sonra çalışmaya devam edin.
- Başka bir Gateway bağlantı noktasını zaten kullanıyorsa anlaşılır bir hatayla hızlıca başarısız olun.

## İki katman

Başlatma, tek örnek sahipliğini sırasıyla iki bağımsız adımda zorunlu kılar:

1. **Dosya kilidi**, durum kilidi dizini altında yapılandırma başına bir kilit dosyası edinir. Kilit edinilirken, eski (çökmüş) bir kilit sahibini algılamak için yapılandırılmış bağlantı noktasında etkin bir dinleyici olup olmadığı yoklanır.
2. **Soket bağlama**, HTTP/WebSocket dinleyicisini (varsayılan `ws://127.0.0.1:18789`) özel bir TCP dinleyicisi olarak bağlar.

Her katman bağımsız olarak başarısız olabilir ve kendi `GatewayLockError` hatasını oluşturur.

### Dosya kilidi

- Kilit dosyası yoksa, kaydedilmiş sahip işlemi artık çalışmıyorsa veya sahibin bağlantı noktası yoklaması etkin bir dinleyici olmadığını gösteriyorsa başlatma kilidi geri alır ve devam eder.
- Kilit etkin olarak tutuluyorsa ve yukarıdakilerin hiçbiri geçerli değilse başlatma, vazgeçmeden önce 5 saniyeye kadar (varsayılan) yeniden dener:

  ```text
  GatewayLockError("gateway already running (pid <pid>); lock timeout after <ms>ms")
  ```

### Soket bağlama

- `EADDRINUSE` durumunda başlatma, yakın zamanda sonlanan bir işlemden sonraki `TIME_WAIT` süresinin geçmesini beklemek için bağlama işlemini 500 ms aralıklarla en fazla 20 kez (toplamda yaklaşık 10 saniye) yeniden dener.
- Yeniden denemelerden sonra bağlantı noktası hâlâ kullanımdaysa:

  ```text
  GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")
  ```

- Diğer bağlama hataları:

  ```text
  GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: <cause>")
  ```

Kapatma sırasında Gateway, HTTP/WebSocket sunucusunu kapatır ve kilit dosyasını kaldırır.

## İşletim notları

- Bağlantı noktası Gateway olmayan farklı bir işlem tarafından kullanılıyorsa hata aynıdır; bağlantı noktasını serbest bırakın veya `openclaw gateway --port <port>` ile başka bir tane seçin.
- Bir hizmet yöneticisi altında, yukarıdaki hatalardan biriyle karşılaşan yeni Gateway işlemi önce mevcut işlemdeki `/healthz` uç noktasını yoklar. Bu işlem sağlıklıysa yeni işlem başarısız olmak yerine denetimi ona bırakır. systemd'de `78` koduyla çıkar; birimin `RestartPreventExitStatus=78` ayarı, `Restart=always` seçeneğinin bir kilit veya `EADDRINUSE` çakışması nedeniyle döngüye girmesini önler. Mevcut işlem hiçbir zaman sağlıklı duruma gelmezse sağlık yoklamasının yeniden deneme süresi sınırlıdır ve başlatma, sonsuza kadar döngüye girmek yerine yukarıdaki kilit hatasıyla başarısız olur.
- macOS uygulaması Gateway'i başlatmadan önce kendi hafif PID korumasını kullanır; yukarıdaki dosya kilidi ve soket bağlama, gerçek çalışma zamanı zorlamasını sağlar.

## İlgili

- [Birden Fazla Gateway](/tr/gateway/multiple-gateways) - benzersiz bağlantı noktalarıyla birden fazla örnek çalıştırma
- [Sorun Giderme](/tr/gateway/troubleshooting) - `EADDRINUSE` ve bağlantı noktası çakışmalarını tanılama
