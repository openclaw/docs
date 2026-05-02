---
read_when:
    - Implementazione degli hook di runtime dei provider, del ciclo di vita dei canali o dei gruppi di pacchetti
    - Debug dell'ordine di caricamento dei Plugin o dello stato del registro
    - Aggiungere una nuova funzionalità di Plugin o un Plugin del motore di contesto
summary: 'Dettagli interni dell''architettura dei Plugin: pipeline di caricamento, registro, hook di runtime, route HTTP e tabelle di riferimento'
title: Interni dell'architettura dei Plugin
x-i18n:
    generated_at: "2026-05-02T08:28:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2de741c4b496c7c3dd31dafebf39c4b9a32c5edd71bdd201c14037d9de31718f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Per il modello pubblico delle funzionalità, le forme dei plugin e i contratti di proprietà/esecuzione, vedi [Architettura dei Plugin](/it/plugins/architecture). Questa pagina è il riferimento per i meccanismi interni: pipeline di caricamento, registro, hook di runtime, route HTTP del Gateway, percorsi di importazione e tabelle degli schemi.

## Pipeline di caricamento

All'avvio, OpenClaw esegue approssimativamente questi passaggi:

1. individua le root dei plugin candidati
2. legge i manifest dei bundle nativi o compatibili e i metadati dei pacchetti
3. rifiuta i candidati non sicuri
4. normalizza la configurazione dei plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide l'abilitazione per ogni candidato
6. carica i moduli nativi abilitati: i moduli in bundle compilati usano un loader nativo;
   il codice sorgente TypeScript locale di terze parti usa il fallback di emergenza Jiti
7. chiama gli hook nativi `register(api)` e raccoglie le registrazioni nel registro dei plugin
8. espone il registro ai comandi e alle superfici di runtime

<Note>
`activate` è un alias legacy di `register`: il loader risolve quello presente (`def.register ?? def.activate`) e lo chiama nello stesso punto. Tutti i plugin in bundle usano `register`; preferisci `register` per i nuovi plugin.
</Note>

I gate di sicurezza vengono eseguiti **prima** dell'esecuzione del runtime. I candidati vengono bloccati quando l'entry esce dalla root del plugin, il percorso è scrivibile da tutti o la proprietà del percorso appare sospetta per plugin non in bundle.

### Comportamento manifest-first

Il manifest è la fonte di verità del control plane. OpenClaw lo usa per:

- identificare il plugin
- individuare canali/Skills/schema di configurazione dichiarati o funzionalità del bundle
- validare `plugins.entries.<id>.config`
- arricchire etichette/placeholder della Control UI
- mostrare metadati di installazione/catalogo
- preservare descrittori economici di attivazione e configurazione senza caricare il runtime del plugin

Per i plugin nativi, il modulo di runtime è la parte data-plane. Registra il comportamento effettivo, come hook, strumenti, comandi o flussi provider.

I blocchi opzionali `activation` e `setup` del manifest rimangono nel control plane. Sono descrittori solo di metadati per la pianificazione dell'attivazione e la discovery della configurazione; non sostituiscono la registrazione runtime, `register(...)` o `setupEntry`. I primi consumer di attivazione live ora usano gli hint di comando, canale e provider del manifest per restringere il caricamento dei plugin prima di una materializzazione più ampia del registro:

- il caricamento CLI si restringe ai plugin proprietari del comando primario richiesto
- la risoluzione della configurazione/plugin del canale si restringe ai plugin proprietari dell'id del canale richiesto
- la risoluzione esplicita della configurazione/runtime del provider si restringe ai plugin proprietari dell'id del provider richiesto
- la pianificazione di avvio del Gateway usa `activation.onStartup` per import espliciti all'avvio e opt-out dall'avvio; i plugin senza metadati di avvio si caricano solo tramite trigger di attivazione più ristretti

Il pianificatore di attivazione espone sia un'API solo con id per i chiamanti esistenti sia un'API di piano per la nuova diagnostica. Le voci del piano riportano perché un plugin è stato selezionato, separando gli hint espliciti del pianificatore `activation.*` dal fallback di proprietà del manifest, come `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` e hook. Questa separazione delle ragioni è il confine di compatibilità: i metadati dei plugin esistenti continuano a funzionare, mentre il nuovo codice può rilevare hint ampi o comportamento di fallback senza modificare la semantica del caricamento runtime.

La discovery della configurazione ora preferisce id posseduti dal descrittore, come `setup.providers` e `setup.cliBackends`, per restringere i plugin candidati prima di ricadere su `setup-api` per i plugin che necessitano ancora di hook runtime in fase di configurazione. Gli elenchi di configurazione provider usano `providerAuthChoices` del manifest, scelte di configurazione derivate dal descrittore e metadati del catalogo di installazione senza caricare il runtime provider. `setup.requiresRuntime: false` esplicito è un limite solo descrittore; `requiresRuntime` omesso mantiene il fallback legacy `setup-api` per compatibilità. Se più di un plugin individuato rivendica lo stesso provider di configurazione normalizzato o id di backend CLI, la ricerca della configurazione rifiuta il proprietario ambiguo invece di affidarsi all'ordine di discovery. Quando il runtime di configurazione viene eseguito, la diagnostica del registro segnala divergenze tra `setup.providers` / `setup.cliBackends` e i provider o backend CLI registrati da setup-api senza bloccare i plugin legacy.

### Confine della cache dei plugin

OpenClaw non memorizza nella cache i risultati della discovery dei plugin o i dati diretti del registro dei manifest dietro finestre temporali wall-clock. Installazioni, modifiche ai manifest e cambiamenti dei percorsi di caricamento devono diventare visibili alla successiva lettura esplicita dei metadati o ricostruzione dello snapshot. Il parser dei file manifest può mantenere una cache limitata della firma del file basata su percorso del manifest aperto, inode, dimensione e timestamp; quella cache evita solo di riparsare byte invariati e non deve memorizzare nella cache risposte di discovery, registro, proprietario o policy.

