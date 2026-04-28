---
read_when:
    - Chcesz, aby promocja pamięci była uruchamiana automatycznie
    - Chcesz zrozumieć, co robi każda faza Dreaming
    - Chcesz dostroić konsolidację bez zaśmiecania MEMORY.md
sidebarTitle: Dreaming
summary: Konsolidacja pamięci w tle z fazami light, deep i REM oraz Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-04-26T11:27:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: cba9593c5f697d49dbb20a3c908bf43ad37989f8cb029443b44523f2acab0e1d
    source_path: concepts/dreaming.md
    workflow: 15
---

Dreaming to system konsolidacji pamięci działający w tle w `memory-core`. Pomaga OpenClaw przenosić silne sygnały krótkoterminowe do trwałej pamięci, przy zachowaniu procesu zrozumiałego i możliwego do przeglądu.

<Note>
Dreaming jest **opcjonalne** i domyślnie wyłączone.
</Note>

## Co zapisuje Dreaming

Dreaming utrzymuje dwa rodzaje danych wyjściowych:

- **Stan maszynowy** w `memory/.dreams/` (magazyn recall, sygnały faz, punkty kontrolne ingestii, blokady).
- **Dane czytelne dla człowieka** w `DREAMS.md` (lub istniejącym `dreams.md`) oraz opcjonalnych plikach raportów faz w `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Promocja długoterminowa nadal zapisuje wyłącznie do `MEMORY.md`.

## Model faz

Dreaming używa trzech współpracujących faz:

| Faza | Cel                                        | Trwały zapis      |
| ---- | ------------------------------------------ | ----------------- |
| Light | Sortowanie i przygotowywanie ostatniego materiału krótkoterminowego | Nie               |
| Deep  | Ocenianie i promowanie trwałych kandydatów | Tak (`MEMORY.md`) |
| REM   | Refleksja nad motywami i powracającymi ideami | Nie               |

Te fazy są wewnętrznymi szczegółami implementacji, a nie osobnymi konfigurowanymi przez użytkownika „trybami”.

<AccordionGroup>
  <Accordion title="Faza Light">
    Faza Light pobiera ostatnie sygnały dziennej pamięci i ślady recall, usuwa duplikaty i przygotowuje linie kandydatów.

    - Odczytuje ze stanu krótkoterminowego recall, ostatnich dziennych plików pamięci oraz zredagowanych transkryptów sesji, gdy są dostępne.
    - Zapisuje zarządzany blok `## Light Sleep`, gdy magazyn zawiera wyjście inline.
    - Rejestruje sygnały wzmocnienia do późniejszego rankingu Deep.
    - Nigdy nie zapisuje do `MEMORY.md`.

  </Accordion>
  <Accordion title="Faza Deep">
    Faza Deep decyduje, co staje się pamięcią długoterminową.

    - Klasyfikuje kandydatów przy użyciu ważonego scoringu i progów odcięcia.
    - Wymaga spełnienia `minScore`, `minRecallCount` i `minUniqueQueries`.
    - Przed zapisem ponownie odtwarza fragmenty z bieżących plików dziennych, więc przestarzałe/usunięte fragmenty są pomijane.
    - Dopisuje promowane wpisy do `MEMORY.md`.
    - Zapisuje podsumowanie `## Deep Sleep` do `DREAMS.md` i opcjonalnie do `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="Faza REM">
    Faza REM wyodrębnia wzorce i sygnały refleksyjne.

    - Buduje podsumowania motywów i refleksji na podstawie ostatnich śladów krótkoterminowych.
    - Zapisuje zarządzany blok `## REM Sleep`, gdy magazyn zawiera wyjście inline.
    - Rejestruje sygnały wzmocnienia REM używane przez ranking Deep.
    - Nigdy nie zapisuje do `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestia transkryptów sesji

Dreaming może pobierać zredagowane transkrypty sesji do korpusu Dreaming. Gdy transkrypty są dostępne, są przekazywane do fazy Light razem z dziennymi sygnałami pamięci i śladami recall. Dane osobowe i wrażliwe są redagowane przed ingestą.

## Dream Diary

Dreaming prowadzi także narracyjny **Dream Diary** w `DREAMS.md`. Gdy po każdej fazie jest wystarczająco dużo materiału, `memory-core` uruchamia w tle podagenta w trybie best-effort (z użyciem domyślnego modelu środowiska wykonawczego) i dopisuje krótki wpis do dziennika.

<Note>
Ten dziennik służy do czytania przez człowieka w interfejsie Dreams, a nie jako źródło promocji. Artefakty dziennika/raportów wygenerowane przez Dreaming są wykluczane z promocji krótkoterminowej. Do promocji do `MEMORY.md` kwalifikują się wyłącznie ugruntowane fragmenty pamięci.
</Note>

Istnieje też ugruntowana ścieżka historycznego backfill do przeglądu i odzyskiwania:

<AccordionGroup>
  <Accordion title="Polecenia backfill">
    - `memory rem-harness --path ... --grounded` wyświetla podgląd ugruntowanego wyjścia dziennika na podstawie historycznych notatek `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` zapisuje odwracalne ugruntowane wpisy dziennika do `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` przygotowuje ugruntowanych trwałych kandydatów w tym samym krótkoterminowym magazynie dowodów, którego używa już zwykła faza Deep.
    - `memory rem-backfill --rollback` i `--rollback-short-term` usuwają te przygotowane artefakty backfill bez naruszania zwykłych wpisów dziennika ani aktywnego krótkoterminowego recall.

  </Accordion>
</AccordionGroup>

Control UI udostępnia ten sam przepływ backfill/reset dziennika, dzięki czemu możesz sprawdzić wyniki w scenie Dreams, zanim zdecydujesz, czy ugruntowani kandydaci zasługują na promocję. Scena pokazuje też oddzielną ugruntowaną ścieżkę, aby było widać, które przygotowane wpisy krótkoterminowe pochodzą z historycznego odtworzenia, które promowane elementy były prowadzone przez dane ugruntowane, oraz aby można było czyścić wyłącznie ugruntowane przygotowane wpisy bez naruszania zwykłego aktywnego stanu krótkoterminowego.

## Sygnały rankingu Deep

Ranking Deep używa sześciu ważonych sygnałów bazowych oraz wzmocnienia faz:

| Sygnał              | Waga | Opis                                             |
| ------------------- | ---- | ------------------------------------------------ |
| Częstotliwość       | 0.24 | Ile sygnałów krótkoterminowych zgromadził wpis   |
| Trafność            | 0.30 | Średnia jakość odzyskania dla wpisu              |
| Różnorodność zapytań | 0.15 | Różne konteksty zapytań/dni, w których się pojawił |
| Świeżość            | 0.15 | Wynik świeżości wygaszany w czasie               |
| Konsolidacja        | 0.10 | Siła nawrotów w wielu dniach                     |
| Bogactwo pojęciowe  | 0.06 | Gęstość tagów pojęć z fragmentu/ścieżki          |

Trafienia faz Light i REM dodają niewielkie wzmocnienie wygaszane w czasie z `memory/.dreams/phase-signals.json`.

## Harmonogram

Po włączeniu `memory-core` automatycznie zarządza jednym zadaniem Cron dla pełnego przebiegu Dreaming. Każdy przebieg uruchamia fazy w kolejności: light → REM → deep.

Domyślne zachowanie harmonogramu:

| Ustawienie           | Domyślnie   |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

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
  <Tab title="Niestandardowy harmonogram przebiegu">
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

## Przepływ CLI

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
    Wyjaśnij, dlaczego konkretny kandydat zostałby lub nie zostałby promowany:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Podgląd harness REM">
    Wyświetl podgląd refleksji REM, prawd kandydatów i wyjścia promocji Deep bez zapisywania czegokolwiek:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Kluczowe wartości domyślne

Wszystkie ustawienia znajdują się w `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Włącz lub wyłącz przebieg Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Harmonogram Cron dla pełnego przebiegu Dreaming.
</ParamField>

<Note>
Polityka faz, progi i zachowanie magazynu to wewnętrzne szczegóły implementacji (a nie konfiguracja użytkownika). Pełną listę kluczy znajdziesz w [Dokumentacji referencyjnej konfiguracji pamięci](/pl/reference/memory-config#dreaming).
</Note>

## Interfejs Dreams

Po włączeniu karta **Dreams** w Gateway pokazuje:

- bieżący stan włączenia Dreaming
- status na poziomie faz i obecność zarządzanego przebiegu
- liczbę elementów krótkoterminowych, ugruntowanych, sygnałów i promowanych dziś
- czas do następnego zaplanowanego uruchomienia
- oddzielną ugruntowaną ścieżkę sceny dla przygotowanych wpisów historycznego odtwarzania
- rozwijany czytnik Dream Diary oparty na `doctor.memory.dreamDiary`

## Powiązane

- [Pamięć](/pl/concepts/memory)
- [CLI pamięci](/pl/cli/memory)
- [Dokumentacja referencyjna konfiguracji pamięci](/pl/reference/memory-config)
- [Wyszukiwanie pamięci](/pl/concepts/memory-search)
