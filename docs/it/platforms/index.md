---
read_when:
    - Cerchi informazioni sul supporto dei sistemi operativi o sui percorsi di installazione
    - Decidere dove eseguire il Gateway
summary: Panoramica del supporto delle piattaforme (Gateway + app complementari)
title: Piattaforme
x-i18n:
    generated_at: "2026-07-12T07:13:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c91bf7fd41bf5433b9f1efb768a44dcf5fa55917cfc45f463688d00f23e725d
    source_path: platforms/index.md
    workflow: 16
---

Il core di OpenClaw è scritto in TypeScript. **Node è il runtime consigliato**.
Bun non è consigliato per il Gateway, a causa di problemi noti con i canali WhatsApp e
Telegram; per i dettagli, consulta [Bun (sperimentale)](/it/install/bun).

Sono disponibili app complementari per Windows Hub, macOS (app nella barra dei menu) e nodi mobili
(iOS/Android). Sono previste app complementari per Linux, ma il Gateway è già
pienamente supportato. Su Windows, scegli Windows Hub per l'app desktop, l'installazione
nativa tramite PowerShell per un utilizzo incentrato sul terminale oppure WSL2 per il runtime
Gateway con la massima compatibilità con Linux.

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
- EasyRunner (Podman + Caddy): [EasyRunner](/it/platforms/easyrunner)

## Collegamenti comuni

- Guida all'installazione: [Primi passi](/it/start/getting-started)
- Windows Hub: [Windows](/it/platforms/windows)
- Manuale operativo del Gateway: [Gateway](/it/gateway)
- Configurazione del Gateway: [Configurazione](/it/gateway/configuration)
- Stato del servizio: `openclaw gateway status`

## Installazione del servizio Gateway (CLI)

Usa una delle seguenti opzioni (tutte supportate):

- Procedura guidata (consigliata): `openclaw onboard --install-daemon`
- Diretta: `openclaw gateway install`
- Flusso di configurazione: `openclaw configure` → seleziona **Servizio Gateway**
- Riparazione/migrazione: `openclaw doctor` (propone di installare o correggere il servizio)

La destinazione del servizio dipende dal sistema operativo:

- macOS: LaunchAgent (`ai.openclaw.gateway` oppure `ai.openclaw.<profile>` per un profilo con nome)
- Linux/WSL2: servizio utente systemd (`openclaw-gateway[-<profile>].service`)
- Windows nativo: attività pianificata (`OpenClaw Gateway` o `OpenClaw Gateway (<profile>)`), con ripiego su un elemento di accesso nella cartella Esecuzione automatica per utente se la creazione dell'attività viene negata

## Contenuti correlati

- [Panoramica dell'installazione](/it/install)
- [Windows Hub](/it/platforms/windows)
- [App macOS](/it/platforms/macos)
- [App iOS](/it/platforms/ios)
