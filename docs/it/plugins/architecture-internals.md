---
read_when:
    - Implementazione degli hook di runtime dei provider, del ciclo di vita dei canali o dei pack di pacchetti
    - Debug dell'ordine di caricamento dei Plugin o dello stato del registro
    - Aggiunta di una nuova funzionalità Plugin o di un Plugin del motore di contesto
summary: 'Interni dell''architettura dei Plugin: pipeline di caricamento, registro, hook di runtime, route HTTP e tabelle di riferimento'
title: Dettagli interni dell'architettura dei Plugin
x-i18n:
    generated_at: "2026-05-02T20:47:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: fec593518e51f68ce617d5bc4e55cede2188e9247f863364a9ea956e50ca2675
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Per il modello pubblico delle capacità, le forme dei plugin e i contratti di
proprietà/esecuzione, vedi [Architettura dei Plugin](/it/plugins/architecture).
Questa pagina è il riferimento per i meccanismi interni: pipeline di caricamento,
registro, hook di runtime, rotte HTTP del Gateway, percorsi di importazione e
tabelle degli schemi.

## Pipeline di caricamento

All'avvio, OpenClaw fa all'incirca questo:

1. scopre le radici dei plugin candidate
2. legge i manifest dei bundle nativi o compatibili e i metadati del pacchetto
3. rifiuta i candidati non sicuri
4. normalizza la configurazione dei plugin (`plugins.enabled`, `allow`, `deny`,
   `entries`, `slots`, `load.paths`)
5. decide l'abilitazione per ogni candidato
6. carica i moduli nativi abilitati: i moduli bundled compilati usano un
   caricatore nativo; il sorgente locale TypeScript di terze parti usa il
   fallback Jiti di emergenza
7. chiama gli hook nativi `register(api)` e raccoglie le registrazioni nel
   registro dei plugin
8. espone il registro ai comandi e alle superfici di runtime

<Note>
`activate` è un alias legacy di `register`: il caricatore risolve quello presente (`def.register ?? def.activate`) e lo chiama nello stesso punto. Tutti i plugin bundled usano `register`; preferisci `register` per i nuovi plugin.
</Note>

I gate di sicurezza vengono eseguiti **prima** dell'esecuzione del runtime. I
candidati vengono bloccati quando l'entry esce dalla radice del plugin, il
percorso è scrivibile da tutti o la proprietà del percorso appare sospetta per
plugin non bundled.

### Comportamento manifest-first

Il manifest è la fonte di verità del piano di controllo. OpenClaw lo usa per:

- identificare il plugin
- scoprire canali/Skills/schema di configurazione dichiarati o capacità del bundle
- validare `plugins.entries.<id>.config`
- arricchire etichette/segnaposto della Control UI
- mostrare metadati di installazione/catalogo
- preservare descrittori economici di attivazione e configurazione senza caricare il runtime del plugin

Per i plugin nativi, il modulo runtime è la parte del piano dati. Registra il
comportamento effettivo, come hook, strumenti, comandi o flussi di provider.

I blocchi facoltativi `activation` e `setup` del manifest restano nel piano di
controllo. Sono descrittori solo di metadati per la pianificazione
dell'attivazione e la scoperta della configurazione; non sostituiscono la
registrazione runtime, `register(...)` o `setupEntry`. I primi consumer di
attivazione live ora usano suggerimenti di manifest per comandi, canali e
provider per restringere il caricamento dei plugin prima di una materializzazione
più ampia del registro:

- il caricamento CLI si restringe ai plugin che possiedono il comando primario richiesto
- la risoluzione di configurazione/plugin del canale si restringe ai plugin che
  possiedono l'id del canale richiesto
- la risoluzione esplicita di configurazione/runtime del provider si restringe
  ai plugin che possiedono l'id del provider richiesto
- la pianificazione dell'avvio del Gateway usa `activation.onStartup` per importazioni
  esplicite all'avvio e opt-out dall'avvio; i plugin senza metadati di avvio si
  caricano solo tramite trigger di attivazione più ristretti

I preload runtime al momento della richiesta che chiedono l'ambito ampio `all`
derivano comunque un insieme esplicito di id plugin effettivi da configurazione,
pianificazione dell'avvio, canali configurati, slot e regole di auto-abilitazione.
Se l'insieme derivato è vuoto, OpenClaw carica un registro runtime vuoto invece
di allargarsi a ogni plugin rilevabile.

Il pianificatore di attivazione espone sia un'API solo id per i chiamanti esistenti
sia un'API di piano per nuove diagnostiche. Le voci del piano riportano perché
un plugin è stato selezionato, separando i suggerimenti espliciti del pianificatore
`activation.*` dai fallback di proprietà del manifest come `providers`,
`channels`, `commandAliases`, `setup.providers`, `contracts.tools` e hook.
Questa separazione dei motivi è il confine di compatibilità: i metadati dei
plugin esistenti continuano a funzionare, mentre il nuovo codice può rilevare
suggerimenti ampi o comportamento di fallback senza cambiare la semantica del
caricamento runtime.

La scoperta della configurazione ora preferisce id posseduti dai descrittori,
come `setup.providers` e `setup.cliBackends`, per restringere i plugin candidati
prima di fare fallback a `setup-api` per i plugin che richiedono ancora hook
runtime in fase di configurazione. Gli elenchi di configurazione dei provider
usano `providerAuthChoices` del manifest, scelte di configurazione derivate dai
descrittori e metadati del catalogo di installazione senza caricare il runtime
del provider. `setup.requiresRuntime: false` esplicito è un cutoff solo
descrittore; `requiresRuntime` omesso mantiene il fallback legacy setup-api per
compatibilità. Se più di un plugin scoperto dichiara lo stesso id normalizzato di
provider di configurazione o backend CLI, la ricerca di configurazione rifiuta il
proprietario ambiguo invece di affidarsi all'ordine di scoperta. Quando il runtime
di configurazione viene eseguito, la diagnostica del registro segnala divergenze
tra `setup.providers` / `setup.cliBackends` e i provider o backend CLI registrati
da setup-api senza bloccare i plugin legacy.

### Confine della cache dei plugin

OpenClaw non memorizza nella cache i risultati di scoperta dei plugin o i dati
diretti del registro dei manifest dietro finestre temporali wall-clock.
Installazioni, modifiche dei manifest e cambiamenti dei percorsi di caricamento
devono diventare visibili alla successiva lettura esplicita dei metadati o
ricostruzione dello snapshot. Il parser dei file manifest può mantenere una
cache limitata della firma del file basata su percorso del manifest aperto,
inode, dimensione e timestamp; quella cache evita solo di rieseguire il parsing
di byte invariati e non deve memorizzare nella cache risposte di scoperta,
registro, proprietario o policy.

