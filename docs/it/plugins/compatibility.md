---
read_when:
    - Gestisci un plugin OpenClaw
    - Viene visualizzato un avviso di compatibilità del Plugin
    - Stai pianificando una migrazione dell'SDK per Plugin o del manifesto
summary: Contratti di compatibilità dei Plugin, metadati di deprecazione e aspettative di migrazione
title: Compatibilità dei Plugin
x-i18n:
    generated_at: "2026-04-30T09:02:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 344dbaac86db7259adc09bc91b7fbe7ba540fc6fdd96cc422918ccf2c34d9cec
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw mantiene i contratti dei plugin più vecchi collegati tramite adattatori di compatibilità con nome prima di rimuoverli. Questo protegge i plugin bundled ed esterni esistenti mentre evolvono i contratti di SDK, manifesto, configurazione iniziale, configurazione e runtime dell'agente.

## Registro di compatibilità

I contratti di compatibilità dei plugin sono tracciati nel registro core in
`src/plugins/compat/registry.ts`.

Ogni record include:

- un codice di compatibilità stabile
- stato: `active`, `deprecated`, `removal-pending` o `removed`
- proprietario: SDK, config, setup, channel, provider, esecuzione plugin, runtime dell'agente,
  o core
- date di introduzione e deprecazione quando applicabile
- indicazioni per la sostituzione
- documentazione, diagnostica e test che coprono il comportamento vecchio e nuovo

Il registro è la fonte per la pianificazione dei maintainer e per i futuri controlli dell'ispettore dei plugin. Se cambia un comportamento rivolto ai plugin, aggiungi o aggiorna il record di compatibilità nella stessa modifica che aggiunge l'adattatore.

La compatibilità di riparazione Doctor e migrazione è tracciata separatamente in
`src/commands/doctor/shared/deprecation-compat.ts`. Quei record coprono vecchie forme di configurazione, layout del registro di installazione e shim di riparazione che potrebbero dover restare disponibili dopo la rimozione del percorso di compatibilità runtime.

Le verifiche di rilascio dovrebbero controllare entrambi i registri. Non eliminare una migrazione Doctor solo perché il record di compatibilità runtime o config corrispondente è scaduto; verifica prima che non esista un percorso di upgrade supportato che abbia ancora bisogno della riparazione. Rivalida inoltre ogni annotazione di sostituzione durante la pianificazione del rilascio perché la proprietà dei plugin e l'impronta della configurazione possono cambiare quando provider e canali escono dal core.

## Pacchetto ispettore dei plugin

L'ispettore dei plugin dovrebbe vivere fuori dal repo core di OpenClaw come pacchetto/repository separato basato sui contratti versionati di compatibilità e manifesto.

La CLI iniziale dovrebbe essere:

```sh
openclaw-plugin-inspector ./my-plugin
```

Dovrebbe emettere:

- validazione manifesto/schema
- la versione di compatibilità del contratto controllata
- controlli dei metadati di installazione/origine
- controlli di importazione cold-path
- avvisi di deprecazione e compatibilità

Usa `--json` per un output stabile leggibile dalle macchine nelle annotazioni CI. Il core OpenClaw dovrebbe esporre contratti e fixture che l'ispettore può consumare, ma non dovrebbe pubblicare il binario dell'ispettore dal pacchetto principale `openclaw`.

### Lane di accettazione dei maintainer

Usa Blacksmith Testbox per la lane di accettazione del pacchetto installabile quando validi l'ispettore esterno rispetto ai pacchetti di plugin OpenClaw. Eseguilo da un checkout OpenClaw pulito dopo la build del pacchetto:

```sh
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
blacksmith testbox stop <tbx_id>
```

Mantieni questa lane opt-in per i maintainer perché installa un pacchetto npm esterno e può ispezionare pacchetti di plugin clonati fuori dal repo. Le protezioni del repo locale coprono la mappa di esportazione SDK, i metadati del registro di compatibilità, il burn-down degli import SDK deprecati e i confini di importazione delle estensioni bundled; la prova dell'ispettore in Testbox copre il pacchetto come viene consumato dagli autori di plugin esterni.

## Policy di deprecazione

OpenClaw non dovrebbe rimuovere un contratto di plugin documentato nello stesso rilascio che introduce la sua sostituzione.

