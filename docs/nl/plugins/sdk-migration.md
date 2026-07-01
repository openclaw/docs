---
read_when:
    - Je ziet de waarschuwing OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Je ziet de waarschuwing OPENCLAW_EXTENSION_API_DEPRECATED
    - U hebt api.registerEmbeddedExtensionFactory gebruikt vóór OpenClaw 2026.4.25
    - Je werkt een Plugin bij naar de moderne Plugin-architectuur
    - Je onderhoudt een externe OpenClaw-Plugin
sidebarTitle: Migrate to SDK
summary: Migreer van de verouderde laag voor achterwaartse compatibiliteit naar de moderne plugin-SDK
title: Plugin SDK-migratie
x-i18n:
    generated_at: "2026-07-01T13:10:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9f6f9b4334ca3bdbcc6602cfe2bb1499d5758de95a9163e0ef75619a712a1c3
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw is overgestapt van een brede laag voor achterwaartse compatibiliteit naar een moderne Plugin-architectuur met gerichte, gedocumenteerde imports. Als je Plugin is gebouwd vóór de nieuwe architectuur, helpt deze handleiding je migreren.

## Wat er verandert

Het oude Plugin-systeem bood twee zeer open oppervlakken waarmee Plugins alles wat ze nodig hadden vanuit één entrypoint konden importeren:

- **`openclaw/plugin-sdk/compat`** - één import die tientallen helpers opnieuw exporteerde. Deze werd geïntroduceerd om oudere hook-gebaseerde Plugins werkend te houden terwijl de nieuwe Plugin-architectuur werd gebouwd.
- **`openclaw/plugin-sdk/infra-runtime`** - een brede barrel met runtimehelpers die systeemgebeurtenissen, Heartbeat-status, bezorgwachtrijen, fetch-/proxyhelpers, bestandshelpers, goedkeuringstypen en niet-gerelateerde hulpprogramma's combineerde.
- **`openclaw/plugin-sdk/config-runtime`** - een brede barrel voor configuratiecompatibiliteit die tijdens het migratievenster nog verouderde directe laad-/schrijfhelpers bevat.
- **`openclaw/extension-api`** - een brug die Plugins directe toegang gaf tot helpers aan hostzijde, zoals de ingesloten agentrunner.
- **`api.registerEmbeddedExtensionFactory(...)`** - een verwijderde, alleen voor de ingesloten runner bedoelde gebundelde extensiehook die ingesloten-runnergebeurtenissen zoals `tool_result` kon observeren.

De brede importoppervlakken zijn nu **verouderd**. Ze werken nog steeds tijdens runtime, maar nieuwe Plugins mogen ze niet gebruiken, en bestaande Plugins moeten migreren voordat de volgende major release ze verwijdert. De registratie-API voor de alleen-ingesloten-runner extensiefactory is verwijderd; gebruik in plaats daarvan middleware voor tool-resultaten.

OpenClaw verwijdert of herinterpreteert gedocumenteerd Plugin-gedrag niet in dezelfde wijziging die een vervanging introduceert. Brekende contractwijzigingen moeten eerst via een compatibiliteitsadapter, diagnostiek, documentatie en een afschrijvingsvenster gaan. Dat geldt voor SDK-imports, manifestvelden, setup-API's, hooks en runtime-registratiegedrag.

<Warning>
  De laag voor achterwaartse compatibiliteit wordt in een toekomstige major release verwijderd.
  Plugins die nog steeds vanaf deze oppervlakken importeren, breken wanneer dat gebeurt.
  Verouderde ingebedde extensiefactoryregistraties worden nu al niet meer geladen.
</Warning>

## Waarom dit is veranderd

De oude aanpak veroorzaakte problemen:

- **Langzame opstart** - één helper importeren laadde tientallen niet-gerelateerde modules
- **Circulaire afhankelijkheden** - brede re-exports maakten het makkelijk om importcycli te creëren
- **Onduidelijk API-oppervlak** - er was geen manier om te zien welke exports stabiel waren en welke intern

De moderne Plugin SDK lost dit op: elk importpad (`openclaw/plugin-sdk/\<subpath\>`) is een kleine, zelfstandige module met een duidelijk doel en een gedocumenteerd contract.

Verouderde provider-convenience-seams voor gebundelde kanalen zijn ook verdwenen.
Kanaalgebonden helper-seams waren private mono-repo-snelkoppelingen, geen stabiele Plugin-contracten. Gebruik in plaats daarvan smalle generieke SDK-subpaden. Houd binnen de gebundelde Plugin-workspace provider-eigen helpers in de eigen `api.ts` of `runtime-api.ts` van die Plugin.

Huidige gebundelde provider-voorbeelden:

- Anthropic houdt Claude-specifieke streamhelpers in zijn eigen `api.ts` /
  `contract-api.ts`-seam
- OpenAI houdt providerbuilders, helpers voor standaardmodellen en realtime-providerbuilders in zijn eigen `api.ts`
- OpenRouter houdt providerbuilder- en onboarding-/configuratiehelpers in zijn eigen
  `api.ts`

## Migratieplan voor Talk en realtime spraak

Realtime spraak-, telefonie-, vergader- en browser-Talk-code verhuist van oppervlak-lokale beurtboekhouding naar een gedeelde Talk-sessiecontroller die wordt geëxporteerd door `openclaw/plugin-sdk/realtime-voice`. De nieuwe controller beheert de gemeenschappelijke Talk-gebeurtenisenvelop, actieve beurtstatus, opnamestatus, uitvoeraudiostatus, recente gebeurtenisgeschiedenis en afwijzing van verouderde beurten. Provider-Plugins moeten vendorspecifieke realtime-sessies blijven beheren; oppervlak-Plugins moeten opname, afspelen, telefonie en vergader-eigenaardigheden blijven beheren.

Deze Talk-migratie is bewust brekend-schoon:

1. Houd de gedeelde controller-/runtimeprimitieven in
   `plugin-sdk/realtime-voice`.
2. Verplaats gebundelde oppervlakken naar de gedeelde controller: browserrelay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime en native push-to-talk.
3. Vervang oude Talk RPC-families door de definitieve `talk.session.*`- en
   `talk.client.*`-API.
4. Adverteer één live Talk-gebeurteniskanaal in Gateway
   `hello-ok.features.events`: `talk.event`.
5. Verwijder het oude realtime HTTP-endpoint en elk pad voor request-time instructie-override.

Nieuwe code mag `createTalkEventSequencer(...)` niet rechtstreeks aanroepen, tenzij deze een low-level adapter of testfixture implementeert. Geef de voorkeur aan de gedeelde controller, zodat beurtgebonden gebeurtenissen niet zonder beurt-id kunnen worden uitgezonden, verouderde `turnEnd`- /
`turnCancel`-aanroepen geen nieuwere actieve beurt kunnen wissen, en lifecycle-gebeurtenissen voor uitvoeraudio consistent blijven in telefonie, vergaderingen, browserrelay, managed-room handoff en native Talk-clients.

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

