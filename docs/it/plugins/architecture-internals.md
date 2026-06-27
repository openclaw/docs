---
read_when:
    - Implementazione degli hook di runtime del provider, del ciclo di vita del canale o dei pacchetti package
    - Debug dell'ordine di caricamento dei Plugin o dello stato del registro
    - Aggiungere una nuova capacità di Plugin o un Plugin del motore di contesto
summary: 'Interni dell''architettura dei Plugin: pipeline di caricamento, registro, hook di runtime, route HTTP e tabelle di riferimento'
title: Interni dell'architettura dei Plugin
x-i18n:
    generated_at: "2026-06-27T17:46:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29abbd75d696a26cf33702a78abfcc987aaf5358eca2dc1ebe43f039f4ff6edf
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Per il modello di capability pubblico, le forme dei plugin e i contratti di proprietà/esecuzione, vedi [Architettura dei Plugin](/it/plugins/architecture). Questa pagina è il riferimento per i meccanismi interni: pipeline di caricamento, registro, hook di runtime, route HTTP del Gateway, percorsi di importazione e tabelle degli schemi.

## Pipeline di caricamento

All'avvio, OpenClaw fa più o meno questo:

1. scopre le root dei plugin candidati
2. legge i manifest dei bundle nativi o compatibili e i metadati dei pacchetti
3. rifiuta i candidati non sicuri
4. normalizza la configurazione dei plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide l'abilitazione di ogni candidato
6. carica i moduli nativi abilitati: i moduli bundled compilati usano un loader nativo;
   il sorgente TypeScript locale di terze parti usa il fallback di emergenza Jiti
7. chiama gli hook nativi `register(api)` e raccoglie le registrazioni nel registro dei plugin
8. espone il registro ai comandi e alle superfici di runtime

<Note>
`activate` è un alias legacy di `register`: il loader risolve quello presente (`def.register ?? def.activate`) e lo chiama nello stesso punto. Tutti i plugin bundled usano `register`; preferisci `register` per i nuovi plugin.
</Note>

I gate di sicurezza avvengono **prima** dell'esecuzione del runtime. I candidati vengono bloccati quando l'entry esce dalla root del plugin, il percorso è scrivibile da tutti, oppure la proprietà del percorso appare sospetta per plugin non bundled.

I candidati bloccati restano associati al loro id di plugin per la diagnostica. Se la configurazione fa ancora riferimento a quell'id, la validazione segnala il plugin come presente ma bloccato e rimanda all'avviso di sicurezza del percorso invece di trattare la voce di configurazione come obsoleta.

### Comportamento manifest-first

Il manifest è la fonte di verità del piano di controllo. OpenClaw lo usa per:

- identificare il plugin
- scoprire canali/skills/schema di configurazione dichiarati o capability del bundle
- validare `plugins.entries.<id>.config`
- arricchire etichette e placeholder della Control UI
- mostrare metadati di installazione/catalogo
- preservare descrittori economici di attivazione e setup senza caricare il runtime del plugin

Per i plugin nativi, il modulo di runtime è la parte del piano dati. Registra il comportamento effettivo, come hook, tool, comandi o flussi dei provider.

I blocchi opzionali `activation` e `setup` del manifest restano nel piano di controllo. Sono descrittori solo di metadati per la pianificazione dell'attivazione e la scoperta del setup; non sostituiscono la registrazione del runtime, `register(...)` o `setupEntry`.
I primi consumer di attivazione live ora usano gli indizi del manifest per comandi, canali e provider per restringere il caricamento dei plugin prima della materializzazione più ampia del registro:

- il caricamento della CLI restringe ai plugin che possiedono il comando primario richiesto
- la risoluzione di setup/plugin del canale restringe ai plugin che possiedono l'id del canale richiesto
- la risoluzione esplicita di setup/runtime del provider restringe ai plugin che possiedono l'id del provider richiesto
- la pianificazione dell'avvio del Gateway usa `activation.onStartup` per import espliciti all'avvio e opt-out dall'avvio; i plugin senza metadati di avvio vengono caricati solo tramite trigger di attivazione più ristretti

I preload del runtime al momento della richiesta che chiedono l'ambito ampio `all` derivano comunque un set esplicito di id plugin effettivi da configurazione, pianificazione dell'avvio, canali configurati, slot e regole di auto-abilitazione. Se quel set derivato è vuoto, OpenClaw carica un registro di runtime vuoto invece di allargarsi a ogni plugin scopribile.

Il pianificatore di attivazione espone sia un'API solo ids per i caller esistenti sia un'API di piano per la nuova diagnostica. Le voci del piano indicano perché un plugin è stato selezionato, separando gli indizi espliciti del pianificatore `activation.*` dalla proprietà di fallback del manifest, come `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` e hook. Questa separazione dei motivi è il confine di compatibilità: i metadati dei plugin esistenti continuano a funzionare, mentre il nuovo codice può rilevare indizi ampi o comportamento di fallback senza cambiare la semantica di caricamento del runtime.

La scoperta del setup ora preferisce id posseduti dal descrittore, come `setup.providers` e `setup.cliBackends`, per restringere i plugin candidati prima di ricadere su `setup-api` per i plugin che richiedono ancora hook di runtime al momento del setup. Gli elenchi di setup dei provider usano `providerAuthChoices` del manifest, scelte di setup derivate dal descrittore e metadati del catalogo di installazione senza caricare il runtime del provider. `setup.requiresRuntime: false` esplicito è un limite solo descrittore; `requiresRuntime` omesso mantiene il fallback legacy setup-api per compatibilità. Se più di un plugin scoperto rivendica lo stesso provider di setup normalizzato o lo stesso id backend CLI, la ricerca del setup rifiuta il proprietario ambiguo invece di basarsi sull'ordine di scoperta. Quando il runtime di setup viene eseguito, la diagnostica del registro segnala divergenze tra `setup.providers` / `setup.cliBackends` e i provider o backend CLI registrati da setup-api senza bloccare i plugin legacy.

### Confine della cache dei plugin

OpenClaw non memorizza nella cache i risultati della scoperta dei plugin o i dati diretti del registro dei manifest dietro finestre temporali. Installazioni, modifiche ai manifest e cambiamenti dei percorsi di caricamento devono diventare visibili alla successiva lettura esplicita dei metadati o ricostruzione dello snapshot.
Il parser dei file manifest può mantenere una cache limitata di firme file indicizzata dal percorso del manifest aperto, inode, dimensione e timestamp; quella cache evita solo il re-parsing di byte invariati e non deve memorizzare nella cache risposte di scoperta, registro, proprietario o policy.

