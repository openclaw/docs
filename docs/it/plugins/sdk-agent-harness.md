---
read_when:
    - Stai modificando il runtime dell'agente incorporato o il registro degli harness
    - Stai registrando un harness di agente da un Plugin incluso o attendibile
    - È necessario comprendere in che modo il Plugin Codex si relaziona ai provider di modelli
sidebarTitle: Agent Harness
summary: Superficie SDK sperimentale per i plugin che sostituiscono l'esecutore agent integrato di basso livello
title: Plugin dell'harness degli agenti
x-i18n:
    generated_at: "2026-05-03T21:43:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed416bbb433fc502c60fd8c24d20cd0f862d45472ff2eb0e2484b256b58f1b35
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Un **harness dell'agente** è l'esecutore di basso livello per un singolo turno preparato di un agente OpenClaw. Non è un provider di modelli, non è un canale e non è un registro di strumenti. Per il modello mentale rivolto all'utente, vedi [runtime degli agenti](/it/concepts/agent-runtimes).

Usa questa superficie solo per plugin nativi inclusi o attendibili. Il contratto è ancora sperimentale perché i tipi dei parametri rispecchiano intenzionalmente l'attuale runner incorporato.

## Quando usare un harness

Registra un harness dell'agente quando una famiglia di modelli ha il proprio runtime di sessione nativo e il normale trasporto dei provider OpenClaw è l'astrazione sbagliata.

Esempi:

- un server nativo per agenti di coding che possiede thread e compaction
- una CLI locale o un daemon che deve trasmettere in streaming eventi nativi di piano/ragionamento/strumenti
- un runtime di modello che necessita del proprio ID di ripresa oltre alla trascrizione della sessione OpenClaw

**Non** registrare un harness solo per aggiungere una nuova API LLM. Per le normali API di modelli HTTP o WebSocket, crea un [plugin provider](/it/plugins/sdk-provider-plugins).

## Cosa possiede ancora il core

Prima che venga selezionato un harness, OpenClaw ha già risolto:

- provider e modello
- stato di autenticazione del runtime
- livello di ragionamento e budget di contesto
- file di trascrizione/sessione OpenClaw
- workspace, sandbox e policy degli strumenti
- callback di risposta del canale e callback di streaming
- policy di fallback del modello e di cambio modello live

Questa separazione è intenzionale. Un harness esegue un tentativo preparato; non sceglie provider, non sostituisce la consegna del canale e non cambia silenziosamente modello.

Il tentativo preparato include anche `params.runtimePlan`, un bundle di policy di proprietà di OpenClaw per decisioni di runtime che devono restare condivise tra PI e harness nativi:

- `runtimePlan.tools.normalize(...)` e
  `runtimePlan.tools.logDiagnostics(...)` per la policy degli schemi degli strumenti consapevole del provider
- `runtimePlan.transcript.resolvePolicy(...)` per la sanificazione della trascrizione e la policy di riparazione delle chiamate agli strumenti
- `runtimePlan.delivery.isSilentPayload(...)` per la soppressione condivisa di `NO_REPLY` e della consegna dei media
- `runtimePlan.outcome.classifyRunResult(...)` per la classificazione del fallback del modello
- `runtimePlan.observability` per metadati risolti di provider/modello/harness

Gli harness possono usare il piano per decisioni che devono corrispondere al comportamento PI, ma dovrebbero comunque trattarlo come stato del tentativo posseduto dall'host. Non modificarlo né usarlo per cambiare provider/modelli all'interno di un turno.

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

OpenClaw sceglie un harness dopo la risoluzione di provider/modello:

1. L'ID harness registrato di una sessione esistente prevale, quindi le modifiche a configurazione/env non trasferiscono a caldo quella trascrizione a un altro runtime.
2. `OPENCLAW_AGENT_RUNTIME=<id>` forza un harness registrato con quell'ID per le sessioni che non sono già vincolate.
3. `OPENCLAW_AGENT_RUNTIME=pi` forza l'harness PI integrato.
4. `OPENCLAW_AGENT_RUNTIME=auto` chiede agli harness registrati se supportano il provider/modello risolto.
5. Se nessun harness registrato corrisponde, OpenClaw usa PI a meno che il fallback PI non sia disabilitato.

Gli errori degli harness dei plugin emergono come errori di esecuzione. In modalità `auto`, il fallback PI viene usato solo quando nessun harness di plugin registrato supporta il provider/modello risolto. Una volta che un harness di plugin ha rivendicato un'esecuzione, OpenClaw non riproduce lo stesso turno tramite PI perché questo può cambiare la semantica di autenticazione/runtime o duplicare effetti collaterali.

