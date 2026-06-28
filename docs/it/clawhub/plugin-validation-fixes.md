---
read_when:
    - Hai eseguito clawhub package validate e devi correggere le segnalazioni del Plugin
    - ClawHub ha rifiutato o segnalato un avviso durante la pubblicazione di un pacchetto Plugin
    - Stai aggiornando i metadati del pacchetto Plugin prima del rilascio
summary: Correggi i rilievi della validazione dei pacchetti Plugin di ClawHub prima della pubblicazione
title: Correzioni della validazione dei Plugin
x-i18n:
    generated_at: "2026-06-28T06:01:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c50f57c8feb79c7ff304ad1c8e115b362795621d7cd4f85f435c44cc75308b9
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Correzioni per la convalida dei Plugin

ClawHub convalida i pacchetti Plugin prima della pubblicazione e può anche mostrare i risultati delle
scansioni automatizzate dei pacchetti. Questa pagina riguarda i risultati rivolti agli autori, cioè
risultati che l'autore del Plugin può correggere nei metadati del pacchetto, nel manifesto, negli import
SDK o nell'artefatto pubblicato.

Non riguarda i risultati di copertura interni di Plugin Inspector. Se un report completo
contiene codici di manutenzione dello scanner senza indicazioni di correzione per l'autore, questi
sono destinati ai maintainer di OpenClaw e non agli autori di Plugin.

Dopo aver applicato qualsiasi correzione, esegui di nuovo:

```bash
clawhub package validate <path-to-plugin>
```

## Risultati rivolti agli autori

