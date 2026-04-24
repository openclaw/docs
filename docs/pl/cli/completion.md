---
read_when:
    - Chcesz autouzupełnianie powłoki dla zsh/bash/fish/PowerShell.
    - Musisz przechowywać skrypty autouzupełniania w pamięci podręcznej w stanie OpenClaw.
summary: Dokumentacja CLI dla `openclaw completion` (generowanie/instalowanie skryptów autouzupełniania powłoki)
title: Autouzupełnianie
x-i18n:
    generated_at: "2026-04-24T09:02:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d064723b97f09105154197e4ef35b98ccb61e4b775f3fd990b18958f751f713
    source_path: cli/completion.md
    workflow: 15
---

# `openclaw completion`

Generuj skrypty autouzupełniania powłoki i opcjonalnie instaluj je w profilu swojej powłoki.

## Użycie

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## Opcje

- `-s, --shell <shell>`: docelowa powłoka (`zsh`, `bash`, `powershell`, `fish`; domyślnie: `zsh`)
- `-i, --install`: instaluje autouzupełnianie przez dodanie linii source do profilu powłoki
- `--write-state`: zapisuje skrypt(y) autouzupełniania do `$OPENCLAW_STATE_DIR/completions` bez wypisywania na stdout
- `-y, --yes`: pomija monity o potwierdzenie instalacji

## Uwagi

- `--install` zapisuje mały blok „OpenClaw Completion” do profilu powłoki i wskazuje go na skrypt z pamięci podręcznej.
- Bez `--install` lub `--write-state` polecenie wypisuje skrypt na stdout.
- Generowanie autouzupełniania ładuje drzewa poleceń z wyprzedzeniem, aby uwzględnić zagnieżdżone podpolecenia.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
