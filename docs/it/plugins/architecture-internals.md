---
read_when:
    - Implementare gli hook di runtime del fornitore, il ciclo di vita del canale o i pacchetti di package
    - Risoluzione dei problemi dell'ordine di caricamento dei Plugin o dello stato del registro
    - Aggiunta di una nuova funzionalità del Plugin o di un Plugin di motore di contesto
summary: 'Dettagli interni dell''architettura dei Plugin: pipeline di caricamento, registro, hook di runtime, route HTTP e tabelle di riferimento'
title: Interni dell'architettura dei Plugin
x-i18n:
    generated_at: "2026-05-11T20:32:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: a74c068fce039ef3b85b2634caea0854e8ffb246a5ff59ebd8feadb8d93601d6
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Per il modello pubblico delle capacità, le forme dei Plugin e i contratti di proprietà/esecuzione, consulta [Architettura dei Plugin](/it/plugins/architecture). Questa pagina è il riferimento per i meccanismi interni: pipeline di caricamento, registro, hook runtime, route HTTP del Gateway, percorsi di importazione e tabelle degli schemi.

## Pipeline di caricamento

All'avvio, OpenClaw esegue approssimativamente queste operazioni:

1. individua le root dei Plugin candidati
2. legge i manifest dei bundle nativi o compatibili e i metadati dei pacchetti
3. rifiuta i candidati non sicuri
4. normalizza la configurazione dei Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide l'abilitazione per ciascun candidato
6. carica i moduli nativi abilitati: i moduli integrati compilati usano un loader nativo;
   il sorgente TypeScript locale di terze parti usa il fallback Jiti di emergenza
7. chiama gli hook nativi `register(api)` e raccoglie le registrazioni nel registro dei Plugin
8. espone il registro ai comandi e alle superfici runtime

<Note>
`activate` è un alias legacy di `register`: il loader risolve quello presente (`def.register ?? def.activate`) e lo chiama nello stesso punto. Tutti i Plugin integrati usano `register`; preferisci `register` per i nuovi Plugin.
</Note>

I controlli di sicurezza avvengono **prima** dell'esecuzione runtime. I candidati vengono bloccati quando l'entry esce dalla root del Plugin, il percorso è scrivibile da tutti o la proprietà del percorso appare sospetta per Plugin non integrati.

I candidati bloccati restano associati al loro id Plugin per la diagnostica. Se la configurazione fa ancora riferimento a quell'id, la validazione segnala il Plugin come presente ma bloccato e rimanda all'avviso di sicurezza del percorso invece di trattare la voce di configurazione come obsoleta.

### Comportamento manifest-first

Il manifest è la fonte di verità del piano di controllo. OpenClaw lo usa per:

- identificare il Plugin
- scoprire canali/skills/schema di configurazione dichiarati o capacità del bundle
- validare `plugins.entries.<id>.config`
- arricchire etichette/placeholder della Control UI
- mostrare metadati di installazione/catalogo
- preservare descrittori economici di attivazione e setup senza caricare il runtime del Plugin

Per i Plugin nativi, il modulo runtime è la parte del piano dati. Registra il comportamento effettivo, come hook, strumenti, comandi o flussi dei provider.

I blocchi opzionali `activation` e `setup` del manifest restano sul piano di controllo. Sono descrittori solo di metadati per la pianificazione dell'attivazione e la scoperta del setup; non sostituiscono la registrazione runtime, `register(...)` o `setupEntry`.
I primi consumer di attivazione live ora usano gli indizi di comandi, canali e provider del manifest per restringere il caricamento dei Plugin prima di una materializzazione più ampia del registro:

- il caricamento della CLI si restringe ai Plugin che possiedono il comando primario richiesto
- la risoluzione di setup/Plugin del canale si restringe ai Plugin che possiedono l'id canale richiesto
- la risoluzione esplicita di setup/runtime del provider si restringe ai Plugin che possiedono l'id provider richiesto
- la pianificazione dell'avvio del Gateway usa `activation.onStartup` per importazioni di avvio esplicite e opt-out di avvio; i Plugin senza metadati di avvio vengono caricati solo tramite trigger di attivazione più ristretti

I preload runtime al momento della richiesta che chiedono l'ambito ampio `all` derivano comunque un insieme esplicito di id Plugin effettivi da configurazione, pianificazione dell'avvio, canali configurati, slot e regole di auto-abilitazione. Se l'insieme derivato è vuoto, OpenClaw carica un registro runtime vuoto invece di allargare il caricamento a ogni Plugin individuabile.

Il pianificatore di attivazione espone sia un'API solo-id per i chiamanti esistenti sia un'API di piano per le nuove diagnostiche. Le voci del piano indicano perché un Plugin è stato selezionato, separando gli indizi espliciti del pianificatore `activation.*` dal fallback di proprietà del manifest, come `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` e hook. Questa separazione del motivo è il confine di compatibilità: i metadati Plugin esistenti continuano a funzionare, mentre il nuovo codice può rilevare indizi ampi o comportamenti di fallback senza cambiare la semantica del caricamento runtime.

La scoperta del setup ora preferisce id posseduti dai descrittori, come `setup.providers` e `setup.cliBackends`, per restringere i Plugin candidati prima di ripiegare su `setup-api` per i Plugin che richiedono ancora hook runtime in fase di setup. Gli elenchi di setup dei provider usano `providerAuthChoices` del manifest, scelte di setup derivate dai descrittori e metadati del catalogo di installazione senza caricare il runtime del provider. `setup.requiresRuntime: false` esplicito è un cutoff solo descrittore; `requiresRuntime` omesso mantiene il fallback legacy `setup-api` per compatibilità. Se più di un Plugin scoperto rivendica lo stesso id provider di setup o backend CLI normalizzato, la ricerca di setup rifiuta il proprietario ambiguo invece di affidarsi all'ordine di scoperta. Quando il runtime di setup viene eseguito, la diagnostica del registro segnala divergenze tra `setup.providers` / `setup.cliBackends` e i provider o backend CLI registrati da setup-api senza bloccare i Plugin legacy.

### Confine della cache dei Plugin

