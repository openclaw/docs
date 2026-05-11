---
read_when:
    - U keurt verzoeken voor apparaatkoppeling goed
    - Je moet apparaattokens roteren of intrekken
summary: CLI-referentie voor `openclaw devices` (apparaatkoppeling + tokenrotatie/-intrekking)
title: Apparaten
x-i18n:
    generated_at: "2026-05-11T20:26:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: b38caf47697d5fd6c630285c53919f3a5eaf704b1992e57adb1902e20e2a0fc0
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Beheer apparaatkoppelingsaanvragen en tokens met apparaatscope.

## Commando's

### `openclaw devices list`

Toon koppelingsaanvragen in behandeling en gekoppelde apparaten.

```
openclaw devices list
openclaw devices list --json
```

Uitvoer voor aanvragen in behandeling toont de aangevraagde toegang naast de huidige
goedgekeurde toegang van het apparaat wanneer het apparaat al is gekoppeld. Dit maakt scope-/rolupgrades expliciet in plaats van dat het lijkt alsof de koppeling verloren is gegaan.

### `openclaw devices remove <deviceId>`

Verwijder één gekoppelde apparaatvermelding.

Wanneer je bent geauthenticeerd met een gekoppeld apparaattoken, kunnen niet-adminaanroepers
alleen **hun eigen** apparaatvermelding verwijderen. Het verwijderen van een ander apparaat vereist
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

Keur een apparaatkoppelingsaanvraag in behandeling goed met de exacte `requestId`. Als `requestId`
wordt weggelaten of `--latest` wordt doorgegeven, drukt OpenClaw alleen de geselecteerde aanvraag
in behandeling af en sluit af; voer goedkeuring opnieuw uit met de exacte aanvraag-ID nadat je
de details hebt gecontroleerd.

<Note>
Als een apparaat opnieuw probeert te koppelen met gewijzigde authgegevens (rol, scopes of publieke sleutel), vervangt OpenClaw de eerdere vermelding in behandeling en geeft het een nieuwe `requestId` uit. Voer `openclaw devices list` direct vóór goedkeuring uit om de huidige ID te gebruiken.
</Note>

Als het apparaat al is gekoppeld en om bredere scopes of een bredere rol vraagt,
laat OpenClaw de bestaande goedkeuring staan en maakt het een nieuwe upgradeaanvraag
in behandeling aan. Controleer de kolommen `Requested` versus `Approved` in `openclaw devices list`
of gebruik `openclaw devices approve --latest` om de exacte upgrade vooraf te bekijken voordat
je deze goedkeurt.

Als de Gateway expliciet is geconfigureerd met
`gateway.nodes.pairing.autoApproveCidrs`, kunnen eerste `role: node`-aanvragen van
overeenkomende client-IP's worden goedgekeurd voordat ze in deze lijst verschijnen. Dat beleid
is standaard uitgeschakeld en is nooit van toepassing op operator-/browserclients of upgradeaanvragen.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Wijs een apparaatkoppelingsaanvraag in behandeling af.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Roteer een apparaattoken voor een specifieke rol (optioneel met bijgewerkte scopes).
De doelrol moet al bestaan in het goedgekeurde koppelingscontract van dat apparaat;
rotatie kan geen nieuwe niet-goedgekeurde rol uitgeven.
Als je `--scope` weglaat, hergebruiken latere herverbindingen met het opgeslagen geroteerde token
de gecachte goedgekeurde scopes van dat token. Als je expliciete `--scope`-waarden doorgeeft, worden die
de opgeslagen scopeset voor toekomstige herverbindingen met gecachte tokens.
Niet-adminaanroepers met een gekoppeld apparaat kunnen alleen hun **eigen** apparaattoken roteren.
De scopeset van het doeltoken moet binnen de eigen operatorscopes van de aanroepersessie blijven;
rotatie kan geen breder operatortoken uitgeven of behouden dan de aanroeper al heeft.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Geeft rotatiemetadata terug als JSON. Als de aanroeper zijn eigen token roteert terwijl deze
met dat apparaattoken is geauthenticeerd, bevat de respons ook het vervangende
token zodat de client het kan bewaren voordat opnieuw verbinding wordt gemaakt. Gedeelde/adminrotaties
geven het bearer-token niet terug.

### `openclaw devices revoke --device <id> --role <role>`

