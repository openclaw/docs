---
read_when:
    - Implementazione degli hook di runtime del provider, del ciclo di vita dei canali o delle raccolte di pacchetti
    - Risoluzione dei problemi relativi all'ordine di caricamento dei Plugin o allo stato del registro
    - Aggiungere una nuova capacità di Plugin o un Plugin del motore di contesto
summary: 'Elementi interni dell''architettura dei Plugin: pipeline di caricamento, registro, hook di runtime, route HTTP e tabelle di riferimento'
title: Interni dell'architettura dei Plugin
x-i18n:
    generated_at: "2026-05-03T21:37:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 898cbe2f97d666fc8bb2c2197cb786efb6d13a8842d8eb931fa3ce535bfd21fb
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Per il modello pubblico delle capability, le forme dei plugin e i contratti di proprietà/esecuzione, vedi [Architettura dei Plugin](/it/plugins/architecture). Questa pagina è il riferimento per i meccanismi interni: pipeline di caricamento, registro, hook di runtime, route HTTP del Gateway, percorsi di importazione e tabelle degli schemi.

## Pipeline di caricamento

All'avvio, OpenClaw fa indicativamente questo:

1. scopre le root dei plugin candidate
2. legge i manifest dei bundle nativi o compatibili e i metadati del package
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

I gate di sicurezza avvengono **prima** dell'esecuzione del runtime. I candidati vengono bloccati quando l'entry esce dalla root del plugin, il percorso è scrivibile da tutti o la proprietà del percorso appare sospetta per plugin non bundled.

I candidati bloccati restano associati al loro id plugin per la diagnostica. Se la configurazione fa ancora riferimento a quell'id, la validazione segnala il plugin come presente ma bloccato e rimanda all'avviso di sicurezza del percorso invece di trattare la voce di configurazione come obsoleta.

### Comportamento manifest-first

Il manifest è la fonte di verità del control plane. OpenClaw lo usa per:

- identificare il plugin
- scoprire canali/Skills/schema di configurazione dichiarati o capability del bundle
- validare `plugins.entries.<id>.config`
- arricchire etichette/placeholder della Control UI
- mostrare metadati di installazione/catalogo
- preservare descrittori leggeri di attivazione e configurazione senza caricare il runtime del plugin

Per i plugin nativi, il modulo di runtime è la parte data-plane. Registra il comportamento effettivo, come hook, strumenti, comandi o flussi provider.

I blocchi opzionali `activation` e `setup` del manifest restano sul control plane. Sono descrittori di soli metadati per la pianificazione dell'attivazione e la scoperta della configurazione; non sostituiscono la registrazione di runtime, `register(...)` o `setupEntry`.
I primi consumer di attivazione live ora usano suggerimenti del manifest per comandi, canali e provider per restringere il caricamento dei plugin prima della materializzazione più ampia del registro:

- il caricamento CLI si restringe ai plugin che possiedono il comando primario richiesto
- la risoluzione di setup/plugin del canale si restringe ai plugin che possiedono l'id canale richiesto
- la risoluzione esplicita di setup/runtime del provider si restringe ai plugin che possiedono l'id provider richiesto
- la pianificazione dell'avvio del Gateway usa `activation.onStartup` per importazioni di avvio esplicite e opt-out dall'avvio; i plugin senza metadati di avvio vengono caricati solo tramite trigger di attivazione più ristretti

I precaricamenti di runtime al momento della richiesta che chiedono l'ambito ampio `all` derivano comunque un insieme esplicito di id plugin effettivi da configurazione, pianificazione di avvio, canali configurati, slot e regole di auto-abilitazione. Se l'insieme derivato è vuoto, OpenClaw carica un registro runtime vuoto invece di allargarsi a ogni plugin scopribile.

Il planner di attivazione espone sia un'API solo-id per i caller esistenti sia un'API di piano per le nuove diagnostiche. Le voci del piano indicano perché un plugin è stato selezionato, separando i suggerimenti espliciti del planner `activation.*` dal fallback di proprietà del manifest, come `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` e hook. Questa separazione del motivo è il confine di compatibilità: i metadati dei plugin esistenti continuano a funzionare, mentre il nuovo codice può rilevare suggerimenti ampi o comportamenti di fallback senza cambiare la semantica del caricamento runtime.

La scoperta del setup ora preferisce id posseduti dal descrittore, come `setup.providers` e `setup.cliBackends`, per restringere i plugin candidati prima di ripiegare su `setup-api` per i plugin che richiedono ancora hook runtime al momento del setup. Gli elenchi di setup dei provider usano `providerAuthChoices` del manifest, scelte di setup derivate dal descrittore e metadati del catalogo di installazione senza caricare il runtime del provider. `setup.requiresRuntime: false` esplicito è un limite solo-descrittore; `requiresRuntime` omesso mantiene il fallback legacy setup-api per compatibilità. Se più di un plugin scoperto dichiara lo stesso provider di setup normalizzato o id backend CLI, la ricerca del setup rifiuta il proprietario ambiguo invece di affidarsi all'ordine di scoperta. Quando il runtime di setup viene eseguito, la diagnostica del registro segnala deriva tra `setup.providers` / `setup.cliBackends` e i provider o backend CLI registrati da setup-api senza bloccare i plugin legacy.

### Confine della cache dei plugin

OpenClaw non mette in cache i risultati della scoperta dei plugin o i dati diretti del registro manifest dietro finestre temporali basate sull'orologio. Installazioni, modifiche ai manifest e cambiamenti dei percorsi di caricamento devono diventare visibili alla successiva lettura esplicita dei metadati o ricostruzione dello snapshot.
Il parser del file manifest può mantenere una cache limitata della firma del file, indicizzata dal percorso del manifest aperto, inode, dimensione e timestamp; quella cache evita solo di riparsare byte invariati e non deve mettere in cache risposte di scoperta, registro, proprietario o policy.

