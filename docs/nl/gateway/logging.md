---
read_when:
    - Logboekuitvoer of -indelingen wijzigen
    - CLI- of Gateway-uitvoer debuggen
summary: Logboekoppervlakken, bestandslogboeken, WS-logboekstijlen en consoleopmaak
title: Gateway-logboekregistratie
x-i18n:
    generated_at: "2026-07-12T08:54:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6717be5eac3dfc1acf36b2f21b049d46c7fc3678945295b10ae69781d89d35ad
    source_path: gateway/logging.md
    workflow: 16
---

# Logboekregistratie

Zie [/logging](/nl/logging) voor een gebruikersgericht overzicht (CLI + Control UI + configuratie).

OpenClaw heeft twee logboekoppervlakken:

- **Console-uitvoer** - wat u in de terminal/Debug UI ziet.
- **Bestandslogboeken** - JSON-regels die door de Gateway-logger worden geschreven.

Bij het opstarten registreert de Gateway het bepaalde standaardmodel van de agent plus de modusstandaarden die van invloed zijn op nieuwe sessies:

```text
agent model: openai/gpt-5.6-sol (thinking=medium, fast=on)
```

`thinking` is afkomstig van de standaardagent, modelparameters of de algemene agentstandaard; als dit niet is ingesteld, wordt `medium` weergegeven. `fast` is afkomstig van de standaardagent of de `fastMode`-parameters van het model.

## Bestandslogger

- Het standaard roterende logbestand staat onder `/tmp/openclaw/` (één bestand per dag): `openclaw-YYYY-MM-DD.log`, gedateerd volgens de lokale tijdzone van de Gateway-host. Als die map onveilig of niet beschrijfbaar is (verkeerde eigenaar, door iedereen beschrijfbaar of een symbolische koppeling), valt OpenClaw terug op een gebruikersspecifiek pad `os.tmpdir()/openclaw-<uid>`; op Windows wordt altijd deze terugvaloptie voor de tijdelijke OS-map gebruikt.
- Actieve logbestanden roteren bij `logging.maxFileBytes` (standaard: 100 MB), waarbij maximaal vijf genummerde archieven (`.1` tot en met `.5`) worden bewaard en het schrijven wordt voortgezet in een nieuw actief bestand.
- Configureer het pad en niveau van het logbestand via `~/.openclaw/openclaw.json`: `logging.file`, `logging.level`.
- De bestandsindeling is één JSON-object per regel.

Codepaden voor gesprekken, realtime spraak en beheerde ruimten gebruiken de gedeelde bestandslogger voor begrensde levenscyclusregistraties die bedoeld zijn voor operationele foutopsporing en export van OTLP-logboekregistraties. Transcripttekst, audiopayloads, beurt-ID's, oproep-ID's en item-ID's van providers worden nooit naar de logboekregistratie gekopieerd.

Het tabblad Logs van de Control UI volgt dit bestand via de Gateway (`logs.tail`). De CLI doet hetzelfde:

```bash
openclaw logs --follow
```

### Uitgebreide uitvoer versus logboekniveaus

