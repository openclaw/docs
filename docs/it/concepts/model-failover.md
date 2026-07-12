---
read_when:
    - Diagnosi del comportamento di rotazione dei profili di autenticazione, dei periodi di attesa o del fallback del modello
    - Aggiornamento delle regole di failover per i profili di autenticazione o i modelli
    - Comprendere come le sostituzioni del modello di sessione interagiscono con i nuovi tentativi di fallback
sidebarTitle: Model failover
summary: Come OpenClaw alterna i profili di autenticazione e passa a modelli alternativi in caso di errore
title: Failover del modello
x-i18n:
    generated_at: "2026-07-12T06:57:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2da6399c8f5c6d9ab40486b553a41600a3c8eb64efa09e72784b81e42edbba61
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw gestisce gli errori in due fasi:

1. **Rotazione del profilo di autenticazione** all'interno del provider corrente.
2. **Fallback del modello** al modello successivo in `agents.defaults.model.fallbacks`.

## Flusso di esecuzione

<Steps>
  <Step title="Resolve session state">
    Risolve il modello della sessione attiva e la preferenza per il profilo di autenticazione.
  </Step>
  <Step title="Build candidate chain">
    Crea la catena dei modelli candidati a partire dalla selezione corrente del modello e dai criteri di fallback per l'origine di tale selezione. Le impostazioni predefinite configurate, i modelli primari dei processi Cron e i modelli di fallback selezionati automaticamente possono usare i fallback configurati; le selezioni esplicite della sessione utente sono rigide.
  </Step>
  <Step title="Try the current provider">
    Prova il provider corrente applicando le regole di rotazione e sospensione temporanea dei profili di autenticazione.
  </Step>
  <Step title="Advance on failover-worthy errors">
    Se le possibilità per tale provider sono esaurite a causa di un errore che giustifica il failover, passa al modello candidato successivo.
  </Step>
  <Step title="Persist fallback override">
    Salva l'override di fallback selezionato prima dell'inizio del nuovo tentativo, affinché gli altri lettori della sessione vedano lo stesso provider e modello che l'esecutore sta per usare. L'override del modello salvato è contrassegnato con `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Roll back narrowly on failure">
    Se il modello candidato di fallback non riesce, ripristina soltanto i campi di override della sessione appartenenti al fallback, purché corrispondano ancora al candidato non riuscito.
  </Step>
  <Step title="Throw FallbackSummaryError if exhausted">
    Se tutti i candidati non riescono, genera un `FallbackSummaryError` con i dettagli di ciascun tentativo e la scadenza più prossima della sospensione temporanea, quando nota.
  </Step>
</Steps>

Questo comportamento è intenzionalmente più circoscritto rispetto a «salvare e ripristinare l'intera sessione». L'esecutore delle risposte salva soltanto i campi di selezione del modello che gestisce per il fallback: `providerOverride`, `modelOverride`, `modelOverrideSource`, `authProfileOverride`, `authProfileOverrideSource`, `authProfileOverrideCompactionCount`. Ciò impedisce che un tentativo di fallback non riuscito sovrascriva modifiche della sessione più recenti e non correlate, come una modifica manuale tramite `/model` o un aggiornamento della rotazione della sessione avvenuto durante il tentativo.

## Criteri relativi all'origine della selezione

L'origine della selezione determina se la catena di fallback è consentita:

- **Impostazione predefinita configurata**: `agents.defaults.model.primary` usa `agents.defaults.model.fallbacks`.
- **Modello primario dell'agente**: `agents.list[].model` è rigido, a meno che l'oggetto del modello dell'agente non includa i propri `fallbacks`. Usa `fallbacks: []` per rendere esplicito il comportamento rigido oppure un elenco non vuoto per abilitare il fallback del modello per tale agente.
- **Override di fallback automatico**: prima di riprovare, un fallback in fase di esecuzione scrive `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` e il modello di origine selezionato. Questo override continua a percorrere la catena di fallback configurata senza verificare il modello primario a ogni messaggio, ma OpenClaw verifica l'origine configurata ogni 5 minuti (intervallo non configurabile) e rimuove l'override quando questa torna disponibile. Anche `/new`, `/reset` e `sessions.reset` rimuovono gli override di origine automatica. Le esecuzioni Heartbeat prive di un `heartbeat.model` esplicito rimuovono gli override automatici diretti quando la loro origine non corrisponde più all'impostazione predefinita configurata corrente.
- **Override della sessione utente**: `/model`, il selettore del modello, `session_status(model=...)` e `sessions.patch` scrivono `modelOverrideSource: "user"`. Si tratta di una selezione esatta per la sessione. Se il provider o il modello selezionato non riesce prima di produrre una risposta, OpenClaw segnala l'errore anziché rispondere usando un fallback configurato non correlato.
- **Override di sessione precedente**: le voci di sessione meno recenti possono contenere `modelOverride` senza `modelOverrideSource`. OpenClaw le considera override utente, affinché una vecchia selezione esplicita non venga convertita silenziosamente in un comportamento di fallback.
- **Modello del payload Cron**: il `payload.model` / `--model` di un processo Cron è il modello primario del processo, non un override della sessione utente. Usa i fallback configurati, a meno che il processo non fornisca `payload.fallbacks`; `payload.fallbacks: []` rende rigida l'esecuzione Cron.

OpenClaw memorizza per ogni sessione e modello primario le verifiche recenti del modello primario, in modo che un modello primario non funzionante non venga riprovato a ogni interazione. Invia un avviso visibile quando una sessione passa al fallback e un altro avviso quando torna al modello primario selezionato; non ripete l'avviso a ogni interazione che continua a usare lo stesso fallback.

## Cache per ignorare gli errori di autenticazione

Per impostazione predefinita, ogni nuova interazione mantiene il comportamento esistente per i nuovi tentativi di fallback: OpenClaw riprova ogni candidato di fallback configurato, inclusi i candidati non primari che recentemente hanno restituito un errore `auth` o `auth_permanent`.

Per evitare la ripetizione degli errori di autenticazione, abilita:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Quando questa opzione è abilitata, dopo un errore di autenticazione OpenClaw registra in memoria un indicatore di esclusione limitato alla sessione per il candidato di fallback non primario, identificato dall'ID della sessione, dal provider e dal modello. I candidati primari non vengono mai ignorati, quindi una selezione esplicita del modello da parte dell'utente continua a mostrare il reale errore di autenticazione. La cache è locale al processo e viene svuotata al riavvio del Gateway.

Il valore è un TTL espresso in millisecondi. `0` o l'assenza del valore disabilitano la cache. I valori positivi vengono limitati a un intervallo compreso tra 1 secondo e 10 minuti.

## Avvisi di fallback visibili all'utente

Quando una sessione passa a un fallback selezionato automaticamente, OpenClaw invia un avviso di stato nella stessa superficie di risposta:

```text
↪️ Fallback del modello: <fallback> (selezionato <primary>; <reason>)
```

Quando una verifica successiva riesce e la sessione torna al modello primario selezionato, OpenClaw invia:

```text
↪️ Fallback del modello rimosso: <primary> (in precedenza <fallback>)
```

Questi avvisi sono messaggi operativi, non contenuti dell'assistente. Vengono inviati una volta per ogni cambiamento di stato, incluse, quando possibile, le interazioni che producono soltanto effetti collaterali, ma non vengono ripetuti nelle interazioni che continuano a usare lo stesso fallback. L'invio aggira la normale soppressione delle risposte all'origine, non occupa il primo spazio di risposta dell'assistente per i canali con conversazioni in thread ed è escluso dalla sintesi vocale e dall'estrazione degli impegni.

## Archiviazione dell'autenticazione (chiavi + OAuth)

OpenClaw usa **profili di autenticazione** sia per le chiavi API sia per i token OAuth.

- I segreti e lo stato di instradamento dell'autenticazione in fase di esecuzione risiedono in `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- Le configurazioni `auth.profiles` / `auth.order` contengono **soltanto metadati e instradamento** (nessun segreto).
- File OAuth precedente usato soltanto per l'importazione: `~/.openclaw/credentials/oauth.json` (importato nell'archivio di autenticazione del singolo agente al primo utilizzo).
- I precedenti file `auth-profiles.json`, `auth-state.json` e i file `auth.json` dei singoli agenti vengono importati da `openclaw doctor --fix`.

