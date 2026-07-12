---
read_when:
    - U keurt aanvragen voor het koppelen van apparaten goed
    - Je moet apparaattokens roteren of intrekken
summary: CLI-referentie voor `openclaw devices` (apparaatkoppeling + tokenrotatie/-intrekking)
title: Apparaten
x-i18n:
    generated_at: "2026-07-12T08:42:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fb10f7a484fec06bfa5e53ae50181b12a9724746176bbace330ec468235494
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Beheer koppelingsverzoeken van apparaten en apparaatspecifieke tokens.

## Algemene opties

- `--url <url>`: Gateway-WebSocket-URL (standaard `gateway.remote.url` indien geconfigureerd)
- `--token <token>`: Gateway-token (indien vereist)
- `--password <password>`: Gateway-wachtwoord (wachtwoordauthenticatie)
- `--timeout <ms>`: RPC-time-out
- `--json`: JSON-uitvoer (aanbevolen voor scripts)

<Warning>
Wanneer u `--url` instelt, valt de CLI niet terug op configuratie- of omgevingsreferenties. Geef `--token` of `--password` expliciet door, anders geeft de opdracht een fout.
</Warning>

## Opdrachten

### `openclaw devices list`

Toon openstaande koppelingsverzoeken en gekoppelde apparaten.

```bash
openclaw devices list
openclaw devices list --json
```

Bij een openstaand verzoek op een al gekoppeld apparaat toont de uitvoer de aangevraagde toegang naast de momenteel goedgekeurde toegang van het apparaat, zodat uitbreidingen van bereik of rol zichtbaar zijn en niet lijken op een verloren koppeling.

Weergavenamen van gekoppelde apparaten gebruiken deze volgorde van prioriteit: operatorlabel (`operatorLabel` van `devices rename`), vervolgens `displayName` van de client, daarna `clientId` en ten slotte `deviceId`.

### `openclaw devices approve [requestId] [--latest]`

Keur een openstaand koppelingsverzoek goed aan de hand van de exacte `requestId`. Als u `requestId` weglaat of `--latest` doorgeeft, wordt alleen een voorbeeld van het nieuwste openstaande verzoek getoond en wordt afgesloten (code 1); voer de opdracht opnieuw uit met de exacte aanvraag-ID om het verzoek goed te keuren.

```bash
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

<Note>
Als een apparaat opnieuw probeert te koppelen met gewijzigde authenticatiegegevens (rol, bereiken of openbare sleutel), vervangt OpenClaw de vorige openstaande vermelding door een nieuwe `requestId`. Voer vlak vóór de goedkeuring `openclaw devices list` uit om de actuele ID op te halen.
</Note>

Gedrag bij goedkeuring:

- Als het apparaat al is gekoppeld en bredere bereiken of een andere rol aanvraagt, behoudt OpenClaw de bestaande goedkeuring en maakt het een nieuw openstaand upgradeverzoek. Vergelijk `Requested` met `Approved` in `openclaw devices list`, of bekijk een voorbeeld met `--latest`, voordat u het verzoek goedkeurt.
- Voor het goedkeuren van een `node`-rol of een andere rol die geen operatorrol is, is `operator.admin` vereist. `operator.pairing` volstaat voor goedkeuringen van operatorapparaten, maar alleen wanneer de aangevraagde operatorbereiken binnen de eigen bereiken van de aanroeper blijven. Zie [Operatorbereiken](/nl/gateway/operator-scopes).
- Als `gateway.nodes.pairing.autoApproveCidrs` is geconfigureerd, kunnen eerste verzoeken met `role: node` vanaf overeenkomende client-IP-adressen automatisch worden goedgekeurd voordat ze in deze lijst verschijnen. Dit is standaard uitgeschakeld en geldt nooit voor operator-/browserclients of upgradeverzoeken.
- `gateway.nodes.pairing.sshVerify` (standaard ingeschakeld) keurt eerste verzoeken met `role: node` automatisch goed wanneer de Gateway de apparaatsleutel via SSH verifieert bij de nodehost. Verzoeken kunnen daarom kort nadat ze verschijnen al als goedgekeurd worden afgehandeld. Stel `sshVerify: false` in om SSH-verificatie uit te schakelen; dit staat los van `autoApproveCidrs`, dus schakel dat eveneens uit voor uitsluitend handmatige koppeling.

### `openclaw devices reject <requestId>`

Wijs een openstaand koppelingsverzoek van een apparaat af.

```bash
openclaw devices reject <requestId>
```

### `openclaw devices remove <deviceId>`

Verwijder één vermelding van een gekoppeld apparaat.

```bash
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

