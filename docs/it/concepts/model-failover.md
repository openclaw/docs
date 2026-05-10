---
read_when:
    - Diagnosi della rotazione dei profili di autenticazione, dei periodi di attesa o del comportamento di ripiego del modello
    - Aggiornamento delle regole di failover per profili di autenticazione o modelli
    - Comprendere come le sostituzioni del modello della sessione interagiscono con i ritentativi di ripiego
sidebarTitle: Model failover
summary: Come OpenClaw ruota i profili di autenticazione ed esegue il fallback tra i modelli
title: Failover del modello
x-i18n:
    generated_at: "2026-05-10T19:31:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65de51fd4916aac8183a10afdfe3e0259cb85442de39e6d50fddf8a95bd420ae
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw gestisce gli errori in due fasi:

1. **Rotazione dei profili di autenticazione** all'interno del provider corrente.
2. **Ripiego del modello** al modello successivo in `agents.defaults.model.fallbacks`.

Questo documento spiega le regole di runtime e i dati su cui si basano.

## Flusso di runtime

Per una normale esecuzione testuale, OpenClaw valuta i candidati in questo ordine:

<Steps>
  <Step title="Resolve session state">
    Risolve il modello di sessione attivo e la preferenza del profilo di autenticazione.
  </Step>
  <Step title="Build candidate chain">
    Costruisce la catena di modelli candidati dalla selezione del modello corrente e dalla politica di ripiego per quella fonte di selezione. I predefiniti configurati, i primari dei processi cron e i modelli di ripiego selezionati automaticamente possono usare i ripieghi configurati; le selezioni esplicite della sessione utente sono rigide.
  </Step>
  <Step title="Try the current provider">
    Prova il provider corrente con le regole di rotazione/periodo di raffreddamento dei profili di autenticazione.
  </Step>
  <Step title="Advance on failover-worthy errors">
    Se quel provider è esaurito con un errore che giustifica una commutazione, passa al modello candidato successivo.
  </Step>
  <Step title="Persist fallback override">
    Persiste la sostituzione di ripiego selezionata prima che inizi il nuovo tentativo, così gli altri lettori della sessione vedono lo stesso provider/modello che il runner sta per usare. La sostituzione persistita del modello è marcata `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Roll back narrowly on failure">
    Se il candidato di ripiego fallisce, ripristina solo i campi di sostituzione della sessione di proprietà del ripiego quando corrispondono ancora a quel candidato fallito.
  </Step>
  <Step title="Throw FallbackSummaryError if exhausted">
    Se tutti i candidati falliscono, genera un `FallbackSummaryError` con dettagli per ogni tentativo e la scadenza più vicina del periodo di raffreddamento quando è nota.
  </Step>
</Steps>

Questo è intenzionalmente più ristretto di "salvare e ripristinare l'intera sessione". Il runner delle risposte persiste solo i campi di selezione del modello che possiede per il ripiego:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Questo impedisce a un nuovo tentativo di ripiego fallito di sovrascrivere mutazioni più recenti e non correlate della sessione, come modifiche manuali con `/model` o aggiornamenti di rotazione della sessione avvenuti mentre il tentativo era in esecuzione.

## Politica della fonte di selezione

OpenClaw separa il provider/modello selezionato dal motivo per cui è stato selezionato. Quella fonte controlla se la catena di ripiego è consentita:

- **Predefinito configurato**: `agents.defaults.model.primary` usa `agents.defaults.model.fallbacks`.
- **Primario dell'agente**: `agents.list[].model` è rigido a meno che quell'oggetto modello dell'agente includa i propri `fallbacks`. Usa `fallbacks: []` per rendere esplicito il comportamento rigido, oppure fornisci un elenco non vuoto per abilitare il ripiego del modello per quell'agente.
- **Sostituzione automatica di ripiego**: un ripiego di runtime scrive `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` e il modello di origine selezionato prima di riprovare. Quella sostituzione automatica può continuare a percorrere la catena di ripiego configurata e viene cancellata da `/new`, `/reset` e `sessions.reset`. Le esecuzioni di Heartbeat senza un `heartbeat.model` esplicito cancellano anche una sostituzione automatica diretta quando la sua origine non corrisponde più al predefinito configurato corrente.
- **Sostituzione della sessione utente**: `/model`, il selettore di modello, `session_status(model=...)` e `sessions.patch` scrivono `modelOverrideSource: "user"`. Questa è una selezione esatta della sessione. Se il provider/modello selezionato fallisce prima di produrre una risposta, OpenClaw segnala l'errore invece di rispondere da un ripiego configurato non correlato.
- **Sostituzione di sessione legacy**: le voci di sessione più vecchie possono avere `modelOverride` senza `modelOverrideSource`. OpenClaw le tratta come sostituzioni utente, così una vecchia selezione esplicita non viene convertita silenziosamente in comportamento di ripiego.
- **Modello del payload Cron**: un processo Cron `payload.model` / `--model` è un primario del processo, non una sostituzione della sessione utente. Usa i ripieghi configurati a meno che il processo non fornisca `payload.fallbacks`; `payload.fallbacks: []` rende rigida l'esecuzione Cron.

## Archiviazione dell'autenticazione (chiavi + OAuth)

OpenClaw usa **profili di autenticazione** sia per le chiavi API sia per i token OAuth.

- I segreti risiedono in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (legacy: `~/.openclaw/agent/auth-profiles.json`).
- Lo stato di instradamento dell'autenticazione di runtime risiede in `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- La configurazione `auth.profiles` / `auth.order` è **solo metadati + instradamento** (nessun segreto).
- File OAuth solo per importazione legacy: `~/.openclaw/credentials/oauth.json` (importato in `auth-profiles.json` al primo uso).

