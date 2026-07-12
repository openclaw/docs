---
read_when:
    - Je wilt de lokale status wissen terwijl de CLI geïnstalleerd blijft
    - U wilt een proefuitvoering van wat er zou worden verwijderd
summary: CLI-referentie voor `openclaw reset` (lokale status/configuratie opnieuw instellen)
title: Opnieuw instellen
x-i18n:
    generated_at: "2026-07-12T08:46:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f18af9c5e187217de4c02f4b55de9a1c94f7246b74056dc660aa172168edcef9
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

Stel de lokale configuratie/status opnieuw in (de CLI blijft geïnstalleerd).

```bash
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

## Opties

- `--scope <scope>`: `config`, `config+creds+sessions` of `full`
- `--yes`: bevestigingsvragen overslaan
- `--non-interactive`: vragen uitschakelen; vereist `--scope` en `--yes`
- `--dry-run`: acties weergeven zonder bestanden te verwijderen

## Bereiken

| Bereik                  | Verwijdert                                                                                                          | Stopt eerst de Gateway |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `config`                | alleen het configuratiebestand                                                                                      | nee                    |
| `config+creds+sessions` | configuratiebestand, OAuth-/referentiemap en sessiemappen per agent                                                  | ja                     |
| `full`                  | statusmap (inclusief configuratie/referenties als die daarin zijn genest), plus werkruimtemappen en werkruimteverklaringen | ja                     |

`config+creds+sessions` en `full` stoppen een actieve beheerde Gateway-service voordat de status wordt verwijderd.

## Opmerkingen

- Voer eerst `openclaw backup create` uit om een herstelbare momentopname te maken voordat u de lokale status verwijdert.
- Zonder `--scope` vraagt `openclaw reset` interactief welk bereik moet worden verwijderd.
- `--non-interactive` is alleen geldig wanneer zowel `--scope` als `--yes` zijn ingesteld.
- `config+creds+sessions` en `full` geven na voltooiing `Volgende: openclaw onboard --install-daemon` weer.

## Gerelateerd

- [CLI-referentie](/nl/cli)