Il fast path sicuro dei metadati è la proprietà esplicita degli oggetti, non una cache nascosta. I percorsi critici di avvio del Gateway devono passare l'attuale `PluginMetadataSnapshot`, la `PluginLookUpTable` derivata o un registro manifest esplicito lungo la catena di chiamate. Validazione della configurazione, auto-abilitazione all'avvio, bootstrap dei plugin e selezione provider possono riutilizzare questi oggetti finché rappresentano la configurazione e l'inventario plugin correnti. La ricerca della configurazione ricostruisce ancora i metadati del manifest on demand, a meno che il percorso di configurazione specifico riceva un registro manifest esplicito; mantienilo come fallback cold-path invece di aggiungere cache di lookup nascoste. Quando l'input cambia, ricostruisci e sostituisci lo snapshot invece di mutarlo o mantenere copie storiche.
Le viste sul registro dei plugin attivi e gli helper di bootstrap dei canali in bundle devono essere ricalcolati dal registro/root corrente. Mappe di breve durata vanno bene dentro una singola chiamata per deduplicare lavoro o proteggere dal rientro; non devono diventare cache di metadati di processo.

Per il caricamento dei plugin, lo strato di cache persistente è il caricamento runtime. Può riutilizzare lo stato del loader quando codice o artefatti installati vengono effettivamente caricati, come:

- `PluginLoaderCacheState` e registri runtime attivi compatibili
- cache jiti/moduli e cache del loader della superficie pubblica usate per evitare di importare ripetutamente la stessa superficie runtime
- cache filesystem per artefatti plugin installati
- mappe per chiamata di breve durata per normalizzazione dei percorsi o risoluzione dei duplicati

Queste cache sono dettagli implementativi del data-plane. Non devono rispondere a domande del control-plane come "quale plugin possiede questo provider?" a meno che il chiamante non abbia chiesto deliberatamente il caricamento runtime.

Non aggiungere cache persistenti o wall-clock per:

- risultati della discovery
- registri manifest diretti
- registri manifest ricostruiti dall'indice dei plugin installati
- lookup del proprietario provider, soppressione dei modelli, policy provider o metadati di artefatti pubblici
- qualsiasi altra risposta derivata dal manifest in cui un manifest modificato, un indice installato o un percorso di caricamento deve essere visibile alla successiva lettura dei metadati

I chiamanti che ricostruiscono metadati manifest dall'indice persistito dei plugin installati ricostruiscono quel registro on demand. L'indice installato è stato source-plane durevole; non è una cache di metadati in-process nascosta.

## Modello del registro

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

Le funzionalità core poi leggono da quel registro invece di parlare direttamente con i moduli plugin. Questo mantiene il caricamento unidirezionale:

- modulo plugin -> registrazione nel registro
- runtime core -> consumo del registro

Questa separazione è importante per la manutenibilità. Significa che la maggior parte delle superfici core necessita di un solo punto di integrazione: "leggi il registro", non "gestisci casi speciali per ogni modulo plugin".

## Callback di binding della conversazione

I plugin che associano una conversazione possono reagire quando un'approvazione viene risolta.

Usa `api.onConversationBindingResolved(...)` per ricevere una callback dopo che una richiesta di binding viene approvata o negata:

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
- `binding`: il binding risolto per le richieste approvate
- `request`: il riepilogo della richiesta originale, hint di distacco, id del mittente e metadati della conversazione

Questa callback è solo una notifica. Non cambia chi è autorizzato ad associare una conversazione e viene eseguita dopo il completamento della gestione dell'approvazione core.

## Hook runtime provider

I plugin provider hanno tre livelli:

- **Metadati del manifest** per lookup economici pre-runtime:
  `setup.providers[].envVars`, compatibilità deprecata `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` e `channelEnvVars`.
- **Hook in fase di configurazione**: `catalog` (legacy `discovery`) più
  `applyConfigDefaults`.
- **Hook runtime**: oltre 40 hook opzionali che coprono autenticazione, risoluzione dei modelli, wrapping dello stream, livelli di thinking, policy di replay ed endpoint di utilizzo. Vedi l'elenco completo in [Ordine e uso degli hook](#hook-order-and-usage).

OpenClaw possiede ancora il loop agente generico, il failover, la gestione dei transcript e la policy degli strumenti. Questi hook sono la superficie di estensione per comportamenti specifici dei provider senza richiedere un intero trasporto di inferenza personalizzato.

Usa `setup.providers[].envVars` del manifest quando il provider ha credenziali basate su env che i percorsi generici di auth/status/model-picker devono vedere senza caricare il runtime del plugin. `providerAuthEnvVars` deprecato viene ancora letto dall'adattatore di compatibilità durante la finestra di deprecazione, e i plugin non in bundle che lo usano ricevono una diagnostica del manifest. Usa `providerAuthAliases` del manifest quando un id provider deve riutilizzare env vars, profili auth, auth basata su config e scelta di onboarding API key di un altro id provider. Usa `providerAuthChoices` del manifest quando le superfici CLI di onboarding/scelta auth devono conoscere l'id della scelta del provider, le etichette di gruppo e il cablaggio auth semplice a flag singolo senza caricare il runtime provider. Mantieni `envVars` del runtime provider per hint rivolti agli operatori, come etichette di onboarding o variabili di configurazione client-id/client-secret OAuth.

Usa `channelEnvVars` del manifest quando un canale ha auth o configurazione guidata da env che fallback generico shell-env, controlli config/status o prompt di configurazione devono vedere senza caricare il runtime del canale.

### Ordine e uso degli hook

Per i plugin model/provider, OpenClaw chiama gli hook in questo ordine approssimativo.
La colonna "Quando usarlo" è la guida rapida alla decisione.
I campi provider solo compatibilità che OpenClaw non chiama più, come `ProviderPlugin.capabilities` e `suppressBuiltInModel`, sono intenzionalmente esclusi da questo elenco.

