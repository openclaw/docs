---
read_when:
    - Implementazione di hook runtime del provider, ciclo di vita del canale o package pack
    - Debug del load order dei Plugin o dello stato del registro
    - Aggiunta di una nuova capacità Plugin o di un Plugin del motore di contesto
summary: 'Dettagli interni dell''architettura dei Plugin: pipeline di caricamento, registro, hook runtime, route HTTP e tabelle di riferimento'
title: Dettagli interni dell'architettura dei Plugin
x-i18n:
    generated_at: "2026-04-24T08:51:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9370788c5f986e9205b1108ae633e829edec8890e442a49f80d84bb0098bb393
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Per il modello di capacità pubblico, le forme dei Plugin e i contratti di
proprietà/esecuzione, vedi [Architettura dei Plugin](/it/plugins/architecture). Questa pagina è il
riferimento per i meccanismi interni: pipeline di caricamento, registro, hook runtime,
route HTTP del Gateway, percorsi di importazione e tabelle di schema.

## Pipeline di caricamento

All'avvio, OpenClaw fa approssimativamente questo:

1. rileva le root candidate dei Plugin
2. legge i manifest nativi o dei bundle compatibili e i metadati dei package
3. rifiuta i candidati non sicuri
4. normalizza la configurazione del Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide l'abilitazione per ciascun candidato
6. carica i moduli nativi abilitati: i moduli bundle già costruiti usano un loader nativo;
   i Plugin nativi non costruiti usano jiti
7. chiama gli hook nativi `register(api)` e raccoglie le registrazioni nel registro dei Plugin
8. espone il registro alle superfici dei comandi/runtime

<Note>
`activate` è un alias legacy di `register`: il loader risolve quello presente (`def.register ?? def.activate`) e lo chiama nello stesso punto. Tutti i Plugin bundle usano `register`; per i nuovi Plugin preferisci `register`.
</Note>

I controlli di sicurezza avvengono **prima** dell'esecuzione a runtime. I candidati vengono bloccati
quando l'entry esce dalla root del Plugin, il percorso è scrivibile da chiunque, oppure la
proprietà del percorso sembra sospetta per i Plugin non bundle.

### Comportamento manifest-first

Il manifest è la fonte di verità del control plane. OpenClaw lo usa per:

- identificare il Plugin
- rilevare canali/Skills/schema di configurazione dichiarati o capacità del bundle
- convalidare `plugins.entries.<id>.config`
- arricchire etichette/segnaposto della UI di controllo
- mostrare metadati di installazione/catalogo
- preservare descrittori economici di attivazione e configurazione senza caricare il runtime del Plugin

Per i Plugin nativi, il modulo runtime è la parte data-plane. Registra
il comportamento reale come hook, strumenti, comandi o flussi provider.

I blocchi facoltativi `activation` e `setup` del manifest restano nel control plane.
Sono descrittori solo metadati per la pianificazione dell'attivazione e la discovery della configurazione;
non sostituiscono la registrazione runtime, `register(...)` o `setupEntry`.
I primi consumer di attivazione live ora usano i suggerimenti di comando, canale e provider del manifest
per restringere il caricamento dei Plugin prima di una materializzazione più ampia del registro:

- Il caricamento CLI si restringe ai Plugin che possiedono il comando primario richiesto
- La configurazione del canale/risoluzione del Plugin si restringe ai Plugin che possiedono l'id canale richiesto
- La configurazione esplicita del provider/risoluzione runtime si restringe ai Plugin che possiedono l'id provider richiesto

Il planner di attivazione espone sia un'API solo-id per i chiamanti esistenti sia un'API di piano per la nuova diagnostica. Le voci del piano riportano perché un Plugin è stato selezionato, separando i suggerimenti espliciti del planner `activation.*` dal fallback di proprietà del manifest come `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` e hook. Questa suddivisione dei motivi è il boundary di compatibilità:
i metadati dei Plugin esistenti continuano a funzionare, mentre il nuovo codice può rilevare suggerimenti ampi
o comportamento di fallback senza cambiare la semantica del caricamento runtime.

La discovery della configurazione ora preferisce gli id posseduti dai descrittori come `setup.providers` e
`setup.cliBackends` per restringere i Plugin candidati prima di ripiegare su
`setup-api` per i Plugin che richiedono ancora hook runtime in fase di setup. Se più di
un Plugin rilevato rivendica lo stesso id normalizzato di provider o backend CLI di setup,
la ricerca della configurazione rifiuta il proprietario ambiguo invece di affidarsi all'ordine di discovery.

### Cosa mette in cache il loader

OpenClaw mantiene brevi cache in-process per:

- risultati di discovery
- dati del registro dei manifest
- registri dei Plugin caricati

Queste cache riducono gli avvii impulsivi e l'overhead dei comandi ripetuti. È sicuro
considerarle cache di prestazioni a breve durata, non persistenza.

Nota sulle prestazioni:

- Imposta `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` oppure
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` per disabilitare queste cache.
- Regola le finestre di cache con `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` e
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modello del registro

I Plugin caricati non modificano direttamente variabili globali arbitrarie del core. Si registrano in un
registro centrale dei Plugin.

Il registro tiene traccia di:

- record dei Plugin (identità, sorgente, origine, stato, diagnostica)
- strumenti
- hook legacy e hook tipizzati
- canali
- provider
- handler RPC del gateway
- route HTTP
- registrar CLI
- servizi in background
- comandi di proprietà del Plugin

Le funzionalità core leggono poi da quel registro invece di parlare direttamente ai moduli del Plugin.
Questo mantiene il caricamento unidirezionale:

- modulo Plugin -> registrazione nel registro
- runtime core -> consumo del registro

Questa separazione è importante per la manutenibilità. Significa che la maggior parte delle superfici core ha bisogno di un solo punto di integrazione: "leggere il registro", non "gestire casi speciali per ogni modulo Plugin".

## Callback di binding della conversazione

I Plugin che associano una conversazione possono reagire quando un'approvazione viene risolta.

Usa `api.onConversationBindingResolved(...)` per ricevere una callback dopo che una richiesta di binding
viene approvata o negata:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Ora esiste un binding per questo plugin + conversazione.
        console.log(event.binding?.conversationId);
        return;
      }

      // La richiesta è stata negata; cancella qualunque stato locale in sospeso.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Campi del payload della callback:

- `status`: `"approved"` o `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` o `"deny"`
- `binding`: il binding risolto per le richieste approvate
- `request`: il riepilogo della richiesta originale, suggerimento di detach, id mittente e
  metadati della conversazione

Questa callback è solo di notifica. Non cambia chi è autorizzato ad associare una
conversazione e viene eseguita dopo che la gestione core dell'approvazione è terminata.

## Hook runtime del provider

I Plugin provider hanno tre livelli:

- **Metadati del manifest** per una lookup economica pre-runtime: `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` e `channelEnvVars`.
- **Hook di configurazione**: `catalog` (legacy `discovery`) più
  `applyConfigDefaults`.
- **Hook runtime**: oltre 40 hook facoltativi che coprono auth, risoluzione del modello,
  wrapping dello stream, livelli di thinking, policy di replay ed endpoint di utilizzo. Vedi
  l'elenco completo sotto [Ordine e utilizzo degli hook](#hook-order-and-usage).

OpenClaw continua a possedere il loop generico dell'agente, il failover, la gestione della trascrizione e
la policy degli strumenti. Questi hook sono la superficie di estensione per il comportamento specifico del provider senza richiedere un intero trasporto di inferenza personalizzato.

Usa `providerAuthEnvVars` del manifest quando il provider ha credenziali basate su env
che i percorsi generici auth/status/model-picker devono vedere senza caricare il runtime del Plugin.
Usa `providerAuthAliases` del manifest quando un id provider deve riutilizzare le env var, i profili auth, l'auth supportata da config e la scelta di onboarding con chiave API di un altro id provider.
Usa `providerAuthChoices` del manifest quando le superfici CLI di onboarding/scelta auth
devono conoscere l'id di scelta del provider, le etichette di gruppo e il semplice wiring auth con un flag senza caricare il runtime del provider. Mantieni `envVars` runtime del provider per suggerimenti rivolti all'operatore come etichette di onboarding o variabili di setup OAuth client-id/client-secret.

Usa `channelEnvVars` del manifest quando un canale ha auth o setup guidati da env che il fallback generico dell'env della shell, i controlli config/status o i prompt di setup devono vedere senza caricare il runtime del canale.

### Ordine e utilizzo degli hook

Per i Plugin di modello/provider, OpenClaw chiama gli hook approssimativamente in questo ordine.
La colonna "Quando usarlo" è la guida rapida alla decisione.

| #   | Hook                              | Cosa fa                                                                                                        | Quando usarlo                                                                                                                                  |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Pubblica la configurazione del provider in `models.providers` durante la generazione di `models.json`         | Il provider possiede un catalogo o valori predefiniti di base URL                                                                              |
| 2   | `applyConfigDefaults`             | Applica i valori predefiniti globali di configurazione del provider durante la materializzazione della configurazione | I valori predefiniti dipendono da modalità auth, env o semantica della famiglia di modelli del provider                                        |
| --  | _(ricerca del modello integrata)_ | OpenClaw prova prima il normale percorso di registro/catalogo                                                  | _(non è un hook Plugin)_                                                                                                                       |
| 3   | `normalizeModelId`                | Normalizza alias legacy o di anteprima degli id modello prima della ricerca                                    | Il provider possiede la pulizia degli alias prima della risoluzione del modello canonico                                                       |
| 4   | `normalizeTransport`              | Normalizza `api` / `baseUrl` della famiglia del provider prima dell'assemblaggio generico del modello         | Il provider possiede la pulizia del trasporto per id provider personalizzati nella stessa famiglia di trasporto                                |
| 5   | `normalizeConfig`                 | Normalizza `models.providers.<id>` prima della risoluzione runtime/provider                                    | Il provider necessita di pulizia della configurazione che dovrebbe vivere con il Plugin; gli helper bundle della famiglia Google fanno anche da backstop per le voci di configurazione Google supportate |
| 6   | `applyNativeStreamingUsageCompat` | Applica riscritture di compatibilità sull'uso dello streaming nativo ai provider di configurazione            | Il provider necessita di correzioni dei metadati di uso dello streaming nativo guidate dall'endpoint                                          |
| 7   | `resolveConfigApiKey`             | Risolve l'autenticazione con marker env per i provider di configurazione prima del caricamento auth runtime   | Il provider possiede una risoluzione della chiave API con marker env; `amazon-bedrock` ha anche qui un resolver integrato per i marker env AWS |
| 8   | `resolveSyntheticAuth`            | Espone auth locale/self-hosted o supportata da config senza persistere plaintext                              | Il provider può operare con un marker di credenziale sintetico/locale                                                                          |
| 9   | `resolveExternalAuthProfiles`     | Sovrappone profili auth esterni posseduti dal provider; il valore predefinito di `persistence` è `runtime-only` per credenziali possedute da CLI/app | Il provider riutilizza credenziali auth esterne senza persistere refresh token copiati; dichiara `contracts.externalAuthProviders` nel manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Abbassa i placeholder dei profili sintetici archiviati dietro auth supportata da env/config                   | Il provider archivia profili placeholder sintetici che non dovrebbero vincere la precedenza                                                    |
| 11  | `resolveDynamicModel`             | Fallback sincrono per id modello di proprietà del provider non ancora presenti nel registro locale            | Il provider accetta id modello arbitrari upstream                                                                                              |
| 12  | `prepareDynamicModel`             | Warm-up asincrono, poi `resolveDynamicModel` viene eseguito di nuovo                                           | Il provider necessita di metadati di rete prima di risolvere id sconosciuti                                                                   |
| 13  | `normalizeResolvedModel`          | Riscrittura finale prima che il runner embedded usi il modello risolto                                         | Il provider necessita di riscritture del trasporto ma continua a usare un trasporto core                                                      |
| 14  | `contributeResolvedModelCompat`   | Contribuisce flag di compatibilità per modelli vendor dietro un altro trasporto compatibile                   | Il provider riconosce i propri modelli su trasporti proxy senza assumere il controllo del provider                                             |
| 15  | `capabilities`                    | Metadati transcript/tooling del provider usati dalla logica core condivisa                                     | Il provider necessita di particolarità transcript/famiglia provider                                                                            |
| 16  | `normalizeToolSchemas`            | Normalizza gli schema degli strumenti prima che il runner embedded li veda                                     | Il provider necessita di pulizia degli schema della famiglia di trasporto                                                                      |
| 17  | `inspectToolSchemas`              | Espone diagnostica sugli schema di proprietà del provider dopo la normalizzazione                              | Il provider vuole avvisi sulle keyword senza insegnare al core regole specifiche del provider                                                  |
| 18  | `resolveReasoningOutputMode`      | Seleziona il contratto di output reasoning nativo vs con tag                                                   | Il provider necessita di reasoning/output finale con tag invece dei campi nativi                                                               |
| 19  | `prepareExtraParams`              | Normalizzazione dei parametri della richiesta prima dei wrapper generici delle opzioni di stream              | Il provider necessita di parametri di richiesta predefiniti o di pulizia per-provider dei parametri                                           |
| 20  | `createStreamFn`                  | Sostituisce completamente il normale percorso di stream con un trasporto personalizzato                        | Il provider necessita di un protocollo wire personalizzato, non solo di un wrapper                                                             |
| 21  | `wrapStreamFn`                    | Wrapper dello stream dopo l'applicazione dei wrapper generici                                                  | Il provider necessita di wrapper di compatibilità di header/body/modello della richiesta senza un trasporto personalizzato                     |
| 22  | `resolveTransportTurnState`       | Allega header o metadati nativi per turno di trasporto                                                         | Il provider vuole che i trasporti generici inviino identità di turno native del provider                                                      |
| 23  | `resolveWebSocketSessionPolicy`   | Allega header WebSocket nativi o policy di cool-down della sessione                                            | Il provider vuole che i trasporti WS generici regolino header di sessione o policy di fallback                                                |
| 24  | `formatApiKey`                    | Formatter del profilo auth: il profilo archiviato diventa la stringa `apiKey` runtime                         | Il provider archivia metadati auth extra e necessita di una forma personalizzata del token runtime                                             |
| 25  | `refreshOAuth`                    | Override del refresh OAuth per endpoint di refresh personalizzati o policy di fallimento del refresh          | Il provider non si adatta ai refresher condivisi di `pi-ai`                                                                                    |
| 26  | `buildAuthDoctorHint`             | Suggerimento di riparazione aggiunto quando il refresh OAuth fallisce                                          | Il provider necessita di una guida di riparazione auth posseduta dal provider dopo un fallimento del refresh                                  |
| 27  | `matchesContextOverflowError`     | Matcher di overflow della finestra di contesto di proprietà del provider                                       | Il provider ha errori raw di overflow che le euristiche generiche non rileverebbero                                                           |
| 28  | `classifyFailoverReason`          | Classificazione della ragione di failover di proprietà del provider                                            | Il provider può mappare errori raw di API/trasporto su rate-limit/overload/ecc.                                                               |
| 29  | `isCacheTtlEligible`              | Policy della cache dei prompt per provider proxy/backhaul                                                      | Il provider necessita di gating specifico della proxy per il TTL della cache                                                                   |
| 30  | `buildMissingAuthMessage`         | Sostituzione del messaggio generico di recupero auth mancante                                                  | Il provider necessita di un suggerimento di recupero specifico per auth mancante                                                               |
| 31  | `suppressBuiltInModel`            | Soppressione di modelli upstream obsoleti più eventuale suggerimento di errore visibile all'utente            | Il provider deve nascondere righe upstream obsolete o sostituirle con un suggerimento vendor                                                  |
| 32  | `augmentModelCatalog`             | Righe di catalogo sintetiche/finali aggiunte dopo la discovery                                                 | Il provider necessita di righe sintetiche di forward-compat in `models list` e nei picker                                                     |
| 33  | `resolveThinkingProfile`          | Insieme di livelli `/think`, etichette di visualizzazione e valore predefinito specifici del modello          | Il provider espone una scala di thinking personalizzata o un'etichetta binaria per modelli selezionati                                        |
| 34  | `isBinaryThinking`                | Hook di compatibilità per il toggle reasoning on/off                                                           | Il provider espone solo thinking binario acceso/spento                                                                                         |
| 35  | `supportsXHighThinking`           | Hook di compatibilità del supporto reasoning `xhigh`                                                           | Il provider vuole `xhigh` solo su un sottoinsieme di modelli                                                                                   |
| 36  | `resolveDefaultThinkingLevel`     | Hook di compatibilità del livello `/think` predefinito                                                         | Il provider possiede la policy predefinita `/think` per una famiglia di modelli                                                               |
| 37  | `isModernModelRef`                | Matcher dei modelli modern per i filtri dei profili live e la selezione smoke                                 | Il provider possiede il matching dei modelli preferiti live/smoke                                                                            |
| 38  | `prepareRuntimeAuth`              | Scambia una credenziale configurata con il token/chiave runtime effettivo subito prima dell'inferenza        | Il provider necessita di uno scambio di token o di una credenziale di richiesta a breve durata                                               |
| 39  | `resolveUsageAuth`                | Risolve le credenziali di utilizzo/fatturazione per `/usage` e superfici di stato correlate                   | Il provider necessita di parsing personalizzato del token di uso/quota o di una credenziale di utilizzo diversa                              |
| 40  | `fetchUsageSnapshot`              | Recupera e normalizza snapshot di utilizzo/quota specifici del provider dopo che l'auth è risolta            | Il provider necessita di un endpoint di utilizzo specifico del provider o di un parser del payload                                           |
| 41  | `createEmbeddingProvider`         | Costruisce un adattatore di embedding di proprietà del provider per memoria/ricerca                           | Il comportamento di embedding della memoria appartiene al Plugin del provider                                                                 |
| 42  | `buildReplayPolicy`               | Restituisce una policy di replay che controlla la gestione della trascrizione per il provider                 | Il provider necessita di una policy di trascrizione personalizzata (ad esempio rimozione dei blocchi di thinking)                            |
| 43  | `sanitizeReplayHistory`           | Riscrive la cronologia di replay dopo la pulizia generica della trascrizione                                  | Il provider necessita di riscritture di replay specifiche del provider oltre agli helper condivisi di Compaction                             |
| 44  | `validateReplayTurns`             | Validazione o rimodellamento finale dei turni di replay prima del runner embedded                             | Il trasporto del provider necessita di una validazione dei turni più rigorosa dopo la sanitizzazione generica                                |
| 45  | `onModelSelected`                 | Esegue effetti collaterali post-selezione di proprietà del provider                                           | Il provider necessita di telemetria o di stato di proprietà del provider quando un modello diventa attivo                                    |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` controllano prima il
Plugin provider corrispondente, poi passano agli altri Plugin provider con capacità di hook
finché uno non cambia effettivamente l'id modello o il trasporto/configurazione. Questo mantiene
funzionanti gli shim alias/provider compat senza richiedere che il chiamante sappia quale
Plugin bundle possiede la riscrittura. Se nessun hook provider riscrive una voce di configurazione
supportata della famiglia Google, il normalizzatore integrato della configurazione Google applica comunque quella pulizia di compatibilità.

