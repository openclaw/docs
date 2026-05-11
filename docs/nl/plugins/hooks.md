---
read_when:
    - Je bouwt een Plugin die before_tool_call, before_agent_reply, berichthooks of levenscyclushooks nodig heeft
    - Je moet toolaanroepen vanuit een Plugin blokkeren, herschrijven of goedkeuring vereisen
    - Je kiest tussen interne hooks en Plugin-hooks
summary: 'Plugin-hooks: onderschep levenscyclusgebeurtenissen van agenten, hulpmiddelen, berichten, sessies en de Gateway'
title: Plugin-hooks
x-i18n:
    generated_at: "2026-05-11T20:40:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: b363b8ed7452f0d8bdb267d3eaa38f579d6d7cfb7ace2085ac35baf9b253b575
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin-hooks zijn in-process uitbreidingspunten voor OpenClaw-plugins. Gebruik ze
wanneer een Plugin agent-runs, toolaanroepen, berichtstromen,
sessielevenscyclus, subagent-routering, installaties of Gateway-opstart moet inspecteren of wijzigen.

Gebruik in plaats daarvan [interne hooks](/nl/automation/hooks) wanneer je een klein
door de operator geïnstalleerd `HOOK.md`-script wilt voor opdracht- en Gateway-gebeurtenissen zoals
`/new`, `/reset`, `/stop`, `agent:bootstrap` of `gateway:startup`.

## Snel starten

Registreer getypeerde Plugin-hooks met `api.on(...)` vanuit je Plugin-entry:

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
- `timeoutMs` - optioneel budget per hook. Indien ingesteld, breekt de hook-runner die
  handler af nadat het budget is verstreken en gaat door met de volgende, in plaats van
  traag setup- of ophaalwerk de door de aanroeper geconfigureerde model-time-out te laten
  verbruiken. Laat dit weg om de standaardobservatie-/beslissingstime-out te gebruiken die de
  hook-runner generiek toepast.

Operators kunnen ook hook-budgetten instellen zonder Plugin-code te patchen:

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

`hooks.timeouts.<hookName>` overschrijft `hooks.timeoutMs`, dat de
door de Plugin-auteur ingestelde waarde `api.on(..., { timeoutMs })` overschrijft. Elke geconfigureerde waarde moet
een positief geheel getal zijn van maximaal 600000 milliseconden. Geef de voorkeur aan overschrijvingen per hook
voor bekende trage hooks, zodat één Plugin niet overal een langer budget krijgt.

Elke hook ontvangt `event.context.pluginConfig`, de opgeloste configuratie voor de
Plugin die die handler heeft geregistreerd. Gebruik dit voor hook-beslissingen die
huidige Plugin-opties nodig hebben; OpenClaw injecteert dit per handler zonder het
gedeelde gebeurtenisobject te muteren dat andere plugins zien.

## Hookcatalogus

Hooks zijn gegroepeerd op het oppervlak dat ze uitbreiden. Namen in **vet** accepteren een
beslissingsresultaat (blokkeren, annuleren, overschrijven of goedkeuring vereisen); alle andere zijn
alleen voor observatie.

**Agent-turn**

- `before_model_resolve` - overschrijf provider of model voordat sessieberichten laden
- `agent_turn_prepare` - verwerk in de wachtrij geplaatste Plugin-turn-injecties en voeg context voor dezelfde turn toe vóór prompt-hooks
- `before_prompt_build` - voeg dynamische context of systeem-prompttekst toe vóór de modelaanroep
- `before_agent_start` - gecombineerde fase alleen voor compatibiliteit; geef de voorkeur aan de twee hooks hierboven
- **`before_agent_run`** - inspecteer de definitieve prompt en sessieberichten vóór modelindiening en blokkeer de run optioneel
- **`before_agent_reply`** - kortsluit de model-turn met een synthetisch antwoord of stilte
- **`before_agent_finalize`** - inspecteer het natuurlijke definitieve antwoord en vraag nog één modelpass aan
- `agent_end` - observeer definitieve berichten, successtatus en run-duur
- `heartbeat_prompt_contribution` - voeg alleen-Heartbeat-context toe voor achtergrondmonitor- en lifecycle-plugins

**Gespreksobservatie**

