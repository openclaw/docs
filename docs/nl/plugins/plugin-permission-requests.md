---
read_when:
    - Je hebt een Plugin-hook of tool nodig om te vragen voordat een neveneffect wordt uitgevoerd
    - Je moet configureren waar goedkeuringsprompts voor Plugins worden afgeleverd
    - Je kiest tussen optionele tools, uitvoeringsgoedkeuringen en Plugin-goedkeuringen
sidebarTitle: Permission requests
summary: Vraag gebruikers om Plugin-toolaanroepen en toestemmingsprompts van Plugins goed te keuren
title: Plugin-toestemmingsverzoeken
x-i18n:
    generated_at: "2026-06-27T17:57:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72b860e9f8ddef80c70e943ec05353cbc0a917577382289649432a58c3ce6bd0
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

Plugin-toestemmingsaanvragen laten Plugin-code een toolaanroep of door de Plugin beheerde
bewerking pauzeren totdat een gebruiker deze goedkeurt of weigert. Ze gebruiken de Gateway
`plugin.approval.*`-flow en dezelfde goedkeurings-UI-oppervlakken die chatgoedkeuringsknoppen
en `/approve`-opdrachten afhandelen.

Gebruik Plugin-toestemmingsaanvragen voor Plugin-/app-machtigingen. Ze vervangen geen
host-exec-goedkeuringen, optionele tool-allowlists of de native toestemmingsreview van Codex.

## Kies de juiste gate

Kies de gate die past bij het beslismoment dat je nodig hebt:

| Gate                             | Gebruik dit wanneer                                                       | Wat het beheert                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Optionele tools                  | Een tool pas zichtbaar mag zijn voor het model nadat de gebruiker zich aanmeldt. | Tool-blootstelling via `tools.allow`.                                                                          |
| Plugin-toestemmingsaanvragen     | Een Plugin-hook of door de Plugin beheerde bewerking moet vragen voordat één actie wordt uitgevoerd. | Runtime-goedkeuring via `plugin.approval.*`.                                                                   |
| Exec-goedkeuringen               | Een hostopdracht of shellachtige tool operatorgoedkeuring nodig heeft.     | Host-exec-beleid en duurzame exec-allowlists.                                                                  |
| Native toestemmingsaanvragen van Codex | Codex vraagt vóór native shell-, bestands-, MCP- of app-serveracties. | Afhandeling van goedkeuringen voor de Codex app-server of native hook, gerouteerd via Plugin-goedkeuringen wanneer OpenClaw eigenaar is van de prompt. |
| MCP-goedkeuringsuitlokkingen     | Een Codex MCP-server goedkeuring vraagt voor een toolaanroep.              | MCP-goedkeuringsreacties gekoppeld via OpenClaw Plugin-goedkeuringen.                                           |

Optionele tools zijn een gate tijdens ontdekking. Plugin-toestemmingsaanvragen zijn een
gate per aanroep. Gebruik beide wanneer een gevoelige tool expliciete aanmelding moet vereisen
voordat het model deze kan zien en goedkeuring voordat de actie wordt uitgevoerd.

## Vraag goedkeuring aan vóór een toolaanroep

