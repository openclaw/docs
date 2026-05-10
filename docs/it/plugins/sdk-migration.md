---
read_when:
    - Viene visualizzato l'avviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Visualizzi l'avviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Hai usato api.registerEmbeddedExtensionFactory prima di OpenClaw 2026.4.25
    - Stai aggiornando un Plugin all'architettura moderna dei Plugin
    - Gestisci un Plugin OpenClaw esterno
sidebarTitle: Migrate to SDK
summary: Migrare dal livello legacy di retrocompatibilità al moderno SDK dei Plugin
title: Migrazione del Plugin SDK
x-i18n:
    generated_at: "2026-05-10T19:46:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7595b41c15ce36dd8d2a3faf320cc9847b013b1f4807c02b8b97c6feaee4415
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw è passato da un ampio livello di compatibilità retroattiva a una moderna architettura a plugin
con import focalizzati e documentati. Se il tuo plugin è stato creato prima
della nuova architettura, questa guida ti aiuta a migrarlo.

## Cosa cambia

Il vecchio sistema di plugin forniva due superfici molto aperte che consentivano ai plugin di importare
tutto ciò di cui avevano bisogno da un unico punto di ingresso:

- **`openclaw/plugin-sdk/compat`** - un singolo import che riesportava decine di
  helper. È stato introdotto per mantenere funzionanti i plugin più vecchi basati su hook mentre
  veniva costruita la nuova architettura a plugin.
- **`openclaw/plugin-sdk/infra-runtime`** - un ampio barrel di helper runtime che
  mescolava eventi di sistema, stato Heartbeat, code di consegna, helper fetch/proxy,
  helper per file, tipi di approvazione e utility non correlate.
- **`openclaw/plugin-sdk/config-runtime`** - un ampio barrel di compatibilità della configurazione
  che contiene ancora helper diretti di caricamento/scrittura deprecati durante la finestra di migrazione.
- **`openclaw/extension-api`** - un bridge che forniva ai plugin accesso diretto agli
  helper lato host, come il runner agente incorporato.
- **`api.registerEmbeddedExtensionFactory(...)`** - un hook di estensione in bundle solo per Pi
  rimosso che poteva osservare eventi dell'embedded-runner come
  `tool_result`.

Le ampie superfici di import sono ora **deprecate**. Funzionano ancora a runtime,
ma i nuovi plugin non devono usarle, e i plugin esistenti dovrebbero migrare prima
che la prossima release major le rimuova. L'API di registrazione dell'embedded extension factory
solo per Pi è stata rimossa; usa invece il middleware dei risultati degli strumenti.

OpenClaw non rimuove né reinterpreta il comportamento documentato dei plugin nello stesso
cambiamento che introduce un sostituto. Le modifiche incompatibili al contratto devono prima passare
attraverso un adapter di compatibilità, diagnostica, documentazione e una finestra di deprecazione.
Questo vale per import SDK, campi del manifest, API di setup, hook e comportamento di
registrazione runtime.

<Warning>
  Il livello di compatibilità retroattiva verrà rimosso in una futura release major.
  I plugin che importano ancora da queste superfici si romperanno quando accadrà.
  Le registrazioni dell'embedded extension factory solo per Pi già non vengono più caricate.
</Warning>

## Perché è cambiato

Il vecchio approccio causava problemi:

- **Avvio lento** - importare un helper caricava decine di moduli non correlati
- **Dipendenze circolari** - le ampie riesportazioni rendevano facile creare cicli di import
- **Superficie API poco chiara** - non c'era modo di capire quali export fossero stabili e quali interni

Il moderno SDK per plugin risolve questo problema: ogni percorso di import (`openclaw/plugin-sdk/\<subpath\>`)
è un modulo piccolo, autonomo, con uno scopo chiaro e un contratto documentato.

Anche le seam legacy di comodità dei provider per i canali in bundle sono state rimosse.
Le seam helper brandizzate per canale erano scorciatoie private del mono-repo, non contratti
stabili per plugin. Usa invece sottopercorsi SDK generici e ristretti. All'interno del workspace dei plugin
in bundle, mantieni gli helper di proprietà del provider nel `api.ts` o
`runtime-api.ts` del plugin stesso.

Esempi attuali di provider in bundle:

- Anthropic mantiene gli helper di stream specifici per Claude nella propria seam `api.ts` /
  `contract-api.ts`
- OpenAI mantiene provider builder, helper per modelli predefiniti e builder di provider realtime
  nel proprio `api.ts`
- OpenRouter mantiene provider builder e helper di onboarding/configurazione nel proprio
  `api.ts`

## Piano di migrazione per Talk e voce realtime

Il codice Talk per voce realtime, telefonia, riunioni e browser si sta spostando dalla
contabilità dei turni locale alla superficie a un controller condiviso di sessione Talk esportato da
`openclaw/plugin-sdk/realtime-voice`. Il nuovo controller possiede l'envelope comune degli eventi Talk,
lo stato del turno attivo, lo stato di acquisizione, lo stato dell'audio in uscita, la cronologia recente
degli eventi e il rifiuto dei turni obsoleti. I plugin provider dovrebbero continuare a possedere
le sessioni realtime specifiche del vendor; i plugin di superficie dovrebbero continuare a possedere acquisizione,
riproduzione, telefonia e particolarità delle riunioni.

Questa migrazione di Talk è intenzionalmente incompatibile e pulita:

1. Mantieni le primitive condivise di controller/runtime in
   `plugin-sdk/realtime-voice`.
2. Sposta le superfici in bundle sul controller condiviso: browser relay,
   handoff managed-room, voice-call realtime, voice-call streaming STT, Google
   Meet realtime e push-to-talk nativo.
3. Sostituisci le vecchie famiglie RPC di Talk con l'API finale `talk.session.*` e
   `talk.client.*`.
4. Pubblicizza un unico canale di eventi Talk live in Gateway
   `hello-ok.features.events`: `talk.event`.
5. Elimina il vecchio endpoint HTTP realtime e qualsiasi percorso di override
   delle istruzioni al momento della richiesta.

