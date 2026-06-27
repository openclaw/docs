---
read_when:
    - Je voert de eerste installatie uit zonder volledige CLI-onboarding
    - Je wilt het standaardpad voor de werkruimte instellen
    - Je hebt elke flag nodig en hoe setup kiest tussen baseline- en wizardmodus
summary: CLI-referentie voor `openclaw setup` (configuratie plus werkruimte initialiseren, optioneel onboarding uitvoeren)
title: Installatie
x-i18n:
    generated_at: "2026-06-27T17:23:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42bc570cf4c43338d6ca6202aace7c9d669fb1ac6d8bd8b61a591086fff2896a
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Initialiseer de basisconfiguratie en agentwerkruimte. Als er een onboardingvlag aanwezig is, wordt ook de wizard uitgevoerd.

<Note>
`openclaw setup` is bedoeld voor veranderbare configuratie-installaties. In Nix-modus (`OPENCLAW_NIX_MODE=1`) weigert OpenClaw setup-schrijfacties, omdat het configuratiebestand door Nix wordt beheerd. Gebruik de first-party [nix-openclaw-snelstart](https://github.com/openclaw/nix-openclaw#quick-start) of de equivalente bronconfiguratie voor een ander Nix-pakket.
</Note>

## Opties

| Vlag                       | Beschrijving                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Werkruimtemap voor agents (standaard `~/.openclaw/workspace`; opgeslagen als `agents.defaults.workspace`). |
| `--wizard`                 | Interactieve onboarding uitvoeren.                                                                         |
| `--non-interactive`        | Onboarding uitvoeren zonder prompts.                                                                     |
| `--accept-risk`            | Risico van agenttoegang tot het volledige systeem bevestigen; vereist met `--non-interactive`.                       |
| `--mode <mode>`            | Onboardingmodus: `local` of `remote`.                                                               |
| `--import-from <provider>` | Migratieprovider die tijdens onboarding wordt uitgevoerd.                                                        |
| `--import-source <path>`   | Bron-agenthome voor `--import-from`.                                                              |
| `--import-secrets`         | Ondersteunde geheimen importeren tijdens onboardingmigratie.                                               |
| `--remote-url <url>`       | Externe Gateway WebSocket-URL.                                                                       |
| `--remote-token <token>`   | Extern Gateway-token (optioneel).                                                                    |

### Automatische wizardtrigger

`openclaw setup` voert de wizard uit wanneer een van deze vlaggen expliciet aanwezig is, zelfs zonder `--wizard`:

`--wizard`, `--non-interactive`, `--accept-risk`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## Voorbeelden

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Opmerkingen

- Gewoon `openclaw setup` initialiseert de configuratie en werkruimte zonder de volledige onboardingflow uit te voeren.
- Voer na gewone setup `openclaw onboard` uit voor het volledige begeleide traject, `openclaw configure` voor gerichte wijzigingen, of `openclaw channels add` om kanaalaccounts toe te voegen.
- Als Hermes-status wordt gedetecteerd, kan interactieve onboarding automatisch migratie aanbieden. Import-onboarding vereist een nieuwe setup; gebruik [Migreren](/nl/cli/migrate) voor dry-run-plannen, back-ups en overschrijfmodus buiten onboarding.

## Verwant

- [CLI-referentie](/nl/cli)
- [Onboarding (CLI)](/nl/start/wizard)
- [Aan de slag](/nl/start/getting-started)
- [Installatieoverzicht](/nl/install)
