---
read_when:
    - Viene visualizzato l'avviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Viene visualizzato l'avviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Hai usato api.registerEmbeddedExtensionFactory prima di OpenClaw 2026.4.25
    - Stai aggiornando un Plugin all'architettura Plugin moderna
    - Mantieni un Plugin OpenClaw esterno
sidebarTitle: Migrate to SDK
summary: Migra dal livello legacy di retrocompatibilità al moderno SDK Plugin
title: Migrazione del Plugin SDK
x-i18n:
    generated_at: "2026-05-06T09:03:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: f629f6e3f9a0c122f3065d9b0b6b418e1c1ba29d42aff9ed025d61189be3e42a
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw è passato da un ampio livello di compatibilità retroattiva a una moderna
architettura Plugin con import mirati e documentati. Se il tuo plugin è stato creato prima
della nuova architettura, questa guida ti aiuta a migrarlo.

## Cosa cambia

Il vecchio sistema Plugin forniva due superfici molto aperte che consentivano ai plugin di importare
tutto ciò di cui avevano bisogno da un unico punto di ingresso:

- **`openclaw/plugin-sdk/compat`** - un singolo import che riesportava decine di
  helper. È stato introdotto per mantenere funzionanti i plugin più vecchi basati su hook mentre
  veniva costruita la nuova architettura Plugin.
- **`openclaw/plugin-sdk/infra-runtime`** - un ampio barrel di helper runtime che
  combinava eventi di sistema, stato Heartbeat, code di consegna, helper fetch/proxy,
  helper per file, tipi di approvazione e utility non correlate.
- **`openclaw/plugin-sdk/config-runtime`** - un ampio barrel di compatibilità della configurazione
  che conserva ancora helper diretti di caricamento/scrittura deprecati durante la finestra di migrazione.
- **`openclaw/extension-api`** - un bridge che forniva ai plugin accesso diretto agli
  helper lato host, come il runner dell'agente incorporato.
- **`api.registerEmbeddedExtensionFactory(...)`** - un hook rimosso di estensione in bundle
  solo per Pi che poteva osservare eventi del runner incorporato come
  `tool_result`.

Le ampie superfici di import sono ora **deprecate**. Continuano a funzionare a runtime,
ma i nuovi plugin non devono usarle, e i plugin esistenti dovrebbero migrare prima che
la prossima major release le rimuova. L'API di registrazione della factory di estensioni incorporate
solo per Pi è stata rimossa; usa invece il middleware per i risultati degli strumenti.

OpenClaw non rimuove né reinterpreta un comportamento Plugin documentato nella stessa
modifica che introduce un sostituto. Le modifiche che interrompono il contratto devono prima passare
attraverso un adattatore di compatibilità, diagnostica, documentazione e una finestra di deprecazione.
Questo vale per gli import SDK, i campi del manifest, le API di configurazione, gli hook e il comportamento
di registrazione runtime.

<Warning>
  Il livello di compatibilità retroattiva sarà rimosso in una futura major release.
  I plugin che importano ancora da queste superfici si romperanno quando ciò accadrà.
  Le registrazioni della factory di estensioni incorporate solo per Pi non vengono già più caricate.
</Warning>

## Perché è cambiato

Il vecchio approccio causava problemi:

- **Avvio lento** - importare un helper caricava decine di moduli non correlati
- **Dipendenze circolari** - le ampie riesportazioni rendevano facile creare cicli di import
- **Superficie API poco chiara** - non c'era modo di capire quali export fossero stabili e quali interni

Il moderno SDK Plugin risolve questo problema: ogni percorso di import (`openclaw/plugin-sdk/\<subpath\>`)
è un modulo piccolo e autonomo, con uno scopo chiaro e un contratto documentato.

Sono state rimosse anche le seam legacy di praticità dei provider per i canali in bundle.
Le seam helper con marchio del canale erano scorciatoie private del mono-repo, non contratti
Plugin stabili. Usa invece sottopercorsi SDK generici e mirati. All'interno del workspace dei plugin
in bundle, mantieni gli helper di proprietà del provider nel `api.ts` o
`runtime-api.ts` del plugin stesso.

Esempi attuali di provider in bundle:

- Anthropic conserva gli helper di streaming specifici di Claude nella propria seam `api.ts` /
  `contract-api.ts`
- OpenAI conserva builder di provider, helper per il modello predefinito e builder di provider realtime
  nel proprio `api.ts`
- OpenRouter conserva il builder di provider e gli helper di onboarding/configurazione nel proprio
  `api.ts`

## Piano di migrazione per Talk e voce realtime

Il codice realtime voice, telefonia, riunioni e browser Talk si sta spostando dalla
contabilità dei turni locale alla superficie a un controller condiviso delle sessioni Talk esportato da
`openclaw/plugin-sdk/realtime-voice`. Il nuovo controller possiede l'envelope comune degli eventi Talk,
lo stato del turno attivo, lo stato di acquisizione, lo stato dell'audio in uscita, la cronologia recente
degli eventi e il rifiuto dei turni obsoleti. I plugin provider devono continuare a possedere
le sessioni realtime specifiche del vendor; i plugin di superficie devono continuare a possedere acquisizione,
riproduzione, telefonia e particolarità delle riunioni.

Questa migrazione di Talk è intenzionalmente una rottura pulita:

1. Mantieni le primitive condivise controller/runtime in
   `plugin-sdk/realtime-voice`.
2. Sposta le superfici in bundle sul controller condiviso: relay del browser,
   handoff della stanza gestita, realtime per chiamate vocali, STT in streaming per chiamate vocali, Google
   Meet realtime e push-to-talk nativo.
3. Sostituisci le vecchie famiglie RPC di Talk con l'API finale `talk.session.*` e
   `talk.client.*`.
4. Pubblicizza un solo canale live di eventi Talk in Gateway
   `hello-ok.features.events`: `talk.event`.
5. Elimina il vecchio endpoint HTTP realtime e qualsiasi percorso di override delle istruzioni
   al momento della richiesta.

