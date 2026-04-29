---
read_when:
    - Je ziet de waarschuwing OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Je ziet de waarschuwing OPENCLAW_EXTENSION_API_DEPRECATED
    - Je gebruikte api.registerEmbeddedExtensionFactory vóór OpenClaw 2026.4.25
    - U werkt een plugin bij naar de moderne pluginarchitectuur
    - Je onderhoudt een externe OpenClaw Plugin
sidebarTitle: Migrate to SDK
summary: Migreren van de verouderde laag voor achterwaartse compatibiliteit naar de moderne Plugin SDK
title: Plugin-SDK-migratie
x-i18n:
    generated_at: "2026-04-29T23:05:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00a1f95a33c50d5c69d7b4768858289365bf29ed069abb3f29218e03c597b4c6
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw is overgestapt van een brede achterwaartse-compatibiliteitslaag naar een moderne plugin
architectuur met gerichte, gedocumenteerde imports. Als je plugin is gebouwd vóór
de nieuwe architectuur, helpt deze gids je met migreren.

## Wat verandert er

Het oude pluginsysteem bood twee volledig open oppervlakken waarmee plugins alles
wat ze nodig hadden konden importeren vanaf één entrypoint:

- **`openclaw/plugin-sdk/compat`** — een enkele import die tientallen
  helpers opnieuw exporteerde. Deze werd geïntroduceerd om oudere hook-gebaseerde plugins werkend te houden terwijl de
  nieuwe pluginarchitectuur werd gebouwd.
- **`openclaw/plugin-sdk/infra-runtime`** — een brede runtime-helperbarrel die
  systeemgebeurtenissen, Heartbeat-status, afleveringswachtrijen, fetch-/proxyhelpers,
  bestandshelpers, goedkeuringstypen en niet-gerelateerde hulpprogramma's mengde.
- **`openclaw/plugin-sdk/config-runtime`** — een brede config-compatibiliteitsbarrel
  die tijdens de migratieperiode nog verouderde directe laad-/schrijfhelpers bevat.
- **`openclaw/extension-api`** — een bridge die plugins directe toegang gaf tot
  host-side helpers zoals de ingebedde agent-runner.
- **`api.registerEmbeddedExtensionFactory(...)`** — een verwijderde alleen-voor-Pi gebundelde
  extension-hook die embedded-runner-gebeurtenissen zoals
  `tool_result` kon observeren.

De brede importoppervlakken zijn nu **verouderd**. Ze werken nog steeds tijdens runtime,
maar nieuwe plugins mogen ze niet gebruiken, en bestaande plugins moeten migreren voordat
de volgende major release ze verwijdert. De alleen-voor-Pi API voor embedded extension factory
registratie is verwijderd; gebruik in plaats daarvan tool-result-middleware.

OpenClaw verwijdert of herinterpreteert geen gedocumenteerd plugingedrag in dezelfde
wijziging die een vervanging introduceert. Breaking contract changes moeten eerst
via een compatibiliteitsadapter, diagnostiek, docs en een deprecatievenster lopen.
Dat geldt voor SDK-imports, manifestvelden, setup-API's, hooks en runtime
registratiegedrag.

<Warning>
  De achterwaartse-compatibiliteitslaag wordt in een toekomstige major release verwijderd.
  Plugins die nog steeds uit deze oppervlakken importeren, breken wanneer dat gebeurt.
  Alleen-voor-Pi embedded extension factory-registraties laden nu al niet meer.
</Warning>

## Waarom dit is veranderd

De oude aanpak veroorzaakte problemen:

- **Trage startup** — het importeren van één helper laadde tientallen niet-gerelateerde modules
- **Circulaire afhankelijkheden** — brede re-exports maakten het gemakkelijk om importcycli te creëren
- **Onduidelijk API-oppervlak** — geen manier om te zien welke exports stabiel waren versus intern

De moderne plugin-SDK lost dit op: elk importpad (`openclaw/plugin-sdk/\<subpath\>`)
is een kleine, zelfstandige module met een duidelijk doel en een gedocumenteerd contract.

Legacy provider-convenience seams voor gebundelde kanalen zijn ook verdwenen.
Kanaal-branded helper seams waren private mono-repo-shortcuts, geen stabiele
plugincontracten. Gebruik in plaats daarvan smalle generieke SDK-subpaden. Houd binnen de gebundelde
pluginworkspace provider-owned helpers in de eigen `api.ts` of
`runtime-api.ts` van die plugin.

Huidige voorbeelden van gebundelde providers:

- Anthropic bewaart Claude-specifieke streamhelpers in zijn eigen `api.ts` /
  `contract-api.ts` seam
- OpenAI bewaart provider-builders, default-model helpers en realtime provider
  builders in zijn eigen `api.ts`
- OpenRouter bewaart provider builder en onboarding-/confighelpers in zijn eigen
  `api.ts`

## Compatibiliteitsbeleid

Voor externe plugins volgt compatibiliteitswerk deze volgorde:

1. voeg het nieuwe contract toe
2. houd het oude gedrag aangesloten via een compatibiliteitsadapter
3. geef een diagnostische melding of waarschuwing die het oude pad en de vervanging noemt
4. dek beide paden af in tests
5. documenteer de deprecatie en het migratiepad
6. verwijder pas na het aangekondigde migratievenster, meestal in een major release

Maintainers kunnen de huidige migratiewachtrij auditen met
`pnpm plugins:boundary-report`. Gebruik `pnpm plugins:boundary-report:summary` voor
compacte aantallen, `--owner <id>` voor één plugin of compatibiliteitseigenaar, en
`pnpm plugins:boundary-report:ci` wanneer een CI-gate moet falen op verlopen
compatibiliteitsrecords, cross-owner gereserveerde SDK-imports of ongebruikte gereserveerde SDK
subpaden. Het rapport groepeert verouderde
compatibiliteitsrecords op verwijderdatum, telt lokale code-/docs-verwijzingen,
toont cross-owner gereserveerde SDK-imports en vat de private
memory-host SDK-bridge samen zodat compatibiliteitsopschoning expliciet blijft in plaats van
te vertrouwen op ad-hoc zoekopdrachten. Gereserveerde SDK-subpaden moeten bijgehouden eigenaarsgebruik hebben;
ongebruikte gereserveerde helper-exports moeten uit de publieke SDK worden verwijderd.

