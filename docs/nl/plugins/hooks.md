---
read_when:
    - Je bouwt een Plugin die before_tool_call, before_agent_reply, berichthooks of levenscyclushooks nodig heeft
    - Je moet toolaanroepen vanuit een Plugin blokkeren, herschrijven of hiervoor goedkeuring vereisen
    - Je kiest tussen interne hooks en Plugin-hooks
summary: 'Plugin-hooks: onderschep levenscyclusgebeurtenissen van agents, tools, berichten, sessies en Gateway'
title: Plugin-haken
x-i18n:
    generated_at: "2026-05-06T09:25:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92a149e1b343ea2d3f55855c2d02f4a9519337f0450c8a1428d52cd77ab4046a
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin-hooks zijn in-process uitbreidingspunten voor OpenClaw-plugins. Gebruik ze
wanneer een plugin agentuitvoeringen, toolaanroepen, berichtenstroom,
sessielevenscyclus, subagent-routering, installaties of Gateway-opstart moet
inspecteren of wijzigen.

Gebruik in plaats daarvan [interne hooks](/nl/automation/hooks) wanneer je een klein
door de operator geïnstalleerd `HOOK.md`-script wilt voor command- en Gateway-events zoals
`/new`, `/reset`, `/stop`, `agent:bootstrap` of `gateway:startup`.

## Snelstart

Registreer getypte plugin-hooks met `api.on(...)` vanuit je plugin-entry:

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

- `priority` - handler-volgorde (hoger wordt eerst uitgevoerd).
- `timeoutMs` - optioneel budget per hook. Wanneer dit is ingesteld, breekt de hook-runner die
  handler af nadat het budget is verstreken en gaat door met de volgende, in plaats van
  traag opstart- of herinneringswerk de door de aanroeper geconfigureerde model-time-out
  te laten gebruiken. Laat dit weg om de standaard observatie-/beslissingstime-out te gebruiken die de
  hook-runner generiek toepast.

Operators kunnen ook hook-budgetten instellen zonder plugincode te patchen:

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
plugin-auteur ingestelde waarde `api.on(..., { timeoutMs })` overschrijft. Elke geconfigureerde waarde moet
een positief geheel getal zijn van maximaal 600000 milliseconden. Geef de voorkeur aan overschrijvingen per hook
voor bekende trage hooks, zodat één plugin niet overal een langer budget krijgt.

Elke hook ontvangt `event.context.pluginConfig`, de opgeloste configuratie voor de
plugin die die handler heeft geregistreerd. Gebruik dit voor hook-beslissingen waarvoor
huidige pluginopties nodig zijn; OpenClaw injecteert dit per handler zonder het
gedeelde event-object te muteren dat andere plugins zien.

## Hookcatalogus

Hooks zijn gegroepeerd op het oppervlak dat ze uitbreiden. Namen in **vet** accepteren een
beslissingsresultaat (blokkeren, annuleren, overschrijven of goedkeuring vereisen); alle andere zijn
alleen voor observatie.

**Agentbeurt**

- `before_model_resolve` - provider of model overschrijven voordat sessieberichten worden geladen
- `agent_turn_prepare` - in de wachtrij geplaatste pluginbeurt-injecties verwerken en context voor dezelfde beurt toevoegen vóór prompt-hooks
- `before_prompt_build` - dynamische context of systeemprompttekst toevoegen vóór de modelaanroep
- `before_agent_start` - gecombineerde fase alleen voor compatibiliteit; geef de voorkeur aan de twee hooks hierboven
- **`before_agent_reply`** - de modelbeurt kortsluiten met een synthetisch antwoord of stilte
- **`before_agent_finalize`** - het natuurlijke definitieve antwoord inspecteren en nog één modelpass aanvragen
- `agent_end` - definitieve berichten, successtatus en uitvoeringsduur observeren
- `heartbeat_prompt_contribution` - alleen-heartbeat-context toevoegen voor achtergrondmonitor- en levenscyclusplugins

**Conversatieobservatie**

- `model_call_started` / `model_call_ended` - opgeschoonde provider-/modelaanroepmetadata, timing, resultaat en begrensde request-id-hashes observeren zonder prompt- of response-inhoud
- `llm_input` - providerinvoer observeren (systeemprompt, prompt, geschiedenis)
- `llm_output` - provideruitvoer observeren

**Tools**

- **`before_tool_call`** - toolparameters herschrijven, uitvoering blokkeren of goedkeuring vereisen
- `after_tool_call` - toolresultaten, fouten en duur observeren
- **`tool_result_persist`** - het assistentbericht herschrijven dat uit een toolresultaat wordt geproduceerd
- **`before_message_write`** - een lopende schrijfactie voor een bericht inspecteren of blokkeren (zeldzaam)