Trek een apparaattoken voor een specifieke rol in.

Niet-adminaanroepers met een gekoppeld apparaat kunnen alleen hun **eigen** apparaattoken intrekken.
Het intrekken van het token van een ander apparaat vereist `operator.admin`.
De scopeset van het doeltoken moet ook binnen de eigen operatorscopes van de aanroepersessie passen;
aanroepers met alleen koppeling kunnen geen admin-/schrijf-operatortokens intrekken.

```
openclaw devices revoke --device <deviceId> --role node
```

Geeft het intrekkingsresultaat terug als JSON.

## Algemene opties

- `--url <url>`: Gateway WebSocket-URL (standaard `gateway.remote.url` wanneer geconfigureerd).
- `--token <token>`: Gateway-token (indien vereist).
- `--password <password>`: Gateway-wachtwoord (wachtwoordauthenticatie).
- `--timeout <ms>`: RPC-time-out.
- `--json`: JSON-uitvoer (aanbevolen voor scripting).

<Warning>
Wanneer je `--url` instelt, valt de CLI niet terug op configuratie- of omgevingsreferenties. Geef `--token` of `--password` expliciet door. Ontbrekende expliciete referenties zijn een fout.
</Warning>

## Opmerkingen

- Tokenrotatie geeft een nieuw token terug (gevoelig). Behandel het als een geheim.
- Deze commando's vereisen de scope `operator.pairing` (of `operator.admin`). Sommige
  goedkeuringen vereisen ook dat de aanroeper de operatorscopes bezit die het doelapparaat
  zou uitgeven of erven; zie [Operatorscopes](/nl/gateway/operator-scopes).
- `gateway.nodes.pairing.autoApproveCidrs` is een opt-in Gateway-beleid uitsluitend voor
  het koppelen van nieuwe node-apparaten; het wijzigt de goedkeuringsbevoegdheid van de CLI niet.
- Tokenrotatie en -intrekking blijven binnen de goedgekeurde koppelingsrollenset en
  goedgekeurde scopebasislijn voor dat apparaat. Een verdwaalde gecachte tokenvermelding verleent geen
  doel voor tokenbeheer.
- Voor gekoppelde-apparaattokensessies is beheer tussen apparaten alleen voor admins:
  `remove`, `rotate` en `revoke` zijn alleen voor het eigen apparaat, tenzij de aanroeper
  `operator.admin` heeft.
- Tokenmutatie is ook beperkt tot de scope van de aanroeper: een sessie met alleen koppeling kan geen
  token roteren of intrekken dat momenteel `operator.admin` of
  `operator.write` draagt.
- `devices clear` wordt bewust afgeschermd met `--yes`.
- Als koppelingsscope niet beschikbaar is op local loopback (en er geen expliciete `--url` is doorgegeven), kunnen list/approve een lokale koppelingsfallback gebruiken.
- `devices approve` vereist een expliciete aanvraag-ID voordat tokens worden uitgegeven; het weglaten van `requestId` of doorgeven van `--latest` toont alleen een voorbeeld van de nieuwste aanvraag in behandeling.

## Checklist voor herstel bij tokenafwijking

Gebruik dit wanneer Control-UI of andere clients blijven falen met `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` of `AUTH_SCOPE_MISMATCH`.

1. Bevestig de huidige bron van het Gateway-token:

```bash
openclaw config get gateway.auth.token
```

2. Toon gekoppelde apparaten en identificeer de betrokken apparaat-ID:

```bash
openclaw devices list
```

3. Roteer het operatortoken voor het betrokken apparaat:

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

- De normale authprioriteit bij opnieuw verbinden is eerst expliciet gedeeld token/wachtwoord, daarna expliciete `deviceToken`, daarna opgeslagen apparaattoken en daarna bootstrap-token.
- Vertrouwd `AUTH_TOKEN_MISMATCH`-herstel kan tijdelijk zowel het gedeelde token als het opgeslagen apparaattoken samen verzenden voor die ene begrensde nieuwe poging.
- `AUTH_SCOPE_MISMATCH` betekent dat het apparaattoken is herkend maar niet de aangevraagde scopeset draagt; herstel het koppelings-/scopegoedkeuringscontract voordat je gedeelde Gateway-auth wijzigt.

Gerelateerd:

- [Probleemoplossing voor dashboardauth](/nl/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Nodes](/nl/nodes)
