---
read_when:
    - Je bouwt een Plugin die before_tool_call, before_agent_reply, berichthooks of levenscyclushooks nodig heeft
    - Je moet tool-aanroepen vanuit een Plugin blokkeren, herschrijven of goedkeuring vereisen
    - Je beslist tussen interne hooks en Plugin-hooks
summary: 'Plugin-hooks: onderschep agent-, tool-, bericht-, sessie- en Gateway-levenscyclusgebeurtenissen'
title: Plugin-hooks
x-i18n:
    generated_at: "2026-06-27T17:54:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c2db0963c85d15fd391fb575f981992ffd6d77c098bd78cac08be390caea931
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin-hooks zijn in-process uitbreidingspunten voor OpenClaw-plugins. Gebruik ze
wanneer een plugin agent-runs, toolaanroepen, berichtenstroom,
sessielevenscyclus, subagent-routing, installaties of Gateway-opstart moet
inspecteren of wijzigen.

Gebruik in plaats daarvan [interne hooks](/nl/automation/hooks) wanneer je een klein,
door de operator geinstalleerd `HOOK.md`-script wilt voor opdracht- en Gateway-gebeurtenissen zoals
`/new`, `/reset`, `/stop`, `agent:bootstrap` of `gateway:startup`.

## Snelstart

Registreer getypeerde Plugin-hooks met `api.on(...)` vanuit je plugin-entry:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Hook-handlers worden sequentieel uitgevoerd in aflopende `priority`. Hooks met
dezelfde prioriteit behouden de registratievolgorde.

`api.on(name, handler, opts?)` accepteert:

- `priority` - volgorde van handlers (hoger wordt eerst uitgevoerd).
- `timeoutMs` - optioneel budget per hook. Wanneer dit is ingesteld, breekt de hook-runner die
  handler af nadat het budget is verstreken en gaat door met de volgende, in plaats van
  trage setup- of recall-werkzaamheden de geconfigureerde model-timeout van de aanroeper te laten
  verbruiken. Laat dit weg om de standaard time-out voor observatie/beslissingen te gebruiken die de
  hook-runner generiek toepast.