Il fast path sicuro dei metadati è la proprietà esplicita degli oggetti, non una cache nascosta.
I percorsi hot di avvio del Gateway dovrebbero passare l'attuale `PluginMetadataSnapshot`, la `PluginLookUpTable` derivata o un registro manifest esplicito lungo la catena di chiamata. Validazione della configurazione, auto-abilitazione all'avvio, bootstrap dei plugin e selezione dei provider possono riutilizzare questi oggetti mentre rappresentano la configurazione e l'inventario dei plugin correnti. La ricerca del setup ricostruisce ancora i metadati del manifest on demand, a meno che il percorso di setup specifico riceva un registro manifest esplicito; mantienilo come fallback cold-path invece di aggiungere cache di lookup nascoste. Quando l'input cambia, ricostruisci e sostituisci lo snapshot invece di mutarlo o mantenere copie storiche.
Le viste sul registro dei plugin attivo e gli helper di bootstrap dei canali bundled dovrebbero essere ricalcolati dal registro/root corrente. Mappe a vita breve vanno bene dentro una chiamata per deduplicare lavoro o proteggere dal rientro; non devono diventare cache di metadati di processo.

Per il caricamento dei plugin, il livello di cache persistente è il caricamento runtime. Può riutilizzare lo stato del loader quando codice o artefatti installati vengono effettivamente caricati, per esempio:

- `PluginLoaderCacheState` e registri runtime attivi compatibili
- cache jiti/moduli e cache dei loader di superficie pubblica usate per evitare di importare ripetutamente la stessa superficie runtime
- cache del filesystem per artefatti di plugin installati
- mappe per-call a vita breve per normalizzazione dei percorsi o risoluzione dei duplicati

Queste cache sono dettagli implementativi del data-plane. Non devono rispondere a domande del control-plane come "quale plugin possiede questo provider?" a meno che il caller non abbia richiesto deliberatamente il caricamento runtime.

Non aggiungere cache persistenti o basate sull'orologio per:

- risultati di scoperta
- registri manifest diretti
- registri manifest ricostruiti dall'indice dei plugin installati
- lookup del proprietario del provider, soppressione del modello, policy del provider o metadati degli artefatti pubblici
- qualsiasi altra risposta derivata dal manifest in cui un manifest modificato, un indice installato o un percorso di caricamento dovrebbe essere visibile alla lettura successiva dei metadati

I caller che ricostruiscono i metadati del manifest dall'indice persistito dei plugin installati ricostruiscono quel registro on demand. L'indice installato è stato durevole del source-plane; non è una cache di metadati in-process nascosta.

## Modello di registro

I plugin caricati non mutano direttamente globali core casuali. Si registrano in un registro centrale dei plugin.

Il registro tiene traccia di:

- record dei plugin (identità, sorgente, origine, stato, diagnostica)
- strumenti
- hook legacy e hook tipizzati
- canali
- provider
- gestori RPC del Gateway
- route HTTP
- registrar CLI
- servizi in background
- comandi posseduti dai plugin

Le funzionalità core leggono poi da quel registro invece di parlare direttamente con i moduli plugin. Questo mantiene il caricamento unidirezionale:

- modulo plugin -> registrazione nel registro
- runtime core -> consumo del registro

Questa separazione è importante per la manutenibilità. Significa che la maggior parte delle superfici core ha bisogno di un solo punto di integrazione: "leggi il registro", non "gestisci in modo speciale ogni modulo plugin".

## Callback di associazione conversazione

I plugin che associano una conversazione possono reagire quando un'approvazione viene risolta.

Usa `api.onConversationBindingResolved(...)` per ricevere una callback dopo che una richiesta di associazione viene approvata o negata:

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

Campi del payload della callback:

- `status`: `"approved"` o `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` o `"deny"`
- `binding`: l'associazione risolta per le richieste approvate
- `request`: il riepilogo della richiesta originale, suggerimento di detach, id mittente e metadati della conversazione

Questa callback è solo una notifica. Non cambia chi è autorizzato ad associare una conversazione, ed è eseguita dopo il completamento della gestione dell'approvazione core.

## Hook runtime dei provider

I plugin provider hanno tre livelli:

- **Metadati del manifest** per lookup economico pre-runtime:
  `setup.providers[].envVars`, compatibilità deprecata `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` e `channelEnvVars`.
- **Hook al momento della configurazione**: `catalog` (legacy `discovery`) più
  `applyConfigDefaults`.
- **Hook runtime**: oltre 40 hook opzionali che coprono auth, risoluzione dei modelli,
  wrapping dello stream, livelli di thinking, policy di replay ed endpoint di utilizzo. Vedi
  l'elenco completo in [Ordine e uso degli hook](#hook-order-and-usage).

OpenClaw possiede ancora il loop generico dell'agente, il failover, la gestione del transcript e la policy degli strumenti. Questi hook sono la superficie di estensione per il comportamento specifico dei provider senza richiedere un intero transport di inferenza personalizzato.

Usa `setup.providers[].envVars` del manifest quando il provider ha credenziali basate su env che i percorsi generici di auth/status/selettore modelli dovrebbero vedere senza caricare il runtime del plugin. `providerAuthEnvVars` deprecato viene ancora letto dall'adapter di compatibilità durante la finestra di deprecazione, e i plugin non bundled che lo usano ricevono una diagnostica del manifest. Usa `providerAuthAliases` del manifest quando un id provider dovrebbe riutilizzare env var, profili auth, auth supportata da configurazione e scelta di onboarding con API key di un altro id provider. Usa `providerAuthChoices` del manifest quando le superfici CLI di onboarding/scelta auth dovrebbero conoscere l'id scelta del provider, le etichette di gruppo e il cablaggio auth semplice con un flag senza caricare il runtime del provider. Mantieni `envVars` runtime del provider per suggerimenti rivolti agli operatori, come etichette di onboarding o variabili di setup OAuth client-id/client-secret.

Usa `channelEnvVars` del manifest quando un canale ha auth o setup guidati da env che il fallback shell-env generico, i controlli config/status o i prompt di setup dovrebbero vedere senza caricare il runtime del canale.

### Ordine e uso degli hook

Per i plugin modello/provider, OpenClaw chiama gli hook in questo ordine approssimativo.
La colonna "Quando usarlo" è la guida rapida alla decisione.
I campi provider di sola compatibilità che OpenClaw non chiama più, come
`ProviderPlugin.capabilities` e `suppressBuiltInModel`, sono intenzionalmente non
elencati qui.

