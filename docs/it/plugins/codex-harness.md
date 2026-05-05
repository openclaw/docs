---
read_when:
    - Vuoi usare l'harness app-server incluso in Codex
    - Ti servono esempi di configurazione dell'harness Codex
    - Vuoi che i deployment solo Codex falliscano invece di eseguire il fallback a PI
summary: Esegui i turni dell'agente incorporato di OpenClaw tramite l'harness app-server Codex incluso
title: Ambiente di esecuzione di Codex
x-i18n:
    generated_at: "2026-05-05T01:48:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76302351e7e162e858dd6e3cffca84b3fd54497dd060104da9f90fe4c1a33f9b
    source_path: plugins/codex-harness.md
    workflow: 16
---

Il Plugin `codex` in bundle consente a OpenClaw di eseguire turni agente incorporati tramite
l'app-server Codex invece dell'harness PI integrato.

Usalo quando vuoi che Codex possieda la sessione agente di basso livello: rilevamento
dei modelli, ripresa nativa del thread, Compaction nativa ed esecuzione app-server.
OpenClaw continua a possedere i canali chat, i file di sessione, la selezione dei modelli, gli strumenti,
le approvazioni, la consegna dei media e il mirror visibile della trascrizione.

Quando un turno chat sorgente viene eseguito tramite l'harness Codex, le risposte visibili usano per impostazione predefinita
lo strumento `message` di OpenClaw se la distribuzione non ha configurato esplicitamente
`messages.visibleReplies`. L'agente può comunque completare privatamente il proprio turno Codex;
pubblica nel canale solo quando chiama `message(action="send")`. Imposta
`messages.visibleReplies: "automatic"` per mantenere le risposte finali delle chat dirette nel
percorso di consegna automatica legacy.

Anche i turni Heartbeat di Codex ricevono per impostazione predefinita lo strumento `heartbeat_respond`, così
l'agente può registrare se il risveglio deve restare silenzioso o inviare una notifica senza codificare
quel flusso di controllo nel testo finale.

La guida all'iniziativa specifica per Heartbeat viene inviata come istruzione sviluppatore in modalità collaborazione
di Codex direttamente nel turno Heartbeat. I turni chat ordinari ripristinano
la modalità Codex Default invece di portare la filosofia Heartbeat nel loro normale
prompt runtime.

Se stai cercando di orientarti, inizia da
[Runtime agente](/it/concepts/agent-runtimes). La versione breve è:
`openai/gpt-5.5` è il riferimento modello, `codex` è il runtime, e Telegram,
Discord, Slack o un altro canale resta la superficie di comunicazione.

## Configurazione rapida

La maggior parte degli utenti che vuole "Codex in OpenClaw" vuole questo percorso: accedere con un
abbonamento ChatGPT/Codex, poi eseguire turni agente incorporati tramite il runtime nativo
app-server Codex. Il riferimento modello resta comunque canonico come
`openai/gpt-*`; l'autenticazione dell'abbonamento arriva dall'account/profilo Codex, non
da un prefisso modello `openai-codex/*`.

Prima accedi con Codex OAuth se non l'hai già fatto:

```bash
openclaw models auth login --provider openai-codex
```

Poi abilita il Plugin `codex` in bundle e forza il runtime Codex:

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

Non usare `openai-codex/gpt-*` quando intendi il runtime nativo Codex. Quel prefisso
è il percorso esplicito "Codex OAuth tramite PI". Le modifiche alla configurazione si applicano a sessioni nuove o
reimpostate; le sessioni esistenti mantengono il runtime registrato.

## Cosa modifica questo Plugin

Il Plugin `codex` in bundle contribuisce diverse capacità separate:

| Capacità                          | Come la usi                                         | Cosa fa                                                                       |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime incorporato nativo        | `agentRuntime.id: "codex"`                          | Esegue i turni agente incorporati di OpenClaw tramite app-server Codex.        |
| Comandi nativi di controllo chat  | `/codex bind`, `/codex resume`, `/codex steer`, ... | Associa e controlla i thread app-server Codex da una conversazione di messaggistica. |
| Provider/catalogo app-server Codex | interni `codex`, esposti tramite l'harness          | Consente al runtime di rilevare e validare i modelli app-server.              |
| Percorso di comprensione media Codex | percorsi di compatibilità modello immagine `codex/*` | Esegue turni app-server Codex limitati per i modelli di comprensione immagini supportati. |
| Relay hook nativo                 | Hook Plugin intorno a eventi nativi Codex           | Consente a OpenClaw di osservare/bloccare eventi supportati di strumenti/finalizzazione nativi Codex. |

Abilitare il Plugin rende disponibili queste capacità. Non:

- inizia a usare Codex per ogni modello OpenAI
- converte riferimenti modello `openai-codex/*` nel runtime nativo
- rende ACP/acpx il percorso Codex predefinito
- cambia a caldo le sessioni esistenti che hanno già registrato un runtime PI
- sostituisce la consegna canale di OpenClaw, i file di sessione, l'archiviazione dei profili di autenticazione o
  il routing dei messaggi

Lo stesso Plugin possiede anche la superficie nativa dei comandi di controllo chat `/codex`. Se
il Plugin è abilitato e l'utente chiede di associare, riprendere, guidare, fermare o ispezionare
thread Codex dalla chat, gli agenti dovrebbero preferire `/codex ...` rispetto ad ACP. ACP resta
il fallback esplicito quando l'utente chiede ACP/acpx o sta testando l'adattatore ACP
Codex.

