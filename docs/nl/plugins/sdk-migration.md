---
read_when:
    - Je ziet de waarschuwing OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Je ziet de waarschuwing OPENCLAW_EXTENSION_API_DEPRECATED
    - Je gebruikte api.registerEmbeddedExtensionFactory vóór OpenClaw 2026.4.25
    - Je werkt een Plugin bij naar de moderne Plugin-architectuur
    - Je onderhoudt een externe OpenClaw Plugin
sidebarTitle: Migrate to SDK
summary: Migreer van de verouderde laag voor achterwaartse compatibiliteit naar de moderne Plugin SDK
title: Plugin-SDK-migratie
x-i18n:
    generated_at: "2026-07-01T08:17:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f05bd42cc0a6fc53f6670377b4330bb452b2a06f4d0542a494875970ee81e08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw is overgestapt van een brede laag voor achterwaartse compatibiliteit naar een moderne Plugin-
architectuur met gerichte, gedocumenteerde imports. Als je Plugin is gebouwd vóór
de nieuwe architectuur, helpt deze gids je migreren.

## Wat er verandert

Het oude Plugin-systeem bood twee wijd open oppervlakken waarmee Plugins alles
konden importeren wat ze nodig hadden vanaf één enkel entrypoint:

- **`openclaw/plugin-sdk/compat`** - één import die tientallen helpers opnieuw
  exporteerde. Deze werd geïntroduceerd om oudere hook-gebaseerde Plugins werkend
  te houden terwijl de nieuwe Plugin-architectuur werd gebouwd.
- **`openclaw/plugin-sdk/infra-runtime`** - een breed runtime-helperbarrel dat
  systeemgebeurtenissen, Heartbeat-status, afleverwachtrijen, fetch-/proxyhelpers,
  bestandshelpers, goedkeuringstypen en niet-gerelateerde utilities combineerde.
- **`openclaw/plugin-sdk/config-runtime`** - een breed config-compatibiliteitsbarrel
  dat tijdens het migratievenster nog verouderde directe laad-/schrijfhelpers bevat.
- **`openclaw/extension-api`** - een bridge die Plugins directe toegang gaf tot
  host-side helpers zoals de ingebedde agent-runner.
- **`api.registerEmbeddedExtensionFactory(...)`** - een verwijderde, alleen voor de ingebedde runner bedoelde gebundelde
  extension-hook die ingebedde-runnergebeurtenissen zoals
  `tool_result` kon observeren.

De brede importoppervlakken zijn nu **verouderd**. Ze werken nog steeds tijdens runtime,
maar nieuwe Plugins mogen ze niet gebruiken, en bestaande Plugins moeten migreren voordat
de volgende major release ze verwijdert. De registratie-API voor extension factories
die alleen voor de ingebedde runner bedoeld was, is verwijderd; gebruik in plaats daarvan
tool-result-middleware.

OpenClaw verwijdert of herinterpreteert gedocumenteerd Plugin-gedrag niet in dezelfde
wijziging die een vervanging introduceert. Brekende contractwijzigingen moeten eerst via
een compatibiliteitsadapter, diagnostiek, docs en een deprecatietermijn lopen.
Dat geldt voor SDK-imports, manifestvelden, setup-API's, hooks en runtime-
registratiegedrag.

<Warning>
  De laag voor achterwaartse compatibiliteit wordt in een toekomstige major release verwijderd.
  Plugins die nog steeds vanaf deze oppervlakken importeren, zullen dan breken.
  Legacy-registraties van ingebedde extension factories laden nu al niet meer.
</Warning>

## Waarom dit is veranderd

De oude aanpak veroorzaakte problemen:

- **Trage startup** - het importeren van één helper laadde tientallen niet-gerelateerde modules
- **Circulaire afhankelijkheden** - brede re-exports maakten het makkelijk om importcycli te maken
- **Onduidelijk API-oppervlak** - er was geen manier om te zien welke exports stabiel waren en welke intern

De moderne Plugin-SDK lost dit op: elk importpad (`openclaw/plugin-sdk/\<subpath\>`)
is een kleine, zelfstandige module met een duidelijk doel en een gedocumenteerd contract.

Legacy provider-gemaksseams voor gebundelde kanalen zijn ook verdwenen.
Kanaalgebrande helper-seams waren private mono-repo shortcuts, geen stabiele
Plugin-contracten. Gebruik in plaats daarvan smalle generieke SDK-subpaden. Houd binnen de gebundelde
Plugin-workspace provider-eigen helpers in de eigen `api.ts` of
`runtime-api.ts` van die Plugin.

Huidige voorbeelden van gebundelde providers:

- Anthropic houdt Claude-specifieke streamhelpers in zijn eigen `api.ts` /
  `contract-api.ts` seam
- OpenAI houdt provider-builders, default-modelhelpers en realtime provider-
  builders in zijn eigen `api.ts`
- OpenRouter houdt provider-builder- en onboarding-/confighelpers in zijn eigen
  `api.ts`

## Migratieplan voor Talk en realtime spraak

Realtime spraak-, telefonie-, vergader- en browser-Talk-code verhuist van
oppervlakspecifieke beurtboekhouding naar een gedeelde Talk-sessiecontroller die wordt geëxporteerd door
`openclaw/plugin-sdk/realtime-voice`. De nieuwe controller beheert de gemeenschappelijke Talk-
gebeurtenisenvelop, actieve beurtstatus, capture-status, output-audio-status, recente
gebeurtenisgeschiedenis en afwijzing van verouderde beurten. Provider-Plugins moeten
leveranciersspecifieke realtime sessies blijven beheren; oppervlak-Plugins moeten capture,
afspelen, telefonie en vergaderspecifieke bijzonderheden blijven beheren.

Deze Talk-migratie is bewust schoon brekend:

1. Houd de gedeelde controller-/runtime-primitives in
   `plugin-sdk/realtime-voice`.
2. Verplaats gebundelde oppervlakken naar de gedeelde controller: browserrelay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime en native push-to-talk.
3. Vervang oude Talk-RPC-families door de definitieve `talk.session.*`- en
   `talk.client.*`-API.
4. Adverteer één live Talk-gebeurteniskanaal in Gateway
   `hello-ok.features.events`: `talk.event`.
5. Verwijder het oude realtime HTTP-eindpunt en elk request-time pad voor
   instructie-override.

Nieuwe code mag `createTalkEventSequencer(...)` niet rechtstreeks aanroepen, tenzij deze
een low-level adapter of testfixture implementeert. Gebruik bij voorkeur de gedeelde controller,
zodat beurtgebonden gebeurtenissen niet kunnen worden uitgezonden zonder een beurt-id, verouderde
`turnEnd`- / `turnCancel`-aanroepen geen nieuwere actieve beurt kunnen wissen, en lifecycle-
gebeurtenissen voor output-audio consistent blijven in telefonie, vergaderingen, browserrelay,
managed-room handoff en native Talk-clients.

De beoogde publieke API-vorm is:

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

