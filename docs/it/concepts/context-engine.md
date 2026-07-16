---
read_when:
    - Si desidera comprendere come OpenClaw assembla il contesto del modello
    - Si sta passando dal motore legacy a un motore Plugin
    - Stai creando un plugin per il motore di contesto
sidebarTitle: Context engine
summary: 'Motore di contesto: composizione del contesto modulare, Compaction e ciclo di vita dei sottoagenti'
title: Motore di contesto
x-i18n:
    generated_at: "2026-07-16T14:06:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 05cb5eb01f002001354dc63b77cdb86f3e9f3bc51722bd943ac20c9e1566dc60
    source_path: concepts/context-engine.md
    workflow: 16
---

Un **motore di contesto** controlla il modo in cui OpenClaw costruisce il contesto del modello per ogni esecuzione: quali messaggi includere, come riassumere la cronologia meno recente e come gestire il contesto oltre i confini dei subagenti.

OpenClaw include un motore `legacy` integrato e lo utilizza per impostazione predefinita. Installare e selezionare un motore Plugin solo quando si desidera un comportamento diverso per l'assemblaggio, la Compaction o il recupero tra sessioni.

## Avvio rapido

<Steps>
  <Step title="Verificare quale motore è attivo">
    ```bash
    openclaw doctor
    # oppure ispezionare direttamente la configurazione:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Installare un motore Plugin">
    I Plugin del motore di contesto vengono installati come qualsiasi altro Plugin di OpenClaw.

    <Tabs>
      <Tab title="Da npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="Da un percorso locale">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Abilitare e selezionare il motore">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // deve corrispondere all'id del motore registrato dal plugin
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // La configurazione specifica del plugin va inserita qui (consultare la documentazione del plugin)
          },
        },
      },
    }
    ```

    Riavviare il Gateway dopo l'installazione e la configurazione.

  </Step>
  <Step title="Tornare al motore precedente (facoltativo)">
    Impostare `contextEngine` su `"legacy"` (oppure rimuovere completamente la chiave: `"legacy"` è il valore predefinito).
  </Step>
</Steps>

## Funzionamento

Ogni volta che OpenClaw esegue un prompt del modello, il motore di contesto interviene in quattro punti del ciclo di vita:

<AccordionGroup>
  <Accordion title="1. Acquisizione">
    Chiamato quando viene aggiunto un nuovo messaggio alla sessione. Il motore può archiviare o indicizzare il messaggio nel proprio archivio dati.
  </Accordion>
  <Accordion title="2. Assemblaggio">
    Chiamato prima di ogni esecuzione del modello. Il motore restituisce un insieme ordinato di messaggi (e un `systemPromptAddition` facoltativo) che rientrano nel budget di token.
  </Accordion>
  <Accordion title="3. Compattazione">
    Chiamato quando la finestra di contesto è piena o quando si esegue `/compact`. Il motore riassume la cronologia meno recente per liberare spazio.
  </Accordion>
  <Accordion title="4. Dopo il turno">
    Chiamato al completamento di un'esecuzione. Il motore può rendere persistente lo stato, attivare la Compaction in background o aggiornare gli indici.
  </Accordion>
</AccordionGroup>

I motori possono inoltre implementare un metodo facoltativo `maintain()` per la manutenzione della trascrizione (riscritture sicure tramite `runtimeContext.rewriteTranscriptEntries()`) dopo il bootstrap, un turno completato correttamente o la Compaction. Impostare `info.turnMaintenanceMode: "background"` per eseguirlo come attività differita anziché bloccare la risposta.

Per l'harness Codex non ACP incluso, OpenClaw applica lo stesso ciclo di vita proiettando il contesto assemblato nelle istruzioni per sviluppatori di Codex e nel prompt del turno corrente. Codex continua a gestire la propria cronologia nativa dei thread e il proprio compattatore nativo.

### Ciclo di vita dei subagenti (facoltativo)

