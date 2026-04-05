---
read_when:
    - Debugowanie karty Instances
    - Badanie zduplikowanych lub nieaktualnych wierszy instancji
    - Zmiana beaconów połączenia Gateway WS lub system-event
summary: Jak wpisy presence w OpenClaw są tworzone, scalane i wyświetlane
title: Presence
x-i18n:
    generated_at: "2026-04-05T13:50:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: a004a1f87be08699c1b2cba97cad8678ce5e27baa425f59eaa18006fdcff26e7
    source_path: concepts/presence.md
    workflow: 15
---

# Presence

„Presence” w OpenClaw to lekki widok best-effort obejmujący:

- sam **Gateway**, oraz
- **klientów połączonych z Gateway** (aplikacja Mac, WebChat, CLI itd.)

Presence służy głównie do renderowania karty **Instances** w aplikacji macOS oraz
do zapewnienia operatorowi szybkiej widoczności.

## Pola presence (co się wyświetla)

Wpisy presence to strukturalne obiekty z polami takimi jak:

- `instanceId` (opcjonalne, ale zdecydowanie zalecane): stabilna tożsamość klienta (zwykle `connect.client.instanceId`)
- `host`: przyjazna dla człowieka nazwa hosta
- `ip`: adres IP w trybie best-effort
- `version`: ciąg wersji klienta
- `deviceFamily` / `modelIdentifier`: wskazówki dotyczące sprzętu
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: „sekundy od ostatniego wejścia użytkownika” (jeśli znane)
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: timestamp ostatniej aktualizacji (ms od epoki)

## Producenci (skąd bierze się presence)

Wpisy presence są tworzone przez wiele źródeł i **scalane**.

### 1) Własny wpis Gateway

Gateway zawsze inicjalizuje własny wpis „self” przy starcie, aby UI pokazywało host gateway
jeszcze zanim połączą się jakiekolwiek klienty.

### 2) Połączenie WebSocket

Każdy klient WS zaczyna od żądania `connect`. Po udanym handshake
Gateway wykonuje upsert wpisu presence dla tego połączenia.

#### Dlaczego jednorazowe polecenia CLI się nie pojawiają

CLI często łączy się na krótko w celu wykonania jednorazowych poleceń. Aby uniknąć zaśmiecania
listy Instances, `client.mode === "cli"` **nie** jest zamieniane na wpis presence.

### 3) Beacony `system-event`

Klienty mogą wysyłać bogatsze okresowe beacony przez metodę `system-event`. Aplikacja Mac
używa tego do raportowania nazwy hosta, IP i `lastInputSeconds`.

### 4) Połączenia węzłów (role: node)

Gdy węzeł łączy się przez Gateway WebSocket z `role: node`, Gateway
wykonuje upsert wpisu presence dla tego węzła (ten sam przepływ co dla innych klientów WS).

## Reguły scalania + deduplikacji (dlaczego `instanceId` ma znaczenie)

Wpisy presence są przechowywane w jednej mapie w pamięci:

- Wpisy są kluczowane przez **klucz presence**.
- Najlepszym kluczem jest stabilne `instanceId` (z `connect.client.instanceId`), które przetrwa restarty.
- Klucze nie rozróżniają wielkości liter.

Jeśli klient połączy się ponownie bez stabilnego `instanceId`, może pojawić się jako
**zduplikowany** wiersz.

## TTL i ograniczony rozmiar

Presence jest celowo efemeryczne:

- **TTL:** wpisy starsze niż 5 minut są usuwane
- **Maksymalna liczba wpisów:** 200 (najstarsze są usuwane jako pierwsze)

Dzięki temu lista pozostaje świeża i nie dochodzi do nieograniczonego wzrostu pamięci.

## Zastrzeżenie dotyczące zdalnego połączenia/tunelu (adresy loopback)

Gdy klient łączy się przez tunel SSH / lokalne przekierowanie portu, Gateway może
widzieć adres zdalny jako `127.0.0.1`. Aby nie nadpisywać poprawnego adresu IP raportowanego przez klienta,
adresy zdalne loopback są ignorowane.

## Konsumenci

### Karta Instances w macOS

Aplikacja macOS renderuje wynik `system-presence` i stosuje mały wskaźnik stanu
(Active/Idle/Stale) na podstawie wieku ostatniej aktualizacji.

## Wskazówki debugowania

- Aby zobaczyć surową listę, wywołaj `system-presence` względem Gateway.
- Jeśli widzisz duplikaty:
  - potwierdź, że klienty wysyłają stabilne `client.instanceId` w handshake
  - potwierdź, że okresowe beacony używają tego samego `instanceId`
  - sprawdź, czy we wpisie pochodzącym z połączenia nie brakuje `instanceId` (duplikaty są wtedy oczekiwane)
