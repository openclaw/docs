---
read_when:
    - Viene visualizzato l'avviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Visualizzi l'avviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Hai usato api.registerEmbeddedExtensionFactory prima di OpenClaw 2026.4.25
    - Stai aggiornando un Plugin all'architettura moderna dei Plugin
    - Mantieni un Plugin OpenClaw esterno
sidebarTitle: Migrate to SDK
summary: Migra dal livello legacy di compatibilità retroattiva all'SDK moderno dei Plugin
title: Migrazione del Plugin SDK
x-i18n:
    generated_at: "2026-07-01T08:07:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f05bd42cc0a6fc53f6670377b4330bb452b2a06f4d0542a494875970ee81e08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw è passato da un ampio livello di compatibilità retroattiva a una moderna architettura a plugin
con import mirati e documentati. Se il tuo plugin è stato creato prima
della nuova architettura, questa guida ti aiuta a migrare.

## Cosa cambia

Il vecchio sistema di plugin forniva due superfici molto aperte che permettevano ai plugin di importare
tutto ciò di cui avevano bisogno da un unico punto di ingresso:

- **`openclaw/plugin-sdk/compat`** - un unico import che riesportava decine di
  helper. È stato introdotto per mantenere funzionanti i vecchi plugin basati su hook mentre veniva
  costruita la nuova architettura dei plugin.
- **`openclaw/plugin-sdk/infra-runtime`** - un ampio barrel di helper runtime che
  mescolava eventi di sistema, stato Heartbeat, code di consegna, helper fetch/proxy,
  helper per file, tipi di approvazione e utilità non correlate.
- **`openclaw/plugin-sdk/config-runtime`** - un ampio barrel di compatibilità della configurazione
  che contiene ancora helper diretti di caricamento/scrittura deprecati durante la finestra di migrazione.
- **`openclaw/extension-api`** - un bridge che dava ai plugin accesso diretto agli
  helper lato host, come il runner dell'agente incorporato.
- **`api.registerEmbeddedExtensionFactory(...)`** - un hook di estensione bundled solo per runner incorporato,
  ora rimosso, che poteva osservare eventi del runner incorporato come
  `tool_result`.

Le ampie superfici di import sono ora **deprecate**. Continuano a funzionare a runtime,
ma i nuovi plugin non devono usarle, e i plugin esistenti dovrebbero migrare prima che
la prossima major release le rimuova. L'API di registrazione della factory di estensioni
solo per runner incorporato è stata rimossa; usa invece il middleware per risultati degli strumenti.

OpenClaw non rimuove né reinterpreta il comportamento documentato dei plugin nella stessa
modifica che introduce un sostituto. Le modifiche che rompono il contratto devono prima passare
attraverso un adapter di compatibilità, diagnostica, documentazione e una finestra di deprecazione.
Questo vale per import SDK, campi del manifest, API di configurazione, hook e comportamento di
registrazione runtime.

<Warning>
  Il livello di compatibilità retroattiva verrà rimosso in una futura major release.
  I plugin che importano ancora da queste superfici si romperanno quando accadrà.
  Le registrazioni legacy delle factory di estensioni incorporate non vengono già più caricate.
</Warning>

## Perché è cambiato

Il vecchio approccio causava problemi:

- **Avvio lento** - importare un helper caricava decine di moduli non correlati
- **Dipendenze circolari** - le riesportazioni ampie rendevano facile creare cicli di import
- **Superficie API poco chiara** - non c'era modo di capire quali export fossero stabili rispetto a quelli interni

Il moderno SDK dei plugin risolve questo problema: ogni percorso di import (`openclaw/plugin-sdk/\<subpath\>`)
è un modulo piccolo e autonomo, con uno scopo chiaro e un contratto documentato.

Anche i seam legacy di convenienza per provider dei canali bundled sono stati rimossi.
I seam helper con brand del canale erano scorciatoie private del monorepo, non contratti
stabili per i plugin. Usa invece sottopercorsi SDK generici e mirati. All'interno del workspace
dei plugin bundled, mantieni gli helper di proprietà del provider nel `api.ts` o
`runtime-api.ts` di quel plugin.

Esempi attuali di provider bundled:

- Anthropic mantiene gli helper di stream specifici di Claude nel proprio seam `api.ts` /
  `contract-api.ts`
- OpenAI mantiene builder dei provider, helper per modelli predefiniti e builder dei provider
  realtime nel proprio `api.ts`
- OpenRouter mantiene builder del provider e helper di onboarding/configurazione nel proprio
  `api.ts`

## Piano di migrazione per Talk e voce in tempo reale

Il codice di voce in tempo reale, telefonia, riunioni e Talk del browser si sta spostando dalla
contabilità dei turni locale alla superficie a un controller di sessione Talk condiviso esportato da
`openclaw/plugin-sdk/realtime-voice`. Il nuovo controller possiede l'envelope comune degli eventi Talk,
lo stato del turno attivo, lo stato di acquisizione, lo stato dell'audio di output, la cronologia recente
degli eventi e il rifiuto dei turni obsoleti. I plugin provider dovrebbero continuare a possedere
le sessioni realtime specifiche del vendor; i plugin di superficie dovrebbero continuare a possedere
acquisizione, riproduzione, telefonia e particolarità delle riunioni.

Questa migrazione Talk è intenzionalmente una rottura pulita:

1. Mantieni il controller condiviso e le primitive runtime in
   `plugin-sdk/realtime-voice`.
2. Sposta le superfici bundled sul controller condiviso: relay del browser,
   handoff di managed-room, realtime di chiamata vocale, STT in streaming di chiamata vocale, realtime di Google
   Meet e push-to-talk nativo.
3. Sostituisci le vecchie famiglie RPC Talk con le API finali `talk.session.*` e
   `talk.client.*`.
4. Pubblicizza un solo canale di eventi Talk live in Gateway
   `hello-ok.features.events`: `talk.event`.
5. Elimina il vecchio endpoint HTTP realtime e qualsiasi percorso di override
   delle istruzioni a tempo di richiesta.

Il nuovo codice non dovrebbe chiamare direttamente `createTalkEventSequencer(...)`, a meno che non stia
implementando un adapter di basso livello o una fixture di test. Preferisci il controller condiviso
così gli eventi con scope di turno non possono essere emessi senza un id turno, le chiamate `turnEnd` /
`turnCancel` obsolete non possono cancellare un turno attivo più recente, e gli eventi del ciclo di vita
dell'audio di output restano coerenti tra telefonia, riunioni, relay del browser, handoff
di managed-room e client Talk nativi.

La forma dell'API pubblica target è:

```typescript
// Gateway-owned Talk session API.
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "working" },
  options: { willContinue: true },
});
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "already_delivered" },
  options: { suppressResponse: true },
});
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// Client-owned provider session API.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

Le sessioni WebRTC/provider-websocket di proprietà del browser usano `talk.client.create`,
perché il browser possiede la negoziazione del provider e il trasporto multimediale, mentre il
Gateway possiede credenziali, istruzioni e policy degli strumenti. `talk.session.*` è la
superficie comune gestita dal Gateway per realtime gateway-relay, trascrizione gateway-relay
e sessioni STT/TTS native managed-room.

Le configurazioni legacy che collocavano i selettori realtime accanto a `talk.provider` /
`talk.providers` dovrebbero essere riparate con `openclaw doctor --fix`; a runtime Talk
non reinterpreta la configurazione dei provider speech/TTS come configurazione dei provider realtime.

Le combinazioni supportate di `talk.session.create` sono intenzionalmente ridotte:

| Modalità        | Trasporto       | Brain           | Proprietario       | Note                                                                                                               |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio provider full-duplex collegato tramite il Gateway; le chiamate agli strumenti vengono instradate tramite lo strumento agent-consult. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Solo STT in streaming; i chiamanti inviano audio in input e ricevono eventi di trascrizione.                       |
| `stt-tts`       | `managed-room`  | `agent-consult` | Stanza nativa/client | Stanze in stile push-to-talk e walkie-talkie in cui il client possiede acquisizione/riproduzione e il Gateway possiede lo stato del turno. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Stanza nativa/client | Modalità stanza solo admin per superfici first-party attendibili che eseguono direttamente azioni degli strumenti Gateway. |

Mappa dei metodi rimossi:

| Vecchio                          | Nuovo                                                    |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` o `talk.session.cancelTurn`  |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