| #   | Hook                              | Cosa fa                                                                                                   | Quando usarlo                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Pubblica la configurazione del provider in `models.providers` durante la generazione di `models.json`                                | Il provider possiede un catalogo o valori predefiniti per l'URL di base                                                                                                  |
| 2   | `applyConfigDefaults`             | Applica i valori predefiniti della configurazione globale posseduti dal provider durante la materializzazione della configurazione                                      | I valori predefiniti dipendono dalla modalità di autenticazione, dall'ambiente o dalla semantica della famiglia di modelli del provider                                                                         |
| --  | _(ricerca modello integrata)_         | OpenClaw prova prima il normale percorso registro/catalogo                                                          | _(non è un hook di Plugin)_                                                                                                                         |
| 3   | `normalizeModelId`                | Normalizza alias legacy o di anteprima degli ID modello prima della ricerca                                                     | Il provider possiede la pulizia degli alias prima della risoluzione canonica del modello                                                                                 |
| 4   | `normalizeTransport`              | Normalizza `api` / `baseUrl` della famiglia di provider prima dell'assemblaggio generico del modello                                      | Il provider possiede la pulizia del trasporto per ID provider personalizzati nella stessa famiglia di trasporto                                                          |
| 5   | `normalizeConfig`                 | Normalizza `models.providers.<id>` prima della risoluzione runtime/provider                                           | Il provider richiede una pulizia della configurazione che dovrebbe risiedere nel Plugin; gli helper della famiglia Google in bundle fungono anche da supporto per le voci di configurazione Google supportate   |
| 6   | `applyNativeStreamingUsageCompat` | Applica riscritture di compatibilità dell'uso dello streaming nativo ai provider di configurazione                                               | Il provider richiede correzioni dei metadati di uso dello streaming nativo guidate dall'endpoint                                                                          |
| 7   | `resolveConfigApiKey`             | Risolve l'autenticazione con marker env per i provider di configurazione prima del caricamento dell'autenticazione runtime                                       | Il provider ha una risoluzione delle chiavi API con marker env posseduta dal provider; anche `amazon-bedrock` ha qui un resolver integrato per marker env AWS                  |
| 8   | `resolveSyntheticAuth`            | Espone l'autenticazione locale/self-hosted o basata su configurazione senza salvare testo in chiaro                                   | Il provider può operare con un marker di credenziale sintetica/locale                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | Sovrappone profili di autenticazione esterni posseduti dal provider; il valore predefinito di `persistence` è `runtime-only` per credenziali possedute da CLI/app | Il provider riutilizza credenziali di autenticazione esterne senza salvare token di refresh copiati; dichiarare `contracts.externalAuthProviders` nel manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Abbassa la precedenza dei segnaposto di profilo sintetico salvati rispetto all'autenticazione basata su env/config                                      | Il provider salva profili segnaposto sintetici che non dovrebbero avere precedenza                                                                 |
| 11  | `resolveDynamicModel`             | Fallback sincrono per ID modello posseduti dal provider non ancora presenti nel registro locale                                       | Il provider accetta ID modello upstream arbitrari                                                                                                 |
| 12  | `prepareDynamicModel`             | Warm-up asincrono, quindi `resolveDynamicModel` viene eseguito di nuovo                                                           | Il provider richiede metadati di rete prima di risolvere ID sconosciuti                                                                                  |
| 13  | `normalizeResolvedModel`          | Riscrittura finale prima che il runner incorporato usi il modello risolto                                               | Il provider richiede riscritture del trasporto ma usa comunque un trasporto core                                                                             |
| 14  | `contributeResolvedModelCompat`   | Contribuisce flag di compatibilità per modelli vendor dietro un altro trasporto compatibile                                  | Il provider riconosce i propri modelli su trasporti proxy senza prendere il controllo del provider                                                       |
| 15  | `normalizeToolSchemas`            | Normalizza gli schemi degli strumenti prima che il runner incorporato li veda                                                    | Il provider richiede la pulizia degli schemi della famiglia di trasporto                                                                                                |
| 16  | `inspectToolSchemas`              | Espone diagnostica degli schemi posseduta dal provider dopo la normalizzazione                                                  | Il provider vuole avvisi sulle keyword senza insegnare al core regole specifiche del provider                                                                 |
| 17  | `resolveReasoningOutputMode`      | Seleziona il contratto di output di ragionamento nativo o con tag                                                              | Il provider richiede output di ragionamento/finale con tag invece di campi nativi                                                                         |
| 18  | `prepareExtraParams`              | Normalizzazione dei parametri di richiesta prima dei wrapper generici per le opzioni di stream                                              | Il provider richiede parametri di richiesta predefiniti o pulizia dei parametri per provider                                                                           |
| 19  | `createStreamFn`                  | Sostituisce completamente il normale percorso di stream con un trasporto personalizzato                                                   | Il provider richiede un protocollo wire personalizzato, non solo un wrapper                                                                                     |
| 20  | `wrapStreamFn`                    | Wrapper di stream dopo l'applicazione dei wrapper generici                                                              | Il provider richiede wrapper di compatibilità per header/corpo/modello della richiesta senza un trasporto personalizzato                                                          |
| 21  | `resolveTransportTurnState`       | Allega header o metadati nativi per turno del trasporto                                                           | Il provider vuole che i trasporti generici inviino l'identità di turno nativa del provider                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | Allega header WebSocket nativi o criteri di cool-down della sessione                                                    | Il provider vuole che i trasporti WS generici regolino header di sessione o criteri di fallback                                                               |
| 23  | `formatApiKey`                    | Formatter del profilo di autenticazione: il profilo salvato diventa la stringa runtime `apiKey`                                     | Il provider salva metadati di autenticazione aggiuntivi e richiede una forma personalizzata del token runtime                                                                    |
| 24  | `refreshOAuth`                    | Override del refresh OAuth per endpoint di refresh personalizzati o criteri di errore refresh                                  | Il provider non si adatta ai refresher condivisi `pi-ai`                                                                                           |
| 25  | `buildAuthDoctorHint`             | Suggerimento di riparazione aggiunto quando il refresh OAuth fallisce                                                                  | Il provider richiede indicazioni di riparazione dell'autenticazione possedute dal provider dopo un errore di refresh                                                                      |
| 26  | `matchesContextOverflowError`     | Matcher di overflow della finestra di contesto posseduto dal provider                                                                 | Il provider ha errori raw di overflow che le euristiche generiche non rileverebbero                                                                                |
| 27  | `classifyFailoverReason`          | Classificazione del motivo di failover posseduta dal provider                                                                  | Il provider può mappare errori raw di API/trasporto a rate-limit/overload/ecc.                                                                          |
| 28  | `isCacheTtlEligible`              | Criterio di prompt cache per provider proxy/backhaul                                                               | Il provider richiede gating TTL della cache specifico del proxy                                                                                                |
| 29  | `buildMissingAuthMessage`         | Sostituzione del messaggio generico di recupero per autenticazione mancante                                                      | Il provider richiede un suggerimento di recupero per autenticazione mancante specifico del provider                                                                                 |
| 30  | `augmentModelCatalog`             | Righe sintetiche/finali del catalogo aggiunte dopo la discovery                                                          | Il provider richiede righe sintetiche di compatibilità futura in `models list` e nei selettori                                                                     |
| 31  | `resolveThinkingProfile`          | Set di livelli `/think` specifico del modello, etichette di visualizzazione e valore predefinito                                                 | Il provider espone una scala di pensiero personalizzata o un'etichetta binaria per modelli selezionati                                                                 |
| 32  | `isBinaryThinking`                | Hook di compatibilità per toggle di ragionamento on/off                                                                     | Il provider espone solo pensiero binario on/off                                                                                                  |
| 33  | `supportsXHighThinking`           | Hook di compatibilità per supporto al ragionamento `xhigh`                                                                   | Il provider vuole `xhigh` solo su un sottoinsieme di modelli                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | Hook di compatibilità per il livello `/think` predefinito                                                                      | Il provider possiede il criterio `/think` predefinito per una famiglia di modelli                                                                                      |
| 35  | `isModernModelRef`                | Matcher di modelli moderni per filtri di profilo live e selezione smoke                                              | Il provider possiede il matching dei modelli preferiti live/smoke                                                                                             |
| 36  | `prepareRuntimeAuth`              | Scambia una credenziale configurata con il token/chiave runtime effettivo subito prima dell'inferenza                       | Il provider richiede uno scambio di token o una credenziale di richiesta di breve durata                                                                             |
| 37  | `resolveUsageAuth`                | Risolve le credenziali di utilizzo/fatturazione per `/usage` e le superfici di stato correlate                                     | Il provider richiede un parsing personalizzato dei token di utilizzo/quota o una credenziale di utilizzo diversa                                                               |
| 38  | `fetchUsageSnapshot`              | Recupera e normalizza snapshot di utilizzo/quota specifici del provider dopo la risoluzione dell'autenticazione                             | Il provider richiede un endpoint di utilizzo specifico del provider o un parser del payload                                                                           |
| 39  | `createEmbeddingProvider`         | Crea un adattatore di embedding gestito dal provider per memoria/ricerca                                                     | Il comportamento di embedding della memoria appartiene al Plugin del provider                                                                                    |
| 40  | `buildReplayPolicy`               | Restituisce una policy di replay che controlla la gestione della trascrizione per il provider                                        | Il provider richiede una policy di trascrizione personalizzata (ad esempio, la rimozione dei blocchi di ragionamento)                                                               |
| 41  | `sanitizeReplayHistory`           | Riscrive la cronologia di replay dopo la pulizia generica della trascrizione                                                        | Il provider richiede riscritture di replay specifiche del provider oltre agli helper di compattazione condivisi                                                             |
| 42  | `validateReplayTurns`             | Validazione finale dei turni di replay o rimodellamento prima del runner incorporato                                           | Il trasporto del provider richiede una validazione dei turni più rigorosa dopo la sanificazione generica                                                                    |
| 43  | `onModelSelected`                 | Esegue effetti collaterali post-selezione gestiti dal provider                                                                 | Il provider richiede telemetria o stato gestito dal provider quando un modello diventa attivo                                                                  |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` controllano prima il
plugin provider corrispondente, poi passano agli altri plugin provider con hook
finché uno non modifica effettivamente l'ID del modello o il trasporto/la configurazione. Questo mantiene funzionanti
gli shim provider di alias/compatibilità senza richiedere al chiamante di sapere quale
plugin in bundle possiede la riscrittura. Se nessun hook provider riscrive una voce di configurazione
supportata della famiglia Google, il normalizzatore della configurazione Google in bundle applica comunque
quella pulizia di compatibilità.

Se il provider richiede un protocollo di comunicazione completamente personalizzato o un esecutore di richieste personalizzato,
questa è una classe diversa di estensione. Questi hook sono per il comportamento del provider
che viene comunque eseguito nel normale ciclo di inferenza di OpenClaw.

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

I plugin provider in bundle combinano gli hook sopra per adattarsi al catalogo,
all'autenticazione, al thinking, al replay e alle esigenze di utilizzo di ciascun fornitore. L'insieme autorevole degli hook risiede con
ciascun plugin sotto `extensions/`; questa pagina illustra le forme invece di
rispecchiarne l'elenco.

<AccordionGroup>
  <Accordion title="Provider con catalogo pass-through">
    OpenRouter, Kilocode, Z.AI, xAI registrano `catalog` più
    `resolveDynamicModel` / `prepareDynamicModel` così possono esporre gli ID dei modelli upstream
    prima del catalogo statico di OpenClaw.
  </Accordion>
  <Accordion title="Provider con endpoint OAuth e utilizzo">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai abbinano
    `prepareRuntimeAuth` o `formatApiKey` a `resolveUsageAuth` +
    `fetchUsageSnapshot` per possedere lo scambio di token e l'integrazione `/usage`.
  </Accordion>
  <Accordion title="Famiglie di replay e pulizia delle trascrizioni">
    Le famiglie denominate condivise (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permettono ai provider di aderire
    alla policy delle trascrizioni tramite `buildReplayPolicy` invece che far
    reimplementare la pulizia a ogni plugin.
  </Accordion>
  <Accordion title="Provider solo catalogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` e
    `volcengine` registrano solo `catalog` e usano il ciclo di inferenza condiviso.
  </Accordion>
  <Accordion title="Helper di stream specifici di Anthropic">
    Gli header beta, `/fast` / `serviceTier` e `context1m` risiedono nel
    seam pubblico `api.ts` / `contract-api.ts` del plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) invece che
    nell'SDK generico.
  </Accordion>
