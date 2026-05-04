---
read_when:
    - Fouten met ontbrekende operatorscope opsporen
    - Goedkeuringen voor apparaat- of Node-koppelingen beoordelen
    - Gateway-RPC-methoden toevoegen of classificeren
summary: Operatorrollen, bereiken en controles op het moment van goedkeuring voor Gateway-clients
title: Operatorbereiken
x-i18n:
    generated_at: "2026-05-04T07:06:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: f05d6bdbf9bdad2aef1c9664bb7ebb4b6241334b8aefac7993104e9977e40450
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Operatorbereiken definiëren wat een Gateway-client mag doen nadat deze is geauthenticeerd.
Ze zijn een besturingsvlak-beveiliging binnen één vertrouwd Gateway-operatordomein,
geen vijandige multi-tenant-isolatie. Als je sterke scheiding nodig hebt tussen
mensen, teams of machines, voer dan aparte Gateways uit onder aparte OS-gebruikers of
hosts.

Gerelateerd: [Beveiliging](/nl/gateway/security), [Gateway-protocol](/nl/gateway/protocol),
[Gateway-koppeling](/nl/gateway/pairing), [Apparaten-CLI](/nl/cli/devices).

## Rollen

Gateway WebSocket-clients maken verbinding met één rol:

- `operator`: besturingsvlak-clients zoals CLI, Control UI, automatisering en
  vertrouwde hulpprocessen.
- `node`: capaciteitshosts zoals macOS, iOS, Android of headless Nodes die
  opdrachten beschikbaar maken via `node.invoke`.

Operator-RPC-methoden vereisen de rol `operator`. Methoden die door Node worden geïnitieerd
vereisen de rol `node`.

## Bereikniveaus

| Bereik                  | Betekenis                                                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `operator.read`         | Alleen-lezen status, lijsten, catalogus, logs, sessielezingen en andere niet-mutatieve besturingsvlak-aanroepen.                                                                     |
| `operator.write`        | Normale mutatieve operatoracties zoals berichten verzenden, tools aanroepen, talk-/voice-instellingen bijwerken en relais voor Node-opdrachten. Voldoet ook aan `operator.read`.     |
| `operator.admin`        | Administratieve toegang tot het besturingsvlak. Voldoet aan elk `operator.*`-bereik. Vereist voor configuratiemutatie, updates, native hooks, gevoelige gereserveerde namespaces en goedkeuringen met hoog risico. |
| `operator.pairing`      | Beheer van apparaat- en Node-koppeling, inclusief het weergeven, goedkeuren, afwijzen, verwijderen, roteren en intrekken van koppelingsrecords of apparaattokens.                    |
| `operator.approvals`    | Exec- en Plugin-goedkeurings-API's.                                                                                                                                                  |
| `operator.talk.secrets` | Talk-configuratie lezen met geheimen inbegrepen.                                                                                                                                     |

Onbekende toekomstige `operator.*`-bereiken vereisen een exacte match, tenzij de aanroeper
`operator.admin` heeft.

## Methodebereik is alleen de eerste poort

Elke Gateway-RPC heeft een methodebereik met minimale privileges. Dat methodebereik bepaalt
of de aanvraag de handler kan bereiken. Sommige handlers passen daarna strengere
controles bij goedkeuring toe op basis van het concrete item dat wordt goedgekeurd of gemuteerd.

Voorbeelden:

- `device.pair.approve` is bereikbaar met `operator.pairing`, maar het goedkeuren van een
  operatorapparaat kan alleen bereiken minten of behouden die de aanroeper al heeft.
- `node.pair.approve` is bereikbaar met `operator.pairing` en leidt vervolgens extra
  goedkeuringsbereiken af uit de lijst met wachtende Node-opdrachten.
- `chat.send` is normaal een methode met schrijfrechten, maar persistente `/config set`
  en `/config unset` vereisen `operator.admin` op opdrachtniveau.

Hierdoor kunnen operators met een lager bereik koppelingsacties met laag risico uitvoeren zonder
alle koppelingsgoedkeuringen alleen voor beheerders te maken.

## Goedkeuringen voor apparaatkoppeling

Apparaatkoppelingsrecords zijn de duurzame bron van goedgekeurde rollen en bereiken.
Al gekoppelde apparaten krijgen niet stilzwijgend bredere toegang: nieuwe verbindingen die vragen
om een bredere rol of bredere bereiken maken een nieuw wachtend upgradeverzoek aan.

Bij het goedkeuren van een apparaatverzoek:

- Een verzoek zonder operatorrol heeft geen goedkeuring voor het bereik van het operatortoken nodig.
- Een verzoek voor `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` of `operator.talk.secrets` vereist dat de aanroeper
  die bereiken heeft, of `operator.admin`.
- Een verzoek voor `operator.admin` vereist `operator.admin`.
- Een herstelverzoek zonder expliciete bereiken kan de bestaande operatortokenbereiken
  overnemen. Als dat bestaande token een admin-bereik heeft, vereist goedkeuring nog steeds
  `operator.admin`.

Voor gekoppelde-apparaat-tokensessies is beheer zelfbereikt, tenzij de aanroeper
ook `operator.admin` heeft: niet-admin-aanroepers zien alleen hun eigen koppelingsvermeldingen,
kunnen alleen hun eigen wachtende verzoek goedkeuren of afwijzen, en kunnen alleen
hun eigen apparaatvermelding roteren, intrekken of verwijderen.

## Goedkeuringen voor Node-koppeling

Legacy `node.pair.*` gebruikt een aparte, door Gateway beheerde Node-koppelingsopslag. WS-Nodes
gebruiken apparaatkoppeling met `role: node`, maar dezelfde woordenschat op goedkeuringsniveau
is van toepassing.

`node.pair.approve` gebruikt de lijst met opdrachten in het wachtende verzoek om aanvullende
vereiste bereiken af te leiden:

- Verzoek zonder opdrachten: `operator.pairing`
- Niet-exec Node-opdrachten: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` of `system.which`:
  `operator.pairing` + `operator.admin`

Node-koppeling stelt identiteit en vertrouwen vast. Het vervangt niet het eigen
`system.run` exec-goedkeuringsbeleid van de Node.

## Authenticatie met gedeeld geheim

Authenticatie met een gedeeld gateway-token/wachtwoord wordt behandeld als vertrouwde operatortoegang voor
die Gateway. OpenAI-compatibele HTTP-oppervlakken en `/tools/invoke` herstellen de
normale volledige standaardset operatorbereiken voor bearer-authenticatie met gedeeld geheim, zelfs als een
aanroeper smallere gedeclareerde bereiken verzendt.

Modi met identiteit, zoals vertrouwde-proxy-authenticatie of private-ingress `none`,
kunnen nog steeds expliciet gedeclareerde bereiken respecteren. Gebruik aparte Gateways voor echte
scheiding van vertrouwensgrenzen.
