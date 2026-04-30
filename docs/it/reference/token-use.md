---
read_when:
    - Spiegazione dell'utilizzo dei token, dei costi o delle finestre di contesto
    - Risoluzione dei problemi relativi alla crescita del contesto o al comportamento di Compaction
summary: Come OpenClaw costruisce il contesto del prompt e riporta l'utilizzo dei token + i costi
title: Uso dei token e costi
x-i18n:
    generated_at: "2026-04-30T09:12:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: a3807ccae3313a731c2673edace8a5b37dc22259d436a67b4d787e45682dad3c
    source_path: reference/token-use.md
    workflow: 16
---

# Uso dei token e costi

OpenClaw tiene traccia dei **token**, non dei caratteri. I token sono specifici del modello, ma la maggior parte dei modelli in stile OpenAI ha una media di circa 4 caratteri per token per il testo in inglese.

## Come viene creato il prompt di sistema

OpenClaw assembla il proprio prompt di sistema a ogni esecuzione. Include:

- Elenco degli strumenti + brevi descrizioni
- Elenco Skills (solo metadati; le istruzioni vengono caricate su richiesta con `read`).
  Il blocco compatto delle Skills è limitato da `skills.limits.maxSkillsPromptChars`,
  con override opzionale per agente in
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Istruzioni di auto-aggiornamento
- File di workspace + bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` quando nuovo, più `MEMORY.md` quando presente). La radice minuscola `memory.md` non viene iniettata; è input di riparazione legacy per `openclaw doctor --fix` quando abbinata a `MEMORY.md`. I file grandi vengono troncati da `agents.defaults.bootstrapMaxChars` (predefinito: 12000) e l'iniezione bootstrap totale è limitata da `agents.defaults.bootstrapTotalMaxChars` (predefinito: 60000). I file giornalieri `memory/*.md` non fanno parte del normale prompt bootstrap; restano disponibili su richiesta tramite gli strumenti di memoria nei turni ordinari, ma le esecuzioni del modello di reset/avvio possono anteporre un blocco di contesto di avvio una tantum con la memoria giornaliera recente per quel primo turno. I semplici comandi di chat `/new` e `/reset` vengono confermati senza invocare il modello. Il preambolo di avvio è controllato da `agents.defaults.startupContext`.
- Ora (UTC + fuso orario dell'utente)
- Tag di risposta + comportamento Heartbeat
- Metadati di runtime (host/OS/modello/thinking)

Vedi la scomposizione completa in [Prompt di sistema](/it/concepts/system-prompt).

## Cosa conta nella finestra di contesto

Tutto ciò che il modello riceve conta ai fini del limite di contesto:

- Prompt di sistema (tutte le sezioni elencate sopra)
- Cronologia della conversazione (messaggi dell'utente + dell'assistente)
- Chiamate agli strumenti e risultati degli strumenti
- Allegati/trascrizioni (immagini, audio, file)
- Riepiloghi di Compaction e artefatti di potatura
- Wrapper del provider o intestazioni di sicurezza (non visibili, ma comunque conteggiati)

Alcune superfici ad alto uso di runtime hanno limiti espliciti propri:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Gli override per agente si trovano sotto `agents.list[].contextLimits`. Queste manopole servono per estratti di runtime limitati e blocchi iniettati di proprietà del runtime. Sono separate dai limiti di bootstrap, dai limiti del contesto di avvio e dai limiti del prompt Skills.

Per le immagini, OpenClaw ridimensiona verso il basso i payload di immagini di trascrizione/strumenti prima delle chiamate al provider.
Usa `agents.defaults.imageMaxDimensionPx` (predefinito: `1200`) per regolarlo:

- Valori più bassi di solito riducono l'uso di token visivi e la dimensione del payload.
- Valori più alti preservano più dettagli visivi per screenshot ricchi di OCR/UI.

Per una scomposizione pratica (per file iniettato, strumenti, Skills e dimensione del prompt di sistema), usa `/context list` o `/context detail`. Vedi [Contesto](/it/concepts/context).

## Come vedere l'uso corrente dei token

Usa questi comandi in chat:

- `/status` → **scheda di stato ricca di emoji** con il modello della sessione, uso del contesto,
  token di input/output dell'ultima risposta e **costo stimato** (solo chiave API).
- `/usage off|tokens|full` → aggiunge un **footer di uso per risposta** a ogni risposta.
  - Persiste per sessione (memorizzato come `responseUsage`).
  - L'autenticazione OAuth **nasconde il costo** (solo token).
- `/usage cost` → mostra un riepilogo locale dei costi dai log di sessione di OpenClaw.

Altre superfici:

- **TUI/Web TUI:** `/status` + `/usage` sono supportati.
- **CLI:** `openclaw status --usage` e `openclaw channels list` mostrano
  finestre di quota provider normalizzate (`X% left`, non costi per risposta).
  Provider correnti con finestra di uso: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi e z.ai.

Le superfici di uso normalizzano gli alias comuni dei campi nativi del provider prima della visualizzazione.
Per il traffico Responses della famiglia OpenAI, questo include sia `input_tokens` /
`output_tokens` sia `prompt_tokens` / `completion_tokens`, quindi i nomi dei campi specifici del trasporto non cambiano `/status`, `/usage` o i riepiloghi di sessione.
Anche l'uso JSON di Gemini CLI viene normalizzato: il testo della risposta viene da `response` e
`stats.cached` viene mappato a `cacheRead`, con `stats.input_tokens - stats.cached`
usato quando la CLI omette un campo `stats.input` esplicito.
Per il traffico Responses nativo della famiglia OpenAI, gli alias di uso WebSocket/SSE vengono normalizzati allo stesso modo e i totali ripiegano su input + output normalizzati quando `total_tokens` manca o è `0`.
Quando lo snapshot della sessione corrente è scarno, `/status` e `session_status` possono anche recuperare i contatori di token/cache e l'etichetta del modello runtime attivo dal log di uso della trascrizione più recente. I valori live non zero esistenti continuano ad avere la precedenza sui valori di fallback della trascrizione, e i totali di trascrizione più grandi orientati al prompt possono prevalere quando i totali memorizzati mancano o sono inferiori.
L'autenticazione di uso per le finestre di quota provider proviene da hook specifici del provider quando disponibili; altrimenti OpenClaw ripiega su credenziali OAuth/chiave API corrispondenti da profili di autenticazione, env o configurazione.
Le voci della trascrizione dell'assistente persistono la stessa forma di uso normalizzata, incluso
`usage.cost` quando il modello attivo ha prezzi configurati e il provider restituisce metadati di uso. Questo offre a `/usage cost` e allo stato di sessione basato sulla trascrizione una fonte stabile anche dopo che lo stato runtime live non esiste più.

OpenClaw mantiene la contabilizzazione dell'uso del provider separata dallo snapshot di contesto corrente. `usage.total` del provider può includere input memorizzato in cache, output e più chiamate modello del ciclo degli strumenti, quindi è utile per costi e telemetria ma può sovrastimare la finestra di contesto live. Le visualizzazioni e diagnostiche del contesto usano lo snapshot del prompt più recente (`promptTokens`, o l'ultima chiamata modello quando non è disponibile alcuno snapshot del prompt) per `context.used`.

## Stima dei costi (quando mostrata)

I costi sono stimati dalla configurazione dei prezzi del modello:

```
models.providers.<provider>.models[].cost
```

Questi sono **USD per 1M token** per `input`, `output`, `cacheRead` e
`cacheWrite`. Se i prezzi mancano, OpenClaw mostra solo i token. I token OAuth non mostrano mai il costo in dollari.

L'avvio del Gateway esegue anche un bootstrap opzionale dei prezzi in background per i riferimenti modello configurati che non hanno già prezzi locali. Quel bootstrap recupera cataloghi di prezzi remoti di OpenRouter e LiteLLM. Imposta
`models.pricing.enabled: false` per saltare questi recuperi di cataloghi all'avvio su reti offline o limitate; le voci esplicite `models.providers.*.models[].cost` continuano a guidare le stime locali dei costi.

## TTL della cache e impatto della potatura

La cache del prompt del provider si applica solo entro la finestra TTL della cache. OpenClaw può eseguire opzionalmente la **potatura cache-ttl**: pota la sessione una volta scaduto il TTL della cache, poi reimposta la finestra della cache così le richieste successive possono riutilizzare il contesto appena memorizzato in cache invece di memorizzare di nuovo in cache tutta la cronologia. Questo mantiene più bassi i costi di scrittura cache quando una sessione resta inattiva oltre il TTL.

Configuralo in [Configurazione del Gateway](/it/gateway/configuration) e vedi i dettagli del comportamento in [Potatura della sessione](/it/concepts/session-pruning).

Heartbeat può mantenere la cache **calda** durante gli intervalli di inattività. Se il TTL della cache del modello è `1h`, impostare l'intervallo di Heartbeat appena sotto quel valore (ad esempio, `55m`) può evitare di memorizzare di nuovo in cache l'intero prompt, riducendo i costi di scrittura cache.

Nelle configurazioni multi-agente, puoi mantenere una configurazione modello condivisa e regolare il comportamento della cache per agente con `agents.list[].params.cacheRetention`.

Per una guida completa manopola per manopola, vedi [Cache del prompt](/it/reference/prompt-caching).

Per i prezzi dell'API Anthropic, le letture dalla cache sono significativamente più economiche dei token di input, mentre le scritture cache vengono fatturate con un moltiplicatore più alto. Vedi i prezzi della cache del prompt di Anthropic per le tariffe e i moltiplicatori TTL più recenti:
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

### Esempio: traffico misto con strategia cache per agente

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # default baseline for most agents
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # keep long cache warm for deep sessions
    - id: "alerts"
      params:
        cacheRetention: "none" # avoid cache writes for bursty notifications
```

`agents.list[].params` viene unito sopra i `params` del modello selezionato, quindi puoi sovrascrivere solo `cacheRetention` ed ereditare gli altri valori predefiniti del modello invariati.

### Esempio: abilitare l'intestazione beta del contesto Anthropic 1M

La finestra di contesto 1M di Anthropic è attualmente protetta da beta. OpenClaw può iniettare il valore `anthropic-beta` richiesto quando abiliti `context1m` sui modelli Opus o Sonnet supportati.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Questo viene mappato all'intestazione beta `context-1m-2025-08-07` di Anthropic.

Si applica solo quando `context1m: true` è impostato su quella voce di modello.

Requisito: la credenziale deve essere idonea all'uso del contesto lungo. In caso contrario,
Anthropic risponde con un errore di limite di frequenza lato provider per quella richiesta.

Se autentichi Anthropic con token OAuth/abbonamento (`sk-ant-oat-*`),
OpenClaw salta l'intestazione beta `context-1m-*` perché Anthropic attualmente
rifiuta quella combinazione con HTTP 401.

## Suggerimenti per ridurre la pressione sui token

- Usa `/compact` per riassumere sessioni lunghe.
- Riduci gli output grandi degli strumenti nei tuoi workflow.
- Abbassa `agents.defaults.imageMaxDimensionPx` per sessioni ricche di screenshot.
- Mantieni brevi le descrizioni delle Skills (l'elenco delle Skills viene iniettato nel prompt).
- Preferisci modelli più piccoli per lavoro prolisso ed esplorativo.

Vedi [Skills](/it/tools/skills) per la formula esatta dell'overhead dell'elenco delle Skills.

## Correlati

- [Uso dell'API e costi](/it/reference/api-usage-costs)
- [Cache del prompt](/it/reference/prompt-caching)
- [Tracciamento dell'uso](/it/concepts/usage-tracking)
