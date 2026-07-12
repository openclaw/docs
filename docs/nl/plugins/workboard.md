---
read_when:
    - Je wilt een Kanban-achtig werkbord in de Control UI
    - U schakelt de meegeleverde Workboard-plugin in of uit
    - Je wilt gepland agentwerk bijhouden zonder een externe projectmanager
summary: Optioneel dashboardwerkbord voor kaarten in beheer van agents en sessieoverdracht
title: Workboard-plugin
x-i18n:
    generated_at: "2026-07-12T09:11:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b647fa702f629c26335d301899edfab3104f0a5cb6995e646901845d7ad4357f
    source_path: plugins/workboard.md
    workflow: 16
---

De Workboard-plugin voegt een optioneel bord in Kanban-stijl toe aan de
[Control UI](/nl/web/control-ui): werkkaarten op agentniveau, toewijzing aan agents
en een koppeling terug naar de taak, uitvoering en dashboardsessie van de kaart.

Workboard is bewust klein gehouden: het houdt lokaal operationeel werk bij voor
één OpenClaw Gateway. Het is geen vervanging voor GitHub Issues, Linear, Jira of
andere projectbeheersystemen voor teams.

## Inschakelen

Workboard is gebundeld, maar standaard uitgeschakeld:

1. Open **Plugins** in de Control UI of gebruik `/settings/plugins` relatief ten
   opzichte van het geconfigureerde basispad van de Control UI. Een basispad van
   `/openclaw` gebruikt bijvoorbeeld `/openclaw/settings/plugins`.
2. Zoek **Workboard** en kies **Enable**. Omdat Workboard bij OpenClaw is
   inbegrepen, is de actie **Install** niet nodig.
3. Als de UI meldt dat opnieuw opstarten vereist is, start u de Gateway opnieuw.

Het tabblad Workboard verschijnt in de dashboardnavigatie nadat de runtime van
de plugin is geladen. Zolang de plugin is uitgeschakeld, blijft het tabblad
verborgen in de navigatie. Als de route `/workboard` rechtstreeks wordt geopend
terwijl de plugin is uitgeschakeld of door `plugins.allow`/`plugins.deny` wordt
geblokkeerd, wordt een status weergegeven die aangeeft dat de plugin niet
beschikbaar is, in plaats van kaartgegevens.

De equivalente CLI-werkwijze is:

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## Configuratie

Workboard heeft geen pluginspecifieke configuratie. Schakel het in of uit met
de standaardvermelding voor de plugin:

```json5
{
  plugins: {
    entries: {
      workboard: {
        enabled: true,
        config: {},
      },
    },
  },
}
```

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## Kaartvelden

| Veld                | Waarden                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `status`            | `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`                                 |
| `priority`          | `low`, `normal`, `high`, `urgent`                                                                                         |
| `labels`            | tekenreeksen met vrije indeling                                                                                           |
| `agentId`           | optioneel toegewezen agent                                                                                                |
| gekoppelde referenties | optionele taak, uitvoering, sessie of bron-URL                                                                         |
| `execution`         | optionele metagegevens voor een Codex-/Claude-uitvoering die vanaf de kaart is gestart (engine, modus, model, sessie, uitvoerings-id, status) |

Kaarten bevatten ook compacte metagegevens voor pogingen, opmerkingen,
koppelingen, bewijs, artefacten, automatiseringsinstellingen, bijlagen,
workerlogboeken, de protocolstatus van workers, claims, diagnostiek, meldingen,
sjabloon-id, archiefstatus en detectie van verouderde sessies, plus een lijst
met recente gebeurtenissen (`created`, `edited`, `moved`, `linked`,
`specified`, `decomposed`, `claimed`, `heartbeat`, `execution_updated`,
`attempt_started`, `attempt_updated`, `comment_added`, `link_added`,
`proof_added`, `artifact_added`, `attachment_added`, `diagnostic`,
`notification`, `dispatch`, `orchestration`, `protocol_violation`, `archived`,
`unarchived`, `stale`). Met deze metagegevens kan een beheerder zien hoe een
kaart over het bord is verplaatst zonder de gekoppelde sessie te openen. Het
gaat om lokale operationele context, niet om een vervanging voor
sessietranscripten of de geschiedenis van GitHub-issues.

