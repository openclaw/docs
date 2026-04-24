---
read_when:
    - Vuoi capire come OpenClaw assembla il contesto del modello
    - Stai passando dal motore legacy a un motore Plugin
    - Stai creando un Plugin per il motore di contesto
summary: 'Motore di contesto: assemblaggio del contesto collegabile, Compaction e ciclo di vita dei subagenti'
title: Motore di contesto
x-i18n:
    generated_at: "2026-04-24T08:35:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f4e5f01f945f7fe3056587f2aa60bec607dd0dd64b29e9ab2afe8e77b5d2f1e
    source_path: concepts/context-engine.md
    workflow: 15
---

Un **motore di contesto** controlla come OpenClaw costruisce il contesto del modello per ogni esecuzione:
quali messaggi includere, come riassumere la cronologia meno recente e come gestire
il contesto oltre i confini dei subagenti.

OpenClaw include un motore integrato `legacy` e lo usa per impostazione predefinita — la maggior parte
degli utenti non ha mai bisogno di cambiarlo. Installa e seleziona un motore Plugin solo quando
vuoi un comportamento diverso per assemblaggio, Compaction o richiamo tra sessioni.

## Avvio rapido

Controlla quale motore è attivo:

```bash
openclaw doctor
# oppure ispeziona direttamente la configurazione:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### Installare un Plugin motore di contesto

I Plugin motore di contesto si installano come qualsiasi altro Plugin OpenClaw. Installa
prima, poi seleziona il motore nello slot:

```bash
# Installa da npm
openclaw plugins install @martian-engineering/lossless-claw

# Oppure installa da un percorso locale (per sviluppo)
openclaw plugins install -l ./my-context-engine
```

Poi abilita il Plugin e selezionalo come motore attivo nella tua configurazione:

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // deve corrispondere all'id motore registrato del Plugin
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // La configurazione specifica del Plugin va qui (vedi la documentazione del Plugin)
      },
    },
  },
}
```

Riavvia il gateway dopo l’installazione e la configurazione.

Per tornare al motore integrato, imposta `contextEngine` su `"legacy"` (oppure
rimuovi completamente la chiave — `"legacy"` è il valore predefinito).

## Come funziona

Ogni volta che OpenClaw esegue un prompt del modello, il motore di contesto partecipa in
quattro punti del ciclo di vita:

1. **Ingest** — chiamato quando un nuovo messaggio viene aggiunto alla sessione. Il motore
   può memorizzare o indicizzare il messaggio nel proprio archivio dati.
2. **Assemble** — chiamato prima di ogni esecuzione del modello. Il motore restituisce un insieme
   ordinato di messaggi (e un eventuale `systemPromptAddition`) che rientra
   nel budget di token.
3. **Compact** — chiamato quando la finestra di contesto è piena, o quando l’utente esegue
   `/compact`. Il motore riassume la cronologia meno recente per liberare spazio.
4. **After turn** — chiamato dopo il completamento di un’esecuzione. Il motore può persistere lo stato,
   attivare Compaction in background o aggiornare gli indici.

Per l’harness Codex incluso non ACP, OpenClaw applica lo stesso ciclo di vita
proiettando il contesto assemblato nelle istruzioni developer di Codex e nel prompt del turno
corrente. Codex continua comunque a gestire la propria cronologia nativa dei thread e il proprio compattatore nativo.

### Ciclo di vita del subagente (opzionale)

OpenClaw chiama due hook opzionali del ciclo di vita del subagente:

- **prepareSubagentSpawn** — prepara lo stato del contesto condiviso prima che inizi
  un’esecuzione figlia. L’hook riceve le chiavi di sessione padre/figlio, `contextMode`
  (`isolated` oppure `fork`), gli ID/file di trascrizione disponibili e un TTL opzionale.
  Se restituisce un handle di rollback, OpenClaw lo chiama quando lo spawn fallisce dopo
  che la preparazione è riuscita.
- **onSubagentEnded** — esegue la pulizia quando una sessione subagente termina o viene rimossa.

### Aggiunta al prompt di sistema

