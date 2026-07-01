---
read_when:
    - Een organisatie, merk, pakket-scope, eigenaarshandle, vaardigheidsslug of pakket-namespace claimen
    - Een namespace oplossen die al is geclaimd of gereserveerd
    - Bepalen of je een rapport, beroep of namespaceclaim gebruikt
sidebarTitle: Org and Namespace Claims
summary: Hoe u een ClawHub-beoordeling aanvraagt voor geschillen over eigendom van organisatie, merk, eigenaar-handle, pakket-scope, skill-slug of namespace.
title: Organisatie- en namespaceclaims
x-i18n:
    generated_at: "2026-07-01T08:13:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Organisatie- en naamruimteclaims

ClawHub gebruikt eigenaarhandles, organisatiehandles, skill-slugs, Plugin-pakketnamen en
pakket-scopes als openbare naamruimten. Als een naamruimte lijkt te horen bij een
echt project, merk, pakketecosysteem of organisatie, maar al is
geclaimd, gereserveerd, misleidend is of wordt betwist op ClawHub, vraag medewerkers om deze te beoordelen
met het
[formulier voor organisatie- / naamruimteclaimissues](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gebruik dit pad voor openbare, niet-gevoelige eigendomsbeoordeling. Gebruik geen in-product
meldingen of het bezwaarformulier voor accounts voor naamruimteclaims.

## Wanneer een claim te openen

Open een naamruimteclaim wanneer je vindt dat ClawHub-medewerkers moeten beoordelen of een
naamruimte moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, gealiast
of anderszins gewijzigd vanwege eigendom in de echte wereld.

Voorbeelden zijn:

- een organisatiehandle die overeenkomt met je GitHub-organisatie, project, bedrijf of community
- een pakket-scope zoals `@example-org/*` die alleen mag publiceren onder de
  overeenkomende ClawHub-eigenaar
- een skill-slug of Plugin-pakketnaam die een project lijkt na te bootsen
- een merk, handelsmerk, projecthernoeming of geschil over pakketgeschiedenis
- een verwijderde, inactieve of onbereikbare eigenaar die de rechtmatige naamruimte-
  eigenaar blokkeert

Als de vermelding onveilig, kwaadaardig of misleidend is buiten het eigendomsgeschil,
volg dan ook de relevante moderatie- of beveiligingsrichtlijnen. Het naamruimteclaim-
formulier is bedoeld voor eigendomsbeoordeling, niet voor noodmeldingen van kwetsbaarheden.

## Voordat je indient

Controleer eerst of je publiceert met de eigenaar die overeenkomt met de naamruimte.
Voor Plugin-pakketten moeten scoped namen zoals `@example-org/example-plugin` worden
gepubliceerd als de overeenkomende eigenaar `example-org`.

Als je de huidige eigenaar kunt beheren, los de naamruimte dan rechtstreeks op door de getroffen resource te publiceren,
hernoemen, overdragen, verbergen of verwijderen. Gebruik een claim
wanneer je de huidige eigenaar niet kunt beheren of wanneer medewerkers een
geschil moeten oplossen.

## Bewijs om op te nemen

Gebruik openbaar, niet-gevoelig bewijs. Nuttig bewijs omvat:

- GitHub-organisatie, repository, release of maintainergeschiedenis
- officiële projectdocumentatie die de naamruimte noemt
- bewijs van domein of officieel e-maildomein
- beheer over npm-, PyPI-, crates.io- of andere pakketregister-scopes
- handelsmerk-, merk- of projecteigendom-bewijs dat veilig openbaar kan worden besproken
- bronrepositorygeschiedenis, pakketgeschiedenis of openbare hernoemingsmeldingen
- links naar de betwiste ClawHub-eigenaar, skill, Plugin, pakket of issue

Leg uit wat elke link bewijst. Medewerkers moeten de relatie kunnen begrijpen
zonder privéreferenties of geheimen nodig te hebben.

## Wat niet op te nemen

Plaats geen geheimen of privébewijs in een openbaar GitHub-issue. Neem niet op:

- API-tokens, ondertekeningssleutels of referenties
- DNS-challenge-tokens
- privé juridische bestanden of contracten
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
