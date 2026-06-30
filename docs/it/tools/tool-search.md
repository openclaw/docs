---
read_when:
    - Vuoi che gli agenti OpenClaw usino un ampio catalogo di strumenti senza aggiungere al prompt ogni schema degli strumenti
    - Vuoi che gli strumenti OpenClaw, gli strumenti MCP e gli strumenti client siano esposti tramite un'unica superficie runtime compatta
    - Stai implementando o eseguendo il debug del rilevamento degli strumenti per le esecuzioni di OpenClaw
summary: 'Ricerca strumenti: compatta i grandi cataloghi di strumenti OpenClaw dietro ricerca, descrizione e chiamata'
title: Ricerca strumenti
x-i18n:
    generated_at: "2026-06-30T14:09:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81036277d763be8040526b42c116b2e503589921a58b3f765ff38670554a751c
    source_path: tools/tool-search.md
    workflow: 16
---

Ricerca strumenti è una funzionalità sperimentale del runtime agente di OpenClaw. Offre agli agenti un modo
compatto per scoprire e chiamare cataloghi di strumenti di grandi dimensioni. È utile quando l'esecuzione
ha molti strumenti disponibili, ma è probabile che il modello ne abbia bisogno solo di pochi.

Questa pagina documenta la Ricerca strumenti di OpenClaw. Non è la superficie di
ricerca strumenti o strumenti dinamici nativa di Codex. La modalità codice nativa di Codex, la ricerca strumenti, gli strumenti
dinamici differiti e le chiamate a strumenti annidate sono superfici stabili dell'harness Codex e
non dipendono da `tools.toolSearch`.

Quando è abilitata per le esecuzioni OpenClaw, il modello riceve per impostazione predefinita uno strumento `tool_search_code`.
Quello strumento esegue un breve corpo JavaScript in un sottoprocesso Node
isolato con un bridge `openclaw.tools`:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Il catalogo può includere strumenti OpenClaw, strumenti dei plugin, strumenti MCP e
strumenti forniti dal client. Il modello non vede in anticipo ogni schema completo.
Invece, cerca descrittori compatti, descrive uno strumento selezionato quando
ha bisogno dello schema esatto e chiama quello strumento tramite OpenClaw.

Le esecuzioni dell'harness Codex non ricevono questi controlli sperimentali di Ricerca strumenti di OpenClaw.
OpenClaw passa le funzionalità del prodotto a Codex come strumenti dinamici, e
Codex possiede la modalità codice nativa stabile, la ricerca strumenti nativa, gli strumenti
dinamici differiti e le chiamate a strumenti annidate.

## Come viene eseguito un turno

Al momento della pianificazione, il runner incorporato di OpenClaw crea il catalogo effettivo per
l'esecuzione:

1. Risolve la policy degli strumenti attiva per agente, profilo, sandbox e sessione.
2. Elenca gli strumenti OpenClaw e dei plugin idonei.
3. Elenca gli strumenti MCP idonei tramite il runtime MCP della sessione.
4. Aggiunge gli strumenti client idonei forniti per l'esecuzione corrente.
5. Indicizza descrittori compatti per la ricerca.
6. Espone al modello il bridge codice di OpenClaw, gli strumenti di fallback strutturati o la
   superficie directory compatta.

Al momento dell'esecuzione, ogni chiamata reale a uno strumento torna a OpenClaw. Il runtime Node
isolato non contiene implementazioni di plugin, oggetti client MCP o segreti.
`openclaw.tools.call(...)` attraversa il bridge tornando nel Gateway, dove continuano ad applicarsi
la normale policy, le approvazioni, gli hook, la registrazione e la gestione dei risultati.

## Modalità

`tools.toolSearch` ha tre modalità visibili al modello:

- `code`: espone `tool_search_code`, il bridge JavaScript compatto predefinito.
- `tools`: espone `tool_search`, `tool_describe` e `tool_call` come semplici
  strumenti strutturati per i provider che non dovrebbero ricevere codice.