| #   | Hook                              | Cosa fa                                                                                                        | Quando usarlo                                                                                                                                 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Pubblica la configurazione del fornitore in `models.providers` durante la generazione di `models.json`         | Il fornitore possiede un catalogo o valori predefiniti per l'URL di base                                                                      |
| 2   | `applyConfigDefaults`             | Applica i valori predefiniti globali della configurazione del fornitore durante la materializzazione della configurazione | I valori predefiniti dipendono dalla modalità di autenticazione, dall'ambiente o dalla semantica della famiglia di modelli del fornitore      |
| --  | _(ricerca modello integrata)_      | OpenClaw prova prima il normale percorso registry/catalogo                                                     | _(non è un hook di Plugin)_                                                                                                                   |
| 3   | `normalizeModelId`                | Normalizza alias legacy o di anteprima degli ID modello prima della ricerca                                    | Il fornitore possiede la pulizia degli alias prima della risoluzione canonica del modello                                                     |
| 4   | `normalizeTransport`              | Normalizza `api` / `baseUrl` della famiglia di fornitori prima dell'assemblaggio generico del modello          | Il fornitore possiede la pulizia del trasporto per ID fornitore personalizzati nella stessa famiglia di trasporto                             |
| 5   | `normalizeConfig`                 | Normalizza `models.providers.<id>` prima della risoluzione runtime/fornitore                                   | Il fornitore necessita di una pulizia della configurazione che dovrebbe risiedere nel Plugin; gli helper Google-family in bundle fungono anche da supporto per le voci di configurazione Google supportate |
| 6   | `applyNativeStreamingUsageCompat` | Applica riscritture di compatibilità dell'uso dello streaming nativo ai fornitori di configurazione            | Il fornitore necessita di correzioni dei metadati di uso dello streaming nativo guidate dall'endpoint                                         |
| 7   | `resolveConfigApiKey`             | Risolve l'autenticazione tramite marker env per i fornitori di configurazione prima del caricamento dell'autenticazione runtime | Il fornitore ha una risoluzione della chiave API tramite marker env di proprietà del fornitore; anche `amazon-bedrock` ha qui un resolver AWS tramite marker env integrato |
| 8   | `resolveSyntheticAuth`            | Espone autenticazione locale/self-hosted o basata su configurazione senza persistere testo in chiaro           | Il fornitore può operare con un marker di credenziale sintetico/locale                                                                        |
| 9   | `resolveExternalAuthProfiles`     | Sovrappone profili di autenticazione esterni di proprietà del fornitore; il valore predefinito di `persistence` è `runtime-only` per credenziali di proprietà di CLI/app | Il fornitore riusa credenziali di autenticazione esterne senza persistere token di refresh copiati; dichiarare `contracts.externalAuthProviders` nel manifesto |
| 10  | `shouldDeferSyntheticProfileAuth` | Abbassa la precedenza dei segnaposto di profilo sintetici memorizzati rispetto all'autenticazione basata su env/configurazione | Il fornitore memorizza profili segnaposto sintetici che non dovrebbero prevalere                                                              |
| 11  | `resolveDynamicModel`             | Fallback sincrono per ID modello di proprietà del fornitore non ancora presenti nel registry locale            | Il fornitore accetta ID modello upstream arbitrari                                                                                            |
| 12  | `prepareDynamicModel`             | Riscaldamento asincrono, poi `resolveDynamicModel` viene eseguito di nuovo                                    | Il fornitore necessita di metadati di rete prima di risolvere ID sconosciuti                                                                  |
| 13  | `normalizeResolvedModel`          | Riscrittura finale prima che il runner incorporato usi il modello risolto                                      | Il fornitore necessita di riscritture del trasporto ma usa comunque un trasporto core                                                         |
| 14  | `contributeResolvedModelCompat`   | Contribuisce flag di compatibilità per modelli vendor dietro un altro trasporto compatibile                    | Il fornitore riconosce i propri modelli su trasporti proxy senza prendere il controllo del fornitore                                          |
| 15  | `normalizeToolSchemas`            | Normalizza gli schemi degli strumenti prima che il runner incorporato li veda                                  | Il fornitore necessita di pulizia degli schemi della famiglia di trasporto                                                                    |
| 16  | `inspectToolSchemas`              | Espone diagnostica degli schemi di proprietà del fornitore dopo la normalizzazione                             | Il fornitore vuole avvisi sulle parole chiave senza insegnare al core regole specifiche del fornitore                                         |
| 17  | `resolveReasoningOutputMode`      | Seleziona il contratto di output di ragionamento nativo rispetto a quello con tag                              | Il fornitore necessita di ragionamento/output finale con tag invece dei campi nativi                                                          |
| 18  | `prepareExtraParams`              | Normalizzazione dei parametri di richiesta prima dei wrapper generici delle opzioni di stream                  | Il fornitore necessita di parametri di richiesta predefiniti o di pulizia dei parametri per fornitore                                         |
| 19  | `createStreamFn`                  | Sostituisce completamente il normale percorso di stream con un trasporto personalizzato                        | Il fornitore necessita di un protocollo wire personalizzato, non solo di un wrapper                                                           |
| 20  | `wrapStreamFn`                    | Wrapper di stream dopo l'applicazione dei wrapper generici                                                     | Il fornitore necessita di wrapper di compatibilità per header/corpo/modello della richiesta senza un trasporto personalizzato                 |
| 21  | `resolveTransportTurnState`       | Allega header o metadati di trasporto nativi per turno                                                         | Il fornitore vuole che i trasporti generici inviino l'identità nativa del turno del fornitore                                                 |
| 22  | `resolveWebSocketSessionPolicy`   | Allega header WebSocket nativi o una policy di raffreddamento della sessione                                   | Il fornitore vuole che i trasporti WS generici regolino gli header di sessione o la policy di fallback                                        |
| 23  | `formatApiKey`                    | Formatter del profilo di autenticazione: il profilo memorizzato diventa la stringa runtime `apiKey`           | Il fornitore memorizza metadati di autenticazione aggiuntivi e necessita di una forma di token runtime personalizzata                         |
| 24  | `refreshOAuth`                    | Override del refresh OAuth per endpoint di refresh personalizzati o policy di errore del refresh               | Il fornitore non è compatibile con i refresher `pi-ai` condivisi                                                                              |
| 25  | `buildAuthDoctorHint`             | Suggerimento di riparazione aggiunto quando il refresh OAuth fallisce                                          | Il fornitore necessita di indicazioni di riparazione dell'autenticazione di proprietà del fornitore dopo un errore di refresh                 |
| 26  | `matchesContextOverflowError`     | Matcher di overflow della finestra di contesto di proprietà del fornitore                                      | Il fornitore ha errori raw di overflow che le euristiche generiche non rileverebbero                                                          |
| 27  | `classifyFailoverReason`          | Classificazione del motivo di failover di proprietà del fornitore                                              | Il fornitore può mappare errori raw di API/trasporto a rate limit/sovraccarico/ecc.                                                           |
| 28  | `isCacheTtlEligible`              | Policy della cache dei prompt per fornitori proxy/backhaul                                                     | Il fornitore necessita di gating TTL della cache specifico per proxy                                                                          |
| 29  | `buildMissingAuthMessage`         | Sostituzione del messaggio generico di recupero per autenticazione mancante                                    | Il fornitore necessita di un suggerimento di recupero per autenticazione mancante specifico del fornitore                                     |
| 30  | `augmentModelCatalog`             | Righe sintetiche/finali del catalogo aggiunte dopo la discovery                                                | Il fornitore necessita di righe sintetiche di compatibilità futura in `models list` e nei selettori                                          |
| 31  | `resolveThinkingProfile`          | Set di livelli `/think` specifici del modello, etichette di visualizzazione e valore predefinito               | Il fornitore espone una scala di thinking personalizzata o un'etichetta binaria per modelli selezionati                                       |
| 32  | `isBinaryThinking`                | Hook di compatibilità per l'interruttore on/off del ragionamento                                               | Il fornitore espone solo thinking binario on/off                                                                                              |
| 33  | `supportsXHighThinking`           | Hook di compatibilità del supporto al ragionamento `xhigh`                                                     | Il fornitore vuole `xhigh` solo su un sottoinsieme di modelli                                                                                 |
| 34  | `resolveDefaultThinkingLevel`     | Hook di compatibilità del livello `/think` predefinito                                                         | Il fornitore possiede la policy `/think` predefinita per una famiglia di modelli                                                              |
| 35  | `isModernModelRef`                | Matcher di modello moderno per filtri dei profili live e selezione smoke                                       | Il fornitore possiede il matching dei modelli preferiti live/smoke                                                                            |
| 36  | `prepareRuntimeAuth`              | Scambia una credenziale configurata nel token/chiave runtime effettivo appena prima dell'inferenza             | Il fornitore necessita di uno scambio di token o di una credenziale di richiesta di breve durata                                              |
| 37  | `resolveUsageAuth`                | Risolve le credenziali di utilizzo/fatturazione per `/usage` e le superfici di stato correlate                                     | Il provider richiede analisi personalizzata del token di utilizzo/quota o una credenziale di utilizzo diversa                                                               |
| 38  | `fetchUsageSnapshot`              | Recupera e normalizza gli snapshot di utilizzo/quota specifici del provider dopo la risoluzione dell'autenticazione                             | Il provider richiede un endpoint di utilizzo specifico del provider o un parser del payload                                                                           |
| 39  | `createEmbeddingProvider`         | Crea un adattatore di embedding gestito dal provider per memoria/ricerca                                                     | Il comportamento di embedding della memoria appartiene al Plugin del provider                                                                                    |
| 40  | `buildReplayPolicy`               | Restituisce una policy di replay che controlla la gestione della trascrizione per il provider                                        | Il provider richiede una policy di trascrizione personalizzata (ad esempio, la rimozione dei blocchi di ragionamento)                                                               |
| 41  | `sanitizeReplayHistory`           | Riscrive la cronologia di replay dopo la pulizia generica della trascrizione                                                        | Il provider richiede riscritture di replay specifiche del provider oltre agli helper di Compaction condivisi                                                             |
| 42  | `validateReplayTurns`             | Esegue la validazione finale dei turni di replay o la loro ristrutturazione prima del runner incorporato                                           | Il trasporto del provider richiede una validazione dei turni più rigorosa dopo la sanitizzazione generica                                                                    |
| 43  | `onModelSelected`                 | Esegue gli effetti collaterali post-selezione gestiti dal provider                                                                 | Il provider richiede telemetria o stato gestito dal provider quando un modello diventa attivo                                                                  |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` controllano prima il
plugin del provider corrispondente, quindi passano agli altri plugin provider
con hook disponibili finché uno non modifica effettivamente l'id del modello o
il trasporto/la configurazione. Questo mantiene funzionanti gli shim provider
per alias/compatibilità senza richiedere al chiamante di sapere quale plugin
incluso possiede la riscrittura. Se nessun hook provider riscrive una voce di
configurazione Google-family supportata, il normalizzatore della configurazione
Google incluso applica comunque quella pulizia di compatibilità.

Se il provider richiede un protocollo wire completamente personalizzato o un
executor di richiesta personalizzato, si tratta di una classe diversa di
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

I plugin provider inclusi combinano gli hook sopra per adattarsi alle esigenze
di catalogo, autenticazione, thinking, replay e utilizzo di ciascun vendor. Il
set di hook autorevole si trova con ciascun plugin in `extensions/`; questa
pagina illustra le forme invece di rispecchiare l'elenco.

<AccordionGroup>
  <Accordion title="Provider con catalogo pass-through">
    OpenRouter, Kilocode, Z.AI, xAI registrano `catalog` più
    `resolveDynamicModel` / `prepareDynamicModel` per poter esporre gli id dei
    modelli upstream prima del catalogo statico di OpenClaw.
  </Accordion>
  <Accordion title="Provider OAuth ed endpoint di utilizzo">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai associano
    `prepareRuntimeAuth` o `formatApiKey` a `resolveUsageAuth` +
    `fetchUsageSnapshot` per gestire direttamente lo scambio di token e
    l'integrazione con `/usage`.
  </Accordion>
  <Accordion title="Famiglie di replay e pulizia transcript">
    Le famiglie condivise con nome (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permettono ai provider di
    aderire alla policy del transcript tramite `buildReplayPolicy` invece che
    fare reimplementare la pulizia a ciascun plugin.
  </Accordion>
  <Accordion title="Provider solo catalogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` e
    `volcengine` registrano solo `catalog` e usano il ciclo di inferenza
    condiviso.
  </Accordion>
  <Accordion title="Helper di stream specifici per Anthropic">
    Gli header beta, `/fast` / `serviceTier` e `context1m` vivono nel seam
    pubblico `api.ts` / `contract-api.ts` del plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) invece che
    nell'SDK generico.
  </Accordion>
