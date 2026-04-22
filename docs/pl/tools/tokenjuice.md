---
read_when:
    - Chcesz krótszych wyników narzędzi `exec` lub `bash` w OpenClaw
    - Chcesz włączyć dołączony Plugin tokenjuice
    - Musisz zrozumieć, co tokenjuice zmienia, a co pozostawia w surowej postaci
summary: Kompaktowanie zaszumionych wyników narzędzi exec i bash za pomocą opcjonalnego dołączonego Pluginu
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-22T09:53:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b9a1054c9b1cc62e43ac6d5904c7790f9b27d8e0d0700c9da6e287c00e91783
    source_path: tools/tokenjuice.md
    workflow: 15
---

# Tokenjuice

`tokenjuice` to opcjonalny dołączony Plugin, który kompaktuje zaszumione wyniki narzędzi `exec` i `bash`
po tym, jak polecenie zostało już uruchomione.

Zmienia zwracany `tool_result`, a nie samo polecenie. Tokenjuice nie
przepisuje danych wejściowych shella, nie uruchamia ponownie poleceń ani nie zmienia kodów wyjścia.

Obecnie dotyczy to osadzonych uruchomień Pi, gdzie tokenjuice przechwytuje ścieżkę osadzonego
`tool_result` i przycina dane wyjściowe, które wracają do sesji.

## Włącz Plugin

Szybka ścieżka:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Równoważnie:

```bash
openclaw plugins enable tokenjuice
```

OpenClaw już dostarcza ten Plugin. Nie ma osobnego kroku `plugins install`
ani `tokenjuice install openclaw`.

Jeśli wolisz edytować konfigurację bezpośrednio:

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

- Kompaktuje zaszumione wyniki `exec` i `bash`, zanim zostaną odesłane z powrotem do sesji.
- Pozostawia oryginalne wykonanie polecenia bez zmian.
- Zachowuje dokładne odczyty zawartości plików i inne polecenia, które tokenjuice powinien pozostawić w surowej postaci.
- Pozostaje funkcją opt-in: wyłącz Plugin, jeśli chcesz mieć dosłowne dane wyjściowe wszędzie.

## Sprawdź, czy działa

1. Włącz Plugin.
2. Uruchom sesję, która może wywoływać `exec`.
3. Uruchom zaszumione polecenie, takie jak `git status`.
4. Sprawdź, czy zwrócony wynik narzędzia jest krótszy i bardziej uporządkowany niż surowe dane wyjściowe shella.

## Wyłącz Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Albo:

```bash
openclaw plugins disable tokenjuice
```