Il percorso rapido sicuro dei metadati è la proprietà esplicita degli oggetti,
non una cache nascosta. I percorsi caldi di avvio del Gateway dovrebbero passare
il `PluginMetadataSnapshot` corrente, la `PluginLookUpTable` derivata o un registro
manifest esplicito lungo la catena di chiamate. Validazione della configurazione,
auto-abilitazione all'avvio, bootstrap dei plugin e selezione dei provider possono
riutilizzare quegli oggetti mentre rappresentano la configurazione corrente e
l'inventario dei plugin. La ricerca di configurazione ricostruisce ancora i
metadati del manifest su richiesta, a meno che il percorso specifico di
configurazione non riceva un registro manifest esplicito; mantienilo come fallback
del percorso freddo invece di aggiungere cache di lookup nascoste. Quando l'input
cambia, ricostruisci e sostituisci lo snapshot invece di mutarlo o mantenere copie
storiche.
Le viste sul registro dei plugin attivo e gli helper di bootstrap dei canali
bundled dovrebbero essere ricalcolati dal registro/root corrente. Mappe di breve
durata vanno bene all'interno di una chiamata per deduplicare il lavoro o
proteggere dal rientro; non devono diventare cache di metadati di processo.

Per il caricamento dei plugin, il livello di cache persistente è il caricamento
runtime. Può riutilizzare lo stato del caricatore quando codice o artefatti
installati sono effettivamente caricati, ad esempio:

- `PluginLoaderCacheState` e registri runtime attivi compatibili
- cache jiti/modulo e cache del caricatore della superficie pubblica usate per
  evitare di importare ripetutamente la stessa superficie runtime
- cache del filesystem per artefatti di plugin installati
- mappe per-chiamata di breve durata per normalizzazione dei percorsi o risoluzione dei duplicati

Queste cache sono dettagli implementativi del piano dati. Non devono rispondere
a domande del piano di controllo come "quale plugin possiede questo provider?",
a meno che il chiamante non abbia deliberatamente chiesto il caricamento runtime.

Non aggiungere cache persistenti o wall-clock per:

- risultati di scoperta
- registri manifest diretti
- registri manifest ricostruiti dall'indice dei plugin installati
- lookup del proprietario del provider, soppressione del modello, policy del provider o metadati
  degli artefatti pubblici
- qualsiasi altra risposta derivata dal manifest in cui un manifest modificato,
  un indice installato o un percorso di caricamento dovrebbe essere visibile alla
  successiva lettura dei metadati

I chiamanti che ricostruiscono i metadati del manifest dall'indice persistito dei
plugin installati ricostruiscono quel registro su richiesta. L'indice installato
è stato durevole del piano sorgente; non è una cache di metadati nascosta in
processo.

## Modello del registro

I plugin caricati non mutano direttamente globali core casuali. Si registrano in
un registro centrale dei plugin.

Il registro tiene traccia di:

- record dei plugin (identità, sorgente, origine, stato, diagnostica)
- strumenti
- hook legacy e hook tipizzati
- canali
- provider
- handler RPC del gateway
- rotte HTTP
- registrar CLI
- servizi in background
- comandi posseduti dai plugin

Le funzionalità core leggono quindi da quel registro invece di parlare
direttamente con i moduli dei plugin. Questo mantiene il caricamento
unidirezionale:

- modulo plugin -> registrazione nel registro
- runtime core -> consumo del registro

Questa separazione è importante per la manutenibilità. Significa che la maggior
parte delle superfici core richiede un solo punto di integrazione: "leggi il
registro", non "gestisci come caso speciale ogni modulo plugin".

## Callback di binding delle conversazioni

I plugin che associano una conversazione possono reagire quando un'approvazione
viene risolta.

Usa `api.onConversationBindingResolved(...)` per ricevere un callback dopo che
una richiesta di binding viene approvata o negata:

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
- `binding`: il binding risolto per le richieste approvate
- `request`: il riepilogo della richiesta originale, suggerimento di detach, id mittente e
  metadati della conversazione

Questo callback è solo una notifica. Non cambia chi è autorizzato ad associare
una conversazione e viene eseguito dopo il completamento della gestione
dell'approvazione core.

## Hook runtime dei provider

I plugin provider hanno tre livelli:

- **Metadati del manifest** per lookup economici prima del runtime:
  `setup.providers[].envVars`, compatibilità deprecata `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` e `channelEnvVars`.
- **Hook in fase di configurazione**: `catalog` (legacy `discovery`) più
  `applyConfigDefaults`.
- **Hook runtime**: oltre 40 hook facoltativi che coprono autenticazione,
  risoluzione dei modelli, wrapping dello stream, livelli di thinking, policy di
  replay ed endpoint di utilizzo. Vedi l'elenco completo in [Ordine e utilizzo degli hook](#hook-order-and-usage).

OpenClaw possiede ancora il loop generico dell'agente, failover, gestione del
transcript e policy degli strumenti. Questi hook sono la superficie di estensione
per comportamento specifico del provider senza richiedere un intero trasporto di
inferenza personalizzato.

Usa `setup.providers[].envVars` del manifest quando il provider ha credenziali
basate su env che i percorsi generici di autenticazione/stato/selettore modelli
dovrebbero vedere senza caricare il runtime del plugin. `providerAuthEnvVars`
deprecato viene ancora letto dall'adattatore di compatibilità durante la finestra
di deprecazione, e i plugin non bundled che lo usano ricevono una diagnostica del
manifest. Usa `providerAuthAliases` del manifest quando un id provider dovrebbe
riutilizzare le variabili env, i profili di autenticazione, l'autenticazione
basata su configurazione e la scelta di onboarding della chiave API di un altro
id provider. Usa `providerAuthChoices` del manifest quando le superfici CLI di
onboarding/scelta di autenticazione dovrebbero conoscere l'id della scelta del
provider, le etichette dei gruppi e un semplice cablaggio di autenticazione a un
flag senza caricare il runtime del provider. Mantieni `envVars` del runtime del
provider per suggerimenti rivolti agli operatori, come etichette di onboarding o
variabili di configurazione OAuth client-id/client-secret.

Usa `channelEnvVars` del manifest quando un canale ha autenticazione o
configurazione guidata da env che fallback generico shell-env, controlli di
configurazione/stato o prompt di configurazione dovrebbero vedere senza caricare
il runtime del canale.

