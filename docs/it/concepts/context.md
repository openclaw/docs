---
read_when:
    - Vuoi capire cosa significa "context" in OpenClaw
    - Stai eseguendo il debug del motivo per cui il modello "sa" qualcosa (o l'ha dimenticato)
    - Vuoi ridurre il sovraccarico del contesto (/context, /status, /compact)
summary: 'Contesto: cosa vede il modello, come viene costruito e come ispezionarlo'
title: Contesto
x-i18n:
    generated_at: "2026-06-27T17:24:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 900b4a72acf43405a6b7718b93c3b5c8543eb2cc90766298889052c7468e39fb
    source_path: concepts/context.md
    workflow: 16
---

Il "contesto" è **tutto ciò che OpenClaw invia al modello per una run**. È limitato dalla **finestra di contesto** del modello (limite di token).

Modello mentale per principianti:

- **Prompt di sistema** (creato da OpenClaw): regole, strumenti, elenco di Skills, ora/runtime e file dell'area di lavoro iniettati.
- **Cronologia della conversazione**: i tuoi messaggi + i messaggi dell'assistente per questa sessione.
- **Chiamate/risultati degli strumenti + allegati**: output dei comandi, letture di file, immagini/audio, ecc.

Il contesto _non è la stessa cosa_ della "memoria": la memoria può essere archiviata su disco e ricaricata in seguito; il contesto è ciò che si trova nella finestra corrente del modello.

## Avvio rapido (ispezionare il contesto)

- `/status` → vista rapida "quanto è piena la mia finestra?" + impostazioni della sessione.
- `/context list` → cosa viene iniettato + dimensioni approssimative (per file + totali).
- `/context detail` → analisi più approfondita: dimensioni per file, per schema degli strumenti, per voce Skill, dimensione del prompt di sistema e conteggi dei messaggi della trascrizione compattabili.
- `/context map` → immagine treemap in stile WinDirStat dei contributori al contesto tracciati per la sessione corrente.
- `/usage tokens` → aggiunge un piè di pagina con l'utilizzo per risposta alle risposte normali.
- `/compact` → riassume la cronologia più vecchia in una voce compatta per liberare spazio nella finestra.

Vedi anche: [Comandi slash](/it/tools/slash-commands), [Uso dei token e costi](/it/reference/token-use), [Compaction](/it/concepts/compaction).

## Output di esempio

I valori variano in base a modello, provider, policy degli strumenti e contenuto dell'area di lavoro.

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

### `/context map`

Invia un'immagine generata dall'ultimo report di run memorizzato nella cache. Prima che un messaggio normale abbia prodotto un report di run nella sessione, `/context map` restituisce un messaggio di non disponibilità invece di renderizzare una stima. L'area dei rettangoli è proporzionale ai caratteri del prompt tracciati:

- file dell'area di lavoro iniettati
- testo del prompt di sistema di base
- voci del prompt delle Skill
- schemi JSON degli strumenti

`/context list`, `/context detail` e `/context json` possono comunque ispezionare una stima on-demand quando nessun report di run è memorizzato nella cache.

## Cosa conta per la finestra di contesto

Conta tutto ciò che il modello riceve, incluso:

- Prompt di sistema (tutte le sezioni).
- Cronologia della conversazione.
- Chiamate degli strumenti + risultati degli strumenti.
- Allegati/trascrizioni (immagini/audio/file).
- Riepiloghi di Compaction e artefatti di pruning.
- "Wrapper" del provider o intestazioni nascoste (non visibili, ma comunque conteggiati).

## Come OpenClaw costruisce il prompt di sistema

Il prompt di sistema è **di proprietà di OpenClaw** e viene ricostruito a ogni run. Include:

- Elenco degli strumenti + brevi descrizioni.
- Elenco delle Skills (solo metadati; vedi sotto).
- Posizione dell'area di lavoro.
- Ora (UTC + ora utente convertita se configurata).
- Metadati di runtime (host/OS/modello/thinking).
- File bootstrap dell'area di lavoro iniettati sotto **Project Context**.

Analisi completa: [Prompt di sistema](/it/concepts/system-prompt).

## File dell'area di lavoro iniettati (Project Context)

Per impostazione predefinita, OpenClaw inietta un set fisso di file dell'area di lavoro (se presenti):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo prima run)

I file di grandi dimensioni vengono troncati per file usando `agents.defaults.bootstrapMaxChars` (predefinito `20000` caratteri). OpenClaw applica anche un limite totale di iniezione bootstrap tra i file con `agents.defaults.bootstrapTotalMaxChars` (predefinito `60000` caratteri). `/context` mostra le dimensioni **grezze rispetto a iniettate** e se si è verificato un troncamento.

Quando si verifica un troncamento, il runtime può iniettare un blocco di avviso nel prompt sotto Project Context. Configuralo con `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; predefinito `always`).

## Skills: iniettate rispetto a caricate on-demand

Il prompt di sistema include un **elenco delle Skills** compatto (nome + descrizione + posizione). Questo elenco ha un overhead reale.

Le istruzioni delle Skill _non_ sono incluse per impostazione predefinita. Il modello deve eseguire `read` del `SKILL.md` della Skill **solo quando necessario**.

## Strumenti: ci sono due costi

Gli strumenti influenzano il contesto in due modi:

1. **Testo dell'elenco degli strumenti** nel prompt di sistema (ciò che vedi come "Tooling").
2. **Schemi degli strumenti** (JSON). Questi vengono inviati al modello affinché possa chiamare gli strumenti. Contano per il contesto anche se non li vedi come testo semplice.

`/context detail` analizza gli schemi degli strumenti più grandi, così puoi vedere cosa domina.

## Comandi, direttive e "scorciatoie inline"

I comandi slash sono gestiti dal Gateway. Esistono alcuni comportamenti diversi:

- **Comandi autonomi**: un messaggio che è solo `/...` viene eseguito come comando.
- **Direttive**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` vengono rimosse prima che il modello veda il messaggio.
  - I messaggi con sole direttive persistono le impostazioni della sessione.
  - Le direttive inline in un messaggio normale agiscono come suggerimenti per singolo messaggio.
- **Scorciatoie inline** (solo mittenti nell'allowlist): certi token `/...` dentro un messaggio normale possono essere eseguiti immediatamente (esempio: "hey /status") e vengono rimossi prima che il modello veda il testo rimanente.

Dettagli: [Comandi slash](/it/tools/slash-commands).

## Sessioni, Compaction e pruning (cosa persiste)

Ciò che persiste tra i messaggi dipende dal meccanismo:

- **Cronologia normale** persiste nella trascrizione della sessione finché non viene compattata/potata dalla policy.
- **Compaction** persiste un riepilogo nella trascrizione e mantiene intatti i messaggi recenti.
- **Pruning** elimina i vecchi risultati degli strumenti dal prompt _in memoria_ per liberare spazio nella finestra di contesto, ma non riscrive la trascrizione della sessione: la cronologia completa resta comunque ispezionabile su disco.

Documentazione: [Sessione](/it/concepts/session), [Compaction](/it/concepts/compaction), [Pruning della sessione](/it/concepts/session-pruning).

Per impostazione predefinita, OpenClaw usa il motore di contesto integrato `legacy` per l'assemblaggio e la
Compaction. Se installi un plugin che fornisce `kind: "context-engine"` e
lo selezioni con `plugins.slots.contextEngine`, OpenClaw delega a quel
motore l'assemblaggio del contesto, `/compact` e i relativi hook del ciclo di vita del contesto dei subagent.
`ownsCompaction: false` non esegue il fallback automatico al motore
legacy; il motore attivo deve comunque implementare correttamente `compact()`. Vedi
[Motore di contesto](/it/concepts/context-engine) per l'interfaccia
pluggable completa, gli hook del ciclo di vita e la configurazione.

## Cosa segnala effettivamente `/context`

`/context` preferisce l'ultimo report del prompt di sistema **costruito dalla run** quando disponibile:

- `System prompt (run)` = acquisito dall'ultima run incorporata (capace di usare strumenti) e persistito nello store della sessione.
- `System prompt (estimate)` = calcolato al volo quando non esiste alcun report di run (o quando viene eseguito tramite un backend CLI che non genera il report).

In entrambi i casi, segnala dimensioni e principali contributori; **non** scarica l'intero prompt di sistema o gli schemi degli strumenti. In modalità dettagliata, confronta anche la trascrizione della sessione con lo stesso predicato dei messaggi di conversazione reale usato dalla Compaction, quindi è più facile distinguere un utilizzo elevato del prompt/cache dalla cronologia di conversazione compattabile.

## Correlati

<CardGroup cols={2}>
  <Card title="Context engine" href="/it/concepts/context-engine" icon="puzzle-piece">
    Iniezione di contesto personalizzata tramite plugin.
  </Card>
  <Card title="Compaction" href="/it/concepts/compaction" icon="compress">
    Riassumere conversazioni lunghe per mantenerle dentro la finestra del modello.
  </Card>
  <Card title="System prompt" href="/it/concepts/system-prompt" icon="message-lines">
    Come viene costruito il prompt di sistema e cosa inietta a ogni turno.
  </Card>
  <Card title="Agent loop" href="/it/concepts/agent-loop" icon="arrows-rotate">
    Il ciclo completo di esecuzione dell'agent dal messaggio in ingresso alla risposta finale.
  </Card>
</CardGroup>
