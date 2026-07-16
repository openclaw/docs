---
read_when:
    - Hai eseguito `clawhub package validate` e devi correggere i problemi rilevati nel plugin
    - ClawHub ha rifiutato o segnalato un avviso durante la pubblicazione di un pacchetto Plugin
    - Si stanno aggiornando i metadati del pacchetto del plugin prima del rilascio
summary: Correggere i problemi di convalida del pacchetto del Plugin ClawHub prima della pubblicazione
title: Correzioni della convalida dei Plugin
x-i18n:
    generated_at: "2026-07-16T13:58:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Correzioni per la convalida dei plugin

ClawHub convalida i pacchetti dei plugin prima della pubblicazione e può anche mostrare i risultati delle
scansioni automatizzate dei pacchetti. Questa pagina tratta i risultati destinati agli autori, ossia
quelli che l'autore del plugin può correggere nei metadati del pacchetto, nel manifest, nelle importazioni
dell'SDK o nell'artefatto pubblicato.

Non tratta i risultati relativi alla copertura interna di Plugin Inspector. Se un rapporto completo
contiene codici di manutenzione dello scanner senza indicazioni per la correzione da parte dell'autore,
questi sono destinati ai manutentori di OpenClaw anziché agli autori dei plugin.

Dopo aver applicato qualsiasi correzione, eseguire nuovamente:

```bash
clawhub package validate <path-to-plugin>
```

## Risultati destinati agli autori