</AccordionGroup>

## Helper di runtime

I plugin possono accedere a helper core selezionati tramite `api.runtime`. Per TTS:

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
- Restituisce buffer audio PCM + frequenza di campionamento. I plugin devono ricampionare/codificare per i provider.
- `listVoices` è opzionale per provider. Usalo per selettori di voci posseduti dal fornitore o flussi di configurazione.
- Gli elenchi di voci possono includere metadati più ricchi, come tag di lingua, genere e personalità per selettori consapevoli del provider.
- OpenAI ed ElevenLabs supportano oggi la telefonia. Microsoft no.

I plugin possono anche registrare provider vocali tramite `api.registerSpeechProvider(...)`.

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

- Mantieni la policy TTS, il fallback e la consegna delle risposte nel core.
- Usa i provider vocali per il comportamento di sintesi posseduto dal fornitore.
- L'input Microsoft legacy `edge` viene normalizzato nell'ID provider `microsoft`.
- Il modello di proprietà preferito è orientato all'azienda: un plugin fornitore può possedere
  provider di testo, voce, immagine e media futuri man mano che OpenClaw aggiunge quei
  contratti di capacità.

Per la comprensione di immagini/audio/video, i plugin registrano un provider tipizzato di
comprensione media invece di una borsa generica chiave/valore:

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

