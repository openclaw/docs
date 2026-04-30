---
read_when:
    - Implementazione degli agganci di esecuzione dei fornitori, del ciclo di vita dei canali o delle raccolte di pacchetti
    - Debug dell'ordine di caricamento dei Plugin o dello stato del registro
    - Aggiunta di una nuova capacità di Plugin o di un Plugin del motore di contesto
summary: 'Interni dell''architettura Plugin: pipeline di caricamento, registro, agganci in fase di esecuzione, route HTTP e tabelle di riferimento'
title: Interni dell'architettura dei Plugin
x-i18n:
    generated_at: "2026-04-30T09:01:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51020f00fd501c006a8e8e92f4daaeb65a9e211771f8f350d869017332b5da3b
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Per il modello pubblico delle capacità, le forme dei plugin e i contratti di proprietà/esecuzione, consulta [Architettura dei Plugin](/it/plugins/architecture). Questa pagina è il riferimento per la meccanica interna: pipeline di caricamento, registro, hook di runtime, route HTTP del Gateway, percorsi di importazione e tabelle degli schemi.

## Pipeline di caricamento

All’avvio, OpenClaw fa grosso modo questo:

1. individua le root dei plugin candidati
2. legge i manifest dei bundle nativi o compatibili e i metadati del pacchetto
3. rifiuta i candidati non sicuri
4. normalizza la configurazione dei plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide l’abilitazione per ciascun candidato
6. carica i moduli nativi abilitati: i moduli bundled compilati usano un loader nativo;
   i plugin nativi non compilati usano jiti
7. chiama gli hook nativi `register(api)` e raccoglie le registrazioni nel registro dei plugin
8. espone il registro a comandi/superfici di runtime

<Note>
`activate` è un alias legacy di `register`: il loader risolve quello presente (`def.register ?? def.activate`) e lo chiama nello stesso punto. Tutti i plugin bundled usano `register`; preferisci `register` per i nuovi plugin.
</Note>

I gate di sicurezza avvengono **prima** dell’esecuzione di runtime. I candidati vengono bloccati
quando l’entry esce dalla root del plugin, il percorso è scrivibile da tutti, oppure la proprietà
del percorso appare sospetta per i plugin non bundled.

### Comportamento manifest-first

Il manifest è la fonte di verità del piano di controllo. OpenClaw lo usa per:

- identificare il plugin
- individuare canali/Skills/schema di configurazione dichiarati o capacità del bundle
- validare `plugins.entries.<id>.config`
- arricchire etichette/placeholder della Control UI
- mostrare metadati di installazione/catalogo
- preservare descrittori economici di attivazione e configurazione senza caricare il runtime del plugin

Per i plugin nativi, il modulo di runtime è la parte del piano dati. Registra
il comportamento effettivo, come hook, strumenti, comandi o flussi provider.

I blocchi opzionali `activation` e `setup` del manifest restano sul piano di controllo.
Sono descrittori solo metadati per la pianificazione dell’attivazione e l’individuazione della configurazione;
non sostituiscono la registrazione di runtime, `register(...)` o `setupEntry`.
I primi consumer di attivazione live ora usano suggerimenti di comandi, canali e provider del manifest
per restringere il caricamento dei plugin prima di una materializzazione più ampia del registro:

- il caricamento CLI si restringe ai plugin che possiedono il comando primario richiesto
- la configurazione/risoluzione plugin del canale si restringe ai plugin che possiedono l’id
  canale richiesto
- la configurazione/risoluzione runtime esplicita del provider si restringe ai plugin che possiedono l’id
  provider richiesto
- la pianificazione dell’avvio del Gateway usa `activation.onStartup` per import espliciti all’avvio
  e opt-out dall’avvio; ogni plugin dovrebbe dichiararlo mentre OpenClaw
  si allontana dagli import impliciti all’avvio, mentre i plugin senza metadati statici
  di capacità e senza `activation.onStartup` usano ancora il fallback sidecar implicito
  di avvio deprecato per compatibilità

