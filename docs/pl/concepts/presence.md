---
read_when:
    - Debugowanie karty Instances
    - Badanie zduplikowanych lub nieaktualnych wierszy instancji
    - Zmiana połączenia WS Gateway lub beaconów zdarzeń systemowych
summary: Jak wpisy statusu OpenClaw są tworzone, scalane i wyświetlane
title: Status
x-i18n:
    generated_at: "2026-04-24T09:06:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f33a7d4a3d5e5555c68a7503b3a4f75c12db94d260e5546cfc26ca8a12de0f9
    source_path: concepts/presence.md
    workflow: 15
---

Status OpenClaw to lekki widok best-effort obejmujący:

- samą **Gateway**, oraz
- **klientów połączonych z Gateway** (aplikacja Mac, WebChat, CLI itd.)

Status jest używany przede wszystkim do renderowania karty **Instances** w aplikacji macOS oraz do
zapewnienia operatorowi szybkiego wglądu.

## Pola statusu (co się wyświetla)

Wpisy statusu są ustrukturyzowanymi obiektami z polami takimi jak:

- `instanceId` (opcjonalne, ale zdecydowanie zalecane): stabilna tożsamość klienta (zwykle `connect.client.instanceId`)
- `host`: przyjazna dla człowieka nazwa hosta
- `ip`: adres IP w trybie best-effort
- `version`: ciąg wersji klienta
- `deviceFamily` / `modelIdentifier`: wskazówki dotyczące sprzętu
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: „liczba sekund od ostatniego wejścia użytkownika” (jeśli znana)
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: znacznik czasu ostatniej aktualizacji (ms od epoki)

## Producenci (skąd pochodzi status)

Wpisy statusu są tworzone przez wiele źródeł i **scalane**.

### 1) Wpis własny Gateway

Gateway zawsze inicjalizuje wpis „self” przy starcie, aby interfejsy pokazywały host Gateway
jeszcze zanim połączą się jacykolwiek klienci.

### 2) Połączenie WebSocket

Każdy klient WS zaczyna od żądania `connect`. Po pomyślnym handshake Gateway wykonuje upsert wpisu statusu dla tego połączenia.

#### Dlaczego jednorazowe polecenia CLI się nie pokazują

CLI często łączy się na krótko dla jednorazowych poleceń. Aby nie zaśmiecać
listy Instances, `client.mode === "cli"` **nie** jest zamieniane na wpis statusu.

### 3) Beacony `system-event`

Klienci mogą wysyłać bogatsze okresowe beacony przez metodę `system-event`. Aplikacja Mac
używa tego do raportowania nazwy hosta, adresu IP i `lastInputSeconds`.

### 4) Połączenia Node (rola: node)

Gdy Node łączy się przez WebSocket Gateway z `role: node`, Gateway wykonuje upsert wpisu statusu dla tego Node (ten sam przepływ co dla innych klientów WS).

## Zasady scalania + usuwania duplikatów (dlaczego `instanceId` ma znaczenie)

Wpisy statusu są przechowywane w jednej mapie w pamięci:

- Wpisy są kluczowane przez **klucz statusu**.
- Najlepszym kluczem jest stabilne `instanceId` (z `connect.client.instanceId`), które przetrwa restarty.
- Klucze nie rozróżniają wielkości liter.

Jeśli klient połączy się ponownie bez stabilnego `instanceId`, może pojawić się jako
**zduplikowany** wiersz.

## TTL i ograniczony rozmiar

Status jest celowo efemeryczny:

- **TTL:** wpisy starsze niż 5 minut są usuwane
- **Maksymalna liczba wpisów:** 200 (najstarsze usuwane jako pierwsze)

Dzięki temu lista pozostaje świeża i unika nieograniczonego wzrostu pamięci.

## Zastrzeżenie dla połączeń zdalnych/tuneli (adresy loopback)

Gdy klient łączy się przez tunel SSH / lokalne przekierowanie portu, Gateway może
widzieć adres zdalny jako `127.0.0.1`. Aby nie nadpisywać poprawnego adresu IP zgłoszonego przez klienta,
zdalne adresy loopback są ignorowane.

## Odbiorcy

### Karta Instances w macOS

Aplikacja macOS renderuje wynik `system-presence` i stosuje mały wskaźnik stanu
(Active/Idle/Stale) na podstawie wieku ostatniej aktualizacji.

## Wskazówki debugowania

- Aby zobaczyć surową listę, wywołaj `system-presence` względem Gateway.
- Jeśli widzisz duplikaty:
  - potwierdź, że klienci wysyłają stabilne `client.instanceId` w handshake
  - potwierdź, że okresowe beacony używają tego samego `instanceId`
  - sprawdź, czy wpis pochodzący z połączenia nie ma `instanceId` (wtedy duplikaty są spodziewane)

## Powiązane

- [Wskaźniki pisania](/pl/concepts/typing-indicators)
- [Strumieniowanie i fragmentacja](/pl/concepts/streaming)
