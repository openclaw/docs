---
read_when:
    - Configurazione dell'ambiente di sviluppo macOS
summary: Guida alla configurazione per gli sviluppatori che lavorano sull’app OpenClaw per macOS
title: Configurazione di sviluppo per macOS
x-i18n:
    generated_at: "2026-07-12T07:13:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd7d556af92892d3deea3f5d8238a33cd413e10b0b377468396221e174ace8fe
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Configurazione per sviluppatori macOS

Compila ed esegui l'applicazione OpenClaw per macOS dal codice sorgente.

## Prerequisiti

- **Xcode 26.2+** (toolchain Swift 6.2), sulla versione più recente di macOS disponibile in
  Software Update.
- **Node.js 24 e pnpm** per il Gateway, la CLI e gli script di pacchettizzazione. È compatibile anche Node
  22.19+.

## 1. Installa le dipendenze

```bash
pnpm install
```

## 2. Compila e pacchettizza l'app

```bash
./scripts/package-mac-app.sh
```

Genera `dist/OpenClaw.app`. In assenza di un certificato Apple Developer ID, lo
script ricorre alla firma ad hoc.

Per le modalità di esecuzione di sviluppo, le opzioni di firma e la risoluzione dei problemi relativi al Team ID, consulta
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md).
Ciclo di sviluppo rapido dalla radice del repository: `scripts/restart-mac.sh` (aggiungi `--no-sign` per
la firma ad hoc; le autorizzazioni TCC non vengono mantenute con `--no-sign`).

<Note>
Le app firmate ad hoc possono attivare richieste di sicurezza. Se l'app si arresta
immediatamente con "Abort trap 6", consulta [Risoluzione dei problemi](#troubleshooting).
</Note>

## 3. Installa la CLI e il Gateway

L'app pacchettizzata incorpora il programma di installazione canonico `scripts/install-cli.sh`. Su un
profilo nuovo, scegli **This Mac** durante la procedura di configurazione iniziale; l'app installa la
CLI nello spazio utente e il runtime corrispondenti prima di avviare la procedura guidata del Gateway.

Per il ripristino manuale dell'ambiente di sviluppo, installa autonomamente la CLI corrispondente:

```bash
npm install -g openclaw@<version>
```

Sono supportati anche `pnpm add -g openclaw@<version>` e `bun add -g openclaw@<version>`.
Node rimane il runtime consigliato per il Gateway.

## Risoluzione dei problemi

### Compilazione non riuscita: toolchain o SDK non corrispondenti

La compilazione dell'app per macOS richiede l'SDK macOS più recente e la toolchain Swift 6.2
(Xcode 26.2+).

```bash
xcodebuild -version
xcrun swift --version
```

Se le versioni non corrispondono, aggiorna macOS/Xcode ed esegui nuovamente la compilazione.

### L'app si arresta durante la concessione delle autorizzazioni

Se l'app si arresta quando tenti di consentire l'accesso a **Speech Recognition** o
**Microphone**, la causa potrebbe essere una cache TCC danneggiata o una mancata corrispondenza della firma.

1. Reimposta le autorizzazioni TCC per l'ID del bundle di debug:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Se l'operazione non riesce, modifica temporaneamente `BUNDLE_ID` in
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)
   per forzare macOS a ripartire da una configurazione pulita.

### Gateway bloccato indefinitamente su "Starting..."

Controlla se un processo zombie occupa la porta:

```bash
openclaw gateway status
openclaw gateway stop

# Se non stai utilizzando un LaunchAgent (modalità di sviluppo / esecuzioni manuali), individua il processo in ascolto:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Se un'esecuzione manuale occupa la porta, arrestala (Ctrl+C) oppure, come ultima
risorsa, termina il PID individuato sopra.

## Contenuti correlati

- [App per macOS](/it/platforms/macos)
- [Panoramica dell'installazione](/it/install)
