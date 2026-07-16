---
read_when:
    - Een organisatie, merk, pakketbereik, eigenaarshandle, skill-slug of pakketnaamruimte claimen
    - Een namespace oplossen die al geclaimd of gereserveerd is
    - Bepalen of je een melding, bezwaar of namespaceclaim moet gebruiken
sidebarTitle: Org and Namespace Claims
summary: Hoe je ClawHub-beoordeling aanvraagt voor geschillen over eigendom van organisaties, merken, eigenaarsnamen, pakketbereiken, skill-slugs of naamruimten.
title: Organisatie- en naamruimteclaims
x-i18n:
    generated_at: "2026-07-16T15:31:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Claims voor organisaties en naamruimten

ClawHub gebruikt eigenaarshandles, organisatiehandles, skill-slugs, namen van Plugin-pakketten en
pakketscopes als openbare naamruimten. Als een naamruimte bij een
bestaand project, merk, pakketecosysteem of een bestaande organisatie lijkt te horen, maar al
geclaimd of gereserveerd is, misleidend is of ter discussie staat op ClawHub, vraag het personeel dan om deze te beoordelen
via het
[issueformulier voor een organisatie-/naamruimteclaim](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gebruik deze route voor openbare, niet-gevoelige beoordeling van eigendom. Gebruik geen rapportages
in het product of het bezwaarformulier voor accounts voor naamruimteclaims.

## Wanneer je een claim opent

Open een naamruimteclaim als je vindt dat ClawHub-personeel moet beoordelen of een
naamruimte moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, van een alias voorzien
of anderszins gewijzigd vanwege eigendom in de echte wereld.

Voorbeelden zijn:

- een organisatiehandle die overeenkomt met jouw GitHub-organisatie, project, bedrijf of community
- een pakketscope zoals `@example-org/*` waar alleen onder de
  overeenkomende ClawHub-eigenaar naar mag worden gepubliceerd
- een skill-slug of naam van een Plugin-pakket die zich lijkt voor te doen als een project
- een geschil over een merk, handelsmerk, projecthernoeming of pakketgeschiedenis
- een verwijderde, inactieve of onbereikbare eigenaar die de rechtmatige eigenaar van de
  naamruimte blokkeert

Als de vermelding onveilig, schadelijk of misleidend is, los van het eigendomsgeschil,
volg dan ook de relevante richtlijnen voor moderatie of beveiliging. Het formulier voor
naamruimteclaims is bedoeld voor beoordeling van eigendom, niet voor het met spoed melden van kwetsbaarheden.

## Voordat je een claim indient

Bevestig eerst dat je publiceert met de eigenaar die overeenkomt met de naamruimte.
Voor Plugin-pakketten moeten gescopete namen zoals `@example-org/example-plugin` worden
gepubliceerd als de overeenkomende eigenaar `example-org`.

Als je de huidige eigenaar kunt beheren, corrigeer de naamruimte dan rechtstreeks door de betreffende
resource te publiceren, hernoemen, overdragen, verbergen of verwijderen. Gebruik een claim
wanneer je de huidige eigenaar niet kunt beheren of wanneer personeel een
geschil moet oplossen.

## Bewijs om op te nemen

Gebruik openbaar, niet-gevoelig bewijs. Nuttig bewijs omvat:

- geschiedenis van de GitHub-organisatie, repository, releases of beheerders
- officiële projectdocumentatie waarin de naamruimte wordt genoemd
- bewijs via een domein of officieel e-maildomein
- beheer over een scope in npm, PyPI, crates.io of een ander pakketregister
- bewijs van eigendom van een handelsmerk, merk of project dat veilig openbaar kan worden
  besproken
- geschiedenis van de bronrepository, pakketgeschiedenis of openbare kennisgevingen van hernoemingen
- links naar de betwiste ClawHub-eigenaar, skill, Plugin, het pakket of issue

Leg uit wat elke link bewijst. Het personeel moet de
relatie kunnen begrijpen zonder privé-inloggegevens of geheimen nodig te hebben.

## Wat je niet moet opnemen

Plaats geen geheimen of privébewijs in een openbaar GitHub-issue. Neem het volgende niet op:

- API-tokens, ondertekeningssleutels of inloggegevens
- DNS-challengetokens
- privé juridische bestanden of contracten
- persoonlijke identiteitsdocumenten
- privé-e-mails, privébeveiligingsrapporten of vertrouwelijke klantgegevens

Het claimformulier vraagt of gevoelig bewijs via een privékanaal voor personeel moet worden gedeeld.
Gebruik die optie in plaats van gevoelig materiaal openbaar te plaatsen.

## Mogelijke uitkomsten

Afhankelijk van het bewijs en het risico kan ClawHub-personeel een naamruimte reserveren,
het eigendom overdragen, een resource hernoemen, een bestaande vermelding verbergen of in quarantaine plaatsen,
een alias of omleiding toevoegen, om meer bewijs vragen of het verzoek afwijzen.

Een beoordeling van een naamruimte garandeert niet dat elke overeenkomende naam wordt overgedragen.
Het personeel weegt openbaar bewijs, bestaand gebruik, beveiligingsrisico's en gevolgen voor gebruikers af.

## Gerelateerde documentatie

- [Publiceren](/nl/clawhub/publishing)
- [Probleemoplossing](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderatie en accountveiligheid](/clawhub/moderation)
- [Beveiliging](/clawhub/security)