### Ordine e utilizzo degli hook

Per i plugin modello/provider, OpenClaw chiama gli hook in questo ordine
approssimativo. La colonna "Quando usarlo" è la guida rapida alla decisione.
I campi provider solo di compatibilità che OpenClaw non chiama più, come
`ProviderPlugin.capabilities` e `suppressBuiltInModel`, sono intenzionalmente
non elencati qui.

| #   | Hook                              | Cosa fa                                                                                                           | Quando usarlo                                                                                                                                     |
| --- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Pubblica la configurazione del provider in `models.providers` durante la generazione di `models.json`             | Il provider possiede un catalogo o valori predefiniti per l'URL di base                                                                           |
| 2   | `applyConfigDefaults`             | Applica i valori predefiniti della configurazione globale di proprietà del provider durante la materializzazione della configurazione | I valori predefiniti dipendono dalla modalità di autenticazione, dall'ambiente o dalla semantica della famiglia di modelli del provider           |
| --  | _(ricerca modello integrata)_     | OpenClaw prova prima il normale percorso registro/catalogo                                                        | _(non è un hook del plugin)_                                                                                                                      |
| 3   | `normalizeModelId`                | Normalizza gli alias legacy o di anteprima degli ID modello prima della ricerca                                   | Il provider possiede la pulizia degli alias prima della risoluzione canonica del modello                                                          |
| 4   | `normalizeTransport`              | Normalizza `api` / `baseUrl` della famiglia del provider prima dell'assemblaggio generico del modello             | Il provider possiede la pulizia del trasporto per ID provider personalizzati nella stessa famiglia di trasporto                                    |
| 5   | `normalizeConfig`                 | Normalizza `models.providers.<id>` prima della risoluzione runtime/provider                                       | Il provider richiede pulizia della configurazione che deve stare nel plugin; gli helper della famiglia Google inclusi fungono anche da fallback per le voci di configurazione Google supportate |
| 6   | `applyNativeStreamingUsageCompat` | Applica riscritture di compatibilità dell'uso dello streaming nativo ai provider di configurazione                | Il provider richiede correzioni dei metadati di uso dello streaming nativo guidate dall'endpoint                                                   |
| 7   | `resolveConfigApiKey`             | Risolve l'autenticazione con marcatore env per i provider di configurazione prima del caricamento dell'autenticazione runtime | Il provider ha una risoluzione della chiave API con marcatore env di proprietà del provider; anche `amazon-bedrock` ha qui un resolver AWS integrato con marcatore env |
| 8   | `resolveSyntheticAuth`            | Espone autenticazione locale/self-hosted o basata su configurazione senza persistere testo in chiaro              | Il provider può operare con un marcatore di credenziali sintetico/locale                                                                          |
| 9   | `resolveExternalAuthProfiles`     | Sovrappone profili di autenticazione esterni di proprietà del provider; il valore predefinito di `persistence` è `runtime-only` per credenziali di proprietà di CLI/app | Il provider riutilizza credenziali di autenticazione esterne senza persistere token di aggiornamento copiati; dichiara `contracts.externalAuthProviders` nel manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Abbassa la precedenza dei segnaposto dei profili sintetici memorizzati rispetto all'autenticazione basata su env/config | Il provider memorizza profili segnaposto sintetici che non devono avere precedenza                                                                |
| 11  | `resolveDynamicModel`             | Fallback sincrono per ID modello di proprietà del provider non ancora presenti nel registro locale                | Il provider accetta ID modello upstream arbitrari                                                                                                 |
| 12  | `prepareDynamicModel`             | Riscaldamento asincrono, poi `resolveDynamicModel` viene eseguito di nuovo                                       | Il provider richiede metadati di rete prima di risolvere ID sconosciuti                                                                           |
| 13  | `normalizeResolvedModel`          | Riscrittura finale prima che il runner incorporato usi il modello risolto                                        | Il provider richiede riscritture del trasporto ma usa comunque un trasporto core                                                                  |
| 14  | `contributeResolvedModelCompat`   | Contribuisce flag di compatibilità per modelli vendor dietro un altro trasporto compatibile                      | Il provider riconosce i propri modelli su trasporti proxy senza subentrare al provider                                                            |
| 15  | `normalizeToolSchemas`            | Normalizza gli schemi degli strumenti prima che il runner incorporato li veda                                    | Il provider richiede pulizia degli schemi della famiglia di trasporto                                                                             |
| 16  | `inspectToolSchemas`              | Espone diagnostica degli schemi di proprietà del provider dopo la normalizzazione                                | Il provider vuole avvisi sulle parole chiave senza insegnare al core regole specifiche del provider                                               |
| 17  | `resolveReasoningOutputMode`      | Seleziona il contratto di output del ragionamento nativo o con tag                                               | Il provider richiede ragionamento/output finale con tag invece di campi nativi                                                                    |
| 18  | `prepareExtraParams`              | Normalizzazione dei parametri di richiesta prima dei wrapper generici delle opzioni di streaming                 | Il provider richiede parametri di richiesta predefiniti o pulizia dei parametri per provider                                                       |
| 19  | `createStreamFn`                  | Sostituisce completamente il normale percorso di streaming con un trasporto personalizzato                       | Il provider richiede un protocollo wire personalizzato, non solo un wrapper                                                                        |
| 20  | `wrapStreamFn`                    | Wrapper dello stream dopo l'applicazione dei wrapper generici                                                    | Il provider richiede wrapper di compatibilità per header/corpo/modello della richiesta senza un trasporto personalizzato                          |
| 21  | `resolveTransportTurnState`       | Allega header o metadati di trasporto nativi per turno                                                           | Il provider vuole che i trasporti generici inviino l'identità del turno nativa del provider                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | Allega header WebSocket nativi o policy di raffreddamento della sessione                                         | Il provider vuole che i trasporti WS generici regolino header di sessione o policy di fallback                                                    |
| 23  | `formatApiKey`                    | Formattatore del profilo di autenticazione: il profilo memorizzato diventa la stringa `apiKey` runtime           | Il provider memorizza metadati di autenticazione extra e richiede una forma di token runtime personalizzata                                       |
| 24  | `refreshOAuth`                    | Override dell'aggiornamento OAuth per endpoint di aggiornamento personalizzati o policy di errore di aggiornamento | Il provider non si adatta ai refresher `pi-ai` condivisi                                                                                          |
| 25  | `buildAuthDoctorHint`             | Suggerimento di riparazione aggiunto quando l'aggiornamento OAuth fallisce                                       | Il provider richiede indicazioni di riparazione dell'autenticazione di proprietà del provider dopo un errore di aggiornamento                     |
| 26  | `matchesContextOverflowError`     | Matcher dell'overflow della finestra di contesto di proprietà del provider                                       | Il provider ha errori raw di overflow che le euristiche generiche non rileverebbero                                                               |
| 27  | `classifyFailoverReason`          | Classificazione del motivo di failover di proprietà del provider                                                 | Il provider può mappare errori raw API/trasporto a limite di frequenza/sovraccarico/ecc.                                                         |
| 28  | `isCacheTtlEligible`              | Policy della cache dei prompt per provider proxy/backhaul                                                        | Il provider richiede gating del TTL della cache specifico del proxy                                                                               |
| 29  | `buildMissingAuthMessage`         | Sostituzione del messaggio generico di recupero per autenticazione mancante                                      | Il provider richiede un suggerimento di recupero specifico del provider per autenticazione mancante                                                |
| 30  | `augmentModelCatalog`             | Righe sintetiche/finali del catalogo aggiunte dopo la discovery                                                  | Il provider richiede righe sintetiche di compatibilità futura in `models list` e nei selettori                                                    |
| 31  | `resolveThinkingProfile`          | Set di livelli `/think` specifici del modello, etichette di visualizzazione e valore predefinito                 | Il provider espone una scala di thinking personalizzata o un'etichetta binaria per modelli selezionati                                             |
| 32  | `isBinaryThinking`                | Hook di compatibilità per l'interruttore on/off del ragionamento                                                 | Il provider espone solo thinking binario on/off                                                                                                  |
| 33  | `supportsXHighThinking`           | Hook di compatibilità per il supporto al ragionamento `xhigh`                                                    | Il provider vuole `xhigh` solo su un sottoinsieme di modelli                                                                                      |
| 34  | `resolveDefaultThinkingLevel`     | Hook di compatibilità per il livello `/think` predefinito                                                        | Il provider possiede la policy `/think` predefinita per una famiglia di modelli                                                                   |
| 35  | `isModernModelRef`                | Matcher dei modelli moderni per filtri dei profili live e selezione smoke                                        | Il provider possiede il matching dei modelli preferiti per live/smoke                                                                            |
| 36  | `prepareRuntimeAuth`              | Scambia una credenziale configurata con il token/chiave runtime effettivo appena prima dell'inferenza            | Il provider richiede uno scambio di token o una credenziale di richiesta di breve durata                                                          |
| 37  | `resolveUsageAuth`                | Risolve le credenziali di utilizzo/fatturazione per `/usage` e le relative superfici di stato                                     | Il provider necessita di parsing personalizzato del token di utilizzo/quota o di una credenziale di utilizzo diversa                                                               |
| 38  | `fetchUsageSnapshot`              | Recupera e normalizza istantanee di utilizzo/quota specifiche del provider dopo la risoluzione dell'autenticazione                             | Il provider necessita di un endpoint di utilizzo specifico del provider o di un parser del payload                                                                           |
| 39  | `createEmbeddingProvider`         | Crea un adattatore di embedding di proprietà del provider per memoria/ricerca                                                     | Il comportamento di embedding della memoria appartiene al Plugin del provider                                                                                    |
| 40  | `buildReplayPolicy`               | Restituisce una policy di replay che controlla la gestione della trascrizione per il provider                                        | Il provider necessita di una policy personalizzata per la trascrizione (ad esempio, rimozione dei blocchi di ragionamento)                                                               |
| 41  | `sanitizeReplayHistory`           | Riscrive la cronologia di replay dopo la pulizia generica della trascrizione                                                        | Il provider necessita di riscritture del replay specifiche del provider oltre agli helper condivisi di Compaction                                                             |
| 42  | `validateReplayTurns`             | Esegue la convalida finale dei turni di replay o la rimodellazione prima del runner incorporato                                           | Il trasporto del provider necessita di una convalida dei turni più rigorosa dopo la sanitizzazione generica                                                                    |
| 43  | `onModelSelected`                 | Esegue gli effetti collaterali post-selezione di proprietà del provider                                                                 | Il provider necessita di telemetria o stato di proprietà del provider quando un modello diventa attivo                                                                  |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` controllano prima il
Plugin provider corrispondente, poi passano agli altri Plugin provider con hook
finché uno non modifica effettivamente l'id modello o il trasporto/config. Questo mantiene
funzionanti gli shim provider di alias/compatibilità senza richiedere al chiamante di sapere quale
Plugin incluso possiede la riscrittura. Se nessun hook provider riscrive una voce di configurazione
supportata della famiglia Google, il normalizzatore della configurazione Google incluso applica comunque
quella pulizia di compatibilità.

Se il provider richiede un protocollo wire completamente personalizzato o un executor di richieste personalizzato,
si tratta di una classe diversa di estensione. Questi hook sono per comportamenti del provider
che funzionano comunque nel normale ciclo di inferenza di OpenClaw.

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

I Plugin provider inclusi combinano gli hook sopra per adattarsi al catalogo,
all'autenticazione, al ragionamento, al replay e alle esigenze d'uso di ciascun vendor. Il set autorevole di hook risiede con
ogni Plugin in `extensions/`; questa pagina illustra le forme invece di
rispecchiare l'elenco.

<AccordionGroup>
  <Accordion title="Provider di catalogo pass-through">
    OpenRouter, Kilocode, Z.AI, xAI registrano `catalog` più
    `resolveDynamicModel` / `prepareDynamicModel` così possono esporre gli id modello
    upstream prima del catalogo statico di OpenClaw.
  </Accordion>
  <Accordion title="Provider di endpoint OAuth e utilizzo">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai abbinano
    `prepareRuntimeAuth` o `formatApiKey` a `resolveUsageAuth` +
    `fetchUsageSnapshot` per gestire lo scambio di token e l'integrazione di `/usage`.
  </Accordion>
  <Accordion title="Famiglie di replay e pulizia della trascrizione">
    Le famiglie denominate condivise (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) consentono ai provider di aderire
    alla policy della trascrizione tramite `buildReplayPolicy` invece che ogni Plugin
    reimplementi la pulizia.
  </Accordion>
  <Accordion title="Provider solo catalogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` e
    `volcengine` registrano solo `catalog` e usano il ciclo di inferenza condiviso.
  </Accordion>
  <Accordion title="Helper di stream specifici di Anthropic">
    Gli header beta, `/fast` / `serviceTier` e `context1m` vivono nel
    seam pubblico `api.ts` / `contract-api.ts` del Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) invece che nell'SDK
    generico.
  </Accordion>
