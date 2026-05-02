---
read_when:
    - Je bouwt een Plugin die before_tool_call, before_agent_reply, berichthooks of levenscyclushooks nodig heeft
    - Je moet toolaanroepen van een Plugin blokkeren, herschrijven of goedkeuring ervoor vereisen
    - Je kiest tussen interne hooks en Plugin-hooks
summary: 'Plugin-hooks: onderschep levenscyclusgebeurtenissen van agents, hulpmiddelen, berichten, sessies en de Gateway'
title: Plugin-hooks
x-i18n:
    generated_at: "2026-05-02T11:22:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4efb07c6211debb5a7915d63678b1695946a91600c54d31faa0edf7025fbabf0
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin-hooks zijn in-process uitbreidingspunten voor OpenClaw-plugins. Gebruik ze
wanneer een plugin agent-runs, toolaanroepen, berichtenstroom,
sessielevenscyclus, subagent-routering, installaties of het opstarten van de Gateway
moet inspecteren of wijzigen.

Gebruik in plaats daarvan [interne hooks](/nl/automation/hooks) wanneer je een klein
door de operator geïnstalleerd `HOOK.md`-script wilt voor opdracht- en Gateway-events zoals
`/new`, `/reset`, `/stop`, `agent:bootstrap` of `gateway:startup`.

## Snel aan de slag

Registreer getypeerde Plugin-hooks met `api.on(...)` vanuit de entry van je plugin:

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

- `priority` — volgorde van handlers (hogere waarde wordt eerst uitgevoerd).
- `timeoutMs` — optioneel budget per hook. Wanneer dit is ingesteld, breekt de hook-runner die
  handler af nadat het budget is verstreken en gaat verder met de volgende, in plaats van
  trage setup- of recall-werkzaamheden de geconfigureerde modeltimeout van de aanroeper te laten
  verbruiken. Laat dit weg om de standaard time-out voor observatie/beslissing te gebruiken die de
  hook-runner generiek toepast.

Elke hook ontvangt `event.context.pluginConfig`, de opgeloste configuratie voor de
plugin die die handler heeft geregistreerd. Gebruik dit voor hook-beslissingen die
actuele pluginopties nodig hebben; OpenClaw injecteert dit per handler zonder het
gedeelde event-object te muteren dat andere plugins zien.

## Hook-catalogus

Hooks zijn gegroepeerd op het oppervlak dat ze uitbreiden. Namen in **vet** accepteren een
beslissingsresultaat (blokkeren, annuleren, overschrijven of goedkeuring vereisen); alle andere zijn
alleen voor observatie.

**Agent-turn**

- `before_model_resolve` — overschrijf provider of model voordat sessieberichten worden geladen
- `agent_turn_prepare` — verwerk wachtrij-injecties van plugin-turns en voeg context voor dezelfde turn toe vóór prompt-hooks
- `before_prompt_build` — voeg dynamische context of systeemprompttekst toe vóór de modelaanroep
- `before_agent_start` — gecombineerde fase alleen voor compatibiliteit; geef de voorkeur aan de twee hooks hierboven
- **`before_agent_reply`** — onderbreek de model-turn met een synthetisch antwoord of stilte
- **`before_agent_finalize`** — inspecteer het natuurlijke eindantwoord en vraag nog één modelpass aan
- `agent_end` — observeer eindberichten, successtatus en run-duur
- `heartbeat_prompt_contribution` — voeg alleen-Heartbeat-context toe voor achtergrondmonitor- en levenscyclusplugins

**Gespreksobservatie**

- `model_call_started` / `model_call_ended` — observeer opgeschoonde provider-/modelaanroepmetadata, timing, uitkomst en begrensde request-id-hashes zonder prompt- of response-inhoud
- `llm_input` — observeer providerinvoer (systeemprompt, prompt, geschiedenis)
- `llm_output` — observeer provideruitvoer

**Tools**

- **`before_tool_call`** — herschrijf toolparameters, blokkeer uitvoering of vereis goedkeuring
- `after_tool_call` — observeer toolresultaten, fouten en duur
- **`tool_result_persist`** — herschrijf het assistant-bericht dat uit een toolresultaat is geproduceerd
- **`before_message_write`** — inspecteer of blokkeer een lopende berichtschrijfactie (zeldzaam)

**Berichten en levering**

