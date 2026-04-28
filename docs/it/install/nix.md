---
read_when:
    - Vuoi installazioni riproducibili e con rollback შესაძლibile
    - Stai già usando Nix/NixOS/Home Manager
    - Vuoi che tutto sia fissato e gestito in modo dichiarativo
summary: Installa OpenClaw in modo dichiarativo con Nix
title: Nix
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-25T13:49:48Z"
  model: gpt-5.4
  provider: openai
  source_hash: 7980e48d9fac49396d9dd06cf8516d572c97def1764db94cf66879d81d63694c
  source_path: install/nix.md
  workflow: 15
---

Installa OpenClaw in modo dichiarativo con **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** — un modulo Home Manager completo di tutto.

<Info>
Il repository [nix-openclaw](https://github.com/openclaw/nix-openclaw) è la fonte di verità per l'installazione con Nix. Questa pagina è una rapida panoramica.
</Info>

## Cosa ottieni

- Gateway + app macOS + strumenti (whisper, spotify, cameras) -- tutti fissati
- Servizio Launchd che sopravvive ai riavvii
- Sistema di Plugin con configurazione dichiarativa
- Rollback istantaneo: `home-manager switch --rollback`

## Avvio rapido

<Steps>
  <Step title="Installa Determinate Nix">
    Se Nix non è già installato, segui le istruzioni dell'[installer Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Crea un flake locale">
    Usa il template agent-first dal repository nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Configura i segreti">
    Configura il token del tuo bot di messaggistica e la chiave API del provider di modelli. I file in chiaro in `~/.secrets/` vanno benissimo.
  </Step>
  <Step title="Compila i segnaposto del template ed esegui lo switch">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Verifica">
    Conferma che il servizio launchd sia in esecuzione e che il tuo bot risponda ai messaggi.
  </Step>
</Steps>

Vedi il [README di nix-openclaw](https://github.com/openclaw/nix-openclaw) per tutte le opzioni del modulo e gli esempi.

## Comportamento runtime in modalità Nix

Quando `OPENCLAW_NIX_MODE=1` è impostato (automatico con nix-openclaw), OpenClaw entra in una modalità deterministica che disabilita i flussi di installazione automatica.

Puoi anche impostarlo manualmente:

```bash
export OPENCLAW_NIX_MODE=1
```

Su macOS, l'app GUI non eredita automaticamente le variabili d'ambiente della shell. Abilita invece la modalità Nix tramite defaults:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Cosa cambia in modalità Nix

- I flussi di installazione automatica e auto-mutazione sono disabilitati
- Le dipendenze mancanti mostrano messaggi di risoluzione specifici per Nix
- L'interfaccia mostra un banner di modalità Nix in sola lettura

### Percorsi di configurazione e stato

OpenClaw legge la configurazione JSON5 da `OPENCLAW_CONFIG_PATH` e memorizza i dati modificabili in `OPENCLAW_STATE_DIR`. Quando viene eseguito con Nix, imposta esplicitamente questi valori su percorsi gestiti da Nix così lo stato runtime e la configurazione restano fuori dallo store immutabile.

| Variabile              | Predefinito                             |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Rilevamento del PATH del servizio

Il servizio gateway launchd/systemd rileva automaticamente i binari del profilo Nix così
Plugin e strumenti che eseguono comandi verso eseguibili installati con `nix` funzionano senza
una configurazione manuale del PATH:

- Quando `NIX_PROFILES` è impostato, ogni voce viene aggiunta al PATH del servizio con
  precedenza da destra a sinistra (corrisponde alla precedenza della shell Nix — la più a destra vince).
- Quando `NIX_PROFILES` non è impostato, `~/.nix-profile/bin` viene aggiunto come fallback.

Questo vale sia per gli ambienti di servizio macOS launchd sia per quelli Linux systemd.

## Correlati

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) -- guida completa alla configurazione
- [Wizard](/it/start/wizard) -- configurazione CLI non Nix
- [Docker](/it/install/docker) -- configurazione containerizzata
