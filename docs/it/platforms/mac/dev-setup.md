---
read_when:
    - Configurazione dell'ambiente di sviluppo macOS
summary: Guida di configurazione per gli sviluppatori che lavorano sull'app macOS di OpenClaw
title: Configurazione di sviluppo macOS
x-i18n:
    generated_at: "2026-04-05T13:58:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd13f17391bdd87ef59e4c575e5da3312c4066de00905731263bff655a5db357
    source_path: platforms/mac/dev-setup.md
    workflow: 15
---

# Configurazione di sviluppo macOS

Questa guida copre i passaggi necessari per compilare ed eseguire dall'origine l'applicazione macOS di OpenClaw.

## Prerequisiti

Prima di compilare l'app, assicurati di avere installato quanto segue:

1. **Xcode 26.2+**: richiesto per lo sviluppo Swift.
2. **Node.js 24 & pnpm**: consigliati per il gateway, la CLI e gli script di packaging. Node 22 LTS, attualmente `22.14+`, resta supportato per compatibilità.

## 1. Installa le dipendenze

Installa le dipendenze dell'intero progetto:

```bash
pnpm install
```

## 2. Compila e crea il pacchetto dell'app

Per compilare l'app macOS e impacchettarla in `dist/OpenClaw.app`, esegui:

```bash
./scripts/package-mac-app.sh
```

Se non hai un certificato Apple Developer ID, lo script userà automaticamente la **firma ad hoc** (`-`).

Per le modalità di esecuzione in sviluppo, i flag di firma e la risoluzione dei problemi relativi al Team ID, vedi il README dell'app macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Nota**: le app firmate ad hoc possono attivare prompt di sicurezza. Se l'app si arresta immediatamente con "Abort trap 6", vedi la sezione [Troubleshooting](#troubleshooting).

## 3. Installa la CLI

L'app macOS si aspetta un'installazione globale della CLI `openclaw` per gestire le attività in background.

**Per installarla (consigliato):**

1. Apri l'app OpenClaw.
2. Vai alla scheda delle impostazioni **General**.
3. Fai clic su **"Install CLI"**.

In alternativa, installala manualmente:

```bash
npm install -g openclaw@<version>
```

Anche `pnpm add -g openclaw@<version>` e `bun add -g openclaw@<version>` funzionano.
Per il runtime del Gateway, Node resta il percorso consigliato.

## Troubleshooting

### La build fallisce: mismatch di toolchain o SDK

La build dell'app macOS si aspetta l'SDK macOS più recente e la toolchain Swift 6.2.

**Dipendenze di sistema (obbligatorie):**

- **Ultima versione di macOS disponibile in Software Update** (richiesta dagli SDK di Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Controlli:**

```bash
xcodebuild -version
xcrun swift --version
```

Se le versioni non corrispondono, aggiorna macOS/Xcode ed esegui di nuovo la build.

### L'app si arresta quando concedi i permessi

Se l'app si arresta quando provi a consentire l'accesso a **Speech Recognition** o **Microphone**, la causa potrebbe essere una cache TCC corrotta o una mancata corrispondenza della firma.

**Correzione:**

1. Reimposta i permessi TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Se non funziona, modifica temporaneamente `BUNDLE_ID` in [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) per forzare una "tabula rasa" da parte di macOS.

### Gateway su "Starting..." indefinitamente

Se lo stato del gateway resta su "Starting...", controlla se un processo zombie sta occupando la porta:

```bash
openclaw gateway status
openclaw gateway stop

# Se non stai usando un LaunchAgent (modalità sviluppo / esecuzioni manuali), trova il listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Se un'esecuzione manuale sta occupando la porta, arresta quel processo (Ctrl+C). Come ultima risorsa, termina il PID trovato sopra.
