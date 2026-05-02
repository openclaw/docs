---
read_when:
    - Gestisci un Plugin OpenClaw
    - Visualizzi un avviso di compatibilità del Plugin
    - Stai pianificando una migrazione dell'SDK dei Plugin o del manifesto
summary: Contratti di compatibilità dei Plugin, metadati di deprecazione e aspettative di migrazione
title: Compatibilità dei Plugin
x-i18n:
    generated_at: "2026-05-02T08:29:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: eecf94743cf34c5b773bfa8066164f90b7c8a75667c43f3f1002d32ec1d04902
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw mantiene i contratti dei plugin meno recenti collegati tramite adattatori di compatibilità nominati prima di rimuoverli. Questo protegge i plugin esistenti, sia in bundle sia esterni, mentre evolvono i contratti di SDK, manifest, configurazione, impostazioni e runtime dell'agente.

## Registro di compatibilità

I contratti di compatibilità dei plugin sono tracciati nel registro core in
`src/plugins/compat/registry.ts`.

Ogni record include:

- un codice di compatibilità stabile
- stato: `active`, `deprecated`, `removal-pending` o `removed`
- proprietario: SDK, configurazione, impostazioni, canale, provider, esecuzione plugin, runtime dell'agente
  o core
- date di introduzione e deprecazione, quando applicabili
- indicazioni per la sostituzione
- documentazione, diagnostica e test che coprono il comportamento vecchio e nuovo

Il registro è la fonte per la pianificazione dei maintainer e per futuri controlli dell'ispettore plugin. Se cambia un comportamento rivolto ai plugin, aggiungi o aggiorna il record di compatibilità nella stessa modifica che aggiunge l'adattatore.

La compatibilità per riparazioni e migrazioni di Doctor è tracciata separatamente in
`src/commands/doctor/shared/deprecation-compat.ts`. Questi record coprono vecchie forme di configurazione, layout dei registri di installazione e shim di riparazione che potrebbero dover restare disponibili dopo la rimozione del percorso di compatibilità runtime.

Gli sweep di release dovrebbero controllare entrambi i registri. Non eliminare una migrazione di Doctor solo perché il record di compatibilità runtime o configurazione corrispondente è scaduto; prima verifica che non esista un percorso di aggiornamento supportato che richieda ancora la riparazione. Inoltre, rivalida ogni annotazione di sostituzione durante la pianificazione della release, perché la proprietà dei plugin e l'impronta di configurazione possono cambiare mentre provider e canali vengono spostati fuori dal core.

## Pacchetto ispettore plugin

L'ispettore plugin dovrebbe risiedere fuori dal repository core di OpenClaw come pacchetto/repository separato basato sui contratti di compatibilità e manifest versionati.

La CLI iniziale dovrebbe essere:

```sh
openclaw-plugin-inspector ./my-plugin
```

Dovrebbe emettere:

- validazione di manifest/schema
- la versione di compatibilità del contratto in fase di controllo
- controlli dei metadati di installazione/origine
- controlli di importazione del percorso freddo
- avvisi di deprecazione e compatibilità

Usa `--json` per un output stabile e leggibile dalle macchine nelle annotazioni CI. Il core di OpenClaw dovrebbe esporre contratti e fixture che l'ispettore può consumare, ma non dovrebbe pubblicare il binario dell'ispettore dal pacchetto principale `openclaw`.

### Corsia di accettazione dei maintainer

Usa Blacksmith Testbox per la corsia di accettazione del pacchetto installabile quando validi l'ispettore esterno rispetto ai pacchetti plugin di OpenClaw. Eseguilo da un checkout pulito di OpenClaw dopo la compilazione del pacchetto:

```sh
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
blacksmith testbox stop <tbx_id>
```

Mantieni questa corsia opt-in per i maintainer perché installa un pacchetto npm esterno e può ispezionare pacchetti plugin clonati fuori dal repository. Le protezioni del repository locale coprono la mappa degli export dell'SDK, i metadati del registro di compatibilità, la riduzione degli import SDK deprecati e i confini di importazione delle estensioni in bundle; la prova dell'ispettore in Testbox copre il pacchetto così come viene consumato dagli autori di plugin esterni.

