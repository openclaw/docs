---
read_when:
    - Spiegazione dell'utilizzo dei token, dei costi o delle finestre di contesto
    - Debug del comportamento di crescita del contesto o della Compaction
summary: Come OpenClaw costruisce il contesto del prompt e riporta l'utilizzo dei token + i costi
title: Utilizzo dei token e costi
x-i18n:
    generated_at: "2026-04-15T19:42:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a706d3df8b2ea1136b3535d216c6b358e43aee2a31a4759824385e1345e6fe5
    source_path: reference/token-use.md
    workflow: 15
---

# Utilizzo dei token e costi

OpenClaw tiene traccia dei **token**, non dei caratteri. I token sono specifici del modello, ma la maggior parte
dei modelli in stile OpenAI ha una media di ~4 caratteri per token per il testo in inglese.

## Come viene costruito il prompt di sistema

OpenClaw assembla il proprio prompt di sistema a ogni esecuzione. Include:

- Elenco degli strumenti + brevi descrizioni
- Elenco delle Skills (solo metadati; le istruzioni vengono caricate su richiesta con `read`).
  Il blocco compatto delle Skills è limitato da `skills.limits.maxSkillsPromptChars`,
  con override facoltativo per agente in
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Istruzioni di auto-aggiornamento
- Workspace + file bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` quando nuovo, più `MEMORY.md` quando presente o `memory.md` come fallback in minuscolo). I file di grandi dimensioni vengono troncati da `agents.defaults.bootstrapMaxChars` (predefinito: 12000), e l'iniezione bootstrap totale è limitata da `agents.defaults.bootstrapTotalMaxChars` (predefinito: 60000). I file giornalieri `memory/*.md` non fanno parte del normale prompt bootstrap; restano disponibili su richiesta tramite gli strumenti di memoria nei turni ordinari, ma `/new` e `/reset` senza argomenti possono anteporre un blocco di contesto di avvio monouso con la memoria giornaliera recente per quel primo turno. Questo preambolo di avvio è controllato da `agents.defaults.startupContext`.
- Ora (UTC + fuso orario dell'utente)
- Tag di risposta + comportamento Heartbeat
- Metadati di runtime (host/OS/modello/thinking)

Vedi la scomposizione completa in [Prompt di sistema](/it/concepts/system-prompt).

## Cosa conta nella finestra di contesto

Tutto ciò che il modello riceve conta ai fini del limite di contesto:

- Prompt di sistema (tutte le sezioni elencate sopra)
- Cronologia della conversazione (messaggi utente + assistente)
- Chiamate agli strumenti e risultati degli strumenti
- Allegati/trascrizioni (immagini, audio, file)
- Riepiloghi di Compaction e artefatti di potatura
- Wrapper del provider o intestazioni di sicurezza (non visibili, ma comunque conteggiati)

Alcune superfici di runtime più pesanti hanno i propri limiti espliciti:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Gli override per agente si trovano in `agents.list[].contextLimits`. Queste impostazioni
servono per estratti di runtime delimitati e blocchi iniettati di proprietà del runtime. Sono
separate dai limiti bootstrap, dai limiti del contesto di avvio e dai limiti del
prompt delle Skills.

Per le immagini, OpenClaw ridimensiona i payload di immagini di trascrizioni/strumenti prima delle chiamate al provider.
Usa `agents.defaults.imageMaxDimensionPx` (predefinito: `1200`) per regolare questo comportamento:

- Valori più bassi di solito riducono l'uso dei token di visione e la dimensione del payload.
- Valori più alti preservano più dettaglio visivo per screenshot pesanti di OCR/UI.

Per una scomposizione pratica (per ogni file iniettato, strumenti, Skills e dimensione del prompt di sistema), usa `/context list` o `/context detail`. Vedi [Contesto](/it/concepts/context).

## Come vedere l'utilizzo attuale dei token

Usa questi comandi in chat:

- `/status` → **scheda di stato ricca di emoji** con il modello della sessione, l'utilizzo del contesto,
  i token di input/output dell'ultima risposta e il **costo stimato** (solo chiave API).
- `/usage off|tokens|full` → aggiunge un **footer di utilizzo per risposta** a ogni risposta.
  - Persiste per sessione (memorizzato come `responseUsage`).
  - L'autenticazione OAuth **nasconde il costo** (solo token).
- `/usage cost` → mostra un riepilogo locale dei costi dai log di sessione di OpenClaw.

Altre superfici:

- **TUI/Web TUI:** `/status` + `/usage` sono supportati.
- **CLI:** `openclaw status --usage` e `openclaw channels list` mostrano
  finestre di quota del provider normalizzate (`X% left`, non costi per risposta).
  Provider attuali con finestra di utilizzo: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi e z.ai.

Le superfici di utilizzo normalizzano gli alias comuni dei campi nativi del provider prima della visualizzazione.
Per il traffico OpenAI-family Responses, questo include sia `input_tokens` /
`output_tokens` sia `prompt_tokens` / `completion_tokens`, in modo che i nomi dei campi specifici del trasporto
non cambino `/status`, `/usage` o i riepiloghi di sessione.
Anche l'utilizzo JSON di Gemini CLI viene normalizzato: il testo della risposta proviene da `response`, e
`stats.cached` viene mappato a `cacheRead` con `stats.input_tokens - stats.cached`
usato quando la CLI omette un campo `stats.input` esplicito.
Per il traffico nativo OpenAI-family Responses, gli alias di utilizzo WebSocket/SSE sono
normalizzati allo stesso modo, e i totali ripiegano su input + output normalizzati quando
`total_tokens` è assente o vale `0`.
Quando lo snapshot della sessione corrente è scarno, `/status` e `session_status` possono
anche recuperare i contatori di token/cache e l'etichetta del modello di runtime attivo dal
log di utilizzo della trascrizione più recente. I valori live esistenti diversi da zero hanno comunque la precedenza sui valori di fallback della trascrizione, e i totali della trascrizione più grandi orientati al prompt
possono prevalere quando i totali memorizzati sono assenti o più piccoli.
L'autorizzazione di utilizzo per le finestre di quota del provider proviene da hook specifici del provider quando disponibili;
in caso contrario, OpenClaw usa come fallback la corrispondenza con credenziali OAuth/chiave API
da profili auth, env o config.

## Stima dei costi (quando mostrata)

I costi vengono stimati dalla configurazione dei prezzi del tuo modello:

```
models.providers.<provider>.models[].cost
```

Questi sono **USD per 1M token** per `input`, `output`, `cacheRead` e
`cacheWrite`. Se il prezzo manca, OpenClaw mostra solo i token. I token OAuth
non mostrano mai il costo in dollari.

## Impatto di TTL della cache e potatura

Il caching del prompt del provider si applica solo entro la finestra TTL della cache. OpenClaw può
facoltativamente eseguire la **potatura cache-ttl**: pota la sessione una volta scaduto il TTL della cache,
poi reimposta la finestra della cache in modo che le richieste successive possano riutilizzare il
contesto appena messo in cache invece di rimettere in cache l'intera cronologia. Questo mantiene i costi
di scrittura della cache più bassi quando una sessione resta inattiva oltre il TTL.

Configuralo in [Configurazione del Gateway](/it/gateway/configuration) e vedi i
dettagli del comportamento in [Potatura della sessione](/it/concepts/session-pruning).

Heartbeat può mantenere la cache **calda** durante gli intervalli di inattività. Se il TTL della cache del tuo modello
è `1h`, impostare l'intervallo Heartbeat appena sotto quel valore (ad esempio `55m`) può evitare
di rimettere in cache l'intero prompt, riducendo i costi di scrittura della cache.

Nelle configurazioni multi-agente, puoi mantenere una configurazione modello condivisa e regolare il comportamento della cache
per agente con `agents.list[].params.cacheRetention`.

Per una guida completa impostazione per impostazione, vedi [Caching del prompt](/it/reference/prompt-caching).

Per i prezzi dell'API Anthropic, le letture della cache sono significativamente più economiche dei
token di input, mentre le scritture della cache vengono fatturate con un moltiplicatore più alto. Vedi i prezzi del prompt caching di Anthropic per le tariffe e i moltiplicatori TTL più recenti:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Esempio: mantenere calda la cache di 1h con Heartbeat

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
        cacheRetention: "none" # evita scritture in cache per notifiche a raffica
```

`agents.list[].params` viene unito sopra `params` del modello selezionato, quindi puoi
sovrascrivere solo `cacheRetention` ed ereditare invariati gli altri valori predefiniti del modello.

### Esempio: abilitare l'intestazione beta Anthropic 1M context

La finestra di contesto 1M di Anthropic è attualmente soggetta a beta gate. OpenClaw può iniettare il
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

Questo viene mappato all'intestazione beta `context-1m-2025-08-07` di Anthropic.

Questo si applica solo quando `context1m: true` è impostato in quella voce del modello.

Requisito: la credenziale deve essere idonea all'uso del contesto esteso. In caso contrario,
Anthropic risponde con un errore di limitazione della velocità lato provider per quella richiesta.

Se autentichi Anthropic con token OAuth/sottoscrizione (`sk-ant-oat-*`),
OpenClaw salta l'intestazione beta `context-1m-*` perché Anthropic attualmente
rifiuta questa combinazione con HTTP 401.

## Suggerimenti per ridurre la pressione dei token

- Usa `/compact` per riassumere sessioni lunghe.
- Riduci gli output degli strumenti di grandi dimensioni nei tuoi flussi di lavoro.
- Riduci `agents.defaults.imageMaxDimensionPx` per sessioni ricche di screenshot.
- Mantieni brevi le descrizioni delle Skills (l'elenco delle Skills viene iniettato nel prompt).
- Preferisci modelli più piccoli per lavori verbosi ed esplorativi.

Vedi [Skills](/it/tools/skills) per la formula esatta del sovraccarico dell'elenco delle Skills.
