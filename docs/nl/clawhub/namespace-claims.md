---
read_when:
    - Een org, merk, pakket-scope, eigenaar-handle, skill-slug of pakket-namespace claimen
    - Een naamruimte oplossen die al is geclaimd of gereserveerd
    - Beslissen of u een melding, bezwaar of namespaceclaim gebruikt
sidebarTitle: Org and Namespace Claims
summary: Hoe u een ClawHub-beoordeling aanvraagt voor eigendomsgeschillen over organisaties, merken, eigenaarshandles, package-scopes, skill-slugs of naamruimten.
title: Organisatie- en naamruimteclaims
x-i18n:
    generated_at: "2026-07-03T15:34:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Claims op organisaties en naamruimten

ClawHub gebruikt owner-handles, org-handles, skill-slugs, Plugin-pakketnamen en
pakket-scopes als openbare naamruimten. Als een naamruimte lijkt toe te behoren
aan een echt project, merk, pakketecosysteem of organisatie, maar al is
geclaimd, gereserveerd, misleidend is of wordt betwist op ClawHub, vraag dan het
team om deze te beoordelen met het
[issueformulier voor organisatie- / naamruimteclaims](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gebruik dit pad voor openbare, niet-gevoelige eigendomsbeoordeling. Gebruik geen
productinterne meldingen of het beroepsformulier voor accounts voor
naamruimteclaims.

## Wanneer je een claim opent

Open een naamruimteclaim wanneer je vindt dat het ClawHub-team moet beoordelen
of een naamruimte moet worden gereserveerd, overgedragen, hernoemd, verborgen,
in quarantaine geplaatst, van een alias voorzien of anderszins gewijzigd vanwege
eigendom in de echte wereld.

Voorbeelden zijn:

- een org-handle die overeenkomt met je GitHub-org, project, bedrijf of community
- een pakket-scope zoals `@example-org/*` die alleen mag publiceren onder de
  overeenkomende ClawHub-owner
- een skill-slug of Plugin-pakketnaam die een project lijkt na te bootsen
- een geschil over een merk, handelsmerk, projecthernoeming of pakketgeschiedenis
- een verwijderde, inactieve of onbereikbare owner die de rechtmatige
  naamruimte-eigenaar blokkeert

Als de vermelding onveilig, kwaadaardig of misleidend is buiten het
eigendomsgeschil om, volg dan ook de relevante moderatie- of beveiligingsrichtlijn.
Het formulier voor naamruimteclaims is bedoeld voor eigendomsbeoordeling, niet
voor het melden van noodkwetsbaarheden.

## Voordat je indient

Controleer eerst of je publiceert met de owner die overeenkomt met de
naamruimte. Voor Plugin-pakketten moeten scoped namen zoals
`@example-org/example-plugin` worden gepubliceerd als de overeenkomende
`example-org`-owner.

Als je de huidige owner kunt beheren, herstel de naamruimte dan rechtstreeks door
de betrokken resource te publiceren, hernoemen, overdragen, verbergen of
verwijderen. Gebruik een claim wanneer je de huidige owner niet kunt beheren of
wanneer het team een geschil moet oplossen.

## Bewijs om op te nemen

Gebruik openbaar, niet-gevoelig bewijs. Nuttig bewijs omvat:

- GitHub-org, repo, release of maintainer-geschiedenis
- officiële projectdocumentatie waarin de naamruimte wordt genoemd
- bewijs van domein of officieel e-maildomein
- controle over npm-, PyPI-, crates.io- of andere pakketregister-scopes
- bewijs van eigendom van handelsmerk, merk of project dat veilig openbaar kan
  worden besproken
- geschiedenis van bronrepository, pakketgeschiedenis of openbare
  hernoemingsberichten
- links naar de betwiste ClawHub-owner, skill, Plugin, pakket of issue

Leg uit wat elke link bewijst. Het team moet de relatie kunnen begrijpen zonder
privéreferenties of geheimen nodig te hebben.

## Wat je niet moet opnemen

Plaats geen geheimen of privébewijs in een openbaar GitHub-issue. Neem niet op:

- API-tokens, ondertekeningssleutels of referenties
- DNS-challenge-tokens
- privéjuridische bestanden of contracten
- persoonlijke identiteitsdocumenten
- privé-e-mails, privébeveiligingsrapporten of vertrouwelijke klantgegevens

Het claimformulier vraagt of gevoelig bewijs een privékanaal met het team nodig
heeft. Gebruik die optie in plaats van gevoelig materiaal openbaar te plaatsen.

## Mogelijke uitkomsten

Afhankelijk van het bewijs en het risico kan het ClawHub-team een naamruimte
reserveren, eigendom overdragen, een resource hernoemen, een bestaande vermelding
verbergen of in quarantaine plaatsen, een alias of omleiding toevoegen, om meer
bewijs vragen of het verzoek afwijzen.

Naamruimtebeoordeling garandeert niet dat elke overeenkomende naam wordt
overgedragen. Het team weegt openbaar bewijs, bestaand gebruik,
beveiligingsrisico en gebruikersimpact af.

## Gerelateerde documentatie

- [Publiceren](/nl/clawhub/publishing)
- [Probleemoplossing](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderatie en accountveiligheid](/nl/clawhub/moderation)
- [Beveiliging](/nl/clawhub/security)