Il nuovo codice non dovrebbe chiamare direttamente `createTalkEventSequencer(...)`, salvo che stia
implementando un adapter di basso livello o una fixture di test. Preferisci il controller condiviso
così gli eventi con scope di turno non possono essere emessi senza un id di turno, le chiamate obsolete
`turnEnd` /
`turnCancel` non possono cancellare un turno attivo più recente, e gli eventi del ciclo di vita dell'audio
in uscita restano coerenti tra telefonia, riunioni, browser relay, handoff managed-room
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
```

Le sessioni WebRTC/provider-websocket di proprietà del browser usano `talk.client.create`,
perché il browser possiede la negoziazione del provider e il trasporto media, mentre il
Gateway possiede credenziali, istruzioni e policy degli strumenti. `talk.session.*` è la
superficie comune gestita dal Gateway per sessioni realtime gateway-relay, trascrizione
gateway-relay e STT/TTS native managed-room.

Le configurazioni legacy che mettevano selettori realtime accanto a `talk.provider` /
`talk.providers` dovrebbero essere riparate con `openclaw doctor --fix`; Talk a runtime
non reinterpreta la configurazione del provider speech/TTS come configurazione del provider realtime.

Le combinazioni supportate di `talk.session.create` sono intenzionalmente ridotte:

| Modalità        | Trasporto       | Brain           | Proprietario       | Note                                                                                                               |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio provider full-duplex bridged tramite il Gateway; le chiamate agli strumenti vengono instradate attraverso lo strumento agent-consult. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Solo STT in streaming; i chiamanti inviano audio in input e ricevono eventi di trascrizione.                       |
| `stt-tts`       | `managed-room`  | `agent-consult` | Stanza nativa/client | Stanze in stile push-to-talk e walkie-talkie dove il client possiede acquisizione/riproduzione e il Gateway possiede lo stato del turno. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Stanza nativa/client | Modalità stanza solo admin per superfici first-party affidabili che eseguono direttamente azioni strumento del Gateway. |

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
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Accoda un chunk audio PCM base64 alla sessione provider posseduta dalla stessa connessione Gateway.                                                                                      |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Avvia un turno utente managed-room.                                                                                                                                                      |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Termina il turno attivo dopo la validazione del turno obsoleto.                                                                                                                         |
| `talk.session.cancelTurn`       | tutte le sessioni di proprietà del Gateway              | Annulla il lavoro attivo di acquisizione/provider/agente/TTS per un turno.                                                                                                               |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Interrompe l'output audio dell'assistente senza necessariamente terminare il turno utente.                                                                                               |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Completa una chiamata a strumento del provider emessa dal relay; passa `options.willContinue` per output intermedio o `options.suppressResponse` per soddisfare la chiamata senza un'altra risposta dell'assistente. |
| `talk.session.close`            | tutte le sessioni unificate                             | Interrompe le sessioni relay o revoca lo stato managed-room, poi dimentica l'id della sessione unificata.                                                                               |

  Non introdurre casi speciali per provider o piattaforme nel core per far funzionare questo.
  Il core possiede la semantica delle sessioni Talk. I Plugin provider possiedono la configurazione delle sessioni dei vendor.
  Le chiamate vocali e Google Meet possiedono gli adattatori di telefonia/riunione. Browser e app native
  possiedono l'esperienza utente di acquisizione/riproduzione del dispositivo.

  ## Criterio di compatibilità

  Per i Plugin esterni, il lavoro di compatibilità segue questo ordine:

  1. aggiungere il nuovo contratto
  2. mantenere il vecchio comportamento collegato tramite un adattatore di compatibilità
  3. emettere una diagnostica o un avviso che indichi il vecchio percorso e il sostituto
  4. coprire entrambi i percorsi nei test
  5. documentare la deprecazione e il percorso di migrazione
  6. rimuovere solo dopo la finestra di migrazione annunciata, di solito in una release major

  I maintainer possono verificare la coda di migrazione corrente con
  `pnpm plugins:boundary-report`. Usa `pnpm plugins:boundary-report:summary` per
  conteggi compatti, `--owner <id>` per un Plugin o un proprietario di compatibilità, e
  `pnpm plugins:boundary-report:ci` quando un gate CI deve fallire su record di
  compatibilità scaduti, import SDK riservati tra proprietari o sottopercorsi SDK
  riservati inutilizzati. Il report raggruppa i record di compatibilità
  deprecati per data di rimozione, conta i riferimenti locali in codice/docs,
  evidenzia gli import SDK riservati tra proprietari e riassume il bridge SDK
  privato dell'host di memoria, così la pulizia della compatibilità resta esplicita invece di
  affidarsi a ricerche ad hoc. I sottopercorsi SDK riservati devono avere un uso del proprietario tracciato;
  gli export di helper riservati inutilizzati devono essere rimossi dall'SDK pubblico.

  Se un campo manifest è ancora accettato, gli autori di Plugin possono continuare a usarlo finché
  la documentazione e le diagnostiche non dicono altrimenti. Il nuovo codice dovrebbe preferire il sostituto
  documentato, ma i Plugin esistenti non dovrebbero rompersi durante le normali
  release minor.

  ## Come migrare

  <Steps>
  <Step title="Migra gli helper di caricamento/scrittura della configurazione runtime">
    I Plugin inclusi dovrebbero smettere di chiamare direttamente
    `api.runtime.config.loadConfig()` e
    `api.runtime.config.writeConfigFile(...)`. Preferisci la configurazione che è
    già stata passata nel percorso di chiamata attivo. Gli handler a lunga durata che hanno bisogno dello
    snapshot del processo corrente possono usare `api.runtime.config.current()`. Gli strumenti agent a lunga durata
    dovrebbero usare `ctx.getRuntimeConfig()` del contesto dello strumento dentro
    `execute`, così uno strumento creato prima di una scrittura della configurazione vede comunque la
    configurazione runtime aggiornata.

    Le scritture della configurazione devono passare dagli helper transazionali e scegliere una
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
    che la modifica richiede un riavvio pulito del Gateway, e
    `afterWrite: { mode: "none", reason: "..." }` solo quando il chiamante possiede il
    follow-up e vuole deliberatamente sopprimere il pianificatore di reload.
    I risultati della mutazione includono un riepilogo `followUp` tipizzato per test e logging;
    il Gateway resta responsabile dell'applicazione o pianificazione del riavvio.
    `loadConfig` e `writeConfigFile` restano helper di compatibilità deprecati
    per i Plugin esterni durante la finestra di migrazione e avvisano una sola volta con
    il codice di compatibilità `runtime-config-load-write`. I Plugin inclusi e il codice runtime
    del repo sono protetti da guardrail scanner in
    `pnpm check:deprecated-api-usage` e
    `pnpm check:no-runtime-action-load-config`: il nuovo uso nei Plugin di produzione
    fallisce direttamente, le scritture dirette della configurazione falliscono, i metodi del server Gateway devono usare
    lo snapshot runtime della richiesta, gli helper runtime di invio/azione/client del canale
    devono ricevere la configurazione dal loro confine, e i moduli runtime a lunga durata hanno
    zero chiamate ambientali `loadConfig()` consentite.

    Il nuovo codice Plugin dovrebbe anche evitare di importare il barrel di compatibilità ampio
    `openclaw/plugin-sdk/config-runtime`. Usa il sottopercorso SDK ristretto
    che corrisponde al compito:

    | Esigenza | Import |
    | --- | --- |
    | Tipi di configurazione come `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Asserzioni su configurazione già caricata e lookup della configurazione di entry del Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Letture dello snapshot runtime corrente | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Scritture della configurazione | `openclaw/plugin-sdk/config-mutation` |
    | Helper dell'archivio sessioni | `openclaw/plugin-sdk/session-store-runtime` |
    | Configurazione tabella Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helper runtime per policy di gruppo | `openclaw/plugin-sdk/runtime-group-policy` |
    | Risoluzione input segreto | `openclaw/plugin-sdk/secret-input-runtime` |
    | Override di modello/sessione | `openclaw/plugin-sdk/model-session-runtime` |

    I Plugin inclusi e i loro test sono protetti dallo scanner contro il barrel
    ampio, così import e mock restano locali al comportamento di cui hanno bisogno. Il barrel ampio
    esiste ancora per la compatibilità esterna, ma il nuovo codice non dovrebbe
    dipendere da esso.

  </Step>

  <Step title="Migra le estensioni dei risultati degli strumenti Pi al middleware">
    I Plugin inclusi devono sostituire gli handler dei risultati degli strumenti solo Pi
    `api.registerEmbeddedExtensionFactory(...)` con
    middleware neutro rispetto al runtime.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Aggiorna il manifest del Plugin nello stesso momento:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    I Plugin esterni non possono registrare middleware per risultati degli strumenti perché può
    riscrivere l'output degli strumenti ad alta fiducia prima che il modello lo veda.

  </Step>

  <Step title="Migra gli handler nativi per approvazioni ai fatti di capability">
    I Plugin di canale capaci di approvazione ora espongono il comportamento di approvazione nativo tramite
    `approvalCapability.nativeRuntime` più il registro condiviso del contesto runtime.

    Modifiche chiave:

    - Sostituisci `approvalCapability.handler.loadRuntime(...)` con
      `approvalCapability.nativeRuntime`
    - Sposta auth/delivery specifici delle approvazioni dal cablaggio legacy `plugin.auth` /
      `plugin.approvals` a `approvalCapability`
    - `ChannelPlugin.approvals` è stato rimosso dal contratto pubblico dei Plugin di canale;
      sposta i campi delivery/native/render in `approvalCapability`
    - `plugin.auth` resta solo per i flussi di login/logout dei canali; gli hook di auth
      per approvazioni lì non vengono più letti dal core
    - Registra oggetti runtime posseduti dal canale, come client, token o app Bolt,
      tramite `openclaw/plugin-sdk/channel-runtime-context`
    - Non inviare avvisi di reroute posseduti dal Plugin dagli handler di approvazione nativi;
      il core ora possiede gli avvisi di inoltro altrove dai risultati di delivery effettivi
    - Quando passi `channelRuntime` in `createChannelManager(...)`, fornisci una
      superficie reale `createPluginRuntime().channel`. Gli stub parziali vengono rifiutati.

    Vedi `/plugins/sdk-channel-plugins` per il layout corrente della capability di approvazione.

  </Step>

  <Step title="Verifica il comportamento di fallback dei wrapper Windows">
    Se il tuo Plugin usa `openclaw/plugin-sdk/windows-spawn`, i wrapper Windows
    `.cmd`/`.bat` non risolti ora falliscono chiusi, a meno che tu non passi esplicitamente
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
    `allowShellFallback` e gestisci invece l'errore lanciato.

  </Step>

  <Step title="Trova gli import deprecati">
    Cerca nel tuo Plugin gli import da una delle superfici deprecate:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Sostituisci con import mirati">
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
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Lo stesso pattern si applica agli altri helper bridge legacy:

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

  <Step title="Sostituisci gli import infra-runtime ampi">
    `openclaw/plugin-sdk/infra-runtime` esiste ancora per la compatibilità
    esterna, ma il nuovo codice dovrebbe importare la superficie di helper mirata di cui
    ha effettivamente bisogno:

    | Esigenza | Import |
    | --- | --- |
    | Helper della coda eventi di sistema | `openclaw/plugin-sdk/system-event-runtime` |
    | Helper di risveglio, evento e visibilità Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Svuotamento della coda di delivery in sospeso | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetria dell'attività di canale | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cache di deduplicazione in memoria | `openclaw/plugin-sdk/dedupe-runtime` |
    | Helper sicuri per percorsi file/media locali | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch consapevole del dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Helper proxy e fetch protetto | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipi di policy del dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipi di richiesta/risoluzione approvazione | `openclaw/plugin-sdk/approval-runtime` |
    | Payload di risposta approvazione e helper di comando | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helper di formattazione degli errori | `openclaw/plugin-sdk/error-runtime` |
    | Attese della prontezza del trasporto | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helper per token sicuri | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concorrenza limitata per task asincroni | `openclaw/plugin-sdk/concurrency-runtime` |
    | Coercizione numerica | `openclaw/plugin-sdk/number-runtime` |
    | Lock asincrono locale al processo | `openclaw/plugin-sdk/async-lock-runtime` |
    | Lock su file | `openclaw/plugin-sdk/file-lock` |

    I Plugin inclusi sono protetti dallo scanner contro `infra-runtime`, quindi il codice del repo
    non può regredire al barrel ampio.

  </Step>

  <Step title="Migra gli helper di route canale">
    Il nuovo codice di route canale dovrebbe usare `openclaw/plugin-sdk/channel-route`.
    I nomi precedenti di route-key e comparable-target restano alias di compatibilità
    durante la finestra di migrazione, ma i nuovi Plugin dovrebbero usare i nomi di route
    che descrivono direttamente il comportamento:

    | Helper precedente | Helper moderno |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Gli helper di route moderni normalizzano `{ channel, to, accountId, threadId }`
    in modo coerente tra approvazioni native, soppressione delle risposte, deduplicazione
    in ingresso, consegna Cron e routing delle sessioni. Se il tuo Plugin possiede una
    grammatica di destinazione personalizzata, usa `resolveChannelRouteTargetWithParser(...)`
    per adattare quel parser allo stesso contratto di destinazione della route.

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
  | Percorso di importazione | Scopo | Esportazioni chiave |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper canonico per l'entry del plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Riesportazione ombrello legacy per definizioni/builder di entry di canale | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Esportazione dello schema di configurazione radice | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper di entry per provider singolo | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definizioni e builder focalizzati per entry di canale | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helper condivisi per la procedura guidata di configurazione | Prompt allowlist, builder dello stato di configurazione |
  | `plugin-sdk/setup-runtime` | Helper runtime per il tempo di configurazione | Adattatori di patch setup import-safe, helper per note di lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy di setup delegati |
  | `plugin-sdk/setup-adapter-runtime` | Alias deprecato dell'adattatore di setup | Usa `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Helper per strumenti di setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper multi-account | Helper per lista account/configurazione/action-gate |
  | `plugin-sdk/account-id` | Helper per account-id | `DEFAULT_ACCOUNT_ID`, normalizzazione account-id |
  | `plugin-sdk/account-resolution` | Helper di lookup account | Helper di lookup account + fallback predefinito |
  | `plugin-sdk/account-helpers` | Helper account mirati | Helper lista account/azione account |
  | `plugin-sdk/channel-setup` | Adattatori della procedura guidata di setup | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive di associazione DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Cablaggio di prefisso risposta, digitazione e consegna sorgente | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Factory di adattatori di configurazione e helper di accesso DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Builder di schema di configurazione | Primitive condivise dello schema di configurazione canale e solo il builder generico |
  | `plugin-sdk/bundled-channel-config-schema` | Schemi di configurazione bundled | Solo Plugin bundled mantenuti da OpenClaw; i nuovi Plugin devono definire schemi locali al Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Schemi di configurazione bundled deprecati | Solo alias di compatibilità; usa `plugin-sdk/bundled-channel-config-schema` per Plugin bundled mantenuti |
  | `plugin-sdk/telegram-command-config` | Helper di configurazione comandi Telegram | Normalizzazione del nome comando, trimming della descrizione, validazione duplicati/conflitti |
  | `plugin-sdk/channel-policy` | Risoluzione policy gruppo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helper per stato account e lifecycle dello stream bozze | `createAccountStatusSink`, helper di finalizzazione anteprima bozza |
  | `plugin-sdk/inbound-envelope` | Helper per envelope inbound | Helper condivisi per route + builder envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helper per risposte inbound | Helper condivisi di registrazione e dispatch |
  | `plugin-sdk/messaging-targets` | Parsing target di messaggistica | Helper di parsing/matching target |
  | `plugin-sdk/outbound-media` | Helper media outbound | Caricamento media outbound condiviso |
  | `plugin-sdk/outbound-send-deps` | Helper per dipendenze di invio outbound | Lookup leggero `resolveOutboundSendDep` senza importare l'intero runtime outbound |
  | `plugin-sdk/outbound-runtime` | Helper runtime outbound | Helper per consegna outbound, delegato identity/send, sessione, formattazione e pianificazione payload |
  | `plugin-sdk/thread-bindings-runtime` | Helper di thread-binding | Helper di lifecycle e adattatori di thread-binding |
  | `plugin-sdk/agent-media-payload` | Helper payload media legacy | Builder payload media agente per layout di campi legacy |
  | `plugin-sdk/channel-runtime` | Shim di compatibilità deprecato | Solo utility runtime canale legacy |
  | `plugin-sdk/channel-send-result` | Tipi di risultato invio | Tipi di risultato risposta |
  | `plugin-sdk/runtime-store` | Archiviazione persistente Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helper runtime ampi | Helper runtime/logging/backup/installazione Plugin |
  | `plugin-sdk/runtime-env` | Helper runtime env mirati | Logger/runtime env, timeout, retry e helper di backoff |
  | `plugin-sdk/plugin-runtime` | Helper runtime Plugin condivisi | Helper per comandi/hook/http/interattivi del Plugin |
  | `plugin-sdk/hook-runtime` | Helper della pipeline hook | Helper condivisi della pipeline hook Webhook/interna |
  | `plugin-sdk/lazy-runtime` | Helper lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper processi | Helper exec condivisi |
  | `plugin-sdk/cli-runtime` | Helper runtime CLI | Formattazione comandi, attese, helper di versione |
  | `plugin-sdk/gateway-runtime` | Helper Gateway | Client Gateway, helper di avvio pronto per event loop e helper patch stato canale |
  | `plugin-sdk/config-runtime` | Shim deprecato di compatibilità configurazione | Preferisci `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` e `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Helper comandi Telegram | Helper di validazione comandi Telegram con fallback stabile quando la superficie del contratto Telegram bundled non è disponibile |
  | `plugin-sdk/approval-runtime` | Helper prompt di approvazione | Payload approvazione exec/Plugin, helper capability/profilo approvazione, helper routing/runtime approvazione nativa e formattazione percorso display approvazione strutturata |
  | `plugin-sdk/approval-auth-runtime` | Helper auth approvazione | Risoluzione approvatore, auth azione nella stessa chat |
  | `plugin-sdk/approval-client-runtime` | Helper client approvazione | Helper profilo/filtro approvazione exec nativa |
  | `plugin-sdk/approval-delivery-runtime` | Helper consegna approvazione | Adattatori capability/consegna approvazione nativa |
  | `plugin-sdk/approval-gateway-runtime` | Helper Gateway approvazione | Helper condiviso di risoluzione Gateway approvazione |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper adattatore approvazione | Helper leggeri di caricamento adattatore approvazione nativa per entrypoint canale hot |
  | `plugin-sdk/approval-handler-runtime` | Helper handler approvazione | Helper runtime più ampi per handler approvazione; preferisci le interfacce adattatore/Gateway più mirate quando sono sufficienti |
  | `plugin-sdk/approval-native-runtime` | Helper target approvazione | Helper nativi per binding target/account di approvazione |
  | `plugin-sdk/approval-reply-runtime` | Helper risposta approvazione | Helper payload risposta approvazione exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Helper runtime-context canale | Helper generici register/get/watch runtime-context canale |
  | `plugin-sdk/security-runtime` | Helper sicurezza | Helper condivisi per trust, gating DM, file/percorsi root-bounded, contenuto esterno e raccolta segreti |
  | `plugin-sdk/ssrf-policy` | Helper policy SSRF | Helper allowlist host e policy private-network |
  | `plugin-sdk/ssrf-runtime` | Helper runtime SSRF | Dispatcher pinned, fetch protetto, helper policy SSRF |
  | `plugin-sdk/system-event-runtime` | Helper eventi di sistema | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Helper Heartbeat | Helper wake, evento e visibilità Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Helper coda di consegna | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Helper attività canale | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Helper dedupe | Cache dedupe in memoria |
  | `plugin-sdk/file-access-runtime` | Helper accesso file | Helper sicuri per percorso file/media locale |
  | `plugin-sdk/transport-ready-runtime` | Helper prontezza trasporto | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Helper cache limitata | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper gating diagnostico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper formattazione errori | `formatUncaughtError`, `isApprovalNotFoundError`, helper grafo errori |
  | `plugin-sdk/fetch-runtime` | Helper fetch/proxy wrappati | `resolveFetch`, helper proxy, helper opzioni EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Helper normalizzazione host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper retry | `RetryConfig`, `retryAsync`, runner policy |
  | `plugin-sdk/allow-from` | Formattazione allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapping input allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating comandi e helper superficie comandi | `resolveControlCommandGate`, helper autorizzazione mittente, helper registro comandi inclusa formattazione menu argomenti dinamici |
  | `plugin-sdk/command-status` | Renderer stato/aiuto comandi | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing input segreto | Helper input segreto |
  | `plugin-sdk/webhook-ingress` | Helper richieste Webhook | Utility target Webhook |
  | `plugin-sdk/webhook-request-guards` | Helper guard corpo Webhook | Helper lettura/limite corpo richiesta |
  | `plugin-sdk/reply-runtime` | Runtime risposta condiviso | Dispatch inbound, Heartbeat, planner risposta, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helper dispatch risposta mirati | Finalizzazione, dispatch provider e helper etichetta conversazione |
  | `plugin-sdk/reply-history` | Helper cronologia risposte | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Pianificazione riferimento risposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper chunk risposta | Helper chunking testo/markdown |
  | `plugin-sdk/session-store-runtime` | Helper session store | Helper percorso store + updated-at |
  | `plugin-sdk/state-paths` | Helper percorsi stato | Helper directory stato e OAuth |
  | `plugin-sdk/routing` | Helper routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper normalizzazione session-key |
  | `plugin-sdk/status-helpers` | Helper stato canale | Builder riepilogo stato canale/account, predefiniti runtime-state, helper metadata issue |
  | `plugin-sdk/target-resolver-runtime` | Helper resolver target | Helper resolver target condivisi |
  | `plugin-sdk/string-normalization-runtime` | Helper normalizzazione stringhe | Helper normalizzazione slug/stringhe |
  | `plugin-sdk/request-url` | Helper URL richiesta | Estrae URL stringa da input simili a richiesta |
  | `plugin-sdk/run-command` | Helper comandi temporizzati | Runner comandi temporizzati con stdout/stderr normalizzati |
  | `plugin-sdk/param-readers` | Reader parametri | Reader parametri comuni per tool/CLI |
  | `plugin-sdk/tool-payload` | Estrazione dei payload degli strumenti | Estrae payload normalizzati dagli oggetti risultato degli strumenti |
  | `plugin-sdk/tool-send` | Estrazione dell'invio dello strumento | Estrae i campi di destinazione canonici per l'invio dagli argomenti dello strumento |
  | `plugin-sdk/temp-path` | Helper per percorsi temporanei | Helper condivisi per percorsi di download temporanei |
  | `plugin-sdk/logging-core` | Helper di logging | Helper per logger di sottosistema e redazione |
  | `plugin-sdk/markdown-table-runtime` | Helper per tabelle Markdown | Helper per la modalità tabella Markdown |
  | `plugin-sdk/reply-payload` | Tipi di risposta ai messaggi | Tipi di payload di risposta |
  | `plugin-sdk/provider-setup` | Helper curati per la configurazione di provider locali/self-hosted | Helper di rilevamento/configurazione per provider self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Helper mirati per la configurazione di provider self-hosted compatibili con OpenAI | Gli stessi helper di rilevamento/configurazione per provider self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Helper di autenticazione runtime dei provider | Helper per la risoluzione runtime delle chiavi API |
  | `plugin-sdk/provider-auth-api-key` | Helper per la configurazione delle chiavi API dei provider | Helper per onboarding/scrittura del profilo delle chiavi API |
  | `plugin-sdk/provider-auth-result` | Helper per i risultati di autenticazione dei provider | Builder standard per risultati di autenticazione OAuth |
  | `plugin-sdk/provider-selection-runtime` | Helper per la selezione dei provider | Selezione del provider configurato o automatica e unione della configurazione grezza del provider |
  | `plugin-sdk/provider-env-vars` | Helper per variabili d'ambiente dei provider | Helper per la ricerca delle variabili d'ambiente di autenticazione dei provider |
  | `plugin-sdk/provider-model-shared` | Helper condivisi per modelli/replay dei provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi di policy di replay, helper per endpoint dei provider e helper per la normalizzazione degli ID modello |
  | `plugin-sdk/provider-catalog-shared` | Helper condivisi per il catalogo dei provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch di onboarding dei provider | Helper per la configurazione di onboarding |
  | `plugin-sdk/provider-http` | Helper HTTP dei provider | Helper generici per funzionalità HTTP/endpoint dei provider, inclusi helper per moduli multipart di trascrizione audio |
  | `plugin-sdk/provider-web-fetch` | Helper web-fetch dei provider | Helper per registrazione/cache dei provider web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helper di configurazione web-search dei provider | Helper mirati per configurazione/credenziali web-search per provider che non necessitano del cablaggio di abilitazione dei plugin |
  | `plugin-sdk/provider-web-search-contract` | Helper per il contratto web-search dei provider | Helper mirati per il contratto di configurazione/credenziali web-search, come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con ambito |
  | `plugin-sdk/provider-web-search` | Helper web-search dei provider | Helper runtime per registrazione/cache dei provider web-search |
  | `plugin-sdk/provider-tools` | Helper di compatibilità strumenti/schema dei provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` e pulizia schema + diagnostica Gemini |
  | `plugin-sdk/provider-usage` | Helper di utilizzo dei provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e altri helper di utilizzo dei provider |
  | `plugin-sdk/provider-stream` | Helper wrapper per stream dei provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di wrapper di stream e helper wrapper condivisi Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helper di trasporto dei provider | Helper di trasporto nativi dei provider, come fetch protetto, trasformazioni dei messaggi di trasporto e stream di eventi di trasporto scrivibili |
  | `plugin-sdk/keyed-async-queue` | Coda asincrona ordinata | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helper multimediali condivisi | Helper per fetch/trasformazione/archiviazione dei media, rilevamento delle dimensioni video basato su ffprobe e builder di payload multimediali |
  | `plugin-sdk/media-generation-runtime` | Helper condivisi per generazione multimediale | Helper condivisi di failover, selezione dei candidati e messaggistica per modelli mancanti per la generazione di immagini/video/musica |
  | `plugin-sdk/media-understanding` | Helper di comprensione multimediale | Tipi di provider per comprensione multimediale più export di helper immagine/audio rivolti ai provider |
  | `plugin-sdk/text-runtime` | Export di compatibilità testo ampio deprecato | Usa `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` e `logging-core` |
  | `plugin-sdk/text-chunking` | Helper per segmentazione del testo | Helper per la segmentazione del testo in uscita |
  | `plugin-sdk/speech` | Helper speech | Tipi di provider speech più helper rivolti ai provider per direttive, registro e validazione, e builder TTS compatibile con OpenAI |
  | `plugin-sdk/speech-core` | Core speech condiviso | Tipi di provider speech, registro, direttive, normalizzazione |
  | `plugin-sdk/realtime-transcription` | Helper per trascrizione in tempo reale | Tipi di provider, helper di registro e helper condiviso per sessioni WebSocket |
  | `plugin-sdk/realtime-voice` | Helper per voce in tempo reale | Tipi di provider, helper di registro/risoluzione, helper per sessioni bridge, code condivise di risposta vocale dell'agente, integrità trascrizione/eventi, soppressione dell'eco e helper rapidi per consultazione del contesto |
  | `plugin-sdk/image-generation` | Helper per generazione di immagini | Tipi di provider per generazione di immagini più helper per asset immagine/data URL e builder di provider di immagini compatibile con OpenAI |
  | `plugin-sdk/image-generation-core` | Core condiviso per generazione di immagini | Tipi di generazione di immagini, failover, autenticazione e helper di registro |
  | `plugin-sdk/music-generation` | Helper per generazione musicale | Tipi di provider/richiesta/risultato per generazione musicale |
  | `plugin-sdk/music-generation-core` | Core condiviso per generazione musicale | Tipi di generazione musicale, helper di failover, ricerca provider e parsing dei riferimenti modello |
  | `plugin-sdk/video-generation` | Helper per generazione video | Tipi di provider/richiesta/risultato per generazione video |
  | `plugin-sdk/video-generation-core` | Core condiviso per generazione video | Tipi di generazione video, helper di failover, ricerca provider e parsing dei riferimenti modello |
  | `plugin-sdk/interactive-runtime` | Helper per risposte interattive | Normalizzazione/riduzione del payload di risposta interattiva |
  | `plugin-sdk/channel-config-primitives` | Primitive di configurazione dei canali | Primitive mirate per schema di configurazione dei canali |
  | `plugin-sdk/channel-config-writes` | Helper di scrittura della configurazione dei canali | Helper di autorizzazione alla scrittura della configurazione dei canali |
  | `plugin-sdk/channel-plugin-common` | Prelude condiviso dei canali | Export condivisi del prelude dei plugin di canale |
  | `plugin-sdk/channel-status` | Helper di stato dei canali | Helper condivisi per snapshot/riepilogo dello stato dei canali |
  | `plugin-sdk/allowlist-config-edit` | Helper di configurazione allowlist | Helper di modifica/lettura della configurazione allowlist |
  | `plugin-sdk/group-access` | Helper di accesso ai gruppi | Helper condivisi per decisioni di accesso ai gruppi |
  | `plugin-sdk/direct-dm` | Helper per DM diretti | Helper condivisi di autenticazione/guardia per DM diretti |
  | `plugin-sdk/extension-shared` | Helper condivisi delle estensioni | Primitive di helper per canale passivo/stato e proxy ambientale |
  | `plugin-sdk/webhook-targets` | Helper per target Webhook | Registro dei target Webhook e helper per installazione delle route |
  | `plugin-sdk/webhook-path` | Alias deprecato per percorso webhook | Usa `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Helper condivisi per media web | Helper per il caricamento di media remoti/locali |
  | `plugin-sdk/zod` | Riesportazione deprecata di compatibilità Zod | Importa `zod` direttamente da `zod` |
  | `plugin-sdk/memory-core` | Helper memory-core inclusi | Superficie helper per gestore/configurazione/file/CLI della memoria |
  | `plugin-sdk/memory-core-engine-runtime` | Facciata runtime del motore di memoria | Facciata runtime per indice/ricerca della memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motore foundation dell'host di memoria | Export del motore foundation dell'host di memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motore embedding dell'host di memoria | Contratti di embedding della memoria, accesso al registro, provider locale e helper generici batch/remoti; i provider remoti concreti risiedono nei rispettivi plugin proprietari |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motore QMD dell'host di memoria | Export del motore QMD dell'host di memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motore di archiviazione dell'host di memoria | Export del motore di archiviazione dell'host di memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali dell'host di memoria | Helper multimodali dell'host di memoria |
  | `plugin-sdk/memory-core-host-query` | Helper di query dell'host di memoria | Helper di query dell'host di memoria |
  | `plugin-sdk/memory-core-host-secret` | Helper per segreti dell'host di memoria | Helper per segreti dell'host di memoria |
  | `plugin-sdk/memory-core-host-events` | Alias deprecato per eventi di memoria | Usa `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Helper di stato dell'host di memoria | Helper di stato dell'host di memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI dell'host di memoria | Helper runtime CLI dell'host di memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime core dell'host di memoria | Helper runtime core dell'host di memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime dell'host di memoria | Helper file/runtime dell'host di memoria |
  | `plugin-sdk/memory-host-core` | Alias runtime core dell'host di memoria | Alias indipendente dal vendor per helper runtime core dell'host di memoria |
  | `plugin-sdk/memory-host-events` | Alias journal eventi dell'host di memoria | Alias indipendente dal vendor per helper journal eventi dell'host di memoria |
  | `plugin-sdk/memory-host-files` | Alias deprecato per file/runtime della memoria | Usa `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Helper markdown gestito | Helper markdown gestito condivisi per plugin adiacenti alla memoria |
  | `plugin-sdk/memory-host-search` | Facciata di ricerca Active Memory | Facciata runtime lazy del gestore di ricerca Active Memory |
  | `plugin-sdk/memory-host-status` | Alias deprecato per stato dell'host di memoria | Usa `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Utilità di test | Barrel di compatibilità deprecato locale al repo; usa sotto-percorsi di test mirati locali al repo come `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` e `plugin-sdk/test-fixtures` |
