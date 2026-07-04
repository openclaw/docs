---
read_when:
    - Vedi l'avviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vedi l'avviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Hai usato api.registerEmbeddedExtensionFactory prima di OpenClaw 2026.4.25
    - Stai aggiornando un plugin all'architettura Plugin moderna
    - Mantieni un Plugin OpenClaw esterno
sidebarTitle: Migrate to SDK
summary: Migra dal livello legacy di retrocompatibilità al moderno SDK per Plugin
title: Migrazione del Plugin SDK
x-i18n:
    generated_at: "2026-07-04T10:45:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7873de40aea56f456781ecf8ac9a4705c958030f7c68f8a112ad3f0fce62f078
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw è passato da un ampio livello di compatibilità all’indietro a una moderna architettura a Plugin
con import mirati e documentati. Se il tuo Plugin è stato creato prima
della nuova architettura, questa guida ti aiuta a migrare.

## Cosa cambia

Il vecchio sistema di Plugin forniva due superfici molto aperte che permettevano ai Plugin di importare
qualsiasi cosa servisse da un singolo punto di ingresso:

- **`openclaw/plugin-sdk/compat`** - un singolo import che riesportava decine di
  helper. È stato introdotto per mantenere funzionanti i Plugin più vecchi basati su hook mentre veniva
  costruita la nuova architettura a Plugin.
- **`openclaw/plugin-sdk/infra-runtime`** - un ampio barrel di helper runtime che
  combinava eventi di sistema, stato Heartbeat, code di consegna, helper fetch/proxy,
  helper per file, tipi di approvazione e utilità non correlate.
- **`openclaw/plugin-sdk/config-runtime`** - un ampio barrel di compatibilità per la configurazione
  che durante la finestra di migrazione contiene ancora helper diretti deprecati per caricamento/scrittura.
- **`openclaw/extension-api`** - un bridge che dava ai Plugin accesso diretto a
  helper lato host come il runner agente incorporato.
- **`api.registerEmbeddedExtensionFactory(...)`** - un hook per estensioni in bundle rimosso e riservato all’embedded runner
  che poteva osservare eventi dell’embedded runner come
  `tool_result`.

Le ampie superfici di import sono ora **deprecate**. Continuano a funzionare a runtime,
ma i nuovi Plugin non devono usarle, e i Plugin esistenti dovrebbero migrare prima che
la prossima release maggiore le rimuova. L’API di registrazione della factory di estensioni riservata all’embedded runner
è stata rimossa; usa invece il middleware per i risultati degli strumenti.

OpenClaw non rimuove né reinterpreta un comportamento documentato dei Plugin nello stesso
cambiamento che introduce una sostituzione. Le modifiche che rompono un contratto devono prima passare
attraverso un adattatore di compatibilità, diagnostica, documentazione e una finestra di deprecazione.
Questo vale per import dell’SDK, campi del manifest, API di setup, hook e comportamento di
registrazione runtime.

<Warning>
  Il livello di compatibilità all’indietro verrà rimosso in una futura release maggiore.
  I Plugin che importano ancora da queste superfici si romperanno quando accadrà.
  Le registrazioni legacy delle factory di estensioni incorporate già non vengono più caricate.
</Warning>

## Perché è cambiato

Il vecchio approccio causava problemi:

- **Avvio lento** - importare un helper caricava decine di moduli non correlati
- **Dipendenze circolari** - le ampie riesportazioni rendevano facile creare cicli di import
- **Superficie API poco chiara** - non c’era modo di distinguere quali export fossero stabili rispetto a quelli interni

Il moderno SDK per Plugin risolve questo problema: ogni percorso di import (`openclaw/plugin-sdk/\<subpath\>`)
è un modulo piccolo e autonomo con uno scopo chiaro e un contratto documentato.

Sono sparite anche le vecchie cuciture di comodità per provider per i canali in bundle.
Le cuciture helper brandizzate per canale erano scorciatoie private del monorepo, non contratti
stabili per Plugin. Usa invece sottopercorsi SDK generici e ristretti. All’interno del workspace dei Plugin
in bundle, mantieni gli helper di proprietà del provider nel suo `api.ts` o
`runtime-api.ts`.

Esempi attuali di provider in bundle:

- Anthropic mantiene gli helper di stream specifici per Claude nella propria cucitura `api.ts` /
  `contract-api.ts`
- OpenAI mantiene provider builder, helper per modello predefinito e builder per provider realtime
  nel proprio `api.ts`
- OpenRouter mantiene provider builder e helper di onboarding/configurazione nel proprio
  `api.ts`

## Piano di migrazione per Talk e voce realtime

Il codice Talk per voce realtime, telefonia, riunioni e browser sta passando dalla contabilità dei turni
locale alla superficie a un controller di sessione Talk condiviso esportato da
`openclaw/plugin-sdk/realtime-voice`. Il nuovo controller possiede l’envelope comune degli eventi Talk,
lo stato del turno attivo, lo stato di cattura, lo stato dell’audio in uscita, la cronologia recente
degli eventi e il rifiuto dei turni obsoleti. I Plugin provider dovrebbero continuare a possedere
le sessioni realtime specifiche del vendor; i Plugin di superficie dovrebbero continuare a possedere cattura,
riproduzione, telefonia e particolarità delle riunioni.

Questa migrazione di Talk è intenzionalmente breaking-clean:

1. Mantieni le primitive condivise di controller/runtime in
   `plugin-sdk/realtime-voice`.
2. Sposta le superfici in bundle sul controller condiviso: relay browser,
   handoff managed-room, realtime voice-call, STT streaming voice-call, realtime Google
   Meet e push-to-talk nativo.
3. Sostituisci le vecchie famiglie RPC Talk con l’API finale `talk.session.*` e
   `talk.client.*`.
4. Pubblicizza un solo canale di eventi Talk live in Gateway
   `hello-ok.features.events`: `talk.event`.
5. Elimina il vecchio endpoint HTTP realtime e qualsiasi percorso di override
   delle istruzioni al momento della richiesta.

Il nuovo codice non dovrebbe chiamare direttamente `createTalkEventSequencer(...)` a meno che stia
implementando un adapter di basso livello o una fixture di test. Preferisci il controller condiviso
così gli eventi con scope di turno non possono essere emessi senza un id di turno, le chiamate obsolete `turnEnd` /
`turnCancel` non possono cancellare un turno attivo più recente, e gli eventi del ciclo di vita
dell’audio in uscita restano coerenti tra telefonia, riunioni, relay browser, handoff managed-room
e client Talk nativi.

