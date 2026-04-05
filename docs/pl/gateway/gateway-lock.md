---
read_when:
    - Uruchamiasz lub debugujesz proces gateway
    - Badasz wymuszanie pojedynczej instancji
summary: Blokada singletona Gateway przy użyciu bindowania listenera WebSocket
title: Blokada Gateway
x-i18n:
    generated_at: "2026-04-05T13:52:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 726c687ab53f2dd1e46afed8fc791b55310a5c1e62f79a0e38a7dc4ca7576093
    source_path: gateway/gateway-lock.md
    workflow: 15
---

# Blokada Gateway

## Dlaczego

- Zapewnia, że na tym samym hoście działa tylko jedna instancja gateway na dany port bazowy; dodatkowe gateway muszą używać izolowanych profili i unikalnych portów.
- Przetrwa crashe/SIGKILL bez pozostawiania nieaktualnych plików blokady.
- Szybko kończy działanie z jasnym błędem, gdy port sterowania jest już zajęty.

## Mechanizm

- Gateway binduje listener WebSocket (domyślnie `ws://127.0.0.1:18789`) natychmiast przy uruchomieniu, używając wyłącznego listenera TCP.
- Jeśli bind zakończy się błędem `EADDRINUSE`, uruchamianie zgłasza `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- System operacyjny automatycznie zwalnia listener przy każdym zakończeniu procesu, także po crashach i SIGKILL — nie jest potrzebny osobny plik blokady ani krok czyszczenia.
- Przy zamykaniu gateway zamyka serwer WebSocket i bazowy serwer HTTP, aby szybko zwolnić port.

## Powierzchnia błędów

- Jeśli port jest zajęty przez inny proces, uruchamianie zgłasza `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Inne błędy bindowania są zgłaszane jako `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## Uwagi operacyjne

- Jeśli port jest zajęty przez _inny_ proces, błąd jest taki sam; zwolnij port albo wybierz inny przez `openclaw gateway --port <port>`.
- Aplikacja macOS nadal utrzymuje własną lekką blokadę PID przed uruchomieniem gateway; blokada środowiska uruchomieniowego jest wymuszana przez bind WebSocket.

## Powiązane

- [Wiele Gateway](/gateway/multiple-gateways) — uruchamianie wielu instancji z unikalnymi portami
- [Rozwiązywanie problemów](/gateway/troubleshooting) — diagnozowanie `EADDRINUSE` i konfliktów portów
