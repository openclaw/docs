---
read_when:
    - Modifica del testo del prompt di sistema, dell'elenco degli strumenti o delle sezioni relative a tempo/Heartbeat
    - Modifica del comportamento di bootstrap del workspace o di iniezione delle Skills
summary: Cosa contiene il prompt di sistema di OpenClaw e come viene assemblato
title: Prompt di sistema
x-i18n:
    generated_at: "2026-04-30T08:49:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c6258ad35d679eaa2bb4d2446e9edfc6bb129888681a0e5d5527c54c5476971
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw costruisce un prompt di sistema personalizzato per ogni esecuzione dell’agente. Il prompt è **di proprietà di OpenClaw** e non usa il prompt predefinito di pi-coding-agent.

Il prompt viene assemblato da OpenClaw e iniettato in ogni esecuzione dell’agente.

I Plugin provider possono contribuire indicazioni di prompt consapevoli della cache senza sostituire
l’intero prompt di proprietà di OpenClaw. Il runtime del provider può:

- sostituire un piccolo insieme di sezioni core denominate (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- iniettare un **prefisso stabile** sopra il confine della cache del prompt
- iniettare un **suffisso dinamico** sotto il confine della cache del prompt

Usa contributi di proprietà del provider per l’ottimizzazione specifica della famiglia di modelli. Mantieni la mutazione legacy del prompt
`before_prompt_build` per compatibilità o modifiche del prompt davvero globali,
non per il comportamento normale del provider.

L’overlay della famiglia OpenAI GPT-5 mantiene piccola la regola core di esecuzione e aggiunge
indicazioni specifiche del modello per aggancio della persona, output conciso, disciplina degli strumenti,
ricerca parallela, copertura dei deliverable, verifica, contesto mancante e
igiene degli strumenti da terminale.

## Struttura

Il prompt è intenzionalmente compatto e usa sezioni fisse:

- **Strumentazione**: promemoria sulla fonte di verità degli strumenti strutturati più indicazioni runtime sull’uso degli strumenti.
- **Bias di esecuzione**: indicazioni compatte di completamento: agisci nel turno sulle
  richieste azionabili, continua finché il lavoro è completato o bloccato, recupera da risultati deboli degli strumenti,
  controlla lo stato mutabile live e verifica prima di finalizzare.
- **Sicurezza**: breve promemoria di guardrail per evitare comportamenti di ricerca di potere o l’elusione della supervisione.
- **Skills** (quando disponibili): spiega al modello come caricare le istruzioni delle skill su richiesta.
- **Auto-aggiornamento di OpenClaw**: come ispezionare la configurazione in modo sicuro con
  `config.schema.lookup`, applicare patch alla configurazione con `config.patch`, sostituire l’intera
  configurazione con `config.apply` ed eseguire `update.run` solo su esplicita
  richiesta dell’utente. Lo strumento `gateway`, riservato al proprietario, rifiuta anche di riscrivere
  `tools.exec.ask` / `tools.exec.security`, inclusi gli alias legacy `tools.bash.*`
  che si normalizzano in quei percorsi exec protetti.
- **Area di lavoro**: directory di lavoro (`agents.defaults.workspace`).
- **Documentazione**: percorso locale alla documentazione di OpenClaw (repo o pacchetto npm) e quando leggerla.
- **File dell’area di lavoro (iniettati)**: indica che i file di bootstrap sono inclusi sotto.
- **Sandbox** (quando abilitata): indica runtime in sandbox, percorsi sandbox e se è disponibile exec elevato.
- **Data e ora correnti**: ora locale dell’utente, fuso orario e formato dell’ora.
- **Tag di risposta**: sintassi opzionale dei tag di risposta per i provider supportati.
- **Heartbeat**: prompt Heartbeat e comportamento ack, quando gli Heartbeat sono abilitati per l’agente predefinito.
- **Runtime**: host, OS, Node, modello, root del repo (quando rilevata), livello di pensiero (una riga).
- **Ragionamento**: livello di visibilità corrente + suggerimento toggle /reasoning.

OpenClaw mantiene i contenuti stabili di grandi dimensioni, incluso **Contesto del progetto**, sopra il
confine interno della cache del prompt. Le sezioni volatili di canale/sessione come
indicazioni di incorporamento della UI di controllo, **Messaggistica**, **Voce**, **Contesto della chat di gruppo**,
**Reazioni**, **Heartbeat** e **Runtime** vengono aggiunte sotto quel confine
così i backend locali con cache del prefisso possono riutilizzare il prefisso stabile dell’area di lavoro
tra i turni del canale. Allo stesso modo, le descrizioni degli strumenti dovrebbero evitare di incorporare i nomi correnti
dei canali quando lo schema accettato contiene già quel dettaglio runtime.

La sezione Strumentazione include anche indicazioni runtime per lavori di lunga durata:

- usa Cron per follow-up futuri (`check back later`, promemoria, lavoro ricorrente)
  invece di cicli sleep con `exec`, trucchi di ritardo `yieldMs` o polling ripetuto di `process`
- usa `exec` / `process` solo per comandi che iniziano ora e continuano a essere eseguiti
  in background
- quando la riattivazione automatica al completamento è abilitata, avvia il comando una volta e affidati al
  percorso di riattivazione push-based quando emette output o fallisce
- usa `process` per log, stato, input o intervento quando devi
  ispezionare un comando in esecuzione
- se l’attività è più grande, preferisci `sessions_spawn`; il completamento del sotto-agente è
  push-based e si annuncia automaticamente al richiedente
- non eseguire polling di `subagents list` / `sessions_list` in un ciclo solo per aspettare
  il completamento

Quando lo strumento sperimentale `update_plan` è abilitato, Strumentazione dice anche al
modello di usarlo solo per lavori non banali in più passaggi, mantenere esattamente un passaggio
`in_progress` ed evitare di ripetere l’intero piano dopo ogni aggiornamento.

I guardrail di sicurezza nel prompt di sistema sono consultivi. Guidano il comportamento del modello ma non applicano policy. Usa policy degli strumenti, approvazioni exec, sandboxing e allowlist dei canali per l’applicazione rigida; gli operatori possono disabilitarli per progettazione.

Sui canali con card/pulsanti di approvazione nativi, il prompt runtime ora dice
all’agente di affidarsi prima a quella UI di approvazione nativa. Dovrebbe includere un comando manuale
`/approve` solo quando il risultato dello strumento dice che le approvazioni via chat non sono disponibili o
l’approvazione manuale è l’unico percorso.

## Modalità del prompt

OpenClaw può renderizzare prompt di sistema più piccoli per i sotto-agenti. Il runtime imposta un
`promptMode` per ogni esecuzione (non è una configurazione esposta all’utente):

- `full` (predefinito): include tutte le sezioni sopra.
- `minimal`: usato per i sotto-agenti; omette **Skills**, **Richiamo memoria**, **Auto-aggiornamento di OpenClaw
  **, **Alias del modello**, **Identità utente**, **Tag di risposta**,
  **Messaggistica**, **Risposte silenziose** e **Heartbeat**. Strumentazione, **Sicurezza**,
  Area di lavoro, Sandbox, Data e ora correnti (quando note), Runtime e contesto
  iniettato rimangono disponibili.
- `none`: restituisce solo la riga di identità di base.

Quando `promptMode=minimal`, i prompt extra iniettati sono etichettati **Contesto del sotto-agente
** invece di **Contesto della chat di gruppo**.

Per le esecuzioni di risposta automatica del canale, OpenClaw può omettere la sezione generica **Risposte silenziose**
quando il contesto della chat diretta/di gruppo include già il comportamento
`NO_REPLY` specifico della conversazione risolto. Questo evita di ripetere i meccanismi dei token
sia nel prompt di sistema globale sia nel contesto del canale.

## Iniezione bootstrap dell’area di lavoro

I file bootstrap vengono ridotti e aggiunti sotto **Contesto del progetto** così il modello vede identità e contesto del profilo senza doverli leggere esplicitamente:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo su aree di lavoro appena create)
- `MEMORY.md` quando presente

