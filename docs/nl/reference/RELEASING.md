---
read_when:
    - Zoeken naar openbare releasekanaaldefinities
    - Releasevalidatie of pakketacceptatie uitvoeren
    - Op zoek naar versienaamgeving en cadans
summary: Releasebanen, operatorchecklist, validatievakken, versienaamgeving en cadans
title: Releasebeleid
x-i18n:
    generated_at: "2026-07-04T18:10:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00772c1a2ad62eb7138b1eda581786390835add0a96996114cac2fd77edb367
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw biedt momenteel drie gebruikersgerichte updatekanalen:

- stable: het bestaande gepromote releasekanaal, dat nog steeds via npm `latest`
  wordt opgelost totdat de aparte CLI-/kanaalmijlpaal landt
- beta: prerelease-tags die naar npm `beta` publiceren
- dev: de bewegende kop van `main`

Afzonderlijk kunnen release-operators het kernpakket van de afgelopen voltooide
maand naar npm `extended-stable` publiceren, beginnend bij patch `33`. De reguliere
final-lijn van de huidige maand blijft op npm `latest`; deze publicatiesplitsing
aan de operatorzijde wijzigt op zichzelf de oplossing van CLI-updatekanalen niet.

## Versienaamgeving

- Maandelijkse npm extended-stable-releaseversie: `YYYY.M.PATCH`, met `PATCH >= 33`
  - Git-tag: `vYYYY.M.PATCH`
- Dagelijkse/reguliere final-releaseversie: `YYYY.M.PATCH`, met `PATCH < 33`
  - Git-tag: `vYYYY.M.PATCH`
- Reguliere fallback-correctiereleaseversie: `YYYY.M.PATCH-N`
  - Git-tag: `vYYYY.M.PATCH-N`
- Beta-prereleaseversie: `YYYY.M.PATCH-beta.N`
  - Git-tag: `vYYYY.M.PATCH-beta.N`
- Vul maand of patch niet met nullen aan
- Vanaf de update van het releaseproces van juni 2026 is de derde component een
  sequentieel maandelijks release-trainnummer, geen kalenderdag. Stable- en beta-
  releases bepalen de huidige train; tags die alleen alpha zijn verbruiken of
  verhogen het beta-/stable-patchnummer niet. Tags en npm-versies van voor de update
  behouden hun bestaande namen en blijven geldig; releaseautomatisering blijft ze
  vergelijken op jaar, maand, patch, kanaal en prerelease- of correctienummer.
- Alpha-/nightly-builds gebruiken de volgende niet-uitgebrachte patch-train en verhogen
  alleen `alpha.N` voor herhaalde builds. Zodra die patch een beta heeft, gaan nieuwe
  alpha-builds naar de volgende patch. Negeer verouderde tags die alleen alpha zijn met
  hogere patchnummers bij het selecteren van een beta- of stable-train.
- npm-versies zijn onveranderlijk. Als een beta-tag al is gepubliceerd, verwijder,
  herpubliceer of hergebruik die dan niet; maak in plaats daarvan het volgende
  beta-nummer of de volgende maandelijkse patch. Omdat `2026.6.5-beta.1` al tijdens
  de overgang is gepubliceerd, moeten release-trains van juni 2026 patch `5` of hoger
  gebruiken. Publiceer geen nieuwe stable- of beta-trains van juni 2026 als
  `2026.6.2`, `2026.6.3` of `2026.6.4`.
- Na reguliere final `2026.6.5` is de volgende nieuwe beta-train
  `2026.6.6-beta.1`, zelfs
  als geautomatiseerde tags die alleen alpha zijn met hogere patchnummers al bestaan.
- `latest` blijft de huidige reguliere/dagelijkse npm-lijn volgen
- `beta` betekent het huidige beta-installatiedoel
- `extended-stable` betekent het ondersteunde npm-pakket van de afgelopen maand, beginnend
  bij patch `33`; patch `34` en later zijn onderhoudsreleases op die maandelijkse lijn
- Het specifieke maandelijkse extended-stable-pad publiceert alleen het kern-npm-pakket. Het
  publiceert geen plugins, macOS- of Windows-artifacts, een GitHub Release,
  dist-tags van privérepository's, Docker-images, mobiele artifacts of website-
  downloads.

## Releasecadans

- Releases gaan eerst naar beta
- Stable volgt pas nadat de nieuwste beta is gevalideerd
- Maintainers maken releases normaal gesproken vanaf een `release/YYYY.M.PATCH`-branch die
  vanaf de huidige `main` is gemaakt, zodat releasevalidatie en fixes nieuwe
  ontwikkeling op `main` niet blokkeren
- Als een beta-tag is gepusht of gepubliceerd en een fix nodig heeft, maken maintainers
  de volgende `-beta.N`-tag in plaats van de oude beta-tag te verwijderen of opnieuw te maken
- Gedetailleerde releaseprocedure, goedkeuringen, referenties en herstelnotities zijn
  alleen voor maintainers

## Maandelijkse npm-only extended-stable-publicatie

Dit is een specifieke uitzondering op de reguliere releaseprocedure hieronder. Maak voor een
voltooide maand `YYYY.M` `extended-stable/YYYY.M.33`; publiceer `vYYYY.M.33` en
latere onderhoudspatches vanaf dezelfde branch. De release-tag, branchtip,
checkout, pakketversie, npm-preflight en Full Release Validation-run moeten
allemaal dezelfde commit identificeren. Beschermde `main` moet al een final-versie
van een strikt latere kalendermaand onder patch `33` bevatten; onderhoudspatches blijven
in aanmerking komen nadat `main` meer dan een maand is opgeschoven.

Voer de npm-preflight en Full Release Validation uit vanaf exact de extended-stable-branch
en sla daarna beide run-ID's op:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=true \
  -f npm_dist_tag=extended-stable

gh workflow run full-release-validation.yml \
  --ref extended-stable/YYYY.M.33 \
  -f ref=extended-stable/YYYY.M.33 \
  -f release_profile=stable
```

`release_profile=stable` is het bestaande profiel voor validatiediepte; het staat
los van de npm-dist-tag `extended-stable` en is bewust ongewijzigd.

Nadat beide runs zijn geslaagd en de npm-releaseomgeving klaar is, promoveer je de
exacte preflight-tarball. Patch `P` moet `33` of hoger zijn:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id>
```

Voor een fork of niet-productierepetitie die bewust niet kan voldoen aan het
maandelijkse `.33`- of beschermde-`main`-maandbeleid, voeg je
`-f bypass_extended_stable_guard=true` toe aan zowel de npm-preflight- als publicatiedispatches. De
standaardwaarde is `false`. De bypass wordt alleen geaccepteerd met `npm_dist_tag=extended-stable` en
wordt vastgelegd in de workflowsamenvatting. Deze omzeilt niet de canonieke
workflow-ref `extended-stable/YYYY.M.33`, gelijkheid tussen branchtip/tag/checkout, final-tag-
syntaxis, gelijkheid tussen pakket- en tagversie, identiteit van gerefereerde run en manifest,
tarball-herkomst, omgevingsgoedkeuring, registry-readback of bewijs van selector-
reparatie.

De publicatieworkflow verifieert de identiteiten van de gerefereerde runs, de voorbereide
tarball-digest en beide npm-registryselectors. Bevestig het resultaat onafhankelijk
nadat de workflow is geslaagd:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Beide commando's moeten `YYYY.M.P` retourneren. Als publiceren slaagt maar selector-
readback faalt, publiceer de onveranderlijke pakketversie dan niet opnieuw. Gebruik het ene
`npm dist-tag add openclaw@YYYY.M.P extended-stable`-reparatiecommando dat in
de altijd uitgevoerde samenvatting van de mislukte workflow wordt afgedrukt, en herhaal daarna beide
onafhankelijke readbacks. Terugdraaien naar de vorige selector is een aparte operatorbeslissing, niet
het readback-reparatiepad.

De reguliere checklist hieronder blijft eigenaar van beta, `latest`, GitHub Release,
plugins, macOS, Windows en andere platformpublicatie. Voer die stappen niet uit
voor dit npm-only extended-stable-pad.

