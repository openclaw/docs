---
read_when:
    - Modifica del testo del prompt di sistema, dell'elenco degli strumenti o delle sezioni tempo/Heartbeat
    - Modifica del comportamento di bootstrap dello spazio di lavoro o di inserimento delle Skills
summary: Che cosa contiene il prompt di sistema di OpenClaw e come viene assemblato
title: Prompt di sistema
x-i18n:
    generated_at: "2026-05-02T22:18:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b8761a8722bb328b937e0832774be7b4e99602ae032c9a255f26843237c110c
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw crea un prompt di sistema personalizzato per ogni esecuzione dell'agente. Il prompt è **di proprietà di OpenClaw** e non usa il prompt predefinito di pi-coding-agent.

Il prompt viene assemblato da OpenClaw e iniettato in ogni esecuzione dell'agente.

I plugin provider possono contribuire con indicazioni per il prompt sensibili alla cache senza sostituire
l'intero prompt di proprietà di OpenClaw. Il runtime del provider può:

- sostituire un piccolo insieme di sezioni core nominate (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- iniettare un **prefisso stabile** sopra il limite della cache del prompt
- iniettare un **suffisso dinamico** sotto il limite della cache del prompt

Usa contributi di proprietà del provider per la regolazione specifica della famiglia di modelli. Mantieni la mutazione legacy del prompt
`before_prompt_build` per compatibilità o per modifiche del prompt davvero globali,
non per il normale comportamento del provider.

L'overlay della famiglia OpenAI GPT-5 mantiene piccola la regola di esecuzione core e aggiunge
indicazioni specifiche del modello per l'aggancio della persona, output conciso, disciplina degli strumenti,
ricerca parallela, copertura dei deliverable, verifica, contesto mancante e
igiene dello strumento terminale.

## Struttura

Il prompt è intenzionalmente compatto e usa sezioni fisse:

- **Strumenti**: promemoria della fonte di verità degli strumenti strutturati più indicazioni runtime sull'uso degli strumenti.
- **Pregiudizio di esecuzione**: indicazioni compatte di completamento: agisci nel turno sulle
  richieste azionabili, continua fino al completamento o al blocco, recupera da risultati deboli degli strumenti,
  controlla lo stato mutabile live e verifica prima di finalizzare.
- **Sicurezza**: breve promemoria di guardrail per evitare comportamenti di ricerca del potere o l'elusione della supervisione.
- **Skills** (quando disponibili): indica al modello come caricare le istruzioni delle skill su richiesta.
- **Auto-aggiornamento di OpenClaw**: come ispezionare la configurazione in modo sicuro con
  `config.schema.lookup`, correggere la configurazione con `config.patch`, sostituire l'intera
  configurazione con `config.apply` ed eseguire `update.run` solo su richiesta esplicita dell'utente. Anche lo strumento solo per proprietari `gateway` rifiuta di riscrivere
  `tools.exec.ask` / `tools.exec.security`, inclusi gli alias legacy `tools.bash.*`
  che si normalizzano in quei percorsi exec protetti.
- **Workspace**: directory di lavoro (`agents.defaults.workspace`).
- **Documentazione**: percorso locale alla documentazione di OpenClaw (repo o pacchetto npm) e quando leggerla.
- **File del workspace (iniettati)**: indica che i file di bootstrap sono inclusi sotto.
- **Sandbox** (quando abilitata): indica runtime in sandbox, percorsi della sandbox e se è disponibile exec elevato.
- **Data e ora correnti**: ora locale dell'utente, fuso orario e formato dell'ora.
- **Tag di risposta**: sintassi opzionale dei tag di risposta per i provider supportati.
- **Heartbeats**: prompt Heartbeat e comportamento di ack, quando gli heartbeat sono abilitati per l'agente predefinito.
- **Runtime**: host, sistema operativo, node, modello, radice del repo (quando rilevata), livello di ragionamento (una riga).
- **Ragionamento**: livello di visibilità corrente + suggerimento per l'interruttore /reasoning.

OpenClaw mantiene grandi contenuti stabili, incluso **Contesto del progetto**, sopra il
limite interno della cache del prompt. Sezioni volatili di canale/sessione come
indicazioni di incorporamento della Control UI, **Messaggistica**, **Voce**, **Contesto della chat di gruppo**,
**Reazioni**, **Heartbeats** e **Runtime** vengono aggiunte sotto quel limite
così i backend locali con cache di prefisso possono riutilizzare il prefisso stabile del workspace
tra i turni del canale. Anche le descrizioni degli strumenti dovrebbero evitare di incorporare i nomi correnti
dei canali quando lo schema accettato trasporta già quel dettaglio runtime.

La sezione Strumenti include anche indicazioni runtime per il lavoro a lunga esecuzione:

- usa cron per follow-up futuri (`check back later`, promemoria, lavoro ricorrente)
  invece di cicli sleep con `exec`, trucchi di ritardo `yieldMs` o polling ripetuto di `process`
- usa `exec` / `process` solo per comandi che iniziano ora e continuano a girare
  in background
- quando il risveglio automatico al completamento è abilitato, avvia il comando una volta e affidati al
  percorso di risveglio push-based quando emette output o fallisce
- usa `process` per log, stato, input o intervento quando devi
  ispezionare un comando in esecuzione
- se il compito è più grande, preferisci `sessions_spawn`; il completamento del sottoagente è
  push-based e si annuncia automaticamente al richiedente
- non eseguire polling di `subagents list` / `sessions_list` in ciclo solo per attendere
  il completamento

Quando lo strumento sperimentale `update_plan` è abilitato, Strumenti dice anche al
modello di usarlo solo per lavoro multi-step non banale, mantenere esattamente uno step
`in_progress` ed evitare di ripetere l'intero piano dopo ogni aggiornamento.

I guardrail di sicurezza nel prompt di sistema sono consultivi. Guidano il comportamento del modello ma non applicano la policy. Usa policy degli strumenti, approvazioni exec, sandboxing e allowlist dei canali per l'applicazione forte; gli operatori possono disabilitarli per progettazione.

Sui canali con schede/pulsanti di approvazione nativi, il prompt runtime ora dice
all'agente di affidarsi prima a quell'interfaccia di approvazione nativa. Dovrebbe includere un comando manuale
`/approve` solo quando il risultato dello strumento dice che le approvazioni via chat non sono disponibili o che
l'approvazione manuale è l'unico percorso.

## Modalità del prompt

OpenClaw può renderizzare prompt di sistema più piccoli per i sottoagenti. Il runtime imposta un
`promptMode` per ogni esecuzione (non una configurazione visibile all'utente):

- `full` (predefinito): include tutte le sezioni sopra.
- `minimal`: usato per i sottoagenti; omette **Skills**, **Richiamo della memoria**, **Auto-aggiornamento di OpenClaw
  Self-Update**, **Alias dei modelli**, **Identità utente**, **Tag di risposta**,
  **Messaggistica**, **Risposte silenziose** e **Heartbeats**. Strumenti, **Sicurezza**,
  Workspace, Sandbox, Data e ora correnti (quando note), Runtime e contesto iniettato
  restano disponibili.
- `none`: restituisce solo la riga di identità di base.

Quando `promptMode=minimal`, i prompt extra iniettati sono etichettati **Contesto del sottoagente**
invece di **Contesto della chat di gruppo**.

Per le esecuzioni di risposta automatica del canale, OpenClaw può omettere la sezione generica **Risposte silenziose**
quando il contesto della chat diretta/di gruppo include già il comportamento
`NO_REPLY` risolto e specifico della conversazione. Questo evita di ripetere i meccanismi dei token
sia nel prompt di sistema globale sia nel contesto del canale.

## Snapshot del prompt

OpenClaw mantiene snapshot del prompt del percorso felice salvati nel repository per il runtime
Codex/message-tool sotto `test/fixtures/agents/prompt-snapshots/happy-path/`. Renderizzano
parametri selezionati di thread/turno dell'app-server più uno stack ricostruito di livelli del prompt vincolati al modello
per turni Telegram diretti, Discord di gruppo e Heartbeat. Quello stack
include una fixture del prompt del modello Codex `gpt-5.5` fissata generata dalla forma del
catalogo/cache dei modelli di Codex, il testo developer dei permessi del percorso felice Codex,
le istruzioni developer di OpenClaw, l'input del turno utente e riferimenti alle specifiche dinamiche
degli strumenti.

Aggiorna la fixture fissata del prompt del modello Codex con
`pnpm prompt:snapshots:sync-codex-model`. Per impostazione predefinita, lo script cerca
la cache runtime di Codex in `$CODEX_HOME/models_cache.json`, poi in
`~/.codex/models_cache.json` e solo dopo ripiega sulla convenzione del checkout Codex del maintainer
in `~/code/codex/codex-rs/models-manager/models.json`. Se
nessuna di queste fonti esiste, il comando esce senza modificare la fixture
salvata nel repository. Passa `--catalog <path>` per aggiornare da uno specifico file `models_cache.json`
o `models.json`.

Questi snapshot non sono ancora una cattura grezza byte-per-byte della richiesta OpenAI. Codex
può aggiungere contesto del workspace di proprietà del runtime come `AGENTS.md`, contesto
dell'ambiente, memorie, istruzioni di app/plugin e future istruzioni di modalità collaborazione
dentro il runtime Codex dopo che OpenClaw invia i parametri di thread e turno.

Rigenerali con `pnpm prompt:snapshots:gen` e verifica le derive con
`pnpm prompt:snapshots:check`. La CI esegue il controllo di deriva nello shard di confine
aggiuntivo così le modifiche del prompt e gli aggiornamenti degli snapshot restano collegati alla stessa
PR.

## Iniezione del bootstrap del workspace

I file di bootstrap vengono ridotti e aggiunti sotto **Contesto del progetto** così il modello vede il contesto di identità e profilo senza bisogno di letture esplicite:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo su workspace completamente nuovi)
- `MEMORY.md` quando presente

Tutti questi file sono **iniettati nella finestra di contesto** a ogni turno salvo quando
si applica un gate specifico del file. `HEARTBEAT.md` viene omesso nelle esecuzioni normali quando
gli heartbeat sono disabilitati per l'agente predefinito o
`agents.defaults.heartbeat.includeSystemPromptSection` è false. Mantieni concisi i file
iniettati, specialmente `MEMORY.md`, che può crescere nel tempo e portare a
un uso del contesto inaspettatamente alto e a compaction più frequente.

<Note>
I file giornalieri `memory/*.md` **non** fanno parte del normale Contesto del progetto di bootstrap. Nei turni ordinari sono accessibili su richiesta tramite gli strumenti `memory_search` e `memory_get`, quindi non contano nella finestra di contesto a meno che il modello non li legga esplicitamente. I turni `/new` e `/reset` nudi sono l'eccezione: il runtime può anteporre la memoria giornaliera recente come blocco di contesto di avvio una tantum per quel primo turno.
</Note>

I file grandi sono troncati con un marcatore. La dimensione massima per file è controllata da
`agents.defaults.bootstrapMaxChars` (predefinito: 12000). Il contenuto totale di bootstrap iniettato
tra i file è limitato da `agents.defaults.bootstrapTotalMaxChars`
(predefinito: 60000). I file mancanti iniettano un breve marcatore di file mancante. Quando avviene il troncamento,
OpenClaw può iniettare un blocco di avviso nel Contesto del progetto; controllalo con
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
predefinito: `once`).

