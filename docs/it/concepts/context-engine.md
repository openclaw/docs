---
read_when:
    - Vuoi capire come OpenClaw assembla il contesto del modello
    - Stai passando dal motore legacy a un motore Plugin
    - Stai creando un plugin per il motore di contesto
sidebarTitle: Context engine
summary: 'Motore di contesto: assemblaggio del contesto modulare, Compaction e ciclo di vita dei subagenti'
title: Motore di contesto
x-i18n:
    generated_at: "2026-05-02T08:20:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7477dd1d48f9633586dce67204912a810e0931d7bc9f2d6719ba465fe19681b
    source_path: concepts/context-engine.md
    workflow: 16
---

Un **motore di contesto** controlla il modo in cui OpenClaw costruisce il contesto del modello per ogni esecuzione: quali messaggi includere, come riassumere la cronologia meno recente e come gestire il contesto oltre i confini dei sottoagenti.

OpenClaw include un motore `legacy` integrato e lo usa per impostazione predefinita — la maggior parte degli utenti non ha mai bisogno di modificarlo. Installa e seleziona un motore Plugin solo quando vuoi un comportamento diverso di assemblaggio, Compaction o richiamo tra sessioni.

## Avvio rapido

<Steps>
  <Step title="Check which engine is active">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Install a plugin engine">
    I Plugin dei motori di contesto si installano come qualsiasi altro Plugin di OpenClaw.

    <Tabs>
      <Tab title="From npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="From a local path">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Enable and select the engine">
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

    Riavvia il gateway dopo l’installazione e la configurazione.

  </Step>
  <Step title="Switch back to legacy (optional)">
    Imposta `contextEngine` su `"legacy"` (oppure rimuovi completamente la chiave — `"legacy"` è il valore predefinito).
  </Step>
</Steps>

## Come funziona

Ogni volta che OpenClaw esegue un prompt del modello, il motore di contesto interviene in quattro punti del ciclo di vita:

<AccordionGroup>
  <Accordion title="1. Ingest">
    Chiamato quando viene aggiunto un nuovo messaggio alla sessione. Il motore può archiviare o indicizzare il messaggio nel proprio archivio dati.
  </Accordion>
  <Accordion title="2. Assemble">
    Chiamato prima di ogni esecuzione del modello. Il motore restituisce un insieme ordinato di messaggi (e un `systemPromptAddition` facoltativo) che rientrano nel budget di token.
  </Accordion>
  <Accordion title="3. Compact">
    Chiamato quando la finestra di contesto è piena, o quando l’utente esegue `/compact`. Il motore riassume la cronologia meno recente per liberare spazio.
  </Accordion>
  <Accordion title="4. After turn">
    Chiamato dopo il completamento di un’esecuzione. Il motore può rendere persistente lo stato, attivare la Compaction in background o aggiornare gli indici.
  </Accordion>
</AccordionGroup>

Per l’harness Codex non ACP incluso, OpenClaw applica lo stesso ciclo di vita proiettando il contesto assemblato nelle istruzioni per sviluppatori di Codex e nel prompt del turno corrente. Codex mantiene comunque la proprietà della sua cronologia thread nativa e del compattatore nativo.

### Ciclo di vita del sottoagente (facoltativo)

OpenClaw chiama due hook facoltativi del ciclo di vita dei sottoagenti:

<ParamField path="prepareSubagentSpawn" type="method">
  Prepara lo stato del contesto condiviso prima dell’avvio di un’esecuzione figlia. L’hook riceve le chiavi di sessione padre/figlio, `contextMode` (`isolated` o `fork`), gli ID/file di trascrizione disponibili e un TTL facoltativo. Se restituisce un handle di rollback, OpenClaw lo chiama quando lo spawn fallisce dopo che la preparazione è riuscita.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Esegue la pulizia quando una sessione di sottoagente viene completata o spazzata via.
</ParamField>

### Aggiunta al prompt di sistema

Il metodo `assemble` può restituire una stringa `systemPromptAddition`. OpenClaw la antepone al prompt di sistema per l’esecuzione. Questo permette ai motori di iniettare indicazioni dinamiche di richiamo, istruzioni di recupero o suggerimenti sensibili al contesto senza richiedere file statici nel workspace.

## Il motore legacy

Il motore `legacy` integrato preserva il comportamento originale di OpenClaw:

- **Ingest**: no-op (il gestore sessioni si occupa direttamente della persistenza dei messaggi).
- **Assemble**: pass-through (la pipeline esistente sanitize → validate → limit nel runtime gestisce l’assemblaggio del contesto).
- **Compact**: delega alla Compaction di riepilogo integrata, che crea un singolo riepilogo dei messaggi meno recenti e mantiene intatti i messaggi recenti.
- **After turn**: no-op.

Il motore legacy non registra strumenti né fornisce un `systemPromptAddition`.

Quando `plugins.slots.contextEngine` non è impostato (o è impostato su `"legacy"`), questo motore viene usato automaticamente.

## Motori Plugin

Un Plugin può registrare un motore di contesto usando l’API del Plugin:

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
così i Plugin possono inizializzare lo stato per agente o per workspace prima che venga eseguito
il primo hook del ciclo di vita.

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

### L’interfaccia ContextEngine

Membri obbligatori:

| Membro             | Tipo     | Scopo                                                    |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Proprietà | ID del motore, nome, versione e se possiede la Compaction |
| `ingest(params)`   | Metodo   | Archiviare un singolo messaggio                          |
| `assemble(params)` | Metodo   | Costruire il contesto per un’esecuzione del modello (restituisce `AssembleResult`) |
| `compact(params)`  | Metodo   | Riassumere/ridurre il contesto                           |

`assemble` restituisce un `AssembleResult` con:

<ParamField path="messages" type="Message[]" required>
  I messaggi ordinati da inviare al modello.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  La stima del motore dei token totali nel contesto assemblato. OpenClaw la usa per le decisioni sulla soglia di Compaction e per i report diagnostici.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Anteposto al prompt di sistema.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Controlla quale stima dei token il runner usa per i precontrolli preventivi
  di overflow. Il valore predefinito è `"assembled"`, cioè viene controllata solo
  la stima del prompt assemblato — appropriato per motori che restituiscono un
  contesto a finestra, autonomo. Impostalo su `"preassembly_may_overflow"` solo
  quando la tua vista assemblata può nascondere il rischio di overflow nella
  trascrizione sottostante; il runner allora prende il massimo tra la stima assemblata
  e la stima della cronologia di sessione pre-assemblaggio (senza finestra) quando decide
  se eseguire preventivamente la Compaction. In ogni caso, i messaggi che restituisci sono
  comunque ciò che vede il modello — `promptAuthority` influisce solo sul precontrollo.
</ParamField>

`compact` restituisce un `CompactResult`. Quando la Compaction ruota la trascrizione
attiva, `result.sessionId` e `result.sessionFile` identificano la sessione successiva
che il prossimo tentativo o turno deve usare.

Membri facoltativi:

| Membro                         | Tipo   | Scopo                                                                                                           |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Metodo | Inizializza lo stato del motore per una sessione. Chiamato una volta quando il motore vede una sessione per la prima volta (ad esempio, cronologia importata). |
| `ingestBatch(params)`          | Metodo | Acquisisce un turno completato come batch. Chiamato dopo il completamento di un’esecuzione, con tutti i messaggi di quel turno in una volta sola. |
| `afterTurn(params)`            | Metodo | Lavoro del ciclo di vita post-esecuzione (persistenza dello stato, attivazione della Compaction in background). |
| `prepareSubagentSpawn(params)` | Metodo | Imposta lo stato condiviso per una sessione figlia prima che inizi.                                             |
| `onSubagentEnded(params)`      | Metodo | Esegue la pulizia dopo la fine di un sottoagente.                                                               |
| `dispose()`                    | Metodo | Rilascia le risorse. Chiamato durante lo spegnimento del gateway o il ricaricamento del Plugin — non per sessione. |

### ownsCompaction

`ownsCompaction` controlla se la Compaction automatica durante il tentativo integrata di Pi resta abilitata per l’esecuzione:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Il motore possiede il comportamento di Compaction. OpenClaw disabilita la Compaction automatica integrata di Pi per quell’esecuzione, e l’implementazione `compact()` del motore è responsabile di `/compact`, della Compaction di recupero da overflow e di qualsiasi Compaction proattiva che voglia eseguire in `afterTurn()`. OpenClaw può comunque eseguire la salvaguardia pre-prompt contro l’overflow; quando prevede che l’intera trascrizione andrà in overflow, il percorso di recupero chiama `compact()` del motore attivo prima di inviare un altro prompt.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    La Compaction automatica integrata di Pi può comunque essere eseguita durante l’esecuzione del prompt, ma il metodo `compact()` del motore attivo viene comunque chiamato per `/compact` e per il recupero da overflow.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **non** significa che OpenClaw ripieghi automaticamente sul percorso di Compaction del motore legacy.
</Warning>

