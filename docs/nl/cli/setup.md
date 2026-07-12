---
read_when:
    - Je voert de eerste configuratie uit met de CLI-onboardingwizard
    - U wilt het standaardpad voor de werkruimte instellen
    - U hebt de installatievlag voor alleen de basisconfiguratie nodig voor scripts
summary: CLI-referentie voor `openclaw setup` (alias voor onboarding, met basisconfiguratie beschikbaar via een vlag)
title: Installatie
x-i18n:
    generated_at: "2026-07-12T08:44:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe3c631a2ed7328ab7e7d1438adff2d6112514b3fdcfb82923ba6ea04650c385
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` voert dezelfde begeleide onboardingflow uit als `openclaw onboard`:
eerst wordt inferentie geverifieerd en opgeslagen, waarna Crestodian wordt gestart om
de werkruimte, Gateway, kanalen, skills en status te configureren. Gebruik `--baseline` wanneer u
alleen de configuratie-/werkruimtemappen hoeft te initialiseren zonder de wizard.

In de begeleide modus is `--workspace <dir>` de werkruimte die aan Crestodian wordt voorgesteld;
deze wordt pas opgeslagen nadat u dat voorstel hebt goedgekeurd. Bij baseline-, klassieke en
niet-interactieve installatie wordt de opgegeven werkruimte via de normale flow opgeslagen.

`setup` accepteert dezelfde onboardingvlaggen als `openclaw onboard`, waaronder
authenticatie (`--auth-choice`, `--token`, vlaggen voor providersleutels), Gateway
(`--gateway-port`, `--gateway-bind`, `--gateway-auth`, `--install-daemon`),
Tailscale (`--tailscale`), opnieuw instellen (`--reset`, `--reset-scope`), flow
(`--flow quickstart|advanced|manual|import`) en overslavlaggen
(`--skip-channels`, `--skip-skills`, `--skip-bootstrap`, `--skip-search`,
`--skip-health`, `--skip-ui`, `--skip-hooks`). Zie [Onboarding](/nl/cli/onboard) en
[CLI-automatisering](/nl/start/wizard-cli-automation) voor het volledige vlaggenoverzicht en
niet-interactieve voorbeelden. `openclaw onboard --modern` is de compatibiliteitsalias
voor de door inferentie afgeschermde Crestodian-assistent en heeft geen equivalent voor `setup`.

<Note>
`openclaw setup` is bedoeld voor installaties met wijzigbare configuratie. In de Nix-modus (`OPENCLAW_NIX_MODE=1`) weigert OpenClaw tijdens de installatie schrijfbewerkingen omdat het configuratiebestand door Nix wordt beheerd. Gebruik de officiële [snelstart voor nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) of de gelijkwaardige bronconfiguratie voor een ander Nix-pakket.
</Note>

## Opties

| Vlag                       | Beschrijving                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Werkruimtevoorstel in begeleide modus; wordt rechtstreeks opgeslagen bij baseline-, klassieke en niet-interactieve installatie. |
| `--baseline`               | Maak mappen voor de basisconfiguratie, werkruimte en sessies zonder onboarding.                       |
| `--wizard`                 | Wordt geaccepteerd voor compatibiliteit; de installatie voert standaard onboarding uit.              |
| `--non-interactive`        | Voer onboarding zonder prompts uit.                                                                   |
| `--accept-risk`            | Bevestig het risico van agenttoegang tot het volledige systeem; vereist bij `--non-interactive`.      |
| `--mode <mode>`            | Onboardingmodus: `local` of `remote`.                                                                 |
| `--flow <flow>`            | Onboardingflow: `quickstart`, `advanced`, `manual` of `import`.                                       |
| `--reset`                  | Stel configuratie + referenties + sessies opnieuw in vóór onboarding (werkruimte alleen met `--reset-scope full`). |
| `--reset-scope <scope>`    | Bereik voor opnieuw instellen: `config`, `config+creds+sessions` of `full`.                            |
| `--import-from <provider>` | Migratieprovider die tijdens onboarding moet worden uitgevoerd.                                      |
| `--import-source <path>`   | Bronmap van de agent voor `--import-from`.                                                            |
| `--import-secrets`         | Importeer ondersteunde geheimen tijdens de onboardingmigratie.                                       |
| `--remote-url <url>`       | WebSocket-URL van de externe Gateway.                                                                 |
| `--remote-token <token>`   | Token voor de externe Gateway (optioneel).                                                            |
| `--json`                   | Voer een JSON-samenvatting uit.                                                                       |

`--classic` en `--non-interactive` sluiten elkaar uit: klassiek opent de
wizard met prompts, terwijl de niet-interactieve installatie het automatiseringspad gebruikt.

### Baseline-modus

`openclaw setup --baseline` behoudt het oudere gedrag dat alleen de basis instelt: het
maakt de configuratie-, werkruimte- en sessiemappen aan en sluit vervolgens af zonder
onboarding uit te voeren.

## Voorbeelden

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Opmerkingen

- Voer na de baseline-installatie `openclaw setup` of `openclaw onboard` uit voor het volledige begeleide traject, `openclaw configure` voor gerichte wijzigingen of `openclaw channels add` om kanaalaccounts toe te voegen.
- Als een Hermes-status wordt gedetecteerd, kan interactieve onboarding automatisch migratie aanbieden. Importonboarding vereist een nieuwe installatie; gebruik [Migreren](/nl/cli/migrate) voor proefplannen, back-ups en de overschrijfmodus buiten onboarding.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Onboarding](/nl/cli/onboard)
- [Onboarding (CLI)](/nl/start/wizard)
- [Aan de slag](/nl/start/getting-started)
- [Installatieoverzicht](/nl/install)
