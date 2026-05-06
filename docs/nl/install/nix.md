---
read_when:
    - Je wilt reproduceerbare installaties die terug te draaien zijn
    - Je gebruikt al Nix/NixOS/Home Manager
    - Je wilt alles vastgezet en declaratief beheerd hebben
summary: Installeer OpenClaw declaratief met Nix
title: Nix
x-i18n:
    generated_at: "2026-05-06T09:20:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0c25b97fb46a906bb726a13de095ead1e6c3642d28f66173b488acfbc5e0001
    source_path: install/nix.md
    workflow: 16
---

Installeer OpenClaw declaratief met **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** - een Home Manager-module met alles inbegrepen.

<Info>
De [nix-openclaw](https://github.com/openclaw/nix-openclaw)-repo is de bron van waarheid voor Nix-installatie. Deze pagina is een kort overzicht.
</Info>

## Wat je krijgt

- Gateway + macOS-app + tools (whisper, spotify, camera's) -- allemaal vastgepind
- Launchd-service die herstarts overleeft
- Plugin-systeem met declaratieve configuratie
- Directe rollback: `home-manager switch --rollback`

## Snel aan de slag

<Steps>
  <Step title="Installeer Determinate Nix">
    Als Nix nog niet is geinstalleerd, volg dan de instructies van het [Determinate Nix-installatieprogramma](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Maak een lokale flake">
    Gebruik de agent-first-template uit de nix-openclaw-repo:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Configureer geheimen">
    Stel je messaging-bottoken en API-sleutel voor de modelprovider in. Platte bestanden in `~/.secrets/` werken prima.
  </Step>
  <Step title="Vul template-placeholders in en schakel over">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Verifieer">
    Bevestig dat de launchd-service draait en dat je bot op berichten reageert.
  </Step>
</Steps>

Bekijk de [nix-openclaw README](https://github.com/openclaw/nix-openclaw) voor alle moduleopties en voorbeelden.

## Runtime-gedrag in Nix-modus

Wanneer `OPENCLAW_NIX_MODE=1` is ingesteld (automatisch met nix-openclaw), gaat OpenClaw naar een deterministische modus die auto-installatiestromen uitschakelt.

Je kunt dit ook handmatig instellen:

```bash
export OPENCLAW_NIX_MODE=1
```

Op macOS neemt de GUI-app shell-omgevingsvariabelen niet automatisch over. Schakel Nix-modus in plaats daarvan via defaults in:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Wat verandert in Nix-modus

- Auto-installatie- en zelfmutatiestromen zijn uitgeschakeld
- Ontbrekende afhankelijkheden tonen Nix-specifieke herstelberichten
- UI toont een alleen-lezen banner voor Nix-modus

### Configuratie- en statuspaden

OpenClaw leest JSON5-configuratie uit `OPENCLAW_CONFIG_PATH` en slaat muteerbare gegevens op in `OPENCLAW_STATE_DIR`. Wanneer je onder Nix draait, stel je deze expliciet in op door Nix beheerde locaties, zodat runtime-status en configuratie buiten de onveranderlijke store blijven.

| Variabele              | Standaard                               |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Service-PATH-detectie

De launchd/systemd-gatewayservice detecteert automatisch binaire bestanden uit Nix-profielen, zodat
plugins en tools die shellen naar met `nix` geinstalleerde uitvoerbare bestanden werken zonder
handmatige PATH-configuratie:

- Wanneer `NIX_PROFILES` is ingesteld, wordt elke vermelding toegevoegd aan de service-PATH met
  prioriteit van rechts naar links (komt overeen met Nix-shell-prioriteit - meest rechts wint).
- Wanneer `NIX_PROFILES` niet is ingesteld, wordt `~/.nix-profile/bin` als fallback toegevoegd.

Dit geldt voor zowel macOS launchd- als Linux systemd-serviceomgevingen.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Bron-van-waarheid Home Manager-module en volledige installatiegids.
  </Card>
  <Card title="Installatiewizard" href="/nl/start/wizard" icon="wand-magic-sparkles">
    Niet-Nix CLI-installatiewalkthrough.
  </Card>
  <Card title="Docker" href="/nl/install/docker" icon="docker">
    Gecontaineriseerde installatie als niet-Nix-alternatief.
  </Card>
  <Card title="Bijwerken" href="/nl/install/updating" icon="arrow-up-right-from-square">
    Door Home Manager beheerde installaties samen met het pakket bijwerken.
  </Card>
</CardGroup>
