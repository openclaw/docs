---
read_when:
    - Vuoi installazioni riproducibili e ripristinabili tramite rollback
    - Usi già Nix/NixOS/Home Manager
    - Vuoi che tutto sia bloccato e gestito in modo dichiarativo
summary: Installa OpenClaw in modo dichiarativo con Nix
title: Nix
x-i18n:
    generated_at: "2026-05-06T08:57:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0c25b97fb46a906bb726a13de095ead1e6c3642d28f66173b488acfbc5e0001
    source_path: install/nix.md
    workflow: 16
---

Installa OpenClaw in modo dichiarativo con **[nix-openclaw](https://github.com/openclaw/nix-openclaw)**: un modulo Home Manager completo di tutto.

<Info>
Il repository [nix-openclaw](https://github.com/openclaw/nix-openclaw) è la fonte di riferimento per l'installazione con Nix. Questa pagina è una panoramica rapida.
</Info>

## Cosa ottieni

- Gateway + app macOS + strumenti (whisper, spotify, cameras) -- tutti con versioni fissate
- Servizio launchd che sopravvive ai riavvii
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
    Configura il token del tuo bot di messaggistica e la chiave API del provider del modello. I file semplici in `~/.secrets/` vanno bene.
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

Consulta il [README di nix-openclaw](https://github.com/openclaw/nix-openclaw) per opzioni complete del modulo ed esempi.

## Comportamento di runtime in modalità Nix

Quando `OPENCLAW_NIX_MODE=1` è impostato (automaticamente con nix-openclaw), OpenClaw entra in una modalità deterministica che disabilita i flussi di installazione automatica.

Puoi anche impostarlo manualmente:

```bash
export OPENCLAW_NIX_MODE=1
```

Su macOS, l'app GUI non eredita automaticamente le variabili d'ambiente della shell. Abilita invece la modalità Nix tramite defaults:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Cosa cambia in modalità Nix

- I flussi di installazione automatica e automodifica sono disabilitati
- Le dipendenze mancanti mostrano messaggi di correzione specifici per Nix
- L'interfaccia mostra un banner di sola lettura per la modalità Nix

### Percorsi di configurazione e stato

OpenClaw legge la configurazione JSON5 da `OPENCLAW_CONFIG_PATH` e archivia i dati modificabili in `OPENCLAW_STATE_DIR`. Quando viene eseguito sotto Nix, impostali esplicitamente su percorsi gestiti da Nix, così lo stato di runtime e la configurazione restano fuori dallo store immutabile.

| Variabile              | Predefinito                             |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Rilevamento del PATH del servizio

Il servizio Gateway launchd/systemd rileva automaticamente i binari del profilo Nix, così
Plugin e strumenti che eseguono eseguibili installati con `nix` tramite shell funzionano senza
configurazione manuale del PATH:

- Quando `NIX_PROFILES` è impostato, ogni voce viene aggiunta al PATH del servizio con
  precedenza da destra a sinistra (corrisponde alla precedenza della shell Nix: vince l'elemento più a destra).
- Quando `NIX_PROFILES` non è impostato, `~/.nix-profile/bin` viene aggiunto come fallback.

Questo vale sia per gli ambienti del servizio launchd su macOS sia per quelli systemd su Linux.

## Correlati

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Modulo Home Manager fonte di riferimento e guida completa alla configurazione.
  </Card>
  <Card title="Procedura guidata di configurazione" href="/it/start/wizard" icon="wand-magic-sparkles">
    Guida passo passo alla configurazione CLI non Nix.
  </Card>
  <Card title="Docker" href="/it/install/docker" icon="docker">
    Configurazione containerizzata come alternativa non Nix.
  </Card>
  <Card title="Aggiornamento" href="/it/install/updating" icon="arrow-up-right-from-square">
    Aggiornamento delle installazioni gestite da Home Manager insieme al pacchetto.
  </Card>
</CardGroup>
