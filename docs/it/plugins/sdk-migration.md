---
read_when:
    - Vedi l'avviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vedi l'avviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Hai utilizzato api.registerEmbeddedExtensionFactory prima di OpenClaw 2026.4.25
    - Stai aggiornando un plugin all'architettura moderna dei plugin
    - Gestisci un Plugin OpenClaw esterno
sidebarTitle: Migrate to SDK
summary: Esegui la migrazione dal livello legacy di retrocompatibilità al moderno SDK dei Plugin
title: Migrazione dell’SDK Plugin
x-i18n:
    generated_at: "2026-06-27T18:01:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9061b31567cbd24196458ecb9af1cb1b0351f789a136ea26951c8fb7e576cf08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw è passato da un ampio livello di compatibilità retroattiva a una moderna
architettura di Plugin con import mirati e documentati. Se il tuo Plugin è stato
creato prima della nuova architettura, questa guida ti aiuta a migrare.

## Cosa cambia

Il vecchio sistema di Plugin forniva due superfici molto aperte che consentivano
ai Plugin di importare tutto ciò di cui avevano bisogno da un unico punto di ingresso:

- **`openclaw/plugin-sdk/compat`** - un singolo import che riesportava decine di
  helper. È stato introdotto per mantenere funzionanti i Plugin più vecchi basati
  su hook mentre veniva costruita la nuova architettura dei Plugin.
- **`openclaw/plugin-sdk/infra-runtime`** - un ampio barrel di helper di runtime che
  mescolava eventi di sistema, stato Heartbeat, code di consegna, helper fetch/proxy,
  helper per file, tipi di approvazione e utilità non correlate.
- **`openclaw/plugin-sdk/config-runtime`** - un ampio barrel di compatibilità per la
  configurazione che conserva ancora helper deprecati di caricamento/scrittura diretti
  durante la finestra di migrazione.
- **`openclaw/extension-api`** - un bridge che dava ai Plugin accesso diretto agli
  helper lato host, come il runner dell'agente incorporato.
- **`api.registerEmbeddedExtensionFactory(...)`** - un hook di estensione integrata
  solo per embedded runner, rimosso, che poteva osservare eventi dell'embedded runner
  come `tool_result`.

Le superfici di import ampie sono ora **deprecate**. Funzionano ancora a runtime,
ma i nuovi Plugin non devono usarle e i Plugin esistenti dovrebbero migrare prima
che la prossima release principale le rimuova. L'API di registrazione della factory
di estensioni solo per embedded runner è stata rimossa; usa invece il middleware
per i risultati degli strumenti.

OpenClaw non rimuove né reinterpreta il comportamento documentato dei Plugin nello
stesso cambiamento che introduce una sostituzione. Le modifiche che rompono il
contratto devono prima passare attraverso un adapter di compatibilità, diagnostica,
documentazione e una finestra di deprecazione. Questo vale per import dell'SDK,
campi del manifest, API di configurazione, hook e comportamento di registrazione
a runtime.

<Warning>
  Il livello di compatibilità retroattiva sarà rimosso in una futura release principale.
  I Plugin che importano ancora da queste superfici si romperanno quando ciò avverrà.
  Le registrazioni legacy delle factory di estensioni integrate già non vengono più caricate.
</Warning>

## Perché è cambiato

Il vecchio approccio causava problemi:

- **Avvio lento** - importare un helper caricava decine di moduli non correlati
- **Dipendenze circolari** - le ampie riesportazioni rendevano facile creare cicli di import
- **Superficie API poco chiara** - non c'era modo di distinguere quali export fossero stabili e quali interni

Il moderno SDK dei Plugin risolve questo problema: ogni percorso di import (`openclaw/plugin-sdk/\<subpath\>`)
è un modulo piccolo, autonomo, con uno scopo chiaro e un contratto documentato.

Anche le superfici di comodità legacy dei provider per i canali integrati sono state rimosse.
Le superfici helper marchiate per canale erano scorciatoie private del mono-repo, non contratti
stabili per i Plugin. Usa invece sottopercorsi SDK generici e ristretti. All'interno del workspace
dei Plugin integrati, mantieni gli helper di proprietà del provider nel relativo `api.ts` o
`runtime-api.ts`.

Esempi attuali di provider integrati:

- Anthropic mantiene gli helper di stream specifici per Claude nella propria superficie `api.ts` /
  `contract-api.ts`
- OpenAI mantiene provider builder, helper per modelli predefiniti e realtime provider
  builder nel proprio `api.ts`
- OpenRouter mantiene provider builder e helper di onboarding/configurazione nel proprio
  `api.ts`

## Piano di migrazione di Talk e voce in tempo reale

Il codice di voce in tempo reale, telefonia, riunioni e Talk nel browser si sta spostando
dalla contabilità dei turni locale alla superficie a un controller condiviso di sessione Talk
esportato da `openclaw/plugin-sdk/realtime-voice`. Il nuovo controller possiede l'envelope comune
degli eventi Talk, lo stato del turno attivo, lo stato di acquisizione, lo stato dell'audio in uscita,
la cronologia degli eventi recenti e il rifiuto dei turni obsoleti. I Plugin provider dovrebbero
continuare a possedere le sessioni in tempo reale specifiche del vendor; i Plugin di superficie
dovrebbero continuare a possedere acquisizione, riproduzione, telefonia e particolarità delle riunioni.

Questa migrazione di Talk è intenzionalmente una rottura pulita:

1. Mantieni le primitive condivise di controller/runtime in
   `plugin-sdk/realtime-voice`.
2. Sposta le superfici integrate sul controller condiviso: relay browser,
   handoff di managed-room, voice-call realtime, voice-call streaming STT, Google
   Meet realtime e push-to-talk nativo.
3. Sostituisci le vecchie famiglie RPC Talk con l'API finale `talk.session.*` e
   `talk.client.*`.
4. Pubblicizza un unico canale di eventi Talk live in Gateway
   `hello-ok.features.events`: `talk.event`.
5. Elimina il vecchio endpoint HTTP realtime e qualsiasi percorso di override
   delle istruzioni al momento della richiesta.

