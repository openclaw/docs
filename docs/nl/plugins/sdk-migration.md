---
read_when:
    - Je ziet de waarschuwing OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Je ziet de waarschuwing OPENCLAW_EXTENSION_API_DEPRECATED
    - Je gebruikte api.registerEmbeddedExtensionFactory vóór OpenClaw 2026.4.25
    - Je werkt een Plugin bij naar de moderne Plugin-architectuur
    - Je onderhoudt een externe OpenClaw Plugin
sidebarTitle: Migrate to SDK
summary: Migreer van de verouderde achterwaartse-compatibiliteitslaag naar de moderne plugin-SDK
title: Plugin SDK-migratie
x-i18n:
    generated_at: "2026-07-04T10:50:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7873de40aea56f456781ecf8ac9a4705c958030f7c68f8a112ad3f0fce62f078
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw is overgestapt van een brede laag voor achterwaartse compatibiliteit naar een moderne Plugin-
architectuur met gerichte, gedocumenteerde imports. Als je Plugin is gebouwd vóór
de nieuwe architectuur, helpt deze gids je met migreren.

## Wat verandert er

Het oude Plugin-systeem bood twee volledig open oppervlakken waarmee Plugins
alles wat ze nodig hadden vanuit één enkel ingangspunt konden importeren:

- **`openclaw/plugin-sdk/compat`** - één import die tientallen helpers opnieuw
  exporteerde. Deze werd geïntroduceerd om oudere hook-gebaseerde Plugins te
  laten werken terwijl de nieuwe Plugin-architectuur werd gebouwd.
- **`openclaw/plugin-sdk/infra-runtime`** - een brede runtime-helperbarrel die
  systeemgebeurtenissen, Heartbeat-status, afleverwachtrijen, fetch/proxy-helpers,
  bestandshelpers, goedkeuringstypen en niet-gerelateerde hulpprogramma's combineerde.
- **`openclaw/plugin-sdk/config-runtime`** - een brede configuratiecompatibiliteitsbarrel
  die tijdens het migratievenster nog verouderde directe laad-/schrijfhelpers bevat.
- **`openclaw/extension-api`** - een brug die Plugins directe toegang gaf tot
  host-side helpers zoals de ingebouwde agent-runner.
- **`api.registerEmbeddedExtensionFactory(...)`** - een verwijderde, alleen voor de embedded runner bestemde
  gebundelde extensie-hook die embedded-runner-gebeurtenissen zoals
  `tool_result` kon observeren.

De brede importoppervlakken zijn nu **verouderd**. Ze werken nog steeds tijdens runtime,
maar nieuwe Plugins mogen ze niet gebruiken, en bestaande Plugins moeten migreren voordat
de volgende major release ze verwijdert. De API voor registratie van extensiefactory's
die alleen voor de embedded runner was bedoeld, is verwijderd; gebruik in plaats daarvan tool-result-middleware.

OpenClaw verwijdert of herinterpreteert gedocumenteerd Plugin-gedrag niet in dezelfde
wijziging die een vervanging introduceert. Brekende contractwijzigingen moeten eerst
via een compatibiliteitsadapter, diagnostiek, documentatie en een deprecatievenster verlopen.
Dat geldt voor SDK-imports, manifestvelden, setup-API's, hooks en runtime-
registratiegedrag.

<Warning>
  De laag voor achterwaartse compatibiliteit wordt in een toekomstige major release verwijderd.
  Plugins die nog steeds uit deze oppervlakken importeren, zullen dan niet meer werken.
  Verouderde registraties van embedded extensiefactory's laden nu al niet meer.
</Warning>

## Waarom dit is gewijzigd

De oude aanpak veroorzaakte problemen:

- **Trage start** - het importeren van één helper laadde tientallen niet-gerelateerde modules
- **Circulaire afhankelijkheden** - brede herexports maakten het makkelijk om importcycli te creëren
- **Onduidelijk API-oppervlak** - geen manier om te zien welke exports stabiel waren versus intern

De moderne Plugin-SDK lost dit op: elk importpad (`openclaw/plugin-sdk/\<subpath\>`)
is een kleine, zelfstandige module met een duidelijk doel en een gedocumenteerd contract.

Verouderde gemaksovergangen voor providers voor gebundelde kanalen zijn ook verdwenen.
Kanaalbranded helperovergangen waren private mono-repo-snelkoppelingen, geen stabiele
Plugin-contracten. Gebruik in plaats daarvan smalle generieke SDK-subpaden. Houd binnen de gebundelde
Plugin-werkruimte provider-owned helpers in de eigen `api.ts` of
`runtime-api.ts` van die Plugin.

Huidige voorbeelden van gebundelde providers:

- Anthropic houdt Claude-specifieke streamhelpers in zijn eigen `api.ts` /
  `contract-api.ts`-overgang
- OpenAI houdt provider-builders, default-model-helpers en realtime-provider-
  builders in zijn eigen `api.ts`
- OpenRouter houdt provider-builder- en onboarding-/configuratiehelpers in zijn eigen
  `api.ts`

## Migratieplan voor Talk en realtime spraak

Realtime spraak-, telefonie-, meeting- en browser-Talk-code verhuist van
oppervlaklokale beurtboekhouding naar een gedeelde Talk-sessiecontroller die wordt geëxporteerd door
`openclaw/plugin-sdk/realtime-voice`. De nieuwe controller beheert de gemeenschappelijke Talk-
gebeurtenisenvelop, actieve beurtstatus, capture-status, output-audio-status, recente
gebeurtenisgeschiedenis en afwijzing van verouderde beurten. Provider-Plugins moeten vendor-
specifieke realtime-sessies blijven beheren; surface-Plugins moeten capture,
playback, telefonie- en meeting-eigenaardigheden blijven beheren.

Deze Talk-migratie is bewust brekend schoon:

1. Houd de gedeelde controller-/runtime-primitieven in
   `plugin-sdk/realtime-voice`.
2. Zet gebundelde oppervlakken over naar de gedeelde controller: browserrelay,
   managed-room-handoff, realtime voice-call, streaming STT voor voice-call, Google
   Meet realtime en native push-to-talk.
3. Vervang oude Talk-RPC-families door de definitieve `talk.session.*`- en
   `talk.client.*`-API.
4. Adverteer één live Talk-gebeurteniskanaal in Gateway
   `hello-ok.features.events`: `talk.event`.
5. Verwijder het oude realtime HTTP-endpoint en elk request-time pad voor
   instructie-override.

Nieuwe code mag `createTalkEventSequencer(...)` niet rechtstreeks aanroepen, tenzij deze
een low-level adapter of testfixture implementeert. Geef de voorkeur aan de gedeelde controller
zodat beurtgebonden gebeurtenissen niet zonder turn id kunnen worden uitgezonden, verouderde `turnEnd`- /
`turnCancel`-aanroepen geen nieuwere actieve beurt kunnen wissen, en output-audio-lifecycle-
gebeurtenissen consistent blijven tussen telefonie, meetings, browserrelay, managed-room-
handoff en native Talk-clients.

De beoogde vorm van de publieke API is:

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

Browser-owned WebRTC/provider-websocket-sessies gebruiken `talk.client.create`,
omdat de browser de provideronderhandeling en mediatransport beheert terwijl de
Gateway referenties, instructies en toolbeleid beheert. `talk.session.*` is het
gemeenschappelijke door Gateway beheerde oppervlak voor gateway-relay-realtime, gateway-relay-
transcriptie en managed-room native STT/TTS-sessies.

