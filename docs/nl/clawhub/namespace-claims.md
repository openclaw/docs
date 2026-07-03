---
read_when:
    - Een org, merk, package-scope, owner-handle, skill-slug of package-namespace claimen
    - Een namespace oplossen die al is geclaimd of gereserveerd
    - Beslissen of je een melding, beroep of namespaceclaim gebruikt
sidebarTitle: Org and Namespace Claims
summary: Hoe je een ClawHub-beoordeling aanvraagt voor eigendomsgeschillen over organisatie, merk, owner-handle, package-scope, skill-slug of naamruimte.
title: Organisatie- en namespaceclaims
x-i18n:
    generated_at: "2026-07-03T02:51:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Organisatie- en namespaceclaims

ClawHub gebruikt eigenaar-handles, organisatie-handles, skill-slugs, Plugin-pakketnamen en
pakket-scopes als publieke namespaces. Als een namespace lijkt toe te behoren aan een
project, merk, pakkettecosysteem of organisatie in de echte wereld, maar al is
geclaimd, gereserveerd, misleidend is of op ClawHub wordt betwist, vraag dan medewerkers om deze te beoordelen
met het
[issueformulier voor organisatie-/namespaceclaims](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gebruik dit pad voor publieke, niet-gevoelige eigendomsbeoordeling. Gebruik geen in-product
meldingen of het bezwaarformulier voor accounts voor namespaceclaims.

## Wanneer je een claim opent

Open een namespaceclaim wanneer je vindt dat ClawHub-medewerkers moeten beoordelen of een
namespace moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, gealiast
of anderszins gewijzigd vanwege eigendom in de echte wereld.

Voorbeelden zijn:

- een organisatie-handle die overeenkomt met je GitHub-organisatie, project, bedrijf of community
- een pakket-scope zoals `@example-org/*` die alleen mag publiceren onder de
  overeenkomende ClawHub-eigenaar
- een skill-slug of Plugin-pakketnaam die een project lijkt te imiteren
- een geschil over een merk, handelsmerk, projecthernoeming of pakketgeschiedenis
- een verwijderde, inactieve of onbereikbare eigenaar die de rechtmatige namespace-
  eigenaar blokkeert

Als de vermelding onveilig, kwaadaardig of misleidend is buiten het eigendomsgeschil om,
volg dan ook de relevante moderatie- of beveiligingsrichtlijnen. Het namespaceclaim-
formulier is bedoeld voor eigendomsbeoordeling, niet voor noodmelding van kwetsbaarheden.

## Voordat je indient

Controleer eerst of je publiceert met de eigenaar die overeenkomt met de namespace.
Voor Plugin-pakketten moeten scoped namen zoals `@example-org/example-plugin` worden
gepubliceerd als de overeenkomende eigenaar `example-org`.

Als je de huidige eigenaar kunt beheren, los de namespace dan rechtstreeks op door de betreffende bron te publiceren,
te hernoemen, over te dragen, te verbergen of te verwijderen. Gebruik een claim
wanneer je de huidige eigenaar niet kunt beheren of wanneer medewerkers een
geschil moeten oplossen.

## Bewijs om toe te voegen

Gebruik publiek, niet-gevoelig bewijs. Nuttig bewijs omvat:

- GitHub-organisatie-, repository-, release- of maintainergeschiedenis
- officiële projectdocumentatie die de namespace noemt
- bewijs van een domein of officieel e-maildomein
- beheer over npm-, PyPI-, crates.io- of andere pakketregister-scopes
- bewijs van handelsmerk-, merk- of projecteigendom dat veilig openbaar kan worden besproken
- bronrepositorygeschiedenis, pakketgeschiedenis of openbare hernoemingsberichten
- links naar de betwiste ClawHub-eigenaar, skill, Plugin, pakket of issue

Leg uit wat elke link bewijst. Medewerkers moeten de relatie kunnen begrijpen
zonder privéreferenties of geheimen nodig te hebben.

## Wat je niet moet toevoegen

Plaats geen geheimen of privébewijs in een publiek GitHub-issue. Voeg niet toe:

- API-tokens, ondertekeningssleutels of referenties
- DNS-challenge-tokens
- privé juridische bestanden of contracten
- persoonlijke identiteitsdocumenten
- privé-e-mails, privébeveiligingsrapporten of vertrouwelijke klantgegevens

Het claimformulier vraagt of gevoelig bewijs een privémedewerkerskanaal nodig heeft.
Gebruik die optie in plaats van gevoelig materiaal openbaar te plaatsen.

## Mogelijke uitkomsten

Afhankelijk van het bewijs en het risico kunnen ClawHub-medewerkers een namespace reserveren,
eigendom overdragen, een bron hernoemen, een bestaande vermelding verbergen of in quarantaine plaatsen,
een alias of omleiding toevoegen, om meer bewijs vragen of het verzoek afwijzen.

Namespacebeoordeling garandeert niet dat elke overeenkomende naam wordt overgedragen.
Medewerkers wegen publiek bewijs, bestaand gebruik, beveiligingsrisico en gebruikersimpact af.

## Gerelateerde documentatie

- [Publiceren](/nl/clawhub/publishing)
- [Probleemoplossing](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderatie en accountveiligheid](/clawhub/moderation)
- [Beveiliging](/clawhub/security)
