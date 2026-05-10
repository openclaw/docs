---
read_when:
    - Implementazione degli hook di runtime dei provider, del ciclo di vita dei canali o dei bundle di pacchetti
    - Debug dell'ordine di caricamento dei Plugin o dello stato del registro
    - Aggiunta di una nuova funzionalità di Plugin o di un Plugin del motore di contesto
summary: 'Interni dell''architettura dei Plugin: pipeline di caricamento, registro, hook di runtime, route HTTP e tabelle di riferimento'
title: Interni dell'architettura dei Plugin
x-i18n:
    generated_at: "2026-05-10T19:41:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: d41a28b83759906df693a00f3a20237bb7b91905eb948ff7bb354608e7997119
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Per il modello pubblico delle capability, le forme dei plugin e i contratti di proprietà/esecuzione, consulta [Architettura dei Plugin](/it/plugins/architecture). Questa pagina è il riferimento per i meccanismi interni: pipeline di caricamento, registro, hook di runtime, rotte HTTP del Gateway, percorsi di importazione e tabelle degli schemi.

## Pipeline di caricamento

All'avvio, OpenClaw esegue grosso modo questi passaggi:

1. individua le root dei plugin candidati
2. legge i manifest dei bundle nativi o compatibili e i metadati dei pacchetti
3. rifiuta i candidati non sicuri
4. normalizza la configurazione dei plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide l'abilitazione per ciascun candidato
6. carica i moduli nativi abilitati: i moduli bundled compilati usano un loader nativo;
   il sorgente TypeScript locale di terze parti usa il fallback di emergenza Jiti
7. chiama gli hook nativi `register(api)` e raccoglie le registrazioni nel registro dei plugin
8. espone il registro ai comandi e alle superfici di runtime

<Note>
`activate` è un alias legacy di `register`: il loader risolve quello presente (`def.register ?? def.activate`) e lo chiama nello stesso punto. Tutti i plugin bundled usano `register`; preferisci `register` per i nuovi plugin.
</Note>

I gate di sicurezza vengono eseguiti **prima** dell'esecuzione runtime. I candidati vengono bloccati quando l'entry esce dalla root del plugin, il percorso è scrivibile da tutti oppure la proprietà del percorso appare sospetta per i plugin non bundled.

I candidati bloccati restano associati al proprio id plugin per la diagnostica. Se la configurazione fa ancora riferimento a quell'id, la validazione segnala il plugin come presente ma bloccato e rimanda all'avviso di sicurezza del percorso invece di trattare la voce di configurazione come obsoleta.

### Comportamento manifest-first

Il manifest è la fonte di verità del control plane. OpenClaw lo usa per:

- identificare il plugin
- individuare canali/Skills/schema di configurazione dichiarati o capability del bundle
- validare `plugins.entries.<id>.config`
- arricchire etichette e placeholder della Control UI
- mostrare metadati di installazione/catalogo
- preservare descrittori economici di attivazione e configurazione senza caricare il runtime del plugin

Per i plugin nativi, il modulo runtime è la parte data plane. Registra il comportamento effettivo, come hook, tool, comandi o flussi provider.

I blocchi opzionali del manifest `activation` e `setup` restano nel control plane. Sono descrittori di soli metadati per la pianificazione dell'attivazione e l'individuazione della configurazione; non sostituiscono la registrazione runtime, `register(...)` o `setupEntry`.
I primi consumer di attivazione live ora usano suggerimenti del manifest per comandi, canali e provider per restringere il caricamento dei plugin prima della materializzazione più ampia del registro:

- il caricamento CLI si restringe ai plugin che possiedono il comando primario richiesto
- la risoluzione di configurazione/plugin del canale si restringe ai plugin che possiedono l'id canale richiesto
- la risoluzione esplicita di configurazione/runtime del provider si restringe ai plugin che possiedono l'id provider richiesto
- la pianificazione dell'avvio del Gateway usa `activation.onStartup` per importazioni esplicite all'avvio e opt-out dall'avvio; i plugin senza metadati di avvio vengono caricati solo tramite trigger di attivazione più stretti

I precaricamenti runtime al momento della richiesta che chiedono l'ambito ampio `all` derivano comunque un insieme esplicito di id plugin effettivi da configurazione, pianificazione dell'avvio, canali configurati, slot e regole di auto-abilitazione. Se l'insieme derivato è vuoto, OpenClaw carica un registro runtime vuoto invece di allargarsi a ogni plugin individuabile.

Il planner di attivazione espone sia un'API di soli id per i chiamanti esistenti sia un'API di piano per la nuova diagnostica. Le voci del piano indicano perché un plugin è stato selezionato, separando i suggerimenti espliciti del planner `activation.*` dal fallback di proprietà del manifest come `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` e hook. Questa separazione delle ragioni è il confine di compatibilità: i metadati esistenti dei plugin continuano a funzionare, mentre il nuovo codice può rilevare suggerimenti ampi o comportamento di fallback senza modificare la semantica di caricamento runtime.

L'individuazione della configurazione ora preferisce id posseduti dai descrittori come `setup.providers` e `setup.cliBackends` per restringere i plugin candidati prima di tornare a `setup-api` per i plugin che richiedono ancora hook runtime in fase di configurazione. Gli elenchi di configurazione dei provider usano `providerAuthChoices` del manifest, scelte di configurazione derivate dai descrittori e metadati del catalogo di installazione senza caricare il runtime del provider. `setup.requiresRuntime: false` esplicito è un limite solo descrittore; `requiresRuntime` omesso mantiene il fallback legacy `setup-api` per compatibilità. Se più di un plugin individuato rivendica lo stesso id normalizzato di provider di configurazione o backend CLI, la ricerca della configurazione rifiuta il proprietario ambiguo invece di basarsi sull'ordine di discovery. Quando il runtime di configurazione viene eseguito, la diagnostica del registro segnala la deriva tra `setup.providers` / `setup.cliBackends` e i provider o backend CLI registrati da setup-api senza bloccare i plugin legacy.

### Confine della cache dei plugin

OpenClaw non memorizza nella cache i risultati di discovery dei plugin o i dati diretti del registro dei manifest dietro finestre basate sull'orologio. Installazioni, modifiche ai manifest e cambiamenti dei percorsi di caricamento devono diventare visibili alla successiva lettura esplicita dei metadati o ricostruzione dello snapshot.
Il parser del file manifest può mantenere una cache limitata della firma del file, indicizzata per percorso del manifest aperto, inode, dimensione e timestamp; quella cache evita solo di riparsare byte invariati e non deve memorizzare nella cache risposte su discovery, registro, proprietario o policy.

