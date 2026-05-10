---
read_when:
    - Je voert de setup bij eerste gebruik uit zonder volledige onboarding via de CLI
    - U wilt het standaardpad voor de werkruimte instellen
    - Je hebt elke optie nodig en hoe de configuratie kiest tussen basismodus en wizardmodus
summary: CLI-referentie voor `openclaw setup` (configuratie en werkruimte initialiseren, optioneel het introductieproces uitvoeren)
title: Installatie
x-i18n:
    generated_at: "2026-05-10T19:30:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55f0d771bb07c4c69293a470d54f4b6bb108ee521889bfb944fe450b24938b5e
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Initialiseer de basisconfiguratie en agentwerkruimte. Als er een onboarding-vlag aanwezig is, wordt ook de wizard uitgevoerd.

<Note>
`openclaw setup` is bedoeld voor wijzigbare configuratie-installaties. In Nix-modus (`OPENCLAW_NIX_MODE=1`) weigert OpenClaw setup-schrijfacties omdat het configuratiebestand door Nix wordt beheerd. Gebruik de officiële [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) of de equivalente bronconfiguratie voor een ander Nix-pakket.
</Note>

## Opties

| Vlag                       | Beschrijving                                                                                              |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Agentwerkruimtemap (standaard `~/.openclaw/workspace`; opgeslagen als `agents.defaults.workspace`).       |
| `--wizard`                 | Interactieve onboarding uitvoeren.                                                                        |
| `--non-interactive`        | Onboarding zonder prompts uitvoeren.                                                                      |
| `--mode <mode>`            | Onboardingmodus: `local` of `remote`.                                                                     |
| `--import-from <provider>` | Migratieprovider die tijdens onboarding moet worden uitgevoerd.                                           |
| `--import-source <path>`   | Bron-agenthome voor `--import-from`.                                                                      |
| `--import-secrets`         | Ondersteunde geheimen importeren tijdens onboardingmigratie.                                              |
| `--remote-url <url>`       | Remote Gateway WebSocket-URL.                                                                             |
| `--remote-token <token>`   | Remote Gateway-token (optioneel).                                                                         |

### Automatische wizard-trigger

`openclaw setup` voert de wizard uit wanneer een van deze vlaggen expliciet aanwezig is, zelfs zonder `--wizard`:

`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## Voorbeelden

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Notities

- Gewone `openclaw setup` initialiseert configuratie en werkruimte zonder de volledige onboarding-flow uit te voeren.
- Voer na gewone setup `openclaw onboard` uit voor het volledige begeleide traject, `openclaw configure` voor gerichte wijzigingen, of `openclaw channels add` om kanaalaccounts toe te voegen.
- Als Hermes-status wordt gedetecteerd, kan interactieve onboarding automatisch migratie aanbieden. Import-onboarding vereist een nieuwe setup; gebruik [Migreren](/nl/cli/migrate) voor dry-run-plannen, back-ups en overschrijfmodus buiten onboarding.

## Verwant

- [CLI-referentie](/nl/cli)
- [Onboarding (CLI)](/nl/start/wizard)
- [Aan de slag](/nl/start/getting-started)
- [Installatieoverzicht](/nl/install)
