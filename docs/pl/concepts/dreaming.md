---
read_when:
    - Chcesz, aby promowanie pamięci uruchamiało się automatycznie
    - Chcesz zrozumieć, co robi każda faza Dreaming
    - Chcesz dostroić konsolidację bez zaśmiecania `MEMORY.md`
summary: Konsolidacja pamięci w tle z fazami lekką, głęboką i REM oraz Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-04-24T09:05:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: a3c0f6ff18ac78980be07452859ec79e9a5b2ebb513c69e38eb09eff66291395
    source_path: concepts/dreaming.md
    workflow: 15
---

Dreaming to system konsolidacji pamięci działający w tle w `memory-core`.
Pomaga OpenClaw przenosić silne sygnały krótkoterminowe do trwałej pamięci,
jednocześnie utrzymując cały proces jako wyjaśnialny i możliwy do przeglądu.

Dreaming jest **opcjonalne** i domyślnie wyłączone.

## Co zapisuje Dreaming

Dreaming utrzymuje dwa rodzaje danych wyjściowych:

- **Stan maszynowy** w `memory/.dreams/` (magazyn recall, sygnały faz, checkpointy ingestii, blokady).
- **Czytelne dla człowieka dane wyjściowe** w `DREAMS.md` (lub istniejącym `dreams.md`) oraz opcjonalnych plikach raportów faz w `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Promocja do pamięci długoterminowej nadal zapisuje tylko do `MEMORY.md`.

## Model faz

Dreaming używa trzech współpracujących faz:

| Faza | Cel                                       | Trwały zapis      |
| ---- | ----------------------------------------- | ----------------- |
| Light | Sortowanie i przygotowanie ostatniego materiału krótkoterminowego | Nie               |
| Deep  | Ocenianie i promowanie trwałych kandydatów | Tak (`MEMORY.md`) |
| REM   | Refleksja nad tematami i powracającymi ideami | Nie               |

Te fazy są szczegółami wewnętrznej implementacji, a nie osobnymi
konfigurowanymi przez użytkownika „trybami”.

### Faza Light

Faza Light pobiera ostatnie sygnały dziennej pamięci i ślady recall, usuwa duplikaty
i przygotowuje wiersze kandydatów.

- Odczytuje stan recall krótkoterminowego, ostatnie dzienne pliki pamięci i zredagowane transkrypty sesji, gdy są dostępne.
- Zapisuje zarządzany blok `## Light Sleep`, gdy magazyn obejmuje wyjście inline.
- Rejestruje sygnały wzmocnienia do późniejszego rankingu Deep.
- Nigdy nie zapisuje do `MEMORY.md`.

### Faza Deep

Faza Deep decyduje, co staje się pamięcią długoterminową.

- Nadaje ranking kandydatom przy użyciu ważonej punktacji i progów.
- Wymaga przejścia `minScore`, `minRecallCount` i `minUniqueQueries`.
- Przed zapisem ponownie uwadnia fragmenty z aktywnych dziennych plików, więc nieaktualne/usunięte fragmenty są pomijane.
- Dopisuje promowane wpisy do `MEMORY.md`.
- Zapisuje podsumowanie `## Deep Sleep` do `DREAMS.md` i opcjonalnie zapisuje `memory/dreaming/deep/YYYY-MM-DD.md`.

### Faza REM

Faza REM wydobywa wzorce i sygnały refleksyjne.

- Buduje podsumowania tematów i refleksji na podstawie ostatnich śladów krótkoterminowych.
- Zapisuje zarządzany blok `## REM Sleep`, gdy magazyn obejmuje wyjście inline.
- Rejestruje sygnały wzmocnienia REM używane przez ranking Deep.
- Nigdy nie zapisuje do `MEMORY.md`.

## Ingestia transkryptów sesji

Dreaming może pobierać zredagowane transkrypty sesji do korpusu Dreaming. Gdy
transkrypty są dostępne, są przekazywane do fazy Light razem z dziennymi
sygnałami pamięci i śladami recall. Treści osobiste i wrażliwe są redagowane
przed ingestą.

## Dream Diary

Dreaming prowadzi także narracyjny **Dream Diary** w `DREAMS.md`.
Gdy po każdej fazie zbierze się wystarczająco dużo materiału, `memory-core` uruchamia
w tle z podejściem best-effort turę subagenta (używając domyślnego modelu runtime)
i dopisuje krótki wpis do dziennika.

Ten dziennik jest przeznaczony do czytania przez człowieka w interfejsie Dreams, a nie jako źródło promocji.
Artefakty dziennika/raportu generowane przez Dreaming są wykluczane z promocji
krótkoterminowej. Do promowania do
`MEMORY.md` kwalifikują się tylko ugruntowane fragmenty pamięci.