Ulteriori dettagli: [OAuth](/it/concepts/oauth)

Tipi di credenziali:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` per alcuni provider)
- `type: "token"` → token statico di tipo bearer, facoltativamente con scadenza; OpenClaw non lo rinnova (usato per `aws-sdk` e altre modalità di autenticazione basate su una catena di credenziali)

## ID dei profili

Gli accessi OAuth creano profili distinti, in modo che possano coesistere più account.

- Impostazione predefinita: `provider:default` quando non è disponibile alcun indirizzo email.
- OAuth con indirizzo email: `provider:<email>` (ad esempio `google-antigravity:user@gmail.com`).

I profili risiedono nell'archivio dei profili di autenticazione `openclaw-agent.sqlite` del singolo agente.

## Ordine di rotazione

Quando un provider dispone di più profili, OpenClaw sceglie l'ordine nel modo seguente:

<Steps>
  <Step title="Explicit config">
    `auth.order[provider]` (se impostato).
  </Step>
  <Step title="Configured profiles">
    `auth.profiles` filtrati per provider.
  </Step>
  <Step title="Stored profiles">
    Voci dei profili di autenticazione SQLite del singolo agente relative al provider.
  </Step>
</Steps>

Se non è configurato alcun ordine esplicito, OpenClaw usa un ordine circolare:

- **Chiave primaria:** tipo di profilo (**OAuth, quindi token statico, quindi chiave API**).
- **Chiave secondaria:** `usageStats.lastUsed` (prima il meno recente, all'interno di ciascun tipo).
- I **profili sospesi temporaneamente o disabilitati** vengono spostati in fondo, ordinati in base alla scadenza più prossima.

### Persistenza nella sessione (favorevole alla cache)

OpenClaw **fissa il profilo di autenticazione scelto per ogni sessione** per mantenere attive le cache del provider. **Non** effettua la rotazione a ogni richiesta. Il profilo fissato viene riutilizzato finché:

- la sessione non viene reimpostata (`/new` / `/reset`)
- non viene completata una Compaction (il conteggio delle Compaction aumenta)
- il profilo non viene sospeso temporaneamente o disabilitato

La selezione manuale tramite `/model …@<profileId>` imposta un **override utente** per tale sessione e non viene sottoposta a rotazione automatica fino all'avvio di una nuova sessione.

<Note>
I profili fissati automaticamente (selezionati dal router della sessione) vengono trattati come una **preferenza**: vengono provati per primi, ma OpenClaw può passare a un altro profilo in caso di limiti di frequenza o timeout. Quando il profilo originale torna disponibile, le nuove esecuzioni possono preferirlo nuovamente senza modificare il modello selezionato o l'ambiente di esecuzione. I profili fissati dall'utente restano vincolati a quel profilo; se non funziona e sono configurati fallback del modello, OpenClaw passa al modello successivo anziché cambiare profilo.
</Note>

### Abbonamento OpenAI Codex con chiave API di riserva

Per i modelli agente OpenAI, l'autenticazione e l'ambiente di esecuzione sono separati. `openai/gpt-*` rimane nell'infrastruttura Codex, mentre l'autenticazione può alternarsi tra un profilo di abbonamento Codex e una chiave API OpenAI di riserva.

Usa `auth.order.openai` per definire l'ordine visibile all'utente:

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Usa `openai:*` sia per i profili OAuth ChatGPT/Codex sia per i profili con chiave API OpenAI. Quando l'abbonamento raggiunge un limite di utilizzo di Codex, OpenClaw registra l'ora esatta di reimpostazione, se Codex la fornisce, prova il profilo di autenticazione successivo nell'ordine e mantiene l'esecuzione all'interno dell'infrastruttura Codex. Una volta trascorsa l'ora di reimpostazione, il profilo dell'abbonamento torna idoneo e la selezione automatica successiva può tornare a usarlo.

Usa un profilo fissato dall'utente soltanto quando vuoi imporre l'uso di uno specifico account o di una specifica chiave per tale sessione. I profili fissati dall'utente sono intenzionalmente rigidi e non passano silenziosamente a un altro profilo.

## Sospensioni temporanee

Quando un profilo non riesce a causa di errori di autenticazione o di limite di frequenza (oppure per un timeout che sembra causato da un limite di frequenza), OpenClaw lo sospende temporaneamente e passa al profilo successivo.

<AccordionGroup>
  <Accordion title="What lands in the rate-limit / timeout bucket">
    La categoria dei limiti di frequenza è più ampia del semplice `429`: include anche messaggi del provider come `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` e limiti periodici delle finestre di utilizzo, come `weekly limit reached` o `monthly limit exhausted`.

    Gli errori di formato o di richiesta non valida sono in genere terminali, perché riprovare lo stesso payload produrrebbe lo stesso errore; pertanto OpenClaw li mostra anziché effettuare la rotazione dei profili di autenticazione. I percorsi noti di riparazione e nuovo tentativo possono abilitarla esplicitamente: ad esempio, gli errori di convalida dell'ID delle chiamate agli strumenti di Cloud Code Assist vengono corretti e riprovati una volta tramite il criterio `allowFormatRetry`. Gli errori relativi al motivo di arresto compatibili con OpenAI, come `Unhandled stop reason: error`, `stop reason: error` e `reason: error`, vengono classificati come segnali di timeout o failover.

    Anche il testo generico del server può rientrare nella categoria dei timeout quando l'origine corrisponde a un modello transitorio noto. Ad esempio, il semplice messaggio dell'involucro del flusso dell'ambiente di esecuzione del modello `An unknown error occurred` viene considerato meritevole di failover per ogni provider, perché l'ambiente di esecuzione condiviso del modello lo emette quando i flussi del provider terminano con `stopReason: "aborted"` o `stopReason: "error"` senza dettagli specifici. Anche i payload JSON `api_error` contenenti testo relativo a errori transitori del server, come `internal server error`, `unknown error, 520`, `upstream error` o `backend error`, vengono considerati timeout meritevoli di failover.

    Il testo generico relativo all'upstream specifico di OpenRouter, come il semplice `Provider returned error`, viene considerato un timeout soltanto quando il contesto del provider è effettivamente OpenRouter. Il testo generico del fallback interno, come `LLM request failed with an unknown error.`, mantiene un comportamento prudente e non attiva autonomamente il failover.

  </Accordion>
  <Accordion title="Limiti di retry-after dell'SDK">
    Alcuni SDK dei provider potrebbero altrimenti restare in attesa per un lungo intervallo `Retry-After` prima di restituire il controllo a OpenClaw. Per gli SDK basati su Stainless, come quelli di Anthropic e OpenAI, OpenClaw limita per impostazione predefinita a 60 secondi le attese interne all'SDK `retry-after-ms` / `retry-after` e rende immediatamente disponibili le risposte riprovabili con attese più lunghe, in modo che possa essere eseguito questo percorso di failover. Regola o disabilita il limite con `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; consulta [Comportamento dei tentativi](/it/concepts/retry).
  </Accordion>
  <Accordion title="Cooldown specifici per modello">
    I cooldown dovuti ai limiti di frequenza possono anche essere specifici per modello:

    - OpenClaw registra `cooldownModel` per gli errori dovuti ai limiti di frequenza quando è noto l'ID del modello che ha generato l'errore.
    - È comunque possibile provare un modello correlato dello stesso provider quando il cooldown riguarda un modello diverso.
    - Le finestre di fatturazione/disabilitazione continuano a bloccare l'intero profilo per tutti i modelli.

  </Accordion>