Een aanroeper die is geauthenticeerd met een token van een gekoppeld apparaat kan alleen de vermelding van het **eigen** apparaat verwijderen. Voor het verwijderen van een ander apparaat is `operator.admin` vereist.

### `openclaw devices rename --device <id> --name <label>`

Wijs een operatorlabel toe aan een gekoppeld apparaat. Labels zijn status aan de eigenaarszijde: ze blijven behouden bij herstel van koppelingen en hernieuwde goedkeuringen van rollen, en wijzigen de stabiele `deviceId` niet.

```bash
openclaw devices rename --device <deviceId> --name "Kitchen Mac"
openclaw devices rename --device <deviceId> --name "Kitchen Mac" --json
```

- `--name` is vereist, wordt ontdaan van omringende witruimte, mag niet leeg zijn en is beperkt tot 64 tekens.
- Weergaveoppervlakken (CLI-lijst, inventaris van de Control UI) geven de voorkeur aan het operatorlabel boven de door de client gemelde weergavenaam.
- Een aanroeper van een gekoppeld apparaat zonder beheerdersrechten kan alleen het **eigen** apparaat hernoemen. Voor het hernoemen van een ander apparaat is `operator.admin` vereist.

### `openclaw devices clear --yes [--pending]`

Wis gekoppelde apparaten in bulk. Beveiligd met `--yes`.

```bash
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

`--pending` wijst ook alle openstaande koppelingsverzoeken af.

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Roteer een apparaattoken voor een rol en werk desgewenst de bereiken ervan bij.

```bash
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

- De doelrol moet al bestaan in het goedgekeurde koppelingscontract van dat apparaat; rotatie kan geen nieuwe, niet-goedgekeurde rol uitgeven.
- Als u `--scope` weglaat, worden bij latere nieuwe verbindingen de in de cache opgeslagen, goedgekeurde bereiken van het opgeslagen token hergebruikt. Het doorgeven van expliciete `--scope`-waarden vervangt de opgeslagen verzameling bereiken voor toekomstige nieuwe verbindingen met een token uit de cache.
- Een aanroeper van een gekoppeld apparaat zonder beheerdersrechten kan alleen het token van het **eigen** apparaat roteren, en de doelverzameling van bereiken moet binnen de eigen operatorbereiken van de aanroeper blijven; rotatie kan geen token uitgeven of behouden met bredere rechten dan de aanroeper al heeft.

Retourneert rotatiemetadata als JSON. Als de aanroeper het eigen token roteert terwijl deze met dat apparaattoken is geauthenticeerd, bevat het antwoord het vervangende token, zodat de client dit vóór het opnieuw verbinden kan opslaan. Bij gedeelde rotaties of rotaties door beheerders wordt het bearer-token nooit teruggegeven.

### `openclaw devices revoke --device <id> --role <role>`

Trek een apparaattoken voor een rol in.

```bash
openclaw devices revoke --device <deviceId> --role node
```

Een aanroeper van een gekoppeld apparaat zonder beheerdersrechten kan alleen het token van het **eigen** apparaat intrekken. Voor het intrekken van het token van een ander apparaat is `operator.admin` vereist. De doelverzameling van bereiken moet ook binnen de eigen operatorbereiken van de aanroeper vallen; aanroepers met alleen koppelingsrechten kunnen geen operator-tokens met beheer-/schrijfrechten intrekken.

## Opmerkingen

