---
read_when:
    - Vuoi che gli agenti OpenClaw utilizzino un ampio catalogo di strumenti senza aggiungere al prompt lo schema di ogni strumento
    - Vuoi che gli strumenti OpenClaw, gli strumenti MCP e gli strumenti client siano esposti tramite un'unica superficie runtime compatta
    - Stai implementando o eseguendo il debug del rilevamento degli strumenti per le esecuzioni di OpenClaw
summary: 'Ricerca degli strumenti: compatta gli ampi cataloghi di strumenti di OpenClaw dietro ricerca, descrizione e chiamata'
title: Ricerca strumenti
x-i18n:
    generated_at: "2026-07-12T07:35:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6608a2de3b8ec03d3bb182d5909bb73429f623af8cebb34bc38856cb9d8b8c32
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search è una funzionalità sperimentale del runtime degli agenti OpenClaw. Offre agli agenti un unico
modo compatto per individuare e chiamare ampi cataloghi di strumenti. È utile quando l'esecuzione
dispone di molti strumenti, ma è probabile che il modello ne utilizzi solo alcuni.

Questa pagina documenta Tool Search di OpenClaw. Non riguarda la ricerca degli strumenti
nativa di Codex né la superficie degli strumenti dinamici. La modalità codice nativa di Codex, la ricerca degli strumenti, gli strumenti dinamici
differiti e le chiamate annidate agli strumenti sono superfici stabili dell'harness Codex e
non dipendono da `tools.toolSearch`.

Quando è abilitata per le esecuzioni OpenClaw, per impostazione predefinita il modello riceve un unico strumento `tool_search_code`,
oltre agli eventuali strumenti solo diretti i cui risultati strutturati non possono attraversare
il bridge compatto. Lo strumento di codice esegue un breve corpo JavaScript in un sottoprocesso
Node isolato con un bridge `openclaw.tools`:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Il catalogo può includere strumenti OpenClaw idonei per il catalogo, strumenti dei plugin, strumenti MCP
e strumenti forniti dal client. Il modello non vede anticipatamente tutti gli schemi catalogati.
Cerca invece descrittori compatti, recupera la descrizione di uno strumento selezionato
quando necessita dello schema esatto e chiama tale strumento tramite OpenClaw.
Gli strumenti solo diretti rimangono visibili al modello e non vengono aggiunti al catalogo.

Le esecuzioni dell'harness Codex non ricevono questi controlli sperimentali di Tool Search
di OpenClaw. OpenClaw passa le funzionalità del prodotto a Codex come strumenti dinamici e
Codex gestisce la modalità codice nativa stabile, la ricerca degli strumenti nativa, gli strumenti dinamici
differiti e le chiamate annidate agli strumenti.

## Funzionamento di un turno

Durante la pianificazione, il runner incorporato di OpenClaw crea il catalogo effettivo per
l'esecuzione:

1. Risolve la policy degli strumenti attiva per l'agente, il profilo, la sandbox e la sessione.
2. Elenca gli strumenti OpenClaw e dei plugin idonei.
3. Elenca gli strumenti MCP idonei tramite il runtime MCP della sessione.
4. Aggiunge gli strumenti idonei forniti dal client per l'esecuzione corrente.
5. Mantiene visibili al modello gli strumenti solo diretti e indicizza descrittori compatti per i
   restanti strumenti idonei per il catalogo.
6. Espone il bridge di codice OpenClaw, gli strumenti strutturati di ripiego o la
   superficie compatta della directory insieme agli strumenti solo diretti.

Durante l'esecuzione, ogni chiamata reale a uno strumento torna a OpenClaw. Il runtime Node
isolato non contiene implementazioni dei plugin, oggetti client MCP o segreti.
`openclaw.tools.call(...)` attraversa il bridge e torna nel Gateway, dove continuano ad applicarsi
la normale policy, l'approvazione, gli hook, la registrazione e la gestione dei risultati.

## Modalità

`tools.toolSearch` dispone di tre modalità rivolte al modello:

- `code`: espone `tool_search_code`, il bridge JavaScript compatto predefinito,
  insieme agli strumenti solo diretti.
