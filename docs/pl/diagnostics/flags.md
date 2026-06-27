---
read_when:
    - Potrzebujesz ukierunkowanych dzienników debugowania bez podnoszenia globalnych poziomów logowania
    - Musisz przechwycić dzienniki specyficzne dla podsystemu na potrzeby wsparcia
summary: Flagi diagnostyczne dla ukierunkowanych dzienników debugowania
title: Flagi diagnostyczne
x-i18n:
    generated_at: "2026-06-27T17:30:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c78c5c2f90fb1d601d0a3ef94919310759d58c9f9c70a093c91f31594bc777fb
    source_path: diagnostics/flags.md
    workflow: 16
---

Flagi diagnostyczne pozwalają włączać ukierunkowane logi debugowania bez uruchamiania szczegółowego logowania wszędzie. Flagi są opcjonalne i nie mają efektu, dopóki podsystem ich nie sprawdzi.

## Jak to działa

- Flagi są ciągami znaków (bez rozróżniania wielkości liter).
- Możesz włączać flagi w konfiguracji albo przez nadpisanie zmienną środowiskową.
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

Po zmianie flag uruchom ponownie Gateway.

## Nadpisanie zmienną środowiskową (jednorazowe)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Wyłącz wszystkie flagi:

```bash
OPENCLAW_DIAGNOSTICS=0
```

`OPENCLAW_DIAGNOSTICS=0` to nadpisanie wyłączające na poziomie procesu: wyłącza
flagi zarówno ze zmiennych środowiskowych, jak i z konfiguracji dla tego procesu.

## Flagi profilowania

Flagi profilera włączają ukierunkowane przedziały pomiaru czasu bez podnoszenia globalnych poziomów logowania. Domyślnie są wyłączone.

Włącz wszystkie przedziały chronione profilerem dla jednego uruchomienia Gateway:

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

Włącz tylko przedziały profilera wysyłania odpowiedzi:

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

Włącz tylko przedziały profilera uruchamiania serwera aplikacji Codex, narzędzi i wątków:

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

Włącz flagi profilera z konfiguracji:

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

Po zmianie flag konfiguracji uruchom ponownie Gateway. Aby wyłączyć flagę profilera,
usuń ją z `diagnostics.flags` i uruchom ponownie. Aby tymczasowo wyłączyć każdą
flagę diagnostyczną nawet wtedy, gdy konfiguracja włącza flagi profilera, uruchom proces z:

```bash
OPENCLAW_DIAGNOSTICS=0 openclaw gateway run
```

## Artefakty osi czasu

Flaga `timeline` zapisuje ustrukturyzowane zdarzenia pomiaru czasu uruchamiania i działania dla
zewnętrznych harnessów QA:

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
konfiguracji, najwcześniejsze przedziały ładowania konfiguracji nie są emitowane, ponieważ OpenClaw
nie odczytał jeszcze konfiguracji; kolejne przedziały uruchamiania używają flagi z konfiguracji.

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all` i
`OPENCLAW_DIAGNOSTICS=*` również włączają oś czasu, ponieważ włączają każdą
flagę diagnostyczną. Wybierz `timeline`, gdy chcesz tylko artefakt pomiaru czasu JSONL.

Rekordy osi czasu używają otoczki `openclaw.diagnostics.v1`. Zdarzenia mogą zawierać
identyfikatory procesów, nazwy faz, nazwy przedziałów, czasy trwania, identyfikatory pluginów, liczby zależności,
próbki opóźnień pętli zdarzeń, nazwy operacji dostawców, stan wyjścia procesów potomnych
oraz nazwy/komunikaty błędów uruchamiania. Traktuj pliki osi czasu jako lokalne artefakty diagnostyczne;
przejrzyj je przed udostępnieniem poza swoją maszyną.

## Gdzie trafiają logi

Flagi emitują logi do standardowego pliku logu diagnostycznego. Domyślnie:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Jeśli ustawisz `logging.file`, użyj zamiast tego tej ścieżki. Logi są w formacie JSONL (jeden obiekt JSON na wiersz). Redagowanie nadal obowiązuje na podstawie `logging.redactSensitive`.

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

- Jeśli `logging.level` jest ustawiony wyżej niż `warn`, te logi mogą zostać pominięte. Domyślne `info` jest odpowiednie.
- `brave.http` loguje adresy URL/parametry zapytań żądań Brave Search, status/czas odpowiedzi oraz zdarzenia trafienia/chybienia/zapisu pamięci podręcznej. Nie loguje kluczy API ani treści odpowiedzi, ale zapytania wyszukiwania mogą być wrażliwe.
- Flagi można bezpiecznie pozostawić włączone; wpływają tylko na objętość logów dla konkretnego podsystemu.
- Użyj [/logging](/pl/logging), aby zmienić miejsca docelowe logów, poziomy i redagowanie.

## Powiązane

- [Diagnostyka Gateway](/pl/gateway/diagnostics)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
