---
read_when:
    - Vuoi installazioni riproducibili e con possibilità di rollback
    - Usi già Nix/NixOS/Home Manager
    - Vuoi che tutto sia vincolato e gestito in modo dichiarativo
summary: Installare OpenClaw in modo dichiarativo con Nix
title: Nix
x-i18n:
    generated_at: "2026-05-06T17:58:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b4c2eca298ac7ae60baea4d06855edb73c0b8bfe253a3f478d93e934b31253b
    source_path: install/nix.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Installa OpenClaw in modo dichiarativo con **[nix-openclaw](https://github.com/openclaw/nix-openclaw)**, il modulo Home Manager ufficiale con tutto incluso.

<Info>
Il repo [nix-openclaw](https://github.com/openclaw/nix-openclaw) è la fonte autorevole per l'installazione con Nix. Questa pagina è una panoramica rapida.
</Info>

## Cosa ottieni

- Gateway + app macOS + strumenti (whisper, spotify, cameras) -- tutti bloccati a versioni specifiche
- Servizio launchd che sopravvive ai riavvii
- Sistema Plugin con configurazione dichiarativa
- Rollback immediato: `home-manager switch --rollback`

## Avvio rapido

<Steps>
  <Step title="Installa Determinate Nix">
    Se Nix non è già installato, segui le istruzioni del [programma di installazione Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Crea una flake locale">
    Usa il template agent-first dal repo nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Configura i segreti">
    Configura il token del tuo bot di messaggistica e la chiave API del provider di modelli. I file di testo semplice in `~/.secrets/` vanno benissimo.
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

Consulta il [README di nix-openclaw](https://github.com/openclaw/nix-openclaw) per le opzioni complete del modulo e gli esempi.

## Comportamento runtime in modalità Nix

Quando `OPENCLAW_NIX_MODE=1` è impostato (automatico con nix-openclaw), OpenClaw entra in una modalità deterministica per le installazioni gestite da Nix. Anche altri pacchetti Nix possono impostare la stessa modalità; nix-openclaw è il riferimento ufficiale.

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
- `openclaw.json` è trattato come immutabile. I valori predefiniti derivati dall'avvio restano solo runtime, e gli strumenti che scrivono la configurazione, come setup, onboarding, `openclaw update` mutante, installazione/aggiornamento/disinstallazione/abilitazione di Plugin, `doctor --fix`, `doctor --generate-gateway-token` e `openclaw config set`, rifiutano di modificare il file.
- Gli agenti dovrebbero invece modificare la sorgente Nix. Per nix-openclaw, usa l'[Avvio rapido](https://github.com/openclaw/nix-openclaw#quick-start) agent-first e imposta la configurazione sotto `programs.openclaw.config` o `instances.<name>.config`.
- Le dipendenze mancanti mostrano messaggi di correzione specifici per Nix
- L'interfaccia utente mostra un banner di modalità Nix in sola lettura

### Percorsi di configurazione e stato

OpenClaw legge la configurazione JSON5 da `OPENCLAW_CONFIG_PATH` e archivia i dati mutabili in `OPENCLAW_STATE_DIR`. Quando è in esecuzione sotto Nix, impostali esplicitamente su posizioni gestite da Nix, così lo stato runtime e la configurazione restano fuori dallo store immutabile.

| Variabile              | Predefinito                             |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Rilevamento del PATH del servizio

Il servizio Gateway launchd/systemd rileva automaticamente i binari del profilo Nix, così
i Plugin e gli strumenti che eseguono comandi shell verso eseguibili installati con `nix` funzionano senza
configurazione manuale del PATH:

- Quando `NIX_PROFILES` è impostato, ogni voce viene aggiunta al PATH del servizio con
  precedenza da destra a sinistra (corrisponde alla precedenza della shell Nix: vince la voce più a destra).
- Quando `NIX_PROFILES` non è impostato, `~/.nix-profile/bin` viene aggiunto come fallback.

Questo si applica sia agli ambienti di servizio launchd su macOS sia a quelli systemd su Linux.

## Correlati

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Modulo Home Manager fonte autorevole e guida completa alla configurazione.
  </Card>
  <Card title="Procedura guidata di configurazione" href="/it/start/wizard" icon="wand-magic-sparkles">
    Procedura dettagliata di configurazione CLI non Nix.
  </Card>
  <Card title="Docker" href="/it/install/docker" icon="docker">
    Configurazione containerizzata come alternativa non Nix.
  </Card>
  <Card title="Aggiornamento" href="/it/install/updating" icon="arrow-up-right-from-square">
    Aggiornamento delle installazioni gestite da Home Manager insieme al pacchetto.
  </Card>
</CardGroup>
