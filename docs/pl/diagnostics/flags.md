---
read_when:
    - Potrzebujesz ukierunkowanych logów debugowania bez podnoszenia globalnych poziomów logowania
    - Musisz przechwycić logi specyficzne dla podsystemu na potrzeby pomocy technicznej.
summary: Flagi diagnostyczne dla ukierunkowanych logów debugowania
title: Flagi diagnostyczne
x-i18n:
    generated_at: "2026-05-02T09:49:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1d0ff92d45cf1c5a12a7103ba5b97d656a55a13a7a4f2e86e26ba3a9cfae7687
    source_path: diagnostics/flags.md
    workflow: 16
---

Flagi diagnostyczne pozwalają włączać ukierunkowane logi debugowania bez włączania szczegółowego logowania wszędzie. Flagi są opcjonalne i nie mają wpływu, chyba że dany podsystem je sprawdza.

## Jak to działa

- Flagi to ciągi znaków (bez rozróżniania wielkości liter).
- Flagi można włączyć w konfiguracji lub przez nadpisanie zmienną środowiskową.
- Obsługiwane są symbole wieloznaczne:
  - `telegram.*` pasuje do `telegram.http`
  - `*` włącza wszystkie flagi

## Włączanie przez konfigurację

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Wiele flag:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

Uruchom ponownie Gateway po zmianie flag.

## Nadpisanie zmienną środowiskową (jednorazowe)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Wyłączenie wszystkich flag:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Artefakty osi czasu

Flaga `timeline` zapisuje ustrukturyzowane zdarzenia czasowe uruchamiania i działania dla
zewnętrznych narzędzi QA:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

Możesz też włączyć ją w konfiguracji:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

Ścieżka pliku osi czasu nadal pochodzi z
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`. Gdy `timeline` jest włączona tylko z
konfiguracji, najwcześniejsze zakresy ładowania konfiguracji nie są emitowane, ponieważ OpenClaw
nie odczytał jeszcze konfiguracji; kolejne zakresy uruchamiania używają flagi z konfiguracji.

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all` oraz
`OPENCLAW_DIAGNOSTICS=*` również włączają oś czasu, ponieważ włączają każdą
flagę diagnostyczną. Użyj `timeline`, gdy potrzebujesz tylko artefaktu czasowego
JSONL.

Rekordy osi czasu używają koperty `openclaw.diagnostics.v1`. Zdarzenia mogą zawierać
identyfikatory procesów, nazwy faz, nazwy zakresów, czasy trwania, identyfikatory pluginów, liczby zależności,
próbki opóźnień pętli zdarzeń, nazwy operacji dostawców, stan zakończenia procesów potomnych
oraz nazwy/komunikaty błędów uruchamiania. Traktuj pliki osi czasu jako lokalne artefakty
diagnostyczne; przejrzyj je przed udostępnieniem poza swoją maszynę.

## Gdzie trafiają logi

Flagi emitują logi do standardowego pliku logu diagnostycznego. Domyślnie:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Jeśli ustawisz `logging.file`, użyj zamiast tego tej ścieżki. Logi są w formacie JSONL (jeden obiekt JSON na wiersz). Redakcja nadal obowiązuje zgodnie z `logging.redactSensitive`.

## Wyodrębnianie logów

Wybierz najnowszy plik logu:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filtruj diagnostykę HTTP Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Filtruj diagnostykę HTTP Brave Search:

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

Albo śledź log podczas odtwarzania problemu:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

W przypadku zdalnych Gateway możesz też użyć `openclaw logs --follow` (zobacz [/cli/logs](/pl/cli/logs)).

## Uwagi

- Jeśli `logging.level` jest ustawiony wyżej niż `warn`, te logi mogą zostać wyciszone. Domyślne `info` jest odpowiednie.
- `brave.http` loguje adresy URL/parametry zapytań żądań Brave Search, status/czas odpowiedzi oraz zdarzenia trafienia/pominięcia/zapisu w pamięci podręcznej. Nie loguje kluczy API ani treści odpowiedzi, ale zapytania wyszukiwania mogą być wrażliwe.
- Flagi można bezpiecznie pozostawić włączone; wpływają tylko na objętość logów konkretnego podsystemu.
- Użyj [/logging](/pl/logging), aby zmienić miejsca docelowe logów, poziomy i redakcję.

## Powiązane

- [Diagnostyka Gateway](/pl/gateway/diagnostics)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
