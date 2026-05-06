---
read_when:
    - Ağ mimarisi + güvenlik genel bakışına ihtiyacınız var
    - Yerel erişim ile tailnet erişimi veya eşleştirme sorunlarını gideriyorsunuz
    - Ağ belgelerinin kanonik listesini istiyorsunuz
summary: 'Ağ merkezi: Gateway yüzeyleri, eşleştirme, keşif ve güvenlik'
title: Ağ
x-i18n:
    generated_at: "2026-05-06T09:20:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b0ff6c4ee46005aeac1612ea40f1ce3d5824aa507d0842788dbf4bffbaccfcc
    source_path: network.md
    workflow: 16
---

Bu merkez, OpenClaw'ın localhost, LAN ve tailnet genelinde cihazları nasıl bağladığı, eşleştirdiği ve güvenceye aldığıyla ilgili temel dokümanlara bağlantı verir.

## Temel model

Çoğu işlem, kanal bağlantılarının ve WebSocket denetim düzleminin sahibi olan tek ve uzun süre çalışan bir süreç olan Gateway (`openclaw gateway`) üzerinden akar.

- **Önce loopback**: Gateway WS varsayılan olarak `ws://127.0.0.1:18789` kullanır.
  Loopback dışı bind'ler geçerli bir gateway kimlik doğrulama yolu gerektirir: paylaşılan gizli
  token/parola kimlik doğrulaması veya doğru yapılandırılmış loopback dışı
  `trusted-proxy` dağıtımı.
- **Host başına bir Gateway** önerilir. İzolasyon için, izole profiller ve portlarla birden çok gateway çalıştırın ([Birden çok Gateway](/tr/gateway/multiple-gateways)).
- **Canvas host**, Gateway ile aynı portta sunulur (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`) ve loopback dışına bind edildiğinde Gateway kimlik doğrulamasıyla korunur.
- **Uzaktan erişim** genellikle SSH tüneli veya Tailscale VPN'dir ([Uzaktan Erişim](/tr/gateway/remote)).

Temel başvurular:

- [Gateway mimarisi](/tr/concepts/architecture)
- [Gateway protokolü](/tr/gateway/protocol)
- [Gateway runbook'u](/tr/gateway)
- [Web yüzeyleri + bind modları](/tr/web)

## Eşleştirme + kimlik

- [Eşleştirmeye genel bakış (DM + Node'lar)](/tr/channels/pairing)
- [Gateway'in sahip olduğu Node eşleştirmesi](/tr/gateway/pairing)
- [Cihazlar CLI'ı (eşleştirme + token döndürme)](/tr/cli/devices)
- [Eşleştirme CLI'ı (DM onayları)](/tr/cli/pairing)

Yerel güven:

- Doğrudan local loopback bağlantıları, aynı host kullanıcı deneyimini sorunsuz tutmak için eşleştirme amacıyla otomatik onaylanabilir.
- OpenClaw ayrıca güvenilir paylaşılan gizli yardımcı akışları için dar kapsamlı bir backend/konteyner-yerel kendi kendine bağlanma yoluna sahiptir.
- Aynı host tailnet bind'leri dahil tailnet ve LAN istemcileri yine de açık eşleştirme onayı gerektirir.

## Keşif + taşıyıcılar

- [Keşif ve taşıyıcılar](/tr/gateway/discovery)
- [Bonjour / mDNS](/tr/gateway/bonjour)
- [Uzaktan erişim (SSH)](/tr/gateway/remote)
- [Tailscale](/tr/gateway/tailscale)

## Node'lar + taşıyıcılar

- [Node'lara genel bakış](/tr/nodes)
- [Bridge protokolü (eski Node'lar, tarihsel)](/tr/gateway/bridge-protocol)
- [Node runbook'u: iOS](/tr/platforms/ios)
- [Node runbook'u: Android](/tr/platforms/android)

## Güvenlik

- [Güvenliğe genel bakış](/tr/gateway/security)
- [Gateway yapılandırma referansı](/tr/gateway/configuration)
- [Sorun giderme](/tr/gateway/troubleshooting)
- [Doctor](/tr/gateway/doctor)

## İlgili

- [Gateway runbook'u](/tr/gateway)
- [Uzaktan erişim](/tr/gateway/remote)
