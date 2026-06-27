---
read_when:
    - Vuoi capire come OpenClaw assembla il contesto del modello
    - Stai passando dal motore legacy a un motore Plugin
    - Stai creando un plugin del motore di contesto
sidebarTitle: Context engine
summary: 'Motore di contesto: assemblaggio del contesto estensibile, Compaction e ciclo di vita dei sottoagenti'
title: Motore del contesto
x-i18n:
    generated_at: "2026-06-27T17:24:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 124b6daf52f3d58f756352e2e169697541a8b6e67aecaa5a219bed15bda801cd
    source_path: concepts/context-engine.md
    workflow: 16
---

Un **motore di contesto** controlla il modo in cui OpenClaw costruisce il contesto del modello per ogni esecuzione: quali messaggi includere, come riassumere la cronologia più vecchia e come gestire il contesto oltre i confini dei subagent.

OpenClaw include un motore `legacy` integrato e lo usa per impostazione predefinita: la maggior parte degli utenti non deve mai modificarlo. Installa e seleziona un motore Plugin solo quando vuoi un comportamento diverso di assemblaggio, Compaction o richiamo tra sessioni.

## Avvio rapido

<Steps>
  <Step title="Controlla quale motore è attivo">
    ```bash
    openclaw doctor
    # oppure ispeziona direttamente la configurazione:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Installa un motore Plugin">
    I Plugin del motore di contesto si installano come qualsiasi altro Plugin OpenClaw.

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
  <Step title="Abilita e seleziona il motore">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // deve corrispondere all'id del motore registrato dal Plugin
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Qui va la configurazione specifica del Plugin (vedi la documentazione del Plugin)
          },
        },
      },
    }
    ```

    Riavvia il Gateway dopo l'installazione e la configurazione.

  </Step>
  <Step title="Torna a legacy (opzionale)">
    Imposta `contextEngine` su `"legacy"` (oppure rimuovi completamente la chiave: `"legacy"` è il valore predefinito).
  </Step>
</Steps>

## Come funziona

Ogni volta che OpenClaw esegue un prompt del modello, il motore di contesto partecipa in quattro punti del ciclo di vita:

<AccordionGroup>
  <Accordion title="1. Ingestione">
    Chiamato quando un nuovo messaggio viene aggiunto alla sessione. Il motore può archiviare o indicizzare il messaggio nel proprio archivio dati.
  </Accordion>
  <Accordion title="2. Assemblaggio">
    Chiamato prima di ogni esecuzione del modello. Il motore restituisce un insieme ordinato di messaggi (e un `systemPromptAddition` opzionale) che rientrano nel budget di token.
  </Accordion>
  <Accordion title="3. Compattazione">
    Chiamato quando la finestra di contesto è piena o quando l'utente esegue `/compact`. Il motore riassume la cronologia più vecchia per liberare spazio.
  </Accordion>
  <Accordion title="4. Dopo il turno">
    Chiamato dopo il completamento di un'esecuzione. Il motore può persistere lo stato, attivare la Compaction in background o aggiornare gli indici.
  </Accordion>
</AccordionGroup>

Per l'harness Codex non ACP incluso, OpenClaw applica lo stesso ciclo di vita proiettando il contesto assemblato nelle istruzioni per sviluppatori Codex e nel prompt del turno corrente. Codex mantiene comunque la proprietà della propria cronologia di thread nativa e del proprio compattatore nativo.

### Ciclo di vita dei subagent (opzionale)

OpenClaw chiama due hook opzionali del ciclo di vita dei subagent:

<ParamField path="prepareSubagentSpawn" type="method">
  Prepara lo stato del contesto condiviso prima dell'avvio di un'esecuzione figlia. L'hook riceve le chiavi di sessione padre/figlio, `contextMode` (`isolated` o `fork`), gli id/file di trascrizione disponibili e un TTL opzionale. Se restituisce un handle di rollback, OpenClaw lo chiama quando lo spawn fallisce dopo il completamento della preparazione. Gli spawn di subagent nativi che richiedono `lightContext` e si risolvono in `contextMode="isolated"` saltano intenzionalmente questo hook, così il figlio parte dal contesto di bootstrap leggero senza stato pre-spawn gestito dal motore di contesto.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Esegue la pulizia quando una sessione di subagent viene completata o ripulita.