- Mantieni orchestrazione, fallback, configurazione e collegamento dei canali nel core.
- Mantieni il comportamento del fornitore nel plugin provider.
- L'espansione additiva deve restare tipizzata: nuovi metodi opzionali, nuovi campi risultato opzionali, nuove capacità opzionali.
- La generazione video segue già lo stesso pattern:
  - il core possiede il contratto di capacità e l'helper di runtime
  - i plugin fornitore registrano `api.registerVideoGenerationProvider(...)`
  - i plugin di funzionalità/canale consumano `api.runtime.videoGeneration.*`

Per gli helper di runtime di comprensione media, i plugin possono chiamare:

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

Per la trascrizione audio, i plugin possono usare il runtime di comprensione media
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
- Usa la configurazione audio di comprensione media core (`tools.media.audio`) e l'ordine di fallback dei provider.
- Restituisce `{ text: undefined }` quando non viene prodotto alcun output di trascrizione (per esempio input ignorato/non supportato).
- `api.runtime.stt.transcribeAudioFile(...)` rimane come alias di compatibilità.

I plugin possono anche avviare esecuzioni di subagent in background tramite `api.runtime.subagent`:

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
- Per le esecuzioni di fallback possedute dal plugin, gli operatori devono aderire con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` per limitare i plugin attendibili a target canonici `provider/model` specifici, oppure `"*"` per consentire esplicitamente qualunque target.
- Le esecuzioni subagent di plugin non attendibili funzionano comunque, ma le richieste di override vengono rifiutate invece di ricadere silenziosamente sul fallback.
- Le sessioni subagent create dai plugin sono etichettate con l'ID del plugin creatore. Il fallback `api.runtime.subagent.deleteSession(...)` può eliminare solo quelle sessioni possedute; l'eliminazione arbitraria di sessioni richiede comunque una richiesta Gateway con ambito admin.

Per la ricerca web, i plugin possono consumare l'helper di runtime condiviso invece di
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

I plugin possono anche registrare provider di ricerca web tramite
`api.registerWebSearchProvider(...)`.

Note:

- Mantieni selezione del provider, risoluzione delle credenziali e semantica condivisa delle richieste nel core.
- Usa i provider di ricerca web per trasporti di ricerca specifici del fornitore.
- `api.runtime.webSearch.*` è la superficie condivisa preferita per i plugin di funzionalità/canale che hanno bisogno del comportamento di ricerca senza dipendere dal wrapper degli strumenti dell'agente.

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

## Route HTTP del Gateway

I plugin possono esporre endpoint HTTP con `api.registerHttpRoute(...)`.

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

- `path`: percorso della route sotto il server HTTP del gateway.
- `auth`: obbligatorio. Usa `"gateway"` per richiedere la normale autenticazione del gateway, oppure `"plugin"` per autenticazione/verifica webhook gestita dal plugin.
- `match`: opzionale. `"exact"` (predefinito) o `"prefix"`.
- `replaceExisting`: opzionale. Consente allo stesso plugin di sostituire la propria registrazione route esistente.
- `handler`: restituisci `true` quando la route ha gestito la richiesta.

Note:

- `api.registerHttpHandler(...)` è stato rimosso e causerà un errore di caricamento del plugin. Usa invece `api.registerHttpRoute(...)`.
- Le route del plugin devono dichiarare esplicitamente `auth`.
- I conflitti esatti di `path + match` vengono rifiutati a meno che `replaceExisting: true`, e un plugin non può sostituire la route di un altro plugin.
- Le route sovrapposte con livelli `auth` diversi vengono rifiutate. Mantieni le catene di fallback `exact`/`prefix` solo sullo stesso livello di auth.
- Le route `auth: "plugin"` **non** ricevono automaticamente gli scope runtime dell'operatore. Sono destinate a webhook gestiti dal plugin/verifica delle firme, non a chiamate privilegiate agli helper del Gateway.
- Le route `auth: "gateway"` vengono eseguite dentro uno scope runtime di richiesta Gateway, ma tale scope è intenzionalmente conservativo:
  - l'autenticazione bearer con segreto condiviso (`gateway.auth.mode = "token"` / `"password"`) mantiene gli scope runtime delle route del plugin fissati a `operator.write`, anche se il chiamante invia `x-openclaw-scopes`
  - le modalità HTTP attendibili che includono un'identità (per esempio `trusted-proxy` o `gateway.auth.mode = "none"` su un ingresso privato) rispettano `x-openclaw-scopes` solo quando l'header è esplicitamente presente
  - se `x-openclaw-scopes` è assente su quelle richieste di route del plugin che includono un'identità, lo scope runtime torna a `operator.write`
- Regola pratica: non presumere che una route del plugin con auth gateway sia una superficie admin implicita. Se la tua route richiede comportamento riservato agli admin, richiedi una modalità di autenticazione che includa un'identità e documenta il contratto esplicito dell'header `x-openclaw-scopes`.

## Percorsi di import del Plugin SDK

Usa sottopercorsi SDK ristretti invece del barrel root monolitico `openclaw/plugin-sdk`
quando crei nuovi plugin. Sottopercorsi core:

| Sottopercorso                       | Scopo                                              |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitive di registrazione Plugin                  |
| `openclaw/plugin-sdk/channel-core`  | Helper di entry/build per canali                   |
| `openclaw/plugin-sdk/core`          | Helper condivisi generici e contratto ombrello     |
| `openclaw/plugin-sdk/config-schema` | Schema Zod root di `openclaw.json` (`OpenClawSchema`) |

I plugin di canale scelgono da una famiglia di interfacce ristrette — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` e `channel-actions`. Il comportamento di approvazione dovrebbe consolidarsi
su un unico contratto `approvalCapability` invece di mescolarsi tra campi
plugin non correlati. Vedi [Plugin di canale](/it/plugins/sdk-channel-plugins).

