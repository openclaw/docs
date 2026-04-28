---
read_when:
    - Diagnosi della rotazione dei profili di autenticazione, dei cooldown o del comportamento di fallback del modello
    - Aggiornamento delle regole di failover per i profili di autenticazione o i modelli
    - Comprendere come gli override del modello di sessione interagiscono con i tentativi di fallback
sidebarTitle: Model failover
summary: Come OpenClaw ruota i profili di autenticazione ed esegue il fallback tra i modelli
title: Failover del modello
x-i18n:
    generated_at: "2026-04-26T11:27:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e681a456f75073bb34e7af94234efeee57c6c25e9414da19eb9527ccba5444a
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw gestisce gli errori in due fasi:

1. **Rotazione del profilo di autenticazione** all'interno del provider corrente.
2. **Fallback del modello** al modello successivo in `agents.defaults.model.fallbacks`.

Questo documento spiega le regole di runtime e i dati che le supportano.

## Flusso di runtime

Per una normale esecuzione testuale, OpenClaw valuta i candidati in questo ordine:

<Steps>
  <Step title="Risolvi lo stato della sessione">
    Risolve il modello di sessione attivo e la preferenza del profilo di autenticazione.
  </Step>
  <Step title="Costruisci la catena di candidati">
    Costruisce la catena dei modelli candidati a partire dal modello di sessione attualmente selezionato, poi `agents.defaults.model.fallbacks` nell'ordine, terminando con il primary configurato quando l'esecuzione è iniziata da un override.
  </Step>
  <Step title="Prova il provider corrente">
    Prova il provider corrente con le regole di rotazione/cooldown del profilo di autenticazione.
  </Step>
  <Step title="Avanza sugli errori idonei al failover">
    Se quel provider viene esaurito con un errore idoneo al failover, passa al candidato modello successivo.
  </Step>
  <Step title="Persiste l'override di fallback">
    Persiste l'override di fallback selezionato prima che inizi il retry, così gli altri lettori della sessione vedano lo stesso provider/modello che il runner sta per usare.
  </Step>
  <Step title="Esegui un rollback ristretto in caso di errore">
    Se il candidato di fallback fallisce, esegue il rollback solo dei campi di override della sessione posseduti dal fallback quando corrispondono ancora a quel candidato fallito.
  </Step>
  <Step title="Lancia FallbackSummaryError se esaurito">
    Se ogni candidato fallisce, lancia un `FallbackSummaryError` con dettagli per tentativo e la scadenza di cooldown più vicina quando nota.
  </Step>
</Steps>

Questo è intenzionalmente più ristretto di "salvare e ripristinare l'intera sessione". Il reply runner persiste solo i campi di selezione del modello di cui è proprietario per il fallback:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Questo impedisce che un retry di fallback fallito sovrascriva mutazioni di sessione più recenti e non correlate, come modifiche manuali `/model` o aggiornamenti di rotazione della sessione avvenuti mentre il tentativo era in esecuzione.

## Archiviazione dell'autenticazione (chiavi + OAuth)

OpenClaw usa **profili di autenticazione** sia per le chiavi API sia per i token OAuth.

- I segreti si trovano in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (legacy: `~/.openclaw/agent/auth-profiles.json`).
- Lo stato di runtime dell'instradamento dell'autenticazione si trova in `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- La configurazione `auth.profiles` / `auth.order` è **solo metadati + instradamento** (nessun segreto).
- File OAuth legacy solo per importazione: `~/.openclaw/credentials/oauth.json` (importato in `auth-profiles.json` al primo utilizzo).

Più dettagli: [OAuth](/it/concepts/oauth)

Tipi di credenziali:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` per alcuni provider)

## ID profilo

I login OAuth creano profili distinti così più account possono coesistere.

- Predefinito: `provider:default` quando non è disponibile alcuna email.
- OAuth con email: `provider:<email>` (ad esempio `google-antigravity:user@gmail.com`).

