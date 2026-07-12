---
read_when:
    - Een bugrapport of ondersteuningsverzoek voorbereiden
    - Gateway-crashes, herstarts, geheugenproblemen of te grote payloads debuggen
    - Controleren welke diagnostische gegevens worden vastgelegd of geredigeerd
summary: Maak deelbare diagnostiekbundels voor de Gateway voor foutrapporten
title: Diagnostiekexport
x-i18n:
    generated_at: "2026-07-12T08:52:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee9014da15368971d8257f62707f013b579e607fa0d8413db51253612f0c0957
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw kan een lokaal diagnostisch `.zip`-bestand voor bugrapporten maken: opgeschoonde Gateway-status, statuscontroles, logboeken, configuratiestructuur en recente stabiliteitsgebeurtenissen zonder payload.

Behandel diagnostiekbundels als geheimen totdat ze zijn beoordeeld. Payloads en aanmeldgegevens worden standaard geredigeerd, maar de bundel bevat nog steeds een samenvatting van lokale Gateway-logboeken en de runtimestatus op hostniveau.

## Snel aan de slag

```bash
openclaw gateway diagnostics export
```

Drukt het pad van het weggeschreven zipbestand af. Kies een uitvoerpad:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Voor automatisering:

```bash
openclaw gateway diagnostics export --json
```

## Chatopdracht

Eigenaren kunnen `/diagnostics [note]` in elk gesprek uitvoeren om een lokale Gateway-export aan te vragen als één kopieerbaar ondersteuningsrapport:

1. Stuur `/diagnostics`, eventueel met een korte opmerking (`/diagnostics bad tool choice`).
2. OpenClaw stuurt een inleiding en vraagt om één expliciete uitvoeringsgoedkeuring, waarmee `openclaw gateway diagnostics export --json` wordt uitgevoerd. Keur diagnostiek niet goed via een regel die alles toestaat.
3. Na goedkeuring antwoordt OpenClaw met het lokale bundelpad, een samenvatting van het manifest, privacyopmerkingen en relevante sessie-id's.

In groepschats kan een eigenaar nog steeds `/diagnostics` uitvoeren, maar OpenClaw stuurt het exportresultaat, de goedkeuringsvragen en het overzicht van Codex-sessies en -threads privé naar de eigenaar. De groep ziet alleen een korte melding dat de diagnostiek privé is verzonden. Als er geen privéroute naar de eigenaar bestaat, wordt de opdracht veilig geweigerd en wordt de eigenaar gevraagd deze vanuit een privébericht uit te voeren.

Wanneer de actieve sessie het systeemeigen OpenAI Codex-harnas gebruikt, geldt dezelfde uitvoeringsgoedkeuring ook voor het uploaden van OpenAI-feedback voor de Codex-threads die OpenClaw kent. Deze upload staat los van het lokale Gateway-zipbestand en vindt alleen plaats voor sessies met het Codex-harnas. In de goedkeuringsvraag staat dat goedkeuring ook Codex-feedback verzendt, zonder Codex-sessie- of thread-id's te vermelden. Na goedkeuring vermeldt het antwoord de kanalen, OpenClaw-sessie-id's, Codex-thread-id's en lokale hervattingsopdrachten voor de threads die naar OpenAI zijn verzonden. Als de goedkeuring wordt geweigerd of genegeerd, worden de export, de upload van Codex-feedback en de lijst met Codex-id's overgeslagen.

