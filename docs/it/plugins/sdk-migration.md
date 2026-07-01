---
read_when:
    - Viene visualizzato l'avviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vedi l'avviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Hai usato api.registerEmbeddedExtensionFactory prima di OpenClaw 2026.4.25
    - Stai aggiornando un plugin alla moderna architettura dei plugin
    - Gestisci un Plugin OpenClaw esterno
sidebarTitle: Migrate to SDK
summary: Migra dal livello legacy di compatibilità all'indietro al moderno SDK dei Plugin
title: Migrazione del Plugin SDK
x-i18n:
    generated_at: "2026-07-01T13:05:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9f6f9b4334ca3bdbcc6602cfe2bb1499d5758de95a9163e0ef75619a712a1c3
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw è passato da un ampio livello di compatibilità retroattiva a una moderna
architettura Plugin con import mirati e documentati. Se il tuo Plugin è stato
creato prima della nuova architettura, questa guida ti aiuta a migrare.

## Cosa cambia

Il vecchio sistema Plugin forniva due superfici molto aperte che consentivano ai Plugin di importare
tutto ciò di cui avevano bisogno da un singolo punto di ingresso:

- **`openclaw/plugin-sdk/compat`** - un singolo import che riesportava decine di
  helper. È stato introdotto per mantenere funzionanti i vecchi Plugin basati su hook mentre veniva
  costruita la nuova architettura Plugin.
- **`openclaw/plugin-sdk/infra-runtime`** - un ampio barrel di helper runtime che
  mescolava eventi di sistema, stato Heartbeat, code di recapito, helper fetch/proxy,
  helper per file, tipi di approvazione e utilità non correlate.
- **`openclaw/plugin-sdk/config-runtime`** - un ampio barrel di compatibilità della configurazione
  che contiene ancora helper diretti di caricamento/scrittura deprecati durante la finestra di migrazione.
- **`openclaw/extension-api`** - un bridge che dava ai Plugin accesso diretto agli
  helper lato host come l'agent runner incorporato.
- **`api.registerEmbeddedExtensionFactory(...)`** - un hook di estensione in bundle solo per embedded-runner rimosso
  che poteva osservare eventi dell'embedded-runner come
  `tool_result`.

Le superfici di import ampie sono ora **deprecate**. Funzionano ancora in runtime,
ma i nuovi Plugin non devono usarle, e i Plugin esistenti dovrebbero migrare prima
che la prossima major release le rimuova. L'API di registrazione della factory di estensione
solo per embedded-runner è stata rimossa; usa invece il middleware dei risultati degli strumenti.

OpenClaw non rimuove né reinterpreta il comportamento documentato dei Plugin nella stessa
modifica che introduce una sostituzione. Le modifiche di contratto incompatibili devono prima passare
attraverso un adattatore di compatibilità, diagnostica, documentazione e una finestra di deprecazione.
Questo vale per import SDK, campi del manifest, API di configurazione, hook e comportamento di
registrazione runtime.

<Warning>
  Il livello di compatibilità retroattiva verrà rimosso in una futura major release.
  I Plugin che importano ancora da queste superfici si romperanno quando ciò accadrà.
  Le registrazioni legacy della factory di estensione incorporata già non vengono più caricate.
</Warning>

## Perché è cambiato

Il vecchio approccio causava problemi:

- **Avvio lento** - importare un helper caricava decine di moduli non correlati
- **Dipendenze circolari** - le riesportazioni ampie rendevano facile creare cicli di import
- **Superficie API poco chiara** - non c'era modo di capire quali export fossero stabili rispetto a quelli interni

Il moderno SDK Plugin risolve questo problema: ogni percorso di import (`openclaw/plugin-sdk/\<subpath\>`)
è un modulo piccolo, autonomo, con uno scopo chiaro e un contratto documentato.

Anche le seam di convenienza legacy dei provider per i canali in bundle sono state rimosse.
Le seam helper con marchio del canale erano scorciatoie private del mono-repo, non contratti
Plugin stabili. Usa invece subpath SDK generici e ristretti. All'interno del workspace dei Plugin
in bundle, mantieni gli helper di proprietà del provider nel `api.ts` o
`runtime-api.ts` di quel Plugin.

Esempi attuali di provider in bundle:

- Anthropic mantiene gli helper di stream specifici per Claude nella propria seam `api.ts` /
  `contract-api.ts`
- OpenAI mantiene builder dei provider, helper per i modelli predefiniti e builder dei provider realtime
  nel proprio `api.ts`
- OpenRouter mantiene builder del provider e helper di onboarding/configurazione nel proprio
  `api.ts`

## Piano di migrazione per Talk e voce realtime

Il codice di voce realtime, telefonia, riunioni e Talk nel browser si sta spostando dalla
contabilità dei turni locale alla superficie verso un controller condiviso di sessione Talk esportato da
`openclaw/plugin-sdk/realtime-voice`. Il nuovo controller possiede l'envelope comune degli eventi Talk,
lo stato del turno attivo, lo stato di acquisizione, lo stato dell'audio in uscita, la cronologia recente
degli eventi e il rifiuto dei turni obsoleti. I Plugin provider dovrebbero continuare a possedere
le sessioni realtime specifiche del fornitore; i Plugin di superficie dovrebbero continuare a possedere
le particolarità di acquisizione, riproduzione, telefonia e riunioni.

Questa migrazione Talk è intenzionalmente breaking-clean:

1. Mantieni il controller condiviso e le primitive runtime in
   `plugin-sdk/realtime-voice`.
2. Sposta le superfici in bundle sul controller condiviso: relay browser,
   handoff managed-room, voce-call realtime, voice-call streaming STT, Google
   Meet realtime e push-to-talk nativo.
3. Sostituisci le vecchie famiglie RPC Talk con l'API finale `talk.session.*` e
   `talk.client.*`.
4. Pubblicizza un unico canale eventi Talk live in Gateway
   `hello-ok.features.events`: `talk.event`.
5. Elimina il vecchio endpoint HTTP realtime e qualsiasi percorso di override
   delle istruzioni al momento della richiesta.

