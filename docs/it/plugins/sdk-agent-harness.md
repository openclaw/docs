---
read_when:
    - Stai modificando il runtime dell'agente incorporato o il registro dell'harness
    - Stai registrando un harness dell'agente proveniente da un Plugin incluso o attendibile
    - È necessario comprendere come il Plugin Codex si rapporta ai fornitori di modelli
sidebarTitle: Agent Harness
summary: Interfaccia SDK sperimentale per Plugin che sostituiscono l'esecutore dell'agente incorporato di basso livello
title: Plugin dell'harness agente
x-i18n:
    generated_at: "2026-05-07T13:23:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: ab47fbedbd429a4c0e72da0057a88be34528b69804fa1e7af795f377c4907f55
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Un **harness agente** è l'esecutore di basso livello per un turno preparato di un agente OpenClaw. Non è un provider di modelli, non è un canale e non è un registro strumenti. Per il modello mentale rivolto all'utente, consulta [Runtime agent](/it/concepts/agent-runtimes).

Usa questa superficie solo per Plugin nativi in bundle o attendibili. Il contratto è ancora sperimentale perché i tipi dei parametri rispecchiano intenzionalmente il runner incorporato attuale.

## Quando usare un harness

Registra un harness agente quando una famiglia di modelli ha un proprio runtime di sessione nativo e il normale trasporto provider di OpenClaw è l'astrazione sbagliata.

Esempi:

- un server nativo per agenti di coding che possiede thread e Compaction
- una CLI locale o un demone che deve trasmettere eventi nativi di piano/ragionamento/strumenti
- un runtime di modello che necessita del proprio id di ripresa oltre alla trascrizione della sessione OpenClaw

**Non** registrare un harness solo per aggiungere una nuova API LLM. Per le normali API modello HTTP o WebSocket, crea un [Plugin provider](/it/plugins/sdk-provider-plugins).

## Cosa rimane di proprietà del core

Prima che venga selezionato un harness, OpenClaw ha già risolto:

- provider e modello
- stato di autenticazione del runtime
- livello di ragionamento e budget di contesto
- file di trascrizione/sessione OpenClaw
- workspace, sandbox e policy degli strumenti
- callback di risposta del canale e callback di streaming
- policy di fallback del modello e di cambio modello live

Questa separazione è intenzionale. Un harness esegue un tentativo preparato; non sceglie i provider, non sostituisce la consegna del canale e non cambia silenziosamente modello.

Il tentativo preparato include anche `params.runtimePlan`, un bundle di policy di proprietà di OpenClaw per decisioni di runtime che devono rimanere condivise tra PI e harness nativi:

- `runtimePlan.tools.normalize(...)` e `runtimePlan.tools.logDiagnostics(...)` per la policy dello schema strumenti consapevole del provider
- `runtimePlan.transcript.resolvePolicy(...)` per la sanificazione della trascrizione e la policy di riparazione delle chiamate strumento
- `runtimePlan.delivery.isSilentPayload(...)` per la soppressione condivisa di `NO_REPLY` e della consegna multimediale
- `runtimePlan.outcome.classifyRunResult(...)` per la classificazione del fallback del modello
- `runtimePlan.observability` per metadati risolti di provider/modello/harness

Gli harness possono usare il piano per decisioni che devono corrispondere al comportamento di PI, ma dovrebbero comunque trattarlo come stato del tentativo di proprietà dell'host. Non mutarlo né usarlo per cambiare provider/modelli all'interno di un turno.

## Registrare un harness

**Importazione:** `openclaw/plugin-sdk/agent-harness`

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

1. L'id harness registrato di una sessione esistente ha la precedenza, quindi le modifiche a config/env non cambiano a caldo quella trascrizione verso un altro runtime.
2. `OPENCLAW_AGENT_RUNTIME=<id>` forza un harness registrato con quell'id per le sessioni che non sono già fissate.
3. `OPENCLAW_AGENT_RUNTIME=pi` forza l'harness PI integrato.
4. `OPENCLAW_AGENT_RUNTIME=auto` chiede agli harness registrati se supportano il provider/modello risolto.
5. Se nessun harness registrato corrisponde, OpenClaw usa PI a meno che il fallback PI non sia disabilitato.

I fallimenti degli harness dei Plugin emergono come fallimenti dell'esecuzione. In modalità `auto`, il fallback PI viene usato solo quando nessun harness Plugin registrato supporta il provider/modello risolto. Una volta che un harness Plugin ha rivendicato un'esecuzione, OpenClaw non riproduce lo stesso turno attraverso PI perché ciò può cambiare la semantica di autenticazione/runtime o duplicare effetti collaterali.

