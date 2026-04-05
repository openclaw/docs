---
read_when:
    - Stai cercando il supporto del sistema operativo o i percorsi di installazione
    - Stai decidendo dove eseguire il Gateway
summary: Panoramica del supporto delle piattaforme (Gateway + app complementari)
title: Piattaforme
x-i18n:
    generated_at: "2026-04-05T13:57:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5be4743fd39eca426d65db940f04f3a8fc3ff2c5e10b0e82bc55fc35a7d1399
    source_path: platforms/index.md
    workflow: 15
---

# Piattaforme

Il core di OpenClaw è scritto in TypeScript. **Node è il runtime consigliato**.
bun non è consigliato per il Gateway (bug di WhatsApp/Telegram).

Esistono app complementari per macOS (app nella barra dei menu) e nodi mobili (iOS/Android). Le app complementari per Windows e
Linux sono pianificate, ma il Gateway è già oggi pienamente supportato.
Sono pianificate anche app complementari native per Windows; per il Gateway è consigliato WSL2.

## Scegli il tuo sistema operativo

- macOS: [macOS](/platforms/macos)
- iOS: [iOS](/platforms/ios)
- Android: [Android](/platforms/android)
- Windows: [Windows](/platforms/windows)
- Linux: [Linux](/platforms/linux)

## VPS e hosting

- Hub VPS: [Hosting VPS](/vps)
- Fly.io: [Fly.io](/install/fly)
- Hetzner (Docker): [Hetzner](/install/hetzner)
- GCP (Compute Engine): [GCP](/install/gcp)
- Azure (Linux VM): [Azure](/install/azure)
- exe.dev (VM + proxy HTTPS): [exe.dev](/install/exe-dev)

## Link comuni

- Guida all'installazione: [Getting Started](/start/getting-started)
- Runbook del Gateway: [Gateway](/gateway)
- Configurazione del Gateway: [Configurazione](/gateway/configuration)
- Stato del servizio: `openclaw gateway status`

## Installazione del servizio Gateway (CLI)

Usa una di queste opzioni (tutte supportate):

- Procedura guidata (consigliata): `openclaw onboard --install-daemon`
- Diretto: `openclaw gateway install`
- Flusso di configurazione: `openclaw configure` → seleziona **Servizio Gateway**
- Riparazione/migrazione: `openclaw doctor` (offre di installare o correggere il servizio)

La destinazione del servizio dipende dal sistema operativo:

- macOS: LaunchAgent (`ai.openclaw.gateway` o `ai.openclaw.<profile>`; legacy `com.openclaw.*`)
- Linux/WSL2: servizio utente systemd (`openclaw-gateway[-<profile>].service`)
- Windows nativo: Scheduled Task (`OpenClaw Gateway` o `OpenClaw Gateway (<profile>)`), con fallback a un elemento di accesso nella cartella Startup per utente se la creazione dell'attività viene negata