## Reguliere checklist voor release-operators

Deze checklist is de publieke vorm van de releaseflow. Privéreferenties,
ondertekening, notarization, dist-tag-herstel en details voor noodrollback blijven in
het release-runbook dat alleen voor maintainers is.

1. Begin vanaf de huidige `main`: haal de nieuwste wijzigingen op, bevestig dat de doelcommit is gepusht,
   en bevestig dat de huidige `main`-CI groen genoeg is om ervan te branchen.
2. Genereer de bovenste sectie van `CHANGELOG.md` uit gemergede PR's en alle directe
   commits sinds de laatst bereikbare releasetag. Houd vermeldingen gebruikersgericht,
   ontdubbel overlappende PR-/directe-commitvermeldingen, commit de herschrijving, push deze,
   en rebase/pull nog eenmaal voordat je een branch maakt.
3. Beoordeel releasecompatibiliteitsrecords in
   `src/plugins/compat/registry.ts` en
   `src/commands/doctor/shared/deprecation-compat.ts`. Verwijder verlopen
   compatibiliteit alleen wanneer het upgradepad gedekt blijft, of leg vast waarom deze
   bewust wordt behouden.
4. Maak `release/YYYY.M.PATCH` vanaf de huidige `main`; doe normaal releasewerk niet
   rechtstreeks op `main`.
5. Verhoog elke vereiste versielocatie voor de bedoelde tag en voer daarna
   `pnpm release:prep` uit. Dit ververst Plugin-versies, Plugin-inventaris, config-
   schema, gebundelde kanaalconfigmetadata, config-docsbaseline, Plugin SDK-
   exports en Plugin SDK API-baseline in de juiste volgorde. Commit alle gegenereerde
   drift voordat je tagt. Voer daarna de lokale deterministische voorcontrole uit:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, en `pnpm release:check`.
6. Voer `OpenClaw NPM Release` uit met `preflight_only=true`. Voordat er een tag bestaat,
   is een volledige release-branch-SHA van 40 tekens toegestaan voor alleen-validatie-
   voorcontrole. De voorcontrole genereert dependency-releasebewijs voor de exacte
   uitgecheckte dependency-grafiek en slaat dit op in het npm-voorcontrole-artefact.
   Bewaar de succesvolle `preflight_run_id`.
7. Start alle pre-releasetests met `Full Release Validation` voor de
   releasebranch, tag of volledige commit-SHA. Dit is het ene handmatige startpunt
   voor de vier grote releasetestboxen: Vitest, Docker, QA Lab en Package.
8. Als validatie faalt, los dit op op de releasebranch en voer opnieuw het kleinste gefaalde
   bestand, de kleinste lane, workflowjob, packageprofiel, provider of model-allowlist uit die
   de fix bewijst. Voer de volledige umbrella alleen opnieuw uit wanneer het gewijzigde oppervlak
   eerder bewijs verouderd maakt.
9. Voor een getagde bètakandidaat voer je
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` uit vanaf de overeenkomende
   `release/YYYY.M.PATCH`-branch. Voor stabiel geef je ook de vereiste Windows-bronrelease
   mee:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   De helper voert de lokale gegenereerde releasechecks uit, dispatcht of verifieert
   de volledige releasevalidatie en het npm-voorcontrolebewijs, voert Parallels-
   vers/updatebewijs uit tegen de exact voorbereide tarball plus Telegram-packagebewijs,
   registreert Plugin-npm- en ClawHub-plannen, en print de exacte
   `OpenClaw Release Publish`-opdracht pas nadat de bewijsbundel groen is.
   `OpenClaw Release Publish` dispatcht de geselecteerde of alle publiceerbare Plugin-
   packages parallel naar npm en dezelfde set naar ClawHub, en promoot daarna het
   voorbereide OpenClaw-npm-voorcontrole-artefact met de overeenkomende dist-tag zodra
   Plugin-npm-publicatie slaagt.
   Nadat de child voor OpenClaw-npm-publicatie slaagt, maakt of werkt deze de
   overeenkomende GitHub-release-/prereleasepagina bij vanuit de volledige overeenkomende
   `CHANGELOG.md`-sectie. Stabiele releases die naar npm `latest` worden gepubliceerd,
   worden de nieuwste GitHub-release; stabiele onderhoudsreleases die op npm `beta`
   blijven, worden aangemaakt met GitHub `latest=false`. De workflow uploadt ook het
   dependencybewijs uit de voorcontrole, het volledige-validatiemanifest en
   postpublish-registerverificatiebewijs naar de GitHub-release voor incidentrespons
   na de release. De publicatieworkflow print child-run-ID's onmiddellijk, keurt
   release-environmentgates automatisch goed die de workflowtoken mag goedkeuren,
   vat gefaalde childjobs samen met logtails, rondt de GitHub-release en het
   dependencybewijs af zodra OpenClaw-npm-publicatie slaagt, wacht op ClawHub wanneer
   OpenClaw-npm wordt gepubliceerd, voert daarna `pnpm release:verify-beta` uit en
   uploadt postpublish-bewijs voor de GitHub-release, het npm-package, geselecteerde
   Plugin-npm-packages, geselecteerde ClawHub-packages, child-workflow-run-ID's en
   optionele NPM Telegram-run-ID. Het ClawHub-pad probeert tijdelijke CLI-dependency-
   installatiefouten opnieuw, publiceert preview-slagende Plugins zelfs wanneer één
   previewcel flaket, en eindigt met registerverificatie voor elke verwachte
   Plugin-versie zodat gedeeltelijke publicaties zichtbaar en opnieuw uitvoerbaar blijven. Voer daarna de post-publish
   packageacceptatie uit tegen het gepubliceerde
   `openclaw@YYYY.M.PATCH-beta.N`- of
   `openclaw@beta`-package. Als een gepushte of gepubliceerde prerelease een fix nodig heeft,
   maak dan het volgende overeenkomende prereleasenummer; verwijder of herschrijf de oude
   prerelease niet.
10. Voor stabiel ga je pas verder nadat de gecontroleerde bèta- of releasekandidaat het
    vereiste validatiebewijs heeft. Stabiele npm-publicatie loopt ook via
    `OpenClaw Release Publish`, met hergebruik van het succesvolle voorcontrole-artefact via
    `preflight_run_id`; stabiele macOS-releasegereedheid vereist ook de
    verpakte `.zip`, `.dmg`, `.dSYM.zip` en bijgewerkte `appcast.xml` op `main`.
    De macOS-publicatieworkflow publiceert de ondertekende appcast automatisch naar publieke
    `main` nadat releaseassets zijn geverifieerd; als branchbescherming de directe push
    blokkeert, opent of werkt deze een appcast-PR bij. Stabiele Windows Hub-
    gereedheid vereist de ondertekende `OpenClawCompanion-Setup-x64.exe`,
    `OpenClawCompanion-Setup-arm64.exe` en
    `OpenClawCompanion-SHA256SUMS.txt`-assets op de OpenClaw GitHub-release.
    Geef de exacte ondertekende `openclaw/openclaw-windows-node`-releasetag door als
    `windows_node_tag` en de door de kandidaat goedgekeurde installer-digestmap als
    `windows_node_installer_digests`; `OpenClaw Release Publish` behoudt de
    releaseconceptversie, dispatcht `Windows Node Release` en verifieert alle drie
    assets vóór publicatie.
11. Voer na publicatie de npm-postpublishverificatie uit, de optionele zelfstandige
    gepubliceerde-npm Telegram-E2E wanneer je kanaalbewijs na publicatie nodig hebt,
    dist-tagpromotie wanneer nodig, verifieer de gegenereerde GitHub-releasepagina,
    voer de releaseaankondigingsstappen uit, en voltooi daarna [Afsluiting van stabiele main](#stable-main-closeout)
    voordat je een stabiele release als afgerond beschouwt.

## Afsluiting van stabiele main

Stabiele publicatie is pas compleet wanneer `main` de daadwerkelijk verzonden
releasestaat bevat.

1. Begin vanaf de vers nieuwste `main`. Audit `release/YYYY.M.PATCH` daartegen en
   forward-port echte fixes die ontbreken op `main`. Merge release-only
   compatibiliteits-, test- of validatieadapters niet blind naar een nieuwere `main`.
2. Stel `main` in op de verzonden stabiele versie, niet op een speculatieve volgende train. Voer
   `pnpm release:prep` uit na de rootversiewijziging, en daarna
   `pnpm deps:shrinkwrap:generate`.
3. Laat de `## YYYY.M.PATCH`-sectie van `CHANGELOG.md` op `main` exact overeenkomen met de
   getagde releasebranch. Neem de stabiele `appcast.xml`-update op wanneer de mac-
   release er een publiceerde.