- **`inbound_claim`** — claim een inkomend bericht vóór agentroutering (synthetische antwoorden)
- `message_received` — observeer inkomende inhoud, afzender, thread en metadata
- **`message_sending`** — herschrijf uitgaande inhoud of annuleer levering
- `message_sent` — observeer succes of mislukking van uitgaande levering
- **`before_dispatch`** — inspecteer of herschrijf een uitgaande dispatch vóór overdracht aan het kanaal
- **`reply_dispatch`** — neem deel aan de uiteindelijke reply-dispatch-pijplijn

**Sessies en Compaction**

- `session_start` / `session_end` — volg grenzen van de sessielevenscyclus
- `before_compaction` / `after_compaction` — observeer of annoteer Compaction-cycli
- `before_reset` — observeer sessiereset-events (`/reset`, programmatische resets)

**Subagents**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — coördineer subagent-routering en voltooiingslevering

**Levenscyclus**

- `gateway_start` / `gateway_stop` — start of stop services die eigendom zijn van plugins met de Gateway
- `cron_changed` — observeer Gateway-eigen Cron-levenscycluswijzigingen (toegevoegd, bijgewerkt, verwijderd, gestart, voltooid, gepland)
- **`before_install`** — inspecteer skill- of plugininstallatiescans en blokkeer optioneel

## Toolaanroepbeleid

`before_tool_call` ontvangt:

- `event.toolName`
- `event.params`
- optioneel `event.runId`
- optioneel `event.toolCallId`
- contextvelden zoals `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (ingesteld op Cron-gestuurde runs), en diagnostische `ctx.trace`

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
- `requireApproval` pauzeert de agent-run en vraagt de gebruiker via plugin-goedkeuringen.
  De opdracht `/approve` kan zowel exec- als plugin-goedkeuringen goedkeuren.
- Een `block: true` met lagere prioriteit kan nog steeds blokkeren nadat een hook met hogere prioriteit
  goedkeuring heeft gevraagd.
- `onResolution` ontvangt de opgeloste goedkeuringsbeslissing — `allow-once`,
  `allow-always`, `deny`, `timeout` of `cancelled`.

Gebundelde plugins die beleid op hostniveau nodig hebben, kunnen vertrouwde toolbeleidsregels
registreren met `api.registerTrustedToolPolicy(...)`. Deze worden uitgevoerd vóór gewone
`before_tool_call`-hooks en vóór beslissingen van externe plugins. Gebruik ze alleen
voor door de host vertrouwde poorten zoals workspacebeleid, budgethandhaving of
veiligheid van gereserveerde workflows. Externe plugins moeten normale `before_tool_call`-hooks
gebruiken.

### Persistentie van toolresultaten

Toolresultaten kunnen gestructureerde `details` bevatten voor UI-rendering, diagnostiek,
mediaroutering of metadata die eigendom is van plugins. Behandel `details` als runtimemetadata,
niet als promptinhoud:

- OpenClaw verwijdert `toolResult.details` vóór provider-replay en Compaction-
  invoer, zodat metadata geen modelcontext wordt.
- Gepersisteerde sessie-items bewaren alleen begrensde `details`. Te grote details worden
  vervangen door een compacte samenvatting en `persistedDetailsTruncated: true`.
- `tool_result_persist` en `before_message_write` worden uitgevoerd vóór de uiteindelijke
  persistentielimiet. Hooks moeten geretourneerde `details` toch klein houden en vermijden
  promptrelevante tekst alleen in `details` te plaatsen; zet modelzichtbare tooluitvoer
  in `content`.

## Prompt- en modelhooks

Gebruik de fasespecifieke hooks voor nieuwe plugins:

- `before_model_resolve`: ontvangt alleen de huidige prompt en attachment-
  metadata. Retourneer `providerOverride` of `modelOverride`.
- `agent_turn_prepare`: ontvangt de huidige prompt, voorbereide sessieberichten,
  en eventuele exact-eenmalige wachtrij-injecties die voor deze sessie zijn geleegd. Retourneer
  `prependContext` of `appendContext`.
- `before_prompt_build`: ontvangt de huidige prompt en sessieberichten.
  Retourneer `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` of `appendSystemContext`.
- `heartbeat_prompt_contribution`: wordt alleen uitgevoerd voor Heartbeat-turns en retourneert
  `prependContext` of `appendContext`. Dit is bedoeld voor achtergrondmonitors
  die de huidige status moeten samenvatten zonder door gebruikers geïnitieerde turns te wijzigen.

`before_agent_start` blijft bestaan voor compatibiliteit. Geef de voorkeur aan de expliciete hooks hierboven
zodat je plugin niet afhankelijk is van een legacy gecombineerde fase.

`before_agent_start` en `agent_end` bevatten `event.runId` wanneer OpenClaw de
actieve run kan identificeren. Dezelfde waarde is ook beschikbaar op `ctx.runId`.
Cron-gestuurde runs stellen ook `ctx.jobId` beschikbaar (de id van de oorspronkelijke Cron-job), zodat
plugin-hooks metrics, bijwerkingen of status kunnen scopen naar een specifieke geplande
job.

Voor runs die afkomstig zijn van kanalen is `ctx.messageProvider` het provideroppervlak zoals
`discord` of `telegram`, terwijl `ctx.channelId` de gesprekstarget-
identifier is wanneer OpenClaw die kan afleiden uit de sessiesleutel of leverings-
metadata.

`agent_end` is een observatiehook en wordt fire-and-forget uitgevoerd na de turn. De
hook-runner past een time-out van 30 seconden toe, zodat een vastgelopen plugin of embedding-
endpoint de hook-promise niet voor altijd pending kan laten. Een time-out wordt gelogd en
OpenClaw gaat verder; dit annuleert geen netwerkwerk dat eigendom is van de plugin, tenzij de
plugin ook een eigen abortsignaal gebruikt.

Gebruik `model_call_started` en `model_call_ended` voor telemetrie van provider-aanroepen
die geen raw prompts, geschiedenis, responses, headers, request
bodies of provider-request-ID's mag ontvangen. Deze hooks bevatten stabiele metadata zoals
`runId`, `callId`, `provider`, `model`, optioneel `api`/`transport`, terminale
`durationMs`/`outcome`, en `upstreamRequestIdHash` wanneer OpenClaw een
begrensde provider-request-id-hash kan afleiden.

`before_agent_finalize` wordt alleen uitgevoerd wanneer een harness op het punt staat een natuurlijk
eindantwoord van de assistant te accepteren. Het is niet het `/stop`-annuleringspad en wordt niet
uitgevoerd wanneer de gebruiker een turn afbreekt. Retourneer `{ action: "revise", reason }` om
de harness om nog één modelpass vóór finalisatie te vragen, `{ action:
"finalize", reason? }` om finalisatie te forceren, of laat een resultaat weg om door te gaan.
Native Codex-`Stop`-hooks worden doorgegeven aan deze hook als OpenClaw-
`before_agent_finalize`-beslissingen.

Niet-gebundelde plugins die `llm_input`, `llm_output`,
`before_agent_finalize` of `agent_end` nodig hebben, moeten instellen:

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

Prompt-muterende hooks en duurzame next-turn-injecties kunnen per plugin worden uitgeschakeld
met `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Sessie-extensies en next-turn-injecties

