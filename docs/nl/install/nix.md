---
read_when:
    - Je wilt reproduceerbare installaties die kunnen worden teruggedraaid
    - Je gebruikt al Nix/NixOS/Home Manager
    - Je wilt alles vastgezet en declaratief beheerd hebben
summary: Installeer OpenClaw declaratief met Nix
title: Nix
x-i18n:
    generated_at: "2026-07-12T09:00:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f74e259ec3d909c73d9184db24d236135db04c29c2e7fab9be9e6fa7f98ba91
    source_path: install/nix.md
    workflow: 16
---

Installeer OpenClaw declaratief met **[nix-openclaw](https://github.com/openclaw/nix-openclaw)**, de officiële, compleet uitgeruste Home Manager-module.

<Info>
De [nix-openclaw](https://github.com/openclaw/nix-openclaw)-repository is de gezaghebbende bron voor Nix-installatie. Deze pagina biedt een kort overzicht.
</Info>

## Wat u krijgt

- Gateway + macOS-app + hulpmiddelen (whisper, spotify, camera's), allemaal vastgezet op specifieke versies
- Launchd-service die na opnieuw opstarten actief blijft
- Pluginsysteem met declaratieve configuratie
- Direct terugdraaien: `home-manager switch --rollback`

## Snel aan de slag

<Steps>
  <Step title="Determinate Nix installeren">
    Als Nix nog niet is geïnstalleerd, volgt u de instructies voor het [Determinate Nix-installatieprogramma](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Een lokale flake maken">
    Gebruik de agentgerichte sjabloon uit de nix-openclaw-repository:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Kopieer templates/agent-first/flake.nix uit de nix-openclaw-repository
    ```
  </Step>
  <Step title="Geheimen configureren">
    Stel het token van uw berichtenbot en de API-sleutel van uw modelprovider in. Gewone bestanden in `~/.secrets/` werken prima.
  </Step>
  <Step title="Sjabloonplaatshouders invullen en overschakelen">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Verifiëren">
    Controleer of de launchd-service actief is en uw bot op berichten reageert.
  </Step>
</Steps>

Raadpleeg de [README van nix-openclaw](https://github.com/openclaw/nix-openclaw) voor alle moduleopties en voorbeelden.

## Runtimegedrag in Nix-modus

Wanneer `OPENCLAW_NIX_MODE=1` is ingesteld (automatisch met nix-openclaw), schakelt OpenClaw over naar een deterministische modus voor door Nix beheerde installaties. Andere Nix-pakketten kunnen dezelfde modus instellen; nix-openclaw is de officiële referentie.

U kunt deze ook handmatig instellen:

```bash
export OPENCLAW_NIX_MODE=1
```

Op macOS neemt de GUI-app geen shell-omgevingsvariabelen over. Schakel de Nix-modus daarom in via `defaults`:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Wat er verandert in de Nix-modus

- Automatische installatie- en zelfwijzigingsprocessen zijn uitgeschakeld.
- `openclaw.json` wordt als onveranderlijk behandeld. Bij het opstarten afgeleide standaardwaarden blijven uitsluitend tijdens runtime van kracht en configuratieschrijvers (installatie, onboarding, wijzigende `openclaw update`, installatie/bijwerking/verwijdering/inschakeling van plugins, `doctor --fix`, `doctor --generate-gateway-token`, `openclaw config set`) weigeren het bestand te bewerken.
- Bewerk in plaats daarvan de Nix-bron. Gebruik voor nix-openclaw de agentgerichte [snelstartgids](https://github.com/openclaw/nix-openclaw#quick-start) en stel de configuratie in onder `programs.openclaw.config` of `instances.<name>.config`.
- Bij ontbrekende afhankelijkheden worden Nix-specifieke herstelberichten weergegeven.
- De gebruikersinterface toont een alleen-lezenbanner voor de Nix-modus.

### Paden voor configuratie en statusgegevens

OpenClaw leest JSON5-configuratie uit `OPENCLAW_CONFIG_PATH` en slaat wijzigbare gegevens op in `OPENCLAW_STATE_DIR`. Stel deze onder Nix expliciet in op door Nix beheerde locaties, zodat runtimestatus en configuratie buiten de onveranderlijke opslag blijven.

| Variabele              | Standaardwaarde                          |
| ---------------------- | ---------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                            |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`      |

### PATH-detectie voor services

De launchd-/systemd-service van de Gateway detecteert automatisch binaire bestanden in Nix-profielen, zodat plugins en hulpmiddelen die via de shell door `nix` geïnstalleerde uitvoerbare bestanden aanroepen, zonder handmatige PATH-configuratie werken:

- Wanneer `NIX_PROFILES` is ingesteld, wordt elke vermelding met prioriteit van rechts naar links aan het service-PATH toegevoegd (overeenkomstig de prioriteit van de Nix-shell: de meest rechtse vermelding wint).
- Wanneer `NIX_PROFILES` niet is ingesteld, wordt `~/.nix-profile/bin` als terugvaloptie toegevoegd.

Dit geldt voor zowel macOS-launchd- als Linux-systemd-serviceomgevingen.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Gezaghebbende Home Manager-module en volledige installatiegids.
  </Card>
  <Card title="Installatiewizard" href="/nl/start/wizard" icon="wand-magic-sparkles">
    Stapsgewijze CLI-installatie zonder Nix.
  </Card>
  <Card title="Docker" href="/nl/install/docker" icon="docker">
    Installatie in containers als alternatief zonder Nix.
  </Card>
  <Card title="Bijwerken" href="/nl/install/updating" icon="arrow-up-right-from-square">
    Door Home Manager beheerde installaties samen met het pakket bijwerken.
  </Card>
</CardGroup>
