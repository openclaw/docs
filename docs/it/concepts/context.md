---
read_when:
    - Vuoi capire cosa significa "contesto" in OpenClaw
    - Stai eseguendo il debug per capire perché il modello "sa" qualcosa (o l'ha dimenticato)
    - Vuoi ridurre il sovraccarico del contesto (/context, /status, /compact)
summary: 'Contesto: cosa vede il modello, come viene costruito e come esaminarlo'
title: Contesto
x-i18n:
    generated_at: "2026-07-12T06:58:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1eb3d342a601a447487640587f746cc80a133ede338a880741f53c3e01f20ed1
    source_path: concepts/context.md
    workflow: 16
---

Il "contesto" è **tutto ciò che OpenClaw invia al modello per un'esecuzione**. È limitato dalla **finestra di contesto** del modello (limite di token).

Modello mentale per principianti:

- **Prompt di sistema** (creato da OpenClaw): regole, strumenti, elenco delle Skills, ora/ambiente di esecuzione e file dell'area di lavoro inseriti.
- **Cronologia della conversazione**: i tuoi messaggi + i messaggi dell'assistente per questa sessione.
- **Chiamate/risultati degli strumenti + allegati**: output dei comandi, letture di file, immagini/audio e così via.

Il contesto _non equivale_ alla "memoria": la memoria può essere archiviata su disco e ricaricata in seguito; il contesto è ciò che si trova nella finestra corrente del modello.

## Avvio rapido (ispezionare il contesto)

- `/status` → vista rapida di "quanto è piena la mia finestra?" + impostazioni della sessione.
- `/context list` → cosa viene inserito + dimensioni approssimative (per file + totali).
- `/context detail` → analisi più approfondita: dimensioni per file, per schema degli strumenti, per voce delle Skills, dimensione del prompt di sistema e conteggio dei messaggi della trascrizione che possono essere sottoposti a Compaction.
- `/context map` → immagine a mappa ad albero in stile WinDirStat dei contributori al contesto monitorati nella sessione corrente.
- `/usage tokens` → aggiunge alle risposte normali un piè di pagina con l'utilizzo per risposta.
- `/compact` → riassume la cronologia meno recente in una voce compatta per liberare spazio nella finestra.

Vedi anche: [Comandi slash](/it/tools/slash-commands), [Utilizzo e costi dei token](/it/reference/token-use), [Compaction](/it/concepts/compaction).

## Esempio di output

I valori variano in base al modello, al provider, ai criteri degli strumenti e al contenuto dell'area di lavoro.

### `/context list`

```text
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 12,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```text
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

### `/context map`

Invia un'immagine generata dal rapporto dell'ultima esecuzione memorizzato nella cache e dalla trascrizione della sessione. Prima che un messaggio normale abbia prodotto un rapporto di esecuzione nella sessione, `/context map` restituisce un messaggio di indisponibilità anziché visualizzare una stima. L'area dei rettangoli è proporzionale ai caratteri monitorati nel prompt:

- trascrizione della conversazione (messaggi dell'utente, risposte dell'assistente, risultati degli strumenti, riepiloghi della Compaction), oltre al contesto di esecuzione per turno e alle aggiunte al prompt effettuate dagli hook che raggiungono solo il modello
- file dell'area di lavoro inseriti
- testo del prompt di sistema di base
- voci del prompt delle Skills
- schemi JSON degli strumenti

Il gruppo della conversazione cresce con il progredire della sessione, quindi la mappa cambia a ogni turno; dopo la Compaction si riduce a un riquadro di riepiloghi.

`/context list`, `/context detail` e `/context json` possono comunque ispezionare una stima calcolata su richiesta quando non è memorizzato nella cache alcun rapporto di esecuzione.

## Cosa viene conteggiato nella finestra di contesto

Tutto ciò che il modello riceve viene conteggiato, inclusi:

- Prompt di sistema (tutte le sezioni).
- Cronologia della conversazione.
- Chiamate agli strumenti + risultati degli strumenti.
- Allegati/trascrizioni (immagini/audio/file).
- Riepiloghi della Compaction e artefatti di eliminazione.
- "Wrapper" del provider o intestazioni nascoste (non visibili, ma comunque conteggiati).

## Come OpenClaw crea il prompt di sistema

Il prompt di sistema è **gestito da OpenClaw** e viene ricreato a ogni esecuzione. Include:

- Elenco degli strumenti + brevi descrizioni.
- Elenco delle Skills (solo metadati; vedi sotto).
- Posizione dell'area di lavoro.
- Ora (UTC + ora dell'utente convertita, se configurata).
- Metadati dell'ambiente di esecuzione (host/sistema operativo/modello/ragionamento).
- File di inizializzazione dell'area di lavoro inseriti in **Contesto del progetto**.

Analisi completa: [Prompt di sistema](/it/concepts/system-prompt).

## File dell'area di lavoro inseriti (Contesto del progetto)

Per impostazione predefinita, OpenClaw inserisce un insieme fisso di file dell'area di lavoro (se presenti):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo alla prima esecuzione)

I file di grandi dimensioni vengono troncati singolarmente utilizzando `agents.defaults.bootstrapMaxChars` (valore predefinito: `20000` caratteri). OpenClaw applica inoltre un limite totale all'inserimento dei file di inizializzazione mediante `agents.defaults.bootstrapTotalMaxChars` (valore predefinito: `60000` caratteri). `/context` mostra le dimensioni **originali rispetto a quelle inserite** e indica se si è verificato un troncamento.

Quando si verifica un troncamento, l'ambiente di esecuzione può inserire nel prompt un blocco di avviso nella sezione Contesto del progetto. Configura questo comportamento con `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; valore predefinito: `always`).

## Skills: inserite rispetto a caricate su richiesta

Il prompt di sistema include un **elenco delle Skills** compatto (nome + descrizione + posizione). Questo elenco comporta un sovraccarico effettivo.

Le istruzioni delle Skills _non_ sono incluse per impostazione predefinita. Il modello deve eseguire `read` sul file `SKILL.md` della Skill **solo quando necessario**.

## Strumenti: esistono due costi

Gli strumenti influiscono sul contesto in due modi:

1. **Testo dell'elenco degli strumenti** nel prompt di sistema (ciò che appare come "Strumenti").
2. **Schemi degli strumenti** (JSON). Vengono inviati al modello affinché possa chiamare gli strumenti. Vengono conteggiati nel contesto anche se non sono visibili come testo normale.

`/context detail` analizza gli schemi degli strumenti più grandi, così puoi vedere quali incidono maggiormente.

## Comandi, direttive e "scorciatoie incorporate"

I comandi slash vengono gestiti dal Gateway. Esistono diversi comportamenti:

- **Comandi autonomi**: un messaggio contenente solo `/...` viene eseguito come comando.
- **Direttive**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue` vengono rimossi prima che il modello riceva il messaggio.
  - I messaggi contenenti solo direttive mantengono le impostazioni della sessione.
  - Le direttive incorporate in un messaggio normale fungono da indicazioni per il singolo messaggio.
- **Scorciatoie incorporate** (solo mittenti inclusi nell'elenco consentito): determinati token `/...` all'interno di un messaggio normale possono essere eseguiti immediatamente (esempio: "ciao /status") e vengono rimossi prima che il modello riceva il testo restante.

Dettagli: [Comandi slash](/it/tools/slash-commands).

## Sessioni, Compaction ed eliminazione (cosa persiste)

Ciò che persiste tra i messaggi dipende dal meccanismo:

- La **cronologia normale** persiste nella trascrizione della sessione finché non viene sottoposta a Compaction o eliminata in base ai criteri.
- La **Compaction** mantiene un riepilogo nella trascrizione e conserva intatti i messaggi recenti.
- L'**eliminazione** rimuove i risultati meno recenti degli strumenti dal prompt _in memoria_ per liberare spazio nella finestra di contesto, ma non riscrive la trascrizione della sessione: la cronologia completa resta consultabile su disco.

Documentazione: [Sessione](/it/concepts/session), [Compaction](/it/concepts/compaction), [Eliminazione della sessione](/it/concepts/session-pruning).

Per impostazione predefinita, OpenClaw utilizza il motore di contesto `legacy` integrato per la composizione e la
Compaction. Se installi un Plugin che fornisce `kind: "context-engine"` e
lo selezioni con `plugins.slots.contextEngine`, OpenClaw delega a tale
motore la composizione del contesto, `/compact` e i relativi hook del ciclo di vita del contesto
dei sottoagenti. `ownsCompaction: false` non attiva automaticamente il motore
`legacy` come alternativa; il motore attivo deve comunque implementare correttamente `compact()`. Consulta
[Motore di contesto](/it/concepts/context-engine) per l'interfaccia
collegabile completa, gli hook del ciclo di vita e la configurazione.

## Cosa segnala effettivamente `/context`

Quando disponibile, `/context` utilizza preferibilmente il rapporto più recente del prompt di sistema **creato durante l'esecuzione**:

- `System prompt (run)` = acquisito dall'ultima esecuzione incorporata (con supporto degli strumenti) e conservato nell'archivio della sessione.
- `System prompt (estimate)` = calcolato al momento quando non esiste alcun rapporto di esecuzione (o durante l'esecuzione tramite un backend CLI che non genera il rapporto).

In entrambi i casi segnala le dimensioni e i principali contributori; **non** mostra il prompt di sistema completo né gli schemi degli strumenti. In modalità dettagliata confronta inoltre la trascrizione della sessione con lo stesso criterio per i messaggi di conversazione effettivi utilizzato dalla Compaction, così è più facile distinguere un utilizzo elevato del prompt/della cache dalla cronologia della conversazione che può essere sottoposta a Compaction.

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Context engine" href="/it/concepts/context-engine" icon="puzzle-piece">
    Inserimento personalizzato del contesto tramite Plugin.
  </Card>
  <Card title="Compaction" href="/it/concepts/compaction" icon="compress">
    Riepilogo delle conversazioni lunghe per mantenerle entro la finestra del modello.
  </Card>
  <Card title="System prompt" href="/it/concepts/system-prompt" icon="message-lines">
    Come viene creato il prompt di sistema e cosa inserisce a ogni turno.
  </Card>
  <Card title="Agent loop" href="/it/concepts/agent-loop" icon="arrows-rotate">
    Il ciclo completo di esecuzione dell'agente, dal messaggio in entrata alla risposta finale.
  </Card>
</CardGroup>