Il percorso rapido sicuro dei metadati è la proprietà esplicita dell'oggetto, non una cache nascosta. I percorsi caldi di avvio del Gateway dovrebbero passare il `PluginMetadataSnapshot` corrente, la `PluginLookUpTable` derivata o un registro manifest esplicito lungo la catena di chiamate. Validazione della configurazione, auto-abilitazione all'avvio, bootstrap dei plugin e selezione dei provider possono riutilizzare quegli oggetti mentre rappresentano la configurazione e l'inventario dei plugin correnti. La ricerca del setup ricostruisce ancora i metadati del manifest su richiesta, a meno che il percorso di setup specifico riceva un registro manifest esplicito; mantienilo come fallback di percorso freddo invece di aggiungere cache di lookup nascoste. Quando l'input cambia, ricostruisci e sostituisci lo snapshot invece di modificarlo o conservarne copie storiche.
Le viste sul registro dei plugin attivo e gli helper di bootstrap dei canali bundled dovrebbero essere ricalcolati dal registro/root corrente. Mappe di breve durata vanno bene dentro una singola chiamata per deduplicare il lavoro o proteggere dal rientro; non devono diventare cache di metadati di processo.

Per il caricamento dei plugin, il livello di cache persistente è il caricamento del runtime. Può riutilizzare lo stato del loader quando codice o artifact installati vengono effettivamente caricati, ad esempio:

- `PluginLoaderCacheState` e registri di runtime attivi compatibili
- cache jiti/module e cache del loader della superficie pubblica usate per evitare di importare ripetutamente la stessa superficie di runtime
- cache del filesystem per artifact di plugin installati
- mappe per chiamata di breve durata per normalizzazione dei percorsi o risoluzione dei duplicati

Queste cache sono dettagli implementativi del piano dati. Non devono rispondere a domande del piano di controllo come "quale plugin possiede questo provider?" a meno che il caller non abbia richiesto deliberatamente il caricamento del runtime.

Non aggiungere cache persistenti o a tempo di orologio per:

- risultati di scoperta
- registri manifest diretti
- registri manifest ricostruiti dall'indice dei plugin installati
- lookup del proprietario del provider, soppressione del modello, policy del provider o metadati di artifact pubblici
- qualsiasi altra risposta derivata dal manifest in cui un manifest modificato, un indice installato o un percorso di caricamento dovrebbe essere visibile alla successiva lettura dei metadati

I caller che ricostruiscono metadati del manifest dall'indice persistito dei plugin installati ricostruiscono quel registro su richiesta. L'indice installato è stato durevole del piano sorgente; non è una cache di metadati in-process nascosta.

## Modello del registro

I plugin caricati non modificano direttamente globali core casuali. Si registrano in un registro centrale dei plugin.

Il registro traccia:

- record dei plugin (identità, sorgente, origine, stato, diagnostica)
- tool
- hook legacy e hook tipizzati
- canali
- provider
- handler RPC del Gateway
- route HTTP
- registrar CLI
- servizi in background
- comandi posseduti dai plugin

Le funzionalità core leggono poi da quel registro invece di parlare direttamente con i moduli dei plugin. Questo mantiene il caricamento a senso unico:

- modulo plugin -> registrazione nel registro
- runtime core -> consumo del registro

Questa separazione è importante per la manutenibilità. Significa che la maggior parte delle superfici core richiede un solo punto di integrazione: "leggi il registro", non "gestisci casi speciali per ogni modulo plugin".

## Callback di binding della conversazione

I plugin che collegano una conversazione possono reagire quando un'approvazione viene risolta.

Usa `api.onConversationBindingResolved(...)` per ricevere un callback dopo che una richiesta di binding viene approvata o negata:

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
- `request`: il riepilogo della richiesta originale, l'indizio di detach, l'id del mittente e i metadati della conversazione

Questo callback è solo una notifica. Non cambia chi è autorizzato a collegare una conversazione, e viene eseguito dopo il completamento della gestione dell'approvazione da parte del core.

## Hook di runtime dei provider

I plugin provider hanno tre livelli:

- **Metadati del manifest** per lookup economico pre-runtime:
  `setup.providers[].envVars`, compatibilità deprecata `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` e `channelEnvVars`.
- **Hook al momento della configurazione**: `catalog` (legacy `discovery`) più
  `applyConfigDefaults`.
- **Hook di runtime**: oltre 40 hook opzionali che coprono auth, risoluzione dei modelli,
  wrapping dello stream, livelli di thinking, policy di replay ed endpoint di utilizzo. Vedi
  l'elenco completo in [Ordine e utilizzo degli hook](#hook-order-and-usage).

OpenClaw possiede ancora il loop agente generico, failover, gestione dei transcript e policy dei tool. Questi hook sono la superficie di estensione per comportamento specifico del provider senza richiedere un intero transport di inferenza custom.

Usa `setup.providers[].envVars` del manifest quando il provider ha credenziali basate su env che i percorsi generici di auth/status/model-picker dovrebbero vedere senza caricare il runtime del plugin. `providerAuthEnvVars` deprecato è ancora letto dall'adapter di compatibilità durante la finestra di deprecazione, e i plugin non bundled che lo usano ricevono una diagnostica del manifest. Usa `providerAuthAliases` del manifest quando un id provider dovrebbe riutilizzare env var, profili auth, auth basata su configurazione e scelta di onboarding della chiave API di un altro id provider. Usa `providerAuthChoices` del manifest quando le superfici CLI di onboarding/scelta auth dovrebbero conoscere l'id scelta del provider, le etichette di gruppo e il semplice cablaggio auth con un solo flag senza caricare il runtime del provider. Mantieni `envVars` del runtime provider per indizi rivolti agli operatori, come etichette di onboarding o variabili di setup OAuth client-id/client-secret.

Usa `channelEnvVars` del manifest quando un canale ha auth o setup guidati da env che fallback shell-env generico, controlli config/status o prompt di setup dovrebbero vedere senza caricare il runtime del canale.

### Ordine e utilizzo degli hook

Per i plugin di modello/provider, OpenClaw chiama gli hook in questo ordine approssimativo.
La colonna "Quando usare" è la guida rapida alla decisione.
I campi provider solo di compatibilità che OpenClaw non chiama più, come `ProviderPlugin.capabilities` e `suppressBuiltInModel`, sono intenzionalmente non elencati qui.

