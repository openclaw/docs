---
read_when:
    - Hai eseguito clawhub package validate e devi correggere le segnalazioni del Plugin
    - ClawHub ha rifiutato o segnalato un avviso durante la pubblicazione di un pacchetto Plugin
    - Stai aggiornando i metadati del pacchetto Plugin prima del rilascio
summary: Correggi i rilievi di convalida del pacchetto Plugin ClawHub prima della pubblicazione
title: Correzioni di validazione dei Plugin
x-i18n:
    generated_at: "2026-07-02T08:21:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Correzioni per la convalida dei Plugin

ClawHub convalida i pacchetti Plugin prima della pubblicazione e può anche mostrare risultati dalle
scansioni automatiche dei pacchetti. Questa pagina tratta i risultati rivolti agli autori, cioè
risultati che l'autore del Plugin può correggere nei metadati del pacchetto, nel manifesto, negli
import SDK o nell'artefatto pubblicato.

Non tratta i risultati interni di copertura dell'Ispettore Plugin. Se un report completo
contiene codici di manutenzione dello scanner senza indicazioni di correzione per l'autore, questi
sono destinati ai manutentori di OpenClaw anziché agli autori dei Plugin.

Dopo aver applicato una correzione, riesegui:

```bash
clawhub package validate <path-to-plugin>
```

## Risultati rivolti agli autori