</AccordionGroup>

## Helper di runtime

I Plugin possono accedere a helper core selezionati tramite `api.runtime`. Per TTS:

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

- `textToSpeech` restituisce il normale payload di output TTS core per superfici file/nota vocale.
- Usa la configurazione core `messages.tts` e la selezione del provider.
- Restituisce buffer audio PCM + sample rate. I Plugin devono ricampionare/codificare per i provider.
- `listVoices` è opzionale per provider. Usalo per selettori vocali o flussi di configurazione gestiti dal vendor.
- Gli elenchi delle voci possono includere metadati più ricchi come locale, genere e tag di personalità per selettori consapevoli del provider.
- OpenAI ed ElevenLabs supportano oggi la telefonia. Microsoft no.

I Plugin possono anche registrare provider vocali tramite `api.registerSpeechProvider(...)`.

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

- Mantieni policy TTS, fallback e consegna delle risposte nel core.
- Usa provider vocali per comportamenti di sintesi gestiti dal vendor.
- L'input legacy Microsoft `edge` viene normalizzato nell'id provider `microsoft`.
- Il modello di ownership preferito è orientato all'azienda: un Plugin vendor può possedere
  provider di testo, voce, immagine e media futuri mentre OpenClaw aggiunge quei
  contratti di capacità.

