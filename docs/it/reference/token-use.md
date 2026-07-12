---
read_when:
    - Spiegazione dell'uso dei token, dei costi o delle finestre di contesto
    - Debug del comportamento di crescita del contesto o di Compaction
summary: Come OpenClaw crea il contesto del prompt e segnala l'utilizzo dei token e i costi
title: Utilizzo e costi dei token
x-i18n:
    generated_at: "2026-07-12T07:32:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07c79e137d6809ccf8c435ef62641c0cc7579b3ec43acd513e430a7ab91cd47c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw tiene traccia dei **token**, non dei caratteri. I token sono specifici del modello, ma la maggior parte dei modelli in stile OpenAI ha una media di circa 4 caratteri per token per il testo inglese.

## Come viene creato il prompt di sistema

OpenClaw compone il proprio prompt di sistema a ogni esecuzione. Include:

- Elenco degli strumenti + brevi descrizioni
- Elenco delle Skills (solo metadati; le istruzioni vengono caricate su richiesta con `read`). I turni Codex nativi ricevono il blocco compatto delle Skills come istruzioni per sviluppatori di collaborazione limitate al turno; gli altri harness lo ricevono nella normale superficie del prompt. Limitato da `skills.limits.maxSkillsPromptChars`, con sostituzione facoltativa per agente in `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Istruzioni per l'aggiornamento automatico
- File dell'area di lavoro + file di bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` quando è nuovo, oltre a `MEMORY.md` quando presente). I file inseriti di grandi dimensioni vengono troncati da `agents.defaults.bootstrapMaxChars` (predefinito: `20000`); l'inserimento totale del bootstrap è limitato da `agents.defaults.bootstrapTotalMaxChars` (predefinito: `60000`).
  - I turni Codex nativi non incollano il contenuto grezzo di `MEMORY.md` quando sono disponibili strumenti di memoria per quell'area di lavoro; ricevono invece un breve riferimento alla memoria nelle istruzioni per sviluppatori di collaborazione limitate al turno e utilizzano gli strumenti di memoria su richiesta. Se gli strumenti sono disabilitati, la ricerca nella memoria non è disponibile oppure l'area di lavoro attiva è diversa dall'area di lavoro della memoria dell'agente, `MEMORY.md` torna al normale percorso limitato del contesto del turno.
  - Il file `memory.md` in minuscolo nella radice non viene mai inserito. È un input di riparazione legacy per `openclaw doctor --fix`, che lo migra in `MEMORY.md`.
  - I file giornalieri `memory/*.md` non fanno parte del normale prompt di bootstrap; nei turni ordinari rimangono disponibili su richiesta tramite gli strumenti di memoria. Le esecuzioni del modello per reimpostazione/avvio possono anteporre un blocco di contesto di avvio monouso con la memoria giornaliera recente per quel primo turno, controllato da `agents.defaults.startupContext`. I comandi di chat semplici `/new` e `/reset` ricevono conferma senza invocare il modello.
  - Gli estratti di `AGENTS.md` successivi alla Compaction sono separati e richiedono l'abilitazione esplicita tramite `agents.defaults.compaction.postCompactionSections`.
