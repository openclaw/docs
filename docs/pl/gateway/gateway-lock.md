---
read_when:
    - Uruchamianie lub debugowanie procesu Gateway
    - Badanie wymuszania pojedynczej instancji
summary: Zabezpieczenie singletonu Gateway z użyciem wiązania nasłuchiwacza WebSocket
title: Blokada Gateway
x-i18n:
    generated_at: "2026-04-30T16:28:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85a1cb55f08d47d36fde25900e4247ef01c9a6800bf017fbff44a337f299ce13
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Dlaczego

- Zapewnia, że na tym samym hoście dla jednego portu bazowego działa tylko jedna instancja Gateway; dodatkowe instancje Gateway muszą używać izolowanych profili i unikalnych portów.
- Przetrwanie awarii/SIGKILL bez pozostawiania nieaktualnych plików blokad.
- Szybkie niepowodzenie z jasnym błędem, gdy port sterujący jest już zajęty.

## Mechanizm

- Gateway najpierw uzyskuje plik blokady dla danej konfiguracji w katalogu blokad stanu i sprawdza skonfigurowany port pod kątem istniejącego procesu nasłuchującego.
- Jeśli zarejestrowany właściciel blokady już nie istnieje, port jest wolny albo blokada jest nieaktualna, uruchamianie odzyskuje blokadę i kontynuuje.
- Następnie Gateway wiąże proces nasłuchujący HTTP/WebSocket (domyślnie `ws://127.0.0.1:18789`) przy użyciu wyłącznego procesu nasłuchującego TCP.
- Jeśli wiązanie nie powiedzie się z `EADDRINUSE`, uruchamianie zgłasza `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Przy zamykaniu Gateway zamyka serwer HTTP/WebSocket i usuwa plik blokady.

## Sygnalizacja błędów

- Jeśli inny proces zajmuje port, uruchamianie zgłasza `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Inne niepowodzenia wiązania są sygnalizowane jako `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## Uwagi operacyjne

- Jeśli port jest zajęty przez _inny_ proces, błąd jest taki sam; zwolnij port albo wybierz inny za pomocą `openclaw gateway --port <port>`.
- Pod nadzorem menedżera usług nowy proces Gateway, który wykryje istniejący zdrowy responder `/healthz`, pozostawia temu procesowi kontrolę. W systemd duplikat procesu uruchamiającego kończy działanie z kodem 78, dzięki czemu domyślne `RestartPreventExitStatus=78` zapobiega zapętleniu `Restart=always` przy konflikcie blokady lub `EADDRINUSE`. Jeśli istniejący proces nigdy nie stanie się zdrowy, ponowienia są ograniczone, a uruchamianie kończy się jasnym błędem blokady zamiast zapętlać się bez końca.
- Aplikacja macOS nadal utrzymuje własną lekką ochronę PID przed uruchomieniem Gateway; blokada czasu wykonywania jest wymuszana przez plik blokady oraz wiązanie HTTP/WebSocket.

## Powiązane

- [Wiele instancji Gateway](/pl/gateway/multiple-gateways) — uruchamianie wielu instancji z unikalnymi portami
- [Rozwiązywanie problemów](/pl/gateway/troubleshooting) — diagnozowanie `EADDRINUSE` i konfliktów portów
