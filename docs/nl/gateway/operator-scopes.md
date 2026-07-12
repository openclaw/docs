---
read_when:
    - Fouten met ontbrekend operatorbereik opsporen
    - Goedkeuringen voor het koppelen van apparaten of nodes controleren
    - Gateway-RPC-methoden toevoegen of classificeren
summary: Operatorrollen, bereiken en controles op het moment van goedkeuring voor Gateway-clients
title: Operatorbereiken
x-i18n:
    generated_at: "2026-07-12T08:55:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cfda4486e8d31c01fb7ffff398dcc678d298194f0f0ce6308ae9e5388f5a2856
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Operatorscopes begrenzen wat een Gateway-client na authenticatie kan doen.
Ze vormen een beveiligingsmechanisme voor het besturingsvlak binnen één vertrouwd Gateway-operatordomein,
geen isolatie voor vijandige multitenancy. Voor een sterke scheiding tussen personen,
teams of machines voert u afzonderlijke Gateways uit onder afzonderlijke OS-gebruikers of hosts.

Gerelateerd: [Beveiliging](/nl/gateway/security), [Gateway-protocol](/nl/gateway/protocol),
[Gateway-koppeling](/nl/gateway/pairing), [CLI voor apparaten](/nl/cli/devices).

## Rollen

Elke Gateway-WebSocket-client maakt verbinding met één rol:

- `operator`: clients voor het besturingsvlak, zoals de CLI, de bedieningsinterface, automatisering en
  vertrouwde hulpprocessen.
- `node`: capaciteitshosts (macOS, iOS, Android, headless) die
  opdrachten beschikbaar stellen via `node.invoke`.

RPC-methoden voor operators vereisen de rol `operator`; methoden die afkomstig zijn van Nodes
vereisen de rol `node`.

## Scopeniveaus

| Scope                   | Betekenis                                                                                                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `operator.read`         | Alleen-lezenstatus, lijsten, catalogus, logboeken, het lezen van sessies en andere aanroepen die niets wijzigen.                                                                                              |
| `operator.write`        | Wijzigende operatoracties: berichten verzenden, tools aanroepen, gespreks-/spraakinstellingen bijwerken en Node-opdrachten doorsturen. Voldoet ook aan `operator.read`.                                        |
| `operator.admin`        | Beheerderstoegang. Voldoet aan elke `operator.*`-scope. Vereist voor configuratiewijzigingen, updates, systeemeigen hooks, gereserveerde naamruimten en goedkeuringen met een hoog risico.                     |
| `operator.pairing`      | Beheer van apparaat- en Node-koppelingen: weergeven, goedkeuren, afwijzen, verwijderen, roteren en intrekken.                                                                                                 |
| `operator.approvals`    | API's voor uitvoerings- en Plugin-goedkeuringen.                                                                                                                                                              |
| `operator.talk.secrets` | De gespreksconfiguratie lezen met inbegrip van geheimen.                                                                                                                                                      |

Onbekende toekomstige `operator.*`-scopes vereisen een exacte overeenkomst, tenzij de aanroeper
al over `operator.admin` beschikt.

## De methodescope is slechts de eerste controle

Elke Gateway-RPC heeft een methodescope met minimale bevoegdheden die bepaalt of een
verzoek de handler bereikt. Sommige handlers voeren vervolgens strengere controles uit op basis van
het concrete element dat wordt goedgekeurd of gewijzigd:

- `device.pair.approve` is toegankelijk met `operator.pairing`, maar bij het goedkeuren van een
  operatorapparaat kunnen alleen scopes worden aangemaakt of behouden waarover de aanroeper al beschikt.
- `node.pair.approve` is toegankelijk met `operator.pairing` en leidt vervolgens aanvullende
  goedkeuringsscopes af uit de door de in behandeling zijnde Node opgegeven opdrachtenlijst.
- `chat.send` is een methode met schrijfscope, maar de chatopdrachten `/config set` en
  `/config unset` vereisen daarnaast `operator.admin`,
  ongeacht de scope van de aanroeper voor het verzenden van chatberichten.

Hierdoor kunnen operators met beperktere scopes koppelingsacties met een laag risico uitvoeren zonder
dat voor alle koppelingsgoedkeuringen beheerderstoegang vereist is.

## Goedkeuringen voor apparaatkoppeling

