---
read_when:
    - Stai modificando il runtime dell'agente incorporato o il registro degli harness
    - Stai registrando un harness agente da un Plugin incluso o attendibile
    - Devi comprendere in che modo il Plugin Codex si relaziona ai provider di modelli
sidebarTitle: Agent Harness
summary: Superficie SDK sperimentale per Plugin che sostituiscono l'esecutore agent incorporato di basso livello
title: Plugin per harness agenti
x-i18n:
    generated_at: "2026-06-27T18:00:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a368ae480c31c86c30786f91e5cf451c3489c681be8ee3955c1c2bd55e4b49e9
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Un **harness agente** è l'esecutore a basso livello per un singolo turno preparato di un agente OpenClaw.
Non è un provider di modelli, non è un canale e non è un registro di strumenti.
Per il modello mentale rivolto all'utente, consulta [Runtime agenti](/it/concepts/agent-runtimes).

Usa questa superficie solo per plugin nativi integrati o attendibili. Il contratto è
ancora sperimentale perché i tipi dei parametri rispecchiano intenzionalmente il runner
incorporato attuale.

## Quando usare un harness

Registra un harness agente quando una famiglia di modelli ha il proprio runtime
di sessione nativo e il normale trasporto provider di OpenClaw è l'astrazione sbagliata.

Esempi:

- un server agente di coding nativo che possiede thread e Compaction
- una CLI locale o un daemon che deve trasmettere in streaming eventi nativi di piano/ragionamento/strumenti
- un runtime di modelli che necessita del proprio ID di ripresa oltre alla trascrizione
  della sessione OpenClaw

**Non** registrare un harness solo per aggiungere una nuova API LLM. Per le normali API
di modelli HTTP o WebSocket, crea un [plugin provider](/it/plugins/sdk-provider-plugins).

## Cosa continua a possedere il core

Prima che venga selezionato un harness, OpenClaw ha già risolto:

- provider e modello
- stato di autenticazione del runtime
- livello di thinking e budget di contesto
- file di trascrizione/sessione OpenClaw
- workspace, sandbox e policy degli strumenti
- callback di risposta del canale e callback di streaming
- policy di fallback del modello e di cambio modello live

Questa separazione è intenzionale. Un harness esegue un tentativo preparato; non sceglie
provider, non sostituisce la consegna del canale e non cambia silenziosamente modello.

Il tentativo preparato include anche `params.runtimePlan`, un bundle di policy
di proprietà di OpenClaw per decisioni di runtime che devono restare condivise tra OpenClaw
e gli harness nativi:

- `runtimePlan.tools.normalize(...)` e
  `runtimePlan.tools.logDiagnostics(...)` per la policy dello schema strumenti consapevole del provider
- `runtimePlan.transcript.resolvePolicy(...)` per la sanificazione della trascrizione e
  la policy di riparazione delle chiamate agli strumenti
- `runtimePlan.delivery.isSilentPayload(...)` per `NO_REPLY` condiviso e la soppressione
  della consegna media
- `runtimePlan.outcome.classifyRunResult(...)` per la classificazione del fallback del modello
- `runtimePlan.observability` per metadati provider/modello/harness risolti

Gli harness possono usare il piano per decisioni che devono corrispondere al comportamento di OpenClaw, ma
devono comunque trattarlo come stato del tentativo di proprietà dell'host. Non modificarlo né usarlo per
cambiare provider/modelli all'interno di un turno.

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

## Policy di selezione

OpenClaw sceglie un harness dopo la risoluzione provider/modello:

1. La policy di runtime con ambito modello ha la precedenza.
2. Segue la policy di runtime con ambito provider.
3. `auto` chiede agli harness registrati se supportano il
   provider/modello risolto.
4. Se nessun harness registrato corrisponde, OpenClaw usa il proprio runtime incorporato.

