---
read_when:
    - Modifica del runtime dell'agente, del bootstrap dell'area di lavoro o del comportamento della sessione
summary: Ambiente di esecuzione dell’agente, contratto dello spazio di lavoro e inizializzazione della sessione
title: Runtime dell'agente
x-i18n:
    generated_at: "2026-05-04T02:22:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89bbbd05a9bf2054d3a1f24aeed005a05b61152a047b593addfb46817baae05a
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw esegue un **singolo runtime agente integrato**: un processo agente per
Gateway, con il proprio spazio di lavoro, file di bootstrap e archivio delle sessioni. Questa pagina
descrive quel contratto di runtime: cosa deve contenere lo spazio di lavoro, quali file vengono
iniettati e come le sessioni si inizializzano rispetto a esso.

## Spazio di lavoro (obbligatorio)

OpenClaw usa una singola directory dello spazio di lavoro dell’agente (`agents.defaults.workspace`) come **unica** directory di lavoro (`cwd`) dell’agente per strumenti e contesto.

Consigliato: usa `openclaw setup` per creare `~/.openclaw/openclaw.json` se manca e inizializzare i file dello spazio di lavoro.

Layout completo dello spazio di lavoro + guida al backup: [Spazio di lavoro dell’agente](/it/concepts/agent-workspace)

Se `agents.defaults.sandbox` è abilitato, le sessioni non principali possono sovrascriverlo con
spazi di lavoro per sessione sotto `agents.defaults.sandbox.workspaceRoot` (vedi
[Configurazione del Gateway](/it/gateway/configuration)).

## File di bootstrap (iniettati)

Dentro `agents.defaults.workspace`, OpenClaw si aspetta questi file modificabili dall’utente:

- `AGENTS.md`: istruzioni operative + “memoria”
- `SOUL.md`: persona, confini, tono
- `TOOLS.md`: note sugli strumenti mantenute dall’utente (ad es. `imsg`, `sag`, convenzioni)
- `BOOTSTRAP.md`: rituale una tantum al primo avvio (eliminato dopo il completamento)
- `IDENTITY.md`: nome/vibe/emoji dell’agente
- `USER.md`: profilo utente + forma di indirizzo preferita

Al primo turno di una nuova sessione, OpenClaw inietta i contenuti di questi file nel Contesto del progetto del prompt di sistema.

I file vuoti vengono saltati. I file grandi vengono accorciati e troncati con un indicatore, così i prompt restano snelli (leggi il file per il contenuto completo).

Se manca un file, OpenClaw inietta una singola riga indicatore di “file mancante” (e `openclaw setup` creerà un modello predefinito sicuro).

`BOOTSTRAP.md` viene creato solo per uno **spazio di lavoro completamente nuovo** (nessun altro file di bootstrap presente). Finché è in sospeso, OpenClaw lo mantiene nel Contesto del progetto e aggiunge al prompt di sistema indicazioni di bootstrap per il rituale iniziale invece di copiarlo nel messaggio utente. Se lo elimini dopo aver completato il rituale, non dovrebbe essere ricreato ai riavvii successivi.

Per disabilitare completamente la creazione dei file di bootstrap (per spazi di lavoro già popolati), imposta:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Strumenti integrati

Gli strumenti core (lettura/esecuzione/modifica/scrittura e strumenti di sistema correlati) sono sempre disponibili,
soggetti alla policy degli strumenti. `apply_patch` è opzionale ed è regolato da
`tools.exec.applyPatch`. `TOOLS.md` **non** controlla quali strumenti esistono; è
una guida su come _tu_ vuoi che vengano usati.

## Skills

OpenClaw carica le Skills da queste posizioni (prima la precedenza più alta):

- Spazio di lavoro: `<workspace>/skills`
- Skills dell’agente del progetto: `<workspace>/.agents/skills`
- Skills personali dell’agente: `~/.agents/skills`
- Gestite/locali: `~/.openclaw/skills`
- In bundle (incluse con l’installazione)
- Cartelle Skills extra: `skills.load.extraDirs`

