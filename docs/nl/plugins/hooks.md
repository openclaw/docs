---
read_when:
    - Je bouwt een Plugin die before_tool_call, before_agent_reply, bericht-hooks of levenscyclus-hooks nodig heeft
    - Je moet toolaanroepen van een Plugin blokkeren, herschrijven of daarvoor goedkeuring vereisen.
    - Je kiest tussen interne hooks en Plugin-hooks
summary: 'Plugin-hooks: onderschep levenscyclusgebeurtenissen van agent, tool, bericht, sessie en Gateway'
title: Plugin-haken
x-i18n:
    generated_at: "2026-05-06T17:58:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3741b95bcccdff4e24b4c1f05de54649b48a6c0a2ca1dc4376475eb1823ae185
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin-hooks zijn in-process uitbreidingspunten voor OpenClaw-plugins. Gebruik ze
wanneer een plugin agentuitvoeringen, toolaanroepen, berichtenstroom,
sessielevenscyclus, subagentroutering, installaties of Gateway-opstart moet
inspecteren of wijzigen.

Gebruik in plaats daarvan [interne hooks](/nl/automation/hooks) wanneer je een klein
door de operator geinstalleerd `HOOK.md`-script wilt voor opdracht- en Gateway-gebeurtenissen zoals
`/new`, `/reset`, `/stop`, `agent:bootstrap` of `gateway:startup`.

## Snelstart

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

- `priority` - volgorde van handlers (hoger wordt eerst uitgevoerd).
- `timeoutMs` - optioneel budget per hook. Wanneer dit is ingesteld, breekt de hook-runner die
  handler af nadat het budget is verstreken en gaat door met de volgende, in plaats van
  trage setup- of recall-taken de door de aanroeper geconfigureerde model-time-out te laten
  verbruiken. Laat dit weg om de standaard time-out voor observatie/beslissing te gebruiken die de
  hook-runner generiek toepast.

Operators kunnen ook hook-budgetten instellen zonder plugin-code te patchen:

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
plugin-auteur ingestelde `api.on(..., { timeoutMs })`-waarde overschrijft. Elke geconfigureerde waarde moet
een positief geheel getal zijn van niet meer dan 600000 milliseconden. Geef de voorkeur aan overrides per hook
voor bekende trage hooks, zodat een plugin niet overal een langer budget krijgt.

Elke hook ontvangt `event.context.pluginConfig`, de opgeloste configuratie voor de
plugin die die handler heeft geregistreerd. Gebruik dit voor hook-beslissingen waarvoor
huidige plugin-opties nodig zijn; OpenClaw injecteert dit per handler zonder het
gedeelde event-object te muteren dat andere plugins zien.

## Hookcatalogus

Hooks zijn gegroepeerd op het oppervlak dat ze uitbreiden. Namen in **vet** accepteren een
beslissingsresultaat (blokkeren, annuleren, overschrijven of goedkeuring vereisen); alle andere zijn
alleen voor observatie.

**Agentbeurt**

- `before_model_resolve` - overschrijf provider of model voordat sessieberichten worden geladen
- `agent_turn_prepare` - verwerk in de wachtrij geplaatste plugin-beurtinjecties en voeg context voor dezelfde beurt toe voor prompt-hooks
- `before_prompt_build` - voeg dynamische context of systeemprompttekst toe voor de modelaanroep
- `before_agent_start` - alleen gecombineerde fase voor compatibiliteit; geef de voorkeur aan de twee hooks hierboven
- **`before_agent_run`** - inspecteer de definitieve prompt en sessieberichten voor modelinzending en blokkeer eventueel de uitvoering
- **`before_agent_reply`** - onderbreek de modelbeurt met een synthetisch antwoord of stilte
- **`before_agent_finalize`** - inspecteer het natuurlijke definitieve antwoord en vraag nog een modelpass aan
- `agent_end` - observeer definitieve berichten, successtatus en uitvoeringsduur
- `heartbeat_prompt_contribution` - voeg alleen-Heartbeat-context toe voor achtergrondmonitor- en levenscyclusplugins

**Conversatieobservatie**

