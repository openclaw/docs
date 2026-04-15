---
read_when:
    - Modifica del testo del prompt di sistema, dell'elenco degli strumenti o delle sezioni relative a ora/Heartbeat
    - Modifica del bootstrap dello spazio di lavoro o del comportamento di iniezione delle Skills
summary: Che cosa contiene il prompt di sistema di OpenClaw e come viene assemblato
title: Prompt di sistema
x-i18n:
    generated_at: "2026-04-15T19:41:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: c740e4646bc4980567338237bfb55126af0df72499ca00a48e4848d9a3608ab4
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Prompt di sistema

OpenClaw costruisce un prompt di sistema personalizzato per ogni esecuzione dell'agente. Il prompt è **di proprietà di OpenClaw** e non usa il prompt predefinito di pi-coding-agent.

Il prompt viene assemblato da OpenClaw e iniettato in ogni esecuzione dell'agente.

I Plugin provider possono contribuire con indicazioni per il prompt compatibili con la cache senza sostituire l'intero prompt di proprietà di OpenClaw. Il runtime del provider può:

- sostituire un piccolo insieme di sezioni core denominate (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- iniettare un **prefisso stabile** sopra il confine della cache del prompt
- iniettare un **suffisso dinamico** sotto il confine della cache del prompt

Usa contributi di proprietà del provider per ottimizzazioni specifiche per famiglie di modelli. Mantieni la mutazione legacy del prompt `before_prompt_build` per compatibilità o per modifiche al prompt realmente globali, non per il normale comportamento del provider.

## Struttura

Il prompt è intenzionalmente compatto e usa sezioni fisse:

- **Tooling**: promemoria della fonte di verità degli strumenti strutturati più indicazioni di runtime per l'uso degli strumenti.
- **Safety**: breve promemoria di guardrail per evitare comportamenti orientati alla conquista di potere o all'aggiramento della supervisione.
- **Skills** (quando disponibili): indica al modello come caricare le istruzioni delle skill su richiesta.
- **Auto-aggiornamento di OpenClaw**: come ispezionare in sicurezza la configurazione con `config.schema.lookup`, correggere la configurazione con `config.patch`, sostituire l'intera configurazione con `config.apply` ed eseguire `update.run` solo su richiesta esplicita dell'utente. Lo strumento `gateway`, disponibile solo per il proprietario, rifiuta anche di riscrivere `tools.exec.ask` / `tools.exec.security`, incluse le alias legacy `tools.bash.*` che vengono normalizzate in quei percorsi exec protetti.
- **Spazio di lavoro**: directory di lavoro (`agents.defaults.workspace`).
- **Documentazione**: percorso locale alla documentazione di OpenClaw (repo o pacchetto npm) e quando leggerla.
- **File dello spazio di lavoro (iniettati)**: indica che i file bootstrap sono inclusi sotto.
- **Sandbox** (quando abilitata): indica il runtime in sandbox, i percorsi della sandbox e se è disponibile l'esecuzione con privilegi elevati.
- **Data e ora correnti**: ora locale dell'utente, fuso orario e formato dell'ora.
- **Tag di risposta**: sintassi opzionale dei tag di risposta per i provider supportati.
- **Heartbeat**: prompt Heartbeat e comportamento di ack, quando gli heartbeat sono abilitati per l'agente predefinito.
- **Runtime**: host, OS, node, modello, radice del repo (quando rilevata), livello di thinking (una riga).
- **Reasoning**: livello di visibilità corrente + suggerimento per l'attivazione/disattivazione con `/reasoning`.

La sezione Tooling include anche indicazioni di runtime per il lavoro di lunga durata:

- usa Cron per follow-up futuri (`check back later`, promemoria, lavoro ricorrente) invece di cicli sleep con `exec`, trucchi di ritardo con `yieldMs` o polling ripetuto di `process`
- usa `exec` / `process` solo per comandi che iniziano subito e continuano a essere eseguiti in background
- quando è abilitato il risveglio automatico al completamento, avvia il comando una sola volta e fai affidamento sul percorso di risveglio push-based quando emette output o fallisce
- usa `process` per log, stato, input o intervento quando hai bisogno di ispezionare un comando in esecuzione
- se l'attività è più grande, preferisci `sessions_spawn`; il completamento del sotto-agente è push-based e viene annunciato automaticamente al richiedente
- non eseguire polling di `subagents list` / `sessions_list` in un ciclo solo per attendere il completamento

Quando è abilitato lo strumento sperimentale `update_plan`, Tooling indica anche al modello di usarlo solo per lavori non banali a più passaggi, mantenere esattamente un passaggio `in_progress` ed evitare di ripetere l'intero piano dopo ogni aggiornamento.

I guardrail di Safety nel prompt di sistema sono indicativi. Guidano il comportamento del modello ma non applicano policy. Usa la policy degli strumenti, le approvazioni exec, la sandbox e le allowlist dei canali per l'applicazione rigida; gli operatori possono disabilitarli per progettazione.

Sui canali con schede/pulsanti di approvazione nativi, il prompt di runtime ora indica all'agente di fare affidamento prima su quell'interfaccia di approvazione nativa. Deve includere un comando manuale `/approve` solo quando il risultato dello strumento indica che le approvazioni in chat non sono disponibili o che l'approvazione manuale è l'unico percorso.

## Modalità del prompt

OpenClaw può rendere prompt di sistema più piccoli per i sotto-agenti. Il runtime imposta un `promptMode` per ogni esecuzione (non è una configurazione rivolta all'utente):

- `full` (predefinita): include tutte le sezioni sopra.
- `minimal`: usata per i sotto-agenti; omette **Skills**, **Memory Recall**, **Auto-aggiornamento di OpenClaw**, **Alias dei modelli**, **Identità utente**, **Tag di risposta**, **Messaggistica**, **Risposte silenziose** e **Heartbeat**. Tooling, **Safety**, Spazio di lavoro, Sandbox, Data e ora correnti (quando note), Runtime e il contesto iniettato restano disponibili.
- `none`: restituisce solo la riga di identità di base.

Quando `promptMode=minimal`, i prompt extra iniettati sono etichettati come **Contesto del sotto-agente** invece di **Contesto della chat di gruppo**.

## Iniezione del bootstrap dello spazio di lavoro

I file bootstrap vengono ridotti e aggiunti sotto **Contesto del progetto** in modo che il modello veda il contesto di identità e profilo senza richiedere letture esplicite:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo negli spazi di lavoro appena creati)
- `MEMORY.md` se presente, altrimenti `memory.md` come fallback in minuscolo

Tutti questi file vengono **iniettati nella finestra di contesto** a ogni turno, a meno che non si applichi un gate specifico del file. `HEARTBEAT.md` viene omesso nelle esecuzioni normali quando gli heartbeat sono disabilitati per l'agente predefinito o `agents.defaults.heartbeat.includeSystemPromptSection` è false. Mantieni concisi i file iniettati, soprattutto `MEMORY.md`, che può crescere nel tempo e portare a un uso del contesto inaspettatamente elevato e a una Compaction più frequente.

> **Nota:** i file giornalieri `memory/*.md` **non** fanno parte del normale bootstrap del Contesto del progetto. Nei turni ordinari vengono accessibili su richiesta tramite gli strumenti `memory_search` e `memory_get`, quindi non contano rispetto alla finestra di contesto a meno che il modello non li legga esplicitamente. I turni semplici `/new` e `/reset` sono l'eccezione: il runtime può anteporre la memoria giornaliera recente come blocco di contesto di avvio one-shot per quel primo turno.

I file grandi vengono troncati con un marcatore. La dimensione massima per file è controllata da `agents.defaults.bootstrapMaxChars` (predefinito: 20000). Il contenuto bootstrap totale iniettato tra i file è limitato da `agents.defaults.bootstrapTotalMaxChars` (predefinito: 150000). I file mancanti iniettano un breve marcatore di file mancante. Quando si verifica il troncamento, OpenClaw può iniettare un blocco di avviso in Contesto del progetto; controllalo con `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; predefinito: `once`).

Le sessioni dei sotto-agenti iniettano solo `AGENTS.md` e `TOOLS.md` (gli altri file bootstrap vengono filtrati per mantenere piccolo il contesto del sotto-agente).

Gli hook interni possono intercettare questo passaggio tramite `agent:bootstrap` per mutare o sostituire i file bootstrap iniettati (per esempio sostituendo `SOUL.md` con una persona alternativa).

Se vuoi rendere l'agente meno generico nel tono, inizia con [Guida alla personalità di SOUL.md](/it/concepts/soul).

Per ispezionare quanto contribuisce ciascun file iniettato (grezzo rispetto a iniettato, troncamento, più overhead dello schema degli strumenti), usa `/context list` o `/context detail`. Vedi [Contesto](/it/concepts/context).

## Gestione del tempo

Il prompt di sistema include una sezione dedicata **Data e ora correnti** quando il fuso orario dell'utente è noto. Per mantenere stabile la cache del prompt, ora include solo il **fuso orario** (nessun orologio dinamico o formato dell'ora).

Usa `session_status` quando l'agente ha bisogno dell'ora corrente; la scheda di stato include una riga con il timestamp. Lo stesso strumento può opzionalmente impostare una sostituzione del modello per sessione (`model=default` la cancella).

Configura con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Vedi [Data e ora](/it/date-time) per i dettagli completi sul comportamento.

## Skills

Quando esistono skill idonee, OpenClaw inietta un **elenco compatto delle skill disponibili** (`formatSkillsForPrompt`) che include il **percorso del file** per ogni skill. Il prompt indica al modello di usare `read` per caricare lo SKILL.md nella posizione elencata (spazio di lavoro, gestita o inclusa). Se non ci sono skill idonee, la sezione Skills viene omessa.

L'idoneità include gate dei metadati della skill, controlli dell'ambiente/configurazione di runtime e la allowlist effettiva delle skill dell'agente quando `agents.defaults.skills` o `agents.list[].skills` è configurato.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Questo mantiene piccolo il prompt di base pur consentendo comunque un utilizzo mirato delle skill.

Il budget dell'elenco delle skill è di competenza del sottosistema delle skill:

- Predefinito globale: `skills.limits.maxSkillsPromptChars`
- Override per agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Gli estratti di runtime generici con limiti usano una superficie diversa:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Questa separazione mantiene il dimensionamento delle skill distinto dal dimensionamento di lettura/iniezione del runtime, come `memory_get`, risultati live degli strumenti e aggiornamenti di `AGENTS.md` dopo la Compaction.

## Documentazione

Quando disponibile, il prompt di sistema include una sezione **Documentazione** che punta alla directory locale della documentazione di OpenClaw (o `docs/` nello spazio di lavoro del repo oppure la documentazione del pacchetto npm incluso) e indica anche il mirror pubblico, il repo sorgente, la community Discord e ClawHub ([https://clawhub.ai](https://clawhub.ai)) per la scoperta delle skill. Il prompt indica al modello di consultare prima la documentazione locale per comportamento, comandi, configurazione o architettura di OpenClaw e di eseguire `openclaw status` direttamente quando possibile (chiedendo all'utente solo quando non ha accesso).