OpenClaw chiama due hook facoltativi del ciclo di vita dei subagenti:

<ParamField path="prepareSubagentSpawn" type="method">
  Prepara lo stato di contesto condiviso prima dell'avvio di un'esecuzione figlia. L'hook riceve le chiavi delle sessioni padre e figlia, `contextMode` (`isolated` o `fork`), gli id/file di trascrizione disponibili e un TTL facoltativo. Se restituisce un handle di rollback, OpenClaw lo chiama quando la generazione non riesce dopo il completamento della preparazione. Le generazioni native di subagenti che richiedono `lightContext` e si risolvono in `contextMode="isolated"` ignorano intenzionalmente questo hook, affinché la sessione figlia inizi dal contesto di bootstrap leggero senza uno stato precedente alla generazione gestito dal motore di contesto.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Esegue la pulizia quando una sessione del subagente termina o viene rimossa.
</ParamField>

### Aggiunta al prompt di sistema

Il metodo `assemble` può restituire una stringa `systemPromptAddition`. OpenClaw la antepone al prompt di sistema dell'esecuzione. Ciò consente ai motori di inserire indicazioni dinamiche per il recupero, istruzioni di reperimento o suggerimenti sensibili al contesto senza richiedere file statici nell'area di lavoro.

## Il motore precedente

Il motore `legacy` integrato mantiene il comportamento originale di OpenClaw:

- **Acquisizione**: nessuna operazione (il gestore delle sessioni gestisce direttamente la persistenza dei messaggi).
- **Assemblaggio**: pass-through (la pipeline esistente di sanificazione → convalida → limitazione nel runtime gestisce l'assemblaggio del contesto).
- **Compattazione**: delega alla Compaction di riepilogo integrata, che crea un singolo riepilogo dei messaggi meno recenti e mantiene intatti quelli recenti.
- **Dopo il turno**: nessuna operazione.

Il motore precedente non registra strumenti né fornisce un `systemPromptAddition`.

Quando non è impostato alcun `plugins.slots.contextEngine` (oppure è impostato su `"legacy"`), questo motore viene utilizzato automaticamente.

## Motori Plugin

Un Plugin può registrare un motore di contesto utilizzando l'API del Plugin:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Archivia il messaggio nel proprio archivio dati
      return { ingested: true };
    },

    async assemble({
      sessionId,
      sessionKey,
      messages,
      tokenBudget,
      availableTools,
      citationsMode,
    }) {
      // Restituisce messaggi che rientrano nel budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Riassume il contesto meno recente
      return { ok: true, compacted: true };
    },
  }));
}
```

La factory `ctx` include valori facoltativi `config`, `agentDir` e `workspaceDir`
per consentire ai Plugin di inizializzare lo stato per agente o per area di lavoro prima
dell'esecuzione del primo hook del ciclo di vita.

Quindi abilitarlo nella configurazione:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### L'interfaccia ContextEngine

Membri obbligatori:

| Membro             | Tipo     | Scopo                                                  |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Proprietà | Id, nome e versione del motore e indicazione se gestisce la Compaction |
| `ingest(params)`   | Metodo   | Archiviare un singolo messaggio                                   |
| `assemble(params)` | Metodo   | Costruire il contesto per un'esecuzione del modello (restituisce `AssembleResult`) |
| `compact(params)`  | Metodo   | Riassumere/ridurre il contesto                                 |

`assemble` restituisce un `AssembleResult` con:

<ParamField path="messages" type="Message[]" required>
  I messaggi ordinati da inviare al modello.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  La stima del motore relativa al numero totale di token nel contesto assemblato. OpenClaw la utilizza per le decisioni sulle soglie di Compaction e per i rapporti diagnostici.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Anteposto al prompt di sistema.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Controlla quale stima dei token viene utilizzata dal runner per i controlli
  preventivi di overflow. Il valore predefinito è `"assembled"`, che indica che, per i motori che non gestiscono la Compaction, viene controllata soltanto la stima
  del prompt assemblato.
  I motori che impostano `ownsCompaction: true` gestiscono autonomamente l'ammissione dei prompt,
  pertanto OpenClaw ignora per impostazione predefinita il controllo generico precedente al prompt. Impostare
  `"preassembly_may_overflow"` soltanto quando la vista assemblata può nascondere un rischio di overflow
  nella trascrizione sottostante; il runner mantiene quindi attivo il controllo generico
  e considera il valore massimo tra la stima assemblata e quella precedente
  all'assemblaggio (senza finestra) della cronologia della sessione quando decide se
  eseguire preventivamente la Compaction. In ogni caso, i messaggi restituiti rimangono quelli
  visualizzati dal modello: `promptAuthority` influisce soltanto sul controllo preliminare.
</ParamField>
<ParamField path="contextProjection" type="ContextEngineProjection">
  Ciclo di vita facoltativo della proiezione per host con thread backend persistenti (ad esempio il server applicativo Codex). `mode: "thread_bootstrap"` con un `epoch` stabile richiede all'host di inserire il contesto assemblato una volta per epoca e riutilizzare il thread backend finché l'epoca non cambia, anziché ripetere la proiezione a ogni turno. Omettere questo campo per la normale proiezione a ogni turno.
</ParamField>

`compact` restituisce un `CompactResult`. Quando la Compaction modifica l'identità della sessione attiva,
`result.sessionTarget` (un `ContextEngineSessionTarget` tipizzato che contiene
l'identità della sessione e l'ambito dell'archivio) identifica la sessione successiva che deve essere utilizzata
dal tentativo o turno successivo; `result.sessionId` rispecchia l'id successivo.

Membri facoltativi:

| Membro                         | Tipo   | Scopo                                                                                                                                      |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Metodo | Inizializzare lo stato del motore per una sessione. Chiamato una volta quando il motore incontra per la prima volta una sessione (ad esempio, durante l'importazione della cronologia).                              |
| `maintain(params)`             | Metodo | Manutenzione della trascrizione dopo il bootstrap, un turno completato correttamente o la Compaction. Utilizzare `runtimeContext.rewriteTranscriptEntries()` per riscritture sicure. |
| `ingestBatch(params)`          | Metodo | Acquisire un turno completato come batch. Chiamato al termine di un'esecuzione, con tutti i messaggi di quel turno contemporaneamente.                                  |
| `afterTurn(params)`            | Metodo | Attività del ciclo di vita successive all'esecuzione (rendere persistente lo stato, attivare la Compaction in background).                                                                      |
| `prepareSubagentSpawn(params)` | Metodo | Configurare lo stato condiviso per una sessione figlia prima del suo avvio.                                                                                    |
| `onSubagentEnded(params)`      | Metodo | Eseguire la pulizia al termine di un subagente.                                                                                                              |
| `dispose()`                    | Metodo | Rilasciare le risorse. Chiamato durante l'arresto del Gateway o il ricaricamento del Plugin, non per ogni sessione.                                                        |

### Impostazioni di runtime

Gli hook del ciclo di vita eseguiti all'interno di OpenClaw ricevono un oggetto facoltativo
`runtimeSettings`. Si tratta di una superficie API interna
produttore/consumatore, di sola lettura e con versione: OpenClaw la produce per il motore di contesto
selezionato e il motore di contesto la utilizza negli hook del ciclo di vita. Non viene
mostrata direttamente agli utenti e non crea una superficie dedicata per i rapporti.

- `schemaVersion`: attualmente `1`
- `runtime`: host OpenClaw, modalità runtime (`normal`, `fallback` o
  `degraded`) e ID facoltativi dell'harness/runtime
- `contextEngineSelection`: ID del motore di contesto selezionato e origine della selezione
- `executionHost`: ID e etichetta dell'host per la superficie che invoca l'hook
- `model`: modello richiesto, modello risolto, provider e famiglia di modelli facoltativa
- `limits`: budget dei token del prompt e numero massimo di token di output, quando noti
- `diagnostics`: codici del fallback chiuso e del motivo del funzionamento degradato, quando noti

I campi che possono essere sconosciuti sono rappresentati come `null`; i campi discriminanti,
come la modalità runtime e l'origine della selezione, rimangono non nullable. I motori meno recenti rimangono
compatibili: se un motore legacy rigoroso rifiuta `runtimeSettings` come proprietà
sconosciuta, OpenClaw ripete la chiamata del ciclo di vita senza di essa invece di mettere
il motore in quarantena.

### Requisiti dell'host

I motori di contesto possono dichiarare requisiti relativi alle capacità dell'host in `info.hostRequirements`.
OpenClaw verifica tali requisiti prima di avviare l'operazione e applica il blocco preventivo
con un errore descrittivo quando il runtime selezionato non è in grado di soddisfarli.

Per le esecuzioni dell'agente, dichiarare `assemble-before-prompt` quando il motore deve controllare
il prompt effettivo del modello tramite `assemble()`:

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Usare il runtime Codex nativo o quello incorporato di OpenClaw, oppure selezionare il motore di contesto legacy.",
    },
  },
}
```