- `model_call_started` / `model_call_ended` - observeer opgeschoonde provider-/modelaanroepmetadata, timing, resultaat en begrensde request-id-hashes zonder prompt- of response-inhoud
- `llm_input` - observeer providerinvoer (systeemprompt, prompt, geschiedenis)
- `llm_output` - observeer provideruitvoer

**Tools**

- **`before_tool_call`** - herschrijf toolparameters, blokkeer uitvoering of vereis goedkeuring
- `after_tool_call` - observeer toolresultaten, fouten en duur
- **`tool_result_persist`** - herschrijf het assistant-bericht dat uit een toolresultaat wordt geproduceerd
- **`before_message_write`** - inspecteer of blokkeer een lopende berichtschrijfactie (zeldzaam)

**Berichten en bezorging**

- **`inbound_claim`** - claim een inkomend bericht vóór agent-routering (synthetische antwoorden)
- `message_received` - observeer inkomende inhoud, afzender, thread en metadata
- **`message_sending`** - herschrijf uitgaande inhoud of annuleer bezorging
- `message_sent` - observeer succesvolle of mislukte uitgaande bezorging
- **`before_dispatch`** - inspecteer of herschrijf een uitgaande dispatch vóór overdracht aan het kanaal
- **`reply_dispatch`** - neem deel aan de definitieve reply-dispatch-pijplijn

**Sessies en Compaction**

- `session_start` / `session_end` - volg grenzen van de sessielevenscyclus. De `reason` van de gebeurtenis is een van `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` of `unknown`. De waarden `shutdown` en `restart` worden geactiveerd vanuit de gateway-shutdown-finalizer wanneer het proces wordt gestopt of opnieuw gestart terwijl sessies nog actief zijn, zodat downstream-plugins (zoals geheugen- of transcriptopslag) ghost-rijen kunnen afronden die anders in een open toestand zouden blijven over herstarts heen. De finalizer is begrensd, zodat een trage Plugin SIGTERM/SIGINT niet kan blokkeren.
- `before_compaction` / `after_compaction` - observeer of annoteer Compaction-cycli
- `before_reset` - observeer sessie-resetgebeurtenissen (`/reset`, programmatische resets)

**Subagents**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - coördineer subagent-routering en bezorging bij voltooiing

**Levenscyclus**

- `gateway_start` / `gateway_stop` - start of stop services die eigendom zijn van de Plugin met de Gateway
- `cron_changed` - observeer door de gateway beheerde cron-levenscycluswijzigingen (toegevoegd, bijgewerkt, verwijderd, gestart, voltooid, gepland)
- **`before_install`** - inspecteer Skills- of Plugin-installatiescans en blokkeer optioneel

## Beleid voor toolaanroepen

`before_tool_call` ontvangt:

- `event.toolName`
- `event.params`
- optioneel `event.derivedPaths`, met best-effort host-afgeleide doelpad-
  hints voor bekende tool-enveloppen zoals `apply_patch`; indien aanwezig
  kunnen deze paden onvolledig zijn of kunnen ze overschatten wat de tool
  daadwerkelijk zal raken (bijvoorbeeld bij misvormde of gedeeltelijke invoer)
