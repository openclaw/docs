---
read_when:
    - Hosting di PeekabooBridge in OpenClaw.app
    - Integrazione di Peekaboo tramite Swift Package Manager
    - Modifica del protocollo/dei percorsi di PeekabooBridge
    - Decidere tra PeekabooBridge, Codex Computer Use e cua-driver MCP
summary: Integrazione di PeekabooBridge per l’automazione dell’interfaccia utente su macOS
title: Ponte cucù
x-i18n:
    generated_at: "2026-06-27T17:45:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2343f90e500664b302236a6dabadfe64a24cedd13e57b4e234e70d4fad640c21
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw può ospitare **PeekabooBridge** come broker locale di automazione dell'interfaccia utente consapevole delle autorizzazioni. Questo consente alla CLI `peekaboo` di pilotare l'automazione dell'interfaccia utente riutilizzando le autorizzazioni TCC dell'app macOS.

## Che cos'è (e che cosa non è)

- **Host**: OpenClaw.app può agire da host PeekabooBridge.
- **Client**: usa la CLI `peekaboo` (nessuna superficie `openclaw ui ...` separata).
- **UI**: gli overlay visivi restano in Peekaboo.app; OpenClaw è un host broker leggero.

## Relazione con l'uso del computer

OpenClaw ha tre percorsi di controllo del desktop, e restano intenzionalmente separati:

- **Host PeekabooBridge**: OpenClaw.app può ospitare il socket PeekabooBridge locale. La CLI `peekaboo` resta il client e usa le autorizzazioni macOS di OpenClaw.app per primitive di automazione Peekaboo come screenshot, clic, menu, finestre di dialogo, azioni Dock e gestione delle finestre.
- **Uso del computer Codex**: il plugin `codex` incluso prepara il server app Codex, verifica che il server MCP `computer-use` di Codex sia disponibile e poi lascia che Codex possieda le chiamate agli strumenti nativi di controllo del desktop durante i turni in modalità Codex. OpenClaw non inoltra quelle azioni tramite PeekabooBridge.
- **MCP diretto `cua-driver`**: OpenClaw può registrare il server upstream `cua-driver mcp` di TryCua come normale server MCP. Questo fornisce agli agenti gli schemi propri del driver CUA e il flusso di lavoro pid/finestra/indice-elemento senza passare dal marketplace Codex o dal socket PeekabooBridge.

Usa Peekaboo quando vuoi l'ampia superficie di automazione macOS e l'host bridge consapevole delle autorizzazioni di OpenClaw.app. Usa l'uso del computer Codex quando un agente in modalità Codex deve basarsi sul plugin nativo di uso del computer di Codex. Usa `cua-driver mcp` diretto quando vuoi esporre il driver CUA a qualsiasi runtime gestito da OpenClaw come normale server MCP.

## Abilitare il bridge

Nell'app macOS:

- Impostazioni → **Abilita Peekaboo Bridge**

Quando è abilitato, OpenClaw avvia un server socket UNIX locale. Se è disabilitato, l'host viene arrestato e `peekaboo` userà come fallback altri host disponibili.

## Ordine di rilevamento del client

I client Peekaboo in genere provano gli host in questo ordine:

1. Peekaboo.app (UX completa)
2. Claude.app (se installata)
3. OpenClaw.app (broker leggero)

Usa `peekaboo bridge status --verbose` per vedere quale host è attivo e quale percorso socket è in uso. Puoi sovrascriverlo con:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Sicurezza e autorizzazioni

- Il bridge convalida le **firme del codice del chiamante**; viene applicata una allowlist di TeamID (TeamID dell'host Peekaboo + TeamID dell'app OpenClaw).
- Preferisci l'identità firmata del bridge/app rispetto a un runtime `node` generico per Accessibilità. Concedere Accessibilità a `node` consente a qualsiasi pacchetto avviato da quell'eseguibile Node di ereditare l'accesso all'automazione della GUI; vedi [autorizzazioni macOS](/it/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- Le richieste scadono dopo circa 10 secondi.
- Se mancano autorizzazioni richieste, il bridge restituisce un messaggio di errore chiaro invece di avviare Impostazioni di Sistema.

## Comportamento degli snapshot (automazione)

Gli snapshot vengono archiviati in memoria e scadono automaticamente dopo una breve finestra temporale. Se hai bisogno di conservarli più a lungo, acquisiscili di nuovo dal client.

## Risoluzione dei problemi

- Se `peekaboo` segnala "il client bridge non è autorizzato", assicurati che il client sia firmato correttamente oppure esegui l'host con `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` solo in modalità **debug**.
- Se non viene trovato alcun host, apri una delle app host (Peekaboo.app o OpenClaw.app) e conferma che le autorizzazioni siano state concesse.

## Correlati

- [app macOS](/it/platforms/macos)
- [autorizzazioni macOS](/it/platforms/mac/permissions)