Dat houdt de foutopsporingscyclus voor Codex kort: merk ongewenst gedrag in een kanaal op, voer `/diagnostics` uit, keur eenmaal goed, deel het rapport en voer vervolgens lokaal de afgedrukte opdracht `codex resume <thread-id>` uit als u de thread zelf wilt onderzoeken. Zie [Codex-harnas](/nl/plugins/codex-harness#inspect-codex-threads-locally).

## Inhoud van de export

- `summary.md`: voor mensen leesbaar overzicht voor ondersteuning.
- `diagnostics.json`: machineleesbare samenvatting van configuratie-, logboek-, status-, gezondheids- en stabiliteitsgegevens.
- `manifest.json`: exportmetagegevens en bestandenlijst.
- Opgeschoonde configuratiestructuur en niet-geheime configuratiedetails.
- Opgeschoonde logboeksamenvattingen en recente geredigeerde logboekregels.
- Naar beste vermogen gemaakte momentopnamen van de Gateway-status en -gezondheid.
- `stability/latest.json`: nieuwste opgeslagen stabiliteitsbundel, indien beschikbaar.

De export blijft nuttig wanneer de Gateway niet goed functioneert: als status- of gezondheidsaanvragen mislukken, worden lokale logboeken, de configuratiestructuur en de nieuwste stabiliteitsbundel nog steeds verzameld wanneer deze beschikbaar zijn.

## Privacymodel

Behouden: namen van subsystemen, Plugin-id's, provider-id's, kanaal-id's, geconfigureerde modi, statuscodes, tijdsduren, aantallen bytes, wachtrijstatus, geheugengegevens, opgeschoonde logboekmetagegevens, geredigeerde operationele berichten, configuratiestructuur en niet-geheime functie-instellingen.

Weggelaten of geredigeerd: chattekst, prompts, instructies, Webhook-inhouden, hulpprogramma-uitvoer, aanmeldgegevens, API-sleutels, tokens, cookies, geheime waarden, onbewerkte aanvraag- en antwoordinhouden, account-id's, bericht-id's, onbewerkte sessie-id's, hostnamen en lokale gebruikersnamen.

Wanneer een logboekbericht lijkt op tekst uit een gebruikers-, chat-, prompt- of hulpprogrammapayload, vermeldt de export alleen dat een bericht is weggelaten, samen met het aantal bytes.

## Stabiliteitsrecorder

De Gateway registreert standaard een begrensde stabiliteitsstroom zonder payload wanneer diagnostiek is ingeschakeld. Deze bevat operationele feiten, geen inhoud.

Dezelfde Heartbeat neemt ook steekproeven van de beschikbaarheid wanneer de gebeurtenislus of CPU verzadigd lijkt en genereert `diagnostic.liveness.warning`-gebeurtenissen met de vertraging en benutting van de gebeurtenislus, de CPU-kernverhouding, aantallen actieve/wachtende/in de wachtrij geplaatste sessies, de huidige opstart- of runtimefase (indien bekend), recente fasetijdsintervallen en begrensde werklabels. Deze worden alleen Gateway-logboekregels op `warn`-niveau wanneer werk wacht of in de wachtrij staat, of wanneer actief werk samenvalt met aanhoudende vertraging van de gebeurtenislus; anders worden ze op `debug` vastgelegd. Beschikbaarheidssteekproeven tijdens inactiviteit worden nog steeds als diagnostische gebeurtenissen geregistreerd, maar escaleren uit zichzelf nooit tot een waarschuwing.

Opstartfasen genereren `diagnostic.phase.completed`-gebeurtenissen met wandklok- en CPU-timing. Diagnostiek van vastgelopen ingebedde uitvoeringen stelt `terminalProgressStale=true` in wanneer de laatste voortgang van de brug terminaal leek (bijvoorbeeld een onbewerkt antwoorditem of een gebeurtenis voor de voltooiing van een antwoord), maar de Gateway de ingebedde uitvoering nog steeds als actief beschouwt.

Bekijk de actieve recorder:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Bekijk de nieuwste opgeslagen bundel na een fatale afsluiting, time-out bij afsluiten of mislukte herstart:

```bash
openclaw gateway stability --bundle latest
```

Maak een diagnostisch zipbestand van de nieuwste opgeslagen bundel:

```bash
openclaw gateway stability --bundle latest --export
```

Opgeslagen bundels bevinden zich onder `~/.openclaw/logs/stability/` wanneer er gebeurtenissen bestaan.

## Nuttige opties

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

| Vlag                    | Standaard                                                                      | Beschrijving                                                        |
| ----------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `--output <path>`       | `$OPENCLAW_STATE_DIR/logs/support/openclaw-diagnostics-<timestamp>-<pid>.zip` | Schrijf naar een specifiek zipbestandspad (of een specifieke map). |
| `--log-lines <count>`   | `5000`                                                                        | Maximaal aantal op te nemen opgeschoonde logboekregels.             |
| `--log-bytes <bytes>`   | `1000000`                                                                     | Maximaal aantal te inspecteren logboekbytes.                        |
| `--url <url>`           | -                                                                             | Gateway-WebSocket-URL voor status- en gezondheidsmomentopnamen.     |
| `--token <token>`       | -                                                                             | Gateway-token voor status- en gezondheidsmomentopnamen.             |
| `--password <password>` | -                                                                             | Gateway-wachtwoord voor status- en gezondheidsmomentopnamen.        |
| `--timeout <ms>`        | `3000`                                                                        | Time-out voor status- en gezondheidsmomentopnamen.                  |
| `--no-stability-bundle` | uit                                                                           | Sla het zoeken naar een opgeslagen stabiliteitsbundel over.         |
| `--json`                | uit                                                                           | Druk machineleesbare exportmetagegevens af.                         |

## Diagnostiek uitschakelen

Diagnostiek is standaard ingeschakeld. Schakel de stabiliteitsrecorder en het verzamelen van diagnostische gebeurtenissen als volgt uit:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Het uitschakelen van diagnostiek vermindert de details in bugrapporten, maar heeft geen invloed op de normale Gateway-logboekregistratie.

Momentopnamen bij kritieke geheugendruk zijn standaard uitgeschakeld. Leg naast normale diagnostische gebeurtenissen ook de stabiliteitsmomentopname vóór een geheugenuitputtingsfout vast:

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

Gebruik dit alleen op hosts die de extra scan van het bestandssysteem en het schrijven van een momentopname tijdens kritieke geheugendruk aankunnen. Normale geheugendrukgebeurtenissen registreren nog steeds RSS-, heap-, drempel- en groeigegevens (`rss_threshold`, `heap_threshold`, `rss_growth`) wanneer de momentopname is uitgeschakeld.

## Gerelateerd

- [Gezondheidscontroles](/nl/gateway/health)
- [Gateway-CLI](/nl/cli/gateway#gateway-diagnostics-export)
- [Gateway-protocol](/nl/gateway/protocol#rpc-method-families)
- [Logboekregistratie](/nl/logging)
- [OpenTelemetry-export](/nl/gateway/opentelemetry) - afzonderlijke stroom voor het streamen van diagnostiek naar een verzamelaar
