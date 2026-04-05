---
read_when:
    - Potrzebujesz przeglądu architektury sieci i bezpieczeństwa
    - Debugujesz dostęp lokalny vs tailnet albo parowanie
    - Chcesz kanonicznej listy dokumentów sieciowych
summary: 'Hub sieciowy: powierzchnie gateway, parowanie, wykrywanie i bezpieczeństwo'
title: Sieć
x-i18n:
    generated_at: "2026-04-05T13:58:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a5f39d4f40ad19646d372000c85b663770eae412af91e1c175eb27b22208118
    source_path: network.md
    workflow: 15
---

# Hub sieciowy

Ten hub prowadzi do podstawowych dokumentów opisujących, jak OpenClaw łączy,
paruje i zabezpiecza urządzenia przez localhost, LAN i tailnet.

## Model podstawowy

Większość operacji przechodzi przez Gateway (`openclaw gateway`), pojedynczy długotrwale działający proces, który zarządza połączeniami kanałów i płaszczyzną sterowania WebSocket.

- **Najpierw loopback**: Gateway WS domyślnie działa pod `ws://127.0.0.1:18789`.
  Bindy poza loopback wymagają prawidłowej ścieżki auth gateway: auth
  współdzielonym sekretem przez token/hasło albo poprawnie skonfigurowanego wdrożenia
  `trusted-proxy` poza loopback.
- Zalecany jest **jeden Gateway na host**. Dla izolacji uruchamiaj wiele gateway z odizolowanymi profilami i portami ([Multiple Gateways](/gateway/multiple-gateways)).
- **Host canvas** jest udostępniany na tym samym porcie co Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), chroniony przez auth gateway przy bindzie poza loopback.
- **Dostęp zdalny** to zwykle tunel SSH albo Tailscale VPN ([Remote Access](/gateway/remote)).

Kluczowe dokumenty:

- [Gateway architecture](/concepts/architecture)
- [Gateway protocol](/gateway/protocol)
- [Gateway runbook](/gateway)
- [Web surfaces + bind modes](/web)

## Parowanie i tożsamość

- [Pairing overview (DM + nodes)](/pl/channels/pairing)
- [Gateway-owned node pairing](/gateway/pairing)
- [Devices CLI (pairing + token rotation)](/cli/devices)
- [Pairing CLI (DM approvals)](/cli/pairing)

Zaufanie lokalne:

- Bezpośrednie lokalne połączenia loopback mogą być automatycznie zatwierdzane do parowania, aby zachować płynne UX na tym samym hoście.
- OpenClaw ma też wąską ścieżkę self-connect dla zaufanych helperów backend/container-local opartych na współdzielonym sekrecie.
- Klienci tailnet i LAN, w tym bindy tailnet na tym samym hoście, nadal wymagają jawnego zatwierdzenia parowania.

## Wykrywanie i transporty

- [Discovery & transports](/gateway/discovery)
- [Bonjour / mDNS](/gateway/bonjour)
- [Remote access (SSH)](/gateway/remote)
- [Tailscale](/gateway/tailscale)

## Nody i transporty

- [Nodes overview](/nodes)
- [Bridge protocol (legacy nodes, historical)](/gateway/bridge-protocol)
- [Node runbook: iOS](/platforms/ios)
- [Node runbook: Android](/platforms/android)

## Bezpieczeństwo

- [Security overview](/gateway/security)
- [Gateway config reference](/gateway/configuration)
- [Troubleshooting](/gateway/troubleshooting)
- [Doctor](/gateway/doctor)