Se il provider necessita di un protocollo wire completamente personalizzato o di un esecutore di richieste personalizzato,
quella è una classe diversa di estensione. Questi hook servono per il comportamento del provider
che continua a essere eseguito sul normale loop di inferenza di OpenClaw.

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

I Plugin provider bundle combinano gli hook sopra per adattarsi alle esigenze di catalogo,
auth, thinking, replay e usage di ciascun vendor. L'insieme autorevole degli hook vive con
ogni Plugin sotto `extensions/`; questa pagina illustra le forme invece
di replicarne l'elenco.

<AccordionGroup>
  <Accordion title="Provider catalogo pass-through">
    OpenRouter, Kilocode, Z.AI, xAI registrano `catalog` più
    `resolveDynamicModel` / `prepareDynamicModel` così possono esporre id di modelli upstream in anticipo
    rispetto al catalogo statico di OpenClaw.
  </Accordion>
  <Accordion title="Provider con OAuth ed endpoint di usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai combinano
    `prepareRuntimeAuth` o `formatApiKey` con `resolveUsageAuth` +
    `fetchUsageSnapshot` per possedere lo scambio di token e l'integrazione `/usage`.
  </Accordion>
  <Accordion title="Famiglie di replay e pulizia della trascrizione">
    Le famiglie nominate condivise (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permettono ai provider di aderire alla
    policy della trascrizione tramite `buildReplayPolicy` invece di far sì che ogni Plugin
    reimplementi la pulizia.
  </Accordion>
  <Accordion title="Provider solo-catalogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` e
    `volcengine` registrano solo `catalog` e usano il loop di inferenza condiviso.
  </Accordion>
  <Accordion title="Helper di stream specifici di Anthropic">
    Header beta, `/fast` / `serviceTier` e `context1m` vivono nella seam pubblica
    `api.ts` / `contract-api.ts` del Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) invece che nell'SDK
    generico.
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

