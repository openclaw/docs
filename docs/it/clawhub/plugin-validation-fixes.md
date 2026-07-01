---
read_when:
    - Hai eseguito clawhub package validate e devi correggere le segnalazioni del Plugin
    - ClawHub ha rifiutato o segnalato un avviso durante la pubblicazione di un pacchetto Plugin
    - Stai aggiornando i metadati del pacchetto Plugin prima del rilascio
summary: Correggi i rilievi di validazione del pacchetto Plugin ClawHub prima della pubblicazione
title: Correzioni della convalida dei Plugin
x-i18n:
    generated_at: "2026-07-01T15:25:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Correzioni per la convalida dei Plugin

ClawHub convalida i pacchetti Plugin prima della pubblicazione e può anche mostrare rilevamenti da
scansioni automatiche dei pacchetti. Questa pagina tratta i rilevamenti rivolti agli autori, cioè
rilevamenti che l'autore del Plugin può correggere nei metadati del pacchetto, nel manifesto, nelle importazioni SDK
o nell'artefatto pubblicato.

Non tratta i rilevamenti di copertura interni di Plugin Inspector. Se un report completo
contiene codici di manutenzione dello scanner senza indicazioni di correzione per gli autori, questi
sono destinati ai manutentori di OpenClaw, non agli autori dei Plugin.

Dopo aver applicato una correzione, esegui di nuovo:

```bash
clawhub package validate <path-to-plugin>
```

## Rilevamenti rivolti agli autori

