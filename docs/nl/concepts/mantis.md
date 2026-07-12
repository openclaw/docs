---
read_when:
    - Live visuele kwaliteitscontrole voor OpenClaw-bugs bouwen of uitvoeren
    - Verificatie vóór en na toevoegen voor een pull request
    - Discord-, Slack-, WhatsApp- of andere livetransportscenario's toevoegen
    - Gericht browserbewijs voor de Control UI uitvoeren voor een kandidaatref
    - QA-runs debuggen waarvoor schermafbeeldingen, browserautomatisering of VNC-toegang nodig zijn
summary: Mantis legt visueel end-to-endbewijs vast voor live transportvergelijkingen en gerichte browserbewijzen die uitsluitend op kandidaten zijn gericht, en voegt de artefacten vervolgens toe aan PR's.
title: Bidsprinkhaan
x-i18n:
    generated_at: "2026-07-12T08:47:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86b65ae8503b23407b600aa08f16940f9fcaa9a4e598963f7f878a3b336784f0
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis publiceert visueel CI-bewijs en een PR-opmerking voor OpenClaw-gedrag.
Live-transportscenario's vergelijken een bekende foutieve basislijn met een kandidaatref;
gerichte browsertrajecten kunnen in plaats daarvan één kandidaat bewijzen aan de hand van een deterministische
gesimuleerde transportlaag. Discord werd als eerste uitgebracht met echte botauthenticatie, guildkanalen,
reacties, threads en een browsergetuige. Er bestaan ook trajecten voor Slack, Telegram en gerichte Control
UI-chat; WhatsApp en Matrix zijn niet geïmplementeerd.

## Eigenaarschap

- OpenClaw (`extensions/qa-lab/src/mantis/*`): scenarioruntime, CLI `pnpm openclaw qa mantis <command>`, bewijsschema.
- QA Lab (`extensions/qa-lab/src/live-transports/*`): live-transporttestomgeving, driver-/SUT-bots, rapport-/bewijsschrijvers.
- Crabbox (`openclaw/crabbox`): opgewarmde Linux-machines, leases, VNC, `crabbox media preview`.
- GitHub Actions (`.github/workflows/mantis-*.yml`): externe toegangspunten, bewaring van artefacten.
- ClawSweeper: parseert PR-opdrachten van beheerders, start workflows en plaatst de definitieve PR-opmerking.

## CLI-opdrachten

Alle opdrachten hebben de vorm `pnpm openclaw qa mantis <command>` en zijn gedefinieerd in
`extensions/qa-lab/src/mantis/cli.ts`. Vereist `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
tijdens het bouwen/uitvoeren (meegeleverde workflows stellen vóór het bouwen
`OPENCLAW_BUILD_PRIVATE_QA=1` en `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` in).

| Opdracht                        | Doel                                                                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | Controleren of de Mantis Discord-bot de guild/het kanaal kan zien, een bericht kan plaatsen en kan reageren.                                              |
| `run`                           | Een voor-/nascenario uitvoeren op basislijn- en kandidaatrefs (alleen Discord).                                                                            |
| `desktop-browser-smoke`         | Een Crabbox-desktop leasen/hergebruiken, een zichtbare browser openen en een schermafbeelding + video vastleggen.                                         |
| `slack-desktop-smoke`           | Een Crabbox-desktop leasen/hergebruiken, Slack-QA daarin uitvoeren, Slack Web openen en bewijs vastleggen.                                                 |
| `telegram-desktop-builder`      | Een Crabbox-desktop leasen/hergebruiken, Telegram Desktop installeren en optioneel een OpenClaw-Gateway configureren.                                      |
| `visual-task` / `visual-driver` | Algemene vastlegging van een Crabbox-desktop met optionele controles via beeldherkenning; `visual-driver` is het drivergedeelte dat onder `crabbox record --while` wordt gestart. |

Elke opdracht accepteert `--repo-root <path>` en `--output-dir <path>`; Crabbox-
opdrachten accepteren ook `--crabbox-bin`, `--provider`, `--machine-class`/`--class`,
`--lease-id`, `--idle-timeout`, `--ttl` en `--keep-lease`. De lokale CLI-standaardwaarden
voor provider/klasse zijn `hetzner`/`beast`, tenzij anders vermeld; CI-workflows
overschrijven doorgaans beide.

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Roept de Discord REST-API (`https://discord.com/api/v10`) aan om de botgebruiker,
de guild, de kanalen van de guild en het doelkanaal op te halen, controleert of het
kanaal bij de guild hoort en plaatst vervolgens (tenzij `--skip-post` is opgegeven)
een bericht met een `👀`-reactie. Schrijft `mantis-discord-smoke-summary.json` en
`mantis-discord-smoke-report.md`.

