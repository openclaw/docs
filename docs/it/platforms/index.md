---
read_when:
    - Cerchi supporto del sistema operativo o percorsi di installazione
    - Decidere dove eseguire il Gateway
summary: Panoramica del supporto delle piattaforme (Gateway + app companion)
title: Piattaforme
x-i18n:
    generated_at: "2026-04-24T08:49:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ebed9f219f3072ef760006eef47ca78f87169c40a6098c3585dfaf6169fc594
    source_path: platforms/index.md
    workflow: 15
---

Il core di OpenClaw è scritto in TypeScript. **Node è il runtime consigliato**.
Bun non è consigliato per il Gateway — ci sono problemi noti con i canali WhatsApp e
Telegram; vedi [Bun (experimental)](/it/install/bun) per i dettagli.

Esistono app companion per macOS (app nella barra dei menu) e Node mobili (iOS/Android). Le app companion per Windows e
Linux sono pianificate, ma il Gateway è già pienamente supportato oggi.
Sono pianificate anche app companion native per Windows; il Gateway è consigliato tramite WSL2.

## Scegli il tuo sistema operativo

- macOS: [macOS](/it/platforms/macos)
- iOS: [iOS](/it/platforms/ios)
- Android: [Android](/it/platforms/android)
- Windows: [Windows](/it/platforms/windows)
- Linux: [Linux](/it/platforms/linux)

## VPS e hosting

- Hub VPS: [VPS hosting](/it/vps)
- Fly.io: [Fly.io](/it/install/fly)
- Hetzner (Docker): [Hetzner](/it/install/hetzner)
- GCP (Compute Engine): [GCP](/it/install/gcp)
- Azure (Linux VM): [Azure](/it/install/azure)
- exe.dev (VM + proxy HTTPS): [exe.dev](/it/install/exe-dev)

## Link comuni

- Guida all'installazione: [Getting Started](/it/start/getting-started)
- Runbook del Gateway: [Gateway](/it/gateway)
- Configurazione del Gateway: [Configuration](/it/gateway/configuration)
- Stato del servizio: `openclaw gateway status`

## Installazione del servizio Gateway (CLI)

Usa una di queste opzioni (tutte supportate):

- Procedura guidata (consigliata): `openclaw onboard --install-daemon`
- Diretto: `openclaw gateway install`
- Flusso configure: `openclaw configure` → seleziona **Gateway service**
- Riparazione/migrazione: `openclaw doctor` (offre di installare o correggere il servizio)

La destinazione del servizio dipende dal sistema operativo:

- macOS: LaunchAgent (`ai.openclaw.gateway` o `ai.openclaw.<profile>`; legacy `com.openclaw.*`)
- Linux/WSL2: servizio utente systemd (`openclaw-gateway[-<profile>].service`)
- Windows nativo: Scheduled Task (`OpenClaw Gateway` oppure `OpenClaw Gateway (<profile>)`), con fallback a un elemento di accesso nella cartella Startup per utente se la creazione del task viene negata

## Correlati

- [Panoramica dell'installazione](/it/install)
- [App macOS](/it/platforms/macos)
- [App iOS](/it/platforms/ios)
