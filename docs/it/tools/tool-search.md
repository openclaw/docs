---
read_when:
    - Vuoi che gli agenti PI utilizzino un ampio catalogo di strumenti senza aggiungere ogni schema di strumento al prompt
    - Vuoi che gli strumenti OpenClaw, gli strumenti MCP e gli strumenti client siano esposti tramite un'unica superficie PI compatta
    - Stai implementando o eseguendo il debug del rilevamento degli strumenti per le esecuzioni PI
summary: 'Ricerca strumenti: compatta grandi cataloghi di strumenti PI dietro ricerca, descrizione e chiamata'
title: Ricerca strumenti
x-i18n:
    generated_at: "2026-05-11T20:40:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 410f21a4d56af163d03023f7280469e55e17e8296ee16f7b12cc2589494d0a0c
    source_path: tools/tool-search.md
    workflow: 16
---

La Ricerca strumenti è una funzionalità sperimentale per agenti PI di OpenClaw. Offre agli agenti PI un modo
compatto per scoprire e chiamare cataloghi di strumenti di grandi dimensioni. È utile quando l'esecuzione
ha molti strumenti disponibili, ma è probabile che il modello ne abbia bisogno solo di pochi.

Questa pagina documenta la Ricerca strumenti PI di OpenClaw. Non è la superficie di ricerca strumenti
o strumenti dinamici nativa di Codex. La modalità codice nativa di Codex, la ricerca strumenti, gli strumenti
dinamici differiti e le chiamate di strumenti annidate sono superfici stabili dell'harness Codex e non
dipendono da `tools.toolSearch`.

Quando è abilitata per PI, il modello riceve per impostazione predefinita uno strumento `tool_search_code`.
Questo strumento esegue un breve corpo JavaScript in un subprocesso Node isolato con un
bridge `openclaw.tools`:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Il catalogo può includere strumenti OpenClaw, strumenti plugin, strumenti MCP e
strumenti forniti dal client. Il modello non vede ogni schema completo in anticipo.
Invece, cerca descrittori compatti, descrive uno strumento selezionato quando ha
bisogno dello schema esatto e chiama quello strumento tramite OpenClaw.

Le esecuzioni dell'harness Codex non ricevono questi controlli sperimentali di Ricerca strumenti
di OpenClaw. OpenClaw passa le capacità del prodotto a Codex come strumenti dinamici, e
Codex possiede la modalità codice nativa stabile, la ricerca strumenti nativa, gli strumenti dinamici
differiti e le chiamate di strumenti annidate.

## Come viene eseguito un turno

In fase di pianificazione il runner PI incorporato costruisce il catalogo effettivo per
l'esecuzione:

1. Risolve la policy strumenti attiva per l'agente, il profilo, la sandbox e la sessione.
2. Elenca gli strumenti OpenClaw e plugin idonei.
3. Elenca gli strumenti MCP idonei tramite il runtime MCP della sessione.
4. Aggiunge gli strumenti client idonei forniti per l'esecuzione corrente.
5. Indicizza descrittori compatti per la ricerca.
6. Espone al modello il bridge di codice PI oppure gli strumenti di fallback strutturati.

In fase di esecuzione ogni chiamata reale a uno strumento torna a OpenClaw. Il runtime Node
isolato non contiene implementazioni di plugin, oggetti client MCP o segreti.
`openclaw.tools.call(...)` attraversa il bridge e torna nel Gateway, dove continuano ad
applicarsi la normale policy, le approvazioni, gli hook, il logging e la gestione dei risultati.

## Modalità

`tools.toolSearch` ha due modalità visibili al modello:

- `code`: espone `tool_search_code`, il bridge JavaScript compatto predefinito.
- `tools`: espone `tool_search`, `tool_describe` e `tool_call` come semplici
  strumenti strutturati per provider che non dovrebbero ricevere codice.

Entrambe le modalità usano lo stesso catalogo e lo stesso percorso di esecuzione. L'unica differenza è la
forma che vede il modello. Se il runtime corrente non può avviare il processo figlio Node
isolato della modalità codice, la modalità predefinita `code` ripiega su `tools` prima della
compattazione del catalogo.

Entrambe le modalità sono sperimentali. Preferisci l'esposizione diretta degli strumenti per piccoli
cataloghi di strumenti PI, e preferisci le superfici stabili native di Codex per le esecuzioni dell'harness Codex.

Non esiste una configurazione separata per la selezione delle sorgenti. Quando la Ricerca strumenti è abilitata, il
catalogo include gli strumenti OpenClaw, MCP e client idonei dopo il normale filtro delle policy.

## Perché esiste