Browser-eigen WebRTC/provider-websocket-sessies gebruiken `talk.client.create`,
omdat de browser de provider-onderhandeling en het mediatransport beheert terwijl de
Gateway credentials, instructies en toolbeleid beheert. `talk.session.*` is het
gemeenschappelijke door de Gateway beheerde oppervlak voor gateway-relay realtime, gateway-relay-
transcriptie en managed-room native STT/TTS-sessies.

Legacy-configs die realtime selectors naast `talk.provider` /
`talk.providers` plaatsten, moeten worden gerepareerd met `openclaw doctor --fix`; runtime Talk
herinterpreteert speech-/TTS-providerconfig niet als realtime providerconfig.

De ondersteunde `talk.session.create`-combinaties zijn bewust klein:

| Modus           | Transport       | Brain           | Eigenaar           | Notities                                                                                                           |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Full-duplex provider-audio overbrugd via de Gateway; toolaanroepen worden gerouteerd via de agent-consult-tool.    |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Alleen streaming-STT; aanroepers sturen invoeraudio en ontvangen transcriptiegebeurtenissen.                       |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/clientruimte | Push-to-talk- en walkie-talkie-achtige ruimtes waarin de client capture/afspelen beheert en de Gateway beurtstatus beheert. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/clientruimte | Ruimtemodus alleen voor beheerders voor vertrouwde first-party oppervlakken die Gateway-toolacties rechtstreeks uitvoeren. |

Kaart van verwijderde methoden:

| Oud                              | Nieuw                                                    |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` of `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