- `textToSpeech` restituisce il normale payload di output TTS del core per superfici file/nota vocale.
- Usa la configurazione core `messages.tts` e la selezione del provider.
- Restituisce buffer audio PCM + sample rate. I Plugin devono fare resampling/codifica per i provider.
- `listVoices` è facoltativo per provider. Usalo per picker di voci o flussi di configurazione posseduti dal vendor.
- Gli elenchi di voci possono includere metadati più ricchi come locale, genere e tag di personalità per picker consapevoli del provider.
- OpenAI ed ElevenLabs oggi supportano la telefonia. Microsoft no.

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

- Mantieni in core la policy TTS, il fallback e la consegna delle risposte.
- Usa i provider vocali per il comportamento di sintesi posseduto dal vendor.
- L'input legacy Microsoft `edge` viene normalizzato all'id provider `microsoft`.
- Il modello di proprietà preferito è orientato all'azienda: un unico Plugin vendor può possedere
  provider di testo, voce, immagine e futuri contenuti multimediali mentre OpenClaw aggiunge questi
  contratti di capacità.

Per la comprensione di immagini/audio/video, i Plugin registrano un unico
provider tipizzato di comprensione multimediale invece di una generica bag chiave/valore:

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

- Mantieni in core orchestrazione, fallback, configurazione e wiring del canale.
- Mantieni il comportamento del vendor nel Plugin provider.
- L'espansione additiva deve restare tipizzata: nuovi metodi facoltativi, nuovi campi di risultato facoltativi, nuove capacità facoltative.
- La generazione video segue già lo stesso pattern:
  - il core possiede il contratto di capacità e l'helper runtime
  - i Plugin vendor registrano `api.registerVideoGenerationProvider(...)`
  - i Plugin di funzionalità/canale consumano `api.runtime.videoGeneration.*`

