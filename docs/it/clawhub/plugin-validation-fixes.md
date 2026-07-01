---
read_when:
    - Hai eseguito clawhub package validate e devi correggere i rilievi del Plugin
    - ClawHub ha rifiutato o segnalato un avviso durante la pubblicazione di un pacchetto Plugin
    - Stai aggiornando i metadati del pacchetto Plugin prima del rilascio
summary: Correggi i rilievi della convalida del pacchetto plugin ClawHub prima della pubblicazione
title: Correzioni della validazione dei Plugin
x-i18n:
    generated_at: "2026-07-01T20:23:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Correzioni della convalida dei Plugin

ClawHub convalida i pacchetti Plugin prima della pubblicazione e può anche mostrare segnalazioni dalle
scansioni automatiche dei pacchetti. Questa pagina copre le segnalazioni rivolte agli autori, cioè
segnalazioni che l’autore del Plugin può correggere nei metadati del pacchetto, nel manifest, negli import dell’SDK
o nell’artefatto pubblicato.

Non copre le segnalazioni di copertura interne del Plugin Inspector. Se un rapporto completo
contiene codici di manutenzione dello scanner senza indicazioni di correzione per l’autore, questi
sono destinati ai manutentori di OpenClaw anziché agli autori dei Plugin.

Dopo aver applicato qualsiasi correzione, riesegui:

```bash
clawhub package validate <path-to-plugin>
```

## Segnalazioni rivolte agli autori