Operators kunnen hook-budgetten ook instellen zonder plugin-code te patchen:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "timeoutMs": 30000,
          "timeouts": {
            "before_prompt_build": 90000,
            "agent_end": 60000
          }
        }
      }
    }
  }
}
```

`hooks.timeouts.<hookName>` overschrijft `hooks.timeoutMs`, dat de door de
plugin geschreven `api.on(..., { timeoutMs })`-waarde overschrijft. Elke geconfigureerde waarde moet
een positief geheel getal zijn van niet meer dan 600000 milliseconden. Geef de voorkeur aan overrides per hook
voor bekende trage hooks, zodat een plugin niet overal een langer budget krijgt.

Elke hook ontvangt `event.context.pluginConfig`, de opgeloste configuratie voor de
plugin die die handler heeft geregistreerd. Gebruik dit voor hook-beslissingen die
huidige plugin-opties nodig hebben; OpenClaw injecteert dit per handler zonder het
gedeelde event-object dat andere plugins zien te muteren.

## Hook-catalogus

Hooks zijn gegroepeerd op het oppervlak dat ze uitbreiden. Namen in **vet** accepteren een
beslissingsresultaat (blokkeren, annuleren, overschrijven of goedkeuring vereisen); alle andere zijn
alleen voor observatie.

**Agent-turn**

- `before_model_resolve` - overschrijf provider of model voordat sessieberichten laden
- `agent_turn_prepare` - verbruik in de wachtrij geplaatste plugin-turn-injecties en voeg context voor dezelfde turn toe voor prompt-hooks
- `before_prompt_build` - voeg dynamische context of systeemprompttekst toe voor de modelaanroep
- `before_agent_start` - gecombineerde fase alleen voor compatibiliteit; geef de voorkeur aan de twee hooks hierboven
- **`before_agent_run`** - inspecteer de definitieve prompt en sessieberichten voor modelindiening en blokkeer de run optioneel
- **`before_agent_reply`** - kortsluit de model-turn met een synthetisch antwoord of stilte
- **`before_agent_finalize`** - inspecteer het natuurlijke eindantwoord en vraag nog een model-pass aan
- `agent_end` - observeer definitieve berichten, successtatus en runduur
- `heartbeat_prompt_contribution` - voeg alleen-Heartbeat-context toe voor achtergrondmonitor- en levenscyclusplugins

**Gespreksobservatie**

- `model_call_started` / `model_call_ended` - observeer opgeschoonde provider-/modelaanroepmetadata, timing, resultaat en begrensde request-id-hashes zonder prompt- of antwoordinhoud
- `llm_input` - observeer providerinvoer (systeemprompt, prompt, geschiedenis)
- `llm_output` - observeer provideruitvoer, gebruik en het opgeloste `contextTokenBudget` wanneer beschikbaar

**Tools**

- **`before_tool_call`** - herschrijf toolparameters, blokkeer uitvoering of vereis goedkeuring
- `after_tool_call` - observeer toolresultaten, fouten en duur
- `resolve_exec_env` - draag plugin-eigen omgevingsvariabelen bij aan `exec`
- **`tool_result_persist`** - herschrijf het assistant-bericht dat uit een toolresultaat is geproduceerd
- **`before_message_write`** - inspecteer of blokkeer een berichtschrijfactie die bezig is (zeldzaam)

**Berichten en bezorging**

- **`inbound_claim`** - claim een inkomend bericht voor agent-routing (synthetische antwoorden)
- `message_received` — observeer inkomende inhoud, afzender, thread en metadata
- **`message_sending`** — herschrijf uitgaande inhoud of annuleer bezorging
- **`reply_payload_sending`** — muteer of annuleer genormaliseerde antwoordpayloads voor bezorging
- `message_sent` — observeer succes of mislukking van uitgaande bezorging
- **`before_dispatch`** - inspecteer of herschrijf een uitgaande dispatch voor kanaaloverdracht
- **`reply_dispatch`** - neem deel aan de definitieve reply-dispatch-pijplijn

**Sessies en Compaction**

- `session_start` / `session_end` - volg grenzen van de sessielevenscyclus. De `reason` van het event is een van `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` of `unknown`. De waarden `shutdown` en `restart` worden geactiveerd vanuit de gateway-shutdown-finalizer wanneer het proces wordt gestopt of herstart terwijl sessies nog actief zijn, zodat downstream-plugins (zoals geheugen- of transcriptstores) ghost-rijen kunnen finaliseren die anders na herstarts in een open staat zouden blijven. De finalizer is begrensd zodat een trage plugin SIGTERM/SIGINT niet kan blokkeren.
- `before_compaction` / `after_compaction` - observeer of annoteer Compaction-cycli
- `before_reset` - observeer sessie-reset-events (`/reset`, programmatische resets)

**Subagents**

- `subagent_spawned` / `subagent_ended` - observeer het starten en voltooien van subagents.
- `subagent_delivery_target` - compatibiliteitshook voor voltooiingsbezorging wanneer geen core-sessiebinding een route kan projecteren.
- `subagent_spawning` - verouderde compatibiliteitshook. Core bereidt nu `thread: true` subagent-bindingen voor via kanaal-sessiebindingadapters voordat `subagent_spawned` wordt geactiveerd.
- `subagent_spawned` bevat `resolvedModel` en `resolvedProvider` wanneer OpenClaw het native model van de child-sessie voor het starten heeft opgelost.
- `subagent_ended` draagt `targetSessionKey` (identiteit — dit komt overeen met `subagent_spawned.childSessionKey`), `targetKind` (`"subagent"` of `"acp"`), `reason`, optioneel `outcome` (`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"` of `"deleted"`), optioneel `error`, `runId`, `endedAt`, `accountId` en `sendFarewell`. Het bevat **niet** `agentId` of `childSessionKey`; gebruik `targetSessionKey` om te correleren met het bijbehorende `subagent_spawned`-event.

**Levenscyclus**