4. Voeg geen `YYYY.M.PATCH+1`, bètaversie of lege toekomstige changelogsectie toe aan
   `main` totdat de operator die releasetrain expliciet start.
5. Voer `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` en
   `OPENCLAW_TESTBOX=1 pnpm check:changed` uit. Push, en verifieer daarna dat `origin/main`
   de verzonden versie en changelog bevat voordat je de stabiele release als voltooid
   beschouwt.
6. Houd de repositoryvariabelen `RELEASE_ROLLBACK_DRILL_ID` en
   `RELEASE_ROLLBACK_DRILL_DATE` actueel na elke private rollbackoefening.
   `OpenClaw Stable Main Closeout` begint vanaf de `main`-push die de
   verzonden versie, changelog en appcast bevat na stabiele publicatie. Deze leest
   onveranderlijk postpublish-bewijs om de verzonden tag te koppelen aan zijn Full Release
   Validation- en Publish-runs, en verifieert daarna de stabiele main-staat, release,
   verplichte stabiele soak en blokkerend prestatiebewijs. Deze voegt een
   onveranderlijk closeoutmanifest en checksum toe aan de GitHub-release. De automatische
   pushtrigger slaat legacyreleases over die dateren van vóór onveranderlijk postpublish-
   bewijs; deze behandelt die skip nooit als een voltooide closeout. Een complete
   closeout vereist zowel assets als een overeenkomende checksum. Een gedeeltelijk manifest
   speelt zijn vastgelegde `main`-SHA en rollbackoefening opnieuw af om identieke bytes
   te regenereren, en voegt daarna de ontbrekende checksum toe; een ongeldig paar, of een
   checksum zonder manifest, blijft blokkerend. Een door push getriggerde run zonder
   rollbackoefening-repositoryvariabelen slaat over zonder closeout te voltooien; een
   ontbrekend of meer dan 90 dagen oud oefenrecord blijft ook handmatige bewijsgebaseerde
   closeout blokkeren. Private herstelopdrachten blijven in de maintainer-only runbook.
   Gebruik handmatige dispatch alleen om een bewijsgebaseerde stabiele closeout te repareren
   of opnieuw af te spelen.
   Een legacy fallback-correctietag mag basispackagebewijs alleen hergebruiken wanneer
   de correctietag naar dezelfde sourcecommit verwijst als de basisstabiele tag.
   Een correctie met een andere source moet eigen packagebewijs publiceren en verifiëren.

## Releasevoorcontrole

- Voer `pnpm check:test-types` uit vóór de releasevoorcontrole, zodat TypeScript voor tests
  ook buiten de snellere lokale `pnpm check`-controle gedekt blijft
- Voer `pnpm check:architecture` uit vóór de releasevoorcontrole, zodat de bredere controles op importcycli
  en architectuurgrenzen buiten de snellere lokale controle groen zijn
- Voer `pnpm build && pnpm ui:build` uit vóór `pnpm release:check`, zodat de verwachte
  `dist/*`-releaseartefacten en de Control UI-bundel bestaan voor de
  pakketvalidatiestap
- Voer `pnpm release:prep` uit na de versiebumper in de root en vóór het taggen. Dit
  draait elke deterministische releasegenerator die vaak afwijkt na een
  versie-/configuratie-/API-wijziging: pluginversies, plugininventaris, basisschema voor configuratie,
  configuratiemetadata van gebundelde kanalen, baseline voor configuratiedocumentatie, Plugin SDK-
  exports en Plugin SDK API-baseline. `pnpm release:check` draait deze
  bewakers opnieuw in controlemodus en rapporteert elke gevonden afwijking in gegenereerde bestanden in één
  ronde voordat pakketreleasecontroles worden uitgevoerd.
- Pluginversiesynchronisatie werkt officiële pluginpakketversies en bestaande
  `openclaw.compat.pluginApi`-ondergrenzen standaard bij naar de OpenClaw-releaseversie.
  Behandel dat veld als de ondergrens voor de Plugin SDK/runtime-API, niet alleen als een kopie
  van de pakketversie: houd bij plugin-only releases die bewust compatibel blijven
  met oudere OpenClaw-hosts de ondergrens op de oudste ondersteunde
  host-API en documenteer die keuze in het pluginreleasebewijs.
- Voer de handmatige `Full Release Validation`-workflow uit vóór releasegoedkeuring om
  alle testboxen vóór de release vanuit één entrypoint te starten. Deze accepteert een branch,
  tag of volledige commit-SHA, start handmatige `CI`, en start
  `OpenClaw Release Checks` voor installatiesmoke, pakketacceptatie, cross-OS
  pakketcontroles, QA Lab-pariteit, Matrix- en Telegram-lanes. Stabiele en volledige
  runs bevatten altijd uitgebreide live/E2E- en Docker-soak voor het releasepad;
  `run_release_soak=true` blijft behouden voor een expliciete beta-soak. Pakketacceptatie
  levert de canonieke pakket-Telegram-E2E tijdens kandidaatvalidatie,
  waardoor een tweede gelijktijdige live poller wordt vermeden.
  Geef `release_package_spec` op na het publiceren van een beta om het verzonden
  npm-pakket opnieuw te gebruiken in releasecontroles, Pakketacceptatie en pakket-Telegram-
  E2E zonder de releasetarball opnieuw te bouwen. Geef
  `npm_telegram_package_spec` alleen op wanneer Telegram een ander
  gepubliceerd pakket moet gebruiken dan de rest van de releasevalidatie. Geef
  `package_acceptance_package_spec` op wanneer Pakketacceptatie een
  ander gepubliceerd pakket moet gebruiken dan de releasepakketspecificatie. Geef
  `evidence_package_spec` op wanneer het releasebewijsrapport moet aantonen dat de
  validatie overeenkomt met een gepubliceerd npm-pakket zonder Telegram E2E af te dwingen.
  Voorbeeld:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- Voer de handmatige `Package Acceptance`-workflow uit wanneer je zijkanaalbewijs wilt
  voor een pakketkandidaat terwijl releasewerk doorgaat. Gebruik `source=npm` voor
  `openclaw@beta`, `openclaw@latest` of een exacte releaseversie; `source=ref`
  om een vertrouwde `package_ref`-branch/tag/SHA te verpakken met de huidige
  `workflow_ref`-harnas; `source=url` voor een openbare HTTPS-tarball met een
  vereiste SHA-256 en strikt beleid voor openbare URL's; `source=trusted-url` voor een
  benoemd beleid voor vertrouwde bronnen met vereiste `trusted_source_id` en SHA-256; of
  `source=artifact` voor een tarball die door een andere GitHub Actions-run is geüpload. De
  workflow herleidt de kandidaat tot
  `package-under-test`, hergebruikt de Docker E2E-releasescheduler tegen die
  tarball, en kan Telegram-QA tegen dezelfde tarball uitvoeren met
  `telegram_mode=mock-openai` of `telegram_mode=live-frontier`. Wanneer de
  geselecteerde Docker-lanes `published-upgrade-survivor` bevatten, is het pakketartefact
  de kandidaat en selecteert `published_upgrade_survivor_baseline` de
  gepubliceerde baseline. `update-restart-auth` gebruikt het kandidaatpakket als
  zowel de geïnstalleerde CLI als het package-under-test, zodat het het
  beheerde herstartpad van de updateopdracht van de kandidaat test.
  Voorbeeld: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Algemene profielen:
  - `smoke`: install/channel/agent-, Gateway-netwerk- en configuratieherlaadlanes
  - `package`: artefact-native pakket-/update-/herstart-/pluginlanes zonder OpenWebUI of live ClawHub
  - `product`: pakketprofiel plus MCP-kanalen, cron-/subagentopschoning,
    OpenAI-webzoekopdracht en OpenWebUI
  - `full`: Docker-releasepadchunks met OpenWebUI
  - `custom`: exacte `docker_lanes`-selectie voor een gerichte rerun
