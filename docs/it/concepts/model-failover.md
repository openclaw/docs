---
read_when:
    - Diagnosi della rotazione dei profili di autenticazione, dei cooldown o del comportamento di fallback del modello
    - Aggiornamento delle regole di failover per profili di autenticazione o modelli
    - Capire come gli override del modello di sessione interagiscono con i tentativi di fallback
summary: Come OpenClaw ruota i profili di autenticazione e usa i fallback tra i modelli
title: Failover del modello
x-i18n:
    generated_at: "2026-04-23T08:28:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c1f06d5371379cc59998e1cd6f52d250e8c4eba4e7dbfef776a090899b8d3c4
    source_path: concepts/model-failover.md
    workflow: 15
---

# Failover del modello

OpenClaw gestisce i guasti in due fasi:

1. **Rotazione dei profili di autenticazione** all'interno del provider corrente.
2. **Fallback del modello** al modello successivo in `agents.defaults.model.fallbacks`.

Questo documento spiega le regole di runtime e i dati che le supportano.

## Flusso di runtime

Per una normale esecuzione di testo, OpenClaw valuta i candidati in questo ordine:

1. Il modello di sessione attualmente selezionato.
2. I `agents.defaults.model.fallbacks` configurati, in ordine.
3. Il modello primario configurato alla fine quando l'esecuzione è iniziata da un override.

All'interno di ciascun candidato, OpenClaw prova il failover del profilo di autenticazione prima di passare
al candidato modello successivo.

Sequenza ad alto livello:

1. Risolve il modello di sessione attivo e la preferenza del profilo di autenticazione.
2. Costruisce la catena dei candidati modello.
3. Prova il provider corrente con le regole di rotazione/cooldown del profilo di autenticazione.
4. Se quel provider è esaurito con un errore idoneo al failover, passa al
   candidato modello successivo.
5. Mantiene l'override di fallback selezionato prima che inizi il retry così che altri
   lettori della sessione vedano lo stesso provider/modello che il runner sta per usare.
6. Se il candidato di fallback fallisce, annulla solo i campi di override della sessione
   posseduti dal fallback quando corrispondono ancora a quel candidato fallito.
7. Se ogni candidato fallisce, genera un `FallbackSummaryError` con dettagli
   per ogni tentativo e la prima scadenza di cooldown nota, se disponibile.

Questo è intenzionalmente più ristretto di "salvare e ripristinare l'intera sessione". Il
runner delle risposte mantiene solo i campi di selezione del modello di sua competenza per il fallback:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Questo impedisce che un retry di fallback fallito sovrascriva mutazioni di sessione più recenti e non correlate,
come modifiche manuali di `/model` o aggiornamenti di rotazione della sessione avvenuti mentre
il tentativo era in esecuzione.

## Archiviazione auth (chiavi + OAuth)

OpenClaw usa **profili di autenticazione** sia per chiavi API sia per token OAuth.

- I segreti si trovano in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (legacy: `~/.openclaw/agent/auth-profiles.json`).
- Lo stato di routing auth del runtime si trova in `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Config `auth.profiles` / `auth.order` sono **solo metadati + routing** (nessun segreto).
- File OAuth legacy solo importazione: `~/.openclaw/credentials/oauth.json` (importato in `auth-profiles.json` al primo utilizzo).

Maggiori dettagli: [/concepts/oauth](/it/concepts/oauth)

Tipi di credenziali:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` per alcuni provider)

## ID profilo

I login OAuth creano profili distinti così che più account possano coesistere.

- Predefinito: `provider:default` quando non è disponibile alcuna email.
- OAuth con email: `provider:<email>` (ad esempio `google-antigravity:user@gmail.com`).