</AccordionGroup>

I cooldown normali (non dovuti alla fatturazione o ad autenticazione permanentemente non valida) aumentano in base al numero di errori recenti del profilo:

- 1° errore: 30 secondi
- 2° errore: 1 minuto
- Dal 3° errore in poi: 5 minuti (limite massimo)

I contatori vengono reimpostati una volta trascorsa la finestra degli errori del profilo (`auth.cooldowns.failureWindowHours`, valore predefinito 24).

Lo stato viene archiviato nello stato di autenticazione SQLite specifico dell'agente, sotto `usageStats`:

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

Gli errori di fatturazione/credito (ad esempio "crediti insufficienti" / "saldo del credito troppo basso") vengono considerati idonei al failover, ma in genere non sono transitori. Invece di un breve cooldown, OpenClaw contrassegna il profilo come **disabilitato** (con un backoff più lungo) e passa al profilo/provider successivo.

<Note>
Non tutte le risposte riconducibili alla fatturazione hanno codice `402` e non tutti i codici HTTP `402` vengono gestiti in questo modo. OpenClaw mantiene il testo esplicito relativo alla fatturazione nel percorso di fatturazione anche quando un provider restituisce invece `401` o `403`, ma i criteri di corrispondenza specifici del provider rimangono limitati al provider che li gestisce (ad esempio OpenRouter `403 Key limit exceeded`).