Il metodo `assemble` può restituire una stringa `systemPromptAddition`. OpenClaw
la antepone al prompt di sistema per l’esecuzione. Questo permette ai motori di iniettare
indicazioni dinamiche di richiamo, istruzioni di retrieval o suggerimenti sensibili al contesto
senza richiedere file statici del workspace.

## Il motore legacy

Il motore integrato `legacy` preserva il comportamento originale di OpenClaw:

- **Ingest**: no-op (il gestore di sessione gestisce direttamente la persistenza dei messaggi).
- **Assemble**: pass-through (la pipeline esistente sanitize → validate → limit
  nel runtime gestisce l’assemblaggio del contesto).
- **Compact**: delega alla Compaction di riassunto integrata, che crea
  un singolo riassunto dei messaggi meno recenti e mantiene intatti i messaggi recenti.
- **After turn**: no-op.

Il motore legacy non registra strumenti né fornisce `systemPromptAddition`.

Quando `plugins.slots.contextEngine` non è impostato (oppure è impostato su `"legacy"`), questo
motore viene usato automaticamente.

## Motori Plugin

Un Plugin può registrare un motore di contesto usando l’API Plugin:

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
      // Memorizza il messaggio nel tuo archivio dati
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Restituisci messaggi che rientrano nel budget
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
      // Riassumi il contesto meno recente
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

### L’interfaccia ContextEngine

Membri richiesti:

| Membro             | Tipo      | Scopo                                                    |
| ------------------ | --------- | -------------------------------------------------------- |
| `info`             | Proprietà | ID motore, nome, versione e se possiede la Compaction    |
| `ingest(params)`   | Metodo    | Memorizza un singolo messaggio                           |
| `assemble(params)` | Metodo    | Costruisce il contesto per un’esecuzione del modello (restituisce `AssembleResult`) |
| `compact(params)`  | Metodo    | Riassume/riduce il contesto                              |

`assemble` restituisce un `AssembleResult` con:

- `messages` — i messaggi ordinati da inviare al modello.
- `estimatedTokens` (obbligatorio, `number`) — la stima del motore del totale
  dei token nel contesto assemblato. OpenClaw la usa per le decisioni relative
  alla soglia di Compaction e per la reportistica diagnostica.
- `systemPromptAddition` (opzionale, `string`) — anteposto al prompt di sistema.

Membri opzionali:

| Membro                         | Tipo   | Scopo                                                                                                           |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Metodo | Inizializza lo stato del motore per una sessione. Chiamato una volta quando il motore vede per la prima volta una sessione (es. importa la cronologia). |
| `ingestBatch(params)`          | Metodo | Acquisisce un turno completato come batch. Chiamato dopo il completamento di un’esecuzione, con tutti i messaggi di quel turno in una volta sola. |
| `afterTurn(params)`            | Metodo | Lavoro del ciclo di vita post-esecuzione (persistenza dello stato, attivazione di Compaction in background).   |
| `prepareSubagentSpawn(params)` | Metodo | Prepara lo stato condiviso per una sessione figlia prima che inizi.                                             |
| `onSubagentEnded(params)`      | Metodo | Esegue la pulizia dopo la fine di un subagente.                                                                 |
| `dispose()`                    | Metodo | Rilascia risorse. Chiamato durante lo spegnimento del gateway o il reload del Plugin — non per sessione.       |

### ownsCompaction

`ownsCompaction` controlla se l’auto-Compaction integrata di Pi durante il tentativo rimane
abilitata per l’esecuzione:

- `true` — il motore possiede il comportamento di Compaction. OpenClaw disabilita l’auto-Compaction
  integrata di Pi per quell’esecuzione, e l’implementazione `compact()` del motore è
  responsabile di `/compact`, della Compaction di recupero da overflow e di qualsiasi Compaction
  proattiva voglia eseguire in `afterTurn()`.
- `false` oppure non impostato — l’auto-Compaction integrata di Pi può ancora essere eseguita durante l’esecuzione
  del prompt, ma il metodo `compact()` del motore attivo viene comunque chiamato per
  `/compact` e per il recupero da overflow.

