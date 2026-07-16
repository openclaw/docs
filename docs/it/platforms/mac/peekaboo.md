---
read_when:
    - Hosting di PeekabooBridge in OpenClaw.app
    - Integrazione di Peekaboo tramite Swift Package Manager
    - Modifica del protocollo/dei percorsi di PeekabooBridge
    - Scegliere tra PeekabooBridge, Codex Computer Use e cua-driver MCP
summary: Integrazione di PeekabooBridge per l'automazione dell'interfaccia utente di macOS
title: Bridge Peekaboo
x-i18n:
    generated_at: "2026-07-16T14:40:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 24d4187b2f5c5f11f44a24e25b350adaa3b068f24dce640ec695d52eb61f8e9a
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw può ospitare **PeekabooBridge** come broker locale di automazione dell'interfaccia utente sensibile alle autorizzazioni (`PeekabooBridgeHostCoordinator`, basato sul pacchetto Swift `steipete/Peekaboo`). Ciò consente alla CLI `peekaboo` di gestire l'automazione dell'interfaccia utente riutilizzando le autorizzazioni TCC dell'app macOS.

## Che cos'è (e che cosa non è)

- **Host**: OpenClaw.app può fungere da host PeekabooBridge.
- **Client**: la CLI `peekaboo` (non esiste un'interfaccia `openclaw ui ...` separata).
- **Interfaccia utente**: le sovrapposizioni visive rimangono in Peekaboo.app; OpenClaw è un host broker leggero.

## Relazione con gli altri percorsi di controllo del desktop

OpenClaw dispone di quattro percorsi di controllo del desktop che rimangono intenzionalmente separati:

- **Host PeekabooBridge**: OpenClaw.app ospita il socket PeekabooBridge locale. La CLI `peekaboo` è il client e utilizza le autorizzazioni macOS di OpenClaw.app per acquisizioni dello schermo, clic, menu, finestre di dialogo, azioni sul Dock e gestione delle finestre.
- **Uso del computer gestito dall'agente (`computer.act`)**: lo strumento `computer` integrato nell'agente del Gateway acquisisce schermate tramite `screen.snapshot` e controlla il puntatore e la tastiera mediante il pericoloso comando Node `computer.act`. Un Node macOS esegue `computer.act` all'interno del processo utilizzando i servizi di automazione Peekaboo incorporati esposti da questo bridge e primitive CoreGraphics circoscritte, senza passare per il socket PeekabooBridge o la CLI `peekaboo`. Consultare [Uso del computer](/it/nodes/computer-use).
- **Codex Computer Use**: il Plugin `codex` incluso verifica e può installare il Plugin MCP `computer-use` di Codex (`extensions/codex/src/app-server/computer-use.ts`), consentendo poi a Codex di gestire le chiamate native agli strumenti di controllo del desktop durante i turni in modalità Codex. OpenClaw non inoltra queste azioni tramite PeekabooBridge.
- **MCP `cua-driver` diretto**: OpenClaw può registrare il server `cua-driver mcp` upstream di TryCua come un normale server MCP, fornendo agli agenti gli schemi del driver CUA e il relativo flusso di lavoro basato su pid/finestra/indice degli elementi, senza instradamento tramite il marketplace Codex o il socket PeekabooBridge.

Utilizzare Peekaboo per l'ampia gamma di automazioni macOS tramite l'host bridge di OpenClaw.app sensibile alle autorizzazioni. Utilizzare l'uso del computer gestito dall'agente quando l'agente del Gateway deve visualizzare e controllare il desktop tramite un comando Node `computer.act` uniforme che può essere gestito da qualsiasi modello di visione. Utilizzare Codex Computer Use quando un agente in modalità Codex deve affidarsi al Plugin nativo di Codex. Utilizzare direttamente `cua-driver mcp` per esporre il driver CUA a qualsiasi runtime gestito da OpenClaw come un normale server MCP.

## Abilitare il bridge

Nell'app macOS: **Settings -> Enable Peekaboo Bridge**. L'opzione richiede che **Allow Computer Control** sia attivo, poiché entrambi concedono l'automazione locale dell'interfaccia utente; quando Computer Control è disattivato, l'opzione è disabilitata e l'host non viene eseguito. Per gestire Peekaboo senza Computer Control, eseguire invece l'app Mac di Peekaboo come host.

Quando è abilitato (e Computer Control è attivo), OpenClaw avvia un server socket UNIX locale in `~/Library/Application Support/OpenClaw/<socket-name>`. Se è disabilitato, l'host si arresta e `peekaboo` passa agli altri host disponibili. Il coordinatore mantiene inoltre collegamenti simbolici legacy ai socket (`clawdbot`, `clawdis`, `moltbot` in Application Support) che puntano al socket corrente per le installazioni meno recenti di `peekaboo`.

## Ordine di rilevamento dei client

I client Peekaboo in genere provano gli host nel seguente ordine:

1. Peekaboo.app (esperienza utente completa)
2. Claude.app (se installata)
3. OpenClaw.app (broker leggero)

Utilizzare `peekaboo bridge status --verbose` per verificare quale host è attivo e quale percorso del socket è in uso. Per eseguire l'override:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Sicurezza e autorizzazioni

- Il bridge convalida le **firme del codice del chiamante**; viene applicato un elenco consentito di TeamID (il TeamID dell'host Peekaboo più il TeamID dell'app in esecuzione).
- Per Accessibilità, preferire l'identità firmata del bridge o dell'app rispetto a un runtime generico `node`. La concessione dell'Accessibilità a `node` consente a qualsiasi pacchetto avviato da quell'eseguibile Node di ereditare l'accesso all'automazione dell'interfaccia grafica; consultare [Autorizzazioni macOS](/it/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- Le richieste scadono dopo 10 secondi (`requestTimeoutSec: 10`).
- Se mancano le autorizzazioni necessarie, il bridge restituisce un messaggio di errore chiaro anziché avviare System Settings.

## Comportamento delle istantanee (automazione)

Le istantanee vengono archiviate in memoria con una finestra di validità di 10 minuti e un limite di 50 istantanee (`InMemorySnapshotManager`); gli artefatti non vengono eliminati durante la pulizia. Se è necessaria una conservazione più lunga, eseguire una nuova acquisizione dal client.

## Risoluzione dei problemi

- Se `peekaboo` segnala "il client bridge non è autorizzato", verificare che il client sia firmato correttamente oppure eseguire l'host con `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` esclusivamente in modalità **debug**.
- Se non viene trovato alcun host, aprire una delle app host (Peekaboo.app o OpenClaw.app) e verificare che le autorizzazioni siano state concesse.

## Correlati

- [App macOS](/it/platforms/macos)
- [Autorizzazioni macOS](/it/platforms/mac/permissions)
