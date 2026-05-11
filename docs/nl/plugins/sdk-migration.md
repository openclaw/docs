---
read_when:
    - Je ziet de waarschuwing OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Je ziet de waarschuwing OPENCLAW_EXTENSION_API_DEPRECATED
    - Je gebruikte api.registerEmbeddedExtensionFactory vóór OpenClaw 2026.4.25
    - Je werkt een Plugin bij naar de moderne Plugin-architectuur
    - Je onderhoudt een externe OpenClaw-plugin
sidebarTitle: Migrate to SDK
summary: Migreer van de verouderde achterwaartse-compatibiliteitslaag naar de moderne Plugin-SDK
title: Plugin-SDK-migratie
x-i18n:
    generated_at: "2026-05-11T20:43:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7595b41c15ce36dd8d2a3faf320cc9847b013b1f4807c02b8b97c6feaee4415
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw is overgestapt van een brede laag voor achterwaartse compatibiliteit naar een moderne pluginarchitectuur met gerichte, gedocumenteerde imports. Als je plugin vóór de nieuwe architectuur is gebouwd, helpt deze gids je bij de migratie.

## Wat verandert er

Het oude pluginsysteem bood twee zeer ruime oppervlakken waarmee plugins alles wat ze nodig hadden vanuit één entrypoint konden importeren:

- **`openclaw/plugin-sdk/compat`** - één import die tientallen helpers opnieuw exporteerde. Deze werd geïntroduceerd om oudere, op hooks gebaseerde plugins werkend te houden terwijl de nieuwe pluginarchitectuur werd gebouwd.
- **`openclaw/plugin-sdk/infra-runtime`** - een brede barrel voor runtimehelpers die systeemgebeurtenissen, Heartbeat-status, afleverwachtrijen, fetch-/proxyhelpers, bestandshelpers, goedkeuringstypen en niet-gerelateerde hulpprogramma's mengde.
- **`openclaw/plugin-sdk/config-runtime`** - een brede barrel voor configuratiecompatibiliteit die tijdens de migratieperiode nog verouderde directe laad-/schrijfhelpers bevat.
- **`openclaw/extension-api`** - een bridge die plugins directe toegang gaf tot host-side helpers zoals de ingebedde agentrunner.
- **`api.registerEmbeddedExtensionFactory(...)`** - een verwijderde, alleen voor Pi bedoelde gebundelde extensiehook die embedded-runner-gebeurtenissen zoals `tool_result` kon observeren.

De brede importoppervlakken zijn nu **verouderd**. Ze werken nog steeds tijdens runtime, maar nieuwe plugins mogen ze niet gebruiken, en bestaande plugins moeten migreren voordat de volgende major release ze verwijdert. De alleen voor Pi bedoelde registratie-API voor embedded extension factories is verwijderd; gebruik in plaats daarvan tool-result middleware.

OpenClaw verwijdert of herinterpreteert gedocumenteerd plugingedrag niet in dezelfde wijziging die een vervanging introduceert. Brekende contractwijzigingen moeten eerst via een compatibiliteitsadapter, diagnostiek, docs en een deprecation window lopen. Dat geldt voor SDK-imports, manifestvelden, setup-API's, hooks en runtime-registratiegedrag.

<Warning>
  De laag voor achterwaartse compatibiliteit wordt in een toekomstige major release verwijderd.
  Plugins die nog steeds uit deze oppervlakken importeren, breken wanneer dat gebeurt.
  Alleen voor Pi bedoelde registraties van embedded extension factories worden nu al niet meer geladen.
</Warning>

## Waarom dit is gewijzigd

De oude aanpak veroorzaakte problemen:

- **Trage opstart** - het importeren van één helper laadde tientallen niet-gerelateerde modules
- **Circulaire afhankelijkheden** - brede herexports maakten het makkelijk om importcycli te creëren
- **Onduidelijk API-oppervlak** - er was geen manier om te zien welke exports stabiel waren en welke intern

De moderne plugin-SDK lost dit op: elk importpad (`openclaw/plugin-sdk/\<subpath\>`) is een kleine, zelfstandige module met een duidelijk doel en een gedocumenteerd contract.

Legacy provider-convenience seams voor gebundelde kanalen zijn ook verdwenen.
Kanaalgebrande helperseams waren private mono-repo-snelkoppelingen, geen stabiele plugincontracten. Gebruik in plaats daarvan smalle generieke SDK-subpaden. Houd binnen de werkruimte van gebundelde plugins provider-owned helpers in de eigen `api.ts` of `runtime-api.ts` van die plugin.

Huidige voorbeelden van gebundelde providers:

- Anthropic houdt Claude-specifieke streamhelpers in de eigen `api.ts` /
  `contract-api.ts` seam
- OpenAI houdt providerbuilders, default-model-helpers en realtime providerbuilders in de eigen `api.ts`
- OpenRouter houdt providerbuilder en onboarding-/configuratiehelpers in de eigen
  `api.ts`

## Migratieplan voor Talk en realtime spraak

Realtime spraak, telefonie, meetings en browser-Talk-code verhuizen van oppervlak-lokale beurtadministratie naar een gedeelde Talk-sessiecontroller die wordt geëxporteerd door `openclaw/plugin-sdk/realtime-voice`. De nieuwe controller beheert de gemeenschappelijke Talk-gebeurtenisenvelop, actieve beurtstatus, capturestatus, output-audiostatus, recente gebeurtenisgeschiedenis en afwijzing van verouderde beurten. Providerplugins moeten eigenaar blijven van leveranciersspecifieke realtime sessies; surface-plugins moeten eigenaar blijven van capture, playback, telefonie en meeting-eigenaardigheden.

Deze Talk-migratie is bewust clean breaking:

1. Houd de gedeelde controller-/runtimeprimitieven in
   `plugin-sdk/realtime-voice`.
2. Verplaats gebundelde surfaces naar de gedeelde controller: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime en native push-to-talk.
3. Vervang oude Talk RPC-families door de definitieve `talk.session.*`- en
   `talk.client.*`-API.
4. Adverteer één live Talk-gebeurteniskanaal in Gateway
   `hello-ok.features.events`: `talk.event`.
5. Verwijder het oude realtime HTTP-endpoint en elk pad voor request-time instruction overrides.

