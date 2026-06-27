---
read_when:
    - Loguitvoer of -indelingen wijzigen
    - CLI- of Gateway-uitvoer debuggen
summary: Loggingsoppervlakken, bestandslogs, WS-logstijlen en console-opmaak
title: Gateway-logboekregistratie
x-i18n:
    generated_at: "2026-06-27T17:35:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde5e589bb48cd8c41ac6dd0d74780fec1cc1ee79d82d433b4e7c7450dc5c8b6
    source_path: gateway/logging.md
    workflow: 16
---

# Logging

Voor een gebruikersgericht overzicht (CLI + Control UI + configuratie), zie [/logging](/nl/logging).

OpenClaw heeft twee log-"oppervlakken":

- **Console-uitvoer** (wat je ziet in de terminal / Debug UI).
- **Bestandslogs** (JSON-regels) geschreven door de Gateway logger.

Bij het opstarten logt de Gateway het opgeloste standaardmodel voor de agent samen met de
modusstandaarden die nieuwe sessies beinvloeden, bijvoorbeeld:

```text
agent model: openai/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` komt uit de standaardagent, modelparameters of globale agentstandaard;
wanneer dit niet is ingesteld, toont de opstartsamenvatting `medium`. `fast` komt uit de
standaardagent of modelparameters voor `fastMode`.

## Logger op basis van bestanden

- Het standaard roterende logbestand staat onder `/tmp/openclaw/` (een bestand per dag): `openclaw-YYYY-MM-DD.log`
  - De datum gebruikt de lokale tijdzone van de Gateway host.
- Actieve logbestanden roteren bij `logging.maxFileBytes` (standaard: 100 MB), waarbij
  maximaal vijf genummerde archieven worden bewaard en er naar een nieuw actief bestand wordt geschreven.
- Het pad en niveau van het logbestand kunnen worden geconfigureerd via `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

De bestandsindeling is een JSON-object per regel.

Codepaden voor Talk, realtime spraak en beheerde ruimtes gebruiken de gedeelde bestandslogger voor
begrensde levenscyclusrecords. Deze records zijn bedoeld voor operationele debugging
en OTLP-logexport; transcripttekst, audiopayloads, turn-id's, call-id's en
provider item-id's worden niet naar het logrecord gekopieerd.

Het tabblad Logs in de Control UI volgt dit bestand via de Gateway (`logs.tail`).
De CLI kan hetzelfde doen:

```bash
openclaw logs --follow
```

**Verbose versus logniveaus**

- **Bestandslogs** worden uitsluitend beheerd door `logging.level`.
- `--verbose` beinvloedt alleen **console-uitgebreidheid** (en WS-logstijl); het verhoogt het bestandslogniveau **niet**.
- Stel `logging.level` in op `debug` of `trace` om details die alleen in verbose-modus verschijnen in bestandslogs vast te leggen.
- Trace-logging bevat ook diagnostische timingsamenvattingen voor geselecteerde kritieke paden,
  zoals de voorbereiding van plugin-toolfactories. Zie
  [/tools/plugin#slow-plugin-tool-setup](/nl/tools/plugin#slow-plugin-tool-setup).

## Consolevastlegging

De CLI legt `console.log/info/warn/error/debug/trace` vast en schrijft deze naar bestandslogs,
terwijl ze nog steeds naar stdout/stderr worden afgedrukt.

Je kunt de uitgebreidheid van de console onafhankelijk afstemmen via:

- `logging.consoleLevel` (standaard `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redactie

OpenClaw kan gevoelige tokens maskeren voordat log- of transcriptuitvoer het
proces verlaat. Dit redactiebeleid voor logging wordt toegepast op console-, bestandslog-, OTLP-
logrecord- en sessietranscript-tekstuitgangen, zodat overeenkomende geheime waarden worden
gemaskeerd voordat JSONL-regels of berichten naar schijf worden geschreven.