| #   | Hook                              | Cosa fa                                                                                                                        | Quando usarlo                                                                                                                                                    |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Pubblica la configurazione del provider in `models.providers` durante la generazione di `models.json`                          | Il provider possiede un catalogo o valori predefiniti per l'URL di base                                                                                          |
| 2   | `applyConfigDefaults`             | Applica i valori predefiniti della configurazione globale di proprietà del provider durante la materializzazione della config   | I valori predefiniti dipendono dalla modalità di auth, dall'env o dalla semantica della famiglia di modelli del provider                                         |
| --  | _(lookup del modello integrato)_  | OpenClaw prova prima il normale percorso registro/catalogo                                                                     | _(non è un hook di plugin)_                                                                                                                                      |
| 3   | `normalizeModelId`                | Normalizza alias legacy o di anteprima degli ID modello prima del lookup                                                       | Il provider gestisce la pulizia degli alias prima della risoluzione canonica del modello                                                                         |
| 4   | `normalizeTransport`              | Normalizza `api` / `baseUrl` della famiglia di provider prima dell'assemblaggio generico del modello                           | Il provider gestisce la pulizia del trasporto per ID provider personalizzati nella stessa famiglia di trasporto                                                  |
| 5   | `normalizeConfig`                 | Normalizza `models.providers.<id>` prima della risoluzione runtime/provider                                                    | Il provider necessita di pulizia della config che deve vivere con il plugin; gli helper bundled della famiglia Google supportano anche le voci di config Google supportate |
| 6   | `applyNativeStreamingUsageCompat` | Applica riscritture di compatibilità per l'uso dello streaming nativo ai provider di config                                    | Il provider necessita di correzioni dei metadati di uso dello streaming nativo guidate dall'endpoint                                                             |
| 7   | `resolveConfigApiKey`             | Risolve l'auth con marker env per i provider di config prima del caricamento dell'auth runtime                                 | I provider espongono i propri hook di risoluzione della chiave API con marker env                                                                                |
| 8   | `resolveSyntheticAuth`            | Espone auth locale/self-hosted o supportata da config senza rendere persistente il testo in chiaro                             | Il provider può operare con un marker di credenziale sintetica/locale                                                                                            |
| 9   | `resolveExternalAuthProfiles`     | Sovrappone profili auth esterni di proprietà del provider; il `persistence` predefinito è `runtime-only` per credenziali di proprietà di CLI/app | Il provider riusa credenziali auth esterne senza rendere persistenti i token di refresh copiati; dichiara `contracts.externalAuthProviders` nel manifest         |
| 10  | `shouldDeferSyntheticProfileAuth` | Abbassa la precedenza dei segnaposto dei profili sintetici salvati dietro auth supportata da env/config                        | Il provider memorizza profili segnaposto sintetici che non devono prevalere                                                                                      |
| 11  | `resolveDynamicModel`             | Fallback sincrono per ID modello di proprietà del provider non ancora presenti nel registro locale                             | Il provider accetta ID modello upstream arbitrari                                                                                                                |
| 12  | `prepareDynamicModel`             | Warm-up asincrono, poi `resolveDynamicModel` viene eseguito di nuovo                                                           | Il provider necessita di metadati di rete prima di risolvere ID sconosciuti                                                                                      |
| 13  | `normalizeResolvedModel`          | Riscrittura finale prima che il runner incorporato usi il modello risolto                                                      | Il provider necessita di riscritture del trasporto ma usa ancora un trasporto core                                                                               |
| 14  | `normalizeToolSchemas`            | Normalizza gli schemi degli strumenti prima che il runner incorporato li veda                                                  | Il provider necessita di pulizia degli schemi della famiglia di trasporto                                                                                        |
| 15  | `inspectToolSchemas`              | Espone diagnostica degli schemi di proprietà del provider dopo la normalizzazione                                               | Il provider vuole avvisi sulle keyword senza insegnare al core regole specifiche del provider                                                                    |
| 16  | `resolveReasoningOutputMode`      | Seleziona il contratto di output di ragionamento nativo o con tag                                                              | Il provider necessita di ragionamento/output finale con tag invece dei campi nativi                                                                              |
| 17  | `prepareExtraParams`              | Normalizzazione dei parametri di richiesta prima dei wrapper generici delle opzioni di stream                                  | Il provider necessita di parametri di richiesta predefiniti o di pulizia dei parametri per provider                                                              |
| 18  | `createStreamFn`                  | Sostituisce completamente il normale percorso di stream con un trasporto personalizzato                                        | Il provider necessita di un protocollo wire personalizzato, non solo di un wrapper                                                                               |
| 20  | `wrapStreamFn`                    | Wrapper dello stream dopo l'applicazione dei wrapper generici                                                                  | Il provider necessita di wrapper di compatibilità per header/body/model della richiesta senza un trasporto personalizzato                                        |
| 21  | `resolveTransportTurnState`       | Allega header o metadati di trasporto nativi per turno                                                                         | Il provider vuole che i trasporti generici inviino l'identità di turno nativa del provider                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | Allega header WebSocket nativi o policy di cool-down della sessione                                                            | Il provider vuole che i trasporti WS generici regolino header di sessione o policy di fallback                                                                  |
| 23  | `formatApiKey`                    | Formatter del profilo auth: il profilo salvato diventa la stringa `apiKey` del runtime                                         | Il provider memorizza metadati auth aggiuntivi e necessita di una forma token runtime personalizzata                                                            |
| 24  | `refreshOAuth`                    | Override del refresh OAuth per endpoint di refresh personalizzati o policy di errore del refresh                               | Il provider non si adatta ai refresher OpenClaw condivisi                                                                                                       |
| 25  | `buildAuthDoctorHint`             | Suggerimento di riparazione aggiunto quando il refresh OAuth fallisce                                                          | Il provider necessita di guida alla riparazione dell'auth di proprietà del provider dopo un errore di refresh                                                    |
| 26  | `matchesContextOverflowError`     | Matcher di overflow della finestra di contesto di proprietà del provider                                                       | Il provider ha errori di overflow grezzi che le euristiche generiche non rileverebbero                                                                           |
| 27  | `classifyFailoverReason`          | Classificazione del motivo di failover di proprietà del provider                                                               | Il provider può mappare errori API/trasporto grezzi a rate limit/overload/ecc.                                                                                   |
| 28  | `isCacheTtlEligible`              | Policy della cache dei prompt per provider proxy/backhaul                                                                      | Il provider necessita di gating TTL della cache specifico per proxy                                                                                              |
| 29  | `buildMissingAuthMessage`         | Sostituzione del messaggio generico di recupero per auth mancante                                                              | Il provider necessita di un suggerimento di recupero per auth mancante specifico del provider                                                                    |
| 30  | `augmentModelCatalog`             | Righe sintetiche/finali del catalogo aggiunte dopo la discovery                                                                | Il provider necessita di righe sintetiche di compatibilità futura in `models list` e nei selettori                                                               |
| 31  | `resolveThinkingProfile`          | Set di livelli `/think` specifico del modello, etichette visualizzate e valore predefinito                                     | Il provider espone una scala di thinking personalizzata o un'etichetta binaria per modelli selezionati                                                          |
| 32  | `isBinaryThinking`                | Hook di compatibilità per toggle on/off del ragionamento                                                                       | Il provider espone solo thinking binario on/off                                                                                                                  |
| 33  | `supportsXHighThinking`           | Hook di compatibilità per il supporto al ragionamento `xhigh`                                                                  | Il provider vuole `xhigh` solo su un sottoinsieme di modelli                                                                                                      |
| 34  | `resolveDefaultThinkingLevel`     | Hook di compatibilità per il livello `/think` predefinito                                                                      | Il provider possiede la policy `/think` predefinita per una famiglia di modelli                                                                                  |
| 35  | `isModernModelRef`                | Matcher di modello moderno per filtri dei profili live e selezione smoke                                                       | Il provider possiede il matching dei modelli preferiti live/smoke                                                                                                |
| 36  | `prepareRuntimeAuth`              | Scambia una credenziale configurata con il token/la chiave runtime effettivi appena prima dell'inferenza                       | Il provider necessita di uno scambio di token o di una credenziale di richiesta a breve durata                                                                   |
| 37  | `resolveUsageAuth`                | Risolve credenziali d'uso/fatturazione per `/usage` e superfici di stato correlate                                             | Il provider necessita di parsing personalizzato del token uso/quota o di una credenziale d'uso diversa                                                           |
| 38  | `fetchUsageSnapshot`              | Recupera e normalizza snapshot di utilizzo/quota specifici del provider dopo la risoluzione dell'autenticazione | Il provider richiede un endpoint di utilizzo specifico del provider o un parser del payload                                                   |
| 39  | `createEmbeddingProvider`         | Crea un adapter di embedding di proprietà del provider per memoria/ricerca                                      | Il comportamento degli embedding di memoria deve risiedere nel Plugin del provider                                                            |
| 40  | `buildReplayPolicy`               | Restituisce una policy di replay che controlla la gestione della trascrizione per il provider                   | Il provider richiede una policy di trascrizione personalizzata (ad esempio, la rimozione dei blocchi di ragionamento)                         |
| 41  | `sanitizeReplayHistory`           | Riscrive la cronologia di replay dopo la pulizia generica della trascrizione                                    | Il provider richiede riscritture di replay specifiche del provider oltre agli helper di Compaction condivisi                                   |
| 42  | `validateReplayTurns`             | Validazione finale dei turni di replay o rimodellamento prima del runner incorporato                            | Il trasporto del provider richiede una validazione dei turni più rigorosa dopo la sanitizzazione generica                                      |
| 43  | `onModelSelected`                 | Esegue effetti collaterali post-selezione di proprietà del provider                                             | Il provider richiede telemetria o stato di proprietà del provider quando un modello diventa attivo                                             |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` controllano prima il
plugin provider corrispondente, poi passano agli altri plugin provider dotati di hook
finché uno non modifica effettivamente l'ID del modello o il trasporto/configurazione. Questo mantiene funzionanti
gli shim provider di alias/compatibilità senza richiedere al chiamante di sapere quale
plugin in bundle possiede la riscrittura. Se nessun hook provider riscrive una voce di configurazione
supportata della famiglia Google, il normalizzatore della configurazione Google in bundle applica comunque
quella pulizia di compatibilità.

Se il provider richiede un protocollo wire completamente personalizzato o un esecutore di richieste personalizzato,
si tratta di una classe diversa di estensione. Questi hook servono per il comportamento del provider
che viene comunque eseguito nel normale ciclo di inferenza di OpenClaw.

`resolveUsageAuth` decide se OpenClaw deve chiamare `fetchUsageSnapshot` o
ripiegare sulla risoluzione generica delle credenziali per le superfici di utilizzo/stato. Restituisci
`{ token, accountId? }` quando il provider ha una credenziale di utilizzo, restituisci
`{ handled: true }` quando l'autenticazione di utilizzo di proprietà del provider ha gestito la richiesta e
deve sopprimere il fallback generico chiave API/OAuth, e restituisci `null` o `undefined`
quando il provider non ha gestito l'autenticazione di utilizzo.

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
all'autenticazione, al thinking, al replay e alle esigenze di utilizzo di ciascun vendor. Il set autorevole di hook vive con
ciascun plugin sotto `extensions/`; questa pagina illustra le forme invece di
rispecchiare l'elenco.

<AccordionGroup>
  <Accordion title="Provider con catalogo pass-through">
    OpenRouter, Kilocode, Z.AI, xAI registrano `catalog` più
    `resolveDynamicModel` / `prepareDynamicModel` così possono esporre gli ID dei modelli upstream
    prima del catalogo statico di OpenClaw.
  </Accordion>
  <Accordion title="Provider con endpoint OAuth e utilizzo">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai abbinano
    `prepareRuntimeAuth` o `formatApiKey` con `resolveUsageAuth` +
    `fetchUsageSnapshot` per possedere lo scambio di token e l'integrazione `/usage`.
  </Accordion>
  <Accordion title="Famiglie di replay e pulizia della trascrizione">
    Famiglie denominate condivise (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) consentono ai provider di aderire alla
    policy di trascrizione tramite `buildReplayPolicy` invece che ciascun plugin
    reimplementi la pulizia.
  </Accordion>
  <Accordion title="Provider solo catalogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` e
    `volcengine` registrano solo `catalog` e usano il ciclo di inferenza condiviso.
  </Accordion>
  <Accordion title="Helper di stream specifici di Anthropic">
    Header beta, `/fast` / `serviceTier` e `context1m` vivono nel
    punto di contatto pubblico `api.ts` / `contract-api.ts` del plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) invece che nell'
    SDK generico.
  </Accordion>
