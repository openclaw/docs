---
read_when:
    - Loguitvoer of -indelingen wijzigen
    - CLI- of Gateway-uitvoer debuggen
summary: Logoppervlakken, bestandslogs, WS-logstijlen en consoleopmaak
title: Gateway-logboekregistratie
x-i18n:
    generated_at: "2026-04-29T22:45:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ce9c78201d2e26760282b08eacb17826b1eac84e80b99d3a9d5cbff4078b5b3
    source_path: gateway/logging.md
    workflow: 16
---

# Logboekregistratie

Voor een gebruikersgericht overzicht (CLI + Control UI + configuratie), zie [/logging](/nl/logging).

OpenClaw heeft twee log-”oppervlakken”:

- **Console-uitvoer** (wat je ziet in de terminal / Debug UI).
- **Bestandslogs** (JSON-regels) geschreven door de gateway-logger.

## Logger op basis van bestanden

- Het standaard roulerende logbestand staat onder `/tmp/openclaw/` (één bestand per dag): `openclaw-YYYY-MM-DD.log`
  - De datum gebruikt de lokale tijdzone van de Gateway-host.
- Actieve logbestanden roteren bij `logging.maxFileBytes` (standaard: 100 MB), waarbij
  maximaal vijf genummerde archieven worden bewaard en er verder naar een nieuw actief bestand wordt geschreven.
- Het pad en niveau van het logbestand kunnen worden geconfigureerd via `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

De bestandsindeling is één JSON-object per regel.

Het tabblad Logs in de Control UI volgt dit bestand via de Gateway (`logs.tail`).
De CLI kan hetzelfde doen:

```bash
openclaw logs --follow
```

**Uitgebreid versus logniveaus**

- **Bestandslogs** worden uitsluitend beheerd door `logging.level`.
- `--verbose` beïnvloedt alleen de **uitgebreidheid van de console** (en WS-logstijl); het verhoogt **niet**
  het logniveau van bestanden.
- Stel `logging.level` in op `debug` of `trace` om details die alleen in uitgebreide modus beschikbaar zijn in bestandslogs vast te leggen.

## Console-vastlegging

De CLI legt `console.log/info/warn/error/debug/trace` vast en schrijft ze naar bestandslogs,
terwijl ze nog steeds naar stdout/stderr worden afgedrukt.

Je kunt de uitgebreidheid van de console afzonderlijk afstemmen via:

- `logging.consoleLevel` (standaard `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redactie

OpenClaw kan gevoelige tokens maskeren voordat log- of transcriptuitvoer het
proces verlaat. Dit redactiebeleid voor logboekregistratie wordt toegepast op console-, bestandslog-, OTLP-
logrecord- en sessietranscript-tekstuitvoer, zodat overeenkomende geheime waarden worden
gemaskeerd voordat JSONL-regels of berichten naar schijf worden geschreven.

- `logging.redactSensitive`: `off` | `tools` (standaard: `tools`)
- `logging.redactPatterns`: array van regex-strings (overschrijft standaardwaarden)
  - Gebruik ruwe regex-strings (automatisch `gi`), of `/pattern/flags` als je aangepaste flags nodig hebt.
  - Overeenkomsten worden gemaskeerd door de eerste 6 + laatste 4 tekens te behouden (lengte >= 18), anders `***`.
  - Standaardwaarden dekken veelvoorkomende sleuteltoewijzingen, CLI-flags, JSON-velden, bearer-headers, PEM-blokken en populaire tokenprefixen.

Sommige veiligheidsgrenzen redigeren altijd, ongeacht `logging.redactSensitive`.
Dat omvat tool-call-gebeurtenissen in de Control UI, tooluitvoer van `sessions_history`,
ondersteuningsexports voor diagnostiek, provider-foutobservaties, weergave van exec-goedkeuringsopdrachten
en Gateway WebSocket-protocollogs. Deze oppervlakken kunnen nog steeds
`logging.redactPatterns` als aanvullende patronen gebruiken, maar `redactSensitive: "off"`
laat ze geen ruwe geheimen uitsturen.

## Gateway WebSocket-logs

De Gateway drukt WebSocket-protocollogs af in twee modi:

- **Normale modus (geen `--verbose`)**: alleen “interessante” RPC-resultaten worden afgedrukt:
  - fouten (`ok=false`)
  - trage aanroepen (standaarddrempel: `>= 50ms`)
  - parsefouten
- **Uitgebreide modus (`--verbose`)**: drukt al het WS-verzoek-/antwoordverkeer af.

### WS-logstijl

`openclaw gateway` ondersteunt een stijlschakelaar per Gateway:

- `--ws-log auto` (standaard): normale modus is geoptimaliseerd; uitgebreide modus gebruikt compacte uitvoer
- `--ws-log compact`: compacte uitvoer (gekoppeld verzoek/antwoord) wanneer uitgebreid
- `--ws-log full`: volledige uitvoer per frame wanneer uitgebreid
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

## Console-opmaak (subsysteemlogboekregistratie)

De consoleformatter is **TTY-bewust** en drukt consistente, geprefixte regels af.
Subsysteemloggers houden uitvoer gegroepeerd en scanbaar.

Gedrag:

- **Subsysteemprefixen** op elke regel (bijv. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Subsysteemkleuren** (stabiel per subsysteem) plus niveaukleuring
- **Kleur wanneer uitvoer een TTY is of de omgeving lijkt op een rijke terminal** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respecteert `NO_COLOR`
- **Verkorte subsysteemprefixen**: verwijdert voorloop-`gateway/` + `channels/`, behoudt de laatste 2 segmenten (bijv. `whatsapp/outbound`)
- **Sub-loggers per subsysteem** (automatische prefix + gestructureerd veld `{ subsystem }`)
- **`logRaw()`** voor QR/UX-uitvoer (geen prefix, geen opmaak)
- **Consolestijlen** (bijv. `pretty | compact | json`)
- **Consolelogniveau** los van bestandslogniveau (bestand behoudt volledige details wanneer `logging.level` is ingesteld op `debug`/`trace`)
- **WhatsApp-berichtinhouden** worden gelogd op `debug` (gebruik `--verbose` om ze te zien)

Dit houdt bestaande bestandslogs stabiel terwijl interactieve uitvoer scanbaar wordt.

## Gerelateerd

- [Logboekregistratie](/nl/logging)
- [OpenTelemetry-export](/nl/gateway/opentelemetry)
- [Diagnostiekexport](/nl/gateway/diagnostics)
