---
read_when:
    - Een skill of plugin publiceren
    - Fouten met eigenaar- of pakketbereik opsporen
    - Gedrag voor de publicatie-UI, CLI of backend toevoegen
summary: Hoe publiceren op ClawHub werkt voor Skills, plugins, eigenaren, scopes, releases en beoordelingen.
x-i18n:
    generated_at: "2026-07-12T08:39:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# Publiceren

Bij publiceren wordt een skillmap of Plugin-pakket naar ClawHub verzonden onder de eigenaar die u kiest. ClawHub controleert of uw token voor die eigenaar mag publiceren, valideert de metagegevens, naam, versie, bestanden en broninformatie, slaat vervolgens de release op en start geautomatiseerde beveiligingscontroles.

Als de validatie mislukt, wordt er niets gepubliceerd. Nieuwe releases kunnen ook buiten de normale installatie- en downloadmogelijkheden blijven totdat de beoordeling is afgerond.

## Skills

De eenvoudigste manier om te publiceren is via de CLI. Meld u aan en publiceer vervolgens een lokale skillmap:

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

Gebruik `--owner <handle>` wanneer u onder een organisatie-eigenaar publiceert. Laat dit weg om als de geauthenticeerde gebruiker te publiceren. Bij het publiceren wordt ongewijzigde inhoud overgeslagen. Een nieuwe skill begint bij `1.0.0` en bij latere wijzigingen wordt automatisch de volgende patchversie gepubliceerd. Geef `--version` alleen door wanneer u een expliciete versie nodig hebt.

Gebruik voor catalogusrepository's de herbruikbare
[`skill-publish.yml`-workflow](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml) van ClawHub.
Deze roept `skill publish` aan voor elke directe skillmap onder `root` (standaard:
`skills`), of alleen voor de map die als `skill_path` is opgegeven.

