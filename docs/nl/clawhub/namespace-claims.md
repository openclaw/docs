---
read_when:
    - Een organisatie, merk, pakket-scope, owner-handle, skill-slug of pakket-namespace claimen
    - Een naamruimte oplossen die al is geclaimd of gereserveerd
    - Beslissen of u een melding, beroep of namespace-claim gebruikt
sidebarTitle: Org and Namespace Claims
summary: Hoe je ClawHub-review aanvraagt voor geschillen over eigendom van organisatie, merk, eigenaar-handle, pakket-scope, skill-slug of namespace.
title: Organisatie- en naamruimteclaims
x-i18n:
    generated_at: "2026-06-28T00:11:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Organisatie- en naamruimteclaims

ClawHub gebruikt eigenaars-handles, organisatie-handles, Skills-slugs, Plugin-pakketnamen en
pakket-scopes als openbare naamruimten. Als een naamruimte lijkt toe te behoren aan een
project, merk, pakketecosysteem of organisatie uit de echte wereld, maar al is
geclaimd, gereserveerd, misleidend of betwist op ClawHub, vraag dan medewerkers om deze te beoordelen
met het
[issueformulier voor organisatie-/naamruimteclaims](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gebruik dit pad voor openbare, niet-gevoelige eigendomsbeoordeling. Gebruik geen in-product
meldingen of het formulier voor accountbezwaar voor naamruimteclaims.

## Wanneer u een claim opent

Open een naamruimteclaim wanneer u vindt dat ClawHub-medewerkers moeten beoordelen of een
naamruimte moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, gealiast
of anderszins gewijzigd vanwege eigendom in de echte wereld.

Voorbeelden zijn:

- een organisatie-handle die overeenkomt met uw GitHub-organisatie, project, bedrijf of community
- een pakket-scope zoals `@example-org/*` die alleen mag publiceren onder de
  overeenkomende ClawHub-eigenaar
- een Skills-slug of Plugin-pakketnaam die een project lijkt na te bootsen
- een geschil over een merk, handelsmerk, projecthernoeming of pakketgeschiedenis
- een verwijderde, inactieve of onbereikbare eigenaar die de rechtmatige naamruimte-
  eigenaar blokkeert

Als de vermelding onveilig, kwaadaardig of misleidend is buiten het eigendomsgeschil,
volg dan ook de relevante moderatie- of beveiligingsrichtlijnen. Het naamruimteclaim-
formulier is bedoeld voor eigendomsbeoordeling, niet voor noodmelding van kwetsbaarheden.

## Voordat u indient

Bevestig eerst dat u publiceert met de eigenaar die overeenkomt met de naamruimte.
Voor Plugin-pakketten moeten scoped namen zoals `@example-org/example-plugin` worden
gepubliceerd als de overeenkomende eigenaar `example-org`.

Als u de huidige eigenaar kunt beheren, los de naamruimte dan rechtstreeks op door de getroffen resource te publiceren,
hernoemen, overdragen, verbergen of verwijderen. Gebruik een claim
wanneer u de huidige eigenaar niet kunt beheren of wanneer medewerkers een
geschil moeten oplossen.

## Bewijs om op te nemen

Gebruik openbaar, niet-gevoelig bewijs. Nuttig bewijs omvat:

- GitHub-organisatie, repo, release of maintainergeschiedenis
- officiële projectdocumentatie die de naamruimte noemt
- domein- of officieel e-maildomeinbewijs
- beheer over npm-, PyPI-, crates.io- of andere pakketregister-scopes
- bewijs van handelsmerk-, merk- of projecteigendom dat veilig openbaar kan worden besproken
- bronrepositorygeschiedenis, pakketgeschiedenis of openbare kennisgevingen van hernoeming
- links naar de betwiste ClawHub-eigenaar, Skills, Plugin, pakket of issue

Leg uit wat elke link bewijst. Medewerkers moeten de
relatie kunnen begrijpen zonder privéreferenties of geheimen nodig te hebben.

## Wat u niet moet opnemen

Plaats geen geheimen of privébewijs in een openbaar GitHub-issue. Neem niet op:

- API-tokens, ondertekeningssleutels of referenties
- DNS-challengetokens
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
Medewerkers wegen openbaar bewijs, bestaand gebruik, beveiligingsrisico en impact op gebruikers af.

## Gerelateerde documentatie

- [Publiceren](/nl/clawhub/publishing)
- [Probleemoplossing](/nl/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderatie en accountveiligheid](/nl/clawhub/moderation)
- [Beveiliging](/nl/clawhub/security)
