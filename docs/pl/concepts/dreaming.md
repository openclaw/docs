---
read_when:
    - Chcesz, aby promocja pamięci uruchamiała się automatycznie
    - Chcesz zrozumieć, co robi każda faza Dreaming
    - Chcesz dostroić konsolidację bez zaśmiecania `MEMORY.md`
summary: Konsolidacja pamięci w tle z fazami light, deep i REM oraz Dziennikiem snów
title: Dreaming
x-i18n:
    generated_at: "2026-04-22T04:21:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 050e99bd2b3a18d7d2f02747e3010a7679515098369af5061d0a97b5703fc581
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming

Dreaming to system konsolidacji pamięci w tle w `memory-core`.
Pomaga OpenClaw przenosić silne krótkoterminowe sygnały do trwałej pamięci,
jednocześnie utrzymując cały proces jako wyjaśnialny i możliwy do przeglądu.

Dreaming jest **opcjonalne** i domyślnie wyłączone.

## Co zapisuje Dreaming

Dreaming przechowuje dwa rodzaje danych wyjściowych:

- **Stan maszyny** w `memory/.dreams/` (magazyn przywołań, sygnały faz, punkty kontrolne ingestii, blokady).
- **Czytelne dla człowieka dane wyjściowe** w `DREAMS.md` (lub istniejącym `dreams.md`) oraz opcjonalnych plikach raportów faz w `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Promocja do pamięci długoterminowej nadal zapisuje wyłącznie do `MEMORY.md`.

## Model faz

Dreaming używa trzech współpracujących faz:

| Faza | Cel                                       | Trwały zapis      |
| ----- | ----------------------------------------- | ----------------- |
| Light | Sortowanie i przygotowanie ostatnich materiałów krótkoterminowych | Nie               |
| Deep  | Ocenianie i promowanie trwałych kandydatów | Tak (`MEMORY.md`) |
| REM   | Refleksja nad motywami i powracającymi ideami | Nie               |

Te fazy są wewnętrznymi szczegółami implementacji, a nie osobnymi
konfigurowanymi przez użytkownika „trybami”.

### Faza Light

Faza Light pobiera ostatnie dzienne sygnały pamięci i ślady przywołań, usuwa duplikaty
i przygotowuje linie kandydatów.

- Odczytuje stan krótkoterminowych przywołań, ostatnie dzienne pliki pamięci oraz zredagowane transkrypcje sesji, jeśli są dostępne.
- Zapisuje zarządzany blok `## Light Sleep`, gdy magazyn obejmuje dane wyjściowe inline.
- Rejestruje sygnały wzmacniające do późniejszego rankingu deep.
- Nigdy nie zapisuje do `MEMORY.md`.

### Faza Deep

Faza Deep decyduje, co staje się pamięcią długoterminową.

- Ustala ranking kandydatów przy użyciu ważonej punktacji i progów granicznych.
- Wymaga spełnienia `minScore`, `minRecallCount` i `minUniqueQueries`.
- Przed zapisem ponownie pobiera fragmenty z bieżących plików dziennych, więc nieaktualne/usunięte fragmenty są pomijane.
- Dołącza promowane wpisy do `MEMORY.md`.
- Zapisuje podsumowanie `## Deep Sleep` w `DREAMS.md` i opcjonalnie zapisuje `memory/dreaming/deep/YYYY-MM-DD.md`.

### Faza REM

Faza REM wydobywa wzorce i sygnały refleksyjne.

- Tworzy podsumowania motywów i refleksji na podstawie ostatnich krótkoterminowych śladów.
- Zapisuje zarządzany blok `## REM Sleep`, gdy magazyn obejmuje dane wyjściowe inline.
- Rejestruje sygnały wzmacniające REM używane przez ranking deep.
- Nigdy nie zapisuje do `MEMORY.md`.

## Ingestia transkrypcji sesji

Dreaming może pobierać zredagowane transkrypcje sesji do korpusu Dreaming. Gdy
transkrypcje są dostępne, trafiają do fazy light razem z dziennymi
sygnałami pamięci i śladami przywołań. Treści osobiste i wrażliwe są redagowane
przed ingestą.

## Dziennik snów

Dreaming prowadzi również narracyjny **Dziennik snów** w `DREAMS.md`.
Gdy po każdej fazie zgromadzi się wystarczająco dużo materiału, `memory-core` uruchamia
w tle podagenta w trybie best-effort (używając domyślnego modelu runtime)
i dopisuje krótki wpis do dziennika.

Ten dziennik jest przeznaczony do czytania przez ludzi w interfejsie Dreams, a nie jako
źródło promocji.
Artefakty dziennika/raportów generowane przez Dreaming są wykluczone z promocji
krótkoterminowej. Tylko ugruntowane fragmenty pamięci mogą zostać promowane do
`MEMORY.md`.

Dostępna jest również ugruntowana ścieżka historycznego backfill do przeglądu i odzyskiwania:

- `memory rem-harness --path ... --grounded` wyświetla podgląd ugruntowanego wyniku dziennika z historycznych notatek `YYYY-MM-DD.md`.
- `memory rem-backfill --path ...` zapisuje odwracalne ugruntowane wpisy dziennika do `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` przygotowuje ugruntowanych trwałych kandydatów w tym samym magazynie dowodów krótkoterminowych, którego normalnie używa już faza deep.
- `memory rem-backfill --rollback` i `--rollback-short-term` usuwają te przygotowane artefakty backfill bez naruszania zwykłych wpisów dziennika ani bieżących krótkoterminowych przywołań.

