---
doc-schema-version: 1
read_when:
    - U wilt OpenClaw-plugins van derden vinden
    - Je wilt je eigen plugin op ClawHub publiceren of vermelden
summary: Vind en publiceer door de community onderhouden OpenClaw-plugins
title: Communityplugins
x-i18n:
    generated_at: "2026-07-12T09:08:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a9eb477f20da8171a35c22ea6b112d77ff4afe0878f60314c052746aef4e0ac
    source_path: plugins/community.md
    workflow: 16
---

Communityplugins zijn pakketten van derden die OpenClaw uitbreiden met
kanalen, tools, providers, hooks of andere mogelijkheden. Gebruik
[ClawHub](/clawhub) als de belangrijkste plek om openbare communityplugins
te vinden.

## Plugins vinden

Doorzoek ClawHub via de CLI:

```bash
openclaw plugins search "calendar"
```

Installeer een ClawHub-Plugin met een expliciet bronvoorvoegsel:

```bash
openclaw plugins install clawhub:<package-name>
```

npm blijft tijdens de overgang bij de introductie een ondersteunde optie voor rechtstreekse installatie:

```bash
openclaw plugins install npm:<package-name>
```

Gebruik [Plugins beheren](/nl/plugins/manage-plugins) voor veelgebruikte voorbeelden
voor installatie, updates, inspectie en verwijdering. Gebruik
[`openclaw plugins`](/nl/cli/plugins) voor de volledige opdrachtreferentie en regels
voor bronselectie.

## Plugins publiceren

Publiceer openbare communityplugins op ClawHub, zodat OpenClaw-gebruikers ze
kunnen vinden en installeren. ClawHub beheert de actuele pakketvermelding,
releasegeschiedenis, scanstatus en installatie-instructies; de documentatie
onderhoudt geen statische catalogus met Plugins van derden.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Zorg vóór publicatie dat de Plugin pakketmetadata, een Plugin-manifest,
installatiedocumentatie en een duidelijk aangewezen onderhoudsverantwoordelijke
heeft. ClawHub valideert vóór het maken van een release het eigenaarsbereik,
de pakketnaam, versie, bestandslimieten en bronmetadata. Vervolgens blijven
nieuwe releases verborgen op de gebruikelijke installatie- en downloadlocaties
totdat de beoordeling en verificatie zijn voltooid.

Controlelijst vóór publicatie:

| Vereiste                  | Waarom                                                    |
| ------------------------- | --------------------------------------------------------- |
| Gepubliceerd op ClawHub   | Gebruikers hebben werkende aanwijzingen voor `openclaw plugins install` nodig |
| Openbare GitHub-repository | Bronbeoordeling, probleemregistratie en transparantie      |
| Installatie- en gebruiksdocumentatie | Gebruikers moeten weten hoe ze de Plugin configureren |
| Actief onderhoud          | Recente updates of snelle afhandeling van problemen       |

Volledige publicatieovereenkomst:

- [Publiceren op ClawHub](/nl/clawhub/publishing) - eigenaren, bereiken, releases,
  beoordeling, pakketvalidatie en pakketoverdracht
- [Plugins bouwen](/nl/plugins/building-plugins) - de structuur van het Plugin-pakket
  en de workflow voor de eerste publicatie
- [Plugin-manifest](/nl/plugins/manifest) - velden van het systeemeigen Plugin-manifest

## Gerelateerd

- [Plugins](/nl/tools/plugin) - installeren, configureren, opnieuw starten en problemen oplossen
- [Plugins beheren](/nl/plugins/manage-plugins) - opdrachtvoorbeelden
- [Publiceren op ClawHub](/nl/clawhub/publishing) - regels voor publicaties en releases
