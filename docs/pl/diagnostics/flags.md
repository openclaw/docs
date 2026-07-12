---
read_when:
    - Potrzebujesz ukierunkowanych dzienników debugowania bez podnoszenia globalnych poziomów rejestrowania.
    - Musisz zebrać dzienniki specyficzne dla podsystemu na potrzeby pomocy technicznej
summary: Flagi diagnostyczne do ukierunkowanych dzienników debugowania
title: Flagi diagnostyczne
x-i18n:
    generated_at: "2026-07-12T15:06:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9847f464fde89d9e639b089fe54fb933deb9debad2a6d8b120ab01bacff181a8
    source_path: diagnostics/flags.md
    workflow: 16
---

Flagi diagnostyczne włączają dodatkowe rejestrowanie dla jednego podsystemu bez globalnego podnoszenia poziomu `logging.level`. Flaga nie ma żadnego efektu, jeśli podsystem jej nie sprawdza.

## Jak to działa

- Flagi są ciągami znaków niewrażliwymi na wielkość liter, pobieranymi z `diagnostics.flags` w konfiguracji oraz z nadpisania przez zmienną środowiskową `OPENCLAW_DIAGNOSTICS`; duplikaty są usuwane, a litery zamieniane na małe.
- `name.*` pasuje do samego `name` oraz wszystkiego poniżej `name.` (na przykład `telegram.*` pasuje do `telegram.http`).
- `*` lub `all` włącza każdą flagę.
- Po zmianie `diagnostics.flags` w konfiguracji uruchom Gateway ponownie; konfiguracja ta nie jest przeładowywana na gorąco.

## Znane flagi

| Flaga            | Włącza                                                              |
| ---------------- | -------------------------------------------------------------------- |
| `telegram.http`  | Rejestrowanie błędów HTTP interfejsu Telegram Bot API                |
| `brave.http`     | Rejestrowanie żądań, odpowiedzi i pamięci podręcznej Brave Search    |
| `profiler`       | Profiler etapu odpowiedzi i profiler serwera aplikacji Codex (oba)   |
| `reply.profiler` | Tylko profiler etapu odpowiedzi                                      |
| `codex.profiler` | Tylko profiler serwera aplikacji Codex                               |
| `timeline`       | Ustrukturyzowany artefakt osi czasu JSONL (patrz poniżej)             |

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

