---
read_when:
    - Włączanie podsumowań HealthKit w węźle iPhone’a
    - Wywoływanie health.summary lub rozwiązywanie problemów z brakującymi metrykami kondycji
    - Sprawdzanie, jakie dane zdrowotne mogą opuszczać iPhone’a
summary: Włączanie i wywoływanie podsumowań HealthKit z ochroną prywatności z poziomu Node na iPhonie
title: Podsumowania HealthKit
x-i18n:
    generated_at: "2026-07-16T18:47:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2f074c715ee1ef805ec953c301c03940e664c161f7f14c4388c83c64e222b557
    source_path: platforms/ios-healthkit.md
    workflow: 16
---

# Podsumowania HealthKit

OpenClaw może zażądać podsumowania bieżącego dnia kalendarzowego w trybie tylko do odczytu z
połączonego węzła iPhone’a. iPhone oblicza dane zagregowane na urządzeniu i zwraca
wyłącznie liczbę kroków, czas snu, średnie tętno spoczynkowe oraz liczbę
i czas trwania treningów. Poszczególne próbki HealthKit, źródła, metadane, dokumentacja
kliniczna, pobieranie danych w tle i zapisywanie nie są obsługiwane.

Ta funkcja jest domyślnie wyłączona. Wymaga osobnej zgody na iPhonie oraz
autoryzacji w Gateway.

## Wymagania

- iPhone z uruchomioną aplikacją OpenClaw na iOS, na którym HealthKit zgłasza dane zdrowotne jako
  dostępne.
- Połączony i zatwierdzony węzeł iPhone’a. Zobacz [konfigurację aplikacji na iOS](/pl/platforms/ios).
- Aktualna wersja Gateway, która może komunikować się z węzłem iPhone’a.
- Dane aplikacji Zdrowie możliwe do odczytu dla wszystkich oczekiwanych metryk. Apple Watch może
  dostarczać dane do magazynu aplikacji Zdrowie na iPhonie, ale aplikacja OpenClaw na watchOS
  nie jest wymagana do korzystania z podsumowań HealthKit.

## Włączanie dostępu

### 1. Autoryzacja polecenia Gateway

Dodaj `health.summary` do istniejącej tablicy `gateway.nodes.allowCommands` w
`openclaw.json`. Zachowaj wszystkie już obecne polecenia:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["health.summary"],
    },
  },
}
```

`health.summary` jest sklasyfikowane jako wymagające szczególnej ochrony prywatności i nigdy nie jest dozwolone przez
domyślne ustawienia platformy iOS. Wpis w `gateway.nodes.denyCommands` ma pierwszeństwo przed
wpisem zezwalającym. Zobacz [zasady poleceń węzła](/pl/nodes#command-policy).

### 2. Włączanie udostępniania na iPhonie

W aplikacji na iOS:

1. Otwórz **Settings -> Permissions -> Privacy & Access -> Health Summaries**.
2. Stuknij **Enable & Share Summaries**.
3. Przeczytaj informację, a następnie w arkuszu uprawnień Apple wybierz kategorie aplikacji Zdrowie, które OpenClaw może
   odczytywać.

Przełącznik zapisuje jednoznaczną decyzję o udostępnianiu danych OpenClaw. Nie oznacza to,
że Apple przyznało dostęp do każdej żądanej kategorii.

Włączenie podsumowań aplikacji Zdrowie dodaje `health.summary` do deklarowanego zestawu poleceń
węzła. Zatwierdź wynikającą z tego aktualizację parowania węzła:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

Następnie sprawdź, czy połączony iPhone udostępnia obowiązujące polecenie
`health.summary`:

```bash
openclaw nodes describe --node "<iPhone name>"
```

## Żądanie podsumowania z dzisiaj

Obsługiwane jest tylko `today`. Obejmuje ono okres od północy czasu lokalnego do chwili wysłania żądania,
zgodnie z bieżącym kalendarzem i strefą czasową iPhone’a.

```bash
openclaw nodes invoke \
  --node "<iPhone name>" \
  --command health.summary \
  --params '{"period":"today"}' \
  --json