I turni nativi Codex mantengono gli hook Plugin di OpenClaw come livello pubblico di compatibilità.
Questi sono hook OpenClaw in-process, non hook di comando Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` per record di trascrizione duplicati nel mirror
- `before_agent_finalize` tramite relay `Stop` di Codex
- `agent_end`

I Plugin possono anche registrare middleware di risultato strumento neutrale rispetto al runtime per riscrivere
i risultati degli strumenti dinamici di OpenClaw dopo che OpenClaw esegue lo strumento e prima che il
risultato venga restituito a Codex. Questo è separato dall'hook Plugin pubblico
`tool_result_persist`, che trasforma le scritture dei risultati strumento nella trascrizione possedute da OpenClaw.

Per la semantica degli hook Plugin stessi, vedi [Hook Plugin](/it/plugins/hooks)
e [Comportamento di guardia Plugin](/it/tools/plugin).

L'harness è disattivato per impostazione predefinita. Le nuove configurazioni dovrebbero mantenere canonici i riferimenti modello OpenAI
come `openai/gpt-*` e forzare esplicitamente
`agentRuntime.id: "codex"` o `OPENCLAW_AGENT_RUNTIME=codex` quando
vogliono l'esecuzione nativa app-server. I riferimenti modello legacy `codex/*` selezionano ancora automaticamente
l'harness per compatibilità, ma i prefissi provider legacy supportati dal runtime non sono
mostrati come normali scelte modello/provider.

Se il Plugin `codex` è abilitato ma il modello principale è ancora
`openai-codex/*`, `openclaw doctor` avvisa invece di modificare il percorso. È
intenzionale: `openai-codex/*` resta il percorso PI Codex OAuth/abbonamento, e
l'esecuzione nativa app-server resta una scelta runtime esplicita.

## Mappa dei percorsi

Usa questa tabella prima di modificare la configurazione:

| Comportamento desiderato                         | Riferimento modello        | Configurazione runtime                | Percorso autenticazione/profilo | Etichetta di stato prevista    |
| ------------------------------------------------ | -------------------------- | ------------------------------------- | ------------------------------- | ------------------------------ |
| Abbonamento ChatGPT/Codex con runtime nativo Codex | `openai/gpt-*`             | `agentRuntime.id: "codex"`            | Codex OAuth o account Codex     | `Runtime: OpenAI Codex`        |
| API OpenAI tramite normale runner OpenClaw       | `openai/gpt-*`             | omesso o `runtime: "pi"`              | Chiave API OpenAI               | `Runtime: OpenClaw Pi Default` |
| Abbonamento ChatGPT/Codex tramite PI             | `openai-codex/gpt-*`       | omesso o `runtime: "pi"`              | Provider OpenAI Codex OAuth     | `Runtime: OpenClaw Pi Default` |
| Provider misti con modalità automatica conservativa | riferimenti specifici del provider | `agentRuntime.id: "auto"`             | Per provider selezionato        | Dipende dal runtime selezionato |
| Sessione adattatore Codex ACP esplicita          | dipende da prompt/modello ACP | `sessions_spawn` con `runtime: "acp"` | Autenticazione backend ACP      | Stato attività/sessione ACP    |

La distinzione importante è provider contro runtime:

- `openai-codex/*` risponde a "quale percorso provider/autenticazione dovrebbe usare PI?"
- `agentRuntime.id: "codex"` risponde a "quale loop dovrebbe eseguire questo
  turno incorporato?"
- `/codex ...` risponde a "a quale conversazione nativa Codex questa chat dovrebbe associarsi
  o quale dovrebbe controllare?"
- ACP risponde a "quale processo harness esterno dovrebbe avviare acpx?"

## Scegli il prefisso modello corretto

I percorsi della famiglia OpenAI sono specifici per prefisso. Per la configurazione comune con abbonamento più
runtime nativo Codex, usa `openai/*` con `agentRuntime.id: "codex"`.
Usa `openai-codex/*` solo quando vuoi intenzionalmente Codex OAuth tramite PI:

| Riferimento modello                           | Percorso runtime                             | Quando usarlo                                                             |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Provider OpenAI tramite impianto OpenClaw/PI | Vuoi l'accesso attuale diretto all'API OpenAI Platform con `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth tramite OpenClaw/PI       | Vuoi l'autenticazione con abbonamento ChatGPT/Codex con il runner PI predefinito. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness app-server Codex                     | Vuoi l'autenticazione con abbonamento ChatGPT/Codex con esecuzione nativa Codex. |

GPT-5.5 può comparire sia nei percorsi diretti con chiave API OpenAI sia nei percorsi con abbonamento Codex
quando il tuo account li espone. Usa `openai/gpt-5.5` con l'harness app-server Codex
per il runtime nativo Codex, `openai-codex/gpt-5.5` per PI OAuth, oppure
`openai/gpt-5.5` senza override runtime Codex per traffico diretto con chiave API.

I riferimenti legacy `codex/gpt-*` restano accettati come alias di compatibilità. La migrazione di compatibilità
di Doctor riscrive i riferimenti runtime principali legacy in riferimenti modello canonici
e registra separatamente la policy runtime, mentre i riferimenti legacy solo di fallback
restano invariati perché il runtime è configurato per l'intero contenitore agente.
Le nuove configurazioni PI Codex OAuth dovrebbero usare `openai-codex/gpt-*`; le nuove configurazioni native
con harness app-server dovrebbero usare `openai/gpt-*` più
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` segue la stessa distinzione per prefisso. Usa
`openai-codex/gpt-*` quando la comprensione immagini deve passare attraverso il percorso provider OpenAI
Codex OAuth. Usa `codex/gpt-*` quando la comprensione immagini deve essere eseguita
tramite un turno app-server Codex limitato. Il modello app-server Codex deve
dichiarare il supporto per input immagine; i modelli Codex solo testo falliscono prima che il turno media
inizi.

Usa `/status` per confermare l'harness effettivo per la sessione corrente. Se la
selezione sorprende, abilita il logging di debug per il sottosistema `agents/harness`
e ispeziona il record strutturato `agent harness selected` del Gateway. Include
l'id dell'harness selezionato, il motivo della selezione, la policy runtime/fallback e,
in modalità `auto`, il risultato del supporto di ogni candidato Plugin.

### Cosa significano gli avvisi di Doctor

`openclaw doctor` avvisa quando tutte queste condizioni sono vere:

- il Plugin `codex` in bundle è abilitato o consentito
- il modello principale di un agente è `openai-codex/*`
- il runtime effettivo di quell'agente non è `codex`

Quell'avviso esiste perché gli utenti spesso si aspettano che "Plugin Codex abilitato" implichi
"runtime nativo app-server Codex." OpenClaw non fa quel salto. L'avviso
significa:

- **Non è richiesta alcuna modifica** se intendevi ChatGPT/Codex OAuth tramite PI.
- Cambia il modello in `openai/<model>` e imposta
  `agentRuntime.id: "codex"` se intendevi l'esecuzione nativa app-server.
- Le sessioni esistenti hanno comunque bisogno di `/new` o `/reset` dopo una modifica runtime,
  perché i pin del runtime di sessione sono persistenti.

La selezione dell'harness non è un controllo live della sessione. Quando viene eseguito un turno incorporato,
OpenClaw registra l'id dell'harness selezionato su quella sessione e continua a usarlo per
i turni successivi nello stesso id sessione. Modifica la configurazione `agentRuntime` o
`OPENCLAW_AGENT_RUNTIME` quando vuoi che le sessioni future usino un altro harness;
usa `/new` o `/reset` per avviare una nuova sessione prima di passare una conversazione esistente
tra PI e Codex. Questo evita di rieseguire una trascrizione tramite
due sistemi di sessione nativi incompatibili.

Le sessioni legacy create prima dei pin dell'harness vengono trattate come vincolate a PI una volta che
hanno una cronologia della trascrizione. Usa `/new` o `/reset` per includere quella conversazione in
Codex dopo aver modificato la configurazione.

`/status` mostra il runtime effettivo del modello. L'harness PI predefinito appare come
`Runtime: OpenClaw Pi Default`, e l'harness app-server di Codex appare come
`Runtime: OpenAI Codex`.

## Requisiti

- OpenClaw con il Plugin `codex` in bundle disponibile.
- App-server Codex `0.125.0` o più recente. Il Plugin in bundle gestisce per impostazione predefinita un binario app-server
  Codex compatibile, quindi i comandi `codex` locali in `PATH` non
  influenzano il normale avvio dell'harness.
- Autenticazione Codex disponibile per il processo app-server o per il bridge di autenticazione Codex di OpenClaw.
  Gli avvii locali dell'app-server usano una home Codex gestita da OpenClaw per ciascun
  agente e un `HOME` figlio isolato, quindi per impostazione predefinita non leggono il tuo account
  personale `~/.codex`, Skills, plugin, configurazione, stato dei thread o
  `$HOME/.agents/skills` nativo.

Il Plugin blocca gli handshake app-server più vecchi o senza versione. Questo mantiene
OpenClaw sulla superficie di protocollo rispetto alla quale è stato testato.

Per i test live e smoke Docker, l'autenticazione di solito proviene dall'account CLI Codex
o da un profilo di autenticazione OpenClaw `openai-codex`. Gli avvii locali dell'app-server stdio possono
anche ripiegare su `CODEX_API_KEY` / `OPENAI_API_KEY` quando non è presente alcun account.

## File di bootstrap dell'area di lavoro

Codex gestisce autonomamente `AGENTS.md` tramite il rilevamento nativo dei documenti di progetto. OpenClaw
non scrive file sintetici di documentazione di progetto Codex né dipende dai nomi file di fallback Codex
per i file persona, perché i fallback Codex si applicano solo quando
`AGENTS.md` manca.

Per la parità dell'area di lavoro OpenClaw, l'harness Codex risolve gli altri file di bootstrap
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` e `MEMORY.md` quando presenti) e li inoltra tramite le istruzioni di configurazione Codex
su `thread/start` e `thread/resume`. Questo mantiene
`SOUL.md` e il relativo contesto persona/profilo dell'area di lavoro visibili senza
duplicare `AGENTS.md`.

## Aggiungere Codex accanto ad altri modelli

Non impostare `agentRuntime.id: "codex"` globalmente se lo stesso agente deve poter passare liberamente
tra Codex e modelli di provider non Codex. Un runtime forzato si applica a ogni
turno incorporato per quell'agente o sessione. Se selezioni un modello Anthropic mentre
quel runtime è forzato, OpenClaw prova comunque l'harness Codex e fallisce in modo chiuso
invece di instradare silenziosamente quel turno tramite PI.

Usa invece una di queste forme:

- Metti Codex su un agente dedicato con `agentRuntime.id: "codex"`.
- Mantieni l'agente predefinito su `agentRuntime.id: "auto"` e il fallback PI per il normale uso misto
  dei provider.
- Usa i riferimenti legacy `codex/*` solo per compatibilità. Le nuove configurazioni dovrebbero preferire
  `openai/*` più una policy di runtime Codex esplicita.

Ad esempio, questo mantiene l'agente predefinito sulla normale selezione automatica e
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

- L'agente predefinito `main` usa il percorso provider normale e il fallback di compatibilità PI.
- L'agente `codex` usa l'harness app-server Codex.
- Se Codex manca o non è supportato per l'agente `codex`, il turno fallisce
  invece di usare PI silenziosamente.

## Instradamento dei comandi degli agenti

Gli agenti dovrebbero instradare le richieste utente in base all'intento, non solo alla parola "Codex":

| L'utente chiede di...                                  | L'agente dovrebbe usare...                       |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Vincola questa chat a Codex"                          | `/codex bind`                                    |
| "Riprendi qui il thread Codex `<id>`"                  | `/codex resume <id>`                             |
| "Mostra i thread Codex"                                | `/codex threads`                                 |
| "Apri una segnalazione di supporto per un'esecuzione Codex non riuscita" | `/diagnostics [note]`                            |
| "Invia feedback Codex solo per questo thread allegato" | `/codex diagnostics [note]`                      |
| "Usa il mio abbonamento ChatGPT/Codex con il runtime Codex" | `openai/*` più `agentRuntime.id: "codex"`        |
| "Usa il mio abbonamento ChatGPT/Codex tramite PI"      | riferimenti modello `openai-codex/*`             |
| "Esegui Codex tramite ACP/acpx"                        | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Avvia Claude Code/Gemini/OpenCode/Cursor in un thread" | ACP/acpx, non `/codex` e non sub-agenti nativi  |

OpenClaw pubblicizza agli agenti le indicazioni di spawn ACP solo quando ACP è abilitato,
distribuibile e supportato da un backend di runtime caricato. Se ACP non è disponibile,
il prompt di sistema e le Skills del Plugin non dovrebbero istruire l'agente sull'instradamento
ACP.

## Distribuzioni solo Codex

Forza l'harness Codex quando devi dimostrare che ogni turno di agente incorporato
usa Codex. I runtime Plugin espliciti falliscono in modo chiuso e non vengono mai ritentati
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

Con Codex forzato, OpenClaw fallisce in anticipo se il Plugin Codex è disabilitato, se
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
secondo necessità. `/reset` cancella il vincolo della sessione OpenClaw per quel thread
e consente al turno successivo di risolvere di nuovo l'harness dalla configurazione corrente.

## Rilevamento dei modelli

Per impostazione predefinita, il Plugin Codex chiede all'app-server i modelli disponibili. Se
il rilevamento fallisce o scade, usa un catalogo di fallback in bundle per:

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

Disabilita il rilevamento quando vuoi che l'avvio eviti di sondare Codex e si attenga al
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

Per impostazione predefinita, il Plugin avvia localmente il binario Codex gestito da OpenClaw con:

```bash
codex app-server --listen stdio://
```

Il binario gestito viene distribuito con il pacchetto Plugin `codex`. Questo mantiene la
versione dell'app-server legata al Plugin in bundle invece che a qualsiasi CLI Codex separata
eventualmente installata localmente. Imposta `appServer.command` solo quando
vuoi intenzionalmente eseguire un eseguibile diverso.

Per impostazione predefinita, OpenClaw avvia le sessioni locali dell'harness Codex in modalità YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Questa è la postura dell'operatore locale fidato usata
per Heartbeat autonomi: Codex può usare strumenti shell e di rete senza
fermarsi sui prompt di approvazione nativi a cui nessuno è presente per rispondere.

Per optare per approvazioni Codex revisionate dal guardian, imposta `appServer.mode:
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
uscire dalla sandbox, scrivere fuori dall'area di lavoro o aggiungere permessi come l'accesso
alla rete, Codex instrada quella richiesta di approvazione al revisore nativo invece che a un
prompt umano. Il revisore applica il framework di rischio di Codex e approva o nega
la richiesta specifica. Usa Guardian quando vuoi più guardrail rispetto alla modalità YOLO
ma hai comunque bisogno che agenti non presidiati procedano.

Il preset `guardian` si espande in `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"`.
I singoli campi di policy continuano a sovrascrivere `mode`, quindi le distribuzioni avanzate possono combinare
il preset con scelte esplicite. Il valore di revisore precedente `guardian_subagent` è
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

Gli avvii stdio dell'app-server ereditano per impostazione predefinita l'ambiente di processo di OpenClaw,
ma OpenClaw possiede il bridge dell'account app-server Codex e imposta sia
`CODEX_HOME` sia `HOME` su directory per agente nello stato OpenClaw di quell'agente.
Il loader Skills di Codex legge `$CODEX_HOME/skills` e
`$HOME/.agents/skills`, quindi entrambi i valori sono isolati per gli avvii locali dell'app-server.
Questo mantiene Skills, plugin, configurazione, account e stato dei thread nativi Codex
circoscritti all'agente OpenClaw invece di farli trapelare dalla home personale
della CLI Codex dell'operatore.

I Plugin OpenClaw e gli snapshot delle Skills OpenClaw continuano a passare attraverso il registro Plugin e il loader Skills
propri di OpenClaw. Gli asset personali della CLI Codex no. Se hai
Skills o plugin utili della CLI Codex che dovrebbero diventare parte di un agente OpenClaw,
inventariali esplicitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Il provider di migrazione Codex copia le Skills nell'area di lavoro dell'agente OpenClaw corrente.
Plugin nativi Codex, hook e file di configurazione vengono segnalati o archiviati
per revisione manuale invece di essere attivati automaticamente, perché possono
eseguire comandi, esporre server MCP o contenere credenziali.

L'autenticazione viene selezionata in questo ordine:

1. Un profilo di autenticazione OpenClaw Codex esplicito per l'agente.
2. L'account esistente dell'app-server nella home Codex di quell'agente.
3. Solo per gli avvii locali dell'app-server stdio, `CODEX_API_KEY`, quindi
   `OPENAI_API_KEY`, quando non è presente alcun account app-server e l'autenticazione OpenAI è
   ancora richiesta.

Quando OpenClaw vede un profilo di autenticazione Codex in stile abbonamento ChatGPT, rimuove
`CODEX_API_KEY` e `OPENAI_API_KEY` dal processo figlio Codex generato. Questo
mantiene disponibili le chiavi API a livello Gateway per embedding o modelli OpenAI diretti
senza fare in modo che i turni nativi dell'app-server Codex vengano fatturati per errore tramite l'API.
I profili Codex espliciti con chiave API e il fallback locale con chiave env stdio usano il login
dell'app-server invece dell'ambiente ereditato del processo figlio. Le connessioni WebSocket all'app-server
non ricevono il fallback con chiave API env del Gateway; usa un profilo di autenticazione esplicito o
l'account proprio dell'app-server remoto.

Se una distribuzione richiede un ulteriore isolamento dell'ambiente, aggiungi quelle variabili a
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

`appServer.clearEnv` influisce solo sul processo figlio dell'app-server Codex avviato.

Gli strumenti dinamici di Codex usano per impostazione predefinita il profilo `native-first`. In questa modalità,
OpenClaw non espone strumenti dinamici che duplicano le operazioni native Codex
sul workspace: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` e
`update_plan`. Gli strumenti di integrazione OpenClaw come messaggistica, sessioni, media,
cron, browser, nodi, gateway, `heartbeat_respond` e `web_search` restano
disponibili.

Campi supportati del plugin Codex al livello superiore:

| Campo                      | Predefinito       | Significato                                                                               |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Usa `"openclaw-compat"` per esporre all'app-server Codex il set completo di strumenti dinamici OpenClaw. |
| `codexDynamicToolsExclude` | `[]`             | Nomi aggiuntivi di strumenti dinamici OpenClaw da omettere dai turni dell'app-server Codex. |

Campi `appServer` supportati:

| Campo               | Predefinito                             | Significato                                                                                                                                                                                                                          |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` avvia Codex; `"websocket"` si connette a `url`.                                                                                                                                                                             |
| `command`           | binario Codex gestito                    | Eseguibile per il trasporto stdio. Lascialo non impostato per usare il binario gestito; impostalo solo per una sostituzione esplicita.                                                                                                |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argomenti per il trasporto stdio.                                                                                                                                                                                                    |
| `url`               | non impostato                            | URL WebSocket dell'app-server.                                                                                                                                                                                                        |
| `authToken`         | non impostato                            | Token bearer per il trasporto WebSocket.                                                                                                                                                                                             |
| `headers`           | `{}`                                     | Header WebSocket aggiuntivi.                                                                                                                                                                                                         |
| `clearEnv`          | `[]`                                     | Nomi di variabili d'ambiente aggiuntive rimosse dal processo app-server stdio avviato dopo che OpenClaw costruisce l'ambiente ereditato. `CODEX_HOME` e `HOME` sono riservati all'isolamento Codex per agente di OpenClaw negli avvii locali. |
| `requestTimeoutMs`  | `60000`                                  | Timeout per le chiamate al control plane dell'app-server.                                                                                                                                                                            |
| `mode`              | `"yolo"`                                 | Preset per l'esecuzione YOLO o revisionata dal guardian.                                                                                                                                                                             |
| `approvalPolicy`    | `"never"`                                | Policy di approvazione nativa Codex inviata ad avvio/ripresa/turno del thread.                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | Modalità sandbox nativa Codex inviata ad avvio/ripresa del thread.                                                                                                                                                                   |
| `approvalsReviewer` | `"user"`                                 | Usa `"auto_review"` per lasciare che Codex revisioni i prompt di approvazione nativi. `guardian_subagent` resta un alias legacy.                                                                                                     |
| `serviceTier`       | non impostato                            | Tier di servizio opzionale dell'app-server Codex: `"fast"`, `"flex"` o `null`. I valori legacy non validi vengono ignorati.                                                                                                          |

Le chiamate agli strumenti dinamici di proprietà di OpenClaw sono limitate indipendentemente da
`appServer.requestTimeoutMs`: ogni richiesta Codex `item/tool/call` deve ricevere
una risposta OpenClaw entro 30 secondi. Al timeout, OpenClaw interrompe il segnale
dello strumento dove supportato e restituisce a Codex una risposta di strumento dinamico non riuscita, così
il turno può continuare invece di lasciare la sessione in `processing`.

Dopo che OpenClaw risponde a una richiesta app-server Codex con ambito di turno, anche l'harness
si aspetta che Codex completi il turno nativo con `turn/completed`. Se
l'app-server resta silenzioso per 60 secondi dopo quella risposta, OpenClaw prova al meglio a
interrompere il turno Codex, registra un timeout diagnostico e libera la corsia della sessione
OpenClaw in modo che i messaggi chat successivi non vengano accodati dietro un turno nativo
obsoleto.

Le sostituzioni d'ambiente restano disponibili per i test locali:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` aggira il binario gestito quando
`appServer.command` non è impostato.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` è stato rimosso. Usa invece
`plugins.entries.codex.config.appServer.mode: "guardian"` oppure
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` per test locali una tantum. La configurazione è
preferibile per distribuzioni ripetibili perché mantiene il comportamento del plugin nello
stesso file revisionato del resto della configurazione dell'harness Codex.

## Uso del computer

Computer Use è trattato nella propria guida di configurazione:
[Codex Computer Use](/it/plugins/codex-computer-use).

In breve: OpenClaw non include come vendored l'app di controllo desktop né esegue
azioni desktop direttamente. Prepara l'app-server Codex, verifica che il server MCP
`computer-use` sia disponibile e poi lascia che Codex gestisca le chiamate agli strumenti MCP
nativi durante i turni in modalità Codex.

Per l'accesso diretto al driver TryCua fuori dal flusso del marketplace Codex, registra
`cua-driver mcp` con `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Vedi [Codex Computer Use](/it/plugins/codex-computer-use) per la distinzione
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

Computer Use è specifico per macOS e può richiedere permessi locali del sistema operativo prima che il
server MCP Codex possa controllare le app. Se `computerUse.enabled` è true e il server MCP
non è disponibile, i turni in modalità Codex falliscono prima dell'avvio del thread invece di
essere eseguiti silenziosamente senza gli strumenti Computer Use nativi. Vedi
[Codex Computer Use](/it/plugins/codex-computer-use) per le scelte del marketplace,
i limiti del catalogo remoto, i motivi dello stato e la risoluzione dei problemi.

Quando `computerUse.autoInstall` è true, OpenClaw può registrare il marketplace standard
Codex Desktop in bundle da
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` se Codex
non ha ancora individuato un marketplace locale. Usa `/new` o `/reset` dopo
aver cambiato runtime o configurazione di Computer Use, così le sessioni esistenti non mantengono un vecchio
vincolo di thread PI o Codex.

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

Approvazioni Codex revisionate dal guardian:

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
a un thread Codex esistente, il turno successivo invia nuovamente all'app-server il modello
OpenAI, il provider, la policy di approvazione, la sandbox e il tier di servizio
attualmente selezionati. Il passaggio da `openai/gpt-5.5` a `openai/gpt-5.2` mantiene il
vincolo del thread ma chiede a Codex di continuare con il modello appena selezionato.

## Comando Codex

Il plugin in bundle registra `/codex` come comando slash autorizzato. È
generico e funziona su qualsiasi canale che supporti i comandi testuali OpenClaw.

Forme comuni:

- `/codex status` mostra connettività live dell'app-server, modelli, account, limiti di frequenza, server MCP e Skills.
- `/codex models` elenca i modelli live dell'app-server Codex.
- `/codex threads [filter]` elenca i thread Codex recenti.
- `/codex resume <thread-id>` collega la sessione OpenClaw corrente a un thread Codex esistente.
- `/codex compact` chiede all'app-server Codex di compattare il thread collegato.
- `/codex review` avvia la revisione nativa di Codex per il thread collegato.
- `/codex diagnostics [note]` chiede conferma prima di inviare feedback diagnostico Codex per il thread collegato.
- `/codex computer-use status` controlla il Plugin Computer Use configurato e il server MCP.
- `/codex computer-use install` installa il Plugin Computer Use configurato e ricarica i server MCP.
- `/codex account` mostra lo stato dell'account e dei limiti di frequenza.
- `/codex mcp` elenca lo stato dei server MCP dell'app-server Codex.
- `/codex skills` elenca le Skills dell'app-server Codex.

Quando Codex segnala un errore di limite di utilizzo, OpenClaw include l'ora del prossimo
reset dell'app-server quando Codex ne ha fornita una. Usa `/codex account` nella stessa
conversazione per ispezionare l'account corrente e le finestre dei limiti di frequenza.

### Flusso di debug comune

Quando un agente basato su Codex fa qualcosa di inatteso in Telegram, Discord, Slack,
o in un altro canale, inizia dalla conversazione in cui si è verificato il problema:

1. Esegui `/diagnostics bad tool choice after image upload` o un'altra breve nota
   che descriva ciò che hai visto.
2. Approva una volta la richiesta di diagnostica. L'approvazione crea lo zip di diagnostica
   locale del Gateway e, poiché la sessione usa l'harness Codex, invia anche
   il bundle di feedback Codex pertinente ai server OpenAI.
3. Copia la risposta diagnostica completata nel report del bug o nel thread di supporto.
   Include il percorso del bundle locale, il riepilogo sulla privacy, gli id sessione OpenClaw,
   gli id thread Codex e una riga `Inspect locally` per ogni thread Codex.
4. Se vuoi eseguire il debug della run autonomamente, esegui il comando `Inspect locally`
   stampato in un terminale. Ha l'aspetto di `codex resume <thread-id>` e apre il
   thread Codex nativo così puoi ispezionare la conversazione, continuarla localmente,
   o chiedere a Codex perché ha scelto un determinato strumento o piano.

Usa `/codex diagnostics [note]` solo quando vuoi specificamente il caricamento del
feedback Codex per il thread attualmente collegato senza il bundle completo di diagnostica
del Gateway OpenClaw. Per la maggior parte dei report di supporto, `/diagnostics [note]` è
il punto di partenza migliore perché lega insieme lo stato del Gateway locale e gli id
thread Codex in un'unica risposta. Consulta [Esportazione diagnostica](/it/gateway/diagnostics)
per il modello di privacy completo e il comportamento nelle chat di gruppo.

Il core OpenClaw espone anche `/diagnostics [note]` solo per i proprietari come comando
generale di diagnostica del Gateway. Il prompt di approvazione mostra il preambolo sui dati
sensibili, collega a [Esportazione diagnostica](/it/gateway/diagnostics), e richiede
`openclaw gateway diagnostics export --json` tramite approvazione exec esplicita
ogni volta. Non approvare la diagnostica con una regola allow-all. Dopo l'approvazione,
OpenClaw invia un report incollabile con il percorso del bundle locale e il riepilogo
del manifesto. Quando la sessione OpenClaw attiva usa l'harness Codex, quella
stessa approvazione autorizza anche l'invio dei bundle di feedback Codex pertinenti ai
server OpenAI. Il prompt di approvazione dice che il feedback Codex verrà inviato, ma
non elenca id sessione o thread Codex prima dell'approvazione.

Se `/diagnostics` viene invocato da un proprietario in una chat di gruppo, OpenClaw mantiene
pulito il canale condiviso: il gruppo riceve solo un breve avviso, mentre il
preambolo diagnostico, i prompt di approvazione e gli id sessione/thread Codex vengono inviati al
proprietario tramite il percorso di approvazione privato. Se non esiste un percorso privato verso il proprietario,
OpenClaw rifiuta la richiesta di gruppo e chiede al proprietario di eseguirla da un DM.

Il caricamento Codex approvato chiama `feedback/upload` dell'app-server Codex e chiede
all'app-server di includere i log per ogni thread elencato e per i sottothread Codex generati
quando disponibili. Il caricamento passa attraverso il normale percorso di feedback di Codex verso i server
OpenAI; se il feedback Codex è disabilitato in quell'app-server, il comando restituisce
l'errore dell'app-server. La risposta diagnostica completata elenca i canali,
gli id sessione OpenClaw, gli id thread Codex e i comandi locali `codex resume <thread-id>`
per i thread inviati. Se rifiuti o ignori l'approvazione,
OpenClaw non stampa quegli id Codex. Questo caricamento non sostituisce l'esportazione
diagnostica locale del Gateway.

`/codex resume` scrive lo stesso file di associazione sidecar che l'harness usa per
i turni normali. Al messaggio successivo, OpenClaw riprende quel thread Codex, passa il
modello OpenClaw attualmente selezionato all'app-server e mantiene abilitata la cronologia
estesa.

### Ispezionare un thread Codex dalla CLI

Il modo più rapido per capire una run Codex errata è spesso aprire direttamente il
thread Codex nativo:

```sh
codex resume <thread-id>
```

Usalo quando noti un bug in una conversazione di canale e vuoi ispezionare la
sessione Codex problematica, continuarla localmente, o chiedere a Codex perché ha fatto una
specifica scelta di strumento o ragionamento. Il percorso più semplice di solito è eseguire
prima `/diagnostics [note]`: dopo l'approvazione, il report completato elenca
ogni thread Codex e stampa un comando `Inspect locally`, per esempio
`codex resume <thread-id>`. Puoi copiare quel comando direttamente in un terminale.

Puoi anche ottenere un id thread da `/codex binding` per la chat corrente o
`/codex threads [filter]` per i thread recenti dell'app-server Codex, quindi eseguire lo stesso
comando `codex resume` nella tua shell.

La superficie dei comandi richiede l'app-server Codex `0.125.0` o più recente. I singoli
metodi di controllo vengono segnalati come `unsupported by this Codex app-server` se un
app-server futuro o personalizzato non espone quel metodo JSON-RPC.

## Confini degli hook

L'harness Codex ha tre livelli di hook:

| Livello                               | Proprietario             | Scopo                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook dei plugin OpenClaw              | OpenClaw                 | Compatibilità prodotto/plugin tra harness PI e Codex.               |
| Middleware di estensione dell'app-server Codex | Plugin inclusi in OpenClaw | Comportamento dell'adapter per turno intorno agli strumenti dinamici OpenClaw. |
| Hook nativi Codex                     | Codex                    | Ciclo di vita Codex di basso livello e policy degli strumenti nativi dalla configurazione Codex. |

OpenClaw non usa file `hooks.json` Codex di progetto o globali per instradare
il comportamento dei plugin OpenClaw. Per il bridge supportato di strumenti nativi e autorizzazioni,
OpenClaw inietta configurazione Codex per thread per `PreToolUse`, `PostToolUse`,
`PermissionRequest` e `Stop`. Altri hook Codex come `SessionStart` e
`UserPromptSubmit` restano controlli a livello Codex; non sono esposti come
hook di plugin OpenClaw nel contratto v1.

Per gli strumenti dinamici OpenClaw, OpenClaw esegue lo strumento dopo che Codex richiede la
chiamata, quindi OpenClaw attiva il comportamento di plugin e middleware che possiede
nell'adapter dell'harness. Per gli strumenti nativi Codex, Codex possiede il record canonico dello strumento.
OpenClaw può rispecchiare eventi selezionati, ma non può riscrivere il thread Codex
nativo a meno che Codex non esponga quell'operazione tramite app-server o callback
di hook nativi.

Compaction e le proiezioni del ciclo di vita LLM provengono dalle notifiche dell'app-server Codex
e dallo stato dell'adapter OpenClaw, non dai comandi hook nativi Codex.
Gli eventi `before_compaction`, `after_compaction`, `llm_input` e
`llm_output` di OpenClaw sono osservazioni a livello di adapter, non acquisizioni byte per byte
della richiesta interna di Codex o dei payload di Compaction.

Le notifiche app-server native Codex `hook/started` e `hook/completed` vengono
proiettate come eventi agente `codex_app_server.hook` per traiettoria e debug.
Non invocano hook dei plugin OpenClaw.

## Contratto di supporto V1

La modalità Codex non è PI con una chiamata modello diversa sotto. Codex possiede una parte maggiore
del loop modello nativo, e OpenClaw adatta le sue superfici di plugin e sessione
intorno a quel confine.

Supportato in runtime Codex v1:

| Superficie                                    | Supporto                                | Perché                                                                                                                                                                                               |
| --------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop modello OpenAI tramite Codex             | Supportato                              | L'app-server Codex possiede il turno OpenAI, la ripresa del thread nativo e la continuazione dello strumento nativo.                                                                                 |
| Routing e consegna dei canali OpenClaw        | Supportato                              | Telegram, Discord, Slack, WhatsApp, iMessage e altri canali restano fuori dal runtime modello.                                                                                                       |
| Strumenti dinamici OpenClaw                   | Supportato                              | Codex chiede a OpenClaw di eseguire questi strumenti, quindi OpenClaw resta nel percorso di esecuzione.                                                                                              |
| Plugin di prompt e contesto                   | Supportato                              | OpenClaw costruisce overlay di prompt e proietta il contesto nel turno Codex prima di avviare o riprendere il thread.                                                                                |
| Ciclo di vita del motore di contesto          | Supportato                              | Assemblaggio, ingestione o manutenzione post-turno e coordinamento della Compaction del motore di contesto vengono eseguiti per i turni Codex.                                                       |
| Hook degli strumenti dinamici                 | Supportato                              | `before_tool_call`, `after_tool_call` e il middleware del risultato dello strumento vengono eseguiti intorno agli strumenti dinamici posseduti da OpenClaw.                                           |
| Hook del ciclo di vita                        | Supportati come osservazioni dell'adapter | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` si attivano con payload onesti in modalità Codex.                                                                  |
| Gate di revisione della risposta finale       | Supportato tramite il relay hook nativo | Codex `Stop` viene inoltrato a `before_agent_finalize`; `revise` chiede a Codex un altro passaggio modello prima della finalizzazione.                                                               |
| Shell, patch e blocco o osservazione MCP nativi | Supportati tramite il relay hook nativo | Codex `PreToolUse` e `PostToolUse` vengono inoltrati per superfici di strumenti nativi confermate, inclusi payload MCP su app-server Codex `0.125.0` o più recente. Il blocco è supportato; la riscrittura degli argomenti no. |
| Policy di autorizzazione nativa               | Supportata tramite il relay hook nativo | Codex `PermissionRequest` può essere instradata attraverso la policy OpenClaw dove il runtime la espone. Se OpenClaw non restituisce alcuna decisione, Codex continua attraverso il normale percorso guardian o di approvazione utente. |
| Acquisizione della traiettoria dell'app-server | Supportata                              | OpenClaw registra la richiesta che ha inviato all'app-server e le notifiche dell'app-server che riceve.                                                                                              |

Non supportato in runtime Codex v1:

| Superficie                                          | Limite V1                                                                                                                                       | Percorso futuro                                                                           |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutazione degli argomenti degli strumenti nativi    | Gli hook pre-strumento nativi di Codex possono bloccare, ma OpenClaw non riscrive gli argomenti degli strumenti nativi di Codex.               | Richiede il supporto di hook/schema di Codex per sostituire l'input dello strumento.      |
| Cronologia modificabile della trascrizione nativa di Codex | Codex possiede la cronologia canonica del thread nativo. OpenClaw possiede un mirror e può proiettare il contesto futuro, ma non deve mutare elementi interni non supportati. | Aggiungere API esplicite dell'app-server Codex se è necessario intervenire chirurgicamente sul thread nativo. |
| `tool_result_persist` per record di strumenti nativi di Codex | Quell'hook trasforma le scritture della trascrizione possedute da OpenClaw, non i record di strumenti nativi di Codex.                         | Potrebbe creare un mirror dei record trasformati, ma la riscrittura canonica richiede il supporto di Codex. |
| Metadati avanzati di Compaction nativa              | OpenClaw osserva l'inizio e il completamento della Compaction, ma non riceve un elenco stabile di elementi mantenuti/scartati, un delta di token o un payload di riepilogo. | Richiede eventi di Compaction Codex più ricchi.                                           |
| Intervento sulla Compaction                         | Gli hook di Compaction OpenClaw attuali sono a livello di notifica in modalità Codex.                                                           | Aggiungere hook pre/post Compaction di Codex se i plugins devono porre veto o riscrivere la Compaction nativa. |
| Acquisizione byte-per-byte della richiesta API del modello | OpenClaw può acquisire richieste e notifiche dell'app-server, ma il core Codex costruisce internamente la richiesta API OpenAI finale.          | Richiede un evento di tracciamento delle richieste modello di Codex o un'API di debug.    |

## Strumenti, media e Compaction

L'harness Codex modifica solo l'esecutore dell'agente embedded di basso livello.

OpenClaw continua a costruire l'elenco degli strumenti e riceve risultati dinamici degli strumenti dall'harness. Testo, immagini, video, musica, TTS, approvazioni e output dello strumento di messaggistica continuano a passare attraverso il normale percorso di consegna OpenClaw.

Il relay degli hook nativi è intenzionalmente generico, ma il contratto di supporto v1 è limitato ai percorsi di strumenti nativi e permessi di Codex che OpenClaw testa. Nel runtime Codex, questo include payload shell, patch e MCP `PreToolUse`, `PostToolUse` e `PermissionRequest`. Non presumere che ogni futuro evento hook Codex sia una superficie Plugin OpenClaw finché il contratto runtime non lo nomina.

Per `PermissionRequest`, OpenClaw restituisce solo decisioni esplicite di autorizzazione o negazione quando la policy decide. Un risultato senza decisione non è un'autorizzazione. Codex lo tratta come assenza di decisione dell'hook e passa al proprio guardian o al percorso di approvazione dell'utente.

Le richieste di approvazione degli strumenti MCP di Codex vengono instradate attraverso il flusso di approvazione Plugin di OpenClaw quando Codex marca `_meta.codex_approval_kind` come `"mcp_tool_call"`. I prompt Codex `request_user_input` vengono inviati di nuovo alla chat di origine, e il successivo messaggio di follow-up in coda risponde a quella richiesta del server nativo invece di essere indirizzato come contesto extra. Le altre richieste di sollecitazione MCP continuano a fallire in modo chiuso.

L'instradamento della coda delle esecuzioni attive si mappa su `turn/steer` dell'app-server Codex. Con il valore predefinito `messages.queue.mode: "steer"`, OpenClaw raggruppa i messaggi chat in coda per la finestra di quiete configurata e li invia come una singola richiesta `turn/steer` in ordine di arrivo. La modalità legacy `queue` invia richieste `turn/steer` separate. I turni di revisione Codex e Compaction manuale possono rifiutare lo steering nello stesso turno, nel qual caso OpenClaw usa la coda di follow-up quando la modalità selezionata consente il fallback. Vedi [Coda di steering](/it/concepts/queue-steering).

Quando il modello selezionato usa l'harness Codex, la Compaction del thread nativo viene delegata all'app-server Codex. OpenClaw mantiene un mirror della trascrizione per la cronologia del canale, la ricerca, `/new`, `/reset` e futuri cambi di modello o harness. Il mirror include il prompt dell'utente, il testo finale dell'assistente e record leggeri di ragionamento o piano di Codex quando l'app-server li emette. Oggi, OpenClaw registra solo i segnali di inizio e completamento della Compaction nativa. Non espone ancora un riepilogo della Compaction leggibile da una persona o un elenco verificabile di quali voci Codex ha mantenuto dopo la Compaction.

Poiché Codex possiede il thread nativo canonico, `tool_result_persist` attualmente non riscrive i record dei risultati degli strumenti nativi di Codex. Si applica solo quando OpenClaw sta scrivendo un risultato di strumento della trascrizione di sessione posseduta da OpenClaw.

La generazione di media non richiede PI. Immagini, video, musica, PDF, TTS e comprensione dei media continuano a usare le impostazioni provider/modello corrispondenti, come `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` e `messages.tts`.

## Risoluzione dei problemi

**Codex non appare come un normale provider `/model`:** questo è previsto per le nuove configurazioni. Seleziona un modello `openai/gpt-*` con `agentRuntime.id: "codex"` (o un ref legacy `codex/*`), abilita `plugins.entries.codex.enabled` e controlla se `plugins.allow` esclude `codex`.

**OpenClaw usa PI invece di Codex:** `agentRuntime.id: "auto"` può ancora usare PI come backend di compatibilità quando nessun harness Codex prende in carico l'esecuzione. Imposta `agentRuntime.id: "codex"` per forzare la selezione di Codex durante i test. Un runtime Codex forzato fallisce invece di ripiegare su PI. Una volta selezionato l'app-server Codex, i suoi errori emergono direttamente.

**L'app-server viene rifiutato:** aggiorna Codex in modo che l'handshake dell'app-server riporti la versione `0.125.0` o più recente. Prerelease della stessa versione o versioni con suffisso di build come `0.125.0-alpha.2` o `0.125.0+custom` vengono rifiutate perché il limite minimo del protocollo stabile `0.125.0` è ciò che OpenClaw testa.

**Il rilevamento dei modelli è lento:** riduci `plugins.entries.codex.config.discovery.timeoutMs` o disabilita il rilevamento.

**Il trasporto WebSocket fallisce immediatamente:** controlla `appServer.url`, `authToken` e che l'app-server remoto parli la stessa versione del protocollo app-server Codex.

**Un modello non Codex usa PI:** questo è previsto a meno che tu non abbia forzato `agentRuntime.id: "codex"` per quell'agente o selezionato un ref legacy `codex/*`. I normali ref `openai/gpt-*` e di altri provider restano sul loro percorso provider normale in modalità `auto`. Se forzi `agentRuntime.id: "codex"`, ogni turno embedded per quell'agente deve essere un modello OpenAI supportato da Codex.

**Computer Use è installato ma gli strumenti non vengono eseguiti:** controlla `/codex computer-use status` da una nuova sessione. Se uno strumento segnala `Native hook relay unavailable`, usa `/new` o `/reset`; se persiste, riavvia il gateway per cancellare registrazioni stale degli hook nativi. Se `computer-use.list_apps` va in timeout, riavvia Codex Computer Use o Codex Desktop e riprova.

## Correlati

- [Plugins harness agente](/it/plugins/sdk-agent-harness)
- [Runtime agente](/it/concepts/agent-runtimes)
- [Provider di modelli](/it/concepts/model-providers)
- [Provider OpenAI](/it/providers/openai)
- [Stato](/it/cli/status)
- [Hook Plugin](/it/plugins/hooks)
- [Riferimento configurazione](/it/gateway/configuration-reference)
- [Test](/it/help/testing-live#live-codex-app-server-harness-smoke)
