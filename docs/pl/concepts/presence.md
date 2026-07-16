---
read_when:
    - Debugowanie statusu na żywo na stronie Urządzenia w interfejsie sterowania
    - Badanie zduplikowanych lub nieaktualnych wierszy instancji
    - Zmiana sygnałów nawigacyjnych połączenia WS z Gateway lub zdarzeń systemowych
summary: Jak są tworzone, scalane i wyświetlane wpisy obecności OpenClaw
title: Obecność
x-i18n:
    generated_at: "2026-07-16T18:15:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b50291e26ddc06fac888847c9e94eba5f9351b1b8d06c55fd6bec16a38d0b6a5
    source_path: concepts/presence.md
    workflow: 16
---

OpenClaw „presence” to uproszczony, oparty na najlepszych dostępnych danych widok:

- samego **Gateway**, oraz
- **widocznych dla użytkownika klientów połączonych z Gateway** (aplikacji na Maca, WebChat, węzłów itp.)

Funkcja obecności wyświetla bieżące metadane połączeń na stronie **Devices** interfejsu Control UI
(w sekcji **Settings → Devices**) oraz na karcie **Instances** aplikacji na macOS.

Ta strona opisuje listę klientów Gateway. Aby wykrywać ostatnio używanego Maca
i kierować do niego alerty węzłów, zobacz
[Obecność aktywnego komputera](/nodes/presence).

## Pola obecności (co jest wyświetlane)

Wpisy obecności są obiektami strukturalnymi zawierającymi między innymi następujące pola:

- `instanceId` (opcjonalne, ale zdecydowanie zalecane): stabilna tożsamość klienta (zwykle `connect.client.instanceId`)
- `host`: przyjazna dla użytkownika nazwa hosta
- `ip`: adres IP ustalony na podstawie najlepszych dostępnych danych
- `version`: ciąg wersji klienta
- `deviceFamily` / `modelIdentifier`: informacje pomocnicze o sprzęcie
- `mode`: `ui`, `webchat`, `cli`, `backend`, `node`, `probe`, `test`
- `lastInputSeconds`: liczba sekund od ostatniego działania użytkownika, jeśli jest znana
- `reason`: dowolny ciąg dostarczony przez klienta; sam Gateway emituje tylko `self`, `connect` i `disconnect`
- `deviceId`, `roles`, `scopes`: wskazówki dotyczące tożsamości urządzenia oraz roli/zakresu z uzgadniania połączenia
- `ts`: znacznik czasu ostatniej aktualizacji (ms od epoki)

## Źródła (skąd pochodzi obecność)

Wpisy obecności pochodzą z wielu źródeł i są **scalane**.

### 1) Własny wpis Gateway

Gateway podczas uruchamiania zawsze tworzy własny wpis, aby interfejsy użytkownika wyświetlały host Gateway
jeszcze przed połączeniem jakiegokolwiek klienta.

### 2) Połączenie WebSocket

Każdy klient WS rozpoczyna od żądania `connect`. Po pomyślnym uzgodnieniu
Gateway wstawia lub aktualizuje wpis obecności dla tego połączenia.

#### Dlaczego efemeryczne połączenia płaszczyzny sterowania nie są wyświetlane

Polecenia CLI, klienci RPC zaplecza i sondy często łączą się tylko na krótko. Aby uniknąć
przechowywania tych częstych zmian przez cały czas TTL obecności, klientów w trybie `cli`, `backend`
lub `probe` **nie** przekształca się we wpisy obecności. Klienci w trybie testowym
pozostają śledzeni, ponieważ zestawy testów używają ich jako zamienników rzeczywistych klientów.

### 3) Sygnały `system-event`

Klienci mogą wysyłać bogatsze okresowe sygnały za pomocą metody `system-event`. Aplikacja na Maca
używa jej do zgłaszania nazwy hosta, adresu IP i `lastInputSeconds`.

### 4) Połączenia węzłów (rola: node)

Gdy węzeł łączy się przez WebSocket Gateway z `role: node`, Gateway
wstawia lub aktualizuje wpis obecności dla tego węzła (w tym samym procesie co w przypadku innych klientów WS).

