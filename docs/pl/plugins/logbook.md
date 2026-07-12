---
read_when:
    - Chcesz mieć w interfejsie sterowania oś czasu swojego dnia w stylu Dayflow
    - Włączasz lub konfigurujesz dołączony Plugin Logbook
    - Chcesz, aby podsumowania ze stand-upów lub przypomnienie przebiegu dnia opierały się na aktywności na ekranie
summary: Opcjonalny automatyczny dziennik pracy tworzony na podstawie okresowych zrzutów ekranu
title: Plugin dziennika
x-i18n:
    generated_at: "2026-07-12T15:22:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3ea1d40d62041417d047fbaf6b02aeb86e76314b8f620f7b9939e2e0c3b9f7e
    source_path: plugins/logbook.md
    workflow: 16
---

Plugin Logbook przekształca aktywność na ekranie w automatyczny dziennik pracy. Okresowo
przechwytuje zrzuty ekranu ze sparowanego węzła, podsumowuje je w postaci
obserwacji ze znacznikami czasu i tworzy karty osi czasu w
[interfejsie sterowania](/pl/web/control-ui). Może także generować codzienne notatki
na spotkanie statusowe i odpowiadać na pytania dotyczące śledzonego dnia.

Stan należący do OpenClaw pozostaje na Gateway w `<state-dir>/logbook/`, ale
przetwarzanie przez modele nie musi odbywać się lokalnie. Wybrane zrzuty ekranu
są wysyłane do skonfigurowanej trasy modelu wizyjnego, a obserwacje i tekst osi
czasu — do domyślnego modelu agenta. Jeśli zawartość ekranu i utworzony na jej
podstawie opis aktywności muszą pozostać na komputerze, użyj lokalnych tras
modeli na obu etapach.

Logbook jest dołączony, ale domyślnie wyłączony. Włączenie Pluginu oznacza zgodę
na przechwytywanie ekranu przez Gateway, ponieważ `captureEnabled` ma domyślnie
wartość `true`.

## Zanim zaczniesz

Potrzebujesz:

- Połączonego węzła udostępniającego `screen.snapshot` lub `logbook.snapshot`.
  Węzeł aplikacji macOS wymaga uprawnienia do nagrywania ekranu. Bezinterfejsowy
  host węzła macOS (`openclaw node host run`) otrzymuje udostępniane przez Plugin
  polecenie `logbook.snapshot`, korzystające z systemowego narzędzia
  `screencapture`.
- Włączonego i uwierzytelnionego dołączonego Pluginu Codex. Obecnie Codex
  zapewnia kontrakt ustrukturyzowanego wyodrębniania z obrazów wymagany przez
  Logbook. Zaloguj się za pomocą
  `openclaw models auth login --provider openai`; inne metody uwierzytelniania
  opisano w sekcji [Środowisko uruchomieniowe Codex](/pl/plugins/codex-harness).
- Działającego domyślnego modelu agenta. Po przejściu modelu wizyjnego Logbook
  używa go do syntezowania kart, notatek na spotkanie statusowe oraz odpowiedzi
  na pytania dotyczące dnia.

## Szybki start

Włącz Pluginy Codex i Logbook:

```bash
openclaw plugins enable codex
openclaw plugins enable logbook
```