Il nuovo codice non dovrebbe chiamare direttamente `createTalkEventSequencer(...)` a meno che non stia
implementando un adattatore di basso livello o una fixture di test. Preferisci il controller condiviso
così gli eventi con ambito di turno non possono essere emessi senza un id turno, le chiamate obsolete `turnEnd` /
`turnCancel` non possono cancellare un turno attivo più recente, e gli eventi del ciclo di vita dell'audio
in uscita restano coerenti tra telefonia, riunioni, relay browser, handoff managed-room
e client Talk nativi.

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
perché il browser possiede la negoziazione del provider e il trasporto media mentre il
Gateway possiede credenziali, istruzioni e policy degli strumenti. `talk.session.*` è la
superficie comune gestita dal Gateway per realtime gateway-relay, trascrizione
gateway-relay e sessioni STT/TTS native managed-room.

Le configurazioni legacy che posizionavano selettori realtime accanto a `talk.provider` /
`talk.providers` dovrebbero essere riparate con `openclaw doctor --fix`; il runtime Talk
non reinterpreta la configurazione del provider speech/TTS come configurazione del provider realtime.

Le combinazioni supportate di `talk.session.create` sono intenzionalmente ridotte:

| Modalità        | Trasporto       | Brain           | Proprietario       | Note                                                                                                               |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio provider full-duplex instradato tramite il Gateway; le chiamate agli strumenti vengono instradate tramite lo strumento agent-consult. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Solo STT in streaming; i chiamanti inviano audio in ingresso e ricevono eventi di trascrizione.                    |
| `stt-tts`       | `managed-room`  | `agent-consult` | Stanza nativa/client | Stanze in stile push-to-talk e walkie-talkie in cui il client possiede acquisizione/riproduzione e il Gateway possiede lo stato del turno. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Stanza nativa/client | Modalità stanza solo amministratore per superfici first-party attendibili che eseguono direttamente azioni degli strumenti Gateway. |

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
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Aggiunge un frammento audio PCM base64 alla sessione del provider di proprietà della stessa connessione Gateway.                                                                         |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Avvia un turno utente in una stanza gestita.                                                                                                                                             |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Termina il turno attivo dopo la validazione dei turni obsoleti.                                                                                                                         |
  | `talk.session.cancelTurn`       | tutte le sessioni di proprietà del Gateway              | Annulla il lavoro attivo di acquisizione/provider/agente/TTS per un turno.                                                                                                               |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Interrompe l'output audio dell'assistente senza necessariamente terminare il turno utente.                                                                                               |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Completa una chiamata a uno strumento del provider emessa dal relay; passa `options.willContinue` per l'output intermedio oppure `options.suppressResponse` per soddisfare la chiamata senza un'altra risposta dell'assistente. |
  | `talk.session.steer`            | sessioni Talk supportate da agente                      | Invia il controllo vocale `status`, `steer`, `cancel` o `followup` all'esecuzione incorporata attiva risolta dalla sessione Talk.                                                        |
  | `talk.session.close`            | tutte le sessioni unificate                             | Interrompe le sessioni relay o revoca lo stato della stanza gestita, quindi dimentica l'id sessione unificato.                                                                           |

  Non introdurre casi speciali per provider o piattaforme nel core per far funzionare questo meccanismo.
  Il core possiede la semantica delle sessioni Talk. I Plugin provider possiedono la configurazione delle sessioni del fornitore.
  Le chiamate vocali e Google Meet possiedono gli adattatori di telefonia/riunione. Il browser e le app native
  possiedono la UX di acquisizione/riproduzione del dispositivo.

  ## Criterio di compatibilità

  Per i Plugin esterni, il lavoro di compatibilità segue questo ordine:

  1. aggiungere il nuovo contratto
  2. mantenere il comportamento precedente collegato tramite un adattatore di compatibilità
  3. emettere una diagnostica o un avviso che nomina il vecchio percorso e la sostituzione
  4. coprire entrambi i percorsi nei test
  5. documentare la deprecazione e il percorso di migrazione
  6. rimuovere solo dopo la finestra di migrazione annunciata, di solito in una release major

  I maintainer possono verificare la coda di migrazione corrente con
  `pnpm plugins:boundary-report`. Usa `pnpm plugins:boundary-report:summary` per
  conteggi compatti, `--owner <id>` per un solo Plugin o proprietario di compatibilità, e
  `pnpm plugins:boundary-report:ci` quando un gate CI deve fallire per record di
  compatibilità scaduti, import SDK riservati tra proprietari o sottopercorsi SDK
  riservati inutilizzati. Il report raggruppa i record di
  compatibilità deprecati per data di rimozione, conta i riferimenti locali in codice/docs,
  evidenzia gli import SDK riservati tra proprietari e riepiloga il bridge SDK privato
  memory-host, così la pulizia della compatibilità resta esplicita invece di
  affidarsi a ricerche ad hoc. I sottopercorsi SDK riservati devono avere un uso del proprietario tracciato;
  gli export helper riservati inutilizzati devono essere rimossi dall'SDK pubblico.

  Se un campo manifest è ancora accettato, gli autori di Plugin possono continuare a usarlo finché
  la documentazione e le diagnostiche non indicano diversamente. Il nuovo codice dovrebbe preferire la sostituzione
  documentata, ma i Plugin esistenti non dovrebbero rompersi durante normali release minor.

  ## Come migrare

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    I Plugin inclusi dovrebbero smettere di chiamare direttamente
    `api.runtime.config.loadConfig()` e
    `api.runtime.config.writeConfigFile(...)`. Preferisci la configurazione che era
    già passata nel percorso di chiamata attivo. Gli handler di lunga durata che richiedono lo
    snapshot corrente del processo possono usare `api.runtime.config.current()`. Gli strumenti agente di lunga durata
    dovrebbero usare `ctx.getRuntimeConfig()` del contesto dello strumento dentro
    `execute`, così uno strumento creato prima di una scrittura di configurazione vede comunque la configurazione
    runtime aggiornata.

    Le scritture di configurazione devono passare dagli helper transazionali e scegliere una
    policy post-scrittura:

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
    follow-up e vuole deliberatamente sopprimere il pianificatore di ricaricamento.
    I risultati della mutazione includono un riepilogo tipizzato `followUp` per test e logging;
    il gateway resta responsabile dell'applicazione o della pianificazione del riavvio.
    `loadConfig` e `writeConfigFile` restano come helper di compatibilità deprecati
    per i Plugin esterni durante la finestra di migrazione e avvisano una volta con
    il codice di compatibilità `runtime-config-load-write`. I Plugin inclusi e il codice runtime
    del repo sono protetti dai guardrail dello scanner in
    `pnpm check:deprecated-api-usage` e
    `pnpm check:no-runtime-action-load-config`: il nuovo uso nei Plugin di produzione
    fallisce direttamente, le scritture dirette della configurazione falliscono, i metodi del server gateway devono usare
    lo snapshot runtime della richiesta, gli helper di invio/azione/client del canale runtime
    devono ricevere la configurazione dal proprio confine, e i moduli runtime di lunga durata hanno
    zero chiamate ambientali `loadConfig()` consentite.

    Il nuovo codice Plugin dovrebbe anche evitare di importare l'ampio barrel di compatibilità
    `openclaw/plugin-sdk/config-runtime`. Usa il sottopercorso SDK ristretto
    che corrisponde al lavoro:

    | Esigenza | Import |
    | --- | --- |
    | Tipi di configurazione come `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Asserzioni su configurazione già caricata e lookup della configurazione dell'entry Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Letture dello snapshot runtime corrente | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Scritture della configurazione | `openclaw/plugin-sdk/config-mutation` |
    | Helper dell'archivio sessioni | `openclaw/plugin-sdk/session-store-runtime` |
    | Configurazione tabella Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helper runtime della policy di gruppo | `openclaw/plugin-sdk/runtime-group-policy` |
    | Risoluzione dell'input segreto | `openclaw/plugin-sdk/secret-input-runtime` |
    | Override di modello/sessione | `openclaw/plugin-sdk/model-session-runtime` |

    I Plugin inclusi e i loro test sono protetti dallo scanner contro l'ampio
    barrel, così import e mock restano locali al comportamento di cui hanno bisogno. L'ampio
    barrel esiste ancora per la compatibilità esterna, ma il nuovo codice non dovrebbe
    dipendere da esso.

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    I Plugin inclusi devono sostituire gli handler dei risultati degli strumenti
    `api.registerEmbeddedExtensionFactory(...)` solo per embedded runner con
    middleware neutro rispetto al runtime.

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

    Anche i Plugin installati possono registrare middleware per risultati degli strumenti quando sono
    abilitati esplicitamente e dichiarano ogni runtime di destinazione in
    `contracts.agentToolResultMiddleware`. Le registrazioni di middleware installati non dichiarati
    vengono rifiutate.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    I Plugin canale con supporto alle approvazioni ora espongono il comportamento di approvazione nativo tramite
    `approvalCapability.nativeRuntime` più il registro condiviso del contesto runtime.

    Modifiche principali:

    - Sostituisci `approvalCapability.handler.loadRuntime(...)` con
      `approvalCapability.nativeRuntime`
    - Sposta auth/consegna specifici delle approvazioni dal cablaggio legacy `plugin.auth` /
      `plugin.approvals` a `approvalCapability`
    - `ChannelPlugin.approvals` è stato rimosso dal contratto pubblico dei Plugin canale;
      sposta i campi delivery/native/render su `approvalCapability`
    - `plugin.auth` resta solo per i flussi di login/logout del canale; gli hook di auth
      delle approvazioni lì non vengono più letti dal core
    - Registra oggetti runtime di proprietà del canale come client, token o app Bolt
      tramite `openclaw/plugin-sdk/channel-runtime-context`
    - Non inviare avvisi di reinstradamento di proprietà del Plugin dagli handler di approvazione nativi;
      ora il core possiede gli avvisi di instradamento altrove dai risultati effettivi di consegna
    - Quando passi `channelRuntime` in `createChannelManager(...)`, fornisci una
      superficie reale `createPluginRuntime().channel`. Gli stub parziali vengono rifiutati.

    Vedi `/plugins/sdk-channel-plugins` per il layout corrente delle capability di approvazione.

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

    Se il tuo chiamante non dipende intenzionalmente dal fallback shell, non impostare
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
    Ogni export dalla vecchia superficie corrisponde a uno specifico percorso di import moderno:

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
    | helper dello store di sessione | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` esiste ancora per la compatibilità
    esterna, ma il nuovo codice dovrebbe importare la superficie di helper
    mirata di cui ha effettivamente bisogno:

    | Necessità | Import |
    | --- | --- |
    | Helper della coda degli eventi di sistema | `openclaw/plugin-sdk/system-event-runtime` |
    | Helper per risveglio, evento e visibilità Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Svuotamento della coda delle consegne in sospeso | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetria dell'attività del canale | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cache di deduplicazione in memoria | `openclaw/plugin-sdk/dedupe-runtime` |
    | Helper sicuri per percorsi di file/media locali | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch consapevole del dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Helper per proxy e fetch protetto | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipi di criteri del dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipi di richiesta/risoluzione approvazione | `openclaw/plugin-sdk/approval-runtime` |
    | Helper per payload di risposta approvazione e comandi | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helper di formattazione degli errori | `openclaw/plugin-sdk/error-runtime` |
    | Attese di disponibilità del trasporto | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helper per token sicuri | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concorrenza limitata delle attività asincrone | `openclaw/plugin-sdk/concurrency-runtime` |
    | Coercizione numerica | `openclaw/plugin-sdk/number-runtime` |
    | Lock asincrono locale al processo | `openclaw/plugin-sdk/async-lock-runtime` |
    | Lock sui file | `openclaw/plugin-sdk/file-lock` |

    I plugin in bundle sono protetti dallo scanner contro `infra-runtime`, quindi
    il codice del repo non può regredire al barrel ampio.

  </Step>

  <Step title="Migrate channel route helpers">
    Il nuovo codice delle route di canale dovrebbe usare `openclaw/plugin-sdk/channel-route`.
    I nomi precedenti route-key e comparable-target restano come alias di
    compatibilità durante la finestra di migrazione, ma i nuovi plugin dovrebbero usare i nomi
    delle route che descrivono direttamente il comportamento:

    | Vecchio helper | Helper moderno |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Gli helper di route moderni normalizzano `{ channel, to, accountId, threadId }`
    in modo coerente tra approvazioni native, soppressione delle risposte, deduplicazione
    in ingresso, consegna Cron e routing delle sessioni.

    Non aggiungere nuovi utilizzi di `ChannelMessagingAdapter.parseExplicitTarget` o
    degli helper loaded-route basati su parser (`parseExplicitTargetForLoadedChannel`
    o `resolveRouteTargetForLoadedChannel`) o di
    `resolveChannelRouteTargetWithParser(...)` da `plugin-sdk/channel-route`.
    Questi hook sono deprecati e restano solo per i plugin più vecchi durante la
    finestra di migrazione. I nuovi plugin di canale dovrebbero usare
    `messaging.targetResolver.resolveTarget(...)` per la normalizzazione degli ID target
    e il fallback in caso di assenza nella directory, `messaging.inferTargetChatType(...)` quando il core
    ha bisogno anticipatamente del tipo di peer, e `messaging.resolveOutboundSessionRoute(...)`
    per l'identità di sessione e thread nativa del provider.

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Riferimento dei percorsi di import

  <Accordion title="Common import path table">
  | Percorso di importazione | Scopo | Esportazioni principali |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper canonico per entrypoint Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Riesportazione ombrello legacy per definizioni/builder di entrypoint canale | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Esportazione dello schema di configurazione radice | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper di entrypoint per provider singolo | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definizioni e builder mirati per entrypoint canale | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helper condivisi per la procedura guidata di configurazione | Traduttore di configurazione, prompt per allowlist, builder dello stato di configurazione |
  | `plugin-sdk/setup-runtime` | Helper runtime in fase di configurazione | `createSetupTranslator`, adattatori di patch di configurazione sicuri per l'importazione, helper per note di lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy di configurazione delegati |
  | `plugin-sdk/setup-adapter-runtime` | Alias deprecato per adattatore di configurazione | Usa `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Helper per strumenti di configurazione | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper multi-account | Helper per elenco account/configurazione/gate delle azioni |
  | `plugin-sdk/account-id` | Helper per ID account | `DEFAULT_ACCOUNT_ID`, normalizzazione degli ID account |
  | `plugin-sdk/account-resolution` | Helper per lookup account | Helper per lookup account + ripiego predefinito |
  | `plugin-sdk/account-helpers` | Helper account mirati | Helper per elenco account/azioni account |
  | `plugin-sdk/channel-setup` | Adattatori per procedura guidata di configurazione | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive di associazione DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Cablaggio di prefisso di risposta, digitazione e consegna sorgente | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Factory di adattatori di configurazione e helper di accesso DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Builder di schema di configurazione | Primitive condivise dello schema di configurazione canale e solo il builder generico |
  | `plugin-sdk/bundled-channel-config-schema` | Schemi di configurazione in bundle | Solo Plugin in bundle mantenuti da OpenClaw; i nuovi Plugin devono definire schemi locali al Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Schemi di configurazione in bundle deprecati | Solo alias di compatibilità; usa `plugin-sdk/bundled-channel-config-schema` per i Plugin in bundle mantenuti |
  | `plugin-sdk/telegram-command-config` | Helper di configurazione comandi Telegram | Normalizzazione dei nomi comando, rifinitura delle descrizioni, validazione di duplicati/conflitti |
  | `plugin-sdk/channel-policy` | Risoluzione della policy Gruppo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Facciata di compatibilità deprecata | Usa `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Helper per envelope in ingresso | Helper condivisi per route + builder di envelope |
  | `plugin-sdk/channel-inbound` | Helper di ricezione in ingresso | Creazione contesto, formattazione, radici, runner, invio di risposte preparate e predicati di dispatch |
  | `plugin-sdk/messaging-targets` | Percorso di importazione deprecato per parsing dei target | Usa `plugin-sdk/channel-targets` per helper generici di parsing target, `plugin-sdk/channel-route` per confronto route e `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` di proprietà del Plugin per risoluzione target specifica del provider |
  | `plugin-sdk/outbound-media` | Helper media in uscita | Caricamento condiviso dei media in uscita |
  | `plugin-sdk/outbound-send-deps` | Facciata di compatibilità deprecata | Usa `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Helper del ciclo di vita dei messaggi in uscita | Adattatori messaggio, ricevute, helper di invio durevole, helper di anteprima live/streaming, opzioni di risposta, helper del ciclo di vita, identità in uscita e pianificazione payload |
  | `plugin-sdk/channel-streaming` | Facciata di compatibilità deprecata | Usa `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Facciata di compatibilità deprecata | Usa `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Helper di associazione thread | Ciclo di vita dell'associazione thread e helper adattatore |
  | `plugin-sdk/agent-media-payload` | Helper payload media legacy | Builder di payload media agente per layout di campi legacy |
  | `plugin-sdk/channel-runtime` | Shim di compatibilità deprecato | Solo utilità runtime canale legacy |
  | `plugin-sdk/channel-send-result` | Tipi risultato invio | Tipi risultato risposta |
  | `plugin-sdk/runtime-store` | Archiviazione persistente Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helper runtime ampi | Helper per runtime/logging/backup/installazione Plugin |
  | `plugin-sdk/runtime-env` | Helper mirati per ambiente runtime | Helper per logger/ambiente runtime, timeout, ritento e backoff |
  | `plugin-sdk/plugin-runtime` | Helper runtime Plugin condivisi | Helper per comandi/hook/http/interattività del Plugin |
  | `plugin-sdk/hook-runtime` | Helper pipeline hook | Helper condivisi per pipeline Webhook/hook interni |
  | `plugin-sdk/lazy-runtime` | Helper runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper di processo | Helper exec condivisi |
  | `plugin-sdk/cli-runtime` | Helper runtime CLI | Formattazione comandi, attese, helper versione |
  | `plugin-sdk/gateway-runtime` | Helper Gateway | Client Gateway, helper di avvio pronto per event loop, risoluzione dell'host LAN annunciato e helper per patch dello stato canale |
  | `plugin-sdk/config-runtime` | Shim di compatibilità configurazione deprecato | Preferisci `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` e `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Helper comandi Telegram | Helper di validazione dei comandi Telegram stabili con ripiego quando la superficie contrattuale del Telegram in bundle non è disponibile |
  | `plugin-sdk/approval-runtime` | Helper prompt di approvazione | Payload approvazione exec/Plugin, helper per capacità/profilo di approvazione, helper nativi per routing/runtime approvazione e formattazione strutturata del percorso di visualizzazione approvazione |
  | `plugin-sdk/approval-auth-runtime` | Helper auth approvazione | Risoluzione dell'approvatore, auth azione nella stessa chat |
  | `plugin-sdk/approval-client-runtime` | Helper client approvazione | Helper nativi per profilo/filtro approvazione exec |
  | `plugin-sdk/approval-delivery-runtime` | Helper consegna approvazione | Adattatori nativi per capacità/consegna approvazione |
  | `plugin-sdk/approval-gateway-runtime` | Helper Gateway approvazione | Helper condiviso per risoluzione Gateway approvazione |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper adattatore approvazione | Helper leggeri per caricamento adattatore approvazione nativo per entrypoint canale caldi |
  | `plugin-sdk/approval-handler-runtime` | Helper handler approvazione | Helper runtime più ampi per handler approvazione; preferisci i punti di integrazione adattatore/Gateway più mirati quando bastano |
  | `plugin-sdk/approval-native-runtime` | Helper target approvazione | Helper nativi per associazione target/account di approvazione |
  | `plugin-sdk/approval-reply-runtime` | Helper risposta approvazione | Helper payload risposta approvazione exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Helper contesto runtime canale | Helper generici per registrazione/lettura/osservazione del contesto runtime canale |
  | `plugin-sdk/security-runtime` | Helper sicurezza | Helper condivisi per fiducia, gating DM, file/percorsi limitati alla radice, contenuti esterni e raccolta segreti |
  | `plugin-sdk/ssrf-policy` | Helper policy SSRF | Helper per allowlist host e policy di rete privata |
  | `plugin-sdk/ssrf-runtime` | Helper runtime SSRF | Dispatcher fissato, fetch protetto, helper policy SSRF |
  | `plugin-sdk/system-event-runtime` | Helper eventi di sistema | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Helper Heartbeat | Helper per risveglio, evento e visibilità Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Helper coda di consegna | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Helper attività canale | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Helper deduplicazione | Cache di deduplicazione in memoria |
  | `plugin-sdk/file-access-runtime` | Helper accesso file | Helper sicuri per percorsi file/media locali |
  | `plugin-sdk/transport-ready-runtime` | Helper prontezza trasporto | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Helper policy approvazione exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Helper cache limitata | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper gating diagnostico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper formattazione errori | `formatUncaughtError`, `isApprovalNotFoundError`, helper grafo errori |
  | `plugin-sdk/fetch-runtime` | Helper fetch/proxy con wrapper | `resolveFetch`, helper proxy, helper opzioni EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Helper normalizzazione host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper ritento | `RetryConfig`, `retryAsync`, runner di policy |
  | `plugin-sdk/allow-from` | Formattazione allowlist e mappatura input | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Helper per gating comandi e superficie comandi | `resolveControlCommandGate`, helper autorizzazione mittente, helper registro comandi inclusa la formattazione dinamica del menu argomenti |
  | `plugin-sdk/command-status` | Renderer stato/aiuto comandi | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing input segreti | Helper input segreti |
  | `plugin-sdk/webhook-ingress` | Helper richiesta Webhook | Utilità target Webhook |
  | `plugin-sdk/webhook-request-guards` | Helper protezione corpo Webhook | Helper lettura/limite corpo richiesta |
  | `plugin-sdk/reply-runtime` | Runtime risposta condiviso | Dispatch in ingresso, Heartbeat, planner risposte, suddivisione in blocchi |
  | `plugin-sdk/reply-dispatch-runtime` | Helper mirati per dispatch risposta | Finalizzazione, dispatch provider e helper etichetta conversazione |
  | `plugin-sdk/reply-history` | Helper cronologia risposte | `createChannelHistoryWindow`; esportazioni di compatibilità deprecate per helper mappa come `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Pianificazione riferimenti risposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper blocchi risposta | Helper suddivisione testo/markdown in blocchi |
  | `plugin-sdk/session-store-runtime` | Helper archivio sessione | Helper percorso archivio + aggiornato-il |
  | `plugin-sdk/state-paths` | Helper percorsi stato | Helper directory stato e OAuth |
  | `plugin-sdk/routing` | Helper per routing/chiavi di sessione | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper di normalizzazione delle chiavi di sessione |
  | `plugin-sdk/status-helpers` | Helper per lo stato dei canali | Builder di riepilogo dello stato di canali/account, valori predefiniti dello stato runtime, helper per i metadati dei problemi |
  | `plugin-sdk/target-resolver-runtime` | Helper per il risolutore di destinazione | Helper condivisi per il risolutore di destinazione |
  | `plugin-sdk/string-normalization-runtime` | Helper di normalizzazione delle stringhe | Helper di normalizzazione di slug/stringhe |
  | `plugin-sdk/request-url` | Helper per URL di richiesta | Estrai URL stringa da input simili a richieste |
  | `plugin-sdk/run-command` | Helper per comandi temporizzati | Esecutore di comandi temporizzati con stdout/stderr normalizzati |
  | `plugin-sdk/param-readers` | Lettori di parametri | Lettori comuni di parametri per tool/CLI |
  | `plugin-sdk/tool-payload` | Estrazione del payload del tool | Estrai payload normalizzati da oggetti risultato del tool |
  | `plugin-sdk/tool-send` | Estrazione dell'invio del tool | Estrai campi di destinazione di invio canonici dagli argomenti del tool |
  | `plugin-sdk/temp-path` | Helper per percorsi temporanei | Helper condivisi per percorsi di download temporanei |
  | `plugin-sdk/logging-core` | Helper di logging | Logger di sottosistema e helper di oscuramento |
  | `plugin-sdk/markdown-table-runtime` | Helper per tabelle Markdown | Helper per modalità tabella Markdown |
  | `plugin-sdk/reply-payload` | Tipi di risposta ai messaggi | Tipi di payload di risposta |
  | `plugin-sdk/provider-setup` | Helper curati per la configurazione di provider locali/self-hosted | Helper di discovery/configurazione per provider self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Helper mirati per la configurazione di provider self-hosted compatibili con OpenAI | Gli stessi helper di discovery/configurazione per provider self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Helper di autenticazione runtime dei provider | Helper di risoluzione runtime delle chiavi API |
  | `plugin-sdk/provider-auth-api-key` | Helper di configurazione delle chiavi API dei provider | Helper di onboarding/scrittura profili per chiavi API |
  | `plugin-sdk/provider-auth-result` | Helper per risultati di autenticazione dei provider | Builder standard di risultati di autenticazione OAuth |
  | `plugin-sdk/provider-selection-runtime` | Helper di selezione dei provider | Selezione provider configurato o automatica e unione della configurazione provider grezza |
  | `plugin-sdk/provider-env-vars` | Helper per variabili d'ambiente dei provider | Helper di lookup delle variabili d'ambiente di autenticazione dei provider |
  | `plugin-sdk/provider-model-shared` | Helper condivisi per modello/replay dei provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi per policy di replay, helper per endpoint provider e helper di normalizzazione degli ID modello |
  | `plugin-sdk/provider-catalog-shared` | Helper condivisi per il catalogo dei provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch di onboarding dei provider | Helper di configurazione dell'onboarding |
  | `plugin-sdk/provider-http` | Helper HTTP dei provider | Helper generici per funzionalità HTTP/endpoint dei provider, inclusi helper per moduli multipart di trascrizione audio |
  | `plugin-sdk/provider-web-fetch` | Helper web-fetch dei provider | Helper di registrazione/cache dei provider web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helper di configurazione web-search dei provider | Helper ristretti per configurazione/credenziali web-search per provider che non richiedono cablaggio di abilitazione Plugin |
  | `plugin-sdk/provider-web-search-contract` | Helper del contratto web-search dei provider | Helper ristretti del contratto di configurazione/credenziali web-search come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con ambito |
  | `plugin-sdk/provider-web-search` | Helper web-search dei provider | Helper runtime/registrazione/cache dei provider web-search |
  | `plugin-sdk/provider-tools` | Helper di compatibilità tool/schema dei provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` e pulizia schema + diagnostica DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Helper di utilizzo dei provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e altri helper di utilizzo dei provider |
  | `plugin-sdk/provider-stream` | Helper wrapper per stream dei provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi wrapper di stream e helper wrapper condivisi Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helper di trasporto dei provider | Helper di trasporto nativo dei provider come fetch protetto, estrazione del testo dei risultati tool, trasformazioni dei messaggi di trasporto e stream di eventi di trasporto scrivibili |
  | `plugin-sdk/keyed-async-queue` | Coda asincrona ordinata | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helper multimediali condivisi | Helper di recupero/trasformazione/archiviazione media, rilevamento dimensioni video basato su ffprobe e builder di payload media |
  | `plugin-sdk/media-generation-runtime` | Helper condivisi di generazione media | Helper condivisi di failover, selezione candidati e messaggistica per modello mancante per la generazione di immagini/video/musica |
  | `plugin-sdk/media-understanding` | Helper di comprensione dei media | Tipi di provider per comprensione dei media più esportazioni di helper immagine/audio rivolte ai provider |
  | `plugin-sdk/text-runtime` | Esportazione ampia deprecata di compatibilità testo | Usa `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` e `logging-core` |
  | `plugin-sdk/text-chunking` | Helper di suddivisione del testo | Helper di suddivisione del testo in uscita |
  | `plugin-sdk/speech` | Helper vocali | Tipi di provider vocali più helper rivolti ai provider per direttive, registro, validazione e builder TTS compatibile con OpenAI |
  | `plugin-sdk/speech-core` | Core vocale condiviso | Tipi di provider vocali, registro, direttive, normalizzazione |
  | `plugin-sdk/realtime-transcription` | Helper di trascrizione in tempo reale | Tipi di provider, helper di registro e helper condiviso per sessione WebSocket |
  | `plugin-sdk/realtime-voice` | Helper vocali in tempo reale | Tipi di provider, helper di registro/risoluzione, helper di sessione bridge, code condivise di risposta vocale dell'agente, controllo vocale dell'esecuzione attiva, integrità di trascritti/eventi, soppressione dell'eco, corrispondenza delle domande di consultazione, coordinamento della consultazione forzata, tracciamento del contesto di turno, tracciamento dell'attività di output e helper di consultazione rapida del contesto |
  | `plugin-sdk/image-generation` | Helper di generazione immagini | Tipi di provider di generazione immagini più helper per asset immagine/data URL e builder di provider immagini compatibile con OpenAI |
  | `plugin-sdk/image-generation-core` | Core condiviso di generazione immagini | Tipi di generazione immagini, failover, autenticazione e helper di registro |
  | `plugin-sdk/music-generation` | Helper di generazione musica | Tipi di provider/richiesta/risultato per generazione musica |
  | `plugin-sdk/music-generation-core` | Core condiviso di generazione musica | Tipi di generazione musica, helper di failover, lookup dei provider e parsing dei riferimenti modello |
  | `plugin-sdk/video-generation` | Helper di generazione video | Tipi di provider/richiesta/risultato per generazione video |
  | `plugin-sdk/video-generation-core` | Core condiviso di generazione video | Tipi di generazione video, helper di failover, lookup dei provider e parsing dei riferimenti modello |
  | `plugin-sdk/interactive-runtime` | Helper di risposta interattiva | Normalizzazione/riduzione del payload di risposta interattiva |
  | `plugin-sdk/channel-config-primitives` | Primitive di configurazione canale | Primitive ristrette dello schema di configurazione canale |
  | `plugin-sdk/channel-config-writes` | Helper di scrittura configurazione canale | Helper di autorizzazione alla scrittura della configurazione canale |
  | `plugin-sdk/channel-plugin-common` | Prelude condiviso dei canali | Esportazioni prelude condivise per Plugin di canale |
  | `plugin-sdk/channel-status` | Helper di stato canale | Helper condivisi di snapshot/riepilogo dello stato canale |
  | `plugin-sdk/allowlist-config-edit` | Helper di configurazione allowlist | Helper di modifica/lettura della configurazione allowlist |
  | `plugin-sdk/group-access` | Helper di accesso ai gruppi | Helper condivisi per decisioni di accesso ai gruppi |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Facciate di compatibilità deprecate | Usa `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Helper di protezione Direct-DM | Helper ristretti di policy di protezione pre-crypto |
  | `plugin-sdk/extension-shared` | Helper condivisi per estensioni | Primitive per helper di canale passivo/stato e proxy ambientale |
  | `plugin-sdk/webhook-targets` | Helper di destinazione Webhook | Registro destinazioni Webhook e helper di installazione route |
  | `plugin-sdk/webhook-path` | Alias deprecato del percorso webhook | Usa `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Helper condivisi per media web | Helper di caricamento media remoti/locali |
  | `plugin-sdk/zod` | Riesportazione deprecata di compatibilità Zod | Importa `zod` da `zod` direttamente |
  | `plugin-sdk/memory-core` | Helper memory-core in bundle | Superficie helper per memory manager/configurazione/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Facciata runtime del motore memoria | Facciata runtime di indicizzazione/ricerca della memoria |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registro degli embedding di memoria | Helper leggeri del registro provider di embedding di memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motore foundation dell'host memoria | Esportazioni del motore foundation dell'host memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motore embedding dell'host memoria | Contratti di embedding memoria, accesso al registro, provider locale e helper generici batch/remoti; i provider remoti concreti risiedono nei rispettivi Plugin proprietari |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motore QMD dell'host memoria | Esportazioni del motore QMD dell'host memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motore di archiviazione dell'host memoria | Esportazioni del motore di archiviazione dell'host memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali dell'host memoria | Helper multimodali dell'host memoria |
  | `plugin-sdk/memory-core-host-query` | Helper di query dell'host memoria | Helper di query dell'host memoria |
  | `plugin-sdk/memory-core-host-secret` | Helper segreti dell'host memoria | Helper segreti dell'host memoria |
  | `plugin-sdk/memory-core-host-events` | Alias deprecato degli eventi memoria | Usa `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Helper di stato dell'host memoria | Helper di stato dell'host memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI dell'host memoria | Helper runtime CLI dell'host memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime core dell'host memoria | Helper runtime core dell'host memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime dell'host memoria | Helper file/runtime dell'host memoria |
  | `plugin-sdk/memory-host-core` | Alias del runtime core dell'host memoria | Alias indipendente dal vendor per gli helper runtime core dell'host memoria |
  | `plugin-sdk/memory-host-events` | Alias del registro eventi dell'host memoria | Alias indipendente dal vendor per gli helper del registro eventi dell'host memoria |
  | `plugin-sdk/memory-host-files` | Alias deprecato file/runtime memoria | Usa `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Helper Markdown gestito | Helper condivisi per Markdown gestito per Plugin adiacenti alla memoria |
  | `plugin-sdk/memory-host-search` | Facciata di ricerca Active Memory | Facciata runtime lazy del gestore ricerca Active Memory |
  | `plugin-sdk/memory-host-status` | Alias deprecato di stato dell'host memoria | Usa `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Utilità di test | Barrel di compatibilità deprecato locale al repo; usa sottopercorsi di test mirati locali al repo come `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` e `plugin-sdk/test-fixtures` |
