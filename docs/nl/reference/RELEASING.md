---
read_when:
    - Zoeken naar definities van openbare releasekanalen
    - Releasevalidatie of pakketacceptatie uitvoeren
    - Op zoek naar versienamen en releasefrequentie
summary: Releasetrajecten, checklist voor operators, validatievakken, versienamen en frequentie
title: Releasebeleid
x-i18n:
    generated_at: "2026-07-12T09:21:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4270a96560ee908c09d26782ffa75dbc695f4ab83c5a80dfb7abe5befd8ca686
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw biedt momenteel drie gebruikersgerichte updatekanalen:

- stable: het bestaande gepromote releasekanaal, dat nog steeds via npm `latest` wordt opgelost totdat de afzonderlijke mijlpaal voor CLI/kanalen is bereikt
- beta: prereleasetags die naar npm `beta` worden gepubliceerd
- dev: de verschuivende kop van `main`

Daarnaast kunnen releasebeheerders het kernpakket van de laatst voltooide maand
publiceren naar npm `extended-stable`, beginnend bij patch `33`. De reguliere
definitieve lijn van de huidige maand blijft op npm `latest`; deze splitsing
van publicaties aan beheerderszijde verandert op zichzelf niets aan de
oplossing van CLI-updatekanalen.

Tideclaw-alfabuilds vormen een afzonderlijk intern prereleasetraject (npm-dist-tag `alpha`), beschreven onder [invoer voor de NPM-workflow](#npm-workflow-inputs) en [testomgevingen voor releases](#release-test-boxes).

## Versienamen

- Maandelijkse npm extended-stable-releaseversie: `YYYY.M.PATCH`, met `PATCH >= 33`, git-tag `vYYYY.M.PATCH`
- Dagelijkse/reguliere definitieve releaseversie: `YYYY.M.PATCH`, met `PATCH < 33`, git-tag `vYYYY.M.PATCH`
- Reguliere correctiereleaseversie voor terugval: `YYYY.M.PATCH-N`, git-tag `vYYYY.M.PATCH-N`
- Bèta-prereleaseversie: `YYYY.M.PATCH-beta.N`, git-tag `vYYYY.M.PATCH-beta.N`
- Alfa-prereleaseversie: `YYYY.M.PATCH-alpha.N`, git-tag `vYYYY.M.PATCH-alpha.N`
- Vul maand- of patchnummers nooit met voorloopnullen aan
- `PATCH` is een opeenvolgend nummer binnen de maandelijkse releasereeks, geen kalenderdag. Reguliere definitieve en bètareleases schuiven de huidige reeks door; tags die uitsluitend voor alfa zijn, gebruiken of verhogen het patchnummer voor bèta/regulier nooit. Negeer daarom verouderde tags die uitsluitend voor alfa zijn en hogere patchnummers hebben wanneer je een bèta- of reguliere reeks selecteert.
- Alfa-/nightlybuilds gebruiken de volgende nog niet uitgebrachte patchreeks en verhogen bij herhaalde builds alleen `alpha.N`. Zodra die patch een bèta heeft, gaan nieuwe alfabuilds naar de daaropvolgende patch.
- npm-versies zijn onveranderlijk: verwijder of herpubliceer een gepubliceerde tag nooit en gebruik deze nooit opnieuw. Maak in plaats daarvan het volgende prereleasenummer of de volgende maandelijkse patch.
- `latest` blijft de huidige reguliere/dagelijkse npm-lijn volgen; `beta` is het huidige installatiedoel voor bèta
- `extended-stable` betekent het ondersteunde npm-pakket van de voorgaande maand, beginnend bij patch `33`; patch `34` en hoger zijn onderhoudsreleases op die maandelijkse lijn
- Reguliere definitieve en reguliere correctiereleases worden standaard naar npm `beta` gepubliceerd; releasebeheerders kunnen expliciet `latest` kiezen of een gecontroleerde bètabuild later promoveren
- Het specifieke maandelijkse extended-stable-traject publiceert het kernpakket voor npm en elke officiële Plugin die naar npm kan worden gepubliceerd met exact dezelfde versie. Het publiceert geen plugins naar ClawHub en publiceert evenmin macOS- of Windows-artefacten, een GitHub-release, dist-tags voor privérepository's, Docker-images, mobiele artefacten of websitedownloads.
- Elke reguliere definitieve release levert tegelijkertijd het npm-pakket, de macOS-app, het ondertekende zelfstandige Android-APK en de ondertekende Windows Hub-installatieprogramma's. Bètareleases valideren en publiceren normaal gesproken eerst het npm-/pakkettraject; bouwen, ondertekenen, notarieel bekrachtigen en promoveren van native apps blijft voorbehouden aan reguliere definitieve releases, tenzij dit expliciet wordt gevraagd.

## Releasefrequentie

- Releases doorlopen eerst bèta; stable volgt pas nadat de nieuwste bèta is gevalideerd
- Beheerders maken releases normaal gesproken vanuit een `release/YYYY.M.PATCH`-branch die vanaf de huidige `main` is aangemaakt, zodat releasevalidatie en correcties nieuwe ontwikkeling op `main` niet blokkeren
- Als een bètag is gepusht of gepubliceerd en een correctie nodig heeft, maken beheerders de volgende `-beta.N`-tag in plaats van de oude tag te verwijderen of opnieuw aan te maken
- De gedetailleerde releaseprocedure, goedkeuringen, referenties en herstelnotities zijn uitsluitend voor beheerders bestemd

## Maandelijkse uitsluitend-voor-npm-publicatie van extended-stable

Dit is een specifieke uitzondering op de reguliere releaseprocedure hieronder. Maak voor een
voltooide maand `YYYY.M` de branch `extended-stable/YYYY.M.33`; publiceer
`vYYYY.M.33` en latere onderhoudspatches vanuit diezelfde branch. De release-
tag, branchtop, checkout, pakketversie, npm-voorcontrole en uitvoering van de
volledige releasevalidatie moeten allemaal naar dezelfde commit verwijzen.
De beschermde branch `main` moet al een definitieve versie uit een strikt
latere kalendermaand met een patchnummer lager dan `33` bevatten;
onderhoudspatches blijven in aanmerking komen nadat `main` meer dan één maand
is doorgeschoven.

Verhoog op exact die extended-stable-branch het hoofdpakket naar `YYYY.M.P`, voer
`pnpm release:prep` uit en controleer of elk publiceerbaar uitbreidingspakket
dezelfde versie heeft. Commit en push alle gegenereerde wijzigingen, maak en
push de onveranderlijke tag `vYYYY.M.P` bij die commit en noteer de resulterende
volledige SHA. De workflows gebruiken deze voorbereide boomstructuur; ze
verhogen of synchroniseren de versies niet voor je.

Voer de npm-voorcontrole en de volledige releasevalidatie uit vanaf exact die
voorbereide branchtop en bewaar vervolgens beide uitvoerings-ID's en de
geslaagde uitvoeringspoging van de volledige releasevalidatie:

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

`release_profile=stable` is het bestaande profiel voor validatiediepte; het
staat los van de npm-dist-tag `extended-stable` en blijft opzettelijk
ongewijzigd.

Nadat beide uitvoeringen zijn geslaagd, publiceer je elke officiële Plugin die
naar npm kan worden gepubliceerd vanaf exact dezelfde branchtop. Patch `P` moet
`33` of hoger zijn. Geef de volledige release-SHA door als `ref`, wacht op de
volledige matrix en teruglezing uit het register en bewaar vervolgens het
uitvoerings-ID van de geslaagde NPM-release voor plugins:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

De workflow gebruikt de reguliere voorbereide `all-publishable`-pakketinventaris,
inclusief pakketten waarvan de broncode niet is gewijzigd. Voor een geslaagd
resultaat controleert de workflow elk exact pakket en elke Plugin-tag
`extended-stable`. Als een gedeeltelijke uitvoering mislukt, voer je dezelfde
opdracht opnieuw uit: reeds gepubliceerde pakketten worden hergebruikt,
ontbrekende of verouderde Plugin-tags worden binnen de npm-releaseomgeving
gecorrigeerd en de uiteindelijke teruglezing omvat nog steeds de volledige
pakketverzameling.

Nadat de Plugin-workflow is geslaagd en de npm-releaseomgeving gereed is,
publiceer je het exacte tarballbestand van de kernvoorcontrole. De
kernpublicatie controleert of de uitvoering voor plugins waarnaar wordt
verwezen de status `completed/success` heeft op dezelfde canonieke branch en
exact dezelfde bron-SHA:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id> \
  -f full_release_validation_run_attempt=<full-validation-run-attempt> \
  -f plugin_npm_run_id=<plugin-npm-run-id>
```

Voeg voor een fork of niet-productierepetitie die opzettelijk niet aan het
maandelijkse `.33`-beleid of het maandbeleid voor de beschermde `main` kan
voldoen, `-f bypass_extended_stable_guard=true` toe aan zowel de dispatch voor
de npm-voorcontrole als die voor publicatie. De standaardwaarde is `false`. De
omzeiling wordt alleen geaccepteerd met `npm_dist_tag=extended-stable` en wordt
vastgelegd in de workflowsamenvatting. Hiermee worden de canonieke
workflowreferentie `extended-stable/YYYY.M.33`, de gelijkheid tussen branchtop,
tag en checkout, de syntaxis van definitieve tags, de gelijkheid tussen
pakket- en tagversie, de identiteit van uitvoeringen en manifesten waarnaar
wordt verwezen, de herkomst van het tarballbestand, omgevingsgoedkeuring,
teruglezing uit het register en bewijs van selectorherstel niet omzeild.

De publicatieworkflow controleert de identiteit van de voorcontrole, validatie
en Plugin-uitvoering waarnaar wordt verwezen, de digest van het voorbereide
tarballbestand en de kernselectors in het register. Bevestig het resultaat
onafhankelijk nadat de workflow is geslaagd:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Beide opdrachten moeten `YYYY.M.P` retourneren. Als de publicatie slaagt maar
het teruglezen van de selector mislukt, publiceer je de onveranderlijke
pakketversie niet opnieuw. Gebruik de enkele herstelopdracht
`npm dist-tag add openclaw@YYYY.M.P extended-stable` die in de altijd
uitgevoerde samenvatting van de mislukte workflow wordt weergegeven en herhaal
daarna beide onafhankelijke teruglezingen. Terugdraaien naar de vorige selector
is een afzonderlijke beheerdersbeslissing en niet het hersteltraject voor
teruglezing.

Openbare ondersteuningsdocumentatie wijst in eerste instantie Slack, Discord en
Codex aan als ondersteunde Plugin-oppervlakken voor extended-stable. Die lijst
is een ondersteuningsverklaring, geen toelatingslijst in de releasecode: elke
officiële Plugin die naar npm kan worden gepubliceerd, volgt hetzelfde
publicatietraject met exact dezelfde versie.

De reguliere controlelijst hieronder blijft verantwoordelijk voor bèta,
`latest`, GitHub-release, plugins, macOS, Windows en publicatie voor andere
platforms. Voer die stappen niet uit voor dit uitsluitend-voor-npm-traject van
extended-stable.

## Reguliere controlelijst voor releasebeheerders

Deze controlelijst beschrijft de openbare vorm van het releaseproces. Privéreferenties, ondertekening, notariële bekrachtiging, herstel van dist-tags en details voor noodterugdraaiingen blijven in het uitsluitend voor beheerders bestemde releasedraaiboek.

1. Begin vanaf de huidige `main`: haal de nieuwste wijzigingen op, bevestig dat de doelcommit is gepusht en bevestig dat de CI van `main` voldoende groen is om er een branch van te maken.
2. Genereer de bovenste sectie van `CHANGELOG.md` op basis van gemergede PR's en alle rechtstreekse commits sinds de laatst bereikbare releasetag. Houd vermeldingen op gebruikers gericht, dedupliceer overlappende vermeldingen van PR's en rechtstreekse commits, commit en push, en voer vóór het maken van de branch nogmaals een rebase/pull uit. Wanneer een afwijkende uitgebrachte tag of latere forward-port reeds uitgebrachte PR's opnieuw koppelt, geef die tag dan expliciet door als `--shipped-ref`; de verificateur gebruikt expliciete PR-rijen uit volledige bijdragegegevens in genummerde secties van de momentopname van de tag, negeert `Unreleased` en registreert de exacte inventaris en het aantal uitgesloten PR's.
3. Controleer de compatibiliteitsgegevens voor releases in `src/plugins/compat/registry.ts` en `src/commands/doctor/shared/deprecation-compat.ts`. Verwijder verlopen compatibiliteit alleen wanneer het upgradepad gedekt blijft, of leg vast waarom deze bewust wordt behouden.
4. Maak `release/YYYY.M.PATCH` vanaf de huidige `main`. Voer normale releasewerkzaamheden niet rechtstreeks op `main` uit.
5. Verhoog elke vereiste versielocatie voor de tag en voer vervolgens `pnpm release:prep` uit. Hiermee worden achtereenvolgens Plugin-versies, npm-shrinkwraps, de Plugin-inventaris, het basisschema voor configuratie, configuratiemetadata van gebundelde kanalen, de basislijn voor configuratiedocumentatie, Plugin-SDK-exports en de API-basislijn van de Plugin-SDK vernieuwd. Commit alle gegenereerde afwijkingen vóór het taggen en voer vervolgens de lokale deterministische preflight uit: `pnpm check:test-types`, `pnpm check:architecture`, `pnpm build && pnpm ui:build` en `pnpm release:check`.
6. Voer `OpenClaw NPM Release` uit met `preflight_only=true`. Voordat er een tag bestaat, is een volledige SHA van 40 tekens van de releasebranch toegestaan voor een preflight die uitsluitend voor validatie dient. De preflight genereert bewijs voor de release van afhankelijkheden voor de exacte uitgecheckte afhankelijkheidsgraaf en slaat dit op in het npm-preflightartefact. Bewaar de geslaagde `preflight_run_id`.
7. Start alle prereleasetests met `Full Release Validation` voor de releasebranch, tag of volledige commit-SHA. Dit is het enige handmatige toegangspunt voor de vier grote releasetestomgevingen: Vitest, Docker, QA Lab en Package. Bewaar de `full_release_validation_run_id` en de exacte `full_release_validation_run_attempt`; beide zijn vereiste invoerwaarden voor `OpenClaw NPM Release` en `OpenClaw Release Publish`.
8. Als de validatie mislukt, herstel dit dan op de releasebranch en voer opnieuw het kleinst mogelijke mislukte bestand, de kleinste lane, workflowtaak, het kleinste pakketprofiel, de kleinste provider- of modeltoelatingslijst uit waarmee de oplossing wordt aangetoond. Voer de volledige overkoepelende validatie alleen opnieuw uit wanneer eerder bewijs door het gewijzigde oppervlak verouderd is geraakt.
9. Voer voor een getagde bètakandidaat `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` uit vanaf de bijbehorende branch `release/YYYY.M.PATCH`. Geef voor stabiel ook de vereiste Windows-bronrelease door: `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`. De helper gebruikt de vertrouwde `main` als workflowbron, terwijl elke workflow zich op de exacte tag richt. De helper legt de onveranderlijke identiteit van kandidaat en tooling en de ID's van gestarte uitvoeringen vast in `.artifacts/release-candidate/<tag>/release-candidate-state.json`; wanneer dezelfde opdracht opnieuw wordt uitgevoerd, worden precies die uitvoeringen hervat, terwijl elke afwijking in kandidaat, tooling, profiel of optie gesloten faalt. Voordat de volledige validatiematrix wordt gestart, rendert de helper deterministisch de exacte GitHub-release-inhoud van de tag en weigert deze een ontbrekende versiekop, inhoud die de limiet overschrijdt en waarvoor de canonieke compacte vorm niet kan worden gebruikt, of herkomstgegevens van basis en doel van bijdragegegevens die niet vanaf de tag bereikbaar zijn. Ook worden expliciete uitsluitingsmetadata voor de uitgebrachte basislijn gevalideerd aan de hand van de cumulatieve gegevens van de genoemde tags. Vervolgens voert de helper de lokale controles voor de gegenereerde release uit, start of verifieert deze volledige releasevalidatie en npm-preflightbewijs, voert deze een nieuwe installatie-/updatecontrole in Parallels uit voor het exact voorbereide tarball plus bewijs voor het Telegram-pakket, registreert deze de plannen voor Plugin-publicatie naar npm en ClawHub en drukt deze de exacte opdracht voor `OpenClaw Release Publish` pas af wanneer de bewijsbundel groen is.

   `OpenClaw Release Publish` stuurt de geselecteerde of alle publiceerbare Plugin-pakketten parallel naar npm en dezelfde verzameling naar ClawHub, en promoveert vervolgens het voorbereide npm-preflightartefact van OpenClaw met de bijbehorende dist-tag zodra de publicatie van de Plugins naar npm slaagt. De releasecheckout blijft de hoofdlocatie voor product en gegevens, terwijl planning en eindverificatie vanuit de exacte vertrouwde checkout van de workflowbron worden uitgevoerd, zodat een oudere releasecommit niet ongemerkt verouderde releasetooling kan gebruiken. Voordat een onderliggende publicatietaak start, wordt de exacte inhoud van de GitHub-release gerenderd en gecachet. Wanneer de volledige bijbehorende sectie van `CHANGELOG.md` binnen GitHubs limiet van 125.000 tekens en de bijbehorende veiligheidsgrens van 125.000 bytes van de renderer past, bevat de pagina exact die sectie `## YYYY.M.PATCH`, inclusief de kop. Wanneer de bronsectie niet past, behoudt de pagina exact de gegroepeerde redactionele opmerkingen en vervangt deze het te grote bijdrageoverzicht door een stabiele koppeling naar het volledige overzicht in de aan de tag vastgezette `CHANGELOG.md`; gedeeltelijke overzichten en afgekorte opsommingstekens worden nooit gepubliceerd. De workflow kiest die volledige of compacte inhoud voordat `### Release verification` wordt toegevoegd; als de bewijsstaart de limiet zou overschrijden, behoudt deze de canonieke inhoud en vertrouwt deze in plaats daarvan op het onveranderlijke bijgevoegde bewijs. Stabiele releases die naar npm `latest` worden gepubliceerd, worden de nieuwste GitHub-release, terwijl stabiele onderhoudsreleases die op npm `beta` blijven met GitHub `latest=false` worden aangemaakt. De workflow uploadt ook het preflightbewijs van afhankelijkheden, het manifest van de volledige validatie en verificatiebewijs van het register na publicatie naar de GitHub-release voor incidentrespons na de release. De workflow drukt de ID's van onderliggende uitvoeringen onmiddellijk af, keurt releaseomgevingspoorten die het workflowtoken mag goedkeuren automatisch goed, vat mislukte onderliggende taken samen met de laatste logregels, maakt vooraf de conceptpagina voor de GitHub-release aan en promoveert Windows- en Android-artefacten gelijktijdig met de publicatie van OpenClaw naar npm, voltooit de releasepagina en het afhankelijkheidsbewijs zodra die fasen slagen, wacht op ClawHub wanneer OpenClaw naar npm wordt gepubliceerd, voert vervolgens de bètaverificateur van de vertrouwde `main` uit en uploadt bewijs na publicatie voor de GitHub-release, het npm-pakket, de geselecteerde Plugin-pakketten op npm, de geselecteerde ClawHub-pakketten, ID's van onderliggende workflowuitvoeringen en de optionele ID van de NPM Telegram-uitvoering. De bootstrapverificateur van ClawHub vereist het exacte workflowpad en de exacte SHA van de vertrouwde `main`, de uitvoeringspogingen van producent en terminal, de release-SHA, de aangevraagde pakketverzameling, de onveranderlijke tuple van pakketartefacten en het artefact van de uiteindelijke teruglezing uit het register; een geslaagde verouderde uitvoering met een releaseverwijzing wordt niet geaccepteerd.

   Voer daarna de pakketacceptatie na publicatie uit voor het gepubliceerde pakket `openclaw@YYYY.M.PATCH-beta.N` of `openclaw@beta`. Als een gepushte of gepubliceerde prerelease een oplossing nodig heeft, maak dan het volgende bijbehorende prereleasenummer; verwijder of herschrijf het oude nummer nooit.

10. Ga voor stabiel alleen verder nadat de gecontroleerde bèta- of releasekandidaat over het vereiste validatiebewijs beschikt. Publicatie van een stabiele versie naar npm verloopt ook via `OpenClaw Release Publish`, waarbij het geslaagde preflightartefact via `preflight_run_id` opnieuw wordt gebruikt. Gereedheid van de stabiele macOS-release vereist ook de verpakte `.zip`, `.dmg`, `.dSYM.zip` en bijgewerkte `appcast.xml` op `main`; de macOS-publicatieworkflow publiceert de ondertekende appcast automatisch naar de openbare `main` nadat de releaseartefacten zijn geverifieerd, of opent/werkt een appcast-PR bij als branchbeveiliging de rechtstreekse push blokkeert. Gereedheid van de stabiele Windows Hub vereist de ondertekende artefacten `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` en `OpenClawCompanion-SHA256SUMS.txt` in de GitHub-release van OpenClaw. Geef de exacte releasetag van de ondertekende `openclaw/openclaw-windows-node` door als `windows_node_tag` en de door de kandidaat goedgekeurde digest-toewijzing van installatieprogramma's als `windows_node_installer_digests`; `OpenClaw Release Publish` behoudt het releaseconcept, start `Windows Node Release` en verifieert alle drie de artefacten vóór publicatie.
11. Voer na publicatie de npm-verificateur voor na publicatie uit, eventueel de zelfstandige Telegram-E2E voor de gepubliceerde npm-versie wanneer bewijs van het kanaal na publicatie nodig is, promoveer zo nodig de dist-tag, verifieer de gegenereerde GitHub-releasepagina, voer de stappen voor de releaseaankondiging uit en voltooi vervolgens [Afronding van stabiele main](#stable-main-closeout) voordat een stabiele release als voltooid wordt beschouwd.

## Afronding van stabiele main

De stabiele publicatie is pas voltooid wanneer `main` de werkelijk uitgebrachte releasestatus bevat.

1. Begin vanaf een nieuwe, meest recente `main`. Controleer `release/YYYY.M.PATCH` ten opzichte daarvan en forward-port echte oplossingen die in `main` ontbreken. Merge niet klakkeloos compatibiliteits-, test- of validatieadapters die alleen voor de release zijn bedoeld naar een nieuwere `main`.
2. Stel `main` in op de uitgebrachte stabiele versie, niet op een speculatieve volgende releasecyclus. Voer `pnpm release:prep` uit nadat de hoofdversie is gewijzigd en voer daarna `pnpm deps:shrinkwrap:generate` uit.
3. Zorg dat de sectie `## YYYY.M.PATCH` van `CHANGELOG.md` op `main` exact overeenkomt met de getagde releasebranch. Neem de stabiele update van `appcast.xml` op wanneer de Mac-release er een heeft gepubliceerd.
4. Voeg geen `YYYY.M.PATCH+1`, bètaversie of lege toekomstige changelogsectie toe aan `main` totdat de operator die releasecyclus expliciet start.
5. Voer `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` en `OPENCLAW_TESTBOX=1 pnpm check:changed` uit. Push en verifieer vervolgens dat `origin/main` de uitgebrachte versie en changelog bevat voordat de stabiele release als voltooid wordt beschouwd.
6. Houd de repositoryvariabelen `RELEASE_ROLLBACK_DRILL_ID` en `RELEASE_ROLLBACK_DRILL_DATE` actueel na elke besloten terugdraaioefening.

`OpenClaw Stable Main Closeout` begint bij de push naar `main` die na stabiele publicatie de uitgebrachte versie, changelog en appcast bevat. De workflow leest onveranderlijk bewijs van na publicatie om de uitgebrachte tag te koppelen aan de uitvoeringen van Full Release Validation en Publish, en verifieert vervolgens de stabiele status van main, de release, de verplichte stabiele observatieperiode en het blokkerende prestatiebewijs. De workflow voegt een onveranderlijk afrondingsmanifest en controlesom toe aan de GitHub-release. De automatische pushtrigger slaat verouderde releases over die dateren van vóór onveranderlijk bewijs van na publicatie en beschouwt dat overslaan nooit als een voltooide afronding.

Een volledige afronding vereist beide artefacten en een overeenkomende controlesom. Een gedeeltelijk manifest speelt de geregistreerde SHA van `main` en terugdraaioefening opnieuw af om identieke bytes te genereren en voegt vervolgens de ontbrekende controlesom toe; een ongeldig paar, of een controlesom zonder manifest, blijft blokkerend. Een door een push geactiveerde uitvoering zonder repositoryvariabelen voor de terugdraaioefening wordt overgeslagen zonder de afronding te voltooien; een ontbrekend of meer dan 90 dagen oud oefeningsrecord blokkeert ook handmatige, door bewijs onderbouwde afronding. Besloten herstelopdrachten blijven in het draaiboek dat alleen voor beheerders toegankelijk is. Gebruik handmatige activering alleen om een door bewijs onderbouwde stabiele afronding te herstellen of opnieuw af te spelen.

Een verouderde correctietag als terugvaloptie mag bewijs van het basispakket alleen hergebruiken wanneer de correctietag naar dezelfde broncommit verwijst als de stabiele basistag. De Android-release ervan hergebruikt de geverifieerde APK van de basistag en voegt herkomstgegevens voor de correctietag toe. Een correctie met een andere bron moet eigen pakketbewijs publiceren en verifiëren en een hogere Android-`versionCode` gebruiken.

## Releasepreflight

- Voer `pnpm check:test-types` uit vóór de releasevoorcontrole, zodat TypeScript voor tests ook buiten de snellere lokale `pnpm check`-controle wordt afgedekt.
- Voer `pnpm check:architecture` uit vóór de releasevoorcontrole, zodat de bredere controles op importcycli en architectuurgrenzen ook buiten de snellere lokale controle slagen.
- Voer `pnpm build && pnpm ui:build` uit vóór `pnpm release:check`, zodat de verwachte `dist/*`-releaseartefacten en de Control UI-bundel bestaan voor de pakketvalidatiestap.
- Voer `pnpm release:prep` uit nadat de hoofdversie is verhoogd en vóór het taggen. Hiermee wordt elke deterministische releasegenerator uitgevoerd die vaak afwijkt na een wijziging in versie, configuratie of API: pluginversies, npm-shrinkwraps, plugininventaris, basisschema voor configuratie, gebundelde configuratiemetadata voor kanalen, basislijn voor configuratiedocumentatie, exports van de plugin-SDK en de API-basislijn van de plugin-SDK. `pnpm release:check` voert deze controles opnieuw uit in controlemodus (plus een budgetcontrole voor het oppervlak van de plugin-SDK) en rapporteert alle afwijkingen in gegenereerde bestanden in één keer voordat de pakketreleas controles worden uitgevoerd.
- De synchronisatie van pluginversies werkt standaard het publiceerbare runtimepakket `@openclaw/ai`, de pakketversies van officiële plugins en bestaande ondergrenzen voor `openclaw.compat.pluginApi` bij naar de OpenClaw-releaseversie. Behandel dat veld als de minimale plugin-SDK/runtime-API-versie, niet alleen als een kopie van de pakketversie: voor releases die uitsluitend plugins betreffen en bewust compatibel blijven met oudere OpenClaw-hosts, behoudt u als ondergrens de oudste ondersteunde host-API en documenteert u die keuze in het releasebewijs van de plugin.
- Voer vóór releasegoedkeuring de handmatige workflow `Full Release Validation` uit om alle testomgevingen vóór de release vanuit één toegangspunt te starten. Deze accepteert een branch, tag of volledige commit-SHA, start handmatig `CI` en start `OpenClaw Release Checks` voor installatie-smoketests, pakketacceptatie, pakketcontroles voor meerdere besturingssystemen, pariteit met QA Lab, Matrix en Telegram-trajecten. Stabiele en volledige uitvoeringen bevatten altijd uitvoerige live-/E2E-validatie en langdurige Docker-tests van het releasepad; `run_release_soak=true` blijft beschikbaar voor een expliciete langdurige bètatest. Package Acceptance levert tijdens kandidaatvalidatie de canonieke Telegram-E2E voor het pakket, zodat een tweede gelijktijdige live-poller niet nodig is.

  Geef na publicatie van een bèta `release_package_spec` op om het uitgebrachte npm-pakket opnieuw te gebruiken voor releasecontroles, Package Acceptance en Telegram-E2E voor het pakket, zonder het release-tararchief opnieuw te bouwen. Geef `npm_telegram_package_spec` alleen op wanneer Telegram een ander gepubliceerd pakket moet gebruiken dan de rest van de releasevalidatie. Geef `package_acceptance_package_spec` op wanneer Package Acceptance een ander gepubliceerd pakket moet gebruiken dan de pakketspecificatie van de release. Geef `evidence_package_spec` op wanneer het releasebewijsrapport moet aantonen dat de validatie overeenkomt met een gepubliceerd npm-pakket zonder Telegram-E2E af te dwingen.

  ```bash
  gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH
  ```

- Voer de handmatige workflow `Package Acceptance` uit wanneer u aanvullend bewijs voor een pakketkandidaat wilt terwijl de releasewerkzaamheden doorgaan. Gebruik `source=npm` voor `openclaw@beta`, `openclaw@latest` of een exacte releaseversie; `source=ref` om een vertrouwde `package_ref`-branch, -tag of -SHA te verpakken met de huidige `workflow_ref`-testinfrastructuur; `source=url` voor een openbaar HTTPS-tararchief met een verplichte SHA-256 en een strikt beleid voor openbare URL's; `source=trusted-url` voor een benoemd beleid voor vertrouwde bronnen met een verplichte `trusted_source_id` en SHA-256; of `source=artifact` voor een tararchief dat door een andere GitHub Actions-uitvoering is geüpload.

  De workflow zet de kandidaat om in `package-under-test`, gebruikt de Docker-E2E-releaseplanner opnieuw voor dat tararchief en kan Telegram-QA uitvoeren voor hetzelfde tararchief met `telegram_mode=mock-openai` of `telegram_mode=live-frontier`. Wanneer de geselecteerde Docker-trajecten `published-upgrade-survivor` bevatten, is het pakketartefact de kandidaat en selecteert `published_upgrade_survivor_baseline` de gepubliceerde basislijn. `update-restart-auth` gebruikt het kandidaatpakket zowel als geïnstalleerde CLI als `package-under-test`, zodat het beheerde herstartpad van de updateopdracht van de kandidaat wordt getest.

  Voorbeeld:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Veelgebruikte profielen:
  - `smoke`: trajecten voor installatie/kanaal/agent, Gateway-netwerk en het opnieuw laden van configuratie
  - `package`: pakket-, update-, herstart- en plugintrajecten die rechtstreeks met artefacten werken, zonder OpenWebUI of live ClawHub
  - `product`: pakketprofiel plus MCP-kanalen, opschoning van cron/subagents, OpenAI-zoekopdrachten op het web en OpenWebUI
  - `full`: delen van het Docker-releasepad met OpenWebUI
  - `custom`: exacte selectie van `docker_lanes` voor een gerichte heruitvoering

- Voer de handmatige workflow `CI` rechtstreeks uit wanneer u alleen deterministische, normale CI-dekking voor de releasekandidaat nodig hebt. Handmatig gestarte CI-uitvoeringen omzeilen de afbakening op basis van wijzigingen en dwingen de Linux Node-shards, shards voor gebundelde plugins, contractshards voor plugins en kanalen, compatibiliteit met Node 22, `check-*`, `check-additional-*`, smoketests voor gebouwde artefacten, documentatiecontroles, Python-Skills, Windows, macOS en Control UI-i18n-trajecten af. Zelfstandige handmatige CI-uitvoeringen voeren Android alleen uit wanneer ze worden gestart met `include_android=true`; `Full Release Validation` geeft deze invoer door aan de onderliggende CI-uitvoering.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Voer `pnpm qa:otel:smoke` uit bij het valideren van releasetelemetrie. Dit test QA Lab via een lokale OTLP/HTTP-ontvanger en verifieert de export van traces, metrische gegevens en logboeken, evenals begrensde tracekenmerken en het redigeren van inhoud en identificatoren, zonder Opik, Langfuse of een andere externe collector te vereisen.
- Voer `pnpm qa:otel:collector-smoke` uit bij het valideren van compatibiliteit met collectors. Dit leidt dezelfde OTLP-export van QA Lab door een echte OpenTelemetry Collector-Dockercontainer voordat de controles van de lokale ontvanger worden uitgevoerd.
- Voer `pnpm qa:prometheus:smoke` uit bij het valideren van beveiligde Prometheus-scraping. Dit test QA Lab, weigert niet-geverifieerde scrapeverzoeken en verifieert dat voor de release essentiële families van metrische gegevens vrij blijven van promptinhoud, onbewerkte identificatoren, authenticatietokens en lokale paden.
- Voer `pnpm qa:observability:smoke` uit om de OpenTelemetry- en Prometheus-smoketrajecten voor een broncodecheckout achter elkaar uit te voeren.
- Voer `pnpm release:check` uit vóór elke getagde release.
- De voorcontrole van `OpenClaw NPM Release` genereert releasebewijs voor afhankelijkheden voordat het npm-tararchief wordt verpakt. De beveiligingscontrole voor kwetsbaarheden uit npm-adviezen blokkeert de release bij fouten. De rapporten over risico's in transitieve manifests, eigenaarschap/installatieoppervlak van afhankelijkheden en wijzigingen in afhankelijkheden dienen alleen als releasebewijs. Het rapport over wijzigingen in afhankelijkheden vergelijkt de releasekandidaat met de vorige bereikbare releasetag. De voorcontrole uploadt het afhankelijkheidsbewijs als `openclaw-release-dependency-evidence-<tag>` en neemt het ook op onder `dependency-evidence/` in het voorbereide npm-voorcontroleartefact. Het daadwerkelijke publicatiepad gebruikt dat voorcontroleartefact opnieuw en voegt vervolgens hetzelfde bewijs toe aan de GitHub-release als `openclaw-<version>-dependency-evidence.zip`.
- Voer `OpenClaw Release Publish` uit voor de publicatiereeks die wijzigingen aanbrengt nadat de tag bestaat. Start reguliere bèta- en stabiele publicaties vanuit het vertrouwde `main`; de releasetag selecteert nog steeds de exacte doelcommit en mag naar `release/YYYY.M.PATCH` verwijzen. Tideclaw-alfapublicaties blijven op hun bijbehorende alfabranche. Geef de succesvolle `preflight_run_id` van OpenClaw npm, de succesvolle `full_release_validation_run_id` en de exacte `full_release_validation_run_attempt` door en behoud het standaardpublicatiebereik voor plugins `all-publishable`, tenzij u bewust een gerichte reparatie uitvoert. De workflow voert de npm-publicatie van plugins, de ClawHub-publicatie van plugins en de npm-publicatie van OpenClaw na elkaar uit, zodat het kernpakket niet wordt gepubliceerd vóór de geëxternaliseerde plugins; promotie voor Windows en Android wordt gelijktijdig met de npm-publicatie van de kern uitgevoerd voor de conceptreleasepagina. Heruitvoeringen van publicaties kunnen worden hervat: bij een reeds gepubliceerde versie van het npm-kernpakket wordt het starten van de kern overgeslagen nadat de workflow heeft aangetoond dat het tararchief in het register overeenkomt met het voorcontroleartefact van de tag. Promotie voor Windows/Android wordt overgeslagen wanneer de release al de geverifieerde artefactovereenkomst bevat, zodat bij een nieuwe poging alleen de mislukte fasen opnieuw worden uitgevoerd. Gerichte reparaties van uitsluitend plugins vereisen `plugin_publish_scope=selected` en een niet-lege lijst met plugins. Uitvoeringen van uitsluitend plugins met `all-publishable` vereisen volledig, onveranderlijk bewijs van de voorcontrole en Full Release Validation; gedeeltelijk bewijs wordt geweigerd.
- Voor een stabiele uitvoering van `OpenClaw Release Publish` is een exacte `windows_node_tag` vereist nadat de overeenkomstige niet-voorlopige release van `openclaw/openclaw-windows-node` bestaat, plus de door de kandidaatgoedkeuring vastgestelde `windows_node_installer_digests`-toewijzing. Voordat een onderliggende publicatieworkflow wordt gestart, wordt geverifieerd dat die bronrelease is gepubliceerd, geen voorlopige release is, de vereiste x64-/ARM64-installatieprogramma's bevat en nog steeds overeenkomt met die goedgekeurde toewijzing. Vervolgens wordt `Windows Node Release` gestart terwijl de OpenClaw-release nog een concept is, waarbij de vastgezette toewijzing van installatieprogrammadigests ongewijzigd wordt doorgegeven. De onderliggende workflow downloadt de ondertekende Windows Hub-installatieprogramma's van die exacte tag, vergelijkt deze met de vastgezette digests, verifieert op een Windows-runner dat hun Authenticode-handtekeningen de verwachte ondertekenaar van OpenClaw Foundation gebruiken, schrijft een SHA-256-manifest en uploadt de installatieprogramma's plus het manifest naar de canonieke OpenClaw-GitHub-release. Daarna worden de gepromoveerde artefacten opnieuw gedownload en worden het lidmaatschap van het manifest en de hashes geverifieerd. De bovenliggende workflow verifieert vóór publicatie de huidige overeenkomst voor x64-, ARM64- en controlesomartefacten. Rechtstreeks herstel weigert onverwachte artefactnamen die overeenkomen met `OpenClawCompanion-*` voordat de verwachte overeenkomstartefacten worden vervangen door de vastgezette bronbytes.

  Start `Windows Node Release` alleen handmatig voor herstel en geef altijd een exacte tag door, nooit `latest`, plus de expliciete JSON-toewijzing `expected_installer_digests` uit de goedgekeurde bronrelease. Downloadlinks op de website moeten verwijzen naar exacte URL's van OpenClaw-releaseartefacten voor de huidige stabiele release, of alleen naar `releases/latest/download/...` nadat is geverifieerd dat de omleiding van GitHub voor de nieuwste release naar diezelfde release verwijst; link niet uitsluitend naar de releasepagina van de begeleidende repository.

- Releasecontroles worden nu uitgevoerd in een afzonderlijke handmatige workflow: `OpenClaw Release Checks`. Deze voert vóór releasegoedkeuring ook de QA Lab-lane voor pariteit met mocks uit, plus het snelle live Matrix-profiel en de Telegram-QA-lane. De live-lanes gebruiken de omgeving `qa-live-shared`; Telegram gebruikt daarnaast Convex-CI-leases voor inloggegevens. Voer de handmatige workflow `QA-Lab - All Lanes` uit met `matrix_profile=all` en `matrix_shards=true` wanneer je de volledige inventaris voor Matrix-transport, media en E2EE parallel wilt uitvoeren.
- Runtimevalidatie van installatie en upgrades op meerdere besturingssystemen maakt deel uit van de openbare workflows `OpenClaw Release Checks` en `Full Release Validation`, die de herbruikbare workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` rechtstreeks aanroepen. Deze splitsing is opzettelijk: houd het echte npm-releasepad kort, deterministisch en gericht op artefacten, terwijl tragere live-controles in hun eigen lane blijven zodat ze publicatie niet vertragen of blokkeren.
- Releasecontroles die geheimen gebruiken, moeten via `Full Release Validation` of vanaf de workflowreferentie van `main`/de release worden gestart, zodat de workflowlogica en geheimen onder controle blijven.
- `OpenClaw Release Checks` accepteert een branch, tag of volledige commit-SHA, mits de herleide commit bereikbaar is vanaf een OpenClaw-branch of releasetag.
- De uitsluitend voor validatie bedoelde preflight van `OpenClaw NPM Release` accepteert ook de huidige volledige workflowbranch-commit-SHA van 40 tekens zonder een gepushte tag te vereisen. Dat SHA-pad is uitsluitend voor validatie en kan niet worden gepromoveerd tot een echte publicatie. In SHA-modus genereert de workflow alleen voor de controle van pakketmetadata `v<package.json version>`; voor echte publicatie blijft een echte releasetag vereist.
- Beide workflows houden het echte publicatie- en promotiepad op door GitHub gehoste runners, terwijl het niet-wijzigende validatiepad de grotere Blacksmith Linux-runners kan gebruiken.
- Die workflow voert `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` uit met zowel de workflowgeheimen `OPENAI_API_KEY` als `ANTHROPIC_API_KEY`.
- De npm-releasepreflight wacht niet langer op de afzonderlijke lane voor releasecontroles.
- Voer vóór het lokaal taggen van een release candidate `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check` uit. De helper voert de snelle releasewaarborgen, releasecontroles voor Plugin-npm/ClawHub, de build, de UI-build en `release:openclaw:npm:check` uit in de volgorde waarin veelvoorkomende fouten die goedkeuring blokkeren worden ontdekt voordat de GitHub-publicatieworkflow begint.
- Voer vóór goedkeuring `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` uit (of de overeenkomende prerelease-/correctietag).
- Voer na npm-publicatie `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` uit (of de overeenkomende bèta-/correctieversie) om het installatiepad vanuit het gepubliceerde register in een nieuw tijdelijk prefix te verifiëren.
- Voer na een bètapublicatie `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` uit om onboarding van het geïnstalleerde pakket, de Telegram-configuratie en echte Telegram-E2E voor het gepubliceerde npm-pakket te verifiëren met de gedeelde pool van geleasete Telegram-inloggegevens. Voor eenmalige lokale controles door beheerders mogen de Convex-variabelen worden weggelaten en kunnen de drie `OPENCLAW_QA_TELEGRAM_*`-omgevingsinloggegevens rechtstreeks worden doorgegeven.
- Gebruik `pnpm release:beta-smoke -- --beta betaN` om de volledige smoke-test na publicatie van een bèta vanaf een beheerdersmachine uit te voeren. De helper voert Parallels-validatie voor npm-updates en nieuwe doelen uit, start `NPM Telegram Beta E2E`, controleert periodiek de exacte workflowuitvoering, downloadt het artefact en drukt het Telegram-rapport af.
- Beheerders kunnen dezelfde controle na publicatie vanuit GitHub Actions uitvoeren via de handmatige workflow `NPM Telegram Beta E2E`. Deze is bewust uitsluitend handmatig en wordt niet bij elke merge uitgevoerd.
- Releaseautomatisering voor beheerders gebruikt eerst preflight en daarna promotie:
  - Een echte npm-publicatie moet een geslaagde npm-`preflight_run_id` hebben.
  - De orkestratie en preflight voor reguliere bèta- en stabiele publicaties gebruiken vertrouwd `main` voor de exacte doeltag. Publicatie en preflight voor Tideclaw-alpha gebruiken de overeenkomende alphabranch.
  - Stabiele npm-releases gebruiken standaard `beta`; een stabiele npm-publicatie kan via workflowinvoer expliciet op `latest` worden gericht.
  - Mutatie van npm-distributietags op basis van tokens bevindt zich in `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, omdat `npm dist-tag add` nog steeds `NPM_TOKEN` vereist terwijl de bronrepository uitsluitend via OIDC publiceert.
  - De openbare workflow `macOS Release` is uitsluitend voor validatie; wanneer een tag alleen op een releasebranch staat maar de workflow vanaf `main` wordt gestart, stel je `public_release_branch=release/YYYY.M.PATCH` in.
  - Een echte macOS-publicatie moet een geslaagde macOS-`preflight_run_id` en `validate_run_id` hebben.
  - Echte publicatiepaden promoveren voorbereide artefacten in plaats van ze opnieuw te bouwen.
- Voor stabiele correctiereleases zoals `YYYY.M.PATCH-N` controleert de verificatie na publicatie ook hetzelfde upgradepad met tijdelijk prefix van `YYYY.M.PATCH` naar `YYYY.M.PATCH-N`, zodat releasecorrecties oudere globale installaties niet ongemerkt op de basispayload van de stabiele release kunnen achterlaten.
- De npm-releasepreflight faalt gesloten tenzij de tarball zowel `dist/control-ui/index.html` als een niet-lege payload in `dist/control-ui/assets/` bevat, zodat we niet opnieuw een leeg browserdashboard uitbrengen.
- Verificatie na publicatie controleert ook of gepubliceerde Plugin-ingangspunten en pakketmetadata aanwezig zijn in de geïnstalleerde registerindeling. Een release waarin runtimepayloads van Plugins ontbreken, faalt in de verificatie na publicatie en kan niet naar `latest` worden gepromoveerd.
- `pnpm test:install:smoke` handhaaft ook het npm-pack-budget voor `unpackedSize` op de kandidaat-updatetarball, zodat installer-E2E onbedoelde pakketgroei detecteert voordat het publicatiepad van de release begint.
- Als het releasewerk CI-planning, timingmanifesten van extensies of testmatrices van extensies heeft gewijzigd, genereer en controleer dan vóór goedkeuring opnieuw de door de planner beheerde matrixuitvoer `plugin-prerelease-extension-shard` uit `.github/workflows/plugin-prerelease.yml`, zodat de releaseopmerkingen geen verouderde CI-indeling beschrijven.
- Gereedheid voor een stabiele macOS-release omvat ook de updateroppervlakken: de GitHub-release moet uiteindelijk de verpakte `.zip`, `.dmg` en `.dSYM.zip` bevatten; `appcast.xml` op `main` moet na publicatie naar de nieuwe stabiele zip verwijzen (de macOS-publicatieworkflow commit dit automatisch of opent een appcast-PR wanneer rechtstreeks pushen is geblokkeerd); de verpakte app moet een niet-debug-bundel-id, een niet-lege Sparkle-feed-URL en een `CFBundleVersion` op of boven de canonieke minimale Sparkle-build voor die releaseversie behouden.

## Testmachines voor releases

`Full Release Validation` is het centrale ingangspunt waarmee beheerders alle tests vóór een release starten. Gebruik voor bewijs van een vastgezette commit op een snel veranderende branch de helper, zodat elke onderliggende workflow wordt uitgevoerd vanaf een tijdelijke branch die is vastgezet op één vertrouwde workflow-SHA van `main`, terwijl de aangevraagde commit de geteste kandidaat blijft:

```bash
pnpm ci:full-release --sha <full-sha>
```

De helper haalt de huidige `origin/main` op, pusht `release-ci/<workflow-sha>-...` op die vertrouwde workflowcommit, start `Full Release Validation` vanaf de tijdelijke branch met `ref=<target-sha>`, hergebruikt waar beschikbaar strikt bewijs voor exact hetzelfde doel, verifieert dat de `headSha` van elke onderliggende workflow overeenkomt met de vastgezette SHA van de bovenliggende workflow en verwijdert daarna de tijdelijke branch. Geef `-f reuse_evidence=false` door om een nieuwe uitvoering af te dwingen, of `--workflow-sha <trusted-main-sha>` om een oudere commit vast te zetten die nog steeds bereikbaar is vanaf de huidige `origin/main`. De workflow zelf schrijft nooit repositoryreferenties. Zo blijft releasegereedschap dat alleen op `main` beschikbaar is bruikbaar zonder gereedschapscommits aan de kandidaat toe te voegen en wordt voorkomen dat per ongeluk een nieuwere onderliggende uitvoering van `main` als bewijs dient.

Voer validatie van een releasebranch of tag uit vanaf de vertrouwde workflowreferentie `main` en geef de releasebranch of tag door als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

De workflow herleidt de doelreferentie, start handmatig `CI` met `target_ref=<release-ref>` en start vervolgens `OpenClaw Release Checks`. `OpenClaw Release Checks` vertakt naar een smoke-test voor installatie, releasecontroles op meerdere besturingssystemen, live-/E2E-Dockerdekking van het releasepad wanneer langdurige validatie is ingeschakeld, pakketacceptatie met de canonieke Telegram-pakket-E2E, QA Lab-pariteit, live Matrix en live Telegram. Een volledige uitvoering met alle onderdelen is alleen aanvaardbaar wanneer de samenvatting van `Full Release Validation` `normal_ci`, `plugin_prerelease` en `release_checks` als geslaagd toont, tenzij bij een gerichte heruitvoering bewust de afzonderlijke onderliggende workflow `Plugin Prerelease` is overgeslagen. Gebruik de zelfstandige onderliggende workflow `npm-telegram` alleen voor een gerichte heruitvoering van een gepubliceerd pakket met `release_package_spec` of `npm_telegram_package_spec`. De uiteindelijke verificatiesamenvatting bevat tabellen met de langzaamste taken voor elke onderliggende uitvoering, zodat de releasebeheerder het huidige kritieke pad kan zien zonder logboeken te downloaden.

Het onderliggende onderdeel voor productprestaties levert in dit releasepad uitsluitend artefacten op. De overkoepelende workflow start dit met `publish_reports=false`, en de validatie wordt afgewezen tenzij de bewaking voor uitsluitend artefacten bewijst dat de Clawgrit-rapportpublicatie overgeslagen bleef.

Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de volledige fasematrix, exacte namen van workflowtaken, verschillen tussen stabiele en volledige profielen, artefacten en mogelijkheden voor gerichte heruitvoering.

Onderliggende workflows worden gestart vanaf de vertrouwde referentie waarop `Full Release Validation` draait, normaal gesproken `--ref main`, zelfs wanneer de doel-`ref` naar een oudere releasebranch of tag verwijst. Elke onderliggende uitvoering moet de exacte SHA van de bovenliggende workflow gebruiken; als `main` verandert voordat het starten van een onderliggende workflow is afgerond, faalt de overkoepelende workflow gesloten. Er is geen afzonderlijke invoer voor de workflowreferentie van Full Release Validation; kies het vertrouwde harnas door de referentie van de workflowuitvoering te kiezen. Gebruik niet `--ref main -f ref=<sha>` als exact commitbewijs op een veranderend `main`; onbewerkte commit-SHA's kunnen geen workflow-dispatchreferenties zijn. Gebruik daarom `pnpm ci:full-release --sha <target-sha>` om een tijdelijke branch op vertrouwd `origin/main` te maken, terwijl de doel-SHA als kandidaatinvoer behouden blijft.

Gebruik `release_profile` om de breedte van live-/providerdekking te selecteren:

- `minimum`: snelste releasekritieke live- en Dockerpad voor OpenAI/core
- `stable`: minimum plus stabiele provider-/backenddekking voor releasegoedkeuring
- `full`: stabiel plus brede adviserende dekking voor providers/media

Stabiele en volledige validatie voeren vóór promotie altijd de uitputtende live-/E2E-controles, het Docker-releasepad en de begrensde controle van gepubliceerde upgrades uit. Gebruik `run_release_soak=true` om dezelfde controle voor een bèta aan te vragen. Deze controle omvat de vier nieuwste stabiele pakketten, plus de vastgezette basisversies `2026.4.23` en `2026.5.2`, plus dekking voor de oudere versie `2026.4.15`; dubbele basisversies worden verwijderd en elke basisversie wordt opgesplitst naar een eigen Docker-runnertaak.

`OpenClaw Release Checks` gebruikt de vertrouwde workflowreferentie om de doelreferentie eenmaal als `release-package-under-test` te herleiden en hergebruikt dat artefact in controles voor meerdere besturingssystemen, pakketacceptatie en Dockercontroles van het releasepad wanneer langdurige validatie wordt uitgevoerd. Hierdoor gebruiken alle pakketgerichte testmachines exact dezelfde bytes en worden herhaalde pakketbuilds voorkomen. Nadat een bèta al op npm staat, stel je `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` in, zodat releasecontroles het uitgebrachte pakket eenmaal downloaden, de SHA van de buildbron uit `dist/build-info.json` extraheren en dat artefact hergebruiken voor meerdere besturingssystemen, pakketacceptatie, releasepad-Docker en Telegram-pakketlanes.

De OpenAI-installatiesmoke-test op meerdere besturingssystemen gebruikt `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer de repository-/organisatievariabele is ingesteld, en anders `openai/gpt-5.6-luna`, omdat deze lane pakketinstallatie, onboarding, het starten van de Gateway en één live agentuitvoering bewijst in plaats van het krachtigste model te benchmarken. De bredere live-providermatrix blijft de plaats voor modelspecifieke dekking.

Gebruik afhankelijk van de releasefase deze varianten:

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

Gebruik de volledige overkoepelende workflow niet als eerste nieuwe uitvoering na een gerichte oplossing. Als één omgeving faalt, gebruik dan voor het volgende bewijs de mislukte onderliggende workflow, taak, Docker-lane, het pakketprofiel, de modelprovider of de QA-lane. Voer de volledige overkoepelende workflow alleen opnieuw uit wanneer de oplossing de gedeelde releaseorkestratie heeft gewijzigd of eerder bewijs voor alle omgevingen ongeldig heeft gemaakt. De laatste verifier van de overkoepelende workflow controleert de vastgelegde uitvoerings-ID's van de onderliggende workflows opnieuw. Nadat een onderliggende workflow met succes opnieuw is uitgevoerd, voer je daarom alleen de mislukte bovenliggende taak `Verify full validation` opnieuw uit.

`rerun_group=all` mag een eerdere geslaagde uitvoering van de overkoepelende workflow alleen hergebruiken wanneer deze exact dezelfde doel-SHA, hetzelfde releaseprofiel, dezelfde effectieve soak-instelling en dezelfde validatie-invoer heeft gevalideerd. Dit is begrensd herstel voor het opnieuw uitvoeren van dezelfde kandidaat, niet voor hergebruik van bewijs tussen verschillende SHA's. Voer voor een gewijzigde kandidaat, waaronder een commit die alleen het wijzigingslogboek of de versie wijzigt, elke pakket-, artefact-, installatie-, Docker- of providergate opnieuw uit die door de gewijzigde paden of artefacthashes wordt beïnvloed. Nieuwere uitvoeringen van de overkoepelende workflow voor dezelfde `release/*`-ref en heruitvoeringsgroep vervangen automatisch uitvoeringen die nog bezig zijn. Geef `reuse_evidence=false` door om een volledig nieuwe uitvoering af te dwingen.

Geef voor begrensd herstel `rerun_group` door aan de overkoepelende workflow. `all` is de echte uitvoering voor de releasekandidaat, `ci` voert alleen de normale onderliggende CI-workflow uit, `plugin-prerelease` voert alleen de uitsluitend voor releases bedoelde onderliggende Plugin-workflow uit, `release-checks` voert elke releaseomgeving uit en de kleinere releasegroepen zijn `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` en `npm-telegram`. Gerichte nieuwe uitvoeringen van `npm-telegram` vereisen `release_package_spec` of `npm_telegram_package_spec`; volledige uitvoeringen en uitvoeringen met `all` gebruiken de canonieke Telegram-E2E voor pakketten binnen Package Acceptance. Aan gerichte nieuwe uitvoeringen voor meerdere besturingssystemen kan `cross_os_suite_filter=windows/packaged-upgrade` of een ander besturingssysteem-/suitefilter worden toegevoegd. Mislukkingen van QA-releasecontroles blokkeren de normale releasevalidatie, waaronder vereiste drift van dynamische OpenClaw-tools in de standaardlaag. Tideclaw-alpha-uitvoeringen mogen releasecontrolelanes die niet over pakketveiligheid gaan nog steeds als adviserend behandelen. Met `release_profile=beta` zijn de liveprovidersuites van `Run repo/live E2E validation` adviserend (waarschuwingen, geen blokkades); bij de profielen stable en full blijven ze blokkerend. Wanneer `live_suite_filter` expliciet een afgeschermde live QA-lane aanvraagt, zoals Discord, WhatsApp of Slack, moet de bijbehorende repositoryvariabele `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` zijn ingeschakeld; anders mislukt het vastleggen van de invoer in plaats van dat de lane stilzwijgend wordt overgeslagen.

### Vitest

De Vitest-omgeving is de handmatige onderliggende workflow `CI`. Handmatige CI omzeilt opzettelijk de afbakening op basis van wijzigingen en dwingt de normale testgrafiek voor de releasekandidaat af: Linux Node-shards, shards voor gebundelde Plugins, contractshards voor Plugins en kanalen, compatibiliteit met Node 22, `check-*`, `check-additional-*`, smokecontroles voor gebouwde artefacten, documentatiecontroles, Python Skills, Windows, macOS en Control UI-i18n. Android wordt meegenomen wanneer `Full Release Validation` deze omgeving uitvoert, omdat de overkoepelende workflow `include_android=true` doorgeeft; zelfstandige handmatige CI vereist `include_android=true` voor Android-dekking.

Gebruik deze omgeving om de vraag te beantwoorden: "Is de broncodeboom geslaagd voor de volledige normale testsuite?" Dit is niet hetzelfde als productvalidatie van het releasepad. Te bewaren bewijs:

- samenvatting van `Full Release Validation` met de URL van de gestarte `CI`-uitvoering
- geslaagde `CI`-uitvoering op exact de doel-SHA
- namen van mislukte of trage shards uit de CI-taken bij het onderzoeken van regressies
- Vitest-tijdartefacten zoals `.artifacts/vitest-shard-timings.json` wanneer voor een uitvoering prestatieanalyse nodig is

Voer handmatige CI alleen rechtstreeks uit wanneer de release deterministische normale CI nodig heeft, maar niet de Docker-, QA Lab-, live-, cross-OS- of pakketomgevingen. Gebruik de eerste opdracht voor rechtstreekse CI zonder Android. Voeg `include_android=true` toe wanneer rechtstreekse CI voor een releasekandidaat Android moet omvatten:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

De Docker-omgeving bevindt zich in `OpenClaw Release Checks` via `openclaw-live-and-e2e-checks-reusable.yml`, samen met de `install-smoke`-workflow in releasemodus. Deze valideert de releasekandidaat via verpakte Docker-omgevingen in plaats van uitsluitend met tests op bronniveau.

Docker-dekking voor releases omvat:

- volledige installatiesmokecontrole met de trage algemene installatie-smokecontrole voor Bun ingeschakeld
- voorbereiding/hergebruik van de smoke-image van het Dockerfile in de hoofdmap per doel-SHA, waarbij de QR-, root/Gateway- en installer/Bun-smoketaken als afzonderlijke installatiesmoke-shards worden uitgevoerd
- E2E-lanes voor de repository
- Docker-segmenten voor het releasepad: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` tot en met `plugins-runtime-install-h` en `openwebui`
- OpenWebUI-dekking op een speciale runner met veel schijfruimte wanneer daarom wordt gevraagd
- opgesplitste installatie-/verwijderingslanes voor gebundelde Plugins, van `bundled-plugin-install-uninstall-0` tot en met `bundled-plugin-install-uninstall-23`
- live-/E2E-providersuites en Docker-dekking voor live modellen wanneer releasecontroles live suites omvatten

Gebruik Docker-artefacten voordat je een nieuwe uitvoering start. De planner voor het releasepad uploadt `.artifacts/docker-tests/` met lanelogboeken, `summary.json`, `failures.json`, fasetijden, de JSON van het plannerplan en opdrachten voor nieuwe uitvoeringen. Gebruik voor gericht herstel `docker_lanes=<lane[,lane]>` in de herbruikbare live-/E2E-workflow in plaats van alle releasesegmenten opnieuw uit te voeren. Gegenereerde opdrachten voor nieuwe uitvoeringen bevatten waar beschikbaar de eerdere `package_artifact_run_id` en invoer voor voorbereide Docker-images, zodat een mislukte lane dezelfde tarball en GHCR-images kan hergebruiken.

### QA Lab

De QA Lab-omgeving maakt ook deel uit van `OpenClaw Release Checks`. Dit is de releasegate voor agentisch gedrag en gedrag op kanaalniveau, los van Vitest en de mechanica van Docker-pakketten.

De QA Lab-dekking voor releases omvat:

- een mockpariteitslane die de OpenAI-kandidaatlane vergelijkt met de `anthropic/claude-opus-4-8`-basislijn met behulp van het agentische pariteitspakket
- een snel live Matrix-QA-profiel dat de omgeving `qa-live-shared` gebruikt
- een live Telegram-QA-lane die Convex CI-leases voor referenties gebruikt
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` of `pnpm qa:observability:smoke` wanneer releasetelemetrie expliciet lokaal bewijs vereist

Gebruik deze omgeving om de vraag te beantwoorden: "Gedraagt de release zich correct in QA-scenario's en live kanaalstromen?" Bewaar bij goedkeuring van de release de artefact-URL's voor de pariteits-, Matrix- en Telegram-lanes. Volledige Matrix-dekking blijft beschikbaar als een handmatig uitgevoerde QA Lab-workflow met shards, in plaats van als de standaard releasekritieke lane.

### Pakket

De pakketomgeving is de gate voor het installeerbare product. Deze wordt ondersteund door `Package Acceptance` en de resolver `scripts/resolve-openclaw-package-candidate.mjs`. De resolver normaliseert een kandidaat tot de tarball `package-under-test` die door Docker-E2E wordt gebruikt, valideert de pakketinhoud, legt de pakketversie en SHA-256 vast en houdt de workflow-harnasref gescheiden van de bronref van het pakket.

Ondersteunde kandidaatbronnen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` of een exacte OpenClaw-releaseversie
- `source=ref`: verpak een vertrouwde `package_ref`-branch, tag of volledige commit-SHA met het geselecteerde `workflow_ref`-harnas
- `source=url`: download een openbare HTTPS-`.tgz` met verplichte `package_sha256`; URL-referenties, afwijkende HTTPS-poorten, private/interne hostnamen of hostnamen voor speciaal gebruik, opgeloste adressen en onveilige omleidingen worden geweigerd
- `source=trusted-url`: download een HTTPS-`.tgz` met verplichte `package_sha256` en `trusted_source_id` uit een benoemd beleid in `.github/package-trusted-sources.json`; gebruik dit voor door beheerders beheerde bedrijfsmirrors of private pakketrepository's in plaats van een omzeiling voor private netwerken op invoerniveau toe te voegen aan `source=url`
- `source=artifact`: hergebruik een `.tgz` die door een andere GitHub Actions-uitvoering is geüpload

`OpenClaw Release Checks` voert Package Acceptance uit met `source=artifact`, het voorbereide releasepakketartefact, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai`. Package Acceptance behoudt migratie, updates, VPS-upgrades die door root worden beheerd, herstarts na updates met geconfigureerde authenticatie, installatie van live ClawHub-Skills, opschoning van verouderde Plugin-afhankelijkheden, offline Plugin-fixtures, Plugin-updates, beveiliging tegen ontsnapping uit opdrachtbindingen van Plugins en Telegram-pakket-QA tegen dezelfde opgeloste tarball. Blokkerende releasecontroles gebruiken standaard de laatst gepubliceerde pakketbasislijn; het bètaprofiel met `run_release_soak=true`, `release_profile=stable` of `release_profile=full` breidt de controle van overlevende gepubliceerde upgrades uit naar `last-stable-4` plus de vastgezette basislijnen `2026.4.23`, `2026.5.2` en `2026.4.15` met `reported-issues`-scenario's. Gebruik Package Acceptance met `source=npm` voor een al uitgebrachte kandidaat, `source=ref` voor een door een SHA ondersteunde lokale npm-tarball vóór publicatie, `source=trusted-url` voor een door beheerders beheerde bedrijfs-/privémirror of `source=artifact` voor een voorbereide tarball die door een andere GitHub Actions-uitvoering is geüpload.

Dit is de GitHub-eigen vervanging voor het grootste deel van de pakket-/updatedekking waarvoor voorheen Parallels nodig was. Releasecontroles voor meerdere besturingssystemen blijven belangrijk voor besturingssysteemspecifieke onboarding, installatieprogramma's en platformgedrag, maar voor productvalidatie van pakketten en updates heeft Package Acceptance de voorkeur.

De canonieke controlelijst voor update- en Plugin-validatie is [Updates en Plugins testen](/nl/help/testing-updates-plugins). Gebruik deze om te bepalen welke lokale, Docker-, Package Acceptance- of releasecontrolelane bewijs levert voor een wijziging aan Plugin-installatie/-updates, doctor-opschoning of migratie van gepubliceerde pakketten. Uitputtende migratie van gepubliceerde updates vanaf elk stabiel pakket `2026.4.23+` is een afzonderlijke handmatige workflow `Update Migration` en maakt geen deel uit van Full Release CI.

De tolerantie voor verouderde pakketten in Package Acceptance is bewust tijdgebonden. Pakketten tot en met `2026.4.25` mogen het compatibiliteitspad gebruiken voor hiaten in metadata die al naar npm zijn gepubliceerd: private QA-inhoudsvermeldingen die ontbreken in de tarball, een ontbrekende `gateway install --wrapper`, ontbrekende patchbestanden in de uit de tarball afgeleide git-fixture, ontbrekende persistente `update.channel`, verouderde locaties voor Plugin-installatieregistraties, ontbrekende persistentie van marketplace-installatieregistraties en migratie van configuratiemetadata tijdens `plugins update`. Het gepubliceerde pakket `2026.4.26` mag waarschuwen voor lokale stempelbestanden met buildmetadata die al zijn uitgebracht. Latere pakketten moeten voldoen aan de moderne pakketcontracten; diezelfde hiaten laten de releasevalidatie mislukken.

Gebruik bredere Package Acceptance-profielen wanneer de releasevraag over een daadwerkelijk installeerbaar pakket gaat:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Gebruikelijke pakketprofielen:

- `smoke`: snelle trajecten voor pakketinstallatie/kanaal/agent, Gateway-netwerk en opnieuw laden van configuratie
- `package`: contracten voor installatie/update/herstart/Plugin-pakketten plus live bewijs van installatie van een ClawHub-skill; dit is de standaard voor releasecontroles
- `product`: `package` plus MCP-kanalen, opschoning van Cron/subagents, OpenAI-zoekopdrachten op het web en OpenWebUI
- `full`: Docker-delen van het releasepad met OpenWebUI
- `custom`: exacte lijst `docker_lanes` voor gerichte herhalingen

Schakel voor Telegram-bewijs van een pakketkandidaat `telegram_mode=mock-openai` of `telegram_mode=live-frontier` in bij Package Acceptance. De workflow geeft het herleide `package-under-test`-tarball door aan het Telegram-traject; de zelfstandige Telegram-workflow accepteert nog steeds een gepubliceerde npm-specificatie voor controles na publicatie.

## Automatisering voor reguliere releasepublicatie

Voor publicatie van bèta, `latest`, Plugins, GitHub Release en platforms is
`OpenClaw Release Publish` het normale muterende toegangspunt. Het maandelijkse
npm-only extended-stable-pad voor `.33+` gebruikt deze orchestrator niet. De
reguliere workflow orkestreert de workflows voor vertrouwde uitgevers in de
volgorde die de release vereist:

1. Check de releasetag uit en bepaal de commit-SHA ervan.
2. Controleer of de tag bereikbaar is vanuit `main` of `release/*` (of een Tideclaw-alpha-branch voor alpha-prereleases).
3. Voer `pnpm plugins:sync:check` uit.
4. Start `Plugin NPM Release` met `publish_scope=all-publishable` en `ref=<release-sha>`.
5. Start `Plugin ClawHub Release` met hetzelfde bereik en dezelfde SHA.
6. Start `OpenClaw NPM Release` met de releasetag, npm-dist-tag en opgeslagen `preflight_run_id`, nadat de opgeslagen `full_release_validation_run_id` en exacte uitvoeringspoging zijn gecontroleerd.
7. Maak voor stabiele releases de GitHub-release als concept aan of werk deze bij, start `Windows Node Release` met de expliciete `windows_node_tag` en de door de kandidaat goedgekeurde `windows_node_installer_digests`, en controleer de canonieke Windows-installatieprogramma- en checksum-assets. Start ook `Android Release` om de ondertekende APK voor de exacte tag plus checksum en herkomstbewijs te bouwen. Controleer beide contracten voor native assets voordat het concept wordt gepubliceerd.

Voorbeeld van bètapublicatie:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

Stabiele publicatie naar de standaard dist-tag `beta`:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

Stabiele promotie rechtstreeks naar `latest` is expliciet:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=latest
```

Gebruik de workflows op lager niveau `Plugin NPM Release` en `Plugin ClawHub Release` alleen voor gericht herstel of herpublicatie. `OpenClaw Release Publish` weigert `plugin_publish_scope=selected` wanneer `publish_openclaw_npm=true`, zodat het kernpakket niet kan worden uitgebracht zonder elke publiceerbare officiële Plugin, waaronder `@openclaw/diffs-language-pack`. Stel voor herstel van een geselecteerde Plugin `publish_openclaw_npm=false` in met `plugin_publish_scope=selected` en `plugins=@openclaw/name`, of start de onderliggende workflow rechtstreeks.

De initiële ClawHub-bootstrap voor de eerste publicatie is de uitzondering: start `Plugin ClawHub New`
vanuit vertrouwde `main` en geef de volledige doel-SHA van de release door via `ref`.
Voer de bootstrapworkflow zelf nooit uit vanaf de releasetag of -branch:

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

Validatie vóór het taggen vereist `dry_run=true`, weigert invoer voor releasetags
en bovenliggende uitvoeringen, en accepteert alleen een exact doel dat bereikbaar
is vanuit `main` of `release/*`. Hierbij worden geen ClawHub-referenties geladen,
pakketbytes gepubliceerd of instellingen van vertrouwde uitgevers gewijzigd. De
workflow bepaalt nog steeds het live-registerplan, checkt het doel alleen in een
taak zonder geheimen uit en verpakt het daar, materialiseert de vergrendelde
ClawHub-toolchain en valideert het onveranderlijke artefact en de slug/identiteit
van het pakket voordat de releasetag bestaat. Keur de omgeving
`clawhub-plugin-bootstrap` pas goed nadat de verpakkingstaken zonder geheimen
zijn voltooid; deze beveiligde validatietaak bevat geen referenties of mutatieopdrachten.

Een goedgekeurde proefuitvoering of echte bootstrap na het taggen moet de exacte
releasetag bevatten, plus de uitvoerings-id, poging en branch van de bovenliggende
`OpenClaw Release Publish`. De bovenliggende workflow verklaart zijn eigen
workflow-SHA en een afzonderlijke exacte vertrouwde SHA van `main` voor
`Plugin ClawHub New`; de onderliggende uitvoering en elke goedkeuring van een
beveiligde omgeving moeten overeenkomen met die goedgekeurde onderliggende SHA.
De releasetag wordt vóór elke publicatiepoging en mutatie van de vertrouwde
uitgever opnieuw gecontroleerd.

De verpakkingstaak
uploadt één onveranderlijk artefact waarvan de naam, Actions-artefact-id/digest,
producerende uitvoering/poging, doel-SHA en SHA-256/grootte van het tarball per
pakket worden doorgegeven aan de validatie- en beveiligde taken. De beveiligde
taak checkt uitsluitend tooling van vertrouwde `main` uit, valideert de
artefacttuple via de GitHub-API, downloadt op exacte artefact-id, berekent de hash
van elk tarball opnieuw en valideert lokale TAR-paden en pakketidentiteit met de
USTAR-canonicalisatieregels van de vastgezette CLI. Elke kandidaat doorloopt
vervolgens de proefpublicatie van de vastgezette CLI, die terugkeert vóór het
opzoeken in het register of authenticatie. Het voorfilter van de taak met
referenties begrenst gecomprimeerde ClawPacks op 120 MiB, de totale
bestandsinhoud op 50 MiB, uitgepakte TAR-gegevens op 64 MiB en het aantal
TAR-items op 10.000. Herstel van de vertrouwde uitgever voor bestaande pakketten
blijft uitsluitend configuratie uitvoeren, maar verpakt nog steeds het doel en
vereist vóór wijziging van de configuratie van de vertrouwde uitgever dat de
aangevraagde tag plus de exacte registerbytes en metadata gelijk zijn. De
controle na publicatie downloadt het ClawHub-artefact en vereist dezelfde SHA-256
en grootte. Bij herstel via het opnieuw uitvoeren van mislukte taken mag het
pakketartefact van een eerdere poging alleen worden hergebruikt wanneer de exacte
producerende taak met succes is voltooid. Het uiteindelijke bewijs bindt ook de
vergrendelde ClawHub-versie, de SHA-256 van het lockbestand en de npm-integriteit.
Een afwijking vereist een nieuwe pakketversie.

## Invoer voor de NPM-workflow

`OpenClaw NPM Release` accepteert de volgende door de operator beheerde invoer:

- `tag`: vereiste releasetag, zoals `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` of `v2026.4.2-alpha.1`; wanneer `preflight_only=true`, mag dit ook de huidige volledige commit-SHA van 40 tekens van de workflowbranch zijn voor uitsluitend validatie tijdens de voorbereidende controle
- `preflight_only`: `true` voor uitsluitend validatie/build/pakket, `false` voor het echte publicatiepad
- `preflight_run_id`: id van een bestaande geslaagde voorbereidende uitvoering, vereist op het echte publicatiepad zodat de workflow het voorbereide tarball hergebruikt in plaats van het opnieuw te bouwen
- `full_release_validation_run_id`: id van een geslaagde uitvoering van `Full Release Validation` voor deze tag/SHA, vereist voor echte publicatie. Bètapublicaties mogen alleen op basis van de voorbereidende controle doorgaan met een waarschuwing, maar stabiele promotie of promotie naar `latest` vereist deze nog steeds.
- `full_release_validation_run_attempt`: exacte positieve uitvoeringspoging die bij `full_release_validation_run_id` hoort; vereist wanneer de uitvoerings-id is opgegeven, zodat herhalingen het autorisatiebewijs tijdens publicatie niet kunnen wijzigen.
- `release_publish_run_id`: id van de goedgekeurde uitvoering van `OpenClaw Release Publish`; vereist wanneer deze workflow door die bovenliggende workflow wordt gestart (echte publicatieaanroepen door een botactor)
- `plugin_npm_run_id`: id van een geslaagde uitvoering van `Plugin NPM Release` op exact dezelfde HEAD; vereist voor een echte publicatie van de `extended-stable`-kern
- `npm_dist_tag`: npm-doeltag voor het publicatiepad; accepteert `alpha`, `beta`, `latest` of `extended-stable` en is standaard `beta`. Definitieve patches `33` en hoger moeten `extended-stable` gebruiken; standaard weigert `extended-stable` eerdere patches en niet-definitieve tags worden altijd geweigerd.
- `bypass_extended_stable_guard`: booleaanse waarde uitsluitend voor tests, standaard `false`; omzeilt bij `npm_dist_tag=extended-stable` de maandelijkse geschiktheidscontrole voor extended-stable, terwijl controles van release-identiteit, artefact, goedkeuring en teruglezing behouden blijven.

`Plugin NPM Release` accepteert `npm_dist_tag=default` voor bestaand
releasegedrag of `npm_dist_tag=extended-stable` voor het beveiligde maandelijkse
pad. De optie extended-stable vereist `publish_scope=all-publishable`, lege
`plugins`-invoer, een definitieve patch van minimaal `33` en de canonieke branch
`extended-stable/YYYY.M.33` op exact het uiteinde daarvan. Deze optie verplaatst
nooit de Plugin-tags `latest` of `beta`. Nieuwe pakketversies ontvangen
`extended-stable` atomair via vertrouwde OIDC-publicatie
(`npm publish --tag extended-stable`); deze bronworkflow gebruikt geen met een
token geauthenticeerde `npm dist-tag add`. Nieuwe pogingen slaan exacte versies
over die al in npm aanwezig zijn en stoppen vervolgens beveiligd, tenzij
volledige teruglezing bevestigt dat elk exact pakket en elke `extended-stable`-tag
zijn geconvergeerd.

`OpenClaw Release Publish` accepteert de volgende door de operator beheerde invoer:

- `tag`: vereiste releasetag; moet al bestaan
- `preflight_run_id`: id van een geslaagde voorbereidende uitvoering van `OpenClaw NPM Release`; vereist wanneer `publish_openclaw_npm=true` of `plugin_publish_scope=all-publishable`
- `full_release_validation_run_id`: id van een geslaagde uitvoering van `Full Release Validation`; vereist wanneer `publish_openclaw_npm=true` of `plugin_publish_scope=all-publishable`
- `full_release_validation_run_attempt`: exacte positieve poging die bij `full_release_validation_run_id` hoort; vereist wanneer de uitvoerings-id is opgegeven
- `windows_node_tag`: exacte niet-prerelease-releasetag van `openclaw/openclaw-windows-node`; vereist voor stabiele OpenClaw-publicatie
- `windows_node_installer_digests`: door de kandidaat goedgekeurde compacte JSON-toewijzing van de huidige namen van Windows-installatieprogramma's aan hun vastgezette `sha256:`-digests; vereist voor stabiele OpenClaw-publicatie
- `npm_telegram_run_id`: optionele id van een geslaagde uitvoering van `NPM Telegram Beta E2E` om op te nemen in het uiteindelijke releasebewijs
- `npm_dist_tag`: npm-doeltag voor het OpenClaw-pakket, een van `alpha`, `beta` of `latest`
- `plugin_publish_scope`: standaard `all-publishable`; gebruik `selected` alleen voor gericht herstel dat uitsluitend Plugins betreft, met `publish_openclaw_npm=false`
- `plugins`: door komma's gescheiden pakketnamen van `@openclaw/*` wanneer `plugin_publish_scope=selected`
- `publish_openclaw_npm`: standaard `true`; stel alleen `false` in wanneer de workflow wordt gebruikt als orchestrator voor herstel dat uitsluitend Plugins betreft
- `release_profile`: profiel voor releasedekking dat wordt gebruikt voor samenvattingen van releasebewijs; standaard `from-validation`, waarmee het uit het validatiemanifest wordt gelezen, of overschrijf dit met `beta`, `stable` of `full`
- `wait_for_clawhub`: standaard `false`, zodat npm-beschikbaarheid niet wordt geblokkeerd door de ClawHub-sidecar; stel alleen `true` in wanneer voltooiing van de workflow ook voltooiing van ClawHub moet omvatten

`OpenClaw Release Checks` accepteert de volgende door de operator beheerde invoer:

- `ref`: branch, tag of volledige commit-SHA om te valideren. Voor controles met geheimen moet de herleide commit bereikbaar zijn vanuit een OpenClaw-branch of -releasetag.
- `run_release_soak`: schakel uitgebreide live/E2E-, Docker-releasepad- en overlevingstests voor upgrades sinds alle eerdere versies in voor bètareleasecontroles. Dit wordt afgedwongen door `release_profile=stable` en `release_profile=full`.

Regels:

- Reguliere definitieve en correctieversies onder patch `33` mogen naar `beta` of `latest` worden gepubliceerd. Definitieve versies met patch `33` of hoger moeten naar `extended-stable` worden gepubliceerd en versies met een correctieachtervoegsel op die grens worden geweigerd.
- Bètavooruitgavetags mogen alleen naar `beta` worden gepubliceerd; alfavooruitgavetags alleen naar `alpha`
- Voor `OpenClaw NPM Release` is invoer van de volledige commit-SHA alleen toegestaan wanneer `preflight_only=true`
- `OpenClaw Release Checks` en `Full Release Validation` zijn altijd uitsluitend bedoeld voor validatie
- Het werkelijke publicatiepad moet dezelfde `npm_dist_tag` gebruiken als tijdens de voorbereidende controle; de workflow verifieert die metagegevens voordat de publicatie wordt voortgezet

## Reguliere stabiele releasevolgorde voor beta/latest

Deze verouderde volgorde is bedoeld voor de reguliere georkestreerde release die ook Plugins, GitHub Release, Windows en werk voor andere platforms omvat. Dit is niet het maandelijkse npm-only `extended-stable`-pad voor `.33+` dat bovenaan deze pagina wordt beschreven.

Bij het uitbrengen van een reguliere georkestreerde stabiele release:

1. Voer `OpenClaw NPM Release` uit met `preflight_only=true`. Voordat er een tag bestaat, kunt u de huidige volledige commit-SHA van de workflowbranch gebruiken voor een uitsluitend voor validatie bedoelde proefuitvoering van de workflow voor voorbereidende controles.
2. Kies `npm_dist_tag=beta` voor het normale traject waarbij beta eerst komt, of alleen `latest` wanneer u bewust rechtstreeks een stabiele versie wilt publiceren.
3. Voer `Full Release Validation` uit op de releasebranch, releasetag of volledige commit-SHA wanneer u normale CI plus dekking voor live promptcache, Docker, QA Lab, Matrix en Telegram vanuit één handmatige workflow wilt. Als u bewust alleen de deterministische normale testgraaf nodig hebt, voert u in plaats daarvan de handmatige `CI`-workflow uit op de releaseverwijzing.
4. Selecteer de exacte niet-vooruitgave-releasetag van `openclaw/openclaw-windows-node` waarvan de ondertekende x64- en ARM64-installatieprogramma's moeten worden uitgebracht. Sla deze op als `windows_node_tag` en sla de gevalideerde digest-toewijzing ervan op als `windows_node_installer_digests`. Het hulpmiddel voor releasekandidaten registreert beide en neemt ze op in de gegenereerde publicatieopdracht.
5. Sla de geslaagde `preflight_run_id`, `full_release_validation_run_id` en exacte `full_release_validation_run_attempt` op.
6. Voer `OpenClaw Release Publish` uit vanuit een vertrouwde `main` met dezelfde `tag`, dezelfde `npm_dist_tag`, de geselecteerde `windows_node_tag`, de opgeslagen `windows_node_installer_digests` daarvan, de opgeslagen `preflight_run_id`, `full_release_validation_run_id` en `full_release_validation_run_attempt`. Hiermee worden geëxternaliseerde Plugins naar npm en ClawHub gepubliceerd voordat het OpenClaw-npm-pakket wordt gepromoveerd.
7. Als de release op `beta` is terechtgekomen, gebruikt u de workflow `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` om die stabiele versie van `beta` naar `latest` te promoveren.
8. Als de release bewust rechtstreeks naar `latest` is gepubliceerd en `beta` onmiddellijk dezelfde stabiele build moet volgen, gebruikt u diezelfde releaseworkflow om beide distributietags naar de stabiele versie te laten verwijzen, of laat u de geplande zelfherstellende synchronisatie `beta` later verplaatsen.

De wijziging van distributietags bevindt zich in de repository met het releaselogboek, omdat daarvoor nog steeds `NPM_TOKEN` vereist is, terwijl de bronrepository uitsluitend OIDC-publicatie gebruikt. Zo blijven zowel het directe publicatiepad als het promotiepad waarbij beta eerst komt gedocumenteerd en zichtbaar voor beheerders.

Als een beheerder moet terugvallen op lokale npm-authenticatie, voert u opdrachten van de 1Password-CLI (`op`) uitsluitend uit binnen een afzonderlijke tmux-sessie. Roep `op` niet rechtstreeks aan vanuit de hoofdshell van de agent; door dit binnen tmux te houden, blijven prompts, waarschuwingen en OTP-afhandeling waarneembaar en worden herhaalde hostwaarschuwingen voorkomen.

## Openbare verwijzingen

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Beheerders gebruiken de privé-releasedocumentatie in [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) als het daadwerkelijke draaiboek.

## Gerelateerd

- [Releasekanalen](/nl/install/development-channels)
