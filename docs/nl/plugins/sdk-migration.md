---
read_when:
    - Je ziet de waarschuwing OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - U ziet de waarschuwing OPENCLAW_EXTENSION_API_DEPRECATED
    - Je gebruikte api.registerEmbeddedExtensionFactory vóór OpenClaw 2026.4.25
    - Je werkt een plugin bij naar de moderne plugin-architectuur
    - Je onderhoudt een externe OpenClaw-Plugin
sidebarTitle: Migrate to SDK
summary: Migreer van de verouderde achterwaartse-compatibiliteitslaag naar de moderne plugin-SDK
title: Plugin SDK-migratie
x-i18n:
    generated_at: "2026-06-27T18:06:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9061b31567cbd24196458ecb9af1cb1b0351f789a136ea26951c8fb7e576cf08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw is overgestapt van een brede laag voor achterwaartse compatibiliteit naar een moderne Plugin-
architectuur met gerichte, gedocumenteerde imports. Als je Plugin is gebouwd vóór
de nieuwe architectuur, helpt deze gids je met migreren.

## Wat verandert er

Het oude Plugin-systeem bood twee wijd open interfaces waarmee plugins alles
wat ze nodig hadden vanuit één ingangspunt konden importeren:

- **`openclaw/plugin-sdk/compat`** - één import die tientallen helpers opnieuw
  exporteerde. Deze werd geïntroduceerd om oudere hook-gebaseerde plugins werkend
  te houden terwijl de nieuwe Plugin-architectuur werd gebouwd.
- **`openclaw/plugin-sdk/infra-runtime`** - een brede runtime-helperbarrel die
  systeemgebeurtenissen, Heartbeat-status, afleverwachtrijen, fetch-/proxyhelpers,
  bestandshelpers, goedkeuringstypen en niet-gerelateerde hulpprogramma's combineerde.
- **`openclaw/plugin-sdk/config-runtime`** - een brede config-compatibiliteitsbarrel
  die tijdens de migratieperiode nog verouderde directe laad-/schrijfhelpers bevat.
- **`openclaw/extension-api`** - een brug die plugins directe toegang gaf tot
  host-side helpers zoals de ingebedde agent-runner.
- **`api.registerEmbeddedExtensionFactory(...)`** - een verwijderde, alleen voor embedded-runner bedoelde meegeleverde
  extension-hook die embedded-runner-gebeurtenissen zoals
  `tool_result` kon observeren.

De brede importinterfaces zijn nu **verouderd**. Ze werken nog steeds tijdens runtime,
maar nieuwe plugins mogen ze niet gebruiken, en bestaande plugins moeten migreren voordat
de volgende major release ze verwijdert. De API voor registratie van extension factories
die alleen voor embedded-runner bedoeld was, is verwijderd; gebruik in plaats daarvan tool-result-middleware.

OpenClaw verwijdert of herinterpreteert geen gedocumenteerd Plugin-gedrag in dezelfde
wijziging die een vervanging introduceert. Contractbrekende wijzigingen moeten eerst
via een compatibiliteitsadapter, diagnostiek, documentatie en een deprecatievenster lopen.
Dat geldt voor SDK-imports, manifestvelden, setup-API's, hooks en runtime-
registratiegedrag.

<Warning>
  De laag voor achterwaartse compatibiliteit wordt in een toekomstige major release verwijderd.
  Plugins die dan nog steeds vanuit deze interfaces importeren, zullen breken wanneer dat gebeurt.
  Legacy embedded extension factory-registraties worden nu al niet meer geladen.
</Warning>

## Waarom dit is gewijzigd

De oude aanpak veroorzaakte problemen:

- **Trage startup** - het importeren van één helper laadde tientallen niet-gerelateerde modules
- **Circulaire dependencies** - brede herexports maakten het makkelijk om importcycli te maken
- **Onduidelijk API-oppervlak** - er was geen manier om te zien welke exports stabiel waren en welke intern

De moderne Plugin-SDK lost dit op: elk importpad (`openclaw/plugin-sdk/\<subpath\>`)
is een kleine, zelfstandige module met een duidelijk doel en gedocumenteerd contract.

Legacy provider-convenience-seams voor meegeleverde kanalen zijn ook verdwenen.
Kanaalgebrande helper-seams waren private mono-repo-snelkoppelingen, geen stabiele
Plugin-contracten. Gebruik in plaats daarvan smalle generieke SDK-subpaden. Houd binnen de meegeleverde
Plugin-workspace provider-eigen helpers in de eigen `api.ts` of
`runtime-api.ts` van die Plugin.

Huidige voorbeelden van meegeleverde providers:

- Anthropic houdt Claude-specifieke streamhelpers in zijn eigen `api.ts` /
  `contract-api.ts`-seam
- OpenAI houdt provider-builders, default-model-helpers en realtime provider-
  builders in zijn eigen `api.ts`
- OpenRouter houdt provider-builder- en onboarding-/confighelpers in zijn eigen
  `api.ts`

## Migratieplan voor Talk en realtime spraak

Realtime spraak-, telefonie-, vergader- en browser-Talk-code verhuist van
surface-lokale turn-boekhouding naar een gedeelde Talk-sessiecontroller die wordt geëxporteerd door
`openclaw/plugin-sdk/realtime-voice`. De nieuwe controller beheert de gemeenschappelijke Talk-
eventenvelope, actieve turn-status, capture-status, output-audio-status, recente
eventgeschiedenis en afwijzing van stale turns. Provider-plugins moeten vendor-specifieke
realtime sessies blijven beheren; surface-plugins moeten capture,
playback, telefonie en vergaderafwijkingen blijven beheren.

Deze Talk-migratie is bewust brekend-schoon:

1. Houd de gedeelde controller-/runtime-primitieven in
   `plugin-sdk/realtime-voice`.
2. Verplaats meegeleverde surfaces naar de gedeelde controller: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime en native push-to-talk.
3. Vervang oude Talk RPC-families door de definitieve `talk.session.*`- en
   `talk.client.*`-API.
4. Adverteer één live Talk-eventkanaal in Gateway
   `hello-ok.features.events`: `talk.event`.
5. Verwijder het oude realtime HTTP-endpoint en elk pad voor request-time instruction
   overrides.

Nieuwe code moet `createTalkEventSequencer(...)` niet rechtstreeks aanroepen, tenzij die
een low-level adapter of testfixture implementeert. Geef de voorkeur aan de gedeelde controller,
zodat turn-scoped events niet zonder turn-id kunnen worden uitgezonden, stale `turnEnd`- /
`turnCancel`-aanroepen geen nieuwere actieve turn kunnen wissen, en lifecycle-
events voor output-audio consistent blijven in telefonie, vergaderingen, browser relay, managed-room
handoff en native Talk-clients.

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

Browser-owned WebRTC-/provider-websocket-sessies gebruiken `talk.client.create`,
omdat de browser eigenaar is van de provideronderhandeling en het mediatransport, terwijl de
Gateway eigenaar is van credentials, instructies en toolbeleid. `talk.session.*` is de
gemeenschappelijke door Gateway beheerde surface voor gateway-relay realtime, gateway-relay-
transcriptie en managed-room native STT-/TTS-sessies.

