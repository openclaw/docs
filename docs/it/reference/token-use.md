---
read_when:
    - Spiegazione di uso dei token, costi o finestre di contesto
    - Debug della crescita del contesto o del comportamento di compattazione
summary: Come OpenClaw costruisce il contesto del prompt e riporta uso dei token + costi
title: Uso dei token e costi
x-i18n:
    generated_at: "2026-04-07T08:17:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0683693d6c6fcde7d5fba236064ba97dd4b317ae6bea3069db969fcd178119d9
    source_path: reference/token-use.md
    workflow: 15
---

# Uso dei token e costi

OpenClaw tiene traccia dei **token**, non dei caratteri. I token sono specifici del modello, ma la maggior parte
dei modelli in stile OpenAI ha una media di circa 4 caratteri per token per il testo inglese.

## Come viene costruito il prompt di sistema

OpenClaw assembla il proprio prompt di sistema a ogni esecuzione. Include:

- Elenco degli strumenti + brevi descrizioni
- Elenco delle Skills (solo metadati; le istruzioni vengono caricate su richiesta con `read`)
- Istruzioni di auto-aggiornamento
- Workspace + file bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` quando nuovi, più `MEMORY.md` quando presente o `memory.md` come fallback minuscolo). I file grandi vengono troncati da `agents.defaults.bootstrapMaxChars` (predefinito: 20000), e l'iniezione bootstrap totale è limitata da `agents.defaults.bootstrapTotalMaxChars` (predefinito: 150000). I file `memory/*.md` sono su richiesta tramite gli strumenti memory e non vengono iniettati automaticamente.
- Ora (UTC + fuso orario dell'utente)
- Tag di risposta + comportamento heartbeat
- Metadati runtime (host/OS/modello/thinking)

Vedi la scomposizione completa in [Prompt di sistema](/it/concepts/system-prompt).

## Cosa rientra nella finestra di contesto

Tutto ciò che il modello riceve conta ai fini del limite di contesto:

- Prompt di sistema (tutte le sezioni elencate sopra)
- Cronologia della conversazione (messaggi utente + assistente)
- Chiamate agli strumenti e risultati degli strumenti
- Allegati/trascrizioni (immagini, audio, file)
- Riepiloghi di compattazione e artefatti di pruning
- Wrapper del provider o header di sicurezza (non visibili, ma comunque conteggiati)

Per le immagini, OpenClaw riduce la scala dei payload immagine di trascrizione/strumenti prima delle chiamate al provider.
Usa `agents.defaults.imageMaxDimensionPx` (predefinito: `1200`) per regolare questo aspetto:

- Valori più bassi di solito riducono l'uso di vision-token e la dimensione del payload.
- Valori più alti preservano più dettaglio visivo per screenshot ricchi di OCR/UI.

Per una scomposizione pratica (per file iniettato, strumenti, Skills e dimensione del prompt di sistema), usa `/context list` o `/context detail`. Vedi [Contesto](/it/concepts/context).

## Come vedere l'uso corrente dei token

Usa questi comandi in chat:

- `/status` → **scheda di stato ricca di emoji** con il modello della sessione, utilizzo del contesto,
  token input/output dell'ultima risposta e **costo stimato** (solo chiave API).
- `/usage off|tokens|full` → aggiunge un **footer di utilizzo per risposta** a ogni risposta.
  - Persiste per sessione (memorizzato come `responseUsage`).
  - L'autenticazione OAuth **nasconde il costo** (solo token).
- `/usage cost` → mostra un riepilogo locale dei costi dai log di sessione OpenClaw.

Altre superfici:

- **TUI/Web TUI:** `/status` + `/usage` sono supportati.
- **CLI:** `openclaw status --usage` e `openclaw channels list` mostrano
  finestre di quota provider normalizzate (`X% left`, non costi per risposta).
  Provider attuali con finestra di utilizzo: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi e z.ai.

Le superfici di utilizzo normalizzano gli alias comuni dei campi nativi del provider prima della visualizzazione.
Per il traffico OpenAI-family Responses, questo include sia `input_tokens` /
`output_tokens` sia `prompt_tokens` / `completion_tokens`, così i nomi dei campi specifici del trasporto
non cambiano `/status`, `/usage` o i riepiloghi della sessione.
Anche l'utilizzo JSON di Gemini CLI viene normalizzato: il testo della risposta proviene da `response`, e
`stats.cached` viene mappato a `cacheRead` con `stats.input_tokens - stats.cached`
usato quando la CLI omette un campo esplicito `stats.input`.
Per il traffico nativo OpenAI-family Responses, gli alias di utilizzo WebSocket/SSE sono
normalizzati allo stesso modo, e i totali ricadono su input + output normalizzati quando
`total_tokens` è mancante o uguale a `0`.
Quando lo snapshot della sessione corrente è scarno, `/status` e `session_status` possono
anche recuperare contatori token/cache e l'etichetta del modello runtime attivo dal
log di utilizzo della trascrizione più recente. I valori live non nulli esistenti hanno comunque la precedenza sui valori di fallback della trascrizione, e i totali di trascrizione più grandi orientati al prompt
possono prevalere quando i totali memorizzati sono mancanti o più piccoli.
L'autenticazione di utilizzo per le finestre di quota del provider proviene da hook specifici del provider quando
disponibili; altrimenti OpenClaw ricade sulla corrispondenza delle credenziali OAuth/API-key
da profili auth, env o configurazione.

## Stima dei costi (quando mostrata)

I costi sono stimati dalla configurazione dei prezzi del tuo modello:

```
models.providers.<provider>.models[].cost
```

Questi sono **USD per 1M token** per `input`, `output`, `cacheRead` e
`cacheWrite`. Se i prezzi mancano, OpenClaw mostra solo i token. I token OAuth
non mostrano mai il costo in dollari.

## Impatto di cache TTL e pruning

La cache dei prompt del provider si applica solo entro la finestra TTL della cache. OpenClaw può
facoltativamente eseguire il **cache-ttl pruning**: esegue il pruning della sessione una volta che il TTL della cache
è scaduto, quindi reimposta la finestra della cache così le richieste successive possano riutilizzare il contesto appena memorizzato in cache invece di rimettere in cache l'intera cronologia. Questo mantiene più bassi i costi di scrittura della cache quando una sessione resta inattiva oltre il TTL.

Configuralo in [Configurazione Gateway](/it/gateway/configuration) e vedi i
dettagli del comportamento in [Pruning della sessione](/it/concepts/session-pruning).

Heartbeat può mantenere la cache **calda** durante gli intervalli di inattività. Se il TTL della cache del tuo modello
è `1h`, impostare l'intervallo heartbeat appena sotto quel valore (ad esempio `55m`) può evitare
di rimettere in cache l'intero prompt, riducendo i costi di scrittura della cache.

Nelle configurazioni multi-agent, puoi mantenere una configurazione modello condivisa e regolare il comportamento della cache
per agente con `agents.list[].params.cacheRetention`.

Per una guida completa comando per comando, vedi [Caching dei prompt](/it/reference/prompt-caching).

Per i prezzi dell'API Anthropic, le letture della cache sono significativamente più economiche dei token
di input, mentre le scritture della cache vengono fatturate con un moltiplicatore più alto. Vedi i prezzi del prompt caching di Anthropic per le tariffe più recenti e i moltiplicatori TTL:
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

### Esempio: traffico misto con strategia cache per agente

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
        cacheRetention: "none" # evita scritture cache per notifiche intermittenti
```

`agents.list[].params` viene unito sopra `params` del modello selezionato, quindi puoi
sovrascrivere solo `cacheRetention` ed ereditare invariati gli altri valori predefiniti del modello.

### Esempio: abilitare l'header beta Anthropic 1M context

La finestra di contesto Anthropic da 1M è attualmente protetta da beta. OpenClaw può iniettare il
valore `anthropic-beta` richiesto quando abiliti `context1m` sui modelli Opus
o Sonnet supportati.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Questo viene mappato all'header beta Anthropic `context-1m-2025-08-07`.

Questo si applica solo quando `context1m: true` è impostato su quella voce modello.

Requisito: la credenziale deve essere idonea per l'uso long-context. In caso contrario,
Anthropic risponde con un errore di rate limit lato provider per quella richiesta.

Se autentichi Anthropic con token OAuth/abbonamento (`sk-ant-oat-*`),
OpenClaw salta l'header beta `context-1m-*` perché Anthropic attualmente
rifiuta questa combinazione con HTTP 401.

## Suggerimenti per ridurre la pressione sui token

- Usa `/compact` per riassumere sessioni lunghe.
- Riduci i grandi output degli strumenti nei tuoi workflow.
- Abbassa `agents.defaults.imageMaxDimensionPx` per sessioni ricche di screenshot.
- Mantieni brevi le descrizioni delle Skills (l'elenco delle Skills viene iniettato nel prompt).
- Preferisci modelli più piccoli per lavoro verboso ed esplorativo.

Vedi [Skills](/it/tools/skills) per la formula esatta del sovraccarico dell'elenco delle Skills.
