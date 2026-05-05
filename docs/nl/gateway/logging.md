---
read_when:
    - Loguitvoer of -indelingen wijzigen
    - CLI- of Gateway-uitvoer debuggen
summary: Logoppervlakken, bestandslogs, WS-logstijlen en consoleopmaak
title: Gateway-logboekregistratie
x-i18n:
    generated_at: "2026-05-05T01:46:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: d49ca112d3cc4ec76ecfc8b14d16dae64f74ca1f761fdb2b7bb470f73b66a246
    source_path: gateway/logging.md
    workflow: 16
---

# Logboekregistratie

Zie [/logging](/nl/logging) voor een gebruikersgericht overzicht (CLI + Control UI + configuratie).

OpenClaw heeft twee log-“oppervlakken”:

- **Console-uitvoer** (wat je in de terminal / Debug UI ziet).
- **Bestandslogs** (JSON-regels) die door de Gateway-logger worden geschreven.

Bij het opstarten logt de Gateway het opgeloste standaardmodel van de agent samen met de
modusstandaarden die nieuwe sessies beinvloeden, bijvoorbeeld:

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` komt uit de standaardagent, modelparameters of globale agentstandaard;
wanneer dit niet is ingesteld, toont de opstartsamenvatting `medium`. `fast` komt uit de
standaardagent of de modelparameters `fastMode`.

## Bestandsgebaseerde logger

- Het standaard roterende logbestand staat onder `/tmp/openclaw/` (een bestand per dag): `openclaw-YYYY-MM-DD.log`
  - De datum gebruikt de lokale tijdzone van de Gateway-host.
- Actieve logbestanden roteren bij `logging.maxFileBytes` (standaard: 100 MB), waarbij
  maximaal vijf genummerde archieven worden bewaard en er verder naar een nieuw actief bestand wordt geschreven.
- Het pad en niveau van het logbestand kunnen worden geconfigureerd via `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

De bestandsindeling is een JSON-object per regel.

Het tabblad Logs in de Control UI volgt dit bestand via de Gateway (`logs.tail`).
De CLI kan hetzelfde doen:

```bash
openclaw logs --follow
```

**Uitgebreid versus logniveaus**

- **Bestandslogs** worden uitsluitend beheerd door `logging.level`.
- `--verbose` beinvloedt alleen de **console-uitgebreidheid** (en WS-logstijl); het verhoogt **niet**
  het logniveau van het bestand.
- Stel `logging.level` in op `debug` of `trace` om details die alleen in uitgebreide modus verschijnen in bestandslogs vast te leggen.
- Trace-logboekregistratie bevat ook diagnostische timingsamenvattingen voor geselecteerde hot paths,
  zoals voorbereiding van Plugin-toolfactories. Zie
  [/tools/plugin#slow-plugin-tool-setup](/nl/tools/plugin#slow-plugin-tool-setup).

## Consolevastlegging

De CLI legt `console.log/info/warn/error/debug/trace` vast en schrijft deze naar bestandslogs,
terwijl ze nog steeds naar stdout/stderr worden afgedrukt.

Je kunt console-uitgebreidheid onafhankelijk afstemmen via:

- `logging.consoleLevel` (standaard `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redactie

OpenClaw kan gevoelige tokens maskeren voordat logboek- of transcriptuitvoer het
proces verlaat. Dit redactiebeleid voor logboekregistratie wordt toegepast op console-, bestandslog-, OTLP-
logrecord- en sessietranscript-tekstsinks, zodat overeenkomende geheime waarden worden
gemaskeerd voordat JSONL-regels of berichten naar schijf worden geschreven.

- `logging.redactSensitive`: `off` | `tools` (standaard: `tools`)
- `logging.redactPatterns`: array van regex-strings (overschrijft standaardwaarden)
  - Gebruik ruwe regex-strings (auto `gi`), of `/pattern/flags` als je aangepaste flags nodig hebt.
  - Overeenkomsten worden gemaskeerd door de eerste 6 + laatste 4 tekens te behouden (lengte >= 18), anders `***`.
  - Standaardwaarden dekken algemene sleuteltoewijzingen, CLI-flags, JSON-velden, bearer-headers, PEM-blokken, populaire tokenprefixes en veldnamen voor betaalgegevens zoals kaartnummer, CVC/CVV, gedeeld betalingstoken en betaalcredential.

Sommige veiligheidsgrenzen redigeren altijd, ongeacht `logging.redactSensitive`.
Dat omvat Control UI-tool-aanroepgebeurtenissen, uitvoer van de tool `sessions_history`,
exports voor diagnostische ondersteuning, providerfoutobservaties, weergave van exec-goedkeuringscommando's
en Gateway WebSocket-protocollogs. Deze oppervlakken kunnen nog steeds
`logging.redactPatterns` gebruiken als aanvullende patronen, maar `redactSensitive: "off"`
zorgt er niet voor dat ze ruwe geheimen uitstoten.

## Gateway WebSocket-logs

De Gateway drukt WebSocket-protocollogs af in twee modi:

- **Normale modus (geen `--verbose`)**: alleen “interessante” RPC-resultaten worden afgedrukt:
  - fouten (`ok=false`)
  - langzame aanroepen (standaarddrempel: `>= 50ms`)
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

## Console-opmaak (subsystem-logboekregistratie)

De consoleformatter is **TTY-bewust** en drukt consistente regels met prefix af.
Subsystem-loggers houden uitvoer gegroepeerd en scanbaar.

Gedrag:

- **Subsystemprefixes** op elke regel (bijv. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Subsystemkleuren** (stabiel per subsystem) plus niveaukleuring
- **Kleur wanneer uitvoer een TTY is of de omgeving op een rijke terminal lijkt** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respecteert `NO_COLOR`
- **Verkorte subsystemprefixes**: verwijdert vooraanstaande `gateway/` + `channels/`, behoudt de laatste 2 segmenten (bijv. `whatsapp/outbound`)
- **Sub-loggers per subsystem** (automatische prefix + gestructureerd veld `{ subsystem }`)
- **`logRaw()`** voor QR-/UX-uitvoer (geen prefix, geen opmaak)
- **Consolestijlen** (bijv. `pretty | compact | json`)
- **Consolelogniveau** gescheiden van bestandslogniveau (bestand behoudt volledige details wanneer `logging.level` is ingesteld op `debug`/`trace`)
- **WhatsApp-berichtinhoud** wordt gelogd op `debug` (gebruik `--verbose` om die te zien)

Dit houdt bestaande bestandslogs stabiel terwijl interactieve uitvoer scanbaar wordt.

## Gerelateerd

- [Logboekregistratie](/nl/logging)
- [OpenTelemetry-export](/nl/gateway/opentelemetry)
- [Diagnostische export](/nl/gateway/diagnostics)