- `tools`: espone `tool_search`, `tool_describe` e `tool_call` come semplici
  strumenti strutturati per i provider che non devono ricevere codice, insieme
  agli strumenti solo diretti.
- `directory`: espone `tool_search`, `tool_describe` e `tool_call`, oltre a una
  directory limitata nel prompt contenente i nomi e le descrizioni degli strumenti disponibili per
  i provider che devono vedere i nomi degli strumenti senza tutti gli schemi completi. OpenClaw può
  anche esporre direttamente un piccolo insieme limitato di schemi di strumenti probabili o necessari
  per il turno corrente. Anche in questa modalità gli strumenti solo diretti rimangono visibili.

Tutte le modalità utilizzano lo stesso catalogo filtrato dalla policy e il normale percorso di esecuzione
di OpenClaw. Gli strumenti contrassegnati con `catalogMode: "direct-only"` rimangono fuori da tale catalogo e
restano visibili al modello. Se il runtime corrente non può avviare il processo figlio isolato Node
della modalità codice, la modalità predefinita `code` ripiega su `tools` prima della
Compaction del catalogo. In modalità `directory`, gli strumenti forniti dal client rimangono direttamente visibili
per l'esecuzione corrente, mentre gli strumenti OpenClaw, dei plugin e MCP possono essere
compattati dietro il catalogo della directory. Una chiamata diretta a un nome esatto nascosto
della directory viene caricata dallo stesso catalogo autorizzato prima dell'esecuzione.

Tutte le modalità sono sperimentali. Per i piccoli cataloghi di strumenti OpenClaw, preferire
l'esposizione diretta degli strumenti; per le esecuzioni dell'harness Codex, preferire le superfici stabili
native di Codex.

Non esiste una configurazione separata per la selezione delle sorgenti. Quando Tool Search è abilitata, il
catalogo include gli strumenti OpenClaw, MCP e del client idonei per il catalogo dopo il normale
filtro della policy; gli strumenti solo diretti vengono mantenuti separatamente.

## Perché esiste

I cataloghi di grandi dimensioni sono utili ma costosi. Inviare ogni schema di strumento al modello
rende la richiesta più grande, rallenta la pianificazione e aumenta la probabilità di selezionare
accidentalmente uno strumento.

Tool Search modifica la struttura:

- strumenti diretti: il modello vede ogni schema selezionato prima del primo token
- modalità codice di Tool Search: il modello vede un unico strumento di codice compatto, un breve contratto
  API e gli eventuali strumenti solo diretti
- modalità strumenti di Tool Search: il modello vede tre strumenti strutturati compatti
  di ripiego, oltre agli eventuali strumenti solo diretti
- modalità directory di Tool Search: il modello vede una directory limitata, oltre ai
  controlli di ricerca/descrizione/chiamata e a un piccolo insieme limitato di schemi probabili o necessari,
  nonché gli eventuali strumenti solo diretti
- durante il turno: il modello può caricare gli schemi rimanenti quando necessario

L'esposizione diretta degli strumenti rimane l'impostazione predefinita corretta per i cataloghi di piccole dimensioni. Tool Search
è particolarmente indicata quando una singola esecuzione può accedere a molti strumenti, soprattutto da server MCP o
da strumenti dell'app forniti dal client.

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

La modalità strutturata di ripiego espone le stesse operazioni come strumenti:

- `tool_search`
- `tool_describe`
- `tool_call`

La modalità directory espone:

- `tool_search`
- `tool_describe`
- `tool_call`

Mantiene inoltre direttamente visibili gli strumenti forniti dal client e tutti gli strumenti solo diretti
e può esporre direttamente un piccolo insieme limitato di schemi di strumenti del catalogo probabili o necessari
per il turno corrente. Se la directory limitata omette alcune voci, utilizzare
`tool_search` per trovarle. Se il modello richiede direttamente il nome esatto di uno strumento nascosto
della directory, OpenClaw lo carica dal catalogo autorizzato prima
della normale esecuzione.
I nomi degli strumenti del client in modalità directory non devono entrare in conflitto con i nomi degli strumenti OpenClaw,
dei plugin o MCP, poiché la distribuzione differita esatta utilizza tali nomi.

## Confine del runtime

