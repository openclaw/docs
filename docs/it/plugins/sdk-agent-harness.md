---
read_when:
    - Stai modificando il runtime dell'agente incorporato o il registro dell'harness
    - Stai registrando un ambiente di esecuzione per agenti da un Plugin incluso o attendibile
    - È necessario comprendere come il Plugin Codex si relaziona ai fornitori di modelli
sidebarTitle: Agent Harness
summary: Superficie SDK sperimentale per plugin che sostituiscono l'esecutore di agente integrato di basso livello
title: Plugin dell'infrastruttura degli agenti
x-i18n:
    generated_at: "2026-05-02T08:30:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: b6e55d2df09c3965e1397be72f19dec2a6ed941ac8b7b01be8eee0f9713400dc
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Un **esecutore agente** è l'esecutore di basso livello per un turno preparato di un agente OpenClaw. Non è un provider di modelli, non è un canale e non è un registro di strumenti. Per il modello mentale rivolto all'utente, consulta [Runtime degli agenti](/it/concepts/agent-runtimes).

Usa questa superficie solo per Plugin nativi integrati o attendibili. Il contratto è ancora sperimentale perché i tipi dei parametri rispecchiano intenzionalmente l'attuale runner incorporato.

## Quando usare un esecutore

Registra un esecutore agente quando una famiglia di modelli ha un proprio runtime di sessione nativo e il normale trasporto dei provider OpenClaw è l'astrazione sbagliata.

Esempi:

- un server agente di coding nativo che possiede thread e compaction
- una CLI o un daemon locale che deve trasmettere in streaming eventi nativi di piano/ragionamento/strumenti
- un runtime di modello che necessita del proprio id di ripresa oltre alla trascrizione della sessione OpenClaw

**Non** registrare un esecutore solo per aggiungere una nuova API LLM. Per le normali API di modelli HTTP o WebSocket, crea un [Plugin provider](/it/plugins/sdk-provider-plugins).

## Cosa possiede ancora il core

Prima che venga selezionato un esecutore, OpenClaw ha già risolto:

- provider e modello
- stato di autenticazione del runtime
- livello di ragionamento e budget di contesto
- file di trascrizione/sessione OpenClaw
- workspace, sandbox e criterio degli strumenti
- callback di risposta del canale e callback di streaming
- criterio di fallback del modello e cambio modello live

Questa separazione è intenzionale. Un esecutore esegue un tentativo preparato; non sceglie provider, non sostituisce la consegna del canale e non cambia modello silenziosamente.

Il tentativo preparato include anche `params.runtimePlan`, un pacchetto di criteri posseduto da OpenClaw per decisioni di runtime che devono restare condivise tra PI ed esecutori nativi:

- `runtimePlan.tools.normalize(...)` e
  `runtimePlan.tools.logDiagnostics(...)` per il criterio degli schemi degli strumenti consapevole del provider
- `runtimePlan.transcript.resolvePolicy(...)` per la sanificazione della trascrizione e il criterio di riparazione delle chiamate agli strumenti
- `runtimePlan.delivery.isSilentPayload(...)` per `NO_REPLY` condiviso e la soppressione della consegna dei media
- `runtimePlan.outcome.classifyRunResult(...)` per la classificazione del fallback del modello
- `runtimePlan.observability` per metadati risolti di provider/modello/esecutore

Gli esecutori possono usare il piano per decisioni che devono corrispondere al comportamento PI, ma dovrebbero comunque trattarlo come stato del tentativo posseduto dall'host. Non modificarlo né usarlo per cambiare provider/modelli all'interno di un turno.

## Registrare un esecutore

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

## Criterio di selezione

OpenClaw sceglie un esecutore dopo la risoluzione di provider/modello:

1. L'id esecutore registrato di una sessione esistente prevale, così le modifiche a config/env non trasferiscono a caldo quella trascrizione a un altro runtime.
2. `OPENCLAW_AGENT_RUNTIME=<id>` forza un esecutore registrato con quell'id per le sessioni che non sono già fissate.
3. `OPENCLAW_AGENT_RUNTIME=pi` forza l'esecutore PI integrato.
4. `OPENCLAW_AGENT_RUNTIME=auto` chiede agli esecutori registrati se supportano il provider/modello risolto.
5. Se nessun esecutore registrato corrisponde, OpenClaw usa PI a meno che il fallback PI non sia disabilitato.

Gli errori degli esecutori dei Plugin emergono come errori di esecuzione. In modalità `auto`, il fallback PI viene usato solo quando nessun esecutore Plugin registrato supporta il provider/modello risolto. Una volta che un esecutore Plugin ha rivendicato un'esecuzione, OpenClaw non riproduce quello stesso turno tramite PI perché ciò può cambiare la semantica di autenticazione/runtime o duplicare effetti collaterali.

