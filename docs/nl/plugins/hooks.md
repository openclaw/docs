---
read_when:
    - Je bouwt een Plugin die before_tool_call, before_agent_reply, berichthooks of levenscyclushooks nodig heeft
    - Je moet toolaanroepen van een Plugin blokkeren, herschrijven of goedkeuring ervoor vereisen.
    - Je kiest tussen interne hooks en Plugin-hooks
summary: 'Plugin-hooks: onderschep agent-, hulpmiddel-, bericht-, sessie- en Gateway-levenscyclusgebeurtenissen'
title: Plugin-hookfuncties
x-i18n:
    generated_at: "2026-04-29T23:03:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: f600df47c67eb07d85b7b063f1189baf78a49efad727d8cadbd37f66745c4401
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin-hooks zijn in-process uitbreidingspunten voor OpenClaw-plugins. Gebruik ze
wanneer een plugin agentruns, toolaanroepen, berichtenstroom,
sessielevenscyclus, subagent-routering, installaties of Gateway-opstart moet inspecteren of wijzigen.

Gebruik in plaats daarvan [interne hooks](/nl/automation/hooks) wanneer je een klein,
door een operator geïnstalleerd `HOOK.md`-script wilt voor opdracht- en Gateway-gebeurtenissen zoals
`/new`, `/reset`, `/stop`, `agent:bootstrap` of `gateway:startup`.

## Snel aan de slag

Registreer getypeerde plugin-hooks met `api.on(...)` vanuit je plugin-entry:

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

- `priority` — handler-volgorde (hoger wordt eerst uitgevoerd).
- `timeoutMs` — optioneel budget per hook. Wanneer dit is ingesteld, breekt de hook-runner die
  handler af nadat het budget is verstreken en gaat door met de volgende, in plaats van
  trage setup of recall-werk de door de aanroeper geconfigureerde model-timeout te laten
  verbruiken. Laat dit weg om de standaard observatie-/beslissingstime-out te gebruiken die de
  hook-runner generiek toepast.

Elke hook ontvangt `event.context.pluginConfig`, de opgeloste configuratie voor de
plugin die die handler heeft geregistreerd. Gebruik dit voor hook-beslissingen die
huidige plugin-opties nodig hebben; OpenClaw injecteert dit per handler zonder het
gedeelde event-object te muteren dat andere plugins zien.

## Hook-catalogus

Hooks zijn gegroepeerd op het oppervlak dat ze uitbreiden. Namen in **vet** accepteren een
beslissingsresultaat (blokkeren, annuleren, overschrijven of goedkeuring vereisen); alle andere zijn
alleen voor observatie.

**Agentbeurt**

- `before_model_resolve` — overschrijf provider of model voordat sessieberichten laden
- `agent_turn_prepare` — verwerk in de wachtrij geplaatste plugin-turn-injecties en voeg context voor dezelfde beurt toe vóór prompt-hooks
- `before_prompt_build` — voeg dynamische context of systeemprompttekst toe vóór de modelaanroep
- `before_agent_start` — gecombineerde fase alleen voor compatibiliteit; geef de voorkeur aan de twee hooks hierboven
- **`before_agent_reply`** — beëindig de modelbeurt vroegtijdig met een synthetisch antwoord of stilte
- **`before_agent_finalize`** — inspecteer het natuurlijke eindantwoord en vraag één extra modelpassage aan
- `agent_end` — observeer eindberichten, successtatus en uitvoeringsduur
- `heartbeat_prompt_contribution` — voeg alleen-Heartbeat-context toe voor achtergrondmonitor- en lifecycle-plugins

**Conversatieobservatie**

- `model_call_started` / `model_call_ended` — observeer opgeschoonde provider-/modelaanroepmetadata, timing, uitkomst en begrensde request-id-hashes zonder prompt- of responsinhoud
- `llm_input` — observeer providerinvoer (systeemprompt, prompt, geschiedenis)
- `llm_output` — observeer provideruitvoer

**Tools**

- **`before_tool_call`** — herschrijf toolparameters, blokkeer uitvoering of vereis goedkeuring
- `after_tool_call` — observeer toolresultaten, fouten en duur
- **`tool_result_persist`** — herschrijf het assistentbericht dat uit een toolresultaat wordt geproduceerd
- **`before_message_write`** — inspecteer of blokkeer een lopende berichtschrijfactie (zeldzaam)