- optioneel `event.runId`
- optioneel `event.toolCallId`
- contextvelden zoals `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (ingesteld bij cron-gestuurde runs) en diagnostische `ctx.trace`

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
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Regels:

- `block: true` is terminaal en slaat handlers met lagere prioriteit over.
- `block: false` wordt behandeld als geen beslissing.
- `params` herschrijft de toolparameters voor uitvoering.
- `requireApproval` pauzeert de agent-run en vraagt de gebruiker via Plugin-
  goedkeuringen. De opdracht `/approve` kan zowel exec- als Plugin-goedkeuringen goedkeuren.
- Een `block: true` met lagere prioriteit kan nog steeds blokkeren nadat een hook met hogere prioriteit
  goedkeuring heeft gevraagd.
- `onResolution` ontvangt de opgeloste goedkeuringsbeslissing - `allow-once`,
  `allow-always`, `deny`, `timeout` of `cancelled`.

Gebundelde plugins die hostniveau-beleid nodig hebben, kunnen vertrouwde toolbeleidsregels
registreren met `api.registerTrustedToolPolicy(...)`. Deze worden uitgevoerd vóór gewone
`before_tool_call`-hooks en vóór beslissingen van externe plugins. Gebruik ze alleen
voor door de host vertrouwde poorten zoals workspacebeleid, budgethandhaving of
gereserveerde workflowveiligheid. Externe plugins moeten normale `before_tool_call`-
hooks gebruiken.

### Persistentie van toolresultaten

Toolresultaten kunnen gestructureerde `details` bevatten voor UI-rendering, diagnostiek,
mediaroutering of metadata die eigendom is van de Plugin. Behandel `details` als runtime-metadata,
niet als promptinhoud:

- OpenClaw verwijdert `toolResult.details` vóór provider-replay en Compaction-
  invoer, zodat metadata geen modelcontext wordt.
- Gepersisteerde sessie-items behouden alleen begrensde `details`. Te grote details worden
  vervangen door een compacte samenvatting en `persistedDetailsTruncated: true`.
- `tool_result_persist` en `before_message_write` worden uitgevoerd vóór de definitieve
  persistentielimiet. Hooks moeten geretourneerde `details` nog steeds klein houden en vermijden
  prompt-relevante tekst alleen in `details` te plaatsen; zet voor het model zichtbare tooluitvoer
  in `content`.

## Prompt- en model-hooks

Gebruik de fasespecifieke hooks voor nieuwe plugins:

- `before_model_resolve`: ontvangt alleen de huidige prompt en bijlage-
  metadata. Retourneer `providerOverride` of `modelOverride`.
- `agent_turn_prepare`: ontvangt de huidige prompt, voorbereide sessieberichten,
  en alle exact-eenmalige injecties uit de wachtrij die voor deze sessie zijn leeggemaakt. Retourneer
  `prependContext` of `appendContext`.
- `before_prompt_build`: ontvangt de huidige prompt en sessieberichten.
  Retourneer `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` of `appendSystemContext`.
- `heartbeat_prompt_contribution`: wordt alleen uitgevoerd voor Heartbeat-turns en retourneert
  `prependContext` of `appendContext`. Het is bedoeld voor achtergrondmonitors
  die de huidige status moeten samenvatten zonder door de gebruiker geïnitieerde turns te wijzigen.

`before_agent_start` blijft beschikbaar voor compatibiliteit. Geef de voorkeur aan de expliciete hooks hierboven,
zodat je Plugin niet afhankelijk is van een verouderde gecombineerde fase.

`before_agent_run` wordt uitgevoerd na promptconstructie en vóór elke modelinvoer,
inclusief prompt-lokale afbeeldingslading en `llm_input`-observatie. Het ontvangt
de huidige gebruikersinvoer als `prompt`, plus geladen sessiegeschiedenis in `messages`
en de actieve systeemprompt. Retourneer `{ outcome: "block", reason, message? }`
om de run te stoppen voordat het model de prompt kan lezen. `reason` is intern;
`message` is de gebruikersgerichte vervanging. De enige ondersteunde resultaten zijn
`pass` en `block`; niet-ondersteunde beslissingsvormen falen gesloten.

Wanneer een run wordt geblokkeerd, slaat OpenClaw alleen de vervangende tekst op in
`message.content` plus niet-gevoelige blokkeringsmetadata zoals de blokkerende Plugin-
id en tijdstempel. De oorspronkelijke gebruikerstekst wordt niet behouden in transcript of toekomstige
context. Interne blokkeringsredenen worden als gevoelig behandeld en uitgesloten van
transcript-, geschiedenis-, broadcast-, log- en diagnostische payloads. Observability
moet opgeschoonde velden gebruiken zoals blocker-id, resultaat, tijdstempel of een veilige
categorie.

`before_agent_start` en `agent_end` bevatten `event.runId` wanneer OpenClaw
de actieve run kan identificeren. Dezelfde waarde is ook beschikbaar op `ctx.runId`.
Cron-gestuurde runs stellen ook `ctx.jobId` beschikbaar (de id van de oorspronkelijke Cron-taak), zodat
Plugin-hooks metrics, bijwerkingen of status kunnen beperken tot een specifieke geplande
taak.

Voor runs die uit kanalen afkomstig zijn, is `ctx.messageProvider` het provideroppervlak zoals
`discord` of `telegram`, terwijl `ctx.channelId` de conversation-target-
identifier is wanneer OpenClaw er een kan afleiden uit de sessiesleutel of bezorgings-
metadata.

`agent_end` is een observatie-hook en wordt fire-and-forget uitgevoerd na de turn. De
hook-runner past een time-out van 30 seconden toe, zodat een vastgelopen Plugin of embedding-
endpoint de hook-promise niet voor altijd pending kan laten. Een time-out wordt gelogd en
OpenClaw gaat door; dit annuleert netwerkwerk dat eigendom is van de Plugin niet, tenzij de
Plugin ook zijn eigen abortsignal gebruikt.

Gebruik `model_call_started` en `model_call_ended` voor provider-aanroeptelemetrie
die geen ruwe prompts, geschiedenis, antwoorden, headers, request
bodies of provider-request-ID's mag ontvangen. Deze hooks bevatten stabiele metadata zoals
`runId`, `callId`, `provider`, `model`, optioneel `api`/`transport`, terminale
`durationMs`/`outcome`, en `upstreamRequestIdHash` wanneer OpenClaw een
begrensde hash van een provider-request-ID kan afleiden.

`before_agent_finalize` draait alleen wanneer een harness op het punt staat een natuurlijk
definitief assistentantwoord te accepteren. Het is niet het `/stop`-annuleringspad en draait niet
wanneer de gebruiker een beurt afbreekt. Retourneer `{ action: "revise", reason }` om
de harness om nog een modelpassage te vragen vóór afronding, `{ action:
"finalize", reason? }` om afronding af te dwingen, of laat een resultaat weg om door te gaan.
Codex-native `Stop`-hooks worden naar deze hook doorgestuurd als OpenClaw-
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

`instruction` wordt toegevoegd aan de revisiereden die naar de harness wordt verzonden.
Met `idempotencyKey` kan de host retries tellen voor hetzelfde pluginverzoek over
equivalente afrondingsbeslissingen heen, en `maxAttempts` begrenst hoeveel extra passages de
host toestaat voordat wordt doorgegaan met het natuurlijke definitieve antwoord.

Niet-gebundelde plugins die ruwe gesprekshooks nodig hebben (`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end`, of `before_agent_run`) moeten dit instellen:

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

Prompt-mutating hooks en duurzame injecties voor de volgende beurt kunnen per plugin worden uitgeschakeld
met `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Sessie-extensies en injecties voor de volgende beurt

