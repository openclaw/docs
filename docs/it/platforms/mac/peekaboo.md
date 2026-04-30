---
read_when:
    - Ospitare PeekabooBridge in OpenClaw.app
    - Integrazione di Peekaboo tramite Swift Package Manager
    - Modifica del protocollo/dei percorsi di PeekabooBridge
    - Scegliere tra PeekabooBridge, Codex Computer Use e cua-driver MCP
summary: Integrazione di PeekabooBridge per l'automazione dell'interfaccia utente di macOS
title: Ponte Peekaboo
x-i18n:
    generated_at: "2026-04-30T09:01:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92effdd6cfe4002fff2b8cd1092999f837e93694acf110eaebd30648b0a6946e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw può ospitare **PeekabooBridge** come broker locale di automazione UI consapevole delle autorizzazioni. Questo consente alla CLI `peekaboo` di controllare l'automazione UI riutilizzando le autorizzazioni TCC dell'app macOS.

## Cos'è (e cosa non è)

- **Host**: OpenClaw.app può agire da host PeekabooBridge.
- **Client**: usa la CLI `peekaboo` (nessuna superficie `openclaw ui ...` separata).
- **UI**: gli overlay visivi restano in Peekaboo.app; OpenClaw è un sottile host broker.

## Relazione con Computer Use

OpenClaw dispone di tre percorsi di controllo desktop, che restano intenzionalmente separati:

- **Host PeekabooBridge**: OpenClaw.app può ospitare il socket PeekabooBridge locale. La CLI `peekaboo` resta il client e usa le autorizzazioni macOS di OpenClaw.app per le primitive di automazione Peekaboo, come screenshot, clic, menu, finestre di dialogo, azioni sul Dock e gestione delle finestre.
- **Codex Computer Use**: il plugin `codex` incluso prepara Codex app-server, verifica che il server MCP `computer-use` di Codex sia disponibile e poi consente a Codex di possedere le chiamate agli strumenti di controllo desktop nativi durante i turni in modalità Codex. OpenClaw non inoltra queste azioni tramite PeekabooBridge.
- **MCP `cua-driver` diretto**: OpenClaw può registrare il server upstream `cua-driver mcp` di TryCua come normale server MCP. Questo fornisce agli agenti gli schemi propri del driver CUA e il flusso di lavoro pid/finestra/indice-elemento senza passare dal marketplace Codex o dal socket PeekabooBridge.

Usa Peekaboo quando vuoi l'ampia superficie di automazione macOS e l'host bridge consapevole delle autorizzazioni di OpenClaw.app. Usa Codex Computer Use quando un agente in modalità Codex deve affidarsi al plugin nativo computer-use di Codex. Usa `cua-driver mcp` diretto quando vuoi esporre il driver CUA a qualsiasi runtime gestito da OpenClaw come normale server MCP.

## Abilita il bridge

Nell'app macOS:

- Impostazioni → **Abilita Peekaboo Bridge**

Quando è abilitato, OpenClaw avvia un server socket UNIX locale. Se è disabilitato, l'host viene arrestato e `peekaboo` ripiegherà su altri host disponibili.

## Ordine di scoperta del client

I client Peekaboo in genere provano gli host in questo ordine:

1. Peekaboo.app (UX completa)
2. Claude.app (se installata)
3. OpenClaw.app (broker sottile)

Usa `peekaboo bridge status --verbose` per vedere quale host è attivo e quale percorso del socket è in uso. Puoi sovrascriverlo con:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Sicurezza e autorizzazioni

- Il bridge valida le **firme del codice del chiamante**; viene applicata un'allowlist di TeamID (TeamID dell'host Peekaboo + TeamID dell'app OpenClaw).
- Le richieste scadono dopo circa 10 secondi.
- Se mancano le autorizzazioni richieste, il bridge restituisce un messaggio di errore chiaro invece di avviare Impostazioni di Sistema.

## Comportamento degli snapshot (automazione)

Gli snapshot sono archiviati in memoria e scadono automaticamente dopo una breve finestra temporale. Se hai bisogno di una conservazione più lunga, acquisiscili di nuovo dal client.

## Risoluzione dei problemi

- Se `peekaboo` segnala “il client bridge non è autorizzato”, assicurati che il client sia firmato correttamente oppure esegui l'host con `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` solo in modalità **debug**.
- Se non viene trovato alcun host, apri una delle app host (Peekaboo.app o OpenClaw.app) e verifica che le autorizzazioni siano concesse.

## Correlati

- [app macOS](/it/platforms/macos)
- [autorizzazioni macOS](/it/platforms/mac/permissions)