- `model_call_started` / `model_call_ended` - observeer opgeschoonde metadata, timing, uitkomst en begrensde request-id-hashes van provider-/modelaanroepen zonder prompt- of responsinhoud
- `llm_input` - observeer providerinvoer (systeemprompt, prompt, geschiedenis)
- `llm_output` - observeer provideruitvoer

**Tools**

- **`before_tool_call`** - herschrijf toolparameters, blokkeer uitvoering of vereis goedkeuring
- `after_tool_call` - observeer toolresultaten, fouten en duur
- **`tool_result_persist`** - herschrijf het assistentbericht dat uit een toolresultaat is geproduceerd
- **`before_message_write`** - inspecteer of blokkeer een berichtschrijfactie die bezig is (zeldzaam)

**Berichten en aflevering**

- **`inbound_claim`** - claim een inkomend bericht voor agentroutering (synthetische antwoorden)
- `message_received` - observeer inkomende inhoud, afzender, thread en metadata
- **`message_sending`** - herschrijf uitgaande inhoud of annuleer aflevering
- `message_sent` - observeer succes of mislukking van uitgaande aflevering
- **`before_dispatch`** - inspecteer of herschrijf een uitgaande dispatch voor kanaaloverdracht
- **`reply_dispatch`** - neem deel aan de definitieve reply-dispatch-pijplijn

**Sessies en Compaction**

- `session_start` / `session_end` - volg grenzen van de sessielevenscyclus
- `before_compaction` / `after_compaction` - observeer of annoteer Compaction-cycli
- `before_reset` - observeer sessie-resetgebeurtenissen (`/reset`, programmatische resets)

**Subagents**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - coordineer subagentroutering en aflevering na voltooiing

**Levenscyclus**

- `gateway_start` / `gateway_stop` - start of stop door plugins beheerde services met de Gateway
- `cron_changed` - observeer door de Gateway beheerde Cron-levenscycluswijzigingen (toegevoegd, bijgewerkt, verwijderd, gestart, voltooid, gepland)
- **`before_install`** - inspecteer Skill- of plugin-installatiescans en blokkeer eventueel

## Beleid voor toolaanroepen

`before_tool_call` ontvangt:

- `event.toolName`
- `event.params`
- optioneel `event.runId`
- optioneel `event.toolCallId`
- contextvelden zoals `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (ingesteld bij door Cron aangestuurde uitvoeringen) en diagnostische `ctx.trace`

Het kan dit retourneren:

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
- `requireApproval` pauzeert de agentuitvoering en vraagt de gebruiker via plugin-goedkeuringen.
  De opdracht `/approve` kan zowel exec- als plugin-goedkeuringen goedkeuren.
- Een `block: true` met lagere prioriteit kan nog steeds blokkeren nadat een hook met hogere prioriteit
  goedkeuring heeft aangevraagd.
- `onResolution` ontvangt de opgeloste goedkeuringsbeslissing - `allow-once`,
  `allow-always`, `deny`, `timeout` of `cancelled`.

Gebundelde plugins die beleid op hostniveau nodig hebben, kunnen vertrouwd toolbeleid registreren
met `api.registerTrustedToolPolicy(...)`. Deze worden uitgevoerd voor gewone
`before_tool_call`-hooks en voor externe plugin-beslissingen. Gebruik ze alleen
voor door de host vertrouwde poorten, zoals workspacebeleid, budgethandhaving of
veiligheid van gereserveerde workflows. Externe plugins moeten normale `before_tool_call`-hooks
gebruiken.

### Persistentie van toolresultaten

Toolresultaten kunnen gestructureerde `details` bevatten voor UI-rendering, diagnostiek,
mediaroutering of door plugins beheerde metadata. Behandel `details` als runtime-metadata,
niet als promptinhoud:

- OpenClaw verwijdert `toolResult.details` voor provider-replay en Compaction-invoer,
  zodat metadata geen modelcontext wordt.
- Gepersisteerde sessie-items behouden alleen begrensde `details`. Te grote details worden
  vervangen door een compacte samenvatting en `persistedDetailsTruncated: true`.
- `tool_result_persist` en `before_message_write` worden uitgevoerd voor de definitieve
  persistentielimiet. Hooks moeten geretourneerde `details` nog steeds klein houden en vermijden
  om promptrelevante tekst alleen in `details` te plaatsen; zet modelzichtbare tooluitvoer
  in `content`.

## Prompt- en modelhooks

Gebruik de fasespecifieke hooks voor nieuwe plugins:

- `before_model_resolve`: ontvangt alleen de huidige prompt en bijlagemetadata.
  Retourneer `providerOverride` of `modelOverride`.
- `agent_turn_prepare`: ontvangt de huidige prompt, voorbereide sessieberichten
  en eventuele exact-eenmalige wachtrij-injecties die voor deze sessie zijn geleegd. Retourneer
  `prependContext` of `appendContext`.
- `before_prompt_build`: ontvangt de huidige prompt en sessieberichten.
  Retourneer `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` of `appendSystemContext`.
- `heartbeat_prompt_contribution`: wordt alleen uitgevoerd voor Heartbeat-beurten en retourneert
  `prependContext` of `appendContext`. Het is bedoeld voor achtergrondmonitors
  die de huidige status moeten samenvatten zonder door gebruikers geinitieerde beurten te wijzigen.

`before_agent_start` blijft bestaan voor compatibiliteit. Geef de voorkeur aan de expliciete hooks hierboven,
zodat je plugin niet afhankelijk is van een verouderde gecombineerde fase.

`before_agent_run` wordt uitgevoerd na promptconstructie en voor enige modelinvoer,
inclusief prompt-lokaal laden van afbeeldingen en `llm_input`-observatie. Het ontvangt
de huidige gebruikersinvoer als `prompt`, plus geladen sessiegeschiedenis in `messages`
en de actieve systeemprompt. Retourneer `{ outcome: "block", reason, message? }`
om de uitvoering te stoppen voordat het model de prompt kan lezen. `reason` is intern;
`message` is de gebruikersgerichte vervanging. De enige ondersteunde uitkomsten zijn
`pass` en `block`; niet-ondersteunde beslissingsvormen falen gesloten.

Wanneer een uitvoering wordt geblokkeerd, slaat OpenClaw alleen de vervangende tekst op in
`message.content` plus niet-gevoelige blokkeermetadata, zoals de id van de blokkerende plugin
en tijdstempel. De oorspronkelijke gebruikerstekst wordt niet bewaard in transcript of toekomstige
context. Interne blokkeerredenen worden als gevoelig behandeld en uitgesloten van
transcript-, geschiedenis-, broadcast-, log- en diagnostische payloads. Observability
moet opgeschoonde velden gebruiken, zoals blocker-id, uitkomst, tijdstempel of een veilige
categorie.

`before_agent_start` en `agent_end` bevatten `event.runId` wanneer OpenClaw
de actieve uitvoering kan identificeren. Dezelfde waarde is ook beschikbaar op `ctx.runId`.
Door Cron aangestuurde uitvoeringen geven ook `ctx.jobId` (de id van de oorspronkelijke Cron-job) vrij, zodat
plugin-hooks statistieken, side effects of status kunnen beperken tot een specifieke geplande
job.

Voor uit kanalen afkomstige uitvoeringen is `ctx.messageProvider` het provideroppervlak, zoals
`discord` of `telegram`, terwijl `ctx.channelId` de doelidentifier van de conversatie is
wanneer OpenClaw die uit de sessiesleutel of aflevermetadata kan afleiden.

`agent_end` is een observatiehook en wordt fire-and-forget uitgevoerd na de beurt. De
hook-runner past een time-out van 30 seconden toe, zodat een vastgelopen plugin of embedding-
endpoint de hook-promise niet voor altijd pending kan laten. Een time-out wordt gelogd en
OpenClaw gaat door; dit annuleert door plugins beheerd netwerkwerk niet, tenzij de
plugin ook zijn eigen abort-signaal gebruikt.

Gebruik `model_call_started` en `model_call_ended` voor provider-call-telemetrie
die geen ruwe prompts, geschiedenis, antwoorden, headers, request bodies
of provider-request-ID's mag ontvangen. Deze hooks bevatten stabiele metadata zoals
`runId`, `callId`, `provider`, `model`, optioneel `api`/`transport`, terminale
`durationMs`/`outcome` en `upstreamRequestIdHash` wanneer OpenClaw een
begrensde provider-request-id-hash kan afleiden.

`before_agent_finalize` wordt alleen uitgevoerd wanneer een harness op het punt staat een natuurlijk
definitief assistentantwoord te accepteren. Het is niet het `/stop`-annuleringspad en wordt niet
uitgevoerd wanneer de gebruiker een beurt afbreekt. Retourneer `{ action: "revise", reason }` om
de harness om nog een modelpass te vragen voor finalisatie, `{ action:
"finalize", reason? }` om finalisatie af te dwingen, of laat een resultaat weg om door te gaan.
Native Codex-`Stop`-hooks worden naar deze hook doorgestuurd als OpenClaw-
`before_agent_finalize`-beslissingen.

Bij het retourneren van `action: "revise"` kunnen plugins `retry`-metadata opnemen om
de extra modelpass begrensd en replay-veilig te maken:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` wordt toegevoegd aan de revisiereden die naar het testharnas wordt gestuurd.
Met `idempotencyKey` kan de host retries tellen voor hetzelfde plugin-verzoek over
equivalente finalize-beslissingen heen, en `maxAttempts` begrenst hoeveel extra passes de
host toestaat voordat wordt doorgegaan met het natuurlijke definitieve antwoord.