Il nuovo codice non dovrebbe chiamare direttamente `createTalkEventSequencer(...)` a meno che non stia
implementando un adattatore di basso livello o una fixture di test. Preferisci il controller condiviso
così gli eventi con ambito di turno non possono essere emessi senza un id di turno, le chiamate `turnEnd` /
`turnCancel` obsolete non possono cancellare un turno attivo più recente, e gli eventi del ciclo di vita
dell'audio in uscita restano coerenti tra telefonia, riunioni, relay del browser, handoff della stanza gestita
e client Talk nativi.

La forma target dell'API pubblica è:

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

Le sessioni WebRTC/provider-websocket possedute dal browser usano `talk.client.create`,
perché il browser possiede la negoziazione del provider e il trasporto multimediale mentre il
Gateway possiede credenziali, istruzioni e policy degli strumenti. `talk.session.*` è la
superficie comune gestita dal Gateway per realtime gateway-relay, trascrizione gateway-relay
e sessioni STT/TTS native managed-room.

Le configurazioni legacy che posizionavano i selettori realtime accanto a `talk.provider` /
`talk.providers` devono essere riparate con `openclaw doctor --fix`; il runtime Talk
non reinterpreta la configurazione dei provider speech/TTS come configurazione dei provider realtime.

Le combinazioni supportate di `talk.session.create` sono volutamente poche:

| Modalità        | Trasporto       | Brain           | Proprietario       | Note                                                                                                               |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio provider full-duplex collegato attraverso il Gateway; le chiamate agli strumenti sono instradate tramite lo strumento agent-consult. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Solo STT in streaming; i chiamanti inviano audio in ingresso e ricevono eventi di trascrizione.                    |
| `stt-tts`       | `managed-room`  | `agent-consult` | Stanza nativa/client | Stanze in stile push-to-talk e walkie-talkie in cui il client possiede acquisizione/riproduzione e il Gateway possiede lo stato del turno. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Stanza nativa/client | Modalità stanza solo amministratore per superfici first-party attendibili che eseguono direttamente azioni degli strumenti del Gateway. |

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

| Metodo                          | Si applica a                                            | Contratto                                                                                     |
| ------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Aggiunge un chunk audio PCM base64 alla sessione provider posseduta dalla stessa connessione Gateway. |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Avvia un turno utente managed-room.                                                           |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Termina il turno attivo dopo la convalida del turno obsoleto.                                 |
| `talk.session.cancelTurn`       | tutte le sessioni possedute dal Gateway                 | Annulla il lavoro attivo di acquisizione/provider/agente/TTS per un turno.                    |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Interrompe l'output audio dell'assistente senza necessariamente terminare il turno utente.     |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Completa una chiamata a strumento provider emessa dal relay.                                  |
| `talk.session.close`            | tutte le sessioni unificate                             | Interrompe le sessioni relay o revoca lo stato managed-room, quindi dimentica l'id sessione unificato. |

Non introdurre casi speciali di provider o piattaforma nel core per far funzionare tutto questo.
Il core possiede la semantica delle sessioni Talk. I plugin provider possiedono la configurazione delle sessioni vendor.
Voice-call e Google Meet possiedono gli adattatori di telefonia/riunione. Browser e app native
possiedono l'UX di acquisizione/riproduzione del dispositivo.

## Policy di compatibilità

Per i plugin esterni, il lavoro di compatibilità segue questo ordine:

1. aggiungere il nuovo contratto
2. mantenere il vecchio comportamento collegato tramite un adattatore di compatibilità
3. emettere una diagnostica o un avviso che nomini il vecchio percorso e il sostituto
4. coprire entrambi i percorsi nei test
5. documentare la deprecazione e il percorso di migrazione
6. rimuovere solo dopo la finestra di migrazione annunciata, di solito in una major release

  I maintainer possono verificare la coda di migrazione corrente con
  `pnpm plugins:boundary-report`. Usa `pnpm plugins:boundary-report:summary` per
  conteggi compatti, `--owner <id>` per un singolo plugin o proprietario di compatibilità, e
  `pnpm plugins:boundary-report:ci` quando un gate CI deve fallire per record di
  compatibilità scaduti, import SDK riservati tra proprietari o sottopercorsi SDK
  riservati inutilizzati. Il report raggruppa i record di compatibilità
  deprecati per data di rimozione, conta i riferimenti locali in codice/documentazione,
  evidenzia gli import SDK riservati tra proprietari e riepiloga il bridge SDK
  privato del memory-host, così la pulizia della compatibilità resta esplicita invece di
  basarsi su ricerche ad hoc. I sottopercorsi SDK riservati devono avere un uso del proprietario tracciato;
  gli export di helper riservati inutilizzati devono essere rimossi dall'SDK pubblico.

  Se un campo del manifest è ancora accettato, gli autori di plugin possono continuare a usarlo finché
  la documentazione e la diagnostica non indicano diversamente. Il nuovo codice dovrebbe preferire il
  sostituto documentato, ma i plugin esistenti non dovrebbero rompersi durante normali
  rilasci minor.

  ## Come migrare

  <Steps>
  <Step title="Migra gli helper di caricamento/scrittura della configurazione runtime">
    I plugin in bundle dovrebbero smettere di chiamare direttamente
    `api.runtime.config.loadConfig()` e
    `api.runtime.config.writeConfigFile(...)`. Preferisci la configurazione che era
    già stata passata nel percorso di chiamata attivo. Gli handler a lunga durata che hanno bisogno dello
    snapshot del processo corrente possono usare `api.runtime.config.current()`. Gli strumenti agente
    a lunga durata dovrebbero usare `ctx.getRuntimeConfig()` del contesto dello strumento dentro
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
    che la modifica richiede un riavvio pulito del gateway, e
    `afterWrite: { mode: "none", reason: "..." }` solo quando il chiamante gestisce il
    follow-up e vuole deliberatamente sopprimere il planner di reload.
    I risultati della mutazione includono un riepilogo `followUp` tipizzato per test e logging;
    il gateway resta responsabile dell'applicazione o della pianificazione del riavvio.
    `loadConfig` e `writeConfigFile` restano helper di compatibilità deprecati
    per plugin esterni durante la finestra di migrazione e avvisano una volta con
    il codice di compatibilità `runtime-config-load-write`. I plugin in bundle e il codice runtime
    del repository sono protetti da guardrail dello scanner in
    `pnpm check:deprecated-internal-config-api` e
    `pnpm check:no-runtime-action-load-config`: il nuovo uso nei plugin di produzione
    fallisce direttamente, le scritture dirette della configurazione falliscono, i metodi del server gateway devono usare
    lo snapshot runtime della richiesta, gli helper runtime per invio/azione/client del canale
    devono ricevere la configurazione dal loro confine e i moduli runtime a lunga durata hanno
    zero chiamate ambientali `loadConfig()` consentite.

    Il nuovo codice dei plugin dovrebbe anche evitare di importare l'ampio barrel di compatibilità
    `openclaw/plugin-sdk/config-runtime`. Usa il sottopercorso SDK ristretto che corrisponde al lavoro:

    | Necessità | Import |
    | --- | --- |
    | Tipi di configurazione come `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Asserzioni su configurazione già caricata e lookup della configurazione di ingresso del plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Letture dello snapshot runtime corrente | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Scritture della configurazione | `openclaw/plugin-sdk/config-mutation` |
    | Helper del session store | `openclaw/plugin-sdk/session-store-runtime` |
    | Configurazione della tabella Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helper runtime per policy di gruppo | `openclaw/plugin-sdk/runtime-group-policy` |
    | Risoluzione degli input segreti | `openclaw/plugin-sdk/secret-input-runtime` |
    | Override di modello/sessione | `openclaw/plugin-sdk/model-session-runtime` |

    I plugin in bundle e i loro test sono protetti dallo scanner contro il barrel
    ampio, così import e mock restano locali al comportamento di cui hanno bisogno. Il barrel ampio
    esiste ancora per la compatibilità esterna, ma il nuovo codice non dovrebbe
    dipendere da esso.

  </Step>

  <Step title="Migra le estensioni dei risultati degli strumenti Pi al middleware">
    I plugin in bundle devono sostituire gli handler di risultati degli strumenti
    `api.registerEmbeddedExtensionFactory(...)` solo Pi con
    middleware indipendente dal runtime.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Aggiorna contemporaneamente il manifest del plugin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    I plugin esterni non possono registrare middleware per risultati degli strumenti perché può
    riscrivere output di strumenti ad alta fiducia prima che il modello lo veda.

  </Step>

  <Step title="Migra gli handler nativi per approvazioni ai fatti di capacità">
    I plugin di canale con supporto alle approvazioni ora espongono il comportamento di approvazione nativo tramite
    `approvalCapability.nativeRuntime` più il registro condiviso del contesto runtime.

    Modifiche chiave:

    - Sostituisci `approvalCapability.handler.loadRuntime(...)` con
      `approvalCapability.nativeRuntime`
    - Sposta auth/delivery specifici per approvazioni dal cablaggio legacy `plugin.auth` /
      `plugin.approvals` a `approvalCapability`
    - `ChannelPlugin.approvals` è stato rimosso dal contratto pubblico dei plugin di canale;
      sposta i campi delivery/native/render in `approvalCapability`
    - `plugin.auth` resta solo per i flussi di login/logout del canale; gli hook di auth
      per approvazioni lì non vengono più letti dal core
    - Registra oggetti runtime posseduti dal canale, come client, token o app Bolt,
      tramite `openclaw/plugin-sdk/channel-runtime-context`
    - Non inviare avvisi di reinstradamento posseduti dal plugin dagli handler di approvazione nativi;
      ora il core possiede gli avvisi instradati altrove dai risultati di delivery effettivi
    - Quando passi `channelRuntime` a `createChannelManager(...)`, fornisci una
      superficie reale `createPluginRuntime().channel`. Gli stub parziali vengono rifiutati.

    Vedi `/plugins/sdk-channel-plugins` per il layout corrente della capacità di approvazione.

  </Step>

  <Step title="Verifica il comportamento di fallback dei wrapper Windows">
    Se il tuo plugin usa `openclaw/plugin-sdk/windows-spawn`, i wrapper Windows
    `.cmd`/`.bat` non risolti ora falliscono in modo chiuso a meno che non passi esplicitamente
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

    Se il tuo chiamante non dipende intenzionalmente dal fallback della shell, non impostare
    `allowShellFallback` e gestisci invece l'errore generato.

  </Step>

  <Step title="Trova gli import deprecati">
    Cerca nel tuo plugin import da una delle superfici deprecate:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Sostituisci con import mirati">
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

    Per gli helper lato host, usa il runtime del plugin iniettato invece di importare
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
    | helper del session store | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Sostituisci gli import ampi da infra-runtime">
    `openclaw/plugin-sdk/infra-runtime` esiste ancora per la compatibilità
    esterna, ma il nuovo codice dovrebbe importare la superficie helper mirata di cui
    ha effettivamente bisogno:

    | Necessità | Import |
    | --- | --- |
    | Helper della coda eventi di sistema | `openclaw/plugin-sdk/system-event-runtime` |
    | Helper per eventi Heartbeat e visibilità | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Svuotamento della coda di delivery in sospeso | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetria dell'attività del canale | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cache di deduplicazione in memoria | `openclaw/plugin-sdk/dedupe-runtime` |
    | Helper sicuri per percorsi di file locali/media | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch consapevole del dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Helper per proxy e fetch protetto | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipi di policy del dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipi di richiesta/risoluzione approvazione | `openclaw/plugin-sdk/approval-runtime` |
    | Helper per payload di risposta approvazione e comandi | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helper di formattazione degli errori | `openclaw/plugin-sdk/error-runtime` |
    | Attese della disponibilità del trasporto | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helper per token sicuri | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concorrenza limitata delle attività asincrone | `openclaw/plugin-sdk/concurrency-runtime` |
    | Coercizione numerica | `openclaw/plugin-sdk/number-runtime` |
    | Lock asincrono locale al processo | `openclaw/plugin-sdk/async-lock-runtime` |
    | Lock sui file | `openclaw/plugin-sdk/file-lock` |

    I plugin in bundle sono protetti dallo scanner contro `infra-runtime`, quindi il codice del repository
    non può regredire al barrel ampio.

  </Step>

  <Step title="Migra gli helper di route dei canali">
    Il nuovo codice di route dei canali dovrebbe usare `openclaw/plugin-sdk/channel-route`.
    I vecchi nomi route-key e comparable-target restano alias di compatibilità
    durante la finestra di migrazione, ma i nuovi plugin dovrebbero usare i nomi di route
    che descrivono direttamente il comportamento:

    | Vecchio helper | Helper moderno |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Gli helper moderni per l'instradamento normalizzano `{ channel, to, accountId, threadId }`
    in modo coerente tra approvazioni native, soppressione delle risposte, deduplicazione in ingresso,
    consegna Cron e instradamento delle sessioni. Se il tuo plugin possiede una grammatica di destinazione
    personalizzata, usa `resolveChannelRouteTargetWithParser(...)` per adattare quel
    parser allo stesso contratto di destinazione dell'instradamento.

  </Step>

  <Step title="Compila e testa">
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
  | `plugin-sdk/plugin-entry` | Helper canonico per voce Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Riesportazione ombrello legacy per definizioni/builder di voci di canale | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Esportazione dello schema di configurazione radice | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper per voce a provider singolo | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definizioni e builder mirati per voci di canale | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helper condivisi per la procedura guidata di configurazione | Prompt di allowlist, builder di stato della configurazione |
  | `plugin-sdk/setup-runtime` | Helper di runtime in fase di configurazione | Adapter di patch di configurazione sicuri per l'importazione, helper per note di lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy di configurazione delegati |
  | `plugin-sdk/setup-adapter-runtime` | Helper per adapter di configurazione | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helper per strumenti di configurazione | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper multi-account | Helper per elenco account/configurazione/gate delle azioni |
  | `plugin-sdk/account-id` | Helper per ID account | `DEFAULT_ACCOUNT_ID`, normalizzazione degli ID account |
  | `plugin-sdk/account-resolution` | Helper di lookup account | Helper per lookup account e fallback predefinito |
  | `plugin-sdk/account-helpers` | Helper account mirati | Helper per elenco account/azioni account |
  | `plugin-sdk/channel-setup` | Adapter della procedura guidata di configurazione | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive di abbinamento DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Cablaggio di prefisso risposta, digitazione e recapito sorgente | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Factory di adapter di configurazione e helper di accesso DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Builder di schemi di configurazione | Solo primitive condivise per schemi di configurazione dei canali e builder generico |
  | `plugin-sdk/bundled-channel-config-schema` | Schemi di configurazione in bundle | Solo Plugin in bundle mantenuti da OpenClaw; i nuovi Plugin devono definire schemi locali al Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Schemi di configurazione in bundle deprecati | Solo alias di compatibilità; usa `plugin-sdk/bundled-channel-config-schema` per i Plugin in bundle mantenuti |
  | `plugin-sdk/telegram-command-config` | Helper di configurazione comandi Telegram | Normalizzazione del nome comando, trimming della descrizione, validazione di duplicati/conflitti |
  | `plugin-sdk/channel-policy` | Risoluzione delle policy gruppo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helper per stato account e ciclo di vita dello stream bozza | `createAccountStatusSink`, helper di finalizzazione anteprima bozza |
  | `plugin-sdk/inbound-envelope` | Helper per envelope in ingresso | Helper condivisi per route e builder di envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helper per risposte in ingresso | Helper condivisi per registrazione e dispatch |
  | `plugin-sdk/messaging-targets` | Parsing del target di messaggistica | Helper per parsing/matching dei target |
  | `plugin-sdk/outbound-media` | Helper per media in uscita | Caricamento condiviso dei media in uscita |
  | `plugin-sdk/outbound-send-deps` | Helper per dipendenze di invio in uscita | Lookup leggero di `resolveOutboundSendDep` senza importare il runtime in uscita completo |
  | `plugin-sdk/outbound-runtime` | Helper di runtime in uscita | Helper per recapito in uscita, delegato identità/invio, sessione, formattazione e pianificazione payload |
  | `plugin-sdk/thread-bindings-runtime` | Helper di binding dei thread | Helper per ciclo di vita e adapter del binding dei thread |
  | `plugin-sdk/agent-media-payload` | Helper legacy per payload media | Builder di payload media agent per layout di campi legacy |
  | `plugin-sdk/channel-runtime` | Shim di compatibilità deprecato | Solo utilità legacy del runtime canale |
  | `plugin-sdk/channel-send-result` | Tipi di risultato invio | Tipi di risultato risposta |
  | `plugin-sdk/runtime-store` | Archiviazione persistente del Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helper di runtime ampi | Helper per runtime/logging/backup/installazione Plugin |
  | `plugin-sdk/runtime-env` | Helper mirati per ambiente runtime | Helper per logger/ambiente runtime, timeout, retry e backoff |
  | `plugin-sdk/plugin-runtime` | Helper condivisi di runtime Plugin | Helper per comandi/hook/http/interattivi del Plugin |
  | `plugin-sdk/hook-runtime` | Helper per pipeline di hook | Helper condivisi per pipeline Webhook/hook interni |
  | `plugin-sdk/lazy-runtime` | Helper di runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper di processo | Helper condivisi di exec |
  | `plugin-sdk/cli-runtime` | Helper di runtime CLI | Formattazione comandi, attese, helper di versione |
  | `plugin-sdk/gateway-runtime` | Helper Gateway | Client Gateway, helper di avvio pronto per l'event loop e helper di patch dello stato canale |
  | `plugin-sdk/config-runtime` | Shim deprecato di compatibilità configurazione | Preferisci `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` e `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Helper per comandi Telegram | Helper di validazione dei comandi Telegram stabili in fallback quando la superficie del contratto Telegram in bundle non è disponibile |
  | `plugin-sdk/approval-runtime` | Helper per prompt di approvazione | Payload di approvazione exec/Plugin, helper per capability/profilo di approvazione, helper per routing/runtime di approvazione nativi e formattazione strutturata del percorso di visualizzazione approvazione |
  | `plugin-sdk/approval-auth-runtime` | Helper di autorizzazione approvazione | Risoluzione approvatore, autorizzazione azione nella stessa chat |
  | `plugin-sdk/approval-client-runtime` | Helper client approvazione | Helper nativi per profilo/filtro di approvazione exec |
  | `plugin-sdk/approval-delivery-runtime` | Helper di recapito approvazione | Adapter nativi per capability/recapito approvazione |
  | `plugin-sdk/approval-gateway-runtime` | Helper Gateway approvazione | Helper condiviso per risoluzione del Gateway di approvazione |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper adapter approvazione | Helper leggeri di caricamento adapter di approvazione nativo per entrypoint canale hot |
  | `plugin-sdk/approval-handler-runtime` | Helper handler approvazione | Helper di runtime più ampi per handler di approvazione; preferisci le superfici adapter/Gateway più mirate quando bastano |
  | `plugin-sdk/approval-native-runtime` | Helper target approvazione | Helper nativi per binding target/account di approvazione |
  | `plugin-sdk/approval-reply-runtime` | Helper risposta approvazione | Helper per payload di risposta approvazione exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Helper per contesto runtime canale | Helper generici per registrazione/ottenimento/osservazione del contesto runtime canale |
  | `plugin-sdk/security-runtime` | Helper di sicurezza | Helper condivisi per fiducia, gate DM, file/percorsi limitati alla radice, contenuti esterni e raccolta segreti |
  | `plugin-sdk/ssrf-policy` | Helper per policy SSRF | Helper per allowlist host e policy di rete privata |
  | `plugin-sdk/ssrf-runtime` | Helper di runtime SSRF | Dispatcher bloccato, fetch protetto, helper per policy SSRF |
  | `plugin-sdk/system-event-runtime` | Helper per eventi di sistema | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Helper Heartbeat | Helper per eventi Heartbeat e visibilità |
  | `plugin-sdk/delivery-queue-runtime` | Helper per coda di recapito | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Helper di attività canale | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Helper di deduplicazione | Cache di deduplicazione in memoria |
  | `plugin-sdk/file-access-runtime` | Helper di accesso file | Helper sicuri per percorsi di file/media locali |
  | `plugin-sdk/transport-ready-runtime` | Helper di prontezza trasporto | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Helper per cache limitata | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper di gate diagnostico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper di formattazione errori | `formatUncaughtError`, `isApprovalNotFoundError`, helper per grafo errori |
  | `plugin-sdk/fetch-runtime` | Helper per fetch/proxy con wrapper | `resolveFetch`, helper proxy, helper per opzioni EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Helper di normalizzazione host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper di retry | `RetryConfig`, `retryAsync`, runner di policy |
  | `plugin-sdk/allow-from` | Formattazione allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mappatura input allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Helper per gate comandi e superficie comandi | `resolveControlCommandGate`, helper per autorizzazione mittente, helper per registro comandi inclusa la formattazione del menu di argomenti dinamici |
  | `plugin-sdk/command-status` | Renderer di stato/aiuto comandi | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing dell'input segreto | Helper per input segreto |
  | `plugin-sdk/webhook-ingress` | Helper per richieste Webhook | Utilità per target Webhook |
  | `plugin-sdk/webhook-request-guards` | Helper di guardia corpo Webhook | Helper di lettura/limite del corpo richiesta |
  | `plugin-sdk/reply-runtime` | Runtime risposta condiviso | Dispatch in ingresso, Heartbeat, planner di risposta, suddivisione in chunk |
  | `plugin-sdk/reply-dispatch-runtime` | Helper mirati per dispatch risposta | Finalizzazione, dispatch provider e helper per etichette conversazione |
  | `plugin-sdk/reply-history` | Helper per cronologia risposte | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Pianificazione dei riferimenti risposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper per chunk di risposta | Helper per suddivisione in chunk di testo/markdown |
  | `plugin-sdk/session-store-runtime` | Helper per archivio sessioni | Helper per percorso archivio e aggiornato-il |
  | `plugin-sdk/state-paths` | Helper per percorsi stato | Helper per directory stato e OAuth |
  | `plugin-sdk/routing` | Helper di routing/chiave sessione | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper di normalizzazione chiave sessione |
  | `plugin-sdk/status-helpers` | Helper di stato canale | Builder di riepilogo stato canale/account, valori predefiniti dello stato runtime, helper per metadati problemi |
  | `plugin-sdk/target-resolver-runtime` | Helper risolutore target | Helper condivisi per risolutore target |
  | `plugin-sdk/string-normalization-runtime` | Helper di normalizzazione stringhe | Helper di normalizzazione slug/stringhe |
  | `plugin-sdk/request-url` | Helper URL richiesta | Estrae URL stringa da input simili a richieste |
  | `plugin-sdk/run-command` | Helper per comandi temporizzati | Runner di comandi temporizzati con stdout/stderr normalizzati |
  | `plugin-sdk/param-readers` | Lettori di parametri | Lettori comuni di parametri tool/CLI |
  | `plugin-sdk/tool-payload` | Estrazione payload degli strumenti | Estrae payload normalizzati dagli oggetti risultato degli strumenti |
  | `plugin-sdk/tool-send` | Estrazione invio strumenti | Estrae i campi canonici della destinazione di invio dagli argomenti degli strumenti |
  | `plugin-sdk/temp-path` | Helper per percorsi temporanei | Helper condivisi per i percorsi di download temporanei |
  | `plugin-sdk/logging-core` | Helper di logging | Logger di sottosistema e helper di redazione |
  | `plugin-sdk/markdown-table-runtime` | Helper per tabelle Markdown | Helper per la modalita tabella Markdown |
  | `plugin-sdk/reply-payload` | Tipi di risposta ai messaggi | Tipi di payload di risposta |
  | `plugin-sdk/provider-setup` | Helper curati per la configurazione di provider locali/self-hosted | Helper di rilevamento/configurazione per provider self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Helper mirati per la configurazione di provider self-hosted compatibili con OpenAI | Gli stessi helper di rilevamento/configurazione per provider self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Helper di autenticazione runtime per provider | Helper di risoluzione delle chiavi API runtime |
  | `plugin-sdk/provider-auth-api-key` | Helper di configurazione chiave API per provider | Helper per onboarding/scrittura profilo con chiave API |
  | `plugin-sdk/provider-auth-result` | Helper per risultati di autenticazione provider | Builder standard per risultati di autenticazione OAuth |
  | `plugin-sdk/provider-auth-login` | Helper di login interattivo per provider | Helper condivisi per login interattivo |
  | `plugin-sdk/provider-selection-runtime` | Helper di selezione provider | Selezione provider configurata o automatica e unione della configurazione provider grezza |
  | `plugin-sdk/provider-env-vars` | Helper per variabili d'ambiente provider | Helper di ricerca variabili d'ambiente di autenticazione provider |
  | `plugin-sdk/provider-model-shared` | Helper condivisi per modelli/replay provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi di policy di replay, helper per endpoint provider e helper di normalizzazione degli ID modello |
  | `plugin-sdk/provider-catalog-shared` | Helper condivisi per cataloghi provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch di onboarding provider | Helper di configurazione onboarding |
  | `plugin-sdk/provider-http` | Helper HTTP per provider | Helper generici per capacita HTTP/endpoint provider, inclusi helper per moduli multipart di trascrizione audio |
  | `plugin-sdk/provider-web-fetch` | Helper web-fetch per provider | Helper di registrazione/cache per provider web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helper di configurazione web-search per provider | Helper mirati per configurazione/credenziali web-search per provider che non richiedono cablaggio di abilitazione Plugin |
  | `plugin-sdk/provider-web-search-contract` | Helper di contratto web-search per provider | Helper mirati per contratto di configurazione/credenziali web-search, come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con ambito |
  | `plugin-sdk/provider-web-search` | Helper web-search per provider | Helper di registrazione/cache/runtime per provider web-search |
  | `plugin-sdk/provider-tools` | Helper di compatibilita strumenti/schema provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pulizia schema Gemini + diagnostica e helper di compatibilita xAI come `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helper di utilizzo provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e altri helper di utilizzo provider |
  | `plugin-sdk/provider-stream` | Helper wrapper stream provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi wrapper stream e helper wrapper condivisi Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helper di trasporto provider | Helper di trasporto provider nativi, come fetch protetto, trasformazioni dei messaggi di trasporto e stream di eventi di trasporto scrivibili |
  | `plugin-sdk/keyed-async-queue` | Coda asincrona ordinata | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helper media condivisi | Helper di fetch/trasformazione/archiviazione media, rilevamento dimensioni video basato su ffprobe e builder di payload media |
  | `plugin-sdk/media-generation-runtime` | Helper condivisi per generazione media | Helper condivisi di failover, selezione candidati e messaggistica per modelli mancanti per generazione di immagini/video/musica |
  | `plugin-sdk/media-understanding` | Helper di comprensione media | Tipi di provider per comprensione media piu export di helper immagine/audio rivolti ai provider |
  | `plugin-sdk/text-runtime` | Helper testo condivisi | Rimozione del testo visibile all'assistente, helper di rendering/suddivisione/tabelle Markdown, helper di redazione, helper per tag direttiva, utility per testo sicuro e helper correlati per testo/logging |
  | `plugin-sdk/text-chunking` | Helper di suddivisione testo | Helper di suddivisione del testo in uscita |
  | `plugin-sdk/speech` | Helper speech | Tipi di provider speech piu helper di direttive, registro, validazione rivolti ai provider e builder TTS compatibile con OpenAI |
  | `plugin-sdk/speech-core` | Core speech condiviso | Tipi di provider speech, registro, direttive, normalizzazione |
  | `plugin-sdk/realtime-transcription` | Helper di trascrizione in tempo reale | Tipi di provider, helper di registro e helper condiviso per sessione WebSocket |
  | `plugin-sdk/realtime-voice` | Helper voce in tempo reale | Tipi di provider, helper di registro/risoluzione, helper di sessione bridge, code condivise di risposta vocale dell'agente, salute di trascrizione/eventi, soppressione eco e helper rapidi di consultazione contesto |
  | `plugin-sdk/image-generation` | Helper di generazione immagini | Tipi di provider di generazione immagini piu helper URL di asset/dati immagine e builder di provider immagini compatibile con OpenAI |
  | `plugin-sdk/image-generation-core` | Core condiviso di generazione immagini | Tipi di generazione immagini, failover, autenticazione e helper di registro |
  | `plugin-sdk/music-generation` | Helper di generazione musica | Tipi provider/richiesta/risultato di generazione musica |
  | `plugin-sdk/music-generation-core` | Core condiviso di generazione musica | Tipi di generazione musica, helper di failover, ricerca provider e parsing dei riferimenti modello |
  | `plugin-sdk/video-generation` | Helper di generazione video | Tipi provider/richiesta/risultato di generazione video |
  | `plugin-sdk/video-generation-core` | Core condiviso di generazione video | Tipi di generazione video, helper di failover, ricerca provider e parsing dei riferimenti modello |
  | `plugin-sdk/interactive-runtime` | Helper di risposta interattiva | Normalizzazione/riduzione del payload di risposta interattiva |
  | `plugin-sdk/channel-config-primitives` | Primitive di configurazione canale | Primitive mirate per schema di configurazione canale |
  | `plugin-sdk/channel-config-writes` | Helper di scrittura configurazione canale | Helper di autorizzazione per scrittura configurazione canale |
  | `plugin-sdk/channel-plugin-common` | Prelude canale condiviso | Export prelude Plugin canale condivisi |
  | `plugin-sdk/channel-status` | Helper di stato canale | Helper condivisi per snapshot/riepilogo dello stato canale |
  | `plugin-sdk/allowlist-config-edit` | Helper di configurazione allowlist | Helper di modifica/lettura configurazione allowlist |
  | `plugin-sdk/group-access` | Helper di accesso gruppi | Helper condivisi per decisioni di accesso gruppi |
  | `plugin-sdk/direct-dm` | Helper Direct-DM | Helper condivisi di autenticazione/guardia Direct-DM |
  | `plugin-sdk/extension-shared` | Helper estensione condivisi | Primitive helper per canale passivo/stato e proxy ambientale |
  | `plugin-sdk/webhook-targets` | Helper target Webhook | Registro target Webhook e helper di installazione route |
  | `plugin-sdk/webhook-path` | Helper percorso Webhook | Helper di normalizzazione percorso Webhook |
  | `plugin-sdk/web-media` | Helper media web condivisi | Helper di caricamento media remoti/locali |
  | `plugin-sdk/zod` | Riesportazione Zod | `zod` riesportato per i consumatori dell'SDK Plugin |
  | `plugin-sdk/memory-core` | Helper memory-core in bundle | Superficie di helper per gestore/configurazione/file/CLI della memoria |
  | `plugin-sdk/memory-core-engine-runtime` | Facciata runtime motore memoria | Facciata runtime di indice/ricerca memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motore foundation host memoria | Export del motore foundation host memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motore embedding host memoria | Contratti di embedding memoria, accesso al registro, provider locale e helper generici batch/remoti; i provider remoti concreti vivono nei rispettivi Plugin proprietari |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motore QMD host memoria | Export del motore QMD host memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motore storage host memoria | Export del motore storage host memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali host memoria | Helper multimodali host memoria |
  | `plugin-sdk/memory-core-host-query` | Helper query host memoria | Helper query host memoria |
  | `plugin-sdk/memory-core-host-secret` | Helper segreti host memoria | Helper segreti host memoria |
  | `plugin-sdk/memory-core-host-events` | Helper journal eventi host memoria | Helper journal eventi host memoria |
  | `plugin-sdk/memory-core-host-status` | Helper stato host memoria | Helper stato host memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI host memoria | Helper runtime CLI host memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime core host memoria | Helper runtime core host memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host memoria | Helper file/runtime host memoria |
  | `plugin-sdk/memory-host-core` | Alias runtime core host memoria | Alias vendor-neutral per helper runtime core host memoria |
  | `plugin-sdk/memory-host-events` | Alias journal eventi host memoria | Alias vendor-neutral per helper journal eventi host memoria |
  | `plugin-sdk/memory-host-files` | Alias file/runtime host memoria | Alias vendor-neutral per helper file/runtime host memoria |
  | `plugin-sdk/memory-host-markdown` | Helper Markdown gestito | Helper condivisi per Markdown gestito per Plugin adiacenti alla memoria |
  | `plugin-sdk/memory-host-search` | Facciata ricerca active memory | Facciata runtime lazy del gestore di ricerca active-memory |
  | `plugin-sdk/memory-host-status` | Alias stato host memoria | Alias vendor-neutral per helper stato host memoria |
  | `plugin-sdk/testing` | Utility di test | Barrel ampio di compatibilita legacy; preferisci sottopercorsi di test mirati come `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` e `plugin-sdk/test-fixtures` |
</Accordion>

Questa tabella è intenzionalmente il sottoinsieme comune per la migrazione, non l'intera
superficie dell'SDK. L'elenco completo di oltre 200 entrypoint si trova in
`scripts/lib/plugin-sdk-entrypoints.json`.

Le seam helper riservate dei Plugin in bundle sono state ritirate dalla mappa
degli export dell'SDK pubblico, fatta eccezione per le facade di compatibilità
documentate esplicitamente, come lo shim deprecato `plugin-sdk/discord`
mantenuto per il pacchetto pubblicato `@openclaw/discord@2026.3.13`. Gli helper
specifici del proprietario vivono all'interno del pacchetto Plugin proprietario;
il comportamento host condiviso dovrebbe passare attraverso contratti SDK
generici come `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` e
`plugin-sdk/plugin-config-runtime`.

Usa l'import più ristretto che corrisponde al lavoro. Se non riesci a trovare
un export, controlla il sorgente in `src/plugin-sdk/` oppure chiedi ai
maintainer quale contratto generico dovrebbe possederlo.

## Deprecazioni attive

Deprecazioni più ristrette che si applicano all'intero SDK dei Plugin, al
contratto provider, alla superficie runtime e al manifest. Ognuna funziona
ancora oggi, ma sarà rimossa in una futura release major. La voce sotto ogni
elemento mappa la vecchia API al suo sostituto canonico.

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
    `openclaw/plugin-sdk/channel-inbound` oppure
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nuovo**: `resolveInboundMentionDecision({ facts, policy })` - restituisce
    un singolo oggetto decisionale invece di due chiamate separate.

    I Plugin di canale downstream (Slack, Discord, Matrix, MS Teams) sono già
    passati al nuovo approccio.

  </Accordion>

  <Accordion title="Shim runtime di canale e helper per azioni di canale">
    `openclaw/plugin-sdk/channel-runtime` è uno shim di compatibilità per i
    Plugin di canale più vecchi. Non importarlo dal nuovo codice; usa
    `openclaw/plugin-sdk/channel-runtime-context` per registrare oggetti
    runtime.

    Gli helper `channelActions*` in `openclaw/plugin-sdk/channel-actions` sono
    deprecati insieme agli export di canale grezzi "actions". Esponi invece le
    capacità attraverso la superficie semantica `presentation` - i Plugin di
    canale dichiarano cosa renderizzano (schede, pulsanti, selezioni) invece
    dei nomi di azione grezzi che accettano.

  </Accordion>

  <Accordion title="Helper tool() del provider di ricerca web → createTool() sul plugin">
    **Vecchio**: factory `tool()` da `openclaw/plugin-sdk/provider-web-search`.

    **Nuovo**: implementa `createTool(...)` direttamente sul Plugin provider.
    OpenClaw non ha più bisogno dell'helper SDK per registrare il wrapper dello
    strumento.

  </Accordion>

  <Accordion title="Envelope di canale in testo semplice → BodyForAgent">
    **Vecchio**: `formatInboundEnvelope(...)` (e
    `ChannelMessageForAgent.channelEnvelope`) per costruire un envelope prompt
    piatto in testo semplice dai messaggi di canale in ingresso.

    **Nuovo**: `BodyForAgent` più blocchi strutturati di contesto utente. I
    Plugin di canale allegano metadati di routing (thread, argomento, reply-to,
    reazioni) come campi tipizzati invece di concatenarli in una stringa prompt.
    L'helper `formatAgentEnvelope(...)` è ancora supportato per envelope
    sintetizzati rivolti all'assistente, ma gli envelope in ingresso in testo
    semplice sono in via di uscita.

    Aree interessate: `inbound_claim`, `message_received` e qualsiasi Plugin di
    canale personalizzato che post-elaborava il testo `channelEnvelope`.

  </Accordion>

  <Accordion title="Tipi di discovery provider → tipi catalogo provider">
    Quattro alias di tipo di discovery ora sono wrapper sottili sui tipi
    dell'era del catalogo:

    | Vecchio alias             | Nuovo tipo                |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    In più, il vecchio contenitore statico `ProviderCapabilities` - i Plugin
    provider dovrebbero usare hook provider espliciti come `buildReplayPolicy`,
    `normalizeToolSchemas` e `wrapStreamFn` invece di un oggetto statico.

  </Accordion>

  <Accordion title="Hook della policy di ragionamento → resolveThinkingProfile">
    **Vecchio** (tre hook separati su `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` e
    `resolveDefaultThinkingLevel(ctx)`.

    **Nuovo**: un singolo `resolveThinkingProfile(ctx)` che restituisce un
    `ProviderThinkingProfile` con l'`id` canonico, una `label` opzionale e
    l'elenco ordinato dei livelli. OpenClaw effettua automaticamente il
    downgrade dei valori memorizzati obsoleti in base al rango del profilo.

    Implementa un hook invece di tre. Gli hook legacy continuano a funzionare
    durante la finestra di deprecazione, ma non vengono composti con il risultato
    del profilo.

  </Accordion>

  <Accordion title="Fallback provider OAuth esterno → contracts.externalAuthProviders">
    **Vecchio**: implementare `resolveExternalOAuthProfiles(...)` senza
    dichiarare il provider nel manifest del Plugin.

    **Nuovo**: dichiara `contracts.externalAuthProviders` nel manifest del
    Plugin **e** implementa `resolveExternalAuthProfiles(...)`. Il vecchio
    percorso di "auth fallback" emette un avviso a runtime e sarà rimosso.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Lookup env-var provider → setup.providers[].envVars">
    **Vecchio** campo manifest: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nuovo**: rispecchia lo stesso lookup di env-var in `setup.providers[].envVars`
    nel manifest. Questo consolida i metadati env di setup/stato in un unico
    posto ed evita di avviare il runtime del Plugin solo per rispondere ai
    lookup env-var.

    `providerAuthEnvVars` resta supportato tramite un adattatore di compatibilità
    finché la finestra di deprecazione non si chiude.

  </Accordion>

  <Accordion title="Registrazione Plugin di memoria → registerMemoryCapability">
    **Vecchio**: tre chiamate separate -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nuovo**: una chiamata sull'API memory-state -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Stessi slot, singola chiamata di registrazione. Gli helper di memoria
    additivi (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) non sono interessati.

  </Accordion>

  <Accordion title="Tipi dei messaggi di sessione subagent rinominati">
    Due alias di tipo legacy sono ancora esportati da `src/plugins/runtime/types.ts`:

    | Vecchio                       | Nuovo                           |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Il metodo runtime `readSession` è deprecato a favore di
    `getSessionMessages`. Stessa firma; il vecchio metodo inoltra la chiamata a
    quello nuovo.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Vecchio**: `runtime.tasks.flow` (singolare) restituiva un accessor live
    per task-flow.

    **Nuovo**: `runtime.tasks.managedFlows` mantiene il runtime di mutazione
    TaskFlow gestito per i Plugin che creano, aggiornano, annullano o eseguono
    task figli da un flusso. Usa `runtime.tasks.flows` quando il Plugin ha
    bisogno solo di letture basate su DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Factory di estensioni embedded → middleware agent tool-result">
    Trattato in "Come migrare → Migrare le estensioni Pi tool-result a
    middleware" sopra. Incluso qui per completezza: il percorso rimosso solo per
    Pi `api.registerEmbeddedExtensionFactory(...)` è sostituito da
    `api.registerAgentToolResultMiddleware(...)` con un elenco runtime esplicito
    in `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` riesportato da `openclaw/plugin-sdk` ora è un alias di
    una riga per `OpenClawConfig`. Preferisci il nome canonico.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Le deprecazioni a livello di estensione (dentro i Plugin di canale/provider in
bundle sotto `extensions/`) sono tracciate nei rispettivi barrel `api.ts` e
`runtime-api.ts`. Non influiscono sui contratti dei Plugin di terze parti e non
sono elencate qui. Se consumi direttamente il barrel locale di un Plugin in
bundle, leggi i commenti di deprecazione in quel barrel prima di aggiornare.
</Note>

## Timeline di rimozione

| Quando                 | Cosa succede                                                           |
| ---------------------- | ----------------------------------------------------------------------- |
| **Ora**                | Le superfici deprecate emettono avvisi a runtime                       |
| **Prossima release major** | Le superfici deprecate saranno rimosse; i Plugin che le usano ancora falliranno |

Tutti i Plugin core sono già stati migrati. I Plugin esterni dovrebbero migrare
prima della prossima release major.

## Sopprimere temporaneamente gli avvisi

Imposta queste variabili d'ambiente mentre lavori alla migrazione:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Questa è una via di fuga temporanea, non una soluzione permanente.

## Correlati

- [Introduzione](/it/plugins/building-plugins) - crea il tuo primo Plugin
- [Panoramica dell'SDK](/it/plugins/sdk-overview) - riferimento completo degli import da sottopercorsi
- [Plugin di canale](/it/plugins/sdk-channel-plugins) - creazione di Plugin di canale
- [Plugin provider](/it/plugins/sdk-provider-plugins) - creazione di Plugin provider
- [Interni dei Plugin](/it/plugins/architecture) - approfondimento sull'architettura
- [Manifest dei Plugin](/it/plugins/manifest) - riferimento dello schema manifest