L'ID harness selezionato viene persistito con l'ID sessione dopo un'esecuzione incorporata. Le sessioni legacy create prima dei pin degli harness vengono trattate come vincolate a PI una volta che hanno una cronologia di trascrizione. Usa una sessione nuova/reimpostata quando passi tra PI e un harness di plugin nativo. `/status` mostra ID harness non predefiniti come `codex` accanto a `Fast`; PI resta nascosto perché è il percorso di compatibilità predefinito. Se l'harness selezionato sorprende, abilita il logging di debug `agents/harness` e ispeziona il record strutturato `agent harness selected` del gateway. Include l'ID harness selezionato, il motivo della selezione, la policy di runtime/fallback e, in modalità `auto`, il risultato del supporto di ogni candidato plugin.

Il plugin Codex incluso registra `codex` come ID harness. Il core lo tratta come un normale ID harness di plugin; gli alias specifici di Codex appartengono al plugin o alla configurazione dell'operatore, non al selettore di runtime condiviso.

## Abbinamento provider più harness

La maggior parte degli harness dovrebbe registrare anche un provider. Il provider rende visibili al resto di OpenClaw i riferimenti dei modelli, lo stato di autenticazione, i metadati dei modelli e la selezione `/model`. L'harness quindi rivendica quel provider in `supports(...)`.

Il plugin Codex incluso segue questo schema:

- riferimenti al modello utente preferiti: `openai/gpt-5.5` più
  `agentRuntime.id: "codex"`
- riferimenti di compatibilità: i riferimenti legacy `codex/gpt-*` restano accettati, ma le nuove configurazioni non dovrebbero usarli come normali riferimenti provider/modello
- ID harness: `codex`
- autenticazione: disponibilità sintetica del provider, perché l'harness Codex possiede il login/sessione Codex nativo
- richiesta app-server: OpenClaw invia l'ID modello puro a Codex e lascia che l'harness parli con il protocollo app-server nativo

Il plugin Codex è additivo. I semplici riferimenti `openai/gpt-*` continuano a usare il normale percorso provider OpenClaw, a meno che tu non forzi l'harness Codex con `agentRuntime.id: "codex"`. I riferimenti più vecchi `codex/gpt-*` selezionano ancora il provider e l'harness Codex per compatibilità.

Per la configurazione operatore, esempi di prefisso del modello e configurazioni solo Codex, vedi [Harness Codex](/it/plugins/codex-harness).

OpenClaw richiede Codex app-server `0.125.0` o più recente. Il plugin Codex controlla l'handshake di inizializzazione dell'app-server e blocca server più vecchi o senza versione, così OpenClaw viene eseguito solo contro la superficie di protocollo con cui è stato testato. La base minima `0.125.0` include il supporto al payload dell'hook MCP nativo arrivato in Codex `0.124.0`, vincolando al contempo OpenClaw alla linea stabile testata più recente.

### Middleware dei risultati degli strumenti

I plugin inclusi possono collegare middleware dei risultati degli strumenti neutrale rispetto al runtime tramite `api.registerAgentToolResultMiddleware(...)` quando il loro manifest dichiara gli ID runtime mirati in `contracts.agentToolResultMiddleware`. Questa interfaccia attendibile è per trasformazioni asincrone dei risultati degli strumenti che devono essere eseguite prima che PI o Codex restituiscano l'output degli strumenti al modello.

I plugin inclusi legacy possono ancora usare `api.registerCodexAppServerExtensionFactory(...)` per middleware solo Codex app-server, ma le nuove trasformazioni dei risultati dovrebbero usare l'API neutrale rispetto al runtime. L'hook solo Pi `api.registerEmbeddedExtensionFactory(...)` è stato rimosso; le trasformazioni dei risultati degli strumenti Pi devono usare middleware neutrale rispetto al runtime.

### Classificazione dell'esito terminale

Gli harness nativi che possiedono la propria proiezione di protocollo possono usare `classifyAgentHarnessTerminalOutcome(...)` da `openclaw/plugin-sdk/agent-harness-runtime` quando un turno completato non ha prodotto testo dell'assistente visibile. L'helper restituisce `empty`, `reasoning-only` o `planning-only` così la policy di fallback di OpenClaw può decidere se riprovare su un modello diverso. Lascia intenzionalmente non classificati errori del prompt, turni in corso e risposte silenziose intenzionali come `NO_REPLY`.

### Modalità harness Codex nativa