De uniforme control-woordenschat is ook bewust smal:

  | Methode                         | Van toepassing op                                      | Contract                                                                                                                                                                                                        |
  | ------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Voeg een base64 PCM-audiofragment toe aan de providersessie die eigendom is van dezelfde Gateway-verbinding.                                                                                                    |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                 | Start een gebruikersbeurt in een beheerde ruimte.                                                                                                                                                               |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                 | Beëindig de actieve beurt na validatie van een verouderde beurt.                                                                                                                                                |
  | `talk.session.cancelTurn`       | alle sessies die eigendom zijn van Gateway             | Annuleer actieve opname-/provider-/agent-/TTS-werkzaamheden voor een beurt.                                                                                                                                     |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                               | Stop audio-uitvoer van de assistent zonder noodzakelijkerwijs de gebruikersbeurt te beëindigen.                                                                                                                 |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                               | Voltooi een providertoolaanroep die door de relay is uitgezonden; geef `options.willContinue` door voor tussentijdse uitvoer of `options.suppressResponse` om de aanroep af te handelen zonder nog een assistentantwoord. |
  | `talk.session.steer`            | agent-ondersteunde Talk-sessies                        | Stuur gesproken `status`-, `steer`-, `cancel`- of `followup`-besturing naar de actieve ingesloten uitvoering die vanuit de Talk-sessie is opgelost.                                                              |
  | `talk.session.close`            | alle uniforme sessies                                  | Stop relaysessies of trek de status van de beheerde ruimte in, en vergeet daarna de uniforme sessie-id.                                                                                                         |

  Introduceer geen provider- of platformspecifieke uitzonderingen in core om dit te laten werken.
  Core is eigenaar van de semantiek van Talk-sessies. Providerplugins zijn eigenaar van het instellen van leverancierssessies.
  Voice-call en Google Meet zijn eigenaar van telefonie-/vergaderadapters. Browser- en native
  apps zijn eigenaar van de UX voor apparaatopname en -weergave.

  ## Compatibiliteitsbeleid

  Voor externe plugins volgt compatibiliteitswerk deze volgorde:

  1. voeg het nieuwe contract toe
  2. houd het oude gedrag aangesloten via een compatibiliteitsadapter
  3. geef een diagnose of waarschuwing uit die het oude pad en de vervanging noemt
  4. dek beide paden af in tests
  5. documenteer de afschaffing en het migratiepad
  6. verwijder pas na het aangekondigde migratievenster, meestal in een major release

  Maintainers kunnen de huidige migratiewachtrij controleren met
  `pnpm plugins:boundary-report`. Gebruik `pnpm plugins:boundary-report:summary` voor
  compacte aantallen, `--owner <id>` voor één plugin of compatibiliteitseigenaar, en
  `pnpm plugins:boundary-report:ci` wanneer een CI-gate moet falen op vervallen
  compatibiliteitsrecords, gereserveerde SDK-imports over eigenaren heen, of ongebruikte gereserveerde SDK-
  subpaden. Het rapport groepeert verouderde
  compatibiliteitsrecords op verwijderdatum, telt lokale code-/docs-verwijzingen,
  toont gereserveerde SDK-imports over eigenaren heen, en vat de private
  memory-host SDK-bridge samen zodat compatibiliteitsopschoning expliciet blijft in plaats van
  te vertrouwen op ad-hoczoekopdrachten. Gereserveerde SDK-subpaden moeten bijgehouden eigenaarsgebruik hebben;
  ongebruikte gereserveerde helperexports moeten uit de openbare SDK worden verwijderd.

  Als een manifestveld nog steeds wordt geaccepteerd, kunnen pluginauteurs het blijven gebruiken totdat
  de docs en diagnoses iets anders zeggen. Nieuwe code moet de gedocumenteerde
  vervanging verkiezen, maar bestaande plugins mogen niet breken tijdens gewone minor
  releases.

  ## Migreren

  <Steps>
  <Step title="Migreer runtime-configuratiehelpers voor laden/schrijven">
    Gebundelde plugins moeten stoppen met het rechtstreeks aanroepen van
    `api.runtime.config.loadConfig()` en
    `api.runtime.config.writeConfigFile(...)`. Geef de voorkeur aan configuratie die
    al is doorgegeven aan het actieve aanroeppad. Langlevende handlers die de
    huidige processnapshot nodig hebben, kunnen `api.runtime.config.current()` gebruiken. Langlevende
    agenttools moeten de `ctx.getRuntimeConfig()` van de toolcontext gebruiken binnen
    `execute`, zodat een tool die vóór een configuratieschrijving is gemaakt nog steeds de vernieuwde
    runtimeconfiguratie ziet.

    Configuratieschrijfacties moeten via de transactionele helpers lopen en een
    beleid na schrijven kiezen:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Gebruik `afterWrite: { mode: "restart", reason: "..." }` wanneer de aanroeper weet
    dat de wijziging een schone gateway-herstart vereist, en
    `afterWrite: { mode: "none", reason: "..." }` alleen wanneer de aanroeper eigenaar is van de
    opvolging en de reload-planner bewust wil onderdrukken.
    Mutatieresultaten bevatten een getypte `followUp`-samenvatting voor tests en logging;
    de gateway blijft verantwoordelijk voor het toepassen of plannen van de herstart.
    `loadConfig` en `writeConfigFile` blijven verouderde compatibiliteitshelpers
    voor externe plugins tijdens het migratievenster en waarschuwen één keer met
    de compatibiliteitscode `runtime-config-load-write`. Gebundelde plugins en repo-
    runtimecode worden beschermd door scanner-guardrails in
    `pnpm check:deprecated-api-usage` en
    `pnpm check:no-runtime-action-load-config`: nieuw gebruik in productieplugins
    faalt direct, rechtstreekse configuratieschrijfacties falen, gatewayservermethoden moeten de
    request-runtimesnapshot gebruiken, runtimehelpers voor kanaalverzending/actie/client
    moeten configuratie ontvangen vanaf hun grens, en langlevende runtimemodules hebben
    nul toegestane omgevingsaanroepen naar `loadConfig()`.

    Nieuwe plugincode moet ook vermijden om de brede compatibiliteitsbarrel
    `openclaw/plugin-sdk/config-runtime` te importeren. Gebruik het smalle
    SDK-subpad dat bij de taak past:

    | Behoefte | Import |
    | --- | --- |
    | Configuratietypen zoals `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Al geladen configuratieasserties en configuratieopzoeking voor plugin-entry | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lezingen van de huidige runtimesnapshot | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Configuratieschrijfacties | `openclaw/plugin-sdk/config-mutation` |
    | Helpers voor sessiestore | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown-tabelconfiguratie | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Runtimehelpers voor groepsbeleid | `openclaw/plugin-sdk/runtime-group-policy` |
    | Oplossing van geheime invoer | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model-/sessie-overschrijvingen | `openclaw/plugin-sdk/model-session-runtime` |

    Gebundelde plugins en hun tests worden door scanners bewaakt tegen de brede
    barrel, zodat imports en mocks lokaal blijven voor het gedrag dat ze nodig hebben. De brede
    barrel bestaat nog steeds voor externe compatibiliteit, maar nieuwe code mag er niet
    van afhankelijk zijn.

  </Step>

  <Step title="Migreer ingesloten tool-result-extensies naar middleware">
    Gebundelde plugins moeten ingesloten-runner-only
    `api.registerEmbeddedExtensionFactory(...)` tool-result-handlers vervangen door
    runtime-neutrale middleware.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Werk tegelijkertijd het pluginmanifest bij:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Geïnstalleerde plugins kunnen ook tool-result-middleware registreren wanneer ze
    expliciet zijn ingeschakeld en elke beoogde runtime declareren in
    `contracts.agentToolResultMiddleware`. Niet-gedeclareerde geïnstalleerde middleware-
    registraties worden geweigerd.

  </Step>

  <Step title="Migreer approval-native handlers naar capability-facts">
    Kanaalplugins met approval-mogelijkheden tonen nu native approval-gedrag via
    `approvalCapability.nativeRuntime` plus het gedeelde runtime-contextregister.

    Belangrijke wijzigingen:

    - Vervang `approvalCapability.handler.loadRuntime(...)` door
      `approvalCapability.nativeRuntime`
    - Verplaats approval-specifieke auth/delivery weg van legacy `plugin.auth` /
      `plugin.approvals`-bedrading en naar `approvalCapability`
    - `ChannelPlugin.approvals` is verwijderd uit het openbare channel-plugin-
      contract; verplaats delivery/native/render-velden naar `approvalCapability`
    - `plugin.auth` blijft alleen voor inlog-/uitlogflows van kanalen; approval-auth-
      hooks daar worden niet langer door core gelezen
    - Registreer runtimeobjecten die eigendom zijn van kanalen, zoals clients, tokens of Bolt-
      apps via `openclaw/plugin-sdk/channel-runtime-context`
    - Stuur geen omleidingsmeldingen die eigendom zijn van plugins vanuit native approval-handlers;
      core is nu eigenaar van meldingen die elders gerouteerd zijn op basis van daadwerkelijke afleverresultaten
    - Wanneer `channelRuntime` wordt doorgegeven aan `createChannelManager(...)`, lever dan een
      echt `createPluginRuntime().channel`-oppervlak. Gedeeltelijke stubs worden geweigerd.

    Zie `/plugins/sdk-channel-plugins` voor de huidige indeling van approval-capabilities.

  </Step>

  <Step title="Controleer Windows-wrapper-fallbackgedrag">
    Als je plugin `openclaw/plugin-sdk/windows-spawn` gebruikt, falen onopgeloste Windows-
    `.cmd`/`.bat`-wrappers nu gesloten tenzij je expliciet
    `allowShellFallback: true` doorgeeft.

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

    Als je aanroeper niet bewust afhankelijk is van shell-fallback, stel
    `allowShellFallback` dan niet in en handel in plaats daarvan de gegooide fout af.

  </Step>

  <Step title="Zoek verouderde imports">
    Doorzoek je plugin op imports uit een van beide verouderde oppervlakken:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Vervang door gerichte imports">
    Elke export uit het oude oppervlak komt overeen met een specifiek modern importpad:

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

    Gebruik voor host-side helpers de geïnjecteerde pluginruntime in plaats van rechtstreeks te importeren:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Hetzelfde patroon geldt voor andere verouderde bridge-helpers:

    | Oude import | Moderne equivalent |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | sessiestore-helpers | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` bestaat nog steeds voor externe
    compatibiliteit, maar nieuwe code moet het gerichte helperoppervlak importeren dat
    daadwerkelijk nodig is:

    | Behoefte | Import |
    | --- | --- |
    | Helpers voor systeemgebeurteniswachtrijen | `openclaw/plugin-sdk/system-event-runtime` |
    | Helpers voor Heartbeat-wake, gebeurtenissen en zichtbaarheid | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Leegmaken van wachtrij voor openstaande aflevering | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetrie voor kanaalactiviteit | `openclaw/plugin-sdk/channel-activity-runtime` |
    | In-memory dedupe-caches | `openclaw/plugin-sdk/dedupe-runtime` |
    | Veilige helpers voor lokale bestands-/mediapaden | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher-bewuste fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Helpers voor proxy en afgeschermde fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Beleidstypen voor SSRF-dispatcher | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Typen voor goedkeuringsaanvraag/-oplossing | `openclaw/plugin-sdk/approval-runtime` |
    | Helpers voor payload en opdrachten van goedkeuringsantwoord | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helpers voor foutopmaak | `openclaw/plugin-sdk/error-runtime` |
    | Wachttijden voor transportgereedheid | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helpers voor veilige tokens | `openclaw/plugin-sdk/secure-random-runtime` |
    | Begrensde gelijktijdigheid voor asynchrone taken | `openclaw/plugin-sdk/concurrency-runtime` |
    | Numerieke coercion | `openclaw/plugin-sdk/number-runtime` |
    | Proceslokale asynchrone lock | `openclaw/plugin-sdk/async-lock-runtime` |
    | Bestandslocks | `openclaw/plugin-sdk/file-lock` |

    Gebundelde plugins worden met scannerregels beschermd tegen `infra-runtime`, zodat repo-code
    niet kan terugvallen op de brede barrel.

  </Step>

  <Step title="Migrate channel route helpers">
    Nieuwe kanaalroutecode moet `openclaw/plugin-sdk/channel-route` gebruiken.
    De oudere namen route-key en comparable-target blijven tijdens het migratievenster
    bestaan als compatibiliteitsaliassen, maar nieuwe plugins moeten de routenamen gebruiken
    die het gedrag direct beschrijven:

    | Oude helper | Moderne helper |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    De moderne routehelpers normaliseren `{ channel, to, accountId, threadId }`
    consistent over native goedkeuringen, onderdrukking van antwoorden, inbound dedupe,
    Cron-aflevering en sessieroutering.

    Voeg geen nieuwe gebruiken toe van `ChannelMessagingAdapter.parseExplicitTarget` of
    de parser-ondersteunde loaded-route-helpers (`parseExplicitTargetForLoadedChannel`
    of `resolveRouteTargetForLoadedChannel`) of
    `resolveChannelRouteTargetWithParser(...)` uit `plugin-sdk/channel-route`.
    Die hooks zijn verouderd en blijven alleen voor oudere plugins bestaan tijdens het
    migratievenster. Nieuwe kanaalplugins moeten
    `messaging.targetResolver.resolveTarget(...)` gebruiken voor normalisatie van doel-id's
    en fallback bij ontbrekende directorymatch, `messaging.inferTargetChatType(...)` wanneer core
    vroegtijdig een peertype nodig heeft, en `messaging.resolveOutboundSessionRoute(...)`
    voor provider-native sessie- en threadidentiteit.

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referentie voor importpaden

  <Accordion title="Common import path table">
  | Importpad | Doel | Belangrijkste exports |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Canonieke Plugin-invoerhelper | `definePluginEntry` |
  | `plugin-sdk/core` | Verouderde overkoepelende re-export voor definities/builders van kanaalinvoer | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export van rootconfiguratieschema | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Invoerhelper voor één provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Gerichte definities en builders voor kanaalinvoer | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Gedeelde helpers voor installatiewizard | Installatievertaler, allowlist-prompts, builders voor installatiestatus |
  | `plugin-sdk/setup-runtime` | Runtimehelpers tijdens installatie | `createSetupTranslator`, importveilige installatiepatchadapters, helpers voor lookup-notities, `promptResolvedAllowFrom`, `splitSetupEntries`, gedelegeerde installatieproxies |
  | `plugin-sdk/setup-adapter-runtime` | Verouderde alias voor installatieadapter | Gebruik `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Helpers voor installatietooling | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers voor meerdere accounts | Helpers voor accountlijst/configuratie/actiepoort |
  | `plugin-sdk/account-id` | Helpers voor account-id | `DEFAULT_ACCOUNT_ID`, normalisatie van account-id |
  | `plugin-sdk/account-resolution` | Helpers voor accountopzoeking | Helpers voor accountopzoeking + standaardfallback |
  | `plugin-sdk/account-helpers` | Smalle accounthelpers | Helpers voor accountlijst/accountactie |
  | `plugin-sdk/channel-setup` | Adapters voor installatiewizard | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitieven voor DM-koppeling | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Bedrading voor antwoordprefix, typen en bronlevering | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Factories voor configuratieadapters en helpers voor DM-toegang | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Builders voor configuratieschema's | Alleen gedeelde primitieven voor kanaalconfiguratieschema's en de generieke builder |
  | `plugin-sdk/bundled-channel-config-schema` | Gebundelde configuratieschema's | Alleen door OpenClaw onderhouden gebundelde plugins; nieuwe plugins moeten Plugin-lokale schema's definiëren |
  | `plugin-sdk/channel-config-schema-legacy` | Verouderde gebundelde configuratieschema's | Alleen compatibiliteitsalias; gebruik `plugin-sdk/bundled-channel-config-schema` voor onderhouden gebundelde plugins |
  | `plugin-sdk/telegram-command-config` | Helpers voor Telegram-opdrachtconfiguratie | Normalisatie van opdrachtnamen, inkorten van beschrijvingen, validatie op duplicaten/conflicten |
  | `plugin-sdk/channel-policy` | Resolutie van groeps-/DM-beleid | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Verouderde compatibiliteitsfacade | Gebruik `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Helpers voor inkomende enveloppen | Gedeelde helpers voor route + envelopbuilder |
  | `plugin-sdk/channel-inbound` | Helpers voor inkomende ontvangst | Contextopbouw, opmaak, roots, runners, voorbereide antwoordverzending en verzendpredicaten |
  | `plugin-sdk/messaging-targets` | Verouderd importpad voor doelparsering | Gebruik `plugin-sdk/channel-targets` voor generieke helpers voor doelparsering, `plugin-sdk/channel-route` voor routevergelijking en Plugin-eigen `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` voor provider-specifieke doelresolutie |
  | `plugin-sdk/outbound-media` | Helpers voor uitgaande media | Gedeeld laden van uitgaande media |
  | `plugin-sdk/outbound-send-deps` | Verouderde compatibiliteitsfacade | Gebruik `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Helpers voor levenscyclus van uitgaande berichten | Berichtadapters, ontvangstbewijzen, duurzame verzendhelpers, helpers voor live preview/streaming, antwoordopties, levenscyclushelpers, uitgaande identiteit en payloadplanning |
  | `plugin-sdk/channel-streaming` | Verouderde compatibiliteitsfacade | Gebruik `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Verouderde compatibiliteitsfacade | Gebruik `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Helpers voor threadbinding | Levenscyclus van threadbinding en adapterhelpers |
  | `plugin-sdk/agent-media-payload` | Verouderde helpers voor mediapayload | Builder voor agentmediapayload voor verouderde veldindelingen |
  | `plugin-sdk/channel-runtime` | Verouderde compatibiliteitsshim | Alleen verouderde kanaalruntimehulpprogramma's |
  | `plugin-sdk/channel-send-result` | Typen voor verzendresultaten | Typen voor antwoordresultaten |
  | `plugin-sdk/runtime-store` | Persistente Plugin-opslag | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Brede runtimehelpers | Runtime-/logging-/back-up-/Plugin-installatiehelpers |
  | `plugin-sdk/runtime-env` | Smalle runtime-envhelpers | Logger/runtime-env, timeout, retry en backoff-helpers |
  | `plugin-sdk/plugin-runtime` | Gedeelde Plugin-runtimehelpers | Helpers voor Plugin-opdrachten/hooks/http/interactief |
  | `plugin-sdk/hook-runtime` | Helpers voor hookpipeline | Gedeelde helpers voor Webhook/interne hookpipeline |
  | `plugin-sdk/lazy-runtime` | Lazy runtimehelpers | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Proceshelpers | Gedeelde exec-helpers |
  | `plugin-sdk/cli-runtime` | CLI-runtimehelpers | Opdrachtopmaak, wachttijden, versiehelpers |
  | `plugin-sdk/gateway-runtime` | Gateway-helpers | Gateway-client, starthulp voor event-loop-ready en patchhelpers voor kanaalstatus |
  | `plugin-sdk/config-runtime` | Verouderde configuratiecompatibiliteitsshim | Geef de voorkeur aan `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` en `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Telegram-opdrachthelpers | Fallback-stabiele helpers voor validatie van Telegram-opdrachten wanneer het gebundelde Telegram-contractoppervlak niet beschikbaar is |
  | `plugin-sdk/approval-runtime` | Helpers voor goedkeuringsprompts | Exec-/Plugin-goedkeuringspayload, helpers voor goedkeuringscapability/-profiel, native goedkeuringsroutering/runtimehelpers en gestructureerde opmaak van goedkeuringsweergavepaden |
  | `plugin-sdk/approval-auth-runtime` | Helpers voor goedkeuringsauthenticatie | Resolutie van goedkeurder, actieauthenticatie in dezelfde chat |
  | `plugin-sdk/approval-client-runtime` | Helpers voor goedkeuringsclient | Native exec-goedkeuringsprofiel-/filterhelpers |
  | `plugin-sdk/approval-delivery-runtime` | Helpers voor goedkeuringslevering | Native goedkeuringscapability-/leveringsadapters |
  | `plugin-sdk/approval-gateway-runtime` | Helpers voor goedkeuringsgateway | Gedeelde helper voor goedkeurings-Gateway-resolutie |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpers voor goedkeuringsadapter | Lichtgewicht helpers voor het laden van native goedkeuringsadapters voor hot kanaalentrypoints |
  | `plugin-sdk/approval-handler-runtime` | Helpers voor goedkeuringshandler | Bredere runtimehelpers voor goedkeuringshandlers; geef de voorkeur aan de smallere adapter-/Gateway-seams wanneer die voldoende zijn |
  | `plugin-sdk/approval-native-runtime` | Helpers voor goedkeuringsdoel | Native helpers voor binding van goedkeuringsdoel/account |
  | `plugin-sdk/approval-reply-runtime` | Helpers voor goedkeuringsantwoord | Helpers voor exec-/Plugin-goedkeuringsantwoordpayload |
  | `plugin-sdk/channel-runtime-context` | Helpers voor kanaalruntimecontext | Generieke register-/get-/watch-helpers voor kanaalruntimecontext |
  | `plugin-sdk/security-runtime` | Beveiligingshelpers | Gedeelde helpers voor vertrouwen, DM-gating, root-begrensde bestanden/paden, externe inhoud en secretverzameling |
  | `plugin-sdk/ssrf-policy` | Helpers voor SSRF-beleid | Helpers voor host-allowlist en privénetwerkbeleid |
  | `plugin-sdk/ssrf-runtime` | SSRF-runtimehelpers | Vastgezette dispatcher, bewaakte fetch, helpers voor SSRF-beleid |
  | `plugin-sdk/system-event-runtime` | Helpers voor systeemgebeurtenissen | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat-helpers | Heartbeat-wake-, event- en zichtbaarheidshelpers |
  | `plugin-sdk/delivery-queue-runtime` | Helpers voor leveringswachtrij | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Helpers voor kanaalactiviteit | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Dedupe-helpers | In-memory dedupe-caches |
  | `plugin-sdk/file-access-runtime` | Helpers voor bestandstoegang | Helpers voor veilige lokale bestands-/mediapaden |
  | `plugin-sdk/transport-ready-runtime` | Helpers voor transportgereedheid | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Helpers voor exec-goedkeuringsbeleid | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Helpers voor begrensde cache | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers voor diagnostische gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers voor foutopmaak | `formatUncaughtError`, `isApprovalNotFoundError`, helpers voor foutgrafen |
  | `plugin-sdk/fetch-runtime` | Verpakte fetch-/proxyhelpers | `resolveFetch`, proxyhelpers, optiehelpers voor EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Helpers voor hostnormalisatie | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Retry-helpers | `RetryConfig`, `retryAsync`, policyrunners |
  | `plugin-sdk/allow-from` | Allowlist-opmaak en invoermapping | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Opdrachtgating en helpers voor opdrachtoppervlak | `resolveControlCommandGate`, helpers voor afzenderautorisatie, helpers voor opdrachtregister inclusief opmaak van dynamische argumentmenu's |
  | `plugin-sdk/command-status` | Renderers voor opdrachtstatus/-help | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsering van secretinvoer | Helpers voor secretinvoer |
  | `plugin-sdk/webhook-ingress` | Helpers voor Webhook-verzoeken | Webhook-doelhulpprogramma's |
  | `plugin-sdk/webhook-request-guards` | Helpers voor Webhook-bodyguards | Helpers voor lezen/limiteren van requestbody |
  | `plugin-sdk/reply-runtime` | Gedeelde antwoordruntime | Inkomende verzending, Heartbeat, antwoordplanner, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Smalle helpers voor antwoordverzending | Finaliseren, providerverzending en helpers voor gesprekslabels |
  | `plugin-sdk/reply-history` | Helpers voor antwoordgeschiedenis | `createChannelHistoryWindow`; verouderde compatibiliteitsexports voor maphelpers zoals `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` en `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planning van antwoordreferenties | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers voor antwoordchunks | Helpers voor tekst-/markdownchunking |
  | `plugin-sdk/session-store-runtime` | Helpers voor sessiestore | Storepad + updated-at-helpers |
  | `plugin-sdk/state-paths` | Helpers voor statepaden | Helpers voor state- en OAuth-dir |
  | `plugin-sdk/routing` | Helpers voor routing/sessiesleutels | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, normalisatiehelpers voor sessiesleutels |
  | `plugin-sdk/status-helpers` | Helpers voor kanaalstatus | Bouwers voor kanaal-/accountstatussamenvattingen, standaarden voor runtime-status, helpers voor issue-metadata |
  | `plugin-sdk/target-resolver-runtime` | Helpers voor target-resolvers | Gedeelde helpers voor target-resolvers |
  | `plugin-sdk/string-normalization-runtime` | Helpers voor tekenreeksnormalisatie | Helpers voor slug-/tekenreeksnormalisatie |
  | `plugin-sdk/request-url` | Helpers voor aanvraag-URL's | Tekenreeks-URL's extraheren uit aanvraagachtige invoer |
  | `plugin-sdk/run-command` | Helpers voor getimede opdrachten | Getimede command runner met genormaliseerde stdout/stderr |
  | `plugin-sdk/param-readers` | Param-lezers | Algemene tool-/CLI-param-lezers |
  | `plugin-sdk/tool-payload` | Extractie van tool-payload | Genormaliseerde payloads extraheren uit toolresultaatobjecten |
  | `plugin-sdk/tool-send` | Extractie van tool-send | Canonieke velden voor verzendtargets extraheren uit tool-argumenten |
  | `plugin-sdk/temp-path` | Helpers voor tijdelijke paden | Gedeelde helpers voor tijdelijke downloadpaden |
  | `plugin-sdk/logging-core` | Logging-helpers | Subsystem-logger en redactiehelpers |
  | `plugin-sdk/markdown-table-runtime` | Helpers voor Markdown-tabellen | Helpers voor Markdown-tabelmodi |
  | `plugin-sdk/reply-payload` | Typen voor berichtantwoorden | Typen voor antwoordpayloads |
  | `plugin-sdk/provider-setup` | Gecureerde helpers voor lokale/zelfgehoste providerinstelling | Helpers voor detectie/configuratie van zelfgehoste providers |
  | `plugin-sdk/self-hosted-provider-setup` | Gerichte helpers voor OpenAI-compatibele zelfgehoste providerinstelling | Dezelfde helpers voor detectie/configuratie van zelfgehoste providers |
  | `plugin-sdk/provider-auth-runtime` | Helpers voor provider-runtime-auth | Helpers voor runtime-API-sleutelresolutie |
  | `plugin-sdk/provider-auth-api-key` | Helpers voor provider-API-sleutelinstelling | Helpers voor API-sleutel-onboarding/profielschrijven |
  | `plugin-sdk/provider-auth-result` | Helpers voor provider-auth-result | Standaard OAuth-auth-result-bouwer |
  | `plugin-sdk/provider-selection-runtime` | Helpers voor providerselectie | Geconfigureerde-of-automatische providerselectie en samenvoeging van raw providerconfiguratie |
  | `plugin-sdk/provider-env-vars` | Helpers voor provider-env-var | Helpers voor opzoeken van provider-auth-env-var |
  | `plugin-sdk/provider-model-shared` | Gedeelde helpers voor provider-model/replay | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gedeelde bouwers voor replay-beleid, helpers voor provider-endpoints en helpers voor model-id-normalisatie |
  | `plugin-sdk/provider-catalog-shared` | Gedeelde helpers voor providercatalogus | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches voor provider-onboarding | Helpers voor onboardingconfiguratie |
  | `plugin-sdk/provider-http` | Helpers voor provider-HTTP | Generieke helpers voor provider-HTTP-/endpoint-capabilities, inclusief multipart-form-helpers voor audiotranscriptie |
  | `plugin-sdk/provider-web-fetch` | Helpers voor provider-web-fetch | Helpers voor registratie/cache van web-fetch-providers |
  | `plugin-sdk/provider-web-search-config-contract` | Helpers voor provider-web-search-config | Smalle helpers voor web-search-config/credentials voor providers die geen plugin-enable-bedrading nodig hebben |
  | `plugin-sdk/provider-web-search-contract` | Helpers voor provider-web-search-contract | Smalle contracthelpers voor web-search-config/credentials, zoals `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` en scoped credential-setters/-getters |
  | `plugin-sdk/provider-web-search` | Helpers voor provider-web-search | Helpers voor registratie/cache/runtime van web-search-providers |
  | `plugin-sdk/provider-tools` | Helpers voor provider-tool-/schema-compat | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` en schema-opschoning + diagnostiek voor DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Helpers voor providergebruik | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` en andere helpers voor providergebruik |
  | `plugin-sdk/provider-stream` | Helpers voor provider-stream-wrappers | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typen voor stream-wrappers en gedeelde wrapper-helpers voor Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpers voor providertransport | Native providertransporthelpers zoals guarded fetch, extractie van tool-resultaattekst, transportberichttransformaties en schrijfbare transportgebeurtenisstreams |
  | `plugin-sdk/keyed-async-queue` | Geordende asynchrone wachtrij | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Gedeelde mediahelpers | Helpers voor media ophalen/transformeren/opslaan, door ffprobe ondersteunde peiling van video-afmetingen en bouwers voor mediapayloads |
  | `plugin-sdk/media-generation-runtime` | Gedeelde helpers voor mediageneratie | Gedeelde failover-helpers, kandidaatselectie en berichten over ontbrekende modellen voor image-/video-/music-generation |
  | `plugin-sdk/media-understanding` | Helpers voor mediabegrip | Providertypen voor mediabegrip plus exports van image-/audiohelpers voor providers |
  | `plugin-sdk/text-runtime` | Verouderde brede export voor tekstcompatibiliteit | Gebruik `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` en `logging-core` |
  | `plugin-sdk/text-chunking` | Helpers voor tekstopdeling | Helper voor uitgaande tekstopdeling |
  | `plugin-sdk/speech` | Speech-helpers | Speech-providertypen plus providergerichte directive-, registry- en validatiehelpers, en OpenAI-compatibele TTS-bouwer |
  | `plugin-sdk/speech-core` | Gedeelde speech-core | Speech-providertypen, registry, directives, normalisatie |
  | `plugin-sdk/realtime-transcription` | Helpers voor realtime transcriptie | Providertypen, registry-helpers en gedeelde WebSocket-sessiehelper |
  | `plugin-sdk/realtime-voice` | Helpers voor realtime spraak | Providertypen, registry-/resolutiehelpers, bridge-sessiehelpers, gedeelde talk-back-wachtrijen voor agents, spraakbesturing voor actieve runs, transcript-/event-health, echo-onderdrukking, matching van consultvragen, coördinatie van geforceerde consults, tracking van turn-context, tracking van uitvoeractiviteit en snelle contextconsulthelpers |
  | `plugin-sdk/image-generation` | Helpers voor image-generation | Providertypen voor image-generation plus helpers voor image-assets/data-URL's en de OpenAI-compatibele image-providerbouwer |
  | `plugin-sdk/image-generation-core` | Gedeelde image-generation-core | Image-generation-typen, failover, auth en registry-helpers |
  | `plugin-sdk/music-generation` | Helpers voor music-generation | Typen voor music-generation-providers/-aanvragen/-resultaten |
  | `plugin-sdk/music-generation-core` | Gedeelde music-generation-core | Music-generation-typen, failover-helpers, providerlookup en model-ref-parsing |
  | `plugin-sdk/video-generation` | Helpers voor video-generation | Typen voor video-generation-providers/-aanvragen/-resultaten |
  | `plugin-sdk/video-generation-core` | Gedeelde video-generation-core | Video-generation-typen, failover-helpers, providerlookup en model-ref-parsing |
  | `plugin-sdk/interactive-runtime` | Helpers voor interactieve antwoorden | Normalisatie/reductie van payloads voor interactieve antwoorden |
  | `plugin-sdk/channel-config-primitives` | Primitieven voor kanaalconfiguratie | Smalle kanaalconfiguratieschema-primitieven |
  | `plugin-sdk/channel-config-writes` | Helpers voor kanaalconfiguratieschrijven | Autorisatiehelpers voor kanaalconfiguratieschrijven |
  | `plugin-sdk/channel-plugin-common` | Gedeelde kanaalprelude | Gedeelde kanaalplugin-prelude-exports |
  | `plugin-sdk/channel-status` | Helpers voor kanaalstatus | Gedeelde helpers voor kanaalstatussnapshots/-samenvattingen |
  | `plugin-sdk/allowlist-config-edit` | Helpers voor allowlist-configuratie | Helpers voor bewerken/lezen van allowlist-configuratie |
  | `plugin-sdk/group-access` | Helpers voor groepstoegang | Gedeelde beslissingshelpers voor groepstoegang |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Verouderde compatibiliteitsfacades | Gebruik `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Guard-helpers voor directe DM's | Smalle pre-crypto-guardbeleidhelpers |
  | `plugin-sdk/extension-shared` | Gedeelde extensiehelpers | Primitieven voor passive-channel/status en ambient proxy-helpers |
  | `plugin-sdk/webhook-targets` | Helpers voor Webhook-targets | Webhook-targetregistry en route-install-helpers |
  | `plugin-sdk/webhook-path` | Verouderde webhookpad-alias | Gebruik `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Gedeelde webmediahelpers | Helpers voor laden van externe/lokale media |
  | `plugin-sdk/zod` | Verouderde Zod-compatibiliteitsre-export | Importeer `zod` rechtstreeks uit `zod` |
  | `plugin-sdk/memory-core` | Gebundelde memory-core-helpers | Helperoppervlak voor memorymanager/configuratie/bestand/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Runtimefacade voor memory-engine | Runtimefacade voor memory-index/search |
  | `plugin-sdk/memory-core-host-embedding-registry` | Memory-embedding-registry | Lichtgewicht registry-helpers voor memory-embedding-providers |
  | `plugin-sdk/memory-core-host-engine-foundation` | Memory-host-foundation-engine | Exports voor memory-host-foundation-engine |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Memory-host-embedding-engine | Memory-embedding-contracten, registry-toegang, lokale provider en generieke batch-/remote-helpers; concrete remote providers leven in hun eigenaar-plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | Memory-host-QMD-engine | Exports voor memory-host-QMD-engine |
  | `plugin-sdk/memory-core-host-engine-storage` | Memory-host-storage-engine | Exports voor memory-host-storage-engine |
  | `plugin-sdk/memory-core-host-multimodal` | Memory-host-multimodal-helpers | Memory-host-multimodal-helpers |
  | `plugin-sdk/memory-core-host-query` | Memory-host-query-helpers | Memory-host-query-helpers |
  | `plugin-sdk/memory-core-host-secret` | Memory-host-secret-helpers | Memory-host-secret-helpers |
  | `plugin-sdk/memory-core-host-events` | Verouderde memory-event-alias | Gebruik `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Memory-host-statushelpers | Memory-host-statushelpers |
  | `plugin-sdk/memory-core-host-runtime-cli` | Memory-host-CLI-runtime | Memory-host-CLI-runtimehelpers |
  | `plugin-sdk/memory-core-host-runtime-core` | Memory-host-core-runtime | Memory-host-core-runtimehelpers |
  | `plugin-sdk/memory-core-host-runtime-files` | Memory-host-bestands-/runtimehelpers | Memory-host-bestands-/runtimehelpers |
  | `plugin-sdk/memory-host-core` | Alias voor memory-host-core-runtime | Leveranciersneutrale alias voor memory-host-core-runtimehelpers |
  | `plugin-sdk/memory-host-events` | Alias voor memory-host-eventjournal | Leveranciersneutrale alias voor memory-host-eventjournalhelpers |
  | `plugin-sdk/memory-host-files` | Verouderde alias voor memory-bestand/runtime | Gebruik `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Beheerde Markdown-helpers | Gedeelde helpers voor beheerde Markdown voor memory-aangrenzende plugins |
  | `plugin-sdk/memory-host-search` | Active memory-searchfacade | Luie runtimefacade voor active-memory-search-manager |
  | `plugin-sdk/memory-host-status` | Verouderde alias voor memory-host-status | Gebruik `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Testhulpmiddelen | Repo-lokale verouderde compatibiliteitsbarrel; gebruik gerichte repo-lokale testsubpaden zoals `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` en `plugin-sdk/test-fixtures` |