Kaarten worden opgeslagen in de eigen Gateway-status van de plugin en worden
samen met de overige OpenClaw-status van die Gateway verplaatst (zie
[Opslag](#storage)).

## Werk starten vanaf een kaart

Niet-gekoppelde kaarten kunnen rechtstreeks werk starten:

- **Codex uitvoeren** / **Claude uitvoeren** start een door een taak bijgehouden
  agentuitvoering met een expliciete engine, verzendt de prompt van de kaart en
  markeert de kaart als `running`. Codex-uitvoeringen gebruiken
  `openai/gpt-5.6-sol`; Claude-uitvoeringen gebruiken
  `anthropic/claude-sonnet-4-6`.
- **Codex openen** / **Claude openen** maakt een gekoppelde dashboardsessie
  zonder de prompt van de kaart te verzenden of de kaart te verplaatsen, voor
  handmatig werk dat aan het bord gekoppeld blijft.

Autonome starts gebruiken het pad van de Gateway voor door taken bijgehouden
agentuitvoeringen (de standaardagent en het standaardmodel, tenzij Codex of
Claude expliciet wordt gekozen). Workboard koppelt vervolgens de resulterende
taak, uitvoerings-id en sessiesleutel terug aan de kaart. Elke gekoppelde
uitvoering registreert ook een samenvatting van de poging (engine, modus, model,
uitvoerings-id, tijdstempels, status en doorlopend aantal fouten), zodat
herhaalde fouten zichtbaar blijven.

Het dashboard vernieuwt de taakstatus vanuit het taakregister van de Gateway en
koppelt taken aan kaarten op basis van taak-id, uitvoerings-id of gekoppelde
sessiesleutel. Een taak in de wachtrij of in uitvoering houdt de levenscyclus
van de kaart actief. Een voltooide, mislukte, verlopen of geannuleerde taak
verplaatst de kaart naar `review` of `blocked` volgens dezelfde
synchronisatieregel als voor gekoppelde sessies (zie
[Synchronisatie van de sessielevenscyclus](#session-lifecycle-sync)).

## Agenttools

| Tool                                                                                                                                             | Doel                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | Compacte kaarten weergeven met claim-/diagnosestatus; optioneel filter op bord.                                                                                                                            |
| `workboard_read`                                                                                                                                 | Eén kaart retourneren plus begrensde werkcontext (notities, pogingen, opmerkingen, links, bewijs, artefacten, bovenliggende resultaten, recent werk van de toegewezene, actieve diagnoses).                 |
| `workboard_create`                                                                                                                               | Een kaart maken met optionele bovenliggende kaarten, tenant, Skills, bord, werkruimtemetadata, idempotentiesleutel, runtimelimiet en budget voor nieuwe pogingen.                                           |
| `workboard_link`                                                                                                                                 | Een bovenliggende kaart aan een onderliggende kaart koppelen. Onderliggende kaarten blijven `todo` totdat elke bovenliggende kaart `done` bereikt; vervolgens verplaatst dispatch-promotie ze naar `ready`. |
| `workboard_claim`                                                                                                                                | Een kaart claimen voor de aanroepende agent; verplaatst `backlog`/`todo`/`ready` naar `running`.                                                                                                           |
| `workboard_heartbeat`                                                                                                                            | De Heartbeat van de claim tijdens een langere uitvoering vernieuwen.                                                                                                                                       |
| `workboard_release`                                                                                                                              | De claim na voltooiing, pauzering of overdracht vrijgeven; kan de kaart naar een volgende status verplaatsen.                                                                                              |
| `workboard_complete` / `workboard_block`                                                                                                         | Gestructureerde levenscyclustools voor eindsamenvattingen, bewijs, artefacten en manifesten van gemaakte kaarten (moeten verwijzen naar kaarten die aan de voltooide kaart zijn teruggekoppeld), of redenen voor blokkering. |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | Kleine kaartbijlagen opslaan in de SQLite-status van de Plugin, op de kaart indexeren en in de werkcontext beschikbaar stellen.                                                                            |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | Logregels van de werker vastleggen en een kaart blokkeren wanneer een geautomatiseerde werker stopt zonder `workboard_complete`/`workboard_block` aan te roepen.                                          |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | Opgeslagen bordmetadata beheren (weergavenaam, beschrijving, archiefstatus, standaardwerkruimte).                                                                                                          |
| `workboard_runs`                                                                                                                                 | De opgeslagen geschiedenis van uitvoeringspogingen voor een kaart retourneren.                                                                                                                            |
| `workboard_specify`                                                                                                                              | Een globale triage-/backlogkaart omzetten in een verduidelijkte `todo`-kaart; legt de specificatiesamenvatting op de kaart vast.                                                                            |
| `workboard_decompose`                                                                                                                            | Een bovenliggende orkestratiekaart opsplitsen in gekoppelde onderliggende kaarten die bord-/tenantmetadata overnemen; kan de bovenliggende kaart voltooien met een manifest van gemaakte kaarten.           |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | Meldingsabonnementen beheren. Gebeurtenissen kunnen veilig opnieuw worden gelezen; `advance` verplaatst de duurzame cursor, zodat aanroepers kunnen hervatten zonder gebeurtenissen van voltooide/mislukte/verouderde kaarten te verliezen of dubbel te lezen. |
| `workboard_boards` / `workboard_stats`                                                                                                           | Naamruimten van borden en wachtrijstatistieken inspecteren.                                                                                                                                                |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | Vastgelopen werk herstellen of overdragen.                                                                                                                                                                |
| `workboard_comment` / `workboard_proof`                                                                                                          | Overdrachtsnotities toevoegen of verwijzingen naar bewijs/artefacten bijvoegen.                                                                                                                           |
| `workboard_unblock`                                                                                                                              | Geblokkeerd werk terugzetten naar `todo`.                                                                                                                                                                  |
| `workboard_dispatch`                                                                                                                             | Afhankelijkheidspromotie of opschoning van verouderde claims activeren.                                                                                                                                    |

Geclaimde kaarten weigeren mutaties via agenttools van andere agents, tenzij de aanroeper
het claimtoken bezit dat door `workboard_claim` is geretourneerd. Elke kaart die door een
agenttool of Gateway-RPC-aanroep wordt geretourneerd, maskeert `metadata.claim.token` als `[redacted]`
(het token zelf wordt één keer, op het hoogste niveau, alleen door `workboard_claim` geretourneerd),
zodat dashboardbeheerders en andere agents de claimstatus kunnen inspecteren zonder ooit
een bruikbaar token te zien. Herstel verloopt via
`workboard_promote`/`workboard_reassign`/`workboard_reclaim`; hiervoor is
het token niet vereist.

## Dispatch

Dispatch is lokaal binnen de Gateway: het start geen willekeurige besturingssysteemprocessen. Normale
OpenClaw-subagentsessies blijven verantwoordelijk voor de uitvoering. Eén dispatchronde:

1. Promoveert kaarten waarvan de afhankelijkheden gereed zijn.
2. Legt dispatchmetadata vast op gereedstaande kaarten.
3. Blokkeert verlopen claims of uitvoeringen waarvan de tijdslimiet is verstreken.
4. Markeert door het bord geconfigureerde triagekaarten als orkestratiekandidaten.
5. Claimt een kleine batch gereedstaande kaarten en start werkuitvoeringen via de
   subagentruntime van de Gateway.

Werkers krijgen begrensde kaartcontext plus het claimtoken dat nodig is om via de
Workboard-tools een Heartbeat te verzenden of de kaart te voltooien of blokkeren.

### Selectie van werkers

Elke ronde start standaard **maximaal 3 werkers**. Gereedstaande kaarten worden gesorteerd op
prioriteit, vervolgens positie en daarna aanmaaktijd. Een ronde start slechts één kaart per
eigenaar/agent en slaat eigenaren over die al actief werk of beoordelingswerk op het
bord hebben. Gearchiveerde kaarten, kaarten met een actieve claim en kaarten die niet de status `ready`
hebben, worden nooit geselecteerd om werkers te starten (ze kunnen nog wel worden beïnvloed door de
gegevenszijde van dispatch: opschoning van verouderde claims, promotie van afhankelijkheden en
opschoning na tijdslimietoverschrijding).

Sessiesleutels zijn deterministisch per bord/kaart, zodat herhaalde dispatches
naar dezelfde werkbaan terugleiden in plaats van niet-gerelateerde sessies te maken:

- Toegewezen kaarten: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- Niet-toegewezen kaarten: `subagent:workboard-<boardId>-<cardId>` (de Gateway bepaalt
  de geconfigureerde standaardagent)

Als een werker niet kan worden gestart nadat een kaart is geclaimd, blokkeert Workboard de
kaart, wist het de claim, legt het de mislukte start van de uitvoering vast en voegt het een
werklogregel toe, die zichtbaar is in het dashboard, de CLI-JSON, agenttools en
kaartdiagnoses.

### Ingangspunten

- Dispatchactie in het dashboard
- `openclaw workboard dispatch`
- `/workboard dispatch` in een kanaal dat opdrachten ondersteunt

Alle drie gebruiken de subagentruntime van de Gateway wanneer de Gateway beschikbaar is. De
CLI heeft één terugvaloptie voor beheerders: als de Gateway-aanroep mislukt met een
verbindings-/onbeschikbaarheidsfout (of een `unknown method`-fout bij oudere
Gateways), er geen expliciet `--url`/`--token`-doel is opgegeven en er geen geconfigureerde externe
Gateway (`OPENCLAW_GATEWAY_URL` of `gateway.mode: remote`) van toepassing is, voert de CLI
een gegevensgerichte dispatch uit op de lokale SQLite-status. Deze kan afhankelijkheden promoveren,
verouderde claims opschonen en uitvoeringen met een verstreken tijdslimiet blokkeren, maar kan geen werkers starten. Authenticatie-,
toestemmings- en validatiefouten van een bereikbare Gateway worden niet als
onbeschikbaarheid behandeld; ze worden weergegeven als opdrachtfouten. Hetzelfde geldt voor elke Gateway-
fout wanneer een expliciet `--url`/`--token`-doel is opgegeven.

Bordmetadata kan `autoDecompose`, `autoDecomposePerDispatch`,
`defaultAssignee` en `orchestratorProfile` instellen. OpenClaw legt deze intentie vast en
stelt deze beschikbaar in de werkcontext; de daadwerkelijke specificatie/opsplitsing verloopt nog steeds
via de normale Workboard-tools.

## CLI en slashopdracht

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

Tekstuitvoer van `list` verbergt gearchiveerde kaarten standaard (`--include-archived`
overschrijft dit); `--json` bevat altijd gearchiveerde kaarten, overeenkomstig het contract voor volledige kaarten
dat bestaande scripts gebruiken. `show` accepteert een ondubbelzinnig id-voorvoegsel.
`list`, `create` en `show` lezen/schrijven de lokale Pluginstatus altijd rechtstreeks.
Alleen `dispatch` roept de actieve Gateway aan, met de hierboven beschreven terugvaloptie.

Zie [Workboard-CLI](/nl/cli/workboard) voor alle vlaggen, JSON-uitvoer, terugvalgedrag van de Gateway,
afhandeling van id-voorvoegsels, selectieregels voor dispatch en
probleemoplossing.

`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>`
en `/workboard dispatch` weerspiegelen de CLI. List en show zijn leesbewerkingen
voor elke geautoriseerde afzender van opdrachten. Create en dispatch vereisen de status van eigenaar op
chatoppervlakken, of een Gateway-client met `operator.write`/`operator.admin`.

## Synchronisatie van de sessielevenscyclus

Kaarten kunnen worden gekoppeld aan een bestaande dashboardsessie of aan een sessie die wordt aangemaakt wanneer je vanuit de kaart begint te werken. Gekoppelde kaarten tonen de levenscyclus van de sessie inline: actief, verouderd, gekoppeld inactief, voltooid, mislukt of ontbrekend. Je kunt ook een bestaande sessie vastleggen vanuit het tabblad Sessions met **Add to Workboard**; de kaart wordt aan die sessie gekoppeld, gebruikt het sessielabel of de recente gebruikersprompt als titel en vult, indien beschikbaar, de notities met de recente gebruikersprompt plus het nieuwste antwoord van de assistent.

Als de gekoppelde sessie ontbreekt, blijft de kaart voor context gekoppeld en biedt deze nog steeds startopties om opnieuw te beginnen in een nieuwe sessie. Als een actieve gekoppelde sessie geen recente activiteit meer rapporteert, markeert Workboard de kaart als `stale` en slaat dit op als metadata totdat de levenscyclus het wist.

Terwijl een kaart zich in een actieve werkstatus bevindt, volgt Workboard de gekoppelde sessie:

| Status van gekoppelde sessie          | Kaartstatus |
| ------------------------------------- | ----------- |
| actief                                | `running`   |
| voltooid                              | `review`    |
| mislukt, beëindigd, verlopen of afgebroken | `blocked`   |

**Handmatige beoordelingsstatussen hebben voorrang.** Als je een kaart naar `review`, `blocked` of `done` verplaatst, stopt de automatische synchronisatie voor die kaart totdat je deze terugverplaatst naar `todo` of `running`.

Bij het starten van een kaart worden normale Gateway-sessies gebruikt; Workboard slaat alleen kaartmetadata en koppelingen op. Het gesprekstranscript, de modelselectie en de levenscyclus van de uitvoering blijven onder beheer van het reguliere sessiesysteem. Gebruik **Stop** op een actieve gekoppelde kaart om de actieve uitvoering af te breken. Workboard markeert die kaart als `blocked`, zodat deze zichtbaar blijft voor opvolging.

Nieuwe kaarten kunnen worden gestart vanuit Workboard-sjablonen (`bugfix`, `docs`, `release`, `pr_review`, `plugin`). Sjablonen vullen de titel, notities, labels en prioriteit vooraf in; de sjabloon-id wordt opgeslagen als kaartmetadata.

## Dashboardwerkstroom

1. Open het tabblad Workboard in de Control UI.
2. Maak een kaart met een titel, notities, prioriteit, labels, een optionele agent en een optionele gekoppelde sessie, of open Sessions en kies **Add to Workboard** voor een bestaande sessie.
3. Sleep de kaart tussen kolommen of focus op de compacte statusbediening en gebruik het menu of ArrowLeft/ArrowRight.
4. Begin vanuit de kaart te werken om een dashboardsessie aan te maken of opnieuw te gebruiken.
5. Open de gekoppelde sessie vanuit de kaart terwijl de agent werkt.
6. Laat de levenscyclussynchronisatie actief werk naar `review`/`blocked` verplaatsen en verplaats de kaart vervolgens handmatig naar `done` wanneer deze is geaccepteerd.

## Diagnostiek

Diagnostiek wordt berekend op basis van lokale kaartmetadata. Ingebouwde controles signaleren:

| Soort                       | Voorwaarde                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | Toegewezen kaart met status `todo`/`backlog`/`ready` die al meer dan 1 uur niet is bijgewerkt. |
| `running_without_heartbeat` | Kaart met status `running` zonder claim-Heartbeat of uitvoeringsupdate gedurende meer dan 20 minuten. |
| `blocked_too_long`          | Kaart met status `blocked` die al meer dan 24 uur niet is bijgewerkt.           |
| `repeated_failures`         | Het bijgehouden aantal mislukkingen van de kaart is 2 of meer.                  |
| `missing_proof`             | Kaart met status `done` zonder bewijs, artefacten of bijlagen.                  |
| `orphaned_session`          | Kaart met status `running` met een `sessionKey`, maar zonder `execution`-metadata. |

## Machtigingen

Gateway-RPC-methoden vallen onder `workboard.*`:

| Bereik           | Methoden                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`, `cards.export`, `cards.diagnostics`, bijlagen weergeven/ophalen, meldingsgebeurtenissen lezen, `boards.list`, `cards.stats`, `cards.runs`                                                                                                                                                                                                                               |
| `operator.write` | `cards.diagnostics.refresh`, aanmaken/bijwerken/verplaatsen/verwijderen/reageren/koppelen/afhankelijkheid koppelen/bewijs/artefact, bijlage toevoegen/verwijderen, workerlogboek, protocolschending, claimen/Heartbeat/vrijgeven/promoveren/opnieuw toewijzen/terugvorderen/voltooien/blokkeren/deblokkeren, `cards.dispatch`, `cards.bulk`, archiveren, `boards.upsert`/`archive`/`delete`, `cards.specify`/`decompose`, meldingen abonneren/verwijderen/doorschuiven |

Geen enkele RPC-methode vereist `operator.admin`. Browsers die zijn verbonden met alleen-lezen operatortoegang kunnen het bord bekijken, maar kunnen kaarten niet wijzigen.

## Opslag

Workboard slaat duurzame gegevens op in een relationele SQLite-database die eigendom is van de Plugin, onder de statusmap van OpenClaw: borden, kaarten, labels, levenscyclusgebeurtenissen, uitvoeringspogingen, opmerkingen, afhankelijkheidskoppelingen, bewijs, artefactverwijzingen, metadata en binaire inhoud van bijlagen, diagnostiek, meldingen, workerlogboeken, protocolstatus en abonnementen bevinden zich allemaal in Workboard-tabellen (niet in sleutel-waarde-items van de Plugin). Een kaartexport behoudt het verhaal van het bord zonder de binaire inhoud van bijlagen inline op te nemen.

Installaties die Workboard in de `.28`-release hebben gebruikt, kunnen `openclaw doctor --fix` uitvoeren om de uitgebrachte verouderde naamruimten voor Plugin-status (`workboard.cards`, `workboard.boards`, `workboard.notify` en, indien aanwezig, `workboard.attachments`) naar de relationele database te migreren.

## Probleemoplossing

**Het tabblad meldt dat Workboard niet beschikbaar is**

```bash
openclaw plugins inspect workboard --runtime --json
```

Als `plugins.allow` is geconfigureerd, voeg je `workboard` eraan toe. Als `plugins.deny` `workboard` bevat, verwijder je dit voordat je de Plugin inschakelt.

**Kaarten worden niet opgeslagen**

Controleer of de browserverbinding `operator.write`-toegang heeft. Alleen-lezen operatorsessies kunnen kaarten weergeven, maar kunnen ze niet aanmaken, bewerken, verplaatsen of verwijderen.

**Bij het starten van een kaart wordt niet de verwachte sessie geopend**

Controleer de agent-id en gekoppelde sessie van de kaart en open vervolgens Sessions of Chat om de daadwerkelijke uitvoeringsstatus te bekijken.

**Verzending start geen worker**

Controleer of er ten minste één kaart met status `ready` zonder actieve claim is:

```bash
openclaw workboard list --status ready
```

Als de CLI meldt dat verzending alleen gegevens verwerkt, start of herstart je de Gateway en probeer je het opnieuw. Verzending die alleen gegevens verwerkt, werkt de lokale bordstatus bij, maar kan geen uitvoeringen van subagent-workers starten. Kaarten kunnen ook worden overgeslagen wanneer een andere kaart voor dezelfde eigenaar of agent al wordt uitgevoerd of op beoordeling wacht; voltooi, blokkeer of geef dat actieve werk vrij voordat je meer werk voor dezelfde eigenaar verzendt.

## Gerelateerd

- [Control UI](/nl/web/control-ui)
- [Workboard-CLI](/nl/cli/workboard)
- [Plugins](/nl/tools/plugin)
- [Plugins beheren](/nl/plugins/manage-plugins)
- [Sessies](/nl/concepts/session)
