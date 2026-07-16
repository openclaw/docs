---
read_when:
    - Configurazione dell'ambiente di sviluppo macOS
summary: Guida alla configurazione per gli sviluppatori che lavorano sull'app OpenClaw per macOS
title: Configurazione di sviluppo per macOS
x-i18n:
    generated_at: "2026-07-16T14:33:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ff72bb449e70b94b8a13504414955ab7fe411a674b65e670939484a5863b5f48
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Configurazione per sviluppatori macOS

Compilare ed eseguire l'applicazione OpenClaw per macOS dal codice sorgente.

## Prerequisiti

- **Xcode 26.2+** (toolchain Swift 6.2), sull'ultima versione di macOS disponibile in
  Software Update.
- **Node.js 24.15+ e pnpm** per il Gateway, la CLI e gli script di pacchettizzazione. È supportato anche Node
  22.22.3+.

## 1. Installare le dipendenze

```bash
pnpm install
```

## 2. Compilare e pacchettizzare l'app

```bash
./scripts/package-mac-app.sh
```

Genera `dist/OpenClaw.app`. Senza un certificato Apple Developer ID, lo
script ricorre alla firma ad hoc.

Per le modalità di esecuzione per lo sviluppo, i flag di firma e la risoluzione dei problemi relativi al Team ID, consultare
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md).
Ciclo di sviluppo rapido dalla radice del repository: `scripts/restart-mac.sh` (aggiungere `--no-sign` per
la firma ad hoc; le autorizzazioni TCC non persistono con `--no-sign`).

<Note>
Le app con firma ad hoc possono attivare richieste di sicurezza. Se l'app si arresta
immediatamente con "Abort trap 6", consultare [Risoluzione dei problemi](#troubleshooting).
</Note>

## 3. Installare la CLI e il Gateway

L'app pacchettizzata incorpora il programma di installazione canonico `scripts/install-cli.sh`. In un
profilo nuovo, scegliere **This Mac** durante la configurazione iniziale; l'app installa la
CLI in spazio utente e il runtime corrispondenti prima di avviare la procedura guidata del Gateway.

Per il ripristino manuale dell'ambiente di sviluppo, installare autonomamente la CLI corrispondente:

```bash
npm install -g openclaw@<version>
```

Sono supportati anche `pnpm add -g openclaw@<version>` e `bun add -g openclaw@<version>`.
Node rimane il runtime consigliato per il Gateway stesso.

## Risoluzione dei problemi

### Compilazione non riuscita: toolchain o SDK non corrispondente

La compilazione dell'app per macOS richiede l'SDK macOS più recente e la toolchain Swift 6.2
(Xcode 26.2+).

```bash
xcodebuild -version
xcrun swift --version
```

Se le versioni non corrispondono, aggiornare macOS/Xcode ed eseguire nuovamente la compilazione.

### Arresto anomalo dell'app durante la concessione delle autorizzazioni

Se l'app si arresta in modo anomalo quando si tenta di consentire l'accesso a **Speech Recognition** o
**Microphone**, la causa potrebbe essere una cache TCC danneggiata o una firma non corrispondente.

1. Reimpostare le autorizzazioni TCC per l'ID bundle di debug:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Se l'operazione non riesce, modificare temporaneamente `BUNDLE_ID` in
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)
   per forzare una configurazione pulita in macOS.

### Gateway bloccato indefinitamente su "Starting..."

Verificare se un processo zombie occupa la porta:

```bash
openclaw gateway status
openclaw gateway stop

# Se non si utilizza un LaunchAgent (modalità sviluppo / esecuzioni manuali), individuare il listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Se la porta è occupata da un'esecuzione manuale, arrestarla (Ctrl+C) oppure, come
ultima risorsa, terminare il PID individuato sopra.

## Risorse correlate

- [App per macOS](/it/platforms/macos)
- [Panoramica dell'installazione](/it/install)