- `gateway_start` / `gateway_stop` - start of stop plugin-eigen services met de Gateway
- `deactivate` - verouderde compatibiliteitsalias voor `gateway_stop`; gebruik `gateway_stop` in nieuwe plugins
- `cron_changed` - observeer gateway-eigen Cron-levenscycluswijzigingen (toegevoegd, bijgewerkt, verwijderd, gestart, voltooid, gepland)
- **`before_install`** - inspecteer staged skill- of plugin-installatiemateriaal vanuit een geladen
  plugin-runtime

## Runtime-hooks debuggen

Gebruik `before_model_resolve` wanneer een plugin de provider of het model
voor een agent-turn moet wisselen. Deze wordt uitgevoerd voor modelresolutie; `llm_output` wordt alleen uitgevoerd nadat
een modelpoging assistant-uitvoer produceert.

Voor bewijs van het effectieve sessiemodel inspecteer je runtime-registraties en
gebruik je daarna `openclaw sessions` of de Gateway-sessie-/statusoppervlakken. Start bij het debuggen van
providerpayloads de Gateway met `--raw-stream` en
`--raw-stream-path <path>`; die flags schrijven ruwe modelstreamevents naar een jsonl-
bestand.

## Beleid voor toolaanroepen

`before_tool_call` ontvangt:

- `event.toolName`
- `event.params`
- optioneel `event.toolKind` en `event.toolInputKind`, host-autoritatieve
  discriminators voor tools die bewust namen delen; bijvoorbeeld, buitenste
  code-mode `exec`-aanroepen gebruiken `toolKind: "code_mode_exec"` en
  bevatten `toolInputKind: "javascript" | "typescript"` wanneer de invoertaal
  bekend is
- optioneel `event.derivedPaths`, met best-effort, door de host afgeleide doelpad-
  hints voor bekende tool-envelopes zoals `apply_patch`; wanneer aanwezig,
  kunnen deze paden onvolledig zijn of kunnen ze ruimer inschatten wat de tool
  daadwerkelijk zal aanraken (bijvoorbeeld bij misvormde of gedeeltelijke invoer)