## Nadpisanie zmienną środowiskową (jednorazowe)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,brave.http
```

Wartości są rozdzielane przecinkami lub białymi znakami. Wartości specjalne:

| Wartość                     | Efekt                                                     |
| --------------------------- | --------------------------------------------------------- |
| `0`, `false`, `off`, `none` | Wyłącza wszystkie flagi, nadpisując również konfigurację  |
| `1`, `true`, `all`, `*`     | Włącza każdą flagę                                        |

`OPENCLAW_DIAGNOSTICS=0` wyłącza dla danego procesu flagi pochodzące zarówno ze zmiennej środowiskowej, jak i z konfiguracji. Jest to przydatne do tymczasowego wyciszenia flagi profilera pozostawionej włączonej w konfiguracji bez edytowania pliku.

## Flagi profilera

Flagi profilera sterują lekkimi przedziałami pomiaru czasu; gdy są wyłączone, nie powodują żadnego narzutu.

Włącz wszystkie przedziały kontrolowane przez profiler na czas jednego uruchomienia Gateway:

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

Włącz tylko przedziały profilera wysyłania odpowiedzi:

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

Włącz tylko przedziały profilera uruchamiania, narzędzi i wątków serwera aplikacji Codex:

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

`profiler` włącza zarówno profiler odpowiedzi, jak i profiler Codex; użyj nazw flag o węższym zakresie, aby włączyć tylko jeden z nich.

Możesz też ustawić je w konfiguracji:

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

Po zmianie flag konfiguracji uruchom Gateway ponownie. Aby wyłączyć flagę profilera, usuń ją z `diagnostics.flags` i uruchom Gateway ponownie albo uruchom proces z `OPENCLAW_DIAGNOSTICS=0`, aby na czas tego uruchomienia nadpisać wszystkie flagi diagnostyczne.

## Artefakty osi czasu

Flaga `timeline` (alias: `diagnostics.timeline`) zapisuje ustrukturyzowane zdarzenia pomiaru czasu uruchamiania i działania w formacie JSONL na potrzeby zewnętrznych zestawów testów kontroli jakości:

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

Ścieżka wyjściowa zawsze pochodzi z `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`, nawet gdy sama flaga jest ustawiona w konfiguracji; nie istnieje klucz konfiguracji określający tę ścieżkę. Gdy `timeline` jest włączona wyłącznie w konfiguracji, brakuje najwcześniejszych przedziałów ładowania konfiguracji, ponieważ OpenClaw nie odczytał jej jeszcze w tym momencie; kolejne przedziały uruchamiania są rejestrowane normalnie.

`OPENCLAW_DIAGNOSTICS=1`, `=all` i `=*` również włączają oś czasu, ponieważ włączają każdą flagę. Użyj flagi `timeline` o węższym zakresie, jeśli potrzebujesz wyłącznie artefaktu JSONL, bez wszystkich pozostałych flag diagnostycznych.

Próbki opóźnienia pętli zdarzeń na osi czasu wymagają dodatkowego jawnego włączenia poza `timeline`: oprócz włączenia osi czasu ustaw `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` (lub `on`/`true`/`yes`).

Rekordy osi czasu korzystają z otoczki `openclaw.diagnostics.v1` i mogą zawierać identyfikatory procesów, nazwy faz, nazwy przedziałów, czasy trwania, identyfikatory pluginów, liczby zależności, próbki opóźnienia pętli zdarzeń, nazwy operacji dostawcy, stan zakończenia procesu potomnego oraz nazwy i komunikaty błędów uruchamiania. Traktuj pliki osi czasu jako lokalne artefakty diagnostyczne; przejrzyj je przed udostępnieniem poza swoim urządzeniem.

## Miejsce zapisywania dzienników

Flagi zapisują komunikaty w standardowym pliku dziennika diagnostycznego. Domyślnie:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Jeśli ustawisz `logging.file`, zostanie użyta podana tam ścieżka. Dzienniki są w formacie JSONL (jeden obiekt JSON w każdym wierszu). Redagowanie nadal odbywa się zgodnie z ustawieniem `logging.redactSensitive`. Pełny opis rozpoznawania ścieżki dziennika, rotacji i modelu redagowania zawiera sekcja [Rejestrowanie](/pl/logging).

## Wyodrębnianie dzienników

Wybierz najnowszy plik dziennika:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Odfiltruj diagnostykę HTTP Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Odfiltruj diagnostykę HTTP Brave Search:

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

Możesz też obserwować dziennik podczas odtwarzania problemu:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

W przypadku zdalnych instancji Gateway użyj zamiast tego `openclaw logs --follow` (patrz [/cli/logs](/pl/cli/logs)).

## Uwagi

- Jeśli `logging.level` ma poziom wyższy niż `warn`, komunikaty kontrolowane flagami mogą zostać pominięte. Domyślny poziom `info` jest odpowiedni.
- `brave.http` rejestruje adresy URL i parametry zapytań żądań Brave Search, stan i czas odpowiedzi oraz zdarzenia trafienia, chybienia i zapisu w pamięci podręcznej. Nie rejestruje klucza API (przesyłanego w nagłówku żądania) ani treści odpowiedzi, ale zapytania wyszukiwania mogą zawierać dane wrażliwe.
- Pozostawienie flag włączonych jest bezpieczne; wpływają one tylko na liczbę wpisów dziennika dotyczących określonego podsystemu.
- Użyj sekcji [/logging](/pl/logging), aby zmienić miejsca docelowe dzienników, poziomy i redagowanie.

## Powiązane

- [Diagnostyka Gateway](/pl/gateway/diagnostics)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
