---
read_when:
    - Vuoi capire cosa significa "contesto" in OpenClaw
    - Stai eseguendo il debug del motivo per cui il modello "sa" qualcosa (o l'ha dimenticata)
    - Vuoi ridurre il sovraccarico di contesto (/context, /status, /compact)
summary: 'Contesto: cosa vede il modello, come viene costruito e come ispezionarlo'
title: Contesto
x-i18n:
    generated_at: "2026-05-06T08:45:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bd23094ef23928ee277c1b84ee17b9324aaea963d72a0c4c73da359409a5de9
    source_path: concepts/context.md
    workflow: 16
---

"Context" è **tutto ciò che OpenClaw invia al modello per un'esecuzione**. È limitato dalla **finestra di contesto** del modello (limite di token).

Modello mentale per principianti:

- **Prompt di sistema** (creato da OpenClaw): regole, strumenti, elenco Skills, ora/runtime e file dell'area di lavoro inseriti.
- **Cronologia della conversazione**: i tuoi messaggi + i messaggi dell'assistente per questa sessione.
- **Chiamate/risultati degli strumenti + allegati**: output dei comandi, letture di file, immagini/audio, ecc.

Il contesto _non è la stessa cosa_ della "memoria": la memoria può essere archiviata su disco e ricaricata in seguito; il contesto è ciò che si trova nella finestra corrente del modello.

## Avvio rapido (ispezionare il contesto)

- `/status` → vista rapida "quanto è piena la mia finestra?" + impostazioni della sessione.
- `/context list` → cosa è inserito + dimensioni approssimative (per file + totali).
- `/context detail` → analisi più approfondita: dimensioni per file, per schema strumento, per voce Skill e dimensione del prompt di sistema.
- `/usage tokens` → aggiungi alle risposte normali un piè di pagina con l'uso per risposta.
- `/compact` → riassumi la cronologia meno recente in una voce compatta per liberare spazio nella finestra.

Vedi anche: [Comandi slash](/it/tools/slash-commands), [Uso dei token e costi](/it/reference/token-use), [Compaction](/it/concepts/compaction).

## Output di esempio

I valori variano in base a modello, provider, policy degli strumenti e contenuti dell'area di lavoro.

### `/context list`

```
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

```
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

## Cosa conta nella finestra di contesto

Conta tutto ciò che il modello riceve, inclusi:

- Prompt di sistema (tutte le sezioni).
- Cronologia della conversazione.
- Chiamate agli strumenti + risultati degli strumenti.
- Allegati/trascrizioni (immagini/audio/file).
- Riassunti di Compaction e artefatti di pruning.
- "Wrapper" del provider o intestazioni nascoste (non visibili, ma comunque conteggiati).

## Come OpenClaw costruisce il prompt di sistema

Il prompt di sistema è **di proprietà di OpenClaw** e viene ricostruito a ogni esecuzione. Include:

- Elenco degli strumenti + brevi descrizioni.
- Elenco Skills (solo metadati; vedi sotto).
- Posizione dell'area di lavoro.
- Ora (UTC + ora utente convertita se configurata).
- Metadati di runtime (host/OS/modello/thinking).
- File bootstrap dell'area di lavoro inseriti in **Contesto del progetto**.

Analisi completa: [Prompt di sistema](/it/concepts/system-prompt).

## File dell'area di lavoro inseriti (Contesto del progetto)

Per impostazione predefinita, OpenClaw inserisce un insieme fisso di file dell'area di lavoro (se presenti):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo al primo avvio)

I file di grandi dimensioni vengono troncati per file usando `agents.defaults.bootstrapMaxChars` (predefinito `12000` caratteri). OpenClaw impone anche un limite totale all'inserimento bootstrap tra i file con `agents.defaults.bootstrapTotalMaxChars` (predefinito `60000` caratteri). `/context` mostra le dimensioni **grezze rispetto a quelle inserite** e se è avvenuto un troncamento.

Quando avviene un troncamento, il runtime può inserire un blocco di avviso nel prompt sotto Contesto del progetto. Configuralo con `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; predefinito `once`).

## Skills: inserite rispetto a caricate su richiesta

Il prompt di sistema include un **elenco Skills** compatto (nome + descrizione + posizione). Questo elenco ha un costo reale.

Le istruzioni delle Skill _non_ sono incluse per impostazione predefinita. Ci si aspetta che il modello esegua `read` del file `SKILL.md` della Skill **solo quando necessario**.

## Strumenti: ci sono due costi

Gli strumenti influiscono sul contesto in due modi:

1. **Testo dell'elenco strumenti** nel prompt di sistema (ciò che vedi come "Tooling").
2. **Schemi degli strumenti** (JSON). Questi vengono inviati al modello affinché possa chiamare gli strumenti. Contano nel contesto anche se non li vedi come testo semplice.

`/context detail` suddivide gli schemi degli strumenti più grandi così puoi vedere cosa pesa di più.

## Comandi, direttive e "scorciatoie inline"

I comandi slash sono gestiti dal Gateway. Esistono alcuni comportamenti diversi:

- **Comandi autonomi**: un messaggio che contiene solo `/...` viene eseguito come comando.
- **Direttive**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` vengono rimosse prima che il modello veda il messaggio.
  - I messaggi composti solo da direttive mantengono le impostazioni della sessione.
  - Le direttive inline in un messaggio normale agiscono come suggerimenti per quel messaggio.
- **Scorciatoie inline** (solo mittenti consentiti): alcuni token `/...` all'interno di un messaggio normale possono essere eseguiti immediatamente (esempio: "hey /status") e vengono rimossi prima che il modello veda il testo rimanente.

Dettagli: [Comandi slash](/it/tools/slash-commands).

## Sessioni, Compaction e pruning (cosa persiste)

Ciò che persiste tra i messaggi dipende dal meccanismo:

- **Cronologia normale** persiste nella trascrizione della sessione finché non viene compattata/potata dalla policy.
- **Compaction** mantiene un riassunto nella trascrizione e conserva intatti i messaggi recenti.
- **Pruning** elimina i vecchi risultati degli strumenti dal prompt _in memoria_ per liberare spazio nella finestra di contesto, ma non riscrive la trascrizione della sessione: la cronologia completa resta comunque ispezionabile su disco.

Documentazione: [Sessione](/it/concepts/session), [Compaction](/it/concepts/compaction), [Pruning della sessione](/it/concepts/session-pruning).

Per impostazione predefinita, OpenClaw usa il motore di contesto integrato `legacy` per assemblaggio e
Compaction. Se installi un plugin che fornisce `kind: "context-engine"` e
lo selezioni con `plugins.slots.contextEngine`, OpenClaw delega l'assemblaggio
del contesto, `/compact` e gli hook correlati del ciclo di vita del contesto dei subagent a quel
motore. `ownsCompaction: false` non esegue automaticamente il fallback al motore
legacy; il motore attivo deve comunque implementare correttamente `compact()`. Vedi
[Motore di contesto](/it/concepts/context-engine) per l'interfaccia completa
collegabile, gli hook del ciclo di vita e la configurazione.

## Cosa riporta effettivamente `/context`

`/context` preferisce l'ultimo report del prompt di sistema **creato dall'esecuzione** quando disponibile:

- `System prompt (run)` = acquisito dall'ultima esecuzione incorporata (con capacità di strumenti) e mantenuto nello store della sessione.
- `System prompt (estimate)` = calcolato al volo quando non esiste alcun report di esecuzione (o quando si usa un backend CLI che non genera il report).

In entrambi i casi, riporta dimensioni e principali contributori; **non** scarica il prompt di sistema completo né gli schemi degli strumenti.

## Correlati

<CardGroup cols={2}>
  <Card title="Motore di contesto" href="/it/concepts/context-engine" icon="puzzle-piece">
    Inserimento del contesto personalizzato tramite plugin.
  </Card>
  <Card title="Compaction" href="/it/concepts/compaction" icon="compress">
    Riassumere conversazioni lunghe per mantenerle all'interno della finestra del modello.
  </Card>
  <Card title="Prompt di sistema" href="/it/concepts/system-prompt" icon="message-lines">
    Come viene costruito il prompt di sistema e cosa inserisce a ogni turno.
  </Card>
  <Card title="Ciclo dell'agente" href="/it/concepts/agent-loop" icon="arrows-rotate">
    Il ciclo completo di esecuzione dell'agente, dal messaggio in ingresso alla risposta finale.
  </Card>
</CardGroup>
