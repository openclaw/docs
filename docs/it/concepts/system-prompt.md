---
read_when:
    - Modifica del testo del prompt di sistema, dell'elenco degli strumenti o delle sezioni relative a ora/Heartbeat
    - Modifica del comportamento di bootstrap dell'area di lavoro o di iniezione delle Skills
summary: Cosa contiene il prompt di sistema di OpenClaw e come viene assemblato
title: Prompt di sistema
x-i18n:
    generated_at: "2026-05-02T23:39:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: f8e0234453812c16cf5d273096d335049bf435ca76ade36200caf4bb344624e5
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw crea un prompt di sistema personalizzato per ogni esecuzione dell'agente. Il prompt è **di proprietà di OpenClaw** e non usa il prompt predefinito di pi-coding-agent.

Il prompt viene assemblato da OpenClaw e inserito in ogni esecuzione dell'agente.

I plugin provider possono contribuire con indicazioni per il prompt attente alla cache senza sostituire
l'intero prompt di proprietà di OpenClaw. Il runtime del provider può:

- sostituire un piccolo insieme di sezioni core denominate (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- inserire un **prefisso stabile** sopra il limite della cache del prompt
- inserire un **suffisso dinamico** sotto il limite della cache del prompt

Usa contributi di proprietà del provider per l'ottimizzazione specifica per famiglie di modelli. Mantieni la mutazione del prompt legacy
`before_prompt_build` per la compatibilità o per modifiche davvero globali al prompt,
non per il normale comportamento del provider.

L'overlay della famiglia OpenAI GPT-5 mantiene ridotta la regola di esecuzione core e aggiunge
indicazioni specifiche del modello per l'aggancio della persona, output conciso, disciplina degli strumenti,
ricerca parallela, copertura dei deliverable, verifica, contesto mancante e
igiene degli strumenti da terminale.

## Struttura

Il prompt è intenzionalmente compatto e usa sezioni fisse:

- **Strumenti**: promemoria sulla fonte di verità degli strumenti strutturati più indicazioni runtime sull'uso degli strumenti.
- **Orientamento all'esecuzione**: indicazioni compatte di completamento: agire nel turno su
  richieste eseguibili, continuare finché fatto o bloccato, recuperare da risultati deboli degli strumenti,
  controllare live lo stato mutevole e verificare prima di finalizzare.
- **Sicurezza**: breve promemoria di guardrail per evitare comportamenti di ricerca di potere o aggiramento della supervisione.
- **Skills** (quando disponibili): indica al modello come caricare le istruzioni delle Skills su richiesta.
- **Auto-aggiornamento OpenClaw**: come ispezionare la configurazione in sicurezza con
  `config.schema.lookup`, applicare patch alla configurazione con `config.patch`, sostituire l'intera
  configurazione con `config.apply` ed eseguire `update.run` solo su richiesta esplicita dell'utente.
  Anche lo strumento solo per il proprietario `gateway` rifiuta di riscrivere
  `tools.exec.ask` / `tools.exec.security`, inclusi gli alias legacy `tools.bash.*`
  che si normalizzano in questi percorsi exec protetti.
- **Workspace**: directory di lavoro (`agents.defaults.workspace`).
- **Documentazione**: percorso locale alla documentazione di OpenClaw (repo o pacchetto npm) e quando leggerla.
- **File del workspace (inseriti)**: indica che i file di bootstrap sono inclusi sotto.
- **Sandbox** (quando abilitata): indica runtime in sandbox, percorsi della sandbox e se exec elevato è disponibile.
- **Data e ora correnti**: ora locale dell'utente, fuso orario e formato orario.
- **Tag di risposta**: sintassi facoltativa dei tag di risposta per i provider supportati.
- **Heartbeat**: prompt di Heartbeat e comportamento di conferma, quando gli Heartbeat sono abilitati per l'agente predefinito.
- **Runtime**: host, sistema operativo, Node, modello, radice del repo (quando rilevata), livello di pensiero (una riga).
- **Ragionamento**: livello di visibilità corrente + suggerimento per l'interruttore /reasoning.

OpenClaw mantiene i contenuti stabili di grandi dimensioni, incluso **Contesto del progetto**, sopra il
limite interno della cache del prompt. Le sezioni volatili di canale/sessione, come
le indicazioni di incorporamento della Control UI, **Messaggistica**, **Voce**, **Contesto della chat di gruppo**,
**Reazioni**, **Heartbeat** e **Runtime**, vengono aggiunte sotto quel limite,
così i backend locali con cache di prefisso possono riutilizzare il prefisso stabile del workspace
tra i turni di canale. Anche le descrizioni degli strumenti dovrebbero evitare di incorporare i nomi correnti
dei canali quando lo schema accettato contiene già quel dettaglio runtime.

La sezione Strumenti include anche indicazioni runtime per lavori di lunga durata:

- usare Cron per follow-up futuri (`check back later`, promemoria, lavori ricorrenti)
  invece di cicli sleep di `exec`, trucchi di ritardo `yieldMs` o polling ripetuto di `process`
- usare `exec` / `process` solo per comandi che iniziano ora e continuano a essere eseguiti
  in background
- quando il risveglio automatico al completamento è abilitato, avviare il comando una sola volta e affidarsi
  al percorso di risveglio push quando emette output o non riesce
- usare `process` per log, stato, input o intervento quando è necessario
  ispezionare un comando in esecuzione
- se il compito è più grande, preferire `sessions_spawn`; il completamento del sub-agente è
  push-based e si annuncia automaticamente al richiedente
- non eseguire polling di `subagents list` / `sessions_list` in ciclo solo per attendere
  il completamento

Quando lo strumento sperimentale `update_plan` è abilitato, Strumenti indica anche al
modello di usarlo solo per lavori multi-step non banali, mantenere esattamente uno
step `in_progress` ed evitare di ripetere l'intero piano dopo ogni aggiornamento.

I guardrail di sicurezza nel prompt di sistema sono consultivi. Guidano il comportamento del modello ma non applicano policy. Usa policy degli strumenti, approvazioni exec, sandboxing e allowlist dei canali per l'applicazione rigida; gli operatori possono disabilitarli intenzionalmente.

Sui canali con schede/pulsanti di approvazione nativi, ora il prompt runtime dice
all'agente di affidarsi prima a quella UI di approvazione nativa. Dovrebbe includere un comando manuale
`/approve` solo quando il risultato dello strumento dice che le approvazioni via chat non sono disponibili o
che l'approvazione manuale è l'unico percorso.

## Modalità prompt

OpenClaw può renderizzare prompt di sistema più piccoli per i sub-agenti. Il runtime imposta una
`promptMode` per ogni esecuzione (non una configurazione visibile all'utente):

- `full` (predefinita): include tutte le sezioni sopra.
- `minimal`: usata per i sub-agenti; omette **Skills**, **Richiamo della memoria**, **Auto-aggiornamento OpenClaw
  **, **Alias dei modelli**, **Identità utente**, **Tag di risposta**,
  **Messaggistica**, **Risposte silenziose** e **Heartbeat**. Strumenti, **Sicurezza**,
  Workspace, Sandbox, Data e ora correnti (quando note), Runtime e il contesto inserito
  restano disponibili.
- `none`: restituisce solo la riga di identità di base.

Quando `promptMode=minimal`, i prompt aggiuntivi inseriti sono etichettati **Contesto del sub-agente**
invece di **Contesto della chat di gruppo**.

Per le esecuzioni di risposta automatica del canale, OpenClaw può omettere la sezione generica **Risposte silenziose**
quando il contesto della chat diretta/di gruppo include già il comportamento
`NO_REPLY` specifico della conversazione risolto. Questo evita di ripetere la meccanica dei token
sia nel prompt di sistema globale sia nel contesto del canale.

## Snapshot dei prompt

OpenClaw mantiene snapshot dei prompt tracciati per il percorso felice del runtime Codex sotto
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Renderizzano
parametri selezionati di thread/turn del server app più uno stack ricostruito di livelli di prompt vincolati al modello
per turni diretti Telegram, di gruppo Discord e Heartbeat. Quello stack
include un fixture fissato del prompt del modello Codex `gpt-5.5` generato dalla forma del catalogo/cache dei modelli di Codex,
il testo developer dei permessi del percorso felice di Codex,
le istruzioni developer di OpenClaw, l'input del turno utente e riferimenti alle specifiche dinamiche
degli strumenti.

Aggiorna il fixture fissato del prompt del modello Codex con
`pnpm prompt:snapshots:sync-codex-model`. Per impostazione predefinita, lo script cerca
la cache runtime di Codex in `$CODEX_HOME/models_cache.json`, poi in
`~/.codex/models_cache.json` e solo dopo ripiega sulla convenzione del checkout Codex del maintainer
in `~/code/codex/codex-rs/models-manager/models.json`. Se
nessuna di queste fonti esiste, il comando termina senza modificare il fixture
tracciato. Passa `--catalog <path>` per aggiornare da uno specifico file `models_cache.json`
o `models.json`.

Questi snapshot non sono comunque una cattura raw byte-per-byte della richiesta OpenAI. Codex
può aggiungere contesto del workspace di proprietà del runtime come `AGENTS.md`, contesto
dell'ambiente, memorie, istruzioni di app/plugin e future istruzioni della modalità di collaborazione
all'interno del runtime Codex dopo che OpenClaw invia i parametri di thread e turn.

Rigenerali con `pnpm prompt:snapshots:gen` e verifica la deriva con
`pnpm prompt:snapshots:check`. La CI esegue il controllo di deriva nello shard di boundary
aggiuntivo, così le modifiche ai prompt e gli aggiornamenti degli snapshot restano collegati alla stessa
PR.

## Inserimento bootstrap del workspace

I file di bootstrap vengono ridotti e aggiunti sotto **Contesto del progetto** così il modello vede il contesto di identità e profilo senza richiedere letture esplicite:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo nei workspace appena creati)
- `MEMORY.md` quando presente

Tutti questi file vengono **inseriti nella finestra di contesto** a ogni turno, salvo
un gate specifico per file. `HEARTBEAT.md` è omesso nelle esecuzioni normali quando
gli Heartbeat sono disabilitati per l'agente predefinito o
`agents.defaults.heartbeat.includeSystemPromptSection` è false. Mantieni concisi i file
inseriti, specialmente `MEMORY.md`, che può crescere nel tempo e portare a
un uso del contesto inaspettatamente elevato e a Compaction più frequente.

Quando una sessione viene eseguita sull'harness nativo di Codex, Codex carica `AGENTS.md`
tramite la propria discovery dei documenti di progetto. OpenClaw risolve comunque i restanti
file di bootstrap e li inoltra come istruzioni di configurazione Codex, così `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` e
`MEMORY.md` mantengono lo stesso ruolo di contesto del workspace senza duplicare
`AGENTS.md`.

<Note>
I file giornalieri `memory/*.md` **non** fanno parte del normale Contesto del progetto di bootstrap. Nei turni ordinari vi si accede su richiesta tramite gli strumenti `memory_search` e `memory_get`, quindi non contano nella finestra di contesto a meno che il modello non li legga esplicitamente. I turni `/new` e `/reset` senza altro sono l'eccezione: il runtime può anteporre memoria giornaliera recente come blocco di contesto di avvio una tantum per quel primo turno.
</Note>

I file grandi vengono troncati con un marker. La dimensione massima per file è controllata da
`agents.defaults.bootstrapMaxChars` (predefinito: 12000). Il contenuto bootstrap totale inserito
tra i file è limitato da `agents.defaults.bootstrapTotalMaxChars`
(predefinito: 60000). I file mancanti inseriscono un breve marker di file mancante. Quando si verifica il troncamento,
OpenClaw può inserire un blocco di avviso nel Contesto del progetto; controllalo con
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
predefinito: `once`).

