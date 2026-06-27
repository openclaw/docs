---
read_when:
    - Modifica del testo del prompt di sistema, dell'elenco degli strumenti o delle sezioni relative a tempo/Heartbeat
    - Modifica del comportamento di bootstrap dell'area di lavoro o di injection delle Skills
summary: Cosa contiene il prompt di sistema di OpenClaw e come viene assemblato
title: Prompt di sistema
x-i18n:
    generated_at: "2026-06-27T17:28:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31321b4df7494317b73c2a5609b1dc275463168ed5fe20ecb173e9bec76717cc
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw crea un prompt di sistema personalizzato per ogni esecuzione dell'agente. Il prompt è **di proprietà di OpenClaw** e non usa un prompt predefinito di runtime.

Il prompt viene assemblato da OpenClaw e iniettato in ogni esecuzione dell'agente.

L'assemblaggio del prompt ha tre livelli:

- `buildAgentSystemPrompt` genera il prompt da input espliciti. Deve
  restare un renderer puro e non deve leggere direttamente la configurazione globale.
- `resolveAgentSystemPromptConfig` risolve le opzioni del prompt basate sulla configurazione, come
  visualizzazione del proprietario, suggerimenti TTS, alias dei modelli, modalità di citazione della memoria e modalità di
  delega dei sotto-agenti per un agente specifico.
- Gli adattatori di runtime (embedded, CLI, anteprime comando/esportazione, Compaction) raccolgono
  fatti live come strumenti, stato della sandbox, capacità del canale, file di contesto
  e contributi al prompt del provider, quindi chiamano la facade del prompt configurata.

Questo mantiene le superfici di prompt esportate/di debug allineate con le esecuzioni live senza
trasformare ogni dettaglio specifico del runtime in un unico builder monolitico.

I Plugin provider possono contribuire con indicazioni per il prompt attente alla cache senza sostituire
l'intero prompt di proprietà di OpenClaw. Il runtime del provider può:

- sostituire un piccolo insieme di sezioni core con nome (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- iniettare un **prefisso stabile** sopra il limite della cache del prompt
- iniettare un **suffisso dinamico** sotto il limite della cache del prompt

Usa i contributi di proprietà del provider per la regolazione specifica della famiglia di modelli. Mantieni la
mutazione legacy del prompt `before_prompt_build` per compatibilità o modifiche davvero globali del prompt,
non per il normale comportamento del provider.

L'overlay della famiglia OpenAI GPT-5 mantiene piccola la regola di esecuzione core e aggiunge
indicazioni specifiche del modello per aggancio della persona, output conciso, disciplina degli strumenti,
ricerca parallela, copertura dei deliverable, verifica, contesto mancante e
igiene degli strumenti da terminale.

## Struttura

Il prompt è volutamente compatto e usa sezioni fisse:

- **Strumenti**: promemoria sulla fonte di verità degli strumenti strutturati più indicazioni runtime sull'uso degli strumenti.
- **Bias di esecuzione**: indicazioni compatte di completamento: agire nel turno sulle
  richieste azionabili, continuare finché completato o bloccato, recuperare da risultati deboli degli strumenti,
  controllare live lo stato mutabile e verificare prima di finalizzare.
- **Sicurezza**: breve promemoria di guardrail per evitare comportamenti di ricerca di potere o l'elusione della supervisione.
- **Skills** (quando disponibili): indica al modello come caricare le istruzioni delle skill su richiesta.
- **Controllo OpenClaw**: indica al modello di preferire lo strumento `gateway` per
  configurazione/riavvio e di evitare di inventare comandi CLI.
- **Auto-aggiornamento OpenClaw**: come ispezionare la configurazione in sicurezza con
  `config.schema.lookup`, applicare patch alla configurazione con `config.patch`, sostituire l'intera
  configurazione con `config.apply` ed eseguire `update.run` solo su richiesta esplicita dell'utente.
  Anche lo strumento `gateway` rivolto all'agente rifiuta di riscrivere
  `tools.exec.ask` / `tools.exec.security`, inclusi gli alias legacy `tools.bash.*`
  che si normalizzano in quei percorsi exec protetti.
- **Workspace**: directory di lavoro (`agents.defaults.workspace`).
- **Documentazione**: percorso locale alla documentazione/sorgente di OpenClaw e quando leggerla.
- **File del workspace (iniettati)**: indica che i file bootstrap sono inclusi sotto.
- **Sandbox** (quando abilitata): indica runtime in sandbox, percorsi della sandbox e se è disponibile exec elevato.
- **Data e ora correnti**: solo fuso orario (stabile in cache; l'orologio live proviene da `session_status`).
- **Direttive di output dell'assistente**: sintassi compatta per allegati, note vocali e tag di risposta.
- **Heartbeats**: prompt Heartbeat e comportamento di ack, quando gli Heartbeat sono abilitati per l'agente predefinito.
- **Runtime**: host, OS, node, modello, radice del repo (quando rilevata), livello di ragionamento (una riga).
- **Ragionamento**: livello di visibilità corrente + suggerimento toggle /reasoning.

OpenClaw mantiene i contenuti stabili di grandi dimensioni, incluso **Contesto del progetto**, sopra il
limite interno della cache del prompt. Le sezioni volatili di canale/sessione, come
le indicazioni embed della Control UI, **Messaggistica**, **Voce**, **Contesto chat di gruppo**,
**Reazioni**, **Heartbeats** e **Runtime**, vengono aggiunte sotto quel limite
così i backend locali con cache di prefisso possono riutilizzare il prefisso stabile del workspace
tra i turni del canale. Anche le descrizioni degli strumenti dovrebbero evitare di incorporare nomi di
canale correnti quando lo schema accettato contiene già quel dettaglio di runtime.

La sezione Strumenti include anche indicazioni runtime per lavori di lunga durata:

- usa Cron per follow-up futuri (`check back later`, promemoria, lavoro ricorrente)
  invece di cicli sleep con `exec`, trucchi di ritardo `yieldMs` o polling ripetuto di `process`
- usa `exec` / `process` solo per comandi che iniziano ora e continuano a essere eseguiti
  in background
- quando il risveglio automatico al completamento è abilitato, avvia il comando una sola volta e affidati al
  percorso di risveglio push-based quando emette output o fallisce
- usa `process` per log, stato, input o intervento quando devi
  ispezionare un comando in esecuzione
- se l'attività è più grande, preferisci `sessions_spawn`; il completamento dei sotto-agenti è
  push-based e si auto-annuncia al richiedente
- non fare polling di `subagents list` / `sessions_list` in un ciclo solo per attendere
  il completamento

`agents.defaults.subagents.delegationMode` può rafforzare queste indicazioni. La
modalità predefinita `suggest` mantiene il suggerimento di base. `prefer` aggiunge una sezione dedicata
**Delega ai sotto-agenti** che indica all'agente principale di agire come coordinatore reattivo
e inoltrare qualsiasi cosa più complessa di una risposta diretta tramite
`sessions_spawn`. Questo riguarda solo il prompt; la policy degli strumenti controlla comunque se
`sessions_spawn` è disponibile.

Quando lo strumento sperimentale `update_plan` è abilitato, Strumenti indica anche al
modello di usarlo solo per lavoro multi-step non banale, mantenere esattamente un passaggio
`in_progress` ed evitare di ripetere l'intero piano dopo ogni aggiornamento.

I guardrail di sicurezza nel prompt di sistema sono consultivi. Guidano il comportamento del modello ma non applicano policy. Usa policy degli strumenti, approvazioni exec, sandboxing e allowlist dei canali per l'applicazione rigida; gli operatori possono disabilitarli per progettazione.

Sui canali con schede/pulsanti di approvazione nativi, il prompt di runtime ora indica
all'agente di affidarsi prima a quella UI di approvazione nativa. Deve includere un comando manuale
`/approve` solo quando il risultato dello strumento dice che le approvazioni via chat non sono disponibili o che
l'approvazione manuale è l'unico percorso.

## Modalità del prompt

OpenClaw può generare prompt di sistema più piccoli per i sotto-agenti. Il runtime imposta un
`promptMode` per ogni esecuzione (non una configurazione visibile all'utente):

- `full` (predefinita): include tutte le sezioni sopra.
- `minimal`: usata per i sotto-agenti; omette **Richiamo memoria**, **Auto-aggiornamento OpenClaw**,
  **Alias dei modelli**, **Identità utente**, **Direttive di output dell'assistente**,
  **Messaggistica**, **Risposte silenziose** e **Heartbeats**. Strumenti, **Sicurezza**,
  **Skills** quando fornite, Workspace, Sandbox, Data e ora correnti (quando
  note), Runtime e contesto iniettato restano disponibili.
- `none`: restituisce solo la riga di identità di base.

Quando `promptMode=minimal`, i prompt extra iniettati sono etichettati **Contesto sotto-agente**
invece di **Contesto chat di gruppo**.

Per le esecuzioni di risposta automatica del canale, OpenClaw omette la sezione generica **Risposte silenziose**
quando il contesto diretto, di gruppo o solo tramite strumento di messaggio possiede il contratto di risposta visibile.
Solo la vecchia modalità automatica di gruppo/canale dovrebbe mostrare `NO_REPLY`; le chat dirette
e le risposte solo tramite strumento di messaggio non ricevono indicazioni sul token silenzioso.

## Snapshot del prompt

OpenClaw mantiene snapshot del prompt versionati per il percorso felice del runtime Codex sotto
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Generano
parametri selezionati di thread/turno dell'app-server più uno stack di livelli prompt associato al modello ricostruito
per turni diretti Telegram, gruppi Discord e Heartbeat. Quello stack
include una fixture del prompt del modello Codex `gpt-5.5` fissata generata dalla forma
catalogo/cache dei modelli di Codex, il testo developer dei permessi del percorso felice Codex,
le istruzioni developer di OpenClaw, le istruzioni collaboration-mode con ambito di turno
quando OpenClaw le fornisce, l'input del turno utente e riferimenti alle specifiche dinamiche degli strumenti.

Aggiorna la fixture del prompt del modello Codex fissata con
`pnpm prompt:snapshots:sync-codex-model`. Per impostazione predefinita, lo script cerca
la cache runtime di Codex in `$CODEX_HOME/models_cache.json`, poi in
`~/.codex/models_cache.json` e solo dopo ripiega sulla convenzione del checkout Codex del maintainer
in `~/code/codex/codex-rs/models-manager/models.json`. Se
nessuna di queste sorgenti esiste, il comando termina senza modificare la fixture
versionata. Passa `--catalog <path>` per aggiornare da un file `models_cache.json`
o `models.json` specifico.

Questi snapshot non sono ancora una cattura raw byte per byte della richiesta OpenAI. Codex
può aggiungere contesto del workspace di proprietà del runtime, come `AGENTS.md`, contesto
dell'ambiente, memorie, istruzioni di app/plugin e istruzioni collaboration-mode
Default integrate dentro il runtime Codex dopo che OpenClaw invia
i parametri di thread e turno.

Rigenerali con `pnpm prompt:snapshots:gen` e verifica la deriva con
`pnpm prompt:snapshots:check`. La CI esegue il controllo della deriva nello shard
boundary aggiuntivo così le modifiche al prompt e gli aggiornamenti degli snapshot restano collegati alla stessa
PR.

## Iniezione bootstrap del workspace

I file bootstrap vengono risolti dal workspace attivo, poi instradati alla
superficie del prompt che corrisponde alla loro durata:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo su workspace nuovissimi)
- `MEMORY.md` quando presente

Sull'harness Codex nativo, OpenClaw evita di ripetere i file stabili del workspace
in ogni turno utente. Codex carica `AGENTS.md` tramite la propria scoperta dei documenti
di progetto. `SOUL.md`, `IDENTITY.md`, `TOOLS.md` e `USER.md` vengono inoltrati come
istruzioni developer Codex. Anche l'elenco compatto delle Skills di OpenClaw viene inoltrato
come istruzioni developer di collaborazione con ambito di turno. Il contenuto di `HEARTBEAT.md`
non viene iniettato; i turni Heartbeat ricevono una nota collaboration-mode che punta al file
quando esiste e non è vuoto. Il contenuto di `MEMORY.md` dal workspace dell'agente configurato
non viene incollato in ogni turno Codex nativo; quando gli strumenti di memoria sono
disponibili per quel workspace, i turni Codex ricevono una piccola nota sulla memoria del workspace nelle
istruzioni developer di collaborazione con ambito di turno e dovrebbero usare `memory_search`
o `memory_get` quando la memoria durevole è rilevante. Se gli strumenti sono disabilitati, la ricerca
di memoria non è disponibile o il workspace attivo differisce dal workspace di memoria dell'agente,
`MEMORY.md` ricade nel normale percorso di contesto del turno delimitato. Il contenuto attivo di
`BOOTSTRAP.md` mantiene per ora il normale ruolo di contesto del turno.

Sugli harness non Codex, i file bootstrap continuano a essere composti nel
prompt OpenClaw secondo i loro gate esistenti. `HEARTBEAT.md` viene omesso nelle
esecuzioni normali quando gli Heartbeat sono disabilitati per l'agente predefinito o
`agents.defaults.heartbeat.includeSystemPromptSection` è false. Mantieni concisi i file
iniettati, specialmente `MEMORY.md` non Codex. `MEMORY.md` è pensato per restare
un riepilogo curato a lungo termine; le note giornaliere dettagliate appartengono a `memory/*.md`, dove
`memory_search` e `memory_get` possono recuperarle su richiesta. File
`MEMORY.md` non Codex sovradimensionati aumentano l'uso del prompt e possono essere iniettati parzialmente
a causa dei limiti dei file bootstrap sotto.

<Note>
I file giornalieri `memory/*.md` **non** fanno parte del normale Contesto del progetto bootstrap. Nei turni ordinari vengono accessi su richiesta tramite gli strumenti `memory_search` e `memory_get`, quindi non contano nella finestra di contesto a meno che il modello non li legga esplicitamente. I turni `/new` e `/reset` nudi sono l'eccezione: il runtime può anteporre memoria giornaliera recente come blocco di contesto di avvio una tantum per quel primo turno.
</Note>

I file di grandi dimensioni vengono troncati con un marcatore. La dimensione massima per file è controllata da
`agents.defaults.bootstrapMaxChars` (predefinito: 20000). Il contenuto bootstrap
totale iniettato tra i file è limitato da `agents.defaults.bootstrapTotalMaxChars`
(predefinito: 60000). I file mancanti iniettano un breve marcatore di file mancante. Quando si verifica il troncamento,
OpenClaw può iniettare un avviso conciso nel prompt di sistema; controllalo con
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
predefinito: `always`). I conteggi grezzi/iniettati dettagliati restano nella diagnostica, ad esempio
`/context`, `/status`, doctor e log.

Per i file di memoria, il troncamento non è perdita di dati: il file resta integro sul disco.
Su Codex nativo, `MEMORY.md` viene letto su richiesta tramite gli strumenti di memoria quando
disponibili, con fallback del prompt limitato quando gli strumenti non possono essere eseguiti. Sugli altri
harness, il modello vede solo la copia iniettata abbreviata finché non legge o
cerca direttamente nella memoria. Se `MEMORY.md` viene troncato ripetutamente lì, distillalo
in un riepilogo durevole più breve e sposta la cronologia dettagliata in `memory/*.md`,
oppure aumenta intenzionalmente i limiti di bootstrap.

Le sessioni dei sotto-agenti iniettano solo `AGENTS.md` e `TOOLS.md` (gli altri file di bootstrap
vengono filtrati per mantenere piccolo il contesto del sotto-agente).

Gli hook interni possono intercettare questo passaggio tramite `agent:bootstrap` per modificare o sostituire
i file di bootstrap iniettati (ad esempio sostituendo `SOUL.md` con una persona alternativa).

Se vuoi rendere il tono dell'agente meno generico, inizia da
[Guida alla personalità SOUL.md](/it/concepts/soul).

Per controllare quanto contribuisce ciascun file iniettato (grezzo rispetto a iniettato, troncamento, più overhead dello schema degli strumenti), usa `/context list` o `/context detail`. Vedi [Contesto](/it/concepts/context).

## Gestione del tempo

Il prompt di sistema include una sezione dedicata **Data e ora correnti** quando il
fuso orario dell'utente è noto. Per mantenere stabile la cache del prompt, ora include solo
il **fuso orario** (nessun orologio dinamico o formato dell'ora).

Usa `session_status` quando l'agente ha bisogno dell'ora corrente; la scheda di stato
include una riga con timestamp. Lo stesso strumento può facoltativamente impostare un override del modello
per sessione (`model=default` lo cancella).

Configura con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Vedi [Data e ora](/it/date-time) per i dettagli completi sul comportamento.

## Skills

Quando esistono Skills idonee, OpenClaw inietta un elenco compatto di **Skills disponibili**
(`formatSkillsForPrompt`) che include il **percorso del file** e il marcatore
`<version>` derivato dal contenuto per ciascuna skill. Il prompt istruisce il modello a usare `read`
per caricare il file SKILL.md nella posizione elencata (workspace, gestita o incorporata),
e a rileggere una skill quando il suo `<version>` differisce da un turno precedente. Se nessuna
Skills è idonea, la sezione Skills viene omessa.

I turni di Codex nativo ricevono questo elenco come istruzioni developer di collaborazione con ambito di turno
invece che come input utente per turno, eccetto i turni cron leggeri che
preservano esattamente il prompt pianificato. Gli altri harness mantengono la normale
sezione del prompt.

La posizione può puntare a una skill annidata, ad esempio
`skills/personal/foo/SKILL.md`. L'annidamento è solo organizzativo; il prompt usa comunque
il nome piatto della skill dal frontmatter di `SKILL.md`.

L'idoneità include gate dei metadati della skill, controlli di ambiente/configurazione runtime,
e l'allowlist effettiva delle Skills dell'agente quando `agents.defaults.skills` o
`agents.list[].skills` è configurato.

Le Skills incorporate nei Plugin sono idonee solo quando il Plugin proprietario è abilitato.
Questo consente ai Plugin di strumenti di esporre guide operative più approfondite senza incorporare tutta
quella guida direttamente in ogni descrizione dello strumento.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
    <version>sha256:...</version>
  </skill>
</available_skills>
```

Questo mantiene piccolo il prompt di base pur abilitando l'uso mirato delle Skills.

Il budget dell'elenco Skills è di proprietà del sottosistema Skills:

- Predefinito globale: `skills.limits.maxSkillsPromptChars`
- Override per agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Gli estratti runtime generici limitati usano una superficie diversa:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Questa separazione mantiene il dimensionamento delle Skills distinto dal dimensionamento di lettura/iniezione runtime, ad esempio
`memory_get`, risultati degli strumenti live e aggiornamenti di AGENTS.md dopo la Compaction.

## Documentazione

Il prompt di sistema include una sezione **Documentazione**. Quando la documentazione locale è disponibile,
punta alla directory locale della documentazione di OpenClaw (`docs/` in un checkout Git o la documentazione del pacchetto npm
incorporata). Se la documentazione locale non è disponibile, passa a
[https://docs.openclaw.ai](https://docs.openclaw.ai).

La stessa sezione include anche la posizione del sorgente OpenClaw. I checkout Git espongono la radice sorgente
locale così l'agente può ispezionare direttamente il codice. Le installazioni da pacchetto includono l'URL sorgente
GitHub e indicano all'agente di esaminare il sorgente lì ogni volta che la documentazione è incompleta o
obsoleta. Il prompt segnala anche il mirror pubblico della documentazione, il Discord della community e ClawHub
([https://clawhub.ai](https://clawhub.ai)) per la scoperta delle Skills. Presenta la documentazione come
autorità per l'autoconoscenza di OpenClaw prima che il modello comprenda come funziona OpenClaw,
incluse memoria/note giornaliere, sessioni, strumenti, Gateway, configurazione, comandi o contesto di progetto.
Il prompt indica al modello di usare prima la documentazione locale (o il mirror della documentazione quando la documentazione locale
non è disponibile), e di trattare AGENTS.md, contesto di progetto, note di workspace/profilo/memoria
e `memory_search` come contesto di istruzioni o memoria utente piuttosto che come conoscenza di progettazione
o implementazione di OpenClaw. Se la documentazione tace o è obsoleta, il modello dovrebbe dirlo
e ispezionare il sorgente. Il prompt indica anche al modello di eseguire autonomamente `openclaw status` quando
possibile, chiedendo all'utente solo quando non ha accesso.
Per la configurazione in particolare, indirizza gli agenti all'azione dello strumento `gateway`
`config.schema.lookup` per documentazione e vincoli esatti a livello di campo, poi a
`docs/gateway/configuration.md` e `docs/gateway/configuration-reference.md`
per indicazioni più ampie.

## Correlati

- [Runtime dell'agente](/it/concepts/agent)
- [Workspace dell'agente](/it/concepts/agent-workspace)
- [Motore di contesto](/it/concepts/context-engine)
