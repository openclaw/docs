---
read_when:
    - Installazione dell'app macOS
    - Decidere tra modalità Gateway locale e remota su macOS
    - Ricerca dei download della release dell’app macOS
summary: Installa e usa l'app OpenClaw per la barra dei menu di macOS
title: app macOS
x-i18n:
    generated_at: "2026-07-04T06:35:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b693bb8ebced46bac173f47cdd90d1b69948ccf2388fda449c77a47ae2a4fb4
    source_path: platforms/macos.md
    workflow: 16
---

L'app macOS è il **companion della barra dei menu** di OpenClaw. Usala quando vuoi una
UI nativa nell'area di notifica, prompt di autorizzazione macOS, notifiche, WebChat, input vocale,
Canvas o strumenti del nodo ospitati su Mac come `system.run`.

Se ti servono solo la CLI e il Gateway, inizia da [Guida introduttiva](/it/start/getting-started).

## Download

Scarica le build dell'app macOS dalle
[release GitHub di OpenClaw](https://github.com/openclaw/openclaw/releases).
Quando una release include asset dell'app macOS, cerca:

- `OpenClaw-<version>.dmg` (preferito)
- `OpenClaw-<version>.zip`

Alcune release includono solo asset CLI, prove o Windows. Se la release più recente
non ha asset dell'app macOS, usa la release più recente che li include, oppure compila l'
app dal sorgente con [configurazione di sviluppo macOS](/it/platforms/mac/dev-setup).

## Primo avvio

1. Installa e avvia **OpenClaw.app**.
2. Scegli **Questo Mac** per un Gateway locale, oppure connettiti a un Gateway remoto.
3. Per la modalità locale, attendi mentre l'app installa il runtime e il Gateway nello spazio utente.
4. Completa la configurazione del provider e la checklist delle autorizzazioni macOS.
5. Invia il messaggio di test di onboarding.

Per il percorso di configurazione CLI/Gateway, usa [Guida introduttiva](/it/start/getting-started).
Per il ripristino delle autorizzazioni, usa [autorizzazioni macOS](/it/platforms/mac/permissions).

## Scegli una modalità Gateway

| Modalità | Usala quando                                                                            | Pagina di dettaglio                                |
| -------- | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Locale   | Questo Mac deve eseguire il Gateway e mantenerlo attivo con launchd.                    | [Gateway su macOS](/it/platforms/mac/bundled-gateway) |
| Remota   | Un altro host esegue il Gateway e questo Mac deve controllarlo via SSH, LAN o Tailnet. | [Controllo remoto](/it/platforms/mac/remote)          |

La modalità locale richiede una CLI `openclaw` installata. Su un Mac nuovo, l'app installa
automaticamente la CLI e il runtime corrispondenti prima di avviare la procedura guidata del Gateway.
Consulta [Gateway su macOS](/it/platforms/mac/bundled-gateway) per il ripristino manuale.

## Cosa gestisce l'app

- Stato della barra dei menu, notifiche, integrità e WebChat.
- Prompt di autorizzazione macOS per schermo, microfono, voce, automazione e accessibilità.
- Strumenti del nodo locali come Canvas, acquisizione da fotocamera/schermo, notifiche e `system.run`.
- Prompt di approvazione Exec per comandi ospitati su Mac.
- Tunnel SSH in modalità remota o connessioni dirette al Gateway.

L'app **non** sostituisce il Gateway OpenClaw o la documentazione generale della CLI. La configurazione
di base del Gateway, provider, plugin, canali, strumenti e sicurezza si trova
nella relativa documentazione.

## Pagine di dettaglio macOS

| Attività                                | Leggi                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------- |
| Installare o eseguire il debug del servizio CLI/Gateway | [Gateway su macOS](/it/platforms/mac/bundled-gateway)                                          |
| Tenere lo stato fuori dalle cartelle sincronizzate con il cloud | [Gateway su macOS](/it/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| Eseguire il debug del rilevamento e della connettività dell'app | [Gateway su macOS](/it/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| Comprendere il comportamento di launchd | [Ciclo di vita del Gateway](/it/platforms/mac/child-process)                                   |
| Risolvere problemi di autorizzazioni o firma/TCC | [autorizzazioni macOS](/it/platforms/mac/permissions)                                             |
| Connettersi a un Gateway remoto         | [Controllo remoto](/it/platforms/mac/remote)                                                    |
| Leggere lo stato della barra dei menu e i controlli di integrità | [Barra dei menu](/it/platforms/mac/menu-bar), [Controlli di integrità](/it/platforms/mac/health)  |
| Usare l'interfaccia chat integrata      | [WebChat](/it/platforms/mac/webchat)                                                           |
| Usare l'attivazione vocale o push-to-talk | [Attivazione vocale](/it/platforms/mac/voicewake)                                              |
| Usare Canvas e i deep link Canvas       | [Canvas](/it/platforms/mac/canvas)                                                             |
| Ospitare PeekabooBridge per l'automazione UI | [Bridge Peekaboo](/it/platforms/mac/peekaboo)                                                  |
| Configurare le approvazioni dei comandi | [Approvazioni Exec](/it/tools/exec-approvals), [dettagli avanzati](/it/tools/exec-approvals-advanced) |
| Ispezionare i comandi del nodo Mac e l'IPC dell'app | [IPC macOS](/it/platforms/mac/xpc)                                                             |
| Acquisire i log                         | [logging macOS](/it/platforms/mac/logging)                                                     |
| Compilare dal sorgente                  | [configurazione di sviluppo macOS](/it/platforms/mac/dev-setup)                                |

## Correlati

- [Piattaforme](/it/platforms)
- [Guida introduttiva](/it/start/getting-started)
- [Gateway](/it/gateway)
- [Approvazioni Exec](/it/tools/exec-approvals)