Le sessioni dei sub-agenti inseriscono solo `AGENTS.md` e `TOOLS.md` (gli altri file di bootstrap
vengono filtrati per mantenere piccolo il contesto del sub-agente).

Gli hook interni possono intercettare questo step tramite `agent:bootstrap` per mutare o sostituire
i file di bootstrap inseriti (per esempio sostituendo `SOUL.md` con una persona alternativa).

Se vuoi rendere l'agente meno generico, inizia dalla
[Guida alla personalità SOUL.md](/it/concepts/soul).

Per ispezionare quanto contribuisce ogni file inserito (raw rispetto a inserito, troncamento, più overhead dello schema degli strumenti), usa `/context list` o `/context detail`. Vedi [Contesto](/it/concepts/context).

## Gestione del tempo

Il prompt di sistema include una sezione dedicata **Data e ora correnti** quando il
fuso orario dell'utente è noto. Per mantenere stabile la cache del prompt, ora include solo
il **fuso orario** (nessun orologio dinamico o formato orario).

Usa `session_status` quando l'agente ha bisogno dell'ora corrente; la scheda di stato
include una riga timestamp. Lo stesso strumento può facoltativamente impostare un override del modello per sessione
(`model=default` lo cancella).

Configura con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Vedi [Data e ora](/it/date-time) per i dettagli completi sul comportamento.