## Criterio di deprecazione

OpenClaw non dovrebbe rimuovere un contratto plugin documentato nella stessa release che introduce la sua sostituzione.

La sequenza di migrazione è:

1. Aggiungi il nuovo contratto.
2. Mantieni il vecchio comportamento collegato tramite un adattatore di compatibilità nominato.
3. Emetti diagnostica o avvisi quando gli autori di plugin possono agire.
4. Documenta la sostituzione e la tempistica.
5. Testa sia il percorso vecchio sia quello nuovo.
6. Attendi per tutta la finestra di migrazione annunciata.
7. Rimuovi solo con approvazione esplicita per release con modifiche incompatibili.

I record deprecati devono includere una data di inizio degli avvisi, una sostituzione, un link alla documentazione e una data di rimozione finale non oltre tre mesi dall'inizio degli avvisi. Non aggiungere un percorso di compatibilità deprecato con una finestra di rimozione aperta, a meno che i maintainer decidano esplicitamente che si tratta di compatibilità permanente e lo marcino invece come `active`.

## Aree di compatibilità attuali

I record di compatibilità attuali includono:

- import SDK ampi legacy come `openclaw/plugin-sdk/compat`
- forme legacy di plugin solo hook e `before_agent_start`
- entrypoint plugin legacy `activate(api)` mentre i plugin migrano a
  `register(api)`
- alias SDK legacy come `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, builder di stato `openclaw/plugin-sdk/command-auth`
  , `openclaw/plugin-sdk/test-utils` (sostituito da sottopercorsi di test mirati
  `openclaw/plugin-sdk/*`) e gli alias di tipo `ClawdbotConfig` /
  `OpenClawSchemaType`
- allowlist dei plugin in bundle e comportamento di abilitazione
- metadati manifest legacy per variabili d'ambiente di provider/canale
- hook e alias di tipo legacy dei plugin provider mentre i provider passano a hook espliciti di catalogo, autenticazione, ragionamento, replay e trasporto
- alias runtime legacy come `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` e i deprecati
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- registrazione divisa legacy dei plugin di memoria mentre i plugin di memoria passano a
  `registerMemoryCapability`
- helper SDK canale legacy per schemi di messaggi nativi, gating delle menzioni,
  formattazione degli envelope in ingresso e annidamento delle capacità di approvazione
- chiave di route canale legacy e alias helper per target comparabili mentre i plugin passano a `openclaw/plugin-sdk/channel-route`
- suggerimenti di attivazione che vengono sostituiti dalla proprietà dei contributi nel manifest
- fallback runtime `setup-api` mentre i descrittori di impostazione passano a metadati freddi
  `setup.requiresRuntime: false`
- hook `discovery` dei provider mentre gli hook di catalogo dei provider passano a
  `catalog.run(...)`
- metadati canale `showConfigured` / `showInSetup` mentre i pacchetti canale passano a `openclaw.channel.exposure`
- chiavi di configurazione runtime-policy legacy mentre Doctor migra gli operatori a
  `agentRuntime`
- fallback dei metadati di configurazione canale in bundle generati mentre arrivano i metadati `channelConfigs` registry-first
- flag env persistenti di disabilitazione del registro plugin e migrazione installazioni mentre i flussi di riparazione migrano gli operatori a `openclaw plugins registry --refresh` e
  `openclaw doctor --fix`
- percorsi di configurazione legacy di web search, web fetch e x_search di proprietà dei plugin mentre Doctor li migra a `plugins.entries.<plugin>.config`
- configurazione `plugins.installs` legacy creata dagli autori e alias dei percorsi di caricamento dei plugin in bundle mentre i metadati di installazione vengono spostati nel registro plugin gestito dallo stato

Il nuovo codice plugin dovrebbe preferire la sostituzione elencata nel registro e nella guida di migrazione specifica. I plugin esistenti possono continuare a usare un percorso di compatibilità finché documentazione, diagnostica e note di release annunciano una finestra di rimozione.

## Note di release

Le note di release dovrebbero includere le prossime deprecazioni dei plugin con date target e link alla documentazione di migrazione. Questo avviso deve avvenire prima che un percorso di compatibilità passi a `removal-pending` o `removed`.