Anche il vocabolario di controllo unificato è deliberatamente ristretto:

  | Metodo                          | Si applica a                                            | Contratto                                                                                                                                                                               |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Aggiungi un frammento audio PCM in base64 alla sessione del provider posseduta dalla stessa connessione Gateway.                                                                         |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Avvia un turno utente managed-room.                                                                                                                                                      |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Termina il turno attivo dopo la validazione del turno obsoleto.                                                                                                                         |
  | `talk.session.cancelTurn`       | tutte le sessioni possedute dal Gateway                 | Annulla il lavoro attivo di acquisizione/provider/agente/TTS per un turno.                                                                                                              |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Interrompi l'output audio dell'assistente senza terminare necessariamente il turno utente.                                                                                              |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Completa una chiamata a strumento del provider emessa dal relay; passa `options.willContinue` per l'output intermedio o `options.suppressResponse` per soddisfare la chiamata senza un'altra risposta dell'assistente. |
  | `talk.session.steer`            | sessioni Talk supportate da agente                      | Invia un controllo vocale `status`, `steer`, `cancel` o `followup` all'esecuzione incorporata attiva risolta dalla sessione Talk.                                                       |
  | `talk.session.close`            | tutte le sessioni unificate                             | Interrompi le sessioni relay o revoca lo stato managed-room, quindi dimentica l'id sessione unificato.                                                                                  |

  Non introdurre casi speciali per provider o piattaforma nel core per farlo funzionare.
  Il core possiede la semantica delle sessioni Talk. I Plugin dei provider possiedono la configurazione delle sessioni dei fornitori.
  Le chiamate vocali e Google Meet possiedono gli adattatori di telefonia/riunione. Le app browser e native
  possiedono la UX di acquisizione/riproduzione del dispositivo.

  ## Criterio di compatibilità

  Per i Plugin esterni, il lavoro di compatibilità segue questo ordine:

  1. aggiungere il nuovo contratto
  2. mantenere il vecchio comportamento collegato tramite un adattatore di compatibilità
  3. emettere una diagnostica o un avviso che nomini il vecchio percorso e la sostituzione
  4. coprire entrambi i percorsi nei test
  5. documentare la deprecazione e il percorso di migrazione
  6. rimuovere solo dopo la finestra di migrazione annunciata, di solito in una release principale

  I maintainer possono controllare la coda di migrazione corrente con
  `pnpm plugins:boundary-report`. Usa `pnpm plugins:boundary-report:summary` per
  conteggi compatti, `--owner <id>` per un Plugin o proprietario di compatibilità, e
  `pnpm plugins:boundary-report:ci` quando un gate CI deve fallire su record di
  compatibilità scaduti, import SDK riservati tra proprietari o sottopercorsi SDK
  riservati inutilizzati. Il report raggruppa i record di
  compatibilità deprecati per data di rimozione, conta i riferimenti locali in codice/docs,
  evidenzia gli import SDK riservati tra proprietari e riepiloga il bridge SDK privato
  memory-host, così la pulizia della compatibilità resta esplicita invece di
  dipendere da ricerche ad hoc. I sottopercorsi SDK riservati devono avere un uso del proprietario tracciato;
  gli export helper riservati inutilizzati devono essere rimossi dall'SDK pubblico.

  Se un campo manifest è ancora accettato, gli autori di Plugin possono continuare a usarlo finché
  la documentazione e le diagnostiche non indicano diversamente. Il nuovo codice deve preferire la sostituzione
  documentata, ma i Plugin esistenti non devono rompersi durante le normali release minori.

  ## Come migrare

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    I Plugin inclusi devono smettere di chiamare direttamente
    `api.runtime.config.loadConfig()` e
    `api.runtime.config.writeConfigFile(...)`. Preferisci la configurazione che era
    già stata passata nel percorso di chiamata attivo. Gli handler longevi che necessitano dello
    snapshot corrente del processo possono usare `api.runtime.config.current()`. Gli strumenti agente
    longevi devono usare `ctx.getRuntimeConfig()` del contesto dello strumento dentro
    `execute`, così uno strumento creato prima di una scrittura di configurazione vede comunque la configurazione
    runtime aggiornata.

    Le scritture di configurazione devono passare dagli helper transazionali e scegliere un
    criterio post-scrittura:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Usa `afterWrite: { mode: "restart", reason: "..." }` quando il chiamante sa
    che la modifica richiede un riavvio pulito del gateway, e
    `afterWrite: { mode: "none", reason: "..." }` solo quando il chiamante possiede il
    follow-up e vuole deliberatamente sopprimere il pianificatore di reload.
    I risultati della mutazione includono un riepilogo `followUp` tipizzato per test e logging;
    il gateway resta responsabile dell'applicazione o pianificazione del riavvio.
    `loadConfig` e `writeConfigFile` restano helper di compatibilità deprecati
    per i Plugin esterni durante la finestra di migrazione e avvisano una volta con
    il codice di compatibilità `runtime-config-load-write`. I Plugin inclusi e il codice
    runtime del repo sono protetti da guardrail scanner in
    `pnpm check:deprecated-api-usage` e
    `pnpm check:no-runtime-action-load-config`: il nuovo uso in produzione dei Plugin
    fallisce direttamente, le scritture dirette di configurazione falliscono, i metodi del server gateway devono usare
    lo snapshot runtime della richiesta, gli helper runtime per invio/azione/client canale
    devono ricevere la configurazione dal loro confine, e i moduli runtime longevi hanno
    zero chiamate ambientali `loadConfig()` consentite.

    Il nuovo codice Plugin deve anche evitare di importare il barrel di compatibilità ampio
    `openclaw/plugin-sdk/config-runtime`. Usa il sottopercorso SDK ristretto
    corrispondente al compito:

    | Necessità | Import |
    | --- | --- |
    | Tipi di configurazione come `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Asserzioni su configurazione già caricata e lookup della configurazione plugin-entry | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Letture dello snapshot runtime corrente | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Scritture di configurazione | `openclaw/plugin-sdk/config-mutation` |
    | Helper dello store sessione | `openclaw/plugin-sdk/session-store-runtime` |
    | Configurazione tabella Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helper runtime per criteri di gruppo | `openclaw/plugin-sdk/runtime-group-policy` |
    | Risoluzione input segreti | `openclaw/plugin-sdk/secret-input-runtime` |
    | Override modello/sessione | `openclaw/plugin-sdk/model-session-runtime` |

    I Plugin inclusi e i relativi test sono protetti dallo scanner contro il barrel ampio,
    così import e mock restano locali al comportamento di cui hanno bisogno. Il barrel ampio
    esiste ancora per la compatibilità esterna, ma il nuovo codice non deve
    dipendere da esso.

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    I Plugin inclusi devono sostituire gli handler dei risultati strumenti solo embedded-runner
    `api.registerEmbeddedExtensionFactory(...)` con middleware indipendente dal runtime.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Aggiorna contemporaneamente il manifest del Plugin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Anche i Plugin installati possono registrare middleware per risultati strumenti quando sono
    esplicitamente abilitati e dichiarano ogni runtime mirato in
    `contracts.agentToolResultMiddleware`. Le registrazioni di middleware installato
    non dichiarate vengono rifiutate.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    I Plugin canale con capacità di approvazione ora espongono il comportamento di approvazione nativo tramite
    `approvalCapability.nativeRuntime` più il registro condiviso runtime-context.

    Modifiche principali:

    - Sostituisci `approvalCapability.handler.loadRuntime(...)` con
      `approvalCapability.nativeRuntime`
    - Sposta auth/consegna specifici delle approvazioni dal cablaggio legacy `plugin.auth` /
      `plugin.approvals` a `approvalCapability`
    - `ChannelPlugin.approvals` è stato rimosso dal contratto pubblico channel-plugin;
      sposta i campi delivery/native/render su `approvalCapability`
    - `plugin.auth` resta solo per i flussi di login/logout del canale; gli hook auth
      delle approvazioni lì non vengono più letti dal core
    - Registra oggetti runtime posseduti dal canale come client, token o app Bolt
      tramite `openclaw/plugin-sdk/channel-runtime-context`
    - Non inviare avvisi di reinstradamento posseduti dal Plugin dagli handler di approvazione nativi;
      il core ora possiede gli avvisi routed-elsewhere dai risultati di consegna effettivi
    - Quando passi `channelRuntime` in `createChannelManager(...)`, fornisci una
      superficie `createPluginRuntime().channel` reale. Gli stub parziali vengono rifiutati.

    Vedi `/plugins/sdk-channel-plugins` per il layout corrente delle capability di approvazione.

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    Se il tuo Plugin usa `openclaw/plugin-sdk/windows-spawn`, i wrapper Windows
    `.cmd`/`.bat` non risolti ora falliscono in modo chiuso, a meno che tu non passi esplicitamente
    `allowShellFallback: true`.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    Se il tuo chiamante non si affida intenzionalmente al fallback shell, non impostare
    `allowShellFallback` e gestisci invece l'errore generato.

  </Step>

  <Step title="Find deprecated imports">
    Cerca nel tuo Plugin import da una delle superfici deprecate:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
    Ogni export della vecchia superficie mappa a uno specifico percorso di import moderno:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Per gli helper lato host, usa il runtime Plugin iniettato invece di importare
    direttamente:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Lo stesso schema si applica agli altri helper bridge legacy:

    | Vecchio import | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper dell'archivio sessioni | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` esiste ancora per la compatibilità
    esterna, ma il nuovo codice dovrebbe importare la superficie di helper mirata
    di cui ha effettivamente bisogno:

    | Necessità | Import |
    | --- | --- |
    | Helper della coda degli eventi di sistema | `openclaw/plugin-sdk/system-event-runtime` |
    | Helper di wake, evento e visibilità di Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Svuotamento della coda di consegna in sospeso | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetria dell'attività del canale | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cache di deduplicazione in memoria | `openclaw/plugin-sdk/dedupe-runtime` |
    | Helper sicuri per percorsi di file/media locali | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch consapevole del dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Helper per proxy e fetch protetto | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipi di policy del dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipi di richiesta/risoluzione di approvazione | `openclaw/plugin-sdk/approval-runtime` |
    | Helper per payload di risposta di approvazione e comandi | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helper di formattazione degli errori | `openclaw/plugin-sdk/error-runtime` |
    | Attese di prontezza del trasporto | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helper per token sicuri | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concorrenza limitata delle attività asincrone | `openclaw/plugin-sdk/concurrency-runtime` |
    | Coercizione numerica | `openclaw/plugin-sdk/number-runtime` |
    | Lock asincrono locale al processo | `openclaw/plugin-sdk/async-lock-runtime` |
    | Lock dei file | `openclaw/plugin-sdk/file-lock` |

    I Plugin in bundle sono protetti dallo scanner contro `infra-runtime`, quindi il codice del repo
    non può regredire al barrel ampio.

  </Step>

  <Step title="Migrate channel route helpers">
    Il nuovo codice delle route di canale dovrebbe usare `openclaw/plugin-sdk/channel-route`.
    I vecchi nomi route-key e comparable-target restano come alias di compatibilità
    durante la finestra di migrazione, ma i nuovi Plugin dovrebbero usare i nomi delle route
    che descrivono direttamente il comportamento:

    | Vecchio helper | Helper moderno |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Gli helper route moderni normalizzano `{ channel, to, accountId, threadId }`
    in modo coerente tra approvazioni native, soppressione delle risposte, deduplicazione in ingresso,
    consegna Cron e routing delle sessioni.

    Non aggiungere nuovi usi di `ChannelMessagingAdapter.parseExplicitTarget` o
    degli helper loaded-route basati su parser (`parseExplicitTargetForLoadedChannel`
    o `resolveRouteTargetForLoadedChannel`) né di
    `resolveChannelRouteTargetWithParser(...)` da `plugin-sdk/channel-route`.
    Questi hook sono deprecati e restano solo per i Plugin più vecchi durante la
    finestra di migrazione. I nuovi Plugin di canale dovrebbero usare
    `messaging.targetResolver.resolveTarget(...)` per la normalizzazione dell'id target
    e il fallback in caso di directory-miss, `messaging.inferTargetChatType(...)` quando il core
    ha bisogno anticipatamente del tipo di peer, e `messaging.resolveOutboundSessionRoute(...)`
    per la sessione nativa del provider e l'identità del thread.

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Riferimento dei percorsi di importazione

  <Accordion title="Common import path table">
  | Percorso di importazione | Scopo | Esportazioni principali |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Funzione di supporto canonica per la voce del plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Riesportazione ombrello legacy per definizioni/costruttori di voci di canale | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Esportazione dello schema di configurazione radice | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Funzione di supporto per voce a provider singolo | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definizioni e costruttori mirati per voci di canale | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Funzioni di supporto condivise per la procedura guidata di configurazione | Traduttore di configurazione, prompt allowlist, costruttori dello stato di configurazione |
  | `plugin-sdk/setup-runtime` | Funzioni di supporto runtime per il momento della configurazione | `createSetupTranslator`, adattatori di patch di configurazione sicuri per l'importazione, funzioni di supporto per note di ricerca, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy di configurazione delegati |
  | `plugin-sdk/setup-adapter-runtime` | Alias deprecato dell'adattatore di configurazione | Usa `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Funzioni di supporto per strumenti di configurazione | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Funzioni di supporto multi-account | Funzioni di supporto per elenco account/configurazione/gate delle azioni |
  | `plugin-sdk/account-id` | Funzioni di supporto per ID account | `DEFAULT_ACCOUNT_ID`, normalizzazione degli ID account |
  | `plugin-sdk/account-resolution` | Funzioni di supporto per la ricerca account | Funzioni di supporto per ricerca account + fallback predefinito |
  | `plugin-sdk/account-helpers` | Funzioni di supporto ristrette per account | Funzioni di supporto per elenco account/azioni account |
  | `plugin-sdk/channel-setup` | Adattatori della procedura guidata di configurazione | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive per abbinamento DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Cablaggio di prefisso di risposta, digitazione e consegna della sorgente | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Factory di adattatori di configurazione e funzioni di supporto per accesso DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Costruttori di schemi di configurazione | Solo primitive condivise dello schema di configurazione del canale e costruttore generico |
  | `plugin-sdk/bundled-channel-config-schema` | Schemi di configurazione inclusi | Solo plugin inclusi mantenuti da OpenClaw; i nuovi plugin devono definire schemi locali al plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Schemi di configurazione inclusi deprecati | Solo alias di compatibilità; usa `plugin-sdk/bundled-channel-config-schema` per i plugin inclusi mantenuti |
  | `plugin-sdk/telegram-command-config` | Funzioni di supporto per configurazione dei comandi Telegram | Normalizzazione del nome comando, rifinitura della descrizione, validazione di duplicati/conflitti |
  | `plugin-sdk/channel-policy` | Risoluzione policy Gruppo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Facciata di compatibilità deprecata | Usa `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Funzioni di supporto per buste in ingresso | Funzioni di supporto condivise per rotta + costruttore di buste |
  | `plugin-sdk/channel-inbound` | Funzioni di supporto per ricezione in ingresso | Creazione del contesto, formattazione, radici, esecutori, dispatch delle risposte preparate e predicati di dispatch |
  | `plugin-sdk/messaging-targets` | Percorso di importazione deprecato per parsing del target | Usa `plugin-sdk/channel-targets` per funzioni di supporto generiche di parsing del target, `plugin-sdk/channel-route` per il confronto delle rotte e `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` di proprietà del plugin per la risoluzione dei target specifica del provider |
  | `plugin-sdk/outbound-media` | Funzioni di supporto per media in uscita | Caricamento condiviso dei media in uscita |
  | `plugin-sdk/outbound-send-deps` | Facciata di compatibilità deprecata | Usa `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Funzioni di supporto per ciclo di vita dei messaggi in uscita | Adattatori di messaggi, ricevute, funzioni di supporto per invio durevole, funzioni di supporto per anteprima/streaming live, opzioni di risposta, funzioni di supporto per ciclo di vita, identità in uscita e pianificazione del payload |
  | `plugin-sdk/channel-streaming` | Facciata di compatibilità deprecata | Usa `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Facciata di compatibilità deprecata | Usa `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Funzioni di supporto per associazione dei thread | Ciclo di vita dell'associazione dei thread e funzioni di supporto per adattatori |
  | `plugin-sdk/agent-media-payload` | Funzioni di supporto legacy per payload media | Costruttore di payload media dell'agente per layout di campi legacy |
  | `plugin-sdk/channel-runtime` | Livello di compatibilità deprecato | Solo utilità runtime dei canali legacy |
  | `plugin-sdk/channel-send-result` | Tipi di risultato di invio | Tipi di risultato di risposta |
  | `plugin-sdk/runtime-store` | Archiviazione persistente del plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Funzioni di supporto runtime ampie | Funzioni di supporto per runtime/logging/backup/installazione plugin |
  | `plugin-sdk/runtime-env` | Funzioni di supporto ristrette per ambiente runtime | Funzioni di supporto per logger/ambiente runtime, timeout, nuovo tentativo e backoff |
  | `plugin-sdk/plugin-runtime` | Funzioni di supporto runtime condivise per plugin | Funzioni di supporto per comandi/hook/http/interattività dei plugin |
  | `plugin-sdk/hook-runtime` | Funzioni di supporto per pipeline di hook | Funzioni di supporto condivise per pipeline di hook Webhook/interni |
  | `plugin-sdk/lazy-runtime` | Funzioni di supporto runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Funzioni di supporto per processi | Funzioni di supporto condivise per exec |
  | `plugin-sdk/cli-runtime` | Funzioni di supporto runtime CLI | Formattazione dei comandi, attese, funzioni di supporto per versione |
  | `plugin-sdk/gateway-runtime` | Funzioni di supporto Gateway | Client Gateway, funzione di supporto per avvio pronto al ciclo eventi e funzioni di supporto per patch dello stato del canale |
  | `plugin-sdk/config-runtime` | Livello di compatibilità della configurazione deprecato | Preferisci `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` e `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Funzioni di supporto per comandi Telegram | Funzioni di supporto per validazione dei comandi Telegram stabili in fallback quando la superficie del contratto Telegram incluso non è disponibile |
  | `plugin-sdk/approval-runtime` | Funzioni di supporto per prompt di approvazione | Payload di approvazione exec/plugin, funzioni di supporto per capacità/profilo di approvazione, funzioni di supporto native per routing/runtime delle approvazioni e formattazione del percorso di visualizzazione strutturata dell'approvazione |
  | `plugin-sdk/approval-auth-runtime` | Funzioni di supporto per autenticazione delle approvazioni | Risoluzione dell'approvatore, autorizzazione delle azioni nella stessa chat |
  | `plugin-sdk/approval-client-runtime` | Funzioni di supporto client per approvazioni | Funzioni di supporto native per profilo/filtro di approvazione exec |
  | `plugin-sdk/approval-delivery-runtime` | Funzioni di supporto per consegna delle approvazioni | Adattatori nativi per capacità/consegna delle approvazioni |
  | `plugin-sdk/approval-gateway-runtime` | Funzioni di supporto Gateway per approvazioni | Funzione di supporto condivisa per risoluzione Gateway delle approvazioni |
  | `plugin-sdk/approval-handler-adapter-runtime` | Funzioni di supporto per adattatori di approvazione | Funzioni di supporto leggere per caricamento di adattatori nativi di approvazione per entrypoint di canale hot |
  | `plugin-sdk/approval-handler-runtime` | Funzioni di supporto per gestori di approvazione | Funzioni di supporto runtime più ampie per gestori di approvazione; preferisci i punti di integrazione adattatore/Gateway più ristretti quando sono sufficienti |
  | `plugin-sdk/approval-native-runtime` | Funzioni di supporto per target di approvazione | Funzioni di supporto native per associazione target/account di approvazione |
  | `plugin-sdk/approval-reply-runtime` | Funzioni di supporto per risposte di approvazione | Funzioni di supporto per payload di risposta di approvazione exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Funzioni di supporto per contesto runtime dei canali | Funzioni di supporto generiche register/get/watch per contesto runtime dei canali |
  | `plugin-sdk/security-runtime` | Funzioni di supporto per sicurezza | Funzioni di supporto condivise per attendibilità, gating DM, file/percorsi limitati alla radice, contenuto esterno e raccolta di segreti |
  | `plugin-sdk/ssrf-policy` | Funzioni di supporto per policy SSRF | Funzioni di supporto per allowlist degli host e policy di rete privata |
  | `plugin-sdk/ssrf-runtime` | Funzioni di supporto runtime SSRF | Dispatcher fissato, fetch protetto, funzioni di supporto per policy SSRF |
  | `plugin-sdk/system-event-runtime` | Funzioni di supporto per eventi di sistema | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Funzioni di supporto Heartbeat | Funzioni di supporto per risveglio, evento e visibilità Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Funzioni di supporto per coda di consegna | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Funzioni di supporto per attività dei canali | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Funzioni di supporto per deduplicazione | Cache di deduplicazione in memoria |
  | `plugin-sdk/file-access-runtime` | Funzioni di supporto per accesso ai file | Funzioni di supporto sicure per percorsi di file/media locali |
  | `plugin-sdk/transport-ready-runtime` | Funzioni di supporto per prontezza del trasporto | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Funzioni di supporto per policy di approvazione exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Funzioni di supporto per cache limitata | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Funzioni di supporto per gating diagnostico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Funzioni di supporto per formattazione errori | `formatUncaughtError`, `isApprovalNotFoundError`, funzioni di supporto per grafo degli errori |
  | `plugin-sdk/fetch-runtime` | Funzioni di supporto per fetch/proxy wrappati | `resolveFetch`, funzioni di supporto proxy, funzioni di supporto per opzioni EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Funzioni di supporto per normalizzazione host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Funzioni di supporto per nuovo tentativo | `RetryConfig`, `retryAsync`, runner di policy |
  | `plugin-sdk/allow-from` | Formattazione allowlist e mappatura input | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Funzioni di supporto per gating dei comandi e superficie dei comandi | `resolveControlCommandGate`, funzioni di supporto per autorizzazione del mittente, funzioni di supporto per registro comandi inclusa la formattazione dinamica del menu degli argomenti |
  | `plugin-sdk/command-status` | Renderer di stato/aiuto dei comandi | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing dell'input dei segreti | Funzioni di supporto per input dei segreti |
  | `plugin-sdk/webhook-ingress` | Funzioni di supporto per richieste Webhook | Utilità target Webhook |
  | `plugin-sdk/webhook-request-guards` | Funzioni di supporto per guardia del corpo Webhook | Funzioni di supporto per lettura/limite del corpo della richiesta |
  | `plugin-sdk/reply-runtime` | Runtime di risposta condiviso | Dispatch in ingresso, Heartbeat, pianificatore di risposte, suddivisione in blocchi |
  | `plugin-sdk/reply-dispatch-runtime` | Funzioni di supporto ristrette per dispatch delle risposte | Finalizzazione, dispatch del provider e funzioni di supporto per etichette conversazione |
  | `plugin-sdk/reply-history` | Funzioni di supporto per cronologia delle risposte | `createChannelHistoryWindow`; esportazioni di compatibilità deprecate per funzioni di supporto mappa come `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Pianificazione dei riferimenti di risposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Funzioni di supporto per blocchi di risposta | Funzioni di supporto per suddivisione in blocchi di testo/markdown |
  | `plugin-sdk/session-store-runtime` | Funzioni di supporto per archivio sessioni | Funzioni di supporto per percorso archivio + aggiornato-il |
  | `plugin-sdk/state-paths` | Funzioni di supporto per percorsi di stato | Funzioni di supporto per directory di stato e OAuth |
  | `plugin-sdk/routing` | Funzioni di supporto per routing/chiave di sessione | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, funzioni di supporto per la normalizzazione della chiave di sessione |
  | `plugin-sdk/status-helpers` | Funzioni di supporto per lo stato del canale | Costruttori di riepiloghi dello stato di canali/account, valori predefiniti dello stato runtime, funzioni di supporto per i metadati dei problemi |
  | `plugin-sdk/target-resolver-runtime` | Funzioni di supporto per il risolutore di destinazioni | Funzioni di supporto condivise per il risolutore di destinazioni |
  | `plugin-sdk/string-normalization-runtime` | Funzioni di supporto per la normalizzazione delle stringhe | Funzioni di supporto per la normalizzazione di slug/stringhe |
  | `plugin-sdk/request-url` | Funzioni di supporto per URL di richiesta | Estrai URL stringa da input simili a richieste |
  | `plugin-sdk/run-command` | Funzioni di supporto per comandi temporizzati | Esecutore di comandi temporizzati con stdout/stderr normalizzati |
  | `plugin-sdk/param-readers` | Lettori di parametri | Lettori comuni di parametri per strumenti/CLI |
  | `plugin-sdk/tool-payload` | Estrazione del payload dello strumento | Estrai payload normalizzati dagli oggetti risultato dello strumento |
  | `plugin-sdk/tool-send` | Estrazione dell'invio dello strumento | Estrai i campi canonici della destinazione di invio dagli argomenti dello strumento |
  | `plugin-sdk/temp-path` | Funzioni di supporto per percorsi temporanei | Funzioni di supporto condivise per i percorsi di download temporanei |
  | `plugin-sdk/logging-core` | Funzioni di supporto per il logging | Logger di sottosistema e funzioni di supporto per l'oscuramento |
  | `plugin-sdk/markdown-table-runtime` | Funzioni di supporto per tabelle Markdown | Funzioni di supporto per la modalita tabella Markdown |
  | `plugin-sdk/reply-payload` | Tipi di risposta ai messaggi | Tipi di payload di risposta |
  | `plugin-sdk/provider-setup` | Funzioni di supporto curate per configurare provider locali/self-hosted | Funzioni di supporto per individuazione/configurazione di provider self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Funzioni di supporto mirate per configurare provider self-hosted compatibili con OpenAI | Stesse funzioni di supporto per individuazione/configurazione di provider self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Funzioni di supporto per autenticazione runtime del provider | Funzioni di supporto per la risoluzione runtime delle chiavi API |
  | `plugin-sdk/provider-auth-api-key` | Funzioni di supporto per configurare chiavi API del provider | Funzioni di supporto per onboarding/scrittura profilo con chiave API |
  | `plugin-sdk/provider-auth-result` | Funzioni di supporto per risultati di autenticazione del provider | Costruttore standard di risultati di autenticazione OAuth |
  | `plugin-sdk/provider-selection-runtime` | Funzioni di supporto per la selezione del provider | Selezione del provider configurato o automatica e unione della configurazione grezza del provider |
  | `plugin-sdk/provider-env-vars` | Funzioni di supporto per variabili di ambiente del provider | Funzioni di supporto per la ricerca di variabili di ambiente di autenticazione del provider |
  | `plugin-sdk/provider-model-shared` | Funzioni di supporto condivise per modelli/replay dei provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, costruttori condivisi di policy di replay, funzioni di supporto per endpoint del provider e funzioni di supporto per la normalizzazione degli ID modello |
  | `plugin-sdk/provider-catalog-shared` | Funzioni di supporto condivise per cataloghi dei provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch di onboarding del provider | Funzioni di supporto per la configurazione di onboarding |
  | `plugin-sdk/provider-http` | Funzioni di supporto HTTP del provider | Funzioni di supporto generiche per funzionalita HTTP/endpoint del provider, incluse funzioni di supporto per moduli multipart di trascrizione audio |
  | `plugin-sdk/provider-web-fetch` | Funzioni di supporto web-fetch del provider | Funzioni di supporto per registrazione/cache del provider web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Funzioni di supporto per configurazione web-search del provider | Funzioni di supporto ristrette per configurazione/credenziali web-search per provider che non richiedono cablaggio di abilitazione Plugin |
  | `plugin-sdk/provider-web-search-contract` | Funzioni di supporto per contratto web-search del provider | Funzioni di supporto ristrette per il contratto di configurazione/credenziali web-search, come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con ambito |
  | `plugin-sdk/provider-web-search` | Funzioni di supporto web-search del provider | Funzioni di supporto per registrazione/cache/runtime del provider web-search |
  | `plugin-sdk/provider-tools` | Funzioni di supporto per compatibilita strumenti/schema del provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` e pulizia schema + diagnostica DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Funzioni di supporto per uso del provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e altre funzioni di supporto per l'uso dei provider |
  | `plugin-sdk/provider-stream` | Funzioni di supporto per wrapper di stream del provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di wrapper di stream e funzioni di supporto condivise per wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Funzioni di supporto per il trasporto del provider | Funzioni di supporto per il trasporto nativo del provider, come fetch protetto, estrazione del testo dai risultati degli strumenti, trasformazioni dei messaggi di trasporto e stream scrivibili di eventi di trasporto |
  | `plugin-sdk/keyed-async-queue` | Coda asincrona ordinata | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Funzioni di supporto condivise per media | Funzioni di supporto per recupero/trasformazione/archiviazione dei media, rilevamento delle dimensioni video basato su ffprobe e costruttori di payload media |
  | `plugin-sdk/media-generation-runtime` | Funzioni di supporto condivise per generazione media | Funzioni di supporto condivise per failover, selezione dei candidati e messaggistica per modelli mancanti nella generazione di immagini/video/musica |
  | `plugin-sdk/media-understanding` | Funzioni di supporto per comprensione dei media | Tipi di provider per comprensione dei media piu esportazioni di funzioni di supporto per immagini/audio rivolte ai provider |
  | `plugin-sdk/text-runtime` | Esportazione ampia obsoleta per compatibilita testo | Usa `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` e `logging-core` |
  | `plugin-sdk/text-chunking` | Funzioni di supporto per segmentazione del testo | Funzione di supporto per segmentazione del testo in uscita |
  | `plugin-sdk/speech` | Funzioni di supporto per voce | Tipi di provider voce piu funzioni di supporto rivolte ai provider per direttive, registro e validazione, e costruttore TTS compatibile con OpenAI |
  | `plugin-sdk/speech-core` | Nucleo voce condiviso | Tipi di provider voce, registro, direttive, normalizzazione |
  | `plugin-sdk/realtime-transcription` | Funzioni di supporto per trascrizione in tempo reale | Tipi di provider, funzioni di supporto per registro e funzione di supporto condivisa per sessioni WebSocket |
  | `plugin-sdk/realtime-voice` | Funzioni di supporto per voce in tempo reale | Tipi di provider, funzioni di supporto per registro/risoluzione, funzioni di supporto per sessioni bridge, code condivise di talk-back dell'agente, controllo vocale delle esecuzioni attive, salute di trascrizione/eventi, soppressione dell'eco, corrispondenza delle domande di consultazione, coordinamento delle consultazioni forzate, tracciamento del contesto del turno, tracciamento dell'attivita di output e funzioni di supporto rapide per consultazione del contesto |
  | `plugin-sdk/image-generation` | Funzioni di supporto per generazione di immagini | Tipi di provider per generazione di immagini piu funzioni di supporto per asset immagine/URL dati e costruttore di provider di immagini compatibile con OpenAI |
  | `plugin-sdk/image-generation-core` | Nucleo condiviso per generazione di immagini | Tipi di generazione di immagini, failover, autenticazione e funzioni di supporto per registro |
  | `plugin-sdk/music-generation` | Funzioni di supporto per generazione di musica | Tipi per provider/richiesta/risultato di generazione di musica |
  | `plugin-sdk/music-generation-core` | Nucleo condiviso per generazione di musica | Tipi di generazione di musica, funzioni di supporto per failover, ricerca provider e parsing dei riferimenti modello |
  | `plugin-sdk/video-generation` | Funzioni di supporto per generazione di video | Tipi per provider/richiesta/risultato di generazione di video |
  | `plugin-sdk/video-generation-core` | Nucleo condiviso per generazione di video | Tipi di generazione di video, funzioni di supporto per failover, ricerca provider e parsing dei riferimenti modello |
  | `plugin-sdk/interactive-runtime` | Funzioni di supporto per risposte interattive | Normalizzazione/riduzione del payload di risposta interattiva |
  | `plugin-sdk/channel-config-primitives` | Primitive di configurazione del canale | Primitive ristrette per schema di configurazione del canale |
  | `plugin-sdk/channel-config-writes` | Funzioni di supporto per scrittura configurazione canale | Funzioni di supporto per autorizzazione alla scrittura della configurazione del canale |
  | `plugin-sdk/channel-plugin-common` | Preludio condiviso del canale | Esportazioni condivise del preludio del Plugin di canale |
  | `plugin-sdk/channel-status` | Funzioni di supporto per lo stato del canale | Funzioni di supporto condivise per snapshot/riepilogo dello stato del canale |
  | `plugin-sdk/allowlist-config-edit` | Funzioni di supporto per configurazione allowlist | Funzioni di supporto per modifica/lettura della configurazione allowlist |
  | `plugin-sdk/group-access` | Funzioni di supporto per accesso di gruppo | Funzioni di supporto condivise per decisioni di accesso di gruppo |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Facciate di compatibilita obsolete | Usa `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Funzioni di supporto per protezioni Direct-DM | Funzioni di supporto ristrette per policy di protezione pre-crypto |
  | `plugin-sdk/extension-shared` | Funzioni di supporto condivise per estensioni | Primitive di supporto per canali passivi/stato e proxy ambientali |
  | `plugin-sdk/webhook-targets` | Funzioni di supporto per destinazioni Webhook | Registro delle destinazioni Webhook e funzioni di supporto per installazione delle route |
  | `plugin-sdk/webhook-path` | Alias obsoleto del percorso Webhook | Usa `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Funzioni di supporto condivise per media web | Funzioni di supporto per caricamento di media remoti/locali |
  | `plugin-sdk/zod` | Riesportazione obsoleta per compatibilita Zod | Importa `zod` da `zod` direttamente |
  | `plugin-sdk/memory-core` | Funzioni di supporto memory-core in bundle | Superficie di supporto per gestore memoria/configurazione/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Facciata runtime del motore memoria | Facciata runtime per indice/ricerca memoria |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registro degli embedding memoria | Funzioni di supporto leggere per registro di provider embedding memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motore foundation dell'host memoria | Esportazioni del motore foundation dell'host memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motore embedding dell'host memoria | Contratti di embedding memoria, accesso al registro, provider locale e funzioni di supporto generiche per batch/remoto; i provider remoti concreti vivono nei Plugin che li possiedono |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motore QMD dell'host memoria | Esportazioni del motore QMD dell'host memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motore di archiviazione dell'host memoria | Esportazioni del motore di archiviazione dell'host memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Funzioni di supporto multimodali dell'host memoria | Funzioni di supporto multimodali dell'host memoria |
  | `plugin-sdk/memory-core-host-query` | Funzioni di supporto per query dell'host memoria | Funzioni di supporto per query dell'host memoria |
  | `plugin-sdk/memory-core-host-secret` | Funzioni di supporto per segreti dell'host memoria | Funzioni di supporto per segreti dell'host memoria |
  | `plugin-sdk/memory-core-host-events` | Alias obsoleto degli eventi memoria | Usa `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Funzioni di supporto per stato dell'host memoria | Funzioni di supporto per stato dell'host memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI dell'host memoria | Funzioni di supporto per runtime CLI dell'host memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime core dell'host memoria | Funzioni di supporto per runtime core dell'host memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Funzioni di supporto per file/runtime dell'host memoria | Funzioni di supporto per file/runtime dell'host memoria |
  | `plugin-sdk/memory-host-core` | Alias del runtime core dell'host memoria | Alias vendor-neutral per funzioni di supporto runtime core dell'host memoria |
  | `plugin-sdk/memory-host-events` | Alias del journal eventi dell'host memoria | Alias vendor-neutral per funzioni di supporto del journal eventi dell'host memoria |
  | `plugin-sdk/memory-host-files` | Alias obsoleto per file/runtime memoria | Usa `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Funzioni di supporto Markdown gestito | Funzioni di supporto condivise per Markdown gestito per Plugin adiacenti alla memoria |
  | `plugin-sdk/memory-host-search` | Facciata di ricerca Active Memory | Facciata runtime lazy del gestore di ricerca Active Memory |
  | `plugin-sdk/memory-host-status` | Alias obsoleto dello stato dell'host memoria | Usa `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Utilita di test | Barrel di compatibilita obsoleto locale al repository; usa sottopercorsi di test mirati locali al repository come `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` e `plugin-sdk/test-fixtures` |
