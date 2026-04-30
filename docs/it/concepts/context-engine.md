---
read_when:
    - Vuoi capire come OpenClaw compone il contesto del modello
    - Stai passando dal motore legacy a un motore Plugin
    - Stai creando un Plugin del motore di contesto
sidebarTitle: Context engine
summary: 'Motore del contesto: assemblaggio del contesto modulare, Compaction e ciclo di vita dei sottoagenti'
title: Motore di contesto
x-i18n:
    generated_at: "2026-04-30T08:46:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f192c6b28ad2b5960b504811926fb5e30fe8da9d985d8eec3ad4b65c9f7cae5
    source_path: concepts/context-engine.md
    workflow: 16
---

Un **motore di contesto** controlla il modo in cui OpenClaw costruisce il contesto del modello per ogni esecuzione: quali messaggi includere, come riassumere la cronologia più vecchia e come gestire il contesto oltre i confini dei subagent.

OpenClaw include un motore `legacy` integrato e lo usa per impostazione predefinita — la maggior parte degli utenti non deve mai modificarlo. Installa e seleziona un motore Plugin solo quando desideri un comportamento diverso per assemblaggio, Compaction o richiamo tra sessioni.

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

    Riavvia il Gateway dopo l'installazione e la configurazione.

  </Step>
  <Step title="Torna a legacy (facoltativo)">
    Imposta `contextEngine` su `"legacy"` (oppure rimuovi completamente la chiave — `"legacy"` è il valore predefinito).
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
  <Accordion title="3. Compattazione">
    Chiamato quando la finestra di contesto è piena oppure quando l'utente esegue `/compact`. Il motore riassume la cronologia più vecchia per liberare spazio.
  </Accordion>
  <Accordion title="4. Dopo il turno">
    Chiamato dopo il completamento di un'esecuzione. Il motore può persistere lo stato, attivare la Compaction in background o aggiornare gli indici.
  </Accordion>
</AccordionGroup>

Per l'harness Codex non ACP in bundle, OpenClaw applica lo stesso ciclo di vita proiettando il contesto assemblato nelle istruzioni per sviluppatori di Codex e nel prompt del turno corrente. Codex mantiene comunque la proprietà della propria cronologia nativa del thread e del proprio compattatore nativo.

### Ciclo di vita dei subagent (facoltativo)

OpenClaw chiama due hook facoltativi del ciclo di vita dei subagent:

<ParamField path="prepareSubagentSpawn" type="method">
  Prepara lo stato di contesto condiviso prima dell'avvio di un'esecuzione figlia. L'hook riceve chiavi di sessione padre/figlio, `contextMode` (`isolated` o `fork`), ID/file di trascrizione disponibili e TTL facoltativo. Se restituisce un handle di rollback, OpenClaw lo chiama quando lo spawn non riesce dopo che la preparazione è riuscita.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Esegue la pulizia quando una sessione subagent viene completata o rimossa.
</ParamField>

### Aggiunta al prompt di sistema

Il metodo `assemble` può restituire una stringa `systemPromptAddition`. OpenClaw la antepone al prompt di sistema per l'esecuzione. Questo consente ai motori di iniettare indicazioni dinamiche di richiamo, istruzioni di recupero o suggerimenti sensibili al contesto senza richiedere file statici dell'area di lavoro.

## Il motore legacy

Il motore `legacy` integrato preserva il comportamento originale di OpenClaw:

- **Acquisizione**: no-op (il gestore di sessione gestisce direttamente la persistenza dei messaggi).
- **Assemblaggio**: pass-through (la pipeline esistente sanitize → validate → limit nel runtime gestisce l'assemblaggio del contesto).
- **Compattazione**: delega alla Compaction di riepilogo integrata, che crea un unico riepilogo dei messaggi più vecchi e mantiene intatti i messaggi recenti.
- **Dopo il turno**: no-op.

Il motore legacy non registra strumenti né fornisce un `systemPromptAddition`.

Quando `plugins.slots.contextEngine` non è impostato (o è impostato su `"legacy"`), questo motore viene usato automaticamente.

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

La factory `ctx` include valori facoltativi `config`, `agentDir` e `workspaceDir`
così i Plugin possono inizializzare lo stato per agente o per area di lavoro prima che venga eseguito
il primo hook del ciclo di vita.

Quindi abilitalo nella configurazione:

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

| Membro             | Tipo      | Scopo                                                    |
| ------------------ | --------- | -------------------------------------------------------- |
| `info`             | Proprietà | ID del motore, nome, versione e se possiede la Compaction |
| `ingest(params)`   | Metodo    | Archiviare un singolo messaggio                          |
| `assemble(params)` | Metodo    | Costruire il contesto per un'esecuzione del modello (restituisce `AssembleResult`) |
| `compact(params)`  | Metodo    | Riassumere/ridurre il contesto                           |

`assemble` restituisce un `AssembleResult` con:

<ParamField path="messages" type="Message[]" required>
  I messaggi ordinati da inviare al modello.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  La stima del motore dei token totali nel contesto assemblato. OpenClaw la usa per le decisioni sulle soglie di Compaction e per la reportistica diagnostica.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Anteposto al prompt di sistema.
</ParamField>

`compact` restituisce un `CompactResult`. Quando la Compaction ruota la trascrizione
attiva, `result.sessionId` e `result.sessionFile` identificano la sessione successiva
che il prossimo nuovo tentativo o turno deve usare.

Membri facoltativi:

| Membro                         | Tipo   | Scopo                                                                                                           |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Metodo | Inizializzare lo stato del motore per una sessione. Chiamato una volta quando il motore vede per la prima volta una sessione (ad esempio, importazione della cronologia). |
| `ingestBatch(params)`          | Metodo | Acquisire un turno completato come batch. Chiamato dopo il completamento di un'esecuzione, con tutti i messaggi di quel turno in una sola volta. |
| `afterTurn(params)`            | Metodo | Lavoro del ciclo di vita post-esecuzione (persistenza dello stato, attivazione della Compaction in background). |
| `prepareSubagentSpawn(params)` | Metodo | Configurare lo stato condiviso per una sessione figlia prima che inizi.                                         |
| `onSubagentEnded(params)`      | Metodo | Eseguire la pulizia dopo la fine di un subagent.                                                                |
| `dispose()`                    | Metodo | Rilasciare risorse. Chiamato durante l'arresto del Gateway o il ricaricamento del Plugin — non per sessione.    |

### ownsCompaction

`ownsCompaction` controlla se la compattazione automatica integrata durante il tentativo di Pi resta abilitata per l'esecuzione:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Il motore possiede il comportamento di Compaction. OpenClaw disabilita la compattazione automatica integrata di Pi per quell'esecuzione, e l'implementazione `compact()` del motore è responsabile di `/compact`, della Compaction di ripristino in caso di overflow e di qualsiasi Compaction proattiva che voglia eseguire in `afterTurn()`. OpenClaw può comunque eseguire la protezione preventiva da overflow pre-prompt; quando prevede che l'intera trascrizione andrà in overflow, il percorso di ripristino chiama `compact()` del motore attivo prima di inviare un altro prompt.
  </Accordion>
  <Accordion title="ownsCompaction: false o non impostato">
    La compattazione automatica integrata di Pi può comunque essere eseguita durante l'esecuzione del prompt, ma il metodo `compact()` del motore attivo viene comunque chiamato per `/compact` e il ripristino da overflow.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **non** significa che OpenClaw ripieghi automaticamente sul percorso di Compaction del motore legacy.
</Warning>

Questo significa che esistono due pattern validi per i Plugin:

<Tabs>
  <Tab title="Modalità proprietaria">
    Implementa il tuo algoritmo di Compaction e imposta `ownsCompaction: true`.
  </Tab>
  <Tab title="Modalità delegata">
    Imposta `ownsCompaction: false` e fai in modo che `compact()` chiami `delegateCompactionToRuntime(...)` da `openclaw/plugin-sdk/core` per usare il comportamento di Compaction integrato di OpenClaw.
  </Tab>
</Tabs>

Un `compact()` no-op non è sicuro per un motore attivo non proprietario perché disabilita il normale percorso di Compaction `/compact` e di ripristino da overflow per quello slot del motore.

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
Lo slot è esclusivo in fase di esecuzione — per una determinata esecuzione o operazione di Compaction viene risolto un solo motore di contesto registrato. Altri Plugin `kind: "context-engine"` abilitati possono comunque caricarsi ed eseguire il proprio codice di registrazione; `plugins.slots.contextEngine` seleziona solo l'ID del motore registrato che OpenClaw risolve quando necessita di un motore di contesto.
</Note>

<Note>
**Disinstallazione del Plugin:** quando disinstalli il Plugin attualmente selezionato come `plugins.slots.contextEngine`, OpenClaw reimposta lo slot sul valore predefinito (`legacy`). Lo stesso comportamento di reimpostazione si applica a `plugins.slots.memory`. Non è necessaria alcuna modifica manuale della configurazione.
</Note>

## Relazione con Compaction e memoria

<AccordionGroup>
  <Accordion title="Compaction">
    La Compaction è una responsabilità del motore di contesto. Il motore legacy delega alla summarization integrata di OpenClaw. I motori Plugin possono implementare qualsiasi strategia di compaction (riepiloghi DAG, recupero vettoriale, ecc.).
  </Accordion>
  <Accordion title="Plugin di memoria">
    I Plugin di memoria (`plugins.slots.memory`) sono separati dai motori di contesto. I Plugin di memoria forniscono ricerca/recupero; i motori di contesto controllano ciò che vede il modello. Possono lavorare insieme: un motore di contesto potrebbe usare i dati del Plugin di memoria durante l'assemblaggio. I motori Plugin che vogliono il percorso del prompt di active memory dovrebbero preferire `buildMemorySystemPromptAddition(...)` da `openclaw/plugin-sdk/core`, che converte le sezioni del prompt di active memory in un `systemPromptAddition` pronto da anteporre. Se un motore richiede un controllo di livello inferiore, può comunque estrarre righe grezze da `openclaw/plugin-sdk/memory-host-core` tramite `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Sfoltimento delle sessioni">
    Il trimming in memoria dei vecchi risultati degli strumenti continua comunque a essere eseguito, indipendentemente dal motore di contesto attivo.
  </Accordion>
</AccordionGroup>

## Suggerimenti

- Usa `openclaw doctor` per verificare che il tuo motore venga caricato correttamente.
- Se cambi motore, le sessioni esistenti continuano con la loro cronologia corrente. Il nuovo motore subentra per le esecuzioni future.
- Gli errori del motore vengono registrati nei log e mostrati nella diagnostica. Se un motore Plugin non riesce a registrarsi o l'id del motore selezionato non può essere risolto, OpenClaw non torna automaticamente a un fallback; le esecuzioni falliscono finché non correggi il Plugin o non riporti `plugins.slots.contextEngine` a `"legacy"`.
- Per lo sviluppo, usa `openclaw plugins install -l ./my-engine` per collegare una directory Plugin locale senza copiarla.

## Correlati

- [Compaction](/it/concepts/compaction) — riepilogare conversazioni lunghe
- [Contesto](/it/concepts/context) — come viene costruito il contesto per i turni dell'agente
- [Architettura dei Plugin](/it/plugins/architecture) — registrare Plugin motore di contesto
- [Manifest Plugin](/it/plugins/manifest) — campi del manifest Plugin
- [Plugin](/it/tools/plugin) — panoramica dei Plugin