Le esecuzioni degli agenti Codex native e quelle incorporate di OpenClaw soddisfano `assemble-before-prompt`.
I backend CLI generici non lo fanno, pertanto i motori che lo richiedono vengono rifiutati prima
dell'avvio del processo CLI.

### Isolamento degli errori

OpenClaw isola il motore del plugin selezionato dal percorso principale delle risposte. Se un
motore non legacy è assente, non supera la convalida del contratto, genera un'eccezione durante
la creazione della factory o da un metodo del ciclo di vita, OpenClaw mette tale motore
in quarantena per il processo Gateway corrente e trasferisce il lavoro del motore di contesto
al motore `legacy` integrato. L'errore viene registrato insieme all'operazione non riuscita, affinché
l'operatore possa riparare, aggiornare o disabilitare il plugin senza che l'agente smetta
di rispondere.

Gli errori relativi ai requisiti dell'host sono diversi: quando un motore dichiara che a un runtime
manca una capacità richiesta, OpenClaw applica il blocco preventivo prima di avviare l'esecuzione. Ciò
protegge i motori che danneggerebbero lo stato se venissero eseguiti in un host non supportato.

### ownsCompaction

`ownsCompaction` determina se la compattazione automatica integrata nel runtime di OpenClaw durante il tentativo rimane abilitata per l'esecuzione:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Il motore gestisce il comportamento di compattazione. OpenClaw disabilita la compattazione automatica integrata nel runtime di OpenClaw e il controllo preliminare generico dell'overflow prima del prompt per tale esecuzione; l'implementazione `compact()` del motore è responsabile di `/compact`, della compattazione per il recupero dall'overflow del provider e di qualsiasi compattazione proattiva che intenda eseguire in `afterTurn()`. OpenClaw esegue comunque la protezione dall'overflow prima del prompt quando il motore restituisce `promptAuthority: "preassembly_may_overflow"` da `assemble()`.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    La compattazione automatica integrata nel runtime di OpenClaw può ancora essere eseguita durante l'elaborazione del prompt, ma il metodo `compact()` del motore attivo viene comunque chiamato per `/compact` e il recupero dall'overflow.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **non** significa che OpenClaw ricorra automaticamente al percorso di compattazione del motore legacy.
</Warning>

Ciò significa che esistono due modelli di plugin validi:

<Tabs>
  <Tab title="Modalità proprietaria">
    Implementare un algoritmo di compattazione personalizzato e impostare `ownsCompaction: true`.
  </Tab>
  <Tab title="Modalità delegata">
    Impostare `ownsCompaction: false` e fare in modo che `compact()` chiami `delegateCompactionToRuntime(...)` da `openclaw/plugin-sdk/core` per utilizzare il comportamento di compattazione integrato di OpenClaw.
  </Tab>
