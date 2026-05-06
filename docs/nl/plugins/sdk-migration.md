---
read_when:
    - Je ziet de waarschuwing OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Je ziet de waarschuwing OPENCLAW_EXTENSION_API_DEPRECATED
    - Je hebt api.registerEmbeddedExtensionFactory vóór OpenClaw 2026.4.25 gebruikt
    - Je werkt een Plugin bij naar de moderne Plugin-architectuur
    - Je onderhoudt een externe OpenClaw Plugin
sidebarTitle: Migrate to SDK
summary: Migreer van de verouderde laag voor achterwaartse compatibiliteit naar de moderne Plugin-SDK
title: Plugin SDK-migratie
x-i18n:
    generated_at: "2026-05-06T09:26:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: f629f6e3f9a0c122f3065d9b0b6b418e1c1ba29d42aff9ed025d61189be3e42a
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw is overgestapt van een brede laag voor achterwaartse compatibiliteit naar een moderne Plugin-architectuur met gerichte, gedocumenteerde imports. Als je Plugin vóór de nieuwe architectuur is gebouwd, helpt deze gids je bij de migratie.

## Wat verandert er

Het oude Plugin-systeem bood twee zeer open oppervlakken waarmee Plugins alles konden importeren wat ze nodig hadden vanuit één enkel toegangspunt:

- **`openclaw/plugin-sdk/compat`** - één import die tientallen helpers opnieuw exporteerde. Deze werd geïntroduceerd om oudere op hooks gebaseerde Plugins werkend te houden terwijl de nieuwe Plugin-architectuur werd gebouwd.
- **`openclaw/plugin-sdk/infra-runtime`** - een brede barrel met runtime-helpers die systeemgebeurtenissen, Heartbeat-status, afleverwachtrijen, fetch/proxy-helpers, bestandshelpers, goedkeuringstypen en niet-gerelateerde hulpprogramma's mengde.
- **`openclaw/plugin-sdk/config-runtime`** - een brede barrel voor configuratiecompatibiliteit die tijdens de migratieperiode nog verouderde directe load/write-helpers bevat.
- **`openclaw/extension-api`** - een bridge die Plugins directe toegang gaf tot host-side helpers zoals de ingesloten agent-runner.
- **`api.registerEmbeddedExtensionFactory(...)`** - een verwijderde, alleen voor Pi bedoelde gebundelde extension-hook die embedded-runner-gebeurtenissen zoals `tool_result` kon observeren.

De brede importoppervlakken zijn nu **verouderd**. Ze werken nog steeds tijdens runtime, maar nieuwe Plugins mogen ze niet gebruiken, en bestaande Plugins moeten migreren voordat de volgende major release ze verwijdert. De registratie-API voor embedded extension factories die alleen voor Pi was bedoeld, is verwijderd; gebruik in plaats daarvan tool-result-middleware.

OpenClaw verwijdert of herinterpreteert gedocumenteerd Plugin-gedrag niet in dezelfde wijziging die een vervanging introduceert. Breaking contractwijzigingen moeten eerst via een compatibiliteitsadapter, diagnostiek, documentatie en een deprecation-periode gaan. Dat geldt voor SDK-imports, manifestvelden, setup-API's, hooks en runtime-registratiegedrag.

<Warning>
  De laag voor achterwaartse compatibiliteit wordt in een toekomstige major release verwijderd.
  Plugins die nog steeds uit deze oppervlakken importeren, zullen dan breken.
  Alleen voor Pi bedoelde embedded extension factory-registraties worden nu al niet meer geladen.
</Warning>

## Waarom dit is veranderd

De oude aanpak veroorzaakte problemen:

- **Trage opstart** - het importeren van één helper laadde tientallen niet-gerelateerde modules
- **Circulaire afhankelijkheden** - brede re-exports maakten het gemakkelijk om importcycli te creëren
- **Onduidelijk API-oppervlak** - geen manier om te zien welke exports stabiel waren versus intern

De moderne Plugin-SDK lost dit op: elk importpad (`openclaw/plugin-sdk/\<subpath\>`) is een kleine, zelfstandige module met een duidelijk doel en gedocumenteerd contract.

Legacy provider-convenience-seams voor gebundelde kanalen zijn ook verdwenen. Channel-branded helper-seams waren private mono-repo-snelkoppelingen, geen stabiele Plugin-contracten. Gebruik in plaats daarvan smalle generieke SDK-subpaths. Houd binnen de gebundelde Plugin-workspace provider-owned helpers in de eigen `api.ts` of `runtime-api.ts` van die Plugin.

Huidige voorbeelden van gebundelde providers:

- Anthropic houdt Claude-specifieke streamhelpers in zijn eigen `api.ts` / `contract-api.ts`-seam
- OpenAI houdt provider builders, default-model-helpers en realtime provider builders in zijn eigen `api.ts`
- OpenRouter houdt provider builder- en onboarding/config-helpers in zijn eigen `api.ts`

## Migratieplan voor Talk en realtime voice

Realtime voice-, telefonie-, meeting- en browser-Talk-code wordt verplaatst van surface-local turn-boekhouding naar een gedeelde Talk-sessiecontroller die wordt geëxporteerd door `openclaw/plugin-sdk/realtime-voice`. De nieuwe controller beheert de algemene Talk-eventenvelope, actieve turn-status, capture-status, output-audiostatus, recente eventgeschiedenis en afwijzing van verouderde turns. Provider-Plugins moeten vendor-specifieke realtime sessies blijven beheren; surface-Plugins moeten capture, playback, telefonie en meeting-eigenaardigheden blijven beheren.

Deze Talk-migratie is bewust breaking-clean:

1. Houd de gedeelde controller/runtime-primitieven in `plugin-sdk/realtime-voice`.
2. Zet gebundelde oppervlakken over op de gedeelde controller: browser relay, managed-room handoff, voice-call realtime, voice-call streaming STT, Google Meet realtime en native push-to-talk.
3. Vervang oude Talk RPC-families door de uiteindelijke `talk.session.*`- en `talk.client.*`-API.
4. Adverteer één live Talk-eventkanaal in Gateway `hello-ok.features.events`: `talk.event`.
5. Verwijder het oude realtime HTTP-endpoint en elk request-time pad voor instruction override.

Nieuwe code mag `createTalkEventSequencer(...)` niet direct aanroepen, tenzij deze een low-level adapter of test fixture implementeert. Geef de voorkeur aan de gedeelde controller zodat turn-scoped events niet zonder turn id kunnen worden verzonden, verouderde `turnEnd` / `turnCancel`-aanroepen geen nieuwere actieve turn kunnen wissen, en output-audio lifecycle-events consistent blijven in telefonie, meetings, browser relay, managed-room handoff en native Talk-clients.

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