I cataloghi grandi sono utili ma costosi. Inviare ogni schema di strumento al modello
rende la richiesta più grande, rallenta la pianificazione e aumenta la selezione accidentale
degli strumenti.

La Ricerca strumenti cambia la forma:

- strumenti diretti: il modello vede ogni schema selezionato prima del primo token
- modalità codice della Ricerca strumenti: il modello vede uno strumento di codice compatto e un breve contratto API
- modalità strumenti della Ricerca strumenti: il modello vede tre strumenti di fallback strutturati compatti
- durante il turno: il modello carica solo gli schemi degli strumenti di cui ha effettivamente bisogno

L'esposizione diretta degli strumenti resta l'impostazione predefinita corretta per cataloghi piccoli. La Ricerca strumenti
è più adatta quando una singola esecuzione può vedere molti strumenti, specialmente da server MCP o
strumenti app forniti dal client.

## API

`openclaw.tools.search(query, options?)`

Cerca nel catalogo effettivo per l'esecuzione corrente. I risultati sono compatti e sicuri
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

## Confine di runtime

Il bridge di codice viene eseguito in un subprocesso Node di breve durata. Il subprocesso si avvia
con la modalità permessi di Node abilitata, un ambiente vuoto, nessuna autorizzazione per filesystem o
rete e nessuna autorizzazione per processi figli o worker. OpenClaw impone un
timeout wall-clock nel processo padre e termina il subprocesso allo scadere del timeout, incluse
le continuazioni asincrone successive.

Il runtime espone solo:

- `console.log`, `console.warn` e `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Il normale comportamento di OpenClaw continua ad applicarsi alle chiamate finali:

- policy di autorizzazione e negazione degli strumenti
- restrizioni sugli strumenti per agente e per sandbox
- gating solo per proprietario
- hook di approvazione
- hook `before_tool_call` del plugin
- identità di sessione, log e telemetria

## Configurazione

Abilita la Ricerca strumenti per le esecuzioni PI con il bridge di codice predefinito:

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

Usa invece gli strumenti di fallback strutturati per le esecuzioni PI:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
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

La Ricerca strumenti registra telemetria sufficiente per confrontarla con l'esposizione diretta degli strumenti:

- byte totali serializzati di strumenti e prompt inviati all'harness
- dimensione del catalogo e suddivisione per sorgente
- conteggi di ricerca, descrizione e chiamata
- chiamate finali agli strumenti eseguite tramite OpenClaw
- id e sorgenti degli strumenti selezionati

I log di sessione dovrebbero rendere possibile rispondere a:

- quanti schemi di strumenti il modello ha visto in anticipo
- quante operazioni di ricerca e descrizione ha eseguito
- quale strumento finale è stato chiamato
- se il risultato proveniva da OpenClaw, MCP o da uno strumento client

## Validazione E2E

Il runner E2E del Gateway dimostra entrambi i percorsi con l'harness PI:

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

Crea un finto plugin temporaneo con un grande catalogo di strumenti, avvia il provider
OpenAI mock, avvia un Gateway una volta in modalità diretta e una volta con la Ricerca strumenti
abilitata, quindi confronta i payload delle richieste al provider e i log di sessione.

La regressione dimostra che:

1. La modalità diretta può chiamare lo strumento del finto plugin.
2. La Ricerca strumenti può chiamare lo stesso strumento del finto plugin.
3. La modalità diretta espone gli schemi degli strumenti del finto plugin direttamente al provider.
4. La Ricerca strumenti espone solo il bridge compatto.
5. Il payload della richiesta della Ricerca strumenti è più piccolo per il grande catalogo finto.
6. I log di sessione mostrano i conteggi attesi delle chiamate agli strumenti e la telemetria delle chiamate con bridge.

## Comportamento in caso di errore

La Ricerca strumenti dovrebbe fallire in modo chiuso:

- se uno strumento non è nella policy effettiva, la ricerca non dovrebbe restituirlo
- se uno strumento selezionato diventa non disponibile, `tool_call` dovrebbe fallire
- se la policy o l'approvazione blocca l'esecuzione, il risultato della chiamata dovrebbe riportare quel
  blocco invece di aggirarlo
- se il bridge di codice non può creare un runtime isolato, usa `mode: "tools"` oppure
  disabilita la Ricerca strumenti per quel deployment

## Correlati

- [Strumenti e plugin](/it/tools)
- [Sandbox multi-agente e strumenti](/it/tools/multi-agent-sandbox-tools)
- [Strumento exec](/it/tools/exec)
- [Configurazione degli agenti ACP](/it/tools/acp-agents-setup)
- [Creazione di plugin](/it/plugins/building-plugins)
