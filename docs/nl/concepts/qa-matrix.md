---
read_when:
    - pnpm openclaw qa matrix lokaal uitvoeren
    - Matrix-QA-scenario's toevoegen of selecteren
    - Matrix-QA-fouten, time-outs of vastgelopen opschoning beoordelen
summary: 'Referentie voor beheerders van de Docker-gebaseerde live QA-pijplijn voor Matrix: CLI, profielen, omgevingsvariabelen, scenario''s en uitvoerartefacten.'
title: Matrix-kwaliteitscontrole
x-i18n:
    generated_at: "2026-07-12T08:50:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8034570f5a52619c88bee1f6708bd710744d3cb52a1eb82726aa118844045ef
    source_path: concepts/qa-matrix.md
    workflow: 16
---

De Matrix-QA-lane voert de gebundelde Plugin `@openclaw/matrix` uit tegen een tijdelijke Tuwunel-homeserver in Docker, met tijdelijke accounts voor het stuurprogramma, het SUT en de waarnemer, plus vooraf ingerichte ruimtes. Dit biedt de live dekking met echt transport voor Matrix.

Tooling uitsluitend voor beheerders. OpenClaw-releases als pakket bevatten geen `qa-lab`, dus `openclaw qa` werkt alleen vanuit een broncheckout, die de gebundelde runner rechtstreeks laadt zonder installatiestap voor een Plugin.

Zie [QA-overzicht](/nl/concepts/qa-e2e-automation) voor meer context over het bredere QA-framework.

## Snel aan de slag

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Een gewone uitvoering van `pnpm openclaw qa matrix` gebruikt `--profile all` en stopt niet bij de eerste fout. Verdeel de volledige inventaris over parallelle taken met `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`.

## Wat de lane doet