Gli errori degli harness dei plugin emergono come errori di esecuzione. In modalità `auto`, il fallback incorporato è
usato solo quando nessun harness di plugin registrato supporta il
provider/modello risolto. Una volta che un harness di plugin ha preso in carico un'esecuzione, OpenClaw non
riproduce lo stesso turno tramite un altro runtime perché questo può modificare
la semantica di autenticazione/runtime o duplicare effetti collaterali.

I pin di runtime a livello di intera sessione e intero agente sono ignorati dalla selezione. Questo
include valori obsoleti di sessione `agentHarnessId`, `agents.defaults.agentRuntime`,
`agents.list[].agentRuntime` e `OPENCLAW_AGENT_RUNTIME`. `/status` mostra il
runtime effettivo selezionato dalla rotta provider/modello.
Se l'harness selezionato è inatteso, abilita il logging di debug `agents/harness` e
ispeziona il record strutturato `agent harness selected` del Gateway. Include
l'ID dell'harness selezionato, il motivo della selezione, la policy di runtime/fallback e, in
modalità `auto`, il risultato di supporto di ciascun candidato plugin.

Il plugin Codex integrato registra `codex` come ID del proprio harness. Il core lo tratta
come un normale ID di harness di plugin; gli alias specifici di Codex appartengono al plugin
o alla configurazione dell'operatore, non al selettore di runtime condiviso.

## Abbinamento provider più harness

La maggior parte degli harness dovrebbe registrare anche un provider. Il provider rende visibili al resto di
OpenClaw i riferimenti modello, lo stato di autenticazione, i metadati del modello e la selezione `/model`.
L'harness quindi prende in carico quel provider in `supports(...)`.

Il plugin Codex integrato segue questo schema:

- riferimenti modello utente preferiti: `openai/gpt-5.5`
- riferimenti di compatibilità: i riferimenti legacy `codex/gpt-*` restano accettati, ma le nuove
  configurazioni non dovrebbero usarli come normali riferimenti provider/modello
- ID harness: `codex`
- autenticazione: disponibilità provider sintetica, perché l'harness Codex possiede il
  login/sessione nativo Codex
- richiesta app-server: OpenClaw invia l'ID modello nudo a Codex e lascia che
  l'harness parli con il protocollo app-server nativo

Il plugin Codex è additivo. I semplici riferimenti agente `openai/gpt-*` sul provider ufficiale
OpenAI selezionano per impostazione predefinita l'harness Codex. I riferimenti più vecchi `codex/gpt-*`
selezionano ancora il provider e l'harness Codex per compatibilità.

Per la configurazione dell'operatore, esempi di prefissi modello e configurazioni solo Codex, consulta
[Harness Codex](/it/plugins/codex-harness).

OpenClaw richiede Codex app-server `0.125.0` o più recente. Il plugin Codex controlla
l'handshake di inizializzazione dell'app-server e blocca server più vecchi o senza versione, così
OpenClaw viene eseguito solo sulla superficie di protocollo con cui è stato testato. Il
minimo `0.125.0` include il supporto al payload dell'hook MCP nativo arrivato in
Codex `0.124.0`, vincolando al contempo OpenClaw alla linea stabile testata più recente.

### Middleware dei risultati degli strumenti

I plugin integrati e i plugin installati esplicitamente abilitati con contratti manifest
corrispondenti possono collegare middleware dei risultati degli strumenti neutrale rispetto al runtime tramite
`api.registerAgentToolResultMiddleware(...)` quando il loro manifest dichiara gli
ID runtime mirati in `contracts.agentToolResultMiddleware`. Questa superficie attendibile
è per trasformazioni asincrone dei risultati degli strumenti che devono essere eseguite prima che OpenClaw o Codex
reinseriscano l'output degli strumenti nel modello.

I plugin integrati legacy possono ancora usare
`api.registerCodexAppServerExtensionFactory(...)` per middleware solo app-server Codex,
ma le nuove trasformazioni dei risultati dovrebbero usare l'API neutrale rispetto al runtime.
L'hook solo runner incorporato `api.registerEmbeddedExtensionFactory(...)` è stato rimosso;
le trasformazioni dei risultati degli strumenti incorporate devono usare middleware neutrale rispetto al runtime.

