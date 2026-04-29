---
read_when:
    - U keurt verzoeken voor apparaatkoppeling goed
    - U moet apparaattokens roteren of intrekken
summary: CLI-referentie voor `openclaw devices` (apparaatkoppeling + tokenrotatie/-intrekking)
title: Apparaten
x-i18n:
    generated_at: "2026-04-29T22:31:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: df105135a12ec733e45a67792e8447628f1538fc2536a008d615d46d1eaff5c8
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Beheer apparaatkoppelingsverzoeken en apparaatspecifieke tokens.

## Opdrachten

### `openclaw devices list`

Toon openstaande koppelingsverzoeken en gekoppelde apparaten.

```
openclaw devices list
openclaw devices list --json
```

De uitvoer voor openstaande verzoeken toont de aangevraagde toegang naast de huidige goedgekeurde toegang van het apparaat wanneer het apparaat al is gekoppeld. Dit maakt scope-/rolupgrades expliciet in plaats van dat het lijkt alsof de koppeling verloren is gegaan.

### `openclaw devices remove <deviceId>`

Verwijder één gekoppelde apparaatvermelding.

Wanneer je bent geauthenticeerd met een gekoppeld apparaattoken, kunnen niet-beheerbellers alleen **hun eigen** apparaatvermelding verwijderen. Voor het verwijderen van een ander apparaat is `operator.admin` vereist.

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

Keur een openstaand apparaatkoppelingsverzoek goed op exacte `requestId`. Als `requestId` wordt weggelaten of `--latest` wordt meegegeven, drukt OpenClaw alleen het geselecteerde openstaande verzoek af en stopt het; voer de goedkeuring opnieuw uit met de exacte verzoek-ID nadat je de details hebt gecontroleerd.

<Note>
Als een apparaat opnieuw probeert te koppelen met gewijzigde auth-details (rol, scopes of openbare sleutel), vervangt OpenClaw de vorige openstaande vermelding en geeft het een nieuwe `requestId` uit. Voer vlak voor goedkeuring `openclaw devices list` uit om de huidige ID te gebruiken.
</Note>

Als het apparaat al is gekoppeld en om bredere scopes of een bredere rol vraagt, houdt OpenClaw de bestaande goedkeuring van kracht en maakt het een nieuw openstaand upgradeverzoek aan. Controleer de kolommen `Requested` versus `Approved` in `openclaw devices list` of gebruik `openclaw devices approve --latest` om de exacte upgrade te bekijken voordat je deze goedkeurt.

Als de Gateway expliciet is geconfigureerd met `gateway.nodes.pairing.autoApproveCidrs`, kunnen eerste `role: node`-verzoeken van overeenkomende client-IP's worden goedgekeurd voordat ze in deze lijst verschijnen. Dat beleid is standaard uitgeschakeld en is nooit van toepassing op operator-/browserclients of upgradeverzoeken.

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

Roteer een apparaattoken voor een specifieke rol (waarbij scopes optioneel worden bijgewerkt).
De doelrol moet al bestaan in het goedgekeurde koppelingscontract van dat apparaat; rotatie kan geen nieuwe niet-goedgekeurde rol uitgeven.
Als je `--scope` weglaat, gebruiken latere herverbindingen met het opgeslagen geroteerde token opnieuw de gecachete goedgekeurde scopes van dat token. Als je expliciete `--scope`-waarden doorgeeft, worden die de opgeslagen scopeset voor toekomstige herverbindingen met gecachte tokens.
Niet-beheerbellers met gekoppelde apparaten kunnen alleen hun **eigen** apparaattoken roteren.
De scopeset van het doeltoken moet binnen de eigen operatorscopes van de sessie van de beller blijven; rotatie kan geen breder operatortoken uitgeven of behouden dan de beller al heeft.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Retourneert rotatiemetadata als JSON. Als de beller zijn eigen token roteert terwijl hij met dat apparaattoken is geauthenticeerd, bevat de respons ook het vervangende token zodat de client dit kan bewaren voordat er opnieuw verbinding wordt gemaakt. Gedeelde/beheerrotaties geven het bearer-token niet terug.