- Voer de handmatige `CI`-workflow direct uit wanneer je alleen deterministische normale
  CI-dekking nodig hebt voor de releasekandidaat. Handmatige CI-dispatches omzeilen changed-
  scoping en forceren de Linux Node-shards, gebundelde-pluginshards, plugin- en
  kanaalcontractshards, Node 22-compatibiliteit, `check-*`, `check-additional-*`,
  smokecontroles voor gebouwde artefacten, docscontroles, Python Skills, Windows, macOS en
  Control UI i18n-lanes. Losstaande handmatige CI-runs draaien Android alleen wanneer gestart
  met `include_android=true`; `Full Release Validation` geeft die input door aan
  zijn CI-child.
  Voorbeeld met Android: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- Voer `pnpm qa:otel:smoke` uit bij het valideren van releasetelemetrie. Dit test
  QA-lab via een lokale OTLP/HTTP-ontvanger en verifieert trace-, metric- en log-
  export plus begrensde trace-attributen en redactie van inhoud/identifiers zonder
  Opik, Langfuse of een andere externe collector te vereisen.
- Voer `pnpm qa:otel:collector-smoke` uit bij het valideren van collectorcompatibiliteit.
  Dit routeert dezelfde QA-lab OTLP-export via een echte OpenTelemetry Collector-
  Docker-container vóór de lokale ontvangerasserties.
- Voer `pnpm qa:prometheus:smoke` uit bij het valideren van beschermde Prometheus-scraping.
  Dit test QA-lab, weigert niet-geauthenticeerde scrapes en verifieert dat
  releasekritieke metricfamilies vrij blijven van promptinhoud, ruwe identifiers,
  auth-tokens en lokale paden.
- Voer `pnpm qa:observability:smoke` uit wanneer je de OpenTelemetry- en Prometheus-
  smokelanes van de source-checkout direct na elkaar wilt draaien.
- Voer `pnpm release:check` uit vóór elke getagde release
- De `OpenClaw NPM Release`-voorcontrole genereert dependency-releasebewijs voordat
  de npm-tarball wordt verpakt. De npm advisory vulnerability gate is
  releaseblokkerend. Het transitieve manifest-risico, het dependency ownership/install-
  oppervlak en de dependency-wijzigingsrapporten zijn alleen releasebewijs. Het
  dependency-wijzigingsrapport vergelijkt de releasekandidaat met de vorige
  bereikbare releasetag.
- De voorcontrole uploadt dependency-bewijs als
  `openclaw-release-dependency-evidence-<tag>` en neemt het ook op onder
  `dependency-evidence/` binnen het voorbereide npm-voorcontrole-artefact. Het echte
  publicatiepad hergebruikt dat voorcontrole-artefact en voegt vervolgens hetzelfde bewijs
  toe aan de GitHub-release als `openclaw-<version>-dependency-evidence.zip`.
- Voer `OpenClaw Release Publish` uit voor de muterende publicatiereeks nadat de
  tag bestaat. Start deze vanaf `release/YYYY.M.PATCH` (of `main` wanneer je een
  vanaf main bereikbare tag publiceert), geef de releasetag, succesvolle OpenClaw npm
  `preflight_run_id` en succesvolle `full_release_validation_run_id` door, en houd
  de standaard pluginpublicatiescope `all-publishable` tenzij je bewust
  een gerichte reparatie uitvoert. De workflow serialiseert plugin-npm-publicatie, plugin-
  ClawHub-publicatie en OpenClaw-npm-publicatie, zodat het corepakket niet wordt gepubliceerd
  vóór zijn geëxternaliseerde plugins.
- Stabiele `OpenClaw Release Publish` vereist een exacte `windows_node_tag` nadat
  de overeenkomende niet-prerelease `openclaw/openclaw-windows-node`-release bestaat.
  Deze vereist ook de door de kandidaat goedgekeurde `windows_node_installer_digests`-map.
  Voordat een publish-child wordt gestart, verifieert deze dat de bronrelease is
  gepubliceerd, geen prerelease is, de vereiste x64/ARM64-installers bevat en
  nog steeds overeenkomt met die goedgekeurde map. Daarna start deze `Windows Node Release`
  terwijl de OpenClaw-release nog een concept is, waarbij de vastgepinde installer-
  digestmap ongewijzigd wordt meegenomen. De child-
  workflow downloadt de ondertekende Windows Hub-installers van die exacte tag,
  vergelijkt ze met de vastgepinde digests, verifieert op een Windows-runner dat hun Authenticode-
  handtekeningen de verwachte OpenClaw Foundation-ondertekenaar gebruiken,
  schrijft een SHA-256-manifest en uploadt de installers plus het manifest naar de
  canonieke OpenClaw GitHub-release, downloadt vervolgens de gepromoveerde assets opnieuw en
  verifieert de manifestlidmaatschap en hashes. De parent verifieert het huidige
  x64-, ARM64- en checksum-assetcontract vóór publicatie. Direct herstel
  weigert onverwachte `OpenClawCompanion-*`-assetnamen voordat de
  verwachte contractassets worden vervangen door de vastgepinde bronbytes. Start
  `Windows Node Release` alleen handmatig voor herstel, en geef altijd een exacte tag door, nooit
  `latest`, plus de expliciete `expected_installer_digests` JSON-map van de
  goedgekeurde bronrelease. Website-downloadlinks moeten verwijzen naar exacte OpenClaw-
  releaseasset-URL's voor de huidige stabiele release, of naar
  `releases/latest/download/...` alleen nadat is geverifieerd dat GitHubs latest-redirect
  naar diezelfde release wijst; link niet alleen naar de companion-repo-releasepagina.
- Releasecontroles draaien nu in een aparte handmatige workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` draait ook de QA Lab mock-pariteitslane plus het snelle
  live Matrix-profiel en de Telegram-QA-lane vóór releasegoedkeuring. De live
  lanes gebruiken de `qa-live-shared`-omgeving; Telegram gebruikt ook Convex CI-
  credentialleases. Voer de handmatige `QA-Lab - All Lanes`-workflow uit met
  `matrix_profile=all` en `matrix_shards=true` wanneer je volledige Matrix-
  transport-, media- en E2EE-inventaris parallel wilt.
- Cross-OS-installatie- en upgrade-runtimevalidatie maakt deel uit van openbare
  `OpenClaw Release Checks` en `Full Release Validation`, die de
  herbruikbare workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direct aanroepen
- Deze scheiding is bewust: houd het echte npm-releasepad kort,
  deterministisch en artefactgericht, terwijl tragere livecontroles in hun
  eigen lane blijven, zodat ze publicatie niet vertragen of blokkeren
- Releasecontroles met secrets moeten worden gestart via `Full Release
Validation` of vanaf de `main`-/release-workflowref, zodat workflowlogica en
  secrets gecontroleerd blijven
- `OpenClaw Release Checks` accepteert een branch, tag of volledige commit-SHA zolang
  de opgeloste commit bereikbaar is vanaf een OpenClaw-branch of releasetag
- De alleen-validatievoorcontrole van `OpenClaw NPM Release` accepteert ook de huidige
  volledige 40-tekenige workflow-branch-commit-SHA zonder een gepushte tag te vereisen
- Dat SHA-pad is alleen voor validatie en kan niet worden gepromoveerd naar een echte publicatie
- In SHA-modus synthetiseert de workflow `v<package.json version>` alleen voor de
  pakketmetadatacontrole; echte publicatie vereist nog steeds een echte releasetag
- Beide workflows houden het echte publicatie- en promotiepad op door GitHub gehoste
  runners, terwijl het niet-muterende validatiepad de grotere
  Blacksmith Linux-runners kan gebruiken
- Die workflow draait
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  met zowel `OPENAI_API_KEY` als `ANTHROPIC_API_KEY` workflowsecrets
- De npm-releasevoorcontrole wacht niet langer op de aparte releasecontroleslane
- Voordat je lokaal een releasekandidaat tagt, voer je
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check` uit. De helper
  draait de snelle release-guardrails, plugin-npm-/ClawHub-releasecontroles, build,
  UI-build en `release:openclaw:npm:check` in de volgorde die veelvoorkomende
  goedkeuringsblokkerende fouten opvangt voordat de GitHub-publicatieworkflow start.
