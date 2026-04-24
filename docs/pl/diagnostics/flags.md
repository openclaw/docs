---
read_when:
    - Potrzebujesz ukierunkowanych logów debugowania bez podnoszenia globalnych poziomów logowania
    - Musisz przechwycić logi specyficzne dla podsystemu na potrzeby wsparcia
summary: Flagi diagnostyczne do ukierunkowanych logów debugowania
title: Flagi diagnostyczne
x-i18n:
    generated_at: "2026-04-24T09:08:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7e5ec9c5e28ef51f1e617baf62412897df8096f227a74d86a0824e269aafd9d
    source_path: diagnostics/flags.md
    workflow: 15
---

Flagi diagnostyczne pozwalają włączyć ukierunkowane logi debugowania bez włączania szczegółowego logowania wszędzie. Flagi są opt-in i nie mają żadnego efektu, dopóki podsystem ich nie sprawdza.

## Jak to działa

- Flagi są ciągami znaków (bez rozróżniania wielkości liter).
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
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

Po zmianie flag uruchom ponownie Gateway.

## Nadpisanie zmienną środowiskową (jednorazowo)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Wyłączenie wszystkich flag:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Gdzie trafiają logi

Flagi emitują logi do standardowego pliku logów diagnostycznych. Domyślnie:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Jeśli ustawisz `logging.file`, używana będzie ta ścieżka. Logi są w formacie JSONL (jeden obiekt JSON na linię). Redakcja nadal obowiązuje zgodnie z `logging.redactSensitive`.

## Wyodrębnianie logów

Wybierz najnowszy plik logów:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filtr dla diagnostyki HTTP Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Lub śledzenie podczas odtwarzania problemu:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

W przypadku zdalnych Gateway możesz też użyć `openclaw logs --follow` (zobacz [/cli/logs](/pl/cli/logs)).

## Uwagi

- Jeśli `logging.level` jest ustawione wyżej niż `warn`, te logi mogą być tłumione. Domyślne `info` jest odpowiednie.
- Flagi można bezpiecznie pozostawić włączone; wpływają tylko na wolumen logów dla określonego podsystemu.
- Użyj [/logging](/pl/logging), aby zmienić miejsca docelowe logów, poziomy i redakcję.

## Powiązane

- [Diagnostyka Gateway](/pl/gateway/diagnostics)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