- **Bestandslogboeken** worden uitsluitend beheerd door `logging.level`.
- `--verbose` beïnvloedt alleen de **uitvoerigheid van de console** (en de WS-logboekstijl) - het verhoogt het niveau van het bestandslogboek **niet**.
- Stel `logging.level` in op `debug` of `trace` om details die alleen bij uitgebreide uitvoer beschikbaar zijn in bestandslogboeken vast te leggen.
- Trace-logboekregistratie bevat ook diagnostische tijdsamenvattingen voor geselecteerde intensief gebruikte codepaden, zoals de voorbereiding van de toolfactory van een Plugin. Zie [/tools/plugin#slow-plugin-tool-setup](/nl/tools/plugin#slow-plugin-tool-setup).

## Console vastleggen

De CLI legt `console.log/info/warn/error/debug/trace` vast, schrijft deze naar bestandslogboeken en drukt ze ook af naar stdout/stderr.

Stel de uitvoerigheid van de console onafhankelijk in:

- `logging.consoleLevel` (standaard `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`; standaard `pretty` op een TTY, anders `compact`)

## Redactie

OpenClaw maskeert gevoelige tokens voordat logboek- of transcriptuitvoer het proces verlaat. Dit redactiebeleid is van toepassing op tekstuitvoer naar de console, bestandslogboeken, OTLP-logboekregistraties en sessietranscripten, zodat overeenkomende geheime waarden worden gemaskeerd voordat JSONL-regels of berichten naar schijf worden geschreven.

- `logging.redactSensitive`: `off` | `tools` (standaard: `tools`)
- `logging.redactPatterns`: matrix met regex-tekenreeksen (overschrijft de standaardwaarden)
  - Gebruik onbewerkte regex-tekenreeksen (automatisch `gi`) of `/pattern/flags` voor aangepaste vlaggen.
  - Overeenkomsten worden gemaskeerd met behoud van de eerste 6 en laatste 4 tekens (waarden van 18 tekens of langer); kortere waarden worden `***`.
  - De standaardwaarden omvatten veelvoorkomende sleuteltoewijzingen, CLI-vlaggen, JSON-velden, bearer-headers, PEM-blokken, populaire tokenvoorvoegsels van leveranciers en veldnamen voor betaalreferenties (kaartnummer, CVC/CVV, gedeeld betalingstoken, betaalreferentie).

Sommige veiligheidsgrenzen redigeren altijd, ongeacht `logging.redactSensitive`: toolaanroepgebeurtenissen van de Control UI, tooluitvoer van `sessions_history`, diagnostische ondersteuningsexports, waarnemingen van providerfouten, weergave van opdrachten voor uitvoeringsgoedkeuring en WebSocket-protocollogboeken van de Gateway. Deze oppervlakken respecteren `logging.redactPatterns` nog steeds als aanvullende patronen, maar `redactSensitive: "off"` zorgt er niet voor dat ze onbewerkte geheimen uitvoeren.

## WebSocket-logboeken van de Gateway

De Gateway drukt WebSocket-protocollogboeken in twee modi af:

- **Normale modus (zonder `--verbose`)**: alleen ‘interessante’ RPC-resultaten worden afgedrukt - fouten (`ok=false`), trage aanroepen (standaarddrempel: `>= 50ms`) en parseringsfouten.
- **Uitgebreide modus (`--verbose`)**: drukt al het WS-aanvraag-/antwoordverkeer af.

### WS-logboekstijl

`openclaw gateway` ondersteunt een stijloptie per Gateway:

- `--ws-log auto` (standaard): de normale modus is geoptimaliseerd; de uitgebreide modus gebruikt compacte uitvoer.
- `--ws-log compact`: compacte uitvoer (gekoppelde aanvraag/antwoord) in de uitgebreide modus.
- `--ws-log full`: volledige uitvoer per frame in de uitgebreide modus.
- `--compact`: alias voor `--ws-log compact`.

```bash
# geoptimaliseerd (alleen fouten/traag)
openclaw gateway

# al het WS-verkeer tonen (gekoppeld)
openclaw gateway --verbose --ws-log compact

# al het WS-verkeer tonen (volledige metagegevens)
openclaw gateway --verbose --ws-log full
```

## Consoleopmaak (logboekregistratie per subsysteem)

De consoleformatter is **TTY-bewust** en drukt consistente regels met voorvoegsels af. Loggers voor subsysteem houden de uitvoer gegroepeerd en overzichtelijk:

- **Voorvoegsels voor subsysteem** op elke regel (bijvoorbeeld `[gateway]`, `[canvas]`, `[tailscale]`).
- **Kleuren voor subsysteem** (stabiel per subsysteem, gehasht op basis van de naam) plus niveaukleuren.
- **Kleur wanneer de uitvoer een TTY is** of de omgeving op een uitgebreide terminal lijkt (`TERM`/`COLORTERM`/`TERM_PROGRAM`); respecteert `NO_COLOR` en `FORCE_COLOR`.
- **Verkorte voorvoegsels voor subsysteem**: verwijdert een vooraanstaand segment `gateway/`, `channels/` of `providers/` en behoudt daarna maximaal de laatste 2 resterende segmenten (bijvoorbeeld `channels/turn/kernel` wordt weergegeven als `turn/kernel`). Bekende kanaalsubsystemen (`telegram`, `whatsapp`, `slack`, enzovoort) worden altijd beperkt tot alleen de kanaalnaam.
- **Subloggers per subsysteem** (automatisch voorvoegsel + gestructureerd veld `{ subsystem }`).
- **`logRaw()`** voor QR-/UX-uitvoer (geen voorvoegsel, geen opmaak).
- **Consolestijlen**: `pretty` | `compact` | `json`.
- **Het niveau voor consolelogboeken** staat los van het niveau voor bestandslogboeken (het bestand behoudt alle details wanneer `logging.level` `debug`/`trace` is).
- **WhatsApp-berichtinhoud** wordt geregistreerd op `debug`-niveau (gebruik `--verbose` om deze te zien).

Hierdoor blijven bestandslogboeken stabiel, terwijl interactieve uitvoer overzichtelijk blijft.

## Gerelateerd

- [Logboekregistratie](/nl/logging)
- [OpenTelemetry-export](/nl/gateway/opentelemetry)
- [Diagnostische export](/nl/gateway/diagnostics)