Skonfiguruj jawnie model wizyjny, aby zapewnić deterministyczne uruchamianie:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          visionModel: "codex/gpt-5.6-sol",
        },
      },
    },
  },
}
```

Jeśli używasz `plugins.allow`, uwzględnij zarówno `codex`, jak i `logbook`.
Po zmianie konfiguracji Pluginu uruchom ponownie Gateway, a następnie sprawdź
rejestracje i otwórz panel:

```bash
openclaw gateway restart
openclaw plugins inspect logbook --runtime --json
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw dashboard
```

Opis węzła musi zawierać `screen.snapshot` lub `logbook.snapshot`. Węzły
bezinterfejsowe ogłaszają `logbook.snapshot` dopiero po aktywowaniu Pluginu.
Jeśli brakuje polecenia, zobacz
[Rozwiązywanie problemów z węzłami](/pl/nodes/troubleshooting).

Karta Logbook pojawia się tylko przy włączonym Pluginie i sesji interfejsu
sterowania z zakresem `operator.write`. Wiersz stanu powinien pokazywać
**Przechwytywanie** bez błędu. Karta osi czasu pojawia się po zamknięciu okna
analizy; po przechwyceniu aktywności możesz też wybrać **Analizuj teraz**.

## Jak to działa

1. **Przechwytywanie**: co `captureIntervalSeconds` (domyślnie 30 s) Logbook
   wywołuje polecenie przechwytywania wybranego węzła i zapisuje przeskalowaną
   klatkę JPEG. Kolejne identyczne klatki są oznaczane jako bezczynne i wykluczane
   z analizy.
2. **Obserwacja**: po upływie okna analizy (domyślnie 15 minut) Plugin wybiera
   maksymalnie 16 aktywnych klatek i wysyła je do modelu wizyjnego, który zwraca
   obserwacje aktywności ze znacznikami czasu („VS Code: edytowanie store.ts,
   naprawianie błędu typu”). Bieżące okno zamyka również przerwa w przechwytywaniu
   dłuższa niż dwie minuty lub lokalna północ.
3. **Synteza**: obserwacje wraz z kartami z ostatnich 45 minut są przekształcane
   w karty osi czasu (po 10–60 minut każda) zawierające tytuł, podsumowanie,
   kategorię, główną aplikację i krótkie rozproszenia uwagi.
4. **Czyszczenie**: klatki starsze niż `retentionDays` (domyślnie 14) są usuwane.
   Karty, obserwacje i zapisane w pamięci podręcznej notatki na spotkania
   statusowe są zachowywane.

Granice dni i zegary osi czasu używają lokalnej strefy czasowej Gateway, a nie
strefy czasowej przeglądarki. Klatki i baza danych SQLite osi czasu znajdują się
w `<state-dir>/logbook/`.

## Przepływ modeli i danych

Logbook używa dwóch oddzielnych tras modeli:

| Etap                         | Wysyłane dane                                               | Trasa modelu                                                       |
| ---------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------ |
| Obserwacja                   | Maksymalnie 16 wybranych klatek JPEG i czasy ich przechwycenia | `visionModel` lub zgodny, zapożyczony wpis Codex `tools.media`      |
| Synteza kart                 | Obserwacje ze znacznikami czasu i najnowsze karty osi czasu | Domyślny model agenta przez środowisko uruchomieniowe LLM Pluginu   |
| Generowanie notatki statusowej | Karty z wybranego i poprzedniego dnia                       | Domyślny model agenta przez środowisko uruchomieniowe LLM Pluginu   |
| Pytania o dzień              | Pytanie, karty z wybranego dnia i najnowsze obserwacje      | Domyślny model agenta przez środowisko uruchomieniowe LLM Pluginu   |

Pełna baza danych SQLite nie jest wysyłana do żadnego modelu. Surowe zrzuty
ekranu trafiają wyłącznie do etapu obserwacji; synteza kart, notatka statusowa
i odpowiedzi na pytania otrzymują tekst utworzony na ich podstawie.

## Konfiguracja

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          captureEnabled: true,
          captureIntervalSeconds: 30,
          analysisIntervalMinutes: 15,
          nodeId: "my-mac",
          screenIndex: 0,
          maxWidth: 1440,
          visionModel: "codex/gpt-5.6-sol",
          retentionDays: 14,
        },
      },
    },
  },
}
```

Wszystkie klucze konfiguracji Logbook są opcjonalne. Wartości liczbowe są
zaokrąglane do liczb całkowitych i ograniczane do obsługiwanego zakresu.

| Klucz                     | Wartość domyślna | Zakres lub wartości       | Działanie                                                                                              |
| ------------------------- | ---------------- | ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `captureEnabled`          | `true`           | wartość logiczna          | Trwały przełącznik główny nowych zrzutów; oś czasu pozostaje dostępna przy wartości `false`             |
| `captureIntervalSeconds`  | `30`             | `5`–`600`                 | Opóźnienie między próbami przechwytywania                                                               |
| `analysisIntervalMinutes` | `15`             | `3`–`120`                 | Docelowe okno obserwacji; przerwy i północ mogą zamknąć je wcześniej                                   |
| `nodeId`                  | nie ustawiono    | identyfikator lub nazwa wyświetlana węzła | Przypisuje przechwytywanie do jednego połączonego węzła; dopasowanie nie rozróżnia wielkości liter |
| `screenIndex`             | `0`              | `0`–`16`                  | Indeks ekranu liczony od zera                                                                           |
| `maxWidth`                | `1440`           | `480`–`3840`              | Żądany limit rozmiaru przechwytywania; bezinterfejsowy macOS stosuje go do największego wymiaru         |
| `visionModel`             | nie ustawiono    | `provider/model`          | Jawna trasa strukturyzowana; nieprawidłowe odwołania wstrzymują analizę, a nieobsługiwani dostawcy powodują niepowodzenie partii |
| `retentionDays`           | `14`             | `1`–`365`                 | Usuwa stare klatki; karty, obserwacje i notatki statusowe pozostają                                     |