L'id harness selezionato viene persistito con l'id sessione dopo un'esecuzione incorporata. Le sessioni legacy create prima dei pin degli harness vengono trattate come fissate a PI una volta che hanno una cronologia di trascrizione. Usa una sessione nuova/reimpostata quando passi tra PI e un harness Plugin nativo. `/status` mostra gli id harness non predefiniti, come `codex`, accanto a `Fast`; PI rimane nascosto perché è il percorso di compatibilità predefinito. Se l'harness selezionato sorprende, abilita il logging di debug `agents/harness` e ispeziona il record strutturato `agent harness selected` del Gateway. Include l'id harness selezionato, il motivo della selezione, la policy di runtime/fallback e, in modalità `auto`, il risultato del supporto di ciascun candidato Plugin.

Il Plugin Codex in bundle registra `codex` come proprio id harness. Il core lo tratta come un normale id harness Plugin; gli alias specifici di Codex appartengono al Plugin o alla config operatore, non al selettore di runtime condiviso.

## Associazione tra provider e harness

La maggior parte degli harness dovrebbe registrare anche un provider. Il provider rende visibili al resto di OpenClaw i riferimenti modello, lo stato di autenticazione, i metadati del modello e la selezione `/model`. L'harness poi rivendica quel provider in `supports(...)`.

Il Plugin Codex in bundle segue questo schema:

- riferimenti modello utente preferiti: `openai/gpt-5.5` più `agentRuntime.id: "codex"`
- riferimenti di compatibilità: i riferimenti legacy `codex/gpt-*` rimangono accettati, ma le nuove config non dovrebbero usarli come normali riferimenti provider/modello
- id harness: `codex`
- autenticazione: disponibilità sintetica del provider, perché l'harness Codex possiede il login/sessione Codex nativo
- richiesta app-server: OpenClaw invia a Codex l'id modello essenziale e lascia che l'harness parli con il protocollo app-server nativo

Il Plugin Codex è additivo. I normali riferimenti `openai/gpt-*` continuano a usare il percorso provider standard di OpenClaw a meno che tu non forzi l'harness Codex con `agentRuntime.id: "codex"`. I riferimenti `codex/gpt-*` più vecchi selezionano ancora il provider e l'harness Codex per compatibilità.

Per la configurazione operatore, esempi di prefissi modello e config solo Codex, consulta [Harness Codex](/it/plugins/codex-harness).

OpenClaw richiede Codex app-server `0.125.0` o più recente. Il Plugin Codex controlla l'handshake di inizializzazione dell'app-server e blocca i server più vecchi o senza versione, così OpenClaw viene eseguito solo sulla superficie di protocollo con cui è stato testato. La soglia `0.125.0` include il supporto nativo del payload hook MCP arrivato in Codex `0.124.0`, vincolando al contempo OpenClaw alla linea stabile testata più recente.

### Middleware dei risultati strumento

I Plugin in bundle possono collegare middleware dei risultati strumento neutrali rispetto al runtime tramite `api.registerAgentToolResultMiddleware(...)` quando il loro manifest dichiara gli id runtime di destinazione in `contracts.agentToolResultMiddleware`. Questa seam attendibile è per trasformazioni asincrone dei risultati strumento che devono essere eseguite prima che PI o Codex reinseriscano l'output dello strumento nel modello.

I Plugin legacy in bundle possono ancora usare `api.registerCodexAppServerExtensionFactory(...)` per middleware solo per app-server Codex, ma le nuove trasformazioni dei risultati dovrebbero usare l'API neutrale rispetto al runtime. L'hook solo Pi `api.registerEmbeddedExtensionFactory(...)` è stato rimosso; le trasformazioni dei risultati strumento di Pi devono usare middleware neutrale rispetto al runtime.

### Classificazione dell'esito terminale

Gli harness nativi che possiedono la propria proiezione del protocollo possono usare `classifyAgentHarnessTerminalOutcome(...)` da `openclaw/plugin-sdk/agent-harness-runtime` quando un turno completato non ha prodotto testo assistente visibile. L'helper restituisce `empty`, `reasoning-only` o `planning-only` così la policy di fallback di OpenClaw può decidere se riprovare su un modello diverso. Lascia intenzionalmente non classificati gli errori di prompt, i turni in corso e le risposte silenziose intenzionali come `NO_REPLY`.

### Modalità harness Codex nativa