Il planner di attivazione espone sia un’API solo id per i chiamanti esistenti sia un’API
di piano per le nuove diagnostiche. Le entry del piano indicano perché un plugin è stato selezionato,
separando i suggerimenti espliciti del planner `activation.*` dalla proprietà dichiarata nel manifest
di fallback, come `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hook. Questa separazione delle ragioni è il confine di compatibilità:
i metadati esistenti dei plugin continuano a funzionare, mentre il nuovo codice può rilevare suggerimenti ampi
o comportamento di fallback senza cambiare la semantica di caricamento del runtime.

L’individuazione della configurazione ora preferisce id posseduti dal descrittore, come `setup.providers` e
`setup.cliBackends`, per restringere i plugin candidati prima di ricadere su
`setup-api` per i plugin che richiedono ancora hook di runtime al momento della configurazione. Gli elenchi di
configurazione provider usano `providerAuthChoices` del manifest, scelte di configurazione derivate dai descrittori
e metadati del catalogo di installazione senza caricare il runtime del provider. `setup.requiresRuntime: false`
esplicito è un limite solo descrittore; `requiresRuntime` omesso mantiene il fallback legacy setup-api
per compatibilità. Se più di un plugin individuato dichiara lo stesso provider di configurazione o id backend CLI
normalizzato, la lookup della configurazione rifiuta il proprietario ambiguo invece di affidarsi
all’ordine di individuazione. Quando il runtime di configurazione viene eseguito, le diagnostiche del registro segnalano
drift tra `setup.providers` / `setup.cliBackends` e i provider o backend CLI
registrati da setup-api senza bloccare i plugin legacy.

### Confine della cache dei Plugin

OpenClaw non mette in cache risultati di individuazione dei plugin o dati diretti del registro dei manifest
dietro finestre basate sull’orologio. Installazioni, modifiche ai manifest e cambiamenti dei percorsi di caricamento
devono diventare visibili alla lettura esplicita successiva dei metadati o alla ricostruzione successiva dello snapshot.
Il parser del file manifest può mantenere una cache limitata della firma del file, indicizzata per
percorso del manifest aperto, inode, dimensione e timestamp; quella cache evita soltanto
di riparsare byte invariati e non deve memorizzare in cache risposte di individuazione, registro, proprietario o
policy.

Il percorso rapido sicuro dei metadati è la proprietà esplicita dell’oggetto, non una cache nascosta.
I percorsi caldi di avvio del Gateway dovrebbero passare il `PluginMetadataSnapshot` corrente, la
`PluginLookUpTable` derivata o un registro manifest esplicito lungo la catena di chiamate.
Validazione della configurazione, auto-abilitazione all’avvio, bootstrap dei plugin e selezione del provider
possono riusare questi oggetti finché rappresentano la configurazione corrente e
l’inventario dei plugin. La lookup della configurazione ricostruisce ancora i metadati del manifest su richiesta
a meno che il percorso specifico di configurazione riceva un registro manifest esplicito; mantienilo
come fallback a freddo invece di aggiungere cache di lookup nascoste. Quando l’input
cambia, ricostruisci e sostituisci lo snapshot invece di mutarlo o mantenere
copie storiche.
Le viste sul registro attivo dei plugin e gli helper di bootstrap dei canali bundled
dovrebbero essere ricalcolati dal registro/root corrente. Mappe di breve durata sono accettabili
all’interno di una chiamata per deduplicare lavoro o proteggere il rientro; non devono diventare cache
di metadati di processo.

Per il caricamento dei plugin, il livello di cache persistente è il caricamento del runtime. Può riusare
lo stato del loader quando codice o artefatti installati vengono effettivamente caricati, ad esempio:

- `PluginLoaderCacheState` e registri runtime attivi compatibili
- cache jiti/moduli e cache dei loader di superfici pubbliche usate per evitare di importare
  ripetutamente la stessa superficie di runtime
- mirror delle dipendenze di runtime e cache del filesystem per artefatti dei plugin
  installati
- mappe per chiamata di breve durata per normalizzazione dei percorsi o risoluzione duplicati

Queste cache sono dettagli implementativi del piano dati. Non devono rispondere
a domande del piano di controllo come “quale plugin possiede questo provider?” a meno che
il chiamante non abbia richiesto deliberatamente il caricamento del runtime.

Non aggiungere cache persistenti o basate sull’orologio per:

- risultati di individuazione
- registri manifest diretti
- registri manifest ricostruiti dall’indice dei plugin installati
- lookup del proprietario provider, soppressione modelli, policy provider o metadati
  degli artefatti pubblici
- qualsiasi altra risposta derivata dal manifest in cui un manifest modificato, un indice installato
  o un percorso di caricamento dovrebbe essere visibile alla lettura successiva dei metadati

I chiamanti che ricostruiscono metadati del manifest dall’indice persistito dei plugin
installati ricostruiscono quel registro su richiesta. L’indice installato è stato durevole
del piano sorgente; non è una cache di metadati nascosta in-process.

## Modello del registro

I plugin caricati non mutano direttamente globali core casuali. Si registrano in un
registro centrale dei plugin.

Il registro traccia:

- record dei plugin (identità, sorgente, origine, stato, diagnostiche)
- strumenti
- hook legacy e hook tipizzati
- canali
- provider
- gestori RPC del Gateway
- route HTTP
- registratori CLI
- servizi in background
- comandi posseduti dai plugin

Le funzionalità core leggono poi da quel registro invece di parlare direttamente con i moduli
dei plugin. Questo mantiene il caricamento unidirezionale:

- modulo plugin -> registrazione nel registro
- runtime core -> consumo del registro

Questa separazione conta per la manutenibilità. Significa che la maggior parte delle superfici core
ha bisogno di un solo punto di integrazione: “leggere il registro”, non “gestire casi speciali per ogni modulo plugin”.

## Callback di binding conversazione

I plugin che associano una conversazione possono reagire quando un’approvazione viene risolta.

Usa `api.onConversationBindingResolved(...)` per ricevere un callback dopo che una richiesta di binding
viene approvata o negata:

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
- `binding`: il binding risolto per richieste approvate
- `request`: il riepilogo della richiesta originale, suggerimento di distacco, id mittente e
  metadati della conversazione

Questo callback è solo di notifica. Non cambia chi è autorizzato ad associare una
conversazione e viene eseguito dopo il completamento della gestione dell’approvazione core.

## Hook di runtime dei provider

I plugin provider hanno tre livelli:

- **Metadati del manifest** per lookup economica prima del runtime:
  `setup.providers[].envVars`, compatibilità deprecata `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` e `channelEnvVars`.
- **Hook a tempo di configurazione**: `catalog` (legacy `discovery`) più
  `applyConfigDefaults`.
- **Hook di runtime**: oltre 40 hook opzionali che coprono autenticazione, risoluzione modelli,
  wrapping degli stream, livelli di thinking, policy di replay ed endpoint d’uso. Consulta
  l’elenco completo in [Ordine e uso degli hook](#hook-order-and-usage).

OpenClaw possiede ancora il loop agent generico, il failover, la gestione dei transcript e
la policy degli strumenti. Questi hook sono la superficie di estensione per il comportamento specifico
del provider senza richiedere un trasporto di inferenza interamente personalizzato.

Usa `setup.providers[].envVars` del manifest quando il provider ha credenziali basate su env
che i percorsi generici di auth/status/model-picker dovrebbero vedere senza
caricare il runtime del plugin. `providerAuthEnvVars` deprecato viene ancora letto
dall’adapter di compatibilità durante la finestra di deprecazione, e i plugin non bundled
che lo usano ricevono una diagnostica del manifest. Usa `providerAuthAliases`
del manifest quando un id provider deve riusare variabili env, profili auth,
auth basata su configurazione e scelta di onboarding API-key di un altro id provider. Usa
`providerAuthChoices` del manifest quando le superfici CLI di onboarding/scelta auth dovrebbero conoscere
l’id scelta del provider, le etichette di gruppo e il wiring auth semplice a un flag senza
caricare il runtime del provider. Mantieni `envVars` del runtime provider per suggerimenti rivolti agli operatori,
come etichette di onboarding o variabili di configurazione OAuth
client-id/client-secret.

Usa `channelEnvVars` del manifest quando un canale ha auth o configurazione basata su env che
fallback shell-env generico, controlli config/status o prompt di configurazione dovrebbero vedere
senza caricare il runtime del canale.

### Ordine e uso degli hook

Per i plugin modello/provider, OpenClaw chiama gli hook in questo ordine approssimativo.
La colonna “Quando usarlo” è la guida rapida alla decisione.
I campi provider solo compatibilità che OpenClaw non chiama più, come
`ProviderPlugin.capabilities` e `suppressBuiltInModel`, sono intenzionalmente non
elencati qui.

| #   | Hook                              | Cosa fa                                                                                                             | Quando usarlo                                                                                                                                             |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Pubblica la configurazione del provider in `models.providers` durante la generazione di `models.json`               | Il provider possiede un catalogo o valori predefiniti per l'URL di base                                                                                   |
| 2   | `applyConfigDefaults`             | Applica i valori predefiniti globali della configurazione posseduti dal provider durante la materializzazione della configurazione | I valori predefiniti dipendono dalla modalità di autenticazione, dall'env o dalla semantica della famiglia di modelli del provider                       |
| --  | _(ricerca modello integrata)_     | OpenClaw prova prima il normale percorso registro/catalogo                                                           | _(non è un hook di Plugin)_                                                                                                                               |
| 3   | `normalizeModelId`                | Normalizza alias legacy o di anteprima degli ID modello prima della ricerca                                          | Il provider possiede la pulizia degli alias prima della risoluzione canonica del modello                                                                  |
| 4   | `normalizeTransport`              | Normalizza `api` / `baseUrl` della famiglia del provider prima dell'assemblaggio generico del modello                | Il provider possiede la pulizia del trasporto per ID provider personalizzati nella stessa famiglia di trasporto                                           |
| 5   | `normalizeConfig`                 | Normalizza `models.providers.<id>` prima della risoluzione runtime/provider                                          | Il provider richiede una pulizia della configurazione che deve risiedere nel Plugin; gli helper inclusi della famiglia Google fungono anche da supporto per le voci di configurazione Google supportate |
| 6   | `applyNativeStreamingUsageCompat` | Applica riscritture di compatibilità dell'utilizzo dello streaming nativo ai provider di configurazione              | Il provider richiede correzioni dei metadati di utilizzo dello streaming nativo guidate dall'endpoint                                                     |
| 7   | `resolveConfigApiKey`             | Risolve l'autenticazione con marcatore env per i provider di configurazione prima del caricamento dell'autenticazione runtime | Il provider ha una risoluzione della chiave API con marcatore env posseduta dal provider; anche `amazon-bedrock` ha qui un resolver integrato per marcatori env AWS |
| 8   | `resolveSyntheticAuth`            | Espone autenticazione locale/self-hosted o basata su configurazione senza persistere testo in chiaro                 | Il provider può operare con un marcatore di credenziale sintetica/locale                                                                                  |
| 9   | `resolveExternalAuthProfiles`     | Sovrappone profili di autenticazione esterni posseduti dal provider; il valore predefinito di `persistence` è `runtime-only` per credenziali possedute da CLI/app | Il provider riusa credenziali di autenticazione esterne senza persistere token di aggiornamento copiati; dichiara `contracts.externalAuthProviders` nel manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Abbassa la precedenza dei segnaposto di profili sintetici memorizzati rispetto all'autenticazione basata su env/config | Il provider memorizza profili segnaposto sintetici che non devono avere precedenza                                                                        |
| 11  | `resolveDynamicModel`             | Fallback sincrono per ID modello posseduti dal provider che non sono ancora nel registro locale                      | Il provider accetta ID modello upstream arbitrari                                                                                                         |
| 12  | `prepareDynamicModel`             | Riscaldamento asincrono, poi `resolveDynamicModel` viene eseguito di nuovo                                          | Il provider richiede metadati di rete prima di risolvere ID sconosciuti                                                                                   |
| 13  | `normalizeResolvedModel`          | Riscrittura finale prima che il runner incorporato usi il modello risolto                                           | Il provider richiede riscritture del trasporto ma usa comunque un trasporto core                                                                          |
| 14  | `contributeResolvedModelCompat`   | Contribuisce flag di compatibilità per modelli vendor dietro un altro trasporto compatibile                         | Il provider riconosce i propri modelli su trasporti proxy senza assumere il controllo del provider                                                       |
| 15  | `normalizeToolSchemas`            | Normalizza gli schemi degli strumenti prima che il runner incorporato li veda                                       | Il provider richiede pulizia degli schemi della famiglia di trasporto                                                                                     |
| 16  | `inspectToolSchemas`              | Espone diagnostica degli schemi posseduta dal provider dopo la normalizzazione                                      | Il provider vuole avvisi sulle keyword senza insegnare al core regole specifiche del provider                                                            |
| 17  | `resolveReasoningOutputMode`      | Seleziona il contratto di output di ragionamento nativo o con tag                                                   | Il provider richiede ragionamento/output finale con tag invece di campi nativi                                                                            |
| 18  | `prepareExtraParams`              | Normalizzazione dei parametri di richiesta prima dei wrapper generici delle opzioni di stream                       | Il provider richiede parametri di richiesta predefiniti o pulizia dei parametri per provider                                                              |
| 19  | `createStreamFn`                  | Sostituisce completamente il normale percorso di stream con un trasporto personalizzato                             | Il provider richiede un protocollo wire personalizzato, non solo un wrapper                                                                               |
| 20  | `wrapStreamFn`                    | Wrapper di stream dopo l'applicazione dei wrapper generici                                                          | Il provider richiede wrapper di compatibilità per intestazioni/corpo/modello della richiesta senza un trasporto personalizzato                            |
| 21  | `resolveTransportTurnState`       | Allega intestazioni o metadati di trasporto nativi per turno                                                        | Il provider vuole che i trasporti generici inviino l'identità di turno nativa del provider                                                                |
| 22  | `resolveWebSocketSessionPolicy`   | Allega intestazioni WebSocket native o una politica di raffreddamento della sessione                                | Il provider vuole che i trasporti WS generici regolino le intestazioni di sessione o la politica di fallback                                             |
| 23  | `formatApiKey`                    | Formattatore del profilo di autenticazione: il profilo memorizzato diventa la stringa `apiKey` runtime              | Il provider memorizza metadati di autenticazione extra e richiede una forma personalizzata del token runtime                                             |
| 24  | `refreshOAuth`                    | Override dell'aggiornamento OAuth per endpoint di aggiornamento personalizzati o politica di errore di aggiornamento | Il provider non si adatta ai refresher `pi-ai` condivisi                                                                                                  |
| 25  | `buildAuthDoctorHint`             | Suggerimento di riparazione aggiunto quando l'aggiornamento OAuth fallisce                                          | Il provider richiede indicazioni di riparazione dell'autenticazione possedute dal provider dopo un errore di aggiornamento                               |
| 26  | `matchesContextOverflowError`     | Matcher di overflow della finestra di contesto posseduto dal provider                                               | Il provider ha errori grezzi di overflow che le euristiche generiche non rileverebbero                                                                    |
| 27  | `classifyFailoverReason`          | Classificazione del motivo di failover posseduta dal provider                                                      | Il provider può mappare errori API/trasporto grezzi a rate-limit/sovraccarico/ecc.                                                                       |
| 28  | `isCacheTtlEligible`              | Politica di prompt-cache per provider proxy/backhaul                                                               | Il provider richiede gating del TTL della cache specifico del proxy                                                                                       |
| 29  | `buildMissingAuthMessage`         | Sostituzione del messaggio generico di ripristino per autenticazione mancante                                       | Il provider richiede un suggerimento di ripristino specifico del provider per autenticazione mancante                                                    |
| 30  | `augmentModelCatalog`             | Righe sintetiche/finali del catalogo aggiunte dopo la discovery                                                    | Il provider richiede righe sintetiche di compatibilità futura in `models list` e nei selettori                                                           |
| 31  | `resolveThinkingProfile`          | Set di livelli `/think` specifico del modello, etichette di visualizzazione e valore predefinito                    | Il provider espone una scala di thinking personalizzata o un'etichetta binaria per modelli selezionati                                                    |
| 32  | `isBinaryThinking`                | Hook di compatibilità per l'interruttore on/off del ragionamento                                                   | Il provider espone solo thinking binario on/off                                                                                                           |
| 33  | `supportsXHighThinking`           | Hook di compatibilità del supporto al ragionamento `xhigh`                                                         | Il provider vuole `xhigh` solo su un sottoinsieme di modelli                                                                                              |
| 34  | `resolveDefaultThinkingLevel`     | Hook di compatibilità del livello `/think` predefinito                                                             | Il provider possiede la politica `/think` predefinita per una famiglia di modelli                                                                         |
| 35  | `isModernModelRef`                | Matcher di modelli moderni per filtri di profilo live e selezione smoke                                            | Il provider possiede il matching dei modelli preferiti per live/smoke                                                                                     |
| 36  | `prepareRuntimeAuth`              | Scambia una credenziale configurata nel token/chiave runtime effettivo subito prima dell'inferenza                  | Il provider richiede uno scambio di token o una credenziale di richiesta a breve durata                                                                   |
| 37  | `resolveUsageAuth`                | Risolve le credenziali di utilizzo/fatturazione per `/usage` e le superfici di stato correlate                                     | Il provider richiede parsing personalizzato del token di utilizzo/quota o credenziali di utilizzo diverse                                                               |
| 38  | `fetchUsageSnapshot`              | Recupera e normalizza snapshot di utilizzo/quota specifici del provider dopo la risoluzione dell'autenticazione                             | Il provider richiede un endpoint di utilizzo specifico del provider o un parser del payload                                                                           |
| 39  | `createEmbeddingProvider`         | Crea un adattatore di embedding gestito dal provider per memoria/ricerca                                                     | Il comportamento degli embedding di memoria appartiene al Plugin del provider                                                                                    |
| 40  | `buildReplayPolicy`               | Restituisce una policy di replay che controlla la gestione della trascrizione per il provider                                        | Il provider richiede una policy di trascrizione personalizzata (ad esempio, rimozione dei blocchi di ragionamento)                                                               |
| 41  | `sanitizeReplayHistory`           | Riscrive la cronologia di replay dopo la pulizia generica della trascrizione                                                        | Il provider richiede riscritture di replay specifiche del provider oltre alle funzioni helper di Compaction condivise                                                             |
| 42  | `validateReplayTurns`             | Validazione finale dei turni di replay o rimodellamento prima del runner integrato                                           | Il trasporto del provider richiede una validazione dei turni più rigorosa dopo la sanificazione generica                                                                    |
| 43  | `onModelSelected`                 | Esegue effetti collaterali post-selezione gestiti dal provider                                                                 | Il provider richiede telemetria o stato gestito dal provider quando un modello diventa attivo                                                                  |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` controllano prima il
Plugin del provider corrispondente, poi passano agli altri Plugin provider con
hook disponibili finché uno non modifica effettivamente l'id modello o il
trasporto/la configurazione. Questo mantiene funzionanti gli shim provider di
alias/compatibilità senza richiedere al chiamante di sapere quale Plugin incluso
possiede la riscrittura. Se nessun hook provider riscrive una voce di
configurazione supportata della famiglia Google, il normalizzatore di
configurazione Google incluso applica comunque quella pulizia di compatibilità.

