---
read_when:
    - Diagnosi della rotazione dei profili di autenticazione, dei cooldown o del comportamento di fallback del modello
    - Aggiornamento delle regole di failover per profili di autenticazione o modelli
    - Comprendere come le sovrascritture del modello di sessione interagiscono con i nuovi tentativi di ripiego
sidebarTitle: Model failover
summary: Come OpenClaw alterna i profili di autenticazione e ripiega su altri modelli
title: Passaggio automatico al modello di riserva
x-i18n:
    generated_at: "2026-05-06T08:46:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9a77ec2bd4a959db5a56e53b002b8bc5ea9a2efe3c914da61ac8d25de41d6c1
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw gestisce gli errori in due fasi:

1. **Rotazione del profilo di autenticazione** all'interno del fornitore corrente.
2. **Passaggio a un modello alternativo** al modello successivo in `agents.defaults.model.fallbacks`.

Questo documento spiega le regole di runtime e i dati che le supportano.

## Flusso di runtime

Per una normale esecuzione di testo, OpenClaw valuta i candidati in questo ordine:

<Steps>
  <Step title="Risolvi lo stato della sessione">
    Risolvi il modello di sessione attivo e la preferenza del profilo di autenticazione.
  </Step>
  <Step title="Costruisci la catena di candidati">
    Costruisci la catena dei modelli candidati dalla selezione del modello corrente e dalla politica di alternativa per l'origine di tale selezione. Le impostazioni predefinite configurate, i modelli primari dei processi cron e i modelli alternativi selezionati automaticamente possono usare alternative configurate; le selezioni esplicite della sessione utente sono rigorose.
  </Step>
  <Step title="Prova il fornitore corrente">
    Prova il fornitore corrente con le regole di rotazione/sospensione temporanea del profilo di autenticazione.
  </Step>
  <Step title="Avanza in caso di errori che giustificano il passaggio di emergenza">
    Se quel fornitore è esaurito con un errore che giustifica il passaggio di emergenza, passa al modello candidato successivo.
  </Step>
  <Step title="Persisti la sostituzione alternativa">
    Persisti la sostituzione alternativa selezionata prima che inizi il nuovo tentativo, così gli altri lettori della sessione vedono lo stesso fornitore/modello che l'esecutore sta per usare. La sostituzione persistita del modello è contrassegnata con `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Ripristina in modo mirato in caso di errore">
    Se il candidato alternativo fallisce, ripristina solo i campi di sostituzione della sessione di proprietà dell'alternativa quando corrispondono ancora a quel candidato non riuscito.
  </Step>
  <Step title="Genera FallbackSummaryError se esaurito">
    Se ogni candidato fallisce, genera un `FallbackSummaryError` con i dettagli per ogni tentativo e la scadenza di sospensione temporanea più vicina quando è nota.
  </Step>
</Steps>

Questo è intenzionalmente più mirato di "salva e ripristina l'intera sessione". L'esecutore della risposta persiste solo i campi di selezione del modello che possiede per l'alternativa:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Questo impedisce a un nuovo tentativo alternativo non riuscito di sovrascrivere modifiche di sessione più recenti e non correlate, come modifiche manuali con `/model` o aggiornamenti della rotazione della sessione avvenuti mentre il tentativo era in esecuzione.

## Politica dell'origine della selezione

OpenClaw separa il fornitore/modello selezionato dal motivo per cui è stato selezionato. Tale origine controlla se la catena alternativa è consentita:

- **Predefinito configurato**: `agents.defaults.model.primary` usa `agents.defaults.model.fallbacks`.
- **Modello primario dell'agente**: `agents.list[].model` è rigoroso, a meno che l'oggetto modello di quell'agente includa le proprie `fallbacks`. Usa `fallbacks: []` per rendere esplicito il comportamento rigoroso, oppure fornisci un elenco non vuoto per abilitare quel modello dell'agente al passaggio a modelli alternativi.
- **Sostituzione alternativa automatica**: un'alternativa di runtime scrive `providerOverride`, `modelOverride` e `modelOverrideSource: "auto"` prima di riprovare. Tale sostituzione automatica può continuare a percorrere la catena alternativa configurata e viene cancellata da `/new`, `/reset` e `sessions.reset`.
- **Sostituzione della sessione utente**: `/model`, il selettore di modelli, `session_status(model=...)` e `sessions.patch` scrivono `modelOverrideSource: "user"`. Questa è una selezione esatta della sessione. Se il fornitore/modello selezionato fallisce prima di produrre una risposta, OpenClaw segnala l'errore invece di rispondere usando un'alternativa configurata non correlata.
- **Sostituzione di sessione legacy**: le voci di sessione più vecchie possono avere `modelOverride` senza `modelOverrideSource`. OpenClaw le tratta come sostituzioni utente, così una vecchia selezione esplicita non viene convertita silenziosamente in comportamento alternativo.
- **Modello del payload Cron**: un `payload.model` / `--model` di un processo cron è un modello primario del processo, non una sostituzione della sessione utente. Usa le alternative configurate a meno che il processo non fornisca `payload.fallbacks`; `payload.fallbacks: []` rende rigorosa l'esecuzione Cron.

## Archiviazione dell'autenticazione (chiavi + OAuth)

OpenClaw usa **profili di autenticazione** sia per le chiavi API sia per i token OAuth.

- I segreti risiedono in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (legacy: `~/.openclaw/agent/auth-profiles.json`).
- Lo stato di instradamento dell'autenticazione di runtime risiede in `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- La configurazione `auth.profiles` / `auth.order` contiene **solo metadati + instradamento** (nessun segreto).
- File OAuth legacy solo per importazione: `~/.openclaw/credentials/oauth.json` (importato in `auth-profiles.json` al primo uso).

Maggiori dettagli: [OAuth](/it/concepts/oauth)

Tipi di credenziali:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` per alcuni fornitori)

## ID dei profili

Gli accessi OAuth creano profili distinti, così più account possono coesistere.

- Predefinito: `provider:default` quando non è disponibile alcuna email.
- OAuth con email: `provider:<email>` (ad esempio `google-antigravity:user@gmail.com`).

I profili risiedono in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` sotto `profiles`.

## Ordine di rotazione

Quando un fornitore ha più profili, OpenClaw sceglie un ordine in questo modo:

<Steps>
  <Step title="Configurazione esplicita">
    `auth.order[provider]` (se impostato).
  </Step>
  <Step title="Profili configurati">
    `auth.profiles` filtrati per fornitore.
  </Step>
  <Step title="Profili archiviati">
    Voci in `auth-profiles.json` per il fornitore.
  </Step>
</Steps>

Se non è configurato alcun ordine esplicito, OpenClaw usa un ordine a rotazione:

- **Chiave primaria:** tipo di profilo (**OAuth prima delle chiavi API**).
- **Chiave secondaria:** `usageStats.lastUsed` (prima il meno recente, all'interno di ciascun tipo).
- I **profili in sospensione temporanea/disabilitati** vengono spostati alla fine, ordinati per scadenza più vicina.

### Persistenza di sessione (favorevole alla cache)

OpenClaw **fissa il profilo di autenticazione scelto per sessione** per mantenere calde le cache del fornitore. **Non** ruota a ogni richiesta. Il profilo fissato viene riutilizzato finché:

- la sessione viene reimpostata (`/new` / `/reset`)
- una Compaction viene completata (il conteggio delle Compaction aumenta)
- il profilo è in sospensione temporanea/disabilitato

La selezione manuale tramite `/model …@<profileId>` imposta una **sostituzione utente** per quella sessione e non viene ruotata automaticamente finché non inizia una nuova sessione.

<Note>
I profili fissati automaticamente (selezionati dal router di sessione) sono trattati come una **preferenza**: vengono provati per primi, ma OpenClaw può ruotare verso un altro profilo in caso di limiti di frequenza/scadenze del tempo di attesa. I profili fissati dall'utente restano bloccati su quel profilo; se fallisce e sono configurati modelli alternativi, OpenClaw passa al modello successivo invece di cambiare profilo.
</Note>

### Perché OAuth può "sembrare perso"

Se hai sia un profilo OAuth sia un profilo con chiave API per lo stesso fornitore, la rotazione può passare dall'uno all'altro tra i messaggi a meno che non siano fissati. Per forzare un singolo profilo:

- Fissa con `auth.order[provider] = ["provider:profileId"]`, oppure
- Usa una sostituzione per sessione tramite `/model …` con una sostituzione del profilo (quando supportata dalla tua interfaccia UI/chat).

## Sospensioni temporanee

Quando un profilo fallisce a causa di errori di autenticazione/limite di frequenza (o di una scadenza del tempo di attesa che sembra un limite di frequenza), OpenClaw lo contrassegna in sospensione temporanea e passa al profilo successivo.

<AccordionGroup>
  <Accordion title="Cosa finisce nel gruppo limite di frequenza / scadenza del tempo di attesa">
    Quel gruppo di limite di frequenza è più ampio di un semplice `429`: include anche messaggi del fornitore come `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` e limiti periodici della finestra di utilizzo come `weekly/monthly limit reached`.

    Gli errori di formato/richiesta non valida (ad esempio errori di convalida dell'ID di chiamata strumento di Cloud Code Assist) sono trattati come idonei al passaggio di emergenza e usano le stesse sospensioni temporanee. Gli errori del motivo di arresto compatibili con OpenAI come `Unhandled stop reason: error`, `stop reason: error` e `reason: error` sono classificati come segnali di scadenza del tempo di attesa/passaggio di emergenza.

    Anche il testo generico del server può finire in quel gruppo di scadenza del tempo di attesa quando l'origine corrisponde a uno schema transitorio noto. Ad esempio, il messaggio semplice del wrapper di flusso pi-ai `An unknown error occurred` è trattato come idoneo al passaggio di emergenza per ogni fornitore perché pi-ai lo emette quando i flussi del fornitore terminano con `stopReason: "aborted"` o `stopReason: "error"` senza dettagli specifici. Anche i payload JSON `api_error` con testo transitorio del server come `internal server error`, `unknown error, 520`, `upstream error` o `backend error` sono trattati come scadenze del tempo di attesa idonee al passaggio di emergenza.

    Il testo upstream generico specifico di OpenRouter, come il semplice `Provider returned error`, è trattato come scadenza del tempo di attesa solo quando il contesto del fornitore è effettivamente OpenRouter. Il testo generico interno delle alternative, come `LLM request failed with an unknown error.`, resta conservativo e non attiva da solo il passaggio di emergenza.

  </Accordion>
  <Accordion title="Limiti di retry-after dell'SDK">
    Alcuni SDK dei fornitori potrebbero altrimenti attendere per una lunga finestra `Retry-After` prima di restituire il controllo a OpenClaw. Per gli SDK basati su Stainless come Anthropic e OpenAI, OpenClaw limita per impostazione predefinita le attese interne dell'SDK `retry-after-ms` / `retry-after` a 60 secondi e rende immediatamente disponibili le risposte più lunghe e ritentabili, così questo percorso di passaggio di emergenza può essere eseguito. Regola o disabilita il limite con `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; vedi [Comportamento dei nuovi tentativi](/it/concepts/retry).
  </Accordion>
  <Accordion title="Sospensioni temporanee con ambito modello">
    Le sospensioni temporanee per limite di frequenza possono anche avere ambito modello:

    - OpenClaw registra `cooldownModel` per gli errori di limite di frequenza quando l'ID del modello non riuscito è noto.
    - Un modello sibling sullo stesso fornitore può ancora essere provato quando la sospensione temporanea è limitata a un modello diverso.
    - Le finestre di fatturazione/disabilitazione bloccano comunque l'intero profilo tra i modelli.

  </Accordion>
</AccordionGroup>

Le sospensioni temporanee usano un backoff esponenziale:

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

Gli errori di fatturazione/credito (ad esempio "insufficient credits" / "credit balance too low") sono trattati come idonei al passaggio di emergenza, ma di solito non sono transitori. Invece di una breve sospensione temporanea, OpenClaw contrassegna il profilo come **disabilitato** (con un backoff più lungo) e ruota al profilo/fornitore successivo.

<Note>
Non tutte le risposte di tipo fatturazione sono `402`, e non tutti gli HTTP `402` finiscono qui. OpenClaw mantiene il testo esplicito di fatturazione nel percorso di fatturazione anche quando un fornitore restituisce invece `401` o `403`, ma i matcher specifici del fornitore restano limitati al fornitore che li possiede (ad esempio OpenRouter `403 Key limit exceeded`).

Nel frattempo, gli errori temporanei `402` relativi a finestra di utilizzo e limiti di spesa di organizzazione/workspace sono classificati come `rate_limit` quando il messaggio sembra ritentabile (ad esempio `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` o `organization spending limit exceeded`). Questi restano nel percorso breve di sospensione temporanea/passaggio di emergenza invece che nel percorso lungo di disabilitazione per fatturazione.
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

Impostazioni predefinite:

- Il backoff di fatturazione parte da **5 ore**, raddoppia per ogni errore di fatturazione e ha un limite di **24 ore**.
- I contatori di backoff vengono reimpostati se il profilo non ha generato errori per **24 ore** (configurabile).
- I nuovi tentativi per sovraccarico consentono **1 rotazione del profilo dello stesso fornitore** prima del passaggio a un modello alternativo.
- I nuovi tentativi per sovraccarico usano **0 ms di backoff** per impostazione predefinita.

## Modello alternativo

Se tutti i profili per un fornitore falliscono, OpenClaw passa al modello successivo in `agents.defaults.model.fallbacks`. Questo si applica agli errori di autenticazione, ai limiti di frequenza e alle scadenze del tempo di attesa che hanno esaurito la rotazione dei profili (altri errori non avanzano all'alternativa). Gli errori del fornitore che non espongono dettagli sufficienti sono comunque etichettati con precisione nello stato dell'alternativa: `empty_response` significa che il fornitore non ha restituito alcun messaggio o stato utilizzabile, `no_error_details` significa che il fornitore ha restituito esplicitamente `Unknown error (no error details in response)`, e `unclassified` significa che OpenClaw ha conservato l'anteprima grezza ma nessun classificatore l'ha ancora riconosciuta.

Gli errori di sovraccarico e limite di frequenza vengono gestiti in modo più aggressivo rispetto ai cooldown di fatturazione. Per impostazione predefinita, OpenClaw consente un tentativo con lo stesso profilo di autenticazione dello stesso provider, quindi passa al fallback del modello configurato successivo senza attendere. I segnali di provider occupato come `ModelNotReadyException` rientrano in questa categoria di sovraccarico. Regola questo comportamento con `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` e `auth.cooldowns.rateLimitedProfileRotations`.

Quando un'esecuzione parte dal primario predefinito configurato, da un primario di un processo cron, da un primario di agente con fallback espliciti o da una sostituzione fallback selezionata automaticamente, OpenClaw può percorrere la catena di fallback configurata corrispondente. I primari di agente senza fallback espliciti e le selezioni utente esplicite (per esempio `/model ollama/qwen3.5:27b`, il selettore dei modelli, `sessions.patch` o sostituzioni una tantum di provider/modello tramite CLI) sono rigidi: se quel provider/modello non è raggiungibile o fallisce prima di produrre una risposta, OpenClaw segnala l'errore invece di rispondere da un fallback non correlato.

### Regole della catena dei candidati

OpenClaw costruisce l'elenco dei candidati dal `provider/model` attualmente richiesto più i fallback configurati.

<AccordionGroup>
  <Accordion title="Regole">
    - Il modello richiesto è sempre il primo.
    - I fallback espliciti configurati vengono deduplicati ma non filtrati dall'allowlist dei modelli. Sono trattati come intenzione esplicita dell'operatore.
    - Se l'esecuzione corrente è già su un fallback configurato nella stessa famiglia di provider, OpenClaw continua a usare l'intera catena configurata.
    - Se l'esecuzione corrente è su un provider diverso da quello della configurazione e quel modello corrente non fa già parte della catena di fallback configurata, OpenClaw non aggiunge fallback configurati non correlati da un altro provider.
    - Quando non viene fornita alcuna sostituzione fallback esplicita al runner di fallback, il primario configurato viene aggiunto alla fine in modo che la catena possa tornare al valore predefinito normale una volta esauriti i candidati precedenti.
    - Quando un chiamante fornisce `fallbacksOverride`, il runner usa esattamente il modello richiesto più quell'elenco di sostituzione. Un elenco vuoto disabilita il fallback del modello e impedisce che il primario configurato venga aggiunto come destinazione di ritentativo nascosta.

  </Accordion>
</AccordionGroup>

### Quali errori fanno avanzare il fallback

<Tabs>
  <Tab title="Continua su">
    - errori di autenticazione
    - limiti di frequenza ed esaurimento dei cooldown
    - errori di sovraccarico/provider occupato
    - errori di failover simili a timeout
    - disabilitazioni di fatturazione
    - `LiveSessionModelSwitchError`, che viene normalizzato in un percorso di failover così che un modello persistito obsoleto non crei un ciclo di ritentativi esterno
    - altri errori non riconosciuti quando rimangono ancora candidati

  </Tab>
  <Tab title="Non continua su">
    - interruzioni esplicite che non hanno forma di timeout/failover
    - errori di overflow del contesto che devono rimanere nella logica di compaction/ritentativo (per esempio `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` o `ollama error: context length exceeded`)
    - un errore sconosciuto finale quando non rimangono candidati

  </Tab>
</Tabs>

### Comportamento di salto cooldown rispetto a probe

Quando ogni profilo di autenticazione per un provider è già in cooldown, OpenClaw non salta automaticamente quel provider per sempre. Prende una decisione per ciascun candidato:

<AccordionGroup>
  <Accordion title="Decisioni per candidato">
    - Gli errori di autenticazione persistenti saltano immediatamente l'intero provider.
    - Le disabilitazioni di fatturazione di solito saltano, ma il candidato primario può comunque essere sondato con una limitazione, così il recupero è possibile senza riavvio.
    - Il candidato primario può essere sondato vicino alla scadenza del cooldown, con una limitazione per provider.
    - I fallback fratelli dello stesso provider possono essere tentati nonostante il cooldown quando l'errore sembra transitorio (`rate_limit`, `overloaded` o sconosciuto). Questo è particolarmente rilevante quando un limite di frequenza è legato al modello e un modello fratello può comunque recuperare immediatamente.
    - I probe dei cooldown transitori sono limitati a uno per provider per esecuzione fallback, così un singolo provider non blocca il fallback tra provider.

  </Accordion>
</AccordionGroup>

## Sostituzioni di sessione e cambio modello live

Le modifiche al modello di sessione sono stato condiviso. Il runner attivo, il comando `/model`, gli aggiornamenti di compaction/sessione e la riconciliazione della sessione live leggono o scrivono tutti parti della stessa voce di sessione.

Questo significa che i ritentativi fallback devono coordinarsi con il cambio modello live:

- Solo le modifiche al modello guidate esplicitamente dall'utente segnano un cambio live in sospeso. Questo include `/model`, `session_status(model=...)` e `sessions.patch`.
- Le modifiche al modello guidate dal sistema, come rotazione fallback, sostituzioni heartbeat o compaction, non segnano mai da sole un cambio live in sospeso.
- Le sostituzioni del modello guidate dall'utente sono trattate come selezioni esatte per la policy di fallback, quindi un provider selezionato non raggiungibile emerge come errore invece di essere mascherato da `agents.defaults.model.fallbacks`.
- Prima che inizi un ritentativo fallback, il runner di risposta persiste i campi di sostituzione fallback selezionati nella voce di sessione.
- Le sostituzioni fallback automatiche rimangono selezionate nei turni successivi così OpenClaw non sonda un primario già noto come problematico a ogni messaggio. `/new`, `/reset` e `sessions.reset` cancellano le sostituzioni di origine automatica e riportano la sessione al valore predefinito configurato.
- `/status` mostra il modello selezionato e, quando lo stato fallback differisce, il modello fallback attivo e il motivo.
- La riconciliazione della sessione live preferisce le sostituzioni di sessione persistite rispetto ai campi del modello runtime obsoleti.
- Se un errore di cambio live punta a un candidato successivo nella catena fallback attiva, OpenClaw salta direttamente a quel modello selezionato invece di percorrere prima candidati non correlati.
- Se il tentativo fallback fallisce, il runner ripristina solo i campi di sostituzione che ha scritto, e solo se corrispondono ancora a quel candidato fallito.

Questo evita la classica race:

<Steps>
  <Step title="Il primario fallisce">
    Il modello primario selezionato fallisce.
  </Step>
  <Step title="Fallback scelto in memoria">
    Il candidato fallback viene scelto in memoria.
  </Step>
  <Step title="Lo store di sessione indica ancora il vecchio primario">
    Lo store di sessione riflette ancora il vecchio primario.
  </Step>
  <Step title="La riconciliazione live legge uno stato obsoleto">
    La riconciliazione della sessione live legge lo stato di sessione obsoleto.
  </Step>
  <Step title="Il ritentativo torna indietro">
    Il ritentativo viene riportato al vecchio modello prima che inizi il tentativo fallback.
  </Step>
</Steps>

La sostituzione fallback persistita chiude quella finestra, e il rollback ristretto mantiene intatte le modifiche di sessione manuali o runtime più recenti.

## Osservabilità e riepiloghi degli errori

`runWithModelFallback(...)` registra dettagli per tentativo che alimentano i log e la messaggistica cooldown rivolta all'utente:

- provider/modello tentato
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` e motivi di failover simili)
- stato/codice facoltativo
- riepilogo dell'errore leggibile da una persona

I log strutturati `model_fallback_decision` includono anche campi piatti `fallbackStep*` quando un candidato fallisce, viene saltato o un fallback successivo riesce. Questi campi rendono esplicita la transizione tentata (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) così gli esportatori di log e diagnostica possono ricostruire l'errore del primario anche quando anche il fallback terminale fallisce.

Quando ogni candidato fallisce, OpenClaw genera `FallbackSummaryError`. Il runner di risposta esterno può usarlo per costruire un messaggio più specifico, come "tutti i modelli sono temporaneamente soggetti a limite di frequenza", e includere la scadenza cooldown più vicina quando è nota.

Quel riepilogo cooldown è consapevole del modello:

- i limiti di frequenza legati a modelli non correlati vengono ignorati per la catena provider/modello tentata
- se il blocco rimanente è un limite di frequenza legato al modello corrispondente, OpenClaw segnala l'ultima scadenza corrispondente che blocca ancora quel modello

## Configurazione correlata

Vedi [Configurazione Gateway](/it/gateway/configuration) per:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- routing `agents.defaults.imageModel`

Vedi [Modelli](/it/concepts/models) per la panoramica più ampia su selezione dei modelli e fallback.
