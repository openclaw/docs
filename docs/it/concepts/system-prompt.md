---
read_when:
    - Modifica del testo del prompt di sistema, dell'elenco degli strumenti o delle sezioni relative a ora/Heartbeat
    - Modifica del comportamento di inizializzazione dell'area di lavoro o di iniezione delle Skills
summary: Cosa contiene il prompt di sistema di OpenClaw e come viene assemblato
title: Prompt di sistema
x-i18n:
    generated_at: "2026-05-06T08:48:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73c20ed6a181c0a791147d67008ebdd6f8b8651ea4c43a7797931a682694bf96
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw crea un prompt di sistema personalizzato per ogni esecuzione dell’agente. Il prompt è **di proprietà di OpenClaw** e non usa il prompt predefinito di pi-coding-agent.

Il prompt viene assemblato da OpenClaw e iniettato in ogni esecuzione dell’agente.

I Plugin provider possono contribuire linee guida per il prompt consapevoli della cache senza sostituire
l’intero prompt di proprietà di OpenClaw. Il runtime del provider può:

- sostituire un piccolo insieme di sezioni core denominate (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- iniettare un **prefisso stabile** sopra il confine della cache del prompt
- iniettare un **suffisso dinamico** sotto il confine della cache del prompt

Usa contributi di proprietà del provider per la regolazione specifica della famiglia di modelli. Mantieni la mutazione del prompt legacy
`before_prompt_build` per compatibilità o per modifiche del prompt davvero globali,
non per il comportamento normale del provider.

L’overlay della famiglia OpenAI GPT-5 mantiene piccola la regola di esecuzione core e aggiunge
linee guida specifiche del modello per aggancio della persona, output conciso, disciplina degli strumenti,
ricerca parallela, copertura dei deliverable, verifica, contesto mancante e
igiene degli strumenti da terminale.

## Struttura

Il prompt è intenzionalmente compatto e usa sezioni fisse:

- **Strumenti**: promemoria sulla fonte di verità degli strumenti strutturati più indicazioni runtime sull’uso degli strumenti.
- **Tendenza di esecuzione**: indicazioni compatte sul portare a termine: agire nel turno sulle
  richieste azionabili, continuare fino al completamento o al blocco, recuperare da risultati deboli degli strumenti,
  controllare dal vivo lo stato mutevole e verificare prima di finalizzare.
- **Sicurezza**: breve promemoria di guardrail per evitare comportamenti orientati all’acquisizione di potere o l’elusione della supervisione.
- **Skills** (quando disponibili): indica al modello come caricare le istruzioni delle skill su richiesta.
- **Auto-aggiornamento OpenClaw**: come ispezionare la configurazione in sicurezza con
  `config.schema.lookup`, applicare patch alla configurazione con `config.patch`, sostituire l’intera
  configurazione con `config.apply` ed eseguire `update.run` solo su richiesta esplicita
  dell’utente. Anche lo strumento `gateway` riservato al proprietario rifiuta di riscrivere
  `tools.exec.ask` / `tools.exec.security`, inclusi gli alias legacy `tools.bash.*`
  che si normalizzano in quei percorsi exec protetti.
- **Workspace**: directory di lavoro (`agents.defaults.workspace`).
- **Documentazione**: percorso locale alla documentazione OpenClaw (repository o pacchetto npm) e quando leggerla.
- **File del workspace (iniettati)**: indica che i file di bootstrap sono inclusi sotto.
- **Sandbox** (quando abilitata): indica runtime in sandbox, percorsi sandbox e se exec elevato è disponibile.
- **Data e ora correnti**: solo fuso orario (stabile per la cache; l’orologio live proviene da `session_status`).
- **Tag di risposta**: sintassi opzionale dei tag di risposta per i provider supportati.
- **Heartbeats**: prompt Heartbeat e comportamento di ack, quando gli Heartbeat sono abilitati per l’agente predefinito.
- **Runtime**: host, sistema operativo, node, modello, radice del repository (quando rilevata), livello di ragionamento (una riga).
- **Ragionamento**: livello di visibilità corrente + suggerimento per l’interruttore /reasoning.

OpenClaw mantiene i grandi contenuti stabili, incluso **Contesto del progetto**, sopra il
confine interno della cache del prompt. Le sezioni volatili di canale/sessione come
linee guida di incorporamento della Control UI, **Messaggistica**, **Voce**, **Contesto della chat di gruppo**,
**Reazioni**, **Heartbeats** e **Runtime** vengono aggiunte sotto quel confine,
così i backend locali con cache del prefisso possono riutilizzare il prefisso stabile del workspace
tra i turni del canale. Anche le descrizioni degli strumenti dovrebbero evitare di incorporare i nomi correnti
dei canali quando lo schema accettato contiene già quel dettaglio runtime.

La sezione Strumenti include anche indicazioni runtime per lavori di lunga durata:

- usa cron per follow-up futuri (`check back later`, promemoria, lavori ricorrenti)
  invece di cicli di sleep con `exec`, trucchi di ritardo `yieldMs` o polling ripetuto di `process`
- usa `exec` / `process` solo per comandi che partono ora e continuano a girare
  in background
- quando il risveglio automatico al completamento è abilitato, avvia il comando una volta e affidati al
  percorso di risveglio push-based quando emette output o fallisce
- usa `process` per log, stato, input o intervento quando devi
  ispezionare un comando in esecuzione
- se il task è più grande, preferisci `sessions_spawn`; il completamento dei sub-agenti è
  push-based e si annuncia automaticamente al richiedente
- non eseguire il polling di `subagents list` / `sessions_list` in un ciclo solo per attendere il
  completamento

Quando lo strumento sperimentale `update_plan` è abilitato, Strumenti indica inoltre al
modello di usarlo solo per lavori multi-step non banali, mantenere esattamente un passo
`in_progress` ed evitare di ripetere l’intero piano dopo ogni aggiornamento.

I guardrail di sicurezza nel prompt di sistema sono consultivi. Guidano il comportamento del modello ma non applicano una policy. Usa policy degli strumenti, approvazioni exec, sandboxing e allowlist dei canali per l’applicazione rigida; gli operatori possono disabilitarli per progettazione.

Sui canali con schede/pulsanti di approvazione nativi, il prompt runtime ora indica
all’agente di affidarsi prima a quella UI di approvazione nativa. Dovrebbe includere un comando manuale
`/approve` solo quando il risultato dello strumento dice che le approvazioni in chat non sono disponibili o
che l’approvazione manuale è l’unico percorso.

## Modalità del prompt

OpenClaw può generare prompt di sistema più piccoli per i sub-agenti. Il runtime imposta una
`promptMode` per ogni esecuzione (non è una configurazione esposta all’utente):

- `full` (predefinita): include tutte le sezioni sopra.
- `minimal`: usata per i sub-agenti; omette **Skills**, **Richiamo memoria**, **Auto-aggiornamento OpenClaw
  **, **Alias dei modelli**, **Identità utente**, **Tag di risposta**,
  **Messaggistica**, **Risposte silenziose** e **Heartbeats**. Strumenti, **Sicurezza**,
  Workspace, Sandbox, Data e ora correnti (quando note), Runtime e contesto iniettato
  restano disponibili.
- `none`: restituisce solo la riga di identità di base.

Quando `promptMode=minimal`, i prompt iniettati extra sono etichettati **Contesto del subagente
** invece di **Contesto della chat di gruppo**.

Per le esecuzioni di risposta automatica del canale, OpenClaw può omettere la sezione generica **Risposte silenziose**
quando il contesto della chat diretta/di gruppo include già il comportamento `NO_REPLY`
specifico della conversazione risolto. Questo evita di ripetere la meccanica dei token
sia nel prompt di sistema globale sia nel contesto del canale.

## Snapshot dei prompt

OpenClaw mantiene snapshot dei prompt versionati per il percorso felice del runtime Codex sotto
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Generano
parametri selezionati di thread/turn dell’app-server più uno stack di layer del prompt legato al modello ricostruito
per turni Telegram diretti, gruppi Discord e Heartbeat. Quello stack
include una fixture del prompt del modello Codex `gpt-5.5` fissata, generata dalla forma
del catalogo/cache dei modelli di Codex, il testo developer dei permessi del percorso felice Codex,
le istruzioni developer di OpenClaw, le istruzioni in ambito turno della modalità di collaborazione
quando OpenClaw le fornisce, l’input del turno utente e riferimenti alle specifiche dinamiche degli strumenti.

Aggiorna la fixture fissata del prompt del modello Codex con
`pnpm prompt:snapshots:sync-codex-model`. Per impostazione predefinita, lo script cerca
la cache runtime di Codex in `$CODEX_HOME/models_cache.json`, poi
`~/.codex/models_cache.json` e solo dopo ripiega sulla convenzione del checkout Codex del maintainer
in `~/code/codex/codex-rs/models-manager/models.json`. Se
nessuna di queste fonti esiste, il comando termina senza modificare la fixture
versionata. Passa `--catalog <path>` per aggiornare da un file `models_cache.json`
o `models.json` specifico.

Questi snapshot non sono ancora una cattura raw byte-per-byte di una richiesta OpenAI. Codex
può aggiungere contesto del workspace di proprietà del runtime come `AGENTS.md`, contesto
dell’ambiente, memorie, istruzioni di app/plugin e istruzioni integrate Default
della modalità di collaborazione dentro il runtime Codex dopo che OpenClaw invia
i parametri di thread e turno.

Rigenerali con `pnpm prompt:snapshots:gen` e verifica il drift con
`pnpm prompt:snapshots:check`. La CI esegue il controllo di drift nello shard
di confine aggiuntivo, così modifiche del prompt e aggiornamenti degli snapshot restano collegati alla stessa
PR.

## Iniezione bootstrap del workspace

I file di bootstrap vengono ridotti e aggiunti sotto **Contesto del progetto** così il modello vede il contesto di identità e profilo senza dover fare letture esplicite:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo su workspace appena creati)
- `MEMORY.md` quando presente

