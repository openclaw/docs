---
read_when:
    - Diagnosi della rotazione dei profili di autenticazione, dei tempi di attesa o del comportamento di ripiego del modello
    - Aggiornamento delle regole di failover per i profili di autenticazione o i modelli
    - Comprendere come le sostituzioni del modello di sessione interagiscono con i nuovi tentativi di ripiego
sidebarTitle: Model failover
summary: Come OpenClaw ruota i profili di autenticazione ed effettua il fallback tra i modelli
title: Failover del modello
x-i18n:
    generated_at: "2026-04-30T08:47:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: af8c343186105256cb2e1a65cdfc3e0042ce8d3d14d21cd007d90174e35b98e7
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw gestisce gli errori in due fasi:

1. **Rotazione del profilo di autenticazione** all'interno del provider corrente.
2. **Fallback del modello** al modello successivo in `agents.defaults.model.fallbacks`.

Questo documento spiega le regole di runtime e i dati su cui si basano.

## Flusso di runtime

Per una normale esecuzione di testo, OpenClaw valuta i candidati in questo ordine:

<Steps>
  <Step title="Risolvi lo stato della sessione">
    Risolvi il modello della sessione attiva e la preferenza del profilo di autenticazione.
  </Step>
  <Step title="Costruisci la catena dei candidati">
    Costruisci la catena dei modelli candidati dalla selezione del modello corrente e dalla policy di fallback per quella origine di selezione. I predefiniti configurati, i primari dei processi cron e i modelli di fallback selezionati automaticamente possono usare i fallback configurati; le selezioni esplicite della sessione utente sono rigorose.
  </Step>
  <Step title="Prova il provider corrente">
    Prova il provider corrente con le regole di rotazione/cooldown del profilo di autenticazione.
  </Step>
  <Step title="Avanza sugli errori idonei al failover">
    Se quel provider è esaurito con un errore idoneo al failover, passa al modello candidato successivo.
  </Step>
  <Step title="Persisti l'override di fallback">
    Persisti l'override di fallback selezionato prima che inizi il nuovo tentativo, così gli altri lettori della sessione vedono lo stesso provider/modello che il runner sta per usare. L'override del modello persistito è contrassegnato con `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Ripristina in modo mirato in caso di errore">
    Se il candidato di fallback fallisce, ripristina solo i campi di override della sessione di proprietà del fallback quando corrispondono ancora a quel candidato fallito.
  </Step>
  <Step title="Genera FallbackSummaryError se esaurito">
    Se ogni candidato fallisce, genera un `FallbackSummaryError` con dettagli per tentativo e la scadenza di cooldown più vicina quando è nota.
  </Step>
</Steps>

Questo è intenzionalmente più ristretto di "salvare e ripristinare l'intera sessione". Il runner della risposta persiste solo i campi di selezione del modello di cui è proprietario per il fallback:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Questo impedisce a un nuovo tentativo di fallback fallito di sovrascrivere mutazioni di sessione più recenti e non correlate, come modifiche manuali con `/model` o aggiornamenti della rotazione della sessione avvenuti mentre il tentativo era in esecuzione.

## Policy dell'origine di selezione

OpenClaw separa il provider/modello selezionato dal motivo per cui è stato selezionato. Quell'origine controlla se la catena di fallback è consentita:

- **Predefinito configurato**: `agents.defaults.model.primary` usa `agents.defaults.model.fallbacks`.
- **Primario dell'agente**: `agents.list[].model` è rigoroso a meno che l'oggetto modello di quell'agente includa i propri `fallbacks`. Usa `fallbacks: []` per rendere esplicito il comportamento rigoroso, oppure fornisci un elenco non vuoto per abilitare quell'agente al fallback del modello.
- **Override di fallback automatico**: un fallback di runtime scrive `providerOverride`, `modelOverride` e `modelOverrideSource: "auto"` prima di riprovare. Quell'override automatico può continuare a percorrere la catena di fallback configurata e viene cancellato da `/new`, `/reset` e `sessions.reset`.
- **Override della sessione utente**: `/model`, il selettore del modello, `session_status(model=...)` e `sessions.patch` scrivono `modelOverrideSource: "user"`. Questa è una selezione esatta della sessione. Se il provider/modello selezionato fallisce prima di produrre una risposta, OpenClaw segnala l'errore invece di rispondere da un fallback configurato non correlato.
- **Override di sessione legacy**: le voci di sessione più vecchie possono avere `modelOverride` senza `modelOverrideSource`. OpenClaw le tratta come override utente, così una vecchia selezione esplicita non viene convertita silenziosamente in comportamento di fallback.
- **Modello del payload Cron**: un processo cron `payload.model` / `--model` è un primario del processo, non un override della sessione utente. Usa i fallback configurati a meno che il processo fornisca `payload.fallbacks`; `payload.fallbacks: []` rende rigorosa l'esecuzione cron.

## Archiviazione dell'autenticazione (chiavi + OAuth)

OpenClaw usa **profili di autenticazione** sia per le chiavi API sia per i token OAuth.

- I segreti risiedono in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (legacy: `~/.openclaw/agent/auth-profiles.json`).
- Lo stato di routing dell'autenticazione a runtime risiede in `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- La configurazione `auth.profiles` / `auth.order` è **solo metadati + routing** (nessun segreto).
- File OAuth legacy di sola importazione: `~/.openclaw/credentials/oauth.json` (importato in `auth-profiles.json` al primo utilizzo).