### Classificazione dell'esito terminale

Gli harness nativi che possiedono la propria proiezione di protocollo possono usare
`classifyAgentHarnessTerminalOutcome(...)` da
`openclaw/plugin-sdk/agent-harness-runtime` quando un turno completato non ha prodotto
testo assistente visibile. L'helper restituisce `empty`, `reasoning-only` o
`planning-only` così la policy di fallback di OpenClaw può decidere se riprovare su un
modello diverso. `planning-only` richiede il campo esplicito `planText` dell'harness;
OpenClaw non lo deduce dalla prosa dell'assistente. L'helper lascia intenzionalmente
non classificati errori di prompt, turni in corso e risposte intenzionalmente silenziose come
`NO_REPLY`.

### Effetti collaterali di fine agente

Gli harness nativi devono chiamare `runAgentEndSideEffects(...)` da
`openclaw/plugin-sdk/agent-harness-runtime` dopo aver finalizzato un tentativo. Questo
invia l'hook portabile `agent_end` e la cattura di ricerca di OpenClaw senza
ritardare le risposte interattive. Usa `awaitAgentEndSideEffects(...)` per esecuzioni locali,
non interattive, in cui il tentativo non deve risolversi finché quegli effetti collaterali
non terminano. Entrambi gli helper accettano lo stesso payload `{ event, ctx }` di
`runAgentHarnessAgentEndHook(...)`; i loro errori non alterano il risultato del tentativo
completato.

### Input utente e superfici strumenti

Gli harness nativi che espongono una richiesta di input utente a livello runtime dovrebbero usare gli
helper di input utente da `openclaw/plugin-sdk/agent-harness-runtime` per formattare
il prompt, consegnarlo tramite il percorso di risposta bloccante di OpenClaw e normalizzare
le risposte a scelta/libere nella forma di risposta nativa del runtime. L'helper
mantiene coerente la presentazione canale/TUI mentre ciascun harness conserva il proprio
parsing di protocollo e ciclo di vita delle richieste pendenti.

Gli harness nativi che necessitano di routing compatto degli strumenti in stile PI dovrebbero usare
`createAgentHarnessToolSurfaceRuntime(...)` da
`openclaw/plugin-sdk/agent-harness-tool-runtime`. Possiede la selezione del controllo
tool-search/code-mode, i default snelli del modello locale,
il filtraggio dello schema compatibile con il runtime, l'esecuzione del catalogo nascosto, l'idratazione
delle directory e la pulizia del catalogo. Gli harness continuano a possedere la conversione degli strumenti
specifica del loro SDK e la callback di esecuzione nativa.

### Modalità harness Codex nativa

L'harness integrato `codex` è la modalità Codex nativa per i turni agente OpenClaw
incorporati. Abilita prima il plugin integrato `codex` e includi `codex` in
`plugins.allow` se la tua configurazione usa una allowlist restrittiva. Le configurazioni app-server
native dovrebbero usare `openai/gpt-*`; i turni agente OpenAI selezionano l'harness Codex
per impostazione predefinita. Le rotte di riferimenti modello Codex legacy dovrebbero essere riparate con
`openclaw doctor --fix` e i riferimenti modello legacy `codex/*` restano alias di compatibilità
per l'harness nativo.

Quando questa modalità è in esecuzione, Codex possiede l'ID thread nativo, il comportamento di ripresa,
Compaction e l'esecuzione app-server. OpenClaw continua a possedere il canale chat,
il mirror della trascrizione visibile, la policy degli strumenti, le approvazioni, la consegna media e la selezione
della sessione. Usa provider/modello `agentRuntime.id: "codex"` quando devi provare
che solo il percorso app-server Codex può prendere in carico l'esecuzione. I runtime plugin espliciti
falliscono in modo chiuso; gli errori di selezione app-server Codex e gli errori di runtime non vengono
ritentati tramite un altro runtime.

