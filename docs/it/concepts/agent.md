---
read_when:
    - Modifica del runtime dell'agente, del bootstrap dell'area di lavoro o del comportamento della sessione
summary: Runtime dell'agente, contratto dell'area di lavoro e inizializzazione della sessione
title: Ambiente di esecuzione dell'agente
x-i18n:
    generated_at: "2026-05-06T08:44:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 372cf6a02b35646c24e68d96938bba57721eeec512e17c2d40c8e721e7561bd1
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw esegue un **singolo runtime agente incorporato**: un processo agente per
Gateway, con la propria area di lavoro, i file di bootstrap e l'archivio delle sessioni. Questa pagina
descrive il contratto di quel runtime: cosa deve contenere l'area di lavoro, quali file vengono
iniettati e come le sessioni effettuano il bootstrap rispetto a essa.

## Area di lavoro (obbligatoria)

OpenClaw usa una singola directory dell'area di lavoro dell'agente (`agents.defaults.workspace`) come **unica** directory di lavoro (`cwd`) dell'agente per strumenti e contesto.

Consigliato: usa `openclaw setup` per creare `~/.openclaw/openclaw.json` se manca e inizializzare i file dell'area di lavoro.

Layout completo dell'area di lavoro + guida al backup: [Area di lavoro dell'agente](/it/concepts/agent-workspace)

Se `agents.defaults.sandbox` è abilitato, le sessioni non principali possono sovrascriverla con
aree di lavoro per sessione sotto `agents.defaults.sandbox.workspaceRoot` (vedi
[configurazione del Gateway](/it/gateway/configuration)).

## File di bootstrap (iniettati)

Dentro `agents.defaults.workspace`, OpenClaw si aspetta questi file modificabili dall'utente:

- `AGENTS.md` - istruzioni operative + "memoria"
- `SOUL.md` - persona, limiti, tono
- `TOOLS.md` - note sugli strumenti mantenute dall'utente (ad es. `imsg`, `sag`, convenzioni)
- `BOOTSTRAP.md` - rituale di prima esecuzione una tantum (eliminato dopo il completamento)
- `IDENTITY.md` - nome/vibe/emoji dell'agente
- `USER.md` - profilo utente + forma di indirizzo preferita

Al primo turno di una nuova sessione, OpenClaw inietta i contenuti di questi file nel Project Context del prompt di sistema.

I file vuoti vengono saltati. I file grandi vengono ridotti e troncati con un marcatore, così i prompt restano snelli (leggi il file per il contenuto completo).

Se manca un file, OpenClaw inietta una singola riga marcatore "file mancante" (e `openclaw setup` creerà un modello predefinito sicuro).

`BOOTSTRAP.md` viene creato solo per una **area di lavoro completamente nuova** (nessun altro file di bootstrap presente). Finché è in sospeso, OpenClaw lo mantiene nel Project Context e aggiunge al prompt di sistema indicazioni di bootstrap per il rituale iniziale invece di copiarlo nel messaggio utente. Se lo elimini dopo aver completato il rituale, non dovrebbe essere ricreato ai riavvii successivi.

Per disabilitare completamente la creazione dei file di bootstrap (per aree di lavoro precompilate), imposta:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Strumenti integrati

Gli strumenti core (read/exec/edit/write e strumenti di sistema correlati) sono sempre disponibili,
soggetti alla policy degli strumenti. `apply_patch` è opzionale e controllato da
`tools.exec.applyPatch`. `TOOLS.md` **non** controlla quali strumenti esistono; è
una guida su come _tu_ vuoi che vengano usati.

## Skills

OpenClaw carica le Skills da queste posizioni (precedenza più alta per prime):

- Area di lavoro: `<workspace>/skills`
- Skills agente del progetto: `<workspace>/.agents/skills`
- Skills agente personali: `~/.agents/skills`
- Gestite/locali: `~/.openclaw/skills`
- In bundle (incluse nell'installazione)
- Cartelle Skills aggiuntive: `skills.load.extraDirs`

Le Skills possono essere controllate tramite config/env (vedi `skills` in [configurazione del Gateway](/it/gateway/configuration)).

## Confini del runtime

Il runtime agente incorporato è costruito sul core agente Pi (modelli, strumenti e
pipeline dei prompt). Gestione delle sessioni, discovery, cablaggio degli strumenti e recapito sui canali
sono livelli di proprietà di OpenClaw sopra quel core.

## Sessioni

Le trascrizioni delle sessioni sono archiviate come JSONL in:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

L'ID sessione è stabile e scelto da OpenClaw.
Le cartelle sessione legacy di altri strumenti non vengono lette.

## Steering durante lo streaming

Quando la modalità coda è `steer`, i messaggi in ingresso vengono iniettati nell'esecuzione corrente.
Lo steering in coda viene consegnato **dopo che il turno assistant corrente termina
l'esecuzione delle sue chiamate agli strumenti**, prima della successiva chiamata LLM. Pi consuma insieme tutti i messaggi di
steering in sospeso per `steer`; il `queue` legacy consuma un messaggio per
confine del modello. Lo steering non salta più le chiamate agli strumenti rimanenti del messaggio
assistant corrente.

Quando la modalità coda è `followup` o `collect`, i messaggi in ingresso vengono trattenuti finché il
turno corrente termina, poi inizia un nuovo turno agente con i payload in coda. Vedi
[Coda](/it/concepts/queue) e [coda di steering](/it/concepts/queue-steering) per il comportamento di modalità
e confini.

Lo streaming a blocchi invia i blocchi assistant completati non appena terminano; è
**disattivato per impostazione predefinita** (`agents.defaults.blockStreamingDefault: "off"`).
Regola il confine tramite `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; valore predefinito text_end).
Controlla la suddivisione morbida dei blocchi con `agents.defaults.blockStreamingChunk` (predefinito
800-1200 caratteri; preferisce le interruzioni di paragrafo, poi le nuove righe; le frasi per ultime).
Aggrega i chunk in streaming con `agents.defaults.blockStreamingCoalesce` per ridurre
lo spam su singola riga (fusione basata su inattività prima dell'invio). I canali non Telegram richiedono
`*.blockStreaming: true` esplicito per abilitare le risposte a blocchi.
I riepiloghi dettagliati degli strumenti vengono emessi all'avvio dello strumento (nessun debounce); la Control UI
trasmette l'output degli strumenti tramite eventi agente quando disponibile.
Altri dettagli: [Streaming + chunking](/it/concepts/streaming).

## Riferimenti modello

I riferimenti modello nella configurazione (ad esempio `agents.defaults.model` e `agents.defaults.models`) vengono analizzati separando sulla **prima** `/`.

- Usa `provider/model` quando configuri i modelli.
- Se l'ID del modello stesso contiene `/` (stile OpenRouter), includi il prefisso del provider (esempio: `openrouter/moonshotai/kimi-k2`).
- Se ometti il provider, OpenClaw prova prima un alias, poi una corrispondenza univoca
  del provider configurato per quell'ID modello esatto, e solo dopo ripiega
  sul provider predefinito configurato. Se quel provider non espone più il
  modello predefinito configurato, OpenClaw ripiega sul primo
  provider/modello configurato invece di mostrare un valore predefinito stantio di un provider rimosso.

## Configurazione (minima)

Come minimo, imposta:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (fortemente consigliato)

---

_Successivo: [Chat di gruppo](/it/channels/group-messages)_ 🦞

## Correlati

- [Area di lavoro dell'agente](/it/concepts/agent-workspace)
- [Instradamento multi-agente](/it/concepts/multi-agent)
- [Gestione delle sessioni](/it/concepts/session)
