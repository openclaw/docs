---
read_when:
    - Gestisci un Plugin OpenClaw
    - Vedi un avviso di compatibilità del plugin
    - Stai pianificando una migrazione dell'SDK per plugin o del manifesto
summary: Contratti di compatibilità dei Plugin, metadati di deprecazione e aspettative per la migrazione
title: Compatibilità dei Plugin
x-i18n:
    generated_at: "2026-05-11T20:32:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1afd37697f55721ca8419256a6e8187c398d4b20fb11a65776b755050dd5368b
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw mantiene i contratti Plugin precedenti collegati tramite adattatori di
compatibilità denominati prima di rimuoverli. Questo protegge i plugin integrati
ed esterni esistenti mentre evolvono i contratti di SDK, manifest, configurazione,
configurazione iniziale e runtime degli agenti.

## Registro di compatibilità

I contratti di compatibilità dei Plugin sono tracciati nel registro core in
`src/plugins/compat/registry.ts`.

Ogni record contiene:

- un codice di compatibilità stabile
- stato: `active`, `deprecated`, `removal-pending` o `removed`
- proprietario: SDK, configurazione, configurazione iniziale, canale, provider, esecuzione Plugin, runtime agente
  o core
- date di introduzione e deprecazione quando applicabile
- indicazioni per la sostituzione
- documentazione, diagnostica e test che coprono il comportamento vecchio e nuovo

Il registro è la fonte per la pianificazione dei maintainer e per i futuri
controlli dell’ispettore Plugin. Se cambia un comportamento rivolto ai Plugin,
aggiungi o aggiorna il record di compatibilità nella stessa modifica che aggiunge
l’adattatore.

La compatibilità per riparazioni e migrazioni di Doctor è tracciata separatamente in
`src/commands/doctor/shared/deprecation-compat.ts`. Quei record coprono vecchie
forme di configurazione, layout del registro di installazione e shim di riparazione che potrebbero dover restare
disponibili dopo la rimozione del percorso di compatibilità runtime.

Le verifiche di release dovrebbero controllare entrambi i registri. Non eliminare una migrazione di doctor
solo perché il record di compatibilità runtime o di configurazione corrispondente è scaduto; prima
verifica che non esista un percorso di aggiornamento supportato che richieda ancora la riparazione. Inoltre
riconvalida ogni annotazione di sostituzione durante la pianificazione della release, perché la
proprietà dei Plugin e l’impronta di configurazione possono cambiare quando provider e canali escono dal
core.

## Pacchetto ispettore Plugin

L’ispettore Plugin dovrebbe vivere fuori dal repository core di OpenClaw come pacchetto/repository
separato, basato sui contratti versionati di compatibilità e manifest.

La CLI del primo giorno dovrebbe essere:

```sh
openclaw-plugin-inspector ./my-plugin
```

Dovrebbe emettere:

- validazione manifest/schema
- la versione di compatibilità del contratto controllata
- controlli dei metadati di installazione/origine
- controlli di importazione del percorso freddo
- avvisi di deprecazione e compatibilità

Usa `--json` per un output stabile leggibile dalle macchine nelle annotazioni CI. Il core di OpenClaw
dovrebbe esporre contratti e fixture che l’ispettore può consumare, ma non dovrebbe
pubblicare il binario dell’ispettore dal pacchetto principale `openclaw`.

### Corsia di accettazione per maintainer

Usa Blacksmith Testbox basato su Crabbox per la corsia di accettazione del pacchetto installabile
quando validi l’ispettore esterno rispetto ai pacchetti Plugin di OpenClaw.
Eseguilo da un checkout OpenClaw pulito dopo la compilazione del pacchetto:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Mantieni questa corsia opt-in per i maintainer, perché installa un pacchetto npm
esterno e può ispezionare pacchetti Plugin clonati fuori dal repository. Le protezioni del repository locale
coprono la mappa di export dell’SDK, i metadati del registro di compatibilità, l’esaurimento degli import
SDK deprecati e i confini di importazione delle estensioni integrate; la prova dell’ispettore su Testbox
copre il pacchetto come lo consumano gli autori di Plugin esterni.

## Criterio di deprecazione

