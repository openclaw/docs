---
read_when:
    - Modifica del testo del system prompt, dell'elenco degli strumenti o delle sezioni relative a ora/heartbeat
    - Modifica del comportamento di bootstrap del workspace o di iniezione delle skills
summary: Cosa contiene il system prompt di OpenClaw e come viene assemblato
title: System Prompt
x-i18n:
    generated_at: "2026-04-05T13:51:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: f14ba7f16dda81ac973d72be05931fa246bdfa0e1068df1a84d040ebd551c236
    source_path: concepts/system-prompt.md
    workflow: 15
---

# System Prompt

OpenClaw costruisce un system prompt personalizzato per ogni esecuzione dell'agente. Il prompt è **di proprietà di OpenClaw** e non usa il prompt predefinito di pi-coding-agent.

Il prompt viene assemblato da OpenClaw e iniettato in ogni esecuzione dell'agente.

I plugin provider possono contribuire con indicazioni sul prompt compatibili con la cache senza sostituire
l'intero prompt di proprietà di OpenClaw. Il runtime del provider può:

- sostituire un piccolo insieme di sezioni core denominate (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- iniettare un **prefisso stabile** sopra il confine della cache del prompt
- iniettare un **suffisso dinamico** sotto il confine della cache del prompt

Usa i contributi di proprietà del provider per la regolazione specifica della famiglia di modelli. Mantieni la mutazione legacy del prompt
`before_prompt_build` per compatibilità o per modifiche al prompt realmente globali, non per il normale comportamento del provider.

## Struttura

Il prompt è intenzionalmente compatto e usa sezioni fisse:

- **Tooling**: promemoria della fonte di verità degli strumenti strutturati più indicazioni runtime sull'uso degli strumenti.
- **Safety**: breve promemoria delle protezioni per evitare comportamenti orientati alla ricerca di potere o l'aggiramento della supervisione.
- **Skills** (quando disponibili): indica al modello come caricare su richiesta le istruzioni delle skill.
- **OpenClaw Self-Update**: come ispezionare in sicurezza la configurazione con
  `config.schema.lookup`, correggere la configurazione con `config.patch`, sostituire l'intera
  configurazione con `config.apply` ed eseguire `update.run` solo su esplicita
  richiesta dell'utente. Anche lo strumento `gateway`, riservato al proprietario, rifiuta di riscrivere
  `tools.exec.ask` / `tools.exec.security`, comprese le alias legacy `tools.bash.*`
  che vengono normalizzate in quei percorsi exec protetti.
- **Workspace**: directory di lavoro (`agents.defaults.workspace`).
- **Documentation**: percorso locale alla documentazione di OpenClaw (repo o pacchetto npm) e quando leggerla.
- **Workspace Files (injected)**: indica che i file bootstrap sono inclusi qui sotto.
- **Sandbox** (quando abilitato): indica runtime sandboxato, percorsi del sandbox e se è disponibile l'exec elevato.
- **Current Date & Time**: ora locale dell'utente, fuso orario e formato dell'ora.
- **Reply Tags**: sintassi facoltativa dei tag di risposta per i provider supportati.
- **Heartbeats**: prompt heartbeat e comportamento di ack.
- **Runtime**: host, OS, node, radice del repo (quando rilevata), livello di thinking (una riga).
- **Reasoning**: livello corrente di visibilità + suggerimento per l'attivazione/disattivazione con /reasoning.

La sezione Tooling include anche indicazioni runtime per il lavoro di lunga durata:

- usa cron per attività future (`check back later`, promemoria, lavoro ricorrente)
  invece di cicli sleep con `exec`, trucchi di ritardo `yieldMs` o polling ripetuto di `process`
- usa `exec` / `process` solo per comandi che iniziano subito e continuano a essere eseguiti
  in background
- quando il risveglio automatico al completamento è abilitato, avvia il comando una sola volta e affidati
  al percorso di risveglio push-based quando emette output o fallisce
- usa `process` per log, stato, input o interventi quando devi
  ispezionare un comando in esecuzione
- se l'attività è più grande, preferisci `sessions_spawn`; il completamento del sottoagente è
  push-based e viene annunciato automaticamente al richiedente
- non interrogare `subagents list` / `sessions_list` in un ciclo solo per attendere
  il completamento

Quando lo strumento sperimentale `update_plan` è abilitato, Tooling indica anche al
modello di usarlo solo per lavori non banali e articolati in più passaggi, mantenere esattamente un passaggio
`in_progress` ed evitare di ripetere l'intero piano dopo ogni aggiornamento.

Le protezioni di Safety nel system prompt sono indicative. Guidano il comportamento del modello ma non impongono policy. Usa la policy degli strumenti, le approvazioni exec, il sandboxing e le allowlist dei canali per l'applicazione rigida; gli operatori possono disabilitare questi elementi per progettazione.

Sui canali con card/pulsanti di approvazione nativi, il prompt runtime ora indica all'agente di
affidarsi prima a quell'interfaccia di approvazione nativa. Dovrebbe includere un comando manuale
`/approve` solo quando il risultato dello strumento indica che le approvazioni via chat non sono disponibili o
che l'approvazione manuale è l'unico percorso.

## Modalità del prompt

OpenClaw può generare system prompt più piccoli per i sottoagenti. Il runtime imposta una
`promptMode` per ogni esecuzione (non è una configurazione visibile all'utente):

- `full` (predefinita): include tutte le sezioni sopra.
- `minimal`: usata per i sottoagenti; omette **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** e **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (quando nota), Runtime e il contesto
  iniettato restano disponibili.
- `none`: restituisce solo la riga base dell'identità.

Quando `promptMode=minimal`, i prompt extra iniettati sono etichettati come **Subagent
Context** invece che come **Group Chat Context**.

## Iniezione del bootstrap del workspace

I file bootstrap vengono ridotti e aggiunti sotto **Project Context** in modo che il modello veda il contesto di identità e profilo senza necessitare di letture esplicite:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo per workspace completamente nuovi)
- `MEMORY.md` quando presente, altrimenti `memory.md` come fallback in minuscolo

Tutti questi file vengono **iniettati nella finestra di contesto** a ogni turno, il che
significa che consumano token. Mantienili concisi — soprattutto `MEMORY.md`, che può
crescere nel tempo e portare a un uso del contesto inaspettatamente elevato e a compattazioni
più frequenti.

> **Nota:** i file giornalieri `memory/*.md` **non** vengono iniettati automaticamente.
> Vi si accede su richiesta tramite gli strumenti `memory_search` e `memory_get`, quindi
> non incidono sulla finestra di contesto a meno che il modello non li legga esplicitamente.

I file grandi vengono troncati con un marker. La dimensione massima per file è controllata da
`agents.defaults.bootstrapMaxChars` (predefinito: 20000). Il contenuto bootstrap totale
iniettato tra tutti i file è limitato da `agents.defaults.bootstrapTotalMaxChars`
(predefinito: 150000). I file mancanti iniettano un breve marker di file mancante. Quando si verifica il troncamento,
OpenClaw può iniettare un blocco di avviso in Project Context; controlla questo comportamento con
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
predefinito: `once`).

