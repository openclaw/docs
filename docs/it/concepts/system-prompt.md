---
read_when:
    - Modificare il testo del prompt di sistema, l'elenco degli strumenti o le sezioni ora/Heartbeat
    - Modificare il bootstrap del workspace o il comportamento di iniezione di Skills
summary: Che cosa contiene il prompt di sistema di OpenClaw e come viene assemblato
title: Prompt di sistema
x-i18n:
    generated_at: "2026-04-24T08:38:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff0498b99974f1a75fc9b93ca46cc0bf008ebf234b429c05ee689a4a150d29f1
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw costruisce un prompt di sistema personalizzato per ogni esecuzione dell'agente. Il prompt è **di proprietà di OpenClaw** e non usa il prompt predefinito di pi-coding-agent.

Il prompt viene assemblato da OpenClaw e iniettato in ogni esecuzione dell'agente.

I Plugin provider possono contribuire con linee guida del prompt consapevoli della cache senza sostituire
l'intero prompt di proprietà di OpenClaw. Il runtime del provider può:

- sostituire un piccolo insieme di sezioni core con nome (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- iniettare un **prefisso stabile** sopra il confine della cache del prompt
- iniettare un **suffisso dinamico** sotto il confine della cache del prompt

Usa i contributi di proprietà del provider per la regolazione specifica della famiglia di modelli. Mantieni la mutazione legacy del prompt `before_prompt_build` per compatibilità o per modifiche davvero globali al prompt, non per il normale comportamento del provider.

L'overlay della famiglia OpenAI GPT-5 mantiene piccola la regola core di esecuzione e aggiunge
linee guida specifiche del modello per aggancio della persona, output conciso, disciplina degli strumenti,
lookup parallelo, copertura dei deliverable, verifica, contesto mancante e igiene
degli strumenti terminal.

## Struttura

Il prompt è intenzionalmente compatto e usa sezioni fisse:

- **Tooling**: promemoria della fonte di verità degli strumenti strutturati più linee guida runtime sull'uso degli strumenti.
- **Execution Bias**: linee guida compatte di follow-through: agire nel turno su
  richieste attuabili, continuare fino a completamento o blocco, recuperare da risultati deboli
  degli strumenti, controllare in tempo reale lo stato mutabile e verificare prima di finalizzare.
- **Safety**: breve promemoria di guardrail per evitare comportamenti orientati all'acquisizione di potere o all'aggiramento della supervisione.
- **Skills** (quando disponibili): indica al modello come caricare istruzioni delle Skills su richiesta.
- **OpenClaw Self-Update**: come ispezionare in sicurezza la configurazione con
  `config.schema.lookup`, applicare patch alla configurazione con `config.patch`, sostituire l'intera
  configurazione con `config.apply` ed eseguire `update.run` solo su esplicita
  richiesta dell'utente. Lo strumento `gateway`, riservato al proprietario, rifiuta anche di riscrivere
  `tools.exec.ask` / `tools.exec.security`, incluse le alias legacy `tools.bash.*`
  che vengono normalizzate a quei percorsi exec protetti.
- **Workspace**: directory di lavoro (`agents.defaults.workspace`).
- **Documentation**: percorso locale alla documentazione di OpenClaw (repo o pacchetto npm) e quando leggerla.
- **Workspace Files (injected)**: indica che i file bootstrap sono inclusi qui sotto.
- **Sandbox** (quando abilitato): indica runtime in sandbox, percorsi sandbox e se è disponibile exec elevato.
- **Current Date & Time**: ora locale dell'utente, fuso orario e formato orario.
- **Reply Tags**: sintassi facoltativa dei tag di risposta per i provider supportati.
- **Heartbeats**: prompt Heartbeat e comportamento di ack, quando gli Heartbeat sono abilitati per l'agente predefinito.
- **Runtime**: host, OS, Node, modello, root del repo (quando rilevata), livello di ragionamento (una riga).
- **Reasoning**: livello attuale di visibilità + suggerimento per il toggle `/reasoning`.

La sezione Tooling include anche linee guida runtime per lavori di lunga durata:

- usare Cron per follow-up futuri (`check back later`, promemoria, lavoro ricorrente)
  invece di loop sleep con `exec`, trucchi di ritardo `yieldMs` o polling ripetuto di `process`
- usare `exec` / `process` solo per comandi che iniziano ora e continuano a essere eseguiti
  in background
- quando la riattivazione automatica al completamento è abilitata, avviare il comando una sola volta e fare affidamento
  sul percorso di riattivazione push-based quando emette output o fallisce
- usare `process` per log, stato, input o interventi quando serve
  ispezionare un comando in esecuzione
- se l'attività è più grande, preferire `sessions_spawn`; il completamento del sotto-agente è
  push-based e viene annunciato automaticamente al richiedente
- non fare polling di `subagents list` / `sessions_list` in un loop solo per aspettare
  il completamento

Quando lo strumento sperimentale `update_plan` è abilitato, Tooling dice anche al
modello di usarlo solo per lavori non banali e multi-step, mantenere esattamente un passaggio
`in_progress` ed evitare di ripetere l'intero piano dopo ogni aggiornamento.

I guardrail di Safety nel prompt di sistema sono consultivi. Guidano il comportamento del modello ma non applicano policy. Usa policy degli strumenti, approvazioni exec, sandboxing e allowlist dei canali per un'applicazione rigida; gli operatori possono disabilitarli per progettazione.

Sui canali con schede/pulsanti di approvazione nativi, il prompt runtime ora dice all'agente di fare
affidamento prima su quella UI di approvazione nativa. Dovrebbe includere un comando manuale
`/approve` solo quando il risultato dello strumento dice che le approvazioni in chat non sono disponibili o che l'approvazione manuale è l'unico percorso.

## Modalità del prompt

OpenClaw può renderizzare prompt di sistema più piccoli per i sotto-agenti. Il runtime imposta una
`promptMode` per ogni esecuzione (non è una configurazione visibile all'utente):

- `full` (predefinita): include tutte le sezioni sopra.
- `minimal`: usata per i sotto-agenti; omette **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** e **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (quando noto), Runtime e il contesto
  iniettato restano disponibili.
- `none`: restituisce solo la riga di identità di base.

Quando `promptMode=minimal`, i prompt extra iniettati sono etichettati come **Subagent
Context** invece che **Group Chat Context**.

## Iniezione del bootstrap del workspace

I file bootstrap vengono rifiniti e aggiunti sotto **Project Context** così il modello vede il contesto di identità e profilo senza bisogno di letture esplicite:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo nei workspace nuovi di zecca)
- `MEMORY.md` quando presente

Tutti questi file vengono **iniettati nella finestra di contesto** a ogni turno, a meno che
non si applichi un controllo specifico del file. `HEARTBEAT.md` viene omesso nelle esecuzioni normali quando
gli Heartbeat sono disabilitati per l'agente predefinito o
`agents.defaults.heartbeat.includeSystemPromptSection` è false. Mantieni i file
iniettati concisi — soprattutto `MEMORY.md`, che può crescere nel tempo e portare a
un uso del contesto inaspettatamente alto e a Compaction più frequenti.

> **Nota:** i file giornalieri `memory/*.md` **non** fanno parte del normale bootstrap
> Project Context. Nei turni ordinari vi si accede su richiesta tramite gli
> strumenti `memory_search` e `memory_get`, quindi non contano nella
> finestra di contesto a meno che il modello non li legga esplicitamente. I turni `/new` e
> `/reset` semplici sono l'eccezione: il runtime può anteporre la memoria giornaliera recente
> come blocco one-shot di contesto di avvio per quel primo turno.

I file grandi vengono troncati con un marcatore. La dimensione massima per file è controllata da
`agents.defaults.bootstrapMaxChars` (predefinito: 12000). Il contenuto bootstrap totale iniettato
tra i file è limitato da `agents.defaults.bootstrapTotalMaxChars`
(predefinito: 60000). I file mancanti iniettano un breve marcatore di file mancante. Quando si verifica il troncamento,
OpenClaw può iniettare un blocco di avviso in Project Context; controllalo con
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
predefinito: `once`).