Als een manifestveld nog steeds wordt geaccepteerd, kunnen pluginauteurs het blijven gebruiken totdat
de docs en diagnostiek iets anders aangeven. Nieuwe code moet de gedocumenteerde
vervanging verkiezen, maar bestaande plugins mogen niet breken tijdens gewone minor
releases.

## Migreren

<Steps>
  <Step title="Migreer runtime-config laad-/schrijfhelpers">
    Gebundelde plugins moeten stoppen met het rechtstreeks aanroepen van
    `api.runtime.config.loadConfig()` en
    `api.runtime.config.writeConfigFile(...)`. Geef de voorkeur aan config die al
    is doorgegeven aan het actieve call path. Langlevende handlers die de
    huidige processnapshot nodig hebben, kunnen `api.runtime.config.current()` gebruiken. Langlevende
    agent-tools moeten de `ctx.getRuntimeConfig()` van de toolcontext gebruiken binnen
    `execute`, zodat een tool die vóór een configschrijfactie is aangemaakt nog steeds de vernieuwde
    runtimeconfig ziet.

    Configschrijfacties moeten via de transactionele helpers lopen en een
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
    dat de wijziging een schone gateway-restart vereist, en
    `afterWrite: { mode: "none", reason: "..." }` alleen wanneer de aanroeper eigenaar is van de
    follow-up en bewust de reload-planner wil onderdrukken.
    Mutatieresultaten bevatten een getypte `followUp`-samenvatting voor tests en logging;
    de Gateway blijft verantwoordelijk voor het toepassen of plannen van de restart.
    `loadConfig` en `writeConfigFile` blijven als verouderde compatibiliteitshelpers
    voor externe plugins tijdens het migratievenster bestaan en waarschuwen één keer met
    de compatibiliteitscode `runtime-config-load-write`. Gebundelde plugins en repo
    runtimecode worden beschermd door scanner-guardrails in
    `pnpm check:deprecated-internal-config-api` en
    `pnpm check:no-runtime-action-load-config`: nieuw productie-plugingebruik
    faalt direct, directe configschrijfacties falen, gatewayservermethoden moeten
    de request-runtime-snapshot gebruiken, runtime channel send/action/client helpers
    moeten config ontvangen vanaf hun grens, en langlevende runtimemodules hebben
    nul toegestane omgevingsaanroepen naar `loadConfig()`.

    Nieuwe plugincode moet ook vermijden de brede compatibiliteitsbarrel
    `openclaw/plugin-sdk/config-runtime` te importeren. Gebruik het smalle
    SDK-subpad dat bij de taak past:

    | Behoefte | Import |
    | --- | --- |
    | Configtypen zoals `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Reeds geladen configasserties en plugin-entry config lookup | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Huidige runtime-snapshot-lezingen | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Configschrijfacties | `openclaw/plugin-sdk/config-mutation` |
    | Sessieopslaghelpers | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown-tabelconfig | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Runtimehelpers voor groepsbeleid | `openclaw/plugin-sdk/runtime-group-policy` |
    | Resolutie van geheime invoer | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model-/sessie-overrides | `openclaw/plugin-sdk/model-session-runtime` |

    Gebundelde plugins en hun tests worden door scanners bewaakt tegen de brede
    barrel, zodat imports en mocks lokaal blijven voor het gedrag dat ze nodig hebben. De brede
    barrel bestaat nog steeds voor externe compatibiliteit, maar nieuwe code mag er niet
    afhankelijk van zijn.

  </Step>

  <Step title="Migreer Pi tool-result extensions naar middleware">
    Gebundelde plugins moeten alleen-voor-Pi
    `api.registerEmbeddedExtensionFactory(...)` tool-result handlers vervangen door
    runtime-neutrale middleware.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Werk tegelijk het pluginmanifest bij:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Externe plugins kunnen geen tool-result middleware registreren omdat die
    tooluitvoer met hoog vertrouwen kan herschrijven voordat het model die ziet.

  </Step>

  <Step title="Migreer approval-native handlers naar capability facts">
    Approval-capable channel plugins stellen native approval-gedrag nu beschikbaar via
    `approvalCapability.nativeRuntime` plus het gedeelde runtime-contextregister.

    Belangrijkste wijzigingen:

    - Vervang `approvalCapability.handler.loadRuntime(...)` door
      `approvalCapability.nativeRuntime`
    - Verplaats approval-specifieke auth/delivery van legacy `plugin.auth` /
      `plugin.approvals`-wiring naar `approvalCapability`
    - `ChannelPlugin.approvals` is verwijderd uit het publieke channel-plugin
      contract; verplaats delivery/native/render-velden naar `approvalCapability`
    - `plugin.auth` blijft alleen voor kanaal-login-/logoutflows; approval-auth
      hooks daar worden niet langer door core gelezen
    - Registreer kanaal-owned runtimeobjecten zoals clients, tokens of Bolt
      apps via `openclaw/plugin-sdk/channel-runtime-context`
    - Verstuur geen plugin-owned reroute notices vanuit native approval handlers;
      core is nu eigenaar van routed-elsewhere notices uit daadwerkelijke deliveryresultaten
    - Wanneer je `channelRuntime` doorgeeft aan `createChannelManager(...)`, geef dan een
      echte `createPluginRuntime().channel`-surface op. Gedeeltelijke stubs worden afgewezen.

    Zie `/plugins/sdk-channel-plugins` voor de huidige approval capability
    layout.

  </Step>

  <Step title="Audit Windows-wrapper fallbackgedrag">
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

    Als je aanroeper niet bewust op shell fallback vertrouwt, stel
    `allowShellFallback` dan niet in en handel in plaats daarvan de geworpen fout af.

  </Step>

  <Step title="Vind verouderde imports">
    Doorzoek je plugin naar imports uit een van beide verouderde oppervlakken:

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

    Gebruik voor host-side helpers de geïnjecteerde pluginruntime in plaats van rechtstreeks te importeren:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
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
    | sessieopslaghelpers | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` bestaat nog steeds voor externe
    compatibiliteit, maar nieuwe code moet het gerichte helper-oppervlak importeren dat
    die daadwerkelijk nodig heeft:

    | Behoefte | Import |
    | --- | --- |
    | Helpers voor de wachtrij voor systeemgebeurtenissen | `openclaw/plugin-sdk/system-event-runtime` |
    | Helpers voor Heartbeat-gebeurtenissen en zichtbaarheid | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Leegmaken van wachtrij voor openstaande aflevering | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetrie voor kanaalactiviteit | `openclaw/plugin-sdk/channel-activity-runtime` |
    | In-memory deduplicatiecaches | `openclaw/plugin-sdk/dedupe-runtime` |
    | Veilige helpers voor lokale bestands-/mediapaden | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher-bewuste fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Helpers voor proxy en bewaakte fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Beleidstypen voor SSRF-dispatcher | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Typen voor goedkeuringsaanvragen/-oplossingen | `openclaw/plugin-sdk/approval-runtime` |
    | Helpers voor goedkeuringsantwoordpayloads en opdrachten | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helpers voor foutopmaak | `openclaw/plugin-sdk/error-runtime` |
    | Wachttijden voor transportgereedheid | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helpers voor veilige tokens | `openclaw/plugin-sdk/secure-random-runtime` |
    | Begrensde gelijktijdigheid van asynchrone taken | `openclaw/plugin-sdk/concurrency-runtime` |
    | Numerieke conversie | `openclaw/plugin-sdk/number-runtime` |
    | Proceslokale asynchrone lock | `openclaw/plugin-sdk/async-lock-runtime` |
    | Bestandslocks | `openclaw/plugin-sdk/file-lock` |

    Gebundelde plugins worden door scanners bewaakt tegen `infra-runtime`, zodat repocode
    niet kan terugvallen op de brede barrel.

  </Step>

  <Step title="Migrate channel route helpers">
    Nieuwe kanaalroutecode moet `openclaw/plugin-sdk/channel-route` gebruiken.
    De oudere route-key- en comparable-target-namen blijven tijdens het migratievenster beschikbaar als compatibiliteitsaliassen, maar nieuwe plugins moeten de routenamen gebruiken
    die het gedrag rechtstreeks beschrijven:

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
    Cron-aflevering en sessieroutering. Als je plugin eigen doelgrammatica beheert,
    gebruik dan `resolveChannelRouteTargetWithParser(...)` om die parser aan te passen aan hetzelfde routedoelcontract.

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
  | `plugin-sdk/plugin-entry` | Canonieke Plugin-entryhulpfunctie | `definePluginEntry` |
  | `plugin-sdk/core` | Verouderde overkoepelende her-export voor kanaal-entrydefinities/-bouwers | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export van root-configuratieschema | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Entryhulpfunctie voor één provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Gerichte kanaal-entrydefinities en -bouwers | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Gedeelde hulpfuncties voor de installatiewizard | Prompts voor toegestane lijsten, bouwers voor installatiestatus |
  | `plugin-sdk/setup-runtime` | Runtime-hulpfuncties tijdens installatie | Importveilige adapters voor installatiepatches, hulpfuncties voor opzoeknotities, `promptResolvedAllowFrom`, `splitSetupEntries`, gedelegeerde installatieproxy's |
  | `plugin-sdk/setup-adapter-runtime` | Hulpfuncties voor installatieadapters | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Hulpfuncties voor installatiehulpmiddelen | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Hulpfuncties voor meerdere accounts | Hulpfuncties voor accountlijst/configuratie/actiepoort |
  | `plugin-sdk/account-id` | Hulpfuncties voor account-id's | `DEFAULT_ACCOUNT_ID`, normalisatie van account-id's |
  | `plugin-sdk/account-resolution` | Hulpfuncties voor accountopzoeking | Hulpfuncties voor accountopzoeking en standaardterugval |
  | `plugin-sdk/account-helpers` | Smalle accounthulpfuncties | Hulpfuncties voor accountlijst/accountactie |
  | `plugin-sdk/channel-setup` | Adapters voor installatiewizard | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitieven voor DM-koppeling | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Bedrading voor antwoordprefix, typen en bronlevering | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fabrieken voor configuratieadapters en hulpfuncties voor DM-toegang | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Bouwers voor configuratieschema's | Gedeelde primitieven voor kanaalconfiguratieschema's en alleen de generieke bouwer |
  | `plugin-sdk/bundled-channel-config-schema` | Gebundelde configuratieschema's | Alleen door OpenClaw onderhouden gebundelde Plugins; nieuwe Plugins moeten Plugin-lokale schema's definiëren |
  | `plugin-sdk/channel-config-schema-legacy` | Verouderde gebundelde configuratieschema's | Alleen compatibiliteitsalias; gebruik `plugin-sdk/bundled-channel-config-schema` voor onderhouden gebundelde Plugins |
  | `plugin-sdk/telegram-command-config` | Hulpfuncties voor Telegram-opdrachtconfiguratie | Normalisatie van opdrachtnamen, inkorten van beschrijvingen, validatie van duplicaten/conflicten |
  | `plugin-sdk/channel-policy` | Beleidsresolutie voor groep/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Hulpfuncties voor accountstatus en levenscyclus van conceptstream | `createAccountStatusSink`, hulpfuncties voor afronding van conceptvoorvertoning |
  | `plugin-sdk/inbound-envelope` | Hulpfuncties voor inkomende enveloppen | Gedeelde hulpfuncties voor route- en envelopbouwer |
  | `plugin-sdk/inbound-reply-dispatch` | Hulpfuncties voor inkomende antwoorden | Gedeelde hulpfuncties voor registreren en dispatchen |
  | `plugin-sdk/messaging-targets` | Parseren van berichtdoelen | Hulpfuncties voor doelparsering/-matching |
  | `plugin-sdk/outbound-media` | Hulpfuncties voor uitgaande media | Gedeeld laden van uitgaande media |
  | `plugin-sdk/outbound-send-deps` | Hulpfuncties voor afhankelijkheden van uitgaand verzenden | Lichtgewicht `resolveOutboundSendDep`-opzoeking zonder de volledige uitgaande runtime te importeren |
  | `plugin-sdk/outbound-runtime` | Uitgaande runtime-hulpfuncties | Hulpfuncties voor uitgaande levering, identiteits-/verzenddelegatie, sessie, opmaak en payloadplanning |
  | `plugin-sdk/thread-bindings-runtime` | Hulpfuncties voor threadbinding | Levenscyclus- en adapterhulpfuncties voor threadbinding |
  | `plugin-sdk/agent-media-payload` | Verouderde hulpfuncties voor mediapayloads | Bouwer voor agent-mediapayloads voor verouderde veldindelingen |
  | `plugin-sdk/channel-runtime` | Verouderde compatibiliteitsshim | Alleen verouderde kanaalruntimehulpmiddelen |
  | `plugin-sdk/channel-send-result` | Typen voor verzendresultaten | Typen voor antwoordresultaten |
  | `plugin-sdk/runtime-store` | Persistente Plugin-opslag | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Brede runtime-hulpfuncties | Hulpfuncties voor runtime/logging/back-up/Plugin-installatie |
  | `plugin-sdk/runtime-env` | Smalle hulpfuncties voor runtime-omgeving | Hulpfuncties voor logger/runtime-omgeving, time-out, opnieuw proberen en back-off |
  | `plugin-sdk/plugin-runtime` | Gedeelde Plugin-runtimehulpfuncties | Hulpfuncties voor Plugin-opdrachten/hooks/http/interactief |
  | `plugin-sdk/hook-runtime` | Hulpfuncties voor hook-pijplijn | Gedeelde hulpfuncties voor Webhook/interne hook-pijplijn |
  | `plugin-sdk/lazy-runtime` | Lazy runtime-hulpfuncties | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Proceshulpfuncties | Gedeelde uitvoerhulpfuncties |
  | `plugin-sdk/cli-runtime` | CLI-runtimehulpfuncties | Opdrachtopmaak, wachttijden, versiehulpfuncties |
  | `plugin-sdk/gateway-runtime` | Gateway-hulpfuncties | Gateway-client, starthulpfunctie voor event-loop-gereedheid en hulpfuncties voor kanaalstatuspatches |
  | `plugin-sdk/config-runtime` | Verouderde compatibiliteitsshim voor configuratie | Geef de voorkeur aan `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` en `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Hulpfuncties voor Telegram-opdrachten | Terugvalstabiele hulpfuncties voor validatie van Telegram-opdrachten wanneer het gebundelde Telegram-contractoppervlak niet beschikbaar is |
  | `plugin-sdk/approval-runtime` | Hulpfuncties voor goedkeuringsprompt | Payload voor exec-/Plugin-goedkeuring, hulpfuncties voor goedkeuringsmogelijkheid/-profiel, routering/runtime voor native goedkeuring en opmaak van gestructureerd weergavepad voor goedkeuring |
  | `plugin-sdk/approval-auth-runtime` | Hulpfuncties voor goedkeuringsauthenticatie | Oplossing van goedkeurder, actie-authenticatie in dezelfde chat |
  | `plugin-sdk/approval-client-runtime` | Hulpfuncties voor goedkeuringsclient | Native hulpfuncties voor exec-goedkeuringsprofiel/-filter |
  | `plugin-sdk/approval-delivery-runtime` | Hulpfuncties voor goedkeuringslevering | Native adapters voor goedkeuringsmogelijkheid/-levering |
  | `plugin-sdk/approval-gateway-runtime` | Hulpfuncties voor goedkeurings-Gateway | Gedeelde hulpfunctie voor Gateway-resolutie van goedkeuringen |
  | `plugin-sdk/approval-handler-adapter-runtime` | Hulpfuncties voor goedkeuringsadapters | Lichtgewicht hulpfuncties voor het laden van native goedkeuringsadapters voor hete kanaal-entrypoints |
  | `plugin-sdk/approval-handler-runtime` | Hulpfuncties voor goedkeuringshandlers | Bredere runtime-hulpfuncties voor goedkeuringshandlers; geef de voorkeur aan de smallere adapter-/Gateway-naden wanneer die voldoende zijn |
  | `plugin-sdk/approval-native-runtime` | Hulpfuncties voor goedkeuringsdoelen | Native hulpfuncties voor goedkeuringsdoel-/accountbinding |
  | `plugin-sdk/approval-reply-runtime` | Hulpfuncties voor goedkeuringsantwoorden | Hulpfuncties voor payloads van exec-/Plugin-goedkeuringsantwoorden |
  | `plugin-sdk/channel-runtime-context` | Hulpfuncties voor kanaalruntimecontext | Generieke hulpfuncties voor registreren/ophalen/bewaken van kanaalruntimecontext |
  | `plugin-sdk/security-runtime` | Beveiligingshulpfuncties | Gedeelde hulpfuncties voor vertrouwen, DM-poort, externe inhoud en geheimverzameling |
  | `plugin-sdk/ssrf-policy` | Hulpfuncties voor SSRF-beleid | Hulpfuncties voor host-toegestane lijst en privénetwerkbeleid |
  | `plugin-sdk/ssrf-runtime` | SSRF-runtimehulpfuncties | Vastgezette dispatcher, bewaakte fetch, hulpfuncties voor SSRF-beleid |
  | `plugin-sdk/system-event-runtime` | Hulpfuncties voor systeemgebeurtenissen | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat-hulpfuncties | Hulpfuncties voor Heartbeat-gebeurtenis en zichtbaarheid |
  | `plugin-sdk/delivery-queue-runtime` | Hulpfuncties voor leveringswachtrij | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Hulpfuncties voor kanaalactiviteit | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Hulpfuncties voor deduplicatie | In-memory deduplicatiecaches |
  | `plugin-sdk/file-access-runtime` | Hulpfuncties voor bestandstoegang | Veilige hulpfuncties voor lokale bestands-/mediapaden |
  | `plugin-sdk/transport-ready-runtime` | Hulpfuncties voor transportgereedheid | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Hulpfuncties voor begrensde cache | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Hulpfuncties voor diagnostische gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hulpfuncties voor foutopmaak | `formatUncaughtError`, `isApprovalNotFoundError`, hulpfuncties voor foutgrafen |
  | `plugin-sdk/fetch-runtime` | Hulpfuncties voor omwikkelde fetch/proxy | `resolveFetch`, proxyhulpfuncties, hulpfuncties voor EnvHttpProxyAgent-opties |
  | `plugin-sdk/host-runtime` | Hulpfuncties voor hostnormalisatie | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Hulpfuncties voor opnieuw proberen | `RetryConfig`, `retryAsync`, beleidsrunners |
  | `plugin-sdk/allow-from` | Opmaak van toegestane lijst | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Invoermapping voor toegestane lijst | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Hulpfuncties voor opdrachtgating en opdrachtoppervlak | `resolveControlCommandGate`, hulpfuncties voor afzenderautorisatie, hulpfuncties voor opdrachtregister inclusief opmaak van dynamisch argumentmenu |
  | `plugin-sdk/command-status` | Renderers voor opdrachtstatus/help | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parseren van geheime invoer | Hulpfuncties voor geheime invoer |
  | `plugin-sdk/webhook-ingress` | Hulpfuncties voor Webhook-verzoeken | Hulpmiddelen voor Webhook-doelen |
  | `plugin-sdk/webhook-request-guards` | Hulpfuncties voor Webhook-bodyguard | Hulpfuncties voor lezen/beperken van requestbody |
  | `plugin-sdk/reply-runtime` | Gedeelde antwoordruntime | Inkomende dispatch, Heartbeat, antwoordplanner, opdelen in chunks |
  | `plugin-sdk/reply-dispatch-runtime` | Smalle hulpfuncties voor antwoorddispatch | Afronden, providerdispatch en hulpfuncties voor gesprekslabels |
  | `plugin-sdk/reply-history` | Hulpfuncties voor antwoordgeschiedenis | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planning van antwoordverwijzingen | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Hulpfuncties voor antwoordchunks | Hulpfuncties voor opdelen van tekst/markdown in chunks |
  | `plugin-sdk/session-store-runtime` | Hulpfuncties voor sessiestore | Storepad en bijgewerkt-op-hulpfuncties |
  | `plugin-sdk/state-paths` | Hulpfuncties voor statuspaden | Status- en OAuth-map-hulpfuncties |
  | `plugin-sdk/routing` | Hulpfuncties voor routing/sessiesleutel | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, hulpfuncties voor normalisatie van sessiesleutels |
  | `plugin-sdk/status-helpers` | Hulpfuncties voor kanaalstatus | Bouwers voor kanaal-/accountstatussamenvattingen, standaardwaarden voor runtime-status, hulpfuncties voor probleemmetadata |
  | `plugin-sdk/target-resolver-runtime` | Hulpfuncties voor doelresolver | Gedeelde hulpfuncties voor doelresolver |
  | `plugin-sdk/string-normalization-runtime` | Hulpfuncties voor tekenreeksnormalisatie | Hulpfuncties voor slug-/tekenreeksnormalisatie |
  | `plugin-sdk/request-url` | Hulpfuncties voor request-URL | Haal tekenreeks-URL's uit request-achtige invoer |
  | `plugin-sdk/run-command` | Hulpfuncties voor getimede opdrachten | Getimede opdrachtrunner met genormaliseerde stdout/stderr |
  | `plugin-sdk/param-readers` | Paramlezers | Algemene paramlezers voor tools/CLI |
  | `plugin-sdk/tool-payload` | Extractie van toolpayloads | Extraheer genormaliseerde payloads uit toolresultaatobjecten |
  | `plugin-sdk/tool-send` | Extractie van toolverzending | Extraheer canonieke doelvelden voor verzenden uit toolargumenten |
  | `plugin-sdk/temp-path` | Hulpfuncties voor tijdelijke paden | Gedeelde hulpfuncties voor tijdelijke downloadpaden |
  | `plugin-sdk/logging-core` | Logging-hulpfuncties | Hulpfuncties voor subsystemloggers en redactie |
  | `plugin-sdk/markdown-table-runtime` | Hulpfuncties voor Markdown-tabellen | Hulpfuncties voor Markdown-tabelmodi |
  | `plugin-sdk/reply-payload` | Typen voor berichtantwoorden | Typen voor antwoordpayloads |
  | `plugin-sdk/provider-setup` | Samengestelde hulpfuncties voor lokale/zelfgehoste providerconfiguratie | Hulpfuncties voor detectie/configuratie van zelfgehoste providers |
  | `plugin-sdk/self-hosted-provider-setup` | Gerichte hulpfuncties voor OpenAI-compatibele zelfgehoste providerconfiguratie | Dezelfde hulpfuncties voor detectie/configuratie van zelfgehoste providers |
  | `plugin-sdk/provider-auth-runtime` | Hulpfuncties voor provider-runtimeauthenticatie | Hulpfuncties voor runtime-resolutie van API-sleutels |
  | `plugin-sdk/provider-auth-api-key` | Hulpfuncties voor provider-API-sleutelconfiguratie | Hulpfuncties voor onboarding/API-sleutelprofielschrijven |
  | `plugin-sdk/provider-auth-result` | Hulpfuncties voor provider-authenticatieresultaten | Standaardbouwer voor OAuth-authenticatieresultaten |
  | `plugin-sdk/provider-auth-login` | Hulpfuncties voor interactieve providerlogin | Gedeelde hulpfuncties voor interactieve login |
  | `plugin-sdk/provider-selection-runtime` | Hulpfuncties voor providerselectie | Geconfigureerde-of-automatische providerselectie en samenvoegen van ruwe providerconfiguratie |
  | `plugin-sdk/provider-env-vars` | Hulpfuncties voor provideromgevingsvariabelen | Hulpfuncties voor opzoeken van provider-authenticatieomgevingsvariabelen |
  | `plugin-sdk/provider-model-shared` | Gedeelde hulpfuncties voor providermodel/replay | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gedeelde replay-beleidsbouwers, provider-endpointhulpfuncties en hulpfuncties voor model-id-normalisatie |
  | `plugin-sdk/provider-catalog-shared` | Gedeelde hulpfuncties voor providercatalogus | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches voor provideronboarding | Hulpfuncties voor onboardingconfiguratie |
  | `plugin-sdk/provider-http` | Provider-HTTP-hulpfuncties | Generieke hulpfuncties voor provider-HTTP/endpointmogelijkheden, inclusief hulpfuncties voor audio-transcriptieformulieren met multipart |
  | `plugin-sdk/provider-web-fetch` | Provider-web-fetch-hulpfuncties | Hulpfuncties voor registratie/cache van web-fetch-providers |
  | `plugin-sdk/provider-web-search-config-contract` | Hulpfuncties voor provider-web-search-configuratie | Gerichte hulpfuncties voor web-search-configuratie/referenties voor providers die geen Plugin-enable-bedrading nodig hebben |
  | `plugin-sdk/provider-web-search-contract` | Hulpfuncties voor provider-web-search-contracten | Gerichte hulpfuncties voor web-search-configuratie/referentiecontracten, zoals `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` en scoped referentie-setters/getters |
  | `plugin-sdk/provider-web-search` | Provider-web-search-hulpfuncties | Hulpfuncties voor registratie/cache/runtime van web-search-providers |
  | `plugin-sdk/provider-tools` | Hulpfuncties voor provider-tool/schema-compatibiliteit | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-schemaopschoning + diagnostiek en xAI-compatibiliteitshulpfuncties zoals `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Hulpfuncties voor providergebruik | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` en andere hulpfuncties voor providergebruik |
  | `plugin-sdk/provider-stream` | Hulpfuncties voor providerstream-wrappers | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typen voor stream-wrappers en gedeelde wrapperhulpfuncties voor Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Hulpfuncties voor providertransport | Native hulpfuncties voor providertransport, zoals bewaakte fetch, transformaties van transportberichten en schrijfbare transporteventstreams |
  | `plugin-sdk/keyed-async-queue` | Geordende asynchrone wachtrij | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Gedeelde mediahulpfuncties | Hulpfuncties voor media ophalen/transformeren/opslaan, ffprobe-ondersteunde probing van videoafmetingen en bouwers voor mediapayloads |
  | `plugin-sdk/media-generation-runtime` | Gedeelde hulpfuncties voor mediageneratie | Gedeelde failover-hulpfuncties, kandidaatselectie en berichten over ontbrekende modellen voor beeld-/video-/muziekgeneratie |
  | `plugin-sdk/media-understanding` | Hulpfuncties voor mediabegrip | Providertypen voor mediabegrip plus providergerichte exports voor beeld-/audiohulpfuncties |
  | `plugin-sdk/text-runtime` | Gedeelde teksthulpfuncties | Verwijderen van voor assistenten zichtbare tekst, hulpfuncties voor Markdown-rendering/chunking/tabellen, redactiehulpfuncties, hulpfuncties voor directivetags, veilige-teksthulpprogramma's en gerelateerde tekst-/logginghulpfuncties |
  | `plugin-sdk/text-chunking` | Hulpfuncties voor tekstchunking | Hulpfunctie voor uitgaande tekstchunking |
  | `plugin-sdk/speech` | Spraakhulpfuncties | Spraakprovidertypen plus providergerichte hulpfuncties voor directives, register en validatie, en OpenAI-compatibele TTS-bouwer |
  | `plugin-sdk/speech-core` | Gedeelde spraakkern | Spraakprovidertypen, register, directives, normalisatie |
  | `plugin-sdk/realtime-transcription` | Hulpfuncties voor realtime transcriptie | Providertypen, registerhulpfuncties en gedeelde WebSocket-sessiehulpfunctie |
  | `plugin-sdk/realtime-voice` | Hulpfuncties voor realtime spraak | Providertypen, hulpfuncties voor register/resolutie en brugsessiehulpfuncties |
  | `plugin-sdk/image-generation` | Hulpfuncties voor beeldgeneratie | Providertypen voor beeldgeneratie plus hulpfuncties voor beeldassets/data-URL's en de OpenAI-compatibele beeldproviderbouwer |
  | `plugin-sdk/image-generation-core` | Gedeelde kern voor beeldgeneratie | Typen voor beeldgeneratie, failover, authenticatie en registerhulpfuncties |
  | `plugin-sdk/music-generation` | Hulpfuncties voor muziekgeneratie | Provider-/aanvraag-/resultaattypen voor muziekgeneratie |
  | `plugin-sdk/music-generation-core` | Gedeelde kern voor muziekgeneratie | Typen voor muziekgeneratie, failover-hulpfuncties, providerlookup en model-ref-parsing |
  | `plugin-sdk/video-generation` | Hulpfuncties voor videogeneratie | Provider-/aanvraag-/resultaattypen voor videogeneratie |
  | `plugin-sdk/video-generation-core` | Gedeelde kern voor videogeneratie | Typen voor videogeneratie, failover-hulpfuncties, providerlookup en model-ref-parsing |
  | `plugin-sdk/interactive-runtime` | Hulpfuncties voor interactieve antwoorden | Normalisatie/reductie van interactieve antwoordpayloads |
  | `plugin-sdk/channel-config-primitives` | Primitieven voor kanaalconfiguratie | Gerichte primitieven voor kanaalconfiguratieschema's |
  | `plugin-sdk/channel-config-writes` | Hulpfuncties voor schrijven van kanaalconfiguratie | Autorisatiehulpfuncties voor schrijven van kanaalconfiguratie |
  | `plugin-sdk/channel-plugin-common` | Gedeelde kanaalprelude | Gedeelde exports voor kanaal-Plugin-prelude |
  | `plugin-sdk/channel-status` | Hulpfuncties voor kanaalstatus | Gedeelde hulpfuncties voor kanaalstatussnapshots/-samenvattingen |
  | `plugin-sdk/allowlist-config-edit` | Hulpfuncties voor allowlist-configuratie | Hulpfuncties voor bewerken/lezen van allowlist-configuratie |
  | `plugin-sdk/group-access` | Hulpfuncties voor groepstoegang | Gedeelde beslissingshulpfuncties voor groepstoegang |
  | `plugin-sdk/direct-dm` | Hulpfuncties voor directe DM | Gedeelde hulpfuncties voor directe-DM-authenticatie/-guards |
  | `plugin-sdk/extension-shared` | Gedeelde extensiehulpfuncties | Primitieven voor passief kanaal/status en ambient proxy-hulpfuncties |
  | `plugin-sdk/webhook-targets` | Hulpfuncties voor Webhook-doelen | Webhook-doelregister en hulpfuncties voor route-installatie |
  | `plugin-sdk/webhook-path` | Hulpfuncties voor Webhook-paden | Hulpfuncties voor normalisatie van Webhook-paden |
  | `plugin-sdk/web-media` | Gedeelde webmediahulpfuncties | Hulpfuncties voor laden van externe/lokale media |
  | `plugin-sdk/zod` | Zod-herexport | Geherexporteerde `zod` voor Plugin-SDK-consumenten |
  | `plugin-sdk/memory-core` | Gebundelde memory-core-hulpfuncties | Hulpoppervlak voor geheugenmanager/configuratie/bestand/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Runtimefacade voor geheugenengine | Runtimefacade voor geheugenindex/-zoekfunctie |
  | `plugin-sdk/memory-core-host-engine-foundation` | Foundation-engine voor geheugenhost | Exports van foundation-engine voor geheugenhost |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Embeddingengine voor geheugenhost | Geheugenembeddingcontracten, registertoegang, lokale provider en generieke batch-/remote-hulpfuncties; concrete remote providers staan in hun eigen Plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD-engine voor geheugenhost | Exports van QMD-engine voor geheugenhost |
  | `plugin-sdk/memory-core-host-engine-storage` | Opslagengine voor geheugenhost | Exports van opslagengine voor geheugenhost |
  | `plugin-sdk/memory-core-host-multimodal` | Multimodale hulpfuncties voor geheugenhost | Multimodale hulpfuncties voor geheugenhost |
  | `plugin-sdk/memory-core-host-query` | Queryhulpfuncties voor geheugenhost | Queryhulpfuncties voor geheugenhost |
  | `plugin-sdk/memory-core-host-secret` | Geheimhulpfuncties voor geheugenhost | Geheimhulpfuncties voor geheugenhost |
  | `plugin-sdk/memory-core-host-events` | Hulpfuncties voor eventjournaal van geheugenhost | Hulpfuncties voor eventjournaal van geheugenhost |
  | `plugin-sdk/memory-core-host-status` | Statushulpfuncties voor geheugenhost | Statushulpfuncties voor geheugenhost |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI-runtime voor geheugenhost | CLI-runtimehulpfuncties voor geheugenhost |
  | `plugin-sdk/memory-core-host-runtime-core` | Kernruntime voor geheugenhost | Kernruntimehulpfuncties voor geheugenhost |
  | `plugin-sdk/memory-core-host-runtime-files` | Bestands-/runtimehulpfuncties voor geheugenhost | Bestands-/runtimehulpfuncties voor geheugenhost |
  | `plugin-sdk/memory-host-core` | Alias voor kernruntime van geheugenhost | Leverancieronafhankelijke alias voor kernruntimehulpfuncties van geheugenhost |
  | `plugin-sdk/memory-host-events` | Alias voor eventjournaal van geheugenhost | Leverancieronafhankelijke alias voor hulpfuncties voor eventjournaal van geheugenhost |
  | `plugin-sdk/memory-host-files` | Alias voor bestands-/runtime van geheugenhost | Leverancieronafhankelijke alias voor bestands-/runtimehulpfuncties van geheugenhost |
  | `plugin-sdk/memory-host-markdown` | Hulpfuncties voor beheerde Markdown | Gedeelde hulpfuncties voor beheerde Markdown voor geheugenverwante Plugins |
  | `plugin-sdk/memory-host-search` | Zoekfacade voor Active Memory | Luie runtimefacade voor Active Memory-zoekmanager |
  | `plugin-sdk/memory-host-status` | Alias voor geheugenhoststatus | Leverancieronafhankelijke alias voor statushulpfuncties van geheugenhost |
  | `plugin-sdk/testing` | Testhulpprogramma's | Verouderd breed compatibiliteitsbarrel; geef de voorkeur aan gerichte testsubpaden zoals `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` en `plugin-sdk/test-fixtures` |
</Accordion>

Deze tabel is bewust de gemeenschappelijke migratiesubset, niet het volledige SDK-oppervlak. De volledige lijst met meer dan 200 entrypoints staat in
`scripts/lib/plugin-sdk-entrypoints.json`.

Gereserveerde hulpkoppelingen voor gebundelde plugins zijn uit de export-map van de openbare SDK verwijderd, behalve expliciet gedocumenteerde compatibiliteitsfacades zoals de verouderde `plugin-sdk/discord`-shim die is behouden voor het gepubliceerde
`@openclaw/discord@2026.3.13`-pakket. Eigenaar-specifieke helpers staan binnen het eigenaars-pluginpakket; gedeeld hostgedrag moet via generieke SDK-contracten lopen, zoals `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`
en `plugin-sdk/plugin-config-runtime`.

Gebruik de smalste import die bij de taak past. Als je geen export kunt vinden, controleer dan de bron in `src/plugin-sdk/` of vraag maintainers welk generiek contract er eigenaar van zou moeten zijn.

## Actieve deprecations

Smallere deprecations die gelden voor de plugin-SDK, het providercontract, het runtime-oppervlak en het manifest. Elk ervan werkt vandaag nog, maar wordt in een toekomstige major release verwijderd. De vermelding onder elk item koppelt de oude API aan de canonieke vervanging.

<AccordionGroup>
  <Accordion title="command-auth help-builders → command-status">
    **Oud (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nieuw (`openclaw/plugin-sdk/command-status`)**: dezelfde signatures, dezelfde
    exports — alleen geïmporteerd vanuit het smallere subpad. `command-auth`
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

    **Nieuw**: `resolveInboundMentionDecision({ facts, policy })` — retourneert één
    beslissingsobject in plaats van twee gesplitste calls.

    Downstream kanaalplugins (Slack, Discord, Matrix, MS Teams) zijn al
    overgestapt.

  </Accordion>

  <Accordion title="Channel runtime-shim en channel actions-helpers">
    `openclaw/plugin-sdk/channel-runtime` is een compatibiliteitsshim voor oudere
    kanaalplugins. Importeer dit niet vanuit nieuwe code; gebruik
    `openclaw/plugin-sdk/channel-runtime-context` om runtime-objecten te
    registreren.

    `channelActions*`-helpers in `openclaw/plugin-sdk/channel-actions` zijn
    deprecated naast ruwe "actions"-kanaalexports. Stel capabilities in plaats daarvan
    beschikbaar via het semantische `presentation`-oppervlak — kanaalplugins
    declareren wat ze renderen (kaarten, knoppen, keuzelijsten) in plaats van welke ruwe
    action-namen ze accepteren.

  </Accordion>

  <Accordion title="Web search provider tool()-helper → createTool() op de plugin">
    **Oud**: `tool()`-factory uit `openclaw/plugin-sdk/provider-web-search`.

    **Nieuw**: implementeer `createTool(...)` direct op de providerplugin.
    OpenClaw heeft de SDK-helper niet langer nodig om de tool-wrapper te registreren.

  </Accordion>

  <Accordion title="Plaintext channel-envelopes → BodyForAgent">
    **Oud**: `formatInboundEnvelope(...)` (en
    `ChannelMessageForAgent.channelEnvelope`) om een platte plaintext prompt-envelope
    te bouwen uit inkomende kanaalberichten.

    **Nieuw**: `BodyForAgent` plus gestructureerde user-contextblokken. Kanaalplugins
    voegen routingmetadata (thread, topic, reply-to, reactions) toe als
    getypte velden in plaats van ze in een promptstring samen te voegen. De
    `formatAgentEnvelope(...)`-helper wordt nog steeds ondersteund voor gesynthetiseerde
    assistant-facing envelopes, maar inkomende plaintext envelopes worden
    uitgefaseerd.

    Betrokken gebieden: `inbound_claim`, `message_received` en elke aangepaste
    kanaalplugin die `channelEnvelope`-tekst naverwerkte.

  </Accordion>

  <Accordion title="Provider discovery-typen → provider catalog-typen">
    Vier discovery-typealiases zijn nu dunne wrappers rond de
    catalog-era-typen:

    | Oude alias                | Nieuw type                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Plus de legacy statische `ProviderCapabilities`-container — providerplugins
    moeten expliciete providerhooks gebruiken, zoals `buildReplayPolicy`,
    `normalizeToolSchemas` en `wrapStreamFn`, in plaats van een statisch object.

  </Accordion>

  <Accordion title="Thinking policy-hooks → resolveThinkingProfile">
    **Oud** (drie afzonderlijke hooks op `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` en
    `resolveDefaultThinkingLevel(ctx)`.

    **Nieuw**: één `resolveThinkingProfile(ctx)` die een
    `ProviderThinkingProfile` retourneert met de canonieke `id`, optionele `label` en
    gerangschikte level-lijst. OpenClaw downgradet automatisch verouderde opgeslagen waarden op basis van profielrang.

    Implementeer één hook in plaats van drie. De legacy hooks blijven tijdens
    de deprecationperiode werken, maar worden niet samengesteld met het profielresultaat.

  </Accordion>

  <Accordion title="External OAuth provider-fallback → contracts.externalAuthProviders">
    **Oud**: `resolveExternalOAuthProfiles(...)` implementeren zonder
    de provider in het pluginmanifest te declareren.

    **Nieuw**: declareer `contracts.externalAuthProviders` in het pluginmanifest
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
    in het manifest. Dit consolideert setup/status-env-metadata op één
    plek en voorkomt dat de plugin-runtime moet opstarten alleen om env-var
    lookups te beantwoorden.

    `providerAuthEnvVars` blijft ondersteund via een compatibiliteitsadapter
    totdat de deprecationperiode sluit.

  </Accordion>

  <Accordion title="Memory plugin-registratie → registerMemoryCapability">
    **Oud**: drie afzonderlijke calls —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nieuw**: één call op de memory-state-API —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Dezelfde slots, één registratiecall. Additieve memory-helpers
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) worden niet beïnvloed.

  </Accordion>

  <Accordion title="Subagent session messages-typen hernoemd">
    Twee legacy typealiases worden nog steeds geëxporteerd uit `src/plugins/runtime/types.ts`:

    | Oud                           | Nieuw                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    De runtimemethode `readSession` is deprecated ten gunste van
    `getSessionMessages`. Dezelfde signature; de oude methode roept de
    nieuwe aan.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Oud**: `runtime.tasks.flow` (enkelvoud) retourneerde een live task-flow-accessor.

    **Nieuw**: `runtime.tasks.managedFlows` behoudt de beheerde TaskFlow-mutatie
    runtime voor plugins die child tasks vanuit een flow aanmaken, bijwerken, annuleren of uitvoeren. Gebruik `runtime.tasks.flows` wanneer de plugin alleen DTO-gebaseerde reads nodig heeft.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension-factories → agent tool-result middleware">
    Behandeld in "Migreren → Pi tool-result extensions migreren naar
    middleware" hierboven. Hier opgenomen voor de volledigheid: het verwijderde, Pi-only
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
Deprecations op extensieniveau (binnen gebundelde kanaal/providerplugins onder
`extensions/`) worden bijgehouden binnen hun eigen `api.ts`- en `runtime-api.ts`-
barrels. Ze beïnvloeden geen third-party plugincontracten en staan hier niet
vermeld. Als je de lokale barrel van een gebundelde plugin direct consumeert, lees dan de
deprecation-opmerkingen in die barrel voordat je upgradet.
</Note>

## Verwijderingstijdlijn

| Wanneer                | Wat er gebeurt                                                          |
| ---------------------- | ----------------------------------------------------------------------- |
| **Nu**                 | Deprecated oppervlakken geven runtimewaarschuwingen                     |
| **Volgende major release** | Deprecated oppervlakken worden verwijderd; plugins die ze nog gebruiken falen |

Alle core plugins zijn al gemigreerd. Externe plugins moeten vóór de volgende
major release migreren.

## De waarschuwingen tijdelijk onderdrukken

Stel deze omgevingsvariabelen in terwijl je aan de migratie werkt:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Dit is een tijdelijke escape hatch, geen permanente oplossing.

## Gerelateerd

- [Aan de slag](/nl/plugins/building-plugins) — bouw je eerste plugin
- [SDK-overzicht](/nl/plugins/sdk-overview) — volledige subpath-importreferentie
- [Kanaalplugins](/nl/plugins/sdk-channel-plugins) — kanaalplugins bouwen
- [Providerplugins](/nl/plugins/sdk-provider-plugins) — providerplugins bouwen
- [Plugin Internals](/nl/plugins/architecture) — diepgaande architectuuruitleg
- [Pluginmanifest](/nl/plugins/manifest) — referentie voor het manifestschema