Nel frattempo, gli errori temporanei `402` relativi alla finestra di utilizzo e ai limiti di spesa dell'organizzazione/area di lavoro vengono classificati come `rate_limit` quando il messaggio sembra indicare che sia possibile riprovare (ad esempio `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` o `organization spending limit exceeded`). Questi rimangono nel percorso di cooldown breve/failover anziché in quello di disabilitazione prolungata per fatturazione.
</Note>

Gli errori permanenti di autenticazione con un elevato grado di certezza (chiavi revocate/disattivate, aree di lavoro disattivate) seguono un percorso di disabilitazione simile, ma vengono ripristinati molto prima rispetto agli errori di fatturazione, poiché durante gli incidenti alcuni provider possono restituire temporaneamente payload che sembrano errori di autenticazione.

Lo stato viene archiviato nello stato di autenticazione SQLite specifico dell'agente:

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

Valori predefiniti (`auth.cooldowns.*`):

| Chiave                        | Valore predefinito | Scopo                                                                                       |
| ----------------------------- | ------------------ | ------------------------------------------------------------------------------------------- |
| `billingBackoffHours`         | 5                  | Backoff di base per la fatturazione, raddoppia a ogni errore di fatturazione                 |
| `billingMaxHours`             | 24                 | Limite massimo del backoff per la fatturazione                                               |
| `authPermanentBackoffMinutes` | 10                 | Backoff di base per gli errori permanenti di autenticazione con elevato grado di certezza    |
| `authPermanentMaxMinutes`     | 60                 | Limite massimo per tale backoff                                                              |
| `failureWindowHours`          | 24                 | I contatori degli errori vengono reimpostati se non si verificano errori in questa finestra  |
| `overloadedProfileRotations`  | 1                  | Rotazioni dei profili dello stesso provider consentite prima del fallback del modello in caso di sovraccarico |
| `overloadedBackoffMs`         | 0                  | Ritardo fisso prima di riprovare una rotazione dovuta al sovraccarico                        |
| `rateLimitedProfileRotations` | 1                  | Rotazioni dei profili dello stesso provider consentite prima del fallback del modello in caso di limite di frequenza |