Le sessioni dei sotto-agenti iniettano solo `AGENTS.md` e `TOOLS.md` (gli altri file bootstrap
vengono filtrati per mantenere piccolo il contesto del sotto-agente).

Gli hook interni possono intercettare questo passaggio tramite `agent:bootstrap` per mutare o sostituire
i file bootstrap iniettati (ad esempio sostituendo `SOUL.md` con una persona alternativa).

Se vuoi far sembrare l'agente meno generico, inizia da
[Guida alla personalità di SOUL.md](/it/concepts/soul).

Per ispezionare quanto contribuisce ciascun file iniettato (raw vs iniettato, troncamento, più overhead dello schema degli strumenti), usa `/context list` o `/context detail`. Vedi [Context](/it/concepts/context).

## Gestione del tempo

Il prompt di sistema include una sezione dedicata **Current Date & Time** quando il
fuso orario dell'utente è noto. Per mantenere stabile la cache del prompt, ora include solo
il **fuso orario** (nessun orologio dinamico o formato orario).

Usa `session_status` quando l'agente ha bisogno dell'ora corrente; la scheda di stato
include una riga con timestamp. Lo stesso strumento può facoltativamente impostare un override
del modello per sessione (`model=default` lo cancella).

Configura con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Vedi [Date & Time](/it/date-time) per i dettagli completi del comportamento.

## Skills

Quando esistono Skills idonee, OpenClaw inietta un **elenco compatto delle skills disponibili**
(`formatSkillsForPrompt`) che include il **percorso del file** per ciascuna skill. Il
prompt istruisce il modello a usare `read` per caricare lo SKILL.md nella posizione
elencata (workspace, gestita o bundled). Se non ci sono Skills idonee, la
sezione Skills viene omessa.

L'idoneità include controlli dei metadati della skill, dell'ambiente/runtime e della configurazione,
e l'allowlist effettiva delle skill dell'agente quando `agents.defaults.skills` o
`agents.list[].skills` è configurato.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Questo mantiene piccolo il prompt di base pur consentendo un uso mirato delle Skills.

Il budget dell'elenco delle Skills è di proprietà del sottosistema delle skills:

- Predefinito globale: `skills.limits.maxSkillsPromptChars`
- Override per agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Gli estratti runtime generici con limite usano una superficie diversa:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Questa separazione mantiene il dimensionamento delle Skills distinto dal dimensionamento di runtime di lettura/iniezione come
`memory_get`, risultati di strumenti live e refresh post-Compaction di `AGENTS.md`.

## Documentation

Quando disponibile, il prompt di sistema include una sezione **Documentation** che punta alla
directory locale della documentazione di OpenClaw (o `docs/` nel workspace del repo oppure la documentazione bundled del
pacchetto npm) e indica anche il mirror pubblico, il repo sorgente, la community Discord e
ClawHub ([https://clawhub.ai](https://clawhub.ai)) per la scoperta delle skills. Il prompt istruisce il modello a consultare prima la documentazione locale
per comportamento, comandi, configurazione o architettura di OpenClaw, e a eseguire
`openclaw status` in autonomia quando possibile (chiedendo all'utente solo quando non ha accesso).

## Correlati

- [Runtime dell'agente](/it/concepts/agent)
- [Workspace dell'agente](/it/concepts/agent-workspace)
- [Motore di contesto](/it/concepts/context-engine)
