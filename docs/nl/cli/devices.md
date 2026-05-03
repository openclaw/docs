---
read_when:
    - Je keurt koppelingsverzoeken voor apparaten goed
    - Je moet apparaattokens roteren of intrekken
summary: CLI-referentie voor `openclaw devices` (apparaatkoppeling + tokenrotatie/-intrekking)
title: Apparaten
x-i18n:
    generated_at: "2026-05-03T11:08:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: fa92fd3ffc671c827fa98870bf9df89f3be90adec167fd8ea32698cf2e69991a
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

De uitvoer voor openstaande verzoeken toont de gevraagde toegang naast de huidige
goedgekeurde toegang van het apparaat wanneer het apparaat al gekoppeld is. Dit maakt scope-/rolupgrades expliciet, in plaats van dat het lijkt alsof de koppeling verloren is gegaan.

### `openclaw devices remove <deviceId>`

Verwijder één gekoppeld apparaatitem.

Wanneer je bent geauthenticeerd met een gekoppeld apparaattoken, kunnen niet-beheerbellers
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

Keur een openstaand apparaatkoppelingsverzoek goed via de exacte `requestId`. Als `requestId`
wordt weggelaten of `--latest` wordt doorgegeven, drukt OpenClaw alleen het geselecteerde openstaande
verzoek af en sluit af; voer de goedkeuring opnieuw uit met de exacte verzoek-ID nadat je
de details hebt gecontroleerd.

<Note>
Als een apparaat opnieuw probeert te koppelen met gewijzigde auth-details (rol, scopes of publieke sleutel), vervangt OpenClaw het vorige openstaande item en geeft een nieuwe `requestId` uit. Voer vlak vóór goedkeuring `openclaw devices list` uit om de huidige ID te gebruiken.
</Note>

Als het apparaat al gekoppeld is en om bredere scopes of een bredere rol vraagt,
laat OpenClaw de bestaande goedkeuring staan en maakt het een nieuw openstaand upgradeverzoek
aan. Controleer de kolommen `Requested` versus `Approved` in `openclaw devices list`
of gebruik `openclaw devices approve --latest` om de exacte upgrade vooraf te bekijken voordat
je deze goedkeurt.

Als de Gateway expliciet is geconfigureerd met
`gateway.nodes.pairing.autoApproveCidrs`, kunnen eerste `role: node`-verzoeken vanaf
overeenkomende client-IP's worden goedgekeurd voordat ze in deze lijst verschijnen. Dat beleid
is standaard uitgeschakeld en geldt nooit voor operator-/browserclients of upgradeverzoeken.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Wijs een openstaand apparaatkoppelingsverzoek af.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Roteer een apparaattoken voor een specifieke rol (optioneel met bijgewerkte scopes).
De doelrol moet al bestaan in het goedgekeurde koppelingscontract van dat apparaat;
rotatie kan geen nieuwe niet-goedgekeurde rol minten.
Als je `--scope` weglaat, hergebruiken latere herverbindingen met het opgeslagen geroteerde token de
gecachete goedgekeurde scopes van dat token. Als je expliciete `--scope`-waarden doorgeeft, worden die
de opgeslagen scopeset voor toekomstige herverbindingen met gecachete tokens.
Niet-beheerbellers met een gekoppeld apparaat kunnen alleen hun **eigen** apparaattoken roteren.
De scopeset van het doeltoken moet binnen de eigen operatorscopes van de bellersessie blijven;
rotatie kan geen breder operatortoken minten of behouden dan de beller al heeft.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Retourneert rotatiemetadata als JSON. Als de beller zijn eigen token roteert terwijl hij
met dat apparaattoken is geauthenticeerd, bevat het antwoord ook het vervangende
token zodat de client het kan bewaren voordat er opnieuw wordt verbonden. Gedeelde/beheerrotaties
geven het bearer-token niet terug.

### `openclaw devices revoke --device <id> --role <role>`