- Voer `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (of de overeenkomende beta-/correctietag) uit vóór goedkeuring
- Na npm-publicatie, voer uit
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (of de overeenkomende beta-/correctieversie) om het gepubliceerde registry-
  installatiepad te verifiëren in een verse tijdelijke prefix
- Voer na een beta-publicatie `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` uit
  om onboarding van geïnstalleerde pakketten, Telegram-configuratie en echte Telegram E2E
  tegen het gepubliceerde npm-pakket te verifiëren met behulp van de gedeelde geleasede Telegram-referentiegegevenspool.
  Lokale eenmalige maintainer-runs kunnen de Convex-variabelen weglaten en de drie
  `OPENCLAW_QA_TELEGRAM_*` env-referentiegegevens rechtstreeks doorgeven.
- Gebruik `pnpm release:beta-smoke -- --beta betaN` om de volledige post-publicatie beta-smoke vanaf een maintainer-machine uit te voeren. De helper voert Parallels npm update-/fresh-target-validatie uit, start `NPM Telegram Beta E2E`, pollt de exacte workflow-run, downloadt het artefact en print het Telegram-rapport.
- Maintainers kunnen dezelfde post-publicatiecontrole vanuit GitHub Actions uitvoeren via de
  handmatige `NPM Telegram Beta E2E`-workflow. Deze is bewust alleen handmatig
  en draait niet bij elke merge.
- Release-automatisering voor maintainers gebruikt nu preflight-dan-promote:
  - echte npm-publicatie moet een geslaagde npm `preflight_run_id` hebben
  - de echte npm-publicatie moet worden gestart vanaf dezelfde `main`- of
    `release/YYYY.M.PATCH`-branch als de geslaagde preflight-run
  - stabiele npm-releases gebruiken standaard `beta`
  - stabiele npm-publicatie kan expliciet op `latest` richten via workflow-invoer
  - op tokens gebaseerde npm dist-tag-mutatie staat nu in
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` omdat
    `npm dist-tag add` nog steeds `NPM_TOKEN` nodig heeft, terwijl de bronrepo
    publicatie alleen via OIDC behoudt
  - publieke `macOS Release` is alleen validatie; wanneer een tag alleen op een
    release-branch staat maar de workflow vanaf `main` wordt gestart, stel dan
    `public_release_branch=release/YYYY.M.PATCH` in
  - echte macOS-publicatie moet een geslaagde macOS `preflight_run_id` en
    `validate_run_id` hebben
  - de echte publicatiepaden promoveren voorbereide artefacten in plaats van
    ze opnieuw te bouwen
- Voor stabiele correctiereleases zoals `YYYY.M.PATCH-N` controleert de post-publicatieverificateur
  ook hetzelfde temp-prefix-upgradepad van `YYYY.M.PATCH` naar `YYYY.M.PATCH-N`,
  zodat releasecorrecties oudere globale installaties niet stilzwijgend op de
  basis-stabiele payload kunnen laten staan
- npm-releasepreflight faalt gesloten tenzij de tarball zowel
  `dist/control-ui/index.html` als een niet-lege `dist/control-ui/assets/`-payload bevat,
  zodat we niet opnieuw een leeg browserdashboard shippen
- Post-publicatieverificatie controleert ook of gepubliceerde Plugin-entrypoints en
  pakketmetadata aanwezig zijn in de geïnstalleerde registry-layout. Een release die
  ontbrekende Plugin-runtimepayloads shipt, faalt de postpublish-verificateur en
  kan niet naar `latest` worden gepromoveerd.
- `pnpm test:install:smoke` handhaaft ook het npm pack-`unpackedSize`-budget op
  de kandidaat-update-tarball, zodat installer-e2e onbedoelde pack-bloat opvangt
  vóór het releasepublicatiepad
- Als het releasewerk CI-planning, timingmanifests voor extensies of
  extensietestmatrices heeft geraakt, regenereer en review dan vóór goedkeuring de door de planner beheerde
  `plugin-prerelease-extension-shard`-matrixoutputs uit
  `.github/workflows/plugin-prerelease.yml`, zodat releaseopmerkingen geen
  verouderde CI-layout beschrijven
- Gereedheid voor stabiele macOS-releases omvat ook de updater-oppervlakken:
  - de GitHub-release moet eindigen met de verpakte `.zip`, `.dmg` en `.dSYM.zip`
  - `appcast.xml` op `main` moet na publicatie naar de nieuwe stabiele zip wijzen; de
    macOS-publicatieworkflow commit dit automatisch, of opent een appcast-
    PR wanneer rechtstreeks pushen is geblokkeerd
  - de verpakte app moet een niet-debug-bundle-id, een niet-lege Sparkle-feed-
    URL en een `CFBundleVersion` op of boven de canonieke Sparkle-buildvloer
    voor die releaseversie behouden

## Release-testboxen

`Full Release Validation` is de manier waarop operators alle pre-releasetests starten vanuit
een enkel toegangspunt. Gebruik voor bewijs van een vastgepinde commit op een snel bewegende branch de
helper, zodat elke onderliggende workflow draait vanaf een tijdelijke branch die op de doel-SHA is
vastgezet:

```bash
pnpm ci:full-release --sha <full-sha>
```

De helper pusht `release-ci/<sha>-...`, start `Full Release Validation`
vanaf die branch met `ref=<sha>`, verifieert dat elke onderliggende workflow `headSha`
overeenkomt met het doel, en verwijdert daarna de tijdelijke branch. Dit voorkomt dat per ongeluk een
nieuwere onderliggende run van `main` wordt bewezen.

Voer releasebranch- of tagvalidatie uit vanaf de vertrouwde `main`-workflow
ref en geef de releasebranch of tag door als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

De workflow lost de doel-ref op, start handmatige `CI` met
`target_ref=<release-ref>`, en start daarna `OpenClaw Release Checks`.
`OpenClaw Release Checks` waaiert uit naar installatiesmoke, cross-OS releasechecks,
live/E2E Docker-dekking voor het releasepad wanneer soak is ingeschakeld, Package Acceptance
met de canonieke Telegram package-E2E, QA Lab-pariteit, live Matrix, en live
Telegram. Een volledige/all-run is alleen acceptabel wanneer de samenvatting van `Full Release Validation`
`normal_ci`, `plugin_prerelease` en `release_checks` als
geslaagd toont, tenzij een gerichte rerun bewust de afzonderlijke onderliggende `Plugin
Prerelease` heeft overgeslagen. Gebruik de zelfstandige onderliggende `npm-telegram` alleen voor een gerichte
rerun van een gepubliceerd package met `release_package_spec` of
`npm_telegram_package_spec`. De uiteindelijke
verificatiesamenvatting bevat tabellen met langzaamste jobs voor elke onderliggende run, zodat de releasemanager
het huidige kritieke pad kan zien zonder logs te downloaden.
Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
volledige fasematrix, exacte workflowjobnamen, verschillen tussen stable- en full-profiel,
artifacts en handles voor gerichte reruns.
Onderliggende workflows worden gestart vanaf de vertrouwde ref die `Full Release
Validation` uitvoert, normaal `--ref main`, zelfs wanneer de doel-`ref` naar een
oudere releasebranch of tag wijst. Er is geen afzonderlijke workflow-ref-invoer voor Full Release Validation;
kies het vertrouwde harnas door de ref voor de workflowrun te kiezen.
Gebruik `--ref main -f ref=<sha>` niet voor exact commitbewijs op bewegende `main`;
ruwe commit-SHA's kunnen geen workflowdispatch-refs zijn, dus gebruik
`pnpm ci:full-release --sha <sha>` om de vastgepinde tijdelijke branch te maken.