Niet-gebundelde plugins die raw gesprekshooks nodig hebben (`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end`, of `before_agent_run`) moeten instellen:

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

Hooks die prompts wijzigen en duurzame injecties voor de volgende turn kunnen per plugin
worden uitgeschakeld met `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Sessie-uitbreidingen en injecties voor de volgende turn

Workflow-plugins kunnen kleine JSON-compatibele sessiestatus bewaren met
`api.registerSessionExtension(...)` en deze bijwerken via de Gateway-methode
`sessions.pluginPatch`. Sessierijen projecteren geregistreerde uitbreidingsstatus
via `pluginExtensions`, zodat Control UI en andere clients
plugin-eigen status kunnen renderen zonder plugin-internals te leren kennen.

Gebruik `api.enqueueNextTurnInjection(...)` wanneer een plugin duurzame context
precies één keer naar de volgende model-turn moet laten gaan. OpenClaw verwerkt
injecties in de wachtrij vóór prompt-hooks, verwijdert verlopen injecties en
dedupliceert per plugin op `idempotencyKey`. Dit is het juiste aansluitpunt voor
hervattingen van goedkeuringen, beleidssamenvattingen, delta's van achtergrondmonitors
en opdrachtvervolgen die bij de volgende turn zichtbaar moeten zijn voor het
model, maar geen permanente systeem-prompttekst mogen worden.

Opschoningssemantiek maakt deel uit van het contract. Opschoning van
sessie-uitbreidingen en callbacks voor runtime-levenscyclusopschoning ontvangen
`reset`, `delete`, `disable` of `restart`. De host verwijdert de permanente
sessie-uitbreidingsstatus van de eigenaar-plugin en wachtende injecties voor de
volgende turn bij reset/delete/disable; restart behoudt duurzame sessiestatus,
terwijl opschoningscallbacks plugins scheduler-taken, run-context en andere
out-of-band resources voor de oude runtime-generatie laten vrijgeven.

## Berichthooks

Gebruik berichthooks voor routering op kanaalniveau en afleveringsbeleid:

- `message_received`: observeer inkomende content, afzender, `threadId`, `messageId`,
  `senderId`, optionele run-/sessiecorrelatie en metadata.
- `message_sending`: herschrijf `content` of retourneer `{ cancel: true }`.
- `message_sent`: observeer uiteindelijke successen of fouten.

Voor audio-only TTS-antwoorden kan `content` het verborgen uitgesproken transcript
bevatten, zelfs wanneer de kanaalpayload geen zichtbare tekst/bijschrift heeft. Het
herschrijven van die `content` werkt alleen het voor hooks zichtbare transcript bij;
het wordt niet gerenderd als mediabijschrift.

Berichthook-contexten tonen stabiele correlatievelden wanneer beschikbaar:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` en `ctx.callDepth`. Geef de voorkeur
aan deze eersteklas velden voordat je legacy-metadata leest.