</Accordion>

Questa tabella è intenzionalmente il sottoinsieme comune di migrazione, non l'intera
superficie dell'SDK. L'inventario degli entrypoint del compilatore si trova in
`scripts/lib/plugin-sdk-entrypoints.json`; gli export dei pacchetti sono generati dal
sottoinsieme pubblico.

Le seam helper riservate dei plugin in bundle sono state ritirate dalla mappa degli
export pubblici dell'SDK, tranne le facade di compatibilità documentate esplicitamente,
come lo shim deprecato `plugin-sdk/discord` mantenuto per il pacchetto pubblicato
`@openclaw/discord@2026.3.13`. Gli helper specifici del proprietario vivono dentro il
pacchetto del plugin proprietario; il comportamento condiviso dell'host dovrebbe passare
attraverso contratti SDK generici come `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`
e `plugin-sdk/plugin-config-runtime`.

Usa l'import più ristretto che corrisponde al compito. Se non trovi un export,
controlla il sorgente in `src/plugin-sdk/` o chiedi ai maintainer quale contratto
generico dovrebbe possederlo.

## Deprecazioni attive

Deprecazioni più ristrette che si applicano all'intero SDK dei plugin, al contratto
provider, alla superficie runtime e al manifesto. Ognuna funziona ancora oggi, ma verrà
rimossa in una futura release major. La voce sotto ogni elemento mappa la vecchia API
alla sua sostituzione canonica.

