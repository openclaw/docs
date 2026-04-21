---
read_when:
    - Modifica del testo del prompt di sistema, dell'elenco degli strumenti o delle sezioni orario/Heartbeat
    - Modifica del bootstrap del workspace o del comportamento di iniezione delle Skills
summary: Che cosa contiene il prompt di sistema di OpenClaw e come viene assemblato
title: Prompt di sistema
x-i18n:
    generated_at: "2026-04-21T08:22:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc7b887865830e29bcbfb7f88a12fe04f490eec64cb745fc4534051b63a862dc
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Prompt di sistema

OpenClaw costruisce un prompt di sistema personalizzato per ogni esecuzione dell'agente. Il prompt è **di proprietà di OpenClaw** e non usa il prompt predefinito di pi-coding-agent.

Il prompt viene assemblato da OpenClaw e iniettato in ogni esecuzione dell'agente.

I plugin provider possono contribuire con indicazioni per il prompt compatibili con la cache senza sostituire
l'intero prompt di proprietà di OpenClaw. Il runtime del provider può:

- sostituire un piccolo insieme di sezioni core con nome (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- iniettare un **prefisso stabile** sopra il confine della cache del prompt
- iniettare un **suffisso dinamico** sotto il confine della cache del prompt

Usa i contributi di proprietà del provider per la regolazione specifica per famiglia di modelli. Mantieni la mutazione legacy del prompt `before_prompt_build` per compatibilità o per modifiche del prompt davvero globali, non per il normale comportamento del provider.

L'overlay della famiglia OpenAI GPT-5 mantiene piccola la regola di esecuzione core e aggiunge
indicazioni specifiche del modello per aggancio della persona, output conciso, disciplina degli strumenti,
ricerca in parallelo, copertura dei risultati attesi, verifica, contesto mancante e
igiene degli strumenti terminale.

## Struttura

Il prompt è volutamente compatto e usa sezioni fisse:

- **Tooling**: promemoria sulla fonte di verità degli strumenti strutturati più indicazioni di runtime sull'uso degli strumenti.
- **Execution Bias**: indicazioni compatte di completamento: agire nello stesso turno sulle
  richieste eseguibili, continuare fino al completamento o al blocco, recuperare da risultati deboli degli strumenti,
  controllare in tempo reale lo stato mutabile e verificare prima di concludere.
- **Safety**: breve promemoria di guardrail per evitare comportamenti orientati alla conquista di potere o all'aggiramento della supervisione.
- **Skills** (quando disponibili): dice al modello come caricare su richiesta le istruzioni delle skill.
- **Auto-aggiornamento OpenClaw**: come ispezionare in sicurezza la configurazione con
  `config.schema.lookup`, modificare la configurazione con `config.patch`, sostituire l'intera
  configurazione con `config.apply` ed eseguire `update.run` solo su esplicita
  richiesta dell'utente. Anche lo strumento `gateway`, riservato al proprietario, rifiuta di riscrivere
  `tools.exec.ask` / `tools.exec.security`, incluse le alias legacy `tools.bash.*`
  che vengono normalizzate in quei percorsi exec protetti.
- **Workspace**: directory di lavoro (`agents.defaults.workspace`).
- **Documentation**: percorso locale alla documentazione OpenClaw (repo o pacchetto npm) e quando leggerla.
- **Workspace Files (injected)**: indica che i file bootstrap sono inclusi sotto.
- **Sandbox** (quando abilitata): indica runtime in sandbox, percorsi sandbox e se exec elevato è disponibile.
- **Current Date & Time**: ora locale dell'utente, fuso orario e formato dell'ora.
- **Reply Tags**: sintassi facoltativa dei tag di risposta per i provider supportati.
- **Heartbeats**: prompt Heartbeat e comportamento di ack, quando gli heartbeat sono abilitati per l'agente predefinito.
- **Runtime**: host, OS, node, modello, root del repo (quando rilevata), livello di ragionamento (una riga).
- **Reasoning**: livello di visibilità corrente + suggerimento per l'opzione /reasoning.

La sezione Tooling include anche indicazioni di runtime per lavori di lunga durata:

- usare Cron per follow-up futuri (`check back later`, promemoria, lavoro ricorrente)
  invece di cicli sleep `exec`, trucchi di ritardo `yieldMs` o polling ripetuto di `process`
- usare `exec` / `process` solo per comandi che iniziano ora e continuano a essere eseguiti
  in background
- quando la riattivazione automatica al completamento è abilitata, avviare il comando una sola volta e fare affidamento
  sul percorso di riattivazione push quando emette output o fallisce
- usare `process` per log, stato, input o intervento quando serve
  ispezionare un comando in esecuzione
- se l'attività è più grande, preferire `sessions_spawn`; il completamento dei sotto-agenti è
  basato su push e viene annunciato automaticamente al richiedente
- non eseguire polling di `subagents list` / `sessions_list` in un ciclo solo per attendere
  il completamento

Quando lo strumento sperimentale `update_plan` è abilitato, Tooling dice anche al
modello di usarlo solo per lavori non banali a più passaggi, mantenere esattamente un passaggio
`in_progress` ed evitare di ripetere l'intero piano dopo ogni aggiornamento.

I guardrail di sicurezza nel prompt di sistema sono indicativi. Guidano il comportamento del modello ma non applicano policy. Usa policy degli strumenti, approvazioni exec, sandboxing e allowlist dei canali per un'applicazione rigorosa; per progettazione gli operatori possono disabilitarli.

Sui canali con schede/pulsanti di approvazione nativi, il prompt di runtime ora dice all'
agente di affidarsi prima a quell'interfaccia di approvazione nativa. Deve includere un comando manuale
`/approve` solo quando il risultato dello strumento dice che le approvazioni in chat non sono disponibili o
che l'approvazione manuale è l'unica strada.

## Modalità del prompt

OpenClaw può generare prompt di sistema più piccoli per i sotto-agenti. Il runtime imposta una
`promptMode` per ogni esecuzione (non è una configurazione visibile all'utente):

- `full` (predefinita): include tutte le sezioni sopra.
- `minimal`: usata per i sotto-agenti; omette **Skills**, **Memory Recall**, **Auto-aggiornamento OpenClaw**, **Alias del modello**, **Identità utente**, **Reply Tags**,
  **Messaggistica**, **Risposte silenziose** e **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (quando noto), Runtime e il
  contesto iniettato restano disponibili.
- `none`: restituisce solo la riga base di identità.

Quando `promptMode=minimal`, i prompt extra iniettati sono etichettati **Subagent
Context** invece di **Group Chat Context**.

## Iniezione del bootstrap del workspace

I file bootstrap vengono ridotti e aggiunti sotto **Project Context** così il modello vede il contesto di identità e profilo senza bisogno di letture esplicite:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo nei workspace completamente nuovi)
- `MEMORY.md` quando presente, altrimenti `memory.md` come fallback in minuscolo

Tutti questi file vengono **iniettati nella finestra di contesto** a ogni turno salvo
quando si applica uno specifico gate del file. `HEARTBEAT.md` viene omesso nelle esecuzioni normali quando
gli heartbeat sono disabilitati per l'agente predefinito oppure
`agents.defaults.heartbeat.includeSystemPromptSection` è false. Mantieni concisi i file
iniettati — soprattutto `MEMORY.md`, che può crescere nel tempo e causare
uso del contesto inaspettatamente elevato e compattazione più frequente.

> **Nota:** i file giornalieri `memory/*.md` **non** fanno parte del normale bootstrap
> Project Context. Nei turni ordinari vi si accede su richiesta tramite gli
> strumenti `memory_search` e `memory_get`, quindi non contano nella
> finestra di contesto a meno che il modello non li legga esplicitamente. I turni `/new` e
> `/reset` senza altro contenuto fanno eccezione: il runtime può anteporre memoria giornaliera recente
> come blocco di contesto di avvio monouso per quel primo turno.

I file grandi vengono troncati con un marcatore. La dimensione massima per file è controllata da
`agents.defaults.bootstrapMaxChars` (predefinito: 12000). Il contenuto bootstrap totale iniettato
tra tutti i file è limitato da `agents.defaults.bootstrapTotalMaxChars`
(predefinito: 60000). I file mancanti iniettano un breve marcatore di file mancante. Quando si verifica il troncamento,
OpenClaw può iniettare un blocco di avviso in Project Context; controllalo con
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
predefinito: `once`).