Workflowplugins kunnen kleine JSON-compatibele sessiestatus persisteren met
`api.registerSessionExtension(...)` en deze bijwerken via de Gateway-
methode `sessions.pluginPatch`. Sessierijen projecteren geregistreerde extensiestatus
via `pluginExtensions`, zodat Control UI en andere clients status die eigendom is van plugins kunnen renderen
zonder plugin-internals te leren.

Gebruik `api.enqueueNextTurnInjection(...)` wanneer een plugin duurzame context
exact één keer de volgende model-turn moet laten bereiken. OpenClaw leegt wachtrij-injecties vóór
prompt-hooks, verwijdert verlopen injecties en dedupliceert per plugin op `idempotencyKey`.
Dit is de juiste seam voor hervattingen na goedkeuring, beleidssamenvattingen,
delta's van achtergrondmonitors en opdrachtvervolgen die zichtbaar moeten zijn voor
het model bij de volgende turn, maar geen permanente systeemprompttekst mogen worden.

Opruimsemantiek maakt deel uit van het contract. Opruiming van sessie-extensies en
callbacks voor runtime-levenscyclusopruiming ontvangen `reset`, `delete`, `disable` of
`restart`. De host verwijdert de persistente sessie-extensiestatus van de eigenaar-plugin
en pending next-turn-injecties voor reset/delete/disable; restart behoudt
duurzame sessiestatus terwijl opruimcallbacks plugins scheduler-
jobs, runcontext en andere out-of-band-resources voor de oude runtime-
generatie laten vrijgeven.

## Berichthooks

Gebruik berichthooks voor kanaalniveau-routering en leveringsbeleid:

- `message_received`: observeer binnenkomende inhoud, afzender, `threadId`, `messageId`,
  `senderId`, optionele run-/sessiecorrelatie en metadata.
