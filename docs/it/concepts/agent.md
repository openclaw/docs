---
read_when:
    - Modifica del runtime dell'agente, del bootstrap dello spazio di lavoro o del comportamento della sessione
summary: Runtime dell'agente, contratto dello spazio di lavoro e bootstrap della sessione
title: Runtime dell'agente
x-i18n:
    generated_at: "2026-04-05T13:49:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2ff39f4114f009e5b1f86894ea4bb29b1c9512563b70d063f09ca7cde5e8948
    source_path: concepts/agent.md
    workflow: 15
---

# Runtime dell'agente

OpenClaw esegue un singolo runtime agente incorporato.

## Spazio di lavoro (obbligatorio)

OpenClaw usa una singola directory di spazio di lavoro dell'agente (`agents.defaults.workspace`) come **unica** directory di lavoro (`cwd`) dell'agente per strumenti e contesto.

Consigliato: usa `openclaw setup` per creare `~/.openclaw/openclaw.json` se manca e inizializzare i file dello spazio di lavoro.

Layout completo dello spazio di lavoro + guida al backup: [Spazio di lavoro dell'agente](/concepts/agent-workspace)

Se `agents.defaults.sandbox` è abilitato, le sessioni non principali possono sostituirlo con
spazi di lavoro per sessione sotto `agents.defaults.sandbox.workspaceRoot` (vedi
[Configurazione del Gateway](/gateway/configuration)).

## File di bootstrap (iniettati)

All'interno di `agents.defaults.workspace`, OpenClaw si aspetta questi file modificabili dall'utente:

- `AGENTS.md` — istruzioni operative + “memoria”
- `SOUL.md` — persona, limiti, tono
- `TOOLS.md` — note sugli strumenti mantenute dall'utente (ad esempio `imsg`, `sag`, convenzioni)
- `BOOTSTRAP.md` — rituale iniziale una tantum alla prima esecuzione (eliminato dopo il completamento)
- `IDENTITY.md` — nome/vibe/emoji dell'agente
- `USER.md` — profilo utente + appellativo preferito

Al primo turno di una nuova sessione, OpenClaw inietta direttamente il contenuto di questi file nel contesto dell'agente.

I file vuoti vengono saltati. I file grandi vengono ridotti e troncati con un indicatore in modo che i prompt restino snelli (leggi il file per il contenuto completo).

Se un file manca, OpenClaw inietta una singola riga indicatrice di “file mancante” (e `openclaw setup` creerà un modello predefinito sicuro).

`BOOTSTRAP.md` viene creato solo per uno **spazio di lavoro completamente nuovo** (nessun altro file di bootstrap presente). Se lo elimini dopo aver completato il rituale, non dovrebbe essere ricreato nei riavvii successivi.

Per disabilitare completamente la creazione dei file di bootstrap (per spazi di lavoro già preconfigurati), imposta:

```json5
{ agent: { skipBootstrap: true } }
```

## Strumenti integrati

Gli strumenti core (read/exec/edit/write e strumenti di sistema correlati) sono sempre disponibili,
in base alla policy degli strumenti. `apply_patch` è facoltativo ed è controllato da
`tools.exec.applyPatch`. `TOOLS.md` **non** controlla quali strumenti esistono; è
una guida su come _vuoi_ che vengano usati.

## Skills

OpenClaw carica le Skills da queste posizioni (precedenza più alta per prima):

- Spazio di lavoro: `<workspace>/skills`
- Skills agente del progetto: `<workspace>/.agents/skills`
- Skills agente personali: `~/.agents/skills`
- Gestite/locali: `~/.openclaw/skills`
- Incluse nel pacchetto (fornite con l'installazione)
- Cartelle Skills aggiuntive: `skills.load.extraDirs`

Le Skills possono essere controllate da config/env (vedi `skills` in [Configurazione del Gateway](/gateway/configuration)).

## Limiti del runtime

Il runtime agente incorporato è costruito sul core agente Pi (modelli, strumenti e
pipeline dei prompt). Gestione delle sessioni, discovery, collegamento degli strumenti e
distribuzione sui canali sono livelli di proprietà OpenClaw sopra quel core.

## Sessioni

Le trascrizioni delle sessioni sono archiviate come JSONL in:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

L'ID sessione è stabile ed è scelto da OpenClaw.
Le cartelle sessione legacy di altri strumenti non vengono lette.

## Indirizzamento durante lo streaming

Quando la modalità coda è `steer`, i messaggi in entrata vengono iniettati nell'esecuzione corrente.
L'indirizzamento accodato viene consegnato **dopo che il turno corrente dell'assistente ha finito di
eseguire le sue chiamate agli strumenti**, prima della successiva chiamata LLM. L'indirizzamento non salta più
le chiamate agli strumenti rimanenti del messaggio corrente dell'assistente; invece inietta il messaggio
accodato al successivo confine del modello.

Quando la modalità coda è `followup` o `collect`, i messaggi in entrata vengono trattenuti fino al
termine del turno corrente, poi inizia un nuovo turno dell'agente con i payload accodati. Vedi
[Coda](/concepts/queue) per il comportamento di modalità + debounce/cap.

L'invio a blocchi nello streaming invia i blocchi completati dell'assistente non appena terminano; è
**disattivato per impostazione predefinita** (`agents.defaults.blockStreamingDefault: "off"`).
Regola il confine tramite `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; valore predefinito `text_end`).
Controlla il chunking morbido dei blocchi con `agents.defaults.blockStreamingChunk` (predefinito
800–1200 caratteri; preferisce le interruzioni di paragrafo, poi le nuove righe; per ultime le frasi).
Unisci i chunk trasmessi con `agents.defaults.blockStreamingCoalesce` per ridurre
lo spam su singola riga (fusione basata su inattività prima dell'invio). I canali non Telegram richiedono
`*.blockStreaming: true` esplicito per abilitare le risposte a blocchi.
I riepiloghi dettagliati degli strumenti vengono emessi all'avvio dello strumento (nessun debounce); la UI di controllo
trasmette l'output degli strumenti tramite eventi dell'agente quando disponibile.
Maggiori dettagli: [Streaming + chunking](/concepts/streaming).

## Riferimenti ai modelli

I riferimenti ai modelli nella configurazione (ad esempio `agents.defaults.model` e `agents.defaults.models`) vengono analizzati dividendoli sul **primo** `/`.

- Usa `provider/model` quando configuri i modelli.
- Se l'ID del modello stesso contiene `/` (stile OpenRouter), includi il prefisso del provider (esempio: `openrouter/moonshotai/kimi-k2`).
- Se ometti il provider, OpenClaw prova prima un alias, poi una corrispondenza univoca
  di provider configurato per quell'esatto id modello, e solo allora torna al provider predefinito configurato. Se quel provider non espone più il
  modello predefinito configurato, OpenClaw torna al primo
  provider/modello configurato invece di mostrare un predefinito obsoleto di un provider rimosso.

## Configurazione (minima)

Come minimo, imposta:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (fortemente consigliato)

---

_Prossimo: [Chat di gruppo](/it/channels/group-messages)_ 🦞
