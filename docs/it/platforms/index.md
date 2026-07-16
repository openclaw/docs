---
read_when:
    - Ricerca del supporto per i sistemi operativi o dei percorsi di installazione
    - Scegliere dove eseguire il Gateway
summary: Panoramica del supporto delle piattaforme (Gateway + app complementari)
title: Piattaforme
x-i18n:
    generated_at: "2026-07-16T14:33:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 40494f8567c0159d9b6024c174cf0f316a45b46c633a578efaf2388f679a88f2
    source_path: platforms/index.md
    workflow: 16
---

Il core di OpenClaw è scritto in TypeScript. **Node è il runtime obbligatorio** perché
l'archivio di stato canonico utilizza `node:sqlite`. Bun rimane disponibile per
l'installazione delle dipendenze e gli script dei pacchetti; vedere [Bun](/it/install/bun).

Sono disponibili app complementari per Windows Hub, macOS (app della barra dei menu) e nodi mobili
(iOS/Android). Le app complementari per Linux sono pianificate, ma il Gateway è già
pienamente supportato. Su Windows, scegliere Windows Hub per l'app desktop, l'installazione
nativa tramite PowerShell per un utilizzo principalmente da terminale oppure WSL2 per il runtime
Gateway con la massima compatibilità con Linux.

## Scegliere il sistema operativo

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
- EasyRunner (Podman + Caddy): [EasyRunner](/it/platforms/easyrunner)

## Collegamenti comuni

- Guida all'installazione: [Guida introduttiva](/it/start/getting-started)
- Windows Hub: [Windows](/it/platforms/windows)
- Manuale operativo del Gateway: [Gateway](/it/gateway)
- Configurazione del Gateway: [Configurazione](/it/gateway/configuration)
- Stato del servizio: `openclaw gateway status`

## Installazione del servizio Gateway (CLI)

Utilizzare una delle opzioni seguenti (tutte supportate):

- Procedura guidata (consigliata): `openclaw onboard --install-daemon`
- Diretta: `openclaw gateway install`
- Flusso di configurazione: `openclaw configure` → selezionare **Servizio Gateway**
- Riparazione/migrazione: `openclaw doctor` (propone di installare o correggere il servizio)

La destinazione del servizio dipende dal sistema operativo:

- macOS: LaunchAgent (`ai.openclaw.gateway` oppure `ai.openclaw.<profile>` per un profilo con nome)
- Linux/WSL2: servizio utente systemd (`openclaw-gateway[-<profile>].service`)
- Windows nativo: attività pianificata (`OpenClaw Gateway` o `OpenClaw Gateway (<profile>)`), con ripiego su un elemento di accesso nella cartella Esecuzione automatica per utente se la creazione dell'attività viene negata

## Contenuti correlati

- [Panoramica dell'installazione](/it/install)
- [Windows Hub](/it/platforms/windows)
- [App per macOS](/it/platforms/macos)
- [App per iOS](/it/platforms/ios)
