---
read_when:
    - Modifica del testo del prompt di sistema, dell'elenco degli strumenti o delle sezioni relative a ora/heartbeat
    - Modifica del bootstrap dell'area di lavoro o del comportamento di iniezione delle Skills
summary: Che cosa contiene il prompt di sistema di OpenClaw e come viene assemblato
title: Prompt di sistema
x-i18n:
    generated_at: "2026-04-12T08:08:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 057f01aac51f7737b5223f61f5d55e552d9011232aebb130426e269d8f6c257f
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Prompt di sistema

OpenClaw crea un prompt di sistema personalizzato per ogni esecuzione dell'agente. Il prompt è **di proprietà di OpenClaw** e non usa il prompt predefinito di pi-coding-agent.

Il prompt viene assemblato da OpenClaw e iniettato in ogni esecuzione dell'agente.

I plugin provider possono contribuire con indicazioni sul prompt compatibili con la cache senza sostituire l'intero prompt di proprietà di OpenClaw. Il runtime del provider può:

- sostituire un piccolo insieme di sezioni core nominate (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- iniettare un **prefisso stabile** sopra il confine della cache del prompt
- iniettare un **suffisso dinamico** sotto il confine della cache del prompt

Usa i contributi di proprietà del provider per la messa a punto specifica della famiglia di modelli. Mantieni la mutazione legacy del prompt `before_prompt_build` per compatibilità o per modifiche del prompt veramente globali, non per il normale comportamento del provider.

## Struttura

Il prompt è intenzionalmente compatto e usa sezioni fisse:

- **Strumenti**: promemoria della fonte di verità degli strumenti strutturati più indicazioni runtime sull'uso degli strumenti.
- **Sicurezza**: breve promemoria di guardrail per evitare comportamenti orientati alla ricerca di potere o all'elusione della supervisione.
- **Skills** (quando disponibili): indica al modello come caricare su richiesta le istruzioni delle skill.
- **Auto-aggiornamento OpenClaw**: come ispezionare in sicurezza la configurazione con
  `config.schema.lookup`, correggere la configurazione con `config.patch`, sostituire l'intera
  configurazione con `config.apply` ed eseguire `update.run` solo su richiesta esplicita
  dell'utente. Anche lo strumento `gateway`, riservato al proprietario, si rifiuta di riscrivere
  `tools.exec.ask` / `tools.exec.security`, incluse le alias legacy `tools.bash.*`
  che vengono normalizzate in quei percorsi exec protetti.
- **Area di lavoro**: directory di lavoro (`agents.defaults.workspace`).
- **Documentazione**: percorso locale alla documentazione di OpenClaw (repo o pacchetto npm) e quando leggerla.
- **File dell'area di lavoro (iniettati)**: indica che i file bootstrap sono inclusi qui sotto.
- **Sandbox** (quando abilitata): indica runtime in sandbox, percorsi della sandbox e se è disponibile l'esecuzione con privilegi elevati.
- **Data e ora correnti**: ora locale dell'utente, fuso orario e formato orario.
- **Tag di risposta**: sintassi facoltativa dei tag di risposta per i provider supportati.
- **Heartbeat**: prompt heartbeat e comportamento di ack, quando gli heartbeat sono abilitati per l'agente predefinito.
- **Runtime**: host, OS, node, radice del repo (quando rilevata), livello di ragionamento (una riga).
- **Ragionamento**: livello di visibilità corrente + suggerimento sul toggle /reasoning.

La sezione Strumenti include anche indicazioni runtime per lavori di lunga durata:

- usa cron per follow-up futuri (`check back later`, promemoria, lavori ricorrenti)
  invece di loop di sleep con `exec`, trucchi di ritardo con `yieldMs` o polling ripetuto di `process`
- usa `exec` / `process` solo per comandi che iniziano ora e continuano a essere eseguiti
  in background
- quando è abilitato il risveglio automatico al completamento, avvia il comando una sola volta e fai affidamento sul
  percorso di risveglio push-based quando emette output o fallisce
- usa `process` per log, stato, input o intervento quando devi
  ispezionare un comando in esecuzione
- se l'attività è più grande, preferisci `sessions_spawn`; il completamento del sotto-agente è
  push-based e viene annunciato automaticamente al richiedente
- non fare polling di `subagents list` / `sessions_list` in un loop solo per attendere
  il completamento

Quando è abilitato lo strumento sperimentale `update_plan`, Strumenti indica inoltre al
modello di usarlo solo per lavori non banali a più passaggi, mantenere esattamente un passaggio
`in_progress` ed evitare di ripetere l'intero piano dopo ogni aggiornamento.

I guardrail di sicurezza nel prompt di sistema sono indicativi. Guidano il comportamento del modello ma non applicano policy. Usa policy degli strumenti, approvazioni exec, sandboxing e allowlist dei canali per l'applicazione rigorosa; per design, gli operatori possono disabilitarli.

Sui canali con schede/pulsanti di approvazione nativi, il prompt runtime ora dice all'agente di fare prima affidamento su quell'interfaccia di approvazione nativa. Dovrebbe includere un comando manuale `/approve` solo quando il risultato dello strumento dice che le approvazioni in chat non sono disponibili o che l'approvazione manuale è l'unico percorso.

## Modalità del prompt

OpenClaw può generare prompt di sistema più piccoli per i sotto-agenti. Il runtime imposta un
`promptMode` per ogni esecuzione (non è una configurazione visibile all'utente):

- `full` (predefinito): include tutte le sezioni sopra.
- `minimal`: usato per i sotto-agenti; omette **Skills**, **Richiamo della memoria**, **Auto-aggiornamento OpenClaw**, **Alias dei modelli**, **Identità utente**, **Tag di risposta**,
  **Messaggistica**, **Risposte silenziose** e **Heartbeat**. Strumenti, **Sicurezza**,
  Area di lavoro, Sandbox, Data e ora correnti (quando note), Runtime e contesto
  iniettato restano disponibili.
- `none`: restituisce solo la riga dell'identità di base.

Quando `promptMode=minimal`, i prompt extra iniettati sono etichettati come **Contesto del sotto-agente** invece di **Contesto della chat di gruppo**.

## Iniezione del bootstrap dell'area di lavoro

I file bootstrap vengono tagliati e aggiunti sotto **Contesto del progetto** in modo che il modello veda il contesto di identità e profilo senza bisogno di letture esplicite:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo nelle aree di lavoro completamente nuove)
- `MEMORY.md` quando presente, altrimenti `memory.md` come fallback in minuscolo

Tutti questi file vengono **iniettati nella finestra di contesto** a ogni turno, a meno che
non si applichi un gate specifico per file. `HEARTBEAT.md` viene omesso nelle esecuzioni normali quando
gli heartbeat sono disabilitati per l'agente predefinito o
`agents.defaults.heartbeat.includeSystemPromptSection` è false. Mantieni concisi i file
iniettati, soprattutto `MEMORY.md`, che può crescere nel tempo e portare a
un uso del contesto inaspettatamente elevato e a compattazioni più frequenti.

> **Nota:** i file giornalieri `memory/*.md` **non** fanno parte del normale
> Contesto del progetto bootstrap. Nei turni ordinari vi si accede su richiesta tramite gli
> strumenti `memory_search` e `memory_get`, quindi non contano nella
> finestra di contesto a meno che il modello non li legga esplicitamente. I turni `/new` e `/reset` senza altri contenuti sono l'eccezione: il runtime può anteporre la memoria giornaliera recente
> come blocco di contesto iniziale one-shot per quel primo turno.

I file grandi vengono troncati con un marcatore. La dimensione massima per file è controllata da
`agents.defaults.bootstrapMaxChars` (predefinito: 20000). Il contenuto bootstrap totale iniettato
attraverso i file è limitato da `agents.defaults.bootstrapTotalMaxChars`
(predefinito: 150000). I file mancanti iniettano un breve marcatore di file mancante. Quando si verifica il troncamento,
OpenClaw può iniettare un blocco di avviso in Contesto del progetto; controllalo con
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
predefinito: `once`).

