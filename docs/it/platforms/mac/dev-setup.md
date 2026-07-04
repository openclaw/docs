---
read_when:
    - Configurazione dell'ambiente di sviluppo macOS
summary: Guida alla configurazione per sviluppatori che lavorano sull’app macOS di OpenClaw
title: Configurazione di sviluppo macOS
x-i18n:
    generated_at: "2026-07-04T06:38:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5438de16d6d796f4c3df5d896f288ee3dfaba16471a4abb932d277cd8e8b84f8
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Configurazione per sviluppatori macOS

Compila ed esegui l'applicazione OpenClaw per macOS dal sorgente.

## Prerequisiti

Prima di compilare l'app, assicurati di avere installato quanto segue:

1. **Xcode 26.2+**: richiesto per lo sviluppo Swift.
2. **Node.js 24 e pnpm**: consigliati per il gateway, la CLI e gli script di pacchettizzazione. Node 22 LTS, attualmente `22.19+`, resta supportato per compatibilità.

## 1. Installa le dipendenze

Installa le dipendenze dell'intero progetto:

```bash
pnpm install
```

## 2. Compila e pacchettizza l'app

Per compilare l'app macOS e pacchettizzarla in `dist/OpenClaw.app`, esegui:

```bash
./scripts/package-mac-app.sh
```

Se non hai un certificato Apple Developer ID, lo script userà automaticamente la **firma ad hoc** (`-`).

Per le modalità di esecuzione di sviluppo, i flag di firma e la risoluzione dei problemi del Team ID, consulta il README dell'app macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Nota**: le app firmate ad hoc possono attivare richieste di sicurezza. Se l'app si arresta immediatamente con "Abort trap 6", consulta la sezione [Risoluzione dei problemi](#troubleshooting).

## 3. Installa CLI e Gateway

L'app pacchettizzata incorpora il programma di installazione canonico `scripts/install-cli.sh`. Su un
profilo nuovo, scegli **Questo Mac** durante l'onboarding; l'app installa la
CLI e il runtime corrispondenti nello spazio utente prima di avviare la procedura guidata del Gateway.

Per il ripristino manuale in sviluppo, installa tu stesso la CLI corrispondente:

```bash
npm install -g openclaw@<version>
```

Anche `pnpm add -g openclaw@<version>` e `bun add -g openclaw@<version>` funzionano.
Per il runtime Gateway, Node resta il percorso consigliato.

## Risoluzione dei problemi

### La build non riesce: toolchain o SDK non corrispondenti

La build dell'app macOS richiede l'SDK macOS più recente e la toolchain Swift 6.2.

**Dipendenze di sistema (obbligatorie):**

- **Ultima versione di macOS disponibile in Aggiornamento Software** (richiesta dagli SDK di Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Controlli:**

```bash
xcodebuild -version
xcrun swift --version
```

Se le versioni non corrispondono, aggiorna macOS/Xcode ed esegui di nuovo la build.

### L'app si arresta durante la concessione dei permessi

Se l'app si arresta quando provi a consentire l'accesso a **Riconoscimento vocale** o **Microfono**, potrebbe essere dovuto a una cache TCC corrotta o a una mancata corrispondenza della firma.

**Correzione:**

1. Reimposta i permessi TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Se non riesce, modifica temporaneamente `BUNDLE_ID` in [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) per forzare una "tabula rasa" da macOS.

### Gateway "Starting..." indefinitamente

Se lo stato del gateway resta su "Starting...", controlla se un processo zombie sta occupando la porta:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Se un'esecuzione manuale sta occupando la porta, arresta quel processo (Ctrl+C). Come ultima risorsa, termina il PID trovato sopra.

## Correlati

- [App macOS](/it/platforms/macos)
- [Panoramica dell'installazione](/it/install)