</Accordion>

Deze tabel is bewust de gemeenschappelijke migratiesubset, niet het volledige SDK-oppervlak. De inventaris van compiler-entrypoints staat in
`scripts/lib/plugin-sdk-entrypoints.json`; package-exports worden gegenereerd uit de publieke subset.

Gereserveerde helper-seams voor gebundelde plugins zijn uit de publieke SDK-exportmap verwijderd, behalve expliciet gedocumenteerde compatibiliteitsfacades zoals de verouderde `plugin-sdk/discord`-shim die behouden blijft voor het gepubliceerde
`@openclaw/discord@2026.3.13`-pakket. Eigenaarsspecifieke helpers staan binnen het eigenaar-Plugin-pakket; gedeeld hostgedrag moet via generieke SDK-contracten lopen, zoals `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` en `plugin-sdk/plugin-config-runtime`.

Gebruik de smalste import die bij de taak past. Als je geen export kunt vinden, controleer dan de bron op `src/plugin-sdk/` of vraag maintainers welk generiek contract er eigenaar van moet zijn.

## Actieve deprecaties

Smallere deprecaties die gelden voor de plugin-SDK, het providercontract, het runtime-oppervlak en het manifest. Elk ervan werkt vandaag nog, maar wordt in een toekomstige major release verwijderd. De vermelding onder elk item koppelt de oude API aan de canonieke vervanging.

