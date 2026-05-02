---
read_when:
    - Loguitvoer of -indelingen wijzigen
    - CLI- of Gateway-uitvoer debuggen
summary: Logoppervlakken, bestandslogs, WS-logstijlen en console-opmaak
title: Gateway-logging
x-i18n:
    generated_at: "2026-05-02T11:16:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb5f5ccd77909e82bd2938a33514ce8361c69910eb945c731d9b2c8266174c13
    source_path: gateway/logging.md
    workflow: 16
---

# Logging

Zie voor een gebruikersgericht overzicht (CLI + Control UI + configuratie) [/logging](/nl/logging).

OpenClaw heeft twee log-“oppervlakken”:

- **Console-uitvoer** (wat je ziet in de terminal / Debug UI).
- **Bestandslogs** (JSON-regels) die door de Gateway-logger worden geschreven.

## Bestandsgebaseerde logger

- Het standaard roterende logbestand staat onder `/tmp/openclaw/` (één bestand per dag): `openclaw-YYYY-MM-DD.log`
  - De datum gebruikt de lokale tijdzone van de Gateway-host.
- Actieve logbestanden roteren bij `logging.maxFileBytes` (standaard: 100 MB), waarbij
  maximaal vijf genummerde archieven worden bewaard en verder wordt geschreven naar een nieuw actief bestand.
- Het pad en niveau van het logbestand kunnen worden geconfigureerd via `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

De bestandsindeling is één JSON-object per regel.

Het tabblad Logs van de Control UI volgt dit bestand via de Gateway (`logs.tail`).
De CLI kan hetzelfde doen:

```bash
openclaw logs --follow
```

**Uitgebreid versus logniveaus**

- **Bestandslogs** worden uitsluitend beheerd door `logging.level`.
- `--verbose` beïnvloedt alleen de **console-uitgebreidheid** (en WS-logstijl); het verhoogt **niet**
  het logniveau van bestanden.
- Stel `logging.level` in op `debug` of `trace` om details die alleen in uitgebreide modus beschikbaar zijn in bestandslogs vast te leggen.
- Trace-logging bevat ook diagnostische timingsamenvattingen voor geselecteerde hot paths,
  zoals het voorbereiden van Plugin-toolfactory's. Zie
  [/tools/plugin#slow-plugin-tool-setup](/nl/tools/plugin#slow-plugin-tool-setup).

## Console-opvang

De CLI vangt `console.log/info/warn/error/debug/trace` op en schrijft ze naar bestandslogs,
terwijl ze nog steeds naar stdout/stderr worden afgedrukt.

Je kunt de uitgebreidheid van de console onafhankelijk afstellen via:

- `logging.consoleLevel` (standaard `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redactie

OpenClaw kan gevoelige tokens maskeren voordat log- of transcriptuitvoer het
proces verlaat. Dit logging-redactiebeleid wordt toegepast op console-, bestandslog-, OTLP-
logrecord- en sessietranscript-tekstsinks, zodat overeenkomende geheime waarden worden
gemaskeerd voordat JSONL-regels of berichten naar schijf worden geschreven.

- `logging.redactSensitive`: `off` | `tools` (standaard: `tools`)
- `logging.redactPatterns`: array van regex-strings (overschrijft standaardwaarden)
  - Gebruik onbewerkte regex-strings (automatisch `gi`), of `/pattern/flags` als je aangepaste flags nodig hebt.
  - Overeenkomsten worden gemaskeerd door de eerste 6 + laatste 4 tekens te behouden (lengte >= 18), anders `***`.
  - Standaardwaarden dekken veelvoorkomende sleuteltoewijzingen, CLI-flags, JSON-velden, bearer-headers, PEM-blokken, populaire tokenprefixen en veldnamen voor betalingsgegevens zoals kaartnummer, CVC/CVV, gedeeld betalingstoken en betalingsreferentie.

Sommige veiligheidsgrenzen redigeren altijd, ongeacht `logging.redactSensitive`.
Dat omvat tool-call-events in de Control UI, tooluitvoer van `sessions_history`,
diagnostische supportexports, providerfoutobservaties, weergave van exec-goedkeuringsopdrachten
en Gateway WebSocket-protocollogs. Deze oppervlakken kunnen nog steeds
`logging.redactPatterns` als aanvullende patronen gebruiken, maar `redactSensitive: "off"`
laat ze geen onbewerkte geheimen uitzenden.

## Gateway WebSocket-logs

De Gateway drukt WebSocket-protocollogs af in twee modi:

- **Normale modus (geen `--verbose`)**: alleen “interessante” RPC-resultaten worden afgedrukt:
  - fouten (`ok=false`)
  - trage calls (standaarddrempel: `>= 50ms`)
  - parsefouten
- **Uitgebreide modus (`--verbose`)**: drukt al het WS-verzoek-/antwoordverkeer af.

### WS-logstijl

`openclaw gateway` ondersteunt een stijlschakelaar per Gateway:

- `--ws-log auto` (standaard): normale modus is geoptimaliseerd; uitgebreide modus gebruikt compacte uitvoer
- `--ws-log compact`: compacte uitvoer (gekoppeld verzoek/antwoord) in uitgebreide modus
- `--ws-log full`: volledige uitvoer per frame in uitgebreide modus
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

## Console-opmaak (subsystem-logging)

De consoleformatter is **TTY-bewust** en drukt consistente, geprefixte regels af.
Subsystemloggers houden uitvoer gegroepeerd en scanbaar.

Gedrag:

- **Subsystemprefixen** op elke regel (bijv. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Subsystemkleuren** (stabiel per subsystem) plus niveaukleuring
- **Kleur wanneer uitvoer een TTY is of de omgeving op een rijke terminal lijkt** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respecteert `NO_COLOR`
- **Verkorte subsystemprefixen**: laat voorloop `gateway/` + `channels/` vallen, houdt de laatste 2 segmenten (bijv. `whatsapp/outbound`)
- **Subloggers per subsystem** (automatische prefix + gestructureerd veld `{ subsystem }`)
- **`logRaw()`** voor QR/UX-uitvoer (geen prefix, geen opmaak)
- **Consolestijlen** (bijv. `pretty | compact | json`)
- **Consolelogniveau** gescheiden van bestandslogniveau (bestand behoudt volledige details wanneer `logging.level` is ingesteld op `debug`/`trace`)
- **WhatsApp-berichtinhouden** worden gelogd op `debug` (gebruik `--verbose` om ze te zien)

Dit houdt bestaande bestandslogs stabiel en maakt interactieve uitvoer tegelijk scanbaar.

## Gerelateerd

- [Logging](/nl/logging)
- [OpenTelemetry-export](/nl/gateway/opentelemetry)
- [Diagnostische export](/nl/gateway/diagnostics)
