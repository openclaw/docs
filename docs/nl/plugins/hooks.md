---
read_when:
    - Je bouwt een Plugin die before_tool_call, before_agent_reply, berichthooks of levenscyclus-hooks nodig heeft
    - Je moet toolaanroepen van een Plugin blokkeren, herschrijven of er goedkeuring voor vereisen
    - Je kiest tussen interne hooks en Plugin-hooks
summary: 'Plugin-haakpunten: onderschep agent-, tool-, bericht-, sessie- en Gateway-levenscyclusgebeurtenissen'
title: Plugin-haakpunten
x-i18n:
    generated_at: "2026-05-04T18:24:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37c7273036463c87e478db5678822b676c89447caee65f2f3f47a45194d1e37b
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin-hooks zijn in-process extensiepunten voor OpenClaw-plugins. Gebruik ze
wanneer een plugin agent-runs, toolaanroepen, berichtstroom, sessielevenscyclus,
subagent-routering, installaties of het opstarten van de Gateway moet inspecteren
of wijzigen.

Gebruik in plaats daarvan [interne hooks](/nl/automation/hooks) wanneer je een klein,
door de operator geïnstalleerd `HOOK.md`-script wilt voor command- en Gateway-events
zoals `/new`, `/reset`, `/stop`, `agent:bootstrap` of `gateway:startup`.

## Snel starten

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

- `priority` — volgorde van handlers (hoger wordt eerst uitgevoerd).
- `timeoutMs` — optioneel budget per hook. Wanneer dit is ingesteld, breekt de hook-runner die
  handler af nadat het budget is verstreken en gaat verder met de volgende, in plaats van
  trage setup- of recall-werkzaamheden de door de aanroeper geconfigureerde model-time-out te laten
  verbruiken. Laat dit weg om de standaardtime-out voor observatie/beslissing te gebruiken die de
  hook-runner generiek toepast.

Operators kunnen hook-budgetten ook instellen zonder plugincode te patchen:

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

`hooks.timeouts.<hookName>` overschrijft `hooks.timeoutMs`, wat de door de plugin
geschreven `api.on(..., { timeoutMs })`-waarde overschrijft. Elke geconfigureerde waarde moet
een positief geheel getal zijn van maximaal 600000 milliseconden. Geef de voorkeur aan overschrijvingen
per hook voor bekende trage hooks, zodat één plugin niet overal een langer budget krijgt.

Elke hook ontvangt `event.context.pluginConfig`, de opgeloste configuratie voor de
plugin die die handler heeft geregistreerd. Gebruik dit voor hook-beslissingen die
huidige pluginopties nodig hebben; OpenClaw injecteert dit per handler zonder het
gedeelde eventobject te muteren dat andere plugins zien.

## Hook-catalogus

Hooks zijn gegroepeerd op het oppervlak dat ze uitbreiden. Namen in **vet** accepteren een
beslissingsresultaat (blokkeren, annuleren, overschrijven of goedkeuring vereisen); alle andere zijn
alleen voor observatie.

**Agentbeurt**

- `before_model_resolve` — overschrijf provider of model voordat sessieberichten worden geladen
- `agent_turn_prepare` — verwerk in de wachtrij geplaatste plugin-turninjecties en voeg context voor dezelfde beurt toe vóór prompt-hooks
- `before_prompt_build` — voeg dynamische context of systeemprompttekst toe vóór de modelaanroep
- `before_agent_start` — gecombineerde fase alleen voor compatibiliteit; geef de voorkeur aan de twee hooks hierboven
- **`before_agent_reply`** — kortsluit de modelbeurt met een synthetisch antwoord of stilte
- **`before_agent_finalize`** — inspecteer het natuurlijke eindantwoord en vraag nog één modelpassage aan
- `agent_end` — observeer eindberichten, successtatus en run-duur
- `heartbeat_prompt_contribution` — voeg context toe die alleen voor Heartbeat geldt voor achtergrondmonitor- en levenscyclusplugins

**Gespreksobservatie**

- `model_call_started` / `model_call_ended` — observeer opgeschoonde provider-/modelaanroepmetadata, timing, uitkomst en begrensde request-id-hashes zonder prompt- of responsecontent
- `llm_input` — observeer providerinvoer (systeemprompt, prompt, geschiedenis)
- `llm_output` — observeer provideruitvoer

**Tools**

- **`before_tool_call`** — herschrijf toolparameters, blokkeer uitvoering of vereis goedkeuring
- `after_tool_call` — observeer toolresultaten, fouten en duur
- **`tool_result_persist`** — herschrijf het assistentbericht dat uit een toolresultaat wordt geproduceerd
- **`before_message_write`** — inspecteer of blokkeer een berichtschrijfactie die bezig is (zeldzaam)

