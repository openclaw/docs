---
read_when:
    - Modifica del testo del prompt di sistema, dell'elenco degli strumenti o delle sezioni tempo/Heartbeat
    - Modifica dell'inizializzazione dell'area di lavoro o del comportamento di iniezione delle Skills
summary: Cosa contiene il prompt di sistema di OpenClaw e come viene assemblato
title: Prompt di sistema
x-i18n:
    generated_at: "2026-05-03T21:31:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93533ac8090897a7b5fd82b80e542a4ad573670408314b3519c5e317d0408ade
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw crea un prompt di sistema personalizzato per ogni esecuzione dell'agente. Il prompt è **di proprietà di OpenClaw** e non usa il prompt predefinito di pi-coding-agent.

Il prompt viene assemblato da OpenClaw e iniettato in ogni esecuzione dell'agente.

I plugin provider possono contribuire con linee guida per il prompt consapevoli della cache senza sostituire
l'intero prompt di proprietà di OpenClaw. Il runtime del provider può:

- sostituire un piccolo insieme di sezioni core denominate (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- iniettare un **prefisso stabile** sopra il limite della cache del prompt
- iniettare un **suffisso dinamico** sotto il limite della cache del prompt

Usa contributi di proprietà del provider per l'ottimizzazione specifica per famiglie di modelli. Mantieni la mutazione del prompt legacy
`before_prompt_build` per compatibilità o per modifiche del prompt davvero globali,
non per il normale comportamento del provider.

L'overlay della famiglia OpenAI GPT-5 mantiene ridotta la regola di esecuzione core e aggiunge
indicazioni specifiche del modello per aggancio della persona, output conciso, disciplina degli strumenti,
ricerca parallela, copertura dei deliverable, verifica, contesto mancante e
igiene degli strumenti da terminale.

## Struttura

Il prompt è volutamente compatto e usa sezioni fisse:

- **Strumenti**: promemoria sulla fonte di verità degli strumenti strutturati più linee guida runtime sull'uso degli strumenti.
- **Bias di esecuzione**: linee guida compatte di completamento: agire nel turno sulle
  richieste azionabili, continuare fino al completamento o al blocco, recuperare da risultati deboli degli strumenti,
  controllare live lo stato mutabile e verificare prima di finalizzare.
- **Sicurezza**: breve promemoria di guardrail per evitare comportamenti di ricerca di potere o aggiramento della supervisione.
- **Skills** (quando disponibili): indica al modello come caricare le istruzioni delle skill su richiesta.
- **Auto-aggiornamento OpenClaw**: come ispezionare la configurazione in modo sicuro con
  `config.schema.lookup`, correggere la configurazione con `config.patch`, sostituire l'intera
  configurazione con `config.apply` ed eseguire `update.run` solo su richiesta esplicita dell'utente.
  Anche lo strumento `gateway` riservato al proprietario rifiuta di riscrivere
  `tools.exec.ask` / `tools.exec.security`, inclusi gli alias legacy `tools.bash.*`
  che si normalizzano in quei percorsi exec protetti.
- **Workspace**: directory di lavoro (`agents.defaults.workspace`).
- **Documentazione**: percorso locale ai documenti OpenClaw (repo o pacchetto npm) e quando leggerli.
- **File del workspace (iniettati)**: indica che i file di bootstrap sono inclusi sotto.
- **Sandbox** (quando abilitata): indica runtime sandboxato, percorsi sandbox e se è disponibile exec elevato.
- **Data e ora correnti**: ora locale dell'utente, fuso orario e formato dell'ora.
- **Tag di risposta**: sintassi facoltativa dei tag di risposta per i provider supportati.
- **Heartbeats**: prompt Heartbeat e comportamento ack, quando gli Heartbeat sono abilitati per l'agente predefinito.
- **Runtime**: host, OS, Node, modello, radice del repo (quando rilevata), livello di pensiero (una riga).
- **Ragionamento**: livello di visibilità corrente + suggerimento toggle /reasoning.

OpenClaw mantiene i grandi contenuti stabili, incluso **Contesto del progetto**, sopra il
limite interno della cache del prompt. Le sezioni volatili di canale/sessione come
linee guida di incorporamento della Control UI, **Messaggistica**, **Voce**, **Contesto chat di gruppo**,
**Reazioni**, **Heartbeats** e **Runtime** vengono aggiunte sotto quel limite,
così i backend locali con cache di prefisso possono riutilizzare il prefisso stabile del workspace
tra i turni del canale. Anche le descrizioni degli strumenti dovrebbero evitare di incorporare i nomi correnti
dei canali quando lo schema accettato contiene già quel dettaglio runtime.

La sezione Strumenti include anche linee guida runtime per lavori di lunga durata:

- usare cron per follow-up futuri (`check back later`, promemoria, lavori ricorrenti)
  invece di cicli sleep con `exec`, trucchi di ritardo `yieldMs` o polling ripetuto di `process`
- usare `exec` / `process` solo per comandi che iniziano ora e continuano a essere eseguiti
  in background
- quando è abilitato il risveglio automatico al completamento, avviare il comando una volta e affidarsi al
  percorso di risveglio push-based quando emette output o fallisce
- usare `process` per log, stato, input o intervento quando è necessario
  ispezionare un comando in esecuzione
- se il task è più grande, preferire `sessions_spawn`; il completamento del sub-agente è
  push-based e si annuncia automaticamente al richiedente
- non fare polling di `subagents list` / `sessions_list` in un ciclo solo per attendere
  il completamento

Quando lo strumento sperimentale `update_plan` è abilitato, Strumenti indica anche al
modello di usarlo solo per lavori multi-step non banali, mantenere esattamente un passaggio
`in_progress` ed evitare di ripetere l'intero piano dopo ogni aggiornamento.

I guardrail di sicurezza nel prompt di sistema sono consultivi. Guidano il comportamento del modello ma non applicano policy. Usa policy degli strumenti, approvazioni exec, sandboxing e allowlist dei canali per l'applicazione rigida; gli operatori possono disabilitarli per progettazione.

Sui canali con schede/pulsanti di approvazione nativi, il prompt runtime ora indica
all'agente di affidarsi prima a quella UI di approvazione nativa. Dovrebbe includere un comando manuale
`/approve` solo quando il risultato dello strumento dice che le approvazioni chat non sono disponibili o
l'approvazione manuale è l'unico percorso.

## Modalità prompt

OpenClaw può renderizzare prompt di sistema più piccoli per i sub-agenti. Il runtime imposta un
`promptMode` per ogni esecuzione (non una configurazione esposta all'utente):

- `full` (predefinita): include tutte le sezioni sopra.
- `minimal`: usata per i sub-agenti; omette **Skills**, **Richiamo memoria**, **Auto-aggiornamento OpenClaw**,
  **Alias modello**, **Identità utente**, **Tag di risposta**,
  **Messaggistica**, **Risposte silenziose** e **Heartbeats**. Strumenti, **Sicurezza**,
  Workspace, Sandbox, Data e ora correnti (quando note), Runtime e contesto iniettato
  restano disponibili.
- `none`: restituisce solo la riga di identità di base.

Quando `promptMode=minimal`, i prompt extra iniettati sono etichettati **Contesto subagente**
invece di **Contesto chat di gruppo**.

Per le esecuzioni di risposta automatica del canale, OpenClaw può omettere la sezione generica **Risposte silenziose**
quando il contesto di chat diretta/gruppo include già il comportamento `NO_REPLY`
specifico della conversazione risolto. Questo evita di ripetere la meccanica dei token
sia nel prompt di sistema globale sia nel contesto del canale.

## Snapshot dei prompt

OpenClaw mantiene snapshot dei prompt committati per il percorso felice del runtime Codex in
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Renderizzano
parametri selezionati di thread/turn del server app più uno stack ricostruito di livelli di prompt associati al modello
per turni Telegram diretti, gruppi Discord e Heartbeat. Quello stack
include un fixture fissato del prompt modello Codex `gpt-5.5` generato dalla forma del catalogo/cache
dei modelli di Codex, il testo developer dei permessi del percorso felice Codex,
le istruzioni developer di OpenClaw, istruzioni di modalità collaborazione con ambito di turno
quando OpenClaw le fornisce, input del turno utente e riferimenti alle specifiche dinamiche degli strumenti.

Aggiorna il fixture fissato del prompt modello Codex con
`pnpm prompt:snapshots:sync-codex-model`. Per impostazione predefinita, lo script cerca
la cache runtime di Codex in `$CODEX_HOME/models_cache.json`, poi
`~/.codex/models_cache.json`, e solo dopo ricorre alla convenzione del checkout Codex del maintainer
in `~/code/codex/codex-rs/models-manager/models.json`. Se
nessuna di queste fonti esiste, il comando termina senza modificare il fixture
committato. Passa `--catalog <path>` per aggiornare da un file specifico `models_cache.json`
o `models.json`.

Questi snapshot non sono ancora una cattura grezza byte-per-byte della richiesta OpenAI. Codex
può aggiungere contesto del workspace di proprietà del runtime come `AGENTS.md`, contesto
dell'ambiente, memorie, istruzioni di app/plugin e istruzioni integrate Default
di modalità collaborazione all'interno del runtime Codex dopo che OpenClaw invia
i parametri di thread e turno.

Rigenerali con `pnpm prompt:snapshots:gen` e verifica la deriva con
`pnpm prompt:snapshots:check`. La CI esegue il controllo della deriva nello shard
di limite aggiuntivo, così modifiche dei prompt e aggiornamenti degli snapshot restano collegati alla stessa
PR.

## Iniezione bootstrap del workspace

I file bootstrap vengono ridotti e aggiunti sotto **Contesto del progetto** così il modello vede contesto di identità e profilo senza bisogno di letture esplicite:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo su workspace nuovi)
- `MEMORY.md` quando presente

Tutti questi file vengono **iniettati nella finestra di contesto** a ogni turno salvo che
si applichi un gate specifico del file. `HEARTBEAT.md` viene omesso nelle esecuzioni normali quando
gli Heartbeat sono disabilitati per l'agente predefinito o
`agents.defaults.heartbeat.includeSystemPromptSection` è false. Mantieni concisi i file
iniettati — specialmente `MEMORY.md`, che può crescere nel tempo e portare a
un uso del contesto inaspettatamente alto e a Compaction più frequenti.

Quando una sessione viene eseguita sull'harness Codex nativo, Codex carica `AGENTS.md`
tramite la propria individuazione dei documenti di progetto. OpenClaw risolve comunque i restanti
file bootstrap e li inoltra come istruzioni di configurazione Codex, quindi `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` e
`MEMORY.md` mantengono lo stesso ruolo di contesto del workspace senza duplicare
`AGENTS.md`.

<Note>
I file giornalieri `memory/*.md` **non** fanno parte del normale Contesto del progetto bootstrap. Nei turni ordinari sono accessibili su richiesta tramite gli strumenti `memory_search` e `memory_get`, quindi non contano contro la finestra di contesto salvo che il modello li legga esplicitamente. I turni bare `/new` e `/reset` sono l'eccezione: il runtime può anteporre memoria giornaliera recente come blocco una tantum di contesto di avvio per quel primo turno.
</Note>

I file grandi vengono troncati con un marker. La dimensione massima per file è controllata da
`agents.defaults.bootstrapMaxChars` (predefinito: 12000). Il contenuto bootstrap totale iniettato
tra i file è limitato da `agents.defaults.bootstrapTotalMaxChars`
(predefinito: 60000). I file mancanti iniettano un breve marker di file mancante. Quando si verifica il troncamento,
OpenClaw può iniettare un blocco di avviso in Contesto del progetto; controllalo con
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
predefinito: `once`).

