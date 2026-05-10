---
read_when:
    - Stai modificando il runtime dell'agente integrato o il registro degli ambienti di esecuzione
    - Stai registrando un ambiente di esecuzione per agenti da un Plugin incluso o attendibile
    - Devi capire come il Plugin Codex si relaziona ai provider di modelli
sidebarTitle: Agent Harness
summary: Interfaccia SDK sperimentale per i plugin che sostituiscono l'esecutore dell'agente incorporato di basso livello
title: Plugin dell'harness dell'agente
x-i18n:
    generated_at: "2026-05-10T19:45:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1685af479a8502ac743b0f520f0afae2cdc905524e48b3a84ce95ffe85c8fb49
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Un **agent harness** è l'esecutore di basso livello per un singolo turno preparato di un agente OpenClaw. Non è un provider di modelli, non è un canale e non è un registro di strumenti.
Per il modello mentale rivolto all'utente, consulta [Runtime degli agenti](/it/concepts/agent-runtimes).

Usa questa superficie solo per plugin nativi in bundle o attendibili. Il contratto è ancora sperimentale perché i tipi dei parametri rispecchiano intenzionalmente l'attuale runner incorporato.

## Quando usare un harness

Registra un agent harness quando una famiglia di modelli ha il proprio runtime di sessione nativo e il normale trasporto provider di OpenClaw è l'astrazione sbagliata.

Esempi:

- un server nativo per agenti di codifica che possiede thread e compaction
- una CLI locale o un daemon che deve trasmettere in streaming eventi nativi di piano/ragionamento/strumenti
- un runtime di modello che necessita del proprio resume id oltre alla trascrizione della sessione OpenClaw

Non registrare **un harness** solo per aggiungere una nuova API LLM. Per normali API di modelli HTTP o WebSocket, crea un [plugin provider](/it/plugins/sdk-provider-plugins).

## Cosa possiede ancora il core

Prima che venga selezionato un harness, OpenClaw ha già risolto:

- provider e modello
- stato di autenticazione del runtime
- livello di thinking e budget di contesto
- file di trascrizione/sessione OpenClaw
- workspace, sandbox e criterio degli strumenti
- callback di risposta del canale e callback di streaming
- fallback del modello e criterio di cambio modello live

Questa separazione è intenzionale. Un harness esegue un tentativo preparato; non sceglie i provider, non sostituisce la consegna del canale e non cambia modello silenziosamente.

Il tentativo preparato include anche `params.runtimePlan`, un bundle di criteri di proprietà di OpenClaw per decisioni di runtime che devono restare condivise tra PI e harness nativi:

- `runtimePlan.tools.normalize(...)` e
  `runtimePlan.tools.logDiagnostics(...)` per il criterio dello schema strumenti consapevole del provider
- `runtimePlan.transcript.resolvePolicy(...)` per la sanitizzazione della trascrizione e il criterio di riparazione delle chiamate agli strumenti
- `runtimePlan.delivery.isSilentPayload(...)` per la soppressione condivisa di consegna `NO_REPLY` e media
- `runtimePlan.outcome.classifyRunResult(...)` per la classificazione del fallback del modello
- `runtimePlan.observability` per metadati risolti di provider/modello/harness

Gli harness possono usare il piano per decisioni che devono corrispondere al comportamento di PI, ma devono comunque trattarlo come stato del tentativo di proprietà dell'host. Non modificarlo né usarlo per cambiare provider/modelli all'interno di un turno.

## Registrare un harness

**Import:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Criterio di selezione

OpenClaw sceglie un harness dopo la risoluzione di provider/modello:

1. Vince il criterio di runtime con ambito sul modello.
2. Segue il criterio di runtime con ambito sul provider.
3. `auto` chiede agli harness registrati se supportano il provider/modello risolto.
4. Se nessun harness registrato corrisponde, OpenClaw usa PI a meno che il fallback PI non sia disabilitato.

Gli errori degli harness dei plugin emergono come errori di esecuzione. In modalità `auto`, il fallback PI viene usato solo quando nessun harness di plugin registrato supporta il provider/modello risolto. Una volta che un harness di plugin ha rivendicato un'esecuzione, OpenClaw non ripete lo stesso turno tramite PI perché ciò può cambiare la semantica di autenticazione/runtime o duplicare effetti collaterali.

