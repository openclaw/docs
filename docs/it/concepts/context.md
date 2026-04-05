---
read_when:
    - Vuoi capire cosa significa “contesto” in OpenClaw
    - Stai eseguendo il debug del motivo per cui il modello “sa” qualcosa (o l'ha dimenticata)
    - Vuoi ridurre il sovraccarico del contesto (/context, /status, /compact)
summary: 'Contesto: cosa vede il modello, come viene costruito e come ispezionarlo'
title: Contesto
x-i18n:
    generated_at: "2026-04-05T13:49:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: a75b4cd65bf6385d46265b9ce1643310bc99d220e35ec4b4924096bed3ca4aa0
    source_path: concepts/context.md
    workflow: 15
---

# Contesto

Il “contesto” è **tutto ciò che OpenClaw invia al modello per un'esecuzione**. È limitato dalla **finestra di contesto** del modello (limite di token).

Modello mentale per principianti:

- **Prompt di sistema** (costruito da OpenClaw): regole, strumenti, elenco delle Skills, ora/runtime e file dello spazio di lavoro iniettati.
- **Cronologia della conversazione**: i tuoi messaggi + i messaggi dell'assistente per questa sessione.
- **Chiamate/risultati degli strumenti + allegati**: output dei comandi, letture di file, immagini/audio, ecc.

Il contesto _non è la stessa cosa_ della “memoria”: la memoria può essere archiviata su disco e ricaricata in seguito; il contesto è ciò che si trova nella finestra corrente del modello.

## Avvio rapido (ispezionare il contesto)

- `/status` → vista rapida di “quanto è piena la mia finestra?” + impostazioni della sessione.
- `/context list` → cosa viene iniettato + dimensioni approssimative (per file + totali).
- `/context detail` → ripartizione più approfondita: dimensioni per file, per schema strumento, per voce Skill e dimensione del prompt di sistema.
- `/usage tokens` → aggiunge un footer sull'uso per risposta alle risposte normali.
- `/compact` → riassume la cronologia meno recente in una voce compatta per liberare spazio nella finestra.

Vedi anche: [Comandi slash](/tools/slash-commands), [Uso dei token e costi](/reference/token-use), [Compattazione](/concepts/compaction).

## Output di esempio

I valori variano in base al modello, al provider, alla policy degli strumenti e a ciò che è presente nel tuo spazio di lavoro.

### `/context list`

```
🧠 Ripartizione del contesto
Workspace: <workspaceDir>
Massimo bootstrap/file: 20,000 caratteri
Sandbox: mode=non-main sandboxed=false
Prompt di sistema (esecuzione): 38,412 caratteri (~9,603 token) (Project Context 23,901 caratteri (~5,976 token))

File dello spazio di lavoro iniettati:
- AGENTS.md: OK | grezzo 1,742 caratteri (~436 token) | iniettato 1,742 caratteri (~436 token)
- SOUL.md: OK | grezzo 912 caratteri (~228 token) | iniettato 912 caratteri (~228 token)
- TOOLS.md: TRONCATO | grezzo 54,210 caratteri (~13,553 token) | iniettato 20,962 caratteri (~5,241 token)
- IDENTITY.md: OK | grezzo 211 caratteri (~53 token) | iniettato 211 caratteri (~53 token)
- USER.md: OK | grezzo 388 caratteri (~97 token) | iniettato 388 caratteri (~97 token)
- HEARTBEAT.md: MANCANTE | grezzo 0 | iniettato 0
- BOOTSTRAP.md: OK | grezzo 0 caratteri (~0 token) | iniettato 0 caratteri (~0 token)

Elenco Skills (testo del prompt di sistema): 2,184 caratteri (~546 token) (12 skills)
Strumenti: read, edit, write, exec, process, browser, message, sessions_send, …
Elenco strumenti (testo del prompt di sistema): 1,032 caratteri (~258 token)
Schemi strumenti (JSON): 31,988 caratteri (~7,997 token) (contano nel contesto; non mostrati come testo)
Strumenti: (come sopra)

Token della sessione (in cache): 14,250 totali / ctx=32,000
```

### `/context detail`

```
🧠 Ripartizione del contesto (dettagliata)
…
Skills principali (dimensione della voce nel prompt):
- frontend-design: 412 caratteri (~103 token)
- oracle: 401 caratteri (~101 token)
… (+10 altre skills)

Strumenti principali (dimensione dello schema):
- browser: 9,812 caratteri (~2,453 token)
- exec: 6,240 caratteri (~1,560 token)
… (+N altri strumenti)
```

## Cosa conta nella finestra di contesto

Conta tutto ciò che il modello riceve, inclusi:

- Prompt di sistema (tutte le sezioni).
- Cronologia della conversazione.
- Chiamate agli strumenti + risultati degli strumenti.
- Allegati/trascrizioni (immagini/audio/file).
- Riepiloghi di compattazione e artefatti di pruning.
- “Wrapper” del provider o intestazioni nascoste (non visibili, ma comunque conteggiate).

## Come OpenClaw costruisce il prompt di sistema

Il prompt di sistema è **di proprietà di OpenClaw** e viene ricostruito a ogni esecuzione. Include:

- Elenco degli strumenti + brevi descrizioni.
- Elenco delle Skills (solo metadati; vedi sotto).
- Posizione dello spazio di lavoro.
- Ora (UTC + ora utente convertita, se configurata).
- Metadati del runtime (host/OS/modello/thinking).
- File bootstrap dello spazio di lavoro iniettati sotto **Project Context**.

Ripartizione completa: [Prompt di sistema](/concepts/system-prompt).

## File dello spazio di lavoro iniettati (Project Context)

Per impostazione predefinita, OpenClaw inietta un insieme fisso di file dello spazio di lavoro (se presenti):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo alla prima esecuzione)