OpenClaw non dovrebbe rimuovere un contratto Plugin documentato nella stessa release
che introduce il suo sostituto.

La sequenza di migrazione è:

1. Aggiungi il nuovo contratto.
2. Mantieni il vecchio comportamento collegato tramite un adattatore di compatibilità denominato.
3. Emetti diagnostica o avvisi quando gli autori di Plugin possono agire.
4. Documenta la sostituzione e la tempistica.
5. Testa sia i percorsi vecchi sia quelli nuovi.
6. Attendi per tutta la finestra di migrazione annunciata.
7. Rimuovi solo con approvazione esplicita di release con modifiche incompatibili.

I record deprecati devono includere una data di inizio degli avvisi, una sostituzione, un link alla documentazione
e una data di rimozione finale non oltre tre mesi dall’inizio degli avvisi. Non
aggiungere un percorso di compatibilità deprecato con una finestra di rimozione aperta, a meno che
i maintainer non decidano esplicitamente che si tratta di compatibilità permanente e lo contrassegnino invece come `active`.

## Aree di compatibilità attuali

I record di compatibilità attuali includono:

- import SDK generici legacy come `openclaw/plugin-sdk/compat`
- forme Plugin legacy solo con hook e `before_agent_start`
- entrypoint Plugin legacy `activate(api)` mentre i plugin migrano a
  `register(api)`
- alias SDK legacy come `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, builder di stato `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/test-utils` (sostituiti da sottopercorsi di test focalizzati
  `openclaw/plugin-sdk/*`) e gli alias di tipo `ClawdbotConfig` /
  `OpenClawSchemaType`
- allowlist e comportamento di abilitazione dei Plugin integrati
- metadati manifest legacy per variabili d’ambiente di provider/canale
- hook e alias di tipo dei Plugin provider legacy mentre i provider passano a
  hook espliciti di catalogo, auth, thinking, replay e trasporto
- alias runtime legacy come `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` e i deprecati
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- registrazione divisa dei Plugin di memoria legacy mentre i Plugin di memoria passano a
  `registerMemoryCapability`
- helper SDK canale legacy per schemi di messaggi nativi, gating delle menzioni,
  formattazione delle buste in ingresso e annidamento della capability di approvazione
- chiave di route canale legacy e alias helper per target comparabili mentre i Plugin
  passano a `openclaw/plugin-sdk/channel-route`
- suggerimenti di attivazione che vengono sostituiti dalla proprietà dei contributi del manifest
- fallback runtime `setup-api` mentre i descrittori di configurazione iniziale passano ai metadati freddi
  `setup.requiresRuntime: false`
- hook `discovery` dei provider mentre gli hook catalogo dei provider passano a
  `catalog.run(...)`
- metadati canale `showConfigured` / `showInSetup` mentre i pacchetti canale passano a
  `openclaw.channel.exposure`
- chiavi di configurazione runtime-policy legacy mentre doctor migra gli operatori a
  `agentRuntime`
- fallback dei metadati di configurazione dei canali integrati generati mentre arrivano i metadati
  `channelConfigs` registry-first
- flag env di disabilitazione del registro Plugin persistito e migrazione installazioni mentre
  i flussi di riparazione migrano gli operatori a `openclaw plugins registry --refresh` e
  `openclaw doctor --fix`
- percorsi di configurazione legacy di proprietà del Plugin per web search, web fetch e x_search mentre
  doctor li migra a `plugins.entries.<plugin>.config`
- configurazione autoriale legacy `plugins.installs` e alias del percorso di caricamento Plugin integrato
  mentre i metadati di installazione passano nel registro Plugin gestito dallo stato

Il nuovo codice Plugin dovrebbe preferire la sostituzione elencata nel registro e nella
guida di migrazione specifica. I Plugin esistenti possono continuare a usare un percorso di compatibilità
finché documentazione, diagnostica e note di release non annunciano una finestra di rimozione.

## Note di release

Le note di release dovrebbero includere le prossime deprecazioni dei Plugin con date target e
link alla documentazione di migrazione. Tale avviso deve avvenire prima che un percorso di compatibilità
passi a `removal-pending` o `removed`.
