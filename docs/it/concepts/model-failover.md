---
read_when:
    - Diagnosi della rotazione dei profili di autenticazione, dei cooldown o del comportamento di fallback dei modelli
    - Aggiornamento delle regole di failover per profili di autenticazione o modelli
    - Comprendere come le sostituzioni del modello di sessione interagiscono con i nuovi tentativi di fallback
sidebarTitle: Model failover
summary: Come OpenClaw ruota i profili di autenticazione e passa ai modelli di riserva
title: Failover del modello
x-i18n:
    generated_at: "2026-06-27T17:25:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7be9b2ee7c2c6de42d454248a51219c1917ce9a3a93630dad0af6f67ec030de3
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
  <Step title="Risolvere lo stato della sessione">
    Risolve il modello di sessione attivo e la preferenza del profilo di autenticazione.
  </Step>
  <Step title="Creare la catena di candidati">
    Crea la catena di modelli candidati dalla selezione del modello corrente e dalla policy di fallback per quella fonte di selezione. I valori predefiniti configurati, i primari dei processi cron e i modelli di fallback selezionati automaticamente possono usare fallback configurati; le selezioni esplicite della sessione utente sono rigide.
  </Step>
  <Step title="Provare il provider corrente">
    Prova il provider corrente con le regole di rotazione/cooldown dei profili di autenticazione.
  </Step>
  <Step title="Avanzare sugli errori idonei al failover">
    Se quel provider è esaurito con un errore idoneo al failover, passa al modello candidato successivo.
  </Step>
  <Step title="Persistire l'override di fallback">
    Persiste l'override di fallback selezionato prima dell'avvio del nuovo tentativo, così gli altri lettori della sessione vedono lo stesso provider/modello che il runner sta per usare. L'override del modello persistito è contrassegnato come `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Eseguire un rollback mirato in caso di errore">
    Se il candidato di fallback fallisce, esegue il rollback solo dei campi di override della sessione di proprietà del fallback quando corrispondono ancora a quel candidato fallito.
  </Step>
  <Step title="Generare FallbackSummaryError se esauriti">
    Se tutti i candidati falliscono, genera un `FallbackSummaryError` con dettagli per ogni tentativo e la prima scadenza di cooldown nota, quando disponibile.
  </Step>
</Steps>

Questo è intenzionalmente più mirato di "salvare e ripristinare l'intera sessione". Il reply runner persiste solo i campi di selezione del modello di cui è proprietario per il fallback:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Questo impedisce a un nuovo tentativo di fallback fallito di sovrascrivere mutazioni di sessione più recenti e non correlate, come modifiche manuali `/model` o aggiornamenti della rotazione di sessione avvenuti mentre il tentativo era in esecuzione.

## Policy della fonte di selezione

OpenClaw separa il provider/modello selezionato dal motivo per cui è stato selezionato. Quella fonte controlla se la catena di fallback è consentita:

- **Valore predefinito configurato**: `agents.defaults.model.primary` usa `agents.defaults.model.fallbacks`.
- **Primario dell'agente**: `agents.list[].model` è rigido a meno che quell'oggetto modello dell'agente includa i propri `fallbacks`. Usa `fallbacks: []` per rendere esplicito il comportamento rigido, oppure fornisci una lista non vuota per abilitare quell'agente al fallback del modello.
- **Override di fallback automatico**: un fallback di runtime scrive `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` e il modello di origine selezionato prima di riprovare. Quell'override automatico può continuare a percorrere la catena di fallback configurata senza sondare il primario a ogni messaggio, ma OpenClaw sonda periodicamente di nuovo l'origine configurata e cancella l'override automatico quando si riprende. Anche `/new`, `/reset` e `sessions.reset` cancellano gli override di origine automatica. Le esecuzioni Heartbeat senza un `heartbeat.model` esplicito cancellano gli override automatici diretti quando la loro origine non corrisponde più al valore predefinito configurato corrente.
- **Override della sessione utente**: `/model`, il selettore di modello, `session_status(model=...)` e `sessions.patch` scrivono `modelOverrideSource: "user"`. Questa è una selezione esatta della sessione. Se il provider/modello selezionato fallisce prima di produrre una risposta, OpenClaw segnala l'errore invece di rispondere da un fallback configurato non correlato.
- **Override di sessione legacy**: le voci di sessione più vecchie possono avere `modelOverride` senza `modelOverrideSource`. OpenClaw le tratta come override utente, così una vecchia selezione esplicita non viene convertita silenziosamente in comportamento di fallback.
- **Modello del payload Cron**: un `payload.model` / `--model` di un processo cron è un primario del processo, non un override della sessione utente. Usa i fallback configurati a meno che il processo fornisca `payload.fallbacks`; `payload.fallbacks: []` rende rigida l'esecuzione cron.

