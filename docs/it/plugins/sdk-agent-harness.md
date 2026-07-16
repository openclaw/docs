---
read_when:
    - Si sta modificando il runtime dell'agente incorporato o il registro dell'harness
    - Si sta registrando un harness per agenti da un plugin incluso o attendibile
    - È necessario comprendere in che modo il plugin Codex si relaziona ai provider di modelli
sidebarTitle: Agent Harness
summary: Superficie SDK sperimentale per i Plugin che sostituiscono l'esecutore di agenti integrato di basso livello
title: Plugin dell'infrastruttura agenti
x-i18n:
    generated_at: "2026-07-16T14:48:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 862d53022e48b93c98e98162f76460433b76005cba3188342d0977b951044106
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Un **agent harness** è l'esecutore di basso livello per un singolo turno preparato
di un agente OpenClaw. Non è un provider di modelli, né un canale, né un registro
di strumenti. Per il modello concettuale rivolto all'utente, vedere [Runtime degli agenti](/it/concepts/agent-runtimes).

Usare questa superficie solo per plugin nativi integrati o attendibili. Il contratto è
ancora sperimentale perché i tipi dei parametri rispecchiano intenzionalmente
l'attuale runner incorporato.

## Quando usare un harness

Registrare un agent harness quando una famiglia di modelli dispone di un proprio runtime
di sessione nativo e il normale trasporto del provider OpenClaw costituisce l'astrazione errata:

- un server nativo per agenti di coding che gestisce thread e Compaction
- una CLI locale o un daemon che deve trasmettere in streaming eventi nativi di pianificazione/ragionamento/strumenti
- un runtime di modello che necessita di un proprio ID di ripresa oltre alla trascrizione
  della sessione OpenClaw

**Non** registrare un harness solo per aggiungere una nuova API LLM. Per le normali API
di modello HTTP o WebSocket, creare un [plugin provider](/it/plugins/sdk-provider-plugins).

## Cosa rimane sotto il controllo del core

Prima che venga selezionato un harness, OpenClaw ha già risolto:

- provider e modello
- stato di autenticazione del runtime, salvo che l'harness dichiari di gestire il bootstrap dell'autenticazione
- livello di ragionamento e budget del contesto
- file di trascrizione/sessione OpenClaw
- area di lavoro, sandbox e criteri degli strumenti
- callback delle risposte del canale e callback di streaming
- criteri di fallback e cambio dinamico del modello

Un harness esegue un tentativo preparato; non seleziona i provider, non sostituisce la
consegna tramite canale e non cambia silenziosamente modello.

### Bootstrap dell'autenticazione gestito dall'harness

Per impostazione predefinita, il core risolve le credenziali del provider prima di chiamare un harness. Un
harness attendibile in grado di autenticarsi tramite il proprio runtime nativo può impostare
`authBootstrap: "harness"` nella propria registrazione statica `AgentHarness`. Il core quindi
ignora il bootstrap generico delle credenziali del provider e l'errore per credenziali mancanti
per ogni tentativo rivendicato da tale harness.

Il core inoltra comunque un profilo di autenticazione OpenClaw compatibile, selezionato
esplicitamente o ordinato, e il relativo archivio con ambito limitato, quando disponibili. L'harness deve risolvere
tale profilo o le proprie credenziali native prima di inviare richieste al modello, mantenere i segreti
limitati al tentativo e segnalare errori di autenticazione sui quali sia possibile intervenire. Non
impostare questa funzionalità su un harness che gestisce l'autenticazione solo in alcuni casi.

### Artefatti verificati del runtime di configurazione

Un harness locale in grado di fornire inferenza per la configurazione iniziale deve attestare
l'implementazione che ha completato il probe. Quando
`params.captureRuntimeArtifact` è true, restituire un
`result.runtimeArtifact` opaco con un ID stabile e un'impronta digitale del contenuto. Registrare una
funzionalità `runtimeArtifact.validate(...)` corrispondente che verifichi nuovamente tale associazione
senza caricare un harness diverso o analizzare plugin non correlati.

