---
read_when:
    - Modifica del testo del prompt di sistema, dell'elenco degli strumenti o delle sezioni di tempo/Heartbeat
    - Modifica del comportamento di bootstrap dello spazio di lavoro o di iniezione di Skills
summary: Cosa contiene il prompt di sistema di OpenClaw e come viene assemblato
title: Prompt di sistema
x-i18n:
    generated_at: "2026-05-04T07:05:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e6067e760eccf58106f0a646c2656e902d5951580abd750f342d70b0568b81b
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw crea un prompt di sistema personalizzato per ogni esecuzione dell'agente. Il prompt è **di proprietà di OpenClaw** e non usa il prompt predefinito di pi-coding-agent.

Il prompt viene assemblato da OpenClaw e iniettato in ogni esecuzione dell'agente.

I plugin dei provider possono contribuire con indicazioni per il prompt consapevoli della cache senza sostituire
l'intero prompt di proprietà di OpenClaw. Il runtime del provider può:

- sostituire un piccolo insieme di sezioni core denominate (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- iniettare un **prefisso stabile** sopra il confine della cache del prompt
- iniettare un **suffisso dinamico** sotto il confine della cache del prompt

Usa contributi di proprietà del provider per la messa a punto specifica della famiglia di modelli. Mantieni la mutazione legacy del prompt
`before_prompt_build` per la compatibilità o per modifiche del prompt davvero globali,
non per il comportamento normale del provider.

L'overlay della famiglia OpenAI GPT-5 mantiene ridotta la regola di esecuzione core e aggiunge
indicazioni specifiche per modello su aggancio della persona, output conciso, disciplina degli strumenti,
ricerca parallela, copertura dei deliverable, verifica, contesto mancante e
igiene degli strumenti di terminale.

## Struttura

Il prompt è intenzionalmente compatto e usa sezioni fisse:

- **Strumenti**: promemoria della fonte di verità degli strumenti strutturati più indicazioni di runtime sull'uso degli strumenti.
- **Orientamento all'esecuzione**: indicazioni compatte di completamento: agire nel turno sulle
  richieste eseguibili, continuare finché completato o bloccato, recuperare da risultati deboli degli strumenti,
  controllare dal vivo lo stato mutabile e verificare prima di finalizzare.
- **Sicurezza**: breve promemoria di guardrail per evitare comportamenti di ricerca del potere o l'aggiramento della supervisione.
- **Skills** (quando disponibili): indica al modello come caricare le istruzioni delle skill su richiesta.
- **Auto-aggiornamento di OpenClaw**: come ispezionare la configurazione in modo sicuro con
  `config.schema.lookup`, applicare patch alla configurazione con `config.patch`, sostituire l'intera
  configurazione con `config.apply` ed eseguire `update.run` solo su richiesta esplicita dell'utente.
  Anche lo strumento riservato al proprietario `gateway` rifiuta di riscrivere
  `tools.exec.ask` / `tools.exec.security`, inclusi gli alias legacy `tools.bash.*`
  che si normalizzano in quei percorsi exec protetti.
- **Workspace**: directory di lavoro (`agents.defaults.workspace`).
- **Documentazione**: percorso locale alla documentazione di OpenClaw (repo o pacchetto npm) e quando leggerla.
- **File del workspace (iniettati)**: indica che i file di bootstrap sono inclusi sotto.
- **Sandbox** (quando abilitata): indica runtime in sandbox, percorsi della sandbox e se exec elevato è disponibile.
- **Data e ora correnti**: ora locale dell'utente, fuso orario e formato dell'ora.
- **Tag di risposta**: sintassi opzionale dei tag di risposta per i provider supportati.
- **Heartbeat**: prompt di Heartbeat e comportamento di ack, quando gli heartbeat sono abilitati per l'agente predefinito.
- **Runtime**: host, OS, node, modello, radice del repo (quando rilevata), livello di ragionamento (una riga).
- **Ragionamento**: livello di visibilità corrente + suggerimento per l'opzione /reasoning.

OpenClaw mantiene i contenuti stabili di grandi dimensioni, incluso **Contesto del progetto**, sopra il
confine interno della cache del prompt. Le sezioni volatili di canale/sessione come
le indicazioni embed della Control UI, **Messaggistica**, **Voce**, **Contesto della chat di gruppo**,
**Reazioni**, **Heartbeat** e **Runtime** sono aggiunte sotto quel confine
così i backend locali con cache di prefisso possono riutilizzare il prefisso stabile del workspace
tra i turni di canale. Anche le descrizioni degli strumenti dovrebbero evitare di incorporare i nomi correnti
dei canali quando lo schema accettato contiene già quel dettaglio di runtime.

La sezione Strumenti include anche indicazioni di runtime per il lavoro di lunga durata:

- usa cron per follow-up futuri (`check back later`, promemoria, lavoro ricorrente)
  invece di cicli di sleep con `exec`, trucchi di ritardo `yieldMs` o polling ripetuto di `process`
- usa `exec` / `process` solo per comandi che iniziano ora e continuano a essere eseguiti
  in background
- quando il risveglio automatico al completamento è abilitato, avvia il comando una sola volta e affidati
  al percorso di risveglio push-based quando emette output o fallisce
- usa `process` per log, stato, input o intervento quando devi
  ispezionare un comando in esecuzione
- se l'attività è più ampia, preferisci `sessions_spawn`; il completamento del sotto-agente è
  push-based e viene annunciato automaticamente al richiedente
- non eseguire polling di `subagents list` / `sessions_list` in un ciclo solo per attendere
  il completamento

Quando lo strumento sperimentale `update_plan` è abilitato, Strumenti dice anche al
modello di usarlo solo per lavoro multi-step non banale, mantenere esattamente un passaggio
`in_progress` ed evitare di ripetere l'intero piano dopo ogni aggiornamento.

I guardrail di sicurezza nel prompt di sistema sono consultivi. Guidano il comportamento del modello ma non applicano le policy. Usa policy degli strumenti, approvazioni exec, sandboxing e allowlist dei canali per l'applicazione rigida; gli operatori possono disabilitarli per progettazione.

Sui canali con schede/pulsanti di approvazione nativi, il prompt di runtime ora dice
all'agente di affidarsi prima a quella UI di approvazione nativa. Dovrebbe includere un comando manuale
`/approve` solo quando il risultato dello strumento dice che le approvazioni via chat non sono disponibili o
l'approvazione manuale è l'unico percorso.

## Modalità del prompt

OpenClaw può renderizzare prompt di sistema più piccoli per i sotto-agenti. Il runtime imposta una
`promptMode` per ogni esecuzione (non una configurazione esposta all'utente):

- `full` (predefinita): include tutte le sezioni sopra.
- `minimal`: usata per i sotto-agenti; omette **Skills**, **Richiamo memoria**, **Auto-aggiornamento di OpenClaw**,
  **Alias dei modelli**, **Identità dell'utente**, **Tag di risposta**,
  **Messaggistica**, **Risposte silenziose** e **Heartbeat**. Strumenti, **Sicurezza**,
  Workspace, Sandbox, Data e ora correnti (quando note), Runtime e contesto iniettato
  restano disponibili.
- `none`: restituisce solo la riga di identità di base.

Quando `promptMode=minimal`, i prompt iniettati extra sono etichettati **Contesto del sotto-agente**
invece di **Contesto della chat di gruppo**.

Per le esecuzioni di risposta automatica dei canali, OpenClaw può omettere la sezione generica **Risposte silenziose**
quando il contesto della chat diretta/di gruppo include già il comportamento `NO_REPLY`
specifico della conversazione risolto. Questo evita di ripetere la meccanica dei token
sia nel prompt di sistema globale sia nel contesto del canale.

## Snapshot del prompt

OpenClaw mantiene snapshot del prompt sottoposti a commit per il percorso felice del runtime Codex sotto
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Renderizzano
parametri selezionati di thread/turn dell'app-server più uno stack ricostruito di layer del prompt associati al modello
per turni diretti Telegram, di gruppo Discord e heartbeat. Quello stack
include una fixture fissata del prompt del modello Codex `gpt-5.5` generata dalla forma
catalogo/cache dei modelli di Codex, il testo developer dei permessi del percorso felice di Codex,
istruzioni developer di OpenClaw, istruzioni di collaboration-mode con ambito del turno
quando OpenClaw le fornisce, input del turno utente e riferimenti alle specifiche dinamiche degli strumenti.

Aggiorna la fixture fissata del prompt del modello Codex con
`pnpm prompt:snapshots:sync-codex-model`. Per impostazione predefinita, lo script cerca
la cache di runtime di Codex in `$CODEX_HOME/models_cache.json`, poi
`~/.codex/models_cache.json` e solo dopo ripiega sulla convenzione del checkout Codex del manutentore
in `~/code/codex/codex-rs/models-manager/models.json`. Se
nessuna di queste fonti esiste, il comando termina senza modificare la fixture
sottoposta a commit. Passa `--catalog <path>` per aggiornare da un file `models_cache.json`
o `models.json` specifico.

Questi snapshot non sono ancora una cattura raw byte-per-byte di una richiesta OpenAI. Codex
può aggiungere contesto del workspace di proprietà del runtime come `AGENTS.md`, contesto
dell'ambiente, memorie, istruzioni di app/plugin e istruzioni integrate Default
di collaboration-mode all'interno del runtime Codex dopo che OpenClaw invia
i parametri di thread e turn.

Rigenerali con `pnpm prompt:snapshots:gen` e verifica le derive con
`pnpm prompt:snapshots:check`. La CI esegue il controllo di deriva nello shard di confine
aggiuntivo così le modifiche del prompt e gli aggiornamenti degli snapshot restano collegati alla stessa
PR.

## Iniezione del bootstrap del workspace

I file di bootstrap vengono ridotti e aggiunti sotto **Contesto del progetto** così il modello vede identità e contesto del profilo senza bisogno di letture esplicite:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo su workspace nuovi di zecca)
- `MEMORY.md` quando presente

Tutti questi file vengono **iniettati nella finestra di contesto** a ogni turno salvo
che si applichi un gate specifico del file. `HEARTBEAT.md` viene omesso nelle esecuzioni normali quando
gli heartbeat sono disabilitati per l'agente predefinito o
`agents.defaults.heartbeat.includeSystemPromptSection` è false. Mantieni concisi i file
iniettati, specialmente `MEMORY.md`, che può crescere nel tempo e portare a
un uso del contesto inaspettatamente alto e a compaction più frequente.

Quando una sessione gira sull'harness nativo Codex, Codex carica `AGENTS.md`
tramite la propria scoperta dei documenti di progetto. OpenClaw risolve comunque i restanti
file di bootstrap e li inoltra come istruzioni di configurazione Codex, quindi `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` e
`MEMORY.md` mantengono lo stesso ruolo di contesto del workspace senza duplicare
`AGENTS.md`.

<Note>
I file giornalieri `memory/*.md` **non** fanno parte del normale Contesto del progetto di bootstrap. Nei turni ordinari vengono consultati su richiesta tramite gli strumenti `memory_search` e `memory_get`, quindi non contano contro la finestra di contesto salvo che il modello li legga esplicitamente. I turni bare `/new` e `/reset` sono l'eccezione: il runtime può anteporre memoria giornaliera recente come blocco di contesto di avvio una tantum per quel primo turno.
</Note>

I file grandi vengono troncati con un marcatore. La dimensione massima per file è controllata da
`agents.defaults.bootstrapMaxChars` (predefinito: 12000). Il contenuto totale del bootstrap iniettato
tra i file è limitato da `agents.defaults.bootstrapTotalMaxChars`
(predefinito: 60000). I file mancanti iniettano un breve marcatore di file mancante. Quando avviene un troncamento,
OpenClaw può iniettare un avviso conciso nel prompt di sistema; controllalo con
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
predefinito: `once`). I conteggi dettagliati raw/iniettati restano nella diagnostica come
`/context`, `/status`, doctor e log.

