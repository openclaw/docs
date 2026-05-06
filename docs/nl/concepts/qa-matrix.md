---
read_when:
    - '`pnpm openclaw qa matrix` lokaal uitvoeren'
    - Matrix-QA-scenario's toevoegen of selecteren
    - Triage van Matrix QA-fouten, time-outs of vastgelopen opschoning
summary: 'Naslag voor beheerders voor het door Docker ondersteunde Matrix live QA-traject: CLI, profielen, omgevingsvariabelen, scenario''s en uitvoerartefacten.'
title: Matrix-kwaliteitsborging
x-i18n:
    generated_at: "2026-05-06T09:10:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c6d836492368c470468547950d3765a64187694852222a5a1f0ae4185569abe
    source_path: concepts/qa-matrix.md
    workflow: 16
---

De Matrix-QA-baan voert de gebundelde `@openclaw/matrix` Plugin uit tegen een wegwerp-Tuwunel-homeserver in Docker, met tijdelijke driver-, SUT- en observer-accounts plus vooraf gevulde rooms. Dit is de live, transport-realistische dekking voor Matrix.

Dit is tooling uitsluitend voor maintainers. Gepubliceerde OpenClaw-releases laten `qa-lab` bewust weg, dus `openclaw qa` is alleen beschikbaar vanuit een broncode-checkout. Broncode-checkouts laden de gebundelde runner rechtstreeks - er is geen Plugin-installatiestap nodig.

Voor bredere context over het QA-framework, zie [QA-overzicht](/nl/concepts/qa-e2e-automation).

## Snelstart

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Gewoon `pnpm openclaw qa matrix` voert `--profile all` uit en stopt niet bij de eerste fout. Gebruik `--profile fast --fail-fast` voor een release-gate; shard de catalogus met `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` wanneer je de volledige inventaris parallel uitvoert.

## Wat de baan doet

1. Richt een wegwerp-Tuwunel-homeserver in Docker in (standaardimage `ghcr.io/matrix-construct/tuwunel:v1.5.1`, servernaam `matrix-qa.test`, poort `28008`).
2. Registreert drie tijdelijke gebruikers - `driver` (stuurt inkomend verkeer), `sut` (het OpenClaw Matrix-account dat wordt getest), `observer` (verkeerscapture door derden).
3. Vult rooms vooraf die vereist zijn door de geselecteerde scenario's (main, threading, media, restart, secondary, allowlist, E2EE, verification DM, enz.).
4. Start een child-OpenClaw-Gateway met de echte Matrix Plugin beperkt tot het SUT-account; `qa-channel` wordt niet in het child geladen.
5. Voert scenario's opeenvolgend uit en observeert events via de Matrix-clients driver/observer.
6. Breekt de homeserver af, schrijft rapport- en samenvattingsartefacten en sluit daarna af.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Veelgebruikte vlaggen