```

Agenty mogą wywołać to samo polecenie za pomocą narzędzia `nodes`:

```json
{
  "action": "invoke",
  "node": "<iPhone name>",
  "invokeCommand": "health.summary",
  "invokeParamsJson": "{\"period\":\"today\"}"
}
```

Ładunek podsumowania zawiera:

| Pole                     | Znaczenie                                      |
| ------------------------ | --------------------------------------------- |
| `period`                 | Zawsze `today`                                |
| `startISO`               | Lokalny początek dnia zakodowany jako znacznik czasu ISO |
| `endISO`                 | Czas żądania zakodowany jako znacznik czasu ISO       |
| `timeZoneIdentifier`     | Identyfikator strefy czasowej iPhone’a                   |
| `stepCount`              | Zaokrąglona łączna liczba kroków                      |
| `sleepDurationMinutes`   | Czas snu po usunięciu duplikatów, ograniczony do dzisiejszego dnia    |
| `restingHeartRateBpm`    | Średnie tętno spoczynkowe                    |
| `workoutCount`           | Treningi rozpoczęte dzisiaj                   |
| `workoutDurationMinutes` | Łączny czas trwania tych treningów              |

Pola metryk są opcjonalne i zostają pominięte, gdy HealthKit nie zwraca żadnej wartości
możliwej do odczytu. Fazy snu i nakładające się źródła są scalane przed
obliczeniem czasu trwania, aby ta sama minuta nie została policzona dwukrotnie.

## Zasady ochrony prywatności

- Agregacja odbywa się na iPhonie. Surowe próbki nie opuszczają urządzenia.
- Żądane dane zagregowane opuszczają iPhone’a za pośrednictwem Gateway. Gdy zażąda ich agent,
  dane zagregowane trafiają do skonfigurowanego dostawcy AI i mogą pozostać
  w historii czatu. Bezpośrednie wywołanie przez CLI zwraca je operatorowi CLI.
- OpenClaw żąda wyłącznie dostępu do odczytu. Nie może dodawać ani modyfikować danych aplikacji Zdrowie.
- OpenClaw odczytuje HealthKit tylko po wywołaniu `health.summary`. Dane zdrowotne nie są
  pobierane w tle.
- HealthKit celowo nie ujawnia, czy odmówiono dostępu do odczytu. Brak
  metryki może oznaczać odmowę dostępu, brak pasujących próbek albo niedostępny
  typ danych. OpenClaw nie może rozróżnić tych przypadków.
- Podsumowanie służy do przedstawiania osobistego kontekstu dotyczącego zdrowia i sprawności fizycznej, a nie do diagnozowania ani
  udzielania porad medycznych.

Aby zatrzymać udostępnianie, wróć do **Health Summaries** i stuknij **Disable**. iPhone
usunie wtedy funkcję aplikacji Zdrowie oraz polecenie `health.summary` z zestawu funkcji
węzła. Można również usunąć `health.summary` z
`gateway.nodes.allowCommands`, aby zamknąć dostęp po stronie Gateway.

## Rozwiązywanie problemów

### Polecenie nie jest deklarowane przez węzeł

Sprawdź, czy podsumowania aplikacji Zdrowie są włączone w aplikacji na iOS i czy iPhone jest połączony.
Uruchom `openclaw nodes pending` i zatwierdź każdą aktualizację funkcji, a następnie ponownie sprawdź
`openclaw nodes describe --node "<iPhone name>"`.

### Polecenie wymaga jawnego wyrażenia zgody

Dodaj `health.summary` do `gateway.nodes.allowCommands`. Sprawdź również, czy
`gateway.nodes.denyCommands` go nie zawiera; lista odmów ma pierwszeństwo.

### `HEALTH_ACCESS_DISABLED`

Przełącznik udostępniania w aplikacji jest wyłączony. Włącz **Health Summaries** w sekcji
**Privacy & Access** na iPhonie.

### Podsumowanie zostaje zwrócone, ale brakuje metryk

Otwórz aplikację Zdrowie firmy Apple i sprawdź, czy istnieją dane z dzisiejszego dnia. Sprawdź
dostęp OpenClaw w ustawieniach aplikacji Zdrowie firmy Apple, ale nie traktuj pustego wyniku
jako dowodu odmowy dostępu: HealthKit celowo ukrywa to rozróżnienie.

### Starsze zakresy powodują błąd

Polecenie akceptuje tylko `{"period":"today"}`. Podsumowania wielodniowe i historyczne
nie są obsługiwane.

## Powiązane materiały

- [Aplikacja na iOS](/pl/platforms/ios)
- [Węzły](/pl/nodes)
- [Dokumentacja konfiguracji Gateway](/pl/gateway/configuration-reference#gateway)
- [Audyt bezpieczeństwa](/pl/gateway/security)