Workflowplugins kunnen kleine JSON-compatibele sessiestatus bewaren met
`api.registerSessionExtension(...)` en die bijwerken via de Gateway-
`sessions.pluginPatch`-methode. Sessierijen projecteren geregistreerde extensiestatus
via `pluginExtensions`, zodat Control UI en andere clients
plugin-eigen status kunnen renderen zonder plugin-internals te leren kennen.

Gebruik `api.enqueueNextTurnInjection(...)` wanneer een plugin duurzame context nodig heeft die
exact één keer de volgende modelbeurt moet bereiken. OpenClaw verwerkt wachtrij-injecties vóór
prompt-hooks, laat verlopen injecties vallen en dedupliceert per plugin op `idempotencyKey`.
Dit is de juiste koppeling voor hervattingen na goedkeuring, beleidssamenvattingen,
delta's van achtergrondmonitors en commandovoortzettingen die zichtbaar moeten zijn voor
het model in de volgende beurt, maar geen permanente systeem-prompttekst mogen worden.

Opschoonsemantiek maakt deel uit van het contract. Opschooncallbacks voor sessie-extensies en
runtime-levenscyclus ontvangen `reset`, `delete`, `disable` of
`restart`. De host verwijdert de persistente sessie-extensiestatus van de eigenaar-plugin
en openstaande injecties voor de volgende beurt bij reset/delete/disable; restart behoudt
duurzame sessiestatus terwijl opschooncallbacks plugins scheduler-
taken, run-context en andere out-of-band resources voor de oude runtime-
generatie laten vrijgeven.

## Berichthooks

Gebruik berichthooks voor routering op kanaalniveau en afleveringsbeleid:

- `message_received`: observeer binnenkomende content, afzender, `threadId`, `messageId`,
  `senderId`, optionele run-/sessiecorrelatie en metadata.
- `message_sending`: herschrijf `content` of retourneer `{ cancel: true }`.
- `message_sent`: observeer definitief succes of definitieve mislukking.

Voor audio-only TTS-antwoorden kan `content` het verborgen gesproken transcript bevatten,
ook wanneer de kanaalpayload geen zichtbare tekst/bijschrift heeft. Het herschrijven van die
`content` werkt alleen het voor de hook zichtbare transcript bij; het wordt niet weergegeven als
mediabijschrift.

