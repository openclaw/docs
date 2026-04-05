---
read_when:
    - Vuoi capire come OpenClaw assembla il contesto del modello
    - Stai passando dal motore legacy a un motore plugin
    - Stai creando un plugin del motore di contesto
summary: 'Motore di contesto: assemblaggio del contesto collegabile, compattazione e ciclo di vita dei sottoagenti'
title: Motore di contesto
x-i18n:
    generated_at: "2026-04-05T13:49:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd8cbb0e953f58fd84637fc4ceefc65984312cf2896d338318bc8cf860e6d9
    source_path: concepts/context-engine.md
    workflow: 15
---

# Motore di contesto

Un **motore di contesto** controlla il modo in cui OpenClaw costruisce il contesto del modello per ogni esecuzione.
Decide quali messaggi includere, come riepilogare la cronologia meno recente e come
gestire il contesto ai confini dei sottoagenti.

OpenClaw include un motore integrato `legacy`. I plugin possono registrare
motori alternativi che sostituiscono il ciclo di vita del motore di contesto attivo.

## Guida rapida

Controlla quale motore è attivo:

```bash
openclaw doctor
# oppure ispeziona direttamente la configurazione:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### Installazione di un plugin del motore di contesto

I plugin del motore di contesto vengono installati come qualsiasi altro plugin OpenClaw. Installa
prima il plugin, quindi seleziona il motore nello slot:

```bash
# Installa da npm
openclaw plugins install @martian-engineering/lossless-claw

# Oppure installa da un percorso locale (per lo sviluppo)
openclaw plugins install -l ./my-context-engine
```

Quindi abilita il plugin e selezionalo come motore attivo nella configurazione:

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
        // La configurazione specifica del plugin va qui (consulta la documentazione del plugin)
      },
    },
  },
}
```

Riavvia il gateway dopo l'installazione e la configurazione.

Per tornare al motore integrato, imposta `contextEngine` su `"legacy"` (oppure
rimuovi completamente la chiave — `"legacy"` è il valore predefinito).

## Come funziona

Ogni volta che OpenClaw esegue un prompt del modello, il motore di contesto interviene in
quattro punti del ciclo di vita:

1. **Ingest** — chiamato quando viene aggiunto un nuovo messaggio alla sessione. Il motore
   può memorizzare o indicizzare il messaggio nel proprio archivio dati.
2. **Assemble** — chiamato prima di ogni esecuzione del modello. Il motore restituisce un insieme
   ordinato di messaggi (e un eventuale `systemPromptAddition`) che rientra
   nel budget di token.
3. **Compact** — chiamato quando la finestra di contesto è piena, o quando l'utente esegue
   `/compact`. Il motore riepiloga la cronologia meno recente per liberare spazio.
4. **After turn** — chiamato dopo il completamento di un'esecuzione. Il motore può rendere persistente lo stato,
   attivare la compattazione in background o aggiornare gli indici.

### Ciclo di vita del sottoagente (facoltativo)

Attualmente OpenClaw chiama un hook del ciclo di vita del sottoagente:

- **onSubagentEnded** — esegue la pulizia quando una sessione di sottoagente termina o viene rimossa.

L'hook `prepareSubagentSpawn` fa parte dell'interfaccia per uso futuro, ma
il runtime non lo invoca ancora.

### Aggiunta al prompt di sistema

Il metodo `assemble` può restituire una stringa `systemPromptAddition`. OpenClaw
la antepone al prompt di sistema per l'esecuzione. Questo consente ai motori di iniettare
indicazioni dinamiche di richiamo, istruzioni di recupero o suggerimenti sensibili al contesto
senza richiedere file statici dell'area di lavoro.

## Il motore legacy

Il motore integrato `legacy` preserva il comportamento originale di OpenClaw:

- **Ingest**: nessuna operazione (il gestore di sessione si occupa direttamente della persistenza dei messaggi).
- **Assemble**: pass-through (la pipeline esistente sanitize → validate → limit
  nel runtime gestisce l'assemblaggio del contesto).
- **Compact**: delega alla compattazione di riepilogo integrata, che crea
  un singolo riepilogo dei messaggi meno recenti e mantiene intatti i messaggi recenti.
- **After turn**: nessuna operazione.

Il motore legacy non registra strumenti e non fornisce un `systemPromptAddition`.

Quando `plugins.slots.contextEngine` non è impostato (oppure è impostato su `"legacy"`), questo
motore viene usato automaticamente.

## Motori plugin

Un plugin può registrare un motore di contesto usando l'API dei plugin:

```ts
export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Memorizza il messaggio nel tuo archivio dati
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget }) {
      // Restituisci i messaggi che rientrano nel budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: "Use lcm_grep to search history...",
      };
    },

    async compact({ sessionId, force }) {
      // Riepiloga il contesto meno recente
      return { ok: true, compacted: true };
    },
  }));
}
```

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

| Membro             | Tipo     | Scopo                                                    |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Proprietà | Id motore, nome, versione e se possiede la compattazione |
| `ingest(params)`   | Metodo   | Memorizzare un singolo messaggio                         |
| `assemble(params)` | Metodo   | Costruire il contesto per un'esecuzione del modello (restituisce `AssembleResult`) |
| `compact(params)`  | Metodo   | Riepilogare/ridurre il contesto                          |

`assemble` restituisce un `AssembleResult` con:

- `messages` — i messaggi ordinati da inviare al modello.
- `estimatedTokens` (obbligatorio, `number`) — la stima del motore del numero totale di
  token nel contesto assemblato. OpenClaw usa questo valore per le decisioni sulla soglia di compattazione
  e per il reporting diagnostico.
- `systemPromptAddition` (facoltativo, `string`) — anteposto al prompt di sistema.

Membri facoltativi:

| Membro                         | Tipo   | Scopo                                                                                                            |
| ------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Metodo | Inizializzare lo stato del motore per una sessione. Chiamato una volta quando il motore vede per la prima volta una sessione (ad esempio, per importare la cronologia). |
| `ingestBatch(params)`          | Metodo | Acquisire un turno completato come batch. Chiamato dopo il completamento di un'esecuzione, con tutti i messaggi di quel turno in una sola volta. |
| `afterTurn(params)`            | Metodo | Lavoro del ciclo di vita post-esecuzione (rendere persistente lo stato, attivare la compattazione in background). |
| `prepareSubagentSpawn(params)` | Metodo | Impostare lo stato condiviso per una sessione figlia.                                                            |
| `onSubagentEnded(params)`      | Metodo | Eseguire la pulizia dopo la fine di un sottoagente.                                                              |
| `dispose()`                    | Metodo | Rilasciare le risorse. Chiamato durante l'arresto del gateway o il ricaricamento del plugin — non per sessione. |

### ownsCompaction

`ownsCompaction` controlla se la compattazione automatica integrata di Pi durante il tentativo
rimane abilitata per l'esecuzione:

- `true` — il motore possiede il comportamento di compattazione. OpenClaw disabilita la
  compattazione automatica integrata di Pi per quell'esecuzione, e l'implementazione `compact()`
  del motore è responsabile di `/compact`, della compattazione di recupero da overflow e di qualsiasi
  compattazione proattiva che voglia eseguire in `afterTurn()`.
- `false` o non impostato — la compattazione automatica integrata di Pi può comunque essere eseguita durante l'esecuzione
  del prompt, ma il metodo `compact()` del motore attivo viene comunque chiamato per
  `/compact` e per il recupero da overflow.

`ownsCompaction: false` **non** significa che OpenClaw ritorna automaticamente
al percorso di compattazione del motore legacy.

Questo significa che esistono due modelli validi di plugin:

- **Modalità proprietaria** — implementa il tuo algoritmo di compattazione e imposta
  `ownsCompaction: true`.
- **Modalità delegata** — imposta `ownsCompaction: false` e fai in modo che `compact()` chiami
  `delegateCompactionToRuntime(...)` da `openclaw/plugin-sdk/core` per usare
  il comportamento di compattazione integrato di OpenClaw.

Un `compact()` che non esegue alcuna operazione non è sicuro per un motore attivo non proprietario perché
disabilita il normale percorso di compattazione `/compact` e di recupero da overflow per quello slot
del motore.

## Riferimento della configurazione

```json5
{
  plugins: {
    slots: {
      // Seleziona il motore di contesto attivo. Predefinito: "legacy".
      // Impostalo su un id plugin per usare un motore plugin.
      contextEngine: "legacy",
    },
  },
}
```

Lo slot è esclusivo in fase di esecuzione — viene risolto un solo motore di contesto registrato
per una determinata esecuzione o operazione di compattazione. Altri plugin abilitati
`kind: "context-engine"` possono comunque caricarsi ed eseguire il proprio codice di registrazione;
`plugins.slots.contextEngine` seleziona solo quale id di motore registrato
OpenClaw risolve quando ha bisogno di un motore di contesto.

## Relazione con compattazione e memoria

- **Compattazione** è una delle responsabilità del motore di contesto. Il motore legacy
  delega alla funzionalità di riepilogo integrata di OpenClaw. I motori plugin possono implementare
  qualsiasi strategia di compattazione (riepiloghi DAG, recupero vettoriale, ecc.).
- **Plugin di memoria** (`plugins.slots.memory`) sono separati dai motori di contesto.
  I plugin di memoria forniscono ricerca/recupero; i motori di contesto controllano ciò che il
  modello vede. Possono collaborare — un motore di contesto potrebbe usare dati del plugin
  di memoria durante l'assemblaggio.
- **Potatura della sessione** (riduzione in memoria dei risultati degli strumenti meno recenti) continua a essere eseguita
  indipendentemente dal motore di contesto attivo.

## Suggerimenti

- Usa `openclaw doctor` per verificare che il tuo motore venga caricato correttamente.
- Se cambi motore, le sessioni esistenti continuano con la cronologia attuale.
  Il nuovo motore prenderà il controllo per le esecuzioni future.
- Gli errori del motore vengono registrati e mostrati nella diagnostica. Se un motore plugin
  non riesce a registrarsi o non è possibile risolvere l'id del motore selezionato, OpenClaw
  non esegue un fallback automatico; le esecuzioni falliscono finché non correggi il plugin oppure
  riporti `plugins.slots.contextEngine` a `"legacy"`.
- Per lo sviluppo, usa `openclaw plugins install -l ./my-engine` per collegare una
  directory di plugin locale senza copiarla.

Vedi anche: [Compattazione](/concepts/compaction), [Contesto](/concepts/context),
[Plugin](/tools/plugin), [Manifest del plugin](/plugins/manifest).

## Correlati

- [Contesto](/concepts/context) — come viene costruito il contesto per i turni dell'agente
- [Architettura dei plugin](/plugins/architecture) — registrazione dei plugin del motore di contesto
- [Compattazione](/concepts/compaction) — riepilogo delle conversazioni lunghe