Se il provider richiede un protocollo wire completamente personalizzato o un
esecutore di richieste personalizzato, si tratta di una classe diversa di
estensione. Questi hook sono per il comportamento del provider che continua a
girare sul normale ciclo di inferenza di OpenClaw.

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

I Plugin provider inclusi combinano gli hook precedenti per adattarsi alle
esigenze di catalogo, autenticazione, thinking, replay e utilizzo di ciascun
vendor. L'insieme autorevole degli hook risiede con ciascun Plugin in
`extensions/`; questa pagina illustra le forme invece di rispecchiare l'elenco.

<AccordionGroup>
  <Accordion title="Provider di catalogo pass-through">
    OpenRouter, Kilocode, Z.AI, xAI registrano `catalog` più
    `resolveDynamicModel` / `prepareDynamicModel` così possono esporre gli id
    modello upstream prima del catalogo statico di OpenClaw.
  </Accordion>
  <Accordion title="Provider OAuth ed endpoint di utilizzo">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai abbinano
    `prepareRuntimeAuth` o `formatApiKey` con `resolveUsageAuth` +
    `fetchUsageSnapshot` per possedere lo scambio di token e l'integrazione
    `/usage`.
  </Accordion>
  <Accordion title="Famiglie di replay e pulizia della trascrizione">
    Le famiglie denominate condivise (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) consentono ai provider di
    aderire alla policy di trascrizione tramite `buildReplayPolicy` invece che
    ogni Plugin reimplementi la pulizia.
  </Accordion>
  <Accordion title="Provider solo catalogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` e
    `volcengine` registrano solo `catalog` e usano il ciclo di inferenza
    condiviso.
  </Accordion>
  <Accordion title="Helper di stream specifici per Anthropic">
    Header beta, `/fast` / `serviceTier` e `context1m` risiedono nel seam
    pubblico `api.ts` / `contract-api.ts` del Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) invece che
    nell'SDK generico.
  </Accordion>
