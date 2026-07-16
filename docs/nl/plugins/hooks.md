---
read_when:
    - Je bouwt een plugin die before_tool_call, before_agent_reply, message-hooks of lifecycle-hooks nodig heeft
    - Je moet toolaanroepen van een plugin blokkeren, herschrijven of goedkeuring ervoor vereisen
    - Je kiest tussen interne hooks en Plugin-hooks
    - Je projecteert OpenClaw Cron-wekacties naar een externe hostplanner
summary: 'Plugin-hooks: onderschep lifecyclegebeurtenissen van agents, tools, berichten, sessies en de Gateway'
title: Plugin-hooks
x-i18n:
    generated_at: "2026-07-16T16:12:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9e4e94220bca59b710b7b46c87bb889942c88b0d44f723e7133f271d34d9c929
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin-hooks zijn extensiepunten binnen het proces voor OpenClaw-plugins: inspecteer of
wijzig agentruns, toolaanroepen, berichtenstromen, de sessielevenscyclus, subagent-
routering, installaties of het opstarten van de Gateway.

Gebruik in plaats daarvan [interne hooks](/nl/automation/hooks) voor een klein, door de operator geïnstalleerd
`HOOK.md`-script dat reageert op opdracht- en Gateway-gebeurtenissen zoals `/new`,
`/reset`, `/stop`, `agent:bootstrap` of `gateway:startup`.

## Snel aan de slag

Registreer getypeerde hooks met `api.on(...)` vanuit het Plugin-ingangspunt:

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
            title: "Webzoekopdracht uitvoeren",
            description: `Zoekopdracht toestaan: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Handlers die beslissingen of wijzigingen kunnen retourneren, worden sequentieel uitgevoerd in
aflopende `priority`; handlers met dezelfde prioriteit behouden de registratievolgorde.
Handlers die alleen observeren, worden parallel uitgevoerd en fire-and-forget-observatie-
dispatches kunnen overlappen met latere gebeurtenissen. Gebruik prioriteit niet om
neveneffecten van observaties te ordenen.

`api.on(name, handler, opts?)` accepteert:

| Optie      | Effect                                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `priority`  | Volgorde; hoger wordt eerst uitgevoerd.                                                                                                                                                                      |
| `timeoutMs` | Wachttijdbudget per hook. Wanneer dit verloopt, stopt OpenClaw met wachten op die handler en gaat het verder. Dit annuleert de handler of de neveneffecten ervan niet. Laat weg om de standaardtime-out per hook van de runner te gebruiken. |

Operators kunnen hookbudgetten instellen zonder de Plugincode aan te passen:

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

`hooks.timeouts.<hookName>` overschrijft `hooks.timeoutMs`, dat op zijn beurt de
door de Plugin opgegeven waarde `api.on(..., { timeoutMs })` overschrijft. Elke waarde moet een
positief geheel getal van maximaal 600000 ms zijn. Geef de voorkeur aan overschrijvingen per hook voor bekende trage
hooks, zodat één Plugin niet overal een langer budget krijgt.

Een handlerbelofte waarvan de time-out is verstreken, blijft actief omdat hookcallbacks geen
annuleringssignaal ontvangen. De hookdispatch kan zijn Gateway-
toegang vrijgeven terwijl het werk van die Plugin nog wordt uitgevoerd. Plugins die
langdurig werk beheren, moeten hun eigen annulerings- en afsluitingslevenscyclus bieden.

Uitgaande wijzigingshooks `message_sending` en `reply_payload_sending` gebruiken een
standaardwaarde van 15 seconden per handler. Als bij een handler de time-out verstrijkt, registreert OpenClaw de Pluginfout
en gaat het verder met de meest recente payload, zodat de geserialiseerde afleveringsroute kan
worden afgerond. Stel een groter budget per hook in voor Plugins die bewust trager
werk uitvoeren vóór de aflevering.

Kanaalplugins die `createReplyDispatcher` gebruiken, kunnen eveneens een groter
positief budget per fase opgeven met `beforeDeliverOptions: { timeoutMs }`, of bij het
toevoegen van werk met `dispatcher.appendBeforeDeliver(handler, { timeoutMs })`.
Zonder een door de eigenaar opgegeven budget gebruiken die callbacks dezelfde standaardwaarde van 15 seconden,
zodat een vastgelopen callback de geserialiseerde afleveringsroute niet kan vasthouden.

Elke hook ontvangt `event.context.pluginConfig`, de opgeloste configuratie voor de
Plugin die die handler heeft geregistreerd. OpenClaw injecteert deze per handler zonder
het gedeelde gebeurtenisobject te wijzigen dat andere Plugins zien.

## Hookcatalogus

Hooks zijn gegroepeerd op basis van het oppervlak dat ze uitbreiden. **Vetgedrukte** namen accepteren een beslissings-
resultaat (blokkeren, annuleren, overschrijven of goedkeuring vereisen); de overige zijn
alleen voor observatie.

**Agentbeurt**

| Hook                            | Doel                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `before_model_resolve`          | Provider of model overschrijven voordat sessieberichten worden geladen                                  |
| `agent_turn_prepare`            | In de wachtrij geplaatste beurtinjecties van Plugins verwerken en context voor dezelfde beurt toevoegen vóór prompthooks      |
| `before_prompt_build`           | Dynamische context of systeemtekst voor de prompt toevoegen vóór de modelaanroep                          |
| `before_agent_start`            | Gecombineerde fase uitsluitend voor compatibiliteit; geef de voorkeur aan de twee bovenstaande hooks                            |
| **`before_agent_run`**          | De uiteindelijke prompt en sessieberichten vóór verzending naar het model inspecteren; kan de run blokkeren |
| **`before_agent_reply`**        | De modelbeurt kortsluiten met een synthetisch antwoord of stilte                           |
| **`before_agent_finalize`**     | Het natuurlijke definitieve antwoord inspecteren en nog één modelpassage aanvragen                         |
| `agent_end`                     | Definitieve berichten, successtatus en duur van de run observeren                                  |
| `heartbeat_prompt_contribution` | Alleen-Heartbeat-context toevoegen voor achtergrondbewakings- en levenscyclusplugins                  |

**Gespreksobservatie**

| Hook                                      | Doel                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `model_call_started` / `model_call_ended` | Opgeschoonde metadata van provider-/modelaanroepen: timing, resultaat en begrensde hashes van aanvraag-id's. Geen inhoud van prompts of antwoorden. |
| `llm_input`                               | Providerinvoer: systeemprompt, prompt, geschiedenis                                                                     |
| `llm_output`                              | Provideruitvoer, gebruik en de opgeloste `contextTokenBudget` indien beschikbaar                                       |

**Tools**

| Hook                       | Doel                                                   |
| -------------------------- | --------------------------------------------------------- |
| **`before_tool_call`**     | Toolparameters herschrijven, uitvoering blokkeren of goedkeuring vereisen |
| `after_tool_call`          | Toolresultaten, fouten en duur observeren                |
| `resolve_exec_env`         | Omgevingsvariabelen die eigendom zijn van de Plugin bijdragen aan `exec`   |
| **`tool_result_persist`**  | Het assistentbericht herschrijven dat uit een toolresultaat wordt geproduceerd |
| **`before_message_write`** | Een lopende schrijfactie voor een bericht inspecteren of blokkeren (zeldzaam)      |

**Berichten en aflevering**

| Hook                            | Doel                                                           |
| ------------------------------- | ----------------------------------------------------------------- |
| **`inbound_claim`**             | Een inkomend bericht claimen vóór agentroutering (synthetische antwoorden) |
| **`channel_pairing_requested`** | Nieuw aangemaakte koppelingsverzoeken voor privéberichten observeren                         |
| `message_received`              | Inkomende inhoud, afzender, thread en metadata observeren             |
| **`message_sending`**           | Uitgaande inhoud herschrijven of aflevering annuleren                       |
| **`reply_payload_sending`**     | Genormaliseerde antwoordpayloads vóór aflevering wijzigen of annuleren        |
| `message_sent`                  | Succes of mislukking van uitgaande aflevering observeren                      |
| **`before_dispatch`**           | Een uitgaande dispatch vóór overdracht aan het kanaal inspecteren of herschrijven    |
| **`reply_dispatch`**            | Deelnemen aan de uiteindelijke antwoorddispatch-pijplijn                  |

**Sessies en Compaction**

| Hook                                     | Doel                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session_start` / `session_end`          | Grenzen van de sessielevenscyclus volgen. `reason` is een van `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` of `unknown`. `shutdown`/`restart` worden geactiveerd vanuit de afsluitfinalizer van de Gateway wanneer het proces stopt of opnieuw wordt gestart met actieve sessies, zodat Plugins (geheugen, transcriptopslag) spookrijen kunnen voltooien in plaats van ze bij herstarts open te laten. De finalizer is begrensd, zodat een trage Plugin SIGTERM/SIGINT niet kan blokkeren. |
| `before_compaction` / `after_compaction` | Compaction-cycli observeren of annoteren                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `before_reset`                           | Gebeurtenissen voor het opnieuw instellen van sessies observeren (`/reset`, programmatische resets)                                                                                                                                                                                                                                                                                                                                                                                                     |