L'intervallo di sondaggio del primario per il fallback automatico è di cinque minuti e non è configurabile. OpenClaw ricorda i sondaggi recenti per sessione e modello primario, così un primario che fallisce non viene riprovato a ogni turno. OpenClaw invia un avviso visibile quando una sessione passa al fallback e un altro avviso quando torna al primario selezionato; non ripete l'avviso a ogni turno di fallback persistente.

## Cache di salto degli errori di autenticazione

Per impostazione predefinita, ogni nuovo turno mantiene il comportamento esistente di nuovo tentativo di fallback: OpenClaw
proverà di nuovo ogni candidato di fallback configurato, inclusi i candidati non primari
che hanno recentemente fallito con `auth` o `auth_permanent`.

Gli operatori che preferiscono sopprimere questi errori di autenticazione ripetuti possono abilitarlo con:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Quando abilitato, OpenClaw registra un marcatore di salto in memoria e circoscritto alla sessione per un
candidato di fallback non primario dopo un errore di classe autenticazione. Il marcatore è indicizzato
per ID sessione, provider e modello. I candidati primari non vengono mai saltati, quindi una
selezione esplicita del modello utente mostra comunque il vero errore di autenticazione. La cache è
locale al processo e viene cancellata al riavvio del Gateway.

Il valore è un TTL in millisecondi. `0` o un valore non impostato disabilita la cache.
I valori positivi vengono limitati tra 1 secondo e 10 minuti.

## Avvisi di fallback visibili all'utente

Quando una sessione passa a un fallback selezionato automaticamente, OpenClaw invia un avviso di stato nella stessa superficie di risposta:

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

Quando un sondaggio successivo riesce e la sessione torna al primario selezionato, OpenClaw invia:

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

Questi avvisi sono messaggi operativi, non contenuto dell'assistente. Vengono consegnati una volta per ogni cambio di stato, inclusi i turni con soli effetti collaterali quando possibile, ma i turni di fallback persistente non li ripetono. La consegna aggira la normale soppressione delle risposte alla fonte, l'avviso non consuma il primo slot di risposta dell'assistente per i canali con thread ed è escluso dalla sintesi vocale e dall'estrazione degli impegni.

## Archiviazione dell'autenticazione (chiavi + OAuth)

OpenClaw usa **profili di autenticazione** sia per le chiavi API sia per i token OAuth.

- I segreti e lo stato di routing dell'autenticazione di runtime risiedono in `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- La configurazione `auth.profiles` / `auth.order` contiene **solo metadati + routing** (nessun segreto).
- File OAuth legacy di sola importazione: `~/.openclaw/credentials/oauth.json` (importato nello store di autenticazione per agente al primo utilizzo).
- I file legacy `auth-profiles.json`, `auth-state.json` e `auth.json` per agente vengono importati da `openclaw doctor --fix`.

Maggiori dettagli: [OAuth](/it/concepts/oauth)