I pin di runtime a livello di intera sessione e di intero agente vengono ignorati dalla selezione. Questo include valori `agentHarnessId` di sessione obsoleti, `agents.defaults.agentRuntime`, `agents.list[].agentRuntime` e `OPENCLAW_AGENT_RUNTIME`. `/status` mostra il runtime effettivo selezionato dalla route provider/modello.
Se l'harness selezionato sorprende, abilita il logging di debug `agents/harness` e ispeziona il record strutturato `agent harness selected` del gateway. Include l'id dell'harness selezionato, il motivo della selezione, il criterio di runtime/fallback e, in modalità `auto`, il risultato di supporto di ogni candidato plugin.

Il plugin Codex in bundle registra `codex` come id del proprio harness. Il core lo tratta come un normale id di harness di plugin; gli alias specifici di Codex appartengono al plugin o alla configurazione dell'operatore, non al selettore di runtime condiviso.

## Associazione provider più harness

La maggior parte degli harness dovrebbe registrare anche un provider. Il provider rende visibili al resto di OpenClaw i riferimenti dei modelli, lo stato di autenticazione, i metadati dei modelli e la selezione `/model`. L'harness quindi rivendica quel provider in `supports(...)`.

Il plugin Codex in bundle segue questo pattern:

- riferimenti del modello utente preferiti: `openai/gpt-5.5`
- riferimenti di compatibilità: i riferimenti legacy `codex/gpt-*` restano accettati, ma le nuove configurazioni non dovrebbero usarli come normali riferimenti provider/modello
- id harness: `codex`
- auth: disponibilità provider sintetica, perché l'harness Codex possiede il login/sessione nativo Codex
- richiesta app-server: OpenClaw invia l'id del modello puro a Codex e lascia che l'harness parli con il protocollo app-server nativo

Il plugin Codex è additivo. I semplici riferimenti agente `openai/gpt-*` sul provider OpenAI ufficiale selezionano per impostazione predefinita l'harness Codex. I riferimenti `codex/gpt-*` più vecchi selezionano ancora il provider e l'harness Codex per compatibilità.

Per la configurazione dell'operatore, esempi di prefissi modello e configurazioni solo Codex, consulta [Harness Codex](/it/plugins/codex-harness).

OpenClaw richiede Codex app-server `0.125.0` o versione successiva. Il plugin Codex controlla l'handshake di inizializzazione dell'app-server e blocca server più vecchi o senza versione, così OpenClaw viene eseguito solo sulla superficie di protocollo con cui è stato testato. Il requisito minimo `0.125.0` include il supporto per payload hook MCP nativi arrivato in Codex `0.124.0`, fissando al contempo OpenClaw alla linea stabile testata più recente.

### Middleware dei risultati degli strumenti

I plugin in bundle possono collegare middleware runtime-neutral per i risultati degli strumenti tramite `api.registerAgentToolResultMiddleware(...)` quando il loro manifest dichiara gli id di runtime target in `contracts.agentToolResultMiddleware`. Questo seam attendibile è per trasformazioni asincrone dei risultati degli strumenti che devono essere eseguite prima che PI o Codex reinseriscano l'output dello strumento nel modello.

I plugin legacy in bundle possono ancora usare `api.registerCodexAppServerExtensionFactory(...)` per middleware solo Codex app-server, ma le nuove trasformazioni dei risultati dovrebbero usare l'API runtime-neutral.
L'hook solo Pi `api.registerEmbeddedExtensionFactory(...)` è stato rimosso; le trasformazioni dei risultati degli strumenti Pi devono usare middleware runtime-neutral.

### Classificazione dell'esito terminale

Gli harness nativi che possiedono la propria proiezione di protocollo possono usare `classifyAgentHarnessTerminalOutcome(...)` da `openclaw/plugin-sdk/agent-harness-runtime` quando un turno completato non ha prodotto testo dell'assistente visibile. L'helper restituisce `empty`, `reasoning-only` o `planning-only` affinché il criterio di fallback di OpenClaw possa decidere se riprovare su un modello diverso. Lascia intenzionalmente non classificati errori di prompt, turni in corso e risposte silenziose intenzionali come `NO_REPLY`.

### Modalità harness Codex nativo

L'harness `codex` in bundle è la modalità Codex nativa per i turni agente OpenClaw incorporati. Abilita prima il plugin `codex` in bundle e includi `codex` in `plugins.allow` se la tua configurazione usa un'allowlist restrittiva. Le configurazioni app-server native dovrebbero usare `openai/gpt-*`; i turni agente OpenAI selezionano per impostazione predefinita l'harness Codex. Le route legacy `openai-codex/*` dovrebbero essere riparate con `openclaw doctor --fix`, e i riferimenti modello legacy `codex/*` restano alias di compatibilità per l'harness nativo.