Gli helper runtime e di configurazione vivono sotto sottopercorsi `*-runtime`
focalizzati e corrispondenti (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, ecc.). Preferisci `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` e `config-mutation`
al posto dell'ampio barrel di compatibilità `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
e `openclaw/plugin-sdk/infra-runtime` sono shim di compatibilità deprecati per
plugin più vecchi. Il nuovo codice dovrebbe invece importare primitive generiche più ristrette.
</Info>

Entry point interni al repo (per root package di ciascun plugin incluso):

- `index.js` — entry del plugin incluso
- `api.js` — barrel di helper/tipi
- `runtime-api.js` — barrel solo runtime
- `setup-entry.js` — entry del plugin di setup

I plugin esterni dovrebbero importare solo sottopercorsi `openclaw/plugin-sdk/*`. Non
importare mai `src/*` del package di un altro plugin dal core o da un altro plugin.
Gli entry point caricati tramite facade preferiscono lo snapshot di configurazione runtime attivo quando
esiste, poi ripiegano sul file di configurazione risolto su disco.

Sottopercorsi specifici per capability come `image-generation`, `media-understanding`
e `speech` esistono perché i plugin inclusi li usano oggi. Non sono
automaticamente contratti esterni congelati a lungo termine — controlla la pagina di riferimento SDK
pertinente quando ti basi su di essi.

## Schemi degli strumenti messaggio

I plugin dovrebbero possedere i contributi allo schema `describeMessageTool(...)`
specifici del canale per primitive non di messaggio come reazioni, letture e sondaggi.
La presentazione di invio condivisa dovrebbe usare il contratto generico `MessagePresentation`
invece di campi pulsante, componente, blocco o scheda nativi del provider.
Vedi [Presentazione dei messaggi](/it/plugins/message-presentation) per il contratto,
le regole di fallback, la mappatura dei provider e la checklist per gli autori di plugin.

I plugin in grado di inviare dichiarano cosa possono renderizzare tramite capability dei messaggi:

- `presentation` per blocchi di presentazione semantici (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` per richieste di consegna fissata

Il core decide se renderizzare la presentazione nativamente o degradarla a testo.
Non esporre scappatoie UI native del provider dallo strumento messaggio generico.
Gli helper SDK deprecati per schemi nativi legacy restano esportati per i
plugin di terze parti esistenti, ma i nuovi plugin non dovrebbero usarli.

## Risoluzione del target del canale

I plugin di canale dovrebbero possedere la semantica dei target specifica del canale. Mantieni l'host
outbound condiviso generico e usa la superficie dell'adapter di messaggistica per le regole del provider:

- `messaging.inferTargetChatType({ to })` decide se un target normalizzato
  debba essere trattato come `direct`, `group` o `channel` prima della ricerca nella directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indica al core se un
  input debba saltare direttamente alla risoluzione tipo id invece della ricerca nella directory.
- `messaging.targetResolver.resolveTarget(...)` è il fallback del plugin quando
  il core necessita di una risoluzione finale di proprietà del provider dopo la normalizzazione o dopo un
  mancato riscontro nella directory.
- `messaging.resolveOutboundSessionRoute(...)` possiede la costruzione della route di sessione
  specifica del provider una volta risolto un target.

Suddivisione consigliata:

- Usa `inferTargetChatType` per decisioni di categoria che dovrebbero avvenire prima
  della ricerca di peer/gruppi.
- Usa `looksLikeId` per controlli "tratta questo come id target esplicito/nativo".
- Usa `resolveTarget` per fallback di normalizzazione specifici del provider, non per
  ricerche ampie nella directory.
- Mantieni id nativi del provider come id chat, id thread, JID, handle e id stanza
  dentro i valori `target` o parametri specifici del provider, non in campi SDK
  generici.

## Directory basate su configurazione

I plugin che derivano voci di directory dalla configurazione dovrebbero mantenere quella logica nel
plugin e riusare gli helper condivisi da
`openclaw/plugin-sdk/directory-runtime`.

Usalo quando un canale richiede peer/gruppi basati su configurazione come:

- peer DM guidati da allowlist
- mappe di canali/gruppi configurate
- fallback di directory statici con scope account

Gli helper condivisi in `directory-runtime` gestiscono solo operazioni generiche:

- filtraggio delle query
- applicazione del limite
- helper di deduplicazione/normalizzazione
- creazione di `ChannelDirectoryEntry[]`

L'ispezione dell'account specifica del canale e la normalizzazione degli id dovrebbero restare
nell'implementazione del plugin.

## Cataloghi dei provider

I plugin provider possono definire cataloghi di modelli per l'inferenza con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` restituisce la stessa forma che OpenClaw scrive in
`models.providers`:

- `{ provider }` per una voce provider
- `{ providers }` per più voci provider

Usa `catalog` quando il plugin possiede id modello specifici del provider, valori predefiniti
di base URL o metadati del modello vincolati dall'autenticazione.

`catalog.order` controlla quando il catalogo di un plugin viene unito rispetto ai provider
impliciti integrati di OpenClaw:

- `simple`: provider semplici guidati da chiave API o env
- `profile`: provider che appaiono quando esistono profili di autenticazione
- `paired`: provider che sintetizzano più voci provider correlate
- `late`: ultimo passaggio, dopo altri provider impliciti

I provider successivi vincono in caso di collisione di chiavi, quindi i plugin possono intenzionalmente sovrascrivere
una voce provider integrata con lo stesso id provider.

Compatibilità:

- `discovery` funziona ancora come alias legacy
- se sono registrati sia `catalog` sia `discovery`, OpenClaw usa `catalog`

## Ispezione di canale in sola lettura

Se il tuo plugin registra un canale, preferisci implementare
`plugin.config.inspectAccount(cfg, accountId)` insieme a `resolveAccount(...)`.

Perché:

- `resolveAccount(...)` è il percorso runtime. Può presumere che le credenziali
  siano completamente materializzate e può fallire rapidamente quando mancano segreti richiesti.
- I percorsi di comando in sola lettura come `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e i flussi doctor/config
  repair non dovrebbero dover materializzare credenziali runtime solo per
  descrivere la configurazione.

Comportamento consigliato di `inspectAccount(...)`:

- Restituisci solo stato descrittivo dell'account.
- Preserva `enabled` e `configured`.
- Includi campi di origine/stato delle credenziali quando pertinenti, come:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Non è necessario restituire valori token grezzi solo per segnalare la disponibilità
  in sola lettura. Restituire `tokenStatus: "available"` (e il campo origine
  corrispondente) è sufficiente per comandi in stile stato.
- Usa `configured_unavailable` quando una credenziale è configurata tramite SecretRef ma
  non disponibile nel percorso di comando corrente.

Questo consente ai comandi in sola lettura di segnalare "configurato ma non disponibile in questo percorso
di comando" invece di bloccarsi o segnalare erroneamente l'account come non configurato.

## Pack di package

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

Ogni entry diventa un plugin. Se il pack elenca più estensioni, l'id plugin
diventa `name/<fileBase>`.

Se il tuo plugin importa dipendenze npm, installale in quella directory così
`node_modules` sia disponibile (`npm install` / `pnpm install`).

Guardrail di sicurezza: ogni voce `openclaw.extensions` deve restare dentro la directory del plugin
dopo la risoluzione dei symlink. Le voci che escono dalla directory del package vengono
rifiutate.

Nota di sicurezza: `openclaw plugins install` installa le dipendenze del plugin con un
`npm install --omit=dev --ignore-scripts` locale al progetto (nessuno script di lifecycle,
nessuna dipendenza dev a runtime), ignorando le impostazioni npm globali ereditate.
Mantieni gli alberi di dipendenze del plugin "pure JS/TS" ed evita package che richiedono
build `postinstall`.

Facoltativo: `openclaw.setupEntry` può puntare a un modulo leggero solo per setup.
Quando OpenClaw ha bisogno di superfici di setup per un plugin di canale disabilitato, oppure
quando un plugin di canale è abilitato ma ancora non configurato, carica `setupEntry`
invece dell'entry completa del plugin. Questo mantiene startup e setup più leggeri
quando l'entry principale del plugin collega anche strumenti, hook o altro codice solo runtime.

Facoltativo: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
può far aderire un plugin di canale allo stesso percorso `setupEntry` durante la fase di startup
pre-ascolto del gateway, anche quando il canale è già configurato.

Usalo solo quando `setupEntry` copre completamente la superficie di startup che deve esistere
prima che il gateway inizi ad ascoltare. In pratica, significa che l'entry di setup
deve registrare ogni capability di proprietà del canale da cui lo startup dipende, come:

- la registrazione del canale stessa
- qualsiasi route HTTP che deve essere disponibile prima che il gateway inizi ad ascoltare
- qualsiasi metodo, strumento o servizio gateway che deve esistere durante la stessa finestra

Se la tua entry completa possiede ancora capability di startup richieste, non abilitare
questo flag. Mantieni il plugin sul comportamento predefinito e lascia che OpenClaw carichi
l'entry completa durante lo startup.

I canali inclusi possono anche pubblicare helper di superficie contratto solo setup che il core
può consultare prima che il runtime completo del canale sia caricato. La superficie di promozione
setup attuale è:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Il core usa questa superficie quando deve promuovere una configurazione legacy di canale ad account singolo in `channels.<id>.accounts.*` senza caricare l'intera voce del plugin. Matrix è l'esempio bundled attuale: sposta solo le chiavi di auth/bootstrap in un account promosso con nome quando esistono già account con nome, e può preservare una chiave configurata di account predefinito non canonica invece di creare sempre `accounts.default`.

Questi adattatori di patch di configurazione mantengono lazy la scoperta della superficie contrattuale bundled. Il tempo di import rimane leggero; la superficie di promozione viene caricata solo al primo utilizzo invece di rientrare nell'avvio del canale bundled durante l'import del modulo.

Quando queste superfici di avvio includono metodi RPC del Gateway, mantienili su un prefisso specifico del plugin. Gli spazi dei nomi di amministrazione core (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si risolvono sempre in `operator.admin`, anche se un plugin richiede un ambito più ristretto.

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

I plugin di canale possono pubblicizzare metadati di configurazione/scoperta tramite `openclaw.channel` e suggerimenti di installazione tramite `openclaw.install`. Questo mantiene il catalogo core privo di dati.

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
- `preferOver`: ID di plugin/canale a priorità più bassa che questa voce del catalogo dovrebbe superare
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controlli del testo per la superficie di selezione
- `markdownCapable`: contrassegna il canale come compatibile con Markdown per le decisioni di formattazione in uscita
- `exposure.configured`: nasconde il canale dalle superfici di elenco dei canali configurati quando impostato su `false`
- `exposure.setup`: nasconde il canale dai selettori interattivi di configurazione quando impostato su `false`
- `exposure.docs`: contrassegna il canale come interno/privato per le superfici di navigazione della documentazione
- `showConfigured` / `showInSetup`: alias legacy ancora accettati per compatibilità; preferisci `exposure`
- `quickstartAllowFrom`: abilita il canale al flusso quickstart standard `allowFrom`
- `forceAccountBinding`: richiede un binding esplicito dell'account anche quando esiste un solo account
- `preferSessionLookupForAnnounceTarget`: preferisce la ricerca della sessione durante la risoluzione dei target di annuncio

OpenClaw può anche unire **cataloghi di canali esterni** (per esempio, un export di registro MPM). Inserisci un file JSON in uno di questi percorsi:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oppure punta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a uno o più file JSON (delimitati da virgola/punto e virgola/`PATH`). Ogni file dovrebbe contenere `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Il parser accetta anche `"packages"` o `"plugins"` come alias legacy della chiave `"entries"`.

Le voci generate del catalogo dei canali e le voci del catalogo di installazione dei provider espongono i fatti normalizzati sulla sorgente di installazione accanto al blocco grezzo `openclaw.install`. I fatti normalizzati identificano se la specifica npm è una versione esatta o un selettore mobile, se i metadati di integrità previsti sono presenti e se è disponibile anche un percorso di sorgente locale. Quando l'identità del catalogo/pacchetto è nota, i fatti normalizzati avvisano se il nome del pacchetto npm analizzato diverge da tale identità. Avvisano anche quando `defaultChoice` non è valido o punta a una sorgente non disponibile, e quando i metadati di integrità npm sono presenti senza una sorgente npm valida. I consumer dovrebbero trattare `installSource` come campo opzionale additivo, così le voci create manualmente e gli shim di catalogo non devono sintetizzarlo. Questo consente a onboarding e diagnostica di spiegare lo stato del piano sorgente senza importare il runtime del plugin.

Le voci npm esterne ufficiali dovrebbero preferire un `npmSpec` esatto più `expectedIntegrity`. I nomi di pacchetto semplici e i dist-tag continuano a funzionare per compatibilità, ma mostrano avvisi del piano sorgente così il catalogo può muoversi verso installazioni fissate e verificate per integrità senza rompere i plugin esistenti. Quando l'onboarding installa da un percorso di catalogo locale, registra una voce gestita nell'indice dei plugin con `source: "path"` e un `sourcePath` relativo al workspace quando possibile. Il percorso di caricamento operativo assoluto rimane in `plugins.load.paths`; il record di installazione evita di duplicare i percorsi della workstation locale nella configurazione di lunga durata. Questo mantiene le installazioni di sviluppo locale visibili alla diagnostica del piano sorgente senza aggiungere una seconda superficie grezza di divulgazione del percorso del filesystem. L'indice dei plugin persistito `plugins/installs.json` è la fonte autorevole per la sorgente di installazione e può essere aggiornato senza caricare moduli runtime del plugin. La sua mappa `installRecords` è durevole anche quando un manifesto di plugin è mancante o non valido; il suo array `plugins` è una vista del manifesto ricostruibile.

## Plugin del motore di contesto

I plugin del motore di contesto possiedono l'orchestrazione del contesto di sessione per ingestione, assemblaggio e Compaction. Registrali dal tuo plugin con `api.registerContextEngine(id, factory)`, poi seleziona il motore attivo con `plugins.slots.contextEngine`.

Usalo quando il tuo plugin deve sostituire o estendere la pipeline di contesto predefinita invece di limitarsi ad aggiungere ricerca in memoria o hook.

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

Se il tuo motore **non** possiede l'algoritmo di Compaction, mantieni `compact()` implementato e delegalo esplicitamente:

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

## Aggiunta di una nuova capability

Quando un plugin ha bisogno di un comportamento che non rientra nell'API attuale, non bypassare il sistema di plugin con un accesso privato interno. Aggiungi la capability mancante.

Sequenza consigliata:

1. definisci il contratto core
   Decidi quale comportamento condiviso dovrebbe possedere il core: policy, fallback, merge della configurazione, ciclo di vita, semantica rivolta ai canali e forma degli helper runtime.
2. aggiungi superfici tipizzate di registrazione/runtime del plugin
   Estendi `OpenClawPluginApi` e/o `api.runtime` con la più piccola superficie tipizzata utile della capability.
3. collega core + consumer di canale/funzionalità
   I canali e i plugin di funzionalità dovrebbero consumare la nuova capability tramite il core, non importando direttamente un'implementazione vendor.
4. registra le implementazioni vendor
   I plugin vendor registrano quindi i propri backend rispetto alla capability.
5. aggiungi copertura del contratto
   Aggiungi test in modo che proprietà e forma della registrazione rimangano esplicite nel tempo.

È così che OpenClaw rimane opinionato senza diventare cablato sulla visione del mondo di un solo provider. Consulta il [Capability Cookbook](/it/plugins/architecture) per una checklist concreta dei file e un esempio svolto.

### Checklist della capability

Quando aggiungi una nuova capability, l'implementazione di solito dovrebbe toccare insieme queste superfici:

- tipi del contratto core in `src/<capability>/types.ts`
- helper runner/runtime core in `src/<capability>/runtime.ts`
- superficie di registrazione dell'API del plugin in `src/plugins/types.ts`
- collegamento del registro dei plugin in `src/plugins/registry.ts`
- esposizione runtime del plugin in `src/plugins/runtime/*` quando i plugin di funzionalità/canale devono consumarla
- helper di acquisizione/test in `src/test-utils/plugin-registration.ts`
- asserzioni di proprietà/contratto in `src/plugins/contracts/registry.ts`
- documentazione per operatori/plugin in `docs/`

Se una di queste superfici manca, di solito è un segno che la capability non è ancora pienamente integrata.

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

Pattern di test del contratto:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Questo mantiene semplice la regola:

- il core possiede il contratto della capability + orchestrazione
- i plugin vendor possiedono le implementazioni vendor
- i plugin di funzionalità/canale consumano gli helper runtime
- i test di contratto mantengono esplicita la proprietà

## Correlati

- [Architettura dei plugin](/it/plugins/architecture) — modello e forme pubbliche delle capability
- [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths)
- [Configurazione del Plugin SDK](/it/plugins/sdk-setup)
- [Creazione di plugin](/it/plugins/building-plugins)
