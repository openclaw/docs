---
read_when:
    - Modifica del runtime dell'agente, del bootstrap dello spazio di lavoro o del comportamento della sessione
summary: Ambiente di esecuzione dell'agente, contratto dello spazio di lavoro e inizializzazione della sessione
title: Runtime dell'agente
x-i18n:
    generated_at: "2026-04-30T08:45:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4d65ee96cece296251d7d3a0512f12d2dfa900db0e5ffc0f37dcddae7ea55ad
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw esegue un **singolo runtime agente incorporato**: un processo agente per
Gateway, con il proprio spazio di lavoro, file di bootstrap e archivio delle sessioni. Questa pagina
descrive il contratto di runtime: cosa deve contenere lo spazio di lavoro, quali file vengono
iniettati e come le sessioni eseguono il bootstrap rispetto a esso.

## Spazio di lavoro (obbligatorio)

OpenClaw usa una singola directory dello spazio di lavoro dell'agente (`agents.defaults.workspace`) come **unica** directory di lavoro (`cwd`) dell'agente per strumenti e contesto.

Consigliato: usa `openclaw setup` per creare `~/.openclaw/openclaw.json` se manca e inizializzare i file dello spazio di lavoro.

Layout completo dello spazio di lavoro + guida al backup: [Spazio di lavoro dell'agente](/it/concepts/agent-workspace)

Se `agents.defaults.sandbox` è abilitato, le sessioni non principali possono sovrascriverlo con
spazi di lavoro per sessione sotto `agents.defaults.sandbox.workspaceRoot` (vedi
[Configurazione del Gateway](/it/gateway/configuration)).

## File di bootstrap (iniettati)

Dentro `agents.defaults.workspace`, OpenClaw si aspetta questi file modificabili dall'utente:

- `AGENTS.md` — istruzioni operative + “memoria”
- `SOUL.md` — persona, limiti, tono
- `TOOLS.md` — note sugli strumenti mantenute dall'utente (ad es. `imsg`, `sag`, convenzioni)
- `BOOTSTRAP.md` — rituale iniziale una tantum (eliminato dopo il completamento)
- `IDENTITY.md` — nome/vibe/emoji dell'agente
- `USER.md` — profilo utente + forma di indirizzo preferita

Al primo turno di una nuova sessione, OpenClaw inietta i contenuti di questi file direttamente nel contesto dell'agente.

I file vuoti vengono saltati. I file grandi vengono ridotti e troncati con un marcatore in modo che i prompt restino snelli (leggi il file per il contenuto completo).

Se un file manca, OpenClaw inietta una singola riga marcatore “file mancante” (e `openclaw setup` creerà un modello predefinito sicuro).

`BOOTSTRAP.md` viene creato solo per uno **spazio di lavoro completamente nuovo** (nessun altro file di bootstrap presente). Se lo elimini dopo aver completato il rituale, non dovrebbe essere ricreato ai riavvii successivi.

Per disabilitare completamente la creazione dei file di bootstrap (per spazi di lavoro pre-popolati), imposta:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Strumenti integrati

Gli strumenti core (read/exec/edit/write e strumenti di sistema correlati) sono sempre disponibili,
soggetti alla policy degli strumenti. `apply_patch` è opzionale e controllato da
`tools.exec.applyPatch`. `TOOLS.md` **non** controlla quali strumenti esistono; è
una guida su come _tu_ vuoi che vengano usati.

## Skills

OpenClaw carica le Skills da queste posizioni (precedenza più alta per prima):

- Spazio di lavoro: `<workspace>/skills`
- Skills agente di progetto: `<workspace>/.agents/skills`
- Skills agente personali: `~/.agents/skills`
- Gestite/locali: `~/.openclaw/skills`
- In bundle (fornite con l'installazione)
- Cartelle Skills aggiuntive: `skills.load.extraDirs`

Le Skills possono essere controllate tramite configurazione/env (vedi `skills` in [Configurazione del Gateway](/it/gateway/configuration)).

## Confini del runtime

Il runtime agente incorporato è basato sul core agente Pi (modelli, strumenti e
pipeline dei prompt). Gestione delle sessioni, discovery, collegamento degli strumenti e consegna
ai canali sono layer di proprietà di OpenClaw sopra quel core.

## Sessioni

Le trascrizioni delle sessioni sono archiviate come JSONL in:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

L'ID sessione è stabile ed è scelto da OpenClaw.
Le cartelle di sessione legacy di altri strumenti non vengono lette.

## Orientamento durante lo streaming

Quando la modalità coda è `steer`, i messaggi in ingresso vengono iniettati nell'esecuzione corrente.
L'orientamento in coda viene consegnato **dopo che il turno assistant corrente ha finito
di eseguire le sue chiamate agli strumenti**, prima della successiva chiamata LLM. Pi svuota insieme tutti i messaggi di
orientamento in sospeso per `steer`; il `queue` legacy svuota un messaggio per
confine di modello. L'orientamento non salta più le chiamate agli strumenti rimanenti dal messaggio
assistant corrente.

Quando la modalità coda è `followup` o `collect`, i messaggi in ingresso vengono trattenuti fino al termine del
turno corrente, poi un nuovo turno agente inizia con i payload in coda. Vedi
[Coda](/it/concepts/queue) e [Coda di orientamento](/it/concepts/queue-steering) per il comportamento di modalità
e confini.

Lo streaming a blocchi invia i blocchi assistant completati non appena terminano; è
**disattivato per impostazione predefinita** (`agents.defaults.blockStreamingDefault: "off"`).
Regola il confine tramite `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; valore predefinito text_end).
Controlla la suddivisione morbida dei blocchi con `agents.defaults.blockStreamingChunk` (valore predefinito
800–1200 caratteri; preferisce le interruzioni di paragrafo, poi le nuove righe; le frasi per ultime).
Aggrega i frammenti in streaming con `agents.defaults.blockStreamingCoalesce` per ridurre
lo spam su singola riga (fusione basata su inattività prima dell'invio). I canali non Telegram richiedono
`*.blockStreaming: true` esplicito per abilitare le risposte a blocchi.
I riepiloghi dettagliati degli strumenti vengono emessi all'avvio dello strumento (nessun debounce); la Control UI
trasmette l'output degli strumenti tramite eventi agente quando disponibile.
Maggiori dettagli: [Streaming + suddivisione in frammenti](/it/concepts/streaming).

## Riferimenti ai modelli

I riferimenti ai modelli nella configurazione (per esempio `agents.defaults.model` e `agents.defaults.models`) vengono analizzati dividendo sulla **prima** `/`.

- Usa `provider/model` quando configuri i modelli.
- Se l'ID modello stesso contiene `/` (stile OpenRouter), includi il prefisso del provider (esempio: `openrouter/moonshotai/kimi-k2`).
- Se ometti il provider, OpenClaw prova prima un alias, poi una corrispondenza univoca
  con un provider configurato per quell'esatto ID modello, e solo dopo ripiega
  sul provider predefinito configurato. Se quel provider non espone più il
  modello predefinito configurato, OpenClaw ripiega sul primo
  provider/modello configurato invece di mostrare un'impostazione predefinita obsoleta di un provider rimosso.

## Configurazione (minima)

Come minimo, imposta:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (fortemente consigliato)

---

_Avanti: [Chat di gruppo](/it/channels/group-messages)_ 🦞

## Correlati

- [Spazio di lavoro dell'agente](/it/concepts/agent-workspace)
- [Routing multi-agente](/it/concepts/multi-agent)
- [Gestione delle sessioni](/it/concepts/session)