Tipi di credenziali:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` per alcuni provider)

## ID dei profili

Gli accessi OAuth creano profili distinti, così più account possono coesistere.

- Predefinito: `provider:default` quando non è disponibile alcuna email.
- OAuth con email: `provider:<email>` (per esempio `google-antigravity:user@gmail.com`).

I profili risiedono nello store dei profili di autenticazione `openclaw-agent.sqlite` per agente.

## Ordine di rotazione

Quando un provider ha più profili, OpenClaw sceglie un ordine come questo:

<Steps>
  <Step title="Configurazione esplicita">
    `auth.order[provider]` (se impostato).
  </Step>
  <Step title="Profili configurati">
    `auth.profiles` filtrato per provider.
  </Step>
  <Step title="Profili archiviati">
    Voci dei profili di autenticazione SQLite per agente per il provider.
  </Step>
</Steps>

Se non è configurato alcun ordine esplicito, OpenClaw usa un ordine round-robin:

- **Chiave primaria:** tipo di profilo (**OAuth prima delle chiavi API**).
- **Chiave secondaria:** `usageStats.lastUsed` (prima il più vecchio, all'interno di ogni tipo).
- I **profili in cooldown/disabilitati** vengono spostati alla fine, ordinati per scadenza più vicina.

### Persistenza della sessione (compatibile con la cache)

OpenClaw **fissa il profilo di autenticazione scelto per sessione** per mantenere calde le cache del provider. **Non** ruota a ogni richiesta. Il profilo fissato viene riutilizzato finché:

- la sessione viene reimpostata (`/new` / `/reset`)
- una Compaction viene completata (il conteggio delle Compaction aumenta)
- il profilo è in cooldown/disabilitato

La selezione manuale tramite `/model …@<profileId>` imposta un **override utente** per quella sessione e non viene ruotata automaticamente finché non inizia una nuova sessione.

<Note>
I profili fissati automaticamente (selezionati dal router di sessione) sono trattati come una **preferenza**: vengono provati per primi, ma OpenClaw può ruotare a un altro profilo in caso di rate limit/timeout. Quando il profilo originale torna disponibile, le nuove esecuzioni possono preferirlo di nuovo senza modificare il modello o il runtime selezionato. I profili fissati dall'utente restano bloccati su quel profilo; se fallisce e i fallback del modello sono configurati, OpenClaw passa al modello successivo invece di cambiare profilo.
</Note>

### Abbonamento OpenAI Codex più backup con chiave API

Per i modelli agente OpenAI, autenticazione e runtime sono separati. `openai/gpt-*` resta sul
harness Codex mentre l'autenticazione può ruotare tra un profilo di abbonamento Codex e
un backup con chiave API OpenAI.

Usa `auth.order.openai` per l'ordine rivolto all'utente:

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Usa `openai:*` sia per i profili OAuth ChatGPT/Codex sia per i profili con chiave API
OpenAI. Quando l'abbonamento raggiunge un limite di utilizzo Codex,
OpenClaw registra l'orario esatto di reset quando Codex ne fornisce uno, prova il profilo di autenticazione
ordinato successivo e mantiene l'esecuzione all'interno del harness Codex. Una volta trascorso l'orario di reset,
il profilo di abbonamento torna idoneo e la successiva selezione automatica
può tornarci.

Usa un profilo fissato dall'utente solo quando vuoi forzare un account/chiave per quella
sessione. I profili fissati dall'utente sono intenzionalmente rigidi e non saltano silenziosamente
a un altro profilo.

## Cooldown

Quando un profilo fallisce a causa di errori di autenticazione/rate limit (o di un timeout che sembra un rate limit), OpenClaw lo contrassegna in cooldown e passa al profilo successivo.

<AccordionGroup>
  <Accordion title="Cosa finisce nel bucket rate-limit / timeout">
    Quel bucket di rate limit è più ampio di un semplice `429`: include anche messaggi del provider come `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` e limiti periodici della finestra di utilizzo come `weekly/monthly limit reached`.

    Gli errori di formato/richiesta non valida sono di solito terminali perché riprovare lo stesso payload fallirebbe allo stesso modo, quindi OpenClaw li mostra invece di ruotare i profili di autenticazione. I percorsi noti di riparazione con nuovo tentativo possono abilitarlo esplicitamente: per esempio, gli errori di convalida degli ID delle chiamate agli strumenti Cloud Code Assist vengono sanificati e riprovati una volta tramite la policy `allowFormatRetry`. Gli errori di motivo di arresto compatibili con OpenAI come `Unhandled stop reason: error`, `stop reason: error` e `reason: error` sono classificati come segnali di timeout/failover.

    Anche il testo generico del server può finire in quel bucket di timeout quando la fonte corrisponde a un pattern transitorio noto. Per esempio, il messaggio nudo del wrapper di stream del runtime del modello `An unknown error occurred` è trattato come idoneo al failover per ogni provider perché il runtime del modello condiviso lo emette quando gli stream del provider terminano con `stopReason: "aborted"` o `stopReason: "error"` senza dettagli specifici. Anche i payload JSON `api_error` con testo transitorio del server come `internal server error`, `unknown error, 520`, `upstream error` o `backend error` sono trattati come timeout idonei al failover.

    Il testo generico upstream specifico di OpenRouter, come il semplice `Provider returned error`, viene trattato come timeout solo quando il contesto del provider è effettivamente OpenRouter. Il testo generico di fallback interno come `LLM request failed with an unknown error.` resta conservativo e non attiva il failover da solo.

  </Accordion>
  <Accordion title="Limiti retry-after dell'SDK">
    Alcuni SDK dei provider potrebbero altrimenti attendere per una lunga finestra `Retry-After` prima di restituire il controllo a OpenClaw. Per gli SDK basati su Stainless, come Anthropic e OpenAI, OpenClaw limita per impostazione predefinita le attese interne all'SDK `retry-after-ms` / `retry-after` a 60 secondi ed espone immediatamente le risposte ritentabili più lunghe, così questo percorso di failover può essere eseguito. Regola o disabilita il limite con `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; consulta [Comportamento dei retry](/it/concepts/retry).
  </Accordion>
  <Accordion title="Cooldown con ambito modello">
    I cooldown dei limiti di frequenza possono anche avere ambito modello:

    - OpenClaw registra `cooldownModel` per i fallimenti da limite di frequenza quando l'id del modello che fallisce è noto.
    - Un modello sibling sullo stesso provider può comunque essere provato quando il cooldown è limitato a un modello diverso.
    - Le finestre di fatturazione/disabilitazione bloccano comunque l'intero profilo tra i modelli.

  </Accordion>