Bez `nodeId` Logbook preferuje połączony węzeł aplikacji udostępniający
`screen.snapshot`, a następnie używa węzła bezinterfejsowego udostępniającego
`logbook.snapshot`. W konfiguracji bez przypiętego węzła węzeł, na którym
wystąpił błąd, jest przesuwany za inne kwalifikujące się węzły. Przełącznik
wstrzymania w panelu obowiązuje tylko w bieżącej sesji i jest resetowany po
ponownym uruchomieniu Gateway; aby trwale zatrzymać działanie, użyj
`captureEnabled: false`.

### Wybór modelu wizyjnego

Logbook wybiera model obserwacji w następującej kolejności:

1. `plugins.entries.logbook.config.visionModel`
2. pierwszy wpis Codex obsługujący obrazy w `tools.media.image.models`
3. pierwszy wpis Codex obsługujący obrazy w `tools.media.models`

Inni dostawcy multimediów są pomijani, ponieważ obecnie nie udostępniają
kontraktu ustrukturyzowanego wyodrębniania wymaganego przez Logbook. Ustawienie
`tools.media.image.enabled: false` wyłącza zapożyczone domyślne modele
multimediów, ale jawny `visionModel` Logbook nadal obowiązuje.

## Karta panelu

- **Oś czasu**: rozwijane karty poszczególnych aktywności z kolorami kategorii,
  główną aplikacją, znacznikami rozproszeń uwagi i klatką kluczową zrzutu.
- **Dzień w skrócie**: współczynnik skupienia, podział na kategorie, najczęściej
  używane aplikacje.
- **Codzienna notatka statusowa**: przekształca dane z wczoraj i dziś w gotową
  do wklejenia aktualizację.
- **Zapytaj o swój dzień**: pytania w języku naturalnym, na które odpowiedzi są
  tworzone na podstawie śledzonej osi czasu („kiedy sprawdzałem żądanie
  ściągnięcia dotyczące Gateway?”).
- **Analizuj teraz**: natychmiast zamyka bieżące okno przechwytywania zamiast
  czekać na upływ interwału analizy.

## Metody Gateway

Logbook rejestruje następujące metody RPC Gateway:

| Metoda                | Parametry                | Zakres           | Wynik                                                                                 |
| --------------------- | ------------------------ | ---------------- | ------------------------------------------------------------------------------------- |
| `logbook.status`      | brak                     | `operator.read`  | Stan przechwytywania, analizy, modelu, węzła, dnia Gateway i strefy czasowej Gateway  |
| `logbook.days`        | brak                     | `operator.read`  | Dni z liczbą kart osi czasu oraz granicami czasowymi kart                              |
| `logbook.timeline`    | `{ day?: "YYYY-MM-DD" }` | `operator.read`  | Utworzone karty i statystyki dnia; domyślnie bieżący dzień Gateway                    |
| `logbook.frames`      | `{ startMs, endMs }`     | `operator.write` | Metadane klatek w żądanym zakresie milisekund epoki                                    |
| `logbook.frame`       | `{ frameId }`            | `operator.write` | Pojedyncza surowa klatka JPEG w formacie base64                                        |
| `logbook.standup`     | `{ day?, refresh? }`     | `operator.write` | Zapisany w pamięci podręcznej lub ponownie wygenerowany tekst notatki statusowej na dany dzień |
| `logbook.ask`         | `{ day?, question }`     | `operator.write` | Odpowiedź dotycząca dnia oparta na osi czasu                                           |
| `logbook.capture.set` | `{ paused }`             | `operator.write` | Stan wstrzymania tylko dla sesji oraz zaktualizowany stan                              |
| `logbook.analyze.now` | brak                     | `operator.write` | Rozpoczyna oczekującą analizę lub zwraca powód, dla którego nie można jej rozpocząć    |

Metody odczytu zwracają stan operacyjny lub utworzony tekst. Dostęp do surowych
pikseli zrzutów ekranu, operacje powodujące użycie płatnych modeli i modyfikacje
środowiska uruchomieniowego wymagają `operator.write`. Karta interfejsu
sterowania również wymaga `operator.write`, ponieważ udostępnia te operacje
i podgląd surowych klatek; klient tylko do odczytu nadal może bezpośrednio
wywoływać metody zwracające utworzony tekst.

