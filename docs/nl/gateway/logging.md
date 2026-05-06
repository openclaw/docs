---
read_when:
    - Loguitvoer of -indelingen wijzigen
    - CLI- of Gateway-uitvoer debuggen
summary: Logoppervlakken, bestandslogs, WS-logstijlen en console-opmaak
title: Gateway-logboekregistratie
x-i18n:
    generated_at: "2026-05-06T11:28:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16bce5763754d13f855a46777b4c3cc7a7c966e35e0cd08a15f359fd22623bcb
    source_path: gateway/logging.md
    workflow: 16
---

# Logregistratie

Voor een gebruikersgerichte overzichtspagina (CLI + Control UI + configuratie), zie [/logging](/nl/logging).

OpenClaw heeft twee log-"oppervlakken":

- **Console-uitvoer** (wat je in de terminal / Debug UI ziet).
- **Bestandslogs** (JSON-regels) geschreven door de Gateway-logger.

Bij het opstarten logt de Gateway het opgeloste standaard-agentmodel samen met de
modusstandaarden die nieuwe sessies beinvloeden, bijvoorbeeld:

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` komt uit de standaardagent, modelparameters of de globale agentstandaard;
wanneer dit niet is ingesteld, toont de opstartsamenvatting `medium`. `fast` komt uit de
standaardagent of model-`fastMode`-parameters.

## Bestandsgebaseerde logger

- Het standaard rollende logbestand staat onder `/tmp/openclaw/` (een bestand per dag): `openclaw-YYYY-MM-DD.log`
  - De datum gebruikt de lokale tijdzone van de Gateway-host.
- Actieve logbestanden roteren bij `logging.maxFileBytes` (standaard: 100 MB), waarbij
  maximaal vijf genummerde archieven worden bewaard en er verder naar een nieuw actief bestand wordt geschreven.
- Het pad en niveau van het logbestand kunnen worden geconfigureerd via `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

De bestandsindeling is een JSON-object per regel.

Talk, realtime spraak en beheerde-kamer-codepaden gebruiken de gedeelde bestandslogger voor
begrensde levenscyclusrecords. Deze records zijn bedoeld voor operationele foutopsporing
en OTLP-logexport; transcripttekst, audiopayloads, beurt-id's, oproep-id's en
provider-item-id's worden niet naar het logrecord gekopieerd.

Het tabblad Logs in de Control UI volgt dit bestand via de Gateway (`logs.tail`).
De CLI kan hetzelfde doen:

```bash
openclaw logs --follow
```

**Uitgebreid versus logniveaus**

- **Bestandslogs** worden uitsluitend beheerd door `logging.level`.
- `--verbose` beinvloedt alleen **console-uitgebreidheid** (en WS-logstijl); het verhoogt **niet**
  het logniveau van bestanden.
- Om details die alleen in uitgebreide uitvoer staan in bestandslogs vast te leggen, stel je `logging.level` in op `debug` of
  `trace`.
- Trace-logregistratie bevat ook diagnostische timingsamenvattingen voor geselecteerde hot paths,
  zoals de voorbereiding van Plugin-tool-factories. Zie
  [/tools/plugin#slow-plugin-tool-setup](/nl/tools/plugin#slow-plugin-tool-setup).

## Consolevastlegging

De CLI legt `console.log/info/warn/error/debug/trace` vast en schrijft deze naar bestandslogs,
terwijl ze nog steeds naar stdout/stderr worden afgedrukt.

Je kunt console-uitgebreidheid onafhankelijk afstemmen via:

- `logging.consoleLevel` (standaard `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redactie

OpenClaw kan gevoelige tokens maskeren voordat log- of transcriptuitvoer het
proces verlaat. Dit redactiebeleid voor logregistratie wordt toegepast op console-, bestandslog-, OTLP-
logrecord- en sessietranscripttekst-sinks, zodat overeenkomende geheime waarden worden
gemaskeerd voordat JSONL-regels of berichten naar schijf worden geschreven.

- `logging.redactSensitive`: `off` | `tools` (standaard: `tools`)
- `logging.redactPatterns`: array van regex-strings (overschrijft standaarden)
  - Gebruik ruwe regex-strings (automatisch `gi`), of `/pattern/flags` als je aangepaste flags nodig hebt.
  - Overeenkomsten worden gemaskeerd door de eerste 6 + laatste 4 tekens te behouden (lengte >= 18), anders `***`.
  - Standaarden dekken veelvoorkomende key-toewijzingen, CLI-flags, JSON-velden, bearer-headers, PEM-blokken, populaire tokenprefixen en veldnamen voor betaalgegevens zoals kaartnummer, CVC/CVV, gedeeld betalingstoken en betaalcredential.

Sommige veiligheidsgrenzen redigeren altijd, ongeacht `logging.redactSensitive`.
Dit omvat Control UI-tool-call-events, `sessions_history`-tooluitvoer,
diagnostische supportexports, providerfoutobservaties, weergave van exec-goedkeuringscommando's
en Gateway WebSocket-protocollogs. Deze oppervlakken kunnen nog steeds
`logging.redactPatterns` gebruiken als aanvullende patronen, maar `redactSensitive: "off"`
zorgt er niet voor dat ze ruwe geheimen uitstoten.

## Gateway WebSocket-logs

De Gateway drukt WebSocket-protocollogs in twee modi af:

- **Normale modus (geen `--verbose`)**: alleen "interessante" RPC-resultaten worden afgedrukt:
  - fouten (`ok=false`)
  - trage oproepen (standaarddrempel: `>= 50ms`)
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

## Console-opmaak (subsystem-logregistratie)

De consoleformatter is **TTY-bewust** en drukt consistente regels met prefix af.
Subsystemloggers houden uitvoer gegroepeerd en scanbaar.

Gedrag:

- **Subsystemprefixen** op elke regel (bijv. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Subsystemkleuren** (stabiel per subsystem) plus niveaukleuring
- **Kleur wanneer uitvoer een TTY is of de omgeving lijkt op een rijke terminal** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respecteert `NO_COLOR`
- **Verkorte subsystemprefixen**: laat voorloop-`gateway/` + `channels/` vallen, behoudt laatste 2 segmenten (bijv. `whatsapp/outbound`)
- **Subloggers per subsystem** (automatische prefix + gestructureerd veld `{ subsystem }`)
- **`logRaw()`** voor QR/UX-uitvoer (geen prefix, geen opmaak)
- **Consolestijlen** (bijv. `pretty | compact | json`)
- **Consolelogniveau** los van bestandslogniveau (bestand behoudt volledige details wanneer `logging.level` is ingesteld op `debug`/`trace`)
- **WhatsApp-berichtinhouden** worden gelogd op `debug` (gebruik `--verbose` om ze te zien)

Dit houdt bestaande bestandslogs stabiel terwijl interactieve uitvoer scanbaar wordt.

## Gerelateerd

- [Logregistratie](/nl/logging)
- [OpenTelemetry-export](/nl/gateway/opentelemetry)
- [Diagnostische export](/nl/gateway/diagnostics)
