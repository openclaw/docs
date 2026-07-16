---
doc-schema-version: 1
read_when:
    - Begrijpen hoe de QA-stack in elkaar zit
    - qa-lab, qa-channel of een transportadapter uitbreiden
    - QA-scenario's op basis van een repository toevoegen
    - QA-automatisering met een hoger realiteitsgehalte bouwen rond het Gateway-dashboard
summary: 'Overzicht van de QA-stack: qa-lab, qa-channel, repo-ondersteunde scenario''s, live transportkanalen, transportadapters en rapportage.'
title: QA-overzicht
x-i18n:
    generated_at: "2026-07-16T15:43:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8dcb506cedb57289f29938eb55b5f11ceedfaabba88364dce8249116010ce859
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

De private QA-stack test OpenClaw op een realistische, kanaalgerichte manier die
met een unit-test niet mogelijk is.

Onderdelen:

- `extensions/qa-channel`: synthetisch berichtenkanaal met oppervlakken voor DM's, kanalen, threads,
  reacties, bewerkingen en verwijderingen.
- `extensions/qa-lab`: debugger-UI, QA-bus, scenarioprofielen en live
  transportadapters voor het observeren van het transcript, injecteren van inkomende berichten
  en exporteren van een Markdown-rapport.
- `qa/`: door de repo ondersteunde seed-assets voor de starttaak en standaard-QA-
  scenario's.
- [Mantis](/nl/concepts/mantis): live verificatie vóór en na voor bugs waarvoor
  echte transporten, browserschermafbeeldingen, VM-status en PR-bewijs nodig zijn.

## Opdrachtoppervlak

Elke QA-flow wordt uitgevoerd onder `pnpm openclaw qa <subcommand>`. Veel flows hebben `pnpm qa:*`-
scriptaliassen; beide vormen werken.

