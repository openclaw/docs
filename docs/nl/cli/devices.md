---
read_when:
    - Je keurt apparaatkoppelingsverzoeken goed
    - Je moet apparaattokens roteren of intrekken
summary: CLI-referentie voor `openclaw devices` (apparaatkoppeling + tokenrotatie/intrekking)
title: Apparaten
x-i18n:
    generated_at: "2026-06-27T17:19:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08d6945af4fa2403a97dfec94af7bbd0dc746efe90d3e5b4c9f5c5d6d27d70a4
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Beheer apparaatkoppelingsverzoeken en apparaatspecifieke tokens.

## Commando's

### `openclaw devices list`

Toon openstaande koppelingsverzoeken en gekoppelde apparaten.

```
openclaw devices list
openclaw devices list --json
```

Uitvoer voor openstaande verzoeken toont de gevraagde toegang naast de huidige
goedgekeurde toegang van het apparaat wanneer het apparaat al gekoppeld is. Dit maakt scope-/rolupgrades expliciet in plaats van dat het lijkt alsof de koppeling verloren is gegaan.

### `openclaw devices remove <deviceId>`

Verwijder één gekoppeld apparaatitem.

Wanneer je bent geauthenticeerd met een gekoppeld apparaattoken, kunnen niet-beheerderaanroepers
alleen **hun eigen** apparaatitem verwijderen. Het verwijderen van een ander apparaat vereist
`operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Wis gekoppelde apparaten in bulk.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Keur een openstaand apparaatkoppelingsverzoek goed op exacte `requestId`. Als `requestId`
wordt weggelaten of `--latest` wordt meegegeven, drukt OpenClaw alleen het geselecteerde openstaande
verzoek af en sluit af; voer de goedkeuring opnieuw uit met de exacte verzoek-ID nadat je
de details hebt gecontroleerd.

<Note>
Als een apparaat opnieuw probeert te koppelen met gewijzigde auth-details (rol, scopes of openbare sleutel), vervangt OpenClaw het vorige openstaande item en geeft een nieuwe `requestId` uit. Voer vlak voor goedkeuring `openclaw devices list` uit om de huidige ID te gebruiken.
</Note>

Als het apparaat al gekoppeld is en om bredere scopes of een bredere rol vraagt,
laat OpenClaw de bestaande goedkeuring staan en maakt het een nieuw openstaand upgradeverzoek
aan. Controleer de kolommen `Requested` versus `Approved` in `openclaw devices list`
of gebruik `openclaw devices approve --latest` om de exacte upgrade vooraf te bekijken voordat
je deze goedkeurt.

Als de Gateway expliciet is geconfigureerd met
`gateway.nodes.pairing.autoApproveCidrs`, kunnen eerste `role: node`-verzoeken van
overeenkomende client-IP's worden goedgekeurd voordat ze in deze lijst verschijnen. Dat beleid
is standaard uitgeschakeld en geldt nooit voor operator-/browserclients of upgradeverzoeken.

Het goedkeuren van node- of andere niet-operatorapparaatrollen vereist `operator.admin`.
`operator.pairing` is alleen genoeg voor goedkeuringen van operatorapparaten wanneer de
gevraagde operator-scopes binnen de eigen scopes van de aanroeper blijven. Zie
[Operator-scopes](/nl/gateway/operator-scopes) voor de controles tijdens goedkeuring.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

## Paperclip / eerste-run-goedkeuring voor `openclaw_gateway`

Wanneer een nieuwe Paperclip-agent voor het eerst verbinding maakt via de `openclaw_gateway`-adapter, kan de Gateway een eenmalige apparaatkoppelingsgoedkeuring vereisen voordat runs kunnen slagen. Als Paperclip `openclaw_gateway_pairing_required` meldt, keur dan het openstaande apparaat goed en probeer opnieuw.

Bekijk voor lokale gateways het nieuwste openstaande verzoek vooraf:

```bash
openclaw devices approve --latest
```

De preview drukt het exacte commando `openclaw devices approve <requestId>` af. Controleer de verzoekdetails en voer daarna dat commando opnieuw uit met de verzoek-ID om het goed te keuren.

Geef voor externe gateways of expliciete referenties dezelfde opties mee tijdens vooraf bekijken en goedkeuren:

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

Om opnieuw goedkeuren na herstarts te voorkomen, bewaar je een persistente apparaatsleutel in de Paperclip-adapterconfiguratie in plaats van bij elke run een nieuwe tijdelijke identiteit te genereren:

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

Als goedkeuring blijft mislukken, voer dan eerst `openclaw devices list` uit om te bevestigen dat er een openstaand verzoek bestaat.

### `openclaw devices reject <requestId>`

Wijs een openstaand apparaatkoppelingsverzoek af.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Roteer een apparaattoken voor een specifieke rol (optioneel met bijgewerkte scopes).
De doelrol moet al bestaan in het goedgekeurde koppelingscontract van dat apparaat;
rotatie kan geen nieuwe niet-goedgekeurde rol uitgeven.
Als je `--scope` weglaat, gebruiken latere herverbindingen met het opgeslagen geroteerde token opnieuw de
gecachete goedgekeurde scopes van dat token. Als je expliciete `--scope`-waarden meegeeft, worden die
de opgeslagen scopeset voor toekomstige herverbindingen met gecachete tokens.
Niet-beheerderaanroepers met een gekoppeld apparaat kunnen alleen hun **eigen** apparaattoken roteren.
De scopeset van het doeltoken moet binnen de eigen operator-scopes van de aanroepersessie blijven;
rotatie kan geen breder operatortoken uitgeven of behouden dan de
aanroeper al heeft.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Retourneert rotatiemetadata als JSON. Als de aanroeper zijn eigen token roteert terwijl
hij is geauthenticeerd met dat apparaattoken, bevat de respons ook het vervangende
token zodat de client het kan bewaren voordat opnieuw verbinding wordt gemaakt. Gedeelde/beheerdersrotaties
echoën het bearer-token niet.

### `openclaw devices revoke --device <id> --role <role>`

Trek een apparaattoken voor een specifieke rol in.

Niet-beheerderaanroepers met een gekoppeld apparaat kunnen alleen hun **eigen** apparaattoken intrekken.
Het intrekken van het token van een ander apparaat vereist `operator.admin`.
De scopeset van het doeltoken moet ook binnen de eigen
operator-scopes van de aanroepersessie passen; aanroepers met alleen pairing kunnen geen admin-/write-operatortokens intrekken.

```
openclaw devices revoke --device <deviceId> --role node
```

Retourneert het intrekkingsresultaat als JSON.

## Algemene opties

- `--url <url>`: Gateway WebSocket-URL (standaard `gateway.remote.url` wanneer geconfigureerd).
- `--token <token>`: Gateway-token (indien vereist).
- `--password <password>`: Gateway-wachtwoord (wachtwoordauth).
- `--timeout <ms>`: RPC-time-out.
- `--json`: JSON-uitvoer (aanbevolen voor scripting).

<Warning>
Wanneer je `--url` instelt, valt de CLI niet terug op configuratie- of omgevingsreferenties. Geef `--token` of `--password` expliciet mee. Ontbrekende expliciete referenties zijn een fout.
</Warning>

## Notities

- Tokenrotatie retourneert een nieuw token (gevoelig). Behandel het als een geheim.
- Deze commando's vereisen scope `operator.pairing` (of `operator.admin`). Sommige
  goedkeuringen vereisen ook dat de aanroeper de operator-scopes heeft die het doelapparaat
  zou uitgeven of erven. Niet-operatorapparaatrollen vereisen
  `operator.admin`; zie [Operator-scopes](/nl/gateway/operator-scopes).
- `gateway.nodes.pairing.autoApproveCidrs` is een opt-in Gateway-beleid alleen voor
  nieuwe koppeling van node-apparaten; het verandert de goedkeuringsbevoegdheid van de CLI niet.
- Tokenrotatie en intrekking blijven binnen de goedgekeurde koppelingsrollenset en
  goedgekeurde scopebasis voor dat apparaat. Een verdwaald gecachet tokenitem
  geeft geen doel voor tokenbeheer.
- Voor apparaattokensessies met gekoppelde apparaten is beheer tussen apparaten alleen voor beheerders:
  `remove`, `rotate` en `revoke` zijn alleen voor het eigen apparaat, tenzij de aanroeper
  `operator.admin` heeft.
- Tokenmutatie is ook beperkt tot de scope van de aanroeper: een sessie met alleen pairing kan geen
  token roteren of intrekken dat momenteel `operator.admin` of
  `operator.write` draagt.
- `devices clear` wordt bewust afgeschermd door `--yes`.
- Als pairingscope niet beschikbaar is op local loopback (en er geen expliciete `--url` is meegegeven), kunnen list/approve een lokale pairing-fallback gebruiken.
- `devices approve` vereist een expliciete verzoek-ID voordat tokens worden uitgegeven; het weglaten van `requestId` of meegeven van `--latest` toont alleen een preview van het nieuwste openstaande verzoek.

## Checklist voor herstel bij tokendrift

Gebruik dit wanneer Control UI of andere clients blijven falen met `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` of `AUTH_SCOPE_MISMATCH`.

1. Bevestig de huidige bron van het gatewaytoken:

```bash
openclaw config get gateway.auth.token
```

2. Toon gekoppelde apparaten en identificeer de getroffen apparaat-ID:

```bash
openclaw devices list
```

3. Roteer het operatortoken voor het getroffen apparaat:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Als rotatie niet genoeg is, verwijder dan de verouderde koppeling en keur opnieuw goed:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Probeer de clientverbinding opnieuw met het huidige gedeelde token/wachtwoord.

Notities:

- Normale auth-prioriteit bij opnieuw verbinden is eerst expliciet gedeeld token/wachtwoord, daarna expliciet `deviceToken`, daarna opgeslagen apparaattoken, daarna bootstraptoken.
- Vertrouwd herstel van `AUTH_TOKEN_MISMATCH` kan tijdelijk zowel het gedeelde token als het opgeslagen apparaattoken samen verzenden voor die ene begrensde nieuwe poging.
- `AUTH_SCOPE_MISMATCH` betekent dat het apparaattoken is herkend maar niet de gevraagde scopeset draagt; herstel het contract voor koppelings-/scopegoedkeuring voordat je gedeelde Gateway-auth wijzigt.

Gerelateerd:

- [Probleemoplossing voor dashboardauth](/nl/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Nodes](/nl/nodes)
