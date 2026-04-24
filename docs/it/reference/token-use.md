---
read_when:
    - |-
      Spiegare utilizzo dei token, costi o finestre di contesto출장샵 to=final code```
      Spiegare utilizzo dei token, costi o finestre di contesto
      ```
    - Eseguire il debug della crescita del contesto o del comportamento di Compaction
summary: Come OpenClaw costruisce il contesto del prompt e segnala utilizzo token + costi
title: Uso dei token e costi
x-i18n:
    generated_at: "2026-04-24T09:01:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a95e7592a06bd750c0bfc9303d8cec2a538756e95f35c3001dc960cfebcadbf
    source_path: reference/token-use.md
    workflow: 15
---

# Uso dei token e costi

OpenClaw tiene traccia dei **token**, non dei caratteri. I token sono specifici del modello, ma la maggior parte
dei modelli in stile OpenAI usa in media ~4 caratteri per token per il testo in inglese.

## Come viene costruito il prompt di sistema

OpenClaw assembla il proprio prompt di sistema a ogni esecuzione. Include:

- Elenco degli strumenti + brevi descrizioni
- Elenco delle Skills (solo metadati; le istruzioni vengono caricate on demand con `read`).
  Il blocco compatto delle Skills è limitato da `skills.limits.maxSkillsPromptChars`,
  con override opzionale per agente in
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Istruzioni di auto-aggiornamento
- Workspace + file bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` quando nuovo, più `MEMORY.md` quando presente). `memory.md` minuscolo alla radice non viene iniettato; è input di riparazione legacy per `openclaw doctor --fix` quando è affiancato a `MEMORY.md`. I file grandi vengono troncati da `agents.defaults.bootstrapMaxChars` (predefinito: 12000), e l’iniezione bootstrap totale è limitata da `agents.defaults.bootstrapTotalMaxChars` (predefinito: 60000). I file giornalieri `memory/*.md` non fanno parte del normale prompt bootstrap; restano on-demand tramite strumenti di memoria nei turni ordinari, ma `/new` e `/reset` semplici possono anteporre un blocco one-shot di contesto iniziale con memoria giornaliera recente per quel primo turno. Quel preludio di avvio è controllato da `agents.defaults.startupContext`.
- Ora (UTC + fuso orario dell’utente)
- Tag di risposta + comportamento Heartbeat
- Metadati runtime (host/OS/modello/thinking)

Vedi la suddivisione completa in [System Prompt](/it/concepts/system-prompt).

## Cosa conta nella finestra di contesto

Tutto ciò che il modello riceve conta verso il limite del contesto:

- Prompt di sistema (tutte le sezioni elencate sopra)
- Cronologia della conversazione (messaggi utente + assistente)
- Chiamate agli strumenti e risultati degli strumenti
- Allegati/trascrizioni (immagini, audio, file)
- Riassunti di Compaction e artefatti di pruning
- Wrapper del provider o intestazioni di sicurezza (non visibili, ma comunque conteggiate)

Alcune superfici pesanti a runtime hanno propri limiti espliciti:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Gli override per agente si trovano sotto `agents.list[].contextLimits`. Queste manopole sono
per estratti bounded di runtime e blocchi iniettati posseduti dal runtime. Sono
separate dai limiti bootstrap, dai limiti di startup-context e dai limiti del prompt delle Skills.

Per le immagini, OpenClaw riduce le dimensioni dei payload immagine di trascrizione/strumenti prima delle chiamate al provider.
Usa `agents.defaults.imageMaxDimensionPx` (predefinito: `1200`) per regolarlo:

- Valori più bassi di solito riducono l’uso di vision-token e la dimensione del payload.
- Valori più alti preservano più dettaglio visivo per screenshot ricchi di OCR/UI.

Per una suddivisione pratica (per file iniettato, strumenti, Skills e dimensione del prompt di sistema), usa `/context list` oppure `/context detail`. Vedi [Context](/it/concepts/context).

## Come vedere l’uso attuale dei token

Usa questi in chat:

- `/status` → **scheda di stato ricca di emoji** con il modello della sessione, l’uso del contesto,
  i token input/output dell’ultima risposta e il **costo stimato** (solo chiave API).
- `/usage off|tokens|full` → aggiunge un **footer di utilizzo per risposta** a ogni reply.
  - Persiste per sessione (memorizzato come `responseUsage`).
  - L’autenticazione OAuth **nasconde il costo** (solo token).
- `/usage cost` → mostra un riepilogo locale dei costi dai log di sessione OpenClaw.

Altre superfici:

- **TUI/Web TUI:** `/status` e `/usage` sono supportati.
- **CLI:** `openclaw status --usage` e `openclaw channels list` mostrano
  finestre di quota normalizzate del provider (`X% left`, non costi per risposta).
  Provider attuali con finestra di utilizzo: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi e z.ai.

Le superfici di utilizzo normalizzano alias comuni dei campi nativi del provider prima della visualizzazione.
Per il traffico OpenAI-family Responses, questo include sia `input_tokens` /
`output_tokens` sia `prompt_tokens` / `completion_tokens`, così i nomi dei campi
specifici del trasporto non cambiano `/status`, `/usage` o i riepiloghi di sessione.
Anche l’uso JSON di Gemini CLI viene normalizzato: il testo della risposta proviene da `response`, e
`stats.cached` viene mappato a `cacheRead` usando `stats.input_tokens - stats.cached`
quando la CLI omette un campo esplicito `stats.input`.
Per il traffico nativo OpenAI-family Responses, gli alias di utilizzo WebSocket/SSE sono
normalizzati allo stesso modo, e i totali usano come fallback input + output normalizzati quando
`total_tokens` manca o è `0`.
Quando lo snapshot della sessione corrente è scarno, `/status` e `session_status` possono
anche recuperare contatori token/cache e l’etichetta del modello runtime attivo
dal log di utilizzo più recente della trascrizione. I valori live esistenti e non nulli continuano comunque ad avere precedenza sui valori di fallback della trascrizione, e i totali di trascrizione più grandi orientati al prompt
possono vincere quando i totali memorizzati mancano o sono più piccoli.
L’autenticazione di utilizzo per le finestre di quota del provider proviene da hook provider-specifici quando
disponibili; altrimenti OpenClaw usa come fallback credenziali OAuth/API-key corrispondenti
da profili di autenticazione, ambiente o configurazione.
Le voci della trascrizione dell’assistente persistono la stessa forma di utilizzo normalizzata, inclusi
`usage.cost` quando il modello attivo ha un prezzo configurato e il provider
restituisce metadati di utilizzo. Questo fornisce a `/usage cost` e allo stato di sessione basato sulla trascrizione
una sorgente stabile anche dopo la scomparsa dello stato runtime live.

## Stima dei costi (quando mostrata)

I costi vengono stimati dalla configurazione dei prezzi del tuo modello:

```
models.providers.<provider>.models[].cost
```

Questi valori sono **USD per 1M token** per `input`, `output`, `cacheRead` e
`cacheWrite`. Se il prezzo manca, OpenClaw mostra solo i token. I token OAuth
non mostrano mai il costo in dollari.

## Impatto del cache TTL e del pruning

Il prompt caching del provider si applica solo entro la finestra TTL della cache. OpenClaw può
facoltativamente eseguire il **cache-ttl pruning**: esegue il pruning della sessione una volta che il TTL della cache
è scaduto, poi reimposta la finestra di cache così le richieste successive possono
riutilizzare il contesto appena messo in cache invece di ricreare in cache l’intera cronologia. Questo mantiene più bassi
i costi di scrittura in cache quando una sessione resta inattiva oltre il TTL.

Configuralo in [Configurazione del Gateway](/it/gateway/configuration) e vedi i
dettagli del comportamento in [Session pruning](/it/concepts/session-pruning).

Heartbeat può mantenere la cache **calda** nei periodi di inattività. Se il TTL della cache del tuo modello
è `1h`, impostare l’intervallo Heartbeat appena sotto (es. `55m`) può evitare
di rimettere in cache l’intero prompt, riducendo i costi di scrittura in cache.

Nelle configurazioni multi-agente, puoi mantenere una configurazione modello condivisa e regolare il comportamento della cache
per agente con `agents.list[].params.cacheRetention`.

Per una guida completa manopola per manopola, vedi [Prompt Caching](/it/reference/prompt-caching).

Per i prezzi API Anthropic, le letture da cache sono significativamente più economiche dei
token input, mentre le scritture in cache vengono fatturate con un moltiplicatore più alto. Vedi i prezzi più aggiornati di Anthropic per il prompt caching e i moltiplicatori TTL:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Esempio: mantenere calda la cache 1h con Heartbeat

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### Esempio: traffico misto con strategia di cache per agente

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # baseline predefinita per la maggior parte degli agenti
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # mantiene calda una cache lunga per sessioni profonde
    - id: "alerts"
      params:
        cacheRetention: "none" # evita scritture in cache per notifiche bursty
```

`agents.list[].params` viene unito sopra i `params` del modello selezionato, così puoi
sostituire solo `cacheRetention` ed ereditare invariati gli altri valori predefiniti del modello.

### Esempio: abilitare l’intestazione beta Anthropic per contesto 1M

La finestra di contesto Anthropic da 1M è attualmente protetta da beta. OpenClaw può iniettare il
valore `anthropic-beta` richiesto quando abiliti `context1m` su modelli Opus
o Sonnet supportati.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Questo viene mappato all’intestazione beta Anthropic `context-1m-2025-08-07`.

Si applica solo quando `context1m: true` è impostato su quella voce modello.

Requisito: la credenziale deve essere idonea all’uso long-context. In caso contrario,
Anthropic risponde con un errore di rate limit lato provider per quella richiesta.

Se autentichi Anthropic con token OAuth/abbonamento (`sk-ant-oat-*`),
OpenClaw salta l’intestazione beta `context-1m-*` perché Anthropic attualmente
rifiuta quella combinazione con HTTP 401.

## Suggerimenti per ridurre la pressione dei token

- Usa `/compact` per riassumere sessioni lunghe.
- Riduci i grandi output degli strumenti nei tuoi workflow.
- Abbassa `agents.defaults.imageMaxDimensionPx` per sessioni ricche di screenshot.
- Mantieni brevi le descrizioni delle Skills (l’elenco delle Skills viene iniettato nel prompt).
- Preferisci modelli più piccoli per lavoro verboso ed esplorativo.

Vedi [Skills](/it/tools/skills) per la formula esatta del costo dell’elenco delle Skills.

## Correlati

- [Uso API e costi](/it/reference/api-usage-costs)
- [Prompt Caching](/it/reference/prompt-caching)
- [Tracciamento dell’utilizzo](/it/concepts/usage-tracking)