Le Skills possono essere controllate tramite configurazione/env (vedi `skills` in [Configurazione del Gateway](/it/gateway/configuration)).

## Confini del runtime

Il runtime agente integrato è costruito sul core dell’agente Pi (modelli, strumenti e
pipeline dei prompt). Gestione delle sessioni, discovery, cablaggio degli strumenti e consegna ai canali
sono livelli di proprietà di OpenClaw sopra quel core.

## Sessioni

Le trascrizioni delle sessioni sono archiviate come JSONL in:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

L’ID sessione è stabile e scelto da OpenClaw.
Le cartelle di sessione legacy di altri strumenti non vengono lette.

## Steering durante lo streaming

Quando la modalità coda è `steer`, i messaggi in ingresso vengono iniettati nell’esecuzione corrente.
Lo steering accodato viene consegnato **dopo che il turno corrente dell’assistente finisce
di eseguire le sue chiamate agli strumenti**, prima della chiamata LLM successiva. Pi svuota insieme tutti i messaggi di
steering in sospeso per `steer`; la modalità legacy `queue` svuota un messaggio per
confine del modello. Lo steering non salta più le chiamate agli strumenti rimanenti dal messaggio corrente
dell’assistente.

Quando la modalità coda è `followup` o `collect`, i messaggi in ingresso vengono trattenuti finché il
turno corrente termina, poi inizia un nuovo turno agente con i payload accodati. Vedi
[Coda](/it/concepts/queue) e [Coda di steering](/it/concepts/queue-steering) per il comportamento di modalità
e confini.

Lo streaming a blocchi invia i blocchi assistente completati appena terminano; è
**disattivato per impostazione predefinita** (`agents.defaults.blockStreamingDefault: "off"`).
Regola il confine tramite `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; valore predefinito: text_end).
Controlla il chunking morbido dei blocchi con `agents.defaults.blockStreamingChunk` (valore predefinito:
800–1200 caratteri; preferisce le interruzioni di paragrafo, poi le nuove righe; le frasi per ultime).
Accorpa i chunk in streaming con `agents.defaults.blockStreamingCoalesce` per ridurre
lo spam su riga singola (unione basata sull’inattività prima dell’invio). I canali non Telegram richiedono
`*.blockStreaming: true` esplicito per abilitare le risposte a blocchi.
I riepiloghi dettagliati degli strumenti vengono emessi all’avvio dello strumento (senza debounce); la Control UI
trasmette l’output degli strumenti tramite eventi agente quando disponibile.
Maggiori dettagli: [Streaming + chunking](/it/concepts/streaming).

## Riferimenti ai modelli

I riferimenti ai modelli nella configurazione (per esempio `agents.defaults.model` e `agents.defaults.models`) vengono analizzati dividendo sulla **prima** `/`.

- Usa `provider/model` quando configuri i modelli.
- Se l’ID modello contiene esso stesso `/` (stile OpenRouter), includi il prefisso del provider (esempio: `openrouter/moonshotai/kimi-k2`).
- Se ometti il provider, OpenClaw prova prima un alias, poi una corrispondenza unica
  tra provider configurati per quello specifico ID modello, e solo dopo ripiega
  sul provider predefinito configurato. Se quel provider non espone più il
  modello predefinito configurato, OpenClaw ripiega sul primo
  provider/modello configurato invece di mostrare un valore predefinito obsoleto di un provider rimosso.

## Configurazione (minima)

Come minimo, imposta:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (fortemente consigliato)

---

_Successivo: [Chat di gruppo](/it/channels/group-messages)_ 🦞

## Correlati

- [Spazio di lavoro dell’agente](/it/concepts/agent-workspace)
- [Instradamento multi-agente](/it/concepts/multi-agent)
- [Gestione delle sessioni](/it/concepts/session)