Volgorde voor tokenbepaling: de waarde van `--token-file`, vervolgens `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(overschrijven met `--token-env`) en daarna een bestand waarvan de naam wordt bepaald door `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
(overschrijven met `--token-file-env`). Guild-/kanaal-id's komen uit
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` (overschrijven met
`--guild-id` / `--channel-id`) en moeten Discord-snowflakes van 17-20 cijfers zijn. Stel
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` in om bot-/guild-/kanaal-/bericht-id's
en namen in de gepubliceerde samenvatting en het rapport te vervangen door `<redacted>`.

### `run`

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

`--transport` accepteert momenteel alleen `discord`. `--scenario` is een van twee
ingebouwde id's, elk met een eigen standaardref voor de basislijn en verwachte voor-/na-
labels (`extensions/qa-lab/src/mantis/run.runtime.ts`):

| Scenario                                   | Standaardbasislijn                         | Basislijn verwacht                        | Kandidaat verwacht            |
| ------------------------------------------ | ------------------------------------------ | ----------------------------------------- | ----------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                             | `queued -> thinking -> done`  |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | threadantwoord laat `filePath`-bijlage weg | threadantwoord bevat deze     |

`--candidate` heeft standaard de waarde `HEAD`. Andere vlaggen: `--credential-source`
(standaard `convex`), `--credential-role` (standaard `ci`), `--provider-mode`
(standaard `live-frontier`), `--fast` (standaard ingeschakeld), `--skip-install`, `--skip-build`.

De runner maakt voor de basislijn en kandidaat losse `git worktree`-check-outs
onder `<output-dir>/worktrees/`, voert in elk daarvan `pnpm install`/`pnpm build` uit
(tenzij overgeslagen) en voert vervolgens
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
uit voor elke worktree. Elk traject schrijft `discord-qa-reaction-timelines.json`
plus een paar `<scenario-id>-timeline.html`/`.png`; de runner kopieert dit
bewijs terug naar `baseline/`/`candidate/`, schrijft `comparison.json`,
`mantis-report.md` en `mantis-evidence.json` in de uitvoermap en
eindigt met een niet-nulstatus als de vergelijking niet is geslaagd (basislijn
`fail` en kandidaat `pass`).

Het tweede Discord-scenario (`discord-thread-reply-filepath-attachment`) plaatst
een bovenliggend bericht met de driverbot, maakt een echte thread, roept de
actie `message.thread-reply` van het SUT aan met een `filePath` binnen de repository
en bevraagt vervolgens herhaaldelijk de thread op het antwoord en de bestandsnaam
van de bijlage. Het verwacht een bijlage met de naam `mantis-thread-report.md`.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Leaset of hergebruikt een Crabbox-desktop, start binnen de VNC-sessie een browser
die naar `--browser-url` (standaard `https://openclaw.ai`) of een gerenderd
`--html-file` wijst, wacht, maakt een schermafbeelding met `scrot`, neemt optioneel
een MP4 op met `ffmpeg` en synchroniseert `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
via rsync terug naar `--output-dir`.

Vlaggen:

- `--lease-id <cbx_...>` hergebruikt een opgewarmde desktop in plaats van er een te maken.
- `--browser-profile-dir <remote-path>` hergebruikt een externe Chrome-map met gebruikersgegevens, zodat een permanente desktop tussen uitvoeringen aangemeld blijft (gebruikt voor een langdurig Discord Web-weergaveprofiel).
- `--browser-profile-archive-env <name>` herstelt vóór het starten een base64-gecodeerd `.tgz`-archief van een Chrome-profiel vanuit die omgevingsvariabele (standaard `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`); gebruikt voor aangemelde getuigen zoals Discord Web.
- `--video-duration <seconds>` bepaalt de duur van de MP4-opname (standaard 10 s).
- `--keep-lease` (of `OPENCLAW_MANTIS_KEEP_VM=1`) houdt een lease die tijdens deze uitvoering is gemaakt open voor VNC-inspectie; mislukte uitvoeringen die een lease hebben gemaakt, houden deze standaard ook open.

Voor bewijs uit Discord Web gebruikt Mantis een speciaal weergaveaccount, geen
bottoken. De Discord REST-orakelcontrole (via `qa discord`) blijft gezaghebbend; wanneer
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` is ingesteld, schrijft het scenario ook een
Discord Web-URL-artefact en houdt `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` de
thread lang genoeg open zodat de browser deze kan openen.

