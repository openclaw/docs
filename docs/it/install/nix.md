---
read_when:
    - Vuoi installazioni riproducibili e con rollback
    - Stai già usando Nix/NixOS/Home Manager
    - Vuoi che tutto sia fissato e gestito in modo dichiarativo
summary: Installa OpenClaw in modo dichiarativo con Nix
title: Nix
x-i18n:
    generated_at: "2026-04-05T13:56:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14e1e73533db1350d82d3a786092b4328121a082dfeeedee7c7574021dada546
    source_path: install/nix.md
    workflow: 15
---

# Installazione Nix

Installa OpenClaw in modo dichiarativo con **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** -- un modulo Home Manager completo di tutto.

<Info>
Il repo [nix-openclaw](https://github.com/openclaw/nix-openclaw) è la fonte di verità per l'installazione Nix. Questa pagina è una panoramica rapida.
</Info>

## Cosa ottieni

- Gateway + app macOS + strumenti (whisper, spotify, fotocamere) -- tutto fissato
- Servizio launchd che sopravvive ai riavvii
- Sistema di plugin con configurazione dichiarativa
- Rollback istantaneo: `home-manager switch --rollback`

## Avvio rapido

<Steps>
  <Step title="Installa Determinate Nix">
    Se Nix non è già installato, segui le istruzioni del [programma di installazione Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Crea un flake locale">
    Usa il template agent-first dal repo nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copia templates/agent-first/flake.nix dal repo nix-openclaw
    ```
  </Step>
  <Step title="Configura i secret">
    Imposta il token del tuo bot di messaggistica e la API key del provider di modelli. I file in chiaro in `~/.secrets/` vanno bene.
  </Step>
  <Step title="Compila i placeholder del template ed esegui lo switch">
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

- I flussi di installazione automatica e auto-modifica sono disabilitati
- Le dipendenze mancanti mostrano messaggi di correzione specifici per Nix
- La UI mostra un banner di modalità Nix in sola lettura

### Percorsi di configurazione e stato

OpenClaw legge la configurazione JSON5 da `OPENCLAW_CONFIG_PATH` e memorizza i dati modificabili in `OPENCLAW_STATE_DIR`. Quando viene eseguito sotto Nix, impostali esplicitamente su percorsi gestiti da Nix in modo che stato runtime e configurazione restino fuori dallo store immutabile.

| Variabile              | Predefinito                             |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

## Correlati

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) -- guida completa alla configurazione
- [Wizard](/start/wizard) -- configurazione CLI non Nix
- [Docker](/install/docker) -- configurazione containerizzata