Le continuazioni OpenClaw verificate trasmettono anche `params.expectedRuntimeArtifact`.
L'harness deve confrontarlo con l'esatto processo nativo acquisito e generare un errore
prima di avviare o riprendere un thread nativo se differiscono. I normali turni dell'agente
omettono entrambi i campi, quindi l'hashing del contenuto rimane escluso dal normale percorso critico
della richiesta. Gli harness remoti/WebSocket necessitano di un contratto di attestazione del server prima
di poter partecipare; una sola stringa di versione non costituisce l'identità di un artefatto.

Il tentativo preparato include anche `params.runtimePlan`, un pacchetto di criteri
gestito da OpenClaw per le decisioni del runtime che devono rimanere condivise tra OpenClaw e
gli harness nativi:

- `runtimePlan.tools.normalize(...)` e `runtimePlan.tools.logDiagnostics(...)`
  per i criteri dello schema degli strumenti sensibili al provider
- `runtimePlan.transcript.resolvePolicy(...)` per la sanitizzazione della trascrizione e
  i criteri di riparazione delle chiamate agli strumenti
- `runtimePlan.delivery.isSilentPayload(...)` per `NO_REPLY` condiviso e la soppressione
  della consegna dei contenuti multimediali
- `runtimePlan.outcome.classifyRunResult(...)` per la classificazione del
  fallback del modello
- `runtimePlan.observability` per i metadati risolti di provider/modello/harness

Gli harness possono usare il piano per decisioni che devono corrispondere al comportamento di OpenClaw,
ma devono trattarlo come stato del tentativo gestito dall'host: non modificarlo né usarlo per cambiare
provider/modello all'interno di un turno.

### Contratto del trasporto delle richieste

`supports(ctx)` riceve il trasporto del modello risolto in `ctx.modelProvider`.
Due informazioni prive di segreti e gestite dal provider descrivono il percorso selezionato:

- `runtimePolicy.compatibleIds` elenca gli ID di runtime che il provider dichiara
  compatibili con quello specifico percorso. L'assenza di criteri indica che il provider non ha
  dichiarato la compatibilità a livello di percorso; non autorizza a presupporre il supporto.
- `requestTransportOverrides: "none"` indica che non deve essere riprodotta alcuna sostituzione
  personalizzata della richiesta del provider/modello. `"present"` indica che sono presenti
  intestazioni personalizzate, trasporto dell'autenticazione, proxy, TLS, comportamento del servizio locale
  o della rete privata oppure parametri della richiesta. Questa informazione non espone tali valori.

Restituire `{ supported: false, reason }` quando l'harness non può riprodurre il
trasporto preparato. Non dedurre il supporto leggendo la configurazione non elaborata dopo la selezione.
Quando la preparazione dell'autenticazione produce più percorsi di nuovo tentativo, un singolo harness deve supportarli
tutti prima dell'invio. La selezione implicita usa OpenClaw se nessun plugin può
gestire l'intero insieme; una selezione esplicita o persistente del plugin genera un errore in modo restrittivo.

## Registrare un harness

