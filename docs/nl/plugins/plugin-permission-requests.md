---
read_when:
    - Je hebt een Plugin-hook of tool nodig om toestemming te vragen voordat een neveneffect wordt uitgevoerd
    - Je moet configureren waar goedkeuringsverzoeken voor plugins worden afgeleverd
    - Je kiest tussen optionele tools, uitvoeringsgoedkeuringen en plugingoedkeuringen
sidebarTitle: Permission requests
summary: Vraag gebruikers om Plugin-toolaanroepen en toestemmingsprompts van Plugins goed te keuren
title: Verzoeken om Plugin-machtigingen
x-i18n:
    generated_at: "2026-07-16T16:03:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 675534212e70cc7b2e7bdc801955929c6a8156b08d620483edf0133afc3bfdaa
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

Aanvragen om Plugin-machtigingen laten Plugincode een toolaanroep of een bewerking
van de Plugin onderbreken totdat een gebruiker deze goedkeurt of weigert. Ze gebruiken de Gateway-
`plugin.approval.*`-stroom en dezelfde goedkeuringsinterfaces die goedkeuringsknoppen
in chats en `/approve`-opdrachten afhandelen.

Gebruik aanvragen om Plugin-machtigingen voor machtigingen van plugins/apps. Ze vervangen
geen goedkeuringen voor uitvoering op de host, optionele tooltoelatingslijsten of de ingebouwde
machtigingscontrole van Codex.

## Kies de juiste poort

Kies de poort die overeenkomt met het benodigde beslismoment:

| Poort                            | Gebruik deze wanneer                                                     | Wat deze beheert                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Optionele tools                  | Een tool pas zichtbaar mag zijn voor het model nadat de gebruiker zich ervoor heeft aangemeld. | Beschikbaarheid van tools via `tools.allow`.                                                                 |
| Aanvragen om Plugin-machtigingen | Een Plugin-hook of bewerking van de Plugin toestemming moet vragen voordat één actie wordt uitgevoerd. | Runtimegoedkeuring via `plugin.approval.*`.                                                                        |
| Uitvoeringsgoedkeuringen         | Een hostopdracht of shellachtige tool goedkeuring van de beheerder vereist. | Uitvoeringsbeleid van de host en permanente toelatingslijsten voor uitvoering.                                    |
| Ingebouwde Codex-machtigingsaanvragen | Codex toestemming vraagt vóór ingebouwde shell-, bestands-, MCP- of app-serveracties. | Afhandeling van goedkeuring door de Codex-app-server of ingebouwde hooks, gerouteerd via Plugin-goedkeuringen wanneer OpenClaw de prompt beheert. |
| MCP-goedkeuringsverzoeken        | Een Codex MCP-server goedkeuring vraagt voor een toolaanroep.             | MCP-goedkeuringsreacties die via OpenClaw Plugin-goedkeuringen worden doorgegeven.                                |

Optionele tools vormen een poort tijdens de detectie. Aanvragen om Plugin-machtigingen
vormen een poort per aanroep. Gebruik beide wanneer een gevoelige tool expliciete aanmelding
moet vereisen voordat het model deze kan zien en goedkeuring voordat de actie wordt uitgevoerd.

## Vraag goedkeuring vóór een toolaanroep