1. Richt in Docker een tijdelijke Tuwunel-homeserver in (standaardimage `ghcr.io/matrix-construct/tuwunel:v1.5.1`, servernaam `matrix-qa.test`, poort `28008`) achter een begrensde recorder die gevoelige gegevens uit verzoeken en antwoorden verwijdert.
2. Registreert drie tijdelijke gebruikers: `driver` (verzendt inkomend verkeer), `sut` (het geteste OpenClaw Matrix-account), `observer` (legt verkeer van derden vast).
3. Richt de ruimtes in die de geselecteerde scenario's vereisen (hoofdruimte, threads, media, herstart, secundaire ruimte, toelatingslijst, E2EE, verificatie-DM enzovoort).
4. Voert de substraatonafhankelijke protocolprobe `matrix-qa-v1` uit tegen de vastgelegde Tuwunel-grens. Unittests bewijzen het probecontract met de Matrix-protocolfixture; de canonieke host voor de QA-transportadapter in [#99707](https://github.com/openclaw/openclaw/pull/99707) beheert de koppeling met echte Crabline-doelen.
5. Start een onderliggende OpenClaw Gateway met de echte Matrix-Plugin, beperkt tot het SUT-account.
6. Voert de scenario's achtereenvolgens uit, neemt gebeurtenissen waar via de Matrix-clients van het stuurprogramma en de waarnemer en leidt verwachtingen voor routes en toestand af uit het vastgelegde verkeer.
7. Breekt de homeserver af, schrijft rapport- en bewijsartefacten en sluit vervolgens af.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Algemene vlaggen

| Vlag                  | Standaardwaarde                               | Beschrijving                                                                                                                                                                         |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--profile <profile>` | `all`                                         | Scenarioprofiel. Zie [Profielen](#profiles).                                                                                                                                         |
| `--fail-fast`         | uit                                           | Stop na de eerste mislukte controle of het eerste mislukte scenario.                                                                                                                 |
| `--scenario <id>`     | -                                             | Voer alleen dit scenario uit. Herhaalbaar. Zie [Scenario's](#scenarios).                                                                                                             |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Locatie waar rapporten, samenvatting, route-/toestandsinventaris, waargenomen gebeurtenissen en het uitvoerlogboek worden geschreven. Relatieve paden worden opgelost vanaf `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                               | Hoofdmap van de repository bij aanroepen vanuit een neutrale werkmap.                                                                                                                |
| `--sut-account <id>`  | `sut`                                         | Matrix-account-id binnen de QA-configuratie van de Gateway.                                                                                                                         |

### Providervlaggen

De lane gebruikt echt Matrix-transport, maar de modelprovider is configureerbaar:

| Vlag                     | Standaardwaarde    | Beschrijving                                                                                                                                                                                          |
| ------------------------ | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`    | `mock-openai` voor deterministische gesimuleerde verzending of `live-frontier` voor live frontierproviders. De verouderde alias `live-openai` werkt nog steeds.                                       |
| `--model <ref>`          | providerstandaard  | Primaire verwijzing `provider/model`.                                                                                                                                                                 |
| `--alt-model <ref>`      | providerstandaard  | Alternatieve verwijzing `provider/model` voor scenario's die tijdens de uitvoering overschakelen.                                                                                                    |
| `--fast`                 | uit                | Schakel de snelle providermodus in waar deze wordt ondersteund.                                                                                                                                       |

Matrix-QA accepteert geen `--credential-source` of `--credential-role`. De lane richt lokaal tijdelijke gebruikers in; er is geen gedeelde pool met aanmeldgegevens waaruit kan worden geleaset.

## Profielen

| Profiel         | Gebruik hiervoor                                                                                                                                                                                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (standaard) | Volledige catalogus. Langzaam maar uitputtend.                                                                                                                                                                                                                      |
| `fast`          | Subset voor de releasecontrole die het imperatieve live-transportcontract test: poortwachter voor vermeldingen, blokkering via toelatingslijst, antwoordvorm, hervatting na herstart, waarneming van reacties, levering van metadata voor uitvoeringsgoedkeuringen en eenvoudige E2EE-antwoorden. |
| `transport`     | Scenario's op transportniveau voor threads, DM's, ruimtes, automatisch deelnemen, vermeldingen/toelatingslijsten, goedkeuringen en reacties.                                                                                                                         |
| `media`         | Dekking voor bijlagen met afbeeldingen, audio, video, PDF en EPUB.                                                                                                                                                                                                   |
| `e2ee-smoke`    | Minimale E2EE-dekking: eenvoudig versleuteld antwoord, vervolg in een thread, geslaagde bootstrap.                                                                                                                                                                   |
| `e2ee-deep`     | Uitputtende E2EE-scenario's voor toestandsverlies, back-ups, sleutels en herstel.                                                                                                                                                                                     |
| `e2ee-cli`      | CLI-scenario's voor `openclaw matrix encryption setup` en `verify *`, aangestuurd via het QA-harnas.                                                                                                                                                                |

De exacte toewijzing staat in `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Scenario's

De gedeelde Matrix-adapter biedt deze canonieke YAML-scenario's aan via `openclaw qa suite --channel-driver live --channel matrix`:

- `channel-chat-baseline`
- `thread-follow-up`
- `thread-isolation`
- `thread-reply-override`
- `dm-shared-session`
- `dm-per-room-session`

`subagent-thread-spawn` blijft beschikbaar via expliciete selectie met `--scenario subagent-thread-spawn`, maar maakt pas deel uit van de standaard gedeelde Matrix-set wanneer live bewijs van voltooiing door een onderliggend proces stabiel is.

De resterende lijst met imperatieve scenario-id's is de union `MatrixQaScenarioId` in `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`. Categorieën:

- threads: `matrix-thread-root-preservation`, `matrix-thread-nested-reply-shape`
- hoogste niveau / DM / ruimte: `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming en voortgang van hulpmiddelen: `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- media: `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- routering: `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reacties: `matrix-reaction-*`
- goedkeuringen: `matrix-approval-*` (metadata voor uitvoering/Plugin, fallback in delen, weigeringsreacties, threads en routering met `target: "both"`)
- herstarten en opnieuw afspelen: `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- poortwachter voor vermeldingen, bot-naar-bot en toelatingslijsten: `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE: `matrix-e2ee-*` (eenvoudig antwoord, vervolg in thread, bootstrap, levenscyclus van herstelsleutels, varianten voor toestandsverlies, gedrag van serverback-ups, apparaathygiëne, SAS-/QR-/DM-verificatie, herstart, verwijdering van gevoelige gegevens uit artefacten)
- E2EE-CLI: `matrix-e2ee-cli-*` (versleuteling instellen, idempotente instelling, bootstrapfout, levenscyclus van herstelsleutels, meerdere accounts, retourcyclus voor Gateway-antwoorden, zelfverificatie)

Geef `--scenario <id>` op (herhaalbaar) om een handmatig gekozen set uit te voeren; combineer dit met `--profile all` om profielbeperkingen te negeren.

## Omgevingsvariabelen

| Variabele                               | Standaardwaarde                           | Effect                                                                                                                                                                                                 |
| --------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 min)                        | Harde bovengrens voor de volledige uitvoering.                                                                                                                                                         |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Limiet voor het eerste canary-antwoord. De release-CI verhoogt deze op gedeelde runners, zodat een trage eerste Gateway-beurt niet mislukt voordat de scenariodekking begint.                           |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Stiltevenster voor negatieve controles op het uitblijven van een antwoord. Begrensd op `<=` de uitvoeringstime-out.                                                                                    |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Limiet voor het afsluiten van Docker. Bij fouten wordt onder meer de herstelopdracht `docker compose ... down --remove-orphans` weergegeven.                                                           |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Overschrijf de homeserver-image bij validatie met een andere Tuwunel-versie.                                                                                                                            |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | aan                                       | `0` onderdrukt de voortgangsregels `[matrix-qa] ...` op stderr. `1` dwingt de weergave ervan af.                                                                                                        |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | geredigeerd                               | `1` behoudt de berichttekst en `formatted_body` in `matrix-qa-observed-events.json`. Standaard worden deze geredigeerd om CI-artefacten veilig te houden.                                               |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | uit                                       | `1` slaat de deterministische `process.exit` na het schrijven van artefacten over. Standaard wordt afsluiten afgedwongen, omdat de systeemeigen cryptohandles van matrix-js-sdk de eventloop actief kunnen houden nadat de artefacten zijn voltooid. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | niet ingesteld                            | Wanneer deze door een extern startprogramma is ingesteld (bijvoorbeeld `scripts/run-node.mjs`), hergebruikt Matrix-QA dat logpad in plaats van een eigen tee te starten.                               |