## Skills

Quando esistono Skills idonee, OpenClaw inserisce un compatto **elenco delle Skills disponibili**
(`formatSkillsForPrompt`) che include il **percorso del file** per ogni Skill. Il
prompt istruisce il modello a usare `read` per caricare lo SKILL.md nella
posizione elencata (workspace, gestita o inclusa). Se nessuna Skill è idonea, la
sezione Skills viene omessa.

L'idoneità include gate dei metadati delle Skill, controlli dell'ambiente/configurazione runtime
e l'allowlist effettiva delle Skill dell'agente quando `agents.defaults.skills` o
`agents.list[].skills` è configurato.

Le Skills incluse nei Plugin sono idonee solo quando il Plugin proprietario è abilitato.
Questo consente ai Plugin di strumenti di esporre guide operative più approfondite senza incorporare tutte
quelle indicazioni direttamente in ogni descrizione dello strumento.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Questo mantiene piccolo il prompt di base pur consentendo l'uso mirato delle Skills.

Il budget dell'elenco delle Skills è di proprietà del sottosistema Skills:

- Predefinito globale: `skills.limits.maxSkillsPromptChars`
- Override per agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Gli estratti runtime generici e limitati usano una superficie diversa:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Questa separazione mantiene il dimensionamento delle Skills distinto dal dimensionamento di lettura/iniezione a runtime, come `memory_get`, i risultati degli strumenti live e gli aggiornamenti di AGENTS.md dopo la Compaction.