</AccordionGroup>

I cooldown usano backoff esponenziale:

- 1 minuto
- 5 minuti
- 25 minuti
- 1 ora (limite)

Lo stato viene archiviato nello stato di autenticazione SQLite per agente sotto `usageStats`:

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

I fallimenti di fatturazione/credito (per esempio "insufficient credits" / "credit balance too low") sono trattati come meritevoli di failover, ma di solito non sono transitori. Invece di un breve cooldown, OpenClaw contrassegna il profilo come **disabilitato** (con un backoff più lungo) e passa al profilo/provider successivo.

<Note>
Non tutte le risposte che sembrano legate alla fatturazione sono `402`, e non tutti gli HTTP `402` arrivano qui. OpenClaw mantiene il testo di fatturazione esplicito nel percorso di fatturazione anche quando un provider restituisce invece `401` o `403`, ma i matcher specifici del provider restano limitati al provider che li possiede (per esempio OpenRouter `403 Key limit exceeded`).

Nel frattempo, gli errori temporanei `402` relativi a finestre di utilizzo e limiti di spesa di organizzazione/workspace sono classificati come `rate_limit` quando il messaggio sembra ritentabile (per esempio `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` o `organization spending limit exceeded`). Questi restano sul percorso di cooldown/failover breve invece che sul percorso lungo di disabilitazione per fatturazione.
</Note>

Lo stato viene archiviato nello stato di autenticazione SQLite per agente:

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

- Il backoff di fatturazione parte da **5 ore**, raddoppia a ogni fallimento di fatturazione e ha un limite di **24 ore**.
- I contatori di backoff si azzerano se il profilo non ha fallito per **24 ore** (configurabile).
- I retry per sovraccarico consentono **1 rotazione di profilo dello stesso provider** prima del fallback del modello.
- I retry per sovraccarico usano per impostazione predefinita un backoff di **0 ms**.

## Fallback del modello

Se tutti i profili per un provider falliscono, OpenClaw passa al modello successivo in `agents.defaults.model.fallbacks`. Questo si applica ai fallimenti di autenticazione, ai limiti di frequenza e ai timeout che hanno esaurito la rotazione dei profili (altri errori non fanno avanzare il fallback). Gli errori del provider che non espongono dettagli sufficienti sono comunque etichettati con precisione nello stato di fallback: `empty_response` significa che il provider non ha restituito alcun messaggio o stato utilizzabile, `no_error_details` significa che il provider ha restituito esplicitamente `Unknown error (no error details in response)`, e `unclassified` significa che OpenClaw ha preservato l'anteprima grezza ma nessun classificatore l'ha ancora riconosciuta.