I profili si trovano in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` sotto `profiles`.

## Ordine di rotazione

Quando un provider ha più profili, OpenClaw sceglie un ordine così:

<Steps>
  <Step title="Configurazione esplicita">
    `auth.order[provider]` (se impostato).
  </Step>
  <Step title="Profili configurati">
    `auth.profiles` filtrati per provider.
  </Step>
  <Step title="Profili archiviati">
    Voci in `auth-profiles.json` per il provider.
  </Step>
</Steps>

Se non è configurato alcun ordine esplicito, OpenClaw usa un ordine round-robin:

- **Chiave primaria:** tipo di profilo (**OAuth prima delle chiavi API**).
- **Chiave secondaria:** `usageStats.lastUsed` (prima i meno recenti, all'interno di ciascun tipo).
- I **profili in cooldown/disabilitati** vengono spostati alla fine, ordinati per scadenza più vicina.

### Persistenza di sessione (cache-friendly)

OpenClaw **fissa il profilo di autenticazione scelto per sessione** per mantenere calde le cache del provider. **Non** ruota a ogni richiesta. Il profilo fissato viene riutilizzato finché:

- la sessione non viene reimpostata (`/new` / `/reset`)
- viene completata una Compaction (il conteggio della Compaction incrementa)
- il profilo è in cooldown/disabilitato

La selezione manuale tramite `/model …@<profileId>` imposta un **override utente** per quella sessione e non viene ruotata automaticamente finché non inizia una nuova sessione.

<Note>
I profili fissati automaticamente (selezionati dal router di sessione) sono trattati come una **preferenza**: vengono provati per primi, ma OpenClaw può ruotare verso un altro profilo in caso di rate limit/timeout. I profili fissati dall'utente restano bloccati su quel profilo; se fallisce e sono configurati fallback del modello, OpenClaw passa al modello successivo invece di cambiare profilo.
</Note>

### Perché OAuth può "sembrare perso"

Se hai sia un profilo OAuth sia un profilo con chiave API per lo stesso provider, il round-robin può alternare tra loro tra un messaggio e l'altro a meno che non siano fissati. Per forzare un singolo profilo:

- Fissalo con `auth.order[provider] = ["provider:profileId"]`, oppure
- Usa un override per sessione tramite `/model …` con un override del profilo (quando supportato dalla tua interfaccia utente/superficie chat).

## Cooldown

Quando un profilo fallisce a causa di errori di autenticazione/rate-limit (o di un timeout che sembra un rate limit), OpenClaw lo mette in cooldown e passa al profilo successivo.

<AccordionGroup>
  <Accordion title="Cosa rientra nel bucket rate-limit / timeout">
    Quel bucket rate-limit è più ampio del semplice `429`: include anche messaggi del provider come `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` e limiti periodici di finestra d'uso come `weekly/monthly limit reached`.

    Gli errori di formato/richiesta non valida (ad esempio errori di validazione dell'ID della chiamata tool di Cloud Code Assist) sono trattati come idonei al failover e usano gli stessi cooldown. Gli errori di stop-reason compatibili con OpenAI come `Unhandled stop reason: error`, `stop reason: error` e `reason: error` sono classificati come segnali di timeout/failover.

    Anche testo generico del server può rientrare in quel bucket timeout quando la sorgente corrisponde a un pattern transitorio noto. Ad esempio, il semplice messaggio pi-ai stream-wrapper `An unknown error occurred` è trattato come idoneo al failover per ogni provider perché pi-ai lo emette quando gli stream del provider terminano con `stopReason: "aborted"` o `stopReason: "error"` senza dettagli specifici. Anche i payload JSON `api_error` con testo transitorio del server come `internal server error`, `unknown error, 520`, `upstream error` o `backend error` sono trattati come timeout idonei al failover.

    Il testo generico upstream specifico di OpenRouter, come il semplice `Provider returned error`, viene trattato come timeout solo quando il contesto provider è effettivamente OpenRouter. Il testo interno generico di fallback come `LLM request failed with an unknown error.` resta conservativo e da solo non attiva il failover.

  </Accordion>
  <Accordion title="Limiti Retry-After dell'SDK">
    Alcuni SDK provider potrebbero altrimenti attendere una lunga finestra `Retry-After` prima di restituire il controllo a OpenClaw. Per gli SDK basati su Stainless come Anthropic e OpenAI, OpenClaw limita per impostazione predefinita le attese interne dell'SDK `retry-after-ms` / `retry-after` a 60 secondi e rende immediatamente visibili le risposte retryable più lunghe così questo percorso di failover può essere eseguito. Regola o disabilita il limite con `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; vedi [Comportamento di retry](/it/concepts/retry).
  </Accordion>
  <Accordion title="Cooldown con scope del modello">
    I cooldown di rate-limit possono anche avere scope sul modello:

    - OpenClaw registra `cooldownModel` per i fallimenti da rate-limit quando l'id del modello che ha fallito è noto.
    - Un modello sibling sullo stesso provider può comunque essere provato quando il cooldown ha scope su un modello diverso.
    - Le finestre di billing/disabilitazione continuano invece a bloccare l'intero profilo su tutti i modelli.

  </Accordion>