Geef de voorkeur aan getypte `threadId`- en `replyToId`-velden voordat je
kanaalspecifieke metadata gebruikt.

Beslissingsregels:

- `message_sending` met `cancel: true` is terminaal.
- `message_sending` met `cancel: false` wordt behandeld als geen beslissing.
- Herschreven `content` gaat door naar hooks met lagere prioriteit, tenzij een
  latere hook aflevering annuleert.

## Installatiehooks

`before_install` draait na de ingebouwde scan voor installatie van Skills en plugins.
Retourneer aanvullende bevindingen of `{ block: true, blockReason }` om de
installatie te stoppen.

`block: true` is terminaal. `block: false` wordt behandeld als geen beslissing.

## Gateway-levenscyclus

Gebruik `gateway_start` voor plugin-services die Gateway-eigen status nodig hebben. De
context toont `ctx.config`, `ctx.workspaceDir` en `ctx.getCron?.()` voor
Cron-inspectie en -updates. Gebruik `gateway_stop` om langlopende resources op te
schonen.

Vertrouw niet op de interne `gateway:startup`-hook voor plugin-eigen runtime-services.

`cron_changed` wordt geactiveerd voor Gateway-eigen Cron-levenscyclusgebeurtenissen met
een getypte event-payload voor de redenen `added`, `updated`, `removed`, `started`,
`finished` en `scheduled`. Het event bevat een `PluginHookGatewayCronJob`-snapshot
(inclusief `state.nextRunAtMs`, `state.lastRunStatus` en `state.lastError` wanneer
aanwezig) plus een `PluginHookGatewayCronDeliveryStatus` van `not-requested` |
`delivered` | `not-delivered` | `unknown`. Verwijderde events bevatten nog steeds
de verwijderde jobsnapshot zodat externe schedulers status kunnen reconciliëren.
Gebruik `ctx.getCron?.()` en `ctx.config` uit de runtime-context bij het synchroniseren
van externe wake-schedulers, en houd OpenClaw als bron van waarheid voor
vervalcontroles en uitvoering.

## Aankomende deprecaties

Een paar hook-aangrenzende oppervlakken zijn deprecated maar worden nog steeds
ondersteund. Migreer vóór de volgende major release:

- **Plaintext-kanaalenveloppen** in `inbound_claim`- en `message_received`-handlers.
  Lees `BodyForAgent` en de gestructureerde gebruikerscontextblokken in plaats van
  platte enveloptekst te parsen. Zie
  [Plaintext-kanaalenveloppen → BodyForAgent](/nl/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** blijft voor compatibiliteit. Nieuwe plugins moeten
  `before_model_resolve` en `before_prompt_build` gebruiken in plaats van de
  gecombineerde fase.
- **`onResolution` in `before_tool_call`** gebruikt nu de getypte
  `PluginApprovalResolution`-union (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) in plaats van een vrije-vorm `string`.

Voor de volledige lijst - registratie van memory-capabilities, provider-thinkingprofiel,
externe auth-providers, typen voor provider-discovery, toegangsmethoden voor task-runtime
en de hernoeming `command-auth` → `command-status` - zie
[Plugin SDK-migratie → Actieve deprecaties](/nl/plugins/sdk-migration#active-deprecations).

## Gerelateerd

- [Plugin SDK-migratie](/nl/plugins/sdk-migration) - actieve deprecaties en verwijderingstijdlijn
- [Plugins bouwen](/nl/plugins/building-plugins)
- [Plugin SDK-overzicht](/nl/plugins/sdk-overview)
- [Plugin-entrypoints](/nl/plugins/sdk-entrypoints)
- [Interne hooks](/nl/automation/hooks)
- [Interne plugin-architectuur](/nl/plugins/architecture-internals)