Gli errori di sovraccarico e limite di frequenza sono gestiti in modo più aggressivo rispetto ai cooldown di fatturazione. Per impostazione predefinita, OpenClaw consente un retry del profilo di autenticazione dello stesso provider, poi passa al fallback del modello configurato successivo senza attendere. I segnali di provider occupato come `ModelNotReadyException` finiscono in quel gruppo di sovraccarico. Regola questo comportamento con `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` e `auth.cooldowns.rateLimitedProfileRotations`.

Quando un'esecuzione parte dal primario predefinito configurato, da un primario di cron job, da un primario di agente con fallback espliciti o da un override di fallback selezionato automaticamente, OpenClaw può percorrere la catena di fallback configurata corrispondente. I primari di agente senza fallback espliciti e le selezioni utente esplicite (per esempio `/model ollama/qwen3.5:27b`, il selettore di modello, `sessions.patch` o gli override una tantum di provider/modello da CLI) sono rigorosi: se quel provider/modello non è raggiungibile o fallisce prima di produrre una risposta, OpenClaw segnala il fallimento invece di rispondere da un fallback non correlato.

### Regole della catena di candidati

OpenClaw costruisce l'elenco dei candidati dal `provider/model` attualmente richiesto più i fallback configurati.

<AccordionGroup>
  <Accordion title="Regole">
    - Il modello richiesto è sempre il primo.
    - I fallback configurati espliciti vengono deduplicati ma non filtrati dalla allowlist dei modelli. Sono trattati come intento esplicito dell'operatore.
    - Se l'esecuzione corrente è già su un fallback configurato nella stessa famiglia di provider, OpenClaw continua a usare l'intera catena configurata.
    - Quando non viene fornito alcun override di fallback esplicito, i fallback configurati vengono provati prima del primario configurato anche se il modello richiesto usa un provider diverso.
    - Quando non viene fornito alcun override di fallback esplicito al runner di fallback, il primario configurato viene aggiunto alla fine, così la catena può tornare al valore predefinito normale una volta esauriti i candidati precedenti.
    - Quando un chiamante fornisce `fallbacksOverride`, il runner usa esattamente il modello richiesto più quell'elenco di override. Un elenco vuoto disabilita il fallback del modello e impedisce che il primario configurato venga aggiunto come destinazione di retry nascosta.

  </Accordion>
</AccordionGroup>

### Quali errori fanno avanzare il fallback

<Tabs>
  <Tab title="Continua su">
    - fallimenti di autenticazione
    - limiti di frequenza ed esaurimento del cooldown
    - errori di sovraccarico/provider occupato
    - errori di failover simili a timeout
    - disabilitazioni per fatturazione
    - `LiveSessionModelSwitchError`, che viene normalizzato in un percorso di failover affinché un modello persistito obsoleto non crei un ciclo di retry esterno
    - altri errori non riconosciuti quando restano ancora candidati

  </Tab>
  <Tab title="Non continua su">
    - interruzioni esplicite che non hanno forma di timeout/failover
    - errori di overflow del contesto che devono restare dentro la logica di Compaction/retry (per esempio `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` o `ollama error: context length exceeded`)
    - un errore sconosciuto finale quando non restano candidati

  </Tab>
</Tabs>

### Salto del cooldown rispetto al comportamento di probe

Quando ogni profilo di autenticazione per un provider è già in cooldown, OpenClaw non salta automaticamente quel provider per sempre. Prende una decisione per candidato:

<AccordionGroup>
  <Accordion title="Decisioni per candidato">
    - I fallimenti di autenticazione persistenti saltano immediatamente l'intero provider.
    - Le disabilitazioni per fatturazione di solito vengono saltate, ma il candidato primario può comunque essere sondato con throttling, così il recupero è possibile senza riavviare.
    - Il candidato primario può essere sondato vicino alla scadenza del cooldown, con throttling per provider.
    - I fallback sibling dello stesso provider possono essere tentati nonostante il cooldown quando il fallimento sembra transitorio (`rate_limit`, `overloaded` o sconosciuto). Questo è particolarmente rilevante quando un limite di frequenza ha ambito modello e un modello sibling può comunque recuperare immediatamente.
    - I probe dei cooldown transitori sono limitati a uno per provider per esecuzione di fallback, così un singolo provider non blocca il fallback tra provider.

  </Accordion>
