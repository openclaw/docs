---
read_when:
    - Stai modificando il runtime embedded dell'agente o il registro degli harness
    - Stai registrando un harness dell'agente da un Plugin incluso o fidato
    - Devi capire come il Plugin Codex si relaziona ai provider di modelli
sidebarTitle: Agent Harness
summary: Superficie SDK sperimentale per Plugin che sostituiscono l'esecutore embedded dell'agente di basso livello
title: Plugin harness dell'agente
x-i18n:
    generated_at: "2026-04-24T08:52:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: af76c2a3ebe54c87920954b58126ee59538c0e6d3d1b4ba44890c1f5079fabc2
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

Un **harness dell'agente** è l'esecutore di basso livello per un singolo turno
preparato di un agente OpenClaw. Non è un provider di modelli, non è un canale
e non è un registro di strumenti.

Usa questa superficie solo per Plugin nativi inclusi o fidati. Il contratto è
ancora sperimentale perché i tipi dei parametri riflettono intenzionalmente
l'attuale runner embedded.

## Quando usare un harness

Registra un harness dell'agente quando una famiglia di modelli ha il proprio runtime
di sessione nativo e il normale trasporto provider di OpenClaw è l'astrazione sbagliata.

Esempi:

- un server nativo coding-agent che possiede thread e Compaction
- una CLI o un daemon locale che deve trasmettere eventi nativi di piano/reasoning/strumenti
- un runtime di modello che ha bisogno del proprio resume id oltre alla
  trascrizione di sessione di OpenClaw

**Non** registrare un harness solo per aggiungere una nuova API LLM. Per normali API di modelli HTTP o
WebSocket, costruisci un [Plugin provider](/it/plugins/sdk-provider-plugins).

## Cosa continua a possedere il core

Prima che venga selezionato un harness, OpenClaw ha già risolto:

- provider e modello
- stato di autenticazione del runtime
- livello di reasoning e budget di contesto
- la trascrizione/file di sessione di OpenClaw
- workspace, sandbox e policy degli strumenti
- callback di risposta del canale e callback di streaming
- policy di fallback del modello e live model switching

Questa separazione è intenzionale. Un harness esegue un tentativo preparato; non sceglie
provider, non sostituisce il recapito del canale e non cambia silenziosamente modello.

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
    // Avvia o riprendi il tuo thread nativo.
    // Usa params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent e gli altri campi del tentativo preparato.
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

1. L'id dell'harness registrato di una sessione esistente ha la precedenza, così le modifiche di config/env non cambiano a caldo quel transcript verso un altro runtime.
2. `OPENCLAW_AGENT_RUNTIME=<id>` forza un harness registrato con quell'id per
   sessioni non ancora fissate.
3. `OPENCLAW_AGENT_RUNTIME=pi` forza l'harness PI integrato.
4. `OPENCLAW_AGENT_RUNTIME=auto` chiede agli harness registrati se supportano la
   coppia provider/modello risolta.
5. Se nessun harness registrato corrisponde, OpenClaw usa PI a meno che il fallback a PI
   non sia disabilitato.

I fallimenti dell'harness del Plugin emergono come fallimenti dell'esecuzione. In modalità `auto`, il fallback a PI viene
usato solo quando nessun harness del Plugin registrato supporta la
coppia provider/modello risolta. Una volta che un harness del Plugin ha reclamato un'esecuzione, OpenClaw non
riproduce lo stesso turno tramite PI perché questo può cambiare la semantica auth/runtime
o duplicare effetti collaterali.

L'id dell'harness selezionato viene persistito con l'id della sessione dopo un'esecuzione embedded.
Le sessioni legacy create prima dei pin dell'harness vengono trattate come fissate a PI una volta che hanno
cronologia di transcript. Usa una nuova/reimpostata sessione quando cambi tra PI e un
harness nativo del Plugin. `/status` mostra id di harness non predefiniti come `codex`
accanto a `Fast`; PI resta nascosto perché è il percorso di compatibilità predefinito.
Se l'harness selezionato sorprende, abilita il logging di debug `agents/harness` e
ispeziona il record strutturato del gateway `agent harness selected`. Include
l'id dell'harness selezionato, il motivo della selezione, la policy runtime/fallback e, in
modalità `auto`, il risultato del supporto di ciascun candidato Plugin.