Tutti questi file vengono **iniettati nella finestra di contesto** a ogni turno, salvo
applicazione di un gate specifico del file. `HEARTBEAT.md` viene omesso nelle esecuzioni normali quando
gli Heartbeat sono disabilitati per l’agente predefinito o
`agents.defaults.heartbeat.includeSystemPromptSection` è false. Mantieni concisi i file
iniettati — specialmente `MEMORY.md`, che può crescere nel tempo e portare a
un uso del contesto inaspettatamente alto e a Compaction più frequente.

Quando una sessione gira sull’harness Codex nativo, Codex carica `AGENTS.md`
tramite la propria discovery dei documenti di progetto. OpenClaw risolve comunque i restanti
file di bootstrap e li inoltra come istruzioni di configurazione Codex, quindi `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` e
`MEMORY.md` mantengono lo stesso ruolo di contesto del workspace senza duplicare
`AGENTS.md`.

<Note>
I file giornalieri `memory/*.md` **non** fanno parte del normale Contesto del progetto di bootstrap. Nei turni ordinari sono accessibili su richiesta tramite gli strumenti `memory_search` e `memory_get`, quindi non contano contro la finestra di contesto a meno che il modello non li legga esplicitamente. I turni bare `/new` e `/reset` sono l’eccezione: il runtime può anteporre memoria giornaliera recente come blocco di contesto di avvio one-shot per quel primo turno.
</Note>