Legacy configs die realtime-selectors naast `talk.provider` /
`talk.providers` plaatsten, moeten worden gerepareerd met `openclaw doctor --fix`; runtime Talk
herinterpreteert speech-/TTS-providerconfig niet als realtime providerconfig.

De ondersteunde `talk.session.create`-combinaties zijn bewust klein:

| Modus           | Transport       | Brain           | Eigenaar           | Opmerkingen                                                                                                        |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Full-duplex provider-audio via de Gateway gebridged; toolaanroepen worden via de agent-consult-tool gerouteerd.    |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Alleen streaming STT; callers sturen invoeraudio en ontvangen transcript-events.                                  |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client-room | Push-to-talk- en walkie-talkie-achtige rooms waarin de client capture/playback beheert en de Gateway turn-status beheert. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client-room | Roommodus alleen voor beheerders voor vertrouwde first-party surfaces die Gateway-toolacties direct uitvoeren.     |

Verwijderde methodemap:

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

De uniforme control-vocabulaire is ook bewust smal:

  | Methode                         | Van toepassing op                                      | Contract                                                                                                                                                                                                |
  | ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Voeg een base64 PCM-audiochunk toe aan de providersessie die eigendom is van dezelfde Gateway-verbinding.                                                                                                |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Start een gebruikersbeurt voor een beheerde ruimte.                                                                                                                                                     |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Beëindig de actieve beurt na stale-turn-validatie.                                                                                                                                                      |
  | `talk.session.cancelTurn`       | alle door Gateway beheerde sessies                      | Annuleer actieve opname-, provider-, agent- en TTS-werkzaamheden voor een beurt.                                                                                                                        |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Stop de audio-uitvoer van de assistent zonder noodzakelijkerwijs de gebruikersbeurt te beëindigen.                                                                                                      |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Voltooi een provider-toolaanroep die door de relay is uitgezonden; geef `options.willContinue` door voor tussentijdse uitvoer of `options.suppressResponse` om de aanroep af te handelen zonder nog een assistentantwoord. |
  | `talk.session.steer`            | agent-ondersteunde Talk-sessies                         | Stuur gesproken `status`-, `steer`-, `cancel`- of `followup`-besturing naar de actieve ingebedde run die vanuit de Talk-sessie is opgelost.                                                             |
  | `talk.session.close`            | alle uniforme sessies                                   | Stop relay-sessies of trek de beheerde-ruimte-status in en vergeet daarna de uniforme sessie-id.                                                                                                        |

  Introduceer geen speciale provider- of platformgevallen in core om dit te laten werken.
  Core beheert de semantiek van Talk-sessies. Providerplugins beheren het instellen van leverancierssessies.
  Voice-call en Google Meet beheren telefonie-/vergaderadapters. Browser- en native
  apps beheren de UX voor apparaatopname en -weergave.

  ## Compatibiliteitsbeleid

  Voor externe plugins volgt compatibiliteitswerk deze volgorde:

  1. voeg het nieuwe contract toe
  2. houd het oude gedrag verbonden via een compatibiliteitsadapter
  3. geef een diagnose of waarschuwing uit die het oude pad en de vervanging noemt
  4. dek beide paden af in tests
  5. documenteer de afschaffing en het migratiepad
  6. verwijder pas na het aangekondigde migratievenster, meestal in een major release

  Maintainers kunnen de huidige migratiewachtrij controleren met
  `pnpm plugins:boundary-report`. Gebruik `pnpm plugins:boundary-report:summary` voor
  compacte aantallen, `--owner <id>` voor één plugin of compatibiliteitseigenaar, en
  `pnpm plugins:boundary-report:ci` wanneer een CI-gate moet falen op verlopen
  compatibiliteitsrecords, cross-owner gereserveerde SDK-imports of ongebruikte gereserveerde SDK-
  subpaden. Het rapport groepeert verouderde
  compatibiliteitsrecords op verwijderdatum, telt lokale code-/docs-verwijzingen,
  toont cross-owner gereserveerde SDK-imports en vat de private
  memory-host SDK-bridge samen zodat compatibiliteitsopschoning expliciet blijft in plaats van
  te vertrouwen op ad-hoczoekopdrachten. Gereserveerde SDK-subpaden moeten bijgehouden eigenaarsgebruik hebben;
  ongebruikte gereserveerde helper-exports moeten uit de publieke SDK worden verwijderd.

  Als een manifestveld nog steeds wordt geaccepteerd, kunnen plugin-auteurs het blijven gebruiken totdat
  de docs en diagnoses anders aangeven. Nieuwe code moet de gedocumenteerde
  vervanging verkiezen, maar bestaande plugins mogen niet breken tijdens gewone minor
  releases.

  ## Migreren

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    Gebundelde plugins moeten stoppen met het rechtstreeks aanroepen van
    `api.runtime.config.loadConfig()` en
    `api.runtime.config.writeConfigFile(...)`. Geef de voorkeur aan config die
    al aan het actieve aanroeppad is doorgegeven. Langlevende handlers die de
    huidige processnapshot nodig hebben, kunnen `api.runtime.config.current()` gebruiken. Langlevende
    agent-tools moeten de toolcontext `ctx.getRuntimeConfig()` binnen
    `execute` gebruiken, zodat een tool die vóór een configschrijfactie is gemaakt nog steeds de vernieuwde
    runtimeconfig ziet.

    Configschrijfacties moeten via de transactionele helpers verlopen en een
    after-write-beleid kiezen:

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
    `afterWrite: { mode: "none", reason: "..." }` alleen wanneer de aanroeper de
    follow-up beheert en bewust de reload-planner wil onderdrukken.
    Mutatieresultaten bevatten een getypte `followUp`-samenvatting voor tests en logging;
    de gateway blijft verantwoordelijk voor het toepassen of plannen van de herstart.
    `loadConfig` en `writeConfigFile` blijven als verouderde compatibiliteitshelpers
    voor externe plugins beschikbaar tijdens het migratievenster en waarschuwen eenmaal met
    de compatibiliteitscode `runtime-config-load-write`. Gebundelde plugins en repo-
    runtimecode worden beschermd door scanner-guardrails in
    `pnpm check:deprecated-api-usage` en
    `pnpm check:no-runtime-action-load-config`: nieuw productieplugingebruik
    faalt direct, rechtstreekse configschrijfacties falen, gateway-servermethoden moeten
    de runtime-snapshot van het verzoek gebruiken, runtimehelpers voor kanaalverzending/actie/client
    moeten config vanuit hun grens ontvangen, en langlevende runtimemodules hebben
    nul toegestane ambient `loadConfig()`-aanroepen.

    Nieuwe plugincode moet ook vermijden om de brede
    `openclaw/plugin-sdk/config-runtime`-compatibiliteitsbarrel te importeren. Gebruik het smalle
    SDK-subpad dat bij de taak past:

    | Behoefte | Import |
    | --- | --- |
    | Configtypen zoals `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Al geladen configasserties en plugin-entry-configopzoeking | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lezen van huidige runtime-snapshot | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Configschrijfacties | `openclaw/plugin-sdk/config-mutation` |
    | Helpers voor sessiestore | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown-tabelconfig | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Runtimehelpers voor groepsbeleid | `openclaw/plugin-sdk/runtime-group-policy` |
    | Oplossing van geheime invoer | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model-/sessieoverrides | `openclaw/plugin-sdk/model-session-runtime` |

    Gebundelde plugins en hun tests worden door scanners beschermd tegen de brede
    barrel, zodat imports en mocks lokaal blijven voor het gedrag dat ze nodig hebben. De brede
    barrel bestaat nog steeds voor externe compatibiliteit, maar nieuwe code mag er niet
    van afhankelijk zijn.

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    Gebundelde plugins moeten tool-result-handlers die alleen voor embedded-runner bedoeld zijn via
    `api.registerEmbeddedExtensionFactory(...)` vervangen door
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

    Geïnstalleerde plugins kunnen ook tool-result-middleware registreren wanneer ze
    expliciet zijn ingeschakeld en elke beoogde runtime declareren in
    `contracts.agentToolResultMiddleware`. Niet-gedeclareerde geïnstalleerde middleware-
    registraties worden geweigerd.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    Kanalenplugins met approval-ondersteuning stellen native approval-gedrag nu bloot via
    `approvalCapability.nativeRuntime` plus de gedeelde runtime-contextregistry.

    Belangrijkste wijzigingen:

    - Vervang `approvalCapability.handler.loadRuntime(...)` door
      `approvalCapability.nativeRuntime`
    - Verplaats approval-specifieke auth/delivery van legacy `plugin.auth` /
      `plugin.approvals`-bedrading naar `approvalCapability`
    - `ChannelPlugin.approvals` is verwijderd uit het publieke channel-plugin-
      contract; verplaats delivery/native/render-velden naar `approvalCapability`
    - `plugin.auth` blijft alleen voor login-/logoutflows van kanalen; approval-auth-
      hooks daar worden niet langer door core gelezen
    - Registreer door kanalen beheerde runtimeobjecten zoals clients, tokens of Bolt-
      apps via `openclaw/plugin-sdk/channel-runtime-context`
    - Verstuur geen door plugins beheerde reroute-meldingen vanuit native approval-handlers;
      core beheert nu routed-elsewhere-meldingen vanuit daadwerkelijke delivery-resultaten
    - Wanneer je `channelRuntime` doorgeeft aan `createChannelManager(...)`, lever dan een
      echt `createPluginRuntime().channel`-oppervlak. Gedeeltelijke stubs worden geweigerd.

    Zie `/plugins/sdk-channel-plugins` voor de huidige approval-capability-
    indeling.

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    Als je plugin `openclaw/plugin-sdk/windows-spawn` gebruikt, falen onopgeloste Windows
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

    Als je aanroeper niet bewust afhankelijk is van shell-fallback, stel
    `allowShellFallback` dan niet in en handel in plaats daarvan de gegooide fout af.

  </Step>

  <Step title="Find deprecated imports">
    Doorzoek je plugin op imports uit een van beide verouderde oppervlakken:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
    Elke export uit het oude oppervlak wordt gekoppeld aan een specifiek modern importpad:

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

    | Oude import | Modern equivalent |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helpers voor sessieopslag | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` bestaat nog steeds voor externe
    compatibiliteit, maar nieuwe code moet het gerichte helper-oppervlak importeren dat
    deze daadwerkelijk nodig heeft:

    | Behoefte | Import |
    | --- | --- |
    | Helpers voor de systeemgebeurteniswachtrij | `openclaw/plugin-sdk/system-event-runtime` |
    | Helpers voor Heartbeat-wake, -gebeurtenissen en -zichtbaarheid | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Leegmaken van wachtrij voor openstaande bezorging | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetrie voor kanaalactiviteit | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Dedupe-caches in het geheugen | `openclaw/plugin-sdk/dedupe-runtime` |
    | Veilige helpers voor lokale bestands-/mediapaden | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher-bewuste fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Helpers voor proxy en bewaakte fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Beleidstypen voor SSRF-dispatcher | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Typen voor goedkeuringsverzoek/-oplossing | `openclaw/plugin-sdk/approval-runtime` |
    | Helpers voor goedkeuringsantwoordpayload en opdrachten | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helpers voor foutopmaak | `openclaw/plugin-sdk/error-runtime` |
    | Wachttijden voor transportgereedheid | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helpers voor veilige tokens | `openclaw/plugin-sdk/secure-random-runtime` |
    | Begrensde gelijktijdigheid van async taken | `openclaw/plugin-sdk/concurrency-runtime` |
    | Numerieke coercion | `openclaw/plugin-sdk/number-runtime` |
    | Proces-lokaal async-slot | `openclaw/plugin-sdk/async-lock-runtime` |
    | Bestandsloten | `openclaw/plugin-sdk/file-lock` |

    Gebundelde plugins worden door een scanner beschermd tegen `infra-runtime`, zodat repo-code
    niet kan terugvallen naar de brede barrel.

  </Step>

  <Step title="Migrate channel route helpers">
    Nieuwe kanaalroutecode moet `openclaw/plugin-sdk/channel-route` gebruiken.
    De oudere namen route-key en comparable-target blijven als compatibiliteitsaliassen
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
    consistent voor native goedkeuringen, antwoordonderdrukking, inkomende dedupe,
    Cron-bezorging en sessieroutering.

    Voeg geen nieuw gebruik toe van `ChannelMessagingAdapter.parseExplicitTarget` of
    de parser-ondersteunde loaded-route-helpers (`parseExplicitTargetForLoadedChannel`
    of `resolveRouteTargetForLoadedChannel`) of
    `resolveChannelRouteTargetWithParser(...)` uit `plugin-sdk/channel-route`.
    Die hooks zijn verouderd en blijven alleen bestaan voor oudere plugins tijdens de
    migratieperiode. Nieuwe kanaalplugins moeten
    `messaging.targetResolver.resolveTarget(...)` gebruiken voor normalisatie van doel-id's
    en fallback bij ontbrekende directory, `messaging.inferTargetChatType(...)` wanneer core
    vroeg een peer-soort nodig heeft, en `messaging.resolveOutboundSessionRoute(...)`
    voor provider-native sessie- en thread-identiteit.

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
  | `plugin-sdk/plugin-entry` | Canonieke helper voor Plugin-invoer | `definePluginEntry` |
  | `plugin-sdk/core` | Verouderde overkoepelende herexport voor kanaalinvoerdefinities/-bouwers | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export van hoofdconfiguratieschema | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Invoerhelper voor één provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Gerichte kanaalinvoerdefinities en -bouwers | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Gedeelde hulpfuncties voor de installatiewizard | Installatievertaler, allowlist-prompts, bouwers voor installatiestatus |
  | `plugin-sdk/setup-runtime` | Runtimehulpfuncties tijdens installatie | `createSetupTranslator`, importveilige adapters voor installatiepatches, hulpfuncties voor opzoeknotities, `promptResolvedAllowFrom`, `splitSetupEntries`, gedelegeerde installatieproxy's |
  | `plugin-sdk/setup-adapter-runtime` | Verouderde alias voor installatieadapter | Gebruik `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Hulpfuncties voor installatietooling | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Hulpfuncties voor meerdere accounts | Hulpfuncties voor accountlijst/configuratie/actiepoort |
  | `plugin-sdk/account-id` | Hulpfuncties voor account-id's | `DEFAULT_ACCOUNT_ID`, normalisatie van account-id's |
  | `plugin-sdk/account-resolution` | Hulpfuncties voor accountopzoeking | Hulpfuncties voor accountopzoeking en standaardfallback |
  | `plugin-sdk/account-helpers` | Smalle accounthulpfuncties | Hulpfuncties voor accountlijst/accountactie |
  | `plugin-sdk/channel-setup` | Adapters voor installatiewizard | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM-koppelingsprimitieven | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Bedrading voor antwoordprefix, typen en bronlevering | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fabrieken voor configuratieadapters en hulpfuncties voor DM-toegang | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Bouwers voor configuratieschema's | Gedeelde primitieven voor kanaalconfiguratieschema's en alleen de generieke bouwer |
  | `plugin-sdk/bundled-channel-config-schema` | Gebundelde configuratieschema's | Alleen door OpenClaw onderhouden gebundelde plugins; nieuwe plugins moeten Plugin-lokale schema's definiëren |
  | `plugin-sdk/channel-config-schema-legacy` | Verouderde gebundelde configuratieschema's | Alleen compatibiliteitsalias; gebruik `plugin-sdk/bundled-channel-config-schema` voor onderhouden gebundelde plugins |
  | `plugin-sdk/telegram-command-config` | Hulpfuncties voor Telegram-opdrachtconfiguratie | Normalisatie van opdrachtnamen, inkorten van beschrijvingen, validatie van duplicaten/conflicten |
  | `plugin-sdk/channel-policy` | Oplossing van groeps-/DM-beleid | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Verouderde compatibiliteitsfacade | Gebruik `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Hulpfuncties voor inkomende enveloppen | Gedeelde route- en envelopbouwerhulpfuncties |
  | `plugin-sdk/channel-inbound` | Hulpfuncties voor inkomende ontvangst | Contextopbouw, formattering, roots, runners, voorbereide antwoorddispatch en dispatchpredicaten |
  | `plugin-sdk/messaging-targets` | Verouderd importpad voor doelparsing | Gebruik `plugin-sdk/channel-targets` voor generieke hulpfuncties voor doelparsing, `plugin-sdk/channel-route` voor routevergelijking en door de Plugin beheerde `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` voor providerspecifieke doeloplossing |
  | `plugin-sdk/outbound-media` | Hulpfuncties voor uitgaande media | Gedeeld laden van uitgaande media |
  | `plugin-sdk/outbound-send-deps` | Verouderde compatibiliteitsfacade | Gebruik `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Hulpfuncties voor levenscyclus van uitgaande berichten | Berichtadapters, ontvangstbewijzen, hulpfuncties voor duurzaam verzenden, livepreview-/streaminghulpfuncties, antwoordopties, levenscyclushulpfuncties, uitgaande identiteit en payloadplanning |
  | `plugin-sdk/channel-streaming` | Verouderde compatibiliteitsfacade | Gebruik `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Verouderde compatibiliteitsfacade | Gebruik `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Hulpfuncties voor threadbinding | Levenscyclus- en adapterhulpfuncties voor threadbinding |
  | `plugin-sdk/agent-media-payload` | Verouderde hulpfuncties voor mediapayloads | Bouwer voor agentmediapayloads voor verouderde veldindelingen |
  | `plugin-sdk/channel-runtime` | Verouderde compatibiliteitsshim | Alleen verouderde kanaalruntimehulpprogramma's |
  | `plugin-sdk/channel-send-result` | Typen voor verzendresultaten | Typen voor antwoordresultaten |
  | `plugin-sdk/runtime-store` | Persistente Plugin-opslag | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Brede runtimehulpfuncties | Hulpfuncties voor runtime/logging/back-up/Plugin-installatie |
  | `plugin-sdk/runtime-env` | Smalle hulpfuncties voor runtimeomgeving | Hulpfuncties voor logger/runtimeomgeving, time-out, opnieuw proberen en back-off |
  | `plugin-sdk/plugin-runtime` | Gedeelde Plugin-runtimehulpfuncties | Hulpfuncties voor Plugin-opdrachten/hooks/http/interactief |
  | `plugin-sdk/hook-runtime` | Hulpfuncties voor hookpijplijnen | Gedeelde hulpfuncties voor Webhook-/interne hookpijplijnen |
  | `plugin-sdk/lazy-runtime` | Luie runtimehulpfuncties | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Proceshulpfuncties | Gedeelde exec-hulpfuncties |
  | `plugin-sdk/cli-runtime` | CLI-runtimehulpfuncties | Opdrachtformattering, wachttijden, versiehulpfuncties |
  | `plugin-sdk/gateway-runtime` | Gateway-hulpfuncties | Gateway-client, starthulp zodra de eventloop klaar is, en hulpfuncties voor kanaalstatuspatches |
  | `plugin-sdk/config-runtime` | Verouderde shim voor configuratiecompatibiliteit | Geef de voorkeur aan `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` en `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Telegram-opdrachthulpfuncties | Fallbackstabiele hulpfuncties voor Telegram-opdrachtvalidatie wanneer het gebundelde Telegram-contractoppervlak niet beschikbaar is |
  | `plugin-sdk/approval-runtime` | Hulpfuncties voor goedkeuringsprompts | Exec-/Plugin-goedkeuringspayload, hulpfuncties voor goedkeuringsmogelijkheid/-profiel, native goedkeuringsroutering/runtimehulpfuncties en gestructureerde padformattering voor goedkeuringsweergave |
  | `plugin-sdk/approval-auth-runtime` | Hulpfuncties voor goedkeuringsauthenticatie | Oplossing van goedkeurder, autorisatie van actie in dezelfde chat |
  | `plugin-sdk/approval-client-runtime` | Hulpfuncties voor goedkeuringsclient | Hulpfuncties voor native exec-goedkeuringsprofiel/-filter |
  | `plugin-sdk/approval-delivery-runtime` | Hulpfuncties voor goedkeuringslevering | Native adapters voor goedkeuringsmogelijkheid/-levering |
  | `plugin-sdk/approval-gateway-runtime` | Gateway-hulpfuncties voor goedkeuring | Gedeelde hulpfunctie voor Gateway-oplossing van goedkeuring |
  | `plugin-sdk/approval-handler-adapter-runtime` | Hulpfuncties voor goedkeuringsadapters | Lichtgewicht hulpfuncties voor het laden van native goedkeuringsadapters voor hete kanaalinvoerpunten |
  | `plugin-sdk/approval-handler-runtime` | Hulpfuncties voor goedkeuringshandlers | Bredere runtimehulpfuncties voor goedkeuringshandlers; geef de voorkeur aan de smallere adapter-/Gateway-raakvlakken wanneer die voldoende zijn |
  | `plugin-sdk/approval-native-runtime` | Hulpfuncties voor goedkeuringsdoelen | Native hulpfuncties voor binding van goedkeuringsdoel/account |
  | `plugin-sdk/approval-reply-runtime` | Hulpfuncties voor goedkeuringsantwoorden | Hulpfuncties voor exec-/Plugin-goedkeuringsantwoordpayloads |
  | `plugin-sdk/channel-runtime-context` | Hulpfuncties voor kanaalruntimecontext | Generieke hulpfuncties voor registreren/ophalen/bekijken van kanaalruntimecontext |
  | `plugin-sdk/security-runtime` | Beveiligingshulpfuncties | Gedeelde hulpfuncties voor vertrouwen, DM-gating, rootbegrensde bestanden/paden, externe inhoud en geheimverzameling |
  | `plugin-sdk/ssrf-policy` | Hulpfuncties voor SSRF-beleid | Hulpfuncties voor host-allowlist en beleid voor privénetwerken |
  | `plugin-sdk/ssrf-runtime` | SSRF-runtimehulpfuncties | Vastgepinde dispatcher, bewaakte fetch, SSRF-beleidshulpfuncties |
  | `plugin-sdk/system-event-runtime` | Hulpfuncties voor systeemgebeurtenissen | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat-hulpfuncties | Hulpfuncties voor Heartbeat-wekken, gebeurtenissen en zichtbaarheid |
  | `plugin-sdk/delivery-queue-runtime` | Hulpfuncties voor leveringswachtrij | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Hulpfuncties voor kanaalactiviteit | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Hulpfuncties voor deduplicatie | Deduplicatiecaches in geheugen |
  | `plugin-sdk/file-access-runtime` | Hulpfuncties voor bestandstoegang | Hulpfuncties voor veilige lokale bestands-/mediapaden |
  | `plugin-sdk/transport-ready-runtime` | Hulpfuncties voor transportgereedheid | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Hulpfuncties voor exec-goedkeuringsbeleid | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Hulpfuncties voor begrensde cache | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Hulpfuncties voor diagnosegating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hulpfuncties voor foutformattering | `formatUncaughtError`, `isApprovalNotFoundError`, hulpfuncties voor foutgrafieken |
  | `plugin-sdk/fetch-runtime` | Hulpfuncties voor ingepakte fetch/proxy | `resolveFetch`, proxyhulpfuncties, optiehulpfuncties voor EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Hulpfuncties voor hostnormalisatie | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Hulpfuncties voor opnieuw proberen | `RetryConfig`, `retryAsync`, beleidsrunners |
  | `plugin-sdk/allow-from` | Allowlist-formattering en invoertoewijzing | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Hulpfuncties voor opdrachtgating en opdrachtoppervlak | `resolveControlCommandGate`, hulpfuncties voor afzenderautorisatie, hulpfuncties voor opdrachtregister inclusief formattering van menu's met dynamische argumenten |
  | `plugin-sdk/command-status` | Renderers voor opdrachtstatus/-hulp | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing van geheiminvoer | Hulpfuncties voor geheiminvoer |
  | `plugin-sdk/webhook-ingress` | Hulpfuncties voor Webhook-aanvragen | Webhook-doelhulpprogramma's |
  | `plugin-sdk/webhook-request-guards` | Hulpfuncties voor Webhook-bodyguard | Hulpfuncties voor lezen/beperken van aanvraagbody's |
  | `plugin-sdk/reply-runtime` | Gedeelde antwoordruntime | Inkomende dispatch, Heartbeat, antwoordplanner, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Smalle hulpfuncties voor antwoorddispatch | Afronden, providerdispatch en hulpfuncties voor gesprekslabels |
  | `plugin-sdk/reply-history` | Hulpfuncties voor antwoordgeschiedenis | `createChannelHistoryWindow`; verouderde compatibiliteitsexports voor map-hulpfuncties zoals `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` en `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planning van antwoordreferenties | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Hulpfuncties voor antwoordchunks | Hulpfuncties voor tekst-/markdownchunking |
  | `plugin-sdk/session-store-runtime` | Hulpfuncties voor sessieopslag | Hulpfuncties voor opslagpad en bijgewerkt-op |
  | `plugin-sdk/state-paths` | Hulpfuncties voor statuspaden | Hulpfuncties voor status- en OAuth-mappen |
  | `plugin-sdk/routing` | Routing-/sessiesleutelhulpfuncties | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, sessiesleutelnormalisatiehulpfuncties |
  | `plugin-sdk/status-helpers` | Kanaalstatushulpfuncties | Bouwers voor kanaal-/accountstatussamenvattingen, standaardwaarden voor runtimestatus, hulpfuncties voor issue-metadata |
  | `plugin-sdk/target-resolver-runtime` | Hulpfuncties voor doelresolutie | Gedeelde hulpfuncties voor doelresolutie |
  | `plugin-sdk/string-normalization-runtime` | Hulpfuncties voor tekenreeksnormalisatie | Hulpfuncties voor slug-/tekenreeksnormalisatie |
  | `plugin-sdk/request-url` | Hulpfuncties voor verzoek-URL's | Haal tekenreeks-URL's uit verzoekachtige invoer |
  | `plugin-sdk/run-command` | Hulpfuncties voor getimede opdrachten | Runner voor getimede opdrachten met genormaliseerde stdout/stderr |
  | `plugin-sdk/param-readers` | Parameterlezers | Algemene parameterlezers voor tools/CLI |
  | `plugin-sdk/tool-payload` | Extractie van tool-payloads | Haal genormaliseerde payloads uit toolresultaatobjecten |
  | `plugin-sdk/tool-send` | Extractie van toolverzending | Haal canonieke verzenddoelvelden uit toolargumenten |
  | `plugin-sdk/temp-path` | Hulpfuncties voor tijdelijke paden | Gedeelde hulpfuncties voor tijdelijke downloadpaden |
  | `plugin-sdk/logging-core` | Logginghulpfuncties | Subsystemlogger en redactiehulpfuncties |
  | `plugin-sdk/markdown-table-runtime` | Markdown-tabelhulpfuncties | Hulpfuncties voor Markdown-tabelmodi |
  | `plugin-sdk/reply-payload` | Typen voor berichtantwoorden | Typen voor antwoordpayloads |
  | `plugin-sdk/provider-setup` | Gecureerde hulpfuncties voor lokale/zelfgehoste aanbiedersinstelling | Hulpfuncties voor detectie/configuratie van zelfgehoste aanbieders |
  | `plugin-sdk/self-hosted-provider-setup` | Gerichte hulpfuncties voor OpenAI-compatibele zelfgehoste aanbiedersinstelling | Dezelfde hulpfuncties voor detectie/configuratie van zelfgehoste aanbieders |
  | `plugin-sdk/provider-auth-runtime` | Hulpfuncties voor aanbiederruntime-authenticatie | Hulpfuncties voor runtime-API-sleutelresolutie |
  | `plugin-sdk/provider-auth-api-key` | Hulpfuncties voor aanbieders-API-sleutelinstelling | Hulpfuncties voor API-sleutelonboarding/profielschrijven |
  | `plugin-sdk/provider-auth-result` | Hulpfuncties voor aanbieder-auth-result | Standaardbouwer voor OAuth-auth-result |
  | `plugin-sdk/provider-selection-runtime` | Hulpfuncties voor aanbiedersselectie | Geconfigureerde of automatische aanbiedersselectie en samenvoegen van ruwe aanbiederconfiguratie |
  | `plugin-sdk/provider-env-vars` | Hulpfuncties voor aanbiederomgevingsvariabelen | Hulpfuncties voor opzoeken van aanbieder-auth-omgevingsvariabelen |
  | `plugin-sdk/provider-model-shared` | Gedeelde hulpfuncties voor aanbiedermodel/replay | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gedeelde bouwers voor replaybeleid, hulpfuncties voor aanbiederendpoints en hulpfuncties voor model-id-normalisatie |
  | `plugin-sdk/provider-catalog-shared` | Gedeelde hulpfuncties voor aanbiedercatalogus | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches voor aanbiederonboarding | Hulpfuncties voor onboardingconfiguratie |
  | `plugin-sdk/provider-http` | HTTP-hulpfuncties voor aanbieders | Generieke HTTP-/endpoint-capability-hulpfuncties voor aanbieders, inclusief multipart-formulierhulpfuncties voor audiotranscriptie |
  | `plugin-sdk/provider-web-fetch` | Hulpfuncties voor aanbieder-web-fetch | Hulpfuncties voor registratie/cache van web-fetch-aanbieders |
  | `plugin-sdk/provider-web-search-config-contract` | Hulpfuncties voor webzoekconfiguratie van aanbieders | Smalle hulpfuncties voor webzoekconfiguratie/referenties voor aanbieders die geen bedrading voor Plugin-inschakeling nodig hebben |
  | `plugin-sdk/provider-web-search-contract` | Contracthulpfuncties voor webzoeken van aanbieders | Smalle contracthulpfuncties voor webzoekconfiguratie/referenties, zoals `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` en scoped setters/getters voor referenties |
  | `plugin-sdk/provider-web-search` | Hulpfuncties voor webzoeken van aanbieders | Hulpfuncties voor registratie/cache/runtime van webzoekaanbieders |
  | `plugin-sdk/provider-tools` | Compatibiliteitshulpfuncties voor aanbiedertools/schema's | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` en schemaopschoning + diagnostiek voor DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Hulpfuncties voor aanbiedersgebruik | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` en andere hulpfuncties voor aanbiedersgebruik |
  | `plugin-sdk/provider-stream` | Hulpfuncties voor aanbiederstream-wrappers | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, stream-wrappertypen en gedeelde wrapperhulpfuncties voor Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Transporthulpfuncties voor aanbieders | Native transporthulpfuncties voor aanbieders, zoals bewaakte fetch, transformaties van transportberichten en schrijfbare transporteventstreams |
  | `plugin-sdk/keyed-async-queue` | Geordende async-wachtrij | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Gedeelde mediahulpfuncties | Hulpfuncties voor ophalen/transformeren/opslaan van media, ffprobe-ondersteunde detectie van videodimensies en bouwers voor mediapayloads |
  | `plugin-sdk/media-generation-runtime` | Gedeelde hulpfuncties voor mediageneratie | Gedeelde failoverhulpfuncties, kandidaatselectie en berichten over ontbrekende modellen voor afbeelding-/video-/muziekgeneratie |
  | `plugin-sdk/media-understanding` | Hulpfuncties voor mediabegrip | Providertypen voor mediabegrip plus providergerichte exports voor afbeelding-/audiohulpfuncties |
  | `plugin-sdk/text-runtime` | Verouderde brede export voor tekstcompatibiliteit | Gebruik `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` en `logging-core` |
  | `plugin-sdk/text-chunking` | Hulpfuncties voor tekstchunking | Hulpfunctie voor uitgaande tekstchunking |
  | `plugin-sdk/speech` | Spraakhulpfuncties | Spraakprovidertypen plus providergerichte hulpfuncties voor richtlijnen, registry en validatie, en OpenAI-compatibele TTS-bouwer |
  | `plugin-sdk/speech-core` | Gedeelde spraakkern | Spraakprovidertypen, registry, richtlijnen, normalisatie |
  | `plugin-sdk/realtime-transcription` | Hulpfuncties voor realtime transcriptie | Providertypen, registry-hulpfuncties en gedeelde hulpfunctie voor WebSocket-sessies |
  | `plugin-sdk/realtime-voice` | Hulpfuncties voor realtime spraak | Providertypen, registry-/resolutiehulpfuncties, brug-sessiehulpfuncties, gedeelde talk-back-wachtrijen voor agents, spraakbesturing voor actieve runs, transcript-/eventgezondheid, echo-onderdrukking, matching van consultvragen, coördinatie van geforceerde consults, tracking van beurtcontext, tracking van outputactiviteit en snelle contextconsult-hulpfuncties |
  | `plugin-sdk/image-generation` | Hulpfuncties voor afbeeldinggeneratie | Providertypen voor afbeeldinggeneratie plus hulpfuncties voor afbeeldingsassets/data-URL's en de OpenAI-compatibele afbeeldingproviderbouwer |
  | `plugin-sdk/image-generation-core` | Gedeelde kern voor afbeeldinggeneratie | Typen voor afbeeldinggeneratie, failover, auth en registry-hulpfuncties |
  | `plugin-sdk/music-generation` | Hulpfuncties voor muziekgeneratie | Provider-/verzoek-/resultaattypen voor muziekgeneratie |
  | `plugin-sdk/music-generation-core` | Gedeelde kern voor muziekgeneratie | Typen voor muziekgeneratie, failoverhulpfuncties, providerlookup en model-ref-parsing |
  | `plugin-sdk/video-generation` | Hulpfuncties voor videogeneratie | Provider-/verzoek-/resultaattypen voor videogeneratie |
  | `plugin-sdk/video-generation-core` | Gedeelde kern voor videogeneratie | Typen voor videogeneratie, failoverhulpfuncties, providerlookup en model-ref-parsing |
  | `plugin-sdk/interactive-runtime` | Hulpfuncties voor interactieve antwoorden | Normalisatie/reductie van payloads voor interactieve antwoorden |
  | `plugin-sdk/channel-config-primitives` | Primitieven voor kanaalconfiguratie | Smalle kanaalconfiguratieschema-primitieven |
  | `plugin-sdk/channel-config-writes` | Hulpfuncties voor schrijven van kanaalconfiguratie | Autorisatiehulpfuncties voor schrijven van kanaalconfiguratie |
  | `plugin-sdk/channel-plugin-common` | Gedeelde kanaalprelude | Gedeelde prelude-exports voor kanaal-Plugins |
  | `plugin-sdk/channel-status` | Kanaalstatushulpfuncties | Gedeelde hulpfuncties voor kanaalstatussnapshots/-samenvattingen |
  | `plugin-sdk/allowlist-config-edit` | Hulpfuncties voor allowlist-configuratie | Hulpfuncties voor bewerken/lezen van allowlist-configuratie |
  | `plugin-sdk/group-access` | Hulpfuncties voor groepstoegang | Gedeelde beslissingshulpfuncties voor groepstoegang |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Verouderde compatibiliteitsfacades | Gebruik `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Direct-DM-guard-hulpfuncties | Smalle pre-crypto guard-beleidshulpfuncties |
  | `plugin-sdk/extension-shared` | Gedeelde extensiehulpfuncties | Primitieven voor passief kanaal/status en ambient proxy-hulpfuncties |
  | `plugin-sdk/webhook-targets` | Webhook-doelhulpfuncties | Webhook-doelregistry en route-installatiehulpfuncties |
  | `plugin-sdk/webhook-path` | Verouderde Webhook-padalias | Gebruik `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Gedeelde webmediahulpfuncties | Hulpfuncties voor laden van externe/lokale media |
  | `plugin-sdk/zod` | Verouderde Zod-compatibiliteits-herexport | Importeer `zod` rechtstreeks uit `zod` |
  | `plugin-sdk/memory-core` | Gebundelde memory-core-hulpfuncties | Hulpoppervlak voor memorymanager/configuratie/bestand/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Runtimefacade voor memory-engine | Runtimefacade voor memory-index/zoeken |
  | `plugin-sdk/memory-core-host-embedding-registry` | Memory-embeddingregistry | Lichtgewicht registryhulpfuncties voor memory-embeddingproviders |
  | `plugin-sdk/memory-core-host-engine-foundation` | Memory-host-foundation-engine | Exports voor memory-host-foundation-engine |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Memory-host-embedding-engine | Memory-embeddingcontracten, registrytoegang, lokale provider en generieke batch-/remote-hulpfuncties; concrete remoteproviders leven in hun eigen Plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | Memory-host-QMD-engine | Exports voor memory-host-QMD-engine |
  | `plugin-sdk/memory-core-host-engine-storage` | Memory-host-storage-engine | Exports voor memory-host-storage-engine |
  | `plugin-sdk/memory-core-host-multimodal` | Hulpfuncties voor memory-host-multimodal | Hulpfuncties voor memory-host-multimodal |
  | `plugin-sdk/memory-core-host-query` | Hulpfuncties voor memory-host-query | Hulpfuncties voor memory-host-query |
  | `plugin-sdk/memory-core-host-secret` | Hulpfuncties voor memory-host-secret | Hulpfuncties voor memory-host-secret |
  | `plugin-sdk/memory-core-host-events` | Verouderde memory-eventalias | Gebruik `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Hulpfuncties voor memory-host-status | Hulpfuncties voor memory-host-status |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI-runtime voor memory-host | CLI-runtimehulpfuncties voor memory-host |
  | `plugin-sdk/memory-core-host-runtime-core` | Core-runtime voor memory-host | Core-runtimehulpfuncties voor memory-host |
  | `plugin-sdk/memory-core-host-runtime-files` | Bestand-/runtimehulpfuncties voor memory-host | Bestand-/runtimehulpfuncties voor memory-host |
  | `plugin-sdk/memory-host-core` | Alias voor core-runtime van memory-host | Leverancieronafhankelijke alias voor core-runtimehulpfuncties van memory-host |
  | `plugin-sdk/memory-host-events` | Alias voor eventjournaal van memory-host | Leverancieronafhankelijke alias voor eventjournaalhulpfuncties van memory-host |
  | `plugin-sdk/memory-host-files` | Verouderde alias voor memory-bestand/runtime | Gebruik `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Hulpfuncties voor beheerde Markdown | Gedeelde hulpfuncties voor beheerde Markdown voor memory-aangrenzende Plugins |
  | `plugin-sdk/memory-host-search` | Active Memory-zoekfacade | Luie runtimefacade voor Active Memory-zoekmanager |
  | `plugin-sdk/memory-host-status` | Verouderde alias voor memory-host-status | Gebruik `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Testhulpmiddelen | Repo-lokaal verouderd compatibiliteitsbarrel; gebruik gerichte repo-lokale testsubpaden zoals `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` en `plugin-sdk/test-fixtures` |
