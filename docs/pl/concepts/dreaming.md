---
read_when:
    - Chcesz, aby promowanie pamięci uruchamiało się automatycznie
    - Chcesz zrozumieć, co robi każda faza Dreaming
    - Chcesz dostroić konsolidację bez zaśmiecania MEMORY.md
sidebarTitle: Dreaming
summary: Konsolidacja pamięci w tle z fazami snu lekkiego, głębokiego i REM oraz dziennikiem snów
title: Dreaming
x-i18n:
    generated_at: "2026-04-30T09:47:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85c323c073fc786069835aad25ee68781af49bb031e63b9601674461f385cc2a
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming to system konsolidacji pamięci w tle w `memory-core`. Pomaga OpenClaw przenosić silne sygnały krótkoterminowe do trwałej pamięci, jednocześnie utrzymując proces możliwym do wyjaśnienia i sprawdzenia.

<Note>
Dreaming jest **opcjonalny** i domyślnie wyłączony.
</Note>

## Co zapisuje dreaming

Dreaming przechowuje dwa rodzaje danych wyjściowych:

- **Stan maszyny** w `memory/.dreams/` (magazyn przywołań, sygnały faz, punkty kontrolne ingestii, blokady).
- **Dane wyjściowe czytelne dla człowieka** w `DREAMS.md` (lub istniejącym `dreams.md`) oraz opcjonalnych plikach raportów faz pod `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Promocja długoterminowa nadal zapisuje wyłącznie do `MEMORY.md`.

## Model faz

Dreaming używa trzech współpracujących faz:

| Faza  | Cel                                           | Trwały zapis      |
| ----- | --------------------------------------------- | ----------------- |
| Light | Sortowanie i przygotowanie ostatnich materiałów krótkoterminowych | Nie               |
| Deep  | Ocena i promowanie trwałych kandydatów        | Tak (`MEMORY.md`) |
| REM   | Refleksja nad motywami i powtarzającymi się ideami | Nie               |

Te fazy są wewnętrznymi szczegółami implementacji, a nie osobnymi „trybami” konfigurowanymi przez użytkownika.

<AccordionGroup>
  <Accordion title="Faza Light">
    Faza Light pobiera ostatnie dzienne sygnały pamięci i ślady przywołań, deduplikuje je i przygotowuje linie kandydatów.

    - Odczytuje stan przywołań krótkoterminowych, ostatnie dzienne pliki pamięci oraz zredagowane transkrypty sesji, gdy są dostępne.
    - Zapisuje zarządzany blok `## Light Sleep`, gdy magazyn zawiera wyjście inline.
    - Rejestruje sygnały wzmocnienia do późniejszego rankingu głębokiego.
    - Nigdy nie zapisuje do `MEMORY.md`.

  </Accordion>
  <Accordion title="Faza Deep">
    Faza Deep decyduje, co staje się pamięcią długoterminową.

    - Rankinguje kandydatów przy użyciu ważonej punktacji i bramek progowych.
    - Wymaga spełnienia `minScore`, `minRecallCount` i `minUniqueQueries`.
    - Ponownie wczytuje fragmenty z bieżących dziennych plików przed zapisem, więc nieaktualne/usunięte fragmenty są pomijane.
    - Dołącza promowane wpisy do `MEMORY.md`.
    - Zapisuje podsumowanie `## Deep Sleep` w `DREAMS.md` i opcjonalnie zapisuje `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="Faza REM">
    Faza REM wyodrębnia wzorce i sygnały refleksyjne.

    - Buduje podsumowania motywów i refleksji z ostatnich śladów krótkoterminowych.
    - Zapisuje zarządzany blok `## REM Sleep`, gdy magazyn zawiera wyjście inline.
    - Rejestruje sygnały wzmocnienia REM używane przez ranking głęboki.
    - Nigdy nie zapisuje do `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestia transkryptów sesji

Dreaming może pobierać zredagowane transkrypty sesji do korpusu dreamingu. Gdy transkrypty są dostępne, trafiają do fazy Light obok dziennych sygnałów pamięci i śladów przywołań. Treści osobiste i wrażliwe są redagowane przed ingestia.

## Dziennik snów

Dreaming przechowuje również narracyjny **Dziennik snów** w `DREAMS.md`. Gdy każda faza ma wystarczająco dużo materiału, `memory-core` uruchamia w tle w trybie best-effort turę subagenta i dołącza krótki wpis dziennika. Używa domyślnego modelu środowiska uruchomieniowego, chyba że skonfigurowano `dreaming.model`. Jeśli skonfigurowany model jest niedostępny, Dziennik snów ponawia próbę raz z domyślnym modelem sesji.

<Note>
Ten dziennik jest przeznaczony do czytania przez ludzi w interfejsie snów, a nie jako źródło promocji. Artefakty dziennika/raportów wygenerowane przez Dreaming są wyłączone z promocji krótkoterminowej. Tylko ugruntowane fragmenty pamięci kwalifikują się do promocji do `MEMORY.md`.
</Note>

Istnieje również ugruntowana historyczna ścieżka uzupełniania do pracy przeglądowej i odzyskiwania:

<AccordionGroup>
  <Accordion title="Polecenia uzupełniania">
    - `memory rem-harness --path ... --grounded` wyświetla podgląd ugruntowanego wyjścia dziennika z historycznych notatek `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` zapisuje odwracalne ugruntowane wpisy dziennika w `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` przygotowuje ugruntowanych trwałych kandydatów w tym samym magazynie dowodów krótkoterminowych, którego używa już normalna faza Deep.
    - `memory rem-backfill --rollback` i `--rollback-short-term` usuwają te przygotowane artefakty uzupełniania bez naruszania zwykłych wpisów dziennika ani bieżących krótkoterminowych przywołań.

  </Accordion>
</AccordionGroup>

Interfejs sterowania udostępnia ten sam przepływ uzupełniania/resetowania dziennika, aby można było sprawdzić wyniki w scenie snów przed podjęciem decyzji, czy ugruntowani kandydaci zasługują na promocję. Scena pokazuje też osobną ugruntowaną ścieżkę, dzięki czemu można zobaczyć, które przygotowane wpisy krótkoterminowe pochodzą z historycznego odtworzenia, które promowane elementy były prowadzone przez ugruntowanie, oraz wyczyścić tylko przygotowane wpisy wyłącznie ugruntowane bez naruszania zwykłego bieżącego stanu krótkoterminowego.

## Sygnały rankingu Deep

Ranking Deep używa sześciu ważonych sygnałów bazowych oraz wzmocnienia faz:

| Sygnał              | Waga | Opis                                       |
| ------------------- | ---- | ------------------------------------------ |
| Częstotliwość       | 0.24 | Ile sygnałów krótkoterminowych zgromadził wpis |
| Trafność            | 0.30 | Średnia jakość pobierania dla wpisu        |
| Różnorodność zapytań | 0.15 | Różne konteksty zapytań/dni, które go ujawniły |
| Aktualność          | 0.15 | Wynik świeżości z uwzględnieniem zaniku w czasie |
| Konsolidacja        | 0.10 | Siła powtarzalności przez wiele dni        |
| Bogactwo koncepcyjne | 0.06 | Gęstość tagów koncepcyjnych z fragmentu/ścieżki |

Trafienia faz Light i REM dodają niewielkie, malejące z czasem wzmocnienie z `memory/.dreams/phase-signals.json`.

## Harmonogram

Po włączeniu `memory-core` automatycznie zarządza jednym zadaniem cron dla pełnego przebiegu Dreaming. Każdy przebieg uruchamia fazy w kolejności: light → REM → deep.

Domyślne zachowanie kadencji:

| Ustawienie           | Domyślnie      |
| -------------------- | -------------- |
| `dreaming.frequency` | `0 3 * * *`    |
| `dreaming.model`     | model domyślny |

## Szybki start

<Tabs>
  <Tab title="Włącz dreaming">
    ```json
    {
      "plugins": {
        "entries": {
          "memory-core": {
            "config": {
              "dreaming": {
                "enabled": true
              }
            }
          }
        }
      }
    }
    ```
  </Tab>
  <Tab title="Niestandardowa kadencja przebiegu">
    ```json
    {
      "plugins": {
        "entries": {
          "memory-core": {
            "config": {
              "dreaming": {
                "enabled": true,
                "timezone": "America/Los_Angeles",
                "frequency": "0 */6 * * *"
              }
            }
          }
        }
      }
    }
    ```
  </Tab>
</Tabs>

## Polecenie slash

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Przepływ pracy CLI

<Tabs>
  <Tab title="Podgląd promocji / zastosowanie">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    Ręczne `memory promote` domyślnie używa progów fazy Deep, chyba że zostaną nadpisane flagami CLI.

  </Tab>
  <Tab title="Wyjaśnienie promocji">
    Wyjaśnij, dlaczego konkretny kandydat zostałby albo nie zostałby promowany:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Podgląd harness REM">
    Wyświetl podgląd refleksji REM, prawd kandydatów i wyników promocji Deep bez zapisywania czegokolwiek:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Kluczowe wartości domyślne

Wszystkie ustawienia znajdują się pod `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Włącz lub wyłącz przebieg Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Kadencja Cron dla pełnego przebiegu Dreaming.
</ParamField>
<ParamField path="model" type="string">
  Opcjonalne nadpisanie modelu subagenta Dziennika snów. Użyj kanonicznej wartości `provider/model`, gdy ustawiasz też listę dozwolonych modeli subagenta `allowedModels`.
