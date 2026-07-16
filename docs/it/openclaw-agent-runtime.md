---
read_when:
    - Lavorare sul codice o sui test del runtime degli agenti OpenClaw
    - Esecuzione dei flussi di lint, controllo dei tipi e test live del runtime dell'agente
summary: 'Flusso di lavoro per sviluppatori per il runtime degli agenti OpenClaw: compilazione, test e convalida in ambiente reale'
title: Flusso di lavoro del runtime dell’agente OpenClaw
x-i18n:
    generated_at: "2026-07-16T14:32:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 044f05779bef4ad18478081ba44d84356723c8a0be764440aa9d2b976d167324
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

Flusso di lavoro per sviluppatori per il runtime dell'agente (`src/agents/`) nel repository OpenClaw.

## Controllo dei tipi e linting

- Verifica locale predefinita: `pnpm check` (controllo dei tipi, linting, controlli delle policy)
- Verifica della build: `pnpm build` quando la modifica può influire sull'output della build, sulla creazione dei pacchetti o sui confini del caricamento differito/dei moduli
- Verifica pre-push completa: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`

## Esecuzione dei test del runtime dell'agente

Eseguire le suite di test unitari del runtime dell'agente:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

Il primo glob include anche le suite `agent-tools*`, `agent-settings` e
`agent-tool-definition-adapter*`.

I test live sono esclusi dalla configurazione dei test unitari; eseguirli tramite il
wrapper live (imposta `OPENCLAW_LIVE_TEST=1` e richiede le credenziali del provider):

```bash
pnpm test:live src/agents/embedded-agent-runner-extraparams.live.test.ts
```

## Test manuali

- Eseguire il Gateway in modalità di sviluppo (ignora le connessioni ai canali tramite `OPENCLAW_SKIP_CHANNELS=1`): `pnpm gateway:dev`
- Attivare un turno dell'agente tramite il Gateway: `pnpm openclaw agent --message "Hello" --thinking low`
- Utilizzare la TUI per il debug interattivo: `pnpm tui`

Per il comportamento delle chiamate agli strumenti, richiedere un'azione `read` o `exec` per poter osservare
lo streaming degli strumenti e la gestione del payload.

## Ripristino completo

Lo stato risiede nella directory di stato di OpenClaw: `~/.openclaw` per impostazione predefinita oppure
`$OPENCLAW_STATE_DIR`, se impostata. Percorsi relativi a tale directory:

| Percorso                                       | Contenuto                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `openclaw.json`                                | Configurazione                                                     |
| `state/openclaw.sqlite`                        | Database dello stato condiviso del runtime                         |
| `agents/<agentId>/agent/openclaw-agent.sqlite` | Profili di autenticazione del modello per agente (chiavi API + OAuth) e stato del runtime |
| `credentials/`                                 | Credenziali di provider/canali esterne all'archivio dei profili di autenticazione |
| `agents/<agentId>/sessions/`                   | Cronologia delle trascrizioni e origini per la migrazione delle sessioni legacy |
| `sessions/`                                    | Archivio legacy delle sessioni per agente singolo (solo vecchie installazioni) |
| `workspace/`                                   | Spazio di lavoro predefinito dell'agente (gli agenti aggiuntivi usano `workspace-<agentId>`)   |

Eliminare questi percorsi per un ripristino completo. Ripristini più circoscritti:

- Solo sessioni: non eliminare `agents/<agentId>/agent/openclaw-agent.sqlite`; le righe delle sessioni risiedono al suo interno insieme agli altri stati per agente. Utilizzare `/new` o `/reset` per avviare una nuova sessione per una chat e `openclaw sessions cleanup` per la manutenzione delle sessioni.
- Mantenere l'autenticazione: lasciare `agents/<agentId>/agent/openclaw-agent.sqlite` e `credentials/` al loro posto.

I file legacy `auth-profiles.json` non vengono più letti durante l'esecuzione;
`openclaw doctor --fix` li importa nell'archivio SQLite.

## Riferimenti

- [Test](/it/help/testing)
- [Guida introduttiva](/it/start/getting-started)

## Correlati

- [Architettura del runtime dell'agente OpenClaw](/it/agent-runtime-architecture)