</Accordion>

Questa tabella è intenzionalmente il sottoinsieme comune per la migrazione, non l'intera superficie dell'SDK. L'inventario degli entrypoint del compilatore si trova in
`scripts/lib/plugin-sdk-entrypoints.json`; gli export dei pacchetti sono generati dal sottoinsieme pubblico.

I seam helper riservati dei plugin in bundle sono stati rimossi dalla mappa degli export dell'SDK pubblico, tranne per le facade di compatibilità esplicitamente documentate come lo shim deprecato `plugin-sdk/discord` mantenuto per il pacchetto pubblicato
`@openclaw/discord@2026.3.13`. Gli helper specifici del proprietario vivono all'interno del pacchetto del plugin proprietario; il comportamento host condiviso dovrebbe passare attraverso contratti SDK generici come `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` e `plugin-sdk/plugin-config-runtime`.

Usa l'import più ristretto che corrisponde al compito. Se non riesci a trovare un export, controlla il sorgente in `src/plugin-sdk/` oppure chiedi ai maintainer quale contratto generico dovrebbe possederlo.

## Deprecazioni attive

Deprecazioni più ristrette che si applicano all'SDK dei plugin, al contratto provider, alla superficie runtime e al manifesto. Ognuna funziona ancora oggi, ma sarà rimossa in una futura release major. La voce sotto ogni elemento mappa la vecchia API alla sua sostituzione canonica.