- `logging.redactSensitive`: `off` | `tools` (standaard: `tools`)
- `logging.redactPatterns`: array van regex-strings (overschrijft standaarden)
  - Gebruik ruwe regex-strings (automatisch `gi`), of `/pattern/flags` als je aangepaste flags nodig hebt.
  - Overeenkomsten worden gemaskeerd door de eerste 6 + laatste 4 tekens te behouden (lengte >= 18), anders `***`.
  - Standaarden dekken gangbare sleuteltoewijzingen, CLI-flags, JSON-velden, bearer-headers, PEM-blokken, populaire tokenprefixen en veldnamen voor betaalgegevens zoals kaartnummer, CVC/CVV, gedeeld betalingstoken en betaalreferentie.

Sommige veiligheidsgrenzen redigeren altijd, ongeacht `logging.redactSensitive`.
Dat omvat tool-call-events van de Control UI, tooluitvoer van `sessions_history`,
diagnostische supportexports, providerfoutobservaties, weergave van exec-goedkeuringsopdrachten
en Gateway WebSocket-protocollogs. Deze oppervlakken kunnen nog steeds
`logging.redactPatterns` als aanvullende patronen gebruiken, maar `redactSensitive: "off"`
zorgt er niet voor dat ze ruwe geheimen uitsturen.

## Gateway WebSocket-logs

De Gateway drukt WebSocket-protocollogs af in twee modi:

- **Normale modus (geen `--verbose`)**: alleen "interessante" RPC-resultaten worden afgedrukt:
  - fouten (`ok=false`)
  - trage calls (standaarddrempel: `>= 50ms`)
  - parseerfouten
- **Verbose-modus (`--verbose`)**: drukt al het WS-aanvraag-/antwoordverkeer af.

### WS-logstijl

`openclaw gateway` ondersteunt een stijlschakelaar per Gateway:

- `--ws-log auto` (standaard): normale modus is geoptimaliseerd; verbose-modus gebruikt compacte uitvoer
- `--ws-log compact`: compacte uitvoer (gekoppeld verzoek/antwoord) wanneer verbose
- `--ws-log full`: volledige uitvoer per frame wanneer verbose
- `--compact`: alias voor `--ws-log compact`

Voorbeelden:

```bash
# optimized (only errors/slow)
openclaw gateway

# show all WS traffic (paired)
openclaw gateway --verbose --ws-log compact

# show all WS traffic (full meta)
openclaw gateway --verbose --ws-log full
```

## Consoleopmaak (subsysteemlogging)

De consoleformatter is **TTY-bewust** en drukt consistente, geprefixte regels af.
Subsysteemloggers houden uitvoer gegroepeerd en scanbaar.

Gedrag:

- **Subsysteemprefixen** op elke regel (bijv. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Subsysteemkleuren** (stabiel per subsysteem) plus niveaukleuren
- **Kleur wanneer uitvoer een TTY is of de omgeving op een rijke terminal lijkt** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respecteert `NO_COLOR`
- **Verkorte subsysteemprefixen**: laat voorloop `gateway/` + `channels/` vallen, behoudt de laatste 2 segmenten (bijv. `whatsapp/outbound`)
- **Subloggers per subsysteem** (automatisch prefix + gestructureerd veld `{ subsystem }`)
- **`logRaw()`** voor QR/UX-uitvoer (geen prefix, geen opmaak)
- **Consolestijlen** (bijv. `pretty | compact | json`)
- **Consolelogniveau** los van bestandslogniveau (bestand behoudt volledige details wanneer `logging.level` is ingesteld op `debug`/`trace`)
- **WhatsApp-berichtinhoud** wordt gelogd op `debug` (gebruik `--verbose` om deze te zien)

Dit houdt bestaande bestandslogs stabiel terwijl interactieve uitvoer scanbaar wordt.

## Gerelateerd

- [Logging](/nl/logging)
- [OpenTelemetry-export](/nl/gateway/opentelemetry)
- [Diagnostische export](/nl/gateway/diagnostics)