Il nuovo codice non dovrebbe chiamare direttamente `createTalkEventSequencer(...)` a meno che
non stia implementando un adapter di basso livello o una fixture di test. Preferisci il controller
condiviso, così gli eventi con ambito di turno non possono essere emessi senza un ID turno, le chiamate
`turnEnd` / `turnCancel` obsolete non possono cancellare un turno attivo più recente e gli eventi del
ciclo di vita dell'audio in uscita restano coerenti tra telefonia, riunioni, relay browser, handoff
managed-room e client Talk nativi.

La forma prevista dell'API pubblica è:

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
superficie comune gestita dal Gateway per realtime gateway-relay, trascrizione gateway-relay
e sessioni STT/TTS native managed-room.

Le configurazioni legacy che collocavano selettori realtime accanto a `talk.provider` /
`talk.providers` dovrebbero essere riparate con `openclaw doctor --fix`; il runtime Talk
non reinterpreta la configurazione dei provider speech/TTS come configurazione di provider realtime.

Le combinazioni supportate da `talk.session.create` sono volutamente poche:

| Modalità        | Trasporto       | Brain           | Proprietario       | Note                                                                                                               |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio provider full-duplex collegato tramite il Gateway; le chiamate agli strumenti vengono instradate tramite lo strumento agent-consult. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Solo STT in streaming; i chiamanti inviano audio in input e ricevono eventi di trascrizione.                       |
| `stt-tts`       | `managed-room`  | `agent-consult` | Stanza nativa/client | Stanze in stile push-to-talk e walkie-talkie in cui il client possiede acquisizione/riproduzione e il Gateway possiede lo stato del turno. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Stanza nativa/client | Modalità stanza solo admin per superfici proprietarie attendibili che eseguono direttamente le azioni degli strumenti del Gateway. |

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
  | ------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Aggiungi un frammento audio PCM base64 alla sessione del provider posseduta dalla stessa connessione Gateway.                                                                           |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Avvia un turno utente di managed-room.                                                                                                                                                  |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Termina il turno attivo dopo la convalida del turno obsoleto.                                                                                                                          |
  | `talk.session.cancelTurn`       | tutte le sessioni possedute dal Gateway                 | Annulla il lavoro di acquisizione/provider/agente/TTS attivo per un turno.                                                                                                             |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Interrompi l'output audio dell'assistente senza necessariamente terminare il turno utente.                                                                                              |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Completa una chiamata a uno strumento del provider emessa dal relay; passa `options.willContinue` per output intermedi o `options.suppressResponse` per soddisfare la chiamata senza un'altra risposta dell'assistente. |
  | `talk.session.steer`            | sessioni Talk supportate da agente                      | Invia un controllo parlato `status`, `steer`, `cancel` o `followup` all'esecuzione incorporata attiva risolta dalla sessione Talk.                                                     |
  | `talk.session.close`            | tutte le sessioni unificate                             | Interrompi le sessioni relay o revoca lo stato managed-room, quindi dimentica l'id della sessione unificata.                                                                            |

  Non introdurre casi speciali di provider o piattaforma nel core per far funzionare tutto questo.
  Il core possiede la semantica delle sessioni Talk. I Plugin dei provider possiedono la configurazione delle sessioni del vendor.
  Le chiamate vocali e Google Meet possiedono gli adattatori di telefonia/riunione. Browser e app native
  possiedono l'UX di acquisizione/riproduzione dei dispositivi.

  ## Criterio di compatibilità

  Per i Plugin esterni, il lavoro di compatibilità segue questo ordine:

  1. aggiungere il nuovo contratto
  2. mantenere il vecchio comportamento collegato tramite un adattatore di compatibilità
  3. emettere una diagnostica o un avviso che nomina il vecchio percorso e la sostituzione
  4. coprire entrambi i percorsi nei test
  5. documentare la deprecazione e il percorso di migrazione
  6. rimuovere solo dopo la finestra di migrazione annunciata, di solito in una release maggiore

  I manutentori possono controllare la coda di migrazione corrente con
  `pnpm plugins:boundary-report`. Usa `pnpm plugins:boundary-report:summary` per
  conteggi compatti, `--owner <id>` per un Plugin o proprietario di compatibilità, e
  `pnpm plugins:boundary-report:ci` quando un gate CI deve fallire su record di
  compatibilità scaduti, import SDK riservati tra proprietari o sottopercorsi SDK
  riservati inutilizzati. Il report raggruppa i record di
  compatibilità deprecati per data di rimozione, conta i riferimenti locali in codice/docs,
  evidenzia import SDK riservati tra proprietari e riassume il bridge SDK privato
  dell'host di memoria, così la pulizia della compatibilità resta esplicita invece di
  basarsi su ricerche ad hoc. I sottopercorsi SDK riservati devono avere uso del proprietario tracciato;
  gli export di helper riservati inutilizzati devono essere rimossi dall'SDK pubblico.

  Se un campo del manifest è ancora accettato, gli autori di Plugin possono continuare a usarlo finché
  la documentazione e le diagnostiche non indicano diversamente. Il nuovo codice dovrebbe preferire la sostituzione
  documentata, ma i Plugin esistenti non dovrebbero rompersi durante le normali release minori.

  ## Come migrare

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    I Plugin inclusi devono smettere di chiamare
    `api.runtime.config.loadConfig()` e
    `api.runtime.config.writeConfigFile(...)` direttamente. Preferisci la configurazione che è stata
    già passata nel percorso di chiamata attivo. Gli handler di lunga durata che necessitano dello
    snapshot del processo corrente possono usare `api.runtime.config.current()`. Gli strumenti agente
    di lunga durata devono usare `ctx.getRuntimeConfig()` del contesto dello strumento dentro
    `execute`, così uno strumento creato prima di una scrittura della configurazione vede comunque la
    configurazione runtime aggiornata.

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
    follow-up e vuole deliberatamente sopprimere il pianificatore di ricarica.
    I risultati della mutazione includono un riepilogo `followUp` tipizzato per test e logging;
    il gateway resta responsabile dell'applicazione o pianificazione del riavvio.
    `loadConfig` e `writeConfigFile` restano helper di compatibilità deprecati
    per i Plugin esterni durante la finestra di migrazione e avvisano una volta con
    il codice di compatibilità `runtime-config-load-write`. I Plugin inclusi e il codice runtime
    del repo sono protetti dai guardrail dello scanner in
    `pnpm check:deprecated-api-usage` e
    `pnpm check:no-runtime-action-load-config`: il nuovo uso in Plugin di produzione
    fallisce direttamente, le scritture dirette della configurazione falliscono, i metodi del server gateway devono usare
    lo snapshot runtime della richiesta, gli helper di invio/azione/client del canale runtime
    devono ricevere la configurazione dal proprio confine, e i moduli runtime di lunga durata hanno
    zero chiamate ambientali `loadConfig()` consentite.

    Il nuovo codice Plugin dovrebbe inoltre evitare di importare l'ampio
    barrel di compatibilità `openclaw/plugin-sdk/config-runtime`. Usa il sottopercorso SDK ristretto
    che corrisponde al lavoro:

    | Necessità | Import |
    | --- | --- |
    | Tipi di configurazione come `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Asserzioni di configurazione già caricata e lookup della configurazione di ingresso Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Letture dello snapshot runtime corrente | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Scritture della configurazione | `openclaw/plugin-sdk/config-mutation` |
    | Helper di archivio sessione | `openclaw/plugin-sdk/session-store-runtime` |
    | Configurazione tabella Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helper runtime per criteri di gruppo | `openclaw/plugin-sdk/runtime-group-policy` |
    | Risoluzione dell'input segreto | `openclaw/plugin-sdk/secret-input-runtime` |
    | Override di modello/sessione | `openclaw/plugin-sdk/model-session-runtime` |

    I Plugin inclusi e i loro test sono protetti dallo scanner contro l'ampio
    barrel, così import e mock restano locali al comportamento di cui hanno bisogno. L'ampio
    barrel esiste ancora per la compatibilità esterna, ma il nuovo codice non dovrebbe
    dipendere da esso.

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    I Plugin inclusi devono sostituire gli handler di risultati strumenti
    `api.registerEmbeddedExtensionFactory(...)`, solo per embedded-runner,
    con middleware neutro rispetto al runtime.

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

    I Plugin installati possono anche registrare middleware di risultati strumenti quando sono
    esplicitamente abilitati e dichiarano ogni runtime mirato in
    `contracts.agentToolResultMiddleware`. Le registrazioni di middleware installati non dichiarati
    vengono rifiutate.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    I Plugin di canale capaci di approvazione ora espongono il comportamento di approvazione nativo tramite
    `approvalCapability.nativeRuntime` più il registro condiviso del contesto runtime.

    Modifiche principali:

    - Sostituisci `approvalCapability.handler.loadRuntime(...)` con
      `approvalCapability.nativeRuntime`
    - Sposta auth/delivery specifici delle approvazioni dal cablaggio legacy `plugin.auth` /
      `plugin.approvals` a `approvalCapability`
    - `ChannelPlugin.approvals` è stato rimosso dal contratto pubblico dei Plugin di canale;
      sposta i campi delivery/native/render su `approvalCapability`
    - `plugin.auth` resta solo per i flussi di login/logout del canale; gli hook auth
      delle approvazioni lì non sono più letti dal core
    - Registra oggetti runtime posseduti dal canale, come client, token o app Bolt,
      tramite `openclaw/plugin-sdk/channel-runtime-context`
    - Non inviare notifiche di reroute possedute dal Plugin dagli handler di approvazione nativi;
      il core ora possiede le notifiche instradate altrove dai risultati di consegna effettivi
    - Quando passi `channelRuntime` in `createChannelManager(...)`, fornisci una
      superficie reale `createPluginRuntime().channel`. Gli stub parziali vengono rifiutati.

    Consulta `/plugins/sdk-channel-plugins` per il layout corrente delle capability di approvazione.

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

    Se il tuo chiamante non dipende intenzionalmente dal fallback della shell, non impostare
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
    Ogni export della vecchia superficie corrisponde a uno specifico percorso di import moderno:

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

    Lo stesso schema si applica ad altri helper bridge legacy:

    | Import precedente | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper dello store di sessione | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Sostituisci gli import infra-runtime ampi">
    `openclaw/plugin-sdk/infra-runtime` esiste ancora per la compatibilità
    esterna, ma il nuovo codice dovrebbe importare la superficie di helper
    mirata di cui ha effettivamente bisogno:

    | Esigenza | Import |
    | --- | --- |
    | Helper della coda eventi di sistema | `openclaw/plugin-sdk/system-event-runtime` |
    | Helper per risveglio, evento e visibilità Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
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
    | Lock sui file | `openclaw/plugin-sdk/file-lock` |

    I plugin inclusi sono protetti dallo scanner contro `infra-runtime`, quindi
    il codice del repo non può regredire al barrel ampio.

  </Step>

  <Step title="Migra gli helper delle route dei canali">
    Il nuovo codice per le route dei canali dovrebbe usare `openclaw/plugin-sdk/channel-route`.
    I vecchi nomi route-key e comparable-target restano come alias di compatibilità
    durante la finestra di migrazione, ma i nuovi plugin dovrebbero usare i nomi
    delle route che descrivono direttamente il comportamento:

    | Helper precedente | Helper moderno |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Gli helper moderni delle route normalizzano `{ channel, to, accountId, threadId }`
    in modo coerente tra approvazioni native, soppressione delle risposte, deduplicazione
    in ingresso, consegna cron e routing della sessione.

    Non aggiungere nuovi usi di `ChannelMessagingAdapter.parseExplicitTarget` o
    degli helper di route caricate basati sul parser (`parseExplicitTargetForLoadedChannel`
    o `resolveRouteTargetForLoadedChannel`) né di
    `resolveChannelRouteTargetWithParser(...)` da `plugin-sdk/channel-route`.
    Questi hook sono deprecati e restano solo per i plugin più vecchi durante la
    finestra di migrazione. I nuovi plugin di canale dovrebbero usare
    `messaging.targetResolver.resolveTarget(...)` per la normalizzazione degli ID
    destinazione e il fallback in caso di directory-miss, `messaging.inferTargetChatType(...)`
    quando il core richiede un tipo di peer anticipato, e `messaging.resolveOutboundSessionRoute(...)`
    per l'identità di sessione e thread nativa del provider.

  </Step>

  <Step title="Compila e testa">
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
  | `plugin-sdk/core` | Riesportazione ombrello legacy per definizioni/builder di entry di canale | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Esportazione dello schema di configurazione root | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper di entry per provider singolo | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definizioni e builder mirati per l'entry di canale | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helper condivisi per la procedura guidata di configurazione | Traduttore di configurazione, prompt di allowlist, builder dello stato di configurazione |
  | `plugin-sdk/setup-runtime` | Helper runtime per la fase di configurazione | `createSetupTranslator`, adattatori di patch di configurazione sicuri da importare, helper per note di lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy di configurazione delegati |
  | `plugin-sdk/setup-adapter-runtime` | Alias deprecato dell'adattatore di configurazione | Usa `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Helper per gli strumenti di configurazione | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper multi-account | Helper per elenco account/configurazione/gate delle azioni |
  | `plugin-sdk/account-id` | Helper per account-id | `DEFAULT_ACCOUNT_ID`, normalizzazione degli account-id |
  | `plugin-sdk/account-resolution` | Helper per la ricerca degli account | Helper per ricerca account + fallback predefinito |
  | `plugin-sdk/account-helpers` | Helper account mirati | Helper per elenco account/azioni account |
  | `plugin-sdk/channel-setup` | Adattatori della procedura guidata di configurazione | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive di associazione DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Cablaggio di prefisso risposta, digitazione e consegna della sorgente | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Factory di adattatori di configurazione e helper di accesso DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Builder dello schema di configurazione | Primitive condivise dello schema di configurazione dei canali e solo il builder generico |
  | `plugin-sdk/bundled-channel-config-schema` | Schemi di configurazione bundled | Solo Plugin bundled mantenuti da OpenClaw; i nuovi Plugin devono definire schemi locali al Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Schemi di configurazione bundled deprecati | Solo alias di compatibilità; usa `plugin-sdk/bundled-channel-config-schema` per i Plugin bundled mantenuti |
  | `plugin-sdk/telegram-command-config` | Helper di configurazione dei comandi Telegram | Normalizzazione dei nomi dei comandi, taglio delle descrizioni, validazione di duplicati/conflitti |
  | `plugin-sdk/channel-policy` | Risoluzione policy gruppo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Facciata di compatibilità deprecata | Usa `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Helper per envelope in entrata | Helper condivisi per route + builder di envelope |
  | `plugin-sdk/channel-inbound` | Helper per ricezione in entrata | Costruzione del contesto, formattazione, root, runner, dispatch delle risposte preparate e predicati di dispatch |
  | `plugin-sdk/messaging-targets` | Percorso di importazione deprecato per il parsing dei target | Usa `plugin-sdk/channel-targets` per helper generici di parsing dei target, `plugin-sdk/channel-route` per il confronto delle route e `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` di proprietà del Plugin per la risoluzione dei target specifica del provider |
  | `plugin-sdk/outbound-media` | Helper per media in uscita | Caricamento condiviso dei media in uscita |
  | `plugin-sdk/outbound-send-deps` | Facciata di compatibilità deprecata | Usa `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Helper per il ciclo di vita dei messaggi in uscita | Adattatori di messaggi, ricevute, helper di invio durevole, helper di anteprima live/streaming, opzioni di risposta, helper del ciclo di vita, identità in uscita e pianificazione dei payload |
  | `plugin-sdk/channel-streaming` | Facciata di compatibilità deprecata | Usa `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Facciata di compatibilità deprecata | Usa `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Helper per associazioni di thread | Ciclo di vita delle associazioni di thread e helper per adattatori |
  | `plugin-sdk/agent-media-payload` | Helper legacy per payload media | Builder del payload media dell'agente per layout di campi legacy |
  | `plugin-sdk/channel-runtime` | Shim di compatibilità deprecato | Solo utility runtime legacy dei canali |
  | `plugin-sdk/channel-send-result` | Tipi del risultato di invio | Tipi del risultato di risposta |
  | `plugin-sdk/runtime-store` | Archiviazione persistente del Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helper runtime ampi | Helper runtime/logging/backup/installazione Plugin |
  | `plugin-sdk/runtime-env` | Helper mirati per env runtime | Helper per logger/env runtime, timeout, retry e backoff |
  | `plugin-sdk/plugin-runtime` | Helper runtime condivisi per Plugin | Helper per comandi/hook/http/interattività dei Plugin |
  | `plugin-sdk/hook-runtime` | Helper per pipeline di hook | Helper condivisi per pipeline Webhook/hook interni |
  | `plugin-sdk/lazy-runtime` | Helper runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper di processo | Helper exec condivisi |
  | `plugin-sdk/cli-runtime` | Helper runtime CLI | Formattazione dei comandi, attese, helper di versione |
  | `plugin-sdk/gateway-runtime` | Helper Gateway | Client Gateway, helper di avvio pronto per event loop e helper per patch dello stato canale |
  | `plugin-sdk/config-runtime` | Shim deprecato di compatibilità della configurazione | Preferisci `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` e `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Helper per comandi Telegram | Helper di validazione dei comandi Telegram stabili rispetto al fallback quando la superficie del contratto Telegram bundled non è disponibile |
  | `plugin-sdk/approval-runtime` | Helper per prompt di approvazione | Payload di approvazione exec/Plugin, helper per capability/profilo di approvazione, helper di routing/runtime per approvazione nativa e formattazione strutturata del percorso di visualizzazione dell'approvazione |
  | `plugin-sdk/approval-auth-runtime` | Helper auth per approvazione | Risoluzione dell'approvatore, auth azione nella stessa chat |
  | `plugin-sdk/approval-client-runtime` | Helper client di approvazione | Helper nativi per profilo/filtro di approvazione exec |
  | `plugin-sdk/approval-delivery-runtime` | Helper per consegna approvazione | Adattatori di capability/consegna dell'approvazione nativa |
  | `plugin-sdk/approval-gateway-runtime` | Helper Gateway di approvazione | Helper condiviso di risoluzione del Gateway di approvazione |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper per adattatori di approvazione | Helper leggeri per il caricamento di adattatori di approvazione nativi per entrypoint di canale hot |
  | `plugin-sdk/approval-handler-runtime` | Helper per handler di approvazione | Helper runtime più ampi per handler di approvazione; preferisci le seam adapter/Gateway più mirate quando bastano |
  | `plugin-sdk/approval-native-runtime` | Helper per target di approvazione | Helper per binding nativi target/account di approvazione |
  | `plugin-sdk/approval-reply-runtime` | Helper per risposta di approvazione | Helper per payload di risposta di approvazione exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Helper per contesto runtime del canale | Helper generici register/get/watch del contesto runtime del canale |
  | `plugin-sdk/security-runtime` | Helper di sicurezza | Helper condivisi per fiducia, gating DM, file/percorsi limitati alla root, contenuto esterno e raccolta di segreti |
  | `plugin-sdk/ssrf-policy` | Helper per policy SSRF | Helper per allowlist degli host e policy di rete privata |
  | `plugin-sdk/ssrf-runtime` | Helper runtime SSRF | Dispatcher fissato, fetch protetto, helper per policy SSRF |
  | `plugin-sdk/system-event-runtime` | Helper per eventi di sistema | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Helper Heartbeat | Helper per wake, evento e visibilità Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Helper per coda di consegna | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Helper per attività del canale | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Helper per deduplicazione | Cache di deduplicazione in memoria |
  | `plugin-sdk/file-access-runtime` | Helper per accesso ai file | Helper sicuri per percorsi di file/media locali |
  | `plugin-sdk/transport-ready-runtime` | Helper per prontezza del trasporto | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Helper per policy di approvazione exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Helper per cache limitata | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper per gating diagnostico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper per formattazione degli errori | `formatUncaughtError`, `isApprovalNotFoundError`, helper per grafo degli errori |
  | `plugin-sdk/fetch-runtime` | Helper fetch/proxy wrappati | `resolveFetch`, helper proxy, helper per opzioni EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Helper per normalizzazione host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper per retry | `RetryConfig`, `retryAsync`, runner di policy |
  | `plugin-sdk/allow-from` | Formattazione allowlist e mappatura dell'input | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Helper per gating dei comandi e superficie dei comandi | `resolveControlCommandGate`, helper di autorizzazione del mittente, helper del registro comandi inclusa la formattazione dinamica del menu degli argomenti |
  | `plugin-sdk/command-status` | Renderer di stato/help dei comandi | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing dell'input dei segreti | Helper per input dei segreti |
  | `plugin-sdk/webhook-ingress` | Helper per richieste Webhook | Utility per target Webhook |
  | `plugin-sdk/webhook-request-guards` | Helper guard per corpo Webhook | Helper di lettura/limite del corpo della richiesta |
  | `plugin-sdk/reply-runtime` | Runtime condiviso di risposta | Dispatch in entrata, Heartbeat, pianificatore di risposte, suddivisione in chunk |
  | `plugin-sdk/reply-dispatch-runtime` | Helper mirati per dispatch delle risposte | Finalizzazione, dispatch del provider e helper per etichetta conversazione |
  | `plugin-sdk/reply-history` | Helper per cronologia delle risposte | `createChannelHistoryWindow`; esportazioni di compatibilità deprecate degli helper map come `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Pianificazione del riferimento di risposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper per chunk di risposta | Helper per suddivisione in chunk di testo/Markdown |
  | `plugin-sdk/session-store-runtime` | Helper per session store | Helper per percorso store + updated-at |
  | `plugin-sdk/state-paths` | Helper per percorsi di stato | Helper per directory stato e OAuth |
  | `plugin-sdk/routing` | Helper di routing/chiave di sessione | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper di normalizzazione delle chiavi di sessione |
  | `plugin-sdk/status-helpers` | Helper di stato dei canali | Builder di riepiloghi di stato canale/account, valori predefiniti dello stato runtime, helper per i metadati dei problemi |
  | `plugin-sdk/target-resolver-runtime` | Helper del resolver di destinazione | Helper condivisi del resolver di destinazione |
  | `plugin-sdk/string-normalization-runtime` | Helper di normalizzazione delle stringhe | Helper di normalizzazione di slug/stringhe |
  | `plugin-sdk/request-url` | Helper degli URL di richiesta | Estrae URL stringa da input simili a richieste |
  | `plugin-sdk/run-command` | Helper per comandi temporizzati | Esecutore di comandi temporizzati con stdout/stderr normalizzati |
  | `plugin-sdk/param-readers` | Lettori di parametri | Lettori comuni di parametri per strumenti/CLI |
  | `plugin-sdk/tool-payload` | Estrazione del payload degli strumenti | Estrae payload normalizzati dagli oggetti risultato degli strumenti |
  | `plugin-sdk/tool-send` | Estrazione dell'invio degli strumenti | Estrae i campi canonici della destinazione di invio dagli argomenti degli strumenti |
  | `plugin-sdk/temp-path` | Helper dei percorsi temporanei | Helper condivisi per i percorsi di download temporanei |
  | `plugin-sdk/logging-core` | Helper di logging | Logger di sottosistema e helper di redazione |
  | `plugin-sdk/markdown-table-runtime` | Helper per tabelle Markdown | Helper per le modalità delle tabelle Markdown |
  | `plugin-sdk/reply-payload` | Tipi di risposta ai messaggi | Tipi di payload di risposta |
  | `plugin-sdk/provider-setup` | Helper curati per la configurazione di provider locali/self-hosted | Helper di rilevamento/configurazione dei provider self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Helper mirati per la configurazione di provider self-hosted compatibili con OpenAI | Stessi helper di rilevamento/configurazione dei provider self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Helper di autenticazione runtime dei provider | Helper di risoluzione runtime delle chiavi API |
  | `plugin-sdk/provider-auth-api-key` | Helper di configurazione delle chiavi API dei provider | Helper di onboarding/scrittura profilo per chiavi API |
  | `plugin-sdk/provider-auth-result` | Helper dei risultati di autenticazione dei provider | Builder standard di risultati di autenticazione OAuth |
  | `plugin-sdk/provider-selection-runtime` | Helper di selezione dei provider | Selezione del provider configurato o automatica e unione della configurazione grezza del provider |
  | `plugin-sdk/provider-env-vars` | Helper delle variabili di ambiente dei provider | Helper di ricerca delle variabili di ambiente di autenticazione dei provider |
  | `plugin-sdk/provider-model-shared` | Helper condivisi per modelli/replay dei provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi di policy di replay, helper per endpoint dei provider e helper di normalizzazione degli ID modello |
  | `plugin-sdk/provider-catalog-shared` | Helper condivisi del catalogo dei provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch di onboarding dei provider | Helper di configurazione dell'onboarding |
  | `plugin-sdk/provider-http` | Helper HTTP dei provider | Helper generici per funzionalità HTTP/endpoint dei provider, inclusi helper per moduli multipart di trascrizione audio |
  | `plugin-sdk/provider-web-fetch` | Helper web-fetch dei provider | Helper di registrazione/cache dei provider web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helper di configurazione web-search dei provider | Helper ristretti per configurazione/credenziali web-search per provider che non richiedono cablaggio di abilitazione Plugin |
  | `plugin-sdk/provider-web-search-contract` | Helper del contratto web-search dei provider | Helper ristretti per il contratto di configurazione/credenziali web-search, come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con ambito |
  | `plugin-sdk/provider-web-search` | Helper web-search dei provider | Helper di registrazione/cache/runtime dei provider web-search |
  | `plugin-sdk/provider-tools` | Helper di compatibilità strumenti/schema dei provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` e pulizia schema + diagnostica per DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Helper di utilizzo dei provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e altri helper di utilizzo dei provider |
  | `plugin-sdk/provider-stream` | Helper wrapper di stream dei provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di wrapper di stream e helper wrapper condivisi per Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helper di trasporto dei provider | Helper di trasporto nativo dei provider come fetch protetto, trasformazioni dei messaggi di trasporto e stream di eventi di trasporto scrivibili |
  | `plugin-sdk/keyed-async-queue` | Coda asincrona ordinata | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helper multimediali condivisi | Helper per recupero/trasformazione/archiviazione dei media, rilevamento delle dimensioni video basato su ffprobe e builder di payload multimediali |
  | `plugin-sdk/media-generation-runtime` | Helper condivisi di generazione media | Helper condivisi di failover, selezione dei candidati e messaggistica per modelli mancanti per la generazione di immagini/video/musica |
  | `plugin-sdk/media-understanding` | Helper di comprensione dei media | Tipi di provider per la comprensione dei media più esportazioni di helper immagine/audio rivolte ai provider |
  | `plugin-sdk/text-runtime` | Esportazione deprecata di ampia compatibilità testuale | Usa `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` e `logging-core` |
  | `plugin-sdk/text-chunking` | Helper di suddivisione del testo | Helper di suddivisione del testo in uscita |
  | `plugin-sdk/speech` | Helper vocali | Tipi di provider vocali più helper di direttive, registro e validazione rivolti ai provider, e builder TTS compatibile con OpenAI |
  | `plugin-sdk/speech-core` | Core vocale condiviso | Tipi di provider vocali, registro, direttive, normalizzazione |
  | `plugin-sdk/realtime-transcription` | Helper di trascrizione in tempo reale | Tipi di provider, helper di registro e helper condiviso di sessione WebSocket |
  | `plugin-sdk/realtime-voice` | Helper vocali in tempo reale | Tipi di provider, helper di registro/risoluzione, helper di sessione bridge, code condivise di risposta vocale dell'agente, controllo vocale della run attiva, salute trascrizione/eventi, soppressione dell'eco, corrispondenza delle domande di consultazione, coordinamento della consultazione forzata, tracciamento del contesto del turno, tracciamento dell'attività di output e helper rapidi di consultazione del contesto |
  | `plugin-sdk/image-generation` | Helper di generazione immagini | Tipi di provider di generazione immagini più helper per asset immagine/data URL e builder di provider immagini compatibile con OpenAI |
  | `plugin-sdk/image-generation-core` | Core condiviso di generazione immagini | Tipi di generazione immagini, failover, autenticazione e helper di registro |
  | `plugin-sdk/music-generation` | Helper di generazione musicale | Tipi di provider/richiesta/risultato per generazione musicale |
  | `plugin-sdk/music-generation-core` | Core condiviso di generazione musicale | Tipi di generazione musicale, helper di failover, lookup dei provider e parsing dei riferimenti modello |
  | `plugin-sdk/video-generation` | Helper di generazione video | Tipi di provider/richiesta/risultato per generazione video |
  | `plugin-sdk/video-generation-core` | Core condiviso di generazione video | Tipi di generazione video, helper di failover, lookup dei provider e parsing dei riferimenti modello |
  | `plugin-sdk/interactive-runtime` | Helper di risposta interattiva | Normalizzazione/riduzione dei payload di risposta interattiva |
  | `plugin-sdk/channel-config-primitives` | Primitive di configurazione canale | Primitive ristrette dello schema di configurazione canale |
  | `plugin-sdk/channel-config-writes` | Helper di scrittura configurazione canale | Helper di autorizzazione alla scrittura della configurazione canale |
  | `plugin-sdk/channel-plugin-common` | Prelude condiviso dei canali | Esportazioni condivise del prelude dei Plugin canale |
  | `plugin-sdk/channel-status` | Helper di stato dei canali | Helper condivisi di snapshot/riepilogo dello stato canale |
  | `plugin-sdk/allowlist-config-edit` | Helper di configurazione allowlist | Helper di modifica/lettura della configurazione allowlist |
  | `plugin-sdk/group-access` | Helper di accesso ai gruppi | Helper condivisi di decisione sull'accesso ai gruppi |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Facade di compatibilità deprecate | Usa `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Helper di guardia Direct-DM | Helper ristretti di policy di guardia pre-crypto |
  | `plugin-sdk/extension-shared` | Helper condivisi delle estensioni | Primitive di helper per canali passivi/stato e proxy ambientale |
  | `plugin-sdk/webhook-targets` | Helper delle destinazioni Webhook | Registro delle destinazioni Webhook e helper di installazione delle route |
  | `plugin-sdk/webhook-path` | Alias deprecato del percorso Webhook | Usa `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Helper condivisi per media web | Helper di caricamento media remoti/locali |
  | `plugin-sdk/zod` | Riesportazione di compatibilità Zod deprecata | Importa `zod` da `zod` direttamente |
  | `plugin-sdk/memory-core` | Helper memory-core in bundle | Superficie di helper per gestore/configurazione/file/CLI della memoria |
  | `plugin-sdk/memory-core-engine-runtime` | Facade runtime del motore di memoria | Facade runtime di indicizzazione/ricerca della memoria |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registro degli embedding di memoria | Helper leggeri del registro dei provider di embedding di memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motore foundation dell'host di memoria | Esportazioni del motore foundation dell'host di memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motore embedding dell'host di memoria | Contratti di embedding di memoria, accesso al registro, provider locale e helper generici batch/remoti; i provider remoti concreti vivono nei rispettivi Plugin proprietari |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motore QMD dell'host di memoria | Esportazioni del motore QMD dell'host di memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motore di archiviazione dell'host di memoria | Esportazioni del motore di archiviazione dell'host di memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali dell'host di memoria | Helper multimodali dell'host di memoria |
  | `plugin-sdk/memory-core-host-query` | Helper di query dell'host di memoria | Helper di query dell'host di memoria |
  | `plugin-sdk/memory-core-host-secret` | Helper dei segreti dell'host di memoria | Helper dei segreti dell'host di memoria |
  | `plugin-sdk/memory-core-host-events` | Alias deprecato degli eventi di memoria | Usa `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Helper di stato dell'host di memoria | Helper di stato dell'host di memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI dell'host di memoria | Helper runtime CLI dell'host di memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime core dell'host di memoria | Helper runtime core dell'host di memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime dell'host di memoria | Helper file/runtime dell'host di memoria |
  | `plugin-sdk/memory-host-core` | Alias del runtime core dell'host di memoria | Alias indipendente dal vendor per gli helper runtime core dell'host di memoria |
  | `plugin-sdk/memory-host-events` | Alias del journal eventi dell'host di memoria | Alias indipendente dal vendor per gli helper del journal eventi dell'host di memoria |
  | `plugin-sdk/memory-host-files` | Alias deprecato di file/runtime di memoria | Usa `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Helper markdown gestiti | Helper condivisi per markdown gestito per Plugin adiacenti alla memoria |
  | `plugin-sdk/memory-host-search` | Facade di ricerca Active Memory | Facade runtime lazy del gestore di ricerca Active Memory |
  | `plugin-sdk/memory-host-status` | Alias deprecato dello stato dell'host di memoria | Usa `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Utilità di test | Barrel di compatibilità deprecato locale al repo; usa sottopercorsi di test mirati locali al repo come `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` e `plugin-sdk/test-fixtures` |