De GitHub-workflow geeft de voorkeur aan een permanent weergaveprofiel via
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` (volledige profielarchieven kunnen
de limiet voor de geheimgrootte van GitHub overschrijden); voor kleine/opstartprofielen kan deze
in plaats daarvan een base64-gecodeerd `.tgz`-bestand herstellen vanuit `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Als
geen van beide bronnen is geconfigureerd, publiceert de workflow nog steeds de deterministische
schermafbeeldingen van de basislijn/kandidaat en registreert deze dat de aangemelde getuige is
overgeslagen.

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Leaset of hergebruikt een Crabbox-desktop, synchroniseert de check-out naar de VM, voert
`pnpm openclaw qa slack` daarin uit, opent Slack Web in de VNC-browser,
legt de desktop vast en kopieert zowel de Slack-QA-artefacten (`slack-qa/`) als
de VNC-schermafbeelding/video lokaal terug. Dit is de enige Mantis-vorm waarbij de
SUT-Gateway en de browser beide binnen dezelfde VM draaien.

Met `--gateway-setup` maakt de opdracht in de VM een permanente, wegwerpbare OpenClaw-
thuismap op `$HOME/.openclaw-mantis/slack-openclaw`, past de Slack-
Socket Mode-configuratie voor het doelkanaal aan, start
`openclaw gateway run --dev --allow-unconfigured --port 38973` en laat
Chrome actief in de VNC-sessie; zonder `--gateway-setup` wordt in plaats daarvan het normale
bot-naar-bot-Slack-QA-traject uitgevoerd.

Vereiste omgevingsvariabelen voor `--credential-source env` (lokale standaardwaarde is `env`;
de standaardrol is `maintainer`):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` voor het externe modeltraject (als lokaal alleen `OPENAI_API_KEY`
  is ingesteld, kopieert Mantis deze naar `OPENCLAW_LIVE_OPENAI_KEY` voordat
  Crabbox wordt aangeroepen)

Met `--credential-source convex` leaset Mantis de Slack-SUT-aanmeldgegevens uit
de gedeelde pool voordat de VM wordt gemaakt en stuurt het kanaal-id, het app-token en
het bottoken als `OPENCLAW_MANTIS_SLACK_*`-omgevingsvariabelen door naar de VM, zodat GitHub-
workflows alleen het geheim van de Convex-broker nodig hebben, niet de onbewerkte Slack-tokens.

Andere vlaggen: `--slack-url <url>` opent een specifieke URL (anders leidt Mantis
`https://app.slack.com/client/<team>/<channel>` af uit `auth.test`);
`--slack-channel-id <id>` stelt het kanaal in de toelatingslijst van de Gateway in;
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` bepaalt het permanente Chrome-
profiel binnen de VM (standaard `$HOME/.config/openclaw-mantis/slack-chrome-profile`);
`--approval-checkpoints` voert de systeemeigen Slack-goedkeuringsscenario's uit
(`slack-approval-exec-native`, `slack-approval-plugin-native`) en rendert
schermafbeeldingen van openstaande/afgehandelde controlepunten in plaats van Gateway-configuratie (kan
niet samen met `--gateway-setup` worden gebruikt); `--hydrate-mode source|prehydrated`,
`--provider-mode`, `--model`, `--alt-model` en `--fast` worden doorgegeven aan het
live Slack-traject.

Schermafbeeldingen van goedkeuringscontrolepunten worden gerenderd vanuit het Slack-API-bericht dat het
scenario heeft waargenomen, niet vanuit de live Slack-UI; `slack-desktop-smoke.png` is alleen
bewijs van Slack Web zelf wanneer het browserprofiel van de lease al was aangemeld.

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Leaset of hergebruikt een Crabbox-desktop, installeert de systeemeigen Linux-versie van Telegram Desktop,
herstelt optioneel een gebruikerssessiearchief, configureert OpenClaw met het
geleasete Telegram-SUT-bottoken, start
`openclaw gateway run --dev --allow-unconfigured --port 38974`, plaatst een
gereedheidsbericht van de driverbot in de geleasete privégroep en maakt vervolgens een
schermafbeelding en MP4. Een bottoken configureert alleen OpenClaw; het meldt
Telegram Desktop nooit aan. De desktopviewer is een afzonderlijke Telegram-gebruikerssessie
die wordt hersteld vanuit `--telegram-profile-archive-env <name>` of handmatig wordt aangemeld
via VNC en actief wordt gehouden met `--keep-lease`.

Vlaggen: `--lease-id <cbx_...>` voert de test opnieuw uit op een VM die al is aangemeld bij
Telegram Desktop; `--telegram-profile-archive-env <name>` herstelt vóór het starten een base64-
`.tgz`-profielarchief; `--telegram-profile-dir <remote-path>`
stelt de externe profielmap in (standaard `$HOME/.local/share/TelegramDesktop`);
`--no-gateway-setup` installeert en opent alleen Telegram Desktop;
`--credential-source`/`--credential-role` zijn standaard `convex`/`maintainer`.

## Bewijsmanifest

Elk scenario dat naar een PR publiceert, schrijft `mantis-evidence.json` naast
het bijbehorende rapport:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord Status Reactions QA",
  "summary": "Human-readable top summary for the PR comment.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "queued-only" },
    "candidate": { "sha": "...", "status": "pass", "expected": "queued -> thinking -> done" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Baseline queued-only",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Baseline Discord timeline",
      "width": 420
    }
  ]
}
```

