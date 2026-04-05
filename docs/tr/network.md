---
read_when:
    - Ağ mimarisi + güvenlik genel görünümüne ihtiyacınız var
    - Yerel ile tailnet erişimi veya eşleştirme sorunlarında hata ayıklıyorsunuz
    - Ağ belgelerinin kanonik listesini istiyorsunuz
summary: 'Ağ merkezi: gateway yüzeyleri, eşleştirme, keşif ve güvenlik'
title: Ağ
x-i18n:
    generated_at: "2026-04-05T13:58:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a5f39d4f40ad19646d372000c85b663770eae412af91e1c175eb27b22208118
    source_path: network.md
    workflow: 15
---

# Ağ merkezi

Bu merkez, OpenClaw'ın localhost, LAN ve tailnet genelinde cihazları nasıl bağladığı, eşleştirdiği ve güvence altına aldığıyla ilgili temel belgelere bağlantı verir.

## Temel model

Çoğu işlem, kanal bağlantılarının ve WebSocket kontrol düzleminin sahibi olan tek, uzun süre çalışan bir süreç olan Gateway (`openclaw gateway`) üzerinden akar.

- **Önce loopback**: Gateway WS varsayılan olarak `ws://127.0.0.1:18789` kullanır.
  Loopback dışı bind'ler geçerli bir gateway auth yolu gerektirir: paylaşılan gizli
  token/password auth veya doğru yapılandırılmış, loopback olmayan bir
  `trusted-proxy` dağıtımı.
- **Ana makine başına bir Gateway** önerilir. Yalıtım için, yalıtılmış profiller ve portlarla birden çok gateway çalıştırın ([Multiple Gateways](/gateway/multiple-gateways)).
- **Canvas host**, Gateway ile aynı portta (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`) sunulur; loopback'in ötesine bağlandığında Gateway auth ile korunur.
- **Uzak erişim** genellikle SSH tüneli veya Tailscale VPN üzerinden yapılır ([Remote Access](/gateway/remote)).

Temel başvurular:

- [Gateway architecture](/concepts/architecture)
- [Gateway protocol](/gateway/protocol)
- [Gateway runbook](/gateway)
- [Web surfaces + bind modes](/web)

## Eşleştirme + kimlik

- [Eşleştirme genel bakışı (DM + node'lar)](/tr/channels/pairing)
- [Gateway sahibi olunan node eşleştirmesi](/gateway/pairing)
- [Devices CLI (eşleştirme + token rotasyonu)](/cli/devices)
- [Pairing CLI (DM onayları)](/cli/pairing)

Yerel güven:

- Doğrudan yerel local loopback bağlantıları, aynı ana makinedeki UX'i sorunsuz tutmak için eşleştirme açısından otomatik onaylanabilir.
- OpenClaw ayrıca güvenilir paylaşılan gizli yardımcı akışları için dar kapsamlı bir backend/container-local self-connect yoluna da sahiptir.
- Aynı ana makinedeki tailnet bind'ları dahil olmak üzere tailnet ve LAN istemcileri yine de açık eşleştirme onayı gerektirir.

## Keşif + taşımalar

- [Keşif ve taşımalar](/gateway/discovery)
- [Bonjour / mDNS](/gateway/bonjour)
- [Uzak erişim (SSH)](/gateway/remote)
- [Tailscale](/gateway/tailscale)

## Node'lar + taşımalar

- [Nodes genel bakışı](/nodes)
- [Bridge protocol (eski node'lar, tarihsel)](/gateway/bridge-protocol)
- [Node runbook: iOS](/platforms/ios)
- [Node runbook: Android](/platforms/android)

## Güvenlik

- [Güvenliğe genel bakış](/gateway/security)
- [Gateway config başvurusu](/gateway/configuration)
- [Sorun giderme](/gateway/troubleshooting)
- [Doctor](/gateway/doctor)
