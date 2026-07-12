---
read_when:
    - Ondersteuning voor locatienodes of een machtigingeninterface toevoegen
    - Android-locatiemachtigingen of gedrag op de voorgrond ontwerpen
summary: Locatieopdracht voor nodes (location.get), machtigingsmodi en Android-gedrag op de voorgrond
title: Locatieopdracht
x-i18n:
    generated_at: "2026-07-12T09:05:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fae9f7707620f3f743d40c07618a431a6baa7a357dda6d74021bc986cd4974b1
    source_path: nodes/location-command.md
    workflow: 16
---

## Kort samengevat

- `location.get` is een Node-opdracht die wordt aangeroepen via `node.invoke` of `openclaw nodes location get`.
- Standaard uitgeschakeld.
- Android-builds van derden gebruiken een keuzelijst: Uit / Tijdens gebruik / Altijd. Play-builds blijven Uit / Tijdens gebruik gebruiken.
- Nauwkeurige locatie is een aparte schakelaar.

## Waarom een keuzelijst (en niet alleen een schakelaar)

Locatiemachtigingen van het besturingssysteem hebben meerdere niveaus. Nauwkeurige locatie is ook een afzonderlijke machtiging van het besturingssysteem (iOS 14+ ‘Nauwkeurig’, Android ‘fijn’ versus ‘grof’). De keuzelijst in de app bepaalt de aangevraagde modus, maar het besturingssysteem beslist nog steeds welke machtiging daadwerkelijk wordt verleend.

## Instellingenmodel

Per Node-apparaat:

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

Gedrag van de gebruikersinterface:

- Als `whileUsing` wordt geselecteerd, wordt toestemming voor gebruik op de voorgrond aangevraagd.
- Als `always` wordt geselecteerd in de Android-build van derden, wordt eerst toestemming voor gebruik op de voorgrond aangevraagd, wordt de achtergrondtoegang toegelicht en worden vervolgens de Android-appinstellingen geopend voor de afzonderlijke machtiging **Allow all the time**.
- Android Play-builds declareren geen machtiging voor locatiegebruik op de achtergrond en tonen `always` niet.
- Als het besturingssysteem het aangevraagde niveau weigert, valt de app terug op het hoogste verleende niveau en toont deze de status.

## Toewijzing van machtigingen (node.permissions)

Optioneel. De macOS-Node rapporteert `location` via de `permissions`-toewijzing in `node.list`/`node.describe`; iOS/Android kan dit weglaten.

## Opdracht: `location.get`

Aangeroepen via `node.invoke` of met het CLI-hulpprogramma:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Parameters:

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

CLI-vlaggen worden rechtstreeks toegewezen: `--location-timeout` -> `timeoutMs`, `--max-age` -> `maxAgeMs`, `--accuracy` -> `desiredAccuracy`.

Antwoordpayload:

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

Fouten (stabiele codes):

- `LOCATION_DISABLED`: de keuzelijst staat op uit.
- `LOCATION_PERMISSION_REQUIRED`: de machtiging voor de aangevraagde modus ontbreekt.
- `LOCATION_BACKGROUND_UNAVAILABLE`: de app bevindt zich op de achtergrond, maar alleen Tijdens gebruik is toegestaan.
- `LOCATION_TIMEOUT`: niet op tijd een locatiebepaling verkregen.
- `LOCATION_UNAVAILABLE`: systeemfout of geen locatieproviders beschikbaar.

## Gedrag op de achtergrond

- Android-builds van derden accepteren `location.get` op de achtergrond alleen wanneer de gebruiker `Always` heeft geselecteerd en Android locatietoegang op de achtergrond heeft verleend. De bestaande permanente Node-service voegt het servicetype `location` toe en toont `Location: Always` zolang deze actief is.
- Android Play-builds en de modus `While Using` weigeren `location.get` wanneer de app zich op de achtergrond bevindt.
- Andere Node-platforms kunnen zich anders gedragen.

## Integratie met modellen en hulpmiddelen

- Agenthulpmiddel: de actie `location_get` van het hulpmiddel `nodes` (Node vereist).
- CLI: `openclaw nodes location get --node <id>`.
- Richtlijnen voor agenten: alleen aanroepen wanneer de gebruiker locatie heeft ingeschakeld en de reikwijdte begrijpt.

## UX-tekst (voorstel)

- Uit: ‘Locatie delen is uitgeschakeld.’
- Tijdens gebruik: ‘Alleen wanneer OpenClaw geopend is.’
- Altijd: ‘Sta aangevraagde locatiecontroles toe terwijl OpenClaw op de achtergrond actief is.’
- Nauwkeurig: ‘Gebruik de nauwkeurige GPS-locatie. Schakel dit uit om een geschatte locatie te delen.’

## Gerelateerd

- [Overzicht van Nodes](/nl/nodes)
- [Verwerking van kanaallocaties](/nl/channels/location)
- [Camera-opname](/nl/nodes/camera)
- [Gespreksmodus](/nl/nodes/talk)
