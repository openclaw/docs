---
read_when:
    - Je wilt de lokale status wissen terwijl de CLI geïnstalleerd blijft
    - Je wilt een proefuitvoering zien van wat er zou worden verwijderd
summary: CLI-referentie voor `openclaw reset` (lokale status/configuratie resetten)
title: Resetten
x-i18n:
    generated_at: "2026-04-29T22:34:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: e4a4aba32fb44905d079bf2a22e582a3affbe9809eac9af237ce3e48da72b42c
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

Lokale configuratie/status resetten (laat de CLI geïnstalleerd).

Opties:

- `--scope <scope>`: `config`, `config+creds+sessions`, of `full`
- `--yes`: bevestigingsprompts overslaan
- `--non-interactive`: prompts uitschakelen; vereist `--scope` en `--yes`
- `--dry-run`: acties weergeven zonder bestanden te verwijderen

Voorbeelden:

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

Opmerkingen:

- Voer eerst `openclaw backup create` uit als je een herstelbare momentopname wilt voordat je de lokale status verwijdert.
- Als je `--scope` weglaat, gebruikt `openclaw reset` een interactieve prompt om te kiezen wat er wordt verwijderd.
- `--non-interactive` is alleen geldig wanneer zowel `--scope` als `--yes` zijn ingesteld.

## Gerelateerd

- [CLI-referentie](/nl/cli)
