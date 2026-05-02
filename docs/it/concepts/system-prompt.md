---
read_when:
    - Modifica del testo del prompt di sistema, dell'elenco degli strumenti o delle sezioni relative al tempo/Heartbeat
    - Modifica dell'inizializzazione dell'area di lavoro o del comportamento di iniezione delle Skills
summary: Cosa contiene il prompt di sistema di OpenClaw e come viene assemblato
title: Prompt di sistema
x-i18n:
    generated_at: "2026-05-02T20:44:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56b29c354ea4b3f48fd7279614677905b3065bc0afa6741fb4273ef229e8cebb
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw costruisce un prompt di sistema personalizzato per ogni esecuzione dell'agente. Il prompt è **di proprietà di OpenClaw** e non usa il prompt predefinito di pi-coding-agent.

Il prompt viene assemblato da OpenClaw e iniettato in ogni esecuzione dell'agente.

I Plugin provider possono contribuire con indicazioni per il prompt sensibili alla cache senza sostituire
l'intero prompt di proprietà di OpenClaw. Il runtime del provider può:

- sostituire un piccolo insieme di sezioni core denominate (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- iniettare un **prefisso stabile** sopra il confine della cache del prompt
- iniettare un **suffisso dinamico** sotto il confine della cache del prompt

Usa i contributi di proprietà del provider per la regolazione specifica della famiglia di modelli. Mantieni la mutazione legacy del prompt
`before_prompt_build` per compatibilità o modifiche del prompt davvero globali,
non per il comportamento normale del provider.

L'overlay della famiglia OpenAI GPT-5 mantiene ridotta la regola di esecuzione core e aggiunge
indicazioni specifiche del modello per l'aggancio della persona, output conciso, disciplina degli strumenti,
ricerca parallela, copertura dei deliverable, verifica, contesto mancante e
igiene degli strumenti terminale.

## Struttura

Il prompt è intenzionalmente compatto e usa sezioni fisse:

- **Strumenti**: promemoria della fonte autorevole degli strumenti strutturati più indicazioni runtime sull'uso degli strumenti.
- **Bias di esecuzione**: indicazioni compatte per il completamento: agire nel turno sulle
  richieste eseguibili, continuare fino al completamento o al blocco, recuperare da risultati deboli degli strumenti,
  controllare live lo stato mutevole e verificare prima di finalizzare.
- **Sicurezza**: breve promemoria sui guardrail per evitare comportamenti di ricerca del potere o aggiramento della supervisione.
- **Skills** (quando disponibili): indica al modello come caricare le istruzioni delle skill su richiesta.
- **Auto-aggiornamento di OpenClaw**: come ispezionare la configurazione in modo sicuro con
  `config.schema.lookup`, applicare patch alla configurazione con `config.patch`, sostituire l'intera
  configurazione con `config.apply` ed eseguire `update.run` solo su richiesta esplicita dell'utente.
  Anche lo strumento `gateway`, riservato al proprietario, rifiuta di riscrivere
  `tools.exec.ask` / `tools.exec.security`, inclusi gli alias legacy `tools.bash.*`
  che si normalizzano in quei percorsi exec protetti.
- **Workspace**: directory di lavoro (`agents.defaults.workspace`).
- **Documentazione**: percorso locale alla documentazione di OpenClaw (repo o pacchetto npm) e quando leggerla.
- **File del workspace (iniettati)**: indica che i file di bootstrap sono inclusi sotto.
- **Sandbox** (quando abilitata): indica runtime in sandbox, percorsi sandbox e se è disponibile exec elevato.
- **Data e ora correnti**: ora locale dell'utente, fuso orario e formato dell'ora.
- **Tag di risposta**: sintassi opzionale dei tag di risposta per i provider supportati.
- **Heartbeat**: prompt heartbeat e comportamento ack, quando gli Heartbeat sono abilitati per l'agente predefinito.
- **Runtime**: host, OS, node, modello, root del repo (quando rilevata), livello di ragionamento (una riga).
- **Ragionamento**: livello di visibilità corrente + suggerimento per l'interruttore /reasoning.

OpenClaw mantiene i contenuti ampi e stabili, inclusi **Contesto del progetto**, sopra il
confine interno della cache del prompt. Le sezioni volatili di canale/sessione come
la guida di incorporamento della Control UI, **Messaggistica**, **Voce**, **Contesto della chat di gruppo**,
**Reazioni**, **Heartbeat** e **Runtime** vengono aggiunte sotto quel confine
così i backend locali con cache del prefisso possono riutilizzare il prefisso stabile del workspace
tra i turni del canale. Anche le descrizioni degli strumenti dovrebbero evitare di incorporare i nomi
dei canali correnti quando lo schema accettato contiene già quel dettaglio runtime.

La sezione Strumenti include anche indicazioni runtime per lavori di lunga durata:

- usare Cron per follow-up futuri (`check back later`, promemoria, lavori ricorrenti)
  invece di cicli di sleep con `exec`, trucchi di ritardo `yieldMs` o polling ripetuto di `process`
- usare `exec` / `process` solo per comandi che iniziano ora e continuano a essere eseguiti
  in background
- quando il risveglio automatico al completamento è abilitato, avviare il comando una sola volta e affidarsi al
  percorso di risveglio push-based quando emette output o fallisce
- usare `process` per log, stato, input o intervento quando devi
  ispezionare un comando in esecuzione
- se il compito è più grande, preferire `sessions_spawn`; il completamento del sub-agente è
  push-based e si auto-annuncia al richiedente
- non eseguire polling di `subagents list` / `sessions_list` in ciclo solo per attendere
  il completamento

Quando lo strumento sperimentale `update_plan` è abilitato, Strumenti indica anche al
modello di usarlo solo per lavori non banali a più passaggi, mantenere esattamente un passaggio
`in_progress` ed evitare di ripetere l'intero piano dopo ogni aggiornamento.

I guardrail di sicurezza nel prompt di sistema sono consultivi. Guidano il comportamento del modello ma non applicano criteri. Usa criteri degli strumenti, approvazioni exec, sandboxing e allowlist dei canali per l'applicazione rigida; gli operatori possono disabilitarli intenzionalmente.

Sui canali con schede/pulsanti di approvazione nativi, il prompt runtime ora dice
all'agente di affidarsi prima a quella UI di approvazione nativa. Dovrebbe includere un comando manuale
`/approve` solo quando il risultato dello strumento dice che le approvazioni chat non sono disponibili o
che l'approvazione manuale è l'unico percorso.

## Modalità del prompt

OpenClaw può renderizzare prompt di sistema più piccoli per i sub-agenti. Il runtime imposta una
`promptMode` per ogni esecuzione (non una configurazione esposta all'utente):

- `full` (predefinita): include tutte le sezioni sopra.
- `minimal`: usata per i sub-agenti; omette **Skills**, **Richiamo memoria**, **Auto-aggiornamento di OpenClaw**,
  **Alias del modello**, **Identità utente**, **Tag di risposta**,
  **Messaggistica**, **Risposte silenziose** e **Heartbeat**. Strumenti, **Sicurezza**,
  Workspace, Sandbox, Data e ora correnti (quando note), Runtime e il contesto iniettato
  restano disponibili.
- `none`: restituisce solo la riga di identità di base.

Quando `promptMode=minimal`, i prompt aggiuntivi iniettati sono etichettati **Contesto del subagente**
invece di **Contesto della chat di gruppo**.

Per le esecuzioni di risposta automatica del canale, OpenClaw può omettere la sezione generica **Risposte silenziose**
quando il contesto della chat diretta/di gruppo include già il comportamento `NO_REPLY`
specifico della conversazione risolto. Questo evita di ripetere la meccanica dei token
sia nel prompt di sistema globale sia nel contesto del canale.

## Snapshot del prompt

OpenClaw mantiene snapshot del prompt del percorso felice committati per il runtime
Codex/strumento di messaggistica in `test/fixtures/agents/prompt-snapshots/happy-path/`. Renderizzano
le istruzioni per sviluppatori dell'app-server Codex di proprietà di OpenClaw, i parametri selezionati
di avvio/ripresa del thread, l'input utente del turno e le specifiche dinamiche degli strumenti per turni diretti Telegram,
gruppo Discord e heartbeat. Il prompt di sistema base nascosto di Codex e
le istruzioni di modalità di collaborazione Codex con ambito al turno sono di proprietà del runtime Codex
e non sono renderizzati da OpenClaw.

Rigenerali con `pnpm prompt:snapshots:gen` e verifica le deviazioni con
`pnpm prompt:snapshots:check`.

## Iniezione del bootstrap del workspace

I file di bootstrap sono ridotti e aggiunti sotto **Contesto del progetto** così il modello vede il contesto di identità e profilo senza richiedere letture esplicite:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo nei workspace completamente nuovi)
- `MEMORY.md` quando presente

Tutti questi file sono **iniettati nella finestra di contesto** a ogni turno, a meno che
non si applichi un gate specifico del file. `HEARTBEAT.md` è omesso nelle esecuzioni normali quando
gli heartbeat sono disabilitati per l'agente predefinito o
`agents.defaults.heartbeat.includeSystemPromptSection` è false. Mantieni concisi i file
iniettati, soprattutto `MEMORY.md`, che può crescere nel tempo e portare a
un uso del contesto inaspettatamente elevato e a compaction più frequenti.

<Note>
I file giornalieri `memory/*.md` **non** fanno parte del normale Contesto del progetto di bootstrap. Nei turni ordinari vi si accede su richiesta tramite gli strumenti `memory_search` e `memory_get`, quindi non contano contro la finestra di contesto a meno che il modello non li legga esplicitamente. I turni bare `/new` e `/reset` sono l'eccezione: il runtime può anteporre la memoria giornaliera recente come blocco di contesto di avvio una tantum per quel primo turno.
</Note>

I file grandi vengono troncati con un marker. La dimensione massima per file è controllata da
`agents.defaults.bootstrapMaxChars` (predefinito: 12000). Il contenuto totale di bootstrap iniettato
tra i file è limitato da `agents.defaults.bootstrapTotalMaxChars`
(predefinito: 60000). I file mancanti iniettano un breve marker di file mancante. Quando si verifica il troncamento,
OpenClaw può iniettare un blocco di avviso nel Contesto del progetto; controllalo con
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
predefinito: `once`).