</AccordionGroup>

## Override di sessione e cambio modello live

Le modifiche del modello di sessione sono stato condiviso. Il runner attivo, il comando `/model`, gli aggiornamenti di Compaction/sessione e la riconciliazione della sessione live leggono o scrivono tutti parti della stessa voce di sessione.

Ciò significa che i retry di fallback devono coordinarsi con il cambio modello live:

- Solo le modifiche del modello guidate esplicitamente dall'utente segnano un cambio live in sospeso. Questo include `/model`, `session_status(model=...)` e `sessions.patch`.
- Le modifiche del modello guidate dal sistema, come rotazione di fallback, override di Heartbeat o Compaction, non segnano mai da sole un cambio live in sospeso.
- Gli override del modello guidati dall'utente sono trattati come selezioni esatte per la policy di fallback, quindi un provider selezionato non raggiungibile emerge come fallimento invece di essere mascherato da `agents.defaults.model.fallbacks`.
- Prima che inizi un retry di fallback, il runner di risposta persiste nella voce di sessione i campi di override del fallback selezionato.
- Gli override di fallback automatici restano selezionati nei turni successivi, così OpenClaw non sonda un primario noto come non funzionante a ogni messaggio. OpenClaw sonda periodicamente di nuovo l'origine configurata e cancella l'override automatico quando si ripristina; `/new`, `/reset` e `sessions.reset` cancellano immediatamente gli override di origine automatica.
- Le risposte utente annunciano le transizioni di fallback e il recupero con fallback cancellato una volta per ogni cambio di stato. I turni di fallback persistenti non ripetono l'avviso.
- `/status` mostra il modello selezionato e, quando lo stato di fallback differisce, il modello di fallback attivo e il motivo.
- La riconciliazione della sessione live preferisce gli override di sessione persistiti rispetto ai campi di modello runtime obsoleti.
- Se un errore di cambio live punta a un candidato successivo nella catena di fallback attiva, OpenClaw salta direttamente a quel modello selezionato invece di percorrere prima candidati non correlati.
- Se il tentativo di fallback fallisce, il runner ripristina solo i campi di override che ha scritto, e solo se corrispondono ancora a quel candidato fallito.

Questo evita la classica race:

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
  <Step title="La riconciliazione live legge stato obsoleto">
    La riconciliazione della sessione live legge lo stato di sessione obsoleto.
  </Step>
  <Step title="Retry riportato indietro">
    Il retry viene riportato al vecchio modello prima che inizi il tentativo di fallback.
  </Step>
</Steps>

L'override di fallback persistito chiude quella finestra, e il rollback ristretto mantiene intatte le modifiche manuali o runtime di sessione più recenti.

## Osservabilità e riepiloghi dei fallimenti

`runWithModelFallback(...)` registra dettagli per tentativo che alimentano i log e i messaggi di cooldown rivolti all'utente:

- provider/modello tentato
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` e motivi di failover simili)
- stato/codice facoltativo
- riepilogo dell'errore leggibile

I log strutturati `model_fallback_decision` includono anche campi piatti `fallbackStep*` quando un candidato fallisce, viene saltato o un fallback successivo riesce. Questi campi rendono esplicita la transizione tentata (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), così gli esportatori di log e diagnostica possono ricostruire il fallimento primario anche quando anche il fallback terminale fallisce.

Quando ogni candidato fallisce, OpenClaw lancia `FallbackSummaryError`. Il runner di risposta esterno può usarlo per costruire un messaggio più specifico, come "tutti i modelli sono temporaneamente soggetti a limite di frequenza", e includere la scadenza del cooldown più vicina quando è nota.

Quel riepilogo del cooldown è consapevole del modello:

- i limiti di frequenza con ambito modello non correlati vengono ignorati per la catena provider/modello tentata
- se il blocco restante è un limite di frequenza con ambito modello corrispondente, OpenClaw segnala l'ultima scadenza corrispondente che blocca ancora quel modello

## Configurazione correlata

Consulta [Configurazione del Gateway](/it/gateway/configuration) per:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- instradamento `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- instradamento `agents.defaults.imageModel`

Consulta [Modelli](/it/concepts/models) per una panoramica più ampia sulla selezione dei modelli e sul fallback.
