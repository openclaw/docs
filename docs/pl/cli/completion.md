---
read_when:
    - Chcesz uzupełnianie poleceń powłoki dla zsh/bash/fish/PowerShell
    - Musisz zapisać skrypty uzupełniania w stanie OpenClaw
summary: Dokumentacja CLI dla `openclaw completion` (generowanie/instalacja skryptów uzupełniania powłoki)
title: completion
x-i18n:
    generated_at: "2026-04-05T13:47:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7bbf140a880bafdb7140149f85465d66d0d46e5a3da6a1e41fb78be2fd2bd4d0
    source_path: cli/completion.md
    workflow: 15
---

# `openclaw completion`

Generuje skrypty uzupełniania powłoki i opcjonalnie instaluje je w profilu powłoki.

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
- `-i, --install`: instaluje uzupełnianie przez dodanie linii source do profilu powłoki
- `--write-state`: zapisuje skrypt(y) uzupełniania do `$OPENCLAW_STATE_DIR/completions` bez wypisywania na stdout
- `-y, --yes`: pomija prośby o potwierdzenie instalacji

## Uwagi

- `--install` zapisuje mały blok „OpenClaw Completion” w profilu powłoki i wskazuje go na zapisany w pamięci podręcznej skrypt.
- Bez `--install` lub `--write-state` polecenie wypisuje skrypt na stdout.
- Generowanie uzupełniania zachłannie ładuje drzewa poleceń, aby uwzględnić zagnieżdżone podpolecenia.