Verouderde configuraties die realtime-selectors naast `talk.provider` /
`talk.providers` plaatsten, moeten worden gerepareerd met `openclaw doctor --fix`; runtime Talk
herinterpreteert spraak-/TTS-providerconfiguratie niet als realtime-providerconfiguratie.

De ondersteunde combinaties voor `talk.session.create` zijn bewust klein:

| Modus           | Transport       | Brain           | Eigenaar           | Opmerkingen                                                                                                        |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Full-duplex provider-audio overbrugd via de Gateway; toolaanroepen worden via de agent-consult-tool gerouteerd.    |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Alleen streaming-STT; callers sturen invoeraudio en ontvangen transcriptgebeurtenissen.                            |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | Push-to-talk- en walkie-talkie-achtige rooms waarbij de client capture/playback beheert en de Gateway beurtstatus beheert. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | Admin-only roommodus voor vertrouwde first-party oppervlakken die Gateway-toolacties rechtstreeks uitvoeren.        |

Kaart met verwijderde methoden:

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

De uniforme controlevocabulaire is ook bewust smal:

  | Methode                        | Van toepassing op                                      | Contract                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Voeg een base64 PCM-audiofragment toe aan de providersessie die eigendom is van dezelfde Gateway-verbinding.                                                                              |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Start een gebruikersbeurt in een beheerde ruimte.                                                                                                                                        |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Beëindig de actieve beurt na validatie van een verouderde beurt.                                                                                                                         |
  | `talk.session.cancelTurn`       | alle sessies die eigendom zijn van Gateway              | Annuleer actief opname-, provider-, agent- en TTS-werk voor een beurt.                                                                                                                   |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Stop de audio-uitvoer van de assistent zonder noodzakelijkerwijs de gebruikersbeurt te beëindigen.                                                                                       |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Voltooi een provider-toolaanroep die door de relay is uitgegeven; geef `options.willContinue` door voor tussentijdse uitvoer of `options.suppressResponse` om aan de aanroep te voldoen zonder nog een assistentantwoord. |
  | `talk.session.steer`            | Talk-sessies met agent-ondersteuning                    | Stuur gesproken `status`-, `steer`-, `cancel`- of `followup`-besturing naar de actieve ingesloten run die vanuit de Talk-sessie is opgelost.                                             |
  | `talk.session.close`            | alle uniforme sessies                                   | Stop relay-sessies of trek de status van de beheerde ruimte in, en vergeet daarna de uniforme sessie-id.                                                                                 |

  Introduceer geen provider- of platformspecifieke uitzonderingen in core om dit te laten werken.
  Core beheert de semantiek van Talk-sessies. Provider-plugins beheren het instellen van leverancierssessies.
  Spraakoproepen en Google Meet beheren telefonie- en vergaderadapters. Browser- en native
  apps beheren de UX voor apparaatopname en -weergave.

  ## Compatibiliteitsbeleid

  Voor externe plugins volgt compatibiliteitswerk deze volgorde:

  1. voeg het nieuwe contract toe
  2. houd het oude gedrag aangesloten via een compatibiliteitsadapter
  3. geef een diagnose of waarschuwing uit die het oude pad en de vervanging noemt
  4. dek beide paden af in tests
  5. documenteer de veroudering en het migratiepad
  6. verwijder pas na het aangekondigde migratievenster, meestal in een major release

  Maintainers kunnen de huidige migratiewachtrij controleren met
  `pnpm plugins:boundary-report`. Gebruik `pnpm plugins:boundary-report:summary` voor
  compacte aantallen, `--owner <id>` voor één plugin of compatibiliteitseigenaar, en
  `pnpm plugins:boundary-report:ci` wanneer een CI-gate moet falen op verlopen
  compatibiliteitsrecords, cross-owner gereserveerde SDK-imports of ongebruikte gereserveerde SDK-
  subpaden. Het rapport groepeert verouderde
  compatibiliteitsrecords op verwijderdatum, telt lokale code-/docs-verwijzingen,
  brengt cross-owner gereserveerde SDK-imports naar boven en vat de private
  memory-host SDK-bridge samen, zodat compatibiliteitsopschoning expliciet blijft in plaats van
  te vertrouwen op ad-hoczoekopdrachten. Gereserveerde SDK-subpaden moeten bijgehouden eigenaarsgebruik hebben;
  ongebruikte gereserveerde helper-exports moeten uit de publieke SDK worden verwijderd.

  Als een manifestveld nog steeds wordt geaccepteerd, kunnen pluginauteurs het blijven gebruiken totdat
  de docs en diagnoses anders aangeven. Nieuwe code moet de gedocumenteerde
  vervanging verkiezen, maar bestaande plugins mogen niet breken tijdens gewone minor
  releases.

  ## Migreren

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    Gebundelde plugins moeten stoppen met het rechtstreeks aanroepen van
    `api.runtime.config.loadConfig()` en
    `api.runtime.config.writeConfigFile(...)`. Geef de voorkeur aan configuratie die al
    aan het actieve aanroeppad is doorgegeven. Langlevende handlers die de
    huidige processnapshot nodig hebben, kunnen `api.runtime.config.current()` gebruiken. Langlevende
    agenttools moeten `ctx.getRuntimeConfig()` van de toolcontext binnen
    `execute` gebruiken, zodat een tool die vóór een configuratieschrijving is gemaakt nog steeds de vernieuwde
    runtimeconfiguratie ziet.

    Configuratieschrijvingen moeten via de transactionele helpers lopen en een
    beleid voor na het schrijven kiezen:

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
    follow-up en bewust de herlaadplanner wil onderdrukken.
    Mutatieresultaten bevatten een getypeerde `followUp`-samenvatting voor tests en logging;
    de gateway blijft verantwoordelijk voor het toepassen of plannen van de herstart.
    `loadConfig` en `writeConfigFile` blijven als verouderde compatibiliteits-
    helpers voor externe plugins bestaan tijdens het migratievenster en waarschuwen één keer met
    de compatibiliteitscode `runtime-config-load-write`. Gebundelde plugins en runtimecode in de repo
    worden beschermd door scanner-guardrails in
    `pnpm check:deprecated-api-usage` en
    `pnpm check:no-runtime-action-load-config`: nieuw gebruik in productieplugins
    faalt direct, directe configuratieschrijvingen falen, gatewayservermethoden moeten de
    request-runtime-snapshot gebruiken, runtimehelpers voor channel send/action/client
    moeten configuratie van hun boundary ontvangen, en langlevende runtimemodules hebben
    nul toegestane ambient `loadConfig()`-aanroepen.

    Nieuwe plugincode moet ook vermijden de brede
    `openclaw/plugin-sdk/config-runtime`-compatibiliteitsbarrel te importeren. Gebruik het smalle
    SDK-subpad dat bij de taak past:

    | Behoefte | Import |
    | --- | --- |
    | Configuratietypen zoals `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Al geladen configuratieasserties en configuratieopzoeking voor plugin-entry | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lezingen van de huidige runtimesnapshot | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Configuratieschrijvingen | `openclaw/plugin-sdk/config-mutation` |
    | Helpers voor sessieopslag | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown-tabelconfiguratie | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Runtimehelpers voor groepsbeleid | `openclaw/plugin-sdk/runtime-group-policy` |
    | Oplossing van geheime invoer | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model-/sessie-overschrijvingen | `openclaw/plugin-sdk/model-session-runtime` |

    Gebundelde plugins en hun tests worden door scanners beschermd tegen de brede
    barrel, zodat imports en mocks lokaal blijven voor het gedrag dat ze nodig hebben. De brede
    barrel bestaat nog steeds voor externe compatibiliteit, maar nieuwe code mag er niet
    van afhankelijk zijn.

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    Gebundelde plugins moeten embedded-runner-only
    `api.registerEmbeddedExtensionFactory(...)`-handlers voor toolresultaten vervangen door
    runtime-neutrale middleware.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Werk tegelijk het pluginmanifest bij:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Geïnstalleerde plugins kunnen ook middleware voor toolresultaten registreren wanneer ze
    expliciet zijn ingeschakeld en elke beoogde runtime declareren in
    `contracts.agentToolResultMiddleware`. Niet-gedeclareerde geïnstalleerde middleware-
    registraties worden geweigerd.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    Channel-plugins met approval-ondersteuning stellen native approvalgedrag nu beschikbaar via
    `approvalCapability.nativeRuntime` plus het gedeelde runtime-contextregister.

    Belangrijkste wijzigingen:

    - Vervang `approvalCapability.handler.loadRuntime(...)` door
      `approvalCapability.nativeRuntime`
    - Verplaats approval-specifieke auth/delivery van legacy `plugin.auth` /
      `plugin.approvals`-bedrading naar `approvalCapability`
    - `ChannelPlugin.approvals` is verwijderd uit het publieke channel-plugin-
      contract; verplaats delivery/native/render-velden naar `approvalCapability`
    - `plugin.auth` blijft alleen voor channel-login-/logoutflows; approval-auth-
      hooks daar worden niet langer door core gelezen
    - Registreer runtimeobjecten die eigendom zijn van het channel, zoals clients, tokens of Bolt-
      apps, via `openclaw/plugin-sdk/channel-runtime-context`
    - Verstuur geen reroute-meldingen die eigendom zijn van de plugin vanuit native approvalhandlers;
      core beheert nu elders-gerouteerde meldingen vanuit daadwerkelijke bezorgresultaten
    - Wanneer je `channelRuntime` doorgeeft aan `createChannelManager(...)`, lever dan een
      echt `createPluginRuntime().channel`-oppervlak. Gedeeltelijke stubs worden geweigerd.

    Zie `/plugins/sdk-channel-plugins` voor de huidige indeling van approval-capabilities.

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    Als je plugin `openclaw/plugin-sdk/windows-spawn` gebruikt, falen niet-opgeloste Windows
    `.cmd`/`.bat`-wrappers nu gesloten, tenzij je expliciet
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

    Als je aanroeper niet bewust vertrouwt op shell-fallback, stel dan
    `allowShellFallback` niet in en handel in plaats daarvan de gegooide fout af.

  </Step>

  <Step title="Find deprecated imports">
    Zoek in je plugin naar imports uit een van beide verouderde oppervlakken:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
    Elke export uit het oude oppervlak verwijst naar een specifiek modern importpad:

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
    | sessieopslaghelpers | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` bestaat nog steeds voor externe
    compatibiliteit, maar nieuwe code moet het gerichte helperoppervlak importeren dat
    daadwerkelijk nodig is:

    | Behoefte | Import |
    | --- | --- |
    | Helpers voor systeemgebeurteniswachtrij | `openclaw/plugin-sdk/system-event-runtime` |
    | Helpers voor Heartbeat-wake, gebeurtenissen en zichtbaarheid | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Leegmaken van wachtrij voor openstaande levering | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetrie voor kanaalactiviteit | `openclaw/plugin-sdk/channel-activity-runtime` |
    | In-memory en persistentie-ondersteunde dedupe-caches | `openclaw/plugin-sdk/dedupe-runtime` |
    | Helpers voor veilige lokale bestands-/mediapaden | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher-bewuste fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Helpers voor proxy en bewaakte fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Beleidstypen voor SSRF-dispatcher | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Typen voor goedkeuringsverzoek/-afhandeling | `openclaw/plugin-sdk/approval-runtime` |
    | Helpers voor payload en opdracht van goedkeuringsantwoord | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helpers voor foutopmaak | `openclaw/plugin-sdk/error-runtime` |
    | Wachten op transportgereedheid | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helpers voor veilige tokens | `openclaw/plugin-sdk/secure-random-runtime` |
    | Begrensde gelijktijdigheid van async taken | `openclaw/plugin-sdk/concurrency-runtime` |
    | Numerieke coercie | `openclaw/plugin-sdk/number-runtime` |
    | Proces-lokaal async-slot | `openclaw/plugin-sdk/async-lock-runtime` |
    | Bestandssloten | `openclaw/plugin-sdk/file-lock` |

    Gebundelde plugins worden door de scanner beschermd tegen `infra-runtime`, zodat repocode
    niet kan terugvallen naar de brede barrel.

  </Step>

  <Step title="Migrate channel route helpers">
    Nieuwe kanaalroutecode moet `openclaw/plugin-sdk/channel-route` gebruiken.
    De oudere route-key- en comparable-target-namen blijven als compatibiliteitsaliassen
    bestaan tijdens de migratieperiode, maar nieuwe plugins moeten de routenamen gebruiken
    die het gedrag direct beschrijven:

    | Oude helper | Moderne helper |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    De moderne routehelpers normaliseren `{ channel, to, accountId, threadId }`
    consistent voor native goedkeuringen, onderdrukking van antwoorden, inkomende dedupe,
    cronlevering en sessierouting.

    Voeg geen nieuwe toepassingen toe van `ChannelMessagingAdapter.parseExplicitTarget` of
    de parser-ondersteunde geladen-routehelpers (`parseExplicitTargetForLoadedChannel`
    of `resolveRouteTargetForLoadedChannel`) of
    `resolveChannelRouteTargetWithParser(...)` uit `plugin-sdk/channel-route`.
    Die hooks zijn verouderd en blijven alleen voor oudere plugins bestaan tijdens de
    migratieperiode. Nieuwe kanaalplugins moeten
    `messaging.targetResolver.resolveTarget(...)` gebruiken voor normalisatie van doel-id's
    en fallback bij ontbrekende directoryvermeldingen, `messaging.inferTargetChatType(...)` wanneer core
    vroeg een peer-soort nodig heeft, en `messaging.resolveOutboundSessionRoute(...)`
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
  | `plugin-sdk/plugin-entry` | Canonieke invoerhulpfunctie voor Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Verouderde overkoepelende her-export voor kanaalinvoerdefinities/-bouwers | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export van rootconfiguratieschema | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Invoerhulpfunctie voor één provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Gerichte kanaalinvoerdefinities en -bouwers | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Gedeelde hulpfuncties voor de configuratiewizard | Configuratievertaler, prompts voor toegestane lijsten, bouwers voor configuratiestatus |
  | `plugin-sdk/setup-runtime` | Runtime-hulpfuncties tijdens configuratie | `createSetupTranslator`, importveilige configuratiepatchadapters, hulpfuncties voor opzoeknotities, `promptResolvedAllowFrom`, `splitSetupEntries`, gedelegeerde configuratieproxy's |
  | `plugin-sdk/setup-adapter-runtime` | Verouderde alias voor configuratieadapter | Gebruik `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Hulpfuncties voor configuratietooling | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Hulpfuncties voor meerdere accounts | Hulpfuncties voor accountlijst/configuratie/actiepoort |
  | `plugin-sdk/account-id` | Hulpfuncties voor account-ID's | `DEFAULT_ACCOUNT_ID`, normalisatie van account-ID's |
  | `plugin-sdk/account-resolution` | Hulpfuncties voor accountopzoeking | Hulpfuncties voor accountopzoeking + standaard-terugval |
  | `plugin-sdk/account-helpers` | Smalle accounthulpfuncties | Hulpfuncties voor accountlijst/accountacties |
  | `plugin-sdk/channel-setup` | Adapters voor de configuratiewizard | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitieven voor DM-koppeling | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Bekabeling voor antwoordprefix, typen en bronlevering | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fabrieken voor configuratieadapters en hulpfuncties voor DM-toegang | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Bouwers voor configuratieschema's | Gedeelde kanaalconfiguratieschema-primitieven en alleen de generieke bouwer |
  | `plugin-sdk/bundled-channel-config-schema` | Gebundelde configuratieschema's | Alleen door OpenClaw onderhouden gebundelde plugins; nieuwe plugins moeten pluginlokale schema's definiëren |
  | `plugin-sdk/channel-config-schema-legacy` | Verouderde gebundelde configuratieschema's | Alleen compatibiliteitsalias; gebruik `plugin-sdk/bundled-channel-config-schema` voor onderhouden gebundelde plugins |
  | `plugin-sdk/telegram-command-config` | Hulpfuncties voor Telegram-opdrachtconfiguratie | Normalisatie van opdrachtnamen, inkorten van beschrijvingen, validatie van duplicaten/conflicten |
  | `plugin-sdk/channel-policy` | Beleidsresolutie voor groep/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Verouderde compatibiliteitsfacade | Gebruik `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Hulpfuncties voor inkomende enveloppen | Gedeelde route- + envelopbouwhulpfuncties |
  | `plugin-sdk/channel-inbound` | Hulpfuncties voor inkomende ontvangst | Contextopbouw, opmaak, roots, runners, voorbereide antwoordverzending en dispatchpredicaten |
  | `plugin-sdk/messaging-targets` | Verouderd importpad voor doelparsering | Gebruik `plugin-sdk/channel-targets` voor generieke hulpfuncties voor doelparsering, `plugin-sdk/channel-route` voor routevergelijking en plugin-eigen `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` voor provider-specifieke doelresolutie |
  | `plugin-sdk/outbound-media` | Hulpfuncties voor uitgaande media | Gedeeld laden van uitgaande media |
  | `plugin-sdk/outbound-send-deps` | Verouderde compatibiliteitsfacade | Gebruik `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Hulpfuncties voor levenscyclus van uitgaande berichten | Berichtadapters, ontvangstbewijzen, duurzame verzendhulpfuncties, livevoorbeeld-/streaminghulpfuncties, antwoordopties, levenscyclushulpfuncties, uitgaande identiteit en payloadplanning |
  | `plugin-sdk/channel-streaming` | Verouderde compatibiliteitsfacade | Gebruik `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Verouderde compatibiliteitsfacade | Gebruik `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Hulpfuncties voor threadbinding | Levenscyclus- en adapterhulpfuncties voor threadbinding |
  | `plugin-sdk/agent-media-payload` | Hulpfuncties voor verouderde mediapayloads | Bouwer voor agent-mediapayloads voor verouderde veldindelingen |
  | `plugin-sdk/channel-runtime` | Verouderde compatibiliteitslaag | Alleen verouderde kanaalruntimehulpmiddelen |
  | `plugin-sdk/channel-send-result` | Verzendresultaattypen | Antwoordresultaattypen |
  | `plugin-sdk/runtime-store` | Persistente Plugin-opslag | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Brede runtime-hulpfuncties | Runtime-/logging-/back-up-/Plugin-installatiehulpfuncties |
  | `plugin-sdk/runtime-env` | Smalle runtime-omgevingshulpfuncties | Logger-/runtime-omgeving, timeout-, retry- en backoff-hulpfuncties |
  | `plugin-sdk/plugin-runtime` | Gedeelde Plugin-runtimehulpfuncties | Plugin-opdrachten/-hooks/-HTTP-/interactieve hulpfuncties |
  | `plugin-sdk/hook-runtime` | Hulpfuncties voor hookpijplijnen | Gedeelde Webhook-/interne hookpijplijnhulpfuncties |
  | `plugin-sdk/lazy-runtime` | Luie runtime-hulpfuncties | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Proceshulpfuncties | Gedeelde uitvoeringshulpfuncties |
  | `plugin-sdk/cli-runtime` | CLI-runtimehulpfuncties | Opdrachtopmaak, wachttijden, versiehulpfuncties |
  | `plugin-sdk/gateway-runtime` | Gateway-hulpfuncties | Gateway-client, starthulpfunctie voor gereedheid van eventloop, resolutie van geadverteerde LAN-host en hulpfuncties voor kanaalstatuspatches |
  | `plugin-sdk/config-runtime` | Verouderde compatibiliteitslaag voor configuratie | Geef de voorkeur aan `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` en `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Hulpfuncties voor Telegram-opdrachten | Terugvalstabiele hulpfuncties voor validatie van Telegram-opdrachten wanneer het gebundelde Telegram-contractoppervlak niet beschikbaar is |
  | `plugin-sdk/approval-runtime` | Hulpfuncties voor goedkeuringsprompts | Payload voor goedkeuring van uitvoering/Plugin, hulpfuncties voor goedkeuringsmogelijkheden/-profielen, native routerings-/runtimehulpfuncties voor goedkeuringen en gestructureerde opmaak van weergavepaden voor goedkeuringen |
  | `plugin-sdk/approval-auth-runtime` | Hulpfuncties voor goedkeuringsauthenticatie | Oplossing van goedkeurders, autorisatie van acties in dezelfde chat |
  | `plugin-sdk/approval-client-runtime` | Hulpfuncties voor goedkeuringsclients | Native profiel-/filterhulpfuncties voor uitvoeringsgoedkeuring |
  | `plugin-sdk/approval-delivery-runtime` | Hulpfuncties voor goedkeuringslevering | Native mogelijkheid-/leveringsadapters voor goedkeuringen |
  | `plugin-sdk/approval-gateway-runtime` | Gateway-hulpfuncties voor goedkeuringen | Gedeelde hulpfunctie voor Gateway-resolutie van goedkeuringen |
  | `plugin-sdk/approval-handler-adapter-runtime` | Adapterhulpfuncties voor goedkeuringen | Lichtgewicht hulpfuncties voor het laden van native goedkeuringsadapters voor snelle kanaalingangspunten |
  | `plugin-sdk/approval-handler-runtime` | Handlerhulpfuncties voor goedkeuringen | Bredere runtime-hulpfuncties voor goedkeuringshandlers; geef de voorkeur aan de smallere adapter-/Gateway-randen wanneer die voldoende zijn |
  | `plugin-sdk/approval-native-runtime` | Doelhulpfuncties voor goedkeuringen | Native hulpfuncties voor goedkeuringsdoelen/accountbinding |
  | `plugin-sdk/approval-reply-runtime` | Antwoordhulpfuncties voor goedkeuringen | Hulpfuncties voor antwoordpayloads voor uitvoering-/Plugin-goedkeuringen |
  | `plugin-sdk/channel-runtime-context` | Hulpfuncties voor kanaalruntimecontext | Generieke hulpfuncties voor registreren/ophalen/bekijken van kanaalruntimecontext |
  | `plugin-sdk/security-runtime` | Beveiligingshulpfuncties | Gedeelde hulpfuncties voor vertrouwen, DM-poorten, root-begrensde bestanden/paden, externe content en geheimverzameling |
  | `plugin-sdk/ssrf-policy` | SSRF-beleidshulpfuncties | Hulpfuncties voor toegestane-hostlijst en privé-netwerkbeleid |
  | `plugin-sdk/ssrf-runtime` | SSRF-runtimehulpfuncties | Vastgepinde dispatcher, bewaakte fetch, SSRF-beleidshulpfuncties |
  | `plugin-sdk/system-event-runtime` | Hulpfuncties voor systeemgebeurtenissen | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat-hulpfuncties | Hulpfuncties voor Heartbeat-wake, gebeurtenis en zichtbaarheid |
  | `plugin-sdk/delivery-queue-runtime` | Hulpfuncties voor leveringswachtrijen | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Hulpfuncties voor kanaalactiviteit | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Dedupe-hulpfuncties | In-memory en persistentie-ondersteunde dedupe-caches |
  | `plugin-sdk/file-access-runtime` | Hulpfuncties voor bestandstoegang | Hulpfuncties voor veilige lokale bestands-/mediapaden |
  | `plugin-sdk/transport-ready-runtime` | Hulpfuncties voor transportgereedheid | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Beleidshulpfuncties voor uitvoeringsgoedkeuring | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Hulpfuncties voor begrensde caches | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Hulpfuncties voor diagnostische poorten | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hulpfuncties voor foutopmaak | `formatUncaughtError`, `isApprovalNotFoundError`, hulpfuncties voor foutgrafen |
  | `plugin-sdk/fetch-runtime` | Hulpfuncties voor ingepakte fetch/proxy | `resolveFetch`, proxyhulpfuncties, optiehulpfuncties voor EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Hulpfuncties voor hostnormalisatie | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Retry-hulpfuncties | `RetryConfig`, `retryAsync`, beleidsrunners |
  | `plugin-sdk/allow-from` | Opmaak van toegestane lijsten en invoermapping | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Hulpfuncties voor opdrachtpoorten en opdrachtoppervlakken | `resolveControlCommandGate`, hulpfuncties voor afzenderautorisatie, hulpfuncties voor opdrachtregisters inclusief opmaak van dynamische argumentmenu's |
  | `plugin-sdk/command-status` | Renderers voor opdrachtstatus/-hulp | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsering van geheime invoer | Hulpfuncties voor geheime invoer |
  | `plugin-sdk/webhook-ingress` | Hulpfuncties voor Webhook-verzoeken | Hulpmiddelen voor Webhook-doelen |
  | `plugin-sdk/webhook-request-guards` | Guard-hulpfuncties voor Webhook-body's | Hulpfuncties voor lezen/beperken van requestbody's |
  | `plugin-sdk/reply-runtime` | Gedeelde antwoordruntime | Inkomende dispatch, Heartbeat, antwoordplanner, opdelen in chunks |
  | `plugin-sdk/reply-dispatch-runtime` | Smalle hulpfuncties voor antwoorddispatch | Afronden, providerdispatch en hulpfuncties voor gesprekslabels |
  | `plugin-sdk/reply-history` | Hulpfuncties voor antwoordgeschiedenis | `createChannelHistoryWindow`; verouderde compatibiliteitsexports voor maphulpfuncties zoals `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` en `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planning van antwoordverwijzingen | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Hulpfuncties voor antwoordchunks | Hulpfuncties voor opdelen van tekst/markdown in chunks |
  | `plugin-sdk/session-store-runtime` | Hulpfuncties voor sessiestores | Storepad + hulpfuncties voor bijgewerkt-op |
  | `plugin-sdk/state-paths` | Hulpfuncties voor statuspaden | Hulpfuncties voor status- en OAuth-mappen |
  | `plugin-sdk/routing` | Routing-/sessiesleutelhulpfuncties | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, hulpfuncties voor sessiesleutelnormalisatie |
  | `plugin-sdk/status-helpers` | Hulpfuncties voor kanaalstatus | Bouwers voor kanaal-/accountstatussamenvattingen, standaardwaarden voor runtimestatus, hulpfuncties voor probleemmetadata |
  | `plugin-sdk/target-resolver-runtime` | Hulpfuncties voor doelresolver | Gedeelde hulpfuncties voor doelresolver |
  | `plugin-sdk/string-normalization-runtime` | Hulpfuncties voor tekenreeksnormalisatie | Hulpfuncties voor slug-/tekenreeksnormalisatie |
  | `plugin-sdk/request-url` | Hulpfuncties voor aanvraag-URL's | Tekenreeks-URL's extraheren uit aanvraagachtige invoer |
  | `plugin-sdk/run-command` | Hulpfuncties voor getimede opdrachten | Getimede opdrachtuitvoerder met genormaliseerde stdout/stderr |
  | `plugin-sdk/param-readers` | Parameterlezers | Algemene parameterlezers voor tools/CLI |
  | `plugin-sdk/tool-payload` | Extractie van toolpayload | Genormaliseerde payloads extraheren uit toolresultaatobjecten |
  | `plugin-sdk/tool-send` | Extractie van toolverzending | Canonieke velden voor verzenddoelen extraheren uit toolargumenten |
  | `plugin-sdk/temp-path` | Hulpfuncties voor tijdelijke paden | Gedeelde hulpfuncties voor tijdelijke downloadpaden |
  | `plugin-sdk/logging-core` | Loghulpfuncties | Subsystemlogger en redactiehulpfuncties |
  | `plugin-sdk/markdown-table-runtime` | Hulpfuncties voor Markdown-tabellen | Hulpfuncties voor Markdown-tabelmodi |
  | `plugin-sdk/reply-payload` | Typen voor berichtantwoorden | Typen voor antwoordpayloads |
  | `plugin-sdk/provider-setup` | Samengestelde hulpfuncties voor lokale/zelfgehoste providerinstelling | Hulpfuncties voor ontdekking/configuratie van zelfgehoste providers |
  | `plugin-sdk/self-hosted-provider-setup` | Gerichte hulpfuncties voor OpenAI-compatibele zelfgehoste providerinstelling | Dezelfde hulpfuncties voor ontdekking/configuratie van zelfgehoste providers |
  | `plugin-sdk/provider-auth-runtime` | Hulpfuncties voor providerruntime-authenticatie | Hulpfuncties voor runtime-resolutie van API-sleutels |
  | `plugin-sdk/provider-auth-api-key` | Hulpfuncties voor provider-API-sleutelinstelling | Hulpfuncties voor API-sleutelonboarding/profielschrijven |
  | `plugin-sdk/provider-auth-result` | Hulpfuncties voor provider-auth-resultaten | Standaardbouwer voor OAuth-auth-resultaten |
  | `plugin-sdk/provider-selection-runtime` | Hulpfuncties voor providerselectie | Selectie van geconfigureerde of automatische provider en samenvoeging van onbewerkte providerconfiguratie |
  | `plugin-sdk/provider-env-vars` | Hulpfuncties voor provideromgevingsvariabelen | Hulpfuncties voor het opzoeken van provider-authenticatieomgevingsvariabelen |
  | `plugin-sdk/provider-model-shared` | Gedeelde hulpfuncties voor providermodel/herhaling | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gedeelde bouwers voor herhalingsbeleid, hulpfuncties voor provider-eindpunten en hulpfuncties voor model-id-normalisatie |
  | `plugin-sdk/provider-catalog-shared` | Gedeelde hulpfuncties voor providercatalogus | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches voor provideronboarding | Hulpfuncties voor onboardingconfiguratie |
  | `plugin-sdk/provider-http` | Provider-HTTP-hulpfuncties | Algemene hulpfuncties voor provider-HTTP/eindpuntmogelijkheden, inclusief hulpfuncties voor multipartformulieren voor audiotranscriptie |
  | `plugin-sdk/provider-web-fetch` | Hulpfuncties voor provider-webfetch | Hulpfuncties voor registratie/cache van webfetchproviders |
  | `plugin-sdk/provider-web-search-config-contract` | Hulpfuncties voor provider-webzoekconfiguratie | Smalle webzoekconfiguratie-/referentiehulpfuncties voor providers die geen Plugin-inschakelbedrading nodig hebben |
  | `plugin-sdk/provider-web-search-contract` | Hulpfuncties voor provider-webzoekcontract | Smalle webzoekconfiguratie-/referentiecontracthulpfuncties zoals `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` en scoped setters/getters voor referenties |
  | `plugin-sdk/provider-web-search` | Hulpfuncties voor provider-webzoek | Hulpfuncties voor registratie/cache/runtime van webzoekproviders |
  | `plugin-sdk/provider-tools` | Hulpfuncties voor provider-tool-/schemacompatibiliteit | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` en opschoning + diagnostiek voor DeepSeek/Gemini/OpenAI-schema's |
  | `plugin-sdk/provider-usage` | Hulpfuncties voor providergebruik | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` en andere hulpfuncties voor providergebruik |
  | `plugin-sdk/provider-stream` | Hulpfuncties voor providerstreamwrappers | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typen voor streamwrappers en gedeelde wrapperhulpfuncties voor Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Hulpfuncties voor providertransport | Native providertransporthulpfuncties zoals bewaakte fetch, tekstextractie van toolresultaten, transportberichttransformaties en schrijfbare transportgebeurtenisstreams |
  | `plugin-sdk/keyed-async-queue` | Geordende async-wachtrij | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Gedeelde mediahulpfuncties | Hulpfuncties voor media ophalen/transformeren/opslaan, door ffprobe ondersteunde detectie van videodimensies en bouwers voor mediapayloads |
  | `plugin-sdk/media-generation-runtime` | Gedeelde hulpfuncties voor mediageneratie | Gedeelde failoverhulpfuncties, kandidaatselectie en meldingen voor ontbrekende modellen voor beeld-/video-/muziekgeneratie |
  | `plugin-sdk/media-understanding` | Hulpfuncties voor mediabegrip | Providertypen voor mediabegrip plus providergerichte exports van beeld-/audiohulpfuncties |
  | `plugin-sdk/text-runtime` | Verouderde brede export voor tekstcompatibiliteit | Gebruik `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` en `logging-core` |
  | `plugin-sdk/text-chunking` | Hulpfuncties voor tekstopdeling | Hulpfunctie voor uitgaande tekstopdeling |
  | `plugin-sdk/speech` | Spraakhulpfuncties | Spraakprovidertypen plus providergerichte hulpfuncties voor richtlijnen, register, validatie en OpenAI-compatibele TTS-bouwer |
  | `plugin-sdk/speech-core` | Gedeelde spraakkern | Spraakprovidertypen, register, richtlijnen, normalisatie |
  | `plugin-sdk/realtime-transcription` | Hulpfuncties voor realtime transcriptie | Providertypen, registerhulpfuncties en gedeelde WebSocket-sessiehulpfunctie |
  | `plugin-sdk/realtime-voice` | Hulpfuncties voor realtime spraak | Providertypen, register-/resolutiehulpfuncties, brugsessiehulpfuncties, gedeelde terugspreekwachtrijen voor agents, spraakbesturing voor actieve runs, gezondheid van transcript/gebeurtenissen, echo-onderdrukking, matching van consultvragen, coördinatie van geforceerde consults, tracking van beurtcontext, tracking van uitvoeractiviteit en snelle contextconsult-hulpfuncties |
  | `plugin-sdk/image-generation` | Hulpfuncties voor beeldgeneratie | Providertypen voor beeldgeneratie plus hulpfuncties voor beeldassets/data-URL's en de OpenAI-compatibele beeldproviderbouwer |
  | `plugin-sdk/image-generation-core` | Gedeelde kern voor beeldgeneratie | Typen voor beeldgeneratie, failover, authenticatie en registerhulpfuncties |
  | `plugin-sdk/music-generation` | Hulpfuncties voor muziekgeneratie | Provider-/aanvraag-/resultaattypen voor muziekgeneratie |
  | `plugin-sdk/music-generation-core` | Gedeelde kern voor muziekgeneratie | Typen voor muziekgeneratie, failoverhulpfuncties, provideropzoeking en model-ref-parsing |
  | `plugin-sdk/video-generation` | Hulpfuncties voor videogeneratie | Provider-/aanvraag-/resultaattypen voor videogeneratie |
  | `plugin-sdk/video-generation-core` | Gedeelde kern voor videogeneratie | Typen voor videogeneratie, failoverhulpfuncties, provideropzoeking en model-ref-parsing |
  | `plugin-sdk/interactive-runtime` | Hulpfuncties voor interactieve antwoorden | Normalisatie/reductie van interactieve antwoordpayloads |
  | `plugin-sdk/channel-config-primitives` | Primitieven voor kanaalconfiguratie | Smalle primitieve waarden voor kanaalconfiguratieschema's |
  | `plugin-sdk/channel-config-writes` | Hulpfuncties voor schrijven van kanaalconfiguratie | Hulpfuncties voor autorisatie van schrijven naar kanaalconfiguratie |
  | `plugin-sdk/channel-plugin-common` | Gedeelde kanaalprelude | Gedeelde prelude-exports voor kanaal-Plugins |
  | `plugin-sdk/channel-status` | Hulpfuncties voor kanaalstatus | Gedeelde hulpfuncties voor kanaalstatussnapshots/-samenvattingen |
  | `plugin-sdk/allowlist-config-edit` | Hulpfuncties voor allowlistconfiguratie | Hulpfuncties voor bewerken/lezen van allowlistconfiguratie |
  | `plugin-sdk/group-access` | Hulpfuncties voor groepstoegang | Gedeelde beslissingshulpfuncties voor groepstoegang |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Verouderde compatibiliteitsfacades | Gebruik `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Hulpfuncties voor Direct-DM-bewaking | Smalle beleidshelpers voor bewaking vóór crypto |
  | `plugin-sdk/extension-shared` | Gedeelde extensiehulpfuncties | Primitieven voor passief kanaal/status en ambient-proxyhulpfuncties |
  | `plugin-sdk/webhook-targets` | Hulpfuncties voor Webhook-doelen | Webhook-doelregister en hulpfuncties voor route-installatie |
  | `plugin-sdk/webhook-path` | Verouderde alias voor Webhook-pad | Gebruik `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Gedeelde webmediahulpfuncties | Hulpfuncties voor laden van externe/lokale media |
  | `plugin-sdk/zod` | Verouderde herexport voor Zod-compatibiliteit | Importeer `zod` rechtstreeks uit `zod` |
  | `plugin-sdk/memory-core` | Gebundelde memory-core-hulpfuncties | Hulpoppervlak voor geheugenbeheerder/configuratie/bestand/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Runtimefacade voor geheugenengine | Runtimefacade voor geheugenindex/-zoekfunctie |
  | `plugin-sdk/memory-core-host-embedding-registry` | Register voor geheugenembeddings | Lichtgewicht registerhulpfuncties voor provider van geheugenembeddings |
  | `plugin-sdk/memory-core-host-engine-foundation` | Geheugenhost-foundation-engine | Exports voor geheugenhost-foundation-engine |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Geheugenhost-embeddingengine | Contracten voor geheugenembeddings, registertoegang, lokale provider en algemene batch-/externe hulpfuncties; concrete externe providers staan in hun eigen Plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | Geheugenhost-QMD-engine | Exports voor geheugenhost-QMD-engine |
  | `plugin-sdk/memory-core-host-engine-storage` | Opslagengine voor geheugenhost | Exports voor opslagengine van geheugenhost |
  | `plugin-sdk/memory-core-host-multimodal` | Multimodale hulpfuncties voor geheugenhost | Multimodale hulpfuncties voor geheugenhost |
  | `plugin-sdk/memory-core-host-query` | Queryhulpfuncties voor geheugenhost | Queryhulpfuncties voor geheugenhost |
  | `plugin-sdk/memory-core-host-secret` | Geheimhulpfuncties voor geheugenhost | Geheimhulpfuncties voor geheugenhost |
  | `plugin-sdk/memory-core-host-events` | Verouderde alias voor geheugengebeurtenissen | Gebruik `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Statushulpfuncties voor geheugenhost | Statushulpfuncties voor geheugenhost |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI-runtime voor geheugenhost | Hulpfuncties voor CLI-runtime van geheugenhost |
  | `plugin-sdk/memory-core-host-runtime-core` | Kernruntime voor geheugenhost | Hulpfuncties voor kernruntime van geheugenhost |
  | `plugin-sdk/memory-core-host-runtime-files` | Bestands-/runtimehulpfuncties voor geheugenhost | Bestands-/runtimehulpfuncties voor geheugenhost |
  | `plugin-sdk/memory-host-core` | Alias voor kernruntime van geheugenhost | Leverancieronafhankelijke alias voor hulpfuncties van kernruntime van geheugenhost |
  | `plugin-sdk/memory-host-events` | Alias voor gebeurtenisjournaal van geheugenhost | Leverancieronafhankelijke alias voor hulpfuncties van gebeurtenisjournaal van geheugenhost |
  | `plugin-sdk/memory-host-files` | Verouderde alias voor geheugenbestand/-runtime | Gebruik `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Hulpfuncties voor beheerde Markdown | Gedeelde hulpfuncties voor beheerde Markdown voor geheugenverwante Plugins |
  | `plugin-sdk/memory-host-search` | Active Memory-zoekfacade | Luie runtimefacade voor Active Memory-zoekbeheerder |
  | `plugin-sdk/memory-host-status` | Verouderde alias voor geheugenhoststatus | Gebruik `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Testhulpmiddelen | Repo-lokale verouderde compatibiliteitsbarrel; gebruik gerichte repo-lokale testsubpaden zoals `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` en `plugin-sdk/test-fixtures` |