La forma dell’API pubblica target è:

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
perché il browser possiede la negoziazione del provider e il trasporto dei media mentre il
Gateway possiede credenziali, istruzioni e policy degli strumenti. `talk.session.*` è la
superficie comune gestita dal Gateway per realtime gateway-relay, trascrizione gateway-relay
e sessioni STT/TTS native managed-room.

Le configurazioni legacy che collocavano i selettori realtime accanto a `talk.provider` /
`talk.providers` dovrebbero essere riparate con `openclaw doctor --fix`; a runtime Talk
non reinterpreta la configurazione provider speech/TTS come configurazione provider realtime.

Le combinazioni supportate di `talk.session.create` sono intenzionalmente poche:

| Modalità        | Trasporto       | Brain           | Proprietario       | Note                                                                                                               |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio provider full-duplex collegato attraverso il Gateway; le chiamate agli strumenti vengono instradate tramite lo strumento agent-consult. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Solo STT streaming; i chiamanti inviano audio in input e ricevono eventi di trascrizione.                          |
| `stt-tts`       | `managed-room`  | `agent-consult` | Stanza nativa/client | Stanze in stile push-to-talk e walkie-talkie in cui il client possiede cattura/riproduzione e il Gateway possiede lo stato del turno. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Stanza nativa/client | Modalità stanza solo admin per superfici first-party attendibili che eseguono direttamente azioni degli strumenti del Gateway. |

Mappa dei metodi rimossi:

| Vecchio                          | Nuovo                                                    |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` or `talk.session.cancelTurn` |
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

  | Metodo                          | Si applica a                                            | Contratto                                                                                                                                                                                |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Aggiunge un frammento audio PCM in base64 alla sessione del provider di proprietà della stessa connessione Gateway.                                                                       |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Avvia un turno utente di managed-room.                                                                                                                                                   |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Termina il turno attivo dopo la convalida del turno obsoleto.                                                                                                                            |
  | `talk.session.cancelTurn`       | tutte le sessioni di proprietà del Gateway              | Annulla il lavoro attivo di acquisizione/provider/agente/TTS per un turno.                                                                                                               |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Interrompe l'output audio dell'assistente senza necessariamente terminare il turno utente.                                                                                                |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Completa una chiamata tool del provider emessa dal relay; passa `options.willContinue` per l'output provvisorio o `options.suppressResponse` per soddisfare la chiamata senza un'altra risposta dell'assistente. |
  | `talk.session.steer`            | sessioni Talk supportate da agente                      | Invia un controllo vocale `status`, `steer`, `cancel` o `followup` all'esecuzione incorporata attiva risolta dalla sessione Talk.                                                        |
  | `talk.session.close`            | tutte le sessioni unificate                             | Interrompe le sessioni relay o revoca lo stato di managed-room, quindi dimentica l'id della sessione unificata.                                                                           |

  Non introdurre casi speciali per provider o piattaforma nel core per farlo funzionare.
  Il core possiede la semantica delle sessioni Talk. I Plugin provider possiedono la configurazione delle sessioni vendor.
  Le chiamate vocali e Google Meet possiedono gli adattatori di telefonia/riunione. Browser e app native
  possiedono l'UX di acquisizione/riproduzione del dispositivo.

  ## Criterio di compatibilità

  Per i Plugin esterni, il lavoro di compatibilità segue questo ordine:

  1. aggiungere il nuovo contratto
  2. mantenere il vecchio comportamento collegato tramite un adattatore di compatibilità
  3. emettere una diagnostica o un avviso che nomini il vecchio percorso e il sostituto
  4. coprire entrambi i percorsi nei test
  5. documentare la deprecazione e il percorso di migrazione
  6. rimuovere solo dopo la finestra di migrazione annunciata, di solito in una release principale

  I manutentori possono verificare la coda di migrazione corrente con
  `pnpm plugins:boundary-report`. Usa `pnpm plugins:boundary-report:summary` per
  conteggi compatti, `--owner <id>` per un Plugin o proprietario della compatibilità, e
  `pnpm plugins:boundary-report:ci` quando un gate CI deve fallire su record di
  compatibilità scaduti, import SDK riservati tra proprietari o sottopercorsi SDK riservati
  non usati. Il report raggruppa i record di
  compatibilità deprecati per data di rimozione, conta i riferimenti locali di codice/documentazione,
  espone gli import SDK riservati tra proprietari e riepiloga il bridge SDK privato
  memory-host, così la pulizia della compatibilità rimane esplicita invece di
  dipendere da ricerche ad hoc. I sottopercorsi SDK riservati devono avere utilizzo del proprietario tracciato;
  gli export helper riservati inutilizzati devono essere rimossi dall'SDK pubblico.

  Se un campo del manifest è ancora accettato, gli autori di Plugin possono continuare a usarlo finché
  documentazione e diagnostica non indicano diversamente. Il nuovo codice dovrebbe preferire il sostituto
  documentato, ma i Plugin esistenti non dovrebbero rompersi durante le normali release
  minori.

  ## Come migrare

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    I Plugin inclusi dovrebbero smettere di chiamare
    `api.runtime.config.loadConfig()` e
    `api.runtime.config.writeConfigFile(...)` direttamente. Preferisci la configurazione che è stata
    già passata nel percorso di chiamata attivo. Gli handler di lunga durata che hanno bisogno dello
    snapshot del processo corrente possono usare `api.runtime.config.current()`. I tool agente di lunga durata
    dovrebbero usare `ctx.getRuntimeConfig()` del contesto del tool dentro
    `execute`, così un tool creato prima di una scrittura della configurazione vede comunque la configurazione
    runtime aggiornata.

    Le scritture della configurazione devono passare dagli helper transazionali e scegliere un
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
    il gateway rimane responsabile dell'applicazione o pianificazione del riavvio.
    `loadConfig` e `writeConfigFile` rimangono helper di compatibilità deprecati
    per i Plugin esterni durante la finestra di migrazione e avvisano una volta con
    il codice di compatibilità `runtime-config-load-write`. I Plugin inclusi e il codice runtime
    del repository sono protetti da guardrail di scanner in
    `pnpm check:deprecated-api-usage` e
    `pnpm check:no-runtime-action-load-config`: il nuovo uso di Plugin di produzione
    fallisce direttamente, le scritture dirette della configurazione falliscono, i metodi del server gateway devono usare
    lo snapshot runtime della richiesta, gli helper runtime di invio/azione/client del canale
    devono ricevere la configurazione dal loro confine, e i moduli runtime di lunga durata hanno
    zero chiamate ambientali `loadConfig()` consentite.

    Il nuovo codice Plugin dovrebbe anche evitare di importare il barrel di compatibilità ampio
    `openclaw/plugin-sdk/config-runtime`. Usa il sottopercorso SDK ristretto
    che corrisponde al compito:

    | Necessità | Import |
    | --- | --- |
    | Tipi di configurazione come `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Asserzioni di configurazione già caricata e lookup della configurazione di ingresso del Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Letture dello snapshot runtime corrente | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Scritture della configurazione | `openclaw/plugin-sdk/config-mutation` |
    | Helper dello store di sessione | `openclaw/plugin-sdk/session-store-runtime` |
    | Configurazione tabella Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helper runtime dei criteri di gruppo | `openclaw/plugin-sdk/runtime-group-policy` |
    | Risoluzione input segreti | `openclaw/plugin-sdk/secret-input-runtime` |
    | Override modello/sessione | `openclaw/plugin-sdk/model-session-runtime` |

    I Plugin inclusi e i loro test sono protetti dallo scanner contro il barrel ampio,
    così import e mock rimangono locali al comportamento di cui hanno bisogno. Il barrel ampio
    esiste ancora per la compatibilità esterna, ma il nuovo codice non dovrebbe
    dipendere da esso.

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    I Plugin inclusi devono sostituire gli handler dei risultati tool
    `api.registerEmbeddedExtensionFactory(...)` solo per embedded-runner con
    middleware neutrali rispetto al runtime.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Aggiorna il manifest del Plugin allo stesso tempo:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    I Plugin installati possono anche registrare middleware dei risultati tool quando sono
    abilitati esplicitamente e dichiarano ogni runtime mirato in
    `contracts.agentToolResultMiddleware`. Le registrazioni di middleware installati non dichiarate
    vengono rifiutate.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    I Plugin di canale con capacità di approvazione ora espongono il comportamento di approvazione nativo tramite
    `approvalCapability.nativeRuntime` più il registro condiviso del contesto runtime.

    Modifiche chiave:

    - Sostituisci `approvalCapability.handler.loadRuntime(...)` con
      `approvalCapability.nativeRuntime`
    - Sposta auth/consegna specifici dell'approvazione dal cablaggio legacy `plugin.auth` /
      `plugin.approvals` a `approvalCapability`
    - `ChannelPlugin.approvals` è stato rimosso dal contratto pubblico dei Plugin di canale;
      sposta i campi delivery/native/render su `approvalCapability`
    - `plugin.auth` rimane solo per i flussi di login/logout del canale; gli hook auth di approvazione
      lì non vengono più letti dal core
    - Registra oggetti runtime di proprietà del canale come client, token o app Bolt
      tramite `openclaw/plugin-sdk/channel-runtime-context`
    - Non inviare avvisi di reinstradamento di proprietà del Plugin dagli handler di approvazione nativi;
      il core ora possiede gli avvisi instradati altrove dai risultati di consegna effettivi
    - Quando passi `channelRuntime` in `createChannelManager(...)`, fornisci una
      superficie `createPluginRuntime().channel` reale. Gli stub parziali vengono rifiutati.

    Vedi `/plugins/sdk-channel-plugins` per il layout corrente della capacità di approvazione.

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    Se il tuo Plugin usa `openclaw/plugin-sdk/windows-spawn`, i wrapper Windows
    `.cmd`/`.bat` non risolti ora falliscono in modo chiuso a meno che tu non passi esplicitamente
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
    Ogni export dalla vecchia superficie mappa a uno specifico percorso di import moderno:

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

    Lo stesso modello si applica agli altri helper bridge legacy:

    | Vecchia importazione | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper dell'archivio sessioni | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Sostituire le importazioni infra-runtime ampie">
    `openclaw/plugin-sdk/infra-runtime` esiste ancora per la compatibilità
    esterna, ma il nuovo codice dovrebbe importare la superficie di helper
    mirata di cui ha effettivamente bisogno:

    | Necessità | Importazione |
    | --- | --- |
    | Helper della coda eventi di sistema | `openclaw/plugin-sdk/system-event-runtime` |
    | Helper di risveglio, evento e visibilità Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Svuotamento della coda di recapito in sospeso | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetria dell'attività del canale | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cache di deduplicazione in memoria e con backend persistente | `openclaw/plugin-sdk/dedupe-runtime` |
    | Helper sicuri per percorsi di file/media locali | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch consapevole del dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Helper per proxy e fetch protetto | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipi di criteri del dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipi di richiesta/risoluzione di approvazione | `openclaw/plugin-sdk/approval-runtime` |
    | Helper per payload di risposta di approvazione e comandi | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helper di formattazione degli errori | `openclaw/plugin-sdk/error-runtime` |
    | Attese di prontezza del trasporto | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helper per token sicuri | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concorrenza limitata dei task asincroni | `openclaw/plugin-sdk/concurrency-runtime` |
    | Coercizione numerica | `openclaw/plugin-sdk/number-runtime` |
    | Lock asincrono locale al processo | `openclaw/plugin-sdk/async-lock-runtime` |
    | Lock dei file | `openclaw/plugin-sdk/file-lock` |

    I plugin in bundle sono protetti da scanner contro `infra-runtime`, quindi
    il codice del repo non può regredire al barrel ampio.

  </Step>

  <Step title="Migrare gli helper delle route di canale">
    Il nuovo codice delle route di canale dovrebbe usare `openclaw/plugin-sdk/channel-route`.
    I nomi route-key e comparable-target più vecchi rimangono come alias di
    compatibilità durante la finestra di migrazione, ma i nuovi plugin dovrebbero
    usare i nomi di route che descrivono direttamente il comportamento:

    | Vecchio helper | Helper moderno |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Gli helper di route moderni normalizzano `{ channel, to, accountId, threadId }`
    in modo coerente tra approvazioni native, soppressione delle risposte,
    deduplicazione in ingresso, recapito Cron e routing delle sessioni.

    Non aggiungere nuovi usi di `ChannelMessagingAdapter.parseExplicitTarget` o
    degli helper loaded-route basati su parser (`parseExplicitTargetForLoadedChannel`
    o `resolveRouteTargetForLoadedChannel`) né di
    `resolveChannelRouteTargetWithParser(...)` da `plugin-sdk/channel-route`.
    Questi hook sono deprecati e rimangono solo per i plugin più vecchi durante la
    finestra di migrazione. I nuovi plugin di canale dovrebbero usare
    `messaging.targetResolver.resolveTarget(...)` per la normalizzazione dell'id
    del target e il fallback in caso di mancata corrispondenza nella directory,
    `messaging.inferTargetChatType(...)` quando il core ha bisogno di un tipo di
    peer anticipato, e `messaging.resolveOutboundSessionRoute(...)` per
    l'identità di sessione e thread nativa del provider.

  </Step>

  <Step title="Compilare e testare">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Riferimento dei percorsi di importazione

  <Accordion title="Tabella dei percorsi di importazione comuni">
  | Percorso di importazione | Scopo | Esportazioni principali |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper canonico per l'entry del Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Re-export ombrello legacy per definizioni/builder di entry dei canali | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Esportazione dello schema di configurazione radice | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper di entry per provider singolo | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definizioni e builder mirati per entry dei canali | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helper condivisi per la procedura guidata di configurazione | Traduttore di configurazione, prompt allowlist, builder dello stato di configurazione |
  | `plugin-sdk/setup-runtime` | Helper runtime in fase di configurazione | `createSetupTranslator`, adattatori patch di configurazione sicuri per l'importazione, helper per note di lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy di configurazione delegata |
  | `plugin-sdk/setup-adapter-runtime` | Alias deprecato dell'adattatore di configurazione | Usa `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Helper per strumenti di configurazione | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper multi-account | Helper per elenco account/configurazione/action gate |
  | `plugin-sdk/account-id` | Helper per account-id | `DEFAULT_ACCOUNT_ID`, normalizzazione di account-id |
  | `plugin-sdk/account-resolution` | Helper di lookup account | Helper di lookup account + fallback predefinito |
  | `plugin-sdk/account-helpers` | Helper account mirati | Helper per elenco account/azione account |
  | `plugin-sdk/channel-setup` | Adattatori della procedura guidata di configurazione | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive di associazione DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Cablaggio di prefisso risposta, digitazione e consegna origine | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Factory per adattatori di configurazione e helper di accesso DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Builder di schema di configurazione | Primitive condivise dello schema di configurazione dei canali e solo il builder generico |
  | `plugin-sdk/bundled-channel-config-schema` | Schemi di configurazione inclusi | Solo Plugin inclusi mantenuti da OpenClaw; i nuovi Plugin devono definire schemi locali al Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Schemi di configurazione inclusi deprecati | Solo alias di compatibilità; usa `plugin-sdk/bundled-channel-config-schema` per i Plugin inclusi mantenuti |
  | `plugin-sdk/telegram-command-config` | Helper di configurazione dei comandi Telegram | Normalizzazione del nome comando, rifinitura descrizione, validazione di duplicati/conflitti |
  | `plugin-sdk/channel-policy` | Risoluzione policy gruppo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Facciata di compatibilità deprecata | Usa `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Helper per envelope in ingresso | Helper condivisi per route + builder envelope |
  | `plugin-sdk/channel-inbound` | Helper di ricezione in ingresso | Creazione contesto, formattazione, radici, runner, dispatch di risposta preparata e predicati di dispatch |
  | `plugin-sdk/messaging-targets` | Percorso di importazione deprecato per parsing target | Usa `plugin-sdk/channel-targets` per helper generici di parsing target, `plugin-sdk/channel-route` per confronto route e `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` di proprietà del Plugin per risoluzione target specifica del provider |
  | `plugin-sdk/outbound-media` | Helper per media in uscita | Caricamento condiviso di media in uscita |
  | `plugin-sdk/outbound-send-deps` | Facciata di compatibilità deprecata | Usa `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Helper del ciclo di vita dei messaggi in uscita | Adattatori messaggi, ricevute, helper di invio durevole, helper anteprima live/streaming, opzioni di risposta, helper del ciclo di vita, identità in uscita e pianificazione payload |
  | `plugin-sdk/channel-streaming` | Facciata di compatibilità deprecata | Usa `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Facciata di compatibilità deprecata | Usa `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Helper thread-binding | Ciclo di vita thread-binding e helper adattatore |
  | `plugin-sdk/agent-media-payload` | Helper legacy per payload media | Builder payload media agente per layout di campi legacy |
  | `plugin-sdk/channel-runtime` | Shim di compatibilità deprecato | Solo utilità runtime legacy dei canali |
  | `plugin-sdk/channel-send-result` | Tipi di risultato invio | Tipi di risultato risposta |
  | `plugin-sdk/runtime-store` | Archiviazione persistente del Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helper runtime ampi | Helper runtime/logging/backup/installazione Plugin |
  | `plugin-sdk/runtime-env` | Helper runtime env mirati | Logger/runtime env, timeout, retry e helper backoff |
  | `plugin-sdk/plugin-runtime` | Helper condivisi runtime Plugin | Helper per comandi/hook/http/interattività Plugin |
  | `plugin-sdk/hook-runtime` | Helper pipeline hook | Helper condivisi per pipeline hook webhook/interni |
  | `plugin-sdk/lazy-runtime` | Helper lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper di processo | Helper exec condivisi |
  | `plugin-sdk/cli-runtime` | Helper runtime CLI | Formattazione comandi, attese, helper versione |
  | `plugin-sdk/gateway-runtime` | Helper Gateway | Client Gateway, helper di avvio pronto per event loop, risoluzione host LAN pubblicizzato e helper patch dello stato canale |
  | `plugin-sdk/config-runtime` | Shim di compatibilità configurazione deprecato | Preferisci `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` e `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Helper comandi Telegram | Helper di validazione comandi Telegram stabili rispetto al fallback quando la superficie del contratto Telegram incluso non è disponibile |
  | `plugin-sdk/approval-runtime` | Helper prompt di approvazione | Payload di approvazione exec/Plugin, helper capacità/profilo approvazione, helper routing/runtime approvazione nativa e formattazione percorso display approvazione strutturata |
  | `plugin-sdk/approval-auth-runtime` | Helper auth approvazione | Risoluzione approvatore, auth azione stessa chat |
  | `plugin-sdk/approval-client-runtime` | Helper client approvazione | Helper profilo/filtro approvazione exec nativa |
  | `plugin-sdk/approval-delivery-runtime` | Helper consegna approvazione | Adattatori capacità/consegna approvazione nativa |
  | `plugin-sdk/approval-gateway-runtime` | Helper Gateway approvazione | Helper condiviso di risoluzione Gateway approvazione |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper adattatore approvazione | Helper leggeri di caricamento adattatore approvazione nativa per entrypoint canale hot |
  | `plugin-sdk/approval-handler-runtime` | Helper gestore approvazione | Helper runtime più ampi per gestore approvazione; preferisci le seam adattatore/Gateway più mirate quando bastano |
  | `plugin-sdk/approval-native-runtime` | Helper target approvazione | Helper di associazione target/account approvazione nativa |
  | `plugin-sdk/approval-reply-runtime` | Helper risposta approvazione | Helper payload risposta approvazione exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Helper runtime-context canale | Helper generici register/get/watch del runtime-context canale |
  | `plugin-sdk/security-runtime` | Helper di sicurezza | Helper condivisi per trust, gating DM, file/percorso limitato alla radice, contenuti esterni e raccolta segreti |
  | `plugin-sdk/ssrf-policy` | Helper policy SSRF | Helper policy host allowlist e rete privata |
  | `plugin-sdk/ssrf-runtime` | Helper runtime SSRF | Dispatcher fissato, fetch protetta, helper policy SSRF |
  | `plugin-sdk/system-event-runtime` | Helper eventi di sistema | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Helper Heartbeat | Helper wake, evento e visibilità Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Helper coda di consegna | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Helper attività canale | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Helper dedupe | Cache dedupe in memoria e con backend persistente |
  | `plugin-sdk/file-access-runtime` | Helper accesso file | Helper sicuri per percorsi file/media locali |
  | `plugin-sdk/transport-ready-runtime` | Helper prontezza trasporto | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Helper policy approvazione exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Helper cache limitata | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper gating diagnostica | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper formattazione errori | `formatUncaughtError`, `isApprovalNotFoundError`, helper grafo errori |
  | `plugin-sdk/fetch-runtime` | Helper fetch/proxy wrappati | `resolveFetch`, helper proxy, helper opzioni EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Helper normalizzazione host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper retry | `RetryConfig`, `retryAsync`, runner policy |
  | `plugin-sdk/allow-from` | Formattazione allowlist e mappatura input | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating comandi e helper superficie comandi | `resolveControlCommandGate`, helper autorizzazione mittente, helper registro comandi inclusa formattazione dinamica menu argomenti |
  | `plugin-sdk/command-status` | Renderer stato/aiuto comandi | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing input segreto | Helper input segreto |
  | `plugin-sdk/webhook-ingress` | Helper richiesta Webhook | Utilità target Webhook |
  | `plugin-sdk/webhook-request-guards` | Helper guard corpo Webhook | Helper lettura/limite corpo richiesta |
  | `plugin-sdk/reply-runtime` | Runtime risposta condiviso | Dispatch in ingresso, heartbeat, pianificatore risposta, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helper dispatch risposta mirati | Finalizzazione, dispatch provider e helper etichetta conversazione |
  | `plugin-sdk/reply-history` | Helper cronologia risposte | `createChannelHistoryWindow`; esportazioni deprecate di compatibilità map-helper come `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Pianificazione riferimento risposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper chunk risposta | Helper chunking testo/markdown |
  | `plugin-sdk/session-store-runtime` | Helper archivio sessioni | Helper percorso archivio + updated-at |
  | `plugin-sdk/state-paths` | Helper percorsi stato | Helper directory stato e OAuth |
  | `plugin-sdk/routing` | Funzioni di supporto per routing/chiave di sessione | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, funzioni di supporto per la normalizzazione delle chiavi di sessione |
  | `plugin-sdk/status-helpers` | Funzioni di supporto per lo stato dei canali | Builder di riepiloghi stato canale/account, valori predefiniti dello stato runtime, funzioni di supporto per metadati dei problemi |
  | `plugin-sdk/target-resolver-runtime` | Funzioni di supporto del risolutore di destinazioni | Funzioni di supporto condivise del risolutore di destinazioni |
  | `plugin-sdk/string-normalization-runtime` | Funzioni di supporto per la normalizzazione delle stringhe | Funzioni di supporto per la normalizzazione di slug/stringhe |
  | `plugin-sdk/request-url` | Funzioni di supporto per URL di richiesta | Estrae URL stringa da input simili a richieste |
  | `plugin-sdk/run-command` | Funzioni di supporto per comandi temporizzati | Esecutore di comandi temporizzati con stdout/stderr normalizzati |
  | `plugin-sdk/param-readers` | Lettori di parametri | Lettori comuni di parametri per strumenti/CLI |
  | `plugin-sdk/tool-payload` | Estrazione payload degli strumenti | Estrae payload normalizzati dagli oggetti risultato degli strumenti |
  | `plugin-sdk/tool-send` | Estrazione invio degli strumenti | Estrae campi canonici di destinazione invio dagli argomenti degli strumenti |
  | `plugin-sdk/temp-path` | Funzioni di supporto per percorsi temporanei | Funzioni di supporto condivise per percorsi di download temporanei |
  | `plugin-sdk/logging-core` | Funzioni di supporto per logging | Logger di sottosistema e funzioni di supporto per la redazione |
  | `plugin-sdk/markdown-table-runtime` | Funzioni di supporto per tabelle Markdown | Funzioni di supporto per la modalita tabella Markdown |
  | `plugin-sdk/reply-payload` | Tipi di risposta ai messaggi | Tipi di payload di risposta |
  | `plugin-sdk/provider-setup` | Funzioni di supporto curate per configurare fornitori locali/self-hosted | Funzioni di supporto per rilevamento/configurazione di fornitori self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Funzioni di supporto mirate per configurare fornitori self-hosted compatibili con OpenAI | Stesse funzioni di supporto per rilevamento/configurazione di fornitori self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Funzioni di supporto per autenticazione runtime dei fornitori | Funzioni di supporto per la risoluzione runtime delle chiavi API |
  | `plugin-sdk/provider-auth-api-key` | Funzioni di supporto per configurare chiavi API dei fornitori | Funzioni di supporto per onboarding/scrittura profilo delle chiavi API |
  | `plugin-sdk/provider-auth-result` | Funzioni di supporto per risultati di autenticazione dei fornitori | Builder standard di risultati di autenticazione OAuth |
  | `plugin-sdk/provider-selection-runtime` | Funzioni di supporto per selezione dei fornitori | Selezione del fornitore configurata o automatica e unione della configurazione grezza del fornitore |
  | `plugin-sdk/provider-env-vars` | Funzioni di supporto per variabili d'ambiente dei fornitori | Funzioni di supporto per la ricerca delle variabili d'ambiente di autenticazione del fornitore |
  | `plugin-sdk/provider-model-shared` | Funzioni di supporto condivise per modelli/replay dei fornitori | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi di criteri di replay, funzioni di supporto per endpoint dei fornitori e funzioni di supporto per la normalizzazione degli ID modello |
  | `plugin-sdk/provider-catalog-shared` | Funzioni di supporto condivise per cataloghi dei fornitori | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch di onboarding dei fornitori | Funzioni di supporto per configurazione di onboarding |
  | `plugin-sdk/provider-http` | Funzioni di supporto HTTP dei fornitori | Funzioni di supporto generiche per funzionalita HTTP/endpoint dei fornitori, incluse funzioni di supporto per moduli multipart di trascrizione audio |
  | `plugin-sdk/provider-web-fetch` | Funzioni di supporto web-fetch dei fornitori | Funzioni di supporto per registrazione/cache di fornitori web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Funzioni di supporto per configurazione web-search dei fornitori | Funzioni di supporto ristrette per configurazione/credenziali web-search per fornitori che non richiedono cablaggio di abilitazione Plugin |
  | `plugin-sdk/provider-web-search-contract` | Funzioni di supporto per contratto web-search dei fornitori | Funzioni di supporto ristrette per contratto di configurazione/credenziali web-search, come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con ambito |
  | `plugin-sdk/provider-web-search` | Funzioni di supporto web-search dei fornitori | Funzioni di supporto per registrazione/cache/runtime di fornitori web-search |
  | `plugin-sdk/provider-tools` | Funzioni di supporto compatibilita strumenti/schema dei fornitori | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` e pulizia schema + diagnostica DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Funzioni di supporto per utilizzo dei fornitori | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e altre funzioni di supporto per l'utilizzo dei fornitori |
  | `plugin-sdk/provider-stream` | Funzioni di supporto per wrapper stream dei fornitori | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di wrapper stream e funzioni di supporto condivise per wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Funzioni di supporto per trasporto dei fornitori | Funzioni di supporto per trasporto nativo dei fornitori, come fetch protetto, estrazione testo dai risultati degli strumenti, trasformazioni dei messaggi di trasporto e stream scrivibili di eventi di trasporto |
  | `plugin-sdk/keyed-async-queue` | Coda asincrona ordinata | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Funzioni di supporto condivise per media | Funzioni di supporto per fetch/trasformazione/archiviazione media, rilevamento delle dimensioni video basato su ffprobe e builder di payload media |
  | `plugin-sdk/media-generation-runtime` | Funzioni di supporto condivise per generazione media | Funzioni di supporto condivise per failover, selezione dei candidati e messaggi di modello mancante per generazione di immagini/video/musica |
  | `plugin-sdk/media-understanding` | Funzioni di supporto per comprensione dei media | Tipi di fornitori per comprensione dei media piu esportazioni di funzioni di supporto per immagini/audio rivolte ai fornitori |
  | `plugin-sdk/text-runtime` | Esportazione ampia deprecata per compatibilita testo | Usa `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` e `logging-core` |
  | `plugin-sdk/text-chunking` | Funzioni di supporto per suddivisione del testo | Funzione di supporto per suddivisione del testo in uscita |
  | `plugin-sdk/speech` | Funzioni di supporto per voce | Tipi di fornitori voce piu funzioni di supporto rivolte ai fornitori per direttive, registro e convalida, e builder TTS compatibile con OpenAI |
  | `plugin-sdk/speech-core` | Core voce condiviso | Tipi di fornitori voce, registro, direttive, normalizzazione |
  | `plugin-sdk/realtime-transcription` | Funzioni di supporto per trascrizione in tempo reale | Tipi di fornitori, funzioni di supporto per registro e funzione di supporto condivisa per sessioni WebSocket |
  | `plugin-sdk/realtime-voice` | Funzioni di supporto per voce in tempo reale | Tipi di fornitori, funzioni di supporto per registro/risoluzione, funzioni di supporto per sessioni bridge, code condivise di risposta vocale degli agenti, controllo vocale delle esecuzioni attive, salute di trascritti/eventi, soppressione dell'eco, corrispondenza delle domande di consultazione, coordinamento della consultazione forzata, tracciamento del contesto di turno, tracciamento dell'attivita di output e funzioni di supporto per consultazione rapida del contesto |
  | `plugin-sdk/image-generation` | Funzioni di supporto per generazione di immagini | Tipi di fornitori per generazione di immagini piu funzioni di supporto per asset immagine/data URL e builder di fornitori di immagini compatibile con OpenAI |
  | `plugin-sdk/image-generation-core` | Core condiviso per generazione di immagini | Tipi di generazione immagini, failover, autenticazione e funzioni di supporto per registro |
  | `plugin-sdk/music-generation` | Funzioni di supporto per generazione di musica | Tipi di fornitori/richieste/risultati per generazione di musica |
  | `plugin-sdk/music-generation-core` | Core condiviso per generazione di musica | Tipi di generazione musica, funzioni di supporto per failover, ricerca fornitori e parsing dei riferimenti modello |
  | `plugin-sdk/video-generation` | Funzioni di supporto per generazione di video | Tipi di fornitori/richieste/risultati per generazione di video |
  | `plugin-sdk/video-generation-core` | Core condiviso per generazione di video | Tipi di generazione video, funzioni di supporto per failover, ricerca fornitori e parsing dei riferimenti modello |
  | `plugin-sdk/interactive-runtime` | Funzioni di supporto per risposte interattive | Normalizzazione/riduzione dei payload di risposta interattiva |
  | `plugin-sdk/channel-config-primitives` | Primitive di configurazione dei canali | Primitive ristrette per schema di configurazione dei canali |
  | `plugin-sdk/channel-config-writes` | Funzioni di supporto per scrittura configurazione canale | Funzioni di supporto per autorizzazione alla scrittura della configurazione dei canali |
  | `plugin-sdk/channel-plugin-common` | Preambolo condiviso dei canali | Esportazioni del preambolo condiviso dei Plugin canale |
  | `plugin-sdk/channel-status` | Funzioni di supporto per stato canale | Funzioni di supporto condivise per snapshot/riepiloghi dello stato dei canali |
  | `plugin-sdk/allowlist-config-edit` | Funzioni di supporto per configurazione allowlist | Funzioni di supporto per modifica/lettura della configurazione allowlist |
  | `plugin-sdk/group-access` | Funzioni di supporto per accesso di gruppo | Funzioni di supporto condivise per decisioni di accesso di gruppo |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Facciate di compatibilita deprecate | Usa `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Funzioni di supporto per guardia Direct-DM | Funzioni di supporto ristrette per criteri di guardia pre-crypto |
  | `plugin-sdk/extension-shared` | Funzioni di supporto condivise per estensioni | Primitive di supporto per canali passivi/stato e proxy ambientale |
  | `plugin-sdk/webhook-targets` | Funzioni di supporto per destinazioni Webhook | Registro delle destinazioni Webhook e funzioni di supporto per installazione route |
  | `plugin-sdk/webhook-path` | Alias deprecato per percorso webhook | Usa `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Funzioni di supporto condivise per media web | Funzioni di supporto per caricamento di media remoti/locali |
  | `plugin-sdk/zod` | Riesportazione deprecata di compatibilita Zod | Importa `zod` da `zod` direttamente |
  | `plugin-sdk/memory-core` | Funzioni di supporto memory-core incluse | Superficie di funzioni di supporto per gestore memoria/configurazione/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Facciata runtime del motore memoria | Facciata runtime per indice/ricerca memoria |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registro embedding memoria | Funzioni di supporto leggere per registro dei fornitori di embedding memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motore foundation host memoria | Esportazioni del motore foundation host memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motore embedding host memoria | Contratti embedding memoria, accesso al registro, fornitore locale e funzioni di supporto generiche batch/remote; i fornitori remoti concreti risiedono nei rispettivi Plugin proprietari |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motore QMD host memoria | Esportazioni del motore QMD host memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motore archiviazione host memoria | Esportazioni del motore archiviazione host memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Funzioni di supporto multimodali host memoria | Funzioni di supporto multimodali host memoria |
  | `plugin-sdk/memory-core-host-query` | Funzioni di supporto per query host memoria | Funzioni di supporto per query host memoria |
  | `plugin-sdk/memory-core-host-secret` | Funzioni di supporto per segreti host memoria | Funzioni di supporto per segreti host memoria |
  | `plugin-sdk/memory-core-host-events` | Alias deprecato per eventi memoria | Usa `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Funzioni di supporto per stato host memoria | Funzioni di supporto per stato host memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI host memoria | Funzioni di supporto runtime CLI host memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime core host memoria | Funzioni di supporto runtime core host memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Funzioni di supporto file/runtime host memoria | Funzioni di supporto file/runtime host memoria |
  | `plugin-sdk/memory-host-core` | Alias runtime core host memoria | Alias indipendente dal fornitore per funzioni di supporto runtime core host memoria |
  | `plugin-sdk/memory-host-events` | Alias journal eventi host memoria | Alias indipendente dal fornitore per funzioni di supporto del journal eventi host memoria |
  | `plugin-sdk/memory-host-files` | Alias deprecato file/runtime memoria | Usa `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Funzioni di supporto per markdown gestito | Funzioni di supporto condivise per markdown gestito per Plugin adiacenti alla memoria |
  | `plugin-sdk/memory-host-search` | Facciata di ricerca Active Memory | Facciata runtime lazy del gestore di ricerca Active Memory |
  | `plugin-sdk/memory-host-status` | Alias deprecato per stato host memoria | Usa `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Utilita di test | Barrel di compatibilita deprecato locale al repo; usa sottopercorsi di test mirati locali al repo, come `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` e `plugin-sdk/test-fixtures` |