Le sessioni dei sotto-agenti iniettano solo `AGENTS.md` e `TOOLS.md` (gli altri file bootstrap
vengono filtrati per mantenere piccolo il contesto del sotto-agente).

Gli hook interni possono intercettare questo passaggio tramite `agent:bootstrap` per modificare o sostituire
i file bootstrap iniettati (per esempio sostituendo `SOUL.md` con una persona alternativa).

Se vuoi far sembrare l'agente meno generico, inizia da
[Guida alla personalità di SOUL.md](/it/concepts/soul).

Per ispezionare quanto contribuisce ogni file iniettato (raw vs iniettato, troncamento, più overhead dello schema degli strumenti), usa `/context list` o `/context detail`. Vedi [Contesto](/it/concepts/context).

## Gestione del tempo

Il prompt di sistema include una sezione dedicata **Data e ora correnti** quando il
fuso orario dell'utente è noto. Per mantenere stabile la cache del prompt, ora include solo il
**fuso orario** (nessun orologio dinamico o formato dell'ora).

Usa `session_status` quando l'agente ha bisogno dell'ora corrente; la scheda di stato
include una riga con il timestamp. Lo stesso strumento può facoltativamente impostare un override del modello per sessione
(`model=default` lo cancella).

Configura con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Vedi [Data e ora](/it/date-time) per i dettagli completi del comportamento.

## Skills

Quando esistono skill idonee, OpenClaw inietta un compatto **elenco delle skill disponibili**
(`formatSkillsForPrompt`) che include il **percorso del file** per ogni skill. Il
prompt istruisce il modello a usare `read` per caricare lo SKILL.md nella posizione
elencata (area di lavoro, gestita o inclusa). Se nessuna skill è idonea, la
sezione Skills viene omessa.

L'idoneità include gate dei metadati della skill, controlli dell'ambiente/configurazione runtime
e la allowlist effettiva delle skill dell'agente quando `agents.defaults.skills` o
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

Questo mantiene piccolo il prompt di base pur consentendo un uso mirato delle skill.

## Documentazione

Quando disponibile, il prompt di sistema include una sezione **Documentazione** che punta alla
directory locale della documentazione di OpenClaw (o `docs/` nell'area di lavoro del repo o la documentazione inclusa del
pacchetto npm) e indica anche il mirror pubblico, il repo sorgente, il Discord della community e
ClawHub ([https://clawhub.ai](https://clawhub.ai)) per la scoperta delle skill. Il prompt istruisce il modello a consultare prima la documentazione locale
per il comportamento, i comandi, la configurazione o l'architettura di OpenClaw e a eseguire
`openclaw status` direttamente quando possibile (chiedendo all'utente solo quando non ha accesso).
