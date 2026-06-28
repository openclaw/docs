---
read_when:
    - Potrzebujesz omówienia architektury sieci i bezpieczeństwa
    - Diagnozujesz dostęp lokalny, dostęp przez tailnet lub parowanie
    - Chcesz kanoniczną listę dokumentacji dotyczącej sieci
summary: 'Centrum sieciowe: powierzchnie Gateway, parowanie, wykrywanie i zabezpieczenia'
title: Sieć
x-i18n:
    generated_at: "2026-05-06T09:19:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b0ff6c4ee46005aeac1612ea40f1ce3d5824aa507d0842788dbf4bffbaccfcc
    source_path: network.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Ten hub łączy podstawowe dokumenty dotyczące tego, jak OpenClaw łączy, paruje i zabezpiecza
urządzenia w localhost, LAN i tailnet.

## Model podstawowy

Większość operacji przechodzi przez Gateway (`openclaw gateway`), pojedynczy długotrwały proces, który zarządza połączeniami kanałów i płaszczyzną sterowania WebSocket.

- **Najpierw loopback**: Gateway WS domyślnie używa `ws://127.0.0.1:18789`.
  Bindowanie poza loopback wymaga prawidłowej ścieżki uwierzytelniania Gateway: uwierzytelniania
  współdzielonym sekretem token/hasło albo poprawnie skonfigurowanego wdrożenia
  `trusted-proxy` poza loopback.
- **Zalecany jest jeden Gateway na host**. W celu izolacji uruchom wiele gatewayów z odizolowanymi profilami i portami ([Wiele Gatewayów](/pl/gateway/multiple-gateways)).
- **Host Canvas** jest serwowany na tym samym porcie co Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), chroniony przez uwierzytelnianie Gateway, gdy jest zbindowany poza loopback.
- **Dostęp zdalny** to zwykle tunel SSH lub VPN Tailscale ([Dostęp zdalny](/pl/gateway/remote)).

Kluczowe odnośniki:

- [Architektura Gateway](/pl/concepts/architecture)
- [Protokół Gateway](/pl/gateway/protocol)
- [Runbook Gateway](/pl/gateway)
- [Powierzchnie webowe + tryby bindowania](/pl/web)

## Parowanie + tożsamość

- [Przegląd parowania (DM + węzły)](/pl/channels/pairing)
- [Parowanie węzłów zarządzane przez Gateway](/pl/gateway/pairing)
- [CLI urządzeń (parowanie + rotacja tokenów)](/pl/cli/devices)
- [CLI parowania (zatwierdzenia DM)](/pl/cli/pairing)

Zaufanie lokalne:

- Bezpośrednie połączenia local loopback mogą być automatycznie zatwierdzane do parowania, aby zachować
  płynne UX na tym samym hoście.
- OpenClaw ma także wąską ścieżkę samopołączenia backendu/kontenera lokalnego dla
  zaufanych przepływów pomocniczych ze współdzielonym sekretem.
- Klienci tailnet i LAN, w tym bindowania tailnet na tym samym hoście, nadal wymagają
  jawnego zatwierdzenia parowania.

## Wykrywanie + transporty

- [Wykrywanie i transporty](/pl/gateway/discovery)
- [Bonjour / mDNS](/pl/gateway/bonjour)
- [Dostęp zdalny (SSH)](/pl/gateway/remote)
- [Tailscale](/pl/gateway/tailscale)

## Węzły + transporty

- [Przegląd węzłów](/pl/nodes)
- [Protokół mostu (starsze węzły, historyczny)](/pl/gateway/bridge-protocol)
- [Runbook węzła: iOS](/pl/platforms/ios)
- [Runbook węzła: Android](/pl/platforms/android)

## Bezpieczeństwo

- [Przegląd bezpieczeństwa](/pl/gateway/security)
- [Dokumentacja konfiguracji Gateway](/pl/gateway/configuration)
- [Rozwiązywanie problemów](/pl/gateway/troubleshooting)
- [Doctor](/pl/gateway/doctor)

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Dostęp zdalny](/pl/gateway/remote)