Browser-owned WebRTC/provider-websocket-sessies gebruiken `talk.client.create`, omdat de browser de provider-onderhandeling en het mediatransport beheert terwijl de Gateway credentials, instructies en toolbeleid beheert. `talk.session.*` is het algemene door Gateway beheerde oppervlak voor gateway-relay realtime, gateway-relay transcriptie en managed-room native STT/TTS-sessies.

Legacy configs die realtime selectors naast `talk.provider` / `talk.providers` plaatsten, moeten worden gerepareerd met `openclaw doctor --fix`; runtime Talk herinterpreteert speech/TTS-providerconfiguratie niet als realtime providerconfiguratie.

De ondersteunde combinaties voor `talk.session.create` zijn bewust klein:

| Modus           | Transport       | Brain           | Eigenaar           | Opmerkingen                                                                                                             |
| --------------- | --------------- | --------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Full-duplex provider-audio gebridged via de Gateway; tool calls worden gerouteerd via de agent-consult-tool.            |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Alleen streaming STT; aanroepers sturen inputaudio en ontvangen transcriptevents.                                       |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | Push-to-talk- en walkie-talkie-achtige rooms waarin de client capture/playback beheert en de Gateway turn-status beheert. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | Admin-only room-modus voor vertrouwde first-party oppervlakken die Gateway-toolacties direct uitvoeren.                  |

Verwijderde methodemapping:

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

Het uniforme control-vocabulaire is ook bewust smal:

| Methode                         | Van toepassing op                                      | Contract                                                                                                    |
| ------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Voeg een base64 PCM-audiochunk toe aan de providersessie die eigendom is van dezelfde Gateway-verbinding.   |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                | Start een user turn in een managed-room.                                                                    |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                | Beëindig de actieve turn na stale-turn-validatie.                                                           |
| `talk.session.cancelTurn`       | alle Gateway-owned sessies                            | Annuleer actief capture/provider/agent/TTS-werk voor een turn.                                              |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                              | Stop assistant-audio-output zonder noodzakelijkerwijs de user turn te beëindigen.                           |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                              | Voltooi een provider tool call die door de relay is verzonden.                                              |
| `talk.session.close`            | alle uniforme sessies                                 | Stop relay-sessies of trek managed-room-status in, en vergeet daarna de uniforme session id.                |

Introduceer geen provider- of platformspecial cases in core om dit te laten werken. Core beheert Talk-sessiesemantiek. Provider-Plugins beheren vendor session setup. Voice-call en Google Meet beheren telefonie-/meetingadapters. Browser- en native apps beheren device capture/playback UX.

## Compatibiliteitsbeleid

Voor externe Plugins volgt compatibiliteitswerk deze volgorde:

1. voeg het nieuwe contract toe
2. houd het oude gedrag aangesloten via een compatibiliteitsadapter
3. geef een diagnostic of warning die het oude pad en de vervanging noemt
4. dek beide paden af in tests
5. documenteer de deprecation en het migratiepad
6. verwijder pas na de aangekondigde migratieperiode, meestal in een major release

  Onderhouders kunnen de huidige migratiewachtrij controleren met
  `pnpm plugins:boundary-report`. Gebruik `pnpm plugins:boundary-report:summary` voor
  compacte aantallen, `--owner <id>` voor één Plugin of compatibiliteitseigenaar, en
  `pnpm plugins:boundary-report:ci` wanneer een CI-gate moet falen op vervallen
  compatibiliteitsrecords, gereserveerde SDK-imports tussen eigenaren, of ongebruikte gereserveerde SDK-
  subpaden. Het rapport groepeert verouderde
  compatibiliteitsrecords op verwijderdatum, telt lokale code-/docs-verwijzingen,
  toont gereserveerde SDK-imports tussen eigenaren, en vat de private
  memory-host SDK-bridge samen zodat compatibiliteitsopschoning expliciet blijft in plaats van
  te vertrouwen op ad-hoczoekacties. Gereserveerde SDK-subpaden moeten bijgehouden eigenaargebruik hebben;
  ongebruikte gereserveerde helper-exports moeten uit de openbare SDK worden verwijderd.

  Als een manifestveld nog wordt geaccepteerd, kunnen Plugin-auteurs het blijven gebruiken totdat
  de documentatie en diagnostiek iets anders zeggen. Nieuwe code moet de gedocumenteerde
  vervanging verkiezen, maar bestaande Plugins mogen niet breken tijdens gewone minor-
  releases.

  ## Migreren

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    Gebundelde Plugins moeten stoppen met het direct aanroepen van
    `api.runtime.config.loadConfig()` en
    `api.runtime.config.writeConfigFile(...)`. Geef de voorkeur aan configuratie die al
    aan het actieve aanroeppad is doorgegeven. Langlevende handlers die de
    huidige processnapshot nodig hebben, kunnen `api.runtime.config.current()` gebruiken. Langlevende
    agenttools moeten de `ctx.getRuntimeConfig()` van de toolcontext binnen
    `execute` gebruiken, zodat een tool die vóór een configuratieschrijfactie is gemaakt nog steeds de vernieuwde
    runtimeconfiguratie ziet.

    Configuratieschrijfacties moeten via de transactionele helpers lopen en een
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
    dat de wijziging een schone Gateway-herstart vereist, en
    `afterWrite: { mode: "none", reason: "..." }` alleen wanneer de aanroeper eigenaar is van de
    vervolgactie en de herlaadplanner bewust wil onderdrukken.
    Mutatieresultaten bevatten een getypte `followUp`-samenvatting voor tests en logging;
    de Gateway blijft verantwoordelijk voor het toepassen of plannen van de herstart.
    `loadConfig` en `writeConfigFile` blijven als verouderde compatibiliteits-
    helpers voor externe Plugins bestaan tijdens het migratievenster en waarschuwen eenmaal met
    de compatibiliteitscode `runtime-config-load-write`. Gebundelde Plugins en repo-
    runtimecode worden beschermd door scanner-guardrails in
    `pnpm check:deprecated-internal-config-api` en
    `pnpm check:no-runtime-action-load-config`: nieuw productiegebruik door Plugins
    faalt direct, directe configuratieschrijfacties falen, Gateway-servermethoden moeten de
    request-runtimesnapshot gebruiken, runtimehelpers voor kanaalverzending/actie/client
    moeten configuratie vanuit hun grens ontvangen, en langlevende runtimemodules hebben
    nul toegestane omgevingsaanroepen naar `loadConfig()`.

    Nieuwe Plugincode moet ook vermijden om de brede
    compatibiliteitsbarrel `openclaw/plugin-sdk/config-runtime` te importeren. Gebruik het smalle
    SDK-subpad dat bij de taak past:

    | Behoefte | Import |
    | --- | --- |
    | Configuratietypen zoals `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Asserties op al geladen configuratie en configuratie-opzoeking voor Plugin-entry | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Huidige runtimesnapshot-reads | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Configuratieschrijfacties | `openclaw/plugin-sdk/config-mutation` |
    | Helpers voor sessiestore | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown-tabelconfiguratie | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Runtimehelpers voor groepsbeleid | `openclaw/plugin-sdk/runtime-group-policy` |
    | Oplossing van geheime invoer | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model-/sessie-overschrijvingen | `openclaw/plugin-sdk/model-session-runtime` |

    Gebundelde Plugins en hun tests worden door scanners beschermd tegen de brede
    barrel, zodat imports en mocks lokaal blijven voor het gedrag dat ze nodig hebben. De brede
    barrel bestaat nog steeds voor externe compatibiliteit, maar nieuwe code moet er niet
    van afhankelijk zijn.

  </Step>

  <Step title="Migrate Pi tool-result extensions to middleware">
    Gebundelde Plugins moeten Pi-specifieke
    `api.registerEmbeddedExtensionFactory(...)`-toolresultaathandlers vervangen door
    runtime-neutrale middleware.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Werk tegelijkertijd het Pluginmanifest bij:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Externe Plugins kunnen geen toolresultaatmiddleware registreren, omdat deze
    tooluitvoer met hoog vertrouwen kan herschrijven voordat het model die ziet.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    Goedkeuringsgeschikte kanaal-Plugins tonen native goedkeuringsgedrag nu via
    `approvalCapability.nativeRuntime` plus het gedeelde runtime-contextregister.

    Belangrijkste wijzigingen:

    - Vervang `approvalCapability.handler.loadRuntime(...)` door
      `approvalCapability.nativeRuntime`
    - Verplaats goedkeuringsspecifieke auth/levering van legacy `plugin.auth` /
      `plugin.approvals`-bedrading naar `approvalCapability`
    - `ChannelPlugin.approvals` is verwijderd uit het openbare channel-plugin-
      contract; verplaats delivery/native/render-velden naar `approvalCapability`
    - `plugin.auth` blijft alleen voor kanaallogin-/logoutflows; goedkeuringsauth-
      hooks daar worden niet langer door core gelezen
    - Registreer kanaaleigen runtimeobjecten zoals clients, tokens of Bolt-
      apps via `openclaw/plugin-sdk/channel-runtime-context`
    - Verstuur geen Plugin-eigen omleidingsmeldingen vanuit native goedkeuringshandlers;
      core bezit nu meldingen voor elders gerouteerd op basis van werkelijke leveringsresultaten
    - Wanneer `channelRuntime` wordt doorgegeven aan `createChannelManager(...)`, lever dan een
      echt `createPluginRuntime().channel`-oppervlak. Gedeeltelijke stubs worden geweigerd.

    Zie `/plugins/sdk-channel-plugins` voor de huidige indeling van goedkeuringsmogelijkheden.

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    Als je Plugin `openclaw/plugin-sdk/windows-spawn` gebruikt, falen onopgeloste Windows-
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

    Als je aanroeper niet bewust afhankelijk is van shellfallback, stel
    `allowShellFallback` dan niet in en handel in plaats daarvan de gegooide fout af.

  </Step>

  <Step title="Find deprecated imports">
    Doorzoek je Plugin op imports uit een van beide verouderde oppervlakken:

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

    Gebruik voor host-side helpers de geïnjecteerde Pluginruntime in plaats van direct te importeren:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Hetzelfde patroon geldt voor andere legacy bridge-helpers:

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

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` bestaat nog steeds voor externe
    compatibiliteit, maar nieuwe code moet het gerichte helperoppervlak importeren dat deze
    echt nodig heeft:

    | Behoefte | Import |
    | --- | --- |
    | Helpers voor systeemgebeurteniswachtrijen | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat-gebeurtenis- en zichtbaarheidshelpers | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Leegmaken van wachtrij voor uitstaande leveringen | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetrie voor kanaalactiviteit | `openclaw/plugin-sdk/channel-activity-runtime` |
    | In-memory dedupe-caches | `openclaw/plugin-sdk/dedupe-runtime` |
    | Veilige helpers voor lokale bestands-/mediapaden | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher-bewuste fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Proxy- en bewaakte fetch-helpers | `openclaw/plugin-sdk/fetch-runtime` |
    | Typen voor SSRF-dispatcherbeleid | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Typen voor goedkeuringsverzoek/-oplossing | `openclaw/plugin-sdk/approval-runtime` |
    | Helpers voor goedkeuringsantwoordpayload en commando's | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helpers voor foutopmaak | `openclaw/plugin-sdk/error-runtime` |
    | Wachttijden voor transportgereedheid | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helpers voor veilige tokens | `openclaw/plugin-sdk/secure-random-runtime` |
    | Begrensde async taakconcurrency | `openclaw/plugin-sdk/concurrency-runtime` |
    | Numerieke coercion | `openclaw/plugin-sdk/number-runtime` |
    | Process-local async lock | `openclaw/plugin-sdk/async-lock-runtime` |
    | Bestandslocks | `openclaw/plugin-sdk/file-lock` |

    Gebundelde Plugins worden door scanners beschermd tegen `infra-runtime`, zodat repocode
    niet kan terugvallen naar de brede barrel.

  </Step>

  <Step title="Migrate channel route helpers">
    Nieuwe kanaalroutecode moet `openclaw/plugin-sdk/channel-route` gebruiken.
    De oudere namen voor route-key en comparable-target blijven tijdens het migratievenster als compatibiliteits-
    aliassen bestaan, maar nieuwe Plugins moeten de routenamen gebruiken
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
    consequent voor native goedkeuringen, antwoordonderdrukking, inkomende
    deduplicatie, Cron-levering en sessieroutering. Als je plugin aangepaste
    doelgrammatica beheert, gebruik dan `resolveChannelRouteTargetWithParser(...)`
    om die parser aan te passen aan hetzelfde routedoelcontract.

  </Step>

  <Step title="Bouwen en testen">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referentie voor importpaden

  <Accordion title="Tabel met veelvoorkomende importpaden">
  | Importpad | Doel | Belangrijkste exports |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Canonieke Plugin-entry-helper | `definePluginEntry` |
  | `plugin-sdk/core` | Verouderde overkoepelende re-export voor kanaal-entrydefinities/-builders | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export van rootschema voor configuratie | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Entry-helper voor enkele provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Gerichte kanaal-entrydefinities en builders | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Gedeelde helpers voor de installatiewizard | Allowlist-prompts, builders voor installatiestatus |
  | `plugin-sdk/setup-runtime` | Runtime-helpers voor tijdens installatie | Importveilige adapters voor installatiepatches, helpers voor opzoeknotities, `promptResolvedAllowFrom`, `splitSetupEntries`, gedelegeerde installatieproxy's |
  | `plugin-sdk/setup-adapter-runtime` | Helpers voor installatieadapters | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers voor installatietooling | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers voor meerdere accounts | Helpers voor accountlijst/configuratie/actiegate |
  | `plugin-sdk/account-id` | Helpers voor account-id | `DEFAULT_ACCOUNT_ID`, normalisatie van account-id |
  | `plugin-sdk/account-resolution` | Helpers voor accountopzoeking | Helpers voor accountopzoeking en standaard-fallback |
  | `plugin-sdk/account-helpers` | Smalle accounthelpers | Helpers voor accountlijst/accountactie |
  | `plugin-sdk/channel-setup` | Adapters voor installatiewizard | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitieven voor DM-koppeling | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Bekabeling voor antwoordprefix, typen en bronlevering | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fabrieken voor configuratieadapters en helpers voor DM-toegang | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Builders voor configuratieschema | Alleen gedeelde kanaalconfiguratie-schemaprimitieven en de generieke builder |
  | `plugin-sdk/bundled-channel-config-schema` | Gebundelde configuratieschema's | Alleen door OpenClaw onderhouden gebundelde Plugins; nieuwe Plugins moeten Plugin-lokale schema's definiëren |
  | `plugin-sdk/channel-config-schema-legacy` | Verouderde gebundelde configuratieschema's | Alleen compatibiliteitsalias; gebruik `plugin-sdk/bundled-channel-config-schema` voor onderhouden gebundelde Plugins |
  | `plugin-sdk/telegram-command-config` | Helpers voor Telegram-opdrachtconfiguratie | Normalisatie van opdrachtnamen, inkorten van beschrijvingen, validatie van duplicaten/conflicten |
  | `plugin-sdk/channel-policy` | Resolutie van groeps-/DM-beleid | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helpers voor accountstatus en lifecycle van conceptstream | `createAccountStatusSink`, helpers voor afronding van conceptvoorbeelden |
  | `plugin-sdk/inbound-envelope` | Helpers voor inkomende enveloppen | Gedeelde route- en envelopbuilderhelpers |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers voor inkomende antwoorden | Gedeelde helpers voor registreren en dispatchen |
  | `plugin-sdk/messaging-targets` | Parsen van berichtdoelen | Helpers voor parsen/matchen van doelen |
  | `plugin-sdk/outbound-media` | Helpers voor uitgaande media | Gedeeld laden van uitgaande media |
  | `plugin-sdk/outbound-send-deps` | Helpers voor afhankelijkheden van uitgaand verzenden | Lichtgewicht `resolveOutboundSendDep`-opzoeking zonder de volledige uitgaande runtime te importeren |
  | `plugin-sdk/outbound-runtime` | Helpers voor uitgaande runtime | Helpers voor uitgaande levering, identiteit/verzenddelegatie, sessie, opmaak en payloadplanning |
  | `plugin-sdk/thread-bindings-runtime` | Helpers voor thread-binding | Helpers voor lifecycle en adapters van thread-binding |
  | `plugin-sdk/agent-media-payload` | Verouderde helpers voor media-payloads | Builder voor agentmedia-payload voor verouderde veldindelingen |
  | `plugin-sdk/channel-runtime` | Verouderde compatibiliteitsshim | Alleen verouderde kanaalruntimehulpprogramma's |
  | `plugin-sdk/channel-send-result` | Typen voor verzendresultaten | Typen voor antwoordresultaten |
  | `plugin-sdk/runtime-store` | Persistente Plugin-opslag | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Brede runtime-helpers | Helpers voor runtime/logging/back-up/Plugin-installatie |
  | `plugin-sdk/runtime-env` | Smalle helpers voor runtime-omgeving | Logger/runtime-omgeving, timeout, retry en backoff-helpers |
  | `plugin-sdk/plugin-runtime` | Gedeelde helpers voor Plugin-runtime | Helpers voor Plugin-opdrachten/hooks/http/interactief |
  | `plugin-sdk/hook-runtime` | Helpers voor hook-pijplijn | Gedeelde helpers voor Webhook/interne hook-pijplijn |
  | `plugin-sdk/lazy-runtime` | Helpers voor lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Proceshelpers | Gedeelde exec-helpers |
  | `plugin-sdk/cli-runtime` | Helpers voor CLI-runtime | Opdrachtopmaak, wachttijden, versiehelpers |
  | `plugin-sdk/gateway-runtime` | Gateway-helpers | Gateway-client, starthulp voor event-loop-ready en helpers voor kanaalstatuspatches |
  | `plugin-sdk/config-runtime` | Verouderde shim voor configuratiecompatibiliteit | Geef de voorkeur aan `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` en `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Helpers voor Telegram-opdrachten | Fallback-stabiele helpers voor validatie van Telegram-opdrachten wanneer het gebundelde Telegram-contractoppervlak niet beschikbaar is |
  | `plugin-sdk/approval-runtime` | Helpers voor goedkeuringsprompt | Exec-/Plugin-goedkeuringspayload, helpers voor goedkeuringscapability/-profiel, native routing/runtime-helpers voor goedkeuring en gestructureerde opmaak van weergavepaden voor goedkeuring |
  | `plugin-sdk/approval-auth-runtime` | Helpers voor goedkeuringsauthenticatie | Resolutie van goedkeurder, actieauthenticatie in dezelfde chat |
  | `plugin-sdk/approval-client-runtime` | Helpers voor goedkeuringsclient | Native helpers voor exec-goedkeuringsprofiel/-filter |
  | `plugin-sdk/approval-delivery-runtime` | Helpers voor goedkeuringslevering | Native adapters voor goedkeuringscapability/-levering |
  | `plugin-sdk/approval-gateway-runtime` | Helpers voor goedkeurings-Gateway | Gedeelde helper voor Gateway-resolutie voor goedkeuring |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpers voor goedkeuringsadapter | Lichtgewicht helpers voor het laden van native goedkeuringsadapters voor hot kanaal-entrypoints |
  | `plugin-sdk/approval-handler-runtime` | Helpers voor goedkeuringshandler | Bredere runtime-helpers voor goedkeuringshandler; geef de voorkeur aan de smallere adapter-/Gateway-seams wanneer die genoeg zijn |
  | `plugin-sdk/approval-native-runtime` | Helpers voor goedkeuringsdoel | Native helpers voor binding van goedkeuringsdoel/account |
  | `plugin-sdk/approval-reply-runtime` | Helpers voor goedkeuringsantwoord | Helpers voor payload van exec-/Plugin-goedkeuringsantwoord |
  | `plugin-sdk/channel-runtime-context` | Helpers voor kanaalruntimecontext | Generieke helpers voor registreren/ophalen/bewaken van kanaalruntimecontext |
  | `plugin-sdk/security-runtime` | Beveiligingshelpers | Gedeelde helpers voor vertrouwen, DM-gating, root-begrensde bestanden/paden, externe content en geheimverzameling |
  | `plugin-sdk/ssrf-policy` | Helpers voor SSRF-beleid | Helpers voor host-allowlist en privatenetwerkbeleid |
  | `plugin-sdk/ssrf-runtime` | Helpers voor SSRF-runtime | Helpers voor vastgepinde dispatcher, bewaakte fetch en SSRF-beleid |
  | `plugin-sdk/system-event-runtime` | Helpers voor systeemgebeurtenissen | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat-helpers | Helpers voor Heartbeat-gebeurtenissen en zichtbaarheid |
  | `plugin-sdk/delivery-queue-runtime` | Helpers voor leveringswachtrij | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Helpers voor kanaalactiviteit | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Helpers voor deduplicatie | In-memory deduplicatiecaches |
  | `plugin-sdk/file-access-runtime` | Helpers voor bestandstoegang | Veilige helpers voor lokale bestands-/mediapaden |
  | `plugin-sdk/transport-ready-runtime` | Helpers voor transportgereedheid | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Helpers voor begrensde cache | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers voor diagnostische gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers voor foutopmaak | `formatUncaughtError`, `isApprovalNotFoundError`, helpers voor foutgrafen |
  | `plugin-sdk/fetch-runtime` | Helpers voor omwikkelde fetch/proxy | `resolveFetch`, proxyhelpers, optiehelpers voor EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Helpers voor hostnormalisatie | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Retry-helpers | `RetryConfig`, `retryAsync`, policyrunners |
  | `plugin-sdk/allow-from` | Allowlist-opmaak | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapping van allowlist-invoer | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Opdracht-gating en helpers voor opdrachtoppervlak | `resolveControlCommandGate`, helpers voor afzenderautorisatie, helpers voor opdrachtregister inclusief opmaak van dynamische argumentmenu's |
  | `plugin-sdk/command-status` | Renderers voor opdrachtstatus/help | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsen van geheime invoer | Helpers voor geheime invoer |
  | `plugin-sdk/webhook-ingress` | Helpers voor Webhook-verzoeken | Hulpprogramma's voor Webhook-doelen |
  | `plugin-sdk/webhook-request-guards` | Helpers voor Webhook-bodyguards | Helpers voor lezen/limiteren van verzoekbody |
  | `plugin-sdk/reply-runtime` | Gedeelde antwoordruntime | Inkomende dispatch, Heartbeat, antwoordplanner, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Smalle helpers voor antwoorddispatch | Helpers voor afronden, providerdispatch en gesprekslabels |
  | `plugin-sdk/reply-history` | Helpers voor antwoordgeschiedenis | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planning van antwoordreferenties | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers voor antwoordchunks | Helpers voor tekst-/markdownchunking |
  | `plugin-sdk/session-store-runtime` | Helpers voor sessieopslag | Helpers voor opslagpad en bijgewerkt-op |
  | `plugin-sdk/state-paths` | Helpers voor statuspaden | Helpers voor status- en OAuth-mappen |
  | `plugin-sdk/routing` | Helpers voor routing/sessiesleutel | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers voor normalisatie van sessiesleutels |
  | `plugin-sdk/status-helpers` | Helpers voor kanaalstatus | Builders voor samenvattingen van kanaal-/accountstatus, standaardwaarden voor runtime-status, helpers voor probleemmetadata |
  | `plugin-sdk/target-resolver-runtime` | Helpers voor doelresolver | Gedeelde helpers voor doelresolver |
  | `plugin-sdk/string-normalization-runtime` | Helpers voor tekenreeksnormalisatie | Helpers voor slug-/tekenreeksnormalisatie |
  | `plugin-sdk/request-url` | Helpers voor verzoek-URL | Haal tekenreeks-URL's uit verzoekachtige invoer |
  | `plugin-sdk/run-command` | Helpers voor getimede opdrachten | Runner voor getimede opdrachten met genormaliseerde stdout/stderr |
  | `plugin-sdk/param-readers` | Paramlezers | Algemene paramlezers voor tooling/CLI |
  | `plugin-sdk/tool-payload` | Tool-payloadextractie | Extraheer genormaliseerde payloads uit tool-resultaatobjecten |
  | `plugin-sdk/tool-send` | Tool-sendextractie | Extraheer canonieke velden voor het verzenddoel uit tool-argumenten |
  | `plugin-sdk/temp-path` | Helpers voor tijdelijke paden | Gedeelde padhelpers voor tijdelijke downloads |
  | `plugin-sdk/logging-core` | Logginghelpers | Subsystemlogger en helpers voor redactie |
  | `plugin-sdk/markdown-table-runtime` | Markdown-tabelhelpers | Helpers voor Markdown-tabelmodi |
  | `plugin-sdk/reply-payload` | Berichtantwoordtypen | Typen voor antwoordpayloads |
  | `plugin-sdk/provider-setup` | Samengestelde helpers voor lokale/zelfgehoste providerconfiguratie | Helpers voor detectie/configuratie van zelfgehoste providers |
  | `plugin-sdk/self-hosted-provider-setup` | Gerichte OpenAI-compatibele helpers voor zelfgehoste providerconfiguratie | Dezelfde helpers voor detectie/configuratie van zelfgehoste providers |
  | `plugin-sdk/provider-auth-runtime` | Helpers voor provider-runtimeauthenticatie | Runtimehelpers voor API-sleutelresolutie |
  | `plugin-sdk/provider-auth-api-key` | Helpers voor provider-API-sleutelconfiguratie | Helpers voor onboarding/profielschrijven van API-sleutels |
  | `plugin-sdk/provider-auth-result` | Helpers voor provider-authenticatieresultaten | Standaardbuilder voor OAuth-authenticatieresultaten |
  | `plugin-sdk/provider-auth-login` | Helpers voor interactieve providerlogin | Gedeelde helpers voor interactieve login |
  | `plugin-sdk/provider-selection-runtime` | Helpers voor providerselectie | Geconfigureerde-of-automatische providerselectie en samenvoegen van ruwe providerconfiguratie |
  | `plugin-sdk/provider-env-vars` | Helpers voor provideromgevingsvariabelen | Helpers voor opzoeken van provider-authenticatieomgevingsvariabelen |
  | `plugin-sdk/provider-model-shared` | Gedeelde helpers voor providermodel/replay | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gedeelde builders voor replaybeleid, helpers voor providerendpoints en helpers voor normalisatie van model-id's |
  | `plugin-sdk/provider-catalog-shared` | Gedeelde helpers voor providercatalogus | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches voor provideronboarding | Helpers voor onboardingconfiguratie |
  | `plugin-sdk/provider-http` | Provider-HTTP-helpers | Algemene helpers voor provider-HTTP/endpointmogelijkheden, inclusief multipart-formulierhelpers voor audiotranscriptie |
  | `plugin-sdk/provider-web-fetch` | Helpers voor provider-web-fetch | Helpers voor registratie/cache van web-fetchproviders |
  | `plugin-sdk/provider-web-search-config-contract` | Configuratiehelpers voor provider-web-search | Smalle configuratie-/credentialhelpers voor web-search voor providers die geen plugin-enable-bedrading nodig hebben |
  | `plugin-sdk/provider-web-search-contract` | Contracthelpers voor provider-web-search | Smalle configuratie-/credentialcontracthelpers voor web-search, zoals `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` en gescopete credentialsetters/-getters |
  | `plugin-sdk/provider-web-search` | Helpers voor provider-web-search | Helpers voor registratie/cache/runtime van web-searchproviders |
  | `plugin-sdk/provider-tools` | Compatibiliteitshelpers voor providertools/schema's | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-schemaopschoning + diagnostiek, en xAI-compatibiliteitshelpers zoals `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpers voor providergebruik | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` en andere helpers voor providergebruik |
  | `plugin-sdk/provider-stream` | Helpers voor providerstream-wrappers | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, stream-wrappertypen en gedeelde wrapperhelpers voor Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpers voor providertransport | Native providertransporthelpers zoals guarded fetch, transformaties van transportberichten en schrijfbare transporteventstreams |
  | `plugin-sdk/keyed-async-queue` | Geordende async-wachtrij | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Gedeelde mediahelpers | Helpers voor ophalen/transformeren/opslaan van media, door ffprobe ondersteunde detectie van videodimensies en mediapayloadbuilders |
  | `plugin-sdk/media-generation-runtime` | Gedeelde helpers voor mediageneratie | Gedeelde failoverhelpers, kandidaatselectie en berichten voor ontbrekende modellen voor beeld-/video-/muziekgeneratie |
  | `plugin-sdk/media-understanding` | Helpers voor mediabegrip | Providertypen voor mediabegrip plus providergerichte exports voor beeld-/audiohelpers |
  | `plugin-sdk/text-runtime` | Gedeelde teksthelpers | Verwijderen van voor de assistant zichtbare tekst, helpers voor markdown-rendering/chunking/tabellen, redactietools, helpers voor directivetags, safe-text-hulpprogramma's en gerelateerde tekst-/logginghelpers |
  | `plugin-sdk/text-chunking` | Tekstchunkinghelpers | Helper voor uitgaande tekstchunking |
  | `plugin-sdk/speech` | Spraakhelpers | Spraakprovidertypen plus providergerichte helpers voor directives, registry en validatie, en een OpenAI-compatibele TTS-builder |
  | `plugin-sdk/speech-core` | Gedeelde spraakkern | Spraakprovidertypen, registry, directives, normalisatie |
  | `plugin-sdk/realtime-transcription` | Helpers voor realtime transcriptie | Providertypen, registryhelpers en gedeelde WebSocket-sessiehelper |
  | `plugin-sdk/realtime-voice` | Helpers voor realtime stem | Providertypen, registry-/resolutiehelpers, bridgesessiehelpers, gedeelde agent-talk-back-wachtrijen, transcript-/eventgezondheid, echo-onderdrukking en snelle contextconsulthelpers |
  | `plugin-sdk/image-generation` | Helpers voor beeldgeneratie | Beeldgeneratieprovidertypen plus helpers voor beeldassets/data-URL's en de OpenAI-compatibele beeldproviderbuilder |
  | `plugin-sdk/image-generation-core` | Gedeelde kern voor beeldgeneratie | Typen voor beeldgeneratie, failover, auth en registryhelpers |
  | `plugin-sdk/music-generation` | Helpers voor muziekgeneratie | Provider-/aanvraag-/resultaattypen voor muziekgeneratie |
  | `plugin-sdk/music-generation-core` | Gedeelde kern voor muziekgeneratie | Typen voor muziekgeneratie, failoverhelpers, providerlookup en model-ref-parsing |
  | `plugin-sdk/video-generation` | Helpers voor videogeneratie | Provider-/aanvraag-/resultaattypen voor videogeneratie |
  | `plugin-sdk/video-generation-core` | Gedeelde kern voor videogeneratie | Typen voor videogeneratie, failoverhelpers, providerlookup en model-ref-parsing |
  | `plugin-sdk/interactive-runtime` | Helpers voor interactieve antwoorden | Normalisatie/reductie van interactieve antwoordpayloads |
  | `plugin-sdk/channel-config-primitives` | Primitieven voor kanaalconfiguratie | Smalle primitieven voor kanaalconfiguratieschema's |
  | `plugin-sdk/channel-config-writes` | Helpers voor schrijven van kanaalconfiguratie | Autorisatiehelpers voor schrijven van kanaalconfiguratie |
  | `plugin-sdk/channel-plugin-common` | Gedeelde kanaalprelude | Gedeelde prelude-exports voor kanaalplugins |
  | `plugin-sdk/channel-status` | Helpers voor kanaalstatus | Gedeelde helpers voor kanaalstatussnapshots/-samenvattingen |
  | `plugin-sdk/allowlist-config-edit` | Helpers voor allowlistconfiguratie | Helpers voor bewerken/lezen van allowlistconfiguratie |
  | `plugin-sdk/group-access` | Helpers voor groepstoegang | Gedeelde beslissingshelpers voor groepstoegang |
  | `plugin-sdk/direct-dm` | Helpers voor directe DM | Gedeelde auth-/guardhelpers voor directe DM |
  | `plugin-sdk/extension-shared` | Gedeelde extensiehelpers | Primitieven voor passief-kanaal/status en ambient-proxyhelpers |
  | `plugin-sdk/webhook-targets` | Webhook-doelhelpers | Webhook-doelregistry en helpers voor route-installatie |
  | `plugin-sdk/webhook-path` | Webhook-padhelpers | Helpers voor Webhook-padnormalisatie |
  | `plugin-sdk/web-media` | Gedeelde webmediahelpers | Helpers voor laden van externe/lokale media |
  | `plugin-sdk/zod` | Zod-herexport | Geherexporteerde `zod` voor gebruikers van de plugin-SDK |
  | `plugin-sdk/memory-core` | Gebundelde memory-core-helpers | Oppervlak voor memorymanager-/configuratie-/bestand-/CLI-helpers |
  | `plugin-sdk/memory-core-engine-runtime` | Runtimefacade voor memory-engine | Runtimefacade voor memoryindex/-zoekfunctie |
  | `plugin-sdk/memory-core-host-engine-foundation` | Memory-host foundation-engine | Exports voor memory-host foundation-engine |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Memory-host embedding-engine | Memory-embeddingcontracten, registrytoegang, lokale provider en algemene batch-/remotehelpers; concrete remoteproviders leven in hun eigen plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | Memory-host QMD-engine | Exports voor memory-host QMD-engine |
  | `plugin-sdk/memory-core-host-engine-storage` | Memory-host storage-engine | Exports voor memory-host storage-engine |
  | `plugin-sdk/memory-core-host-multimodal` | Multimodale helpers voor memory-host | Multimodale helpers voor memory-host |
  | `plugin-sdk/memory-core-host-query` | Queryhelpers voor memory-host | Queryhelpers voor memory-host |
  | `plugin-sdk/memory-core-host-secret` | Geheimhelpers voor memory-host | Geheimhelpers voor memory-host |
  | `plugin-sdk/memory-core-host-events` | Helpers voor eventjournal van memory-host | Helpers voor eventjournal van memory-host |
  | `plugin-sdk/memory-core-host-status` | Statushelpers voor memory-host | Statushelpers voor memory-host |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI-runtime voor memory-host | CLI-runtimehelpers voor memory-host |
  | `plugin-sdk/memory-core-host-runtime-core` | Kernruntime voor memory-host | Kernruntimehelpers voor memory-host |
  | `plugin-sdk/memory-core-host-runtime-files` | Bestands-/runtimehelpers voor memory-host | Bestands-/runtimehelpers voor memory-host |
  | `plugin-sdk/memory-host-core` | Alias voor kernruntime van memory-host | Leverancieronafhankelijke alias voor kernruntimehelpers van memory-host |
  | `plugin-sdk/memory-host-events` | Alias voor eventjournal van memory-host | Leverancieronafhankelijke alias voor helpers voor eventjournal van memory-host |
  | `plugin-sdk/memory-host-files` | Alias voor bestanden/runtime van memory-host | Leverancieronafhankelijke alias voor bestands-/runtimehelpers van memory-host |
  | `plugin-sdk/memory-host-markdown` | Beheerde markdownhelpers | Gedeelde managed-markdownhelpers voor memory-aangrenzende plugins |
  | `plugin-sdk/memory-host-search` | Active memory-zoekfacade | Lazy runtimefacade voor active-memory-zoekmanager |
  | `plugin-sdk/memory-host-status` | Alias voor status van memory-host | Leverancieronafhankelijke alias voor statushelpers van memory-host |
  | `plugin-sdk/testing` | Testhulpprogramma's | Verouderde brede compatibiliteitsbarrel; geef de voorkeur aan gerichte test-subpaden zoals `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` en `plugin-sdk/test-fixtures` |
</Accordion>

Deze tabel is bewust de gemeenschappelijke migratiesubset, niet het volledige SDK-oppervlak. De volledige lijst met meer dan 200 entrypoints staat in
`scripts/lib/plugin-sdk-entrypoints.json`.

Gereserveerde helper-koppelvlakken voor gebundelde Plugins zijn uit de publieke SDK-exportmap verwijderd, behalve expliciet gedocumenteerde compatibiliteitsfacades zoals de verouderde `plugin-sdk/discord`-shim die behouden blijft voor het gepubliceerde
`@openclaw/discord@2026.3.13`-pakket. Eigenaarsspecifieke helpers staan binnen het eigenaar-Pluginpakket; gedeeld hostgedrag moet verlopen via generieke SDK-contracten zoals `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` en `plugin-sdk/plugin-config-runtime`.

Gebruik de smalste import die bij de taak past. Als je geen export kunt vinden, controleer dan de bron in `src/plugin-sdk/` of vraag maintainers welk generiek contract ervoor verantwoordelijk moet zijn.

## Actieve deprecations

Smallere deprecations die gelden voor de Plugin-SDK, het providercontract, het runtime-oppervlak en het manifest. Ze werken vandaag nog allemaal, maar worden in een toekomstige major release verwijderd. De regel onder elk item koppelt de oude API aan de canonieke vervanging.

<AccordionGroup>
  <Accordion title="command-auth help-builders → command-status">
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

    **Nieuw**: `resolveInboundMentionDecision({ facts, policy })` - retourneert één beslissingsobject in plaats van twee gesplitste aanroepen.

    Downstream kanaal-Plugins (Slack, Discord, Matrix, MS Teams) zijn al overgestapt.

  </Accordion>

  <Accordion title="Channel runtime-shim en channel actions-helpers">
    `openclaw/plugin-sdk/channel-runtime` is een compatibiliteitsshim voor oudere
    kanaal-Plugins. Importeer dit niet vanuit nieuwe code; gebruik
    `openclaw/plugin-sdk/channel-runtime-context` voor het registreren van runtime-objecten.

    `channelActions*`-helpers in `openclaw/plugin-sdk/channel-actions` zijn
    deprecated naast ruwe "actions"-kanaalexports. Expose capabilities
    in plaats daarvan via het semantische `presentation`-oppervlak - kanaal-Plugins
    declareren wat ze renderen (kaarten, knoppen, selecties) in plaats van welke ruwe
    actienamen ze accepteren.

  </Accordion>

  <Accordion title="Webzoekprovider tool()-helper → createTool() op de Plugin">
    **Oud**: `tool()`-factory uit `openclaw/plugin-sdk/provider-web-search`.

    **Nieuw**: implementeer `createTool(...)` direct op de provider-Plugin.
    OpenClaw heeft de SDK-helper niet meer nodig om de tool-wrapper te registreren.

  </Accordion>

  <Accordion title="Plaintext channel-envelopes → BodyForAgent">
    **Oud**: `formatInboundEnvelope(...)` (en
    `ChannelMessageForAgent.channelEnvelope`) om een platte plaintext prompt-envelope
    te bouwen uit inkomende kanaalberichten.

    **Nieuw**: `BodyForAgent` plus gestructureerde gebruikerscontextblokken. Kanaal-Plugins
    voegen routeringsmetadata (thread, topic, reply-to, reactions) toe als
    getypte velden in plaats van ze aan elkaar te plakken in een promptstring. De
    `formatAgentEnvelope(...)`-helper blijft ondersteund voor gesynthetiseerde
    assistant-facing envelopes, maar inkomende plaintext envelopes verdwijnen
    geleidelijk.

    Betrokken gebieden: `inbound_claim`, `message_received` en elke aangepaste
    kanaal-Plugin die `channelEnvelope`-tekst post-processed heeft.

  </Accordion>

  <Accordion title="Providerdiscovery-typen → providercatalogustypen">
    Vier discovery-typealiassen zijn nu dunne wrappers over de
    catalog-era typen:

    | Oude alias                | Nieuw type                |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Plus de legacy statische `ProviderCapabilities`-bag - provider-Plugins
    moeten expliciete providerhooks gebruiken zoals `buildReplayPolicy`,
    `normalizeToolSchemas` en `wrapStreamFn` in plaats van een statisch object.

  </Accordion>

  <Accordion title="Thinking-policyhooks → resolveThinkingProfile">
    **Oud** (drie afzonderlijke hooks op `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` en
    `resolveDefaultThinkingLevel(ctx)`.

    **Nieuw**: één `resolveThinkingProfile(ctx)` die een
    `ProviderThinkingProfile` retourneert met de canonieke `id`, optionele `label` en
    gerangschikte levellijst. OpenClaw downgradet verouderde opgeslagen waarden automatisch op basis van profielrang.

    Implementeer één hook in plaats van drie. De legacy hooks blijven werken tijdens
    de deprecationperiode, maar worden niet samengevoegd met het profielresultaat.

  </Accordion>

  <Accordion title="Externe OAuth-providerfallback → contracts.externalAuthProviders">
    **Oud**: `resolveExternalOAuthProfiles(...)` implementeren zonder
    de provider in het Pluginmanifest te declareren.

    **Nieuw**: declareer `contracts.externalAuthProviders` in het Pluginmanifest
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

    **Nieuw**: spiegel dezelfde env-var lookup naar `setup.providers[].envVars`
    in het manifest. Dit consolideert setup/status-envmetadata op één
    plek en voorkomt dat de Pluginruntime moet starten alleen om env-var
    lookups te beantwoorden.

    `providerAuthEnvVars` blijft ondersteund via een compatibiliteitsadapter
    totdat de deprecationperiode sluit.

  </Accordion>

  <Accordion title="Memory Plugin-registratie → registerMemoryCapability">
    **Oud**: drie afzonderlijke aanroepen -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nieuw**: één aanroep op de memory-state API -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Dezelfde slots, één registratieaanroep. Additieve memory-helpers
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) worden niet beïnvloed.

  </Accordion>

  <Accordion title="Subagent session messages-typen hernoemd">
    Twee legacy typealiassen worden nog geëxporteerd vanuit `src/plugins/runtime/types.ts`:

    | Oud                           | Nieuw                            |
    | ----------------------------- | -------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    De runtimemethode `readSession` is deprecated ten gunste van
    `getSessionMessages`. Dezelfde signature; de oude methode roept door naar de
    nieuwe.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Oud**: `runtime.tasks.flow` (enkelvoud) retourneerde een live task-flow accessor.

    **Nieuw**: `runtime.tasks.managedFlows` behoudt de managed TaskFlow-mutatie
    runtime voor Plugins die child tasks vanuit een flow maken, bijwerken, annuleren of uitvoeren. Gebruik `runtime.tasks.flows` wanneer de Plugin alleen DTO-gebaseerde reads nodig heeft.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Ingebedde extension-factories → agent tool-result middleware">
    Behandeld in "Migreren → Pi tool-result extensions migreren naar
    middleware" hierboven. Hier opgenomen voor volledigheid: het verwijderde Pi-only
    `api.registerEmbeddedExtensionFactory(...)`-pad is vervangen door
    `api.registerAgentToolResultMiddleware(...)` met een expliciete runtimelijst
    in `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="OpenClawSchemaType-alias → OpenClawConfig">
    `OpenClawSchemaType`, opnieuw geëxporteerd vanuit `openclaw/plugin-sdk`, is nu een
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
Extension-level deprecations (binnen gebundelde kanaal-/provider-Plugins onder
`extensions/`) worden bijgehouden binnen hun eigen `api.ts`- en `runtime-api.ts`-barrels. Ze hebben geen invloed op contracten van third-party Plugins en worden hier niet vermeld. Als je de lokale barrel van een gebundelde Plugin direct gebruikt, lees dan de deprecation-opmerkingen in die barrel voordat je upgradet.
</Note>

