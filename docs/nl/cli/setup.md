---
read_when:
    - Je wilt met OpenClaw chatten voor installatie of herstel
    - Je voert de eerste configuratie uit met de onboardingwizard
    - Je wilt het standaardpad voor de werkruimte instellen
    - Je hebt de configuratievlag voor alleen de basislijn nodig voor scripts
summary: CLI-referentie voor `openclaw setup` (chat met systeemagent met terugval naar onboarding)
title: Installatie
x-i18n:
    generated_at: "2026-07-16T15:39:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3395dbfe94c2f9686757fff85db709f0a9ed0ac9579e8e3c80ee1d51038f8e18
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` is het toegangspunt voor de systeemagent. Op een geconfigureerd systeem opent alleen
`openclaw setup` een interactieve OpenClaw-chat. Op een nieuw systeem
gaat dit over op begeleide onboarding. Gebruik `-m`/`--message` voor één verzoek of
`--baseline` om config-/workspace-mappen zonder de wizard te initialiseren.

Routeringsvolgorde:

1. Elke onboardingoptie (`--wizard`, `--baseline`, workspace, reset,
   niet-interactief, flow, modus, Gateway, daemon, overslaan, importeren, extern of
   authenticatieopties) voert de onboarding precies zo uit als `openclaw onboard`.
2. `-m`/`--message` of `--yes` voert de systeemagent uit.
3. Zonder routeringsoptie opent OpenClaw op een geconfigureerd interactief systeem. Op een
   nieuw systeem wordt de onboarding uitgevoerd. Op een geconfigureerd systeem drukt `--json` het
   systeemoverzicht zelfs zonder TTY af; met een onboardingoptie blijft de
   JSON-samenvatting van de onboarding behouden.

In de begeleide modus is `--workspace <dir>` de workspace die aan OpenClaw wordt voorgesteld;
deze wordt pas opgeslagen nadat je dat voorstel hebt goedgekeurd. Bij de baseline-, klassieke en
niet-interactieve configuratie wordt de opgegeven workspace via de normale flow opgeslagen.

Begeleide detectie voor inferentie wordt uitgevoerd op de Gateway-host met macOS of Linux. De CLI
en macOS-app gebruiken dezelfde detector van de Gateway, die geconfigureerde
modellen, ondersteunde CLI-aanmeldingen, omgevingsvariabelen voor API-sleutels en reeds
geïnstalleerde Ollama- of LM Studio-modellen controleert. Lokale modellen worden tijdens deze
automatische doorgang nooit gedownload; de geselecteerde kandidaat moet een echte voltooiing
beantwoorden voordat de provider- en modelconfiguratie wordt opgeslagen.

`setup` accepteert dezelfde onboardingvlaggen als `openclaw onboard`, waaronder
authenticatie (`--auth-choice`, `--token`, vlaggen voor providersleutels), Gateway
(`--gateway-port`, `--gateway-bind`, `--gateway-auth`, `--install-daemon`),
Tailscale (`--tailscale`), reset (`--reset`, `--reset-scope`), flow
(`--flow quickstart|advanced|manual|import`) en overslavlaggen
(`--skip-channels`, `--skip-skills`, `--skip-bootstrap`, `--skip-search`,
`--skip-health`, `--skip-ui`, `--skip-hooks`). Zie [Onboarding](/nl/cli/onboard) en
[CLI-automatisering](/nl/start/wizard-cli-automation) voor het volledige vlaggenoverzicht en
niet-interactieve voorbeelden. `openclaw onboard --modern` blijft een compatibiliteitstoegangspunt
voor dezelfde door inferentie begrensde OpenClaw-assistent.

<Note>
`openclaw setup` is bedoeld voor installaties met een wijzigbare config. In de Nix-modus (`OPENCLAW_NIX_MODE=1`) weigert OpenClaw configuratiewijzigingen te schrijven, omdat het configbestand door Nix wordt beheerd. Gebruik de officiële [nix-openclaw-snelstart](https://github.com/openclaw/nix-openclaw#quick-start) of de gelijkwaardige bronconfig voor een ander Nix-pakket.
</Note>

## Opties

| Vlag                       | Beschrijving                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `-m, --message <text>`     | Voer één OpenClaw-verzoek uit.                                                                             |
| `--yes`                    | Keur permanente configuratiewijzigingen goed voor één `--message`-verzoek.                                         |
| `--workspace <dir>`        | Workspacevoorstel in de begeleide modus; rechtstreeks opgeslagen door de baseline-, klassieke en niet-interactieve configuratie. |
| `--baseline`               | Maak baseline-config-/workspace-/sessiemappen zonder onboarding.                                  |
| `--wizard`                 | Forceer interactieve onboarding.                                                                         |
| `--non-interactive`        | Voer onboarding zonder vragen uit.                                                                       |
| `--accept-risk`            | Bevestig het risico van systeemagenttoegang tot het volledige systeem; vereist met `--non-interactive`.                         |
| `--mode <mode>`            | Onboardingmodus: `local` of `remote`.                                                                 |
| `--flow <flow>`            | Onboardingflow: `quickstart`, `advanced`, `manual` of `import`.                                        |
| `--reset`                  | Reset config + referenties + sessies vóór de onboarding (workspace alleen met `--reset-scope full`).   |
| `--reset-scope <scope>`    | Resetbereik: `config`, `config+creds+sessions` of `full`.                                            |
| `--import-from <provider>` | Migratieprovider die tijdens de onboarding moet worden uitgevoerd.                                                          |
| `--import-source <path>`   | Bronmap van de agent voor `--import-from`.                                                                |
| `--import-secrets`         | Importeer ondersteunde geheimen tijdens de onboardingmigratie.                                                 |
| `--remote-url <url>`       | WebSocket-URL van de externe Gateway.                                                                         |
| `--remote-token <token>`   | Token van de externe Gateway (optioneel).                                                                      |
| `--json`                   | Geconfigureerd systeem: OpenClaw-overzicht. Onboardingroute: onboardingsamenvatting.                           |

`--classic` en `--non-interactive` sluiten elkaar uit: klassiek opent de
wizard met vragen, terwijl de niet-interactieve configuratie het automatiseringspad gebruikt.

### Baseline-modus

`openclaw setup --baseline` behoudt het oudere gedrag met alleen een baseline: dit
maakt de config-, workspace- en sessiemappen aan en sluit vervolgens af zonder
onboarding uit te voeren.

## Voorbeelden

```bash
openclaw setup
openclaw setup -m "status"
openclaw setup -m "restart gateway" --yes
openclaw setup --json
openclaw setup --wizard
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Opmerkingen

- Voer na de baseline-configuratie `openclaw onboard` uit voor het volledige begeleide traject, `openclaw configure` voor gerichte wijzigingen of `openclaw channels add` om kanaalaccounts toe te voegen.
- Als een Hermes-status wordt gedetecteerd, kan interactieve onboarding automatisch migratie aanbieden. Importonboarding vereist een nieuwe configuratie; gebruik [Migreren](/nl/cli/migrate) voor proefplannen, back-ups en de overschrijfmodus buiten de onboarding.

## Gerelateerd

- [CLI-naslag](/nl/cli)
- [Onboarding](/nl/cli/onboard)
- [Onboarding (CLI)](/nl/start/wizard)
- [Aan de slag](/nl/start/getting-started)
- [Installatieoverzicht](/nl/install)