Il percorso rapido sicuro per i metadati è la proprietà esplicita degli oggetti, non una cache nascosta. Gli hot path di avvio del Gateway dovrebbero passare il `PluginMetadataSnapshot` corrente, la `PluginLookUpTable` derivata o un registro manifest esplicito lungo la catena di chiamate. Validazione della configurazione, auto-abilitazione all'avvio, bootstrap dei plugin e selezione del provider possono riutilizzare questi oggetti finché rappresentano la configurazione e l'inventario plugin correnti. La ricerca della configurazione ricostruisce ancora i metadati del manifest su richiesta, a meno che il percorso di configurazione specifico riceva un registro manifest esplicito; mantienilo come fallback cold path invece di aggiungere cache di ricerca nascoste. Quando l'input cambia, ricostruisci e sostituisci lo snapshot invece di mutarlo o conservarne copie storiche.
Le viste sul registro plugin attivo e gli helper di bootstrap dei canali bundled dovrebbero essere ricalcolati dal registro/root corrente. Mappe di breve durata vanno bene all'interno di una singola chiamata per deduplicare il lavoro o proteggere dal rientro; non devono diventare cache di metadati di processo.

Per il caricamento dei plugin, lo strato di cache persistente è il caricamento runtime. Può riutilizzare lo stato del loader quando codice o artefatti installati vengono effettivamente caricati, ad esempio:

- `PluginLoaderCacheState` e registri runtime attivi compatibili
- cache jiti/moduli e cache dei loader delle superfici pubbliche usate per evitare di importare ripetutamente la stessa superficie runtime
- cache del filesystem per artefatti plugin installati
- mappe per chiamata di breve durata per normalizzazione dei percorsi o risoluzione dei duplicati

Queste cache sono dettagli implementativi del data plane. Non devono rispondere a domande del control plane come "quale plugin possiede questo provider?", a meno che il chiamante non abbia richiesto deliberatamente il caricamento runtime.

Non aggiungere cache persistenti o basate sull'orologio per:

- risultati di discovery
- registri manifest diretti
- registri manifest ricostruiti dall'indice dei plugin installati
- lookup del proprietario del provider, soppressione dei modelli, policy provider o metadati di artefatti pubblici
- qualsiasi altra risposta derivata dal manifest in cui un manifest modificato, un indice installato o un percorso di caricamento dovrebbe essere visibile alla successiva lettura dei metadati

I chiamanti che ricostruiscono i metadati del manifest dall'indice persistito dei plugin installati ricostruiscono quel registro su richiesta. L'indice installato è stato source-plane durevole; non è una cache di metadati nascosta in-process.

## Modello del registro

I plugin caricati non mutano direttamente globali core casuali. Si registrano in un registro plugin centrale.

Il registro tiene traccia di:

- record dei plugin (identità, sorgente, origine, stato, diagnostica)
- tool
- hook legacy e hook tipizzati
- canali
- provider
- handler RPC del gateway
- rotte HTTP
- registrar CLI
- servizi in background
- comandi posseduti dai plugin

Le funzionalità core poi leggono da quel registro invece di parlare direttamente con i moduli dei plugin. Questo mantiene il caricamento a senso unico:

- modulo plugin -> registrazione nel registro
- runtime core -> consumo del registro

Questa separazione è importante per la manutenibilità. Significa che la maggior parte delle superfici core richiede un solo punto di integrazione: "leggi il registro", non "gestisci un caso speciale per ogni modulo plugin".

## Callback di associazione conversazione

I plugin che associano una conversazione possono reagire quando un'approvazione viene risolta.

Usa `api.onConversationBindingResolved(...)` per ricevere un callback dopo che una richiesta di associazione viene approvata o negata:

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
- `request`: il riepilogo della richiesta originale, suggerimento di detach, id mittente e metadati della conversazione

Questo callback è solo una notifica. Non modifica chi è autorizzato ad associare una conversazione e viene eseguito dopo il completamento della gestione dell'approvazione core.

## Hook runtime dei provider

I plugin provider hanno tre livelli:

- **Metadati del manifest** per lookup economici prima del runtime:
  `setup.providers[].envVars`, compatibilità deprecata `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` e `channelEnvVars`.
- **Hook in fase di configurazione**: `catalog` (legacy `discovery`) più
  `applyConfigDefaults`.
- **Hook runtime**: oltre 40 hook opzionali che coprono auth, risoluzione dei modelli,
  wrapping degli stream, livelli di pensiero, policy di replay ed endpoint di utilizzo. Vedi
  l'elenco completo in [Ordine e uso degli hook](#hook-order-and-usage).

OpenClaw possiede ancora il ciclo agente generico, il failover, la gestione delle trascrizioni e la policy dei tool. Questi hook sono la superficie di estensione per comportamento specifico dei provider senza richiedere un intero trasporto di inferenza personalizzato.

Usa `setup.providers[].envVars` del manifest quando il provider ha credenziali basate su env che i percorsi generici di auth/stato/selettore modelli dovrebbero vedere senza caricare il runtime del plugin. `providerAuthEnvVars` deprecato viene ancora letto dall'adattatore di compatibilità durante la finestra di deprecazione, e i plugin non bundled che lo usano ricevono una diagnostica del manifest. Usa `providerAuthAliases` del manifest quando un id provider dovrebbe riutilizzare variabili env, profili auth, auth basata su configurazione e scelta di onboarding della chiave API di un altro id provider. Usa `providerAuthChoices` del manifest quando le superfici CLI di onboarding/scelta auth dovrebbero conoscere l'id scelta del provider, le etichette di gruppo e il wiring auth semplice con un flag senza caricare il runtime del provider. Mantieni `envVars` runtime del provider per suggerimenti rivolti agli operatori, come etichette di onboarding o variabili di configurazione OAuth client-id/client-secret.

Usa `channelEnvVars` del manifest quando un canale ha auth o configurazione guidata da env che fallback generico della shell env, controlli config/stato o prompt di configurazione dovrebbero vedere senza caricare il runtime del canale.

### Ordine e uso degli hook

