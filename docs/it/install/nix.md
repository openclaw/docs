---
read_when:
    - Vuoi installazioni riproducibili e reversibili
    - Stai già utilizzando Nix/NixOS/Home Manager
    - Vuoi che tutto sia vincolato a versioni specifiche e gestito in modo dichiarativo
summary: Installa OpenClaw in modo dichiarativo con Nix
title: Nix
x-i18n:
    generated_at: "2026-07-12T07:10:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f74e259ec3d909c73d9184db24d236135db04c29c2e7fab9be9e6fa7f98ba91
    source_path: install/nix.md
    workflow: 16
---

Installa OpenClaw in modo dichiarativo con **[nix-openclaw](https://github.com/openclaw/nix-openclaw)**, il modulo Home Manager ufficiale completo di tutto.

<Info>
Il repository [nix-openclaw](https://github.com/openclaw/nix-openclaw) è la fonte autorevole per l'installazione con Nix. Questa pagina offre una rapida panoramica.
</Info>

## Cosa ottieni

- Gateway + app per macOS + strumenti (whisper, spotify, videocamere), tutti con versioni bloccate
- Servizio launchd che rimane attivo dopo i riavvii
- Sistema di Plugin con configurazione dichiarativa
- Ripristino immediato: `home-manager switch --rollback`

## Avvio rapido

<Steps>
  <Step title="Installa Determinate Nix">
    Se Nix non è già installato, segui le istruzioni del [programma di installazione di Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Crea un flake locale">
    Usa il modello orientato agli agenti dal repository nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copia templates/agent-first/flake.nix dal repository nix-openclaw
    ```
  </Step>
  <Step title="Configura i segreti">
    Configura il token del bot di messaggistica e la chiave API del provider del modello. I normali file in `~/.secrets/` vanno bene.
  </Step>
  <Step title="Compila i segnaposto del modello e applica la configurazione">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Verifica">
    Verifica che il servizio launchd sia in esecuzione e che il bot risponda ai messaggi.
  </Step>
</Steps>

Consulta il [README di nix-openclaw](https://github.com/openclaw/nix-openclaw) per tutte le opzioni del modulo e gli esempi.

## Comportamento di runtime in modalità Nix

Quando è impostato `OPENCLAW_NIX_MODE=1` (automaticamente con nix-openclaw), OpenClaw entra in una modalità deterministica per le installazioni gestite da Nix. Anche altri pacchetti Nix possono impostare la stessa modalità; nix-openclaw è l'implementazione ufficiale di riferimento.

Puoi anche impostarla manualmente:

```bash
export OPENCLAW_NIX_MODE=1
```

Su macOS, l'app con interfaccia grafica non eredita le variabili d'ambiente della shell. Abilita invece la modalità Nix tramite `defaults`:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Cosa cambia in modalità Nix

- I flussi di installazione automatica e automodifica sono disabilitati.
- `openclaw.json` è considerato immutabile. I valori predefiniti derivati all'avvio rimangono disponibili solo durante l'esecuzione e gli strumenti che modificano la configurazione (configurazione iniziale, procedura guidata iniziale, `openclaw update` con modifiche, installazione/aggiornamento/disinstallazione/abilitazione dei Plugin, `doctor --fix`, `doctor --generate-gateway-token`, `openclaw config set`) si rifiutano di modificare il file.
- Modifica invece il sorgente Nix. Per nix-openclaw, usa l'[Avvio rapido](https://github.com/openclaw/nix-openclaw#quick-start) orientato agli agenti e imposta la configurazione in `programs.openclaw.config` o `instances.<name>.config`.
- Le dipendenze mancanti mostrano messaggi di risoluzione specifici per Nix.
- L'interfaccia utente mostra un banner di modalità Nix in sola lettura.

### Percorsi di configurazione e stato

OpenClaw legge la configurazione JSON5 da `OPENCLAW_CONFIG_PATH` e archivia i dati modificabili in `OPENCLAW_STATE_DIR`. Con Nix, impostali esplicitamente su percorsi gestiti da Nix, in modo che lo stato di runtime e la configurazione restino fuori dall'archivio immutabile.

| Variabile              | Valore predefinito                      |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Rilevamento del PATH del servizio

Il servizio Gateway launchd/systemd rileva automaticamente i binari dei profili Nix, in modo che i Plugin e gli strumenti che eseguono gli eseguibili installati tramite `nix` funzionino senza configurare manualmente il PATH:

- Quando `NIX_PROFILES` è impostata, ogni voce viene aggiunta al PATH del servizio con precedenza da destra verso sinistra (come la precedenza della shell Nix: vince la voce più a destra).
- Quando `NIX_PROFILES` non è impostata, `~/.nix-profile/bin` viene aggiunto come percorso di riserva.

Questo vale sia per gli ambienti dei servizi launchd su macOS sia per quelli systemd su Linux.

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Modulo Home Manager autorevole e guida completa alla configurazione.
  </Card>
  <Card title="Procedura guidata di configurazione" href="/it/start/wizard" icon="wand-magic-sparkles">
    Guida dettagliata alla configurazione tramite CLI senza Nix.
  </Card>
  <Card title="Docker" href="/it/install/docker" icon="docker">
    Configurazione in container come alternativa senza Nix.
  </Card>
  <Card title="Aggiornamento" href="/it/install/updating" icon="arrow-up-right-from-square">
    Aggiornamento delle installazioni gestite da Home Manager insieme al pacchetto.
  </Card>
</CardGroup>
