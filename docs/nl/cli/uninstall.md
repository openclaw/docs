---
read_when:
    - U wilt de Gateway-service en/of de lokale status verwijderen
    - Je wilt eerst een proefuitvoering
summary: CLI-referentie voor `openclaw uninstall` (Gateway-service en lokale gegevens verwijderen)
title: Verwijderen
x-i18n:
    generated_at: "2026-07-12T08:47:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1e2e3996cf6d5c0fd11e5054c8fe60f7f8d25047193bb13944ca170bf77b581a
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Verwijder de Gateway-service en/of lokale gegevens. De CLI zelf wordt niet
verwijderd; verwijder deze afzonderlijk via npm/pnpm.

## Opties

| Vlag                | Standaard | Beschrijving                                                   |
| ------------------- | --------- | -------------------------------------------------------------- |
| `--service`         | `false`   | Verwijder de Gateway-service.                                  |
| `--state`           | `false`   | Verwijder status en configuratie.                              |
| `--workspace`       | `false`   | Verwijder werkruimtemappen.                                    |
| `--app`             | `false`   | Verwijder de macOS-app.                                        |
| `--all`             | `false`   | Verkorte vorm voor `--service --state --workspace --app`.      |
| `--yes`             | `false`   | Sla bevestigingsvragen over.                                   |
| `--non-interactive` | `false`   | Schakel vragen uit; vereist `--yes`.                            |
| `--dry-run`         | `false`   | Toon geplande acties zonder bestanden te verwijderen.          |

Zonder bereikvlaggen vraagt een interactieve meervoudige selectie welke
onderdelen moeten worden verwijderd (standaard zijn service, status en
werkruimte vooraf geselecteerd).

## Voorbeelden

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

## Opmerkingen

- Voer eerst `openclaw backup create` uit om een herstelbare momentopname te
  maken voordat u status of werkruimten verwijdert.
- `--state` behoudt geconfigureerde werkruimtemappen, tenzij ook `--workspace`
  is geselecteerd.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Verwijderen](/nl/install/uninstall)