Il Plugin Codex incluso registra `codex` come id del proprio harness. Il core lo tratta
come un normale id di harness di Plugin; alias specifici di Codex appartengono al Plugin
o alla configurazione dell'operatore, non al selettore runtime condiviso.

## Accoppiamento provider più harness

La maggior parte degli harness dovrebbe registrare anche un provider. Il provider rende visibili
al resto di OpenClaw i ref dei modelli, lo stato auth, i metadati del modello e la selezione `/model`.
L'harness poi reclama quel provider in `supports(...)`.

Il Plugin Codex incluso segue questo modello:

- id provider: `codex`
- ref di modello utente: `openai/gpt-5.5` più `embeddedHarness.runtime: "codex"`;
  i ref legacy `codex/gpt-*` restano accettati per compatibilità
- id harness: `codex`
- auth: disponibilità sintetica del provider, perché l'harness Codex possiede il
  login/sessione nativi di Codex
- richiesta app-server: OpenClaw invia a Codex l'id nudo del modello e lascia che
  l'harness parli con il protocollo nativo app-server

Il Plugin Codex è additivo. I ref semplici `openai/gpt-*` continuano a usare il
normale percorso provider di OpenClaw a meno che tu non forzi l'harness Codex con
`embeddedHarness.runtime: "codex"`. I vecchi ref `codex/gpt-*` continuano invece a selezionare il
provider e l'harness Codex per compatibilità.

Per la configurazione dell'operatore, esempi di prefissi modello e configurazioni solo Codex, vedi
[Codex Harness](/it/plugins/codex-harness).

OpenClaw richiede un app-server Codex `0.118.0` o successivo. Il Plugin Codex controlla
l'handshake initialize dell'app-server e blocca server più vecchi o senza versione così
OpenClaw viene eseguito solo contro la superficie di protocollo su cui è stato testato.

### Middleware del tool-result dell'app-server Codex

I Plugin inclusi possono anche collegare middleware `tool_result`
specifici dell'app-server Codex tramite `api.registerCodexAppServerExtensionFactory(...)` quando il loro
manifest dichiara `contracts.embeddedExtensionFactories: ["codex-app-server"]`.
Questo è il seam di Plugin fidato per trasformazioni asincrone del risultato degli strumenti che devono
essere eseguite all'interno dell'harness Codex nativo prima che l'output dello strumento venga proiettato
di nuovo nella trascrizione di OpenClaw.

### Modalità harness Codex nativa

L'harness `codex` incluso è la modalità Codex nativa per i turni embedded
degli agenti OpenClaw. Abilita prima il Plugin `codex` incluso e includi `codex` in
`plugins.allow` se la tua configurazione usa un'allowlist restrittiva. Le configurazioni native dell'app-server
dovrebbero usare `openai/gpt-*` con `embeddedHarness.runtime: "codex"`.
Usa invece `openai-codex/*` per OAuth Codex tramite PI. I ref di modello legacy `codex/*`
restano alias di compatibilità per l'harness nativo.

Quando questa modalità è in esecuzione, Codex possiede thread id nativo, comportamento di resume,
Compaction ed esecuzione dell'app-server. OpenClaw continua comunque a possedere il canale chat,
il mirror della trascrizione visibile, la policy degli strumenti, le approvazioni, il recapito dei media e la selezione della sessione. Usa `embeddedHarness.runtime: "codex"` con
`embeddedHarness.fallback: "none"` quando devi dimostrare che solo il
percorso app-server Codex può reclamare l'esecuzione. Quella configurazione è solo un guard di selezione:
i fallimenti dell'app-server Codex falliscono già direttamente invece di ritentare tramite PI.

