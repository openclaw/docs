---
read_when:
    - Vuoi capire come OpenClaw assembla il contesto del modello
    - Stai passando dal motore legacy a un motore Plugin
    - Stai creando un Plugin per il motore di contesto
sidebarTitle: Context engine
summary: 'Motore di contesto: assemblaggio del contesto collegabile, Compaction e ciclo di vita dei subagent'
title: Motore di contesto
x-i18n:
    generated_at: "2026-06-30T14:08:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0ed65cbb72b14b1a6e8d4d9a394f730a48ada35d77e34c12b3356162b281eec
    source_path: concepts/context-engine.md
    workflow: 16
---

Un **motore di contesto** controlla come OpenClaw costruisce il contesto del modello per ogni esecuzione: quali messaggi includere, come riassumere la cronologia meno recente e come gestire il contesto attraverso i confini dei subagent.

OpenClaw include un motore `legacy` integrato e lo usa per impostazione predefinita: la maggior parte degli utenti non deve mai modificarlo. Installa e seleziona un motore Plugin solo quando desideri un comportamento diverso per assemblaggio, Compaction o richiamo tra sessioni.

## Avvio rapido

<Steps>
  <Step title="Controlla quale motore è attivo">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Installa un motore Plugin">
    I Plugin dei motori di contesto si installano come qualsiasi altro Plugin di OpenClaw.

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
          contextEngine: "lossless-claw", // must match the plugin's registered engine id
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Plugin-specific config goes here (see the plugin's docs)
          },
        },
      },
    }
    ```

    Riavvia il gateway dopo l'installazione e la configurazione.

  </Step>
  <Step title="Torna a legacy (facoltativo)">
    Imposta `contextEngine` su `"legacy"` (oppure rimuovi del tutto la chiave: `"legacy"` è il valore predefinito).
  </Step>
</Steps>

## Come funziona

Ogni volta che OpenClaw esegue un prompt del modello, il motore di contesto partecipa in quattro punti del ciclo di vita:

<AccordionGroup>
  <Accordion title="1. Acquisizione">
    Chiamato quando un nuovo messaggio viene aggiunto alla sessione. Il motore può archiviare o indicizzare il messaggio nel proprio archivio dati.
  </Accordion>
  <Accordion title="2. Assemblaggio">
    Chiamato prima di ogni esecuzione del modello. Il motore restituisce un insieme ordinato di messaggi (e un `systemPromptAddition` facoltativo) che rientrano nel budget di token.
  </Accordion>
  <Accordion title="3. Compact">
    Chiamato quando la finestra di contesto è piena o quando l'utente esegue `/compact`. Il motore riassume la cronologia meno recente per liberare spazio.
  </Accordion>
  <Accordion title="4. Dopo il turno">
    Chiamato al completamento di un'esecuzione. Il motore può persistere lo stato, attivare la Compaction in background o aggiornare gli indici.
  </Accordion>
</AccordionGroup>

Per l'harness Codex non ACP in bundle, OpenClaw applica lo stesso ciclo di vita proiettando il contesto assemblato nelle istruzioni per sviluppatori di Codex e nel prompt del turno corrente. Codex mantiene comunque la proprietà della propria cronologia nativa dei thread e del compattatore nativo.

### Ciclo di vita dei subagent (facoltativo)

OpenClaw chiama due hook facoltativi del ciclo di vita dei subagent:

<ParamField path="prepareSubagentSpawn" type="method">
  Prepara lo stato di contesto condiviso prima dell'avvio di un'esecuzione figlia. L'hook riceve le chiavi di sessione padre/figlio, `contextMode` (`isolated` o `fork`), gli id/file di trascrizione disponibili e un TTL facoltativo. Se restituisce un handle di rollback, OpenClaw lo chiama quando lo spawn non riesce dopo che la preparazione è riuscita. Gli spawn di subagent nativi che richiedono `lightContext` e si risolvono in `contextMode="isolated"` saltano intenzionalmente questo hook, in modo che il figlio parta dal contesto bootstrap leggero senza stato pre-spawn gestito dal motore di contesto.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Esegue la pulizia quando una sessione di subagent viene completata o eliminata.
</ParamField>

### Aggiunta al prompt di sistema

Il metodo `assemble` può restituire una stringa `systemPromptAddition`. OpenClaw la antepone al prompt di sistema dell'esecuzione. Questo permette ai motori di iniettare indicazioni dinamiche di richiamo, istruzioni di recupero o suggerimenti consapevoli del contesto senza richiedere file statici dell'area di lavoro.

## Il motore legacy

Il motore `legacy` integrato preserva il comportamento originale di OpenClaw:

- **Acquisizione**: nessuna operazione (il gestore di sessione gestisce direttamente la persistenza dei messaggi).
- **Assemblaggio**: pass-through (la pipeline esistente sanitize → validate → limit nel runtime gestisce l'assemblaggio del contesto).
- **Compact**: delega alla Compaction di riepilogo integrata, che crea un unico riepilogo dei messaggi meno recenti e mantiene intatti i messaggi recenti.
- **Dopo il turno**: nessuna operazione.

Il motore legacy non registra strumenti né fornisce un `systemPromptAddition`.

Quando `plugins.slots.contextEngine` non è impostato (oppure è impostato su `"legacy"`), questo motore viene usato automaticamente.

## Motori Plugin

Un Plugin può registrare un motore di contesto usando l'API Plugin:

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

La factory `ctx` include valori facoltativi `config`, `agentDir` e `workspaceDir`
così i Plugin possono inizializzare lo stato per agente o per area di lavoro prima
dell'esecuzione del primo hook del ciclo di vita.

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

| Membro             | Tipo     | Scopo                                                    |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Proprietà | Id del motore, nome, versione e se possiede Compaction |
| `ingest(params)`   | Metodo   | Archivia un singolo messaggio                            |
| `assemble(params)` | Metodo   | Costruisce il contesto per un'esecuzione del modello (restituisce `AssembleResult`) |
| `compact(params)`  | Metodo   | Riassume/riduce il contesto                              |

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
  Controlla quale stima dei token usa il runner per i precontrolli preventivi di overflow. Il valore predefinito è `"assembled"`, il che significa che per i motori che non possiedono Compaction viene controllata solo la stima del prompt assemblato. I motori che impostano `ownsCompaction: true` gestiscono autonomamente l'ammissione del proprio prompt, quindi OpenClaw salta per impostazione predefinita il precontrollo generico pre-prompt. Imposta `"preassembly_may_overflow"` solo quando la vista assemblata può nascondere il rischio di overflow nella trascrizione sottostante; il runner mantiene quindi attivo il precontrollo generico e prende il massimo tra la stima assemblata e la stima della cronologia della sessione pre-assemblaggio (senza finestra) quando decide se eseguire preventivamente la Compaction. In ogni caso, i messaggi restituiti sono comunque quelli che il modello vede: `promptAuthority` influisce solo sul precontrollo.
</ParamField>

`compact` restituisce un `CompactResult`. Quando la Compaction ruota la trascrizione attiva, `result.sessionId` e `result.sessionFile` identificano la sessione successiva che il prossimo tentativo o turno deve usare.

Membri facoltativi:

| Membro                         | Tipo   | Scopo                                                                                                           |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Metodo | Inizializza lo stato del motore per una sessione. Chiamato una volta quando il motore vede per la prima volta una sessione (ad esempio, importazione della cronologia). |
| `ingestBatch(params)`          | Metodo | Acquisisce un turno completato come batch. Chiamato al completamento di un'esecuzione, con tutti i messaggi di quel turno in una sola volta. |
| `afterTurn(params)`            | Metodo | Lavoro del ciclo di vita post-esecuzione (persistere lo stato, attivare la Compaction in background). |
| `prepareSubagentSpawn(params)` | Metodo | Configura lo stato condiviso per una sessione figlia prima che inizi. |
| `onSubagentEnded(params)`      | Metodo | Esegue la pulizia dopo la fine di un subagent. |
| `dispose()`                    | Metodo | Rilascia le risorse. Chiamato durante l'arresto del Gateway o il ricaricamento del Plugin, non per sessione. |

### Impostazioni di runtime

Gli hook del ciclo di vita eseguiti all'interno di OpenClaw ricevono un oggetto
`runtimeSettings` facoltativo. È una superficie API interna produttore/consumatore,
versionata e di sola lettura: OpenClaw la produce per il motore di contesto
selezionato e il motore di contesto la consuma all'interno degli hook del ciclo
di vita. Non viene resa direttamente agli utenti e non crea una superficie di
reporting dedicata.

- `schemaVersion`: attualmente `1`
- `runtime`: host OpenClaw, modalità runtime (`normal`, `fallback` o
  `degraded`) e id harness/runtime facoltativi
- `contextEngineSelection`: id del motore di contesto selezionato e origine della selezione
- `executionHost`: id host ed etichetta per la superficie che invoca l'hook
- `model`: modello richiesto, modello risolto, provider e famiglia di modelli facoltativa
- `limits`: budget di token del prompt e token massimi di output quando noti
- `diagnostics`: codici chiusi di fallback e motivo degraded quando noti

I campi che possono essere sconosciuti sono rappresentati come `null`; i campi
discriminatore come la modalità runtime e l'origine della selezione restano non
nullable. I motori più vecchi rimangono compatibili: se un motore legacy rigoroso
rifiuta `runtimeSettings` come proprietà sconosciuta, OpenClaw riprova la chiamata
del ciclo di vita senza di essa invece di mettere il motore in quarantena.

### Requisiti dell'host

I motori di contesto possono dichiarare requisiti di capacità dell'host su `info.hostRequirements`.
OpenClaw verifica questi requisiti prima di avviare l'operazione e fallisce in modo chiuso
con un errore descrittivo quando il runtime selezionato non può soddisfarli.

Per le esecuzioni degli agenti, dichiara `assemble-before-prompt` quando il motore deve controllare il
prompt effettivo del modello tramite `assemble()`:

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

Le esecuzioni agente native di Codex e OpenClaw embedded soddisfano `assemble-before-prompt`.
I backend CLI generici no, quindi i motori che lo richiedono vengono rifiutati prima dell'avvio
del processo CLI.

### Isolamento degli errori

OpenClaw isola il motore Plugin selezionato dal percorso di risposta principale. Se un
motore non legacy manca, non supera la convalida del contratto, genera un'eccezione durante la creazione
della factory o genera un'eccezione da un metodo del ciclo di vita, OpenClaw mette in quarantena quel motore
per il processo Gateway corrente e degrada il lavoro del motore di contesto al
motore `legacy` integrato. L'errore viene registrato con l'operazione non riuscita, così
l'operatore può riparare, aggiornare o disabilitare il Plugin senza che l'agente resti
silenzioso.

Gli errori dei requisiti dell'host sono diversi: quando un motore dichiara che un runtime
non dispone di una capacità richiesta, OpenClaw si arresta in modo fail-closed prima di avviare l'esecuzione. Questo
protegge i motori che corromperebbero lo stato se venissero eseguiti in un host non supportato.

### ownsCompaction

`ownsCompaction` controlla se l'auto-compaction integrata nel runtime OpenClaw durante il tentativo resta abilitata per l'esecuzione:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Il motore possiede il comportamento di compaction. OpenClaw disabilita l'auto-compaction integrata nel runtime OpenClaw e il precontrollo generico di overflow pre-prompt per quell'esecuzione, e l'implementazione `compact()` del motore è responsabile di `/compact`, della compaction di recupero dall'overflow del provider e di qualsiasi compaction proattiva che voglia eseguire in `afterTurn()`. OpenClaw esegue comunque la salvaguardia di overflow pre-prompt quando il motore restituisce `promptAuthority: "preassembly_may_overflow"` da `assemble()`.
  </Accordion>
  <Accordion title="ownsCompaction: false o non impostato">
    L'auto-compaction integrata nel runtime OpenClaw può comunque essere eseguita durante l'esecuzione del prompt, ma il metodo `compact()` del motore attivo viene comunque chiamato per `/compact` e per il recupero dall'overflow.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **non** significa che OpenClaw ripiega automaticamente sul percorso di compaction del motore legacy.
</Warning>

Questo significa che esistono due pattern Plugin validi:

<Tabs>
  <Tab title="Modalità proprietaria">
    Implementa il tuo algoritmo di compaction e imposta `ownsCompaction: true`.
  </Tab>
  <Tab title="Modalità delegata">
    Imposta `ownsCompaction: false` e fai in modo che `compact()` chiami `delegateCompactionToRuntime(...)` da `openclaw/plugin-sdk/core` per usare il comportamento di compaction integrato di OpenClaw.
  </Tab>
</Tabs>

Un `compact()` no-op non è sicuro per un motore attivo che non possiede la compaction, perché disabilita il normale percorso di compaction `/compact` e di recupero dall'overflow per quello slot del motore.

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
Lo slot è esclusivo in fase di esecuzione: viene risolto un solo motore di contesto registrato per una determinata esecuzione o operazione di compaction. Altri Plugin `kind: "context-engine"` abilitati possono comunque caricarsi ed eseguire il proprio codice di registrazione; `plugins.slots.contextEngine` seleziona solo quale id motore registrato OpenClaw risolve quando ha bisogno di un motore di contesto.
</Note>

<Note>
**Disinstallazione del Plugin:** quando disinstalli il Plugin attualmente selezionato come `plugins.slots.contextEngine`, OpenClaw reimposta lo slot sul valore predefinito (`legacy`). Lo stesso comportamento di reimpostazione si applica a `plugins.slots.memory`. Non è richiesta alcuna modifica manuale della configurazione.
</Note>

## Relazione con compaction e memoria

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction è una responsabilità del motore di contesto. Il motore legacy delega alla summarization integrata di OpenClaw. I motori Plugin possono implementare qualsiasi strategia di compaction (riepiloghi DAG, recupero vettoriale, ecc.).
  </Accordion>
  <Accordion title="Plugin di memoria">
    I Plugin di memoria (`plugins.slots.memory`) sono separati dai motori di contesto. I Plugin di memoria forniscono ricerca/recupero; i motori di contesto controllano ciò che vede il modello. Possono lavorare insieme: un motore di contesto potrebbe usare dati del Plugin di memoria durante l'assemblaggio. I motori Plugin che vogliono il percorso attivo del prompt di memoria dovrebbero preferire `buildMemorySystemPromptAddition(...)` da `openclaw/plugin-sdk/core`, che converte le sezioni attive del prompt di memoria in un `systemPromptAddition` pronto da anteporre. Se un motore necessita di controllo a livello più basso, può comunque estrarre righe grezze da `openclaw/plugin-sdk/memory-host-core` tramite `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Potatura della sessione">
    Il trimming in memoria dei vecchi risultati degli strumenti viene comunque eseguito indipendentemente dal motore di contesto attivo.
  </Accordion>
</AccordionGroup>

## Suggerimenti

- Usa `openclaw doctor` per verificare che il tuo motore venga caricato correttamente.
- Se cambi motore, le sessioni esistenti continuano con la loro cronologia corrente. Il nuovo motore prende il controllo per le esecuzioni future.
- Gli errori del motore vengono registrati e il motore Plugin selezionato viene messo in quarantena per il processo Gateway corrente. OpenClaw ripiega su `legacy` per i turni utente così le risposte possono continuare, ma dovresti comunque riparare, aggiornare, disabilitare o disinstallare il Plugin rotto.
- Per lo sviluppo, usa `openclaw plugins install -l ./my-engine` per collegare una directory Plugin locale senza copiarla.

## Correlati

- [Compaction](/it/concepts/compaction) - riepilogo delle conversazioni lunghe
- [Contesto](/it/concepts/context) - come viene costruito il contesto per i turni dell'agente
- [Architettura dei Plugin](/it/plugins/architecture) - registrazione dei Plugin motore di contesto
- [Manifest Plugin](/it/plugins/manifest) - campi del manifest Plugin
- [Plugin](/it/tools/plugin) - panoramica dei Plugin
