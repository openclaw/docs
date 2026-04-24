---
read_when:
    - Modifica del runtime dell'agente, del bootstrap dello spazio di lavoro o del comportamento della sessione
summary: Runtime dell'agente, contratto dello spazio di lavoro e bootstrap della sessione
title: Runtime dell'agente
x-i18n:
    generated_at: "2026-04-24T08:35:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07fe0ca3c6bc306f95ac024b97b4e6e188c2d30786b936b8bd66a5f3ec012d4e
    source_path: concepts/agent.md
    workflow: 15
---

OpenClaw esegue un **singolo runtime agente incorporato** — un processo agente per
Gateway, con il proprio spazio di lavoro, file bootstrap e archivio sessioni. Questa pagina
copre quel contratto del runtime: cosa deve contenere lo spazio di lavoro, quali file vengono
iniettati e come le sessioni eseguono il bootstrap rispetto a esso.

## Spazio di lavoro (obbligatorio)

OpenClaw usa una singola directory di spazio di lavoro dell'agente (`agents.defaults.workspace`) come **unica** directory di lavoro (`cwd`) dell'agente per strumenti e contesto.

Consigliato: usa `openclaw setup` per creare `~/.openclaw/openclaw.json` se manca e inizializzare i file dello spazio di lavoro.

Guida completa al layout dello spazio di lavoro + backup: [Agent workspace](/it/concepts/agent-workspace)

Se `agents.defaults.sandbox` è abilitato, le sessioni non principali possono sovrascriverlo con
spazi di lavoro per sessione sotto `agents.defaults.sandbox.workspaceRoot` (vedi
[Gateway configuration](/it/gateway/configuration)).

## File bootstrap (iniettati)

All'interno di `agents.defaults.workspace`, OpenClaw si aspetta questi file modificabili dall'utente:

- `AGENTS.md` — istruzioni operative + “memoria”
- `SOUL.md` — persona, limiti, tono
- `TOOLS.md` — note sugli strumenti mantenute dall'utente (ad esempio `imsg`, `sag`, convenzioni)
- `BOOTSTRAP.md` — rituale una tantum della prima esecuzione (eliminato dopo il completamento)
- `IDENTITY.md` — nome/vibe/emoji dell'agente
- `USER.md` — profilo utente + modo preferito di essere chiamato

Al primo turno di una nuova sessione, OpenClaw inietta direttamente nel contesto dell'agente il contenuto di questi file.

I file vuoti vengono saltati. I file grandi vengono ridotti e troncati con un marcatore così i prompt restano leggeri (leggi il file per il contenuto completo).

Se un file manca, OpenClaw inietta una singola riga marcatore “file mancante” (e `openclaw setup` creerà un modello predefinito sicuro).

`BOOTSTRAP.md` viene creato solo per uno **spazio di lavoro completamente nuovo** (nessun altro file bootstrap presente). Se lo elimini dopo aver completato il rituale, non dovrebbe essere ricreato ai riavvii successivi.

Per disabilitare completamente la creazione dei file bootstrap (per spazi di lavoro precompilati), imposta:

```json5
{ agent: { skipBootstrap: true } }
```

## Strumenti integrati

Gli strumenti core (read/exec/edit/write e strumenti di sistema correlati) sono sempre disponibili,
soggetti alla policy degli strumenti. `apply_patch` è facoltativo ed è controllato da
`tools.exec.applyPatch`. `TOOLS.md` **non** controlla quali strumenti esistono; è
una guida su come _vuoi_ che vengano usati.

## Skills

OpenClaw carica Skills da queste posizioni (precedenza più alta per prime):

- Spazio di lavoro: `<workspace>/skills`
- Skills agente del progetto: `<workspace>/.agents/skills`
- Skills agente personali: `~/.agents/skills`
- Gestite/locali: `~/.openclaw/skills`
- Integrate (fornite con l'installazione)
- Cartelle Skills extra: `skills.load.extraDirs`

Le Skills possono essere controllate da config/env (vedi `skills` in [Gateway configuration](/it/gateway/configuration)).

## Limiti del runtime

Il runtime agente incorporato è costruito sul core agente Pi (modelli, strumenti e
pipeline dei prompt). Gestione delle sessioni, rilevamento, collegamento degli strumenti e
consegna ai canali sono livelli di proprietà di OpenClaw sopra quel core.

## Sessioni

Le trascrizioni delle sessioni vengono archiviate come JSONL in:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

L'ID sessione è stabile ed è scelto da OpenClaw.
Le cartelle di sessione legacy di altri strumenti non vengono lette.

## Steering durante lo streaming

Quando la modalità queue è `steer`, i messaggi in ingresso vengono iniettati nell'esecuzione corrente.
Lo steering accodato viene consegnato **dopo che il turno corrente dell'assistente ha terminato
l'esecuzione delle sue chiamate agli strumenti**, prima della successiva chiamata LLM. Lo steering non salta più
le chiamate agli strumenti rimanenti del messaggio corrente dell'assistente; inietta invece il messaggio
accodato al successivo confine del modello.

Quando la modalità queue è `followup` o `collect`, i messaggi in ingresso vengono mantenuti fino alla
fine del turno corrente, poi viene avviato un nuovo turno agente con i payload accodati. Vedi
[Queue](/it/concepts/queue) per comportamento di modalità + debounce/cap.

Lo streaming a blocchi invia i blocchi completati dell'assistente appena terminano; è
**disattivato per impostazione predefinita** (`agents.defaults.blockStreamingDefault: "off"`).
Regola il confine tramite `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; predefinito text_end).
Controlla la suddivisione morbida dei blocchi con `agents.defaults.blockStreamingChunk` (predefinito
800–1200 caratteri; preferisce interruzioni di paragrafo, poi newline; le frasi per ultime).
Unisci i blocchi trasmessi con `agents.defaults.blockStreamingCoalesce` per ridurre
lo spam di singole righe (fusione basata su inattività prima dell'invio). I canali non Telegram richiedono
`*.blockStreaming: true` esplicito per abilitare le risposte a blocchi.
I riepiloghi dettagliati degli strumenti vengono emessi all'avvio dello strumento (senza debounce); l'interfaccia Control UI
trasmette l'output degli strumenti tramite eventi dell'agente quando disponibile.
Maggiori dettagli: [Streaming + chunking](/it/concepts/streaming).

## Riferimenti del modello

I riferimenti del modello nella configurazione (ad esempio `agents.defaults.model` e `agents.defaults.models`) vengono analizzati dividendo sul **primo** `/`.

- Usa `provider/model` quando configuri i modelli.
- Se l'ID del modello contiene a sua volta `/` (stile OpenRouter), includi il prefisso provider (esempio: `openrouter/moonshotai/kimi-k2`).
- Se ometti il provider, OpenClaw prova prima un alias, poi una
  corrispondenza univoca del provider configurato per quell'esatto id modello, e solo dopo usa come fallback
  il provider predefinito configurato. Se quel provider non espone più il
  modello predefinito configurato, OpenClaw usa come fallback il primo
  provider/modello configurato invece di mostrare un predefinito obsoleto di un provider rimosso.

## Configurazione (minima)

Come minimo, imposta:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (fortemente consigliato)

---

_Prossimo: [Group Chats](/it/channels/group-messages)_ 🦞

## Correlati

- [Agent workspace](/it/concepts/agent-workspace)
- [Multi-agent routing](/it/concepts/multi-agent)
- [Session management](/it/concepts/session)
