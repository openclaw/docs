---
read_when:
    - Chcesz, aby promocja pamięci uruchamiała się automatycznie
    - Chcesz zrozumieć, co robi każda faza Dreaming
    - Chcesz dostroić konsolidację bez zanieczyszczania MEMORY.md
sidebarTitle: Dreaming
summary: Konsolidacja pamięci w tle z fazami lekką, głęboką i REM oraz Dziennikiem snów
title: Dreaming
x-i18n:
    generated_at: "2026-05-02T22:18:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: b56f93c68f53178e0998b9809ff358910956260f72ff7213b7d0dd92300f5d24
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming to system konsolidacji pamięci w tle w `memory-core`. Pomaga OpenClaw przenosić silne sygnały krótkoterminowe do trwałej pamięci, zachowując przy tym proces jako możliwy do wyjaśnienia i przejrzenia.

<Note>
Dreaming jest **opcjonalny** i domyślnie wyłączony.
</Note>

## Co zapisuje Dreaming

Dreaming przechowuje dwa rodzaje wyników:

- **Stan maszyny** w `memory/.dreams/` (magazyn przywołań, sygnały faz, punkty kontrolne ingestii, blokady).
- **Wynik czytelny dla człowieka** w `DREAMS.md` (lub istniejącym `dreams.md`) oraz opcjonalnych plikach raportów faz w `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Promocja długoterminowa nadal zapisuje wyłącznie do `MEMORY.md`.

## Model faz

Dreaming używa trzech współpracujących faz:

| Faza | Cel                                             | Trwały zapis      |
| ---- | ----------------------------------------------- | ----------------- |
| Light | Sortowanie i etapowanie ostatnich materiałów krótkoterminowych | Nie               |
| Deep | Ocena i promowanie trwałych kandydatów           | Tak (`MEMORY.md`) |
| REM  | Refleksja nad motywami i powracającymi ideami    | Nie               |

Te fazy są wewnętrznymi szczegółami implementacji, a nie oddzielnymi „trybami” konfigurowanymi przez użytkownika.

<AccordionGroup>
  <Accordion title="Faza Light">
    Faza Light pobiera ostatnie dzienne sygnały pamięci i ślady przywołań, deduplikuje je oraz etapuje linie kandydatów.

    - Odczytuje stan krótkoterminowych przywołań, ostatnie dzienne pliki pamięci i zredagowane transkrypty sesji, gdy są dostępne.
    - Zapisuje zarządzany blok `## Light Sleep`, gdy magazyn obejmuje wynik inline.
    - Rejestruje sygnały wzmocnienia do późniejszego rankingu Deep.
    - Nigdy nie zapisuje do `MEMORY.md`.

  </Accordion>
  <Accordion title="Faza Deep">
    Faza Deep decyduje, co staje się pamięcią długoterminową.

    - Klasyfikuje kandydatów przy użyciu ważonej punktacji i progów bramkujących.
    - Wymaga spełnienia `minScore`, `minRecallCount` i `minUniqueQueries`.
    - Ponownie nawadnia fragmenty z aktywnych dziennych plików przed zapisem, więc przestarzałe/usunięte fragmenty są pomijane.
    - Dopisuje promowane wpisy do `MEMORY.md`.
    - Zapisuje podsumowanie `## Deep Sleep` w `DREAMS.md` i opcjonalnie zapisuje `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="Faza REM">
    Faza REM wyodrębnia wzorce i sygnały refleksyjne.

    - Buduje podsumowania motywów i refleksji z ostatnich śladów krótkoterminowych.
    - Zapisuje zarządzany blok `## REM Sleep`, gdy magazyn obejmuje wynik inline.
    - Rejestruje sygnały wzmocnienia REM używane przez ranking Deep.
    - Nigdy nie zapisuje do `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestia transkryptów sesji

Dreaming może ingestować zredagowane transkrypty sesji do korpusu Dreaming. Gdy transkrypty są dostępne, są przekazywane do fazy Light razem z dziennymi sygnałami pamięci i śladami przywołań. Treści osobiste i wrażliwe są redagowane przed ingestą.

## Dziennik snów

Dreaming utrzymuje też narracyjny **Dziennik snów** w `DREAMS.md`. Gdy każda faza ma wystarczająco dużo materiału, `memory-core` uruchamia w tle próbę subagenta w trybie najlepszych starań i dopisuje krótki wpis dziennika. Używa domyślnego modelu runtime, chyba że skonfigurowano `dreaming.model`. Jeśli skonfigurowany model jest niedostępny, Dziennik snów ponawia próbę raz z domyślnym modelem sesji.

<Note>
Ten dziennik jest przeznaczony do czytania przez ludzi w interfejsie Dreams, a nie jako źródło promocji. Artefakty dziennika/raportów wygenerowane przez Dreaming są wyłączone z promocji krótkoterminowej. Tylko ugruntowane fragmenty pamięci kwalifikują się do promocji do `MEMORY.md`.
</Note>

Istnieje także ugruntowana ścieżka historycznego backfillu do prac przeglądowych i odzyskiwania:

<AccordionGroup>
  <Accordion title="Polecenia backfillu">
    - `memory rem-harness --path ... --grounded` wyświetla podgląd ugruntowanego wyniku dziennika z historycznych notatek `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` zapisuje odwracalne, ugruntowane wpisy dziennika w `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` etapuje ugruntowanych trwałych kandydatów w tym samym magazynie krótkoterminowych dowodów, którego używa już zwykła faza Deep.
    - `memory rem-backfill --rollback` i `--rollback-short-term` usuwają te etapowane artefakty backfillu bez naruszania zwykłych wpisów dziennika ani aktywnych krótkoterminowych przywołań.

  </Accordion>
</AccordionGroup>

Control UI udostępnia ten sam przepływ backfillu/resetu dziennika, aby można było sprawdzić wyniki w scenie Dreams przed decyzją, czy ugruntowani kandydaci zasługują na promocję. Scena pokazuje też osobną ugruntowaną ścieżkę, dzięki czemu widać, które etapowane wpisy krótkoterminowe pochodzą z historycznego odtworzenia, które promowane elementy były prowadzone przez ugruntowanie, oraz można wyczyścić tylko ugruntowane etapowane wpisy bez naruszania zwykłego aktywnego stanu krótkoterminowego.

## Sygnały rankingu Deep

Ranking Deep używa sześciu ważonych sygnałów bazowych oraz wzmocnienia faz:

| Sygnał              | Waga | Opis                                              |
| ------------------- | ---- | ------------------------------------------------- |
| Częstotliwość       | 0.24 | Ile sygnałów krótkoterminowych zgromadził wpis   |
| Trafność            | 0.30 | Średnia jakość pobierania dla wpisu              |
| Różnorodność zapytań | 0.15 | Odrębne konteksty zapytań/dni, w których się pojawił |
| Świeżość            | 0.15 | Punktacja świeżości z zanikiem w czasie          |
| Konsolidacja        | 0.10 | Siła powtarzania się przez wiele dni             |
| Bogactwo pojęciowe  | 0.06 | Gęstość tagów pojęć z fragmentu/ścieżki          |

Trafienia faz Light i REM dodają niewielkie wzmocnienie z zanikiem świeżości z `memory/.dreams/phase-signals.json`.

## Harmonogram

Po włączeniu `memory-core` automatycznie zarządza jednym zadaniem cron dla pełnego przebiegu Dreaming. Każdy przebieg uruchamia fazy w kolejności: Light → REM → Deep.

Przebieg obejmuje główny obszar roboczy runtime oraz wszystkie skonfigurowane obszary robocze agentów, zdeduplikowane według ścieżki, więc rozproszenie obszarów roboczych subagentów nie wyklucza `DREAMS.md` i stanu pamięci głównego agenta.

Domyślne działanie kadencji:

| Ustawienie           | Domyślnie      |
| -------------------- | -------------- |
| `dreaming.frequency` | `0 3 * * *`    |
| `dreaming.model`     | model domyślny |

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

    Ręczne `memory promote` używa domyślnie progów fazy Deep, chyba że zostaną nadpisane flagami CLI.

  </Tab>
  <Tab title="Wyjaśnij promocję">
    Wyjaśnij, dlaczego konkretny kandydat zostałby albo nie zostałby promowany:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Podgląd harness REM">
    Wyświetl podgląd refleksji REM, prawd kandydatów i wyniku promocji Deep bez zapisywania czegokolwiek:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Kluczowe wartości domyślne

Wszystkie ustawienia znajdują się pod `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Włącza lub wyłącza przebieg Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Kadencja Cron dla pełnego przebiegu Dreaming.
</ParamField>
<ParamField path="model" type="string">
  Opcjonalne nadpisanie modelu subagenta Dziennika snów. Użyj kanonicznej wartości `provider/model`, gdy ustawiasz także allowlistę `allowedModels` subagenta.
