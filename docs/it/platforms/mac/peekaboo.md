---
read_when:
    - Hosting di PeekabooBridge in OpenClaw.app
    - Integrazione di Peekaboo tramite Swift Package Manager
    - Modifica del protocollo/dei percorsi di PeekabooBridge
    - Scegliere tra PeekabooBridge, Codex Computer Use e cua-driver MCP
summary: Integrazione di PeekabooBridge per l'automazione dell'interfaccia utente di macOS
title: Bridge Peekaboo
x-i18n:
    generated_at: "2026-07-12T07:12:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 030b5017f6a43df58e6843e8a4c37448bdaaa41ac7d7d7ab2a46cce05fa9f893
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw può ospitare **PeekabooBridge** come broker locale per l'automazione dell'interfaccia utente, sensibile alle autorizzazioni (`PeekabooBridgeHostCoordinator`, basato sul pacchetto Swift `steipete/Peekaboo`). Ciò consente alla CLI `peekaboo` di gestire l'automazione dell'interfaccia utente riutilizzando le autorizzazioni TCC dell'app macOS.

## Che cos'è (e che cosa non è)

- **Host**: OpenClaw.app può fungere da host PeekabooBridge.
- **Client**: la CLI `peekaboo` (non esiste un'interfaccia separata `openclaw ui ...`).
- **Interfaccia utente**: le sovrimpressioni visive rimangono in Peekaboo.app; OpenClaw funge da host broker minimale.

## Relazione con gli altri metodi di controllo del desktop

OpenClaw dispone di quattro metodi di controllo del desktop che rimangono intenzionalmente separati:

- **Host PeekabooBridge**: OpenClaw.app ospita il socket PeekabooBridge locale. La CLI `peekaboo` è il client e usa le autorizzazioni macOS di OpenClaw.app per acquisire schermate, fare clic, interagire con menu e finestre di dialogo, eseguire azioni nel Dock e gestire le finestre.
- **Uso del computer gestito dall'agente (`computer.act`)**: lo strumento `computer` integrato nell'agente del Gateway acquisisce schermate tramite `screen.snapshot` e controlla il puntatore e la tastiera mediante il comando Node pericoloso `computer.act`. Un Node macOS esegue `computer.act` nello stesso processo usando i servizi di automazione Peekaboo incorporati esposti da questo bridge, insieme a primitive CoreGraphics specifiche, senza passare dal socket PeekabooBridge né dalla CLI `peekaboo`. Consulta [Uso del computer](/nodes/computer-use).
- **Uso del computer con Codex**: il Plugin `codex` incluso verifica e può installare il Plugin MCP `computer-use` di Codex (`extensions/codex/src/app-server/computer-use.ts`), consentendo quindi a Codex di gestire le chiamate native agli strumenti di controllo del desktop durante le interazioni in modalità Codex. OpenClaw non inoltra tali azioni tramite PeekabooBridge.
- **MCP `cua-driver` diretto**: OpenClaw può registrare il server `cua-driver mcp` upstream di TryCua come un normale server MCP, fornendo agli agenti gli schemi del driver CUA e il relativo flusso di lavoro basato su pid/finestra/indice degli elementi, senza passare dal marketplace di Codex né dal socket PeekabooBridge.

Usa Peekaboo per l'ampia gamma di funzionalità di automazione macOS tramite l'host bridge sensibile alle autorizzazioni di OpenClaw.app. Usa l'uso del computer gestito dall'agente quando l'agente del Gateway deve vedere e controllare il desktop tramite un comando Node uniforme `computer.act`, utilizzabile da qualsiasi modello con capacità visive. Usa l'uso del computer con Codex quando un agente in modalità Codex deve affidarsi al Plugin nativo di Codex. Usa direttamente `cua-driver mcp` per esporre il driver CUA a qualsiasi ambiente di esecuzione gestito da OpenClaw come un normale server MCP.

## Abilitare il bridge

Nell'app macOS: **Settings -> Enable Peekaboo Bridge**.

Quando è abilitato, OpenClaw avvia un server socket UNIX locale in `~/Library/Application Support/OpenClaw/<socket-name>`. Se è disabilitato, l'host si arresta e `peekaboo` ricorre agli altri host disponibili. Il coordinatore mantiene inoltre i collegamenti simbolici dei socket legacy (`clawdbot`, `clawdis`, `moltbot` in Application Support), indirizzandoli al socket corrente per le installazioni meno recenti di `peekaboo`.

## Ordine di rilevamento dei client

I client Peekaboo in genere provano gli host nel seguente ordine:

1. Peekaboo.app (esperienza utente completa)
2. Claude.app (se installata)
3. OpenClaw.app (broker minimale)

Usa `peekaboo bridge status --verbose` per vedere quale host è attivo e quale percorso del socket è in uso. Esegui l'override con:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Sicurezza e autorizzazioni

- Il bridge convalida le **firme del codice del chiamante**; viene applicato un elenco di TeamID consentiti (il TeamID dell'host Peekaboo e il TeamID dell'app in esecuzione).
- Per Accessibilità, preferisci l'identità firmata del bridge o dell'app a un ambiente di esecuzione `node` generico. Concedere l'accesso ad Accessibilità a `node` consente a qualsiasi pacchetto avviato da tale eseguibile Node di ereditare l'accesso all'automazione dell'interfaccia grafica; consulta [Autorizzazioni macOS](/it/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- Le richieste scadono dopo 10 secondi (`requestTimeoutSec: 10`).
- Se mancano le autorizzazioni necessarie, il bridge restituisce un messaggio di errore chiaro anziché avviare Impostazioni di Sistema.

## Comportamento delle istantanee (automazione)

Le istantanee vengono archiviate in memoria con una finestra di validità di 10 minuti e un limite di 50 istantanee (`InMemorySnapshotManager`); gli artefatti non vengono eliminati durante la pulizia. Se occorre conservarli più a lungo, esegui una nuova acquisizione dal client.

## Risoluzione dei problemi

- Se `peekaboo` segnala "bridge client is not authorized", assicurati che il client sia firmato correttamente oppure esegui l'host con `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` esclusivamente in modalità **debug**.
- Se non viene trovato alcun host, apri una delle app host (Peekaboo.app o OpenClaw.app) e verifica che siano state concesse le autorizzazioni.

## Contenuti correlati

- [App macOS](/it/platforms/macos)
- [Autorizzazioni macOS](/it/platforms/mac/permissions)