Het artefactpad `path` is relatief ten opzichte van de map van het manifest; `targetPath` is
relatief ten opzichte van het geconfigureerde R2/S3-artefactvoorvoegsel. `scripts/mantis/publish-pr-evidence.mjs`
weigert padtraversering en slaat vermeldingen met `"required": false` over wanneer het
bestand ontbreekt.

Artefacttypen: `timeline` (deterministische schermafbeelding van voor en na),
`desktopScreenshot` (VNC-/browserschermafbeelding), `motionPreview` (inline geanimeerde
GIF uit de opname), `motionClip` (op beweging bijgesneden MP4), `fullVideo` (volledige
opname), `metadata` (JSON-/log-nevenbestand), `report` (Markdown-rapport).

De artefactindeling van een uitvoering op schijf:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

Schermafbeeldingen zijn bewijs, geen geheimen, maar vereisen nog steeds zorgvuldige redactie:
namen van privékanalen, gebruikersnamen of berichtinhoud kunnen zichtbaar zijn. Stel
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` in voor openbare artefactuploads; dit is
standaard ingeschakeld in de GitHub-workflows voor Discord/Slack/Telegram.

## GitHub-automatisering

`scripts/mantis/publish-pr-evidence.mjs` is de herbruikbare publiceerder. Workflows
roepen deze aan met het manifest, de doel-PR, de hoofdmap voor artefactdoelen, de reactiemarkering,
de artefact-URL, de uitvoerings-URL en de aanvraagbron. De publiceerder uploadt de opgegeven artefacten naar
de Mantis R2-bucket, bouwt een PR-reactie met de samenvatting voorop, inline
afbeeldingen/voorvertoningen en gekoppelde video's, en werkt vervolgens de bestaande gemarkeerde reactie bij of
maakt een nieuwe. Vereiste omgevingsvariabelen:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (workflows stellen `openclaw-crabbox-artifacts` in)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (workflows stellen `auto` in)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (workflows stellen `https://artifacts.openclaw.ai` in)

Reacties worden geplaatst via de Mantis GitHub App (`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`), niet via `github-actions[bot]`, waarbij een verborgen
markeringsreactie als upsert-sleutel wordt gebruikt.

