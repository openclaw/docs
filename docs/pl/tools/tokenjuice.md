---
read_when:
    - Chcesz krótszych wyników narzędzi `exec` lub `bash` w OpenClaw
    - Chcesz włączyć dołączony Plugin tokenjuice
    - Musisz zrozumieć, co tokenjuice zmienia, a co pozostawia surowe
summary: Kompaktuj zaszumione wyniki narzędzi exec i bash za pomocą opcjonalnego dołączonego Pluginu
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-24T09:38:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ff542095eb730f06eadec213289b93e31f1afa179160b7d4e915329f09ad5f1
    source_path: tools/tokenjuice.md
    workflow: 15
---

`tokenjuice` to opcjonalny dołączony Plugin, który kompaktuje zaszumione wyniki narzędzi `exec` i `bash`
po tym, jak polecenie zostało już uruchomione.

Zmienia zwracany `tool_result`, a nie samo polecenie. Tokenjuice nie
przepisuje wejścia powłoki, nie uruchamia ponownie poleceń i nie zmienia kodów wyjścia.

Obecnie dotyczy to osadzonych uruchomień Pi, gdzie tokenjuice podpina się do ścieżki
osadzonego `tool_result` i przycina dane wyjściowe wracające do sesji.

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

- Kompaktuje zaszumione wyniki `exec` i `bash`, zanim zostaną zwrócone do sesji.
- Pozostawia samo wykonanie polecenia bez zmian.
- Zachowuje dokładne odczyty zawartości plików i inne polecenia, które tokenjuice powinien pozostawić w surowej postaci.
- Pozostaje opcjonalny: wyłącz Plugin, jeśli chcesz wszędzie dosłownego wyniku.

## Jak sprawdzić, czy działa

1. Włącz Plugin.
2. Rozpocznij sesję, która może wywoływać `exec`.
3. Uruchom zaszumione polecenie, takie jak `git status`.
4. Sprawdź, czy zwrócony wynik narzędzia jest krótszy i bardziej uporządkowany niż surowe dane wyjściowe powłoki.

## Wyłącz Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Albo:

```bash
openclaw plugins disable tokenjuice
```

## Powiązane

- [Exec tool](/pl/tools/exec)
- [Thinking levels](/pl/tools/thinking)
- [Context engine](/pl/concepts/context-engine)
