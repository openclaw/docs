---
read_when:
    - Modifica del testo del prompt di sistema, dell'elenco degli strumenti o delle sezioni relative a orario/Heartbeat
    - Modifica del comportamento di bootstrap dello spazio di lavoro o di inserimento delle Skills
summary: Cosa contiene il prompt di sistema di OpenClaw e come viene assemblato
title: Prompt di sistema
x-i18n:
    generated_at: "2026-07-12T07:02:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1aabd41b5d4b51ed139d47b506017322c240bb1002bae901886d5f7991c0dc5e
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw crea il proprio prompt di sistema per ogni esecuzione dell'agente; non esiste un prompt predefinito in fase di esecuzione.

L'assemblaggio è articolato in tre livelli:

- `buildAgentSystemPrompt` genera il prompt a partire da input espliciti. Rimane un generatore puro e non legge direttamente la configurazione globale.
- `resolveAgentSystemPromptConfig` risolve, per uno specifico agente, i parametri del prompt basati sulla configurazione (visualizzazione del proprietario, suggerimenti TTS, alias dei modelli, modalità di citazione della memoria, modalità di delega ai sottoagenti).
- Gli adattatori di runtime (incorporati, CLI, anteprime di comandi/esportazioni, Compaction) raccolgono dati aggiornati (strumenti, stato della sandbox, funzionalità del canale, file di contesto, contributi al prompt del provider) e chiamano la facciata del prompt configurata.

In questo modo, le superfici del prompt esportate e di debug rimangono allineate con le esecuzioni effettive, senza trasformare ogni dettaglio del runtime in un unico generatore monolitico.

I Plugin dei provider possono fornire indicazioni compatibili con la cache senza sostituire il prompt gestito da OpenClaw. Il runtime di un provider può:

- sostituire una delle tre sezioni principali denominate: `interaction_style`, `tool_call_style`, `execution_bias`
- inserire un **prefisso stabile** sopra il limite della cache del prompt
- inserire un **suffisso dinamico** sotto il limite della cache del prompt

Usa i contributi gestiti dal provider per le ottimizzazioni specifiche della famiglia di modelli. Riserva l'hook legacy `before_prompt_build` alla compatibilità o a modifiche del prompt realmente globali.

L'overlay incluso per la famiglia GPT-5 di OpenAI/Codex (`resolveGpt5SystemPromptContribution`) usa questo meccanismo: un contratto di comportamento `stablePrefix` (criteri di esecuzione, disciplina nell'uso degli strumenti, contratto dell'output, contratto di completamento) più una sostituzione facoltativa di `interaction_style` per un tono più cordiale. Si applica a qualsiasi ID modello `gpt-5*` instradato tramite i Plugin OpenAI o Codex ed è controllato da `agents.defaults.promptOverlays.gpt5.personality` (`"friendly"`/`"on"` oppure `"off"`).

## Struttura

Il prompt è compatto e comprende sezioni fisse:

- **Strumenti**: promemoria che gli strumenti strutturati costituiscono la fonte autorevole, più indicazioni sull'uso degli strumenti in fase di esecuzione. Quando lo strumento sperimentale `update_plan` è abilitato (`tools.experimental.planTool`), la sua descrizione aggiunge le seguenti indicazioni: usarlo solo per attività non banali articolate in più passaggi, mantenere al massimo un passaggio `in_progress` e non usarlo per semplici attività composte da un solo passaggio.
- **Orientamento all'esecuzione**: agire nello stesso turno sulle richieste attuabili, continuare fino al completamento o finché non si è bloccati, recuperare da risultati insufficienti degli strumenti, verificare in tempo reale lo stato modificabile ed effettuare una verifica prima di concludere.
- **Sicurezza**: breve promemoria sui vincoli contro comportamenti volti ad acquisire potere o ad aggirare la supervisione.
- **Skills** (quando disponibili): spiega al modello come caricare su richiesta le istruzioni delle Skills.
- **Controllo di OpenClaw**: preferire lo strumento `gateway` per le operazioni di configurazione e riavvio; non inventare comandi CLI.
- **Aggiornamento automatico di OpenClaw**: esaminare in sicurezza la configurazione con `config.schema.lookup`, modificarla con `config.patch`, sostituire l'intera configurazione con `config.apply` ed eseguire `update.run` solo su esplicita richiesta dell'utente. Lo strumento `gateway` esposto all'agente rifiuta di riscrivere `tools.exec.ask` / `tools.exec.security`, inclusi gli alias legacy `tools.bash.*` che vengono normalizzati in questi percorsi protetti.
- **Area di lavoro**: directory di lavoro (`agents.defaults.workspace`).
- **Documentazione**: percorso locale della documentazione e dei sorgenti e indicazioni su quando consultarli.
- **File dell'area di lavoro (inseriti)**: segnala che i file di bootstrap sono inclusi di seguito.
- **Sandbox** (quando abilitata): runtime in sandbox, percorsi della sandbox, disponibilità dell'esecuzione con privilegi elevati.
- **Data e ora correnti**: solo il fuso orario (stabile rispetto alla cache; l'orario aggiornato proviene da `session_status`).
- **Direttive per l'output dell'assistente**: sintassi compatta per allegati, note vocali e tag di risposta.
- **Heartbeat**: prompt di Heartbeat e comportamento di conferma, quando gli Heartbeat sono abilitati per l'agente predefinito.
- **Runtime**: host, sistema operativo, Node, modello, radice del repository (se rilevata), livello di ragionamento (una riga).
- **Ragionamento**: livello di visibilità corrente e suggerimento sull'opzione `/reasoning`.

I contenuti stabili di grandi dimensioni (incluso il **Contesto del progetto**) rimangono sopra il limite interno della cache del prompt. Le sezioni variabili per turno (indicazioni per l'incorporamento dell'interfaccia di controllo, **Messaggistica**, **Voce**, **Contesto della chat di gruppo**, **Reazioni**, **Heartbeat**, **Runtime**) vengono aggiunte sotto tale limite, in modo che i backend locali dotati di cache dei prefissi possano riutilizzare il prefisso stabile dell'area di lavoro nei diversi turni del canale. Le descrizioni degli strumenti dovrebbero evitare di incorporare i nomi dei canali correnti quando lo schema accettato contiene già tale dettaglio di runtime.

La sezione degli strumenti include anche indicazioni per le attività di lunga durata:

- usare Cron per i follow-up futuri (`check back later`, promemoria, attività ricorrenti), anziché cicli di sospensione con `exec`, espedienti di ritardo con `yieldMs` o interrogazioni ripetute tramite `process`
- usare `exec` / `process` solo per i comandi che iniziano immediatamente e continuano in background
- quando è abilitata la riattivazione automatica al completamento, avviare il comando una sola volta e affidarsi al percorso di riattivazione basato su notifiche push
- usare `process` per registri, stato, input o interventi su un comando in esecuzione
- per attività più complesse, preferire `sessions_spawn`; il completamento dei sottoagenti è basato su notifiche push e viene annunciato automaticamente al richiedente
- non interrogare ripetutamente `subagents list` / `sessions_list` in un ciclo solo per attendere il completamento

`agents.defaults.subagents.delegationMode` (valore predefinito `"suggest"`) può rafforzare queste indicazioni. `"prefer"` aggiunge una sezione dedicata **Delega ai sottoagenti**, che indica all'agente principale di comportarsi come coordinatore reattivo e di affidare tramite `sessions_spawn` qualsiasi attività più complessa di una risposta diretta. Ciò riguarda solo il prompt; i criteri degli strumenti continuano a determinare se `sessions_spawn` è disponibile.

I vincoli di sicurezza nel prompt di sistema sono indicativi, non coercitivi. Per un'applicazione rigorosa, usa i criteri degli strumenti, le approvazioni delle esecuzioni, la sandbox e gli elenchi di canali consentiti; per scelta progettuale, gli operatori possono disabilitare i vincoli del prompt.

Nei canali con schede o pulsanti di approvazione nativi, il prompt indica all'agente di affidarsi innanzitutto a tale interfaccia e di includere un comando manuale `/approve` solo quando il risultato dello strumento segnala che le approvazioni tramite chat non sono disponibili o che l'approvazione manuale è l'unica possibilità.

## Modalità del prompt

OpenClaw genera prompt di sistema più brevi per i sottoagenti. Il runtime imposta un `promptMode` per ogni esecuzione (non è una configurazione esposta all'utente):

- `full` (valore predefinito): tutte le sezioni precedenti.
- `minimal`: usata per i sottoagenti; omette la sezione del prompt relativa alla memoria (inclusa come **Richiamo della memoria**), **Aggiornamento automatico di OpenClaw**, **Alias dei modelli**, **Identità dell'utente**, **Direttive per l'output dell'assistente**, **Messaggistica**, **Risposte silenziose** e **Heartbeat**. Rimangono disponibili gli strumenti, **Sicurezza**, **Skills** (quando fornite), Area di lavoro, Sandbox, Data e ora correnti (quando note), Runtime e il contesto inserito.
- `none`: restituisce solo la riga di identità di base.

Con `promptMode=minimal`, i prompt aggiuntivi inseriti sono denominati **Contesto del sottoagente** anziché **Contesto della chat di gruppo**.

Per le esecuzioni di risposta automatica sui canali, OpenClaw omette la sezione generica **Risposte silenziose** quando il contesto diretto, di gruppo o riservato esclusivamente allo strumento di messaggistica definisce già il contratto della risposta visibile. Solo la modalità automatica legacy per gruppi/canali mostra `NO_REPLY`; le chat dirette e le risposte basate esclusivamente sullo strumento di messaggistica non includono indicazioni sui token silenziosi.

## Istantanee dei prompt

OpenClaw conserva istantanee dei prompt sottoposte a controllo di versione per il percorso principale del runtime Codex in `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Queste rappresentano parametri selezionati di thread/turno dell'app server, oltre a una ricostruzione della pila dei livelli di prompt associati al modello per turni diretti di Telegram, turni di gruppo di Discord e turni di Heartbeat: una fixture del prompt del modello Codex `gpt-5.5` con versione fissata, il testo per sviluppatori relativo alle autorizzazioni del percorso principale di Codex, le istruzioni per sviluppatori di OpenClaw, le istruzioni della modalità di collaborazione limitate al turno quando OpenClaw le fornisce, l'input del turno dell'utente e i riferimenti alle specifiche dinamiche degli strumenti.

Aggiorna la fixture del prompt del modello Codex con versione fissata usando `pnpm prompt:snapshots:sync-codex-model`. Per impostazione predefinita, il comando cerca prima `$CODEX_HOME/models_cache.json`, quindi `~/.codex/models_cache.json` e infine il percorso convenzionale del checkout del manutentore `~/code/codex/codex-rs/models-manager/models.json`; se nessuno di questi file esiste, termina senza modificare la fixture sottoposta a controllo di versione. Specifica `--catalog <path>` per aggiornarla da un determinato file `models_cache.json` o `models.json`.

Queste istantanee non rappresentano un'acquisizione grezza, byte per byte, della richiesta OpenAI. Codex può aggiungere un contesto dell'area di lavoro gestito dal runtime (`AGENTS.md`, contesto dell'ambiente, memorie, istruzioni dell'applicazione o dei Plugin, istruzioni integrate della modalità di collaborazione predefinita) dopo che OpenClaw ha inviato i parametri del thread e del turno.

Rigenerale con `pnpm prompt:snapshots:gen`; verifica eventuali divergenze con `pnpm prompt:snapshots:check`. La CI esegue il controllo delle divergenze insieme agli shard dei limiti aggiuntivi, così le modifiche ai prompt e gli aggiornamenti delle istantanee vengono inclusi nella stessa PR.

## Inserimento del bootstrap dell'area di lavoro

I file di bootstrap vengono risolti dall'area di lavoro attiva e instradati verso la superficie del prompt corrispondente alla loro durata:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo nelle aree di lavoro appena create)
- `MEMORY.md`, se presente

Nell'infrastruttura nativa di Codex, OpenClaw evita di ripetere i file stabili dell'area di lavoro a ogni turno dell'utente. Codex carica `AGENTS.md` tramite il proprio meccanismo di individuazione della documentazione del progetto. `TOOLS.md` viene inoltrato come istruzioni per sviluppatori ereditate da Codex. `SOUL.md`, `IDENTITY.md` e `USER.md` vengono inoltrati come istruzioni per sviluppatori relative alla collaborazione e limitate al turno, affinché i sottoagenti nativi di Codex non le ereditino. Il contenuto di `HEARTBEAT.md` non viene inserito direttamente; quando il file esiste e non è vuoto, i turni di Heartbeat ricevono una nota della modalità di collaborazione che rimanda al file. Anche il contenuto di `MEMORY.md` non viene incollato in ogni turno nativo di Codex: quando gli strumenti di memoria sono disponibili per l'area di lavoro, i turni di Codex ricevono una breve nota sulla memoria dell'area di lavoro che indirizza il modello a `memory_search` o `memory_get`. Se gli strumenti sono disabilitati, la ricerca nella memoria non è disponibile o l'area di lavoro attiva è diversa dall'area di lavoro della memoria dell'agente, `MEMORY.md` ricorre al normale percorso limitato del contesto del turno. `BOOTSTRAP.md` mantiene il normale ruolo di contesto del turno.

Nelle infrastrutture diverse da Codex, i file di bootstrap vengono integrati nel prompt di OpenClaw in base alle condizioni già esistenti. `HEARTBEAT.md` viene omesso nelle normali esecuzioni quando gli Heartbeat sono disabilitati per l'agente predefinito oppure `agents.defaults.heartbeat.includeSystemPromptSection` è impostato su false. Mantieni concisi i file inseriti, in particolare `MEMORY.md` nelle infrastrutture diverse da Codex: dovrebbe rimanere un riepilogo curato a lungo termine, mentre le note giornaliere dettagliate dovrebbero essere conservate in `memory/*.md` e recuperate su richiesta tramite `memory_search` / `memory_get`. I file `MEMORY.md` di grandi dimensioni nelle infrastrutture diverse da Codex aumentano l'utilizzo del prompt e possono essere inseriti solo parzialmente in base ai limiti dei file di bootstrap riportati di seguito.

<Note>
I file giornalieri `memory/*.md` **non** fanno parte del normale Contesto del progetto di bootstrap. Nei turni ordinari vengono consultati su richiesta tramite `memory_search` / `memory_get`, quindi non incidono sulla finestra di contesto a meno che il modello non li legga esplicitamente. I turni semplici `/new` e `/reset` costituiscono un'eccezione: il runtime può anteporre la memoria giornaliera recente come blocco di contesto iniziale monouso per quel primo turno.
</Note>

I file di grandi dimensioni vengono troncati con un indicatore:

| Limite                                      | Chiave di configurazione                            | Valore predefinito |
| ------------------------------------------- | --------------------------------------------------- | ------------------ |
| Numero massimo di caratteri per file        | `agents.defaults.bootstrapMaxChars`                 | 20000              |
| Totale complessivo per tutti i file         | `agents.defaults.bootstrapTotalMaxChars`            | 60000              |
| Avviso di troncamento (`off`\|`once`\|`always`) | `agents.defaults.bootstrapPromptTruncationWarning` | `always`           |

Per i file mancanti viene inserito un breve indicatore di file mancante. I conteggi grezzi e inseriti dettagliati rimangono disponibili nella diagnostica, ad esempio in `/context`, `/status`, doctor e nei registri.

Per i file di memoria, il troncamento non comporta perdita di dati: il file rimane integro sul disco. Nell'infrastruttura nativa di Codex, `MEMORY.md` viene letto su richiesta tramite gli strumenti di memoria, quando disponibili, altrimenti si usa un inserimento limitato nel prompt. Nelle altre infrastrutture, il modello vede soltanto la copia inserita in forma abbreviata finché non legge o cerca direttamente nella memoria. Se `MEMORY.md` viene troncato ripetutamente, condensalo in un riepilogo permanente più breve, sposta la cronologia dettagliata in `memory/*.md` oppure aumenta intenzionalmente i limiti del bootstrap.

Le sessioni dei sotto-agenti inseriscono solo `AGENTS.md` e `TOOLS.md` (gli altri file di bootstrap vengono esclusi per mantenere ridotto il contesto del sotto-agente).

Gli hook interni possono intercettare questo passaggio tramite l'evento `agent:bootstrap` per modificare o sostituire i file di bootstrap inseriti (ad esempio sostituendo `SOUL.md` con una personalità alternativa).

Per ottenere un tono meno generico, inizia dalla [Guida alla personalità di SOUL.md](/it/concepts/soul).

Per verificare quanto contribuisce ciascun file inserito (contenuto grezzo rispetto a quello inserito, troncamento, sovraccarico dello schema degli strumenti), usa `/context list` o `/context detail`. Consulta [Contesto](/it/concepts/context).

## Gestione dell'ora

La sezione **Data e ora correnti** appare solo quando è noto il fuso orario dell'utente e include esclusivamente il **fuso orario** (senza orologio dinamico né formato dell'ora), per mantenere stabile la cache del prompt.

Usa `session_status` quando l'agente necessita dell'ora corrente; la relativa scheda di stato include una riga con la marca temporale. Lo stesso strumento può facoltativamente impostare una sostituzione del modello per la singola sessione (`model=default` la rimuove).

Configura tramite:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulta [Fusi orari](/it/concepts/timezone) e [Data e ora](/it/date-time) per i dettagli completi sul comportamento.

## Skills

Quando esistono Skills idonee, OpenClaw inserisce un elenco compatto `<available_skills>` (`formatSkillsForPrompt`) con il **percorso del file** e, per ciascuna Skill, un marcatore `<version>sha256:...</version>` derivato dal contenuto. Il prompt indica al modello di usare `read` per caricare il file SKILL.md dalla posizione elencata (area di lavoro, gestita o inclusa) e di rileggere una Skill quando il relativo `<version>` differisce da quello di un turno precedente. Se non vi sono Skills idonee, la sezione Skills viene omessa.

I turni Codex nativi ricevono questo elenco come istruzioni dello sviluppatore per la collaborazione limitate al turno, anziché come input utente per ogni turno, fatta eccezione per i turni cron leggeri che mantengono esattamente il prompt pianificato. Gli altri ambienti di esecuzione mantengono la normale sezione del prompt.

La posizione può indicare una Skill annidata, ad esempio `skills/personal/foo/SKILL.md`. L'annidamento ha unicamente scopo organizzativo; il prompt usa il nome semplice della Skill definito nel frontmatter di `SKILL.md`.

L'idoneità comprende i criteri dei metadati della Skill, i controlli dell'ambiente e della configurazione di runtime e l'elenco consentito effettivo delle Skills dell'agente quando è configurato `agents.defaults.skills` o `agents.list[].skills`. Le Skills incluse nei Plugin sono idonee solo quando il Plugin proprietario è abilitato, consentendo ai Plugin di strumenti di offrire guide operative più approfondite senza incorporare tutte queste indicazioni in ogni descrizione degli strumenti.

```xml
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
    <version>sha256:...</version>
  </skill>
</available_skills>
```

Ciò mantiene ridotto il prompt di base, consentendo comunque l'uso mirato delle Skills. Il dimensionamento è gestito dal sottosistema delle Skills, separatamente dal dimensionamento generico della lettura e dell'inserimento in fase di runtime:

| Ambito        | Budget del prompt per le Skills                    | Budget degli estratti di runtime  |
| ------------- | -------------------------------------------------- | --------------------------------- |
| Globale       | `skills.limits.maxSkillsPromptChars`               | `agents.defaults.contextLimits.*` |
| Per agente    | `agents.list[].skillsLimits.maxSkillsPromptChars`  | `agents.list[].contextLimits.*`   |

Il budget degli estratti di runtime comprende `memory_get`, i risultati degli strumenti in tempo reale e gli aggiornamenti di `AGENTS.md` successivi alla Compaction.

## Documentazione

La sezione **Documentazione** rimanda alla documentazione locale quando disponibile (`docs/` in un checkout Git o la documentazione inclusa nel pacchetto npm), altrimenti ricorre a [https://docs.openclaw.ai](https://docs.openclaw.ai). Elenca inoltre la posizione del codice sorgente di OpenClaw: i checkout Git espongono la radice del codice sorgente locale, mentre le installazioni da pacchetto forniscono l'URL del sorgente su GitHub con l'indicazione di consultarlo quando la documentazione è incompleta o obsoleta.

Il prompt presenta la documentazione come fonte autorevole per la conoscenza di OpenClaw prima che il modello comprenda il funzionamento di OpenClaw (memoria/note giornaliere, sessioni, strumenti, Gateway, configurazione, comandi, contesto del progetto) e indica al modello di considerare `AGENTS.md`, il contesto del progetto, le note dell'area di lavoro, del profilo e della memoria, nonché `memory_search`, come contesto di istruzioni o memoria dell'utente, anziché come conoscenza della progettazione o dell'implementazione di OpenClaw. Se la documentazione non tratta un argomento o è obsoleta, il modello dovrebbe dichiararlo e consultare il codice sorgente. Indica inoltre al modello di eseguire autonomamente `openclaw status` quando possibile, rivolgendosi all'utente solo se non dispone dell'accesso necessario.

Per la configurazione in particolare, indirizza gli agenti all'azione `config.schema.lookup` dello strumento `gateway` per ottenere documentazione e vincoli esatti a livello di singolo campo, quindi a `docs/gateway/configuration.md` e `docs/gateway/configuration-reference.md` per indicazioni più generali.

## Contenuti correlati

- [Runtime dell'agente](/it/concepts/agent)
- [Area di lavoro dell'agente](/it/concepts/agent-workspace)
- [Motore del contesto](/it/concepts/context-engine)
