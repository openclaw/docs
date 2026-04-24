---
read_when:
    - Potrzebujesz przeglądu architektury sieciowej + bezpieczeństwa
    - Debugujesz dostęp lokalny vs tailnet albo parowanie
    - Chcesz kanoniczną listę dokumentacji sieciowej
summary: 'Centrum sieciowe: powierzchnie Gateway, parowanie, wykrywanie i bezpieczeństwo'
title: Sieć
x-i18n:
    generated_at: "2026-04-24T09:18:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 663f372555f044146a5d381566371e9a38185e7f295243bfd61314f12e3a4f06
    source_path: network.md
    workflow: 15
---

# Centrum sieciowe

To centrum linkuje główną dokumentację opisującą, jak OpenClaw łączy, paruje i zabezpiecza
urządzenia przez localhost, LAN i tailnet.

## Model podstawowy

Większość operacji przepływa przez Gateway (`openclaw gateway`), pojedynczy długotrwale działający proces, który zarządza połączeniami kanałów i płaszczyzną sterowania WebSocket.

- **Najpierw loopback**: Gateway WS domyślnie działa pod `ws://127.0.0.1:18789`.
  Powiązania inne niż loopback wymagają poprawnej ścieżki auth gateway: auth
  tokenem/hasłem opartym na współdzielonym sekrecie lub poprawnie skonfigurowanego
  wdrożenia `trusted-proxy` spoza loopback.
- Zalecany jest **jeden Gateway na host**. Dla izolacji uruchamiaj wiele gateway z izolowanymi profilami i portami ([Wiele Gateway](/pl/gateway/multiple-gateways)).
- **Host canvas** jest serwowany na tym samym porcie co Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), chroniony przez auth Gateway przy bindzie wykraczającym poza loopback.
- **Dostęp zdalny** to zwykle tunel SSH albo Tailscale VPN ([Dostęp zdalny](/pl/gateway/remote)).

Kluczowe dokumentacje:

- [Architektura Gateway](/pl/concepts/architecture)
- [Protokół Gateway](/pl/gateway/protocol)
- [Runbook Gateway](/pl/gateway)
- [Powierzchnie web + tryby bind](/pl/web)

## Parowanie + tożsamość

- [Przegląd parowania (DM + Node)](/pl/channels/pairing)
- [Parowanie Node zarządzane przez Gateway](/pl/gateway/pairing)
- [CLI devices (parowanie + rotacja tokenów)](/pl/cli/devices)
- [CLI pairing (zatwierdzanie DM)](/pl/cli/pairing)

Zaufanie lokalne:

- Bezpośrednie lokalne połączenia loopback mogą być automatycznie zatwierdzane do parowania, aby
  zapewnić płynny UX na tym samym hoście.
- OpenClaw ma też wąską ścieżkę lokalnego samopołączenia backend/kontener dla
  zaufanych przepływów pomocniczych ze współdzielonym sekretem.
- Klienci tailnet i LAN, w tym bindy tailnet na tym samym hoście, nadal wymagają
  jawnego zatwierdzenia parowania.

## Wykrywanie + transporty

- [Wykrywanie i transporty](/pl/gateway/discovery)
- [Bonjour / mDNS](/pl/gateway/bonjour)
- [Dostęp zdalny (SSH)](/pl/gateway/remote)
- [Tailscale](/pl/gateway/tailscale)

## Node + transporty

- [Przegląd Node](/pl/nodes)
- [Protokół bridge (legacy Node, historyczne)](/pl/gateway/bridge-protocol)
- [Runbook Node: iOS](/pl/platforms/ios)
- [Runbook Node: Android](/pl/platforms/android)

## Bezpieczeństwo

- [Przegląd bezpieczeństwa](/pl/gateway/security)
- [Dokumentacja konfiguracji Gateway](/pl/gateway/configuration)
- [Rozwiązywanie problemów](/pl/gateway/troubleshooting)
- [Doctor](/pl/gateway/doctor)

## Powiązane

- [Model sieci Gateway](/pl/gateway/network-model)
- [Dostęp zdalny](/pl/gateway/remote)