Gebruik `release_profile` om de live/provider-breedte te selecteren:

- `minimum`: snelste releasekritieke OpenAI/core live- en Docker-pad
- `stable`: minimum plus stable provider/backend-dekking voor releasegoedkeuring
- `full`: stable plus brede adviserende provider/media-dekking

Stable- en full-validatie draaien altijd de uitputtende live/E2E-, Docker
releasepad- en begrensde sweep voor overlevende gepubliceerde upgrades vóór promotie.
Gebruik `run_release_soak=true` om dezelfde sweep aan te vragen voor een beta. Die sweep dekt
de nieuwste vier stable packages plus vastgepinde `2026.4.23`- en `2026.5.2`-
baselines plus oudere `2026.4.15`-dekking, waarbij dubbele baselines worden verwijderd en
elke baseline in een eigen Docker-runnerjob wordt geshard.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de doel-ref
eenmaal op te lossen als `release-package-under-test` en hergebruikt dat artifact in cross-OS,
Package Acceptance en releasepad-Dockerchecks wanneer soak draait. Dit houdt
alle packagegerichte boxen op dezelfde bytes en voorkomt herhaalde packagebuilds.
Nadat een beta al op npm staat, stel je `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` in,
zodat releasechecks het verzonden package eenmaal downloaden, de brons-SHA van de build uit
`dist/build-info.json` extraheren, en dat artifact hergebruiken voor cross-OS,
Package Acceptance, releasepad-Docker en package-Telegram-lanes.
De cross-OS OpenAI-installatiesmoke gebruikt `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer de
repo/org-variabele is ingesteld, anders `openai/gpt-5.4`, omdat deze lane
package-installatie, onboarding, Gateway-start en één live agentbeurt bewijst
in plaats van het langzaamste standaardmodel te benchmarken. De bredere live provider-
matrix blijft de plaats voor modelspecifieke dekking.

Gebruik deze varianten afhankelijk van de releasefase:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validate an exact pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# After publishing a beta, add published-package Telegram E2E.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Gebruik de volledige paraplu niet als eerste rerun na een gerichte fix. Als één box
faalt, gebruik dan de gefaalde onderliggende workflow, job, Docker-lane, packageprofiel, model-
provider of QA-lane voor het volgende bewijs. Draai de volledige paraplu opnieuw alleen wanneer
de fix gedeelde releaseorkestratie heeft gewijzigd of eerder all-box-bewijs
verouderd heeft gemaakt. De uiteindelijke verifier van de paraplu controleert de vastgelegde run-
id's van onderliggende workflows opnieuw, dus nadat een onderliggende workflow succesvol opnieuw is uitgevoerd, rerun alleen de gefaalde
bovenliggende job `Verify full validation`.

Geef voor begrensd herstel `rerun_group` door aan de paraplu. `all` is de echte
releasecandidate-run, `ci` draait alleen de normale onderliggende CI, `plugin-prerelease`
draait alleen de release-only onderliggende Plugin, `release-checks` draait elke release-
box, en de smallere releasegroepen zijn `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` en `npm-telegram`.
Gerichte `npm-telegram`-reruns vereisen `release_package_spec` of
`npm_telegram_package_spec`; full/all-runs gebruiken de canonieke package-Telegram-
E2E binnen Package Acceptance. Gerichte
cross-OS-reruns kunnen `cross_os_suite_filter=windows/packaged-upgrade` of
een ander OS-/suitefilter toevoegen. QA-releasecheckfouten blokkeren normale release-
validatie, inclusief vereiste OpenClaw dynamic tool drift in de standaardtier.
Tideclaw alpha-runs mogen niet-package-safety releasecheck-lanes nog steeds als
adviserend behandelen. Wanneer `live_suite_filter` expliciet een gated QA-live-lane aanvraagt, zoals
Discord, WhatsApp of Slack, moet de overeenkomende
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED`-repo-variabele zijn ingeschakeld; anders
faalt invoervastlegging in plaats van de lane stilzwijgend over te slaan.

### Vitest

De Vitest-box is de handmatige onderliggende `CI`-workflow. Handmatige CI omzeilt bewust
changed scoping en forceert de normale testgraph voor de releasecandidate:
Linux Node-shards, gebundelde Plugin-shards, Plugin- en channel-contract-
shards, Node 22-compatibiliteit, `check-*`, `check-additional-*`,
smokechecks voor gebouwde artifacts, docs-checks, Python Skills, Windows, macOS,
en Control UI i18n. Android is inbegrepen wanneer `Full Release Validation` de
box draait, omdat de paraplu `include_android=true` doorgeeft; zelfstandige handmatige CI
vereist `include_android=true` voor Android-dekking.

Gebruik deze box om te beantwoorden: "is de source tree geslaagd voor de volledige normale testsuite?"
Dit is niet hetzelfde als productvalidatie voor het releasepad. Te bewaren bewijs:

- samenvatting van `Full Release Validation` met de gestarte `CI`-run-URL
- `CI`-run groen op de exacte doel-SHA
- namen van gefaalde of trage shards uit de CI-jobs bij het onderzoeken van regressies
- Vitest-timingartifacts zoals `.artifacts/vitest-shard-timings.json` wanneer
  een run prestatieanalyse nodig heeft

Draai handmatige CI alleen direct wanneer de release deterministische normale CI nodig heeft, maar
niet de Docker-, QA Lab-, live-, cross-OS- of packageboxen. Gebruik het eerste commando
voor directe CI zonder Android. Voeg `include_android=true` toe wanneer directe
releasecandidate-CI Android moet dekken:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

De Docker-box leeft in `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus de release-modus
`install-smoke`-workflow. Deze valideert de releasecandidate via verpakte
Docker-omgevingen in plaats van alleen source-level tests.

Release-Docker-dekking omvat:

- volledige installatiesmoke met de langzame Bun global install smoke ingeschakeld
- voorbereiding/hergebruik van de root Dockerfile-smoke-image per doel-SHA, waarbij QR-,
  root/Gateway- en installer/Bun-smokejobs als afzonderlijke install-smoke-
  shards draaien
- repository-E2E-lanes
- releasepad-Docker-chunks: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` en `plugins-runtime-install-h`
- OpenWebUI-dekking binnen de chunk `plugins-runtime-services` wanneer aangevraagd
- opgesplitste lanes voor installeren/verwijderen van gebundelde Plugin
  `bundled-plugin-install-uninstall-0` tot en met
  `bundled-plugin-install-uninstall-23`
- live/E2E provider-suites en Docker live model-dekking wanneer releasechecks
  live suites bevatten

Gebruik Docker-artifacts vóór reruns. De releasepad-scheduler uploadt
`.artifacts/docker-tests/` met lane-logs, `summary.json`, `failures.json`,
fasetimings, scheduler-plan-JSON en rerun-commando's. Gebruik voor gericht herstel
`docker_lanes=<lane[,lane]>` op de herbruikbare live/E2E-workflow in plaats van
alle releasechunks opnieuw te draaien. Gegenereerde rerun-commando's bevatten eerdere
`package_artifact_run_id` en voorbereide Docker-image-invoer wanneer beschikbaar, zodat een
gefaalde lane dezelfde tarball en GHCR-images kan hergebruiken.

### QA Lab

De QA Lab-box maakt ook deel uit van `OpenClaw Release Checks`. Het is de agentic
gedrags- en channel-level releasegate, los van Vitest en Docker-
packagemechanica.

Release-QA Lab-dekking omvat:

- mock-parity-lane die de OpenAI-candidatelane vergelijkt met de Opus 4.6-
  baseline met behulp van het agentic parity pack
