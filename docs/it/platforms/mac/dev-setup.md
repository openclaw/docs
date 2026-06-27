---
read_when:
    - Configurazione dell'ambiente di sviluppo macOS
summary: Guida alla configurazione per sviluppatori che lavorano sull'app macOS di OpenClaw
title: Configurazione di sviluppo per macOS
x-i18n:
    generated_at: "2026-06-27T17:44:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09212c9b9139dd19867b9286dc43361794a3efd37b2a8d769bb0a8fdd389b816
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Configurazione sviluppatore macOS

Compila ed esegui l'applicazione macOS di OpenClaw dal codice sorgente.

## Prerequisiti

Prima di compilare l'app, assicurati di avere installato quanto segue:

1. **Xcode 26.2+**: richiesto per lo sviluppo Swift.
2. **Node.js 24 e pnpm**: consigliati per il Gateway, la CLI e gli script di pacchettizzazione. Node 22 LTS, attualmente `22.19+`, resta supportato per compatibilità.

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

Se non hai un certificato Apple Developer ID, lo script userà automaticamente la **firma ad-hoc** (`-`).

Per le modalità di esecuzione in sviluppo, i flag di firma e la risoluzione dei problemi del Team ID, consulta il README dell'app macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Nota**: le app firmate ad-hoc possono attivare prompt di sicurezza. Se l'app si arresta immediatamente con "Abort trap 6", consulta la sezione [Risoluzione dei problemi](#troubleshooting).

## 3. Installa la CLI

L'app macOS si aspetta un'installazione globale della CLI `openclaw` per gestire le attività in background.

**Per installarla (consigliato):**

1. Apri l'app OpenClaw.
2. Vai alla scheda impostazioni **Generale**.
3. Fai clic su **"Installa CLI"**.

In alternativa, installala manualmente:

```bash
npm install -g openclaw@<version>
```

Anche `pnpm add -g openclaw@<version>` e `bun add -g openclaw@<version>` funzionano.
Per il runtime Gateway, Node resta il percorso consigliato.

## Risoluzione dei problemi

### La compilazione non riesce: incompatibilità della toolchain o dell'SDK

La compilazione dell'app macOS richiede l'SDK macOS più recente e la toolchain Swift 6.2.

**Dipendenze di sistema (richieste):**

- **Ultima versione di macOS disponibile in Aggiornamento Software** (richiesta dagli SDK di Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Controlli:**

```bash
xcodebuild -version
xcrun swift --version
```

Se le versioni non corrispondono, aggiorna macOS/Xcode ed esegui di nuovo la compilazione.

### L'app si arresta in modo anomalo alla concessione dei permessi

Se l'app si arresta in modo anomalo quando provi a consentire l'accesso a **Riconoscimento vocale** o **Microfono**, potrebbe dipendere da una cache TCC corrotta o da una mancata corrispondenza della firma.

**Correzione:**

1. Reimposta i permessi TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Se non funziona, modifica temporaneamente `BUNDLE_ID` in [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) per forzare un "nuovo inizio" da macOS.

### Gateway "Starting..." indefinitamente

Se lo stato del gateway rimane su "Starting...", controlla se un processo zombie sta occupando la porta:

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