Nieuwe code moet `createTalkEventSequencer(...)` niet direct aanroepen, tenzij die een low-level adapter of testfixture implementeert. Geef de voorkeur aan de gedeelde controller, zodat turn-scoped gebeurtenissen niet zonder turn id kunnen worden uitgezonden, verouderde `turnEnd`- /
`turnCancel`-aanroepen geen nieuwere actieve beurt kunnen wissen, en lifecycle-gebeurtenissen voor output-audio consistent blijven in telefonie, meetings, browser relay, managed-room handoff en native Talk-clients.

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
```

Browser-owned WebRTC-/provider-websocket-sessies gebruiken `talk.client.create`, omdat de browser eigenaar is van de provideronderhandeling en het mediatransport, terwijl de Gateway eigenaar is van credentials, instructies en toolbeleid. `talk.session.*` is het gemeenschappelijke door de Gateway beheerde oppervlak voor gateway-relay realtime, gateway-relay transcriptie en managed-room native STT-/TTS-sessies.

Legacy configuraties die realtime selectors naast `talk.provider` /
`talk.providers` plaatsten, moeten worden gerepareerd met `openclaw doctor --fix`; runtime Talk herinterpreteert speech-/TTS-providerconfiguratie niet als realtime providerconfiguratie.

De ondersteunde combinaties voor `talk.session.create` zijn bewust klein:

| Modus           | Transport       | Brain           | Eigenaar           | Opmerkingen                                                                                                       |
| --------------- | --------------- | --------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Full-duplex provider-audio gebridged via de Gateway; toolaanroepen worden gerouteerd via de agent-consult-tool.   |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Alleen streaming STT; callers sturen inputaudio en ontvangen transcriptgebeurtenissen.                           |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | Push-to-talk- en walkie-talkie-achtige rooms waarbij de client capture/playback beheert en de Gateway beurtstatus. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | Admin-only roommodus voor vertrouwde first-party surfaces die Gateway-toolacties direct uitvoeren.                |

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

De uniforme controlevocabulaire is ook bewust smal:

| Methode                         | Van toepassing op                                      | Contract                                                                                                                                                                                         |
| ------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Voeg een base64 PCM-audiochunk toe aan de providersessie die eigendom is van dezelfde Gateway-verbinding.                                                                                         |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                | Start een managed-room-gebruikersbeurt.                                                                                                                                                          |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                | Beëindig de actieve beurt na validatie van verouderde beurten.                                                                                                                                   |
| `talk.session.cancelTurn`       | alle Gateway-owned sessies                            | Annuleer actieve capture-/provider-/agent-/TTS-werkzaamheden voor een beurt.                                                                                                                      |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                              | Stop audio-uitvoer van de assistant zonder noodzakelijkerwijs de gebruikersbeurt te beëindigen.                                                                                                  |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                              | Voltooi een provider-toolaanroep die door de relay is uitgezonden; geef `options.willContinue` door voor tussentijdse output of `options.suppressResponse` om de call te voldoen zonder nog een assistant response. |
| `talk.session.close`            | alle uniforme sessies                                 | Stop relay-sessies of trek managed-room-status in, en vergeet daarna de uniforme session id.                                                                                                     |

  Voer geen provider- of platformspecifieke uitzonderingen in de kern in om dit te laten werken.
  De kern beheert de semantiek van Talk-sessies. Providerplugins beheren de sessie-instelling van leveranciers.
  Spraakoproepen en Google Meet beheren telefonie-/vergaderadapters. Browsers en native
  apps beheren de UX voor apparaatopname/-weergave.

  ## Compatibiliteitsbeleid

  Voor externe plugins volgt compatibiliteitswerk deze volgorde:

  1. voeg het nieuwe contract toe
  2. houd het oude gedrag verbonden via een compatibiliteitsadapter
  3. geef een diagnose of waarschuwing uit die het oude pad en de vervanging noemt
  4. dek beide paden af in tests
  5. documenteer de afschaffing en het migratiepad
  6. verwijder pas na de aangekondigde migratieperiode, meestal in een major release

  Maintainers kunnen de huidige migratiewachtrij controleren met
  `pnpm plugins:boundary-report`. Gebruik `pnpm plugins:boundary-report:summary` voor
  compacte aantallen, `--owner <id>` voor één plugin of compatibiliteitseigenaar, en
  `pnpm plugins:boundary-report:ci` wanneer een CI-gate moet falen op vervallen
  compatibiliteitsrecords, gereserveerde SDK-imports over eigenaren heen, of ongebruikte gereserveerde SDK-
  subpaden. Het rapport groepeert verouderde
  compatibiliteitsrecords op verwijderdatum, telt lokale code-/docsverwijzingen,
  toont gereserveerde SDK-imports over eigenaren heen, en vat de private
  SDK-brug voor geheugenhosts samen zodat compatibiliteitsopschoning expliciet blijft in plaats van
  te vertrouwen op ad-hoczoekopdrachten. Gereserveerde SDK-subpaden moeten bijgehouden eigenaarsgebruik hebben;
  ongebruikte gereserveerde helperexports moeten uit de publieke SDK worden verwijderd.

  Als een manifestveld nog steeds wordt geaccepteerd, kunnen pluginauteurs het blijven gebruiken totdat
  de docs en diagnoses anders aangeven. Nieuwe code moet de gedocumenteerde
  vervanging verkiezen, maar bestaande plugins mogen niet breken tijdens gewone minor
  releases.

  ## Migreren

  <Steps>
  <Step title="Runtime-configuratiehelpers voor laden/schrijven migreren">
    Gebundelde plugins moeten stoppen met het direct aanroepen van
    `api.runtime.config.loadConfig()` en
    `api.runtime.config.writeConfigFile(...)`. Geef de voorkeur aan configuratie die al
    aan het actieve aanroeppad is doorgegeven. Langlevende handlers die de huidige
    processnapshot nodig hebben, kunnen `api.runtime.config.current()` gebruiken. Langlevende
    agenttools moeten `ctx.getRuntimeConfig()` uit de toolcontext binnen
    `execute` gebruiken, zodat een tool die vóór een configuratieschrijving is aangemaakt nog steeds de vernieuwde
    runtimeconfiguratie ziet.

    Configuratieschrijfbewerkingen moeten via de transactionele helpers verlopen en een
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
    dat de wijziging een schone gatewayherstart vereist, en
    `afterWrite: { mode: "none", reason: "..." }` alleen wanneer de aanroeper eigenaar is van de
    opvolging en de herlaadplanner bewust wil onderdrukken.
    Mutatieresultaten bevatten een getypeerde `followUp`-samenvatting voor tests en logging;
    de gateway blijft verantwoordelijk voor het toepassen of plannen van de herstart.
    `loadConfig` en `writeConfigFile` blijven als verouderde compatibiliteitshelpers
    voor externe plugins tijdens de migratieperiode en waarschuwen eenmaal met
    de compatibiliteitscode `runtime-config-load-write`. Gebundelde plugins en runtimecode
    in de repo worden beschermd door scannerguardrails in
    `pnpm check:deprecated-api-usage` en
    `pnpm check:no-runtime-action-load-config`: nieuw gebruik in productieplugins
    faalt direct, directe configuratieschrijfbewerkingen falen, gatewayservermethoden moeten
    de runtime-snapshot van het verzoek gebruiken, runtimehelpers voor kanaalverzending/actie/client
    moeten configuratie van hun grens ontvangen, en langlevende runtimemodules hebben
    nul toegestane ambient `loadConfig()`-aanroepen.

    Nieuwe plugincode moet ook vermijden om de brede compatibiliteitsbarrel
    `openclaw/plugin-sdk/config-runtime` te importeren. Gebruik het smalle
    SDK-subpad dat past bij de taak:

    | Behoefte | Import |
    | --- | --- |
    | Configuratietypen zoals `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Asserties voor al geladen configuratie en configuratie-lookup voor pluginvermeldingen | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lezen van huidige runtime-snapshot | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Configuratieschrijfbewerkingen | `openclaw/plugin-sdk/config-mutation` |
    | Helpers voor sessiestore | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown-tabelconfiguratie | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Runtimehelpers voor groepsbeleid | `openclaw/plugin-sdk/runtime-group-policy` |
    | Oplossing van geheime invoer | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model-/sessie-overschrijvingen | `openclaw/plugin-sdk/model-session-runtime` |

    Gebundelde plugins en hun tests worden door scanners beschermd tegen de brede
    barrel, zodat imports en mocks lokaal blijven voor het gedrag dat ze nodig hebben. De brede
    barrel bestaat nog steeds voor externe compatibiliteit, maar nieuwe code mag er niet
    van afhankelijk zijn.

  </Step>

  <Step title="Pi-toolresultaatextensies naar middleware migreren">
    Gebundelde plugins moeten Pi-only
    `api.registerEmbeddedExtensionFactory(...)`-toolresulthandlers vervangen door
    runtime-neutrale middleware.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Werk tegelijkertijd het pluginmanifest bij:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Externe plugins kunnen geen toolresultaatmiddleware registreren, omdat die
    tooluitvoer met hoog vertrouwen kan herschrijven voordat het model die ziet.

  </Step>

  <Step title="Approval-native handlers naar capability-feiten migreren">
    Kanaalplugins met approval-ondersteuning stellen native approvalgedrag nu beschikbaar via
    `approvalCapability.nativeRuntime` plus de gedeelde runtime-contextregistry.

    Belangrijke wijzigingen:

    - Vervang `approvalCapability.handler.loadRuntime(...)` door
      `approvalCapability.nativeRuntime`
    - Verplaats approval-specifieke auth/delivery van legacy `plugin.auth` /
      `plugin.approvals`-bedrading naar `approvalCapability`
    - `ChannelPlugin.approvals` is verwijderd uit het publieke channel-plugincontract;
      verplaats delivery/native/render-velden naar `approvalCapability`
    - `plugin.auth` blijft alleen voor kanaal-login-/logoutflows; approval-auth
      hooks daar worden niet langer door de kern gelezen
    - Registreer runtimeobjecten die eigendom zijn van het kanaal, zoals clients, tokens of Bolt-
      apps, via `openclaw/plugin-sdk/channel-runtime-context`
    - Verstuur geen plugin-eigen omleidingsmeldingen vanuit native approvalhandlers;
      de kern beheert nu routed-elsewhere-meldingen vanuit daadwerkelijke deliveryresultaten
    - Geef bij het doorgeven van `channelRuntime` aan `createChannelManager(...)` een
      echt `createPluginRuntime().channel`-oppervlak op. Gedeeltelijke stubs worden geweigerd.

    Zie `/plugins/sdk-channel-plugins` voor de huidige indeling van approval-capabilities.

  </Step>

  <Step title="Fallbackgedrag van Windows-wrappers auditen">
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

    Als je aanroeper niet bewust op shellfallback vertrouwt, stel
    `allowShellFallback` dan niet in en verwerk in plaats daarvan de gegooide fout.

  </Step>

  <Step title="Verouderde imports vinden">
    Doorzoek je plugin op imports uit een van beide verouderde oppervlakken:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Vervangen door gerichte imports">
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

    Gebruik voor host-side helpers de geïnjecteerde pluginruntime in plaats van direct te
    importeren:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Hetzelfde patroon geldt voor andere legacy bridgehelpers:

    | Oude import | Modern equivalent |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helpers voor sessiestore | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Brede infra-runtime-imports vervangen">
    `openclaw/plugin-sdk/infra-runtime` bestaat nog steeds voor externe
    compatibiliteit, maar nieuwe code moet het gerichte helperoppervlak importeren dat die
    daadwerkelijk nodig heeft:

    | Behoefte | Import |
    | --- | --- |
    | Helpers voor systeemeventqueue | `openclaw/plugin-sdk/system-event-runtime` |
    | Helpers voor Heartbeat wake, event en zichtbaarheid | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Drain van wachtrij voor pending delivery | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetrie voor kanaalactiviteit | `openclaw/plugin-sdk/channel-activity-runtime` |
    | In-memory dedupecaches | `openclaw/plugin-sdk/dedupe-runtime` |
    | Veilige helpers voor lokale bestands-/mediapaden | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher-aware fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Proxy- en guarded fetch-helpers | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF-dispatcherbeleidstypen | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Typen voor approvalverzoek/-oplossing | `openclaw/plugin-sdk/approval-runtime` |
    | Helpers voor approval-antwoordpayload en opdrachten | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helpers voor foutopmaak | `openclaw/plugin-sdk/error-runtime` |
    | Wachttijden voor transportgereedheid | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helpers voor veilige tokens | `openclaw/plugin-sdk/secure-random-runtime` |
    | Begrensde async taakconcurrency | `openclaw/plugin-sdk/concurrency-runtime` |
    | Numerieke coercion | `openclaw/plugin-sdk/number-runtime` |
    | Process-local async lock | `openclaw/plugin-sdk/async-lock-runtime` |
    | Bestandslocks | `openclaw/plugin-sdk/file-lock` |

    Gebundelde plugins worden door scanners beschermd tegen `infra-runtime`, zodat repocode
    niet kan terugvallen naar de brede barrel.

  </Step>

  <Step title="Kanaalroutehelpers migreren">
    Nieuwe kanaalroutecode moet `openclaw/plugin-sdk/channel-route` gebruiken.
    De oudere route-key- en comparable-target-namen blijven compatibiliteitsaliassen
    tijdens de migratieperiode, maar nieuwe plugins moeten de routenamen gebruiken
    die het gedrag direct beschrijven:

    | Oude helper | Moderne helper |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    De moderne routehelpers normaliseren `{ channel, to, accountId, threadId }`
    consistent voor native goedkeuringen, onderdrukking van antwoorden, inkomende deduplicatie,
    cronlevering en sessieroutering. Als je plugin aangepaste doelgrammatica
    beheert, gebruik dan `resolveChannelRouteTargetWithParser(...)` om die
    parser aan te passen aan hetzelfde routedoelcontract.

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
  | `plugin-sdk/setup` | Gedeelde helpers voor de configuratiewizard | Prompts voor allowlist, builders voor configuratiestatus |
  | `plugin-sdk/setup-runtime` | Runtimehelpers voor configuratietijd | Importveilige adapters voor configuratiepatches, helpers voor opzoeknotities, `promptResolvedAllowFrom`, `splitSetupEntries`, gedelegeerde configuratieproxies |
  | `plugin-sdk/setup-adapter-runtime` | Verouderde alias voor configuratieadapter | Gebruik `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Helpers voor configuratietooling | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers voor meerdere accounts | Helpers voor accountlijst/configuratie/actiegate |
  | `plugin-sdk/account-id` | Helpers voor account-ID's | `DEFAULT_ACCOUNT_ID`, normalisatie van account-ID's |
  | `plugin-sdk/account-resolution` | Helpers voor accounts opzoeken | Helpers voor accounts opzoeken + standaardfallback |
  | `plugin-sdk/account-helpers` | Smalle accounthelpers | Helpers voor accountlijst/accountactie |
  | `plugin-sdk/channel-setup` | Adapters voor configuratiewizard | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitieven voor DM-koppeling | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Wiring voor antwoordprefix, typen en bronlevering | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Factories voor configuratieadapters en helpers voor DM-toegang | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Builders voor configuratieschema's | Alleen gedeelde primitieven voor kanaalconfiguratieschema's en de generieke builder |
  | `plugin-sdk/bundled-channel-config-schema` | Meegeleverde configuratieschema's | Alleen door OpenClaw onderhouden meegeleverde plugins; nieuwe plugins moeten Plugin-lokale schema's definiëren |
  | `plugin-sdk/channel-config-schema-legacy` | Verouderde meegeleverde configuratieschema's | Alleen compatibiliteitsalias; gebruik `plugin-sdk/bundled-channel-config-schema` voor onderhouden meegeleverde plugins |
  | `plugin-sdk/telegram-command-config` | Helpers voor Telegram-commandoconfiguratie | Normalisatie van commandonamen, bijsnijden van beschrijvingen, validatie van duplicaten/conflicten |
  | `plugin-sdk/channel-policy` | Beleidsresolutie voor groep/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helpers voor accountstatus en levenscyclus van conceptstream | `createAccountStatusSink`, helpers voor finalisatie van conceptpreview |
  | `plugin-sdk/inbound-envelope` | Helpers voor inkomende enveloppen | Gedeelde route- en envelopbuilderhelpers |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers voor inkomende antwoorden | Gedeelde helpers voor vastleggen en dispatchen |
  | `plugin-sdk/messaging-targets` | Parsing van messagingdoelen | Helpers voor doelparsing/-matching |
  | `plugin-sdk/outbound-media` | Helpers voor uitgaande media | Gedeeld laden van uitgaande media |
  | `plugin-sdk/outbound-send-deps` | Helpers voor uitgaande verzendafhankelijkheden | Lichtgewicht opzoeken van `resolveOutboundSendDep` zonder de volledige uitgaande runtime te importeren |
  | `plugin-sdk/outbound-runtime` | Helpers voor uitgaande runtime | Helpers voor uitgaande levering, identiteit/verzenddelegatie, sessie, formatting en payloadplanning |
  | `plugin-sdk/thread-bindings-runtime` | Helpers voor threadbinding | Helpers voor levenscyclus en adapters van threadbinding |
  | `plugin-sdk/agent-media-payload` | Verouderde helpers voor mediapayloads | Builder voor agentmediapayloads voor verouderde veldindelingen |
  | `plugin-sdk/channel-runtime` | Verouderde compatibiliteitsshim | Alleen verouderde kanaalruntimehulpprogramma's |
  | `plugin-sdk/channel-send-result` | Typen voor verzendresultaten | Typen voor antwoordresultaten |
  | `plugin-sdk/runtime-store` | Persistente Plugin-opslag | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Brede runtimehelpers | Helpers voor runtime/logging/back-up/Plugin-installatie |
  | `plugin-sdk/runtime-env` | Smalle helpers voor runtimeomgeving | Helpers voor logger/runtimeomgeving, timeout, opnieuw proberen en backoff |
  | `plugin-sdk/plugin-runtime` | Gedeelde helpers voor Plugin-runtime | Helpers voor Plugin-commando's/hooks/http/interactief |
  | `plugin-sdk/hook-runtime` | Helpers voor hookpipeline | Gedeelde helpers voor Webhook/interne hookpipeline |
  | `plugin-sdk/lazy-runtime` | Luie runtimehelpers | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Proceshelpers | Gedeelde exechelpers |
  | `plugin-sdk/cli-runtime` | CLI-runtimehelpers | Helpers voor commando-opmaak, wachten, versies |
  | `plugin-sdk/gateway-runtime` | Gateway-helpers | Gateway-client, starthelper voor event-loop-ready en helpers voor kanaalstatuspatches |
  | `plugin-sdk/config-runtime` | Verouderde shim voor configuratiecompatibiliteit | Geef de voorkeur aan `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` en `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Helpers voor Telegram-commando's | Fallback-stabiele helpers voor validatie van Telegram-commando's wanneer het meegeleverde contractoppervlak van Telegram niet beschikbaar is |
  | `plugin-sdk/approval-runtime` | Helpers voor goedkeuringsprompts | Payload voor exec/Plugin-goedkeuring, helpers voor goedkeuringscapaciteit/-profiel, native goedkeuringsrouting/runtimehelpers en gestructureerde opmaak van weergavepaden voor goedkeuringen |
  | `plugin-sdk/approval-auth-runtime` | Helpers voor goedkeuringsauthenticatie | Oplossing van goedkeurders, actie-authenticatie in dezelfde chat |
  | `plugin-sdk/approval-client-runtime` | Helpers voor goedkeuringsclient | Native helpers voor exec-goedkeuringsprofiel/-filter |
  | `plugin-sdk/approval-delivery-runtime` | Helpers voor goedkeuringslevering | Native adapters voor goedkeuringscapaciteit/-levering |
  | `plugin-sdk/approval-gateway-runtime` | Helpers voor goedkeurings-Gateway | Gedeelde helper voor resolutie van goedkeurings-Gateway |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpers voor goedkeuringsadapter | Lichtgewicht helpers voor het laden van native goedkeuringsadapters voor hete kanaalentrypoints |
  | `plugin-sdk/approval-handler-runtime` | Helpers voor goedkeuringshandler | Bredere runtimehelpers voor goedkeuringshandlers; geef de voorkeur aan de smallere adapter-/Gateway-naden wanneer die voldoende zijn |
  | `plugin-sdk/approval-native-runtime` | Helpers voor goedkeuringsdoel | Native helpers voor binding van goedkeuringsdoel/account |
  | `plugin-sdk/approval-reply-runtime` | Helpers voor goedkeuringsantwoord | Payloadhelpers voor exec/Plugin-goedkeuringsantwoord |
  | `plugin-sdk/channel-runtime-context` | Helpers voor kanaalruntimecontext | Generieke helpers voor registreren/ophalen/bewaken van kanaalruntimecontext |
  | `plugin-sdk/security-runtime` | Beveiligingshelpers | Gedeelde helpers voor vertrouwen, DM-gating, root-begrensde bestanden/paden, externe content en geheimverzameling |
  | `plugin-sdk/ssrf-policy` | Helpers voor SSRF-beleid | Helpers voor hostallowlist en privénetwerkbeleid |
  | `plugin-sdk/ssrf-runtime` | Helpers voor SSRF-runtime | Vastgezette dispatcher, bewaakte fetch, helpers voor SSRF-beleid |
  | `plugin-sdk/system-event-runtime` | Helpers voor systeemevents | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat-helpers | Helpers voor Heartbeat-wekken, events en zichtbaarheid |
  | `plugin-sdk/delivery-queue-runtime` | Helpers voor leveringswachtrij | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Helpers voor kanaalactiviteit | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Dedupe-helpers | In-memory dedupe-caches |
  | `plugin-sdk/file-access-runtime` | Helpers voor bestandstoegang | Veilige helpers voor lokale bestands-/mediapaden |
  | `plugin-sdk/transport-ready-runtime` | Helpers voor transportgereedheid | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Helpers voor begrensde cache | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers voor diagnostische gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers voor foutopmaak | `formatUncaughtError`, `isApprovalNotFoundError`, helpers voor foutgrafen |
  | `plugin-sdk/fetch-runtime` | Helpers voor gewrapte fetch/proxy | `resolveFetch`, proxyhelpers, helpers voor EnvHttpProxyAgent-opties |
  | `plugin-sdk/host-runtime` | Helpers voor hostnormalisatie | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers voor opnieuw proberen | `RetryConfig`, `retryAsync`, beleidsrunners |
  | `plugin-sdk/allow-from` | Allowlist-opmaak | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapping van allowlist-invoer | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Helpers voor commandogating en commando-oppervlak | `resolveControlCommandGate`, helpers voor zenderautorisatie, helpers voor commandoregistratie inclusief opmaak van dynamische argumentmenu's |
  | `plugin-sdk/command-status` | Renderers voor commandostatus/help | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing van geheime invoer | Helpers voor geheime invoer |
  | `plugin-sdk/webhook-ingress` | Helpers voor Webhook-aanvragen | Hulpprogramma's voor Webhook-doelen |
  | `plugin-sdk/webhook-request-guards` | Helpers voor Webhook-bodyguard | Helpers voor lezen/limiteren van requestbody |
  | `plugin-sdk/reply-runtime` | Gedeelde antwoordruntime | Inkomende dispatch, Heartbeat, antwoordplanner, opdelen |
  | `plugin-sdk/reply-dispatch-runtime` | Smalle helpers voor antwoorddispatch | Finaliseren, providerdispatch en helpers voor gesprekslabels |
  | `plugin-sdk/reply-history` | Helpers voor antwoordgeschiedenis | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planning van antwoordreferenties | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers voor antwoordchunks | Helpers voor opdelen van tekst/markdown |
  | `plugin-sdk/session-store-runtime` | Helpers voor sessiestore | Storepad + updated-at-helpers |
  | `plugin-sdk/state-paths` | Helpers voor statuspaden | Helpers voor status- en OAuth-directory |
  | `plugin-sdk/routing` | Helpers voor routing/sessiesleutels | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers voor normalisatie van sessiesleutels |
  | `plugin-sdk/status-helpers` | Helpers voor kanaalstatus | Builders voor samenvattingen van kanaal-/accountstatus, standaardwaarden voor runtimestatus, helpers voor issuemetadata |
  | `plugin-sdk/target-resolver-runtime` | Helpers voor doelresolver | Gedeelde helpers voor doelresolver |
  | `plugin-sdk/string-normalization-runtime` | Helpers voor tekenreeksnormalisatie | Helpers voor slug-/tekenreeksnormalisatie |
  | `plugin-sdk/request-url` | Helpers voor request-URL's | Tekenreeks-URL's uit request-achtige invoer extraheren |
  | `plugin-sdk/run-command` | Helpers voor getimede commando's | Runner voor getimede commando's met genormaliseerde stdout/stderr |
  | `plugin-sdk/param-readers` | Paramlezers | Algemene paramlezers voor tool/CLI |
  | `plugin-sdk/tool-payload` | Extractie van toolpayload | Extraheer genormaliseerde payloads uit toolresultaatobjecten |
  | `plugin-sdk/tool-send` | Extractie van toolverzending | Extraheer canonieke velden voor verzenddoelen uit toolargumenten |
  | `plugin-sdk/temp-path` | Helpers voor tijdelijk pad | Gedeelde helpers voor tijdelijke downloadpaden |
  | `plugin-sdk/logging-core` | Loghelpers | Subsysteemlogger en redactiehelpers |
  | `plugin-sdk/markdown-table-runtime` | Markdown-tabelhelpers | Helpers voor Markdown-tabelmodus |
  | `plugin-sdk/reply-payload` | Typen voor berichtantwoord | Typen voor antwoordpayload |
  | `plugin-sdk/provider-setup` | Gecureerde helpers voor lokale/zelfgehoste providerinstelling | Helpers voor ontdekking/configuratie van zelfgehoste providers |
  | `plugin-sdk/self-hosted-provider-setup` | Gerichte OpenAI-compatibele helpers voor zelfgehoste providerinstelling | Dezelfde helpers voor ontdekking/configuratie van zelfgehoste providers |
  | `plugin-sdk/provider-auth-runtime` | Runtime-authenticatiehelpers voor providers | Helpers voor API-sleutelresolutie tijdens runtime |
  | `plugin-sdk/provider-auth-api-key` | Instelhelpers voor provider-API-sleutels | Helpers voor API-sleutelonboarding/profielschrijven |
  | `plugin-sdk/provider-auth-result` | Helpers voor provider-auth-resultaten | Standaard OAuth-auth-resultaatbouwer |
  | `plugin-sdk/provider-selection-runtime` | Providerselectiehelpers | Geconfigureerde-of-automatische providerselectie en samenvoeging van ruwe providerconfiguratie |
  | `plugin-sdk/provider-env-vars` | Helpers voor provider-env-vars | Helpers voor opzoeken van provider-auth-env-vars |
  | `plugin-sdk/provider-model-shared` | Gedeelde helpers voor providermodel/replay | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gedeelde bouwers voor replaybeleid, provider-endpointhelpers en helpers voor model-id-normalisatie |
  | `plugin-sdk/provider-catalog-shared` | Gedeelde helpers voor providercatalogus | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches voor provideronboarding | Helpers voor onboardingconfiguratie |
  | `plugin-sdk/provider-http` | HTTP-helpers voor providers | Generieke HTTP-/endpoint-capabilityhelpers voor providers, inclusief multipart-formulierhelpers voor audiotranscriptie |
  | `plugin-sdk/provider-web-fetch` | Helpers voor provider-web-fetch | Registratie-/cachehelpers voor web-fetch-providers |
  | `plugin-sdk/provider-web-search-config-contract` | Configuratiehelpers voor provider-webzoekopdrachten | Smalle configuratie-/credentialhelpers voor webzoekopdrachten voor providers die geen plugin-enable-bedrading nodig hebben |
  | `plugin-sdk/provider-web-search-contract` | Contracthelpers voor provider-webzoekopdrachten | Smalle configuratie-/credentialcontracthelpers voor webzoekopdrachten, zoals `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` en gescopete credential-setters/getters |
  | `plugin-sdk/provider-web-search` | Helpers voor provider-webzoekopdrachten | Registratie-/cache-/runtimehelpers voor webzoekproviders |
  | `plugin-sdk/provider-tools` | Compatibiliteitshelpers voor providertools/schema's | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` en Gemini-schemaopschoning + diagnostiek |
  | `plugin-sdk/provider-usage` | Providergebruikshelpers | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` en andere providergebruikshelpers |
  | `plugin-sdk/provider-stream` | Helpers voor providerstream-wrappers | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typen voor stream-wrappers en gedeelde wrapperhelpers voor Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Providertransporthelpers | Native providertransporthelpers zoals bewaakte fetch, transportberichttransformaties en schrijfbare transporteventstreams |
  | `plugin-sdk/keyed-async-queue` | Geordende asynchrone wachtrij | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Gedeelde mediahelpers | Helpers voor media ophalen/transformeren/opslaan, ffprobe-ondersteunde probing van videoafmetingen en bouwers voor mediapayloads |
  | `plugin-sdk/media-generation-runtime` | Gedeelde helpers voor mediageneratie | Gedeelde failoverhelpers, kandidaatselectie en berichten bij ontbrekende modellen voor generatie van afbeeldingen/video/muziek |
  | `plugin-sdk/media-understanding` | Helpers voor mediabegrip | Providertypen voor mediabegrip plus providergerichte exports voor afbeelding-/audiohelpers |
  | `plugin-sdk/text-runtime` | Verouderde brede compatibiliteitsexport voor tekst | Gebruik `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` en `logging-core` |
  | `plugin-sdk/text-chunking` | Helpers voor tekstchunking | Helper voor chunking van uitgaande tekst |
  | `plugin-sdk/speech` | Spraakhelpers | Spraakprovidertypen plus providergerichte directive-, registry- en validatiehelpers, en OpenAI-compatibele TTS-bouwer |
  | `plugin-sdk/speech-core` | Gedeelde spraakkern | Spraakprovidertypen, registry, directives, normalisatie |
  | `plugin-sdk/realtime-transcription` | Realtime transcriptiehelpers | Providertypen, registryhelpers en gedeelde WebSocket-sessiehelper |
  | `plugin-sdk/realtime-voice` | Realtime spraakhelpers | Providertypen, registry-/resolutiehelpers, bridgesessiehelpers, gedeelde talk-back-wachtrijen voor agents, transcript-/eventgezondheid, echo-onderdrukking en snelle contextconsulthelpers |
  | `plugin-sdk/image-generation` | Helpers voor afbeeldingsgeneratie | Providertypen voor afbeeldingsgeneratie plus helpers voor afbeeldingsassets/data-URL's en de OpenAI-compatibele afbeeldingsproviderbouwer |
  | `plugin-sdk/image-generation-core` | Gedeelde kern voor afbeeldingsgeneratie | Typen voor afbeeldingsgeneratie, failover, auth en registryhelpers |
  | `plugin-sdk/music-generation` | Helpers voor muziekgeneratie | Providertypen voor muziekgeneratie/aanvragen/resultaten |
  | `plugin-sdk/music-generation-core` | Gedeelde kern voor muziekgeneratie | Typen voor muziekgeneratie, failoverhelpers, provideropzoeking en model-ref-parsing |
  | `plugin-sdk/video-generation` | Helpers voor videogeneratie | Providertypen voor videogeneratie/aanvragen/resultaten |
  | `plugin-sdk/video-generation-core` | Gedeelde kern voor videogeneratie | Typen voor videogeneratie, failoverhelpers, provideropzoeking en model-ref-parsing |
  | `plugin-sdk/interactive-runtime` | Helpers voor interactief antwoord | Normalisatie/reductie van interactieve antwoordpayload |
  | `plugin-sdk/channel-config-primitives` | Channel-configuratieprimitieven | Smalle channel-configuratieschemaprimitieven |
  | `plugin-sdk/channel-config-writes` | Helpers voor channel-configuratieschrijven | Autorisatiehelpers voor channel-configuratieschrijven |
  | `plugin-sdk/channel-plugin-common` | Gedeelde channel-prelude | Gedeelde prelude-exports voor channel-Plugin |
  | `plugin-sdk/channel-status` | Channel-statushelpers | Gedeelde helpers voor channel-statussnapshot/samenvatting |
  | `plugin-sdk/allowlist-config-edit` | Configuratiehelpers voor allowlist | Helpers voor allowlist-configuratie bewerken/lezen |
  | `plugin-sdk/group-access` | Groepstoeganghelpers | Gedeelde beslissinghelpers voor groepstoegang |
  | `plugin-sdk/direct-dm` | Helpers voor directe DM | Gedeelde auth-/guardhelpers voor directe DM |
  | `plugin-sdk/extension-shared` | Gedeelde extensiehelpers | Primitieven voor passieve channel/status en omgevingsproxyhelpers |
  | `plugin-sdk/webhook-targets` | Helpers voor Webhook-doelen | Registry voor Webhook-doelen en route-installatiehelpers |
  | `plugin-sdk/webhook-path` | Verouderde alias voor Webhook-pad | Gebruik `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Gedeelde webmediahelpers | Helpers voor laden van remote/lokale media |
  | `plugin-sdk/zod` | Verouderde Zod-compatibiliteits-re-export | Importeer `zod` rechtstreeks uit `zod` |
  | `plugin-sdk/memory-core` | Gebundelde memory-core-helpers | Helperoppervlak voor memory manager/configuratie/bestand/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Runtimefacade voor memory-engine | Runtimefacade voor memory-index/zoeken |
  | `plugin-sdk/memory-core-host-engine-foundation` | Foundation-engine voor memory-host | Exports voor foundation-engine van memory-host |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding-engine voor memory-host | Memory-embeddingcontracten, registrytoegang, lokale provider en generieke batch-/remotehelpers; concrete remoteproviders staan in hun eigen plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD-engine voor memory-host | Exports voor QMD-engine van memory-host |
  | `plugin-sdk/memory-core-host-engine-storage` | Storage-engine voor memory-host | Exports voor storage-engine van memory-host |
  | `plugin-sdk/memory-core-host-multimodal` | Multimodale helpers voor memory-host | Multimodale helpers voor memory-host |
  | `plugin-sdk/memory-core-host-query` | Queryhelpers voor memory-host | Queryhelpers voor memory-host |
  | `plugin-sdk/memory-core-host-secret` | Geheimhelpers voor memory-host | Geheimhelpers voor memory-host |
  | `plugin-sdk/memory-core-host-events` | Verouderde memory-eventalias | Gebruik `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Statushelpers voor memory-host | Statushelpers voor memory-host |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI-runtime voor memory-host | CLI-runtimehelpers voor memory-host |
  | `plugin-sdk/memory-core-host-runtime-core` | Kernruntime voor memory-host | Kernruntimehelpers voor memory-host |
  | `plugin-sdk/memory-core-host-runtime-files` | Bestands-/runtimehelpers voor memory-host | Bestands-/runtimehelpers voor memory-host |
  | `plugin-sdk/memory-host-core` | Alias voor kernruntime van memory-host | Leverancieronafhankelijke alias voor kernruntimehelpers van memory-host |
  | `plugin-sdk/memory-host-events` | Alias voor eventjournal van memory-host | Leverancieronafhankelijke alias voor eventjournalhelpers van memory-host |
  | `plugin-sdk/memory-host-files` | Verouderde alias voor memory-bestand/runtime | Gebruik `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Beheerde Markdown-helpers | Gedeelde beheerde-Markdown-helpers voor memory-aangrenzende plugins |
  | `plugin-sdk/memory-host-search` | Facade voor Active Memory-zoeken | Lazy runtimefacade voor Active Memory-zoekmanager |
  | `plugin-sdk/memory-host-status` | Verouderde statusalias voor memory-host | Gebruik `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Testhulpprogramma's | Repo-lokale verouderde compatibiliteitsbarrel; gebruik gerichte repo-lokale testsubpaden zoals `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` en `plugin-sdk/test-fixtures` |
</Accordion>

Deze tabel is bewust de gemeenschappelijke migratiesubset, niet het volledige SDK-oppervlak. De inventaris van compiler-entrypoints staat in
`scripts/lib/plugin-sdk-entrypoints.json`; package-exports worden gegenereerd uit
de publieke subset.

Gereserveerde helper-seams voor gebundelde Plugins zijn uit de exportmap van de publieke SDK verwijderd, behalve expliciet gedocumenteerde compatibiliteitsfacades zoals de verouderde `plugin-sdk/discord`-shim die behouden blijft voor het gepubliceerde
`@openclaw/discord@2026.3.13`-pakket. Eigenaarsspecifieke helpers staan binnen het pakket van de beherende Plugin; gedeeld hostgedrag moet via generieke SDK-contracten verlopen, zoals `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`
en `plugin-sdk/plugin-config-runtime`.

Gebruik de smalste import die bij de taak past. Als je geen export kunt vinden,
controleer dan de bron in `src/plugin-sdk/` of vraag maintainers welk generiek contract
ervoor verantwoordelijk moet zijn.

## Actieve deprecations

Smallere deprecations die gelden voor de Plugin-SDK, het providercontract,
het runtime-oppervlak en het manifest. Ze werken vandaag nog allemaal, maar worden
in een toekomstige major release verwijderd. De vermelding onder elk item koppelt de oude API aan de canonieke vervanging.

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
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

  <Accordion title="Mention gating helpers → resolveInboundMentionDecision">
    **Oud**: `resolveInboundMentionRequirement({ facts, policy })` en
    `shouldDropInboundForMention(...)` uit
    `openclaw/plugin-sdk/channel-inbound` of
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nieuw**: `resolveInboundMentionDecision({ facts, policy })` - retourneert één
    beslissingsobject in plaats van twee gesplitste calls.

    Downstream kanaal-Plugins (Slack, Discord, Matrix, MS Teams) zijn al
    overgestapt.

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` is een compatibiliteitsshim voor oudere
    kanaal-Plugins. Importeer deze niet vanuit nieuwe code; gebruik
    `openclaw/plugin-sdk/channel-runtime-context` voor het registreren van runtime-objecten.

    `channelActions*`-helpers in `openclaw/plugin-sdk/channel-actions` zijn
    deprecated naast ruwe "actions"-kanaalexports. Stel capabilities in plaats daarvan
    beschikbaar via het semantische `presentation`-oppervlak - kanaal-Plugins
    declareren wat ze renderen (kaarten, knoppen, selecties) in plaats van welke ruwe
    actienamen ze accepteren.

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **Oud**: `tool()`-factory uit `openclaw/plugin-sdk/provider-web-search`.

    **Nieuw**: implementeer `createTool(...)` direct op de provider-Plugin.
    OpenClaw heeft de SDK-helper niet langer nodig om de tool-wrapper te registreren.

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **Oud**: `formatInboundEnvelope(...)` (en
    `ChannelMessageForAgent.channelEnvelope`) om een platte prompt-envelope in plaintext
    te bouwen uit inkomende kanaalberichten.

    **Nieuw**: `BodyForAgent` plus gestructureerde blokken met gebruikerscontext. Kanaal-Plugins
    voegen routeringsmetadata (thread, topic, reply-to, reacties) toe als
    getypeerde velden in plaats van ze samen te voegen tot een promptstring. De
    `formatAgentEnvelope(...)`-helper blijft ondersteund voor gesynthetiseerde
    assistant-gerichte envelopes, maar inkomende plaintext-envelopes verdwijnen
    geleidelijk.

    Betrokken gebieden: `inbound_claim`, `message_received` en elke aangepaste
    kanaal-Plugin die `channelEnvelope`-tekst nabewerkte.

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    Vier discovery-typealiassen zijn nu dunne wrappers rond de
    catalog-era-typen:

    | Oude alias                | Nieuw type                |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Plus de legacy statische `ProviderCapabilities`-bag - provider-Plugins
    moeten expliciete provider-hooks gebruiken, zoals `buildReplayPolicy`,
    `normalizeToolSchemas` en `wrapStreamFn`, in plaats van een statisch object.

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **Oud** (drie afzonderlijke hooks op `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` en
    `resolveDefaultThinkingLevel(ctx)`.

    **Nieuw**: één `resolveThinkingProfile(ctx)` die een
    `ProviderThinkingProfile` retourneert met de canonieke `id`, optionele `label` en
    gerangschikte levellijst. OpenClaw downgradet automatisch verouderde opgeslagen waarden
    op basis van profielrang.

    Implementeer één hook in plaats van drie. De legacy-hooks blijven werken tijdens
    de deprecation-periode, maar worden niet samengesteld met het profielresultaat.

  </Accordion>

  <Accordion title="External OAuth provider fallback → contracts.externalAuthProviders">
    **Oud**: `resolveExternalOAuthProfiles(...)` implementeren zonder
    de provider in het Plugin-manifest te declareren.

    **Nieuw**: declareer `contracts.externalAuthProviders` in het Plugin-manifest
    **en** implementeer `resolveExternalAuthProfiles(...)`. Het oude "auth
    fallback"-pad geeft tijdens runtime een waarschuwing en wordt verwijderd.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    **Oud** manifestveld: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nieuw**: spiegel dezelfde env-var-lookup naar `setup.providers[].envVars`
    in het manifest. Dit consolideert setup/status-env-metadata op één
    plek en voorkomt dat de Plugin-runtime moet starten alleen om env-var-lookups
    te beantwoorden.

    `providerAuthEnvVars` blijft ondersteund via een compatibiliteitsadapter
    tot de deprecation-periode sluit.

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **Oud**: drie afzonderlijke calls -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nieuw**: één call op de memory-state-API -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Dezelfde slots, één registratiecall. Additieve memory-helpers
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) worden niet geraakt.

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    Twee legacy-typealiassen worden nog geëxporteerd uit `src/plugins/runtime/types.ts`:

    | Oud                           | Nieuw                           |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    De runtime-methode `readSession` is deprecated ten gunste van
    `getSessionMessages`. Dezelfde signature; de oude methode roept door naar de
    nieuwe.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Oud**: `runtime.tasks.flow` (enkelvoud) retourneerde een live task-flow-accessor.

    **Nieuw**: `runtime.tasks.managedFlows` behoudt de beheerde TaskFlow-mutatie-runtime
    voor Plugins die child-taken vanuit een flow maken, bijwerken, annuleren of uitvoeren.
    Gebruik `runtime.tasks.flows` wanneer de Plugin alleen DTO-gebaseerde reads nodig heeft.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    Behandeld in "Migreren → Migreer Pi-tool-result-extensies naar
    middleware" hierboven. Hier opgenomen voor volledigheid: het verwijderde Pi-only
    `api.registerEmbeddedExtensionFactory(...)`-pad is vervangen door
    `api.registerAgentToolResultMiddleware(...)` met een expliciete runtime-lijst
    in `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
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
Deprecations op extensieniveau (binnen gebundelde kanaal-/provider-Plugins onder
`extensions/`) worden bijgehouden in hun eigen `api.ts`- en `runtime-api.ts`-barrels.
Ze hebben geen invloed op contracten van third-party Plugins en worden hier niet vermeld.
Als je de lokale barrel van een gebundelde Plugin rechtstreeks gebruikt, lees dan de
deprecation-opmerkingen in die barrel voordat je upgradet.
</Note>

## Verwijderingstijdlijn

| Wanneer                | Wat gebeurt er                                                        |
| ---------------------- | --------------------------------------------------------------------- |
| **Nu**                 | Deprecated oppervlakken geven runtime-waarschuwingen                  |
| **Volgende major release** | Deprecated oppervlakken worden verwijderd; Plugins die ze nog gebruiken falen |

Alle core-Plugins zijn al gemigreerd. Externe Plugins moeten migreren
vóór de volgende major release.

## De waarschuwingen tijdelijk onderdrukken

Stel deze omgevingsvariabelen in terwijl je aan de migratie werkt:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Dit is een tijdelijke uitweg, geen permanente oplossing.

## Gerelateerd

- [Aan de slag](/nl/plugins/building-plugins) - bouw je eerste Plugin
- [SDK-overzicht](/nl/plugins/sdk-overview) - volledige referentie voor subpad-imports
- [Kanaal-Plugins](/nl/plugins/sdk-channel-plugins) - kanaal-Plugins bouwen
- [Provider-Plugins](/nl/plugins/sdk-provider-plugins) - provider-Plugins bouwen
- [Plugin-internals](/nl/plugins/architecture) - diepgaande architectuuruitleg
- [Plugin-manifest](/nl/plugins/manifest) - referentie voor manifestschema