## Verwijderingstijdlijn

| Wanneer                | Wat gebeurt er                                                          |
| ---------------------- | ----------------------------------------------------------------------- |
| **Nu**                 | Deprecated oppervlakken geven runtimewaarschuwingen                     |
| **Volgende major release** | Deprecated oppervlakken worden verwijderd; Plugins die ze nog gebruiken falen |

Alle core-Plugins zijn al gemigreerd. Externe Plugins moeten vóór de volgende major release migreren.

## De waarschuwingen tijdelijk onderdrukken

Stel deze omgevingsvariabelen in terwijl je aan de migratie werkt:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Dit is een tijdelijke uitweg, geen permanente oplossing.

## Gerelateerd

- [Aan de slag](/nl/plugins/building-plugins) - bouw je eerste Plugin
- [SDK-overzicht](/nl/plugins/sdk-overview) - volledige importreferentie voor subpaden
- [Kanaal-Plugins](/nl/plugins/sdk-channel-plugins) - kanaal-Plugins bouwen
- [Provider-Plugins](/nl/plugins/sdk-provider-plugins) - provider-Plugins bouwen
- [Plugin Internals](/nl/plugins/architecture) - diepgaande architectuuruitleg
- [Plugin Manifest](/nl/plugins/manifest) - manifest-schemareferentie
