---
read_when:
    - Potrzebujesz omówienia architektury sieci i zabezpieczeń
    - Debugujesz dostęp lokalny i przez tailnet lub parowanie
    - Potrzebujesz kanonicznej listy dokumentacji sieciowej
summary: 'Centrum sieciowe: interfejsy Gateway, parowanie, wykrywanie i bezpieczeństwo'
title: Sieć
x-i18n:
    generated_at: "2026-07-12T15:16:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9751bb0fe71009455b243b109ef7ef4eda08d58f940f7dcef305800a5ed89586
    source_path: network.md
    workflow: 16
---

To centrum zawiera odnośniki do najważniejszej dokumentacji dotyczącej sposobu, w jaki OpenClaw łączy i paruje urządzenia oraz zabezpiecza je
w środowiskach localhost, LAN i tailnet.

## Model podstawowy

Większość operacji odbywa się za pośrednictwem Gateway (`openclaw gateway`) — pojedynczego, długotrwale działającego procesu, który zarządza połączeniami kanałów i warstwą sterowania WebSocket.

- **Najpierw local loopback**: domyślny adres WS Gateway to `ws://127.0.0.1:18789`.
  Powiązania inne niż loopback nie zostaną uruchomione bez prawidłowej ścieżki uwierzytelniania Gateway:
  uwierzytelniania za pomocą współdzielonego tajnego tokenu lub hasła albo poprawnie skonfigurowanego wdrożenia
  `trusted-proxy` poza loopback.
- Zaleca się używanie **jednego Gateway na hosta**. W celu izolacji można uruchomić wiele instancji Gateway z odrębnymi profilami i portami ([Wiele instancji Gateway](/pl/gateway/multiple-gateways)).
- **Host Canvas** jest udostępniany na tym samym porcie co Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`) i jest chroniony przez uwierzytelnianie Gateway, gdy nasłuch wykracza poza loopback.
- **Dostęp zdalny** jest zwykle realizowany przez tunel SSH lub VPN Tailscale ([Dostęp zdalny](/pl/gateway/remote)).

Najważniejsze materiały:

- [Architektura Gateway](/pl/concepts/architecture)
- [Protokół Gateway](/pl/gateway/protocol)
- [Podręcznik operacyjny Gateway](/pl/gateway)
- [Interfejsy internetowe i tryby powiązania](/pl/web)

## Parowanie i tożsamość

- [Omówienie parowania (wiadomości prywatne i węzły)](/pl/channels/pairing)
- [Parowanie węzłów zarządzane przez Gateway](/pl/gateway/pairing)
- [CLI urządzeń (parowanie i rotacja tokenów)](/pl/cli/devices)
- [CLI parowania (zatwierdzanie wiadomości prywatnych)](/pl/cli/pairing)

Zaufanie lokalne:

- Bezpośrednie lokalne połączenia local loopback (bez przekazywanych nagłówków lub nagłówków serwera proxy) mogą być
  automatycznie zatwierdzane do parowania, aby zapewnić płynną obsługę na tym samym hoście.
- OpenClaw ma również ściśle ograniczoną ścieżkę samodzielnego połączenia lokalnego dla backendu lub kontenera,
  przeznaczoną dla zaufanych przepływów pomocniczych korzystających ze współdzielonego sekretu.
- Klienci tailnet i LAN, w tym powiązania tailnet na tym samym hoście, nadal wymagają
  jawnego zatwierdzenia parowania.

## Wykrywanie i transporty

- [Wykrywanie i transporty](/pl/gateway/discovery)
- [Bonjour / mDNS](/pl/gateway/bonjour)
- [Dostęp zdalny (SSH)](/pl/gateway/remote)
- [Tailscale](/pl/gateway/tailscale)

## Węzły i transporty

- [Omówienie węzłów](/pl/nodes)
- [Protokół mostu (starsze węzły, informacje historyczne)](/pl/gateway/bridge-protocol)
- [Podręcznik operacyjny węzła: iOS](/pl/platforms/ios)
- [Podręcznik operacyjny węzła: Android](/pl/platforms/android)

## Bezpieczeństwo

- [Omówienie bezpieczeństwa](/pl/gateway/security)
- [Dokumentacja konfiguracji Gateway](/pl/gateway/configuration)
- [Rozwiązywanie problemów](/pl/gateway/troubleshooting)
- [Narzędzie diagnostyczne](/pl/gateway/doctor)

## Powiązane materiały

- [Podręcznik operacyjny Gateway](/pl/gateway)
- [Dostęp zdalny](/pl/gateway/remote)
