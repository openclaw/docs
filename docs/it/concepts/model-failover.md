---
read_when:
    - Diagnosticare la rotazione dei profili di autenticazione, i cooldown o il comportamento di fallback del modello
    - Aggiornare le regole di failover per i profili di autenticazione o i modelli
    - Comprendere come gli override del modello di sessione interagiscono con i tentativi di fallback
summary: Come OpenClaw ruota i profili di autenticazione e usa il fallback tra i modelli
title: Failover del modello
x-i18n:
    generated_at: "2026-04-05T13:50:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 899041aa0854e4f347343797649fd11140a01e069e88b1fbc0a76e6b375f6c96
    source_path: concepts/model-failover.md
    workflow: 15
---

# Failover del modello

OpenClaw gestisce i guasti in due fasi:

1. **Rotazione del profilo di autenticazione** all'interno del provider corrente.
2. **Fallback del modello** al modello successivo in `agents.defaults.model.fallbacks`.

Questo documento spiega le regole di runtime e i dati che le supportano.

## Flusso di runtime

Per una normale esecuzione testuale, OpenClaw valuta i candidati in questo ordine:

1. Il modello di sessione attualmente selezionato.
2. I `agents.defaults.model.fallbacks` configurati in ordine.
3. Il modello primario configurato alla fine, quando l'esecuzione è partita da un override.

All'interno di ciascun candidato, OpenClaw prova il failover del profilo di autenticazione prima di passare
al candidato modello successivo.

Sequenza ad alto livello:

1. Risolve il modello di sessione attivo e la preferenza del profilo di autenticazione.
2. Costruisce la catena dei candidati modello.
3. Prova il provider corrente con le regole di rotazione/cooldown del profilo di autenticazione.
4. Se quel provider è esaurito con un errore che giustifica il failover, passa al candidato
   modello successivo.
5. Rende persistente l'override di fallback selezionato prima che inizi il retry, in modo che altri
   lettori della sessione vedano lo stesso provider/modello che il runner sta per usare.
6. Se il candidato di fallback fallisce, esegue il rollback solo dei campi di override della sessione
   posseduti dal fallback quando corrispondono ancora a quel candidato fallito.
7. Se tutti i candidati falliscono, genera un `FallbackSummaryError` con dettagli per tentativo
   e la scadenza di cooldown più vicina quando è nota.

Questo è intenzionalmente più ristretto di "salvare e ripristinare l'intera sessione". Il
reply runner rende persistenti solo i campi di selezione del modello di sua competenza per il fallback:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Questo impedisce che un retry di fallback fallito sovrascriva mutazioni di sessione più recenti e non correlate,
come modifiche manuali di `/model` o aggiornamenti di rotazione della sessione
avvenuti mentre il tentativo era in esecuzione.

## Archiviazione dell'autenticazione (chiavi + OAuth)

OpenClaw usa **profili di autenticazione** sia per le chiavi API sia per i token OAuth.

- I segreti sono archiviati in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (legacy: `~/.openclaw/agent/auth-profiles.json`).
- La configurazione `auth.profiles` / `auth.order` contiene **solo metadati + instradamento** (nessun segreto).
- File OAuth legacy solo per importazione: `~/.openclaw/credentials/oauth.json` (importato in `auth-profiles.json` al primo utilizzo).

Più dettagli: [/concepts/oauth](/concepts/oauth)

Tipi di credenziali:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` per alcuni provider)

## ID profilo

I login OAuth creano profili distinti in modo che più account possano coesistere.

- Predefinito: `provider:default` quando non è disponibile alcuna email.
- OAuth con email: `provider:<email>` (ad esempio `google-antigravity:user@gmail.com`).

I profili si trovano in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` sotto `profiles`.

## Ordine di rotazione

Quando un provider ha più profili, OpenClaw sceglie un ordine come questo:

1. **Configurazione esplicita**: `auth.order[provider]` (se impostata).
2. **Profili configurati**: `auth.profiles` filtrati per provider.
3. **Profili archiviati**: voci in `auth-profiles.json` per il provider.

