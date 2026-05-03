---
read_when:
    - Vuoi usare l'harness app-server Codex incluso
    - Ti servono esempi di configurazione dell'harness di Codex
    - Vuoi che le distribuzioni solo Codex falliscano invece di ripiegare su PI
summary: Esegui i turni dell’agente incorporato di OpenClaw tramite l’harness app-server di Codex incluso
title: Ambiente di esecuzione di Codex
x-i18n:
    generated_at: "2026-05-03T21:38:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5187e54e2dc94e511c0243227f741d3486669f595c2b15cf239b1c03ea466c8
    source_path: plugins/codex-harness.md
    workflow: 16
---

Il Plugin `codex` incluso consente a OpenClaw di eseguire turni di agente incorporati tramite l'app-server Codex invece dell'harness PI integrato.

Usalo quando vuoi che Codex possieda la sessione agente di basso livello: individuazione dei modelli, ripresa nativa dei thread, Compaction nativa ed esecuzione tramite app-server. OpenClaw continua a possedere canali di chat, file di sessione, selezione del modello, strumenti, approvazioni, consegna dei media e il mirror visibile della trascrizione.

Quando un turno di chat sorgente viene eseguito tramite l'harness Codex, le risposte visibili usano per impostazione predefinita lo strumento `message` di OpenClaw se la distribuzione non ha configurato esplicitamente `messages.visibleReplies`. L'agente può comunque concludere privatamente il proprio turno Codex; pubblica nel canale solo quando chiama `message(action="send")`. Imposta `messages.visibleReplies: "automatic"` per mantenere le risposte finali delle chat dirette nel percorso legacy di consegna automatica.

Anche i turni Heartbeat di Codex ricevono per impostazione predefinita lo strumento `heartbeat_respond`, così l'agente può registrare se il risveglio deve restare silenzioso o notificare, senza codificare quel flusso di controllo nel testo finale.

La guida all'iniziativa specifica per Heartbeat viene inviata come istruzione sviluppatore in modalità collaborazione Codex nel turno Heartbeat stesso. I turni di chat ordinari ripristinano invece la modalità Codex Default, senza portare la filosofia Heartbeat nel normale prompt di runtime.

Se stai cercando di orientarti, inizia da [runtime degli agenti](/it/concepts/agent-runtimes). In breve: `openai/gpt-5.5` è il riferimento del modello, `codex` è il runtime, e Telegram, Discord, Slack o un altro canale rimane la superficie di comunicazione.

## Configurazione rapida

La maggior parte degli utenti che vuole "Codex in OpenClaw" vuole questo percorso: accedere con un abbonamento ChatGPT/Codex, quindi eseguire i turni di agente incorporati tramite il runtime app-server nativo di Codex. Il riferimento del modello resta comunque canonico come `openai/gpt-*`; l'autenticazione dell'abbonamento proviene dall'account/profilo Codex, non da un prefisso di modello `openai-codex/*`.

Prima accedi con Codex OAuth, se non lo hai già fatto:

```bash
openclaw models auth login --provider openai-codex
```

Poi abilita il Plugin `codex` incluso e forza il runtime Codex:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Se la tua configurazione usa `plugins.allow`, includi anche `codex` lì:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Non usare `openai-codex/gpt-*` quando intendi il runtime Codex nativo. Quel prefisso è il percorso esplicito "Codex OAuth tramite PI". Le modifiche alla configurazione si applicano alle sessioni nuove o reimpostate; le sessioni esistenti mantengono il runtime registrato.

## Cosa cambia questo Plugin

Il Plugin `codex` incluso fornisce diverse capacità separate:

| Capacità                          | Come la usi                                         | Cosa fa                                                                      |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime incorporato nativo        | `agentRuntime.id: "codex"`                          | Esegue i turni di agente incorporati OpenClaw tramite app-server Codex.       |
| Comandi nativi di controllo chat  | `/codex bind`, `/codex resume`, `/codex steer`, ... | Associa e controlla thread app-server Codex da una conversazione di messaggistica. |
| Provider/catalogo app-server Codex | internals `codex`, esposti tramite l'harness        | Consente al runtime di individuare e convalidare i modelli app-server.        |
| Percorso di comprensione media Codex | percorsi di compatibilità dei modelli immagine `codex/*` | Esegue turni app-server Codex limitati per i modelli di comprensione immagini supportati. |
| Relay hook nativo                 | Hook Plugin intorno agli eventi nativi Codex        | Consente a OpenClaw di osservare/bloccare eventi di strumenti/finalizzazione nativi Codex supportati. |

Abilitare il Plugin rende disponibili queste capacità. Non:

- inizia a usare Codex per ogni modello OpenAI
- converte i riferimenti di modello `openai-codex/*` nel runtime nativo
- rende ACP/acpx il percorso Codex predefinito
- commuta a caldo sessioni esistenti che hanno già registrato un runtime PI
- sostituisce consegna dei canali OpenClaw, file di sessione, archiviazione dei profili di autenticazione o instradamento dei messaggi

Lo stesso Plugin possiede anche la superficie nativa dei comandi di controllo chat `/codex`. Se il Plugin è abilitato e l'utente chiede di associare, riprendere, orientare, fermare o ispezionare thread Codex dalla chat, gli agenti dovrebbero preferire `/codex ...` rispetto ad ACP. ACP rimane il fallback esplicito quando l'utente chiede ACP/acpx o sta testando l'adattatore ACP Codex.

