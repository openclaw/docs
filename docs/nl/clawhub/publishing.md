---
read_when:
    - Een skill of Plugin publiceren
    - Fouten met eigenaar- of pakketbereik opsporen
    - Gebruikersinterface voor publiceren, CLI of backendgedrag toevoegen
summary: Hoe publiceren via ClawHub werkt voor Skills, plugins, eigenaars, scopes, releases en beoordeling.
x-i18n:
    generated_at: "2026-05-10T19:26:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 61de013f0ac82acbf20f99c3e0c92c8e31d3de14e9ee64f7bc7659d522747089
    source_path: clawhub/publishing.md
    workflow: 16
---

# Publiceren

Publiceren op ClawHub is gebonden aan een eigenaar: elke publicatie is gericht op een uitgever en de server bepaalt of de aangemelde gebruiker daar mag publiceren.

## Eigenaren

Een eigenaar is een ClawHub-uitgevershandle, zoals `@alice` of `@openclaw`. Persoonlijke eigenaren worden voor gebruikers aangemaakt. Organisatie-eigenaren kunnen meerdere leden hebben.

Wanneer je publiceert, gebruik je je persoonlijke eigenaar of kies je een organisatie-eigenaar waarvoor je publicatierechten hebt.

## Skills

Skills worden gepubliceerd vanuit een skillmap. De openbare pagina is:

```text
https://clawhub.ai/<owner>/<slug>
```

Voorbeeld:

```text
https://clawhub.ai/alice/review-helper
```

Het publicatieverzoek bevat de geselecteerde eigenaar, slug, versie, changelog en bestanden. De server controleert of de actor als die eigenaar mag publiceren voordat de release wordt aangemaakt.

Om een bestaande skill tijdens het publiceren van een nieuwe versie naar een andere eigenaar te verplaatsen, kies je de nieuwe eigenaar en bevestig je expliciet de eigendomsoverdracht. Geef in de CLI/API de doeleigenaar plus de opt-in voor migratie door:

```sh
clawhub skill publish ./review-helper --owner openclaw --migrate-owner --version 1.2.0
```

Migratie van een skill-eigenaar vereist beheerderstoegang of eigenaarstoegang bij zowel de huidige eigenaar als de bestemmingseigenaar. De skill, versiegeschiedenis, statistieken, opmerkingen, forks, aliassen en audittrail blijven behouden; oude eigenaar-URL's blijven werken via het alias-/omleidingspad.

## Plugins

Plugins gebruiken npm-achtige pakketnamen. Namen van scoped pakketten bevatten de eigenaar in het eerste deel van de naam:

```text
@owner/package-name
```

De scope moet overeenkomen met de geselecteerde publicatie-eigenaar. Als je pakket `@openclaw/dronzer` heet, kan het alleen als `@openclaw` worden gepubliceerd. Als je als `@vintageayu` publiceert, hernoem het pakket dan naar `@vintageayu/dronzer`.

Dit voorkomt dat een pakket een organisatienaamruimte claimt waarover de uitgever geen controle heeft.

## Releaseproces

1. De UI, CLI of GitHub-workflow verzamelt pakketmetadata en bestanden.
2. Het publicatieverzoek wordt met de geselecteerde eigenaar naar ClawHub gestuurd.
3. De server valideert eigenaarsrechten, pakketscope, pakketnaam, versie, bestandslimieten en bronmetadata.
4. ClawHub slaat de release op en start geautomatiseerde beveiligingscontroles.
5. Nieuwe releases worden verborgen voor normale installatie-/downloadoppervlakken totdat beoordeling en verificatie zijn afgerond.

Als validatie mislukt, wordt de release niet aangemaakt.

## FAQ

### Pakketscope moet overeenkomen met geselecteerde eigenaar

Als de pakketscope en geselecteerde eigenaar niet overeenkomen, wijst ClawHub de publicatie af:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Om dit op te lossen, kies je de eigenaar die door de pakketscope wordt genoemd, of hernoem je het pakket zodat de scope overeenkomt met de eigenaar als wie je mag publiceren.

Als de pakketnaam al de juiste scope heeft maar het pakket eigendom is van de verkeerde uitgever, draag dan in plaats daarvan het eigendom over:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Gebruik pakketoverdracht alleen wanneer je beheerderstoegang hebt tot zowel de huidige pakketeigenaar als de bestemmingsuitgever. Hiermee kun je niet publiceren naar een scope die je niet kunt beheren.

Dit beschermt organisatienaamruimten. Een pakket met de naam `@openclaw/dronzer` claimt de naamruimte `@openclaw`, dus alleen uitgevers met toegang tot de eigenaar `@openclaw` kunnen het publiceren.