Le sessioni sub-agente iniettano solo `AGENTS.md` e `TOOLS.md` (gli altri file bootstrap
sono filtrati per mantenere piccolo il contesto del sub-agente).

Gli hook interni possono intercettare questo passaggio tramite `agent:bootstrap` per mutare o sostituire
i file bootstrap iniettati (per esempio sostituendo `SOUL.md` con una persona alternativa).

Se vuoi rendere l'agente meno generico, inizia con
[Guida alla personalità SOUL.md](/it/concepts/soul).

Per ispezionare quanto contribuisce ogni file iniettato (grezzo vs iniettato, troncamento, più overhead dello schema strumenti), usa `/context list` o `/context detail`. Vedi [Contesto](/it/concepts/context).

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

Vedi [Data e ora](/it/date-time) per i dettagli completi del comportamento.

## Skills

Quando esistono skill idonee, OpenClaw inietta una **lista compatta delle skill disponibili**
(`formatSkillsForPrompt`) che include il **percorso del file** per ogni skill. Il
prompt istruisce il modello a usare `read` per caricare lo SKILL.md nella
posizione elencata (workspace, gestita o inclusa). Se nessuna skill è idonea, la
sezione Skills viene omessa.

L'idoneità include gate dei metadati delle skill, controlli di ambiente/configurazione runtime
e la allowlist efficace delle skill dell'agente quando `agents.defaults.skills` o
`agents.list[].skills` è configurato.