| Workflow                          | Trigger                                                                                    | Wat deze doet                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | handmatige activering                                                                      | Voert `discord-smoke` uit voor een gekozen ref.                                                                                                                                                                                                                                                                   |
| `Mantis Discord Status Reactions` | PR-reactie of handmatige activering                                                        | Bouwt afzonderlijke werkmappen voor basislijn/kandidaat, voert `discord-status-reactions-tool-only` op beide uit, rendert de tijdlijn van elk traject in een Crabbox-desktopbrowser, genereert op beweging bijgesneden GIF-/MP4-voorvertoningen met `crabbox media preview`, uploadt artefacten en plaatst inline PR-bewijs. |
| `Mantis Scenario`                 | handmatige activering                                                                      | Algemene dispatcher: accepteert `scenario_id` (`discord-status-reactions-tool-only`, `discord-thread-reply-filepath-attachment`, `slack-desktop-smoke`, `telegram-live`, `telegram-desktop-proof`, `web-ui-chat-proof`), `baseline_ref`, `candidate_ref`, `pr_number` en stuurt deze door naar de bijbehorende scenarioworkflow. |
| `Mantis Slack Desktop Smoke`      | handmatige activering                                                                      | Leaset een Crabbox-Linux-desktop (standaard `aws`, met keuze voor `hetzner`), voert `slack-desktop-smoke --gateway-setup` uit voor de kandidaat, neemt de desktop op, genereert een bewegingsvoorvertoning, uploadt artefacten en plaatst PR-bewijs wanneer een PR-nummer is opgegeven.                               |
| `Mantis Telegram Live`            | PR-reactie of handmatige activering                                                        | Voert het live Telegram-QA-traject via de bot-API uit (`openclaw qa telegram`), schrijft `mantis-evidence.json` vanuit de QA-samenvatting, rendert geredigeerde bewijs-HTML via een Crabbox-desktopbrowser, genereert een bewegings-GIF en plaatst PR-bewijs. Aanmelding bij Telegram Web is voor dit traject niet vereist. |
| `Mantis Telegram Desktop Proof`   | PR-label van beheerder (`mantis: telegram-visible-proof`) plus PR-reactie, of handmatige activering | Agentgestuurd systeemeigen Telegram Desktop-bewijs van voor en na. Geeft de PR, refs voor basislijn/kandidaat en instructies van de beheerder door aan Codex, dat voor beide refs het echte-gebruikersbewijstraject voor Crabbox Telegram Desktop uitvoert en een PR-bewijstabel met twee kolommen plaatst.             |
| `Mantis Web UI Chat Proof`        | PR-reactie of handmatige activering                                                        | Voert het gerichte Playwright-bewijs voor OpenClaw Control UI-chat uit voor de kandidaat, verifieert dat de browser via de nagebootste Gateway verzendt, legt schermafbeeldings-/videoartefacten vast en plaatst PR-bewijs. Dit traject bewijst alleen webchat, niet WinUI/systeemeigen apps of willekeurig visueel bewijs. |

`Mantis Discord Status Reactions` en `Mantis Telegram Live` accepteren beide
`baseline_ref`/`candidate_ref` (of `baseline=`/`candidate=` in een PR-reactie)
en valideren vóór uitvoering met geheime aanmeldgegevens dat de herleide SHA een voorouder is van `origin/main`, een
releasetag (`v*`) of de kop van een open PR.

Reactietriggers vanuit een PR met schrijf-/beheer-/beheerderstoegang:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Telegram-reactietriggers gebruiken standaard de kop-SHA van de PR als kandidaat en
`telegram-status-command` als scenario; ze accepteren `provider=aws|hetzner` en
`lease=<cbx_...>` om een specifieke Crabbox-provider of een voorverwarmde
desktop te gebruiken. `Mantis Telegram Desktop Proof` reageert alleen op een PR-reactie wanneer
de PR al het label `mantis: telegram-visible-proof` heeft.

Reactietriggers voor web-UI-chat gebruiken standaard de kop-SHA van de PR als kandidaat. Ze voeren
het chatbewijs voor Control UI met nagebootste Gateway uit en publiceren browserartefacten; gebruik
normaal Playwright-/browserbewijs, schermafbeeldingen van beheerders, Crabbox of lokale
artefacten voor andere webpagina's en systeemeigen app-oppervlakken.

ClawSweeper kan een scenario ook rechtstreeks activeren:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## Machines en geheimen

