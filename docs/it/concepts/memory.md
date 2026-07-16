---
read_when:
    - Si desidera comprendere come funziona la memoria
    - Si desidera sapere quali file di memoria scrivere
summary: Come OpenClaw ricorda le informazioni tra le sessioni
title: Panoramica della memoria
x-i18n:
    generated_at: "2026-07-16T14:08:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 22542c5df22f1602c89bae05760a5418224d8ee1f1a73679203dec9b2f091f2a
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw ricorda le informazioni scrivendo semplici file Markdown nell'area di lavoro
dell'agente (predefinita: `~/.openclaw/workspace`). Il modello ricorda solo ciò che viene
salvato su disco; non esiste alcuno stato nascosto.

## Come funziona

L'agente dispone di tre file relativi alla memoria:

- **`MEMORY.md`** — memoria a lungo termine. Fatti persistenti, preferenze e
  decisioni. Caricato all'inizio di una sessione.
- **`memory/YYYY-MM-DD.md`** (o `memory/YYYY-MM-DD-<slug>.md`) — note giornaliere.
  Contesto corrente e osservazioni. Le note datate di oggi e ieri vengono caricate
  automaticamente con un semplice `/new` o `/reset`; le varianti con slug, come quelle
  scritte dall'hook di memoria della sessione incluso, vengono recuperate insieme al
  file contenente solo la data.
- **`DREAMS.md`** (facoltativo) — Diario dei sogni e riepiloghi delle elaborazioni di Dreaming per
  la revisione umana, incluse le voci di recupero storico basate su dati verificabili.

<Tip>
Per fare in modo che l'agente ricordi qualcosa, è sufficiente chiederglielo: "Ricorda che
preferisco TypeScript". L'agente scriverà la nota nel file appropriato.
</Tip>

## Dove vengono memorizzate le informazioni

`MEMORY.md` è il livello compatto e curato: fatti persistenti, preferenze, decisioni
permanenti e brevi riepiloghi che devono essere disponibili all'inizio di una
sessione. Non è una trascrizione non elaborata, un registro giornaliero o un archivio completo.

I file `memory/YYYY-MM-DD.md` costituiscono il livello operativo: note giornaliere dettagliate,
osservazioni, riepiloghi delle sessioni e contesto non elaborato che potrebbe essere ancora utile
in seguito. Vengono indicizzati per `memory_search` e `memory_get`, ma non vengono
inseriti nel prompt di bootstrap a ogni turno.

Nel tempo, l'agente ricava materiale utile dalle note giornaliere e lo trasferisce in
`MEMORY.md`, rimuovendo le voci obsolete della memoria a lungo termine. Le istruzioni
generate per l'area di lavoro e il flusso Heartbeat eseguono periodicamente questa operazione; non è necessario
modificare manualmente `MEMORY.md` per ogni dettaglio.

Se `MEMORY.md` supera il limite previsto per i file di bootstrap, OpenClaw mantiene intatto il file
sul disco, ma tronca la copia inserita nel contesto. Questo indica che è opportuno spostare il materiale
dettagliato in `memory/*.md`, mantenere solo un riepilogo persistente
in `MEMORY.md` oppure aumentare i limiti di bootstrap se si desidera utilizzare una porzione maggiore
del budget del prompt. Usare `/context list`, `/context detail` o `openclaw doctor` per
visualizzare le dimensioni non elaborate e inserite, nonché lo stato del troncamento.

## Importazione dagli assistenti di programmazione

L'interfaccia di controllo può importare la memoria locale esistente da Codex e Claude Code.
Aprire **Settings** → **Import Memory**, scegliere l'agente di destinazione, esaminare i
file rilevati e confermare l'importazione. OpenClaw copia solo la memoria Markdown:

- Codex: i file consolidati `MEMORY.md` e `memory_summary.md` in
  `~/.codex/memories` (o `CODEX_HOME/memories`). I file delle esecuzioni non elaborate e delle trascrizioni
  non vengono importati.