<AccordionGroup>
  <Accordion title="builder di aiuto command-auth → command-status">
    **Vecchio (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nuovo (`openclaw/plugin-sdk/command-status`)**: stesse firme, stessi
    export - solo importati dal subpath più ristretto. `command-auth`
    li riesporta come stub di compatibilità.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="helper di gating delle menzioni → resolveInboundMentionDecision">
    **Vecchio**: `resolveInboundMentionRequirement({ facts, policy })` e
    `shouldDropInboundForMention(...)` da
    `openclaw/plugin-sdk/channel-inbound` o
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nuovo**: `resolveInboundMentionDecision({ facts, policy })` - restituisce un singolo oggetto decisione invece di due chiamate separate.

    I plugin di canale downstream (Slack, Discord, Matrix, MS Teams) sono già passati a questo modello.

  </Accordion>

  <Accordion title="shim runtime di canale e helper per azioni di canale">
    `openclaw/plugin-sdk/channel-runtime` è uno shim di compatibilità per plugin di canale più vecchi. Non importarlo dal nuovo codice; usa
    `openclaw/plugin-sdk/channel-runtime-context` per registrare oggetti runtime.

    Gli helper `channelActions*` in `openclaw/plugin-sdk/channel-actions` sono deprecati insieme agli export di canale "actions" grezzi. Esponi invece le capability tramite la superficie semantica `presentation` - i plugin di canale dichiarano cosa renderizzano (card, pulsanti, select) invece di quali nomi di azione grezzi accettano.

  </Accordion>

  <Accordion title="helper tool() del provider di ricerca web → createTool() sul plugin">
    **Vecchio**: factory `tool()` da `openclaw/plugin-sdk/provider-web-search`.

    **Nuovo**: implementa `createTool(...)` direttamente sul plugin provider.
    OpenClaw non ha più bisogno dell'helper SDK per registrare il wrapper dello strumento.

  </Accordion>

  <Accordion title="envelope di canale in testo semplice → BodyForAgent">
    **Vecchio**: `formatInboundEnvelope(...)` (e
    `ChannelMessageForAgent.channelEnvelope`) per creare un envelope prompt in testo semplice e piatto dai messaggi di canale in ingresso.

    **Nuovo**: `BodyForAgent` più blocchi strutturati di contesto utente. I plugin di canale allegano metadati di routing (thread, topic, reply-to, reactions) come campi tipizzati invece di concatenarli in una stringa prompt. L'helper `formatAgentEnvelope(...)` è ancora supportato per envelope sintetizzati rivolti all'assistente, ma gli envelope in ingresso in testo semplice sono in fase di eliminazione.

    Aree interessate: `inbound_claim`, `message_received` e qualsiasi plugin di canale personalizzato che post-elaborava il testo `channelEnvelope`.

  </Accordion>

  <Accordion title="tipi di discovery provider → tipi di catalogo provider">
    Quattro alias di tipo discovery sono ora wrapper sottili sui tipi dell'era catalogo:

    | Vecchio alias             | Nuovo tipo                |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    In più la vecchia raccolta statica `ProviderCapabilities` - i plugin provider dovrebbero usare hook provider espliciti come `buildReplayPolicy`,
    `normalizeToolSchemas` e `wrapStreamFn` invece di un oggetto statico.

  </Accordion>

  <Accordion title="hook delle policy di thinking → resolveThinkingProfile">
    **Vecchio** (tre hook separati su `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` e
    `resolveDefaultThinkingLevel(ctx)`.

    **Nuovo**: un singolo `resolveThinkingProfile(ctx)` che restituisce un
    `ProviderThinkingProfile` con `id` canonico, `label` opzionale e lista ordinata dei livelli. OpenClaw effettua automaticamente il downgrade dei valori memorizzati obsoleti in base al rango del profilo.

    Implementa un hook invece di tre. Gli hook legacy continuano a funzionare durante la finestra di deprecazione, ma non sono composti con il risultato del profilo.

  </Accordion>

  <Accordion title="fallback provider OAuth esterno → contracts.externalAuthProviders">
    **Vecchio**: implementare `resolveExternalOAuthProfiles(...)` senza dichiarare il provider nel manifesto del plugin.

    **Nuovo**: dichiara `contracts.externalAuthProviders` nel manifesto del plugin
    **e** implementa `resolveExternalAuthProfiles(...)`. Il vecchio percorso di "auth fallback" emette un avviso a runtime e sarà rimosso.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="lookup delle variabili d'ambiente provider → setup.providers[].envVars">
    **Vecchio** campo del manifesto: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nuovo**: replica lo stesso lookup delle variabili d'ambiente in `setup.providers[].envVars`
    nel manifesto. Questo consolida i metadati env di setup/status in un unico posto ed evita di avviare il runtime del plugin solo per rispondere ai lookup delle variabili d'ambiente.

    `providerAuthEnvVars` resta supportato tramite un adattatore di compatibilità finché la finestra di deprecazione non si chiude.

  </Accordion>

  <Accordion title="registrazione del plugin di memoria → registerMemoryCapability">
    **Vecchio**: tre chiamate separate -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nuovo**: una chiamata sull'API memory-state -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Stessi slot, singola chiamata di registrazione. Gli helper di memoria additivi
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) non sono interessati.

  </Accordion>

  <Accordion title="tipi dei messaggi di sessione subagent rinominati">
    Due alias di tipo legacy ancora esportati da `src/plugins/runtime/types.ts`:

    | Vecchio                       | Nuovo                           |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Il metodo runtime `readSession` è deprecato a favore di
    `getSessionMessages`. Stessa firma; il vecchio metodo richiama quello nuovo.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Vecchio**: `runtime.tasks.flow` (singolare) restituiva un accessor live per task-flow.

    **Nuovo**: `runtime.tasks.managedFlows` mantiene il runtime di mutazione TaskFlow gestito per i plugin che creano, aggiornano, annullano o eseguono task figli da un flow. Usa `runtime.tasks.flows` quando al plugin servono solo letture basate su DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="factory di estensioni incorporate → middleware dei risultati strumenti dell'agente">
    Trattato sopra in "Come migrare → Migrare le estensioni dei risultati strumenti Pi al middleware". Incluso qui per completezza: il percorso solo Pi rimosso
    `api.registerEmbeddedExtensionFactory(...)` è sostituito da
    `api.registerAgentToolResultMiddleware(...)` con un elenco runtime esplicito in `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` riesportato da `openclaw/plugin-sdk` è ora un alias di una sola riga per `OpenClawConfig`. Preferisci il nome canonico.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Le deprecazioni a livello di estensione (all'interno dei plugin di canale/provider in bundle sotto
`extensions/`) sono tracciate nei rispettivi barrel `api.ts` e `runtime-api.ts`.
Non influiscono sui contratti dei plugin di terze parti e non sono elencate qui. Se consumi direttamente il barrel locale di un plugin in bundle, leggi i commenti di deprecazione in quel barrel prima di aggiornare.
</Note>

## Tempistica di rimozione

| Quando                 | Cosa succede                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **Ora**                | Le superfici deprecate emettono avvisi a runtime                        |
| **Prossima release major** | Le superfici deprecate saranno rimosse; i plugin che le usano ancora falliranno |

Tutti i plugin core sono già stati migrati. I plugin esterni dovrebbero migrare prima della prossima release major.

## Soppressione temporanea degli avvisi

Imposta queste variabili d'ambiente mentre lavori alla migrazione:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Questa è una via d'uscita temporanea, non una soluzione permanente.

## Correlati

- [Per iniziare](/it/plugins/building-plugins) - crea il tuo primo plugin
- [Panoramica dell'SDK](/it/plugins/sdk-overview) - riferimento completo agli import da subpath
- [Plugin di canale](/it/plugins/sdk-channel-plugins) - creazione di plugin di canale
- [Plugin provider](/it/plugins/sdk-provider-plugins) - creazione di plugin provider
- [Interni dei plugin](/it/plugins/architecture) - approfondimento sull'architettura
- [Manifesto del plugin](/it/plugins/manifest) - riferimento dello schema del manifesto