| Codice                                  | Inizia qui                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Aggiungi i metadati del pacchetto](/it/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [Aggiungi il blocco openclaw del pacchetto](/it/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [Dichiara i punti di ingresso del pacchetto OpenClaw](/it/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [Pubblica il punto di ingresso dichiarato](/it/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [Completa i metadati di installazione](/it/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Dichiara la compatibilità dell'API Plugin](/it/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [Allinea la versione minima dell'host](/it/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [Allinea le versioni del pacchetto e del manifesto](/it/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [Rimuovi i metadati del pacchetto OpenClaw non supportati](/it/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [Rendi impacchettabile l'artefatto npm](/it/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [Includi i punti di ingresso nell'output di npm pack](/it/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Includi i metadati nell'output di npm pack](/it/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Aggiungi un nome visualizzato al manifesto](/it/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Rimuovi i campi del manifesto non supportati](/it/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Rimuovi le chiavi di contratto non supportate](/it/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [Sostituisci gli import SDK radice](/it/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Rimuovi gli import SDK riservati](/it/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Sostituisci l'accesso all'intero archivio di sessione](/it/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [Sostituisci le scritture dell'intero archivio di sessione](/it/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [Sostituisci gli helper dei percorsi file di sessione](/it/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [Sostituisci le destinazioni file legacy delle trascrizioni](/it/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [Sostituisci gli helper di basso livello delle trascrizioni](/it/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [Sostituisci before_agent_start](/it/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Sposta le variabili di ambiente del provider nei metadati di configurazione](/it/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Replica le variabili di ambiente del canale nei metadati correnti](/it/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Rimuovi i riferimenti agli schemi di manifesto di sicurezza non disponibili](/it/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Rimuovi i file di manifesto di sicurezza non supportati](/it/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Metadati del pacchetto

### package-json-missing

La radice del pacchetto non include `package.json`, quindi ClawHub non può identificare il
pacchetto npm, la versione, i punti di ingresso o i metadati OpenClaw.

- Aggiungi `package.json` con `name`, `version` e `type`.
- Aggiungi un blocco `openclaw` quando il pacchetto distribuisce un Plugin OpenClaw.
- Usa [Creare Plugin](/it/plugins/building-plugins) per un esempio di pacchetto
  minimo e [Manifesto Plugin](/it/plugins/manifest#manifest-versus-packagejson)
  per la separazione tra pacchetto e manifesto.
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

Il pacchetto ha `package.json`, ma non dichiara i metadati del pacchetto
OpenClaw.

- Aggiungi `package.json#openclaw`.
- Includi metadati dei punti di ingresso come `openclaw.extensions` o
  `openclaw.runtimeExtensions`.
- Aggiungi metadati di compatibilità e installazione quando il pacchetto sarà pubblicato o
  installato tramite ClawHub.
- Vedi [campi di package.json che influenzano il rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

I metadati del pacchetto esistono, ma non dichiarano un punto di ingresso runtime
OpenClaw.

- Aggiungi `openclaw.extensions` per i punti di ingresso Plugin nativi.
- Aggiungi `openclaw.runtimeExtensions` quando il pacchetto pubblicato deve caricare JavaScript
  compilato.
- Mantieni tutti i percorsi dei punti di ingresso all'interno della directory del pacchetto.
- Vedi [Punti di ingresso Plugin](/it/plugins/sdk-entrypoints) e
  [campi di package.json che influenzano il rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Il pacchetto dichiara un punto di ingresso OpenClaw, ma il file referenziato manca
dal pacchetto in convalida.

- Controlla ogni percorso in `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` e `openclaw.runtimeSetupEntry`.
- Compila il pacchetto se il punto di ingresso viene generato in `dist`.
- Aggiorna i metadati se il punto di ingresso è stato spostato.
- Vedi [Punti di ingresso Plugin](/it/plugins/sdk-entrypoints).
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub non riesce a determinare come il pacchetto deve essere installato o aggiornato.

- Compila `openclaw.install` con l'origine di installazione supportata, come
  `clawhubSpec`, `npmSpec` o `localPath`.
- Imposta `openclaw.install.defaultChoice` quando è disponibile più di un'origine di installazione.
- Usa `openclaw.install.minHostVersion` per la versione minima dell'host OpenClaw.
- Vedi [campi di package.json che influenzano il rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Il pacchetto non dichiara l'intervallo dell'API Plugin OpenClaw che supporta.

- Aggiungi `openclaw.compat.pluginApi` a `package.json`.
- Usa la versione dell'API Plugin OpenClaw o il limite minimo semver rispetto a cui hai compilato e testato.
- Mantienilo separato dalla versione del pacchetto. La versione del pacchetto descrive il
  rilascio del Plugin; `openclaw.compat.pluginApi` descrive il contratto API dell'host.
- Vedi [campi di package.json che influenzano il rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

La versione minima dell'host del pacchetto non corrisponde ai metadati di versione OpenClaw
rispetto a cui il pacchetto è stato compilato.

- Controlla `openclaw.install.minHostVersion`.
- Controlla eventuali metadati di build OpenClaw nel pacchetto, come la versione OpenClaw
  usata durante il rilascio.
- Allinea la versione minima dell'host all'intervallo di versioni dell'host che il pacchetto
  supporta effettivamente.
- Vedi [campi di package.json che influenzano il rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

La versione del pacchetto e la versione del manifesto Plugin non coincidono.

- Preferisci `package.json#version` come versione di rilascio del pacchetto.
- Se anche `openclaw.plugin.json` ha `version`, aggiornala in modo che corrisponda o rimuovi
  i metadati di versione del manifesto obsoleti quando i metadati del pacchetto sono autorevoli.
- Pubblica una nuova versione del pacchetto dopo aver modificato metadati pubblicati.
- Vedi [Manifesto Plugin](/it/plugins/manifest).
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Il blocco `package.json#openclaw` contiene campi che non sono metadati del pacchetto
OpenClaw supportati.

- Rimuovi campi non supportati come `openclaw.bundle`.
- Mantieni i metadati Plugin nativi in `openclaw.plugin.json`.
- Mantieni i punti di ingresso del pacchetto, la compatibilità, l'installazione, la configurazione e i metadati
  del catalogo nei campi `package.json#openclaw` supportati.
- Vedi [campi di package.json che influenzano il rilevamento](/it/plugins/manifest#packagejson-fields-that-affect-discovery).
- Riesegui `clawhub package validate <path-to-plugin>`.

## Artefatto pubblicato

### package-npm-pack-unavailable

Il pacchetto non può essere impacchettato nell'artefatto che ClawHub ispezionerebbe o
pubblicherebbe.

- Esegui `npm pack --dry-run` dalla radice del pacchetto.
- Correggi metadati del pacchetto non validi, script del ciclo di vita rotti o voci files che
  fanno fallire l'impacchettamento.
- Rimuovi `private: true` se questo pacchetto è destinato alla pubblicazione pubblica.
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Il pacchetto può essere impacchettato, ma l'artefatto impacchettato non include i
file dei punti di ingresso dichiarati in `package.json#openclaw`.

- Esegui `npm pack --dry-run` e ispeziona i file che verrebbero inclusi.
- Compila i punti di ingresso generati prima dell'impacchettamento.
- Aggiorna `files`, `.npmignore` o l'output di build in modo che i punti di ingresso dichiarati siano
  inclusi.
- Vedi [Punti di ingresso Plugin](/it/plugins/sdk-entrypoints).
- Riesegui `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

All'artefatto impacchettato mancano metadati OpenClaw presenti nel tuo pacchetto
sorgente.

- Esegui `npm pack --dry-run` e ispeziona i file di metadati inclusi.
- Assicurati che `package.json` includa il blocco `openclaw` nell'artefatto impacchettato.
- Assicurati che `openclaw.plugin.json` sia incluso quando il pacchetto è un Plugin
  OpenClaw nativo.
- Aggiorna `files` o `.npmignore` in modo che i metadati del pacchetto non siano esclusi.
- Vedi [Creare Plugin](/it/plugins/building-plugins).
- Riesegui `clawhub package validate <path-to-plugin>`.

## Metadati del manifesto

### manifest-name-missing

Il manifest del Plugin nativo non include un nome visualizzato.

- Aggiungi un campo `name` non vuoto a `openclaw.plugin.json`.
- Mantieni `name` leggibile per le persone e mantieni `id` come id macchina stabile.
- Vedi [Manifest del Plugin](/it/plugins/manifest).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Il manifest del Plugin contiene campi di primo livello che OpenClaw non supporta.

- Confronta ciascun campo di primo livello con il
  [riferimento dei campi del manifest](/it/plugins/manifest#top-level-field-reference).
- Rimuovi i campi personalizzati da `openclaw.plugin.json`.
- Sposta i metadati di pacchetto o installazione nei campi `package.json#openclaw`
  supportati invece che nel manifest.
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Il manifest dichiara chiavi non supportate dentro `contracts`.

- Confronta ciascuna chiave sotto `contracts` con il
  [riferimento dei contracts](/it/plugins/manifest#contracts-reference).
- Rimuovi le chiavi di contract non supportate.
- Sposta il comportamento di runtime nel codice di registrazione del Plugin e mantieni `contracts`
  limitato ai metadati statici di proprietà delle capability.
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

## SDK e migrazione della compatibilità

### legacy-root-sdk-import

Il Plugin importa dal barrel SDK root deprecato:
`openclaw/plugin-sdk`.

- Sostituisci gli import dal barrel root con import mirati dai sottopercorsi pubblici.
- Usa `openclaw/plugin-sdk/plugin-entry` per `definePluginEntry`.
- Usa `openclaw/plugin-sdk/channel-core` per gli helper di entry dei canali.
- Usa [Convenzioni di import](/it/plugins/building-plugins#import-conventions) e
  [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths) per trovare l'import più ristretto.
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Il Plugin importa un percorso SDK riservato ai Plugin in bundle o alla compatibilità
interna.

- Sostituisci gli import SDK interni riservati di OpenClaw con sottopercorsi
  `openclaw/plugin-sdk/*` pubblici documentati.
- Se il comportamento non ha un SDK pubblico, mantieni l'helper dentro il tuo pacchetto o
  richiedi un'API pubblica di OpenClaw.
- Usa [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths) e
  [Migrazione SDK](/it/plugins/sdk-migration) per scegliere un import supportato.
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Il Plugin usa ancora l'helper deprecato dell'intero session store
`loadSessionStore`.

- Usa `getSessionEntry(...)` o `listSessionEntries(...)` quando leggi lo stato della sessione.
- Usa `patchSessionEntry(...)` o `upsertSessionEntry(...)` quando scrivi lo stato della sessione.
- Evita di caricare, modificare e salvare l'intero oggetto session store.
- Mantieni `loadSessionStore(...)` solo finché l'intervallo di compatibilità dichiarato
  supporta ancora versioni precedenti di OpenClaw che lo richiedono.
- Vedi [API di runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

Il Plugin usa ancora un helper di scrittura deprecato dell'intero session store, come
`saveSessionStore` o `updateSessionStore`.

- Usa `patchSessionEntry(...)` quando aggiorni campi su una voce di sessione esistente.
- Usa `upsertSessionEntry(...)` quando sostituisci o crei una voce di sessione.
- Evita di caricare, modificare e salvare l'intero oggetto session store.
- Mantieni gli helper di scrittura dell'intero store solo finché l'intervallo di compatibilità dichiarato
  supporta ancora versioni precedenti di OpenClaw che li richiedono.
- Vedi [API di runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

Il Plugin usa ancora helper deprecati per i percorsi dei file di sessione, come
`resolveSessionFilePath` o `resolveAndPersistSessionFile`.

- Usa `getSessionEntry(...)` per leggere i metadati della sessione per agente e identità
  della sessione.
- Usa `patchSessionEntry(...)` o `upsertSessionEntry(...)` per persistere i metadati
  della sessione.
- Usa l'identità della trascrizione o gli helper di destinazione quando il codice prepara
  un'operazione sulla trascrizione.
- Non persistere né dipendere dai percorsi legacy dei file di trascrizione.
- Vedi [API di runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

Il Plugin usa ancora l'helper deprecato per la destinazione del file di trascrizione
`resolveSessionTranscriptLegacyFileTarget`.

- Usa `resolveSessionTranscriptIdentity(...)` quando al codice serve solo l'identità pubblica
  della sessione.
- Usa `resolveSessionTranscriptTarget(...)` quando al codice serve una destinazione strutturata
  per l'operazione sulla trascrizione.
- Evita di leggere o costruire direttamente destinazioni legacy dei file di trascrizione.
- Mantieni l'helper legacy solo finché l'intervallo di compatibilità dichiarato supporta ancora
  versioni precedenti di OpenClaw che lo richiedono.
- Vedi [API di runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

Il Plugin usa ancora helper di basso livello deprecati per le trascrizioni, come
`appendSessionTranscriptMessage` o `emitSessionTranscriptUpdate`.

- Usa `appendSessionTranscriptMessageByIdentity(...)` per aggiungere messaggi alla trascrizione.
- Usa `publishSessionTranscriptUpdateByIdentity(...)` per le notifiche di aggiornamento della trascrizione.
- Preferisci la superficie runtime strutturata per le trascrizioni, così OpenClaw può applicare
  i corretti confini di transazione e la gestione dell'identità.
- Mantieni gli helper di basso livello per le trascrizioni solo finché l'intervallo di compatibilità dichiarato
  supporta ancora versioni precedenti di OpenClaw che li richiedono.
- Vedi [API di runtime](/it/plugins/sdk-runtime#agent-session-state) e
  [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths).
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Il Plugin usa ancora l'hook legacy `before_agent_start`.

- Sposta il lavoro di override del modello o del provider in `before_model_resolve`.
- Sposta il lavoro di modifica di prompt o contesto in `before_prompt_build`.
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

Il manifest usa metadati legacy o precedenti delle variabili d'ambiente del canale senza gli attuali
metadati di setup o configurazione attesi da ClawHub.

- Mantieni dichiarativi i metadati delle variabili d'ambiente del canale, così OpenClaw può ispezionare lo stato di setup
  senza caricare il runtime del canale.
- Replica il setup del canale guidato da variabili d'ambiente negli attuali metadati di setup, configurazione del canale o
  pacchetto canale usati dalla forma del tuo Plugin.
- Mantieni `channelEnvVars` solo come metadati di compatibilità finché versioni precedenti supportate di
  OpenClaw lo richiedono ancora.
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
  README finché non esiste il contratto del manifest.
- Esegui di nuovo `clawhub package validate <path-to-plugin>`.

## Correlati

- [CLI ClawHub](/it/clawhub/cli)
- [Pubblicazione ClawHub](/it/clawhub/publishing)
- [Creazione di Plugin](/it/plugins/building-plugins)
- [Manifest del Plugin](/it/plugins/manifest)
- [Entry point dei Plugin](/it/plugins/sdk-entrypoints)
- [Compatibilità dei Plugin](/it/plugins/compatibility)
