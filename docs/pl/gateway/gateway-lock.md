---
read_when:
    - Uruchamianie lub debugowanie procesu gateway
    - Badanie egzekwowania pojedynczej instancji
summary: Ochrona singletona Gateway przy użyciu binda listenera WebSocket
title: Blokada Gateway
x-i18n:
    generated_at: "2026-04-24T09:10:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f52405d1891470592cb2f9328421dc910c15f4fdc4d34d57c1fec8b322c753f
    source_path: gateway/gateway-lock.md
    workflow: 15
---

## Dlaczego

- Zapewnia, że na tym samym hoście działa tylko jedna instancja gateway dla danego portu bazowego; dodatkowe gatewaye muszą używać izolowanych profili i unikalnych portów.
- Przetrwa awarie/SIGKILL bez pozostawiania nieaktualnych plików blokady.
- Kończy się szybko z czytelnym błędem, gdy port kontrolny jest już zajęty.

## Mechanizm

- Gateway wiąże listener WebSocket (domyślnie `ws://127.0.0.1:18789`) natychmiast przy starcie, używając wyłącznego listenera TCP.
- Jeśli bind zakończy się błędem `EADDRINUSE`, start zgłasza `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- System operacyjny automatycznie zwalnia listener przy każdym zakończeniu procesu, w tym po awarii i SIGKILL — nie jest potrzebny oddzielny plik blokady ani krok czyszczenia.
- Przy zamykaniu gateway zamyka serwer WebSocket i bazowy serwer HTTP, aby szybko zwolnić port.

## Powierzchnia błędów

- Jeśli port jest zajęty przez inny proces, start zgłasza `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Inne błędy bind są zgłaszane jako `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## Uwagi operacyjne

- Jeśli port jest zajęty przez _inny_ proces, błąd jest taki sam; zwolnij port albo wybierz inny przez `openclaw gateway --port <port>`.
- Aplikacja macOS nadal utrzymuje własne lekkie zabezpieczenie PID przed uruchomieniem gateway; blokada runtime jest egzekwowana przez bind WebSocket.

## Powiązane

- [Multiple Gateways](/pl/gateway/multiple-gateways) — uruchamianie wielu instancji z unikalnymi portami
- [Troubleshooting](/pl/gateway/troubleshooting) — diagnozowanie `EADDRINUSE` i konfliktów portów
