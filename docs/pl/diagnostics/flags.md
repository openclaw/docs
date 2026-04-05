---
read_when:
    - Potrzebujesz ukierunkowanych logów debugowania bez podnoszenia globalnych poziomów logowania
    - Musisz przechwycić logi specyficzne dla podsystemu do wsparcia
summary: Flagi diagnostyczne dla ukierunkowanych logów debugowania
title: Flagi diagnostyczne
x-i18n:
    generated_at: "2026-04-05T13:51:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: daf0eca0e6bd1cbc2c400b2e94e1698709a96b9cdba1a8cf00bd580a61829124
    source_path: diagnostics/flags.md
    workflow: 15
---

# Flagi diagnostyczne

Flagi diagnostyczne pozwalają włączyć ukierunkowane logi debugowania bez włączania verbose logowania wszędzie. Flagi są opcjonalne i nie mają żadnego efektu, dopóki jakiś podsystem ich nie sprawdza.

## Jak to działa

- Flagi są ciągami znaków (bez rozróżniania wielkości liter).
- Flagi można włączyć w config lub przez nadpisanie zmienną środowiskową.
- Obsługiwane są wildcardy:
  - `telegram.*` pasuje do `telegram.http`
  - `*` włącza wszystkie flagi

## Włączanie przez config

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

Po zmianie flag uruchom ponownie gateway.

## Nadpisanie przez zmienną środowiskową (jednorazowe)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Wyłącz wszystkie flagi:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Gdzie trafiają logi

Flagi emitują logi do standardowego pliku logów diagnostycznych. Domyślnie:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Jeśli ustawisz `logging.file`, używana będzie ta ścieżka. Logi mają format JSONL (jeden obiekt JSON na linię). Redakcja nadal obowiązuje zgodnie z `logging.redactSensitive`.

## Wyodrębnianie logów

Wybierz najnowszy plik logu:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filtruj pod kątem diagnostyki HTTP Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Albo śledź na żywo podczas odtwarzania problemu:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Dla zdalnych gateway możesz także użyć `openclaw logs --follow` (zobacz [/cli/logs](/cli/logs)).

## Uwagi

- Jeśli `logging.level` jest ustawione wyżej niż `warn`, te logi mogą zostać stłumione. Domyślne `info` jest odpowiednie.
- Flagi można bezpiecznie pozostawić włączone; wpływają tylko na wolumen logów dla konkretnego podsystemu.
- Użyj [/logging](/logging), aby zmienić miejsca docelowe logów, poziomy i redakcję.