Gli errori di sovraccarico e di limite di frequenza vengono gestiti in modo più aggressivo rispetto ai cooldown di fatturazione: per impostazione predefinita, OpenClaw consente un tentativo con un altro profilo di autenticazione dello stesso provider, quindi passa al fallback del modello configurato successivo senza attendere.

## Fallback del modello

Se tutti i profili di un provider non riescono, OpenClaw passa al modello successivo in `agents.defaults.model.fallbacks`. Ciò si applica agli errori di autenticazione, ai limiti di frequenza e ai timeout che hanno esaurito la rotazione dei profili (gli altri errori non fanno avanzare il fallback). Gli errori del provider che non forniscono dettagli sufficienti vengono comunque etichettati con precisione nello stato del fallback: `empty_response` indica che il provider non ha restituito alcun messaggio o stato utilizzabile, `no_error_details` indica che il provider ha restituito esplicitamente `Unknown error (no error details in response)` e `unclassified` indica che OpenClaw ha conservato l'anteprima non elaborata, ma nessun classificatore ha ancora trovato una corrispondenza.

I segnali di provider occupato, come `ModelNotReadyException`, vengono inseriti nella categoria di sovraccarico e seguono la stessa politica di una rotazione seguita dal fallback applicata ai limiti di frequenza (consulta la tabella dei valori predefiniti precedente).

Quando un'esecuzione parte dal modello primario predefinito configurato, dal modello primario di un processo Cron, dal modello primario di un agente con fallback espliciti o da un override di fallback selezionato automaticamente, OpenClaw può percorrere la catena di fallback configurata corrispondente. I modelli primari degli agenti senza fallback espliciti e le selezioni esplicite dell'utente (ad esempio `/model ollama/qwen3.5:27b`, il selettore del modello, `sessions.patch` o gli override una tantum di provider/modello della CLI) sono rigorosi: se tale provider/modello non è raggiungibile o non riesce prima di produrre una risposta, OpenClaw segnala l'errore anziché rispondere usando un fallback non correlato.

### Regole della catena dei candidati

OpenClaw crea l'elenco dei candidati a partire dal `provider/model` attualmente richiesto e dai fallback configurati.

