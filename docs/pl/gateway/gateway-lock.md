---
read_when:
    - Uruchamianie lub debugowanie procesu Gateway
    - Analiza wymuszania pojedynczej instancji
summary: Zabezpieczenie singletona Gateway z użyciem wiązania nasłuchiwacza WebSocket
title: Blokada Gateway
x-i18n:
    generated_at: "2026-04-30T09:53:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe61ff81106554e98de1ca04c213b76d230265cdf3e81b70897d2de00f6a0179
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Dlaczego

- Zapewnij, aby na tym samym hoście dla danego portu bazowego działała tylko jedna instancja Gateway; dodatkowe Gateway muszą używać odizolowanych profili i unikalnych portów.
- Przetrwaj awarie/SIGKILL bez pozostawiania nieaktualnych plików blokady.
- Kończ uruchamianie szybko i z jasnym błędem, gdy port sterowania jest już zajęty.

## Mechanizm

- Gateway najpierw uzyskuje plik blokady dla danej konfiguracji w katalogu blokad stanu i sprawdza skonfigurowany port pod kątem istniejącego procesu nasłuchującego.
- Jeśli zapisany właściciel blokady już nie istnieje, port jest wolny albo blokada jest nieaktualna, uruchamianie przejmuje blokadę i kontynuuje.
- Następnie Gateway wiąże listener HTTP/WebSocket (domyślnie `ws://127.0.0.1:18789`) przy użyciu wyłącznego listenera TCP.
- Jeśli wiązanie nie powiedzie się z `EADDRINUSE`, uruchamianie zgłasza `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Podczas zamykania Gateway zamyka serwer HTTP/WebSocket i usuwa plik blokady.

## Powierzchnia błędów

- Jeśli inny proces zajmuje port, uruchamianie zgłasza `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Inne błędy wiązania są ujawniane jako `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## Uwagi operacyjne

- Jeśli port jest zajęty przez _inny_ proces, błąd jest taki sam; zwolnij port albo wybierz inny za pomocą `openclaw gateway --port <port>`.
- Pod nadzorem menedżera usług nowy proces Gateway, który wykryje istniejący, sprawny responder `/healthz`, kończy się powodzeniem i pozostawia temu procesowi kontrolę. Jeśli istniejący proces nigdy nie stanie się sprawny, ponowienia są ograniczone, a uruchamianie kończy się jasnym błędem blokady zamiast zapętlać się bez końca.
- Aplikacja macOS nadal utrzymuje własny lekki mechanizm PID guard przed uruchomieniem Gateway; blokada środowiska uruchomieniowego jest wymuszana przez plik blokady oraz wiązanie HTTP/WebSocket.

## Powiązane

- [Wiele instancji Gateway](/pl/gateway/multiple-gateways) — uruchamianie wielu instancji z unikalnymi portami
- [Rozwiązywanie problemów](/pl/gateway/troubleshooting) — diagnozowanie `EADDRINUSE` i konfliktów portów
