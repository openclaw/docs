---
read_when:
    - Ospitare PeekabooBridge in OpenClaw.app
    - Integrare Peekaboo tramite Swift Package Manager
    - Modificare il protocollo/i percorsi di PeekabooBridge
summary: Integrazione PeekabooBridge per l'automazione della UI su macOS
title: Peekaboo Bridge
x-i18n:
    generated_at: "2026-04-05T13:58:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30961eb502eecd23c017b58b834bd8cb00cab8b17302617d541afdace3ad8dba
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

# Peekaboo Bridge (automazione UI su macOS)

OpenClaw può ospitare **PeekabooBridge** come broker locale per l'automazione della UI con gestione delle autorizzazioni. Questo consente alla CLI `peekaboo` di controllare l'automazione della UI riutilizzando le autorizzazioni TCC dell'app macOS.

## Che cos'è (e cosa non è)

- **Host**: OpenClaw.app può fungere da host PeekabooBridge.
- **Client**: usa la CLI `peekaboo` (nessuna superficie separata `openclaw ui ...`).
- **UI**: gli overlay visivi restano in Peekaboo.app; OpenClaw è un host broker sottile.

## Abilitare il bridge

Nell'app macOS:

- Impostazioni → **Abilita Peekaboo Bridge**

Quando è abilitato, OpenClaw avvia un server locale su socket UNIX. Se è disabilitato, l'host
viene arrestato e `peekaboo` userà come fallback altri host disponibili.

## Ordine di individuazione del client

I client Peekaboo in genere provano gli host in questo ordine:

1. Peekaboo.app (esperienza utente completa)
2. Claude.app (se installata)
3. OpenClaw.app (broker sottile)

Usa `peekaboo bridge status --verbose` per vedere quale host è attivo e quale
percorso del socket è in uso. Puoi sovrascriverlo con:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Sicurezza e autorizzazioni

- Il bridge convalida le **firme del codice del chiamante**; viene applicata una allowlist di TeamID
  (TeamID dell'host Peekaboo + TeamID dell'app OpenClaw).
- Le richieste vanno in timeout dopo circa 10 secondi.
- Se mancano le autorizzazioni richieste, il bridge restituisce un messaggio di errore chiaro
  invece di aprire Impostazioni di Sistema.

## Comportamento degli snapshot (automazione)

Gli snapshot vengono memorizzati in memoria e scadono automaticamente dopo una breve finestra.
Se ti serve una conservazione più lunga, acquisiscili di nuovo dal client.

## Risoluzione dei problemi

- Se `peekaboo` segnala “bridge client is not authorized”, assicurati che il client sia
  firmato correttamente oppure esegui l'host con `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  **solo** in modalità di debug.
- Se non viene trovato alcun host, apri una delle app host (Peekaboo.app o OpenClaw.app)
  e conferma che le autorizzazioni siano state concesse.