`ownsCompaction: false` **non** significa che OpenClaw usa automaticamente come fallback
il percorso di Compaction del motore legacy.

Questo significa che esistono due pattern Plugin validi:

- **Modalità proprietaria** — implementa il tuo algoritmo di Compaction e imposta
  `ownsCompaction: true`.
- **Modalità delegata** — imposta `ownsCompaction: false` e fai in modo che `compact()` chiami
  `delegateCompactionToRuntime(...)` da `openclaw/plugin-sdk/core` per usare
  il comportamento di Compaction integrato di OpenClaw.

Un `compact()` no-op non è sicuro per un motore attivo non proprietario perché
disabilita il normale percorso `/compact` e di recupero da overflow per la Compaction in quello slot motore.

## Riferimento della configurazione

```json5
{
  plugins: {
    slots: {
      // Seleziona il motore di contesto attivo. Predefinito: "legacy".
      // Imposta un ID Plugin per usare un motore Plugin.
      contextEngine: "legacy",
    },
  },
}
```

Lo slot è esclusivo in fase di esecuzione — viene risolto un solo motore di contesto registrato
per una determinata esecuzione o operazione di Compaction. Altri
Plugin `kind: "context-engine"` abilitati possono comunque caricarsi ed eseguire il loro codice
di registrazione; `plugins.slots.contextEngine` seleziona solo quale ID motore registrato
OpenClaw risolve quando ha bisogno di un motore di contesto.

## Relazione con Compaction e memoria

- **Compaction** è una delle responsabilità del motore di contesto. Il motore legacy
  delega al riassunto integrato di OpenClaw. I motori Plugin possono implementare
  qualsiasi strategia di Compaction (riassunti DAG, vector retrieval, ecc.).
- **Plugin di memoria** (`plugins.slots.memory`) sono separati dai motori di contesto.
  I Plugin di memoria forniscono ricerca/retrieval; i motori di contesto controllano ciò che
  il modello vede. Possono lavorare insieme — un motore di contesto potrebbe usare dati del
  Plugin di memoria durante l’assemblaggio. I motori Plugin che vogliono il percorso di prompt
  Active Memory dovrebbero preferire `buildMemorySystemPromptAddition(...)` da
  `openclaw/plugin-sdk/core`, che converte le sezioni di prompt Active Memory attive
  in un `systemPromptAddition` pronto da anteporre. Se un motore ha bisogno di un controllo
  di livello più basso, può comunque ottenere righe grezze da
  `openclaw/plugin-sdk/memory-host-core` tramite
  `buildActiveMemoryPromptSection(...)`.
- **Potatura della sessione** (taglio dei vecchi risultati degli strumenti in memoria) viene ancora eseguita
  indipendentemente da quale motore di contesto sia attivo.

## Suggerimenti

- Usa `openclaw doctor` per verificare che il tuo motore si stia caricando correttamente.
- Se cambi motore, le sessioni esistenti continuano con la loro cronologia attuale.
  Il nuovo motore prende il controllo per le esecuzioni future.
- Gli errori del motore vengono registrati nei log e mostrati nella diagnostica. Se un motore Plugin
  non riesce a registrarsi o l’ID del motore selezionato non può essere risolto, OpenClaw
  non usa un fallback automatico; le esecuzioni falliscono finché non correggi il Plugin o
  non riporti `plugins.slots.contextEngine` a `"legacy"`.
- Per lo sviluppo, usa `openclaw plugins install -l ./my-engine` per collegare una
  directory Plugin locale senza copiarla.

Vedi anche: [Compaction](/it/concepts/compaction), [Context](/it/concepts/context),
[Plugins](/it/tools/plugin), [Manifest Plugin](/it/plugins/manifest).

## Correlati

- [Context](/it/concepts/context) — come viene costruito il contesto per i turni dell’agente
- [Architettura Plugin](/it/plugins/architecture) — registrazione dei Plugin motore di contesto
- [Compaction](/it/concepts/compaction) — riassumere conversazioni lunghe