<AccordionGroup>
  <Accordion title="Regole">
    - Il modello richiesto è sempre il primo.
    - I fallback configurati esplicitamente vengono deduplicati, ma non filtrati in base all'elenco dei modelli consentiti. Vengono considerati un'intenzione esplicita dell'operatore.
    - Se l'esecuzione corrente sta già usando un fallback configurato della stessa famiglia di provider, OpenClaw continua a utilizzare l'intera catena configurata.
    - Quando non viene fornito un override esplicito del fallback, i fallback configurati vengono provati prima del modello primario configurato, anche se il modello richiesto usa un provider diverso.
    - Quando non viene fornito un override esplicito del fallback al gestore del fallback, il modello primario configurato viene aggiunto alla fine, in modo che la catena possa tornare al normale valore predefinito una volta esauriti i candidati precedenti.
    - Quando un chiamante fornisce `fallbacksOverride`, il gestore usa esattamente il modello richiesto più tale elenco di override. Un elenco vuoto disabilita il fallback del modello e impedisce che il modello primario configurato venga aggiunto come destinazione nascosta per un nuovo tentativo.

  </Accordion>
</AccordionGroup>

### Quali errori fanno avanzare il fallback

<Tabs>
  <Tab title="Prosegue in caso di">
    - errori di autenticazione
    - limiti di frequenza ed esaurimento dei cooldown
    - errori di sovraccarico/provider occupato
    - errori di failover riconducibili a timeout
    - disabilitazioni per fatturazione
    - `LiveSessionModelSwitchError`, che viene normalizzato in un percorso di failover affinché un modello persistente obsoleto non generi un ciclo esterno di nuovi tentativi
    - altri errori non riconosciuti quando sono ancora disponibili candidati

  </Tab>
  <Tab title="Non prosegue in caso di">
    - interruzioni esplicite non riconducibili a timeout/failover
    - errori di superamento del contesto che devono rimanere nella logica di Compaction/nuovo tentativo (ad esempio `request_too_large`, `input token count exceeds the maximum number of input tokens`, `input exceeds the maximum number of tokens`, `input too long for the model` o `ollama error: context length exceeded`)
    - un errore finale sconosciuto quando non rimangono candidati
    - rifiuti di sicurezza di Claude Fable 5; le richieste dirette con chiave API li gestiscono invece a livello del provider tramite il fallback lato server di Anthropic a `claude-opus-4-8` (consulta [Anthropic](/it/providers/anthropic#safety-refusal-fallback-claude-fable-5))

  </Tab>
</Tabs>

### Differenza tra esclusione per cooldown e comportamento di verifica

Quando tutti i profili di autenticazione di un provider sono già in cooldown, OpenClaw non esclude automaticamente quel provider per sempre. Prende una decisione per ogni candidato:

<AccordionGroup>
  <Accordion title="Decisioni per candidato">
    - Gli errori persistenti di autenticazione fanno escludere immediatamente l'intero provider.
    - Le disabilitazioni per fatturazione determinano generalmente l'esclusione, ma il candidato primario può comunque essere verificato con una limitazione della frequenza, affinché il ripristino sia possibile senza riavviare.
    - Il candidato primario può essere verificato in prossimità della scadenza del cooldown, con una limitazione della frequenza specifica per provider.
    - I fallback correlati dello stesso provider possono essere provati nonostante il cooldown quando l'errore sembra transitorio (`rate_limit`, `overloaded` o sconosciuto). Ciò è particolarmente importante quando un limite di frequenza è specifico per modello e un modello correlato potrebbe ripristinarsi immediatamente.
    - Le verifiche dei cooldown transitori sono limitate a una per provider per ogni esecuzione del fallback, affinché un singolo provider non blocchi il fallback tra provider diversi.

  </Accordion>
</AccordionGroup>

## Override di sessione e cambio del modello in tempo reale

Le modifiche al modello della sessione costituiscono uno stato condiviso. Il gestore attivo, il comando `/model`, gli aggiornamenti di Compaction/sessione e la riconciliazione della sessione in tempo reale leggono o scrivono tutti parti della stessa voce di sessione.

Ciò significa che i nuovi tentativi di fallback devono coordinarsi con il cambio del modello in tempo reale:

- Solo le modifiche esplicite del modello avviate dall'utente contrassegnano un cambio in tempo reale come in sospeso. Sono inclusi `/model`, `session_status(model=...)` e `sessions.patch`.
- Le modifiche del modello avviate dal sistema, come la rotazione del fallback, gli override di Heartbeat o la Compaction, non contrassegnano mai autonomamente un cambio in tempo reale come in sospeso.
- Gli override del modello avviati dall'utente vengono considerati selezioni esatte ai fini della politica di fallback, quindi un provider selezionato ma non raggiungibile viene segnalato come errore anziché essere mascherato da `agents.defaults.model.fallbacks`.
- Prima dell'avvio di un nuovo tentativo di fallback, il gestore delle risposte salva nella voce di sessione i campi di override del fallback selezionato.
- Gli override automatici del fallback rimangono selezionati nei turni successivi, affinché OpenClaw non verifichi un modello primario noto come non funzionante a ogni messaggio. OpenClaw verifica nuovamente e periodicamente l'origine configurata e cancella l'override automatico quando questa si ripristina; `/new`, `/reset` e `sessions.reset` cancellano immediatamente gli override di origine automatica.
- Le risposte all'utente segnalano le transizioni del fallback e il ripristino con cancellazione del fallback una volta per ogni modifica dello stato. I turni con fallback persistente non ripetono l'avviso.
- `/status` mostra il modello selezionato e, quando lo stato del fallback è diverso, il modello di fallback attivo e il motivo.
- La riconciliazione della sessione in tempo reale preferisce gli override persistenti della sessione rispetto ai campi obsoleti del modello di runtime.
- Se un errore di cambio in tempo reale indica un candidato successivo nella catena di fallback attiva, OpenClaw passa direttamente al modello selezionato anziché percorrere prima candidati non correlati.
- Se il tentativo di fallback non riesce, il gestore ripristina solo i campi di override che ha scritto e soltanto se corrispondono ancora al candidato non riuscito.

Ciò impedisce la classica condizione di competizione:

<Steps>
  <Step title="Errore del modello primario">
    Il modello primario selezionato non riesce.
  </Step>
  <Step title="Fallback scelto in memoria">
    Il candidato di fallback viene scelto in memoria.
  </Step>
  <Step title="L'archivio della sessione indica ancora il vecchio modello primario">
    L'archivio della sessione riflette ancora il vecchio modello primario.
  </Step>
  <Step title="La riconciliazione in tempo reale legge uno stato obsoleto">
    La riconciliazione della sessione in tempo reale legge lo stato obsoleto della sessione.
  </Step>
  <Step title="Nuovo tentativo ripristinato">
    Il nuovo tentativo viene riportato al vecchio modello prima dell'avvio del tentativo di fallback.
  </Step>
</Steps>

L'override persistente del fallback elimina questa finestra e il ripristino circoscritto mantiene intatte le modifiche manuali o di runtime più recenti della sessione.

## Osservabilità e riepiloghi degli errori

`runWithModelFallback(...)` registra i dettagli di ogni tentativo che alimentano i log e i messaggi di cooldown rivolti all'utente:

- provider/modello tentato
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` e motivi di failover simili)
- stato/codice facoltativo
- riepilogo dell'errore leggibile dall'utente

I log strutturati `model_fallback_decision` includono anche campi `fallbackStep*` non annidati quando un candidato non riesce, viene ignorato o un fallback successivo riesce. Questi campi rendono esplicita la transizione tentata (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), affinché gli esportatori di log e diagnostica possano ricostruire l'errore primario anche quando non riesce anche il fallback finale.

Quando tutti i candidati non riescono, OpenClaw genera `FallbackSummaryError`. Il gestore esterno delle risposte può usarlo per creare un messaggio più specifico, ad esempio "tutti i modelli sono temporaneamente soggetti a limiti di frequenza", e includere la scadenza più prossima del periodo di attesa, se nota.

Il riepilogo del periodo di attesa tiene conto del modello:

- i limiti di frequenza con ambito di modello non correlati vengono ignorati per la catena provider/modello tentata
- se il blocco residuo è un limite di frequenza con ambito di modello corrispondente, OpenClaw segnala l'ultima scadenza corrispondente che continua a bloccare tale modello

## Configurazione correlata

Consulta [Configurazione del Gateway](/it/gateway/configuration) per:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.authPermanentBackoffMinutes` / `auth.cooldowns.authPermanentMaxMinutes`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- instradamento di `agents.defaults.imageModel`

Consulta [Modelli](/it/concepts/models) per una panoramica più ampia sulla selezione dei modelli e sul fallback.