</Accordion>

Deze tabel is bewust de gemeenschappelijke migratiesubset, niet het volledige SDK-oppervlak. De inventaris van compiler-entrypoints staat in
`scripts/lib/plugin-sdk-entrypoints.json`; package-exports worden gegenereerd uit
de publieke subset.

Gereserveerde helper-seams voor gebundelde plugins zijn uit de publieke SDK
export map verwijderd, behalve expliciet gedocumenteerde compatibiliteitsfacades zoals de
verouderde `plugin-sdk/discord`-shim die behouden blijft voor het gepubliceerde
pakket `@openclaw/discord@2026.3.13`. Eigenaar-specifieke helpers staan in het
eigen pluginpakket; gedeeld hostgedrag hoort via generieke SDK-contracten te lopen,
zoals `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`
en `plugin-sdk/plugin-config-runtime`.

Gebruik de smalste import die bij de taak past. Als je geen export kunt vinden,
controleer dan de bron in `src/plugin-sdk/` of vraag maintainers welk generiek contract
dit zou moeten bezitten.

## Actieve deprecations

Smallere deprecations die gelden voor de plugin-SDK, het providercontract,
runtime-oppervlak en manifest. Elk werkt vandaag nog, maar wordt verwijderd
in een toekomstige major release. De vermelding onder elk item koppelt de oude API
aan de canonieke vervanging.