- optioneel `event.runId`
- optioneel `event.toolCallId`
- contextvelden zoals `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (ingesteld op door Cron aangedreven runs), `ctx.toolKind`,
  `ctx.toolInputKind` en diagnostische `ctx.trace`

Het kan retourneren:

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    timeoutBehavior?: "allow" | "deny";
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Hook-guardgedrag voor getypeerde levenscyclushooks:

- `block: true` is terminaal en slaat handlers met lagere prioriteit over.
- `block: false` wordt behandeld als geen beslissing.
- `params` herschrijft de toolparameters voor uitvoering.
- `requireApproval` pauzeert de agent-run en vraagt de gebruiker om goedkeuring via plugin-
  goedkeuringen. De opdracht `/approve` kan zowel exec- als plugin-goedkeuringen goedkeuren.
  In native `PreToolUse`-relays van Codex app-server report-mode wordt dit uitgesteld
  naar het overeenkomende goedkeuringsverzoek van de app-server; zie [Codex harness runtime](/nl/plugins/codex-harness-runtime#hook-boundaries).
- Een `block: true` met lagere prioriteit kan nog steeds blokkeren nadat een hook met hogere prioriteit
  goedkeuring heeft gevraagd.
- `onResolution` ontvangt de opgeloste goedkeuringsbeslissing - `allow-once`,
  `allow-always`, `deny`, `timeout` of `cancelled`.

Zie [Plugin-toestemmingsverzoeken](/nl/plugins/plugin-permission-requests) voor
goedkeuringsrouting, beslissingsgedrag en wanneer je `requireApproval` moet gebruiken in plaats
van optionele tools of exec-goedkeuringen.

Plugins die hostniveau-beleid nodig hebben, kunnen vertrouwde toolbeleidsregels registreren met
`api.registerTrustedToolPolicy(...)`. Deze worden uitgevoerd voor gewone
`before_tool_call`-hooks en voor normale hook-beslissingen. Gebundelde vertrouwde
beleidsregels worden eerst uitgevoerd; vertrouwde beleidsregels van geinstalleerde plugins worden daarna uitgevoerd in plugin-laadvolgorde;
gewone `before_tool_call`-hooks worden daarna uitgevoerd. Gebundelde plugins behouden
het bestaande trusted-policy-pad. Geinstalleerde plugins moeten expliciet zijn ingeschakeld
en elke policy-id declareren in `contracts.trustedToolPolicies`; niet-gedeclareerde ids
worden afgewezen voor registratie. Policy-ids zijn gescoped op de registrerende
plugin, dus verschillende plugins kunnen dezelfde lokale id hergebruiken. Gebruik deze laag alleen
voor host-vertrouwde poorten zoals workspace-beleid, budgethandhaving of
gereserveerde workflowveiligheid.

### Exec-omgevingshook

`resolve_exec_env` laat plugins omgevingsvariabelen bijdragen aan `exec`-
toolaanroepen nadat de basis-exec-omgeving is opgebouwd en voordat de
opdracht wordt uitgevoerd. Het ontvangt:

- `event.sessionKey`
- `event.toolName`, momenteel altijd `"exec"`
- `event.host`, een van `"gateway"`, `"sandbox"` of `"node"`
- contextvelden zoals `ctx.agentId`, `ctx.sessionKey`,
  `ctx.messageProvider` en `ctx.channelId`

Retourneer een `Record<string, string>` om samen te voegen in de exec-omgeving. Handlers
worden uitgevoerd in prioriteitsvolgorde, en latere hook-resultaten overschrijven eerdere hook-resultaten voor
dezelfde sleutel.

Hookuitvoer wordt gefilterd via het sleutelbeleid van de host-exec-omgeving voordat deze
wordt samengevoegd. Ongeldige sleutels, `PATH` en gevaarlijke host-overschrijvingssleutels zoals
`LD_*`, `DYLD_*`, `NODE_OPTIONS`, proxyvariabelen en TLS-overschrijvingsvariabelen
worden verwijderd. De gefilterde plugin-env wordt opgenomen in Gateway-goedkeurings-/auditmetadata
en doorgestuurd naar node-host-uitvoeringsaanvragen.

### Persistentie van toolresultaten

Toolresultaten kunnen gestructureerde `details` bevatten voor UI-weergave, diagnostiek,
mediaroutering of metadata die eigendom is van de Plugin. Behandel `details` als runtimemetadata,
niet als promptinhoud:

- OpenClaw verwijdert `toolResult.details` vóór provider-replay en Compaction-invoer,
  zodat metadata geen modelcontext wordt.
- Gepersisteerde sessie-items behouden alleen begrensde `details`. Te grote details worden
  vervangen door een compacte samenvatting en `persistedDetailsTruncated: true`.
- `tool_result_persist` en `before_message_write` worden uitgevoerd vóór de uiteindelijke
  persistentielimiet. Hooks moeten teruggegeven `details` nog steeds klein houden en vermijden
  promptrelevante tekst alleen in `details` te plaatsen; zet modelzichtbare tooluitvoer
  in `content`.

## Prompt- en modelhooks

Gebruik de fasespecifieke hooks voor nieuwe plugins:

- `before_model_resolve`: ontvangt alleen de huidige prompt en bijlagemetadata.
  Retourneer `providerOverride` of `modelOverride`.
- `agent_turn_prepare`: ontvangt de huidige prompt, voorbereide sessieberichten
  en eventuele precies eenmalige ingeplande invoegingen die voor deze sessie zijn verwerkt. Retourneer
  `prependContext` of `appendContext`.
- `before_prompt_build`: ontvangt de huidige prompt en sessieberichten.
  Retourneer `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` of `appendSystemContext`.
- `heartbeat_prompt_contribution`: draait alleen voor Heartbeat-beurten en retourneert
  `prependContext` of `appendContext`. Dit is bedoeld voor achtergrondmonitors
  die de huidige status moeten samenvatten zonder door de gebruiker gestarte beurten te wijzigen.

`before_agent_start` blijft bestaan voor compatibiliteit. Geef de voorkeur aan de expliciete hooks hierboven,
zodat je Plugin niet afhankelijk is van een verouderde gecombineerde fase.

`before_agent_run` draait na promptconstructie en vóór enige modelinvoer,
inclusief prompt-lokale afbeeldingslaadacties en `llm_input`-observatie. Het ontvangt
de huidige gebruikersinvoer als `prompt`, plus geladen sessiegeschiedenis in `messages`
en de actieve systeemprompt. Retourneer `{ outcome: "block", reason, message? }`
om de run te stoppen voordat het model de prompt kan lezen. `reason` is intern;
`message` is de gebruikersgerichte vervanging. De enige ondersteunde uitkomsten zijn
`pass` en `block`; niet-ondersteunde beslissingsvormen falen gesloten.

Wanneer een run wordt geblokkeerd, slaat OpenClaw alleen de vervangende tekst op in
`message.content` plus niet-gevoelige blokkeringsmetadata zoals de blokkerende plugin-id
en tijdstempel. De oorspronkelijke gebruikerstekst wordt niet bewaard in transcript of toekomstige
context. Interne blokkeringsredenen worden als gevoelig behandeld en uitgesloten van
transcript-, geschiedenis-, broadcast-, log- en diagnostiekpayloads. Observability
moet opgeschoonde velden gebruiken zoals blocker-id, uitkomst, tijdstempel of een veilige
categorie.

`before_agent_start` en `agent_end` bevatten `event.runId` wanneer OpenClaw
de actieve run kan identificeren. Dezelfde waarde is ook beschikbaar op `ctx.runId`.
Door Cron aangestuurde runs stellen ook `ctx.jobId` beschikbaar (de id van de oorspronkelijke cronjob), zodat
pluginhooks metrics, neveneffecten of status kunnen begrenzen tot een specifieke geplande
job.

Voor runs die vanuit kanalen ontstaan, identificeren `ctx.channel` en `ctx.messageProvider`
het provideroppervlak zoals `discord` of `telegram`, terwijl `ctx.channelId` de
doelidentifier van het gesprek is wanneer OpenClaw er een kan afleiden uit de sessiesleutel
of aflevermetadata.

Wanneer afzenderidentiteit beschikbaar is, bevatten agenthookcontexten ook:

- `ctx.senderId` — kanaalgebonden afzender-ID (bijv. Feishu `open_id`, Discord
  gebruikers-ID). Ingevuld wanneer de run afkomstig is van een gebruikersbericht met bekende
  afzendermetadata.
- `ctx.chatId` — transport-native gespreksidentifier (bijv. Feishu
  `chat_id`, Telegram `chat_id`). Ingevuld wanneer het oorspronkelijke kanaal
  een native gespreks-ID levert.
- `ctx.channelContext.sender.id` — dezelfde afzender-ID als `ctx.senderId`, onder een
  kanaaleigen object dat plugins kunnen uitbreiden met kanaalspecifieke velden.
- `ctx.channelContext.chat.id` — dezelfde gespreks-ID als `ctx.chatId`, onder een
  kanaaleigen object dat plugins kunnen uitbreiden met kanaalspecifieke velden.

Core definieert alleen de geneste `id`-velden. Kanaalplugins die rijkere
afzender- of chatmetadata via de inbound-helper doorgeven, kunnen
`PluginHookChannelSenderContext` of `PluginHookChannelChatContext` uitbreiden vanuit
`openclaw/plugin-sdk/channel-inbound`:

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

Kanaalplugins geven die velden door via de inbound SDK-helper:

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

Deze velden zijn optioneel en ontbreken voor door het systeem gestarte runs (Heartbeat,
Cron, exec-event).

`ctx.senderExternalId` blijft bestaan als verouderd broncompatibiliteitsveld voor
oudere plugins. Core vult dit niet in; nieuwe kanaalspecifieke afzenderidentiteiten
moeten onder `ctx.channelContext.sender` leven via module-uitbreiding.

`agent_end` is een observatiehook. Gateway- en persistente harnesspaden voeren deze
fire-and-forget uit na de beurt, terwijl kortlevende one-shot CLI-paden wachten op de
hook-promise vóór procesopschoning, zodat vertrouwde plugins terminalobservability
kunnen flushen of status kunnen vastleggen. De hookrunner past een timeout van 30 seconden toe, zodat een
vastgelopen Plugin of embedding-endpoint de hook-promise niet voor altijd pending kan laten.
Een timeout wordt gelogd en OpenClaw gaat door; dit annuleert geen
netwerkwerk dat eigendom is van de Plugin, tenzij de Plugin ook een eigen abortsignaal gebruikt.

Gebruik `model_call_started` en `model_call_ended` voor provider-call-telemetrie
die geen ruwe prompts, geschiedenis, antwoorden, headers, request bodies
of provider request IDs mag ontvangen. Deze hooks bevatten stabiele metadata zoals
`runId`, `callId`, `provider`, `model`, optioneel `api`/`transport`, terminale
`durationMs`/`outcome`, en `upstreamRequestIdHash` wanneer OpenClaw een
begrensde hash van de provider request-id kan afleiden. Wanneer de runtime context-window-
metadata heeft opgelost, bevatten het hookevent en de context ook `contextTokenBudget`, het
effectieve tokenbudget na model-/config-/agentlimieten, plus
`contextWindowSource` en `contextWindowReferenceTokens` wanneer een lagere limiet is
toegepast.

`before_agent_finalize` draait alleen wanneer een harness op het punt staat een natuurlijk
eindantwoord van de assistent te accepteren. Het is niet het `/stop`-annuleringspad en draait niet
wanneer de gebruiker een beurt afbreekt. Retourneer `{ action: "revise", reason }` om
de harness om nog één modelpassage vóór finalisatie te vragen, `{ action:
"finalize", reason? }` om finalisatie af te dwingen, of laat een resultaat weg om door te gaan.
Native Codex-`Stop`-hooks worden naar deze hook doorgegeven als OpenClaw-
`before_agent_finalize`-beslissingen.

Wanneer `action: "revise"` wordt geretourneerd, kunnen plugins `retry`-metadata opnemen om
de extra modelpassage begrensd en replay-veilig te maken:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` wordt toegevoegd aan de revisiereden die naar de harness wordt gestuurd.
`idempotencyKey` laat de host retries tellen voor hetzelfde Plugin-verzoek over
equivalente finalisatiebeslissingen heen, en `maxAttempts` begrenst hoeveel extra passages de
host toestaat voordat wordt doorgegaan met het natuurlijke eindantwoord.

