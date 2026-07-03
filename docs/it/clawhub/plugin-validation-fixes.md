---
read_when:
    - Hai eseguito clawhub package validate e devi correggere i rilievi del plugin
    - ClawHub ha rifiutato o mostrato un avviso durante la pubblicazione di un pacchetto Plugin
    - Stai aggiornando i metadati del pacchetto Plugin prima del rilascio
summary: Correggi i rilievi di validazione del pacchetto Plugin ClawHub prima della pubblicazione
title: Correzioni della convalida dei Plugin
x-i18n:
    generated_at: "2026-07-03T13:34:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Correzioni di validazione dei Plugin

ClawHub valida i pacchetti Plugin prima della pubblicazione e può anche mostrare risultati da scansioni automatiche dei pacchetti. Questa pagina riguarda i risultati rivolti agli autori, cioè risultati che l'autore del Plugin può correggere nei metadati del pacchetto, nel manifest, negli import SDK o nell'artefatto pubblicato.

Non riguarda i risultati di copertura interni di Plugin Inspector. Se un report completo contiene codici di manutenzione dello scanner senza indicazioni di correzione per l'autore, questi sono destinati ai manutentori di OpenClaw anziché agli autori dei Plugin.

Dopo avere applicato qualsiasi correzione, esegui di nuovo:

```bash
clawhub package validate <path-to-plugin>
```

## Risultati rivolti agli autori