Le sessioni dei sottoagenti iniettano solo `AGENTS.md` e `TOOLS.md` (gli altri file bootstrap
vengono filtrati per mantenere piccolo il contesto del sottoagente).

Gli hook interni possono intercettare questo passaggio tramite `agent:bootstrap` per mutare o sostituire
i file bootstrap iniettati (ad esempio sostituendo `SOUL.md` con una persona alternativa).

Se vuoi rendere l'agente meno generico nel modo in cui suona, inizia con
[SOUL.md Personality Guide](/concepts/soul).

Per ispezionare quanto contribuisce ciascun file iniettato (grezzo vs iniettato, troncamento, oltre all'overhead dello schema dello strumento), usa `/context list` o `/context detail`. Vedi [Context](/concepts/context).

## Gestione del tempo

Il system prompt include una sezione dedicata **Current Date & Time** quando il
fuso orario dell'utente è noto. Per mantenere stabile la cache del prompt, ora include solo
il **fuso orario** (nessun orologio dinamico o formato dell'ora).

Usa `session_status` quando l'agente ha bisogno dell'ora corrente; la card di stato
include una riga con timestamp. Lo stesso strumento può facoltativamente impostare un override
del modello per sessione (`model=default` lo cancella).

Configura con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Vedi [Date & Time](/date-time) per i dettagli completi del comportamento.

## Skills

Quando esistono skill idonee, OpenClaw inietta un compatto **elenco delle skill disponibili**
(`formatSkillsForPrompt`) che include il **percorso del file** per ogni skill. Il
prompt istruisce il modello a usare `read` per caricare lo SKILL.md nella posizione
indicata (workspace, gestita o inclusa). Se nessuna skill è idonea, la
sezione Skills viene omessa.

L'idoneità include i gate dei metadati della skill, i controlli dell'ambiente/configurazione runtime
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

Questo mantiene piccolo il prompt di base pur consentendo comunque un uso mirato delle skill.

## Documentazione

Quando disponibile, il system prompt include una sezione **Documentation** che indica la
directory locale della documentazione di OpenClaw (o `docs/` nel workspace del repo o la documentazione inclusa nel
pacchetto npm) e annota anche il mirror pubblico, il repo sorgente, la community Discord e
ClawHub ([https://clawhub.ai](https://clawhub.ai)) per la scoperta delle skill. Il prompt istruisce il modello a consultare prima la documentazione locale
per comportamento, comandi, configurazione o architettura di OpenClaw, e a eseguire
`openclaw status` direttamente quando possibile (chiedendo all'utente solo quando non ha accesso).