</Accordion>

Questa tabella è intenzionalmente il sottoinsieme comune di migrazione, non l’intera
superficie dell’SDK. L’inventario degli entrypoint del compilatore vive in
`scripts/lib/plugin-sdk-entrypoints.json`; le esportazioni dei pacchetti sono generate dal
sottoinsieme pubblico.

Le seam helper riservate dei Plugin in bundle sono state rimosse dalla mappa di
esportazione dell’SDK pubblico, salvo facciate di compatibilità documentate esplicitamente, come lo
shim deprecato `plugin-sdk/discord` mantenuto per il pacchetto pubblicato
`@openclaw/discord@2026.3.13`. Gli helper specifici del proprietario vivono dentro il
pacchetto Plugin proprietario; il comportamento condiviso dell’host dovrebbe passare attraverso contratti SDK
generici come `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` e
`plugin-sdk/plugin-config-runtime`.

Usa l’import più ristretto che corrisponde al compito. Se non riesci a trovare un’esportazione,
controlla il sorgente in `src/plugin-sdk/` o chiedi ai maintainer quale contratto generico
dovrebbe possederla.

## Deprecazioni attive

Deprecazioni più ristrette applicabili a tutto l’SDK dei Plugin, al contratto provider,
alla superficie runtime e al manifesto. Ognuna funziona ancora oggi, ma sarà rimossa
in una futura major release. La voce sotto ogni elemento mappa la vecchia API alla sua
sostituzione canonica.

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
    **Precedente (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nuovo (`openclaw/plugin-sdk/command-status`)**: stesse firme, stesse
    esportazioni: solo importate dal sottopercorso più ristretto. `command-auth`
    le riesporta come stub di compatibilità.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention gating helpers → resolveInboundMentionDecision">
    **Precedente**: `resolveInboundMentionRequirement({ facts, policy })` e
    `shouldDropInboundForMention(...)` da
    `openclaw/plugin-sdk/channel-inbound` o
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nuovo**: `resolveInboundMentionDecision({ facts, policy })`: restituisce un
    singolo oggetto decisionale invece di due chiamate separate.

    I Plugin di canale downstream (Slack, Discord, Matrix, MS Teams) hanno già
    effettuato il passaggio.

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` è uno shim di compatibilità per i Plugin di canale
    meno recenti. Non importarlo dal nuovo codice; usa
    `openclaw/plugin-sdk/channel-runtime-context` per registrare gli oggetti
    runtime.

    Gli helper `channelActions*` in `openclaw/plugin-sdk/channel-actions` sono
    deprecati insieme alle esportazioni di canale raw "actions". Esponi le capability
    tramite la superficie semantica `presentation`: i Plugin di canale
    dichiarano cosa renderizzano (schede, pulsanti, selezioni) invece dei nomi di azione raw
    che accettano.

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **Precedente**: factory `tool()` da `openclaw/plugin-sdk/provider-web-search`.

    **Nuovo**: implementa `createTool(...)` direttamente sul Plugin provider.
    OpenClaw non ha più bisogno dell’helper SDK per registrare il wrapper del tool.

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **Precedente**: `formatInboundEnvelope(...)` (e
    `ChannelMessageForAgent.channelEnvelope`) per creare un envelope di prompt in testo semplice
    piatto dai messaggi di canale in ingresso.

    **Nuovo**: `BodyForAgent` più blocchi strutturati di contesto utente. I Plugin di canale
    allegano i metadati di routing (thread, argomento, risposta-a, reazioni) come
    campi tipizzati invece di concatenarli in una stringa di prompt. L’helper
    `formatAgentEnvelope(...)` è ancora supportato per envelope sintetizzati
    rivolti all’assistente, ma gli envelope in ingresso in testo semplice sono in
    fase di dismissione.

    Aree interessate: `inbound_claim`, `message_received` e qualsiasi Plugin
    di canale personalizzato che post-elaborava il testo `channelEnvelope`.

  </Accordion>

  <Accordion title="deactivate hook → gateway_stop">
    **Precedente**: `api.on("deactivate", handler)`.

    **Nuovo**: `api.on("gateway_stop", handler)`. L’evento e il contesto sono lo
    stesso contratto di pulizia allo spegnimento; cambia solo il nome dell’hook.

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

  <Accordion title="subagent_spawning hook → core thread binding">
    **Precedente**: `api.on("subagent_spawning", handler)` che restituisce
    `threadBindingReady` o `deliveryOrigin`.

    **Nuovo**: lascia che il core prepari i binding dei subagent `thread: true` tramite
    l’adapter di session-binding del canale. Usa `api.on("subagent_spawned", handler)`
    solo per l’osservazione post-avvio.

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
    superfici di compatibilità deprecate mentre i Plugin esterni migrano.

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    Quattro alias di tipo discovery sono ora wrapper sottili sopra i
    tipi dell’era del catalogo:

    | Alias precedente          | Nuovo tipo                |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    In più, la vecchia raccolta statica `ProviderCapabilities`: i Plugin provider
    dovrebbero usare hook provider espliciti come `buildReplayPolicy`,
    `normalizeToolSchemas` e `wrapStreamFn` invece di un oggetto statico.

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **Precedente** (tre hook separati su `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` e
    `resolveDefaultThinkingLevel(ctx)`.

    **Nuovo**: un singolo `resolveThinkingProfile(ctx)` che restituisce un
    `ProviderThinkingProfile` con l’`id` canonico, `label` opzionale e
    l’elenco ordinato dei livelli. OpenClaw esegue automaticamente il downgrade dei valori
    memorizzati obsoleti in base al rango del profilo.

    Il contesto include `provider`, `modelId`, `reasoning` unito opzionale
    e fatti `compat` del modello uniti opzionali. I Plugin provider possono usare quei
    fatti di catalogo per esporre un profilo specifico del modello solo quando il contratto
    della richiesta configurata lo supporta.

    Implementa un hook invece di tre. Gli hook legacy continuano a funzionare durante
    la finestra di deprecazione, ma non vengono composti con il risultato del profilo.

  </Accordion>

  <Accordion title="External auth providers → contracts.externalAuthProviders">
    **Precedente**: implementare hook di autenticazione esterna senza dichiarare il provider
    nel manifesto del Plugin.

    **Nuovo**: dichiara `contracts.externalAuthProviders` nel manifesto del Plugin
    **e** implementa `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    **Campo manifesto precedente**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nuovo**: rispecchia la stessa ricerca delle env-var in `setup.providers[].envVars`
    sul manifesto. Questo consolida i metadati env di setup/stato in un unico
    punto ed evita di avviare il runtime del Plugin solo per rispondere alle
    ricerche di env-var.

    `providerAuthEnvVars` rimane supportato tramite un adapter di compatibilità
    finché la finestra di deprecazione non si chiude.

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **Precedente**: tre chiamate separate:
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nuovo**: una chiamata sull’API memory-state:
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Stessi slot, singola chiamata di registrazione. Gli helper additivi di prompt e corpus
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) non sono
    interessati.

  </Accordion>

  <Accordion title="Memory embedding provider API">
    **Precedente**: `api.registerMemoryEmbeddingProvider(...)` più
    `contracts.memoryEmbeddingProviders`.

    **Nuovo**: `api.registerEmbeddingProvider(...)` più
    `contracts.embeddingProviders`.

    Il contratto provider embedding generico è riutilizzabile fuori dalla memoria ed è
    il percorso supportato per i nuovi provider. L’API di registrazione specifica della memoria
    rimane collegata come compatibilità deprecata mentre i provider esistenti migrano.
    I report di ispezione dei Plugin segnalano l’uso non in bundle come debito di compatibilità.

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    Due alias di tipo legacy ancora esportati da `src/plugins/runtime/types.ts`:

    | Precedente                   | Nuovo                           |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Il metodo runtime `readSession` è deprecato a favore di
    `getSessionMessages`. Stessa firma; il vecchio metodo inoltra la chiamata a quello
    nuovo.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Precedente**: `runtime.tasks.flow` (singolare) restituiva un accessor live per task-flow.

    **Nuovo**: `runtime.tasks.managedFlows` conserva il runtime di mutazione TaskFlow
    gestito per i Plugin che creano, aggiornano, annullano o eseguono task figli da un
    flow. Usa `runtime.tasks.flows` quando il Plugin ha bisogno solo di letture basate su DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    Trattato in "Come migrare → Migrare le estensioni tool-result incorporate al
    middleware" sopra. Incluso qui per completezza: il percorso rimosso solo per embedded-runner
    `api.registerEmbeddedExtensionFactory(...)` è sostituito da
    `api.registerAgentToolResultMiddleware(...)` con un elenco runtime esplicito
    in `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
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
Le deprecazioni a livello di estensione (dentro i Plugin di canale/provider in bundle sotto
`extensions/`) sono tracciate dentro i rispettivi barrel `api.ts` e `runtime-api.ts`.
Non incidono sui contratti dei Plugin di terze parti e non sono elencate
qui. Se consumi direttamente il barrel locale di un Plugin in bundle, leggi i
commenti di deprecazione in quel barrel prima di aggiornare.
</Note>

## Cronologia delle rimozioni

| Quando                 | Cosa accade                                                             |
| ---------------------- | ----------------------------------------------------------------------- |
| **Ora**                | Le superfici deprecate emettono avvisi di runtime                       |
| **Prossima release major** | Le superfici deprecate saranno rimosse; i plugin che le usano ancora falliranno |

Tutti i plugin core sono già stati migrati. I plugin esterni devono migrare
prima della prossima release major.

## Sopprimere temporaneamente gli avvisi

Imposta queste variabili d'ambiente mentre lavori alla migrazione:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Questa è una via d'uscita temporanea, non una soluzione permanente.

## Correlati

- [Per iniziare](/it/plugins/building-plugins) - crea il tuo primo plugin
- [Panoramica dell'SDK](/it/plugins/sdk-overview) - riferimento completo agli import dei sottopercorsi
- [Plugin di canale](/it/plugins/sdk-channel-plugins) - creare plugin di canale
- [Plugin provider](/it/plugins/sdk-provider-plugins) - creare plugin provider
- [Interni dei Plugin](/it/plugins/architecture) - approfondimento sull'architettura
- [Manifest del Plugin](/it/plugins/manifest) - riferimento allo schema del manifest