</ParamField>

<Warning>
`dreaming.model` wymaga `plugins.entries.memory-core.subagent.allowModelOverride: true`. Aby je ograniczyć, ustaw także `plugins.entries.memory-core.subagent.allowedModels`. Błędy zaufania lub allowlisty pozostają widoczne zamiast cicho wracać do wartości zapasowej; ponowna próba obejmuje tylko błędy niedostępności modelu.
</Warning>

<Note>
Zasady faz, progi i zachowanie magazynu są wewnętrznymi szczegółami implementacji (nie konfiguracją widoczną dla użytkownika). Zobacz [referencję konfiguracji pamięci](/pl/reference/memory-config#dreaming), aby uzyskać pełną listę kluczy.
</Note>

## Interfejs Dreams

Po włączeniu karta **Dreams** w Gateway pokazuje:

- bieżący stan włączenia Dreaming
- status na poziomie faz i obecność zarządzanego przebiegu
- liczby krótkoterminowe, ugruntowane, sygnałów i promowanych-dzisiaj
- czas następnego zaplanowanego uruchomienia
- osobną ugruntowaną ścieżkę Sceny dla etapowanych wpisów historycznego odtworzenia
- rozwijany czytnik Dziennika snów oparty na `doctor.memory.dreamDiary`

## Dreaming nigdy się nie uruchamia: status pokazuje zablokowanie

Jeśli `openclaw memory status` zgłasza `Dreaming status: blocked`, zarządzany cron istnieje, ale Heartbeat domyślnego agenta się nie uruchamia. Sprawdź, czy Heartbeat jest włączony dla domyślnego agenta i czy jego cel nie jest `none`, a następnie ponownie uruchom `openclaw memory status --deep` po następnym interwale Heartbeat.

## Powiązane

- [Pamięć](/pl/concepts/memory)
- [CLI pamięci](/pl/cli/memory)
- [Referencja konfiguracji pamięci](/pl/reference/memory-config)
- [Wyszukiwanie pamięci](/pl/concepts/memory-search)