- Claude Code: i file Markdown provenienti dalla directory della memoria automatica di ogni progetto in
  `~/.claude/projects/*/memory`, oltre a un file
  `autoMemoryDirectory` configurato dall'utente, se presente. Le istruzioni del progetto, le sessioni, le impostazioni
  e le credenziali non fanno parte di questa operazione limitata alla memoria.

I file importati rimangono separati in `memory/imports/codex/` e
`memory/imports/claude-code/` nell'area di lavoro dell'agente selezionato. Vengono indicizzati
per `memory_search` e sono disponibili tramite `memory_get`; non vengono uniti al
file `MEMORY.md` di bootstrap dell'agente. I file di origine rimangono invariati.

L'anteprima segnala i conflitti nella destinazione. Abilitare **Replace existing imports** per
sostituire tali file; l'applicazione crea un backup verificato precedente all'importazione e conserva
copie a livello di singolo elemento dei file sovrascritti nel rapporto di migrazione.

## Memorie sensibili alle azioni

La maggior parte delle memorie è costituita da normali note Markdown. Alcune influenzano ciò che l'agente dovrebbe
fare in seguito; in questi casi, occorre registrare quando è sicuro agire in base alla nota, non soltanto il
fatto stesso.

Registrare questo limite operativo quando una nota riguarda:

- requisiti di approvazione o autorizzazione,
- vincoli temporanei,
- passaggi di consegne a un'altra sessione, discussione o persona,
- condizioni di scadenza,
- tempistiche in cui è sicuro agire,
- autorità della fonte o del proprietario,
- istruzioni per evitare un'azione allettante.

Una memoria utile e sensibile alle azioni chiarisce:

- che cosa modifica il comportamento futuro,
- quando o a quale condizione si applica,
- quando scade o che cosa consente di agire,
- che cosa l'agente dovrebbe evitare di fare,
- chi è la fonte o il proprietario, se ciò influisce sull'affidabilità o sull'autorità.

La memoria può conservare il contesto dell'approvazione, ma non applica le regole. Per i
controlli operativi rigidi, usare le impostazioni di approvazione di OpenClaw, il sandboxing e le attività pianificate.

Esempio:

```md
La migrazione dell'API è in fase di progettazione in un'altra sessione. I turni futuri non devono
modificare l'implementazione dell'API da questa discussione; usare i risultati qui presenti solo come
dati di progettazione finché il piano di migrazione non viene adottato.
```

Altro esempio:

```md
Un rapporto proveniente da una fonte non attendibile deve essere esaminato prima della promozione. I turni futuri
devono trattarlo solo come prova; non memorizzarlo come memoria persistente finché un
revisore attendibile non ne conferma il contenuto.
```

Questo schema non è obbligatorio per ogni memoria; i fatti semplici possono rimanere concisi.
Usare limiti sensibili alle azioni quando la perdita di informazioni su tempistiche, autorità, scadenza o
condizioni in cui è sicuro agire potrebbe indurre l'agente a compiere in seguito un'azione errata.

Usare gli [impegni](/it/concepts/commitments) per le attività successive dedotte e di breve durata.
Usare le [attività pianificate](/it/automation/cron-jobs) per promemoria precisi, controlli temporizzati
e attività ricorrenti. La memoria può comunque riepilogare il contesto persistente relativo
a entrambi i percorsi.

## Impegni dedotti

Alcune attività successive future non sono fatti persistenti. Se viene menzionato un colloquio
domani, la memoria utile potrebbe essere "chiedere aggiornamenti dopo il colloquio", non "memorizzare
questa informazione per sempre in `MEMORY.md`".

Gli [impegni](/it/concepts/commitments) sono memorie facoltative e di breve durata per le attività successive
in casi simili. OpenClaw li deduce in un passaggio nascosto in background,
li limita allo stesso agente e canale e invia i controlli dovuti tramite
Heartbeat. I promemoria espliciti continuano a usare le [attività pianificate](/it/automation/cron-jobs).

## Strumenti di memoria

L'agente dispone di due strumenti per lavorare con la memoria:

- **`memory_search`** — trova note pertinenti mediante la ricerca semantica, anche quando
  la formulazione differisce dall'originale.
- **`memory_get`** — legge un file di memoria specifico o un intervallo di righe.

Entrambi gli strumenti vengono forniti dal Plugin di memoria attivo (predefinito: `memory-core`).

## Ricerca nella memoria

Quando è configurato un provider di incorporamenti, `memory_search` usa la ricerca ibrida:
somiglianza vettoriale (significato semantico) combinata con la corrispondenza per parola chiave (termini
esatti come ID e simboli di codice). Funziona immediatamente con una chiave API
per qualsiasi provider supportato.

<Info>
OpenClaw utilizza gli incorporamenti OpenAI per impostazione predefinita. Impostare
esplicitamente `agents.defaults.memorySearch.provider` per usare Gemini, Voyage,
Mistral, Bedrock, DeepInfra, GGUF locale, Ollama, LM Studio, GitHub Copilot o
un endpoint generico compatibile con OpenAI.
</Info>

Consultare [Ricerca nella memoria](/it/concepts/memory-search) per informazioni sul funzionamento della ricerca, sulle opzioni
di regolazione e sulla configurazione dei provider.

## Backend di memoria

<CardGroup cols={3}>
<Card title="Integrato (predefinito)" icon="database" href="/it/concepts/memory-builtin">
Basato su SQLite. Funziona immediatamente con ricerca per parola chiave, somiglianza vettoriale e
ricerca ibrida. Nessuna dipendenza aggiuntiva.
</Card>
<Card title="QMD" icon="search" href="/it/concepts/memory-qmd">
Sidecar con priorità all'esecuzione locale, dotato di riordinamento, espansione delle query e possibilità di indicizzare
directory esterne all'area di lavoro.
</Card>
<Card title="Honcho" icon="brain" href="/it/concepts/memory-honcho">
Memoria tra sessioni nativa per l'IA, con modellazione dell'utente, ricerca semantica e
consapevolezza multi-agente. Installazione del Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/it/plugins/memory-lancedb">
Memoria basata su LanceDB con incorporamenti compatibili con OpenAI, richiamo automatico,
acquisizione automatica e supporto per gli incorporamenti Ollama locali. Installazione del Plugin.
</Card>
</CardGroup>

## Livello wiki della conoscenza

Per fare in modo che la memoria persistente si comporti più come una base di conoscenza sottoposta a manutenzione
che come note non elaborate, usare il Plugin `memory-wiki` incluso. Questo compila la conoscenza persistente
in un archivio wiki con struttura deterministica delle pagine, affermazioni e prove
strutturate, monitoraggio delle contraddizioni e dell'aggiornamento, dashboard generate,
sintesi compilate e strumenti nativi per wiki (`wiki_status`,
`wiki_search`, `wiki_get`, `wiki_apply`, `wiki_lint`).

`memory-wiki` non sostituisce il Plugin di memoria attivo; il Plugin di memoria
attivo continua a gestire il richiamo, la promozione e Dreaming. `memory-wiki` aggiunge
al suo fianco un livello di conoscenza ricco di informazioni sulla provenienza.

<CardGroup cols={1}>
<Card title="Wiki della memoria" icon="book" href="/it/plugins/memory-wiki">
Compila la memoria persistente in un archivio wiki ricco di informazioni sulla provenienza, con affermazioni,
dashboard, modalità bridge e flussi di lavoro compatibili con Obsidian.
</Card>
</CardGroup>

## Scaricamento automatico della memoria

Prima che la [Compaction](/it/concepts/compaction) riepiloghi la conversazione,
OpenClaw esegue un turno silenzioso che ricorda all'agente di salvare il contesto importante
nei file di memoria. Questa funzionalità è attiva per impostazione predefinita; impostare
`agents.defaults.compaction.memoryFlush.enabled: false` per disattivarla.