Interfejs Control udostępnia ten sam przepływ backfill/reset dziennika, dzięki czemu możesz sprawdzić
wyniki w scenie Dreams, zanim zdecydujesz, czy ugruntowani kandydaci
zasługują na promocję. Scena pokazuje też osobną ugruntowaną ścieżkę, aby było widać,
które przygotowane wpisy krótkoterminowe pochodzą z historycznego odtworzenia, które promowane
elementy były prowadzone przez dane ugruntowane, oraz umożliwia wyczyszczenie tylko wpisów przygotowanych wyłącznie na podstawie danych ugruntowanych bez naruszania zwykłego bieżącego stanu krótkoterminowego.

## Sygnały rankingu Deep

Ranking Deep używa sześciu ważonych sygnałów bazowych oraz wzmocnienia faz:

| Sygnał              | Waga | Opis                                              |
| ------------------- | ---- | ------------------------------------------------- |
| Częstotliwość       | 0.24 | Ile krótkoterminowych sygnałów zgromadził wpis    |
| Trafność            | 0.30 | Średnia jakość pobierania dla wpisu               |
| Różnorodność zapytań | 0.15 | Różne konteksty zapytań/dni, w których go ujawniono |
| Aktualność          | 0.15 | Wynik świeżości malejący wraz z upływem czasu     |
| Konsolidacja        | 0.10 | Siła powtarzalności między dniami                 |
| Bogactwo koncepcyjne | 0.06 | Gęstość tagów pojęciowych na podstawie fragmentu/ścieżki |

Trafienia faz Light i REM dodają niewielkie wzmocnienie malejące z czasem
z `memory/.dreams/phase-signals.json`.

## Harmonogram

Po włączeniu `memory-core` automatycznie zarządza jednym zadaniem Cron dla pełnego
przebiegu Dreaming. Każdy przebieg uruchamia fazy w kolejności: light -> REM -> deep.

Domyślne zachowanie harmonogramu:

| Ustawienie           | Domyślnie   |
| -------------------- | ----------- |
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

## Polecenie ukośnikowe

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Przepływ pracy CLI

Używaj promocji przez CLI do podglądu lub ręcznego zastosowania:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

Ręczne `memory promote` domyślnie używa progów fazy deep, chyba że zostaną nadpisane
flagami CLI.

Wyjaśnij, dlaczego konkretny kandydat zostałby lub nie zostałby promowany:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Wyświetl podgląd refleksji REM, prawd kandydatów i wyniku promocji deep bez
zapisywania czegokolwiek:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Kluczowe wartości domyślne

Wszystkie ustawienia znajdują się pod `plugins.entries.memory-core.config.dreaming`.

| Klucz      | Domyślnie   |
| ---------- | ----------- |
| `enabled`  | `false`     |
| `frequency` | `0 3 * * *` |

Zasady faz, progi i zachowanie magazynu są wewnętrznymi szczegółami implementacji
(i nie stanowią konfiguracji użytkownika).

Pełną listę kluczy znajdziesz w [Dokumentacja konfiguracji Memory](/pl/reference/memory-config#dreaming).

## Interfejs Dreams

Po włączeniu karta **Dreams** w Gateway pokazuje:

- bieżący stan włączenia Dreaming
- status na poziomie faz i obecność zarządzanego przebiegu
- liczbę elementów krótkoterminowych, ugruntowanych, sygnałów i promowanych dzisiaj
- czas do następnego zaplanowanego uruchomienia
- osobną ugruntowaną ścieżkę sceny dla przygotowanych wpisów historycznego odtworzenia
- rozwijany czytnik Dziennika snów oparty na `doctor.memory.dreamDiary`

## Rozwiązywanie problemów

### Dreaming nigdy się nie uruchamia (status pokazuje blocked)

Zarządzany Cron Dreaming działa na Heartbeat domyślnego agenta. Jeśli Heartbeat nie uruchamia się dla tego agenta, Cron umieszcza w kolejce zdarzenie systemowe, którego nikt nie konsumuje, i Dreaming po cichu się nie uruchamia. Zarówno `openclaw memory status`, jak i `/dreaming status` zgłoszą w takim przypadku `blocked` i wskażą agenta, którego Heartbeat jest blokadą.

Dwie częste przyczyny:

- Inny agent deklaruje jawny blok `heartbeat:`. Gdy dowolny wpis w `agents.list` ma własny blok `heartbeat`, Heartbeat działa tylko dla tych agentów — ustawienia domyślne przestają obowiązywać dla wszystkich pozostałych, więc domyślny agent może przestać działać. Przenieś ustawienia Heartbeat do `agents.defaults.heartbeat` albo dodaj jawny blok `heartbeat` do domyślnego agenta. Zobacz [Zakres i pierwszeństwo](/pl/gateway/heartbeat#scope-and-precedence).
- `heartbeat.every` ma wartość `0`, jest puste lub nie daje się sparsować. Cron nie ma interwału, względem którego mógłby planować, więc Heartbeat jest w praktyce wyłączony. Ustaw `every` na dodatni czas trwania, na przykład `30m`. Zobacz [Wartości domyślne](/pl/gateway/heartbeat#defaults).

## Powiązane

- [Heartbeat](/pl/gateway/heartbeat)
- [Memory](/pl/concepts/memory)
- [Memory Search](/pl/concepts/memory-search)
- [memory CLI](/cli/memory)
- [Dokumentacja konfiguracji Memory](/pl/reference/memory-config)