</Accordion>

Deze tabel is bewust de gemeenschappelijke migratiesubset, niet het volledige SDK-
oppervlak. De inventaris van compiler-entrypoints staat in
`scripts/lib/plugin-sdk-entrypoints.json`; package-exports worden gegenereerd uit
de publieke subset.

Gereserveerde helper-seams voor gebundelde Plugins zijn uit de publieke SDK-
exportmap gehaald, behalve expliciet gedocumenteerde compatibiliteitsfacades zoals de
verouderde `plugin-sdk/discord`-shim die behouden blijft voor het gepubliceerde
pakket `@openclaw/discord@2026.3.13`. Eigenaarsspecifieke helpers staan binnen het
eigenaarspakket van de Plugin; gedeeld hostgedrag moet via generieke SDK-
contracten lopen, zoals `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`
en `plugin-sdk/plugin-config-runtime`.

Gebruik de smalste import die bij de taak past. Als je geen export kunt vinden,
controleer dan de bron in `src/plugin-sdk/` of vraag maintainers welk generiek contract
er eigenaar van moet zijn.

## Actieve deprecaties

Smalere deprecaties die gelden voor de plugin-SDK, het providercontract,
runtime-oppervlak en manifest. Ze werken vandaag nog allemaal, maar worden in
een toekomstige major release verwijderd. De vermelding onder elk item koppelt de oude API
aan de canonieke vervanging.