Istnieje też ugruntowana ścieżka historycznego backfill do pracy przeglądowej i odzyskiwania:

- `memory rem-harness --path ... --grounded` podgląda ugruntowane wyjście dziennika z historycznych notatek `YYYY-MM-DD.md`.
- `memory rem-backfill --path ...` zapisuje odwracalne ugruntowane wpisy dziennika do `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` przygotowuje ugruntowanych trwałych kandydatów w tym samym magazynie dowodów krótkoterminowych, którego normalna faza Deep już używa.
- `memory rem-backfill --rollback` i `--rollback-short-term` usuwają te przygotowane artefakty backfill bez naruszania zwykłych wpisów dziennika ani aktywnego recall krótkoterminowego.

Control UI udostępnia ten sam przepływ backfill/reset dziennika, dzięki czemu możesz sprawdzać
wyniki w scenie Dreams, zanim zdecydujesz, czy ugruntowani kandydaci
zasługują na promocję. Scena pokazuje również osobną ugruntowaną ścieżkę, aby było widać,
które przygotowane wpisy krótkoterminowe pochodzą z historycznego odtworzenia, które promowane
elementy były prowadzone przez dane ugruntowane, oraz umożliwia wyczyszczenie tylko ugruntowanych
przygotowanych wpisów bez naruszania zwykłego aktywnego stanu krótkoterminowego.

## Sygnały rankingu Deep

Ranking Deep używa sześciu ważonych sygnałów bazowych oraz wzmocnienia faz:

| Sygnał              | Waga | Opis                                               |
| ------------------- | ---- | -------------------------------------------------- |
| Frequency           | 0.24 | Ile sygnałów krótkoterminowych zgromadził wpis     |
| Relevance           | 0.30 | Średnia jakość odczytu dla wpisu                   |
| Query diversity     | 0.15 | Różne konteksty zapytania/dnia, w których się pojawił |
| Recency             | 0.15 | Punktacja świeżości z zanikiem w czasie            |
| Consolidation       | 0.10 | Siła nawrotu w ciągu wielu dni                     |
| Conceptual richness | 0.06 | Gęstość tagów pojęciowych z fragmentu/ścieżki      |

Trafienia faz Light i REM dodają małe wzmocnienie z zanikiem świeżości z
`memory/.dreams/phase-signals.json`.

## Harmonogram

Po włączeniu `memory-core` automatycznie zarządza jednym zadaniem Cron dla pełnego
przebiegu Dreaming. Każdy przebieg uruchamia fazy w kolejności: light -> REM -> deep.

Domyślne zachowanie harmonogramu:

| Ustawienie           | Domyślnie  |
| -------------------- | ---------- |
| `dreaming.frequency` | `0 3 * * *` |

## Szybki start

Włącz Dreaming:

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

Włącz Dreaming z niestandardowym harmonogramem przebiegów:

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

## Polecenie slash

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Workflow CLI

Użyj promocji CLI do podglądu albo ręcznego zastosowania:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

Ręczne `memory promote` domyślnie używa progów fazy Deep, chyba że zostaną nadpisane
flagami CLI.

Wyjaśnij, dlaczego konkretny kandydat zostałby lub nie zostałby promowany:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Podejrzyj refleksje REM, prawdy kandydatów i wynik promocji Deep bez
zapisywania czegokolwiek:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Kluczowe wartości domyślne

Wszystkie ustawienia znajdują się w `plugins.entries.memory-core.config.dreaming`.

| Klucz       | Domyślnie  |
| ----------- | ---------- |
| `enabled`   | `false`    |
| `frequency` | `0 3 * * *` |

Zasady faz, progi i zachowanie magazynu to wewnętrzne szczegóły implementacyjne
(nie są to ustawienia skierowane do użytkownika).

Zobacz [Dokumentacja konfiguracji pamięci](/pl/reference/memory-config#dreaming),
aby uzyskać pełną listę kluczy.

## Interfejs Dreams

Po włączeniu karta **Dreams** w Gateway pokazuje:

- bieżący stan włączenia Dreaming
- status na poziomie fazy i obecność zarządzanego przebiegu
- liczbę elementów krótkoterminowych, ugruntowanych, sygnałów i promowanych dzisiaj
- czas następnego zaplanowanego uruchomienia
- osobną ugruntowaną ścieżkę sceny dla przygotowanych wpisów z historycznego odtwarzania
- rozwijany czytnik Dream Diary oparty na `doctor.memory.dreamDiary`

## Powiązane

- [Pamięć](/pl/concepts/memory)
- [Wyszukiwanie pamięci](/pl/concepts/memory-search)
- [CLI memory](/pl/cli/memory)
- [Dokumentacja konfiguracji pamięci](/pl/reference/memory-config)
