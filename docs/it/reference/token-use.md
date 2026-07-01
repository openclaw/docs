---
read_when:
    - Spiegazione dell’uso dei token, dei costi o delle finestre di contesto
    - Debug del comportamento di crescita del contesto o di Compaction
summary: Come OpenClaw crea il contesto del prompt e segnala l'uso dei token e i costi
title: Utilizzo dei token e costi
x-i18n:
    generated_at: "2026-07-01T18:13:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99e3de70aeb447bb58ae414c2c5908945e8173b9b8f2bf7e4c2eb9781657c44c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw traccia i **token**, non i caratteri. I token sono specifici del modello, ma la maggior parte dei
modelli in stile OpenAI ha una media di circa 4 caratteri per token per il testo in inglese.

## Come viene costruito il prompt di sistema

OpenClaw assembla il proprio prompt di sistema a ogni esecuzione. Include:

- Elenco degli strumenti + brevi descrizioni
- Elenco delle Skills (solo metadati; le istruzioni vengono caricate su richiesta con `read`).
  I turni nativi di Codex ricevono il blocco compatto delle Skills come istruzioni
  di collaborazione per sviluppatori limitate al turno; gli altri harness lo ricevono nella normale
  superficie del prompt. È limitato da `skills.limits.maxSkillsPromptChars`, con
  override facoltativo per agente in `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Istruzioni di autoaggiornamento
- Workspace + file di bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` quando nuovo, più `MEMORY.md` quando presente). I turni nativi di Codex non incollano il `MEMORY.md` grezzo dal workspace dell'agente configurato quando gli strumenti di memoria sono disponibili per quel workspace; includono un piccolo puntatore alla memoria nelle istruzioni di collaborazione per sviluppatori limitate al turno e usano gli strumenti di memoria su richiesta. Se gli strumenti sono disabilitati, la ricerca in memoria non è disponibile, o il workspace attivo differisce dal workspace di memoria dell'agente, `MEMORY.md` usa il normale percorso limitato del contesto di turno. La radice minuscola `memory.md` non viene iniettata; è input di riparazione legacy per `openclaw doctor --fix` quando abbinato a `MEMORY.md`. I file iniettati di grandi dimensioni sono troncati da `agents.defaults.bootstrapMaxChars` (predefinito: 20000), e l'iniezione bootstrap totale è limitata da `agents.defaults.bootstrapTotalMaxChars` (predefinito: 60000). I file giornalieri `memory/*.md` non fanno parte del normale prompt di bootstrap; restano disponibili su richiesta tramite gli strumenti di memoria nei turni ordinari, ma le esecuzioni del modello di reset/avvio possono anteporre un blocco una tantum di contesto di avvio con la memoria giornaliera recente per quel primo turno. I comandi chat semplici `/new` e `/reset` vengono riconosciuti senza invocare il modello. Il preludio di avvio è controllato da `agents.defaults.startupContext`. Gli estratti di AGENTS.md post-Compaction sono separati e richiedono l'opt-in esplicito di `agents.defaults.compaction.postCompactionSections`.
- Ora (UTC + fuso orario dell'utente)
- Tag di risposta + comportamento Heartbeat
- Metadati di runtime (host/OS/model/thinking)

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

Alcune superfici pesanti a runtime hanno i propri limiti espliciti:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Gli override per agente si trovano sotto `agents.list[].contextLimits`. Questi controlli sono
per estratti di runtime limitati e blocchi iniettati di proprietà del runtime. Sono
separati dai limiti di bootstrap, dai limiti del contesto di avvio e dai limiti del prompt
delle Skills.

`toolResultMaxChars` è un limite avanzato (fino a `1000000` caratteri). Quando non è impostato, OpenClaw sceglie
il limite live dei risultati degli strumenti dalla finestra di contesto effettiva del modello: `16000` caratteri
sotto 100K token, `32000` caratteri a 100K+ token e `64000` caratteri a 200K+
token, comunque limitati dalla protezione di quota del contesto di runtime.

Per le immagini, OpenClaw ridimensiona verso il basso i payload immagine di trascrizione/strumento prima delle chiamate al provider.
Usa `agents.defaults.imageMaxDimensionPx` (predefinito: `1200`) per regolarlo:

- Valori più bassi di solito riducono l'uso di token visivi e la dimensione del payload.
- Valori più alti preservano più dettagli visivi per screenshot ricchi di OCR/UI.

Per una scomposizione pratica (per file iniettato, strumenti, Skills e dimensione del prompt di sistema), usa `/context list` o `/context detail`. Vedi [Contesto](/it/concepts/context).

## Come vedere l'uso corrente dei token

Usa questi in chat:

- `/status` → **scheda di stato ricca di emoji** con il modello della sessione, l'uso del contesto,
  i token di input/output dell'ultima risposta e il **costo stimato** quando il prezzo locale è
  configurato per il modello attivo.
- `/usage off|tokens|full` → aggiunge un **piè di pagina di uso per risposta** a ogni risposta.
  - Persiste per sessione (memorizzato come `responseUsage`).
  - `/usage reset` (alias: `inherit`, `clear`, `default`) — cancella l'override della sessione
    così la sessione eredita di nuovo il valore predefinito configurato.
  - `/usage tokens` mostra i dettagli dei token/cache del turno.
  - `/usage full` mostra dettagli compatti su modello/contesto/costo; il costo stimato appare
    solo quando OpenClaw ha metadati di uso e prezzi locali per il modello attivo.
    I layout personalizzati `messages.usageTemplate` possono includere campi token/cache.
- `/usage cost` → mostra un riepilogo dei costi locali dai log di sessione di OpenClaw.

Altre superfici:

- **TUI/Web TUI:** `/status` + `/usage` sono supportati.
- **CLI:** `openclaw status --usage` e `openclaw channels list` mostrano
  finestre di quota provider normalizzate (`X% left`, non costi per risposta).
  Provider correnti con finestra di uso: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi e z.ai.

Le superfici di uso normalizzano gli alias comuni dei campi nativi del provider prima della visualizzazione.
Per il traffico Responses della famiglia OpenAI, ciò include sia `input_tokens` /
`output_tokens` sia `prompt_tokens` / `completion_tokens`, quindi i nomi dei campi specifici del trasporto
non cambiano `/status`, `/usage` o i riepiloghi di sessione.
Anche l'uso di Gemini CLI viene normalizzato: il parser predefinito `stream-json` legge
gli eventi `message` dell'assistente, e `stats.cached` viene mappato a `cacheRead` con
`stats.input_tokens - stats.cached` usato quando la CLI omette un campo esplicito
`stats.input`. Gli override JSON legacy leggono ancora il testo della risposta da
`response`.
Per il traffico Responses nativo della famiglia OpenAI, gli alias di uso WebSocket/SSE vengono
normalizzati allo stesso modo, e i totali ripiegano su input + output normalizzati quando
`total_tokens` manca o è `0`.
Quando lo snapshot della sessione corrente è scarno, `/status` e `session_status` possono
anche recuperare contatori token/cache e l'etichetta del modello di runtime attivo dal
log di uso della trascrizione più recente. I valori live non zero esistenti hanno comunque
precedenza sui valori di fallback della trascrizione, e totali di trascrizione più grandi orientati al prompt
possono prevalere quando i totali memorizzati mancano o sono inferiori.
L'autenticazione dell'uso per le finestre di quota provider proviene da hook specifici del provider quando
disponibili; altrimenti OpenClaw ripiega sulle credenziali OAuth/API-key corrispondenti
da profili di autenticazione, env o configurazione.
Le voci della trascrizione dell'assistente persistono la stessa forma di uso normalizzata, incluso
`usage.cost` quando il modello attivo ha prezzi configurati e il provider
restituisce metadati di uso. Questo offre a `/usage cost` e allo stato di sessione basato su trascrizione
una fonte stabile anche dopo che lo stato live del runtime non c'è più.

OpenClaw mantiene la contabilizzazione dell'uso del provider separata dallo snapshot del contesto
corrente. `usage.total` del provider può includere input in cache, output e più
chiamate modello del ciclo strumenti, quindi è utile per costi e telemetria ma può sovrastimare
la finestra di contesto live. Le visualizzazioni del contesto e la diagnostica usano lo snapshot del prompt più recente
(`promptTokens`, o l'ultima chiamata al modello quando non è disponibile alcuno snapshot del prompt)
per `context.used`.

## Stima dei costi (quando mostrata)

I costi sono stimati dalla configurazione dei prezzi del tuo modello:

```
models.providers.<provider>.models[].cost
```

Questi sono **USD per 1M token** per `input`, `output`, `cacheRead` e
`cacheWrite`. Se i prezzi mancano, `/usage full` omette il costo; usa `/usage tokens`
o un `messages.usageTemplate` personalizzato quando hai bisogno dei dettagli token/cache in ogni
risposta. La visualizzazione del costo non è limitata all'autenticazione API-key: provider non API-key
come `aws-sdk` possono mostrare il costo stimato quando la voce del modello configurata include
prezzi locali e il provider restituisce metadati di uso.

Dopo che sidecar e canali raggiungono il percorso Gateway pronto, OpenClaw avvia un
bootstrap facoltativo dei prezzi in background per i riferimenti modello configurati che non
hanno già prezzi locali. Quel bootstrap recupera cataloghi remoti dei prezzi OpenRouter e LiteLLM.
Imposta `models.pricing.enabled: false` per saltare quei recuperi di catalogo
su reti offline o ristrette; le voci esplicite
`models.providers.*.models[].cost` continuano a guidare le stime dei costi locali.

## TTL della cache e impatto della potatura

La cache dei prompt del provider si applica solo entro la finestra TTL della cache. OpenClaw può
eseguire facoltativamente la **potatura cache-ttl**: pota la sessione una volta che il TTL della cache
è scaduto, quindi reimposta la finestra della cache così le richieste successive possono riutilizzare il
contesto appena messo in cache invece di rimettere in cache l'intera cronologia. Questo mantiene più bassi
i costi di scrittura cache quando una sessione resta inattiva oltre il TTL.

Configuralo in [Configurazione Gateway](/it/gateway/configuration) e vedi i
dettagli del comportamento in [Potatura della sessione](/it/concepts/session-pruning).

Heartbeat può mantenere la cache **calda** tra intervalli di inattività. Se il TTL della cache del tuo modello
è `1h`, impostare l'intervallo Heartbeat appena sotto quel valore (ad esempio `55m`) può evitare
di rimettere in cache l'intero prompt, riducendo i costi di scrittura cache.

Nelle configurazioni multi-agente, puoi mantenere una configurazione modello condivisa e regolare il comportamento della cache
per agente con `agents.list[].params.cacheRetention`.

Per una guida completa controllo per controllo, vedi [Caching dei prompt](/it/reference/prompt-caching).

Per i prezzi dell'API Anthropic, le letture cache sono significativamente più economiche dei token
di input, mentre le scritture cache vengono fatturate con un moltiplicatore più alto. Vedi i prezzi
del prompt caching di Anthropic per le tariffe e i moltiplicatori TTL più recenti:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Esempio: mantenere calda una cache da 1h con Heartbeat

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

`agents.list[].params` si fonde sopra i `params` del modello selezionato, quindi puoi
sovrascrivere solo `cacheRetention` ed ereditare gli altri valori predefiniti del modello invariati.

### Contesto Anthropic 1M

OpenClaw dimensiona i modelli Claude 4.x compatibili con GA, come Opus 4.8, Opus 4.7, Opus 4.6 e
Sonnet 4.6, con la finestra di contesto 1M di Anthropic. Non hai bisogno di
`params.context1m: true` per quei modelli.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Le configurazioni più vecchie possono mantenere `context1m: true`, ma OpenClaw non invia più
l'header beta ritirato di Anthropic `context-1m-2025-08-07` per questa impostazione e
non espande a 1M i modelli Claude più vecchi non supportati.

Requisito: la credenziale deve essere idonea all'uso del contesto lungo. In caso contrario,
Anthropic risponde con un errore di limite di frequenza lato provider per quella richiesta.

Se autentichi Anthropic con token OAuth/abbonamento (`sk-ant-oat-*`),
OpenClaw preserva gli header beta Anthropic richiesti da OAuth rimuovendo al contempo la
beta ritirata `context-1m-*` se rimane in una configurazione più vecchia.

## Suggerimenti per ridurre la pressione sui token

- Usa `/compact` per riepilogare sessioni lunghe.
- Riduci gli output estesi degli strumenti nei tuoi workflow.
- Abbassa `agents.defaults.imageMaxDimensionPx` per le sessioni con molti screenshot.
- Mantieni brevi le descrizioni delle skill (l’elenco delle skill viene inserito nel prompt).
- Preferisci modelli più piccoli per lavori prolissi ed esplorativi.

Vedi [Skills](/it/tools/skills) per la formula esatta dell’overhead dell’elenco delle skill.

## Correlati

- [Utilizzo e costi dell’API](/it/reference/api-usage-costs)
- [Prompt caching](/it/reference/prompt-caching)
- [Monitoraggio dell’utilizzo](/it/concepts/usage-tracking)