Le sessioni dei sotto-agenti iniettano solo `AGENTS.md` e `TOOLS.md` (gli altri file bootstrap
vengono filtrati per mantenere piccolo il contesto del sotto-agente).

Gli hook interni possono intercettare questo passaggio tramite `agent:bootstrap` per mutare o sostituire
i file bootstrap iniettati (ad esempio sostituendo `SOUL.md` con una persona alternativa).

Se vuoi rendere l'agente meno generico nel modo di esprimersi, inizia da
[SOUL.md Personality Guide](/it/concepts/soul).

Per controllare quanto contribuisce ciascun file iniettato (grezzo vs iniettato, troncamento, più overhead dello schema degli strumenti), usa `/context list` o `/context detail`. Vedi [Context](/it/concepts/context).

## Gestione del tempo

Il prompt di sistema include una sezione dedicata **Current Date & Time** quando il
fuso orario dell'utente è noto. Per mantenere stabile la cache del prompt, ora include solo
il **fuso orario** (nessun orologio dinamico né formato dell'ora).

Usa `session_status` quando l'agente ha bisogno dell'ora corrente; la scheda di stato
include una riga con timestamp. Lo stesso strumento può anche impostare un override del modello
per sessione (`model=default` lo cancella).

Configura con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulta [Date & Time](/it/date-time) per i dettagli completi del comportamento.

## Skills

Quando esistono skill idonee, OpenClaw inietta un elenco compatto **available skills list**
(`formatSkillsForPrompt`) che include il **percorso del file** per ogni skill. Il
prompt istruisce il modello a usare `read` per caricare lo SKILL.md nel percorso
elencato (workspace, gestito o incluso). Se nessuna skill è idonea, la sezione
Skills viene omessa.

L'idoneità include gate dei metadati della skill, controlli dell'ambiente/configurazione di runtime
e l'allowlist effettiva delle skill dell'agente quando è configurata `agents.defaults.skills` oppure
`agents.list[].skills`.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Questo mantiene piccolo il prompt di base pur consentendo comunque un uso mirato delle skill.

Il budget dell'elenco delle skill è di competenza del sottosistema delle skill:

- Predefinito globale: `skills.limits.maxSkillsPromptChars`
- Override per agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Gli estratti generici di runtime con limiti usano una superficie diversa:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Questa separazione mantiene il dimensionamento delle skill distinto dal dimensionamento di lettura/iniezione del runtime
come `memory_get`, risultati degli strumenti in tempo reale e refresh di AGENTS.md dopo la compattazione.

## Documentation

Quando disponibile, il prompt di sistema include una sezione **Documentation** che indica la
directory locale della documentazione di OpenClaw (sia `docs/` nel workspace del repo sia la documentazione del
pacchetto npm incluso) e cita anche il mirror pubblico, il repo sorgente, la community Discord e
ClawHub ([https://clawhub.ai](https://clawhub.ai)) per la scoperta delle Skills. Il prompt istruisce il modello a consultare prima la documentazione locale
per comportamento, comandi, configurazione o architettura di OpenClaw e a eseguire
`openclaw status` autonomamente quando possibile (chiedendo all'utente solo quando non ha accesso).