**Berichten en levering**

- **`inbound_claim`** — claim een inkomend bericht vóór agent-routering (synthetische antwoorden)
- `message_received` — observeer inkomende content, afzender, thread en metadata
- **`message_sending`** — herschrijf uitgaande content of annuleer levering
- `message_sent` — observeer geslaagde of mislukte uitgaande levering
- **`before_dispatch`** — inspecteer of herschrijf een uitgaande dispatch vóór overdracht aan het kanaal
- **`reply_dispatch`** — neem deel aan de uiteindelijke reply-dispatch-pijplijn

**Sessies en Compaction**

- `session_start` / `session_end` — volg grenzen van de sessielevenscyclus
- `before_compaction` / `after_compaction` — observeer of annoteer Compaction-cycli
- `before_reset` — observeer sessie-reset-events (`/reset`, programmatische resets)

**Subagents**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — coördineer subagent-routering en levering van voltooiing

**Levenscyclus**

- `gateway_start` / `gateway_stop` — start of stop plugin-eigen services met de Gateway
- `cron_changed` — observeer gateway-eigen Cron-levenscycluswijzigingen (toegevoegd, bijgewerkt, verwijderd, gestart, voltooid, gepland)
- **`before_install`** — inspecteer skill- of plugininstallatiescans en blokkeer optioneel

## Beleid voor toolaanroepen

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
- `block: false` wordt behandeld alsof er geen beslissing is.
- `params` herschrijft de toolparameters voor uitvoering.
- `requireApproval` pauzeert de agent-run en vraagt de gebruiker om goedkeuring via plugin-
  approvals. Het `/approve`-command kan zowel exec- als plugin-approvals goedkeuren.
- Een `block: true` met lagere prioriteit kan nog steeds blokkeren nadat een hook met hogere prioriteit
  om goedkeuring heeft gevraagd.
- `onResolution` ontvangt de opgeloste goedkeuringsbeslissing — `allow-once`,
  `allow-always`, `deny`, `timeout` of `cancelled`.

Gebundelde plugins die hostniveau-beleid nodig hebben, kunnen vertrouwde toolbeleidregels
registreren met `api.registerTrustedToolPolicy(...)`. Deze worden uitgevoerd vóór gewone
`before_tool_call`-hooks en vóór beslissingen van externe plugins. Gebruik ze alleen
voor door de host vertrouwde poorten zoals werkruimtebeleid, budgethandhaving of
veiligheid van gereserveerde workflows. Externe plugins moeten normale `before_tool_call`-
hooks gebruiken.

### Persistentie van toolresultaten

Toolresultaten kunnen gestructureerde `details` bevatten voor UI-rendering, diagnostiek,
mediaroutering of plugin-eigen metadata. Behandel `details` als runtimemetadata,
niet als promptcontent:

- OpenClaw verwijdert `toolResult.details` vóór provider-replay en Compaction-
  invoer, zodat metadata geen modelcontext wordt.
- Gepersistente sessie-items bewaren alleen begrensde `details`. Te grote details worden
  vervangen door een compacte samenvatting en `persistedDetailsTruncated: true`.
- `tool_result_persist` en `before_message_write` worden uitgevoerd vóór de uiteindelijke
  persistentielimiet. Hooks moeten geretourneerde `details` nog steeds klein houden en vermijden
  promptrelevante tekst alleen in `details` te plaatsen; zet voor het model zichtbare tooluitvoer
  in `content`.

## Prompt- en modelhooks

Gebruik de fasespecifieke hooks voor nieuwe plugins:

- `before_model_resolve`: ontvangt alleen de huidige prompt en bijlagemetadata.
  Geef `providerOverride` of `modelOverride` terug.
- `agent_turn_prepare`: ontvangt de huidige prompt, voorbereide sessieberichten,
  en alle exact-één-keer in de wachtrij geplaatste injecties die voor deze sessie zijn leeggemaakt. Geef
  `prependContext` of `appendContext` terug.
- `before_prompt_build`: ontvangt de huidige prompt en sessieberichten.
  Geef `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` of `appendSystemContext` terug.
- `heartbeat_prompt_contribution`: wordt alleen uitgevoerd voor Heartbeat-beurten en geeft
  `prependContext` of `appendContext` terug. Het is bedoeld voor achtergrondmonitors
  die de huidige status moeten samenvatten zonder door gebruikers geïnitieerde beurten te wijzigen.

