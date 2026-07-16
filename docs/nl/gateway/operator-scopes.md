---
read_when:
    - Fouten met een ontbrekend operatorbereik opsporen
    - Goedkeuringen voor het koppelen van apparaten of nodes beoordelen
    - Gateway-RPC-methoden toevoegen of classificeren
summary: Operatorrollen, bereiken en controles op het moment van goedkeuring voor Gateway-clients
title: Operatorscopes
x-i18n:
    generated_at: "2026-07-16T15:51:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5e74cdd87d21a9e0eafea6b7e4b18ab2e5b74e6c570603b1d4ad4dff83c65619
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Operatorbereiken begrenzen wat een Gateway-client kan doen nadat deze zich heeft geauthenticeerd.
Ze vormen een beveiligingsmaatregel voor het besturingsvlak binnen één vertrouwd Gateway-operatordomein,
geen isolatie tegen vijandige multitenancy. Voor een sterke scheiding tussen personen,
teams of machines voer je afzonderlijke Gateways uit onder afzonderlijke OS-gebruikers of op afzonderlijke hosts.

Gerelateerd: [Beveiliging](/nl/gateway/security), [Gateway-protocol](/nl/gateway/protocol),
[Gateway-koppeling](/nl/gateway/pairing), [Apparaten-CLI](/nl/cli/devices).

## Rollen

Elke Gateway WebSocket-client maakt verbinding met één rol:

- `operator`: clients voor het besturingsvlak, zoals CLI, Control UI, automatisering en
  vertrouwde hulpprocessen.
- `node`: capability-hosts (macOS, iOS, Android, headless) die
  opdrachten beschikbaar stellen via `node.invoke`.

RPC-methoden voor operators vereisen de rol `operator`; methoden die afkomstig zijn van nodes
vereisen de rol `node`.

## Bereikniveaus

| Bereik                  | Betekenis                                                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `operator.read`         | Alleen-lezenstatus, lijsten, catalogus, logboeken, sessieleesbewerkingen en andere niet-wijzigende aanroepen.                                                |
| `operator.write`        | Wijzigende operatoracties: berichten verzenden, tools aanroepen, spraak-/steminstellingen bijwerken en node-opdrachten doorsturen. Voldoet ook aan `operator.read`. |
| `operator.admin`        | Beheerderstoegang. Voldoet aan elk `operator.*`-bereik. Vereist voor configuratiewijziging, updates, native hooks, gereserveerde naamruimten en goedkeuringen met een hoog risico. |
| `operator.pairing`      | Beheer van apparaat- en nodekoppelingen: weergeven, goedkeuren, afwijzen, verwijderen, roteren en intrekken.                                                  |
| `operator.approvals`    | API's voor goedkeuring van exec en plugins.                                                                                                                   |
| `operator.talk.secrets` | Talk-configuratie lezen met inbegrip van geheimen.                                                                                                            |

Onbekende toekomstige `operator.*`-bereiken vereisen een exacte overeenkomst, tenzij de aanroeper
al over `operator.admin` beschikt.

## Methodebereik is slechts de eerste controle

Elke Gateway-RPC heeft een methodebereik met minimale bevoegdheden dat bepaalt of een
verzoek de handler bereikt. Sommige handlers voeren vervolgens strengere controles uit op basis van
het concrete element dat wordt goedgekeurd of gewijzigd:

- `device.pair.approve` is bereikbaar met `operator.pairing`, maar bij het goedkeuren van een
  operatorapparaat kunnen alleen bereiken worden aangemaakt of behouden waarover de aanroeper al beschikt.
- `node.pair.approve` is bereikbaar met `operator.pairing` en leidt vervolgens aanvullende
  goedkeuringsbereiken af uit de opgegeven opdrachtenlijst van de wachtende node.
- `chat.send` is een methode met schrijfbereik, maar de chatopdrachten
  `/config set` en `/config unset` vereisen bovendien `operator.admin`,
  ongeacht het bereik van de aanroeper voor het verzenden van chatberichten.

Hierdoor kunnen operators met een beperkter bereik koppelingsacties met een laag risico uitvoeren zonder
dat alle koppelingsgoedkeuringen uitsluitend door beheerders mogen worden uitgevoerd.

## Goedkeuringen voor apparaatkoppeling