**Importazione:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "Il mio agent harness nativo",

  supports(ctx) {
    const routeSupportsHarness =
      ctx.modelProvider?.runtimePolicy?.compatibleIds.includes("my-harness") === true;
    const canReproduceRequest = ctx.modelProvider?.requestTransportOverrides !== "present";
    return ctx.provider === "my-provider" && routeSupportsHarness && canReproduceRequest
      ? { supported: true, priority: 100 }
      : { supported: false, reason: "il percorso effettivo non è compatibile con l'harness" };
  },

  async runAttempt(params) {
    // Avviare o riprendere il thread nativo.
    // Usare params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent e gli altri campi del tentativo preparato.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "Il mio agente nativo",
  description: "Esegue i modelli selezionati tramite un daemon agente nativo.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

`authBootstrap` è intenzionalmente assente da questo esempio generico. Aggiungere
`authBootstrap: "harness"` solo quando l'harness soddisfa il contratto precedente.

### Esecuzione delegata

Il proprietario di un harness può impostare `delegatedExecutionPluginIds` sugli ID dei plugin
attendibili che devono eseguire una sessione esistente vincolata al modello, ad esempio un trasporto
vocale che continua una conversazione basata su Codex. Si tratta del consenso statico del proprietario,
non di un elenco di autorizzazioni del core. Mantenerlo circoscritto.

I delegati ricevono soltanto l'ammissione del lavoro e l'esecuzione incorporata. OpenClaw richiede
l'esatta chiave di sessione archiviata, il percorso dell'archivio e l'ID della sessione; `modelSelectionLocked:
true`; e valori `agentHarnessId` e `agentHarnessRuntimeOverride` corrispondenti.
L'esecuzione viene quindi circoscritta tramite il proprietario dell'harness. La creazione, la modifica,
la reimpostazione, l'eliminazione e l'archiviazione delle sessioni, nonché le modifiche al Gateway, rimangono riservate al proprietario.

## Criteri di selezione

OpenClaw sceglie un harness dopo la risoluzione di provider/modello:

1. I criteri di runtime con ambito di modello hanno la precedenza.
2. Seguono i criteri di runtime con ambito di provider.
3. `auto` chiede agli harness registrati se supportano il percorso effettivo
   risolto. I soli prefissi di provider/modello non selezionano mai un harness.
4. Se nessun harness registrato corrisponde, OpenClaw usa il proprio runtime incorporato.

Gli errori degli harness dei plugin vengono segnalati come errori di esecuzione. In modalità `auto`, il
fallback incorporato si applica solo quando nessun harness di plugin registrato supporta il
provider/modello risolto. Dopo che un harness di plugin ha rivendicato un'esecuzione, OpenClaw non
riproduce lo stesso turno tramite un altro runtime, poiché ciò può modificare
la semantica di autenticazione/runtime o duplicare gli effetti collaterali.

I criteri di runtime configurati rimangono determinanti per il runtime desiderato. Un
`agentHarnessId` di sessione persistente mantiene la proprietà della propria trascrizione nativa
mentre la preparazione del percorso/autenticazione è ancora in corso. Nessuno dei due rende compatibile un
percorso incompatibile: quando sono disponibili le informazioni preparate, l'harness selezionato o fissato
deve supportarle, altrimenti l'esecuzione genera un errore in modo restrittivo. `/status` mostra il runtime effettivo
selezionato in base ai criteri, alla proprietà persistente e al supporto del percorso.
Lo stato preparato è esplicito: un `runtimePolicy` mancante resta non dichiarato anziché
essere dedotto dai campi di trasporto eventualmente presenti.
Quando l'autenticazione gestita dall'harness lascia irrisolti più percorsi fisici, l'informazione
di supporto preparata è l'intersezione dei relativi ID di runtime compatibili e
segnala le sostituzioni della richiesta se un qualsiasi candidato le contiene. Un solo candidato non dichiarato
rende quindi vuota la compatibilità nativa; `preparedAuth.source: "harness"`
è un proprietario dell'autenticazione, non un'autorizzazione a dedurre il supporto del percorso.

Se l'harness selezionato è inatteso, abilitare il logging di debug `agents/harness`
e ispezionare il record strutturato `agent harness selected` del Gateway: include
l'ID dell'harness selezionato, il motivo della selezione, i criteri di runtime/fallback
e, in modalità `auto`, il risultato del supporto di ciascun candidato plugin.

Il plugin Codex integrato registra `codex` come ID del proprio harness. Il core lo tratta
come un normale ID di harness di plugin; gli alias specifici di Codex appartengono al plugin
o alla configurazione dell'operatore, non al selettore di runtime condiviso.

## Associazione tra provider e harness

La maggior parte degli harness dovrebbe registrare anche un provider. Il provider rende visibili al resto di
OpenClaw i riferimenti ai modelli, lo stato di autenticazione, i metadati dei modelli e la selezione
`/model`. L'harness rivendica quindi tale provider in `supports(...)`.

Il plugin Codex integrato segue questo schema:

- riferimenti ai modelli utente preferiti: `openai/gpt-5.6-sol`
- riferimenti di compatibilità: i riferimenti legacy `codex/gpt-*` restano accettati, ma le nuove
  configurazioni non dovrebbero usarli come normali riferimenti provider/modello
- ID harness: `codex`
- autenticazione: disponibilità sintetica del provider, perché l'harness Codex gestisce
  l'accesso e la sessione nativi di Codex
- richiesta all'app-server: OpenClaw invia a Codex l'ID del modello non elaborato e lascia che
  l'harness comunichi con il protocollo nativo dell'app-server

Il plugin Codex è additivo. Se i criteri di runtime non sono impostati o sono `auto`, OpenAI può
selezionare Codex solo quando il contratto del percorso gestito dal provider dichiara `codex`
compatibile: un percorso ufficiale HTTPS Platform Responses o ChatGPT Responses esatto
senza alcuna sostituzione personalizzata della richiesta. Il solo prefisso `openai/*` non
seleziona mai Codex. Endpoint personalizzati, adattatori Completions e comportamenti personalizzati
delle richieste restano su OpenClaw. Gli endpoint HTTP ufficiali in chiaro vengono rifiutati. I riferimenti `codex/gpt-*`
precedenti restano input di compatibilità. Vedere
[Runtime implicito dell'agente OpenAI](/it/providers/openai#implicit-agent-runtime).

Per la configurazione da parte dell'operatore, esempi di prefissi dei modelli e configurazioni esclusivamente Codex, vedere
[Harness Codex](/it/plugins/codex-harness).

Il plugin Codex applica la versione minima dell'app-server documentata in
[Harness Codex](/it/plugins/codex-harness). Verifica l'handshake di inizializzazione e
blocca i server precedenti o privi di versione, in modo che OpenClaw venga eseguito solo sulla superficie
del protocollo che è stata verificata.

### Middleware dei risultati degli strumenti

I plugin integrati e i plugin installati esplicitamente abilitati con contratti
manifest corrispondenti possono collegare middleware dei risultati degli strumenti indipendente dal runtime tramite
`api.registerAgentToolResultMiddleware(...)` quando il loro manifest dichiara gli
ID di runtime di destinazione in `contracts.agentToolResultMiddleware`. Questa superficie attendibile
serve per trasformazioni asincrone dei risultati degli strumenti che devono essere eseguite prima che OpenClaw o
Codex restituisca l'output degli strumenti al modello.

I Plugin legacy inclusi possono ancora usare
`api.registerCodexAppServerExtensionFactory(...)` per il middleware riservato all'app-server Codex, ma le nuove trasformazioni dei risultati devono usare l'API indipendente dal runtime. L'hook `api.registerEmbeddedExtensionFactory(...)`, riservato al runner incorporato, è stato
rimosso; le trasformazioni incorporate dei risultati degli strumenti devono usare middleware indipendente dal runtime.

### Classificazione dell'esito terminale

Gli harness nativi che gestiscono la propria proiezione del protocollo possono usare
`classifyAgentHarnessTerminalOutcome(...)` da
`openclaw/plugin-sdk/agent-harness-runtime` quando un turno completato non ha prodotto
testo visibile dell'assistente. L'helper restituisce `empty`, `reasoning-only` o
`planning-only`, affinché la politica di fallback di OpenClaw possa decidere se riprovare con un
modello diverso. `planning-only` richiede il campo `planText` esplicito
dell'harness; OpenClaw non lo deduce dal testo dell'assistente. L'helper
lascia intenzionalmente non classificati gli errori del prompt, i turni in corso e le risposte
intenzionalmente silenziose come `NO_REPLY`.

### Effetti collaterali al termine dell'agente

Gli harness nativi devono chiamare `runAgentEndSideEffects(...)` da
`openclaw/plugin-sdk/agent-harness-runtime` dopo aver finalizzato un tentativo. Questo
invia l'hook portabile `agent_end` e l'acquisizione delle ricerche di OpenClaw
senza ritardare le risposte interattive. Usare `awaitAgentEndSideEffects(...)` per
le esecuzioni locali non interattive nelle quali il tentativo non deve concludersi finché tali
effetti collaterali non sono terminati. Entrambi gli helper accettano lo stesso payload `{ event, ctx }` di
`runAgentHarnessAgentEndHook(...)`; i loro errori non modificano il risultato del
tentativo completato.

### Input utente e superfici degli strumenti

Gli harness nativi che espongono una richiesta di input utente a livello di runtime devono usare gli
helper per l'input utente da `openclaw/plugin-sdk/agent-harness-runtime` per formattare
il prompt, recapitarlo tramite il percorso di risposta bloccante di OpenClaw e normalizzare
le risposte a scelta/libere nella forma di risposta nativa del runtime. L'helper
mantiene coerente la presentazione tra canale e TUI, mentre ogni harness conserva il proprio
parsing del protocollo e il ciclo di vita delle richieste in sospeso.

Gli harness nativi che necessitano di un instradamento compatto degli strumenti simile a PI devono usare
`createAgentHarnessToolSurfaceRuntime(...)` da
`openclaw/plugin-sdk/agent-harness-tool-runtime`. Questo gestisce
la selezione dei controlli per ricerca degli strumenti/modalità codice, le impostazioni predefinite essenziali per i modelli locali,
il filtraggio degli schemi compatibile con il runtime, l'esecuzione nascosta del catalogo, l'idratazione
delle directory e la pulizia del catalogo. Gli harness continuano a gestire la conversione degli strumenti
specifica del proprio SDK e il callback di esecuzione nativo.

### Modalità harness Codex nativa

L'harness `codex` incluso è la modalità Codex nativa per i turni dell'agente OpenClaw
incorporato. Abilitare prima il Plugin `codex` incluso e includere `codex` in
`plugins.allow` se la configurazione usa un elenco consentito restrittivo. Le configurazioni native dell'app-server
devono usare `openai/gpt-*`; i turni dell'agente OpenAI selezionano l'harness Codex
solo quando il percorso effettivo dichiara la compatibilità con Codex. I riferimenti legacy ai modelli Codex
devono essere corretti con `openclaw doctor --fix`, mentre i riferimenti legacy ai modelli `codex/*`
rimangono alias di compatibilità per l'harness nativo.

Quando questa modalità è in esecuzione, Codex gestisce l'id del thread nativo, il comportamento di ripresa,
la Compaction e l'esecuzione dell'app-server. OpenClaw continua a gestire il canale di chat,
la copia visibile della trascrizione, la politica degli strumenti, le approvazioni, la distribuzione dei contenuti multimediali e la selezione
della sessione. Usare il provider/modello `agentRuntime.id: "codex"` quando è necessario
dimostrare che solo il percorso dell'app-server Codex può acquisire l'esecuzione. I runtime dei Plugin
espliciti adottano un comportamento fail-closed; gli errori di selezione e di runtime dell'app-server Codex
non vengono ritentati tramite un altro runtime.

## Rigidità del runtime

Per impostazione predefinita, OpenClaw usa la politica di runtime provider/modello `auto`: gli harness dei
Plugin registrati possono acquisire i percorsi effettivi compatibili e il runtime
incorporato gestisce il turno quando nessuno corrisponde. Il solo prefisso di provider/modello non
seleziona mai un harness. Usare un runtime Plugin provider/modello esplicito, come
`agentRuntime.id: "codex"`, quando l'assenza di selezione dell'harness deve causare un errore
invece dell'instradamento tramite il runtime incorporato. La selezione esplicita non rende
compatibile un percorso incompatibile. Gli errori degli harness dei Plugin selezionati causano sempre
un errore irreversibile. Ciò non impedisce un
`agentRuntime.id: "openclaw"` provider/modello esplicito.

Per le esecuzioni incorporate riservate a Codex:

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
      "model": "openai/gpt-5.6-sol"
    }
  }
}
```

Per usare un backend CLI per un singolo modello canonico, inserire il runtime nella relativa
voce del modello:

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

Le sostituzioni specifiche per agente usano la stessa struttura con ambito modello:

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.6-sol",
        "models": {
          "openai/gpt-5.6-sol": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

Gli esempi legacy di runtime per l'intero agente come il seguente vengono ignorati:

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

Con un runtime Plugin esplicito, una sessione termina anticipatamente con un errore quando l'harness richiesto
non è registrato, non supporta il provider/modello risolto oppure
fallisce prima di produrre effetti collaterali del turno. Questo comportamento è intenzionale per le distribuzioni
riservate a Codex e per i test live che devono dimostrare che il percorso dell'app-server Codex è
effettivamente in uso.

Questa impostazione controlla solo l'harness dell'agente incorporato. Non disabilita
l'instradamento dei modelli specifico del provider per immagini, video, musica, TTS, PDF o altri contenuti.

## Sessioni native e copia della trascrizione

Un harness può mantenere un id sessione nativo, un id thread o un token di ripresa
lato daemon. Mantenere tale associazione esplicitamente collegata alla sessione OpenClaw e
continuare a copiare l'output visibile all'utente dell'assistente/degli strumenti nella
trascrizione di OpenClaw.

La trascrizione di OpenClaw rimane il livello di compatibilità per:

- cronologia della sessione visibile nel canale
- ricerca e indicizzazione della trascrizione
- ritorno all'harness OpenClaw integrato in un turno successivo
- comportamento generico di `/new`, `/reset` ed eliminazione della sessione

Se l'harness archivia un'associazione sidecar, implementare `reset(...)` affinché OpenClaw
possa eliminarla quando viene reimpostata la sessione OpenClaw proprietaria.

## Risultati di strumenti e contenuti multimediali

Il core costruisce l'elenco degli strumenti OpenClaw e lo passa al
tentativo preparato. Quando un harness esegue una chiamata dinamica a uno strumento, restituire il risultato dello strumento
tramite la forma del risultato dell'harness anziché inviare direttamente i contenuti multimediali al
canale.

In questo modo, gli output di testo, immagini, video, musica, TTS, approvazioni e strumenti di messaggistica
seguono lo stesso percorso di distribuzione delle esecuzioni supportate da OpenClaw.

### Esiti terminali degli strumenti

`AgentHarnessAttemptParams.observeToolTerminal` è l'accumulatore degli esiti
terminali gestito dall'host. Un harness che esegue strumenti dinamici OpenClaw o strumenti
nativi deve chiamarlo quando ogni strumento raggiunge un singolo esito terminale, prima che il
risultato del tentativo venga finalizzato. Gli harness che non eseguono strumenti non devono
chiamarlo.

Riportare i fatti dal confine di esecuzione:

- Passare l'id della chiamata del protocollo quando esiste, il nome canonico dello strumento e gli
  argomenti che hanno effettivamente raggiunto lo strumento dopo la preparazione o le riscritture degli hook.
- Impostare `executionStarted: false` quando la convalida, l'approvazione o un altro controllo
  ha interrotto la chiamata prima dell'avvio dell'implementazione dello strumento. Quando l'invio
  potrebbe essere avvenuto, riportare prudentemente `true`.
- Riportare `outcome: "success"` o `outcome: "failure"`. Includere i campi strutturati
  relativi all'errore disponibili nel runtime, anziché dedurre l'errore dal
  testo visualizzato.
- Usare `nativeMutation` solo per gli strumenti nativi che non usano una definizione di strumento
  OpenClaw. Fornire in tale sede i dati sulla mutazione e sulla ripetizione gestiti dal protocollo; non
  copiare il classificatore delle mutazioni di OpenClaw nell'harness.

Il callback restituisce la risoluzione canonica per la chiamata. Trasferire il relativo
`lastToolError` in `AgentHarnessAttemptResult` e usare i relativi dati di esecuzione,
argomenti ed effetti collaterali nella proiezione dell'harness anziché derivare
uno stato parallelo. L'host conserva un errore di mutazione non risolto anche dopo il successo di strumenti
non correlati e lo elimina solo dopo il completamento dell'azione corrispondente.

Il callback rimane facoltativo per garantire la compatibilità del codice sorgente con gli harness sperimentali
precedenti. Facoltativo non significa trascurabile per un harness che esegue strumenti:
senza rapporti terminali, OpenClaw non può preservare l'effettivo errore degli strumenti con mutazioni
nelle chiamate successive agli strumenti, incluso il completamento silenzioso dell'Heartbeat.

## Limitazioni attuali

- Il percorso di importazione pubblico è generico, ma alcuni alias dei tipi di tentativo/risultato
  conservano ancora nomi legacy per compatibilità.
- L'installazione di harness di terze parti è sperimentale. Preferire i Plugin dei provider
  finché non è necessario un runtime di sessione nativo.
- Il passaggio da un harness all'altro è supportato tra i turni. Non cambiare harness nel
  corso di un turno dopo l'avvio di strumenti nativi, approvazioni, testo dell'assistente o invii
  di messaggi.

## Contenuti correlati

- [Panoramica dell'SDK](/it/plugins/sdk-overview)
- [Helper del runtime](/it/plugins/sdk-runtime)
- [Plugin dei provider](/it/plugins/sdk-provider-plugins)
- [Harness Codex](/it/plugins/codex-harness)
- [Provider di modelli](/it/concepts/model-providers)
