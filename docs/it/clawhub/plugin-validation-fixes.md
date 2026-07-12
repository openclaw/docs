---
read_when:
    - Hai eseguito clawhub package validate e devi correggere i problemi rilevati nel plugin
    - ClawHub ha rifiutato o segnalato un avviso durante la pubblicazione di un pacchetto Plugin
    - Stai aggiornando i metadati del pacchetto del plugin prima del rilascio
summary: Correggi i problemi di convalida dei pacchetti dei Plugin ClawHub prima della pubblicazione
title: Correzioni alla convalida dei Plugin
x-i18n:
    generated_at: "2026-07-12T06:54:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Correzioni per la convalida dei plugin

ClawHub convalida i pacchetti dei plugin prima della pubblicazione e può anche mostrare i problemi rilevati dalle scansioni automatizzate dei pacchetti. Questa pagina tratta i problemi rivolti agli autori, ossia quelli che l'autore del plugin può correggere nei metadati del pacchetto, nel manifesto, nelle importazioni dell'SDK o nell'artefatto pubblicato.

Non tratta i problemi di copertura interni di Plugin Inspector. Se un rapporto completo contiene codici di manutenzione dello scanner senza indicazioni per la correzione da parte dell'autore, tali codici sono destinati ai manutentori di OpenClaw e non agli autori dei plugin.

Dopo aver applicato una correzione, esegui nuovamente:

```bash
clawhub package validate <path-to-plugin>
```

## Problemi rivolti agli autori

