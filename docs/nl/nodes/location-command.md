---
read_when:
    - Ondersteuning voor locatienodes of een machtigingeninterface toevoegen
    - Android-locatiemachtigingen of gedrag op de voorgrond ontwerpen
summary: Locatieopdracht voor Nodes, platformtoestemmingsmodi en Linux GeoClue-configuratie
title: Locatieopdracht
x-i18n:
    generated_at: "2026-07-16T15:51:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 644229c1eafc8fc7b59bc23ba01d4ba95687ea66c4f9bd4a4cda98a87f2b6085
    source_path: nodes/location-command.md
    workflow: 16
---

## TL;DR

- `location.get` is een Node-opdracht die wordt aangeroepen via `node.invoke` of `openclaw nodes location get`.
- Standaard uitgeschakeld.
- Android-builds van derden gebruiken een keuzelijst: Uit / Tijdens gebruik / Altijd. Play-builds blijven Uit / Tijdens gebruik.
- Nauwkeurige locatie is een afzonderlijke schakelaar.

## Waarom een keuzelijst (en niet alleen een schakelaar)

Locatiemachtigingen van het besturingssysteem hebben meerdere niveaus. Nauwkeurige locatie is ook een afzonderlijke toestemming van het besturingssysteem (iOS 14+ "Precise", Android "fine" versus "coarse"). De keuzelijst in de app bepaalt de aangevraagde modus, maar het besturingssysteem beslist nog steeds welke toestemming daadwerkelijk wordt verleend.

## Instellingenmodel

Per Node-apparaat:

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

Gedrag van de gebruikersinterface:

- Als je `whileUsing` selecteert, wordt toestemming voor gebruik op de voorgrond aangevraagd.
- Als je `always` selecteert in de Android-build van derden, wordt eerst toestemming voor gebruik op de voorgrond aangevraagd, vervolgens wordt toegang op de achtergrond uitgelegd en worden ten slotte de Android-appinstellingen geopend voor de afzonderlijke toestemming **Allow all the time**.
- Android Play-builds declareren geen machtiging voor locatie op de achtergrond en tonen `always` niet.
- Als het besturingssysteem het aangevraagde niveau weigert, valt de app terug op het hoogste verleende niveau en toont de status.

## Toewijzing van machtigingen (node.permissions)

Optioneel. De macOS-Node rapporteert `location` via de `permissions`-toewijzing op `node.list`/`node.describe`; iOS/Android kan dit weglaten.

## Opdracht: `location.get`

Aangeroepen via `node.invoke` of de CLI-helper:

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

- `LOCATION_DISABLED`: de keuzelijst staat uit.
- `LOCATION_PERMISSION_REQUIRED`: de machtiging voor de aangevraagde modus ontbreekt.
- `LOCATION_BACKGROUND_UNAVAILABLE`: de app bevindt zich op de achtergrond, maar alleen Tijdens gebruik is toegestaan.
- `LOCATION_TIMEOUT`: niet tijdig een locatiebepaling verkregen.
- `LOCATION_UNAVAILABLE`: systeemfout of geen providers.

## Gedrag op de achtergrond

- Android-builds van derden accepteren `location.get` op de achtergrond alleen wanneer de gebruiker `Always` heeft geselecteerd en Android locatie op de achtergrond heeft toegestaan. De bestaande permanente Node-service voegt het servicetype `location` toe en vermeldt `Location: Always` zolang deze actief is.
- Android Play-builds en de modus `While Using` weigeren `location.get` wanneer de app zich op de achtergrond bevindt.
- Andere Node-platforms kunnen hiervan afwijken.

## Linux-Node-host

De meegeleverde Linux Node-plugin voegt `location.get` toe aan de CLI-service `openclaw node`, inclusief headless hosts zonder de Linux-desktopapp. Locatie staat standaard uit. Schakel deze in onder de pluginvermelding en start vervolgens de Node-service opnieuw:

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          location: { enabled: true },
        },
      },
    },
  },
}
```

Installeer GeoClue2 en de bijbehorende `where-am-i`-demo (`geoclue-2-demo` op Debian en Ubuntu). De gebruiker van de Node-service moet toestemming hebben volgens het GeoClue-beleid en de autorisatieagent van de host.

De plugin gebruikt `where-am-i` in plaats van een reeks aanroepen van `busctl`. GeoClue koppelt het maken van de client, eigenschappen, starten, updates en stoppen aan één D-Bus-clientverbinding; de demo houdt die levenscyclus bijeen, terwijl afzonderlijke `busctl`-subprocessen dat niet doen. Er wordt geen npm-afhankelijkheid toegevoegd.

Linux wijst `coarse`, `balanced` en `precise` toe aan de GeoClue-nauwkeurigheidsniveaus `4`, `6` en `8`. Het valideert `maxAgeMs` aan de hand van het geretourneerde tijdstempel. De demo van GeoClue maakt de geselecteerde provider niet beschikbaar, dus `source` is `unknown`; `isPrecise` is alleen waar wanneer de gerapporteerde nauwkeurigheid 100 meter of beter is.

Linux gebruikt dezelfde stabiele fouten: `LOCATION_DISABLED`, `LOCATION_TIMEOUT` en `LOCATION_UNAVAILABLE`.

## Integratie met modellen en tooling

- Agent-tool: de actie `location_get` van de tool `nodes` (Node vereist).
- CLI: `openclaw nodes location get --node <id>`.
- Richtlijnen voor de Agent: alleen aanroepen wanneer de gebruiker locatie heeft ingeschakeld en de reikwijdte begrijpt.

## UX-tekst (suggestie)

- Uit: "Het delen van je locatie is uitgeschakeld."
- Tijdens gebruik: "Alleen wanneer OpenClaw geopend is."
- Altijd: "Sta aangevraagde locatiecontroles toe terwijl OpenClaw op de achtergrond actief is."
- Nauwkeurig: "Gebruik de nauwkeurige GPS-locatie. Schakel dit uit om je geschatte locatie te delen."

## Gerelateerd

- [Overzicht van Nodes](/nl/nodes)
- [Locatieverwerking voor kanalen](/nl/channels/location)
- [Camera-opname](/nl/nodes/camera)
- [Gespreksmodus](/nl/nodes/talk)