| Codice                                  | Inizia qui                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Aggiungi i metadati del pacchetto](/it/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [Aggiungi il blocco openclaw del pacchetto](/it/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [Dichiara gli entrypoint del pacchetto OpenClaw](/it/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [Pubblica l'entrypoint dichiarato](/it/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [Completa i metadati di installazione](/it/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Dichiara la compatibilità dell'API del Plugin](/it/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [Allinea la versione minima dell'host](/it/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [Allinea le versioni del pacchetto e del manifesto](/it/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [Rimuovi i metadati del pacchetto OpenClaw non supportati](/it/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [Rendi impacchettabile l'artefatto npm](/it/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [Includi gli entrypoint nell'output di npm pack](/it/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Includi i metadati nell'output di npm pack](/it/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Aggiungi un nome visualizzato al manifesto](/it/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Rimuovi i campi del manifesto non supportati](/it/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Rimuovi le chiavi di contratto non supportate](/it/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [Sostituisci gli import SDK dalla radice](/it/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Rimuovi gli import SDK riservati](/it/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Sostituisci l'accesso all'intero archivio sessioni](/it/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `legacy-before-agent-start`             | [Sostituisci before_agent_start](/it/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Sposta le variabili di ambiente del provider nei metadati di configurazione](/it/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Replica le variabili di ambiente del canale nei metadati correnti](/it/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Rimuovi i riferimenti a schemi del manifesto di sicurezza non disponibili](/it/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Rimuovi i file del manifesto di sicurezza non supportati](/it/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Metadati del pacchetto

### package-json-missing

La radice del pacchetto non include `package.json`, quindi ClawHub non può identificare il
pacchetto npm, la versione, gli entrypoint o i metadati OpenClaw.

- Aggiungi `package.json` con `name`, `version` e `type`.
- Aggiungi un blocco `openclaw` quando il pacchetto distribuisce un Plugin OpenClaw.
- Usa [Creare Plugin](/it/plugins/building-plugins) per un esempio minimo di pacchetto
  e [Manifesto del Plugin](/it/plugins/manifest#manifest-versus-packagejson)
  per la separazione tra pacchetto e manifesto.
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

Il pacchetto contiene `package.json`, ma non dichiara i metadati del pacchetto
OpenClaw.

- Aggiungi `package.json#openclaw`.
- Includi metadati degli entrypoint come `openclaw.extensions` o
  `openclaw.runtimeExtensions`.
- Aggiungi metadati di compatibilità e installazione quando il pacchetto verrà pubblicato o
  installato tramite ClawHub.
- Vedi [campi package.json che influenzano la discovery](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

I metadati del pacchetto esistono, ma non dichiarano un entrypoint di runtime
OpenClaw.

- Aggiungi `openclaw.extensions` per gli entrypoint dei Plugin nativi.
- Aggiungi `openclaw.runtimeExtensions` quando il pacchetto pubblicato deve caricare JavaScript
  compilato.
- Mantieni tutti i percorsi degli entrypoint all'interno della directory del pacchetto.
- Vedi [Entry point dei Plugin](/it/plugins/sdk-entrypoints) e
  [campi package.json che influenzano la discovery](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Il pacchetto dichiara un entrypoint OpenClaw, ma il file indicato manca
dal pacchetto in fase di convalida.

- Controlla ogni percorso in `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` e `openclaw.runtimeSetupEntry`.
- Compila il pacchetto se l'entrypoint viene generato in `dist`.
- Aggiorna i metadati se l'entrypoint è stato spostato.
- Vedi [Entry point dei Plugin](/it/plugins/sdk-entrypoints).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub non riesce a stabilire come il pacchetto debba essere installato o aggiornato.

- Compila `openclaw.install` con l'origine di installazione supportata, come
  `clawhubSpec`, `npmSpec` o `localPath`.
- Imposta `openclaw.install.defaultChoice` quando è disponibile più di un'origine di installazione.
- Usa `openclaw.install.minHostVersion` per la versione minima dell'host OpenClaw.
- Vedi [campi package.json che influenzano la discovery](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Il pacchetto non dichiara l'intervallo dell'API Plugin OpenClaw che supporta.

- Aggiungi `openclaw.compat.pluginApi` a `package.json`.
- Usa la versione dell'API Plugin OpenClaw o il limite minimo semver con cui hai compilato e testato
  il pacchetto.
- Mantieni questo valore separato dalla versione del pacchetto. La versione del pacchetto descrive la
  release del Plugin; `openclaw.compat.pluginApi` descrive il contratto API dell'host.
- Vedi [campi package.json che influenzano la discovery](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

La versione minima dell'host del pacchetto non corrisponde ai metadati della versione OpenClaw
con cui il pacchetto è stato compilato.

- Controlla `openclaw.install.minHostVersion`.
- Controlla eventuali metadati di compilazione OpenClaw nel pacchetto, come la versione OpenClaw
  usata durante la release.
- Allinea la versione minima dell'host all'intervallo di versioni dell'host che il pacchetto
  supporta effettivamente.
- Vedi [campi package.json che influenzano la discovery](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

La versione del pacchetto e la versione del manifesto del Plugin non corrispondono.

- Preferisci `package.json#version` come versione di release del pacchetto.
- Se anche `openclaw.plugin.json` contiene `version`, aggiornalo perché corrisponda oppure rimuovi
  i metadati di versione obsoleti del manifesto quando i metadati del pacchetto sono autorevoli.
- Pubblica una nuova versione del pacchetto dopo aver modificato metadati pubblicati.
- Vedi [Manifesto del Plugin](/it/plugins/manifest).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Il blocco `package.json#openclaw` contiene campi che non sono metadati del pacchetto OpenClaw
supportati.

- Rimuovi campi non supportati come `openclaw.bundle`.
- Mantieni i metadati dei Plugin nativi in `openclaw.plugin.json`.
- Mantieni entrypoint del pacchetto, compatibilità, installazione, configurazione e metadati del catalogo
  nei campi `package.json#openclaw` supportati.
- Vedi [campi package.json che influenzano la discovery](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

## Artefatto pubblicato

### package-npm-pack-unavailable

Il pacchetto non può essere impacchettato nell'artefatto che ClawHub ispezionerebbe o
pubblicherebbe.

- Esegui `npm pack --dry-run` dalla radice del pacchetto.
- Correggi metadati del pacchetto non validi, script del ciclo di vita rotti o voci files che
  causano il fallimento dell'impacchettamento.
- Rimuovi `private: true` se questo pacchetto è destinato alla pubblicazione pubblica.
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Il pacchetto può essere impacchettato, ma l'artefatto impacchettato non include i
file entrypoint dichiarati in `package.json#openclaw`.

- Esegui `npm pack --dry-run` e ispeziona i file che verrebbero inclusi.
- Compila gli entrypoint generati prima dell'impacchettamento.
- Aggiorna `files`, `.npmignore` o l'output di build in modo che gli entrypoint dichiarati siano
  inclusi.
- Vedi [Entry point dei Plugin](/it/plugins/sdk-entrypoints).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

Nell'artefatto impacchettato mancano metadati OpenClaw presenti nel pacchetto
sorgente.

- Esegui `npm pack --dry-run` e ispeziona i file di metadati inclusi.
- Assicurati che `package.json` includa il blocco `openclaw` nell'artefatto impacchettato.
- Assicurati che `openclaw.plugin.json` sia incluso quando il pacchetto è un Plugin
  OpenClaw nativo.
- Aggiorna `files` o `.npmignore` in modo che i metadati del pacchetto non vengano esclusi.
- Vedi [Creare Plugin](/it/plugins/building-plugins).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

## Metadati del manifesto

### manifest-name-missing

Il manifesto del Plugin nativo non include un nome visualizzato.

- Aggiungi un campo `name` non vuoto a `openclaw.plugin.json`.
- Mantieni `name` leggibile da persone e conserva `id` come id macchina stabile.
- Vedi [Manifesto del Plugin](/it/plugins/manifest).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Il manifesto del Plugin contiene campi di primo livello che OpenClaw non supporta.

- Confronta ciascun campo di primo livello con il
  [riferimento ai campi del manifest](/it/plugins/manifest#top-level-field-reference).
- Rimuovi i campi personalizzati da `openclaw.plugin.json`.
- Sposta i metadati del pacchetto o di installazione nei campi supportati
  `package.json#openclaw` invece che nel manifest.
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Il manifest dichiara chiavi non supportate dentro `contracts`.

- Confronta ciascuna chiave sotto `contracts` con il
  [riferimento ai contracts](/it/plugins/manifest#contracts-reference).
- Rimuovi le chiavi contract non supportate.
- Sposta il comportamento runtime nel codice di registrazione del plugin e mantieni
  `contracts` limitato ai metadati statici di proprietà delle capability.
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

## SDK e migrazione della compatibilità

### legacy-root-sdk-import

Il plugin importa dal barrel SDK root deprecato:
`openclaw/plugin-sdk`.

- Sostituisci le importazioni dal barrel root con importazioni mirate da sottopercorsi pubblici.
- Usa `openclaw/plugin-sdk/plugin-entry` per `definePluginEntry`.
- Usa `openclaw/plugin-sdk/channel-core` per gli helper degli entry point dei canali.
- Usa [Convenzioni di importazione](/it/plugins/building-plugins#import-conventions) e
  [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths) per trovare l'importazione più stretta.
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Il plugin importa un percorso SDK riservato ai plugin in bundle o alla
compatibilità interna.

- Sostituisci le importazioni SDK interne riservate di OpenClaw con sottopercorsi
  pubblici documentati `openclaw/plugin-sdk/*`.
- Se il comportamento non ha un SDK pubblico, mantieni l'helper dentro il tuo pacchetto o
  richiedi un'API pubblica di OpenClaw.
- Usa [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths) e
  [Migrazione SDK](/it/plugins/sdk-migration) per scegliere un'importazione supportata.
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Il plugin usa ancora l'helper deprecato per l'intero archivio sessione
`loadSessionStore`.

- Usa `getSessionEntry(...)` o `listSessionEntries(...)` quando leggi lo stato della sessione.
- Usa `patchSessionEntry(...)` o `upsertSessionEntry(...)` quando scrivi lo stato della sessione.
- Evita di caricare, modificare e salvare l'intero oggetto dell'archivio sessione.
- Mantieni `loadSessionStore(...)` solo finché l'intervallo di compatibilità dichiarato
  supporta ancora versioni precedenti di OpenClaw che lo richiedono.
- Vedi [API runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Il plugin usa ancora l'hook legacy `before_agent_start`.

- Sposta il lavoro di override del modello o del provider in `before_model_resolve`.
- Sposta il lavoro di modifica del prompt o del contesto in `before_prompt_build`.
- Mantieni `before_agent_start` solo finché l'intervallo di compatibilità dichiarato supporta ancora
  versioni precedenti di OpenClaw che lo richiedono.
- Vedi [Hook](/it/plugins/hooks) e
  [Compatibilità dei Plugin](/it/plugins/compatibility).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Il manifest usa ancora i metadati legacy di autenticazione provider `providerAuthEnvVars`.

- Replica i metadati delle variabili d'ambiente del provider in `setup.providers[].envVars`.
- Mantieni `providerAuthEnvVars` solo come metadati di compatibilità finché l'intervallo
  OpenClaw supportato ne ha ancora bisogno.
- Vedi [riferimento setup](/it/plugins/manifest#setup-reference) e
  [Migrazione SDK](/it/plugins/sdk-migration).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Il manifest usa metadati legacy o più vecchi delle variabili d'ambiente del canale senza i metadati
setup o config correnti che ClawHub si aspetta.

- Mantieni dichiarativi i metadati delle variabili d'ambiente del canale, così OpenClaw può ispezionare lo stato del setup
  senza caricare il runtime del canale.
- Replica il setup del canale basato su variabili d'ambiente nei metadati correnti di setup, configurazione del canale o
  pacchetto canale usati dalla forma del tuo plugin.
- Mantieni `channelEnvVars` solo come metadati di compatibilità finché le versioni precedenti supportate
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

- Rimuovi `openclaw.security.json` finché OpenClaw non documenta uno schema versionato per il manifest di sicurezza
  e il comportamento di ClawHub.
- Mantieni il comportamento sensibile alla sicurezza documentato nella documentazione pubblica del tuo pacchetto o nel
  README finché il contratto del manifest non esiste.
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

## Correlati

- [CLI ClawHub](/it/clawhub/cli)
- [Pubblicazione su ClawHub](/it/clawhub/publishing)
- [Creazione di Plugin](/it/plugins/building-plugins)
- [Manifest del Plugin](/it/plugins/manifest)
- [Entry point del Plugin](/it/plugins/sdk-entrypoints)
- [Compatibilità dei Plugin](/it/plugins/compatibility)