OpenClaw non memorizza nella cache i risultati della scoperta dei Plugin né i dati diretti del registro dei manifest dietro finestre temporali basate sull'orologio. Installazioni, modifiche ai manifest e cambiamenti dei percorsi di caricamento devono diventare visibili alla successiva lettura esplicita dei metadati o alla ricostruzione dello snapshot.
Il parser dei file manifest può mantenere una cache limitata della firma del file indicizzata dal percorso del manifest aperto, inode, dimensione e timestamp; quella cache evita solo di rianalizzare byte invariati e non deve memorizzare nella cache risposte di scoperta, registro, proprietario o policy.

Il percorso rapido sicuro dei metadati è la proprietà esplicita degli oggetti, non una cache nascosta.
Gli hot path di avvio del Gateway devono passare il `PluginMetadataSnapshot` corrente, la `PluginLookUpTable` derivata o un registro manifest esplicito lungo la catena di chiamate. Validazione della configurazione, auto-abilitazione all'avvio, bootstrap dei Plugin e selezione del provider possono riutilizzare quegli oggetti mentre rappresentano la configurazione e l'inventario dei Plugin correnti. La ricerca di setup ricostruisce ancora i metadati del manifest on demand, a meno che lo specifico percorso di setup riceva un registro manifest esplicito; mantienilo come fallback di cold path invece di aggiungere cache di lookup nascoste. Quando l'input cambia, ricostruisci e sostituisci lo snapshot invece di mutarlo o mantenere copie storiche.
Le viste sul registro Plugin attivo e gli helper di bootstrap dei canali integrati devono essere ricalcolati dal registro/root corrente. Le mappe a vita breve vanno bene all'interno di una singola chiamata per deduplicare il lavoro o proteggere il rientro; non devono diventare cache dei metadati di processo.

Per il caricamento dei Plugin, il livello di cache persistente è il caricamento runtime. Può riutilizzare lo stato del loader quando codice o artefatti installati vengono effettivamente caricati, ad esempio:

- `PluginLoaderCacheState` e registri runtime attivi compatibili
- cache jiti/moduli e cache del loader delle superfici pubbliche usate per evitare di importare ripetutamente la stessa superficie runtime
- cache del filesystem per artefatti Plugin installati
- mappe per chiamata a vita breve per normalizzazione dei percorsi o risoluzione dei duplicati

Queste cache sono dettagli implementativi del piano dati. Non devono rispondere a domande del piano di controllo come "quale Plugin possiede questo provider?", a meno che il chiamante non abbia deliberatamente richiesto il caricamento runtime.

Non aggiungere cache persistenti o basate sull'orologio per:

- risultati di scoperta
- registri manifest diretti
- registri manifest ricostruiti dall'indice dei Plugin installati
- lookup del proprietario del provider, soppressione dei modelli, policy del provider o metadati degli artefatti pubblici
- qualsiasi altra risposta derivata dal manifest in cui un manifest modificato, un indice installato o un percorso di caricamento dovrebbe essere visibile alla lettura successiva dei metadati

I chiamanti che ricostruiscono i metadati del manifest dall'indice persistito dei Plugin installati ricostruiscono quel registro on demand. L'indice installato è stato durevole del piano sorgente; non è una cache di metadati nascosta in-process.

## Modello di registro

I Plugin caricati non mutano direttamente globali core casuali. Si registrano in un registro Plugin centrale.

Il registro traccia:

- record dei Plugin (identità, sorgente, origine, stato, diagnostica)
- strumenti
- hook legacy e hook tipizzati
- canali
- provider
- handler RPC del Gateway
- route HTTP
- registratori CLI
- servizi in background
- comandi posseduti dai Plugin

Le funzionalità core leggono poi da quel registro invece di parlare direttamente con i moduli Plugin. Questo mantiene il caricamento a senso unico:

- modulo Plugin -> registrazione nel registro
- runtime core -> consumo del registro

Questa separazione è importante per la manutenibilità. Significa che la maggior parte delle superfici core richiede un solo punto di integrazione: "leggi il registro", non "gestisci un caso speciale per ogni modulo Plugin".

## Callback di binding delle conversazioni

I Plugin che eseguono il bind di una conversazione possono reagire quando un'approvazione viene risolta.

Usa `api.onConversationBindingResolved(...)` per ricevere una callback dopo che una richiesta di bind è stata approvata o negata:

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
- `request`: il riepilogo della richiesta originale, l'indizio di detach, l'id mittente e i metadati della conversazione

Questa callback è solo una notifica. Non cambia chi è autorizzato a eseguire il bind di una conversazione e viene eseguita dopo che la gestione dell'approvazione core è terminata.

## Hook runtime dei provider

I Plugin provider hanno tre livelli:

- **Metadati del manifest** per lookup economico pre-runtime:
  `setup.providers[].envVars`, compatibilità deprecata `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` e `channelEnvVars`.
- **Hook in fase di configurazione**: `catalog` (`discovery` legacy) più
  `applyConfigDefaults`.
- **Hook runtime**: oltre 40 hook opzionali che coprono auth, risoluzione dei modelli,
  wrapping dello stream, livelli di thinking, policy di replay ed endpoint di utilizzo. Vedi
  l'elenco completo in [Ordine e uso degli hook](#hook-order-and-usage).

OpenClaw possiede ancora il loop agente generico, il failover, la gestione della trascrizione e la policy degli strumenti. Questi hook sono la superficie di estensione per il comportamento specifico del provider senza richiedere un trasporto di inferenza completamente personalizzato.

Usa `setup.providers[].envVars` del manifest quando il provider ha credenziali basate su env che i percorsi generici di auth/stato/selettore modello devono vedere senza caricare il runtime del Plugin. `providerAuthEnvVars` deprecato viene ancora letto dall'adapter di compatibilità durante la finestra di deprecazione, e i Plugin non integrati che lo usano ricevono una diagnostica del manifest. Usa `providerAuthAliases` del manifest quando un id provider deve riutilizzare env var, profili auth, auth basata su configurazione e scelta di onboarding della chiave API di un altro id provider. Usa `providerAuthChoices` del manifest quando le superfici CLI di onboarding/scelta auth devono conoscere l'id scelta del provider, le etichette di gruppo e il cablaggio auth semplice a un flag senza caricare il runtime del provider. Mantieni `envVars` del runtime provider per suggerimenti rivolti agli operatori, come etichette di onboarding o variabili di setup client-id/client-secret OAuth.