Apparaatkoppelingsrecords vormen de duurzame bron van goedgekeurde rollen en scopes.
Een reeds gekoppeld apparaat krijgt niet stilzwijgend ruimere toegang: een nieuwe verbinding
die om een ruimere rol of ruimere scopes vraagt, maakt een nieuw in behandeling zijnd upgradeverzoek
aan.

Bij het goedkeuren van een apparaatverzoek geldt het volgende:

- Een verzoek zonder operatorrol vereist geen goedkeuring voor een operatorscope.
- Een verzoek voor een niet-operatorrol voor een apparaat (bijvoorbeeld `node`) vereist
  `operator.admin`, ook al vereist `device.pair.approve` zelf alleen
  `operator.pairing`.
- Een verzoek voor `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` of `operator.talk.secrets` vereist dat de aanroeper al
  over die scope of over `operator.admin` beschikt.
- Een verzoek voor `operator.admin` vereist `operator.admin`.
- Een herstelverzoek zonder expliciete scopes kan de scopes van het bestaande operator-
  token overnemen; als dat token een beheerdersscope heeft, vereist de goedkeuring nog steeds
  `operator.admin`.

Sessies zonder beheerderstoegang met een gedeeld geheim of vertrouwde proxy kunnen alleen
verzoeken voor operatorapparaten goedkeuren binnen hun eigen opgegeven operatorscopes; het goedkeuren
van niet-operatorrollen is alleen voor beheerders toegestaan, zelfs wanneer die sessies verder wel
`operator.pairing` kunnen gebruiken.

Voor tokensessies van gekoppelde apparaten is het beheer beperkt tot het eigen apparaat, tenzij de aanroeper
over `operator.admin` beschikt: een aanroeper zonder beheerderstoegang ziet alleen de eigen koppelingsvermeldingen en
kan alleen de eigen apparaatvermelding goedkeuren, afwijzen, roteren, intrekken of verwijderen.

## Goedkeuringen voor Node-koppeling

Verouderde `node.pair.*`-methoden gebruiken een afzonderlijke, door de Gateway beheerde opslag voor Node-koppelingen.
WebSocket-Nodes gebruiken in plaats daarvan apparaatkoppeling (`role: node`), maar dezelfde terminologie voor goedkeuringen
is van toepassing. Zie [Gateway-koppeling](/nl/gateway/pairing) voor de relatie tussen de twee
opslagplaatsen.

`node.pair.approve` leidt aanvullende vereiste scopes af uit de opdrachtenlijst van het
in behandeling zijnde verzoek:

| Opgegeven opdrachten                                   | Vereiste scopes                        |
| ------------------------------------------------------ | -------------------------------------- |
| geen                                                   | `operator.pairing`                     |
| Node-opdrachten zonder uitvoering                      | `operator.pairing` + `operator.write`  |
| `system.run`, `system.run.prepare` of `system.which`   | `operator.pairing` + `operator.admin`  |

Het goedkeuren van een Node-declaratie schakelt geen opdrachten in waarvoor een afzonderlijke
toelatingslijst tijdens runtime geldt. Het goedkeuren van een Node die
`computer.act` opgeeft, vereist bijvoorbeeld een koppelings- en schrijfscope, maar registreert alleen het oppervlak.
Een beheerder of eigenaar moet `computer.act` nog steeds activeren. Zolang deze opdracht
geactiveerd blijft, is voor het aanroepen ervan via de methode `node.invoke` met schrijfscope niet
voor elke actie een beheerdersscope vereist.

Node-koppeling legt identiteit en vertrouwen vast; deze vervangt niet het eigen
goedkeuringsbeleid van een Node voor de uitvoering van `system.run`.

## Authenticatie met een gedeeld geheim

Authenticatie met een gedeeld Gateway-token/wachtwoord wordt behandeld als vertrouwde operatortoegang voor
die Gateway. OpenAI-compatibele HTTP-oppervlakken, `/tools/invoke` en HTTP-
eindpunten voor sessiegeschiedenis herstellen voor bearer-authenticatie met een gedeeld geheim de volledige standaardset operatorscopes,
zelfs als een aanroeper beperktere opgegeven scopes verzendt.

Modi met een identiteit, zoals authenticatie via een vertrouwde proxy of `none` voor privé-ingang,
kunnen expliciet opgegeven scopes wel respecteren. Gebruik afzonderlijke Gateways voor een echte
scheiding van vertrouwensgrenzen.