Niet-gebundelde plugins die ruwe gesprekshooks nodig hebben (`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end` of `before_agent_run`) moeten instellen:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

Promptmuterende hooks en duurzame invoegingen voor de volgende beurt kunnen per Plugin
worden uitgeschakeld met `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Sessie-extensies en invoegingen voor de volgende beurt

Workflowplugins kunnen kleine JSON-compatibele sessiestatus persisteren met
`api.registerSessionExtension(...)` en deze bijwerken via de Gateway-
`sessions.pluginPatch`-methode. Sessierijen projecteren geregistreerde extensiestatus
via `pluginExtensions`, zodat Control UI en andere clients plugin-eigen status kunnen renderen
zonder plugin-internals te leren kennen.

Gebruik `api.enqueueNextTurnInjection(...)` wanneer een Plugin duurzame context nodig heeft die
de volgende modelbeurt precies één keer moet bereiken. OpenClaw verwerkt ingeplande invoegingen vóór
prompthooks, verwijdert verlopen invoegingen en dedupliceert per Plugin op `idempotencyKey`.
Dit is de juiste overgang voor hervatte goedkeuringen, beleidssamenvattingen,
delta's van achtergrondmonitors en opdrachtvoortzettingen die zichtbaar moeten zijn voor
het model in de volgende beurt, maar geen permanente systeemprompttekst mogen worden.

Opschoonsemantiek maakt deel uit van het contract. Opschoning van sessie-extensies en
callbacks voor runtimelevenscyclusopschoning ontvangen `reset`, `delete`, `disable` of
`restart`. De host verwijdert de persistente sessie-extensiestatus van de eigenaar-Plugin
en pending invoegingen voor de volgende beurt voor reset/delete/disable; restart behoudt
duurzame sessiestatus terwijl opschooncallbacks plugins schedulerjobs,
runcontext en andere out-of-band resources voor de oude runtimegeneratie laten vrijgeven.

## Berichthooks

Gebruik berichthooks voor routering en afleverbeleid op kanaalniveau:

- `message_received`: observeer inbound content, afzender, `threadId`, `messageId`,
  `senderId`, optionele run-/sessiecorrelatie en metadata.
- `message_sending`: herschrijf `content` of retourneer `{ cancel: true }`.
- `reply_payload_sending`: herschrijf genormaliseerde `ReplyPayload`-objecten (inclusief
  `presentation`, `delivery`, mediarefs en tekst) of retourneer `{ cancel: true }`.
- `message_sent`: observeer uiteindelijke successen of fouten.

Voor audio-only TTS-antwoorden kan `content` het verborgen gesproken transcript bevatten,
zelfs wanneer de kanaalpayload geen zichtbare tekst/bijschrift heeft. Het herschrijven van die
`content` werkt alleen het hookzichtbare transcript bij; het wordt niet gerenderd als een
mediabijschrift.

`reply_payload_sending`-events kunnen `usageState` bevatten, een best-effort live
model-/gebruik-/contextsnapshot per beurt. Duurzame aflevering, herstelde replay en
antwoorden zonder exacte runcorrelatie laten dit weg.

Berichthookcontexten stellen stabiele correlatievelden beschikbaar wanneer beschikbaar:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` en `ctx.callDepth`. Inbound-
en `before_dispatch`-contexten stellen ook antwoordmetadata beschikbaar wanneer het kanaal
zichtbaarheidsgefilterde geciteerde berichtgegevens heeft: `replyToId`, `replyToIdFull`,
`replyToBody`, `replyToSender` en `replyToIsQuote`. Geef de voorkeur aan deze first-class
velden voordat je legacy metadata leest.

