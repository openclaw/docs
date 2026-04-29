---
read_when:
    - U wilt de Gateway-service en/of lokale status verwijderen
    - Je wilt eerst een proefrun uitvoeren
summary: CLI-referentie voor `openclaw uninstall` (Gateway-service + lokale gegevens verwijderen)
title: Verwijderen
x-i18n:
    generated_at: "2026-04-29T22:35:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: b774fc006e989068b9126aff2a72888fd808a2e0e3d5ea8b57e6ab9d9f1b63ee
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Deïnstalleer de Gateway-service + lokale gegevens (CLI blijft behouden).

Opties:

- `--service`: verwijder de Gateway-service
- `--state`: verwijder status en configuratie
- `--workspace`: verwijder werkruimtemappen
- `--app`: verwijder de macOS-app
- `--all`: verwijder service, status, werkruimte en app
- `--yes`: sla bevestigingsprompts over
- `--non-interactive`: schakel prompts uit; vereist `--yes`
- `--dry-run`: druk acties af zonder bestanden te verwijderen

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

- Voer eerst `openclaw backup create` uit als je een herstelbare momentopname wilt voordat je status of werkruimtes verwijdert.
- `--all` is een verkorte schrijfwijze om service, status, werkruimte en app samen te verwijderen.
- `--non-interactive` vereist `--yes`.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Deïnstalleren](/nl/install/uninstall)
