---
read_when:
    - Loguitvoer of -indelingen wijzigen
    - CLI- of Gateway-uitvoer debuggen
summary: Logoppervlakken, bestandslogs, WS-logstijlen en consoleopmaak
title: Gateway-logregistratie
x-i18n:
    generated_at: "2026-05-01T11:18:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: f843812a41c25f9ca1884543ad3a5663c8e0bc327027cbd2b58ea6557c466aa9
    source_path: gateway/logging.md
    workflow: 16
---

# Logboekregistratie

Voor een gebruikersgericht overzicht (CLI + Control UI + configuratie), zie [/logging](/nl/logging).

OpenClaw heeft twee log-“oppervlakken”:

- **Console-uitvoer** (wat je in de terminal / Debug UI ziet).
- **Bestandslogs** (JSON-regels) geschreven door de Gateway-logger.

## Bestandsgebaseerde logger

- Het standaard roterende logbestand staat onder `/tmp/openclaw/` (een bestand per dag): `openclaw-YYYY-MM-DD.log`
  - De datum gebruikt de lokale tijdzone van de Gateway-host.
- Actieve logbestanden roteren bij `logging.maxFileBytes` (standaard: 100 MB), waarbij
  maximaal vijf genummerde archieven worden bewaard en er verder wordt geschreven naar een nieuw actief bestand.
- Het pad en niveau van het logbestand kunnen worden geconfigureerd via `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

De bestandsindeling is een JSON-object per regel.

Het tabblad Logs in de Control UI volgt dit bestand via de Gateway (`logs.tail`).
CLI kan hetzelfde doen:

```bash
openclaw logs --follow
```

**Uitgebreid versus logniveaus**

- **Bestandslogs** worden uitsluitend beheerd door `logging.level`.
- `--verbose` heeft alleen invloed op **console-uitvoerigheid** (en WS-logstijl); het verhoogt **niet**
  het bestandslogniveau.
- Stel `logging.level` in op `debug` of `trace` om details die alleen in uitgebreide modus beschikbaar zijn in bestandslogs vast te leggen.

## Console-opname

De CLI vangt `console.log/info/warn/error/debug/trace` op en schrijft ze naar bestandslogs,
terwijl ze nog steeds naar stdout/stderr worden afgedrukt.

Je kunt console-uitvoerigheid onafhankelijk afstemmen via:

- `logging.consoleLevel` (standaard `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redactie

OpenClaw kan gevoelige tokens maskeren voordat log- of transcriptuitvoer het
proces verlaat. Dit beleid voor logredactie wordt toegepast op console-, bestandslog-, OTLP-
logrecord- en sessietranscript-tekstuitgangen, zodat overeenkomende geheime waarden worden
gemaskeerd voordat JSONL-regels of berichten naar schijf worden geschreven.

- `logging.redactSensitive`: `off` | `tools` (standaard: `tools`)
- `logging.redactPatterns`: array met regex-tekenreeksen (overschrijft standaardwaarden)
  - Gebruik ruwe regex-tekenreeksen (automatisch `gi`), of `/pattern/flags` als je aangepaste flags nodig hebt.
  - Overeenkomsten worden gemaskeerd door de eerste 6 + laatste 4 tekens te behouden (lengte >= 18), anders `***`.
  - Standaarden dekken veelvoorkomende sleuteltoewijzingen, CLI-flags, JSON-velden, bearer-headers, PEM-blokken, populaire tokenprefixen en veldnamen voor betaalgegevens zoals kaartnummer, CVC/CVV, gedeeld betalingstoken en betaalreferentie.

Sommige veiligheidsgrenzen redigeren altijd, ongeacht `logging.redactSensitive`.
Dat omvat Control UI-toolaanroepgebeurtenissen, tooluitvoer van `sessions_history`,
diagnostische supportexports, providerfoutobservaties, weergave van exec-goedkeuringsopdrachten
en Gateway WebSocket-protocollogs. Deze oppervlakken kunnen nog steeds
`logging.redactPatterns` als aanvullende patronen gebruiken, maar `redactSensitive: "off"`
zorgt er niet voor dat ze ruwe geheimen uitvoeren.

## Gateway WebSocket-logs

De Gateway drukt WebSocket-protocollogs in twee modi af:

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

## Console-opmaak (subsystem-logboekregistratie)

De consoleformatter is **TTY-bewust** en drukt consistente regels met prefix af.
Subsystem-loggers houden uitvoer gegroepeerd en goed scanbaar.

Gedrag:

- **Subsystem-prefixen** op elke regel (bijv. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Subsystem-kleuren** (stabiel per subsystem) plus niveaukleuring
- **Kleur wanneer uitvoer een TTY is of de omgeving lijkt op een rijke terminal** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respecteert `NO_COLOR`
- **Verkorte subsystem-prefixen**: laat voorloop `gateway/` + `channels/` weg, behoudt de laatste 2 segmenten (bijv. `whatsapp/outbound`)
- **Sub-loggers per subsystem** (automatische prefix + gestructureerd veld `{ subsystem }`)
- **`logRaw()`** voor QR-/UX-uitvoer (geen prefix, geen opmaak)
- **Consolestijlen** (bijv. `pretty | compact | json`)
- **Consolelogniveau** gescheiden van bestandslogniveau (bestand behoudt volledige details wanneer `logging.level` is ingesteld op `debug`/`trace`)
- **WhatsApp-berichtinhouden** worden gelogd op `debug` (gebruik `--verbose` om ze te zien)

Dit houdt bestaande bestandslogs stabiel terwijl interactieve uitvoer goed scanbaar wordt.

## Gerelateerd

- [Logboekregistratie](/nl/logging)
- [OpenTelemetry-export](/nl/gateway/opentelemetry)
- [Diagnostische export](/nl/gateway/diagnostics)