</AccordionGroup>

## Helper runtime

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

- `textToSpeech` restituisce il normale payload di output TTS core per superfici file/note vocali.
- Usa la configurazione core `messages.tts` e la selezione del provider.
- Restituisce buffer audio PCM + frequenza di campionamento. I plugin devono ricampionare/codificare per i provider.
- `listVoices` è opzionale per provider. Usalo per selettori vocali di proprietà del vendor o flussi di configurazione.
- Gli elenchi di voci possono includere metadati più ricchi come locale, genere e tag di personalità per selettori consapevoli del provider.
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

- Mantieni policy TTS, fallback e consegna delle risposte nel core.
- Usa provider vocali per il comportamento di sintesi di proprietà del vendor.
- L'input Microsoft legacy `edge` viene normalizzato nell'ID provider `microsoft`.
- Il modello di proprietà preferito è orientato all'azienda: un plugin vendor può possedere
  provider di testo, voce, immagine e futuri media mentre OpenClaw aggiunge quei
  contratti di capacità.

Per la comprensione di immagini/audio/video, i plugin registrano un provider
di comprensione multimediale tipizzato invece di un contenitore chiave/valore generico:

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
- Mantieni il comportamento del vendor nel plugin provider.
- L'espansione additiva deve restare tipizzata: nuovi metodi opzionali, nuovi
  campi di risultato opzionali, nuove capacità opzionali.
