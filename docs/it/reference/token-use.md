---
read_when:
    - Spiegare l'uso dei token, i costi o le finestre di contesto
    - Debug del comportamento di crescita del contesto o di Compaction
summary: Come OpenClaw costruisce il contesto del prompt e riporta l'uso dei token + i costi
title: Utilizzo dei token e costi
x-i18n:
    generated_at: "2026-06-27T18:15:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0035ec9cf8d97aa6e78b9d95549cfb458af3bc2b5a4e2db83708281465c7e1af
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw tiene traccia dei **token**, non dei caratteri. I token sono specifici del modello, ma la maggior parte
dei modelli in stile OpenAI ha una media di circa 4 caratteri per token per il testo in inglese.

## Come viene costruito il prompt di sistema

OpenClaw assembla il proprio prompt di sistema a ogni esecuzione. Include:

- Elenco degli strumenti + brevi descrizioni
- Elenco degli Skills (solo metadati; le istruzioni vengono caricate su richiesta con `read`).
  I turni Codex nativi ricevono il blocco compatto degli Skills come istruzioni sviluppatore
  di collaborazione con ambito di turno; altri harness lo ricevono nella normale
  superficie del prompt. È limitato da `skills.limits.maxSkillsPromptChars`, con
  override opzionale per agente in `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Istruzioni di auto-aggiornamento
- Workspace + file di bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` quando nuovo, più `MEMORY.md` quando presente). I turni Codex nativi non incollano il `MEMORY.md` grezzo dal workspace dell'agente configurato quando gli strumenti di memoria sono disponibili per quel workspace; includono un piccolo puntatore alla memoria nelle istruzioni sviluppatore di collaborazione con ambito di turno e usano gli strumenti di memoria su richiesta. Se gli strumenti sono disabilitati, la ricerca in memoria non è disponibile, o il workspace attivo differisce dal workspace di memoria dell'agente, `MEMORY.md` usa il normale percorso di contesto del turno limitato. La radice minuscola `memory.md` non viene iniettata; è input di riparazione legacy per `openclaw doctor --fix` quando abbinato a `MEMORY.md`. I file iniettati di grandi dimensioni vengono troncati da `agents.defaults.bootstrapMaxChars` (predefinito: 20000), e l'iniezione bootstrap totale è limitata da `agents.defaults.bootstrapTotalMaxChars` (predefinito: 60000). I file giornalieri `memory/*.md` non fanno parte del normale prompt di bootstrap; restano disponibili su richiesta tramite strumenti di memoria nei turni ordinari, ma le esecuzioni del modello di reset/avvio possono anteporre un blocco una tantum di contesto di avvio con la memoria giornaliera recente per quel primo turno. I comandi chat semplici `/new` e `/reset` vengono confermati senza invocare il modello. Il preludio di avvio è controllato da `agents.defaults.startupContext`. Gli estratti AGENTS.md post-Compaction sono separati e richiedono l'opt-in esplicito `agents.defaults.compaction.postCompactionSections`.
- Ora (UTC + fuso orario dell'utente)
- Tag di risposta + comportamento Heartbeat
- Metadati runtime (host/OS/model/thinking)

Vedi la scomposizione completa in [Prompt di sistema](/it/concepts/system-prompt).

Quando documenti credenziali o frammenti di autenticazione, usa le
[Convenzioni per i segnaposto dei segreti](/it/reference/secret-placeholder-conventions) per
evitare falsi positivi degli scanner di segreti nelle modifiche solo documentali.

## Cosa conta nella finestra di contesto

Tutto ciò che il modello riceve conta verso il limite di contesto:

- Prompt di sistema (tutte le sezioni elencate sopra)
- Cronologia della conversazione (messaggi utente + assistente)
- Chiamate agli strumenti e risultati degli strumenti
- Allegati/trascrizioni (immagini, audio, file)
- Riepiloghi di Compaction e artefatti di potatura
- Wrapper del provider o intestazioni di sicurezza (non visibili, ma comunque conteggiati)

Alcune superfici con runtime pesante hanno limiti espliciti propri:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Gli override per agente si trovano sotto `agents.list[].contextLimits`. Queste manopole sono
per estratti runtime limitati e blocchi iniettati di proprietà del runtime. Sono
separate dai limiti di bootstrap, dai limiti di contesto di avvio e dai limiti
del prompt degli Skills.

`toolResultMaxChars` è un tetto avanzato (fino a `1000000` caratteri). Quando non è impostato, OpenClaw sceglie
il limite live dei risultati degli strumenti dalla finestra di contesto effettiva del modello: `16000` caratteri
sotto 100K token, `32000` caratteri a 100K+ token, e `64000` caratteri a 200K+
token, restando comunque limitato dalla protezione di quota del contesto runtime.

Per le immagini, OpenClaw ridimensiona verso il basso i payload immagine di trascrizioni/strumenti prima delle chiamate al provider.
Usa `agents.defaults.imageMaxDimensionPx` (predefinito: `1200`) per regolarlo:

- Valori più bassi di solito riducono l'uso di token visivi e la dimensione del payload.
- Valori più alti preservano più dettagli visivi per screenshot ricchi di OCR/UI.

Per una scomposizione pratica (per file iniettato, strumenti, Skills e dimensione del prompt di sistema), usa `/context list` o `/context detail`. Vedi [Contesto](/it/concepts/context).

## Come vedere l'uso corrente dei token

Usa questi comandi in chat:

- `/status` → **scheda di stato ricca di emoji** con il modello della sessione, uso del contesto,
  token di input/output dell'ultima risposta e **costo stimato** quando il prezzo locale è
  configurato per il modello attivo.
- `/usage off|tokens|full` → aggiunge un **piè di pagina di uso per risposta** a ogni risposta.
  - Persiste per sessione (memorizzato come `responseUsage`).
  - `/usage reset` (alias: `inherit`, `clear`, `default`) — cancella l'override della sessione
    così la sessione eredita di nuovo il valore predefinito configurato.
  - `/usage full` mostra il costo stimato solo quando OpenClaw dispone di metadati di utilizzo e
    prezzi locali per il modello attivo. Altrimenti mostra solo i token.
- `/usage cost` → mostra un riepilogo dei costi locali dai log di sessione OpenClaw.

Altre superfici:

- **TUI/Web TUI:** `/status` + `/usage` sono supportati.
- **CLI:** `openclaw status --usage` e `openclaw channels list` mostrano
  finestre di quota provider normalizzate (`X% left`, non costi per risposta).
  Provider correnti con finestra di utilizzo: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi e z.ai.

Le superfici di utilizzo normalizzano gli alias comuni dei campi nativi del provider prima della visualizzazione.
Per il traffico Responses della famiglia OpenAI, questo include sia `input_tokens` /
`output_tokens` sia `prompt_tokens` / `completion_tokens`, quindi i nomi dei campi
specifici del trasporto non modificano `/status`, `/usage` o i riepiloghi di sessione.
Anche l'utilizzo Gemini CLI viene normalizzato: il parser predefinito `stream-json` legge
gli eventi `message` dell'assistente, e `stats.cached` viene mappato a `cacheRead` con
`stats.input_tokens - stats.cached` usato quando la CLI omette un campo
`stats.input` esplicito. Gli override JSON legacy leggono ancora il testo della risposta da
`response`.
Per il traffico Responses nativo della famiglia OpenAI, gli alias di utilizzo WebSocket/SSE sono
normalizzati allo stesso modo, e i totali ripiegano su input + output normalizzati quando
`total_tokens` manca o è `0`.
Quando lo snapshot della sessione corrente è scarso, `/status` e `session_status` possono
anche recuperare i contatori token/cache e l'etichetta del modello runtime attivo dal
log di utilizzo trascrizione più recente. I valori live esistenti diversi da zero hanno ancora
precedenza sui valori di fallback della trascrizione, e totali di trascrizione più grandi orientati al prompt
possono prevalere quando i totali memorizzati mancano o sono più piccoli.
L'autenticazione di utilizzo per le finestre di quota del provider proviene da hook specifici del provider quando
disponibili; altrimenti OpenClaw ripiega sull'abbinamento di credenziali OAuth/API-key
da profili di autenticazione, env o configurazione.
Le voci della trascrizione dell'assistente persistono la stessa forma di utilizzo normalizzata, incluso
`usage.cost` quando il modello attivo ha prezzi configurati e il provider
restituisce metadati di utilizzo. Questo fornisce a `/usage cost` e allo stato di sessione basato su trascrizione
una fonte stabile anche dopo che lo stato runtime live è scomparso.

OpenClaw mantiene la contabilità di utilizzo del provider separata dallo snapshot di contesto
corrente. `usage.total` del provider può includere input in cache, output e più
chiamate modello del loop strumenti, quindi è utile per costi e telemetria ma può sovrastimare
la finestra di contesto live. Le visualizzazioni e diagnostiche di contesto usano l'ultimo snapshot del prompt
(`promptTokens`, o l'ultima chiamata modello quando non è disponibile uno snapshot del prompt)
per `context.used`.

## Stima dei costi (quando mostrata)

I costi sono stimati dalla configurazione dei prezzi del modello:

```
models.providers.<provider>.models[].cost
```

Questi sono **USD per 1M token** per `input`, `output`, `cacheRead` e
`cacheWrite`. Se i prezzi mancano, OpenClaw mostra solo i token. La visualizzazione dei costi
non è limitata all'autenticazione con API-key: provider non API-key come `aws-sdk` possono mostrare
costi stimati quando la loro voce modello configurata include prezzi locali e il
provider restituisce metadati di utilizzo.

Dopo che sidecar e canali raggiungono il percorso Gateway ready, OpenClaw avvia un
bootstrap opzionale dei prezzi in background per i riferimenti modello configurati che non
hanno già prezzi locali. Quel bootstrap recupera cataloghi remoti dei prezzi OpenRouter e LiteLLM.
Imposta `models.pricing.enabled: false` per saltare quei recuperi di cataloghi
su reti offline o limitate; le voci esplicite
`models.providers.*.models[].cost` continuano a guidare le stime dei costi locali.

## TTL della cache e impatto della potatura

La cache del prompt del provider si applica solo entro la finestra TTL della cache. OpenClaw può
eseguire opzionalmente la **potatura cache-ttl**: pota la sessione una volta scaduto il TTL della cache,
poi reimposta la finestra della cache così le richieste successive possono riutilizzare il
contesto appena memorizzato in cache invece di rimettere in cache l'intera cronologia. Questo mantiene
più bassi i costi di scrittura cache quando una sessione resta inattiva oltre il TTL.

Configuralo in [Configurazione Gateway](/it/gateway/configuration) e vedi i
dettagli del comportamento in [Potatura della sessione](/it/concepts/session-pruning).

Heartbeat può mantenere la cache **calda** attraverso pause di inattività. Se il TTL della cache del tuo modello
è `1h`, impostare l'intervallo Heartbeat appena sotto quel valore (ad esempio, `55m`) può evitare
di rimettere in cache l'intero prompt, riducendo i costi di scrittura cache.

Nelle configurazioni multi-agente, puoi mantenere una configurazione modello condivisa e regolare il comportamento della cache
per agente con `agents.list[].params.cacheRetention`.

Per una guida completa opzione per opzione, vedi [Caching dei prompt](/it/reference/prompt-caching).

Per i prezzi dell'API Anthropic, le letture cache sono significativamente più economiche dei token
di input, mentre le scritture cache sono addebitate con un moltiplicatore più alto. Vedi i prezzi del prompt caching di Anthropic per le tariffe e i moltiplicatori TTL più recenti:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Esempio: mantenere calda la cache da 1h con Heartbeat

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

`agents.list[].params` si unisce sopra i `params` del modello selezionato, quindi puoi
sovrascrivere solo `cacheRetention` ed ereditare gli altri valori predefiniti del modello senza modifiche.

### Contesto Anthropic 1M

OpenClaw dimensiona i modelli Claude 4.x compatibili GA come Opus 4.8, Opus 4.7, Opus 4.6 e
Sonnet 4.6 con la finestra di contesto 1M di Anthropic. Non hai bisogno di
`params.context1m: true` per quei modelli.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Le configurazioni più vecchie possono mantenere `context1m: true`, ma OpenClaw non invia più
l'intestazione beta Anthropic ritirata `context-1m-2025-08-07` per questa impostazione e
non espande i modelli Claude più vecchi non supportati a 1M.

Requisito: la credenziale deve essere idonea all'uso di contesto lungo. In caso contrario,
Anthropic risponde con un errore di limite di frequenza lato provider per quella richiesta.

Se autentichi Anthropic con token OAuth/abbonamento (`sk-ant-oat-*`),
OpenClaw preserva le intestazioni beta Anthropic richieste da OAuth mentre rimuove la
beta ritirata `context-1m-*` se rimane in una configurazione più vecchia.

## Suggerimenti per ridurre la pressione sui token

- Usa `/compact` per riassumere sessioni lunghe.
- Riduci gli output grandi degli strumenti nei tuoi workflow.
- Abbassa `agents.defaults.imageMaxDimensionPx` per sessioni con molti screenshot.
- Mantieni brevi le descrizioni degli Skills (l'elenco degli Skills viene iniettato nel prompt).
- Preferisci modelli più piccoli per lavoro verboso ed esplorativo.

Vedi [Skills](/it/tools/skills) per la formula esatta dell'overhead dell'elenco degli Skills.

## Correlati

- [Utilizzo e costi delle API](/it/reference/api-usage-costs)
- [Caching dei prompt](/it/reference/prompt-caching)
- [Tracciamento dell'utilizzo](/it/concepts/usage-tracking)