| Opdracht                                             | Doel                                                                                                                                                                                                                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Gebundelde QA-zelfcontrole zonder `--qa-profile`; op taxonomie gebaseerde uitvoerder voor volwassenheidsprofielen met `--qa-profile smoke-ci`, `--qa-profile release` of `--qa-profile all`.                                                                                                  |
| `qa suite`                                          | Voer door de repo ondersteunde scenario's uit op de QA-Gateway-lane. `--runner multipass` gebruikt een tijdelijke Linux-VM in plaats van de host.                                                                                                                                         |
| `qa coverage`                                       | Druk de YAML-inventaris van scenariodekking af (`--json` voor machine-uitvoer; `--match <query>` om scenario's voor gewijzigd gedrag te vinden; `--tools` voor dekking van runtime-toolfixtures).                                                                                  |
| `qa parity-report`                                  | Vergelijk twee `qa-suite-summary.json`-bestanden voor een pariteitsgate voor de modelas, of gebruik `--runtime-axis --token-efficiency` om rapporten over runtimepariteit en tokenefficiëntie tussen Codex en OpenClaw te schrijven.                                                                          |
| `qa confidence-report`                              | Classificeer QA-bewijsartefacten aan de hand van een manifest in een betrouwbaarheidsrapport zonder onbekende items.                                                                                                                                                                               |
| `qa confidence-self-test`                           | Schrijf vooraf ingevulde kanaries voor negatieve controles die aantonen dat de betrouwbaarheidsgate afwijkingen detecteert.                                                                                                                                                                                   |
| `qa jsonl-replay`                                   | Speel samengestelde JSONL-transcripten opnieuw af via de replay-harness voor runtimepariteit.                                                                                                                                                                                         |
| `qa character-eval`                                 | Voer het QA-scenario voor personages uit met meerdere live modellen en een beoordeeld rapport. Zie [Rapportage](#reporting).                                                                                                                                                        |
| `qa manual`                                         | Voer een eenmalige prompt uit op de geselecteerde provider-/modellane.                                                                                                                                                                                                      |
| `qa ui`                                             | Start de QA-debugger-UI en lokale QA-bus (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                |
| `qa docker-build-image`                             | Bouw de vooraf samengestelde QA-Docker-image.                                                                                                                                                                                                                                 |
| `qa docker-scaffold`                                | Schrijf een docker-compose-sjabloon voor het QA-dashboard en de Gateway-lane.                                                                                                                                                                                                |
| `qa up`                                             | Bouw de QA-site, start de door Docker ondersteunde stack en druk de URL af (alias: `pnpm qa:lab:up`; de variant `:fast` voegt `--use-prebuilt-image --bind-ui-dist --skip-ui-build` toe).                                                                                              |
| `qa aimock`                                         | Start alleen de AIMock-providerserver.                                                                                                                                                                                                                              |
| `qa mock-openai`                                    | Start alleen de scenariobewuste `mock-openai`-providerserver.                                                                                                                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | Beheer de gedeelde Convex-pool met aanmeldgegevens.                                                                                                                                                                                                                           |
| `qa discord`                                        | Live transportlane voor een echt kanaal in een private Discord-guild.                                                                                                                                                                                                   |
| `qa matrix`                                         | QA Lab Matrix-profielen voor een tijdelijke Tuwunel-homeserver. Zie [Matrix-smokelanes](#matrix-smoke-lanes).                                                                                                                                                      |
| `qa slack`                                          | Live transportlane voor een echt privékanaal in Slack.                                                                                                                                                                                                           |
| `qa telegram`                                       | Live transportlane voor een echte privégroep in Telegram.                                                                                                                                                                                                          |
| `qa whatsapp`                                       | Live transportlane voor echte WhatsApp Web-accounts.                                                                                                                                                                                                             |
| `qa mantis`                                         | Verificatie-uitvoerder voor en na voor bugs in live transporten, met bewijs van Discord-statusreacties, Crabbox-desktop-/browsersmoke en Slack-in-VNC-smoke. Zie [Mantis](/nl/concepts/mantis) en [Mantis Slack Desktop-draaiboek](/nl/concepts/mantis-slack-desktop-runbook). |

### Door profielen ondersteunde `qa run`

Door profielen ondersteunde `qa run` leest het lidmaatschap uit `taxonomy.yaml` en verzendt vervolgens
de opgeloste scenario's via `qa suite`. `--surface` en `--category` filteren
het geselecteerde profiel in plaats van afzonderlijke lanes te definiëren. De resulterende
`qa-evidence.json` bevat een samenvatting van de profielscorekaart met aantallen voor geselecteerde categorieën
en ontbrekende dekkings-ID's; de afzonderlijke bewijsitems blijven de
gezaghebbende bron voor de tests, dekkingsrollen en resultaten. Dekkings-ID's voor taxonomiefuncties
zijn exacte bewijsdoelen, geen aliassen: dekking door primaire scenario's
voldoet aan overeenkomende ID's, terwijl secundaire dekking adviserend blijft. Dekkings-ID's gebruiken
de gestippelde `namespace.behavior`-vorm met alfanumerieke segmenten en streepjes in kleine letters;
profiel-, oppervlak- en categorie-ID's mogen nog steeds de bestaande gestreepte of gestippelde
taxonomie-ID's gebruiken.

Beknopt bewijs laat `execution` per item weg en stelt `evidenceMode: "slim"` in;
`smoke-ci` gebruikt standaard de beknopte vorm en `--evidence-mode full` herstelt volledige items:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Gebruik `smoke-ci` voor deterministisch profielbewijs met mock-modelproviders en
lokale Crabline-providerservers. Gebruik `release` voor Stable/LTS-bewijs met
live kanalen. Gebruik `all` alleen voor expliciete bewijsuitvoeringen voor de volledige taxonomie; hiermee
wordt elke actieve volwassenheidscategorie geselecteerd en deze kan via de GitHub Actions-workflow `QA
Profile Evidence` worden uitgevoerd met `qa_profile=all`. Wanneer een
opdracht ook een OpenClaw-hoofdprofiel nodig heeft, plaats je het hoofdprofiel vóór de
QA-opdracht:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Operatorflow

De huidige QA-operatorflow is een QA-site met twee panelen:

- Links: Gateway-dashboard (Control UI) met de agent.
- Rechts: QA Lab, met het Slack-achtige transcript en scenarioplan.

Voer deze uit met:

```bash
pnpm qa:lab:up
```

Hiermee wordt de QA-site gebouwd, de door Docker ondersteunde Gateway-lane gestart en
de QA Lab-pagina beschikbaar gemaakt, waar een operator of automatiseringslus de agent een QA-
missie kan geven, echt kanaalgedrag kan observeren en kan vastleggen wat werkte, mislukte of
geblokkeerd bleef.

Voor snellere iteratie van de QA Lab-UI zonder telkens de Docker-image opnieuw te bouwen,
start je de stack met een via bind mount gekoppelde QA Lab-bundel:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` laat de Docker-services op een vooraf gebouwde image draaien en
koppelt `extensions/qa-lab/web/dist` via een bind mount aan de `qa-lab`-container.
`qa:lab:watch` bouwt die bundel opnieuw bij wijzigingen en de browser wordt automatisch opnieuw geladen
wanneer de assethash van QA Lab verandert.

### Observability-smoketests

<Note>
Observability-QA blijft uitsluitend beschikbaar vanuit een broncheckout. De npm-tarball sluit
QA Lab (en `qa-channel`) bewust uit, zodat Docker-releas lanes voor pakketten
geen `qa`-opdrachten uitvoeren. Voer deze uit vanuit een gebouwde broncheckout wanneer
je diagnostische instrumentatie wijzigt.
</Note>

| Alias                                   | Wat wordt uitgevoerd                                                                                                                     |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | Lokale OpenTelemetry-ontvanger plus het scenario `otel-trace-smoke` met `diagnostics-otel` ingeschakeld.                                 |
| `pnpm qa:otel:collector-smoke`          | Dezelfde lane achter een echte OpenTelemetry Collector-Dockercontainer. Gebruik deze bij wijzigingen aan endpointbedrading of collector-/OTLP-compatibiliteit. |
| `pnpm qa:prometheus:smoke`              | Het scenario `docker-prometheus-smoke` met `diagnostics-prometheus` ingeschakeld.                                                        |
| `pnpm qa:observability:smoke`           | `qa:otel:smoke` gevolgd door `qa:prometheus:smoke`.                                                                                      |
| `pnpm qa:observability:collector-smoke` | `qa:otel:collector-smoke` gevolgd door `qa:prometheus:smoke`.                                                                            |

`qa:otel:smoke` start een lokale OTLP/HTTP-ontvanger, voert een minimale
agentbeurt via het QA-kanaal uit en controleert vervolgens of traces, metrische
gegevens en logboeken worden geëxporteerd. De geëxporteerde protobuf-tracespans
worden gedecodeerd en de releasekritieke structuur wordt gecontroleerd:
`openclaw.run`, `openclaw.harness.run`, een modelaanropspan volgens de nieuwste
semantische GenAI-conventie, `openclaw.context.assembled` en `openclaw.message.delivery`
moeten allemaal aanwezig zijn. De smoke dwingt
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` af, zodat de modelaanropspan
de naam `{gen_ai.operation.name} {gen_ai.request.model}` moet gebruiken; modelaanroepen
mogen bij geslaagde beurten geen `StreamAbandoned` exporteren; onbewerkte
diagnostische ID's en `openclaw.content.*`-attributen mogen niet in de trace
terechtkomen. De scenarioprompt vraagt het model te antwoorden met een vaste
markering en een vaste geheime tekenreeks achter te houden; de onbewerkte
OTLP-payloads mogen geen van beide bevatten, evenmin als de QA-sessiesleutel
die van het scenario-ID is afgeleid. Het schrijft `otel-smoke-summary.json`
naast de artefacten van de QA-suite.

`qa:prometheus:smoke` controleert of niet-geverifieerde scrapes worden geweigerd
en controleert vervolgens of de geverifieerde scrape releasekritieke
metriekfamilies bevat zonder promptinhoud, antwoordinhoud, onbewerkte
diagnostische identificatoren, authenticatietokens of lokale paden.

### Matrix-smokelanes

Voer voor een Matrix-smokelane met echt transport waarvoor geen
modelproviderreferenties nodig zijn, het releaseprofiel uit met de
deterministische nagebootste OpenAI-provider:

```bash
pnpm openclaw qa matrix --provider-mode mock-openai --profile release
```

Geef voor de live-frontier-providerlane expliciet OpenAI-compatibele
referenties op:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile release
```

Een gewone `pnpm openclaw qa matrix` voert het volledige profiel `all`
uit en gaat na scenariofouten verder. Gebruik `--fail-fast` voor een
kortere feedbackcyclus of herhaal `--scenario <id>` om afzonderlijke
scenario's te selecteren; expliciete scenario-ID's hebben voorrang op
`--profile`.

| Profiel      | Scenario's | Doel                                                                                                                                     |
| ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `all`        | 93        | Volledige catalogus (standaard).                                                                                                         |
| `release`    | 2         | Releasekritieke kanaalbasis en live herladen van de toelatingslijst.                                                                     |
| `fast`       | 12        | Gerichte dekking voor threads, reacties, goedkeuringen, beleid, botbeperking en versleutelde antwoorden.                                 |
| `transport`  | 50        | Threads, DM-/roomroutering, automatisch deelnemen, goedkeuringen, reacties, herstarts, vermeldings-/toelatingslijstbeleid, bewerkingen en ordening met meerdere actoren. |
| `media`      | 7         | Dekking voor afbeeldingen, gegenereerde afbeeldingen, spraak, bijlagen, niet-ondersteunde media en versleutelde media.                    |
| `e2ee-smoke` | 8         | Minimale dekking voor versleutelde antwoorden, threads, bootstrap, herstel, herstart, redactie en fouten.                                |
| `e2ee-deep`  | 18        | Statusverlies, back-ups, sleutelherstel, apparaathygiëne en SAS-/QR-/DM-verificatie.                                                      |
| `e2ee-cli`   | 9         | `openclaw matrix encryption setup`, herstelsleutel-, multi-account-, Gateway-retour- en zelfverificatieopdrachten via het harnas. |

Profiellidmaatschap en kanaalvereisten staan bij de declaratieve
Matrix-scenario's onder `qa/scenarios/channels/`. De uitvoering kiest het
kanaalstuurprogramma. Hun live-implementaties staan onder
`extensions/qa-lab/src/live-transports/matrix/scenarios/`.

De adapter maakt in Docker een wegwerpbare Tuwunel-homeserver beschikbaar
(standaardimage `ghcr.io/matrix-construct/tuwunel:v1.5.1`, servernaam `matrix-qa.test`,
poort `28008`), registreert tijdelijke gebruikers voor het
stuurprogramma, het te testen systeem en de waarnemer, initialiseert de
vereiste rooms en legt de geredigeerde aanvraag-/antwoordgrens vast. Daarna
voert de adapter de echte Matrix-Plugin uit binnen een onderliggende
QA-Gateway die tot dat transport is beperkt (geen `qa-channel`) en
breekt de omgeving af.

Veelgebruikte opties:

| Vlag                     | Standaard         | Doel                                                                                 |
| ------------------------ | ----------------- | ------------------------------------------------------------------------------------ |
| `--profile <profile>`    | `all`             | Selecteer een van de bovenstaande profielen.                                         |
| `--scenario <id>`        | -                 | Selecteer één scenario; herhaalbaar.                                                 |
| `--fail-fast`            | uit               | Stop na de eerste mislukte controle of het eerste mislukte scenario.                 |
| `--allow-failures`       | uit               | Schrijf artefacten zonder bij scenariofouten een foutafsluitcode te retourneren.     |
| `--provider-mode <mode>` | `live-frontier`   | Gebruik `mock-openai` voor deterministische verzending of `live-frontier` voor een live-provider. |
| `--model <ref>`          | providerstandaard | Stel de primaire `provider/model`-referentie in.                                   |
| `--alt-model <ref>`      | providerstandaard | Stel het alternatieve model in dat wordt gebruikt door scenario's die van model wisselen. |
| `--fast`                 | uit               | Schakel de snelle providermodus in waar deze wordt ondersteund.                      |
| `--output-dir <path>`    | gegenereerd       | Kies de rapportmap; relatieve paden worden ten opzichte van `--repo-root` opgelost. |
| `--repo-root <path>`     | huidige map      | Voer uit vanuit een neutrale werkmap.                                                |
| `--sut-account <id>`     | `sut`             | Selecteer het Matrix-account-ID in de configuratie van de onderliggende Gateway.     |

Matrix-QA leaset geen gedeelde Matrix-referenties: de adapter maakt lokaal
wegwerpgebruikers aan en accepteert daarom geen `--credential-source` of
`--credential-role`. Overschrijf het homeserverimage met
`OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`; stem negatieve controles op het uitblijven van een
antwoord af met `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (standaard `8000`, begrensd
op de time-out van het actieve scenario). De eenmalige opdracht dwingt
normaal gesproken een schone afsluiting af nadat de artefacten zijn
weggeschreven, omdat native handles van Matrix-cryptografie na de opschoning
kunnen blijven bestaan; stel `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` alleen in voor een direct
testharnas waarbij de opdracht in plaats daarvan moet terugkeren.

Elke uitvoering schrijft de normale QA Lab-artefacten onder de geselecteerde
uitvoermap: `qa-suite-report.md`, `qa-suite-summary.json`, `qa-evidence.json`
en een geredigeerd `matrix-harness-*/matrix-qa-harness.json`-manifest. Voer bij een mislukte
opschoning de weergegeven `docker compose ... down --remove-orphans`-herstelopdracht uit. Vergroot
op langzame runners het venster voor het uitblijven van een antwoord; op
snelle CI kan een kleiner venster negatieve controles verkorten.

De scenario's omvatten transportgedrag dat unit-tests niet end-to-end kunnen
aantonen: beperking op basis van vermeldingen, beleid voor toegestane bots,
toelatingslijsten, antwoorden op hoofdniveau en in threads, DM-routering,
afhandeling van reacties, onderdrukking van inkomende bewerkingen,
deduplicatie bij herhaling na herstart, herstel na een homeserveronderbreking,
levering van goedkeuringsmetadata, media-afhandeling en bootstrap-, herstel-
en verificatiestromen voor Matrix-E2EE. Het E2EE-CLI-profiel stuurt ook
`openclaw matrix encryption setup` en verificatieopdrachten door dezelfde wegwerpbare
homeserver voordat Gateway-antwoorden worden gecontroleerd.

`matrix-room-block-streaming` en `subagent-thread-spawn` blijven beschikbaar via expliciete
selectie met `--scenario`, maar blijven buiten het standaardprofiel
`all`.

CI gebruikt hetzelfde opdrachtoppervlak in
`.github/workflows/qa-live-transports-convex.yml`. Geplande uitvoeringen en release-uitvoeringen voeren de
releasescenario's uit. Handmatige `matrix_profile=all`-dispatches waaieren uit
over de profielen `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` en `e2ee-cli`; gerichte dispatches selecteren
`fast`, `release` of `transport` in één taak.

### Discord Mantis-scenario's

Discord heeft ook optionele scenario's die uitsluitend voor Mantis bedoeld
zijn om bugs te reproduceren. Gebruik `--scenario discord-status-reactions-tool-only` voor de expliciete
tijdlijn van statusreacties, of `--scenario discord-thread-reply-filepath-attachment` om een echte
Discord-thread te maken en te verifiëren dat `message.thread-reply` een
`filePath`-bijlage behoudt. Deze scenario's blijven buiten de
standaard live Discord-lane, omdat het voor-/nareproductieprobes zijn en geen
brede smokedekking. De Mantis-workflow voor threadbijlagen kan ook een video
van een aangemelde Discord Web-waarnemer toevoegen wanneer
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` of `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` in de QA-omgeving is
geconfigureerd. Dat kijkersprofiel is uitsluitend bedoeld voor visuele
opname; de beslissing over slagen of mislukken komt nog steeds van de
Discord REST-orakel.

Voor de andere smokelanes met echt transport:

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

Ze zijn gericht op een bestaand echt kanaal met twee bots of accounts
(stuurprogramma + te testen systeem). Vereiste omgevingsvariabelen,
scenariolijsten, uitvoerartefacten en de Convex-referentiepool voor die vier
transporten worden hieronder beschreven in de
[QA-referentie voor Discord, Slack, Telegram en WhatsApp](#discord-slack-telegram-and-whatsapp-qa-reference).

### Mantis-runners voor Slack-desktop en visuele taken

Voer voor een volledige Slack-desktop-VM-uitvoering met VNC-herstel het
volgende uit:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Die opdracht least een Crabbox-desktop-/browsermachine, voert de live
Slack-lane uit in de VM, opent Slack Web in de VNC-browser, legt de desktop vast
en kopieert `slack-qa/`, `slack-desktop-smoke.png` en
`slack-desktop-smoke.mp4` (wanneer video-opname beschikbaar is) terug naar de
Mantis-artifactmap. Crabbox-desktop-/browserleases leveren de opnamehulpmiddelen
en hulppakketten voor browser-/native builds vooraf, zodat het scenario alleen
fallbacks op oudere leases hoeft te installeren. Mantis rapporteert totale
timings en timings per fase in `mantis-slack-desktop-smoke-report.md`, zodat bij trage uitvoeringen
zichtbaar is of de tijd is besteed aan het opwarmen van de lease, het verkrijgen
van inloggegevens, externe installatie of het kopiëren van artifacts. Hergebruik
`--lease-id <cbx_...>` nadat je via VNC handmatig bij Slack Web bent ingelogd;
hergebruikte leases houden ook de pnpm-storecache van Crabbox warm. De
standaardwaarde `--hydrate-mode source` verifieert vanuit een broncheckout en voert
installatie/build uit in de VM. Gebruik `--hydrate-mode prehydrated` alleen wanneer
de hergebruikte externe werkruimte al `node_modules` en een gebouwde `dist/`
bevat; die modus slaat de kostbare installatie-/buildstap over en stopt veilig
met een fout wanneer de werkruimte niet gereed is. Met `--gateway-setup` laat
Mantis een permanente OpenClaw Slack-gateway in de VM draaien op poort
`38973`; zonder deze optie voert de opdracht de normale bot-naar-bot
Slack-QA-lane uit en sluit deze af nadat de artifacts zijn vastgelegd.

Voer de Mantis-modus met goedkeuringscontrolepunten uit om de native
Slack-goedkeuringsinterface met desktopbewijs aan te tonen:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Deze modus sluit `--gateway-setup` wederzijds uit. De modus voert de
Slack-goedkeuringsscenario's uit, weigert scenario-id's die niet over
goedkeuring gaan, wacht bij elke wachtende en opgeloste goedkeuringsstatus,
rendert het waargenomen Slack API-bericht naar `approval-checkpoints/<scenario>-pending.png` en
`approval-checkpoints/<scenario>-resolved.png` en mislukt vervolgens als een controlepunt,
berichtbewijs, bevestiging of gerenderde schermafbeelding ontbreekt of leeg is.
Koude CI-leases kunnen nog steeds de Slack-aanmelding tonen in
`slack-desktop-smoke.png`; de afbeeldingen van de goedkeuringscontrolepunten vormen
het visuele bewijs voor deze lane.

De standaarduitvoering met controlepunten behoudt de twee standaardscenario's
voor Slack-goedkeuring. Selecteer een optionele Codex-goedkeuringsroute
expliciet met `--scenario slack-codex-approval-exec-native` of `--scenario slack-codex-approval-plugin-native` om deze vast te leggen;
Mantis accepteert beide en produceert hetzelfde paar schermafbeeldingen voor
de wachtende en opgeloste toestand. De runner verlengt de deadlines voor
controlepunten en externe opdrachten voor elke geselecteerde Codex-route,
zodat de volledige reeks van goedkeuring, voltooiing door de agent en de
opgeloste update kan worden afgerond.

De checklist voor operators, de dispatchopdracht voor de GitHub-workflow, het
contract voor bewijscommentaren, de beslissingstabel voor de hydratatiemodus,
de interpretatie van timings en de stappen voor foutafhandeling staan in
[Mantis-runbook voor Slack Desktop](/nl/concepts/mantis-slack-desktop-runbook).

Voer voor een desktoptaak in agent-/CV-stijl het volgende uit:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.6-luna
```

`visual-task` least of hergebruikt een Crabbox-desktop-/browsermachine,
start `crabbox record --while`, bestuurt de zichtbare browser via een geneste
`visual-driver`, legt `visual-task.png` vast, voert `openclaw infer image
describe` uit
op de schermafbeelding wanneer `--vision-mode image-describe` is geselecteerd en schrijft
`visual-task.mp4`, `mantis-visual-task-summary.json`, `mantis-visual-task-driver-result.json` en
`mantis-visual-task-report.md`. Wanneer `--expect-text` is ingesteld, vraagt de
vision-prompt om een gestructureerd JSON-oordeel (`visible`,
`evidence`, `reason`) en slaagt deze alleen wanneer het model
`visible: true` rapporteert met bewijs dat de verwachte tekst aanhaalt; een
`visible: false`-antwoord dat alleen de doeltekst citeert, voldoet nog steeds
niet aan de assertie. Gebruik `--vision-mode metadata` voor een smoke-test zonder
model die de desktop, browser, schermafbeelding en videokoppelingen aantoont
zonder een provider voor beeldbegrip aan te roepen. Een opname is een verplicht
artifact voor `visual-task`; als Crabbox geen niet-lege
`visual-task.mp4` opneemt, mislukt de taak, zelfs wanneer de visuele driver is
geslaagd. Bij een fout behoudt Mantis de lease voor VNC, tenzij de taak al was
geslaagd en `--keep-lease` niet was ingesteld.

### Statuscontrole van de pool met inloggegevens

Voer vóór het gebruik van gepoolde live-inloggegevens het volgende uit:

```bash
pnpm openclaw qa credentials doctor
```

De doctor controleert de omgevingsvariabelen van de Convex-broker
(`OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`), valideert endpointinstellingen,
rapporteert voor `OPENCLAW_QA_CONVEX_SECRET_CI` en `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` alleen de status
ingesteld/ontbrekend en verifieert de bereikbaarheid van beheer/lijst wanneer
het maintainergeheim aanwezig is.

## Canonieke scenariodekking

Het hoofdonderdeel `taxonomy.yaml` definieert semantische dekkings-id's.
Scenario-YAML-bestanden onder `qa/scenarios/` wijzen elk scenario aan die
id's toe en beheren uitvoeringsmetadata: `channel` is de enige
kanaalvereiste en `profiles` declareert benoemd uitvoeringslidmaatschap.
De kanaaldriver is een verwisselbare implementatiekeuze op uitvoeringsniveau.
TypeScript-runners raadplegen die catalogus; ze onderhouden geen parallelle
inventarissen van scenario's of dekking.

Statische uitvoer van `qa coverage` rapporteert de koppeling van taxonomie
aan scenario's. Het daadwerkelijke bewijs komt uit `qa-evidence.json`, waarin
het uitgevoerde scenario, de dekkings-id's, het kanaal, de daadwerkelijk
gebruikte driver en het resultaat worden vastgelegd. Kanaal en driver zijn
rapportagedimensies, geen aanvullende woordenlijsten voor dekkings-id's of
geschiktheidsassen voor scenario's.

Voer voor een tijdelijke Linux-VM-lane zonder Docker in het QA-pad op te nemen
het volgende uit:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dit start een nieuwe Multipass-guest, installeert afhankelijkheden, bouwt
OpenClaw in de guest, voert `qa suite` uit en kopieert vervolgens het
normale QA-rapport en de samenvatting terug naar `.artifacts/qa-e2e/...` op de host.
Het gebruikt hetzelfde scenarioselectiegedrag als `qa suite` op de host.

Host- en Multipass-suite-uitvoeringen voeren standaard meerdere geselecteerde
scenario's parallel uit met geïsoleerde Gateway-workers. `qa-channel`
heeft standaard gelijktijdigheid 4, begrensd door het aantal geselecteerde
scenario's. Gebruik `--concurrency
<count>` om het aantal workers af te stemmen, of
`--concurrency 1` voor seriële uitvoering. Gebruik `--pack personal-agent` om het
benchmarkpakket voor persoonlijke assistenten (10 scenario's) uit te voeren.
De pakketselector is additief met herhaalde `--scenario`-vlaggen:
expliciete scenario's worden eerst uitgevoerd, gevolgd door pakketscenario's in
pakketvolgorde, waarbij duplicaten worden verwijderd. Gebruik
`--pack observability` om de scenario's `otel-trace-smoke` en
`docker-prometheus-smoke` samen te selecteren wanneer een aangepaste QA-runner de
installatie van de OpenTelemetry-collector al levert.

De opdracht sluit af met een niet-nulstatus wanneer een scenario mislukt.
Gebruik `--allow-failures` wanneer je artifacts wilt zonder een foutgevende
afsluitcode.

Live-uitvoeringen sturen de ondersteunde QA-authenticatie-invoer door die
praktisch is voor de guest: providerkeys uit omgevingsvariabelen, het pad naar
de configuratie van de live QA-provider en `CODEX_HOME` wanneer aanwezig.
Bewaar `--output-dir` onder de hoofdmap van de repo, zodat de guest via de
gekoppelde werkruimte kan terugschrijven.

## QA-referentie voor Discord, Slack, Telegram en WhatsApp

De Matrix-adapter gebruikt de hierboven beschreven tijdelijke
Docker-ondersteunde lane. Discord, Slack, Telegram en WhatsApp werken met
vooraf bestaande echte transports, dus hun referentie staat hier.

### Gedeelde CLI-vlaggen

Deze lanes registreren zich via
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` en
accepteren dezelfde vlaggen:

| Vlag                                  | Standaardwaarde                                    | Beschrijving                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | Voer alleen dit scenario uit. Herhaalbaar.                                                                                                      |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Waar rapporten, samenvattingen, bewijs, transportspecifieke artifacts en het uitvoerlogboek worden geschreven. Relatieve paden worden opgelost ten opzichte van `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                    | Hoofdmap van de repository bij aanroep vanuit een neutrale huidige werkmap.                                                                     |
| `--sut-account <id>`                  | `sut`                                              | Tijdelijke account-id in de QA-Gateway-configuratie.                                                                                            |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai`, `aimock` of `live-frontier`.                                                                                                   |
| `--model <ref>` / `--alt-model <ref>` | standaardwaarde van provider                       | Primaire/alternatieve modelreferenties.                                                                                                         |
| `--fast`                              | uit                                                | Snelle providermodus waar ondersteund.                                                                                                          |
| `--credential-source <env\|convex>`   | `env`                                              | Zie [Pool met Convex-inloggegevens](#convex-credential-pool).                                                                                    |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, anders `maintainer`                 | Rol die wordt gebruikt wanneer `--credential-source convex`.                                                                                              |
| `--allow-failures`                    | uit                                                | Schrijf artifacts zonder een foutgevende afsluitcode te retourneren wanneer scenario's mislukken.                                               |

Elke lane sluit af met een niet-nulstatus wanneer een scenario mislukt.
`--allow-failures` schrijft artifacts zonder een foutgevende afsluitcode in te
stellen. Telegram accepteert ook `--list-scenarios` om beschikbare scenario-id's
af te drukken en af te sluiten; de andere lanes bieden die vlag niet aan.

### Telegram-QA

```bash
pnpm openclaw qa telegram
```

Richt zich op één echte privé-Telegram-groep met twee verschillende bots
(driver + SUT). De SUT-bot moet een Telegram-gebruikersnaam hebben;
bot-naar-botwaarneming werkt het beste wanneer voor beide bots
**Bot-to-Bot Communication Mode** is ingeschakeld in `@BotFather`.

Vereiste omgevingsvariabelen wanneer `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - numerieke chat-id (tekenreeks).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Het profiel `release` selecteert de onderhouden YAML-scenario's voor
Telegram; `all` voegt optionele stresscontroles voor sessies,
gebruik, antwoordketens en streaming toe. Expliciete waarden voor
`--scenario` overschrijven het profiel.

- `channel-canary`
- `channel-mention-gating`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-tool-only-usage-footer`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Het profiel `release` omvat altijd canary, mention-gating, antwoorden op native opdrachten, opdrachtadressering en groepsantwoorden van bot naar bot. `mock-openai`
omvat ook de deterministische controle van de lange definitieve preview.
`telegram-current-session-status-tool` en
`telegram-tool-only-usage-footer` blijven opt-in: de eerste is alleen stabiel
wanneer deze direct na canary in een thread wordt uitgevoerd, en de tweede is een bewijs met echte Telegram
van de voettekst `/usage` bij antwoorden die uitsluitend uit tools bestaan. Gebruik `pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai` om de huidige
verdeling tussen standaard en optioneel met regressiereferenties af te drukken. Gebruik `--profile all` voor elk
scenario met de live Telegram-adapter.

Uitvoerartefacten:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - bewijsvermeldingen voor de controles van het live transport,
  inclusief velden voor profiel, dekking, provider, kanaal, artefacten, resultaat en RTT.

Telegram-uitvoeringen van het pakket gebruiken hetzelfde contract voor Telegram-aanmeldgegevens. Herhaalde RTT-
meting maakt deel uit van de normale live Telegram-lane van het pakket; de RTT-
verdeling wordt voor de geselecteerde RTT-controle onder `result.timing` opgenomen in `qa-evidence.json`.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Wanneer `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` is ingesteld, leaset de live-wrapper van het pakket
een `kind: "telegram"`-aanmeldgegeven, exporteert deze de geleasete omgevingsvariabelen voor groep/driver/SUT-
bot naar de uitvoering van het geïnstalleerde pakket, verstuurt deze Heartbeats voor de lease en geeft deze de lease vrij
bij het afsluiten. De pakketwrapper gebruikt standaard 20 RTT-controles van
`channel-canary`, een RTT-time-out van 30s en buiten CI de Convex-rol
`maintainer` wanneer Convex is geselecteerd. Overschrijf
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
of `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` om RTT-metingen af te stemmen zonder
een afzonderlijke RTT-opdracht of Telegram-specifieke samenvattingsindeling te maken.

### Discord-QA

```bash
pnpm openclaw qa discord
```

Richt zich op één echt privé-Discord-guildkanaal met twee bots: een driverbot
die door het harnas wordt aangestuurd en een SUT-bot die door de onderliggende OpenClaw Gateway
via de gebundelde Discord-plugin wordt gestart. Verifieert de verwerking van kanaalvermeldingen, dat
de SUT-bot de native opdracht `/help` bij Discord heeft geregistreerd, en
opt-in Mantis-bewijsscenario's.

Vereiste omgevingsvariabelen wanneer `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - moet overeenkomen met de gebruikers-id van de SUT-bot
  die door Discord wordt geretourneerd (anders mislukt de lane onmiddellijk).

Optioneel:

- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` selecteert het spraak-/podiumkanaal voor
  `discord-voice-autojoin`; zonder deze variabele kiest het scenario het eerste zichtbare
  spraak-/podiumkanaal voor de SUT-bot.

Discord-YAML-modulescenario's (`qa/scenarios/channels/discord-*.yaml`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - opt-in spraakscenario. Wordt afzonderlijk uitgevoerd, schakelt
  `channels.discord.voice.autoJoin` in en verifieert dat de huidige
  Discord-spraakstatus van de SUT-bot het beoogde spraak-/podiumkanaal is. Convex-aanmeldgegevens voor Discord
  kunnen optioneel `voiceChannelId` bevatten; anders ontdekt de runner-
  adapter het eerste zichtbare spraak-/podiumkanaal in de guild.
- `discord-status-reactions-tool-only` - opt-in Mantis-scenario. Wordt
  afzonderlijk uitgevoerd omdat het de SUT overschakelt naar altijd ingeschakelde guildantwoorden die uitsluitend uit tools bestaan
  met `messages.statusReactions.enabled=true`, en vervolgens een REST-
  reactietijdlijn plus visuele HTML-/PNG-artefacten vastlegt. Mantis-rapporten van vóór/na
  behouden ook door het scenario aangeleverde MP4-artefacten als `baseline.mp4`
  en `candidate.mp4`.
- `discord-thread-reply-filepath-attachment` - opt-in Mantis-scenario; zie
  [Discord Mantis-scenario's](#discord-mantis-scenarios).

Voer het Discord-scenario voor automatisch deelnemen aan spraak expliciet uit:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Voer het Mantis-scenario voor statusreacties expliciet uit:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.6-luna \
  --alt-model openai/gpt-5.6-luna \
  --fast
```

Uitvoerartefacten:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - bewijsvermeldingen voor de controles van het live transport.
- `discord-qa-reaction-timelines.json` en
  `discord-status-reactions-tool-only-timeline.png` wanneer het scenario voor statusreacties
  wordt uitgevoerd.

### Slack-QA

```bash
pnpm openclaw qa slack
```

Richt zich op één echt privé-Slack-kanaal met twee verschillende bots: een driverbot
die door het harnas wordt aangestuurd en een SUT-bot die door de onderliggende OpenClaw Gateway
via de gebundelde Slack-plugin wordt gestart.

Vereiste omgevingsvariabelen wanneer `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Optioneel:

- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` schakelt visuele goedkeurings-
  controlepunten voor Mantis in. De adapter schrijft `<scenario>.pending.json` en
  `<scenario>.resolved.json` en wacht vervolgens op overeenkomende `.ack.json`-bestanden.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` overschrijft de time-out voor de bevestiging
  van controlepunten. De standaardwaarde is `120000`.

Canonieke YAML-scenario's die via de live Slack-adapter beschikbaar zijn:

- `thread-follow-up`
- `thread-isolation`

Slack-YAML-modulescenario's (`qa/scenarios/channels/slack-*.yaml`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-channel-disabled-warning` - opt-in controle met echte Slack die bevestigt dat een
  geconfigureerd uitgeschakeld kanaal een gestructureerde waarschuwing afgeeft zonder te antwoorden.
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-progress-commentary-true`, `slack-progress-commentary-false`,
  `slack-progress-commentary-omitted` en
  `slack-progress-commentary-verbose-dedupe` - opt-in controles met echte Slack voor
  onafhankelijke besturing van commentaar/toolvoortgang, de verouderde
  standaardwaarde bij een weggelaten sleutel en eenmalige aflevering wanneer duurzame uitgebreide voortgang is ingeschakeld.
- `slack-reaction-glyph-native` - opt-in live reactiescenario voor de berichtentool.
  Instrueert de agent om exact het teken `✅` door te geven en bevestigt dat Slack
  `white_check_mark` voor de SUT-bot bij het doelbericht heeft opgeslagen.
- `slack-chart-presentation-native` - opt-in overdraagbaar grafiekscenario dat
  het native blok `data_visualization` en de exacte toegankelijke tekst verifieert.
- `slack-table-presentation-native` - opt-in overdraagbaar tabelscenario dat
  het native blok `data_table`, de exacte rijen en de toegankelijke tekst verifieert.
- `slack-table-invalid-blocks-fallback` - opt-in direct-transportscenario
  dat een structureel leesbare onbewerkte tabel boven de limiet met 101 gegevensrijen
  plus de koptekst via het
  productiepad voor Slack-verzending verstuurt, bewijst dat Slack zelf `invalid_blocks` retourneert
  en verifieert dat de opgeslagen terugval met uitgeschakelde opmaak volledig is en geen
  native gegevensblok bevat. Scenariodetails behouden alleen veilig bewijs van foutcodes, aantallen en
  booleaanse waarden.
- `slack-approval-exec-native` - opt-in scenario voor native Slack-uitvoeringsgoedkeuring.
  Vraagt via de Gateway om goedkeuring voor een uitvoering, verifieert dat het Slack-bericht
  native goedkeuringsknoppen bevat, handelt de goedkeuring af en verifieert de bijgewerkte Slack-
  status na afhandeling.
- `slack-approval-plugin-native` - opt-in scenario voor native Slack-plugin-goedkeuring.
  Schakelt het doorsturen van uitvoerings- en plugin-goedkeuringen samen in, zodat plugin-
  gebeurtenissen niet worden onderdrukt door de routering van uitvoeringsgoedkeuringen, en verifieert vervolgens hetzelfde
  native Slack-UI-pad voor in behandeling/afgehandeld.
- `slack-codex-approval-exec-native` - opt-in scenario voor Codex Guardian-opdrachtgoedkeuring.
  Schakelt de Codex-plugin in Guardian-modus in, routeert een
  vanuit Slack afkomstige Gateway-agentbeurt via het Codex-app-serverharnas,
  wacht op de native Slack-prompt voor plugin-goedkeuring voor
  `openclaw-codex-app-server`, handelt deze af en verifieert dat de Codex-beurt
  eindigt met de verwachte markeringen voor opdrachtuitvoer en assistent.
- `slack-codex-approval-plugin-native` - opt-in scenario voor Codex Guardian-bestandsgoedkeuring.
  Gebruikt een instructie `apply_patch` buiten de werkruimte, zodat Codex
  de app-serverroute voor goedkeuring van bestandswijzigingen activeert, en verifieert vervolgens hetzelfde native
  Slack-goedkeuringspad voor in behandeling/afgehandeld, de definitieve assistentmarkering en de exacte bestands-
  inhoud vóór het opschonen.

De Codex-goedkeuringsscenario's vereisen een `openai/*` of `codex/*` `--model`, de
normale live modelaanmeldgegevens en Codex-authenticatie of API-sleutelauthenticatie die door de Codex-plugin wordt geaccepteerd.
De scenariodetails bevatten naast de geredigeerde Slack-goedkeuringsmetadata
de Codex-app-servermethode, de geselecteerde Codex-modelsleutel, de definitieve Codex-beurtstatus
en verificatie van de bewerkingsmarkering.

Uitvoerartefacten:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - bewijsvermeldingen voor de controles van het live transport.
- `approval-checkpoints/` - alleen wanneer Mantis
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` instelt; bevat JSON voor controlepunten,
  bevestigings-JSON en schermafbeeldingen van in behandeling/afgehandeld.

#### De Slack-werkruimte instellen

De lane vereist twee verschillende Slack-apps in één werkruimte, plus een kanaal waarvan beide
bots lid zijn:

- `channelId` - de `Cxxxxxxxxxx`-id van een kanaal waarvoor beide bots zijn
  uitgenodigd. Gebruik een speciaal kanaal; de lane plaatst bij elke uitvoering berichten.
- `driverBotToken` - bottoken (`xoxb-...`) van de **Driver**-app.
- `sutBotToken` - bottoken (`xoxb-...`) van de **SUT**-app, die een
  andere Slack-app dan de driver moet zijn, zodat de gebruikers-id van de bot verschillend is.
- `sutAppToken` - token op appniveau (`xapp-...`) van de SUT-app met
  `connections:write`, gebruikt door Socket Mode zodat de SUT-app gebeurtenissen kan ontvangen.

Gebruik bij voorkeur een Slack-werkruimte die speciaal voor QA is bestemd in plaats van een productie-
werkruimte opnieuw te gebruiken.

Het onderstaande SUT-manifest beperkt opzettelijk de productie-installatie van de gebundelde Slack-plugin
(`extensions/slack/src/setup-shared.ts:12`) tot de
machtigingen en gebeurtenissen die door de live Slack-QA-suite worden gedekt. Voor de
configuratie van het productiekanaal zoals gebruikers die zien, zie
[Snelle configuratie van het Slack-kanaal](/nl/channels/slack#quick-setup); het QA Driver/SUT-
paar is opzettelijk gescheiden omdat de lane twee verschillende botgebruikers-
id's in één werkruimte vereist.

**1. De Driver-app maken**

Ga naar [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ →
_From a manifest_ → kies de QA-werkruimte, plak het volgende manifest
en kies vervolgens _Install to Workspace_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Testdriverbot voor de live OpenClaw QA Slack-lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

Kopieer de _Bot User OAuth Token_ (`xoxb-...`) - dit wordt
`driverBotToken`. De driver hoeft alleen berichten te plaatsen en
zichzelf te identificeren; geen gebeurtenissen, geen Socket Mode.

**2. De SUT-app maken**

Herhaal _Create New App → From a manifest_ in dezelfde werkruimte. Deze QA-app
gebruikt opzettelijk een beperktere versie van het productie-
manifest van de gebundelde Slack-plugin (`extensions/slack/src/setup-shared.ts:12`): bereiken en gebeurtenissen voor reacties
zijn weggelaten omdat de live Slack-QA-suite de verwerking van reacties
nog niet dekt.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

Nadat Slack de app heeft aangemaakt, doe je twee dingen op de instellingenpagina:

- _Install to Workspace_ → kopieer de _Bot User OAuth Token_ → dat wordt
  `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → voeg
  scope `connections:write` toe → sla op → kopieer de waarde `xapp-...` → dat
  wordt `sutAppToken`.

Controleer of de twee bots verschillende gebruikers-id's hebben door voor elk
token `auth.test` aan te roepen. De runtime onderscheidt de driver en SUT aan de hand van het gebruikers-id; als je één app
voor beide hergebruikt, mislukt de vermeldingsfiltering onmiddellijk.

**3. Maak het kanaal**

Maak in de QA-werkruimte een kanaal (bijvoorbeeld `#openclaw-qa`) en nodig beide
bots vanuit het kanaal uit:

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Kopieer het id `Cxxxxxxxxxx` uit _channel info → About → Channel ID_ — dat
wordt `channelId`. Een openbaar kanaal werkt; als je een privékanaal gebruikt,
hebben beide apps al `groups:history`, zodat het lezen van de geschiedenis door de harness
nog steeds slaagt.

**4. Registreer de inloggegevens**

Er zijn twee opties. Gebruik omgevingsvariabelen voor foutopsporing op één machine (stel de vier
`OPENCLAW_QA_SLACK_*`-variabelen in en geef `--credential-source env` door), of vul
de gedeelde Convex-pool, zodat CI en andere beheerders ze kunnen leasen.

Schrijf voor de Convex-pool de vier velden naar een JSON-bestand:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Exporteer `OPENCLAW_QA_CONVEX_SITE_URL` en `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
in je shell en registreer en controleer vervolgens:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Verwacht `count: 1`, `status: "active"` en geen veld `lease`.

**5. Controleer end-to-end**

Voer de lane lokaal uit om te bevestigen dat beide bots via de
broker met elkaar kunnen communiceren:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Een geslaagde uitvoering is ruim binnen 30 seconden voltooid en `qa-suite-report.md`
toont zowel `slack-canary` als `slack-mention-gating` met status `pass`. Als de
lane ongeveer 90 seconden blijft hangen en afsluit met `Convex credential pool exhausted
for kind "slack"`, is de pool leeg of is elke rij geleaset — `qa
credentials list --kind slack --status all --json` geeft aan wat het geval is.

### WhatsApp-QA

```bash
pnpm openclaw qa whatsapp
```

Richt zich op twee speciale WhatsApp Web-accounts: een driveraccount dat wordt bestuurd door
de harness en een SUT-account dat door de onderliggende OpenClaw Gateway wordt gestart via
de gebundelde WhatsApp-Plugin.

Vereiste omgevingsvariabelen wanneer `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Optioneel:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` schakelt groepsscenario's in, zoals
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-broadcast-group-fanout`, `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`, scenario's voor groepsacties, media en peilingen,
  en `whatsapp-group-allowlist-block`.

WhatsApp-YAML-scenario's (`qa/scenarios/channels/whatsapp-*.yaml`):

- Basisgedrag en groepsfiltering: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-group-activation-always`, `whatsapp-group-reply-to-bot-triggers`,
  `whatsapp-top-level-reply-shape`, `whatsapp-restart-resume`,
  `whatsapp-group-allowlist-block`.
- Native opdrachten: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Gedrag voor antwoorden en uiteindelijke uitvoer: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-to-mode-batched`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`, `whatsapp-stream-final-message-accounting`.
- Berichtacties via het gebruikerstraject: `whatsapp-agent-message-action-react` begint
  met een echt privébericht van de driver, laat het model de tool `message` aanroepen en
  observeert de native WhatsApp-reactie. `whatsapp-agent-message-action-upload-file`
  gebruikt dezelfde opzet voor `message(action=upload-file)` en observeert
  native WhatsApp-media. `whatsapp-group-agent-message-action-react` en
  `whatsapp-group-agent-message-action-upload-file` bewijzen dezelfde
  gebruikerszichtbare acties in een echte WhatsApp-groep.
- Groepsfan-out: `whatsapp-broadcast-group-fanout` begint met één WhatsApp-groepsbericht met een vermelding
  en controleert afzonderlijke zichtbare antwoorden van `main`
  en `qa-second`.
- Groepsactivering: `whatsapp-group-activation-always` wijzigt een echte groepssessie
  in `/activation always`, bewijst dat een groepsbericht zonder vermelding de
  agent activeert en herstelt vervolgens `/activation mention`.
  `whatsapp-group-reply-to-bot-triggers` maakt eerst een botantwoord aan, stuurt daarop een native
  geciteerd antwoord zonder expliciete vermelding en controleert of de agent
  vanuit die antwoordcontext wordt geactiveerd.
- Inkomende media en gestructureerde berichten: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  Deze sturen echte WhatsApp-gebeurtenissen voor afbeeldingen, audio, documenten, locaties, contacten,
  stickers en reacties via de driver.
- Directe Gateway-contractprobes: `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-outbound-send-serialization`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. Deze omzeilen doelbewust modelprompts
  en bewijzen deterministische Gateway-/kanaalcontracten voor `send`, `poll` en
  `message.action`.
- Dekking van toegangscontrole: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Native goedkeuringen: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Statusreacties: `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`.

De catalogus bevat momenteel 52 scenario's. De standaardlane `live-frontier`
blijft met 8 scenario's klein voor snelle smokedekking. De standaardlane `mock-openai`
voert 39 scenario's deterministisch uit via het echte WhatsApp-
transport en simuleert alleen de modeluitvoer; goedkeuringsscenario's en enkele
zwaardere of blokkerende controles blijven expliciet op scenario-id selecteerbaar.

De WhatsApp-QA-driver observeert gestructureerde livegebeurtenissen (`text`, `media`,
`location`, `reaction` en `poll`) en kan actief media, peilingen,
contacten, locaties en stickers verzenden. QA Lab importeert die driver via het
pakketoppervlak `@openclaw/whatsapp/api.js` in plaats van private
WhatsApp-runtimebestanden rechtstreeks te benaderen. Voor groepsobservaties is `fromJid` de groeps-JID,
terwijl `participantJid` en `fromPhoneE164` de verzendende deelnemer identificeren.
Berichtinhoud wordt standaard geredigeerd. Directe Gateway-probes voor peilingen, bestandsuploads,
media, groepspeilingen, groepsmedia en antwoordstructuren zijn controles van transport-/API-
contracten; ze gelden niet als bewijs dat een gebruikersprompt de
agent dezelfde actie liet kiezen. Bewijs voor acties via het gebruikerstraject komt uit scenario's
zoals `whatsapp-agent-message-action-react` en
`whatsapp-group-agent-message-action-react`, waarin de driver een normaal
WhatsApp-bericht verstuurt en QA Lab het resulterende native WhatsApp-artefact observeert.
De details van WhatsApp-scenario's vermelden de opzet van elk scenario (`user-path`,
`direct-gateway` of `native-approval`), zodat het bewijs niet kan worden aangezien voor een
sterker contract dan daadwerkelijk wordt bewezen.

Uitvoerartefacten:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` — bewijsitems voor de controles van het live transport.

### Convex-pool voor inloggegevens

De lanes voor Discord, Slack, Telegram en WhatsApp kunnen inloggegevens leasen uit een
gedeelde Convex-pool in plaats van de bovenstaande omgevingsvariabelen te lezen. Geef
`--credential-source convex` door (of stel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` in);
QA Lab verkrijgt een exclusieve lease, verstuurt gedurende de
uitvoering Heartbeats en geeft de lease vrij bij het afsluiten. Pooltypen zijn `"discord"`, `"slack"`,
`"telegram"` en `"whatsapp"`.

Payloadstructuren die de broker bij `admin/add` valideert:

- Discord (`kind: "discord"`): `{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string,
sutToken: string }` — `groupId` moet een numerieke chat-id-tekenreeks zijn.
- Echte Telegram-gebruiker (`kind: "telegram-user"`): `{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` —
  uitsluitend voor bewijs via Mantis Telegram Desktop. Algemene QA Lab-lanes mogen
  dit type niet verkrijgen.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` — telefoonnummers moeten verschillende E.164-tekenreeksen zijn.

De bewijsworkflow voor Mantis Telegram Desktop houdt één exclusieve Convex-
lease `telegram-user` vast voor zowel de TDLib-CLI-driver als de Telegram Desktop-
getuige en geeft deze vrij nadat het bewijs is gepubliceerd.

Wanneer een PR een deterministische visuele diff nodig heeft, kan Mantis hetzelfde gesimuleerde
modelantwoord gebruiken op `main` en op de PR-head terwijl de Telegram-formatter of
leveringslaag verandert. De standaardinstellingen voor opnamen zijn afgestemd op PR-opmerkingen: standaard
Crabbox-klasse, desktopopname met 24fps, bewegings-GIF met 24fps en een voorbeeldbreedte van
1920px. Opmerkingen met voor en na moeten een nette bundel publiceren die
alleen de bedoelde GIF's bevat.

Slack-lanes kunnen de pool ook gebruiken. Controles van Slack-payloadstructuren bevinden zich momenteel
in de Slack-QA-runner in plaats van in de broker; gebruik `{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }`, met een
Slack-kanaal-id zoals `Cxxxxxxxxxx`. Zie
[De Slack-werkruimte instellen](#setting-up-the-slack-workspace) voor het inrichten van apps
en scopes.

Operationele omgevingsvariabelen en het endpointcontract van de Convex-broker staan in
[Testen → Gedeelde Telegram-inloggegevens via Convex](/nl/help/testing#shared-telegram-credentials-via-convex-v1)
(de sectienaam stamt van vóór de pool voor meerdere kanalen; de leasesemantiek wordt
door alle typen gedeeld).

## Seeds uit de repository

Seed-assets bevinden zich in `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Deze staan bewust in git, zodat het QA-plan zichtbaar is voor zowel mensen als
de agent.

`qa-lab` blijft een algemene YAML-scenariorunner. Elk YAML-scenariobestand is de
bron van waarheid voor één testuitvoering en moet het volgende definiëren:

- `title` op het hoogste niveau
- `scenario`-metadata
- optionele metadata voor categorie, capaciteit, lane en risico in `scenario`
- documentatie- en codereferenties in `scenario`
- optionele Plugin-vereisten in `scenario`
- optionele patch voor de Gateway-configuratie in `scenario`
- uitvoerbare `flow` op het hoogste niveau voor stroomscenario's, of
  `scenario.execution.kind` / `scenario.execution.path` voor Vitest- en
  Playwright-scenario's

Het herbruikbare runtime-oppervlak waarop `flow` steunt, blijft generiek en
domeinoverschrijdend. YAML-scenario's kunnen bijvoorbeeld helpers aan de
transportzijde combineren met helpers aan de browserzijde die de ingebedde Control UI
via de Gateway-`browser.request`-naad aansturen, zonder een runner voor speciale gevallen toe te voegen.

Scenariobestanden moeten worden gegroepeerd op productfunctionaliteit en niet op map
in de bronstructuur. Houd scenario-ID's stabiel wanneer bestanden worden verplaatst; gebruik `docsRefs` en
`codeRefs` voor traceerbaarheid van de implementatie.

De basislijst moet breed genoeg blijven voor:

- DM- en kanaalchat
- threadgedrag
- levenscyclus van berichtacties
- cron-callbacks
- ophalen uit het geheugen
- wisselen van model
- overdracht aan subagent
- lezen van repo's en documentatie
- één kleine bouwtaak, zoals Lobster Invaders

## Mocklanes voor providers

`qa suite` heeft twee lokale mocklanes voor providers:

- `mock-openai` is de scenariobewuste OpenClaw-mock. Dit blijft de standaard
  deterministische mocklane voor QA op basis van de repo en pariteitsgates.
- `aimock` start een door AIMock ondersteunde providerserver voor experimentele
  dekking van protocollen, fixtures, opnemen/afspelen en chaos. Deze is aanvullend en
  vervangt de scenariodispatcher van `mock-openai` niet.

De implementatie van providerlanes bevindt zich onder `extensions/qa-lab/src/providers/`.
Elke provider beheert zijn standaardwaarden, het starten van de lokale server, de gateway-modelconfiguratie,
de behoeften voor het klaarzetten van authenticatieprofielen en de live/mock-capabiliteitsvlaggen. Gedeelde suite- en
gatewaycode routeert via het providerregister in plaats van te vertakken op
providernamen.

## Transportadapters

`qa-lab` beheert een generieke transportnaad voor YAML-QA-scenario's. `qa-channel` is
de synthetische standaard. `crabline` start lokale servers in de vorm van providers en
voert de normale kanaalplugins van OpenClaw daarop uit. `live` is gereserveerd voor
echte providerreferenties en externe kanalen.

Op architectuurniveau is de verdeling:

- `qa-lab` beheert generieke scenario-uitvoering, gelijktijdigheid van workers, het
  schrijven van artefacten en rapportage.
- De transportadapter beheert gatewayconfiguratie, gereedheid, observatie van inkomend en uitgaand
  verkeer, transportacties en genormaliseerde transportstatus.
- YAML-scenariobestanden onder `qa/scenarios/` definiëren de testrun; `qa-lab`
  biedt het herbruikbare runtime-oppervlak dat ze uitvoert.

### Een kanaal toevoegen

Voor het toevoegen van een kanaal aan het YAML-QA-systeem zijn de kanaalimplementatie
en een scenariopakket nodig dat het kanaalcontract test. Voeg voor smoke-CI-
dekking de bijpassende lokale Crabline-providerserver toe en stel deze beschikbaar
via het `crabline`-stuurprogramma.

Voeg geen nieuwe QA-commandoroot op hoofdniveau toe wanneer de gedeelde `qa-lab`-host
de flow kan beheren.

`qa-lab` beheert de gedeelde hostmechanismen:

- de `openclaw qa`-commandoroot
- opstarten en afsluiten van de suite
- gelijktijdigheid van workers
- schrijven van artefacten
- genereren van rapporten
- uitvoeren van scenario's
- compatibiliteitsaliassen voor oudere `qa-channel`-scenario's

Runnerplugins beheren het transportcontract:

- hoe `openclaw qa <runner>` onder de gedeelde `qa`-root wordt gekoppeld
- hoe de gateway voor dat transport wordt geconfigureerd
- hoe gereedheid wordt gecontroleerd
- hoe inkomende gebeurtenissen worden geïnjecteerd
- hoe uitgaande berichten worden geobserveerd
- hoe transcripties en genormaliseerde transportstatus beschikbaar worden gesteld
- hoe door transport ondersteunde acties worden uitgevoerd
- hoe transportspecifieke reset of opschoning wordt afgehandeld

De minimale acceptatiedrempel voor een nieuw kanaal:

1. Houd `qa-lab` als beheerder van de gedeelde `qa`-root.
2. Implementeer de transportrunner op de gedeelde `qa-lab`-hostnaad.
3. Houd transportspecifieke mechanismen binnen de runnerplugin of de
   kanaalharness.
4. Koppel de runner als `openclaw qa <runner>` in plaats van een
   concurrerend rootcommando te registreren. Runnerplugins moeten `qaRunners` declareren in
   `openclaw.plugin.json` en een overeenkomende `qaRunnerCliRegistrations`-
   array exporteren vanuit `runtime-api.ts`. Houd `runtime-api.ts` licht; luie CLI- en
   runneruitvoering moeten achter afzonderlijke entrypoints blijven. Een optionele
   `adapterFactory` stelt het transport beschikbaar aan gedeelde scenario's zonder
   de bestaande scenariocatalogus van het commando te wijzigen.
5. Schrijf YAML-scenario's of pas ze aan onder de thematische `qa/scenarios/`-
   mappen.
6. Gebruik de generieke scenariohelpers voor nieuwe scenario's.
7. Houd bestaande compatibiliteitsaliassen werkend, tenzij de repo een
   bewuste migratie uitvoert.

De beslisregel is strikt:

- Als gedrag één keer in `qa-lab` kan worden uitgedrukt, plaats je het in `qa-lab`.
- Als gedrag afhankelijk is van één kanaaltransport, houd je het in die runner-
  plugin of pluginharness.
- Als een scenario een nieuwe capaciteit nodig heeft die meerdere kanalen kunnen gebruiken,
  voeg je een generieke helper toe in plaats van een kanaalspecifieke vertakking in `suite.ts`.
- Als gedrag alleen betekenisvol is voor één transport, houd je het scenario
  transportspecifiek en maak je dat expliciet in het scenariocontract.

### Namen van scenariohelpers

Generieke helpers met voorkeur voor nieuwe scenario's:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Compatibiliteitsaliassen blijven beschikbaar voor bestaande scenario's -
`waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`,
`formatConversationTranscript`, `resetBus` - maar voor het schrijven van nieuwe scenario's
moeten de generieke namen worden gebruikt. De aliassen bestaan om een gelijktijdige
migratie van alles te voorkomen, niet als toekomstig model.

## Rapportage

`qa-lab` exporteert een Markdown-protocolrapport uit de geobserveerde bustijdlijn.
Het rapport moet antwoord geven op:

- Wat werkte
- Wat mislukte
- Wat geblokkeerd bleef
- Welke vervolgscenario's de moeite waard zijn om toe te voegen

Voer `pnpm openclaw qa coverage` uit voor de inventaris van beschikbare scenario's, wat nuttig is bij het inschatten van vervolgwerk
of het aansluiten van een nieuw transport (voeg `--json` toe
voor machineleesbare uitvoer). Voer `pnpm openclaw qa coverage --match <query>` uit wanneer je gericht bewijs kiest voor
aangepast gedrag of een aangepast bestandspad. Het
overeenkomstenrapport doorzoekt scenariometagegevens, documentatiereferenties, codereferenties, dekkings-ID's,
plugins en providervereisten, en toont vervolgens overeenkomende `qa suite
--scenario ...`-doelen.

Elke `qa suite`-run schrijft de artefacten `qa-evidence.json`,
`qa-suite-summary.json` en `qa-suite-report.md` op hoofdniveau voor de geselecteerde
scenarioset. Scenario's die `execution.kind: vitest` of
`execution.kind: playwright` declareren, voeren het bijpassende testpad uit en schrijven ook
logboeken per scenario. Scenario's die `execution.kind: script` declareren, voeren de
bewijsproducent op `execution.path` uit via `node --import tsx` (waarbij
`${outputDir}` en `${scenarioId}` worden uitgevouwen in `execution.args`); de
producent schrijft zijn eigen `qa-evidence.json`, waarvan de vermeldingen in
de suite-uitvoer worden geïmporteerd en waarvan de artefactpaden worden herleid ten opzichte van die
`qa-evidence.json` van de producent. Wanneer `qa suite` wordt bereikt via `qa run
--qa-profile`, bevat dezelfde `qa-evidence.json` ook de samenvatting van de
profielscorekaart voor de geselecteerde taxonomiecategorieën.

Behandel de dekkingsuitvoer als hulpmiddel voor ontdekking, niet als vervanging van een gate; het
geselecteerde scenario heeft nog steeds de juiste providermodus, live transport,
Multipass, Testbox of releaselane nodig voor het geteste gedrag. Zie
[Volwassenheidsscorekaart](/nl/maturity/scorecard) voor de context van de scorekaart.

Voer voor controles van karakter en stijl hetzelfde scenario uit met meerdere live
modelreferenties en schrijf een beoordeeld Markdown-rapport:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.6-luna,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.6-sol,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Het commando voert lokale onderliggende QA-gatewayprocessen uit, niet Docker. Scenario's voor
karakterevaluatie moeten de persona instellen via `SOUL.md` en vervolgens gewone
gebruikersbeurten uitvoeren, zoals chatten, werkruimtehulp en kleine bestandstaken. Het kandidaat-
model mag niet worden verteld dat het wordt geëvalueerd. Het commando bewaart
elk volledig transcript, registreert basisstatistieken van de run en vraagt de beoordelingsmodellen vervolgens in
snelle modus met `xhigh`-redenering, waar ondersteund, om de runs te rangschikken op
natuurlijkheid, sfeer en humor. Gebruik `--blind-judge-models` bij het vergelijken van
providers: de beoordelingsprompt krijgt nog steeds elk transcript en elke runstatus, maar
kandidaatreferenties worden vervangen door neutrale labels zoals `candidate-01`; het
rapport koppelt rangschikkingen na het parsen weer aan echte referenties.

Kandidaatruns gebruiken standaard `high`-denkwerk, met `medium` voor GPT-5.6 Luna en
`xhigh` voor oudere OpenAI-evaluatiereferenties die dit ondersteunen. Overschrijf een specifieke
kandidaat inline met `--model provider/model,thinking=<level>`; inline-
opties ondersteunen ook `fast`, `no-fast` en `fast=<bool>`. `--thinking
<level>` stelt nog steeds een globale terugvalwaarde in en de oudere vorm `--model-thinking
<provider/model=level>` blijft behouden voor compatibiliteit. OpenAI-kandidaat-
referenties gebruiken standaard de snelle modus, zodat prioriteitsverwerking wordt gebruikt waar de provider
dit ondersteunt. Geef `--fast` alleen door wanneer je de snelle modus voor
elk kandidaatmodel wilt afdwingen. De duur van kandidaat- en beoordelingsruns wordt voor benchmarkanalyse in het
rapport vastgelegd, maar beoordelingsprompts zeggen expliciet dat niet op
snelheid mag worden gerangschikt. Zowel kandidaat- als beoordelingsmodelruns gebruiken standaard gelijktijdigheid 16.
Verlaag `--concurrency` of `--judge-concurrency` wanneer providerlimieten of lokale
gatewaydruk een run te veel verstoren.

Wanneer geen kandidaat-`--model` wordt doorgegeven, gebruikt de karakterevaluatie standaard
`openai/gpt-5.6-luna`, `openai/gpt-5.2`, `openai/gpt-5`,
`anthropic/claude-opus-4-8`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` en `google/gemini-3.1-pro-preview`. Wanneer geen
`--judge-model` wordt doorgegeven, gebruiken de beoordelaars standaard
`openai/gpt-5.6-sol,thinking=xhigh,fast` en
`anthropic/claude-opus-4-8,thinking=high`.

## Gerelateerde documentatie

- [Volwassenheidsscorekaart](/nl/maturity/scorecard)
- [Benchmarkpakket voor persoonlijke agents](/nl/concepts/personal-agent-benchmark-pack)
- [QA-kanaal](/nl/channels/qa-channel)
- [Testen](/nl/help/testing)
- [Dashboard](/nl/web/dashboard)
