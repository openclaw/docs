---
read_when:
    - Uruchamianie lub debugowanie procesu Gateway
    - Badanie wymuszania pojedynczej instancji
summary: 'Zabezpieczenie pojedynczej instancji Gateway: blokada pliku oraz powiązanie WebSocket/HTTP'
title: Blokada Gatewaya
x-i18n:
    generated_at: "2026-07-16T18:26:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f5ac6d42c437b481c68a23a0aa4c00aeac9131acd76f3516ce3e949f325e265b
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Dlaczego

- Tylko jeden proces Gateway powinien być właścicielem katalogu stanu; dodatkowe procesy Gateway należy uruchamiać z odizolowanymi profilami, katalogami stanu, konfiguracjami i portami.
- Mechanizm musi przetrwać awarie/SIGKILL bez pozostawiania nieaktualnych plików blokady.
- Jeśli inny proces Gateway jest już właścicielem portu, uruchamianie musi szybko zakończyć się niepowodzeniem z czytelnym błędem.

## Trzy warstwy

Podczas uruchamiania własność jest egzekwowana w trzech krokach, w następującej kolejności:

1. **Blokada własności stanu** uzyskuje blokadę powiązaną z kanonicznym katalogiem stanu. Uczestniczy w niej każdy proces Gateway, również procesy Gateway uruchomione z `OPENCLAW_ALLOW_MULTI_GATEWAY=1`, dzięki czemu destrukcyjne operacje konserwacyjne SQLite nie mogą kolidować z aktywnym właścicielem.
2. **Blokada konfiguracji** uzyskuje historyczną blokadę dla poszczególnej konfiguracji i zapisuje port środowiska uruchomieniowego. Tryb wielu procesów Gateway pomija ograniczenie konfiguracji do pojedynczej instancji, ale zachowuje blokadę własności stanu.
3. **Powiązanie gniazda** wiąże nasłuch HTTP/WebSocket (domyślnie `ws://127.0.0.1:18789`) jako wyłączny nasłuch TCP.

Każda warstwa może niezależnie zakończyć się niepowodzeniem i zgłasza własny wyjątek `GatewayLockError`.

### Blokady stanu i konfiguracji

- Aktywność blokady jest ustalana na podstawie zapisanego identyfikatora PID, tożsamości czasu uruchomienia procesu na danej platformie, jeśli jest dostępna, oraz tożsamości procesu Gateway. Zweryfikowany właściciel pozostaje wiążący podczas uruchamiania, zanim jego port rozpocznie nasłuchiwanie.
- Dedykowany koordynator SQLite serializuje inspekcję metadanych, odzyskiwanie blokad po nieaktywnych właścicielach i zastępowanie blokad. Jego transakcja wyłączna jest automatycznie zwalniana w razie awarii procesu będącego właścicielem.
- Jeśli brakuje pliku blokady lub zapisany proces właściciela już nie działa, uruchamianie odzyskuje blokadę i jest kontynuowane.
- Jeśli którakolwiek z blokad jest aktywna, uruchamianie ponawia próbę przez maksymalnie 5 sekund (domyślnie), zanim zrezygnuje:

  ```text
  GatewayLockError("gateway already running (pid <pid>); lock timeout after <ms>ms")
  ```

### Powiązanie gniazda

- W przypadku `EADDRINUSE` uruchamianie ponawia próbę powiązania maksymalnie 20 razy w odstępach 500ms (łącznie około 10 sekund), aby przeczekać okres `TIME_WAIT` po niedawno zakończonym procesie.
- Jeśli po ponowieniach port nadal jest używany:

  ```text
  GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")
  ```

- Inne błędy powiązania:

  ```text
  GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: <cause>")
  ```

Podczas zamykania Gateway zamyka serwer HTTP/WebSocket i usuwa swoje pliki
blokady stanu oraz konfiguracji.

## Uwagi operacyjne

- Jeśli port jest zajęty przez inny proces, który nie jest procesem Gateway, błąd jest taki sam; należy zwolnić port lub wybrać inny za pomocą `openclaw gateway --port <port>`.
- `OPENCLAW_ALLOW_MULTI_GATEWAY=1` zezwala na wiele instancji konfiguracji/środowiska uruchomieniowego, a nie na współdzielony stan modyfikowalny. Każda instancja nadal wymaga unikatowego `OPENCLAW_STATE_DIR`.
- Pod nadzorem menedżera usług nowy proces Gateway, który napotka jeden z powyższych błędów, najpierw sonduje `/healthz` w istniejącym procesie. Jeśli ten proces działa prawidłowo, nowy proces pozostawia mu kontrolę, zamiast kończyć się niepowodzeniem. W systemd kończy się z kodem `78`; ustawienie `RestartPreventExitStatus=78` jednostki zapobiega zapętleniu `Restart=always` z powodu konfliktu blokady lub `EADDRINUSE`. Jeśli istniejący proces nie osiągnie prawidłowego stanu, ponawianie sondy stanu ma ograniczenie czasowe, po czym uruchamianie kończy się powyższym błędem blokady, zamiast trwać w nieskończonej pętli.
- Aplikacja macOS zachowuje własne lekkie zabezpieczenie PID przed uruchomieniem procesu Gateway; opisane powyżej blokada pliku i powiązanie gniazda stanowią właściwe mechanizmy egzekwowania podczas działania.

## Powiązane

- [Wiele procesów Gateway](/pl/gateway/multiple-gateways) - uruchamianie wielu instancji z unikatowymi portami
- [Rozwiązywanie problemów](/pl/gateway/troubleshooting) - diagnozowanie `EADDRINUSE` i konfliktów portów