Per la comprensione di immagini/audio/video, i Plugin registrano un provider tipizzato
di comprensione media invece di una bag generica chiave/valore:

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

- Mantieni orchestrazione, fallback, configurazione e cablaggio dei canali nel core.
- Mantieni il comportamento vendor nel Plugin provider.
- L'espansione additiva deve restare tipizzata: nuovi metodi opzionali, nuovi
  campi risultato opzionali, nuove capacità opzionali.
- La generazione video segue già lo stesso schema:
  - il core possiede il contratto di capacità e l'helper di runtime
  - i Plugin vendor registrano `api.registerVideoGenerationProvider(...)`
  - i Plugin di funzionalità/canale consumano `api.runtime.videoGeneration.*`

Per gli helper runtime di comprensione media, i Plugin possono chiamare:

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
```

Per la trascrizione audio, i Plugin possono usare il runtime di comprensione media
oppure il vecchio alias STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Note:

- `api.runtime.mediaUnderstanding.*` è la superficie condivisa preferita per
  la comprensione di immagini/audio/video.
- Usa la configurazione audio core di comprensione media (`tools.media.audio`) e l'ordine di fallback dei provider.
- Restituisce `{ text: undefined }` quando non viene prodotto alcun output di trascrizione (per esempio input saltato/non supportato).
- `api.runtime.stt.transcribeAudioFile(...)` rimane come alias di compatibilità.

I Plugin possono anche avviare esecuzioni subagent in background tramite `api.runtime.subagent`:

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

- `provider` e `model` sono override opzionali per esecuzione, non modifiche persistenti della sessione.
- OpenClaw onora quei campi di override solo per chiamanti attendibili.
- Per esecuzioni di fallback possedute dal Plugin, gli operatori devono attivarle con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` per limitare i Plugin attendibili a target canonici `provider/model` specifici, oppure `"*"` per consentire esplicitamente qualsiasi target.
- Le esecuzioni subagent di Plugin non attendibili funzionano comunque, ma le richieste di override vengono rifiutate invece di ripiegare silenziosamente.
- Le sessioni subagent create dai Plugin vengono taggate con l'id del Plugin creatore. Il fallback `api.runtime.subagent.deleteSession(...)` può eliminare solo quelle sessioni possedute; l'eliminazione arbitraria di sessioni richiede comunque una richiesta Gateway con scope admin.

Per la ricerca web, i Plugin possono consumare l'helper di runtime condiviso invece di
entrare nel cablaggio degli strumenti dell'agent:

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

I Plugin possono anche registrare provider di ricerca web tramite
`api.registerWebSearchProvider(...)`.

Note:

- Mantieni selezione del provider, risoluzione delle credenziali e semantica condivisa delle richieste nel core.
- Usa provider di ricerca web per trasporti di ricerca specifici del vendor.
- `api.runtime.webSearch.*` è la superficie condivisa preferita per Plugin di funzionalità/canale che richiedono comportamento di ricerca senza dipendere dal wrapper dello strumento agent.

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

- `generate(...)`: genera un'immagine usando la catena di provider di generazione immagini configurata.
- `listProviders(...)`: elenca i provider di generazione immagini disponibili e le loro capacità.

## Route HTTP Gateway

I Plugin possono esporre endpoint HTTP con `api.registerHttpRoute(...)`.

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

- `path`: percorso della route nel server HTTP del gateway.
- `auth`: obbligatorio. Usa `"gateway"` per richiedere la normale autenticazione gateway, oppure `"plugin"` per autenticazione/verifica webhook gestita dal Plugin.
- `match`: opzionale. `"exact"` (predefinito) o `"prefix"`.
- `replaceExisting`: opzionale. Consente allo stesso Plugin di sostituire la propria registrazione di route esistente.
- `handler`: restituisci `true` quando la route ha gestito la richiesta.

Note:

- `api.registerHttpHandler(...)` è stato rimosso e causerà un errore di caricamento del Plugin. Usa invece `api.registerHttpRoute(...)`.
- Le route dei Plugin devono dichiarare `auth` in modo esplicito.
- I conflitti esatti `path + match` vengono rifiutati a meno che non sia impostato `replaceExisting: true`, e un Plugin non può sostituire la route di un altro Plugin.
- Le route sovrapposte con livelli `auth` diversi vengono rifiutate. Mantieni le catene di fallback `exact`/`prefix` solo sullo stesso livello auth.
- Le route `auth: "plugin"` **non** ricevono automaticamente gli ambiti runtime dell'operatore. Sono pensate per Webhook/verifica delle firme gestiti dal Plugin, non per chiamate privilegiate agli helper del Gateway.
- Le route `auth: "gateway"` vengono eseguite all'interno di un ambito runtime di richiesta del Gateway, ma tale ambito è intenzionalmente conservativo:
  - l'autenticazione bearer con segreto condiviso (`gateway.auth.mode = "token"` / `"password"`) mantiene gli ambiti runtime delle route dei Plugin fissati a `operator.write`, anche se il chiamante invia `x-openclaw-scopes`
  - le modalità HTTP attendibili con identità (ad esempio `trusted-proxy` o `gateway.auth.mode = "none"` su un ingresso privato) rispettano `x-openclaw-scopes` solo quando l'header è presente esplicitamente
  - se `x-openclaw-scopes` è assente in quelle richieste a route dei Plugin con identità, l'ambito runtime torna a `operator.write`