Maggiori dettagli: [OAuth](/it/concepts/oauth)

Tipi di credenziali:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` per alcuni provider)

## ID profilo

Gli accessi OAuth creano profili distinti, così più account possono coesistere.

- Predefinito: `provider:default` quando non è disponibile alcuna email.
- OAuth con email: `provider:<email>` (ad esempio `google-antigravity:user@gmail.com`).

I profili risiedono in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` sotto `profiles`.

## Ordine di rotazione

Quando un provider ha più profili, OpenClaw sceglie un ordine in questo modo:

<Steps>
  <Step title="Configurazione esplicita">
    `auth.order[provider]` (se impostato).
  </Step>
  <Step title="Profili configurati">
    `auth.profiles` filtrato per provider.
  </Step>
  <Step title="Profili archiviati">
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
- una compattazione viene completata (il conteggio di compattazione aumenta)
- il profilo è in cooldown/disabilitato

La selezione manuale tramite `/model …@<profileId>` imposta un **override utente** per quella sessione e non viene ruotata automaticamente finché non inizia una nuova sessione.

<Note>
I profili fissati automaticamente (selezionati dal router di sessione) sono trattati come una **preferenza**: vengono provati per primi, ma OpenClaw può ruotare a un altro profilo in caso di limiti di frequenza/timeout. I profili fissati dall'utente restano bloccati su quel profilo; se fallisce e sono configurati fallback di modello, OpenClaw passa al modello successivo invece di cambiare profilo.
</Note>

### Perché OAuth può "sembrare perso"

Se hai sia un profilo OAuth sia un profilo con chiave API per lo stesso provider, il round-robin può alternarli tra i messaggi a meno che non siano fissati. Per forzare un singolo profilo:

- Fissa con `auth.order[provider] = ["provider:profileId"]`, oppure
- Usa un override per sessione tramite `/model …` con un override del profilo (quando supportato dalla tua UI/superficie chat).

## Cooldown

Quando un profilo fallisce a causa di errori di autenticazione/limiti di frequenza (o un timeout che sembra un limite di frequenza), OpenClaw lo contrassegna in cooldown e passa al profilo successivo.

