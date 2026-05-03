---
read_when:
    - Je bouwt een Plugin die before_tool_call, before_agent_reply, berichthooks of levenscyclushooks nodig heeft
    - Je moet toolaanroepen vanuit een Plugin blokkeren, herschrijven of er goedkeuring voor vereisen
    - Je kiest tussen interne hooks en Plugin-hooks
summary: 'Plugin-hooks: onderschep agent-, hulpmiddel-, bericht-, sessie- en Gateway-levenscyclusgebeurtenissen'
title: Plugin-hooks
x-i18n:
    generated_at: "2026-05-03T21:35:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c4ed060f1b89917e1f2f46d2da9448cd562edbcd6ce03bc9b1a83da3ed9a591
    source_path: plugins/hooks.md
    workflow: 16
---

Pluginhooks zijn in-process uitbreidingspunten voor OpenClaw-plugins. Gebruik ze
wanneer een plugin agentruns, toolaanroepen, berichtenstroom,
sessielevenscyclus, subagentrouting, installaties of Gateway-opstart moet inspecteren of wijzigen.

Gebruik in plaats daarvan [interne hooks](/nl/automation/hooks) wanneer je een klein
door de operator geïnstalleerd `HOOK.md`-script wilt voor opdracht- en Gateway-gebeurtenissen zoals
`/new`, `/reset`, `/stop`, `agent:bootstrap` of `gateway:startup`.

## Snelstart

Registreer getypeerde pluginhooks met `api.on(...)` vanuit je plugin-entry:

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

Hook-handlers worden opeenvolgend uitgevoerd in aflopende `priority`. Hooks met
dezelfde prioriteit behouden de registratievolgorde.

`api.on(name, handler, opts?)` accepteert:

- `priority` — volgorde van handlers (hoger wordt eerst uitgevoerd).
- `timeoutMs` — optioneel budget per hook. Wanneer dit is ingesteld, breekt de hook-runner die
  handler af nadat het budget is verstreken en gaat hij door met de volgende, in plaats van
  trage setup- of recall-werkzaamheden de door de caller geconfigureerde model
  timeout te laten gebruiken. Laat dit weg om de standaard observatie-/beslissingstimeout te gebruiken die de
  hook-runner generiek toepast.

Operators kunnen ook hookbudgetten instellen zonder plugin-code te patchen:

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
een positief geheel getal zijn van maximaal 600000 milliseconden. Geef de voorkeur aan per-hook
overschrijvingen voor bekende trage hooks, zodat één plugin niet overal een langer budget krijgt.

Elke hook ontvangt `event.context.pluginConfig`, de opgeloste configuratie voor de
plugin die die handler heeft geregistreerd. Gebruik dit voor hookbeslissingen die
huidige pluginopties nodig hebben; OpenClaw injecteert dit per handler zonder het
gedeelde event-object te muteren dat andere plugins zien.

## Hookcatalogus

Hooks zijn gegroepeerd op het oppervlak dat ze uitbreiden. Namen in **vet** accepteren een
beslissingsresultaat (blokkeren, annuleren, overschrijven of goedkeuring vereisen); alle andere zijn
alleen voor observatie.

**Agentbeurt**

- `before_model_resolve` — overschrijf provider of model voordat sessieberichten worden geladen
- `agent_turn_prepare` — verwerk in wachtrij geplaatste pluginbeurt-injecties en voeg context voor dezelfde beurt toe vóór prompt-hooks
- `before_prompt_build` — voeg dynamische context of systeemprompttekst toe vóór de modelaanroep
- `before_agent_start` — gecombineerde fase alleen voor compatibiliteit; geef de voorkeur aan de twee hooks hierboven
- **`before_agent_reply`** — kortsluit de modelbeurt met een synthetisch antwoord of stilte
- **`before_agent_finalize`** — inspecteer het natuurlijke eindantwoord en vraag één extra modelpass aan
- `agent_end` — observeer eindberichten, successtatus en run-duur
- `heartbeat_prompt_contribution` — voeg alleen-Heartbeat-context toe voor achtergrondmonitor- en lifecycleplugins

**Conversatieobservatie**

- `model_call_started` / `model_call_ended` — observeer opgeschoonde provider-/modelaanroepmetadata, timing, uitkomst en begrensde request-id-hashes zonder prompt- of response-inhoud
- `llm_input` — observeer providerinvoer (systeemprompt, prompt, geschiedenis)
- `llm_output` — observeer provideruitvoer

**Tools**

