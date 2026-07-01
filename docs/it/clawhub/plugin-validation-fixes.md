---
read_when:
    - Hai eseguito clawhub package validate e devi correggere i risultati del plugin
    - ClawHub ha rifiutato o emesso un avviso per la pubblicazione di un pacchetto Plugin
    - Stai aggiornando i metadati del pacchetto Plugin prima del rilascio
summary: Correggi i rilievi di convalida del pacchetto del Plugin ClawHub prima della pubblicazione
title: Correzioni della convalida dei Plugin
x-i18n:
    generated_at: "2026-07-01T13:03:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Correzioni di validazione dei Plugin

ClawHub valida i pacchetti Plugin prima della pubblicazione e può anche mostrare risultati da
scansioni automatiche dei pacchetti. Questa pagina copre i risultati rivolti agli autori, cioè
risultati che l'autore del Plugin può correggere nei metadati del pacchetto, nel manifesto, negli import SDK
o nell'artefatto pubblicato.

Non copre i risultati interni di copertura del Plugin Inspector. Se un report completo
contiene codici di manutenzione dello scanner senza indicazioni di correzione per l'autore, quei codici
sono destinati ai maintainer di OpenClaw, non agli autori di Plugin.

Dopo aver applicato qualsiasi correzione, riesegui:

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
| `package-plugin-api-compat-missing`     | [Dichiara la compatibilità con l'API Plugin](/it/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [Allinea la versione minima dell'host](/it/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [Allinea le versioni del pacchetto e del manifesto](/it/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [Rimuovi i metadati del pacchetto OpenClaw non supportati](/it/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [Rendi pacchettizzabile l'artefatto npm](/it/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [Includi gli entrypoint nell'output di npm pack](/it/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Includi i metadati nell'output di npm pack](/it/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Aggiungi un nome visualizzato al manifesto](/it/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Rimuovi i campi del manifesto non supportati](/it/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Rimuovi le chiavi di contratto non supportate](/it/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [Sostituisci gli import SDK dalla radice](/it/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Rimuovi gli import SDK riservati](/it/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Sostituisci l'accesso all'intero archivio di sessione](/it/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [Sostituisci le scritture dell'intero archivio di sessione](/it/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [Sostituisci gli helper dei percorsi file di sessione](/it/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [Sostituisci i target file dei transcript legacy](/it/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [Sostituisci gli helper transcript di basso livello](/it/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [Sostituisci before_agent_start](/it/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Sposta le variabili env del provider nei metadati di setup](/it/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Rispecchia le variabili env del canale nei metadati correnti](/it/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Rimuovi i riferimenti a schemi del manifesto di sicurezza non disponibili](/it/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Rimuovi i file di manifesto di sicurezza non supportati](/it/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Metadati del pacchetto

### package-json-missing

La radice del pacchetto non include `package.json`, quindi ClawHub non può identificare il
pacchetto npm, la versione, gli entrypoint o i metadati OpenClaw.

- Aggiungi `package.json` con `name`, `version` e `type`.
- Aggiungi un blocco `openclaw` quando il pacchetto distribuisce un Plugin OpenClaw.
- Usa [Creare Plugin](/it/plugins/building-plugins) per un esempio minimo di pacchetto
  e [Manifesto Plugin](/it/plugins/manifest#manifest-versus-packagejson)
  per la separazione tra pacchetto e manifesto.
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

Il pacchetto ha `package.json`, ma non dichiara metadati del pacchetto
OpenClaw.

- Aggiungi `package.json#openclaw`.
- Includi metadati degli entrypoint come `openclaw.extensions` o
  `openclaw.runtimeExtensions`.
- Aggiungi metadati di compatibilità e installazione quando il pacchetto verrà pubblicato o
  installato tramite ClawHub.
- Vedi [campi package.json che influenzano il rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

I metadati del pacchetto esistono, ma non dichiarano un entrypoint runtime
OpenClaw.

- Aggiungi `openclaw.extensions` per gli entrypoint Plugin nativi.
- Aggiungi `openclaw.runtimeExtensions` quando il pacchetto pubblicato deve caricare JavaScript
  compilato.
- Mantieni tutti i percorsi degli entrypoint all'interno della directory del pacchetto.
- Vedi [Punti di ingresso Plugin](/it/plugins/sdk-entrypoints) e
  [campi package.json che influenzano il rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Il pacchetto dichiara un entrypoint OpenClaw, ma il file referenziato manca
dal pacchetto in fase di validazione.

- Controlla ogni percorso in `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` e `openclaw.runtimeSetupEntry`.
- Compila il pacchetto se l'entrypoint viene generato in `dist`.
- Aggiorna i metadati se l'entrypoint è stato spostato.
- Vedi [Punti di ingresso Plugin](/it/plugins/sdk-entrypoints).
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub non riesce a determinare come il pacchetto debba essere installato o aggiornato.

- Compila `openclaw.install` con la sorgente di installazione supportata, come
  `clawhubSpec`, `npmSpec` o `localPath`.
- Imposta `openclaw.install.defaultChoice` quando è disponibile più di una sorgente di installazione.
- Usa `openclaw.install.minHostVersion` per la versione minima dell'host OpenClaw.
- Vedi [campi package.json che influenzano il rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Il pacchetto non dichiara l'intervallo dell'API Plugin OpenClaw che supporta.

- Aggiungi `openclaw.compat.pluginApi` a `package.json`.
- Usa la versione dell'API Plugin OpenClaw o il limite minimo semver con cui hai compilato e testato
  il pacchetto.
- Tienilo separato dalla versione del pacchetto. La versione del pacchetto descrive la
  release del Plugin; `openclaw.compat.pluginApi` descrive il contratto API dell'host.
- Vedi [campi package.json che influenzano il rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

La versione minima dell'host del pacchetto non corrisponde ai metadati della versione OpenClaw
contro cui il pacchetto è stato compilato.

- Controlla `openclaw.install.minHostVersion`.
- Controlla eventuali metadati di build OpenClaw nel pacchetto, come la versione OpenClaw
  usata durante la release.
- Allinea la versione minima dell'host con l'intervallo di versioni dell'host che il pacchetto
  supporta effettivamente.
- Vedi [campi package.json che influenzano il rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

La versione del pacchetto e la versione del manifesto Plugin non corrispondono.

- Preferisci `package.json#version` come versione di release del pacchetto.
- Se anche `openclaw.plugin.json` contiene `version`, aggiornala perché corrisponda o rimuovi
  i metadati di versione del manifesto obsoleti quando i metadati del pacchetto sono autoritativi.
- Pubblica una nuova versione del pacchetto dopo aver modificato metadati pubblicati.
- Vedi [Manifesto Plugin](/it/plugins/manifest).
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Il blocco `package.json#openclaw` contiene campi che non sono metadati di pacchetto
OpenClaw supportati.

- Rimuovi campi non supportati come `openclaw.bundle`.
- Mantieni i metadati Plugin nativi in `openclaw.plugin.json`.
- Mantieni entrypoint del pacchetto, compatibilità, installazione, setup e metadati di catalogo
  nei campi `package.json#openclaw` supportati.
- Vedi [campi package.json che influenzano il rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Riesegui `clawhub package validate <path-to-plugin>`.

## Artefatto pubblicato

### package-npm-pack-unavailable

Il pacchetto non può essere compresso nell'artefatto che ClawHub ispezionerebbe o
pubblicherebbe.

- Esegui `npm pack --dry-run` dalla radice del pacchetto.
- Correggi metadati del pacchetto non validi, script di lifecycle rotti o voci `files` che
  fanno fallire il packing.
- Rimuovi `private: true` se questo pacchetto è destinato alla pubblicazione pubblica.
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Il pacchetto può essere compresso, ma l'artefatto compresso non include i
file entrypoint dichiarati in `package.json#openclaw`.

- Esegui `npm pack --dry-run` e ispeziona i file che verrebbero inclusi.
- Compila gli entrypoint generati prima del packing.
- Aggiorna `files`, `.npmignore` o l'output di build in modo che gli entrypoint dichiarati siano
  inclusi.
- Vedi [Punti di ingresso Plugin](/it/plugins/sdk-entrypoints).
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

Nell'artefatto compresso mancano metadati OpenClaw presenti nel tuo pacchetto
sorgente.

- Esegui `npm pack --dry-run` e ispeziona i file di metadati inclusi.
- Assicurati che `package.json` includa il blocco `openclaw` nell'artefatto compresso.
- Assicurati che `openclaw.plugin.json` sia incluso quando il pacchetto è un Plugin
  OpenClaw nativo.
- Aggiorna `files` o `.npmignore` in modo che i metadati del pacchetto non siano esclusi.
- Vedi [Creare Plugin](/it/plugins/building-plugins).
- Riesegui `clawhub package validate <path-to-plugin>`.

## Metadati del manifesto

### manifest-name-missing

Il manifest nativo del Plugin non include un nome visualizzato.

- Aggiungi un campo `name` non vuoto a `openclaw.plugin.json`.
- Mantieni `name` leggibile per le persone e mantieni `id` come id macchina stabile.
- Consulta [Manifest del Plugin](/it/plugins/manifest).
- Riesegui `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Il manifest del Plugin contiene campi di primo livello non supportati da OpenClaw.

- Confronta ogni campo di primo livello con il
  [riferimento dei campi del manifest](/it/plugins/manifest#top-level-field-reference).
- Rimuovi i campi personalizzati da `openclaw.plugin.json`.
- Sposta i metadati di pacchetto o installazione nei campi supportati di `package.json#openclaw`
  invece che nel manifest.
- Riesegui `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Il manifest dichiara chiavi non supportate dentro `contracts`.

- Confronta ogni chiave sotto `contracts` con il
  [riferimento dei contracts](/it/plugins/manifest#contracts-reference).
- Rimuovi le chiavi contract non supportate.
- Sposta il comportamento runtime nel codice di registrazione del Plugin e mantieni `contracts`
  limitato ai metadati statici di proprietà delle capability.
- Riesegui `clawhub package validate <path-to-plugin>`.

## Migrazione di SDK e compatibilità

### legacy-root-sdk-import

Il Plugin importa dal barrel SDK radice deprecato:
`openclaw/plugin-sdk`.

- Sostituisci gli import dal barrel radice con import mirati da sottopercorsi pubblici.
- Usa `openclaw/plugin-sdk/plugin-entry` per `definePluginEntry`.
- Usa `openclaw/plugin-sdk/channel-core` per gli helper di entry del canale.
- Usa [Convenzioni di import](/it/plugins/building-plugins#import-conventions) e
  [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths) per trovare l'import più ristretto.
- Riesegui `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Il Plugin importa un percorso SDK riservato ai Plugin in bundle o alla
compatibilità interna.

- Sostituisci gli import SDK interni riservati di OpenClaw con sottopercorsi pubblici documentati
  `openclaw/plugin-sdk/*`.
- Se il comportamento non ha un SDK pubblico, mantieni l'helper dentro il tuo pacchetto oppure
  richiedi un'API pubblica di OpenClaw.
- Usa [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths) e
  [Migrazione dell'SDK](/it/plugins/sdk-migration) per scegliere un import supportato.
- Riesegui `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Il Plugin usa ancora l'helper deprecato dell'intero store di sessione
`loadSessionStore`.

- Usa `getSessionEntry(...)` o `listSessionEntries(...)` quando leggi lo stato della sessione.
- Usa `patchSessionEntry(...)` o `upsertSessionEntry(...)` quando scrivi lo stato della sessione.
- Evita di caricare, modificare e salvare l'intero oggetto dello store di sessione.
- Mantieni `loadSessionStore(...)` solo finché l'intervallo di compatibilità dichiarato
  supporta ancora versioni precedenti di OpenClaw che lo richiedono.
- Consulta [API runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths).
- Riesegui `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

Il Plugin usa ancora un helper di scrittura deprecato dell'intero store di sessione, come
`saveSessionStore` o `updateSessionStore`.

- Usa `patchSessionEntry(...)` quando aggiorni campi su una voce di sessione esistente.
- Usa `upsertSessionEntry(...)` quando sostituisci o crei una voce di sessione.
- Evita di caricare, modificare e salvare l'intero oggetto dello store di sessione.
- Mantieni gli helper di scrittura dell'intero store solo finché l'intervallo di compatibilità dichiarato
  supporta ancora versioni precedenti di OpenClaw che li richiedono.
- Consulta [API runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths).
- Riesegui `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

Il Plugin usa ancora helper deprecati per i percorsi dei file di sessione, come
`resolveSessionFilePath` o `resolveAndPersistSessionFile`.

- Usa `getSessionEntry(...)` per leggere i metadati di sessione tramite identità dell'agente e della sessione.
- Usa `patchSessionEntry(...)` o `upsertSessionEntry(...)` per rendere persistenti i metadati di sessione.
- Usa l'identità della trascrizione o gli helper di destinazione quando il codice prepara
  un'operazione sulla trascrizione.
- Non rendere persistenti né dipendere dai percorsi legacy dei file di trascrizione.
- Consulta [API runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths).
- Riesegui `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

Il Plugin usa ancora l'helper deprecato per la destinazione del file di trascrizione
`resolveSessionTranscriptLegacyFileTarget`.

- Usa `resolveSessionTranscriptIdentity(...)` quando il codice ha bisogno solo dell'identità pubblica della sessione.
- Usa `resolveSessionTranscriptTarget(...)` quando il codice ha bisogno di una destinazione strutturata
  per un'operazione sulla trascrizione.
- Evita di leggere o costruire direttamente destinazioni legacy dei file di trascrizione.
- Mantieni l'helper legacy solo finché l'intervallo di compatibilità dichiarato supporta ancora
  versioni precedenti di OpenClaw che lo richiedono.
- Consulta [API runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths).
- Riesegui `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

Il Plugin usa ancora helper di basso livello deprecati per le trascrizioni, come
`appendSessionTranscriptMessage` o `emitSessionTranscriptUpdate`.

- Usa `appendSessionTranscriptMessageByIdentity(...)` per aggiungere elementi alla trascrizione.
- Usa `publishSessionTranscriptUpdateByIdentity(...)` per le notifiche di aggiornamento della trascrizione.
- Preferisci la superficie runtime strutturata della trascrizione, così OpenClaw può applicare
  i limiti di transazione e la gestione dell'identità corretti.
- Mantieni gli helper di basso livello per le trascrizioni solo finché l'intervallo di compatibilità dichiarato
  supporta ancora versioni precedenti di OpenClaw che li richiedono.
- Consulta [API runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths).
- Riesegui `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Il Plugin usa ancora l'hook legacy `before_agent_start`.

- Sposta il lavoro di override del modello o del provider in `before_model_resolve`.
- Sposta il lavoro di modifica di prompt o contesto in `before_prompt_build`.
- Mantieni `before_agent_start` solo finché l'intervallo di compatibilità dichiarato supporta ancora
  versioni precedenti di OpenClaw che lo richiedono.
- Consulta [Hook](/it/plugins/hooks) e
  [Compatibilità del Plugin](/it/plugins/compatibility).
- Riesegui `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Il manifest usa ancora i metadati legacy di autenticazione provider `providerAuthEnvVars`.

- Rispecchia i metadati delle variabili d'ambiente del provider in `setup.providers[].envVars`.
- Mantieni `providerAuthEnvVars` solo come metadati di compatibilità finché l'intervallo
  OpenClaw supportato ne ha ancora bisogno.
- Consulta [riferimento di setup](/it/plugins/manifest#setup-reference) e
  [Migrazione dell'SDK](/it/plugins/sdk-migration).
- Riesegui `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Il manifest usa metadati legacy o meno recenti per le variabili d'ambiente del canale, senza gli attuali
metadati di setup o configurazione attesi da ClawHub.

- Mantieni dichiarativi i metadati delle variabili d'ambiente del canale, così OpenClaw può ispezionare lo stato del setup
  senza caricare il runtime del canale.
- Rispecchia il setup del canale guidato da variabili d'ambiente nei metadati attuali di setup, configurazione del canale o
  pacchetto del canale usati dalla forma del tuo Plugin.
- Mantieni `channelEnvVars` solo come metadati di compatibilità finché versioni precedenti supportate
  di OpenClaw lo richiedono ancora.
- Consulta [Manifest del Plugin](/it/plugins/manifest) e
  [Plugin di canale](/it/plugins/sdk-channel-plugins).
- Riesegui `clawhub package validate <path-to-plugin>`.

## Manifest di sicurezza

### security-manifest-schema-unavailable

Il pacchetto distribuisce `openclaw.security.json` con un riferimento a schema che ClawHub
non riconosce come disponibile.

- Rimuovi l'URL dello schema se ha solo valore consultivo.
- Usa uno schema versionato documentato solo dopo che OpenClaw ne pubblica uno.
- Riesegui `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Il pacchetto distribuisce un file manifest di sicurezza non supportato.

- Rimuovi `openclaw.security.json` finché OpenClaw non documenta uno schema versionato del manifest di sicurezza
  e il comportamento di ClawHub.
- Mantieni il comportamento sensibile alla sicurezza documentato nella documentazione pubblica del tuo pacchetto o nel
  README finché non esiste il contract del manifest.
- Riesegui `clawhub package validate <path-to-plugin>`.

## Correlati

- [CLI ClawHub](/it/clawhub/cli)
- [Pubblicazione su ClawHub](/it/clawhub/publishing)
- [Creazione di Plugin](/it/plugins/building-plugins)
- [Manifest del Plugin](/it/plugins/manifest)
- [Punti di entry del Plugin](/it/plugins/sdk-entrypoints)
- [Compatibilità del Plugin](/it/plugins/compatibility)
