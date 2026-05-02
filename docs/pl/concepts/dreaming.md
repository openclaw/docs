---
read_when:
    - Chcesz, aby promowanie pamięci uruchamiało się automatycznie
    - Chcesz zrozumieć, co robi każda faza Dreaming
    - Chcesz dostroić konsolidację bez zaśmiecania MEMORY.md
sidebarTitle: Dreaming
summary: Konsolidacja pamięci w tle z fazami lekką, głęboką i REM oraz Dziennikiem snów
title: Dreaming
x-i18n:
    generated_at: "2026-05-02T09:47:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23057bfeaaac1cc6b2bf2ee78928c8fdd820c817e461cc0b77f7c1e40ac14c22
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming to działający w tle system konsolidacji pamięci w `memory-core`. Pomaga OpenClaw przenosić silne sygnały krótkoterminowe do trwałej pamięci, zachowując jednocześnie wyjaśnialność i możliwość przeglądu procesu.

<Note>
Dreaming jest **opcjonalny** i domyślnie wyłączony.
</Note>

## Co zapisuje Dreaming

Dreaming utrzymuje dwa rodzaje danych wyjściowych:

- **Stan maszynowy** w `memory/.dreams/` (magazyn przywołań, sygnały faz, punkty kontrolne przetwarzania, blokady).
- **Dane czytelne dla człowieka** w `DREAMS.md` (lub istniejącym `dreams.md`) oraz opcjonalne pliki raportów faz w `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Promocja do pamięci długoterminowej nadal zapisuje wyłącznie do `MEMORY.md`.

## Model faz

Dreaming używa trzech współpracujących faz:

| Faza  | Cel                                                  | Trwały zapis      |
| ----- | ---------------------------------------------------- | ----------------- |
| Light | Sortowanie i przygotowywanie niedawnego materiału krótkoterminowego | Nie               |
| Deep  | Ocenianie i promowanie trwałych kandydatów           | Tak (`MEMORY.md`) |
| REM   | Refleksja nad motywami i powracającymi pomysłami     | Nie               |

Te fazy są wewnętrznymi szczegółami implementacji, a nie oddzielnymi „trybami” konfigurowanymi przez użytkownika.

<AccordionGroup>
  <Accordion title="Faza Light">
    Faza Light pobiera niedawne dzienne sygnały pamięci i ślady przywołań, usuwa duplikaty oraz przygotowuje wiersze kandydatów.

    - Odczytuje krótkoterminowy stan przywołań, niedawne dzienne pliki pamięci oraz zredagowane transkrypcje sesji, gdy są dostępne.
    - Zapisuje zarządzany blok `## Light Sleep`, gdy magazyn obejmuje wyjście wbudowane.
    - Rejestruje sygnały wzmocnienia na potrzeby późniejszego rankingu głębokiego.
    - Nigdy nie zapisuje do `MEMORY.md`.

  </Accordion>
  <Accordion title="Faza Deep">
    Faza Deep decyduje, co trafia do pamięci długoterminowej.

    - Porządkuje kandydatów za pomocą ważonej punktacji i progów.
    - Wymaga spełnienia `minScore`, `minRecallCount` i `minUniqueQueries`.
    - Przed zapisem ponownie nawadnia fragmenty z aktywnych plików dziennych, więc nieaktualne lub usunięte fragmenty są pomijane.
    - Dopisuje wypromowane wpisy do `MEMORY.md`.
    - Zapisuje podsumowanie `## Deep Sleep` w `DREAMS.md` i opcjonalnie zapisuje `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="Faza REM">
    Faza REM wydobywa wzorce i sygnały refleksyjne.

    - Buduje podsumowania motywów i refleksji z niedawnych śladów krótkoterminowych.
    - Zapisuje zarządzany blok `## REM Sleep`, gdy magazyn obejmuje wyjście wbudowane.
    - Rejestruje sygnały wzmocnienia REM używane przez ranking głęboki.
    - Nigdy nie zapisuje do `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Przetwarzanie transkrypcji sesji

Dreaming może przetwarzać zredagowane transkrypcje sesji do korpusu Dreaming. Gdy transkrypcje są dostępne, trafiają do fazy Light razem z dziennymi sygnałami pamięci i śladami przywołań. Treści osobiste i wrażliwe są redagowane przed przetwarzaniem.

## Dream Diary

Dreaming utrzymuje także narracyjny **Dream Diary** w `DREAMS.md`. Gdy każda faza ma wystarczająco dużo materiału, `memory-core` uruchamia w tle turę subagenta w trybie best-effort i dopisuje krótki wpis dziennika. Używa domyślnego modelu wykonawczego, chyba że skonfigurowano `dreaming.model`. Jeśli skonfigurowany model jest niedostępny, Dream Diary ponawia próbę raz z domyślnym modelem sesji.

<Note>
Ten dziennik jest przeznaczony do czytania przez ludzi w interfejsie Dreams, a nie jako źródło promocji. Artefakty dziennika i raportów wygenerowane przez Dreaming są wykluczone z promocji krótkoterminowej. Tylko ugruntowane fragmenty pamięci kwalifikują się do promocji do `MEMORY.md`.
</Note>

Istnieje także ugruntowana historyczna ścieżka uzupełniania danych do prac przeglądowych i odzyskiwania:

<AccordionGroup>
  <Accordion title="Polecenia uzupełniania">
    - `memory rem-harness --path ... --grounded` wyświetla podgląd ugruntowanego wyjścia dziennika z historycznych notatek `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` zapisuje odwracalne ugruntowane wpisy dziennika do `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` przygotowuje ugruntowanych trwałych kandydatów w tym samym krótkoterminowym magazynie dowodów, którego używa już normalna faza Deep.
    - `memory rem-backfill --rollback` i `--rollback-short-term` usuwają te przygotowane artefakty uzupełniania bez dotykania zwykłych wpisów dziennika ani aktywnych krótkoterminowych przywołań.

  </Accordion>
</AccordionGroup>

Control UI udostępnia ten sam przepływ uzupełniania/resetowania dziennika, aby można było sprawdzić wyniki w scenie Dreams przed podjęciem decyzji, czy ugruntowani kandydaci zasługują na promocję. Scena pokazuje także oddzielną ugruntowaną ścieżkę, dzięki czemu można zobaczyć, które przygotowane wpisy krótkoterminowe pochodzą z odtwarzania historii, które wypromowane elementy zostały prowadzone przez ugruntowanie, oraz wyczyścić tylko przygotowane wpisy wyłącznie ugruntowane bez dotykania zwykłego aktywnego stanu krótkoterminowego.

## Sygnały rankingu Deep

Ranking Deep używa sześciu ważonych sygnałów bazowych oraz wzmocnienia faz:

| Sygnał              | Waga | Opis                                              |
| ------------------- | ---- | ------------------------------------------------- |
| Częstotliwość       | 0.24 | Ile sygnałów krótkoterminowych zgromadził wpis    |
| Trafność            | 0.30 | Średnia jakość pobierania dla wpisu               |
| Różnorodność zapytań | 0.15 | Różne konteksty zapytań/dni, w których wpis się pojawił |
| Świeżość            | 0.15 | Wynik świeżości z wygaszaniem w czasie            |
| Konsolidacja        | 0.10 | Siła powtarzalności wielodniowej                  |
| Bogactwo pojęciowe  | 0.06 | Gęstość tagów pojęć z fragmentu/ścieżki           |

Trafienia faz Light i REM dodają niewielkie, wygaszane w czasie wzmocnienie świeżości z `memory/.dreams/phase-signals.json`.

## Harmonogram

Po włączeniu `memory-core` automatycznie zarządza jednym zadaniem Cron dla pełnego przebiegu Dreaming. Każdy przebieg uruchamia fazy w kolejności: Light → REM → Deep.

Przebieg obejmuje główny obszar roboczy środowiska wykonawczego oraz wszystkie skonfigurowane obszary robocze agentów, z deduplikacją według ścieżki, więc rozgałęzienie obszarów roboczych subagentów nie wyklucza `DREAMS.md` i stanu pamięci głównego agenta.

Domyślne zachowanie kadencji:

| Ustawienie           | Domyślnie       |
| -------------------- | --------------- |
| `dreaming.frequency` | `0 3 * * *`     |
| `dreaming.model`     | model domyślny  |

## Szybki start

<Tabs>
  <Tab title="Włącz Dreaming">
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

## Polecenie ukośnikiem

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
  <Tab title="Wyjaśnij promocję">
    Wyjaśnij, dlaczego konkretny kandydat zostałby albo nie zostałby wypromowany:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Podgląd uprzęży REM">
    Wyświetl podgląd refleksji REM, prawd kandydatów i wyjścia promocji Deep bez zapisywania czegokolwiek:

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
  Opcjonalne nadpisanie modelu subagenta Dream Diary. Użyj kanonicznej wartości `provider/model`, gdy ustawiasz także listę dozwolonych modeli subagenta `allowedModels`.
</ParamField>

<Warning>
`dreaming.model` wymaga `plugins.entries.memory-core.subagent.allowModelOverride: true`. Aby je ograniczyć, ustaw także `plugins.entries.memory-core.subagent.allowedModels`. Błędy zaufania lub listy dozwolonych pozostają widoczne zamiast cichego przełączenia na ustawienie zapasowe; ponowienie obejmuje tylko błędy niedostępności modelu.
</Warning>

<Note>
Polityka faz, progi i zachowanie magazynu są wewnętrznymi szczegółami implementacji (nie konfiguracją widoczną dla użytkownika). Pełną listę kluczy znajdziesz w [odniesieniu do konfiguracji pamięci](/pl/reference/memory-config#dreaming).
</Note>

## Interfejs Dreams

Po włączeniu karta **Dreams** w Gateway pokazuje:

- bieżący stan włączenia Dreaming
- stan na poziomie faz i obecność zarządzanego przebiegu
- liczbę elementów krótkoterminowych, ugruntowanych, sygnałów i wypromowanych dzisiaj
- termin następnego zaplanowanego uruchomienia
- oddzielną ugruntowaną ścieżkę Sceny dla przygotowanych wpisów odtwarzania historycznego
- rozwijany czytnik Dream Diary oparty na `doctor.memory.dreamDiary`

## Powiązane

- [Pamięć](/pl/concepts/memory)
- [CLI pamięci](/pl/cli/memory)
- [Odniesienie do konfiguracji pamięci](/pl/reference/memory-config)
- [Wyszukiwanie pamięci](/pl/concepts/memory-search)