### `openclaw devices revoke --device <id> --role <role>`

Trek een apparaattoken voor een specifieke rol in.

Niet-beheerbellers met gekoppelde apparaten kunnen alleen hun **eigen** apparaattoken intrekken.
Voor het intrekken van het token van een ander apparaat is `operator.admin` vereist.
De scopeset van het doeltoken moet ook binnen de eigen operatorscopes van de sessie van de beller passen; callers die alleen kunnen koppelen, kunnen geen admin-/write-operatortokens intrekken.

```
openclaw devices revoke --device <deviceId> --role node
```

Retourneert het intrekkingsresultaat als JSON.

## Algemene opties

- `--url <url>`: Gateway-WebSocket-URL (standaard `gateway.remote.url` wanneer geconfigureerd).
- `--token <token>`: Gateway-token (indien vereist).
- `--password <password>`: Gateway-wachtwoord (wachtwoordauthenticatie).
- `--timeout <ms>`: RPC-time-out.
- `--json`: JSON-uitvoer (aanbevolen voor scripting).

<Warning>
Wanneer je `--url` instelt, valt de CLI niet terug op configuratie- of omgevingsreferenties. Geef `--token` of `--password` expliciet door. Ontbrekende expliciete referenties zijn een fout.
</Warning>

## Opmerkingen

- Tokenrotatie retourneert een nieuw token (gevoelig). Behandel het als een geheim.
- Deze opdrachten vereisen scope `operator.pairing` (of `operator.admin`).
- `gateway.nodes.pairing.autoApproveCidrs` is een opt-in Gateway-beleid alleen voor nieuwe `node`-apparaatkoppelingen; het verandert de goedkeuringsbevoegdheid van de CLI niet.
- Tokenrotatie en -intrekking blijven binnen de goedgekeurde koppelingsrollenset en goedgekeurde scopebasislijn voor dat apparaat. Een verdwaalde gecachte tokenvermelding geeft geen doel voor tokenbeheer.
- Voor apparaattokensessies met gekoppelde apparaten is beheer tussen apparaten alleen voor beheerders: `remove`, `rotate` en `revoke` zijn alleen voor het eigen apparaat, tenzij de beller `operator.admin` heeft.
- Tokenmutatie blijft ook beperkt tot de scope van de beller: een sessie die alleen kan koppelen, kan geen token roteren of intrekken dat momenteel `operator.admin` of `operator.write` bevat.
- `devices clear` wordt bewust afgeschermd met `--yes`.
- Als koppelingsscope niet beschikbaar is op local loopback (en er geen expliciete `--url` is doorgegeven), kunnen list/approve een lokale koppelingsfallback gebruiken.
- `devices approve` vereist een expliciete verzoek-ID voordat tokens worden uitgegeven; het weglaten van `requestId` of doorgeven van `--latest` toont alleen een voorbeeld van het nieuwste openstaande verzoek.

## Checklist voor herstel van tokendrift

Gebruik dit wanneer Control UI of andere clients blijven mislukken met `AUTH_TOKEN_MISMATCH` of `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Bevestig de huidige Gateway-tokenbron:

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

- Normale auth-voorrang bij herverbinden is eerst expliciet gedeeld token/wachtwoord, daarna expliciet `deviceToken`, daarna opgeslagen apparaattoken en daarna bootstrap-token.
- Vertrouwd herstel van `AUTH_TOKEN_MISMATCH` kan tijdelijk zowel het gedeelde token als het opgeslagen apparaattoken samen verzenden voor de ene begrensde nieuwe poging.

Gerelateerd:

- [Probleemoplossing voor dashboard-auth](/nl/web/dashboard#if-you-see-unauthorized-1008)
- [Probleemoplossing voor Gateway](/nl/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Nodes](/nl/nodes)