<AccordionGroup>
  <Accordion title="command-auth-helpbuilders → command-status">
    **Oud (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nieuw (`openclaw/plugin-sdk/command-status`)**: dezelfde signatures, dezelfde
    exports - alleen geïmporteerd vanuit het smallere subpad. `command-auth`
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

    **Nieuw**: `resolveInboundMentionDecision({ facts, policy })` - retourneert één
    beslissingsobject in plaats van twee gesplitste calls.

    Downstream channel-Plugins (Slack, Discord, Matrix, MS Teams) zijn al
    overgestapt.

  </Accordion>

  <Accordion title="Channel-runtime-shim en channel-actionshelpers">
    `openclaw/plugin-sdk/channel-runtime` is een compatibiliteitsshim voor oudere
    channel-Plugins. Importeer dit niet vanuit nieuwe code; gebruik
    `openclaw/plugin-sdk/channel-runtime-context` voor het registreren van runtime-
    objecten.

    `channelActions*`-helpers in `openclaw/plugin-sdk/channel-actions` zijn
    verouderd naast ruwe "actions"-channel-exports. Stel capabilities
    in plaats daarvan beschikbaar via het semantische `presentation`-oppervlak -
    channel-Plugins declareren wat ze renderen (cards, buttons, selects) in plaats van welke ruwe
    action-namen ze accepteren.

  </Accordion>

  <Accordion title="Webzoekprovider-tool()-helper → createTool() op de Plugin">
    **Oud**: `tool()`-factory uit `openclaw/plugin-sdk/provider-web-search`.

    **Nieuw**: implementeer `createTool(...)` rechtstreeks op de provider-Plugin.
    OpenClaw heeft de SDK-helper niet langer nodig om de tool-wrapper te registreren.

  </Accordion>

  <Accordion title="Plaintext-channel-envelopes → BodyForAgent">
    **Oud**: `formatInboundEnvelope(...)` (en
    `ChannelMessageForAgent.channelEnvelope`) om een platte plaintext prompt-
    envelope te bouwen uit inkomende channel-berichten.

    **Nieuw**: `BodyForAgent` plus gestructureerde gebruikerscontextblokken. Channel-
    Plugins koppelen routeringsmetadata (thread, topic, reply-to, reactions) als
    getypeerde velden in plaats van ze samen te voegen tot een promptstring. De
    helper `formatAgentEnvelope(...)` wordt nog steeds ondersteund voor gesynthetiseerde
    assistant-facing envelopes, maar inkomende plaintext-envelopes worden
    uitgefaseerd.

    Betrokken gebieden: `inbound_claim`, `message_received` en elke aangepaste
    channel-Plugin die `channelEnvelope`-tekst nabewerkte.

  </Accordion>

  <Accordion title="deactivate-hook → gateway_stop">
    **Oud**: `api.on("deactivate", handler)`.

    **Nieuw**: `api.on("gateway_stop", handler)`. De event en context zijn hetzelfde
    shutdown-cleanupcontract; alleen de hooknaam verandert.

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

    `deactivate` blijft tot na 2026-08-16 gekoppeld als een verouderde
    compatibiliteitsalias.

  </Accordion>

  <Accordion title="subagent_spawning-hook → core-threadbinding">
    **Oud**: `api.on("subagent_spawning", handler)` retourneert
    `threadBindingReady` of `deliveryOrigin`.

    **Nieuw**: laat core `thread: true`-subagentbindings voorbereiden via de
    channel session-bindingadapter. Gebruik `api.on("subagent_spawned", handler)`
    alleen voor observatie na de start.

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
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` blijven alleen bestaan als
    verouderde compatibiliteitsoppervlakken terwijl externe Plugins migreren.

  </Accordion>

  <Accordion title="Provider-discoverytypes → provider-catalogustypes">
    Vier discovery-typealiases zijn nu dunne wrappers rond de
    catalog-era types:

    | Oude alias                | Nieuw type                |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Plus de verouderde statische `ProviderCapabilities`-bag - provider-Plugins
    moeten expliciete providerhooks gebruiken, zoals `buildReplayPolicy`,
    `normalizeToolSchemas` en `wrapStreamFn`, in plaats van een statisch object.

  </Accordion>

  <Accordion title="Thinking-policyhooks → resolveThinkingProfile">
    **Oud** (drie afzonderlijke hooks op `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` en
    `resolveDefaultThinkingLevel(ctx)`.

    **Nieuw**: één `resolveThinkingProfile(ctx)` die een
    `ProviderThinkingProfile` retourneert met de canonieke `id`, optionele `label` en
    gerangschikte niveaulijst. OpenClaw verlaagt verouderde opgeslagen waarden automatisch
    op basis van profielrang.

    De context bevat `provider`, `modelId`, optioneel samengevoegde `reasoning`
    en optioneel samengevoegde model-`compat`-feiten. Provider-Plugins kunnen die
    catalogusfeiten gebruiken om een modelspecifiek profiel alleen beschikbaar te stellen wanneer het geconfigureerde
    requestcontract dit ondersteunt.

    Implementeer één hook in plaats van drie. De legacy hooks blijven werken tijdens
    de deprecationperiode, maar worden niet gecombineerd met het profielresultaat.

  </Accordion>

  <Accordion title="Externe authproviders → contracts.externalAuthProviders">
    **Oud**: externe authhooks implementeren zonder de provider
    in het Plugin-manifest te declareren.

    **Nieuw**: declareer `contracts.externalAuthProviders` in het Plugin-manifest
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
    op het manifest. Dit consolideert setup/status-env-metadata op één
    plek en voorkomt dat de Plugin-runtime alleen hoeft te starten om env-var-
    lookups te beantwoorden.

    `providerAuthEnvVars` blijft ondersteund via een compatibiliteitsadapter
    totdat de deprecationperiode sluit.

  </Accordion>

  <Accordion title="Memory-Pluginregistratie → registerMemoryCapability">
    **Oud**: drie afzonderlijke calls -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nieuw**: één call op de memory-state-API -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Dezelfde slots, één registratiecall. Additieve prompt- en corpushelpers
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) worden
    niet beïnvloed.

  </Accordion>

  <Accordion title="Memory-embeddingprovider-API">
    **Oud**: `api.registerMemoryEmbeddingProvider(...)` plus
    `contracts.memoryEmbeddingProviders`.

    **Nieuw**: `api.registerEmbeddingProvider(...)` plus
    `contracts.embeddingProviders`.

    Het generieke embeddingprovidercontract is buiten memory herbruikbaar en is
    het ondersteunde pad voor nieuwe providers. De memory-specifieke registratie-API
    blijft gekoppeld als verouderde compatibiliteit terwijl bestaande providers migreren.
    Plugin-inspectie rapporteert niet-gebundeld gebruik als compatibiliteitsschuld.

  </Accordion>

  <Accordion title="Subagent-sessionberichttypes hernoemd">
    Twee legacy typealiases worden nog steeds geëxporteerd uit `src/plugins/runtime/types.ts`:

    | Oud                           | Nieuw                           |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    De runtimemethode `readSession` is verouderd ten gunste van
    `getSessionMessages`. Dezelfde signature; de oude methode roept door naar de
    nieuwe.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Oud**: `runtime.tasks.flow` (enkelvoud) retourneerde een live task-flow-accessor.

    **Nieuw**: `runtime.tasks.managedFlows` behoudt de beheerde TaskFlow-mutatie-
    runtime voor Plugins die child-taken vanuit een flow maken, bijwerken, annuleren of uitvoeren.
    Gebruik `runtime.tasks.flows` wanneer de Plugin alleen DTO-gebaseerde reads nodig heeft.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Ingebedde extensiefactories → agent tool-result-middleware">
    Behandeld in "Migreren → Ingebedde tool-result-extensies migreren naar
    middleware" hierboven. Hier opgenomen voor volledigheid: het verwijderde embedded-runner-only
    pad `api.registerEmbeddedExtensionFactory(...)` wordt vervangen door
    `api.registerAgentToolResultMiddleware(...)` met een expliciete runtimelijst
    in `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="OpenClawSchemaType-alias → OpenClawConfig">
    `OpenClawSchemaType`, opnieuw geëxporteerd vanuit `openclaw/plugin-sdk`, is nu een
    alias van één regel voor `OpenClawConfig`. Geef de voorkeur aan de canonieke naam.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Deprecaties op extensieniveau (binnen gebundelde channel/provider-Plugins onder
`extensions/`) worden bijgehouden in hun eigen `api.ts`- en `runtime-api.ts`-
barrels. Ze hebben geen invloed op Plugin-contracten van derden en worden hier niet
vermeld. Als je de lokale barrel van een gebundelde Plugin rechtstreeks gebruikt, lees dan de
deprecationcomments in die barrel voordat je upgradet.
</Note>

## Verwijderingstijdlijn

| Wanneer                | Wat er gebeurt                                                         |
| ---------------------- | ---------------------------------------------------------------------- |
| **Nu**                 | Verouderde oppervlakken geven runtime-waarschuwingen                   |
| **Volgende major release** | Verouderde oppervlakken worden verwijderd; plugins die ze nog gebruiken falen |

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
- [SDK-overzicht](/nl/plugins/sdk-overview) - volledige importreferentie voor subpaden
- [Kanaalplugins](/nl/plugins/sdk-channel-plugins) - kanaalplugins bouwen
- [Provider-plugins](/nl/plugins/sdk-provider-plugins) - provider-plugins bouwen
- [Plugin-internals](/nl/plugins/architecture) - diepgaande architectuurverkenning
- [Pluginmanifest](/nl/plugins/manifest) - referentie voor manifestschema