</ParamField>

### Aggiunta al prompt di sistema

Il metodo `assemble` può restituire una stringa `systemPromptAddition`. OpenClaw la antepone al prompt di sistema per l'esecuzione. Questo consente ai motori di iniettare indicazioni dinamiche di richiamo, istruzioni di recupero o suggerimenti sensibili al contesto senza richiedere file statici nell'area di lavoro.

## Il motore legacy

Il motore `legacy` integrato preserva il comportamento originale di OpenClaw:

- **Ingestione**: no-op (il gestore di sessione gestisce direttamente la persistenza dei messaggi).
- **Assemblaggio**: pass-through (la pipeline esistente sanitize → validate → limit nel runtime gestisce l'assemblaggio del contesto).
- **Compattazione**: delega alla Compaction di riepilogo integrata, che crea un unico riepilogo dei messaggi più vecchi e mantiene intatti i messaggi recenti.
- **Dopo il turno**: no-op.

Il motore legacy non registra strumenti né fornisce un `systemPromptAddition`.

Quando non è impostato alcun `plugins.slots.contextEngine` (o è impostato su `"legacy"`), questo motore viene usato automaticamente.

## Motori Plugin

Un Plugin può registrare un motore di contesto usando l'API del Plugin:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Return messages that fit the budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

La factory `ctx` include i valori opzionali `config`, `agentDir` e `workspaceDir`
così i Plugin possono inizializzare lo stato per agente o per area di lavoro prima
che venga eseguito il primo hook del ciclo di vita.

Poi abilitalo nella configurazione:

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

| Membro             | Tipo     | Scopo                                                            |
| ------------------ | -------- | ---------------------------------------------------------------- |
| `info`             | Proprietà | Id, nome, versione del motore e se possiede la Compaction        |
| `ingest(params)`   | Metodo   | Archiviare un singolo messaggio                                  |
| `assemble(params)` | Metodo   | Costruire il contesto per un'esecuzione del modello (restituisce `AssembleResult`) |
| `compact(params)`  | Metodo   | Riassumere/ridurre il contesto                                   |

`assemble` restituisce un `AssembleResult` con:

<ParamField path="messages" type="Message[]" required>
  I messaggi ordinati da inviare al modello.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  La stima del motore del totale dei token nel contesto assemblato. OpenClaw la usa per le decisioni sulla soglia di Compaction e per i report diagnostici.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Anteposto al prompt di sistema.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Controlla quale stima dei token usa il runner per i controlli preventivi
  di overflow. Il valore predefinito è `"assembled"`, il che significa che
  viene controllata solo la stima del prompt assemblato: appropriato per motori
  che restituiscono un contesto a finestra, autonomo. Impostalo su
  `"preassembly_may_overflow"` solo quando la vista assemblata può nascondere
  un rischio di overflow nella trascrizione sottostante; il runner prende quindi
  il massimo tra la stima assemblata e la stima della cronologia di sessione
  pre-assemblaggio (senza finestra) quando decide se compattare preventivamente.
  In entrambi i casi, i messaggi che restituisci sono comunque ciò che vede il
  modello: `promptAuthority` influisce solo sul controllo preventivo.
</ParamField>

`compact` restituisce un `CompactResult`. Quando la Compaction ruota la
trascrizione attiva, `result.sessionId` e `result.sessionFile` identificano la
sessione successiva che il prossimo nuovo tentativo o turno deve usare.

Membri opzionali:

| Membro                         | Tipo   | Scopo                                                                                                           |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Metodo | Inizializzare lo stato del motore per una sessione. Chiamato una volta quando il motore vede una sessione per la prima volta (ad esempio, importa la cronologia). |
| `ingestBatch(params)`          | Metodo | Ingerire un turno completato come batch. Chiamato dopo il completamento di un'esecuzione, con tutti i messaggi di quel turno in una volta. |
| `afterTurn(params)`            | Metodo | Lavoro del ciclo di vita post-esecuzione (persistenza dello stato, attivazione della Compaction in background). |
| `prepareSubagentSpawn(params)` | Metodo | Configurare lo stato condiviso per una sessione figlia prima che inizi.                                        |
| `onSubagentEnded(params)`      | Metodo | Eseguire la pulizia dopo la fine di un subagent.                                                                |
| `dispose()`                    | Metodo | Rilasciare le risorse. Chiamato durante l'arresto del Gateway o il ricaricamento del Plugin, non per sessione. |

### Impostazioni runtime

Gli hook del ciclo di vita eseguiti dentro OpenClaw ricevono un oggetto
`runtimeSettings` opzionale. È una superficie API interna produttore/consumatore
versionata e di sola lettura: OpenClaw la produce per il motore di contesto
selezionato, e il motore di contesto la consuma dentro gli hook del ciclo di vita.
Non viene resa direttamente agli utenti e non crea una superficie di report
dedicata.

- `schemaVersion`: attualmente `1`
- `runtime`: host OpenClaw, modalità runtime (`normal`, `fallback` o
  `degraded`) e id opzionali di harness/runtime
- `contextEngineSelection`: id del motore di contesto selezionato e origine della selezione
- `executionHost`: id e label dell'host per la superficie che invoca l'hook
- `model`: modello richiesto, modello risolto, provider e famiglia del modello opzionale
- `limits`: budget di token del prompt e numero massimo di token di output quando noti
- `diagnostics`: codici motivo chiusi di fallback e degradazione quando noti

I campi che possono essere sconosciuti sono rappresentati come `null`; i campi
discriminatore come la modalità runtime e l'origine della selezione restano non
nullable. I motori più vecchi restano compatibili: se un motore legacy rigoroso
rifiuta `runtimeSettings` come proprietà sconosciuta, OpenClaw riprova la
chiamata del ciclo di vita senza di essa invece di mettere in quarantena il
motore.

### Requisiti dell'host

I motori di contesto possono dichiarare requisiti di capacità dell'host in `info.hostRequirements`.
OpenClaw controlla questi requisiti prima di avviare l'operazione e fallisce in modo chiuso
con un errore descrittivo quando il runtime selezionato non può soddisfarli.

Per le esecuzioni degli agenti, dichiara `assemble-before-prompt` quando il motore deve controllare
il prompt effettivo del modello tramite `assemble()`:

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Use the native Codex or OpenClaw embedded runtime, or select the legacy context engine.",
    },
  },
}
```

Le esecuzioni di agenti native Codex e OpenClaw embedded soddisfano `assemble-before-prompt`.
I backend CLI generici no, quindi i motori che lo richiedono vengono rifiutati prima
dell'avvio del processo CLI.

### Isolamento degli errori

OpenClaw isola il motore Plugin selezionato dal percorso principale di risposta. Se un
motore non legacy manca, non supera la convalida del contratto, genera un'eccezione durante
la creazione della factory o genera un'eccezione da un metodo del ciclo di vita, OpenClaw mette in quarantena quel motore
per il processo Gateway corrente e degrada il lavoro del motore di contesto al
motore `legacy` integrato. L'errore viene registrato con l'operazione fallita così
l'operatore può riparare, aggiornare o disabilitare il Plugin senza che l'agente
resti silenzioso.

I malfunzionamenti dei requisiti dell'host sono diversi: quando un motore dichiara che a un runtime
manca una capability richiesta, OpenClaw fallisce in modo chiuso prima di avviare l'esecuzione. Questo
protegge i motori che corromperebbero lo stato se venissero eseguiti in un host non supportato.

### ownsCompaction

`ownsCompaction` controlla se l'auto-compattazione integrata nel runtime di OpenClaw durante il tentativo rimane abilitata per l'esecuzione:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Il motore possiede il comportamento di compattazione. OpenClaw disabilita l'auto-compattazione integrata nel runtime di OpenClaw per quell'esecuzione, e l'implementazione `compact()` del motore è responsabile di `/compact`, della compattazione di recupero da overflow e di qualsiasi compattazione proattiva voglia eseguire in `afterTurn()`. OpenClaw può comunque eseguire la protezione da overflow prima del prompt; quando prevede che la trascrizione completa andrà in overflow, il percorso di recupero chiama `compact()` del motore attivo prima di inviare un altro prompt.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    L'auto-compattazione integrata nel runtime di OpenClaw può comunque essere eseguita durante l'esecuzione del prompt, ma il metodo `compact()` del motore attivo viene comunque chiamato per `/compact` e per il recupero da overflow.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **non** significa che OpenClaw ripieghi automaticamente sul percorso di compattazione del motore precedente.
</Warning>

Questo significa che esistono due modelli di Plugin validi:

<Tabs>
  <Tab title="Owning mode">
    Implementa il tuo algoritmo di compattazione e imposta `ownsCompaction: true`.
  </Tab>
  <Tab title="Delegating mode">
    Imposta `ownsCompaction: false` e fai in modo che `compact()` chiami `delegateCompactionToRuntime(...)` da `openclaw/plugin-sdk/core` per usare il comportamento di compattazione integrato di OpenClaw.
  </Tab>
</Tabs>

Un `compact()` no-op non è sicuro per un motore attivo non proprietario perché disabilita il normale percorso di compattazione `/compact` e di recupero da overflow per quello slot motore.

## Riferimento di configurazione

```json5
{
  plugins: {
    slots: {
      // Select the active context engine. Default: "legacy".
      // Set to a plugin id to use a plugin engine.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
Lo slot è esclusivo in fase di esecuzione: per una determinata esecuzione o operazione di compattazione viene risolto un solo motore di contesto registrato. Altri Plugin `kind: "context-engine"` abilitati possono comunque essere caricati ed eseguire il loro codice di registrazione; `plugins.slots.contextEngine` seleziona solo quale id motore registrato OpenClaw risolve quando ha bisogno di un motore di contesto.
</Note>

<Note>
**Disinstallazione del Plugin:** quando disinstalli il Plugin attualmente selezionato come `plugins.slots.contextEngine`, OpenClaw reimposta lo slot sul valore predefinito (`legacy`). Lo stesso comportamento di reset si applica a `plugins.slots.memory`. Non è necessaria alcuna modifica manuale della configurazione.
</Note>

## Relazione con compattazione e memoria

<AccordionGroup>
  <Accordion title="Compaction">
    La Compaction è una responsabilità del motore di contesto. Il motore precedente delega alla riepilogazione integrata di OpenClaw. I motori Plugin possono implementare qualsiasi strategia di compattazione (riepiloghi DAG, recupero vettoriale, ecc.).
  </Accordion>
  <Accordion title="Memory plugins">
    I Plugin di memoria (`plugins.slots.memory`) sono separati dai motori di contesto. I Plugin di memoria forniscono ricerca/recupero; i motori di contesto controllano ciò che il modello vede. Possono lavorare insieme: un motore di contesto potrebbe usare i dati del Plugin di memoria durante l'assemblaggio. I motori Plugin che vogliono il percorso del prompt della memoria attiva dovrebbero preferire `buildMemorySystemPromptAddition(...)` da `openclaw/plugin-sdk/core`, che converte le sezioni del prompt della memoria attiva in un `systemPromptAddition` pronto da anteporre. Se un motore ha bisogno di un controllo di livello inferiore, può comunque estrarre righe grezze da `openclaw/plugin-sdk/memory-host-core` tramite `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Session pruning">
    Il taglio dei vecchi risultati degli strumenti in memoria viene comunque eseguito indipendentemente da quale motore di contesto sia attivo.
  </Accordion>
</AccordionGroup>

## Suggerimenti

- Usa `openclaw doctor` per verificare che il tuo motore venga caricato correttamente.
- Se cambi motore, le sessioni esistenti continuano con la loro cronologia attuale. Il nuovo motore subentra per le esecuzioni future.
- Gli errori del motore vengono registrati e il motore Plugin selezionato viene messo in quarantena per il processo Gateway corrente. OpenClaw ripiega su `legacy` per i turni utente, così le risposte possono continuare, ma dovresti comunque riparare, aggiornare, disabilitare o disinstallare il Plugin difettoso.
- Per lo sviluppo, usa `openclaw plugins install -l ./my-engine` per collegare una directory Plugin locale senza copiarla.

## Correlati

- [Compaction](/it/concepts/compaction) - riepilogo di conversazioni lunghe
- [Contesto](/it/concepts/context) - come viene costruito il contesto per i turni dell'agente
- [Architettura dei Plugin](/it/plugins/architecture) - registrazione dei Plugin motore di contesto
- [Manifest del Plugin](/it/plugins/manifest) - campi del manifest del Plugin
- [Plugin](/it/tools/plugin) - panoramica dei Plugin
