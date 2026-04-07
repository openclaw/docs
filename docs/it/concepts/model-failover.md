---
read_when:
    - Diagnosi della rotazione dei profili di autenticazione, dei cooldown o del comportamento di fallback del modello
    - Aggiornamento delle regole di failover per i profili di autenticazione o i modelli
    - Comprensione di come le sostituzioni del modello di sessione interagiscono con i tentativi di fallback
summary: Come OpenClaw ruota i profili di autenticazione e usa il fallback tra i modelli
title: Failover del modello
x-i18n:
    generated_at: "2026-04-07T08:12:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: d88821e229610f236bdab3f798d5e8c173f61a77c01017cc87431126bf465e32
    source_path: concepts/model-failover.md
    workflow: 15
---

# Failover del modello

OpenClaw gestisce gli errori in due fasi:

1. **Rotazione del profilo di autenticazione** all'interno del provider corrente.
2. **Fallback del modello** al modello successivo in `agents.defaults.model.fallbacks`.

Questo documento spiega le regole di runtime e i dati che le supportano.

## Flusso di runtime

Per una normale esecuzione di testo, OpenClaw valuta i candidati in questo ordine:

1. Il modello di sessione attualmente selezionato.
2. I `agents.defaults.model.fallbacks` configurati, in ordine.
3. Il modello primario configurato alla fine, quando l'esecuzione è iniziata da una sostituzione.

All'interno di ciascun candidato, OpenClaw prova il failover del profilo di autenticazione prima di passare
al candidato modello successivo.

Sequenza di alto livello:

1. Risolvere il modello di sessione attivo e la preferenza del profilo di autenticazione.
2. Costruire la catena dei candidati modello.
3. Provare il provider corrente con le regole di rotazione/cooldown del profilo di autenticazione.
4. Se quel provider è esaurito con un errore che giustifica il failover, passare al
   candidato modello successivo.
5. Rendere persistente la sostituzione di fallback selezionata prima che inizi il nuovo tentativo, in modo che gli altri
   lettori della sessione vedano lo stesso provider/modello che il runner sta per usare.
6. Se il candidato di fallback fallisce, ripristinare solo i campi di sostituzione della sessione di proprietà del fallback
   quando corrispondono ancora a quel candidato fallito.
7. Se ogni candidato fallisce, generare un `FallbackSummaryError` con i dettagli per tentativo
   e la scadenza del cooldown più vicina quando è nota.

Questo è intenzionalmente più ristretto di "salvare e ripristinare l'intera sessione". Il
runner della risposta rende persistenti solo i campi di selezione del modello che possiede per il fallback:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Questo impedisce che un nuovo tentativo di fallback fallito sovrascriva mutazioni di sessione più recenti e non correlate,
come modifiche manuali con `/model` o aggiornamenti di rotazione della sessione che
si sono verificati mentre il tentativo era in esecuzione.

## Archiviazione dell'autenticazione (chiavi + OAuth)

OpenClaw usa i **profili di autenticazione** sia per le chiavi API sia per i token OAuth.

- I secret si trovano in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (legacy: `~/.openclaw/agent/auth-profiles.json`).
- Lo stato di instradamento dell'autenticazione a runtime si trova in `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- La config `auth.profiles` / `auth.order` contiene **solo metadati + instradamento** (nessun secret).
- File OAuth legacy solo per importazione: `~/.openclaw/credentials/oauth.json` (importato in `auth-profiles.json` al primo utilizzo).

Più dettagli: [/concepts/oauth](/it/concepts/oauth)

Tipi di credenziali:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` per alcuni provider)

## ID profilo

Gli accessi OAuth creano profili distinti in modo che più account possano coesistere.

- Predefinito: `provider:default` quando non è disponibile alcuna email.
- OAuth con email: `provider:<email>` (ad esempio `google-antigravity:user@gmail.com`).

I profili si trovano in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` sotto `profiles`.

## Ordine di rotazione

Quando un provider ha più profili, OpenClaw sceglie un ordine in questo modo:

1. **Config esplicita**: `auth.order[provider]` (se impostato).
2. **Profili configurati**: `auth.profiles` filtrati per provider.
3. **Profili archiviati**: voci in `auth-profiles.json` per il provider.

Se non è configurato alcun ordine esplicito, OpenClaw usa un ordine round-robin:

- **Chiave primaria:** tipo di profilo (**OAuth prima delle chiavi API**).
- **Chiave secondaria:** `usageStats.lastUsed` (meno recente per primo, all'interno di ogni tipo).
- I **profili in cooldown/disabilitati** vengono spostati alla fine, ordinati per scadenza più vicina.

### Affinità di sessione (favorevole alla cache)

OpenClaw **blocca il profilo di autenticazione scelto per sessione** per mantenere calde le cache del provider.
**Non** ruota a ogni richiesta. Il profilo bloccato viene riutilizzato fino a quando:

- la sessione non viene reimpostata (`/new` / `/reset`)
- viene completata una compattazione (il conteggio della compattazione aumenta)
- il profilo è in cooldown/disabilitato

La selezione manuale tramite `/model …@<profileId>` imposta una **sostituzione utente** per quella sessione
e non viene ruotata automaticamente finché non inizia una nuova sessione.

I profili bloccati automaticamente (selezionati dal router della sessione) vengono trattati come una **preferenza**:
vengono provati per primi, ma OpenClaw può ruotare a un altro profilo in caso di limiti di frequenza/timeout.
I profili bloccati dall'utente restano vincolati a quel profilo; se fallisce e sono configurati fallback del modello,
OpenClaw passa al modello successivo invece di cambiare profilo.

### Perché OAuth può "sembrare perso"

Se hai sia un profilo OAuth sia un profilo con chiave API per lo stesso provider, il round-robin può alternarsi tra loro nei vari messaggi a meno che non siano bloccati. Per forzare un singolo profilo:

- Blocca con `auth.order[provider] = ["provider:profileId"]`, oppure
- Usa una sostituzione per sessione tramite `/model …` con una sostituzione di profilo (quando supportata dalla tua UI/superficie chat).

## Cooldown

Quando un profilo fallisce a causa di errori di autenticazione/limite di frequenza (o un timeout che
sembra limitazione di frequenza), OpenClaw lo contrassegna come in cooldown e passa al profilo successivo.
Questa categoria di limite di frequenza è più ampia del semplice `429`: include anche messaggi del provider
come `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted` e limiti periodici della finestra di utilizzo come
`weekly/monthly limit reached`.
Gli errori di formato/richiesta non valida (ad esempio errori di
convalida dell'ID di chiamata strumento di Cloud Code Assist) sono trattati come adatti al failover e usano gli stessi cooldown.
Gli errori di motivo di arresto compatibili con OpenAI come `Unhandled stop reason: error`,
`stop reason: error` e `reason: error` sono classificati come segnali
di timeout/failover.
Anche testo generico del server a livello di provider può finire in quella categoria di timeout quando
l'origine corrisponde a un pattern transitorio noto. Ad esempio, per Anthropic
il semplice `An unknown error occurred` e i payload JSON `api_error` con testo di server transitorio
come `internal server error`, `unknown error, 520`, `upstream error`
o `backend error` sono trattati come timeout adatti al failover. Anche testo generico upstream specifico di OpenRouter
come il semplice `Provider returned error` è trattato come
timeout solo quando il contesto del provider è effettivamente OpenRouter. Testo generico di fallback interno
come `LLM request failed with an unknown error.` resta
prudente e non attiva da solo il failover.

I cooldown per limite di frequenza possono anche essere limitati al modello:

- OpenClaw registra `cooldownModel` per gli errori di limite di frequenza quando il modello che ha fallito
  è noto.
- Un modello correlato sullo stesso provider può comunque essere provato quando il cooldown è
  limitato a un modello diverso.
- Le finestre di fatturazione/disabilitazione continuano comunque a bloccare l'intero profilo su tutti i modelli.

I cooldown usano un backoff esponenziale:

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

Gli errori di fatturazione/credito (ad esempio “insufficient credits” / “credit balance too low”) sono trattati come adatti al failover, ma di solito non sono transitori. Invece di un breve cooldown, OpenClaw contrassegna il profilo come **disabilitato** (con un backoff più lungo) e ruota al profilo/provider successivo.

Non tutte le risposte che sembrano di fatturazione sono `402`, e non ogni `402` HTTP finisce
qui. OpenClaw mantiene il testo esplicito di fatturazione nel percorso di fatturazione anche quando un
provider restituisce invece `401` o `403`, ma i matcher specifici del provider restano
limitati al provider a cui appartengono (ad esempio OpenRouter `403 Key limit
exceeded`). Nel frattempo, errori temporanei `402` di finestra di utilizzo e
limite di spesa di organizzazione/workspace sono classificati come `rate_limit` quando
il messaggio sembra riprovabile (ad esempio `weekly usage limit exhausted`, `daily
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

- Il backoff per fatturazione parte da **5 ore**, raddoppia a ogni errore di fatturazione e ha un massimo di **24 ore**.
- I contatori di backoff si azzerano se il profilo non ha fallito per **24 ore** (configurabile).
- I retry per stato overloaded consentono **1 rotazione dello stesso provider tra profili** prima del fallback del modello.
- I retry per stato overloaded usano per impostazione predefinita un backoff di **0 ms**.

## Fallback del modello

Se tutti i profili per un provider falliscono, OpenClaw passa al modello successivo in
`agents.defaults.model.fallbacks`. Questo si applica a errori di autenticazione, limiti di frequenza e
timeout che hanno esaurito la rotazione dei profili (altri errori non fanno avanzare il fallback).

Gli errori overloaded e di limite di frequenza vengono gestiti in modo più aggressivo rispetto ai cooldown di fatturazione.
Per impostazione predefinita, OpenClaw consente un retry del profilo di autenticazione sullo stesso provider,
poi passa al fallback del modello configurato successivo senza attendere.
I segnali di provider occupato come `ModelNotReadyException` rientrano in quella categoria overloaded.
Puoi regolare questo comportamento con `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs` e
`auth.cooldowns.rateLimitedProfileRotations`.

Quando un'esecuzione inizia con una sostituzione del modello (hook o CLI), i fallback terminano comunque su
`agents.defaults.model.primary` dopo aver provato gli eventuali fallback configurati.

### Regole della catena di candidati

OpenClaw costruisce l'elenco dei candidati a partire dal `provider/model` attualmente richiesto
più i fallback configurati.

Regole:

- Il modello richiesto è sempre il primo.
- I fallback configurati espliciti vengono deduplicati ma non filtrati in base alla allowlist
  dei modelli. Sono trattati come intenzione esplicita dell'operatore.
- Se l'esecuzione corrente è già su un fallback configurato nella stessa famiglia di provider,
  OpenClaw continua a usare l'intera catena configurata.
- Se l'esecuzione corrente è su un provider diverso dalla config e quel modello corrente
  non fa già parte della catena di fallback configurata, OpenClaw non
  aggiunge fallback configurati non correlati di un altro provider.
- Quando l'esecuzione è iniziata da una sostituzione, il modello primario configurato viene aggiunto alla
  fine in modo che la catena possa tornare al normale valore predefinito una volta esauriti i candidati precedenti.

### Quali errori fanno avanzare il fallback

Il fallback del modello continua in caso di:

- errori di autenticazione
- limiti di frequenza ed esaurimento del cooldown
- errori overloaded/provider occupato
- errori di failover con forma di timeout
- disabilitazioni per fatturazione
- `LiveSessionModelSwitchError`, che viene normalizzato in un percorso di failover in modo che un
  modello persistente non aggiornato non crei un ciclo di retry esterno
- altri errori non riconosciuti quando ci sono ancora candidati rimanenti

Il fallback del modello non continua in caso di:

- interruzioni esplicite che non hanno forma di timeout/failover
- errori di overflow del contesto che devono restare all'interno della logica di compattazione/retry
  (ad esempio `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model` o `ollama error: context
length exceeded`)
- un errore finale sconosciuto quando non restano più candidati

### Comportamento di salto per cooldown rispetto al sondaggio

Quando ogni profilo di autenticazione per un provider è già in cooldown, OpenClaw non
salta automaticamente quel provider per sempre. Prende una decisione per candidato:

- Gli errori di autenticazione persistenti saltano immediatamente l'intero provider.
- Le disabilitazioni per fatturazione di solito saltano, ma il candidato primario può comunque essere sondato
  con limitazione, così da consentire il recupero senza riavviare.
- Il candidato primario può essere sondato vicino alla scadenza del cooldown, con una limitazione
  per provider.
- I modelli correlati di fallback sullo stesso provider possono essere provati nonostante il cooldown quando il
  fallimento sembra transitorio (`rate_limit`, `overloaded` o sconosciuto). Questo è
  particolarmente rilevante quando un limite di frequenza è limitato al modello e un modello correlato può
  ancora recuperare immediatamente.
- I sondaggi di cooldown transitori sono limitati a uno per provider per esecuzione di fallback, così
  un singolo provider non blocca il fallback tra provider.

## Sostituzioni di sessione e cambio modello live

Le modifiche al modello di sessione sono uno stato condiviso. Il runner attivo, il comando `/model`,
gli aggiornamenti di compattazione/sessione e la riconciliazione della sessione live leggono o scrivono tutti
parti della stessa voce di sessione.

Questo significa che i retry di fallback devono coordinarsi con il cambio modello live:

- Solo le modifiche di modello esplicite guidate dall'utente contrassegnano un cambio live in sospeso. Questo
  include `/model`, `session_status(model=...)` e `sessions.patch`.
- Le modifiche di modello guidate dal sistema come rotazione di fallback, sostituzioni heartbeat
  o compattazione non contrassegnano mai da sole un cambio live in sospeso.
- Prima che inizi un retry di fallback, il runner della risposta rende persistenti i campi di sostituzione
  del fallback selezionato nella voce di sessione.
- La riconciliazione della sessione live privilegia le sostituzioni persistenti della sessione rispetto a campi
  di modello runtime non aggiornati.
- Se il tentativo di fallback fallisce, il runner ripristina solo i campi di sostituzione
  che ha scritto, e solo se corrispondono ancora a quel candidato fallito.

Questo impedisce la classica race condition:

1. Il primario fallisce.
2. Il candidato di fallback viene scelto in memoria.
3. L'archivio della sessione indica ancora il vecchio primario.
4. La riconciliazione della sessione live legge lo stato obsoleto della sessione.
5. Il retry torna al vecchio modello prima che inizi il tentativo di fallback.

La sostituzione di fallback persistente chiude quella finestra, e il ripristino ristretto
mantiene intatte le modifiche di sessione manuali o runtime più recenti.

## Osservabilità e riepiloghi degli errori

`runWithModelFallback(...)` registra dettagli per tentativo che alimentano log e
messaggi di cooldown visibili all'utente:

- provider/modello tentato
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` e
  motivi di failover simili)
- stato/codice opzionale
- riepilogo dell'errore leggibile da persone

Quando ogni candidato fallisce, OpenClaw genera `FallbackSummaryError`. Il runner
esterno della risposta può usarlo per costruire un messaggio più specifico come "tutti i modelli
sono temporaneamente soggetti a limitazione di frequenza" e includere la scadenza del cooldown più vicina quando nota.

Quel riepilogo del cooldown è consapevole del modello:

- i limiti di frequenza limitati a modelli non correlati vengono ignorati per la catena
  provider/modello tentata
- se il blocco rimanente è un limite di frequenza limitato al modello corrispondente, OpenClaw
  riporta l'ultima scadenza corrispondente che blocca ancora quel modello

## Config correlata

Vedi [Configurazione del gateway](/it/gateway/configuration) per:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- instradamento di `agents.defaults.imageModel`

Vedi [Modelli](/it/concepts/models) per la panoramica più ampia sulla selezione del modello e sul fallback.
