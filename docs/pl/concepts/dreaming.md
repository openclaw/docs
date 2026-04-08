---
read_when:
    - Chcesz, aby promowanie pamięci uruchamiało się automatycznie
    - Chcesz zrozumieć, co robi każda faza śnienia
    - Chcesz dostroić konsolidację bez zaśmiecania `MEMORY.md`
summary: Konsolidacja pamięci w tle z fazami lekką, głęboką i REM oraz Dziennikiem snów
title: Śnienie (eksperymentalne)
x-i18n:
    generated_at: "2026-04-08T09:44:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0254f3b0949158264e583c12f36f2b1a83d1b44dc4da01a1b272422d38e8655d
    source_path: concepts/dreaming.md
    workflow: 15
---

# Śnienie (eksperymentalne)

Śnienie to system konsolidacji pamięci działający w tle w `memory-core`.
Pomaga OpenClaw przenosić silne sygnały pamięci krótkoterminowej do trwałej pamięci,
jednocześnie zachowując przejrzystość i możliwość przeglądu tego procesu.

Śnienie jest **opcjonalne** i domyślnie wyłączone.

## Co zapisuje śnienie

Śnienie przechowuje dwa rodzaje danych wyjściowych:

- **Stan maszyny** w `memory/.dreams/` (magazyn przywołań, sygnały faz, punkty kontrolne przetwarzania, blokady).
- **Dane czytelne dla człowieka** w `DREAMS.md` (lub istniejącym `dreams.md`) oraz opcjonalne pliki raportów faz w `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Promowanie do pamięci długoterminowej nadal zapisuje dane wyłącznie do `MEMORY.md`.

## Model faz

Śnienie używa trzech współpracujących faz:

| Faza | Cel                                      | Trwały zapis      |
| ----- | ---------------------------------------- | ----------------- |
| Lekka | Sortowanie i przygotowywanie ostatnich materiałów krótkoterminowych | Nie               |
| Głęboka  | Ocenianie i promowanie trwałych kandydatów      | Tak (`MEMORY.md`) |
| REM   | Refleksja nad motywami i powracającymi pomysłami     | Nie                |

Te fazy są wewnętrznymi szczegółami implementacji, a nie osobnymi
konfigurowanymi przez użytkownika „trybami”.

### Faza lekka

Faza lekka przetwarza ostatnie sygnały dziennej pamięci i ślady przywołań, usuwa duplikaty
i przygotowuje linie kandydatów.

- Odczytuje stan przywołań krótkoterminowych, ostatnie dzienne pliki pamięci oraz zredagowane transkrypty sesji, jeśli są dostępne.
- Zapisuje zarządzany blok `## Light Sleep`, gdy magazyn zawiera dane wyjściowe osadzone w pliku.
- Rejestruje sygnały wzmocnienia do późniejszego rankingu głębokiego.
- Nigdy nie zapisuje do `MEMORY.md`.

### Faza głęboka

Faza głęboka decyduje, co trafia do pamięci długoterminowej.

- Ustala ranking kandydatów przy użyciu ważonej punktacji i progów.
- Wymaga spełnienia `minScore`, `minRecallCount` oraz `minUniqueQueries`.
- Przed zapisem ponownie pobiera fragmenty z bieżących plików dziennych, więc nieaktualne lub usunięte fragmenty są pomijane.
- Dopisuje promowane wpisy do `MEMORY.md`.
- Zapisuje podsumowanie `## Deep Sleep` w `DREAMS.md` i opcjonalnie zapisuje `memory/dreaming/deep/YYYY-MM-DD.md`.

### Faza REM

Faza REM wyodrębnia wzorce i sygnały refleksyjne.

- Buduje podsumowania motywów i refleksji na podstawie ostatnich śladów krótkoterminowych.
- Zapisuje zarządzany blok `## REM Sleep`, gdy magazyn zawiera dane wyjściowe osadzone w pliku.
- Rejestruje sygnały wzmocnienia REM używane przez ranking głęboki.
- Nigdy nie zapisuje do `MEMORY.md`.