</Tabs>

Un'implementazione senza operazioni di `compact()` non è sicura per un motore attivo non proprietario, perché disabilita il normale percorso di compattazione `/compact` e di recupero dall'overflow per lo slot di tale motore.

## Riferimento per la configurazione

```json5
{
  plugins: {
    slots: {
      // Seleziona il motore di contesto attivo. Valore predefinito: "legacy".
      // Impostare l'ID di un plugin per utilizzare il relativo motore.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
Lo slot è esclusivo durante l'esecuzione: per una determinata esecuzione o operazione di compattazione viene risolto un solo motore di contesto registrato. Gli altri plugin `kind: "context-engine"` abilitati possono comunque essere caricati ed eseguire il proprio codice di registrazione; `plugins.slots.contextEngine` seleziona soltanto l'ID del motore registrato che OpenClaw risolve quando necessita di un motore di contesto.
</Note>

<Note>
**Disinstallazione del plugin:** quando si disinstalla il plugin attualmente selezionato come `plugins.slots.contextEngine`, OpenClaw reimposta lo slot sul valore predefinito (`legacy`). Lo stesso comportamento di reimpostazione si applica a `plugins.slots.memory`. Non è necessario modificare manualmente la configurazione.
</Note>

## Relazione con la compattazione e la memoria

<AccordionGroup>
  <Accordion title="Compaction">
    La compattazione è una delle responsabilità del motore di contesto. Il motore legacy delega alla riepilogazione integrata di OpenClaw. I motori dei plugin possono implementare qualsiasi strategia di compattazione (riepiloghi DAG, recupero vettoriale e così via).
  </Accordion>
  <Accordion title="Plugin di memoria">
    I plugin di memoria (`plugins.slots.memory`) sono distinti dai motori di contesto. I plugin di memoria forniscono ricerca e recupero; i motori di contesto controllano ciò che vede il modello. Possono operare insieme: un motore di contesto potrebbe utilizzare i dati di un plugin di memoria durante l'assemblaggio. I motori dei plugin che desiderano il percorso attivo del prompt di memoria dovrebbero preferire `buildMemorySystemPromptAddition(...)` da `openclaw/plugin-sdk/core`, che converte le sezioni attive del prompt di memoria in un `systemPromptAddition` pronto da anteporre. Se un motore necessita di un controllo di livello inferiore, può comunque recuperare le righe non elaborate da `openclaw/plugin-sdk/memory-host-core` tramite `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Riduzione della sessione">
    La rimozione in memoria dei risultati meno recenti degli strumenti viene comunque eseguita, indipendentemente dal motore di contesto attivo.
  </Accordion>
</AccordionGroup>

## Suggerimenti

- Usare `openclaw doctor` per verificare che il motore venga caricato correttamente.
- Quando si cambia motore, le sessioni esistenti proseguono con la cronologia corrente. Il nuovo motore subentra nelle esecuzioni future.
- Gli errori del motore vengono registrati e il motore del plugin selezionato viene messo in quarantena per il processo Gateway corrente. OpenClaw ricorre a `legacy` per i turni dell'utente affinché le risposte possano continuare, ma è comunque necessario riparare, aggiornare, disabilitare o disinstallare il plugin non funzionante.
- Per lo sviluppo, usare `openclaw plugins install -l ./my-engine` per collegare una directory locale del plugin senza copiarla.

## Contenuti correlati

- [Compaction](/it/concepts/compaction) - riepilogo delle conversazioni lunghe
- [Contesto](/it/concepts/context) - modalità di creazione del contesto per i turni dell'agente
- [Architettura dei plugin](/it/plugins/architecture) - registrazione dei plugin dei motori di contesto
- [Manifest del plugin](/it/plugins/manifest) - campi del manifest del plugin
- [Plugin](/it/tools/plugin) - panoramica dei plugin