Per i plugin modello/provider, OpenClaw chiama gli hook in questo ordine approssimativo.
La colonna "Quando usare" è la guida rapida alla decisione.
I campi provider solo per compatibilità che OpenClaw non chiama più, come `ProviderPlugin.capabilities` e `suppressBuiltInModel`, sono intenzionalmente esclusi da questo elenco.

| #   | Aggancio                          | Che cosa fa                                                                                                    | Quando usarlo                                                                                                                                |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Pubblica la configurazione del provider in `models.providers` durante la generazione di `models.json`          | Il provider possiede un catalogo o valori predefiniti per l'URL di base                                                                       |
| 2   | `applyConfigDefaults`             | Applica i valori predefiniti di configurazione globale posseduti dal provider durante la materializzazione della configurazione | I valori predefiniti dipendono dalla modalità di autenticazione, dall'ambiente o dalla semantica della famiglia di modelli del provider       |
| --  | _(ricerca del modello integrata)_ | OpenClaw prova prima il normale percorso registro/catalogo                                                     | _(non è un aggancio di plugin)_                                                                                                               |
| 3   | `normalizeModelId`                | Normalizza alias legacy o di anteprima degli ID modello prima della ricerca                                    | Il provider possiede la pulizia degli alias prima della risoluzione canonica del modello                                                      |
| 4   | `normalizeTransport`              | Normalizza `api` / `baseUrl` della famiglia del provider prima dell'assemblaggio generico del modello          | Il provider possiede la pulizia del trasporto per ID provider personalizzati nella stessa famiglia di trasporto                               |
| 5   | `normalizeConfig`                 | Normalizza `models.providers.<id>` prima della risoluzione runtime/provider                                    | Il provider necessita di pulizia della configurazione che deve risiedere nel plugin; gli helper inclusi della famiglia Google fungono anche da supporto per le voci di configurazione Google supportate |
| 6   | `applyNativeStreamingUsageCompat` | Applica riscritture di compatibilità dell'uso dello streaming nativo ai provider di configurazione             | Il provider necessita di correzioni dei metadati di uso dello streaming nativo guidate dall'endpoint                                          |
| 7   | `resolveConfigApiKey`             | Risolve l'autenticazione tramite marcatore di ambiente per i provider di configurazione prima del caricamento dell'autenticazione runtime | Il provider ha una risoluzione della chiave API tramite marcatore di ambiente posseduta dal provider; anche `amazon-bedrock` ha qui un resolver integrato per marcatori di ambiente AWS |
| 8   | `resolveSyntheticAuth`            | Espone autenticazione locale/self-hosted o basata su configurazione senza persistere testo in chiaro           | Il provider può operare con un marcatore di credenziale sintetico/locale                                                                      |
| 9   | `resolveExternalAuthProfiles`     | Sovrappone profili di autenticazione esterni posseduti dal provider; il valore predefinito di `persistence` è `runtime-only` per credenziali possedute da CLI/app | Il provider riutilizza credenziali di autenticazione esterne senza persistere token di aggiornamento copiati; dichiarare `contracts.externalAuthProviders` nel manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Abbassa la precedenza dei placeholder di profilo sintetici archiviati dietro autenticazione basata su ambiente/configurazione | Il provider archivia profili placeholder sintetici che non devono prevalere                                                                   |
| 11  | `resolveDynamicModel`             | Fallback sincrono per ID modello posseduti dal provider non ancora presenti nel registro locale                | Il provider accetta ID modello upstream arbitrari                                                                                             |
| 12  | `prepareDynamicModel`             | Riscaldamento asincrono, poi `resolveDynamicModel` viene eseguito di nuovo                                    | Il provider necessita di metadati di rete prima di risolvere ID sconosciuti                                                                   |
| 13  | `normalizeResolvedModel`          | Riscrittura finale prima che il runner incorporato usi il modello risolto                                      | Il provider necessita di riscritture del trasporto ma usa comunque un trasporto core                                                          |
| 14  | `contributeResolvedModelCompat`   | Contribuisce flag di compatibilità per modelli vendor dietro un altro trasporto compatibile                    | Il provider riconosce i propri modelli su trasporti proxy senza prendere il controllo del provider                                            |
| 15  | `normalizeToolSchemas`            | Normalizza gli schemi degli strumenti prima che il runner incorporato li veda                                  | Il provider necessita di pulizia degli schemi della famiglia di trasporto                                                                     |
| 16  | `inspectToolSchemas`              | Espone diagnostica degli schemi posseduta dal provider dopo la normalizzazione                                 | Il provider vuole avvisi sulle parole chiave senza insegnare al core regole specifiche del provider                                           |
| 17  | `resolveReasoningOutputMode`      | Seleziona il contratto di output di ragionamento nativo rispetto a quello etichettato                          | Il provider necessita di ragionamento/output finale etichettato invece dei campi nativi                                                       |
| 18  | `prepareExtraParams`              | Normalizzazione dei parametri di richiesta prima dei wrapper generici delle opzioni di stream                  | Il provider necessita di parametri di richiesta predefiniti o di pulizia dei parametri per provider                                           |
| 19  | `createStreamFn`                  | Sostituisce completamente il normale percorso di stream con un trasporto personalizzato                        | Il provider necessita di un protocollo wire personalizzato, non solo di un wrapper                                                            |
| 20  | `wrapStreamFn`                    | Wrapper di stream dopo l'applicazione dei wrapper generici                                                     | Il provider necessita di wrapper di compatibilità per header/corpo/modello della richiesta senza un trasporto personalizzato                  |
| 21  | `resolveTransportTurnState`       | Allega header o metadati di trasporto nativi per turno                                                         | Il provider vuole che i trasporti generici inviino l'identità di turno nativa del provider                                                    |
| 22  | `resolveWebSocketSessionPolicy`   | Allega header WebSocket nativi o una policy di raffreddamento della sessione                                   | Il provider vuole che i trasporti WS generici regolino header di sessione o policy di fallback                                                |
| 23  | `formatApiKey`                    | Formattatore del profilo di autenticazione: il profilo archiviato diventa la stringa `apiKey` runtime          | Il provider archivia metadati di autenticazione aggiuntivi e necessita di una forma di token runtime personalizzata                           |
| 24  | `refreshOAuth`                    | Override dell'aggiornamento OAuth per endpoint di aggiornamento personalizzati o policy di errore di aggiornamento | Il provider non si adatta agli aggiornatori condivisi `pi-ai`                                                                                 |
| 25  | `buildAuthDoctorHint`             | Suggerimento di riparazione aggiunto quando l'aggiornamento OAuth fallisce                                     | Il provider necessita di guida di riparazione dell'autenticazione posseduta dal provider dopo un errore di aggiornamento                      |
| 26  | `matchesContextOverflowError`     | Matcher di overflow della finestra di contesto posseduto dal provider                                          | Il provider ha errori grezzi di overflow che le euristiche generiche non intercetterebbero                                                    |
| 27  | `classifyFailoverReason`          | Classificazione del motivo di failover posseduta dal provider                                                  | Il provider può mappare errori grezzi di API/trasporto a limite di frequenza/sovraccarico/ecc.                                                |
| 28  | `isCacheTtlEligible`              | Policy della cache dei prompt per provider proxy/backhaul                                                      | Il provider necessita di gating del TTL della cache specifico del proxy                                                                       |
| 29  | `buildMissingAuthMessage`         | Sostituzione del messaggio generico di recupero per autenticazione mancante                                    | Il provider necessita di un suggerimento di recupero per autenticazione mancante specifico del provider                                       |
| 30  | `augmentModelCatalog`             | Righe sintetiche/finali del catalogo aggiunte dopo la discovery                                                | Il provider necessita di righe sintetiche di compatibilità futura in `models list` e nei selettori                                           |
| 31  | `resolveThinkingProfile`          | Set di livelli `/think` specifico del modello, etichette di visualizzazione e valore predefinito               | Il provider espone una scala di thinking personalizzata o un'etichetta binaria per modelli selezionati                                       |
| 32  | `isBinaryThinking`                | Aggancio di compatibilità per l'interruttore di ragionamento on/off                                            | Il provider espone solo thinking binario on/off                                                                                               |
| 33  | `supportsXHighThinking`           | Aggancio di compatibilità del supporto al ragionamento `xhigh`                                                 | Il provider vuole `xhigh` solo su un sottoinsieme di modelli                                                                                  |
| 34  | `resolveDefaultThinkingLevel`     | Aggancio di compatibilità del livello `/think` predefinito                                                     | Il provider possiede la policy `/think` predefinita per una famiglia di modelli                                                               |
| 35  | `isModernModelRef`                | Matcher di modelli moderni per filtri di profili live e selezione smoke                                        | Il provider possiede il matching dei modelli preferiti per live/smoke                                                                         |
| 36  | `prepareRuntimeAuth`              | Scambia una credenziale configurata con il token/chiave runtime effettivo appena prima dell'inferenza          | Il provider necessita di uno scambio di token o di una credenziale di richiesta a breve durata                                                |
| 37  | `resolveUsageAuth`                | Risolve le credenziali di utilizzo/fatturazione per `/usage` e le superfici di stato correlate                                     | Il provider necessita di parsing personalizzato del token di utilizzo/quota o di una credenziale di utilizzo diversa                                                               |
| 38  | `fetchUsageSnapshot`              | Recupera e normalizza snapshot di utilizzo/quota specifici del provider dopo la risoluzione dell'autenticazione                             | Il provider necessita di un endpoint di utilizzo specifico del provider o di un parser del payload                                                                           |
| 39  | `createEmbeddingProvider`         | Crea un adapter di embedding di proprietà del provider per memoria/ricerca                                                     | Il comportamento degli embedding di memoria appartiene al plugin del provider                                                                                    |
| 40  | `buildReplayPolicy`               | Restituisce una policy di replay che controlla la gestione della trascrizione per il provider                                        | Il provider necessita di una policy di trascrizione personalizzata (ad esempio, la rimozione dei blocchi di ragionamento)                                                               |
| 41  | `sanitizeReplayHistory`           | Riscrive la cronologia di replay dopo la pulizia generica della trascrizione                                                        | Il provider necessita di riscritture di replay specifiche del provider oltre agli helper di Compaction condivisi                                                             |
| 42  | `validateReplayTurns`             | Esegue la validazione finale o la rimodellazione dei turni di replay prima del runner incorporato                                           | Il trasporto del provider necessita di una validazione dei turni più rigorosa dopo la sanificazione generica                                                                    |
| 43  | `onModelSelected`                 | Esegue effetti collaterali post-selezione di proprietà del provider                                                                 | Il provider necessita di telemetria o stato di proprietà del provider quando un modello diventa attivo                                                                  |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` controllano prima il
plugin provider corrispondente, poi passano agli altri plugin provider con hook
finché uno non modifica effettivamente l'id del modello o il transport/config. Questo mantiene
funzionanti gli shim provider di alias/compatibilità senza richiedere al chiamante di sapere quale
plugin integrato possiede la riscrittura. Se nessun hook provider riscrive una voce
di configurazione supportata della famiglia Google, il normalizzatore di configurazione Google integrato applica comunque
quella pulizia di compatibilità.

Se il provider ha bisogno di un protocollo wire completamente personalizzato o di un esecutore di richieste personalizzato,
questa è una classe diversa di estensione. Questi hook sono per il comportamento del provider
che viene comunque eseguito nel normale loop di inferenza di OpenClaw.

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

I plugin provider integrati combinano gli hook sopra per adattarsi alle esigenze di catalogo,
autenticazione, thinking, replay e utilizzo di ciascun vendor. Il set di hook autorevole risiede con
ciascun Plugin sotto `extensions/`; questa pagina illustra le forme invece di
rispecchiare l'elenco.

<AccordionGroup>
  <Accordion title="Provider di catalogo pass-through">
    OpenRouter, Kilocode, Z.AI, xAI registrano `catalog` più
    `resolveDynamicModel` / `prepareDynamicModel` così possono esporre gli id dei modelli upstream
    prima del catalogo statico di OpenClaw.
  </Accordion>
  <Accordion title="Provider OAuth e di endpoint di utilizzo">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai abbinano
    `prepareRuntimeAuth` o `formatApiKey` con `resolveUsageAuth` +
    `fetchUsageSnapshot` per possedere lo scambio di token e l'integrazione `/usage`.
  </Accordion>
  <Accordion title="Famiglie di replay e pulizia delle trascrizioni">
    Le famiglie denominate condivise (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) consentono ai provider di aderire alla
    policy delle trascrizioni tramite `buildReplayPolicy` invece che far reimplementare la pulizia
    a ciascun Plugin.
  </Accordion>
  <Accordion title="Provider solo catalogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` e
    `volcengine` registrano solo `catalog` e usano il loop di inferenza condiviso.
  </Accordion>
  <Accordion title="Helper di stream specifici per Anthropic">
    Gli header beta, `/fast` / `serviceTier` e `context1m` vivono dentro il
    punto di integrazione pubblico `api.ts` / `contract-api.ts` del Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) invece che
    nell'SDK generico.
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
- Restituisce buffer audio PCM + frequenza di campionamento. I Plugin devono ricampionare/codificare per i provider.
- `listVoices` è opzionale per provider. Usalo per selettori vocali o flussi di configurazione di proprietà del vendor.
- Gli elenchi delle voci possono includere metadati più ricchi come locale, genere e tag di personalità per selettori consapevoli del provider.
- OpenAI ed ElevenLabs supportano la telefonia oggi. Microsoft no.