Geef de voorkeur aan getypeerde `threadId`- en `replyToId`-velden voordat je kanaalspecifieke
metadata gebruikt.

Beslisregels:

- `message_sending` met `cancel: true` is terminaal.
- `message_sending` met `cancel: false` wordt behandeld als geen beslissing.
- Herschreven `content` gaat door naar hooks met lagere prioriteit, tenzij een latere hook
  levering annuleert.
- `reply_payload_sending` wordt uitgevoerd na payloadnormalisatie en vóór kanaallevering,
  inclusief antwoorden die terug naar het oorspronkelijke kanaal worden gerouteerd. Handlers
  worden sequentieel uitgevoerd en elke handler ziet de nieuwste payload die door
  handlers met hogere prioriteit is geproduceerd.
- `reply_payload_sending`-payloads stellen geen runtime-vertrouwensmarkeringen bloot, zoals
  `trustedLocalMedia`; plugins kunnen de payloadvorm bewerken, maar kunnen geen vertrouwen voor lokale
  media verlenen.
- `message_sending` kan `cancelReason` en begrensde `metadata` retourneren met een
  annulering. Nieuwe API's voor de berichtlevenscyclus stellen dit bloot als een onderdrukte leveringsuitkomst
  met reden `cancelled_by_message_sending_hook`; legacy directe
  levering blijft voor compatibiliteit een lege resultaatarray retourneren.