</ParamField>

<Warning>
`dreaming.model` wymaga `plugins.entries.memory-core.subagent.allowModelOverride: true`. Aby je ograniczyć, ustaw również `plugins.entries.memory-core.subagent.allowedModels`. Błędy zaufania lub listy dozwolonych pozostają widoczne zamiast po cichu wracać do wartości zastępczej; ponowna próba obejmuje tylko błędy niedostępności modelu.
</Warning>

<Note>
Polityka faz, progi i zachowanie magazynu są wewnętrznymi szczegółami implementacji (nie konfiguracją widoczną dla użytkownika). Pełną listę kluczy znajdziesz w [referencji konfiguracji pamięci](/pl/reference/memory-config#dreaming).
</Note>

## Interfejs snów

Po włączeniu karta **Sny** w Gateway pokazuje:

- bieżący stan włączenia Dreaming
- status na poziomie faz i obecność zarządzanego przebiegu
- liczby krótkoterminowe, ugruntowane, sygnałów i promowanych dzisiaj
- czas następnego zaplanowanego uruchomienia
- osobną ugruntowaną ścieżkę sceny dla przygotowanych wpisów historycznego odtworzenia
- rozwijany czytnik Dziennika snów oparty na `doctor.memory.dreamDiary`

## Powiązane

- [Pamięć](/pl/concepts/memory)
- [CLI pamięci](/pl/cli/memory)
- [Referencja konfiguracji pamięci](/pl/reference/memory-config)
- [Wyszukiwanie pamięci](/pl/concepts/memory-search)