I Plugin possono anche registrare provider di sintesi vocale tramite `api.registerSpeechProvider(...)`.

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
- Usa provider di sintesi vocale per il comportamento di sintesi di proprietà del vendor.
- L'input Microsoft legacy `edge` viene normalizzato all'id provider `microsoft`.
- Il modello di proprietà preferito è orientato all'azienda: un Plugin del vendor può possedere
  provider di testo, sintesi vocale, immagini e media futuri man mano che OpenClaw aggiunge quei
  contratti di capability.

Per la comprensione di immagini/audio/video, i Plugin registrano un provider tipizzato
di comprensione media invece di un contenitore chiave/valore generico:

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
- Mantieni il comportamento del vendor nel Plugin provider.
- L'espansione additiva deve restare tipizzata: nuovi metodi opzionali, nuovi campi di risultato opzionali, nuove capability opzionali.
- La generazione video segue già lo stesso schema:
  - il core possiede il contratto di capability e l'helper di runtime
  - i Plugin dei vendor registrano `api.registerVideoGenerationProvider(...)`
  - i Plugin di funzionalità/canale consumano `api.runtime.videoGeneration.*`

Per gli helper di runtime di comprensione media, i Plugin possono chiamare:

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
oppure l'alias STT precedente:

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
- Restituisce `{ text: undefined }` quando non viene prodotto alcun output di trascrizione (per esempio input ignorato/non supportato).
- `api.runtime.stt.transcribeAudioFile(...)` resta un alias di compatibilità.