Questo significa che esistono due pattern di Plugin validi:

<Tabs>
  <Tab title="Owning mode">
    Implementa il tuo algoritmo di Compaction e imposta `ownsCompaction: true`.
  </Tab>
  <Tab title="Delegating mode">
    Imposta `ownsCompaction: false` e fai in modo che `compact()` chiami `delegateCompactionToRuntime(...)` da `openclaw/plugin-sdk/core` per usare il comportamento di Compaction integrato di OpenClaw.
  </Tab>
</Tabs>

Un `compact()` no-op non è sicuro per un motore attivo non proprietario perché disabilita il normale percorso di Compaction `/compact` e di recupero da overflow per quello slot del motore.

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
Lo slot è esclusivo in fase di esecuzione — per una data esecuzione o operazione di Compaction viene risolto un solo motore di contesto registrato. Altri Plugin abilitati `kind: "context-engine"` possono comunque caricarsi ed eseguire il proprio codice di registrazione; `plugins.slots.contextEngine` seleziona solo quale ID di motore registrato OpenClaw risolve quando ha bisogno di un motore di contesto.
</Note>

<Note>
**Disinstallazione del Plugin:** quando disinstalli il Plugin attualmente selezionato come `plugins.slots.contextEngine`, OpenClaw reimposta lo slot al valore predefinito (`legacy`). Lo stesso comportamento di reset si applica a `plugins.slots.memory`. Non è necessaria alcuna modifica manuale della configurazione.
</Note>

## Relazione con Compaction e memoria

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction è una responsabilità del motore di contesto. Il motore legacy delega alla sintesi integrata di OpenClaw. I motori Plugin possono implementare qualsiasi strategia di compaction (riepiloghi DAG, recupero vettoriale, ecc.).
  </Accordion>
  <Accordion title="Plugin di memoria">
    I Plugin di memoria (`plugins.slots.memory`) sono separati dai motori di contesto. I Plugin di memoria forniscono ricerca/recupero; i motori di contesto controllano ciò che vede il modello. Possono lavorare insieme: un motore di contesto potrebbe usare i dati del Plugin di memoria durante l'assemblaggio. I motori Plugin che vogliono il percorso del prompt di memoria attiva dovrebbero preferire `buildMemorySystemPromptAddition(...)` da `openclaw/plugin-sdk/core`, che converte le sezioni del prompt di memoria attiva in un `systemPromptAddition` pronto da anteporre. Se un motore ha bisogno di un controllo di livello inferiore, può comunque estrarre righe grezze da `openclaw/plugin-sdk/memory-host-core` tramite `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Potatura della sessione">
    Il taglio dei vecchi risultati degli strumenti in memoria viene comunque eseguito indipendentemente dal motore di contesto attivo.
  </Accordion>
</AccordionGroup>

## Suggerimenti

- Usa `openclaw doctor` per verificare che il tuo motore venga caricato correttamente.
- Se cambi motore, le sessioni esistenti continuano con la loro cronologia corrente. Il nuovo motore subentra per le esecuzioni future.
- Gli errori del motore vengono registrati ed esposti nella diagnostica. Se un motore Plugin non riesce a registrarsi o l'id del motore selezionato non può essere risolto, OpenClaw non ripiega automaticamente; le esecuzioni falliscono finché non correggi il Plugin o non riporti `plugins.slots.contextEngine` a `"legacy"`.
- Per lo sviluppo, usa `openclaw plugins install -l ./my-engine` per collegare una directory Plugin locale senza copiarla.

## Correlati

- [Compaction](/it/concepts/compaction) — sintesi di conversazioni lunghe
- [Contesto](/it/concepts/context) — come viene creato il contesto per i turni dell'agente
- [Architettura dei Plugin](/it/plugins/architecture) — registrazione dei Plugin di motore di contesto
- [Manifest del Plugin](/it/plugins/manifest) — campi del manifest del Plugin
- [Plugin](/it/tools/plugin) — panoramica dei Plugin