Tutti questi file vengono **iniettati nella finestra di contesto** a ogni turno, a meno che
si applichi un gate specifico del file. `HEARTBEAT.md` viene omesso nelle esecuzioni normali quando
gli Heartbeat sono disabilitati per l’agente predefinito oppure
`agents.defaults.heartbeat.includeSystemPromptSection` è false. Mantieni concisi i file
iniettati, specialmente `MEMORY.md`, che può crescere nel tempo e portare a
un uso del contesto inaspettatamente alto e a Compaction più frequente.

<Note>
I file giornalieri `memory/*.md` **non** fanno parte del normale Contesto del progetto di bootstrap. Nei turni ordinari vengono consultati su richiesta tramite gli strumenti `memory_search` e `memory_get`, quindi non contano nella finestra di contesto a meno che il modello non li legga esplicitamente. I turni bare `/new` e `/reset` fanno eccezione: il runtime può anteporre memoria giornaliera recente come blocco di contesto di avvio una tantum per quel primo turno.
</Note>

I file grandi vengono troncati con un marker. La dimensione massima per file è controllata da
`agents.defaults.bootstrapMaxChars` (predefinito: 12000). Il contenuto bootstrap totale iniettato
tra i file è limitato da `agents.defaults.bootstrapTotalMaxChars`
(predefinito: 60000). I file mancanti iniettano un breve marker di file mancante. Quando si verifica il troncamento,
OpenClaw può iniettare un blocco di avviso nel Contesto del progetto; controllalo con
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
predefinito: `once`).