- Voor deze opdrachten is het bereik `operator.pairing` (of `operator.admin`) vereist. Apparaatrollen die geen operatorrol zijn, vereisen altijd `operator.admin`; zie [Operatorbereiken](/nl/gateway/operator-scopes).
- Tokenrotatie en -intrekking blijven binnen de goedgekeurde verzameling koppelingsrollen en het basisbereik van het apparaat. Een verdwaalde tokenvermelding in de cache verleent geen doel voor tokenbeheer.
- Voor tokensessies van gekoppelde apparaten is beheer tussen apparaten (`remove`, `rename`, `rotate`, `revoke`) beperkt tot het eigen apparaat, tenzij de aanroeper `operator.admin` heeft.
- Tokenrotatie retourneert een nieuw token (gevoelig) — behandel dit als een geheim.
- Als het koppelingsbereik niet beschikbaar is op local loopback en geen expliciete `--url` wordt doorgegeven, kunnen `list`/`approve` terugvallen op de lokale koppelingsstatus.

## Controlelijst voor herstel van tokenafwijkingen

Gebruik dit wanneer de Control UI of andere clients blijven mislukken met `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` of `AUTH_SCOPE_MISMATCH`.

1. Bevestig de huidige bron van het Gateway-token:

   ```bash
   openclaw config get gateway.auth.token
   ```

2. Toon gekoppelde apparaten en identificeer de ID van het getroffen apparaat:

   ```bash
   openclaw devices list
   ```

3. Roteer het operatortoken voor het getroffen apparaat:

   ```bash
   openclaw devices rotate --device <deviceId> --role operator
   ```

4. Als rotatie niet voldoende is, verwijder dan de verouderde koppeling en keur deze opnieuw goed:

   ```bash
   openclaw devices remove <deviceId>
   openclaw devices list
   openclaw devices approve <requestId>
   ```

5. Probeer de clientverbinding opnieuw met het huidige gedeelde token/wachtwoord.

Opmerkingen:

- Normale prioriteitsvolgorde voor authenticatie bij opnieuw verbinden: eerst het expliciete gedeelde token/wachtwoord, daarna de expliciete `deviceToken`, vervolgens het opgeslagen apparaattoken en ten slotte het bootstrap-token.
- Bij vertrouwd herstel van `AUTH_TOKEN_MISMATCH` kunnen tijdelijk zowel het gedeelde token als het opgeslagen apparaattoken samen worden verzonden voor één begrensde nieuwe poging.
- `AUTH_SCOPE_MISMATCH` betekent dat het apparaattoken is herkend, maar niet de aangevraagde verzameling bereiken bevat; herstel het goedkeuringscontract voor koppeling/bereik voordat u de gedeelde Gateway-authenticatie wijzigt.

Gerelateerd:

- [Problemen met dashboardauthenticatie oplossen](/nl/web/dashboard#if-you-see-unauthorized-1008)
- [Problemen met de Gateway oplossen](/nl/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Goedkeuring bij de eerste uitvoering van Paperclip / `openclaw_gateway`

Paperclip-agents die via de `openclaw_gateway`-adapter verbinding maken, doorlopen dezelfde goedkeuring voor apparaatkoppeling bij de eerste uitvoering als elke andere nieuwe client. Als Paperclip `openclaw_gateway_pairing_required` meldt, keur dan het openstaande apparaat goed en probeer het opnieuw.

```bash
openclaw devices approve --latest
```

Het voorbeeld toont de exacte opdracht `openclaw devices approve <requestId>`; controleer de details en voer die opdracht vervolgens opnieuw uit met de aanvraag-ID om het verzoek goed te keuren. Geef voor een externe Gateway of expliciete referenties dezelfde opties door bij het bekijken van het voorbeeld en het goedkeuren:

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

Om te voorkomen dat na elke herstart opnieuw goedkeuring nodig is, configureert u in Paperclip een permanente `adapterConfig.devicePrivateKeyPem` in plaats van bij elke uitvoering een nieuwe tijdelijke apparaatidentiteit te laten genereren:

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

Als de goedkeuring blijft mislukken, voert u eerst `openclaw devices list` uit om te bevestigen dat er een openstaand verzoek bestaat.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Nodes](/nl/nodes)