**Berichten en levering**

- **`inbound_claim`** - een inkomend bericht claimen vóór agent-routering (synthetische antwoorden)
- `message_received` - inkomende inhoud, afzender, thread en metadata observeren
- **`message_sending`** - uitgaande inhoud herschrijven of levering annuleren
- `message_sent` - succesvolle of mislukte uitgaande levering observeren
- **`before_dispatch`** - een uitgaande dispatch inspecteren of herschrijven vóór overdracht aan het kanaal
- **`reply_dispatch`** - deelnemen aan de uiteindelijke reply-dispatch-pipeline

**Sessies en Compaction**

- `session_start` / `session_end` - grenzen van de sessielevenscyclus volgen
- `before_compaction` / `after_compaction` - Compaction-cycli observeren of annoteren
- `before_reset` - sessie-reset-events observeren (`/reset`, programmatische resets)

**Subagents**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - subagent-routering en voltooiingslevering coördineren

**Levenscyclus**

- `gateway_start` / `gateway_stop` - door plugins beheerde services starten of stoppen met de Gateway
- `cron_changed` - wijzigingen in de door de Gateway beheerde Cron-levenscyclus observeren (toegevoegd, bijgewerkt, verwijderd, gestart, voltooid, gepland)
- **`before_install`** - scanresultaten van Skill- of plugininstallaties inspecteren en optioneel blokkeren

## Toolaanroepbeleid

`before_tool_call` ontvangt:

- `event.toolName`
- `event.params`
- optioneel `event.runId`
- optioneel `event.toolCallId`
- contextvelden zoals `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (ingesteld bij door cron aangestuurde uitvoeringen), en diagnostische `ctx.trace`

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
- `block: false` wordt behandeld alsof er geen beslissing is.
- `params` herschrijft de toolparameters voor uitvoering.
- `requireApproval` pauzeert de agentuitvoering en vraagt de gebruiker via plugin-
  goedkeuringen. De opdracht `/approve` kan zowel exec- als plugingoedkeuringen goedkeuren.
- Een `block: true` met lagere prioriteit kan nog steeds blokkeren nadat een hook met hogere prioriteit
  goedkeuring heeft aangevraagd.
- `onResolution` ontvangt de opgeloste goedkeuringsbeslissing - `allow-once`,
  `allow-always`, `deny`, `timeout` of `cancelled`.

Gebundelde plugins die hostniveau-beleid nodig hebben, kunnen vertrouwde toolpolicy's registreren
met `api.registerTrustedToolPolicy(...)`. Deze worden uitgevoerd vóór gewone
`before_tool_call`-hooks en vóór beslissingen van externe plugins. Gebruik ze alleen
voor door de host vertrouwde gates zoals werkruimtebeleid, budgethandhaving of
gereserveerde workflowveiligheid. Externe plugins moeten normale `before_tool_call`-
hooks gebruiken.

### Persistentie van toolresultaten

Toolresultaten kunnen gestructureerde `details` bevatten voor UI-rendering, diagnostiek,
mediaroutering of door plugins beheerde metadata. Behandel `details` als runtime-metadata,
niet als promptinhoud:

- OpenClaw verwijdert `toolResult.details` vóór provider-replay en Compaction-
  invoer, zodat metadata geen modelcontext wordt.
- Gepersisteerde sessie-items behouden alleen begrensde `details`. Te grote details worden
  vervangen door een compacte samenvatting en `persistedDetailsTruncated: true`.
- `tool_result_persist` en `before_message_write` worden uitgevoerd vóór de uiteindelijke
  persistentielimiet. Hooks moeten geretourneerde `details` nog steeds klein houden en vermijden
  om promptrelevante tekst alleen in `details` te plaatsen; zet voor het model zichtbare tooluitvoer
  in `content`.

## Prompt- en modelhooks

Gebruik de fasespecifieke hooks voor nieuwe plugins:

- `before_model_resolve`: ontvangt alleen de huidige prompt en bijlagemetadata.
  Geef `providerOverride` of `modelOverride` terug.
- `agent_turn_prepare`: ontvangt de huidige prompt, voorbereide sessieberichten
  en eventuele exact-één-keer-injecties uit de wachtrij die voor deze sessie zijn verwerkt. Geef
  `prependContext` of `appendContext` terug.
- `before_prompt_build`: ontvangt de huidige prompt en sessieberichten.
  Geef `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` of `appendSystemContext` terug.
- `heartbeat_prompt_contribution`: wordt alleen uitgevoerd voor Heartbeat-beurten en geeft
  `prependContext` of `appendContext` terug. Het is bedoeld voor achtergrondmonitors
  die de huidige status moeten samenvatten zonder door de gebruiker geïnitieerde beurten te wijzigen.

`before_agent_start` blijft bestaan voor compatibiliteit. Geef de voorkeur aan de expliciete hooks hierboven
zodat je plugin niet afhankelijk is van een legacy gecombineerde fase.

`before_agent_start` en `agent_end` bevatten `event.runId` wanneer OpenClaw de
actieve uitvoering kan identificeren. Dezelfde waarde is ook beschikbaar op `ctx.runId`.
Door Cron aangestuurde uitvoeringen stellen ook `ctx.jobId` beschikbaar (de id van de oorspronkelijke cronjob), zodat
plugin-hooks metrics, bijwerkingen of status kunnen afbakenen tot een specifieke geplande
job.

Voor kanaal-afkomstige uitvoeringen is `ctx.messageProvider` het provideroppervlak zoals
`discord` of `telegram`, terwijl `ctx.channelId` de doelidentifier van de conversatie is
wanneer OpenClaw er een kan afleiden uit de sessiesleutel of leveringsmetadata.

`agent_end` is een observatiehook en wordt fire-and-forget uitgevoerd na de beurt. De
hook-runner past een time-out van 30 seconden toe, zodat een vastgelopen plugin of embedding-
endpoint de hook-promise niet voor altijd pending kan laten. Een time-out wordt gelogd en
OpenClaw gaat door; dit annuleert geen door de plugin beheerd netwerkwerk, tenzij de
plugin ook zijn eigen abortsignaal gebruikt.

Gebruik `model_call_started` en `model_call_ended` voor provider-call-telemetrie
die geen ruwe prompts, geschiedenis, responses, headers, request-
bodies of provider-request-ID's mag ontvangen. Deze hooks bevatten stabiele metadata zoals
`runId`, `callId`, `provider`, `model`, optioneel `api`/`transport`, terminale
`durationMs`/`outcome`, en `upstreamRequestIdHash` wanneer OpenClaw een
begrensde provider-request-id-hash kan afleiden.

`before_agent_finalize` wordt alleen uitgevoerd wanneer een harness op het punt staat een natuurlijk
definitief assistentantwoord te accepteren. Dit is niet het `/stop`-annuleringspad en wordt niet
uitgevoerd wanneer de gebruiker een beurt afbreekt. Geef `{ action: "revise", reason }` terug om
de harness om nog één modelpass te vragen vóór finalisatie, `{ action:
"finalize", reason? }` om finalisatie af te dwingen, of laat een resultaat weg om door te gaan.
Native Codex-`Stop`-hooks worden doorgegeven aan deze hook als OpenClaw-
`before_agent_finalize`-beslissingen.

Bij het teruggeven van `action: "revise"` kunnen plugins `retry`-metadata opnemen om
de extra modelpass begrensd en replay-veilig te maken:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` wordt toegevoegd aan de revisiereden die naar de harness wordt gestuurd.
`idempotencyKey` laat de host retries tellen voor hetzelfde pluginverzoek over
equivalente finalisatiebeslissingen heen, en `maxAttempts` begrenst hoeveel extra passes de
host toestaat voordat wordt doorgegaan met het natuurlijke definitieve antwoord.

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