## Uwagi dotyczące prywatności

- Zrzuty mogą zawierać wszystko, co znajduje się na ekranie, w tym dane
  poufne. Klatki nie opuszczają komputera poza przypadkiem, gdy wybrane próbki
  są wysyłane do skonfigurowanego modelu obserwacji.
- Obserwacje, najnowsze karty i pytania mogą opuścić komputer za pośrednictwem
  domyślnego modelu agenta podczas syntezy kart, generowania notatki statusowej
  lub odpowiadania na pytania. Zastosuj zasady dostawcy dotyczące przetwarzania
  danych do obu tras modeli.
- Jeśli potrzebujesz w pełni lokalnego potoku, użyj lokalnych tras zarówno dla
  ustrukturyzowanego modelu obserwacji, jak i domyślnego modelu agenta.
- Klatki, baza danych osi czasu i tymczasowe przechwycenia są zapisywane
  z uprawnieniami dostępu wyłącznie dla właściciela.
- Dodanie `screen.snapshot` do `gateway.nodes.denyCommands` działa jako
  wyłącznik przechwytywania ekranu: blokuje zarówno przechwytywanie przez węzeł
  aplikacji, jak i własne polecenie Logbook `logbook.snapshot`.
- Ustawienie `tools.media.image.enabled: false` uniemożliwia również Logbook
  korzystanie z zapożyczonych modeli obrazu do analizy; wówczas używany jest
  wyłącznie jawny `visionModel` z konfiguracji Pluginu.

## Rozwiązywanie problemów

### Brak karty Logbook

Sprawdź wszystkie trzy warunki:

1. `openclaw plugins list --enabled` zawiera `logbook`.
2. Gateway został ponownie uruchomiony po zmianie Pluginu lub listy dozwolonych
   Pluginów.
3. Połączenie interfejsu sterowania ma zakres `operator.write`; sesje tylko do
   odczytu nie otrzymują deskryptora interaktywnej karty.

Jeśli ustawiono `plugins.allow`, zalecana konfiguracja wymaga uwzględnienia w niej zarówno `logbook`, jak i `codex`.

### Przechwytywanie zgłasza błąd

```bash
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw logs --follow
```

- Upewnij się, że węzeł udostępnia `screen.snapshot` lub `logbook.snapshot`.
- Przyznaj uprawnienie do nagrywania ekranu na komputerze Mac wykonującym przechwytywanie.
- Jeśli skonfigurowano `nodeId`, upewnij się, że odpowiada identyfikatorowi węzła lub jego nazwie wyświetlanej.
- Sprawdź, czy `gateway.nodes.denyCommands` nie zawiera
  `screen.snapshot`.

Po trzech kolejnych niepowodzeniach Logbook wstrzymuje działanie na dziesięć cykli przechwytywania, a następnie ponawia próbę. Konfiguracja bez przypisanego węzła może przełączyć się na inny kwalifikujący się węzeł.

### Przechwytywanie działa, ale nie pojawiają się żadne karty

- Stan **Brak modelu** oznacza, że nie znaleziono zgodnej trasy ustrukturyzowanego przetwarzania obrazu. Włącz i uwierzytelnij plugin Codex albo ustaw prawidłową, jawną wartość `visionModel`. Przechwycone klatki pozostają oczekujące, gdy brakuje modelu, i mogą zostać przeanalizowane po poprawieniu konfiguracji.
- Poczekaj przez czas określony przez `analysisIntervalMinutes` albo wybierz **Analizuj teraz** po przechwyceniu aktywności.
- Kolejne identyczne klatki stanowią dowód bezczynności i nie trafiają do partii analizy. Przed testowaniem zmień widoczną zawartość ekranu.
- Jeśli najnowsza partia zawiera błąd, rozwiąż problem z modelem lub uwierzytelnianiem i wybierz **Analizuj teraz**. Ponawianie nieudanych partii następuje wyłącznie po tym jawnym działaniu, aby uniknąć wielokrotnego naliczania kosztów użycia modelu.

## Powiązane

- [Zarządzanie pluginami](/pl/plugins/manage-plugins)
- [Środowisko Codex](/pl/plugins/codex-harness)
- [Rozpoznawanie multimediów](/pl/nodes/media-understanding)
- [Węzły](/pl/nodes)
- [Rozwiązywanie problemów z węzłami](/pl/nodes/troubleshooting)
- [Interfejs sterowania](/pl/web/control-ui)