`before_agent_start` blijft bestaan voor compatibiliteit. Geef de voorkeur aan de expliciete hooks hierboven,
zodat je plugin niet afhankelijk is van een legacy gecombineerde fase.

`before_agent_start` en `agent_end` bevatten `event.runId` wanneer OpenClaw
de actieve run kan identificeren. Dezelfde waarde is ook beschikbaar op `ctx.runId`.
Cron-gestuurde runs stellen ook `ctx.jobId` beschikbaar (de id van de oorspronkelijke cronjob), zodat
plugin-hooks metrics, neveneffecten of status kunnen beperken tot een specifieke geplande
job.

Voor runs die uit een kanaal afkomstig zijn, is `ctx.messageProvider` het provideroppervlak zoals
`discord` of `telegram`, terwijl `ctx.channelId` de doelidentifier van het gesprek is
wanneer OpenClaw er een kan afleiden uit de sessiesleutel of leveringsmetadata.

`agent_end` is een observatiehook en wordt fire-and-forget uitgevoerd na de beurt. De
hook-runner past een time-out van 30 seconden toe, zodat een vastgelopen plugin of embedding-
endpoint de hook-belofte niet voor altijd in behandeling kan laten. Een time-out wordt gelogd en
OpenClaw gaat door; dit annuleert plugin-eigen netwerkwerk niet, tenzij de
plugin ook zijn eigen abortsignal gebruikt.

Gebruik `model_call_started` en `model_call_ended` voor provider-calltelemetrie
die geen ruwe prompts, geschiedenis, responses, headers, request
bodies of provider-request-ID's mag ontvangen. Deze hooks bevatten stabiele metadata zoals
`runId`, `callId`, `provider`, `model`, optionele `api`/`transport`, terminale
`durationMs`/`outcome`, en `upstreamRequestIdHash` wanneer OpenClaw een
begrensde provider-request-id-hash kan afleiden.

`before_agent_finalize` wordt alleen uitgevoerd wanneer een harness op het punt staat een natuurlijk
eindantwoord van de assistent te accepteren. Het is niet het `/stop`-annuleringspad en wordt niet
uitgevoerd wanneer de gebruiker een beurt afbreekt. Geef `{ action: "revise", reason }` terug om
de harness om nog één modelpassage vóór finalisatie te vragen, `{ action:
"finalize", reason? }` om finalisatie af te dwingen, of laat een resultaat weg om door te gaan.
Native Codex `Stop`-hooks worden naar deze hook doorgegeven als OpenClaw-
`before_agent_finalize`-beslissingen.

