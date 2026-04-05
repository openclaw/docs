---
read_when:
    - Chcesz, aby promocja pamięci uruchamiała się automatycznie
    - Chcesz zrozumieć tryby dreaming i progi
    - Chcesz dostroić konsolidację bez zaśmiecania `MEMORY.md`
summary: Promocja w tle z pamięci krótkoterminowej do pamięci długoterminowej
title: Dreaming (eksperymentalne)
x-i18n:
    generated_at: "2026-04-05T13:50:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9dbb29e9b49e940128c4e08c3fd058bb6ebb0148ca214b78008e3d5763ef1ab
    source_path: concepts/memory-dreaming.md
    workflow: 15
---

# Dreaming (eksperymentalne)

Dreaming to działający w tle etap konsolidacji pamięci w `memory-core`.

Nazywa się go „dreaming”, ponieważ system ponownie analizuje to, co pojawiło się w ciągu dnia,
i decyduje, co warto zachować jako trwały kontekst.

Dreaming jest **eksperymentalne**, **opt-in** i **domyślnie wyłączone**.

## Co robi dreaming

1. Śledzi zdarzenia przywołań krótkoterminowych z trafień `memory_search` w
   `memory/YYYY-MM-DD.md`.
2. Ocenia tych kandydatów przywołań za pomocą ważonych sygnałów.
3. Promuje do `MEMORY.md` tylko kwalifikujących się kandydatów.

Dzięki temu pamięć długoterminowa pozostaje skupiona na trwałym, powtarzającym się kontekście zamiast
gromadzić jednorazowe szczegóły.

## Sygnały promocji

Dreaming łączy cztery sygnały:

- **Częstotliwość**: jak często przywoływano tego samego kandydata.
- **Trafność**: jak wysokie były wyniki przywołań podczas jego pobierania.
- **Różnorodność zapytań**: ile odrębnych intencji zapytań go ujawniło.
- **Świeżość**: ważenie czasowe ostatnich przywołań.

Promocja wymaga przejścia przez wszystkie skonfigurowane progi, a nie tylko przez jeden sygnał.

### Wagi sygnałów

| Sygnał                | Waga | Opis                                              |
| --------------------- | ---- | ------------------------------------------------- |
| Częstotliwość         | 0.35 | Jak często przywoływano ten sam wpis              |
| Trafność              | 0.35 | Średnie wyniki przywołań podczas pobierania       |
| Różnorodność          | 0.15 | Liczba odrębnych intencji zapytań, które go ujawniły |
| Świeżość              | 0.15 | Zanikanie w czasie (okres półtrwania 14 dni)      |

## Jak to działa

1. **Śledzenie przywołań** -- Każde trafienie `memory_search` jest zapisywane do
   `memory/.dreams/short-term-recall.json` wraz z liczbą przywołań, wynikami i hashem
   zapytania.
2. **Planowane ocenianie** -- Zgodnie ze skonfigurowanym harmonogramem kandydaci są klasyfikowani
   przy użyciu ważonych sygnałów. Wszystkie progi muszą zostać spełnione jednocześnie.
3. **Promocja** -- Kwalifikujące się wpisy są dopisywane do `MEMORY.md` ze znacznikiem czasu
   promocji.
4. **Czyszczenie** -- Wpisy już promowane są filtrowane w kolejnych cyklach. Blokada pliku
   zapobiega równoczesnym uruchomieniom.

## Tryby

`dreaming.mode` kontroluje harmonogram i domyślne progi:

| Tryb   | Harmonogram     | minScore | minRecallCount | minUniqueQueries |
| ------ | ---------------- | -------- | -------------- | ---------------- |
| `off`  | Wyłączone        | --       | --             | --               |
| `core` | Codziennie o 3:00 | 0.75     | 3              | 2                |
| `rem`  | Co 6 godzin      | 0.85     | 4              | 3                |
| `deep` | Co 12 godzin     | 0.80     | 3              | 3                |

## Model harmonogramu

Gdy dreaming jest włączone, `memory-core` automatycznie zarządza
powtarzającym się harmonogramem. Nie musisz ręcznie tworzyć zadania cron dla tej funkcji.

Nadal możesz dostroić działanie za pomocą jawnych nadpisań, takich jak:

- `dreaming.frequency` (wyrażenie cron)
- `dreaming.timezone`
- `dreaming.limit`
- `dreaming.minScore`
- `dreaming.minRecallCount`
- `dreaming.minUniqueQueries`

## Konfiguracja

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "mode": "core"
          }
        }
      }
    }
  }
}
```

## Polecenia czatu

Przełączaj tryby i sprawdzaj stan z poziomu czatu:

```
/dreaming core          # Przełącz na tryb core (nocny)
/dreaming rem           # Przełącz na tryb rem (co 6 h)
/dreaming deep          # Przełącz na tryb deep (co 12 h)
/dreaming off           # Wyłącz dreaming
/dreaming status        # Pokaż bieżącą konfigurację i harmonogram
/dreaming help          # Pokaż przewodnik po trybach
```

## Polecenia CLI

Wyświetl podgląd i stosuj promocje z poziomu wiersza poleceń:

```bash
# Wyświetl podgląd kandydatów do promocji
openclaw memory promote

# Zastosuj promocje do MEMORY.md
openclaw memory promote --apply

# Ogranicz liczbę elementów w podglądzie
openclaw memory promote --limit 5

# Uwzględnij już promowane wpisy
openclaw memory promote --include-promoted

# Sprawdź stan dreaming
openclaw memory status --deep
```

Pełne informacje o flagach znajdziesz w [CLI memory](/cli/memory).

## Interfejs Dreams

Gdy dreaming jest włączone, pasek boczny Gateway pokazuje kartę **Dreams** z
statystykami pamięci (liczba elementów krótkoterminowych, liczba elementów długoterminowych, liczba promowanych)
oraz czasem następnego zaplanowanego cyklu.

## Dalsza lektura

- [Pamięć](/concepts/memory)
- [Wyszukiwanie w pamięci](/concepts/memory-search)
- [CLI memory](/cli/memory)
- [Dokumentacja referencyjna konfiguracji pamięci](/reference/memory-config)