Workflow-plugins kunnen kleine JSON-compatibele sessiestatus persistent opslaan met
`api.registerSessionExtension(...)` en deze bijwerken via de Gateway-methode
`sessions.pluginPatch`. Sessierijen projecteren geregistreerde extensiestatus
via `pluginExtensions`, zodat Control UI en andere clients plugin-eigen status
kunnen renderen zonder plugin-internals te hoeven kennen.

Gebruik `api.enqueueNextTurnInjection(...)` wanneer een plugin duurzame context
precies één keer naar de volgende modelbeurt moet brengen. OpenClaw verwerkt
in de wachtrij geplaatste injecties vóór prompt-hooks, verwijdert verlopen
injecties en dedupliceert per plugin op `idempotencyKey`. Dit is de juiste
naad voor hervattingen na goedkeuring, beleidssamenvattingen, delta's van
achtergrondmonitors en opdrachtvervolgen die bij de volgende beurt zichtbaar
moeten zijn voor het model, maar geen permanente systeemprompttekst mogen
worden.

Opschoningssemantiek maakt deel uit van het contract. Opschoning van
sessie-extensies en runtime-lifecycle-opruimcallbacks ontvangen `reset`,
`delete`, `disable` of `restart`. De host verwijdert de persistente
sessie-extensiestatus en wachtende next-turn-injecties van de eigenaar-plugin
voor reset/delete/disable; restart behoudt duurzame sessiestatus terwijl
opruimcallbacks plugins scheduler-taken, run-context en andere out-of-band
resources voor de oude runtime-generatie laten vrijgeven.

## Berichthooks