</AccordionGroup>

I cooldown usano un backoff esponenziale:

- 1 minuto
- 5 minuti
- 25 minuti
- 1 ora (limite massimo)

Lo stato viene archiviato in `auth-state.json` sotto `usageStats`:

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

I fallimenti di billing/credito (ad esempio "insufficient credits" / "credit balance too low") sono trattati come idonei al failover, ma di solito non sono transitori. Invece di un breve cooldown, OpenClaw contrassegna il profilo come **disabilitato** (con un backoff più lungo) e ruota verso il profilo/provider successivo.

<Note>
Non ogni risposta che sembra di billing è `402`, e non ogni HTTP `402` finisce qui. OpenClaw mantiene testo esplicito di billing nel ramo billing anche quando un provider restituisce invece `401` o `403`, ma i matcher specifici del provider restano limitati al provider che ne è proprietario (ad esempio OpenRouter `403 Key limit exceeded`).

Nel frattempo, gli errori temporanei `402` di finestra d'uso e i limiti di spesa di organizzazione/workspace vengono classificati come `rate_limit` quando il messaggio sembra retryable (ad esempio `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` o `organization spending limit exceeded`). Questi restano sul percorso di breve cooldown/failover invece che sul percorso di lunga disabilitazione per billing.
</Note>

Lo stato viene archiviato in `auth-state.json`:

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

- Il backoff di billing inizia da **5 ore**, raddoppia per ogni errore di billing e ha un limite massimo di **24 ore**.
- I contatori di backoff si azzerano se il profilo non ha fallito per **24 ore** (configurabile).
- I retry overloaded consentono **1 rotazione di profilo sullo stesso provider** prima del fallback del modello.
- I retry overloaded usano un backoff predefinito di **0 ms**.

## Fallback del modello

Se tutti i profili di un provider falliscono, OpenClaw passa al modello successivo in `agents.defaults.model.fallbacks`. Questo vale per errori di autenticazione, rate limit e timeout che hanno esaurito la rotazione dei profili (altri errori non fanno avanzare il fallback).

Gli errori overloaded e rate-limit vengono gestiti in modo più aggressivo rispetto ai cooldown di billing. Per impostazione predefinita, OpenClaw consente una rotazione del profilo di autenticazione sullo stesso provider, poi passa senza attesa al fallback del modello configurato successivo. I segnali di provider occupato come `ModelNotReadyException` rientrano in quel bucket overloaded. Regolalo con `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` e `auth.cooldowns.rateLimitedProfileRotations`.

Quando un'esecuzione inizia con un override del modello (hook o CLI), i fallback terminano comunque a `agents.defaults.model.primary` dopo aver provato gli eventuali fallback configurati.

### Regole della catena di candidati

OpenClaw costruisce l'elenco dei candidati a partire da `provider/model` attualmente richiesto più i fallback configurati.

<AccordionGroup>
  <Accordion title="Regole">
    - Il modello richiesto è sempre il primo.
    - I fallback configurati esplicitamente vengono deduplicati ma non filtrati dalla allowlist del modello. Sono trattati come intenzione esplicita dell'operatore.
    - Se l'esecuzione corrente è già su un fallback configurato nella stessa famiglia di provider, OpenClaw continua a usare l'intera catena configurata.
    - Se l'esecuzione corrente è su un provider diverso dalla configurazione e quel modello corrente non fa già parte della catena di fallback configurata, OpenClaw non aggiunge fallback configurati non correlati da un altro provider.
    - Quando l'esecuzione è iniziata da un override, il primary configurato viene aggiunto in fondo così la catena può assestarsi di nuovo sul normale valore predefinito una volta esauriti i candidati precedenti.

  </Accordion>
</AccordionGroup>

### Quali errori fanno avanzare il fallback

<Tabs>
  <Tab title="Continua in caso di">
    - errori di autenticazione
    - rate limit ed esaurimento del cooldown
    - errori overloaded/provider-busy
    - errori di failover con forma da timeout
    - disabilitazioni per billing
    - `LiveSessionModelSwitchError`, che viene normalizzato in un percorso di failover così un modello persistito obsoleto non crea un loop di retry esterno
    - altri errori non riconosciuti quando ci sono ancora candidati rimanenti

  </Tab>
  <Tab title="Non continua in caso di">
    - interruzioni esplicite che non hanno forma da timeout/failover
    - errori di overflow del contesto che devono restare all'interno della logica di Compaction/retry (ad esempio `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` o `ollama error: context length exceeded`)
    - un errore finale sconosciuto quando non restano candidati

  </Tab>