Browser-eigen WebRTC-/provider-websocket-sessies gebruiken `talk.client.create`, omdat de browser de provideronderhandeling en het mediatransport beheert, terwijl de Gateway referenties, instructies en toolbeleid beheert. `talk.session.*` is het gemeenschappelijke Gateway-beheerde oppervlak voor gateway-relay realtime, gateway-relay transcriptie en managed-room native STT-/TTS-sessies.

Verouderde configuraties die realtime-selectors naast `talk.provider` /
`talk.providers` plaatsten, moeten worden gerepareerd met `openclaw doctor --fix`; runtime Talk herinterpreteert spraak-/TTS-providerconfiguratie niet als realtime-providerconfiguratie.

De ondersteunde `talk.session.create`-combinaties zijn bewust klein:

| Modus           | Transport       | Brain           | Eigenaar           | Opmerkingen                                                                                                        |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Full-duplex provideraudio wordt via de Gateway gebrugd; toolaanroepen worden via de agent-consult-tool gerouteerd. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Alleen streaming STT; callers sturen invoeraudio en ontvangen transcriptiegebeurtenissen.                          |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | Push-to-talk- en walkie-talkie-achtige rooms waarbij de client opname/afspelen beheert en de Gateway de beurtstatus beheert. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | Alleen-admin roommodus voor vertrouwde first-party oppervlakken die Gateway-toolacties direct uitvoeren.            |

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

  | Methode                         | Van toepassing op                                      | Contract                                                                                                                                                                                                      |
  | ------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Voeg een base64 PCM-audiofragment toe aan de providersessie die eigendom is van dezelfde Gateway-verbinding.                                                                                                   |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                 | Start een gebruikersbeurt in een beheerde ruimte.                                                                                                                                                             |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                 | Beeindig de actieve beurt na validatie van verouderde beurten.                                                                                                                                                |
  | `talk.session.cancelTurn`       | alle Gateway-beheerde sessies                          | Annuleer actief vastleggen/provider/agent/TTS-werk voor een beurt.                                                                                                                                            |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                               | Stop audio-uitvoer van de assistent zonder noodzakelijkerwijs de gebruikersbeurt te beeindigen.                                                                                                               |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                               | Rond een provider-toolaanroep af die door de relay is uitgegeven; geef `options.willContinue` door voor tussentijdse uitvoer of `options.suppressResponse` om aan de aanroep te voldoen zonder nog een assistentreactie. |
  | `talk.session.steer`            | agent-ondersteunde Talk-sessies                        | Stuur gesproken `status`-, `steer`-, `cancel`- of `followup`-besturing naar de actieve ingesloten uitvoering die uit de Talk-sessie is opgelost.                                                               |
  | `talk.session.close`            | alle uniforme sessies                                  | Stop relaysessies of trek de status van de beheerde ruimte in, en vergeet daarna de uniforme sessie-id.                                                                                                       |

  Introduceer geen provider- of platformspecifieke uitzonderingen in core om dit te laten werken.
  Core is eigenaar van Talk-sessiesemantiek. Providerplugins zijn eigenaar van de instelling van leverancierssessies.
  Spraakoproepen en Google Meet zijn eigenaar van telefonie-/vergaderadapters. Browser- en native
  apps zijn eigenaar van de UX voor apparaatinvoer/-weergave.

  ## Compatibiliteitsbeleid

  Voor externe plugins volgt compatibiliteitswerk deze volgorde:

  1. voeg het nieuwe contract toe
  2. houd het oude gedrag aangesloten via een compatibiliteitsadapter
  3. geef een diagnose of waarschuwing uit die het oude pad en de vervanging noemt
  4. dek beide paden af in tests
  5. documenteer de deprecatie en het migratiepad
  6. verwijder pas na het aangekondigde migratievenster, meestal in een hoofdrelease

  Maintainers kunnen de huidige migratiewachtrij controleren met
  `pnpm plugins:boundary-report`. Gebruik `pnpm plugins:boundary-report:summary` voor
  compacte tellingen, `--owner <id>` voor een plugin of compatibiliteitseigenaar, en
  `pnpm plugins:boundary-report:ci` wanneer een CI-gate moet falen op verschuldigde
  compatibiliteitsrecords, gereserveerde SDK-imports over eigenaars heen, of ongebruikte gereserveerde SDK-subpaden.
  Het rapport groepeert verouderde
  compatibiliteitsrecords op verwijderdatum, telt lokale code-/docs-referenties,
  toont gereserveerde SDK-imports over eigenaars heen, en vat de private
  memory-host SDK-bridge samen zodat compatibiliteitsopschoning expliciet blijft in plaats van
  te vertrouwen op ad-hoczoekopdrachten. Gereserveerde SDK-subpaden moeten bijgehouden eigenaarsgebruik hebben;
  ongebruikte gereserveerde helper-exports moeten uit de publieke SDK worden verwijderd.

  Als een manifestveld nog steeds wordt geaccepteerd, kunnen pluginauteurs het blijven gebruiken totdat
  de docs en diagnoses anders aangeven. Nieuwe code moet de gedocumenteerde
  vervanging verkiezen, maar bestaande plugins mogen niet breken tijdens gewone minor-
  releases.

  ## Migreren

  <Steps>
  <Step title="Migreer helpers voor laden/schrijven van runtimeconfiguratie">
    Gebundelde plugins moeten stoppen met het rechtstreeks aanroepen van
    `api.runtime.config.loadConfig()` en
    `api.runtime.config.writeConfigFile(...)`. Geef de voorkeur aan configuratie die al
    aan het actieve aanroeppad is doorgegeven. Langlevende handlers die de
    huidige processnapshot nodig hebben, kunnen `api.runtime.config.current()` gebruiken. Langlevende
    agenttools moeten de `ctx.getRuntimeConfig()` van de toolcontext gebruiken binnen
    `execute`, zodat een tool die voor een configuratieschrijfactie is gemaakt nog steeds de vernieuwde
    runtimeconfiguratie ziet.

    Configuratieschrijfacties moeten via de transactionele helpers lopen en een
    beleid na het schrijven kiezen:

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
    opvolging en bewust de herlaadplanner wil onderdrukken.
    Mutatieresultaten bevatten een getypte `followUp`-samenvatting voor tests en logging;
    de gateway blijft verantwoordelijk voor het toepassen of plannen van de herstart.
    `loadConfig` en `writeConfigFile` blijven als verouderde compatibiliteitshelpers
    voor externe plugins tijdens het migratievenster en waarschuwen eenmaal met
    de compatibiliteitscode `runtime-config-load-write`. Gebundelde plugins en repo-
    runtimecode worden beschermd door scannerrails in
    `pnpm check:deprecated-api-usage` en
    `pnpm check:no-runtime-action-load-config`: nieuw gebruik in productieplugins
    faalt direct, rechtstreekse configuratieschrijfacties falen, gatewayservermethoden moeten de
    runtime-snapshot van het verzoek gebruiken, helpers voor verzenden/actie/client van runtimekanalen
    moeten configuratie van hun grens ontvangen, en langlevende runtimemodules hebben
    nul toegestane omgevingsaanroepen naar `loadConfig()`.

    Nieuwe plugincode moet ook vermijden de brede compatibiliteitsbarrel
    `openclaw/plugin-sdk/config-runtime` te importeren. Gebruik het smalle
    SDK-subpad dat bij de taak past:

    | Behoefte | Import |
    | --- | --- |
    | Configuratietypen zoals `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Asserties voor al geladen configuratie en lookup van plugin-entryconfiguratie | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lezen van de huidige runtime-snapshot | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Configuratieschrijfacties | `openclaw/plugin-sdk/config-mutation` |
    | Helpers voor sessieopslag | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown-tabelconfiguratie | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Runtimehelpers voor groepsbeleid | `openclaw/plugin-sdk/runtime-group-policy` |
    | Resolutie van geheime invoer | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model-/sessie-overschrijvingen | `openclaw/plugin-sdk/model-session-runtime` |

    Gebundelde plugins en hun tests worden door scanners beschermd tegen de brede
    barrel, zodat imports en mocks lokaal blijven bij het gedrag dat ze nodig hebben. De brede
    barrel bestaat nog steeds voor externe compatibiliteit, maar nieuwe code mag er niet
    van afhankelijk zijn.

  </Step>

  <Step title="Migreer ingesloten extensies voor toolresultaten naar middleware">
    Gebundelde plugins moeten toolresultaathandlers die alleen voor de ingesloten runner zijn,
    `api.registerEmbeddedExtensionFactory(...)`, vervangen door
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

    Geinstalleerde plugins kunnen ook toolresultaatmiddleware registreren wanneer ze
    expliciet zijn ingeschakeld en elke beoogde runtime declareren in
    `contracts.agentToolResultMiddleware`. Niet-gedeclareerde registraties van geinstalleerde middleware
    worden geweigerd.

  </Step>

  <Step title="Migreer goedkeuringsnative handlers naar capaciteitsfeiten">
    Kanaalplugins met goedkeuringsmogelijkheden stellen native goedkeuringsgedrag nu beschikbaar via
    `approvalCapability.nativeRuntime` plus het gedeelde register voor runtimecontext.

    Belangrijkste wijzigingen:

    - Vervang `approvalCapability.handler.loadRuntime(...)` door
      `approvalCapability.nativeRuntime`
    - Verplaats goedkeuringsspecifieke auth/levering van legacy `plugin.auth` /
      `plugin.approvals`-bedrading naar `approvalCapability`
    - `ChannelPlugin.approvals` is verwijderd uit het publieke channel-plugin-
      contract; verplaats delivery/native/render-velden naar `approvalCapability`
    - `plugin.auth` blijft alleen voor login-/logoutflows van kanalen; goedkeuringsauth-
      hooks daar worden niet langer door core gelezen
    - Registreer runtimeobjecten die eigendom zijn van het kanaal, zoals clients, tokens of Bolt-
      apps via `openclaw/plugin-sdk/channel-runtime-context`
    - Verstuur geen plugin-eigen omleidingsmeldingen vanuit native goedkeuringshandlers;
      core is nu eigenaar van elders-gerouteerde meldingen uit werkelijke leveringsresultaten
    - Wanneer je `channelRuntime` doorgeeft aan `createChannelManager(...)`, geef dan een
      echt `createPluginRuntime().channel`-oppervlak op. Gedeeltelijke stubs worden geweigerd.

    Zie `/plugins/sdk-channel-plugins` voor de huidige indeling van goedkeuringscapaciteiten.

  </Step>

  <Step title="Controleer fallbackgedrag van Windows-wrappers">
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

  <Step title="Vind verouderde imports">
    Zoek in je plugin naar imports uit een van de verouderde oppervlakken:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Vervang door gerichte imports">
    Elke export uit het oude oppervlak correspondeert met een specifiek modern importpad:

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

    Gebruik voor host-side helpers de geinjecteerde pluginruntime in plaats van rechtstreeks te importeren:

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
    | helpers voor sessieopslag | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Vervang brede infra-runtime-imports">
    `openclaw/plugin-sdk/infra-runtime` bestaat nog steeds voor externe
    compatibiliteit, maar nieuwe code moet het gerichte helperoppervlak importeren dat
    deze daadwerkelijk nodig heeft:

    | Behoefte | Import |
    | --- | --- |
    | Helpers voor systeemgebeurteniswachtrijen | `openclaw/plugin-sdk/system-event-runtime` |
    | Helpers voor Heartbeat-wake, gebeurtenissen en zichtbaarheid | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Afhandeling van wachtrij voor in behandeling zijnde levering | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetrie voor kanaalactiviteit | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Deduplicatiecaches in het geheugen | `openclaw/plugin-sdk/dedupe-runtime` |
    | Veilige helpers voor lokale bestands-/mediapaden | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher-bewuste fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Helpers voor proxy en bewaakte fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Beleidstypen voor SSRF-dispatcher | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Typen voor goedkeuringsverzoek/-resolutie | `openclaw/plugin-sdk/approval-runtime` |
    | Helpers voor payload en opdrachten van goedkeuringsantwoord | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helpers voor foutopmaak | `openclaw/plugin-sdk/error-runtime` |
    | Wachttijden voor transportgereedheid | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helpers voor veilige tokens | `openclaw/plugin-sdk/secure-random-runtime` |
    | Begrensde gelijktijdigheid van asynchrone taken | `openclaw/plugin-sdk/concurrency-runtime` |
    | Numerieke coercion | `openclaw/plugin-sdk/number-runtime` |
    | Proces-lokaal asynchroon slot | `openclaw/plugin-sdk/async-lock-runtime` |
    | Bestandssloten | `openclaw/plugin-sdk/file-lock` |

    Gebundelde plugins worden door scanners beschermd tegen `infra-runtime`, zodat repositorycode
    niet kan terugvallen naar de brede barrel.

  </Step>

  <Step title="Migreer kanaalroutehelpers">
    Nieuwe kanaalroutecode moet `openclaw/plugin-sdk/channel-route` gebruiken.
    De oudere namen voor route-key en comparable-target blijven als compatibiliteitsaliassen
    bestaan tijdens de migratieperiode, maar nieuwe plugins moeten de routenamen gebruiken
    die het gedrag rechtstreeks beschrijven:

    | Oude helper | Moderne helper |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    De moderne routehelpers normaliseren `{ channel, to, accountId, threadId }`
    consistent over native goedkeuringen, onderdrukking van antwoorden, inkomende deduplicatie,
    Cron-levering en sessierouting heen.

    Voeg geen nieuw gebruik toe van `ChannelMessagingAdapter.parseExplicitTarget` of
    de parser-ondersteunde helpers voor geladen routes (`parseExplicitTargetForLoadedChannel`
    of `resolveRouteTargetForLoadedChannel`) of
    `resolveChannelRouteTargetWithParser(...)` uit `plugin-sdk/channel-route`.
    Die hooks zijn verouderd en blijven alleen bestaan voor oudere plugins tijdens de
    migratieperiode. Nieuwe kanaalplugins moeten
    `messaging.targetResolver.resolveTarget(...)` gebruiken voor normalisatie van doel-id's
    en fallback bij ontbrekende directoryvermeldingen, `messaging.inferTargetChatType(...)` wanneer de core
    vroeg een peertype nodig heeft, en `messaging.resolveOutboundSessionRoute(...)`
    voor provider-native sessie- en threadidentiteit.

  </Step>

  <Step title="Bouw en test">
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
  | `plugin-sdk/plugin-entry` | Canonieke helper voor Plugin-entry | `definePluginEntry` |
  | `plugin-sdk/core` | Legacy overkoepelende re-export voor definities/builders van channel-entries | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export van root-configschema | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper voor single-provider-entry | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Gerichte definities en builders voor channel-entries | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Gedeelde helpers voor de setupwizard | Setupvertaler, prompts voor allowlists, builders voor setupstatus |
  | `plugin-sdk/setup-runtime` | Runtimehelpers tijdens setup | `createSetupTranslator`, importveilige setup-patchadapters, helpers voor lookup-notities, `promptResolvedAllowFrom`, `splitSetupEntries`, gedelegeerde setupproxy's |
  | `plugin-sdk/setup-adapter-runtime` | Verouderde alias voor setupadapter | Gebruik `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Helpers voor setuptooling | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers voor meerdere accounts | Helpers voor accountlijst/configuratie/actiegate |
  | `plugin-sdk/account-id` | Helpers voor account-id | `DEFAULT_ACCOUNT_ID`, normalisatie van account-id |
  | `plugin-sdk/account-resolution` | Helpers voor accountlookup | Accountlookup + helpers voor default-fallback |
  | `plugin-sdk/account-helpers` | Smalle accounthelpers | Helpers voor accountlijst/accountactie |
  | `plugin-sdk/channel-setup` | Adapters voor de setupwizard | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM-koppelingsprimitieven | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Bedrading voor antwoordprefix, typen en bronlevering | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Configadapterfactories en DM-toeganghelpers | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Builders voor configschema's | Gedeelde schema-primitieven voor channelconfiguratie en alleen de generieke builder |
  | `plugin-sdk/bundled-channel-config-schema` | Gebundelde configschema's | Alleen door OpenClaw onderhouden gebundelde Plugins; nieuwe Plugins moeten Plugin-lokale schema's definiëren |
  | `plugin-sdk/channel-config-schema-legacy` | Verouderde gebundelde configschema's | Alleen compatibiliteitsalias; gebruik `plugin-sdk/bundled-channel-config-schema` voor onderhouden gebundelde Plugins |
  | `plugin-sdk/telegram-command-config` | Helpers voor Telegram-commandconfiguratie | Normalisatie van commandnamen, inkorten van beschrijvingen, validatie van duplicaten/conflicten |
  | `plugin-sdk/channel-policy` | Resolutie van groeps-/DM-beleid | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Verouderde compatibiliteitsfacade | Gebruik `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Helpers voor inbound envelopes | Gedeelde helpers voor route- en envelope-builders |
  | `plugin-sdk/channel-inbound` | Helpers voor inbound ontvangen | Contextopbouw, formattering, roots, runners, voorbereide antwoorddispatch en dispatchpredicaten |
  | `plugin-sdk/messaging-targets` | Verouderd importpad voor targetparsing | Gebruik `plugin-sdk/channel-targets` voor generieke helpers voor targetparsing, `plugin-sdk/channel-route` voor routevergelijking en Plugin-eigen `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` voor providerspecifieke targetresolutie |
  | `plugin-sdk/outbound-media` | Helpers voor outbound media | Gedeeld laden van outbound media |
  | `plugin-sdk/outbound-send-deps` | Verouderde compatibiliteitsfacade | Gebruik `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Helpers voor levenscyclus van outbound berichten | Berichtadapters, ontvangstbewijzen, duurzame verzendhelpers, live preview-/streaminghelpers, antwoordopties, levenscyclushelpers, outbound identiteit en payloadplanning |
  | `plugin-sdk/channel-streaming` | Verouderde compatibiliteitsfacade | Gebruik `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Verouderde compatibiliteitsfacade | Gebruik `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Helpers voor threadbindings | Levenscyclus- en adapterhelpers voor threadbindings |
  | `plugin-sdk/agent-media-payload` | Legacy helpers voor mediapayloads | Builder voor agent-mediapayloads voor legacy veldlayouts |
  | `plugin-sdk/channel-runtime` | Verouderde compatibiliteitsshim | Alleen legacy channel-runtimehulpprogramma's |
  | `plugin-sdk/channel-send-result` | Types voor verzendresultaten | Types voor antwoordresultaten |
  | `plugin-sdk/runtime-store` | Persistente Plugin-opslag | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Brede runtimehelpers | Helpers voor runtime/logging/back-up/Plugin-installatie |
  | `plugin-sdk/runtime-env` | Smalle runtime-envhelpers | Helpers voor logger/runtime-env, timeout, retry en backoff |
  | `plugin-sdk/plugin-runtime` | Gedeelde Plugin-runtimehelpers | Helpers voor Plugin-commands/hooks/http/interactief |
  | `plugin-sdk/hook-runtime` | Helpers voor hookpipeline | Gedeelde helpers voor Webhook/interne hookpipeline |
  | `plugin-sdk/lazy-runtime` | Lazy runtimehelpers | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Proceshelpers | Gedeelde exechelpers |
  | `plugin-sdk/cli-runtime` | CLI-runtimehelpers | Commandformattering, wachten, versiehelpers |
  | `plugin-sdk/gateway-runtime` | Gateway-helpers | Gateway-client, helper voor event-loop-ready starten, resolutie van geadverteerde LAN-host en patchhelpers voor channelstatus |
  | `plugin-sdk/config-runtime` | Verouderde configcompatibiliteitsshim | Geef de voorkeur aan `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` en `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Telegram-commandhelpers | Fallback-stabiele helpers voor Telegram-commandvalidatie wanneer het gebundelde Telegram-contractoppervlak niet beschikbaar is |
  | `plugin-sdk/approval-runtime` | Helpers voor goedkeuringsprompts | Payload voor exec-/Plugin-goedkeuring, helpers voor goedkeuringscapability/-profiel, native goedkeuringsrouting-/runtimehelpers en formattering van gestructureerde weergavepaden voor goedkeuringen |
  | `plugin-sdk/approval-auth-runtime` | Helpers voor goedkeuringsauth | Resolutie van goedkeurders, actie-auth in dezelfde chat |
  | `plugin-sdk/approval-client-runtime` | Helpers voor goedkeuringsclient | Native profiel-/filterhelpers voor exec-goedkeuring |
  | `plugin-sdk/approval-delivery-runtime` | Helpers voor goedkeuringslevering | Native adapters voor goedkeuringscapability/-levering |
  | `plugin-sdk/approval-gateway-runtime` | Helpers voor goedkeurings-Gateway | Gedeelde helper voor goedkeurings-Gateway-resolutie |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpers voor goedkeuringsadapter | Lichtgewicht helpers voor het laden van native goedkeuringsadapters voor hot channel-entrypoints |
  | `plugin-sdk/approval-handler-runtime` | Helpers voor goedkeuringshandler | Bredere runtimehelpers voor goedkeuringshandlers; geef de voorkeur aan de smallere adapter-/Gateway-seams wanneer die voldoende zijn |
  | `plugin-sdk/approval-native-runtime` | Helpers voor goedkeuringstargets | Native helpers voor binding van goedkeuringstarget/account |
  | `plugin-sdk/approval-reply-runtime` | Helpers voor goedkeuringsantwoorden | Payloadhelpers voor exec-/Plugin-goedkeuringsantwoorden |
  | `plugin-sdk/channel-runtime-context` | Helpers voor channel-runtimecontext | Generieke helpers voor registreren/ophalen/watchen van channel-runtimecontext |
  | `plugin-sdk/security-runtime` | Beveiligingshelpers | Gedeelde helpers voor vertrouwen, DM-gating, root-begrensde bestands-/padtoegang, externe content en secretverzameling |
  | `plugin-sdk/ssrf-policy` | Helpers voor SSRF-beleid | Helpers voor hostallowlist en privénetwerkbeleid |
  | `plugin-sdk/ssrf-runtime` | SSRF-runtimehelpers | Pinned-dispatcher, guarded fetch, helpers voor SSRF-beleid |
  | `plugin-sdk/system-event-runtime` | Helpers voor systeemevents | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat-helpers | Helpers voor Heartbeat wake, event en zichtbaarheid |
  | `plugin-sdk/delivery-queue-runtime` | Helpers voor leveringswachtrij | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Helpers voor channelactiviteit | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Dedupe-helpers | In-memory dedupe-caches |
  | `plugin-sdk/file-access-runtime` | Helpers voor bestandstoegang | Veilige helpers voor lokale-bestands-/mediapaden |
  | `plugin-sdk/transport-ready-runtime` | Helpers voor transportgereedheid | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Helpers voor exec-goedkeuringsbeleid | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Helpers voor begrensde caches | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers voor diagnostic gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers voor foutformattering | `formatUncaughtError`, `isApprovalNotFoundError`, helpers voor foutgrafieken |
  | `plugin-sdk/fetch-runtime` | Wrapped fetch-/proxyhelpers | `resolveFetch`, proxyhelpers, optiehelpers voor EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Helpers voor hostnormalisatie | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Retryhelpers | `RetryConfig`, `retryAsync`, policyrunners |
  | `plugin-sdk/allow-from` | Allowlist-formattering en inputmapping | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Commandgating en helpers voor commandoppervlak | `resolveControlCommandGate`, helpers voor senderautorisatie, helpers voor commandregistry inclusief formattering van menu's met dynamische argumenten |
  | `plugin-sdk/command-status` | Renderers voor commandstatus/help | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing van secretinput | Helpers voor secretinput |
  | `plugin-sdk/webhook-ingress` | Helpers voor Webhook-requests | Webhook-targethulpprogramma's |
  | `plugin-sdk/webhook-request-guards` | Guardhelpers voor Webhook-body | Helpers voor lezen/limieten van requestbody |
  | `plugin-sdk/reply-runtime` | Gedeelde runtime voor antwoorden | Inbound dispatch, Heartbeat, antwoordplanner, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Smalle helpers voor antwoorddispatch | Finaliseren, providerdispatch en helpers voor gesprekslabels |
  | `plugin-sdk/reply-history` | Helpers voor antwoordgeschiedenis | `createChannelHistoryWindow`; verouderde compatibiliteitsexports voor maphelpers zoals `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` en `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planning van antwoordreferenties | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers voor antwoordchunks | Helpers voor tekst-/markdownchunking |
  | `plugin-sdk/session-store-runtime` | Helpers voor sessiestore | Storepad + updated-at-helpers |
  | `plugin-sdk/state-paths` | Helpers voor statepaden | Helpers voor state- en OAuth-dir |
  | `plugin-sdk/routing` | Routing-/sessiesleutelhulpfuncties | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, hulpfuncties voor sessiesleutelnormalisatie |
  | `plugin-sdk/status-helpers` | Kanaalstatushulpfuncties | Bouwers voor kanaal-/accountstatussamenvattingen, standaardwaarden voor runtime-status, hulpfuncties voor issue-metadata |
  | `plugin-sdk/target-resolver-runtime` | Hulpfuncties voor doelresolver | Gedeelde hulpfuncties voor doelresolver |
  | `plugin-sdk/string-normalization-runtime` | Hulpfuncties voor tekenreeksnormalisatie | Hulpfuncties voor slug-/tekenreeksnormalisatie |
  | `plugin-sdk/request-url` | Hulpfuncties voor aanvraag-URL's | Extraheer tekenreeks-URL's uit aanvraagachtige invoer |
  | `plugin-sdk/run-command` | Hulpfuncties voor getimede opdrachten | Getimede opdrachtrunner met genormaliseerde stdout/stderr |
  | `plugin-sdk/param-readers` | Paramlezers | Algemene parameterlezers voor tools/CLI |
  | `plugin-sdk/tool-payload` | Extractie van toolpayload | Extraheer genormaliseerde payloads uit toolresultaatobjecten |
  | `plugin-sdk/tool-send` | Extractie van toolverzending | Extraheer canonieke velden voor verzenddoelen uit toolargumenten |
  | `plugin-sdk/temp-path` | Hulpfuncties voor tijdelijke paden | Gedeelde hulpfuncties voor tijdelijke downloadpaden |
  | `plugin-sdk/logging-core` | Logginghulpfuncties | Subsysteemlogger en hulpfuncties voor redactie |
  | `plugin-sdk/markdown-table-runtime` | Hulpfuncties voor Markdown-tabellen | Hulpfuncties voor Markdown-tabelmodi |
  | `plugin-sdk/reply-payload` | Typen voor berichtantwoorden | Typen voor antwoordpayloads |
  | `plugin-sdk/provider-setup` | Samengestelde hulpfuncties voor lokale/zelfgehoste providerinstallatie | Hulpfuncties voor detectie/configuratie van zelfgehoste providers |
  | `plugin-sdk/self-hosted-provider-setup` | Gerichte hulpfuncties voor OpenAI-compatibele zelfgehoste providerinstallatie | Dezelfde hulpfuncties voor detectie/configuratie van zelfgehoste providers |
  | `plugin-sdk/provider-auth-runtime` | Hulpfuncties voor provider-runtime-authenticatie | Hulpfuncties voor API-sleutelresolutie tijdens runtime |
  | `plugin-sdk/provider-auth-api-key` | Hulpfuncties voor provider-API-sleutelinstallatie | Hulpfuncties voor API-sleutelonboarding/profielschrijven |
  | `plugin-sdk/provider-auth-result` | Hulpfuncties voor provider-authenticatieresultaten | Standaardbouwer voor OAuth-authenticatieresultaten |
  | `plugin-sdk/provider-selection-runtime` | Hulpfuncties voor providerselectie | Geconfigureerde-of-automatische providerselectie en samenvoeging van ruwe providerconfiguratie |
  | `plugin-sdk/provider-env-vars` | Hulpfuncties voor provider-env-vars | Hulpfuncties voor het opzoeken van provider-authenticatie-env-vars |
  | `plugin-sdk/provider-model-shared` | Gedeelde hulpfuncties voor providermodel/replay | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gedeelde bouwers voor replaybeleid, provider-endpointhulpfuncties en hulpfuncties voor model-id-normalisatie |
  | `plugin-sdk/provider-catalog-shared` | Gedeelde hulpfuncties voor providercatalogus | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Provider-onboardingpatches | Configuratiehulpfuncties voor onboarding |
  | `plugin-sdk/provider-http` | Provider-HTTP-hulpfuncties | Generieke providerhulpfuncties voor HTTP-/endpointmogelijkheden, inclusief hulpfuncties voor multipartformulieren voor audiotranscriptie |
  | `plugin-sdk/provider-web-fetch` | Hulpfuncties voor provider-web-fetch | Hulpfuncties voor registratie/cache van web-fetch-providers |
  | `plugin-sdk/provider-web-search-config-contract` | Hulpfuncties voor provider-web-search-configuratie | Smalle configuratie-/referentiehulpfuncties voor web-search voor providers die geen plugin-enable-bedrading nodig hebben |
  | `plugin-sdk/provider-web-search-contract` | Hulpfuncties voor provider-web-search-contract | Smalle hulpfuncties voor web-search-configuratie-/referentiecontracten, zoals `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` en scoped setters/getters voor referenties |
  | `plugin-sdk/provider-web-search` | Hulpfuncties voor provider-web-search | Hulpfuncties voor registratie/cache/runtime van web-search-providers |
  | `plugin-sdk/provider-tools` | Hulpfuncties voor compatibiliteit van provider-tools/schema's | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` en schemaopschoning + diagnostiek voor DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Hulpfuncties voor providergebruik | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` en andere hulpfuncties voor providergebruik |
  | `plugin-sdk/provider-stream` | Hulpfuncties voor provider-streamwrappers | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, streamwrappertypen en gedeelde wrapperhulpfuncties voor Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Hulpfuncties voor providertransport | Native providertransporthulpfuncties zoals guarded fetch, tekstextractie uit toolresultaten, transportberichttransformaties en schrijfbare transporteventstreams |
  | `plugin-sdk/keyed-async-queue` | Geordende asynchrone wachtrij | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Gedeelde mediahulpfuncties | Hulpfuncties voor media ophalen/transformeren/opslaan, ffprobe-gebaseerde detectie van videodimensies en bouwers voor mediapayloads |
  | `plugin-sdk/media-generation-runtime` | Gedeelde hulpfuncties voor mediageneratie | Gedeelde failoverhulpfuncties, kandidaatselectie en meldingen voor ontbrekende modellen voor beeld-/video-/muziekgeneratie |
  | `plugin-sdk/media-understanding` | Hulpfuncties voor mediabegrip | Providertypen voor mediabegrip plus providergerichte exports van beeld-/audiohulpfuncties |
  | `plugin-sdk/text-runtime` | Verouderde brede export voor tekstcompatibiliteit | Gebruik `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` en `logging-core` |
  | `plugin-sdk/text-chunking` | Hulpfuncties voor tekstchunking | Hulpfunctie voor uitgaande tekstchunking |
  | `plugin-sdk/speech` | Spraakhulpfuncties | Spraakprovidertypen plus providergerichte hulpfuncties voor directives, registry en validatie, en OpenAI-compatibele TTS-bouwer |
  | `plugin-sdk/speech-core` | Gedeelde spraakkern | Spraakprovidertypen, registry, directives, normalisatie |
  | `plugin-sdk/realtime-transcription` | Hulpfuncties voor realtime transcriptie | Providertypen, registryhulpfuncties en gedeelde WebSocket-sessiehulpfunctie |
  | `plugin-sdk/realtime-voice` | Hulpfuncties voor realtime spraak | Providertypen, registry-/resolutiehulpfuncties, bridgesessiehulpfuncties, gedeelde agent-talkbackwachtrijen, spraakbesturing voor actieve runs, transcript-/eventgezondheid, echo-onderdrukking, matching van consultvragen, coördinatie van geforceerde consults, bijhouden van beurtcontext, bijhouden van uitvoeractiviteit en snelle contextconsult-hulpfuncties |
  | `plugin-sdk/image-generation` | Hulpfuncties voor beeldgeneratie | Providertypen voor beeldgeneratie plus hulpfuncties voor beeldassets/data-URL's en de OpenAI-compatibele beeldproviderbouwer |
  | `plugin-sdk/image-generation-core` | Gedeelde kern voor beeldgeneratie | Typen, failover, authenticatie en registryhulpfuncties voor beeldgeneratie |
  | `plugin-sdk/music-generation` | Hulpfuncties voor muziekgeneratie | Provider-/aanvraag-/resultaattypen voor muziekgeneratie |
  | `plugin-sdk/music-generation-core` | Gedeelde kern voor muziekgeneratie | Typen voor muziekgeneratie, failoverhulpfuncties, providerlookup en parsing van model-refs |
  | `plugin-sdk/video-generation` | Hulpfuncties voor videogeneratie | Provider-/aanvraag-/resultaattypen voor videogeneratie |
  | `plugin-sdk/video-generation-core` | Gedeelde kern voor videogeneratie | Typen voor videogeneratie, failoverhulpfuncties, providerlookup en parsing van model-refs |
  | `plugin-sdk/interactive-runtime` | Hulpfuncties voor interactieve antwoorden | Normalisatie/reductie van payloads voor interactieve antwoorden |
  | `plugin-sdk/channel-config-primitives` | Primitieven voor kanaalconfiguratie | Smalle primitieven voor kanaalconfiguratieschema's |
  | `plugin-sdk/channel-config-writes` | Hulpfuncties voor kanaalconfiguratieschrijven | Hulpfuncties voor autorisatie van kanaalconfiguratieschrijven |
  | `plugin-sdk/channel-plugin-common` | Gedeelde kanaalprelude | Gedeelde prelude-exports voor kanaalplugins |
  | `plugin-sdk/channel-status` | Kanaalstatushulpfuncties | Gedeelde hulpfuncties voor kanaalstatussnapshot/-samenvatting |
  | `plugin-sdk/allowlist-config-edit` | Hulpfuncties voor allowlist-configuratie | Hulpfuncties voor bewerken/lezen van allowlist-configuratie |
  | `plugin-sdk/group-access` | Hulpfuncties voor groepstoegang | Gedeelde hulpfuncties voor groepstoegangsbeslissingen |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Verouderde compatibiliteitsfacades | Gebruik `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Hulpfuncties voor Direct-DM-guard | Smalle hulpfuncties voor pre-crypto-guardbeleid |
  | `plugin-sdk/extension-shared` | Gedeelde extensionhulpfuncties | Primitieven voor passieve kanaal-/status- en ambient-proxyhulpfuncties |
  | `plugin-sdk/webhook-targets` | Webhook-doelhulpfuncties | Webhook-doelregistry en route-installatiehulpfuncties |
  | `plugin-sdk/webhook-path` | Verouderde alias voor webhookpad | Gebruik `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Gedeelde webmediahulpfuncties | Hulpfuncties voor het laden van remote/lokale media |
  | `plugin-sdk/zod` | Verouderde Zod-compatibiliteitsherexport | Importeer `zod` rechtstreeks uit `zod` |
  | `plugin-sdk/memory-core` | Gebundelde memory-core-hulpfuncties | Hulpfunctieoppervlak voor geheugenmanager/configuratie/bestanden/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Runtimefacade voor geheugenengine | Runtimefacade voor geheugenindex/-zoekfunctie |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registry voor geheugenembeddings | Lichtgewicht registryhulpfuncties voor providers van geheugenembeddings |
  | `plugin-sdk/memory-core-host-engine-foundation` | Foundation-engine voor geheugenhost | Exports van foundation-engine voor geheugenhost |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding-engine voor geheugenhost | Geheugenembeddingcontracten, registrytoegang, lokale provider en generieke batch-/remotehulpfuncties; concrete remoteproviders staan in hun eigen plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD-engine voor geheugenhost | Exports van QMD-engine voor geheugenhost |
  | `plugin-sdk/memory-core-host-engine-storage` | Opslagengine voor geheugenhost | Exports van opslagengine voor geheugenhost |
  | `plugin-sdk/memory-core-host-multimodal` | Multimodale hulpfuncties voor geheugenhost | Multimodale hulpfuncties voor geheugenhost |
  | `plugin-sdk/memory-core-host-query` | Queryhulpfuncties voor geheugenhost | Queryhulpfuncties voor geheugenhost |
  | `plugin-sdk/memory-core-host-secret` | Geheimhulpfuncties voor geheugenhost | Geheimhulpfuncties voor geheugenhost |
  | `plugin-sdk/memory-core-host-events` | Verouderde alias voor geheugenevents | Gebruik `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Statushulpfuncties voor geheugenhost | Statushulpfuncties voor geheugenhost |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI-runtime voor geheugenhost | Hulpfuncties voor CLI-runtime van geheugenhost |
  | `plugin-sdk/memory-core-host-runtime-core` | Kernruntime voor geheugenhost | Hulpfuncties voor kernruntime van geheugenhost |
  | `plugin-sdk/memory-core-host-runtime-files` | Bestands-/runtimehulpfuncties voor geheugenhost | Bestands-/runtimehulpfuncties voor geheugenhost |
  | `plugin-sdk/memory-host-core` | Alias voor kernruntime van geheugenhost | Providerneutrale alias voor hulpfuncties van de kernruntime van geheugenhost |
  | `plugin-sdk/memory-host-events` | Alias voor eventjournal van geheugenhost | Providerneutrale alias voor hulpfuncties van het eventjournal van geheugenhost |
  | `plugin-sdk/memory-host-files` | Verouderde alias voor geheugenbestanden/-runtime | Gebruik `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Hulpfuncties voor beheerde Markdown | Gedeelde hulpfuncties voor beheerde Markdown voor geheugen-aangrenzende plugins |
  | `plugin-sdk/memory-host-search` | Active Memory-zoekfacade | Luie runtimefacade voor Active Memory-zoekmanager |
  | `plugin-sdk/memory-host-status` | Verouderde alias voor geheugenhoststatus | Gebruik `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Testhulpprogramma's | Repo-lokale verouderde compatibiliteitsbarrel; gebruik gerichte repo-lokale testsubpaden zoals `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` en `plugin-sdk/test-fixtures` |
</Accordion>

Deze tabel is bewust de gemeenschappelijke migratiesubset, niet het volledige SDK-oppervlak.
De inventaris van compiler-entrypoints staat in
`scripts/lib/plugin-sdk-entrypoints.json`; package-exports worden gegenereerd uit
de openbare subset.

Gereserveerde helper-seams voor gebundelde plugins zijn uit de openbare SDK
export map verwijderd, behalve expliciet gedocumenteerde compatibiliteitsfacades zoals de
verouderde `plugin-sdk/discord`-shim die behouden blijft voor het gepubliceerde
`@openclaw/discord@2026.3.13`-pakket. Eigenaarsspecifieke helpers staan in het
eigenaarspakket van de plugin; gedeeld hostgedrag moet via generieke SDK-contracten
lopen, zoals `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`
en `plugin-sdk/plugin-config-runtime`.

Gebruik de smalste import die bij de taak past. Als je geen export kunt vinden,
controleer dan de bron in `src/plugin-sdk/` of vraag maintainers welk generiek contract
de eigenaar ervan moet zijn.

## Actieve uitfaseringen

Smallere uitfaseringen die gelden voor de plugin-SDK, het providercontract,
het runtime-oppervlak en het manifest. Elk ervan werkt vandaag nog, maar wordt
in een toekomstige major release verwijderd. De regel onder elk item koppelt de oude API
aan de canonieke vervanging.

<AccordionGroup>
  <Accordion title="command-auth-helpbuilders → command-status">
    **Oud (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nieuw (`openclaw/plugin-sdk/command-status`)**: dezelfde signatures, dezelfde
    exports - alleen geïmporteerd vanaf het smallere subpad. `command-auth`
    exporteert ze opnieuw als compatibiliteitsstubs.

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
    beslissingsobject in plaats van twee gesplitste aanroepen.

    Downstream kanaalplugins (Slack, Discord, Matrix, MS Teams) zijn al
    overgestapt.

  </Accordion>

  <Accordion title="Channel-runtime-shim en helpers voor kanaalacties">
    `openclaw/plugin-sdk/channel-runtime` is een compatibiliteitsshim voor oudere
    kanaalplugins. Importeer deze niet vanuit nieuwe code; gebruik
    `openclaw/plugin-sdk/channel-runtime-context` om runtime-objecten te
    registreren.

    `channelActions*`-helpers in `openclaw/plugin-sdk/channel-actions` zijn
    verouderd naast ruwe "actions"-kanaalexports. Stel capabilities in plaats daarvan
    beschikbaar via het semantische `presentation`-oppervlak - kanaalplugins
    declareren wat ze renderen (kaarten, knoppen, selecties) in plaats van welke ruwe
    actienamen ze accepteren.

  </Accordion>

  <Accordion title="Webzoekprovider-tool()-helper → createTool() op de plugin">
    **Oud**: `tool()`-factory uit `openclaw/plugin-sdk/provider-web-search`.

    **Nieuw**: implementeer `createTool(...)` rechtstreeks op de providerplugin.
    OpenClaw heeft de SDK-helper niet meer nodig om de tool-wrapper te registreren.

  </Accordion>

  <Accordion title="Plattetekst-kanaalenveloppen → BodyForAgent">
    **Oud**: `formatInboundEnvelope(...)` (en
    `ChannelMessageForAgent.channelEnvelope`) om een platte promptenvelop in
    platte tekst te bouwen uit inkomende kanaalberichten.

    **Nieuw**: `BodyForAgent` plus gestructureerde gebruikerscontextblokken. Kanaalplugins
    voegen routeringsmetadata (thread, onderwerp, antwoord-op, reacties) toe als
    getypeerde velden in plaats van ze samen te voegen tot een promptstring. De
    `formatAgentEnvelope(...)`-helper wordt nog ondersteund voor gesynthetiseerde
    enveloppen richting assistant, maar inkomende plattetekst-enveloppen worden
    uitgefaseerd.

    Betrokken gebieden: `inbound_claim`, `message_received` en elke aangepaste
    kanaalplugin die `channelEnvelope`-tekst nabewerkte.

  </Accordion>

  <Accordion title="deactivate-hook → gateway_stop">
    **Oud**: `api.on("deactivate", handler)`.

    **Nieuw**: `api.on("gateway_stop", handler)`. De gebeurtenis en context zijn hetzelfde
    shutdown-opruimcontract; alleen de hooknaam verandert.

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

    `deactivate` blijft tot na 2026-08-16 gekoppeld als verouderde
    compatibiliteitsalias.

  </Accordion>

  <Accordion title="subagent_spawning-hook → core-threadbinding">
    **Oud**: `api.on("subagent_spawning", handler)` retourneert
    `threadBindingReady` of `deliveryOrigin`.

    **Nieuw**: laat core `thread: true`-subagentbindings voorbereiden via de
    kanaaladapter voor sessiebinding. Gebruik `api.on("subagent_spawned", handler)`
    alleen voor observatie na het starten.

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
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` blijven alleen als
    verouderde compatibiliteitsoppervlakken bestaan terwijl externe plugins migreren.

  </Accordion>

  <Accordion title="Provider-discoverytypes → providercatalogustypes">
    Vier discovery-typealiassen zijn nu dunne wrappers rond de types uit het
    catalogustijdperk:

    | Oude alias                | Nieuw type                |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Plus de verouderde statische `ProviderCapabilities`-bag - providerplugins
    moeten expliciete providerhooks gebruiken zoals `buildReplayPolicy`,
    `normalizeToolSchemas` en `wrapStreamFn` in plaats van een statisch object.

  </Accordion>

  <Accordion title="Thinking-policyhooks → resolveThinkingProfile">
    **Oud** (drie afzonderlijke hooks op `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` en
    `resolveDefaultThinkingLevel(ctx)`.

    **Nieuw**: één `resolveThinkingProfile(ctx)` die een
    `ProviderThinkingProfile` retourneert met de canonieke `id`, optionele `label` en
    gerangschikte levellijst. OpenClaw verlaagt verouderde opgeslagen waarden
    automatisch op basis van profielrang.

    De context bevat `provider`, `modelId`, optioneel samengevoegde `reasoning`
    en optioneel samengevoegde model-`compat`-feiten. Providerplugins kunnen die
    catalogusfeiten gebruiken om alleen een modelspecifiek profiel beschikbaar te maken
    wanneer het geconfigureerde requestcontract dit ondersteunt.

    Implementeer één hook in plaats van drie. De legacy hooks blijven werken tijdens
    het uitfaseringsvenster, maar worden niet samengesteld met het profielresultaat.

  </Accordion>

  <Accordion title="Externe auth-providers → contracts.externalAuthProviders">
    **Oud**: externe auth-hooks implementeren zonder de provider in het
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
    in het manifest. Dit consolideert setup/status-env-metadata op één
    plek en voorkomt dat de plugin-runtime moet starten alleen om env-var-lookups
    te beantwoorden.

    `providerAuthEnvVars` blijft ondersteund via een compatibiliteitsadapter
    totdat het uitfaseringsvenster sluit.

  </Accordion>

  <Accordion title="Memory-pluginregistratie → registerMemoryCapability">
    **Oud**: drie afzonderlijke aanroepen -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nieuw**: één aanroep op de memory-state-API -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Dezelfde slots, één registratieaanroep. Additieve prompt- en corpushelpers
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) worden
    niet beïnvloed.

  </Accordion>

  <Accordion title="Memory embedding provider API">
    **Oud**: `api.registerMemoryEmbeddingProvider(...)` plus
    `contracts.memoryEmbeddingProviders`.

    **Nieuw**: `api.registerEmbeddingProvider(...)` plus
    `contracts.embeddingProviders`.

    Het generieke embedding-providercontract is herbruikbaar buiten memory en is
    het ondersteunde pad voor nieuwe providers. De memory-specifieke registratie-API
    blijft als verouderde compatibiliteit gekoppeld terwijl bestaande providers migreren.
    Plugininspectie rapporteert niet-gebundeld gebruik als compatibiliteitsschuld.

  </Accordion>

  <Accordion title="Subagent-sessieberichttypes hernoemd">
    Twee legacy typealiassen worden nog geëxporteerd uit `src/plugins/runtime/types.ts`:

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
    runtime voor plugins die child tasks vanuit een flow maken, bijwerken, annuleren
    of uitvoeren. Gebruik `runtime.tasks.flows` wanneer de plugin alleen DTO-gebaseerde
    leesacties nodig heeft.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Ingebedde extension-factories → agent tool-result middleware">
    Behandeld in "Migreren → Ingebedde tool-result-extensions migreren naar
    middleware" hierboven. Hier opgenomen voor volledigheid: het verwijderde, alleen voor
    embedded-runner bedoelde pad `api.registerEmbeddedExtensionFactory(...)` is vervangen
    door `api.registerAgentToolResultMiddleware(...)` met een expliciete runtimelijst
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
Uitfaseringen op extension-niveau (binnen gebundelde kanaal-/providerplugins onder
`extensions/`) worden bijgehouden in hun eigen `api.ts`- en `runtime-api.ts`-
barrels. Ze hebben geen invloed op plugincontracten van derden en worden hier niet
vermeld. Als je de lokale barrel van een gebundelde plugin rechtstreeks gebruikt, lees dan
de uitfaseringscommentaren in die barrel voordat je upgradet.
</Note>

