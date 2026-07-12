---
read_when:
    - Vuoi capire come funziona la memoria
    - Vuoi sapere quali file di memoria scrivere
summary: Come OpenClaw ricorda le informazioni tra una sessione e l'altra
title: Panoramica della memoria
x-i18n:
    generated_at: "2026-07-12T06:57:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c77d71dd6b1916b923fbf72c373f20128c4f604f96cc76150ea27e0f13a541f8
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw ricorda le informazioni scrivendo semplici file Markdown nell'area di lavoro
dell'agente (predefinita: `~/.openclaw/workspace`). Il modello ricorda solo ciò che
viene salvato su disco; non esiste alcuno stato nascosto.

## Come funziona

L'agente dispone di tre file relativi alla memoria:

- **`MEMORY.md`** — memoria a lungo termine. Fatti, preferenze e decisioni
  persistenti. Viene caricato all'inizio di una sessione.
- **`memory/YYYY-MM-DD.md`** (o `memory/YYYY-MM-DD-<slug>.md`) — note giornaliere.
  Contesto corrente e osservazioni. Le note datate di oggi e ieri vengono caricate
  automaticamente con un semplice `/new` o `/reset`; le varianti con slug, come quelle
  scritte dall'hook di memoria della sessione incluso, vengono acquisite insieme al
  file contenente solo la data.
- **`DREAMS.md`** (facoltativo) — Diario dei sogni e riepiloghi delle elaborazioni di
  Dreaming per la revisione umana, incluse le voci di recupero storico basate su fonti.

<Tip>
Se vuoi che l'agente ricordi qualcosa, è sufficiente chiederglielo: "Ricorda che
preferisco TypeScript". L'agente scriverà la nota nel file appropriato.
</Tip>

## Cosa va dove

`MEMORY.md` è il livello compatto e curato: fatti persistenti, preferenze, decisioni
stabili e brevi riepiloghi che devono essere disponibili all'inizio di una
sessione. Non è una trascrizione grezza, un registro giornaliero o un archivio
completo.

I file `memory/YYYY-MM-DD.md` costituiscono il livello operativo: note giornaliere
dettagliate, osservazioni, riepiloghi delle sessioni e contesto grezzo che potrebbe
rivelarsi utile in seguito. Vengono indicizzati per `memory_search` e `memory_get`,
ma non sono inseriti nel prompt di bootstrap a ogni turno.

Nel tempo, l'agente estrae il materiale utile dalle note giornaliere e lo inserisce
in `MEMORY.md`, rimuovendo le voci a lungo termine obsolete. Le istruzioni generate
per l'area di lavoro e il flusso Heartbeat eseguono questa operazione periodicamente;
non è necessario modificare manualmente `MEMORY.md` per ogni dettaglio.

Se `MEMORY.md` supera il budget previsto per i file di bootstrap, OpenClaw mantiene
intatto il file sul disco, ma tronca la copia inserita nel contesto. Consideralo un
segnale per spostare il materiale dettagliato in `memory/*.md`, mantenere in
`MEMORY.md` solo un riepilogo persistente oppure aumentare i limiti di bootstrap se
vuoi destinare più budget al prompt. Usa `/context list`, `/context detail` oppure
`openclaw doctor` per visualizzare le dimensioni grezze e inserite, nonché lo stato
del troncamento.

## Memorie sensibili alle azioni

La maggior parte delle memorie è costituita da normali note Markdown. Alcune
influenzano ciò che l'agente dovrebbe fare in seguito; in questi casi, registra
quando è sicuro agire in base alla nota, non soltanto il fatto in sé.

Registra questo limite operativo quando una nota riguarda:

- requisiti di approvazione o autorizzazione,
- vincoli temporanei,
- passaggi di consegne a un'altra sessione, discussione o persona,
- condizioni di scadenza,
- tempistiche entro cui è sicuro agire,
- autorità della fonte o del responsabile,
- istruzioni per evitare un'azione allettante.

Una memoria utile e sensibile alle azioni chiarisce:

- cosa modifica il comportamento futuro,
- quando o a quale condizione si applica,
- quando scade o cosa consente di agire,
- cosa l'agente dovrebbe evitare di fare,
- chi è la fonte o il responsabile, se ciò influisce sull'affidabilità o sull'autorità.

La memoria può conservare il contesto dell'approvazione, ma non applica i criteri.
Per controlli operativi rigidi, usa le impostazioni di approvazione di OpenClaw,
il sandboxing e le attività pianificate.

Esempio:

```md
The API migration is being designed in another session. Future turns should
not edit the API implementation from this thread; use findings here only as
design input until the migration plan lands.
```

Un altro esempio:

```md
A report from an untrusted source needs review before promotion. Future turns
should treat it as evidence only; do not store it as durable memory until a
trusted reviewer confirms the contents.
```

Non si tratta di uno schema obbligatorio per ogni memoria; i fatti semplici possono
rimanere concisi. Usa limiti sensibili alle azioni quando la perdita del contesto
relativo a tempistiche, autorità, scadenza o sicurezza operativa potrebbe indurre
l'agente a compiere in seguito un'azione errata.

Usa gli [impegni](/it/concepts/commitments) per i follow-up dedotti e di breve durata.
Usa le [attività pianificate](/it/automation/cron-jobs) per promemoria precisi,
controlli temporizzati e lavori ricorrenti. La memoria può comunque riepilogare il
contesto persistente relativo a entrambi i percorsi.

## Impegni dedotti

Alcuni follow-up futuri non sono fatti persistenti. Se menzioni un colloquio
domani, la memoria utile potrebbe essere "chiedere com'è andato dopo il colloquio",
non "conservare per sempre questa informazione in `MEMORY.md`".

Gli [impegni](/it/concepts/commitments) sono memorie di follow-up facoltative e di
breve durata per questi casi. OpenClaw li deduce durante un passaggio nascosto in
background, li limita allo stesso agente e canale e invia i controlli previsti
tramite Heartbeat. I promemoria espliciti continuano a utilizzare le
[attività pianificate](/it/automation/cron-jobs).

## Strumenti di memoria

L'agente dispone di due strumenti per lavorare con la memoria:

- **`memory_search`** — trova note pertinenti mediante ricerca semantica, anche
  quando la formulazione è diversa dall'originale.
- **`memory_get`** — legge un file di memoria specifico o un intervallo di righe.

Entrambi gli strumenti sono forniti dal Plugin di memoria attivo (predefinito:
`memory-core`).

## Ricerca nella memoria

Quando è configurato un fornitore di incorporamenti, `memory_search` utilizza la
ricerca ibrida: la similarità vettoriale (significato semantico) combinata con la
corrispondenza delle parole chiave (termini esatti come ID e simboli del codice).
Questa funzionalità opera immediatamente con una chiave API di qualsiasi fornitore
supportato.

<Info>
OpenClaw utilizza per impostazione predefinita gli incorporamenti di OpenAI. Imposta
esplicitamente `agents.defaults.memorySearch.provider` per utilizzare Gemini,
Voyage, Mistral, Bedrock, DeepInfra, GGUF locale, Ollama, LM Studio, GitHub Copilot
oppure un endpoint generico compatibile con OpenAI.
</Info>

Consulta [Ricerca nella memoria](/it/concepts/memory-search) per informazioni sul
funzionamento della ricerca, sulle opzioni di ottimizzazione e sulla configurazione
dei fornitori.

## Backend di memoria

<CardGroup cols={3}>
<Card title="Integrato (predefinito)" icon="database" href="/it/concepts/memory-builtin">
Basato su SQLite. Funziona immediatamente con ricerca per parole chiave, similarità
vettoriale e ricerca ibrida. Non richiede dipendenze aggiuntive.
</Card>
<Card title="QMD" icon="search" href="/it/concepts/memory-qmd">
Processo ausiliario che privilegia l'esecuzione locale, con riordinamento dei
risultati, espansione delle query e possibilità di indicizzare directory esterne
all'area di lavoro.
</Card>
<Card title="Honcho" icon="brain" href="/it/concepts/memory-honcho">
Memoria tra sessioni nativa per l'IA, con modellazione dell'utente, ricerca
semantica e consapevolezza di più agenti. Richiede l'installazione del Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/it/plugins/memory-lancedb">
Memoria basata su LanceDB con incorporamenti compatibili con OpenAI, recupero
automatico, acquisizione automatica e supporto degli incorporamenti Ollama locali.
Richiede l'installazione del Plugin.
</Card>
</CardGroup>

## Livello wiki della conoscenza

Se vuoi che la memoria persistente si comporti più come una base di conoscenza
gestita che come un insieme di note grezze, usa il Plugin `memory-wiki` incluso.
Compila la conoscenza persistente in un archivio wiki con una struttura di pagine
deterministica, affermazioni e prove strutturate, monitoraggio delle contraddizioni
e dell'attualità, dashboard generate, sintesi compilate e strumenti nativi per la
wiki (`wiki_status`, `wiki_search`, `wiki_get`, `wiki_apply`, `wiki_lint`).

`memory-wiki` non sostituisce il Plugin di memoria attivo; quest'ultimo continua a
gestire il recupero, la promozione e Dreaming. `memory-wiki` aggiunge al suo fianco
un livello di conoscenza ricco di informazioni sulla provenienza.