L'harness `codex` incluso è la modalità Codex nativa per i turni agente OpenClaw incorporati. Abilita prima il plugin `codex` incluso e includi `codex` in `plugins.allow` se la tua configurazione usa una allowlist restrittiva. Le configurazioni app-server native dovrebbero usare `openai/gpt-*` con `agentRuntime.id: "codex"`. Usa `openai-codex/*` per Codex OAuth tramite PI. I riferimenti modello legacy `codex/*` restano alias di compatibilità per l'harness nativo.

Quando questa modalità viene eseguita, Codex possiede l'ID thread nativo, il comportamento di ripresa, la compaction e l'esecuzione app-server. OpenClaw possiede ancora il canale chat, lo specchio della trascrizione visibile, la policy degli strumenti, le approvazioni, la consegna dei media e la selezione della sessione. Usa `agentRuntime.id: "codex"` quando devi dimostrare che solo il percorso app-server Codex può rivendicare l'esecuzione. I runtime plugin espliciti falliscono in modo chiuso; gli errori di selezione app-server Codex e gli errori di runtime non vengono riprovati tramite PI.

## Rigidità del runtime

Per impostazione predefinita, OpenClaw esegue agenti incorporati con OpenClaw Pi. In modalità `auto`, gli harness di plugin registrati possono rivendicare una coppia provider/modello e PI gestisce il turno quando nessuno corrisponde. Usa un runtime plugin esplicito come `agentRuntime.id: "codex"` quando la mancata selezione dell'harness deve fallire invece di instradare tramite PI. Gli errori degli harness di plugin selezionati falliscono sempre in modo rigido. Questo non blocca un `agentRuntime.id: "pi"` esplicito o `OPENCLAW_AGENT_RUNTIME=pi`.

Per esecuzioni incorporate solo Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

Se vuoi che qualsiasi harness di plugin registrato rivendichi i modelli corrispondenti e altrimenti usi PI, imposta `id: "auto"`:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto"
      }
    }
  }
}
```

Gli override per agente usano la stessa forma:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": { "id": "auto" }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": { "id": "codex" }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` sovrascrive ancora il runtime configurato.

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Con un runtime plugin esplicito, una sessione fallisce in anticipo quando l'harness richiesto non è registrato, non supporta il provider/modello risolto o fallisce prima di produrre effetti collaterali del turno. Questo è intenzionale per distribuzioni solo Codex e per test live che devono dimostrare che il percorso app-server Codex è effettivamente in uso.

Questa impostazione controlla solo l'harness agente incorporato. Non disabilita il routing specifico per provider di immagini, video, musica, TTS, PDF o altri modelli.

## Sessioni native e specchio della trascrizione

Un harness può mantenere un ID sessione nativo, un ID thread o un token di ripresa lato daemon. Mantieni quel binding esplicitamente associato alla sessione OpenClaw e continua a rispecchiare l'output assistente/strumento visibile all'utente nella trascrizione OpenClaw.

La trascrizione OpenClaw resta il livello di compatibilità per:

- cronologia della sessione visibile nel canale
- ricerca e indicizzazione della trascrizione
- ritorno all'harness PI integrato in un turno successivo
- comportamento generico di `/new`, `/reset` ed eliminazione sessione

Se il tuo harness archivia un binding sidecar, implementa `reset(...)` così OpenClaw può cancellarlo quando la sessione OpenClaw proprietaria viene reimpostata.

## Risultati di strumenti e media

Il core costruisce l'elenco degli strumenti OpenClaw e lo passa al tentativo preparato. Quando un harness esegue una chiamata dinamica a uno strumento, restituisci il risultato dello strumento tramite la forma di risultato dell'harness invece di inviare tu stesso i media del canale.

Questo mantiene gli output di testo, immagini, video, musica, TTS, approvazione e strumenti di messaggistica sullo stesso percorso di consegna delle esecuzioni basate su PI.

## Limitazioni attuali

- Il percorso di importazione pubblico è generico, ma alcuni alias di tipo per tentativi/risultati mantengono ancora nomi `Pi` per compatibilità.
- L'installazione di harness di terze parti è sperimentale. Preferisci i Plugin provider finché non ti serve un runtime di sessione nativo.
- Il cambio di harness è supportato tra i turni. Non cambiare harness nel mezzo di un turno dopo l'avvio di strumenti nativi, approvazioni, testo dell'assistente o invii di messaggi.

## Correlati

- [Panoramica dell'SDK](/it/plugins/sdk-overview)
- [Helper di runtime](/it/plugins/sdk-runtime)
- [Plugin provider](/it/plugins/sdk-provider-plugins)
- [Harness Codex](/it/plugins/codex-harness)
- [Provider di modelli](/it/concepts/model-providers)
