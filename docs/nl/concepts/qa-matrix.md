---
read_when:
    - pnpm openclaw qa matrix lokaal uitvoeren
    - Matrix-QA-scenario's toevoegen of selecteren
    - Matrix-QA-fouten, time-outs of vastgelopen opschoning triëren
summary: 'Referentie voor maintainers voor de door Docker ondersteunde Matrix live QA-lane: CLI, profielen, omgevingsvariabelen, scenario''s en uitvoerartefacten.'
title: Matrix-QA
x-i18n:
    generated_at: "2026-07-04T20:38:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4f7fd98b5e7fef7a30c8820c5a1fc48c199e4d09db34255e8b2287a047b339f
    source_path: concepts/qa-matrix.md
    workflow: 16
---

De Matrix QA-lane voert de gebundelde `@openclaw/matrix` Plugin uit tegen een wegwerpbare Tuwunel-homeserver in Docker, met tijdelijke driver-, SUT- en observer-accounts plus vooraf gevulde rooms. Dit is de live transport-real dekking voor Matrix.

Dit is tooling alleen voor maintainers. Gepubliceerde OpenClaw-releases laten `qa-lab` bewust weg, dus `openclaw qa` is alleen beschikbaar vanuit een bron-checkout. Bron-checkouts laden de gebundelde runner direct - er is geen Plugin-installatiestap nodig.

Zie [QA-overzicht](/nl/concepts/qa-e2e-automation) voor bredere context over het QA-framework.

## Snel starten

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Gewoon `pnpm openclaw qa matrix` voert `--profile all` uit en stopt niet bij de eerste fout. Gebruik `--profile fast --fail-fast` voor een release-gate; shard de catalogus met `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` wanneer je de volledige inventaris parallel uitvoert.

## Wat de lane doet