```yaml
jobs:
  publish:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      owner: <owner>
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Gebruik `dry_run: true` om een voorbeeld van nieuwe en gewijzigde skills te bekijken zonder ze te publiceren.

## Plugins

Plugins gebruiken pakketnamen in npm-stijl. Pakketnamen met een bereik bevatten de eigenaar in het eerste deel van de naam:

```text
@owner/package-name
```

Het bereik moet overeenkomen met de geselecteerde publicatie-eigenaar. Als uw pakket `@openclaw/dronzer` heet, kan het alleen als `@openclaw` worden gepubliceerd. Als u als `@vintageayu` publiceert, hernoemt u het pakket naar `@vintageayu/dronzer`.

Dit voorkomt dat een pakket aanspraak maakt op de naamruimte van een organisatie waarover de uitgever geen beheer heeft.

Als u de rechtmatige eigenaar bent van een organisatie, merk, pakketbereik, eigenaarshandle of naamruimte die al op ClawHub is geclaimd of gereserveerd, opent u een
[issue voor het claimen van een organisatie of naamruimte](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
met openbaar, niet-gevoelig bewijs. Zie
[Claims voor organisaties en naamruimten](/clawhub/namespace-claims) voor wat u moet opnemen en wat u buiten openbare issues moet houden.

### Voordat u een Plugin publiceert

- Kies een eigenaar die overeenkomt met het pakketbereik.
- Neem `openclaw.plugin.json` op. Codeplugins hebben ook een `package.json` nodig met
  `openclaw.compat.pluginApi` en `openclaw.build.openclawVersion`.
- Om een aangepast pictogram op de Plugin-kaart weer te geven, voegt u `icon` toe aan `openclaw.plugin.json` met
  een willekeurige HTTPS-URL naar een afbeelding.
- Neem de bronrepository en metagegevens van de exacte commit op, of gebruik de CLI vanuit een
  checkout die door GitHub wordt ondersteund, zodat deze ze kan detecteren.
- Voer vóór het publiceren `clawhub package validate <source>` uit. Zie voor bevindingen over pakketten,
  manifests, SDK-imports of artefacten
  [Oplossingen voor Plugin-validatie](/clawhub/plugin-validation-fixes).
- Voer `clawhub package publish <source> --dry-run` uit voordat u een release maakt.
- Houd er rekening mee dat nieuwe releases buiten de openbare installatiemogelijkheden blijven totdat de geautomatiseerde
  beveiligingscontroles en verificatie zijn afgerond.

### Vertrouwd publiceren van pakketten

Vertrouwd publiceren van pakketten wordt in twee stappen ingesteld:

1. Publiceer het pakket eenmaal via de normale handmatige of met een token geauthenticeerde
   opdracht `clawhub package publish`. Hiermee wordt de pakketrij aangemaakt en worden de
   pakketbeheerders vastgesteld die de configuratie van de vertrouwde uitgever kunnen wijzigen.
2. Een pakketbeheerder stelt de configuratie voor de vertrouwde uitgever van GitHub Actions in:

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

Nadat de configuratie is ingesteld, kunnen toekomstige ondersteunde publicaties via GitHub Actions gebruikmaken van OIDC/vertrouwd publiceren zonder een langlevend ClawHub-token in de repository op te slaan. De geconfigureerde repository en workflowbestandsnaam moeten overeenkomen met de OIDC-claim van GitHub Actions. Als u ook `--environment <name>` doorgeeft, moet de omgevingsclaim van GitHub Actions exact overeenkomen met die naam.

ClawHub verifieert de geconfigureerde GitHub-repository wanneer de configuratie van de vertrouwde uitgever wordt ingesteld. Openbare repository's kunnen worden geverifieerd via openbare metagegevens van GitHub. Voor privérepository's moet ClawHub toegang tot die repository hebben via GitHub, bijvoorbeeld via een toekomstige installatie van de ClawHub GitHub App of een andere geautoriseerde GitHub-integratie.

De huidige herbruikbare workflow voor het publiceren van pakketten ondersteunt vertrouwd publiceren zonder geheimen voor publicaties via `workflow_dispatch` wanneer `id-token: write` beschikbaar is. Voor echte publicaties via een tagpush is `clawhub_token` nog steeds vereist. Houd `CLAWHUB_TOKEN` daarom beschikbaar voor tagreleases, eerste publicaties, niet-vertrouwde pakketten of noodpublicaties.

Bekijk of verwijder de configuratie met:

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

Het verwijderen van de configuratie van de vertrouwde uitgever is de terugvalprocedure. Hierdoor wordt de toekomstige uitgifte van tokens voor vertrouwd publiceren uitgeschakeld totdat een pakketbeheerder de configuratie opnieuw instelt.

## Veelgestelde vragen

### Pakketbereik moet overeenkomen met de geselecteerde eigenaar

Als het pakketbereik en de geselecteerde eigenaar niet overeenkomen, weigert ClawHub de publicatie:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Om dit op te lossen, kiest u de eigenaar die door het pakketbereik wordt genoemd, of hernoemt u het pakket zodat het bereik overeenkomt met de eigenaar waaronder u kunt publiceren.

Als de pakketnaam al het juiste bereik heeft, maar het pakket eigendom is van de verkeerde uitgever, draagt u in plaats daarvan het eigendom over:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Gebruik pakket- of skilloverdracht alleen wanneer u beheerderstoegang hebt tot zowel de huidige eigenaar als de bestemmingsuitgever. Met pakketoverdracht kunt u niet publiceren in een bereik dat u niet kunt beheren.

Als u geen toegang hebt tot de huidige eigenaar, maar denkt dat uw organisatie, project of merk de rechtmatige eigenaar van de naamruimte is, opent u een
[issue voor het claimen van een organisatie of naamruimte](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
met openbaar, niet-gevoelig bewijs ter beoordeling door medewerkers. Zie
[Claims voor organisaties en naamruimten](/clawhub/namespace-claims) voordat u het issue indient.

Dit beschermt naamruimten van organisaties. Een pakket met de naam `@openclaw/dronzer` maakt aanspraak op de naamruimte `@openclaw`, zodat alleen uitgevers met toegang tot de eigenaar `@openclaw` het kunnen publiceren.