Per gli helper runtime di comprensione multimediale, i Plugin possono chiamare:

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
multimediale oppure l'alias STT precedente:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Facoltativo quando il MIME non può essere dedotto in modo affidabile:
  mime: "audio/ogg",
});
```

Note:

- `api.runtime.mediaUnderstanding.*` è la superficie condivisa preferita per
  la comprensione di immagini/audio/video.
- Usa la configurazione audio core della comprensione multimediale (`tools.media.audio`) e l'ordine di fallback del provider.
- Restituisce `{ text: undefined }` quando non viene prodotta alcuna trascrizione (ad esempio input saltato/non supportato).
- `api.runtime.stt.transcribeAudioFile(...)` resta come alias di compatibilità.

I Plugin possono anche avviare esecuzioni di subagenti in background tramite `api.runtime.subagent`:

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
- OpenClaw rispetta quei campi di override solo per chiamanti attendibili.
- Per esecuzioni di fallback possedute dal Plugin, gli operatori devono aderire esplicitamente con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` per limitare i Plugin attendibili a target canonici specifici `provider/model`, oppure `"*"` per consentire esplicitamente qualunque target.
- Le esecuzioni di subagenti dei Plugin non attendibili continuano a funzionare, ma le richieste di override vengono rifiutate invece di ricadere silenziosamente su un fallback.

Per la ricerca web, i Plugin possono consumare l'helper runtime condiviso invece
di entrare nel wiring dello strumento dell'agente:

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

- Mantieni in core la selezione del provider, la risoluzione delle credenziali e la semantica condivisa delle richieste.
- Usa i provider di ricerca web per i trasporti di ricerca specifici del vendor.
- `api.runtime.webSearch.*` è la superficie condivisa preferita per i Plugin di funzionalità/canale che necessitano di comportamento di ricerca senza dipendere dal wrapper dello strumento dell'agente.

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

- `generate(...)`: genera un'immagine usando la catena del provider di generazione immagini configurata.
- `listProviders(...)`: elenca i provider di generazione immagini disponibili e le loro capacità.

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

- `path`: percorso della route sotto il server HTTP del gateway.
- `auth`: obbligatorio. Usa `"gateway"` per richiedere la normale autenticazione del gateway, oppure `"plugin"` per auth/verifica webhook gestite dal Plugin.
- `match`: facoltativo. `"exact"` (predefinito) oppure `"prefix"`.
- `replaceExisting`: facoltativo. Consente allo stesso Plugin di sostituire una propria registrazione di route esistente.
- `handler`: restituisce `true` quando la route ha gestito la richiesta.

Note:

- `api.registerHttpHandler(...)` è stato rimosso e causerà un errore di caricamento del Plugin. Usa invece `api.registerHttpRoute(...)`.
- Le route dei Plugin devono dichiarare `auth` esplicitamente.
- I conflitti esatti `path + match` vengono rifiutati a meno che `replaceExisting: true`, e un Plugin non può sostituire la route di un altro Plugin.
- Le route sovrapposte con livelli `auth` diversi vengono rifiutate. Mantieni le catene di fallthrough `exact`/`prefix` solo sullo stesso livello auth.
- Le route `auth: "plugin"` **non** ricevono automaticamente gli ambiti runtime operatore. Servono per webhook/verifica firme gestiti dal Plugin, non per chiamate helper privilegiate del Gateway.
- Le route `auth: "gateway"` vengono eseguite all'interno di un ambito runtime di richiesta Gateway, ma tale ambito è intenzionalmente conservativo:
  - l'autenticazione bearer a segreto condiviso (`gateway.auth.mode = "token"` / `"password"`) mantiene gli ambiti runtime delle route Plugin fissati a `operator.write`, anche se il chiamante invia `x-openclaw-scopes`
  - le modalità HTTP attendibili che trasportano identità (ad esempio `trusted-proxy` o `gateway.auth.mode = "none"` su un ingresso privato) rispettano `x-openclaw-scopes` solo quando l'header è esplicitamente presente
  - se `x-openclaw-scopes` è assente su quelle richieste alle route Plugin che trasportano identità, l'ambito runtime ripiega su `operator.write`
- Regola pratica: non presumere che una route Plugin autenticata dal gateway sia implicitamente una superficie admin. Se la tua route necessita di comportamento solo-admin, richiedi una modalità auth che trasporta identità e documenta il contratto esplicito dell'header `x-openclaw-scopes`.

## Percorsi di importazione dell'SDK Plugin

Usa sottopercorsi SDK ristretti invece del barrel root monolitico `openclaw/plugin-sdk`
quando scrivi nuovi Plugin. Sottopercorsi core:

| Sottopercorso                        | Scopo                                              |
| ------------------------------------ | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`   | Primitive di registrazione del Plugin              |
| `openclaw/plugin-sdk/channel-core`   | Helper di entry/build del canale                   |
| `openclaw/plugin-sdk/core`           | Helper condivisi generici e contratto umbrella     |
| `openclaw/plugin-sdk/config-schema`  | Schema Zod della root `openclaw.json` (`OpenClawSchema`) |

I Plugin canale scelgono da una famiglia di seam ristretti — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` e `channel-actions`. Il comportamento di approvazione dovrebbe consolidarsi
su un unico contratto `approvalCapability` invece di mescolare campi di Plugin non correlati.
Vedi [Plugin canale](/it/plugins/sdk-channel-plugins).