Se non è configurato alcun ordine esplicito, OpenClaw usa un ordine round-robin:

- **Chiave primaria:** tipo di profilo (**OAuth prima delle chiavi API**).
- **Chiave secondaria:** `usageStats.lastUsed` (meno recente per primo, all'interno di ciascun tipo).
- I **profili in cooldown/disabilitati** vengono spostati in fondo, ordinati per scadenza più vicina.

### Persistenza di sessione (favorevole alla cache)

OpenClaw **blocca il profilo di autenticazione scelto per sessione** per mantenere calde le cache del provider.
**Non** ruota a ogni richiesta. Il profilo bloccato viene riutilizzato finché:

- la sessione non viene reimpostata (`/new` / `/reset`)
- non viene completata una compattazione (il conteggio di compattazione incrementa)
- il profilo non entra in cooldown/non viene disabilitato

La selezione manuale tramite `/model …@<profileId>` imposta un **override dell'utente** per quella sessione
e non viene ruotata automaticamente finché non inizia una nuova sessione.

I profili bloccati automaticamente (selezionati dal router di sessione) sono trattati come una **preferenza**:
vengono provati per primi, ma OpenClaw può ruotare verso un altro profilo in caso di rate limit/timeout.
I profili bloccati dall'utente restano vincolati a quel profilo; se falliscono e sono configurati fallback di modello,
OpenClaw passa al modello successivo invece di cambiare profilo.

### Perché OAuth può "sembrare perso"

Se hai sia un profilo OAuth sia un profilo con chiave API per lo stesso provider, il round-robin può alternare
tra loro da un messaggio all'altro a meno che non siano bloccati. Per forzare un singolo profilo:

- Bloccalo con `auth.order[provider] = ["provider:profileId"]`, oppure
- Usa un override per sessione tramite `/model …` con un override del profilo (quando supportato dalla tua UI/superficie chat).

## Cooldown

Quando un profilo fallisce a causa di errori di autenticazione/rate limit (o di un timeout che sembra
un rate limit), OpenClaw lo mette in cooldown e passa al profilo successivo.
Quel bucket di rate limit è più ampio del semplice `429`: include anche messaggi del provider
come `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted` e limiti periodici di finestra d'uso come
`weekly/monthly limit reached`.
Gli errori di formato/richiesta non valida (ad esempio i fallimenti di
validazione dell'ID tool call di Cloud Code Assist) sono trattati come idonei al failover e usano gli stessi cooldown.
Gli errori OpenAI-compatible di stop reason come `Unhandled stop reason: error`,
`stop reason: error` e `reason: error` sono classificati come segnali di timeout/failover.
Anche testo generico di errore server con ambito provider può finire in quel bucket di timeout quando
la sorgente corrisponde a un pattern transitorio noto. Ad esempio, il semplice
`An unknown error occurred` di Anthropic e i payload JSON `api_error` con testo transitorio del server
come `internal server error`, `unknown error, 520`, `upstream error`
o `backend error` sono trattati come timeout idonei al failover. Anche il testo generico upstream specifico di
OpenRouter come `Provider returned error` viene trattato come
timeout solo quando il contesto del provider è effettivamente OpenRouter. Il testo generico di fallback interno
come `LLM request failed with an unknown error.` resta
conservativo e non attiva il failover da solo.

I cooldown dei rate limit possono anche avere ambito modello:

- OpenClaw registra `cooldownModel` per i fallimenti da rate limit quando l'ID
  del modello che ha fallito è noto.
- Un modello fratello sullo stesso provider può ancora essere provato quando il cooldown è
  limitato a un modello diverso.
- Le finestre di billing/disabilitazione continuano invece a bloccare l'intero profilo su tutti i modelli.

I cooldown usano un backoff esponenziale:

- 1 minuto
- 5 minuti
- 25 minuti
- 1 ora (limite massimo)

Lo stato è archiviato in `auth-profiles.json` sotto `usageStats`:

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

## Disabilitazioni per billing

I fallimenti di billing/credito (ad esempio "insufficient credits" / "credit balance too low") sono trattati come idonei al failover, ma di solito non sono transitori. Invece di un breve cooldown, OpenClaw contrassegna il profilo come **disabilitato** (con un backoff più lungo) e passa al profilo/provider successivo.

Non tutte le risposte che sembrano di billing sono `402`, e non tutti gli HTTP `402` finiscono
qui. OpenClaw mantiene il testo di billing esplicito nel percorso billing anche quando un
provider restituisce invece `401` o `403`, ma i matcher specifici del provider restano
limitati al provider che li possiede (ad esempio OpenRouter `403 Key limit
exceeded`). Nel frattempo, gli errori temporanei `402` di finestra d'uso e
di limite di spesa di organizzazione/workspace sono classificati come `rate_limit` quando
il messaggio sembra ritentabile (ad esempio `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow` o `organization spending limit exceeded`).
Questi restano nel percorso di cooldown breve/failover invece del lungo
percorso di disabilitazione per billing.

Lo stato è archiviato in `auth-profiles.json`:

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

- Il backoff di billing parte da **5 ore**, raddoppia a ogni errore di billing e ha un limite massimo di **24 ore**.
- I contatori di backoff si azzerano se il profilo non fallisce per **24 ore** (configurabile).
- I retry per overload consentono **1 rotazione dello stesso provider su un altro profilo** prima del fallback del modello.
- I retry per overload usano per impostazione predefinita un backoff di **0 ms**.

## Fallback del modello

Se tutti i profili per un provider falliscono, OpenClaw passa al modello successivo in
`agents.defaults.model.fallbacks`. Questo si applica a errori di autenticazione, rate limit e
timeout che hanno esaurito la rotazione del profilo (gli altri errori non fanno avanzare il fallback).

Gli errori di overload e rate limit sono gestiti in modo più aggressivo rispetto ai cooldown di billing. Per impostazione predefinita, OpenClaw consente un retry sullo stesso provider con un altro profilo di autenticazione,
poi passa al fallback di modello configurato successivo senza attendere.
I segnali di provider occupato come `ModelNotReadyException` finiscono in quel bucket di overload.
Regola questo comportamento con `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs` e
`auth.cooldowns.rateLimitedProfileRotations`.

Quando un'esecuzione parte con un override di modello (hook o CLI), i fallback terminano comunque su
`agents.defaults.model.primary` dopo aver provato eventuali fallback configurati.

### Regole della catena di candidati

OpenClaw costruisce la lista dei candidati dal `provider/model`
attualmente richiesto più i fallback configurati.

Regole:

- Il modello richiesto è sempre il primo.
- I fallback esplicitamente configurati vengono deduplicati ma non filtrati dalla allowlist
  dei modelli. Sono trattati come un'esplicita intenzione dell'operatore.
- Se l'esecuzione corrente è già su un fallback configurato nella stessa famiglia di provider,
  OpenClaw continua a usare l'intera catena configurata.
- Se l'esecuzione corrente è su un provider diverso dalla configurazione e quel
  modello corrente non fa già parte della catena di fallback configurata, OpenClaw non
  aggiunge fallback configurati non correlati da un altro provider.
- Quando l'esecuzione è partita da un override, il primario configurato viene aggiunto alla
  fine in modo che la catena possa tornare al normale valore predefinito una volta esauriti
  i candidati precedenti.

### Quali errori fanno avanzare il fallback

Il fallback del modello continua in presenza di:

- errori di autenticazione
- rate limit ed esaurimento del cooldown
- errori di overload/provider occupato
- errori di failover con forma di timeout
- disabilitazioni per billing
- `LiveSessionModelSwitchError`, che viene normalizzato in un percorso di failover così che un
  modello persistente obsoleto non crei un ciclo di retry esterno
- altri errori non riconosciuti quando ci sono ancora candidati rimanenti

Il fallback del modello non continua in presenza di:

- interruzioni esplicite che non hanno forma di timeout/failover
- errori di overflow del contesto che devono restare nella logica di compattazione/retry
  (ad esempio `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model` o `ollama error: context
length exceeded`)
- un errore finale sconosciuto quando non restano candidati

### Comportamento di salto del cooldown vs probe

Quando tutti i profili di autenticazione per un provider sono già in cooldown, OpenClaw
non salta automaticamente quel provider per sempre. Prende una decisione per candidato:

- I fallimenti persistenti di autenticazione saltano immediatamente l'intero provider.
- Le disabilitazioni per billing di solito vengono saltate, ma il candidato primario può ancora essere sondato
  con una limitazione di frequenza, in modo che il recupero sia possibile senza riavviare.
- Il candidato primario può essere sondato vicino alla scadenza del cooldown, con una limitazione per provider.
- I modelli fratelli di fallback sullo stesso provider possono essere provati nonostante il cooldown quando il
  guasto sembra transitorio (`rate_limit`, `overloaded` o sconosciuto). Questo è
  particolarmente rilevante quando un rate limit è limitato al modello e un modello fratello può
  ancora recuperare immediatamente.
- I probe di cooldown transitori sono limitati a uno per provider per esecuzione di fallback, così
  che un singolo provider non blocchi il fallback tra provider diversi.

## Override di sessione e live model switching

Le modifiche al modello di sessione sono stato condiviso. Il runner attivo, il comando `/model`,
gli aggiornamenti di compattazione/sessione e la riconciliazione della sessione live leggono o scrivono
tutti parti della stessa voce di sessione.

Questo significa che i retry di fallback devono coordinarsi con il live model switching:

- Solo le modifiche esplicite al modello guidate dall'utente contrassegnano un pending live switch. Questo
  include `/model`, `session_status(model=...)` e `sessions.patch`.
- Le modifiche al modello guidate dal sistema come rotazione di fallback,
  override heartbeat o compattazione non contrassegnano mai da sole un pending live switch.
- Prima che inizi un retry di fallback, il reply runner rende persistenti i campi di override del fallback
  selezionato nella voce di sessione.
- La riconciliazione della sessione live preferisce gli override persistenti della sessione rispetto ai campi
  runtime del modello obsoleti.
- Se il tentativo di fallback fallisce, il runner esegue il rollback solo dei campi di override
  che ha scritto, e solo se corrispondono ancora a quel candidato fallito.

Questo impedisce la classica race condition:

1. Il primario fallisce.
2. Il candidato di fallback viene scelto in memoria.
3. L'archivio della sessione dice ancora il vecchio primario.
4. La riconciliazione della sessione live legge lo stato obsoleto della sessione.
5. Il retry viene riportato al vecchio modello prima che inizi il tentativo di fallback.

Il fallback persistente chiude questa finestra, e il rollback ristretto
mantiene intatte le modifiche di sessione più recenti, manuali o di runtime.

## Osservabilità e riepiloghi dei guasti

`runWithModelFallback(...)` registra dettagli per tentativo che alimentano i log e
la messaggistica di cooldown rivolta all'utente:

- provider/modello tentato
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` e
  motivi di failover simili)
- stato/codice facoltativo
- riepilogo dell'errore leggibile da umani

Quando tutti i candidati falliscono, OpenClaw genera `FallbackSummaryError`. Il
reply runner esterno può usarlo per costruire un messaggio più specifico, come "tutti i modelli
sono temporaneamente soggetti a rate limit", e includere la scadenza di cooldown più vicina quando è nota.

Quel riepilogo del cooldown è consapevole del modello:

- i rate limit limitati a un modello ma non correlati vengono ignorati per la catena
  provider/modello tentata
- se il blocco rimanente è un rate limit limitato a un modello corrispondente, OpenClaw
  segnala l'ultima scadenza corrispondente che continua a bloccare quel modello

## Configurazione correlata

Vedi [Configurazione del Gateway](/gateway/configuration) per:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` routing

Vedi [Models](/concepts/models) per la panoramica più ampia sulla selezione del modello e sul fallback.