<AccordionGroup>
  <Accordion title="command-auth-helpbuilders → command-status">
    **Oud (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nieuw (`openclaw/plugin-sdk/command-status`)**: dezelfde signatures, dezelfde exports - alleen geïmporteerd uit het smallere subpad. `command-auth`
    exporteert ze opnieuw als compat-stubs.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention-gatinghelpers → resolveInboundMentionDecision">
    **Oud**: `resolveInboundMentionRequirement({ facts, policy })` en
    `shouldDropInboundForMention(...)` uit
    `openclaw/plugin-sdk/channel-inbound` of
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nieuw**: `resolveInboundMentionDecision({ facts, policy })` - retourneert één beslissingsobject in plaats van twee gesplitste calls.

    Downstream channel-plugins (Slack, Discord, Matrix, Microsoft Teams) zijn al overgestapt.

  </Accordion>

  <Accordion title="Channel runtime-shim en channel actions-helpers">
    `openclaw/plugin-sdk/channel-runtime` is een compatibiliteitsshim voor oudere channel-plugins. Importeer dit niet vanuit nieuwe code; gebruik
    `openclaw/plugin-sdk/channel-runtime-context` voor het registreren van runtime-objecten.

    `channelActions*`-helpers in `openclaw/plugin-sdk/channel-actions` zijn verouderd naast ruwe channel-exports voor "actions". Stel capabilities beschikbaar via het semantische `presentation`-oppervlak - channel-plugins verklaren wat ze renderen (kaarten, knoppen, selects) in plaats van welke ruwe action-namen ze accepteren.

  </Accordion>

  <Accordion title="Web search-provider tool()-helper → createTool() op de plugin">
    **Oud**: `tool()`-factory uit `openclaw/plugin-sdk/provider-web-search`.

    **Nieuw**: implementeer `createTool(...)` rechtstreeks op de provider-plugin.
    OpenClaw heeft de SDK-helper niet langer nodig om de tool-wrapper te registreren.

  </Accordion>

  <Accordion title="Plattetekst-channel-enveloppen → BodyForAgent">
    **Oud**: `formatInboundEnvelope(...)` (en
    `ChannelMessageForAgent.channelEnvelope`) om een platte plattetekst-promptenvelop te bouwen uit inkomende channel-berichten.

    **Nieuw**: `BodyForAgent` plus gestructureerde blokken met gebruikerscontext. Channel-plugins voegen routeringsmetadata (thread, topic, reply-to, reacties) toe als getypeerde velden in plaats van ze samen te voegen tot een prompt-string. De
    `formatAgentEnvelope(...)`-helper wordt nog ondersteund voor gesynthetiseerde enveloppen voor assistants, maar inkomende plattetekst-enveloppen worden uitgefaseerd.

    Betrokken gebieden: `inbound_claim`, `message_received` en elke aangepaste channel-plugin die `channelEnvelope`-tekst nabewerkte.

  </Accordion>

  <Accordion title="deactivate-hook → gateway_stop">
    **Oud**: `api.on("deactivate", handler)`.

    **Nieuw**: `api.on("gateway_stop", handler)`. De event en context vormen hetzelfde shutdown-cleanupcontract; alleen de hooknaam verandert.

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

    `deactivate` blijft bedraad als verouderde compatibiliteitsalias tot na
    2026-08-16.

  </Accordion>

  <Accordion title="subagent_spawning-hook → core thread-binding">
    **Oud**: `api.on("subagent_spawning", handler)` dat
    `threadBindingReady` of `deliveryOrigin` retourneert.

    **Nieuw**: laat core `thread: true`-subagentbindings voorbereiden via de adapter voor channel-sessiebinding. Gebruik `api.on("subagent_spawned", handler)` alleen voor observatie na lancering.

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
    `PluginHookSubagentSpawningResult` en
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` blijven alleen als verouderde compatibiliteitsoppervlakken bestaan terwijl externe plugins migreren.

  </Accordion>

  <Accordion title="Provider discovery-types → providercatalogustypes">
    Vier discovery-typealiassen zijn nu dunne wrappers rond de types uit het catalogustijdperk:

    | Oude alias                | Nieuw type                |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Plus de legacy statische zak `ProviderCapabilities` - provider-plugins moeten expliciete providerhooks gebruiken, zoals `buildReplayPolicy`,
    `normalizeToolSchemas` en `wrapStreamFn`, in plaats van een statisch object.

  </Accordion>

  <Accordion title="Thinking policy-hooks → resolveThinkingProfile">
    **Oud** (drie afzonderlijke hooks op `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` en
    `resolveDefaultThinkingLevel(ctx)`.

    **Nieuw**: één `resolveThinkingProfile(ctx)` die een
    `ProviderThinkingProfile` retourneert met de canonieke `id`, optionele `label` en gerangschikte lijst met niveaus. OpenClaw degradeert verouderde opgeslagen waarden automatisch op basis van profielrang.

    De context bevat `provider`, `modelId`, optionele samengevoegde `reasoning` en optionele samengevoegde model-`compat`-feiten. Provider-plugins kunnen die catalogusfeiten gebruiken om alleen een modelspecifiek profiel beschikbaar te stellen wanneer het geconfigureerde requestcontract dit ondersteunt.

    Implementeer één hook in plaats van drie. De legacy hooks blijven werken tijdens de deprecationperiode, maar worden niet samengesteld met het profielresultaat.

  </Accordion>

  <Accordion title="Externe auth-providers → contracts.externalAuthProviders">
    **Oud**: externe auth-hooks implementeren zonder de provider in het pluginmanifest te declareren.

    **Nieuw**: declareer `contracts.externalAuthProviders` in het pluginmanifest
    **en** implementeer `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider-env-var-lookup → setup.providers[].envVars">
    **Oud** manifestveld: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nieuw**: spiegel dezelfde env-var-lookup naar `setup.providers[].envVars`
    in het manifest. Dit consolideert setup-/status-env-metadata op één plek en voorkomt dat de plugin-runtime moet worden gestart alleen om env-var-lookups te beantwoorden.

    `providerAuthEnvVars` blijft ondersteund via een compatibiliteitsadapter totdat de deprecationperiode sluit.

  </Accordion>

  <Accordion title="Registratie van memory-plugin → registerMemoryCapability">
    **Oud**: drie afzonderlijke calls -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nieuw**: één call op de memory-state-API -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Dezelfde slots, één registratiecall. Additieve prompt- en corpushelpers
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) worden niet beïnvloed.

  </Accordion>

  <Accordion title="Memory embedding-provider-API">
    **Oud**: `api.registerMemoryEmbeddingProvider(...)` plus
    `contracts.memoryEmbeddingProviders`.

    **Nieuw**: `api.registerEmbeddingProvider(...)` plus
    `contracts.embeddingProviders`.

    Het generieke embedding-providercontract is herbruikbaar buiten memory en is het ondersteunde pad voor nieuwe providers. De memory-specifieke registratie-API blijft bedraad als verouderde compatibiliteit terwijl bestaande providers migreren.
    Plugininspectie rapporteert niet-gebundeld gebruik als compatibiliteitsschuld.

  </Accordion>

  <Accordion title="Types voor subagent-sessieberichten hernoemd">
    Twee legacy-typealiassen die nog steeds worden geëxporteerd uit `src/plugins/runtime/types.ts`:

    | Oud                           | Nieuw                           |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    De runtime-methode `readSession` is verouderd ten gunste van
    `getSessionMessages`. Dezelfde signature; de oude methode roept door naar de nieuwe.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Oud**: `runtime.tasks.flow` (enkelvoud) retourneerde een live task-flow-accessor.

    **Nieuw**: `runtime.tasks.managedFlows` behoudt de beheerde TaskFlow-mutatie-runtime voor plugins die child-taken vanuit een flow maken, bijwerken, annuleren of uitvoeren. Gebruik `runtime.tasks.flows` wanneer de plugin alleen DTO-gebaseerde reads nodig heeft.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Ingebedde extension-factories → agent tool-result-middleware">
    Behandeld in "Migreren → Ingebedde tool-result-extensions naar middleware migreren" hierboven. Hier opgenomen voor volledigheid: het verwijderde embedded-runner-only
    `api.registerEmbeddedExtensionFactory(...)`-pad is vervangen door
    `api.registerAgentToolResultMiddleware(...)` met een expliciete runtime-lijst in `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="OpenClawSchemaType-alias → OpenClawConfig">
    `OpenClawSchemaType`, opnieuw geëxporteerd uit `openclaw/plugin-sdk`, is nu een eenregelige alias voor `OpenClawConfig`. Geef de voorkeur aan de canonieke naam.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Deprecaties op extensieniveau (binnen gebundelde channel-/provider-plugins onder
`extensions/`) worden bijgehouden binnen hun eigen `api.ts`- en `runtime-api.ts`-barrels. Ze hebben geen invloed op contracten van plugins van derden en worden hier niet vermeld. Als je de lokale barrel van een gebundelde plugin rechtstreeks gebruikt, lees dan vóór de upgrade de deprecation-opmerkingen in die barrel.
</Note>

## Verwijderingstijdlijn

| Wanneer                | Wat gebeurt er                                                         |
| ---------------------- | ---------------------------------------------------------------------- |
| **Nu**                 | Verouderde oppervlakken geven runtimewaarschuwingen                    |
| **Volgende major release** | Verouderde oppervlakken worden verwijderd; plugins die ze nog gebruiken zullen falen |

Alle core-plugins zijn al gemigreerd. Externe plugins moeten migreren
vóór de volgende major release.

## De waarschuwingen tijdelijk onderdrukken

Stel deze omgevingsvariabelen in terwijl je aan de migratie werkt:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Dit is een tijdelijke uitweg, geen permanente oplossing.

## Gerelateerd

- [Aan de slag](/nl/plugins/building-plugins) - bouw je eerste plugin
- [SDK-overzicht](/nl/plugins/sdk-overview) - volledige referentie voor subpad-imports
- [Kanaalplugins](/nl/plugins/sdk-channel-plugins) - kanaalplugins bouwen
- [Providerplugins](/nl/plugins/sdk-provider-plugins) - providerplugins bouwen
- [Plugininternals](/nl/plugins/architecture) - diepgaande architectuuruitleg
- [Pluginmanifest](/nl/plugins/manifest) - referentie voor het manifestschema
