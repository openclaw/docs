---
read_when:
    - Diagnostica della rotazione dei profili di autenticazione, dei cooldown o del comportamento di fallback del modello
    - Aggiornamento delle regole di failover per i profili di autenticazione o i modelli
    - Comprendere come le sostituzioni del modello della sessione interagiscono con i tentativi di fallback
summary: Come OpenClaw ruota i profili di autenticazione e passa a un fallback tra i modelli
title: Failover del modello
x-i18n:
    generated_at: "2026-04-25T18:18:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: e128c288ed420874f1b5eb28ecaa4ada66f09152c1b0b73b1d932bf5e86b6dd7
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw gestisce i guasti in due fasi:

1. **Rotazione dei profili di autenticazione** all'interno del provider corrente.
2. **Fallback del modello** al modello successivo in `agents.defaults.model.fallbacks`.

Questo documento spiega le regole di runtime e i dati su cui si basano.

## Flusso di runtime

Per una normale esecuzione di testo, OpenClaw valuta i candidati in questo ordine:

1. Il modello di sessione attualmente selezionato.
2. I `agents.defaults.model.fallbacks` configurati, in ordine.
3. Il modello primario configurato alla fine, quando l'esecuzione è partita da un override.

All'interno di ogni candidato, OpenClaw prova il failover del profilo di autenticazione prima di passare
al candidato modello successivo.

Sequenza di alto livello:

1. Risolve il modello di sessione attivo e la preferenza del profilo di autenticazione.
2. Costruisce la catena dei modelli candidati.
3. Prova il provider corrente con le regole di rotazione/cooldown del profilo di autenticazione.
4. Se quel provider è esaurito con un errore idoneo al failover, passa al successivo
   candidato modello.
5. Mantiene l'override di fallback selezionato prima che inizi il retry, così che altri
   lettori della sessione vedano lo stesso provider/modello che il runner sta per usare.
6. Se il candidato di fallback fallisce, annulla solo i campi di override della sessione posseduti
   dal fallback quando corrispondono ancora a quel candidato fallito.
7. Se tutti i candidati falliscono, genera un `FallbackSummaryError` con i dettagli
   per tentativo e la scadenza di cooldown più vicina quando è nota.

Questo è intenzionalmente più ristretto di "salvare e ripristinare l'intera sessione". Il
reply runner mantiene solo i campi di selezione del modello che possiede per il fallback:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Questo impedisce che un retry di fallback fallito sovrascriva mutazioni di sessione più recenti e non correlate,
come modifiche manuali di `/model` o aggiornamenti di rotazione della sessione
avvenuti mentre il tentativo era in esecuzione.

## Archiviazione dell'autenticazione (chiavi + OAuth)

OpenClaw usa i **profili di autenticazione** sia per le chiavi API sia per i token OAuth.

- I segreti si trovano in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (legacy: `~/.openclaw/agent/auth-profiles.json`).
- Lo stato di routing dell'autenticazione a runtime si trova in `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- La configurazione `auth.profiles` / `auth.order` è solo **metadati + routing** (nessun segreto).
- File OAuth legacy solo per importazione: `~/.openclaw/credentials/oauth.json` (importato in `auth-profiles.json` al primo utilizzo).

Più dettagli: [/concepts/oauth](/it/concepts/oauth)

Tipi di credenziali:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` per alcuni provider)

## ID dei profili

Gli accessi OAuth creano profili distinti così che più account possano coesistere.

- Predefinito: `provider:default` quando non è disponibile alcuna email.
- OAuth con email: `provider:<email>` (per esempio `google-antigravity:user@gmail.com`).

I profili si trovano in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` sotto `profiles`.

## Ordine di rotazione

Quando un provider ha più profili, OpenClaw sceglie un ordine come questo:

1. **Configurazione esplicita**: `auth.order[provider]` (se impostata).
2. **Profili configurati**: `auth.profiles` filtrati per provider.
3. **Profili archiviati**: voci in `auth-profiles.json` per il provider.

Se non è configurato alcun ordine esplicito, OpenClaw usa un ordine round-robin:

- **Chiave primaria:** tipo di profilo (**OAuth prima delle chiavi API**).
- **Chiave secondaria:** `usageStats.lastUsed` (meno recente per primo, all'interno di ogni tipo).
- I **profili in cooldown/disabilitati** vengono spostati alla fine, ordinati per scadenza più vicina.

### Persistenza alla sessione (cache-friendly)

OpenClaw **fissa il profilo di autenticazione scelto per sessione** per mantenere calde le cache del provider.
**Non** ruota a ogni richiesta. Il profilo fissato viene riutilizzato finché:

- la sessione non viene reimpostata (`/new` / `/reset`)
- una compaction non viene completata (il conteggio di compaction aumenta)
- il profilo non è in cooldown/disabilitato

La selezione manuale tramite `/model …@<profileId>` imposta un **override utente** per quella sessione
e non viene ruotata automaticamente finché non inizia una nuova sessione.

I profili fissati automaticamente (selezionati dal router di sessione) vengono trattati come una **preferenza**:
vengono provati per primi, ma OpenClaw può ruotare verso un altro profilo in caso di rate limit/timeout.
I profili fissati dall'utente restano bloccati su quel profilo; se falliscono e sono configurati fallback di modello,
OpenClaw passa al modello successivo invece di cambiare profilo.

### Perché OAuth può "sembrare perso"

Se hai sia un profilo OAuth sia un profilo chiave API per lo stesso provider, il round-robin può passare dall'uno all'altro tra i messaggi, a meno che non siano fissati. Per forzare un singolo profilo:

- Fissalo con `auth.order[provider] = ["provider:profileId"]`, oppure
- Usa un override per sessione tramite `/model …` con un override del profilo (quando supportato dalla tua UI/superficie chat).

## Cooldown

Quando un profilo fallisce a causa di errori di autenticazione/rate limit (o di un timeout che
sembra un rate limit), OpenClaw lo segna in cooldown e passa al profilo successivo.
Quel bucket di rate limit è più ampio del semplice `429`: include anche messaggi del provider
come `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted` e limiti periodici della finestra di utilizzo come
`weekly/monthly limit reached`.
Gli errori di formato/richiesta non valida (per esempio gli errori di convalida dell'ID di tool call di Cloud Code Assist)
sono trattati come idonei al failover e usano gli stessi cooldown.
Gli errori di stop-reason compatibili con OpenAI come `Unhandled stop reason: error`,
`stop reason: error` e `reason: error` sono classificati come segnali di
timeout/failover.
Anche testo generico del server può finire in quel bucket di timeout quando la sorgente corrisponde
a un pattern transitorio noto. Per esempio, il messaggio bare dello stream-wrapper pi-ai
`An unknown error occurred` è trattato come idoneo al failover per ogni provider
perché pi-ai lo emette quando gli stream del provider terminano con `stopReason: "aborted"` o
`stopReason: "error"` senza dettagli specifici.
Anche i payload JSON `api_error` con testo transitorio del server come
`internal server error`, `unknown error, 520`,
`upstream error` o `backend error` sono trattati come timeout
idonei al failover.
Il testo generico upstream specifico di OpenRouter, come il bare `Provider returned error`,
viene trattato come timeout solo quando il contesto del provider è effettivamente OpenRouter.
Il testo generico di fallback interno come `LLM request failed with an unknown
error.` resta prudente e non attiva il failover da solo.

Alcuni SDK di provider potrebbero altrimenti attendere una lunga finestra `Retry-After` prima di
restituire il controllo a OpenClaw. Per gli SDK basati su Stainless come Anthropic e
OpenAI, OpenClaw limita per impostazione predefinita le attese interne all'SDK `retry-after-ms` / `retry-after` a 60
secondi e rende immediatamente visibili le risposte ritentabili più lunghe, così che questo
percorso di failover possa essere eseguito. Regola o disabilita il limite con
`OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; vedi [/concepts/retry](/it/concepts/retry).

I cooldown di rate limit possono anche avere ambito di modello:

- OpenClaw registra `cooldownModel` per i guasti da rate limit quando è noto l'ID
  del modello che ha fallito.
- Un modello sibling sullo stesso provider può ancora essere provato quando il cooldown è
  limitato a un modello diverso.
- Le finestre di fatturazione/disabilitazione continuano invece a bloccare l'intero profilo tra modelli.

I cooldown usano exponential backoff:

- 1 minuto
- 5 minuti
- 25 minuti
- 1 ora (massimo)

Lo stato è archiviato in `auth-state.json` sotto `usageStats`:

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## Disabilitazioni per fatturazione

I guasti di fatturazione/credito (per esempio “insufficient credits” / “credit balance too low”) sono trattati come idonei al failover, ma in genere non sono transitori. Invece di un breve cooldown, OpenClaw segna il profilo come **disabilitato** (con un backoff più lungo) e ruota verso il profilo/provider successivo.

Non tutte le risposte che sembrano di fatturazione sono `402`, e non tutti gli HTTP `402` finiscono
qui. OpenClaw mantiene il testo esplicito di fatturazione nel percorso di fatturazione anche quando un
provider restituisce invece `401` o `403`, ma i matcher specifici del provider restano
limitati al provider che li possiede (per esempio OpenRouter `403 Key limit
exceeded`). Nel frattempo gli errori temporanei `402` della finestra di utilizzo e
dei limiti di spesa di organizzazione/workspace sono classificati come `rate_limit` quando
il messaggio sembra ritentabile (per esempio `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow` o `organization spending limit exceeded`).
Questi restano nel percorso di cooldown/failover breve invece che nel lungo
percorso di disabilitazione per fatturazione.

Lo stato è archiviato in `auth-state.json`:

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

Valori predefiniti:

- Il backoff di fatturazione parte da **5 ore**, raddoppia a ogni guasto di fatturazione e ha un massimo di **24 ore**.
- I contatori di backoff si azzerano se il profilo non fallisce per **24 ore** (configurabile).
- I retry per sovraccarico consentono **1 rotazione dello stesso provider tra profili** prima del fallback del modello.
- I retry per sovraccarico usano un backoff di **0 ms** per impostazione predefinita.

## Fallback del modello

Se tutti i profili per un provider falliscono, OpenClaw passa al modello successivo in
`agents.defaults.model.fallbacks`. Questo si applica a guasti di autenticazione, rate limit e
timeout che hanno esaurito la rotazione dei profili (altri errori non fanno avanzare il fallback).

Gli errori di sovraccarico e rate limit sono gestiti in modo più aggressivo rispetto ai cooldown di fatturazione. Per impostazione predefinita, OpenClaw consente un retry dello stesso provider con un altro profilo di autenticazione,
poi passa al fallback di modello configurato successivo senza attendere.
I segnali di provider occupato come `ModelNotReadyException` rientrano in quel bucket di sovraccarico.
Regola questo comportamento con `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs` e
`auth.cooldowns.rateLimitedProfileRotations`.

Quando un'esecuzione inizia con un override del modello (hook o CLI), i fallback terminano comunque con
`agents.defaults.model.primary` dopo aver provato eventuali fallback configurati.

### Regole della catena dei candidati

OpenClaw costruisce l'elenco dei candidati a partire dal `provider/model` richiesto correntemente
più i fallback configurati.

Regole:

- Il modello richiesto è sempre il primo.
- I fallback espliciti configurati vengono deduplicati ma non filtrati in base alla allowlist
  dei modelli. Sono trattati come intenzione esplicita dell'operatore.
- Se l'esecuzione corrente è già su un fallback configurato nella stessa famiglia di provider,
  OpenClaw continua a usare l'intera catena configurata.
- Se l'esecuzione corrente è su un provider diverso dalla configurazione e quel modello corrente
  non fa già parte della catena di fallback configurata, OpenClaw non
  aggiunge fallback configurati non correlati da un altro provider.
- Quando l'esecuzione è iniziata da un override, il modello primario configurato viene aggiunto alla
  fine così che la catena possa ritornare al normale default una volta esauriti i
  candidati precedenti.

### Quali errori fanno avanzare il fallback

Il fallback del modello continua in caso di:

- guasti di autenticazione
- rate limit ed esaurimento del cooldown
- errori di sovraccarico/provider occupato
- errori di failover con forma di timeout
- disabilitazioni per fatturazione
- `LiveSessionModelSwitchError`, che viene normalizzato in un percorso di failover così che un
  modello persistito obsoleto non crei un loop di retry esterno
- altri errori non riconosciuti quando ci sono ancora candidati rimanenti

Il fallback del modello non continua in caso di:

- abort espliciti che non hanno forma di timeout/failover
- errori di overflow del contesto che devono restare nella logica di compaction/retry
  (per esempio `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model` o `ollama error: context
length exceeded`)
- un errore finale sconosciuto quando non restano candidati

### Comportamento di salto del cooldown vs probe

Quando ogni profilo di autenticazione per un provider è già in cooldown, OpenClaw
non salta automaticamente quel provider per sempre. Prende una decisione per candidato:

- I guasti di autenticazione persistenti saltano immediatamente l'intero provider.
- Le disabilitazioni per fatturazione di solito vengono saltate, ma il candidato primario può ancora essere sottoposto a probe
  con throttling così che il recupero sia possibile senza riavviare.
- Il candidato primario può essere sottoposto a probe vicino alla scadenza del cooldown, con un throttling
  per provider.
- I modelli sibling di fallback sullo stesso provider possono essere provati nonostante il cooldown quando il
  guasto sembra transitorio (`rate_limit`, `overloaded` o sconosciuto). Questo è
  particolarmente rilevante quando un rate limit ha ambito di modello e un modello sibling può
  ancora recuperare immediatamente.
- I probe transitori durante il cooldown sono limitati a uno per provider per esecuzione di fallback, così che
  un singolo provider non rallenti il fallback cross-provider.

## Override di sessione e cambio modello live

Le modifiche al modello di sessione sono stato condiviso. Il runner attivo, il comando `/model`,
gli aggiornamenti di compaction/sessione e la riconciliazione della sessione live leggono o scrivono tutti
parti della stessa voce di sessione.

Ciò significa che i retry di fallback devono coordinarsi con il cambio modello live:

- Solo le modifiche esplicite al modello guidate dall'utente contrassegnano un pending live switch. Questo
  include `/model`, `session_status(model=...)` e `sessions.patch`.
- Le modifiche al modello guidate dal sistema come la rotazione di fallback, gli override di Heartbeat,
  o Compaction non contrassegnano mai da sole un pending live switch.
- Prima che inizi un retry di fallback, il reply runner mantiene i campi di override del fallback
  selezionato nella voce di sessione.
- La riconciliazione della sessione live preferisce gli override di sessione persistiti rispetto ai
  campi runtime del modello obsoleti.
- Se il tentativo di fallback fallisce, il runner annulla solo i campi di override
  che ha scritto, e solo se corrispondono ancora a quel candidato fallito.

Questo previene la race condition classica:

1. Il primario fallisce.
2. Il candidato di fallback viene scelto in memoria.
3. Lo store della sessione indica ancora il vecchio primario.
4. La riconciliazione della sessione live legge lo stato obsoleto della sessione.
5. Il retry viene riportato al vecchio modello prima che inizi il tentativo di fallback.

L'override di fallback persistito chiude quella finestra, e il rollback ristretto
mantiene intatte le modifiche di sessione manuali o di runtime più recenti.

## Osservabilità e riepiloghi dei guasti

`runWithModelFallback(...)` registra dettagli per tentativo che alimentano i log e
i messaggi di cooldown visibili all'utente:

- provider/modello tentato
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` e
  motivi di failover simili)
- stato/codice facoltativo
- riepilogo dell'errore leggibile da persone

Quando ogni candidato fallisce, OpenClaw genera `FallbackSummaryError`. Il reply runner
esterno può usarlo per costruire un messaggio più specifico come "tutti i modelli
sono temporaneamente soggetti a rate limit" e includere la scadenza di cooldown più vicina quando è
nota.

Quel riepilogo del cooldown è consapevole del modello:

- i rate limit con ambito di modello non correlati vengono ignorati per la
  catena provider/modello tentata
- se il blocco rimanente è un rate limit con ambito di modello corrispondente, OpenClaw
  riporta l'ultima scadenza corrispondente che blocca ancora quel modello

## Configurazione correlata

Vedi [Configurazione del Gateway](/it/gateway/configuration) per:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- routing di `agents.defaults.imageModel`

Vedi [Modelli](/it/concepts/models) per la panoramica più ampia sulla selezione del modello e sul fallback.