## Reguły scalania i usuwania duplikatów (dlaczego `instanceId` ma znaczenie)

Wpisy obecności są przechowywane w jednej mapie w pamięci, z kluczami bez rozróżniania wielkości liter,
wybieranymi kolejno na podstawie pierwszej dostępnej wartości: identyfikatora sparowanego urządzenia, `connect.client.instanceId`
lub, w ostateczności, identyfikatora poszczególnego połączenia.

Efemeryczni klienci płaszczyzny sterowania są całkowicie wykluczeni ze śledzenia (patrz
wyżej), więc identyfikatory ich połączeń nigdy nie stają się kluczami. W przypadku każdego innego klienta
użycie identyfikatora połączenia jako wartości zastępczej oznacza, że klient ponownie łączący się bez stabilnego
`instanceId` pojawia się jako **zduplikowany** wiersz.

## TTL i ograniczenie rozmiaru

Obecność jest z założenia efemeryczna:

- **TTL:** wpisy starsze niż 5 minut są usuwane
- **Maksymalna liczba wpisów:** 200 (najstarsze są usuwane jako pierwsze)

Dzięki temu lista pozostaje aktualna, a zużycie pamięci nie rośnie bez ograniczeń.

## Zastrzeżenie dotyczące połączeń zdalnych/tuneli (adresy IP pętli zwrotnej)

Gdy klient łączy się przez tunel SSH lub lokalne przekierowanie portu, Gateway
może widzieć adres zdalny jako `127.0.0.1`. Aby uniknąć zapisywania adresu tunelu
jako adresu IP klienta, obsługa połączenia całkowicie pomija `ip`
w przypadku klientów wykrytych jako lokalni (korzystających z pętli zwrotnej), zamiast zapisywać adres pętli zwrotnej
we wpisie.

## Odbiorcy

### Strona Devices interfejsu Control UI

Strona **Devices** łączy `system-presence` z trwałymi rekordami parowania i węzłów.
Umieszcza własny sygnał Gateway na początku i na podstawie pasujących identyfikatorów urządzenia lub
instancji pozyskuje bieżące metadane platformy, wersji, modelu i czasu od ostatniego działania użytkownika.

### Karta Instances w macOS

Aplikacja na macOS renderuje dane wyjściowe `system-presence` i stosuje niewielki wskaźnik
stanu (Active/Idle/Stale) na podstawie czasu, który upłynął od ostatniej aktualizacji.

## Wskazówki dotyczące debugowania

- Aby zobaczyć nieprzetworzoną listę, wywołaj `system-presence` względem Gateway.
- Jeśli widoczne są duplikaty:
  - upewnij się, że klienci wysyłają stabilny `client.instanceId` podczas uzgadniania połączenia
  - upewnij się, że okresowe sygnały używają tego samego `instanceId`
  - sprawdź, czy we wpisie pochodzącym z połączenia brakuje `instanceId` (duplikaty są wtedy oczekiwane)

## Powiązane

<CardGroup cols={2}>
  <Card title="Obecność aktywnego komputera" href="/nodes/presence" icon="computer-mouse">
    Sposób, w jaki fizyczne działania na Macu wybierają aktywny węzeł i kierują alerty o połączeniach.
  </Card>
  <Card title="Wskaźniki pisania" href="/pl/concepts/typing-indicators" icon="ellipsis">
    Kiedy wysyłane są wskaźniki pisania i jak je dostosować.
  </Card>
  <Card title="Strumieniowanie i dzielenie na fragmenty" href="/pl/concepts/streaming" icon="bars-staggered">
    Wychodzące strumieniowanie, dzielenie na fragmenty i formatowanie zależne od kanału.
  </Card>
  <Card title="Architektura Gateway" href="/pl/concepts/architecture" icon="diagram-project">
    Komponenty Gateway i protokół WebSocket obsługujący aktualizacje obecności.
  </Card>
  <Card title="Protokół Gateway" href="/pl/gateway/protocol" icon="plug">
    Protokół komunikacji dla `connect`, `system-event` i `system-presence`.
  </Card>
</CardGroup>