Usa `channelEnvVars` del manifest quando un canale ha auth o setup guidati da env che il fallback generico shell-env, i controlli di configurazione/stato o i prompt di setup devono vedere senza caricare il runtime del canale.

### Ordine e uso degli hook

Per i Plugin modello/provider, OpenClaw chiama gli hook in questo ordine approssimativo.
La colonna "Quando usarlo" è la guida decisionale rapida.
I campi provider solo di compatibilità che OpenClaw non chiama più, come
`ProviderPlugin.capabilities` e `suppressBuiltInModel`, sono intenzionalmente esclusi da questo elenco.

| #   | Hook                              | Cosa fa                                                                                                        | Quando usarlo                                                                                                                              |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `catalog`                         | Pubblica la configurazione del provider in `models.providers` durante la generazione di `models.json`          | Il provider possiede un catalogo o valori predefiniti per l'URL di base                                                                     |
| 2   | `applyConfigDefaults`             | Applica i valori predefiniti globali di configurazione posseduti dal provider durante la materializzazione della configurazione | I valori predefiniti dipendono dalla modalità di autenticazione, dall'ambiente o dalla semantica della famiglia di modelli del provider |
| --  | _(ricerca modello integrata)_      | OpenClaw prova prima il normale percorso registro/catalogo                                                     | _(non è un hook di plugin)_                                                                                                                |
| 3   | `normalizeModelId`                | Normalizza gli alias legacy o di anteprima degli ID modello prima della ricerca                                | Il provider possiede la pulizia degli alias prima della risoluzione canonica del modello                                                    |
| 4   | `normalizeTransport`              | Normalizza `api` / `baseUrl` della famiglia di provider prima dell'assemblaggio generico del modello           | Il provider possiede la pulizia del trasporto per ID provider personalizzati nella stessa famiglia di trasporto                              |
| 5   | `normalizeConfig`                 | Normalizza `models.providers.<id>` prima della risoluzione runtime/provider                                    | Il provider richiede una pulizia della configurazione che dovrebbe vivere con il plugin; gli helper in bundle della famiglia Google coprono anche le voci di configurazione Google supportate |
| 6   | `applyNativeStreamingUsageCompat` | Applica riscritture di compatibilità dell'uso dello streaming nativo ai provider di configurazione             | Il provider richiede correzioni dei metadati di uso dello streaming nativo guidate dall'endpoint                                             |
| 7   | `resolveConfigApiKey`             | Risolve l'autenticazione con marker env per i provider di configurazione prima del caricamento dell'autenticazione runtime | Il provider ha una risoluzione della chiave API con marker env posseduta dal provider; anche `amazon-bedrock` ha qui un resolver integrato per marker env AWS |
| 8   | `resolveSyntheticAuth`            | Espone l'autenticazione locale/self-hosted o supportata da configurazione senza persistere testo in chiaro     | Il provider può operare con un marker di credenziale sintetico/locale                                                                       |
| 9   | `resolveExternalAuthProfiles`     | Sovrappone profili di autenticazione esterni posseduti dal provider; il valore predefinito di `persistence` è `runtime-only` per credenziali possedute da CLI/app | Il provider riusa credenziali di autenticazione esterne senza persistere token di refresh copiati; dichiara `contracts.externalAuthProviders` nel manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Abbassa la precedenza dei placeholder di profilo sintetico salvati dietro autenticazione supportata da env/config | Il provider salva profili placeholder sintetici che non dovrebbero prevalere                                                                |
| 11  | `resolveDynamicModel`             | Fallback sincrono per ID modello posseduti dal provider non ancora presenti nel registro locale                | Il provider accetta ID modello upstream arbitrari                                                                                            |
| 12  | `prepareDynamicModel`             | Riscaldamento asincrono, poi `resolveDynamicModel` viene eseguito di nuovo                                    | Il provider richiede metadati di rete prima di risolvere ID sconosciuti                                                                     |
| 13  | `normalizeResolvedModel`          | Riscrittura finale prima che il runner incorporato usi il modello risolto                                      | Il provider richiede riscritture del trasporto ma usa comunque un trasporto core                                                            |
| 14  | `contributeResolvedModelCompat`   | Contribuisce flag di compatibilità per modelli vendor dietro un altro trasporto compatibile                    | Il provider riconosce i propri modelli su trasporti proxy senza prendere il controllo del provider                                          |
| 15  | `normalizeToolSchemas`            | Normalizza gli schemi degli strumenti prima che il runner incorporato li veda                                  | Il provider richiede la pulizia degli schemi della famiglia di trasporto                                                                    |
| 16  | `inspectToolSchemas`              | Espone diagnostica degli schemi posseduta dal provider dopo la normalizzazione                                 | Il provider vuole avvisi sulle keyword senza insegnare al core regole specifiche del provider                                               |
| 17  | `resolveReasoningOutputMode`      | Seleziona il contratto di output di ragionamento nativo o con tag                                              | Il provider richiede ragionamento/output finale con tag invece di campi nativi                                                              |
| 18  | `prepareExtraParams`              | Normalizzazione dei parametri di richiesta prima dei wrapper generici delle opzioni di stream                  | Il provider richiede parametri di richiesta predefiniti o pulizia dei parametri per provider                                                |
| 19  | `createStreamFn`                  | Sostituisce completamente il normale percorso di stream con un trasporto personalizzato                        | Il provider richiede un protocollo wire personalizzato, non solo un wrapper                                                                 |
| 20  | `wrapStreamFn`                    | Wrapper dello stream dopo l'applicazione dei wrapper generici                                                  | Il provider richiede wrapper di compatibilità per header/body/modello della richiesta senza un trasporto personalizzato                     |
| 21  | `resolveTransportTurnState`       | Allega header o metadati nativi di trasporto per turno                                                         | Il provider vuole che i trasporti generici inviino l'identità di turno nativa del provider                                                  |
| 22  | `resolveWebSocketSessionPolicy`   | Allega header WebSocket nativi o policy di raffreddamento della sessione                                       | Il provider vuole che i trasporti WS generici regolino gli header di sessione o la policy di fallback                                       |
| 23  | `formatApiKey`                    | Formatter del profilo di autenticazione: il profilo salvato diventa la stringa `apiKey` runtime               | Il provider salva metadati di autenticazione aggiuntivi e richiede una forma di token runtime personalizzata                                |
| 24  | `refreshOAuth`                    | Override del refresh OAuth per endpoint di refresh personalizzati o policy di errore di refresh                | Il provider non si adatta ai refresher `pi-ai` condivisi                                                                                    |
| 25  | `buildAuthDoctorHint`             | Suggerimento di riparazione aggiunto quando il refresh OAuth fallisce                                          | Il provider richiede indicazioni di riparazione dell'autenticazione possedute dal provider dopo un errore di refresh                        |
| 26  | `matchesContextOverflowError`     | Matcher di overflow della finestra di contesto posseduto dal provider                                         | Il provider ha errori grezzi di overflow che le euristiche generiche non rileverebbero                                                      |
| 27  | `classifyFailoverReason`          | Classificazione del motivo di failover posseduta dal provider                                                  | Il provider può mappare errori grezzi API/di trasporto a rate-limit/sovraccarico/ecc.                                                       |
| 28  | `isCacheTtlEligible`              | Policy della cache dei prompt per provider proxy/backhaul                                                      | Il provider richiede gating del TTL cache specifico del proxy                                                                               |
| 29  | `buildMissingAuthMessage`         | Sostituzione del messaggio generico di recupero per autenticazione mancante                                    | Il provider richiede un suggerimento di recupero per autenticazione mancante specifico del provider                                         |
| 30  | `augmentModelCatalog`             | Righe sintetiche/finali del catalogo aggiunte dopo la discovery                                                | Il provider richiede righe sintetiche di compatibilità futura in `models list` e nei selettori                                             |
| 31  | `resolveThinkingProfile`          | Insieme di livelli `/think` specifico del modello, etichette di visualizzazione e valore predefinito           | Il provider espone una scala di pensiero personalizzata o un'etichetta binaria per modelli selezionati                                      |
| 32  | `isBinaryThinking`                | Hook di compatibilità per il toggle di ragionamento on/off                                                     | Il provider espone solo pensiero binario on/off                                                                                              |
| 33  | `supportsXHighThinking`           | Hook di compatibilità per il supporto al ragionamento `xhigh`                                                  | Il provider vuole `xhigh` solo su un sottoinsieme di modelli                                                                                 |
| 34  | `resolveDefaultThinkingLevel`     | Hook di compatibilità per il livello `/think` predefinito                                                      | Il provider possiede la policy `/think` predefinita per una famiglia di modelli                                                             |
| 35  | `isModernModelRef`                | Matcher di modello moderno per filtri di profilo live e selezione smoke                                        | Il provider possiede la corrispondenza dei modelli preferiti live/smoke                                                                     |
| 36  | `prepareRuntimeAuth`              | Scambia una credenziale configurata con il token/chiave runtime effettivo appena prima dell'inferenza          | Il provider richiede uno scambio di token o una credenziale di richiesta di breve durata                                                    |
| 37  | `resolveUsageAuth`                | Risolve le credenziali di utilizzo/fatturazione per `/usage` e le superfici di stato correlate                                     | Il fornitore richiede analisi personalizzata del token di utilizzo/quota o credenziali di utilizzo diverse                                                               |
| 38  | `fetchUsageSnapshot`              | Recupera e normalizza gli snapshot di utilizzo/quota specifici del fornitore dopo la risoluzione dell'autenticazione                             | Il fornitore richiede un endpoint di utilizzo specifico del fornitore o un parser del payload                                                                           |
| 39  | `createEmbeddingProvider`         | Crea un adapter di embedding di proprietà del fornitore per memoria/ricerca                                                     | Il comportamento degli embedding di memoria appartiene al Plugin del fornitore                                                                                    |
| 40  | `buildReplayPolicy`               | Restituisce una policy di replay che controlla la gestione della trascrizione per il fornitore                                        | Il fornitore richiede una policy di trascrizione personalizzata (ad esempio, rimozione dei blocchi di pensiero)                                                               |
| 41  | `sanitizeReplayHistory`           | Riscrive la cronologia di replay dopo la pulizia generica della trascrizione                                                        | Il fornitore richiede riscritture di replay specifiche del fornitore oltre agli helper di Compaction condivisi                                                             |
| 42  | `validateReplayTurns`             | Esegue la convalida finale dei turni di replay o la loro rimodellazione prima del runner incorporato                                           | Il trasporto del fornitore richiede una convalida dei turni più rigorosa dopo la sanificazione generica                                                                    |
| 43  | `onModelSelected`                 | Esegue gli effetti collaterali post-selezione di proprietà del fornitore                                                                 | Il fornitore richiede telemetria o stato di proprietà del fornitore quando un modello diventa attivo                                                                  |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` controllano prima il
Plugin del provider corrispondente, poi passano agli altri Plugin provider con
supporto per hook finché uno non modifica effettivamente l'id del modello o
transport/config. Questo mantiene funzionanti gli shim provider di alias/compatibilità
senza richiedere al chiamante di sapere quale Plugin in bundle possiede la
riscrittura. Se nessun hook provider riscrive una voce di configurazione
supportata della famiglia Google, il normalizzatore della configurazione Google
in bundle applica comunque quella pulizia di compatibilità.

Se il provider richiede un protocollo wire completamente personalizzato o un
esecutore di richieste personalizzato, quella è una classe di estensione diversa.
Questi hook sono per il comportamento dei provider che gira ancora sul normale
ciclo di inferenza di OpenClaw.

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

I Plugin provider in bundle combinano gli hook sopra per adattarsi alle esigenze
di catalogo, autenticazione, pensiero, replay e utilizzo di ciascun vendor.
L'insieme autorevole degli hook risiede con ogni Plugin sotto `extensions/`;
questa pagina illustra le forme invece di rispecchiare l'elenco.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI registrano `catalog` più
    `resolveDynamicModel` / `prepareDynamicModel` così possono esporre gli id
    modello upstream prima del catalogo statico di OpenClaw.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai abbinano
    `prepareRuntimeAuth` o `formatApiKey` con `resolveUsageAuth` +
    `fetchUsageSnapshot` per possedere lo scambio di token e l'integrazione di
    `/usage`.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Le famiglie condivise nominate (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) consentono ai provider di
    adottare la policy della trascrizione tramite `buildReplayPolicy` invece che
    far reimplementare la pulizia a ciascun Plugin.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` e
    `volcengine` registrano solo `catalog` e usano il ciclo di inferenza
    condiviso.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Gli header beta, `/fast` / `serviceTier` e `context1m` vivono nella seam
    pubblica `api.ts` / `contract-api.ts` del Plugin Anthropic
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

