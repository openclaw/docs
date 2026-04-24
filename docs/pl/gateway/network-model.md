---
read_when:
    - Chcesz zwięzłego przeglądu modelu sieciowego Gateway
summary: Jak łączą się Gateway, Nodes i host canvas.
title: Model sieciowy
x-i18n:
    generated_at: "2026-04-24T09:10:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68637b72c4b3a6110556909da9a454e4be480fe2f3b42b09d054949c1104a62c
    source_path: gateway/network-model.md
    workflow: 15
---

> Ta treść została scalona do [Network](/pl/network#core-model). Zobacz tę stronę, aby zapoznać się z aktualnym przewodnikiem.

Większość operacji przechodzi przez Gateway (`openclaw gateway`), pojedynczy długotrwały
proces, który zarządza połączeniami kanałów i płaszczyzną sterowania WebSocket.

## Główne zasady

- Zalecany jest jeden Gateway na hosta. To jedyny proces, któremu wolno posiadać sesję WhatsApp Web. W przypadku botów ratunkowych lub ścisłej izolacji uruchamiaj wiele gateway z odizolowanymi profilami i portami. Zobacz [Multiple gateways](/pl/gateway/multiple-gateways).
- Najpierw loopback: Gateway WS ma domyślnie `ws://127.0.0.1:18789`. Kreator domyślnie tworzy uwierzytelnianie wspólnym sekretem i zwykle generuje token, nawet dla loopback. Dla dostępu spoza loopback użyj prawidłowej ścieżki uwierzytelniania gateway: wspólny sekret z uwierzytelnianiem tokenem/hasłem lub poprawnie skonfigurowanego wdrożenia `trusted-proxy` poza loopback. Konfiguracje tailnet/mobile zwykle działają najlepiej przez Tailscale Serve lub inny endpoint `wss://`, a nie surowe tailnet `ws://`.
- Nodes łączą się z Gateway WS przez LAN, tailnet lub SSH, zależnie od potrzeb. Starszy
  most TCP został usunięty.
- Host canvas jest serwowany przez serwer HTTP Gateway na **tym samym porcie** co Gateway (domyślnie `18789`):
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    Gdy skonfigurowano `gateway.auth`, a Gateway nasłuchuje poza loopback, te trasy są chronione przez uwierzytelnianie Gateway. Klienci Node używają URL-i możliwości o zakresie Node powiązanych z ich aktywną sesją WS. Zobacz [Gateway configuration](/pl/gateway/configuration) (`canvasHost`, `gateway`).
- Zdalne użycie to zazwyczaj tunel SSH lub VPN tailnet. Zobacz [Remote access](/pl/gateway/remote) oraz [Discovery](/pl/gateway/discovery).

## Powiązane

- [Remote access](/pl/gateway/remote)
- [Trusted proxy auth](/pl/gateway/trusted-proxy-auth)
- [Gateway protocol](/pl/gateway/protocol)
