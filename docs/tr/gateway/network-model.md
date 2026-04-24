---
read_when:
    - Gateway ağ modeline kısa bir bakış istiyorsunuz
summary: Gateway, Node'lar ve canvas host'un nasıl bağlandığı.
title: Ağ modeli
x-i18n:
    generated_at: "2026-04-24T09:10:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68637b72c4b3a6110556909da9a454e4be480fe2f3b42b09d054949c1104a62c
    source_path: gateway/network-model.md
    workflow: 15
---

> Bu içerik [Ağ](/tr/network#core-model) sayfasına birleştirildi. Geçerli kılavuz için o sayfaya bakın.

Çoğu işlem, kanal bağlantılarının ve WebSocket denetim düzleminin sahibi olan
tek ve uzun ömürlü bir süreç olan Gateway (`openclaw gateway`) üzerinden akar.

## Çekirdek kurallar

- Ana makine başına bir Gateway önerilir. WhatsApp Web oturumunun sahibi olmaya izin verilen tek süreç odur. Kurtarma botları veya katı yalıtım için, yalıtılmış profiller ve portlarla birden fazla gateway çalıştırın. Bkz. [Birden fazla gateway](/tr/gateway/multiple-gateways).
- Önce loopback: Gateway WS varsayılan olarak `ws://127.0.0.1:18789` kullanır. Sihirbaz varsayılan olarak paylaşılan gizli anahtar kimlik doğrulaması oluşturur ve genellikle loopback için bile bir belirteç üretir. Loopback dışı erişim için geçerli bir gateway kimlik doğrulama yolu kullanın: paylaşılan gizli anahtar belirteç/parola kimlik doğrulaması veya doğru yapılandırılmış loopback dışı `trusted-proxy` dağıtımı. Tailnet/mobil kurulumlar genellikle ham tailnet `ws://` yerine Tailscale Serve veya başka bir `wss://` uç noktası üzerinden daha iyi çalışır.
- Node'lar gerektiğinde Gateway WS'ye LAN, tailnet veya SSH üzerinden bağlanır. Eski TCP köprüsü kaldırılmıştır.
- Canvas host, Gateway HTTP sunucusu tarafından Gateway ile **aynı portta** sunulur (varsayılan `18789`):
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    `gateway.auth` yapılandırıldığında ve Gateway loopback dışına bağlandığında, bu rotalar Gateway kimlik doğrulamasıyla korunur. Node istemcileri, etkin WS oturumlarına bağlı Node kapsamlı yetenek URL'leri kullanır. Bkz. [Gateway yapılandırması](/tr/gateway/configuration) (`canvasHost`, `gateway`).
- Uzak kullanım genellikle SSH tüneli veya tailnet VPN ile yapılır. Bkz. [Uzak erişim](/tr/gateway/remote) ve [Keşif](/tr/gateway/discovery).

## İlgili

- [Uzak erişim](/tr/gateway/remote)
- [Trusted proxy auth](/tr/gateway/trusted-proxy-auth)
- [Gateway protokolü](/tr/gateway/protocol)