</AccordionGroup>

## Helper runtime

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

- `textToSpeech` restituisce il normale payload di output TTS core per superfici file/note vocali.
- Usa la configurazione core `messages.tts` e la selezione del provider.
- Restituisce buffer audio PCM + frequenza di campionamento. I Plugin devono ricampionare/codificare per i provider.
- `listVoices` è opzionale per provider. Usalo per selettori vocali o flussi di configurazione di proprietà del vendor.
- Gli elenchi di voci possono includere metadati più ricchi come locale, genere e tag di personalità per selettori consapevoli del provider.
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
- Usa provider vocali per il comportamento di sintesi di proprietà del vendor.
- L'input Microsoft legacy `edge` viene normalizzato all'id provider `microsoft`.
- Il modello di proprietà preferito è orientato all'azienda: un Plugin vendor può possedere provider di testo, voce, immagine e media futuri man mano che OpenClaw aggiunge quei contratti di capacità.

Per la comprensione di immagini/audio/video, i Plugin registrano un provider
tipizzato di comprensione media invece di un contenitore generico chiave/valore:

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
- L'espansione additiva deve rimanere tipizzata: nuovi metodi opzionali, nuovi campi risultato opzionali, nuove capacità opzionali.
- Anche la generazione video segue già lo stesso schema:
  - il core possiede il contratto di capacità e l'helper runtime
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