**Subagents**

- `subagent_spawned` / `subagent_ended` - observeer het starten en voltooien van subagents.
- `subagent_delivery_target` - compatibiliteitshook voor het afleveren van voltooiingen wanneer geen kernsessiekoppeling een route kan projecteren.
- `subagent_spawning` - verouderde compatibiliteitshook. De kern bereidt nu `thread: true`-subagentkoppelingen voor via adapters voor kanaalsessiekoppeling voordat `subagent_spawned` wordt geactiveerd.
- `subagent_spawned` bevat `resolvedModel` en `resolvedProvider` wanneer OpenClaw vóór het starten het eigen model van de onderliggende sessie heeft bepaald.
- `subagent_ended` bevat `targetSessionKey` (identiteit - komt overeen met `subagent_spawned.childSessionKey`), `targetKind` (`"subagent"` of `"acp"`), `reason`, optioneel `outcome` (`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"` of `"deleted"`), optioneel `error`, `runId`, `endedAt`, `accountId` en `sendFarewell`. Het bevat **niet** `agentId` of `childSessionKey`; gebruik `targetSessionKey` om het te correleren met de bijbehorende `subagent_spawned`-gebeurtenis.

**Levenscyclus**

| Hook                             | Doel                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `gateway_start` / `gateway_stop` | Door plugins beheerde services samen met de Gateway starten of stoppen                              |
| `deactivate`                     | Verouderde compatibiliteitsalias voor `gateway_stop`; gebruik `gateway_stop` in nieuwe plugins       |
| `cron_reconciled`                | Na het starten of opnieuw laden afstemmen op de volledige Cron-status van de Gateway                 |
| `cron_changed`                   | Wijzigingen in de door de Gateway beheerde Cron-levenscyclus observeren (toegevoegd, bijgewerkt, verwijderd, gestart, voltooid, gepland) |
| **`before_install`**             | Klaargezet installatie­materiaal voor een skill of plugin inspecteren vanuit een geladen pluginruntime |

### Verzoeken voor kanaalkoppeling

Gebruik `channel_pairing_requested` wanneer een plugin een operator moet informeren of
een auditrecord moet schrijven nadat een niet-gekoppelde afzender van een DM een
wachtend koppelingsverzoek heeft aangemaakt. De hook wordt aangeroepen wanneer
het verzoek wordt aangemaakt; de aflevering via het kanaal van het
koppelingsantwoord wordt niet vertraagd door trage of falende hookhandlers.