I profili si trovano in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` sotto `profiles`.

## Ordine di rotazione

Quando un provider ha più profili, OpenClaw sceglie un ordine così:

1. **Configurazione esplicita**: `auth.order[provider]` (se impostato).
2. **Profili configurati**: `auth.profiles` filtrati per provider.
3. **Profili memorizzati**: voci in `auth-profiles.json` per il provider.

Se non è configurato alcun ordine esplicito, OpenClaw usa un ordine round-robin:

- **Chiave primaria:** tipo di profilo (**OAuth prima delle chiavi API**).
- **Chiave secondaria:** `usageStats.lastUsed` (più vecchio per primo, all'interno di ciascun tipo).
- I **profili in cooldown/disabilitati** vengono spostati alla fine, ordinati per scadenza più vicina.

### Affinità della sessione (favorevole alla cache)

OpenClaw **fissa il profilo di autenticazione scelto per sessione** per mantenere calde le cache del provider.
**Non** ruota a ogni richiesta. Il profilo fissato viene riutilizzato fino a quando:

- la sessione viene reimpostata (`/new` / `/reset`)
- si completa una Compaction (il conteggio di Compaction aumenta)
- il profilo è in cooldown/disabilitato

La selezione manuale tramite `/model …@<profileId>` imposta un **override utente** per quella sessione
e non viene ruotata automaticamente finché non inizia una nuova sessione.

I profili fissati automaticamente (selezionati dal router di sessione) sono trattati come una **preferenza**:
vengono provati per primi, ma OpenClaw può ruotare verso un altro profilo in caso di rate limit/timeout.
I profili fissati dall'utente restano bloccati su quel profilo; se falliscono e sono configurati fallback di modello,
OpenClaw passa al modello successivo invece di cambiare profilo.

### Perché OAuth può "sembrare perso"

Se hai sia un profilo OAuth sia un profilo chiave API per lo stesso provider, il round-robin può alternare tra loro tra un messaggio e l'altro a meno che non siano fissati. Per forzare un singolo profilo:

- Fissalo con `auth.order[provider] = ["provider:profileId"]`, oppure
- Usa un override per sessione tramite `/model …` con un override del profilo (quando supportato dalla tua superficie UI/chat).

## Cooldown

Quando un profilo fallisce per errori auth/rate-limit (o per un timeout che
sembra un rate limiting), OpenClaw lo mette in cooldown e passa al profilo successivo.
Quel bucket di rate-limit è più ampio di un semplice `429`: include anche messaggi del provider
come `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted` e limiti periodici di finestra d'uso come
`weekly/monthly limit reached`.
Gli errori di formato/richiesta non valida (ad esempio errori di
validazione ID chiamata tool di Cloud Code Assist) sono trattati come idonei al failover e usano gli stessi cooldown.
Gli errori OpenAI-compatible sul motivo di arresto come `Unhandled stop reason: error`,
`stop reason: error` e `reason: error` sono classificati come segnali di timeout/failover.
Anche testo generico di errore server con ambito provider può finire in quel bucket di timeout quando
la fonte corrisponde a un pattern transitorio noto. Ad esempio, in Anthropic
`An unknown error occurred` senza contesto e payload JSON `api_error` con testo server transitorio
come `internal server error`, `unknown error, 520`, `upstream error`
o `backend error` sono trattati come timeout idonei al failover. Anche testo generico upstream specifico OpenRouter
come `Provider returned error` senza contesto viene trattato come
timeout solo quando il contesto provider è effettivamente OpenRouter. Testo generico interno
di fallback come `LLM request failed with an unknown error.` resta
conservativo e da solo non attiva il failover.

Alcuni SDK provider potrebbero altrimenti sospendersi per una lunga finestra `Retry-After` prima di
restituire il controllo a OpenClaw. Per SDK basati su Stainless come Anthropic e
OpenAI, OpenClaw limita per impostazione predefinita le attese interne SDK `retry-after-ms` / `retry-after` a 60
secondi e rende immediatamente visibili le risposte ritentabili più lunghe così che questo
percorso di failover possa essere eseguito. Regola o disabilita il limite con
`OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; vedi [/concepts/retry](/it/concepts/retry).

I cooldown per rate-limit possono anche avere ambito modello:

- OpenClaw registra `cooldownModel` per i guasti da rate-limit quando il
  modello che ha fallito è noto.