I file grandi vengono troncati per file usando `agents.defaults.bootstrapMaxChars` (predefinito `20000` caratteri). OpenClaw applica anche un limite massimo totale di iniezione bootstrap tra i file con `agents.defaults.bootstrapTotalMaxChars` (predefinito `150000` caratteri). `/context` mostra le dimensioni **grezze vs iniettate** e indica se è avvenuto il troncamento.

Quando si verifica il troncamento, il runtime può iniettare nel prompt un blocco di avviso sotto Project Context. Configuralo con `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; predefinito `once`).

## Skills: iniettate vs caricate su richiesta

Il prompt di sistema include un **elenco Skills** compatto (nome + descrizione + posizione). Questo elenco ha un sovraccarico reale.

Le istruzioni delle Skills _non_ sono incluse per impostazione predefinita. Il modello dovrebbe leggere `SKILL.md` della Skill con `read` **solo quando necessario**.

## Strumenti: ci sono due costi

Gli strumenti influiscono sul contesto in due modi:

1. **Testo dell'elenco strumenti** nel prompt di sistema (quello che vedi come “Tooling”).
2. **Schemi degli strumenti** (JSON). Questi vengono inviati al modello affinché possa chiamare gli strumenti. Contano nel contesto anche se non li vedi come testo normale.

`/context detail` suddivide gli schemi degli strumenti più grandi, così puoi vedere cosa domina.

## Comandi, direttive e "scorciatoie inline"

I comandi slash vengono gestiti dal Gateway. Ci sono alcuni comportamenti diversi:

- **Comandi standalone**: un messaggio che contiene solo `/...` viene eseguito come comando.
- **Direttive**: `/think`, `/verbose`, `/reasoning`, `/elevated`, `/model`, `/queue` vengono rimosse prima che il modello veda il messaggio.
  - I messaggi composti solo da direttive mantengono le impostazioni della sessione.
  - Le direttive inline in un messaggio normale agiscono come suggerimenti per quel messaggio.
- **Scorciatoie inline** (solo mittenti nella allowlist): alcuni token `/...` all'interno di un messaggio normale possono essere eseguiti immediatamente (esempio: “hey /status”) e vengono rimossi prima che il modello veda il testo rimanente.

Dettagli: [Comandi slash](/tools/slash-commands).

## Sessioni, compattazione e pruning (cosa persiste)

Ciò che persiste tra i messaggi dipende dal meccanismo:

- **Cronologia normale** persiste nella trascrizione della sessione finché non viene compattata/potata dalla policy.
- **Compattazione** mantiene un riepilogo nella trascrizione e conserva intatti i messaggi recenti.
- **Pruning** rimuove i vecchi risultati degli strumenti dal prompt _in memoria_ per un'esecuzione, ma non riscrive la trascrizione.

Documentazione: [Sessione](/concepts/session), [Compattazione](/concepts/compaction), [Pruning della sessione](/concepts/session-pruning).

Per impostazione predefinita, OpenClaw usa il motore di contesto integrato `legacy` per l'assemblaggio e
la compattazione. Se installi un plugin che fornisce `kind: "context-engine"` e
lo selezioni con `plugins.slots.contextEngine`, OpenClaw delega l'assemblaggio del contesto,
`/compact` e i relativi hook del ciclo di vita del contesto dei subagent a quel
motore. `ownsCompaction: false` non fa automaticamente fallback al motore
legacy; il motore attivo deve comunque implementare correttamente `compact()`. Vedi
[Motore di contesto](/concepts/context-engine) per l'interfaccia plug-in completa,
gli hook del ciclo di vita e la configurazione.

## Cosa riporta effettivamente `/context`

`/context` preferisce l'ultimo report del prompt di sistema **costruito in esecuzione** quando disponibile:

- `System prompt (run)` = acquisito dall'ultima esecuzione incorporata (capace di usare strumenti) e mantenuto nell'archivio della sessione.
- `System prompt (estimate)` = calcolato al volo quando non esiste alcun report di esecuzione (o quando si esegue tramite un backend CLI che non genera il report).

In entrambi i casi, riporta dimensioni e principali contributori; **non** scarica il prompt di sistema completo né gli schemi degli strumenti.

## Correlati

- [Motore di contesto](/concepts/context-engine) — iniezione di contesto personalizzata tramite plugin
- [Compattazione](/concepts/compaction) — riepilogo delle conversazioni lunghe
- [Prompt di sistema](/concepts/system-prompt) — come viene costruito il prompt di sistema
- [Loop dell'agente](/concepts/agent-loop) — il ciclo completo di esecuzione dell'agente