L'id dell'esecutore selezionato viene persistito con l'id sessione dopo un'esecuzione incorporata. Le sessioni legacy create prima dei pin degli esecutori vengono trattate come fissate a PI una volta che hanno cronologia di trascrizione. Usa una sessione nuova/reimpostata quando passi tra PI e un esecutore Plugin nativo. `/status` mostra gli id esecutore non predefiniti come `codex` accanto a `Fast`; PI resta nascosto perché è il percorso di compatibilità predefinito. Se l'esecutore selezionato sorprende, abilita il logging di debug `agents/harness` e ispeziona il record strutturato `agent harness selected` del Gateway. Include l'id dell'esecutore selezionato, il motivo della selezione, il criterio di runtime/fallback e, in modalità `auto`, il risultato di supporto di ogni candidato Plugin.

Il Plugin Codex integrato registra `codex` come proprio id esecutore. Il core lo tratta come un normale id esecutore Plugin; gli alias specifici di Codex appartengono al Plugin o alla configurazione dell'operatore, non al selettore di runtime condiviso.

## Abbinamento tra provider ed esecutore

La maggior parte degli esecutori dovrebbe registrare anche un provider. Il provider rende visibili al resto di OpenClaw i riferimenti dei modelli, lo stato di autenticazione, i metadati dei modelli e la selezione `/model`. L'esecutore quindi rivendica quel provider in `supports(...)`.

Il Plugin Codex integrato segue questo schema:

- riferimenti modello utente preferiti: `openai/gpt-5.5` più
  `agentRuntime.id: "codex"`
- riferimenti di compatibilità: i riferimenti legacy `codex/gpt-*` restano accettati, ma le nuove configurazioni non dovrebbero usarli come normali riferimenti provider/modello
- id esecutore: `codex`
- autenticazione: disponibilità provider sintetica, perché l'esecutore Codex possiede login/sessione Codex nativi
- richiesta app-server: OpenClaw invia l'id modello semplice a Codex e lascia che l'esecutore parli con il protocollo app-server nativo

Il Plugin Codex è additivo. I riferimenti semplici `openai/gpt-*` continuano a usare il normale percorso provider OpenClaw a meno che non forzi l'esecutore Codex con `agentRuntime.id: "codex"`. I riferimenti più vecchi `codex/gpt-*` selezionano ancora provider ed esecutore Codex per compatibilità.

Per la configurazione dell'operatore, esempi di prefissi dei modelli e configurazioni solo Codex, consulta [Esecutore Codex](/it/plugins/codex-harness).

OpenClaw richiede Codex app-server `0.125.0` o successivo. Il Plugin Codex controlla l'handshake di inizializzazione dell'app-server e blocca server più vecchi o senza versione, così OpenClaw viene eseguito solo sulla superficie di protocollo con cui è stato testato. Il requisito minimo `0.125.0` include il supporto del payload hook MCP nativo arrivato in Codex `0.124.0`, fissando al contempo OpenClaw alla linea stabile testata più recente.

### Middleware dei risultati degli strumenti

I Plugin integrati possono collegare middleware dei risultati degli strumenti neutrali rispetto al runtime tramite `api.registerAgentToolResultMiddleware(...)` quando il loro manifest dichiara gli id runtime mirati in `contracts.agentToolResultMiddleware`. Questa superficie attendibile è per trasformazioni asincrone dei risultati degli strumenti che devono essere eseguite prima che PI o Codex restituiscano l'output dello strumento al modello.

I Plugin integrati legacy possono ancora usare `api.registerCodexAppServerExtensionFactory(...)` per middleware solo Codex app-server, ma le nuove trasformazioni dei risultati dovrebbero usare l'API neutrale rispetto al runtime. L'hook solo Pi `api.registerEmbeddedExtensionFactory(...)` è stato rimosso; le trasformazioni dei risultati degli strumenti Pi devono usare middleware neutrale rispetto al runtime.

### Classificazione dell'esito terminale

Gli esecutori nativi che possiedono la propria proiezione del protocollo possono usare `classifyAgentHarnessTerminalOutcome(...)` da `openclaw/plugin-sdk/agent-harness-runtime` quando un turno completato non ha prodotto testo dell'assistente visibile. L'helper restituisce `empty`, `reasoning-only` o `planning-only` così il criterio di fallback di OpenClaw può decidere se riprovare su un modello diverso. Lascia intenzionalmente non classificati gli errori di prompt, i turni in corso e le risposte silenziose intenzionali come `NO_REPLY`.

### Modalità esecutore Codex nativa

L'esecutore `codex` integrato è la modalità Codex nativa per i turni agente OpenClaw incorporati. Abilita prima il Plugin `codex` integrato e includi `codex` in `plugins.allow` se la tua configurazione usa una allowlist restrittiva. Le configurazioni app-server native dovrebbero usare `openai/gpt-*` con `agentRuntime.id: "codex"`. Usa `openai-codex/*` per Codex OAuth tramite PI. I riferimenti modello legacy `codex/*` restano alias di compatibilità per l'esecutore nativo.