| Codice                                  | Inizia da qui                                                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Aggiungi i metadati del pacchetto](/it/clawhub/plugin-validation-fixes#package-json-missing)                                |
| `package-openclaw-metadata-missing`     | [Aggiungi il blocco openclaw del pacchetto](/it/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)           |
| `package-openclaw-entry-missing`        | [Dichiara gli entrypoint del pacchetto OpenClaw](/it/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)         |
| `package-entrypoint-missing`            | [Pubblica l'entrypoint dichiarato](/it/clawhub/plugin-validation-fixes#package-entrypoint-missing)                           |
| `package-install-metadata-incomplete`   | [Completa i metadati di installazione](/it/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)              |
| `package-plugin-api-compat-missing`     | [Dichiara la compatibilità con l'API del Plugin](/it/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)      |
| `package-min-host-version-drift`        | [Allinea la versione minima dell'host](/it/clawhub/plugin-validation-fixes#package-min-host-version-drift)                   |
| `package-manifest-version-drift`        | [Allinea le versioni del pacchetto e del manifesto](/it/clawhub/plugin-validation-fixes#package-manifest-version-drift)      |
| `package-openclaw-unsupported-metadata` | [Rimuovi i metadati del pacchetto OpenClaw non supportati](/it/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata) |
| `package-npm-pack-unavailable`          | [Rendi impacchettabile l'artefatto npm](/it/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                    |
| `package-npm-pack-entrypoint-missing`   | [Includi gli entrypoint nell'output di npm pack](/it/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)    |
| `package-npm-pack-metadata-missing`     | [Includi i metadati nell'output di npm pack](/it/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)          |
| `manifest-name-missing`                 | [Aggiungi un nome visualizzato del manifesto](/it/clawhub/plugin-validation-fixes#manifest-name-missing)                     |
| `manifest-unknown-fields`               | [Rimuovi i campi del manifesto non supportati](/it/clawhub/plugin-validation-fixes#manifest-unknown-fields)                  |
| `manifest-unknown-contracts`            | [Rimuovi le chiavi di contratto non supportate](/it/clawhub/plugin-validation-fixes#manifest-unknown-contracts)              |
| `legacy-root-sdk-import`                | [Sostituisci le importazioni SDK dalla radice](/it/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                   |
| `reserved-sdk-import`                   | [Rimuovi le importazioni SDK riservate](/it/clawhub/plugin-validation-fixes#reserved-sdk-import)                             |
| `sdk-load-session-store`                | [Sostituisci l'accesso all'intero archivio di sessione](/it/clawhub/plugin-validation-fixes#sdk-load-session-store)          |
| `sdk-session-store-write`               | [Sostituisci le scritture dell'intero archivio di sessione](/it/clawhub/plugin-validation-fixes#sdk-session-store-write)     |
| `sdk-session-file-helper`               | [Sostituisci gli helper dei percorsi file di sessione](/it/clawhub/plugin-validation-fixes#sdk-session-file-helper)          |
| `sdk-session-transcript-file-target`    | [Sostituisci le destinazioni file legacy delle trascrizioni](/it/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target) |
| `sdk-session-transcript-low-level`      | [Sostituisci gli helper di basso livello delle trascrizioni](/it/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level) |
| `legacy-before-agent-start`             | [Sostituisci before_agent_start](/it/clawhub/plugin-validation-fixes#legacy-before-agent-start)                              |
| `provider-auth-env-vars`                | [Sposta le variabili d'ambiente del provider nei metadati di setup](/it/clawhub/plugin-validation-fixes#provider-auth-env-vars) |
| `channel-env-vars`                      | [Rispecchia le variabili d'ambiente del canale nei metadati correnti](/it/clawhub/plugin-validation-fixes#channel-env-vars)  |
| `security-manifest-schema-unavailable`  | [Rimuovi i riferimenti a schemi di manifesto di sicurezza non disponibili](/it/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Rimuovi i file di manifesto di sicurezza non supportati](/it/clawhub/plugin-validation-fixes#unrecognized-security-manifest) |

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
- Includi metadati di entrypoint come `openclaw.extensions` o
  `openclaw.runtimeExtensions`.
- Aggiungi metadati di compatibilità e installazione quando il pacchetto verrà pubblicato o
  installato tramite ClawHub.
- Vedi [campi di package.json che influiscono sulla discovery](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

I metadati del pacchetto esistono, ma non dichiarano un entrypoint runtime
OpenClaw.

- Aggiungi `openclaw.extensions` per gli entrypoint dei Plugin nativi.
- Aggiungi `openclaw.runtimeExtensions` quando il pacchetto pubblicato deve caricare JavaScript
  compilato.
- Mantieni tutti i percorsi degli entrypoint all'interno della directory del pacchetto.
- Vedi [Punti di ingresso dei Plugin](/it/plugins/sdk-entrypoints) e
  [campi di package.json che influiscono sulla discovery](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Il pacchetto dichiara un entrypoint OpenClaw, ma il file referenziato manca
dal pacchetto convalidato.

- Controlla ogni percorso in `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` e `openclaw.runtimeSetupEntry`.
- Compila il pacchetto se l'entrypoint viene generato in `dist`.
- Aggiorna i metadati se l'entrypoint è stato spostato.
- Vedi [Punti di ingresso dei Plugin](/it/plugins/sdk-entrypoints).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub non può determinare come il pacchetto deve essere installato o aggiornato.

- Compila `openclaw.install` con la fonte di installazione supportata, ad esempio
  `clawhubSpec`, `npmSpec` o `localPath`.
- Imposta `openclaw.install.defaultChoice` quando è disponibile più di una fonte di installazione.
- Usa `openclaw.install.minHostVersion` per la versione minima dell'host OpenClaw.
- Vedi [campi di package.json che influiscono sulla discovery](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Il pacchetto non dichiara l'intervallo dell'API dei Plugin OpenClaw che supporta.

- Aggiungi `openclaw.compat.pluginApi` a `package.json`.
- Usa la versione dell'API dei Plugin OpenClaw o la soglia minima semver rispetto a cui hai compilato e testato.
- Tienila separata dalla versione del pacchetto. La versione del pacchetto descrive il
  rilascio del Plugin; `openclaw.compat.pluginApi` descrive il contratto dell'API host.
- Vedi [campi di package.json che influiscono sulla discovery](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

La versione minima dell'host del pacchetto non corrisponde ai metadati della versione OpenClaw
rispetto a cui il pacchetto è stato compilato.

- Controlla `openclaw.install.minHostVersion`.
- Controlla eventuali metadati di compilazione OpenClaw nel pacchetto, come la versione OpenClaw
  usata durante il rilascio.
- Allinea la versione minima dell'host con l'intervallo di versioni host che il pacchetto
  supporta effettivamente.
- Vedi [campi di package.json che influiscono sulla discovery](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

La versione del pacchetto e la versione del manifesto del Plugin non corrispondono.

- Preferisci `package.json#version` come versione di rilascio del pacchetto.
- Se anche `openclaw.plugin.json` contiene `version`, aggiornala per farla corrispondere oppure rimuovi
  i metadati di versione obsoleti del manifesto quando i metadati del pacchetto sono autorevoli.
- Pubblica una nuova versione del pacchetto dopo aver modificato metadati pubblicati.
- Vedi [Manifesto del Plugin](/it/plugins/manifest).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Il blocco `package.json#openclaw` contiene campi che non sono metadati supportati
del pacchetto OpenClaw.

- Rimuovi i campi non supportati, come `openclaw.bundle`.
- Mantieni i metadati dei Plugin nativi in `openclaw.plugin.json`.
- Mantieni entrypoint del pacchetto, compatibilità, installazione, setup e metadati di catalogo
  nei campi supportati di `package.json#openclaw`.
- Vedi [campi di package.json che influiscono sulla discovery](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

## Artefatto pubblicato

### package-npm-pack-unavailable

Il pacchetto non può essere impacchettato nell'artefatto che ClawHub ispezionerebbe o
pubblicherebbe.

- Esegui `npm pack --dry-run` dalla radice del pacchetto.
- Correggi metadati del pacchetto non validi, script di ciclo di vita interrotti o voci dei file che
  causano il fallimento dell'impacchettamento.
- Rimuovi `private: true` se questo pacchetto è destinato alla pubblicazione pubblica.
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Il pacchetto può essere impacchettato, ma l'artefatto impacchettato non include i
file di entrypoint dichiarati in `package.json#openclaw`.

- Esegui `npm pack --dry-run` e ispeziona i file che verrebbero inclusi.
- Compila gli entrypoint generati prima dell'impacchettamento.
- Aggiorna `files`, `.npmignore` o l'output di compilazione in modo che gli entrypoint dichiarati siano
  inclusi.
- Vedi [Punti di ingresso dei Plugin](/it/plugins/sdk-entrypoints).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

Nell'artefatto impacchettato mancano metadati OpenClaw presenti nel pacchetto
sorgente.

- Esegui `npm pack --dry-run` e ispeziona i file di metadati inclusi.
- Assicurati che `package.json` includa il blocco `openclaw` nell'artefatto impacchettato.
- Assicurati che `openclaw.plugin.json` sia incluso quando il pacchetto è un Plugin nativo
  OpenClaw.
- Aggiorna `files` o `.npmignore` in modo che i metadati del pacchetto non siano esclusi.
- Vedi [Creare Plugin](/it/plugins/building-plugins).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

## Metadati del manifesto

### manifest-name-missing

Il manifest nativo del Plugin non include un nome visualizzato.

- Aggiungi un campo `name` non vuoto a `openclaw.plugin.json`.
- Mantieni `name` leggibile per gli utenti e conserva `id` come identificatore macchina stabile.
- Vedi [Manifest del Plugin](/it/plugins/manifest).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Il manifest del Plugin contiene campi di primo livello che OpenClaw non supporta.

- Confronta ogni campo di primo livello con il
  [riferimento dei campi del manifest](/it/plugins/manifest#top-level-field-reference).
- Rimuovi i campi personalizzati da `openclaw.plugin.json`.
- Sposta invece i metadati del pacchetto o di installazione nei campi supportati
  `package.json#openclaw`.
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Il manifest dichiara chiavi non supportate dentro `contracts`.

- Confronta ogni chiave sotto `contracts` con il
  [riferimento dei contratti](/it/plugins/manifest#contracts-reference).
- Rimuovi le chiavi di contratto non supportate.
- Sposta il comportamento di runtime nel codice di registrazione del Plugin e mantieni `contracts`
  limitato ai metadati statici di proprietà delle capacità.
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

## SDK e migrazione di compatibilità

### legacy-root-sdk-import

Il Plugin importa dal barrel SDK radice deprecato:
`openclaw/plugin-sdk`.

- Sostituisci gli import dal barrel radice con import mirati dai sottopercorsi pubblici.
- Usa `openclaw/plugin-sdk/plugin-entry` per `definePluginEntry`.
- Usa `openclaw/plugin-sdk/channel-core` per gli helper di entry dei canali.
- Usa [Convenzioni di import](/it/plugins/building-plugins#import-conventions) e
  [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths) per trovare l'import ristretto.
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Il Plugin importa un percorso SDK riservato ai Plugin in bundle o alla
compatibilità interna.

- Sostituisci gli import SDK interni riservati di OpenClaw con sottopercorsi pubblici documentati
  `openclaw/plugin-sdk/*`.
- Se il comportamento non ha un SDK pubblico, mantieni l'helper dentro il tuo pacchetto o
  richiedi una API pubblica di OpenClaw.
- Usa [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths) e
  [Migrazione SDK](/it/plugins/sdk-migration) per scegliere un import supportato.
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Il Plugin usa ancora l'helper deprecato dell'intero archivio di sessione
`loadSessionStore`.

- Usa `getSessionEntry(...)` o `listSessionEntries(...)` quando leggi lo stato della sessione.
- Usa `patchSessionEntry(...)` o `upsertSessionEntry(...)` quando scrivi lo stato della sessione.
- Evita di caricare, modificare e salvare l'intero oggetto dell'archivio di sessione.
- Mantieni `loadSessionStore(...)` solo mentre l'intervallo di compatibilità dichiarato
  supporta ancora versioni precedenti di OpenClaw che lo richiedono.
- Vedi [API di runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

Il Plugin usa ancora un helper di scrittura deprecato dell'intero archivio di sessione, come
`saveSessionStore` o `updateSessionStore`.

- Usa `patchSessionEntry(...)` quando aggiorni campi su una voce di sessione esistente.
- Usa `upsertSessionEntry(...)` quando sostituisci o crei una voce di sessione.
- Evita di caricare, modificare e salvare l'intero oggetto dell'archivio di sessione.
- Mantieni gli helper di scrittura dell'intero archivio solo mentre l'intervallo di compatibilità dichiarato
  supporta ancora versioni precedenti di OpenClaw che li richiedono.
- Vedi [API di runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

Il Plugin usa ancora helper deprecati per i percorsi dei file di sessione, come
`resolveSessionFilePath` o `resolveAndPersistSessionFile`.

- Usa `getSessionEntry(...)` per leggere i metadati di sessione in base all'identità
  dell'agente e della sessione.
- Usa `patchSessionEntry(...)` o `upsertSessionEntry(...)` per persistere i metadati di sessione.
- Usa gli helper di identità della trascrizione o del target quando il codice sta preparando
  un'operazione sulla trascrizione.
- Non persistere né dipendere dai percorsi file legacy delle trascrizioni.
- Vedi [API di runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

Il Plugin usa ancora l'helper deprecato per il target del file di trascrizione
`resolveSessionTranscriptLegacyFileTarget`.

- Usa `resolveSessionTranscriptIdentity(...)` quando il codice ha bisogno solo dell'identità pubblica
  della sessione.
- Usa `resolveSessionTranscriptTarget(...)` quando il codice ha bisogno di un target strutturato
  per l'operazione sulla trascrizione.
- Evita di leggere o costruire direttamente target legacy dei file di trascrizione.
- Mantieni l'helper legacy solo mentre l'intervallo di compatibilità dichiarato supporta ancora
  versioni precedenti di OpenClaw che lo richiedono.
- Vedi [API di runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

Il Plugin usa ancora helper di basso livello deprecati per le trascrizioni, come
`appendSessionTranscriptMessage` o `emitSessionTranscriptUpdate`.

- Usa `appendSessionTranscriptMessageByIdentity(...)` per aggiungere messaggi alla trascrizione.
- Usa `publishSessionTranscriptUpdateByIdentity(...)` per le notifiche di aggiornamento della trascrizione.
- Preferisci la superficie di runtime strutturata per le trascrizioni, così OpenClaw può applicare
  i confini di transazione e la gestione dell'identità corretti.
- Mantieni gli helper di basso livello per le trascrizioni solo mentre l'intervallo di compatibilità dichiarato
  supporta ancora versioni precedenti di OpenClaw che li richiedono.
- Vedi [API di runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Il Plugin usa ancora l'hook legacy `before_agent_start`.

- Sposta il lavoro di override del modello o del provider in `before_model_resolve`.
- Sposta il lavoro di mutazione del prompt o del contesto in `before_prompt_build`.
- Mantieni `before_agent_start` solo mentre l'intervallo di compatibilità dichiarato supporta ancora
  versioni precedenti di OpenClaw che lo richiedono.
- Vedi [Hook](/it/plugins/hooks) e
  [Compatibilità dei Plugin](/it/plugins/compatibility).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Il manifest usa ancora i metadati legacy `providerAuthEnvVars` per l'autenticazione del provider.

- Rispecchia i metadati delle variabili di ambiente del provider in `setup.providers[].envVars`.
- Mantieni `providerAuthEnvVars` solo come metadati di compatibilità mentre l'intervallo
  di OpenClaw supportato ne ha ancora bisogno.
- Vedi [riferimento di setup](/it/plugins/manifest#setup-reference) e
  [Migrazione SDK](/it/plugins/sdk-migration).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Il manifest usa metadati legacy o precedenti delle variabili di ambiente del canale senza gli attuali
metadati di setup o configurazione attesi da ClawHub.

- Mantieni dichiarativi i metadati delle variabili di ambiente del canale, così OpenClaw può ispezionare lo stato di setup
  senza caricare il runtime del canale.
- Rispecchia il setup del canale guidato da variabili di ambiente negli attuali metadati di setup, configurazione del canale o
  pacchetto canale usati dalla forma del tuo Plugin.
- Mantieni `channelEnvVars` solo come metadati di compatibilità mentre le versioni precedenti supportate
  di OpenClaw lo richiedono ancora.
- Vedi [Manifest del Plugin](/it/plugins/manifest) e
  [Plugin di canale](/it/plugins/sdk-channel-plugins).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

## Manifest di sicurezza

### security-manifest-schema-unavailable

Il pacchetto distribuisce `openclaw.security.json` con un riferimento a schema che ClawHub
non riconosce come disponibile.

- Rimuovi l'URL dello schema se è solo indicativo.
- Usa uno schema versionato documentato solo dopo che OpenClaw ne avrà pubblicato uno.
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Il pacchetto distribuisce un file manifest di sicurezza non supportato.

- Rimuovi `openclaw.security.json` finché OpenClaw non documenta uno schema versionato del manifest di sicurezza
  e il comportamento di ClawHub.
- Mantieni il comportamento sensibile alla sicurezza documentato nella documentazione pubblica del tuo pacchetto o nel
  README finché il contratto del manifest non esiste.
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

## Correlati

- [CLI ClawHub](/it/clawhub/cli)
- [Pubblicazione su ClawHub](/it/clawhub/publishing)
- [Creare Plugin](/it/plugins/building-plugins)
- [Manifest del Plugin](/it/plugins/manifest)
- [Punti di ingresso dei Plugin](/it/plugins/sdk-entrypoints)
- [Compatibilità dei Plugin](/it/plugins/compatibility)
