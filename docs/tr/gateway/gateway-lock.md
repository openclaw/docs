---
read_when:
    - Gateway işlemini çalıştırma veya hata ayıklama
    - Tek örnek zorlamasını araştırma
summary: WebSocket dinleyici bağlamasını kullanan Gateway tekil örnek koruması
title: Gateway kilidi
x-i18n:
    generated_at: "2026-04-30T16:29:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85a1cb55f08d47d36fde25900e4247ef01c9a6800bf017fbff44a337f299ce13
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Neden

- Aynı ana makinede aynı temel bağlantı noktası için yalnızca bir Gateway örneğinin çalışmasını sağlayın; ek Gateway'ler izole profiller ve benzersiz bağlantı noktaları kullanmalıdır.
- Çökme/SIGKILL durumlarından eski kilit dosyaları bırakmadan kurtulun.
- Denetim bağlantı noktası zaten kullanılıyorsa net bir hatayla hızlıca başarısız olun.

## Mekanizma

- Gateway önce durum kilidi dizini altında yapılandırma başına bir kilit dosyası edinir ve yapılandırılmış bağlantı noktasında mevcut bir dinleyici olup olmadığını yoklar.
- Kaydedilen kilit sahibi artık yoksa, bağlantı noktası boşsa veya kilit bayatsa, başlatma kilidi geri alır ve devam eder.
- Gateway ardından özel bir TCP dinleyicisi kullanarak HTTP/WebSocket dinleyicisini bağlar (varsayılan `ws://127.0.0.1:18789`).
- Bağlama `EADDRINUSE` ile başarısız olursa başlatma `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")` hatası fırlatır.
- Kapatma sırasında Gateway HTTP/WebSocket sunucusunu kapatır ve kilit dosyasını kaldırır.

## Hata yüzeyi

- Başka bir süreç bağlantı noktasını tutuyorsa başlatma `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")` hatası fırlatır.
- Diğer bağlama hataları `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")` olarak görünür.

## Operasyonel notlar

- Bağlantı noktası _başka_ bir süreç tarafından kullanılıyorsa hata aynıdır; bağlantı noktasını boşa çıkarın veya `openclaw gateway --port <port>` ile başka bir tane seçin.
- Bir hizmet denetleyicisi altında, mevcut sağlıklı bir `/healthz` yanıtlayıcısı gören yeni Gateway süreci denetimi o süreçte bırakır. systemd üzerinde, yinelenen başlatıcı 78 koduyla çıkar; böylece varsayılan `RestartPreventExitStatus=78`, `Restart=always` ayarının bir kilit veya `EADDRINUSE` çakışmasında döngüye girmesini durdurur. Mevcut süreç hiçbir zaman sağlıklı hale gelmezse yeniden denemeler sınırlandırılır ve başlatma sonsuza kadar döngüye girmek yerine net bir kilit hatasıyla başarısız olur.
- macOS uygulaması, Gateway'i başlatmadan önce kendi hafif PID korumasını hâlâ sürdürür; çalışma zamanı kilidi, kilit dosyası ve HTTP/WebSocket bağlamasıyla uygulanır.

## İlgili

- [Birden Fazla Gateway](/tr/gateway/multiple-gateways) — benzersiz bağlantı noktalarıyla birden fazla örnek çalıştırma
- [Sorun Giderme](/tr/gateway/troubleshooting) — `EADDRINUSE` ve bağlantı noktası çakışmalarını tanılama
