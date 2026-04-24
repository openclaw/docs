---
read_when:
    - Configurare l'ambiente di sviluppo macOS
summary: Guida di configurazione per sviluppatori che lavorano sull'app macOS di OpenClaw
title: Configurazione di sviluppo macOS
x-i18n:
    generated_at: "2026-04-24T08:50:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30f98b3249096fa1e125a7beb77562b7bd36e2c17f524f30a1c58de61bd04da0
    source_path: platforms/mac/dev-setup.md
    workflow: 15
---

# Configurazione di sviluppo macOS

Questa guida copre i passaggi necessari per compilare ed eseguire da sorgente l'app macOS di OpenClaw.

## Prerequisiti

Prima di compilare l'app, assicurati di avere installato quanto segue:

1. **Xcode 26.2+**: richiesto per lo sviluppo Swift.
2. **Node.js 24 & pnpm**: consigliati per gateway, CLI e script di packaging. Node 22 LTS, attualmente `22.14+`, resta supportato per compatibilità.

## 1. Installa le dipendenze

Installa le dipendenze dell'intero progetto:

```bash
pnpm install
```

## 2. Compila e crea il pacchetto dell'app

Per compilare l'app macOS e creare il pacchetto in `dist/OpenClaw.app`, esegui:

```bash
./scripts/package-mac-app.sh
```

Se non hai un certificato Apple Developer ID, lo script userà automaticamente la **firma ad-hoc** (`-`).

Per modalità di esecuzione di sviluppo, flag di firma e risoluzione dei problemi del Team ID, vedi il README dell'app macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Nota**: le app firmate ad-hoc possono attivare prompt di sicurezza. Se l'app crasha immediatamente con "Abort trap 6", vedi la sezione [Risoluzione dei problemi](#troubleshooting).

## 3. Installa la CLI

L'app macOS si aspetta un'installazione globale della CLI `openclaw` per gestire le attività in background.

**Per installarla (consigliato):**

1. Apri l'app OpenClaw.
2. Vai alla scheda impostazioni **General**.
3. Fai clic su **"Install CLI"**.

In alternativa, installala manualmente:

```bash
npm install -g openclaw@<version>
```

Anche `pnpm add -g openclaw@<version>` e `bun add -g openclaw@<version>` funzionano.
Per il runtime Gateway, Node resta il percorso consigliato.

## Risoluzione dei problemi

### La build fallisce: incompatibilità di toolchain o SDK

La build dell'app macOS si aspetta l'ultimo SDK macOS e la toolchain Swift 6.2.

**Dipendenze di sistema (richieste):**

- **Ultima versione di macOS disponibile in Software Update** (richiesta dagli SDK Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Controlli:**

```bash
xcodebuild -version
xcrun swift --version
```

Se le versioni non corrispondono, aggiorna macOS/Xcode e riesegui la build.

### L'app crasha alla concessione dei permessi

Se l'app crasha quando provi a consentire l'accesso a **Speech Recognition** o **Microphone**, il problema potrebbe essere dovuto a una cache TCC corrotta o a una mancata corrispondenza della firma.

**Correzione:**

1. Reimposta i permessi TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Se non funziona, cambia temporaneamente il `BUNDLE_ID` in [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) per forzare un "clean slate" da parte di macOS.

### Gateway bloccato su "Starting..."

Se lo stato del gateway resta su "Starting...", controlla se un processo zombie sta mantenendo la porta occupata:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Se un'esecuzione manuale sta mantenendo la porta, arresta quel processo (Ctrl+C). Come ultima risorsa, termina il PID trovato sopra.

## Correlati

- [App macOS](/it/platforms/macos)
- [Panoramica dell'installazione](/it/install)