</Accordion>

Questa tabella è intenzionalmente il sottoinsieme comune per la migrazione, non l'intera
superficie dell'SDK. L'inventario degli entrypoint del compilatore si trova in
`scripts/lib/plugin-sdk-entrypoints.json`; gli export dei pacchetti vengono generati dal
sottoinsieme pubblico.

Le seam helper riservate dei plugin in bundle sono state ritirate dalla mappa degli export
dell'SDK pubblico, tranne le facade di compatibilità documentate esplicitamente come lo
shim deprecato `plugin-sdk/discord` mantenuto per il pacchetto pubblicato
`@openclaw/discord@2026.3.13`. Gli helper specifici del proprietario risiedono nel
pacchetto del plugin proprietario; il comportamento host condiviso dovrebbe passare
attraverso contratti SDK generici come `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`
e `plugin-sdk/plugin-config-runtime`.

Usa l'import più ristretto adatto al compito. Se non riesci a trovare un export,
controlla il sorgente in `src/plugin-sdk/` o chiedi ai maintainer quale contratto generico
dovrebbe possederlo.

## Deprecazioni attive

Deprecazioni più ristrette che si applicano a tutto l'SDK dei plugin, al contratto dei provider,
alla superficie runtime e al manifest. Ognuna funziona ancora oggi, ma sarà rimossa
in una futura release major. La voce sotto ogni elemento mappa la vecchia API alla sua
sostituzione canonica.