- `textToSpeech` restituisce il normale payload di output TTS core per superfici file/note vocali.
- Usa la configurazione core `messages.tts` e la selezione del provider.
- Restituisce buffer audio PCM + frequenza di campionamento. I Plugin devono ricampionare/codificare per i provider.
- `listVoices` è facoltativo per provider. Usalo per selettori di voci o flussi di configurazione posseduti dal vendor.
- Gli elenchi delle voci possono includere metadati più ricchi come impostazioni locali, genere e tag di personalità per selettori consapevoli del provider.
- OpenAI ed ElevenLabs supportano oggi la telefonia. Microsoft no.

I Plugin possono anche registrare provider speech tramite `api.registerSpeechProvider(...)`.

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

- Mantieni policy TTS, fallback e recapito della risposta nel core.
- Usa i provider speech per il comportamento di sintesi posseduto dal vendor.
- L'input legacy Microsoft `edge` viene normalizzato all'id provider `microsoft`.
- Il modello di proprietà preferito è orientato all'azienda: un Plugin vendor può possedere
  provider di testo, speech, immagini e media futuri man mano che OpenClaw aggiunge quei
  contratti di capability.

Per la comprensione di immagini/audio/video, i Plugin registrano un provider
media-understanding tipizzato invece di un generico contenitore chiave/valore:

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
- L'espansione additiva deve restare tipizzata: nuovi metodi facoltativi, nuovi
  campi risultato facoltativi, nuove capability facoltative.