<AccordionGroup>
  <Accordion title="Cosa finisce nel bucket dei limiti di frequenza / timeout">
    Quel bucket dei limiti di frequenza è più ampio di un semplice `429`: include anche messaggi dei provider come `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` e limiti periodici della finestra di utilizzo come `weekly/monthly limit reached`.

    Gli errori di formato/richiesta non valida (ad esempio errori di convalida dell'ID della chiamata tool di Cloud Code Assist) sono trattati come idonei al failover e usano gli stessi cooldown. Gli errori di motivo di arresto compatibili con OpenAI, come `Unhandled stop reason: error`, `stop reason: error` e `reason: error`, sono classificati come segnali di timeout/failover.

    Anche il testo generico del server può finire in quel bucket di timeout quando l'origine corrisponde a un pattern transitorio noto. Ad esempio, il messaggio nudo dello stream-wrapper pi-ai `An unknown error occurred` è trattato come idoneo al failover per ogni provider perché pi-ai lo emette quando gli stream del provider terminano con `stopReason: "aborted"` o `stopReason: "error"` senza dettagli specifici. Anche i payload JSON `api_error` con testo server transitorio come `internal server error`, `unknown error, 520`, `upstream error` o `backend error` sono trattati come timeout idonei al failover.

    Il testo upstream generico specifico di OpenRouter, come il nudo `Provider returned error`, è trattato come timeout solo quando il contesto del provider è effettivamente OpenRouter. Il testo di fallback interno generico come `LLM request failed with an unknown error.` resta conservativo e non attiva il failover da solo.

  </Accordion>
  <Accordion title="Limiti retry-after degli SDK">
    Alcuni SDK dei provider potrebbero altrimenti dormire per una lunga finestra `Retry-After` prima di restituire il controllo a OpenClaw. Per SDK basati su Stainless come Anthropic e OpenAI, OpenClaw limita per impostazione predefinita le attese interne all'SDK `retry-after-ms` / `retry-after` a 60 secondi e fa emergere subito risposte riprovabili più lunghe, così questo percorso di failover può eseguirsi. Regola o disabilita il limite con `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; vedi [Comportamento dei retry](/it/concepts/retry).
  </Accordion>
  <Accordion title="Cooldown con ambito modello">
    I cooldown dei limiti di frequenza possono anche avere ambito modello:

    - OpenClaw registra `cooldownModel` per gli errori di limite di frequenza quando l'ID del modello che fallisce è noto.
    - Un modello fratello sullo stesso provider può ancora essere provato quando il cooldown ha ambito su un modello diverso.
    - Le finestre di fatturazione/disabilitazione bloccano comunque l'intero profilo tra i modelli.

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

## Disabilitazioni di fatturazione

Gli errori di fatturazione/credito (ad esempio "crediti insufficienti" / "saldo crediti troppo basso") sono trattati come idonei al failover, ma di solito non sono transitori. Invece di un breve cooldown, OpenClaw contrassegna il profilo come **disabilitato** (con un backoff più lungo) e ruota al profilo/provider successivo.

<Note>
Non tutte le risposte che assomigliano alla fatturazione sono `402`, e non ogni HTTP `402` finisce qui. OpenClaw mantiene il testo esplicito di fatturazione nel percorso di fatturazione anche quando un provider restituisce invece `401` o `403`, ma i matcher specifici del provider restano limitati al provider che li possiede (ad esempio OpenRouter `403 Key limit exceeded`).

Nel frattempo, gli errori temporanei `402` relativi a finestre di utilizzo e limiti di spesa di organizzazione/workspace sono classificati come `rate_limit` quando il messaggio sembra riprovabile (ad esempio `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` o `organization spending limit exceeded`). Questi restano sul percorso breve di cooldown/failover invece che sul percorso lungo di disabilitazione per fatturazione.
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

Predefiniti:

- Il backoff di fatturazione inizia a **5 ore**, raddoppia per ogni errore di fatturazione e ha un limite di **24 ore**.
- I contatori di backoff si reimpostano se il profilo non fallisce da **24 ore** (configurabile).
- I retry da sovraccarico consentono **1 rotazione del profilo dello stesso provider** prima del fallback del modello.
- I retry da sovraccarico usano **0 ms di backoff** per impostazione predefinita.

## Fallback del modello

Se tutti i profili per un provider falliscono, OpenClaw passa al modello successivo in `agents.defaults.model.fallbacks`. Questo si applica a errori di autenticazione, limiti di frequenza e timeout che hanno esaurito la rotazione dei profili (altri errori non avanzano il fallback). Gli errori del provider che non espongono abbastanza dettagli sono comunque etichettati con precisione nello stato di fallback: `empty_response` significa che il provider non ha restituito alcun messaggio o stato utilizzabile, `no_error_details` significa che il provider ha restituito esplicitamente `Unknown error (no error details in response)`, e `unclassified` significa che OpenClaw ha preservato l'anteprima grezza ma nessun classificatore l'ha ancora riconosciuta.

I messaggi di sovraccarico e rate limit vengono gestiti in modo più aggressivo rispetto ai cooldown di fatturazione. Per impostazione predefinita, OpenClaw consente un nuovo tentativo con lo stesso profilo di autenticazione dello stesso provider, poi passa al fallback del modello configurato successivo senza attendere. I segnali di provider occupato, come `ModelNotReadyException`, rientrano in quel gruppo di sovraccarico. Regola questo comportamento con `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` e `auth.cooldowns.rateLimitedProfileRotations`.

Quando un'esecuzione parte dal primario predefinito configurato, dal primario di un job cron, da un primario dell'agente con fallback espliciti o da un override di fallback selezionato automaticamente, OpenClaw può percorrere la catena di fallback configurata corrispondente. I primari degli agenti senza fallback espliciti e le selezioni utente esplicite (per esempio `/model ollama/qwen3.5:27b`, il selettore del modello, `sessions.patch` o override CLI una tantum di provider/modello) sono rigorosi: se quel provider/modello non è raggiungibile o fallisce prima di produrre una risposta, OpenClaw segnala l'errore invece di rispondere da un fallback non correlato.

### Regole della catena di candidati

OpenClaw costruisce l'elenco dei candidati dal `provider/model` attualmente richiesto più i fallback configurati.

<AccordionGroup>
  <Accordion title="Regole">
    - Il modello richiesto è sempre il primo.
    - I fallback configurati espliciti vengono deduplicati ma non filtrati dall'elenco dei modelli consentiti. Sono trattati come intento esplicito dell'operatore.
    - Se l'esecuzione corrente è già su un fallback configurato nella stessa famiglia di provider, OpenClaw continua a usare l'intera catena configurata.
    - Se l'esecuzione corrente è su un provider diverso dalla configurazione e quel modello corrente non fa già parte della catena di fallback configurata, OpenClaw non aggiunge fallback configurati non correlati da un altro provider.
    - Quando al runner di fallback non viene fornito alcun override di fallback esplicito, il primario configurato viene aggiunto alla fine, così la catena può tornare al valore predefinito normale una volta esauriti i candidati precedenti.
    - Quando un chiamante fornisce `fallbacksOverride`, il runner usa esattamente il modello richiesto più quell'elenco di override. Un elenco vuoto disabilita il fallback del modello e impedisce che il primario configurato venga aggiunto come destinazione di retry nascosta.

  </Accordion>
</AccordionGroup>

### Quali errori fanno avanzare il fallback

<Tabs>
  <Tab title="Continua con">
    - errori di autenticazione
    - rate limit ed esaurimento dei cooldown
    - errori di sovraccarico/provider occupato
    - errori di failover con forma di timeout
    - disabilitazioni per fatturazione
    - `LiveSessionModelSwitchError`, che viene normalizzato in un percorso di failover affinché un modello persistito obsoleto non crei un ciclo di retry esterno
    - altri errori non riconosciuti quando restano ancora candidati

  </Tab>
  <Tab title="Non continua con">
    - interruzioni esplicite che non hanno forma di timeout/failover
    - errori di overflow del contesto che devono rimanere nella logica di Compaction/retry (per esempio `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` o `ollama error: context length exceeded`)
    - un errore sconosciuto finale quando non restano candidati

  </Tab>
</Tabs>

### Comportamento di salto cooldown e probe

Quando ogni profilo di autenticazione per un provider è già in cooldown, OpenClaw non salta automaticamente quel provider per sempre. Prende una decisione per ciascun candidato:

<AccordionGroup>
  <Accordion title="Decisioni per candidato">
    - Gli errori di autenticazione persistenti saltano immediatamente l'intero provider.
    - Le disabilitazioni per fatturazione di solito vengono saltate, ma il candidato primario può comunque essere sondato con una limitazione, così il ripristino è possibile senza riavviare.
    - Il candidato primario può essere sondato vicino alla scadenza del cooldown, con una limitazione per provider.
    - I fallback fratelli dello stesso provider possono essere tentati nonostante il cooldown quando l'errore sembra transitorio (`rate_limit`, `overloaded` o sconosciuto). Questo è particolarmente rilevante quando un rate limit è limitato al modello e un modello fratello può comunque recuperare immediatamente.
    - I probe di cooldown transitori sono limitati a uno per provider per esecuzione di fallback, così un singolo provider non blocca il fallback tra provider.

  </Accordion>
</AccordionGroup>

## Override di sessione e cambio modello live

Le modifiche al modello di sessione sono stato condiviso. Il runner attivo, il comando `/model`, gli aggiornamenti di Compaction/sessione e la riconciliazione della sessione live leggono o scrivono tutti parti della stessa voce di sessione.

Questo significa che i retry di fallback devono coordinarsi con il cambio modello live:

- Solo le modifiche al modello guidate esplicitamente dall'utente contrassegnano un cambio live in sospeso. Ciò include `/model`, `session_status(model=...)` e `sessions.patch`.
- Le modifiche al modello guidate dal sistema, come rotazione del fallback, override Heartbeat o Compaction, non contrassegnano mai da sole un cambio live in sospeso.
- Gli override di modello guidati dall'utente sono trattati come selezioni esatte per la policy di fallback, quindi un provider selezionato non raggiungibile emerge come errore invece di essere mascherato da `agents.defaults.model.fallbacks`.
- Prima che inizi un retry di fallback, il runner di risposta persiste i campi di override di fallback selezionati nella voce di sessione.
- Gli override di fallback automatici restano selezionati nei turni successivi, così OpenClaw non sonda un primario noto come non funzionante a ogni messaggio. `/new`, `/reset` e `sessions.reset` cancellano gli override di origine automatica e riportano la sessione al valore predefinito configurato.
- `/status` mostra il modello selezionato e, quando lo stato di fallback differisce, il modello di fallback attivo e il motivo.
- La riconciliazione della sessione live preferisce gli override di sessione persistiti rispetto ai campi del modello runtime obsoleti.
- Se un errore di cambio live punta a un candidato successivo nella catena di fallback attiva, OpenClaw salta direttamente a quel modello selezionato invece di percorrere prima candidati non correlati.
- Se il tentativo di fallback fallisce, il runner ripristina solo i campi di override che ha scritto, e solo se corrispondono ancora a quel candidato fallito.

Questo evita la race classica:

<Steps>
  <Step title="Il primario fallisce">
    Il modello primario selezionato fallisce.
  </Step>
  <Step title="Fallback scelto in memoria">
    Il candidato di fallback viene scelto in memoria.
  </Step>
  <Step title="Lo store di sessione indica ancora il vecchio primario">
    Lo store di sessione riflette ancora il vecchio primario.
  </Step>
  <Step title="La riconciliazione live legge lo stato obsoleto">
    La riconciliazione della sessione live legge lo stato di sessione obsoleto.
  </Step>
  <Step title="Retry riportato indietro">
    Il retry viene riportato al vecchio modello prima che inizi il tentativo di fallback.
  </Step>
</Steps>

L'override di fallback persistito chiude quella finestra, e il rollback ristretto mantiene intatte le modifiche di sessione manuali o runtime più recenti.

## Osservabilità e riepiloghi degli errori

`runWithModelFallback(...)` registra dettagli per tentativo che alimentano i log e i messaggi di cooldown rivolti all'utente:

- provider/modello tentato
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` e motivi di failover simili)
- stato/codice opzionale
- riepilogo dell'errore leggibile

I log strutturati `model_fallback_decision` includono anche campi piatti `fallbackStep*` quando un candidato fallisce, viene saltato o un fallback successivo riesce. Questi campi rendono esplicita la transizione tentata (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), così gli esportatori di log e diagnostica possono ricostruire l'errore del primario anche quando fallisce anche il fallback terminale.

Quando ogni candidato fallisce, OpenClaw genera `FallbackSummaryError`. Il runner di risposta esterno può usarlo per costruire un messaggio più specifico, come "tutti i modelli sono temporaneamente soggetti a rate limit", e includere la scadenza di cooldown più vicina quando è nota.

Quel riepilogo di cooldown tiene conto del modello:

- i rate limit limitati a modelli non correlati vengono ignorati per la catena provider/modello tentata
- se il blocco residuo è un rate limit limitato al modello corrispondente, OpenClaw segnala l'ultima scadenza corrispondente che blocca ancora quel modello

## Configurazione correlata

Vedi [Configurazione Gateway](/it/gateway/configuration) per:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- routing `agents.defaults.imageModel`

Vedi [Modelli](/it/concepts/models) per una panoramica più ampia della selezione dei modelli e dei fallback.