Le sessioni dei sub-agenti iniettano solo `AGENTS.md` e `TOOLS.md` (gli altri file di bootstrap
vengono filtrati per mantenere piccolo il contesto del sub-agente).

Gli hook interni possono intercettare questo passaggio tramite `agent:bootstrap` per mutare o sostituire
i file di bootstrap iniettati (per esempio sostituendo `SOUL.md` con una persona alternativa).

Se vuoi rendere il suono dell'agente meno generico, inizia da
[Guida alla personalità di SOUL.md](/it/concepts/soul).

Per ispezionare quanto contribuisce ogni file iniettato (grezzo vs iniettato, troncamento, più overhead dello schema degli strumenti), usa `/context list` o `/context detail`. Vedi [Contesto](/it/concepts/context).

## Gestione del tempo

Il prompt di sistema include una sezione dedicata **Data e ora correnti** quando il
fuso orario dell'utente è noto. Per mantenere stabile la cache del prompt, ora include solo
il **fuso orario** (nessun orologio dinamico o formato dell'ora).

Usa `session_status` quando l'agente ha bisogno dell'ora corrente; la scheda di stato
include una riga timestamp. Lo stesso strumento può opzionalmente impostare un override del modello per sessione
(`model=default` lo cancella).

Configura con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Vedi [Data e ora](/it/date-time) per tutti i dettagli del comportamento.

## Skills

Quando esistono skill idonee, OpenClaw inietta un elenco compatto di **skill disponibili**
(`formatSkillsForPrompt`) che include il **percorso del file** per ogni skill. Il
prompt istruisce il modello a usare `read` per caricare lo SKILL.md nella posizione elencata
(workspace, gestita o inclusa). Se nessuna skill è idonea, la sezione
Skills viene omessa.

L'idoneità include gate dei metadati della skill, controlli dell'ambiente/configurazione runtime
e l'allowlist effettiva delle skill dell'agente quando `agents.defaults.skills` o
`agents.list[].skills` è configurato.

Le skill incluse nei Plugin sono idonee solo quando il Plugin proprietario è abilitato.
Questo consente ai Plugin di strumenti di esporre guide operative più approfondite senza incorporare tutta
quella guida direttamente in ogni descrizione dello strumento.

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

Il budget dell'elenco delle skill è di proprietà del sottosistema delle skill:

- Predefinito globale: `skills.limits.maxSkillsPromptChars`
- Override per agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Gli estratti runtime generici delimitati usano una superficie diversa:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Questa separazione mantiene il dimensionamento delle skill separato dal dimensionamento di lettura/iniezione runtime, come
`memory_get`, risultati live degli strumenti e refresh post-compaction di AGENTS.md.

## Documentazione

Il prompt di sistema include una sezione **Documentazione**. Quando la documentazione locale è disponibile,
punta alla directory locale della documentazione di OpenClaw (`docs/` in un checkout Git o la documentazione del pacchetto npm
incluso). Se la documentazione locale non è disponibile, ripiega su
[https://docs.openclaw.ai](https://docs.openclaw.ai).

La stessa sezione include anche la posizione del sorgente di OpenClaw. I checkout Git espongono la root
locale del sorgente così l'agente può ispezionare direttamente il codice. Le installazioni da pacchetto includono l'URL
del sorgente GitHub e indicano all'agente di esaminare lì il sorgente ogni volta che la documentazione è incompleta o
obsoleta. Il prompt nota anche il mirror pubblico della documentazione, il Discord della community e ClawHub
([https://clawhub.ai](https://clawhub.ai)) per la scoperta delle skill. Dice al modello di
consultare prima la documentazione per comportamento, comandi, configurazione o architettura di OpenClaw, e di
eseguire `openclaw status` autonomamente quando possibile (chiedendo all'utente solo quando non ha accesso).
Per la configurazione in particolare, indirizza gli agenti all'azione dello strumento `gateway`
`config.schema.lookup` per documentazione e vincoli esatti a livello di campo, poi a
`docs/gateway/configuration.md` e `docs/gateway/configuration-reference.md`
per indicazioni più ampie.

## Correlati

- [Runtime dell'agente](/it/concepts/agent)
- [Workspace dell'agente](/it/concepts/agent-workspace)
- [Motore di contesto](/it/concepts/context-engine)