- La generazione video segue già lo stesso schema:
  - il core possiede il contratto di capability e l'helper runtime
  - i Plugin vendor registrano `api.registerVideoGenerationProvider(...)`
  - i Plugin di funzionalità/canale consumano `api.runtime.videoGeneration.*`

Per gli helper runtime di media-understanding, i Plugin possono chiamare:

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

Per la trascrizione audio, i Plugin possono usare il runtime di media-understanding
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

- `api.runtime.mediaUnderstanding.*` è la superficie condivisa preferita per la
  comprensione di immagini/audio/video.
- `extractStructuredWithModel(...)` è la seam rivolta ai Plugin per l'estrazione
  delimitata, posseduta dal provider e basata prima sulle immagini. Includi almeno un input immagine;
  gli input testuali sono contesto supplementare.
  i Plugin di prodotto possiedono le loro route e i loro schemi mentre OpenClaw possiede il
  confine provider/runtime.
- Usa la configurazione audio core di media-understanding (`tools.media.audio`) e l'ordine di fallback dei provider.
- Restituisce `{ text: undefined }` quando non viene prodotto alcun output di trascrizione (per esempio input saltato/non supportato).
- `api.runtime.stt.transcribeAudioFile(...)` rimane come alias di compatibilità.

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

- `provider` e `model` sono override facoltativi per esecuzione, non modifiche persistenti della sessione.
- OpenClaw onora quei campi di override solo per chiamanti attendibili.
- Per esecuzioni di fallback possedute da Plugin, gli operatori devono aderire esplicitamente con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` per limitare i Plugin attendibili a target canonici `provider/model` specifici, oppure `"*"` per consentire esplicitamente qualsiasi target.
- Le esecuzioni di subagent da Plugin non attendibili funzionano comunque, ma le richieste di override vengono rifiutate invece di ripiegare silenziosamente.
- Le sessioni subagent create dai Plugin vengono etichettate con l'id del Plugin creatore. Il fallback `api.runtime.subagent.deleteSession(...)` può eliminare solo quelle sessioni possedute; l'eliminazione arbitraria di sessioni richiede comunque una richiesta Gateway con ambito admin.

Per la ricerca web, i Plugin possono consumare l'helper runtime condiviso invece
di accedere direttamente al cablaggio degli strumenti dell'agente:

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
- Usa i provider di ricerca web per transport di ricerca specifici del vendor.
- `api.runtime.webSearch.*` è la superficie condivisa preferita per Plugin di funzionalità/canale che necessitano di comportamento di ricerca senza dipendere dal wrapper dello strumento dell'agente.

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

- `path`: percorso della route sotto il server HTTP del Gateway.
- `auth`: obbligatorio. Usa `"gateway"` per richiedere la normale autenticazione del Gateway, oppure `"plugin"` per autenticazione/verifica Webhook gestita dal Plugin.
- `match`: facoltativo. `"exact"` (predefinito) oppure `"prefix"`.
- `replaceExisting`: facoltativo. Consente allo stesso Plugin di sostituire la propria registrazione di route esistente.
- `handler`: restituisci `true` quando la route ha gestito la richiesta.

Note:

- `api.registerHttpHandler(...)` è stato rimosso e causerà un errore di caricamento del plugin. Usa invece `api.registerHttpRoute(...)`.
- Le route del Plugin devono dichiarare esplicitamente `auth`.
- I conflitti esatti `path + match` vengono rifiutati a meno che `replaceExisting: true`, e un plugin non può sostituire la route di un altro plugin.
- Le route sovrapposte con livelli `auth` diversi vengono rifiutate. Mantieni le catene di fallback `exact`/`prefix` solo sullo stesso livello di autenticazione.
- Le route `auth: "plugin"` **non** ricevono automaticamente gli scope runtime dell'operatore. Sono pensate per webhook/verifica delle firme gestiti dal plugin, non per chiamate privilegiate agli helper del Gateway.
- Le route `auth: "gateway"` vengono eseguite dentro uno scope runtime di richiesta Gateway, ma quello scope è intenzionalmente conservativo:
  - l'autenticazione bearer con segreto condiviso (`gateway.auth.mode = "token"` / `"password"`) mantiene gli scope runtime delle route del plugin fissati a `operator.write`, anche se il chiamante invia `x-openclaw-scopes`
  - le modalità HTTP affidabili con identità (per esempio `trusted-proxy` o `gateway.auth.mode = "none"` su un ingresso privato) rispettano `x-openclaw-scopes` solo quando l'header è esplicitamente presente
  - se `x-openclaw-scopes` è assente in quelle richieste a route del plugin con identità, lo scope runtime ricade su `operator.write`
- Regola pratica: non presumere che una route del plugin con autenticazione gateway sia una superficie admin implicita. Se la tua route richiede comportamento riservato agli admin, richiedi una modalità di autenticazione con identità e documenta il contratto esplicito dell'header `x-openclaw-scopes`.

## Percorsi di importazione del Plugin SDK

Usa sottopercorsi SDK stretti invece del barrel root monolitico `openclaw/plugin-sdk`
quando crei nuovi plugin. Sottopercorsi core:

| Sottopercorso                      | Scopo                                              |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitive di registrazione del Plugin              |
| `openclaw/plugin-sdk/channel-core`  | Helper di ingresso/build del canale                |
| `openclaw/plugin-sdk/core`          | Helper condivisi generici e contratto ombrello     |
| `openclaw/plugin-sdk/config-schema` | Schema Zod root `openclaw.json` (`OpenClawSchema`) |

I plugin di canale scelgono da una famiglia di seam stretti: `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` e `channel-actions`. Il comportamento di approvazione dovrebbe consolidarsi
su un unico contratto `approvalCapability` invece di mescolarsi tra campi
del plugin non correlati. Vedi [Plugin di canale](/it/plugins/sdk-channel-plugins).

Gli helper runtime e di configurazione si trovano nei sottopercorsi mirati `*-runtime`
corrispondenti (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, ecc.). Preferisci `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` e `config-mutation`
al barrel di compatibilità ampio `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
e `openclaw/plugin-sdk/infra-runtime` sono shim di compatibilità deprecati per
plugin più vecchi. Il nuovo codice dovrebbe importare primitive generiche più strette.
</Info>

