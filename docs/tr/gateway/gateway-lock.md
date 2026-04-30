---
read_when:
    - Gateway sürecini çalıştırma veya hata ayıklama
    - Tek örnek çalıştırma zorunluluğu inceleniyor
summary: WebSocket dinleyici bağlamasını kullanan Gateway tekil örnek koruması
title: Gateway kilidi
x-i18n:
    generated_at: "2026-04-30T09:21:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe61ff81106554e98de1ca04c213b76d230265cdf3e81b70897d2de00f6a0179
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Neden

- Aynı host üzerinde temel port başına yalnızca bir Gateway örneğinin çalışmasını sağlayın; ek Gateway’ler yalıtılmış profiller ve benzersiz portlar kullanmalıdır.
- Çökmelerden/SIGKILL’den sonra eski kilit dosyaları bırakmadan toparlanın.
- Kontrol portu zaten kullanılıyorsa net bir hatayla hızlıca başarısız olun.

## Mekanizma

- Gateway önce durum kilidi dizini altında yapılandırma başına bir kilit dosyası alır ve yapılandırılmış portu mevcut bir dinleyici için yoklar.
- Kaydedilen kilit sahibi yoksa, port boşsa veya kilit eskiyse, başlatma kilidi geri alır ve devam eder.
- Gateway ardından özel bir TCP dinleyicisi kullanarak HTTP/WebSocket dinleyicisini (varsayılan `ws://127.0.0.1:18789`) bağlar.
- Bağlama `EADDRINUSE` ile başarısız olursa, başlatma `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")` fırlatır.
- Kapatma sırasında Gateway HTTP/WebSocket sunucusunu kapatır ve kilit dosyasını kaldırır.

## Hata yüzeyi

- Portu başka bir süreç tutuyorsa, başlatma `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")` fırlatır.
- Diğer bağlama hataları `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")` olarak görünür.

## Operasyonel notlar

- Port _başka_ bir süreç tarafından kullanılıyorsa hata aynıdır; portu boşaltın veya `openclaw gateway --port <port>` ile başka bir port seçin.
- Bir hizmet yöneticisi altında, mevcut sağlıklı bir `/healthz` yanıtlayıcısı gören yeni bir Gateway süreci başarıyla çıkar ve kontrolü o süreçte bırakır. Mevcut süreç hiçbir zaman sağlıklı hale gelmezse, yeniden denemeler sınırlanır ve başlatma sonsuza kadar döngüye girmek yerine net bir kilit hatasıyla başarısız olur.
- macOS uygulaması, Gateway’i başlatmadan önce hâlâ kendi hafif PID korumasını sürdürür; çalışma zamanı kilidi, kilit dosyası artı HTTP/WebSocket bağlama ile uygulanır.

## İlgili

- [Birden Fazla Gateway](/tr/gateway/multiple-gateways) — benzersiz portlarla birden fazla örnek çalıştırma
- [Sorun Giderme](/tr/gateway/troubleshooting) — `EADDRINUSE` ve port çakışmalarını tanılama
