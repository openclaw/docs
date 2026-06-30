---
read_when:
    - Een organisatie, merk, package-scope, eigenaars-handle, skill-slug of package-namespace claimen
    - Een namespace oplossen die al is geclaimd of gereserveerd
    - Beslissen of je een rapport, bezwaar of namespaceclaim gebruikt
sidebarTitle: Org and Namespace Claims
summary: Hoe u ClawHub-review aanvraagt voor geschillen over eigendom van organisatie, merk, owner-handle, pakket-scope, skill-slug of namespace.
title: Organisatie- en namespaceclaims
x-i18n:
    generated_at: "2026-06-30T22:23:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Organisatie- en naamruimteclaims

ClawHub gebruikt eigenaar-handles, organisatie-handles, skill-slugs, Plugin-pakketnamen en
pakket-scopes als openbare naamruimten. Als een naamruimte lijkt toe te behoren
aan een echt project, merk, pakketecosysteem of organisatie maar al is
geclaimd, gereserveerd, misleidend of betwist op ClawHub, vraag dan medewerkers
om deze te beoordelen met het
[formulier voor organisatie-/naamruimteclaims](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gebruik dit pad voor openbare, niet-gevoelige eigendomsbeoordeling. Gebruik geen
rapporten in het product of het formulier voor accountbezwaar voor naamruimteclaims.

## Wanneer je een claim opent

Open een naamruimteclaim wanneer je vindt dat ClawHub-medewerkers moeten beoordelen of een
naamruimte moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, gealiast
of anderszins gewijzigd vanwege eigendom in de echte wereld.

Voorbeelden zijn:

- een organisatie-handle die overeenkomt met je GitHub-organisatie, project, bedrijf of community
- een pakket-scope zoals `@example-org/*` die alleen mag publiceren onder de
  overeenkomende ClawHub-eigenaar
- een skill-slug of Plugin-pakketnaam die een project lijkt te imiteren
- een geschil over een merk, handelsmerk, projecthernoeming of pakketgeschiedenis
- een verwijderde, inactieve of onbereikbare eigenaar die de rechtmatige
  naamruimte-eigenaar blokkeert

Als de vermelding onveilig, kwaadwillig of misleidend is buiten het eigendomsgeschil,
volg dan ook de relevante moderatie- of beveiligingsrichtlijnen. Het formulier voor naamruimteclaims
is bedoeld voor eigendomsbeoordeling, niet voor noodmeldingen van kwetsbaarheden.

## Voordat je indient

Bevestig eerst dat je publiceert met de eigenaar die overeenkomt met de naamruimte.
Voor Plugin-pakketten moeten scoped namen zoals `@example-org/example-plugin` worden
gepubliceerd als de overeenkomende eigenaar `example-org`.

Als je de huidige eigenaar kunt beheren, herstel de naamruimte dan rechtstreeks door de getroffen resource
te publiceren, hernoemen, overdragen, verbergen of verwijderen. Gebruik een claim
wanneer je de huidige eigenaar niet kunt beheren of wanneer medewerkers een
geschil moeten oplossen.

## Bewijs om toe te voegen

Gebruik openbaar, niet-gevoelig bewijs. Nuttig bewijs omvat:

- GitHub-organisatie-, repo-, release- of maintainergeschiedenis
- officiële projectdocumentatie die de naamruimte noemt
- bewijs via domein of officieel e-maildomein
- controle over npm-, PyPI-, crates.io- of andere pakketregister-scopes
- bewijs van handelsmerk-, merk- of projecteigendom dat veilig openbaar kan worden besproken
- bronrepositorygeschiedenis, pakketgeschiedenis of openbare hernoemingsmeldingen
- links naar de betwiste ClawHub-eigenaar, skill, Plugin, pakket of issue

Leg uit wat elke link bewijst. Medewerkers moeten de relatie kunnen begrijpen
zonder privéreferenties of geheimen nodig te hebben.

## Wat je niet moet toevoegen

Plaats geen geheimen of privébewijs in een openbaar GitHub-issue. Voeg niet toe:

- API-tokens, ondertekeningssleutels of referenties
- DNS-challengetokens
- privéjuridische bestanden of contracten
- persoonlijke identiteitsdocumenten
- privé-e-mails, privébeveiligingsrapporten of vertrouwelijke klantgegevens

Het claimformulier vraagt of gevoelig bewijs een privémedewerkerskanaal nodig heeft.
Gebruik die optie in plaats van gevoelig materiaal openbaar te plaatsen.

## Mogelijke uitkomsten

Afhankelijk van het bewijs en het risico kunnen ClawHub-medewerkers een naamruimte reserveren,
eigendom overdragen, een resource hernoemen, een bestaande vermelding verbergen of in quarantaine plaatsen,
een alias of redirect toevoegen, om meer bewijs vragen of het verzoek afwijzen.

Naamruimtebeoordeling garandeert niet dat elke overeenkomende naam wordt overgedragen.
Medewerkers wegen openbaar bewijs, bestaand gebruik, beveiligingsrisico en gebruikersimpact af.

## Gerelateerde documentatie

- [Publiceren](/nl/clawhub/publishing)
- [Probleemoplossing](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderatie en accountveiligheid](/clawhub/moderation)
- [Beveiliging](/clawhub/security)