I turni Codex nativi mantengono gli hook Plugin di OpenClaw come livello pubblico di compatibilità. Questi sono hook OpenClaw in-process, non hook di comando `hooks.json` di Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` per i record di trascrizione replicati
- `before_agent_finalize` tramite relay Codex `Stop`
- `agent_end`

I Plugin possono anche registrare middleware dei risultati strumenti neutrale rispetto al runtime per riscrivere i risultati degli strumenti dinamici OpenClaw dopo che OpenClaw esegue lo strumento e prima che il risultato venga restituito a Codex. Questo è separato dall'hook Plugin pubblico `tool_result_persist`, che trasforma le scritture dei risultati strumenti nella trascrizione possedute da OpenClaw.

Per la semantica degli hook Plugin, vedi [hook Plugin](/it/plugins/hooks) e [comportamento delle guardie Plugin](/it/tools/plugin).

L'harness è disattivato per impostazione predefinita. Le nuove configurazioni dovrebbero mantenere i riferimenti dei modelli OpenAI canonici come `openai/gpt-*` e forzare esplicitamente `agentRuntime.id: "codex"` o `OPENCLAW_AGENT_RUNTIME=codex` quando vogliono l'esecuzione nativa tramite app-server. I riferimenti di modello legacy `codex/*` selezionano ancora automaticamente l'harness per compatibilità, ma i prefissi provider legacy supportati da runtime non sono mostrati come normali scelte di modello/provider.

Se il Plugin `codex` è abilitato ma il modello principale è ancora `openai-codex/*`, `openclaw doctor` avvisa invece di cambiare il percorso. È intenzionale: `openai-codex/*` rimane il percorso PI Codex OAuth/abbonamento, e l'esecuzione nativa tramite app-server resta una scelta esplicita di runtime.

## Mappa dei percorsi

Usa questa tabella prima di modificare la configurazione:

| Comportamento desiderato                         | Riferimento modello       | Configurazione runtime                 | Percorso auth/profilo         | Etichetta di stato prevista    |
| ------------------------------------------------ | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| Abbonamento ChatGPT/Codex con runtime Codex nativo | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth o account Codex  | `Runtime: OpenAI Codex`        |
| API OpenAI tramite normale runner OpenClaw       | `openai/gpt-*`             | omesso o `runtime: "pi"`               | Chiave API OpenAI            | `Runtime: OpenClaw Pi Default` |
| Abbonamento ChatGPT/Codex tramite PI             | `openai-codex/gpt-*`       | omesso o `runtime: "pi"`               | Provider OpenAI Codex OAuth  | `Runtime: OpenClaw Pi Default` |
| Provider misti con modalità automatica conservativa | riferimenti specifici del provider | `agentRuntime.id: "auto"`              | Per provider selezionato     | Dipende dal runtime selezionato |
| Sessione esplicita dell'adattatore ACP Codex     | dipende da prompt/modello ACP | `sessions_spawn` con `runtime: "acp"` | Autenticazione backend ACP   | Stato task/sessione ACP        |

La distinzione importante è provider rispetto a runtime:

- `openai-codex/*` risponde a "quale percorso provider/auth deve usare PI?"
- `agentRuntime.id: "codex"` risponde a "quale ciclo deve eseguire questo turno incorporato?"
- `/codex ...` risponde a "quale conversazione nativa Codex deve associare o controllare questa chat?"
- ACP risponde a "quale processo harness esterno deve avviare acpx?"

## Scegli il prefisso di modello corretto

I percorsi della famiglia OpenAI sono specifici per prefisso. Per la configurazione comune con abbonamento più runtime Codex nativo, usa `openai/*` con `agentRuntime.id: "codex"`. Usa `openai-codex/*` solo quando vuoi intenzionalmente Codex OAuth tramite PI:

| Riferimento modello                          | Percorso runtime                            | Usa quando                                                                 |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Provider OpenAI tramite plumbing OpenClaw/PI | Vuoi l'accesso diretto attuale all'API OpenAI Platform con `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth tramite OpenClaw/PI       | Vuoi l'autenticazione con abbonamento ChatGPT/Codex con il runner PI predefinito. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness app-server Codex                     | Vuoi l'autenticazione con abbonamento ChatGPT/Codex con esecuzione Codex nativa. |

GPT-5.5 può comparire sia sui percorsi con chiave API OpenAI diretta sia su quelli con abbonamento Codex quando il tuo account li espone. Usa `openai/gpt-5.5` con l'harness app-server Codex per il runtime Codex nativo, `openai-codex/gpt-5.5` per PI OAuth, oppure `openai/gpt-5.5` senza override del runtime Codex per il traffico con chiave API diretta.

I riferimenti legacy `codex/gpt-*` restano accettati come alias di compatibilità. La migrazione di compatibilità di Doctor riscrive i riferimenti legacy del runtime principale in riferimenti di modello canonici e registra separatamente la policy di runtime, mentre i riferimenti legacy solo di fallback restano invariati perché il runtime è configurato per l'intero contenitore agente. Le nuove configurazioni PI Codex OAuth dovrebbero usare `openai-codex/gpt-*`; le nuove configurazioni dell'harness app-server nativo dovrebbero usare `openai/gpt-*` più `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` segue la stessa distinzione di prefisso. Usa `openai-codex/gpt-*` quando la comprensione delle immagini deve passare dal percorso provider OpenAI Codex OAuth. Usa `codex/gpt-*` quando la comprensione delle immagini deve passare da un turno app-server Codex limitato. Il modello app-server Codex deve dichiarare il supporto per input immagine; i modelli Codex solo testo falliscono prima dell'avvio del turno media.

Usa `/status` per confermare l'harness effettivo per la sessione corrente. Se la selezione sorprende, abilita il logging di debug per il sottosistema `agents/harness` e ispeziona il record strutturato `agent harness selected` del Gateway. Include l'id dell'harness selezionato, il motivo della selezione, la policy runtime/fallback e, in modalità `auto`, il risultato del supporto di ciascun candidato Plugin.

### Cosa significano gli avvisi di doctor

`openclaw doctor` avvisa quando tutte queste condizioni sono vere:

- il Plugin `codex` incluso è abilitato o consentito
- il modello principale di un agente è `openai-codex/*`
- il runtime effettivo di quell'agente non è `codex`

Questo avviso esiste perché gli utenti spesso si aspettano che "Plugin Codex abilitato" implichi "runtime app-server Codex nativo". OpenClaw non fa questo salto. L'avviso significa:

- **Non è richiesta alcuna modifica** se intendevi ChatGPT/Codex OAuth tramite PI.
- Cambia il modello in `openai/<model>` e imposta `agentRuntime.id: "codex"` se intendevi l'esecuzione nativa tramite app-server.
- Le sessioni esistenti richiedono comunque `/new` o `/reset` dopo una modifica del runtime, perché i pin del runtime di sessione sono persistenti.

La selezione dell'harness non è un controllo di sessione live. Quando viene eseguito un turno incorporato, OpenClaw registra l'id dell'harness selezionato su quella sessione e continua a usarlo per i turni successivi nello stesso id di sessione. Modifica la configurazione `agentRuntime` o `OPENCLAW_AGENT_RUNTIME` quando vuoi che le sessioni future usino un altro harness; usa `/new` o `/reset` per avviare una nuova sessione prima di passare una conversazione esistente tra PI e Codex. Questo evita di riprodurre una trascrizione tramite due sistemi di sessione nativi incompatibili.

Le sessioni legacy create prima dei pin dell'harness vengono trattate come fissate a PI una volta che
hanno una cronologia della trascrizione. Usa `/new` o `/reset` per far aderire quella conversazione a
Codex dopo aver modificato la configurazione.

`/status` mostra il runtime effettivo del modello. L'harness PI predefinito appare come
`Runtime: OpenClaw Pi Default`, mentre l'harness app-server di Codex appare come
`Runtime: OpenAI Codex`.

## Requisiti

- OpenClaw con il plugin `codex` incluso disponibile.
- Codex app-server `0.125.0` o più recente. Il plugin incluso gestisce per impostazione predefinita un binario
  Codex app-server compatibile, quindi i comandi locali `codex` in `PATH` non
  influenzano il normale avvio dell'harness.
- Autenticazione Codex disponibile per il processo app-server o per il bridge di autenticazione Codex
  di OpenClaw. Gli avvii locali dell'app-server usano una home Codex gestita da OpenClaw per ciascun
  agente e un `HOME` figlio isolato, quindi per impostazione predefinita non leggono il tuo account
  personale `~/.codex`, Skills, plugins, configurazione, stato dei thread o Skills nativi
  `$HOME/.agents/skills`.

Il plugin blocca handshake app-server più vecchi o senza versione. Questo mantiene
OpenClaw sulla superficie di protocollo rispetto alla quale è stato testato.

Per i test smoke live e Docker, l'autenticazione di solito proviene dall'account Codex CLI
o da un profilo di autenticazione OpenClaw `openai-codex`. Gli avvii locali dell'app-server stdio possono
anche ripiegare su `CODEX_API_KEY` / `OPENAI_API_KEY` quando non è presente alcun account.

## File di bootstrap del workspace

Codex gestisce `AGENTS.md` autonomamente tramite il rilevamento nativo dei documenti di progetto. OpenClaw
non scrive file sintetici di documentazione di progetto Codex né dipende dai nomi file di fallback di Codex
per i file persona, perché i fallback di Codex si applicano solo quando
`AGENTS.md` manca.

Per la parità del workspace OpenClaw, l'harness Codex risolve gli altri file di bootstrap
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` e `MEMORY.md` quando presente) e li inoltra tramite le istruzioni di configurazione Codex
su `thread/start` e `thread/resume`. Questo mantiene visibile il contesto persona/profilo del workspace
di `SOUL.md` e file correlati senza duplicare `AGENTS.md`.

## Aggiungere Codex accanto ad altri modelli

Non impostare `agentRuntime.id: "codex"` globalmente se lo stesso agente deve poter passare liberamente
tra Codex e modelli di provider non Codex. Un runtime forzato si applica a ogni
turno incorporato per quell'agente o sessione. Se selezioni un modello Anthropic mentre
quel runtime è forzato, OpenClaw tenta comunque l'harness Codex e fallisce in modo chiuso
invece di instradare silenziosamente quel turno tramite PI.

Usa invece una di queste forme:

- Metti Codex su un agente dedicato con `agentRuntime.id: "codex"`.
- Mantieni l'agente predefinito su `agentRuntime.id: "auto"` e il fallback PI per il normale uso misto
  dei provider.
- Usa i riferimenti legacy `codex/*` solo per compatibilità. Le nuove configurazioni dovrebbero preferire
  `openai/*` più una policy esplicita di runtime Codex.

Per esempio, questo mantiene l'agente predefinito sulla normale selezione automatica e
aggiunge un agente Codex separato:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Con questa forma:

- L'agente `main` predefinito usa il normale percorso del provider e il fallback di compatibilità PI.
- L'agente `codex` usa l'harness app-server Codex.
- Se Codex manca o non è supportato per l'agente `codex`, il turno fallisce
  invece di usare silenziosamente PI.

## Instradamento dei comandi agente

Gli agenti dovrebbero instradare le richieste utente in base all'intento, non solo alla parola "Codex":

| L'utente chiede di...                                  | L'agente dovrebbe usare...                        |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Vincola questa chat a Codex"                          | `/codex bind`                                    |
| "Riprendi qui il thread Codex `<id>`"                  | `/codex resume <id>`                             |
| "Mostra i thread Codex"                                | `/codex threads`                                 |
| "Apri una segnalazione di supporto per una cattiva esecuzione Codex" | `/diagnostics [note]`                 |
| "Invia feedback Codex solo per questo thread allegato" | `/codex diagnostics [note]`                      |
| "Usa il mio abbonamento ChatGPT/Codex con il runtime Codex" | `openai/*` più `agentRuntime.id: "codex"`   |
| "Usa il mio abbonamento ChatGPT/Codex tramite PI"      | riferimenti modello `openai-codex/*`             |
| "Esegui Codex tramite ACP/acpx"                        | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Avvia Claude Code/Gemini/OpenCode/Cursor in un thread" | ACP/acpx, non `/codex` e non sub-agenti nativi  |

OpenClaw pubblicizza agli agenti la guida allo spawn ACP solo quando ACP è abilitato,
inoltrabile e supportato da un backend runtime caricato. Se ACP non è disponibile,
il prompt di sistema e le Skills del plugin non dovrebbero insegnare all'agente il
routing ACP.

## Distribuzioni solo Codex

Forza l'harness Codex quando devi dimostrare che ogni turno agente incorporato
usa Codex. I runtime plugin espliciti falliscono in modo chiuso e non vengono mai riprovati
silenziosamente tramite PI:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Override di ambiente:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Con Codex forzato, OpenClaw fallisce in anticipo se il plugin Codex è disabilitato, se
l'app-server è troppo vecchio o se l'app-server non può avviarsi.

## Codex per agente

Puoi rendere un agente solo Codex mentre l'agente predefinito mantiene la normale
selezione automatica:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Usa i normali comandi di sessione per cambiare agenti e modelli. `/new` crea una nuova
sessione OpenClaw e l'harness Codex crea o riprende il proprio thread app-server sidecar
secondo necessità. `/reset` cancella il binding della sessione OpenClaw per quel thread
e consente al turno successivo di risolvere di nuovo l'harness dalla configurazione corrente.

## Rilevamento modelli

Per impostazione predefinita, il plugin Codex chiede all'app-server i modelli disponibili. Se
il rilevamento fallisce o scade, usa un catalogo di fallback incluso per:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Puoi regolare il rilevamento in `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Disabilita il rilevamento quando vuoi che l'avvio eviti di interrogare Codex e resti sul
catalogo di fallback:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Connessione e policy dell'app-server

Per impostazione predefinita, il plugin avvia localmente il binario Codex gestito da OpenClaw con:

```bash
codex app-server --listen stdio://
```

Il binario gestito viene distribuito con il pacchetto del plugin `codex`. Questo mantiene la
versione dell'app-server legata al plugin incluso invece che a qualunque Codex CLI separata
risulti installata localmente. Imposta `appServer.command` solo quando
vuoi intenzionalmente eseguire un eseguibile diverso.

Per impostazione predefinita, OpenClaw avvia le sessioni locali dell'harness Codex in modalità YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Questa è la postura dell'operatore locale attendibile usata
per Heartbeat autonomi: Codex può usare strumenti shell e di rete senza
fermarsi su prompt di approvazione nativi a cui nessuno è presente per rispondere.

Per attivare approvazioni revisionate dal guardian di Codex, imposta `appServer.mode:
"guardian"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

La modalità Guardian usa il percorso di approvazione con revisione automatica nativo di Codex. Quando Codex chiede di
uscire dalla sandbox, scrivere fuori dal workspace o aggiungere permessi come l'accesso alla rete,
Codex instrada quella richiesta di approvazione al revisore nativo invece che a un
prompt umano. Il revisore applica il framework di rischio di Codex e approva o nega
la richiesta specifica. Usa Guardian quando vuoi più protezioni rispetto alla modalità YOLO
ma hai comunque bisogno che agenti non presidiati facciano progressi.

Il preset `guardian` si espande in `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"`.
I singoli campi di policy continuano a sovrascrivere `mode`, quindi le distribuzioni avanzate possono combinare
il preset con scelte esplicite. Il valore revisore più vecchio `guardian_subagent` è
ancora accettato come alias di compatibilità, ma le nuove configurazioni dovrebbero usare
`auto_review`.

Per un app-server già in esecuzione, usa il trasporto WebSocket:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Gli avvii dell'app-server stdio ereditano per impostazione predefinita l'ambiente di processo di OpenClaw,
ma OpenClaw possiede il bridge dell'account app-server Codex e imposta sia
`CODEX_HOME` sia `HOME` su directory per agente nello stato OpenClaw di quell'agente.
Il loader di Skills proprio di Codex legge `$CODEX_HOME/skills` e
`$HOME/.agents/skills`, quindi entrambi i valori sono isolati per gli avvii locali dell'app-server.
Questo mantiene Skills nativi Codex, plugins, configurazione, account e stato dei thread
limitati all'agente OpenClaw invece di lasciarli filtrare dalla home personale Codex CLI
dell'operatore.

I plugins OpenClaw e gli snapshot Skills OpenClaw continuano a fluire attraverso il registro plugin e il loader Skills propri
di OpenClaw. Gli asset personali Codex CLI no. Se hai
Skills o plugins Codex CLI utili che dovrebbero diventare parte di un agente OpenClaw,
inventariali esplicitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Il provider di migrazione Codex copia le Skills nel workspace dell'agente OpenClaw corrente.
Plugin nativi Codex, hook e file di configurazione vengono segnalati o archiviati
per revisione manuale invece di essere attivati automaticamente, perché possono
eseguire comandi, esporre server MCP o contenere credenziali.

L'autenticazione viene selezionata in questo ordine:

1. Un profilo esplicito di autenticazione OpenClaw Codex per l'agente.
2. L'account esistente dell'app-server nella home Codex di quell'agente.
3. Solo per avvii locali dell'app-server stdio, `CODEX_API_KEY`, poi
   `OPENAI_API_KEY`, quando non è presente alcun account app-server e l'autenticazione OpenAI è
   ancora richiesta.

Quando OpenClaw vede un profilo di autenticazione Codex in stile abbonamento ChatGPT, rimuove
`CODEX_API_KEY` e `OPENAI_API_KEY` dal processo figlio Codex generato. Questo
mantiene le chiavi API a livello Gateway disponibili per embeddings o modelli OpenAI diretti
senza far fatturare per errore i turni nativi Codex app-server tramite l'API.
I profili Codex espliciti con chiave API e il fallback locale con chiave env stdio usano il login dell'app-server
invece dell'env ereditato del processo figlio. Le connessioni app-server WebSocket
non ricevono il fallback con chiave API env del Gateway; usa un profilo di autenticazione esplicito o l'account
proprio dell'app-server remoto.

Se una distribuzione richiede ulteriore isolamento dell'ambiente, aggiungi quelle variabili a
`appServer.clearEnv`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` riguarda solo il processo figlio app-server Codex generato.

Gli strumenti dinamici Codex usano per impostazione predefinita il profilo `native-first`. In questa modalità,
OpenClaw non espone strumenti dinamici che duplicano le operazioni dell'area di lavoro native di Codex:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process` e
`update_plan`. Gli strumenti di integrazione OpenClaw come messaggistica, sessioni, media,
Cron, browser, nodi, Gateway, `heartbeat_respond` e `web_search` restano
disponibili.

Campi Plugin Codex di primo livello supportati:

| Campo                      | Predefinito      | Significato                                                                                   |
| -------------------------- | ---------------- | --------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Usa `"openclaw-compat"` per esporre l'intero set di strumenti dinamici OpenClaw a Codex app-server. |
| `codexDynamicToolsExclude` | `[]`             | Nomi aggiuntivi di strumenti dinamici OpenClaw da omettere dai turni di Codex app-server.      |

Campi `appServer` supportati:

| Campo               | Predefinito                             | Significato                                                                                                                                                                                                                          |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` avvia Codex; `"websocket"` si connette a `url`.                                                                                                                                                                            |
| `command`           | binario Codex gestito                    | Eseguibile per il trasporto stdio. Lascia non impostato per usare il binario gestito; impostalo solo per una sostituzione esplicita.                                                                                                  |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argomenti per il trasporto stdio.                                                                                                                                                                                                    |
| `url`               | non impostato                            | URL WebSocket dell'app-server.                                                                                                                                                                                                       |
| `authToken`         | non impostato                            | Token Bearer per il trasporto WebSocket.                                                                                                                                                                                             |
| `headers`           | `{}`                                     | Header WebSocket aggiuntivi.                                                                                                                                                                                                         |
| `clearEnv`          | `[]`                                     | Nomi aggiuntivi di variabili d'ambiente rimossi dal processo app-server stdio generato dopo che OpenClaw ha costruito l'ambiente ereditato. `CODEX_HOME` e `HOME` sono riservati all'isolamento Codex per agente di OpenClaw negli avvii locali. |
| `requestTimeoutMs`  | `60000`                                  | Timeout per le chiamate control-plane dell'app-server.                                                                                                                                                                               |
| `mode`              | `"yolo"`                                 | Preset per l'esecuzione YOLO o revisionata da guardian.                                                                                                                                                                              |
| `approvalPolicy`    | `"never"`                                | Criterio di approvazione nativo di Codex inviato ad avvio/ripresa/turno del thread.                                                                                                                                                  |
| `sandbox`           | `"danger-full-access"`                   | Modalità sandbox nativa di Codex inviata ad avvio/ripresa del thread.                                                                                                                                                                |
| `approvalsReviewer` | `"user"`                                 | Usa `"auto_review"` per consentire a Codex di revisionare le richieste di approvazione native. `guardian_subagent` resta un alias legacy.                                                                                            |
| `serviceTier`       | non impostato                            | Livello di servizio opzionale di Codex app-server: `"fast"`, `"flex"` o `null`. I valori legacy non validi vengono ignorati.                                                                                                         |

Le chiamate agli strumenti dinamici di proprietà di OpenClaw sono limitate indipendentemente da
`appServer.requestTimeoutMs`: ogni richiesta Codex `item/tool/call` deve ricevere
una risposta OpenClaw entro 30 secondi. Al timeout, OpenClaw interrompe il segnale dello strumento
dove supportato e restituisce a Codex una risposta di strumento dinamico non riuscita, così
il turno può continuare invece di lasciare la sessione in `processing`.

Dopo che OpenClaw risponde a una richiesta app-server con ambito al turno di Codex, l'harness
si aspetta anche che Codex completi il turno nativo con `turn/completed`. Se
l'app-server resta silenzioso per 60 secondi dopo tale risposta, OpenClaw tenta al meglio
di interrompere il turno Codex, registra un timeout diagnostico e libera la corsia della sessione
OpenClaw in modo che i messaggi chat successivi non restino in coda dietro un turno nativo obsoleto.

Le sostituzioni d'ambiente restano disponibili per i test locali:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` ignora il binario gestito quando
`appServer.command` non è impostato.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` è stato rimosso. Usa invece
`plugins.entries.codex.config.appServer.mode: "guardian"`, oppure
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` per test locali una tantum. La configurazione è
preferibile per distribuzioni ripetibili perché mantiene il comportamento del Plugin nello
stesso file revisionato del resto della configurazione dell'harness Codex.

## Uso del computer

Computer Use è trattato nella propria guida di configurazione:
[Codex Computer Use](/it/plugins/codex-computer-use).

In breve: OpenClaw non integra come vendor l'app di controllo desktop né esegue
azioni desktop direttamente. Prepara Codex app-server, verifica che il server MCP
`computer-use` sia disponibile e poi lascia che Codex gestisca le chiamate agli strumenti MCP nativi
durante i turni in modalità Codex.

Per l'accesso diretto al driver TryCua fuori dal flusso del marketplace Codex, registra
`cua-driver mcp` con `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Consulta [Codex Computer Use](/it/plugins/codex-computer-use) per la distinzione
tra Computer Use di proprietà di Codex e registrazione MCP diretta.

Configurazione minima:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

La configurazione può essere controllata o installata dalla superficie dei comandi:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computer Use è specifico di macOS e può richiedere autorizzazioni locali del sistema operativo prima che il
server MCP Codex possa controllare le app. Se `computerUse.enabled` è true e il server MCP
non è disponibile, i turni in modalità Codex falliscono prima dell'avvio del thread invece di
procedere silenziosamente senza gli strumenti nativi Computer Use. Consulta
[Codex Computer Use](/it/plugins/codex-computer-use) per le opzioni del marketplace,
i limiti del catalogo remoto, i motivi di stato e la risoluzione dei problemi.

Quando `computerUse.autoInstall` è true, OpenClaw può registrare il marketplace Codex Desktop standard
incluso da
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` se Codex
non ha ancora scoperto un marketplace locale. Usa `/new` o `/reset` dopo aver
modificato la configurazione del runtime o di Computer Use, così le sessioni esistenti non mantengono un vecchio
binding di thread PI o Codex.

## Ricette comuni

Codex locale con trasporto stdio predefinito:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Validazione dell'harness solo Codex:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Approvazioni Codex revisionate da guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

App-server remoto con header espliciti:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

Il cambio di modello resta controllato da OpenClaw. Quando una sessione OpenClaw è collegata
a un thread Codex esistente, il turno successivo invia di nuovo all'app-server
il modello OpenAI, il provider, il criterio di approvazione, la sandbox e il livello di servizio
attualmente selezionati. Passare da `openai/gpt-5.5` a `openai/gpt-5.2` mantiene il
binding del thread ma chiede a Codex di continuare con il nuovo modello selezionato.

## Comando Codex

Il Plugin incluso registra `/codex` come comando slash autorizzato. È
generico e funziona su qualsiasi canale che supporti i comandi di testo OpenClaw.

Forme comuni:

- `/codex status` mostra connettività live dell'app-server, modelli, account, limiti di frequenza, server MCP e Skills.
- `/codex models` elenca i modelli live del Codex app-server.
- `/codex threads [filter]` elenca i thread Codex recenti.
- `/codex resume <thread-id>` collega la sessione OpenClaw corrente a un thread Codex esistente.
- `/codex compact` chiede al Codex app-server di compattare il thread collegato.
- `/codex review` avvia la revisione nativa Codex per il thread collegato.
- `/codex diagnostics [note]` chiede conferma prima di inviare il feedback diagnostico Codex per il thread collegato.
- `/codex computer-use status` verifica il plugin Computer Use configurato e il server MCP.
- `/codex computer-use install` installa il plugin Computer Use configurato e ricarica i server MCP.
- `/codex account` mostra lo stato dell'account e dei limiti di frequenza.
- `/codex mcp` elenca lo stato dei server MCP del Codex app-server.
- `/codex skills` elenca le Skills del Codex app-server.

### Flusso di debug comune

Quando un agente basato su Codex fa qualcosa di inatteso in Telegram, Discord, Slack,
o in un altro canale, inizia dalla conversazione in cui si è verificato il problema:

1. Esegui `/diagnostics bad tool choice after image upload` o un'altra nota breve
   che descriva ciò che hai visto.
2. Approva una volta la richiesta di diagnostica. L'approvazione crea il file zip
   locale di diagnostica del Gateway e, poiché la sessione usa l'harness Codex,
   invia anche il bundle di feedback Codex pertinente ai server OpenAI.
3. Copia la risposta diagnostica completata nella segnalazione del bug o nel thread di supporto.
   Include il percorso del bundle locale, il riepilogo sulla privacy, gli ID sessione OpenClaw,
   gli ID thread Codex e una riga `Inspect locally` per ciascun thread Codex.
4. Se vuoi eseguire il debug della run personalmente, esegui il comando `Inspect locally`
   stampato in un terminale. Ha un aspetto simile a `codex resume <thread-id>` e apre il
   thread Codex nativo, così puoi ispezionare la conversazione, continuarla localmente,
   o chiedere a Codex perché ha scelto un particolare strumento o piano.

Usa `/codex diagnostics [note]` solo quando vuoi specificamente il caricamento del
feedback Codex per il thread attualmente collegato senza il bundle completo di diagnostica
del Gateway OpenClaw. Per la maggior parte delle segnalazioni di supporto, `/diagnostics [note]` è
il punto di partenza migliore perché collega lo stato locale del Gateway e gli ID thread Codex
in un'unica risposta. Vedi [Esportazione diagnostica](/it/gateway/diagnostics)
per il modello completo di privacy e il comportamento nelle chat di gruppo.

Il core OpenClaw espone anche `/diagnostics [note]`, solo per gli owner, come comando generale
di diagnostica del Gateway. Il suo prompt di approvazione mostra il preambolo sui dati sensibili,
collega a [Esportazione diagnostica](/it/gateway/diagnostics), e richiede
`openclaw gateway diagnostics export --json` tramite approvazione esplicita di exec
ogni volta. Non approvare la diagnostica con una regola allow-all. Dopo l'approvazione,
OpenClaw invia un report incollabile con il percorso del bundle locale e il riepilogo
del manifesto. Quando la sessione OpenClaw attiva usa l'harness Codex, quella
stessa approvazione autorizza anche l'invio dei bundle di feedback Codex pertinenti ai
server OpenAI. Il prompt di approvazione dice che il feedback Codex verrà inviato, ma
non elenca gli ID sessione o thread Codex prima dell'approvazione.

Se `/diagnostics` viene invocato da un owner in una chat di gruppo, OpenClaw mantiene pulito
il canale condiviso: il gruppo riceve solo un breve avviso, mentre il
preambolo diagnostico, i prompt di approvazione e gli ID sessione/thread Codex vengono inviati
all'owner tramite il percorso di approvazione privato. Se non esiste un percorso privato per l'owner,
OpenClaw rifiuta la richiesta del gruppo e chiede all'owner di eseguirla da un DM.

Il caricamento Codex approvato chiama `feedback/upload` del Codex app-server e chiede
all'app-server di includere i log per ciascun thread elencato e per i sottothread Codex generati
quando disponibili. Il caricamento passa attraverso il normale percorso di feedback di Codex verso i
server OpenAI; se il feedback Codex è disabilitato in quell'app-server, il comando restituisce
l'errore dell'app-server. La risposta diagnostica completata elenca i canali,
gli ID sessione OpenClaw, gli ID thread Codex e i comandi locali `codex resume <thread-id>`
per i thread inviati. Se rifiuti o ignori l'approvazione,
OpenClaw non stampa quegli ID Codex. Questo caricamento non sostituisce l'esportazione locale
di diagnostica del Gateway.

`/codex resume` scrive lo stesso file di binding sidecar che l'harness usa per
i turni normali. Al messaggio successivo, OpenClaw riprende quel thread Codex, passa il
modello OpenClaw attualmente selezionato all'app-server e mantiene abilitata la cronologia
estesa.

### Ispezionare un thread Codex dalla CLI

Il modo più rapido per capire una run Codex errata è spesso aprire direttamente il thread
Codex nativo:

```sh
codex resume <thread-id>
```

Usalo quando noti un bug in una conversazione di canale e vuoi ispezionare la
sessione Codex problematica, continuarla localmente, o chiedere a Codex perché ha fatto una
particolare scelta di strumento o di ragionamento. Il percorso più semplice di solito è eseguire
prima `/diagnostics [note]`: dopo averlo approvato, il report completato elenca
ciascun thread Codex e stampa un comando `Inspect locally`, per esempio
`codex resume <thread-id>`. Puoi copiare quel comando direttamente in un terminale.

Puoi anche ottenere un ID thread da `/codex binding` per la chat corrente o da
`/codex threads [filter]` per i thread recenti del Codex app-server, quindi eseguire lo stesso
comando `codex resume` nella tua shell.

La superficie dei comandi richiede Codex app-server `0.125.0` o successivo. I singoli
metodi di controllo vengono segnalati come `unsupported by this Codex app-server` se un
app-server futuro o personalizzato non espone quel metodo JSON-RPC.

## Confini degli hook

L'harness Codex ha tre livelli di hook:

| Livello                               | Owner                    | Scopo                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook plugin OpenClaw                  | OpenClaw                 | Compatibilità prodotto/plugin tra gli harness PI e Codex.           |
| Middleware di estensione Codex app-server | Plugin inclusi in OpenClaw | Comportamento adattatore per turno intorno agli strumenti dinamici OpenClaw. |
| Hook nativi Codex                     | Codex                    | Ciclo di vita Codex di basso livello e policy strumenti nativi dalla configurazione Codex. |

OpenClaw non usa file `hooks.json` Codex di progetto o globali per indirizzare
il comportamento dei plugin OpenClaw. Per il bridge supportato di strumenti nativi e permessi,
OpenClaw inietta configurazione Codex per thread per `PreToolUse`, `PostToolUse`,
`PermissionRequest` e `Stop`. Altri hook Codex come `SessionStart` e
`UserPromptSubmit` restano controlli a livello Codex; non sono esposti come
hook plugin OpenClaw nel contratto v1.

Per gli strumenti dinamici OpenClaw, OpenClaw esegue lo strumento dopo che Codex richiede la
chiamata, quindi OpenClaw attiva il comportamento plugin e middleware di cui è owner
nell'adattatore dell'harness. Per gli strumenti nativi Codex, Codex possiede il record canonico
dello strumento. OpenClaw può replicare eventi selezionati, ma non può riscrivere il thread
Codex nativo a meno che Codex non esponga quell'operazione tramite app-server o callback
di hook nativi.

Le proiezioni di Compaction e del ciclo di vita LLM provengono dalle notifiche del Codex app-server
e dallo stato dell'adattatore OpenClaw, non dai comandi hook nativi Codex.
Gli eventi `before_compaction`, `after_compaction`, `llm_input` e
`llm_output` di OpenClaw sono osservazioni a livello di adattatore, non acquisizioni byte per byte
della richiesta interna o dei payload di Compaction di Codex.

Le notifiche app-server Codex native `hook/started` e `hook/completed` vengono
proiettate come eventi agente `codex_app_server.hook` per traiettoria e debug.
Non invocano hook plugin OpenClaw.

## Contratto di supporto V1

La modalità Codex non è PI con una chiamata modello diversa sotto. Codex possiede una parte maggiore
del ciclo modello nativo, e OpenClaw adatta le proprie superfici plugin e sessione
intorno a quel confine.

Supportato in runtime Codex v1:

| Superficie                                    | Supporto                                | Perché                                                                                                                                                                                                |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ciclo modello OpenAI tramite Codex            | Supportato                              | Codex app-server possiede il turno OpenAI, la ripresa del thread nativo e la continuazione degli strumenti nativi.                                                                                    |
| Routing e consegna dei canali OpenClaw        | Supportato                              | Telegram, Discord, Slack, WhatsApp, iMessage e altri canali restano fuori dal runtime modello.                                                                                                        |
| Strumenti dinamici OpenClaw                   | Supportato                              | Codex chiede a OpenClaw di eseguire questi strumenti, quindi OpenClaw resta nel percorso di esecuzione.                                                                                               |
| Plugin di prompt e contesto                   | Supportato                              | OpenClaw crea overlay di prompt e proietta il contesto nel turno Codex prima di avviare o riprendere il thread.                                                                                       |
| Ciclo di vita del motore di contesto          | Supportato                              | Assemblaggio, ingest o manutenzione post-turno e coordinamento della Compaction del motore di contesto vengono eseguiti per i turni Codex.                                                            |
| Hook degli strumenti dinamici                 | Supportato                              | `before_tool_call`, `after_tool_call` e il middleware dei risultati degli strumenti vengono eseguiti intorno agli strumenti dinamici di proprietà OpenClaw.                                            |
| Hook del ciclo di vita                        | Supportati come osservazioni adattatore | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` vengono emessi con payload onesti in modalità Codex.                                                                  |
| Gate di revisione della risposta finale       | Supportato tramite il relay degli hook nativi | Codex `Stop` viene inoltrato a `before_agent_finalize`; `revise` chiede a Codex un ulteriore passaggio del modello prima della finalizzazione.                                                         |
| Shell nativa, patch e blocco o osservazione MCP | Supportato tramite il relay degli hook nativi | Codex `PreToolUse` e `PostToolUse` vengono inoltrati per le superfici degli strumenti nativi confermate, inclusi i payload MCP su Codex app-server `0.125.0` o successivo. Il blocco è supportato; la riscrittura degli argomenti no. |
| Policy dei permessi nativi                    | Supportato tramite il relay degli hook nativi | Codex `PermissionRequest` può essere instradato attraverso la policy OpenClaw dove il runtime lo espone. Se OpenClaw non restituisce alcuna decisione, Codex continua tramite il suo normale percorso guardian o di approvazione utente. |
| Acquisizione della traiettoria app-server     | Supportato                              | OpenClaw registra la richiesta inviata all'app-server e le notifiche app-server che riceve.                                                                                                           |

Non supportato in runtime Codex v1:

| Superficie                                         | Confine V1                                                                                                                                     | Percorso futuro                                                                           |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutazione degli argomenti degli strumenti nativi    | Gli hook pre-strumento nativi di Codex possono bloccare, ma OpenClaw non riscrive gli argomenti degli strumenti nativi di Codex.               | Richiede supporto di hook/schema Codex per sostituire l'input dello strumento.            |
| Cronologia trascrizione nativa Codex modificabile   | Codex possiede la cronologia canonica del thread nativo. OpenClaw possiede un mirror e può proiettare il contesto futuro, ma non dovrebbe mutare parti interne non supportate. | Aggiungere API esplicite dell'app-server Codex se serve intervenire sul thread nativo.    |
| `tool_result_persist` per record di strumenti nativi Codex | Questo hook trasforma le scritture della trascrizione possedute da OpenClaw, non i record di strumenti nativi Codex.                           | Potrebbe creare un mirror dei record trasformati, ma la riscrittura canonica richiede supporto Codex. |
| Metadati ricchi di Compaction nativa                | OpenClaw osserva l'avvio e il completamento della Compaction, ma non riceve un elenco stabile di elementi mantenuti/scartati, delta di token o payload di riepilogo. | Richiede eventi di Compaction Codex più ricchi.                                           |
| Intervento sulla Compaction                         | Gli hook di Compaction OpenClaw attuali sono a livello di notifica in modalità Codex.                                                           | Aggiungere hook Codex pre/post Compaction se i plugins devono porre veto o riscrivere la Compaction nativa. |
| Acquisizione byte per byte della richiesta API del modello | OpenClaw può acquisire richieste e notifiche dell'app-server, ma il core Codex costruisce internamente la richiesta finale all'API OpenAI.      | Richiede un evento di tracciamento della richiesta modello Codex o un'API di debug.       |

## Strumenti, media e Compaction

L'harness Codex modifica solo l'executor agent incorporato di basso livello.

OpenClaw continua a costruire l'elenco degli strumenti e riceve risultati dinamici degli strumenti dall'harness. Testo, immagini, video, musica, TTS, approvazioni e output degli strumenti di messaggistica continuano a passare attraverso il normale percorso di consegna di OpenClaw.

Il relay degli hook nativi è intenzionalmente generico, ma il contratto di supporto v1 è limitato ai percorsi di strumenti e permessi nativi Codex testati da OpenClaw. Nel runtime Codex, questo include i payload shell, patch e MCP `PreToolUse`, `PostToolUse` e `PermissionRequest`. Non dare per scontato che ogni futuro evento hook Codex sia una superficie Plugin OpenClaw finché il contratto runtime non lo nomina.

Per `PermissionRequest`, OpenClaw restituisce solo decisioni esplicite di consenso o rifiuto quando la policy decide. Un risultato senza decisione non è un consenso. Codex lo tratta come assenza di decisione dell'hook e passa al proprio guardian o al percorso di approvazione utente.

Le richieste di approvazione degli strumenti MCP Codex vengono instradate attraverso il flusso di approvazione Plugin di OpenClaw quando Codex marca `_meta.codex_approval_kind` come `"mcp_tool_call"`. I prompt Codex `request_user_input` vengono inviati di nuovo alla chat di origine, e il successivo messaggio di follow-up in coda risponde a quella richiesta server nativa invece di essere instradato come contesto aggiuntivo. Le altre richieste di elicitation MCP continuano a fallire in modo chiuso.

Lo steering della coda di esecuzione attiva si mappa su `turn/steer` dell'app-server Codex. Con il valore predefinito `messages.queue.mode: "steer"`, OpenClaw raggruppa i messaggi chat in coda per la finestra di quiete configurata e li invia come un'unica richiesta `turn/steer` in ordine di arrivo. La modalità legacy `queue` invia richieste `turn/steer` separate. I turni di revisione e Compaction manuale Codex possono rifiutare lo steering nello stesso turno, nel qual caso OpenClaw usa la coda di follow-up quando la modalità selezionata consente il fallback. Vedi [Coda di steering](/it/concepts/queue-steering).

Quando il modello selezionato usa l'harness Codex, la Compaction del thread nativo viene delegata all'app-server Codex. OpenClaw mantiene un mirror della trascrizione per la cronologia del canale, la ricerca, `/new`, `/reset` e futuri cambi di modello o harness. Il mirror include il prompt utente, il testo finale dell'assistente e record leggeri di ragionamento o piano Codex quando l'app-server li emette. Oggi OpenClaw registra solo segnali di avvio e completamento della Compaction nativa. Non espone ancora un riepilogo della Compaction leggibile da una persona o un elenco verificabile delle voci mantenute da Codex dopo la Compaction.

Poiché Codex possiede il thread nativo canonico, `tool_result_persist` attualmente non riscrive i record di risultati degli strumenti nativi Codex. Si applica solo quando OpenClaw sta scrivendo un risultato di strumento nella trascrizione di una sessione posseduta da OpenClaw.

La generazione di media non richiede PI. Immagini, video, musica, PDF, TTS e comprensione dei media continuano a usare le impostazioni provider/modello corrispondenti, come `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` e `messages.tts`.

## Risoluzione dei problemi

**Codex non appare come provider `/model` normale:** è previsto per le nuove configurazioni. Seleziona un modello `openai/gpt-*` con `agentRuntime.id: "codex"` (o un riferimento legacy `codex/*`), abilita `plugins.entries.codex.enabled` e controlla se `plugins.allow` esclude `codex`.

**OpenClaw usa PI invece di Codex:** `agentRuntime.id: "auto"` può ancora usare PI come backend di compatibilità quando nessun harness Codex rivendica l'esecuzione. Imposta `agentRuntime.id: "codex"` per forzare la selezione di Codex durante i test. Un runtime Codex forzato fallisce invece di ripiegare su PI. Una volta selezionato l'app-server Codex, i suoi errori emergono direttamente.

**L'app-server viene rifiutato:** aggiorna Codex in modo che l'handshake dell'app-server riporti la versione `0.125.0` o successiva. Prerelease della stessa versione o versioni con suffisso di build come `0.125.0-alpha.2` o `0.125.0+custom` vengono rifiutate perché il floor del protocollo stabile `0.125.0` è quello testato da OpenClaw.

**Il rilevamento dei modelli è lento:** riduci `plugins.entries.codex.config.discovery.timeoutMs` o disabilita il rilevamento.

**Il trasporto WebSocket fallisce immediatamente:** controlla `appServer.url`, `authToken` e che l'app-server remoto parli la stessa versione del protocollo app-server Codex.

**Un modello non Codex usa PI:** è previsto, a meno che tu non abbia forzato `agentRuntime.id: "codex"` per quell'agent o selezionato un riferimento legacy `codex/*`. I riferimenti semplici `openai/gpt-*` e quelli di altri provider restano sul loro normale percorso provider in modalità `auto`. Se forzi `agentRuntime.id: "codex"`, ogni turno incorporato per quell'agent deve essere un modello OpenAI supportato da Codex.

**Computer Use è installato ma gli strumenti non vengono eseguiti:** controlla `/codex computer-use status` da una nuova sessione. Se uno strumento segnala `Native hook relay unavailable`, usa `/new` o `/reset`; se persiste, riavvia il gateway per eliminare registrazioni di hook nativi obsolete. Se `computer-use.list_apps` va in timeout, riavvia Codex Computer Use o Codex Desktop e riprova.

## Correlati

- [Plugins di harness agent](/it/plugins/sdk-agent-harness)
- [Runtime agent](/it/concepts/agent-runtimes)
- [Provider di modelli](/it/concepts/model-providers)
- [Provider OpenAI](/it/providers/openai)
- [Stato](/it/cli/status)
- [Hook Plugin](/it/plugins/hooks)
- [Riferimento configurazione](/it/gateway/configuration-reference)
- [Test](/it/help/testing-live#live-codex-app-server-harness-smoke)
