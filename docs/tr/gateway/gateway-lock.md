---
read_when:
    - Gateway sürecini çalıştırırken veya hata ayıklarken
    - Tek örnek zorlamasını araştırırken
summary: WebSocket dinleyici bind'i kullanan Gateway singleton koruması
title: Gateway Kilidi
x-i18n:
    generated_at: "2026-04-05T13:52:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 726c687ab53f2dd1e46afed8fc791b55310a5c1e62f79a0e38a7dc4ca7576093
    source_path: gateway/gateway-lock.md
    workflow: 15
---

# Gateway kilidi

## Neden

- Aynı ana bilgisayarda temel port başına yalnızca bir gateway örneğinin çalışmasını sağlamak; ek gateway'ler yalıtılmış profiller ve benzersiz portlar kullanmalıdır.
- Eski lock dosyaları bırakmadan çökme/SIGKILL durumlarından sağ çıkmak.
- Denetim portu zaten doluysa açık bir hatayla hızlıca başarısız olmak.

## Mekanizma

- Gateway, başlangıçta özel bir TCP dinleyicisi kullanarak WebSocket dinleyicisini (varsayılan `ws://127.0.0.1:18789`) hemen bind eder.
- Bind işlemi `EADDRINUSE` ile başarısız olursa başlangıç `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")` hatasını verir.
- İşletim sistemi, çökmeler ve SIGKILL dahil her süreç çıkışında dinleyiciyi otomatik olarak serbest bırakır — ayrı bir lock dosyasına veya temizleme adımına gerek yoktur.
- Kapatma sırasında gateway, portu hızlıca serbest bırakmak için WebSocket sunucusunu ve alttaki HTTP sunucusunu kapatır.

## Hata yüzeyi

- Port başka bir süreç tarafından tutuluyorsa başlangıç `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")` hatasını verir.
- Diğer bind başarısızlıkları `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")` olarak yüzeye çıkar.

## Operasyon notları

- Port _başka_ bir süreç tarafından kullanılıyorsa hata aynıdır; portu boşaltın veya `openclaw gateway --port <port>` ile başka bir port seçin.
- macOS uygulaması, gateway'i başlatmadan önce hâlâ kendi hafif PID korumasını sürdürür; çalışma zamanı kilidi WebSocket bind'i tarafından uygulanır.

## İlgili

- [Birden Fazla Gateway](/gateway/multiple-gateways) — benzersiz portlarla birden fazla örnek çalıştırma
- [Sorun giderme](/gateway/troubleshooting) — `EADDRINUSE` ve port çakışmalarını tanılama
