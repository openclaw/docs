---
read_when:
    - Diagnosi della rotazione dei profili di autenticazione, dei periodi di attesa o del comportamento di ripiego del modello
    - Aggiornamento delle regole di failover per i profili di autenticazione o i modelli
    - Comprendere come le sovrascritture del modello di sessione interagiscono con i ritentativi di ripiego
sidebarTitle: Model failover
summary: Come OpenClaw ruota i profili di autenticazione e ripiega tra i modelli
title: Commutazione di emergenza del modello
x-i18n:
    generated_at: "2026-05-11T20:27:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3983218c9de67bbd100eab655c319ed97350d43e00c826febd47cb014cbe6cf
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw gestisce gli errori in due fasi:

1. **Rotazione del profilo di autenticazione** all'interno del provider corrente.
2. **Fallback del modello** al modello successivo in `agents.defaults.model.fallbacks`.

Questo documento spiega le regole di runtime e i dati che le supportano.

## Flusso di runtime

Per una normale esecuzione testuale, OpenClaw valuta i candidati in questo ordine:

<Steps>
  <Step title="Resolve session state">
    Risolve il modello della sessione attiva e la preferenza del profilo di autenticazione.
  </Step>
  <Step title="Build candidate chain">
    Costruisce la catena dei modelli candidati dalla selezione del modello corrente e dalla policy di fallback per quella fonte di selezione. I default configurati, i primari dei processi cron e i modelli di fallback selezionati automaticamente possono usare i fallback configurati; le selezioni esplicite della sessione utente sono rigide.
  </Step>
  <Step title="Try the current provider">
    Prova il provider corrente con le regole di rotazione/cooldown dei profili di autenticazione.
  </Step>
  <Step title="Advance on failover-worthy errors">
    Se quel provider è esaurito con un errore idoneo al failover, passa al modello candidato successivo.
  </Step>
  <Step title="Persist fallback override">
    Persiste l'override di fallback selezionato prima dell'avvio del nuovo tentativo, così gli altri lettori della sessione vedono lo stesso provider/modello che il runner sta per usare. L'override del modello persistito è contrassegnato con `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Roll back narrowly on failure">
    Se il candidato di fallback fallisce, ripristina solo i campi di override della sessione di proprietà del fallback quando corrispondono ancora a quel candidato fallito.
  </Step>
  <Step title="Throw FallbackSummaryError if exhausted">
    Se ogni candidato fallisce, genera un `FallbackSummaryError` con dettagli per ogni tentativo e la scadenza del cooldown più vicina, quando nota.
  </Step>
</Steps>

Questo è intenzionalmente più circoscritto di "salvare e ripristinare l'intera sessione". Il runner delle risposte persiste solo i campi di selezione del modello di cui è proprietario per il fallback:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Questo impedisce a un nuovo tentativo di fallback fallito di sovrascrivere mutazioni della sessione più recenti e non correlate, come modifiche manuali di `/model` o aggiornamenti della rotazione della sessione avvenuti mentre il tentativo era in esecuzione.

## Policy della fonte di selezione

OpenClaw separa il provider/modello selezionato dal motivo per cui è stato selezionato. Quella fonte controlla se la catena di fallback è consentita:

- **Default configurato**: `agents.defaults.model.primary` usa `agents.defaults.model.fallbacks`.
- **Primario dell'agente**: `agents.list[].model` è rigido, a meno che l'oggetto modello di quell'agente non includa i propri `fallbacks`. Usa `fallbacks: []` per rendere esplicito il comportamento rigido, oppure fornisci un elenco non vuoto per abilitare il fallback del modello per quell'agente.
- **Override di fallback automatico**: un fallback di runtime scrive `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` e il modello di origine selezionato prima di riprovare. Quell'override automatico può continuare a percorrere la catena di fallback configurata e viene cancellato da `/new`, `/reset` e `sessions.reset`. Anche le esecuzioni Heartbeat senza un `heartbeat.model` esplicito cancellano un override automatico diretto quando la sua origine non corrisponde più al default configurato corrente.
- **Override della sessione utente**: `/model`, il selettore del modello, `session_status(model=...)` e `sessions.patch` scrivono `modelOverrideSource: "user"`. È una selezione esatta della sessione. Se il provider/modello selezionato fallisce prima di produrre una risposta, OpenClaw segnala l'errore invece di rispondere da un fallback configurato non correlato.
- **Override di sessione legacy**: le voci di sessione più vecchie possono avere `modelOverride` senza `modelOverrideSource`. OpenClaw le tratta come override utente, così una vecchia selezione esplicita non viene convertita silenziosamente in comportamento di fallback.
- **Modello del payload Cron**: un `payload.model` / `--model` di un processo Cron è un primario del job, non un override della sessione utente. Usa i fallback configurati, a meno che il job non fornisca `payload.fallbacks`; `payload.fallbacks: []` rende rigida l'esecuzione Cron.

## Archiviazione dell'autenticazione (chiavi + OAuth)

OpenClaw usa **profili di autenticazione** sia per le chiavi API sia per i token OAuth.

- I segreti risiedono in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (legacy: `~/.openclaw/agent/auth-profiles.json`).
- Lo stato di routing dell'autenticazione di runtime risiede in `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- La configurazione `auth.profiles` / `auth.order` è **solo metadati + routing** (nessun segreto).
- File OAuth legacy di sola importazione: `~/.openclaw/credentials/oauth.json` (importato in `auth-profiles.json` al primo uso).

Maggiori dettagli: [OAuth](/it/concepts/oauth)

Tipi di credenziali:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` per alcuni provider)

## ID dei profili

Gli accessi OAuth creano profili distinti, così più account possono coesistere.

- Default: `provider:default` quando non è disponibile alcuna email.
- OAuth con email: `provider:<email>` (ad esempio `google-antigravity:user@gmail.com`).

I profili risiedono in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` sotto `profiles`.

## Ordine di rotazione

Quando un provider ha più profili, OpenClaw sceglie un ordine così:

<Steps>
  <Step title="Explicit config">
    `auth.order[provider]` (se impostato).
  </Step>
  <Step title="Configured profiles">
    `auth.profiles` filtrati per provider.
  </Step>
  <Step title="Stored profiles">
    Voci in `auth-profiles.json` per il provider.
  </Step>
</Steps>

Se non è configurato alcun ordine esplicito, OpenClaw usa un ordine round-robin:

- **Chiave primaria:** tipo di profilo (**OAuth prima delle chiavi API**).
- **Chiave secondaria:** `usageStats.lastUsed` (prima il più vecchio, all'interno di ciascun tipo).
- **Profili in cooldown/disabilitati** vengono spostati alla fine, ordinati per scadenza più vicina.

### Persistenza della sessione (favorevole alla cache)

OpenClaw **fissa il profilo di autenticazione scelto per sessione** per mantenere calde le cache del provider. **Non** ruota a ogni richiesta. Il profilo fissato viene riutilizzato finché:

- la sessione viene reimpostata (`/new` / `/reset`)
- una Compaction si completa (il conteggio di Compaction aumenta)
- il profilo è in cooldown/disabilitato

La selezione manuale tramite `/model …@<profileId>` imposta un **override utente** per quella sessione e non viene ruotata automaticamente finché non inizia una nuova sessione.

<Note>
I profili fissati automaticamente (selezionati dal router della sessione) sono trattati come una **preferenza**: vengono provati per primi, ma OpenClaw può ruotare a un altro profilo in caso di limiti di frequenza/timeout. Quando il profilo originale torna disponibile, le nuove esecuzioni possono preferirlo di nuovo senza cambiare il modello o il runtime selezionato. I profili fissati dall'utente restano bloccati su quel profilo; se fallisce e sono configurati fallback dei modelli, OpenClaw passa al modello successivo invece di cambiare profilo.
</Note>

### Abbonamento OpenAI Codex più backup con chiave API

Per i modelli agente OpenAI, autenticazione e runtime sono separati. `openai/gpt-*` resta sull'harness Codex mentre l'autenticazione può ruotare tra un profilo di abbonamento Codex e un backup con chiave API OpenAI.

Usa `auth.order.openai` per l'ordine rivolto all'utente:

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

I profili di abbonamento Codex esistenti possono ancora usare l'id profilo legacy `openai-codex:*`. Il backup ordinato con chiave API può essere un normale profilo con chiave API `openai:*`. Quando l'abbonamento raggiunge un limite di utilizzo Codex, OpenClaw registra l'ora esatta di reset quando Codex ne fornisce una, prova il profilo di autenticazione ordinato successivo e mantiene l'esecuzione dentro l'harness Codex. Una volta superata l'ora di reset, il profilo di abbonamento è di nuovo idoneo e la selezione automatica successiva può tornarci.

Usa un profilo fissato dall'utente solo quando vuoi forzare un account/una chiave per quella sessione. I profili fissati dall'utente sono intenzionalmente rigidi e non passano silenziosamente a un altro profilo.

## Cooldown

Quando un profilo fallisce per errori di autenticazione/limite di frequenza (o un timeout che sembra un limite di frequenza), OpenClaw lo marca in cooldown e passa al profilo successivo.

<AccordionGroup>
  <Accordion title="What lands in the rate-limit / timeout bucket">
    Quel contenitore dei limiti di frequenza è più ampio di un semplice `429`: include anche messaggi dei provider come `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` e limiti periodici delle finestre di utilizzo come `weekly/monthly limit reached`.

    Gli errori di formato/richiesta non valida sono di solito terminali perché riprovare lo stesso payload fallirebbe allo stesso modo, quindi OpenClaw li espone invece di ruotare i profili di autenticazione. I percorsi noti di riparazione con nuovo tentativo possono aderire esplicitamente: ad esempio, gli errori di convalida dell'ID della chiamata strumento di Cloud Code Assist vengono sanificati e ritentati una volta tramite la policy `allowFormatRetry`. Gli errori di motivo di arresto compatibili con OpenAI, come `Unhandled stop reason: error`, `stop reason: error` e `reason: error`, sono classificati come segnali di timeout/failover.

    Anche testo generico del server può finire in quel contenitore dei timeout quando la sorgente corrisponde a uno schema transitorio noto. Ad esempio, il messaggio semplice del wrapper di stream pi-ai `An unknown error occurred` è trattato come idoneo al failover per ogni provider perché pi-ai lo emette quando gli stream del provider terminano con `stopReason: "aborted"` o `stopReason: "error"` senza dettagli specifici. Anche i payload JSON `api_error` con testo server transitorio come `internal server error`, `unknown error, 520`, `upstream error` o `backend error` sono trattati come timeout idonei al failover.

    Testo upstream generico specifico di OpenRouter, come il semplice `Provider returned error`, è trattato come timeout solo quando il contesto del provider è effettivamente OpenRouter. Testo generico di fallback interno come `LLM request failed with an unknown error.` resta conservativo e non attiva da solo il failover.

  </Accordion>
  <Accordion title="SDK retry-after caps">
    Alcuni SDK dei provider potrebbero altrimenti attendere una lunga finestra `Retry-After` prima di restituire il controllo a OpenClaw. Per gli SDK basati su Stainless, come Anthropic e OpenAI, OpenClaw limita per default le attese interne all'SDK `retry-after-ms` / `retry-after` a 60 secondi e rende immediatamente disponibili le risposte ritentabili più lunghe, così questo percorso di failover può essere eseguito. Regola o disabilita il limite con `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; vedi [Comportamento dei nuovi tentativi](/it/concepts/retry).
  </Accordion>
  <Accordion title="Model-scoped cooldowns">
    I cooldown dei limiti di frequenza possono anche essere circoscritti al modello:

    - OpenClaw registra `cooldownModel` per gli errori di limite di frequenza quando l'id del modello che fallisce è noto.
    - Un modello affine sullo stesso provider può comunque essere provato quando il cooldown è circoscritto a un modello diverso.
    - Le finestre di fatturazione/disabilitazione bloccano comunque l'intero profilo su tutti i modelli.

  </Accordion>
</AccordionGroup>

I cooldown usano backoff esponenziale:

- 1 minuto
- 5 minuti
- 25 minuti
- 1 ora (limite)

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

Gli errori di fatturazione/credito (ad esempio "insufficient credits" / "credit balance too low") sono trattati come idonei al failover, ma di solito non sono transitori. Invece di un breve cooldown, OpenClaw marca il profilo come **disabilitato** (con un backoff più lungo) e ruota al profilo/provider successivo.

<Note>
Non ogni risposta dall'aspetto di fatturazione è `402`, e non ogni HTTP `402` finisce qui. OpenClaw mantiene il testo esplicito di fatturazione nel percorso della fatturazione anche quando un provider restituisce invece `401` o `403`, ma i matcher specifici dei provider restano circoscritti al provider che li possiede (ad esempio OpenRouter `403 Key limit exceeded`).

Nel frattempo, gli errori temporanei `402` relativi alla finestra d'uso e ai limiti di spesa dell'organizzazione/workspace sono classificati come `rate_limit` quando il messaggio sembra ritentabile (ad esempio `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` oppure `organization spending limit exceeded`). Restano quindi nel percorso di cooldown/failover breve invece che nel percorso lungo di disattivazione per fatturazione.
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

- Il backoff di fatturazione parte da **5 ore**, raddoppia a ogni errore di fatturazione e ha un limite massimo di **24 ore**.
- I contatori di backoff vengono reimpostati se il profilo non ha avuto errori per **24 ore** (configurabile).
- I tentativi in caso di sovraccarico consentono **1 rotazione del profilo dello stesso provider** prima del fallback del modello.
- I tentativi in caso di sovraccarico usano per impostazione predefinita un backoff di **0 ms**.

## Fallback del modello

Se tutti i profili di un provider falliscono, OpenClaw passa al modello successivo in `agents.defaults.model.fallbacks`. Questo vale per errori di autenticazione, rate limit e timeout che hanno esaurito la rotazione dei profili (gli altri errori non fanno avanzare il fallback). Gli errori del provider che non espongono abbastanza dettagli vengono comunque etichettati con precisione nello stato di fallback: `empty_response` significa che il provider non ha restituito alcun messaggio o stato utilizzabile, `no_error_details` significa che il provider ha restituito esplicitamente `Unknown error (no error details in response)`, e `unclassified` significa che OpenClaw ha conservato l'anteprima grezza ma nessun classificatore l'ha ancora riconosciuta.

Gli errori di sovraccarico e rate limit vengono gestiti in modo più aggressivo rispetto ai cooldown di fatturazione. Per impostazione predefinita, OpenClaw consente un tentativo con un profilo di autenticazione dello stesso provider, poi passa al fallback del modello configurato successivo senza attendere. I segnali di provider occupato come `ModelNotReadyException` rientrano in questo gruppo di sovraccarico. Configura questo comportamento con `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` e `auth.cooldowns.rateLimitedProfileRotations`.

Quando un'esecuzione parte dal primario predefinito configurato, da un primario di un processo Cron, da un primario dell'agente con fallback espliciti o da un override di fallback selezionato automaticamente, OpenClaw può percorrere la catena di fallback configurata corrispondente. I primari dell'agente senza fallback espliciti e le selezioni utente esplicite (ad esempio `/model ollama/qwen3.5:27b`, il selettore di modello, `sessions.patch` o override una tantum da CLI per provider/modello) sono rigorosi: se quel provider/modello non è raggiungibile o fallisce prima di produrre una risposta, OpenClaw segnala l'errore invece di rispondere da un fallback non correlato.

### Regole della catena di candidati

OpenClaw crea l'elenco dei candidati a partire dal `provider/model` attualmente richiesto più i fallback configurati.

<AccordionGroup>
  <Accordion title="Rules">
    - Il modello richiesto è sempre il primo.
    - I fallback configurati espliciti vengono deduplicati ma non filtrati dall'elenco dei modelli consentiti. Sono trattati come intento esplicito dell'operatore.
    - Se l'esecuzione corrente si trova già su un fallback configurato nella stessa famiglia di provider, OpenClaw continua a usare l'intera catena configurata.
    - Quando non viene fornito alcun override di fallback esplicito, i fallback configurati vengono provati prima del primario configurato anche se il modello richiesto usa un provider diverso.
    - Quando al runner di fallback non viene fornito alcun override di fallback esplicito, il primario configurato viene aggiunto alla fine in modo che la catena possa tornare al valore predefinito normale dopo l'esaurimento dei candidati precedenti.
    - Quando un chiamante fornisce `fallbacksOverride`, il runner usa esattamente il modello richiesto più quell'elenco di override. Un elenco vuoto disabilita il fallback del modello e impedisce che il primario configurato venga aggiunto come destinazione di tentativo nascosta.

  </Accordion>
</AccordionGroup>

### Quali errori fanno avanzare il fallback

<Tabs>
  <Tab title="Continues on">
    - errori di autenticazione
    - rate limit ed esaurimento dei cooldown
    - errori di sovraccarico/provider occupato
    - errori di failover con forma di timeout
    - disattivazioni per fatturazione
    - `LiveSessionModelSwitchError`, che viene normalizzato in un percorso di failover in modo che un modello persistito obsoleto non crei un ciclo di retry esterno
    - altri errori non riconosciuti quando restano ancora candidati disponibili

  </Tab>
  <Tab title="Does not continue on">
    - interruzioni esplicite che non hanno forma di timeout/failover
    - errori di overflow del contesto che devono restare nella logica di compaction/retry (ad esempio `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` oppure `ollama error: context length exceeded`)
    - un errore sconosciuto finale quando non restano candidati

  </Tab>
</Tabs>

### Salto del cooldown rispetto al comportamento di probe

Quando ogni profilo di autenticazione per un provider è già in cooldown, OpenClaw non salta automaticamente quel provider per sempre. Prende una decisione per ciascun candidato:

<AccordionGroup>
  <Accordion title="Per-candidate decisions">
    - Gli errori di autenticazione persistenti saltano immediatamente l'intero provider.
    - Le disattivazioni per fatturazione di solito vengono saltate, ma il candidato primario può comunque essere verificato con un throttle, così il ripristino è possibile senza riavviare.
    - Il candidato primario può essere verificato vicino alla scadenza del cooldown, con un throttle per provider.
    - I fallback fratelli dello stesso provider possono essere tentati nonostante il cooldown quando l'errore sembra transitorio (`rate_limit`, `overloaded` o sconosciuto). Questo è particolarmente rilevante quando un rate limit è circoscritto al modello e un modello fratello può ancora recuperare immediatamente.
    - I probe dei cooldown transitori sono limitati a uno per provider per esecuzione di fallback, così un singolo provider non blocca il fallback tra provider.

  </Accordion>
</AccordionGroup>

## Override di sessione e cambio modello live

Le modifiche al modello della sessione sono stato condiviso. Il runner attivo, il comando `/model`, gli aggiornamenti di compaction/sessione e la riconciliazione della sessione live leggono o scrivono tutti parti della stessa voce di sessione.

Questo significa che i retry di fallback devono coordinarsi con il cambio modello live:

- Solo le modifiche del modello esplicitamente guidate dall'utente contrassegnano un cambio live in sospeso. Questo include `/model`, `session_status(model=...)` e `sessions.patch`.
- Le modifiche del modello guidate dal sistema, come rotazione di fallback, override di Heartbeat o Compaction, non contrassegnano mai da sole un cambio live in sospeso.
- Gli override del modello guidati dall'utente sono trattati come selezioni esatte per la policy di fallback, quindi un provider selezionato non raggiungibile emerge come errore invece di essere mascherato da `agents.defaults.model.fallbacks`.
- Prima che inizi un retry di fallback, il runner della risposta persiste i campi dell'override di fallback selezionato nella voce di sessione.
- Gli override di fallback automatici restano selezionati nei turni successivi, così OpenClaw non verifica un primario noto come non funzionante a ogni messaggio. `/new`, `/reset` e `sessions.reset` cancellano gli override di origine automatica e riportano la sessione al valore predefinito configurato.
- `/status` mostra il modello selezionato e, quando lo stato di fallback differisce, il modello di fallback attivo e il motivo.
- La riconciliazione della sessione live preferisce gli override di sessione persistiti rispetto ai campi del modello runtime obsoleti.
- Se un errore di cambio live punta a un candidato successivo nella catena di fallback attiva, OpenClaw passa direttamente a quel modello selezionato invece di percorrere prima candidati non correlati.
- Se il tentativo di fallback fallisce, il runner esegue il rollback solo dei campi di override che ha scritto, e solo se corrispondono ancora a quel candidato fallito.

Questo evita la classica race condition:

<Steps>
  <Step title="Primary fails">
    Il modello primario selezionato fallisce.
  </Step>
  <Step title="Fallback chosen in memory">
    Il candidato di fallback viene scelto in memoria.
  </Step>
  <Step title="Session store still says old primary">
    Lo store di sessione riflette ancora il vecchio primario.
  </Step>
  <Step title="Live reconciliation reads stale state">
    La riconciliazione della sessione live legge lo stato obsoleto della sessione.
  </Step>
  <Step title="Retry snapped back">
    Il retry viene riportato al vecchio modello prima che inizi il tentativo di fallback.
  </Step>
</Steps>

L'override di fallback persistito chiude quella finestra, e il rollback ristretto mantiene intatte le modifiche di sessione manuali o runtime più recenti.

## Osservabilità e riepiloghi degli errori

`runWithModelFallback(...)` registra i dettagli di ciascun tentativo che alimentano i log e la messaggistica di cooldown visibile all'utente:

- provider/modello tentato
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` e motivi di failover simili)
- stato/codice opzionale
- riepilogo dell'errore leggibile da una persona

I log strutturati `model_fallback_decision` includono anche campi piatti `fallbackStep*` quando un candidato fallisce, viene saltato o un fallback successivo riesce. Questi campi rendono esplicita la transizione tentata (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) in modo che gli esportatori di log e diagnostica possano ricostruire l'errore del primario anche quando anche il fallback terminale fallisce.

Quando ogni candidato fallisce, OpenClaw genera `FallbackSummaryError`. Il runner esterno della risposta può usarlo per creare un messaggio più specifico, ad esempio "tutti i modelli sono temporaneamente soggetti a rate limit", e includere la scadenza più vicina del cooldown quando è nota.

Quel riepilogo del cooldown è consapevole del modello:

- i rate limit non correlati e circoscritti al modello vengono ignorati per la catena provider/modello tentata
- se il blocco rimanente è un rate limit corrispondente e circoscritto al modello, OpenClaw segnala l'ultima scadenza corrispondente che blocca ancora quel modello

## Configurazione correlata

Vedi [Configurazione del Gateway](/it/gateway/configuration) per:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- routing di `agents.defaults.imageModel`

Vedi [Modelli](/it/concepts/models) per una panoramica più ampia della selezione del modello e del fallback.
