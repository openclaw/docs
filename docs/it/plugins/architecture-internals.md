---
read_when:
    - Implementazione degli hook di runtime del provider, del ciclo di vita del canale o dei pacchetti di pacchetti
    - Debug dell'ordine di caricamento dei Plugin o dello stato del registro
    - Aggiunta di una nuova funzionalità Plugin o di un Plugin per il motore di contesto
summary: 'Meccanismi interni dell''architettura dei Plugin: pipeline di caricamento, registro, hook di runtime, route HTTP e tabelle di riferimento'
title: Dettagli interni dell'architettura dei Plugin
x-i18n:
    generated_at: "2026-07-12T07:14:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fe5b7f34c638da40b43c24da9425ecdeb9ce7381e233b3ebdd5cc95276ba04f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Per il modello pubblico delle funzionalità, le forme dei plugin e i contratti di proprietà/esecuzione, consulta [Architettura dei plugin](/it/plugins/architecture). Questa pagina tratta i meccanismi interni: pipeline di caricamento, registro, hook di runtime, route HTTP del Gateway, percorsi di importazione e tabelle degli schemi.

## Pipeline di caricamento

All'avvio, OpenClaw esegue approssimativamente queste operazioni:

1. individua le radici dei plugin candidati
2. legge i manifest dei bundle nativi o compatibili e i metadati dei pacchetti
3. rifiuta i candidati non sicuri
4. normalizza la configurazione dei plugin (`plugins.enabled`, `allow`, `deny`, `entries`, `slots`, `load.paths`)
5. determina l'abilitazione di ciascun candidato
6. carica i moduli nativi abilitati: i moduli inclusi compilati usano un caricatore nativo; il codice sorgente TypeScript locale di terze parti usa Jiti come soluzione di emergenza
7. chiama gli hook nativi `register(api)` e raccoglie le registrazioni nel registro dei plugin
8. espone il registro ai comandi e alle superfici di runtime

<Note>
`activate` è un alias legacy di `register`: il caricatore risolve quello presente (`def.register ?? def.activate`) e lo chiama nello stesso punto. Tutti i plugin inclusi usano `register`; preferisci `register` per i nuovi plugin.
</Note>

I controlli di sicurezza vengono eseguiti **prima** dell'esecuzione del runtime. Il rilevamento blocca un candidato quando:

- il relativo punto di ingresso risolto esce dalla radice del plugin
- il relativo percorso (o la directory radice) è scrivibile da tutti
- per i plugin non inclusi, il proprietario del percorso non corrisponde all'uid corrente (o a root)

Per le directory incluse scrivibili da tutti viene prima tentata una correzione `chmod` sul posto (le installazioni npm/globali possono distribuire directory dei pacchetti con permessi `0777`), quindi il controllo viene rieseguito; i controlli di proprietà vengono completamente ignorati per l'origine inclusa.

I candidati bloccati mantengono comunque l'id del plugin nella diagnostica emessa quando è noto (inclusi gli id risolti da un manifest all'interno di una directory altrimenti rifiutata), quindi una configurazione che fa riferimento a tale id vede un plugin bloccato associato a un avviso sulla sicurezza del percorso, anziché un errore non correlato di "plugin sconosciuto".

### Comportamento basato anzitutto sul manifest

Il manifest è la fonte autorevole del piano di controllo. OpenClaw lo usa per:

- identificare il plugin
- individuare canali/Skills/schema di configurazione o funzionalità del bundle dichiarati
- convalidare `plugins.entries.<id>.config`
- arricchire etichette e segnaposto dell'interfaccia di controllo
- mostrare i metadati di installazione/catalogo
- conservare descrittori di attivazione e configurazione economici senza caricare il runtime del plugin

Per i plugin nativi, il modulo di runtime costituisce la parte del piano dati. Registra il comportamento effettivo, come hook, strumenti, comandi o flussi dei provider.

I blocchi facoltativi `activation` e `setup` del manifest rimangono sul piano di controllo. Sono descrittori costituiti esclusivamente da metadati per la pianificazione dell'attivazione e il rilevamento della configurazione; non sostituiscono la registrazione di runtime, `register(...)` o `setupEntry`. I consumer dell'attivazione in tempo reale usano i suggerimenti del manifest relativi a comandi, canali e provider per restringere il caricamento dei plugin prima della materializzazione più ampia del registro:

- il caricamento della CLI viene ristretto ai plugin proprietari del comando primario richiesto
- la configurazione del canale/risoluzione del plugin viene ristretta ai plugin proprietari dell'id del canale richiesto
- la configurazione/risoluzione di runtime esplicita del provider viene ristretta ai plugin proprietari dell'id del provider richiesto
- la pianificazione dell'avvio del Gateway usa `activation.onStartup` per le importazioni esplicite all'avvio; i plugin senza metadati di avvio vengono caricati solo tramite trigger di attivazione più specifici

Il pianificatore dell'attivazione espone sia un'API composta solo da id per i chiamanti esistenti, sia un'API del piano per la diagnostica. Le voci del piano indicano perché è stato selezionato un plugin, distinguendo i suggerimenti espliciti `activation.*` dal ripiego sulla proprietà del manifest:

| Motivo (dai suggerimenti `activation.*`) | Motivo (dalla proprietà del manifest)                                                        |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| `activation-agent-harness-hint`          | —                                                                                            |
| `activation-capability-hint`             | —                                                                                            |
| `activation-channel-hint`                | `manifest-channel-owner` (`channels`)                                                        |
| `activation-command-hint`                | `manifest-command-alias` (`commandAliases`)                                                  |
| `activation-provider-hint`               | `manifest-provider-owner` (`providers`), `manifest-setup-provider-owner` (`setup.providers`) |
| `activation-route-hint`                  | —                                                                                            |
| — (il trigger dell'hook non ha una variante di suggerimento) | `manifest-hook-owner` (`hooks`), `manifest-tool-contract` (`contracts.tools`)                |

Questa separazione dei motivi costituisce il confine di compatibilità: i metadati esistenti dei plugin continuano a funzionare, mentre il nuovo codice può rilevare suggerimenti generici o comportamenti di ripiego senza modificare la semantica di caricamento del runtime.

I precaricamenti del runtime eseguiti al momento della richiesta che richiedono l'ambito generale `all` derivano comunque un insieme esplicito di id plugin effettivi dalla configurazione, dalla pianificazione dell'avvio, dai canali configurati, dagli slot e dalle regole di abilitazione automatica (`resolveEffectivePluginIds` in `src/plugins/effective-plugin-ids.ts`). Se l'insieme derivato è vuoto, OpenClaw mantiene vuoto l'ambito anziché ampliarlo a ogni plugin individuabile.

Il rilevamento della configurazione preferisce id di proprietà dei descrittori, come `setup.providers` e `setup.cliBackends`, per restringere i plugin candidati prima di ricorrere a `setup-api` per i plugin che richiedono ancora hook di runtime durante la configurazione. Gli elenchi di configurazione dei provider usano `providerAuthChoices` del manifest, le opzioni di configurazione derivate dai descrittori e i metadati del catalogo di installazione senza caricare il runtime del provider. Un valore esplicito `setup.requiresRuntime: false` interrompe il processo limitandolo ai descrittori; se `requiresRuntime` viene omesso, viene mantenuto il ripiego legacy su setup-api per compatibilità. Se più plugin rilevati rivendicano lo stesso id normalizzato di provider di configurazione o backend CLI, la ricerca della configurazione rifiuta il proprietario ambiguo anziché affidarsi all'ordine di rilevamento. Quando il runtime di configurazione viene effettivamente eseguito, la diagnostica del registro segnala le divergenze tra `setup.providers` / `setup.cliBackends` e i provider o backend CLI effettivamente registrati da setup-api, senza bloccare i plugin legacy.

### Confine della cache dei plugin

OpenClaw non memorizza nella cache i risultati del rilevamento dei plugin o i dati diretti del registro dei manifest dietro finestre temporali. Le installazioni, le modifiche ai manifest e le variazioni dei percorsi di caricamento devono diventare visibili alla successiva lettura esplicita dei metadati o ricostruzione dell'istantanea. Il parser dei file manifest mantiene una cache limitata delle firme dei file, indicizzata tramite il percorso del manifest aperto insieme a dispositivo/inode, dimensione e mtime/ctime; tale cache evita soltanto di analizzare nuovamente byte invariati e non deve memorizzare nella cache risposte relative a rilevamento, registro, proprietario o criteri.

Il percorso rapido sicuro per i metadati è la proprietà esplicita degli oggetti, non una cache nascosta. I percorsi critici di avvio del Gateway devono passare lungo la catena di chiamate il `PluginMetadataSnapshot` corrente, la `PluginLookUpTable` derivata o un registro esplicito dei manifest. La convalida della configurazione, l'abilitazione automatica all'avvio, il bootstrap dei plugin e la selezione dei provider possono riutilizzare tali oggetti finché rappresentano la configurazione e l'inventario dei plugin correnti. La ricerca della configurazione ricostruisce comunque i metadati del manifest su richiesta, a meno che lo specifico percorso di configurazione non riceva un registro esplicito dei manifest; mantieni questo comportamento come ripiego per i percorsi non critici anziché aggiungere cache di ricerca nascoste. Quando l'input cambia, ricostruisci e sostituisci l'istantanea anziché modificarla o conservarne copie storiche. Le viste sul registro dei plugin attivi e gli helper di bootstrap dei canali inclusi devono essere ricalcolati dal registro/dalla radice correnti. Le mappe di breve durata sono accettabili all'interno di una singola chiamata per deduplicare il lavoro o impedire il rientro; non devono trasformarsi in cache dei metadati di processo.

Per il caricamento dei plugin, il livello di cache persistente è il caricamento del runtime. Può riutilizzare lo stato del caricatore quando il codice o gli artefatti installati vengono effettivamente caricati, ad esempio:

- `PluginLoaderCacheState` e registri di runtime attivi compatibili
- cache jiti/dei moduli e cache dei caricatori delle superfici pubbliche usate per evitare di importare ripetutamente la stessa superficie di runtime
- cache del file system per gli artefatti dei plugin installati
- mappe di breve durata per chiamata destinate alla normalizzazione dei percorsi o alla risoluzione dei duplicati

Queste cache sono dettagli implementativi del piano dati. Non devono rispondere a domande del piano di controllo come "quale plugin possiede questo provider?", a meno che il chiamante non abbia richiesto intenzionalmente il caricamento del runtime.

Non aggiungere cache persistenti o basate su finestre temporali per:

- risultati del rilevamento
- registri diretti dei manifest
- registri dei manifest ricostruiti dall'indice dei plugin installati
- ricerca del proprietario del provider, soppressione dei modelli, criteri dei provider o metadati degli artefatti pubblici
- qualsiasi altra risposta derivata dal manifest per la quale una modifica al manifest, all'indice installato o al percorso di caricamento debba essere visibile alla successiva lettura dei metadati

I chiamanti che ricostruiscono i metadati del manifest dall'indice persistente dei plugin installati ricostruiscono tale registro su richiesta. L'indice installato è uno stato durevole del piano sorgente; non è una cache nascosta dei metadati nel processo.

## Modello del registro

I plugin caricati non modificano direttamente variabili globali arbitrarie del core. Si registrano in un registro centrale dei plugin (`PluginRegistry` in `src/plugins/registry-types.ts`), che tiene traccia dei record dei plugin (identità, sorgente, origine, stato, diagnostica) e degli array per ogni funzionalità: strumenti, hook legacy e hook tipizzati, canali, provider, gestori RPC del Gateway, route HTTP, registratori CLI, servizi in background, comandi di proprietà dei plugin e decine di altre famiglie tipizzate di provider (sintesi vocale, incorporamenti, generazione di immagini/video/musica, recupero/ricerca sul web, infrastrutture degli agenti, azioni di sessione e così via).

Le funzionalità del core leggono quindi da tale registro anziché comunicare direttamente con i moduli dei plugin. Ciò mantiene il caricamento unidirezionale:

- modulo del plugin -> registrazione nel registro
- runtime del core -> utilizzo del registro

Questa separazione è importante per la manutenibilità. Significa che la maggior parte delle superfici del core richiede un solo punto di integrazione: "leggere il registro", non "gestire come caso speciale ogni modulo dei plugin".

## Callback di associazione delle conversazioni

I plugin che associano una conversazione possono reagire quando viene risolta un'approvazione.

Usa `api.onConversationBindingResolved(...)` per ricevere un callback dopo l'approvazione o il rifiuto di una richiesta di associazione:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Campi del payload del callback:

- `status`: `"approved"` o `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` o `"deny"`
- `binding`: l'associazione risolta per le richieste approvate
- `request`: il riepilogo della richiesta originale, il suggerimento di scollegamento, l'id del mittente e i metadati della conversazione

Questo callback ha esclusivamente funzione di notifica. Non modifica chi è autorizzato ad associare una conversazione e viene eseguito dopo il completamento della gestione dell'approvazione da parte del core.

## Hook di runtime dei provider

I plugin dei provider presentano tre livelli:

- **Metadati del manifest** per ricerche economiche prima del runtime: `setup.providers[].envVars`, la compatibilità deprecata `providerAuthEnvVars`, `providerAuthAliases`, `providerAuthChoices` e `channelEnvVars`.
- **Hook in fase di configurazione**: `catalog` (`discovery` legacy) insieme ad `applyConfigDefaults`.
- **Hook di runtime**: oltre 40 hook facoltativi relativi ad autenticazione, risoluzione dei modelli, wrapping dei flussi, livelli di ragionamento, criteri di riproduzione ed endpoint di utilizzo. Consulta [Ordine e utilizzo degli hook](#hook-order-and-usage).

OpenClaw mantiene comunque la proprietà del ciclo generico dell'agente, del failover, della gestione delle trascrizioni e dei criteri degli strumenti. Questi hook costituiscono la superficie di estensione per il comportamento specifico dei provider senza richiedere un intero trasporto di inferenza personalizzato.

Usa il manifest `setup.providers[].envVars` quando il provider dispone di
credenziali basate su variabili d'ambiente che i percorsi generici di
autenticazione/stato/selezione del modello devono poter rilevare senza caricare
il runtime del plugin. Il deprecato `providerAuthEnvVars` viene ancora letto
dall'adattatore di compatibilità durante il periodo di deprecazione e i plugin
non inclusi nel bundle che lo usano ricevono una diagnostica del manifest. Usa
il manifest `providerAuthAliases` quando un ID provider deve riutilizzare le
variabili d'ambiente, i profili di autenticazione, l'autenticazione basata sulla
configurazione e la scelta di onboarding per la chiave API di un altro ID
provider. Usa il manifest `providerAuthChoices` quando le interfacce CLI per
l'onboarding e la scelta dell'autenticazione devono conoscere l'ID della scelta
del provider, le etichette dei gruppi e il semplice collegamento
dell'autenticazione tramite un singolo flag, senza caricare il runtime del
provider. Mantieni le `envVars` del runtime del provider per i suggerimenti
destinati agli operatori, come le etichette di onboarding o le variabili di
configurazione dell'ID client e del segreto client OAuth.

Usa il manifest `channelEnvVars` quando un canale dispone di autenticazione o
configurazione basata su variabili d'ambiente che il fallback generico
dell'ambiente della shell, i controlli di configurazione/stato o le richieste di
configurazione devono poter rilevare senza caricare il runtime del canale.

### Ordine e utilizzo degli hook

Per i plugin di modelli/provider, OpenClaw chiama gli hook approssimativamente
in quest'ordine. La colonna "Quando usarlo" è una guida rapida per la decisione.
I campi del provider destinati esclusivamente alla compatibilità che OpenClaw
non chiama più, come `ProviderPlugin.capabilities` e `suppressBuiltInModel`,
sono intenzionalmente esclusi da questo elenco.

| Hook                              | Cosa fa                                                                                                                        | Quando usarlo                                                                                                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | Pubblica la configurazione del provider in `models.providers` durante la generazione di `models.json`                          | Il provider gestisce un catalogo o i valori predefiniti dell'URL di base                                                                                                        |
| `applyConfigDefaults`             | Applica i valori predefiniti della configurazione globale gestiti dal provider durante la materializzazione della configurazione | I valori predefiniti dipendono dalla modalità di autenticazione, dall'ambiente o dalla semantica della famiglia di modelli del provider                                          |
| _(ricerca del modello integrata)_ | OpenClaw prova prima il normale percorso del registro/catalogo                                                                 | _(non è un hook del plugin)_                                                                                                                                                    |
| `normalizeModelId`                | Normalizza gli alias legacy o di anteprima degli ID modello prima della ricerca                                                 | Il provider gestisce la pulizia degli alias prima della risoluzione canonica del modello                                                                                         |
| `normalizeTransport`              | Normalizza `api` / `baseUrl` della famiglia del provider prima dell'assemblaggio generico del modello                          | Il provider gestisce la pulizia del trasporto per gli ID provider personalizzati appartenenti alla stessa famiglia di trasporto                                                  |
| `normalizeConfig`                 | Normalizza `models.providers.<id>` prima della risoluzione in fase di esecuzione/del provider                                   | Il provider richiede una pulizia della configurazione che deve risiedere nel plugin; gli helper integrati della famiglia Google supportano inoltre le voci di configurazione Google compatibili |
| `applyNativeStreamingUsageCompat` | Applica ai provider della configurazione le riscritture di compatibilità native per l'utilizzo in streaming                    | Il provider richiede correzioni dei metadati nativi sull'utilizzo in streaming determinate dall'endpoint                                                                        |
| `resolveConfigApiKey`             | Risolve l'autenticazione tramite marcatore di ambiente per i provider della configurazione prima del caricamento dell'autenticazione in fase di esecuzione | I provider espongono i propri hook per la risoluzione delle chiavi API tramite marcatori di ambiente                                                                             |
| `resolveSyntheticAuth`            | Espone l'autenticazione locale/self-hosted o basata sulla configurazione senza salvare testo in chiaro                          | Il provider può operare con un marcatore di credenziale sintetico/locale                                                                                                        |
| `resolveExternalAuthProfiles`     | Sovrappone i profili di autenticazione esterni gestiti dal provider; il valore predefinito di `persistence` è `runtime-only` per le credenziali gestite dalla CLI/app | Il provider riutilizza credenziali di autenticazione esterne senza salvare i token di aggiornamento copiati; dichiarare `contracts.externalAuthProviders` nel manifest           |
| `shouldDeferSyntheticProfileAuth` | Assegna una precedenza inferiore ai segnaposto dei profili sintetici salvati rispetto all'autenticazione basata su ambiente/configurazione | Il provider salva profili segnaposto sintetici che non devono avere la precedenza                                                                                                |
| `resolveDynamicModel`             | Fallback sincrono per gli ID modello gestiti dal provider non ancora presenti nel registro locale                              | Il provider accetta ID modello upstream arbitrari                                                                                                                               |
| `prepareDynamicModel`             | Riscaldamento asincrono, quindi nuova esecuzione di `resolveDynamicModel`                                                       | Il provider richiede metadati di rete prima di risolvere ID sconosciuti                                                                                                         |
| `normalizeResolvedModel`          | Riscrittura finale prima che il runner incorporato utilizzi il modello risolto                                                 | Il provider richiede riscritture del trasporto, ma utilizza comunque un trasporto core                                                                                          |
| `normalizeToolSchemas`            | Normalizza gli schemi degli strumenti prima che siano elaborati dal runner incorporato                                         | Il provider richiede la pulizia degli schemi della famiglia di trasporto                                                                                                        |
| `inspectToolSchemas`              | Espone la diagnostica degli schemi gestita dal provider dopo la normalizzazione                                                 | Il provider vuole avvisi sulle parole chiave senza introdurre nel core regole specifiche del provider                                                                           |
| `resolveReasoningOutputMode`      | Seleziona il contratto di output del ragionamento nativo o con tag                                                              | Il provider richiede un output del ragionamento/finale con tag anziché campi nativi                                                                                              |
| `prepareExtraParams`              | Normalizzazione dei parametri della richiesta prima dei wrapper generici delle opzioni di streaming                            | Il provider richiede parametri di richiesta predefiniti o la pulizia dei parametri specifica per provider                                                                       |
| `createStreamFn`                  | Sostituisce completamente il normale percorso di streaming con un trasporto personalizzato                                     | Il provider richiede un protocollo su cavo personalizzato, non un semplice wrapper                                                                                              |
| `wrapStreamFn`                    | Wrapper dello streaming dopo l'applicazione dei wrapper generici                                                               | Il provider richiede wrapper di compatibilità per intestazioni/corpo/modello della richiesta senza un trasporto personalizzato                                                   |
| `resolveTransportTurnState`       | Collega intestazioni o metadati di trasporto nativi per ciascun turno                                                          | Il provider vuole che i trasporti generici inviino l'identità del turno nativa del provider                                                                                     |
| `resolveWebSocketSessionPolicy`   | Collega intestazioni WebSocket native o criteri di attesa della sessione                                                       | Il provider vuole che i trasporti WS generici regolino le intestazioni di sessione o i criteri di fallback                                                                       |
| `formatApiKey`                    | Formattatore del profilo di autenticazione: il profilo salvato diventa la stringa `apiKey` in fase di esecuzione                | Il provider salva metadati di autenticazione aggiuntivi e richiede una forma personalizzata del token in fase di esecuzione                                                      |
| `refreshOAuth`                    | Sostituzione dell'aggiornamento OAuth per endpoint di aggiornamento personalizzati o criteri in caso di errore di aggiornamento | Il provider non è compatibile con i meccanismi di aggiornamento condivisi di OpenClaw                                                                                           |
| `buildAuthDoctorHint`             | Suggerimento di riparazione aggiunto quando l'aggiornamento OAuth non riesce                                                   | Il provider richiede indicazioni di riparazione dell'autenticazione gestite dal provider dopo un errore di aggiornamento                                                         |
| `matchesContextOverflowError`     | Rilevatore gestito dal provider per il superamento della finestra di contesto                                                  | Il provider restituisce errori grezzi di overflow che le euristiche generiche non rileverebbero                                                                                 |
| `classifyFailoverReason`          | Classificazione del motivo del failover gestita dal provider                                                                   | Il provider può associare gli errori grezzi dell'API/del trasporto a limite di frequenza, sovraccarico e così via                                                               |
| `isCacheTtlEligible`              | Criteri della cache dei prompt per provider proxy/backhaul                                                                     | Il provider richiede condizioni specifiche del proxy per il TTL della cache                                                                                                     |
| `buildMissingAuthMessage`         | Sostituisce il messaggio generico di ripristino per autenticazione mancante                                                    | Il provider richiede un suggerimento specifico per il ripristino in caso di autenticazione mancante                                                                             |
| `augmentModelCatalog`             | Righe di catalogo sintetiche/finali aggiunte dopo il rilevamento (deprecato, vedere sotto)                                     | Il provider richiede righe sintetiche per la compatibilità futura in `models list` e nei selettori                                                                               |
| `resolveThinkingProfile`          | Insieme dei livelli `/think` specifici del modello, etichette visualizzate e valore predefinito                                | Il provider espone una scala di ragionamento personalizzata o un'etichetta binaria per i modelli selezionati                                                                     |
| `isBinaryThinking`                | Hook di compatibilità per l'attivazione/disattivazione del ragionamento                                                        | Il provider espone solo l'attivazione/disattivazione binaria del ragionamento                                                                                                   |
| `supportsXHighThinking`           | Hook di compatibilità per il supporto del ragionamento `xhigh`                                                                 | Il provider vuole abilitare `xhigh` solo per un sottoinsieme di modelli                                                                                                         |
| `resolveDefaultThinkingLevel`     | Hook di compatibilità per il livello `/think` predefinito                                                                      | Il provider gestisce i criteri predefiniti di `/think` per una famiglia di modelli                                                                                              |
| `isModernModelRef`                | Rilevatore di modelli moderni per i filtri dei profili live e la selezione degli smoke test                                    | Il provider gestisce la corrispondenza dei modelli preferiti per i test live/smoke                                                                                              |
| `prepareRuntimeAuth`              | Scambia una credenziale configurata con il token/la chiave effettivi in fase di esecuzione subito prima dell'inferenza          | Il provider richiede uno scambio di token o una credenziale di richiesta di breve durata                                                                                        |
| `resolveUsageAuth`                | Risolve le credenziali di utilizzo/fatturazione per `/usage` e le relative superfici di stato                                  | Il provider richiede l'analisi personalizzata del token di utilizzo/quota o una credenziale di utilizzo differente                                                              |
| `fetchUsageSnapshot`              | Recupera e normalizza gli snapshot di utilizzo/quota specifici del provider dopo la risoluzione dell'autenticazione             | Il provider richiede un endpoint di utilizzo o un parser del payload specifico del provider                                                                                     |
| `createEmbeddingProvider`         | Crea un adattatore per gli embedding, gestito dal provider, per memoria/ricerca                                                     | Il comportamento degli embedding della memoria appartiene al Plugin del provider                                                                                    |
| `buildReplayPolicy`               | Restituisce una policy di riproduzione che controlla la gestione della trascrizione per il provider                                        | Il provider richiede una policy personalizzata per la trascrizione (ad esempio, la rimozione dei blocchi di ragionamento)                                                               |
| `sanitizeReplayHistory`           | Riscrive la cronologia di riproduzione dopo la pulizia generica della trascrizione                                                        | Il provider richiede riscritture della riproduzione specifiche, oltre agli helper condivisi di Compaction                                                             |
| `validateReplayTurns`             | Esegue la convalida o la riorganizzazione finale dei turni di riproduzione prima dell'esecutore incorporato                                           | Il trasporto del provider richiede una convalida più rigorosa dei turni dopo la pulizia generica                                                                    |
| `onModelSelected`                 | Esegue gli effetti collaterali post-selezione gestiti dal provider                                                                 | Il provider richiede telemetria o stato gestito dal provider quando un modello diventa attivo                                                                  |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` verificano prima il
Plugin del provider corrispondente, quindi proseguono con gli altri Plugin del
provider dotati di hook finché uno non modifica effettivamente l'ID del modello
o il trasporto/la configurazione. In questo modo gli shim di
alias/compatibilità dei provider continuano a funzionare senza che il chiamante
debba sapere quale Plugin incluso gestisce la riscrittura. Se nessun hook del
provider riscrive una voce di configurazione supportata della famiglia Google,
il normalizzatore incluso della configurazione Google applica comunque la
relativa pulizia di compatibilità.

Se il provider richiede un protocollo sul filo completamente personalizzato o
un esecutore di richieste personalizzato, si tratta di una classe di estensione
diversa. Questi hook sono destinati al comportamento dei provider che continua
a essere eseguito nel normale ciclo di inferenza di OpenClaw.

`resolveUsageAuth` decide se OpenClaw deve chiamare `fetchUsageSnapshot` o
ricorrere alla risoluzione generica delle credenziali per le superfici di
utilizzo/stato. Restituisce
`{ token, accountId?, subscriptionType?, rateLimitTier? }` quando il provider
dispone di una credenziale per l'utilizzo (i metadati facoltativi del piano
vengono passati a `fetchUsageSnapshot`), restituisce
`{ handled: true }` quando l'autenticazione per l'utilizzo gestita dal provider
ha elaborato la richiesta e deve impedire il ripiego generico su chiave API/OAuth,
e restituisce `null` o `undefined` quando il provider non ha gestito
l'autenticazione per l'utilizzo.

Dichiarare le credenziali dell'organizzazione o di fatturazione in
`providerUsageAuthEnvVars` del manifest. Ciò consente alle superfici generiche
di rilevamento e rimozione dei segreti di riconoscerle senza renderle candidate
per l'autenticazione dell'inferenza.

### Esempio di provider

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Esempi integrati

I Plugin dei provider inclusi combinano gli hook descritti sopra per adattarsi
alle esigenze di catalogo, autenticazione, ragionamento, riproduzione e utilizzo
di ciascun fornitore. L'insieme autorevole degli hook risiede con ciascun Plugin
in `extensions/`; questa pagina ne illustra le strutture anziché replicarne
l'elenco.

<AccordionGroup>
  <Accordion title="Provider di cataloghi pass-through">
    OpenRouter, Kilocode, Z.AI e xAI registrano `catalog` insieme a
    `resolveDynamicModel` / `prepareDynamicModel`, così possono esporre gli ID
    dei modelli upstream prima del catalogo statico di OpenClaw.
  </Accordion>
  <Accordion title="Provider di endpoint OAuth e di utilizzo">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi e z.ai abbinano
    `prepareRuntimeAuth` o `formatApiKey` a `resolveUsageAuth` +
    `fetchUsageSnapshot` per gestire direttamente lo scambio dei token e
    l'integrazione con `/usage`.
  </Accordion>
  <Accordion title="Famiglie per la riproduzione e la pulizia delle trascrizioni">
    Le famiglie condivise con nome (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) consentono ai provider di
    adottare i criteri delle trascrizioni tramite `buildReplayPolicy`, invece
    di fare in modo che ciascun Plugin reimplementi la pulizia.
  </Accordion>
  <Accordion title="Provider solo catalogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` e
    `volcengine` registrano soltanto `catalog` e usano il ciclo di inferenza
    condiviso.
  </Accordion>
  <Accordion title="Helper di flusso specifici per Anthropic">
    Le intestazioni beta, `/fast` / `serviceTier` e `context1m` risiedono
    nell'interfaccia pubblica `api.ts` / `contract-api.ts` del Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) anziché
    nell'SDK generico.
  </Accordion>
</AccordionGroup>

## Helper di runtime

I Plugin possono accedere a determinati helper del core tramite `api.runtime`.
Per la sintesi vocale:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Note:

- `textToSpeech` restituisce il normale payload di output TTS del core per le superfici di file/note vocali.
- Utilizza la configurazione `messages.tts` e la selezione del provider del core.
- Restituisce un buffer audio PCM e la frequenza di campionamento. I Plugin devono ricampionare/codificare per i provider.
- `listVoices` è facoltativo per ciascun provider. Utilizzarlo per i selettori vocali o i flussi di configurazione gestiti dal fornitore.
- Il core passa una scadenza risolta della richiesta agli hook `listVoices` del provider; le impostazioni di timeout specifiche del provider possono sostituirla.
- Gli elenchi delle voci possono includere metadati più dettagliati, come impostazioni locali, genere e tag di personalità, per selettori consapevoli del provider.
- OpenAI ed ElevenLabs supportano attualmente la telefonia. Microsoft no.

I Plugin possono inoltre registrare provider vocali tramite `api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Note:

- Mantenere nel core i criteri TTS, il ripiego e la consegna delle risposte.
- Utilizzare i provider vocali per il comportamento di sintesi gestito dal fornitore.
- L'input Microsoft legacy `edge` viene normalizzato nell'ID provider `microsoft`.
- Il modello di titolarità preferito è orientato all'azienda: un singolo Plugin
  del fornitore può gestire provider di testo, voce, immagini e contenuti
  multimediali futuri man mano che OpenClaw aggiunge i relativi contratti di
  funzionalità.

Per la comprensione di immagini/audio/video, i Plugin registrano un unico
provider tipizzato di comprensione multimediale anziché un insieme generico di
coppie chiave/valore:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Note:

- Mantenere nel core l'orchestrazione, il ripiego, la configurazione e il collegamento ai canali.
- Mantenere il comportamento del fornitore nel Plugin del provider.
- L'espansione additiva deve rimanere tipizzata: nuovi metodi facoltativi, nuovi
  campi di risultato facoltativi, nuove funzionalità facoltative.
- La generazione video segue già lo stesso schema:
  - il core gestisce il contratto di funzionalità e l'helper di runtime
  - i Plugin dei fornitori registrano `api.registerVideoGenerationProvider(...)`
  - i Plugin di funzionalità/canale utilizzano `api.runtime.videoGeneration.*`

Per gli helper di runtime della comprensione multimediale, i Plugin possono
chiamare:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

const extraction = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
  provider: "codex",
  model: "gpt-5.6-sol",
  input: [
    {
      type: "image",
      buffer: receiptImageBuffer,
      fileName: "receipt.png",
      mime: "image/png",
    },
    { type: "text", text: "Use the printed fields as the source of truth." },
  ],
  instructions: "Return entities and searchable tags.",
  schemaName: "example.evidence",
  jsonSchema: {
    type: "object",
    properties: {
      entities: { type: "array", items: { type: "string" } },
      tags: { type: "array", items: { type: "string" } },
    },
  },
  cfg: api.config,
});
```

Per la trascrizione audio, i Plugin possono utilizzare il runtime di
comprensione multimediale oppure il precedente alias STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Note:

- `api.runtime.mediaUnderstanding.*` è la superficie condivisa preferita per la
  comprensione di immagini/audio/video.
- `extractStructuredWithModel(...)` è l'interfaccia rivolta ai Plugin per
  un'estrazione delimitata, gestita dal provider e basata principalmente sulle
  immagini. Includere almeno un input immagine; gli input testuali forniscono
  contesto supplementare. I Plugin di prodotto gestiscono le proprie route e
  i propri schemi, mentre OpenClaw gestisce il confine provider/runtime.
- Utilizza la configurazione audio della comprensione multimediale del core (`tools.media.audio`) e l'ordine di ripiego dei provider.
- Restituisce `{ text: undefined }` quando non viene prodotto alcun risultato di trascrizione, ad esempio per un input ignorato/non supportato.
- `api.runtime.stt.transcribeAudioFile(...)` rimane disponibile come alias di compatibilità.

I Plugin possono inoltre avviare esecuzioni di sottoagenti in background tramite `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Note:

- `provider` e `model` sono sostituzioni facoltative per singola esecuzione, non modifiche persistenti della sessione.
- OpenClaw rispetta questi campi di sostituzione solo per i chiamanti attendibili.
- Per le esecuzioni di ripiego gestite dai Plugin, gli operatori devono fornire il consenso tramite `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Utilizzare `plugins.entries.<id>.subagent.allowedModels` per limitare i Plugin attendibili a destinazioni canoniche `provider/model` specifiche, oppure `"*"` per consentire esplicitamente qualsiasi destinazione.
- Le esecuzioni dei sottoagenti di Plugin non attendibili continuano a funzionare, ma le richieste di sostituzione vengono rifiutate anziché ricorrere silenziosamente al ripiego.
- Le sessioni dei sottoagenti create dai Plugin vengono contrassegnate con l'ID del Plugin che le ha create. Il ripiego `api.runtime.subagent.deleteSession(...)` può eliminare soltanto tali sessioni di proprietà; l'eliminazione arbitraria delle sessioni richiede comunque una richiesta Gateway con ambito amministrativo.

Per la ricerca web, i Plugin possono utilizzare l'helper di runtime condiviso
anziché accedere direttamente al collegamento degli strumenti dell'agente:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

I Plugin possono inoltre registrare provider di ricerca web tramite
`api.registerWebSearchProvider(...)`.

Note:

- Mantenere nel core la selezione del provider, la risoluzione delle credenziali e la semantica condivisa delle richieste.
- Utilizzare i provider di ricerca web per i trasporti di ricerca specifici del fornitore.
- `api.runtime.webSearch.*` è la superficie condivisa preferita per i Plugin di funzionalità/canale che richiedono il comportamento di ricerca senza dipendere dal wrapper degli strumenti dell'agente.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: genera un'immagine utilizzando la catena configurata di provider per la generazione di immagini.
- `listProviders(...)`: elenca i provider disponibili per la generazione di immagini e le relative funzionalità.

## Route HTTP del Gateway

I Plugin possono esporre endpoint HTTP tramite `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Campi della route:

- `path`: percorso della route nel server HTTP del Gateway.
- `auth`: obbligatorio, `"gateway"` o `"plugin"`. Usa `"gateway"` per richiedere la normale autenticazione del Gateway oppure `"plugin"` per l'autenticazione o la verifica dei Webhook gestita dal Plugin.
- `match`: facoltativo. `"exact"` (valore predefinito) o `"prefix"`.
- `handleUpgrade`: gestore facoltativo per le richieste di upgrade WebSocket sulla stessa route.
- `replaceExisting`: facoltativo. Consente allo stesso Plugin di sostituire la registrazione della propria route esistente.
- `handler`: restituisce `true` quando la route ha gestito la richiesta.

Note:

- `api.registerHttpHandler(...)` è stato rimosso e causerà un errore di caricamento del Plugin. Usa invece `api.registerHttpRoute(...)`.
- Le route dei Plugin devono dichiarare esplicitamente `auth`.
- I conflitti esatti tra `path + match` vengono rifiutati, a meno che non sia impostato `replaceExisting: true`, e un Plugin non può sostituire la route di un altro Plugin.
- Le route sovrapposte con livelli `auth` diversi vengono rifiutate. Mantieni le catene di ripiego `exact`/`prefix` esclusivamente sullo stesso livello di autenticazione.
- Le route con `auth: "plugin"` **non** ricevono automaticamente gli ambiti di runtime dell'operatore. Sono destinate ai Webhook e alla verifica delle firme gestiti dal Plugin, non alle chiamate privilegiate agli helper del Gateway.
- Le route con `auth: "gateway"` vengono eseguite all'interno dell'ambito di runtime di una richiesta del Gateway. La superficie predefinita (`gatewayRuntimeScopeSurface: "write-default"`) è intenzionalmente prudente:
  - l'autenticazione bearer con segreto condiviso (`gateway.auth.mode = "token"` / `"password"`) e qualsiasi metodo di autenticazione diverso da proxy attendibile ricevono un unico ambito `operator.write`, anche se il chiamante invia `x-openclaw-scopes`
  - anche i chiamanti `trusted-proxy` senza un header `x-openclaw-scopes` esplicito mantengono la superficie precedente limitata a `operator.write`
  - i chiamanti `trusted-proxy` che inviano `x-openclaw-scopes` ricevono invece gli ambiti dichiarati
  - una route può scegliere `gatewayRuntimeScopeSurface: "trusted-operator"` per rispettare sempre `x-openclaw-scopes` nelle modalità di autenticazione associate a un'identità, usando come ripiego l'insieme completo degli ambiti predefiniti della CLI quando l'header è assente
- Regola pratica: non presumere che una route di Plugin autenticata tramite Gateway sia implicitamente una superficie amministrativa. Se la route richiede un comportamento riservato agli amministratori, scegli la superficie degli ambiti `trusted-operator`, richiedi una modalità di autenticazione associata a un'identità e documenta il contratto esplicito dell'header `x-openclaw-scopes`.
- Dopo la corrispondenza della route e l'autenticazione, i normali gestori partecipano all'ammissione del lavoro radice del Gateway. Un Gateway in fase di preparazione o riavvio restituisce `503` prima di invocare il gestore. La limitata eccezione è una route con `auth: "gateway"`, autorizzata dal manifesto, che sceglie anche la superficie `trusted-operator` specifica della route; questa rimane raggiungibile per evitare che l'invio dei controlli di sospensione resti bloccato, mentre le normali route affini dello stesso Plugin rimangono dietro il limite di ammissione. La proprietà WebSocket di `handleUpgrade` usa lo stesso limite di ammissione atomico; dopo che il gestore accetta un socket, il successivo ciclo di vita del socket appartiene al Plugin e non viene monitorato da questo limite.

## Percorsi di importazione dell'SDK dei Plugin

Quando crei nuovi Plugin, usa i sottopercorsi specifici dell'SDK invece del barrel radice monolitico `openclaw/plugin-sdk`. Sottopercorsi principali:

| Sottopercorso                        | Scopo                                              |
| ------------------------------------ | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`   | Primitive per la registrazione dei Plugin          |
| `openclaw/plugin-sdk/channel-core`   | Helper per l'ingresso e la creazione dei canali    |
| `openclaw/plugin-sdk/core`           | Helper condivisi generici e contratto generale     |
| `openclaw/plugin-sdk/config-schema`  | Schema Zod radice di `openclaw.json` (`OpenClawSchema`) |

I Plugin dei canali scelgono da una famiglia di interfacce specifiche: `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` e `channel-actions`. Il comportamento di approvazione dovrebbe essere consolidato
in un unico contratto `approvalCapability`, anziché essere distribuito tra campi
del Plugin non correlati. Consulta [Plugin dei canali](/it/plugins/sdk-channel-plugins).

Gli helper di runtime e configurazione si trovano nei corrispondenti sottopercorsi specifici `*-runtime`
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` e così via). Preferisci `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` e `config-mutation`
al barrel di compatibilità generico `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
le piccole facciate degli helper dei canali, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`
e `openclaw/plugin-sdk/infra-runtime` sono shim di compatibilità deprecati per
i Plugin meno recenti. Il nuovo codice dovrebbe invece importare primitive generiche più specifiche.
</Info>

Punti di ingresso interni al repository (relativi alla radice del pacchetto di ogni Plugin integrato):

- `index.js` — punto di ingresso del Plugin integrato
- `api.js` — barrel di helper e tipi
- `runtime-api.js` — barrel riservato al runtime
- `setup-entry.js` — punto di ingresso del Plugin di configurazione

I Plugin esterni devono importare esclusivamente i sottopercorsi `openclaw/plugin-sdk/*`. Non
importare mai `src/*` del pacchetto di un altro Plugin dal core o da un altro Plugin.
I punti di ingresso caricati tramite facciata preferiscono l'istantanea attiva della configurazione
di runtime, quando esiste, altrimenti usano come ripiego il file di configurazione risolto su disco.

I sottopercorsi specifici per funzionalità, come `image-generation`, `media-understanding`
e `speech`, esistono perché attualmente vengono utilizzati dai Plugin integrati. Non
costituiscono automaticamente contratti esterni stabili a lungo termine: consulta la pagina
di riferimento pertinente dell'SDK prima di farvi affidamento.

## Schemi dello strumento per i messaggi

I Plugin devono gestire i contributi specifici del canale allo schema
`describeMessageTool(...)` per primitive diverse dai messaggi, come reazioni, letture e sondaggi.
La presentazione condivisa per l'invio deve usare il contratto generico `MessagePresentation`
invece dei campi nativi del fornitore per pulsanti, componenti, blocchi o schede.
Consulta [Presentazione dei messaggi](/it/plugins/message-presentation) per il contratto,
le regole di ripiego, la mappatura dei fornitori e l'elenco di controllo per gli autori di Plugin.

I Plugin in grado di inviare dichiarano ciò che possono rappresentare tramite le funzionalità dei messaggi:

- `presentation` per i blocchi di presentazione semantici (`text`, `context`,
  `divider`, `chart`, `table`, `buttons`, `select`)
- `delivery-pin` per le richieste di consegna con elemento fissato

Il core decide se rappresentare la presentazione in modo nativo o degradarla a testo.
Non esporre vie di fuga dell'interfaccia utente native del fornitore dallo strumento generico per i messaggi.
Gli helper SDK deprecati per gli schemi nativi precedenti rimangono esportati per i Plugin
di terze parti esistenti, ma i nuovi Plugin non devono usarli.

## Risoluzione delle destinazioni dei canali

I Plugin dei canali devono gestire la semantica delle destinazioni specifica del canale. Mantieni generico
l'host condiviso per i messaggi in uscita e usa la superficie dell'adattatore di messaggistica per le regole del fornitore:

- `messaging.inferTargetChatType({ to })` decide se una destinazione normalizzata
  deve essere trattata come `direct`, `group` o `channel` prima della ricerca nella directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indica al core se un
  input deve passare direttamente alla risoluzione simile a un identificatore invece che alla ricerca nella directory.
- `messaging.targetResolver.reservedLiterals` elenca le parole isolate che costituiscono
  riferimenti a canali o sessioni per quel fornitore. La risoluzione preserva le voci
  configurate della directory prima di rifiutare i valori letterali riservati, quindi termina in modo sicuro in caso
  di mancata corrispondenza nella directory.
- `messaging.targetResolver.resolveTarget(...)` è il ripiego del Plugin quando
  il core necessita di una risoluzione finale gestita dal fornitore dopo la normalizzazione o dopo una
  mancata corrispondenza nella directory.
- `messaging.resolveOutboundSessionRoute(...)` gestisce la costruzione della route
  di sessione specifica del fornitore dopo la risoluzione di una destinazione.

Suddivisione consigliata:

- Usa `inferTargetChatType` per le decisioni di categoria che devono avvenire prima
  della ricerca tra contatti o gruppi.
- Usa `looksLikeId` per i controlli del tipo "tratta questo valore come identificatore esplicito o nativo della destinazione".
- Usa `resolveTarget` per il ripiego della normalizzazione specifica del fornitore, non per
  una ricerca estesa nella directory.
- Mantieni gli identificatori nativi del fornitore, come identificatori di chat, identificatori di thread, JID, handle e identificatori
  di stanza, nei valori `target` o nei parametri specifici del fornitore, non nei campi generici
  dell'SDK.

## Directory basate sulla configurazione

I Plugin che derivano le voci della directory dalla configurazione devono mantenere questa logica nel
Plugin e riutilizzare gli helper condivisi di
`openclaw/plugin-sdk/directory-runtime`.

Usali quando un canale necessita di contatti o gruppi basati sulla configurazione, ad esempio:

- contatti per messaggi diretti determinati da una lista consentita
- mappe configurate di canali o gruppi
- ripieghi statici della directory limitati all'account

Gli helper condivisi in `directory-runtime` gestiscono esclusivamente operazioni generiche:

- filtraggio delle query
- applicazione dei limiti
- helper di deduplicazione e normalizzazione
- creazione di `ChannelDirectoryEntry[]`

L'ispezione degli account e la normalizzazione degli identificatori specifiche del canale devono rimanere
nell'implementazione del Plugin.

## Cataloghi dei fornitori

I Plugin dei fornitori possono definire cataloghi di modelli per l'inferenza con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` restituisce la stessa struttura che OpenClaw scrive in
`models.providers`:

- `{ provider }` per una singola voce del fornitore
- `{ providers }` per più voci di fornitori

Usa `catalog` quando il Plugin gestisce identificatori di modelli specifici del fornitore, valori
predefiniti dell'URL di base o metadati dei modelli subordinati all'autenticazione.

`catalog.order` controlla quando il catalogo di un Plugin viene unito rispetto ai fornitori
impliciti integrati di OpenClaw:

- `simple`: fornitori basati su una semplice chiave API o su variabili d'ambiente
- `profile`: fornitori che compaiono quando esistono profili di autenticazione
- `paired`: fornitori che sintetizzano più voci correlate
- `late`: ultimo passaggio, dopo gli altri fornitori impliciti

In caso di collisione delle chiavi prevalgono i fornitori successivi, quindi i Plugin possono sostituire
intenzionalmente una voce del fornitore integrata con lo stesso identificatore.

I Plugin possono anche pubblicare righe di modelli in sola lettura tramite
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Questo è il percorso futuro per le superfici di elenco, guida e selezione e supporta
righe `text`, `voice`, `image_generation`, `video_generation` e `music_generation`.
I Plugin dei fornitori continuano a gestire le chiamate agli endpoint in tempo reale, lo scambio dei token e
la mappatura delle risposte del produttore; il core gestisce la struttura comune delle righe, le etichette delle fonti e
la formattazione della guida degli strumenti multimediali. Le registrazioni dei fornitori per la generazione multimediale sintetizzano
automaticamente righe statiche del catalogo da `defaultModel`, `models` e
`capabilities`.

Compatibilità:

- `discovery` continua a funzionare come alias precedente, ma emette un avviso di deprecazione
- se vengono registrati sia `catalog` sia `discovery`, OpenClaw usa `catalog`
  ed emette un avviso
- `augmentModelCatalog` è deprecato; i fornitori integrati devono pubblicare
  righe supplementari tramite `registerModelCatalogProvider`

## Ispezione dei canali in sola lettura

Se il Plugin registra un canale, è preferibile implementare
`plugin.config.inspectAccount(cfg, accountId)` insieme a `resolveAccount(...)`.

Motivazione:

- `resolveAccount(...)` è il percorso di runtime. Può presumere che le credenziali
  siano completamente materializzate e può terminare immediatamente con un errore quando mancano i segreti richiesti.
- I percorsi dei comandi in sola lettura, come `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e i flussi di riparazione
  di doctor o della configurazione, non devono materializzare le credenziali di runtime soltanto per
  descrivere la configurazione.

Comportamento consigliato di `inspectAccount(...)`:

- Restituisce solo lo stato descrittivo dell'account.
- Mantiene `enabled` e `configured`.
- Include i campi relativi all'origine e allo stato delle credenziali quando pertinenti, ad esempio:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Non è necessario restituire i valori grezzi dei token solo per segnalare la disponibilità in sola lettura. Restituire `tokenStatus: "available"` (e il campo di origine corrispondente) è sufficiente per i comandi di stato.
- Usa `configured_unavailable` quando una credenziale è configurata tramite SecretRef ma non è disponibile nel percorso del comando corrente.

Ciò consente ai comandi in sola lettura di segnalare "configurato ma non disponibile nel percorso di questo comando" anziché arrestarsi in modo anomalo o indicare erroneamente che l'account non è configurato.

## Pacchetti di Plugin

Una directory di Plugin può includere un `package.json` con `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Ogni voce diventa un Plugin. Se il pacchetto elenca più estensioni, l'id del Plugin diventa `<manifestOrPackageName>/<fileBase>` (l'id del manifest ha la precedenza quando è presente; altrimenti viene usato il nome senza ambito di `package.json`).

Se il Plugin importa dipendenze npm, installale in tale directory affinché `node_modules` sia disponibile (`npm install` / `pnpm install`).

Misura di sicurezza: ogni voce di `openclaw.extensions` deve rimanere all'interno della directory del Plugin dopo la risoluzione dei collegamenti simbolici. Le voci che escono dalla directory del pacchetto vengono rifiutate.

Nota sulla sicurezza: `openclaw plugins install` installa le dipendenze del Plugin con un comando `npm install --omit=dev --ignore-scripts` locale al progetto (senza script del ciclo di vita e senza dipendenze di sviluppo in fase di esecuzione), ignorando le impostazioni globali di installazione npm ereditate. Mantieni gli alberi delle dipendenze dei Plugin "JS/TS puri" ed evita i pacchetti che richiedono compilazioni `postinstall`.

Facoltativo: `openclaw.setupEntry` può puntare a un modulo leggero destinato esclusivamente alla configurazione. Quando OpenClaw necessita delle superfici di configurazione per un Plugin di canale disabilitato oppure quando un Plugin di canale è abilitato ma non ancora configurato, carica `setupEntry` anziché la voce completa del Plugin. Ciò rende più leggeri l'avvio e la configurazione quando la voce principale del Plugin collega anche strumenti, hook o altro codice destinato esclusivamente alla fase di esecuzione.

Facoltativo: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` può far sì che un Plugin di canale utilizzi lo stesso percorso `setupEntry` durante la fase di avvio precedente all'ascolto del Gateway, anche quando il canale è già configurato.

Usa questa opzione solo quando `setupEntry` copre completamente la superficie di avvio che deve esistere prima che il Gateway inizi l'ascolto. In pratica, ciò significa che la voce di configurazione deve registrare ogni funzionalità di proprietà del canale da cui dipende l'avvio, ad esempio:

- la registrazione del canale stesso
- tutti i percorsi HTTP che devono essere disponibili prima che il Gateway inizi l'ascolto
- tutti i metodi, gli strumenti o i servizi del Gateway che devono esistere durante la stessa finestra temporale

Se la voce completa possiede ancora una funzionalità di avvio necessaria, non abilitare questo flag. Mantieni il comportamento predefinito del Plugin e lascia che OpenClaw carichi la voce completa durante l'avvio.

I canali inclusi possono inoltre pubblicare helper della superficie contrattuale destinati esclusivamente alla configurazione, che il nucleo può consultare prima del caricamento del runtime completo del canale. L'attuale superficie di promozione della configurazione è:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Il nucleo usa questa superficie quando deve promuovere una configurazione legacy di un canale con account singolo in `channels.<id>.accounts.*` senza caricare la voce completa del Plugin. Matrix è l'attuale esempio incluso: quando esistono già account denominati, sposta in un account denominato promosso solo le chiavi di autenticazione/bootstrap e può mantenere una chiave configurata non canonica per l'account predefinito, anziché creare sempre `accounts.default`.

Questi adattatori di patch della configurazione mantengono differita l'individuazione della superficie contrattuale inclusa. Il tempo di importazione rimane ridotto; la superficie di promozione viene caricata solo al primo utilizzo, anziché riattivare l'avvio del canale incluso durante l'importazione del modulo.

Quando queste superfici di avvio includono metodi RPC del Gateway, mantienili sotto un prefisso specifico del Plugin. Gli spazi dei nomi amministrativi del nucleo (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) rimangono riservati e vengono sempre risolti in `operator.admin`, anche se un Plugin richiede un ambito più ristretto.

Esempio:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Metadati del catalogo dei canali

I Plugin di canale possono pubblicizzare i metadati di configurazione/individuazione tramite `openclaw.channel` e i suggerimenti di installazione tramite `openclaw.install`. Ciò evita di inserire dati del catalogo nel nucleo.

Esempio:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Campi utili di `openclaw.channel` oltre all'esempio minimo:

- `detailLabel`: etichetta secondaria per superfici di catalogo/stato più dettagliate
- `docsLabel`: sostituisce il testo del collegamento alla documentazione
- `preferOver`: id di Plugin/canali con priorità inferiore che questa voce di catalogo deve superare
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controlli del testo della superficie di selezione
- `markdownCapable`: contrassegna il canale come compatibile con Markdown per le decisioni sulla formattazione in uscita
- `exposure.configured`: nasconde il canale dalle superfici che elencano i canali configurati quando è impostato su `false`
- `exposure.setup`: nasconde il canale dai selettori interattivi di configurazione quando è impostato su `false`
- `exposure.docs`: contrassegna il canale come interno/privato per le superfici di navigazione della documentazione
- `showConfigured` / `showInSetup`: alias legacy ancora accettati per compatibilità; preferisci `exposure`
- `quickstartAllowFrom`: include il canale nel flusso rapido standard `allowFrom`
- `forceAccountBinding`: richiede un'associazione esplicita dell'account anche quando esiste un solo account
- `preferSessionLookupForAnnounceTarget`: preferisce la ricerca della sessione durante la risoluzione delle destinazioni degli annunci

OpenClaw può inoltre unire **cataloghi di canali esterni** (ad esempio, un'esportazione del registro MPM). Inserisci un file JSON in uno dei seguenti percorsi:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

In alternativa, imposta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) su uno o più file JSON (delimitati da virgole, punti e virgola o `PATH`). Ogni file deve contenere `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Il parser accetta inoltre `"packages"` o `"plugins"` come alias legacy della chiave `"entries"`.

Le voci generate del catalogo dei canali e quelle del catalogo di installazione dei provider espongono informazioni normalizzate sull'origine dell'installazione accanto al blocco grezzo `openclaw.install`. Le informazioni normalizzate indicano se la specifica npm è una versione esatta o un selettore mobile, se sono presenti i metadati di integrità previsti e se è disponibile anche un percorso di origine locale. Quando l'identità del catalogo/pacchetto è nota, le informazioni normalizzate avvisano se il nome del pacchetto npm analizzato diverge da tale identità. Avvisano inoltre quando `defaultChoice` non è valido o punta a un'origine non disponibile e quando sono presenti metadati di integrità npm senza un'origine npm valida. I consumatori devono trattare `installSource` come un campo facoltativo aggiuntivo, affinché le voci create manualmente e gli shim del catalogo non debbano sintetizzarlo.
Ciò consente all'onboarding e alla diagnostica di spiegare lo stato del piano delle origini senza importare il runtime del Plugin.

Le voci npm esterne ufficiali devono preferire un `npmSpec` esatto insieme a `expectedIntegrity`. I semplici nomi di pacchetto e i dist-tag continuano a funzionare per compatibilità, ma mostrano avvisi relativi al piano delle origini, affinché il catalogo possa evolvere verso installazioni con versione bloccata e integrità verificata senza interrompere i Plugin esistenti. Quando l'onboarding esegue l'installazione da un percorso di catalogo locale, registra una voce gestita nell'indice dei Plugin con `source: "path"` e, quando possibile, un `sourcePath` relativo allo spazio di lavoro. Il percorso operativo assoluto di caricamento rimane in `plugins.load.paths`; il record di installazione evita di duplicare i percorsi della postazione locale nella configurazione persistente. Ciò rende le installazioni di sviluppo locali visibili alla diagnostica del piano delle origini senza aggiungere una seconda superficie che esponga percorsi grezzi del file system. La tabella SQLite persistente `installed_plugin_index` è la fonte autorevole per l'origine dell'installazione e può essere aggiornata senza caricare i moduli runtime del Plugin. La relativa mappa `installRecords` persiste anche quando il manifest di un Plugin è mancante o non valido; il relativo payload `plugins` è una vista ricostruibile del manifest.

## Plugin del motore di contesto

I Plugin del motore di contesto gestiscono l'orchestrazione del contesto della sessione per l'acquisizione, l'assemblaggio e la Compaction. Registrali dal Plugin con `api.registerContextEngine(id, factory)`, quindi seleziona il motore attivo con `plugins.slots.contextEngine`.

Usa questa funzionalità quando il Plugin deve sostituire o estendere la pipeline di contesto predefinita, anziché limitarsi ad aggiungere la ricerca in memoria o degli hook.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, sessionKey, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

La factory `ctx` espone i valori facoltativi `config`, `agentDir` e `workspaceDir` per l'inizializzazione al momento della creazione.

`assemble()` può restituire `contextProjection` quando l'harness attivo dispone di un thread persistente nel backend. Omettilo per la proiezione legacy a ogni turno. Restituisci `{ mode: "thread_bootstrap", epoch }` quando il contesto assemblato deve essere inserito una sola volta in un thread del backend e riutilizzato finché l'epoca non cambia. Modifica l'epoca dopo una variazione del contesto semantico del motore, ad esempio dopo un passaggio di Compaction gestito dal motore. Gli host possono mantenere i metadati delle chiamate agli strumenti, la forma dell'input e i risultati oscurati degli strumenti in una proiezione di bootstrap del thread, affinché i nuovi thread del backend conservino la continuità degli strumenti senza copiare payload grezzi contenenti segreti.

Se il motore **non** gestisce l'algoritmo di Compaction, mantieni implementato `compact()` e delegalo esplicitamente:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", (ctx) => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, sessionKey, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Aggiunta di una nuova funzionalità

Quando un plugin necessita di un comportamento non previsto dall'API attuale, non aggirare
il sistema dei plugin accedendo direttamente a elementi privati. Aggiungi la funzionalità mancante.

Sequenza consigliata:

1. **Definisci il contratto del core.** Stabilisci quale comportamento condiviso deve essere gestito dal core:
   criteri, fallback, unione della configurazione, ciclo di vita, semantica rivolta ai canali e
   struttura degli helper di runtime.
2. **Aggiungi superfici tipizzate per la registrazione e il runtime dei plugin.** Estendi
   `OpenClawPluginApi` e/o `api.runtime` con la più piccola superficie tipizzata
   utile per la funzionalità.
3. **Collega il core e i componenti consumer dei canali/delle funzionalità.** I canali e i plugin di funzionalità
   devono utilizzare la nuova funzionalità tramite il core, senza importare direttamente
   un'implementazione specifica di un fornitore.
4. **Registra le implementazioni dei fornitori.** I plugin dei fornitori registrano quindi i propri
   backend per la funzionalità.
5. **Aggiungi la copertura del contratto.** Aggiungi test affinché la titolarità e la struttura della registrazione
   rimangano esplicite nel tempo.

In questo modo OpenClaw mantiene scelte progettuali precise senza essere vincolato
alla visione di un singolo fornitore. Consulta il [ricettario delle funzionalità](/it/plugins/adding-capabilities)
per un elenco di controllo concreto dei file e un esempio completo.

### Elenco di controllo della funzionalità

Quando aggiungi una nuova funzionalità, l'implementazione dovrebbe solitamente interessare insieme queste
superfici:

- tipi del contratto del core in `src/<capability>/types.ts`
- esecutore del core/helper di runtime in `src/<capability>/runtime.ts`
- superficie di registrazione dell'API dei plugin in `src/plugins/types.ts`
- collegamento del registro dei plugin in `src/plugins/registry.ts`
- esposizione del runtime dei plugin in `src/plugins/runtime/*` quando i plugin di funzionalità/canale
  devono utilizzarla
- helper di acquisizione/test in `src/test-utils/plugin-registration.ts`
- asserzioni sulla titolarità/sul contratto in `src/plugins/contracts/registry.ts`
- documentazione per operatori/plugin in `docs/`

Se una di queste superfici manca, in genere significa che la funzionalità
non è ancora completamente integrata.

### Modello di funzionalità

Schema minimo:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Schema del test del contratto (`src/plugins/contracts/registry.ts` espone ricerche della titolarità
come `providerContractPluginIds`; i test verificano che l'elenco
`contracts.videoGenerationProviders` di un plugin corrisponda a ciò che registra effettivamente):

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

Questo mantiene semplice la regola:

- il core gestisce il contratto della funzionalità e l'orchestrazione
- i plugin dei fornitori gestiscono le implementazioni specifiche dei fornitori
- i plugin di funzionalità/canale utilizzano gli helper di runtime
- i test del contratto mantengono esplicita la titolarità

## Argomenti correlati

- [Architettura dei plugin](/it/plugins/architecture) — modello pubblico e strutture delle funzionalità
- [Sottopercorsi dell'SDK dei plugin](/it/plugins/sdk-subpaths)
- [Configurazione dell'SDK dei plugin](/it/plugins/sdk-setup)
- [Creazione di plugin](/it/plugins/building-plugins)