Wanneer `action: "revise"` wordt teruggegeven, kunnen plugins `retry`-metadata opnemen om
de extra modelpassage begrensd en veilig voor replay te maken:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` wordt toegevoegd aan de revisiereden die naar de harness wordt gestuurd.
Met `idempotencyKey` kan de host retries tellen voor hetzelfde pluginverzoek over
equivalente finalisatiebeslissingen, en `maxAttempts` begrenst hoeveel extra passages de
host toestaat voordat wordt doorgegaan met het natuurlijke eindantwoord.

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
`sessions.pluginPatch`. Sessierijen projecteren geregistreerde uitbreidingsstatus
via `pluginExtensions`, zodat Control UI en andere clients door plugins beheerde
status kunnen weergeven zonder plugin-internals te hoeven kennen.

Gebruik `api.enqueueNextTurnInjection(...)` wanneer een plugin duurzame context
precies eenmaal naar de volgende modelbeurt moet laten doorstromen. OpenClaw
verwerkt in de wachtrij geplaatste injecties vóór prompt-hooks, verwijdert
verlopen injecties en dedupliceert per plugin op basis van `idempotencyKey`.
Dit is de juiste scheiding voor goedkeuringshervattingen, beleidssamenvattingen,
delta's van achtergrondmonitors en opdrachtvoortzettingen die bij de volgende
beurt zichtbaar moeten zijn voor het model, maar geen permanente
systeemprompttekst mogen worden.

Opschoningssemantiek maakt deel uit van het contract. Opschoning van
sessie-uitbreidingen en callbacks voor runtime-levenscyclusopschoning ontvangen
`reset`, `delete`, `disable` of `restart`. De host verwijdert de persistente
sessie-uitbreidingsstatus en openstaande next-turn-injecties van de eigenaar-plugin
voor reset/delete/disable; restart behoudt duurzame sessiestatus terwijl
opschoningscallbacks plugins scheduler-taken, run-context en andere
out-of-band resources voor de oude runtime-generatie laten vrijgeven.

## Bericht-hooks

Gebruik bericht-hooks voor routing en leveringsbeleid op kanaalniveau:

- `message_received`: observeer inkomende content, afzender, `threadId`, `messageId`,
  `senderId`, optionele run-/sessiecorrelatie en metadata.
- `message_sending`: herschrijf `content` of retourneer `{ cancel: true }`.
- `message_sent`: observeer definitief succes of falen.

Voor audio-only TTS-antwoorden kan `content` het verborgen uitgesproken transcript
bevatten, zelfs wanneer de kanaalpayload geen zichtbare tekst/ondertitel heeft.
Het herschrijven van die `content` werkt alleen het voor hooks zichtbare transcript
bij; het wordt niet weergegeven als media-ondertitel.

Bericht-hookcontexten stellen stabiele correlatievelden beschikbaar wanneer die
beschikbaar zijn: `ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`,
`ctx.trace`, `ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` en `ctx.callDepth`.
Geef de voorkeur aan deze first-class velden voordat je legacy-metadata leest.

Geef de voorkeur aan getypeerde velden `threadId` en `replyToId` voordat je
kanaalspecifieke metadata gebruikt.

Beslisregels:

- `message_sending` met `cancel: true` is terminaal.
- `message_sending` met `cancel: false` wordt behandeld als geen beslissing.
- Herschreven `content` gaat door naar hooks met lagere prioriteit, tenzij een latere hook
  de levering annuleert.

## Installatie-hooks

`before_install` wordt uitgevoerd na de ingebouwde scan voor Skill- en plugin-installaties.
Retourneer aanvullende bevindingen of `{ block: true, blockReason }` om de
installatie te stoppen.

`block: true` is terminaal. `block: false` wordt behandeld als geen beslissing.

## Gateway-levenscyclus

Gebruik `gateway_start` voor plugin-services die door de Gateway beheerde status nodig hebben. De
context stelt `ctx.config`, `ctx.workspaceDir` en `ctx.getCron?.()` beschikbaar voor
cron-inspectie en updates. Gebruik `gateway_stop` om langlopende
resources op te schonen.

Vertrouw niet op de interne `gateway:startup`-hook voor door plugins beheerde runtime-services.

`cron_changed` wordt geactiveerd voor gateway-owned cron-levenscyclusevents met een getypeerde
eventpayload voor de redenen `added`, `updated`, `removed`, `started`, `finished`
en `scheduled`. Het event bevat een `PluginHookGatewayCronJob`-snapshot
(inclusief `state.nextRunAtMs`, `state.lastRunStatus` en
`state.lastError` wanneer aanwezig) plus een `PluginHookGatewayCronDeliveryStatus`
van `not-requested` | `delivered` | `not-delivered` | `unknown`. Verwijderde
events bevatten nog steeds de snapshot van de verwijderde taak, zodat externe schedulers
status kunnen reconciliëren. Gebruik `ctx.getCron?.()` en `ctx.config` uit de runtime-
context bij het synchroniseren van externe wake-schedulers, en houd OpenClaw als de
bron van waarheid voor due-controles en uitvoering.

## Aankomende deprecaties

Een paar hook-aangrenzende oppervlakken zijn deprecated, maar worden nog steeds ondersteund. Migreer
vóór de volgende major release:

- **Plaintext-kanaalenveloppen** in `inbound_claim`- en `message_received`-
  handlers. Lees `BodyForAgent` en de gestructureerde user-context-blokken
  in plaats van platte enveloptekst te parsen. Zie
  [Plaintext-kanaalenveloppen → BodyForAgent](/nl/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** blijft bestaan voor compatibiliteit. Nieuwe plugins moeten
  `before_model_resolve` en `before_prompt_build` gebruiken in plaats van de gecombineerde
  fase.
- **`onResolution` in `before_tool_call`** gebruikt nu de getypeerde
  `PluginApprovalResolution`-union (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) in plaats van een free-form `string`.

Voor de volledige lijst — registratie van geheugencapaciteit, thinking-profiel
van providers, externe auth-providers, typen voor provider-discovery, accessors voor taakruntime
en de hernoeming `command-auth` → `command-status` — zie
[Plugin SDK-migratie → Actieve deprecaties](/nl/plugins/sdk-migration#active-deprecations).

## Gerelateerd

- [Plugin SDK-migratie](/nl/plugins/sdk-migration) — actieve deprecaties en verwijderingstijdlijn
- [Plugins bouwen](/nl/plugins/building-plugins)
- [Plugin SDK-overzicht](/nl/plugins/sdk-overview)
- [Plugin-entrypoints](/nl/plugins/sdk-entrypoints)
- [Interne hooks](/nl/automation/hooks)
- [Interne plugin-architectuur](/nl/plugins/architecture-internals)