1. Richt een wegwerpbare Tuwunel-homeserver in Docker in (standaardimage `ghcr.io/matrix-construct/tuwunel:v1.5.1`, servernaam `matrix-qa.test`, poort `28008`) achter een begrensde, redigerende request/response-recorder.
2. Registreert drie tijdelijke gebruikers - `driver` (verstuurt inkomend verkeer), `sut` (het OpenClaw Matrix-account dat wordt getest), `observer` (verkeersopname door een derde partij).
3. Vult rooms die door de geselecteerde scenario's nodig zijn vooraf (main, threading, media, restart, secondary, allowlist, E2EE, verification DM, enz.).
4. Voert de substraat-neutrale `matrix-qa-v1`-protocolprobe uit tegen de opgenomen Tuwunel-grens. Unittests bewijzen het probecontract met de Matrix-protocolfixture; de canonieke QA-transportadapterhost in [#99707](https://github.com/openclaw/openclaw/pull/99707) is eigenaar van de echte Crabline-doelwiring.
5. Start een child OpenClaw Gateway met de echte Matrix Plugin beperkt tot het SUT-account; `qa-channel` wordt niet in het child geladen.
6. Voert scenario's achter elkaar uit, observeert events via de driver-/observer-Matrix-clients en leidt route-/state-verwachtingen af uit het opgenomen verkeer.
7. Breekt de homeserver af, schrijft rapport- en evidence-artefacten en sluit daarna af.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Algemene flags

| Flag                  | Standaard                                     | Beschrijving                                                                                                                                                    |
| --------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Scenarioprofiel. Zie [Profielen](#profiles).                                                                                                                    |
| `--fail-fast`         | uit                                           | Stop na de eerste mislukte check of het eerste mislukte scenario.                                                                                               |
| `--scenario <id>`     | -                                             | Voer alleen dit scenario uit. Herhaalbaar. Zie [Scenario's](#scenarios).                                                                                        |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Waar rapporten, samenvatting, route-/state-inventaris, geobserveerde events en de outputlog worden geschreven. Relatieve paden worden opgelost vanaf `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                               | Repository-root wanneer je vanuit een neutrale werkdirectory aanroept.                                                                                          |
| `--sut-account <id>`  | `sut`                                         | Matrix-account-id binnen de QA Gateway-configuratie.                                                                                                            |

### Provider-flags

De lane gebruikt een echt Matrix-transport, maar de modelprovider is configureerbaar:

| Flag                     | Standaard              | Beschrijving                                                                                                                                       |
| ------------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`        | `mock-openai` voor deterministische mock-dispatch of `live-frontier` voor live frontier-providers. De legacy-alias `live-openai` werkt nog steeds. |
| `--model <ref>`          | providerstandaardwaarde | Primaire `provider/model`-ref.                                                                                                                     |
| `--alt-model <ref>`      | providerstandaardwaarde | Alternatieve `provider/model`-ref waar scenario's halverwege de run wisselen.                                                                      |
| `--fast`                 | uit                    | Schakel provider-fast-mode in waar ondersteund.                                                                                                    |

Matrix QA accepteert geen `--credential-source` of `--credential-role`. De lane richt lokaal wegwerpgebruikers in; er is geen gedeelde credential-pool om uit te leasen.

## Profielen

Het geselecteerde profiel bepaalt welke scenario's worden uitgevoerd.

| Profiel         | Gebruik het voor                                                                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all` (standaard) | Volledige catalogus. Traag maar uitputtend.                                                                                                                                                                                                     |
| `fast`          | Release-gate-subset die het live transportcontract oefent: canary, mention-gating, allowlist-blokkade, reply-vorm, restart-resume, thread-follow-up, thread-isolatie, reaction-observatie en levering van exec-approval-metadata.              |
| `transport`     | Scenario's op transportniveau voor threading, DM, room, autojoin, mention/allowlist, approval en reactions.                                                                                                                                      |
| `media`         | Dekking voor image-, audio-, video-, PDF- en EPUB-bijlagen.                                                                                                                                                                                      |
| `e2ee-smoke`    | Minimale E2EE-dekking - eenvoudige encrypted reply, thread-follow-up, geslaagde bootstrap.                                                                                                                                                       |
| `e2ee-deep`     | Uitputtende E2EE-scenario's voor state-loss, backup, keys en recovery.                                                                                                                                                                           |
| `e2ee-cli`      | `openclaw matrix encryption setup`- en `verify *`-CLI-scenario's die via de QA-harness worden aangestuurd.                                                                                                                                       |

De exacte mapping staat in `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Scenario's

De volledige lijst met scenario-id's is de `MatrixQaScenarioId`-union in `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Categorieën omvatten:

- threading - `matrix-thread-*`, `matrix-subagent-thread-spawn`
- top-level / DM / room - `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming en toolvoortgang - `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- media - `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- routing - `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reactions - `matrix-reaction-*`
- approvals - `matrix-approval-*` (exec-/Plugin-metadata, fallback in chunks, deny-reactions, threads en `target: "both"`-routing)
- restart en replay - `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- mention-gating, bot-naar-bot en allowlists - `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (eenvoudige reply, thread-follow-up, bootstrap, recovery-key-levenscyclus, state-loss-varianten, gedrag van serverbackup, device-hygiëne, SAS / QR / DM-verificatie, restart, artefactredactie)
- E2EE CLI - `matrix-e2ee-cli-*` (encryption setup, idempotente setup, bootstrap-fout, recovery-key-levenscyclus, multi-account, gateway-reply round-trip, self-verification)

Geef `--scenario <id>` door (herhaalbaar) om een handmatig gekozen set uit te voeren; combineer met `--profile all` om profielgating te negeren.

## Omgevingsvariabelen

| Variabele                               | Standaard                                | Effect                                                                                                                                                                                                 |
| --------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 min)                       | Harde bovengrens voor de volledige run.                                                                                                                                                                |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                  | Grens voor het eerste canary-antwoord. Release-CI verhoogt dit op gedeelde runners, zodat een trage eerste Gateway-beurt niet faalt voordat scenariodekking start.                                      |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                   | Stil venster voor negatieve geen-antwoord-asserties. Begrensd tot `≤` de run-time-out.                                                                                                                  |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                  | Grens voor Docker-teardown. Foutmeldingen bevatten de herstelopdracht `docker compose ... down --remove-orphans`.                                                                                       |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Overschrijf de homeserver-image bij validatie tegen een andere Tuwunel-versie.                                                                                                                          |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | aan                                      | `0` onderdrukt `[matrix-qa] ...`-voortgangsregels op stderr. `1` forceert ze aan.                                                                                                                       |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | geredigeerd                              | `1` behoudt berichttekst en `formatted_body` in `matrix-qa-observed-events.json`. Standaard wordt geredigeerd om CI-artefacten veilig te houden.                                                       |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | uit                                      | `1` slaat de deterministische `process.exit` over na het schrijven van artefacten. De standaard forceert afsluiten omdat de native crypto-handles van matrix-js-sdk de eventloop actief kunnen houden nadat artefacten zijn voltooid. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | niet ingesteld                           | Wanneer ingesteld door een buitenste launcher (bijv. `scripts/run-node.mjs`), hergebruikt Matrix QA dat logpad in plaats van een eigen tee te starten.                                                   |

## Uitvoerartefacten

Geschreven naar `--output-dir`:

- `matrix-qa-report.md` - Markdown-protocolrapport (wat is geslaagd, gefaald, overgeslagen en waarom).
- `matrix-qa-summary.json` - Gestructureerde samenvatting geschikt voor CI-parsing en dashboards.
- `matrix-qa-route-state-manifest.json` - Dynamische `matrix-qa-v1`-inventaris gesleuteld op scenario-id. Het registreert geredigeerde route-/body-vormen, aanvraagvolgorde, waargenomen retries, fouten, sync-token-continuïteit en device/key/media/backup-statusfamilies die tijdens die run zijn waargenomen. Dit is uitvoerbaar bewijs, geen ingecheckte baseline.
- `matrix-qa-observed-events.json` - Waargenomen Matrix-events van de driver- en observerclients. Bodies worden geredigeerd tenzij `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; goedkeuringsmetadata wordt samengevat met geselecteerde veilige velden en een afgekapt opdrachtvoorbeeld.
- `matrix-qa-output.log` - Gecombineerde stdout/stderr van de run. Als `OPENCLAW_RUN_NODE_OUTPUT_LOG` is ingesteld, wordt het log van de buitenste launcher in plaats daarvan hergebruikt.

De standaarduitvoermap is `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, zodat opeenvolgende runs elkaar niet overschrijven.

## Triage-tips

- **Run blijft hangen rond het einde:** native crypto-handles van `matrix-js-sdk` kunnen langer leven dan de harness. De standaard forceert een schone `process.exit` na het schrijven van artefacten; als je `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` hebt uitgeschakeld, verwacht dan dat het proces blijft hangen.
- **Opschoonfout:** zoek de afgedrukte herstelopdracht (een `docker compose ... down --remove-orphans`-aanroep) en voer die handmatig uit om de homeserver-poort vrij te geven.
- **Flaky negatieve-assertievensters in CI:** verlaag `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (standaard 8 s) wanneer CI snel is; verhoog het op trage gedeelde runners.
- **Geredigeerde bodies nodig voor een bugrapport:** voer opnieuw uit met `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` en voeg `matrix-qa-observed-events.json` toe. Behandel het resulterende artefact als gevoelig.
- **Andere Tuwunel-versie:** wijs `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` naar de versie die wordt getest. De lane checkt alleen de vastgezette standaardimage in.

## Live-transportcontract

Matrix is een van de drie live-transportlanes (Matrix, Telegram, Discord) die één contractchecklist delen, gedefinieerd in [QA-overzicht → Live-transportdekking](/nl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` blijft de brede synthetische suite en maakt bewust geen deel uit van die matrix.

## Gerelateerd

- [QA-overzicht](/nl/concepts/qa-e2e-automation) - algemene QA-stack en live-transportcontract
- [QA Channel](/nl/channels/qa-channel) - synthetische kanaaladapter voor repo-ondersteunde scenario's
- [Testen](/nl/help/testing) - tests uitvoeren en QA-dekking toevoegen
- [Matrix](/nl/channels/matrix) - de kanaal-Plugin die wordt getest