De meeste door Plugins geschreven prompts moeten starten in een `before_tool_call`-hook. De hook
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
          timeoutBehavior: "deny",
          onResolution(decision) {
            console.log(`deploy approval resolved: ${decision}`);
          },
        },
      };
    });
  },
});
```

Schrijf prompttekst voor de persoon die de actie zal goedkeuren:

- Houd `title` kort en actiegericht. De Gateway accepteert maximaal 80
  tekens.
- Houd `description` specifiek en begrensd. De Gateway accepteert maximaal 256
  tekens.
- Neem de actie, het doel en het risico op. Neem geen geheimen, tokens of
  privépayloads op die niet in chatgoedkeuringsoppervlakken mogen verschijnen.
- Gebruik `severity: "critical"` alleen voor acties waarbij een verkeerde beslissing
  productieschade of gegevensverlies kan veroorzaken.
- Gebruik `allowedDecisions: ["allow-once", "deny"]` wanneer permanent vertrouwen
  onveilig is voor die actie.

## Beslissingsgedrag

OpenClaw maakt een wachtende goedkeuring met een `plugin:`-ID, levert deze aan de
beschikbare goedkeuringsoppervlakken en wacht op een beslissing.

| Beslissing        | Resultaat                                                                  |
| ----------------- | -------------------------------------------------------------------------- |
| `allow-once`      | De huidige aanroep gaat door.                                               |
| `allow-always`    | De huidige aanroep gaat door en de beslissing wordt doorgegeven aan de Plugin. |
| `deny`            | De aanroep wordt geblokkeerd met een geweigerd toolresultaat.              |
| Time-out          | De aanroep wordt geblokkeerd tenzij `timeoutBehavior` `"allow"` is.         |
| Annulering        | De aanroep wordt geblokkeerd wanneer de run wordt afgebroken.              |
| Geen goedkeuringsroute | De aanroep wordt geblokkeerd omdat geen verbonden goedkeuringsoppervlak deze kan oplossen. |

`allow-always` is alleen duurzaam wanneer de aanvragende Plugin of runtime
die persistentie implementeert. Voor gewone `before_tool_call.requireApproval`-hooks
behandelt OpenClaw `allow-once` en `allow-always` als goedkeuringsbeslissingen voor de
huidige aanroep en geeft de opgeloste waarde door aan `onResolution`. Als je Plugin
`allow-always` aanbiedt, documenteer en implementeer dan exact welke toekomstige aanroepen deze
vertrouwt.

Als de hook ook `params` retourneert, past OpenClaw die parameterwijzigingen alleen toe
nadat de goedkeuring slaagt. Een hook met lagere prioriteit kan nog steeds blokkeren nadat een
hook met hogere prioriteit goedkeuring heeft gevraagd.

`allowedDecisions` beperkt de knoppen en opdrachten die aan de gebruiker worden getoond. De
Gateway weigert een oplossingspoging voor elke beslissing die de aanvraag niet aanbood.

## Routeer goedkeuringsprompts

Goedkeuringsprompts kunnen worden opgelost in lokale UI-oppervlakken of in chatkanalen die
goedkeuringsafhandeling ondersteunen. Configureer `approvals.plugin` om Plugin-goedkeuringsprompts
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

`approvals.plugin` staat los van `approvals.exec`. Het inschakelen van doorsturen van exec-goedkeuringen
routeert geen Plugin-goedkeuringsprompts, en het inschakelen van doorsturen van Plugin-goedkeuringen
wijzigt het host-exec-beleid niet.

Wanneer een prompt handmatige goedkeuringstekst bevat, los je deze op met een van de aangeboden
beslissingen:

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

Zie [Geavanceerde exec-goedkeuringen](/nl/tools/exec-approvals-advanced#plugin-approval-forwarding)
voor het volledige doorstuurmodel, goedkeuringsgedrag in dezelfde chat, native kanaallevering
en kanaalspecifieke regels voor goedkeurders.

## Native toestemmingen van Codex

Native toestemmingsprompts van Codex kunnen ook via Plugin-goedkeuringen lopen, maar
ze hebben ander eigenaarschap dan door Plugins geschreven hooks.

- Goedkeuringsaanvragen van de Codex app-server worden na Codex-review via OpenClaw gerouteerd.
- De native hook `permission_request`-relay kan vragen via
  `plugin.approval.request` wanneer die relay is ingeschakeld.
- MCP-toolgoedkeuringsuitlokkingen worden via Plugin-goedkeuringen gerouteerd wanneer Codex
  `_meta.codex_approval_kind` markeert als `"mcp_tool_call"`.

Zie [Codex-harnessruntime](/nl/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
voor het Codex-specifieke gedrag en fallback-regels.

## Probleemoplossing

**De tool zegt dat Plugin-goedkeuringen niet beschikbaar zijn.** Geen goedkeurings-UI of geconfigureerde
goedkeuringsroute heeft de aanvraag geaccepteerd. Verbind een client met goedkeuringsmogelijkheden, gebruik een
kanaal dat `/approve` in dezelfde chat ondersteunt, of configureer `approvals.plugin`.

**`allow-always` verschijnt, maar de volgende aanroep vraagt opnieuw.** De generieke Plugin-goedkeuringsflow
bewaart vertrouwen niet automatisch voor willekeurige hooks. Bewaar door de Plugin beheerd vertrouwen
in je Plugin na `onResolution("allow-always")`, of bied alleen `allow-once` en `deny` aan.

**`/approve` weigert de beslissing.** De aanvraag beperkte
`allowedDecisions`. Gebruik een van de beslissingen die in de prompt zijn afgedrukt.

**Een Slack-, Discord-, Telegram- of Matrix-prompt wordt anders gerouteerd dan exec-goedkeuringen.** Plugin-goedkeuringen
en exec-goedkeuringen gebruiken aparte configuratie en kunnen andere autorisatiecontroles gebruiken.
Controleer `approvals.plugin` en de Plugin-goedkeuringsondersteuning van het kanaal in plaats van alleen
`approvals.exec` te controleren.

## Gerelateerd

- [Plugin-hooks](/nl/plugins/hooks#tool-call-policy)
- [Plugins bouwen](/nl/plugins/building-plugins#registering-agent-tools)
- [Geavanceerde exec-goedkeuringen](/nl/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Gateway-protocol](/nl/gateway/protocol)
- [Codex-harnessruntime](/nl/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