- La generazione video segue già lo stesso pattern:
  - il core possiede il contratto di capacità e l'helper runtime
  - i plugin vendor registrano `api.registerVideoGenerationProvider(...)`
  - i plugin di funzionalità/canale consumano `api.runtime.videoGeneration.*`

Per gli helper runtime di comprensione multimediale, i plugin possono chiamare:

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
  model: "gpt-5.5",
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

Per la trascrizione audio, i plugin possono usare il runtime di comprensione multimediale
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
- `extractStructuredWithModel(...)` è il punto di contatto esposto ai plugin per l'estrazione
  limitata, image-first e di proprietà del provider. Includi almeno un input immagine;
  gli input testuali sono contesto supplementare.
  i plugin di prodotto possiedono le loro route e i loro schemi mentre OpenClaw possiede il
  confine provider/runtime.
- Usa la configurazione audio core di comprensione multimediale (`tools.media.audio`) e l'ordine di fallback dei provider.
- Restituisce `{ text: undefined }` quando non viene prodotto alcun output di trascrizione (per esempio input saltato/non supportato).
- `api.runtime.stt.transcribeAudioFile(...)` resta un alias di compatibilità.

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
- OpenClaw rispetta quei campi di override solo per chiamanti attendibili.
- Per esecuzioni fallback di proprietà dei plugin, gli operatori devono aderire con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` per limitare i plugin attendibili a target canonici `provider/model` specifici, oppure `"*"` per consentire esplicitamente qualsiasi target.
- Le esecuzioni subagent di plugin non attendibili funzionano comunque, ma le richieste di override vengono rifiutate invece di ripiegare silenziosamente.
- Le sessioni subagent create da plugin vengono etichettate con l'ID del plugin creatore. Il fallback `api.runtime.subagent.deleteSession(...)` può eliminare solo quelle sessioni possedute; l'eliminazione arbitraria di sessioni richiede comunque una richiesta Gateway con ambito admin.

Per la ricerca web, i plugin possono consumare l'helper runtime condiviso invece di
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

- Mantieni selezione del provider, risoluzione delle credenziali e semantica di richiesta condivisa nel core.
- Usa provider di ricerca web per trasporti di ricerca specifici del vendor.
- `api.runtime.webSearch.*` è la superficie condivisa preferita per plugin di funzionalità/canale che necessitano di comportamento di ricerca senza dipendere dal wrapper dello strumento agente.

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

- `path`: percorso della route sotto il server HTTP Gateway.
- `auth`: obbligatorio. Usa `"gateway"` per richiedere la normale autenticazione Gateway, oppure `"plugin"` per l'autenticazione/verifica Webhook gestita dal Plugin.
- `match`: opzionale. `"exact"` (predefinito) o `"prefix"`.
- `replaceExisting`: opzionale. Consente allo stesso Plugin di sostituire la propria registrazione di route esistente.
- `handler`: restituisce `true` quando la route ha gestito la richiesta.

Note:

- `api.registerHttpHandler(...)` è stato rimosso e causerà un errore di caricamento del Plugin. Usa invece `api.registerHttpRoute(...)`.
- Le route dei Plugin devono dichiarare esplicitamente `auth`.
- I conflitti esatti `path + match` vengono rifiutati a meno che `replaceExisting: true`, e un Plugin non può sostituire la route di un altro Plugin.
- Le route sovrapposte con livelli `auth` diversi vengono rifiutate. Mantieni le catene di fallthrough `exact`/`prefix` solo sullo stesso livello di autenticazione.
- Le route `auth: "plugin"` **non** ricevono automaticamente gli ambiti runtime dell'operatore. Sono destinate a Webhook/verifica della firma gestiti dal Plugin, non a chiamate privilegiate agli helper Gateway.
- Le route `auth: "gateway"` vengono eseguite all'interno di un ambito runtime di richiesta Gateway, ma tale ambito è intenzionalmente conservativo:
  - l'autenticazione bearer con segreto condiviso (`gateway.auth.mode = "token"` / `"password"`) mantiene gli ambiti runtime delle route Plugin vincolati a `operator.write`, anche se il chiamante invia `x-openclaw-scopes`
  - le modalità HTTP affidabili con identità (per esempio `trusted-proxy` o `gateway.auth.mode = "none"` su un ingresso privato) rispettano `x-openclaw-scopes` solo quando l'header è esplicitamente presente
  - se `x-openclaw-scopes` è assente in quelle richieste di route Plugin con identità, l'ambito runtime ricade su `operator.write`
- Regola pratica: non presumere che una route Plugin autenticata dal gateway sia una superficie amministrativa implicita. Se la tua route richiede comportamento riservato agli amministratori, richiedi una modalità di autenticazione con identità e documenta il contratto esplicito dell'header `x-openclaw-scopes`.

## Percorsi di importazione del Plugin SDK

Usa sottopercorsi SDK stretti invece del barrel radice monolitico `openclaw/plugin-sdk`
quando crei nuovi Plugin. Sottopercorsi core:

| Sottopercorso                       | Scopo                                              |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitive di registrazione dei Plugin              |
| `openclaw/plugin-sdk/channel-core`  | Helper di ingresso/build del canale                |
| `openclaw/plugin-sdk/core`          | Helper condivisi generici e contratto ombrello     |
| `openclaw/plugin-sdk/config-schema` | Schema Zod radice `openclaw.json` (`OpenClawSchema`) |

I Plugin di canale scelgono da una famiglia di seam stretti: `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` e `channel-actions`. Il comportamento di approvazione dovrebbe consolidarsi
su un unico contratto `approvalCapability` invece di mescolarsi tra campi
Plugin non correlati. Vedi [Plugin di canale](/it/plugins/sdk-channel-plugins).

Gli helper runtime e di configurazione risiedono sotto sottopercorsi focalizzati `*-runtime`
corrispondenti (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, ecc.). Preferisci `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` e `config-mutation`
invece del barrel di compatibilità ampio `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
le piccole facciate helper di canale, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`
e `openclaw/plugin-sdk/infra-runtime` sono shim di compatibilità deprecati per
Plugin più vecchi. Il nuovo codice dovrebbe invece importare primitive generiche più strette.
</Info>

Punti di ingresso interni al repo (per radice del pacchetto Plugin in bundle):

- `index.js` — ingresso del Plugin in bundle
- `api.js` — barrel di helper/tipi
- `runtime-api.js` — barrel solo runtime
- `setup-entry.js` — ingresso del Plugin di configurazione

I Plugin esterni dovrebbero importare solo sottopercorsi `openclaw/plugin-sdk/*`. Non
importare mai `src/*` del pacchetto di un altro Plugin dal core o da un altro Plugin.
I punti di ingresso caricati tramite facciata preferiscono lo snapshot di configurazione runtime attivo quando
esiste, poi ripiegano sul file di configurazione risolto su disco.

Sottopercorsi specifici per capacità come `image-generation`, `media-understanding`
e `speech` esistono perché i Plugin in bundle li usano oggi. Non sono
automaticamente contratti esterni congelati a lungo termine: controlla la pagina di riferimento SDK
pertinente quando fai affidamento su di essi.

## Schemi degli strumenti di messaggio

I Plugin dovrebbero possedere i contributi allo schema `describeMessageTool(...)` specifici del canale
per primitive diverse dai messaggi, come reazioni, letture e sondaggi.
La presentazione di invio condivisa dovrebbe usare il contratto generico `MessagePresentation`
invece di campi button, component, block o card nativi del provider.
Vedi [Presentazione dei messaggi](/it/plugins/message-presentation) per il contratto,
le regole di fallback, la mappatura dei provider e la checklist per autori di Plugin.

I Plugin capaci di inviare dichiarano cosa possono renderizzare tramite capacità di messaggio:

- `presentation` per blocchi di presentazione semantici (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` per richieste di consegna fissata

Il core decide se renderizzare la presentazione in modo nativo o degradarla a testo.
Non esporre vie di fuga UI native del provider dallo strumento di messaggio generico.
Gli helper SDK deprecati per gli schemi nativi legacy rimangono esportati per i Plugin
di terze parti esistenti, ma i nuovi Plugin non dovrebbero usarli.

## Risoluzione del target del canale

I Plugin di canale dovrebbero possedere la semantica del target specifica del canale. Mantieni l'host
outbound condiviso generico e usa la superficie dell'adattatore di messaggistica per le regole del provider:

- `messaging.inferTargetChatType({ to })` decide se un target normalizzato
  debba essere trattato come `direct`, `group` o `channel` prima della ricerca nella directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indica al core se un
  input dovrebbe passare direttamente alla risoluzione simile a un id invece della ricerca nella directory.
- `messaging.targetResolver.reservedLiterals` elenca parole nude che sono
  riferimenti di canale/sessione per quel provider. La risoluzione preserva le voci di directory
  configurate prima di rifiutare i literal riservati, poi fallisce in modo chiuso in caso di
  mancata corrispondenza nella directory.
- `messaging.targetResolver.resolveTarget(...)` è il fallback del Plugin quando
  il core necessita di una risoluzione finale posseduta dal provider dopo la normalizzazione o dopo una
  mancata corrispondenza nella directory.
- `messaging.resolveOutboundSessionRoute(...)` possiede la costruzione della route di sessione
  specifica del provider una volta risolto un target.

Suddivisione consigliata:

- Usa `inferTargetChatType` per decisioni di categoria che dovrebbero avvenire prima
  della ricerca di peer/gruppi.
- Usa `looksLikeId` per controlli "tratta questo come id target esplicito/nativo".
- Usa `resolveTarget` per fallback di normalizzazione specifico del provider, non per
  ricerca ampia nella directory.
- Mantieni id nativi del provider come id chat, id thread, JID, handle e id stanza
  dentro valori `target` o parametri specifici del provider, non in campi SDK generici.

## Directory basate sulla configurazione

I Plugin che derivano voci di directory dalla configurazione dovrebbero mantenere quella logica nel
Plugin e riutilizzare gli helper condivisi da
`openclaw/plugin-sdk/directory-runtime`.

Usalo quando un canale necessita di peer/gruppi basati sulla configurazione come:

- peer DM guidati da allowlist
- mappe di canali/gruppi configurate
- fallback statici di directory con ambito account

Gli helper condivisi in `directory-runtime` gestiscono solo operazioni generiche:

- filtraggio delle query
- applicazione del limite
- helper di deduplicazione/normalizzazione
- costruzione di `ChannelDirectoryEntry[]`

L'ispezione account specifica del canale e la normalizzazione degli id dovrebbero restare
nell'implementazione del Plugin.

## Cataloghi provider

I Plugin provider possono definire cataloghi di modelli per l'inferenza con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` restituisce la stessa forma che OpenClaw scrive in
`models.providers`:

- `{ provider }` per una voce provider
- `{ providers }` per più voci provider

Usa `catalog` quando il Plugin possiede id modello specifici del provider, valori predefiniti dell'URL base
o metadati modello protetti da autenticazione.

`catalog.order` controlla quando il catalogo di un Plugin si unisce rispetto ai provider impliciti
integrati di OpenClaw:

- `simple`: provider semplici guidati da chiave API o env
- `profile`: provider che compaiono quando esistono profili di autenticazione
- `paired`: provider che sintetizzano più voci provider correlate
- `late`: ultimo passaggio, dopo altri provider impliciti

I provider successivi vincono in caso di collisione di chiave, quindi i Plugin possono sovrascrivere intenzionalmente una
voce provider integrata con lo stesso id provider.

I Plugin possono anche pubblicare righe modello in sola lettura tramite
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Questo è il percorso futuro per superfici list/help/picker e supporta righe
`text`, `image_generation`, `video_generation` e `music_generation`.
I Plugin provider continuano a possedere le chiamate agli endpoint live, lo scambio di token e la
mappatura delle risposte del vendor; il core possiede la forma comune della riga, le etichette di origine e la
formattazione dell'help degli strumenti multimediali. Le registrazioni dei provider di generazione multimediale sintetizzano automaticamente
righe di catalogo statiche da `defaultModel`, `models` e `capabilities`.

Compatibilità:

- `discovery` funziona ancora come alias legacy, ma emette un avviso di deprecazione
- se sono registrati sia `catalog` sia `discovery`, OpenClaw usa `catalog`
- `augmentModelCatalog` è deprecato; i provider in bundle dovrebbero pubblicare
  righe supplementari tramite `registerModelCatalogProvider`

## Ispezione del canale in sola lettura

Se il tuo Plugin registra un canale, preferisci implementare
`plugin.config.inspectAccount(cfg, accountId)` insieme a `resolveAccount(...)`.

Perché:

- `resolveAccount(...)` è il percorso runtime. Può presumere che le credenziali
  siano completamente materializzate e può fallire rapidamente quando i segreti richiesti mancano.
- I percorsi di comando in sola lettura come `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e i flussi doctor/riparazione config
  non dovrebbero dover materializzare credenziali runtime solo per
  descrivere la configurazione.

Comportamento consigliato per `inspectAccount(...)`:

- Restituisci solo stato account descrittivo.
- Preserva `enabled` e `configured`.
- Includi campi di origine/stato delle credenziali quando pertinente, come:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Non è necessario restituire valori token grezzi solo per segnalare la
  disponibilità in sola lettura. Restituire `tokenStatus: "available"` (e il campo di origine
  corrispondente) è sufficiente per comandi in stile status.
- Usa `configured_unavailable` quando una credenziale è configurata tramite SecretRef ma
  non disponibile nel percorso di comando corrente.

Questo consente ai comandi in sola lettura di segnalare "configurato ma non disponibile in questo percorso di comando"
invece di andare in crash o indicare erroneamente che l'account non è configurato.

## Pack di pacchetti

Una directory Plugin può includere un `package.json` con `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Ogni voce diventa un Plugin. Se il pack elenca più estensioni, l'id Plugin
diventa `name/<fileBase>`.

Se il tuo Plugin importa dipendenze npm, installale in quella directory così che
`node_modules` sia disponibile (`npm install` / `pnpm install`).

Protezione di sicurezza: ogni voce `openclaw.extensions` deve rimanere all'interno della directory Plugin
dopo la risoluzione dei symlink. Le voci che escono dalla directory del pacchetto vengono
rifiutate.

Nota di sicurezza: `openclaw plugins install` installa le dipendenze dei Plugin con un
`npm install --omit=dev --ignore-scripts` locale al progetto (nessuno script del ciclo di vita,
nessuna dipendenza dev in runtime), ignorando le impostazioni globali ereditate di installazione npm.
Mantieni gli alberi delle dipendenze dei Plugin "pure JS/TS" ed evita pacchetti che richiedono
build `postinstall`.

Opzionale: `openclaw.setupEntry` può puntare a un modulo leggero solo per la configurazione.
Quando OpenClaw ha bisogno di superfici di configurazione per un Plugin di canale disabilitato, oppure
quando un Plugin di canale è abilitato ma non ancora configurato, carica `setupEntry`
invece dell'entry completa del Plugin. Questo rende avvio e configurazione più leggeri
quando l'entry principale del Plugin collega anche strumenti, hook o altro codice solo runtime.

Opzionale: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
può far usare a un Plugin di canale lo stesso percorso `setupEntry` durante la fase
di avvio pre-ascolto del Gateway, anche quando il canale è già configurato.

Usalo solo quando `setupEntry` copre completamente la superficie di avvio che deve esistere
prima che il Gateway inizi ad ascoltare. In pratica, questo significa che l'entry di configurazione
deve registrare ogni capacità posseduta dal canale da cui dipende l'avvio, ad esempio:

- la registrazione del canale stesso
- eventuali route HTTP che devono essere disponibili prima che il Gateway inizi ad ascoltare
- eventuali metodi, strumenti o servizi del Gateway che devono esistere durante la stessa finestra

Se l'entry completa possiede ancora una capacità di avvio richiesta, non abilitare
questo flag. Mantieni il Plugin sul comportamento predefinito e lascia che OpenClaw carichi
l'entry completa durante l'avvio.

I canali in bundle possono anche pubblicare helper di superficie contrattuale solo per la configurazione che il core
può consultare prima che il runtime completo del canale venga caricato. L'attuale superficie di
promozione della configurazione è:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Il core usa quella superficie quando deve promuovere una configurazione legacy di canale ad account singolo
in `channels.<id>.accounts.*` senza caricare l'entry completa del Plugin.
Matrix è l'esempio in bundle attuale: sposta solo le chiavi di autenticazione/bootstrap in un
account promosso con nome quando esistono già account con nome, e può preservare una
chiave di account predefinito non canonica configurata invece di creare sempre
`accounts.default`.

Questi adapter di patch della configurazione mantengono lazy il rilevamento delle superfici contrattuali in bundle. Il tempo di importazione
rimane leggero; la superficie di promozione viene caricata solo al primo utilizzo invece di
rientrare nell'avvio del canale in bundle all'importazione del modulo.

Quando queste superfici di avvio includono metodi RPC del Gateway, tienili su un
prefisso specifico del Plugin. Gli spazi dei nomi amministrativi del core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si risolvono sempre
in `operator.admin`, anche se un Plugin richiede un ambito più ristretto.

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

### Metadati del catalogo canali

I Plugin di canale possono pubblicizzare metadati di configurazione/rilevamento tramite `openclaw.channel` e
suggerimenti di installazione tramite `openclaw.install`. Questo mantiene il catalogo core senza dati.

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

Campi utili di `openclaw.channel` oltre l'esempio minimo:

- `detailLabel`: etichetta secondaria per superfici di catalogo/stato più ricche
- `docsLabel`: sostituisce il testo del link per il link alla documentazione
- `preferOver`: id di Plugin/canale a priorità più bassa che questa voce di catalogo dovrebbe superare
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controlli del testo della superficie di selezione
- `markdownCapable`: contrassegna il canale come compatibile con markdown per le decisioni di formattazione in uscita
- `exposure.configured`: nasconde il canale dalle superfici di elenco dei canali configurati quando impostato su `false`
- `exposure.setup`: nasconde il canale dai selettori interattivi di configurazione quando impostato su `false`
- `exposure.docs`: contrassegna il canale come interno/privato per le superfici di navigazione della documentazione
- `showConfigured` / `showInSetup`: alias legacy ancora accettati per compatibilità; preferisci `exposure`
- `quickstartAllowFrom`: abilita il canale al flusso quickstart standard `allowFrom`
- `forceAccountBinding`: richiede l'associazione esplicita dell'account anche quando esiste un solo account
- `preferSessionLookupForAnnounceTarget`: preferisce la ricerca della sessione quando risolve le destinazioni degli annunci

OpenClaw può anche unire **cataloghi canali esterni** (ad esempio, un export di registro MPM).
Inserisci un file JSON in uno di questi percorsi:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oppure punta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a
uno o più file JSON (delimitati da virgola/punto e virgola/`PATH`). Ogni file dovrebbe
contenere `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Il parser accetta anche `"packages"` o `"plugins"` come alias legacy per la chiave `"entries"`.

Le voci generate del catalogo canali e le voci del catalogo di installazione dei provider espongono
fatti normalizzati sulla sorgente di installazione accanto al blocco grezzo `openclaw.install`. I
fatti normalizzati identificano se la specifica npm è una versione esatta o un selettore
mobile, se i metadati di integrità attesi sono presenti e se è disponibile anche un
percorso sorgente locale. Quando l'identità catalogo/pacchetto è nota, i
fatti normalizzati avvisano se il nome pacchetto npm analizzato diverge da tale identità.
Avvisano anche quando `defaultChoice` non è valido o punta a una sorgente che
non è disponibile, e quando i metadati di integrità npm sono presenti senza una sorgente npm
valida. I consumatori dovrebbero trattare `installSource` come campo opzionale additivo, così
le voci costruite manualmente e gli shim di catalogo non devono sintetizzarlo.
Questo permette a onboarding e diagnostica di spiegare lo stato del piano sorgente senza
importare il runtime del Plugin.

Le voci npm esterne ufficiali dovrebbero preferire un `npmSpec` esatto più
`expectedIntegrity`. I nomi pacchetto semplici e i dist-tag continuano a funzionare per
compatibilità, ma mostrano avvisi del piano sorgente così il catalogo può muoversi
verso installazioni fissate e verificate per integrità senza interrompere i Plugin esistenti.
Quando l'onboarding installa da un percorso di catalogo locale, registra una voce dell'indice
dei Plugin gestiti con `source: "path"` e, quando possibile, un `sourcePath`
relativo al workspace. Il percorso assoluto di caricamento operativo rimane in
`plugins.load.paths`; il record di installazione evita di duplicare percorsi della workstation locale
nella configurazione a lunga durata. Questo mantiene visibili le installazioni di sviluppo locale alla
diagnostica del piano sorgente senza aggiungere una seconda superficie grezza di divulgazione di percorsi filesystem.
La riga SQLite persistita `installed_plugin_index` è la fonte di verità
della sorgente di installazione e può essere aggiornata senza caricare moduli runtime del Plugin.
La sua mappa `installRecords` è durevole anche quando un manifest del Plugin manca o
non è valido; il suo payload `plugins` è una vista ricostruibile del manifest.

## Plugin del motore di contesto

I Plugin del motore di contesto possiedono l'orchestrazione del contesto di sessione per ingestione, assemblaggio
e Compaction. Registrali dal tuo Plugin con
`api.registerContextEngine(id, factory)`, poi seleziona il motore attivo con
`plugins.slots.contextEngine`.

Usalo quando il tuo Plugin deve sostituire o estendere la pipeline di contesto predefinita
invece di limitarsi ad aggiungere ricerca in memoria o hook.

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
per l'inizializzazione al momento della costruzione.

`assemble()` può restituire `contextProjection` quando l'harness attivo ha un
thread backend persistente. Omettilo per la proiezione legacy per turno. Restituisci
`{ mode: "thread_bootstrap", epoch }` quando il contesto assemblato deve essere
iniettato una volta in un thread backend e riutilizzato finché l'epoch cambia. Modifica
l'epoch dopo che il contesto semantico del motore cambia, ad esempio dopo un
passaggio di Compaction posseduto dal motore. Gli host possono preservare i metadati delle chiamate agli strumenti, la
forma dell'input e i risultati degli strumenti redatti in una proiezione thread-bootstrap, così i nuovi
thread backend mantengono la continuità degli strumenti senza copiare payload grezzi
contenenti segreti.

Se il tuo motore **non** possiede l'algoritmo di Compaction, mantieni `compact()`
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

## Aggiungere una nuova capacità

Quando un Plugin ha bisogno di un comportamento che non rientra nell'API attuale, non aggirare
il sistema di Plugin con un accesso privato. Aggiungi la capacità mancante.

Sequenza consigliata:

1. definisci il contratto core
   Decidi quale comportamento condiviso dovrebbe possedere il core: policy, fallback, merge della configurazione,
   ciclo di vita, semantica rivolta ai canali e forma degli helper runtime.
2. aggiungi superfici tipizzate di registrazione/runtime dei Plugin
   Estendi `OpenClawPluginApi` e/o `api.runtime` con la superficie tipizzata
   di capacità utile più piccola.
3. collega core + consumatori di canale/funzionalità
   I canali e i Plugin di funzionalità dovrebbero consumare la nuova capacità tramite il core,
   non importando direttamente un'implementazione del vendor.
4. registra le implementazioni dei vendor
   I Plugin dei vendor registrano poi i propri backend rispetto alla capacità.
5. aggiungi copertura del contratto
   Aggiungi test in modo che proprietà e forma di registrazione restino esplicite nel tempo.

È così che OpenClaw resta opinato senza diventare hardcoded sulla visione del mondo di un solo
provider. Vedi il [Ricettario delle capacità](/it/plugins/adding-capabilities)
per una checklist concreta dei file e un esempio svolto.

### Checklist delle capacità

Quando aggiungi una nuova capacità, l'implementazione dovrebbe di solito toccare insieme queste
superfici:

- tipi del contratto core in `src/<capability>/types.ts`
- runner/helper runtime core in `src/<capability>/runtime.ts`
- superficie di registrazione dell'API Plugin in `src/plugins/types.ts`
- cablaggio del registro Plugin in `src/plugins/registry.ts`
- esposizione del runtime Plugin in `src/plugins/runtime/*` quando i Plugin di funzionalità/canale
  devono consumarla
- helper di capture/test in `src/test-utils/plugin-registration.ts`
- asserzioni di proprietà/contratto in `src/plugins/contracts/registry.ts`
- documentazione per operatori/Plugin in `docs/`

Se una di queste superfici manca, di solito è un segno che la capacità non è
ancora completamente integrata.

### Template di capacità

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

Schema dei test di contratto:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Questo mantiene semplice la regola:

- il core possiede il contratto di capability + l'orchestrazione
- i Plugin dei vendor possiedono le implementazioni dei vendor
- i Plugin di funzionalità/canale consumano gli helper runtime
- i test di contratto mantengono esplicita la proprietà

## Correlati

- [Architettura dei Plugin](/it/plugins/architecture) — modello pubblico delle capability e forme
- [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths)
- [Configurazione del Plugin SDK](/it/plugins/sdk-setup)
- [Creare Plugin](/it/plugins/building-plugins)