- `message_sending`: herschrijf `content` of retourneer `{ cancel: true }`.
- `message_sent`: observeer uiteindelijk succes of falen.

Voor TTS-antwoorden met alleen audio kan `content` het verborgen gesproken transcript
bevatten, zelfs wanneer de kanaalpayload geen zichtbare tekst/onderschrift heeft. Het herschrijven van die
`content` werkt alleen het transcript bij dat zichtbaar is voor hooks; het wordt niet weergegeven als een
mediaonderschrift.

Berichthook-contexten maken stabiele correlatievelden beschikbaar wanneer aanwezig:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` en `ctx.callDepth`. Geef de voorkeur aan
deze eersteklas velden voordat je legacy-metadata leest.

Geef de voorkeur aan getypte velden `threadId` en `replyToId` voordat je kanaalspecifieke
metadata gebruikt.

Beslisregels:

- `message_sending` met `cancel: true` is definitief.
- `message_sending` met `cancel: false` wordt behandeld als geen beslissing.
- Herschreven `content` gaat door naar hooks met lagere prioriteit, tenzij een latere hook
  de levering annuleert.

## Installatiehooks

`before_install` wordt uitgevoerd na de ingebouwde scan voor installatie van Skills en plugins.
Retourneer aanvullende bevindingen of `{ block: true, blockReason }` om de
installatie te stoppen.

`block: true` is definitief. `block: false` wordt behandeld als geen beslissing.

## Gateway-levenscyclus

Gebruik `gateway_start` voor pluginservices die door de Gateway beheerde status nodig hebben. De
context maakt `ctx.config`, `ctx.workspaceDir` en `ctx.getCron?.()` beschikbaar voor
croninspectie en updates. Gebruik `gateway_stop` om langlopende
resources op te ruimen.

Vertrouw niet op de interne hook `gateway:startup` voor runtime-services die eigendom zijn van plugins.

`cron_changed` wordt geactiveerd voor levenscyclusgebeurtenissen van cron die eigendom zijn van de Gateway, met een getypte
eventpayload voor de redenen `added`, `updated`, `removed`, `started`, `finished`
en `scheduled`. Het event bevat een snapshot van `PluginHookGatewayCronJob`
(inclusief `state.nextRunAtMs`, `state.lastRunStatus` en
`state.lastError` wanneer aanwezig) plus een `PluginHookGatewayCronDeliveryStatus`
van `not-requested` | `delivered` | `not-delivered` | `unknown`. Verwijderde
events bevatten nog steeds de snapshot van de verwijderde job, zodat externe schedulers de
status kunnen reconciliëren. Gebruik `ctx.getCron?.()` en `ctx.config` uit de runtime-
context bij het synchroniseren van externe wake-schedulers en houd OpenClaw aan als de
bron van waarheid voor controles op vervallen taken en uitvoering.

## Aankomende deprecaties

Een paar hook-gerelateerde oppervlakken zijn verouderd, maar worden nog steeds ondersteund. Migreer
vóór de volgende grote release:

- **Plattetekst-kanaalenveloppen** in handlers voor `inbound_claim` en `message_received`.
  Lees `BodyForAgent` en de gestructureerde gebruikerscontextblokken
  in plaats van platte enveloptekst te parsen. Zie
  [Plattetekst-kanaalenveloppen → BodyForAgent](/nl/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** blijft bestaan voor compatibiliteit. Nieuwe plugins moeten
  `before_model_resolve` en `before_prompt_build` gebruiken in plaats van de gecombineerde
  fase.
- **`onResolution` in `before_tool_call`** gebruikt nu de getypte
  union `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) in plaats van een vrije `string`.

Zie voor de volledige lijst — registratie van geheugencapaciteiten, providerdenkprofiel,
externe authproviders, providerdetectietypen, taakruntime-
accessors en de hernoeming van `command-auth` naar `command-status` —
[Plugin SDK-migratie → Actieve deprecaties](/nl/plugins/sdk-migration#active-deprecations).

## Gerelateerd

- [Plugin SDK-migratie](/nl/plugins/sdk-migration) — actieve deprecaties en tijdlijn voor verwijdering
- [Plugins bouwen](/nl/plugins/building-plugins)
- [Overzicht van Plugin SDK](/nl/plugins/sdk-overview)
- [Plugin-entrypoints](/nl/plugins/sdk-entrypoints)
- [Interne hooks](/nl/automation/hooks)
- [Interne Plugin-architectuur](/nl/plugins/architecture-internals)