## Uitvoerartefacten

Geschreven naar `--output-dir` (standaard `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, zodat opeenvolgende uitvoeringen elkaar niet overschrijven):

- `matrix-qa-report.md`: Markdown-protocolrapport (wat is geslaagd, mislukt of overgeslagen, en waarom).
- `matrix-qa-summary.json`: Gestructureerde samenvatting die geschikt is voor verwerking door CI en dashboards.
- `matrix-qa-route-state-manifest.json`: Dynamische `matrix-qa-v1`-inventaris, geïndexeerd op scenario-id. Deze registreert geredigeerde route-/berichttekststructuren, de volgorde van verzoeken, waargenomen nieuwe pogingen, fouten, continuïteit van synchronisatietokens en tijdens die uitvoering waargenomen statusfamilies voor apparaten, sleutels, media en back-ups. Dit is uitvoerbaar bewijsmateriaal, geen ingecheckte basislijn.
- `matrix-qa-observed-events.json`: Waargenomen Matrix-gebeurtenissen van de driver- en observerclients. Berichtteksten worden geredigeerd, tenzij `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; goedkeuringsmetadata worden samengevat met geselecteerde veilige velden en een ingekort opdrachtvoorbeeld.
- `matrix-qa-output.log`: Gecombineerde stdout/stderr van de uitvoering. Als `OPENCLAW_RUN_NODE_OUTPUT_LOG` is ingesteld, wordt in plaats daarvan het logbestand van het externe startprogramma hergebruikt.

## Tips voor probleemonderzoek

- **Uitvoering blijft tegen het einde hangen:** systeemeigen cryptohandles van `matrix-js-sdk` kunnen langer actief blijven dan de testomgeving. Standaard wordt na het schrijven van de artefacten een nette `process.exit` afgedwongen; als u `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` instelt, moet u verwachten dat het proces blijft draaien.
- **Opschoonfout:** zoek naar de weergegeven herstelopdracht (een aanroep van `docker compose ... down --remove-orphans`) en voer deze handmatig uit om de homeserverpoort vrij te geven.
- **Instabiele vensters voor negatieve controles in CI:** verlaag `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (standaard 8 s) wanneer CI snel is; verhoog deze op trage gedeelde runners.
- **Geredigeerde berichtteksten nodig voor een foutrapport:** voer opnieuw uit met `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` en voeg `matrix-qa-observed-events.json` toe. Behandel het resulterende artefact als gevoelig.
- **Andere Tuwunel-versie:** stel `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` in op de geteste versie. De lane checkt alleen de vastgezette standaard-image in.

## Contract voor live transport

Matrix is een van de drie lanes voor live transport (Matrix, Telegram, Discord) die één contractuele controlelijst delen, gedefinieerd in [QA-overzicht: dekking van live transport](/nl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` blijft de brede synthetische testsuite en maakt bewust geen deel uit van die matrix.

## Gerelateerd

- [QA-overzicht](/nl/concepts/qa-e2e-automation): algemene QA-stack en contract voor live transport
- [QA-kanaal](/nl/channels/qa-channel): synthetische kanaaladapter voor scenario's die door de repository worden ondersteund
- [Testen](/nl/help/testing): tests uitvoeren en QA-dekking toevoegen
- [Matrix](/nl/channels/matrix): de geteste kanaalplugin
