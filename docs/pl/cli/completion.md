---
read_when:
    - Potrzebujesz uzupełniania poleceń powłoki dla zsh/bash/fish/PowerShell
    - Musisz buforować skrypty uzupełniania w stanie OpenClaw
summary: Dokumentacja CLI dla `openclaw completion` (generowanie/instalowanie skryptów uzupełniania powłoki)
title: Uzupełnianie
x-i18n:
    generated_at: "2026-07-12T14:57:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67cb52a47036745150887c752d18e2dfa84fab2722c27c696142d23080bb2efd
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

Generuje skrypty uzupełniania dla powłoki, zapisuje je w pamięci podręcznej stanu OpenClaw i opcjonalnie instaluje je w profilu powłoki.

## Użycie

```bash
openclaw completion                          # wyświetla skrypt zsh na standardowym wyjściu
openclaw completion --shell fish             # wyświetla skrypt fish
openclaw completion --write-state            # zapisuje w pamięci podręcznej skrypty dla wszystkich powłok
openclaw completion --write-state --install  # zapisuje w pamięci podręcznej, a następnie instaluje w jednym kroku
openclaw completion --shell bash --write-state
```

## Opcje

- `-s, --shell <shell>`: docelowa powłoka (`zsh`, `bash`, `powershell`, `fish`; domyślnie: `zsh`)
- `-i, --install`: instaluje uzupełnianie, dodając do profilu powłoki wiersz wczytujący skrypt zapisany w pamięci podręcznej
- `--write-state`: zapisuje skrypt lub skrypty uzupełniania w `$OPENCLAW_STATE_DIR/completions` (domyślnie `~/.openclaw/completions`) bez wyświetlania na standardowym wyjściu; z `--shell` zapisuje tylko skrypt dla wskazanej powłoki, a bez tej opcji — dla wszystkich czterech
- `-y, --yes`: pomija monity o potwierdzenie instalacji (tryb nieinteraktywny)

## Przebieg instalacji

Opcja `--install` konfiguruje profil tak, aby wskazywał skrypt zapisany w pamięci podręcznej, dlatego pamięć podręczna musi już istnieć. Jeśli jej brakuje, polecenie kończy się niepowodzeniem i wyświetla instrukcję uruchomienia `openclaw completion --write-state`. Połącz opcje `--write-state --install`, aby wykonać obie czynności w jednym kroku. Bez opcji `--shell` opcja `--install` wykrywa powłokę na podstawie `$SHELL` (a w razie niepowodzenia używa zsh).

Instalacja zapisuje niewielki blok `# OpenClaw Completion` w profilu powłoki i zastępuje wszelkie starsze, wolne wiersze `source <(openclaw completion ...)` wierszem wczytującym skrypt z pamięci podręcznej:

| Powłoka    | Profil                                                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| bash       | `~/.bashrc` (jeśli brakuje `~/.bashrc`, używa `~/.bash_profile`)                                                                                                                           |
| fish       | `~/.config/fish/config.fish`                                                                                                                                                               |
| powershell | `~/.config/powershell/Microsoft.PowerShell_profile.ps1` (w systemie Windows: `Documents/PowerShell/Microsoft.PowerShell_profile.ps1` lub `Documents/WindowsPowerShell/...` dla Windows PowerShell) |
| zsh        | `~/.zshrc`                                                                                                                                                                                 |

## Uwagi

- Bez opcji `--install` ani `--write-state` polecenie wyświetla skrypt na standardowym wyjściu.
- Generowanie uzupełniania od razu wczytuje całe drzewo poleceń, w tym polecenia CLI pluginów, dlatego obejmuje również zagnieżdżone podpolecenia.
- `openclaw update` automatycznie odświeża pamięć podręczną uzupełniania po pomyślnej aktualizacji; `openclaw doctor` może naprawić brakującą lub nieaktualną konfigurację uzupełniania.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