Apparaatkoppelingsrecords zijn de duurzame bron van goedgekeurde rollen en bereiken.
Een al gekoppeld apparaat krijgt niet stilzwijgend bredere toegang: bij opnieuw verbinden
waarbij om een bredere rol of bredere bereiken wordt gevraagd, wordt een nieuwe wachtende
upgradeaanvraag gemaakt.

Een apparaataanvraag goedkeuren:

- Een aanvraag zonder operatorrol heeft geen goedkeuring voor operatorbereiken nodig.
- Een aanvraag voor een niet-operatorapparaatrol (bijvoorbeeld `node`) vereist
  `operator.admin`, hoewel `device.pair.approve` zelf alleen
  `operator.pairing` nodig heeft.
- Een aanvraag voor `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` of `operator.talk.secrets` vereist dat de aanroeper al
  over dat bereik of over `operator.admin` beschikt.
- Een aanvraag voor `operator.admin` vereist `operator.admin`.
- Een reparatieaanvraag zonder expliciete bereiken kan de bereiken van het bestaande
  operatortoken overnemen; als dat token een beheerdersbereik heeft, is voor goedkeuring nog steeds
  `operator.admin` vereist.

Sessies met een gedeeld geheim zonder beheerdersrechten en vertrouwde-proxysessies kunnen
aanvragen voor operatorapparaten alleen goedkeuren binnen hun eigen opgegeven operatorbereiken;
het goedkeuren van niet-operatorrollen is uitsluitend toegestaan voor beheerders, zelfs wanneer die sessies
anders `operator.pairing` kunnen gebruiken.

Voor tokensessies van gekoppelde apparaten is beheer beperkt tot het eigen apparaat, tenzij de aanroeper
over `operator.admin` beschikt: een aanroeper zonder beheerdersrechten ziet alleen de eigen koppelingsvermeldingen en
kan alleen de eigen apparaatvermelding goedkeuren, afwijzen, roteren, intrekken of verwijderen.

## Goedkeuringen voor nodekoppeling

Verouderde `node.pair.*`-methoden gebruiken een afzonderlijke, door de Gateway beheerde opslag voor nodekoppelingen.
WS-nodes gebruiken in plaats daarvan apparaatkoppeling (`role: node`), maar dezelfde terminologie voor
goedkeuringen is van toepassing. Zie [Gateway-koppeling](/nl/gateway/pairing) voor de relatie tussen de twee
opslagplaatsen.

`node.pair.approve` leidt aanvullende vereiste bereiken af uit de opdrachtenlijst
van de wachtende aanvraag:

| Opgegeven opdrachten                                                                                                 | Vereiste bereiken                     |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| geen                                                                                                                 | `operator.pairing`                    |
| gewone node-opdrachten                                                                                               | `operator.pairing` + `operator.write` |
| `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` of `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

Het goedkeuren van een nodedeclaratie schakelt geen opdrachten in waarvoor een afzonderlijke
runtime-toelatingslijst geldt. Voor het goedkeuren van een node die
`computer.act` opgeeft, zijn bijvoorbeeld een koppeling en schrijfbereik vereist, maar hiermee wordt alleen het oppervlak vastgelegd.
Een beheerder of eigenaar moet `computer.act` nog steeds activeren. Zolang dit
geactiveerd blijft, is bij het aanroepen ervan via de methode met schrijfbereik `node.invoke` niet
voor elke actie een beheerdersbereik vereist.

Nodekoppeling stelt identiteit en vertrouwen vast; deze vervangt niet het eigen
exec-goedkeuringsbeleid `system.run` van een node.

## Authenticatie met gedeeld geheim

Authenticatie met een gedeeld Gateway-token/wachtwoord wordt behandeld als vertrouwde operatortoegang voor
die Gateway. OpenAI-compatibele HTTP-oppervlakken, `/tools/invoke` en HTTP-eindpunten
voor sessiegeschiedenis herstellen de volledige standaardset operatorbereiken voor bearer-authenticatie
met een gedeeld geheim, zelfs als een aanroeper beperktere opgegeven bereiken verzendt.

Modi die een identiteit bevatten, zoals authenticatie via een vertrouwde proxy of `none` voor private ingress,
kunnen expliciet opgegeven bereiken wel respecteren. Gebruik afzonderlijke Gateways voor een echte scheiding
van vertrouwensgrenzen.