Le skill incluse nei plugin sono idonee solo quando il plugin proprietario è abilitato.
Questo consente ai plugin di strumenti di esporre guide operative più approfondite senza incorporare tutte
quelle linee guida direttamente in ogni descrizione degli strumenti.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Questo mantiene piccolo il prompt di base, pur abilitando l'uso mirato delle skill.

Il budget della lista delle skill è di proprietà del sottosistema delle skill:

- Predefinito globale: `skills.limits.maxSkillsPromptChars`
- Override per agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Gli estratti generici limitati del runtime usano una superficie diversa:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Questa separazione mantiene il dimensionamento delle Skills separato dal dimensionamento della lettura/iniezione del runtime, come `memory_get`, i risultati live degli strumenti e gli aggiornamenti di AGENTS.md post-Compaction.

## Documentazione

Il prompt di sistema include una sezione **Documentazione**. Quando la documentazione locale è disponibile, punta alla directory locale della documentazione di OpenClaw (`docs/` in un checkout Git o nella documentazione del pacchetto npm incluso). Se la documentazione locale non è disponibile, ripiega su [https://docs.openclaw.ai](https://docs.openclaw.ai).

La stessa sezione include anche la posizione del sorgente di OpenClaw. I checkout Git espongono la root locale del sorgente in modo che l'agente possa ispezionare direttamente il codice. Le installazioni del pacchetto includono l'URL del sorgente GitHub e indicano all'agente di esaminare lì il sorgente ogni volta che la documentazione è incompleta o obsoleta. Il prompt segnala anche il mirror pubblico della documentazione, il Discord della community e ClawHub ([https://clawhub.ai](https://clawhub.ai)) per la scoperta delle Skills. Indica al modello di consultare prima la documentazione per il comportamento, i comandi, la configurazione o l'architettura di OpenClaw, e di eseguire `openclaw status` autonomamente quando possibile (chiedendo all'utente solo quando non ha accesso). Per la configurazione in particolare, indirizza gli agenti all'azione dello strumento `gateway` `config.schema.lookup` per la documentazione e i vincoli esatti a livello di campo, quindi a `docs/gateway/configuration.md` e `docs/gateway/configuration-reference.md` per indicazioni più ampie.

## Correlati

- [Runtime dell'agente](/it/concepts/agent)
- [Workspace dell'agente](/it/concepts/agent-workspace)
- [Motore di contesto](/it/concepts/context-engine)
