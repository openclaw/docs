---
read_when:
    - Een organisatie, merk, pakketscope, eigenaarshandle, skill-slug of pakketnamespace claimen
    - Een naamruimte oplossen die al is opgeëist of gereserveerd
    - Beslissen of u een melding, bezwaar of namespace-claim gebruikt
sidebarTitle: Org and Namespace Claims
summary: Hoe u ClawHub-beoordeling aanvraagt voor eigendomsgeschillen over organisatie, merk, owner-handle, package-scope, skill-slug of namespace.
title: Organisatie- en namespaceclaims
x-i18n:
    generated_at: "2026-07-04T15:23:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Organisatie- en naamruimteclaims

ClawHub gebruikt eigenaars-handles, organisatie-handles, skill-slugs, Plugin-pakketnamen en
pakket-scopes als openbare naamruimten. Als een naamruimte lijkt te horen bij een
project, merk, pakketecosysteem of organisatie uit de echte wereld, maar op
ClawHub al geclaimd, gereserveerd, misleidend of betwist is, vraag het personeel
om deze te beoordelen met het
[issueformulier voor organisatie-/naamruimteclaims](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gebruik dit pad voor openbare, niet-gevoelige eigendomsbeoordeling. Gebruik geen
rapportages in het product of het accountbezwaarformulier voor naamruimteclaims.

## Wanneer u een claim opent

Open een naamruimteclaim wanneer u vindt dat het personeel van ClawHub moet
beoordelen of een naamruimte moet worden gereserveerd, overgedragen, hernoemd,
verborgen, in quarantaine geplaatst, gealiast of anderszins gewijzigd vanwege
eigendom in de echte wereld.

Voorbeelden zijn:

- een organisatie-handle die overeenkomt met uw GitHub-organisatie, project, bedrijf of community
- een pakket-scope zoals `@example-org/*` die alleen onder de
  overeenkomende ClawHub-eigenaar mag publiceren
- een skill-slug of Plugin-pakketnaam die zich lijkt voor te doen als een project
- een merk, handelsmerk, projecthernoeming of geschil over pakketgeschiedenis
- een verwijderde, inactieve of onbereikbare eigenaar die de rechtmatige eigenaar
  van de naamruimte blokkeert

Als de vermelding onveilig, kwaadaardig of misleidend is buiten het
eigendomsconflict, volg dan ook de relevante moderatie- of beveiligingsrichtlijnen.
Het naamruimteclaimformulier is bedoeld voor eigendomsbeoordeling, niet voor
noodmeldingen van kwetsbaarheden.

## Voordat u indient

Controleer eerst of u publiceert met de eigenaar die overeenkomt met de naamruimte.
Voor Plugin-pakketten moeten scoped namen zoals `@example-org/example-plugin`
worden gepubliceerd als de overeenkomende eigenaar `example-org`.

Als u de huidige eigenaar kunt beheren, los de naamruimte dan rechtstreeks op door
de betrokken resource te publiceren, hernoemen, overdragen, verbergen of verwijderen.
Gebruik een claim wanneer u de huidige eigenaar niet kunt beheren of wanneer het
personeel een geschil moet oplossen.

## Bewijs om op te nemen

Gebruik openbaar, niet-gevoelig bewijs. Nuttig bewijs omvat:

- GitHub-organisatie-, repository-, release- of maintainergeschiedenis
- officiële projectdocumentatie die de naamruimte noemt
- domeinbewijs of bewijs van een officieel e-maildomein
- controle over npm-, PyPI-, crates.io- of andere pakketregister-scopes
- bewijs van handelsmerk-, merk- of projecteigendom dat veilig openbaar kan
  worden besproken
- bronrepositorygeschiedenis, pakketgeschiedenis of openbare hernoemingsberichten
- links naar de betwiste ClawHub-eigenaar, skill, Plugin, pakket of issue

Leg uit wat elke link bewijst. Het personeel moet de relatie kunnen begrijpen
zonder privéreferenties of geheimen nodig te hebben.

## Wat u niet moet opnemen

Plaats geen geheimen of privébewijs in een openbaar GitHub-issue. Neem geen
van het volgende op:

- API-tokens, ondertekeningssleutels of referenties
- DNS-challenge-tokens
- privéjuridische bestanden of contracten
- persoonlijke identiteitsdocumenten
- privé-e-mails, private beveiligingsrapporten of vertrouwelijke klantgegevens

Het claimformulier vraagt of gevoelig bewijs een privékanaal met het personeel
nodig heeft. Gebruik die optie in plaats van gevoelig materiaal openbaar te plaatsen.

## Mogelijke uitkomsten

Afhankelijk van het bewijs en het risico kan het personeel van ClawHub een
naamruimte reserveren, eigendom overdragen, een resource hernoemen, een bestaande
vermelding verbergen of in quarantaine plaatsen, een alias of omleiding toevoegen,
om meer bewijs vragen of het verzoek afwijzen.

Naamruimtebeoordeling garandeert niet dat elke overeenkomende naam wordt
overgedragen. Het personeel weegt openbaar bewijs, bestaand gebruik,
beveiligingsrisico en impact op gebruikers af.

## Gerelateerde documentatie

- [Publiceren](/nl/clawhub/publishing)
- [Probleemoplossing](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderatie en accountveiligheid](/clawhub/moderation)
- [Beveiliging](/clawhub/security)
