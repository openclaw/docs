---
read_when:
    - Modifica dei contratti IPC o dell'IPC dell'app della barra dei menu
summary: Architettura IPC di macOS per l’app OpenClaw, il trasporto del nodo Gateway e PeekabooBridge
title: IPC di macOS
x-i18n:
    generated_at: "2026-07-12T07:14:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 39e11af2bb9348d1c1f6e4fe6be95e825d23d5c1aa66e32dae713a89afb12b4f
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# Architettura IPC di OpenClaw per macOS

Un socket Unix locale collega il servizio host del Node all'app macOS per le approvazioni di esecuzione e `system.run`. È disponibile una CLI di debug `openclaw-mac` (`apps/macos/Sources/OpenClawMacCLI`) per i controlli di rilevamento e connessione; le azioni degli agenti continuano a transitare attraverso il WebSocket del Gateway e `node.invoke`. Il percorso `computer.act` basato sul Node esegue l'automazione Peekaboo incorporata nello stesso processo; i client Peekaboo autonomi utilizzano PeekabooBridge.

## Obiettivi

- Un'unica istanza dell'app GUI che gestisce tutte le operazioni rivolte a TCC (notifiche, registrazione dello schermo, microfono, sintesi vocale, AppleScript).
- Una superficie ridotta per l'automazione: Gateway + comandi del Node, `computer.act` nello stesso processo, oltre a PeekabooBridge per i client autonomi di automazione dell'interfaccia utente.
- Autorizzazioni prevedibili: sempre lo stesso ID bundle firmato, avviato da launchd, in modo che le autorizzazioni TCC persistano.

## Funzionamento

### Trasporto Gateway + Node

- L'app esegue il Gateway (modalità locale) e vi si connette come Node.
- Le azioni degli agenti vengono eseguite tramite `node.invoke` (ad esempio `system.run`, `system.notify`, `canvas.*`).
- I comandi del Node includono `canvas.*`, `camera.snap`, `camera.clip`, `screen.snapshot`, `screen.record`, `computer.act`, `system.run` e `system.notify`.
- Il Node segnala una mappa `permissions`, in modo che gli agenti possano verificare se è disponibile l'accesso a schermo, fotocamera, microfono, sintesi vocale, automazione o accessibilità.

### Servizio Node + IPC dell'app

- Un servizio host del Node senza interfaccia grafica si connette al WebSocket del Gateway.
- Le richieste `system.run` vengono inoltrate all'app macOS tramite un socket Unix locale (`ExecApprovalsSocket.swift`).
- L'app esegue il comando nel contesto dell'interfaccia utente, richiede conferma se necessario e restituisce l'output.

Diagramma (SCI):

```text
Agente -> Gateway -> Servizio Node (WS)
                         |  IPC (UDS + token + HMAC + TTL)
                         v
                     App Mac (UI + TCC + system.run)
```

### PeekabooBridge (automazione dell'interfaccia utente)

- Lo strumento `computer` integrato dell'agente **non** utilizza questo socket. Un Node macOS associato esegue `computer.act` nel processo dell'app con i servizi Peekaboo incorporati.
- L'automazione dell'interfaccia utente utilizza un socket UNIX separato (`~/Library/Application Support/OpenClaw/<socket>`) e il protocollo JSON di PeekabooBridge.
- Ordine di preferenza dell'host (lato client): Peekaboo.app -> Claude.app -> OpenClaw.app -> esecuzione locale.
- Sicurezza: gli host bridge richiedono un TeamID incluso nell'elenco consentito (il componente `PeekabooBridgeHostCoordinator` incluso consente un team fisso oltre al team di firma dell'app); una modalità alternativa riservata a DEBUG per lo stesso UID è protetta da `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (convenzione Peekaboo).
- Per i dettagli, consulta: [Utilizzo di PeekabooBridge](/it/platforms/mac/peekaboo).

## Flussi operativi

- Riavvio/ricompilazione: `scripts/restart-mac.sh` termina le istanze esistenti, ricompila tramite Swift, ricrea il pacchetto e riavvia l'app. Rileva automaticamente un'identità di firma disponibile e, se non ne trova alcuna, ripiega su `--no-sign`; passa `--sign` per richiedere la firma (l'operazione non riesce se non è disponibile alcuna chiave) oppure `--no-sign` per forzare il percorso senza firma. Nel percorso firmato, la variabile `SIGN_IDENTITY` impostata nell'ambiente viene rimossa, affinché il rilevamento automatico dell'identità di `scripts/codesign-mac-app.sh` selezioni il certificato.
- Istanza singola: l'app controlla `NSWorkspace.runningApplications` per rilevare un ID bundle duplicato e termina se viene trovata più di un'istanza (`isDuplicateInstance()` in `MenuBar.swift`).

## Note sulla protezione

- È preferibile richiedere la corrispondenza del TeamID per tutte le superfici privilegiate.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (solo DEBUG) può consentire chiamanti con lo stesso UID per lo sviluppo locale.
- Tutte le comunicazioni rimangono esclusivamente locali; non viene esposto alcun socket di rete.
- Le richieste TCC provengono esclusivamente dal bundle dell'app GUI; mantieni stabile l'ID bundle firmato tra le ricompilazioni.
- Protezione del socket per le approvazioni di esecuzione: modalità file `0600`, token condiviso, controllo dell'UID del peer (`getpeereid`), challenge/response HMAC-SHA256 e TTL breve per le richieste.

## Contenuti correlati

- [App macOS](/it/platforms/macos)
- [Flusso IPC di macOS (approvazioni di esecuzione)](/it/tools/exec-approvals-advanced#macos-ipc-flow)