Il bridge di codice viene eseguito in un sottoprocesso Node di breve durata. Il sottoprocesso viene avviato
con la modalità delle autorizzazioni di Node abilitata, un ambiente vuoto, nessuna autorizzazione per il filesystem
o la rete e nessuna autorizzazione per processi figli o worker. OpenClaw applica un
timeout basato sul tempo reale nel processo padre e termina il sottoprocesso allo scadere del timeout, anche
dopo continuazioni asincrone.

Il runtime espone esclusivamente:

- `console.log`, `console.warn` e `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Il normale comportamento di OpenClaw continua ad applicarsi alle chiamate finali:

- policy di autorizzazione e negazione degli strumenti
- restrizioni degli strumenti per agente e per sandbox
- policy degli strumenti del canale/runtime
- hook di approvazione
- hook `before_tool_call` dei plugin
- identità della sessione, log e telemetria

## Configurazione

Abilitare Tool Search per le esecuzioni OpenClaw con il bridge di codice predefinito:

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

Per le esecuzioni OpenClaw, utilizzare invece gli strumenti strutturati di ripiego:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Per le esecuzioni OpenClaw, utilizzare invece la superficie compatta della directory:

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

Regolare il timeout della modalità codice e i limiti dei risultati di ricerca (i valori mostrati sono quelli predefiniti):

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

Il runtime limita `codeTimeoutMs` all'intervallo 1000-60000, `maxSearchLimit` all'intervallo 1-50 e
`searchDefaultLimit` all'intervallo 1..`maxSearchLimit`.

Per disabilitarla:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt e telemetria

Tool Search registra telemetria sufficiente per confrontarla con l'esposizione diretta degli strumenti:

- byte totali serializzati degli strumenti e del prompt inviati all'harness
- dimensioni del catalogo e suddivisione per sorgente
- numero di operazioni di ricerca, descrizione e chiamata
- chiamate finali agli strumenti eseguite tramite OpenClaw
- ID e sorgenti degli strumenti selezionati

I log della sessione dovrebbero consentire di determinare:

- quanti schemi di strumenti il modello ha visto anticipatamente
- quante operazioni di ricerca e descrizione ha eseguito
- quale strumento finale è stato chiamato
- se il risultato proveniva da OpenClaw, MCP o da uno strumento del client

## Convalida E2E

Lo scenario del Gateway di QA Lab verifica entrambi i percorsi con il runtime OpenClaw:

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

Crea un plugin temporaneo fittizio con un ampio catalogo di strumenti, avvia il provider
OpenAI simulato, avvia una volta un Gateway in modalità diretta e una volta con Tool Search
abilitata, quindi confronta i payload delle richieste al provider e i log della sessione.

La regressione dimostra che:

1. La modalità diretta può chiamare lo strumento del plugin fittizio.
2. Tool Search può chiamare lo stesso strumento del plugin fittizio.
3. La modalità diretta espone gli schemi degli strumenti del plugin fittizio direttamente al provider.
4. Tool Search espone solo il bridge compatto e gli eventuali strumenti solo diretti.
5. Il payload della richiesta di Tool Search è più piccolo per l'ampio catalogo fittizio.
6. I log della sessione mostrano il numero previsto di chiamate agli strumenti e la telemetria delle chiamate tramite bridge.

## Comportamento in caso di errore

Tool Search deve interrompersi in modo sicuro:

- se uno strumento non rientra nella policy effettiva, la ricerca non deve restituirlo
- se uno strumento selezionato diventa indisponibile, `tool_call` deve restituire un errore
- se la policy o l'approvazione blocca l'esecuzione, il risultato della chiamata deve segnalare tale
  blocco anziché aggirarlo
- se il bridge di codice non può creare un runtime isolato, utilizzare `mode: "tools"` oppure
  disabilitare Tool Search per tale distribuzione

## Contenuti correlati

- [Strumenti e plugin](/it/tools)
- [Sandbox multi-agente e strumenti](/it/tools/multi-agent-sandbox-tools)
- [Strumento Exec](/it/tools/exec)
- [Configurazione degli agenti ACP](/it/tools/acp-agents-setup)
- [Creazione di plugin](/it/plugins/building-plugins)