- `message_sent` is alleen voor observatie. Handlerfouten worden gelogd en wijzigen het
  leveringsresultaat niet.

## Installatiehooks

Gebruik `security.installPolicy` voor door de operator beheerde toestaan/blokkeren-beslissingen. Dat
beleid wordt uitgevoerd vanuit de OpenClaw-configuratie, dekt CLI-installatie- en updatepaden en faalt
gesloten wanneer het is ingeschakeld maar niet beschikbaar is.

`before_install` is een lifecycle-hook van de pluginruntime. Deze wordt uitgevoerd na
`security.installPolicy`, alleen in het OpenClaw-proces waarin pluginhooks al zijn
geladen, zoals Gateway-ondersteunde installatiestromen. Deze is nuttig voor
door plugins beheerde observaties, waarschuwingen en compatibiliteitscontroles, maar is niet de
primaire beveiligingsgrens voor ondernemingen of hosts voor installaties. Het veld `builtinScan`
blijft voor compatibiliteit in de eventpayload aanwezig, maar OpenClaw voert geen
ingebouwde installatietijdblokkering van gevaarlijke code meer uit, dus het is een leeg `ok`-
resultaat. Retourneer extra bevindingen of `{ block: true, blockReason }` om de
installatie in dat proces te stoppen.

`block: true` is terminaal. `block: false` wordt behandeld als geen beslissing.
Handlerfouten blokkeren de installatie fail-closed.