Le sessioni dei sotto-agenti iniettano solo `AGENTS.md` e `TOOLS.md` (gli altri file di bootstrap
vengono filtrati per mantenere piccolo il contesto del sotto-agente).

Gli hook interni possono intercettare questo passaggio tramite `agent:bootstrap` per mutare o sostituire
i file di bootstrap iniettati (per esempio sostituendo `SOUL.md` con una persona alternativa).

Se vuoi rendere l'agente meno generico, inizia con
[Guida alla personalità SOUL.md](/it/concepts/soul).

Per ispezionare quanto contribuisce ogni file iniettato (raw vs iniettato, troncamento, più overhead dello schema degli strumenti), usa `/context list` o `/context detail`. Vedi [Contesto](/it/concepts/context).

## Gestione del tempo

Il prompt di sistema include una sezione dedicata **Data e ora correnti** quando il
fuso orario dell'utente è noto. Per mantenere stabile la cache del prompt, ora include solo
il **fuso orario** (nessun orologio dinamico o formato dell'ora).

Usa `session_status` quando l'agente ha bisogno dell'ora corrente; la scheda di stato
include una riga timestamp. Lo stesso strumento può facoltativamente impostare un override del modello per sessione
(`model=default` lo cancella).

Configura con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Vedi [Data e ora](/it/date-time) per i dettagli completi sul comportamento.

## Skills

Quando esistono skill idonee, OpenClaw inietta una **lista di skill disponibili** compatta
(`formatSkillsForPrompt`) che include il **percorso del file** per ogni skill. Il
prompt istruisce il modello a usare `read` per caricare lo SKILL.md nella
posizione elencata (workspace, gestita o in bundle). Se nessuna skill è idonea, la
sezione Skills viene omessa.

L'idoneità include gate dei metadati delle skill, controlli di ambiente/configurazione di runtime
e la allowlist effettiva delle skill dell'agente quando `agents.defaults.skills` o
`agents.list[].skills` è configurato.

Le skill in bundle con un plugin sono idonee solo quando il plugin proprietario è abilitato.
Questo consente ai plugin di strumenti di esporre guide operative più approfondite senza incorporare tutte
quelle indicazioni direttamente in ogni descrizione degli strumenti.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Questo mantiene piccolo il prompt di base pur abilitando l'uso mirato delle skill.

Il budget della lista delle skill è di proprietà del sottosistema delle skill:

- Predefinito globale: `skills.limits.maxSkillsPromptChars`
- Override per agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Gli estratti runtime generici con limiti usano una superficie diversa:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Questa separazione mantiene il dimensionamento delle Skills separato dal dimensionamento di lettura/iniezione runtime, ad esempio `memory_get`, risultati di strumenti live e aggiornamenti di AGENTS.md dopo la Compaction.

## Documentazione

Il prompt di sistema include una sezione **Documentazione**. Quando la documentazione locale è disponibile, punta alla directory della documentazione OpenClaw locale (`docs/` in un checkout Git o la documentazione del pacchetto npm incluso). Se la documentazione locale non è disponibile, ripiega su [https://docs.openclaw.ai](https://docs.openclaw.ai).

La stessa sezione include anche la posizione del sorgente OpenClaw. I checkout Git espongono la radice del sorgente locale, così l’agente può ispezionare direttamente il codice. Le installazioni da pacchetto includono l’URL del sorgente GitHub e indicano all’agente di consultare il sorgente lì ogni volta che la documentazione è incompleta o obsoleta. Il prompt segnala anche il mirror pubblico della documentazione, il Discord della community e ClawHub ([https://clawhub.ai](https://clawhub.ai)) per la scoperta delle Skills. Dice al modello di consultare prima la documentazione per comportamento, comandi, configurazione o architettura di OpenClaw, e di eseguire direttamente `openclaw status` quando possibile (chiedendo all’utente solo quando non ha accesso). Per la configurazione nello specifico, indirizza gli agenti all’azione dello strumento `gateway` `config.schema.lookup` per documentazione e vincoli esatti a livello di campo, poi a `docs/gateway/configuration.md` e `docs/gateway/configuration-reference.md` per indicazioni più ampie.

## Correlati

- [Runtime dell’agente](/it/concepts/agent)
- [Area di lavoro dell’agente](/it/concepts/agent-workspace)
- [Motore di contesto](/it/concepts/context-engine)