## Disabilitare il fallback a PI

Per impostazione predefinita, OpenClaw esegue gli agenti embedded con `agents.defaults.embeddedHarness`
impostato su `{ runtime: "auto", fallback: "pi" }`. In modalità `auto`, gli harness dei Plugin registrati
possono reclamare una coppia provider/modello. Se nessuno corrisponde, OpenClaw usa il fallback a PI.

Imposta `fallback: "none"` quando hai bisogno che la mancata selezione dell'harness del Plugin
fallisca invece di usare PI. I fallimenti dell'harness del Plugin selezionato falliscono già in modo rigido. Questo
non blocca un `runtime: "pi"` esplicito o `OPENCLAW_AGENT_RUNTIME=pi`.

Per esecuzioni embedded solo Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

Se vuoi che qualsiasi harness del Plugin registrato reclami i modelli corrispondenti ma non vuoi mai che OpenClaw usi silenziosamente il fallback a PI, mantieni `runtime: "auto"` e disabilita il fallback:

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

Gli override per agente usano la stessa forma:

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
        "model": "openai/gpt-5.5",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` continua a sovrascrivere il runtime configurato. Usa
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` per disabilitare il fallback a PI
dall'ambiente.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Con il fallback disabilitato, una sessione fallisce presto quando l'harness richiesto non è
registrato, non supporta la coppia provider/modello risolta o fallisce prima di
produrre effetti collaterali del turno. Questo è intenzionale per distribuzioni solo Codex e
per test live che devono dimostrare che il percorso app-server Codex è effettivamente in uso.

Questa impostazione controlla solo l'harness embedded dell'agente. Non disabilita
instradamento di provider specifici per immagini, video, musica, TTS, PDF o altro.

## Sessioni native e mirror della trascrizione

Un harness può mantenere un id di sessione nativa, un thread id o un token di resume lato daemon.
Mantieni quel binding esplicitamente associato alla sessione OpenClaw e continua
a riflettere output di assistente/strumenti visibili all'utente nella trascrizione OpenClaw.

La trascrizione OpenClaw resta il livello di compatibilità per:

- cronologia di sessione visibile nel canale
- ricerca e indicizzazione della trascrizione
- ritorno all'harness PI integrato in un turno successivo
- comportamento generico di `/new`, `/reset` e cancellazione della sessione

Se il tuo harness memorizza un binding sidecar, implementa `reset(...)` così OpenClaw può
cancellarlo quando la sessione OpenClaw proprietaria viene reimpostata.

## Risultati di strumenti e media

Il core costruisce la lista degli strumenti OpenClaw e la passa nel tentativo preparato.
Quando un harness esegue una chiamata dinamica a uno strumento, restituisci il risultato dello strumento tramite
la forma di risultato dell'harness invece di inviare tu stesso i media del canale.

Questo mantiene testo, immagine, video, musica, TTS, approvazione e output
degli strumenti di messaggistica sullo stesso percorso di recapito delle esecuzioni supportate da PI.

## Limitazioni attuali

- Il percorso di importazione pubblico è generico, ma alcuni alias di tipo tentativo/risultato portano ancora
  nomi `Pi` per compatibilità.
- L'installazione di harness di terze parti è sperimentale. Preferisci Plugin provider
  finché non ti serve un runtime di sessione nativo.
- Il cambio di harness è supportato tra un turno e l'altro. Non cambiare harness nel
  mezzo di un turno dopo che strumenti nativi, approvazioni, testo dell'assistente o invii di messaggi sono iniziati.

## Correlati

- [Panoramica SDK](/it/plugins/sdk-overview)
- [Helper runtime](/it/plugins/sdk-runtime)
- [Plugin provider](/it/plugins/sdk-provider-plugins)
- [Codex Harness](/it/plugins/codex-harness)
- [Provider di modelli](/it/concepts/model-providers)
