---
doc-schema-version: 1
read_when:
    - Je wilt OpenClaw-plugins van derden vinden
    - Je wilt je eigen Plugin op ClawHub publiceren of laten vermelden
summary: Door de community onderhouden OpenClaw-plugins vinden en publiceren
title: Community-plugins
x-i18n:
    generated_at: "2026-06-27T17:53:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ecf059fa0c32f09d09381b2153a6a63ca522d49719aaa8476209389a6b5b36a
    source_path: plugins/community.md
    workflow: 16
---

Community-plugins zijn pakketten van derden die OpenClaw uitbreiden met kanalen,
hulpmiddelen, providers, hooks of andere mogelijkheden. Gebruik [ClawHub](/nl/clawhub) als het
primaire ontdekkingsovervlak voor openbare community-plugins.

## Plugins vinden

Doorzoek ClawHub vanuit de CLI:

```bash
openclaw plugins search "calendar"
```

Installeer een ClawHub-plugin met een expliciet bronvoorvoegsel:

```bash
openclaw plugins install clawhub:<package-name>
```

npm blijft een ondersteund direct-installatiepad tijdens de lanceringsovergang:

```bash
openclaw plugins install npm:<package-name>
```

Gebruik [Plugins beheren](/nl/plugins/manage-plugins) voor gangbare voorbeelden voor installeren, bijwerken,
inspecteren en verwijderen. Gebruik [`openclaw plugins`](/nl/cli/plugins) voor de
volledige commandoreferentie en regels voor bronselectie.

## Plugins publiceren

Publiceer openbare community-plugins op ClawHub wanneer je wilt dat OpenClaw-gebruikers ze
kunnen ontdekken en installeren. ClawHub beheert de live pakketvermelding, releasegeschiedenis,
scanstatus en installatietips; de docs onderhouden geen statische
catalogus van plugins van derden.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Controleer vóór publicatie of de plugin pakketmetadata, een pluginmanifest,
installatiedocumentatie en een duidelijke onderhoudseigenaar heeft. ClawHub valideert eigenaarsbereik,
pakketnaam, versie, bestandslimieten en bronmetadata voordat het een
release maakt, en houdt nieuwe releases daarna verborgen voor normale installatie- en downloadoppervlakken
totdat review en verificatie zijn afgerond.

Gebruik deze checklist voordat je publiceert:

| Vereiste             | Waarom                                             |
| -------------------- | --------------------------------------------------- |
| Gepubliceerd op ClawHub | Gebruikers hebben `openclaw plugins install`-tips nodig |
| Openbare GitHub-repo | Bronreview, issue-tracking, transparantie          |
| Setup- en gebruiksdocs | Gebruikers moeten weten hoe ze het configureren    |
| Actief onderhoud     | Recente updates of responsieve issue-afhandeling   |

Gebruik deze pagina's voor het volledige publicatiecontract:

- [ClawHub-publicatie](/nl/clawhub/publishing) legt eigenaars, scopes, releases,
  review, pakketvalidatie en pakketoverdracht uit.
- [Plugins bouwen](/nl/plugins/building-plugins) toont de vorm van het pluginpakket
  en de workflow voor de eerste publicatie.
- [Pluginmanifest](/nl/plugins/manifest) definieert native pluginmanifestvelden.

## Gerelateerd

- [Plugins](/nl/tools/plugin) - installeren, configureren, opnieuw starten en problemen oplossen
- [Plugins beheren](/nl/plugins/manage-plugins) - commandovoorbeelden
- [ClawHub-publicatie](/nl/clawhub/publishing) - publicatie- en releaseregels
