---
read_when:
    - Chcesz krótszych wyników narzędzi `exec` lub `bash` w OpenClaw
    - Chcesz zainstalować lub włączyć Plugin Tokenjuice
    - Musisz zrozumieć, co zmienia tokenjuice, a co pozostawia w stanie surowym
summary: Kompaktuj zaszumione wyniki narzędzi exec i bash za pomocą opcjonalnego pluginu Tokenjuice
title: Tokenjuice
x-i18n:
    generated_at: "2026-06-27T18:32:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 183ab08d2a1150b446245514423b893cff9a85581980c15600cc16aec10eeae7
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` to opcjonalny zewnętrzny plugin, który kompaktuje zaszumione wyniki narzędzi `exec` i `bash`
po tym, jak polecenie zostało już uruchomione.

Zmienia zwracany `tool_result`, a nie samo polecenie. Tokenjuice nie
przepisuje danych wejściowych powłoki, nie uruchamia poleceń ponownie ani nie zmienia kodów wyjścia.

Obecnie dotyczy to osadzonych uruchomień OpenClaw oraz dynamicznych narzędzi OpenClaw w uprzęży app-server Codex.
Tokenjuice podpina się pod middleware wyników narzędzi OpenClaw i
przycina dane wyjściowe, zanim wrócą do aktywnej sesji uprzęży.

## Włącz plugin

Zainstaluj raz:

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

Następnie włącz go:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Odpowiednik:

```bash
openclaw plugins enable tokenjuice
```

Jeśli wolisz bezpośrednio edytować konfigurację:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## Co zmienia tokenjuice

- Kompaktuje zaszumione wyniki `exec` i `bash`, zanim zostaną z powrotem przekazane do sesji.
- Pozostawia oryginalne wykonanie polecenia bez zmian.
- Zachowuje dokładne odczyty zawartości plików i inne polecenia, które tokenjuice powinien zostawić w surowej postaci.
- Pozostaje opcjonalny: wyłącz plugin, jeśli wszędzie chcesz otrzymywać dosłowne dane wyjściowe.

## Sprawdź, czy działa

1. Włącz plugin.
2. Rozpocznij sesję, która może wywołać `exec`.
3. Uruchom zaszumione polecenie, takie jak `git status`.
4. Sprawdź, czy zwrócony wynik narzędzia jest krótszy i bardziej uporządkowany niż surowe dane wyjściowe powłoki.

## Wyłącz plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Lub:

```bash
openclaw plugins disable tokenjuice
```

## Powiązane

- [Narzędzie Exec](/pl/tools/exec)
- [Poziomy myślenia](/pl/tools/thinking)
- [Silnik kontekstu](/pl/concepts/context-engine)