- Ora (UTC + fuso orario dell'utente)
- Tag di risposta + comportamento dell'Heartbeat
- Metadati di runtime (host/sistema operativo/modello/ragionamento)

Consulta la descrizione completa in [Prompt di sistema](/it/concepts/system-prompt).

Quando documenti credenziali o frammenti di autenticazione, usa le [Convenzioni per i segnaposto dei segreti](/it/reference/secret-placeholder-conventions) per evitare falsi positivi dello scanner dei segreti nelle modifiche relative esclusivamente alla documentazione.

## Cosa viene conteggiato nella finestra di contesto

Tutto ciò che il modello riceve viene conteggiato nel limite del contesto:

- Prompt di sistema (tutte le sezioni precedenti)
- Cronologia della conversazione (messaggi dell'utente + dell'assistente)
- Chiamate agli strumenti e relativi risultati
- Allegati/trascrizioni (immagini, audio, file)
- Riepiloghi della Compaction e artefatti di eliminazione
- Wrapper del provider o intestazioni di sicurezza (non visibili, ma comunque conteggiati)

Le superfici con un uso intensivo del runtime hanno limiti espliciti propri in `agents.defaults.contextLimits` (sostituzioni per agente in `agents.list[].contextLimits`):

| Chiave                   | Scopo                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `memoryGetMaxChars`      | Numero massimo di caratteri restituiti da `memory_get` prima del troncamento.               |
| `memoryGetDefaultLines`  | Finestra di righe predefinita di `memory_get` quando una richiesta omette `lines`.          |
| `toolResultMaxChars`     | Limite avanzato per un singolo risultato di uno strumento attivo (fino a `1000000` caratteri). |
| `postCompactionMaxChars` | Numero massimo di caratteri conservati da `AGENTS.md` durante l'aggiornamento successivo alla Compaction. |

Questi sono estratti di runtime limitati e blocchi inseriti di proprietà del runtime, separati dai limiti del bootstrap, dai limiti del contesto di avvio e dai limiti del prompt delle Skills.

`toolResultMaxChars` non è impostato per impostazione predefinita, quindi OpenClaw ricava il limite dei risultati degli strumenti attivi dalla finestra di contesto effettiva del modello: `16000` caratteri sotto i 100.000 token, `32000` caratteri da 100.000 token in su, `64000` caratteri da 200.000 token in su. La protezione relativa alla quota del contesto di runtime limita comunque un singolo risultato di uno strumento al 30% della finestra di contesto, anche quando è configurato un limite esplicito maggiore.

Per le immagini, OpenClaw ridimensiona verso il basso i payload delle immagini di trascrizioni/strumenti prima delle chiamate al provider. Regola il comportamento con `agents.defaults.imageMaxDimensionPx` (predefinito: `1200`):

- Valori inferiori riducono l'uso dei token visivi e le dimensioni del payload.
- Valori superiori conservano più dettagli visivi per schermate con molto testo OCR o elementi dell'interfaccia utente.

Per una descrizione pratica (per ogni file inserito, strumenti, Skills e dimensioni del prompt di sistema), usa `/context list` o `/context detail`. Consulta [Contesto](/it/concepts/context).

## Come visualizzare l'utilizzo corrente dei token

Nella chat:

- `/status` -> scheda di stato ricca di emoji con il modello della sessione, l'utilizzo del contesto, i token di input/output dell'ultima risposta e il costo stimato quando sono configurati prezzi locali per il modello attivo.
- `/usage off|tokens|full` -> aggiunge a ogni risposta un piè di pagina con l'utilizzo per risposta. L'impostazione persiste per sessione (memorizzata come `responseUsage`).
  - `/usage reset` (alias: `inherit`, `clear`, `default`) cancella la sostituzione della sessione, che torna a ereditare il valore predefinito configurato.
  - `/usage tokens` mostra i dettagli dei token e della cache del turno.
  - `/usage full` mostra dettagli compatti su modello/contesto/costo; il costo stimato appare solo quando OpenClaw dispone dei metadati di utilizzo e dei prezzi locali per il modello attivo. I layout personalizzati di `messages.usageTemplate` possono includere campi relativi a token/cache.
- `/usage cost` -> riepilogo dei costi locali dai log delle sessioni di OpenClaw.

Altre superfici:

- **TUI/TUI Web:** `/status` e `/usage` sono supportati.
- **CLI:** `openclaw status --usage` e `openclaw channels list` mostrano le finestre normalizzate delle quote del provider (`X% left`, non i costi per risposta). I provider attualmente supportati per le finestre di utilizzo sono: Claude (Anthropic), ClawRouter, Copilot (GitHub), DeepSeek, Gemini (Google Gemini CLI), MiniMax, OpenAI, Xiaomi, Xiaomi Token Plan e z.ai.

Le superfici di utilizzo normalizzano gli alias comuni dei campi nativi del provider prima della visualizzazione. Per il traffico Responses della famiglia OpenAI, ciò include sia `input_tokens`/`output_tokens` sia `prompt_tokens`/`completion_tokens`, quindi i nomi dei campi specifici del trasporto non modificano `/status`, `/usage` o i riepiloghi delle sessioni. Anche l'utilizzo di Gemini CLI viene normalizzato: il parser `stream-json` predefinito legge gli eventi `message` dell'assistente e `stats.cached` viene mappato a `cacheRead`, usando `stats.input_tokens - stats.cached` quando la CLI omette un campo `stats.input` esplicito. Le sostituzioni JSON legacy continuano a leggere il testo della risposta da `response`.

Per il traffico Responses nativo della famiglia OpenAI, gli alias di utilizzo WebSocket/SSE vengono normalizzati nello stesso modo e i totali vengono calcolati in alternativa come input + output normalizzati quando `total_tokens` manca o è `0`.

Quando l'istantanea della sessione corrente contiene pochi dati, `/status` e `session_status` possono recuperare i contatori di token/cache e l'etichetta del modello di runtime attivo dal log di utilizzo più recente della trascrizione. I valori attivi esistenti diversi da zero continuano ad avere la precedenza sui valori di ripiego della trascrizione, mentre i totali della trascrizione più elevati e orientati al prompt possono prevalere quando i totali memorizzati mancano o sono inferiori.

L'autenticazione per l'utilizzo delle finestre delle quote del provider proviene innanzitutto dagli hook specifici del provider; se un provider non dispone di un hook (o l'hook non risolve un token), OpenClaw ricorre alle credenziali OAuth/chiave API corrispondenti provenienti dai profili di autenticazione, dall'ambiente o dalla configurazione.

Le voci della trascrizione dell'assistente conservano la stessa struttura di utilizzo normalizzata, incluso `usage.cost` quando il modello attivo dispone di prezzi configurati e il provider restituisce metadati di utilizzo. Ciò fornisce a `/usage cost` e allo stato della sessione basato sulla trascrizione una fonte stabile anche dopo la scomparsa dello stato attivo del runtime.

OpenClaw mantiene la contabilizzazione dell'utilizzo del provider separata dall'istantanea corrente del contesto. `usage.total` del provider può includere input memorizzato nella cache, output e più chiamate al modello nel ciclo degli strumenti, quindi è utile per costi e telemetria, ma può sovrastimare la finestra di contesto attiva. Le visualizzazioni e le diagnostiche del contesto usano l'istantanea più recente del prompt (`promptTokens` oppure l'ultima chiamata al modello quando non è disponibile un'istantanea del prompt) per `context.used`.

## Stima dei costi (quando mostrata)

I costi vengono stimati dalla configurazione dei prezzi del modello:

```text
models.providers.<provider>.models[].cost
```

Si tratta di **USD per 1 milione di token** per `input`, `output`, `cacheRead` e `cacheWrite`. Se i prezzi non sono presenti, `/usage full` omette il costo; usa `/usage tokens` o un `messages.usageTemplate` personalizzato quando hai bisogno dei dettagli di token/cache in ogni risposta. La visualizzazione dei costi non è limitata all'autenticazione tramite chiave API: i provider che non usano una chiave API, come `aws-sdk`, possono mostrare il costo stimato quando la voce del modello configurato include prezzi locali e il provider restituisce metadati di utilizzo.

Dopo che i processi complementari e i canali raggiungono il percorso di disponibilità del Gateway, OpenClaw avvia in background un bootstrap facoltativo dei prezzi per i riferimenti ai modelli configurati che non dispongono già di prezzi locali. Tale bootstrap recupera i cataloghi remoti dei prezzi di OpenRouter e LiteLLM. Imposta `models.pricing.enabled: false` per evitare il recupero di questi cataloghi su reti offline o con restrizioni; le voci esplicite `models.providers.*.models[].cost` continuano a determinare le stime dei costi locali.

## Impatto del TTL della cache e dell'eliminazione

La memorizzazione nella cache del prompt da parte del provider si applica solo entro la finestra del TTL della cache. OpenClaw può eseguire facoltativamente l'**eliminazione in base al TTL della cache**: elimina parte della sessione una volta scaduto il TTL della cache, quindi reimposta la finestra della cache affinché le richieste successive riutilizzino il contesto appena memorizzato nella cache invece di memorizzare nuovamente l'intera cronologia. Ciò riduce i costi di scrittura nella cache quando una sessione rimane inattiva oltre il TTL.

Configura questa funzionalità in [Configurazione del Gateway](/it/gateway/configuration) e consulta i dettagli del comportamento in [Eliminazione delle sessioni](/it/concepts/session-pruning).

L'Heartbeat può mantenere la cache **attiva** durante i periodi di inattività. Se il TTL della cache del modello è `1h`, impostare l'intervallo dell'Heartbeat appena al di sotto di tale valore (ad esempio `55m`) può evitare di memorizzare nuovamente l'intero prompt, riducendo i costi di scrittura nella cache.

Nelle configurazioni multi-agente, puoi mantenere una configurazione condivisa del modello e regolare il comportamento della cache per ogni agente con `agents.list[].params.cacheRetention`.

Per una guida completa a ogni singola impostazione, consulta [Memorizzazione nella cache del prompt](/it/reference/prompt-caching).

Per i prezzi dell'API Anthropic, le letture dalla cache sono notevolmente meno costose dei token di input, mentre le scritture nella cache vengono fatturate con un moltiplicatore maggiore. Consulta i prezzi della memorizzazione nella cache del prompt di Anthropic per le tariffe e i moltiplicatori TTL più recenti:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Esempio: mantenere attiva la cache di 1 ora con l'Heartbeat

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

### Esempio: traffico misto con strategia della cache per agente

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

`agents.list[].params` viene unito ai `params` del modello selezionato, quindi puoi sostituire solo `cacheRetention` ed ereditare senza modifiche gli altri valori predefiniti del modello.

### Contesto Anthropic da 1 milione

OpenClaw dimensiona i modelli Claude 4.x compatibili con la disponibilità generale, come Opus 4.8, Opus 4.7, Opus 4.6 e Sonnet 4.6, con la finestra di contesto da 1 milione di Anthropic. Per questi modelli non è necessario impostare `params.context1m: true`.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Le configurazioni meno recenti possono mantenere `context1m: true`, ma OpenClaw non invia più l'intestazione beta `context-1m-2025-08-07` ritirata da Anthropic per questa impostazione e non estende a 1 milione i modelli Claude meno recenti non supportati.

Requisito: la credenziale deve essere idonea all'uso con contesti estesi. In caso contrario,
Anthropic restituisce un errore di limite di frequenza lato provider per tale richiesta.

Se esegui l'autenticazione ad Anthropic con token OAuth/di abbonamento
(`sk-ant-oat-*`), OpenClaw mantiene le intestazioni beta di Anthropic richieste
da OAuth, rimuovendo al contempo la beta ritirata `context-1m-*` qualora sia ancora
presente in configurazioni meno recenti.

## Suggerimenti per ridurre la pressione sui token

- Usa `/compact` per riassumere le sessioni lunghe.
- Riduci gli output di grandi dimensioni degli strumenti nei tuoi flussi di lavoro.
- Riduci `agents.defaults.imageMaxDimensionPx` per le sessioni con molte schermate.
- Mantieni brevi le descrizioni delle Skills (l'elenco delle Skills viene inserito nel prompt).
- Preferisci modelli più piccoli per lavori prolissi ed esplorativi.

Consulta [Skills](/it/tools/skills) per la formula esatta del sovraccarico dovuto all'elenco delle Skills.

## Argomenti correlati

- [Utilizzo e costi delle API](/it/reference/api-usage-costs)
- [Memorizzazione nella cache del prompt](/it/reference/prompt-caching)
- [Monitoraggio dell'utilizzo](/it/concepts/usage-tracking)