Entry point interni al repository (per root del pacchetto plugin incluso):

- `index.js` — ingresso del plugin incluso
- `api.js` — barrel di helper/tipi
- `runtime-api.js` — barrel solo runtime
- `setup-entry.js` — ingresso del plugin di configurazione

I plugin esterni dovrebbero importare solo sottopercorsi `openclaw/plugin-sdk/*`. Non
importare mai `src/*` del pacchetto di un altro plugin dal core o da un altro plugin.
Gli entry point caricati tramite facciata preferiscono lo snapshot della configurazione runtime attiva quando
esiste, poi ricadono sul file di configurazione risolto su disco.

Sottopercorsi specifici per capability come `image-generation`, `media-understanding`
e `speech` esistono perché i plugin inclusi li usano oggi. Non sono
automaticamente contratti esterni congelati a lungo termine: controlla la pagina di riferimento SDK
pertinente quando fai affidamento su di essi.

## Schemi degli strumenti messaggio

I plugin dovrebbero possedere i contributi di schema `describeMessageTool(...)` specifici del canale
per primitive non messaggio come reazioni, letture e sondaggi.
La presentazione di invio condivisa dovrebbe usare il contratto generico `MessagePresentation`
invece di campi button, component, block o card nativi del provider.
Vedi [Presentazione dei messaggi](/it/plugins/message-presentation) per il contratto,
le regole di fallback, la mappatura dei provider e la checklist per gli autori di plugin.

I plugin capaci di inviare dichiarano cosa possono renderizzare tramite le capability dei messaggi:

- `presentation` per blocchi di presentazione semantici (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` per richieste di consegna fissata

Il core decide se renderizzare la presentazione in modo nativo o degradarla a testo.
Non esporre vie di fuga UI native del provider dallo strumento messaggio generico.
Gli helper SDK deprecati per schemi nativi legacy restano esportati per i plugin
di terze parti esistenti, ma i nuovi plugin non dovrebbero usarli.

## Risoluzione dei target di canale

I plugin di canale dovrebbero possedere la semantica dei target specifica del canale. Mantieni generico
l'host outbound condiviso e usa la superficie dell'adapter di messaggistica per le regole del provider:

- `messaging.inferTargetChatType({ to })` decide se un target normalizzato
  deve essere trattato come `direct`, `group` o `channel` prima della ricerca nella directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` dice al core se un
  input dovrebbe passare direttamente alla risoluzione simile a un id invece della ricerca nella directory.
- `messaging.targetResolver.resolveTarget(...)` è il fallback del plugin quando
  il core ha bisogno di una risoluzione finale di proprietà del provider dopo la normalizzazione o dopo un
  mancato riscontro nella directory.
- `messaging.resolveOutboundSessionRoute(...)` possiede la costruzione della route di sessione
  specifica del provider una volta risolto un target.

Suddivisione consigliata:

- Usa `inferTargetChatType` per decisioni di categoria che dovrebbero avvenire prima
  della ricerca di peer/gruppi.
- Usa `looksLikeId` per controlli "tratta questo come un id target esplicito/nativo".
- Usa `resolveTarget` per fallback di normalizzazione specifico del provider, non per
  ricerche ampie nella directory.
- Mantieni id nativi del provider come chat id, thread id, JID, handle e room
  id dentro i valori `target` o parametri specifici del provider, non in campi SDK
  generici.

## Directory basate sulla configurazione

I plugin che derivano voci di directory dalla configurazione dovrebbero mantenere quella logica nel
plugin e riutilizzare gli helper condivisi da
`openclaw/plugin-sdk/directory-runtime`.

Usalo quando un canale ha bisogno di peer/gruppi basati sulla configurazione, come:

- peer DM guidati da allowlist
- mappe di canali/gruppi configurate
- fallback di directory statici con scope account

Gli helper condivisi in `directory-runtime` gestiscono solo operazioni generiche:

- filtraggio delle query
- applicazione del limite
- helper di deduplicazione/normalizzazione
- costruzione di `ChannelDirectoryEntry[]`

L'ispezione account specifica del canale e la normalizzazione degli id dovrebbero restare
nell'implementazione del plugin.

## Cataloghi dei provider

I plugin provider possono definire cataloghi di modelli per inference con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` restituisce la stessa forma che OpenClaw scrive in
`models.providers`:

- `{ provider }` per una voce provider
- `{ providers }` per più voci provider

Usa `catalog` quando il plugin possiede id modello specifici del provider, default degli URL
base o metadati modello vincolati dall'autenticazione.

`catalog.order` controlla quando il catalogo di un plugin viene unito rispetto ai provider impliciti
integrati di OpenClaw:

- `simple`: provider semplici guidati da chiavi API o env
- `profile`: provider che compaiono quando esistono profili di autenticazione
- `paired`: provider che sintetizzano più voci provider correlate
- `late`: ultimo passaggio, dopo altri provider impliciti

I provider successivi vincono in caso di collisione di chiavi, quindi i plugin possono sovrascrivere intenzionalmente una
voce provider integrata con lo stesso id provider.

I plugin possono anche pubblicare righe modello di sola lettura tramite
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Questo è il percorso futuro per superfici di elenco/aiuto/selettore e supporta righe
`text`, `image_generation`, `video_generation` e `music_generation`.
I plugin provider possiedono comunque le chiamate endpoint live, lo scambio di token e la
mappatura delle risposte vendor; il core possiede la forma comune delle righe, le etichette sorgente
e la formattazione dell'aiuto per gli strumenti media. Le registrazioni dei provider di generazione media sintetizzano
automaticamente righe di catalogo statiche da `defaultModel`, `models` e `capabilities`.

Compatibilità:

- `discovery` funziona ancora come alias legacy, ma emette un avviso di deprecazione
- se vengono registrati sia `catalog` sia `discovery`, OpenClaw usa `catalog`
- `augmentModelCatalog` è deprecato; i provider inclusi dovrebbero pubblicare
  righe supplementari tramite `registerModelCatalogProvider`

## Ispezione dei canali in sola lettura

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

- Restituisci solo stato account descrittivo.
- Preserva `enabled` e `configured`.
- Includi campi di sorgente/stato delle credenziali quando pertinente, come:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Non è necessario restituire valori token grezzi solo per segnalare la
  disponibilità in sola lettura. Restituire `tokenStatus: "available"` (e il campo sorgente
  corrispondente) è sufficiente per comandi di tipo status.
- Usa `configured_unavailable` quando una credenziale è configurata tramite SecretRef ma
  non disponibile nel percorso di comando corrente.

Questo consente ai comandi in sola lettura di segnalare "configurato ma non disponibile in questo percorso di
comando" invece di andare in crash o segnalare erroneamente che l'account non è configurato.

## Pack di pacchetti

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

Se il tuo plugin importa dipendenze npm, installale in quella directory in modo che
`node_modules` sia disponibile (`npm install` / `pnpm install`).

Guardrail di sicurezza: ogni entry `openclaw.extensions` deve restare dentro la directory del plugin
dopo la risoluzione dei symlink. Le entry che escono dalla directory del pacchetto vengono
rifiutate.

Nota di sicurezza: `openclaw plugins install` installa le dipendenze del plugin con un
`npm install --omit=dev --ignore-scripts` locale al progetto (nessuno script lifecycle,
nessuna dipendenza dev a runtime), ignorando le impostazioni npm install globali ereditate.
Mantieni gli alberi di dipendenze del plugin "pure JS/TS" ed evita pacchetti che richiedono
build `postinstall`.

Facoltativo: `openclaw.setupEntry` può puntare a un modulo leggero solo di setup.
Quando OpenClaw ha bisogno di superfici di setup per un plugin di canale disabilitato, oppure
quando un plugin di canale è abilitato ma ancora non configurato, carica `setupEntry`
invece dell'entry completa del plugin. Questo mantiene più leggeri startup e setup
quando l'entry principale del plugin collega anche strumenti, hook o altro codice solo runtime.

Facoltativo: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
può far aderire un plugin di canale allo stesso percorso `setupEntry` durante la fase di startup
pre-listen del gateway, anche quando il canale è già configurato.

Usa questo solo quando `setupEntry` copre completamente la superficie di avvio che deve esistere
prima che il gateway inizi ad ascoltare. In pratica, significa che la voce di setup
deve registrare ogni capability posseduta dal canale da cui dipende l'avvio, come:

- la registrazione del canale stesso
- eventuali route HTTP che devono essere disponibili prima che il gateway inizi ad ascoltare
- eventuali metodi, strumenti o servizi del gateway che devono esistere durante la stessa finestra

Se la tua voce completa possiede ancora una capability di avvio richiesta, non abilitare
questo flag. Mantieni il Plugin sul comportamento predefinito e lascia che OpenClaw carichi la
voce completa durante l'avvio.

I canali inclusi possono anche pubblicare helper della superficie di contratto solo per il setup che il core
può consultare prima che il runtime completo del canale sia caricato. L'attuale superficie di
promozione del setup è:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Il core usa quella superficie quando deve promuovere una configurazione legacy di canale a singolo account
in `channels.<id>.accounts.*` senza caricare la voce completa del Plugin.
Matrix è l'esempio incluso attuale: sposta solo le chiavi di autenticazione/bootstrap in un
account promosso nominato quando esistono già account nominati, e può preservare una
chiave configurata di account predefinito non canonica invece di creare sempre
`accounts.default`.

Questi adattatori di patch del setup mantengono lazy la discovery della superficie di contratto inclusa. Il tempo
di importazione resta leggero; la superficie di promozione viene caricata solo al primo uso invece di
rientrare nell'avvio del canale incluso durante l'importazione del modulo.

Quando queste superfici di avvio includono metodi RPC del gateway, mantienili su un
prefisso specifico del Plugin. Gli spazi dei nomi admin del core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si risolvono sempre
in `operator.admin`, anche se un Plugin richiede uno scope più ristretto.

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

I Plugin di canale possono pubblicizzare metadati di setup/discovery tramite `openclaw.channel` e
suggerimenti di installazione tramite `openclaw.install`. Questo mantiene il catalogo core privo di dati.

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
- `preferOver`: id di Plugin/canali a priorità inferiore che questa voce di catalogo dovrebbe superare
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controlli del testo della superficie di selezione
- `markdownCapable`: marca il canale come compatibile con markdown per le decisioni di formattazione in uscita
- `exposure.configured`: nasconde il canale dalle superfici di elenco dei canali configurati quando impostato a `false`
- `exposure.setup`: nasconde il canale dai selettori interattivi di setup/configurazione quando impostato a `false`
- `exposure.docs`: marca il canale come interno/privato per le superfici di navigazione della documentazione
- `showConfigured` / `showInSetup`: alias legacy ancora accettati per compatibilità; preferisci `exposure`
- `quickstartAllowFrom`: abilita il canale al flusso standard quickstart `allowFrom`
- `forceAccountBinding`: richiede un binding esplicito dell'account anche quando esiste un solo account
- `preferSessionLookupForAnnounceTarget`: preferisce la ricerca della sessione quando risolve i target di annuncio

OpenClaw può anche unire **cataloghi canali esterni** (per esempio, un export del registro MPM).
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
mobile, se sono presenti i metadati di integrità attesi e se è disponibile anche un
percorso sorgente locale. Quando l'identità del catalogo/pacchetto è nota, i
fatti normalizzati avvisano se il nome pacchetto npm analizzato diverge da quell'identità.
Avvisano inoltre quando `defaultChoice` non è valido o punta a una sorgente
non disponibile, e quando sono presenti metadati di integrità npm senza una sorgente npm
valida. I consumer dovrebbero trattare `installSource` come un campo opzionale additivo, così
le voci costruite manualmente e gli shim del catalogo non devono sintetizzarlo.
Questo consente a onboarding e diagnostica di spiegare lo stato del piano sorgente senza
importare il runtime del Plugin.

Le voci npm esterne ufficiali dovrebbero preferire un `npmSpec` esatto più
`expectedIntegrity`. I nomi pacchetto semplici e i dist-tag continuano a funzionare per
compatibilità, ma mostrano avvisi del piano sorgente così il catalogo può muoversi
verso installazioni fissate e verificate per integrità senza rompere i Plugin esistenti.
Quando l'onboarding installa da un percorso di catalogo locale, registra una voce gestita
nell'indice dei Plugin con `source: "path"` e un `sourcePath` relativo al workspace
quando possibile. Il percorso assoluto di caricamento operativo resta in
`plugins.load.paths`; il record di installazione evita di duplicare percorsi della workstation locale
nella configurazione di lunga durata. Questo mantiene visibili le installazioni di sviluppo locale alla
diagnostica del piano sorgente senza aggiungere una seconda superficie grezza di divulgazione del percorso
filesystem. L'indice Plugin persistito `plugins/installs.json` è la sorgente di verità
dell'installazione e può essere aggiornato senza caricare moduli runtime del Plugin.
La sua mappa `installRecords` è duratura anche quando un manifest del Plugin manca o
non è valido; il suo array `plugins` è una vista manifest ricostruibile.

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

Quando un Plugin ha bisogno di un comportamento che non rientra nell'API attuale, non aggirare
il sistema di Plugin con un accesso privato. Aggiungi la capability mancante.

Sequenza consigliata:

1. definisci il contratto core
   Decidi quale comportamento condiviso il core dovrebbe possedere: policy, fallback, merge della configurazione,
   lifecycle, semantica rivolta ai canali e forma dell'helper runtime.
2. aggiungi superfici tipizzate di registrazione/runtime del Plugin
   Estendi `OpenClawPluginApi` e/o `api.runtime` con la più piccola superficie di capability
   tipizzata utile.
3. collega core e consumer di canale/funzionalità
   I canali e i Plugin di funzionalità dovrebbero consumare la nuova capability tramite il core,
   non importando direttamente un'implementazione vendor.
4. registra le implementazioni vendor
   I Plugin vendor registrano quindi i loro backend rispetto alla capability.
5. aggiungi copertura del contratto
   Aggiungi test così ownership e forma di registrazione restano esplicite nel tempo.

È così che OpenClaw resta opinionato senza diventare codificato rigidamente sulla visione del mondo di un
provider. Vedi il [Capability Cookbook](/it/plugins/adding-capabilities)
per una checklist concreta dei file e un esempio completo.

### Checklist capability

Quando aggiungi una nuova capability, l'implementazione dovrebbe di solito toccare insieme queste
superfici:

- tipi del contratto core in `src/<capability>/types.ts`
- helper runner/runtime core in `src/<capability>/runtime.ts`
- superficie di registrazione dell'API Plugin in `src/plugins/types.ts`
- collegamento del registro Plugin in `src/plugins/registry.ts`
- esposizione runtime del Plugin in `src/plugins/runtime/*` quando i Plugin di funzionalità/canale
  devono consumarla
- helper di cattura/test in `src/test-utils/plugin-registration.ts`
- asserzioni di ownership/contratto in `src/plugins/contracts/registry.ts`
- documentazione operator/Plugin in `docs/`

Se una di queste superfici manca, di solito è un segno che la capability non è
ancora completamente integrata.

### Template capability

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
- i Plugin vendor possiedono le implementazioni vendor
- i Plugin di funzionalità/canale consumano gli helper runtime
- i test di contratto mantengono esplicita l'ownership

## Correlati

- [Architettura dei Plugin](/it/plugins/architecture) — modello e forme pubbliche delle capability
- [Sottopercorsi dell'SDK Plugin](/it/plugins/sdk-subpaths)
- [Setup dell'SDK Plugin](/it/plugins/sdk-setup)
- [Creare Plugin](/it/plugins/building-plugins)