- Un modello sibling sullo stesso provider può ancora essere provato quando il cooldown è
  limitato a un modello diverso.
- Le finestre billing/disabilitazione bloccano comunque l'intero profilo su tutti i modelli.

I cooldown usano backoff esponenziale:

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

I guasti di billing/credito (ad esempio “insufficient credits” / “credit balance too low”) sono trattati come idonei al failover, ma di solito non sono transitori. Invece di un breve cooldown, OpenClaw contrassegna il profilo come **disabilitato** (con un backoff più lungo) e ruota verso il profilo/provider successivo.

Non ogni risposta che sembra di billing è `402`, e non ogni HTTP `402` finisce
qui. OpenClaw mantiene testo di billing esplicito nella corsia billing anche quando un
provider restituisce invece `401` o `403`, ma i matcher specifici del provider restano
limitati al provider a cui appartengono (ad esempio OpenRouter `403 Key limit
exceeded`). Nel frattempo, errori temporanei `402` di finestra d'uso e
limiti di spesa di organizzazione/workspace sono classificati come `rate_limit` quando
il messaggio sembra ritentabile (ad esempio `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow` o `organization spending limit exceeded`).
Questi restano sul percorso di cooldown/failover breve invece che sul lungo
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

- Il backoff billing parte da **5 ore**, raddoppia a ogni errore billing e raggiunge un massimo di **24 ore**.
- I contatori di backoff si azzerano se il profilo non fallisce per **24 ore** (configurabile).
- I retry per overload consentono **1 rotazione dello stesso profilo provider** prima del fallback del modello.
- I retry per overload usano per impostazione predefinita **0 ms di backoff**.

## Fallback del modello

Se tutti i profili per un provider falliscono, OpenClaw passa al modello successivo in
`agents.defaults.model.fallbacks`. Questo si applica a errori auth, rate limit e
timeout che hanno esaurito la rotazione del profilo (gli altri errori non avanzano il fallback).

Gli errori di overload e rate-limit vengono gestiti in modo più aggressivo rispetto ai cooldown di billing.
Per impostazione predefinita, OpenClaw consente un retry dello stesso provider con un altro profilo auth,
poi passa senza attesa al fallback di modello configurato successivo.
I segnali di provider occupato come `ModelNotReadyException` rientrano in quel bucket di overload.
Regola questo comportamento con `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs` e
`auth.cooldowns.rateLimitedProfileRotations`.

Quando un'esecuzione inizia con un override del modello (hook o CLI), i fallback terminano comunque in
`agents.defaults.model.primary` dopo aver provato eventuali fallback configurati.

### Regole della catena dei candidati

OpenClaw costruisce la lista dei candidati a partire dal `provider/model`
attualmente richiesto più i fallback configurati.

Regole:

- Il modello richiesto è sempre il primo.
- I fallback espliciti configurati vengono deduplicati ma non filtrati dalla allowlist
  dei modelli. Sono trattati come intenzione esplicita dell'operatore.
- Se l'esecuzione corrente è già su un fallback configurato della stessa famiglia provider,
  OpenClaw continua a usare l'intera catena configurata.
- Se l'esecuzione corrente è su un provider diverso dalla configurazione e quel modello
  corrente non fa già parte della catena di fallback configurata, OpenClaw non
  aggiunge fallback configurati non correlati di un altro provider.
- Quando l'esecuzione è iniziata da un override, il primario configurato viene aggiunto alla
  fine così la catena può tornare al normale predefinito una volta esauriti i
  candidati precedenti.

### Quali errori fanno avanzare il fallback

Il fallback del modello continua in caso di:

- errori di autenticazione
- rate limit ed esaurimento del cooldown
- errori overload/provider occupato
- errori di timeout idonei al failover
- disabilitazioni per billing
- `LiveSessionModelSwitchError`, che viene normalizzato in un percorso di failover così che un
  modello persistito obsoleto non crei un loop di retry esterno
- altri errori non riconosciuti quando ci sono ancora candidati rimanenti

Il fallback del modello non continua in caso di:

- abort espliciti che non sono timeout/errori idonei al failover
- errori di overflow del contesto che devono restare nella logica interna di Compaction/retry
  (ad esempio `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model` o `ollama error: context
length exceeded`)
- un errore finale sconosciuto quando non restano candidati

### Comportamento skip vs probe del cooldown

Quando ogni profilo di autenticazione per un provider è già in cooldown, OpenClaw non
salta automaticamente quel provider per sempre. Prende una decisione per candidato:

- I guasti di autenticazione persistenti saltano immediatamente l'intero provider.
- Le disabilitazioni per billing di solito causano lo skip, ma il candidato primario può ancora essere sondato
  con throttling così il recupero è possibile senza riavviare.
- Il candidato primario può essere sondato vicino alla scadenza del cooldown, con un throttle
  per provider.
- I modelli sibling di fallback dello stesso provider possono essere tentati nonostante il cooldown quando il
  guasto sembra transitorio (`rate_limit`, `overloaded` o sconosciuto). Questo è
  particolarmente rilevante quando un rate limit ha ambito modello e un modello sibling può
  ancora recuperare immediatamente.
- I probe di cooldown transitori sono limitati a uno per provider per esecuzione di fallback così
  un singolo provider non blocca il fallback cross-provider.

## Override di sessione e cambio modello live

I cambi di modello di sessione sono stato condiviso. Il runner attivo, il comando
`/model`, gli aggiornamenti di Compaction/sessione e la riconciliazione della sessione live leggono o scrivono
tutti parti della stessa voce di sessione.

Questo significa che i retry di fallback devono coordinarsi con il cambio modello live:

- Solo i cambi di modello espliciti guidati dall'utente segnano un pending live switch. Questo
  include `/model`, `session_status(model=...)` e `sessions.patch`.
- I cambi di modello guidati dal sistema come rotazione di fallback, override di Heartbeat
  o Compaction non segnano mai da soli un pending live switch.
- Prima che inizi un retry di fallback, il runner delle risposte mantiene i campi di override
  del fallback selezionato nella voce di sessione.
- La riconciliazione della sessione live preferisce gli override di sessione persistiti ai campi modello
  di runtime obsoleti.
- Se il tentativo di fallback fallisce, il runner annulla solo i campi di override
  che ha scritto, e solo se corrispondono ancora a quel candidato fallito.

Questo evita la classica race:

1. Il primario fallisce.
2. Un candidato di fallback viene scelto in memoria.
3. Lo store della sessione continua a indicare il vecchio primario.
4. La riconciliazione della sessione live legge lo stato di sessione obsoleto.
5. Il retry torna al vecchio modello prima che inizi il tentativo di fallback.

L'override di fallback persistito chiude questa finestra, e il rollback ristretto
mantiene intatti i cambi di sessione manuali o di runtime più recenti.

## Osservabilità e riepiloghi dei guasti

`runWithModelFallback(...)` registra dettagli per tentativo che alimentano log e
messaggi di cooldown visibili all'utente:

- provider/modello tentato
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` e
  motivi di failover simili)
- stato/codice facoltativo
- riepilogo dell'errore leggibile da umani

Quando ogni candidato fallisce, OpenClaw genera `FallbackSummaryError`. Il runner esterno
delle risposte può usarlo per costruire un messaggio più specifico come "tutti i modelli
sono temporaneamente soggetti a rate limit" e includere la prima scadenza di cooldown nota, se disponibile.

Quel riepilogo del cooldown è consapevole del modello:

- i rate limit con ambito modello non correlati vengono ignorati per la catena
  provider/modello tentata
- se il blocco rimanente è un rate limit con ambito modello corrispondente, OpenClaw
  riporta l'ultima scadenza corrispondente che blocca ancora quel modello

## Configurazione correlata

Vedi [Configurazione del Gateway](/it/gateway/configuration) per:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- instradamento `agents.defaults.imageModel`

Vedi [Models](/it/concepts/models) per la panoramica più ampia sulla selezione del modello e sul fallback.