- snel live Matrix-QA-profiel met de `qa-live-shared`-omgeving
- live Telegram-QA-lane met Convex CI-credentialleases
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`,
  `pnpm qa:prometheus:smoke` of
  `pnpm qa:observability:smoke` wanneer releasetelemetrie expliciet lokaal
  bewijs nodig heeft

Gebruik deze box om te beantwoorden: "gedraagt de release zich correct in QA-scenario's en
live channelflows?" Bewaar de artifact-URL's voor parity-, Matrix- en Telegram-
lanes bij het goedkeuren van de release. Volledige Matrix-dekking blijft beschikbaar als een
handmatige gesharde QA-Lab-run in plaats van de standaard releasekritieke lane.

### Package

De Package-box is de gate voor het installeerbare product. Deze wordt ondersteund door
`Package Acceptance` en de resolver
`scripts/resolve-openclaw-package-candidate.mjs`. De resolver normaliseert een
candidate naar de `package-under-test`-tarball die door Docker E2E wordt gebruikt, valideert
de package-inventaris, legt de packageversie en SHA-256 vast, en houdt de
workflowharnas-ref gescheiden van de packagebron-ref.

Ondersteunde candidatebronnen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` of een exacte OpenClaw-releaseversie
- `source=ref`: verpak een vertrouwde `package_ref`-branch, tag of volledige commit-SHA
  met de geselecteerde `workflow_ref`-harness
- `source=url`: download een openbare HTTPS-`.tgz` met vereiste `package_sha256`;
  URL-aanmeldgegevens, niet-standaard HTTPS-poorten, private/interne/speciaalgebruik-
  hostnamen of opgeloste adressen, en onveilige omleidingen worden geweigerd
- `source=trusted-url`: download een HTTPS-`.tgz` met vereiste
  `package_sha256` en `trusted_source_id` uit een benoemd beleid in
  `.github/package-trusted-sources.json`; gebruik dit voor door onderhouders beheerde
  enterprise-mirrors of private pakketrepositories in plaats van een
  private-netwerk-bypass op invoerniveau toe te voegen aan `source=url`
- `source=artifact`: hergebruik een `.tgz` die door een andere GitHub Actions-run is geüpload

`OpenClaw Release Checks` voert Package Acceptance uit met `source=artifact`, het
voorbereide releasepakketartefact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance houdt migratie, update,
herstart van geconfigureerde-auth-update, live ClawHub-skillinstallatie, opschoning van verouderde Plugin-afhankelijkheden, offline Plugin-
fixtures, Plugin-update en Telegram-pakket-QA tegen dezelfde opgeloste
tarball. Blokkerende releasecontroles gebruiken de standaardbaseline van het laatst gepubliceerde pakket;
het betaprofiel met `run_release_soak=true`, `release_profile=stable` of
`release_profile=full` breidt uit naar elke stabiele, op npm gepubliceerde baseline van
`2026.4.23` tot en met `latest`, plus fixtures voor gemelde issues. Gebruik
Package Acceptance met `source=npm` voor een al verzonden kandidaat,
`source=ref` voor een door SHA ondersteunde lokale npm-tarball vóór publicatie,
`source=trusted-url` voor een door onderhouders beheerde enterprise/private mirror, of
`source=artifact` voor een voorbereide tarball die door een andere GitHub Actions-run is geüpload.
Het is de GitHub-native
vervanging voor het grootste deel van de pakket-/updatedekking waarvoor eerder
Parallels nodig was. Cross-OS-releasecontroles blijven belangrijk voor OS-specifieke onboarding,
installers en platformgedrag, maar productvalidatie voor pakketten/updates moet
de voorkeur geven aan Package Acceptance.

De canonieke checklist voor update- en Plugin-validatie is
[Updates en plugins testen](/nl/help/testing-updates-plugins). Gebruik deze bij het
bepalen welke lokale, Docker-, Package Acceptance- of releasecontrole-lane een
Plugin-installatie/-update, doctor-opschoning of migratiewijziging van een gepubliceerd pakket bewijst.
Uitputtende gepubliceerde updatemigratie vanaf elk stabiel `2026.4.23+`-pakket is
een aparte handmatige `Update Migration`-workflow, geen onderdeel van Full Release CI.

Legacy-coulance voor package-acceptance is bewust tijdsgebonden. Pakketten tot en met
`2026.4.25` mogen het compatibiliteitspad gebruiken voor metadatagaten die al naar
npm zijn gepubliceerd: private QA-inventarisitems die ontbreken in de tarball, ontbrekende
`gateway install --wrapper`, ontbrekende patchbestanden in de uit de tarball afgeleide git-
fixture, ontbrekende blijvende `update.channel`, legacy locaties voor Plugin-installatierecords,
ontbrekende blijvende opslag van marketplace-installatierecords en migratie van configuratiemetadata
tijdens `plugins update`. Het gepubliceerde `2026.4.26`-pakket mag waarschuwen
voor lokale buildmetadata-stempelbestanden die al zijn verzonden. Latere pakketten
moeten voldoen aan de moderne pakketcontracten; dezelfde gaten laten releasevalidatie
falen.

Gebruik bredere Package Acceptance-profielen wanneer de releasevraag over een
daadwerkelijk installeerbaar pakket gaat:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Veelgebruikte pakketprofielen:

- `smoke`: snelle lanes voor pakketinstallatie/kanaal/agent, Gateway-netwerk en configuratie
  herladen
- `package`: installatie/update/herstart/Plugin-pakketcontracten plus live ClawHub-
  skillinstallatiebewijs; dit is de standaard voor releasecontroles
- `product`: `package` plus MCP-kanalen, cron-/subagent-opschoning, OpenAI web
  search en OpenWebUI
- `full`: Docker-releasepadchunks met OpenWebUI
- `custom`: exacte `docker_lanes`-lijst voor gerichte herhalingen

Schakel voor Telegram-bewijs van pakketkandidaten `telegram_mode=mock-openai` of
`telegram_mode=live-frontier` in op Package Acceptance. De workflow geeft de
opgeloste `package-under-test`-tarball door aan de Telegram-lane; de zelfstandige
Telegram-workflow accepteert nog steeds een gepubliceerde npm-specificatie voor controles na publicatie.

## Reguliere automatisering voor releasepublicatie

Voor beta, `latest`, Plugin, GitHub Release en platformpublicatie is
`OpenClaw Release Publish` het normale muterende toegangspunt. Het maandelijkse
`.33+` npm-only extended-stable-pad gebruikt deze orchestrator niet. De reguliere workflow
orkestreert de trusted-publisher-workflows in de volgorde die de release nodig heeft:

1. Check de releasetag uit en los de commit-SHA op.
2. Controleer of de tag bereikbaar is vanaf `main` of `release/*`.
3. Voer `pnpm plugins:sync:check` uit.
4. Dispatch `Plugin NPM Release` met `publish_scope=all-publishable` en
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` met dezelfde scope en SHA.
6. Dispatch `OpenClaw NPM Release` met de releasetag, npm-dist-tag en
   opgeslagen `preflight_run_id` na verificatie van de opgeslagen
   `full_release_validation_run_id`.
7. Maak of update voor stabiele releases de GitHub-release als concept, dispatch
   `Windows Node Release` met de expliciete `windows_node_tag` en
   door de kandidaat goedgekeurde `windows_node_installer_digests`, en controleer de canonieke
   installer-/checksumartefacten voordat het concept wordt gepubliceerd.

Voorbeeld van betapublicatie:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Stabiele publicatie naar de standaard beta-dist-tag:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Stabiele promotie direct naar `latest` is expliciet:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=latest
```

Gebruik de lagere-niveau-workflows `Plugin NPM Release` en `Plugin ClawHub Release`
alleen voor gerichte reparatie of herpublicatie. `OpenClaw Release Publish` weigert
`plugin_publish_scope=selected` wanneer `publish_openclaw_npm=true`, zodat het kernpakket
niet kan worden verzonden zonder elke publiceerbare officiële Plugin, inclusief
`@openclaw/diffs-language-pack`. Stel voor een geselecteerde Plugin-reparatie
`publish_openclaw_npm=false` in met `plugin_publish_scope=selected` en
`plugins=@openclaw/name`, of dispatch de child-workflow rechtstreeks.