```typescript
api.on("channel_pairing_requested", async (event) => {
  await notifyOperator({
    text: `Nieuw ${event.channel}-koppelingsverzoek van ${event.senderId}: ${event.code}`,
  });
});
```

De hook dient alleen voor observatie. Deze keurt het koppelingsantwoord niet
goed, wijst het niet af, onderdrukt het niet en herschrijft het niet. De payload
bevat het kanaal, optioneel `accountId`, kanaalgebonden
`senderId`, koppelings-`code` en kanaalmetadata. Behandel de
koppelingscode als een actief, eenmalig goedkeuringscredential en lever deze
uitsluitend af bij een vertrouwde operatorbestemming. Behandel
`metadata` als niet-vertrouwde, door de afzender aangeleverde
identiteitstekst. De hook bevat niet de inhoud of media van het inkomende
bericht.

## Runtimehooks debuggen

Gebruik `before_model_resolve` om voor een agentbeurt van provider of model te
wisselen; deze wordt uitgevoerd vóór de modelresolutie. `llm_output`
wordt pas uitgevoerd nadat een modelpoging uitvoer van de assistent heeft
opgeleverd.

Inspecteer runtime-registraties voor bewijs van het effectieve sessiemodel en
gebruik vervolgens `openclaw sessions` of de sessie-/statusinterfaces van de
Gateway. Start de Gateway met `--raw-stream` en
`--raw-stream-path <path>` om providerpayloads te debuggen en onbewerkte
modelstreamgebeurtenissen naar een jsonl-bestand te schrijven.

## Beleid voor toolaanroepen

`before_tool_call` ontvangt:

- `event.toolName`
- `event.params`
- optioneel `event.toolKind` en `event.toolInputKind`, door de host
  bepaalde gezaghebbende discriminatoren voor tools die opzettelijk dezelfde
  naam gebruiken; buitenste `exec`-aanroepen in codemodus gebruiken
  bijvoorbeeld `toolKind: "code_mode_exec"` en bevatten `toolInputKind: "javascript" | "typescript"`
  wanneer de invoertaal bekend is
- optioneel `event.derivedPaths`, zo goed mogelijk door de host afgeleide
  hints voor doelpaden voor bekende toolenveloppen zoals
  `apply_patch`; deze paden kunnen onvolledig zijn of een overschatting
  vormen van wat de tool daadwerkelijk zal wijzigen (bijvoorbeeld bij
  ongeldige of gedeeltelijke invoer)
- optioneel `event.runId`
- optioneel `event.toolCallId`
- contextvelden zoals `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.toolKind`, `ctx.toolInputKind` en diagnostische `ctx.trace`

Deze kan het volgende retourneren:

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
    /** @deprecated Niet-afgehandelde goedkeuringen worden altijd geweigerd. */
    timeoutBehavior?: "allow" | "deny";
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Gedrag van beveiligingen voor getypeerde levenscyclushooks:

- `block: true` is definitief en slaat handlers met een lagere prioriteit over.
- `block: false` wordt behandeld alsof er geen beslissing is.
- `params` herschrijft de toolparameters voor uitvoering.
- `requireApproval` pauzeert de agentuitvoering en vraagt de gebruiker
  via plugingoedkeuringen om toestemming. `/approve` kan zowel
  uitvoerings- als plugingoedkeuringen goedkeuren. Bij native
  `PreToolUse`-doorgiften in de rapportagemodus van de Codex-appserver
  wordt dit uitgesteld tot het bijbehorende goedkeuringsverzoek van de
  appserver; zie [Codex-harnessruntime](/nl/plugins/codex-harness-runtime#hook-boundaries).
- Een `block: true` met een lagere prioriteit kan nog steeds blokkeren nadat
  een hook met een hogere prioriteit om goedkeuring heeft gevraagd.
- `onResolution` ontvangt de vastgestelde beslissing: `allow-once`, `allow-always`,
  `deny`, `timeout` of `cancelled`.

Zie [Verzoeken om pluginrechten](/nl/plugins/plugin-permission-requests) voor
goedkeuringsroutering, beslissingsgedrag en wanneer je
`requireApproval` moet gebruiken in plaats van optionele tools of
uitvoeringsgoedkeuringen.

Plugins die beleid op hostniveau nodig hebben, kunnen vertrouwd toolbeleid
registreren met `api.registerTrustedToolPolicy(...)`. Dit wordt uitgevoerd vóór gewone
`before_tool_call`-hooks en vóór normale hookbeslissingen. Gebundeld vertrouwd
beleid wordt eerst uitgevoerd; vertrouwd beleid van geïnstalleerde plugins
volgt daarna in de laadvolgorde van plugins; gewone
`before_tool_call`-hooks worden daarna uitgevoerd. Gebundelde plugins behouden
het bestaande pad voor vertrouwd beleid. Geïnstalleerde plugins moeten
expliciet zijn ingeschakeld en elke beleids-id declareren in
`contracts.trustedToolPolicies`; niet-gedeclareerde id's worden vóór registratie geweigerd.
Beleids-id's zijn beperkt tot de registrerende plugin, zodat verschillende
plugins dezelfde lokale id kunnen hergebruiken. Gebruik dit niveau alleen voor
door de host vertrouwde controles, zoals werkruimtebeleid, budgethandhaving of
de beveiliging van gereserveerde workflows.

### Hook voor de uitvoeringsomgeving

Met `resolve_exec_env` kunnen plugins omgevingsvariabelen toevoegen aan
`exec`-toolaanroepen voordat de opdracht wordt uitgevoerd. Deze
ontvangt:

- `event.sessionKey`
- `event.toolName`, momenteel altijd `"exec"`
- `event.host`, een van `"gateway"`, `"sandbox"` of `"node"`
- contextvelden zoals `ctx.agentId`, `ctx.sessionKey`,
  `ctx.messageProvider` en `ctx.channelId`

Retourneer een `Record<string, string>` om deze samen te voegen met de
uitvoeringsomgeving. Handlers worden in prioriteitsvolgorde uitgevoerd; latere
resultaten overschrijven eerdere resultaten voor dezelfde sleutel.

De hookuitvoer wordt vóór het samenvoegen gefilterd via het sleutelbeleid van
de host voor de uitvoeringsomgeving. `PATH` wordt altijd verwijderd
(opdrachtresolutie en controles voor veilige binaire bestanden zijn hiervan
afhankelijk). Ongeldige sleutels en gevaarlijke sleutels die hostwaarden
overschrijven, zoals `LD_*`, `DYLD_*`,
`NODE_OPTIONS`, proxyvariabelen (`HTTP_PROXY`,
`HTTPS_PROXY`, `ALL_PROXY`, `NO_PROXY`) en
TLS-overschrijvingsvariabelen (`NODE_TLS_REJECT_UNAUTHORIZED`, `SSL_CERT_FILE` en
vergelijkbare variabelen) worden verwijderd. De gefilterde pluginomgeving
wordt opgenomen in de goedkeurings-/auditmetadata van de Gateway en
doorgestuurd naar uitvoeringsverzoeken van de Node-host.

### Persistentie van toolresultaten

Toolresultaten kunnen gestructureerde `details` bevatten voor
UI-weergave, diagnostiek, mediaroutering of door plugins beheerde metadata.
Behandel `details` als runtimemetadata, niet als promptinhoud:

- OpenClaw verwijdert `toolResult.details` vóór herhaling bij de provider en invoer
  voor Compaction, zodat metadata geen modelcontext wordt.
- Opgeslagen sessie-items behouden alleen begrensde `details`. Te grote details
  worden vervangen door een compacte samenvatting en `persistedDetailsTruncated: true`.
- `tool_result_persist` en `before_message_write` worden uitgevoerd vóór de
  uiteindelijke persistentielimiet. Houd geretourneerde `details` klein
  en plaats tekst die relevant is voor de prompt niet uitsluitend in
  `details`; plaats voor het model zichtbare tooluitvoer in
  `content`.

## Prompt- en modelhooks

Gebruik voor nieuwe plugins de fasespecifieke hooks:

- `before_model_resolve`: ontvangt alleen de huidige prompt en
  bijlagemetadata. Retourneer `providerOverride` of `modelOverride`.
- `agent_turn_prepare`: ontvangt de huidige prompt, voorbereide
  sessieberichten en eventuele exact eenmaal in de wachtrij geplaatste
  injecties die voor deze sessie zijn opgehaald. Retourneer
  `prependContext` of `appendContext`.
- `before_prompt_build`: ontvangt de huidige prompt en
  sessieberichten. Retourneer `prependContext`, `appendContext`,
  `systemPrompt`, `prependSystemContext` of `appendSystemContext`.
- `heartbeat_prompt_contribution`: wordt alleen uitgevoerd voor
  Heartbeat-beurten en retourneert `prependContext` of
  `appendContext`. Bedoeld voor achtergrondmonitors die de huidige status
  moeten samenvatten zonder door de gebruiker geïnitieerde beurten te wijzigen.

`before_agent_start` blijft beschikbaar voor compatibiliteit. Geef de voorkeur
aan de expliciete hooks hierboven, zodat de plugin niet afhankelijk is van een
verouderde gecombineerde fase.

`before_agent_run` wordt uitgevoerd nadat de prompt is samengesteld en vóór
alle modelinvoer, inclusief het laden van promptlokale afbeeldingen en
`llm_input`-observatie. Deze ontvangt de huidige gebruikersinvoer als
`prompt`, plus de geladen sessiegeschiedenis in
`messages` en de actieve systeemprompt. Retourneer
`{ outcome: "block", reason, message? }` om de uitvoering te stoppen voordat het model de prompt
leest. `reason` is intern; `message` is de voor de gebruiker
zichtbare vervanging. Alleen `pass`- en
`block`-uitkomsten worden ondersteund; niet-ondersteunde
beslissingsstructuren worden uit veiligheid geweigerd.

Wanneer een uitvoering wordt geblokkeerd, slaat OpenClaw alleen de vervangende
tekst op in `message.content`, samen met niet-gevoelige blokkeringsmetadata,
zoals de id van de blokkerende plugin en het tijdstip. De oorspronkelijke
gebruikerstekst wordt niet bewaard in het transcript of de toekomstige
context. Interne blokkeringsredenen worden als gevoelig behandeld en
uitgesloten van payloads voor transcript, geschiedenis, uitzending, logboek en
diagnostiek. Voor observatie moeten opgeschoonde velden worden gebruikt, zoals
de id van de blokkeerder, de uitkomst, het tijdstip of een veilige categorie.

`before_agent_start` en `agent_end` bevatten `event.runId` wanneer
OpenClaw de actieve uitvoering kan identificeren; dezelfde waarde staat ook op
`ctx.runId`. Door Cron aangestuurde uitvoeringen maken ook
`ctx.jobId` (de id van de oorspronkelijke Cron-taak) beschikbaar in de
context van de agentbeurt, zodat hooks statistieken, neveneffecten of status
kunnen beperken tot een specifieke geplande taak. `ctx.jobId` maakt
geen deel uit van de `before_tool_call`-toolcontext.

Voor runs die vanuit een kanaal zijn gestart, identificeren `ctx.channel` en `ctx.messageProvider`
het provideroppervlak, zoals `discord` of `telegram`, terwijl `ctx.channelId`
de doel-ID van het gesprek is wanneer OpenClaw deze kan afleiden uit de
sessiesleutel of bezorgingsmetadata.

Wanneer de identiteit van de afzender beschikbaar is, bevatten agent-hookcontexten ook:

- `ctx.senderId` - kanaalspecifieke afzender-ID (bijv. Feishu `open_id`, Discord-
  gebruikers-ID). Wordt ingevuld wanneer de run afkomstig is van een gebruikersbericht met bekende
  afzendermetadata.
- `ctx.chatId` - transporteigen gespreks-ID (bijv. Feishu
  `chat_id`, Telegram `chat_id`). Wordt ingevuld wanneer het oorspronkelijke kanaal
  een eigen gespreks-ID verstrekt.
- `ctx.channelContext.sender.id` - dezelfde afzender-ID als `ctx.senderId`, binnen
  een door het kanaal beheerd object dat plugins kunnen uitbreiden met kanaalspecifieke velden.
- `ctx.channelContext.chat.id` - dezelfde gespreks-ID als `ctx.chatId`,
  binnen een door het kanaal beheerd object dat plugins kunnen uitbreiden met kanaalspecifieke
  velden.

Core definieert alleen de geneste `id`-velden. Kanaalplugins die uitgebreidere
afzender- of chatmetadata via de inbound-helper doorgeven, kunnen
`PluginHookChannelSenderContext` of `PluginHookChannelChatContext` vanuit
`openclaw/plugin-sdk/channel-inbound` uitbreiden:

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

Kanaalplugins geven deze velden door via de inbound-helper van de SDK:

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

Deze velden zijn optioneel en ontbreken bij door het systeem gestarte runs (heartbeat,
cron, exec-event).

`ctx.senderExternalId` blijft beschikbaar als verouderd veld voor broncompatibiliteit met
oudere plugins. Core vult dit niet in; nieuwe kanaalspecifieke afzenderidentiteiten
horen via module-uitbreiding onder `ctx.channelContext.sender` te staan.

`agent_end` is een observatiehook. Gateway- en persistente harnesspaden voeren
deze na de beurt asynchroon uit zonder erop te wachten, terwijl kortlevende eenmalige CLI-paden
op de hook-promise wachten voordat het proces wordt opgeschoond, zodat vertrouwde plugins
terminale observatiegegevens kunnen wegschrijven of status kunnen vastleggen. De hook-runner hanteert een
time-out van 30 seconden, zodat een vastgelopen plugin of embedding-endpoint de hook-promise
niet voor altijd in behandeling kan laten. Een time-out wordt gelogd en OpenClaw gaat door; de
netwerktaak van de plugin wordt niet geannuleerd, tenzij de plugin ook een eigen abort-
signaal gebruikt.

Gebruik `model_call_started` en `model_call_ended` voor telemetrie van provider-aanroepen
die geen onbewerkte prompts, geschiedenis, antwoorden, headers, request-
body's of provider-request-ID's mag ontvangen. Deze hooks bevatten stabiele metadata zoals
`runId`, `callId`, `provider`, `model`, optioneel `api`/`transport`, terminale
`durationMs`/`outcome`, en `upstreamRequestIdHash` wanneer OpenClaw een
begrensde hash van de provider-request-ID kan afleiden. Wanneer de runtime
metadata over het contextvenster heeft bepaald, bevatten de hook-event en context ook
`contextTokenBudget`, het effectieve tokenbudget na limieten van model/configuratie/agent,
plus `contextWindowSource` en `contextWindowReferenceTokens` wanneer een
lagere limiet is toegepast.

`before_agent_finalize` wordt alleen uitgevoerd wanneer een harness op het punt staat een natuurlijk
definitief assistentantwoord te accepteren. Dit is niet het annuleringspad `/stop` en wordt niet
uitgevoerd wanneer de gebruiker een beurt afbreekt. Retourneer `{ action: "revise", reason }` om
de harness vóór afronding om nog één modelpassage te vragen, `{ action:
"finalize", reason? }` om afronding af te dwingen, of laat een resultaat weg om door te gaan.
Handlers hebben standaard een budget van 15s; bij een time-out logt OpenClaw de fout en
gaat het verder met het oorspronkelijke definitieve antwoord.
Native Codex-hooks van `Stop` worden als OpenClaw-
beslissingen van `before_agent_finalize` naar deze hook doorgestuurd.

Wanneer plugins `action: "revise"` retourneren, kunnen ze `retry`-metadata opnemen om
de extra modelpassage begrensd en veilig opnieuw uitvoerbaar te maken:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` wordt toegevoegd aan de reden voor revisie die naar de harness wordt gestuurd.
Met `idempotencyKey` kan de host nieuwe pogingen voor hetzelfde pluginverzoek
over equivalente afrondingsbeslissingen heen tellen, en `maxAttempts` begrenst hoeveel extra
passages de host toestaat voordat deze doorgaat met het natuurlijke definitieve antwoord.

Niet-gebundelde plugins die hooks voor onbewerkte gesprekken nodig hebben (`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end` of `before_agent_run`) moeten het volgende instellen:

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

Hooks die prompts wijzigen en duurzame injecties voor de volgende beurt kunnen per
plugin worden uitgeschakeld met `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Sessie-uitbreidingen en injecties voor de volgende beurt

Workflowplugins kunnen kleine JSON-compatibele sessiestatus opslaan met
`api.session.state.registerSessionExtension(...)` en deze bijwerken via de Gateway-methode
`sessions.pluginPatch`. Sessierijen projecteren geregistreerde
uitbreidingsstatus via `pluginExtensions`, zodat Control UI en andere
clients door plugins beheerde status kunnen weergeven zonder kennis van de interne werking van plugins.
`api.registerSessionExtension(...)` werkt nog steeds, maar is verouderd ten gunste van
de naamruimte `api.session.state`.

Gebruik `api.session.workflow.enqueueNextTurnInjection(...)` wanneer een plugin duurzame
context precies één keer aan de volgende modelbeurt moet doorgeven (de `api.enqueueNextTurnInjection(...)` op het hoogste niveau
is een verouderde alias met hetzelfde gedrag). OpenClaw verwerkt injecties in de wachtrij vóór prompthooks, verwijdert
verlopen injecties en dedupliceert per plugin op basis van `idempotencyKey`. Dit is
het juiste koppelvlak voor hervattingen na goedkeuring, beleidssamenvattingen, delta's van achtergrondmonitoring
en voortzettingen van opdrachten die bij de volgende beurt zichtbaar moeten zijn voor het model,
maar geen permanente tekst in de systeemprompt mogen worden.

Opschoningssemantiek maakt deel uit van het contract. Callbacks voor opschoning van sessie-uitbreidingen en
de runtimelevenscyclus ontvangen `reset`, `delete`, `disable` of
`restart`. De host verwijdert de persistente sessie-uitbreidingsstatus
en wachtende injecties voor de volgende beurt van de betreffende plugin bij reset/verwijderen/uitschakelen; bij opnieuw opstarten
blijft duurzame sessiestatus behouden, terwijl opschoningscallbacks plugins in staat stellen
schedulertaken, runcontext en andere buiten het proces beheerde resources voor de oude
runtimegeneratie vrij te geven.

## Berichthooks

Gebruik berichthooks voor routerings- en bezorgingsbeleid op kanaalniveau:

- `message_received`: observeert inkomende inhoud, afzender, `threadId`,
  `messageId`, `senderId`, optionele run-/sessiecorrelatie en metadata.
- `message_sending`: herschrijft `content` of retourneert `{ cancel: true }`.
- `reply_payload_sending`: herschrijft genormaliseerde `ReplyPayload`-objecten
  (waaronder `presentation`, `delivery`, mediareferenties en tekst) of retourneert
  `{ cancel: true }`.
- `message_sent`: observeert het uiteindelijke succes of falen.

Voor TTS-antwoorden met alleen audio kan `content` het verborgen gesproken
transcript bevatten, zelfs wanneer de kanaalpayload geen zichtbare tekst/bijschrift heeft.
Het herschrijven van die `content` werkt alleen het voor de hook zichtbare transcript bij; dit wordt niet
weergegeven als mediabijschrift.

`reply_payload_sending`-events kunnen `usageState` bevatten, een best-effort live
snapshot per beurt van model/gebruik/context. Duurzame bezorging, herstelde herhaling en
antwoorden zonder exacte runcorrelatie bevatten dit niet.

Contexten van berichthooks stellen stabiele correlatievelden beschikbaar wanneer deze aanwezig zijn:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` en `ctx.callDepth`. Inkomende
contexten en `before_dispatch`-contexten stellen ook antwoordmetadata beschikbaar wanneer het kanaal
op zichtbaarheid gefilterde gegevens van geciteerde berichten heeft: `replyToId`, `replyToIdFull`,
`replyToBody`, `replyToSender` en `replyToIsQuote`. Geef de voorkeur aan deze
eersteklasvelden voordat je verouderde metadata leest.

Geef de voorkeur aan getypeerde velden `threadId` en `replyToId` voordat je kanaalspecifieke
metadata gebruikt.

Beslissingsregels:

- `message_sending` met `cancel: true` is terminaal.
- `message_sending` met `cancel: false` wordt behandeld alsof er geen beslissing is.
- Een herschreven `content` gaat door naar hooks met een lagere prioriteit, tenzij een latere hook
  de bezorging annuleert.
- `reply_payload_sending` wordt uitgevoerd na normalisatie van de payload en vóór bezorging via het kanaal,
  inclusief antwoorden die naar het oorspronkelijke kanaal worden teruggerouteerd.
  Handlers worden opeenvolgend uitgevoerd en elke handler ziet de meest recente payload die
  door handlers met een hogere prioriteit is geproduceerd.
- `reply_payload_sending`-payloads stellen geen vertrouwensmarkeringen van de runtime beschikbaar, zoals
  `trustedLocalMedia`; plugins kunnen de payloadstructuur bewerken, maar kunnen geen vertrouwen in lokale
  media verlenen.
- `message_sending` kan bij annulering `cancelReason` en begrensde `metadata`
  retourneren. Nieuwe API's voor de berichtlevenscyclus stellen dit beschikbaar als een onderdrukt
  bezorgingsresultaat met reden `cancelled_by_message_sending_hook`; verouderde
  directe bezorging blijft voor compatibiliteit een lege resultaatarray retourneren.
- `message_sent` dient alleen voor observatie. Handlerfouten worden gelogd en wijzigen
  het bezorgingsresultaat niet.

## Installatiehooks

Gebruik `security.installPolicy` voor door de operator beheerde toestaan-/blokkerenbeslissingen. Dat
beleid wordt vanuit de OpenClaw-configuratie uitgevoerd, omvat CLI-paden voor installatie en updates, en
weigert bij fouten wanneer het is ingeschakeld maar niet beschikbaar is.

`before_install` is een levenscyclushook voor de pluginruntime. Deze wordt alleen na
`security.installPolicy` uitgevoerd in het OpenClaw-proces waarin pluginhooks al
zijn geladen, zoals installatieflows die door de Gateway worden ondersteund. Deze is nuttig voor
door plugins beheerde observaties, waarschuwingen en compatibiliteitscontroles, maar vormt niet
de primaire beveiligingsgrens voor installaties binnen een onderneming of host. Het veld
`builtinScan` blijft voor compatibiliteit in de eventpayload aanwezig, maar
OpenClaw voert niet langer ingebouwde blokkering van gevaarlijke code tijdens installatie uit, dus dit
is een leeg `ok`-resultaat. Retourneer aanvullende bevindingen of
`{ block: true, blockReason }` om de installatie in dat proces te stoppen.

`block: true` is terminaal. `block: false` wordt behandeld alsof er geen beslissing is. Fouten in
handlers blokkeren de installatie volgens het fail-closed-principe.

## Gateway-levenscyclus

Gebruik `gateway_start` om algemene pluginservices te starten en `gateway_stop` om
langdurig actieve resources op te schonen. De cronplanner kan nog worden geladen wanneer
`gateway_start` wordt uitgevoerd, dus gebruik dit niet als basissignaal voor een externe
cronprojectie.

Vertrouw niet op de interne hook `gateway:startup` voor door plugins beheerde runtime-
services.

`cron_reconciled` wordt geactiveerd nadat de cronplanner van de Gateway en de bijbehorende watchers bij afsluiten
hun duurzame status hebben gereconcilieerd. Dit gebeurt zowel bij de eerste
start als bij vervanging van de planner tijdens het opnieuw laden van de configuratie. Het event rapporteert
`reason` (`startup` of `reload`) en de effectieve `enabled`-status. Uitgeschakelde
cron activeert nog steeds met `enabled: false`, zodat een externe projectie
verouderde wekmomenten kan wissen. Gebruik `ctx.getCron?.()` voor de exacte plannerinstantie die
de reconciliatie heeft voltooid; een latere herlaadactie wijst die callback niet opnieuw toe.
`ctx.abortSignal` beheert dezelfde plannersnapshot. De Gateway breekt deze af zodra
een nieuwere planner is geactiveerd of het afsluiten begint. Geef dit door aan elk
duurzaam neveneffect en accepteer de snapshot niet nadat deze is afgebroken.
Dit is een levenscyclussignaal van de planner, geen activeringssignaal van een plugin: bij
het alleen hot-reloaden van een plugin wordt dit niet opnieuw afgespeeld. Een nieuw ingeschakelde consumer ontvangt
zijn eerste basislijn bij de volgende vervanging van de planner of wanneer de Gateway wordt gestart.

Net als bij andere observatiehooks kunnen callbacks van `gateway_start` en `cron_reconciled`
elkaar overlappen. Als beide handlers dezelfde plugininitialisatie delen, coördineer ze
dan met een pluginlokale readiness-promise in plaats van op de callbackvolgorde te vertrouwen.

`cron_changed` wordt geactiveerd voor cron-levenscyclusgebeurtenissen die eigendom zijn van de Gateway, met een getypeerde
gebeurtenispayload die de redenen `added`, `updated`, `removed`, `started`, `finished`
en `scheduled` omvat. De gebeurtenis bevat een `PluginHookGatewayCronJob`-momentopname
(inclusief `state.nextRunAtMs`, `state.lastRunStatus` en
`state.lastError` indien aanwezig) plus een `PluginHookGatewayCronDeliveryStatus`
van `not-requested` | `delivered` | `not-delivered` | `unknown`. Verwijderingsgebeurtenissen
vinden na de commit plaats: ze worden alleen geactiveerd nadat duurzame verwijdering is geslaagd en bevatten nog steeds
de momentopname van de verwijderde taak, zodat externe planners de status kunnen afstemmen.

Een `scheduled`-gebeurtenis vindt na de commit plaats: deze wordt alleen geactiveerd nadat een geslaagde duurzame
schrijfbewerking de effectieve `nextRunAtMs` van een bestaande taak wijzigt, met uitzondering van de expliciete
levenscyclusgebeurtenis `added`, `updated` of `removed` van die taak. De `event.nextRunAtMs`
op het hoogste niveau is het vastgelegde volgende wekmoment; wanneer deze ontbreekt, heeft de taak
geen volgend wekmoment. Behandel deze gebeurtenissen als aanwijzingen voor afstemming, niet als een geordend deltalogboek.
Gebruik ze als samenvoegbare aanwijzingen om de planner opnieuw te lezen die het laatst is vastgelegd door
`cron_reconciled`; neem de planner niet over uit een `cron_changed`-context.
Houd OpenClaw aan als bron van waarheid voor controles op verschuldigde taken en uitvoering.

### Veilige externe cron-projectie

Projecteer een volledige momentopname van wekmomenten in plaats van delta's van cron-gebeurtenissen door te sturen. De
`replaceAll`-bewerking van de externe adapter moet atomair en idempotent zijn en mag
pas worden voltooid nadat de host de momentopname duurzaam heeft geaccepteerd. De bewerking moet
ook het opgegeven afbreeksignaal respecteren: als het signaal vóór duurzame
acceptatie wordt afgebroken, mag de adapter die momentopname niet accepteren.

Dit patroon houdt één worker voor de nieuwste status actief. Alleen `cron_reconciled`
neemt een plannerinstantie over; `cron_changed` vraagt die worker slechts om
de gezaghebbende instantie opnieuw te lezen, zodat een late aanwijzing geen oudere planner kan herstellen.
Een nieuwere revisie breekt de actieve hostpoging af voordat deze een verouderde
momentopname kan accepteren.

```typescript
import { setTimeout as sleep } from "node:timers/promises";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";

type ExternalWake = { jobId: string; runAtMs: number };

type ExternalWakeHost = {
  replaceAll(wakes: readonly ExternalWake[], options: { signal: AbortSignal }): Promise<void>;
  close(): Promise<void>;
};

type CronReader = {
  list(options: { includeDisabled: true }): Promise<
    Array<{
      id: string;
      enabled?: boolean;
      state?: { nextRunAtMs?: number };
    }>
  >;
};

export function registerCronProjection(api: OpenClawPluginApi, host: ExternalWakeHost) {
  const lifecycle = new AbortController();
  let cron: CronReader | undefined;
  let enabled = false;
  let hasBaseline = false;
  let reconciliationSignal: AbortSignal | undefined;
  let requestedRevision = 0;
  let appliedRevision = 0;
  let worker = Promise.resolve();
  let activeAttempt: AbortController | undefined;

  const projectLatest = async () => {
    let retryMs = 1_000;

    while (!lifecycle.signal.aborted && appliedRevision < requestedRevision) {
      const ownerSignal = reconciliationSignal;
      if (!ownerSignal || ownerSignal.aborted) {
        return;
      }
      const targetRevision = requestedRevision;
      const attempt = new AbortController();
      const signal = AbortSignal.any([lifecycle.signal, ownerSignal, attempt.signal]);
      activeAttempt = attempt;

      try {
        const jobs = enabled && cron ? await cron.list({ includeDisabled: true }) : [];
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        const wakes = jobs
          .flatMap((job): ExternalWake[] => {
            const runAtMs = job.enabled === false ? undefined : job.state?.nextRunAtMs;
            return runAtMs === undefined ? [] : [{ jobId: job.id, runAtMs }];
          })
          .sort((a, b) => a.runAtMs - b.runAtMs || a.jobId.localeCompare(b.jobId));

        await host.replaceAll(wakes, { signal });
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        appliedRevision = targetRevision;
        retryMs = 1_000;
      } catch {
        if (lifecycle.signal.aborted || ownerSignal.aborted) {
          return;
        }
        if (attempt.signal.aborted) {
          continue;
        }
        api.logger.warn(`external cron projection failed; retrying in ${retryMs}ms`);
        try {
          await sleep(retryMs, undefined, { signal });
        } catch {
          if (lifecycle.signal.aborted) {
            return;
          }
          if (attempt.signal.aborted) {
            continue;
          }
        }
        retryMs = Math.min(retryMs * 2, 30_000);
      } finally {
        if (activeAttempt === attempt) {
          activeAttempt = undefined;
        }
      }
    }
  };

  const requestProjection = () => {
    const targetRevision = ++requestedRevision;
    activeAttempt?.abort();
    worker = worker.then(async () => {
      if (!lifecycle.signal.aborted && appliedRevision < targetRevision) {
        await projectLatest();
      }
    });
    return worker;
  };

  api.on("cron_reconciled", (event, ctx) => {
    const reconciledCron = ctx.getCron?.();
    if (event.enabled && !reconciledCron) {
      api.logger.warn("cron reconciliation did not expose a scheduler");
      return;
    }
    cron = reconciledCron;
    enabled = event.enabled;
    hasBaseline = true;
    reconciliationSignal = ctx.abortSignal;
    return requestProjection();
  });

  api.on("cron_changed", () => {
    if (hasBaseline) {
      return requestProjection();
    }
  });

  api.on("gateway_stop", async () => {
    lifecycle.abort();
    await worker;
    await host.close();
  });
}
```

Wanneer `cron_reconciled` `enabled: false` rapporteert, roept hetzelfde pad
`replaceAll([])` aan en wist het verouderde externe wekmomenten. Opnieuw proberen met back-off in dit voorbeeld
is proceslokaal en behandelt runtimefouten van de adapter als tijdelijk; valideer
configuratie die niet opnieuw kan worden geprobeerd vóór registratie. OpenClaw biedt geen
outbox voor effecten van Plugin-hooks. Als het proces wordt afgesloten vóór duurzame acceptatie,
geeft de volgende start van de Gateway een nieuwe gezaghebbende `cron_reconciled`-momentopname af.
`gateway_stop` breekt actief hostwerk af, wacht tot de worker tot rust is gekomen en
sluit vervolgens de adapter.

## Aankomende afschaffingen

Enkele aan hooks gerelateerde oppervlakken zijn afgeschaft, maar worden nog steeds ondersteund. Migreer
vóór de volgende hoofdversie:

- **Plattetekst-enveloppen van kanalen** in handlers voor `inbound_claim` en `message_received`.
  Lees `BodyForAgent` en de gestructureerde blokken met gebruikerscontext
  in plaats van platte enveloptekst te parseren. Zie
  [Plattetekst-enveloppen van kanalen → BodyForAgent](/nl/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** blijft beschikbaar voor compatibiliteit. Nieuwe plugins moeten
  `before_model_resolve` en `before_prompt_build` gebruiken in plaats van de gecombineerde
  fase.
- **`subagent_spawning`** blijft beschikbaar voor compatibiliteit met oudere plugins, maar
  nieuwe plugins mogen er geen threadroutering uit retourneren. De kern bereidt
  `thread: true`-subagentbindingen via adapters voor kanaalsessiebindingen voor
  voordat `subagent_spawned` wordt geactiveerd.
- **`deactivate`** blijft tot na 2026-08-16 beschikbaar als afgeschaft compatibiliteitsalias voor opschoning.
  Nieuwe plugins moeten `gateway_stop` gebruiken.
- **`onResolution` in `before_tool_call`** gebruikt nu de getypeerde
  `PluginApprovalResolution`-unie (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) in plaats van een vrije `string`.
- **`api.registerSessionExtension` / `api.enqueueNextTurnInjection`** blijven
  beschikbaar als compatibiliteitsaliassen op het hoogste niveau. Nieuwe plugins moeten
  `api.session.state.registerSessionExtension(...)` en
  `api.session.workflow.enqueueNextTurnInjection(...)` gebruiken.

Zie voor de volledige lijst — registratie van geheugencapaciteiten, denkprofiel
van providers, externe authenticatieproviders, typen voor providerdetectie, accessors voor taakruntime
en de naamswijziging `command-auth` → `command-status` —
[Plugin SDK-migratie → Actieve afschaffingen](/nl/plugins/sdk-migration#active-deprecations).

## Gerelateerd

- [Plugin SDK-migratie](/nl/plugins/sdk-migration) - actieve afschaffingen en verwijderingstijdlijn
- [Plugins bouwen](/nl/plugins/building-plugins)
- [Overzicht van de Plugin SDK](/nl/plugins/sdk-overview)
- [Toegangspunten voor plugins](/nl/plugins/sdk-entrypoints)
- [Interne hooks](/nl/automation/hooks)
- [Interne werking van de pluginarchitectuur](/nl/plugins/architecture-internals)