L'harness `codex` in bundle è la modalità Codex nativa per i turni agente OpenClaw incorporati. Abilita prima il Plugin `codex` in bundle e includi `codex` in `plugins.allow` se la tua config usa una allowlist restrittiva. Le config app-server native dovrebbero usare `openai/gpt-*`; i turni agente OpenAI selezionano l'harness Codex per impostazione predefinita. Le route legacy `openai-codex/*` dovrebbero essere riparate con `openclaw doctor --fix`, e i riferimenti modello legacy `codex/*` rimangono alias di compatibilità per l'harness nativo.

Quando questa modalità viene eseguita, Codex possiede l'id thread nativo, il comportamento di ripresa, Compaction e l'esecuzione app-server. OpenClaw possiede ancora il canale chat, il mirror della trascrizione visibile, la policy degli strumenti, le approvazioni, la consegna multimediale e la selezione della sessione. Usa `agentRuntime.id: "codex"` quando devi dimostrare che solo il percorso app-server Codex può rivendicare l'esecuzione. I runtime Plugin espliciti falliscono in modo chiuso; i fallimenti di selezione dell'app-server Codex e i fallimenti di runtime non vengono ritentati attraverso PI.

## Rigorosità del runtime

Per impostazione predefinita, OpenClaw esegue gli agenti incorporati con OpenClaw Pi. In modalità `auto`, gli harness Plugin registrati possono rivendicare una coppia provider/modello, e PI gestisce il turno quando nessuno corrisponde. Usa un runtime Plugin esplicito come `agentRuntime.id: "codex"` quando la selezione mancante dell'harness deve fallire invece di instradare attraverso PI. I fallimenti degli harness Plugin selezionati falliscono sempre in modo rigido. Questo non blocca un `agentRuntime.id: "pi"` esplicito né `OPENCLAW_AGENT_RUNTIME=pi`.

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

Se vuoi che qualsiasi harness Plugin registrato rivendichi i modelli corrispondenti e altrimenti usi PI, imposta `id: "auto"`:

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

`OPENCLAW_AGENT_RUNTIME` sovrascrive comunque il runtime configurato.

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Con un runtime Plugin esplicito, una sessione fallisce presto quando l'harness richiesto non è registrato, non supporta il provider/modello risolto o fallisce prima di produrre effetti collaterali del turno. Questo è intenzionale per distribuzioni solo Codex e per test live che devono dimostrare che il percorso app-server Codex è effettivamente in uso.

Questa impostazione controlla solo l'harness agente incorporato. Non disabilita il routing di modelli specifico del provider per immagini, video, musica, TTS, PDF o altro.

## Sessioni native e mirror della trascrizione

Un harness può mantenere un id sessione nativo, un id thread o un token di ripresa lato demone. Mantieni quel binding associato esplicitamente alla sessione OpenClaw, e continua a rispecchiare l'output assistente/strumento visibile all'utente nella trascrizione OpenClaw.

La trascrizione OpenClaw rimane il livello di compatibilità per:

- cronologia della sessione visibile al canale
- ricerca e indicizzazione della trascrizione
- ritorno all'harness PI integrato in un turno successivo
- comportamento generico di `/new`, `/reset` ed eliminazione della sessione

Se il tuo harness memorizza un binding sidecar, implementa `reset(...)` così OpenClaw può cancellarlo quando la sessione OpenClaw proprietaria viene reimpostata.

## Risultati di strumenti e contenuti multimediali

Il core costruisce l'elenco degli strumenti OpenClaw e lo passa al tentativo preparato. Quando un harness esegue una chiamata strumento dinamica, restituisci il risultato dello strumento tramite la forma risultato dell'harness invece di inviare tu stesso contenuti multimediali al canale.

Questo mantiene gli output di testo, immagini, video, musica, TTS, approvazioni e strumenti di messaggistica sullo stesso percorso di consegna delle esecuzioni supportate da PI.

## Limitazioni attuali

- Il percorso di importazione pubblico è generico, ma alcuni alias di tipo per tentativo/risultato mantengono ancora nomi `Pi` per compatibilità.
- L'installazione di harness di terze parti è sperimentale. Preferisci i Plugin provider finché non ti serve un runtime di sessione nativo.
- Il cambio di harness è supportato tra un turno e l'altro. Non cambiare harness nel
  mezzo di un turno dopo che sono iniziati strumenti nativi, approvazioni, testo dell'assistente o invii di messaggi.

## Correlati

- [Panoramica dell'SDK](/it/plugins/sdk-overview)
- [Helper di runtime](/it/plugins/sdk-runtime)
- [Plugin provider](/it/plugins/sdk-provider-plugins)
- [Harness Codex](/it/plugins/codex-harness)
- [Provider di modelli](/it/concepts/model-providers)