## NPM-workflowinvoer

`OpenClaw NPM Release` accepteert deze door operators beheerde invoer:

- `tag`: vereiste releasetag zoals `v2026.4.2`, `v2026.4.2-1` of
  `v2026.4.2-beta.1`; wanneer `preflight_only=true`, mag dit ook de huidige
  volledige workflow-branch-commit-SHA van 40 tekens zijn voor alleen validatie-preflight
- `preflight_only`: `true` voor alleen validatie/build/pakket, `false` voor het
  echte publicatiepad
- `preflight_run_id`: vereist op het echte publicatiepad zodat de workflow de
  voorbereide tarball uit de geslaagde preflight-run hergebruikt
- `full_release_validation_run_id`: vereist voor echte maandelijkse extended-stable en reguliere
  niet-betapublicatie, zodat de workflow de exacte validatierun authenticeert
- `npm_dist_tag`: npm-doeltag voor het publicatiepad; accepteert `alpha`, `beta`,
  `latest` of `extended-stable` en is standaard `beta`. Definitieve patch `33` en later moeten
  `extended-stable` gebruiken; standaard weigert `extended-stable` eerdere patches, en het weigert altijd
  niet-definitieve tags.
- `bypass_extended_stable_guard`: alleen-voor-tests boolean, standaard `false`; met
  `npm_dist_tag=extended-stable` omzeilt dit maandelijkse extended-stable-geschiktheid, terwijl
  release-identiteit, artefact-, goedkeurings- en readback-controles behouden blijven.

`OpenClaw Release Publish` accepteert deze door operators beheerde invoer:

- `tag`: vereiste releasetag; moet al bestaan
- `preflight_run_id`: geslaagde `OpenClaw NPM Release` preflight-run-id;
  vereist wanneer `publish_openclaw_npm=true`
- `full_release_validation_run_id`: geslaagde `Full Release Validation`-run-
  id; vereist wanneer `publish_openclaw_npm=true`
- `windows_node_tag`: exacte niet-prerelease `openclaw/openclaw-windows-node`-
  releasetag; vereist voor stabiele OpenClaw-publicatie
- `windows_node_installer_digests`: door kandidaat goedgekeurde compacte JSON-map van de
  huidige Windows-installernamen naar hun vastgepinde `sha256:`-digests; vereist
  voor stabiele OpenClaw-publicatie
- `npm_dist_tag`: npm-doeltag voor het OpenClaw-pakket
- `plugin_publish_scope`: standaard `all-publishable`; gebruik `selected` alleen
  voor gericht Plugin-only reparatiewerk met `publish_openclaw_npm=false`
- `plugins`: door komma's gescheiden `@openclaw/*`-pakketnamen wanneer
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: standaard `true`; stel alleen `false` in wanneer de
  workflow wordt gebruikt als Plugin-only reparatie-orchestrator
- `wait_for_clawhub`: standaard `false`, zodat npm-beschikbaarheid niet wordt geblokkeerd door
  de ClawHub-sidecar; stel alleen `true` in wanneer workflowvoltooiing ook
  ClawHub-voltooiing moet omvatten

`OpenClaw Release Checks` accepteert deze door operators beheerde invoer:

- `ref`: branch, tag of volledige commit-SHA om te valideren. Controles met geheimen
  vereisen dat de opgeloste commit bereikbaar is vanaf een OpenClaw-branch of
  releasetag.
- `run_release_soak`: kies voor uitputtende live/E2E-, Docker-releasepad- en
  all-since upgrade-survivor-soak voor betareleasecontroles. Dit wordt afgedwongen door
  `release_profile=stable` en `release_profile=full`.

Regels:

- Reguliere definitieve en correctieversies onder patch `33` mogen publiceren naar
  `beta` of `latest`. Definitieve versies op patch `33` of hoger moeten publiceren naar
  `extended-stable`, en versies met correctiesuffix op die grens worden geweigerd.
- Beta-prereleasetags mogen alleen publiceren naar `beta`
- Voor `OpenClaw NPM Release` is volledige commit-SHA-invoer alleen toegestaan wanneer
  `preflight_only=true`
- `OpenClaw Release Checks` en `Full Release Validation` zijn altijd
  alleen-validatie
- Het echte publicatiepad moet dezelfde `npm_dist_tag` gebruiken als tijdens preflight;
  de workflow controleert die metadata voordat de publicatie doorgaat

## Reguliere releasevolgorde voor beta/latest stabiel

Deze legacy-volgorde is voor de reguliere georkestreerde release die ook eigenaar is van
plugins, GitHub Release, Windows en ander platformwerk. Het is niet het
maandelijkse `.33+` npm-only extended-stable-pad dat bovenaan deze pagina is gedocumenteerd.

Bij het maken van een reguliere georkestreerde stabiele release:

1. Voer `OpenClaw NPM Release` uit met `preflight_only=true`
   - Voordat er een tag bestaat, kunt u de huidige volledige commit-SHA van de workflow-branch gebruiken
     voor een validatie-only dry-run van de preflight-workflow
2. Kies `npm_dist_tag=beta` voor de normale beta-first flow, of `latest` alleen
   wanneer u bewust direct stabiel wilt publiceren
3. Voer `Full Release Validation` uit op de release-branch, release-tag of volledige
   commit-SHA wanneer u normale CI plus live promptcache-, Docker-, QA Lab-,
   Matrix- en Telegram-dekking vanuit één handmatige workflow wilt
4. Als u bewust alleen de deterministische normale testgrafiek nodig hebt, voer dan in plaats daarvan de
   handmatige `CI`-workflow uit op de release-ref
5. Selecteer de exacte niet-prerelease `openclaw/openclaw-windows-node` release-tag
   waarvan de ondertekende x64- en ARM64-installers moeten worden uitgebracht. Sla deze op als
   `windows_node_tag`, en sla hun gevalideerde digest-map op als
   `windows_node_installer_digests`. De release-candidate-helper registreert beide
   en neemt ze op in de gegenereerde publicatieopdracht.
6. Sla de geslaagde `preflight_run_id` en `full_release_validation_run_id` op
7. Voer `OpenClaw Release Publish` uit met dezelfde `tag`, dezelfde `npm_dist_tag`,
   de geselecteerde `windows_node_tag`, de opgeslagen `windows_node_installer_digests`,
   de opgeslagen `preflight_run_id` en de opgeslagen `full_release_validation_run_id`;
   dit publiceert geëxternaliseerde plugins naar npm en ClawHub voordat het
   OpenClaw-npm-pakket wordt gepromoveerd
8. Als de release op `beta` is geland, gebruik dan de
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`-
   workflow om die stabiele versie van `beta` naar `latest` te promoveren
9. Als de release bewust direct naar `latest` is gepubliceerd en `beta`
   onmiddellijk dezelfde stabiele build moet volgen, gebruik dan dezelfde release-
   workflow om beide dist-tags naar de stabiele versie te laten wijzen, of laat de geplande
   zelfherstellende synchronisatie `beta` later verplaatsen

De dist-tagmutatie staat in de release-ledger-repo omdat die nog steeds
`NPM_TOKEN` vereist, terwijl de source-repo OIDC-only publicatie behoudt.

Dat houdt zowel het directe publicatiepad als het beta-first promotiepad
gedocumenteerd en zichtbaar voor operators.

Als een maintainer moet terugvallen op lokale npm-authenticatie, voer dan alle 1Password
CLI-opdrachten (`op`) alleen uit binnen een speciale tmux-sessie. Roep `op` niet
rechtstreeks aan vanuit de hoofd-agent-shell; door het binnen tmux te houden, blijven prompts,
waarschuwingen en OTP-afhandeling observeerbaar en worden herhaalde hostwaarschuwingen voorkomen.

## Openbare referenties

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainers gebruiken de private release-documentatie in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
voor het daadwerkelijke runbook.

## Gerelateerd

- [Releasekanalen](/nl/install/development-channels)
