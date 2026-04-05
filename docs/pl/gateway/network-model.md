---
read_when:
    - Chcesz zobaczyć zwięzły przegląd modelu sieciowego Gateway
summary: Jak łączą się Gateway, nody i canvas host.
title: Model sieci
x-i18n:
    generated_at: "2026-04-05T13:53:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d02d87f38ee5a9fae228f5028892b192c50b473ab4441bbe0b40ee85a1dd402
    source_path: gateway/network-model.md
    workflow: 15
---

# Model sieci

> Ta treść została scalona z [Network](/network#core-model). Aktualny przewodnik znajdziesz na tej stronie.

Większość operacji przechodzi przez Gateway (`openclaw gateway`), pojedynczy długotrwały
proces, który zarządza połączeniami kanałów i płaszczyzną sterowania WebSocket.

## Główne zasady

- Zalecany jest jeden Gateway na hosta. Jest to jedyny proces, który może zarządzać sesją WhatsApp Web. Dla botów ratunkowych lub ścisłej izolacji uruchamiaj wiele gateway z odizolowanymi profilami i portami. Zobacz [Multiple gateways](/gateway/multiple-gateways).
- Najpierw loopback: WebSocket Gateway domyślnie używa `ws://127.0.0.1:18789`. Kreator domyślnie tworzy uwierzytelnianie wspólnym sekretem i zwykle generuje token nawet dla loopback. Dla dostępu spoza loopback użyj prawidłowej ścieżki uwierzytelniania gateway: uwierzytelnianie tokenem/hasłem ze wspólnym sekretem albo poprawnie skonfigurowanego wdrożenia `trusted-proxy` spoza loopback. Konfiguracje tailnet/mobile zwykle działają najlepiej przez Tailscale Serve lub inny punkt końcowy `wss://`, a nie surowe `ws://` tailnet.
- Nody łączą się z WebSocket Gateway przez LAN, tailnet lub SSH w zależności od potrzeb. Starszy
  most TCP został usunięty.
- Canvas host jest serwowany przez serwer HTTP Gateway na **tym samym porcie** co Gateway (domyślnie `18789`):
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    Gdy `gateway.auth` jest skonfigurowane, a Gateway jest zbindowany poza loopback, te trasy są chronione przez uwierzytelnianie Gateway. Klienci node używają URL-i zakresu możliwości node powiązanych z ich aktywną sesją WS. Zobacz [Konfiguracja gateway](/gateway/configuration) (`canvasHost`, `gateway`).
- Zdalne użycie to zwykle tunel SSH albo VPN tailnet. Zobacz [Dostęp zdalny](/gateway/remote) i [Discovery](/gateway/discovery).