Le sessioni dei sottoagenti iniettano solo `AGENTS.md` e `TOOLS.md` (gli altri file di bootstrap
sono filtrati per mantenere piccolo il contesto del sottoagente).

Gli hook interni possono intercettare questo passaggio tramite `agent:bootstrap` per mutare o sostituire
i file di bootstrap iniettati (per esempio scambiando `SOUL.md` con una persona alternativa).

Se vuoi rendere l'agente meno generico, inizia con
[Guida alla personalità SOUL.md](/it/concepts/soul).

Per ispezionare quanto contribuisce ogni file iniettato (grezzo rispetto a iniettato, troncamento, più overhead dello schema degli strumenti), usa `/context list` o `/context detail`. Vedi [Contesto](/it/concepts/context).

## Gestione del tempo

Il prompt di sistema include una sezione dedicata **Data e ora correnti** quando il
fuso orario dell'utente è noto. Per mantenere stabile la cache del prompt, ora include solo
il **fuso orario** (nessun orologio dinamico o formato dell'ora).

Usa `session_status` quando l'agente ha bisogno dell'ora corrente; la scheda di stato
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
posizione elencata (workspace, gestita o in bundle). Se nessuna skill è idonea, la
sezione Skills viene omessa.

L'idoneità include gate dei metadati della skill, controlli di ambiente/configurazione runtime
e l'allowlist effettiva delle skill dell'agente quando `agents.defaults.skills` o
`agents.list[].skills` è configurato.

Le skill in bundle con plugin sono idonee solo quando il plugin proprietario è abilitato.
Questo consente ai plugin di strumenti di esporre guide operative più approfondite senza incorporare tutte
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

Questo mantiene piccolo il prompt di base abilitando comunque l'uso mirato delle skill.

Il budget dell'elenco delle skill è di proprietà del sottosistema delle skill:

- Predefinito globale: `skills.limits.maxSkillsPromptChars`
- Override per agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Gli estratti runtime generici limitati usano una superficie diversa:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Questa separazione mantiene il dimensionamento delle skill separato dal dimensionamento di lettura/iniezione runtime, come
`memory_get`, risultati degli strumenti live e aggiornamenti di AGENTS.md post-compaction.

## Documentazione

Il prompt di sistema include una sezione **Documentazione**. Quando la documentazione locale è disponibile, punta alla directory locale della documentazione di OpenClaw (`docs/` in un checkout Git o nella documentazione del pacchetto npm in bundle). Se la documentazione locale non è disponibile, ripiega su [https://docs.openclaw.ai](https://docs.openclaw.ai).

La stessa sezione include anche la posizione del sorgente di OpenClaw. I checkout Git espongono la radice locale del sorgente affinché l'agente possa ispezionare direttamente il codice. Le installazioni da pacchetto includono l'URL del sorgente GitHub e indicano all'agente di esaminare il sorgente lì ogni volta che la documentazione è incompleta o obsoleta. Il prompt segnala anche il mirror pubblico della documentazione, il Discord della community e ClawHub ([https://clawhub.ai](https://clawhub.ai)) per la scoperta di Skills. Indica al modello di consultare prima la documentazione per il comportamento, i comandi, la configurazione o l'architettura di OpenClaw, e di eseguire autonomamente `openclaw status` quando possibile (chiedendo all'utente solo quando non dispone dell'accesso). Per la configurazione in particolare, indirizza gli agenti all'azione dello strumento `gateway` `config.schema.lookup` per la documentazione e i vincoli esatti a livello di campo, quindi a `docs/gateway/configuration.md` e `docs/gateway/configuration-reference.md` per indicazioni più ampie.

## Correlati

- [Runtime dell'agente](/it/concepts/agent)
- [Area di lavoro dell'agente](/it/concepts/agent-workspace)
- [Motore di contesto](/it/concepts/context-engine)