Per la trascrizione audio, i Plugin possono usare il runtime di comprensione
media oppure il vecchio alias STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Note:

- `api.runtime.mediaUnderstanding.*` è la superficie condivisa preferita per la comprensione di immagini/audio/video.
- Usa la configurazione audio di comprensione media core (`tools.media.audio`) e l'ordine di fallback dei provider.
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

- `provider` e `model` sono override opzionali per singola esecuzione, non modifiche persistenti della sessione.
- OpenClaw onora quei campi di override solo per chiamanti trusted.
- Per esecuzioni di fallback di proprietà del Plugin, gli operatori devono optare con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` per limitare i Plugin trusted a target canonici `provider/model` specifici, oppure `"*"` per consentire esplicitamente qualsiasi target.
- Le esecuzioni subagent di Plugin non trusted continuano a funzionare, ma le richieste di override vengono rifiutate invece di ricadere silenziosamente sul fallback.
- Le sessioni subagent create da Plugin vengono etichettate con l'id del Plugin creatore. Il fallback `api.runtime.subagent.deleteSession(...)` può eliminare solo quelle sessioni di proprietà; l'eliminazione arbitraria di sessioni richiede comunque una richiesta Gateway con ambito admin.

Per la ricerca web, i Plugin possono consumare l'helper runtime condiviso invece di
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

- Mantieni selezione dei provider, risoluzione delle credenziali e semantica condivisa delle richieste nel core.
- Usa provider di ricerca web per trasporti di ricerca specifici del vendor.
- `api.runtime.webSearch.*` è la superficie condivisa preferita per i Plugin di funzionalità/canale che hanno bisogno del comportamento di ricerca senza dipendere dal wrapper degli strumenti dell'agente.

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

- `path`: percorso della route sotto il server HTTP Gateway.
- `auth`: obbligatorio. Usa `"gateway"` per richiedere la normale autenticazione gateway, oppure `"plugin"` per autenticazione/verifica Webhook gestita dal Plugin.
- `match`: opzionale. `"exact"` (predefinito) o `"prefix"`.
- `replaceExisting`: opzionale. Consente allo stesso Plugin di sostituire la propria registrazione di route esistente.
- `handler`: restituisci `true` quando la route ha gestito la richiesta.

Note:

- `api.registerHttpHandler(...)` è stato rimosso e causerà un errore di caricamento del plugin. Usa invece `api.registerHttpRoute(...)`.
- Le route dei plugin devono dichiarare `auth` esplicitamente.
- I conflitti esatti `path + match` vengono rifiutati a meno che non sia impostato `replaceExisting: true`, e un plugin non può sostituire la route di un altro plugin.
- Le route sovrapposte con livelli `auth` diversi vengono rifiutate. Mantieni le catene di fallback `exact`/`prefix` solo sullo stesso livello di auth.
- Le route `auth: "plugin"` **non** ricevono automaticamente gli ambiti runtime dell’operatore. Sono pensate per webhook/verifica delle firme gestiti dal plugin, non per chiamate privilegiate agli helper del Gateway.
- Le route `auth: "gateway"` vengono eseguite all’interno di un ambito runtime di richiesta del Gateway, ma tale ambito è intenzionalmente conservativo:
  - l’autenticazione bearer con segreto condiviso (`gateway.auth.mode = "token"` / `"password"`) mantiene gli ambiti runtime delle route dei plugin fissati a `operator.write`, anche se il chiamante invia `x-openclaw-scopes`
  - le modalità HTTP attendibili con identità (per esempio `trusted-proxy` o `gateway.auth.mode = "none"` su un ingresso privato) rispettano `x-openclaw-scopes` solo quando l’header è presente esplicitamente
  - se `x-openclaw-scopes` è assente in tali richieste a route di plugin con identità, l’ambito runtime ripiega su `operator.write`
- Regola pratica: non presumere che una route di plugin con auth Gateway sia una superficie admin implicita. Se la tua route richiede comportamento riservato agli admin, richiedi una modalità auth con identità e documenta il contratto esplicito dell’header `x-openclaw-scopes`.

## Percorsi di importazione dell’SDK per plugin

Usa sottopercorsi SDK mirati invece del barrel radice monolitico `openclaw/plugin-sdk`
quando crei nuovi plugin. Sottopercorsi principali:

| Sottopercorso                      | Scopo                                              |
| ---------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry` | Primitive di registrazione dei plugin              |
| `openclaw/plugin-sdk/channel-core` | Helper di ingresso/build del canale                |
| `openclaw/plugin-sdk/core`         | Helper condivisi generici e contratto ombrello     |
| `openclaw/plugin-sdk/config-schema` | Schema Zod radice `openclaw.json` (`OpenClawSchema`) |