I Plugin possono anche avviare esecuzioni di subagent in background tramite `api.runtime.subagent`:

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
- OpenClaw rispetta quei campi di override solo per chiamanti fidati.
- Per esecuzioni di fallback possedute da Plugin, gli operatori devono aderire esplicitamente con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` per limitare i Plugin fidati a target canonici `provider/model` specifici, oppure `"*"` per consentire esplicitamente qualsiasi target.
- Le esecuzioni subagent di Plugin non fidati funzionano comunque, ma le richieste di override vengono respinte invece di ricadere silenziosamente sul fallback.
- Le sessioni subagent create da Plugin sono etichettate con l'id del Plugin creatore. Il fallback `api.runtime.subagent.deleteSession(...)` può eliminare solo quelle sessioni possedute; l'eliminazione arbitraria di sessioni richiede ancora una richiesta Gateway con ambito admin.

Per la ricerca web, i Plugin possono consumare l'helper di runtime condiviso invece di
entrare nel cablaggio degli strumenti dell'agente:

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
- Usa provider di ricerca web per transport di ricerca specifici del vendor.
- `api.runtime.webSearch.*` è la superficie condivisa preferita per Plugin di funzionalità/canale che necessitano di comportamento di ricerca senza dipendere dal wrapper dello strumento agente.

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

- `generate(...)`: genera un'immagine usando la catena configurata di provider di generazione immagini.
- `listProviders(...)`: elenca i provider di generazione immagini disponibili e le loro capability.

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

- `path`: percorso della route sotto il server HTTP Gateway.
- `auth`: obbligatorio. Usa `"gateway"` per richiedere la normale autenticazione Gateway, oppure `"plugin"` per autenticazione/verifica webhook gestita dal Plugin.
- `match`: opzionale. `"exact"` (predefinito) o `"prefix"`.
- `replaceExisting`: opzionale. Consente allo stesso Plugin di sostituire la propria registrazione di route esistente.
- `handler`: restituisci `true` quando la route ha gestito la richiesta.

Note:

- `api.registerHttpHandler(...)` è stato rimosso e causerà un errore di caricamento del plugin. Usa invece `api.registerHttpRoute(...)`.
- Le route dei plugin devono dichiarare `auth` esplicitamente.
- I conflitti esatti di `path + match` vengono rifiutati a meno che `replaceExisting: true`, e un plugin non può sostituire la route di un altro plugin.
- Le route sovrapposte con livelli `auth` diversi vengono rifiutate. Mantieni le catene di fallthrough `exact`/`prefix` solo sullo stesso livello di autenticazione.
- Le route `auth: "plugin"` **non** ricevono automaticamente gli scope runtime dell'operatore. Sono pensate per webhook/verifica delle firme gestiti dal plugin, non per chiamate helper privilegiate del Gateway.
- Le route `auth: "gateway"` vengono eseguite all'interno di uno scope runtime di richiesta del Gateway, ma tale scope è intenzionalmente conservativo:
  - l'autenticazione bearer con segreto condiviso (`gateway.auth.mode = "token"` / `"password"`) mantiene gli scope runtime delle route plugin fissati a `operator.write`, anche se il chiamante invia `x-openclaw-scopes`
  - le modalità HTTP affidabili con identità (per esempio `trusted-proxy` o `gateway.auth.mode = "none"` su un ingresso privato) rispettano `x-openclaw-scopes` solo quando l'header è esplicitamente presente
  - se `x-openclaw-scopes` è assente in tali richieste a route plugin con identità, lo scope runtime ripiega su `operator.write`
- Regola pratica: non dare per scontato che una route plugin autenticata dal gateway sia una superficie amministrativa implicita. Se la tua route richiede un comportamento riservato agli amministratori, richiedi una modalità di autenticazione con identità e documenta il contratto esplicito dell'header `x-openclaw-scopes`.

## Percorsi di importazione dell'SDK dei plugin

Usa sottopercorsi SDK ristretti invece del barrel radice monolitico `openclaw/plugin-sdk`
quando sviluppi nuovi plugin. Sottopercorsi core:

| Sottopercorso                       | Scopo                                              |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitive di registrazione dei plugin              |
| `openclaw/plugin-sdk/channel-core`  | Helper per entry/build dei canali                  |
| `openclaw/plugin-sdk/core`          | Helper condivisi generici e contratto ombrello     |
| `openclaw/plugin-sdk/config-schema` | Schema Zod radice `openclaw.json` (`OpenClawSchema`) |

I plugin di canale scelgono da una famiglia di seam ristretti: `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` e `channel-actions`. Il comportamento di approvazione dovrebbe consolidarsi
su un unico contratto `approvalCapability` invece di mescolarsi tra campi
plugin non correlati. Vedi [Plugin di canale](/it/plugins/sdk-channel-plugins).

Gli helper runtime e di configurazione vivono sotto sottopercorsi `*-runtime`
mirati corrispondenti (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, ecc.). Preferisci `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` e `config-mutation`
al posto dell'ampio barrel di compatibilità `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
e `openclaw/plugin-sdk/infra-runtime` sono shim di compatibilità deprecati per
plugin meno recenti. Il nuovo codice dovrebbe invece importare primitive generiche più ristrette.
</Info>

