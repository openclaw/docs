---
read_when:
    - Een org, merk, pakket-scope, eigenaarshandle, skill-slug of pakket-namespace claimen
    - Een namespace oplossen die al is geclaimd of gereserveerd
    - Beslissen of je een melding, bezwaar of namespace-claim gebruikt
sidebarTitle: Org and Namespace Claims
summary: Hoe u een ClawHub-beoordeling aanvraagt voor eigendomsgeschillen over org, merk, owner-handle, package-scope, skill-slug of naamruimte.
title: Organisatie- en namespaceclaims
x-i18n:
    generated_at: "2026-07-03T09:45:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Organisatie- en naamruimteclaims

ClawHub gebruikt eigenaarhandles, organisatiehandles, skill-slugs, pluginpakketnamen en
pakket-scopes als openbare naamruimten. Als een naamruimte lijkt te horen bij een
project, merk, pakketecosysteem of organisatie in de echte wereld, maar al is
geclaimd, gereserveerd, misleidend is of wordt betwist op ClawHub, vraag medewerkers
om deze te beoordelen met het
[formulier voor organisatie- / naamruimteclaims](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gebruik dit pad voor openbare, niet-gevoelige eigendomsbeoordeling. Gebruik geen
meldingen in het product of het formulier voor accountbezwaar voor naamruimteclaims.

## Wanneer u een claim moet openen

Open een naamruimteclaim wanneer u vindt dat ClawHub-medewerkers moeten beoordelen of een
naamruimte moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, gealiast
of anderszins gewijzigd vanwege eigendom in de echte wereld.

Voorbeelden zijn:

- een organisatiehandle die overeenkomt met uw GitHub-organisatie, project, bedrijf of community
- een pakket-scope zoals `@example-org/*` die alleen mag publiceren onder de
  overeenkomende ClawHub-eigenaar
- een skill-slug of pluginpakketnaam die een project lijkt na te bootsen
- een geschil over een merk, handelsmerk, projecthernoeming of pakketgeschiedenis
- een verwijderde, inactieve of onbereikbare eigenaar die de rechtmatige eigenaar van de naamruimte
  blokkeert

Als de vermelding onveilig, kwaadaardig of misleidend is buiten het eigendomsgeschil,
volg dan ook de relevante moderatie- of beveiligingsrichtlijnen. Het formulier voor naamruimteclaims
is bedoeld voor eigendomsbeoordeling, niet voor noodmeldingen van kwetsbaarheden.

## Voordat u indient

Bevestig eerst dat u publiceert met de eigenaar die overeenkomt met de naamruimte.
Voor pluginpakketten moeten scoped namen zoals `@example-org/example-plugin` worden
gepubliceerd als de overeenkomende eigenaar `example-org`.

Als u de huidige eigenaar kunt beheren, los de naamruimte dan rechtstreeks op door de betrokken resource
te publiceren, te hernoemen, over te dragen, te verbergen of te verwijderen. Gebruik een claim
wanneer u de huidige eigenaar niet kunt beheren of wanneer medewerkers een
geschil moeten oplossen.

## Bewijs om op te nemen

Gebruik openbaar, niet-gevoelig bewijs. Nuttig bewijs omvat:

- GitHub-organisatie-, repository-, release- of maintainergeschiedenis
- officiële projectdocumentatie die de naamruimte noemt
- domeinbewijs of bewijs van een officieel e-maildomein
- beheer over een npm-, PyPI-, crates.io- of andere pakketregister-scope
- bewijs van handelsmerk-, merk- of projecteigendom dat veilig openbaar kan worden besproken
- bronrepositorygeschiedenis, pakketgeschiedenis of openbare hernoemingsberichten
- links naar de betwiste ClawHub-eigenaar, skill, plugin, pakket of issue

Leg uit wat elke link bewijst. Medewerkers moeten de
relatie kunnen begrijpen zonder privéreferenties of geheimen nodig te hebben.

## Wat u niet moet opnemen

Plaats geen geheimen of privébewijs in een openbaar GitHub-issue. Neem niet op:

- API-tokens, ondertekeningssleutels of referenties
- DNS-challenge-tokens
- privéjuridische bestanden of contracten
- persoonlijke identiteitsdocumenten
- privé-e-mails, privébeveiligingsrapporten of vertrouwelijke klantgegevens

Het claimformulier vraagt of gevoelig bewijs een privékanaal met medewerkers nodig heeft.
Gebruik die optie in plaats van gevoelig materiaal openbaar te plaatsen.

## Mogelijke uitkomsten

Afhankelijk van het bewijs en het risico kunnen ClawHub-medewerkers een naamruimte reserveren,
eigendom overdragen, een resource hernoemen, een bestaande vermelding verbergen of in quarantaine plaatsen,
een alias of omleiding toevoegen, om meer bewijs vragen of het verzoek afwijzen.

Naamruimtebeoordeling garandeert niet dat elke overeenkomende naam wordt overgedragen.
Medewerkers wegen openbaar bewijs, bestaand gebruik, beveiligingsrisico en gebruikersimpact af.

## Gerelateerde documentatie

- [Publiceren](/nl/clawhub/publishing)
- [Probleemoplossing](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderatie en accountveiligheid](/clawhub/moderation)
- [Beveiliging](/clawhub/security)