Maggiori dettagli: [OAuth](/it/concepts/oauth)

Tipi di credenziali:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` per alcuni provider)

## ID dei profili

Gli accessi OAuth creano profili distinti, così più account possono coesistere.

- Predefinito: `provider:default` quando non è disponibile alcuna email.
- OAuth con email: `provider:<email>` (per esempio `google-antigravity:user@gmail.com`).

I profili risiedono in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` sotto `profiles`.

## Ordine di rotazione

Quando un provider ha più profili, OpenClaw sceglie un ordine in questo modo:

<Steps>
  <Step title="Explicit config">
    `auth.order[provider]` (se impostato).
  </Step>
  <Step title="Configured profiles">
    `auth.profiles` filtrato per provider.
  </Step>
  <Step title="Stored profiles">
    Voci in `auth-profiles.json` per il provider.
  </Step>
</Steps>

Se non è configurato alcun ordine esplicito, OpenClaw usa un ordine round-robin:

- **Chiave primaria:** tipo di profilo (**OAuth prima delle chiavi API**).
- **Chiave secondaria:** `usageStats.lastUsed` (dal più vecchio, all'interno di ciascun tipo).
- **Profili in periodo di raffreddamento/disabilitati** vengono spostati alla fine, ordinati per scadenza più vicina.

### Persistenza della sessione (compatibile con la cache)

OpenClaw **fissa il profilo di autenticazione scelto per sessione** per mantenere calde le cache del provider. **Non** ruota a ogni richiesta. Il profilo fissato viene riutilizzato finché:

- la sessione viene reimpostata (`/new` / `/reset`)
- una Compaction viene completata (il conteggio della Compaction aumenta)
- il profilo è in periodo di raffreddamento/disabilitato

La selezione manuale tramite `/model …@<profileId>` imposta una **sostituzione utente** per quella sessione e non viene ruotata automaticamente finché non inizia una nuova sessione.

<Note>
I profili fissati automaticamente (selezionati dal router di sessione) sono trattati come una **preferenza**: vengono provati per primi, ma OpenClaw può ruotare a un altro profilo in caso di limiti di frequenza/timeout. I profili fissati dall'utente restano bloccati su quel profilo; se fallisce e sono configurati ripieghi del modello, OpenClaw passa al modello successivo invece di cambiare profilo.
</Note>

### Perché OAuth può "sembrare perso"

Se hai sia un profilo OAuth sia un profilo con chiave API per lo stesso provider, il round-robin può alternarli tra i messaggi a meno che non siano fissati. Per forzare un singolo profilo:

- Fissalo con `auth.order[provider] = ["provider:profileId"]`, oppure
- Usa una sostituzione per sessione tramite `/model …` con una sostituzione del profilo (quando supportata dalla tua interfaccia UI/chat).

## Periodi di raffreddamento

Quando un profilo fallisce a causa di errori di autenticazione/limiti di frequenza (o di un timeout che sembra un limite di frequenza), OpenClaw lo marca in periodo di raffreddamento e passa al profilo successivo.

<AccordionGroup>
  <Accordion title="What lands in the rate-limit / timeout bucket">
    Quel bucket di limite di frequenza è più ampio di un semplice `429`: include anche messaggi dei provider come `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` e limiti periodici di finestre d'uso come `weekly/monthly limit reached`.

    Gli errori di formato/richiesta non valida sono di solito terminali perché riprovare lo stesso payload fallirebbe allo stesso modo, quindi OpenClaw li espone invece di ruotare i profili di autenticazione. I percorsi noti di correzione e nuovo tentativo possono aderire esplicitamente: per esempio gli errori di validazione degli ID delle chiamate agli strumenti di Cloud Code Assist vengono sanificati e ritentati una volta tramite la politica `allowFormatRetry`. Gli errori del motivo di arresto compatibili con OpenAI, come `Unhandled stop reason: error`, `stop reason: error` e `reason: error`, sono classificati come segnali di timeout/commutazione.

    Anche il testo generico del server può rientrare in quel bucket di timeout quando la fonte corrisponde a un pattern transitorio noto. Per esempio, il messaggio semplice del wrapper di streaming pi-ai `An unknown error occurred` è trattato come meritevole di commutazione per ogni provider perché pi-ai lo emette quando gli stream del provider terminano con `stopReason: "aborted"` o `stopReason: "error"` senza dettagli specifici. Anche i payload JSON `api_error` con testo server transitorio come `internal server error`, `unknown error, 520`, `upstream error` o `backend error` sono trattati come timeout meritevoli di commutazione.

    Il testo upstream generico specifico di OpenRouter, come il semplice `Provider returned error`, è trattato come timeout solo quando il contesto del provider è effettivamente OpenRouter. Il testo generico di ripiego interno come `LLM request failed with an unknown error.` resta conservativo e da solo non attiva la commutazione.

  </Accordion>
  <Accordion title="SDK retry-after caps">
    Alcuni SDK dei provider potrebbero altrimenti dormire per una lunga finestra `Retry-After` prima di restituire il controllo a OpenClaw. Per gli SDK basati su Stainless come Anthropic e OpenAI, OpenClaw limita per impostazione predefinita le attese interne dell'SDK `retry-after-ms` / `retry-after` a 60 secondi ed espone immediatamente le risposte ritentabili più lunghe, così questo percorso di commutazione può essere eseguito. Regola o disabilita il limite con `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; vedi [Comportamento dei nuovi tentativi](/it/concepts/retry).
  </Accordion>
  <Accordion title="Model-scoped cooldowns">
    I periodi di raffreddamento per limiti di frequenza possono anche essere circoscritti al modello:

    - OpenClaw registra `cooldownModel` per gli errori di limite di frequenza quando l'id del modello che fallisce è noto.
    - Un modello fratello sullo stesso provider può comunque essere provato quando il periodo di raffreddamento è circoscritto a un modello diverso.
    - Le finestre di fatturazione/disabilitazione bloccano comunque l'intero profilo tra i modelli.

  </Accordion>
</AccordionGroup>

I periodi di raffreddamento usano backoff esponenziale:

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

Gli errori di fatturazione/credito (per esempio "crediti insufficienti" / "saldo credito troppo basso") sono trattati come meritevoli di commutazione, ma di solito non sono transitori. Invece di un breve periodo di raffreddamento, OpenClaw marca il profilo come **disabilitato** (con un backoff più lungo) e ruota al profilo/provider successivo.

<Note>
Non tutte le risposte che sembrano di fatturazione sono `402`, e non tutti gli HTTP `402` rientrano qui. OpenClaw mantiene il testo esplicito di fatturazione nel percorso di fatturazione anche quando un provider restituisce invece `401` o `403`, ma i matcher specifici del provider restano circoscritti al provider che li possiede (per esempio OpenRouter `403 Key limit exceeded`).

Nel frattempo, gli errori temporanei `402` di finestra d'uso e di limite di spesa di organizzazione/workspace sono classificati come `rate_limit` quando il messaggio sembra ritentabile (per esempio `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` o `organization spending limit exceeded`). Questi restano sul percorso di breve periodo di raffreddamento/commutazione invece che sul percorso lungo di disabilitazione per fatturazione.
</Note>

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

- Il backoff di fatturazione parte da **5 ore**, raddoppia per ogni errore di fatturazione e ha un limite di **24 ore**.
- I contatori di backoff vengono azzerati se il profilo non ha avuto errori per **24 ore** (configurabile).
- I nuovi tentativi in caso di sovraccarico consentono **1 rotazione di profilo dello stesso provider** prima del ripiego del modello.
- I nuovi tentativi in caso di sovraccarico usano **0 ms di backoff** per impostazione predefinita.

## Ripiego del modello

Se tutti i profili per un provider falliscono, OpenClaw passa al modello successivo in `agents.defaults.model.fallbacks`. Questo vale per errori di autenticazione, limiti di frequenza e timeout che hanno esaurito la rotazione dei profili (altri errori non fanno avanzare il fallback). Gli errori del provider che non espongono dettagli sufficienti sono comunque etichettati con precisione nello stato di fallback: `empty_response` significa che il provider non ha restituito alcun messaggio o stato utilizzabile, `no_error_details` significa che il provider ha restituito esplicitamente `Unknown error (no error details in response)`, e `unclassified` significa che OpenClaw ha preservato l'anteprima grezza ma nessun classificatore l'ha ancora riconosciuta.

Gli errori di sovraccarico e di limite di frequenza sono gestiti in modo più aggressivo rispetto ai cooldown di fatturazione. Per impostazione predefinita, OpenClaw consente un nuovo tentativo dello stesso profilo di autenticazione dello stesso provider, poi passa al fallback del modello successivo configurato senza attendere. I segnali di provider occupato come `ModelNotReadyException` rientrano in quel gruppo di sovraccarico. Regola questo comportamento con `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` e `auth.cooldowns.rateLimitedProfileRotations`.

Quando un'esecuzione parte dal primario predefinito configurato, dal primario di un processo cron, da un primario dell'agente con fallback espliciti, o da un override di fallback selezionato automaticamente, OpenClaw può percorrere la catena di fallback configurata corrispondente. I primari dell'agente senza fallback espliciti e le selezioni utente esplicite (per esempio `/model ollama/qwen3.5:27b`, il selettore di modelli, `sessions.patch`, o override una tantum di provider/modello dalla CLI) sono rigidi: se quel provider/modello non è raggiungibile o fallisce prima di produrre una risposta, OpenClaw segnala l'errore invece di rispondere da un fallback non correlato.

### Regole della catena di candidati

OpenClaw costruisce l'elenco dei candidati dal `provider/model` attualmente richiesto più i fallback configurati.

<AccordionGroup>
  <Accordion title="Regole">
    - Il modello richiesto è sempre il primo.
    - I fallback espliciti configurati vengono deduplicati ma non filtrati dalla allowlist dei modelli. Sono trattati come intento esplicito dell'operatore.
    - Se l'esecuzione corrente è già su un fallback configurato nella stessa famiglia di provider, OpenClaw continua a usare l'intera catena configurata.
    - Se l'esecuzione corrente è su un provider diverso dalla configurazione e quel modello corrente non fa già parte della catena di fallback configurata, OpenClaw non aggiunge fallback configurati non correlati da un altro provider.
    - Quando non viene fornito alcun override di fallback esplicito al runner di fallback, il primario configurato viene aggiunto alla fine, così la catena può tornare al valore predefinito normale una volta esauriti i candidati precedenti.
    - Quando un chiamante fornisce `fallbacksOverride`, il runner usa esattamente il modello richiesto più quell'elenco di override. Un elenco vuoto disabilita il fallback del modello e impedisce che il primario configurato venga aggiunto come destinazione nascosta di nuovo tentativo.

  </Accordion>
</AccordionGroup>

### Quali errori fanno avanzare il fallback

<Tabs>
  <Tab title="Continua con">
    - errori di autenticazione
    - limiti di frequenza ed esaurimento dei cooldown
    - errori di sovraccarico/provider occupato
    - errori di failover con forma di timeout
    - disabilitazioni di fatturazione
    - `LiveSessionModelSwitchError`, che viene normalizzato in un percorso di failover così un modello persistito obsoleto non crea un ciclo esterno di nuovi tentativi
    - altri errori non riconosciuti quando ci sono ancora candidati rimanenti

  </Tab>
  <Tab title="Non continua con">
    - interruzioni esplicite che non hanno forma di timeout/failover
    - errori di overflow del contesto che devono restare nella logica di compaction/nuovo tentativo (per esempio `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model`, o `ollama error: context length exceeded`)
    - un errore sconosciuto finale quando non restano candidati

  </Tab>
</Tabs>

### Comportamento di salto cooldown rispetto a probe

Quando ogni profilo di autenticazione per un provider è già in cooldown, OpenClaw non salta automaticamente quel provider per sempre. Prende una decisione per candidato:

<AccordionGroup>
  <Accordion title="Decisioni per candidato">
    - Gli errori di autenticazione persistenti saltano immediatamente l'intero provider.
    - Le disabilitazioni di fatturazione di solito saltano, ma il candidato primario può comunque essere verificato con un throttle così il recupero è possibile senza riavviare.
    - Il candidato primario può essere verificato vicino alla scadenza del cooldown, con un throttle per provider.
    - I fallback fratelli dello stesso provider possono essere tentati nonostante il cooldown quando l'errore sembra transitorio (`rate_limit`, `overloaded`, o sconosciuto). Questo è particolarmente rilevante quando un limite di frequenza è scoped al modello e un modello fratello potrebbe comunque recuperare immediatamente.
    - Le verifiche dei cooldown transitori sono limitate a una per provider per esecuzione di fallback, così un singolo provider non blocca il fallback tra provider.

  </Accordion>
</AccordionGroup>

## Override di sessione e cambio modello live

Le modifiche al modello della sessione sono stato condiviso. Il runner attivo, il comando `/model`, gli aggiornamenti di compaction/sessione e la riconciliazione della sessione live leggono o scrivono tutti parti della stessa voce di sessione.

Questo significa che i nuovi tentativi di fallback devono coordinarsi con il cambio modello live:

- Solo le modifiche al modello esplicite guidate dall'utente marcano un cambio live in sospeso. Questo include `/model`, `session_status(model=...)` e `sessions.patch`.
- Le modifiche al modello guidate dal sistema, come rotazione di fallback, override di Heartbeat o Compaction, non marcano mai da sole un cambio live in sospeso.
- Gli override del modello guidati dall'utente sono trattati come selezioni esatte per la policy di fallback, quindi un provider selezionato non raggiungibile emerge come errore invece di essere mascherato da `agents.defaults.model.fallbacks`.
- Prima che inizi un nuovo tentativo di fallback, il runner di risposta persiste i campi di override di fallback selezionati nella voce di sessione.
- Gli override di fallback automatici restano selezionati nei turni successivi così OpenClaw non verifica un primario noto come non valido a ogni messaggio. `/new`, `/reset` e `sessions.reset` cancellano gli override di origine automatica e riportano la sessione al valore predefinito configurato.
- `/status` mostra il modello selezionato e, quando lo stato di fallback differisce, il modello di fallback attivo e il motivo.
- La riconciliazione della sessione live preferisce gli override di sessione persistiti rispetto ai campi modello runtime obsoleti.
- Se un errore di cambio live punta a un candidato successivo nella catena di fallback attiva, OpenClaw passa direttamente a quel modello selezionato invece di percorrere prima candidati non correlati.
- Se il tentativo di fallback fallisce, il runner ripristina solo i campi di override che ha scritto, e solo se corrispondono ancora a quel candidato fallito.

Questo impedisce la race classica:

<Steps>
  <Step title="Il primario fallisce">
    Il modello primario selezionato fallisce.
  </Step>
  <Step title="Fallback scelto in memoria">
    Il candidato di fallback viene scelto in memoria.
  </Step>
  <Step title="L'archivio sessioni indica ancora il vecchio primario">
    L'archivio sessioni riflette ancora il vecchio primario.
  </Step>
  <Step title="La riconciliazione live legge uno stato obsoleto">
    La riconciliazione della sessione live legge lo stato obsoleto della sessione.
  </Step>
  <Step title="Il nuovo tentativo torna indietro">
    Il nuovo tentativo viene riportato al vecchio modello prima che inizi il tentativo di fallback.
  </Step>
</Steps>

L'override di fallback persistito chiude quella finestra, e il rollback ristretto mantiene intatte le modifiche di sessione manuali o runtime più recenti.

## Osservabilità e riepiloghi degli errori

`runWithModelFallback(...)` registra dettagli per tentativo che alimentano log e messaggistica dei cooldown rivolta all'utente:

- provider/modello tentato
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` e motivi di failover simili)
- stato/codice opzionale
- riepilogo dell'errore leggibile da una persona

I log strutturati `model_fallback_decision` includono anche campi piatti `fallbackStep*` quando un candidato fallisce, viene saltato, o un fallback successivo riesce. Questi campi rendono esplicita la transizione tentata (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) così gli esportatori di log e diagnostica possono ricostruire l'errore primario anche quando fallisce anche il fallback terminale.

Quando ogni candidato fallisce, OpenClaw genera `FallbackSummaryError`. Il runner di risposta esterno può usarlo per costruire un messaggio più specifico, come "tutti i modelli sono temporaneamente soggetti a limite di frequenza", e includere la scadenza del cooldown più vicina quando è nota.

Quel riepilogo dei cooldown è consapevole del modello:

- i limiti di frequenza scoped al modello non correlati vengono ignorati per la catena provider/modello tentata
- se il blocco rimanente è un limite di frequenza scoped al modello corrispondente, OpenClaw segnala l'ultima scadenza corrispondente che blocca ancora quel modello

## Configurazione correlata

Vedi [Configurazione del Gateway](/it/gateway/configuration) per:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- instradamento di `agents.defaults.imageModel`

Vedi [Modelli](/it/concepts/models) per la panoramica più ampia sulla selezione dei modelli e sul fallback.
