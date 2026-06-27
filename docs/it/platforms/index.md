---
read_when:
    - Cerchi il supporto per il sistema operativo o i percorsi di installazione
    - Decidere dove eseguire il Gateway
summary: Panoramica del supporto della piattaforma (Gateway + app complementari)
title: Piattaforme
x-i18n:
    generated_at: "2026-06-27T17:44:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d6edfaf9c4b1f1bc824d4bddf8263244902676dd5df98da556a8a5f35afe566
    source_path: platforms/index.md
    workflow: 16
---

Il core di OpenClaw è scritto in TypeScript. **Node è il runtime consigliato**.
Bun non è consigliato per il Gateway: problemi noti con i canali WhatsApp e
Telegram; consulta [Bun (sperimentale)](/it/install/bun) per i dettagli.

Esistono app companion per Windows Hub, macOS (app nella barra dei menu) e nodi mobili
(iOS/Android). Le app companion per Linux sono previste, ma il Gateway è completamente
supportato già oggi. Su Windows, scegli Windows Hub per l'app desktop, l'installazione
nativa PowerShell per l'uso orientato al terminale, oppure WSL2 per il runtime Gateway
più compatibile con Linux.

## Scegli il tuo sistema operativo

- macOS: [macOS](/it/platforms/macos)
- iOS: [iOS](/it/platforms/ios)
- Android: [Android](/it/platforms/android)
- Windows: [Windows](/it/platforms/windows)
- Linux: [Linux](/it/platforms/linux)

## VPS e hosting

- Hub VPS: [hosting VPS](/it/vps)
- Fly.io: [Fly.io](/it/install/fly)
- Hetzner (Docker): [Hetzner](/it/install/hetzner)
- GCP (Compute Engine): [GCP](/it/install/gcp)
- Azure (VM Linux): [Azure](/it/install/azure)
- exe.dev (VM + proxy HTTPS): [exe.dev](/it/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/it/platforms/easyrunner)

## Link comuni

- Guida all'installazione: [Introduzione](/it/start/getting-started)
- Windows Hub: [Windows](/it/platforms/windows)
- Runbook del Gateway: [Gateway](/it/gateway)
- Configurazione del Gateway: [Configurazione](/it/gateway/configuration)
- Stato del servizio: `openclaw gateway status`

## Installazione del servizio Gateway (CLI)

Usa una di queste opzioni (tutte supportate):

- Procedura guidata (consigliata): `openclaw onboard --install-daemon`
- Diretta: `openclaw gateway install`
- Flusso di configurazione: `openclaw configure` → seleziona **servizio Gateway**
- Ripara/migra: `openclaw doctor` (propone di installare o correggere il servizio)

La destinazione del servizio dipende dal sistema operativo:

- macOS: LaunchAgent (`ai.openclaw.gateway` o `ai.openclaw.<profile>`; legacy `com.openclaw.*`)
- Linux/WSL2: servizio utente systemd (`openclaw-gateway[-<profile>].service`)
- Windows nativo: Attività pianificata (`OpenClaw Gateway` o `OpenClaw Gateway (<profile>)`), con un elemento di accesso nella cartella Esecuzione automatica per utente come fallback se la creazione dell'attività viene negata

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Windows Hub](/it/platforms/windows)
- [app macOS](/it/platforms/macos)
- [app iOS](/it/platforms/ios)
