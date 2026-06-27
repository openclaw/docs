---
read_when:
    - Fouten met ontbrekende operatorscope debuggen
    - Apparaat- of nodekoppelingsgoedkeuringen beoordelen
    - Gateway RPC-methoden toevoegen of classificeren
summary: Operatorrollen, scopes en controles tijdens goedkeuring voor Gateway-clients
title: Operatorbereiken
x-i18n:
    generated_at: "2026-06-27T17:36:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc59453ae1a73b52276185de2cedd1ed4da027111168eda8107d6ba0b74aec2f
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Operator-scopes definiëren wat een Gateway-client mag doen nadat deze is geauthenticeerd.
Ze vormen een control-plane-veiligheidsrail binnen één vertrouwd Gateway-operatordomein,
geen vijandige multi-tenant-isolatie. Als je sterke scheiding nodig hebt tussen
mensen, teams of machines, voer dan afzonderlijke Gateways uit onder afzonderlijke OS-gebruikers of
hosts.

Gerelateerd: [Beveiliging](/nl/gateway/security), [Gateway-protocol](/nl/gateway/protocol),
[Gateway-koppeling](/nl/gateway/pairing), [Apparaten-CLI](/nl/cli/devices).

## Rollen

Gateway WebSocket-clients maken verbinding met één rol:

- `operator`: control-plane-clients zoals CLI, Control UI, automatisering en
  vertrouwde helperprocessen.
- `node`: capaciteitshosts zoals macOS, iOS, Android of headless nodes die
  opdrachten beschikbaar stellen via `node.invoke`.

Operator-RPC-methoden vereisen de rol `operator`. Methoden die vanuit nodes
komen vereisen de rol `node`.

## Scope-niveaus

| Scope                   | Betekenis                                                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Alleen-lezen status, lijsten, catalogus, logs, sessielezen en andere niet-mutatieve control-plane-aanroepen.                                                                                    |
| `operator.write`        | Normale mutatieve operatoracties zoals berichten verzenden, tools aanroepen, spraak-/voice-instellingen bijwerken en node-opdrachtrelay. Voldoet ook aan `operator.read`.                      |
| `operator.admin`        | Administratieve control-plane-toegang. Voldoet aan elke `operator.*`-scope. Vereist voor config-mutatie, updates, native hooks, gevoelige gereserveerde namespaces en risicovolle goedkeuringen. |
| `operator.pairing`      | Beheer van apparaat- en node-koppeling, inclusief het weergeven, goedkeuren, afwijzen, verwijderen, roteren en intrekken van koppelingsrecords of apparaattokens.                                       |
| `operator.approvals`    | Exec- en Plugin-goedkeurings-API's.                                                                                                                                                        |
| `operator.talk.secrets` | Talk-configuratie lezen met inbegrepen secrets.                                                                                                                                     |

Onbekende toekomstige `operator.*`-scopes vereisen een exacte match, tenzij de aanroeper
`operator.admin` heeft.

## Methode-scope is alleen de eerste poort

Elke Gateway-RPC heeft een least-privilege methode-scope. Die methode-scope bepaalt
of de aanvraag de handler kan bereiken. Sommige handlers passen daarna strengere
controles tijdens goedkeuring toe op basis van het concrete object dat wordt goedgekeurd of gewijzigd.

Voorbeelden:

- `device.pair.approve` is bereikbaar met `operator.pairing`, maar het goedkeuren van een
  operatorapparaat kan alleen scopes aanmaken of behouden die de aanroeper al heeft.
- `node.pair.approve` is bereikbaar met `operator.pairing` en leidt daarna extra
  goedkeuringsscopes af uit de lijst met openstaande node-opdrachten.
- `chat.send` is normaal een methode met write-scope, maar persistente `/config set`
  en `/config unset` vereisen `operator.admin` op opdrachtniveau.

Hierdoor kunnen operators met lagere scopes koppelingsacties met laag risico uitvoeren zonder
alle koppelingsgoedkeuringen alleen voor admins te maken.

## Goedkeuringen voor apparaatkoppeling

Records voor apparaatkoppeling zijn de duurzame bron van goedgekeurde rollen en scopes.
Al gekoppelde apparaten krijgen niet stilzwijgend bredere toegang: herverbindingen die vragen
om een bredere rol of bredere scopes maken een nieuwe openstaande upgrade-aanvraag.

Bij het goedkeuren van een apparaataanvraag:

- Een aanvraag zonder operatorrol heeft geen goedkeuring voor operator-tokenscopes nodig.
- Een aanvraag voor een niet-operator-apparaatrol, zoals `node`, vereist
  `operator.admin`, zelfs wanneer `device.pair.approve` bereikbaar is met
  `operator.pairing`.
- Een aanvraag voor `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` of `operator.talk.secrets` vereist dat de aanroeper
  die scopes heeft, of `operator.admin`.
- Een aanvraag voor `operator.admin` vereist `operator.admin`.
- Een reparatieaanvraag zonder expliciete scopes kan de bestaande operator-
  tokenscopes overnemen. Als dat bestaande token admin-scoped is, vereist goedkeuring nog steeds
  `operator.admin`.

Niet-admin shared-secret- en trusted-proxy-sessies kunnen operator-apparaat-
aanvragen alleen goedkeuren binnen hun eigen gedeclareerde operator-scopes. Het goedkeuren van niet-operator-
rollen is alleen voor admins, zelfs wanneer die sessies anders
`operator.pairing` kunnen gebruiken.

Voor gekoppelde-apparaat-tokensessies is beheer ook self-scoped, tenzij de
aanroeper `operator.admin` heeft: niet-admin-aanroepers zien alleen hun eigen koppelings-
items, kunnen alleen hun eigen openstaande aanvraag goedkeuren of afwijzen, en kunnen
alleen hun eigen apparaatinvoer roteren, intrekken of verwijderen.

## Goedkeuringen voor node-koppeling

Legacy `node.pair.*` gebruikt een aparte node-koppelingsopslag die eigendom is van de Gateway. WS-nodes
gebruiken apparaatkoppeling met `role: node`, maar dezelfde vocabulaire op goedkeuringsniveau
is van toepassing.

`node.pair.approve` gebruikt de opdrachtlijst van de openstaande aanvraag om aanvullende
vereiste scopes af te leiden:

- Aanvraag zonder opdrachten: `operator.pairing`
- Niet-exec node-opdrachten: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` of `system.which`:
  `operator.pairing` + `operator.admin`

Node-koppeling stelt identiteit en vertrouwen vast. Het vervangt niet het eigen
`system.run` exec-goedkeuringsbeleid van de node.

## Shared-secret-authenticatie

Gedeelde gateway-token-/wachtwoordauthenticatie wordt behandeld als vertrouwde operatortoegang voor
die Gateway. OpenAI-compatibele HTTP-oppervlakken, `/tools/invoke` en HTTP-sessie-
geschiedenisendpoints herstellen de normale volledige operator-standaardscopeset voor
shared-secret bearer-authenticatie, zelfs als een aanroeper smallere gedeclareerde scopes verzendt.

Modi met identiteit, zoals trusted proxy-authenticatie of private-ingress `none`,
kunnen nog steeds expliciet gedeclareerde scopes respecteren. Gebruik afzonderlijke Gateways voor echte scheiding
van vertrouwensgrenzen.