Quando questa modalità viene eseguita, Codex possiede l'id del thread nativo, il comportamento di ripresa, compaction e l'esecuzione dell'app-server. OpenClaw possiede ancora il canale chat, il mirror della trascrizione visibile, il criterio degli strumenti, le approvazioni, la consegna dei media e la selezione della sessione. Usa provider/modello `agentRuntime.id: "codex"` quando devi provare che solo il percorso Codex app-server può rivendicare l'esecuzione. I runtime plugin espliciti falliscono in modo chiuso; errori di selezione Codex app-server ed errori di runtime non vengono ritentati tramite PI.

## Rigidità del runtime

Per impostazione predefinita, OpenClaw usa il criterio di runtime provider/modello `auto`: gli harness di plugin registrati possono rivendicare una coppia provider/modello e PI gestisce il turno quando nessuno corrisponde. I riferimenti agente OpenAI sul provider OpenAI ufficiale usano Codex per impostazione predefinita.
Usa un runtime plugin provider/modello esplicito come `agentRuntime.id: "codex"` quando la mancata selezione dell'harness dovrebbe fallire invece di essere instradata tramite PI. Gli errori degli harness di plugin selezionati falliscono sempre in modo rigido. Questo non blocca un provider/modello esplicito `agentRuntime.id: "pi"`.

Per esecuzioni incorporate solo Codex:

```json
{
  "models": {
    "providers": {
      "openai": {
        "agentRuntime": {
          "id": "codex"
        }
      }
    }
  },
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5"
    }
  }
}
```

Se vuoi un backend CLI per un modello canonico, metti il runtime su quella voce modello:

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-7",
      "models": {
        "anthropic/claude-opus-4-7": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

Le sostituzioni per agente usano la stessa forma con ambito sul modello:

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "models": {
          "openai/gpt-5.5": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

Gli esempi legacy di runtime a livello di intero agente come questo vengono ignorati:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

Con un runtime plugin esplicito, una sessione fallisce in anticipo quando l'harness richiesto non è registrato, non supporta il provider/modello risolto o fallisce prima di produrre effetti collaterali del turno. Questo è intenzionale per distribuzioni solo Codex e per test live che devono dimostrare che il percorso Codex app-server è effettivamente in uso.

Questa impostazione controlla solo l'agent harness incorporato. Non disabilita il routing di modelli specifici del provider per immagini, video, musica, TTS, PDF o altro.

## Sessioni native e mirror della trascrizione

Un harness può mantenere un id sessione nativo, id thread o token di ripresa lato daemon. Mantieni quell'associazione esplicitamente collegata alla sessione OpenClaw e continua a fare il mirror dell'output assistente/strumento visibile all'utente nella trascrizione OpenClaw.

La trascrizione OpenClaw resta il livello di compatibilità per:

- cronologia della sessione visibile al canale
- ricerca e indicizzazione della trascrizione
- ritorno all'harness PI integrato in un turno successivo
- comportamento generico di `/new`, `/reset` ed eliminazione della sessione

Se il tuo harness memorizza un'associazione sidecar, implementa `reset(...)` affinché OpenClaw possa cancellarla quando la sessione OpenClaw proprietaria viene reimpostata.

## Risultati di strumenti e media

Il core costruisce l'elenco degli strumenti OpenClaw e lo passa al tentativo preparato. Quando un harness esegue una chiamata dinamica a uno strumento, restituisci il risultato dello strumento tramite la forma del risultato dell'harness invece di inviare media al canale direttamente.

Questo mantiene output di testo, immagini, video, musica, TTS, approvazioni e strumenti di messaggistica sullo stesso percorso di consegna delle esecuzioni supportate da PI.

## Limitazioni attuali

- Il percorso di import pubblico è generico, ma alcuni alias di tipi tentativo/risultato portano ancora nomi `Pi` per compatibilità.
- L'installazione di harness di terze parti è sperimentale. Preferisci i plugin provider finché non hai bisogno di un runtime di sessione nativo.
- Il cambio di harness è supportato tra turni. Non cambiare harness a metà di un turno dopo che strumenti nativi, approvazioni, testo dell'assistente o invii di messaggi sono iniziati.

## Correlati

- [Panoramica dell'SDK](/it/plugins/sdk-overview)
- [Helper di runtime](/it/plugins/sdk-runtime)
- [Plugin dei provider](/it/plugins/sdk-provider-plugins)
- [Harness Codex](/it/plugins/codex-harness)
- [Provider di modelli](/it/concepts/model-providers)
