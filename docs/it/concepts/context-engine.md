---
read_when:
    - Vuoi capire come OpenClaw assembla il contesto del modello
    - Stai passando dal motore legacy a un motore plugin
    - Stai creando un plugin per il motore di contesto
summary: 'Motore di contesto: assemblaggio del contesto collegabile, compattazione e ciclo di vita dei subagenti'
title: Motore di contesto
x-i18n:
    generated_at: "2026-04-07T08:12:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: e8290ac73272eee275bce8e481ac7959b65386752caa68044d0c6f3e450acfb1
    source_path: concepts/context-engine.md
    workflow: 15
---

# Motore di contesto

Un **motore di contesto** controlla come OpenClaw costruisce il contesto del modello per ogni esecuzione.
Decide quali messaggi includere, come riassumere la cronologia meno recente e come
gestire il contesto oltre i confini dei subagenti.

OpenClaw include un motore `legacy` integrato. I plugin possono registrare
motori alternativi che sostituiscono il ciclo di vita attivo del motore di contesto.

## Guida rapida

Controlla quale motore è attivo:

```bash
openclaw doctor
# or inspect config directly:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### Installazione di un plugin del motore di contesto

I plugin del motore di contesto si installano come qualsiasi altro plugin di OpenClaw. Installa
prima il plugin, poi seleziona il motore nello slot:

```bash
# Install from npm
openclaw plugins install @martian-engineering/lossless-claw

