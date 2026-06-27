---
read_when:
    - Je wilt de Gateway-service en/of lokale status verwijderen
    - Je wilt eerst een dry-run
summary: CLI-referentie voor `openclaw uninstall` (Gateway-service + lokale gegevens verwijderen)
title: Verwijderen
x-i18n:
    generated_at: "2026-06-27T17:23:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f90fa8cf513e2e8cd422c3b8a880e7fd20fb71131a3ec88260e765daa2ace543
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Verwijder de Gateway-service + lokale gegevens (CLI blijft behouden).

Opties:

- `--service`: verwijder de Gateway-service
- `--state`: verwijder status en configuratie
- `--workspace`: verwijder werkruimtemappen
- `--app`: verwijder de macOS-app
- `--all`: verwijder service, status, werkruimte en app
- `--yes`: sla bevestigingsprompts over
- `--non-interactive`: schakel prompts uit; vereist `--yes`
- `--dry-run`: toon acties zonder bestanden te verwijderen

Voorbeelden:

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

Opmerkingen:

- Voer eerst `openclaw backup create` uit als je een herstelbare momentopname wilt voordat je status of werkruimten verwijdert.
- `--state` behoudt geconfigureerde werkruimtemappen tenzij `--workspace` ook is geselecteerd.
- `--all` is een verkorte optie om service, status, werkruimte en app samen te verwijderen.
- `--non-interactive` vereist `--yes`.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Verwijderen](/nl/install/uninstall)
