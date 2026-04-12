---
read_when:
    - Spiegazione dell'utilizzo dei token, dei costi o delle finestre di contesto
    - Debug del comportamento di crescita o compattazione del contesto
summary: Come OpenClaw costruisce il contesto del prompt e riporta l'utilizzo dei token e i costi
title: Utilizzo dei token e costi
x-i18n:
    generated_at: "2026-04-12T08:08:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: f8c856549cd28b8364a640e6fa9ec26aa736895c7a993e96cbe85838e7df2dfb
    source_path: reference/token-use.md
    workflow: 15
---

# Utilizzo dei token e costi

OpenClaw tiene traccia dei **token**, non dei caratteri. I token dipendono dal modello, ma la maggior parte dei modelli in stile OpenAI ha una media di circa 4 caratteri per token per il testo in inglese.

## Come viene costruito il prompt di sistema

OpenClaw assembla il proprio prompt di sistema a ogni esecuzione. Include:

- Elenco degli strumenti + brevi descrizioni
- Elenco delle Skills (solo metadati; le istruzioni vengono caricate su richiesta con `read`)
- Istruzioni per l'autoaggiornamento
- File del workspace + bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` quando nuovo, più `MEMORY.md` quando presente o `memory.md` come fallback in minuscolo). I file grandi vengono troncati da `agents.defaults.bootstrapMaxChars` (predefinito: 20000), e l'iniezione bootstrap totale è limitata da `agents.defaults.bootstrapTotalMaxChars` (predefinito: 150000). I file giornalieri `memory/*.md` non fanno parte del normale prompt bootstrap; restano disponibili su richiesta tramite gli strumenti di memoria nei turni ordinari, ma `/new` e `/reset` senza argomenti possono anteporre un blocco di contesto di avvio monouso con la memoria giornaliera recente per quel primo turno. Questo preambolo di avvio è controllato da `agents.defaults.startupContext`.
- Ora (UTC + fuso orario dell'utente)
- Tag di risposta + comportamento heartbeat
- Metadati di runtime (host/OS/modello/riflessione)

Vedi la suddivisione completa in [Prompt di sistema](/it/concepts/system-prompt).

## Cosa rientra nella finestra di contesto

Tutto ciò che il modello riceve conta ai fini del limite di contesto:

- Prompt di sistema (tutte le sezioni elencate sopra)
- Cronologia della conversazione (messaggi utente + assistente)
- Chiamate agli strumenti e risultati degli strumenti
- Allegati/trascrizioni (immagini, audio, file)
- Riepiloghi di compattazione e artefatti di potatura
- Wrapper del provider o intestazioni di sicurezza (non visibili, ma comunque conteggiati)

Per le immagini, OpenClaw ridimensiona i payload immagine di trascrizione/strumenti prima delle chiamate al provider.
Usa `agents.defaults.imageMaxDimensionPx` (predefinito: `1200`) per regolare questo aspetto:

- Valori più bassi di solito riducono l'uso di vision token e la dimensione del payload.
- Valori più alti preservano più dettaglio visivo per OCR/screenshot ricchi di interfaccia.

Per una suddivisione pratica (per ogni file iniettato, strumenti, Skills e dimensione del prompt di sistema), usa `/context list` o `/context detail`. Vedi [Contesto](/it/concepts/context).

## Come vedere l'utilizzo attuale dei token

Usa questi comandi in chat:

- `/status` → **scheda di stato ricca di emoji** con il modello della sessione, utilizzo del contesto, token di input/output dell'ultima risposta e **costo stimato** (solo chiave API).
- `/usage off|tokens|full` → aggiunge un **footer di utilizzo per risposta** a ogni risposta.
  - Persiste per sessione (memorizzato come `responseUsage`).
  - L'autenticazione OAuth **nasconde il costo** (solo token).
- `/usage cost` → mostra un riepilogo locale dei costi dai log di sessione di OpenClaw.

Altre superfici:

- **TUI/Web TUI:** `/status` + `/usage` sono supportati.
- **CLI:** `openclaw status --usage` e `openclaw channels list` mostrano finestre di quota provider normalizzate (`X% rimanente`, non costi per risposta).
  Provider attuali per le finestre di utilizzo: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi e z.ai.

Le superfici di utilizzo normalizzano gli alias comuni dei campi nativi del provider prima della visualizzazione.
Per il traffico OpenAI-family Responses, questo include sia `input_tokens` / `output_tokens` sia `prompt_tokens` / `completion_tokens`, quindi i nomi dei campi specifici del trasporto non cambiano `/status`, `/usage` o i riepiloghi di sessione.
Anche l'utilizzo JSON di Gemini CLI viene normalizzato: il testo della risposta proviene da `response`, e `stats.cached` viene mappato a `cacheRead`, con `stats.input_tokens - stats.cached` usato quando la CLI omette un campo `stats.input` esplicito.
Per il traffico nativo OpenAI-family Responses, gli alias di utilizzo WebSocket/SSE vengono normalizzati allo stesso modo, e i totali ricadono su input + output normalizzati quando `total_tokens` manca o vale `0`.
Quando lo snapshot della sessione corrente è scarno, `/status` e `session_status` possono anche recuperare i contatori token/cache e l'etichetta del modello di runtime attivo dal log di utilizzo della trascrizione più recente. I valori live esistenti e non nulli hanno comunque la precedenza sui valori di fallback della trascrizione, e i totali di trascrizione orientati al prompt più grandi possono prevalere quando i totali memorizzati mancano o sono più piccoli.
L'autenticazione di utilizzo per le finestre di quota del provider proviene da hook specifici del provider quando disponibili; altrimenti OpenClaw ricorre alla corrispondenza di credenziali OAuth/chiave API dai profili di autenticazione, dall'ambiente o dalla configurazione.

## Stima dei costi (quando mostrata)

I costi sono stimati dalla configurazione dei prezzi del tuo modello:

```
models.providers.<provider>.models[].cost
```

Questi sono **USD per 1M token** per `input`, `output`, `cacheRead` e `cacheWrite`. Se i prezzi mancano, OpenClaw mostra solo i token. I token OAuth non mostrano mai il costo in dollari.

## Impatto di TTL della cache e potatura

La cache del prompt del provider si applica solo entro la finestra TTL della cache. OpenClaw può opzionalmente eseguire la **potatura cache-ttl**: pota la sessione una volta scaduto il TTL della cache, poi reimposta la finestra della cache in modo che le richieste successive possano riutilizzare il contesto appena messo in cache invece di rimettere in cache l'intera cronologia. Questo mantiene più bassi i costi di scrittura della cache quando una sessione resta inattiva oltre il TTL.

Configuralo in [Configurazione del Gateway](/it/gateway/configuration) e vedi i dettagli del comportamento in [Potatura della sessione](/it/concepts/session-pruning).

Heartbeat può mantenere la cache **calda** durante i periodi di inattività. Se il TTL della cache del tuo modello è `1h`, impostare l'intervallo heartbeat appena sotto quel valore (ad esempio `55m`) può evitare di rimettere in cache l'intero prompt, riducendo i costi di scrittura della cache.

Nelle configurazioni multi-agent, puoi mantenere una configurazione del modello condivisa e regolare il comportamento della cache per agente con `agents.list[].params.cacheRetention`.

Per una guida completa, parametro per parametro, vedi [Prompt Caching](/it/reference/prompt-caching).

Per i prezzi dell'API Anthropic, le letture della cache sono significativamente più economiche dei token di input, mentre le scritture della cache vengono fatturate con un moltiplicatore più alto. Vedi i prezzi del prompt caching di Anthropic per le tariffe e i moltiplicatori TTL più aggiornati:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Esempio: mantenere calda una cache di 1h con heartbeat

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
        every: "55m" # mantiene calda la cache lunga per le sessioni profonde
    - id: "alerts"
      params:
        cacheRetention: "none" # evita scritture della cache per notifiche intermittenti
```

`agents.list[].params` viene unito sopra i `params` del modello selezionato, quindi puoi sovrascrivere solo `cacheRetention` e lasciare invariati gli altri valori predefiniti del modello.

### Esempio: abilitare l'intestazione beta Anthropic da 1M di contesto

La finestra di contesto da 1M di Anthropic è attualmente protetta da beta. OpenClaw può iniettare il valore `anthropic-beta` richiesto quando abiliti `context1m` sui modelli Opus o Sonnet supportati.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Questo viene mappato all'intestazione beta `context-1m-2025-08-07` di Anthropic.

Questo si applica solo quando `context1m: true` è impostato su quella voce del modello.

Requisito: la credenziale deve essere idonea all'uso del contesto lungo. In caso contrario, Anthropic risponde con un errore di rate limit lato provider per quella richiesta.

Se autentichi Anthropic con token OAuth/abbonamento (`sk-ant-oat-*`), OpenClaw salta l'intestazione beta `context-1m-*` perché Anthropic attualmente rifiuta quella combinazione con HTTP 401.

## Suggerimenti per ridurre la pressione sui token

- Usa `/compact` per riepilogare sessioni lunghe.
- Riduci i grandi output degli strumenti nei tuoi workflow.
- Abbassa `agents.defaults.imageMaxDimensionPx` per sessioni ricche di screenshot.
- Mantieni brevi le descrizioni delle Skills (l'elenco delle Skills viene iniettato nel prompt).
- Preferisci modelli più piccoli per lavori verbosi ed esplorativi.

Vedi [Skills](/it/tools/skills) per la formula esatta del sovraccarico dell'elenco delle Skills.
