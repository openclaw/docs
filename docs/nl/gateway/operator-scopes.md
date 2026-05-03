---
read_when:
    - Fouten door een ontbrekend operatorbereik debuggen
    - Goedkeuringen voor apparaat- of Node-koppelingen beoordelen
    - Gateway-RPC-methoden toevoegen of classificeren
summary: Operatorrollen, scopes en controles tijdens goedkeuring voor Gateway-clients
title: Operatorbereiken
x-i18n:
    generated_at: "2026-05-03T11:10:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48f59f96b41333af9124ad4083ac5442eedb2d6cebdfff74e3ba256f06d36add
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Operator-scopes bepalen wat een Gateway-client mag doen nadat deze is geauthenticeerd.
Ze zijn een beschermingsmaatregel voor het besturingsvlak binnen één vertrouwd Gateway-operatordomein,
geen isolatie voor vijandige multi-tenancy. Als je sterke scheiding nodig hebt tussen
personen, teams of machines, voer dan afzonderlijke Gateways uit onder afzonderlijke OS-gebruikers of
hosts.

Gerelateerd: [Beveiliging](/nl/gateway/security), [Gateway-protocol](/nl/gateway/protocol),
[Gateway-koppeling](/nl/gateway/pairing), [Apparaten-CLI](/nl/cli/devices).

## Rollen

Gateway WebSocket-clients verbinden met één rol:

- `operator`: besturingsvlakclients zoals CLI, Control UI, automatisering en
  vertrouwde hulpprocessen.
- `node`: capaciteitshosts zoals macOS, iOS, Android of headless nodes die
  opdrachten beschikbaar maken via `node.invoke`.

Operator-RPC-methoden vereisen de rol `operator`. Methoden afkomstig van een node
vereisen de rol `node`.

## Scopeniveaus

| Scope                   | Betekenis                                                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Alleen-lezen status, lijsten, catalogus, logboeken, sessielezingen en andere niet-muterende besturingsvlak-aanroepen.                                                               |
| `operator.write`        | Normale muterende operatoracties zoals berichten verzenden, tools aanroepen, talk/voice-instellingen bijwerken en node-opdrachtrelay. Voldoet ook aan `operator.read`.               |
| `operator.admin`        | Administratieve toegang tot het besturingsvlak. Voldoet aan elke `operator.*`-scope. Vereist voor configuratiemutatie, updates, native hooks, gevoelige gereserveerde namespaces en goedkeuringen met hoog risico. |
| `operator.pairing`      | Beheer van apparaat- en node-koppeling, inclusief het weergeven, goedkeuren, afwijzen, verwijderen, roteren en intrekken van koppelingsrecords of apparaattokens.                    |
| `operator.approvals`    | Exec- en Plugin-goedkeurings-API's.                                                                                                                                                   |
| `operator.talk.secrets` | Talk-configuratie lezen inclusief geheimen.                                                                                                                                           |

Onbekende toekomstige `operator.*`-scopes vereisen een exacte match, tenzij de aanroeper
`operator.admin` heeft.

## Methode-scope is alleen de eerste poort

Elke Gateway-RPC heeft een methode-scope met minste privileges. Die methode-scope bepaalt
of de aanvraag de handler kan bereiken. Sommige handlers passen daarna strengere
controles op goedkeuringsmoment toe op basis van het concrete onderdeel dat wordt goedgekeurd of gemuteerd.

Voorbeelden:

- `device.pair.approve` is bereikbaar met `operator.pairing`, maar het goedkeuren van een
  operatorapparaat kan alleen scopes uitgeven of behouden die de aanroeper al heeft.
- `node.pair.approve` is bereikbaar met `operator.pairing`, en leidt daarna extra
  goedkeuringsscopes af uit de lijst met wachtende node-opdrachten.
- `chat.send` is normaal een methode met write-scope, maar persistente `/config set`
  en `/config unset` vereisen `operator.admin` op opdrachtniveau.

Hierdoor kunnen operators met lagere scopes koppelingsacties met laag risico uitvoeren zonder
alle koppelingsgoedkeuringen alleen voor admins te maken.

## Goedkeuringen voor apparaatkoppeling

Apparaatkoppelingsrecords zijn de duurzame bron van goedgekeurde rollen en scopes.
Al gekoppelde apparaten krijgen niet stilzwijgend bredere toegang: opnieuw verbinden met een aanvraag
voor een bredere rol of bredere scopes maakt een nieuwe wachtende upgradeaanvraag aan.

Bij het goedkeuren van een apparaataanvraag:

- Een aanvraag zonder operatorrol heeft geen goedkeuring voor operator-tokenscopes nodig.
- Een aanvraag voor `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` of `operator.talk.secrets` vereist dat de aanroeper
  die scopes heeft, of `operator.admin`.
- Een aanvraag voor `operator.admin` vereist `operator.admin`.
- Een reparatieaanvraag zonder expliciete scopes kan de bestaande operator-
  tokenscopes overnemen. Als dat bestaande token admin-scope heeft, vereist goedkeuring nog steeds
  `operator.admin`.

Voor tokensessies van gekoppelde apparaten is beheer self-scoped tenzij de aanroeper
ook `operator.admin` heeft: niet-admin-aanroepers kunnen alleen hun eigen apparaatvermelding
roteren, intrekken of verwijderen.

## Goedkeuringen voor node-koppeling

Legacy `node.pair.*` gebruikt een afzonderlijke door Gateway beheerde node-koppelingsopslag. WS-nodes
gebruiken apparaatkoppeling met `role: node`, maar dezelfde vocabulaire op goedkeuringsniveau
is van toepassing.

`node.pair.approve` gebruikt de lijst met opdrachten in de wachtende aanvraag om aanvullende
vereiste scopes af te leiden:

- Aanvraag zonder opdrachten: `operator.pairing`
- Niet-exec node-opdrachten: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` of `system.which`:
  `operator.pairing` + `operator.admin`

Node-koppeling stelt identiteit en vertrouwen vast. Het vervangt niet het eigen
`system.run` exec-goedkeuringsbeleid van de node.

## Shared-secret-authenticatie

Authenticatie met gedeeld gateway-token/wachtwoord wordt behandeld als vertrouwde operatortoegang voor
die Gateway. OpenAI-compatibele HTTP-oppervlakken en `/tools/invoke` herstellen de
normale volledige standaardscopeset voor operators voor shared-secret bearer-authenticatie, zelfs als een
aanroeper smallere gedeclareerde scopes verstuurt.

Identiteitsdragende modi, zoals vertrouwde proxy-authenticatie of private-ingress `none`,
kunnen nog steeds expliciet gedeclareerde scopes respecteren. Gebruik afzonderlijke Gateways voor echte scheiding van vertrouwensgrenzen.