La sequenza di migrazione è:

1. Aggiungi il nuovo contratto.
2. Mantieni il vecchio comportamento collegato tramite un adattatore di compatibilità con nome.
3. Emetti diagnostica o avvisi quando gli autori dei plugin possono agire.
4. Documenta la sostituzione e la timeline.
5. Testa sia i percorsi vecchi sia quelli nuovi.
6. Attendi per tutta la finestra di migrazione annunciata.
7. Rimuovi solo con approvazione esplicita di rilascio breaking.

I record deprecati devono includere una data di inizio dell'avviso, una sostituzione, un link alla documentazione e una data di rimozione finale non oltre tre mesi dall'inizio dell'avviso. Non aggiungere un percorso di compatibilità deprecato con una finestra di rimozione aperta a tempo indeterminato, a meno che i maintainer decidano esplicitamente che sia compatibilità permanente e lo contrassegnino invece come `active`.

## Aree di compatibilità attuali

I record di compatibilità attuali includono:

- vecchi import SDK ampi come `openclaw/plugin-sdk/compat`
- vecchie forme di plugin solo hook e `before_agent_start`
- vecchi entrypoint plugin `activate(api)` mentre i plugin migrano a
  `register(api)`
- vecchi alias SDK come `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, builder di stato `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/test-utils` (sostituiti da sottopercorsi di test
  `openclaw/plugin-sdk/*` focalizzati) e gli alias di tipo `ClawdbotConfig` /
  `OpenClawSchemaType`
- allowlist e comportamento di abilitazione dei plugin bundled
- vecchi metadati manifesto env-var di provider/canale
- vecchi hook e alias di tipo dei plugin provider mentre i provider passano a hook
  espliciti di catalogo, autenticazione, thinking, replay e trasporto
- vecchi alias runtime come `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` e deprecati
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- vecchia registrazione split dei plugin di memoria mentre i plugin di memoria passano a
  `registerMemoryCapability`
- vecchi helper SDK di canale per schemi di messaggi nativi, gate delle menzioni,
  formattazione dell'envelope in ingresso e annidamento delle capability di approvazione
- vecchie chiavi di route di canale e alias helper comparable-target mentre i plugin
  passano a `openclaw/plugin-sdk/channel-route`
- hint di attivazione che vengono sostituiti dalla proprietà dei contributi del manifesto
- caricamento sidecar implicito di startup deprecato per i plugin che non hanno dichiarato
  `activation.onStartup`; i maintainer possono testare il futuro comportamento più rigoroso con
  `OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1`
- fallback runtime `setup-api` mentre i descrittori di setup passano ai metadati cold
  `setup.requiresRuntime: false`
- hook `discovery` dei provider mentre gli hook di catalogo dei provider passano a
  `catalog.run(...)`
- metadati di canale `showConfigured` / `showInSetup` mentre i pacchetti di canale passano
  a `openclaw.channel.exposure`
- vecchie chiavi di config runtime-policy mentre Doctor migra gli operatori a
  `agentRuntime`
- fallback dei metadati config di canale bundled generati mentre arrivano i metadati
  `channelConfigs` registry-first
- flag env persistiti di disabilitazione del registro plugin e migrazione installazioni mentre
  i flussi di riparazione migrano gli operatori a `openclaw plugins registry --refresh` e
  `openclaw doctor --fix`
- vecchi percorsi config di web search, web fetch e x_search posseduti dai plugin mentre
  Doctor li migra a `plugins.entries.<plugin>.config`
- vecchia config authored `plugins.installs` e alias dei percorsi di caricamento dei plugin bundled
  mentre i metadati di installazione passano nel registro dei plugin gestito dallo stato

Il nuovo codice dei plugin dovrebbe preferire la sostituzione elencata nel registro e nella guida di migrazione specifica. I plugin esistenti possono continuare a usare un percorso di compatibilità finché documentazione, diagnostica e note di rilascio non annunciano una finestra di rimozione.

## Note di rilascio

Le note di rilascio dovrebbero includere le prossime deprecazioni dei plugin con date target e link alla documentazione di migrazione. Questo avviso deve avvenire prima che un percorso di compatibilità passi a `removal-pending` o `removed`.