Gli helper runtime e config si trovano sotto sottopercorsi `*-runtime`
corrispondenti (`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store`, ecc.).

<Info>
`openclaw/plugin-sdk/channel-runtime` è deprecato — shim di compatibilità per
Plugin meno recenti. Il nuovo codice dovrebbe importare primitive generiche più ristrette.
</Info>

Entry point interni al repo (per root package di ciascun Plugin bundle):

- `index.js` — entry del Plugin bundle
- `api.js` — barrel helper/tipi
- `runtime-api.js` — barrel solo runtime
- `setup-entry.js` — entry del Plugin di setup

I Plugin esterni dovrebbero importare solo sottopercorsi `openclaw/plugin-sdk/*`. Non
importare mai `src/*` di un altro package Plugin dal core o da un altro Plugin.
Gli entry point caricati tramite facade preferiscono lo snapshot attivo della config runtime quando esiste, poi ripiegano sul file di configurazione risolto su disco.

Sottopercorsi specifici di capacità come `image-generation`, `media-understanding`
e `speech` esistono perché i Plugin bundle li usano oggi. Non sono
automaticamente contratti esterni congelati a lungo termine — controlla la pagina di riferimento SDK pertinente quando ti basi su di essi.

## Schema dello strumento message

I Plugin dovrebbero possedere i contributi allo schema `describeMessageTool(...)` specifici del canale
per primitive non-message come reazioni, letture e poll.
La presentazione condivisa dell'invio dovrebbe usare il contratto generico `MessagePresentation`
invece di campi nativi del provider per button, component, block o card.
Vedi [Message Presentation](/it/plugins/message-presentation) per il contratto,
le regole di fallback, la mappatura dei provider e la checklist per gli autori di Plugin.

I Plugin con capacità di invio dichiarano cosa possono renderizzare tramite le capacità di messaggio:

- `presentation` per blocchi di presentazione semantica (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` per richieste di consegna appuntata

Il core decide se rendere la presentazione in modo nativo o degradarla a testo.
Non esporre vie di fuga UI native del provider dallo strumento message generico.
Gli helper SDK deprecati per schemi nativi legacy restano esportati per i
Plugin di terze parti esistenti, ma i nuovi Plugin non dovrebbero usarli.

## Risoluzione dei target di canale

I Plugin canale dovrebbero possedere la semantica dei target specifica del canale. Mantieni generico l'host in uscita condiviso e usa la superficie dell'adattatore di messaggistica per le regole del provider:

- `messaging.inferTargetChatType({ to })` decide se un target normalizzato
  debba essere trattato come `direct`, `group` o `channel` prima della ricerca nella directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` dice al core se un
  input deve saltare direttamente alla risoluzione tipo-id invece che alla ricerca nella directory.
- `messaging.targetResolver.resolveTarget(...)` è il fallback del Plugin quando il
  core ha bisogno di una risoluzione finale posseduta dal provider dopo la normalizzazione o dopo un
  mancato risultato nella directory.
- `messaging.resolveOutboundSessionRoute(...)` possiede la costruzione della route di sessione specifica del provider una volta che un target è risolto.

Suddivisione consigliata:

- Usa `inferTargetChatType` per decisioni di categoria che devono avvenire prima
  della ricerca tra peer/gruppi.
- Usa `looksLikeId` per controlli del tipo "tratta questo come id target esplicito/nativo".
- Usa `resolveTarget` per il fallback di normalizzazione specifico del provider, non per
  una ricerca ampia nella directory.
- Mantieni id nativi del provider come chat id, thread id, JID, handle e room
  id dentro i valori `target` o nei parametri specifici del provider, non in campi SDK generici.

## Directory supportate dalla configurazione

I Plugin che derivano voci di directory dalla configurazione dovrebbero mantenere quella logica nel
Plugin e riusare gli helper condivisi di
`openclaw/plugin-sdk/directory-runtime`.

Usalo quando un canale necessita di peer/gruppi supportati da configurazione come:

- peer DM guidati da allowlist
- mappe canale/gruppo configurate
- fallback di directory statici con ambito account

Gli helper condivisi in `directory-runtime` gestiscono solo operazioni generiche:

- filtro delle query
- applicazione dei limiti
- helper di deduplica/normalizzazione
- costruzione di `ChannelDirectoryEntry[]`

L'ispezione degli account specifica del canale e la normalizzazione degli id dovrebbero restare nell'implementazione del Plugin.

## Cataloghi dei provider

I Plugin provider possono definire cataloghi di modelli per l'inferenza con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` restituisce la stessa forma che OpenClaw scrive in
`models.providers`:

- `{ provider }` per una voce singola di provider
- `{ providers }` per più voci di provider

Usa `catalog` quando il Plugin possiede id modello specifici del provider, valori predefiniti di base URL o metadati dei modelli protetti da auth.

`catalog.order` controlla quando il catalogo di un Plugin viene unito rispetto ai provider impliciti integrati di OpenClaw:

- `simple`: provider semplici con chiave API o guidati da env
- `profile`: provider che compaiono quando esistono profili auth
- `paired`: provider che sintetizzano più voci di provider correlate
- `late`: ultimo passaggio, dopo gli altri provider impliciti

I provider successivi vincono in caso di collisione di chiave, quindi i Plugin possono intenzionalmente sovrascrivere una voce di provider integrata con lo stesso id provider.

Compatibilità:

- `discovery` continua a funzionare come alias legacy
- se sono registrati sia `catalog` sia `discovery`, OpenClaw usa `catalog`

## Ispezione del canale di sola lettura

Se il tuo Plugin registra un canale, preferisci implementare
`plugin.config.inspectAccount(cfg, accountId)` insieme a `resolveAccount(...)`.

Perché:

- `resolveAccount(...)` è il percorso runtime. Può presumere che le credenziali
  siano completamente materializzate e può fallire rapidamente quando mancano i secret richiesti.
- I percorsi di comando di sola lettura come `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e i flussi doctor/config
  repair non dovrebbero dover materializzare credenziali runtime solo per
  descrivere la configurazione.

Comportamento consigliato di `inspectAccount(...)`:

- Restituisci solo stato descrittivo dell'account.
- Preserva `enabled` e `configured`.
- Includi campi sorgente/stato delle credenziali quando rilevanti, come:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Non è necessario restituire valori raw dei token solo per segnalare la
  disponibilità di sola lettura. Restituire `tokenStatus: "available"` (e il campo sorgente corrispondente) è sufficiente per comandi in stile status.
- Usa `configured_unavailable` quando una credenziale è configurata tramite SecretRef ma
  non disponibile nel percorso di comando corrente.

Questo permette ai comandi di sola lettura di riportare "configurato ma non disponibile in questo percorso di comando" invece di andare in crash o riportare erroneamente l'account come non configurato.

## Package pack

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

Se il tuo Plugin importa dipendenze npm, installale in quella directory in modo che
`node_modules` sia disponibile (`npm install` / `pnpm install`).

Guardrail di sicurezza: ogni voce `openclaw.extensions` deve restare all'interno della directory del Plugin
dopo la risoluzione dei symlink. Le voci che escono dalla directory del package vengono
rifiutate.

Nota di sicurezza: `openclaw plugins install` installa le dipendenze dei Plugin con
`npm install --omit=dev --ignore-scripts` (nessuno script lifecycle, nessuna dipendenza dev a runtime). Mantieni gli alberi di dipendenze dei Plugin "pure JS/TS" ed evita package che richiedono build `postinstall`.

Facoltativo: `openclaw.setupEntry` può puntare a un modulo leggero solo-setup.
Quando OpenClaw ha bisogno di superfici di setup per un Plugin canale disabilitato, oppure
quando un Plugin canale è abilitato ma ancora non configurato, carica `setupEntry`
invece dell'entry completa del Plugin. Questo rende più leggeri avvio e setup
quando l'entry principale del Plugin collega anche strumenti, hook o altro codice solo-runtime.

Facoltativo: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
può far aderire un Plugin canale allo stesso percorso `setupEntry` durante la fase
pre-listen di avvio del gateway, anche quando il canale è già configurato.

Usalo solo quando `setupEntry` copre completamente la superficie di avvio che deve esistere
prima che il gateway inizi ad ascoltare. In pratica, significa che l'entry di setup
deve registrare ogni capacità posseduta dal canale da cui l'avvio dipende, come:

- la registrazione del canale stesso
- eventuali route HTTP che devono essere disponibili prima che il gateway inizi ad ascoltare
- eventuali metodi, strumenti o servizi gateway che devono esistere durante quella stessa finestra

Se la tua entry completa possiede ancora una qualunque capacità di avvio richiesta, non abilitare
questo flag. Mantieni il comportamento predefinito del Plugin e lascia che OpenClaw carichi
l'entry completa durante l'avvio.

I canali bundle possono anche pubblicare helper della superficie di contratto solo-setup che il core
può consultare prima che il runtime completo del canale venga caricato. L'attuale superficie di
promozione del setup è:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Il core usa questa superficie quando deve promuovere una configurazione legacy di canale single-account
in `channels.<id>.accounts.*` senza caricare l'entry completa del Plugin.
Matrix è l'esempio bundle attuale: sposta solo chiavi auth/bootstrap in un
account promosso con nome quando esistono già account con nome, e può preservare
una chiave default-account configurata non canonica invece di creare sempre
`accounts.default`.

Quegli adattatori di patch di setup mantengono lazy la discovery della superficie di contratto bundle. Il tempo di importazione resta leggero; la superficie di promozione viene caricata solo al primo utilizzo invece di rientrare nell'avvio del canale bundle all'importazione del modulo.

Quando quelle superfici di avvio includono metodi RPC del gateway, mantienili su un
prefisso specifico del Plugin. I namespace admin core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e risolvono sempre
a `operator.admin`, anche se un Plugin richiede un ambito più ristretto.

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

I Plugin canale possono pubblicizzare metadati di setup/discovery tramite `openclaw.channel` e
suggerimenti di installazione tramite `openclaw.install`. Questo mantiene il core privo di dati di catalogo.

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

- `detailLabel`: etichetta secondaria per superfici di catalogo/status più ricche
- `docsLabel`: sovrascrive il testo del link per il collegamento alla documentazione
- `preferOver`: id Plugin/canale a priorità inferiore che questa voce di catalogo dovrebbe superare
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controlli del testo nella superficie di selezione
- `markdownCapable`: contrassegna il canale come capace di markdown per le decisioni di formattazione in uscita
- `exposure.configured`: nasconde il canale dalle superfici di elenco dei canali configurati quando impostato su `false`
- `exposure.setup`: nasconde il canale dai picker interattivi di setup/configurazione quando impostato su `false`
- `exposure.docs`: contrassegna il canale come interno/privato per le superfici di navigazione della documentazione
- `showConfigured` / `showInSetup`: alias legacy ancora accettati per compatibilità; preferisci `exposure`
- `quickstartAllowFrom`: fa aderire il canale al flusso quickstart standard `allowFrom`
- `forceAccountBinding`: richiede un binding esplicito dell'account anche quando esiste un solo account
- `preferSessionLookupForAnnounceTarget`: preferisce la lookup della sessione quando risolve i target di annuncio

OpenClaw può anche unire **cataloghi di canali esterni** (ad esempio un export del
registro MPM). Inserisci un file JSON in uno di questi percorsi:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oppure punta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a
uno o più file JSON (delimitati da virgola/punto e virgola/`PATH`). Ogni file dovrebbe
contenere `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Il parser accetta anche `"packages"` o `"plugins"` come alias legacy per la chiave `"entries"`.

Le voci generate del catalogo canali e le voci del catalogo di installazione dei provider espongono
fatti normalizzati sulla sorgente di installazione accanto al blocco raw `openclaw.install`. I
fatti normalizzati identificano se la spec npm è una versione esatta o un selettore flottante, se i metadati di integrità attesi sono presenti e se è disponibile anche un percorso di sorgente locale. I consumer dovrebbero trattare `installSource` come un campo facoltativo additivo così le voci più vecchie costruite a mano e gli shim di compatibilità non devono sintetizzarlo. Questo consente a onboarding e diagnostica di spiegare lo stato del source-plane senza importare il runtime del Plugin.

Le voci npm esterne ufficiali dovrebbero preferire una `npmSpec` esatta più
`expectedIntegrity`. I nomi package non qualificati e i dist-tag continuano a funzionare per
compatibilità, ma mostrano avvisi di source-plane così il catalogo può evolvere
verso installazioni fissate e verificate per integrità senza rompere i Plugin esistenti.
Quando l'onboarding installa da un percorso di catalogo locale, registra una
voce `plugins.installs` con `source: "path"` e un `sourcePath`
relativo al workspace quando possibile. Il percorso di caricamento operativo assoluto resta in
`plugins.load.paths`; il record di installazione evita di duplicare percorsi della workstation locale nella configurazione di lunga durata. Questo mantiene visibili agli strumenti di diagnostica del source-plane le installazioni di sviluppo locale senza aggiungere una seconda superficie di divulgazione di percorsi raw del filesystem.

## Plugin del motore di contesto

I Plugin del motore di contesto possiedono l'orchestrazione del contesto di sessione per ingestione, assemblaggio
e Compaction. Registrali dal tuo Plugin con
`api.registerContextEngine(id, factory)`, quindi seleziona il motore attivo con
`plugins.slots.contextEngine`.

Usalo quando il tuo Plugin deve sostituire o estendere la pipeline di contesto predefinita
invece di limitarsi ad aggiungere ricerca in memoria o hook.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
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

Se il tuo motore **non** possiede l'algoritmo di Compaction, mantieni `compact()`
implementato e delegalo esplicitamente:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
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

Quando un Plugin necessita di un comportamento che non si adatta all'API attuale, non bypassare
il sistema dei Plugin con un accesso privato interno. Aggiungi la capacità mancante.

Sequenza consigliata:

1. definire il contratto core
   Decidi quale comportamento condiviso il core deve possedere: policy, fallback, unione di configurazione,
   ciclo di vita, semantica visibile al canale e forma dell'helper runtime.
2. aggiungere superfici tipizzate di registrazione/runtime del Plugin
   Estendi `OpenClawPluginApi` e/o `api.runtime` con la superficie tipizzata di capacità più piccola utile.
3. collegare i consumer core + canale/funzionalità
   I canali e i Plugin di funzionalità dovrebbero consumare la nuova capacità tramite il core,
   non importando direttamente un'implementazione vendor.
4. registrare le implementazioni vendor
   I Plugin vendor registrano poi i propri backend rispetto alla capacità.
5. aggiungere copertura del contratto
   Aggiungi test così la proprietà e la forma della registrazione restano esplicite nel tempo.

È così che OpenClaw resta opinionated senza diventare hardcoded sul punto di vista
di un singolo provider. Vedi il [Capability Cookbook](/it/plugins/architecture)
per una checklist concreta dei file e un esempio pratico.

### Checklist della capacità

Quando aggiungi una nuova capacità, di solito l'implementazione dovrebbe toccare insieme
queste superfici:

- tipi del contratto core in `src/<capability>/types.ts`
- runner/helper runtime core in `src/<capability>/runtime.ts`
- superficie di registrazione dell'API Plugin in `src/plugins/types.ts`
- wiring del registro dei Plugin in `src/plugins/registry.ts`
- esposizione runtime del Plugin in `src/plugins/runtime/*` quando i Plugin di funzionalità/canale devono consumarla
- helper di cattura/test in `src/test-utils/plugin-registration.ts`
- asserzioni di proprietà/contratto in `src/plugins/contracts/registry.ts`
- documentazione per operatori/Plugin in `docs/`

Se una di queste superfici manca, di solito è il segno che la capacità
non è ancora completamente integrata.

### Template della capacità

Pattern minimo:

```ts
// contratto core
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API Plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// helper runtime condiviso per i Plugin di funzionalità/canale
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

- il core possiede il contratto di capacità + l'orchestrazione
- i Plugin vendor possiedono le implementazioni vendor
- i Plugin di funzionalità/canale consumano helper runtime
- i test di contratto mantengono esplicita la proprietà

## Correlati

- [Architettura dei Plugin](/it/plugins/architecture) — modello e forme delle capacità pubbliche
- [Sottopercorsi SDK Plugin](/it/plugins/sdk-subpaths)
- [Configurazione SDK Plugin](/it/plugins/sdk-setup)
- [Creazione di Plugin](/it/plugins/building-plugins)