- `directory`: espone `tool_search`, `tool_describe` e `tool_call` più una
  directory di prompt limitata con nomi e descrizioni degli strumenti disponibili per
  i provider che dovrebbero vedere i nomi degli strumenti senza ogni schema completo. OpenClaw può
  anche esporre direttamente un piccolo insieme limitato di schemi di strumenti probabili o richiesti
  per il turno corrente.

Tutte le modalità usano lo stesso catalogo filtrato dalla policy e il normale percorso di esecuzione
OpenClaw. Se il runtime corrente non può avviare il processo figlio Node isolato
della modalità codice, la modalità predefinita `code` ripiega su `tools` prima della compattazione
del catalogo. In modalità `directory`, gli strumenti forniti dal client restano direttamente visibili
per l'esecuzione corrente, mentre gli strumenti OpenClaw, gli strumenti dei plugin e gli strumenti MCP possono essere
compattati dietro il catalogo directory. Una chiamata diretta a un nome directory nascosto esatto
viene idratata dallo stesso catalogo autorizzato prima dell'esecuzione.

Tutte le modalità sono sperimentali. Preferisci l'esposizione diretta degli strumenti per cataloghi di strumenti OpenClaw
piccoli, e preferisci le superfici stabili native di Codex per le esecuzioni dell'harness Codex.

Non esiste una configurazione separata per la selezione delle origini. Quando Ricerca strumenti è abilitata, il
catalogo include strumenti OpenClaw, MCP e client idonei dopo il normale filtraggio
della policy.

## Perché esiste

I cataloghi grandi sono utili ma costosi. Inviare ogni schema di strumento al modello
aumenta le dimensioni della richiesta, rallenta la pianificazione e aumenta la selezione accidentale
degli strumenti.

Ricerca strumenti cambia la forma:

- strumenti diretti: il modello vede ogni schema selezionato prima del primo token
- modalità codice di Ricerca strumenti: il modello vede uno strumento codice compatto e un breve contratto
  API
- modalità strumenti di Ricerca strumenti: il modello vede tre strumenti di fallback strutturati
  compatti
- modalità directory di Ricerca strumenti: il modello vede una directory limitata più
  controlli di ricerca/descrizione/chiamata e un piccolo insieme limitato di schemi probabili o richiesti
- durante il turno: il modello può caricare gli schemi rimanenti secondo necessità

L'esposizione diretta degli strumenti resta l'impostazione predefinita corretta per cataloghi piccoli. Ricerca strumenti
è più adatta quando una singola esecuzione può vedere molti strumenti, soprattutto da server MCP o
strumenti di app forniti dal client.

## API

`openclaw.tools.search(query, options?)`

Cerca nel catalogo effettivo dell'esecuzione corrente. I risultati sono compatti e sicuri
da reinserire nel contesto del prompt.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Carica i metadati completi per un risultato di ricerca, incluso lo schema di input esatto.

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

Chiama uno strumento selezionato tramite OpenClaw.

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planning",
  start: "2026-05-09T14:00:00Z",
});
```

La modalità di fallback strutturata espone le stesse operazioni come strumenti:

- `tool_search`
- `tool_describe`
- `tool_call`

La modalità directory espone:

- `tool_search`
- `tool_describe`
- `tool_call`

Mantiene inoltre gli strumenti forniti dal client direttamente visibili e può esporre direttamente un piccolo
insieme limitato di schemi di strumenti del catalogo probabili o richiesti per il turno corrente.
Se la directory limitata omette voci, usa `tool_search` per trovarle. Se
il modello richiede direttamente il nome esatto di uno strumento directory nascosto, OpenClaw
lo idrata dal catalogo autorizzato prima della normale esecuzione.
I nomi degli strumenti client in modalità directory non devono collidere con i nomi degli strumenti OpenClaw, dei plugin o MCP,
perché il dispatch differito esatto usa quei nomi.

## Confine del runtime

Il bridge codice viene eseguito in un sottoprocesso Node di breve durata. Il sottoprocesso parte
con la modalità permessi di Node abilitata, un ambiente vuoto, nessuna concessione per filesystem o
rete e nessuna concessione per processi figli o worker. OpenClaw applica un
timeout wall-clock del processo padre e termina il sottoprocesso al timeout, anche
dopo continuazioni asincrone.

Il runtime espone solo:

- `console.log`, `console.warn` e `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Il normale comportamento di OpenClaw si applica comunque alle chiamate finali:

- policy di autorizzazione e negazione degli strumenti
- restrizioni degli strumenti per agente e per sandbox
- policy degli strumenti del canale/runtime
- hook di approvazione
- hook `before_tool_call` dei plugin
- identità di sessione, log e telemetria

## Configurazione

Abilita Ricerca strumenti per le esecuzioni OpenClaw con il bridge codice predefinito:

```bash
openclaw config set tools.toolSearch true
```

JSON equivalente:

```json5
{
  tools: {
    toolSearch: true,
  },
}
```

Usa invece gli strumenti di fallback strutturati per le esecuzioni OpenClaw:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Usa invece la superficie directory compatta per le esecuzioni OpenClaw:

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

Regola il timeout della modalità codice e i limiti dei risultati di ricerca:

```json5
{
  tools: {
    toolSearch: {
      mode: "code",
      codeTimeoutMs: 10000,
      searchDefaultLimit: 8,
      maxSearchLimit: 20,
    },
  },
}
```

Disabilitala:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt e telemetria

Ricerca strumenti registra telemetria sufficiente per confrontarla con l'esposizione diretta degli strumenti:

- byte totali serializzati di strumenti e prompt inviati all'harness
- dimensione del catalogo e ripartizione delle origini
- conteggi di ricerca, descrizione e chiamata
- chiamate finali agli strumenti eseguite tramite OpenClaw
- ID e origini degli strumenti selezionati

I log di sessione dovrebbero rendere possibile rispondere a:

- quanti schemi di strumenti il modello ha visto in anticipo
- quante operazioni di ricerca e descrizione ha eseguito
- quale strumento finale è stato chiamato
- se il risultato proviene da OpenClaw, MCP o da uno strumento client

## Validazione E2E

Lo scenario Gateway di QA Lab dimostra entrambi i percorsi con il runtime OpenClaw:

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

Crea un plugin fittizio temporaneo con un grande catalogo di strumenti, avvia il provider
OpenAI simulato, avvia un Gateway una volta in modalità diretta e una volta con Ricerca strumenti
abilitata, quindi confronta i payload delle richieste al provider e i log di sessione.

La regressione dimostra che:

1. La modalità diretta può chiamare lo strumento del plugin fittizio.
2. Ricerca strumenti può chiamare lo stesso strumento del plugin fittizio.
3. La modalità diretta espone direttamente al provider gli schemi degli strumenti del plugin fittizio.
4. Ricerca strumenti espone solo il bridge compatto.
5. Il payload della richiesta di Ricerca strumenti è più piccolo per il grande catalogo fittizio.
6. I log di sessione mostrano i conteggi attesi delle chiamate agli strumenti e la telemetria delle chiamate bridged.

## Comportamento in caso di errore

Ricerca strumenti dovrebbe fallire in modo chiuso:

- se uno strumento non è nella policy effettiva, la ricerca non dovrebbe restituirlo
- se uno strumento selezionato diventa non disponibile, `tool_call` dovrebbe fallire
- se la policy o l'approvazione blocca l'esecuzione, il risultato della chiamata dovrebbe segnalare quel
  blocco invece di aggirarlo
- se il bridge codice non può creare un runtime isolato, usa `mode: "tools"` o
  disabilita Ricerca strumenti per quel deployment

## Correlati

- [Strumenti e plugin](/it/tools)
- [Sandbox multi-agente e strumenti](/it/tools/multi-agent-sandbox-tools)
- [Strumento exec](/it/tools/exec)
- [Configurazione agenti ACP](/it/tools/acp-agents-setup)
- [Creazione di plugin](/it/plugins/building-plugins)