## Tijdlijn voor verwijdering

| Wanneer                | Wat gebeurt er                                                          |
| ---------------------- | ----------------------------------------------------------------------- |
| **Nu**                 | Verouderde oppervlakken geven runtimewaarschuwingen                     |
| **Volgende major release** | Verouderde oppervlakken worden verwijderd; plugins die ze nog gebruiken zullen falen |

Alle kernplugins zijn al gemigreerd. Externe plugins moeten vóór de volgende
major release migreren.

## De waarschuwingen tijdelijk onderdrukken

Stel deze omgevingsvariabelen in terwijl je aan de migratie werkt:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Dit is een tijdelijke uitweg, geen permanente oplossing.

## Gerelateerd

- [Aan de slag](/nl/plugins/building-plugins) - bouw je eerste plugin
- [SDK-overzicht](/nl/plugins/sdk-overview) - volledige referentie voor subpath-imports
- [Kanaalplugins](/nl/plugins/sdk-channel-plugins) - kanaalplugins bouwen
- [Providerplugins](/nl/plugins/sdk-provider-plugins) - providerplugins bouwen
- [Plugininternals](/nl/plugins/architecture) - diepgaande architectuuruitleg
- [Pluginmanifest](/nl/plugins/manifest) - referentie voor manifestschema
