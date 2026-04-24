---
read_when:
    - Ağ mimarisi + güvenlik genel bakışına ihtiyacınız var
    - Yerel ve tailnet erişimini veya eşleştirmeyi hata ayıklıyorsunuz
    - Ağ belgelerinin standart listesini istiyorsunuz
summary: 'Ağ merkezi: gateway yüzeyleri, eşleştirme, keşif ve güvenlik'
title: Ağ
x-i18n:
    generated_at: "2026-04-24T09:17:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 663f372555f044146a5d381566371e9a38185e7f295243bfd61314f12e3a4f06
    source_path: network.md
    workflow: 15
---

# Ağ merkezi

Bu merkez, OpenClaw'ın localhost, LAN ve tailnet genelinde
cihazları nasıl bağladığına, eşleştirdiğine ve güvence altına aldığına dair temel belgelere bağlantı verir.

## Temel model

Çoğu işlem, kanal bağlantılarına ve WebSocket denetim düzlemine sahip olan
tek uzun ömürlü süreç Gateway (`openclaw gateway`) üzerinden akar.

- **Önce loopback**: Gateway WS varsayılan olarak `ws://127.0.0.1:18789` kullanır.
  Loopback olmayan bind'ler geçerli bir gateway auth yolu gerektirir: paylaşılan gizli
  token/parola auth veya doğru yapılandırılmış loopback olmayan
  `trusted-proxy` dağıtımı.
- **Host başına bir Gateway** önerilir. Yalıtım için yalıtılmış profiller ve portlarla birden çok gateway çalıştırın ([Multiple Gateways](/tr/gateway/multiple-gateways)).
- **Canvas host**, Gateway ile aynı port üzerinde sunulur (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`); loopback ötesinde bind edildiğinde Gateway auth ile korunur.
- **Uzak erişim**, genellikle SSH tüneli veya Tailscale VPN üzerinden yapılır ([Remote Access](/tr/gateway/remote)).

Temel başvurular:

- [Gateway mimarisi](/tr/concepts/architecture)
- [Gateway protokolü](/tr/gateway/protocol)
- [Gateway runbook](/tr/gateway)
- [Web yüzeyleri + bind modları](/tr/web)

## Eşleştirme + kimlik

- [Eşleştirme genel bakışı (DM + Node'lar)](/tr/channels/pairing)
- [Gateway sahipli Node eşleştirmesi](/tr/gateway/pairing)
- [Devices CLI (eşleştirme + token döndürme)](/tr/cli/devices)
- [Pairing CLI (DM onayları)](/tr/cli/pairing)

Yerel güven:

- Doğrudan yerel loopback bağlantıları, aynı host UX'ini akıcı tutmak için eşleştirme açısından otomatik onaylanabilir.
- OpenClaw ayrıca güvenilen paylaşımlı gizli yardımcı akışları için dar bir arka uç/kapsayıcı-yerel kendi kendine bağlanma yoluna sahiptir.
- Aynı host tailnet bind'leri dahil tailnet ve LAN istemcileri yine de açık eşleştirme onayı gerektirir.

## Keşif + aktarımlar

- [Keşif ve aktarımlar](/tr/gateway/discovery)
- [Bonjour / mDNS](/tr/gateway/bonjour)
- [Uzak erişim (SSH)](/tr/gateway/remote)
- [Tailscale](/tr/gateway/tailscale)

## Node'lar + aktarımlar

- [Node genel bakışı](/tr/nodes)
- [Bridge protocol (eski Node'lar, tarihsel)](/tr/gateway/bridge-protocol)
- [Node runbook: iOS](/tr/platforms/ios)
- [Node runbook: Android](/tr/platforms/android)

## Güvenlik

- [Güvenlik genel bakışı](/tr/gateway/security)
- [Gateway yapılandırma başvurusu](/tr/gateway/configuration)
- [Sorun giderme](/tr/gateway/troubleshooting)
- [Doctor](/tr/gateway/doctor)

## İlgili

- [Gateway ağ modeli](/tr/gateway/network-model)
- [Uzak erişim](/tr/gateway/remote)