| Codice                                  | Inizia da qui                                                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Aggiungi i metadati del pacchetto](/it/clawhub/plugin-validation-fixes#package-json-missing)                                       |
| `package-openclaw-metadata-missing`     | [Aggiungi il blocco openclaw del pacchetto](/it/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                   |
| `package-openclaw-entry-missing`        | [Dichiara i punti di ingresso del pacchetto OpenClaw](/it/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)            |
| `package-entrypoint-missing`            | [Pubblica il punto di ingresso dichiarato](/it/clawhub/plugin-validation-fixes#package-entrypoint-missing)                           |
| `package-install-metadata-incomplete`   | [Completa i metadati di installazione](/it/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                      |
| `package-plugin-api-compat-missing`     | [Dichiara la compatibilità con l'API dei plugin](/it/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)               |
| `package-min-host-version-drift`        | [Allinea la versione minima dell'host](/it/clawhub/plugin-validation-fixes#package-min-host-version-drift)                           |
| `package-manifest-version-drift`        | [Allinea le versioni del pacchetto e del manifesto](/it/clawhub/plugin-validation-fixes#package-manifest-version-drift)              |
| `package-openclaw-unsupported-metadata` | [Rimuovi i metadati del pacchetto OpenClaw non supportati](/it/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata) |
| `package-npm-pack-unavailable`          | [Rendi impacchettabile l'artefatto npm](/it/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                            |
| `package-npm-pack-entrypoint-missing`   | [Includi i punti di ingresso nell'output di npm pack](/it/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)        |
| `package-npm-pack-metadata-missing`     | [Includi i metadati nell'output di npm pack](/it/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                   |
| `manifest-name-missing`                 | [Aggiungi un nome visualizzato al manifesto](/it/clawhub/plugin-validation-fixes#manifest-name-missing)                             |
| `manifest-unknown-fields`               | [Rimuovi i campi del manifesto non supportati](/it/clawhub/plugin-validation-fixes#manifest-unknown-fields)                          |
| `manifest-unknown-contracts`            | [Rimuovi le chiavi di contratto non supportate](/it/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                      |
| `legacy-root-sdk-import`                | [Sostituisci le importazioni dell'SDK radice](/it/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                            |
| `reserved-sdk-import`                   | [Rimuovi le importazioni riservate dell'SDK](/it/clawhub/plugin-validation-fixes#reserved-sdk-import)                               |
| `sdk-load-session-store`                | [Sostituisci l'accesso all'intero archivio delle sessioni](/it/clawhub/plugin-validation-fixes#sdk-load-session-store)               |
| `sdk-session-store-write`               | [Sostituisci le scritture nell'intero archivio delle sessioni](/it/clawhub/plugin-validation-fixes#sdk-session-store-write)          |
| `sdk-session-file-helper`               | [Sostituisci gli helper dei percorsi dei file di sessione](/it/clawhub/plugin-validation-fixes#sdk-session-file-helper)              |
| `sdk-session-transcript-file-target`    | [Sostituisci le destinazioni obsolete dei file di trascrizione](/it/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target) |
| `sdk-session-transcript-low-level`      | [Sostituisci gli helper di basso livello per le trascrizioni](/it/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)  |
| `legacy-before-agent-start`             | [Sostituisci before_agent_start](/it/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                     |
| `provider-auth-env-vars`                | [Sposta le variabili di ambiente del provider nei metadati di configurazione](/it/clawhub/plugin-validation-fixes#provider-auth-env-vars) |
| `channel-env-vars`                      | [Replica le variabili di ambiente del canale nei metadati correnti](/it/clawhub/plugin-validation-fixes#channel-env-vars)           |
| `security-manifest-schema-unavailable`  | [Rimuovi i riferimenti non disponibili allo schema del manifesto di sicurezza](/it/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Rimuovi i file del manifesto di sicurezza non supportati](/it/clawhub/plugin-validation-fixes#unrecognized-security-manifest)      |

## Metadati del pacchetto

### package-json-missing

La radice del pacchetto non include `package.json`, quindi ClawHub non può identificare il pacchetto npm, la versione, i punti di ingresso o i metadati di OpenClaw.

- Aggiungi `package.json` con `name`, `version` e `type`.
- Aggiungi un blocco `openclaw` quando il pacchetto distribuisce un plugin OpenClaw.
- Consulta [Creazione dei plugin](/it/plugins/building-plugins) per un esempio minimo di pacchetto e [Manifesto del plugin](/it/plugins/manifest#manifest-versus-packagejson) per la distinzione tra pacchetto e manifesto.
- Esegui nuovamente `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

Il pacchetto contiene `package.json`, ma non dichiara i metadati del pacchetto OpenClaw.

- Aggiungi `package.json#openclaw`.
- Includi i metadati dei punti di ingresso, come `openclaw.extensions` o `openclaw.runtimeExtensions`.
- Aggiungi i metadati di compatibilità e installazione quando il pacchetto verrà pubblicato o installato tramite ClawHub.
- Consulta [Campi di package.json che influiscono sul rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Esegui nuovamente `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

I metadati del pacchetto esistono, ma non dichiarano un punto di ingresso di runtime OpenClaw.

- Aggiungi `openclaw.extensions` per i punti di ingresso dei plugin nativi.
- Aggiungi `openclaw.runtimeExtensions` quando il pacchetto pubblicato deve caricare JavaScript compilato.
- Mantieni tutti i percorsi dei punti di ingresso all'interno della directory del pacchetto.
- Consulta [Punti di ingresso dei plugin](/it/plugins/sdk-entrypoints) e [Campi di package.json che influiscono sul rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Esegui nuovamente `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Il pacchetto dichiara un punto di ingresso OpenClaw, ma il file a cui fa riferimento non è presente nel pacchetto convalidato.

- Controlla ogni percorso in `openclaw.extensions`, `openclaw.runtimeExtensions`, `openclaw.setupEntry` e `openclaw.runtimeSetupEntry`.
- Compila il pacchetto se il punto di ingresso viene generato in `dist`.
- Aggiorna i metadati se il punto di ingresso è stato spostato.
- Consulta [Punti di ingresso dei plugin](/it/plugins/sdk-entrypoints).
- Esegui nuovamente `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub non può determinare come installare o aggiornare il pacchetto.

- Compila `openclaw.install` con l'origine di installazione supportata, ad esempio `clawhubSpec`, `npmSpec` o `localPath`.
- Imposta `openclaw.install.defaultChoice` quando è disponibile più di un'origine di installazione.
- Usa `openclaw.install.minHostVersion` per la versione minima dell'host OpenClaw.
- Consulta [Campi di package.json che influiscono sul rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Esegui nuovamente `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Il pacchetto non dichiara l'intervallo dell'API dei plugin OpenClaw che supporta.

- Aggiungi `openclaw.compat.pluginApi` a `package.json`.
- Usa la versione dell'API dei plugin OpenClaw o la versione semver minima rispetto alla quale hai compilato e collaudato il pacchetto.
- Mantieni questo valore separato dalla versione del pacchetto. La versione del pacchetto descrive la release del plugin; `openclaw.compat.pluginApi` descrive il contratto dell'API dell'host.
- Consulta [Campi di package.json che influiscono sul rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Esegui nuovamente `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

La versione minima dell'host del pacchetto non corrisponde ai metadati della versione di OpenClaw rispetto alla quale è stato compilato il pacchetto.

- Controlla `openclaw.install.minHostVersion`.
- Controlla gli eventuali metadati di compilazione di OpenClaw nel pacchetto, ad esempio la versione di OpenClaw usata durante la release.
- Allinea la versione minima dell'host all'intervallo di versioni dell'host effettivamente supportato dal pacchetto.
- Consulta [Campi di package.json che influiscono sul rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Esegui nuovamente `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

La versione del pacchetto e quella del manifesto del plugin non corrispondono.

- Preferisci `package.json#version` come versione della release del pacchetto.
- Se anche `openclaw.plugin.json` contiene `version`, aggiornala affinché corrisponda oppure rimuovi i metadati obsoleti della versione del manifesto quando i metadati del pacchetto sono autorevoli.
- Pubblica una nuova versione del pacchetto dopo aver modificato i metadati pubblicati.
- Consulta [Manifesto del plugin](/it/plugins/manifest).
- Esegui nuovamente `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Il blocco `package.json#openclaw` contiene campi non supportati come metadati del pacchetto OpenClaw.

- Rimuovi i campi non supportati, come `openclaw.bundle`.
- Mantieni i metadati dei plugin nativi in `openclaw.plugin.json`.
- Mantieni i punti di ingresso del pacchetto e i metadati di compatibilità, installazione, configurazione e catalogo nei campi supportati di `package.json#openclaw`.
- Consulta [Campi di package.json che influiscono sul rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Esegui nuovamente `clawhub package validate <path-to-plugin>`.

## Artefatto pubblicato

### package-npm-pack-unavailable

Il pacchetto non può essere impacchettato nell'artefatto che ClawHub esaminerebbe o pubblicherebbe.

- Esegui `npm pack --dry-run` dalla radice del pacchetto.
- Correggi i metadati non validi del pacchetto, gli script del ciclo di vita non funzionanti o le voci dei file che impediscono l'impacchettamento.
- Rimuovi `private: true` se il pacchetto è destinato alla pubblicazione pubblica.
- Esegui nuovamente `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Il pacchetto può essere impacchettato, ma l'artefatto risultante non include i file dei punti di ingresso dichiarati in `package.json#openclaw`.

- Esegui `npm pack --dry-run` e controlla i file che verrebbero inclusi.
- Compila i punti di ingresso generati prima dell'impacchettamento.
- Aggiorna `files`, `.npmignore` o l'output di compilazione in modo che i punti di ingresso dichiarati siano inclusi.
- Consulta [Punti di ingresso dei plugin](/it/plugins/sdk-entrypoints).
- Esegui nuovamente `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

Nell'artefatto impacchettato mancano i metadati di OpenClaw presenti nel pacchetto sorgente.

- Esegui `npm pack --dry-run` e controlla i file di metadati inclusi.
- Assicurati che `package.json` includa il blocco `openclaw` nell'artefatto impacchettato.
- Assicurati che `openclaw.plugin.json` sia incluso quando il pacchetto è un plugin OpenClaw nativo.
- Aggiorna `files` o `.npmignore` affinché i metadati del pacchetto non siano esclusi.
- Consulta [Creazione dei plugin](/it/plugins/building-plugins).
- Esegui nuovamente `clawhub package validate <path-to-plugin>`.

## Metadati del manifesto

### manifest-name-missing

Il manifesto nativo del plugin non include un nome visualizzato.

- Aggiungi un campo `name` non vuoto a `openclaw.plugin.json`.
- Mantieni `name` leggibile dalle persone e `id` come identificatore macchina stabile.
- Consulta [Manifesto del plugin](/it/plugins/manifest).
- Esegui nuovamente `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Il manifesto del plugin contiene campi di primo livello non supportati da OpenClaw.

- Confronta ogni campo di primo livello con il
  [riferimento dei campi del manifesto](/it/plugins/manifest#top-level-field-reference).
- Rimuovi i campi personalizzati da `openclaw.plugin.json`.
- Sposta invece i metadati del pacchetto o dell'installazione nei campi supportati di `package.json#openclaw`.
- Esegui nuovamente `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Il manifesto dichiara chiavi non supportate all'interno di `contracts`.

- Confronta ogni chiave in `contracts` con il
  [riferimento dei contratti](/it/plugins/manifest#contracts-reference).
- Rimuovi le chiavi di contratto non supportate.
- Sposta il comportamento di runtime nel codice di registrazione del plugin e limita `contracts`
  ai metadati statici sulla titolarità delle funzionalità.
- Esegui nuovamente `clawhub package validate <path-to-plugin>`.

## Migrazione dell'SDK e della compatibilità

### legacy-root-sdk-import

Il plugin esegue importazioni dal barrel radice deprecato dell'SDK:
`openclaw/plugin-sdk`.

- Sostituisci le importazioni dal barrel radice con importazioni mirate da sottopercorsi pubblici.
- Usa `openclaw/plugin-sdk/plugin-entry` per `definePluginEntry`.
- Usa `openclaw/plugin-sdk/channel-core` per gli helper dei punti di ingresso dei canali.
- Consulta [Convenzioni di importazione](/it/plugins/building-plugins#import-conventions) e
  [Sottopercorsi dell'SDK dei plugin](/it/plugins/sdk-subpaths) per trovare l'importazione specifica.
- Esegui nuovamente `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Il plugin importa un percorso dell'SDK riservato ai plugin inclusi o alla
compatibilità interna.

- Sostituisci le importazioni riservate dell'SDK interno di OpenClaw con i sottopercorsi pubblici documentati
  `openclaw/plugin-sdk/*`.
- Se il comportamento non dispone di un SDK pubblico, mantieni l'helper nel tuo pacchetto o
  richiedi un'API pubblica di OpenClaw.
- Consulta [Sottopercorsi dell'SDK dei plugin](/it/plugins/sdk-subpaths) e
  [Migrazione dell'SDK](/it/plugins/sdk-migration) per scegliere un'importazione supportata.
- Esegui nuovamente `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Il plugin utilizza ancora l'helper deprecato per l'intero archivio delle sessioni
`loadSessionStore`.

- Usa `getSessionEntry(...)` o `listSessionEntries(...)` durante la lettura dello
  stato della sessione.
- Usa `patchSessionEntry(...)` o `upsertSessionEntry(...)` durante la scrittura dello
  stato della sessione.
- Evita di caricare, modificare e salvare l'intero oggetto dell'archivio delle sessioni.
- Mantieni `loadSessionStore(...)` solo finché l'intervallo di compatibilità dichiarato
  supporta ancora versioni precedenti di OpenClaw che lo richiedono.
- Consulta [API di runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi dell'SDK dei plugin](/it/plugins/sdk-subpaths).
- Esegui nuovamente `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

Il plugin utilizza ancora un helper deprecato per la scrittura dell'intero archivio delle sessioni, come
`saveSessionStore` o `updateSessionStore`.

- Usa `patchSessionEntry(...)` quando aggiorni i campi di una voce di sessione
  esistente.
- Usa `upsertSessionEntry(...)` quando sostituisci o crei una voce di sessione.
- Evita di caricare, modificare e salvare l'intero oggetto dell'archivio delle sessioni.
- Mantieni gli helper di scrittura dell'intero archivio solo finché l'intervallo di compatibilità dichiarato
  supporta ancora versioni precedenti di OpenClaw che li richiedono.
- Consulta [API di runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi dell'SDK dei plugin](/it/plugins/sdk-subpaths).
- Esegui nuovamente `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

Il plugin utilizza ancora helper deprecati per i percorsi dei file di sessione, come
`resolveSessionFilePath` o `resolveAndPersistSessionFile`.

- Usa `getSessionEntry(...)` per leggere i metadati della sessione in base all'identità
  dell'agente e della sessione.
- Usa `patchSessionEntry(...)` o `upsertSessionEntry(...)` per rendere persistenti i metadati
  della sessione.
- Usa gli helper per l'identità o la destinazione della trascrizione quando il codice prepara
  un'operazione sulla trascrizione.
- Non rendere persistenti né utilizzare i percorsi legacy dei file delle trascrizioni.
- Consulta [API di runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi dell'SDK dei plugin](/it/plugins/sdk-subpaths).
- Esegui nuovamente `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

Il plugin utilizza ancora l'helper deprecato per la destinazione del file della trascrizione
`resolveSessionTranscriptLegacyFileTarget`.

- Usa `resolveSessionTranscriptIdentity(...)` quando il codice necessita solo dell'identità
  pubblica della sessione.
- Usa `resolveSessionTranscriptTarget(...)` quando il codice necessita di una destinazione strutturata
  per un'operazione sulla trascrizione.
- Evita di leggere o costruire direttamente destinazioni legacy dei file delle trascrizioni.
- Mantieni l'helper legacy solo finché l'intervallo di compatibilità dichiarato
  supporta ancora versioni precedenti di OpenClaw che lo richiedono.
- Consulta [API di runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi dell'SDK dei plugin](/it/plugins/sdk-subpaths).
- Esegui nuovamente `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

Il plugin utilizza ancora helper deprecati di basso livello per le trascrizioni, come
`appendSessionTranscriptMessage` o `emitSessionTranscriptUpdate`.

- Usa `appendSessionTranscriptMessageByIdentity(...)` per aggiungere contenuti alle trascrizioni.
- Usa `publishSessionTranscriptUpdateByIdentity(...)` per le notifiche di aggiornamento
  delle trascrizioni.
- Preferisci l'interfaccia strutturata di runtime per le trascrizioni, affinché OpenClaw possa applicare
  i corretti confini delle transazioni e la corretta gestione delle identità.
- Mantieni gli helper di basso livello per le trascrizioni solo finché l'intervallo di compatibilità dichiarato
  supporta ancora versioni precedenti di OpenClaw che li richiedono.
- Consulta [API di runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi dell'SDK dei plugin](/it/plugins/sdk-subpaths).
- Esegui nuovamente `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Il plugin utilizza ancora l'hook legacy `before_agent_start`.

- Sposta in `before_model_resolve` le operazioni di sostituzione del modello o del provider.
- Sposta in `before_prompt_build` le operazioni di modifica del prompt o del contesto.
- Mantieni `before_agent_start` solo finché l'intervallo di compatibilità dichiarato
  supporta ancora versioni precedenti di OpenClaw che lo richiedono.
- Consulta [Hook](/it/plugins/hooks) e
  [Compatibilità dei plugin](/it/plugins/compatibility).
- Esegui nuovamente `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Il manifesto utilizza ancora i metadati legacy di autenticazione del provider `providerAuthEnvVars`.

- Replica i metadati delle variabili di ambiente del provider in `setup.providers[].envVars`.
- Mantieni `providerAuthEnvVars` solo come metadati di compatibilità finché l'intervallo
  di versioni OpenClaw supportato ne ha ancora bisogno.
- Consulta [Riferimento di setup](/it/plugins/manifest#setup-reference) e
  [Migrazione dell'SDK](/it/plugins/sdk-migration).
- Esegui nuovamente `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Il manifesto utilizza metadati legacy o meno recenti per le variabili di ambiente dei canali senza gli attuali
metadati di configurazione o setup previsti da ClawHub.

- Mantieni dichiarativi i metadati delle variabili di ambiente dei canali, affinché OpenClaw possa verificare lo stato del setup
  senza caricare il runtime del canale.
- Replica il setup del canale basato sull'ambiente negli attuali metadati di setup, configurazione del canale o
  pacchetto del canale utilizzati dalla struttura del tuo plugin.
- Mantieni `channelEnvVars` solo come metadati di compatibilità finché le versioni precedenti
  supportate di OpenClaw lo richiedono ancora.
- Consulta [Manifesto del plugin](/it/plugins/manifest) e
  [Plugin dei canali](/it/plugins/sdk-channel-plugins).
- Esegui nuovamente `clawhub package validate <path-to-plugin>`.

## Manifesto di sicurezza

### security-manifest-schema-unavailable

Il pacchetto distribuisce `openclaw.security.json` con un riferimento a uno schema che ClawHub
non riconosce come disponibile.

- Rimuovi l'URL dello schema se ha esclusivamente valore consultivo.
- Usa uno schema documentato e dotato di versione solo dopo che OpenClaw ne avrà pubblicato uno.
- Esegui nuovamente `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Il pacchetto distribuisce un file di manifesto di sicurezza non supportato.

- Rimuovi `openclaw.security.json` finché OpenClaw non documenterà uno schema con versione per il manifesto
  di sicurezza e il relativo comportamento di ClawHub.
- Mantieni il comportamento sensibile alla sicurezza documentato nella documentazione pubblica del pacchetto o nel
  README finché non esiste il contratto del manifesto.
- Esegui nuovamente `clawhub package validate <path-to-plugin>`.

## Contenuti correlati

- [CLI di ClawHub](/it/clawhub/cli)
- [Pubblicazione su ClawHub](/it/clawhub/publishing)
- [Creazione di plugin](/it/plugins/building-plugins)
- [Manifesto del plugin](/it/plugins/manifest)
- [Punti di ingresso dei plugin](/it/plugins/sdk-entrypoints)
- [Compatibilità dei plugin](/it/plugins/compatibility)
