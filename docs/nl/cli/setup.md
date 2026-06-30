---
read_when:
    - Je voert de eerste installatie uit met de CLI-onboardingwizard
    - Je wilt het standaardwerkruimtepad instellen
    - Je hebt de setupvlag voor alleen baseline nodig voor scripts
summary: CLI-referentie voor `openclaw setup` (alias voor onboarding, met basisconfiguratie beschikbaar via vlag)
title: Instellen
x-i18n:
    generated_at: "2026-06-30T22:25:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797c023d5ba27920fbea9828c9bb12f6c10d25dd3aa6fc68fe9c742f432ebb05
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Voer de volledige onboardingflow van de CLI uit. `openclaw setup` is een alias voor `openclaw onboard`; gebruik `--baseline` wanneer je alleen configuratie-/werkruimtemappen hoeft te initialiseren zonder de wizard.

<Note>
`openclaw setup` is bedoeld voor wijzigbare configuratie-installaties. In Nix-modus (`OPENCLAW_NIX_MODE=1`) weigert OpenClaw setup-schrijfbewerkingen omdat het configuratiebestand door Nix wordt beheerd. Gebruik de first-party [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) of de equivalente bronconfiguratie voor een ander Nix-pakket.
</Note>

## Opties

| Vlag                       | Beschrijving                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Werkruimtemap voor agents (standaard `~/.openclaw/workspace`; opgeslagen als `agents.defaults.workspace`).    |
| `--baseline`               | Maak basismappen voor configuratie/werkruimte/sessies aan zonder onboarding.                                  |
| `--wizard`                 | Geaccepteerd voor compatibiliteit; setup voert standaard onboarding uit.                                      |
| `--non-interactive`        | Voer onboarding uit zonder prompts.                                                                          |
| `--accept-risk`            | Bevestig het risico van agenttoegang tot het volledige systeem; vereist met `--non-interactive`.              |
| `--mode <mode>`            | Onboardingmodus: `local` of `remote`.                                                                        |
| `--import-from <provider>` | Migratieprovider die tijdens onboarding moet worden uitgevoerd.                                               |
| `--import-source <path>`   | Bron-agenthome voor `--import-from`.                                                                         |
| `--import-secrets`         | Importeer ondersteunde geheimen tijdens onboardingmigratie.                                                   |
| `--remote-url <url>`       | WebSocket-URL van externe Gateway.                                                                           |
| `--remote-token <token>`   | Extern Gateway-token (optioneel).                                                                            |

### Baseline-modus

`openclaw setup --baseline` behoudt het oudere gedrag voor alleen baseline: het maakt de configuratie-, werkruimte- en sessiemappen aan en sluit daarna af zonder onboarding uit te voeren.

## Voorbeelden

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Opmerkingen

- Gewoon `openclaw setup` voert dezelfde begeleide journey uit als `openclaw onboard`.
- Voer na baseline-setup `openclaw setup` of `openclaw onboard` uit voor de volledige begeleide journey, `openclaw configure` voor gerichte wijzigingen, of `openclaw channels add` om kanaalaccounts toe te voegen.
- Als Hermes-status wordt gedetecteerd, kan interactieve onboarding automatisch migratie aanbieden. Import-onboarding vereist een nieuwe setup; gebruik [Migreren](/nl/cli/migrate) voor dry-run-plannen, back-ups en overschrijfmodus buiten onboarding.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Onboarding (CLI)](/nl/start/wizard)
- [Aan de slag](/nl/start/getting-started)
- [Installatieoverzicht](/nl/install)