## Rigidità del runtime

Per impostazione predefinita, OpenClaw usa la policy di runtime provider/modello `auto`: gli harness
di plugin registrati possono prendere in carico una coppia provider/modello e il runtime incorporato
gestisce il turno quando nessuno corrisponde. I riferimenti agente OpenAI sul provider OpenAI ufficiale usano Codex come default.
Usa un runtime di plugin provider/modello esplicito come
`agentRuntime.id: "codex"` quando la mancata selezione dell'harness dovrebbe fallire invece
di passare attraverso il runtime incorporato. Gli errori degli harness plugin selezionati falliscono sempre
in modo netto. Questo non blocca un `agentRuntime.id: "openclaw"` provider/modello esplicito.

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

Se vuoi un backend CLI per un modello canonico, inserisci il runtime in quella
voce modello:

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-8",
      "models": {
        "anthropic/claude-opus-4-8": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

Gli override per agente usano la stessa forma con ambito modello:

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

Gli esempi di runtime legacy a livello di intero agente come questo sono ignorati:

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

Con un runtime Plugin esplicito, una sessione fallisce in anticipo quando l'harness richiesto
non è registrato, non supporta il provider/modello risolto oppure
fallisce prima di produrre effetti collaterali del turno. Questo è intenzionale per le distribuzioni
solo Codex e per i test live che devono dimostrare che il percorso app-server Codex è
effettivamente in uso.

Questa impostazione controlla solo l'harness agente incorporato. Non disabilita
il routing dei modelli specifico del provider per immagini, video, musica, TTS, PDF o altri contenuti.

## Sessioni native e mirror della trascrizione

Un harness può mantenere un id sessione nativo, un id thread o un token di ripresa lato daemon.
Mantieni quell'associazione esplicitamente collegata alla sessione OpenClaw e continua a
rispecchiare l'output assistente/tool visibile all'utente nella trascrizione OpenClaw.

La trascrizione OpenClaw rimane il livello di compatibilità per:

- cronologia della sessione visibile nel canale
- ricerca e indicizzazione della trascrizione
- ritorno all'harness OpenClaw integrato in un turno successivo
- comportamento generico di `/new`, `/reset` ed eliminazione della sessione

Se il tuo harness archivia un'associazione sidecar, implementa `reset(...)` in modo che OpenClaw possa
cancellarla quando la sessione OpenClaw proprietaria viene reimpostata.

## Risultati di tool e media

Il core costruisce l'elenco dei tool OpenClaw e lo passa al tentativo preparato.
Quando un harness esegue una chiamata dinamica a un tool, restituisci il risultato del tool tramite
la forma del risultato dell'harness invece di inviare tu stesso i media del canale.

Questo mantiene gli output di testo, immagine, video, musica, TTS, approvazione e tool di messaggistica
sullo stesso percorso di consegna delle esecuzioni supportate da OpenClaw.

## Limitazioni attuali

- Il percorso di importazione pubblico è generico, ma alcuni alias di tipo tentativo/risultato conservano ancora
  nomi legacy per compatibilità.
- L'installazione di harness di terze parti è sperimentale. Preferisci i Plugin provider
  finché non ti serve un runtime di sessione nativo.
- Il cambio di harness è supportato tra i turni. Non cambiare harness nel
  mezzo di un turno dopo l'avvio di tool nativi, approvazioni, testo dell'assistente o invii
  di messaggi.

## Correlati

- [Panoramica SDK](/it/plugins/sdk-overview)
- [Helper runtime](/it/plugins/sdk-runtime)
- [Plugin provider](/it/plugins/sdk-provider-plugins)
- [Harness Codex](/it/plugins/codex-harness)
- [Provider dei modelli](/it/concepts/model-providers)