<AccordionGroup>
  <Accordion title="builder di aiuto command-auth → command-status">
    **Vecchio (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nuovo (`openclaw/plugin-sdk/command-status`)**: stesse firme, stessi
    export - solo importati dal sottopercorso più ristretto. `command-auth`
    li riesporta come stub di compatibilità.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Helper di gating delle menzioni → resolveInboundMentionDecision">
    **Vecchio**: `resolveInboundMentionRequirement({ facts, policy })` e
    `shouldDropInboundForMention(...)` da
    `openclaw/plugin-sdk/channel-inbound` o
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nuovo**: `resolveInboundMentionDecision({ facts, policy })` - restituisce un
    singolo oggetto decisione invece di due chiamate separate.

    I plugin di canale downstream (Slack, Discord, Matrix, MS Teams) sono già
    passati al nuovo percorso.

  </Accordion>

  <Accordion title="Shim del runtime di canale e helper delle azioni di canale">
    `openclaw/plugin-sdk/channel-runtime` è uno shim di compatibilità per i plugin
    di canale più vecchi. Non importarlo dal nuovo codice; usa
    `openclaw/plugin-sdk/channel-runtime-context` per registrare gli oggetti
    runtime.

    Gli helper `channelActions*` in `openclaw/plugin-sdk/channel-actions` sono
    deprecati insieme agli export di canale "actions" grezzi. Esponi invece le
    capability tramite la superficie semantica `presentation` - i plugin di canale
    dichiarano cosa renderizzano (schede, pulsanti, selezioni) invece di quali nomi
    di azioni grezze accettano.

  </Accordion>

  <Accordion title="Helper tool() del provider di ricerca web → createTool() sul plugin">
    **Vecchio**: factory `tool()` da `openclaw/plugin-sdk/provider-web-search`.

    **Nuovo**: implementa `createTool(...)` direttamente sul plugin provider.
    OpenClaw non ha più bisogno dell'helper SDK per registrare il wrapper dello strumento.

  </Accordion>

  <Accordion title="Envelope di canale in testo semplice → BodyForAgent">
    **Vecchio**: `formatInboundEnvelope(...)` (e
    `ChannelMessageForAgent.channelEnvelope`) per costruire un envelope di prompt
    piatto in testo semplice dai messaggi di canale in ingresso.

    **Nuovo**: `BodyForAgent` più blocchi strutturati di contesto utente. I plugin
    di canale allegano metadati di routing (thread, topic, reply-to, reazioni) come
    campi tipizzati invece di concatenarli in una stringa di prompt. L'helper
    `formatAgentEnvelope(...)` è ancora supportato per envelope sintetizzati rivolti
    all'assistente, ma gli envelope in ingresso in testo semplice sono in fase di
    rimozione.

    Aree interessate: `inbound_claim`, `message_received` e qualsiasi plugin di
    canale personalizzato che post-elaborava il testo `channelEnvelope`.

  </Accordion>

  <Accordion title="hook deactivate → gateway_stop">
    **Vecchio**: `api.on("deactivate", handler)`.

    **Nuovo**: `api.on("gateway_stop", handler)`. L'evento e il contesto sono lo
    stesso contratto di pulizia allo spegnimento; cambia solo il nome dell'hook.

    ```typescript
    // Before
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // After
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` rimane collegato come alias di compatibilità deprecato fino a dopo
    il 2026-08-16.

  </Accordion>

  <Accordion title="hook subagent_spawning → binding del thread nel core">
    **Vecchio**: `api.on("subagent_spawning", handler)` che restituisce
    `threadBindingReady` o `deliveryOrigin`.

    **Nuovo**: lascia che il core prepari i binding dei subagenti `thread: true`
    tramite l'adapter di session-binding del canale. Usa
    `api.on("subagent_spawned", handler)` solo per l'osservazione post-avvio.

    ```typescript
    // Before
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // After
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`, `PluginHookSubagentSpawningEvent`,
    `PluginHookSubagentSpawningResult` e
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` rimangono solo come
    superfici di compatibilità deprecate mentre i plugin esterni migrano.

  </Accordion>

  <Accordion title="Tipi di discovery dei provider → tipi di catalogo dei provider">
    Quattro alias di tipo discovery sono ora wrapper sottili sopra i tipi
    dell'era del catalogo:

    | Vecchio alias             | Nuovo tipo                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    In più il bag statico legacy `ProviderCapabilities` - i plugin provider
    dovrebbero usare hook provider espliciti come `buildReplayPolicy`,
    `normalizeToolSchemas` e `wrapStreamFn` invece di un oggetto statico.

  </Accordion>

  <Accordion title="Hook della policy di thinking → resolveThinkingProfile">
    **Vecchio** (tre hook separati su `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` e
    `resolveDefaultThinkingLevel(ctx)`.

    **Nuovo**: un singolo `resolveThinkingProfile(ctx)` che restituisce un
    `ProviderThinkingProfile` con l'`id` canonico, `label` opzionale e lista dei
    livelli ordinata per rango. OpenClaw retrocede automaticamente i valori
    archiviati obsoleti in base al rango del profilo.

    Il contesto include `provider`, `modelId`, `reasoning` unito opzionale e fatti
    `compat` del modello uniti opzionali. I plugin provider possono usare questi
    fatti di catalogo per esporre un profilo specifico del modello solo quando il
    contratto della richiesta configurata lo supporta.

    Implementa un hook invece di tre. Gli hook legacy continuano a funzionare
    durante la finestra di deprecazione, ma non vengono composti con il risultato
    del profilo.

  </Accordion>

  <Accordion title="Provider di autenticazione esterni → contracts.externalAuthProviders">
    **Vecchio**: implementare hook di autenticazione esterna senza dichiarare il
    provider nel manifesto del plugin.

    **Nuovo**: dichiara `contracts.externalAuthProviders` nel manifesto del plugin
    **e** implementa `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Lookup delle variabili d'ambiente del provider → setup.providers[].envVars">
    Campo manifesto **vecchio**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nuovo**: rispecchia lo stesso lookup delle variabili d'ambiente in
    `setup.providers[].envVars` sul manifesto. Questo consolida i metadati
    d'ambiente di setup/stato in un unico punto ed evita di avviare il runtime del
    plugin solo per rispondere ai lookup delle variabili d'ambiente.

    `providerAuthEnvVars` rimane supportato tramite un adapter di compatibilità
    finché la finestra di deprecazione non si chiude.

  </Accordion>

  <Accordion title="Registrazione del plugin di memoria → registerMemoryCapability">
    **Vecchio**: tre chiamate separate -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nuovo**: una chiamata sull'API di stato della memoria -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Stessi slot, singola chiamata di registrazione. Gli helper additivi per prompt e
    corpus (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) non
    sono interessati.

  </Accordion>

  <Accordion title="API del provider di embedding della memoria">
    **Vecchio**: `api.registerMemoryEmbeddingProvider(...)` più
    `contracts.memoryEmbeddingProviders`.

    **Nuovo**: `api.registerEmbeddingProvider(...)` più
    `contracts.embeddingProviders`.

    Il contratto generico del provider di embedding è riutilizzabile fuori dalla
    memoria ed è il percorso supportato per i nuovi provider. L'API di registrazione
    specifica della memoria rimane collegata come compatibilità deprecata mentre i
    provider esistenti migrano. L'ispezione dei plugin segnala l'uso non in bundle
    come debito di compatibilità.

  </Accordion>

  <Accordion title="Tipi dei messaggi di sessione dei subagenti rinominati">
    Due alias di tipo legacy ancora esportati da `src/plugins/runtime/types.ts`:

    | Vecchio                       | Nuovo                           |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Il metodo runtime `readSession` è deprecato a favore di
    `getSessionMessages`. Stessa firma; il vecchio metodo inoltra la chiamata al
    nuovo.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Vecchio**: `runtime.tasks.flow` (singolare) restituiva un accessor live del
    task-flow.

    **Nuovo**: `runtime.tasks.managedFlows` conserva il runtime di mutazione
    TaskFlow gestito per i plugin che creano, aggiornano, annullano o eseguono task
    figli da un flusso. Usa `runtime.tasks.flows` quando il plugin ha bisogno solo
    di letture basate su DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Factory di estensioni incorporate → middleware dei risultati degli strumenti dell'agente">
    Trattato in "Come migrare → Migra le estensioni incorporate dei risultati degli
    strumenti a middleware" sopra. Incluso qui per completezza: il percorso rimosso
    solo per embedded runner `api.registerEmbeddedExtensionFactory(...)` è sostituito da
    `api.registerAgentToolResultMiddleware(...)` con una lista di runtime esplicita
    in `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` riesportato da `openclaw/plugin-sdk` è ora un alias di una
    riga per `OpenClawConfig`. Preferisci il nome canonico.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Le deprecazioni a livello di estensione (dentro i plugin di canale/provider in bundle
sotto `extensions/`) sono tracciate nei rispettivi barrel `api.ts` e `runtime-api.ts`.
Non incidono sui contratti dei plugin di terze parti e non sono elencate qui. Se
consumi direttamente il barrel locale di un plugin in bundle, leggi i commenti di
deprecazione in quel barrel prima di aggiornare.
</Note>

## Timeline di rimozione

| Quando                 | Cosa succede                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **Ora**                | Le superfici deprecate emettono avvisi di runtime                       |
| **Prossima release major** | Le superfici deprecate verranno rimosse; i Plugin che le usano ancora non funzioneranno |

Tutti i Plugin core sono già stati migrati. I Plugin esterni devono migrare
prima della prossima release major.

## Sopprimere temporaneamente gli avvisi

Imposta queste variabili d'ambiente mentre lavori alla migrazione:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Questa è una via di uscita temporanea, non una soluzione permanente.

## Correlati

- [Per iniziare](/it/plugins/building-plugins) - crea il tuo primo plugin
- [Panoramica dell'SDK](/it/plugins/sdk-overview) - riferimento completo agli import dei sottopercorsi
- [Plugin di canale](/it/plugins/sdk-channel-plugins) - creazione di Plugin di canale
- [Plugin provider](/it/plugins/sdk-provider-plugins) - creazione di Plugin provider
- [Internals dei Plugin](/it/plugins/architecture) - approfondimento sull'architettura
- [Manifest del Plugin](/it/plugins/manifest) - riferimento allo schema del manifest