</Tabs>

### Salto del cooldown vs comportamento di probe

Quando ogni profilo di autenticazione per un provider è già in cooldown, OpenClaw non salta automaticamente quel provider per sempre. Prende una decisione per candidato:

<AccordionGroup>
  <Accordion title="Decisioni per candidato">
    - Gli errori di autenticazione persistenti saltano immediatamente l'intero provider.
    - Le disabilitazioni per billing di solito vengono saltate, ma il candidato primary può comunque essere sondato con throttling così il recupero è possibile senza riavviare.
    - Il candidato primary può essere sondato vicino alla scadenza del cooldown, con un throttle per provider.
    - I sibling di fallback sullo stesso provider possono essere tentati nonostante il cooldown quando il fallimento sembra transitorio (`rate_limit`, `overloaded` o sconosciuto). Questo è particolarmente rilevante quando un rate limit ha scope sul modello e un modello sibling può comunque recuperare immediatamente.
    - I probe di cooldown transitori sono limitati a uno per provider per esecuzione di fallback così un singolo provider non rallenta il fallback cross-provider.

  </Accordion>
</AccordionGroup>

## Override di sessione e cambio modello live

Le modifiche del modello di sessione sono stato condiviso. Il runner attivo, il comando `/model`, gli aggiornamenti di Compaction/sessione e la riconciliazione live della sessione leggono o scrivono tutti parti della stessa voce di sessione.

Questo significa che i retry di fallback devono coordinarsi con il cambio modello live:

- Solo i cambi di modello espliciti guidati dall'utente contrassegnano un pending live switch. Ciò include `/model`, `session_status(model=...)` e `sessions.patch`.
- I cambi di modello guidati dal sistema, come rotazione di fallback, override Heartbeat o Compaction, non contrassegnano mai da soli un pending live switch.
- Prima che inizi un retry di fallback, il reply runner persiste nella voce di sessione i campi di override del fallback selezionato.
- La riconciliazione live della sessione preferisce gli override di sessione persistiti ai campi di modello runtime obsoleti.
- Se il tentativo di fallback fallisce, il runner esegue il rollback solo dei campi di override che ha scritto, e solo se corrispondono ancora a quel candidato fallito.

Questo evita la classica race:

<Steps>
  <Step title="Il primary fallisce">
    Il modello primary selezionato fallisce.
  </Step>
  <Step title="Fallback scelto in memoria">
    Il candidato di fallback viene scelto in memoria.
  </Step>
  <Step title="Lo store di sessione indica ancora il vecchio primary">
    Lo store di sessione riflette ancora il vecchio primary.
  </Step>
  <Step title="La riconciliazione live legge stato obsoleto">
    La riconciliazione live della sessione legge lo stato di sessione obsoleto.
  </Step>
  <Step title="Il retry torna indietro di colpo">
    Il retry torna di colpo al vecchio modello prima che inizi il tentativo di fallback.
  </Step>
</Steps>

L'override di fallback persistito chiude questa finestra, e il rollback ristretto mantiene intatti i cambi di sessione manuali o runtime più recenti.

## Osservabilità e riepiloghi degli errori

`runWithModelFallback(...)` registra dettagli per tentativo che alimentano log e messaggistica dei cooldown rivolta all'utente:

- provider/modello tentato
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` e motivi di failover simili)
- stato/codice facoltativo
- riepilogo dell'errore leggibile dagli esseri umani

Quando ogni candidato fallisce, OpenClaw lancia `FallbackSummaryError`. Il reply runner esterno può usarlo per costruire un messaggio più specifico come "tutti i modelli sono temporaneamente soggetti a rate limit" e includere la scadenza del cooldown più vicina quando nota.

Quel riepilogo del cooldown è consapevole del modello:

- i rate limit con scope su modelli non correlati vengono ignorati per la catena provider/modello tentata
- se il blocco rimanente è un rate limit con scope sul modello corrispondente, OpenClaw riporta l'ultima scadenza corrispondente che blocca ancora quel modello

## Configurazione correlata

Vedi [Configurazione Gateway](/it/gateway/configuration) per:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` routing

Vedi [Modelli](/it/concepts/models) per la panoramica più ampia della selezione del modello e del fallback.