Le sessioni dei sotto-agenti iniettano solo `AGENTS.md` e `TOOLS.md` (gli altri file bootstrap
vengono filtrati per mantenere piccolo il contesto del sotto-agente).

Gli hook interni possono intercettare questo passaggio tramite `agent:bootstrap` per mutare o sostituire
i file bootstrap iniettati (per esempio scambiando `SOUL.md` con una persona alternativa).

Se vuoi rendere il suono dell’agente meno generico, inizia con
[Guida alla personalità SOUL.md](/it/concepts/soul).

Per ispezionare quanto contribuisce ciascun file iniettato (grezzo vs iniettato, troncamento, più overhead dello schema degli strumenti), usa `/context list` o `/context detail`. Vedi [Contesto](/it/concepts/context).

## Gestione del tempo

Il prompt di sistema include una sezione dedicata **Data e ora correnti** quando il
fuso orario dell’utente è noto. Per mantenere stabile la cache del prompt, ora include solo
il **fuso orario** (nessun orologio dinamico o formato dell’ora).

Usa `session_status` quando l’agente ha bisogno dell’ora corrente; la card di stato
include una riga di timestamp. Lo stesso strumento può facoltativamente impostare un override del modello per sessione
(`model=default` lo cancella).

Configura con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Vedi [Data e ora](/it/date-time) per i dettagli completi del comportamento.

## Skills

Quando esistono skill idonee, OpenClaw inietta un compatto **elenco delle skill disponibili**
(`formatSkillsForPrompt`) che include il **percorso del file** per ogni skill. Il
prompt istruisce il modello a usare `read` per caricare lo SKILL.md nella
posizione elencata (area di lavoro, gestita o inclusa). Se nessuna skill è idonea, la
sezione Skills viene omessa.

L’idoneità include gate dei metadati delle skill, controlli di ambiente/configurazione runtime
e l’allowlist effettiva delle skill dell’agente quando `agents.defaults.skills` o
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

Questo mantiene piccolo il prompt di base pur abilitando l’uso mirato delle skill.

Il budget dell’elenco delle skill è di proprietà del sottosistema delle skill:

- Predefinito globale: `skills.limits.maxSkillsPromptChars`
- Override per agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Gli estratti runtime generici e limitati usano una superficie diversa:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Questa separazione mantiene il dimensionamento delle skill distinto dal dimensionamento di lettura/iniezione runtime come
`memory_get`, risultati degli strumenti live e refresh post-Compaction di AGENTS.md.

## Documentazione

Il prompt di sistema include una sezione **Documentazione**. Quando la documentazione locale è disponibile,
punta alla directory locale della documentazione di OpenClaw (`docs/` in un checkout Git o la documentazione del pacchetto npm
inclusa). Se la documentazione locale non è disponibile, ripiega su
[https://docs.openclaw.ai](https://docs.openclaw.ai).

La stessa sezione include anche la posizione sorgente di OpenClaw. I checkout Git espongono la root sorgente locale
così l’agente può ispezionare direttamente il codice. Le installazioni da pacchetto includono l’URL sorgente
GitHub e dicono all’agente di revisionare lì il sorgente ogni volta che la documentazione è incompleta o
obsoleta. Il prompt nota anche il mirror pubblico della documentazione, il Discord della community e ClawHub
([https://clawhub.ai](https://clawhub.ai)) per la scoperta delle skill. Dice al modello di
consultare prima la documentazione per comportamento, comandi, configurazione o architettura di OpenClaw e di
eseguire `openclaw status` autonomamente quando possibile (chiedendo all’utente solo quando non ha accesso).
Per la configurazione nello specifico, indirizza gli agenti all’azione dello strumento `gateway`
`config.schema.lookup` per documentazione e vincoli esatti a livello di campo, poi a
`docs/gateway/configuration.md` e `docs/gateway/configuration-reference.md`
per indicazioni più ampie.

## Correlati

- [Runtime dell’agente](/it/concepts/agent)
- [Area di lavoro dell’agente](/it/concepts/agent-workspace)
- [Motore del contesto](/it/concepts/context-engine)
