---
read_when:
    - Stai modificando il runtime embedded dell'agente o il registry dell'harness
    - Stai registrando un harness dell'agente da un Plugin incluso o trusted
    - Devi comprendere come il Plugin Codex si relaziona ai provider di modelli
sidebarTitle: Agent Harness
summary: Surface SDK sperimentale per plugin che sostituiscono l'esecutore embedded dell'agente di basso livello
title: Plugin Agent Harness
x-i18n:
    generated_at: "2026-04-23T08:32:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: efaecca18210af0e9e641bd888c1edb55e08e96299158ff021d6c2dd0218ec25
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Plugin Agent Harness

Un **agent harness** è l'esecutore di basso livello per un singolo turno agente
OpenClaw preparato. Non è un provider di modelli, non è un canale e non è un registry di strumenti.

Usa questa surface solo per plugin nativi inclusi o trusted. Il contratto è
ancora sperimentale perché i tipi dei parametri rispecchiano intenzionalmente l'attuale
runner embedded.

## Quando usare un harness

Registra un agent harness quando una famiglia di modelli ha il proprio runtime
di sessione nativo e il normale transport provider di OpenClaw è l'astrazione sbagliata.

Esempi:

- un server di coding-agent nativo che gestisce thread e Compaction
- una CLI o un daemon locale che deve fare streaming di eventi nativi di plan/reasoning/tool
- un runtime di modello che ha bisogno del proprio resume id oltre alla transcript
  di sessione di OpenClaw

**Non** registrare un harness solo per aggiungere una nuova API LLM. Per normali
API di modelli HTTP o WebSocket, crea un [Plugin provider](/it/plugins/sdk-provider-plugins).

## Cosa resta di competenza del core

Prima che venga selezionato un harness, OpenClaw ha già risolto:

- provider e modello
- stato auth del runtime
- livello di thinking e budget di contesto
- transcript/file di sessione di OpenClaw
- workspace, sandbox e policy degli strumenti
- callback di risposta del canale e callback di streaming
- policy di fallback del modello e di cambio modello live

Questa separazione è intenzionale. Un harness esegue un tentativo preparato; non sceglie
provider, non sostituisce la consegna del canale e non cambia modello in modo silenzioso.

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

1. `OPENCLAW_AGENT_RUNTIME=<id>` forza un harness registrato con quell'id.
2. `OPENCLAW_AGENT_RUNTIME=pi` forza l'harness PI integrato.
3. `OPENCLAW_AGENT_RUNTIME=auto` chiede agli harness registrati se supportano il
   provider/modello risolto.
4. Se nessun harness registrato corrisponde, OpenClaw usa PI a meno che il fallback a PI
   non sia disabilitato.

I fallimenti degli harness Plugin emergono come errori di esecuzione. In modalità `auto`, il fallback a PI
viene usato solo quando nessun harness Plugin registrato supporta il
provider/modello risolto. Una volta che un harness Plugin ha preso in carico un'esecuzione, OpenClaw non
ripete lo stesso turno tramite PI perché questo può cambiare la semantica auth/runtime
o duplicare effetti collaterali.

Il Plugin Codex incluso registra `codex` come id del suo harness. Il core tratta questo
come un normale id di harness Plugin; gli alias specifici di Codex appartengono al Plugin
o alla configurazione dell'operatore, non al selettore runtime condiviso.

## Abbinamento provider più harness

La maggior parte degli harness dovrebbe anche registrare un provider. Il provider rende visibili al resto di
OpenClaw i riferimenti ai modelli, lo stato auth, i metadati del modello e la selezione `/model`.
L'harness poi prende in carico quel provider in `supports(...)`.

Il Plugin Codex incluso segue questo pattern:

- id provider: `codex`
- riferimenti modello utente: `codex/gpt-5.4`, `codex/gpt-5.2` o un altro modello restituito
  dal server app Codex
- id harness: `codex`
- auth: disponibilità provider sintetica, perché l'harness Codex gestisce il
  login/sessione Codex nativo
- richiesta app-server: OpenClaw invia a Codex il solo model id e lascia che
  l'harness parli con il protocollo nativo dell'app-server

Il Plugin Codex è additivo. I semplici riferimenti `openai/gpt-*` restano riferimenti del provider OpenAI
e continuano a usare il normale percorso provider di OpenClaw. Seleziona `codex/gpt-*`
quando vuoi auth gestita da Codex, discovery dei modelli Codex, thread nativi e
esecuzione tramite app-server Codex. `/model` può passare tra i modelli Codex restituiti
dal server app Codex senza richiedere credenziali del provider OpenAI.

Per la configurazione dell'operatore, esempi di prefissi modello e configurazioni solo Codex, vedi
[Codex Harness](/it/plugins/codex-harness).

OpenClaw richiede Codex app-server `0.118.0` o successivo. Il Plugin Codex controlla
l'handshake di inizializzazione dell'app-server e blocca server più vecchi o senza versione, così
OpenClaw viene eseguito solo contro la surface di protocollo con cui è stato testato.

### Middleware del risultato dello strumento dell'app-server Codex