</AccordionGroup>

## Helper runtime

I plugin possono accedere a helper core selezionati tramite `api.runtime`. Per
TTS:

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

- `textToSpeech` restituisce il normale payload di output TTS core per superfici file/voice-note.
- Usa la configurazione core `messages.tts` e la selezione del provider.
- Restituisce buffer audio PCM + frequenza di campionamento. I plugin devono ricampionare/codificare per i provider.
- `listVoices` è opzionale per provider. Usalo per selettori vocali o flussi di configurazione di proprietà del vendor.
- Gli elenchi vocali possono includere metadati più ricchi, come locale, genere e tag di personalità per selettori consapevoli del provider.
- OpenAI ed ElevenLabs oggi supportano la telefonia. Microsoft no.

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
- Usa i provider vocali per il comportamento di sintesi di proprietà del vendor.
- L'input Microsoft legacy `edge` viene normalizzato nell'id provider `microsoft`.
- Il modello di ownership preferito è orientato all'azienda: un plugin vendor può possedere provider di testo, voce, immagini e futuri media man mano che OpenClaw aggiunge questi contratti di capability.

Per la comprensione di immagini/audio/video, i plugin registrano un provider
tipizzato di media-understanding invece di una generica borsa chiave/valore:

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
- L'espansione additiva deve restare tipizzata: nuovi metodi opzionali, nuovi campi risultato opzionali, nuove capability opzionali.
- La generazione video segue già lo stesso pattern:
  - il core possiede il contratto di capability e l'helper runtime
  - i plugin vendor registrano `api.registerVideoGenerationProvider(...)`
  - i plugin feature/canale consumano `api.runtime.videoGeneration.*`

