---
read_when:
    - Modifica del testo del prompt di sistema, dell'elenco degli strumenti o delle sezioni su ora/Heartbeat
    - Modifica del comportamento di bootstrap dello spazio di lavoro o di iniezione delle Skills
summary: Cosa contiene il prompt di sistema di OpenClaw e come viene assemblato
title: Prompt di sistema
x-i18n:
    generated_at: "2026-05-10T19:33:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa3db4f53ffe5c11fd85159044344b56cd11c3bdb1a5a5de7638b21fb813135
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw crea un prompt di sistema personalizzato per ogni esecuzione dell'agente. Il prompt è **di proprietà di OpenClaw** e non usa il prompt predefinito di pi-coding-agent.

Il prompt viene assemblato da OpenClaw e iniettato in ogni esecuzione dell'agente.

L'assemblaggio del prompt ha tre livelli:

- `buildAgentSystemPrompt` genera il prompt dagli input espliciti. Deve
  restare un renderer puro e non deve leggere direttamente la configurazione globale.
- `resolveAgentSystemPromptConfig` risolve le impostazioni del prompt basate sulla configurazione, come
  visualizzazione del proprietario, suggerimenti TTS, alias dei modelli, modalità di citazione della memoria e modalità di
  delega ai sotto-agenti per un agente specifico.
- Gli adattatori di runtime (incorporato, CLI, anteprime comando/export, compaction) raccolgono
  fatti live come strumenti, stato della sandbox, capacità del canale, file di contesto
  e contributi al prompt del provider, quindi chiamano la facade del prompt configurata.

Questo mantiene le superfici di prompt esportate/di debug allineate con le esecuzioni live senza
trasformare ogni dettaglio specifico del runtime in un unico builder monolitico.

I Plugin provider possono contribuire indicazioni del prompt attente alla cache senza sostituire
l'intero prompt di proprietà di OpenClaw. Il runtime del provider può:

- sostituire un piccolo insieme di sezioni core con nome (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- iniettare un **prefisso stabile** sopra il limite della cache del prompt
- iniettare un **suffisso dinamico** sotto il limite della cache del prompt

Usa i contributi di proprietà del provider per l'ottimizzazione specifica della famiglia di modelli. Mantieni la
mutazione legacy del prompt `before_prompt_build` per compatibilità o per modifiche del prompt davvero globali,
non per il normale comportamento del provider.

L'overlay della famiglia OpenAI GPT-5 mantiene ridotta la regola di esecuzione core e aggiunge
indicazioni specifiche del modello per ancoraggio della persona, output conciso, disciplina degli strumenti,
lookup parallelo, copertura degli elaborati, verifica, contesto mancante e
igiene dello strumento terminale.

## Struttura

Il prompt è intenzionalmente compatto e usa sezioni fisse:

- **Strumenti**: promemoria sulla fonte di verità dello strumento strutturato più indicazioni runtime sull'uso degli strumenti.
- **Bias di esecuzione**: indicazioni compatte di completamento: agire nel turno sulle
  richieste azionabili, continuare fino al completamento o al blocco, recuperare da risultati deboli degli strumenti,
  controllare live lo stato mutabile e verificare prima di finalizzare.
- **Sicurezza**: breve promemoria di guardrail per evitare comportamenti di ricerca del potere o aggiramento della supervisione.
- **Skills** (quando disponibili): spiega al modello come caricare istruzioni delle skill su richiesta.
- **Controllo OpenClaw**: dice al modello di preferire lo strumento `gateway` per
  configurazione/riavvio e di evitare di inventare comandi CLI.
- **Auto-aggiornamento OpenClaw**: come ispezionare la configurazione in sicurezza con
  `config.schema.lookup`, correggere la configurazione con `config.patch`, sostituire l'intera
  configurazione con `config.apply` ed eseguire `update.run` solo su richiesta esplicita dell'utente.
  Anche lo strumento `gateway` riservato al proprietario rifiuta di riscrivere
  `tools.exec.ask` / `tools.exec.security`, inclusi gli alias legacy `tools.bash.*`
  che si normalizzano in quei percorsi exec protetti.
- **Workspace**: directory di lavoro (`agents.defaults.workspace`).
- **Documentazione**: percorso locale dei docs/source di OpenClaw e quando leggerli.
- **File del workspace (iniettati)**: indica che i file di bootstrap sono inclusi sotto.
- **Sandbox** (quando abilitata): indica runtime in sandbox, percorsi della sandbox e se è disponibile exec elevato.
- **Data e ora correnti**: solo fuso orario (stabile per la cache; l'orologio live proviene da `session_status`).
- **Direttive di output dell'assistente**: sintassi compatta per allegati, note vocali e tag di risposta.
- **Heartbeat**: prompt Heartbeat e comportamento di ack, quando gli heartbeat sono abilitati per l'agente predefinito.
- **Runtime**: host, OS, node, modello, radice del repository (quando rilevata), livello di pensiero (una riga).
- **Ragionamento**: livello di visibilità corrente + suggerimento per il toggle /reasoning.

OpenClaw mantiene i grandi contenuti stabili, incluso **Contesto del progetto**, sopra il
limite interno della cache del prompt. Le sezioni volatili di canale/sessione come
indicazioni incorporate dell'interfaccia di controllo, **Messaggistica**, **Voce**, **Contesto della chat di gruppo**,
**Reazioni**, **Heartbeat** e **Runtime** vengono aggiunte sotto quel limite
così i backend locali con cache di prefisso possono riutilizzare il prefisso stabile del workspace
tra i turni del canale. Anche le descrizioni degli strumenti dovrebbero evitare di incorporare nomi di canali correnti
quando lo schema accettato contiene già quel dettaglio runtime.

La sezione Strumenti include anche indicazioni runtime per lavori di lunga durata:

- usa cron per follow-up futuri (`check back later`, promemoria, lavoro ricorrente)
  invece di loop sleep di `exec`, trucchi di ritardo `yieldMs` o polling ripetuto di `process`
- usa `exec` / `process` solo per comandi che iniziano ora e continuano a girare
  in background
- quando è abilitato il risveglio automatico al completamento, avvia il comando una volta e affidati al
  percorso di risveglio push-based quando emette output o fallisce
- usa `process` per log, stato, input o intervento quando devi
  ispezionare un comando in esecuzione
- se il compito è più grande, preferisci `sessions_spawn`; il completamento del sotto-agente è
  push-based e viene annunciato automaticamente al richiedente
- non eseguire polling di `subagents list` / `sessions_list` in un loop solo per attendere il
  completamento

`agents.defaults.subagents.delegationMode` può rafforzare queste indicazioni. La
modalità predefinita `suggest` mantiene il suggerimento di base. `prefer` aggiunge una sezione
dedicata **Delega ai sotto-agenti** che dice all'agente principale di agire come coordinatore
reattivo e di inviare tramite `sessions_spawn` qualsiasi cosa più articolata di una risposta diretta.
Questo riguarda solo il prompt; la policy degli strumenti controlla comunque se
`sessions_spawn` è disponibile.

Quando lo strumento sperimentale `update_plan` è abilitato, Strumenti dice anche al
modello di usarlo solo per lavori multi-step non banali, mantenere esattamente uno
step `in_progress` ed evitare di ripetere l'intero piano dopo ogni aggiornamento.

I guardrail di sicurezza nel prompt di sistema sono consultivi. Guidano il comportamento del modello ma non applicano policy. Usa policy degli strumenti, approvazioni exec, sandboxing e allowlist dei canali per l'applicazione rigida; gli operatori possono disabilitarli per progettazione.

Sui canali con schede/pulsanti di approvazione nativi, il prompt runtime ora dice
all'agente di affidarsi prima a quell'interfaccia nativa di approvazione. Deve includere un comando manuale
`/approve` solo quando il risultato dello strumento dice che le approvazioni via chat non sono disponibili o
che l'approvazione manuale è l'unico percorso.

## Modalità del prompt

OpenClaw può generare prompt di sistema più piccoli per i sotto-agenti. Il runtime imposta una
`promptMode` per ogni esecuzione (non una configurazione visibile all'utente):

- `full` (predefinita): include tutte le sezioni sopra.
- `minimal`: usata per i sotto-agenti; omette **Richiamo memoria**, **Auto-aggiornamento OpenClaw**,
  **Alias dei modelli**, **Identità utente**, **Direttive di output dell'assistente**,
  **Messaggistica**, **Risposte silenziose** e **Heartbeat**. Strumenti, **Sicurezza**,
  **Skills** quando fornite, Workspace, Sandbox, Data e ora correnti (quando
  note), Runtime e contesto iniettato restano disponibili.
- `none`: restituisce solo la riga di identità di base.

Quando `promptMode=minimal`, i prompt iniettati extra sono etichettati **Contesto sotto-agente**
invece di **Contesto della chat di gruppo**.

Per le esecuzioni di risposta automatica del canale, OpenClaw può omettere la sezione generica **Risposte silenziose**
quando il contesto della chat diretta/di gruppo include già il comportamento
`NO_REPLY` specifico della conversazione risolto. Questo evita di ripetere la meccanica dei token
sia nel prompt di sistema globale sia nel contesto del canale.

## Snapshot del prompt

OpenClaw mantiene snapshot del prompt committed per il percorso felice del runtime Codex sotto
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Generano
parametri selezionati di thread/turno dell'app-server più uno stack ricostruito di livelli del prompt vincolato al modello
per turni diretti Telegram, di gruppo Discord e Heartbeat. Quello stack
include una fixture del prompt del modello Codex `gpt-5.5` fissata generata dalla forma del catalogo/cache
dei modelli di Codex, il testo developer dei permessi del percorso felice Codex,
le istruzioni developer OpenClaw, le istruzioni di modalità collaborazione con scope sul turno
quando OpenClaw le fornisce, l'input del turno utente e riferimenti alle specifiche dinamiche degli strumenti.

Aggiorna la fixture fissata del prompt del modello Codex con
`pnpm prompt:snapshots:sync-codex-model`. Per impostazione predefinita, lo script cerca
la cache runtime di Codex in `$CODEX_HOME/models_cache.json`, poi in
`~/.codex/models_cache.json`, e solo dopo ricade sulla convenzione del checkout Codex
del maintainer in `~/code/codex/codex-rs/models-manager/models.json`. Se
nessuna di queste fonti esiste, il comando termina senza modificare la fixture
committed. Passa `--catalog <path>` per aggiornare da uno specifico file `models_cache.json`
o `models.json`.

Questi snapshot non sono comunque una cattura grezza byte-per-byte della richiesta OpenAI. Codex
può aggiungere contesto del workspace di proprietà del runtime come `AGENTS.md`, contesto
dell'ambiente, memorie, istruzioni app/plugin e istruzioni integrate Default
di modalità collaborazione dentro il runtime Codex dopo che OpenClaw invia
i parametri di thread e turno.

Rigenerali con `pnpm prompt:snapshots:gen` e verifica la deriva con
`pnpm prompt:snapshots:check`. La CI esegue il controllo della deriva nello shard di confine
aggiuntivo così modifiche del prompt e aggiornamenti degli snapshot restano collegati alla stessa
PR.

## Iniezione del bootstrap del workspace

I file di bootstrap vengono ridotti e aggiunti sotto **Contesto del progetto** così il modello vede contesto di identità e profilo senza dover effettuare letture esplicite:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo su workspace nuovissimi)
- `MEMORY.md` quando presente

Tutti questi file sono **iniettati nella finestra di contesto** a ogni turno a meno che
si applichi un gate specifico del file. `HEARTBEAT.md` viene omesso nelle esecuzioni normali quando
gli heartbeat sono disabilitati per l'agente predefinito o
`agents.defaults.heartbeat.includeSystemPromptSection` è false. Mantieni concisi i file iniettati,
specialmente `MEMORY.md`. `MEMORY.md` è pensato per restare un
riepilogo a lungo termine curato; le note giornaliere dettagliate appartengono a `memory/*.md` dove
`memory_search` e `memory_get` possono recuperarle su richiesta. File `MEMORY.md`
troppo grandi aumentano l'uso del prompt e possono essere iniettati parzialmente a causa dei
limiti dei file di bootstrap sotto.

Quando una sessione gira sull'harness nativo Codex, Codex carica `AGENTS.md`
attraverso la propria scoperta dei documenti di progetto. OpenClaw risolve comunque i restanti
file di bootstrap e li inoltra come istruzioni di configurazione Codex, così `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` e
`MEMORY.md` mantengono lo stesso ruolo di contesto del workspace senza duplicare
`AGENTS.md`.

<Note>
I file giornalieri `memory/*.md` **non** fanno parte del normale Contesto del progetto di bootstrap. Nei turni ordinari sono accessibili su richiesta tramite gli strumenti `memory_search` e `memory_get`, quindi non contano contro la finestra di contesto a meno che il modello non li legga esplicitamente. I turni bare `/new` e `/reset` sono l'eccezione: il runtime può anteporre la memoria giornaliera recente come blocco di contesto di avvio una tantum per quel primo turno.
</Note>

I file grandi vengono troncati con un marker. La dimensione massima per file è controllata da
`agents.defaults.bootstrapMaxChars` (predefinito: 12000). Il contenuto bootstrap totale iniettato
tra i file è limitato da `agents.defaults.bootstrapTotalMaxChars`
(predefinito: 60000). I file mancanti iniettano un breve marker di file mancante. Quando avviene il troncamento,
OpenClaw può iniettare un avviso conciso nel prompt di sistema; controllalo con
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
predefinito: `once`). I conteggi grezzi/iniettati dettagliati restano nella diagnostica come
`/context`, `/status`, doctor e log.

Per i file di memoria, il troncamento non è perdita di dati: il file resta intatto su disco,
ma il modello vede solo la copia iniettata accorciata finché non legge o cerca
direttamente la memoria. Se `MEMORY.md` viene troncato ripetutamente, distillalo in un
riepilogo durevole più breve e sposta la cronologia dettagliata in `memory/*.md`, oppure
aumenta intenzionalmente i limiti di bootstrap.

Le sessioni dei sotto-agenti iniettano solo `AGENTS.md` e `TOOLS.md` (gli altri file di bootstrap
vengono filtrati per mantenere piccolo il contesto del sotto-agente).

Gli hook interni possono intercettare questo passaggio tramite `agent:bootstrap` per modificare o sostituire
i file di bootstrap iniettati (per esempio sostituendo `SOUL.md` con una persona alternativa).

Se vuoi rendere il tono dell'agente meno generico, inizia con
[Guida alla personalità SOUL.md](/it/concepts/soul).

Per ispezionare quanto contribuisce ogni file iniettato (grezzo rispetto a iniettato, troncamento, più overhead dello schema degli strumenti), usa `/context list` o `/context detail`. Vedi [Contesto](/it/concepts/context).

## Gestione del tempo

Il prompt di sistema include una sezione dedicata **Data e ora correnti** quando il
fuso orario dell'utente è noto. Per mantenere il prompt stabile nella cache, ora include
solo il **fuso orario** (nessun orologio dinamico o formato dell'ora).

Usa `session_status` quando l'agente ha bisogno dell'ora corrente; la scheda di stato
include una riga con timestamp. Lo stesso strumento può opzionalmente impostare un override
del modello per sessione (`model=default` lo cancella).

Configura con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Vedi [Data e ora](/it/date-time) per i dettagli completi sul comportamento.

## Skills

Quando esistono Skills idonee, OpenClaw inietta un **elenco compatto delle Skills disponibili**
(`formatSkillsForPrompt`) che include il **percorso del file** per ogni skill. Il
prompt istruisce il modello a usare `read` per caricare lo SKILL.md nella posizione
indicata (workspace, gestita o inclusa nel pacchetto). Se nessuna Skills è idonea, la
sezione Skills viene omessa.

L'idoneità include i gate dei metadati della skill, i controlli sull'ambiente/configurazione di runtime
e l'allowlist effettiva delle skill dell'agente quando `agents.defaults.skills` o
`agents.list[].skills` è configurato.

Le skill incluse in un Plugin sono idonee solo quando il Plugin proprietario è abilitato.
Questo permette ai Plugin di strumenti di esporre guide operative più approfondite senza incorporare
tutta quella guida direttamente in ogni descrizione dello strumento.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Questo mantiene ridotto il prompt di base pur consentendo l'uso mirato delle skill.

Il budget dell'elenco delle skill è gestito dal sottosistema delle skill:

- Valore predefinito globale: `skills.limits.maxSkillsPromptChars`
- Override per agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Gli estratti di runtime generici con limite usano una superficie diversa:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Questa separazione mantiene il dimensionamento delle skill distinto dal dimensionamento di lettura/iniezione di runtime, come
`memory_get`, i risultati degli strumenti live e gli aggiornamenti di AGENTS.md dopo la Compaction.

## Documentazione

Il prompt di sistema include una sezione **Documentazione**. Quando la documentazione locale è disponibile, essa
punta alla directory locale della documentazione di OpenClaw (`docs/` in un checkout Git o la documentazione inclusa
nel pacchetto npm). Se la documentazione locale non è disponibile, ripiega su
[https://docs.openclaw.ai](https://docs.openclaw.ai).

La stessa sezione include anche la posizione del sorgente di OpenClaw. I checkout Git espongono la radice locale
del sorgente così l'agente può ispezionare direttamente il codice. Le installazioni da pacchetto includono l'URL
del sorgente GitHub e dicono all'agente di esaminare lì il sorgente ogni volta che la documentazione è incompleta o
obsoleta. Il prompt segnala anche il mirror pubblico della documentazione, il Discord della community e ClawHub
([https://clawhub.ai](https://clawhub.ai)) per la scoperta delle skill. Dice al modello di
consultare prima la documentazione per comportamento, comandi, configurazione o architettura di OpenClaw, e di
eseguire `openclaw status` autonomamente quando possibile (chiedendo all'utente solo quando non ha accesso).
Per la configurazione in particolare, indirizza gli agenti all'azione dello strumento `gateway`
`config.schema.lookup` per documentazione e vincoli esatti a livello di campo, poi a
`docs/gateway/configuration.md` e `docs/gateway/configuration-reference.md`
per una guida più ampia.

## Correlati

- [Runtime dell'agente](/it/concepts/agent)
- [Workspace dell'agente](/it/concepts/agent-workspace)
- [Motore di contesto](/it/concepts/context-engine)