I plugin inclusi possono anche collegare middleware `tool_result` specifici per l'app-server Codex tramite
`api.registerCodexAppServerExtensionFactory(...)` quando il loro
manifest dichiara `contracts.embeddedExtensionFactories: ["codex-app-server"]`.
Questa è l'interfaccia per plugin trusted per trasformazioni asincrone del risultato dello strumento che devono
essere eseguite all'interno dell'harness Codex nativo prima che l'output dello strumento venga proiettato
di nuovo nella transcript di OpenClaw.

### Modalità harness Codex nativa

L'harness `codex` incluso è la modalità Codex nativa per i turni agente
embedded di OpenClaw. Abilita prima il Plugin `codex` incluso e includi `codex` in
`plugins.allow` se la tua configurazione usa un'allowlist restrittiva. È diverso da `openai-codex/*`:

- `openai-codex/*` usa OAuth ChatGPT/Codex tramite il normale percorso provider di OpenClaw.
- `codex/*` usa il provider Codex incluso e instrada il turno tramite l'app-server Codex.

Quando questa modalità è in esecuzione, Codex gestisce thread id nativo, comportamento di resume,
Compaction ed esecuzione dell'app-server. OpenClaw mantiene comunque il controllo di canale chat,
mirror della transcript visibile, policy degli strumenti, approvazioni, consegna dei media e
selezione della sessione. Usa `embeddedHarness.runtime: "codex"` con
`embeddedHarness.fallback: "none"` quando devi dimostrare che solo il percorso
app-server Codex può prendere in carico l'esecuzione. Questa configurazione è solo una guardia di selezione:
i fallimenti dell'app-server Codex falliscono già direttamente invece di ritentare tramite PI.

## Disabilitare il fallback a PI

Per impostazione predefinita, OpenClaw esegue gli agenti embedded con `agents.defaults.embeddedHarness`
impostato su `{ runtime: "auto", fallback: "pi" }`. In modalità `auto`, gli harness Plugin registrati
possono prendere in carico una coppia provider/modello. Se nessuno corrisponde, OpenClaw usa il fallback a PI.

Imposta `fallback: "none"` quando hai bisogno che l'assenza di selezione di un harness Plugin fallisca
invece di usare PI. I fallimenti degli harness Plugin selezionati già falliscono in modo definitivo. Questo
non blocca un `runtime: "pi"` esplicito o `OPENCLAW_AGENT_RUNTIME=pi`.

Per esecuzioni embedded solo Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "codex/gpt-5.4",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

Se vuoi che qualsiasi harness Plugin registrato prenda in carico i modelli corrispondenti ma non vuoi mai
che OpenClaw usi silenziosamente il fallback a PI, mantieni `runtime: "auto"` e disabilita
il fallback:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "none"
      }
    }
  }
}
```

Gli override per agente usano la stessa struttura:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "codex/gpt-5.4",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` sovrascrive comunque il runtime configurato. Usa
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` per disabilitare dall'ambiente il fallback a PI.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Con il fallback disabilitato, una sessione fallisce subito quando l'harness richiesto non è
registrato, non supporta il provider/modello risolto o fallisce prima di
produrre effetti collaterali del turno. Questo è intenzionale per deployment solo Codex e
per test live che devono dimostrare che il percorso dell'app-server Codex è effettivamente in uso.

Questa impostazione controlla solo l'agent harness embedded. Non disabilita
instradamento di modelli specifici del provider per immagini, video, musica, TTS, PDF o altro.

## Sessioni native e mirror della transcript

Un harness può mantenere un session id nativo, thread id o token di resume lato daemon.
Mantieni quel binding associato esplicitamente alla sessione OpenClaw e continua
a riflettere l'output visibile all'utente di assistant/tool nella transcript di OpenClaw.

La transcript di OpenClaw resta il livello di compatibilità per:

- cronologia della sessione visibile nel canale
- ricerca e indicizzazione della transcript
- ritorno all'harness PI integrato in un turno successivo
- comportamento generico di `/new`, `/reset` ed eliminazione della sessione

Se il tuo harness memorizza un binding sidecar, implementa `reset(...)` così OpenClaw può
cancellarlo quando la sessione OpenClaw proprietaria viene reimpostata.

## Risultati di strumenti e media

Il core costruisce l'elenco degli strumenti OpenClaw e lo passa nel tentativo preparato.
Quando un harness esegue una chiamata a strumento dinamica, restituisci il risultato dello strumento
tramite la forma di risultato dell'harness invece di inviare tu stesso media sul canale.

Questo mantiene output di testo, immagine, video, musica, TTS, approvazione e strumenti di messaggistica
sullo stesso percorso di consegna delle esecuzioni supportate da PI.

## Limitazioni attuali

- Il percorso di importazione pubblico è generico, ma alcuni alias di tipo tentativo/risultato
  portano ancora nomi `Pi` per compatibilità.
- L'installazione di harness di terze parti è sperimentale. Preferisci i plugin provider
  finché non hai bisogno di un runtime di sessione nativo.
- Il cambio di harness è supportato tra un turno e l'altro. Non cambiare harness nel
  mezzo di un turno dopo che strumenti nativi, approvazioni, testo assistant o invii di messaggi
  sono già iniziati.

## Correlati

- [Panoramica SDK](/it/plugins/sdk-overview)
- [Helper runtime](/it/plugins/sdk-runtime)
- [Plugin provider](/it/plugins/sdk-provider-plugins)
- [Codex Harness](/it/plugins/codex-harness)
- [Provider di modelli](/it/concepts/model-providers)
