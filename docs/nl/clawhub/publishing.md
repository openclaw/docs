---
read_when:
    - Een Skill of Plugin publiceren
    - Fouten met eigenaar- of pakketbereik debuggen
    - Publicatie-UI, CLI of backendgedrag toevoegen
summary: Hoe ClawHub-publicatie werkt voor Skills, Plugins, eigenaren, scopes, releases en beoordeling.
x-i18n:
    generated_at: "2026-06-27T17:17:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# Publiceren

Publiceren stuurt een skillmap of pluginpackage naar ClawHub onder de eigenaar die je
kiest. ClawHub controleert of je token voor die eigenaar mag publiceren, valideert de
metadata, naam, versie, bestanden en broninformatie, slaat daarna de release op
en start geautomatiseerde beveiligingscontroles.

Als validatie mislukt, wordt er niets gepubliceerd. Nieuwe releases kunnen ook buiten
normale installatie- en downloadoppervlakken blijven totdat de review is afgerond.

## Skills

Het eenvoudigste publicatiepad is de CLI. Meld je aan en publiceer daarna een lokale skillmap:

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

Gebruik `--owner <handle>` wanneer je publiceert naar een organisatie-eigenaar. Laat dit weg om te publiceren als
de geauthenticeerde gebruiker. Publiceren slaat ongewijzigde inhoud over. Een nieuwe skill begint
bij `1.0.0`, en latere wijzigingen publiceren automatisch de volgende patchversie. Geef
`--version` alleen door wanneer je een expliciete versie nodig hebt.

Gebruik voor catalogusrepositories de herbruikbare
[`skill-publish.yml`-workflow](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml) van ClawHub.
Deze roept `skill publish` aan voor elke directe skillmap onder `root` (standaard:
`skills`), of alleen de map die als `skill_path` is opgegeven.

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

Gebruik `dry_run: true` om nieuwe en gewijzigde Skills te bekijken zonder te publiceren.

## Plugins

Plugins gebruiken package-namen in npm-stijl. Scoped package-namen bevatten de eigenaar in
het eerste deel van de naam:

```text
@owner/package-name
```

De scope moet overeenkomen met de geselecteerde publicatie-eigenaar. Als je package
`@openclaw/dronzer` heet, kan het alleen worden gepubliceerd als `@openclaw`. Als je publiceert als
`@vintageayu`, hernoem het package dan naar `@vintageayu/dronzer`.

Dit voorkomt dat een package een organisatienamespace claimt waarover de uitgever
geen controle heeft.

Als je de rechtmatige eigenaar bent van een organisatie, merk, package-scope, eigenaarshandle of
namespace die al is geclaimd of gereserveerd op ClawHub, open dan een
[Org-/namespaceclaim-issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
met openbaar, niet-gevoelig bewijs. Zie
[Organisatie- en namespaceclaims](/nl/clawhub/namespace-claims) voor wat je moet opnemen en wat je
buiten openbare issues moet houden.

### Voordat je een Plugin publiceert

- Kies een eigenaar die overeenkomt met de package-scope.
- Voeg `openclaw.plugin.json` toe. Codeplugins hebben ook `package.json` nodig met
  `openclaw.compat.pluginApi` en `openclaw.build.openclawVersion`.
- Voeg `icon` toe aan `openclaw.plugin.json` met
  een willekeurige HTTPS-afbeeldings-URL om een aangepast pluginkaartpictogram te tonen.
- Voeg de bronrepository en exacte commitmetadata toe, of gebruik de CLI vanuit een
  checkout met GitHub-backend zodat deze ze kan detecteren.
- Voer `clawhub package validate <source>` uit voordat je publiceert. Zie voor package-,
  manifest-, SDK-import- of artifactbevindingen
  [Oplossingen voor Plugin-validatie](/nl/clawhub/plugin-validation-fixes).
- Voer `clawhub package publish <source> --dry-run` uit voordat je een release maakt.
- Verwacht dat nieuwe releases buiten openbare installatieoppervlakken blijven totdat geautomatiseerde
  beveiligingscontroles en verificatie zijn afgerond.

### Trusted publishing voor packages

Trusted publishing voor packages is een setup in twee stappen:

1. Publiceer het package één keer via normale handmatige of tokengeauthenticeerde
   `clawhub package publish`. Hiermee wordt de packageregel gemaakt en worden de
   packagemanagers vastgesteld die de trusted publisher-configuratie kunnen wijzigen.
2. Een packagemanager stelt de trusted publisher-configuratie voor GitHub Actions in:

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

Nadat de configuratie is ingesteld, kunnen toekomstige ondersteunde GitHub Actions-publicaties
OIDC/trusted publishing gebruiken zonder een langlevend ClawHub-token in de
repository op te slaan. De geconfigureerde repository en workflowbestandsnaam moeten overeenkomen met de
GitHub Actions OIDC-claim. Als je ook `--environment <name>` doorgeeft, moet de GitHub
Actions-omgevingsclaim exact overeenkomen met die naam.

ClawHub verifieert de geconfigureerde GitHub-repository wanneer de trusted publisher-configuratie
wordt ingesteld. Openbare repositories kunnen worden geverifieerd via openbare GitHub-metadata.
Privérepositories vereisen dat ClawHub GitHub-toegang heeft tot die repository,
bijvoorbeeld via een toekomstige installatie van de ClawHub GitHub App of een andere
geautoriseerde GitHub-integratie.

De huidige herbruikbare package-publicatieworkflow ondersteunt secretless trusted
publishing voor `workflow_dispatch`-publicaties wanneer `id-token: write`
beschikbaar is. Echte tag-push-publicaties hebben nog steeds `clawhub_token` nodig, dus houd
`CLAWHUB_TOKEN` beschikbaar voor tagreleases, eerste publicaties, onvertrouwde packages
of noodpublicaties.

Inspecteer of verwijder de configuratie met:

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

Het verwijderen van de trusted publisher-configuratie is het rollbackpad. Het schakelt het minten van toekomstige
trusted publish-tokens uit totdat een packagemanager de configuratie opnieuw instelt.

## FAQ

### Package-scope moet overeenkomen met geselecteerde eigenaar

Als de package-scope en geselecteerde eigenaar niet overeenkomen, wijst ClawHub de
publicatie af:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Om dit op te lossen, kies je de eigenaar die door de package-scope wordt genoemd, of hernoem je het
package zodat de scope overeenkomt met de eigenaar waarmee je mag publiceren.

Als de package-naam al de juiste scope heeft maar het package eigendom is van de
verkeerde uitgever, draag dan in plaats daarvan het eigendom over:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Gebruik package- of skilloverdracht alleen wanneer je beheerderstoegang hebt tot zowel de
huidige eigenaar als de doeluitgever. Package-overdracht laat je niet
publiceren naar een scope die je niet kunt beheren.

Als je geen toegang hebt tot de huidige eigenaar maar gelooft dat jouw organisatie, project of
merk de rechtmatige namespace-eigenaar is, open dan een
[Org-/namespaceclaim-issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
met openbaar, niet-gevoelig bewijs voor review door medewerkers. Zie
[Organisatie- en namespaceclaims](/nl/clawhub/namespace-claims) voordat je dit indient.

Dit beschermt organisatienamespaces. Een package met de naam `@openclaw/dronzer` claimt de
`@openclaw`-namespace, dus alleen uitgevers met toegang tot de `@openclaw`-eigenaar
kunnen het publiceren.
