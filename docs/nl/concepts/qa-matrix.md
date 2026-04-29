---
read_when:
    - pnpm openclaw qa matrix lokaal uitvoeren
    - Matrix-QA-scenario's toevoegen of selecteren
    - Triage van Matrix QA-fouten, time-outs of vastgelopen opschoning
summary: 'Referentie voor onderhouders voor het door Docker ondersteunde Matrix-live-QA-spoor: CLI, profielen, omgevingsvariabelen, scenario''s en uitvoerartefacten.'
title: Matrix-QA
x-i18n:
    generated_at: "2026-04-29T22:40:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ab862474e2abe45a1dcd66f025e3a3dd52a3417b0c1f42a26cd7944dd4053f5
    source_path: concepts/qa-matrix.md
    workflow: 16
---

De Matrix QA-lane draait de gebundelde `@openclaw/matrix` plugin tegen een wegwerpbare Tuwunel homeserver in Docker, met tijdelijke driver-, SUT- en observer-accounts plus vooraf gevulde kamers. Dit is de live, transportechte dekking voor Matrix.

Dit is tooling uitsluitend voor maintainers. Gepubliceerde OpenClaw-releases laten `qa-lab` bewust weg, dus `openclaw qa` is alleen beschikbaar vanuit een source-checkout. Source-checkouts laden de gebundelde runner rechtstreeks — er is geen installatiestap voor de plugin nodig.

Zie [QA-overzicht](/nl/concepts/qa-e2e-automation) voor bredere context over het QA-framework.

## Snel aan de slag

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Gewoon `pnpm openclaw qa matrix` uitvoeren draait `--profile all` en stopt niet bij de eerste fout. Gebruik `--profile fast --fail-fast` voor een release-gate; shard de catalogus met `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` wanneer je de volledige inventaris parallel uitvoert.

## Wat de lane doet

1. Richt een wegwerpbare Tuwunel homeserver in Docker in (standaardimage `ghcr.io/matrix-construct/tuwunel:v1.5.1`, servernaam `matrix-qa.test`, poort `28008`).
2. Registreert drie tijdelijke gebruikers — `driver` (verstuurt inbound verkeer), `sut` (het OpenClaw Matrix-account dat wordt getest), `observer` (verkeersregistratie van derden).
3. Vult kamers die vereist zijn door de geselecteerde scenario's vooraf (main, threading, media, restart, secondary, allowlist, E2EE, verification DM, enz.).
4. Start een onderliggende OpenClaw Gateway met de echte Matrix-plugin beperkt tot het SUT-account; `qa-channel` wordt niet in het child geladen.
5. Voert scenario's achtereenvolgens uit en observeert events via de Matrix-clients driver/observer.
6. Breekt de homeserver af, schrijft rapport- en samenvattingsartefacten, en sluit daarna af.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Algemene vlaggen

