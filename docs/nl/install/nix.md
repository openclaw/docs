---
read_when:
    - Je wilt reproduceerbare installaties die teruggedraaid kunnen worden
    - Je gebruikt al Nix/NixOS/Home Manager
    - Je wilt dat alles vastgepind en declaratief beheerd wordt
summary: OpenClaw declaratief installeren met Nix
title: Nix
x-i18n:
    generated_at: "2026-04-29T22:55:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7980e48d9fac49396d9dd06cf8516d572c97def1764db94cf66879d81d63694c
    source_path: install/nix.md
    workflow: 16
---

Installeer OpenClaw declaratief met **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** — een complete Home Manager-module.

<Info>
De [nix-openclaw](https://github.com/openclaw/nix-openclaw)-repository is de leidende bron voor Nix-installatie. Deze pagina is een kort overzicht.
</Info>

## Wat je krijgt

- Gateway + macOS-app + tools (whisper, spotify, camera's) -- allemaal vastgezet
- Launchd-service die herstarts overleeft
- Plugin-systeem met declaratieve configuratie
- Direct terugdraaien: `home-manager switch --rollback`

## Snel aan de slag

<Steps>
  <Step title="Installeer Determinate Nix">
    Als Nix nog niet is geïnstalleerd, volg dan de instructies van de [Determinate Nix installer](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Maak een lokale flake">
    Gebruik de agent-first-template uit de nix-openclaw-repository:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Configureer secrets">
    Stel je messaging-bottoken en API-sleutel voor de modelprovider in. Gewone bestanden in `~/.secrets/` werken prima.
  </Step>
  <Step title="Vul de tijdelijke aanduidingen in de template in en schakel over">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Verifieer">
    Controleer of de launchd-service actief is en of je bot op berichten reageert.
  </Step>
</Steps>

Zie de [nix-openclaw README](https://github.com/openclaw/nix-openclaw) voor alle moduleopties en voorbeelden.

## Runtimegedrag in Nix-modus

Wanneer `OPENCLAW_NIX_MODE=1` is ingesteld (automatisch met nix-openclaw), gaat OpenClaw naar een deterministische modus waarin automatische installatiestromen zijn uitgeschakeld.

Je kunt dit ook handmatig instellen:

```bash
export OPENCLAW_NIX_MODE=1
```

Op macOS erft de GUI-app niet automatisch shell-omgevingsvariabelen. Schakel de Nix-modus daarom in via defaults:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Wat verandert er in Nix-modus

- Automatische installatie en zelfmuterende stromen zijn uitgeschakeld
- Ontbrekende afhankelijkheden tonen Nix-specifieke herstelmeldingen
- De UI toont een alleen-lezen banner voor Nix-modus

### Configuratie- en statuspaden

OpenClaw leest JSON5-configuratie uit `OPENCLAW_CONFIG_PATH` en slaat veranderlijke gegevens op in `OPENCLAW_STATE_DIR`. Wanneer je onder Nix draait, stel je deze expliciet in op door Nix beheerde locaties zodat runtimestatus en configuratie buiten de onveranderlijke store blijven.

| Variabele              | Standaard                               |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Service-PATH-detectie

De launchd/systemd Gateway-service detecteert Nix-profielbinaries automatisch, zodat
plugins en tools die shellen naar met `nix` geïnstalleerde uitvoerbare bestanden werken zonder
handmatige PATH-instelling:

- Wanneer `NIX_PROFILES` is ingesteld, wordt elke entry toegevoegd aan de service-PATH met
  voorrang van rechts naar links (komt overeen met de voorrang van Nix-shell — meest rechts wint).
- Wanneer `NIX_PROFILES` niet is ingesteld, wordt `~/.nix-profile/bin` als fallback toegevoegd.

Dit geldt voor zowel macOS launchd- als Linux systemd-serviceomgevingen.

## Gerelateerd

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) -- volledige installatiehandleiding
- [Wizard](/nl/start/wizard) -- niet-Nix CLI-installatie
- [Docker](/nl/install/docker) -- gecontaineriseerde installatie