**Berichten en aflevering**

- **`inbound_claim`** — claim een inkomend bericht vóór agent-routering (synthetische antwoorden)
- `message_received` — observeer inkomende inhoud, afzender, thread en metadata
- **`message_sending`** — herschrijf uitgaande inhoud of annuleer aflevering
- `message_sent` — observeer succes of mislukking van uitgaande aflevering
- **`before_dispatch`** — inspecteer of herschrijf een uitgaande dispatch vóór overdracht aan het kanaal
- **`reply_dispatch`** — neem deel aan de uiteindelijke reply-dispatch-pipeline

**Sessies en Compaction**

- `session_start` / `session_end` — volg grenzen van de sessielevenscyclus
- `before_compaction` / `after_compaction` — observeer of annoteer Compaction-cycli
- `before_reset` — observeer sessie-resetgebeurtenissen (`/reset`, programmatische resets)

**Subagents**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — coördineer subagent-routering en afleveren van voltooiing

**Levenscyclus**

- `gateway_start` / `gateway_stop` — start of stop plugin-eigen services met de Gateway
- `cron_changed` — observeer gateway-eigen Cron-levenscycluswijzigingen (toegevoegd, bijgewerkt, verwijderd, gestart, voltooid, gepland)
- **`before_install`** — inspecteer Skills- of plugin-installatiescans en blokkeer optioneel

## Toolaanroepbeleid

`before_tool_call` ontvangt:

- `event.toolName`
- `event.params`
- optioneel `event.runId`
- optioneel `event.toolCallId`
- contextvelden zoals `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (ingesteld bij Cron-gestuurde runs) en diagnostische `ctx.trace`

Het kan teruggeven:

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
- `requireApproval` pauzeert de agentrun en vraagt de gebruiker om goedkeuring via plugin-goedkeuringen. De opdracht `/approve` kan zowel exec- als plugin-goedkeuringen goedkeuren.
- Een `block: true` met lagere prioriteit kan nog steeds blokkeren nadat een hook met hogere prioriteit goedkeuring heeft gevraagd.
- `onResolution` ontvangt de opgeloste goedkeuringsbeslissing — `allow-once`,
  `allow-always`, `deny`, `timeout` of `cancelled`.

Gebundelde plugins die hostniveau-beleid nodig hebben, kunnen vertrouwd toolbeleid registreren
met `api.registerTrustedToolPolicy(...)`. Deze worden uitgevoerd vóór gewone
`before_tool_call`-hooks en vóór beslissingen van externe plugins. Gebruik ze alleen
voor door de host vertrouwde poorten zoals workspacebeleid, budgethandhaving of
gereserveerde workflowveiligheid. Externe plugins moeten normale `before_tool_call`-hooks gebruiken.

### Persistentie van toolresultaten

Toolresultaten kunnen gestructureerde `details` bevatten voor UI-rendering, diagnostiek,
mediaroutering of plugin-eigen metadata. Behandel `details` als runtimemetadata,
niet als promptinhoud:

- OpenClaw verwijdert `toolResult.details` vóór provider-replay en Compaction-invoer,
  zodat metadata geen modelcontext wordt.
- Gepersisteerde sessie-items behouden alleen begrensde `details`. Te grote details worden
  vervangen door een compacte samenvatting en `persistedDetailsTruncated: true`.
- `tool_result_persist` en `before_message_write` worden uitgevoerd vóór de uiteindelijke
  persistentielimiet. Hooks moeten geretourneerde `details` nog steeds klein houden en vermijden
  promptrelevante tekst alleen in `details` te plaatsen; zet voor het model zichtbare tooluitvoer
  in `content`.

## Prompt- en model-hooks

Gebruik de fasespecifieke hooks voor nieuwe plugins:

- `before_model_resolve`: ontvangt alleen de huidige prompt en attachment-metadata.
  Retourneer `providerOverride` of `modelOverride`.
- `agent_turn_prepare`: ontvangt de huidige prompt, voorbereide sessieberichten
  en alle exactly-once wachtrij-injecties die voor deze sessie zijn verwerkt. Retourneer
  `prependContext` of `appendContext`.
- `before_prompt_build`: ontvangt de huidige prompt en sessieberichten.
  Retourneer `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` of `appendSystemContext`.
- `heartbeat_prompt_contribution`: wordt alleen uitgevoerd voor Heartbeat-beurten en retourneert
  `prependContext` of `appendContext`. Het is bedoeld voor achtergrondmonitors
  die de huidige status moeten samenvatten zonder door de gebruiker geïnitieerde beurten te wijzigen.

`before_agent_start` blijft bestaan voor compatibiliteit. Geef de voorkeur aan de expliciete hooks hierboven,
zodat je plugin niet afhankelijk is van een verouderde gecombineerde fase.

`before_agent_start` en `agent_end` bevatten `event.runId` wanneer OpenClaw de
actieve run kan identificeren. Dezelfde waarde is ook beschikbaar op `ctx.runId`.
Cron-gestuurde runs stellen ook `ctx.jobId` bloot (de id van de oorspronkelijke cronjob), zodat
plugin-hooks statistieken, neveneffecten of status aan een specifieke geplande
job kunnen koppelen.

`agent_end` is een observatiehook en wordt fire-and-forget uitgevoerd na de beurt. De
hook-runner past een time-out van 30 seconden toe, zodat een vastgelopen plugin of embedding-
endpoint de hook-promise niet voor altijd open kan laten staan. Een time-out wordt gelogd en
OpenClaw gaat door; het annuleert plugin-eigen netwerkwerk niet tenzij de
plugin ook zijn eigen abortsignaal gebruikt.

Gebruik `model_call_started` en `model_call_ended` voor provider-call-telemetrie
die geen ruwe prompts, geschiedenis, responses, headers, request
bodies of provider-request-id's mag ontvangen. Deze hooks bevatten stabiele metadata zoals
`runId`, `callId`, `provider`, `model`, optioneel `api`/`transport`, terminale
`durationMs`/`outcome` en `upstreamRequestIdHash` wanneer OpenClaw een
begrensde provider-request-id-hash kan afleiden.

`before_agent_finalize` wordt alleen uitgevoerd wanneer een harness op het punt staat een natuurlijk
eindantwoord van de assistent te accepteren. Het is niet het `/stop`-annuleringspad en wordt niet
uitgevoerd wanneer de gebruiker een beurt afbreekt. Retourneer `{ action: "revise", reason }` om
de harness om nog één modelpassage te vragen vóór finalisatie, `{ action:
"finalize", reason? }` om finalisatie af te dwingen, of laat een resultaat weg om door te gaan.
Native Codex-`Stop`-hooks worden aan deze hook doorgegeven als OpenClaw-
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

Workflow-plugins kunnen kleine JSON-compatibele sessiestatus persisteren met
`api.registerSessionExtension(...)` en deze bijwerken via de Gateway-
methode `sessions.pluginPatch`. Sessierijen projecteren geregistreerde extensiestatus
via `pluginExtensions`, zodat Control UI en andere clients plugin-eigen status kunnen renderen
zonder plugin-internals te leren kennen.

Gebruik `api.enqueueNextTurnInjection(...)` wanneer een plugin duurzame context nodig heeft om
de volgende modelbeurt precies één keer te bereiken. OpenClaw verwerkt wachtrij-injecties vóór
prompt-hooks, verwijdert verlopen injecties en dedupliceert per plugin op `idempotencyKey`.
Dit is het juiste punt voor goedkeuringshervattingen, beleidssamenvattingen,
achtergrondmonitor-delta's en opdrachtvoortzettingen die op de volgende beurt zichtbaar moeten zijn voor
het model, maar geen permanente systeemprompttekst moeten worden.

Opruimsemantiek maakt deel uit van het contract. Callbacks voor het opruimen van sessie-extensies en
runtimelevenscyclus ontvangen `reset`, `delete`, `disable` of
`restart`. De host verwijdert de persistente sessie-extensiestatus van de eigenaarplugin
en openstaande next-turn-injecties voor reset/delete/disable; restart behoudt
duurzame sessiestatus terwijl opruimcallbacks plugins scheduler-
jobs, runcontext en andere out-of-band resources voor de oude runtime-
generatie laten vrijgeven.

## Berichthooks

Gebruik berichthooks voor kanaalniveau-routering en afleveringsbeleid:

- `message_received`: observeer inkomende inhoud, afzender, `threadId`, `messageId`,
  `senderId`, optionele run-/sessiecorrelatie en metadata.
- `message_sending`: herschrijf `content` of retourneer `{ cancel: true }`.
- `message_sent`: observeer uiteindelijk succes of mislukking.

Voor audio-only TTS-antwoorden kan `content` het verborgen gesproken transcript bevatten, zelfs wanneer de kanaalpayload geen zichtbare tekst/bijschrift heeft. Het herschrijven van die `content` werkt alleen het voor hooks zichtbare transcript bij; het wordt niet weergegeven als mediabijschrift.

Message-hookcontexten stellen stabiele correlatievelden beschikbaar wanneer die beschikbaar zijn: `ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`, `ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` en `ctx.callDepth`. Geef de voorkeur aan deze eersteklas velden voordat je verouderde metadata leest.

Geef de voorkeur aan getypte `threadId`- en `replyToId`-velden voordat je kanaalspecifieke metadata gebruikt.

Beslissingsregels:

- `message_sending` met `cancel: true` is terminaal.
- `message_sending` met `cancel: false` wordt behandeld als geen beslissing.
- Herschreven `content` gaat door naar hooks met lagere prioriteit, tenzij een latere hook de levering annuleert.

## Hooks installeren

`before_install` wordt uitgevoerd na de ingebouwde scan voor Skills- en Plugin-installaties. Retourneer aanvullende bevindingen of `{ block: true, blockReason }` om de installatie te stoppen.

`block: true` is terminaal. `block: false` wordt behandeld als geen beslissing.

## Gateway-levenscyclus

Gebruik `gateway_start` voor Plugin-services die Gateway-beheerde status nodig hebben. De context stelt `ctx.config`, `ctx.workspaceDir` en `ctx.getCron?.()` beschikbaar voor Cron-inspectie en updates. Gebruik `gateway_stop` om langlopende resources op te ruimen.

Vertrouw niet op de interne `gateway:startup`-hook voor Plugin-beheerde runtimeservices.

`cron_changed` wordt geactiveerd voor Gateway-beheerde Cron-levenscyclusgebeurtenissen met een getypte gebeurtenispayload die de redenen `added`, `updated`, `removed`, `started`, `finished` en `scheduled` dekt. De gebeurtenis bevat een `PluginHookGatewayCronJob`-snapshot (inclusief `state.nextRunAtMs`, `state.lastRunStatus` en `state.lastError` wanneer aanwezig) plus een `PluginHookGatewayCronDeliveryStatus` van `not-requested` | `delivered` | `not-delivered` | `unknown`. Verwijderde gebeurtenissen bevatten nog steeds de snapshot van de verwijderde taak, zodat externe planners de status kunnen reconciliëren. Gebruik `ctx.getCron?.()` en `ctx.config` uit de runtimecontext bij het synchroniseren van externe wake-planners, en behoud OpenClaw als de bron van waarheid voor controles op vervallen taken en uitvoering.

## Aankomende deprecaties

Enkele hook-aangrenzende oppervlakken zijn deprecated, maar worden nog steeds ondersteund. Migreer vóór de volgende major release:

- **Plattetekst-kanaalenveloppen** in `inbound_claim`- en `message_received`-handlers. Lees `BodyForAgent` en de gestructureerde gebruikerscontextblokken in plaats van platte enveloptekst te parsen. Zie [Plattetekst-kanaalenveloppen → BodyForAgent](/nl/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** blijft bestaan voor compatibiliteit. Nieuwe Plugins moeten `before_model_resolve` en `before_prompt_build` gebruiken in plaats van de gecombineerde fase.
- **`onResolution` in `before_tool_call`** gebruikt nu de getypte `PluginApprovalResolution`-union (`allow-once` / `allow-always` / `deny` / `timeout` / `cancelled`) in plaats van een vrije `string`.

Zie voor de volledige lijst — registratie van geheugencapaciteiten, provider-thinkingprofiel, externe auth-providers, provider-discoverytypen, task-runtimeaccessors en de hernoeming van `command-auth` → `command-status` — [Plugin SDK-migratie → Actieve deprecaties](/nl/plugins/sdk-migration#active-deprecations).

## Gerelateerd

- [Plugin SDK-migratie](/nl/plugins/sdk-migration) — actieve deprecaties en verwijderingstijdlijn
- [Plugins bouwen](/nl/plugins/building-plugins)
- [Plugin SDK-overzicht](/nl/plugins/sdk-overview)
- [Plugin-entrypoints](/nl/plugins/sdk-entrypoints)
- [Interne hooks](/nl/automation/hooks)
- [Interne Plugin-architectuur](/nl/plugins/architecture-internals)