I file grandi vengono troncati con un marcatore. La dimensione massima per file è controllata da
`agents.defaults.bootstrapMaxChars` (predefinito: 12000). Il contenuto bootstrap totale iniettato
tra i file è limitato da `agents.defaults.bootstrapTotalMaxChars`
(predefinito: 60000). I file mancanti iniettano un breve marcatore di file mancante. Quando avviene il troncamento,
OpenClaw può iniettare un avviso conciso nel prompt di sistema; controllalo con
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
predefinito: `once`). I conteggi raw/iniettati dettagliati restano nella diagnostica come
`/context`, `/status`, doctor e log.

Le sessioni dei sub-agenti iniettano solo `AGENTS.md` e `TOOLS.md` (gli altri file di bootstrap
vengono filtrati per mantenere piccolo il contesto del sub-agente).

Gli hook interni possono intercettare questo passaggio tramite `agent:bootstrap` per mutare o sostituire
i file bootstrap iniettati (per esempio scambiando `SOUL.md` con una persona alternativa).

Se vuoi rendere l’agente meno generico, inizia con
[Guida alla personalità SOUL.md](/it/concepts/soul).

Per ispezionare quanto contribuisce ogni file iniettato (raw vs iniettato, troncamento, più overhead dello schema degli strumenti), usa `/context list` o `/context detail`. Vedi [Contesto](/it/concepts/context).

