---
read_when:
    - Op zoek naar definities van openbare releasekanalen
    - Releasevalidatie of pakketacceptatie uitvoeren
    - Op zoek naar versienaamgeving en releasefrequentie
summary: Releasekanalen, checklist voor operators, validatieboxen, versienaamgeving en releasefrequentie
title: Releasebeleid
x-i18n:
    generated_at: "2026-07-16T16:30:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c88c7c61be963ed832b1716e811e09d5f270cb296bb08625e6fd53d5359e45b8
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw biedt momenteel drie gebruikersgerichte updatekanalen:

- stable: het bestaande gepromote releasekanaal, dat nog steeds via npm `latest` wordt omgezet totdat de afzonderlijke CLI-/kanaalmijlpaal is bereikt
- beta: prereleasetags die naar npm `beta` publiceren
- dev: de bewegende HEAD van `main`

Daarnaast kunnen releaseoperators het kernpakket van de laatst voltooide maand
publiceren naar npm `extended-stable`, te beginnen bij patch `33`. De reguliere
definitieve lijn van de huidige maand blijft op npm `latest`; deze publicatiesplitsing
aan de operatorzijde verandert op zichzelf niets aan de omzetting van CLI-updatekanalen.

Tideclaw-alfabuilds vormen een afzonderlijk intern prereleasetraject (npm-dist-tag `alpha`), dat wordt behandeld onder [NPM-workflowinvoer](#npm-workflow-inputs) en [Releasetestomgevingen](#release-test-boxes).

## Versienamen

- Maandelijkse npm-versie voor de extended-stable-release: `YYYY.M.PATCH`, met `PATCH >= 33`, git-tag `vYYYY.M.PATCH`
- Dagelijkse/reguliere definitieve releaseversie: `YYYY.M.PATCH`, met `PATCH < 33`, git-tag `vYYYY.M.PATCH`
- Reguliere releaseversie voor terugvalcorrecties: `YYYY.M.PATCH-N`, git-tag `vYYYY.M.PATCH-N`
- Versie van de bètaprelease: `YYYY.M.PATCH-beta.N`, git-tag `vYYYY.M.PATCH-beta.N`
- Versie van de alfaprelease: `YYYY.M.PATCH-alpha.N`, git-tag `vYYYY.M.PATCH-alpha.N`
- Vul de maand of patch nooit aan met voorloopnullen
- `PATCH` is een opeenvolgend nummer van de maandelijkse releasereeks, geen kalenderdag. Reguliere definitieve en bètareleases schuiven de huidige reeks door; tags die alleen alfa zijn, verbruiken of verhogen het bèta-/reguliere patchnummer nooit. Negeer daarom verouderde tags die alleen alfa zijn en hogere patchnummers hebben wanneer je een bèta- of reguliere reeks selecteert.
- Alfa-/nightlybuilds gebruiken de volgende nog niet uitgebrachte patchreeks en verhogen bij herhaalde builds alleen `alpha.N`. Zodra die patch een bèta heeft, gaan nieuwe alfabuilds naar de daaropvolgende patch.
- npm-versies zijn onveranderlijk: verwijder, herpubliceer of hergebruik een gepubliceerde tag nooit. Maak in plaats daarvan het volgende prereleasenummer of de volgende maandelijkse patch.
- `latest` blijft de huidige reguliere/dagelijkse npm-lijn volgen; `beta` is het huidige installatiedoel voor bèta
- `extended-stable` betekent het ondersteunde npm-pakket van de voorgaande maand, te beginnen bij patch `33`; patch `34` en later zijn onderhoudsreleases op die maandelijkse lijn
- Reguliere definitieve releases en reguliere correctiereleases publiceren standaard naar npm `beta`; releaseoperators kunnen expliciet `latest` als doel kiezen of later een gecontroleerde bètabuild promoveren
- Het speciale maandelijkse extended-stable-pad publiceert het npm-kernpakket en elke officiële Plugin die naar npm kan worden gepubliceerd met exact dezelfde versie. Het publiceert geen plugins naar ClawHub en publiceert evenmin macOS- of Windows-artefacten, een GitHub Release, dist-tags van privérepository's, Docker-images, mobiele artefacten of websitedownloads.
- Elke reguliere definitieve release levert het npm-pakket, de macOS-app, de ondertekende zelfstandige Android-APK en de ondertekende Windows Hub-installatieprogramma's samen. Bètareleases valideren en publiceren normaal gesproken eerst het npm-/pakketpad; het bouwen, ondertekenen, notarieel bekrachtigen en promoveren van native apps blijft voorbehouden aan reguliere definitieve releases, tenzij dit expliciet wordt gevraagd.

## Releasefrequentie

- Releases verlopen eerst via bèta; stable volgt pas nadat de nieuwste bèta is gevalideerd
- Onderhouders maken releases normaal gesproken vanuit een `release/YYYY.M.PATCH`-branch die is gemaakt vanaf de huidige `main`, zodat releasevalidatie en reparaties nieuwe ontwikkeling op `main` niet blokkeren
- Als een bètagag is gepusht of gepubliceerd en moet worden gerepareerd, maken onderhouders de volgende `-beta.N`-tag in plaats van de oude te verwijderen of opnieuw te maken
- De gedetailleerde releaseprocedure, goedkeuringen, aanmeldgegevens en herstelnotities zijn uitsluitend voor onderhouders

## Maandelijkse extended-stable-publicatie uitsluitend naar npm

Dit is een specifieke uitzondering op de reguliere releaseprocedure hieronder. Maak voor
een voltooide maand `YYYY.M` `extended-stable/YYYY.M.33`; publiceer
`vYYYY.M.33` en latere onderhoudspatches vanaf diezelfde branch. De release-
tag, de branchtop, de checkout, de pakketversie, de npm-preflight en de uitvoering van Full Release
Validation moeten allemaal dezelfde commit aanduiden. De beveiligde `main` moet
al een definitieve versie van een strikt latere kalendermaand onder patch
`33` bevatten; onderhoudspatches blijven in aanmerking komen nadat `main` meer dan één
maand is doorgeschoven.

Verhoog op exact de extended-stable-branch het hoofdpakket naar `YYYY.M.P`, voer
`pnpm release:prep` uit en controleer of elk publiceerbaar extensiepakket
dezelfde versie heeft. Commit en push alle gegenereerde wijzigingen, maak en push de
onveranderlijke tag `vYYYY.M.P` bij die commit en noteer de resulterende volledige SHA.
De workflows gebruiken deze voorbereide structuur; ze verhogen of synchroniseren
de versies niet voor je.

Voer de npm-preflight en Full Release Validation uit vanaf exact die voorbereide
branchtop en sla vervolgens beide uitvoerings-ID's en de geslaagde uitvoeringspoging van Full Release Validation
op:

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

`release_profile=stable` is het bestaande profiel voor validatiediepte; dit staat
los van de npm-dist-tag `extended-stable` en blijft bewust
ongewijzigd.

Nadat beide uitvoeringen zijn geslaagd, publiceer je elke officiële Plugin die naar npm kan worden gepubliceerd vanaf
exact dezelfde branchtop. Patch `P` moet `33` of hoger zijn. Geef de volledige release-
SHA door als `ref`, wacht op de volledige matrix en het teruglezen uit het register en sla vervolgens de
ID van de geslaagde Plugin NPM Release-uitvoering op:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

De workflow gebruikt de reguliere voorbereide `all-publishable`-pakketinventaris,
inclusief pakketten waarvan de bron niet is gewijzigd. De workflow controleert elk exact pakket
en elke Plugin-tag `extended-stable` voordat deze slaagt. Als een gedeeltelijke uitvoering
mislukt, voer je dezelfde opdracht opnieuw uit: reeds gepubliceerde pakketten worden hergebruikt, ontbrekende
of verouderde Plugin-tags worden binnen de npm-releaseomgeving afgestemd en het
uiteindelijke teruglezen omvat nog steeds de volledige pakketset.

Nadat de Plugin-workflow is geslaagd en de npm-releaseomgeving gereed is,
publiceer je de exacte tarball van de kernpreflight. De kernpublicatie controleert of de
gerefereerde Plugin-uitvoering `completed/success` is op dezelfde canonieke branch en met
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

Voeg voor een fork of niet-productierepetitie die bewust niet kan voldoen aan het
maandelijkse beleid voor `.33` of de beveiligde `main`-maand
`-f bypass_extended_stable_guard=true` toe aan zowel de npm-preflight- als de publicatie-
dispatches. De standaardwaarde is `false`. De omzeiling wordt alleen geaccepteerd met
`npm_dist_tag=extended-stable` en wordt vastgelegd in de workflowsamenvatting. Deze
omzeilt niet de canonieke workflowreferentie `extended-stable/YYYY.M.33`,
de gelijkheid van branchtop/tag/checkout, de syntaxis van definitieve tags, de gelijkheid van pakket-/tagversies,
de identiteit van gerefereerde uitvoeringen en manifesten, de herkomst van de tarball,
omgevingsgoedkeuring, het teruglezen uit het register of bewijs van selectorherstel.

De publicatieworkflow controleert de identiteit van de gerefereerde preflight-, validatie- en Plugin-
uitvoeringen, de digest van de voorbereide tarball en de selectors van het kernregister.
Bevestig het resultaat onafhankelijk nadat de workflow is geslaagd:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Beide opdrachten moeten `YYYY.M.P` retourneren. Als de publicatie slaagt maar het teruglezen van de selector
mislukt, publiceer de onveranderlijke pakketversie dan niet opnieuw. Gebruik de
enkele herstelopdracht `npm dist-tag add openclaw@YYYY.M.P extended-stable` die
wordt weergegeven in de altijd uitgevoerde samenvatting van de mislukte workflow en herhaal vervolgens beide
onafhankelijke terugleesbewerkingen. Terugdraaien naar de vorige selector is een afzonderlijke beslissing van de operator,
niet het herstelpad voor het teruglezen.

Openbare ondersteuningsdocumentatie wijst aanvankelijk Slack, Discord en Codex aan als
ondersteunde extended-stable-Plugin-oppervlakken. Die lijst is een ondersteuningsverklaring, geen
allowlist in de releasecode: elke officiële Plugin die naar npm kan worden gepubliceerd, volgt
hetzelfde publicatiepad met exact dezelfde versie.

De reguliere checklist hieronder blijft bepalend voor bèta, `latest`, GitHub Release,
plugins, macOS, Windows en publicatie op andere platforms. Voer die
stappen niet uit voor dit extended-stable-pad dat uitsluitend naar npm publiceert.

## Checklist voor operators van reguliere releases

Deze checklist geeft de openbare vorm van de releaseflow weer. Privéaanmeldgegevens, ondertekening, notariële bekrachtiging, herstel van dist-tags en details over noodterugdraaiing blijven in het releasehandboek dat uitsluitend voor onderhouders bestemd is.

1. Begin bij de huidige `main`: haal de nieuwste wijzigingen op, bevestig dat de doelcommit is gepusht en bevestig dat de CI van `main` voldoende groen is om er een branch van te maken.
2. Maak `release/YYYY.M.PATCH` vanaf die commit. Backports zijn optioneel; pas alleen de door de operator geselecteerde set toe. Verhoog elke vereiste versielocatie, voer `pnpm release:prep` uit, voltooi releasereparaties en vereiste forward-ports en beoordeel `src/plugins/compat/registry.ts` plus `src/commands/doctor/shared/deprecation-compat.ts`.
3. Zet de productvolledige commit van vóór de changelog vast als de **Code-SHA**. Voer de deterministische bronpreflight uit en gebruik vervolgens `node scripts/full-release-validation-at-sha.mjs --sha <code-sha> --target-ref release/YYYY.M.PATCH`. Hiermee wordt vertrouwde workflowtooling vastgezet terwijl de volledige Vitest-, Docker-, QA-, pakket- en prestatiematrix exact op de Code-SHA wordt gericht.
4. Classificeer fouten voordat je wijzigingen aanbrengt. Een product-/codefout creëert een nieuwe Code-SHA en vereist een volledig groene validatie voor die SHA. Een fout in een workflow, harness, aanmeldgegeven, goedkeuring of infrastructuur wordt gerepareerd in het oppervlak dat deze beheert en opnieuw uitgevoerd tegen dezelfde Code-SHA.
5. Genereer pas nadat de Code-SHA groen is de bovenste sectie `CHANGELOG.md` uit samengevoegde PR's en rechtstreekse commits sinds de laatst bereikbare uitgebrachte tag. Houd vermeldingen gebruikersgericht en verwijder duplicaten. Wanneer een afwijkende uitgebrachte tag of latere forward-port reeds uitgebrachte PR's opnieuw koppelt, geef je die expliciet door als `--shipped-ref`.
6. Commit uitsluitend `CHANGELOG.md`. Deze commit is de **Release-SHA**. De volledige diff van Code-SHA naar Release-SHA moet exact `CHANGELOG.md` zijn; elk ander gewijzigd pad brengt de release terug naar stap 2.
7. Voer op SHA vastgezette Full Release Validation uit voor de Release-SHA met hergebruik van bewijs ingeschakeld. Het lichtgewicht bovenliggende proces moet `changelog-only-release-v1` vastleggen, naar de groene Code-SHA wijzen en geen onderliggende producttaken dispatchen. Dit hergebruikt productbewijs; het hergebruikt geen pakketbytes.
8. Voer `OpenClaw NPM Release` met `preflight_only=true` uit tegen de Release-SHA/tag. Sla de geslaagde `preflight_run_id` op. Hiermee worden de exacte pakketbytes met de definitieve changelog gebouwd en gecontroleerd.
9. Tag de Release-SHA en voer vervolgens de kandidaathulp uit met het geslaagde bovenliggende validatieproces voor de Release-SHA en de npm-preflight, in plaats van een van beide opnieuw te dispatchen:

   ```bash
   pnpm release:candidate -- \
     --tag vYYYY.M.PATCH-beta.N \
     --full-release-run <release-sha-validation-run-id> \
     --npm-preflight-run <preflight-run-id> \
     --skip-dispatch
   ```

   Voor stable moet je ook `--windows-node-tag vX.Y.Z` doorgeven. De helper verifieert de herkomst van de releaseopmerkingen, de npm-preflightbytes, het Parallels-installatie-/updatebewijs, het Telegram-pakketbewijs en de publicatieplannen voor plugins, en drukt vervolgens de publicatieopdracht af.

   `OpenClaw Release Publish` verzendt de geselecteerde of alle publiceerbare pluginpakketten parallel naar npm en dezelfde set naar ClawHub, en promoveert vervolgens het voorbereide npm-preflightartefact van OpenClaw met de overeenkomende dist-tag zodra de npm-publicatie van de plugins slaagt. De releasecheckout blijft de product-/gegevensroot, terwijl planning en eindverificatie vanuit de exacte vertrouwde checkout van de workflowbron worden uitgevoerd, zodat een oudere releasecommit niet ongemerkt verouderde releasetooling kan gebruiken. Voordat een publicatiesubproces wordt gestart, rendert en cachet de workflow de exacte hoofdtekst van de GitHub-release. Wanneer de volledige overeenkomende sectie `CHANGELOG.md` binnen GitHubs limiet van 125,000 tekens en het overeenkomende veiligheidsmaximum van 125,000 bytes van de renderer past, bevat de pagina exact die sectie `## YYYY.M.PATCH`, inclusief de kop. Wanneer de bronsectie niet past, behoudt de pagina de exacte gegroepeerde redactionele opmerkingen en vervangt deze het te grote bijdrageoverzicht door een stabiele link naar het volledige overzicht in de aan de tag gekoppelde `CHANGELOG.md`; gedeeltelijke overzichten en afgekorte opsommingstekens worden nooit gepubliceerd. De workflow kiest deze volledige of compacte hoofdtekst voordat `### Release verification` wordt toegevoegd; als het bewijsstaartstuk de limiet zou overschrijden, behoudt de workflow de canonieke hoofdtekst en vertrouwt deze in plaats daarvan op het onveranderlijke bijgevoegde bewijs. Stabiele releases die naar npm `latest` worden gepubliceerd, worden de nieuwste GitHub-release, terwijl stabiele onderhoudsreleases die op npm `beta` worden gehouden, met GitHub `latest=false` worden aangemaakt. De workflow uploadt ook het preflightbewijs van afhankelijkheden, het manifest van de volledige validatie en het verificatiebewijs van het register na publicatie naar de GitHub-release voor incidentrespons na de release. De workflow drukt de run-ID's van subprocessen onmiddellijk af, keurt automatisch releaseomgevingspoorten goed die het workflowtoken mag goedkeuren, vat mislukte subtaken samen met de laatste logregels, maakt vooraf de conceptpagina van de GitHub-release aan en promoveert Windows- en Android-assets gelijktijdig met de npm-publicatie van OpenClaw, rondt de releasepagina en het afhankelijkheidsbewijs af zodra die fasen slagen, wacht op ClawHub wanneer OpenClaw naar npm wordt gepubliceerd, voert vervolgens de bèta-verifier van vertrouwde main uit en uploadt bewijs na publicatie voor de GitHub-release, het npm-pakket, de geselecteerde npm-pakketten van plugins, de geselecteerde ClawHub-pakketten, de workflowrun-ID's van subprocessen en de optionele NPM Telegram-run-ID. De ClawHub-bootstrapverifier vereist het exacte vertrouwde-main-workflowpad en de SHA, de pogingen van de producer- en terminalrun, de release-SHA, de aangevraagde pakketset, de onveranderlijke pakketartefacttuple en het artefact met de uiteindelijke registeruitlezing; een geslaagde verouderde release-ref-run wordt niet geaccepteerd.

   Voer vervolgens de pakketacceptatie na publicatie uit op het gepubliceerde pakket `openclaw@YYYY.M.PATCH-beta.N` of `openclaw@beta`. Als een gepushte of gepubliceerde prerelease moet worden hersteld, maak je het volgende overeenkomende prereleasenummer; verwijder of herschrijf nooit het oude.

10. Behoud bij een mislukte publicatiepoging de Release-SHA ongewijzigd, tenzij de fout een defect in het product of de changelog aantoont. Hervat geslaagde onveranderlijke subprocessen en artefacten; bouw of publiceer nooit opnieuw een pakketversie die al is geslaagd.
11. Ga voor stable alleen verder nadat de gecontroleerde bèta of release candidate over het vereiste validatiebewijs beschikt. Stabiele npm-publicatie verloopt ook via `OpenClaw Release Publish`, waarbij het geslaagde preflightartefact via `preflight_run_id` wordt hergebruikt. Gereedheid voor een stabiele macOS-release vereist ook de verpakte `.zip`, `.dmg`, `.dSYM.zip` en bijgewerkte `appcast.xml` op `main`; de macOS-publicatieworkflow publiceert de ondertekende appcast automatisch naar de openbare `main` nadat de release-assets zijn geverifieerd, of opent/actualiseert een appcast-PR als branchbeveiliging de directe push blokkeert. Gereedheid voor de stabiele Windows Hub vereist de ondertekende assets `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` en `OpenClawCompanion-SHA256SUMS.txt` in de GitHub-release van OpenClaw. Geef de exacte ondertekende releasetag `openclaw/openclaw-windows-node` door als `windows_node_tag` en de door de kandidaatgoedkeuring gedekte digesttoewijzing van het installatieprogramma als `windows_node_installer_digests`; `OpenClaw Release Publish` behoudt het releaseconcept, verzendt `Windows Node Release` en verifieert alle drie de assets vóór publicatie.
12. Voer na publicatie de npm-verifier voor na publicatie uit, optioneel de zelfstandige Telegram-E2E voor gepubliceerde npm wanneer je kanaalbewijs na publicatie nodig hebt, promoveer zo nodig de dist-tag, verifieer de gegenereerde GitHub-releasepagina, voer de stappen voor de releaseaankondiging uit en voltooi vervolgens [Afsluiting van stable main](#stable-main-closeout) voordat je een stabiele release als voltooid beschouwt.

## Afsluiting van stable main

Stabiele publicatie is pas voltooid wanneer `main` de daadwerkelijk uitgebrachte releasestatus bevat.

1. Begin met een verse, meest recente `main`. Controleer `release/YYYY.M.PATCH` ertegen en forward-port daadwerkelijke correcties die ontbreken in `main`. Voeg niet blindelings uitsluitend voor releases bestemde compatibiliteits-, test- of validatieadapters samen in de nieuwere `main`.
2. Stel voor het normale pad `main` in op de uitgebrachte stabiele versie. Bij een late afsluiting mag `main` worden gebruikt nadat deze naar een latere stabiele OpenClaw-CalVer is doorgegaan; verlaag een reeds gestarte releasereeks niet uitsluitend om de vorige release af te sluiten. De validator vereist nog steeds de exacte uitgebrachte changelogsectie en appcast-vermelding en registreert de daadwerkelijke versie en SHA van `main`. Voer `pnpm release:prep` uit na elke wijziging van de rootversie en vervolgens `pnpm deps:shrinkwrap:generate`.
3. Laat de sectie `## YYYY.M.PATCH` van `CHANGELOG.md` op `main` exact overeenkomen met de getagde releasebranch. Neem de stabiele update van `appcast.xml` op wanneer de Mac-release er een heeft gepubliceerd.
4. Voeg `YYYY.M.PATCH+1`, een bètaversie of een lege toekomstige changelogsectie pas aan `main` toe wanneer de operator die releasereeks expliciet start.
5. Voer `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` en `OPENCLAW_TESTBOX=1 pnpm check:changed` uit. Push en verifieer vervolgens dat `origin/main` de uitgebrachte versie en changelog bevat voordat je de stabiele release als voltooid beschouwt.
6. Houd de repositoryvariabelen `RELEASE_ROLLBACK_DRILL_ID` en `RELEASE_ROLLBACK_DRILL_DATE` actueel na elke besloten rollbackoefening.

`OpenClaw Stable Main Closeout` begint bij de push naar `main` die na stabiele publicatie de uitgebrachte versie, changelog en appcast bevat. Deze leest onveranderlijk bewijs na publicatie om de uitgebrachte tag te koppelen aan de bijbehorende runs voor Volledige releasevalidatie en Publicatie, en verifieert vervolgens de stabiele main-status, release, verplichte stabiele inwerkperiode en blokkerend prestatiebewijs. De workflow voegt een onveranderlijk afsluitmanifest en controlesom toe aan de GitHub-release. De automatische pushtrigger slaat verouderde releases over die dateren van vóór onveranderlijk bewijs na publicatie en beschouwt die overslag nooit als een voltooide afsluiting.

Een volledige afsluiting vereist zowel assets als een overeenkomende controlesom. Een gedeeltelijk manifest speelt de vastgelegde `main`-SHA en rollbackoefening opnieuw af om identieke bytes te regenereren en voegt vervolgens de ontbrekende controlesom toe; een ongeldig paar, of een controlesom zonder manifest, blijft blokkeren. Een door een push geactiveerde run zonder repositoryvariabelen voor de rollbackoefening slaat over zonder de afsluiting te voltooien; een ontbrekend of meer dan 90 dagen oud oefenoverzicht blijft ook handmatige, door bewijs ondersteunde afsluiting blokkeren. Besloten herstelopdrachten blijven in het uitsluitend voor beheerders bestemde draaiboek. Gebruik handmatige verzending alleen om een door bewijs ondersteunde stabiele afsluiting te herstellen of opnieuw af te spelen.

Als de bovenliggende Release Publish-run pas mislukte nadat onveranderlijk npm-/pluginbewijs was bijgevoegd, herstel en publiceer je eerst elk stabiel platformasset. Daarna mag een beheerder de afsluiting handmatig verzenden met `allow_failed_publish_recovery=true`; deze modus accepteert alleen een voltooide mislukte bovenliggende run en vereist daarnaast de exacte Android- en Windows-assetcontracten, GitHub-SHA-256-digests, controlesomverificatie, Android-herkomst en een geslaagde door de bovenliggende run verzonden Windows-promotie waarvan de Authenticode-controles en door de kandidaatgoedkeuring gedekte digests overeenkomen met de gepubliceerde installatieprogramma's, naast de normale macOS-/appcastcontroles. Automatische pushafsluiting schakelt deze herstelmodus nooit in.

Een verouderde fallback-correctietag mag bewijs van het basispakket alleen hergebruiken wanneer de correctietag naar dezelfde broncommit verwijst als de stabiele basistag. De bijbehorende Android-release hergebruikt de geverifieerde APK van de basistag en voegt herkomstinformatie voor de correctietag toe. Een correctie met een andere bron moet eigen pakketbewijs publiceren en verifiëren en een hogere Android-`versionCode` gebruiken.

## Releasepreflight

- Voer `pnpm check:test-types` vóór de releasepreflight uit, zodat test-TypeScript buiten de snellere lokale `pnpm check`-poort gedekt blijft.
- Voer `pnpm check:architecture` vóór de releasepreflight uit, zodat de bredere controles op importcycli en architectuurgrenzen buiten de snellere lokale poort slagen.
- Voer `pnpm build && pnpm ui:build` vóór `pnpm release:check` uit, zodat de verwachte releaseartefacten van `dist/*` en de Control UI-bundel voor de pakketvalidatiestap bestaan.
- Voer `pnpm release:prep` uit na de verhoging van de rootversie en vóór het taggen. Dit voert elke deterministische releasegenerator uit die vaak afwijkt na een wijziging van versie, configuratie of API: pluginversies, npm-shrinkwraps, plugininventaris, basisconfiguratieschema, configuratiemetadata van gebundelde kanalen, basislijn voor configuratiedocumentatie, exports van de plugin-SDK en API-basislijn van de plugin-SDK. `pnpm release:check` voert deze controles opnieuw uit in controlemodus (plus een budgetcontrole voor het oppervlak van de plugin-SDK) en rapporteert elke fout door afwijkende gegenereerde bestanden in één doorgang voordat de pakketreleasecontroles worden uitgevoerd.
- Synchronisatie van pluginversies werkt standaard het publiceerbare runtimepakket `@openclaw/ai`, de pakketversies van officiële plugins en bestaande `openclaw.compat.pluginApi`-minimumversies bij naar de OpenClaw-releaseversie. Behandel dat veld als de minimumversie van de plugin-SDK/runtime-API, niet slechts als een kopie van de pakketversie: behoud voor releases die alleen plugins betreffen en bewust compatibel blijven met oudere OpenClaw-hosts de minimumversie van de oudste ondersteunde host-API en documenteer die keuze in het pluginreleasebewijs.
- Voer vóór releasegoedkeuring de handmatige workflow `Full Release Validation` uit om alle prerelease-testomgevingen vanuit één toegangspunt te starten. Deze accepteert een branch, tag of volledige commit-SHA, verzendt handmatig `CI` en verzendt `OpenClaw Release Checks` voor installatie-smoketests, pakketacceptatie, pakketcontroles voor meerdere besturingssystemen, QA Lab-pariteit, Matrix- en Telegram-lanes. Stabiele en volledige runs bevatten altijd uitgebreide live-/E2E- en Docker-inwerktests voor het releasepad; `run_release_soak=true` blijft behouden voor een expliciete bèta-inwerktest. Pakketacceptatie levert tijdens kandidaatvalidatie de canonieke Telegram-E2E voor het pakket en voorkomt zo een tweede gelijktijdige live-poller.

  Geef `release_package_spec` op nadat een bèta is gepubliceerd om het uitgebrachte npm-pakket opnieuw te gebruiken voor releasecontroles, Pakketacceptatie en Telegram-E2E voor het pakket, zonder de releasetarball opnieuw te bouwen. Geef `npm_telegram_package_spec` alleen op wanneer Telegram een ander gepubliceerd pakket moet gebruiken dan de rest van de releasevalidatie. Geef `package_acceptance_package_spec` op wanneer Pakketacceptatie een ander gepubliceerd pakket moet gebruiken dan de pakketspecificatie van de release. Geef `evidence_package_spec` op wanneer het releasebewijsrapport moet aantonen dat de validatie overeenkomt met een gepubliceerd npm-pakket zonder Telegram-E2E af te dwingen.

  ```bash
  node scripts/full-release-validation-at-sha.mjs \
    --sha <code-sha> \
    --target-ref release/YYYY.M.PATCH
  ```

- Voer de handmatige `Package Acceptance`-workflow uit wanneer je bewijs via een zijkanaal voor een pakketkandidaat wilt terwijl het releasewerk doorgaat. Gebruik `source=npm` voor `openclaw@beta`, `openclaw@latest` of een exacte releaseversie; `source=ref` om een vertrouwde `package_ref`-branch/tag/SHA te verpakken met de huidige `workflow_ref`-testomgeving; `source=url` voor een openbare HTTPS-tarball met een verplichte SHA-256 en een strikt beleid voor openbare URL's; `source=trusted-url` voor een benoemd beleid voor vertrouwde bronnen met verplichte `trusted_source_id` en SHA-256; of `source=artifact` voor een tarball die door een andere GitHub Actions-run is geüpload.

  De workflow zet de kandidaat om naar `package-under-test`, hergebruikt de Docker E2E-releasescheduler voor die tarball en kan Telegram-QA uitvoeren voor dezelfde tarball met `telegram_mode=mock-openai` of `telegram_mode=live-frontier`. Wanneer de geselecteerde Docker-lanes `published-upgrade-survivor` bevatten, is het pakketartefact de kandidaat en selecteert `published_upgrade_survivor_baseline` de gepubliceerde referentieversie. `update-restart-auth` gebruikt het kandidaatpakket zowel als de geïnstalleerde CLI als het te testen pakket, zodat het beheerde herstartpad van de updateopdracht van de kandidaat wordt getest.

  Voorbeeld:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Veelgebruikte profielen:
  - `smoke`: lanes voor installatie/kanaal/agent, Gateway-netwerk en het opnieuw laden van configuratie
  - `package`: pakket-/update-/herstart-/Plugin-lanes die rechtstreeks met artefacten werken, zonder OpenWebUI of live ClawHub
  - `product`: pakketprofiel plus MCP-kanalen, opschoning van Cron/subagents, OpenAI-zoekopdrachten op het web en OpenWebUI
  - `full`: Docker-segmenten voor releasepaden met OpenWebUI
  - `custom`: exacte selectie van `docker_lanes` voor een gerichte heruitvoering

- Voer de handmatige `CI`-workflow rechtstreeks uit wanneer je alleen deterministische normale CI-dekking voor de releasekandidaat nodig hebt. Handmatige CI-starts omzeilen de scoping op wijzigingen en dwingen de Linux Node-shards, shards voor gebundelde Plugins, contractshards voor Plugins en kanalen, compatibiliteit met Node 22, `check-*`, `check-additional-*`, smokecontroles voor gebouwde artefacten, documentatiecontroles, Python-Skills, Windows, macOS en Control UI-i18n-lanes af. Zelfstandige handmatige CI-runs voeren Android alleen uit wanneer ze worden gestart met `include_android=true`; `Full Release Validation` geeft die invoer door aan de onderliggende CI-workflow.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Voer `pnpm qa:otel:smoke` uit bij het valideren van releasetelemetrie. Hiermee wordt QA-lab getest via een lokale OTLP/HTTP-ontvanger en worden de export van traces, metrische gegevens en logboeken, begrensde trace-attributen en de redactie van inhoud en identificatoren geverifieerd zonder dat Opik, Langfuse of een andere externe collector nodig is.
- Voer `pnpm qa:otel:collector-smoke` uit bij het valideren van collectorcompatibiliteit. Hiermee wordt dezelfde OTLP-export van QA-lab via een echte OpenTelemetry Collector-Docker-container geleid voordat de controles van de lokale ontvanger worden uitgevoerd.
- Voer `pnpm qa:prometheus:smoke` uit bij het valideren van beveiligde Prometheus-scraping. Hiermee wordt QA-lab getest, worden niet-geverifieerde scrapeverzoeken geweigerd en wordt gecontroleerd of voor de release essentiële metriekfamilies vrij blijven van promptinhoud, onbewerkte identificatoren, authenticatietokens en lokale paden.
- Voer `pnpm qa:observability:smoke` uit om de OpenTelemetry- en Prometheus-smokelanes voor de broncheckout direct na elkaar uit te voeren.
- Voer `pnpm release:check` uit vóór elke getagde release.
- De `OpenClaw NPM Release`-voorcontrole genereert releasebewijs voor afhankelijkheden voordat deze de npm-tarball verpakt. De kwetsbaarheidspoort voor npm-beveiligingsadviezen blokkeert de release. Het transitieve manifest-risico, het eigendom/installatieoppervlak van afhankelijkheden en de rapporten over wijzigingen in afhankelijkheden dienen alleen als releasebewijs. Het rapport over wijzigingen in afhankelijkheden vergelijkt de releasekandidaat met de vorige bereikbare releasetag. De voorcontrole uploadt het bewijs voor afhankelijkheden als `openclaw-release-dependency-evidence-<tag>` en neemt het ook op onder `dependency-evidence/` in het voorbereide npm-voorcontroleartefact. Het daadwerkelijke publicatiepad hergebruikt dat voorcontroleartefact en voegt vervolgens hetzelfde bewijs als `openclaw-<version>-dependency-evidence.zip` toe aan de GitHub-release.
- Voer `OpenClaw Release Publish` uit voor de muterende publicatiereeks nadat de tag bestaat. Start reguliere bèta- en stabiele publicaties vanuit vertrouwde `main`; de releasetag selecteert nog steeds de exacte doelcommit en kan naar `release/YYYY.M.PATCH` verwijzen. Tideclaw-alfapublicaties blijven op hun bijbehorende alfabranche. Geef de geslaagde OpenClaw npm-`preflight_run_id`, de geslaagde `full_release_validation_run_id` en de exacte `full_release_validation_run_attempt` door en behoud het standaardbereik voor het publiceren van Plugins, `all-publishable`, tenzij je bewust een gerichte reparatie uitvoert. De workflow voert de publicatie van Plugins naar npm, de publicatie van Plugins naar ClawHub en de publicatie van OpenClaw naar npm na elkaar uit, zodat het kernpakket niet vóór de geëxternaliseerde Plugins wordt gepubliceerd; de promotie voor Windows en Android wordt gelijktijdig met de npm-publicatie van de kern uitgevoerd voor de conceptreleasepagina. Hervatte publicatieruns kunnen worden voortgezet: bij een reeds gepubliceerde npm-versie van de kern wordt de kernstart overgeslagen nadat de workflow heeft bewezen dat de registertarball overeenkomt met het voorcontroleartefact van de tag. De promotie voor Windows/Android wordt overgeslagen wanneer de release al aan het geverifieerde artefactcontract voldoet, zodat bij een nieuwe poging alleen de mislukte fasen opnieuw worden uitgevoerd. Voor gerichte reparaties van uitsluitend Plugins zijn `plugin_publish_scope=selected` en een niet-lege lijst met Plugins vereist. `all-publishable`-runs voor uitsluitend Plugins vereisen volledig, onveranderlijk bewijs van de voorcontrole en Full Release Validation; gedeeltelijk bewijs wordt geweigerd.
- Voor stabiele `OpenClaw Release Publish` is een exacte `windows_node_tag` vereist nadat de bijbehorende niet-voorlopige `openclaw/openclaw-windows-node`-release bestaat, plus de door de kandidaat goedgekeurde `windows_node_installer_digests`-map. Voordat een onderliggende publicatieworkflow wordt gestart, wordt gecontroleerd of die bronrelease is gepubliceerd, niet voorlopig is, de vereiste x64-/ARM64-installatieprogramma's bevat en nog steeds met die goedgekeurde map overeenkomt. Vervolgens wordt `Windows Node Release` gestart terwijl de OpenClaw-release nog een concept is, waarbij de vastgezette digest-map voor de installatieprogramma's ongewijzigd wordt doorgegeven. De onderliggende workflow downloadt de ondertekende Windows Hub-installatieprogramma's van precies die tag, vergelijkt ze met de vastgezette digests, controleert op een Windows-runner of hun Authenticode-handtekeningen de verwachte ondertekenaar van OpenClaw Foundation gebruiken, schrijft een SHA-256-manifest en uploadt de installatieprogramma's plus het manifest naar de canonieke OpenClaw-release op GitHub. Vervolgens worden de gepromote artefacten opnieuw gedownload en worden hun lidmaatschap van het manifest en hashes gecontroleerd. De bovenliggende workflow verifieert vóór publicatie het huidige contract voor de x64-, ARM64- en controlesomartefacten. Rechtstreeks herstel weigert onverwachte `OpenClawCompanion-*`-artefactnamen voordat de verwachte contractartefacten worden vervangen door de vastgezette bronbytes.

  Start `Windows Node Release` alleen handmatig voor herstel en geef altijd een exacte tag door, nooit `latest`, plus de expliciete `expected_installer_digests`-JSON-map uit de goedgekeurde bronrelease. Downloadlinks op de website moeten verwijzen naar exacte URL's van OpenClaw-releaseartefacten voor de huidige stabiele release, of pas naar `releases/latest/download/...` nadat is gecontroleerd dat de omleiding van GitHub naar de nieuwste versie naar diezelfde release verwijst; link niet uitsluitend naar de releasepagina van de bijbehorende repository.

- Releasecontroles worden nu uitgevoerd in een afzonderlijke handmatige workflow: `OpenClaw Release Checks`. Deze voert vóór releasegoedkeuring ook de mockpariteitslane van QA Lab uit, plus het Matrix-releaseprofiel en de Telegram-QA-lane. De live-lanes gebruiken de omgeving `qa-live-shared`; Telegram gebruikt ook leases voor Convex-CI-referenties. Voer de handmatige workflow `QA-Lab - All Lanes` uit met `matrix_profile=all` wanneer je elk onderhouden Matrix-scenario wilt; de workflow verdeelt die selectie over de transport-, media- en E2EE-profielen om volledig bewijs binnen de time-outs per taak te houden.
- Cross-OS-runtimevalidatie voor installatie en upgrades maakt deel uit van de openbare `OpenClaw Release Checks` en `Full Release Validation`, die de herbruikbare workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` rechtstreeks aanroepen. Deze scheiding is opzettelijk: houd het echte npm-releasepad kort, deterministisch en gericht op artefacten, terwijl tragere live-controles in hun eigen lane blijven zodat ze de publicatie niet vertragen of blokkeren.
- Releasecontroles die geheimen bevatten, moeten worden gestart via `Full Release Validation` of vanuit de `main`/release-workflowref, zodat de workflowlogica en geheimen beheerst blijven.
- `OpenClaw Release Checks` accepteert een branch, tag of volledige commit-SHA, zolang de herleide commit bereikbaar is vanuit een OpenClaw-branch of releasetag.
- De uitsluitend voor validatie bedoelde preflight van `OpenClaw NPM Release` accepteert ook de huidige volledige workflowbranch-commit-SHA van 40 tekens zonder een gepushte tag te vereisen. Dat SHA-pad is uitsluitend voor validatie en kan niet worden gepromoveerd tot een echte publicatie. In SHA-modus maakt de workflow `v<package.json version>` alleen voor de controle van pakketmetadata aan; voor echt publiceren blijft een echte releasetag vereist.
- Beide workflows houden het echte publicatie- en promotiepad op door GitHub gehoste runners, terwijl het niet-muterende validatiepad de grotere Linux-runners van Blacksmith kan gebruiken.
- Die workflow voert `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` uit met zowel de workflowgeheimen `OPENAI_API_KEY` als `ANTHROPIC_API_KEY`.
- De preflight voor npm-releases wacht niet langer op de afzonderlijke lane voor releasecontroles.
- Voer vóór je lokaal een release candidate tagt `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check` uit. De helper voert de snelle releasewaarborgen, releasecontroles voor plugin-npm/ClawHub, de build, de UI-build en `release:openclaw:npm:check` uit in de volgorde die veelvoorkomende fouten die goedkeuring blokkeren detecteert voordat de publicatieworkflow van GitHub begint.
- Voer vóór goedkeuring `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` uit (of de overeenkomstige prerelease-/correctietag).
- Voer na publicatie naar npm `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` uit (of de overeenkomstige bèta-/correctieversie) om het gepubliceerde installatiepad vanuit het register in een nieuw tijdelijk voorvoegsel te verifiëren.
- Voer na een bètapublicatie `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` uit om onboarding van het geïnstalleerde pakket, Telegram-configuratie en echte Telegram-E2E tegen het gepubliceerde npm-pakket te verifiëren met de gedeelde pool van geleasete Telegram-referenties. Voor eenmalige lokale uitvoeringen door beheerders mogen de Convex-variabelen worden weggelaten en de drie `OPENCLAW_QA_TELEGRAM_*`-omgevingsreferenties rechtstreeks worden doorgegeven.
- Gebruik `pnpm release:beta-smoke -- --beta betaN` om de volledige post-publicatie-bètarooktest vanaf een beheerdersmachine uit te voeren. De helper voert Parallels-validatie voor npm-updates en nieuwe doelen uit, start `NPM Telegram Beta E2E`, pollt de exacte workflowuitvoering, downloadt het artefact en drukt het Telegram-rapport af.
- Beheerders kunnen dezelfde post-publicatiecontrole vanuit GitHub Actions uitvoeren via de handmatige workflow `NPM Telegram Beta E2E`. Deze is opzettelijk uitsluitend handmatig en wordt niet bij elke merge uitgevoerd.
- Releaseautomatisering voor beheerders gebruikt eerst preflight en daarna promotie:
  - Een echte npm-publicatie moet slagen voor een succesvolle npm-`preflight_run_id`.
  - Reguliere orkestratie en preflight voor bèta- en stabiele publicaties gebruiken vertrouwde `main` tegen de exacte doeltag. Voor publicatie en preflight van een Tideclaw-alpha wordt de overeenkomstige alpha-branch gebruikt.
  - Stabiele npm-releases gebruiken standaard `beta`; een stabiele npm-publicatie kan via workflowinvoer expliciet op `latest` worden gericht.
  - Tokengebaseerde mutatie van npm-dist-tags bevindt zich in `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, omdat `npm dist-tag add` nog steeds `NPM_TOKEN` nodig heeft terwijl de bronrepository uitsluitend OIDC-publicatie behoudt.
  - De openbare `macOS Release` is uitsluitend voor validatie; wanneer een tag alleen op een releasebranch staat maar de workflow vanuit `main` wordt gestart, stel je `public_release_branch=release/YYYY.M.PATCH` in.
  - Een echte macOS-publicatie moet slagen voor succesvolle macOS-`preflight_run_id` en `validate_run_id`.
  - Echte publicatiepaden promoveren voorbereide artefacten in plaats van ze opnieuw te bouwen.
- Voor stabiele correctiereleases zoals `YYYY.M.PATCH-N` controleert de post-publicatieverificator ook hetzelfde upgradepad met tijdelijk voorvoegsel van `YYYY.M.PATCH` naar `YYYY.M.PATCH-N`, zodat releasecorrecties oudere globale installaties niet ongemerkt op de basispayload van de stabiele release kunnen achterlaten.
- De preflight voor npm-releases faalt gesloten tenzij de tarball zowel `dist/control-ui/index.html` als een niet-lege `dist/control-ui/assets/`-payload bevat, zodat we niet opnieuw een leeg browserdashboard uitbrengen.
- De post-publicatieverificatie controleert ook of gepubliceerde Plugin-toegangspunten en pakketmetadata aanwezig zijn in de geïnstalleerde registerindeling. Een release waarin runtimepayloads van plugins ontbreken, faalt in de post-publicatieverificator en kan niet naar `latest` worden gepromoveerd.
- `pnpm test:install:smoke` handhaaft ook het `unpackedSize`-budget van npm pack voor de tarball van de kandidaatupdate, zodat installer-E2E onbedoelde pakketgroei detecteert vóór het publicatiepad van de release.
- Als het releasewerk de CI-planning, timingmanifesten van extensies of testmatrices van extensies heeft gewijzigd, genereer en beoordeel je vóór goedkeuring opnieuw de door de planner beheerde `plugin-prerelease-extension-shard`-matrixuitvoer vanuit `.github/workflows/plugin-prerelease.yml`, zodat de releaseopmerkingen geen verouderde CI-indeling beschrijven.
- Gereedheid van een stabiele macOS-release omvat ook de updateroppervlakken: de GitHub-release moet uiteindelijk de verpakte `.zip`, `.dmg` en `.dSYM.zip` bevatten; `appcast.xml` op `main` moet na publicatie naar het nieuwe stabiele zipbestand verwijzen (de macOS-publicatieworkflow commit dit automatisch of opent een appcast-PR wanneer rechtstreeks pushen is geblokkeerd); de verpakte app moet een niet-debug-bundel-ID, een niet-lege Sparkle-feed-URL en een `CFBundleVersion` behouden die ten minste gelijk is aan de canonieke minimale Sparkle-build voor die releaseversie.

## Testboxen voor releases

`Full Release Validation` is de manier waarop operators de volledige productmatrix vanuit één toegangspunt starten. Gebruik de helper zodat elke onderliggende workflow wordt uitgevoerd vanuit een tijdelijke branch die is vastgezet op één vertrouwde `main`-workflow-SHA, terwijl de gevraagde commit de geteste kandidaat blijft:

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

De helper haalt de huidige `origin/main` op, pusht `release-ci/<workflow-sha>-...` op die vertrouwde workflowcommit, leidt `beta` af uit alpha-/bètapakketversies en anders `stable`, start `Full Release Validation` vanuit de tijdelijke branch met `ref=<target-sha>`, verifieert dat elke onderliggende workflow-`headSha` overeenkomt met de vastgezette SHA van de bovenliggende workflow en verwijdert vervolgens de tijdelijke branch. Geef `-f reuse_evidence=false` door om een nieuwe uitvoering af te dwingen, `-f release_profile=full` voor de brede adviserende sweep of `--workflow-sha <trusted-main-sha>` om een oudere commit vast te zetten die nog steeds bereikbaar is vanuit de huidige `origin/main`. De workflow zelf schrijft nooit repositoryrefs. Zo blijft releasegereedschap dat alleen op main beschikbaar is bruikbaar zonder gereedschapscommits aan de kandidaat toe te voegen en wordt voorkomen dat per ongeluk bewijs van een nieuwere onderliggende `main`-uitvoering wordt gebruikt.

Nadat de Code SHA groen is, commit je alleen `CHANGELOG.md` en voer je dezelfde helper uit met de Release SHA:

```bash
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH
```

De tweede bovenliggende workflow hergebruikt productbewijs alleen wanneer GitHub bewijst dat de Release SHA afstamt van de Code SHA en de volledige set gewijzigde paden exact `CHANGELOG.md` is. Deze registreert `changelog-only-release-v1` en start geen onderliggende productworkflows. De npm-preflight en pakket-/installatieacceptatie worden nog steeds op de Release SHA uitgevoerd, omdat de bytes van de tarball zijn gewijzigd.

Voor een nieuwe Code SHA herleidt de workflow het doel, start de handmatige `CI` en start vervolgens `OpenClaw Release Checks`. `OpenClaw Release Checks` verdeelt de installatierooktest, Cross-OS-releasecontroles, live-/E2E-Dockerdekking voor het releasepad wanneer soak is ingeschakeld, Package Acceptance met de canonieke Telegram-pakket-E2E, QA Lab-pariteit, live Matrix en live Telegram. Een volledige/all-uitvoering is alleen aanvaardbaar wanneer de samenvatting van `Full Release Validation` `normal_ci`, `plugin_prerelease` en `release_checks` als geslaagd toont, tenzij bij een gerichte heruitvoering de afzonderlijke onderliggende `Plugin Prerelease` opzettelijk is overgeslagen. Gebruik de zelfstandige onderliggende `npm-telegram` alleen voor een gerichte heruitvoering van het gepubliceerde pakket met `release_package_spec` of `npm_telegram_package_spec`. De uiteindelijke samenvatting van de verificator bevat tabellen met de traagste taken voor elke onderliggende uitvoering, zodat de releasemanager het huidige kritieke pad kan zien zonder logboeken te downloaden.

De onderliggende workflow voor productprestaties gebruikt in dit releasepad uitsluitend artefacten. De
overkoepelende workflow start deze met `publish_reports=false`, en de validatie wordt afgewezen
tenzij de uitsluitend op artefacten gerichte waarborg bewijst dat de Clawgrit-rapportpubliceerder
overgeslagen bleef.

Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de volledige fasematrix, exacte taaknamen van workflows, verschillen tussen het stabiele en volledige profiel, artefacten en handvatten voor gerichte heruitvoeringen.

Onderliggende workflows worden gestart vanuit de op een SHA vastgezette vertrouwde ref waarop `Full Release Validation` wordt uitgevoerd. Elke onderliggende uitvoering moet exact dezelfde SHA als de bovenliggende workflow gebruiken. Gebruik voor releasebewijs geen onbewerkte `--ref main -f ref=<sha>`-starts; gebruik `pnpm ci:full-release --sha <target-sha> --target-ref release/YYYY.M.PATCH`.

Gebruik `release_profile` om de breedte van live/providers te selecteren:

- `beta`: snelste releasekritieke live- en Dockerpad voor OpenAI/core
- `stable`: bèta plus dekking voor stabiele providers/backends voor releasegoedkeuring
- `full`: stabiel plus brede adviserende provider-/mediadekking

Stabiele en volledige validatie voeren vóór promotie altijd de volledige live-/E2E-sweep, de sweep van het Docker-releasepad en de begrensde sweep voor overlevende gepubliceerde upgrades uit. Gebruik `run_release_soak=true` om dezelfde sweep voor een bèta aan te vragen. Die sweep omvat de nieuwste vier stabiele pakketten plus vastgezette `2026.4.23`- en `2026.5.2`-baselines en oudere `2026.4.15`-dekking, waarbij dubbele baselines worden verwijderd en elke baseline in een eigen Docker-runnertaak wordt geshard.

`OpenClaw Release Checks` gebruikt de vertrouwde workflowref om de doelref eenmaal als `release-package-under-test` te herleiden en hergebruikt dat artefact in Cross-OS-, Package Acceptance- en Dockercontroles voor het releasepad wanneer soak wordt uitgevoerd. Zo gebruiken alle pakketgerichte testboxen dezelfde bytes en worden herhaalde pakketbuilds voorkomen. Nadat een bèta al op npm staat, stel je `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` in zodat releasecontroles het uitgebrachte pakket eenmaal downloaden, de SHA van de buildbron uit `dist/build-info.json` extraheren en dat artefact hergebruiken voor Cross-OS-, Package Acceptance-, releasepad-Docker- en pakket-Telegram-lanes.

De Cross-OS-installatierooktest voor OpenAI gebruikt `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer de repository-/organisatievariabele is ingesteld, en anders `openai/gpt-5.6-luna`, omdat deze lane pakketinstallatie, onboarding, het starten van de Gateway en één live agentbeurt bewijst in plaats van het krachtigste model te benchmarken. De bredere live-providermatrix blijft de plaats voor modelspecifieke dekking.

Gebruik deze varianten afhankelijk van de releasefase:

```bash
# Valideer de productvolledige Code SHA.
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH

# Valideer de Release SHA met alleen changelogwijzigingen door productbewijs van de Code SHA te hergebruiken.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH

# Voeg na het publiceren van een bèta Telegram-E2E voor het gepubliceerde pakket toe.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Gebruik de volledige overkoepelende workflow niet als eerste heruitvoering na een gerichte oplossing. Als één box mislukt, gebruik dan voor het volgende bewijs de mislukte onderliggende workflow, job, Docker-lane, het pakketprofiel, de modelprovider of de QA-lane. Voer de volledige overkoepelende workflow alleen opnieuw uit wanneer de oplossing de gedeelde releaseorkestratie heeft gewijzigd of eerder bewijs voor alle boxen verouderd heeft gemaakt. De laatste verificatiestap van de overkoepelende workflow controleert de vastgelegde uitvoerings-id's van de onderliggende workflows opnieuw. Voer daarom, nadat een onderliggende workflow met succes opnieuw is uitgevoerd, alleen de mislukte bovenliggende job `Verify full validation` opnieuw uit.

`rerun_group=all` kan een eerdere geslaagde uitvoering van de overkoepelende workflow hergebruiken wanneer het releaseprofiel,
de effectieve soak-instelling en de validatie-invoer overeenkomen en de doel-SHA
identiek is of het nieuwe doel een afstammeling is waarvan de volledige reeks gewijzigde paden
exact `CHANGELOG.md` is. Bij hergebruik van exact hetzelfde doel wordt
`exact-target-full-validation-v1` vastgelegd; de Release SHA na validatie legt
`changelog-only-release-v1` vast. Die laatste hergebruikt alleen de productvalidatie. De npm-
preflight, pakketbytes, herkomst van de releaseopmerkingen en acceptatie van installatie/updates
moeten nog steeds worden uitgevoerd voor de Release SHA. Elke wijziging aan versie, bron, gegenereerde
bestanden, afhankelijkheden, pakketten of een door de workflow beheerd doel vereist een nieuwe Code SHA
en een nieuwe volledige validatie. Nieuwere uitvoeringen van de overkoepelende workflow voor dezelfde `release/*`-ref en
heruitvoeringsgroep vervangen lopende uitvoeringen automatisch. Geef
`reuse_evidence=false` door om een nieuwe volledige uitvoering af te dwingen.

Geef voor begrensd herstel `rerun_group` door aan de overkoepelende workflow. `all` is de echte releasekandidaatuitvoering, `ci` voert alleen de normale onderliggende CI-workflow uit, `plugin-prerelease` voert alleen de onderliggende workflow voor releasegebonden plugins uit, `release-checks` voert elke releasebox uit en de beperktere releasegroepen zijn `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` en `npm-telegram`. Gerichte heruitvoeringen van `npm-telegram` vereisen `release_package_spec` of `npm_telegram_package_spec`; volledige/alle uitvoeringen gebruiken de canonieke Telegram-E2E voor pakketten binnen Pakketacceptatie. Aan gerichte heruitvoeringen voor meerdere besturingssystemen kan `cross_os_suite_filter=windows/packaged-upgrade` of een ander filter voor besturingssysteem/testsuite worden toegevoegd. Mislukte QA-releasecontroles blokkeren de normale releasevalidatie, inclusief de vereiste drift van dynamische OpenClaw-tools in het standaardniveau. Tideclaw-alfa-uitvoeringen mogen releasecontrolelanes die niet over pakketveiligheid gaan nog steeds als adviserend behandelen. Met `release_profile=beta` zijn de liveprovidersuites van `Run repo/live E2E validation` adviserend (waarschuwingen, geen blokkades); in stabiele en volledige profielen blijven ze blokkerend. Wanneer `live_suite_filter` expliciet om een afgeschermde live QA-lane zoals Discord, WhatsApp of Slack vraagt, moet de overeenkomende repovariabele `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` zijn ingeschakeld; anders mislukt het vastleggen van invoer in plaats van de lane stilzwijgend over te slaan.

### Vitest

De Vitest-box is de handmatige onderliggende workflow `CI`. Handmatige CI omzeilt opzettelijk de afbakening op basis van wijzigingen en dwingt de normale testgrafiek voor de releasekandidaat af: Linux Node-shards, shards voor gebundelde plugins, contractshards voor plugins en kanalen, compatibiliteit met Node 22, `check-*`, `check-additional-*`, smokecontroles van gebouwde artefacten, documentatiecontroles, Python-Skills, Windows, macOS en i18n voor de Control UI. Android wordt opgenomen wanneer `Full Release Validation` de box uitvoert, omdat de overkoepelende workflow `include_android=true` doorgeeft; zelfstandige handmatige CI vereist `include_android=true` voor Android-dekking.

Gebruik deze box om de vraag te beantwoorden: "heeft de broncodeboom de volledige normale testsuite doorstaan?" Dit is niet hetzelfde als productvalidatie via het releasepad. Te bewaren bewijs:

- `Full Release Validation`-samenvatting met de URL van de gestarte `CI`-uitvoering
- `CI`-uitvoering geslaagd voor de exacte doel-SHA
- namen van mislukte of trage shards uit de CI-jobs bij onderzoek naar regressies
- Vitest-tijdartefacten zoals `.artifacts/vitest-shard-timings.json` wanneer een uitvoering prestatieanalyse vereist

Voer handmatige CI alleen rechtstreeks uit wanneer de release deterministische normale CI vereist, maar niet de Docker-, QA Lab-, live-, cross-OS- of pakketboxen. Gebruik de eerste opdracht voor rechtstreekse CI zonder Android. Voeg `include_android=true` toe wanneer rechtstreekse CI voor de releasekandidaat Android moet omvatten:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

De Docker-box bevindt zich in `OpenClaw Release Checks` tot en met `openclaw-live-and-e2e-checks-reusable.yml`, plus de workflow `install-smoke` in releasemodus. Deze valideert de releasekandidaat via verpakte Docker-omgevingen in plaats van alleen tests op broncodeniveau.

De Docker-dekking voor releases omvat:

- volledige installatiesmoke met de trage globale Bun-installatiesmoke ingeschakeld
- voorbereiding/hergebruik van de smoke-image van het Dockerfile in de hoofdmap per doel-SHA, waarbij QR-, root/Gateway- en installer/Bun-smokejobs als afzonderlijke installatiesmokeshards worden uitgevoerd
- E2E-lanes van de repository
- Docker-chunks voor het releasepad: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` tot en met `plugins-runtime-install-h` en `openwebui`
- OpenWebUI-dekking op een speciale runner met een grote schijf wanneer daarom wordt gevraagd
- opgesplitste lanes voor installatie/verwijdering van gebundelde plugins, `bundled-plugin-install-uninstall-0` tot en met `bundled-plugin-install-uninstall-23`
- live-/E2E-providersuites en Docker-dekking voor live modellen wanneer de releasecontroles live suites omvatten

Gebruik Docker-artefacten voordat je opnieuw uitvoert. De planner voor het releasepad uploadt `.artifacts/docker-tests/` met lanelogboeken, `summary.json`, `failures.json`, fasetijden, de plannerplanning als JSON en opdrachten voor heruitvoering. Gebruik voor gericht herstel `docker_lanes=<lane[,lane]>` in de herbruikbare live-/E2E-workflow in plaats van alle releasechunks opnieuw uit te voeren. Gegenereerde opdrachten voor heruitvoering bevatten waar beschikbaar eerdere `package_artifact_run_id`- en voorbereide Docker-image-invoer, zodat een mislukte lane dezelfde tarball en GHCR-images kan hergebruiken.

### QA Lab

De QA Lab-box maakt ook deel uit van `OpenClaw Release Checks`. Dit is de releasepoort voor agentgedrag en gedrag op kanaalniveau, los van de pakketmechanica van Vitest en Docker.

De QA Lab-dekking voor releases omvat:

- mockpariteitslane die de kandidaat-lane van OpenAI vergelijkt met de `anthropic/claude-opus-4-8`-baseline via het agentpariteitspakket
- releaseprofiel voor de live-adapter van Matrix dat de `qa-live-shared`-omgeving gebruikt
- live Telegram-QA-lane die Convex CI-credentialsleases gebruikt
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` of `pnpm qa:observability:smoke` wanneer releasetelemetrie expliciet lokaal bewijs vereist

Gebruik deze box om de vraag te beantwoorden: "gedraagt de release zich correct in QA-scenario's en live kanaalstromen?" Bewaar bij goedkeuring van de release de artefact-URL's voor de pariteits-, Matrix- en Telegram-lanes. Volledige Matrix-dekking blijft beschikbaar als een handmatige gesharde QA Lab-uitvoering in plaats van als de standaard releasekritieke lane.

### Pakket

De Pakket-box is de poort voor het installeerbare product. Deze wordt ondersteund door `Package Acceptance` en de resolver `scripts/resolve-openclaw-package-candidate.mjs`. De resolver normaliseert een kandidaat naar de `package-under-test`-tarball die door Docker-E2E wordt gebruikt, valideert de pakketinventaris, legt de pakketversie en SHA-256 vast en houdt de workflowharnas-ref gescheiden van de pakketbron-ref.

Ondersteunde kandidaatbronnen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` of een exacte OpenClaw-releaseversie
- `source=ref`: verpak een vertrouwde `package_ref`-branch, tag of volledige commit-SHA met het geselecteerde `workflow_ref`-harnas
- `source=url`: download een openbare HTTPS-`.tgz` met vereiste `package_sha256`; URL-credentials, niet-standaard HTTPS-poorten, private/interne/voor speciaal gebruik bestemde hostnamen of herleide adressen en onveilige omleidingen worden geweigerd
- `source=trusted-url`: download een HTTPS-`.tgz` met vereiste `package_sha256` en `trusted_source_id` uit een benoemd beleid in `.github/package-trusted-sources.json`; gebruik dit voor door beheerders beheerde ondernemingsmirrors of private pakketrepository's in plaats van een omzeiling voor private netwerken op invoerniveau toe te voegen aan `source=url`
- `source=artifact`: hergebruik een `.tgz` die door een andere GitHub Actions-uitvoering is geüpload

`OpenClaw Release Checks` voert Pakketacceptatie uit met `source=artifact`, het voorbereide releasepakketartefact, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai`. Pakketacceptatie voert migratie, update, een door root beheerde VPS-upgrade, herstart na een update met geconfigureerde authenticatie, live installatie van een ClawHub-Skill, opschoning van verouderde plugin-afhankelijkheden, offline pluginfixtures, pluginupdates, escapeverharding voor pluginopdrachtbindingen en Telegram-pakket-QA uit met dezelfde opgeloste tarball. Blokkerende releasecontroles gebruiken standaard de baseline van het laatst gepubliceerde pakket; het bètaprofiel met `run_release_soak=true`, `release_profile=stable` of `release_profile=full` breidt de sweep voor overlevende gepubliceerde upgrades uit naar `last-stable-4` plus de vastgepinde baselines `2026.4.23`, `2026.5.2` en `2026.4.15` met `reported-issues`-scenario's. Gebruik Pakketacceptatie met `source=npm` voor een reeds uitgebrachte kandidaat, `source=ref` voor een door SHA ondersteunde lokale npm-tarball vóór publicatie, `source=trusted-url` voor een door beheerders beheerde ondernemings-/privémirror of `source=artifact` voor een voorbereide tarball die door een andere GitHub Actions-uitvoering is geüpload.

Dit is de GitHub-eigen vervanging voor het grootste deel van de pakket-/updatedekking waarvoor voorheen Parallels nodig was. Releasecontroles voor meerdere besturingssystemen blijven belangrijk voor besturingssysteemspecifieke onboarding, installatieprogramma's en platformgedrag, maar productvalidatie van pakketten/updates moet bij voorkeur Pakketacceptatie gebruiken.

De canonieke checklist voor de validatie van updates en plugins is [Updates en plugins testen](/nl/help/testing-updates-plugins). Gebruik deze om te bepalen welke lokale, Docker-, Pakketacceptatie- of releasecontrolelane een wijziging aan de installatie/update van een plugin, doctor-opschoning of migratie van een gepubliceerd pakket bewijst. Uitputtende migratie van gepubliceerde updates vanuit elk stabiel `2026.4.23+`-pakket is een afzonderlijke handmatige `Update Migration`-workflow en maakt geen deel uit van Volledige release-CI.

De soepelheid van oudere pakketacceptatie is bewust in tijd begrensd. Pakketten tot en met `2026.4.25` mogen het compatibiliteitspad gebruiken voor hiaten in metadata die al naar npm zijn gepubliceerd: private QA-inventarisvermeldingen die in de tarball ontbreken, ontbrekende `gateway install --wrapper`, ontbrekende patchbestanden in de uit de tarball afgeleide gitfixture, ontbrekende persistente `update.channel`, oudere locaties van plugininstallatierecords, ontbrekende persistentie van marketplace-installatierecords en migratie van configuratiemetadata tijdens `plugins update`. Het gepubliceerde `2026.4.26`-pakket mag waarschuwen voor stempelbestanden met lokale buildmetadata die al zijn uitgebracht. Latere pakketten moeten aan de moderne pakketcontracten voldoen; dezelfde hiaten laten de releasevalidatie dan mislukken.

Gebruik bredere Pakketacceptatieprofielen wanneer de releasevraag over een daadwerkelijk installeerbaar pakket gaat:

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

- `smoke`: snelle trajecten voor pakketinstallatie/kanaal/agent, Gateway-netwerk en herladen van configuratie
- `package`: contracten voor installatie/update/herstart/Plugin-pakketten plus live bewijs van installatie van een ClawHub-Skill; dit is de standaard voor releasecontroles
- `product`: `package` plus MCP-kanalen, opschoning van Cron/subagents, OpenAI-webzoekopdrachten en OpenWebUI
- `full`: onderdelen van het Docker-releasetraject met OpenWebUI
- `custom`: exacte lijst van `docker_lanes` voor gerichte heruitvoeringen

Schakel voor Telegram-bewijs van een pakketkandidaat `telegram_mode=mock-openai` of `telegram_mode=live-frontier` in bij Package Acceptance. De workflow geeft het opgeloste `package-under-test`-tarball door aan het Telegram-traject; de zelfstandige Telegram-workflow accepteert nog steeds een gepubliceerde npm-specificatie voor controles na publicatie.

## Reguliere automatisering van releasepublicaties

Voor bèta, `latest`, Plugin-, GitHub Release- en platformpublicatie
is `OpenClaw Release Publish` het normale muterende toegangspunt. Het maandelijkse
npm-only uitgebreide-stabiele traject van `.33+` gebruikt deze orchestrator niet. De
reguliere workflow orkestreert de workflows voor vertrouwde publicatie in de volgorde die de
release vereist:

1. Check de releasetag uit en bepaal de commit-SHA ervan.
2. Controleer of de tag bereikbaar is vanuit `main` of `release/*` (of een Tideclaw-alfabranch voor alfapre-releases).
3. Voer `pnpm plugins:sync:check` uit.
4. Start `Plugin NPM Release` met `publish_scope=all-publishable` en `ref=<release-sha>`.
5. Start `Plugin ClawHub Release` met hetzelfde bereik en dezelfde SHA.
6. Start `OpenClaw NPM Release` met de releasetag, npm-dist-tag en opgeslagen `preflight_run_id` nadat de opgeslagen `full_release_validation_run_id` en de exacte uitvoeringspoging zijn geverifieerd.
7. Maak voor stabiele releases de GitHub-release als concept aan of werk deze bij, start `Windows Node Release` met de expliciete `windows_node_tag` en door de kandidaat goedgekeurde `windows_node_installer_digests`, en verifieer de canonieke Windows-installatieprogramma-/checksum-assets. Start ook `Android Release` om de ondertekende APK voor de exacte tag plus checksum en herkomst te bouwen. Verifieer beide contracten voor systeemeigen assets voordat je het concept publiceert.

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

Stabiele publicatie naar de standaard bèta-dist-tag:

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

Gebruik de workflows `Plugin NPM Release` en `Plugin ClawHub Release` op lager niveau alleen voor gericht herstel- of herpublicatiewerk. `OpenClaw Release Publish` weigert `plugin_publish_scope=selected` wanneer `publish_openclaw_npm=true`, zodat het kernpakket niet kan worden uitgebracht zonder elke publiceerbare officiële Plugin, waaronder `@openclaw/diffs-language-pack`. Stel voor herstel van een geselecteerde Plugin `publish_openclaw_npm=false` in met `plugin_publish_scope=selected` en `plugins=@openclaw/name`, of start de onderliggende workflow rechtstreeks.

De eerste publicatie voor de ClawHub-bootstrap is de uitzondering: start `Plugin ClawHub New`
vanuit de vertrouwde `main` en geef de volledige doelrelease-SHA door via `ref`.
Voer de bootstrapworkflow zelf nooit uit vanuit de releasetag of -branch:

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

Validatie vóór de tag vereist `dry_run=true`, weigert invoer voor releasetags en bovenliggende uitvoeringen
en accepteert alleen een exact doel dat bereikbaar is vanuit `main` of `release/*`.
Deze validatie laadt geen ClawHub-referenties, publiceert geen pakketbytes en wijzigt de configuratie
voor vertrouwde publicatie niet. De workflow bepaalt nog steeds het live registerplan,
checkt het doel alleen in een taak zonder geheimen uit en verpakt het daar, materialiseert de
vergrendelde ClawHub-toolchain en valideert het onveranderlijke artefact en de pakket-
slug/-identiteit voordat de releasetag bestaat. Keur de omgeving
`clawhub-plugin-bootstrap` pas goed nadat de verpakkingstaken zonder geheimen
zijn voltooid; deze beschermde validatietaak heeft geen referenties of mutatiecommando's.

Een goedgekeurde proefuitvoering of echte bootstrap na tagging moet de exacte
releasetag plus de id, poging en branch van de bovenliggende `OpenClaw Release Publish`-uitvoering bevatten.
De bovenliggende uitvoering verklaart haar eigen workflow-SHA en een afzonderlijke exacte vertrouwde
`main`-SHA voor `Plugin ClawHub New`; de onderliggende uitvoering en elke goedkeuring van een beschermde
omgeving moeten overeenkomen met die goedgekeurde onderliggende SHA. De releasetag wordt
vóór elke publicatiepoging en mutatie van de vertrouwde publicatie opnieuw gecontroleerd.

De verpakkingstaak
uploadt één onveranderlijk artefact waarvan de naam, Actions-artefact-id/-digest,
producerende uitvoering/poging, doel-SHA en SHA-256/grootte van het tarball per pakket
worden doorgegeven aan de validatie- en beschermde taken. De beschermde taak checkt alleen vertrouwde
`main`-tools uit, valideert de artefacttuple via de GitHub-API, downloadt
op exacte artefact-id, berekent de hash van elk tarball opnieuw en valideert lokale TAR-paden en
pakketidentiteit met de USTAR-canonicalisatieregels van de vastgezette CLI. Elke
kandidaat doorloopt vervolgens de proefpublicatie van de vastgezette CLI, die terugkeert vóór
registeropzoeking of authenticatie. Het voorfilter van de referentietaak begrenst gecomprimeerde ClawPacks
op 120 MiB, de totale bestandsinhoud op 50 MiB, uitgepakte TAR-gegevens op 64 MiB en
het aantal TAR-items op 10.000. Herstel van vertrouwde publicatie voor bestaande pakketten blijft
alleen configureren, maar verpakt nog steeds het doel en vereist de aangevraagde tag
plus exacte gelijkheid van registerbytes en metadata voordat de configuratie voor vertrouwde publicatie
wordt gewijzigd. Verificatie na publicatie downloadt het ClawHub-artefact en
vereist dezelfde SHA-256 en grootte. Een herstel via het opnieuw uitvoeren van mislukte taken mag het pakketartefact van een eerdere
poging alleen hergebruiken wanneer de exacte producerende taak
met succes is voltooid. Het definitieve bewijs legt ook de vergrendelde ClawHub-versie, de SHA-256
van de vergrendeling en de npm-integriteit vast. Een afwijking vereist een nieuwe pakketversie.

## Invoer voor de NPM-workflow

`OpenClaw NPM Release` accepteert deze door de operator beheerde invoer:

- `tag`: vereiste releasetag zoals `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` of `v2026.4.2-alpha.1`; wanneer `preflight_only=true`, mag dit ook de huidige volledige workflowbranch-commit-SHA van 40 tekens zijn voor alleen-validatievoorcontrole
- `preflight_only`: `true` voor alleen validatie/build/pakket, `false` voor het echte publicatietraject
- `preflight_run_id`: id van een bestaande geslaagde voorcontrole-uitvoering, vereist voor het echte publicatietraject zodat de workflow het voorbereide tarball hergebruikt in plaats van het opnieuw te bouwen
- `full_release_validation_run_id`: id van een geslaagde `Full Release Validation`-uitvoering voor deze tag/SHA, vereist voor echte publicatie. Bètapublicaties mogen alleen op basis van de voorcontrole doorgaan met een waarschuwing, maar stabiele/`latest`-promotie vereist deze nog steeds.
- `full_release_validation_run_attempt`: exacte positieve uitvoeringspoging gekoppeld aan `full_release_validation_run_id`; vereist wanneer de uitvoerings-id wordt opgegeven, zodat heruitvoeringen het autorisatiebewijs tijdens publicatie niet kunnen wijzigen.
- `release_publish_run_id`: id van een goedgekeurde `OpenClaw Release Publish`-uitvoering; vereist wanneer deze workflow door die bovenliggende uitvoering wordt gestart (aanroepen voor echte publicatie door een botactor)
- `plugin_npm_run_id`: id van een geslaagde exact-head `Plugin NPM Release`-uitvoering; vereist voor een echte publicatie van de `extended-stable`-kern
- `npm_dist_tag`: npm-doeltag voor het publicatietraject; accepteert `alpha`, `beta`, `latest` of `extended-stable` en gebruikt standaard `beta`. Definitieve patch `33` en later moeten `extended-stable` gebruiken; standaard weigert `extended-stable` eerdere patches en deze weigert altijd niet-definitieve tags.
- `bypass_extended_stable_guard`: booleaanse waarde alleen voor tests, standaard `false`; met `npm_dist_tag=extended-stable` wordt de maandelijkse geschiktheid voor uitgebreid stabiel omzeild, terwijl controles van release-identiteit, artefact, goedkeuring en teruglezing behouden blijven.

`Plugin NPM Release` accepteert `npm_dist_tag=default` voor bestaand releasegedrag
of `npm_dist_tag=extended-stable` voor het beveiligde maandelijkse traject. De
optie uitgebreid stabiel vereist `publish_scope=all-publishable`, een lege
`plugins`-invoer, een definitieve patch op of boven `33` en de canonieke
`extended-stable/YYYY.M.33`-branch op de exacte top. Deze verplaatst nooit Plugin-
`latest` of `beta`. Nieuwe pakketversies ontvangen `extended-stable` atomair
via vertrouwde OIDC-publicatie (`npm publish --tag extended-stable`); deze
bronworkflow gebruikt geen tokengeauthenticeerde `npm dist-tag add`. Nieuwe pogingen
slaan exacte versies over die al in npm aanwezig zijn en worden vervolgens gesloten bij fouten, tenzij volledige
teruglezing bevestigt dat elk exact pakket en elke `extended-stable`-tag is geconvergeerd.

`OpenClaw Release Publish` accepteert deze door de operator beheerde invoer:

- `tag`: vereiste releasetag; moet al bestaan
- `preflight_run_id`: id van een geslaagde `OpenClaw NPM Release`-voorcontrole-uitvoering; vereist wanneer `publish_openclaw_npm=true` of `plugin_publish_scope=all-publishable`
- `full_release_validation_run_id`: id van een geslaagde `Full Release Validation`-uitvoering; vereist wanneer `publish_openclaw_npm=true` of `plugin_publish_scope=all-publishable`
- `full_release_validation_run_attempt`: exacte positieve poging gekoppeld aan `full_release_validation_run_id`; vereist wanneer de uitvoerings-id wordt opgegeven
- `windows_node_tag`: exacte `openclaw/openclaw-windows-node`-releasetag die geen pre-release is; vereist voor stabiele OpenClaw-publicatie
- `windows_node_installer_digests`: door de kandidaat goedgekeurde compacte JSON-toewijzing van de huidige namen van Windows-installatieprogramma's aan hun vastgezette `sha256:`-digests; vereist voor stabiele OpenClaw-publicatie
- `npm_telegram_run_id`: optionele id van een geslaagde `NPM Telegram Beta E2E`-uitvoering om op te nemen in het definitieve releasebewijs
- `npm_dist_tag`: npm-doeltag voor het OpenClaw-pakket, een van `alpha`, `beta` of `latest`
- `plugin_publish_scope`: standaard `all-publishable`; gebruik `selected` alleen voor gericht herstelwerk uitsluitend voor Plugins met `publish_openclaw_npm=false`
- `plugins`: door komma's gescheiden `@openclaw/*`-pakketnamen wanneer `plugin_publish_scope=selected`
- `publish_openclaw_npm`: standaard `true`; stel `false` alleen in wanneer je de workflow gebruikt als orchestrator voor uitsluitend Plugin-herstel
- `release_profile`: releasedekkingsprofiel dat wordt gebruikt voor samenvattingen van releasebewijs; standaard `from-validation`, waarmee het uit het validatiemanifest wordt gelezen, of overschrijf dit met `beta`, `stable` of `full`
- `wait_for_clawhub`: standaard `false`, zodat de beschikbaarheid van npm niet wordt geblokkeerd door de ClawHub-sidecar; stel `true` alleen in wanneer voltooiing van de workflow ook voltooiing van ClawHub moet omvatten

`OpenClaw Release Checks` accepteert deze door de operator beheerde invoer:

- `ref`: branch, tag of volledige commit-SHA om te valideren. Controles die geheimen vereisen, vereisen dat de opgeloste commit bereikbaar is vanuit een OpenClaw-branch of releasetag.
- `run_release_soak`: schakel uitgebreide live-/E2E-controles, het Docker-releasepad en langdurige all-since-upgradeoverlevingstests in voor bètareleasecontroles. Dit wordt verplicht ingeschakeld door `release_profile=stable` en `release_profile=full`.

Regels:

- Reguliere definitieve en correctieversies onder patch `33` mogen naar `beta` of `latest` worden gepubliceerd. Definitieve versies met patch `33` of hoger moeten naar `extended-stable` worden gepubliceerd, en versies met een correctieachtervoegsel op die grens worden geweigerd.
- Bèta-prereleasetags mogen alleen naar `beta` worden gepubliceerd; alfa-prereleasetags mogen alleen naar `alpha` worden gepubliceerd
- Voor `OpenClaw NPM Release` is invoer van een volledige commit-SHA alleen toegestaan wanneer `preflight_only=true`
- `OpenClaw Release Checks` en `Full Release Validation` zijn altijd uitsluitend voor validatie
- Het daadwerkelijke publicatiepad moet dezelfde `npm_dist_tag` gebruiken als tijdens de preflight; de workflow verifieert die metadata voordat de publicatie doorgaat

## Reguliere releasevolgorde voor bèta/nieuwste stabiele versie

Deze verouderde volgorde is bedoeld voor de reguliere georkestreerde release die ook plugins, GitHub Release, Windows en werk voor andere platforms beheert. Dit is niet het maandelijkse npm-only uitgebreide-stabiele pad voor `.33+` dat bovenaan deze pagina wordt beschreven.

Bij het uitbrengen van een reguliere georkestreerde stabiele release:

1. Voer `OpenClaw NPM Release` uit met `preflight_only=true`. Voordat er een tag bestaat, kun je de huidige volledige commit-SHA van de workflowbranch gebruiken voor een validatie-only proefuitvoering van de preflightworkflow.
2. Kies `npm_dist_tag=beta` voor de normale bèta-eerst-stroom, of `latest` alleen wanneer je bewust rechtstreeks stabiel wilt publiceren.
3. Voer `Full Release Validation` uit op de releasebranch, releasetag of volledige commit-SHA wanneer je normale CI plus dekking voor live promptcache, Docker, QA Lab, Matrix en Telegram vanuit één handmatige workflow wilt. Als je bewust alleen de deterministische normale testgraaf nodig hebt, voer dan in plaats daarvan de handmatige workflow `CI` uit op de releaseref.
4. Selecteer exact de niet-prerelease `openclaw/openclaw-windows-node`-releasetag waarvan de ondertekende x64- en ARM64-installatieprogramma's moeten worden uitgebracht. Sla deze op als `windows_node_tag` en sla hun gevalideerde digest-toewijzing op als `windows_node_installer_digests`. De release-candidate-helper registreert beide en neemt ze op in de gegenereerde publicatieopdracht.
5. Sla de geslaagde `preflight_run_id`, `full_release_validation_run_id` en exacte `full_release_validation_run_attempt` op.
6. Voer `OpenClaw Release Publish` uit vanuit vertrouwde `main` met dezelfde `tag`, dezelfde `npm_dist_tag`, de geselecteerde `windows_node_tag`, de opgeslagen `windows_node_installer_digests` daarvan, de opgeslagen `preflight_run_id`, `full_release_validation_run_id` en `full_release_validation_run_attempt`. Hiermee worden geëxternaliseerde plugins naar npm en ClawHub gepubliceerd voordat het OpenClaw-npm-pakket wordt gepromoveerd.
7. Als de release op `beta` is terechtgekomen, gebruik dan de workflow `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` om die stabiele versie van `beta` naar `latest` te promoveren.
8. Als de release bewust rechtstreeks naar `latest` is gepubliceerd en `beta` onmiddellijk dezelfde stabiele build moet volgen, gebruik dan diezelfde releaseworkflow om beide dist-tags naar de stabiele versie te laten verwijzen, of laat de geplande zelfherstellende synchronisatie `beta` later verplaatsen.

De wijziging van de dist-tag bevindt zich in de release-ledger-repository omdat hiervoor nog steeds `NPM_TOKEN` vereist is, terwijl de bronrepository uitsluitend via OIDC publiceert. Daardoor blijven zowel het rechtstreekse publicatiepad als het bèta-eerst-promotiepad gedocumenteerd en zichtbaar voor operators.

Als een maintainer moet terugvallen op lokale npm-authenticatie, voer dan alle 1Password CLI-opdrachten (`op`) uitsluitend uit binnen een afzonderlijke tmux-sessie. Roep `op` niet rechtstreeks aan vanuit de hoofdshell van de agent; door dit binnen tmux te houden, blijven prompts, waarschuwingen en OTP-afhandeling waarneembaar en worden herhaalde hostwaarschuwingen voorkomen.

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

Maintainers gebruiken de besloten releasedocumentatie in [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) voor het daadwerkelijke draaiboek.

## Gerelateerd

- [Releasekanalen](/nl/install/development-channels)
