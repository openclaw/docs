---
read_when:
    - Diagnosi della rotazione dei profili di autenticazione, dei cooldown o del comportamento di fallback del modello
    - Aggiornamento delle regole di failover per i profili di autenticazione o i modelli
    - Capire come gli override del modello di sessione interagiscono con i retry di fallback
summary: Come OpenClaw ruota i profili di autenticazione e usa il fallback tra i modelli
title: Failover del modello
x-i18n:
    generated_at: "2026-04-24T08:37:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8921c9edd4699d8c623229cd3c82a92768d720fa9711862c270d6edb665841af
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw gestisce i guasti in due fasi:

1. **Rotazione del profilo di autenticazione** all'interno del provider corrente.
2. **Fallback del modello** al modello successivo in `agents.defaults.model.fallbacks`.

Questo documento spiega le regole di runtime e i dati che le supportano.

## Flusso di runtime

Per una normale esecuzione testuale, OpenClaw valuta i candidati in questo ordine:

1. Il modello di sessione attualmente selezionato.
2. I `agents.defaults.model.fallbacks` configurati in ordine.
3. Il modello primario configurato alla fine quando l'esecuzione è iniziata da un override.

All'interno di ogni candidato, OpenClaw prova il failover del profilo di autenticazione prima di passare
al candidato modello successivo.

Sequenza di alto livello:

1. Risolve il modello di sessione attivo e la preferenza del profilo di autenticazione.
2. Costruisce la catena dei candidati modello.
3. Prova il provider corrente con le regole di rotazione/cooldown del profilo di autenticazione.
4. Se quel provider è esaurito con un errore che giustifica il failover, passa al
   candidato modello successivo.
5. Persiste l'override del fallback selezionato prima che inizi il retry, così gli altri
   lettori della sessione vedano lo stesso provider/modello che il runner sta per usare.
6. Se il candidato di fallback fallisce, esegue il rollback solo dei campi di override della sessione
   posseduti dal fallback quando corrispondono ancora a quel candidato fallito.
7. Se ogni candidato fallisce, genera un `FallbackSummaryError` con dettagli
   per tentativo e la scadenza di cooldown più vicina quando è nota.

Questo è intenzionalmente più ristretto di "salva e ripristina l'intera sessione". Il
runner della risposta persiste solo i campi di selezione del modello che possiede per il fallback:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Questo impedisce che un retry di fallback fallito sovrascriva mutazioni di sessione più recenti e non correlate
come modifiche manuali di `/model` o aggiornamenti di rotazione della sessione che
sono avvenuti mentre il tentativo era in esecuzione.

## Archiviazione dell'autenticazione (chiavi + OAuth)

OpenClaw usa **profili di autenticazione** sia per le chiavi API sia per i token OAuth.

- I segreti vivono in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (legacy: `~/.openclaw/agent/auth-profiles.json`).
- Lo stato di runtime dell'instradamento auth vive in `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- La configurazione `auth.profiles` / `auth.order` è solo **metadati + instradamento** (nessun segreto).
- File OAuth legacy solo per importazione: `~/.openclaw/credentials/oauth.json` (importato in `auth-profiles.json` al primo utilizzo).

Più dettagli: [/concepts/oauth](/it/concepts/oauth)

Tipi di credenziali:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` per alcuni provider)

## ID dei profili

Gli accessi OAuth creano profili distinti così più account possono coesistere.

- Predefinito: `provider:default` quando non è disponibile alcuna email.
- OAuth con email: `provider:<email>` (ad esempio `google-antigravity:user@gmail.com`).

I profili vivono in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` sotto `profiles`.

## Ordine di rotazione

Quando un provider ha più profili, OpenClaw sceglie un ordine così:

1. **Configurazione esplicita**: `auth.order[provider]` (se impostato).
2. **Profili configurati**: `auth.profiles` filtrati per provider.
3. **Profili archiviati**: voci in `auth-profiles.json` per il provider.

Se non è configurato alcun ordine esplicito, OpenClaw usa un ordine round-robin:

- **Chiave primaria:** tipo di profilo (**OAuth prima delle chiavi API**).
- **Chiave secondaria:** `usageStats.lastUsed` (più vecchio prima, all'interno di ciascun tipo).
- I **profili in cooldown/disabilitati** vengono spostati alla fine, ordinati per scadenza più vicina.

### Sticky della sessione (cache-friendly)

OpenClaw **fissa il profilo di autenticazione scelto per sessione** per mantenere calde le cache del provider.
**Non** ruota a ogni richiesta. Il profilo fissato viene riutilizzato finché:

- la sessione non viene reimpostata (`/new` / `/reset`)
- una Compaction non viene completata (il conteggio della compaction incrementa)
- il profilo non entra in cooldown/disabilitato

La selezione manuale tramite `/model …@<profileId>` imposta un **override utente** per quella sessione
e non viene ruotata automaticamente finché non inizia una nuova sessione.

I profili fissati automaticamente (selezionati dal router di sessione) sono trattati come una **preferenza**:
vengono provati per primi, ma OpenClaw può ruotare a un altro profilo in caso di rate limit/timeout.
I profili fissati dall'utente restano bloccati su quel profilo; se falliscono e i fallback del modello
sono configurati, OpenClaw passa al modello successivo invece di cambiare profilo.

### Perché OAuth può "sembrare perso"

Se hai sia un profilo OAuth sia un profilo chiave API per lo stesso provider, il round-robin può passare dall'uno all'altro tra i messaggi a meno che non siano fissati. Per forzare un singolo profilo:

- Fissalo con `auth.order[provider] = ["provider:profileId"]`, oppure
- Usa un override per sessione tramite `/model …` con un override del profilo (quando supportato dalla tua superficie UI/chat).

## Cooldown

Quando un profilo fallisce a causa di errori di autenticazione/rate limit (o di un timeout che
sembra rate limiting), OpenClaw lo mette in cooldown e passa al profilo successivo.
Quel bucket di rate limit è più ampio del semplice `429`: include anche messaggi del provider
come `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted` e limiti periodici di finestra d'uso come
`weekly/monthly limit reached`.
Gli errori di formato/richiesta non valida (ad esempio errori di
validazione dell'ID di chiamata tool di Cloud Code Assist) sono trattati come idonei al failover e usano gli stessi cooldown.
Gli errori di stop-reason OpenAI-compatible come `Unhandled stop reason: error`,
`stop reason: error` e `reason: error` sono classificati come segnali
di timeout/failover.
Anche testo generico di errore server con ambito provider può finire in quel bucket di timeout quando
la sorgente corrisponde a un pattern transitorio noto. Ad esempio, su Anthropic il semplice
`An unknown error occurred` e i payload JSON `api_error` con testo server transitorio
come `internal server error`, `unknown error, 520`, `upstream error`
o `backend error` sono trattati come timeout idonei al failover. Anche il testo generico upstream specifico di OpenRouter come semplice `Provider returned error` viene trattato come
timeout solo quando il contesto provider è effettivamente OpenRouter. Testo di fallback interno generico
come `LLM request failed with an unknown error.` resta
conservativo e non attiva da solo il failover.

Alcuni SDK provider potrebbero altrimenti andare in sleep per una lunga finestra `Retry-After` prima di
restituire il controllo a OpenClaw. Per gli SDK basati su Stainless come Anthropic e
OpenAI, OpenClaw limita per impostazione predefinita le attese interne all'SDK `retry-after-ms` / `retry-after` a 60
secondi e fa emergere immediatamente le risposte retryable più lunghe così questo
percorso di failover può essere eseguito. Regola o disabilita il limite con
`OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; vedi [/concepts/retry](/it/concepts/retry).

I cooldown del rate limit possono anche avere ambito modello:

- OpenClaw registra `cooldownModel` per i guasti da rate limit quando l'ID
  del modello che fallisce è noto.
- Un modello sibling sullo stesso provider può comunque essere provato quando il cooldown è
  limitato a un modello diverso.
- Le finestre di billing/disabilitazione bloccano comunque l'intero profilo tra i modelli.

I cooldown usano exponential backoff:

- 1 minuto
- 5 minuti
- 25 minuti
- 1 ora (limite massimo)

Lo stato è memorizzato in `auth-state.json` sotto `usageStats`:

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

I guasti di billing/credito (ad esempio “insufficient credits” / “credit balance too low”) sono trattati come idonei al failover, ma di solito non sono transitori. Invece di un breve cooldown, OpenClaw contrassegna il profilo come **disabilitato** (con un backoff più lungo) e ruota al profilo/provider successivo.

Non ogni risposta con forma simile a billing è `402`, e non ogni HTTP `402` finisce
qui. OpenClaw mantiene il testo esplicito di billing nel percorso billing anche quando un
provider restituisce invece `401` o `403`, ma i matcher specifici del provider restano
limitati al provider che li possiede (ad esempio OpenRouter `403 Key limit
exceeded`). Nel frattempo, gli errori temporanei `402` di finestra d'uso e
di limite di spesa di organizzazione/workspace sono classificati come `rate_limit` quando
il messaggio sembra retryable (ad esempio `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow` o `organization spending limit exceeded`).
Questi restano nel percorso di cooldown/failover breve invece che nel lungo
percorso di disabilitazione billing.

Lo stato è memorizzato in `auth-state.json`:

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

- Il backoff di billing parte da **5 ore**, raddoppia a ogni errore di billing e raggiunge un massimo di **24 ore**.
- I contatori di backoff si reimpostano se il profilo non ha fallito per **24 ore** (configurabile).
- I retry per overloaded consentono **1 rotazione dello stesso provider profile** prima del fallback del modello.
- I retry per overloaded usano per impostazione predefinita **0 ms di backoff**.

## Fallback del modello

Se tutti i profili di un provider falliscono, OpenClaw passa al modello successivo in
`agents.defaults.model.fallbacks`. Questo si applica a errori di autenticazione, rate limit e
timeout che hanno esaurito la rotazione del profilo (altri errori non fanno avanzare il fallback).

Gli errori overloaded e rate-limit vengono gestiti in modo più aggressivo rispetto ai cooldown di billing.
Per impostazione predefinita, OpenClaw consente un retry dello stesso provider auth-profile,
poi passa al modello di fallback configurato successivo senza attendere.
Segnali di provider occupato come `ModelNotReadyException` rientrano in quel bucket overloaded.
Regolalo con `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs` e
`auth.cooldowns.rateLimitedProfileRotations`.

Quando un'esecuzione inizia con un override del modello (hook o CLI), i fallback finiscono comunque in
`agents.defaults.model.primary` dopo aver provato eventuali fallback configurati.

### Regole della catena dei candidati

OpenClaw costruisce l'elenco dei candidati dal `provider/model` attualmente richiesto
più i fallback configurati.

Regole:

- Il modello richiesto è sempre il primo.
- I fallback configurati espliciti vengono deduplicati ma non filtrati dalla allowlist
  del modello. Sono trattati come intenzione esplicita dell'operatore.
- Se l'esecuzione corrente è già su un fallback configurato nella stessa famiglia di provider,
  OpenClaw continua a usare l'intera catena configurata.
- Se l'esecuzione corrente è su un provider diverso dalla configurazione e quel modello corrente
  non fa già parte della catena di fallback configurata, OpenClaw non aggiunge
  fallback configurati non correlati da un altro provider.
- Quando l'esecuzione è iniziata da un override, il primario configurato viene aggiunto alla
  fine così la catena può riassestarsi sul normale predefinito una volta esauriti
  i candidati precedenti.

### Quali errori fanno avanzare il fallback

Il fallback del modello continua su:

- errori di autenticazione
- rate limit ed esaurimento del cooldown
- errori overloaded/provider-busy
- errori di failover con forma di timeout
- disabilitazioni per billing
- `LiveSessionModelSwitchError`, che viene normalizzato in un percorso di failover così un
  modello persistito stale non crea un ciclo di retry esterno
- altri errori non riconosciuti quando ci sono ancora candidati rimanenti

Il fallback del modello non continua su:

- abort espliciti che non hanno forma di timeout/failover
- errori di overflow del contesto che dovrebbero restare all'interno della logica di Compaction/retry
  (ad esempio `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model` o `ollama error: context
length exceeded`)
- un errore finale sconosciuto quando non restano candidati

### Comportamento di skip vs probe del cooldown

Quando ogni profilo di autenticazione per un provider è già in cooldown, OpenClaw non
salta automaticamente quel provider per sempre. Prende una decisione per candidato:

- I guasti di autenticazione persistenti saltano immediatamente l'intero provider.
- Le disabilitazioni per billing di solito vengono saltate, ma il candidato primario può ancora essere sottoposto a probe
  con throttling così il recupero è possibile senza riavviare.
- Il candidato primario può essere sottoposto a probe vicino alla scadenza del cooldown, con un throttle
  per provider.
- I modelli sibling di fallback dello stesso provider possono essere tentati nonostante il cooldown quando il
  guasto sembra transitorio (`rate_limit`, `overloaded` o sconosciuto). Questo è
  particolarmente rilevante quando un rate limit ha ambito modello e un modello sibling può
  ancora recuperare immediatamente.
- Le probe di cooldown transitorie sono limitate a una per provider per esecuzione di fallback, così
  un singolo provider non blocca il fallback cross-provider.

## Override di sessione e live model switching

Le modifiche al modello della sessione sono stato condiviso. Il runner attivo, il comando `/model`,
gli aggiornamenti di Compaction/sessione e la riconciliazione live-session leggono o scrivono tutti
parti della stessa voce di sessione.

Questo significa che i retry di fallback devono coordinarsi con il live model switching:

- Solo le modifiche del modello guidate esplicitamente dall'utente contrassegnano un pending live switch. Questo
  include `/model`, `session_status(model=...)` e `sessions.patch`.
- Le modifiche del modello guidate dal sistema come rotazione di fallback, override Heartbeat,
  o Compaction non contrassegnano mai da sole un pending live switch.
- Prima che inizi un retry di fallback, il runner della risposta persiste i campi di override del fallback
  selezionati nella voce di sessione.
- La riconciliazione live-session preferisce gli override della sessione persistiti rispetto ai campi di modello runtime stale.
- Se il tentativo di fallback fallisce, il runner esegue il rollback solo dei campi di override
  che ha scritto, e solo se corrispondono ancora a quel candidato fallito.

Questo impedisce la classica race:

1. Il primario fallisce.
2. Il candidato di fallback viene scelto in memoria.
3. L'archivio della sessione continua a indicare il vecchio primario.
4. La riconciliazione live-session legge lo stato stale della sessione.
5. Il retry viene riportato al vecchio modello prima che inizi il tentativo di fallback.

L'override di fallback persistito chiude quella finestra, e il rollback ristretto
mantiene intatte le modifiche più recenti manuali o runtime della sessione.

## Osservabilità e riepiloghi dei guasti

`runWithModelFallback(...)` registra dettagli per tentativo che alimentano i log e
la messaggistica di cooldown rivolta all'utente:

- provider/modello tentato
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` e
  motivi di failover simili)
- stato/codice facoltativo
- riepilogo dell'errore leggibile per gli umani

Quando ogni candidato fallisce, OpenClaw genera `FallbackSummaryError`. Il runner esterno
della risposta può usarlo per costruire un messaggio più specifico come "tutti i modelli
sono temporaneamente soggetti a rate limit" e includere la scadenza di cooldown più vicina quando è nota.

Quel riepilogo del cooldown è consapevole del modello:

- i rate limit con ambito modello non correlati vengono ignorati per la catena
  provider/modello tentata
- se il blocco rimanente è un rate limit con ambito modello corrispondente, OpenClaw
  riporta l'ultima scadenza corrispondente che continua a bloccare quel modello

## Configurazione correlata

Vedi [Configurazione del Gateway](/it/gateway/configuration) per:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- instradamento `agents.defaults.imageModel`

Vedi [Modelli](/it/concepts/models) per la panoramica più ampia su selezione del modello e fallback.
