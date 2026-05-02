---
read_when:
    - Vuoi usare l'harness app-server Codex incluso
    - Ti servono esempi di configurazione dell'harness Codex
    - Vuoi che le distribuzioni solo Codex falliscano invece di ripiegare su Pi
summary: Esegui i turni dell'agente incorporato di OpenClaw tramite l'harness app-server Codex incluso
title: Ambiente di esecuzione di Codex
x-i18n:
    generated_at: "2026-05-02T08:28:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 107f9fc0a3e8ad6a4790fc9eb68276c81d299236f11293014d2ab9bf6e235133
    source_path: plugins/codex-harness.md
    workflow: 16
---

Il Plugin `codex` incluso consente a OpenClaw di eseguire turni di agent incorporati tramite il
Codex app-server invece che tramite l’harness PI integrato.

Usalo quando vuoi che Codex possieda la sessione agent di basso livello: rilevamento
dei modelli, ripresa nativa dei thread, compaction nativa ed esecuzione app-server.
OpenClaw continua a possedere canali chat, file di sessione, selezione del modello, strumenti,
approvazioni, recapito dei media e il mirror visibile della trascrizione.

Quando un turno chat sorgente viene eseguito tramite l’harness Codex, le risposte visibili usano per impostazione predefinita
lo strumento `message` di OpenClaw se la distribuzione non ha configurato esplicitamente
`messages.visibleReplies`. L’agent può comunque completare privatamente il proprio turno Codex;
pubblica sul canale solo quando chiama `message(action="send")`. Imposta
`messages.visibleReplies: "automatic"` per mantenere le risposte finali delle chat dirette sul
percorso di recapito automatico legacy.

Anche i turni Heartbeat di Codex ricevono per impostazione predefinita lo strumento `heartbeat_respond`, così
l’agent può registrare se il risveglio deve restare silenzioso o notificare senza codificare
quel flusso di controllo nel testo finale.

Se stai cercando di orientarti, inizia da
[Runtime agent](/it/concepts/agent-runtimes). La versione breve è:
`openai/gpt-5.5` è il riferimento del modello, `codex` è il runtime e Telegram,
Discord, Slack o un altro canale resta la superficie di comunicazione.

## Configurazione rapida

La maggior parte degli utenti che vuole "Codex in OpenClaw" vuole questo percorso: accedere con un
abbonamento ChatGPT/Codex, quindi eseguire i turni agent incorporati tramite il runtime
nativo Codex app-server. Il riferimento del modello resta comunque canonico come
`openai/gpt-*`; l’autenticazione dell’abbonamento arriva dall’account/profilo Codex, non
da un prefisso di modello `openai-codex/*`.

Per prima cosa accedi con Codex OAuth se non l’hai già fatto:

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
        fallback: "none",
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

Non usare `openai-codex/gpt-*` quando intendi il runtime nativo Codex. Quel prefisso
è il percorso esplicito "Codex OAuth tramite PI". Le modifiche alla configurazione si applicano alle sessioni nuove o
reimpostate; le sessioni esistenti mantengono il runtime registrato.

## Cosa cambia questo Plugin

Il Plugin `codex` incluso apporta diverse capability separate:

| Capability                        | Come lo usi                                        | Cosa fa                                                                       |
| --------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime incorporato nativo        | `agentRuntime.id: "codex"`                         | Esegue i turni agent incorporati di OpenClaw tramite Codex app-server.        |
| Comandi nativi di controllo chat  | `/codex bind`, `/codex resume`, `/codex steer`, ... | Collega e controlla thread Codex app-server da una conversazione di messaggistica. |
| Provider/catalogo Codex app-server | interni di `codex`, esposti tramite l’harness      | Consente al runtime di rilevare e validare i modelli app-server.              |
| Percorso di comprensione media Codex | percorsi di compatibilità dei modelli immagine `codex/*` | Esegue turni Codex app-server delimitati per i modelli di comprensione immagini supportati. |
| Relay hook nativo                 | Hook Plugin attorno a eventi nativi Codex          | Consente a OpenClaw di osservare/bloccare eventi nativi Codex supportati di strumenti/finalizzazione. |

Abilitare il Plugin rende disponibili queste capability. **Non**:

- inizia a usare Codex per ogni modello OpenAI
- converte riferimenti di modello `openai-codex/*` nel runtime nativo
- rende ACP/acpx il percorso Codex predefinito
- cambia a caldo sessioni esistenti che hanno già registrato un runtime PI
- sostituisce il recapito dei canali OpenClaw, i file di sessione, l’archiviazione dei profili di autenticazione o
  l’instradamento dei messaggi

Lo stesso Plugin possiede anche la superficie nativa dei comandi di controllo chat `/codex`. Se
il Plugin è abilitato e l’utente chiede di collegare, riprendere, indirizzare, arrestare o ispezionare
thread Codex dalla chat, gli agent dovrebbero preferire `/codex ...` rispetto ad ACP. ACP resta
il fallback esplicito quando l’utente chiede ACP/acpx o sta testando l’adattatore ACP
Codex.

