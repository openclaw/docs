---
read_when:
    - Chcesz, aby promowanie pamięci uruchamiało się automatycznie
    - Chcesz zrozumieć, co robi każda faza dreaming
    - Chcesz dostroić konsolidację bez zaśmiecania `MEMORY.md`
summary: Konsolidacja pamięci w tle z fazami lekką, głęboką i REM oraz Dziennikiem snów
title: Dreaming (eksperymentalne)
x-i18n:
    generated_at: "2026-04-06T09:45:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36c4b1e70801d662090dc8ce20608c2f141c23cd7ce53c54e3dcf332c801fd4e
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming (eksperymentalne)

Dreaming to system konsolidacji pamięci działający w tle w `memory-core`.
Pomaga OpenClaw przenosić silne sygnały krótkoterminowe do trwałej pamięci, a jednocześnie
utrzymywać ten proces jako zrozumiały i możliwy do przejrzenia.

Dreaming jest funkcją **opcjonalną** i domyślnie jest wyłączone.

## Co zapisuje dreaming

Dreaming utrzymuje dwa rodzaje danych wyjściowych:

- **Stan maszyny** w `memory/.dreams/` (magazyn przypomnień, sygnały faz, punkty kontrolne ingestii, blokady).
- **Dane czytelne dla człowieka** w `DREAMS.md` (lub istniejącym `dreams.md`) oraz opcjonalnych plikach raportów faz w `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Promowanie do pamięci długoterminowej nadal zapisuje dane wyłącznie do `MEMORY.md`.

## Model faz

Dreaming używa trzech współpracujących faz:

| Faza | Cel                                       | Trwały zapis      |
| ----- | ----------------------------------------- | ----------------- |
| Lekka | Sortowanie i przygotowanie niedawnych materiałów krótkoterminowych | Nie               |
| Głęboka  | Ocenianie i promowanie trwałych kandydatów      | Tak (`MEMORY.md`) |
| REM   | Refleksja nad motywami i powtarzającymi się ideami     | Nie               |

Te fazy są wewnętrznymi szczegółami implementacji, a nie osobnymi
konfigurowanymi przez użytkownika „trybami”.

### Faza lekka

Faza lekka pobiera niedawne dzienne sygnały pamięci i ślady przypomnień, usuwa duplikaty
i przygotowuje linie kandydatów.

- Odczytuje stan krótkoterminowych przypomnień i niedawne dzienne pliki pamięci.
- Zapisuje zarządzany blok `## Light Sleep`, gdy magazyn zawiera dane wyjściowe inline.
- Rejestruje sygnały wzmacniające do późniejszego głębokiego rankingu.
- Nigdy nie zapisuje do `MEMORY.md`.

### Faza głęboka

Faza głęboka decyduje, co staje się pamięcią długoterminową.

- Nadaje ranking kandydatom za pomocą ważonego punktowania i progów.
- Wymaga spełnienia `minScore`, `minRecallCount` oraz `minUniqueQueries`.
- Przed zapisem ponownie odtwarza fragmenty z bieżących plików dziennych, więc nieaktualne lub usunięte fragmenty są pomijane.
- Dopisuje promowane wpisy do `MEMORY.md`.
- Zapisuje podsumowanie `## Deep Sleep` w `DREAMS.md` i opcjonalnie zapisuje `memory/dreaming/deep/YYYY-MM-DD.md`.

### Faza REM

Faza REM wyodrębnia wzorce i sygnały refleksyjne.

- Buduje podsumowania motywów i refleksji na podstawie niedawnych śladów krótkoterminowych.
- Zapisuje zarządzany blok `## REM Sleep`, gdy magazyn zawiera dane wyjściowe inline.
- Rejestruje sygnały wzmacniające REM używane przez głęboki ranking.
- Nigdy nie zapisuje do `MEMORY.md`.

## Dziennik snów

Dreaming prowadzi także narracyjny **Dziennik snów** w `DREAMS.md`.
Gdy po każdej fazie zgromadzi się wystarczająco dużo materiału, `memory-core` uruchamia
podrzędną turę agenta w tle w trybie best-effort (z użyciem domyślnego modelu środowiska wykonawczego)
i dopisuje krótki wpis do dziennika.

Ten dziennik jest przeznaczony do czytania przez ludzi w interfejsie Dreams, a nie jako źródło promocji.

## Sygnały głębokiego rankingu

Głęboki ranking używa sześciu ważonych sygnałów bazowych oraz wzmocnienia fazowego:

| Sygnał              | Waga | Opis                                       |
| ------------------- | ------ | ------------------------------------------------- |
| Częstotliwość           | 0.24   | Ile sygnałów krótkoterminowych zgromadził wpis |
| Trafność           | 0.30   | Średnia jakość wyszukiwania dla wpisu           |
| Różnorodność zapytań     | 0.15   | Odrębne konteksty zapytań/dni, w których wpis się pojawił      |
| Aktualność             | 0.15   | Wynik świeżości obniżany z upływem czasu                      |
| Konsolidacja       | 0.10   | Siła nawrotu w wielu dniach                     |
| Bogactwo koncepcyjne | 0.06   | Gęstość tagów pojęciowych na podstawie fragmentu/ścieżki             |

Trafienia fazy lekkiej i REM dodają niewielkie wzmocnienie malejące wraz z aktualnością z
`memory/.dreams/phase-signals.json`.

## Harmonogram

Po włączeniu `memory-core` automatycznie zarządza jednym zadaniem cron dla pełnego
przebiegu dreaming. Każdy przebieg uruchamia fazy w kolejności: light -> REM -> deep.

Domyślne zachowanie harmonogramu:

| Ustawienie              | Domyślnie     |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## Szybki start

Włącz dreaming:

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

Włącz dreaming z niestandardową częstotliwością przebiegu:

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

## Komenda ukośnikowa

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Workflow CLI

Użyj promowania w CLI do podglądu lub ręcznego zastosowania:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

Ręczne `memory promote` domyślnie używa progów fazy głębokiej, chyba że zostaną one nadpisane
flagami CLI.

Wyjaśnij, dlaczego konkretny kandydat zostałby lub nie zostałby promowany:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Podejrzyj refleksje REM, prawdy kandydatów i dane wyjściowe głębokiego promowania bez
zapisywania czegokolwiek:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Kluczowe wartości domyślne

Wszystkie ustawienia znajdują się pod `plugins.entries.memory-core.config.dreaming`.

| Klucz         | Domyślnie     |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

Polityka faz, progi i zachowanie przechowywania są wewnętrznymi szczegółami implementacji
(i nie są konfigurowane przez użytkownika).

Pełną listę kluczy znajdziesz w [Dokumentacji referencyjnej konfiguracji pamięci](/pl/reference/memory-config#dreaming-experimental).

## Interfejs Dreams

Po włączeniu karta **Dreams** w Gateway pokazuje:

- bieżący stan włączenia dreaming
- stan na poziomie faz oraz obecność zarządzanego przebiegu
- liczbę wpisów krótkoterminowych, długoterminowych i promowanych dzisiaj
- czas następnego zaplanowanego uruchomienia
- rozwijany czytnik Dziennika snów oparty na `doctor.memory.dreamDiary`

## Powiązane

- [Pamięć](/pl/concepts/memory)
- [Wyszukiwanie w pamięci](/pl/concepts/memory-search)
- [CLI pamięci](/cli/memory)
- [Dokumentacja referencyjna konfiguracji pamięci](/pl/reference/memory-config)
