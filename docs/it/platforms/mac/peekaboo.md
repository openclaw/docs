---
read_when:
    - Ospitare PeekabooBridge in OpenClaw.app
    - Integrazione di Peekaboo tramite Swift Package Manager
    - Modifica del protocollo/dei percorsi di PeekabooBridge
    - Scegliere tra PeekabooBridge, Codex Computer Use e cua-driver MCP
summary: Integrazione di PeekabooBridge per l'automazione dell'interfaccia utente di macOS
title: Ponte Peekaboo
x-i18n:
    generated_at: "2026-05-06T09:00:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 724bc6f29b991eb824df01d2b23e87b5d5cf32eb5ebaa0cbbc321dd8fca53c9e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw può ospitare **PeekabooBridge** come broker locale di automazione dell'interfaccia utente, consapevole dei permessi. Questo permette alla CLI `peekaboo` di pilotare l'automazione dell'interfaccia utente riutilizzando i permessi TCC dell'app macOS.

## Che cos'è (e che cosa non è)

- **Host**: OpenClaw.app può fungere da host PeekabooBridge.
- **Client**: usa la CLI `peekaboo` (nessuna superficie `openclaw ui ...` separata).
- **UI**: gli overlay visivi restano in Peekaboo.app; OpenClaw è un host broker sottile.

## Relazione con Computer Use

OpenClaw ha tre percorsi di controllo desktop, e restano intenzionalmente separati:

- **Host PeekabooBridge**: OpenClaw.app può ospitare il socket locale PeekabooBridge.
  La CLI `peekaboo` resta il client e usa i permessi macOS di OpenClaw.app
  per le primitive di automazione Peekaboo come screenshot, clic,
  menu, finestre di dialogo, azioni del Dock e gestione delle finestre.
- **Codex Computer Use**: il Plugin `codex` incluso prepara il server dell'app Codex,
  verifica che il server MCP `computer-use` di Codex sia disponibile, e quindi consente
  a Codex di possedere le chiamate agli strumenti nativi di controllo desktop durante i turni in modalità Codex. OpenClaw
  non inoltra tali azioni tramite PeekabooBridge.
- **MCP `cua-driver` diretto**: OpenClaw può registrare il server
  `cua-driver mcp` upstream di TryCua come normale server MCP. Questo fornisce agli agenti gli schemi propri del driver CUA e il flusso di lavoro pid/finestra/indice-elemento senza instradare
  tramite il marketplace Codex o il socket PeekabooBridge.

Usa Peekaboo quando vuoi l'ampia superficie di automazione macOS e l'host bridge di OpenClaw.app
consapevole dei permessi. Usa Codex Computer Use quando un agente in modalità Codex
deve affidarsi al Plugin nativo di Codex per computer-use. Usa `cua-driver mcp` diretto
quando vuoi esporre il driver CUA a qualsiasi runtime gestito da OpenClaw come normale
server MCP.

## Abilitare il bridge

Nell'app macOS:

- Impostazioni → **Abilita Peekaboo Bridge**

Quando è abilitato, OpenClaw avvia un server socket UNIX locale. Se è disabilitato, l'host
viene arrestato e `peekaboo` ripiegherà su altri host disponibili.

## Ordine di rilevamento dei client

I client Peekaboo in genere provano gli host in questo ordine:

1. Peekaboo.app (UX completa)
2. Claude.app (se installata)
3. OpenClaw.app (broker sottile)

Usa `peekaboo bridge status --verbose` per vedere quale host è attivo e quale
percorso del socket è in uso. Puoi eseguire l'override con:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Sicurezza e permessi

- Il bridge convalida le **firme del codice del chiamante**; viene applicata una allowlist di TeamID
  (TeamID dell'host Peekaboo + TeamID dell'app OpenClaw).
- Le richieste scadono dopo circa 10 secondi.
- Se mancano i permessi richiesti, il bridge restituisce un messaggio di errore chiaro
  invece di avviare Impostazioni di Sistema.

## Comportamento degli snapshot (automazione)

Gli snapshot sono archiviati in memoria e scadono automaticamente dopo una breve finestra.
Se hai bisogno di una conservazione più lunga, acquisiscili di nuovo dal client.

## Risoluzione dei problemi

- Se `peekaboo` segnala "bridge client is not authorized", assicurati che il client sia
  firmato correttamente oppure esegui l'host con `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  solo in modalità **debug**.
- Se non vengono trovati host, apri una delle app host (Peekaboo.app o OpenClaw.app)
  e conferma che i permessi siano concessi.

## Correlati

- [app macOS](/it/platforms/macos)
- [permessi macOS](/it/platforms/mac/permissions)
