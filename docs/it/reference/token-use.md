---
read_when:
    - Spiegazione dell'utilizzo dei token, dei costi o delle finestre di contesto
    - Debug del growth del contesto o del comportamento di Compaction
summary: Come OpenClaw costruisce il contesto del prompt e riporta utilizzo di token + costi
title: Uso dei token e costi
x-i18n:
    generated_at: "2026-04-21T08:29:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: d26db37353941e247eb26f84bfa105896318b3239b2975d6e033c6e9ceda6b0d
    source_path: reference/token-use.md
    workflow: 15
---

# Uso dei token e costi

OpenClaw tiene traccia dei **token**, non dei caratteri. I token dipendono dal modello, ma la maggior parte
dei modelli in stile OpenAI ha una media di ~4 caratteri per token per il testo inglese.

## Come viene costruito il prompt di sistema

OpenClaw assembla il proprio prompt di sistema a ogni esecuzione. Include:

- Elenco dei tool + brevi descrizioni
- Elenco delle Skills (solo metadati; le istruzioni vengono caricate on demand con `read`).
  Il blocco compatto delle Skills è limitato da `skills.limits.maxSkillsPromptChars`,
  con override facoltativo per agente in
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Istruzioni di auto-aggiornamento
- Workspace + file bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` quando nuovo, più `MEMORY.md` quando presente oppure `memory.md` come fallback minuscolo). I file grandi vengono troncati da `agents.defaults.bootstrapMaxChars` (predefinito: 12000), e l'iniezione bootstrap totale è limitata da `agents.defaults.bootstrapTotalMaxChars` (predefinito: 60000). I file giornalieri `memory/*.md` non fanno parte del normale prompt bootstrap; restano on demand tramite i tool di memoria nei turni ordinari, ma `/new` e `/reset` senza argomenti possono anteporre un blocco one-shot di contesto di avvio con la memoria giornaliera recente per quel primo turno. Quel preambolo di avvio è controllato da `agents.defaults.startupContext`.
- Ora (UTC + fuso orario utente)
- Tag di risposta + comportamento Heartbeat
- Metadati di runtime (host/OS/modello/thinking)

Vedi il dettaglio completo in [Prompt di sistema](/it/concepts/system-prompt).

## Cosa conta nella finestra di contesto

Tutto ciò che il modello riceve conta verso il limite di contesto:

- Prompt di sistema (tutte le sezioni elencate sopra)
- Cronologia della conversazione (messaggi utente + assistente)
- Chiamate ai tool e risultati dei tool
- Allegati/trascrizioni (immagini, audio, file)
- Riepiloghi di Compaction e artefatti di pruning
- Wrapper del provider o header di sicurezza (non visibili, ma comunque conteggiati)

Alcune superfici pesanti di runtime hanno i propri limiti espliciti:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Gli override per agente sono in `agents.list[].contextLimits`. Queste impostazioni
servono per estratti limitati di runtime e blocchi iniettati posseduti dal runtime. Sono
separate dai limiti bootstrap, dai limiti del contesto di avvio e dai limiti
del prompt delle Skills.

Per le immagini, OpenClaw ridimensiona i payload immagine di trascrizioni/tool prima delle chiamate al provider.
Usa `agents.defaults.imageMaxDimensionPx` (predefinito: `1200`) per regolarlo:

- Valori più bassi di solito riducono l'uso di vision-token e la dimensione del payload.
- Valori più alti preservano più dettaglio visivo per screenshot con OCR/UI pesante.

Per una scomposizione pratica (per ogni file iniettato, tool, Skills e dimensione del prompt di sistema), usa `/context list` o `/context detail`. Vedi [Contesto](/it/concepts/context).

## Come vedere l'uso attuale dei token

Usa questi nella chat:

- `/status` → **scheda di stato ricca di emoji** con il modello della sessione, uso del contesto,
  token input/output dell'ultima risposta e **costo stimato** (solo chiave API).
- `/usage off|tokens|full` → aggiunge un **footer di utilizzo per risposta** a ogni reply.
  - Persiste per sessione (memorizzato come `responseUsage`).
  - L'auth OAuth **nasconde il costo** (solo token).
- `/usage cost` → mostra un riepilogo locale dei costi dai log di sessione OpenClaw.

Altre superfici:

- **TUI/Web TUI:** `/status` e `/usage` sono supportati.
- **CLI:** `openclaw status --usage` e `openclaw channels list` mostrano
  finestre quota provider normalizzate (`X% left`, non costi per risposta).
  Provider attuali con finestra di utilizzo: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi e z.ai.

Le superfici di utilizzo normalizzano gli alias comuni dei campi nativi provider prima della visualizzazione.
Per il traffico OpenAI-family Responses, questo include sia `input_tokens` /
`output_tokens` sia `prompt_tokens` / `completion_tokens`, quindi i nomi dei campi specifici del trasporto
non cambiano `/status`, `/usage` o i riepiloghi di sessione.
Anche l'uso JSON di Gemini CLI viene normalizzato: il testo della risposta viene da `response`, e
`stats.cached` viene mappato a `cacheRead` con `stats.input_tokens - stats.cached`
usato quando la CLI omette un campo esplicito `stats.input`.
Per il traffico nativo OpenAI-family Responses, gli alias di utilizzo WebSocket/SSE sono
normalizzati allo stesso modo, e i totali usano come fallback input + output normalizzati quando
`total_tokens` manca o vale `0`.
Quando lo snapshot della sessione corrente è scarno, `/status` e `session_status` possono
anche recuperare contatori token/cache e l'etichetta del modello runtime attivo dal log di utilizzo
della trascrizione più recente. I valori live esistenti e non zero mantengono comunque la precedenza
sui valori recuperati dalla trascrizione, e i totali di trascrizione orientati al prompt più grandi
possono prevalere quando i totali memorizzati mancano o sono inferiori.
L'auth dell'utilizzo per le finestre quota provider proviene da hook specifici del provider quando
disponibili; altrimenti OpenClaw usa come fallback credenziali OAuth/API-key corrispondenti
da profili auth, env o config.
Le voci di trascrizione dell'assistente persistono la stessa shape di utilizzo normalizzata, inclusa
`usage.cost` quando il modello attivo ha pricing configurato e il provider restituisce metadati di utilizzo. Questo fornisce a `/usage cost` e allo stato di sessione supportato da trascrizione una sorgente stabile anche dopo che lo stato runtime live non esiste più.

## Stima dei costi (quando mostrata)

I costi sono stimati dalla tua configurazione di pricing del modello:

```
models.providers.<provider>.models[].cost
```

Questi sono **USD per 1M token** per `input`, `output`, `cacheRead` e
`cacheWrite`. Se il pricing manca, OpenClaw mostra solo i token. I token OAuth
non mostrano mai il costo in dollari.

## Impatto di cache TTL e pruning

La cache del prompt del provider si applica solo entro la finestra TTL della cache. OpenClaw può
facoltativamente eseguire **cache-ttl pruning**: effettua il pruning della sessione quando il TTL della cache
è scaduto, poi resetta la finestra della cache così le richieste successive possono riusare il
contesto appena messo in cache invece di ricachare l'intera cronologia. Questo mantiene
più bassi i costi di scrittura in cache quando una sessione resta inattiva oltre il TTL.

Configurala in [Configurazione del Gateway](/it/gateway/configuration) e vedi i
dettagli del comportamento in [Pruning della sessione](/it/concepts/session-pruning).

Heartbeat può mantenere la cache **calda** durante i periodi di inattività. Se il TTL della cache del tuo modello
è `1h`, impostare l'intervallo Heartbeat appena sotto quel valore (ad es. `55m`) può evitare di
ricachare l'intero prompt, riducendo i costi di scrittura in cache.

In setup multi-agent, puoi mantenere una config modello condivisa e regolare il comportamento della cache
per agente con `agents.list[].params.cacheRetention`.

Per una guida completa manopola per manopola, vedi [Caching del prompt](/it/reference/prompt-caching).

Per il pricing delle API Anthropic, le letture dalla cache sono significativamente più economiche dei token
input, mentre le scritture in cache vengono fatturate con un moltiplicatore più alto. Vedi il pricing
del prompt caching di Anthropic per gli ultimi tassi e moltiplicatori TTL:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Esempio: mantenere calda una cache di 1h con Heartbeat

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
        every: "55m" # mantiene calda la cache lunga per sessioni profonde
    - id: "alerts"
      params:
        cacheRetention: "none" # evita scritture in cache per notifiche bursty
```

`agents.list[].params` viene unito sopra `params` del modello selezionato, quindi puoi
sovrascrivere solo `cacheRetention` ed ereditare invariati gli altri valori predefiniti del modello.

### Esempio: abilitare l'header beta Anthropic da 1M di contesto

La finestra di contesto da 1M di Anthropic è attualmente protetta da beta. OpenClaw può iniettare il
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

Questo viene mappato all'header beta `context-1m-2025-08-07` di Anthropic.

Si applica solo quando `context1m: true` è impostato su quella voce modello.

Requisito: la credenziale deve essere idonea all'uso del contesto lungo. In caso contrario,
Anthropic risponde con un errore di rate limit lato provider per quella richiesta.

Se autentichi Anthropic con token OAuth/subscription (`sk-ant-oat-*`),
OpenClaw salta l'header beta `context-1m-*` perché Anthropic attualmente
rifiuta quella combinazione con HTTP 401.

## Suggerimenti per ridurre la pressione dei token

- Usa `/compact` per riassumere sessioni lunghe.
- Riduci gli output di tool grandi nei tuoi workflow.
- Abbassa `agents.defaults.imageMaxDimensionPx` per sessioni con molti screenshot.
- Mantieni brevi le descrizioni delle skill (l'elenco delle Skills viene iniettato nel prompt).
- Preferisci modelli più piccoli per lavoro verboso ed esplorativo.

Vedi [Skills](/it/tools/skills) per la formula esatta dell'overhead dell'elenco delle Skills.