# Or install from a local path (for development)
openclaw plugins install -l ./my-context-engine
```

Poi abilita il plugin e selezionalo come motore attivo nella tua configurazione:

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

Per tornare al motore integrato, imposta `contextEngine` su `"legacy"` (oppure
rimuovi completamente la chiave: `"legacy"` è il valore predefinito).

## Come funziona

Ogni volta che OpenClaw esegue un prompt del modello, il motore di contesto interviene in
quattro punti del ciclo di vita:

1. **Ingest** — chiamato quando un nuovo messaggio viene aggiunto alla sessione. Il motore
   può archiviare o indicizzare il messaggio nel proprio archivio dati.
2. **Assemble** — chiamato prima di ogni esecuzione del modello. Il motore restituisce un insieme
   ordinato di messaggi (e un eventuale `systemPromptAddition`) che rientrano
   nel budget di token.
3. **Compact** — chiamato quando la finestra di contesto è piena, o quando l'utente esegue
   `/compact`. Il motore riassume la cronologia meno recente per liberare spazio.
4. **After turn** — chiamato dopo il completamento di un'esecuzione. Il motore può persistere lo stato,
   attivare la compattazione in background o aggiornare gli indici.

### Ciclo di vita dei subagenti (facoltativo)

OpenClaw al momento chiama un solo hook del ciclo di vita dei subagenti:

- **onSubagentEnded** — pulizia quando una sessione di subagente viene completata o rimossa.

L'hook `prepareSubagentSpawn` fa parte dell'interfaccia per uso futuro, ma
il runtime non lo invoca ancora.

### Aggiunta al prompt di sistema

Il metodo `assemble` può restituire una stringa `systemPromptAddition`. OpenClaw
la antepone al prompt di sistema per l'esecuzione. Questo consente ai motori di inserire
indicazioni dinamiche di richiamo, istruzioni di recupero o suggerimenti sensibili al contesto
senza richiedere file statici dello spazio di lavoro.

## Il motore legacy

Il motore `legacy` integrato preserva il comportamento originale di OpenClaw:

- **Ingest**: no-op (il gestore della sessione si occupa direttamente della persistenza dei messaggi).
- **Assemble**: pass-through (la pipeline esistente sanitize → validate → limit
  nel runtime gestisce l'assemblaggio del contesto).
- **Compact**: delega alla compattazione di riepilogo integrata, che crea
  un singolo riepilogo dei messaggi meno recenti e mantiene intatti quelli recenti.
- **After turn**: no-op.

Il motore legacy non registra strumenti e non fornisce `systemPromptAddition`.

Quando `plugins.slots.contextEngine` non è impostato (oppure è impostato su `"legacy"`), questo
motore viene usato automaticamente.

## Motori plugin

Un plugin può registrare un motore di contesto usando l'API dei plugin:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
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

| Member             | Kind     | Purpose                                                  |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Property | ID del motore, nome, versione e se possiede la compattazione |
| `ingest(params)`   | Method   | Archivia un singolo messaggio                                   |
| `assemble(params)` | Method   | Costruisce il contesto per un'esecuzione del modello (restituisce `AssembleResult`) |
| `compact(params)`  | Method   | Riassume/riduce il contesto                                 |

`assemble` restituisce un `AssembleResult` con:

- `messages` — i messaggi ordinati da inviare al modello.
- `estimatedTokens` (obbligatorio, `number`) — la stima del motore del totale
  dei token nel contesto assemblato. OpenClaw usa questo valore per le decisioni
  sulla soglia di compattazione e per la reportistica diagnostica.
- `systemPromptAddition` (facoltativo, `string`) — anteposto al prompt di sistema.

Membri facoltativi:

| Member                         | Kind   | Purpose                                                                                                         |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Method | Inizializza lo stato del motore per una sessione. Chiamato una volta quando il motore vede per la prima volta una sessione (ad esempio per importare la cronologia). |
| `ingestBatch(params)`          | Method | Acquisisce un turno completato come batch. Chiamato dopo il completamento di un'esecuzione, con tutti i messaggi di quel turno in una volta sola.     |
| `afterTurn(params)`            | Method | Attività del ciclo di vita post-esecuzione (persistenza dello stato, attivazione della compattazione in background).                                         |
| `prepareSubagentSpawn(params)` | Method | Prepara lo stato condiviso per una sessione figlia.                                                                        |
| `onSubagentEnded(params)`      | Method | Esegue la pulizia dopo la fine di un subagente.                                                                                 |
| `dispose()`                    | Method | Rilascia le risorse. Chiamato durante l'arresto del gateway o il ricaricamento del plugin, non per sessione.                           |

### ownsCompaction

`ownsCompaction` controlla se la compattazione automatica integrata in-attempt di Pi rimane
abilitata per l'esecuzione:

- `true` — il motore gestisce il comportamento di compattazione. OpenClaw disabilita la compattazione automatica
  integrata di Pi per quell'esecuzione e l'implementazione `compact()` del motore è
  responsabile di `/compact`, della compattazione per il recupero da overflow e di qualsiasi compattazione
  proattiva che desidera eseguire in `afterTurn()`.
- `false` o non impostato — la compattazione automatica integrata di Pi può comunque essere eseguita durante
  l'esecuzione del prompt, ma il metodo `compact()` del motore attivo viene comunque chiamato per
  `/compact` e per il recupero da overflow.

`ownsCompaction: false` **non** significa che OpenClaw torni automaticamente
al percorso di compattazione del motore legacy.

Questo significa che esistono due modelli di plugin validi:

- **Modalità proprietaria** — implementa il tuo algoritmo di compattazione e imposta
  `ownsCompaction: true`.
- **Modalità delegata** — imposta `ownsCompaction: false` e fai in modo che `compact()` chiami
  `delegateCompactionToRuntime(...)` da `openclaw/plugin-sdk/core` per usare
  il comportamento di compattazione integrato di OpenClaw.

Un `compact()` no-op non è sicuro per un motore attivo non proprietario perché
disabilita il normale percorso di compattazione `/compact` e di recupero da overflow per quello
slot del motore.

## Riferimento della configurazione

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

Lo slot è esclusivo in fase di esecuzione: viene risolto un solo motore di contesto registrato
per una determinata esecuzione o operazione di compattazione. Altri plugin abilitati
`kind: "context-engine"` possono comunque essere caricati ed eseguire il loro codice di registrazione;
`plugins.slots.contextEngine` seleziona solo quale ID motore registrato
OpenClaw risolve quando ha bisogno di un motore di contesto.

## Relazione con compattazione e memoria

- **Compaction** è una delle responsabilità del motore di contesto. Il motore legacy
  delega al riepilogo integrato di OpenClaw. I motori plugin possono implementare
  qualsiasi strategia di compattazione (riepiloghi DAG, vector retrieval, ecc.).
- **Memory plugins** (`plugins.slots.memory`) sono separati dai motori di contesto.
  I plugin di memoria forniscono ricerca/recupero; i motori di contesto controllano ciò che il
  modello vede. Possono lavorare insieme: un motore di contesto può usare dati del
  plugin di memoria durante l'assemblaggio. I motori plugin che vogliono il percorso di prompt
  della memoria attiva dovrebbero preferire `buildMemorySystemPromptAddition(...)` da
  `openclaw/plugin-sdk/core`, che converte le sezioni attive del prompt di memoria
  in un `systemPromptAddition` pronto da anteporre. Se un motore ha bisogno di un controllo
  di livello inferiore, può comunque recuperare le righe grezze da
  `openclaw/plugin-sdk/memory-host-core` tramite
  `buildActiveMemoryPromptSection(...)`.
- **Session pruning** (il trimming dei vecchi risultati degli strumenti in memoria) continua a essere eseguito
  indipendentemente dal motore di contesto attivo.

## Suggerimenti

- Usa `openclaw doctor` per verificare che il motore venga caricato correttamente.
- Se cambi motore, le sessioni esistenti continuano con la loro cronologia attuale.
  Il nuovo motore subentra per le esecuzioni future.
- Gli errori del motore vengono registrati nei log e mostrati nella diagnostica. Se un motore plugin
  non riesce a registrarsi o l'ID motore selezionato non può essere risolto, OpenClaw
  non effettua automaticamente un fallback; le esecuzioni falliscono finché non correggi il plugin o
  non reimposti `plugins.slots.contextEngine` su `"legacy"`.
- Per lo sviluppo, usa `openclaw plugins install -l ./my-engine` per collegare una
  directory di plugin locale senza copiarla.

Vedi anche: [Compaction](/it/concepts/compaction), [Context](/it/concepts/context),
[Plugins](/it/tools/plugin), [Plugin manifest](/it/plugins/manifest).

## Correlati

- [Context](/it/concepts/context) — come viene costruito il contesto per i turni dell'agente
- [Plugin Architecture](/it/plugins/architecture) — registrazione dei plugin del motore di contesto
- [Compaction](/it/concepts/compaction) — riepilogo delle conversazioni lunghe