## Gestione del tempo

Il prompt di sistema include una sezione dedicata **Data e ora correnti** quando il
fuso orario dell’utente è noto. Per mantenere stabile la cache del prompt, ora include solo
il **fuso orario** (nessun orologio dinamico o formato dell’ora).

Usa `session_status` quando l’agente ha bisogno dell’ora corrente; la scheda di stato
include una riga con timestamp. Lo stesso strumento può opzionalmente impostare un override del modello per sessione
(`model=default` lo cancella).

Configura con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Vedi [Data e ora](/it/date-time) per i dettagli completi del comportamento.

## Skills

Quando esistono skill idonee, OpenClaw inietta un compatto **elenco delle skill disponibili**
(`formatSkillsForPrompt`) che include il **percorso del file** per ogni skill. Il
prompt istruisce il modello a usare `read` per caricare SKILL.md nella posizione elencata
(workspace, gestita o integrata). Se nessuna skill è idonea, la sezione
Skills viene omessa.

L’idoneità include gate dei metadati delle skill, controlli runtime di ambiente/configurazione
e l’allowlist effettiva delle skill dell’agente quando `agents.defaults.skills` o
`agents.list[].skills` è configurato.

Le skill integrate nei Plugin sono idonee solo quando il Plugin proprietario è abilitato.
Questo consente ai Plugin di strumenti di esporre guide operative più profonde senza incorporare tutte
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

Questo mantiene piccolo il prompt di base pur abilitando l’uso mirato delle skill.

Il budget dell'elenco Skills è gestito dal sottosistema Skills:

- Valore predefinito globale: `skills.limits.maxSkillsPromptChars`
- Override per agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Gli estratti runtime generici con limite usano una superficie diversa:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Questa separazione mantiene il dimensionamento di Skills distinto dal dimensionamento di lettura/iniezione runtime, come `memory_get`, i risultati degli strumenti live e gli aggiornamenti post-Compaction di AGENTS.md.

## Documentazione

Il prompt di sistema include una sezione **Documentazione**. Quando la documentazione locale è disponibile, punta alla directory locale della documentazione di OpenClaw (`docs/` in un checkout Git o la documentazione del pacchetto npm inclusa). Se la documentazione locale non è disponibile, ripiega su [https://docs.openclaw.ai](https://docs.openclaw.ai).

La stessa sezione include anche la posizione del sorgente di OpenClaw. I checkout Git espongono la radice del sorgente locale, così l'agente può ispezionare direttamente il codice. Le installazioni da pacchetto includono l'URL del sorgente GitHub e indicano all'agente di consultare il sorgente lì ogni volta che la documentazione è incompleta o obsoleta. Il prompt annota anche il mirror pubblico della documentazione, il Discord della community e ClawHub ([https://clawhub.ai](https://clawhub.ai)) per la scoperta di Skills. Indica al modello di consultare prima la documentazione per il comportamento, i comandi, la configurazione o l'architettura di OpenClaw, e di eseguire direttamente `openclaw status` quando possibile (chiedendo all'utente solo quando non ha accesso). Per la configurazione in particolare, indirizza gli agenti all'azione dello strumento `gateway` `config.schema.lookup` per la documentazione e i vincoli esatti a livello di campo, quindi a `docs/gateway/configuration.md` e `docs/gateway/configuration-reference.md` per indicazioni più ampie.

## Correlati

- [Runtime dell'agente](/it/concepts/agent)
- [Workspace dell'agente](/it/concepts/agent-workspace)
- [Motore di contesto](/it/concepts/context-engine)
