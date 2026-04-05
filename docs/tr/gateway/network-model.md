---
read_when:
    - Gateway ağ modelinin kısa bir görünümünü istiyorsunuz
summary: Gateway, düğümler ve canvas host'un nasıl bağlandığı.
title: Ağ modeli
x-i18n:
    generated_at: "2026-04-05T13:53:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d02d87f38ee5a9fae228f5028892b192c50b473ab4441bbe0b40ee85a1dd402
    source_path: gateway/network-model.md
    workflow: 15
---

# Ağ Modeli

> Bu içerik [Network](/network#core-model) sayfasına birleştirildi. Güncel kılavuz için o sayfaya bakın.

Çoğu işlem, kanal bağlantılarını ve WebSocket kontrol düzlemini yöneten,
uzun süre çalışan tek bir süreç olan Gateway (`openclaw gateway`) üzerinden akar.

## Temel kurallar

- Ana makine başına bir Gateway önerilir. WhatsApp Web oturumuna sahip olmasına izin verilen tek süreç budur. Kurtarma botları veya sıkı yalıtım için, yalıtılmış profiller ve portlarla birden fazla gateway çalıştırın. Bkz. [Birden fazla gateway](/gateway/multiple-gateways).
- Önce loopback: Gateway WS varsayılan olarak `ws://127.0.0.1:18789` kullanır. Sihirbaz varsayılan olarak paylaşılan gizli kimlik doğrulaması oluşturur ve genellikle loopback için bile bir belirteç üretir. Loopback dışı erişim için geçerli bir gateway auth yolu kullanın: paylaşılan gizli belirteç/parola kimlik doğrulaması veya doğru yapılandırılmış loopback dışı bir `trusted-proxy` dağıtımı. Tailnet/mobil kurulumlar genellikle ham tailnet `ws://` yerine Tailscale Serve veya başka bir `wss://` uç noktası üzerinden daha iyi çalışır.
- Düğümler gerektiğinde LAN, tailnet veya SSH üzerinden Gateway WS'ye bağlanır. Eski TCP bridge kaldırılmıştır.
- Canvas host, Gateway HTTP sunucusu tarafından Gateway ile **aynı portta** sunulur (varsayılan `18789`):
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    `gateway.auth` yapılandırıldığında ve Gateway loopback ötesine bağlandığında, bu rotalar Gateway auth ile korunur. Düğüm istemcileri, etkin WS oturumlarına bağlı düğüm kapsamlı yetenek URL'lerini kullanır. Bkz. [Gateway yapılandırması](/gateway/configuration) (`canvasHost`, `gateway`).
- Uzak kullanım genellikle SSH tüneli veya tailnet VPN ile yapılır. Bkz. [Uzak erişim](/gateway/remote) ve [Discovery](/gateway/discovery).