Gebruik berichthooks voor routering en bezorgbeleid op kanaalniveau:

- `message_received`: observeer inkomende content, afzender, `threadId`, `messageId`,
  `senderId`, optionele run-/sessiecorrelatie en metadata.
- `message_sending`: herschrijf `content` of retourneer `{ cancel: true }`.
- `message_sent`: observeer definitief succes of definitieve mislukking.

Voor audio-only TTS-antwoorden kan `content` het verborgen uitgesproken
transcript bevatten, zelfs wanneer de kanaalpayload geen zichtbare tekst of
caption heeft. Het herschrijven van die `content` werkt alleen het voor hooks
zichtbare transcript bij; het wordt niet weergegeven als mediacaption.

Berichthookcontexten stellen stabiele correlatievelden beschikbaar wanneer
beschikbaar: `ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`,
`ctx.trace`, `ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` en `ctx.callDepth`.
Geef de voorkeur aan deze eersteklas velden voordat je legacy-metadata leest.

Geef de voorkeur aan getypeerde velden `threadId` en `replyToId` voordat je
kanaalspecifieke metadata gebruikt.

Beslisregels:

- `message_sending` met `cancel: true` is terminaal.
- `message_sending` met `cancel: false` wordt behandeld als geen beslissing.
- Herschreven `content` gaat door naar hooks met lagere prioriteit, tenzij een
  latere hook de bezorging annuleert.

## Installatiehooks

`before_install` wordt uitgevoerd na de ingebouwde scan voor Skills- en
plugininstallaties. Retourneer aanvullende bevindingen of `{ block: true, blockReason }`
om de installatie te stoppen.

`block: true` is terminaal. `block: false` wordt behandeld als geen beslissing.

## Gateway-lifecycle

Gebruik `gateway_start` voor pluginservices die door Gateway beheerde status
nodig hebben. De context stelt `ctx.config`, `ctx.workspaceDir` en
`ctx.getCron?.()` beschikbaar voor inspectie en updates van cron. Gebruik
`gateway_stop` om langlopende resources op te ruimen.

Vertrouw niet op de interne hook `gateway:startup` voor plugin-eigen
runtimeservices.

`cron_changed` wordt geactiveerd voor door Gateway beheerde cron-lifecycle-events
met een getypeerde eventpayload die de redenen `added`, `updated`, `removed`,
`started`, `finished` en `scheduled` dekt. Het event bevat een
`PluginHookGatewayCronJob`-snapshot (inclusief `state.nextRunAtMs`,
`state.lastRunStatus` en `state.lastError` wanneer aanwezig) plus een
`PluginHookGatewayCronDeliveryStatus` van `not-requested` | `delivered` |
`not-delivered` | `unknown`. Verwijderde events bevatten nog steeds de
snapshot van de verwijderde taak, zodat externe schedulers status kunnen
reconciliëren. Gebruik `ctx.getCron?.()` en `ctx.config` uit de runtimecontext
bij het synchroniseren van externe wake-schedulers, en houd OpenClaw als de
bron van waarheid voor due-controles en uitvoering.

## Aankomende deprecaties

Enkele hook-aangrenzende oppervlakken zijn deprecated maar worden nog steeds
ondersteund. Migreer vóór de volgende major release:

- **Plaintext-kanaalenveloppen** in handlers voor `inbound_claim` en `message_received`.
  Lees `BodyForAgent` en de gestructureerde gebruikerscontextblokken
  in plaats van platte enveloptekst te parsen. Zie
  [Plaintext-kanaalenveloppen → BodyForAgent](/nl/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** blijft bestaan voor compatibiliteit. Nieuwe plugins moeten
  `before_model_resolve` en `before_prompt_build` gebruiken in plaats van de
  gecombineerde fase.
- **`onResolution` in `before_tool_call`** gebruikt nu de getypeerde
  union `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) in plaats van een vrij vormgegeven `string`.

Voor de volledige lijst - registratie van geheugencapabilities, thinking-profiel
van providers, externe auth-providers, discovery-types voor providers, accessors
voor taakruntime en de hernoeming van `command-auth` → `command-status` - zie
[Plugin SDK-migratie → Actieve deprecaties](/nl/plugins/sdk-migration#active-deprecations).

## Gerelateerd

- [Plugin SDK-migratie](/nl/plugins/sdk-migration) - actieve deprecaties en verwijderingstijdlijn
- [Plugins bouwen](/nl/plugins/building-plugins)
- [Plugin SDK-overzicht](/nl/plugins/sdk-overview)
- [Plugin-entrypoints](/nl/plugins/sdk-entrypoints)
- [Interne hooks](/nl/automation/hooks)
- [Interne pluginarchitectuur](/nl/plugins/architecture-internals)