I plugin di canale scelgono da una famiglia di seam mirati — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` e `channel-actions`. Il comportamento di approvazione dovrebbe consolidarsi
su un unico contratto `approvalCapability` invece di mescolare campi di plugin
non correlati. Vedi [Plugin di canale](/it/plugins/sdk-channel-plugins).

Gli helper runtime e di configurazione si trovano sotto sottopercorsi focalizzati `*-runtime`
corrispondenti (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, ecc.). Preferisci `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` e `config-mutation`
al barrel di compatibilità ampio `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
e `openclaw/plugin-sdk/infra-runtime` sono shim di compatibilità deprecati per
plugin più vecchi. Il nuovo codice dovrebbe importare primitive generiche più mirate.
</Info>

Punti di ingresso interni al repo (per radice del pacchetto plugin incluso):

- `index.js` — ingresso del plugin incluso
- `api.js` — barrel di helper/tipi
- `runtime-api.js` — barrel solo runtime
- `setup-entry.js` — ingresso del plugin di setup

I plugin esterni dovrebbero importare solo sottopercorsi `openclaw/plugin-sdk/*`. Non
importare mai `src/*` del pacchetto di un altro plugin dal core o da un altro plugin.
I punti di ingresso caricati tramite facade preferiscono lo snapshot di configurazione runtime attivo quando
esiste, poi ripiegano sul file di configurazione risolto su disco.

Sottopercorsi specifici per capability come `image-generation`, `media-understanding`
e `speech` esistono perché oggi i plugin inclusi li usano. Non sono
automaticamente contratti esterni congelati a lungo termine — controlla la pagina di riferimento SDK
pertinente quando fai affidamento su di essi.

## Schemi degli strumenti di messaggio

I plugin dovrebbero possedere i contributi di schema `describeMessageTool(...)`
specifici del canale per primitive non di messaggio come reazioni, letture e sondaggi.
La presentazione condivisa dell’invio dovrebbe usare il contratto generico `MessagePresentation`
invece di campi nativi del provider per pulsanti, componenti, blocchi o schede.
Vedi [Presentazione dei messaggi](/it/plugins/message-presentation) per il contratto,
le regole di fallback, la mappatura dei provider e la checklist per gli autori di plugin.

I plugin capaci di inviare dichiarano cosa possono renderizzare tramite capability di messaggio:

- `presentation` per blocchi di presentazione semantici (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` per richieste di consegna fissata

Il core decide se renderizzare la presentazione nativamente o degradarla a testo.
Non esporre vie di fuga UI native del provider dallo strumento di messaggio generico.
Gli helper SDK deprecati per schemi nativi legacy restano esportati per i plugin
di terze parti esistenti, ma i nuovi plugin non dovrebbero usarli.

## Risoluzione del target di canale

I plugin di canale dovrebbero possedere la semantica del target specifica del canale. Mantieni generico
l’host outbound condiviso e usa la superficie dell’adapter di messaggistica per le regole del provider:

- `messaging.inferTargetChatType({ to })` decide se un target normalizzato
  debba essere trattato come `direct`, `group` o `channel` prima della ricerca nella directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` dice al core se un
  input dovrebbe passare direttamente alla risoluzione simile a un id invece della ricerca nella directory.
- `messaging.targetResolver.resolveTarget(...)` è il fallback del plugin quando
  il core necessita di una risoluzione finale posseduta dal provider dopo la normalizzazione o dopo un
  mancato riscontro nella directory.
- `messaging.resolveOutboundSessionRoute(...)` possiede la costruzione della route di sessione
  specifica del provider una volta risolto un target.

Suddivisione consigliata:

- Usa `inferTargetChatType` per decisioni di categoria che dovrebbero avvenire prima
  di cercare peer/gruppi.
- Usa `looksLikeId` per controlli del tipo "tratta questo come un id target esplicito/nativo".
- Usa `resolveTarget` per il fallback di normalizzazione specifico del provider, non per
  una ricerca ampia nella directory.
- Mantieni gli id nativi del provider come chat id, thread id, JID, handle e room
  id dentro i valori `target` o nei parametri specifici del provider, non in campi SDK
  generici.

## Directory basate sulla configurazione

I plugin che derivano voci di directory dalla configurazione dovrebbero mantenere tale logica nel
plugin e riutilizzare gli helper condivisi da
`openclaw/plugin-sdk/directory-runtime`.

Usalo quando un canale necessita di peer/gruppi basati sulla configurazione, come:

- peer DM guidati da allowlist
- mappe di canali/gruppi configurate
- fallback di directory statici con ambito account

Gli helper condivisi in `directory-runtime` gestiscono solo operazioni generiche:

- filtraggio delle query
- applicazione dei limiti
- helper di deduplicazione/normalizzazione
- costruzione di `ChannelDirectoryEntry[]`

L’ispezione account e la normalizzazione degli id specifiche del canale dovrebbero restare
nell’implementazione del plugin.

## Cataloghi dei provider

I plugin provider possono definire cataloghi di modelli per l’inferenza con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` restituisce la stessa forma che OpenClaw scrive in
`models.providers`:

- `{ provider }` per una voce provider
- `{ providers }` per più voci provider

Usa `catalog` quando il plugin possiede id modello specifici del provider, default della base URL
o metadati modello protetti da auth.

`catalog.order` controlla quando il catalogo di un plugin viene unito rispetto ai provider impliciti
integrati di OpenClaw:

- `simple`: provider semplici guidati da chiave API o env
- `profile`: provider che compaiono quando esistono profili auth
- `paired`: provider che sintetizzano più voci provider correlate
- `late`: ultimo passaggio, dopo gli altri provider impliciti

I provider successivi vincono in caso di collisione di chiave, quindi i plugin possono sovrascrivere
intenzionalmente una voce provider integrata con lo stesso provider id.

Compatibilità:

- `discovery` funziona ancora come alias legacy
- se vengono registrati sia `catalog` sia `discovery`, OpenClaw usa `catalog`

## Ispezione dei canali in sola lettura

Se il tuo plugin registra un canale, preferisci implementare
`plugin.config.inspectAccount(cfg, accountId)` insieme a `resolveAccount(...)`.

Perché:

- `resolveAccount(...)` è il percorso runtime. Può presumere che le credenziali
  siano completamente materializzate e può fallire rapidamente quando mancano segreti richiesti.
- I percorsi di comando in sola lettura come `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e i flussi doctor/riparazione config
  non dovrebbero dover materializzare credenziali runtime solo per
  descrivere la configurazione.

Comportamento `inspectAccount(...)` consigliato:

- Restituisci solo stato descrittivo dell’account.
- Preserva `enabled` e `configured`.
- Includi campi di origine/stato delle credenziali quando rilevanti, come:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Non è necessario restituire valori token grezzi solo per segnalare la disponibilità
  in sola lettura. Restituire `tokenStatus: "available"` (e il campo di origine
  corrispondente) è sufficiente per comandi in stile status.
- Usa `configured_unavailable` quando una credenziale è configurata tramite SecretRef ma
  non disponibile nel percorso di comando corrente.

Questo consente ai comandi in sola lettura di segnalare "configurato ma non disponibile in questo percorso
di comando" invece di andare in crash o indicare erroneamente l’account come non configurato.

## Pack di pacchetti

Una directory di plugin può includere un `package.json` con `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Ogni voce diventa un plugin. Se il pack elenca più estensioni, l’id del plugin
diventa `name/<fileBase>`.

Se il tuo plugin importa dipendenze npm, installale in quella directory affinché
`node_modules` sia disponibile (`npm install` / `pnpm install`).

Guardrail di sicurezza: ogni voce `openclaw.extensions` deve restare dentro la directory del plugin
dopo la risoluzione dei symlink. Le voci che escono dalla directory del pacchetto vengono
rifiutate.

Nota di sicurezza: `openclaw plugins install` installa le dipendenze del plugin con un
`npm install --omit=dev --ignore-scripts` locale al progetto (nessuno script lifecycle,
nessuna dipendenza dev a runtime), ignorando le impostazioni globali npm install ereditate.
Mantieni gli alberi di dipendenze dei plugin "pure JS/TS" ed evita pacchetti che richiedono
build `postinstall`.

Opzionale: `openclaw.setupEntry` può puntare a un modulo leggero solo di setup.
Quando OpenClaw necessita di superfici di setup per un plugin di canale disabilitato, oppure
quando un plugin di canale è abilitato ma ancora non configurato, carica `setupEntry`
invece dell’ingresso completo del plugin. Questo mantiene startup e setup più leggeri
quando l’ingresso principale del plugin collega anche strumenti, hook o altro codice
solo runtime.

Opzionale: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
può far optare un plugin di canale nello stesso percorso `setupEntry` durante la fase di startup
pre-listen del gateway, anche quando il canale è già configurato.

Usalo solo quando `setupEntry` copre completamente la superficie di startup che deve esistere
prima che il gateway inizi ad ascoltare. In pratica, questo significa che l’ingresso di setup
deve registrare ogni capability posseduta dal canale da cui dipende lo startup, come:

- la registrazione del canale stesso
- eventuali route HTTP che devono essere disponibili prima che il gateway inizi ad ascoltare
- eventuali metodi, strumenti o servizi del gateway che devono esistere durante quella stessa finestra

Se l’ingresso completo possiede ancora qualunque capability di startup richiesta, non abilitare
questo flag. Mantieni il plugin sul comportamento predefinito e lascia che OpenClaw carichi
l’ingresso completo durante lo startup.

I canali inclusi possono anche pubblicare helper di superficie contrattuale solo di setup che il core
può consultare prima che il runtime completo del canale venga caricato. L’attuale superficie di
promozione setup è:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Il core usa questa superficie quando deve promuovere una configurazione di canale legacy ad account singolo in `channels.<id>.accounts.*` senza caricare l'intera voce del plugin. Matrix è l'esempio integrato attuale: sposta solo le chiavi di autenticazione/bootstrap in un account promosso con nome quando esistono già account con nome, e può conservare una chiave di account predefinito configurata non canonica invece di creare sempre `accounts.default`.

Questi adattatori di patch di configurazione mantengono pigra la scoperta della superficie contrattuale integrata. Il tempo di importazione resta leggero; la superficie di promozione viene caricata solo al primo utilizzo invece di rientrare nell'avvio del canale integrato durante l'importazione del modulo.

Quando queste superfici di avvio includono metodi RPC del Gateway, mantienili su un prefisso specifico del plugin. Gli spazi dei nomi amministrativi del core (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) rimangono riservati e si risolvono sempre in `operator.admin`, anche se un plugin richiede un ambito più ristretto.

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

I plugin di canale possono pubblicizzare metadati di configurazione/scoperta tramite `openclaw.channel` e suggerimenti di installazione tramite `openclaw.install`. Questo mantiene il catalogo del core privo di dati.

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
- `preferOver`: id di plugin/canale a priorità inferiore che questa voce del catalogo dovrebbe superare
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controlli del testo della superficie di selezione
- `markdownCapable`: contrassegna il canale come compatibile con markdown per le decisioni di formattazione in uscita
- `exposure.configured`: nasconde il canale dalle superfici di elenco dei canali configurati quando impostato su `false`
- `exposure.setup`: nasconde il canale dai selettori interattivi di configurazione quando impostato su `false`
- `exposure.docs`: contrassegna il canale come interno/privato per le superfici di navigazione della documentazione
- `showConfigured` / `showInSetup`: alias legacy ancora accettati per compatibilità; preferisci `exposure`
- `quickstartAllowFrom`: abilita il canale al flusso standard di avvio rapido `allowFrom`
- `forceAccountBinding`: richiede un'associazione esplicita dell'account anche quando esiste un solo account
- `preferSessionLookupForAnnounceTarget`: preferisce la ricerca della sessione quando risolve le destinazioni degli annunci

OpenClaw può anche unire **cataloghi di canali esterni** (per esempio, un'esportazione del registro MPM). Inserisci un file JSON in uno di questi percorsi:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oppure punta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a uno o più file JSON (delimitati da virgola/punto e virgola/`PATH`). Ogni file dovrebbe contenere `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Il parser accetta anche `"packages"` o `"plugins"` come alias legacy per la chiave `"entries"`.

Le voci generate del catalogo dei canali e le voci del catalogo di installazione dei provider espongono fatti normalizzati sulla sorgente di installazione accanto al blocco grezzo `openclaw.install`. I fatti normalizzati identificano se la specifica npm è una versione esatta o un selettore mobile, se sono presenti i metadati di integrità attesi e se è disponibile anche un percorso di sorgente locale. Quando l'identità del catalogo/pacchetto è nota, i fatti normalizzati avvisano se il nome del pacchetto npm analizzato diverge da tale identità. Avvisano anche quando `defaultChoice` non è valido o punta a una sorgente non disponibile, e quando i metadati di integrità npm sono presenti senza una sorgente npm valida. I consumatori dovrebbero trattare `installSource` come campo facoltativo aggiuntivo, così le voci create manualmente e gli shim di catalogo non devono sintetizzarlo. Questo consente a onboarding e diagnostica di spiegare lo stato del piano delle sorgenti senza importare il runtime del plugin.

Le voci npm esterne ufficiali dovrebbero preferire un `npmSpec` esatto più `expectedIntegrity`. I nomi di pacchetto semplici e i dist-tag continuano a funzionare per compatibilità, ma mostrano avvisi del piano delle sorgenti così il catalogo può muoversi verso installazioni fissate e verificate per integrità senza interrompere i plugin esistenti. Quando l'onboarding installa da un percorso di catalogo locale, registra una voce dell'indice dei plugin gestiti con `source: "path"` e un `sourcePath` relativo al workspace quando possibile. Il percorso di caricamento operativo assoluto resta in `plugins.load.paths`; il record di installazione evita di duplicare percorsi della workstation locale nella configurazione a lungo termine. Questo mantiene le installazioni di sviluppo locale visibili alla diagnostica del piano delle sorgenti senza aggiungere una seconda superficie grezza di divulgazione dei percorsi del filesystem. L'indice dei plugin persistito `plugins/installs.json` è la fonte di verità della sorgente di installazione e può essere aggiornato senza caricare i moduli runtime dei plugin. La sua mappa `installRecords` è durevole anche quando un manifesto del plugin manca o non è valido; il suo array `plugins` è una vista dei manifesti ricostruibile.

## Plugin del motore di contesto

I plugin del motore di contesto possiedono l'orchestrazione del contesto di sessione per acquisizione, assemblaggio e Compaction. Registrali dal tuo plugin con `api.registerContextEngine(id, factory)`, quindi seleziona il motore attivo con `plugins.slots.contextEngine`.

Usalo quando il tuo plugin deve sostituire o estendere la pipeline di contesto predefinita invece di aggiungere soltanto ricerca in memoria o hook.

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

## Aggiunta di una nuova capability

Quando un Plugin necessita di un comportamento che non rientra nell'API attuale, non aggirare
il sistema Plugin con un accesso privato interno. Aggiungi la capability mancante.

Sequenza consigliata:

1. definisci il contratto core
   Decidi quale comportamento condiviso debba appartenere al core: policy, fallback, unione della configurazione,
   ciclo di vita, semantica rivolta ai canali e forma degli helper runtime.
2. aggiungi superfici tipizzate di registrazione/runtime del Plugin
   Estendi `OpenClawPluginApi` e/o `api.runtime` con la più piccola
   superficie di capability tipizzata utile.
3. collega core + consumatori di canali/funzionalità
   I canali e i Plugin di funzionalità dovrebbero consumare la nuova capability tramite il core,
   non importando direttamente un'implementazione del fornitore.
4. registra le implementazioni dei fornitori
   I Plugin dei fornitori registrano quindi i propri backend rispetto alla capability.
5. aggiungi copertura del contratto
   Aggiungi test in modo che proprietà e forma di registrazione restino esplicite nel tempo.

È così che OpenClaw resta opinionato senza diventare codificato rigidamente sulla visione del mondo
di un singolo provider. Consulta il [Cookbook delle capability](/it/plugins/architecture)
per una checklist di file concreta e un esempio completo.

### Checklist delle capability

Quando aggiungi una nuova capability, l'implementazione dovrebbe di solito toccare insieme queste
superfici:

- tipi del contratto core in `src/<capability>/types.ts`
- helper runner/runtime core in `src/<capability>/runtime.ts`
- superficie di registrazione dell'API Plugin in `src/plugins/types.ts`
- cablaggio del registry Plugin in `src/plugins/registry.ts`
- esposizione runtime del Plugin in `src/plugins/runtime/*` quando i Plugin di funzionalità/canale
  devono consumarla
- helper di capture/test in `src/test-utils/plugin-registration.ts`
- asserzioni di proprietà/contratto in `src/plugins/contracts/registry.ts`
- documentazione per operatori/Plugin in `docs/`

Se una di queste superfici manca, di solito è un segnale che la capability
non è ancora completamente integrata.

### Template di capability

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

- il core possiede il contratto di capability + orchestrazione
- i Plugin dei fornitori possiedono le implementazioni dei fornitori
- i Plugin di funzionalità/canale consumano gli helper runtime
- i test del contratto mantengono esplicita la proprietà

## Correlati

- [Architettura Plugin](/it/plugins/architecture) — modello e forme pubbliche delle capability
- [Sottopercorsi dell'SDK Plugin](/it/plugins/sdk-subpaths)
- [Configurazione dell'SDK Plugin](/it/plugins/sdk-setup)
- [Creazione di Plugin](/it/plugins/building-plugins)