## Gateway-levenscyclus

Gebruik `gateway_start` voor pluginservices die Gateway-beheerde status nodig hebben. De
context stelt `ctx.config`, `ctx.workspaceDir` en `ctx.getCron?.()` bloot voor
croninspectie en updates. Gebruik `gateway_stop` om langlopende
resources op te ruimen.

Vertrouw niet op de interne `gateway:startup`-hook voor door plugins beheerde runtime-
services.

`cron_changed` wordt geactiveerd voor Gateway-beheerde Cron-lifecycle-events met een getypte
eventpayload die de redenen `added`, `updated`, `removed`, `started`, `finished`
en `scheduled` omvat. Het event draagt een `PluginHookGatewayCronJob`-
snapshot (inclusief `state.nextRunAtMs`, `state.lastRunStatus` en
`state.lastError` wanneer aanwezig) plus een `PluginHookGatewayCronDeliveryStatus`
van `not-requested` | `delivered` | `not-delivered` | `unknown`. Verwijderde
events dragen nog steeds de snapshot van de verwijderde taak, zodat externe planners
status kunnen reconciliëren. Gebruik `ctx.getCron?.()` en `ctx.config` uit de runtime-
context bij het synchroniseren van externe wake-planners, en houd OpenClaw als de
bron van waarheid voor due-controles en uitvoering.

## Aankomende deprecaties

Enkele hook-aangrenzende oppervlakken zijn deprecated maar worden nog steeds ondersteund. Migreer
vóór de volgende major release:

- **Plaintext channel envelopes** in handlers voor `inbound_claim` en `message_received`.
  Lees `BodyForAgent` en de gestructureerde gebruikerscontextblokken
  in plaats van platte enveloptekst te parsen. Zie
  [Plaintext channel envelopes → BodyForAgent](/nl/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** blijft bestaan voor compatibiliteit. Nieuwe plugins moeten
  `before_model_resolve` en `before_prompt_build` gebruiken in plaats van de gecombineerde
  fase.
- **`subagent_spawning`** blijft bestaan voor compatibiliteit met oudere plugins, maar
  nieuwe plugins mogen hieruit geen threadroutering retourneren. Core bereidt
  `thread: true`-subagentbindingen voor via adapters voor kanaalsessiebinding
  voordat `subagent_spawned` wordt geactiveerd.
- **`deactivate`** blijft als deprecated compatibiliteitsalias voor opschoning bestaan tot
  na 2026-08-16. Nieuwe plugins moeten `gateway_stop` gebruiken.
- **`onResolution` in `before_tool_call`** gebruikt nu de getypte
  `PluginApprovalResolution`-union (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) in plaats van een vrije `string`.

Voor de volledige lijst - registratie van geheugencapaciteit, provider-denkprofiel,
externe auth-providers, provider discovery-typen, taakruntime-accessors en de
naamswijziging `command-auth` → `command-status` - zie
[Plugin SDK-migratie → Actieve deprecaties](/nl/plugins/sdk-migration#active-deprecations).

## Gerelateerd

- [Plugin SDK-migratie](/nl/plugins/sdk-migration) - actieve deprecaties en verwijderingstijdlijn
- [Plugins bouwen](/nl/plugins/building-plugins)
- [Plugin SDK-overzicht](/nl/plugins/sdk-overview)
- [Plugin-entrypoints](/nl/plugins/sdk-entrypoints)
- [Interne hooks](/nl/automation/hooks)
- [Interne pluginarchitectuur](/nl/plugins/architecture-internals)
