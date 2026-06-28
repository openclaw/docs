---
read_when:
    - Installazione dell'app macOS
    - Decidere tra modalità Gateway locale e remota su macOS
    - Ricerca dei download della release dell'app macOS
summary: Installa e usa l'app OpenClaw nella barra dei menu di macOS
title: app macOS
x-i18n:
    generated_at: "2026-06-28T00:13:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42cd610465f2e60736da4681e028bca3ed3ed00b424028554ea098acc8ea980c
    source_path: platforms/macos.md
    workflow: 16
---

L'app macOS è il **companion della barra dei menu** di OpenClaw. Usala quando vuoi una
UI nativa nella tray, richieste di autorizzazione macOS, notifiche, WebChat, input vocale,
Canvas o strumenti del nodo ospitato su Mac come `system.run`.

Se ti servono solo la CLI e il Gateway, inizia da [Primi passi](/it/start/getting-started).

## Download

Scarica le build dell'app macOS dalle
[release GitHub di OpenClaw](https://github.com/openclaw/openclaw/releases).
Quando una release include asset dell'app macOS, cerca:

- `OpenClaw-<version>.dmg` (preferito)
- `OpenClaw-<version>.zip`

Alcune release includono solo asset CLI, prove o Windows. Se la release più recente
non ha asset dell'app macOS, usa la release più recente che li include, oppure compila
l'app dal sorgente con [configurazione di sviluppo macOS](/it/platforms/mac/dev-setup).

## Primo avvio

1. Installa e avvia **OpenClaw.app**.
2. Completa la checklist delle autorizzazioni macOS.
3. Scegli la modalità **Locale** o **Remota**.
4. Installa la CLI `openclaw` se l'app lo richiede.
5. Apri WebChat dalla barra dei menu e invia un messaggio di prova.

Per il percorso di configurazione CLI/Gateway, usa [Primi passi](/it/start/getting-started).
Per il ripristino delle autorizzazioni, usa [autorizzazioni macOS](/it/platforms/mac/permissions).

## Scegli una modalità Gateway

| Modalità | Quando usarla                                                                           | Pagina di dettaglio                                |
| -------- | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Locale   | Questo Mac deve eseguire il Gateway e mantenerlo attivo con launchd.                   | [Gateway su macOS](/it/platforms/mac/bundled-gateway) |
| Remota   | Un altro host esegue il Gateway e questo Mac deve controllarlo via SSH, LAN o Tailnet. | [Controllo remoto](/it/platforms/mac/remote)          |

La modalità Locale richiede una CLI `openclaw` installata. L'app può installarla, oppure puoi
seguire [Gateway su macOS](/it/platforms/mac/bundled-gateway).

## Responsabilità dell'app

- Stato della barra dei menu, notifiche, salute e WebChat.
- Richieste di autorizzazione macOS per schermo, microfono, dettatura, automazione e accessibilità.
- Strumenti del nodo locale come Canvas, acquisizione da fotocamera/schermo, notifiche e `system.run`.
- Richieste di approvazione Exec per comandi ospitati su Mac.
- Tunnel SSH in modalità remota o connessioni Gateway dirette.

L'app **non** sostituisce il Gateway di OpenClaw o la documentazione generale della CLI. La configurazione
principale del Gateway, provider, plugin, canali, strumenti e sicurezza sono trattati
nelle rispettive documentazioni.

## Pagine di dettaglio macOS

| Attività                                        | Leggi                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Installare o eseguire il debug del servizio CLI/Gateway | [Gateway su macOS](/it/platforms/mac/bundled-gateway)                                          |
| Tenere lo stato fuori dalle cartelle sincronizzate nel cloud | [Gateway su macOS](/it/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| Eseguire il debug di discovery e connettività dell'app | [Gateway su macOS](/it/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| Comprendere il comportamento di launchd         | [Ciclo di vita del Gateway](/it/platforms/mac/child-process)                                   |
| Correggere problemi di autorizzazioni o firma/TCC | [autorizzazioni macOS](/it/platforms/mac/permissions)                                          |
| Connettersi a un Gateway remoto                 | [Controllo remoto](/it/platforms/mac/remote)                                                   |
| Leggere lo stato della barra dei menu e i controlli di salute | [Barra dei menu](/it/platforms/mac/menu-bar), [Controlli di salute](/it/platforms/mac/health)     |
| Usare la UI chat integrata                      | [WebChat](/it/platforms/mac/webchat)                                                           |
| Usare attivazione vocale o push-to-talk         | [Attivazione vocale](/it/platforms/mac/voicewake)                                              |
| Usare Canvas e i deep link Canvas               | [Canvas](/it/platforms/mac/canvas)                                                             |
| Ospitare PeekabooBridge per l'automazione UI    | [Bridge Peekaboo](/it/platforms/mac/peekaboo)                                                  |
| Configurare le approvazioni dei comandi         | [Approvazioni Exec](/it/tools/exec-approvals), [dettagli avanzati](/it/tools/exec-approvals-advanced) |
| Ispezionare i comandi del nodo Mac e l'IPC dell'app | [IPC macOS](/it/platforms/mac/xpc)                                                             |
| Acquisire i log                                 | [Logging macOS](/it/platforms/mac/logging)                                                     |
| Compilare dal sorgente                          | [configurazione di sviluppo macOS](/it/platforms/mac/dev-setup)                                |

## Correlati

- [Piattaforme](/it/platforms)
- [Primi passi](/it/start/getting-started)
- [Gateway](/it/gateway)
- [Approvazioni Exec](/it/tools/exec-approvals)