</Accordion>

Questa tabella è intenzionalmente il sottoinsieme comune di migrazione, non l'intera
superficie dell'SDK. L'inventario degli entrypoint del compilatore si trova in
`scripts/lib/plugin-sdk-entrypoints.json`; gli export del pacchetto sono generati dal
sottoinsieme pubblico.

Le interfacce helper riservate per i Plugin in bundle sono state rimosse dalla mappa
degli export dell'SDK pubblico, tranne le facciate di compatibilità documentate
esplicitamente, come lo shim deprecato `plugin-sdk/discord` mantenuto per il pacchetto
pubblicato `@openclaw/discord@2026.3.13`. Gli helper specifici del proprietario vivono
all'interno del pacchetto del Plugin proprietario; il comportamento host condiviso deve
passare attraverso contratti SDK generici come `plugin-sdk/gateway-runtime`,
`plugin-sdk/security-runtime` e `plugin-sdk/plugin-config-runtime`.

Usa l'import più ristretto adatto al lavoro. Se non trovi un export,
controlla il sorgente in `src/plugin-sdk/` o chiedi ai maintainer quale contratto
generico dovrebbe possederlo.

## Deprecazioni attive

Deprecazioni più ristrette che si applicano all'intero SDK dei Plugin, al contratto
dei provider, alla superficie runtime e al manifest. Ognuna funziona ancora oggi, ma
sarà rimossa in una futura release major. La voce sotto ogni elemento mappa la vecchia
API alla sua sostituzione canonica.

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

    I Plugin di canale downstream (Slack, Discord, Matrix, MS Teams) hanno già
    effettuato il passaggio.

  </Accordion>

  <Accordion title="Shim runtime di canale e helper delle azioni di canale">
    `openclaw/plugin-sdk/channel-runtime` è uno shim di compatibilità per i vecchi
    Plugin di canale. Non importarlo dal nuovo codice; usa
    `openclaw/plugin-sdk/channel-runtime-context` per registrare gli oggetti
    runtime.

    Gli helper `channelActions*` in `openclaw/plugin-sdk/channel-actions` sono
    deprecati insieme agli export di canale "actions" grezzi. Esponi invece le
    capacità tramite la superficie semantica `presentation` - i Plugin di canale
    dichiarano ciò che renderizzano (schede, pulsanti, selezioni) anziché quali
    nomi di azione grezzi accettano.

  </Accordion>

  <Accordion title="Helper tool() del provider di ricerca web → createTool() sul Plugin">
    **Vecchio**: factory `tool()` da `openclaw/plugin-sdk/provider-web-search`.

    **Nuovo**: implementa `createTool(...)` direttamente sul Plugin provider.
    OpenClaw non ha più bisogno dell'helper SDK per registrare il wrapper dello strumento.

  </Accordion>

  <Accordion title="Envelope di canale in testo semplice → BodyForAgent">
    **Vecchio**: `formatInboundEnvelope(...)` (e
    `ChannelMessageForAgent.channelEnvelope`) per costruire un envelope prompt
    piatto in testo semplice dai messaggi di canale in ingresso.

    **Nuovo**: `BodyForAgent` più blocchi strutturati di contesto utente. I Plugin
    di canale collegano i metadati di routing (thread, argomento, risposta-a, reazioni) come
    campi tipizzati invece di concatenarli in una stringa prompt. L'helper
    `formatAgentEnvelope(...)` è ancora supportato per envelope sintetizzati
    rivolti all'assistente, ma gli envelope in ingresso in testo semplice sono in
    dismissione.

    Aree interessate: `inbound_claim`, `message_received` e qualsiasi Plugin
    di canale personalizzato che post-elaborava il testo `channelEnvelope`.

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

    `deactivate` resta collegato come alias di compatibilità deprecato fino a dopo
    il 2026-08-16.

  </Accordion>

  <Accordion title="Hook subagent_spawning → binding del thread core">
    **Vecchio**: `api.on("subagent_spawning", handler)` che restituisce
    `threadBindingReady` o `deliveryOrigin`.

    **Nuovo**: lascia che il core prepari i binding dei subagenti `thread: true` tramite
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
    superfici di compatibilità deprecate mentre i Plugin esterni migrano.

  </Accordion>

  <Accordion title="Tipi di discovery dei provider → tipi di catalogo dei provider">
    Quattro alias di tipi di discovery sono ora wrapper sottili sui tipi
    dell'era del catalogo:

    | Vecchio alias             | Nuovo tipo                |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Inoltre il contenitore statico legacy `ProviderCapabilities` - i Plugin
    provider devono usare hook provider espliciti come `buildReplayPolicy`,
    `normalizeToolSchemas` e `wrapStreamFn` anziché un oggetto statico.

  </Accordion>

  <Accordion title="Hook della policy di pensiero → resolveThinkingProfile">
    **Vecchio** (tre hook separati su `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` e
    `resolveDefaultThinkingLevel(ctx)`.

    **Nuovo**: un singolo `resolveThinkingProfile(ctx)` che restituisce un
    `ProviderThinkingProfile` con l'`id` canonico, `label` opzionale e
    lista di livelli ordinata per rango. OpenClaw declassa automaticamente i valori
    memorizzati obsoleti in base al rango del profilo.

    Il contesto include `provider`, `modelId`, `reasoning` unito opzionale
    e fatti `compat` del modello uniti opzionali. I Plugin provider possono usare quei
    fatti del catalogo per esporre un profilo specifico del modello solo quando il
    contratto della richiesta configurata lo supporta.

    Implementa un hook invece di tre. Gli hook legacy continuano a funzionare durante
    la finestra di deprecazione, ma non vengono composti con il risultato del profilo.

  </Accordion>

  <Accordion title="Provider di autenticazione esterni → contracts.externalAuthProviders">
    **Vecchio**: implementare hook di autenticazione esterni senza dichiarare il provider
    nel manifest del Plugin.

    **Nuovo**: dichiara `contracts.externalAuthProviders` nel manifest del Plugin
    **e** implementa `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Lookup env-var del provider → setup.providers[].envVars">
    **Vecchio** campo del manifest: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nuovo**: rispecchia lo stesso lookup env-var in `setup.providers[].envVars`
    sul manifest. Questo consolida i metadati env di setup/status in un unico
    punto ed evita di avviare il runtime del Plugin solo per rispondere ai
    lookup env-var.

    `providerAuthEnvVars` resta supportato tramite un adapter di compatibilità
    finché la finestra di deprecazione non si chiude.

  </Accordion>

  <Accordion title="Registrazione del Plugin di memoria → registerMemoryCapability">
    **Vecchio**: tre chiamate separate -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nuovo**: una chiamata sull'API dello stato di memoria -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Stessi slot, singola chiamata di registrazione. Gli helper additivi di prompt e corpus
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) non sono
    interessati.

  </Accordion>

  <Accordion title="API del provider di embedding della memoria">
    **Vecchio**: `api.registerMemoryEmbeddingProvider(...)` più
    `contracts.memoryEmbeddingProviders`.

    **Nuovo**: `api.registerEmbeddingProvider(...)` più
    `contracts.embeddingProviders`.

    Il contratto generico del provider di embedding è riutilizzabile al di fuori della memoria ed è
    il percorso supportato per i nuovi provider. L'API di registrazione specifica della memoria
    resta collegata come compatibilità deprecata mentre i provider esistenti migrano.
    L'ispezione dei Plugin segnala l'uso non in bundle come debito di compatibilità.

  </Accordion>

  <Accordion title="Tipi dei messaggi di sessione dei subagenti rinominati">
    Due alias di tipi legacy ancora esportati da `src/plugins/runtime/types.ts`:

    | Vecchio                     | Nuovo                           |
    | --------------------------- | ------------------------------- |
    | `SubagentReadSessionParams` | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult` | `SubagentGetSessionMessagesResult` |

    Il metodo runtime `readSession` è deprecato a favore di
    `getSessionMessages`. Stessa firma; il vecchio metodo delega al nuovo.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Vecchio**: `runtime.tasks.flow` (singolare) restituiva un accessor task-flow live.

    **Nuovo**: `runtime.tasks.managedFlows` mantiene il runtime di mutazione TaskFlow
    gestito per i Plugin che creano, aggiornano, annullano o eseguono attività figlie da un
    flow. Usa `runtime.tasks.flows` quando al Plugin servono solo letture basate su DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Factory di estensioni integrate → middleware dei risultati strumento dell'agente">
    Trattato in "Come migrare → Migrare le estensioni integrate dei risultati strumento al
    middleware" sopra. Incluso qui per completezza: il percorso rimosso solo per embedded-runner
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
Le deprecazioni a livello di estensione (all'interno dei Plugin di canale/provider in bundle sotto
`extensions/`) sono tracciate nei rispettivi barrel `api.ts` e `runtime-api.ts`.
Non influenzano i contratti dei Plugin di terze parti e non sono elencate
qui. Se consumi direttamente il barrel locale di un Plugin in bundle, leggi i
commenti di deprecazione in quel barrel prima di aggiornare.
</Note>

## Timeline di rimozione

| Quando                 | Cosa succede                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **Ora**                | Le superfici deprecate emettono avvisi in fase di esecuzione            |
| **Prossima major release** | Le superfici deprecate verranno rimosse; i plugin che le usano ancora non funzioneranno |

Tutti i plugin core sono già stati migrati. I plugin esterni dovrebbero migrare
prima della prossima major release.

## Soppressione temporanea degli avvisi

Imposta queste variabili d'ambiente mentre lavori alla migrazione:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Questa è una via d'uscita temporanea, non una soluzione permanente.

## Correlati

- [Guida introduttiva](/it/plugins/building-plugins) - crea il tuo primo plugin
- [Panoramica dell'SDK](/it/plugins/sdk-overview) - riferimento completo degli import di sottopercorsi
- [Plugin di canale](/it/plugins/sdk-channel-plugins) - creazione di plugin di canale
- [Plugin provider](/it/plugins/sdk-provider-plugins) - creazione di plugin provider
- [Dettagli interni dei plugin](/it/plugins/architecture) - approfondimento sull'architettura
- [Manifest dei plugin](/it/plugins/manifest) - riferimento dello schema del manifest