De standaardwaarden van de lokale CLI voor Crabbox zijn `--provider hetzner --class beast`; overschrijf
deze met `--provider`, `--class`/`--machine-class` of
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS`. GitHub-
workflows overschrijven beide vaak (bijvoorbeeld `--class standard` en de
invoer voor de providerkeuze `aws`/`hetzner` van de Slack-workflow). Als een provider te
traag of niet beschikbaar is, voeg deze dan achter dezelfde Crabbox-interface toe in plaats van
een terugvaloptie hard te coderen.

VM-basislijn: Linux met desktopgeschikte Chrome/Chromium, CDP-toegang, VNC/
noVNC, Node 22+ en pnpm, een OpenClaw-checkout en uitgaande toegang tot het
doeltransport, GitHub, modelproviders en de broker voor aanmeldgegevens.

Namen van geheimen die in de Mantis-workflows worden gebruikt:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` voor openbare artefactuploads
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (workflows accepteren ook
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` als terugvaloptie en koppelen
  deze aan de gewone namen voordat Crabbox wordt aangeroepen)
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

De Mantis-runner mag nooit Discord-/Slack-/Telegram-bottokens,
API-sleutels van providers, browsercookies, inhoud van authenticatieprofielen, VNC-wachtwoorden of
onbewerkte payloads met aanmeldgegevens afdrukken. Als een token uitlekt in een issue, PR, chat of log,
roteer het dan nadat het vervangende geheim is opgeslagen.

## Uitvoeringsresultaten

Transportscenario's met voor-en-na-vergelijking onderscheiden deze resultaten, zodat een instabiele
omgeving niet als productregressie wordt geïnterpreteerd:

- **Bug gereproduceerd**: de basislijn mislukte op de manier die het scenario verwacht.
- **Harnasmislukking**: de omgevingsconfiguratie, aanmeldgegevens, transport-API, browser
  of provider mislukte voordat de oracle betekenisvol was.

Browserbewijs voor alleen de kandidaat meldt of de kandidaat slaagde voor de nagebootste
Gateway- en zichtbare UI-asserties; het claimt niet dat de basislijn is gereproduceerd.

## Een scenario toevoegen

Live transportscenario's worden per transport in TypeScript gedefinieerd (zie
`MANTIS_SCENARIO_CONFIGS` in `extensions/qa-lab/src/mantis/run.runtime.ts` voor
de Discord-structuur met voor-en-na-vergelijking), niet als een zelfstandige declaratieve bestandsindeling.
Elk scenario vereist: id en titel, transport, vereiste aanmeldgegevens, refbeleid voor de basislijn,
refbeleid voor de kandidaat, OpenClaw-configuratiepatch, configuratie-/stimulusstappen,
verwachte oracle voor basislijn en kandidaat, doelen voor visuele vastlegging, time-outbudget
en opschoningsstappen.

Gericht browserbewijs dat alleen voor een kandidaat geldt, kan een speciale deterministische E2E-test en workflow gebruiken. Houd het bereik ervan expliciet, valideer de kandidaat-ref vóór uitvoering, isoleer publicatie waarvoor geheimen nodig zijn en genereer hetzelfde manifestcontract voor bewijsmateriaal.

Geef de voorkeur aan kleine, getypeerde orakels boven visuele controles: de reactiestatus of berichtverwijzingen van Discord, de `ts`-waarde van een Slack-thread/de reactiestatus uit de API, en bericht-ID's en headers van e-mails. Gebruik browserschermafbeeldingen wanneer de UI het enige betrouwbare waarneembare resultaat is en houd visuele controles aanvullend op een platform-API-orakel als dat beschikbaar is.

Na Discord, Slack en Telegram kan dezelfde runnerstructuur worden uitgebreid naar WhatsApp (QR-aanmelding, heridentificatie, bezorging, media, reacties) en Matrix (versleutelde ruimtes, thread-/antwoordrelaties, hervatting na opnieuw opstarten); geen van beide is nog geïmplementeerd.

## Openstaande vragen

- Welke Discord-bot moet het stuurprogramma zijn en welke het te testen systeem wanneer de bestaande Mantis-bot opnieuw wordt gebruikt?
- Hoelang moet GitHub Mantis-artefacten voor PR's bewaren?
- Wanneer moet ClawSweeper automatisch een Mantis-scenario aanbevelen in plaats van op een opdracht van een beheerder te wachten?
- Moeten schermafbeeldingen vóór het uploaden voor openbare PR's worden geredigeerd of bijgesneden?