## Przetwarzanie transkryptów sesji

Śnienie może przetwarzać zredagowane transkrypty sesji do korpusu śnienia. Gdy
transkrypty są dostępne, są przekazywane do fazy lekkiej razem z dziennymi
sygnałami pamięci i śladami przywołań. Treści osobiste i wrażliwe są redagowane
przed przetworzeniem.

## Dziennik snów

Śnienie prowadzi również narracyjny **Dziennik snów** w `DREAMS.md`.
Gdy po każdej fazie zbierze się wystarczająco dużo materiału, `memory-core` uruchamia
w tle, w trybie best-effort, turę podagenta (z użyciem domyślnego modelu runtime)
i dopisuje krótki wpis do dziennika.

Ten dziennik służy do czytania przez człowieka w interfejsie Dreams, a nie jako źródło promocji.

## Sygnały rankingu głębokiego

Ranking głęboki używa sześciu ważonych sygnałów bazowych oraz wzmocnienia faz:

| Sygnał              | Waga | Opis                                              |
| ------------------- | ------ | ------------------------------------------------- |
| Częstotliwość           | 0.24   | Ile sygnałów krótkoterminowych zgromadził wpis |
| Trafność           | 0.30   | Średnia jakość pobierania dla wpisu           |
| Różnorodność zapytań     | 0.15   | Różne konteksty zapytań/dni, w których się pojawił      |
| Aktualność             | 0.15   | Wynik świeżości z zanikiem w czasie                      |
| Konsolidacja       | 0.10   | Siła nawrotów w wielu dniach                     |
| Bogactwo pojęciowe | 0.06   | Gęstość tagów pojęciowych z fragmentu/ścieżki             |

Trafienia fazy lekkiej i REM dodają niewielkie wzmocnienie z zanikiem aktualności z
`memory/.dreams/phase-signals.json`.

## Harmonogram

Po włączeniu `memory-core` automatycznie zarządza jednym zadaniem cron dla pełnego
przebiegu śnienia. Każdy przebieg uruchamia fazy w kolejności: lekka -> REM -> głęboka.

Domyślne zachowanie harmonogramu:

| Ustawienie              | Domyślna wartość     |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## Szybki start

Włącz śnienie:

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

Włącz śnienie z niestandardowym harmonogramem przebiegów:

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

## Polecenie ukośnikowe

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Przepływ pracy CLI

Użyj promocji w CLI do podglądu lub ręcznego zastosowania:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

Ręczne `memory promote` domyślnie używa progów fazy głębokiej, o ile nie zostaną nadpisane
flagami CLI.

Wyjaśnij, dlaczego konkretny kandydat zostałby lub nie zostałby promowany:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Wyświetl podgląd refleksji REM, prawd kandydatów i danych wyjściowych promocji głębokiej bez
zapisywania czegokolwiek:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Kluczowe wartości domyślne

Wszystkie ustawienia znajdują się w `plugins.entries.memory-core.config.dreaming`.

| Klucz         | Domyślna wartość     |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

Polityka faz, progi i zachowanie magazynu są wewnętrznymi szczegółami implementacji
(i nie stanowią konfiguracji dostępnej dla użytkownika).

Pełną listę kluczy znajdziesz w [Dokumentacji konfiguracji pamięci](/pl/reference/memory-config#dreaming-experimental).

## Interfejs Dreams

Po włączeniu karta **Dreams** w Gateway pokazuje:

- bieżący stan włączenia śnienia
- stan na poziomie faz i obecność zarządzanego przebiegu
- liczbę elementów krótkoterminowych, długoterminowych i promowanych dzisiaj
- czas następnego zaplanowanego uruchomienia
- rozwijany czytnik Dziennika snów oparty na `doctor.memory.dreamDiary`

## Powiązane

- [Pamięć](/pl/concepts/memory)
- [Wyszukiwanie w pamięci](/pl/concepts/memory-search)
- [CLI pamięci](/cli/memory)
- [Dokumentacja konfiguracji pamięci](/pl/reference/memory-config)
