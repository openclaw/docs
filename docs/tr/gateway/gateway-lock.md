---
read_when:
    - Gateway sürecini çalıştırma veya hata ayıklama
    - Tek örnek zorlamasını inceleme
summary: WebSocket dinleyici bağlamasını kullanan Gateway singleton koruması
title: Gateway kilidi
x-i18n:
    generated_at: "2026-04-24T09:09:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f52405d1891470592cb2f9328421dc910c15f4fdc4d34d57c1fec8b322c753f
    source_path: gateway/gateway-lock.md
    workflow: 15
---

## Neden

- Aynı ana bilgisayarda temel port başına yalnızca bir Gateway örneğinin çalışmasını sağlamak; ek Gateway'ler yalıtılmış profiller ve benzersiz portlar kullanmalıdır.
- Eski kilit dosyaları bırakmadan çökme/SIGKILL durumlarından sağ çıkmak.
- Denetim portu zaten doluysa açık bir hatayla hızlıca başarısız olmak.

## Mekanizma

- Gateway, başlatma sırasında WebSocket dinleyicisini (varsayılan `ws://127.0.0.1:18789`) özel bir TCP dinleyicisi kullanarak hemen bağlar.
- Bağlama `EADDRINUSE` ile başarısız olursa başlatma `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")` fırlatır.
- İşletim sistemi, çökmeler ve SIGKILL dâhil her süreç çıkışında dinleyiciyi otomatik olarak serbest bırakır—ayrı bir kilit dosyası veya temizleme adımı gerekmez.
- Kapanışta Gateway, portu hızlıca boşaltmak için WebSocket sunucusunu ve alttaki HTTP sunucusunu kapatır.

## Hata yüzeyi

- Portu başka bir süreç tutuyorsa başlatma `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")` fırlatır.
- Diğer bağlama hataları `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")` olarak yüzeye çıkar.

## Operasyonel notlar

- Port başka bir süreç tarafından kullanılıyorsa hata aynıdır; portu boşaltın veya `openclaw gateway --port <port>` ile başka bir port seçin.
- macOS uygulaması, Gateway'i başlatmadan önce hâlâ kendi hafif PID korumasını sürdürür; çalışma zamanı kilidi WebSocket bağlaması tarafından uygulanır.

## İlgili

- [Birden Fazla Gateway](/tr/gateway/multiple-gateways) — benzersiz portlarla birden fazla örnek çalıştırma
- [Sorun giderme](/tr/gateway/troubleshooting) — `EADDRINUSE` ve port çakışmalarını teşhis etme