Per gli helper runtime di media-understanding, i plugin possono chiamare:

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

Per la trascrizione audio, i plugin possono usare il runtime media-understanding
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

- `api.runtime.mediaUnderstanding.*` è la superficie condivisa preferita per la comprensione di immagini/audio/video.
- Usa la configurazione audio core di media-understanding (`tools.media.audio`) e l'ordine di fallback dei provider.
- Restituisce `{ text: undefined }` quando non viene prodotto alcun output di trascrizione (ad esempio input ignorato/non supportato).
- `api.runtime.stt.transcribeAudioFile(...)` resta disponibile come alias di compatibilità.

I plugin possono anche avviare esecuzioni subagent in background tramite `api.runtime.subagent`:

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
- OpenClaw onora quei campi di override solo per chiamanti attendibili.
- Per esecuzioni di fallback di proprietà del plugin, gli operatori devono aderire con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` per limitare i plugin attendibili a specifiche destinazioni canoniche `provider/model`, oppure `"*"` per consentire esplicitamente qualsiasi destinazione.
- Le esecuzioni subagent di plugin non attendibili funzionano comunque, ma le richieste di override vengono rifiutate invece di ricadere silenziosamente sul fallback.
- Le sessioni subagent create da plugin vengono marcate con l'id del plugin creatore. Il fallback `api.runtime.subagent.deleteSession(...)` può eliminare solo quelle sessioni possedute; l'eliminazione arbitraria di sessioni richiede comunque una richiesta Gateway con scope admin.

Per la ricerca web, i plugin possono consumare l'helper runtime condiviso invece
di entrare nel cablaggio degli strumenti dell'agente:

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
- Usa i provider di ricerca web per trasporti di ricerca specifici del vendor.
- `api.runtime.webSearch.*` è la superficie condivisa preferita per plugin feature/canale che necessitano del comportamento di ricerca senza dipendere dal wrapper dello strumento agente.

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
- `listProviders(...)`: elenca i provider di generazione immagini disponibili e le loro capability.

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

- `path`: percorso della route sotto il server HTTP del Gateway.
- `auth`: obbligatorio. Usa `"gateway"` per richiedere la normale autenticazione Gateway, oppure `"plugin"` per autenticazione/verifica Webhook gestita dal plugin.
- `match`: opzionale. `"exact"` (predefinito) o `"prefix"`.
- `replaceExisting`: opzionale. Consente allo stesso plugin di sostituire la propria registrazione di route esistente.
- `handler`: restituisci `true` quando la route ha gestito la richiesta.

Note:

- `api.registerHttpHandler(...)` è stato rimosso e causerà un errore di caricamento del plugin. Usa invece `api.registerHttpRoute(...)`.
- Le route dei plugin devono dichiarare `auth` esplicitamente.
- I conflitti esatti `path + match` vengono rifiutati a meno che `replaceExisting: true`, e un plugin non può sostituire la route di un altro plugin.
- Le route sovrapposte con livelli di `auth` diversi vengono rifiutate. Mantieni le catene di fallback `exact`/`prefix` solo sullo stesso livello di auth.
- Le route `auth: "plugin"` **non** ricevono automaticamente gli scope runtime dell'operatore. Sono per webhook/verifica della firma gestiti dal plugin, non per chiamate helper privilegiate del Gateway.
- Le route `auth: "gateway"` vengono eseguite all'interno di uno scope runtime di richiesta del Gateway, ma quello scope è intenzionalmente conservativo:
  - l'autenticazione bearer con segreto condiviso (`gateway.auth.mode = "token"` / `"password"`) mantiene gli scope runtime delle route plugin fissati a `operator.write`, anche se il chiamante invia `x-openclaw-scopes`
  - le modalità HTTP attendibili che trasportano identità (per esempio `trusted-proxy` o `gateway.auth.mode = "none"` su un ingresso privato) rispettano `x-openclaw-scopes` solo quando l'header è esplicitamente presente
  - se `x-openclaw-scopes` è assente su quelle richieste di route plugin che trasportano identità, lo scope runtime torna a `operator.write`
- Regola pratica: non presumere che una route plugin con auth gateway sia una superficie admin implicita. Se la tua route richiede comportamento solo admin, richiedi una modalità auth che trasporti identità e documenta il contratto esplicito dell'header `x-openclaw-scopes`.

## Percorsi di importazione del Plugin SDK

Usa sottopercorsi SDK ristretti invece del barrel root monolitico `openclaw/plugin-sdk`
quando crei nuovi plugin. Sottopercorsi core:

| Sottopercorso                      | Scopo                                              |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitive di registrazione del Plugin              |
| `openclaw/plugin-sdk/channel-core`  | Helper di entry/build del canale                   |
| `openclaw/plugin-sdk/core`          | Helper condivisi generici e contratto ombrello     |
| `openclaw/plugin-sdk/config-schema` | Schema Zod root `openclaw.json` (`OpenClawSchema`) |

I plugin di canale scelgono da una famiglia di seam ristretti — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` e `channel-actions`. Il comportamento di approvazione dovrebbe consolidarsi
su un unico contratto `approvalCapability` invece di mescolare campi
plugin non correlati. Vedi [Plugin di canale](/it/plugins/sdk-channel-plugins).