Berichthookcontexten stellen stabiele correlatievelden beschikbaar wanneer beschikbaar:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` en `ctx.callDepth`. Geef
de voorkeur aan deze first-class velden voordat je legacy-metadata leest.

Geef de voorkeur aan getypeerde `threadId`- en `replyToId`-velden voordat je kanaalspecifieke
metadata gebruikt.

Beslissingsregels:

- `message_sending` met `cancel: true` is terminal.
- `message_sending` met `cancel: false` wordt behandeld als geen beslissing.
- Herschreven `content` gaat door naar hooks met lagere prioriteit tenzij een latere hook
  aflevering annuleert.
- `message_sending` kan `cancelReason` en begrensde `metadata` retourneren met een
  annulering. Nieuwe API's voor de berichtlevenscyclus stellen dit beschikbaar als een onderdrukte afleveringsuitkomst
  met reden `cancelled_by_message_sending_hook`; legacy directe
  aflevering blijft voor compatibiliteit een lege resultaatarray retourneren.
- `message_sent` is alleen voor observatie. Handlerfouten worden gelogd en wijzigen het
  afleveringsresultaat niet.

## Installatiehooks

`before_install` draait na de ingebouwde scan voor installaties van skills en plugins.
Retourneer extra bevindingen of `{ block: true, blockReason }` om de
installatie te stoppen.

`block: true` is terminal. `block: false` wordt behandeld als geen beslissing.

## Gateway-levenscyclus

Gebruik `gateway_start` voor pluginservices die Gateway-eigen status nodig hebben. De
context stelt `ctx.config`, `ctx.workspaceDir` en `ctx.getCron?.()` beschikbaar voor
cron-inspectie en updates. Gebruik `gateway_stop` om langlopende
resources op te schonen.

Vertrouw niet op de interne `gateway:startup`-hook voor plugin-eigen runtime-
services.

`cron_changed` wordt geactiveerd voor gateway-eigen cron-levenscyclusevents met een getypeerde
eventpayload die de redenen `added`, `updated`, `removed`, `started`, `finished`
en `scheduled` dekt. Het event bevat een `PluginHookGatewayCronJob`-
snapshot (inclusief `state.nextRunAtMs`, `state.lastRunStatus` en
`state.lastError` wanneer aanwezig) plus een `PluginHookGatewayCronDeliveryStatus`
van `not-requested` | `delivered` | `not-delivered` | `unknown`. Verwijderde
events bevatten nog steeds de snapshot van de verwijderde job, zodat externe schedulers
status kunnen reconciliëren. Gebruik `ctx.getCron?.()` en `ctx.config` uit de runtime-
context bij het synchroniseren van externe wake-schedulers, en houd OpenClaw als de
bron van waarheid voor due-controles en uitvoering.

## Aankomende deprecations

Een paar hook-aangrenzende oppervlakken zijn verouderd maar worden nog ondersteund. Migreer
vóór de volgende major release:

- **Platte-tekst kanaalenveloppen** in `inbound_claim`- en `message_received`-
  handlers. Lees `BodyForAgent` en de gestructureerde user-contextblokken
  in plaats van vlakke enveloptekst te parsen. Zie
  [Platte-tekst kanaalenveloppen → BodyForAgent](/nl/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** blijft voor compatibiliteit. Nieuwe plugins moeten
  `before_model_resolve` en `before_prompt_build` gebruiken in plaats van de gecombineerde
  fase.
- **`onResolution` in `before_tool_call`** gebruikt nu de getypeerde
  `PluginApprovalResolution`-union (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) in plaats van een vrije `string`.

Voor de volledige lijst - registratie van geheugencapabilities, provider-thinking-
profiel, externe auth-providers, provider-discoverytypen, task-runtime-
accessors en de hernoeming `command-auth` → `command-status` - zie
[Plugin SDK-migratie → Actieve deprecations](/nl/plugins/sdk-migration#active-deprecations).

## Gerelateerd

- [Plugin SDK-migratie](/nl/plugins/sdk-migration) - actieve deprecations en verwijderingstijdlijn
- [Plugins bouwen](/nl/plugins/building-plugins)
- [Plugin SDK-overzicht](/nl/plugins/sdk-overview)
- [Plugin-entrypoints](/nl/plugins/sdk-entrypoints)
- [Interne hooks](/nl/automation/hooks)
- [Plugin-architectuurinternals](/nl/plugins/architecture-internals)
