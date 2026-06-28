---
read_when:
    - Je wilt reproduceerbare installaties die kunnen worden teruggedraaid
    - Je gebruikt Nix/NixOS/Home Manager al
    - U wilt alles vastgezet en declaratief beheerd hebben
summary: OpenClaw declaratief installeren met Nix
title: Nix
x-i18n:
    generated_at: "2026-05-06T17:57:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b4c2eca298ac7ae60baea4d06855edb73c0b8bfe253a3f478d93e934b31253b
    source_path: install/nix.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Installeer OpenClaw declaratief met **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** - de first-party Home Manager-module met alles inbegrepen.

<Info>
De [nix-openclaw](https://github.com/openclaw/nix-openclaw)-repo is de bron van waarheid voor Nix-installatie. Deze pagina is een kort overzicht.
</Info>

## Wat je krijgt

- Gateway + macOS-app + tools (whisper, spotify, camera's) -- allemaal vastgepind
- Launchd-service die herstarts overleeft
- Plugin-systeem met declaratieve configuratie
- Direct terugdraaien: `home-manager switch --rollback`

## Snelstart

<Steps>
  <Step title="Installeer Determinate Nix">
    Als Nix nog niet is geïnstalleerd, volg dan de instructies van de [Determinate Nix-installer](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Maak een lokale flake">
    Gebruik de agent-first-template uit de nix-openclaw-repo:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Configureer geheimen">
    Stel je token voor de berichtenbot en de API-sleutel van de modelprovider in. Platte bestanden op `~/.secrets/` werken prima.
  </Step>
  <Step title="Vul template-placeholders in en schakel over">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Verifieer">
    Controleer of de launchd-service draait en je bot op berichten reageert.
  </Step>
</Steps>

Zie de [nix-openclaw README](https://github.com/openclaw/nix-openclaw) voor alle moduleopties en voorbeelden.

## Runtimegedrag in Nix-modus

Wanneer `OPENCLAW_NIX_MODE=1` is ingesteld (automatisch met nix-openclaw), gaat OpenClaw naar een deterministische modus voor door Nix beheerde installaties. Andere Nix-pakketten kunnen dezelfde modus instellen; nix-openclaw is de first-party referentie.

Je kunt dit ook handmatig instellen:

```bash
export OPENCLAW_NIX_MODE=1
```

Op macOS neemt de GUI-app shell-omgevingsvariabelen niet automatisch over. Schakel Nix-modus in plaats daarvan via defaults in:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Wat verandert in Nix-modus

- Flows voor automatisch installeren en zelfmutatie zijn uitgeschakeld
- `openclaw.json` wordt als onveranderlijk behandeld. Bij het opstarten afgeleide standaardwaarden blijven alleen runtimewaarden, en config-schrijvers zoals setup, onboarding, muterende `openclaw update`, Plugin installeren/bijwerken/verwijderen/inschakelen, `doctor --fix`, `doctor --generate-gateway-token` en `openclaw config set` weigeren het bestand te bewerken.
- Agents moeten in plaats daarvan de Nix-bron bewerken. Gebruik voor nix-openclaw de agent-first [Snelstart](https://github.com/openclaw/nix-openclaw#quick-start) en stel configuratie in onder `programs.openclaw.config` of `instances.<name>.config`.
- Ontbrekende afhankelijkheden tonen Nix-specifieke herstelberichten
- De UI toont een alleen-lezen banner voor Nix-modus

### Configuratie- en statuspaden

OpenClaw leest JSON5-configuratie uit `OPENCLAW_CONFIG_PATH` en slaat muteerbare data op in `OPENCLAW_STATE_DIR`. Stel deze bij gebruik onder Nix expliciet in op door Nix beheerde locaties, zodat runtimestatus en configuratie buiten de onveranderlijke store blijven.

| Variabele              | Standaard                               |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Service-PATH-detectie

De launchd/systemd Gateway-service detecteert Nix-profielbinaries automatisch, zodat
plugins en tools die shellen naar met `nix` geïnstalleerde uitvoerbare bestanden werken zonder
handmatige PATH-configuratie:

- Wanneer `NIX_PROFILES` is ingesteld, wordt elke entry toegevoegd aan de service-PATH met
  voorrang van rechts naar links (komt overeen met Nix-shellvoorrang - de meest rechtse wint).
- Wanneer `NIX_PROFILES` niet is ingesteld, wordt `~/.nix-profile/bin` als fallback toegevoegd.

Dit geldt voor zowel macOS launchd- als Linux systemd-serviceomgevingen.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Bron-van-waarheid Home Manager-module en volledige setupgids.
  </Card>
  <Card title="Setupwizard" href="/nl/start/wizard" icon="wand-magic-sparkles">
    Niet-Nix CLI-setupwalkthrough.
  </Card>
  <Card title="Docker" href="/nl/install/docker" icon="docker">
    Gecontaineriseerde setup als niet-Nix alternatief.
  </Card>
  <Card title="Bijwerken" href="/nl/install/updating" icon="arrow-up-right-from-square">
    Door Home Manager beheerde installaties bijwerken naast het pakket.
  </Card>
</CardGroup>