- Regola pratica: non dare per scontato che una route di Plugin con autenticazione gateway sia una superficie amministrativa implicita. Se la tua route richiede un comportamento riservato agli amministratori, richiedi una modalità di autenticazione con identità e documenta il contratto esplicito dell'header `x-openclaw-scopes`.

## Percorsi di importazione del Plugin SDK

Usa sottopercorsi SDK stretti invece del barrel root monolitico `openclaw/plugin-sdk`
quando crei nuovi Plugin. Sottopercorsi principali:

| Sottopercorso                       | Scopo                                              |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitive di registrazione dei Plugin              |
| `openclaw/plugin-sdk/channel-core`  | Helper di ingresso/build dei canali                |
| `openclaw/plugin-sdk/core`          | Helper condivisi generici e contratto ombrello     |
| `openclaw/plugin-sdk/config-schema` | Schema Zod root `openclaw.json` (`OpenClawSchema`) |

I Plugin di canale scelgono da una famiglia di interfacce strette: `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` e `channel-actions`. Il comportamento di approvazione dovrebbe consolidarsi
su un unico contratto `approvalCapability` invece di mescolarsi tra campi di
Plugin non correlati. Vedi [Plugin di canale](/it/plugins/sdk-channel-plugins).

Gli helper runtime e di configurazione si trovano nei sottopercorsi focalizzati `*-runtime`
corrispondenti (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, ecc.). Preferisci `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` e `config-mutation`
al barrel di compatibilità ampio `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
e `openclaw/plugin-sdk/infra-runtime` sono shim di compatibilità deprecati per
Plugin più vecchi. Il nuovo codice dovrebbe importare invece primitive generiche più strette.
</Info>

Punti di ingresso interni al repo (per root del pacchetto Plugin incluso):

- `index.js` — ingresso del Plugin incluso
- `api.js` — barrel di helper/tipi
- `runtime-api.js` — barrel solo runtime
- `setup-entry.js` — ingresso del Plugin di setup

I Plugin esterni dovrebbero importare solo sottopercorsi `openclaw/plugin-sdk/*`. Non
importare mai `src/*` del pacchetto di un altro Plugin dal core o da un altro Plugin.
I punti di ingresso caricati tramite facciata preferiscono lo snapshot di configurazione runtime attivo quando
esiste, poi ripiegano sul file di configurazione risolto su disco.

Sottopercorsi specifici per capacità come `image-generation`, `media-understanding`
e `speech` esistono perché i Plugin inclusi li usano oggi. Non sono
automaticamente contratti esterni congelati a lungo termine: controlla la pagina di riferimento SDK
pertinente quando fai affidamento su di essi.

## Schemi degli strumenti per messaggi

I Plugin dovrebbero possedere i contributi allo schema `describeMessageTool(...)`
specifici per canale per primitive non di messaggio come reazioni, letture e sondaggi.
La presentazione condivisa dell'invio dovrebbe usare il contratto generico `MessagePresentation`
invece di campi nativi del provider per pulsanti, componenti, blocchi o schede.
Vedi [Presentazione dei messaggi](/it/plugins/message-presentation) per il contratto,
le regole di fallback, la mappatura dei provider e la checklist per autori di Plugin.

I Plugin in grado di inviare dichiarano cosa possono renderizzare tramite le capacità dei messaggi:

- `presentation` per blocchi di presentazione semantici (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` per richieste di consegna fissata

Il core decide se renderizzare la presentazione nativamente o degradarla a testo.
Non esporre vie di fuga UI native del provider dallo strumento messaggi generico.
Gli helper SDK deprecati per schemi nativi legacy restano esportati per i Plugin
di terze parti esistenti, ma i nuovi Plugin non dovrebbero usarli.

## Risoluzione dei target di canale

I Plugin di canale dovrebbero possedere la semantica dei target specifica per canale. Mantieni l'host
outbound condiviso generico e usa la superficie dell'adapter di messaggistica per le regole del provider:

- `messaging.inferTargetChatType({ to })` decide se un target normalizzato
  debba essere trattato come `direct`, `group` o `channel` prima della ricerca nella directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indica al core se un
  input debba passare direttamente alla risoluzione simile a un id invece della ricerca nella directory.
- `messaging.targetResolver.resolveTarget(...)` è il fallback del Plugin quando
  il core necessita di una risoluzione finale di proprietà del provider dopo la normalizzazione o dopo un
  mancato riscontro nella directory.
- `messaging.resolveOutboundSessionRoute(...)` possiede la costruzione della route di sessione
  specifica del provider una volta risolto un target.

Suddivisione consigliata:

- Usa `inferTargetChatType` per decisioni di categoria che dovrebbero avvenire prima
  della ricerca di peer/gruppi.
- Usa `looksLikeId` per controlli del tipo "tratta questo come un id target esplicito/nativo".
- Usa `resolveTarget` per il fallback di normalizzazione specifico del provider, non per
  una ricerca ampia nella directory.
- Mantieni gli id nativi del provider come chat id, thread id, JID, handle e room
  id dentro i valori `target` o parametri specifici del provider, non nei campi SDK
  generici.

## Directory basate sulla configurazione

I Plugin che derivano voci di directory dalla configurazione dovrebbero mantenere quella logica nel
Plugin e riutilizzare gli helper condivisi da
`openclaw/plugin-sdk/directory-runtime`.

Usa questo quando un canale necessita di peer/gruppi basati sulla configurazione come:

- peer DM guidati da allowlist
- mappe di canali/gruppi configurate
- fallback di directory statici con ambito account

Gli helper condivisi in `directory-runtime` gestiscono solo operazioni generiche:

- filtro delle query
- applicazione del limite
- helper di deduplicazione/normalizzazione
- creazione di `ChannelDirectoryEntry[]`

L'ispezione degli account specifica per canale e la normalizzazione degli id dovrebbero restare
nell'implementazione del Plugin.

## Cataloghi dei provider

I Plugin provider possono definire cataloghi di modelli per l'inferenza con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` restituisce la stessa forma che OpenClaw scrive in
`models.providers`:

- `{ provider }` per una voce provider
- `{ providers }` per più voci provider

Usa `catalog` quando il Plugin possiede id di modello specifici del provider, valori predefiniti
dell'URL base o metadati dei modelli protetti da autenticazione.

`catalog.order` controlla quando il catalogo di un Plugin viene unito rispetto ai provider impliciti
integrati di OpenClaw:

- `simple`: provider semplici guidati da chiave API o env
- `profile`: provider che appaiono quando esistono profili di autenticazione
- `paired`: provider che sintetizzano più voci provider correlate
- `late`: ultimo passaggio, dopo altri provider impliciti

I provider successivi vincono in caso di collisione di chiavi, quindi i Plugin possono sovrascrivere intenzionalmente una
voce provider integrata con lo stesso id provider.

Compatibilità:

- `discovery` funziona ancora come alias legacy
- se sono registrati sia `catalog` sia `discovery`, OpenClaw usa `catalog`

## Ispezione dei canali in sola lettura

Se il tuo Plugin registra un canale, preferisci implementare
`plugin.config.inspectAccount(cfg, accountId)` insieme a `resolveAccount(...)`.

Perché:

- `resolveAccount(...)` è il percorso runtime. Può presumere che le credenziali
  siano completamente materializzate e può fallire rapidamente quando mancano segreti richiesti.
- I percorsi di comando in sola lettura come `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e i flussi doctor/riparazione della configurazione
  non dovrebbero dover materializzare credenziali runtime solo per
  descrivere la configurazione.

Comportamento consigliato di `inspectAccount(...)`:

- Restituisci solo stato descrittivo dell'account.
- Preserva `enabled` e `configured`.
- Includi campi di sorgente/stato delle credenziali quando pertinenti, come:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Non devi restituire valori token grezzi solo per indicare la disponibilità
  in sola lettura. Restituire `tokenStatus: "available"` (e il campo sorgente
  corrispondente) è sufficiente per comandi in stile status.
- Usa `configured_unavailable` quando una credenziale è configurata tramite SecretRef ma
  non disponibile nel percorso di comando corrente.

Questo consente ai comandi in sola lettura di segnalare "configurato ma non disponibile in questo percorso di
comando" invece di andare in crash o riportare erroneamente l'account come non configurato.

## Pacchetti di package

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

Ogni voce diventa un Plugin. Se il pacchetto elenca più estensioni, l'id del Plugin
diventa `name/<fileBase>`.

Se il tuo Plugin importa dipendenze npm, installale in quella directory in modo che
`node_modules` sia disponibile (`npm install` / `pnpm install`).

Misura di sicurezza: ogni voce `openclaw.extensions` deve rimanere dentro la directory del Plugin
dopo la risoluzione dei symlink. Le voci che escono dalla directory del pacchetto vengono
rifiutate.

Nota di sicurezza: `openclaw plugins install` installa le dipendenze del Plugin con un
`npm install --omit=dev --ignore-scripts` locale al progetto (nessuno script di lifecycle,
nessuna dipendenza dev a runtime), ignorando le impostazioni globali npm install ereditate.
Mantieni gli alberi di dipendenze dei Plugin "JS/TS puro" ed evita pacchetti che richiedono
build `postinstall`.

Opzionale: `openclaw.setupEntry` può puntare a un modulo leggero solo per il setup.
Quando OpenClaw necessita di superfici di setup per un Plugin di canale disabilitato, oppure
quando un Plugin di canale è abilitato ma ancora non configurato, carica `setupEntry`
invece dell'ingresso completo del Plugin. Questo rende startup e setup più leggeri
quando l'ingresso principale del Plugin collega anche strumenti, hook o altro codice solo runtime.

Opzionale: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
può far optare un Plugin di canale per lo stesso percorso `setupEntry` durante la fase
di startup pre-listen del gateway, anche quando il canale è già configurato.

Usalo solo quando `setupEntry` copre completamente la superficie di startup che deve esistere
prima che il gateway inizi ad ascoltare. In pratica, significa che l'ingresso di setup
deve registrare ogni capacità di proprietà del canale da cui dipende lo startup, come:

- la registrazione del canale stesso
- qualsiasi route HTTP che debba essere disponibile prima che il gateway inizi ad ascoltare
- qualsiasi metodo, strumento o servizio del gateway che debba esistere durante quella stessa finestra

Se l'ingresso completo possiede ancora una qualsiasi capacità di startup richiesta, non abilitare
questo flag. Mantieni il Plugin sul comportamento predefinito e lascia che OpenClaw carichi
l'ingresso completo durante lo startup.

I canali inclusi possono anche pubblicare helper di superficie contrattuale solo per il setup che il core
può consultare prima che il runtime completo del canale sia caricato. L'attuale superficie di promozione
del setup è:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core usa questa superficie quando deve promuovere una configurazione legacy di canale con account singolo in `channels.<id>.accounts.*` senza caricare l'intera entry del plugin. Matrix è l'esempio bundled attuale: sposta solo le chiavi di autenticazione/bootstrap in un account promosso con nome quando esistono già account con nome, e può preservare una chiave configurata non canonica per l'account predefinito invece di creare sempre `accounts.default`.

Questi adapter di patch di configurazione mantengono lazy la scoperta della superficie contrattuale bundled. Il tempo di import resta leggero; la superficie di promozione viene caricata solo al primo utilizzo invece di rientrare nell'avvio del canale bundled durante l'import del modulo.

Quando queste superfici di avvio includono metodi RPC del Gateway, mantienile su un prefisso specifico del plugin. Gli spazi dei nomi amministrativi di Core (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si risolvono sempre in `operator.admin`, anche se un plugin richiede un ambito più ristretto.

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

I Plugin di canale possono pubblicare metadati di configurazione/scoperta tramite `openclaw.channel` e suggerimenti di installazione tramite `openclaw.install`. Questo mantiene il catalogo di Core privo di dati.

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

- `detailLabel`: etichetta secondaria per superfici di catalogo/stato più ricche
- `docsLabel`: sovrascrive il testo del link alla documentazione
- `preferOver`: ID di plugin/canale con priorità inferiore che questa voce di catalogo deve superare
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controlli del testo per la superficie di selezione
- `markdownCapable`: contrassegna il canale come compatibile con markdown per le decisioni di formattazione in uscita
- `exposure.configured`: nasconde il canale dalle superfici di elenco dei canali configurati quando impostato su `false`
- `exposure.setup`: nasconde il canale dai selettori interattivi di configurazione quando impostato su `false`
- `exposure.docs`: contrassegna il canale come interno/privato per le superfici di navigazione della documentazione
- `showConfigured` / `showInSetup`: alias legacy ancora accettati per compatibilità; preferisci `exposure`
- `quickstartAllowFrom`: abilita il canale al flusso quickstart standard `allowFrom`
- `forceAccountBinding`: richiede il binding esplicito dell'account anche quando esiste un solo account
- `preferSessionLookupForAnnounceTarget`: preferisce la ricerca della sessione durante la risoluzione dei target di annuncio

OpenClaw può anche unire **cataloghi di canali esterni** (per esempio, un export del registro MPM). Inserisci un file JSON in uno di questi percorsi:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oppure punta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a uno o più file JSON (delimitati da virgola/punto e virgola/`PATH`). Ogni file deve contenere `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Il parser accetta anche `"packages"` o `"plugins"` come alias legacy per la chiave `"entries"`.

Le voci generate del catalogo dei canali e le voci del catalogo di installazione dei provider espongono informazioni normalizzate sulla sorgente di installazione accanto al blocco grezzo `openclaw.install`. Le informazioni normalizzate identificano se la specifica npm è una versione esatta o un selettore mobile, se sono presenti metadati di integrità attesi e se è disponibile anche un percorso sorgente locale. Quando l'identità del catalogo/pacchetto è nota, le informazioni normalizzate avvisano se il nome del pacchetto npm analizzato diverge da tale identità. Avvisano anche quando `defaultChoice` non è valido o punta a una sorgente non disponibile, e quando sono presenti metadati di integrità npm senza una sorgente npm valida. I consumer devono trattare `installSource` come campo opzionale additivo, così le voci create manualmente e gli shim di catalogo non devono sintetizzarlo.
Questo consente a onboarding e diagnostica di spiegare lo stato del piano sorgente senza importare il runtime del plugin.

Le voci npm esterne ufficiali devono preferire un `npmSpec` esatto più `expectedIntegrity`. I nomi di pacchetto semplici e i dist-tag continuano a funzionare per compatibilità, ma mostrano avvisi del piano sorgente così il catalogo può muoversi verso installazioni fissate e controllate per integrità senza rompere i plugin esistenti. Quando l'onboarding installa da un percorso di catalogo locale, registra una voce gestita dell'indice dei plugin con `source: "path"` e un `sourcePath` relativo al workspace quando possibile. Il percorso operativo assoluto di caricamento resta in `plugins.load.paths`; il record di installazione evita di duplicare percorsi della workstation locale nella configurazione di lunga durata. Questo mantiene visibili le installazioni di sviluppo locale alla diagnostica del piano sorgente senza aggiungere una seconda superficie grezza di divulgazione dei percorsi del filesystem. L'indice dei plugin persistito `plugins/installs.json` è la fonte di verità dell'installazione e può essere aggiornato senza caricare moduli runtime del plugin.
La sua mappa `installRecords` è durevole anche quando un manifesto del plugin manca o non è valido; il suo array `plugins` è una vista ricostruibile dei manifesti.

## Plugin del motore di contesto

I Plugin del motore di contesto possiedono l'orchestrazione del contesto di sessione per ingestione, assemblaggio e Compaction. Registrali dal tuo plugin con `api.registerContextEngine(id, factory)`, poi seleziona il motore attivo con `plugins.slots.contextEngine`.

Usalo quando il tuo plugin deve sostituire o estendere la pipeline di contesto predefinita invece di aggiungere solo ricerca in memoria o hook.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

La factory `ctx` espone valori opzionali `config`, `agentDir` e `workspaceDir` per l'inizializzazione al momento della costruzione.

Se il tuo motore **non** possiede l'algoritmo di Compaction, mantieni implementato `compact()` e delegalo esplicitamente:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

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
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Aggiungere una nuova capacità

Quando un plugin ha bisogno di un comportamento che non rientra nell'API attuale, non aggirare il sistema di plugin con un accesso privato. Aggiungi la capacità mancante.

Sequenza consigliata:

1. definisci il contratto di Core
   Decidi quale comportamento condiviso deve essere di proprietà di Core: policy, fallback, merge della configurazione, ciclo di vita, semantica verso i canali e forma degli helper runtime.
2. aggiungi superfici tipizzate di registrazione/runtime del plugin
   Estendi `OpenClawPluginApi` e/o `api.runtime` con la più piccola superficie tipizzata utile della capacità.
3. collega Core + consumer di canale/funzionalità
   I canali e i plugin di funzionalità devono consumare la nuova capacità tramite Core, non importando direttamente un'implementazione di vendor.
4. registra le implementazioni dei vendor
   I plugin dei vendor registrano poi i loro backend rispetto alla capacità.
5. aggiungi copertura contrattuale
   Aggiungi test in modo che proprietà e forma di registrazione restino esplicite nel tempo.

È così che OpenClaw resta opinionato senza diventare hardcoded sulla visione del mondo di un singolo provider. Vedi il [Ricettario delle capacità](/it/plugins/architecture) per una checklist concreta dei file e un esempio completo.

### Checklist delle capacità

Quando aggiungi una nuova capacità, l'implementazione dovrebbe di solito toccare insieme queste superfici:

- tipi del contratto di Core in `src/<capability>/types.ts`
- helper runner/runtime di Core in `src/<capability>/runtime.ts`
- superficie di registrazione dell'API del plugin in `src/plugins/types.ts`
- wiring del registro plugin in `src/plugins/registry.ts`
- esposizione runtime del plugin in `src/plugins/runtime/*` quando i plugin di funzionalità/canale devono consumarla
- helper di cattura/test in `src/test-utils/plugin-registration.ts`
- asserzioni di proprietà/contratto in `src/plugins/contracts/registry.ts`
- documentazione per operatori/plugin in `docs/`

Se manca una di queste superfici, di solito è un segnale che la capacità non è ancora completamente integrata.

### Template della capacità

Pattern minimo:

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

Pattern del test contrattuale:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Questo mantiene semplice la regola:

- Core possiede il contratto della capacità + orchestrazione
- i plugin dei vendor possiedono le implementazioni dei vendor
- i plugin di funzionalità/canale consumano gli helper runtime
- i test contrattuali mantengono esplicita la proprietà

## Correlati

- [Architettura dei Plugin](/it/plugins/architecture) — modello e forme pubbliche delle capacità
- [Sottopercorsi dell'SDK dei Plugin](/it/plugins/sdk-subpaths)
- [Configurazione dell'SDK dei Plugin](/it/plugins/sdk-setup)
- [Creare Plugin](/it/plugins/building-plugins)