Quando questa modalità viene eseguita, Codex possiede l'id thread nativo, il comportamento di ripresa, la compaction e l'esecuzione app-server. OpenClaw possiede ancora il canale chat, il mirror della trascrizione visibile, il criterio degli strumenti, le approvazioni, la consegna dei media e la selezione della sessione. Usa `agentRuntime.id: "codex"` senza override `fallback` quando devi dimostrare che solo il percorso Codex app-server può rivendicare l'esecuzione. I runtime Plugin espliciti falliscono già in modo chiuso per impostazione predefinita. Imposta `fallback: "pi"` solo quando vuoi intenzionalmente che PI gestisca una selezione dell'esecutore mancante. Gli errori Codex app-server falliscono già direttamente invece di ritentare tramite PI.

## Disabilitare il fallback PI

Per impostazione predefinita, OpenClaw esegue agenti incorporati con `agents.defaults.agentRuntime` impostato su `{ id: "auto", fallback: "pi" }`. In modalità `auto`, gli esecutori Plugin registrati possono rivendicare una coppia provider/modello. Se nessuno corrisponde, OpenClaw ripiega su PI.

In modalità `auto`, imposta `fallback: "none"` quando vuoi che la selezione mancante dell'esecutore Plugin fallisca invece di usare PI. I runtime Plugin espliciti come `agentRuntime.id: "codex"` falliscono già in modo chiuso per impostazione predefinita, a meno che `fallback: "pi"` non sia impostato nello stesso ambito di configurazione o override di ambiente. Gli errori degli esecutori Plugin selezionati falliscono sempre in modo netto. Questo non blocca un `agentRuntime.id: "pi"` esplicito o `OPENCLAW_AGENT_RUNTIME=pi`.

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

Se vuoi che qualsiasi esecutore Plugin registrato rivendichi i modelli corrispondenti ma non vuoi mai che OpenClaw ripieghi silenziosamente su PI, mantieni `runtime: "auto"` e disabilita il fallback:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "none"
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
      "agentRuntime": {
        "id": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": {
          "id": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` sovrascrive ancora il runtime configurato. Usa `OPENCLAW_AGENT_HARNESS_FALLBACK=none` per disabilitare il fallback PI dall'ambiente.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Con il fallback disabilitato, una sessione fallisce in anticipo quando l'esecutore richiesto non è registrato, non supporta il provider/modello risolto o fallisce prima di produrre effetti collaterali del turno. Questo è intenzionale per distribuzioni solo Codex e per test live che devono dimostrare che il percorso Codex app-server è effettivamente in uso.

Questa impostazione controlla solo l'esecutore agente incorporato. Non disabilita il routing dei modelli specifico del provider per immagini, video, musica, TTS, PDF o altro.

## Sessioni native e mirror della trascrizione

Un esecutore può mantenere un id sessione nativo, un id thread o un token di ripresa lato daemon. Mantieni quell'associazione esplicitamente collegata alla sessione OpenClaw e continua a rispecchiare l'output assistente/strumenti visibile all'utente nella trascrizione OpenClaw.

La trascrizione OpenClaw resta il livello di compatibilità per:

- cronologia della sessione visibile nel canale
- ricerca e indicizzazione della trascrizione
- ritorno all'esecutore PI integrato in un turno successivo
- comportamento generico di `/new`, `/reset` ed eliminazione sessione

Se il tuo esecutore archivia un'associazione sidecar, implementa `reset(...)` così OpenClaw può cancellarla quando la sessione OpenClaw proprietaria viene reimpostata.

## Risultati di strumenti e media

Core costruisce l'elenco degli strumenti OpenClaw e lo passa al tentativo preparato.
Quando un ambiente di esecuzione esegue una chiamata dinamica a uno strumento, restituisci il risultato dello strumento attraverso
la forma del risultato dell'ambiente di esecuzione invece di inviare direttamente contenuti multimediali del canale.

Questo mantiene gli output di testo, immagini, video, musica, TTS, approvazione e strumenti di messaggistica
nello stesso percorso di consegna delle esecuzioni basate su PI.

## Limitazioni attuali

- Il percorso di importazione pubblico è generico, ma alcuni alias di tipo per tentativi/risultati mantengono ancora
  nomi `Pi` per compatibilità.
- L'installazione di ambienti di esecuzione di terze parti è sperimentale. Preferisci i Plugin di provider
  finché non ti serve un runtime di sessione nativo.
- Il cambio di ambiente di esecuzione è supportato tra un turno e l'altro. Non cambiare ambiente di esecuzione nel
  mezzo di un turno dopo che strumenti nativi, approvazioni, testo dell'assistente o invii di messaggi
  sono stati avviati.

## Correlati

- [Panoramica dell'SDK](/it/plugins/sdk-overview)
- [Helper di runtime](/it/plugins/sdk-runtime)
- [Plugin di provider](/it/plugins/sdk-provider-plugins)
- [Ambiente di esecuzione Codex](/it/plugins/codex-harness)
- [Provider di modelli](/it/concepts/model-providers)