- **`before_tool_call`** — herschrijf toolparameters, blokkeer uitvoering of vereis goedkeuring
- `after_tool_call` — observeer toolresultaten, fouten en duur
- **`tool_result_persist`** — herschrijf het assistentbericht dat uit een toolresultaat is gemaakt
- **`before_message_write`** — inspecteer of blokkeer een lopende berichtschrijfactie (zeldzaam)

**Berichten en aflevering**

- **`inbound_claim`** — claim een binnenkomend bericht vóór agentrouting (synthetische antwoorden)
- `message_received` — observeer binnenkomende inhoud, afzender, thread en metadata
- **`message_sending`** — herschrijf uitgaande inhoud of annuleer aflevering
- `message_sent` — observeer succes of mislukking van uitgaande aflevering
- **`before_dispatch`** — inspecteer of herschrijf een uitgaande dispatch vóór overdracht aan het kanaal
- **`reply_dispatch`** — neem deel aan de uiteindelijke reply-dispatch-pijplijn

**Sessies en Compaction**

- `session_start` / `session_end` — volg grenzen van de sessielevenscyclus
- `before_compaction` / `after_compaction` — observeer of annoteer Compaction-cycli
- `before_reset` — observeer sessie-resetgebeurtenissen (`/reset`, programmatische resets)

**Subagents**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — coördineer subagentrouting en aflevering bij voltooiing

**Levenscyclus**

- `gateway_start` / `gateway_stop` — start of stop pluginbeheerde services met de Gateway
- `cron_changed` — observeer gatewaybeheerde Cron-levenscycluswijzigingen (toegevoegd, bijgewerkt, verwijderd, gestart, voltooid, gepland)
- **`before_install`** — inspecteer skill- of plugin-installatiescans en blokkeer optioneel

## Toolaanroepbeleid

`before_tool_call` ontvangt:

- `event.toolName`
- `event.params`
- optioneel `event.runId`
- optioneel `event.toolCallId`
- contextvelden zoals `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (ingesteld bij door cron aangestuurde runs) en diagnostische `ctx.trace`

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
- `requireApproval` pauzeert de agentrun en vraagt de gebruiker om goedkeuring via plugin
  approvals. De opdracht `/approve` kan zowel exec- als plugin approvals goedkeuren.
- Een `block: true` met lagere prioriteit kan nog steeds blokkeren nadat een hook met hogere prioriteit
  goedkeuring heeft gevraagd.
- `onResolution` ontvangt de opgeloste goedkeuringsbeslissing — `allow-once`,
  `allow-always`, `deny`, `timeout` of `cancelled`.

Gebundelde plugins die hostniveau-beleid nodig hebben, kunnen vertrouwd toolbeleid registreren
met `api.registerTrustedToolPolicy(...)`. Deze worden uitgevoerd vóór gewone
`before_tool_call`-hooks en vóór beslissingen van externe plugins. Gebruik ze alleen
voor door de host vertrouwde gates zoals workspacebeleid, budgethandhaving of
gereserveerde workflowveiligheid. Externe plugins moeten normale `before_tool_call`
hooks gebruiken.

### Persistentie van toolresultaten

Toolresultaten kunnen gestructureerde `details` bevatten voor UI-rendering, diagnostiek,
mediarouting of pluginbeheerde metadata. Behandel `details` als runtime-metadata,
niet als promptinhoud:

- OpenClaw verwijdert `toolResult.details` vóór provider-replay en Compaction-
  invoer, zodat metadata geen modelcontext wordt.
- Gepersisteerde sessie-items behouden alleen begrensde `details`. Te grote details worden
  vervangen door een compacte samenvatting en `persistedDetailsTruncated: true`.
- `tool_result_persist` en `before_message_write` worden uitgevoerd vóór de uiteindelijke
  persistentielimiet. Hooks moeten geretourneerde `details` nog steeds klein houden en vermijden
  promptrelevante tekst alleen in `details` te plaatsen; zet voor het model zichtbare tooluitvoer
  in `content`.

## Prompt- en modelhooks

Gebruik de fasespecifieke hooks voor nieuwe plugins:

- `before_model_resolve`: ontvangt alleen de huidige prompt en attachment-
  metadata. Retourneer `providerOverride` of `modelOverride`.
- `agent_turn_prepare`: ontvangt de huidige prompt, voorbereide sessieberichten
  en eventuele exactly-once in wachtrij geplaatste injecties die voor deze sessie zijn leeggemaakt. Retourneer
  `prependContext` of `appendContext`.
- `before_prompt_build`: ontvangt de huidige prompt en sessieberichten.
  Retourneer `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` of `appendSystemContext`.
- `heartbeat_prompt_contribution`: wordt alleen uitgevoerd voor Heartbeat-beurten en retourneert
  `prependContext` of `appendContext`. Het is bedoeld voor achtergrondmonitors
  die de huidige toestand moeten samenvatten zonder door gebruikers geïnitieerde beurten te wijzigen.

`before_agent_start` blijft beschikbaar voor compatibiliteit. Geef de voorkeur aan de expliciete hooks hierboven
zodat je plugin niet afhankelijk is van een verouderde gecombineerde fase.

`before_agent_start` en `agent_end` bevatten `event.runId` wanneer OpenClaw de
actieve run kan identificeren. Dezelfde waarde is ook beschikbaar op `ctx.runId`.
Door Cron aangestuurde runs stellen ook `ctx.jobId` beschikbaar (de id van de oorspronkelijke cronjob), zodat
pluginhooks metrics, bijwerkingen of status kunnen beperken tot een specifieke geplande
job.

Voor runs die vanuit kanalen afkomstig zijn, is `ctx.messageProvider` het provideroppervlak zoals
`discord` of `telegram`, terwijl `ctx.channelId` de doelidentifier van het gesprek is
wanneer OpenClaw er een kan afleiden uit de sessiesleutel of aflevermetadata.

`agent_end` is een observatiehook en wordt fire-and-forget uitgevoerd na de beurt. De
hook-runner past een timeout van 30 seconden toe, zodat een vastgelopen plugin of embedding-
endpoint de hook-promise niet voor altijd pending kan laten. Een timeout wordt gelogd en
OpenClaw gaat door; het annuleert geen pluginbeheerd netwerkwerk tenzij de
plugin ook zijn eigen abortsignaal gebruikt.

Gebruik `model_call_started` en `model_call_ended` voor provider-call-telemetrie
die geen ruwe prompts, geschiedenis, responses, headers, request
bodies of provider-request-ID's mag ontvangen. Deze hooks bevatten stabiele metadata zoals
`runId`, `callId`, `provider`, `model`, optionele `api`/`transport`, terminale
`durationMs`/`outcome` en `upstreamRequestIdHash` wanneer OpenClaw een
begrensde provider-request-id-hash kan afleiden.

`before_agent_finalize` wordt alleen uitgevoerd wanneer een harness op het punt staat een natuurlijk
uiteindelijk assistentantwoord te accepteren. Het is niet het `/stop`-annuleringspad en wordt niet
uitgevoerd wanneer de gebruiker een beurt afbreekt. Retourneer `{ action: "revise", reason }` om
de harness om één extra modelpass vóór finalisatie te vragen, `{ action:
"finalize", reason? }` om finalisatie af te dwingen, of laat een resultaat weg om door te gaan.
Native Codex `Stop`-hooks worden doorgestuurd naar deze hook als OpenClaw
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
via `pluginExtensions`, waardoor Control UI en andere clients pluginbeheerde
status kunnen renderen zonder plugininternals te leren kennen.

Gebruik `api.enqueueNextTurnInjection(...)` wanneer een Plugin duurzame context nodig heeft om precies één keer de volgende modelbeurt te bereiken. OpenClaw verwerkt injecties in de wachtrij vóór prompt-hooks, verwijdert verlopen injecties en dedupliceert per Plugin op basis van `idempotencyKey`. Dit is de juiste overgang voor hervattingen na goedkeuring, beleidssamenvattingen, delta's van achtergrondmonitors en voortzettingen van opdrachten die in de volgende beurt zichtbaar moeten zijn voor het model, maar geen permanente systeem-prompttekst mogen worden.

Opschoonsemantiek maakt deel uit van het contract. Opschoning van sessie-extensies en callbacks voor opschoning van de runtime-levenscyclus ontvangen `reset`, `delete`, `disable` of `restart`. De host verwijdert de persistente sessie-extensiestatus van de eigenaar-Plugin en openstaande injecties voor de volgende beurt bij reset/delete/disable; restart behoudt duurzame sessiestatus terwijl opschooncallbacks Plugins scheduler-taken, runcontext en andere out-of-band resources voor de oude runtimegeneratie laten vrijgeven.

## Berichthooks

Gebruik berichthooks voor routering en afleverbeleid op kanaalniveau:

- `message_received`: observeer inkomende inhoud, afzender, `threadId`, `messageId`, `senderId`, optionele run-/sessiecorrelatie en metadata.
- `message_sending`: herschrijf `content` of retourneer `{ cancel: true }`.
- `message_sent`: observeer uiteindelijk succes of falen.

Voor audio-only TTS-antwoorden kan `content` het verborgen uitgesproken transcript bevatten, zelfs wanneer de kanaalpayload geen zichtbare tekst/ondertitel heeft. Het herschrijven van die `content` werkt alleen het voor de hook zichtbare transcript bij; het wordt niet weergegeven als media-ondertitel.

Berichthookcontexten stellen stabiele correlatievelden beschikbaar wanneer die beschikbaar zijn: `ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`, `ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` en `ctx.callDepth`. Geef de voorkeur aan deze eersteklas velden voordat je verouderde metadata leest.

Geef de voorkeur aan getypeerde velden `threadId` en `replyToId` voordat je kanaalspecifieke metadata gebruikt.

Beslisregels:

- `message_sending` met `cancel: true` is terminaal.
- `message_sending` met `cancel: false` wordt behandeld als geen beslissing.
- Herschreven `content` gaat door naar hooks met lagere prioriteit, tenzij een latere hook aflevering annuleert.

## Installatiehooks

`before_install` wordt uitgevoerd na de ingebouwde scan voor installaties van Skills en Plugins. Retourneer aanvullende bevindingen of `{ block: true, blockReason }` om de installatie te stoppen.

`block: true` is terminaal. `block: false` wordt behandeld als geen beslissing.

## Gateway-levenscyclus

Gebruik `gateway_start` voor Plugin-services die Gateway-beheerde status nodig hebben. De context stelt `ctx.config`, `ctx.workspaceDir` en `ctx.getCron?.()` beschikbaar voor Cron-inspectie en updates. Gebruik `gateway_stop` om langlopende resources op te schonen.

Vertrouw niet op de interne `gateway:startup`-hook voor runtime-services die eigendom zijn van een Plugin.

`cron_changed` wordt geactiveerd voor Gateway-beheerde Cron-levenscyclusgebeurtenissen met een getypeerde gebeurtenispayload die de redenen `added`, `updated`, `removed`, `started`, `finished` en `scheduled` omvat. De gebeurtenis bevat een snapshot van `PluginHookGatewayCronJob` (inclusief `state.nextRunAtMs`, `state.lastRunStatus` en `state.lastError` wanneer aanwezig) plus een `PluginHookGatewayCronDeliveryStatus` van `not-requested` | `delivered` | `not-delivered` | `unknown`. Verwijderde gebeurtenissen bevatten nog steeds de snapshot van de verwijderde taak, zodat externe schedulers status kunnen verzoenen. Gebruik `ctx.getCron?.()` en `ctx.config` uit de runtimecontext bij het synchroniseren van externe wake-schedulers, en houd OpenClaw als bron van waarheid voor controles op vervaldatum en uitvoering.

## Aankomende verouderingen

Enkele hook-gerelateerde oppervlakken zijn verouderd maar worden nog steeds ondersteund. Migreer vóór de volgende major release:

- **Plaintext kanaalenveloppen** in handlers voor `inbound_claim` en `message_received`. Lees `BodyForAgent` en de gestructureerde gebruikerscontextblokken in plaats van platte enveloptekst te parsen. Zie [Plaintext kanaalenveloppen → BodyForAgent](/nl/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** blijft bestaan voor compatibiliteit. Nieuwe Plugins moeten `before_model_resolve` en `before_prompt_build` gebruiken in plaats van de gecombineerde fase.
- **`onResolution` in `before_tool_call`** gebruikt nu de getypeerde union `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` / `timeout` / `cancelled`) in plaats van een vrije `string`.

Zie voor de volledige lijst — registratie van geheugencapaciteit, thinking-profiel van provider, externe auth-providers, typen voor provider-discovery, accessors voor taakruntime en de hernoeming van `command-auth` → `command-status` — [Plugin SDK-migratie → Actieve verouderingen](/nl/plugins/sdk-migration#active-deprecations).

## Gerelateerd

- [Plugin SDK-migratie](/nl/plugins/sdk-migration) — actieve verouderingen en tijdlijn voor verwijdering
- [Plugins bouwen](/nl/plugins/building-plugins)
- [Overzicht van Plugin SDK](/nl/plugins/sdk-overview)
- [Plugin-entrypoints](/nl/plugins/sdk-entrypoints)
- [Interne hooks](/nl/automation/hooks)
- [Interne Plugin-architectuur](/nl/plugins/architecture-internals)
