---
read_when:
    - Een organisatie, merk, pakket-scope, eigenaars-handle, skill-slug of pakket-namespace claimen
    - Een naamruimte oplossen die al is geclaimd of gereserveerd
    - Beslissen of je een melding, bezwaar of namespaceclaim gebruikt
sidebarTitle: Org and Namespace Claims
summary: Hoe je ClawHub-review aanvraagt voor geschillen over eigendom van een organisatie, merk, eigenaar-handle, package-scope, skill-slug of namespace.
title: Organisatie- en namespaceclaims
x-i18n:
    generated_at: "2026-06-27T17:16:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Organisatie- en namespaceclaims

ClawHub gebruikt owner-handles, organisatie-handles, Skills-slugs, pluginpakketnamen en
pakket-scopes als openbare namespaces. Als een namespace lijkt toe te behoren aan een
project, merk, pakketecosysteem of organisatie in de echte wereld, maar al
geclaimd, gereserveerd, misleidend of betwist is op ClawHub, vraag medewerkers dan om deze te beoordelen
met het
[issueformulier voor organisatie- / namespaceclaims](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gebruik deze route voor openbare, niet-gevoelige beoordeling van eigendom. Gebruik geen rapporten in het product
of het formulier voor accountbezwaar voor namespaceclaims.

## Wanneer je een claim opent

Open een namespaceclaim wanneer je vindt dat ClawHub-medewerkers moeten beoordelen of een
namespace moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, gealiast
of anderszins gewijzigd vanwege eigendom in de echte wereld.

Voorbeelden zijn:

- een organisatie-handle die overeenkomt met je GitHub-organisatie, project, bedrijf of community
- een pakket-scope zoals `@example-org/*` die alleen onder de
  overeenkomende ClawHub-owner mag publiceren
- een Skills-slug of pluginpakketnaam die een project lijkt te imiteren
- een geschil over een merk, handelsmerk, projecthernoeming of pakketgeschiedenis
- een verwijderde, inactieve of onbereikbare owner die de rechtmatige namespace-
  eigenaar blokkeert

Als de vermelding onveilig, kwaadaardig of misleidend is buiten het eigendomsgeschil,
volg dan ook de relevante moderatie- of beveiligingsrichtlijnen. Het formulier voor namespaceclaims
is bedoeld voor eigendomsbeoordeling, niet voor noodmelding van kwetsbaarheden.

## Voordat je indient

Bevestig eerst dat je publiceert met de owner die overeenkomt met de namespace.
Voor pluginpakketten moeten scoped namen zoals `@example-org/example-plugin` worden
gepubliceerd als de overeenkomende `example-org`-owner.

Als je de huidige owner kunt beheren, herstel de namespace dan rechtstreeks door de betrokken resource te publiceren,
hernoemen, over te dragen, te verbergen of te verwijderen. Gebruik een claim
wanneer je de huidige owner niet kunt beheren of wanneer medewerkers een
geschil moeten oplossen.

## Bewijs om toe te voegen

Gebruik openbaar, niet-gevoelig bewijs. Nuttig bewijs omvat:

- GitHub-organisatie, repo, release of maintainergeschiedenis
- officiële projectdocumentatie die de namespace noemt
- bewijs van domein of officieel e-maildomein
- beheer over een npm-, PyPI-, crates.io- of andere pakketregistry-scope
- bewijs van eigendom van handelsmerk, merk of project dat veilig openbaar kan worden besproken
- geschiedenis van bronrepository, pakketgeschiedenis of openbare meldingen van hernoeming
- links naar de betwiste ClawHub-owner, Skills, plugin, pakket of issue

Leg uit wat elke link bewijst. Medewerkers moeten de
relatie kunnen begrijpen zonder privéreferenties of secrets nodig te hebben.

## Wat je niet moet toevoegen

Plaats geen secrets of privébewijs in een openbaar GitHub-issue. Voeg niet toe:

- API-tokens, ondertekeningssleutels of referenties
- DNS-challengetokens
- privéjuridische bestanden of contracten
- persoonlijke identiteitsdocumenten
- privé-e-mails, privébeveiligingsrapporten of vertrouwelijke klantgegevens

Het claimformulier vraagt of gevoelig bewijs een privékanaal met medewerkers nodig heeft.
Gebruik die optie in plaats van gevoelig materiaal openbaar te plaatsen.

## Mogelijke uitkomsten

Afhankelijk van het bewijs en het risico kunnen ClawHub-medewerkers een namespace reserveren,
eigendom overdragen, een resource hernoemen, een bestaande vermelding verbergen of in quarantaine plaatsen,
een alias of redirect toevoegen, om meer bewijs vragen of het verzoek afwijzen.

Namespacebeoordeling garandeert niet dat elke overeenkomende naam wordt overgedragen.
Medewerkers wegen openbaar bewijs, bestaand gebruik, beveiligingsrisico en gebruikersimpact af.

## Gerelateerde documentatie

- [Publiceren](/nl/clawhub/publishing)
- [Probleemoplossing](/nl/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderatie en accountveiligheid](/nl/clawhub/moderation)
- [Beveiliging](/nl/clawhub/security)
