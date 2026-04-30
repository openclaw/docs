---
read_when:
    - Configurazione dell'ambiente di sviluppo macOS
summary: Guida alla configurazione per sviluppatori che lavorano sull’app macOS di OpenClaw
title: Configurazione di sviluppo per macOS
x-i18n:
    generated_at: "2026-04-30T09:01:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0c494b7a214b6db2880ba02c512653c35dbcdf80805bee9777ec946412668e1
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Configurazione dell'ambiente di sviluppo macOS

Compila ed esegui l'applicazione macOS OpenClaw dal codice sorgente.

## Prerequisiti

Prima di compilare l'app, assicurati di avere installato quanto segue:

1. **Xcode 26.2+**: richiesto per lo sviluppo Swift.
2. **Node.js 24 e pnpm**: consigliati per il Gateway, la CLI e gli script di packaging. Node 22 LTS, attualmente `22.14+`, resta supportato per compatibilità.

## 1. Installare le dipendenze

Installa le dipendenze dell'intero progetto:

```bash
pnpm install
```

## 2. Compilare e creare il pacchetto dell'app

Per compilare l'app macOS e impacchettarla in `dist/OpenClaw.app`, esegui:

```bash
./scripts/package-mac-app.sh
```

Se non disponi di un certificato Apple Developer ID, lo script userà automaticamente la **firma ad hoc** (`-`).

Per le modalità di esecuzione di sviluppo, i flag di firma e la risoluzione dei problemi relativi al Team ID, consulta il README dell'app macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Nota**: le app firmate ad hoc possono attivare richieste di sicurezza. Se l'app si arresta immediatamente con "Abort trap 6", consulta la sezione [Risoluzione dei problemi](#troubleshooting).

## 3. Installare la CLI

L'app macOS richiede un'installazione globale della CLI `openclaw` per gestire le attività in background.

**Per installarla (consigliato):**

1. Apri l'app OpenClaw.
2. Vai alla scheda delle impostazioni **Generali**.
3. Fai clic su **"Installa CLI"**.

In alternativa, installala manualmente:

```bash
npm install -g openclaw@<version>
```

Anche `pnpm add -g openclaw@<version>` e `bun add -g openclaw@<version>` funzionano.
Per il runtime del Gateway, Node resta il percorso consigliato.

## Risoluzione dei problemi

### Compilazione non riuscita: mancata corrispondenza della toolchain o dell'SDK

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

### L'app si arresta quando concedi un'autorizzazione

Se l'app si arresta quando provi a consentire l'accesso a **Riconoscimento vocale** o **Microfono**, la causa potrebbe essere una cache TCC corrotta o una mancata corrispondenza della firma.

**Correzione:**

1. Reimposta le autorizzazioni TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Se l'operazione non riesce, modifica temporaneamente il `BUNDLE_ID` in [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) per forzare un "nuovo inizio" da macOS.

### Gateway bloccato indefinitamente su "Starting..."

Se lo stato del Gateway resta su "Starting...", verifica se un processo zombie sta occupando la porta:

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