<AccordionGroup>
  <Accordion title="command-auth-helpbuilders → command-status">
    **Oud (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nieuw (`openclaw/plugin-sdk/command-status`)**: dezelfde signatures, dezelfde
    exports - alleen geïmporteerd vanaf het smallere subpad. `command-auth`
    re-exporteert ze als compat-stubs.

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

    Downstream kanaalplugins (Slack, Discord, Matrix, MS Teams) zijn al
    overgestapt.

  </Accordion>

  <Accordion title="Channel-runtime-shim en channel-actions-helpers">
    `openclaw/plugin-sdk/channel-runtime` is een compatibiliteitsshim voor oudere
    kanaalplugins. Importeer deze niet vanuit nieuwe code; gebruik
    `openclaw/plugin-sdk/channel-runtime-context` voor het registreren van runtime-
    objecten.

    `channelActions*`-helpers in `openclaw/plugin-sdk/channel-actions` zijn
    deprecated naast ruwe kanaalexports voor "actions". Bied capabilities
    in plaats daarvan aan via het semantische `presentation`-oppervlak - kanaalplugins
    declareren wat ze renderen (kaarten, knoppen, selects) in plaats van welke ruwe
    action-namen ze accepteren.

  </Accordion>

  <Accordion title="Webzoekprovider-tool()-helper → createTool() op de plugin">
    **Oud**: `tool()`-factory uit `openclaw/plugin-sdk/provider-web-search`.

    **Nieuw**: implementeer `createTool(...)` rechtstreeks op de providerplugin.
    OpenClaw heeft de SDK-helper niet langer nodig om de tool-wrapper te registreren.

  </Accordion>

  <Accordion title="Plaintext-kanaalenveloppen → BodyForAgent">
    **Oud**: `formatInboundEnvelope(...)` (en
    `ChannelMessageForAgent.channelEnvelope`) om een platte plaintext prompt-
    envelop te bouwen uit inkomende kanaalberichten.

    **Nieuw**: `BodyForAgent` plus gestructureerde user-context-blokken. Kanaalplugins
    voegen routeringsmetadata (thread, topic, reply-to, reacties) toe als
    getypte velden in plaats van ze samen te voegen in een promptstring. De
    helper `formatAgentEnvelope(...)` wordt nog ondersteund voor gesynthetiseerde
    assistant-gerichte enveloppen, maar inkomende plaintext-enveloppen verdwijnen
    geleidelijk.

    Betrokken gebieden: `inbound_claim`, `message_received` en elke aangepaste
    kanaalplugin die `channelEnvelope`-tekst nabewerkte.

  </Accordion>

  <Accordion title="deactivate-hook → gateway_stop">
    **Oud**: `api.on("deactivate", handler)`.

    **Nieuw**: `api.on("gateway_stop", handler)`. De event en context vormen hetzelfde
    contract voor shutdown-cleanup; alleen de hooknaam verandert.

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

    `deactivate` blijft tot na 2026-08-16 aangesloten als verouderde
    compatibiliteitsalias.

  </Accordion>

  <Accordion title="subagent_spawning-hook → core-threadbinding">
    **Oud**: `api.on("subagent_spawning", handler)` die
    `threadBindingReady` of `deliveryOrigin` retourneert.

    **Nieuw**: laat core `thread: true`-subagentbindings voorbereiden via de
    channel session-binding adapter. Gebruik `api.on("subagent_spawned", handler)`
    alleen voor observatie na de launch.

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
    deprecated compatibiliteitsoppervlakken terwijl externe plugins migreren.

  </Accordion>

  <Accordion title="Provider-discoverytypes → providercatalogustypes">
    Vier discovery-typealiassen zijn nu dunne wrappers rond de
    catalog-era types:

    | Oude alias                | Nieuw type                |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Plus de legacy statische bag `ProviderCapabilities` - providerplugins
    moeten expliciete providerhooks gebruiken zoals `buildReplayPolicy`,
    `normalizeToolSchemas` en `wrapStreamFn` in plaats van een statisch object.

  </Accordion>

  <Accordion title="Thinking-policyhooks → resolveThinkingProfile">
    **Oud** (drie afzonderlijke hooks op `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` en
    `resolveDefaultThinkingLevel(ctx)`.

    **Nieuw**: één `resolveThinkingProfile(ctx)` die een
    `ProviderThinkingProfile` retourneert met de canonieke `id`, optionele `label` en
    gerangschikte niveaulijst. OpenClaw downgradet verouderde opgeslagen waarden
    automatisch op basis van profilerang.

    De context bevat `provider`, `modelId`, optioneel samengevoegde `reasoning`
    en optioneel samengevoegde model-`compat`-facts. Providerplugins kunnen die
    catalogusfacts gebruiken om alleen een modelspecifiek profiel aan te bieden
    wanneer het geconfigureerde requestcontract dit ondersteunt.

    Implementeer één hook in plaats van drie. De legacy hooks blijven tijdens
    de deprecationperiode werken, maar worden niet gecombineerd met het profielresultaat.

  </Accordion>

  <Accordion title="Externe authproviders → contracts.externalAuthProviders">
    **Oud**: externe authhooks implementeren zonder de provider in het
    pluginmanifest te declareren.

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
    op het manifest. Dit consolideert setup/status-env-metadata op één
    plek en voorkomt dat de pluginruntime moet opstarten alleen om env-var-
    lookups te beantwoorden.

    `providerAuthEnvVars` blijft ondersteund via een compatibiliteitsadapter
    totdat de deprecationperiode eindigt.

  </Accordion>

  <Accordion title="Registratie van geheugenplugin → registerMemoryCapability">
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

  <Accordion title="API voor geheugenembeddingprovider">
    **Oud**: `api.registerMemoryEmbeddingProvider(...)` plus
    `contracts.memoryEmbeddingProviders`.

    **Nieuw**: `api.registerEmbeddingProvider(...)` plus
    `contracts.embeddingProviders`.

    Het generieke embeddingprovidercontract is buiten geheugen herbruikbaar en is
    het ondersteunde pad voor nieuwe providers. De geheugenspecifieke registratie-API
    blijft als deprecated compatibiliteit aangesloten terwijl bestaande providers migreren.
    Plugininspectie rapporteert niet-gebundeld gebruik als compatibiliteitsschuld.

  </Accordion>

  <Accordion title="Typen voor subagent-sessieberichten hernoemd">
    Twee legacy-typealiassen worden nog geëxporteerd uit `src/plugins/runtime/types.ts`:

    | Oud                           | Nieuw                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    De runtime-methode `readSession` is deprecated ten gunste van
    `getSessionMessages`. Zelfde signature; de oude methode roept door naar de
    nieuwe.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Oud**: `runtime.tasks.flow` (enkelvoud) retourneerde een live task-flow accessor.

    **Nieuw**: `runtime.tasks.managedFlows` behoudt de beheerde TaskFlow-mutatie-
    runtime voor plugins die child tasks vanuit een flow maken, bijwerken, annuleren
    of uitvoeren. Gebruik `runtime.tasks.flows` wanneer de plugin alleen DTO-gebaseerde reads
    nodig heeft.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Ingebedde extension-factories → agent tool-result middleware">
    Behandeld in "Migreren → Ingebedde tool-result-extensions naar middleware
    migreren" hierboven. Voor de volledigheid hier opgenomen: het verwijderde embedded-runner-only
    pad `api.registerEmbeddedExtensionFactory(...)` is vervangen door
    `api.registerAgentToolResultMiddleware(...)` met een expliciete runtimelijst
    in `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="OpenClawSchemaType-alias → OpenClawConfig">
    `OpenClawSchemaType`, opnieuw geëxporteerd uit `openclaw/plugin-sdk`, is nu een
    eenregelige alias voor `OpenClawConfig`. Geef de voorkeur aan de canonieke naam.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Deprecations op extensionniveau (binnen gebundelde kanaal-/providerplugins onder
`extensions/`) worden bijgehouden in hun eigen `api.ts`- en `runtime-api.ts`-
barrels. Ze hebben geen invloed op contracten van externe plugins en worden hier
niet vermeld. Als je de lokale barrel van een gebundelde plugin rechtstreeks gebruikt,
lees dan de deprecation-opmerkingen in die barrel voordat je upgradet.
</Note>

## Verwijderingstijdlijn

| Wanneer                | Wat gebeurt er                                                          |
| ---------------------- | ----------------------------------------------------------------------- |
| **Nu**                 | Verouderde oppervlakken geven runtimewaarschuwingen                     |
| **Volgende major release** | Verouderde oppervlakken worden verwijderd; plugins die ze nog gebruiken zullen falen |

Alle kernplugins zijn al gemigreerd. Externe plugins moeten migreren
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
- [SDK-overzicht](/nl/plugins/sdk-overview) - volledige referentie voor subpadimports
- [Kanaalplugins](/nl/plugins/sdk-channel-plugins) - kanaalplugins bouwen
- [Providerplugins](/nl/plugins/sdk-provider-plugins) - providerplugins bouwen
- [Plugininternals](/nl/plugins/architecture) - diepgaande architectuuruitleg
- [Pluginmanifest](/nl/plugins/manifest) - referentie voor het manifestschema