De meeste door een Plugin gemaakte prompts moeten beginnen in een `before_tool_call`-hook. De hook
wordt uitgevoerd nadat het model een tool selecteert en voordat OpenClaw deze uitvoert:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "deploy-policy",
  name: "Deploy Policy",
  register(api) {
    api.on("before_tool_call", async (event) => {
      if (event.toolName !== "deploy_service") {
        return;
      }

      const environment =
        typeof event.params.environment === "string" ? event.params.environment : "unknown";

      return {
        requireApproval: {
          title: "Deploy service",
          description: `Deploy service to ${environment}.`,
          severity: environment === "production" ? "critical" : "warning",
          allowedDecisions:
            environment === "production"
              ? ["allow-once", "deny"]
              : ["allow-once", "allow-always", "deny"],
          timeoutMs: 120_000,
          onResolution(decision) {
            console.log(`deploy approval resolved: ${decision}`);
          },
        },
      };
    });
  },
});
```

Schrijf de prompttekst voor de persoon die de actie zal goedkeuren:

- Houd `title` kort en actiegericht; de Gateway beperkt deze tot 80 tekens.
- Houd `description` specifiek en afgebakend; de Gateway beperkt deze tot 512
  tekens.
- Vermeld de actie, het doel en het risico. Vermeld geen geheimen, tokens of
  privépayloads die niet in interfaces voor chatgoedkeuring mogen verschijnen.
- `severity` wordt standaard ingesteld op `"warning"` wanneer het wordt weggelaten. Gebruik `"critical"` alleen voor
  acties waarbij een verkeerde beslissing productieschade of gegevensverlies kan veroorzaken.
- `allowedDecisions` wordt standaard ingesteld op `["allow-once", "allow-always", "deny"]` wanneer het
  wordt weggelaten. Geef `["allow-once", "deny"]` door wanneer permanent vertrouwen onveilig is voor
  die actie.
- `timeoutMs` wordt standaard ingesteld op 120000 (2 minuten) en is begrensd op 600000 (10
  minuten), ongeacht de aangevraagde waarde.

## Beslissingsgedrag

OpenClaw maakt een openstaande goedkeuring met een `plugin:`-ID, levert deze aan de
beschikbare goedkeuringsinterfaces en wacht op een beslissing.

| Beslissing        | Resultaat                                                                 |
| ----------------- | ------------------------------------------------------------------------- |
| `allow-once`      | De huidige aanroep gaat door.                                             |
| `allow-always`    | De huidige aanroep gaat door en de beslissing wordt aan de Plugin doorgegeven. |
| `deny`            | De aanroep wordt geblokkeerd met een geweigerd toolresultaat.              |
| Time-out          | De aanroep wordt geblokkeerd.                                             |
| Annulering        | De aanroep wordt geblokkeerd wanneer de uitvoering wordt afgebroken.      |
| Geen goedkeuringsroute | De aanroep wordt geblokkeerd omdat geen verbonden goedkeuringsinterface deze kan afhandelen. |

Alleen de exacte door het verzoek toegestane beslissingen `allow-once` en
`allow-always` staan uitvoering toe. Onbekende, onjuist gevormde, niet-overeenkomende,
ontbrekende en verlopen beslissingen worden standaard geweigerd. Het verouderde veld
`timeoutBehavior` blijft geaccepteerd voor compatibiliteit met plugins, maar is afgeschaft
en wordt genegeerd; stel het niet in nieuwe hooks in.

`allow-always` is alleen permanent wanneer de verzoekende Plugin of runtime
die persistentie implementeert. Voor gewone `before_tool_call.requireApproval`-hooks
behandelt OpenClaw `allow-once` en `allow-always` als goedkeuringsbeslissingen voor de
huidige aanroep en geeft het de afgehandelde waarde door aan `onResolution`. Als je Plugin
`allow-always` aanbiedt, documenteer en implementeer dan exact welke toekomstige aanroepen
worden vertrouwd.

Als de hook ook `params` retourneert, past OpenClaw die parameterwijzigingen pas toe
nadat de goedkeuring is geslaagd. Een hook met lagere prioriteit kan nog steeds blokkeren nadat
een hook met hogere prioriteit om goedkeuring heeft gevraagd.

`allowedDecisions` beperkt de knoppen en opdrachten die aan de gebruiker worden getoond. De
Gateway weigert een afhandelingspoging voor elke beslissing die niet door het verzoek werd aangeboden.

## Routeer goedkeuringsprompts

Goedkeuringsprompts kunnen worden afgehandeld in lokale gebruikersinterfaces of in chatkanalen die
goedkeuringsafhandeling ondersteunen. Configureer `approvals.plugin` om prompts voor Plugin-goedkeuring
door te sturen naar expliciete chatdoelen:

```json5
{
  approvals: {
    plugin: {
      enabled: true,
      mode: "targets",
      agentFilter: ["main"],
      targets: [{ channel: "slack", to: "U12345678" }],
    },
  },
}
```

`approvals.plugin` staat los van `approvals.exec`. Het inschakelen van doorsturen van
uitvoeringsgoedkeuringen routeert geen prompts voor Plugin-goedkeuring, en het inschakelen van
doorsturen van Plugin-goedkeuringen wijzigt het uitvoeringsbeleid van de host niet.

Wanneer een prompt handmatige goedkeuringstekst bevat, handel je deze af met een van de aangeboden
beslissingen:

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

Zie [Geavanceerde uitvoeringsgoedkeuringen](/nl/tools/exec-approvals-advanced#plugin-approval-forwarding)
voor het volledige doorstuurmodel, goedkeuringsgedrag binnen dezelfde chat, ingebouwde kanaallevering
en kanaalspecifieke regels voor goedkeurders.

## Ingebouwde Codex-machtigingen

Ingebouwde Codex-machtigingsprompts kunnen ook via Plugin-goedkeuringen worden verzonden, maar
ze hebben een andere eigenaar dan door plugins gemaakte hooks.

- Goedkeuringsaanvragen van de Codex-app-server worden na Codex-controle via OpenClaw gerouteerd.
- De relay van de ingebouwde hook `permission_request` kan via
  `plugin.approval.request` toestemming vragen wanneer die relay is ingeschakeld.
- MCP-goedkeuringsverzoeken voor tools worden via Plugin-goedkeuringen gerouteerd wanneer Codex
  `_meta.codex_approval_kind` markeert als `"mcp_tool_call"`.

Zie [Codex-harnessruntime](/nl/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
voor het Codex-specifieke gedrag en de terugvalregels.

## Problemen oplossen

**De tool meldt dat Plugin-goedkeuringen niet beschikbaar zijn.** Geen goedkeuringsinterface of
geconfigureerde goedkeuringsroute heeft het verzoek geaccepteerd. Verbind een client die goedkeuringen
ondersteunt, gebruik een kanaal dat `/approve` binnen dezelfde chat ondersteunt of configureer
`approvals.plugin`.

**`allow-always` verschijnt, maar de volgende aanroep vraagt opnieuw om toestemming.** De algemene
Plugin-goedkeuringsstroom bewaart vertrouwen voor willekeurige hooks niet automatisch. Sla vertrouwen
dat door de Plugin wordt beheerd op in je Plugin na `onResolution("allow-always")`, of
bied alleen `allow-once` en `deny` aan.

**`/approve` weigert de beslissing.** Het verzoek beperkte
`allowedDecisions`. Gebruik een van de beslissingen die in de prompt worden weergegeven.

**Een prompt van Discord, Matrix, Slack of Telegram wordt anders gerouteerd dan
uitvoeringsgoedkeuringen.** Plugin-goedkeuringen en uitvoeringsgoedkeuringen gebruiken afzonderlijke
configuraties en kunnen verschillende autorisatiecontroles gebruiken. Controleer `approvals.plugin`
en de ondersteuning voor Plugin-goedkeuringen van het kanaal in plaats van alleen
`approvals.exec` te controleren.

## Gerelateerd

- [Plugin-hooks](/nl/plugins/hooks#tool-call-policy)
- [Plugins bouwen](/nl/plugins/building-plugins#registering-tools)
- [Geavanceerde uitvoeringsgoedkeuringen](/nl/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Gateway-protocol](/nl/gateway/protocol)
- [Codex-harnessruntime](/nl/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