| Vlag                  | Standaardwaarde                              | Beschrijving                                                                                                               |
| --------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Scenarioprofiel. Zie [Profielen](#profiles).                                                                               |
| `--fail-fast`         | uit                                           | Stop na de eerste mislukte check of het eerste mislukte scenario.                                                          |
| `--scenario <id>`     | -                                             | Voer alleen dit scenario uit. Herhaalbaar. Zie [Scenario's](#scenarios).                                                   |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Waar rapporten, samenvatting, geobserveerde events en het uitvoerlog worden geschreven. Relatieve paden worden opgelost ten opzichte van `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                               | Repository-root bij aanroepen vanuit een neutrale werkdirectory.                                                           |
| `--sut-account <id>`  | `sut`                                         | Matrix-account-id binnen de QA-Gateway-configuratie.                                                                       |

### Providervlaggen

De baan gebruikt een echt Matrix-transport, maar de modelprovider is configureerbaar:

| Vlag                     | Standaardwaarde  | Beschrijving                                                                                                                                    |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` voor deterministische mock-dispatch of `live-frontier` voor live frontierproviders. De legacy-alias `live-openai` werkt nog steeds. |
| `--model <ref>`          | provider default | Primaire `provider/model`-ref.                                                                                                                  |
| `--alt-model <ref>`      | provider default | Alternatieve `provider/model`-ref wanneer scenario's halverwege overschakelen.                                                                  |
| `--fast`                 | uit              | Schakel de snelle providermodus in waar ondersteund.                                                                                            |

Matrix-QA accepteert geen `--credential-source` of `--credential-role`. De baan richt lokaal wegwerpgebruikers in; er is geen gedeelde credential-pool om tegen te leasen.

## Profielen

Het geselecteerde profiel bepaalt welke scenario's worden uitgevoerd.

| Profiel         | Gebruik het voor                                                                                                                                                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (default) | Volledige catalogus. Traag maar uitputtend.                                                                                                                                                                                             |
| `fast`          | Release-gate-subset die het live transportcontract oefent: canary, mention-gating, allowlist-blokkade, reply-vorm, restart-resume, thread-follow-up, thread-isolatie, reactieobservatie en metadatalevering voor exec-goedkeuring. |
| `transport`     | Transportniveau-scenario's voor threading, DM, room, autojoin, mention/allowlist, goedkeuring en reacties.                                                                                                                              |
| `media`         | Dekking voor image-, audio-, video-, PDF- en EPUB-bijlagen.                                                                                                                                                                             |
| `e2ee-smoke`    | Minimale E2EE-dekking - eenvoudige encrypted reply, thread-follow-up, geslaagde bootstrap.                                                                                                                                              |
| `e2ee-deep`     | Uitputtende E2EE-scenario's voor state-loss, backup, key en recovery.                                                                                                                                                                  |
| `e2ee-cli`      | `openclaw matrix encryption setup`- en `verify *`-CLI-scenario's uitgevoerd via de QA-harness.                                                                                                                                          |

De exacte mapping staat in `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Scenario's

De volledige lijst met scenario-id's is de `MatrixQaScenarioId`-union in `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Categorieën omvatten:

- threading - `matrix-thread-*`, `matrix-subagent-thread-spawn`
- top-level / DM / room - `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming en toolvoortgang - `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- media - `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- routering - `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reacties - `matrix-reaction-*`
- goedkeuringen - `matrix-approval-*` (exec/Plugin-metadata, chunked fallback, afwijzingsreacties, threads en `target: "both"`-routering)
- restart en replay - `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- mention-gating, bot-naar-bot en allowlists - `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (eenvoudige reply, thread-follow-up, bootstrap, recovery-key-levenscyclus, state-loss-varianten, serverbackupgedrag, device-hygiëne, SAS / QR / DM-verificatie, restart, artefactredactie)
- E2EE CLI - `matrix-e2ee-cli-*` (encryption setup, idempotente setup, bootstrapfout, recovery-key-levenscyclus, multi-account, gateway-reply round-trip, zelfverificatie)

Geef `--scenario <id>` (herhaalbaar) door om een handgekozen set uit te voeren; combineer met `--profile all` om profiel-gating te negeren.

## Omgevingsvariabelen

| Variabele                               | Standaard                                 | Effect                                                                                                                                                                                                 |
| --------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 min)                        | Harde bovengrens voor de volledige uitvoering.                                                                                                                                                         |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Grens voor het eerste canary-antwoord. Release-CI verhoogt dit op gedeelde runners zodat een trage eerste Gateway-beurt niet mislukt voordat scenariodekking begint.                                  |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Stille periode voor negatieve no-reply-asserties. Begrensd tot `≤` de uitvoeringstime-out.                                                                                                             |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Grens voor Docker-opruiming. Foutmeldingen bevatten de herstelopdracht `docker compose ... down --remove-orphans`.                                                                                     |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Overschrijf de homeserver-image bij validatie tegen een andere Tuwunel-versie.                                                                                                                         |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | aan                                       | `0` onderdrukt `[matrix-qa] ...`-voortgangsregels op stderr. `1` dwingt ze in te schakelen.                                                                                                            |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | geredigeerd                               | `1` behoudt berichttekst en `formatted_body` in `matrix-qa-observed-events.json`. Standaard wordt dit geredigeerd om CI-artefacten veilig te houden.                                                  |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | uit                                       | `1` slaat de deterministische `process.exit` over na het schrijven van artefacten. Standaard wordt afsluiten afgedwongen omdat native crypto-handles van matrix-js-sdk de event loop actief kunnen houden nadat artefacten zijn voltooid. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | niet ingesteld                            | Wanneer ingesteld door een buitenste launcher (bijv. `scripts/run-node.mjs`), hergebruikt Matrix QA dat logpad in plaats van een eigen tee te starten.                                                |

## Uitvoerartefacten

Geschreven naar `--output-dir`:

- `matrix-qa-report.md` - Markdown-protocolrapport (wat is geslaagd, mislukt, overgeslagen, en waarom).
- `matrix-qa-summary.json` - Gestructureerde samenvatting geschikt voor CI-parsing en dashboards.
- `matrix-qa-observed-events.json` - Waargenomen Matrix-events van de driver- en observer-clients. Bodies worden geredigeerd tenzij `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; goedkeuringsmetadata wordt samengevat met geselecteerde veilige velden en een afgekapt opdrachtvoorbeeld.
- `matrix-qa-output.log` - Gecombineerde stdout/stderr van de uitvoering. Als `OPENCLAW_RUN_NODE_OUTPUT_LOG` is ingesteld, wordt het log van de buitenste launcher in plaats daarvan hergebruikt.

De standaarduitvoermap is `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` zodat opeenvolgende uitvoeringen elkaar niet overschrijven.

## Triage-tips

- **Uitvoering blijft hangen tegen het einde:** native crypto-handles van `matrix-js-sdk` kunnen langer leven dan de harness. Standaard wordt een schone `process.exit` afgedwongen nadat artefacten zijn geschreven; als je `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` hebt uitgeschakeld, verwacht dan dat het proces blijft hangen.
- **Opruimfout:** zoek naar de afgedrukte herstelopdracht (een aanroep van `docker compose ... down --remove-orphans`) en voer die handmatig uit om de homeserver-poort vrij te geven.
- **Flaky vensters voor negatieve asserties in CI:** verlaag `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (standaard 8 s) wanneer CI snel is; verhoog het op trage gedeelde runners.
- **Geredigeerde bodies nodig voor een bugrapport:** voer opnieuw uit met `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` en voeg `matrix-qa-observed-events.json` bij. Behandel het resulterende artefact als gevoelig.
- **Andere Tuwunel-versie:** wijs `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` naar de versie die wordt getest. De lane controleert alleen de vastgepinde standaardimage.

## Live transport-contract

Matrix is een van de drie live transport-lanes (Matrix, Telegram, Discord) die een enkele contractchecklist delen die is gedefinieerd in [QA-overzicht → Live transport-dekking](/nl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` blijft de brede synthetische suite en maakt opzettelijk geen deel uit van die matrix.

## Gerelateerd

- [QA-overzicht](/nl/concepts/qa-e2e-automation) - algemene QA-stack en live transport-contract
- [QA Channel](/nl/channels/qa-channel) - synthetische channel-adapter voor repo-ondersteunde scenario's
- [Testen](/nl/help/testing) - tests uitvoeren en QA-dekking toevoegen
- [Matrix](/nl/channels/matrix) - de channel-Plugin die wordt getest
