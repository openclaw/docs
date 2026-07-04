---
read_when:
    - Een org, merk, pakket-scope, eigenaarshandle, skill-slug of pakket-namespace claimen
    - Een naamruimte oplossen die al is geclaimd of gereserveerd
    - Beslissen of je een melding, bezwaar of namespaceclaim gebruikt
sidebarTitle: Org and Namespace Claims
summary: Hoe je ClawHub-beoordeling aanvraagt voor eigendomsgeschillen over org, merk, owner-handle, package-scope, skill-slug of namespace.
title: Organisatie- en namespaceclaims
x-i18n:
    generated_at: "2026-07-04T03:54:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Organisatie- en namespaceclaims

ClawHub gebruikt owner-handles, organisatiehandles, skill-slugs, pluginpakketnamen en
pakket-scopes als openbare namespaces. Als een namespace lijkt toe te behoren aan een
project, merk, pakketecosysteem of organisatie in de echte wereld, maar al is
geclaimd, gereserveerd, misleidend is of wordt betwist op ClawHub, vraag het personeel om deze te beoordelen
met het
[issueformulier voor organisatie- / namespaceclaim](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gebruik dit pad voor openbare, niet-gevoelige eigendomsbeoordeling. Gebruik geen in-product
rapportages of het formulier voor accountberoep voor namespaceclaims.

## Wanneer je een claim opent

Open een namespaceclaim wanneer je vindt dat ClawHub-personeel moet beoordelen of een
namespace moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, gealiast
of anderszins gewijzigd vanwege eigendom in de echte wereld.

Voorbeelden zijn:

- een organisatiehandle die overeenkomt met je GitHub-organisatie, project, bedrijf of community
- een pakket-scope zoals `@example-org/*` die alleen mag publiceren onder de
  overeenkomende ClawHub-owner
- een skill-slug of pluginpakketnaam die een project lijkt na te bootsen
- een geschil over een merk, handelsmerk, projecthernoeming of pakketgeschiedenis
- een verwijderde, inactieve of onbereikbare owner die de rechtmatige namespace-
  owner blokkeert

Als de vermelding onveilig, kwaadaardig of misleidend is buiten het eigendomsgeschil,
volg dan ook de relevante richtlijnen voor moderatie of beveiliging. Het formulier voor namespaceclaims
is bedoeld voor eigendomsbeoordeling, niet voor spoedmelding van kwetsbaarheden.

## Voordat je indient

Bevestig eerst dat je publiceert met de owner die overeenkomt met de namespace.
Voor pluginpakketten moeten scoped namen zoals `@example-org/example-plugin` worden
gepubliceerd als de overeenkomende `example-org`-owner.

Als je de huidige owner kunt beheren, los de namespace dan direct op door de getroffen resource te publiceren,
hernoemen, overdragen, verbergen of verwijderen. Gebruik een claim
wanneer je de huidige owner niet kunt beheren of wanneer personeel een
geschil moet oplossen.

## Bewijs om op te nemen

Gebruik openbaar, niet-gevoelig bewijs. Nuttig bewijs omvat:

- geschiedenis van GitHub-organisatie, repo, release of maintainer
- officiële projectdocumentatie die de namespace noemt
- bewijs van domein of officieel e-maildomein
- beheer over npm-, PyPI-, crates.io- of andere pakketregistryscopes
- bewijs van eigendom van handelsmerk, merk of project dat veilig openbaar kan worden besproken
- bronrepositorygeschiedenis, pakketgeschiedenis of openbare hernoemingsmeldingen
- links naar de betwiste ClawHub-owner, skill, plugin, pakket of issue

Leg uit wat elke link bewijst. Personeel moet de relatie kunnen begrijpen
zonder privé-inloggegevens of geheimen nodig te hebben.

## Wat je niet moet opnemen

Plaats geen geheimen of privébewijs in een openbaar GitHub-issue. Neem niet op:

- API-tokens, ondertekeningssleutels of inloggegevens
- DNS-challengetokens
- privé-juridische bestanden of contracten
- persoonlijke identiteitsdocumenten
- privé-e-mails, privébeveiligingsrapporten of vertrouwelijke klantgegevens

Het claimformulier vraagt of gevoelig bewijs een privé-personeelskanaal nodig heeft.
Gebruik die optie in plaats van gevoelig materiaal openbaar te plaatsen.

## Mogelijke uitkomsten

Afhankelijk van het bewijs en het risico kan ClawHub-personeel een namespace reserveren,
eigendom overdragen, een resource hernoemen, een bestaande vermelding verbergen of in quarantaine plaatsen,
een alias of omleiding toevoegen, om meer bewijs vragen of het verzoek afwijzen.

Namespacebeoordeling garandeert niet dat elke overeenkomende naam wordt overgedragen.
Personeel weegt openbaar bewijs, bestaand gebruik, beveiligingsrisico en impact op gebruikers af.

## Gerelateerde documentatie

- [Publiceren](/nl/clawhub/publishing)
- [Probleemoplossing](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderatie en accountveiligheid](/clawhub/moderation)
- [Beveiliging](/clawhub/security)
