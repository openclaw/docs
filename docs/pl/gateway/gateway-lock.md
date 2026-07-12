---
read_when:
    - Uruchamianie lub debugowanie procesu Gateway
    - Badanie wymuszania pojedynczej instancji
summary: 'Ochrona pojedynczej instancji Gateway: blokada pliku oraz powiązanie WebSocket/HTTP'
title: Blokada Gatewaya
x-i18n:
    generated_at: "2026-07-12T15:09:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c3ba4e8c12d6aadd089cb05722444eaa99d4b573553ac52a21c5c91e5ce1c09
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Dlaczego

- Tylko jeden proces Gateway powinien używać danej konfiguracji i portu na hoście; dodatkowe procesy Gateway należy uruchamiać z odizolowanymi profilami i unikatowymi portami.
- Mechanizm powinien przetrwać awarie/SIGKILL bez pozostawiania nieaktualnych plików blokady.
- Gdy inny proces Gateway już używa portu, uruchamianie powinno natychmiast zakończyć się czytelnym błędem.

## Dwie warstwy

Podczas uruchamiania własność pojedynczej instancji jest wymuszana w dwóch niezależnych krokach, w następującej kolejności:

1. **Blokada pliku** pozyskuje plik blokady dla danej konfiguracji w katalogu blokad stanu. W ramach jej pozyskiwania procedura uruchamiania sprawdza skonfigurowany port pod kątem aktywnego procesu nasłuchującego, aby wykryć nieaktualną blokadę pozostawioną przez proces, który uległ awarii.
2. **Wiązanie gniazda** wiąże proces nasłuchujący HTTP/WebSocket (domyślnie `ws://127.0.0.1:18789`) jako wyłączny proces nasłuchujący TCP.

Każda warstwa może niezależnie zakończyć się niepowodzeniem i zgłasza własny wyjątek `GatewayLockError`.

### Blokada pliku

- Jeśli plik blokady nie istnieje, zapisany proces właściciela już nie działa albo sprawdzenie portu właściciela nie wykrywa aktywnego procesu nasłuchującego, procedura uruchamiania przejmuje blokadę i kontynuuje.
- Jeśli blokada jest aktywnie utrzymywana i nie zachodzi żaden z powyższych przypadków, procedura uruchamiania ponawia próbę przez maksymalnie 5 sekund (domyślnie), po czym rezygnuje:

  ```text
  GatewayLockError("gateway already running (pid <pid>); lock timeout after <ms>ms")
  ```

### Wiązanie gniazda

- W przypadku `EADDRINUSE` procedura uruchamiania ponawia próbę wiązania maksymalnie 20 razy w odstępach 500 ms (łącznie około 10 sekund), aby przeczekać stan `TIME_WAIT` po niedawno zakończonym procesie.
- Jeśli po ponowieniach port nadal jest używany:

  ```text
  GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")
  ```

- Inne błędy wiązania:

  ```text
  GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: <cause>")
  ```

Podczas zamykania Gateway zamyka serwer HTTP/WebSocket i usuwa plik blokady.

## Uwagi operacyjne

- Jeśli port jest zajęty przez inny proces, który nie jest procesem Gateway, błąd jest taki sam; zwolnij port lub wybierz inny za pomocą `openclaw gateway --port <port>`.
- Pod nadzorem menedżera usług nowy proces Gateway, który napotka jeden z powyższych błędów, najpierw sprawdza punkt `/healthz` istniejącego procesu. Jeśli ten proces działa prawidłowo, nowy proces pozostawia mu kontrolę, zamiast kończyć się niepowodzeniem. W systemd kończy się z kodem `78`; ustawienie jednostki `RestartPreventExitStatus=78` zapobiega zapętleniu przez `Restart=always` w przypadku konfliktu blokady lub `EADDRINUSE`. Jeśli istniejący proces nie osiągnie prawidłowego stanu, ponawianie kontroli kondycji jest ograniczone czasowo, a uruchamianie kończy się następnie opisanym powyżej błędem blokady, zamiast trwać w nieskończonej pętli.
- Aplikacja macOS stosuje własne lekkie zabezpieczenie PID przed uruchomieniem procesu Gateway; opisane powyżej blokada pliku i wiązanie gniazda stanowią właściwy mechanizm wymuszania w czasie działania.

## Powiązane

- [Wiele procesów Gateway](/pl/gateway/multiple-gateways) — uruchamianie wielu instancji na unikatowych portach
- [Rozwiązywanie problemów](/pl/gateway/troubleshooting) — diagnozowanie `EADDRINUSE` i konfliktów portów