I turni nativi Codex mantengono gli hook Plugin di OpenClaw come livello pubblico di compatibilità.
Questi sono hook OpenClaw in-process, non hook di comando Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` per i record di trascrizione mirror
- `before_agent_finalize` tramite relay Codex `Stop`
- `agent_end`

I Plugin possono anche registrare middleware dei risultati degli strumenti neutri rispetto al runtime per riscrivere
i risultati degli strumenti dinamici di OpenClaw dopo che OpenClaw esegue lo strumento e prima che il
risultato sia restituito a Codex. Questo è separato dall’hook Plugin pubblico
`tool_result_persist`, che trasforma le scritture dei risultati degli strumenti nella trascrizione
possedute da OpenClaw.

Per la semantica degli hook Plugin, vedi [Hook Plugin](/it/plugins/hooks)
e [Comportamento delle guardie Plugin](/it/tools/plugin).

L’harness è disattivato per impostazione predefinita. Le nuove configurazioni dovrebbero mantenere i riferimenti dei modelli OpenAI
canonici come `openai/gpt-*` e forzare esplicitamente
`agentRuntime.id: "codex"` o `OPENCLAW_AGENT_RUNTIME=codex` quando
vogliono l’esecuzione nativa app-server. I riferimenti di modello legacy `codex/*` continuano a selezionare automaticamente
l’harness per compatibilità, ma i prefissi provider legacy supportati da runtime
non vengono mostrati come scelte normali di modello/provider.

Se il Plugin `codex` è abilitato ma il modello primario è ancora
`openai-codex/*`, `openclaw doctor` avvisa invece di modificare il percorso. Questo è
intenzionale: `openai-codex/*` resta il percorso PI Codex OAuth/abbonamento, e
l’esecuzione nativa app-server resta una scelta di runtime esplicita.

## Mappa dei percorsi

Usa questa tabella prima di modificare la configurazione:

| Comportamento desiderato                              | Riferimento modello        | Configurazione runtime                  | Percorso auth/profilo        | Etichetta di stato prevista    |
| ----------------------------------------------------- | -------------------------- | --------------------------------------- | ---------------------------- | ------------------------------ |
| Abbonamento ChatGPT/Codex con runtime nativo Codex    | `openai/gpt-*`             | `agentRuntime.id: "codex"`              | Codex OAuth o account Codex  | `Runtime: OpenAI Codex`        |
| API OpenAI tramite runner OpenClaw normale            | `openai/gpt-*`             | omesso o `runtime: "pi"`                | Chiave API OpenAI            | `Runtime: OpenClaw Pi Default` |
| Abbonamento ChatGPT/Codex tramite PI                  | `openai-codex/gpt-*`       | omesso o `runtime: "pi"`                | Provider OpenAI Codex OAuth  | `Runtime: OpenClaw Pi Default` |
| Provider misti con modalità auto conservativa         | riferimenti specifici del provider | `agentRuntime.id: "auto"`              | Per provider selezionato     | Dipende dal runtime selezionato |
| Sessione esplicita dell’adattatore Codex ACP          | dipendente da prompt/modello ACP | `sessions_spawn` con `runtime: "acp"` | Auth backend ACP             | Stato task/sessione ACP        |

La separazione importante è provider rispetto a runtime:

- `openai-codex/*` risponde a "quale percorso provider/auth dovrebbe usare PI?"
- `agentRuntime.id: "codex"` risponde a "quale loop dovrebbe eseguire questo
  turno incorporato?"
- `/codex ...` risponde a "a quale conversazione nativa Codex questa chat dovrebbe collegarsi
  o quale dovrebbe controllare?"
- ACP risponde a "quale processo harness esterno dovrebbe avviare acpx?"

## Scegli il prefisso di modello corretto

I percorsi della famiglia OpenAI sono specifici per prefisso. Per la configurazione comune abbonamento più
runtime nativo Codex, usa `openai/*` con `agentRuntime.id: "codex"`.
Usa `openai-codex/*` solo quando vuoi intenzionalmente Codex OAuth tramite PI:

| Riferimento modello                          | Percorso runtime                            | Usalo quando                                                              |
| -------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                             | Provider OpenAI tramite plumbing OpenClaw/PI | Vuoi l’accesso attuale diretto alle API OpenAI Platform con `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                       | OpenAI Codex OAuth tramite OpenClaw/PI      | Vuoi l’auth dell’abbonamento ChatGPT/Codex con il runner PI predefinito.  |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness Codex app-server                    | Vuoi l’auth dell’abbonamento ChatGPT/Codex con esecuzione nativa Codex.   |

GPT-5.5 può apparire sia sui percorsi diretti con chiave API OpenAI sia su quelli con abbonamento Codex
quando il tuo account li espone. Usa `openai/gpt-5.5` con l’harness Codex app-server
per il runtime nativo Codex, `openai-codex/gpt-5.5` per PI OAuth, oppure
`openai/gpt-5.5` senza override del runtime Codex per traffico diretto con chiave API.

I riferimenti legacy `codex/gpt-*` restano accettati come alias di compatibilità. La migrazione di compatibilità
di doctor riscrive i riferimenti runtime primari legacy in riferimenti modello canonici
e registra separatamente la policy runtime, mentre i riferimenti legacy solo di fallback
vengono lasciati invariati perché il runtime è configurato per l’intero contenitore agent.
Le nuove configurazioni PI Codex OAuth dovrebbero usare `openai-codex/gpt-*`; le nuove configurazioni
native dell’harness app-server dovrebbero usare `openai/gpt-*` più
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` segue la stessa separazione dei prefissi. Usa
`openai-codex/gpt-*` quando la comprensione delle immagini deve essere eseguita tramite il percorso provider OpenAI
Codex OAuth. Usa `codex/gpt-*` quando la comprensione delle immagini deve essere eseguita
tramite un turno Codex app-server delimitato. Il modello Codex app-server deve
dichiarare il supporto all’input immagine; i modelli Codex solo testo falliscono prima che inizi il turno media.

Usa `/status` per confermare l’harness effettivo per la sessione corrente. Se la
selezione sorprende, abilita il logging di debug per il sottosistema `agents/harness`
e ispeziona il record strutturato `agent harness selected` del gateway. Include
l’id dell’harness selezionato, il motivo della selezione, la policy runtime/fallback e,
in modalità `auto`, il risultato del supporto di ciascun candidato Plugin.

### Cosa significano gli avvisi di doctor

`openclaw doctor` avvisa quando tutte queste condizioni sono vere:

- il Plugin `codex` incluso è abilitato o consentito
- il modello primario di un agent è `openai-codex/*`
- il runtime effettivo di quell’agent non è `codex`

Quell’avviso esiste perché gli utenti spesso si aspettano che "Plugin Codex abilitato" implichi
"runtime nativo Codex app-server." OpenClaw non compie quel salto. L’avviso
significa:

- **Non è richiesta alcuna modifica** se intendevi ChatGPT/Codex OAuth tramite PI.
- Cambia il modello in `openai/<model>` e imposta
  `agentRuntime.id: "codex"` se intendevi l’esecuzione nativa app-server.
- Le sessioni esistenti hanno comunque bisogno di `/new` o `/reset` dopo una modifica del runtime,
  perché i pin del runtime di sessione sono persistenti.

La selezione dell’harness non è un controllo di sessione live. Quando viene eseguito un turno incorporato,
OpenClaw registra l’id dell’harness selezionato su quella sessione e continua a usarlo per
i turni successivi nello stesso id sessione. Modifica la configurazione `agentRuntime` o
`OPENCLAW_AGENT_RUNTIME` quando vuoi che le sessioni future usino un altro harness;
usa `/new` o `/reset` per avviare una sessione fresca prima di passare una conversazione esistente
tra PI e Codex. Questo evita di rieseguire una trascrizione attraverso
due sistemi di sessione nativi incompatibili.

Le sessioni legacy create prima dei pin dell’harness sono trattate come vincolate a PI una volta che
hanno cronologia di trascrizione. Usa `/new` o `/reset` per far aderire quella conversazione a
Codex dopo aver modificato la configurazione.

`/status` mostra il runtime effettivo del modello. L'ambiente di esecuzione Pi predefinito appare come
`Runtime: OpenClaw Pi Default`, mentre l'ambiente di esecuzione Codex app-server appare come
`Runtime: OpenAI Codex`.

## Requisiti

- OpenClaw con il plugin `codex` incluso disponibile.
- Codex app-server `0.125.0` o versioni successive. Il plugin incluso gestisce per impostazione predefinita un binario Codex app-server compatibile, quindi i comandi `codex` locali in `PATH` non influiscono sul normale avvio dell'ambiente di esecuzione.
- Autenticazione Codex disponibile per il processo app-server o per il bridge di autenticazione Codex di OpenClaw. Gli avvii locali dell'app-server usano una home Codex gestita da OpenClaw per ogni agente e un `HOME` figlio isolato, quindi per impostazione predefinita non leggono l'account personale `~/.codex`, Skills, plugin, configurazione, stato dei thread o `$HOME/.agents/skills` nativi.

Il plugin blocca gli handshake app-server meno recenti o senza versione. Questo mantiene OpenClaw sulla superficie di protocollo su cui è stato testato.

Per i test live e smoke Docker, l'autenticazione di solito proviene dall'account Codex CLI o da un profilo di autenticazione OpenClaw `openai-codex`. Gli avvii locali stdio dell'app-server possono anche ripiegare su `CODEX_API_KEY` / `OPENAI_API_KEY` quando non è presente alcun account.

## Aggiungere Codex accanto ad altri modelli

Non impostare `agentRuntime.id: "codex"` globalmente se lo stesso agente deve poter passare liberamente tra Codex e modelli di provider non Codex. Un runtime forzato si applica a ogni turno incorporato per quell'agente o sessione. Se selezioni un modello Anthropic mentre quel runtime è forzato, OpenClaw prova comunque l'ambiente Codex e fallisce in modo chiuso invece di instradare silenziosamente quel turno tramite Pi.

Usa invece una di queste forme:

- Metti Codex su un agente dedicato con `agentRuntime.id: "codex"`.
- Mantieni l'agente predefinito su `agentRuntime.id: "auto"` e fallback Pi per il normale uso misto dei provider.
- Usa i riferimenti legacy `codex/*` solo per compatibilità. Le nuove configurazioni dovrebbero preferire `openai/*` più una policy runtime Codex esplicita.

Ad esempio, questo mantiene l'agente predefinito sulla normale selezione automatica e aggiunge un agente Codex separato:

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
        fallback: "pi",
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

- L'agente predefinito `main` usa il percorso provider normale e il fallback di compatibilità Pi.
- L'agente `codex` usa l'ambiente di esecuzione Codex app-server.
- Se Codex manca o non è supportato per l'agente `codex`, il turno fallisce invece di usare silenziosamente Pi.

## Instradamento dei comandi degli agenti

Gli agenti dovrebbero instradare le richieste utente in base all'intento, non solo in base alla parola "Codex":

| L'utente chiede di...                                  | L'agente dovrebbe usare...                       |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Associare questa chat a Codex"                        | `/codex bind`                                    |
| "Riprendere qui il thread Codex `<id>`"                | `/codex resume <id>`                             |
| "Mostrare i thread Codex"                              | `/codex threads`                                 |
| "Aprire una segnalazione di supporto per un'esecuzione Codex non riuscita" | `/diagnostics [note]`                            |
| "Inviare solo feedback Codex per questo thread allegato" | `/codex diagnostics [note]`                      |
| "Usare il mio abbonamento ChatGPT/Codex con il runtime Codex" | `openai/*` più `agentRuntime.id: "codex"`        |
| "Usare il mio abbonamento ChatGPT/Codex tramite Pi"    | riferimenti modello `openai-codex/*`             |
| "Eseguire Codex tramite ACP/acpx"                      | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Avviare Claude Code/Gemini/OpenCode/Cursor in un thread" | ACP/acpx, non `/codex` e non sottoagenti nativi  |

OpenClaw pubblicizza agli agenti la guida allo spawn ACP solo quando ACP è abilitato, inviabile ed è supportato da un backend runtime caricato. Se ACP non è disponibile, il prompt di sistema e le Skills del plugin non dovrebbero istruire l'agente sull'instradamento ACP.

## Distribuzioni solo Codex

Forza l'ambiente Codex quando devi dimostrare che ogni turno agente incorporato usa Codex. I runtime plugin espliciti non hanno fallback Pi per impostazione predefinita, quindi `fallback: "none"` è opzionale ma spesso utile come documentazione:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

Override di ambiente:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Con Codex forzato, OpenClaw fallisce in anticipo se il plugin Codex è disabilitato, se l'app-server è troppo vecchio o se l'app-server non può avviarsi. Imposta `OPENCLAW_AGENT_HARNESS_FALLBACK=pi` solo se vuoi intenzionalmente che Pi gestisca la selezione di un ambiente mancante.

## Codex per agente

Puoi rendere un agente solo Codex mentre l'agente predefinito mantiene la normale selezione automatica:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
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
          fallback: "none",
        },
      },
    ],
  },
}
```

Usa i normali comandi di sessione per cambiare agenti e modelli. `/new` crea una nuova sessione OpenClaw e l'ambiente Codex crea o riprende il proprio thread app-server sidecar secondo necessità. `/reset` cancella l'associazione della sessione OpenClaw per quel thread e consente al turno successivo di risolvere di nuovo l'ambiente dalla configurazione corrente.

## Rilevamento dei modelli

Per impostazione predefinita, il plugin Codex chiede all'app-server i modelli disponibili. Se il rilevamento fallisce o scade, usa un catalogo di fallback incluso per:

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

Disabilita il rilevamento quando vuoi che l'avvio eviti di sondare Codex e rimanga sul catalogo di fallback:

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

Il binario gestito viene distribuito con il pacchetto del plugin `codex`. Questo mantiene la versione dell'app-server legata al plugin incluso invece che a qualsiasi CLI Codex separata installata localmente. Imposta `appServer.command` solo quando vuoi intenzionalmente eseguire un eseguibile diverso.

Per impostazione predefinita, OpenClaw avvia le sessioni locali dell'ambiente Codex in modalità YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Questa è la postura attendibile dell'operatore locale usata per Heartbeat autonomi: Codex può usare strumenti shell e di rete senza fermarsi su prompt di approvazione nativi a cui non c'è nessuno che possa rispondere.

Per aderire alle approvazioni Codex revisionate da guardian, imposta `appServer.mode:
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

La modalità guardian usa il percorso di approvazione con revisione automatica nativo di Codex. Quando Codex chiede di uscire dalla sandbox, scrivere fuori dal workspace o aggiungere autorizzazioni come l'accesso alla rete, Codex instrada quella richiesta di approvazione al revisore nativo invece che a un prompt umano. Il revisore applica il framework di rischio di Codex e approva o nega la richiesta specifica. Usa guardian quando vuoi più protezioni della modalità YOLO ma hai comunque bisogno che agenti non presidiati avanzino.

Il preset `guardian` si espande in `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"`.
I singoli campi di policy sovrascrivono comunque `mode`, quindi le distribuzioni avanzate possono combinare il preset con scelte esplicite. Il valore revisore precedente `guardian_subagent` è ancora accettato come alias di compatibilità, ma le nuove configurazioni dovrebbero usare `auto_review`.

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

Gli avvii stdio dell'app-server ereditano per impostazione predefinita l'ambiente di processo di OpenClaw, ma OpenClaw possiede il bridge dell'account Codex app-server e imposta sia `CODEX_HOME` sia `HOME` su directory per agente nello stato OpenClaw di quell'agente. Il loader di Skills di Codex legge `$CODEX_HOME/skills` e `$HOME/.agents/skills`, quindi entrambi i valori sono isolati per gli avvii locali dell'app-server. Questo mantiene Skills, plugin, configurazione, account e stato dei thread nativi Codex confinati all'agente OpenClaw invece di farli filtrare dalla home personale della CLI Codex dell'operatore.

I plugin OpenClaw e gli snapshot delle Skills OpenClaw continuano a passare attraverso il registro dei plugin e il loader di Skills propri di OpenClaw. Gli asset personali della CLI Codex no. Se hai Skills o plugin CLI Codex utili che dovrebbero diventare parte di un agente OpenClaw, inventariali esplicitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Il provider di migrazione Codex copia le Skills nel workspace dell'agente OpenClaw corrente. I plugin, gli hook e i file di configurazione nativi Codex vengono segnalati o archiviati per revisione manuale invece di essere attivati automaticamente, perché possono eseguire comandi, esporre server MCP o contenere credenziali.

L'autenticazione viene selezionata in questo ordine:

1. Un profilo di autenticazione OpenClaw Codex esplicito per l'agente.
2. L'account esistente dell'app-server nella home Codex di quell'agente.
3. Solo per gli avvii locali stdio dell'app-server, `CODEX_API_KEY`, poi
   `OPENAI_API_KEY`, quando non è presente alcun account app-server e l'autenticazione OpenAI è ancora richiesta.

Quando OpenClaw rileva un profilo di autenticazione Codex in stile abbonamento ChatGPT, rimuove `CODEX_API_KEY` e `OPENAI_API_KEY` dal processo figlio Codex generato. Questo mantiene disponibili le chiavi API a livello Gateway per embedding o modelli OpenAI diretti senza far addebitare accidentalmente i turni nativi Codex app-server tramite l'API. I profili espliciti Codex con chiave API e il fallback locale stdio con chiave env usano il login dell'app-server invece dell'env ereditato del processo figlio. Le connessioni WebSocket app-server non ricevono il fallback della chiave API env del Gateway; usa un profilo di autenticazione esplicito o l'account proprio dell'app-server remoto.

Se una distribuzione richiede ulteriore isolamento dell'ambiente, aggiungi quelle variabili a `appServer.clearEnv`:

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

`appServer.clearEnv` influisce solo sul processo figlio Codex app-server generato.

Gli strumenti dinamici Codex usano per impostazione predefinita il profilo `native-first`. In questa modalità, OpenClaw non espone strumenti dinamici che duplicano le operazioni workspace native di Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` e
`update_plan`. Gli strumenti di integrazione OpenClaw come messaggistica, sessioni, contenuti multimediali, Cron, browser, nodi, Gateway, `heartbeat_respond` e `web_search` restano disponibili.

Campi di primo livello supportati per il plugin Codex:

| Campo                      | Predefinito      | Significato                                                                              |
| -------------------------- | ---------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Usa `"openclaw-compat"` per esporre l'intero insieme di strumenti dinamici OpenClaw a Codex app-server. |
| `codexDynamicToolsExclude` | `[]`             | Nomi aggiuntivi di strumenti dinamici OpenClaw da omettere dai turni di Codex app-server. |

Campi `appServer` supportati:

| Campo               | Predefinito                            | Significato                                                                                                                                                                                                                         |
| ------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                              | `"stdio"` avvia Codex; `"websocket"` si connette a `url`.                                                                                                                                                                           |
| `command`           | binario Codex gestito                  | Eseguibile per il trasporto stdio. Lascia non impostato per usare il binario gestito; impostalo solo per una sostituzione esplicita.                                                                                                |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argomenti per il trasporto stdio.                                                                                                                                                                                                   |
| `url`               | non impostato                          | URL WebSocket dell'app-server.                                                                                                                                                                                                      |
| `authToken`         | non impostato                          | Token Bearer per il trasporto WebSocket.                                                                                                                                                                                            |
| `headers`           | `{}`                                   | Header WebSocket aggiuntivi.                                                                                                                                                                                                        |
| `clearEnv`          | `[]`                                   | Nomi di variabili d'ambiente aggiuntivi rimossi dal processo app-server stdio avviato dopo che OpenClaw costruisce il suo ambiente ereditato. `CODEX_HOME` e `HOME` sono riservati all'isolamento Codex per agente di OpenClaw negli avvii locali. |
| `requestTimeoutMs`  | `60000`                                | Timeout per le chiamate control-plane dell'app-server.                                                                                                                                                                              |
| `mode`              | `"yolo"`                               | Preset per l'esecuzione YOLO o sottoposta a revisione guardian.                                                                                                                                                                     |
| `approvalPolicy`    | `"never"`                              | Policy di approvazione nativa di Codex inviata ad avvio/ripresa/turno del thread.                                                                                                                                                   |
| `sandbox`           | `"danger-full-access"`                 | Modalità sandbox nativa di Codex inviata ad avvio/ripresa del thread.                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                               | Usa `"auto_review"` per consentire a Codex di revisionare le richieste di approvazione native. `guardian_subagent` resta un alias legacy.                                                                                           |
| `serviceTier`       | non impostato                          | Tier di servizio opzionale di Codex app-server: `"fast"`, `"flex"` o `null`. I valori legacy non validi vengono ignorati.                                                                                                           |

Le chiamate agli strumenti dinamici possedute da OpenClaw sono delimitate in modo indipendente da
`appServer.requestTimeoutMs`: ogni richiesta Codex `item/tool/call` deve ricevere
una risposta OpenClaw entro 30 secondi. Al timeout, OpenClaw interrompe il segnale
dello strumento dove supportato e restituisce a Codex una risposta di strumento
dinamico non riuscita, così il turno può continuare invece di lasciare la sessione
in `processing`.

Dopo che OpenClaw risponde a una richiesta app-server con ambito turno di Codex, l'harness
si aspetta anche che Codex completi il turno nativo con `turn/completed`. Se
l'app-server resta silenzioso per 60 secondi dopo quella risposta, OpenClaw prova
a interrompere il turno Codex, registra un timeout diagnostico e libera la corsia
di sessione OpenClaw, così i messaggi di chat successivi non restano in coda dietro
un turno nativo obsoleto.

Le sostituzioni d'ambiente restano disponibili per i test locali:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` bypassa il binario gestito quando
`appServer.command` non è impostato.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` è stato rimosso. Usa invece
`plugins.entries.codex.config.appServer.mode: "guardian"`, oppure
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` per test locali una tantum. La configurazione è
preferibile per distribuzioni ripetibili perché mantiene il comportamento del plugin nello
stesso file revisionato del resto della configurazione dell'harness Codex.

## Uso del computer

L'uso del computer è trattato nella propria guida di configurazione:
[Uso del computer di Codex](/it/plugins/codex-computer-use).

In breve: OpenClaw non include come vendor l'app di controllo del desktop né esegue
azioni desktop direttamente. Prepara Codex app-server, verifica che il server MCP
`computer-use` sia disponibile, quindi lascia che Codex gestisca le chiamate native
agli strumenti MCP durante i turni in modalità Codex.

Per l'accesso diretto al driver TryCua fuori dal flusso del marketplace Codex, registra
`cua-driver mcp` con `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Consulta [Uso del computer di Codex](/it/plugins/codex-computer-use) per la distinzione
tra l'uso del computer posseduto da Codex e la registrazione MCP diretta.

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
        fallback: "none",
      },
    },
  },
}
```

La configurazione può essere controllata o installata dalla superficie di comando:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

L'uso del computer è specifico di macOS e può richiedere permessi locali del sistema operativo prima che il
server MCP di Codex possa controllare le app. Se `computerUse.enabled` è true e il server MCP
non è disponibile, i turni in modalità Codex falliscono prima dell'avvio del thread invece di
essere eseguiti silenziosamente senza gli strumenti nativi di uso del computer. Consulta
[Uso del computer di Codex](/it/plugins/codex-computer-use) per le scelte del marketplace,
i limiti del catalogo remoto, i motivi di stato e la risoluzione dei problemi.

Quando `computerUse.autoInstall` è true, OpenClaw può registrare il marketplace standard
Codex Desktop incluso da
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` se Codex
non ha ancora scoperto un marketplace locale. Usa `/new` o `/reset` dopo aver
modificato la configurazione runtime o di uso del computer, così le sessioni esistenti non mantengono un vecchio
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
il modello OpenAI, il provider, la policy di approvazione, la sandbox e il tier di servizio
attualmente selezionati. Passare da `openai/gpt-5.5` a `openai/gpt-5.2` mantiene il
binding del thread ma chiede a Codex di continuare con il nuovo modello selezionato.

## Comando Codex

Il plugin incluso registra `/codex` come comando slash autorizzato. È
generico e funziona su qualsiasi canale che supporti i comandi di testo OpenClaw.

Forme comuni:

- `/codex status` mostra connettività app-server live, modelli, account, limiti di frequenza, server MCP e Skills.
- `/codex models` elenca i modelli live di Codex app-server.
- `/codex threads [filter]` elenca i thread Codex recenti.
- `/codex resume <thread-id>` collega la sessione OpenClaw corrente a un thread Codex esistente.
- `/codex compact` chiede a Codex app-server di compattare il thread collegato.
- `/codex review` avvia la revisione nativa di Codex per il thread collegato.
- `/codex diagnostics [note]` chiede prima di inviare feedback diagnostico Codex per il thread collegato.
- `/codex computer-use status` controlla il plugin di uso del computer configurato e il server MCP.
- `/codex computer-use install` installa il plugin di uso del computer configurato e ricarica i server MCP.
- `/codex account` mostra lo stato dell'account e dei limiti di frequenza.
- `/codex mcp` elenca lo stato dei server MCP di Codex app-server.
- `/codex skills` elenca le Skills di Codex app-server.

### Flusso di debug comune

Quando un agente basato su Codex fa qualcosa di inatteso in Telegram, Discord, Slack,
o in un altro canale, inizia dalla conversazione in cui si è verificato il problema:

1. Esegui `/diagnostics bad tool choice after image upload` o un'altra breve nota
   che descriva ciò che hai visto.
2. Approva la richiesta di diagnostica una volta. L'approvazione crea lo zip di
   diagnostica del Gateway locale e, poiché la sessione usa l'harness Codex, invia
   anche il bundle di feedback Codex pertinente ai server OpenAI.
3. Copia la risposta di diagnostica completata nella segnalazione di bug o nel thread
   di supporto. Include il percorso del bundle locale, il riepilogo della privacy,
   gli ID sessione OpenClaw, gli ID thread Codex e una riga `Inspect locally` per
   ogni thread Codex.
4. Se vuoi eseguire il debug della run personalmente, esegui il comando stampato
   `Inspect locally` in un terminale. Ha l'aspetto di
   `codex resume <thread-id>` e apre il thread Codex nativo, così puoi ispezionare
   la conversazione, continuarla localmente o chiedere a Codex perché ha scelto
   un determinato strumento o piano.

Usa `/codex diagnostics [note]` solo quando vuoi specificamente il caricamento del
feedback Codex per il thread attualmente collegato, senza il bundle completo di
diagnostica del Gateway OpenClaw. Per la maggior parte delle segnalazioni di
supporto, `/diagnostics [note]` è il punto di partenza migliore perché collega lo
stato del Gateway locale e gli ID thread Codex in un'unica risposta. Vedi
[Esportazione diagnostica](/it/gateway/diagnostics) per il modello completo di privacy
e il comportamento nelle chat di gruppo.

Il core OpenClaw espone anche `/diagnostics [note]`, solo per i proprietari, come
comando generale di diagnostica del Gateway. La sua richiesta di approvazione mostra
il preambolo sui dati sensibili, include link a
[Esportazione diagnostica](/it/gateway/diagnostics) e richiede
`openclaw gateway diagnostics export --json` tramite approvazione exec esplicita
ogni volta. Non approvare la diagnostica con una regola allow-all. Dopo
l'approvazione, OpenClaw invia un report incollabile con il percorso del bundle
locale e il riepilogo del manifest. Quando la sessione OpenClaw attiva usa
l'harness Codex, la stessa approvazione autorizza anche l'invio dei bundle di
feedback Codex pertinenti ai server OpenAI. La richiesta di approvazione indica che
il feedback Codex verrà inviato, ma non elenca gli ID sessione o thread Codex prima
dell'approvazione.

Se `/diagnostics` viene invocato da un proprietario in una chat di gruppo, OpenClaw
mantiene pulito il canale condiviso: il gruppo riceve solo un breve avviso, mentre
il preambolo di diagnostica, le richieste di approvazione e gli ID sessione/thread
Codex vengono inviati al proprietario tramite il percorso di approvazione privato.
Se non esiste un percorso privato verso il proprietario, OpenClaw rifiuta la
richiesta del gruppo e chiede al proprietario di eseguirla da un DM.

Il caricamento Codex approvato chiama `feedback/upload` dell'app-server Codex e
chiede all'app-server di includere i log per ogni thread elencato e per i
sottothread Codex generati, quando disponibili. Il caricamento passa attraverso il
normale percorso di feedback di Codex verso i server OpenAI; se il feedback Codex è
disabilitato in quell'app-server, il comando restituisce l'errore dell'app-server.
La risposta di diagnostica completata elenca i canali, gli ID sessione OpenClaw,
gli ID thread Codex e i comandi locali `codex resume <thread-id>` per i thread
inviati. Se neghi o ignori l'approvazione, OpenClaw non stampa quegli ID Codex.
Questo caricamento non sostituisce l'esportazione diagnostica locale del Gateway.

`/codex resume` scrive lo stesso file di associazione sidecar che l'harness usa per
i turni normali. Al messaggio successivo, OpenClaw riprende quel thread Codex,
passa il modello OpenClaw attualmente selezionato all'app-server e mantiene
abilitata la cronologia estesa.

### Ispezionare un thread Codex dalla CLI

Il modo più rapido per comprendere una run Codex errata è spesso aprire
direttamente il thread Codex nativo:

```sh
codex resume <thread-id>
```

Usalo quando noti un bug in una conversazione di canale e vuoi ispezionare la
sessione Codex problematica, continuarla localmente o chiedere a Codex perché ha
fatto una determinata scelta di strumento o ragionamento. Il percorso più semplice
di solito è eseguire prima `/diagnostics [note]`: dopo l'approvazione, il report
completato elenca ogni thread Codex e stampa un comando `Inspect locally`, ad
esempio `codex resume <thread-id>`. Puoi copiare quel comando direttamente in un
terminale.

Puoi anche ottenere un ID thread da `/codex binding` per la chat corrente o da
`/codex threads [filter]` per i thread recenti dell'app-server Codex, quindi
eseguire lo stesso comando `codex resume` nella tua shell.

La superficie di comando richiede l'app-server Codex `0.125.0` o più recente. I
singoli metodi di controllo vengono segnalati come
`unsupported by this Codex app-server` se un app-server futuro o personalizzato non
espone quel metodo JSON-RPC.

## Confini degli agganci

L'harness Codex ha tre livelli di agganci:

| Livello                               | Proprietario             | Scopo                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Agganci dei Plugin OpenClaw           | OpenClaw                 | Compatibilità prodotto/Plugin tra harness PI e Codex.               |
| Middleware di estensione app-server Codex | Plugin in bundle con OpenClaw | Comportamento dell'adapter per turno attorno agli strumenti dinamici OpenClaw. |
| Agganci nativi Codex                  | Codex                    | Ciclo di vita Codex di basso livello e policy degli strumenti nativi dalla configurazione Codex. |

OpenClaw non usa file Codex `hooks.json` di progetto o globali per instradare il
comportamento dei Plugin OpenClaw. Per il bridge supportato degli strumenti nativi
e delle autorizzazioni, OpenClaw inietta la configurazione Codex per thread per
`PreToolUse`, `PostToolUse`, `PermissionRequest` e `Stop`. Altri agganci Codex
come `SessionStart` e `UserPromptSubmit` restano controlli a livello Codex; non
sono esposti come agganci dei Plugin OpenClaw nel contratto v1.

Per gli strumenti dinamici OpenClaw, OpenClaw esegue lo strumento dopo che Codex
richiede la chiamata, quindi OpenClaw attiva il comportamento di Plugin e middleware
di sua proprietà nell'adapter dell'harness. Per gli strumenti nativi Codex, Codex
possiede il record canonico dello strumento. OpenClaw può rispecchiare eventi
selezionati, ma non può riscrivere il thread Codex nativo a meno che Codex esponga
quell'operazione tramite app-server o callback di agganci nativi.

Le proiezioni di Compaction e del ciclo di vita LLM provengono dalle notifiche
dell'app-server Codex e dallo stato dell'adapter OpenClaw, non da comandi di agganci
nativi Codex. Gli eventi `before_compaction`, `after_compaction`, `llm_input` e
`llm_output` di OpenClaw sono osservazioni a livello adapter, non acquisizioni byte
per byte della richiesta interna di Codex o dei payload di Compaction.

Le notifiche app-server native Codex `hook/started` e `hook/completed` vengono
proiettate come eventi agente `codex_app_server.hook` per traiettoria e debug. Non
invocano gli agganci dei Plugin OpenClaw.

## Contratto di supporto V1

La modalità Codex non è PI con una diversa chiamata al modello sottostante. Codex
possiede una parte maggiore del ciclo del modello nativo e OpenClaw adatta le sue
superfici di Plugin e sessione attorno a quel confine.

Supportato nel runtime Codex v1:

| Superficie                                    | Supporto                                | Perché                                                                                                                                                                                               |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ciclo del modello OpenAI tramite Codex        | Supportato                              | L'app-server Codex possiede il turno OpenAI, la ripresa del thread nativo e la continuazione degli strumenti nativi.                                                                                 |
| Instradamento e consegna dei canali OpenClaw  | Supportato                              | Telegram, Discord, Slack, WhatsApp, iMessage e altri canali restano fuori dal runtime del modello.                                                                                                   |
| Strumenti dinamici OpenClaw                   | Supportato                              | Codex chiede a OpenClaw di eseguire questi strumenti, quindi OpenClaw resta nel percorso di esecuzione.                                                                                              |
| Plugin di prompt e contesto                   | Supportato                              | OpenClaw costruisce overlay di prompt e proietta il contesto nel turno Codex prima di avviare o riprendere il thread.                                                                                |
| Ciclo di vita del motore di contesto          | Supportato                              | Assemblaggio, acquisizione o manutenzione dopo il turno e coordinamento della Compaction del motore di contesto vengono eseguiti per i turni Codex.                                                  |
| Agganci degli strumenti dinamici              | Supportato                              | `before_tool_call`, `after_tool_call` e il middleware dei risultati degli strumenti vengono eseguiti attorno agli strumenti dinamici di proprietà OpenClaw.                                           |
| Agganci del ciclo di vita                     | Supportato come osservazioni dell'adapter | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` vengono attivati con payload onesti della modalità Codex.                                                            |
| Gate di revisione della risposta finale       | Supportato tramite relay dell'aggancio nativo | `Stop` di Codex viene trasmesso a `before_agent_finalize`; `revise` chiede a Codex un ulteriore passaggio del modello prima della finalizzazione.                                                    |
| Blocco o osservazione di shell, patch e MCP nativi | Supportato tramite relay dell'aggancio nativo | `PreToolUse` e `PostToolUse` di Codex vengono trasmessi per le superfici di strumenti nativi confermate, inclusi i payload MCP su app-server Codex `0.125.0` o più recente. Il blocco è supportato; la riscrittura degli argomenti no. |
| Policy di autorizzazione nativa               | Supportato tramite relay dell'aggancio nativo | `PermissionRequest` di Codex può essere instradato tramite la policy OpenClaw dove il runtime lo espone. Se OpenClaw non restituisce alcuna decisione, Codex continua tramite il normale percorso guardian o di approvazione dell'utente. |
| Acquisizione della traiettoria app-server     | Supportato                              | OpenClaw registra la richiesta inviata all'app-server e le notifiche app-server che riceve.                                                                                                          |

Non supportato nel runtime Codex v1:

| Superficie                                         | Limite V1                                                                                                                                      | Percorso futuro                                                                                   |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Mutazione degli argomenti degli strumenti nativi   | Gli hook pre-strumento nativi di Codex possono bloccare, ma OpenClaw non riscrive gli argomenti degli strumenti nativi di Codex.              | Richiede supporto hook/schema di Codex per sostituire l'input dello strumento.                    |
| Cronologia modificabile della trascrizione nativa di Codex | Codex possiede la cronologia canonica del thread nativo. OpenClaw possiede un mirror e può proiettare il contesto futuro, ma non dovrebbe mutare parti interne non supportate. | Aggiungere API esplicite dell'app-server Codex se serve chirurgia sul thread nativo.              |
| `tool_result_persist` per i record degli strumenti nativi di Codex | Quell'hook trasforma le scritture della trascrizione possedute da OpenClaw, non i record degli strumenti nativi di Codex.                    | Potrebbe rispecchiare i record trasformati, ma la riscrittura canonica richiede supporto Codex.   |
| Metadati avanzati della Compaction nativa          | OpenClaw osserva inizio e completamento della Compaction, ma non riceve un elenco stabile di elementi mantenuti/scartati, delta token o payload di riepilogo. | Servono eventi di Compaction Codex più ricchi.                                                     |
| Intervento sulla Compaction                        | Gli hook di Compaction OpenClaw attuali sono a livello di notifica in modalità Codex.                                                          | Aggiungere hook Codex pre/post Compaction se i plugin devono vietare o riscrivere la Compaction nativa. |
| Acquisizione byte per byte della richiesta API del modello | OpenClaw può acquisire richieste e notifiche dell'app-server, ma il core Codex costruisce internamente la richiesta API OpenAI finale.          | Serve un evento di tracciamento della richiesta modello Codex o un'API di debug.                  |

## Strumenti, media e Compaction

L'harness Codex modifica solo l'esecutore embedded agent di basso livello.

OpenClaw continua a costruire l'elenco degli strumenti e riceve i risultati dinamici degli strumenti dall'harness. Testo, immagini, video, musica, TTS, approvazioni e output degli strumenti di messaggistica continuano attraverso il normale percorso di consegna OpenClaw.

Il relay degli hook nativi è intenzionalmente generico, ma il contratto di supporto v1 è limitato ai percorsi degli strumenti e dei permessi nativi di Codex che OpenClaw testa. Nel runtime Codex, questo include shell, patch e payload MCP `PreToolUse`, `PostToolUse` e `PermissionRequest`. Non presumere che ogni futuro evento hook Codex sia una superficie per plugin OpenClaw finché il contratto di runtime non lo nomina.

Per `PermissionRequest`, OpenClaw restituisce decisioni esplicite di consenso o rifiuto solo quando la policy decide. Un risultato senza decisione non è un consenso. Codex lo tratta come assenza di decisione dell'hook e prosegue verso il proprio percorso guardian o di approvazione utente.

Le elicitazioni di approvazione degli strumenti MCP di Codex vengono instradate attraverso il flusso di approvazione dei plugin di OpenClaw quando Codex marca `_meta.codex_approval_kind` come `"mcp_tool_call"`. I prompt Codex `request_user_input` vengono rimandati alla chat di origine, e il successivo messaggio di follow-up in coda risponde a quella richiesta del server nativo invece di essere indirizzato come contesto aggiuntivo. Le altre richieste di elicitazione MCP continuano a fallire in modo chiuso.

Lo steering della coda di esecuzione attiva si mappa su `turn/steer` dell'app-server Codex. Con il valore predefinito `messages.queue.mode: "steer"`, OpenClaw raggruppa i messaggi chat in coda per la finestra di quiete configurata e li invia come un'unica richiesta `turn/steer` in ordine di arrivo. La modalità legacy `queue` invia richieste `turn/steer` separate. I turni di revisione Codex e di Compaction manuale possono rifiutare lo steering nello stesso turno; in quel caso OpenClaw usa la coda followup quando la modalità selezionata consente il fallback. Vedi [Coda di steering](/it/concepts/queue-steering).

Quando il modello selezionato usa l'harness Codex, la Compaction del thread nativo viene delegata all'app-server Codex. OpenClaw mantiene un mirror della trascrizione per cronologia del canale, ricerca, `/new`, `/reset` e futuri cambi di modello o harness. Il mirror include il prompt utente, il testo finale dell'assistente e record leggeri di ragionamento o piano Codex quando l'app-server li emette. Oggi OpenClaw registra solo i segnali di inizio e completamento della Compaction nativa. Non espone ancora un riepilogo della Compaction leggibile da persone o un elenco verificabile delle voci che Codex ha mantenuto dopo la Compaction.

Poiché Codex possiede il thread nativo canonico, `tool_result_persist` attualmente non riscrive i record dei risultati degli strumenti nativi di Codex. Si applica solo quando OpenClaw scrive un risultato strumento della trascrizione di una sessione posseduta da OpenClaw.

La generazione di media non richiede PI. Immagini, video, musica, PDF, TTS e comprensione dei media continuano a usare le impostazioni di provider/modello corrispondenti come `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` e `messages.tts`.

## Risoluzione dei problemi

**Codex non appare come un normale provider `/model`:** questo è previsto per le nuove configurazioni. Seleziona un modello `openai/gpt-*` con `agentRuntime.id: "codex"` (o un riferimento legacy `codex/*`), abilita `plugins.entries.codex.enabled` e controlla se `plugins.allow` esclude `codex`.

**OpenClaw usa PI invece di Codex:** `agentRuntime.id: "auto"` può ancora usare PI come backend di compatibilità quando nessun harness Codex rivendica l'esecuzione. Imposta `agentRuntime.id: "codex"` per forzare la selezione Codex durante i test. Un runtime Codex forzato ora fallisce invece di ripiegare su PI, a meno che tu non imposti esplicitamente `agentRuntime.fallback: "pi"`. Una volta selezionato l'app-server Codex, i suoi errori emergono direttamente senza configurazione di fallback aggiuntiva.

**L'app-server viene rifiutato:** aggiorna Codex affinché l'handshake dell'app-server riporti la versione `0.125.0` o più recente. Prerelease della stessa versione o versioni con suffisso di build come `0.125.0-alpha.2` o `0.125.0+custom` vengono rifiutate perché il livello minimo del protocollo stabile `0.125.0` è quello che OpenClaw testa.

**Il rilevamento dei modelli è lento:** abbassa `plugins.entries.codex.config.discovery.timeoutMs` o disabilita il rilevamento.

**Il trasporto WebSocket fallisce immediatamente:** controlla `appServer.url`, `authToken` e che l'app-server remoto parli la stessa versione del protocollo app-server Codex.

**Un modello non Codex usa PI:** questo è previsto a meno che tu non abbia forzato `agentRuntime.id: "codex"` per quell'agente o selezionato un riferimento legacy `codex/*`. I riferimenti semplici `openai/gpt-*` e di altri provider restano sul loro normale percorso provider in modalità `auto`. Se forzi `agentRuntime.id: "codex"`, ogni turno embedded per quell'agente deve essere un modello OpenAI supportato da Codex.

**Computer Use è installato ma gli strumenti non vengono eseguiti:** controlla `/codex computer-use status` da una nuova sessione. Se uno strumento riporta `Native hook relay unavailable`, usa `/new` o `/reset`; se persiste, riavvia il Gateway per cancellare registrazioni di hook nativi obsolete. Se `computer-use.list_apps` va in timeout, riavvia Codex Computer Use o Codex Desktop e riprova.

## Correlati

- [Plugin harness agente](/it/plugins/sdk-agent-harness)
- [Runtime agente](/it/concepts/agent-runtimes)
- [Provider di modelli](/it/concepts/model-providers)
- [Provider OpenAI](/it/providers/openai)
- [Stato](/it/cli/status)
- [Hook dei plugin](/it/plugins/hooks)
- [Riferimento di configurazione](/it/gateway/configuration-reference)
- [Test](/it/help/testing-live#live-codex-app-server-harness-smoke)