| Codice                                  | Inizia da qui                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Aggiungi metadati del pacchetto](/it/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [Aggiungi il blocco openclaw del pacchetto](/it/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [Dichiara gli entrypoint del pacchetto OpenClaw](/it/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [Pubblica l'entrypoint dichiarato](/it/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [Completa i metadati di installazione](/it/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Dichiara la compatibilità dell'API del Plugin](/it/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [Allinea la versione host minima](/it/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [Allinea le versioni del pacchetto e del manifest](/it/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [Rimuovi i metadati del pacchetto OpenClaw non supportati](/it/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [Rendi pacchettizzabile l'artefatto npm](/it/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [Includi gli entrypoint nell'output di npm pack](/it/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Includi i metadati nell'output di npm pack](/it/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Aggiungi un nome visualizzato del manifest](/it/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Rimuovi i campi del manifest non supportati](/it/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Rimuovi le chiavi di contratto non supportate](/it/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [Sostituisci gli import SDK dalla radice](/it/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Rimuovi gli import SDK riservati](/it/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Sostituisci l'accesso all'intero archivio sessione](/it/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [Sostituisci le scritture dell'intero archivio sessione](/it/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [Sostituisci gli helper dei percorsi file di sessione](/it/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [Sostituisci le destinazioni file legacy delle trascrizioni](/it/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [Sostituisci gli helper di basso livello per le trascrizioni](/it/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [Sostituisci before_agent_start](/it/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Sposta le variabili di ambiente del provider nei metadati di configurazione](/it/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Replica le variabili di ambiente del canale nei metadati correnti](/it/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Rimuovi i riferimenti non disponibili allo schema del manifest di sicurezza](/it/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Rimuovi i file manifest di sicurezza non supportati](/it/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Metadati del pacchetto

### package-json-missing

La radice del pacchetto non include `package.json`, quindi ClawHub non può identificare il pacchetto npm, la versione, gli entrypoint o i metadati OpenClaw.

- Aggiungi `package.json` con `name`, `version` e `type`.
- Aggiungi un blocco `openclaw` quando il pacchetto distribuisce un Plugin OpenClaw.
- Usa [Creazione di Plugin](/it/plugins/building-plugins) per un esempio minimo di pacchetto e [Manifest del Plugin](/it/plugins/manifest#manifest-versus-packagejson) per la separazione tra pacchetto e manifest.
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

Il pacchetto ha `package.json`, ma non dichiara i metadati del pacchetto OpenClaw.

- Aggiungi `package.json#openclaw`.
- Includi metadati degli entrypoint come `openclaw.extensions` o `openclaw.runtimeExtensions`.
- Aggiungi metadati di compatibilità e installazione quando il pacchetto sarà pubblicato o installato tramite ClawHub.
- Vedi [campi package.json che influenzano il rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

I metadati del pacchetto esistono, ma non dichiarano un entrypoint runtime OpenClaw.

- Aggiungi `openclaw.extensions` per gli entrypoint nativi del Plugin.
- Aggiungi `openclaw.runtimeExtensions` quando il pacchetto pubblicato deve caricare JavaScript compilato.
- Mantieni tutti i percorsi degli entrypoint all'interno della directory del pacchetto.
- Vedi [Punti di ingresso dei Plugin](/it/plugins/sdk-entrypoints) e [campi package.json che influenzano il rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Il pacchetto dichiara un entrypoint OpenClaw, ma il file referenziato manca dal pacchetto in fase di validazione.

- Controlla ogni percorso in `openclaw.extensions`, `openclaw.runtimeExtensions`, `openclaw.setupEntry` e `openclaw.runtimeSetupEntry`.
- Compila il pacchetto se l'entrypoint viene generato in `dist`.
- Aggiorna i metadati se l'entrypoint è stato spostato.
- Vedi [Punti di ingresso dei Plugin](/it/plugins/sdk-entrypoints).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub non riesce a capire come installare o aggiornare il pacchetto.

- Compila `openclaw.install` con la sorgente di installazione supportata, come `clawhubSpec`, `npmSpec` o `localPath`.
- Imposta `openclaw.install.defaultChoice` quando è disponibile più di una sorgente di installazione.
- Usa `openclaw.install.minHostVersion` per la versione host minima di OpenClaw.
- Vedi [campi package.json che influenzano il rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Il pacchetto non dichiara l'intervallo dell'API Plugin OpenClaw che supporta.

- Aggiungi `openclaw.compat.pluginApi` a `package.json`.
- Usa la versione dell'API Plugin OpenClaw o il limite inferiore semver rispetto a cui hai compilato e testato.
- Mantieni questo valore separato dalla versione del pacchetto. La versione del pacchetto descrive il rilascio del Plugin; `openclaw.compat.pluginApi` descrive il contratto dell'API host.
- Vedi [campi package.json che influenzano il rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

La versione host minima del pacchetto non corrisponde ai metadati della versione OpenClaw rispetto a cui il pacchetto è stato compilato.

- Controlla `openclaw.install.minHostVersion`.
- Controlla eventuali metadati di build OpenClaw nel pacchetto, come la versione OpenClaw usata durante il rilascio.
- Allinea la versione host minima all'intervallo di versioni host che il pacchetto supporta effettivamente.
- Vedi [campi package.json che influenzano il rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

La versione del pacchetto e la versione del manifest del Plugin non coincidono.

- Preferisci `package.json#version` come versione di rilascio del pacchetto.
- Se anche `openclaw.plugin.json` ha `version`, aggiornalo perché corrisponda oppure rimuovi i metadati di versione del manifest obsoleti quando i metadati del pacchetto sono autorevoli.
- Pubblica una nuova versione del pacchetto dopo avere modificato i metadati pubblicati.
- Vedi [Manifest del Plugin](/it/plugins/manifest).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Il blocco `package.json#openclaw` contiene campi che non sono metadati del pacchetto OpenClaw supportati.

- Rimuovi campi non supportati come `openclaw.bundle`.
- Mantieni i metadati del Plugin nativo in `openclaw.plugin.json`.
- Mantieni entrypoint del pacchetto, compatibilità, installazione, setup e metadati di catalogo nei campi supportati di `package.json#openclaw`.
- Vedi [campi package.json che influenzano il rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

## Artefatto pubblicato

### package-npm-pack-unavailable

Il pacchetto non può essere trasformato nell'artefatto che ClawHub ispezionerebbe o pubblicherebbe.

- Esegui `npm pack --dry-run` dalla radice del pacchetto.
- Correggi metadati del pacchetto non validi, script del ciclo di vita non funzionanti o voci files che causano il fallimento della pacchettizzazione.
- Rimuovi `private: true` se questo pacchetto è destinato alla pubblicazione pubblica.
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Il pacchetto può essere impacchettato, ma l'artefatto impacchettato non include i file entrypoint dichiarati in `package.json#openclaw`.

- Esegui `npm pack --dry-run` e ispeziona i file che verrebbero inclusi.
- Compila gli entrypoint generati prima della pacchettizzazione.
- Aggiorna `files`, `.npmignore` o l'output di build affinché gli entrypoint dichiarati siano inclusi.
- Vedi [Punti di ingresso dei Plugin](/it/plugins/sdk-entrypoints).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

Nell'artefatto impacchettato mancano metadati OpenClaw presenti nel pacchetto sorgente.

- Esegui `npm pack --dry-run` e ispeziona i file di metadati inclusi.
- Assicurati che `package.json` includa il blocco `openclaw` nell'artefatto impacchettato.
- Assicurati che `openclaw.plugin.json` sia incluso quando il pacchetto è un Plugin OpenClaw nativo.
- Aggiorna `files` o `.npmignore` in modo che i metadati del pacchetto non siano esclusi.
- Vedi [Creazione di Plugin](/it/plugins/building-plugins).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

## Metadati del manifest

### manifest-name-missing

Il manifest del Plugin nativo non include un nome visualizzato.

- Aggiungi un campo `name` non vuoto a `openclaw.plugin.json`.
- Mantieni `name` leggibile da una persona e mantieni `id` come id macchina stabile.
- Vedi [Manifest del Plugin](/it/plugins/manifest).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Il manifest del Plugin contiene campi di primo livello che OpenClaw non supporta.

- Confronta ogni campo di primo livello con il
  [riferimento dei campi del manifest](/it/plugins/manifest#top-level-field-reference).
- Rimuovi i campi personalizzati da `openclaw.plugin.json`.
- Sposta i metadati di pacchetto o installazione nei campi supportati di `package.json#openclaw`
  invece che nel manifest.
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Il manifest dichiara chiavi non supportate dentro `contracts`.

- Confronta ogni chiave sotto `contracts` con il
  [riferimento dei contratti](/it/plugins/manifest#contracts-reference).
- Rimuovi le chiavi di contratto non supportate.
- Sposta il comportamento runtime nel codice di registrazione del Plugin e mantieni `contracts`
  limitato ai metadati statici di proprietà delle capability.
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

## SDK e migrazione della compatibilità

### legacy-root-sdk-import

Il Plugin importa dal barrel SDK root deprecato:
`openclaw/plugin-sdk`.

- Sostituisci gli import dal barrel root con import mirati da sottopercorsi pubblici.
- Usa `openclaw/plugin-sdk/plugin-entry` per `definePluginEntry`.
- Usa `openclaw/plugin-sdk/channel-core` per gli helper degli entry point di canale.
- Usa [Convenzioni di import](/it/plugins/building-plugins#import-conventions) e
  [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths) per trovare l'import più ristretto.
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Il Plugin importa un percorso SDK riservato ai Plugin in bundle o alla
compatibilità interna.

- Sostituisci gli import SDK interni riservati di OpenClaw con sottopercorsi pubblici documentati
  `openclaw/plugin-sdk/*`.
- Se il comportamento non ha un SDK pubblico, mantieni l'helper dentro il tuo pacchetto oppure
  richiedi un'API pubblica di OpenClaw.
- Usa [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths) e
  [Migrazione SDK](/it/plugins/sdk-migration) per scegliere un import supportato.
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Il Plugin usa ancora l'helper deprecato per l'intero session store
`loadSessionStore`.

- Usa `getSessionEntry(...)` o `listSessionEntries(...)` quando leggi lo stato della sessione.
- Usa `patchSessionEntry(...)` o `upsertSessionEntry(...)` quando scrivi lo stato della sessione.
- Evita di caricare, modificare e salvare l'intero oggetto session store.
- Mantieni `loadSessionStore(...)` solo mentre l'intervallo di compatibilità dichiarato
  supporta ancora versioni precedenti di OpenClaw che lo richiedono.
- Vedi [API runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

Il Plugin usa ancora un helper di scrittura deprecato per l'intero session store, come
`saveSessionStore` o `updateSessionStore`.

- Usa `patchSessionEntry(...)` quando aggiorni campi su una voce di sessione esistente.
- Usa `upsertSessionEntry(...)` quando sostituisci o crei una voce di sessione.
- Evita di caricare, modificare e salvare l'intero oggetto session store.
- Mantieni gli helper di scrittura per l'intero store solo mentre l'intervallo di compatibilità dichiarato
  supporta ancora versioni precedenti di OpenClaw che li richiedono.
- Vedi [API runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

Il Plugin usa ancora helper deprecati per i percorsi dei file di sessione, come
`resolveSessionFilePath` o `resolveAndPersistSessionFile`.

- Usa `getSessionEntry(...)` per leggere i metadati della sessione in base all'identità
  di agente e sessione.
- Usa `patchSessionEntry(...)` o `upsertSessionEntry(...)` per persistere i metadati
  della sessione.
- Usa l'identità del transcript o gli helper di target quando il codice prepara
  un'operazione sul transcript.
- Non persistere né dipendere dai percorsi legacy dei file di transcript.
- Vedi [API runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

Il Plugin usa ancora l'helper deprecato per il target del file di transcript
`resolveSessionTranscriptLegacyFileTarget`.

- Usa `resolveSessionTranscriptIdentity(...)` quando il codice necessita solo dell'identità
  pubblica della sessione.
- Usa `resolveSessionTranscriptTarget(...)` quando il codice necessita di un target strutturato
  per un'operazione sul transcript.
- Evita di leggere o costruire direttamente target legacy di file di transcript.
- Mantieni l'helper legacy solo mentre l'intervallo di compatibilità dichiarato supporta ancora
  versioni precedenti di OpenClaw che lo richiedono.
- Vedi [API runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

Il Plugin usa ancora helper di basso livello deprecati per il transcript, come
`appendSessionTranscriptMessage` o `emitSessionTranscriptUpdate`.

- Usa `appendSessionTranscriptMessageByIdentity(...)` per aggiungere messaggi al transcript.
- Usa `publishSessionTranscriptUpdateByIdentity(...)` per le notifiche di aggiornamento
  del transcript.
- Preferisci la superficie runtime strutturata del transcript, così OpenClaw può applicare
  i corretti confini di transazione e la corretta gestione dell'identità.
- Mantieni gli helper di basso livello del transcript solo mentre l'intervallo di compatibilità dichiarato
  supporta ancora versioni precedenti di OpenClaw che li richiedono.
- Vedi [API runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Il Plugin usa ancora l'hook legacy `before_agent_start`.

- Sposta il lavoro di override del modello o del provider in `before_model_resolve`.
- Sposta il lavoro di modifica del prompt o del contesto in `before_prompt_build`.
- Mantieni `before_agent_start` solo mentre l'intervallo di compatibilità dichiarato supporta ancora
  versioni precedenti di OpenClaw che lo richiedono.
- Vedi [Hook](/it/plugins/hooks) e
  [Compatibilità dei Plugin](/it/plugins/compatibility).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Il manifest usa ancora i metadati legacy `providerAuthEnvVars` per l'autenticazione del provider.

- Replica i metadati delle variabili d'ambiente del provider in `setup.providers[].envVars`.
- Mantieni `providerAuthEnvVars` solo come metadati di compatibilità mentre l'intervallo
  OpenClaw supportato ne ha ancora bisogno.
- Vedi [riferimento setup](/it/plugins/manifest#setup-reference) e
  [Migrazione SDK](/it/plugins/sdk-migration).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Il manifest usa metadati legacy o precedenti delle variabili d'ambiente del canale senza gli attuali
metadati di setup o configurazione attesi da ClawHub.

- Mantieni dichiarativi i metadati delle variabili d'ambiente del canale, così OpenClaw può ispezionare lo stato
  del setup senza caricare il runtime del canale.
- Replica il setup del canale guidato dalle variabili d'ambiente nei metadati attuali di setup, configurazione del canale o
  pacchetto canale usati dalla forma del tuo Plugin.
- Mantieni `channelEnvVars` solo come metadati di compatibilità mentre versioni precedenti supportate
  di OpenClaw lo richiedono ancora.
- Vedi [Manifest del Plugin](/it/plugins/manifest) e
  [Plugin di canale](/it/plugins/sdk-channel-plugins).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

## Manifest di sicurezza

### security-manifest-schema-unavailable

Il pacchetto distribuisce `openclaw.security.json` con un riferimento a schema che ClawHub
non riconosce come disponibile.

- Rimuovi l'URL dello schema se è solo consultivo.
- Usa uno schema versionato documentato solo dopo che OpenClaw ne pubblica uno.
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Il pacchetto distribuisce un file manifest di sicurezza non supportato.

- Rimuovi `openclaw.security.json` finché OpenClaw non documenta uno schema di manifest di sicurezza
  versionato e il comportamento di ClawHub.
- Mantieni il comportamento sensibile alla sicurezza documentato nella documentazione pubblica del tuo pacchetto o
  nel README finché non esiste il contratto del manifest.
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

## Correlati

- [CLI ClawHub](/it/clawhub/cli)
- [Pubblicazione ClawHub](/it/clawhub/publishing)
- [Creare Plugin](/it/plugins/building-plugins)
- [Manifest del Plugin](/it/plugins/manifest)
- [Entry point dei Plugin](/it/plugins/sdk-entrypoints)
- [Compatibilità dei Plugin](/it/plugins/compatibility)