| Codice                                    | Iniziare da                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Aggiungere i metadati del pacchetto](/it/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [Aggiungere il blocco openclaw del pacchetto](/it/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [Dichiarare gli entry point del pacchetto OpenClaw](/it/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [Pubblicare l'entry point dichiarato](/it/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [Completare i metadati di installazione](/it/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Dichiarare la compatibilità con l'API dei plugin](/it/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [Allineare la versione minima dell'host](/it/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [Allineare le versioni del pacchetto e del manifest](/it/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [Rimuovere i metadati del pacchetto OpenClaw non supportati](/it/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [Rendere impacchettabile l'artefatto npm](/it/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [Includere gli entry point nell'output di npm pack](/it/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Includere i metadati nell'output di npm pack](/it/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Aggiungere un nome visualizzato al manifest](/it/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Rimuovere i campi del manifest non supportati](/it/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Rimuovere le chiavi di contratto non supportate](/it/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [Sostituire le importazioni dalla radice dell'SDK](/it/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Rimuovere le importazioni riservate dell'SDK](/it/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Sostituire l'accesso all'intero archivio delle sessioni](/it/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [Sostituire le scritture nell'intero archivio delle sessioni](/it/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [Sostituire gli helper per i percorsi dei file di sessione](/it/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [Sostituire le destinazioni legacy dei file delle trascrizioni](/it/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [Sostituire gli helper di basso livello per le trascrizioni](/it/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [Sostituire before_agent_start](/it/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Spostare le variabili di ambiente del provider nei metadati di configurazione](/it/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Replicare le variabili di ambiente del canale nei metadati correnti](/it/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Rimuovere i riferimenti non disponibili allo schema del manifest di sicurezza](/it/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Rimuovere i file del manifest di sicurezza non supportati](/it/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Metadati del pacchetto

### package-json-missing

La radice del pacchetto non include `package.json`, pertanto ClawHub non può identificare il
pacchetto npm, la versione, gli entry point o i metadati OpenClaw.

- Aggiungere `package.json` con `name`, `version` e `type`.
- Aggiungere un blocco `openclaw` quando il pacchetto distribuisce un plugin OpenClaw.
- Consultare [Creazione di plugin](/it/plugins/building-plugins) per un esempio minimo di
  pacchetto e [Manifest del plugin](/it/plugins/manifest#manifest-versus-packagejson)
  per la distinzione tra pacchetto e manifest.
- Eseguire nuovamente `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

Il pacchetto contiene `package.json`, ma non dichiara i metadati del pacchetto
OpenClaw.

- Aggiungere `package.json#openclaw`.
- Includere i metadati degli entry point, ad esempio `openclaw.extensions` o
  `openclaw.runtimeExtensions`.
- Aggiungere i metadati di compatibilità e installazione quando il pacchetto verrà pubblicato o
  installato tramite ClawHub.
- Consultare [Campi di package.json che influiscono sul rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Eseguire nuovamente `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

I metadati del pacchetto esistono, ma non dichiarano un entry point di runtime
OpenClaw.

- Aggiungere `openclaw.extensions` per gli entry point nativi dei plugin.
- Aggiungere `openclaw.runtimeExtensions` quando il pacchetto pubblicato deve caricare il
  codice JavaScript compilato.
- Mantenere tutti i percorsi degli entry point all'interno della directory del pacchetto.
- Consultare [Entry point dei plugin](/it/plugins/sdk-entrypoints) e
  [Campi di package.json che influiscono sul rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Eseguire nuovamente `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Il pacchetto dichiara un entry point OpenClaw, ma il file a cui fa riferimento non è presente
nel pacchetto sottoposto a convalida.

- Controllare ogni percorso in `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` e `openclaw.runtimeSetupEntry`.
- Compilare il pacchetto se l'entry point viene generato in `dist`.
- Aggiornare i metadati se l'entry point è stato spostato.
- Consultare [Entry point dei plugin](/it/plugins/sdk-entrypoints).
- Eseguire nuovamente `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub non è in grado di determinare come installare o aggiornare il pacchetto.

- Compilare `openclaw.install` con l'origine di installazione supportata, ad esempio
  `clawhubSpec`, `npmSpec` o `localPath`.
- Impostare `openclaw.install.defaultChoice` quando è disponibile più di un'origine di
  installazione.
- Utilizzare `openclaw.install.minHostVersion` per la versione minima dell'host OpenClaw.
- Consultare [Campi di package.json che influiscono sul rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Eseguire nuovamente `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Il pacchetto non dichiara l'intervallo dell'API dei plugin OpenClaw supportato.

- Aggiungere `openclaw.compat.pluginApi` a `package.json`.
- Utilizzare la versione dell'API dei plugin OpenClaw o la versione semver minima rispetto alla quale
  sono state eseguite la compilazione e le verifiche.
- Mantenerla separata dalla versione del pacchetto. La versione del pacchetto descrive la
  versione del plugin; `openclaw.compat.pluginApi` descrive il contratto dell'API dell'host.
- Consultare [Campi di package.json che influiscono sul rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Eseguire nuovamente `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

La versione minima dell'host del pacchetto non corrisponde ai metadati della versione OpenClaw
rispetto alla quale il pacchetto è stato compilato.

- Controllare `openclaw.install.minHostVersion`.
- Controllare tutti i metadati di compilazione OpenClaw nel pacchetto, ad esempio la versione di OpenClaw
  utilizzata durante il rilascio.
- Allineare la versione minima dell'host all'intervallo di versioni dell'host effettivamente
  supportato dal pacchetto.
- Consultare [Campi di package.json che influiscono sul rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Eseguire nuovamente `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

La versione del pacchetto e quella del manifest del plugin non corrispondono.

- Preferire `package.json#version` come versione di rilascio del pacchetto.
- Se anche `openclaw.plugin.json` contiene `version`, aggiornarlo affinché corrisponda oppure rimuovere
  i metadati obsoleti della versione del manifest quando i metadati del pacchetto sono autorevoli.
- Pubblicare una nuova versione del pacchetto dopo aver modificato i metadati pubblicati.
- Consultare [Manifest del plugin](/it/plugins/manifest).
- Eseguire nuovamente `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Il blocco `package.json#openclaw` contiene campi non supportati
nei metadati del pacchetto OpenClaw.

- Rimuovere i campi non supportati, ad esempio `openclaw.bundle`.
- Mantenere i metadati nativi dei plugin in `openclaw.plugin.json`.
- Mantenere i metadati relativi a entry point, compatibilità, installazione, configurazione e catalogo
  del pacchetto nei campi `package.json#openclaw` supportati.
- Consultare [Campi di package.json che influiscono sul rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Eseguire nuovamente `clawhub package validate <path-to-plugin>`.

## Artefatto pubblicato

### package-npm-pack-unavailable

Il pacchetto non può essere impacchettato nell'artefatto che ClawHub dovrebbe ispezionare o
pubblicare.

- Eseguire `npm pack --dry-run` dalla radice del pacchetto.
- Correggere i metadati del pacchetto non validi, gli script del ciclo di vita non funzionanti o le voci relative ai file che
  impediscono l'impacchettamento.
- Rimuovere `private: true` se questo pacchetto è destinato alla pubblicazione pubblica.
- Eseguire nuovamente `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Il pacchetto può essere impacchettato, ma l'artefatto impacchettato non include i
file degli entry point dichiarati in `package.json#openclaw`.

- Eseguire `npm pack --dry-run` e controllare i file che verrebbero inclusi.
- Compilare gli entry point generati prima dell'impacchettamento.
- Aggiornare `files`, `.npmignore` o l'output di compilazione affinché gli entry point dichiarati siano
  inclusi.
- Consultare [Entry point dei plugin](/it/plugins/sdk-entrypoints).
- Eseguire nuovamente `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

Nell'artefatto impacchettato mancano i metadati OpenClaw presenti nel pacchetto
di origine.

- Eseguire `npm pack --dry-run` e ispezionare i file di metadati inclusi.
- Assicurarsi che `package.json` includa il blocco `openclaw` nell'artefatto impacchettato.
- Assicurarsi che `openclaw.plugin.json` sia incluso quando il pacchetto è un plugin
  OpenClaw nativo.
- Aggiornare `files` o `.npmignore` affinché i metadati del pacchetto non vengano esclusi.
- Consultare [Creazione di plugin](/it/plugins/building-plugins).
- Eseguire nuovamente `clawhub package validate <path-to-plugin>`.

## Metadati del manifest

### manifest-name-missing

Il manifest del plugin nativo non include un nome visualizzato.

- Aggiungere un campo `name` non vuoto a `openclaw.plugin.json`.
- Mantenere `name` leggibile e `id` come ID macchina stabile.
- Consultare [Manifest del plugin](/it/plugins/manifest).
- Eseguire nuovamente `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Il manifest del plugin contiene campi di primo livello non supportati da OpenClaw.

- Confrontare ogni campo di primo livello con il
  [riferimento dei campi del manifest](/it/plugins/manifest#top-level-field-reference).
- Rimuovere i campi personalizzati da `openclaw.plugin.json`.
- Spostare i metadati del pacchetto o dell'installazione nei campi `package.json#openclaw` supportati,
  anziché nel manifest.
- Eseguire nuovamente `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Il manifest dichiara chiavi non supportate all'interno di `contracts`.

- Confrontare ogni chiave in `contracts` con il
  [riferimento dei contratti](/it/plugins/manifest#contracts-reference).
- Rimuovere le chiavi di contratto non supportate.
- Spostare il comportamento di runtime nel codice di registrazione del plugin e limitare `contracts`
  ai metadati statici sulla titolarità delle funzionalità.
- Eseguire nuovamente `clawhub package validate <path-to-plugin>`.

## Migrazione dell'SDK e della compatibilità

### legacy-root-sdk-import

Il plugin esegue import dal barrel radice deprecato dell'SDK:
`openclaw/plugin-sdk`.

- Sostituire gli import dal barrel radice con import mirati da sottopercorsi pubblici.
- Usare `openclaw/plugin-sdk/plugin-entry` per `definePluginEntry`.
- Usare `openclaw/plugin-sdk/channel-core` per gli helper dei punti di ingresso dei canali.
- Consultare [Convenzioni di importazione](/it/plugins/building-plugins#import-conventions) e
  [Sottopercorsi dell'SDK dei plugin](/it/plugins/sdk-subpaths) per individuare l'import più specifico.
- Eseguire nuovamente `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Il plugin importa un percorso dell'SDK riservato ai plugin inclusi o alla
compatibilità interna.

- Sostituire gli import riservati dall'SDK interno di OpenClaw con sottopercorsi pubblici
  `openclaw/plugin-sdk/*` documentati.
- Se il comportamento non dispone di un SDK pubblico, mantenere l'helper nel proprio pacchetto oppure
  richiedere un'API pubblica di OpenClaw.
- Consultare [Sottopercorsi dell'SDK dei plugin](/it/plugins/sdk-subpaths) e
  [Migrazione dell'SDK](/it/plugins/sdk-migration) per scegliere un import supportato.
- Eseguire nuovamente `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Il plugin utilizza ancora l'helper deprecato per l'intero archivio delle sessioni
`loadSessionStore`.

- Usare `getSessionEntry(...)` o `listSessionEntries(...)` durante la lettura dello stato
  della sessione.
- Usare `patchSessionEntry(...)` o `upsertSessionEntry(...)` durante la scrittura dello stato
  della sessione.
- Evitare di caricare, modificare e salvare l'intero oggetto dell'archivio delle sessioni.
- Mantenere `loadSessionStore(...)` solo finché l'intervallo di compatibilità dichiarato
  supporta ancora versioni precedenti di OpenClaw che lo richiedono.
- Consultare [API di runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi dell'SDK dei plugin](/it/plugins/sdk-subpaths).
- Eseguire nuovamente `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

Il plugin utilizza ancora un helper deprecato per la scrittura dell'intero archivio delle sessioni, come
`saveSessionStore` o `updateSessionStore`.

- Usare `patchSessionEntry(...)` per aggiornare i campi di una voce di sessione
  esistente.
- Usare `upsertSessionEntry(...)` per sostituire o creare una voce di sessione.
- Evitare di caricare, modificare e salvare l'intero oggetto dell'archivio delle sessioni.
- Mantenere gli helper di scrittura dell'intero archivio solo finché l'intervallo di compatibilità dichiarato
  supporta ancora versioni precedenti di OpenClaw che li richiedono.
- Consultare [API di runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi dell'SDK dei plugin](/it/plugins/sdk-subpaths).
- Eseguire nuovamente `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

Il plugin utilizza ancora helper deprecati per i percorsi dei file di sessione, come
`resolveSessionFilePath` o `resolveAndPersistSessionFile`.

- Usare `getSessionEntry(...)` per leggere i metadati della sessione in base all'identità
  dell'agente e della sessione.
- Usare `patchSessionEntry(...)` o `upsertSessionEntry(...)` per rendere persistenti i metadati
  della sessione.
- Usare gli helper per l'identità o la destinazione della trascrizione quando il codice prepara
  un'operazione sulla trascrizione.
- Non rendere persistenti né utilizzare i percorsi legacy dei file di trascrizione.
- Consultare [API di runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi dell'SDK dei plugin](/it/plugins/sdk-subpaths).
- Eseguire nuovamente `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

Il plugin utilizza ancora l'helper deprecato per la destinazione del file di trascrizione
`resolveSessionTranscriptLegacyFileTarget`.

- Usare `resolveSessionTranscriptIdentity(...)` quando il codice necessita soltanto dell'identità pubblica
  della sessione.
- Usare `resolveSessionTranscriptTarget(...)` quando il codice necessita di una destinazione strutturata
  per un'operazione sulla trascrizione.
- Evitare di leggere o costruire direttamente destinazioni legacy dei file di trascrizione.
- Mantenere l'helper legacy solo finché l'intervallo di compatibilità dichiarato
  supporta ancora versioni precedenti di OpenClaw che lo richiedono.
- Consultare [API di runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi dell'SDK dei plugin](/it/plugins/sdk-subpaths).
- Eseguire nuovamente `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

Il plugin utilizza ancora helper deprecati di basso livello per le trascrizioni, come
`appendSessionTranscriptMessage` o `emitSessionTranscriptUpdate`.

- Usare `appendSessionTranscriptMessageByIdentity(...)` per le aggiunte alle trascrizioni.
- Usare `publishSessionTranscriptUpdateByIdentity(...)` per le notifiche di aggiornamento
  delle trascrizioni.
- Preferire l'interfaccia strutturata di runtime per le trascrizioni, affinché OpenClaw possa applicare
  i limiti di transazione e la gestione delle identità corretti.
- Mantenere gli helper di basso livello per le trascrizioni solo finché l'intervallo di compatibilità dichiarato
  supporta ancora versioni precedenti di OpenClaw che li richiedono.
- Consultare [API di runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi dell'SDK dei plugin](/it/plugins/sdk-subpaths).
- Eseguire nuovamente `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Il plugin utilizza ancora l'hook legacy `before_agent_start`.

- Spostare in `before_model_resolve` le operazioni di sostituzione del modello o del provider.
- Spostare in `before_prompt_build` le operazioni di modifica del prompt o del contesto.
- Mantenere `before_agent_start` solo finché l'intervallo di compatibilità dichiarato
  supporta ancora versioni precedenti di OpenClaw che lo richiedono.
- Consultare [Hook](/it/plugins/hooks) e
  [Compatibilità dei plugin](/it/plugins/compatibility).
- Eseguire nuovamente `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Il manifest utilizza ancora i metadati legacy `providerAuthEnvVars` per l'autenticazione del provider.

- Replicare i metadati delle variabili di ambiente del provider in `setup.providers[].envVars`.
- Mantenere `providerAuthEnvVars` solo come metadati di compatibilità finché l'intervallo
  di versioni OpenClaw supportato ne ha ancora bisogno.
- Consultare [Riferimento della configurazione](/it/plugins/manifest#setup-reference) e
  [Migrazione dell'SDK](/it/plugins/sdk-migration).
- Eseguire nuovamente `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Il manifest utilizza metadati legacy o precedenti per le variabili di ambiente del canale senza gli attuali
metadati di configurazione o impostazione previsti da ClawHub.

- Mantenere dichiarativi i metadati delle variabili di ambiente del canale, affinché OpenClaw possa verificare lo stato della configurazione
  senza caricare il runtime del canale.
- Replicare la configurazione del canale basata sull'ambiente negli attuali metadati di configurazione, di impostazione del canale o
  del canale del pacchetto utilizzati dalla struttura del plugin.
- Mantenere `channelEnvVars` solo come metadati di compatibilità finché le versioni precedenti
  supportate di OpenClaw lo richiedono ancora.
- Consultare [Manifest del plugin](/it/plugins/manifest) e
  [Plugin dei canali](/it/plugins/sdk-channel-plugins).
- Eseguire nuovamente `clawhub package validate <path-to-plugin>`.

## Manifest di sicurezza

### security-manifest-schema-unavailable

Il pacchetto distribuisce `openclaw.security.json` con un riferimento a uno schema che ClawHub
non riconosce come disponibile.

- Rimuovere l'URL dello schema se ha solo valore consultivo.
- Usare uno schema versionato documentato solo dopo che OpenClaw ne avrà pubblicato uno.
- Eseguire nuovamente `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Il pacchetto distribuisce un file manifest di sicurezza non supportato.

- Rimuovere `openclaw.security.json` finché OpenClaw non documenterà uno schema versionato per il manifest di sicurezza
  e il comportamento di ClawHub.
- Mantenere il comportamento rilevante per la sicurezza documentato nella documentazione pubblica del pacchetto o
  nel README finché non esisterà il contratto del manifest.
- Eseguire nuovamente `clawhub package validate <path-to-plugin>`.

## Argomenti correlati

- [CLI di ClawHub](/it/clawhub/cli)
- [Pubblicazione su ClawHub](/it/clawhub/publishing)
- [Creazione di plugin](/it/plugins/building-plugins)
- [Manifest del plugin](/it/plugins/manifest)
- [Punti di ingresso dei plugin](/it/plugins/sdk-entrypoints)
- [Compatibilità dei plugin](/it/plugins/compatibility)
