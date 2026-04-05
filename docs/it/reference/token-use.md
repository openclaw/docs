---
read_when:
    - Spiegare l'uso dei token, i costi o le finestre di contesto
    - Eseguire il debug della crescita del contesto o del comportamento della compattazione
summary: Come OpenClaw costruisce il contesto del prompt e riporta l'uso dei token + i costi
title: Uso dei token e costi
x-i18n:
    generated_at: "2026-04-05T14:04:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14e7a0ac0311298cf1484d663799a3f5a9687dd5afc9702233e983aba1979f1d
    source_path: reference/token-use.md
    workflow: 15
---

# Uso dei token e costi

OpenClaw tiene traccia dei **token**, non dei caratteri. I token dipendono dal modello, ma la maggior parte
dei modelli in stile OpenAI ha una media di circa 4 caratteri per token per il testo in inglese.

## Come viene costruito il prompt di sistema

OpenClaw assembla il proprio prompt di sistema a ogni esecuzione. Include:

- Elenco degli strumenti + brevi descrizioni
- Elenco delle Skills (solo metadati; le istruzioni vengono caricate on demand con `read`)
- Istruzioni di auto-aggiornamento
- Workspace + file bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` quando nuovi, più `MEMORY.md` quando presente oppure `memory.md` come fallback in minuscolo). I file grandi vengono troncati da `agents.defaults.bootstrapMaxChars` (predefinito: 20000), e l'iniezione bootstrap totale è limitata da `agents.defaults.bootstrapTotalMaxChars` (predefinito: 150000). I file `memory/*.md` sono on demand tramite gli strumenti di memory e non vengono inseriti automaticamente.
- Orario (UTC + fuso orario utente)
- Reply tags + comportamento dell'heartbeat
- Metadati runtime (host/OS/model/thinking)

Vedi la suddivisione completa in [Prompt di sistema](/concepts/system-prompt).

## Cosa conta nella finestra di contesto

Tutto ciò che il modello riceve conta ai fini del limite di contesto:

- Prompt di sistema (tutte le sezioni elencate sopra)
- Cronologia della conversazione (messaggi utente + assistant)
- Chiamate agli strumenti e risultati degli strumenti
- Allegati/trascrizioni (immagini, audio, file)
- Riepiloghi della compattazione e artefatti di pruning
- Wrapper del provider o header di sicurezza (non visibili, ma comunque conteggiati)

Per le immagini, OpenClaw ridimensiona i payload immagine della trascrizione/degli strumenti prima delle chiamate al provider.
Usa `agents.defaults.imageMaxDimensionPx` (predefinito: `1200`) per regolare questo aspetto:

- Valori più bassi di solito riducono l'uso dei vision-token e la dimensione del payload.
- Valori più alti preservano maggior dettaglio visivo per screenshot ricchi di OCR/UI.

Per una suddivisione pratica (per file inserito, strumenti, Skills e dimensione del prompt di sistema), usa `/context list` o `/context detail`. Vedi [Contesto](/concepts/context).

## Come vedere l'uso attuale dei token

Usa questi comandi in chat:

- `/status` → **scheda di stato ricca di emoji** con il modello della sessione, l'uso del contesto,
  i token di input/output dell'ultima risposta e il **costo stimato** (solo API key).
- `/usage off|tokens|full` → aggiunge un **footer di utilizzo per risposta** a ogni reply.
  - Persiste per sessione (memorizzato come `responseUsage`).
  - L'auth OAuth **nasconde il costo** (solo token).
- `/usage cost` → mostra un riepilogo locale dei costi dai log di sessione di OpenClaw.

Altre superfici:

- **TUI/Web TUI:** `/status` e `/usage` sono supportati.
- **CLI:** `openclaw status --usage` e `openclaw channels list` mostrano
  finestre di quota provider normalizzate (`X% left`, non costi per risposta).
  Provider attuali con finestra d'uso: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi e z.ai.

Le superfici di utilizzo normalizzano prima della visualizzazione i comuni alias dei campi nativi del provider.
Per il traffico Responses della famiglia OpenAI, questo include sia `input_tokens` /
`output_tokens` sia `prompt_tokens` / `completion_tokens`, così i nomi dei campi specifici del trasporto
non modificano `/status`, `/usage` o i riepiloghi di sessione.
Anche l'utilizzo JSON di Gemini CLI viene normalizzato: il testo della reply proviene da `response`, e
`stats.cached` viene mappato a `cacheRead` con `stats.input_tokens - stats.cached`
usato quando la CLI omette un campo esplicito `stats.input`.
Per il traffico nativo Responses della famiglia OpenAI, gli alias di utilizzo WebSocket/SSE sono
normalizzati allo stesso modo, e i totali ricadono su input + output normalizzati quando
`total_tokens` è mancante o è `0`.
Quando lo snapshot della sessione corrente è scarno, `/status` e `session_status` possono
anche recuperare contatori token/cache e l'etichetta del modello runtime attivo
dal log di utilizzo più recente della trascrizione. I valori live esistenti diversi da zero hanno comunque la precedenza sui valori di fallback della trascrizione, e i totali della trascrizione più grandi orientati al prompt
possono prevalere quando i totali memorizzati sono mancanti o più piccoli.
L'auth di utilizzo per le finestre di quota del provider proviene da hook specifici del provider quando
disponibili; altrimenti OpenClaw ricade su credenziali OAuth/API-key corrispondenti da auth profile, env o config.

## Stima dei costi (quando mostrata)

I costi vengono stimati in base alla configurazione dei prezzi del tuo modello:

```
models.providers.<provider>.models[].cost
```

Questi sono **USD per 1M di token** per `input`, `output`, `cacheRead` e
`cacheWrite`. Se i prezzi mancano, OpenClaw mostra solo i token. I token OAuth
non mostrano mai il costo in dollari.

## Impatto di cache TTL e pruning

La prompt cache del provider si applica solo entro la finestra TTL della cache. OpenClaw può
facoltativamente eseguire il **cache-ttl pruning**: riduce la sessione una volta che il TTL della cache
è scaduto, poi reimposta la finestra della cache in modo che le richieste successive possano riutilizzare il contesto appena memorizzato in cache invece di ricreare la cache dell'intera cronologia. Questo mantiene più bassi i costi di scrittura della cache quando una sessione resta inattiva oltre il TTL.

Configuralo in [Configurazione del gateway](/gateway/configuration) e vedi i
dettagli del comportamento in [Potatura delle sessioni](/concepts/session-pruning).

L'heartbeat può mantenere la cache **calda** durante i periodi di inattività. Se il TTL della cache del tuo modello
è `1h`, impostare l'intervallo dell'heartbeat appena sotto quel valore (ad es. `55m`) può evitare
di ricreare la cache del prompt completo, riducendo i costi di scrittura della cache.

Nelle configurazioni multi-agent, puoi mantenere una configurazione modello condivisa e regolare il comportamento della cache
per agente con `agents.list[].params.cacheRetention`.

Per una guida completa comando per comando, vedi [Prompt Caching](/reference/prompt-caching).

Per i prezzi dell'API Anthropic, le letture della cache sono significativamente più economiche dei token di input,
mentre le scritture della cache vengono fatturate con un moltiplicatore più alto. Vedi i prezzi di Anthropic per il prompt caching per le tariffe e i moltiplicatori TTL più recenti:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Esempio: mantenere calda per 1h la cache con heartbeat

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

### Esempio: traffico misto con strategia di cache per-agente

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
        every: "55m" # mantiene calda la cache lunga per sessioni profonde
    - id: "alerts"
      params:
        cacheRetention: "none" # evita scritture di cache per notifiche a raffica
```

`agents.list[].params` viene unito sopra i `params` del modello selezionato, quindi puoi
sovrascrivere solo `cacheRetention` ed ereditare invariati gli altri valori predefiniti del modello.

### Esempio: abilitare l'header beta Anthropic 1M context

La finestra di contesto Anthropic da 1M è attualmente protetta da beta. OpenClaw può inserire il
valore richiesto `anthropic-beta` quando abiliti `context1m` sui modelli Opus
o Sonnet supportati.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Questo viene mappato all'header beta di Anthropic `context-1m-2025-08-07`.

Si applica solo quando `context1m: true` è impostato su quella voce di modello.

Requisito: la credenziale deve essere idonea all'uso del contesto lungo (fatturazione con API key
oppure percorso Claude-login di OpenClaw con Extra Usage abilitato). In caso contrario,
Anthropic risponde
con `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

Se autentichi Anthropic con token OAuth/abbonamento (`sk-ant-oat-*`),
OpenClaw salta l'header beta `context-1m-*` perché Anthropic attualmente
rifiuta questa combinazione con HTTP 401.

## Suggerimenti per ridurre la pressione sui token

- Usa `/compact` per riassumere sessioni lunghe.
- Riduci i grandi output degli strumenti nei tuoi workflow.
- Abbassa `agents.defaults.imageMaxDimensionPx` per sessioni ricche di screenshot.
- Mantieni brevi le descrizioni delle Skills (l'elenco delle Skills viene inserito nel prompt).
- Preferisci modelli più piccoli per lavoro verboso ed esplorativo.

Vedi [Skills](/tools/skills) per la formula esatta dell'overhead dell'elenco delle Skills.