<AccordionGroup>
  <Accordion title="Builder di aiuto command-auth → command-status">
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
    singolo oggetto decisionale invece di due chiamate separate.

    I plugin di canale downstream (Slack, Discord, Matrix, MS Teams) sono già
    passati al nuovo approccio.

  </Accordion>

  <Accordion title="Shim runtime di canale e helper delle azioni di canale">
    `openclaw/plugin-sdk/channel-runtime` è uno shim di compatibilità per i
    plugin di canale più vecchi. Non importarlo nel nuovo codice; usa
    `openclaw/plugin-sdk/channel-runtime-context` per registrare gli oggetti
    runtime.

    Gli helper `channelActions*` in `openclaw/plugin-sdk/channel-actions` sono
    deprecati insieme agli export di canale "actions" grezzi. Esponi invece le capability
    tramite la superficie semantica `presentation` - i plugin di canale
    dichiarano cosa renderizzano (schede, pulsanti, selezioni) invece di quali nomi
    di azioni grezze accettano.

  </Accordion>

  <Accordion title="Helper tool() del provider di ricerca Web → createTool() sul plugin">
    **Vecchio**: factory `tool()` da `openclaw/plugin-sdk/provider-web-search`.

    **Nuovo**: implementa `createTool(...)` direttamente sul plugin provider.
    OpenClaw non ha più bisogno dell'helper SDK per registrare il wrapper dello strumento.

  </Accordion>

  <Accordion title="Envelope di canale in testo semplice → BodyForAgent">
    **Vecchio**: `formatInboundEnvelope(...)` (e
    `ChannelMessageForAgent.channelEnvelope`) per costruire un envelope prompt
    piatto in testo semplice dai messaggi di canale in ingresso.

    **Nuovo**: `BodyForAgent` più blocchi strutturati di contesto utente. I plugin di
    canale allegano i metadati di routing (thread, argomento, risposta a, reazioni) come
    campi tipizzati invece di concatenarli in una stringa prompt. L'helper
    `formatAgentEnvelope(...)` è ancora supportato per envelope sintetizzati
    rivolti all'assistente, ma gli envelope in ingresso in testo semplice sono in
    via di rimozione.

    Aree interessate: `inbound_claim`, `message_received` e qualsiasi plugin di
    canale personalizzato che post-elaborava il testo `channelEnvelope`.

  </Accordion>

  <Accordion title="Hook deactivate → gateway_stop">
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

  <Accordion title="Hook subagent_spawning → binding del thread nel core">
    **Vecchio**: `api.on("subagent_spawning", handler)` che restituisce
    `threadBindingReady` o `deliveryOrigin`.

    **Nuovo**: lascia che il core prepari i binding dei sottoagenti `thread: true` tramite
    l'adapter di binding della sessione di canale. Usa `api.on("subagent_spawned", handler)`
    solo per l'osservazione post-avvio.

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
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` restano solo come
    superfici di compatibilità deprecate mentre i plugin esterni migrano.

  </Accordion>

  <Accordion title="Tipi di discovery dei provider → tipi di catalogo dei provider">
    Quattro alias di tipo di discovery sono ora wrapper sottili sui
    tipi dell'era del catalogo:

    | Vecchio alias             | Nuovo tipo                |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Inoltre, il vecchio contenitore statico `ProviderCapabilities` - i plugin
    provider dovrebbero usare hook provider espliciti come `buildReplayPolicy`,
    `normalizeToolSchemas` e `wrapStreamFn` invece di un oggetto statico.

  </Accordion>

  <Accordion title="Hook delle policy di ragionamento → resolveThinkingProfile">
    **Vecchio** (tre hook separati su `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` e
    `resolveDefaultThinkingLevel(ctx)`.

    **Nuovo**: un unico `resolveThinkingProfile(ctx)` che restituisce un
    `ProviderThinkingProfile` con `id` canonico, `label` opzionale e
    lista dei livelli ordinata per rango. OpenClaw declassa automaticamente i valori
    archiviati obsoleti in base al rango del profilo.

    Il contesto include `provider`, `modelId`, `reasoning` unito opzionale
    e fatti `compat` del modello uniti opzionali. I plugin provider possono usare questi
    fatti di catalogo per esporre un profilo specifico del modello solo quando il contratto
    di richiesta configurato lo supporta.

    Implementa un hook invece di tre. Gli hook legacy continuano a funzionare durante
    la finestra di deprecazione, ma non vengono composti con il risultato del profilo.

  </Accordion>

  <Accordion title="Provider di autenticazione esterni → contracts.externalAuthProviders">
    **Vecchio**: implementare hook di autenticazione esterna senza dichiarare il provider
    nel manifest del plugin.

    **Nuovo**: dichiara `contracts.externalAuthProviders` nel manifest del plugin
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
    **Vecchio** campo manifest: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nuovo**: rispecchia lo stesso lookup delle variabili d'ambiente in `setup.providers[].envVars`
    sul manifest. Questo consolida in un unico punto i metadati di ambiente di setup/stato
    ed evita di avviare il runtime del plugin solo per rispondere ai lookup delle variabili
    d'ambiente.

    `providerAuthEnvVars` rimane supportato tramite un adapter di compatibilità
    finché la finestra di deprecazione non si chiude.

  </Accordion>

  <Accordion title="Registrazione del plugin di memoria → registerMemoryCapability">
    **Vecchio**: tre chiamate separate -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nuovo**: una chiamata sull'API dello stato della memoria -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Stessi slot, singola chiamata di registrazione. Gli helper additivi per prompt e corpus
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) non sono
    interessati.

  </Accordion>

  <Accordion title="API del provider di embedding della memoria">
    **Vecchio**: `api.registerMemoryEmbeddingProvider(...)` più
    `contracts.memoryEmbeddingProviders`.

    **Nuovo**: `api.registerEmbeddingProvider(...)` più
    `contracts.embeddingProviders`.

    Il contratto generico del provider di embedding è riutilizzabile fuori dalla memoria ed è
    il percorso supportato per i nuovi provider. L'API di registrazione specifica della memoria
    rimane collegata come compatibilità deprecata mentre i provider esistenti migrano.
    I report di ispezione dei plugin segnalano l'uso non in bundle come debito di compatibilità.

  </Accordion>

  <Accordion title="Tipi dei messaggi di sessione dei sottoagenti rinominati">
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
    **Vecchio**: `runtime.tasks.flow` (singolare) restituiva un accessor task-flow live.

    **Nuovo**: `runtime.tasks.managedFlows` mantiene il runtime di mutazione TaskFlow
    gestito per i plugin che creano, aggiornano, annullano o eseguono attività figlie da un
    flusso. Usa `runtime.tasks.flows` quando al plugin servono solo letture basate su DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Factory di estensioni incorporate → middleware dei risultati degli strumenti dell'agente">
    Coperto in "Come migrare → Migrare le estensioni incorporate dei risultati degli strumenti al
    middleware" sopra. Incluso qui per completezza: il percorso solo per runner incorporato rimosso
    `api.registerEmbeddedExtensionFactory(...)` è sostituito da
    `api.registerAgentToolResultMiddleware(...)` con una lista runtime esplicita
    in `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` riesportato da `openclaw/plugin-sdk` è ora un
    alias di una riga per `OpenClawConfig`. Preferisci il nome canonico.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Le deprecazioni a livello di estensione (dentro i plugin di canale/provider in bundle sotto
`extensions/`) sono tracciate nei loro barrel `api.ts` e `runtime-api.ts`.
Non influenzano i contratti dei plugin di terze parti e non sono elencate
qui. Se consumi direttamente il barrel locale di un plugin in bundle, leggi i
commenti di deprecazione in quel barrel prima di aggiornare.
</Note>

## Tempistica di rimozione

| Quando                 | Cosa succede                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **Ora**                | Le superfici deprecate emettono avvisi di runtime                       |
| **Prossima major release** | Le superfici deprecate verranno rimosse; i plugin che le usano ancora non funzioneranno |

Tutti i plugin core sono già stati migrati. I plugin esterni devono migrare
prima della prossima major release.

## Sopprimere temporaneamente gli avvisi

Imposta queste variabili d'ambiente mentre lavori alla migrazione:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Questo è un meccanismo temporaneo di uscita, non una soluzione permanente.

## Correlati

- [Per iniziare](/it/plugins/building-plugins) - crea il tuo primo plugin
- [Panoramica dell'SDK](/it/plugins/sdk-overview) - riferimento completo agli import dei sottopercorsi
- [Plugin di canale](/it/plugins/sdk-channel-plugins) - creare plugin di canale
- [Plugin provider](/it/plugins/sdk-provider-plugins) - creare plugin provider
- [Internals dei Plugin](/it/plugins/architecture) - approfondimento sull'architettura
- [Manifest del Plugin](/it/plugins/manifest) - riferimento dello schema del manifest