| Vlag                  | Standaard                                     | Beschrijving                                                                                                                |
| --------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Scenarioprofiel. Zie [Profielen](#profiles).                                                                                |
| `--fail-fast`         | uit                                           | Stop na de eerste mislukte check of het eerste mislukte scenario.                                                           |
| `--scenario <id>`     | —                                             | Voer alleen dit scenario uit. Herhaalbaar. Zie [Scenario's](#scenarios).                                                    |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Waar rapporten, samenvatting, geobserveerde events en het uitvoerlog worden geschreven. Relatieve paden worden opgelost ten opzichte van `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                               | Repository-root wanneer je vanuit een neutrale werkdirectory aanroept.                                                      |
| `--sut-account <id>`  | `sut`                                         | Matrix-account-id binnen de QA Gateway-configuratie.                                                                        |

### Provider-vlaggen

De lane gebruikt een echt Matrix-transport, maar de modelprovider is configureerbaar:

| Vlag                     | Standaard        | Beschrijving                                                                                                                                 |
| ------------------------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` voor deterministische mock-dispatch of `live-frontier` voor live frontier-providers. De legacy-alias `live-openai` werkt nog. |
| `--model <ref>`          | provider default | Primaire `provider/model`-ref.                                                                                                               |
| `--alt-model <ref>`      | provider default | Alternatieve `provider/model`-ref waar scenario's halverwege de run overschakelen.                                                           |
| `--fast`                 | uit              | Schakel provider-fast-mode in waar ondersteund.                                                                                              |

Matrix QA accepteert geen `--credential-source` of `--credential-role`. De lane richt lokaal wegwerpbare gebruikers in; er is geen gedeelde credential-pool om uit te leasen.

## Profielen

Het geselecteerde profiel bepaalt welke scenario's worden uitgevoerd.

| Profiel         | Gebruik het voor                                                                                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (standaard) | Volledige catalogus. Traag maar uitputtend.                                                                                                                                                                                         |
| `fast`          | Release-gate-subset die het live transportcontract oefent: canary, mention gating, allowlist block, reply shape, restart resume, thread follow-up, thread isolation, reaction observation en levering van exec approval-metadata. |
| `transport`     | Scenario's op transportniveau voor threading, DM, room, autojoin, mention/allowlist, approval en reactions.                                                                                                                          |
| `media`         | Dekking voor image-, audio-, video-, PDF- en EPUB-bijlagen.                                                                                                                                                                          |
| `e2ee-smoke`    | Minimale E2EE-dekking — basisversleutelde reply, thread follow-up, bootstrap-succes.                                                                                                                                                 |
| `e2ee-deep`     | Uitputtende E2EE-scenario's voor state-loss, backup, keys en recovery.                                                                                                                                                               |
| `e2ee-cli`      | `openclaw matrix encryption setup`- en `verify *`-CLI-scenario's die via de QA-harness worden aangestuurd.                                                                                                                          |

De exacte mapping staat in `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Scenario's

De volledige lijst met scenario-id's is de `MatrixQaScenarioId` union in `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Categorieën omvatten:

- threading — `matrix-thread-*`, `matrix-subagent-thread-spawn`
- top-level / DM / room — `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming en toolvoortgang — `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- media — `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- routing — `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reactions — `matrix-reaction-*`
- approvals — `matrix-approval-*` (exec/plugin-metadata, chunked fallback, deny reactions, threads en `target: "both"`-routing)
- restart en replay — `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- mention gating, bot-to-bot en allowlists — `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE — `matrix-e2ee-*` (basisreply, thread follow-up, bootstrap, recovery-key-lifecycle, state-loss-varianten, serverbackupgedrag, apparaathygiëne, SAS / QR / DM-verificatie, restart, artefactredactie)
- E2EE CLI — `matrix-e2ee-cli-*` (encryption setup, idempotent setup, bootstrap failure, recovery-key lifecycle, multi-account, gateway-reply round-trip, self-verification)

Geef `--scenario <id>` (herhaalbaar) door om een handmatig gekozen set uit te voeren; combineer met `--profile all` om profielgating te negeren.

## Omgevingsvariabelen

| Variabele                              | Standaardwaarde                           | Effect                                                                                                                                                                                         |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 min)                        | Harde bovengrens voor de volledige run.                                                                                                                                                        |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Grens voor het eerste canary-antwoord. Release-CI verhoogt dit op gedeelde runners, zodat een trage eerste Gateway-beurt niet faalt voordat scenariodekking begint.                            |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Stiltevenster voor negatieve no-reply-asserties. Begrensd op `≤` de run-time-out.                                                                                                              |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Grens voor Docker-teardown. Foutmeldingen bevatten de herstelopdracht `docker compose ... down --remove-orphans`.                                                                              |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Overschrijf de homeserver-image bij validatie tegen een andere Tuwunel-versie.                                                                                                                 |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | aan                                       | `0` onderdrukt `[matrix-qa] ...`-voortgangsregels op stderr. `1` forceert ze aan.                                                                                                               |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | geredigeerd                               | `1` behoudt de berichttekst en `formatted_body` in `matrix-qa-observed-events.json`. Standaard wordt geredigeerd om CI-artefacten veilig te houden.                                           |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | uit                                       | `1` slaat de deterministische `process.exit` over na het schrijven van artefacten. De standaard forceert afsluiten omdat native crypto-handles van matrix-js-sdk de event loop actief kunnen houden na voltooiing van artefacten. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | niet ingesteld                            | Wanneer ingesteld door een buitenliggende launcher (bijv. `scripts/run-node.mjs`), gebruikt Matrix QA dat logpad opnieuw in plaats van een eigen tee te starten.                               |

## Uitvoerartefacten

Geschreven naar `--output-dir`:

- `matrix-qa-report.md` — Markdown-protocolrapport (wat is geslaagd, mislukt, overgeslagen, en waarom).
- `matrix-qa-summary.json` — Gestructureerde samenvatting geschikt voor CI-parsing en dashboards.
- `matrix-qa-observed-events.json` — Geobserveerde Matrix-events van de driver- en observer-clients. Bodies worden geredigeerd tenzij `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; goedkeuringsmetadata wordt samengevat met geselecteerde veilige velden en een ingekorte opdrachtpreview.
- `matrix-qa-output.log` — Gecombineerde stdout/stderr van de run. Als `OPENCLAW_RUN_NODE_OUTPUT_LOG` is ingesteld, wordt in plaats daarvan het log van de buitenliggende launcher opnieuw gebruikt.

De standaarduitvoermap is `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, zodat opeenvolgende runs elkaar niet overschrijven.

## Triage-tips

- **Run blijft hangen tegen het einde:** native crypto-handles van `matrix-js-sdk` kunnen langer leven dan de harness. De standaard forceert een schone `process.exit` na het schrijven van artefacten; als je `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` hebt uitgeschakeld, verwacht dan dat het proces blijft hangen.
- **Cleanup-fout:** zoek de afgedrukte herstelopdracht (een `docker compose ... down --remove-orphans`-aanroep) en voer die handmatig uit om de homeserver-poort vrij te geven.
- **Flaky vensters voor negatieve asserties in CI:** verlaag `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (standaard 8 s) wanneer CI snel is; verhoog het op trage gedeelde runners.
- **Geredigeerde bodies nodig voor een bugrapport:** voer opnieuw uit met `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` en voeg `matrix-qa-observed-events.json` toe. Behandel het resulterende artefact als gevoelig.
- **Andere Tuwunel-versie:** wijs `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` naar de versie die wordt getest. De lane controleert alleen de vastgepinde standaardimage.

## Live-transportcontract

Matrix is een van de drie live-transportlanes (Matrix, Telegram, Discord) die een enkele contractchecklist delen, gedefinieerd in [QA-overzicht → Live-transportdekking](/nl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` blijft de brede synthetische suite en is bewust geen onderdeel van die matrix.

## Gerelateerd

- [QA-overzicht](/nl/concepts/qa-e2e-automation) — algemene QA-stack en live-transportcontract
- [QA Channel](/nl/channels/qa-channel) — synthetische channel-adapter voor repo-ondersteunde scenario's
- [Testen](/nl/help/testing) — tests uitvoeren en QA-dekking toevoegen
- [Matrix](/nl/channels/matrix) — de channel-Plugin onder test