Gli helper runtime e config vivono sotto sottopercorsi `*-runtime` focalizzati corrispondenti
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, ecc.). Preferisci `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` e `config-mutation`
invece dell'ampio barrel di compatibilità `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
e `openclaw/plugin-sdk/infra-runtime` sono shim di compatibilità deprecati per
plugin meno recenti. Il nuovo codice dovrebbe importare primitive generiche più ristrette.
</Info>

Entry point interni al repository (per root package del plugin bundled):

- `index.js` — entry del plugin bundled
- `api.js` — barrel di helper/tipi
- `runtime-api.js` — barrel solo runtime
- `setup-entry.js` — entry del plugin di setup

I plugin esterni dovrebbero importare solo sottopercorsi `openclaw/plugin-sdk/*`. Non
importare mai `src/*` del package di un altro plugin dal core o da un altro plugin.
Gli entry point caricati tramite facciata preferiscono lo snapshot della config runtime attiva quando
esiste, poi ripiegano sul file config risolto su disco.

Sottopercorsi specifici per capability come `image-generation`, `media-understanding`
e `speech` esistono perché oggi i plugin bundled li usano. Non sono
automaticamente contratti esterni congelati a lungo termine: controlla la pagina di riferimento SDK
pertinente quando fai affidamento su di essi.

## Schemi dello strumento messaggi

I plugin dovrebbero possedere i contributi schema `describeMessageTool(...)`
specifici del canale per primitive non di messaggio come reazioni, letture e sondaggi.
La presentazione di invio condivisa dovrebbe usare il contratto generico `MessagePresentation`
invece di campi button, component, block o card nativi del provider.
Vedi [Presentazione dei messaggi](/it/plugins/message-presentation) per il contratto,
le regole di fallback, la mappatura dei provider e la checklist per autori di plugin.

I plugin capaci di inviare dichiarano cosa possono renderizzare tramite capability dei messaggi:

- `presentation` per blocchi di presentazione semantici (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` per richieste di consegna fissata

Il core decide se renderizzare la presentazione in modo nativo o degradarla a testo.
Non esporre scappatoie UI native del provider dallo strumento messaggi generico.
Gli helper SDK deprecati per schemi nativi legacy restano esportati per i
plugin di terze parti esistenti, ma i nuovi plugin non dovrebbero usarli.

## Risoluzione del target di canale

I plugin di canale dovrebbero possedere la semantica dei target specifica del canale. Mantieni generico
l'host outbound condiviso e usa la superficie dell'adapter di messaggistica per le regole del provider:

- `messaging.inferTargetChatType({ to })` decide se un target normalizzato
  debba essere trattato come `direct`, `group` o `channel` prima della ricerca nella directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` dice al core se un
  input deve saltare direttamente alla risoluzione tipo id invece della ricerca nella directory.
- `messaging.targetResolver.resolveTarget(...)` è il fallback del plugin quando
  il core necessita di una risoluzione finale posseduta dal provider dopo la normalizzazione o dopo un
  mancato riscontro nella directory.
- `messaging.resolveOutboundSessionRoute(...)` possiede la costruzione della route di sessione
  specifica del provider una volta risolto un target.

Suddivisione consigliata:

- Usa `inferTargetChatType` per decisioni di categoria che dovrebbero avvenire prima
  della ricerca di peer/gruppi.
- Usa `looksLikeId` per controlli "tratta questo come id target esplicito/nativo".
- Usa `resolveTarget` per fallback di normalizzazione specifico del provider, non per
  ricerche ampie nella directory.
- Mantieni id nativi del provider come id chat, id thread, JID, handle e id stanza
  dentro i valori `target` o parametri specifici del provider, non in campi SDK
  generici.

## Directory supportate da config

I plugin che derivano voci di directory dalla config dovrebbero mantenere quella logica nel
plugin e riusare gli helper condivisi da
`openclaw/plugin-sdk/directory-runtime`.

Usalo quando un canale necessita peer/gruppi supportati da config come:

- peer DM guidati da allowlist
- mappe di canali/gruppi configurate
- fallback di directory statiche con scope account

Gli helper condivisi in `directory-runtime` gestiscono solo operazioni generiche:

- filtro delle query
- applicazione del limite
- helper di deduplicazione/normalizzazione
- costruzione di `ChannelDirectoryEntry[]`

L'ispezione account specifica del canale e la normalizzazione degli id dovrebbero restare
nell'implementazione del plugin.

## Cataloghi provider

I plugin provider possono definire cataloghi di modelli per inferenza con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` restituisce la stessa forma che OpenClaw scrive in
`models.providers`:

- `{ provider }` per una voce provider
- `{ providers }` per più voci provider

Usa `catalog` quando il plugin possiede id modello specifici del provider, default di base URL
o metadati modello protetti da auth.

`catalog.order` controlla quando il catalogo di un plugin viene unito rispetto ai provider impliciti
integrati di OpenClaw:

- `simple`: provider semplici guidati da chiave API o env
- `profile`: provider che compaiono quando esistono profili auth
- `paired`: provider che sintetizzano più voci provider correlate
- `late`: ultimo passaggio, dopo altri provider impliciti

I provider successivi vincono in caso di collisione di chiave, quindi i plugin possono sovrascrivere intenzionalmente
una voce provider integrata con lo stesso id provider.

Compatibilità:

- `discovery` funziona ancora come alias legacy
- se sono registrati sia `catalog` sia `discovery`, OpenClaw usa `catalog`

## Ispezione canale in sola lettura

Se il tuo plugin registra un canale, preferisci implementare
`plugin.config.inspectAccount(cfg, accountId)` insieme a `resolveAccount(...)`.

Perché:

- `resolveAccount(...)` è il percorso runtime. Può presumere che le credenziali
  siano completamente materializzate e può fallire rapidamente quando i secret richiesti mancano.
- I percorsi dei comandi in sola lettura come `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e i flussi doctor/config
  repair non dovrebbero dover materializzare le credenziali runtime solo per
  descrivere la configurazione.

Comportamento consigliato per `inspectAccount(...)`:

- Restituisci solo stato account descrittivo.
- Preserva `enabled` e `configured`.
- Includi campi di origine/stato delle credenziali quando rilevanti, come:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Non è necessario restituire valori token raw solo per riportare disponibilità
  in sola lettura. Restituire `tokenStatus: "available"` (e il campo source
  corrispondente) è sufficiente per comandi stile status.
- Usa `configured_unavailable` quando una credenziale è configurata tramite SecretRef ma
  non disponibile nel percorso comando corrente.

Questo consente ai comandi in sola lettura di riportare "configurato ma non disponibile in questo percorso
comando" invece di bloccarsi o riportare erroneamente l'account come non configurato.

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

Ogni entry diventa un plugin. Se il pack elenca più estensioni, l'id del plugin
diventa `name/<fileBase>`.

Se il tuo plugin importa dipendenze npm, installale in quella directory così che
`node_modules` sia disponibile (`npm install` / `pnpm install`).

Guardrail di sicurezza: ogni entry `openclaw.extensions` deve restare dentro la directory plugin
dopo la risoluzione dei symlink. Le entry che escono dalla directory package vengono
rifiutate.

Nota di sicurezza: `openclaw plugins install` installa le dipendenze del plugin con un
`npm install --omit=dev --ignore-scripts` locale al progetto (nessuno script lifecycle,
nessuna dipendenza dev a runtime), ignorando le impostazioni globali npm install ereditate.
Mantieni gli alberi di dipendenze dei plugin "pure JS/TS" ed evita package che richiedono
build `postinstall`.

Opzionale: `openclaw.setupEntry` può puntare a un modulo leggero solo setup.
Quando OpenClaw necessita superfici di setup per un plugin di canale disabilitato, o
quando un plugin di canale è abilitato ma ancora non configurato, carica `setupEntry`
invece dell'entry completa del plugin. Questo rende startup e setup più leggeri
quando l'entry principale del tuo plugin collega anche strumenti, hook o altro codice
solo runtime.

Opzionale: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
può far entrare un plugin di canale nello stesso percorso `setupEntry` durante la fase di startup
pre-listen del gateway, anche quando il canale è già configurato.

Usalo solo quando `setupEntry` copre completamente la superficie di startup che deve esistere
prima che il gateway inizi ad ascoltare. In pratica, ciò significa che l'entry di setup
deve registrare ogni capability posseduta dal canale da cui dipende lo startup, come:

- la registrazione del canale stesso
- eventuali route HTTP che devono essere disponibili prima che il gateway inizi ad ascoltare
- eventuali metodi gateway, strumenti o servizi che devono esistere durante quella stessa finestra

Se la tua entry completa possiede ancora una capability di startup richiesta, non abilitare
questo flag. Mantieni il plugin sul comportamento predefinito e lascia che OpenClaw carichi
l'entry completa durante lo startup.

I canali bundled possono anche pubblicare helper di superficie contratto solo setup che il core
può consultare prima che il runtime completo del canale venga caricato. La superficie di promozione
setup corrente è:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Il core usa questa superficie quando deve promuovere una configurazione di canale legacy a singolo account in `channels.<id>.accounts.*` senza caricare l'intera voce del Plugin. Matrix è l'esempio in bundle attuale: sposta solo le chiavi di autenticazione/bootstrap in un account promosso denominato quando esistono già account denominati, e può preservare una chiave di account predefinito configurata non canonica invece di creare sempre `accounts.default`.

Quegli adattatori di patch di configurazione mantengono lazy il rilevamento della superficie di contratto in bundle. Il tempo di import rimane leggero; la superficie di promozione viene caricata solo al primo utilizzo invece di rientrare nell'avvio del canale in bundle all'import del modulo.

Quando quelle superfici di avvio includono metodi RPC del Gateway, tienili su un prefisso specifico del Plugin. Gli spazi dei nomi di amministrazione del core (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si risolvono sempre in `operator.admin`, anche se un Plugin richiede un ambito più ristretto.

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

I Plugin di canale possono pubblicizzare metadati di configurazione/rilevamento tramite `openclaw.channel` e suggerimenti di installazione tramite `openclaw.install`. Questo mantiene il catalogo core privo di dati.

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

Campi `openclaw.channel` utili oltre all'esempio minimo:

- `detailLabel`: etichetta secondaria per superfici di catalogo/stato più ricche
- `docsLabel`: sovrascrive il testo del link per il link alla documentazione
- `preferOver`: ID di Plugin/canale a priorità inferiore che questa voce di catalogo dovrebbe superare
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controlli del testo per la superficie di selezione
- `markdownCapable`: contrassegna il canale come capace di Markdown per le decisioni di formattazione in uscita
- `exposure.configured`: nasconde il canale dalle superfici di elenco dei canali configurati quando impostato su `false`
- `exposure.setup`: nasconde il canale dai selettori interattivi di configurazione quando impostato su `false`
- `exposure.docs`: contrassegna il canale come interno/privato per le superfici di navigazione della documentazione
- `showConfigured` / `showInSetup`: alias legacy ancora accettati per compatibilità; preferisci `exposure`
- `quickstartAllowFrom`: include il canale nel flusso quickstart standard `allowFrom`
- `forceAccountBinding`: richiede un binding esplicito dell'account anche quando esiste un solo account
- `preferSessionLookupForAnnounceTarget`: preferisce la ricerca della sessione quando risolve i target di annuncio

OpenClaw può anche unire **cataloghi canali esterni** (per esempio, un export di registro MPM). Inserisci un file JSON in uno di questi percorsi:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oppure punta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a uno o più file JSON (delimitati da virgole/punti e virgola/`PATH`). Ogni file dovrebbe contenere `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Il parser accetta anche `"packages"` o `"plugins"` come alias legacy per la chiave `"entries"`.

Le voci generate del catalogo canali e le voci del catalogo di installazione dei provider espongono fatti normalizzati sulla sorgente di installazione accanto al blocco raw `openclaw.install`. I fatti normalizzati identificano se la specifica npm è una versione esatta o un selettore flottante, se i metadati di integrità attesi sono presenti, e se è disponibile anche un percorso sorgente locale. Quando l'identità del catalogo/pacchetto è nota, i fatti normalizzati avvertono se il nome pacchetto npm analizzato diverge da tale identità. Avvertono anche quando `defaultChoice` non è valido o punta a una sorgente non disponibile, e quando sono presenti metadati di integrità npm senza una sorgente npm valida. I consumer dovrebbero trattare `installSource` come campo opzionale additivo, così le voci costruite a mano e gli shim di catalogo non devono sintetizzarlo. Questo consente a onboarding e diagnostica di spiegare lo stato del piano sorgente senza importare il runtime del Plugin.

Le voci npm esterne ufficiali dovrebbero preferire un `npmSpec` esatto più `expectedIntegrity`. I nomi di pacchetto semplici e i dist-tag continuano a funzionare per compatibilità, ma espongono avvisi del piano sorgente così il catalogo può muoversi verso installazioni fissate e controllate per integrità senza rompere i Plugin esistenti. Quando l'onboarding installa da un percorso di catalogo locale, registra una voce di indice Plugin gestito con `source: "path"` e un `sourcePath` relativo al workspace quando possibile. Il percorso di caricamento operativo assoluto resta in `plugins.load.paths`; il record di installazione evita di duplicare percorsi della workstation locale nella configurazione a lunga durata. Questo mantiene visibili le installazioni di sviluppo locale alla diagnostica del piano sorgente senza aggiungere una seconda superficie raw di divulgazione di percorsi del filesystem. L'indice Plugin persistente `plugins/installs.json` è la fonte di verità della sorgente di installazione e può essere aggiornato senza caricare moduli runtime del Plugin. La sua mappa `installRecords` è durevole anche quando un manifest del Plugin è mancante o non valido; il suo array `plugins` è una vista manifest ricostruibile.

## Plugin del motore di contesto

I Plugin del motore di contesto possiedono l'orchestrazione del contesto di sessione per ingestione, assemblaggio e Compaction. Registrali dal tuo Plugin con `api.registerContextEngine(id, factory)`, poi seleziona il motore attivo con `plugins.slots.contextEngine`.

Usalo quando il tuo Plugin deve sostituire o estendere la pipeline di contesto predefinita invece di limitarsi ad aggiungere ricerca in memoria o hook.

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

Quando un Plugin ha bisogno di un comportamento che non rientra nell'API attuale, non aggirare il sistema di Plugin con un accesso privato. Aggiungi la capability mancante.

Sequenza consigliata:

1. definisci il contratto core
   Decidi quale comportamento condiviso dovrebbe possedere il core: policy, fallback, merge della configurazione, lifecycle, semantica rivolta ai canali e forma degli helper runtime.
2. aggiungi superfici tipizzate di registrazione/runtime del Plugin
   Estendi `OpenClawPluginApi` e/o `api.runtime` con la più piccola superficie di capability tipizzata utile.
3. collega core + consumer di canale/funzionalità
   I canali e i Plugin di funzionalità dovrebbero consumare la nuova capability tramite il core, non importando direttamente un'implementazione vendor.
4. registra le implementazioni vendor
   I Plugin vendor registrano quindi i propri backend rispetto alla capability.
5. aggiungi copertura del contratto
   Aggiungi test così proprietà e forma della registrazione restano esplicite nel tempo.

Questo è il modo in cui OpenClaw resta opinionato senza diventare hardcoded sulla visione del mondo di un solo provider. Vedi il [Ricettario delle capability](/it/plugins/architecture) per una checklist concreta dei file e un esempio completo.

### Checklist delle capability

Quando aggiungi una nuova capability, l'implementazione di solito dovrebbe toccare insieme queste superfici:

- tipi di contratto core in `src/<capability>/types.ts`
- helper runner/runtime core in `src/<capability>/runtime.ts`
- superficie di registrazione dell'API Plugin in `src/plugins/types.ts`
- cablaggio del registro Plugin in `src/plugins/registry.ts`
- esposizione runtime del Plugin in `src/plugins/runtime/*` quando i Plugin di funzionalità/canale devono consumarla
- helper di cattura/test in `src/test-utils/plugin-registration.ts`
- asserzioni di proprietà/contratto in `src/plugins/contracts/registry.ts`
- documentazione per operatori/Plugin in `docs/`

Se una di queste superfici manca, di solito è segno che la capability non è ancora completamente integrata.

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
- i Plugin vendor possiedono le implementazioni vendor
- i Plugin di funzionalità/canale consumano gli helper runtime
- i test di contratto mantengono esplicita la proprietà

## Correlati

- [Architettura dei Plugin](/it/plugins/architecture) — modello e forme pubbliche delle capability
- [Sottopercorsi dell'SDK dei Plugin](/it/plugins/sdk-subpaths)
- [Configurazione dell'SDK dei Plugin](/it/plugins/sdk-setup)
- [Creazione di Plugin](/it/plugins/building-plugins)
