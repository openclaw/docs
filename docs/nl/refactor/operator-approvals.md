---
read_when:
    - De levenscyclus, opslag, het protocol of de autorisatie voor exec- of Plugin-goedkeuringen wijzigen
    - Goedkeuringslinks of systeemeigen goedkeuringsopties aan een kanaal toevoegen
    - Goedkeuringen van onderliggende sessies weergeven in bovenliggende weergaven of orchestratorweergaven
summary: Ontwerp voor duurzame goedkeuringen met directe links in de Control UI, native apps, kanalen en bovenliggende sessies
title: Goedkeuringen door operators op meerdere interfaces
x-i18n:
    generated_at: "2026-07-16T16:23:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9defdaada1911df1184f64429e1787c4881e735c433d6dbc30a5946e11cc7cce
    source_path: refactor/operator-approvals.md
    workflow: 16
---

# Goedkeuringen door operators via meerdere oppervlakken

Dit ontwerp volgt [#103505](https://github.com/openclaw/openclaw/issues/103505). Het vervangt proceslokale goedkeuringsbevoegdheid door één door de Gateway beheerde, op SQLite gebaseerde levenscyclus. Elke door de Gateway beheerde goedkeuring voor exec of een plugin/tool krijgt één stabiele ID, één geauthenticeerde Control UI-route, atomische afhandeling waarbij het eerste antwoord wint, en alleen-voor-operatorsprojecties naar de bron- en bovenliggende sessiestromen.

Inlineacties en deeplinks bestaan naast elkaar. Er is geen schakelaar voor de goedkeuringsmodus.

## Doelen

- Eén duurzaam goedkeuringsobject voor exec- en plugin/tool-poorten.
- Stabiele `${controlUiBasePath}/approve/{approvalId}`-route.
- Afhandeling vanuit elke geautoriseerde Control UI, native app of elk kanaaloppervlak.
- Atomisch gedrag waarbij het eerste antwoord wint over gelijktijdige oppervlakken heen.
- Identieke herhaalde pogingen zijn idempotent; conflicterende late antwoorden kunnen de winnaar niet overschrijven.
- Time-out, onjuist gevormde vertrouwde uitspraken, ontbrekende routes, annulering en herstart weigeren standaard toegang.
- Aanvraag- en eindgebeurtenissen bereiken de bronsessie en alle relevante bovenliggende/orchestrator-eigenaren.
- Kanalen ontvangen getypeerde goedkeurings- en navigatieacties; callbackgegevens van het transport blijven kanaalprivé.
- Bestaande Gateway-methoden voor exec/plugins blijven compatibel terwijl hun implementatie naar één service convergeert.

## Geen doelen

- De geblokkeerde tooluitvoering zelf persistent maken of hervatten na een herstart van de Gateway.
- Van een goedkeurings-ID of URL een bearerreferentie maken.
- Goedkeuringsprompts toevoegen aan voor het model zichtbare transcripties of bovenliggende agents activeren.
- Goedkeuringsbeleid, productopdrachten of autorisatie van beoordelaars naar kanaalplugins verplaatsen.
- Goedkeuringsstatus per kanaal, apparaat of bovenliggende entiteit klonen.
- Exec-toelatingslijsten, samenstelling van pluginbeleid of persistentie van `allow-always` opnieuw ontwerpen, behalve waar dat nodig is om eindresultaten ondubbelzinnig te maken.
- Een gatewayloze ingebedde TUI in de eerste increment op afstand bereikbaar maken. Deze blijft uitsluitend lokaal en moet standaard toegang weigeren wanneer er geen beoordelaar bestaat.

## Basislijn vóór uitrol en bewijskaart

Deze tabel legt de implementatiestatus vast van het moment waarop #103505 werd geopend. De onderstaande uitrolsecties volgen het duurzame register, getypeerde acties, de deeplinkpagina en incrementen voor native clients die boven op deze basislijn zijn gebouwd.

| Oppervlak         | Baseline-entrypoint en eigenaar                                                                                                                                | Baselinegedrag en tekortkoming                                                                                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agent-exec        | `src/agents/bash-tools.exec-approval-request.ts`, `src/agents/bash-tools.exec-host-shared.ts`                                                                   | Tweefasige registratie van `exec.approval.*` voorkomt een vroege race met `/approve`, maar een time-out kan via `askFallback` nog steeds in toestaan resulteren.                           |
| Plugin-toolpoort  | `src/agents/agent-tools.before-tool-call.ts`                                                                                                                    | Vraagt `plugin.approval.*` aan; `timeoutBehavior: "allow"` kan een poort na een time-out goedkeuren. De ingebedde modus heeft afzonderlijke proceslokale bevoegdheid in `src/infra/embedded-plugin-approval-broker.ts`. |
| Plugin-nodepoort  | `src/gateway/node-invoke-plugin-policy.ts`                                                                                                                      | Maakt rechtstreeks via de pluginmanager aan en zendt uit, waardoor een deel van de levenscyclus van de servermethode wordt gedupliceerd.                                                     |
| Gateway-bevoegdheid | `src/gateway/server-aux-handlers.ts`, `src/gateway/exec-approval-manager.ts`, `src/gateway/server-methods/approval-shared.ts`                                   | Afzonderlijke exec- en pluginmanagers gebruiken proceslokale maps. Eindvermeldingen blijven 15 seconden bestaan. Het eerste antwoord wint alleen binnen één proces.                          |
| Gateway-protocol  | `packages/gateway-protocol/src/schema/exec-approvals.ts`, `packages/gateway-protocol/src/schema/plugin-approvals.ts`, `src/gateway/methods/core-descriptors.ts` | Exec heeft `get` uitsluitend voor openstaande items; de plugin heeft geen `get`; er bestaat geen soortonafhankelijke eindopzoeking voor een deeplink.                                 |
| Levering          | `src/infra/exec-approval-channel-runtime.ts`, `src/infra/approval-native-runtime.ts`, `src/infra/approval-handler-runtime.ts`                                   | Ondersteunt routering naar de oorsprong, DM's aan goedkeurders, herhaling van openstaande items, native handlers en eindopschoning binnen het proces. Een afzonderlijke vervolgwijziging voegt duurzame eindreconciliatie toe. |
| Overdraagbare acties | `src/interactive/payload.ts`, `src/plugin-sdk/interactive-runtime.ts`, `src/plugin-sdk/approval-reply-runtime.ts`                                               | Goedkeuringsknoppen zijn opdrachtacties die `/approve ...` bevatten; URL- en Web App-doelen zijn ongetypeerde knopvelden.                                                                      |
| Telegram          | `extensions/telegram/src/approval-handler.runtime.ts`, `extensions/telegram/src/button-types.ts`                                                                | De renderer parseert opdrachttekst om goedkeuringssemantiek te herkennen voordat private callbackgegevens worden geproduceerd.                                                               |
| Control UI        | `ui/src/app/exec-approval.ts`, `ui/src/app/overlays.ts`, `ui/src/components/exec-approval.ts`                                                                   | De goedkeuringsinterface is een globale modal. `ui/src/app-route-paths.ts` en `ui/src/app-routes.ts` gebruiken exacte routes en herschrijven onbekende paden naar Chat.                      |
| Sessie-eigenaarschap | `src/agents/subagent-registry.types.ts`, `src/agents/subagent-registry-read.ts`, `src/config/sessions/types.ts`                                                 | Eigenaarschap via controller, aanvrager, expliciete bovenliggende entiteit en oudere spawn bestaat, maar goedkeuringsgebeurtenissen worden niet naar die sessiestromen geprojecteerd.          |
| Gedeelde status   | `src/state/openclaw-state-schema.sql`, `src/state/openclaw-state-db.ts`                                                                                         | Bestaande onmiddellijke transacties en voorwaardelijke Kysely-updates ondersteunen duurzame compare-and-set in `state/openclaw.sqlite`.                                                        |

Representatieve huidige tests omvatten `src/gateway/exec-approval-manager.test.ts`, `src/gateway/server-methods/approval-shared.test.ts`, `src/agents/bash-tools.exec-gateway-approval.e2e.test.ts`, `extensions/telegram/src/approval-handler.runtime.test.ts` en `ui/src/e2e/approval-flow.e2e.test.ts`.

De plugin-SDK blijft de enige grens voor kanalen/plugins. Wijzigingen aan de goedkeuringsruntime en -presentatie moeten via de bestaande subpaden `src/plugin-sdk/approval-*.ts` en `src/plugin-sdk/interactive-runtime.ts` worden geëxporteerd; productiecode van plugins mag geen interne onderdelen van de Gateway importeren.

## Eerdere voorbeelden

Omnigent biedt nuttige UX- en foutsemantiek:

- [`approval.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/runtime/policies/approval.py) parkeert ASK, past time-outs per beleid toe en behandelt alleen een exacte acceptatie als goedkeuring.
- [`sessions.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/routes/sessions.py) bevat de serverzijdige native harness-poort en de projectie van aanvragen/afhandelingen naar bovenliggende entiteiten.
- [`ApprovePage.tsx`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/web/src/pages/ApprovePage.tsx) biedt de zelfstandige mobiele goedkeuringspagina.

Neem de bewering over opslag niet kritiekloos over. De huidige actieve openstaande status is proceslokaal in [`_elicitation_registry.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/_elicitation_registry.py), en de ongebruikte tabel voor openstaande items wordt verwijderd door [`e3b1f2a4c9d7_drop_pending_tool_calls_table.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/db/migrations/versions/e3b1f2a4c9d7_drop_pending_tool_calls_table.py). OpenClaw gaat bewust verder: SQLite is gezaghebbend en elke eindovergang is een compare-and-set in de database.

## Architectuur en eigenaarschap

De Gateway beheert de levenscyclus:

1. Een agent, pluginhook of nodebeleid levert een soortspecifieke aanvraag en proceslokale uitvoeringsbinding.
2. De Gateway valideert deze en bouwt een opgeschoonde projectie voor beoordelaars.
3. De goedkeuringsservice berekent een publiek van bron/eigenaren, voegt de canonieke rij in en registreert vervolgens de waiter binnen het proces.
4. Na duurzame invoeging publiceert de Gateway bestaande goedkeuringsgebeurtenissen, sessieprojecties, kanaalmeldingen en native pushmeldingen.
5. Elk oppervlak handelt af via dezelfde service.
6. De service legt één eindovergang vast, activeert de runtime-waiter en publiceert eindprojecties.
7. Een mislukte gebeurtenislevering draait de vastgelegde beslissing nooit terug; clients herstellen via `approval.get` of herhaling van de lijst.

Eigenaarschapsgrenzen:

- `src/gateway/`: goedkeuringsservice, autorisatie, RPC-adapters, URL-opbouw, waiterlevenscyclus en publicatie van gebeurtenissen.
- `src/state/`: gedeeld schema en gegenereerde Kysely-typen.
- `src/infra/`: opgeschoonde goedkeuringsweergavemodellen en opbouw van overdraagbare presentaties.
- `src/agents/`: het geretourneerde oordeel aanvragen, afwachten en toepassen; geen persistentie.
- `src/channels/` en `extensions/*`: getypeerde acties renderen, kanaalgebruikers autoriseren, private callbacks coderen en geleverde bedieningselementen bijwerken.
- `src/plugin-sdk/`: uitsluitend openbare goedkeurings- en presentatiecontracten.
- `ui/`: zelfstandige pagina en bestaande clients voor wachtrij/modal.

De waiter binnen het proces is een meldingsmechanisme, geen autoriteit. Registratie voegt de rij in en installeert de waiter synchroon voordat de aanvraag wordt gepubliceerd, zodat een afhandelaar niet tussen die stappen kan worden ingevoegd. Elke latere afhandelaar legt eerst via SQLite vast voordat die waiter wordt afgehandeld.

## Persistente record

Voeg één tabel `operator_approvals` toe aan de gedeelde statusdatabase.

| Kolom                                             | Doel                                                                                                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval_id`                                      | Wereldwijd unieke canonieke ID. Behoud bestaande uitvoerings-ID's en `plugin:`-ID's voor protocolcompatibiliteit, maar leid het type nooit af uit het voorvoegsel.      |
| `resolution_ref`                                   | Unieke volledige SHA-256-base64url-locator voor transportcallbacks die de canonieke ID niet kunnen bevatten. Dit is geen autorisatie of ID voor een openbare URL. |
| `kind`                                             | Gesloten `exec \| plugin`-discriminator.                                                                                                        |
| `status`                                           | Gesloten `pending \| allowed \| denied \| expired \| cancelled`-status.                                                                          |
| `presentation_json`                                | Gevalideerde, van een typetag voorziene reviewerprojectie. Onbewerkte runtimeverzoeken, opdrachtbindingen en callbackpayloads blijven proceslokaal.               |
| `source_agent_id`, `source_session_key`            | Bronidentiteit en anker voor de sessieprojectie. De sessiesleutel is duurzaam; de roterende sessie-UUID niet.                                          |
| `audience_session_keys_json`                       | Geordende, gededupliceerde JSON-array die wordt geproduceerd door de begrensde breedte-eerst-doorloop van het eigenaarschap. Aangevraagde en terminale gebeurtenissen gebruiken dezelfde momentopname. |
| `requested_by_device_id`, `requested_by_client_id` | Duurzame metadata van de aanvrager en voor auditing. De verbindings-ID blijft in het geheugen en is geen principal voor meerdere oppervlakken.                                         |
| `reviewer_device_ids_json`                         | Optionele, expliciet aangewezen reviewerapparaten die uitsluitend door de vertrouwde goedkeuringsruntime worden aangeleverd.                                                  |
| `runtime_epoch`                                    | Procestijdperk dat eigenaar is van de geparkeerde uitvoering; wordt gebruikt om verweesde rijen na een herstart te annuleren.                                                     |
| `created_at_ms`, `expires_at_ms`, `updated_at_ms`  | Gezaghebbende tijdgegevens.                                                                                                                         |
| `decision`                                         | Expliciete gebruikersbeslissing wanneer die bestaat.                                                                                                       |
| `terminal_reason`                                  | Gesloten reden, zoals `user`, `timeout`, `malformed-verdict`, `no-route`, `run-aborted` of `gateway-restart`.                                |
| `resolved_at_ms`, `resolver_kind`, `resolver_id`   | Winnaar en auditidentiteit worden aan de serverzijde bewaard. Reviewerprojecties laten onbewerkte resolver-ID's weg.                                           |
| `consumed_at_ms`, `consumed_by`                    | Afzonderlijke replaybeveiliging voor `allow-once`; consumeren mag de vastgelegde beslissing niet wissen.                                                       |

Vereiste indexen:

| Index                                      | Doel                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| unieke `(resolution_ref)`                  | Weiger ambiguïteit tussen `approval_id`/`resolution_ref` in verschillende kolommen tijdens het invoegen. |
| `(status, expires_at_ms)`                  | Zoek wachtende goedkeuringen en stem gezaghebbende deadlines af.               |
| `(source_session_key, created_at_ms DESC)` | Speel recente goedkeuringen voor één bronsessie opnieuw af.                             |
| `(resolved_at_ms)`                         | Verwijder bewaarde terminale goedkeuringen volgens het vaste bewaarbeleid.  |

Doelgroep-arrays zijn klein en begrensd. Op sessie gefilterde replay selecteert eerst zichtbare wachtende rijen via Kysely en decodeert en filtert daarna de begrensde doelgroep-arrays in de applicatiecode; hierbij worden geen tekenreeksovereenkomsten of onbewerkte SQL-JSON-query's gebruikt.

Bewaar terminale rijen 30 dagen, in overeenstemming met de bewaring van auditmetadata in `src/audit/audit-event-store.ts`. Opschonen is vast onderhoudsbeleid, geen nieuw configuratieoppervlak. De database is privéstatus van het lokale besturingsvlak, maar reviewer-API's mogen nooit het volledige opgeslagen verzoek of de runtimebinding blootstellen.

## Toestandsmachine en vergelijken-en-instellen

Alleen deze overgangen zijn geldig:

- `pending -> allowed`: expliciete `allow-once` of `allow-always`.
- `pending -> denied`: expliciete weigering, vertrouwd ongeldig terminaal oordeel of geen afleveringsroute.
- `pending -> expired`: gezaghebbende deadline bereikt.
- `pending -> cancelled`: afbreken van de uitvoering, ordelijk afsluiten of herstel van verweesde gegevens na een herstart.

Elke niet-toegestane terminale status heeft als effectief oordeel weigeren.

Afhandeling gebruikt één onmiddellijke SQLite-transactie en een voorwaardelijke Kysely-update die gelijkwaardig is aan:

```sql
UPDATE operator_approvals
SET status = ?, decision = ?, terminal_reason = ?, resolved_at_ms = ?
WHERE approval_id = ?
  AND status = 'pending'
  AND expires_at_ms > ?;
```

Als de update geen rij beïnvloedt, leest dezelfde transactie de record:

- Ontbrekend of niet-geautoriseerd: retourneer niet gevonden; onthul het bestaan niet.
- Nog steeds wachtend, maar de deadline is bereikt: stel de status met vergelijken-en-instellen in op `expired` en retourneer vervolgens die terminale rij.
- Dezelfde vastgelegde beslissing: retourneer idempotent succes met de vastgelegde winnaar.
- Andere beslissing: de uniforme API retourneert `applied: false` met de vastgelegde winnaar; verouderde adapters behouden `APPROVAL_ALREADY_RESOLVED` waar hun uitgebrachte contract dit vereist.
- Elke terminale status: wijzig deze nooit.

`now == expires_at_ms` is verlopen. De tijd van de Gateway is gezaghebbend.

De uitvoering van `allow-once` gebruikt een tweede CAS over `consumed_at_ms IS NULL`, gebonden aan de bestaande exacte context van de opdracht/systeemuitvoering. De goedkeuringsrij blijft na consumptie als auditrecord bestaan.

Ongeldige HTTP-/RPC-invoer die niet kan worden geauthenticeerd of geen goedkeuring kan identificeren, wordt zonder wijziging geweigerd en kan nooit goedkeuren. Een ongeldig terminaal oordeel dat van een vertrouwde harness/wachter voor een bekende goedkeuring wordt ontvangen, gaat over naar `denied`.

## Gateway-API

Voeg type-onafhankelijke reviewermethoden toe:

| Methode                                    | Contract                                                                                                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval.get { id }`                     | Retourneert een zichtbare wachtende of bewaarde terminale projectie.                                                                                                                                                          |
| `approval.resolve { id, kind, decision }` | Accepteert de canonieke ID of transportreferentie met vaste grootte en voert vervolgens autorisatie, validatie van type en toegestane beslissing, afstemming van deadlines en terminale CAS uit. Het antwoord bevat altijd de canonieke ID. |

Retourneer na een geslaagde CAS onmiddellijk de vastgelegde projectie. Verouderde gebeurtenissen, kanaaldoorstuurders en push-terminaliseerders zijn vervolgstappen op basis van beste inspanning; een traag of mislukt oppervlak mag het winnende antwoord niet vertragen of terugdraaien.

Typespecifieke verzoekvalidatie blijft in `exec.approval.request` en `plugin.approval.request`. Bestaande `exec.approval.get/list/waitDecision/resolve` en `plugin.approval.list/waitDecision/resolve` worden adapters op de protocolgrens naar de canonieke service, omdat ze deel uitmaken van de uitgebrachte Gateway-API. Interne aanroepers migreren in dezelfde wijziging naar de service.

Een reviewerprojectie is een getagde union:

```ts
type OperatorApproval = {
  id: string;
  status: OperatorApprovalStatus;
  presentation:
    | { kind: "exec"; commandText: string /* veilige uitvoeringsvoorvertoning */ }
    | { kind: "plugin"; title: string; description: string /* veilige Plugin-voorvertoning */ };
  // gemeenschappelijke levenscyclusvelden
};
```

Het stabiele pad wordt afgeleid en niet opgeslagen. `approval.get` retourneert `urlPath`; oppervlakken die een goedgekeurde openbare oorsprong kennen, kunnen ook een absolute `url` ontvangen. Reviewermomentopnamen laten bron- en doelgroepsessiesleutels weg. De Gateway bewaart die routeringssleutels aan de serverzijde voor de afzonderlijke `session.approval`-projectie.

## Gebeurtenissen en overdraagbare acties

PR 1 behoudt de uitgebrachte gebeurtenisnamen, payloads en bestaande ontvangersfilters op recordniveau:

- `exec.approval.requested`
- `exec.approval.resolved`
- `plugin.approval.requested`
- `plugin.approval.resolved`

Die verouderde gebeurtenissen kunnen het volledige runtimeverzoek bevatten en mogen daarom niet naar elke goedkeuringsspecifieke client worden uitgezonden. PR 5 voegt getagde levenscyclusvelden (`status`, `sourceSessionKey`, `urlPath`, terminale metadata en een `kind` op presentatieniveau) toe via de opgeschoonde levenscyclusprojectie, in plaats van de aflevering van verouderde gebeurtenissen uit te breiden.

Voeg een goedkeuringsspecifieke `session.approval`-projectiegebeurtenis toe. Publiceer de canonieke gebeurtenis eenmaal met de opgeslagen doelgroepsleutels; abonnees met een exacte sessie ontvangen dezelfde gebeurtenis voor elke overeenkomende sleutel:

- `sessionKey`: stream die de projectie ontvangt.
- `sourceSessionKey`: kind/bron die de controle heeft geactiveerd.
- `phase`: `pending \| terminal`, gediscrimineerd ten opzichte van de goedkeuringsstatus.
- één veilige `OperatorApproval`-projectie.

Clients melden zich aan met `sessions.messages.subscribe { key, agentId?, includeApprovals: true }`. Het geslaagde antwoord voegt een `approvalReplay` toe met maximaal 1.000 huidige wachtende goedkeuringen voor precies die streamsleutel waarvoor de abonnerende client ook op recordniveau geautoriseerd is om ze te beoordelen. `truncated: false` maakt de gefilterde replay gezaghebbend en clients die opnieuw verbinding maken, vervangen hun lokale wachtende set hiermee; `truncated: true` is een overbelastingssignaal en clients moeten ongeziene lokale vermeldingen behouden totdat een canonieke zoekactie of latere levenscyclusgebeurtenissen ze afhandelen. Een later ontdekte duurzame time-out tijdens replay zendt terminale tombstones alleen uit naar geabonneerde, op recordniveau geautoriseerde doelgroepen voordat de nieuwe momentopname wordt geretourneerd. `operator.admin` kan zich rechtstreeks aanmelden; beperktere clients vereisen zowel een gekoppelde apparaatidentiteit als `operator.approvals`. Alleen een sessieabonnement verleent nooit zichtbaarheid van goedkeuringen.

Registreer de gebeurtenis onder `operator.approvals` in `src/gateway/server-broadcast.ts`. De projectie is observerend: deze voegt nooit transcriptierijen toe, verzendt geen `sessions.changed` en wekt geen agent.

Breid `MessagePresentationAction` uit in `src/interactive/payload.ts`:

```ts
type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string }
  | {
      type: "approval";
      approvalId: string;
      approvalKind: "exec" | "plugin";
      decision: ExecApprovalDecision;
    }
  | { type: "url"; url: string }
  | { type: "web-app"; url: string };
```

Core bouwt getypeerde beslissingsacties en een afzonderlijke link voor beoordeling wanneer een goedgekeurde absolute oorsprong van de Control UI beschikbaar is. Kanalen coderen een goedkeuringsactie in hun eigen callback-indeling en sturen de afhandeling naar de canonieke service. Een callback gebruikt de exacte canonieke ID wanneer die past; anders gebruikt deze de unieke volledige digest `resolution_ref` van de rij. De referentie is slechts een compacte opzoeksleutel: normale Gateway-authenticatie, recordautorisatie, expliciet type, validatie van toegestane beslissingen, afstemming van deadlines en CAS voor het eerste antwoord blijven van toepassing. Kanalen mogen ID's niet afkappen, hashvoorvoegsels niet omzetten, `/approve`-tekst niet parsen en het type niet afleiden uit een ID-voorvoegsel.

Behoud `button.url`, `button.webApp` en opdrachtgestuurde goedkeuringsbesturingselementen als verouderde compatibiliteitsinvoer voor de plugin-SDK. Normaliseer ze bij de SDK-grens; migreer elke gebundelde interne aanroeper in dezelfde PR. `/approve {id} {decision}` blijft een tekstuele terugvaloptie en CLI-/chatopdracht, niet het semantische contract voor knoppen.

## Control UI

De route is `${basePath}/approve/{approvalId}`. De ID is de enige padparameter; de identiteit van de bronsessie is afkomstig uit het record.

Omdat de huidige router exacte statische routes heeft en onbekende paden naar Chat herschrijft, moet deze deeplink in `ui/src/app/bootstrap.ts` worden gedetecteerd vóór de normale routenormalisatie. Hergebruik de normale Gateway-/authenticatieconfiguratie, maar render een zelfstandige goedkeuringspagina buiten de zijbalkshell en het globale modale venster.

Het document is eigendom van de Gateway die de URL heeft aangeboden. De initiële verbinding negeert de opgeslagen selectie van een externe Gateway van de volledige app zonder de instellingen van die selectie te wijzigen of te kopiëren; alleen authenticatie blijft sessiegebonden aan de aanbiedende Gateway. Vertrouwde native authenticatie of een afzonderlijk bevestigde `gatewayUrl`-overschrijving mag de verbinding op een ander doel richten. De core reserveert de éénsegmentnaamruimte `/approve` vóór plugin-HTTP-routes en detectie van statische extensies, inclusief ID's die eindigen op `.json` of `.js`; wanneer het aanbieden van de Control UI is uitgeschakeld, wordt de gereserveerde route fail-closed afgewezen met `404`. Houd de pagina in de hoofdbundel van de Control UI, zodat een mislukte lazy chunk een beveiligingsbeslissing niet laat vastlopen op een laadindicator.

Paginastatussen:

- laden
- authenticatie vereist
- in behandeling
- wordt afgehandeld
- hier goedgekeurd of geweigerd
- elders afgehandeld
- verlopen
- geannuleerd
- verboden/niet gevonden
- verbindingsfout met opnieuw proberen

De pagina roept Gateway-RPC aan, niet een tweede niet-geauthenticeerde REST-API. Bij het vernieuwen van de browser wordt de duurzame status opnieuw gelezen. Gateway-inloggegevens worden nooit in de URL, query of fragment geplaatst.

## Autorisatie en privacy

De URL is een locatieaanduiding, geen bevoegdheid. Afhandeling vereist:

1. geauthenticeerde Gateway-verbinding;
2. `operator.approvals` of `operator.admin`;
3. autorisatie van de beoordelaar op recordniveau.

Regels op recordniveau:

- `operator.admin` mag beoordelen.
- `reviewer_device_ids` is leidend wanneer deze aanwezig is. Alleen een vermeld gekoppeld
  `operator.approvals`-apparaat mag beoordelen; het aanvragende apparaat heeft geen impliciete
  toegang, tenzij het ook is vermeld.
- Zonder een expliciete lijst met beoordelaars mag het aanvragende gekoppelde
  `operator.approvals`-apparaat zijn eigen record beoordelen.
- Echte verouderde records zonder binding aan een aanvrager of beoordelaar behouden brede
  zichtbaarheid voor gekoppelde apparaten, zodat upgrades reeds lopend werk niet laten vastlopen.
- Interne runtimes zonder apparaat mogen via de bereikgebonden
  goedkeuringsruntimeverbinding wel afhandelen, maar niet lezen. Die bevoegdheid is uitsluitend afkomstig van het
  door de server geauthenticeerde runtimetoken; openbare `approval.resolve`-velden kunnen
  dit niet aanmaken.
- Eigenaarschap van de liveverbinding van de aanvrager blijft geldig voor verouderde adapters; dit wordt
  nooit afgeleid uit een overeenkomende clientnaam.
- Lidmaatschap van het publiek verandert alleen de presentatie. Het verruimt nooit de autorisatie.

`approval.get` stelt alleen de opgeschoonde projectie voor beoordelaars beschikbaar en laat interne routeringssleutels voor bron/publiek weg. De PR 5-gebeurtenis `session.approval` bevat de ene bestemming `sessionKey` plus `sourceSessionKey` nadat de Gateway de opgeslagen momentopname van het publiek aan de serverzijde heeft toegepast. Bestaande exec-/plugin-gebeurtenissen behouden hun historische payload en beperkte ontvangers totdat consumenten migreren. Het uitvoerbare verzoek, de opdrachtbinding en de voortzetting blijven uitsluitend in de proceslokale waiter. De duurzame rij bevat de veilige presentatie plus levenscyclus-, routerings- en auditmetadata; deze slaat nooit onbewerkte omgevingswaarden, inloggegevens, authenticatieheaders of kanaalcallbackgegevens op.

## Publieksprojectie

Bereken het publiek eenmaal vóór het invoegen en sla de geordende momentopname op. Eigenaarschap is een graaf, niet altijd één enkele bovenliggende keten: een child kan zowel een huidige controller als een oorspronkelijke aanvrager hebben, en die eigenaren kunnen naar verschillende roots leiden.

Gebruik een deterministische breedte-eerst-doorloop:

1. Plaats de bronsessiesleutel als eerste in de wachtrij.
2. Lees voor elke uit de wachtrij gehaalde sleutel de nieuwste rij uit het subagentregister en voeg beide afzonderlijke eigenaarschapsranden in vaste volgorde aan de wachtrij toe: `controllerSessionKey`, daarna `requesterSessionKey`.
3. Wanneer een bruikbare registerrij bestaat, volg dan niet ook de afstamming van sessie-items, die na bijsturing verouderd kan zijn. Voeg anders de ene huidige terugvalrand `parentSessionKey ?? spawnedBy` aan de wachtrij toe.
4. Normaliseer en dedupliceer bij het toevoegen aan de wachtrij, zodat het eerste, kortste pad wint.
5. Stop bij 64 unieke sleutels; deze limiet voor de publieksgrootte begrenst ook de doorloopdiepte.

De registerbron is `src/agents/subagent-registry-read.ts`; eigenschapsvelden zijn gedefinieerd in `src/agents/subagent-registry.types.ts`. Terugvalvelden voor sessies zijn gedefinieerd in `src/config/sessions/types.ts`.

Aangevraagde en terminale projecties gebruiken hetzelfde opgeslagen publiek, zelfs als het eigenaarschap van focus/controller verandert terwijl de goedkeuring in behandeling is. Dit garandeert terminale opschoning voor elke sessiestroom van het publiek die de aanvraagprojectie heeft ontvangen. Afhandeling is altijd gericht op de bron-ID van de goedkeuring; publiekssessies ontvangen nooit een gekloonde goedkeuringsstatus. Het opschonen van doorgestuurde kanaalberichten blijft de afzonderlijke follow-up met bezorgingslocator hieronder.

Schrijf niet uitsluitend voor een goedkeuring transcriptberichten, injecteer geen systeemprompts, start geen beurten van eigenaren en zend geen `sessions.changed` uit.

## Convergentie van afgeleverde oppervlakken

Native goedkeuringshandlers bewaren hun afgeleverde berichtitems al lang genoeg om actieve besturingselementen te vervangen of buiten gebruik te stellen. Generieke doorgestuurde goedkeuringsberichten verwijderen momenteel de `MessageReceipt`, waardoor een beslissing op een ander oppervlak hun oude besturingselementen ten onrechte als in behandeling kan blijven tonen. Een afzonderlijke follow-up dicht dit gat met een child-tabel `operator_approval_deliveries` in de gedeelde statusdatabase.

Elke rij bevat de goedkeurings-ID, een unieke bezorgings-ID, kanaal/account/exacte route, een begrensde en via JSON gevalideerde kanaalprivé-berichtlocator, bezorgingstijdstempels en terminalisatiestatus. Deze bevat nooit callbackgegevens, beslissingstokens of onbewerkte goedkeuringsverzoeken. Het kanaal is eigenaar van de codering van locators en de mutatie van berichten; core is eigenaar van de canonieke status, doelselectie, het beleid voor opnieuw proberen en de terminale terugvaltekst.

Bezorgingsregistratie en terminale afhandeling verlopen veilig bij gelijktijdigheid:

1. Voeg nadat een verzending in behandeling een ontvangstbewijs retourneert de bezorgingslocator toe en lees de status van de bovenliggende goedkeuring in één transactie.
2. Als de bovenliggende goedkeuring al terminaal is, plan dan onmiddellijke terminalisatie in in plaats van de late bezorging in behandeling te laten.
3. Elke vastgelegde terminale overgang plant afzonderlijk alle nog niet afgeronde bezorgingsrijen in; verwijderbare broadcasts zijn niet de trigger.
4. Een kanaalterminalisator rapporteert `replaced`, `retired` of `unsupported`. Vervangen onderdrukt een dubbel terminaal bericht; buiten gebruik gesteld verzendt de bestaande terminale follow-up; niet ondersteund of een fout valt terug zonder de CAS van de goedkeuring terug te draaien.
5. Bij het opstarten worden terminale goedkeuringen met onvoltooide bezorgingen opnieuw geprobeerd, waardoor opschoning bestand is tegen een herstart van de Gateway.

Deze transportlevenscyclus is een optionele hook voor bezorgingsadapters, geen renderer of modelgerichte berichtactie. QQ C2C-/groepsberichten hebben momenteel geen API voor bewerken, verwijderen of wissen van het toetsenbord; die adapter blijft niet ondersteund en kan pas na een latere klik de canonieke waarheid tonen, totdat het transport een mutatie-API krijgt.

## Semantiek voor herstarten, time-outs en routes

SQLite-persistentie impliceert geen hervatting van de uitvoering. Opdracht-/toolbindingen blijven in het geheugen, omdat ze beveiligingsgevoelige runtimefeiten kunnen bevatten en geen contract voor hervatbare taken vormen.

Bij het opstarten van de Gateway:

- genereer een nieuw runtime-epoch;
- zet rijen die in behandeling zijn uit oudere epochs atomair om naar `cancelled` met reden `gateway-restart`;
- behoud rijen zodat hun URL's uitleggen wat er is gebeurd;
- voer een latere goedkeuring nooit uit tegen een ontbrekende runtimebinding.

Timers zijn optimalisaties voor het activeren. De deadlinebevoegdheid wordt opgeslagen `expires_at_ms`; lees-, wacht- en afhandelingsbewerkingen voeren allemaal afstemming van verlopen deadlines uit.

Definitief strikt gedrag:

- time-out -> `expired`, weigeren;
- geen route -> `denied`, weigeren;
- afbreken van uitvoering -> `cancelled`, weigeren;
- ongeldig vertrouwd oordeel -> `denied`, weigeren;
- alleen een toegestane expliciete toestemmingsbeslissing -> `allowed`.

Het momenteel uitgebrachte exec-gedrag is nog steeds in strijd met dit contract:

- `src/agents/bash-tools.exec-host-shared.ts` kan `askFallback` toepassen.
- `docs/tools/exec-approvals.md` en `docs/cli/approvals.md` documenteren dat oppervlak.

Plugin-goedkeuringen worden nu fail-closed afgewezen bij time-outs en ongeldige oordelen; het verouderde
veld `timeoutBehavior` blijft geaccepteerd, maar wordt genegeerd. De follow-up voor
strikte exec-semantiek moet code, typen, documentatie, tests en changelog gezamenlijk bijwerken, met
expliciete beoordeling door eigenaar/beveiliging. `askFallback` mag tijdens de migratie
de beleidsselectie vóór de gate blijven beschrijven, maar mag de time-out van een aangemaakt
record dat in behandeling is niet in een goedkeuring veranderen.

## Compatibiliteitsplan

- Additief Gateway-protocol; geen verhoging van de protocolversie.
- Behoud bestaande exec-/plugin-methoden en -gebeurtenissen aan de externe grens.
- Behoud bestaande ID's, inclusief `plugin:`-voorvoegsels, maar gebruik voorvoegsels niet langer als type-informatie.
- Behoud het gedrag van de tekstopdracht `/approve`.
- Behoud verouderde URL-/Web App-velden voor knoppen en opdrachtacties als compatibiliteitsinvoer voor de plugin-SDK; nieuwe core-uitvoer is getypeerd.
- Migreer alle gebundelde kanalen en interne aanroepers in dezelfde wijziging voor getypeerde acties.
- Voeg een changelogitem toe voor de nieuwe URL/pagina en voor de latere wijziging van het time-outgedrag.
- Voeg geen instelling voor de elicitation-modus toe.

## Uitrol

### PR 1: duurzame levenscyclus

- Deze ontwerpnotitie.
- Gedeeld SQLite-schema, Kysely-generatie, opslag en opschoning na 30 dagen.
- Gateway-goedkeuringsservice, runtime-waiterbrug en afhandeling van verweesde items na een herstart.
- Uniforme `approval.get/resolve`.
- Exec-/plugin-methodeadapters.
- Tests voor het eerste antwoord wint, idempotentie, verlopen, autorisatie en consumptie.
- Nog geen wijziging in UI- of kanaalgedrag.

### PR 2: getypeerde acties en kanaalcallbacks

- Getypeerde acties voor goedkeuring, URL en Web App.
- Kernbouwers voor presentatie en exports van de plugin-SDK.
- Transportprivécodering van callbacks met expliciet eigenaartype.
- Duurzame callbackverwijzingen met vaste grootte voor canonieke ID's die de transportlimieten overschrijden.
- Migratie van gebundelde kanalen weg van het afleiden van opdrachttekst en goedkeurings-ID's.
- Canonieke waarheid van het eerste antwoord op het aangeklikte oppervlak en best-effort actieve native terminalupdates; duurzame terminalisering van kanaalberichten blijft vervolgwerk.
- Tests voor de SDK en gebundelde kanalen.

### PR 3: deeplink voor de Control UI

- Zelfstandige geauthenticeerde goedkeuringspagina en opstartroutering die rekening houdt met het basispad.
- Koppeling aan de serverende Gateway zonder de opgeslagen externe selectie van de operator te wijzigen.
- Door de kern beheerde HTTP-naamruimte voor goedkeuringen, inclusief asset-achtige ID's.
- Door de Gateway opgestelde URL-payload en polling van de wachtstatus totdat levenscyclusgebeurtenissen worden geleverd.
- Bewijs voor mobiele breedte, opnieuw verbinden, concurrerende antwoorden, opnieuw laden en gekoppeld pad.

### PR 4: native clients

- Beoordelingsoppervlakken voor iOS en Android gebruiken typebewuste `approval.get/resolve`; watchOS stuurt beoordelaarsveilige prompts en beslissingen door via de gekoppelde iPhone.
- Watch biedt de uitvoeringsbeslissingen die door het compacte doorstuurcontract worden ondersteund: eenmaal toestaan en weigeren.
- Canonieke terminalwaarheid van het eerste antwoord vervangt de lokale status van de gepoogde beslissing.
- Verloren of ambigue bevestigingen van oplossingen blokkeren de bedieningselementen tot de canonieke teruglezing.
- Eerder uitgebrachte Gateway v4-instanties behouden uitvoeringsbeoordeling via een beperkte terugval op de verouderde methode; behouden terminalstatus tussen oppervlakken vereist de uniforme methoden.
- Waarschuwingen voor beoordelaars en eigenaarscontext blijven zichtbaar op iPhone, Watch en Android.
- Bewijs voor native eenheden, builds en platforms.

### PR 5: propagatie van de levenscyclus naar voorouders

- `session.approval` levering van wacht-/terminalstatus uit de momentopname van het publiek die in PR 1 is opgeslagen.
- Abonnement op de exacte sessie, herhaling na opnieuw verbinden en terminale tombstones zonder transcriptmutatie of activering van de agent.
- Levenscyclusterugroepen worden uitgevoerd na duurzame invoeging/CAS en worden nooit autoriteit voor goedkeuringen.
- Bewijs voor geneste subagents en opnieuw verbinden.

### PR 6: fail-closed-gedrag

- Migreer `node-invoke-plugin-policy.ts` en de ingebedde pluginbroker weg van dubbele autoriteit.
- Strikte semantiek voor time-outs, ongeldige indeling, ontbrekende route, binding en eenmalige toestemmingsconsumptie.
- Maak uitgebrachte tolerante time-outinstellingen verouderd zonder ze te respecteren nadat een vraag in behandeling is.
- Bewijs voor conflicten tussen meerdere oppervlakken en foutinjectie.

### Vervolg: duurzame opschoning van externe berichten

- Sla locators voor doorgestuurde levering duurzaam op en terminaliseer elk geleverd kanaalbericht na een herstart.
- Houd deze transportlevenscyclus gescheiden van de canonieke goedkeuringsautoriteit en getypeerde presentatieacties.

## Tests

Vereiste gerichte dekking:

- Opnieuw openen van SQLite behoudt wachtende en terminale projecties.
- Twee gelijktijdige oplossers leveren exact één CAS-winnaar op.
- Een nieuwe poging met dezelfde beslissing slaagt idempotent; een conflicterende nieuwe poging retourneert de geregistreerde winnaar.
- Oplossen op of na de deadline kan geen goedkeuring geven.
- `allow-once` kan exact één keer worden verbruikt zonder de terminale auditstatus te wissen.
- Bij het opstarten worden oudere runtime-epochs geannuleerd.
- Ongeautoriseerd opzoeken en oplossen onthullen het bestaan van de record niet.
- Expliciete acceptatielijst voor beoordelaars en algemeen gedrag van gekoppelde `operator.approvals`.
- Verouderde methoden voor uitvoering en plugins gebruiken dezelfde opslag.
- Gateway-schema's voor aanvragen, weergeven, ophalen en oplossen, en additieve gebeurtenispayloads.
- Normalisatie van getypeerde acties, fallbackweergave, SDK-exports en schakelaars voor gebundelde kanalen.
- Telegram-callbackcodering bevat transportprivégegevens en leidt niets af uit opdrachtstrings.
- Direct kind, vertakte controller-/aanvragereigenaren, geneste eigenaren, hertoewijzing, fallback voor sessievelden, cyclus en limiet voor publieksgrootte.
- Aangevraagde en terminale publieksarrays zijn identiek.
- Eigenaarsprojecties veroorzaken geen transcriptmutatie of activering van de agent.
- De route van de Control UI werkt op `/` en een geconfigureerd basispad; vernieuwen toont de wachtende of terminale waarheid.
- Gelijktijdige antwoorden in de Control UI en Telegram tonen één winnaar en ‘elders opgelost’ bij de verliezer.
- Native goedkeurings-ID's en Gateway-eigenaars-ID's behouden exacte UTF-8-bytes tijdens routering en reconciliatie.
- Onderhandeling over de native RPC-familie legt per toegelaten Gateway-route één canonieke of verouderde familie vast en schakelt na gebruik nooit stilzwijgend terug.
- Verloren native bevestigingen van oplossingen blokkeren acties tot de canonieke teruglezing; een mislukte teruglezing kan geen winnaar fabriceren of een Watch-vernieuwing bevestigen.
- Correlatie van Watch-momentopnameaanvragen wordt alleen geaccepteerd voor de exacte gekoppelde Gateway-eigenaar en een voltooide canonieke teruglezing op de iPhone.
- Bewijs van het gebruikerstraject via Testbox/Crabbox, inclusief een goedkeuringspagina op mobiele breedte, opschoning van Telegram-acties en één volledige ronde van wachten/oplossen/late verliezer op Android, iPhone en Watch.

## Observeerbaarheid

Genereer gestructureerde, inhoudsvrije overgangslogboeken met goedkeurings-ID, type, bronsessiesleutel, status, reden en latentie. Log nooit de voorvertoning of onbewerkte binding.

Volg:

- aantal aanvragen per type;
- aantal terminale statussen per type/status/reden;
- meter voor wachtende aanvragen;
- latentie van aanvraag tot terminale status;
- uitkomsten van oplossingsraces: winnaar, idempotente nieuwe poging, conflict, verlopen;
- aantal leveringsroutes en weigeringen wegens ontbrekende route;
- annuleringen van verweesde aanvragen bij het opstarten;
- publieksgrootte.

Een vastgelegde overgang geldt als geslaagd, zelfs als latere levering van gebeurtenissen mislukt. Levenscyclusabonnees herstellen via de herhaling van PR 5 en canonieke zoekopdrachten. Duurzame terminalisering van kanaalberichten blijft het afzonderlijke vervolgwerk hierboven.

## Openstaande beslissingen

1. **Extern bereikbare oorsprong van de Control UI.** Elke momentopname bevat de stabiele relatieve `urlPath`. Een absolute URL mag alleen worden geadverteerd vanuit een gecachte Tailscale Serve/Funnel-locatie nadat de Gateway met succes toegankelijk is gemaakt; `allowedOrigins`, Host-headers van aanvragen, `gateway.remote.url` en uitsluitend voor weergave bedoelde loopback-/LAN-kandidaten zijn geen canonieke oorsprongen. Telegram kan zijn geauthenticeerde Mini App-wrapper gebruiken om het goedkeuringspad tijdens het opstarten te behouden. Willekeurige reverse proxies blijven uitsluitend relatief totdat er een afzonderlijk beoordeeld expliciet contract voor een openbare URL bestaat. Laat een kanaal nooit de oorsprong raden.
2. **Compatibiliteitsomschakeling voor strikte uitvoeringstime-outs.** Time-outs voor plugingoedkeuringen werken nu fail-closed en `timeoutBehavior` is verouderd. Het resterende uitgebrachte `askFallback`-contract vereist expliciete beoordeling door de eigenaar en beveiliging, een changelog, documentatie en een migratie-/uitfaseringsbeslissing voordat het geen uitvoering meer autoriseert nadat een wachtende vraag een time-out bereikt.
3. **Ingebedde modus zonder Gateway.** Aanbevolen: houd deze aanvankelijk uitsluitend lokaal en maak deze vervolgens een client van de canonieke service wanneer er een Gateway bestaat. Adverteer geen deeplink die door geen enkele server kan worden opgelost.