Trek een apparaattoken voor een specifieke rol in.

Niet-beheerbellers met een gekoppeld apparaat kunnen alleen hun **eigen** apparaattoken intrekken.
Het intrekken van het token van een ander apparaat vereist `operator.admin`.
De scopeset van het doeltoken moet ook binnen de eigen operatorscopes van de bellersessie passen;
bellers met alleen koppelingsrechten kunnen geen admin-/write-operatortokens intrekken.

```
openclaw devices revoke --device <deviceId> --role node
```

Retourneert het intrekkingsresultaat als JSON.

## Algemene opties

- `--url <url>`: Gateway-WebSocket-URL (standaard `gateway.remote.url` wanneer geconfigureerd).
- `--token <token>`: Gateway-token (indien vereist).
- `--password <password>`: Gateway-wachtwoord (wachtwoordauth).
- `--timeout <ms>`: RPC-time-out.
- `--json`: JSON-uitvoer (aanbevolen voor scripting).

<Warning>
Wanneer je `--url` instelt, valt de CLI niet terug op configuratie- of omgevingscredentials. Geef `--token` of `--password` expliciet door. Ontbrekende expliciete credentials is een fout.
</Warning>

## Opmerkingen

- Tokenrotatie retourneert een nieuw token (gevoelig). Behandel het als een geheim.
- Deze commando's vereisen de scope `operator.pairing` (of `operator.admin`). Sommige
  goedkeuringen vereisen ook dat de beller de operatorscopes bezit die het doelapparaat
  zou minten of erven; zie [Operatorscopes](/nl/gateway/operator-scopes).
- `gateway.nodes.pairing.autoApproveCidrs` is een opt-in Gateway-beleid alleen voor
  nieuwe koppelingen van node-apparaten; het verandert de goedkeuringsbevoegdheid van de CLI niet.
- Tokenrotatie en -intrekking blijven binnen de goedgekeurde koppelingsrollenset en
  goedgekeurde scopebaseline voor dat apparaat. Een verdwaald gecachet tokenitem verleent geen
  tokenbeheerdoel.
- Voor gekoppelde apparaattokensessies is beheer over apparaten heen alleen voor beheerders:
  `remove`, `rotate` en `revoke` zijn alleen voor het eigen apparaat, tenzij de beller
  `operator.admin` heeft.
- Tokenmutatie is ook beperkt door de scope van de beller: een sessie met alleen koppelingsrechten kan geen
  token roteren of intrekken dat momenteel `operator.admin` of
  `operator.write` draagt.
- `devices clear` is bewust afgeschermd met `--yes`.
- Als koppelingsscope niet beschikbaar is op local loopback (en er geen expliciete `--url` is doorgegeven), kunnen list/approve een lokale koppelingsfallback gebruiken.
- `devices approve` vereist een expliciete verzoek-ID voordat tokens worden gemint; het weglaten van `requestId` of het doorgeven van `--latest` toont alleen een voorbeeld van het nieuwste openstaande verzoek.

## Checklist voor herstel bij tokenafwijking

Gebruik dit wanneer Control UI of andere clients blijven falen met `AUTH_TOKEN_MISMATCH` of `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Bevestig de huidige gateway-tokenbron:

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

Opmerkingen:

- De normale auth-volgorde bij opnieuw verbinden is eerst expliciet gedeeld token/wachtwoord, daarna expliciete `deviceToken`, daarna opgeslagen apparaattoken en daarna bootstrap-token.
- Vertrouwd herstel van `AUTH_TOKEN_MISMATCH` kan tijdelijk zowel het gedeelde token als het opgeslagen apparaattoken samen verzenden voor die ene begrensde nieuwe poging.

Gerelateerd:

- [Probleemoplossing voor Dashboard-auth](/nl/web/dashboard#if-you-see-unauthorized-1008)
- [Probleemoplossing voor Gateway](/nl/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Nodes](/nl/nodes)
