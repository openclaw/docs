---
read_when:
    - Potrzebujesz ukierunkowanych logów debugowania bez zwiększania globalnych poziomów logowania
    - Należy zebrać logi specyficzne dla podsystemu na potrzeby pomocy technicznej
summary: Flagi diagnostyczne dla ukierunkowanych logów debugowania
title: Flagi diagnostyczne
x-i18n:
    generated_at: "2026-04-30T09:50:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 486051e54c456dedcae5dce59e253add3554d8417660bfc97a75d21fa5fdd6f5
    source_path: diagnostics/flags.md
    workflow: 16
---

Flagi diagnostyczne pozwalają włączać ukierunkowane dzienniki debugowania bez włączania szczegółowego logowania wszędzie. Flagi są opcjonalne i nie mają żadnego efektu, dopóki podsystem ich nie sprawdzi.

## Jak to działa

- Flagi są ciągami znaków (bez rozróżniania wielkości liter).
- Flagi można włączyć w konfiguracji albo przez nadpisanie zmienną środowiskową.
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
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

Uruchom ponownie Gateway po zmianie flag.

## Nadpisanie zmienną środowiskową (jednorazowe)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Wyłącz wszystkie flagi:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Artefakty osi czasu

Flaga `timeline` zapisuje ustrukturyzowane zdarzenia czasu uruchamiania i działania dla
zewnętrznych zestawów QA:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

Możesz ją też włączyć w konfiguracji:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

Ścieżka pliku osi czasu nadal pochodzi z
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`. Gdy `timeline` jest włączona tylko z
konfiguracji, najwcześniejsze odcinki ładowania konfiguracji nie są emitowane, ponieważ OpenClaw
nie odczytał jeszcze konfiguracji; kolejne odcinki uruchamiania używają flagi z konfiguracji.

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all` i
`OPENCLAW_DIAGNOSTICS=*` również włączają oś czasu, ponieważ włączają każdą
flagę diagnostyczną. Użyj `timeline`, gdy potrzebujesz tylko artefaktu czasu
JSONL.

Rekordy osi czasu używają koperty `openclaw.diagnostics.v1`. Zdarzenia mogą zawierać
identyfikatory procesów, nazwy faz, nazwy odcinków, czasy trwania, identyfikatory pluginów, liczby zależności,
próbki opóźnień pętli zdarzeń, nazwy operacji dostawców, stan zakończenia procesu potomnego
oraz nazwy/komunikaty błędów uruchamiania. Traktuj pliki osi czasu jako lokalne artefakty
diagnostyczne; przejrzyj je przed udostępnieniem poza swoim komputerem.

## Gdzie trafiają dzienniki

Flagi emitują dzienniki do standardowego pliku dziennika diagnostycznego. Domyślnie:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Jeśli ustawisz `logging.file`, użyj zamiast tego tej ścieżki. Dzienniki mają format JSONL (jeden obiekt JSON na wiersz). Redagowanie nadal obowiązuje zgodnie z `logging.redactSensitive`.

## Wyodrębnianie dzienników

Wybierz najnowszy plik dziennika:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filtruj diagnostykę HTTP Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Albo śledź podczas odtwarzania problemu:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

W przypadku zdalnych instancji Gateway możesz też użyć `openclaw logs --follow` (zobacz [/cli/logs](/pl/cli/logs)).

## Uwagi

- Jeśli `logging.level` jest ustawiony wyżej niż `warn`, te dzienniki mogą zostać pominięte. Domyślne `info` jest odpowiednie.
- Flagi można bezpiecznie pozostawić włączone; wpływają tylko na ilość dzienników konkretnego podsystemu.
- Użyj [/logging](/pl/logging), aby zmienić miejsca docelowe dzienników, poziomy i redagowanie.

## Powiązane

- [Diagnostyka Gateway](/pl/gateway/diagnostics)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