## Documentazione

Il prompt di sistema include una sezione **Documentazione**. Quando la documentazione locale è disponibile, punta alla directory della documentazione locale di OpenClaw (`docs/` in un checkout Git o la documentazione inclusa nel pacchetto npm). Se la documentazione locale non è disponibile, usa come fallback [https://docs.openclaw.ai](https://docs.openclaw.ai).

La stessa sezione include anche la posizione del sorgente di OpenClaw. I checkout Git espongono la root del sorgente locale, così l’agente può ispezionare direttamente il codice. Le installazioni da pacchetto includono l’URL del sorgente GitHub e indicano all’agente di esaminare lì il sorgente ogni volta che la documentazione è incompleta o non aggiornata. Il prompt segnala anche il mirror pubblico della documentazione, il Discord della community e ClawHub ([https://clawhub.ai](https://clawhub.ai)) per la scoperta delle Skills. Indica al modello di consultare prima la documentazione per comportamento, comandi, configurazione o architettura di OpenClaw, e di eseguire autonomamente `openclaw status` quando possibile (chiedendo all’utente solo quando non dispone dell’accesso). Per la configurazione in particolare, indirizza gli agenti all’azione dello strumento `gateway` `config.schema.lookup` per la documentazione e i vincoli esatti a livello di campo, quindi a `docs/gateway/configuration.md` e `docs/gateway/configuration-reference.md` per una guida più ampia.

## Correlati

- [Runtime dell’agente](/it/concepts/agent)
- [Workspace dell’agente](/it/concepts/agent-workspace)
- [Motore di contesto](/it/concepts/context-engine)
