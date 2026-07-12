---
read_when:
    - Chcesz uzyskać krótsze wyniki narzędzi `exec` lub `bash` w OpenClaw
    - Chcesz zainstalować lub włączyć plugin Tokenjuice
    - Musisz zrozumieć, co tokenjuice zmienia, a co pozostawia w postaci surowej
summary: Kompaktuj obszerne wyniki narzędzi exec i bash za pomocą opcjonalnego pluginu Tokenjuice
title: Tokenjuice
x-i18n:
    generated_at: "2026-07-12T15:44:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96b110563a2600429dd9f0d38997cf7cc5ae4952b7f146a6ab64c96f2f202440
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` to opcjonalny zewnętrzny plugin, który kompaktuje zaszumione wyniki narzędzi `exec` i `bash`
po wykonaniu polecenia.

Zmienia zwracany `tool_result`, a nie samo polecenie. Tokenjuice nie
modyfikuje danych wejściowych powłoki, nie uruchamia ponownie poleceń ani nie zmienia kodów wyjścia.

Obecnie dotyczy to osadzonych uruchomień OpenClaw i dynamicznych narzędzi OpenClaw w środowisku
app-servera Codex. Tokenjuice integruje się z warstwą pośrednią wyników narzędzi OpenClaw i
przycina dane wyjściowe przed ich przekazaniem z powrotem do aktywnej sesji środowiska wykonawczego.

## Włącz plugin

Zainstaluj jeden raz:

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

Następnie go włącz:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Równoważne polecenie:

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

- Kompaktuje zaszumione wyniki `exec` i `bash` przed ich ponownym przekazaniem do sesji.
- Nie ingeruje w pierwotne wykonanie polecenia.
- Stosuje bezpieczne zasady inwentaryzacji: dokładne odczyty zawartości plików pozostają niezmienione, samodzielne polecenia inwentaryzujące repozytorium mogą być kompaktowane, a niebezpieczne mieszane sekwencje poleceń pozostają niezmienione.
- Pozostaje opcjonalny: wyłącz plugin, jeśli wszędzie chcesz otrzymywać dosłowne dane wyjściowe.

## Sprawdź, czy działa

1. Włącz plugin.
2. Uruchom sesję, która może wywoływać `exec`.
3. Uruchom generujące dużo danych polecenie, takie jak `git status`.
4. Sprawdź, czy zwrócony wynik narzędzia jest krótszy i bardziej uporządkowany niż nieprzetworzone dane wyjściowe powłoki.

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
- [Poziomy rozumowania](/pl/tools/thinking)
- [Mechanizm kontekstu](/pl/concepts/context-engine)