<CardGroup cols={1}>
<Card title="Wiki della memoria" icon="book" href="/it/plugins/memory-wiki">
Compila la memoria persistente in un archivio wiki ricco di informazioni sulla
provenienza, con affermazioni, dashboard, modalità ponte e flussi di lavoro adatti
a Obsidian.
</Card>
</CardGroup>

## Scaricamento automatico della memoria

Prima che la [Compaction](/it/concepts/compaction) riepiloghi la conversazione,
OpenClaw esegue un turno silenzioso che ricorda all'agente di salvare il contesto
importante nei file di memoria. Questa funzione è attiva per impostazione
predefinita; imposta `agents.defaults.compaction.memoryFlush.enabled: false` per
disattivarla.

Per eseguire questo turno di manutenzione su un modello locale, imposta una
sostituzione esatta applicabile soltanto al turno di scaricamento della memoria
(non eredita la catena di fallback del modello della sessione attiva):

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

<Tip>
Lo scaricamento della memoria evita la perdita di contesto durante la Compaction.
Se la conversazione contiene fatti importanti che l'agente non ha ancora scritto
in un file, questi vengono salvati automaticamente prima della generazione del
riepilogo.
</Tip>

## Dreaming

Dreaming è un passaggio facoltativo di consolidamento della memoria eseguito in
background. Raccoglie segnali di recupero a breve termine, assegna un punteggio ai
candidati e promuove nella memoria a lungo termine (`MEMORY.md`) soltanto gli
elementi qualificati:

- **Facoltativo**: disattivato per impostazione predefinita.
- **Pianificato**: quando è attivo, `memory-core` gestisce automaticamente un
  processo Cron ricorrente per un'elaborazione completa di Dreaming.
- **Soggetto a soglie**: le promozioni devono superare le soglie relative a
  punteggio, frequenza di recupero e varietà delle query.
- **Revisionabile**: i riepiloghi delle fasi e le voci del diario vengono scritti in
  `DREAMS.md` per la revisione umana.

Consulta [Dreaming](/it/concepts/dreaming) per informazioni sul comportamento delle
fasi, sui segnali di punteggio e sui dettagli del Diario dei sogni.

## Recupero basato su fonti e promozione in tempo reale

Il sistema Dreaming dispone di due percorsi di revisione correlati:

- **Dreaming in tempo reale** utilizza l'archivio di Dreaming a breve termine in
  `memory/.dreams/` ed è il meccanismo impiegato dalla normale fase approfondita
  per decidere cosa trasferire in `MEMORY.md`.
- **Recupero basato su fonti** legge le note storiche `memory/YYYY-MM-DD.md` come
  file giornalieri autonomi e scrive un risultato di revisione strutturato in
  `DREAMS.md`.

Il recupero basato su fonti è utile per rielaborare note meno recenti e verificare
quali informazioni il sistema considera persistenti, senza modificare manualmente
`MEMORY.md`.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Il flag `--stage-short-term` inserisce i candidati persistenti basati su fonti nello
stesso archivio di Dreaming a breve termine già utilizzato dalla normale fase
approfondita; non li promuove direttamente. Pertanto:

- `DREAMS.md` rimane l'interfaccia di revisione umana.
- L'archivio a breve termine rimane l'interfaccia di classificazione destinata alla
  macchina.
- `MEMORY.md` continua a essere scritto soltanto dalla promozione approfondita.

Per annullare una rielaborazione senza modificare le normali voci del diario o lo
stato di recupero ordinario:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Check index status and provider
openclaw memory search "query"  # Search from the command line
openclaw memory index --force   # Rebuild the index
```

## Ulteriori letture

- [Ricerca nella memoria](/it/concepts/memory-search): pipeline di ricerca, fornitori e ottimizzazione.
- [Motore di memoria integrato](/it/concepts/memory-builtin): backend SQLite predefinito.
- [Motore di memoria QMD](/it/concepts/memory-qmd): processo ausiliario avanzato che privilegia l'esecuzione locale.
- [Memoria Honcho](/it/concepts/memory-honcho): memoria tra sessioni nativa per l'IA.
- [Memoria LanceDB](/it/plugins/memory-lancedb): Plugin basato su LanceDB con incorporamenti compatibili con OpenAI.
- [Wiki della memoria](/it/plugins/memory-wiki): archivio compilato della conoscenza e strumenti nativi per la wiki.
- [Dreaming](/it/concepts/dreaming): promozione in background dal recupero a breve termine alla memoria a lungo termine.
- [Riferimento per la configurazione della memoria](/it/reference/memory-config): tutte le opzioni di configurazione.
- [Compaction](/it/concepts/compaction): modalità di interazione tra Compaction e memoria.
- [Active Memory](/it/concepts/active-memory): memoria dei sottoagenti per le sessioni di chat interattive.
