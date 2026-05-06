---
read_when:
    - Cerchi supporto per il sistema operativo o percorsi di installazione
    - Scegliere dove eseguire il Gateway
summary: Panoramica del supporto delle piattaforme (Gateway + app complementari)
title: Piattaforme
x-i18n:
    generated_at: "2026-05-06T08:59:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd1fbd1af8b03a12014d91b2f300fb8ec65b9c42c38ada2b9ca089181140a75c
    source_path: platforms/index.md
    workflow: 16
---

Il core di OpenClaw è scritto in TypeScript. **Node è il runtime consigliato**.
Bun non è consigliato per il Gateway — problemi noti con i canali WhatsApp e
Telegram; consulta [Bun (sperimentale)](/it/install/bun) per i dettagli.

Esistono app complementari per macOS (app nella barra dei menu) e nodi mobili (iOS/Android). Le app complementari per Windows e
Linux sono pianificate, ma il Gateway è pienamente supportato oggi.
Sono pianificate anche app complementari native per Windows; il Gateway è consigliato tramite WSL2.

## Scegli il tuo sistema operativo

- macOS: [macOS](/it/platforms/macos)
- iOS: [iOS](/it/platforms/ios)
- Android: [Android](/it/platforms/android)
- Windows: [Windows](/it/platforms/windows)
- Linux: [Linux](/it/platforms/linux)

## VPS e hosting

- Hub VPS: [Hosting VPS](/it/vps)
- Fly.io: [Fly.io](/it/install/fly)
- Hetzner (Docker): [Hetzner](/it/install/hetzner)
- GCP (Compute Engine): [GCP](/it/install/gcp)
- Azure (VM Linux): [Azure](/it/install/azure)
- exe.dev (VM + proxy HTTPS): [exe.dev](/it/install/exe-dev)

## Link comuni

- Guida all'installazione: [Per iniziare](/it/start/getting-started)
- Runbook del Gateway: [Gateway](/it/gateway)
- Configurazione del Gateway: [Configurazione](/it/gateway/configuration)
- Stato del servizio: `openclaw gateway status`

## Installazione del servizio Gateway (CLI)

Usa uno di questi metodi (tutti supportati):

- Procedura guidata (consigliata): `openclaw onboard --install-daemon`
- Diretta: `openclaw gateway install`
- Flusso di configurazione: `openclaw configure` → seleziona **Servizio Gateway**
- Riparazione/migrazione: `openclaw doctor` (propone di installare o correggere il servizio)

Il target del servizio dipende dal sistema operativo:

- macOS: LaunchAgent (`ai.openclaw.gateway` o `ai.openclaw.<profile>`; legacy `com.openclaw.*`)
- Linux/WSL2: servizio utente systemd (`openclaw-gateway[-<profile>].service`)
- Windows nativo: Attività pianificata (`OpenClaw Gateway` o `OpenClaw Gateway (<profile>)`), con fallback a un elemento di accesso nella cartella Esecuzione automatica per utente se la creazione dell'attività viene negata

## Correlati

- [Panoramica dell'installazione](/it/install)
- [App macOS](/it/platforms/macos)
- [App iOS](/it/platforms/ios)