| Codice                                  | Inizia da qui                                                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Aggiungi i metadati del pacchetto](/it/clawhub/plugin-validation-fixes#package-json-missing)                                      |
| `package-openclaw-metadata-missing`     | [Aggiungi il blocco openclaw del pacchetto](/it/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                 |
| `package-openclaw-entry-missing`        | [Dichiara gli entrypoint del pacchetto OpenClaw](/it/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)               |
| `package-entrypoint-missing`            | [Pubblica l’entrypoint dichiarato](/it/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                |
| `package-install-metadata-incomplete`   | [Completa i metadati di installazione](/it/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                    |
| `package-plugin-api-compat-missing`     | [Dichiara la compatibilità dell’API del Plugin](/it/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)             |
| `package-min-host-version-drift`        | [Allinea la versione host minima](/it/clawhub/plugin-validation-fixes#package-min-host-version-drift)                              |
| `package-manifest-version-drift`        | [Allinea le versioni del pacchetto e del manifest](/it/clawhub/plugin-validation-fixes#package-manifest-version-drift)             |
| `package-openclaw-unsupported-metadata` | [Rimuovi i metadati di pacchetto OpenClaw non supportati](/it/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata) |
| `package-npm-pack-unavailable`          | [Rendi impacchettabile l’artefatto npm](/it/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                          |
| `package-npm-pack-entrypoint-missing`   | [Includi gli entrypoint nell’output di npm pack](/it/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)          |
| `package-npm-pack-metadata-missing`     | [Includi i metadati nell’output di npm pack](/it/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                |
| `manifest-name-missing`                 | [Aggiungi un nome visualizzato al manifest](/it/clawhub/plugin-validation-fixes#manifest-name-missing)                             |
| `manifest-unknown-fields`               | [Rimuovi i campi del manifest non supportati](/it/clawhub/plugin-validation-fixes#manifest-unknown-fields)                         |
| `manifest-unknown-contracts`            | [Rimuovi le chiavi di contratto non supportate](/it/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                    |
| `legacy-root-sdk-import`                | [Sostituisci gli import root dell’SDK](/it/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                 |
| `reserved-sdk-import`                   | [Rimuovi gli import riservati dell’SDK](/it/clawhub/plugin-validation-fixes#reserved-sdk-import)                                   |
| `sdk-load-session-store`                | [Sostituisci l’accesso all’intero archivio sessione](/it/clawhub/plugin-validation-fixes#sdk-load-session-store)                  |
| `sdk-session-store-write`               | [Sostituisci le scritture dell’intero archivio sessione](/it/clawhub/plugin-validation-fixes#sdk-session-store-write)             |
| `sdk-session-file-helper`               | [Sostituisci gli helper per i percorsi dei file di sessione](/it/clawhub/plugin-validation-fixes#sdk-session-file-helper)          |
| `sdk-session-transcript-file-target`    | [Sostituisci i target legacy dei file di trascrizione](/it/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)     |
| `sdk-session-transcript-low-level`      | [Sostituisci gli helper di basso livello per le trascrizioni](/it/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level) |
| `legacy-before-agent-start`             | [Sostituisci before_agent_start](/it/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                    |
| `provider-auth-env-vars`                | [Sposta le variabili env del provider nei metadati di configurazione](/it/clawhub/plugin-validation-fixes#provider-auth-env-vars)   |
| `channel-env-vars`                      | [Replica le variabili env del canale nei metadati correnti](/it/clawhub/plugin-validation-fixes#channel-env-vars)                  |
| `security-manifest-schema-unavailable`  | [Rimuovi i riferimenti a schemi del manifest di sicurezza non disponibili](/it/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Rimuovi i file manifest di sicurezza non supportati](/it/clawhub/plugin-validation-fixes#unrecognized-security-manifest)          |

## Metadati del pacchetto

### package-json-missing

La root del pacchetto non include `package.json`, quindi ClawHub non può identificare il
pacchetto npm, la versione, gli entrypoint o i metadati OpenClaw.

- Aggiungi `package.json` con `name`, `version` e `type`.
- Aggiungi un blocco `openclaw` quando il pacchetto distribuisce un Plugin OpenClaw.
- Usa [Creare Plugin](/it/plugins/building-plugins) per un esempio minimo di pacchetto
  e [Manifest del Plugin](/it/plugins/manifest#manifest-versus-packagejson)
  per la distinzione tra pacchetto e manifest.
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

Il pacchetto contiene `package.json`, ma non dichiara metadati di pacchetto
OpenClaw.

- Aggiungi `package.json#openclaw`.
- Includi metadati degli entrypoint come `openclaw.extensions` o
  `openclaw.runtimeExtensions`.
- Aggiungi metadati di compatibilità e installazione quando il pacchetto sarà pubblicato o
  installato tramite ClawHub.
- Vedi [campi di package.json che influenzano la scoperta](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

I metadati del pacchetto esistono, ma non dichiarano un entrypoint runtime
OpenClaw.

- Aggiungi `openclaw.extensions` per gli entrypoint nativi del Plugin.
- Aggiungi `openclaw.runtimeExtensions` quando il pacchetto pubblicato deve caricare JavaScript
  compilato.
- Mantieni tutti i percorsi degli entrypoint all’interno della directory del pacchetto.
- Vedi [Punti di ingresso del Plugin](/it/plugins/sdk-entrypoints) e
  [campi di package.json che influenzano la scoperta](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Il pacchetto dichiara un entrypoint OpenClaw, ma il file referenziato manca
dal pacchetto in fase di convalida.

- Controlla ogni percorso in `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` e `openclaw.runtimeSetupEntry`.
- Compila il pacchetto se l’entrypoint viene generato in `dist`.
- Aggiorna i metadati se l’entrypoint è stato spostato.
- Vedi [Punti di ingresso del Plugin](/it/plugins/sdk-entrypoints).
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub non può determinare come il pacchetto debba essere installato o aggiornato.

- Compila `openclaw.install` con la sorgente di installazione supportata, come
  `clawhubSpec`, `npmSpec` o `localPath`.
- Imposta `openclaw.install.defaultChoice` quando è disponibile più di una sorgente di
  installazione.
- Usa `openclaw.install.minHostVersion` per la versione host minima di OpenClaw.
- Vedi [campi di package.json che influenzano la scoperta](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Il pacchetto non dichiara l’intervallo dell’API Plugin OpenClaw che supporta.

- Aggiungi `openclaw.compat.pluginApi` a `package.json`.
- Usa la versione dell’API Plugin OpenClaw o il limite semver minimo rispetto a cui hai creato e testato
  il pacchetto.
- Tienilo separato dalla versione del pacchetto. La versione del pacchetto descrive la
  release del Plugin; `openclaw.compat.pluginApi` descrive il contratto dell’API host.
- Vedi [campi di package.json che influenzano la scoperta](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

La versione host minima del pacchetto non corrisponde ai metadati di versione OpenClaw
rispetto a cui il pacchetto è stato creato.

- Controlla `openclaw.install.minHostVersion`.
- Controlla eventuali metadati di build OpenClaw nel pacchetto, come la versione OpenClaw
  usata durante la release.
- Allinea la versione host minima all’intervallo di versioni host che il pacchetto
  supporta effettivamente.
- Vedi [campi di package.json che influenzano la scoperta](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

La versione del pacchetto e la versione del manifest del Plugin non corrispondono.

- Preferisci `package.json#version` come versione di release del pacchetto.
- Se anche `openclaw.plugin.json` contiene `version`, aggiornalo affinché corrisponda oppure rimuovi
  metadati di versione del manifest obsoleti quando i metadati del pacchetto sono autorevoli.
- Pubblica una nuova versione del pacchetto dopo aver modificato metadati pubblicati.
- Vedi [Manifest del Plugin](/it/plugins/manifest).
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Il blocco `package.json#openclaw` contiene campi che non sono metadati di pacchetto
OpenClaw supportati.

- Rimuovi i campi non supportati come `openclaw.bundle`.
- Mantieni i metadati nativi del Plugin in `openclaw.plugin.json`.
- Mantieni entrypoint del pacchetto, compatibilità, installazione, configurazione e metadati di catalogo
  nei campi supportati di `package.json#openclaw`.
- Vedi [campi di package.json che influenzano la scoperta](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Riesegui `clawhub package validate <path-to-plugin>`.

## Artefatto pubblicato

### package-npm-pack-unavailable

Il pacchetto non può essere impacchettato nell’artefatto che ClawHub ispezionerebbe o
pubblicherebbe.

- Esegui `npm pack --dry-run` dalla root del pacchetto.
- Correggi metadati di pacchetto non validi, script del ciclo di vita non funzionanti o voci `files` che
  fanno fallire l’impacchettamento.
- Rimuovi `private: true` se questo pacchetto è destinato alla pubblicazione pubblica.
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Il pacchetto può essere impacchettato, ma l’artefatto impacchettato non include i
file entrypoint dichiarati in `package.json#openclaw`.

- Esegui `npm pack --dry-run` e ispeziona i file che verrebbero inclusi.
- Compila gli entrypoint generati prima dell’impacchettamento.
- Aggiorna `files`, `.npmignore` o l’output di build affinché gli entrypoint dichiarati siano
  inclusi.
- Vedi [Punti di ingresso del Plugin](/it/plugins/sdk-entrypoints).
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

All’artefatto impacchettato mancano metadati OpenClaw presenti nel pacchetto
sorgente.

- Esegui `npm pack --dry-run` e ispeziona i file di metadati inclusi.
- Assicurati che `package.json` includa il blocco `openclaw` nell’artefatto impacchettato.
- Assicurati che `openclaw.plugin.json` sia incluso quando il pacchetto è un Plugin
  OpenClaw nativo.
- Aggiorna `files` o `.npmignore` affinché i metadati del pacchetto non siano esclusi.
- Vedi [Creare Plugin](/it/plugins/building-plugins).
- Riesegui `clawhub package validate <path-to-plugin>`.

## Metadati del manifest

### manifest-name-missing

Il manifest del plugin nativo non include un nome visualizzato.

- Aggiungi un campo `name` non vuoto a `openclaw.plugin.json`.
- Mantieni `name` leggibile da persone e mantieni `id` come ID macchina stabile.
- Vedi [Manifest Plugin](/it/plugins/manifest).
- Riesegui `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Il manifest del plugin contiene campi di primo livello che OpenClaw non supporta.

- Confronta ogni campo di primo livello con il
  [riferimento dei campi del manifest](/it/plugins/manifest#top-level-field-reference).
- Rimuovi i campi personalizzati da `openclaw.plugin.json`.
- Sposta invece i metadati del pacchetto o di installazione nei campi supportati di `package.json#openclaw`.
- Riesegui `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Il manifest dichiara chiavi non supportate dentro `contracts`.

- Confronta ogni chiave sotto `contracts` con il
  [riferimento dei contracts](/it/plugins/manifest#contracts-reference).
- Rimuovi le chiavi di contratto non supportate.
- Sposta il comportamento di runtime nel codice di registrazione del plugin e mantieni `contracts`
  limitato ai metadati statici di proprietà delle capability.
- Riesegui `clawhub package validate <path-to-plugin>`.

## Migrazione di SDK e compatibilità

### legacy-root-sdk-import

Il plugin importa dal barrel root deprecato dell'SDK:
`openclaw/plugin-sdk`.

- Sostituisci gli import dal barrel root con import mirati da sottopercorsi pubblici.
- Usa `openclaw/plugin-sdk/plugin-entry` per `definePluginEntry`.
- Usa `openclaw/plugin-sdk/channel-core` per gli helper di entry dei canali.
- Usa [Convenzioni di importazione](/it/plugins/building-plugins#import-conventions) e
  [Sottopercorsi dell'SDK Plugin](/it/plugins/sdk-subpaths) per trovare l'import ristretto.
- Riesegui `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Il plugin importa un percorso SDK riservato ai plugin in bundle o alla compatibilità
interna.

- Sostituisci gli import SDK interni riservati di OpenClaw con sottopercorsi pubblici documentati
  `openclaw/plugin-sdk/*`.
- Se il comportamento non ha un SDK pubblico, mantieni l'helper dentro il tuo pacchetto o
  richiedi un'API pubblica di OpenClaw.
- Usa [Sottopercorsi dell'SDK Plugin](/it/plugins/sdk-subpaths) e
  [Migrazione SDK](/it/plugins/sdk-migration) per scegliere un import supportato.
- Riesegui `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Il plugin usa ancora l'helper deprecato per l'intero archivio sessioni
`loadSessionStore`.

- Usa `getSessionEntry(...)` o `listSessionEntries(...)` quando leggi lo stato della sessione.
- Usa `patchSessionEntry(...)` o `upsertSessionEntry(...)` quando scrivi lo stato della sessione.
- Evita di caricare, modificare e salvare l'intero oggetto dell'archivio sessioni.
- Mantieni `loadSessionStore(...)` solo finché l'intervallo di compatibilità dichiarato
  supporta ancora versioni precedenti di OpenClaw che lo richiedono.
- Vedi [API di runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi dell'SDK Plugin](/it/plugins/sdk-subpaths).
- Riesegui `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

Il plugin usa ancora un helper deprecato di scrittura dell'intero archivio sessioni, come
`saveSessionStore` o `updateSessionStore`.

- Usa `patchSessionEntry(...)` quando aggiorni campi su una voce di sessione esistente.
- Usa `upsertSessionEntry(...)` quando sostituisci o crei una voce di sessione.
- Evita di caricare, modificare e salvare l'intero oggetto dell'archivio sessioni.
- Mantieni gli helper di scrittura dell'intero archivio solo finché l'intervallo di compatibilità dichiarato
  supporta ancora versioni precedenti di OpenClaw che li richiedono.
- Vedi [API di runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi dell'SDK Plugin](/it/plugins/sdk-subpaths).
- Riesegui `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

Il plugin usa ancora helper deprecati per i percorsi dei file di sessione, come
`resolveSessionFilePath` o `resolveAndPersistSessionFile`.

- Usa `getSessionEntry(...)` per leggere i metadati di sessione per identità di agente e sessione.
- Usa `patchSessionEntry(...)` o `upsertSessionEntry(...)` per persistere i metadati di sessione.
- Usa l'identità della trascrizione o gli helper di destinazione quando il codice sta preparando un'operazione di trascrizione.
- Non persistere né dipendere dai percorsi file legacy delle trascrizioni.
- Vedi [API di runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi dell'SDK Plugin](/it/plugins/sdk-subpaths).
- Riesegui `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

Il plugin usa ancora l'helper deprecato per la destinazione del file di trascrizione
`resolveSessionTranscriptLegacyFileTarget`.

- Usa `resolveSessionTranscriptIdentity(...)` quando al codice serve solo l'identità pubblica della sessione.
- Usa `resolveSessionTranscriptTarget(...)` quando al codice serve una destinazione strutturata per un'operazione di trascrizione.
- Evita di leggere o costruire direttamente destinazioni file legacy delle trascrizioni.
- Mantieni l'helper legacy solo finché l'intervallo di compatibilità dichiarato supporta ancora
  versioni precedenti di OpenClaw che lo richiedono.
- Vedi [API di runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi dell'SDK Plugin](/it/plugins/sdk-subpaths).
- Riesegui `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

Il plugin usa ancora helper di basso livello deprecati per le trascrizioni, come
`appendSessionTranscriptMessage` o `emitSessionTranscriptUpdate`.

- Usa `appendSessionTranscriptMessageByIdentity(...)` per aggiungere messaggi alla trascrizione.
- Usa `publishSessionTranscriptUpdateByIdentity(...)` per le notifiche di aggiornamento della trascrizione.
- Preferisci la superficie runtime strutturata per le trascrizioni, così OpenClaw può applicare
  i corretti confini di transazione e la gestione dell'identità.
- Mantieni gli helper di basso livello per le trascrizioni solo finché l'intervallo di compatibilità dichiarato
  supporta ancora versioni precedenti di OpenClaw che li richiedono.
- Vedi [API di runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi dell'SDK Plugin](/it/plugins/sdk-subpaths).
- Riesegui `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Il plugin usa ancora l'hook legacy `before_agent_start`.

- Sposta il lavoro di override del modello o del provider in `before_model_resolve`.
- Sposta il lavoro di modifica del prompt o del contesto in `before_prompt_build`.
- Mantieni `before_agent_start` solo finché l'intervallo di compatibilità dichiarato supporta ancora
  versioni precedenti di OpenClaw che lo richiedono.
- Vedi [Hook](/it/plugins/hooks) e
  [Compatibilità Plugin](/it/plugins/compatibility).
- Riesegui `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Il manifest usa ancora i metadati legacy di autenticazione provider `providerAuthEnvVars`.

- Replica i metadati delle variabili d'ambiente del provider in `setup.providers[].envVars`.
- Mantieni `providerAuthEnvVars` solo come metadati di compatibilità finché l'intervallo supportato di
  OpenClaw ne ha ancora bisogno.
- Vedi [riferimento setup](/it/plugins/manifest#setup-reference) e
  [Migrazione SDK](/it/plugins/sdk-migration).
- Riesegui `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Il manifest usa metadati legacy o precedenti delle variabili d'ambiente del canale senza gli attuali
metadati di setup o configurazione che ClawHub si aspetta.

- Mantieni dichiarativi i metadati delle variabili d'ambiente del canale, così OpenClaw può ispezionare lo stato di setup
  senza caricare il runtime del canale.
- Replica il setup del canale guidato da variabili d'ambiente negli attuali metadati di setup, configurazione del canale o
  pacchetto-canale usati dalla forma del tuo plugin.
- Mantieni `channelEnvVars` solo come metadati di compatibilità finché le versioni precedenti supportate di
  OpenClaw lo richiedono ancora.
- Vedi [Manifest Plugin](/it/plugins/manifest) e
  [Plugin di canale](/it/plugins/sdk-channel-plugins).
- Riesegui `clawhub package validate <path-to-plugin>`.

## Manifest di sicurezza

### security-manifest-schema-unavailable

Il pacchetto distribuisce `openclaw.security.json` con un riferimento di schema che ClawHub
non riconosce come disponibile.

- Rimuovi l'URL dello schema se è solo consultivo.
- Usa uno schema versionato documentato solo dopo che OpenClaw ne pubblica uno.
- Riesegui `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Il pacchetto distribuisce un file manifest di sicurezza non supportato.

- Rimuovi `openclaw.security.json` finché OpenClaw non documenta uno schema di manifest di sicurezza
  versionato e il comportamento di ClawHub.
- Mantieni il comportamento sensibile alla sicurezza documentato nella documentazione pubblica del tuo pacchetto o nel
  README finché il contratto del manifest non esiste.
- Riesegui `clawhub package validate <path-to-plugin>`.

## Correlati

- [CLI ClawHub](/it/clawhub/cli)
- [Pubblicazione ClawHub](/it/clawhub/publishing)
- [Creazione di plugin](/it/plugins/building-plugins)
- [Manifest Plugin](/it/plugins/manifest)
- [Punti di ingresso del Plugin](/it/plugins/sdk-entrypoints)
- [Compatibilità Plugin](/it/plugins/compatibility)