Punti di ingresso interni al repo (per radice del pacchetto plugin incluso):

- `index.js` — entry del plugin incluso
- `api.js` — barrel di helper/tipi
- `runtime-api.js` — barrel solo runtime
- `setup-entry.js` — entry del plugin di setup

I plugin esterni dovrebbero importare solo sottopercorsi `openclaw/plugin-sdk/*`. Non
importare mai `src/*` di un altro pacchetto plugin dal core o da un altro plugin.
I punti di ingresso caricati tramite facade preferiscono lo snapshot di configurazione runtime attivo quando
esiste, quindi ripiegano sul file di configurazione risolto su disco.

Sottopercorsi specifici per capability come `image-generation`, `media-understanding`
e `speech` esistono perché i plugin inclusi li usano oggi. Non sono
automaticamente contratti esterni congelati a lungo termine: controlla la pagina di
riferimento SDK pertinente quando fai affidamento su di essi.

## Schemi degli strumenti di messaggio

I plugin dovrebbero possedere i contributi allo schema `describeMessageTool(...)` specifici
del canale per primitive non di messaggio come reazioni, letture e sondaggi.
La presentazione condivisa dell'invio dovrebbe usare il contratto generico `MessagePresentation`
invece di campi provider-native per pulsanti, componenti, blocchi o card.
Vedi [Presentazione dei messaggi](/it/plugins/message-presentation) per il contratto,
le regole di fallback, la mappatura dei provider e la checklist per autori di plugin.

I plugin capaci di inviare dichiarano cosa possono renderizzare tramite capability di messaggio:

- `presentation` per blocchi di presentazione semantici (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` per richieste di consegna fissata

Il core decide se renderizzare la presentazione in modo nativo o degradarla a testo.
Non esporre vie di fuga UI provider-native dallo strumento di messaggio generico.
Gli helper SDK deprecati per schemi nativi legacy restano esportati per i plugin
di terze parti esistenti, ma i nuovi plugin non dovrebbero usarli.

## Risoluzione delle destinazioni del canale

I plugin di canale dovrebbero possedere le semantiche di destinazione specifiche del canale. Mantieni generico
l'host outbound condiviso e usa la superficie adapter di messaggistica per le regole del provider:

- `messaging.inferTargetChatType({ to })` decide se una destinazione normalizzata
  debba essere trattata come `direct`, `group` o `channel` prima della lookup nella directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indica al core se un
  input dovrebbe saltare direttamente alla risoluzione simile a id invece della ricerca nella directory.
- `messaging.targetResolver.resolveTarget(...)` è il fallback del plugin quando
  il core necessita di una risoluzione finale posseduta dal provider dopo la normalizzazione o dopo un
  mancato riscontro nella directory.
- `messaging.resolveOutboundSessionRoute(...)` possiede la costruzione della route di sessione
  specifica del provider una volta risolta una destinazione.

Suddivisione consigliata:

- Usa `inferTargetChatType` per decisioni di categoria che dovrebbero avvenire prima
  della ricerca in peer/gruppi.
- Usa `looksLikeId` per verifiche del tipo "tratta questo come un id destinazione esplicito/nativo".
- Usa `resolveTarget` per il fallback di normalizzazione specifico del provider, non per
  ricerche ampie nella directory.
- Mantieni id provider-native come id chat, id thread, JID, handle e id stanza
  dentro i valori `target` o parametri specifici del provider, non in campi SDK
  generici.

## Directory basate sulla configurazione

I plugin che derivano voci di directory dalla configurazione dovrebbero mantenere tale logica nel
plugin e riutilizzare gli helper condivisi da
`openclaw/plugin-sdk/directory-runtime`.

Usalo quando un canale necessita di peer/gruppi basati sulla configurazione, come:

- peer DM guidati da allowlist
- mappe di canali/gruppi configurate
- fallback di directory statiche con scope di account

Gli helper condivisi in `directory-runtime` gestiscono solo operazioni generiche:

- filtraggio delle query
- applicazione del limite
- helper di deduplicazione/normalizzazione
- costruzione di `ChannelDirectoryEntry[]`

L'ispezione account specifica del canale e la normalizzazione degli id dovrebbero restare
nell'implementazione del plugin.

## Cataloghi provider

I plugin provider possono definire cataloghi di modelli per l'inferenza con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` restituisce la stessa forma che OpenClaw scrive in
`models.providers`:

- `{ provider }` per una voce provider
- `{ providers }` per più voci provider

Usa `catalog` quando il plugin possiede id modello specifici del provider, valori predefiniti
di URL base o metadati modello vincolati all'autenticazione.

`catalog.order` controlla quando il catalogo di un plugin viene unito rispetto ai provider
impliciti integrati di OpenClaw:

- `simple`: provider semplici guidati da chiave API o env
- `profile`: provider che compaiono quando esistono profili di autenticazione
- `paired`: provider che sintetizzano più voci provider correlate
- `late`: ultimo passaggio, dopo altri provider impliciti

I provider successivi vincono in caso di collisione di chiave, quindi i plugin possono sovrascrivere
intenzionalmente una voce provider integrata con lo stesso id provider.

I plugin possono anche pubblicare righe di modelli in sola lettura tramite
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Questo è il percorso futuro per superfici di elenco/aiuto/selettore e supporta
righe `text`, `image_generation`, `video_generation` e `music_generation`.
I plugin provider possiedono ancora chiamate a endpoint live, scambio di token e
mappatura delle risposte vendor; il core possiede la forma comune delle righe, le etichette di origine
e la formattazione dell'aiuto degli strumenti media. Le registrazioni di provider di generazione media sintetizzano
automaticamente righe di catalogo statiche da `defaultModel`, `models` e `capabilities`.

Compatibilità:

- `discovery` funziona ancora come alias legacy, ma emette un avviso di deprecazione
- se sono registrati sia `catalog` sia `discovery`, OpenClaw usa `catalog`
- `augmentModelCatalog` è deprecato; i provider inclusi dovrebbero pubblicare
  righe supplementari tramite `registerModelCatalogProvider`

## Ispezione di canale in sola lettura

Se il tuo plugin registra un canale, preferisci implementare
`plugin.config.inspectAccount(cfg, accountId)` insieme a `resolveAccount(...)`.

Perché:

- `resolveAccount(...)` è il percorso runtime. Può presumere che le credenziali
  siano completamente materializzate e può fallire rapidamente quando mancano segreti richiesti.
- I percorsi di comando in sola lettura come `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e i flussi di riparazione
  doctor/config non dovrebbero dover materializzare credenziali runtime solo per
  descrivere la configurazione.

Comportamento consigliato di `inspectAccount(...)`:

- Restituisci solo stato account descrittivo.
- Preserva `enabled` e `configured`.
- Includi campi di origine/stato delle credenziali quando pertinenti, come:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Non devi restituire valori token grezzi solo per segnalare la disponibilità
  in sola lettura. Restituire `tokenStatus: "available"` (e il campo origine
  corrispondente) è sufficiente per comandi in stile status.
- Usa `configured_unavailable` quando una credenziale è configurata tramite SecretRef ma
  non disponibile nel percorso di comando corrente.

Questo consente ai comandi in sola lettura di segnalare "configurato ma non disponibile in questo
percorso di comando" invece di arrestarsi con errore o indicare erroneamente che l'account non è configurato.

## Pacchetti bundle

Una directory plugin può includere un `package.json` con `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Ogni voce diventa un plugin. Se il pacchetto elenca più estensioni, l'id plugin
diventa `name/<fileBase>`.

Se il tuo plugin importa dipendenze npm, installale in quella directory affinché
`node_modules` sia disponibile (`npm install` / `pnpm install`).

Guardrail di sicurezza: ogni voce `openclaw.extensions` deve restare dentro la directory plugin
dopo la risoluzione dei symlink. Le voci che escono dalla directory del pacchetto vengono
rifiutate.

Nota di sicurezza: `openclaw plugins install` installa le dipendenze del plugin con un
`npm install --omit=dev --ignore-scripts` locale al progetto (nessuno script di lifecycle,
nessuna dipendenza dev a runtime), ignorando le impostazioni npm globali ereditate.
Mantieni gli alberi di dipendenze dei plugin "JS/TS puri" ed evita pacchetti che richiedono
build `postinstall`.

Opzionale: `openclaw.setupEntry` può puntare a un modulo leggero solo per il setup.
Quando OpenClaw necessita di superfici di setup per un plugin di canale disabilitato, oppure
quando un plugin di canale è abilitato ma ancora non configurato, carica `setupEntry`
invece dell'entry completa del plugin. Questo rende startup e setup più leggeri
quando l'entry principale del plugin collega anche strumenti, hook o altro codice
solo runtime.

Opzionale: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
può far optare un plugin di canale nello stesso percorso `setupEntry` durante la fase
di startup pre-listen del gateway, anche quando il canale è già configurato.

Usa questo solo quando `setupEntry` copre completamente la superficie di avvio che deve esistere
prima che il gateway inizi ad ascoltare. In pratica, questo significa che la voce di setup
deve registrare ogni capability di proprietà del canale da cui dipende l'avvio, come:

- la registrazione del canale stesso
- qualsiasi route HTTP che deve essere disponibile prima che il gateway inizi ad ascoltare
- qualsiasi metodo, tool o servizio del gateway che deve esistere durante quella stessa finestra

Se la tua voce completa possiede ancora una capability di avvio richiesta, non abilitare
questo flag. Mantieni il plugin sul comportamento predefinito e lascia che OpenClaw carichi la
voce completa durante l'avvio.

I canali inclusi possono anche pubblicare helper di superficie contrattuale solo per il setup che il core
può consultare prima che il runtime completo del canale venga caricato. La superficie attuale
di promozione del setup è:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Il core usa quella superficie quando deve promuovere una configurazione di canale legacy a singolo account
in `channels.<id>.accounts.*` senza caricare la voce completa del plugin.
Matrix è l'esempio incluso attuale: sposta solo le chiavi di autenticazione/bootstrap in un
account promosso con nome quando esistono già account con nome, e può preservare una
chiave configurata di account predefinito non canonica invece di creare sempre
`accounts.default`.

Quegli adapter di patch del setup mantengono lazy la discovery della superficie contrattuale inclusa. Il tempo
di import resta leggero; la superficie di promozione viene caricata solo al primo utilizzo invece di
rientrare nell'avvio del canale incluso all'import del modulo.

Quando quelle superfici di avvio includono metodi RPC del gateway, mantienili su un
prefisso specifico del plugin. Gli spazi dei nomi admin del core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e vengono sempre risolti
in `operator.admin`, anche se un plugin richiede un ambito più ristretto.

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

I plugin di canale possono pubblicizzare metadati di setup/discovery tramite `openclaw.channel` e
suggerimenti di installazione tramite `openclaw.install`. Questo mantiene il catalogo del core privo di dati.

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
- `docsLabel`: sostituisce il testo del link per il link alla documentazione
- `preferOver`: ID di plugin/canale a priorità più bassa che questa voce di catalogo dovrebbe superare
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controlli del testo della superficie di selezione
- `markdownCapable`: contrassegna il canale come compatibile con markdown per le decisioni di formattazione in uscita
- `exposure.configured`: nasconde il canale dalle superfici di elenco dei canali configurati quando impostato su `false`
- `exposure.setup`: nasconde il canale dai selettori interattivi di setup/configurazione quando impostato su `false`
- `exposure.docs`: contrassegna il canale come interno/privato per le superfici di navigazione della documentazione
- `showConfigured` / `showInSetup`: alias legacy ancora accettati per compatibilità; preferisci `exposure`
- `quickstartAllowFrom`: include il canale nel flusso quickstart standard `allowFrom`
- `forceAccountBinding`: richiede un binding esplicito dell'account anche quando esiste un solo account
- `preferSessionLookupForAnnounceTarget`: preferisce la ricerca della sessione quando risolve i target degli annunci

OpenClaw può anche unire **cataloghi di canali esterni** (per esempio, un export del registro MPM).
Inserisci un file JSON in uno di questi percorsi:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oppure punta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a
uno o più file JSON (delimitati da virgole/punto e virgola/`PATH`). Ogni file dovrebbe
contenere `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Il parser accetta anche `"packages"` o `"plugins"` come alias legacy per la chiave `"entries"`.

Le voci generate del catalogo dei canali e le voci del catalogo di installazione dei provider espongono
fatti normalizzati sulla fonte di installazione accanto al blocco grezzo `openclaw.install`. I
fatti normalizzati identificano se la specifica npm è una versione esatta o un selettore mobile,
se sono presenti i metadati di integrità attesi e se è disponibile anche un percorso
sorgente locale. Quando l'identità catalogo/pacchetto è nota, i fatti normalizzati avvisano se il nome
del pacchetto npm analizzato diverge da quell'identità.
Avvisano anche quando `defaultChoice` non è valido o punta a una fonte che non è
disponibile, e quando i metadati di integrità npm sono presenti senza una fonte npm
valida. I consumer dovrebbero trattare `installSource` come un campo opzionale additivo, così
le voci create manualmente e gli shim di catalogo non devono sintetizzarlo.
Questo consente a onboarding e diagnostica di spiegare lo stato del piano delle fonti senza
importare il runtime del plugin.

Le voci npm esterne ufficiali dovrebbero preferire un `npmSpec` esatto più
`expectedIntegrity`. I nomi di pacchetto nudi e i dist-tag continuano a funzionare per
compatibilità, ma mostrano avvisi sul piano delle fonti così il catalogo può spostarsi
verso installazioni bloccate e verificate per integrità senza interrompere i plugin esistenti.
Quando l'onboarding installa da un percorso di catalogo locale, registra una voce di indice plugin
gestita con `source: "path"` e un `sourcePath` relativo al workspace quando possibile.
Il percorso operativo assoluto di caricamento resta in `plugins.load.paths`; il record di installazione evita
di duplicare percorsi della workstation locale nella configurazione di lunga durata. Questo mantiene le installazioni
di sviluppo locale visibili alla diagnostica del piano delle fonti senza aggiungere una seconda superficie grezza
di divulgazione dei percorsi del filesystem. L'indice plugin persistito `plugins/installs.json` è la fonte
di verità delle installazioni e può essere aggiornato senza caricare moduli runtime del plugin.
La sua mappa `installRecords` è durevole anche quando un manifest del plugin è mancante o
non valido; il suo array `plugins` è una vista di manifest ricostruibile.

## Plugin del motore di contesto

I plugin del motore di contesto possiedono l'orchestrazione del contesto di sessione per ingestione, assemblaggio
e compaction. Registrali dal tuo plugin con
`api.registerContextEngine(id, factory)`, poi seleziona il motore attivo con
`plugins.slots.contextEngine`.

Usalo quando il tuo plugin deve sostituire o estendere la pipeline di contesto predefinita
invece di limitarsi ad aggiungere ricerca nella memoria o hook.

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

La factory `ctx` espone valori opzionali `config`, `agentDir` e `workspaceDir`
per l'inizializzazione in fase di costruzione.

Se il tuo motore **non** possiede l'algoritmo di compaction, mantieni `compact()`
implementato e delegalo esplicitamente:

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

## Aggiungere una nuova capability

Quando un plugin ha bisogno di un comportamento che non rientra nell'API attuale, non aggirare
il sistema di plugin con un accesso privato diretto. Aggiungi la capability mancante.

Sequenza consigliata:

1. definisci il contratto del core
   Decidi quale comportamento condiviso deve possedere il core: policy, fallback, merge della configurazione,
   ciclo di vita, semantica rivolta al canale e forma degli helper runtime.
2. aggiungi superfici tipizzate di registrazione/runtime del plugin
   Estendi `OpenClawPluginApi` e/o `api.runtime` con la superficie tipizzata
   utile più piccola.
3. collega core + consumer di canale/funzionalità
   I canali e i plugin di funzionalità dovrebbero consumare la nuova capability tramite il core,
   non importando direttamente un'implementazione del vendor.
4. registra le implementazioni del vendor
   I plugin vendor poi registrano i propri backend rispetto alla capability.
5. aggiungi copertura del contratto
   Aggiungi test in modo che proprietà e forma della registrazione restino esplicite nel tempo.

È così che OpenClaw resta opinionated senza diventare hardcoded sulla visione del mondo
di un singolo provider. Consulta il [Capability Cookbook](/it/plugins/adding-capabilities)
per una checklist concreta dei file e un esempio sviluppato.

### Checklist della capability

Quando aggiungi una nuova capability, l'implementazione dovrebbe di solito toccare insieme
queste superfici:

- tipi del contratto core in `src/<capability>/types.ts`
- helper runner/runtime del core in `src/<capability>/runtime.ts`
- superficie di registrazione dell'API plugin in `src/plugins/types.ts`
- collegamento del registro plugin in `src/plugins/registry.ts`
- esposizione runtime del plugin in `src/plugins/runtime/*` quando i plugin di funzionalità/canale
  devono consumarla
- helper di capture/test in `src/test-utils/plugin-registration.ts`
- asserzioni di proprietà/contratto in `src/plugins/contracts/registry.ts`
- documentazione operatore/plugin in `docs/`

Se una di quelle superfici manca, di solito è un segno che la capability non è
ancora completamente integrata.

### Template della capability

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

Pattern del test di contratto:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Questo mantiene semplice la regola:

- il core possiede il contratto della capability + orchestrazione
- i plugin vendor possiedono le implementazioni vendor
- i plugin di funzionalità/canale consumano helper runtime
- i test di contratto mantengono esplicita la proprietà

## Correlati

- [Architettura dei plugin](/it/plugins/architecture) — modello e forme pubbliche delle capability
- [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths)
- [Setup del Plugin SDK](/it/plugins/sdk-setup)
- [Creare plugin](/it/plugins/building-plugins)