Per mantenere questo turno di gestione su un modello locale, impostare una sostituzione esatta che
si applichi soltanto al turno di scaricamento della memoria (non eredita la catena di fallback
del modello della sessione attiva):

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
Lo scaricamento della memoria evita la perdita di contesto durante la Compaction. Se l'agente dispone
di fatti importanti nella conversazione che non sono ancora stati scritti in un file, questi
vengono salvati automaticamente prima della generazione del riepilogo.
</Tip>

## Dreaming

Dreaming è un passaggio facoltativo di consolidamento della memoria in background. Raccoglie
segnali di richiamo a breve termine, assegna un punteggio ai candidati e promuove nella memoria
a lungo termine (`MEMORY.md`) solo gli elementi idonei:

- **Facoltativo**: disabilitato per impostazione predefinita.
- **Pianificato**: quando è abilitato, `memory-core` gestisce automaticamente un processo Cron
  ricorrente per un'elaborazione completa di Dreaming.
- **Soggetto a soglie**: le promozioni devono superare le soglie relative al punteggio, alla frequenza di richiamo e
  alla diversità delle query.
- **Revisionabile**: i riepiloghi delle fasi e le voci del diario vengono scritti in
  `DREAMS.md` per la revisione umana.

Consultare [Dreaming](/it/concepts/dreaming) per il comportamento delle fasi, i segnali di punteggio e i
dettagli del Diario dei sogni.

## Recupero basato su dati verificabili e promozione in tempo reale

Il sistema Dreaming dispone di due percorsi di revisione correlati:

- **Dreaming in tempo reale** opera sull'archivio Dreaming a breve termine in
  `memory/.dreams/` ed è il meccanismo utilizzato dalla normale fase approfondita per decidere quali elementi
  vengono trasferiti in `MEMORY.md`.
- **Recupero basato su dati verificabili** legge le note storiche `memory/YYYY-MM-DD.md` come
  file giornalieri autonomi e scrive l'output strutturato della revisione in `DREAMS.md`.

Il recupero basato su dati verificabili è utile per riprodurre note meno recenti e verificare ciò che il
sistema considera persistente, senza modificare manualmente `MEMORY.md`.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Il flag `--stage-short-term` inserisce i candidati persistenti basati su dati verificabili nello stesso
archivio Dreaming a breve termine già usato dalla normale fase approfondita; non li
promuove direttamente. Pertanto:

- `DREAMS.md` rimane l'interfaccia per la revisione umana.
- L'archivio a breve termine rimane l'interfaccia di classificazione destinata alla macchina.
- `MEMORY.md` viene comunque scritto soltanto dalla promozione approfondita.

Per annullare una riproduzione senza modificare le normali voci del diario o lo stato di richiamo
ordinario:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Controlla lo stato dell'indice e il provider
openclaw memory search "query"  # Cerca dalla riga di comando
openclaw memory index --force   # Ricostruisce l'indice
```

## Ulteriori letture

- [Ricerca nella memoria](/it/concepts/memory-search): pipeline di ricerca, provider e ottimizzazione.
- [Motore di memoria integrato](/it/concepts/memory-builtin): backend SQLite predefinito.
- [Motore di memoria QMD](/it/concepts/memory-qmd): sidecar avanzato con approccio local-first.
- [Memoria Honcho](/it/concepts/memory-honcho): memoria nativa per l'IA tra sessioni diverse.
- [Memoria LanceDB](/it/plugins/memory-lancedb): Plugin basato su LanceDB con incorporamenti compatibili con OpenAI.
- [Wiki della memoria](/it/plugins/memory-wiki): archivio di conoscenze compilato e strumenti nativi per wiki.
- [Dreaming](/it/concepts/dreaming): promozione in background dal richiamo a breve termine alla memoria a lungo termine.
- [Riferimento per la configurazione della memoria](/it/reference/memory-config): tutte le opzioni di configurazione.
- [Compaction](/it/concepts/compaction): come la compattazione interagisce con la memoria.
- [Active Memory](/it/concepts/active-memory): memoria dei sottoagenti per le sessioni di chat interattive.
